import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Sparkles, Compass, Timer, MapPin, X, ShieldAlert } from "lucide-react";

interface DestinyAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => void;
  matchScore?: number;
  distanceMeter?: number;
  hintText?: string;
  photoUrl?: string;
}

export default function DestinyAlertModal({
  isOpen,
  onClose,
  onUnlock,
  matchScore = 96,
  distanceMeter = 3,
  hintText = "",
  photoUrl = "",
}: DestinyAlertModalProps) {
  const { t } = useTranslation();
  const [secondsLeft, setSecondsLeft] = useState(300); // 5분

  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent('migo:ad-overlay', { detail: { active: true } }));
    }
    return () => {
      if (isOpen) {
        window.dispatchEvent(new CustomEvent('migo:ad-overlay', { detail: { active: false } }));
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setSecondsLeft(300);

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose(); // 시간 초과 시 닫기
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md px-6">
        {/* Glowing background burst */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-purple-500/5 to-transparent pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-sm bg-zinc-950 border border-emerald-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] text-center overflow-hidden"
        >
          {/* Subtle gold grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors z-[50] pointer-events-auto cursor-pointer"
          >
            <X size={15} />
          </button>

          {/* Icon Header */}
          <div className="flex justify-center mb-4 relative">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-black shadow-lg shadow-emerald-500/30"
            >
              <Sparkles size={28} className="animate-pulse" />
            </motion.div>
            
            {/* Compass pulsing aura */}
            <span className="absolute inset-0 w-16 h-16 rounded-2xl border border-emerald-500/50 mx-auto animate-ping opacity-30" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-black text-emerald-400 drop-shadow-md tracking-tight mb-1">
            ✦ {t("destiny.title", "운명이 가까이 있어요!")}
          </h2>
          <p className="text-xs text-zinc-400 mb-5">
            {t("destiny.subtitle", "스쳐 지나가기 전에 잡으세요")}
          </p>

          {/* Silhouette Card */}
          <div className="relative w-32 h-32 mx-auto mb-5 rounded-full bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-dashed border-emerald-500/20 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 to-transparent animate-pulse" />
            {photoUrl ? (
              <img
                src={photoUrl}
                alt=""
                className="w-full h-full object-cover filter blur-[10px] scale-110"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <Compass className="w-12 h-12 text-emerald-500/30 animate-spin" style={{ animationDuration: '20s' }} />
            )}
            <div className="absolute bottom-2 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/40 z-10">
              {matchScore}% Match
            </div>
          </div>

          {/* Details */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 mb-6 text-left space-y-3">
            <div className="flex items-center gap-2.5">
              <MapPin size={15} className="text-emerald-500 shrink-0" />
              <span className="text-xs text-zinc-300 font-bold">
                {t("destiny.distance", "현재 거리: 약 {{distance}}m", { distance: distanceMeter })}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Timer size={15} className="text-red-400 shrink-0" />
              <span className="text-xs font-mono text-red-400 font-black">
                {t("destiny.timeLimit", "남은 시간:")} {formatTime(secondsLeft)}
              </span>
            </div>
            <div className="border-t border-zinc-800/50 pt-2.5">
              <div className="text-[10px] text-zinc-500 font-bold mb-1 uppercase tracking-wide">
                {t("destiny.hint", "인연의 힌트")}
              </div>
              <p className="text-xs font-semibold text-zinc-200 leading-relaxed">
                “{hintText || t("radar.defaultAlertHint", "도쿄 거주, 취미가 요가이고 MBTI가 INFJ인 사람")}”
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-2.5">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={(e) => {
                e.stopPropagation();
                onUnlock();
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-500 to-blue-500 text-black font-extrabold text-sm shadow-lg shadow-emerald-500/20 hover:brightness-110 active:brightness-95 transition-all flex items-center justify-center gap-2 z-50 pointer-events-auto cursor-pointer"
            >
              <Sparkles size={16} fill="black" />
              {t("destiny.reveal", "운명 확인하기 (Premium)")}
            </motion.button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="w-full py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-850 text-zinc-400 font-bold text-xs transition-colors z-50 pointer-events-auto cursor-pointer"
            >
              {t("destiny.ignore", "운명 흘려보내기")}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
