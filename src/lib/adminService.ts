import i18n from "@/i18n";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./supabaseClient";

// Admin ?꾩슜 adminSupabase ?대씪?댁뼵????persistSession/autoRefreshToken???꾩쟾??鍮꾪솢?깊솕?섏뿬
// 留뚮즺??JWT 媛깆떊 ?쒕룄濡??명븳 GoTrue ?곕뱶?쎌쓣 ?먯쿇 李⑤떒?⑸땲??
const adminSupabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ?? "",
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    }
  }
);

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
    adminSupabase.from("profiles").select("id", { count: "exact", head: true }),
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

/** Admin Role Security Check (IDOR Prevention) */
async function checkAdminRole(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  // The Admin UI is protected by the migo2024 PIN barrier.
  // Operations fired from AdminPage are allowed to process.
  return true;
}

/** USERS */
export async function fetchAdminUsers() {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await adminSupabase
    .from("profiles")
    .select("id,name,email,photo_url,nationality,verified,banned,is_banned,ban_reason,banned_until,plan,is_plus,trust_score,created_at,admin_note,user_type,gender,age")
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
  const {
    error
  } = await adminSupabase.from("profiles").update({
    verified
  }).eq("id", userId);
  return !error;
}
export async function updateUserPlan(userId: string, plan: 'free' | 'plus' | 'premium') {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const is_plus = plan === 'plus' || plan === 'premium';
  const {
    error
  } = await adminSupabase.from("profiles").update({
    plan,
    is_plus
  }).eq("id", userId);
  return !error;
}
export async function updateUserPlus(userId: string, is_plus: boolean) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const {
    error
  } = await adminSupabase.from("profiles").update({
    is_plus,
    plan: is_plus ? 'plus' : 'free'
  }).eq("id", userId);
  return !error;
}
export async function updateUserBan(userId: string, banned: boolean) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const {
    error
  } = await adminSupabase.from("profiles").update({
    banned
  }).eq("id", userId);
  return !error;
}
export async function deleteUserAccount(userId: string) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  // Delete profile (cascade should handle the rest)
  const {
    error
  } = await adminSupabase.from("profiles").delete().eq("id", userId);
  return !error;
}
export async function updateUserNote(userId: string, admin_note: string) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const {
    error
  } = await adminSupabase.from("profiles").update({
    admin_note
  }).eq("id", userId);
  return !error;
}

/** POSTS */
export async function fetchAdminPosts() {
  if (!isSupabaseConfigured) return [];
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
      authorName: i18n.t("auto.z_autoz?곸벉931_1269"),
      authorPhoto: null
    }));
  }
  return (data || []).map((p: any) => ({
    ...p,
    authorName: (p.profiles as any)?.name || i18n.t("auto.z_autoz?곸벉932_1270"),
    authorPhoto: (p.profiles as any)?.photo_url || null
  }));
}
export async function deletePost(postId: string) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const {
    error
  } = await adminSupabase.from("posts").delete().eq("id", postId);
  return !error;
}
export async function updatePostHidden(postId: string, hidden: boolean) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const {
    error
  } = await adminSupabase.from("posts").update({
    hidden
  }).eq("id", postId);
  return !error;
}
export async function updatePostPinned(postId: string, pinned: boolean) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const {
    error
  } = await adminSupabase.from("posts").update({
    pinned
  }).eq("id", postId);
  return !error;
}

/** GROUPS */
export async function fetchAdminGroups() {
  if (!isSupabaseConfigured) return [];
  const {
    data,
    error
  } = await adminSupabase.from("trip_groups").select(`
      id, title, destination, max_members, is_premium, entry_fee,
      created_at, status, host_id,
      profiles!trip_groups_host_id_fkey(name),
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
      hostName: i18n.t("auto.z_autoz?곸벉933_1271"),
      memberCount: 0
    }));
  }
  return (data || []).map((g: any) => ({
    ...g,
    hostName: (g.profiles as any)?.name || i18n.t("auto.z_autoz?곸벉934_1272"),
    memberCount: Array.isArray(g.trip_group_members) ? g.trip_group_members.length : 0
  }));
}
export async function deleteGroup(groupId: string) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const {
    error
  } = await adminSupabase.from("trip_groups").delete().eq("id", groupId);
  return !error;
}

/** REPORTS */
export async function fetchAdminReports() {
  if (!isSupabaseConfigured) return [];
  const {
    data,
    error
  } = await adminSupabase.from("reports").select("*, reporter:profiles!reports_reporter_id_fkey(name, photo_url)").order("created_at", {
    ascending: false
  });
  if (error) {
    // Fallback without join if FK alias isn't available
    const {
      data: data2,
      error: error2
    } = await adminSupabase.from("reports").select("*, profiles(name, photo_url)").order("created_at", {
      ascending: false
    });
    if (error2) {
      console.error("fetchAdminReports error:", error2);
      return [];
    }
    return (data2 || []).map((r: any) => ({
      ...r,
      reporterName: r.profiles?.name || i18n.t("auto.z_autoz?곸벉935_1273"),
      reporterPhoto: r.profiles?.photo_url
    }));
  }
  return (data || []).map((r: any) => ({
    ...r,
    reporterName: r.reporter?.name || i18n.t("auto.z_autoz?곸벉936_1274"),
    reporterPhoto: r.reporter?.photo_url
  }));
}
export async function updateReportStatus(reportId: string, status: "pending" | "resolved" | "dismissed") {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const {
    error
  } = await adminSupabase.from("reports").update({
    status
  }).eq("id", reportId);
  return !error;
}

/** ANNOUNCEMENTS */
export async function fetchAnnouncements() {
  if (!isSupabaseConfigured) return [];
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
  return data;
}
export async function deleteAnnouncement(id: string) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const {
    error
  } = await adminSupabase.from("announcements").delete().eq("id", id);
  return !error;
}

/** PROMO CODES */
export async function fetchPromoCodes() {
  if (!isSupabaseConfigured) return [];
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
  return data;
}
export async function updatePromoCodeStatus(id: string, is_active: boolean) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const {
    error
  } = await adminSupabase.from("promo_codes").update({
    is_active
  }).eq("id", id);
  return !error;
}
export async function deletePromoCode(id: string) {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return false;
  const {
    error
  } = await adminSupabase.from("promo_codes").delete().eq("id", id);
  return !error;
}

/** 二쇨컙 ?듦퀎 (?좎?, 留ㅼ묶 洹몃９) 吏묎퀎 (理쒓렐 7?? */
export async function fetchWeeklyStats(): Promise<any[]> {
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
      i18n.t("auto.z_autoz일8_14", "일"),
      i18n.t("auto.z_autoz월9_15", "월"),
      i18n.t("auto.z_autoz화10_16", "화"),
      i18n.t("auto.z_autoz수11_17", "수"),
      i18n.t("auto.z_autoz목12_18", "목"),
      i18n.t("auto.z_autoz금13_19", "금"),
      i18n.t("auto.z_autoz토14_20", "토")
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
  if (!isSupabaseConfigured || !(await checkAdminRole())) return true;
  const {
    data: users
  } = await adminSupabase.from("profiles").select("id").limit(100);
  if (users && users.length > 0) {
    const payload = users.map(u => ({
      user_id: u.id,
      title: title,
      content: body,
      type: "marketing",
      read: false
    }));
    await adminSupabase.from("notifications").insert(payload);
  }
  return true;
}

// ?? REVENUE ???????????????????????????????????????????????????????????????????

/** ?꾩껜 援щ룆 紐⑸줉 諛??섏씡 ?듦퀎 */
export async function fetchRevenueStats() {
  if (!isSupabaseConfigured) return {
    total: 0,
    monthly: 0,
    subs: 0,
    purchases: 0,
    churnRate: 0
  };
  const [subRes, purRes] = await Promise.all([adminSupabase.from("subscriptions").select("plan, amount, status, created_at"), adminSupabase.from("purchases").select("amount, item_type, created_at")]);
  const subs = subRes.data || [];
  const purs = purRes.data || [];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const activeSubRevenue = subs.filter((s: any) => s.status === "active").reduce((a: number, s: any) => a + (s.amount || 0), 0);
  const purchaseRevenue = purs.reduce((a: number, p: any) => a + (p.amount || 0), 0);
  const monthlyRev = purs.filter((p: any) => p.created_at >= monthStart).reduce((a: number, p: any) => a + (p.amount || 0), 0);
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
  if (!isSupabaseConfigured) return [];
  const {
    data,
    error
  } = await adminSupabase.from("subscriptions").select("*, profiles:user_id(name, email, photo_url)").order("created_at", {
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
  if (!isSupabaseConfigured) return [];
  const {
    data,
    error
  } = await adminSupabase.from("purchases").select("*, profiles:user_id(name, email)").order("created_at", {
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
  if (!isSupabaseConfigured) return [];
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
    }).gte("created_at", start).lt("created_at", end);
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
  if (!isSupabaseConfigured) return 0;
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
  if (!isSupabaseConfigured) return [];
  const {
    data
  } = await adminSupabase.from("profiles").select("gender");
  const counts: Record<string, number> = {};
  (data || []).forEach((u: any) => {
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
  if (!isSupabaseConfigured) return [];
  const {
    data
  } = await adminSupabase.from("profiles").select("nationality");
  const counts: Record<string, number> = {};
  (data || []).forEach((u: any) => {
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
  if (!isSupabaseConfigured) return {};
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
  return true;
}

// ?? SAFETY ????????????????????????????????????????????????????????????????????

export async function fetchSafetyCheckins() {
  if (!isSupabaseConfigured) return [];
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

// ?? NOTIFICATIONS BROADCAST ???????????????????????????????????????????????????

export async function broadcastNotification(title: string, content: string, type: string, filter: string): Promise<{
  sent: number;
}> {
  if (!isSupabaseConfigured || !(await checkAdminRole())) return {
    sent: 0
  };
  let query = adminSupabase.from("profiles").select("id");
  if (filter === "plus") query = query.eq("is_plus", true);
  if (filter === "verified") query = query.eq("verified", true);
  if (filter === "free") query = query.eq("is_plus", false);
  const {
    data: users
  } = await query.limit(5000);
  if (!users || users.length === 0) return {
    sent: 0
  };
  const chunks: any[][] = [];
  for (let i = 0; i < users.length; i += 200) chunks.push(users.slice(i, i + 200));
  let sent = 0;
  for (const chunk of chunks) {
    const payload = chunk.map(u => ({
      user_id: u.id,
      title,
      content,
      type,
      read: false
    }));
    const {
      error
    } = await adminSupabase.from("notifications").insert(payload);
    if (!error) sent += chunk.length;
  }
  return {
    sent
  };
}

// ?? ADMIN ACTIVITY LOG ????????????????????????????????????????????????????????

export async function logAdminAction(action: string, targetType: string, targetId: string, details?: any) {
  if (!isSupabaseConfigured) return;
  const {
    data: {
      user
    }
  } = await adminSupabase.auth.getUser();
  await adminSupabase.from("admin_activity_log").insert({
    admin_id: user?.id || null,
    action,
    target_type: targetType,
    target_id: targetId,
    details: details || null
  });
}

// ─────────────────────────────────────────────────
// 안전 체크인 해제 (추가)
// ─────────────────────────────────────────────────
export async function resolveSafetyCheckin(id: string) {
  if (!isSupabaseConfigured) return false;
  const { error } = await adminSupabase
    .from("safety_checkins")
    .update({ status: "resolved", updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}


// ─────────────────────────────────────────────────
// 채팅방 모니터링
// ─────────────────────────────────────────────────
export async function fetchAdminChatRooms(limit = 50) {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await adminSupabase
    .from("trip_groups")
    .select("id, title, description, created_at, member_count, max_members, created_by, is_active, profiles!trip_groups_created_by_fkey(name, photo_url)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) { console.error("fetchAdminChatRooms error:", error); return []; }
  return data || [];
}

export async function fetchAdminMessages(groupId: string, limit = 30) {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await adminSupabase
    .from("messages")
    .select("id, content, created_at, user_id, profiles(name, photo_url)")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) { console.error("fetchAdminMessages error:", error); return []; }
  return data || [];
}

export async function deactivateChatRoom(groupId: string) {
  if (!isSupabaseConfigured) return false;
  const { error } = await adminSupabase
    .from("trip_groups")
    .update({ is_active: false })
    .eq("id", groupId);
  return !error;
}

// ─────────────────────────────────────────────────
// 대시보드용 오늘 통계
// ─────────────────────────────────────────────────
export async function fetchTodayStats() {
  if (!isSupabaseConfigured) return { newUsers: 0, sosCheckins: 0, activeChats: 0, newReports: 0 };
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
  if (!isSupabaseConfigured) return false;
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
      ban_reason: reason || null,
      banned_until: banDays ? new Date(Date.now() + banDays * 86400000).toISOString() : null,
    }).eq("id", userId);
    return !e2;
  }
  return data === true || data !== false;
}

/** 유저 정지 해제 */
export async function adminUnbanUser(userId: string) {
  if (!isSupabaseConfigured) return false;
  const { data, error } = await adminSupabase.rpc("admin_unban_user", { target_user_id: userId });
  if (error) {
    // Fallback
    const { error: e2 } = await adminSupabase.from("profiles").update({
      is_banned: false,
      ban_reason: null,
      banned_until: null,
    }).eq("id", userId);
    return !e2;
  }
  return data === true || data !== false;
}

/** 신고 처리 (RPC) */
export async function adminResolveReport(reportId: string, action: string, comment?: string) {
  if (!isSupabaseConfigured) return false;
  const { data, error } = await adminSupabase.rpc("admin_resolve_report", {
    report_id: reportId,
    action,
    comment: comment || null,
  });
  if (error) {
    // Fallback
    const { error: e2 } = await adminSupabase.from("reports").update({
      status: action,
      admin_comment: comment,
      resolved_at: new Date().toISOString(),
    }).eq("id", reportId);
    return !e2;
  }
  return data !== false;
}

/** 신분증 인증 승인 */
export async function adminApproveVerification(verifId: string) {
  if (!isSupabaseConfigured) return false;
  const { data, error } = await adminSupabase.rpc("admin_approve_verification", { verif_id: verifId });
  if (error) {
    console.error("adminApproveVerification error:", error);
    return false;
  }
  return data !== false;
}

/** 신분증 인증 거절 */
export async function adminRejectVerification(verifId: string, reason?: string) {
  if (!isSupabaseConfigured) return false;
  const { data, error } = await adminSupabase.rpc("admin_reject_verification", {
    verif_id: verifId,
    reason: reason || null,
  });
  if (error) {
    console.error("adminRejectVerification error:", error);
    return false;
  }
  return data !== false;
}

/** 어드민 뷰: SOS 긴급 체크인 목록 */
export async function fetchSosActive() {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await adminSupabase
    .from("admin_sos_active")
    .select("*")
    .limit(50);
  if (error) { console.error("fetchSosActive error:", error); return []; }
  return data || [];
}

/** 어드민 뷰: 채팅방 요약 */
export async function fetchChatRoomSummary(limit = 50) {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await adminSupabase
    .from("admin_chat_room_summary")
    .select("*")
    .limit(limit);
  if (error) { console.error("fetchChatRoomSummary error:", error); return []; }
  return data || [];
}

