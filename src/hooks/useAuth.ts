import i18n from 'i18next';
import { useState, useEffect } from "react";
import { toast } from "./use-toast";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { User, Session } from "@supabase/supabase-js";
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  photoUrl?: string;
  verified?: boolean;
  setupComplete?: boolean;
}

// profiles.photo_url 을 DB에서 가져와 user.photoUrl에 반영 (캐시 버스팅 포함)
async function enrichWithProfilePhoto(user: AuthUser, retries = 3): Promise<AuthUser> {
  try {
    // QUAL-5 fix: 재시도 횟수에 비례해 타임아웃 단축 — 최악 4s×3회=12s 블로킹 방지
    // retries: 3→4000ms, 2→2700ms, 1→1800ms, 0→1200ms
    const timeoutMs = Math.round(4000 * Math.pow(0.67, 3 - retries));
    const timeoutPromise = new Promise<{ data: null, error: any }>((_r, reject) =>
      setTimeout(() => reject(new Error('timeout')), timeoutMs)
    );
    const { data, error } = await Promise.race([
      supabase.from("profiles").select("photo_url, photo_urls, name, verified, setup_complete, is_banned, banned, nationality").eq("id", user.id).single(),
      timeoutPromise
    ]);
    
    // DB 트리거(handle_new_user)가 아직 완료되지 않아 프로필이 없는 경우 재시도 (Race Condition 방지)
    if (error && error.code === 'PGRST116' && retries > 0) {
      await new Promise(r => setTimeout(r, 600)); // 600ms 대기
      return enrichWithProfilePhoto(user, retries - 1);
    }

    if (data) {
      if (data.is_banned || data.banned) {
        toast({ title: i18n.t("auto.g_1068", "이 계정은 이용 수칙 위반으로 영구 정지되었습니다."), variant: "destructive" });
        await supabase.auth.signOut();
        window.location.href = '/login';
        return { ...user, id: '' }; // Invalidated user
      }
      const bestPhoto = (data.photo_urls && data.photo_urls.length > 0) ? data.photo_urls[0] : data.photo_url;
      const cleanUrl = bestPhoto?.replace(/[?&]t=\d+/, "") || "";
      const bustedUrl = cleanUrl ? `${cleanUrl}?t=${Date.now()}` : "";

      // ✅ setup_complete 판정 규칙:
      // 1) setup_complete === true  → 완료
      // 2) setup_complete === false → 미완료 (명시적으로 false 저장된 경우)
      // 3) setup_complete === null  → 기존 유저는 nationality 유무로 판단
      //    (nationality가 있으면 프로필 셋팅을 완료한 유저)
      const isActuallyComplete =
        data.setup_complete === true ||
        (data.setup_complete !== false && !!data.nationality);

      return {
        ...user,
        photoUrl: bustedUrl || user.photoUrl || "",
        name: data.name || user.name,
        verified: data.verified ?? user.verified,
        setupComplete: isActuallyComplete
      };
    }
  } catch (err: any) {
    // timeout은 의도된 폴백 — 로그 생략, 그 외 에러만 warn
    if (err?.message !== 'timeout') {
      console.warn("enrichWithProfilePhoto error:", err);
    }
  }
  // DB 조회 실패/타임아웃 시:
  // ✔️ 기존에 setupComplete가 이미 확정된 값이 있으면 보존 (실패로 undefined가 되지 않도록)
  // ✔️ 신규 유저(setupComplete 미설정) = undefined 유지 → App.tsx가 리다이렉트 금지
  const preservedComplete = globalUser?.id === user.id ? globalUser?.setupComplete : undefined;
  return { ...user, setupComplete: preservedComplete ?? user.setupComplete };
}
let globalSession: Session | null = null;
let globalUser: AuthUser | null = null;
let globalLoading = true;
// ✅ sessionReady: Supabase auth가 initializePromise를 완료한 뒤에만 true로 설정됨.
// 컨텍스트들이 이 플래그를 체크해 lockAcquired 중 REST 요청(→ 401)을 방지합니다.
let globalSessionReady = false;
const authListeners = new Set<() => void>();
const notifyAuthListeners = () => {
  authListeners.forEach(fn => fn());
};
if (!isSupabaseConfigured) {
  // Mock user for development without Supabase
  globalUser = {
    id: "mock-user-1",
    email: "demo@lunaticsgroup.com",
    name: i18n.t("auto.g_0323", "데모유저9"),
    verified: false
  };
  globalLoading = false;
} else {
  // 🚨 앱 최초 실행 시 즉각적으로 로컬 세션을 가져와 '깜빡임' 원천 차단
  (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      // ✅ getSession()이 완전히 반환된 시점 = initializePromise 완료.
      //    이 시점부터 REST 요청이 Bearer 토큰을 올바르게 첨부함.
      globalSessionReady = true;
      if (session?.user) {
        if (!globalUser) {
          const base = mapUser(session.user);
          globalSession = session;
          globalUser = base;
          globalLoading = true;
          notifyAuthListeners();
          
          const enriched = await enrichWithProfilePhoto(base);
          if (globalUser?.id === enriched.id) { // 세션이 유지된 상태일 때만
            globalUser = enriched;
            globalLoading = false;
            notifyAuthListeners();
          }
        }
      } else {
        if (globalLoading) {
          globalLoading = false;
          notifyAuthListeners();
        }
      }
    } catch {
      globalSessionReady = true; // 에러 시에도 블로킹 해제
      globalLoading = false;
      notifyAuthListeners();
    }
  })();

  // 🚨 싱글톤 리스너: 모듈 레벨에서 딱 한 번만 등록해서 Lock 탈취 원천 차단
  supabase.auth.onAuthStateChange(async (event, session) => {
    globalSession = session;
    
    // 로그아웃 시 즉각 정리
    if (event === 'SIGNED_OUT' || !session?.user) {
      globalUser = null;
      globalLoading = false;
      localStorage.removeItem('migo_my_lat');
      localStorage.removeItem('migo_my_lng');
      localStorage.removeItem('migo_unread_map');
      notifyAuthListeners();
      return;
    }

    if (session?.user) {
      const base = mapUser(session.user);
      // 토큰 갱신 시에는 로딩 걸지 않음
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        // ⚠️ base에는 setupComplete가 false(기본값)이므로,
        // 기존 globalUser에서 enriched된 setupComplete를 보존해야 함
        const preservedSetup = globalUser?.setupComplete;
        globalUser = globalUser ? { ...globalUser, ...base, setupComplete: preservedSetup ?? base.setupComplete } : base;
        notifyAuthListeners();
        const enriched = await enrichWithProfilePhoto(globalUser);
        globalUser = enriched;
        notifyAuthListeners();
      } else if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        globalLoading = true; // Wait for profile enrichment to prevent flashing home screen for new users
        // ⚠️ base.setupComplete는 항상 false이므로, 기존 enriched 값 보존
        const preservedSetup = globalUser?.setupComplete;
        globalUser = globalUser ? { ...globalUser, ...base, setupComplete: preservedSetup ?? base.setupComplete } : base;
        notifyAuthListeners();
        
        const enriched = await enrichWithProfilePhoto(base);
        globalUser = {
          ...enriched,
          // ✅ enrichment이 undefined 를 반환했어도 이전에 로드된 유효한 setupComplete를 보존
          // (병렬 enrichment 실패로 setupComplete: true → undefined 덧쓌썌 방지)
          setupComplete: enriched.setupComplete ?? globalUser?.setupComplete,
        };
        globalLoading = false;
        notifyAuthListeners();
      } else {
        globalUser = globalUser ? { ...globalUser, ...base } : base;
        globalLoading = false;
        notifyAuthListeners();
      }
    }
  });

  // 프로필 실시간 데이터 갱신 리스너 (글로벌 1회 등록)
  // BUG-16 fix: HMR 재로드 시 이전 채널 누수 방지 — window에 ref 저장
  declare global { interface Window { __MIGO_PROFILE_CHANNEL__?: ReturnType<typeof supabase.channel> | null; } }
  let profileChannel: ReturnType<typeof supabase.channel> | null = null;

  const setupProfileListener = (userId: string) => {
    // BUG-16 fix: HMR 시 window에 남은 이전 채널 먼저 제거
    if (window.__MIGO_PROFILE_CHANNEL__) {
      supabase.removeChannel(window.__MIGO_PROFILE_CHANNEL__);
      window.__MIGO_PROFILE_CHANNEL__ = null;
    }
    if (profileChannel) supabase.removeChannel(profileChannel);
    profileChannel = supabase.channel(`auth_profile_realtime_${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, async (payload) => {
        if (!globalUser || globalUser.id !== userId) return;
        
        const p = payload.new as any;
        if (p.is_banned || p.banned) {
          toast({ title: i18n.t("auto.g_1068", "이 계정은 이용 수칙 위반으로 영구 정지되었습니다."), variant: "destructive" });
          await supabase.auth.signOut();
          window.location.href = '/login';
          return;
        }

        const bestPhoto = (p.photo_urls && p.photo_urls.length > 0) ? p.photo_urls[0] : p.photo_url;
        const cleanUrl = bestPhoto?.replace(/[?&]t=\d+/, "") || "";
        const bustedUrl = cleanUrl ? `${cleanUrl}?t=${Date.now()}` : "";

        globalUser = {
          ...globalUser,
          photoUrl: bustedUrl || globalUser.photoUrl || "",
          name: p.name || globalUser.name,
          verified: p.verified ?? globalUser.verified,
        // ✅ 실시간 업데이트: nationality 기반 fallback 동일 적용
        setupComplete: p.setup_complete === true
          ? true
          : (p.setup_complete !== false && !!p.nationality)
            ? true
            : (globalUser.setupComplete === true ? true : false)
        };
        notifyAuthListeners();
      })
      .subscribe();
    window.__MIGO_PROFILE_CHANNEL__ = profileChannel; // BUG-16 fix: HMR 쫐적용
  };

  // 로그인 상태가 변할 때마다 리스너 재설정
  authListeners.add(() => {
    if (globalUser?.id) {
      // 이미 해당 유저 채널이 구독중인지 확인
      if (!profileChannel || !profileChannel.topic.includes(globalUser.id)) {
        setupProfileListener(globalUser.id);
      }
    } else {
      if (profileChannel) {
        supabase.removeChannel(profileChannel);
        profileChannel = null;
      }
    }
  });
}
export const useAuth = () => {
  const [internalState, setInternalState] = useState({
    user: globalUser,
    session: globalSession,
    loading: globalLoading,
    sessionReady: globalSessionReady,
  });
  useEffect(() => {
    const handleStateChange = () => {
      setInternalState({
        user: globalUser,
        session: globalSession,
        loading: globalLoading,
        sessionReady: globalSessionReady,
      });
    };
    authListeners.add(handleStateChange);
    // 동기화 보장 (마운트 되는 시점에 이미 글로벌 상태가 업데이트 된 경우)
    handleStateChange();
    return () => {
      authListeners.delete(handleStateChange);
    };
  }, []);
  const signUp = async (email: string, password: string, name: string) => {
    if (!isSupabaseConfigured) return {
      error: null
    }; // mock
    const {
      error
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    });
    // profiles 생성은 handle_new_user DB 트리거가 자동 처리
    return {
      error
    };
  };
  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) return {
      error: null
    };
    const {
      error
    } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return {
      error
    };
  };
  const signOut = async () => {
    if (!isSupabaseConfigured) {
      globalUser = null;
      notifyAuthListeners();
      return;
    }
    globalUser = null;
    notifyAuthListeners();
    await supabase.auth.signOut();
    // CRIT-4 fix: 계정 전환 시 데이터 오염 방지 — 계정별 migo localStorage 키만 정리
    // ⚠️ migo_onboarding_done, migo_eula_agreed, migo_location_consent, migo-lang 은 기기/앱 수준이므로 유지
    const keysToRemove = [
      'migo_my_lat',
      'migo_my_lng',
      'migo_my_loc',           // DiscoverPage GPS 위치명
      'migo_unread_map',
      'migo_dm_data',          // 일일 DM 카운트
      'migo_opened_threads',   // 채팅 열람 목록
      'readNotifs',            // 알림 읽음 상태
      'migo_muted_chats',      // 음소거 채팅
      'migo_removed_chats',    // 숨김 채팅
      'migo_read_stories',     // 읽은 스토리 (계정별 독립 필요)
      'migo_nearby_seen',      // NearbyPage 첫 방문 여부 (다음 계정은 처음부터)
      'migo_mission_date',     // 데일리 미션 날짜
      'migo_today_mission',    // 오늘의 미션 내용
    ];
    keysToRemove.forEach(k => { try { localStorage.removeItem(k); } catch {} });
  };
  const updateProfile = async (updates: Partial<AuthUser>) => {
    if (!isSupabaseConfigured || !globalUser) return {
      error: null
    };
    const {
      error
    } = await supabase.from("profiles").update({
      name: updates.name,
      photo_url: updates.photoUrl
    }).eq("id", globalUser.id);
    if (!error) {
      globalUser = {
        ...globalUser,
        ...updates
      };
      notifyAuthListeners();
    }
    return {
      error
    };
  };

  // 프로필 사진 업데이트 후 전역 user.photoUrl 동기화
  const refreshPhotoUrl = async () => {
    if (!globalUser) return;
    const enriched = await enrichWithProfilePhoto(globalUser);
    globalUser = enriched;
    notifyAuthListeners();
  };
  return {
    user: internalState.user,
    session: internalState.session,
    loading: internalState.loading,
    /** Supabase auth가 완전히 초기화된 뒤 true가 됩니다. REST 쿼리 전 이 값을 체크하세요. */
    sessionReady: internalState.sessionReady,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshPhotoUrl
  };
};
function mapUser(u: User): AuthUser {
  return {
    id: u.id,
    email: u.email ?? "",
    name: u.user_metadata?.name,
    photoUrl: u.user_metadata?.avatar_url || "",
    verified: u.user_metadata?.verified ?? false,
    // ⚠️ undefined로 초기화: enrichWithProfilePhoto 완료 전까지 가드가 오작동하지 않도록 함
    // enrichWithProfilePhoto가 DB에서 setup_complete를 읽어 false로 확정해야 /profile-setup 이동
    setupComplete: undefined
  };
}