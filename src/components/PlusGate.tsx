import { useState, ReactNode } from "react";
import { Crown, Lock, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import MigoPlusModal from "@/components/MigoPlusModal";

type Tier = "plus" | "premium";

interface PlusGateProps {
  /** 잠금 대상 콘텐츠 */
  children: ReactNode;
  /** 잠금 여부 (true = 잠김) */
  locked: boolean;
  /** 요구 티어 */
  tier?: Tier;
  /** 잠금 레이블 (기본값: 자동) */
  label?: string;
  /** 블러 강도 (기본 xl) */
  blur?: "sm" | "md" | "lg" | "xl";
  /** 오버레이 모드: 'full'=전체 덮기, 'banner'=하단 배너, 'inline'=인라인 블록 */
  mode?: "full" | "banner" | "inline";
  /** 클릭 시 모달 대신 외부 핸들러 */
  onLockedClick?: () => void;
}

/**
 * PlusGate — 구독 플랜에 따라 콘텐츠를 잠그는 범용 게이트 컴포넌트
 *
 * 사용 예:
 * ```tsx
 * <PlusGate locked={!isPlus} tier="plus">
 *   <SensitiveFeature />
 * </PlusGate>
 * ```
 */
const PlusGate = ({
  children,
  locked,
  tier = "plus",
  label,
  blur = "xl",
  mode = "full",
  onLockedClick,
}: PlusGateProps) => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);

  const defaultLabel =
    tier === "premium"
      ? t("gate.premiumOnly", "Premium 전용")
      : t("gate.plusOnly", "Plus 전용");

  const displayLabel = label ?? defaultLabel;

  const Icon = tier === "premium" ? Crown : Lock;
  const iconColor = tier === "premium" ? "text-yellow-400" : "text-primary";
  const badgeClass =
    tier === "premium"
      ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-black"
      : "bg-gradient-to-r from-violet-600 to-indigo-500 text-white";

  const blurMap = { sm: "blur-sm", md: "blur-md", lg: "blur-lg", xl: "blur-xl" };

  const handleClick = () => {
    if (!locked) return;
    onLockedClick ? onLockedClick() : setShowModal(true);
  };

  if (!locked) return <>{children}</>;

  /* ── inline 모드: 콘텐츠를 블러 처리 + 위에 배지만 얹기 ── */
  if (mode === "inline") {
    return (
      <>
        <div className="relative" onClick={handleClick}>
          <div className={`pointer-events-none select-none ${blurMap[blur]}`}>{children}</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              whileTap={{ scale: 0.94 }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-extrabold shadow-lg cursor-pointer ${badgeClass}`}
            >
              <Icon size={12} />
              {displayLabel}
            </motion.span>
          </div>
        </div>
        <MigoPlusModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  /* ── banner 모드: 콘텐츠 아래 고정 배너 ── */
  if (mode === "banner") {
    return (
      <>
        <div className="relative">
          <div className={`pointer-events-none select-none ${blurMap[blur]}`}>{children}</div>
          <div
            onClick={handleClick}
            className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-black/80 to-black/60 backdrop-blur-md cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Icon size={18} className={iconColor} />
              <span className="text-white text-sm font-bold">{displayLabel}</span>
            </div>
            <motion.span
              whileTap={{ scale: 0.94 }}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold ${badgeClass}`}
            >
              <Zap size={10} />
              {t("gate.upgrade", "업그레이드")}
            </motion.span>
          </div>
        </div>
        <MigoPlusModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  /* ── full 모드 (기본): 전체 오버레이 ── */
  return (
    <>
      <div className="relative overflow-hidden" onClick={handleClick}>
        <div className={`pointer-events-none select-none ${blurMap[blur]}`}>{children}</div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-md cursor-pointer z-10 gap-3"
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl ${tier === "premium" ? "bg-gradient-to-br from-yellow-400 to-amber-500" : "bg-gradient-to-br from-violet-600 to-indigo-500"}`}>
            <Icon size={22} className="text-white drop-shadow" />
          </div>
          <motion.span
            whileTap={{ scale: 0.94 }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-extrabold shadow-lg ${badgeClass}`}
          >
            <Zap size={12} />
            {displayLabel}
          </motion.span>
        </motion.div>
      </div>
      <MigoPlusModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

export default PlusGate;
