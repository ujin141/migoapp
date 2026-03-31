import { useTranslation } from "react-i18next";
import { Shield, CheckCircle } from "lucide-react";

type VerifyLevel = "basic" | "id" | "top" | "gold" | "none";

interface VerifyBadgeProps {
  level?: VerifyLevel | string;
  size?: "sm" | "md";
}

/**
 * VerifyBadge — shows inline trust verification badge
 * Usage: <VerifyBadge level="top" />  or  <VerifyBadge level="basic" size="sm" />
 */
const VerifyBadge = ({ level, size = "md" }: VerifyBadgeProps) => {
  const { t } = useTranslation();

  // CONFIG must be inside component so t() is available
  const CONFIG = {
    basic: {
      label: t("verifyBadge.basic"),
      emoji: "✅",
      className: "bg-sky-500/20 border-sky-500/40 text-sky-400",
      icon: <Shield size={9} />,
    },
    gold: {
      label: t("verifyBadge.basic"),
      emoji: "✅",
      className: "bg-amber-500/20 border-amber-500/40 text-amber-400",
      icon: <CheckCircle size={9} />,
    },
    id: {
      label: t("verifyBadge.id"),
      emoji: "🪪",
      className: "bg-violet-500/20 border-violet-500/40 text-violet-400",
      icon: <CheckCircle size={9} />,
    },
    top: {
      label: t("verifyBadge.top"),
      emoji: "🏆",
      className: "bg-amber-500/20 border-amber-500/40 text-amber-400",
      icon: <Shield size={9} />,
    },
  };

  if (!level || level === "none") return null;
  const cfg = CONFIG[level as keyof typeof CONFIG];
  if (!cfg) return null;

  if (size === "sm") {
    return (
      <span
        title={`${t("verif.title")}: ${cfg.label}`}
        className={`inline-flex items-center justify-center w-4 h-4 rounded-full border ${cfg.className} shrink-0`}
      >
        {cfg.icon}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-extrabold shrink-0 ${cfg.className}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

export default VerifyBadge;
