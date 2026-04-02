import i18n from "@/i18n";
import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { User, Session } from "@supabase/supabase-js";
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  photoUrl?: string;
  verified?: boolean;
}

// profiles.photo_url 을 DB에서 가져와 user.photoUrl에 반영 (캐시 버스팅 포함)
async function enrichWithProfilePhoto(user: AuthUser): Promise<AuthUser> {
  try {
    const {
      data
    } = await supabase.from("profiles").select("photo_url, photo_urls, name, verified").eq("id", user.id).single();
    if (data) {
      const bestPhoto = (data.photo_urls && data.photo_urls.length > 0) ? data.photo_urls[0] : data.photo_url;
      // 표시용으로만 캐시 버스팅 추가 (DB에는 클린 URL 저장)
      const cleanUrl = bestPhoto?.replace(/[?&]t=\d+/, "") || "";
      const bustedUrl = cleanUrl ? `${cleanUrl}?t=${Date.now()}` : "";
      return {
        ...user,
        photoUrl: bustedUrl || user.photoUrl || "",
        name: data.name || user.name,
        verified: data.verified ?? user.verified
      };
    }
  } catch {}
  return user;
}
let globalSession: Session | null = null;
let globalUser: AuthUser | null = null;
let globalLoading = true;
const authListeners = new Set<() => void>();
const notifyAuthListeners = () => {
  authListeners.forEach(fn => fn());
};
if (!isSupabaseConfigured) {
  // Mock user for development without Supabase
  globalUser = {
    id: "mock-user-1",
    email: "demo@lunaticsgroup.com",
    name: "데모유저9",
    verified: false
  };
  globalLoading = false;
} else {
  // 🚨 앱 최초 실행 시 즉각적으로 로컬 세션을 가져와 '깜빡임' 원천 차단
  (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        if (!globalUser) {
          const base = mapUser(session.user);
          globalSession = session;
          globalUser = base;
          globalLoading = false;
          notifyAuthListeners();
          
          const enriched = await enrichWithProfilePhoto(base);
          if (globalUser?.id === enriched.id) { // 세션이 유지된 상태일 때만
            globalUser = enriched;
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
      globalLoading = false;
      notifyAuthListeners();
    }
  })();

  // 🚨 싱글톤 리스너: 모듈 레벨에서 딱 한 번만 등록해서 Lock 탈취(Race Condition)를 원천 차단합니다.
  supabase.auth.onAuthStateChange(async (event, session) => {
    globalSession = session;
    
    // 로그아웃 시 즉각 정리
    if (event === 'SIGNED_OUT' || !session?.user) {
      globalUser = null;
      globalLoading = false;
      localStorage.removeItem('migo_my_lat');
      localStorage.removeItem('migo_my_lng');
      notifyAuthListeners();
      return;
    }

    if (session?.user) {
      const base = mapUser(session.user);
      // 🔥 [중요] Cold start 응답 지연 시 화면이 비어 보이는 것을 막기 위해
      // DB 통신(enrichWithProfilePhoto) 전에 세션 기본 정보를 먼저 전역에 세팅!
      globalUser = base;
      globalLoading = false;
      notifyAuthListeners();

      // 백그라운드에서 DB 프로필(이름, 사진)을 조회 후 재동기화
      const enriched = await enrichWithProfilePhoto(base);
      globalUser = enriched;
      notifyAuthListeners();
    }
  });
}
export const useAuth = () => {
  const [internalState, setInternalState] = useState({
    user: globalUser,
    session: globalSession,
    loading: globalLoading
  });
  useEffect(() => {
    const handleStateChange = () => {
      setInternalState({
        user: globalUser,
        session: globalSession,
        loading: globalLoading
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
    verified: u.user_metadata?.verified ?? false
  };
}