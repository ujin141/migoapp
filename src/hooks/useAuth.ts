import i18n from "@/i18n";
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
    // 타임아웃 추가: 4초 이상 걸리면 실패 반환
    const timeoutPromise = new Promise<{ data: null, error: any }>((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), 4000)
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
      // 표시용으로만 캐시 버스팅 추가 (DB에는 클린 URL 저장)
      const cleanUrl = bestPhoto?.replace(/[?&]t=\d+/, "") || "";
      const bustedUrl = cleanUrl ? `${cleanUrl}?t=${Date.now()}` : "";
      // setup_complete만을 완료 기준으로 사용 (nationality 우회 제거)
      // nationality가 있어도 setup_complete=false면 반드시 프로필 설정을 완료해야 함
      const isActuallyComplete = data.setup_complete === true;
      return {
        ...user,
        photoUrl: bustedUrl || user.photoUrl || "",
        name: data.name || user.name,
        verified: data.verified ?? user.verified,
        setupComplete: isActuallyComplete
      };
    }
  } catch (err) {
    console.error("enrichWithProfilePhoto error:", err);
  }
  // 프로필 조회 실패(네트워크 오류 등): setupComplete를 undefined로 유지
  // false로 강제하면 기존 유저가 DB 오류 시 /profile-setup으로 튕겨나가는 버그 발생
  // App.tsx 가드는 setupComplete === false일 때만 리다이렉트하므로 안전
  return { ...user, setupComplete: user.setupComplete };
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
        globalUser = enriched;
        globalLoading = false;
        notifyAuthListeners();
      } else {
        globalUser = globalUser ? { ...globalUser, ...base } : base;
        globalLoading = false;
        notifyAuthListeners();
      }
    }
  });

  // 🚨 프로필 실시간 데이터 갱신 리스너 (글로벌 1회 등록)
  let profileChannel: ReturnType<typeof supabase.channel> | null = null;
  
  const setupProfileListener = (userId: string) => {
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
          setupComplete: p.setup_complete ?? globalUser.setupComplete
        };
        notifyAuthListeners();
      })
      .subscribe();
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
    localStorage.removeItem('migo_my_lat');
    localStorage.removeItem('migo_my_lng');
    localStorage.removeItem('migo_unread_map');
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