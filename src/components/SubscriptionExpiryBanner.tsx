/**
 * SubscriptionExpiryBanner.tsx
 * 구독 만료가 7일 이내인 구독 유저에게 표시되는 상단 경고 배너.
 * - D-7 ~ D-1: 주황/빨강 그라데이션 배너 + 갱신 CTA
 * - 이미 dismiss한 경우 당일 기준 sessionStorage로 숨김 처리
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Crown, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/context/SubscriptionContext";
import { supabase } from "@/lib/supabaseClient";
import { useTranslation } from "react-i18next";

interface SubscriptionExpiryBannerProps {
  onOpenPlusModal: () => void;
}

export default function SubscriptionExpiryBanner({ onOpenPlusModal }: SubscriptionExpiryBannerProps) {
  const { user } = useAuth();
  const { isPlus, isPremium } = useSubscription();
  const { t } = useTranslation();

  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [plan, setPlan] = useState<"plus" | "premium">("plus");

  useEffect(() => {
    if (!user || (!isPlus && !isPremium)) return;

    // 당일 dismiss 확인
    const today = new Date().toISOString().split("T")[0];
    const dismissKey = `migo_expiry_dismissed_${today}`;
    if (sessionStorage.getItem(dismissKey)) {
      setDismissed(true);
      return;
    }

    supabase
      .from("profiles")
      .select("plus_expires_at, plan")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (!data?.plus_expires_at) return; // 만료일 없으면 (영구) 표시 안 함
        const expiry = new Date(data.plus_expires_at);
        const now = new Date();
        const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diff >= 0 && diff <= 7) {
          setDaysLeft(diff);
          setPlan(data.plan === "premium" ? "premium" : "plus");
        }
      });
  }, [user, isPlus, isPremium]);

  const handleDismiss = () => {
    const today = new Date().toISOString().split("T")[0];
    sessionStorage.setItem(`migo_expiry_dismissed_${today}`, "1");
    setDismissed(true);
  };

  if (dismissed || daysLeft === null) return null;

  // 색상: D-3 이하는 빨강, 그 이상은 주황
  const isUrgent = daysLeft <= 3;
  const gradientClass = isUrgent
    ? "from-red-500 to-rose-600"
    : "from-orange-400 to-amber-500";

  const planLabel = plan === "premium" ? "Premium" : "Plus";

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div
            className={`bg-gradient-to-r ${gradientClass} px-4 py-2.5 flex items-center gap-3`}
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)" }}
          >
            {/* 아이콘 */}
            <div className="shrink-0">
              {isUrgent ? (
                <AlertTriangle size={16} className="text-white" />
              ) : (
                <Crown size={16} className="text-white" />
              )}
            </div>

            {/* 텍스트 */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-extrabold leading-tight truncate">
                {daysLeft === 0
                  ? t("expiry.today", `Migo ${planLabel} 오늘 만료됩니다!`)
                  : t("expiry.daysLeft", `Migo ${planLabel} D-${daysLeft} 만료 예정`)}
              </p>
              <p className="text-white/80 text-[10px] truncate">
                {t("expiry.renewNow", "지금 갱신하면 혜택이 이어집니다 →")}
              </p>
            </div>

            {/* 갱신 버튼 */}
            <button
              onClick={() => {
                handleDismiss();
                onOpenPlusModal();
              }}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/20 border border-white/30 text-white text-[11px] font-extrabold active:scale-95 transition-transform"
            >
              <RefreshCw size={11} />
              {t("expiry.renew", "갱신")}
            </button>

            {/* 닫기 */}
            <button
              onClick={handleDismiss}
              className="shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"
            >
              <X size={12} className="text-white" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
