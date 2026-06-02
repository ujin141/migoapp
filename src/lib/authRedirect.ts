import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

const AUTH_PROFILE_HINT_KEY = "migo_auth_profile_hint";
const AUTH_PROFILE_HINT_TTL = 60_000;

type AuthProfileHint = {
  userId: string;
  name?: string;
  photoUrl?: string;
  verified?: boolean;
  setupComplete?: boolean;
  createdAt: number;
};

const hasProfilePhoto = (profile: any) =>
  !!profile?.photo_url || (Array.isArray(profile?.photo_urls) && profile.photo_urls.length > 0);

const bestProfilePhoto = (profile: any) =>
  Array.isArray(profile?.photo_urls) && profile.photo_urls.length > 0
    ? profile.photo_urls[0]
    : profile?.photo_url || "";

export const saveAuthProfileHint = (hint: Omit<AuthProfileHint, "createdAt">) => {
  try {
    sessionStorage.setItem(AUTH_PROFILE_HINT_KEY, JSON.stringify({ ...hint, createdAt: Date.now() }));
  } catch {
    // sessionStorage can be unavailable in rare webview states.
  }
};

export const getAuthProfileHint = (userId: string): AuthProfileHint | null => {
  try {
    const raw = sessionStorage.getItem(AUTH_PROFILE_HINT_KEY);
    if (!raw) return null;
    const hint = JSON.parse(raw) as AuthProfileHint;
    if (hint.userId !== userId || Date.now() - hint.createdAt > AUTH_PROFILE_HINT_TTL) return null;
    return hint;
  } catch {
    return null;
  }
};

export const clearAuthProfileHint = () => {
  try {
    sessionStorage.removeItem(AUTH_PROFILE_HINT_KEY);
  } catch {
    // sessionStorage can be unavailable in rare webview states.
  }
};

export const getPostAuthRoute = async (session?: Session | null) => {
  const activeSession = session ?? (await supabase.auth.getSession()).data.session;
  const userId = activeSession?.user?.id;
  if (!userId) return "/login";

  let localDone = false;
  try {
    localDone = localStorage.getItem(`migo_setup_done_${userId}`) === '1';
  } catch {}

  const profileQuery = supabase
    .from("profiles")
    .select("setup_complete, photo_url, photo_urls, name, verified")
    .eq("id", userId)
    .maybeSingle();

  const { data: profile } = await Promise.race([
    profileQuery,
    new Promise<{ data: null }>((resolve) => setTimeout(() => resolve({ data: null }), 2200)),
  ]);

  // DB에서 명확히 setup_complete가 false로 조회되지 않는 한(true이거나 조회 실패 시),
  // 로컬 캐시가 있거나 또는 true로 간주해 기존 유저가 셋팅창으로 튕기는 버그를 막습니다.
  const setupComplete = profile ? profile.setup_complete === true : (localDone || true);
  saveAuthProfileHint({
    userId,
    name: profile?.name || activeSession.user.user_metadata?.name,
    photoUrl: bestProfilePhoto(profile) || activeSession.user.user_metadata?.avatar_url || "",
    verified: profile?.verified ?? activeSession.user.user_metadata?.verified ?? false,
    setupComplete,
  });

  return setupComplete ? "/" : "/profile-setup";
};
