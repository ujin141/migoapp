import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import siteLogo from "@/assets/site-logo.png";
import { supabase } from "@/lib/supabaseClient";

const SplashPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    let redirected = false;

    const doRedirect = (hasSession: boolean) => {
      if (redirected) return;
      redirected = true;
      if (hasSession) {
        // 기존 로그인 세션이 있으면 바로 홈으로
        navigate("/", { replace: true });
      } else {
        // 세션 없으면 온보딩/로그인으로
        const hasSeenOnboarding = localStorage.getItem("migo_onboarding_done");
        navigate(hasSeenOnboarding ? "/login" : "/onboarding", { replace: true });
      }
    };

    // 저장된 세션(토큰) 즉시 체크
    supabase.auth.getSession().then(({ data: { session } }) => {
      doRedirect(!!session);
    }).catch(() => {
      doRedirect(false);
    });

    // 최대 3초 안에 세션 체크가 완료 안 되면 로그인으로 fallback
    const fallback = setTimeout(() => {
      doRedirect(false);
    }, 3000);

    return () => clearTimeout(fallback);
  }, [navigate]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Background blobs */}
      <motion.div
        className="absolute w-80 h-80 rounded-full bg-primary/20 blur-3xl"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1.4, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{ top: "-10%", left: "-20%" }}
      />
      <motion.div
        className="absolute w-64 h-64 rounded-full bg-accent/20 blur-3xl"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1.2, opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
        style={{ bottom: "0%", right: "-10%" }}
      />

      {/* Site Logo */}
      <motion.div
        className="z-10 flex flex-col items-center gap-1"
        initial={{ opacity: 0, scale: 0.7, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, type: "spring", damping: 18, stiffness: 180 }}
      >
        <motion.img
          src={siteLogo}
          alt="Migo"
          className="h-32 object-contain"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        />
        <motion.p
          className="text-sm text-muted-foreground font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {t('splash.tagline')}
        </motion.p>
      </motion.div>

      {/* Loading dots */}
      <motion.div
        className="absolute bottom-16 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default SplashPage;
