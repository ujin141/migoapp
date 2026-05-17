/**
 * CancelGuardModal.tsx
 *
 * "구독 관리 · App Store에서 취소하기" 링크를 클릭할 때 먼저 표시되는
 * 이탈 방지 팝업. 취소 전 남은 혜택을 보여주고 계속 이용을 유도.
 *
 * 사용법:
 *   const [showGuard, setShowGuard] = useState(false);
 *   <CancelGuardModal
 *     isOpen={showGuard}
 *     onClose={() => setShowGuard(false)}
 *     onProceed={() => { setShowGuard(false); window.open(APPLE_SUB_URL); }}
 *     onKeep={() => setShowGuard(false)}
 *   />
 */
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Star, Zap, Heart, Globe, Filter, ExternalLink, X } from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";
import { useTranslation } from "react-i18next";

interface CancelGuardModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** "그래도 취소하기" 클릭 시 실제 App Store URL 열기 */
  onProceed: () => void;
  /** "계속 이용하기" 클릭 시 */
  onKeep: () => void;
}

const PERKS = [
  { icon: Heart,  label: "일일 좋아요 50개" },
  { icon: Star,   label: "슈퍼라이크 5개/일" },
  { icon: Filter, label: "고급 필터 (MBTI·언어·나이)" },
  { icon: Globe,  label: "글로벌 전세계 매칭" },
  { icon: Zap,    label: "프로필 부스트 월 1회 무료" },
];

export default function CancelGuardModal({
  isOpen,
  onClose,
  onProceed,
  onKeep,
}: CancelGuardModalProps) {
  const { isPlus, isPremium, superLikesLeft, boostsCount } = useSubscription();
  const { t } = useTranslation();

  const planLabel = isPremium ? "Premium" : "Plus";
  const planColor = isPremium
    ? "from-amber-500 to-orange-500"
    : "from-emerald-500 to-blue-500";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* 배경 블러 */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <motion.div
            className="relative z-10 w-full max-w-sm bg-card rounded-3xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.85, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 상단 그라데이션 헤더 */}
            <div className={`bg-gradient-to-r ${planColor} px-5 pt-8 pb-6 text-center`}>
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
                <Crown size={28} className="text-white" />
              </div>
              <h2 className="text-lg font-extrabold text-white">
                {t("cancelGuard.title", `정말 Migo ${planLabel}를 해지할까요?`)}
              </h2>
              <p className="text-white/75 text-xs mt-1">
                {t("cancelGuard.subtitle", "취소 시 아래 혜택이 즉시 사라집니다")}
              </p>
            </div>

            {/* 잃게 되는 혜택 */}
            <div className="px-5 py-4 space-y-2.5">
              {PERKS.map((perk, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-destructive/5 border border-destructive/15"
                >
                  <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                    <perk.icon size={14} className="text-destructive" />
                  </div>
                  <span className="text-sm font-semibold text-foreground flex-1">
                    {t(`cancelGuard.perk${i}`, perk.label)}
                  </span>
                  <span className="text-[10px] font-extrabold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                    {t("cancelGuard.lost", "소멸")}
                  </span>
                </div>
              ))}

              {/* 현재 남은 아이템 강조 */}
              {(superLikesLeft > 0 || boostsCount > 0) && (
                <div className="mt-1 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs font-extrabold text-amber-600 text-center">
                    ⚠️ {t("cancelGuard.remaining", "현재 보유 중인 아이템도 사라집니다")}
                  </p>
                  <div className="flex justify-center gap-4 mt-1.5">
                    {superLikesLeft > 0 && (
                      <span className="text-xs text-amber-700 font-bold">
                        ⭐ 슈퍼라이크 {superLikesLeft}개
                      </span>
                    )}
                    {boostsCount > 0 && (
                      <span className="text-xs text-amber-700 font-bold">
                        ⚡ 부스트 {boostsCount}개
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* CTA 버튼 */}
            <div className="px-5 pb-6 space-y-2.5">
              {/* 계속 이용하기 — 주 CTA */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onKeep}
                className={`w-full py-3.5 rounded-2xl bg-gradient-to-r ${planColor} text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-2`}
              >
                <Crown size={16} />
                {t("cancelGuard.keepBtn", `Migo ${planLabel} 계속 이용하기`)}
              </motion.button>

              {/* 그래도 취소하기 — 보조 CTA (덜 눈에 띄게) */}
              <button
                onClick={onProceed}
                className="w-full py-2.5 rounded-2xl text-muted-foreground text-xs font-medium flex items-center justify-center gap-1.5 active:opacity-70"
              >
                <ExternalLink size={11} />
                {t("cancelGuard.proceedBtn", "그래도 App Store에서 취소하기")}
              </button>
            </div>

            {/* X 닫기 */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"
            >
              <X size={13} className="text-white" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
