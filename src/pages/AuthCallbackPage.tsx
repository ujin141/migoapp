import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";

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
    // 1. URL hash 에러 확인 (Supabase OAuth 에러 리다이렉트 대응)
    const hash = window.location.hash;
    if (hash && hash.includes("error=")) {
      const params = new URLSearchParams(hash.substring(1));
      const errorDesc = params.get("error_description");
      if (errorDesc && (errorDesc.includes("already") || errorDesc.includes("exists") || errorDesc.includes("saving new user") || errorDesc.includes("Database error"))) {
        toast({
          title: i18n.t("auto.z_\uC911\uBCF5\uAC00\uC785\uCC28\uB2E8_842"),
          description: i18n.t("auto.z_\uC774\uBBF8\uD574\uB2F9\uC774\uBA54\uC77C\uB85C\uAC00\uC785_843"),
          variant: "destructive"
        });
      } else {
        toast({
          title: i18n.t("auto.z_\uC18C\uC15C\uB85C\uADF8\uC778\uC5D0\uB7EC_844"),
          description: errorDesc ? decodeURIComponent(errorDesc).replace(/\+/g, ' ') : i18n.t("auto.z_\uC54C\uC218\uC5C6\uB294\uC624\uB958\uAC00\uBC1C\uC0DD\uD588_845"),
          variant: "destructive"
        });
      }
      navigate("/login", {
        replace: true
      });
      return;
    }

    // 2. 정상 해시(+access_token)인 경우 Supabase가 자동 파싱하여 세션 설정함
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      if (session) {
        navigate("/", {
          replace: true
        });
      } else {
        // 세션이 아직 없으면 onAuthStateChange로 대기
        const {
          data: {
            subscription
          }
        } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session) {
            subscription.unsubscribe();
            navigate("/", {
              replace: true
            });
          }
        });
        // 5초 타임아웃 — 실패 시 로그인 페이지로
        setTimeout(() => {
          subscription.unsubscribe();
          navigate("/login", {
            replace: true
          });
        }, 5000);
      }
    });
  }, [navigate]);
  return <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">{t("auto.z_autoz\uB85C\uADF8\uC778\uCC98\uB9AC_846")}</p>
      </div>
    </div>;
};
export default AuthCallbackPage;