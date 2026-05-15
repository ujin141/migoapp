import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import { Browser } from "@capacitor/browser";

/**
 * /auth/callback
 * Supabase OAuth (Google 등) 리다이렉트 후 도착하는 페이지.
 * URL hash에 담긴 access_token을 supabase가 자동 처리하고,
 * 세션이 확인되면 홈("/")으로 이동합니다.
 */
const AuthCallbackPage = () => {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  useEffect(() => {
    const fullUrl = window.location.href;
    const fullHash = window.location.hash; // HashRouter: #/auth/callback#access_token=...

    // 1. URL에서 에러 확인 (hash 또는 query string)
    if (fullUrl.includes("error=") || fullHash.includes("error=")) {
      // HashRouter 이중해시에서 에러 파라미터 추출
      const hashParts = fullHash.split('#');
      const errorFragment = hashParts.length > 2 ? hashParts[hashParts.length - 1] : hashParts[1] || '';
      const searchParams = new URLSearchParams(window.location.search || errorFragment);
      const errorDesc = searchParams.get("error_description");
      if (errorDesc && (errorDesc.includes("already") || errorDesc.includes("exists") || errorDesc.includes("saving new user") || errorDesc.includes("Database error"))) {
        toast({
          title: i18n.t("auto.z_\uC911\uBCF5\uAC00\uC785\uCC28\uB2E8_842", "\uC911\uBCF5\uAC00\uC785\uCC28\uB2E8"),
          description: i18n.t("auto.z_\uC774\uBBF8\uD574\uB2F9\uC774\uBA54\uC77C\uB85C\uAC00\uC785_843", "\uC774\uBBF8\uD574\uB2F9\uC774\uBA54\uC77C\uB85C\uAC00\uC785"),
          variant: "destructive"
        });
      } else {
        toast({
          title: i18n.t("auto.z_\uC18C\uC15C\uB85C\uADF8\uC778\uC5D0\uB7EC_844", "\uC18C\uC15C\uB85C\uADF8\uC778\uC5D0\uB7EC"),
          description: errorDesc ? decodeURIComponent(errorDesc).replace(/\+/g, ' ') : i18n.t("auto.z_\uC54C\uC218\uC5C6\uB294\uC624\uB958\uAC00\uBC1C\uC0DD\uD588_845", "\uC54C\uC218\uC5C6\uB294\uC624\uB958\uAC00\uBC1C\uC0DD\uD588"),
          variant: "destructive"
        });
      }
      navigate("/login", { replace: true });
      return;
    }

    // 2. PKCE 코드 흐름: query string에 ?code= 가 있는 경우
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    // 3. 암시적(Implicit) 흐름: HashRouter 이중해시에서 access_token 추출
    //    URL 형태: /#/auth/callback#access_token=...&refresh_token=...
    const hashParts = fullHash.split('#');
    const tokenFragment = hashParts.length > 2 ? hashParts[hashParts.length - 1] : '';
    const tokenParams = new URLSearchParams(tokenFragment);
    const access_token = tokenParams.get("access_token");
    const refresh_token = tokenParams.get("refresh_token");

    // BUG-H5 fix: async 내부 return은 useEffect cleanup으로 전달되지 않으므로
    // cleanup 참조를 외부에 두고 할당
    let cleanupTimeoutId: ReturnType<typeof setTimeout> | undefined;
    let cleanupSubscription: { unsubscribe: () => void } | undefined;

    const handleAuth = async () => {
      try {
        // PKCE 코드 교환
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            Browser.close().catch(() => {});
            navigate("/", { replace: true });
            return;
          }
          console.error("[AuthCallback] Code exchange failed:", error);
        }

        // 암시적 흐름: 토큰 직접 설정
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (!error) {
            Browser.close().catch(() => {});
            navigate("/", { replace: true });
            return;
          }
          console.error("[AuthCallback] setSession failed:", error);
        }

        // 위 두 방식 모두 해당 안 되면 기존 세션 체크
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          Browser.close().catch(() => {});
          navigate("/", { replace: true });
          return;
        }

        // 세션이 아직 없으면 onAuthStateChange로 대기
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session) {
            clearTimeout(cleanupTimeoutId);
            subscription.unsubscribe();
            Browser.close().catch(() => {});
            navigate("/", { replace: true });
          }
        });
        cleanupSubscription = subscription;
        // 8초 타임아웃 — 실패 시 로그인 페이지로 (5초→8초: 네트워크 느린 환경 대응)
        cleanupTimeoutId = setTimeout(() => {
          subscription.unsubscribe();
          console.warn("[AuthCallback] Timeout - redirecting to login");
          navigate("/login", { replace: true });
        }, 8000);
      } catch (err) {
        console.error("[AuthCallback] Unexpected error:", err);
        navigate("/login", { replace: true });
      }
    };

    handleAuth();

    // 컴포넌트 언마운트 시 메모리 누수 방지
    return () => {
      if (cleanupTimeoutId) clearTimeout(cleanupTimeoutId);
      if (cleanupSubscription) cleanupSubscription.unsubscribe();
    };
  }, [navigate]);
  return <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground truncate">{t("auto.g_0577", "로그인처리")}</p>
      </div>
    </div>;
};
export default AuthCallbackPage;