import i18n from "@/i18n";
import { supabase, isSupabaseConfigured, invalidateCache } from "./supabaseClient";

// Admin calls must keep the logged-in session. A separate anon client loses
// auth.uid(), which makes RLS/RPC treat admin actions like anonymous requests.
export const adminSupabase = supabase;

const completedProfileFilter = (query: any) =>
  query
    .eq("setup_complete", true)
    .or("photo_url.not.is.null,photo_urls.not.is.null");

const hasCompletedProfilePhoto = (profile: any) =>
  typeof profile?.photo_url === "string" && profile.photo_url.trim().length > 0
  || Array.isArray(profile?.photo_urls) && profile.photo_urls.length > 0;

/** Admin Dashboard Stats */
export async function fetchAdminStats() {
  if (!isSupabaseConfigured) return { users: 0, posts: 0, groups: 0, reports: 0 };
  // RPC 우선 시도, 실패 시 fallback
  const { data: rpc, error: rpcErr } = await adminSupabase.rpc("get_admin_dashboard_stats");
  if (!rpcErr && rpc?.[0]) {
    const r = rpc[0];
    return {
      users: Number(r.total_users) || 0,
      posts: Number(r.total_posts) || 0,
      groups: Number(r.total_groups) || 0,
      reports: Number(r.pending_reports) || 0,
      activeGroups: Number(r.active_groups) || 0,
      sosCheckins: Number(r.sos_checkins) || 0,
      pendingVerifications: Number(r.pending_verifications) || 0,
      totalMarketplace: Number(r.total_marketplace) || 0,
    };
  }
  // Fallback: 개별 쿼리
  const [uRes, pRes, gRes, rRes] = await Promise.all([
    completedProfileFilter(adminSupabase.from("profiles").select("id", { count: "exact", head: true })),
    adminSupabase.from("posts").select("id", { count: "exact", head: true }),
    adminSupabase.from("trip_groups").select("id", { count: "exact", head: true }),
    adminSupabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  return {
    users: uRes.count || 0,
    posts: pRes.count || 0,
    groups: gRes.count || 0,
    reports: rRes.count || 0,
  };
}

/** Admin Role Security Check — DB에서 실제 권한 검증 */
let _adminRoleCache: { result: boolean; ts: number } | null = null;
const ADMIN_CACHE_TTL_MS = 30_000; // 30초 캐시 (수정: 60→30, 권한 박탈 반영 속도 향상)

async function checkAdminRole(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  // 캐시 유효 시 재사용 (60초 이내)
  if (_adminRoleCache && Date.now() - _adminRoleCache.ts < ADMIN_CACHE_TTL_MS) {
    return _adminRoleCache.result;
  }

  // ⚠️ supabase (세션 있는 클라이언트) 사용 — adminSupabase는 persistSession:false라 getUser()가 항상 null
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    _adminRoleCache = { result: false, ts: Date.now() };
    return false;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin, role")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = !error && (data?.is_admin === true || data?.role === "admin");
  _adminRoleCache = { result: isAdmin, ts: Date.now() };
  return isAdmin;
}

/** USERS */
export async function fetchAdminUsers() {
  // SEC-4 fix: 어드민 권한 체크 추가 — 미인증 사용자의 유저 목록 유출 방지
  if (!isSupabaseConfigured || !(await checkAdminRole())) return [];
  const { data, error } = await adminSupabase
    .from("profiles")
    .select(`
      id, name, email, bio, photo_url, photo_urls, setup_complete, plan, is_plus, plus_expires_at,
      is_banned, banned, ban_reason, banned_until, verified, id_verified,
      created_at, nationality, location, role, is_admin, admin_note,
      age, gender, mbti, interests, languages, travel_style, budget_range,
      home_city, preferred_regions, travel_dates, travel_mission, visited_countries
    `)
    .not("name", "eq", "[Deleted User]")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) {
    console.error("fetchAdminUsers error:", error);
    throw new Error(error.message);
  }
  return (data || []).map((u: any) => ({
    ...u,
    banned: u.is_banned || u.banned || false,  // 양쪽 컬럼 지원
  }));
}
export async function updateUserValidation(userId: string, verified: boolean) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  // verified 와 id_verified 두 컬럼 모두 업데이트 (스키마 차이 대응)
  const { error } = await adminSupabase.from("profiles").update({
    verified,
    id_verified: verified,
    // 인증 승인 시 trust_score 기본값 설정 (이미 있으면 DB가 유지)
  }).eq("id", userId);
  if (!error && verified) {
    // 인증 승인 알림 발송
    const title = i18n.t("auto.t_id_verif_approved", "✅ 신분증 인증 승인");
    const content = i18n.t("auto.t_id_verif_approved_desc", "회원님의 신분증 인증이 승인되었습니다. 이제 인증 뱃지가 표시됩니다!");
    await adminSupabase.from("in_app_notifications").insert({
      user_id: userId,
      title: title,
      content: content,
      type: "system",
      read: false,
    });
    await sendPushViaEdgeFunction(userId, title, content, "system");
  }
  if (!error) {
    await logAdminAction(verified ? "verify_user" : "unverify_user", "user", userId, { verified });
  }
  return !error;
}
export async function updateUserPlan(userId: string, plan: 'free' | 'plus' | 'premium') {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const is_plus = plan === 'plus' || plan === 'premium';
  // plus/premium으로 변경 시 30일 만료일 설정, free 시 null 로 취소 모델링
  const plus_expires_at = is_plus
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : null;
  const { error } = await adminSupabase.from("profiles").update({
    plan,
    is_plus,
    plus_expires_at,
  }).eq("id", userId);
  if (!error) {
    await logAdminAction("update_plan", "user", userId, { plan });
  }
  return !error;
}
export async function updateUserPlus(userId: string, is_plus: boolean) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const plus_expires_at = is_plus
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : null;
  const { error } = await adminSupabase.from("profiles").update({
    is_plus,
    plan: is_plus ? 'plus' : 'free',
    plus_expires_at,
  }).eq("id", userId);
  if (!error) {
    await logAdminAction("update_plus", "user", userId, { is_plus });
  }
  return !error;
}
export async function updateUserBan(userId: string, banned: boolean) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  // banned / is_banned 두 컬럼 모두 업데이트 (스키마 차이 대응)
  const { error } = await adminSupabase.from("profiles").update({
    banned,
    is_banned: banned,
    ...(banned ? {} : { ban_reason: null, banned_until: null }),
  }).eq("id", userId);
  if (!error) {
    // ✅ MatchPage / MapPage 프로필 캐시 즉시 무효화 → 정지된 계정이 스와이프 카드에 노출되지 않도록
    invalidateCache('match:profiles:');
    invalidateCache('map:profiles:');

    // 계정정지/해제 알림 발송
    const title = banned ? i18n.t("auto.t_ban_notice", "🚫 계정 정지 안내") : i18n.t("auto.t_unban_notice", "✅ 계정 정지 해제");
    const content = banned
      ? i18n.t("auto.t_ban_desc", "커뮤니티 가이드라인 위반으로 계정이 정지되었습니다. 문의: support@migo.app")
      : i18n.t("auto.t_unban_desc", "계정 정지가 해제되었습니다. 다시 Migo를 이용하실 수 있습니다.");
    await adminSupabase.from("in_app_notifications").insert({
      user_id: userId,
      title,
      content,
      type: "system",
      read: false,
    });
    await sendPushViaEdgeFunction(userId, title, content, "system");
  }
  if (!error) {
    await logAdminAction(banned ? "ban_user" : "unban_user", "user", userId);
  }
  return !error;
}
export async function deleteUserAccount(userId: string) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  
  // 1. 퍼블릭 데이터 (profiles, matches, chats 등) 삭제
  const { error: dbError } = await adminSupabase.rpc("admin_delete_user_account", { p_user_id: userId });
  if (dbError) {
    console.error("deleteUserAccount DB error:", dbError);
    return false;
  }

  // SEC-1 fix: adminSupabase는 anon key 사용 — auth.admin.deleteUser()는 service_role key 필요
  // anon key로는 실패함. 실패 시 DB 데이터 삭제 대신 콘텐츠 없는 소프트 밴으로 폴백
  // (is_banned=true + email을 랜덤화하여 원천적으로 로그인 차단)
  const { error: authError } = await adminSupabase.auth.admin.deleteUser(userId);
  if (authError) {
    console.warn("[SEC-1] auth.admin.deleteUser() failed (anon key limitation) — applying soft-ban fallback:", authError.message);
    // 폴백: 이메일 랜덤화 + 영구 밴 (로그인 차단 효과)
    const randomSuffix = crypto.randomUUID().slice(0, 8);
    await adminSupabase.from('profiles').update({
      is_banned: true,
      banned: true,
      email: `deleted_${randomSuffix}@migo.deleted`,
      name: '[Deleted User]',
      photo_url: null,
      bio: null,
    }).eq('id', userId);
    // auth.admin.deleteUser 실패는 에러 아님 (알려진 한계) — DB 정리는 완료됨
    await logAdminAction("delete_user", "user", userId, { soft_ban: true });
    return true; // 소프트 밴으로 성공 처리
  }
  
  await logAdminAction("delete_user", "user", userId);
  return true;
}
export async function updateUserNote(userId: string, admin_note: string) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const { error } = await adminSupabase.rpc("admin_update_user_note", { p_user_id: userId, p_note: admin_note });
  if (error) {
    console.error("updateUserNote error:", error);
    return false;
  }
  await logAdminAction("update_user_note", "user", userId, { admin_note });
  return true;
}

/** POSTS */
export async function fetchAdminPosts() {
  // SEC-4 fix: 어드민 권한 체크 추가
  if (!isSupabaseConfigured || !(await checkAdminRole())) return [];
  const {
    data,
    error
  } = await adminSupabase.from("posts").select(`
      id, title, content, tags, image_url, created_at, hidden, pinned, author_id,
      profiles!posts_author_id_fkey(name, photo_url)
    `).order("created_at", {
    ascending: false
  }).limit(100);
  if (error) {
    // FK alias ??살첒 ??fallback
    const {
      data: d2,
      error: e2
    } = await adminSupabase.from("posts").select("id, title, content, tags, image_url, created_at, hidden, pinned, author_id").order("created_at", {
      ascending: false
    }).limit(100);
    if (e2) {
      console.error("fetchAdminPosts error:", e2);
      return [];
    }
    return (d2 || []).map((p: any) => ({
      ...p,
      authorName: i18n.t("auto.g_0331", "?곸벉"),
      authorPhoto: null
    }));
  }
  return (data || []).map((p: any) => ({
    ...p,
    authorName: (p.profiles as any)?.name || i18n.t("auto.g_0332", "?곸벉"),
    authorPhoto: (p.profiles as any)?.photo_url || null
  }));
}
export async function deletePost(postId: string) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const { error } = await adminSupabase.rpc("admin_delete_post", { p_post_id: postId });
  if (error) {
    console.error("deletePost error:", error);
    return false;
  }
  await logAdminAction("delete_post", "post", postId);
  return true;
}
export async function updatePostHidden(postId: string, hidden: boolean) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const { error } = await adminSupabase.rpc("admin_update_post_hidden", { p_post_id: postId, p_hidden: hidden });
  if (error) {
    console.error("updatePostHidden error:", error);
    return false;
  }
  await logAdminAction(hidden ? "hide_post" : "show_post", "post", postId, { hidden });
  return true;
}
export async function updatePostPinned(postId: string, pinned: boolean) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const { error } = await adminSupabase.rpc("admin_update_post_pinned", { p_post_id: postId, p_pinned: pinned });
  if (error) {
    console.error("updatePostPinned error:", error);
    return false;
  }
  await logAdminAction(pinned ? "pin_post" : "unpin_post", "post", postId, { pinned });
  return true;
}

/** GROUPS */
export async function fetchAdminGroups() {
  // SEC-4 fix: 어드민 권한 체크 추가
  if (!isSupabaseConfigured || !(await checkAdminRole())) return [];
  const {
    data,
    error
  } = await adminSupabase.from("trip_groups").select(`
      id, title, destination, max_members, is_premium, entry_fee,
      created_at, status, host_id,
      profiles:host_id(name),
      trip_group_members(id)
    `).order("created_at", {
    ascending: false
  }).limit(100);
  if (error) {
    // FK alias ??살첒 ??fallback
    const {
      data: d2,
      error: e2
    } = await adminSupabase.from("trip_groups").select("id, title, destination, max_members, is_premium, entry_fee, created_at, status, host_id").order("created_at", {
      ascending: false
    }).limit(100);
    if (e2) {
      console.error("fetchAdminGroups error:", e2);
      return [];
    }
    return (d2 || []).map((g: any) => ({
      ...g,
      hostName: i18n.t("auto.g_0333", "?곸벉"),
      memberCount: 0
    }));
  }
  return (data || []).map((g: any) => ({
    ...g,
    hostName: (g.profiles as any)?.name || i18n.t("auto.g_0334", "?곸벉"),
    memberCount: Array.isArray(g.trip_group_members) ? g.trip_group_members.length : 0
  }));
}
export async function deleteGroup(groupId: string) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const { error } = await adminSupabase.rpc("admin_delete_group", { p_group_id: groupId });
  if (error) {
    console.error("deleteGroup error:", error);
    return false;
  }
  await logAdminAction("delete_group", "group", groupId);
  return true;
}

/** REPORTS */
export async function fetchAdminReports() {
  // SEC-4 fix: 어드민 권한 체크 추가
  if (!isSupabaseConfigured || !(await checkAdminRole())) return [];
  const {
    data,
    error
  } = await supabase.from("reports").select("*, reporter:profiles!reports_reporter_id_fkey(name, photo_url)").order("created_at", {
    ascending: false
  });
  if (error) {
    // Fallback without join if FK alias isn't available
    const {
      data: data2,
      error: error2
    } = await supabase.from("reports").select("*, profiles!reports_reporter_id_fkey(name, photo_url)").order("created_at", {
      ascending: false
    });
    if (error2) {
      console.error("fetchAdminReports error:", error2);
      return [];
    }
    return (data2 || []).map((r: any) => ({
      ...r,
      reporterName: r.profiles?.name || i18n.t("auto.g_0335", "?곸벉"),
      reporterPhoto: r.profiles?.photo_url
    }));
  }
  return (data || []).map((r: any) => ({
    ...r,
    reporterName: r.reporter?.name || i18n.t("auto.g_0336", "?곸벉"),
    reporterPhoto: r.reporter?.photo_url
  }));
}
export async function updateReportStatus(reportId: string, status: "pending" | "resolved" | "dismissed") {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const {
    error
  } = await supabase.from("reports").update({
    status
  }).eq("id", reportId);
  if (!error) {
    await logAdminAction(`resolve_report_${status}`, "report", reportId, { status });
  }
  return !error;
}

/** ANNOUNCEMENTS */
export async function fetchAnnouncements() {
  // SEC-4 fix: 어드민 권한 체크 추가 — 미인증 사용자의 공지사항 목록 노출 방지
  if (!isSupabaseConfigured || !(await checkAdminRole())) return [];
  const {
    data,
    error
  } = await adminSupabase.from("announcements").select("*").order("created_at", {
    ascending: false
  }).limit(10);
  if (error) {
    console.error("fetchAnnouncements error:", error);
    return [];
  }
  return data || [];
}
export async function createAnnouncement(title: string, content: string, type: string = "info") {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return null;
  const {
    data,
    error
  } = await adminSupabase.from("announcements").insert({
    title,
    content,
    type,
    is_active: true
  }).select().single();
  if (error) {
    console.error("createAnnouncement error:", error);
    return null;
  }
  await logAdminAction("create_announcement", "announcement", data.id, { title, type });
  return data;
}
export async function deleteAnnouncement(id: string) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const {
    error
  } = await adminSupabase.from("announcements").delete().eq("id", id);
  if (!error) {
    await logAdminAction("delete_announcement", "announcement", id);
  }
  return !error;
}

/** PROMO CODES */
export async function fetchPromoCodes() {
  // SEC-4 fix: 어드민 권한 체크 추가 — 프로모션 코드 정보 유출 방지
  if (!isSupabaseConfigured || !(await checkAdminRole())) return [];
  const {
    data,
    error
  } = await adminSupabase.from("promo_codes").select("*").order("created_at", {
    ascending: false
  });
  if (error) {
    console.error("fetchPromoCodes error:", error);
    return [];
  }
  return data;
}
export async function createPromoCode(code: string, discount: string, max_limit: number = 100) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return null;
  const {
    data,
    error
  } = await adminSupabase.from("promo_codes").insert({
    code: code.toUpperCase(),
    discount,
    max_limit,
    expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
    is_active: true
  }).select().single();
  if (error) {
    console.error("createPromoCode error:", error);
    return null;
  }
  await logAdminAction("create_promo", "promo", data.id, { code, discount });
  return data;
}
export async function updatePromoCodeStatus(id: string, is_active: boolean) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const {
    error
  } = await adminSupabase.from("promo_codes").update({
    is_active
  }).eq("id", id);
  if (!error) {
    await logAdminAction(is_active ? "activate_promo" : "deactivate_promo", "promo", id);
  }
  return !error;
}
export async function deletePromoCode(id: string) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const {
    error
  } = await adminSupabase.from("promo_codes").delete().eq("id", id);
  if (!error) {
    await logAdminAction("delete_promo", "promo", id);
  }
  return !error;
}

/** 二쇨컙 ?듦퀎 (?좎?, 留ㅼ묶 洹몃９) 吏묎퀎 (理쒓렐 7?? */
export async function fetchWeeklyStats(): Promise<any[]> {
  // SEC-4 fix: 어드민 권한 체크 추가
  if (!(await checkAdminRole())) return Array.from({ length: 7 }).map((_, i) => ({ day: `${i + 1}d`, users: 0, matches: 0, revenue: 0 }));
  if (!isSupabaseConfigured) {
    return Array.from({
      length: 7
    }).map((_, i) => ({
      day: i18n.t("admin.daysAgo", {
        time: i + 1,
        defaultValue: `${i + 1}일전`
      }),
      users: 0,
      matches: 0,
      revenue: 0
    }));
  }
  const today = new Date();
  const days = Array.from({
    length: 7
  }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
  const {
    data: users
  } = await adminSupabase.from("profiles").select("created_at").gte("created_at", days[0]);
  const {
    data: groups
  } = await adminSupabase.from("trip_groups").select("created_at").gte("created_at", days[0]);
  const result = days.map(dayStr => {
    const dayLabel = [
      i18n.t("auto.g_0337", "일"),
      i18n.t("auto.g_0338", "월"),
      i18n.t("auto.g_0339", "화"),
      i18n.t("auto.g_0340", "수"),
      i18n.t("auto.g_0341", "목"),
      i18n.t("auto.g_0342", "금"),
      i18n.t("auto.g_0343", "토")
    ][new Date(dayStr).getDay()];
    const newUsers = (users || []).filter((u: any) => (u.created_at || "").startsWith(dayStr)).length;
    const newGroups = (groups || []).filter((g: any) => (g.created_at || "").startsWith(dayStr)).length;
    return {
      day: dayLabel,
      users: newUsers,
      matches: newGroups,
      revenue: newGroups * 50000
    };
  });
  return result;
}

/** 留덉????몄떆 ?뚮┝ 諛쒖넚 (Global In-App Notification 泥섎━) */
export async function sendMarketingPush(title: string, body: string, target: string): Promise<boolean> {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  // QUAL-3 fix: 100명 하드코딩 → 페이지네이션으로 전체 유저 대상
  const PAGE_SIZE = 500;
  let page = 0;
  let totalSent = 0;
  while (true) {
    let query = adminSupabase.from("profiles").select("id").range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (target === "plus") query = query.eq("is_plus", true);
    else if (target === "free") query = query.eq("is_plus", false);
    else if (target === "verified") query = query.eq("verified", true);
    const { data: users, error } = await query;
    if (error || !users || users.length === 0) break;
    const payload = users.map(u => ({
      user_id: u.id,
      title,
      content: body,
      type: "marketing",
      read: false
    }));
    await adminSupabase.from("in_app_notifications").insert(payload);
    totalSent += users.length;
    if (users.length < PAGE_SIZE) break; // 마지막 페이지
    page++;
  }
  console.log(`[adminService] sendMarketingPush: sent to ${totalSent} users`);
  return true;
}

// ?? REVENUE ???????????????????????????????????????????????????????????????????

/** ?꾩껜 援щ룆 紐⑸줉 諛??섏씡 ?듦퀎 */
export async function fetchRevenueStats() {
  // SEC-4 fix: 어드민 권한 체크 추가 — 매출 통계 미인증 노출 방지
  if (!isSupabaseConfigured || !(await checkAdminRole())) return {
    total: 0,
    monthly: 0,
    subs: 0,
    purchases: 0,
    churnRate: 0
  };
  const [subRes, purRes] = await Promise.all([
    supabase.from("subscriptions").select("plan, price_krw, status, created_at"), 
    supabase.from("purchases").select("price_krw, item_id, created_at")
  ]);
  const subs = subRes.data || [];
  const purs = purRes.data || [];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const activeSubRevenue = subs.filter((s: any) => s.status === "active").reduce((a: number, s: any) => a + (s.price_krw || 0), 0);
  const purchaseRevenue = purs.reduce((a: number, p: any) => a + (p.price_krw || 0), 0);
  const monthlyRev = purs.filter((p: any) => p.created_at >= monthStart).reduce((a: number, p: any) => a + (p.price_krw || 0), 0);
  const cancelledSubs = subs.filter((s: any) => s.status === "cancelled").length;
  const totalSubs = subs.filter((s: any) => s.status !== "cancelled").length;
  return {
    total: activeSubRevenue + purchaseRevenue,
    monthly: monthlyRev,
    subs: totalSubs,
    purchases: purs.length,
    churnRate: totalSubs > 0 ? Math.round(cancelledSubs / (totalSubs + cancelledSubs) * 100) : 0
  };
}
export async function fetchSubscriptionList() {
  // SEC-4 fix: 어드민 권한 체크 — 구독 정보 미인증 노출 방지
  if (!isSupabaseConfigured || !(await checkAdminRole())) return [];
  const {
    data,
    error
  } = await supabase.from("subscriptions").select("*, profiles:user_id(name, email, photo_url)").order("created_at", {
    ascending: false
  }).limit(100);
  if (error) {
    console.error("fetchSubscriptionList error:", error);
    return [];
  }
  return (data || []).map((s: any) => ({
    ...s,
    userName: s.profiles?.name || "Unknown",
    userEmail: s.profiles?.email || "",
    userPhoto: s.profiles?.photo_url || null
  }));
}
export async function fetchPurchaseHistory() {
  // SEC-4 fix: 어드민 권한 체크 — 결제 내역 미인증 노출 방지
  if (!isSupabaseConfigured || !(await checkAdminRole())) return [];
  const {
    data,
    error
  } = await supabase.from("purchases").select("*, profiles:user_id(name, email)").order("created_at", {
    ascending: false
  }).limit(200);
  if (error) {
    console.error("fetchPurchaseHistory error:", error);
    return [];
  }
  return (data || []).map((p: any) => ({
    ...p,
    userName: p.profiles?.name || "Unknown",
    userEmail: p.profiles?.email || ""
  }));
}

// ?? ANALYTICS ?????????????????????????????????????????????????????????????????

/** ?붾퀎 ?좉퇋 媛?낆옄 吏??6媛쒖썡 */
export async function fetchMonthlySignups(): Promise<any[]> {
  // SEC-4 fix: 어드민 권한 체크
  if (!isSupabaseConfigured || !(await checkAdminRole())) return [];
  const months: any[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = d.toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).toISOString();
    const {
      count
    } = await adminSupabase.from("profiles").select("id", {
      count: "exact",
      head: true
    }).eq("setup_complete", true).or("photo_url.not.is.null,photo_urls.not.is.null").gte("created_at", start).lt("created_at", end);
    months.push({
      month: d.toLocaleString("default", {
        month: "short"
      }),
      users: count || 0
    });
  }
  return months;
}

/** ?⑤씪???좎? (?⑤씪???곹깭 24h ?대궡) */
export async function fetchActiveUserCount(): Promise<number> {
  // SEC-4 fix: 어드민 권한 체크
  if (!isSupabaseConfigured || !(await checkAdminRole())) return 0;
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const {
    count
  } = await adminSupabase.from("online_status").select("user_id", {
    count: "exact",
    head: true
  }).gte("last_seen", since);
  return count || 0;
}

/** 湲곌린蹂??좎? 遺꾪룷 */
export async function fetchGenderStats() {
  // SEC-4 fix: 어드민 권한 체크 — 성별 통계 노출 방지
  if (!isSupabaseConfigured || !(await checkAdminRole())) return [];
  const {
    data
  } = await completedProfileFilter(adminSupabase.from("profiles").select("gender, photo_url, photo_urls, setup_complete"));
  const counts: Record<string, number> = {};
  (data || []).filter(hasCompletedProfilePhoto).forEach((u: any) => {
    const g = u.gender || "unknown";
    counts[g] = (counts[g] || 0) + 1;
  });
  return Object.entries(counts).map(([gender, count]) => ({
    gender,
    count
  }));
}

/** 援?쟻蹂?遺꾪룷 */
export async function fetchNationalityStats() {
  // SEC-4 fix: 어드민 권한 체크 — 국적 통계 노출 방지
  if (!isSupabaseConfigured || !(await checkAdminRole())) return [];
  const {
    data
  } = await completedProfileFilter(adminSupabase.from("profiles").select("nationality, photo_url, photo_urls, setup_complete"));
  const counts: Record<string, number> = {};
  (data || []).filter(hasCompletedProfilePhoto).forEach((u: any) => {
    const n = u.nationality || "Unknown";
    counts[n] = (counts[n] || 0) + 1;
  });
  return Object.entries(counts).map(([country, count]) => ({
    country,
    count
  })).sort((a, b) => b.count - a.count).slice(0, 10);
}

// ?? APP SETTINGS ??????????????????????????????????????????????????????????????

export async function fetchAppSettings(): Promise<Record<string, any>> {
  // SEC-4 fix: 어드민 권한 체크 — 앱 설정값 미인증 노출 방지
  if (!isSupabaseConfigured || !(await checkAdminRole())) return {};
  const {
    data,
    error
  } = await adminSupabase.from("app_settings").select("key, value");
  if (error) {
    console.error("fetchAppSettings error:", error);
    return {};
  }
  const result: Record<string, any> = {};
  (data || []).forEach((row: any) => {
    result[row.key] = row.value;
  });
  return result;
}
export async function updateAppSetting(key: string, value: any): Promise<boolean> {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const {
    error
  } = await adminSupabase.from("app_settings").upsert({
    key,
    value
  }, {
    onConflict: "key"
  });
  if (error) {
    console.error("updateAppSetting error:", error);
    return false;
  }
  await logAdminAction("update_setting", "setting", key, { value });
  return true;
}

// ? SAFETY ??????????????????????????????????????????????????????

export async function fetchSafetyCheckins() {
  // SEC-4 fix: 어드민 권한 체크 — 안전 체크인 정보 미인증 노출 방지
  if (!isSupabaseConfigured || !(await checkAdminRole())) return [];
  const {
    data,
    error
  } = await adminSupabase.from("safety_checkins").select("*, profiles:user_id(name, photo_url, email)").order("created_at", {
    ascending: false
  }).limit(100);
  if (error) {
    console.error("fetchSafetyCheckins error:", error);
    return [];
  }
  return (data || []).map((c: any) => ({
    ...c,
    userName: c.profiles?.name || "Unknown",
    userPhoto: c.profiles?.photo_url || null,
    userEmail: c.profiles?.email || ""
  }));
}

// ? NOTIFICATIONS BROADCAST ???????????????????????????????????????

/**
 * push-notify Edge Function 직접 호출은 서버 전용 Service Role 인증이 필요합니다.
 * 클라이언트에서는 in-app 알림을 저장하고 DB Webhook/서버가 FCM을 처리하게 둡니다.
 */
async function sendPushViaEdgeFunction(
  userId: string,
  title: string,
  body: string,
  notifType = "system"
): Promise<boolean> {
  try {
    void userId;
    void title;
    void body;
    void notifType;
    return false;
  } catch (e) {
    console.warn("[adminService] sendPushViaEdgeFunction failed:", e);
    return false;
  }
}

export async function broadcastNotification(
  title: string,
  content: string,
  type: string,
  filter: string
): Promise<{ sent: number }> {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return { sent: 0 };

  // 대상 유저 필터링
  let query = adminSupabase.from("profiles").select("id, fcm_token");
  if (filter === "plus")     query = query.eq("is_plus", true);
  if (filter === "verified") query = query.eq("verified", true);
  if (filter === "free")     query = query.eq("is_plus", false);

  const { data: users } = await query.limit(5000);
  if (!users || users.length === 0) return { sent: 0 };

  // 알림 type 정규화 (notification_prefs의 'system' 키와 매핑)
  const notifType = (type === "info" || type === "update" || type === "promo" || type === "warning") ? "system" : type;

  // 200명씩 청크로 분할하여 INSERT
  const chunks: any[][] = [];
  for (let i = 0; i < users.length; i += 200) chunks.push(users.slice(i, i + 200));

  let sent = 0;
  for (const chunk of chunks) {
    // in_app_notifications 테이블에 INSERT
    // → push_on_inapp Database Webhook이 push-notify Edge Function을 호출
    // → push-notify가 notification_prefs.system 값을 확인 후 FCM 발송
    const payload = chunk.map(u => ({
      user_id: u.id,
      title,
      content,
      // type을 system으로 통일 (notification_prefs의 'system' 키와 매핑됨)
      type: (type === "info" || type === "update" || type === "promo" || type === "warning") ? "system" : type,
      read: false,
    }));
    const { error } = await adminSupabase.from("in_app_notifications").insert(payload);
    if (!error) sent += chunk.length;
  }

  return { sent };
}

// ?? ADMIN ACTIVITY LOG ????????????????????????????????????????????????????????

export async function logAdminAction(action: string, targetType: string, targetId: string, details?: any) {
  if (!isSupabaseConfigured) return;
  try {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    
    console.log("[logAdminAction] Attempting to log:", {
      admin_id: user?.id || null,
      action,
      target_type: targetType,
      target_id: targetId,
      details: details || null
    });

    const { error } = await adminSupabase.from("admin_activity_log").insert({
      admin_id: user?.id || null,
      action,
      target_type: targetType,
      target_id: targetId,
      details: details || null
    });

    if (error) {
      console.error("[logAdminAction] Error inserting activity log:", error);
    } else {
      console.log("[logAdminAction] Activity log inserted successfully");
    }
  } catch (err) {
    console.error("[logAdminAction] Exception in logAdminAction:", err);
  }
}

// ─────────────────────────────────────────────────
// 안전 체크인 해제 (추가)
// ─────────────────────────────────────────────────
export async function resolveSafetyCheckin(id: string) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const { error } = await adminSupabase
    .from("safety_checkins")
    .update({ status: "resolved", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (!error) {
    await logAdminAction("resolve_safety", "safety", id);
  }
  return !error;
}


// ─────────────────────────────────────────────────
// 채팅방 모니터링
// ─────────────────────────────────────────────────
export async function fetchAdminChatRooms(limit = 50) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return [];

  // ① 여행 그룹 채팅방
  const { data: groups } = await adminSupabase
    .from("trip_groups")
    .select("id, title, description, created_at, member_count, max_members, host_id, created_by, is_active, host_profile:profiles!trip_groups_host_id_fkey(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  // ② 1:1 채팅 스레드 (is_group = false)
  const { data: threads } = await adminSupabase
    .from("chat_threads")
    .select("id, name, created_at, is_group, last_message, created_by, creator_profile:profiles!chat_threads_created_by_fkey(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  const groupRooms = (groups || []).map((g: any) => ({
    id: g.id,
    title: g.title || '여행 그룹',
    description: g.description,
    created_at: g.created_at,
    member_count: g.member_count || 0,
    max_members: g.max_members,
    is_active: g.is_active !== false,
    room_type: 'group',
    created_by: g.created_by || g.host_id,
    profiles: (g as any).host_profile,
  }));

  const threadRooms = (threads || []).map((t: any) => ({
    id: t.id,
    title: t.name || '1:1 채팅',
    description: t.last_message,
    created_at: t.created_at,
    member_count: t.is_group ? 0 : 2,
    max_members: t.is_group ? null : 2,
    is_active: true,
    room_type: t.is_group ? 'group' : 'direct',
    created_by: t.created_by,
    profiles: (t as any).creator_profile,
  }));

  return [...groupRooms, ...threadRooms].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, limit);
}

export async function fetchAdminMessages(roomId: string, limit = 30) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return [];

  // ① trip_groups에서 thread_id가 존재하는지 확인
  const { data: groupData } = await adminSupabase
    .from("trip_groups")
    .select("thread_id")
    .eq("id", roomId)
    .maybeSingle();

  const actualThreadId = groupData?.thread_id || roomId;

  // ② 1:1 또는 그룹 채팅 메시지 (chat_messages 테이블) 조회
  const { data: chatMsgs, error: chatErr } = await adminSupabase
    .from("chat_messages")
    .select("id, content, created_at, sender_id, profiles!chat_messages_sender_id_fkey(name, photo_url)")
    .eq("thread_id", actualThreadId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!chatErr && chatMsgs && chatMsgs.length > 0) {
    return chatMsgs.map((m: any) => ({
      ...m,
      user_id: m.sender_id,
    }));
  }

  // ③ 그룹 채팅 메시지 (messages 테이블 fallback)
  const { data: groupMsgs, error: groupErr } = await adminSupabase
    .from("messages")
    .select("id, content, created_at, user_id, profiles!messages_user_id_fkey(name, photo_url)")
    .eq("group_id", roomId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!groupErr && groupMsgs && groupMsgs.length > 0) return groupMsgs;

  // ④ 두 번째 fallback: thread_id로 messages 조회
  const { data: fallbackMsgs } = await adminSupabase
    .from("messages")
    .select("id, content, created_at, user_id, profiles!messages_user_id_fkey(name, photo_url)")
    .eq("thread_id", actualThreadId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return fallbackMsgs || [];
}

export async function deactivateChatRoom(groupId: string) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const { error } = await adminSupabase
    .from("trip_groups")
    .update({ is_active: false })
    .eq("id", groupId);
  if (!error) {
    await logAdminAction("deactivate_chat_room", "group", groupId);
  }
  return !error;
}

export async function deleteChatRoom(roomId: string, roomType: string) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  if (roomType === "group") {
    // 1. thread_id 백업
    const { data: groupData } = await adminSupabase
      .from("trip_groups")
      .select("thread_id")
      .eq("id", roomId)
      .maybeSingle();

    const threadId = groupData?.thread_id;

    // 2. 여행 그룹 삭제 (ON DELETE CASCADE로 멤버 등 삭제)
    const { error: groupErr } = await adminSupabase
      .from("trip_groups")
      .delete()
      .eq("id", roomId);

    // 3. 관련 chat_threads 삭제 (연쇄적으로 messages/chat_messages/chat_members 등 삭제)
    if (threadId) {
      await adminSupabase
        .from("chat_threads")
        .delete()
        .eq("id", threadId);
    }
    if (!groupErr) {
      await logAdminAction("delete_chat_room", "group", roomId, { roomType });
    }
    return !groupErr;
  } else {
    // 1:1 채팅방 삭제
    const { error: threadErr } = await adminSupabase
      .from("chat_threads")
      .delete()
      .eq("id", roomId);
    if (!threadErr) {
      await logAdminAction("delete_chat_room", "chat", roomId, { roomType });
    }
    return !threadErr;
  }
}

export async function deleteAdminMessage(messageId: string) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const { error: err1 } = await adminSupabase
    .from("messages")
    .delete()
    .eq("id", messageId);
  const { error: err2 } = await adminSupabase
    .from("chat_messages")
    .delete()
    .eq("id", messageId);
  const success = !err1 || !err2;
  if (success) {
    await logAdminAction("delete_message", "message", messageId);
  }
  return success;
}

// ─────────────────────────────────────────────────
// 대시보드용 오늘 통계
// ─────────────────────────────────────────────────
export async function fetchTodayStats() {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return { newUsers: 0, sosCheckins: 0, activeChats: 0, newReports: 0 };
  const today = new Date().toISOString().split("T")[0];
  const [usersRes, checkinsRes, chatsRes, reportsRes] = await Promise.all([
    adminSupabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", today),
    adminSupabase.from("safety_checkins").select("id", { count: "exact", head: true }).eq("is_sos", true).eq("status", "active"),
    adminSupabase.from("trip_groups").select("id", { count: "exact", head: true }).eq("is_active", true),
    adminSupabase.from("reports").select("id", { count: "exact", head: true }).gte("created_at", today),
  ]);
  return {
    newUsers: usersRes.count || 0,
    sosCheckins: checkinsRes.count || 0,
    activeChats: chatsRes.count || 0,
    newReports: reportsRes.count || 0,
  };
}

// ─────────────────────────────────────────────────
// 어드민 전용 RPC 함수 (DB 함수 호출)
// ─────────────────────────────────────────────────

/** 유저 정지 */
export async function adminBanUser(userId: string, reason?: string, banDays?: number) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const { data, error } = await adminSupabase.rpc("admin_ban_user", {
    target_user_id: userId,
    reason: reason || null,
    ban_days: banDays || null,
  });
  if (error) {
    console.error("adminBanUser RPC error:", error);
    // Fallback: 직접 update
    const { error: e2 } = await adminSupabase.from("profiles").update({
      is_banned: true,
      banned: true,
      ban_reason: reason || null,
      banned_until: banDays ? new Date(Date.now() + banDays * 86400000).toISOString() : null,
    }).eq("id", userId);
    if (!e2) { invalidateCache('match:profiles:'); invalidateCache('map:profiles:'); }
    return !e2;
  }
  // ✅ 캐시 즉시 무효화
  invalidateCache('match:profiles:');
  invalidateCache('map:profiles:');
  return data === true || data !== false;
}

/** 유저 정지 해제 */
export async function adminUnbanUser(userId: string) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const { data, error } = await adminSupabase.rpc("admin_unban_user", { target_user_id: userId });
  if (error) {
    // Fallback
    const { error: e2 } = await adminSupabase.from("profiles").update({
      is_banned: false,
      banned: false,
      ban_reason: null,
      banned_until: null,
    }).eq("id", userId);
    if (!e2) { invalidateCache('match:profiles:'); invalidateCache('map:profiles:'); }
    return !e2;
  }
  // ✅ 캐시 즉시 무효화
  invalidateCache('match:profiles:');
  invalidateCache('map:profiles:');
  return data === true || data !== false;
}

export async function adminResolveReport(reportId: string, action: string, comment?: string) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const { data, error } = await adminSupabase.rpc("admin_resolve_report", {
    report_id: reportId,
    action,
    comment: comment || null,
  });
  const success = !error && data !== false;
  if (error) {
    // Fallback
    const { error: e2 } = await adminSupabase.from("reports").update({
      status: action,
      admin_comment: comment,
      resolved_at: new Date().toISOString(),
    }).eq("id", reportId);
    if (!e2) {
      await logAdminAction(`resolve_report_${action}`, "report", reportId, { action, comment });
      return true;
    }
    return false;
  }
  if (success) {
    await logAdminAction(`resolve_report_${action}`, "report", reportId, { action, comment });
  }
  return success;
}

/** 신분증 인증 승인 */
export async function adminApproveVerification(verifId: string) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const { data, error } = await adminSupabase.rpc("admin_approve_verification", { verif_id: verifId });
  if (error) {
    console.error("adminApproveVerification error:", error);
    return false;
  }
  const success = data !== false;
  if (success) {
    await logAdminAction("approve_verification", "verification", verifId);
  }
  return success;
}

/** 신분증 인증 거절 */
export async function adminRejectVerification(verifId: string, reason?: string) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const { data, error } = await adminSupabase.rpc("admin_reject_verification", {
    verif_id: verifId,
    reason: reason || null,
  });
  if (error) {
    console.error("adminRejectVerification error:", error);
    return false;
  }
  const success = data !== false;
  if (success) {
    await logAdminAction("reject_verification", "verification", verifId, { reason });
  }
  return success;
}

/** 어드민 뷰: SOS 긴급 체크인 목록 */
export async function fetchSosActive() {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return [];
  const { data, error } = await adminSupabase
    .from("admin_sos_active")
    .select("*")
    .limit(50);
  if (error) { console.error("fetchSosActive error:", error); return []; }
  return data || [];
}

/** 어드민 뷰: 채팅방 요약 */
export async function fetchChatRoomSummary(limit = 50) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return [];
  const { data, error } = await adminSupabase
    .from("admin_chat_room_summary")
    .select("*")
    .limit(limit);
  if (error) { console.error("fetchChatRoomSummary error:", error); return []; }
  return data || [];
}

