import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { LEVEL_COLORS, LEVEL_EMOJI, getNextLevel } from "@/lib/streakService";
import type { StreakData } from "@/lib/streakService";

interface StreakBadgeProps {
  data: StreakData;
  compact?: boolean; // true면 아이콘+숫자만
  className?: string;
}

export default function StreakBadge({
  data,
  compact = false,
  className = ""
}: StreakBadgeProps) {
  const {
    t
  } = useTranslation();
  const [showDetail, setShowDetail] = useState(false);
  const next = getNextLevel(data.level);
  const progress = next ? Math.min(100, Math.round(data.currentStreak / next.daysRequired * 100)) : 100;
  const emoji = LEVEL_EMOJI[data.level];
  const gradient = LEVEL_COLORS[data.level];
  
  if (compact) {
    return <button onClick={() => setShowDetail(true)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-xs font-bold shadow-sm ${className}`} style={{
      background: "var(--gradient-primary)"
    }}>
        <span>{emoji}</span>
        <span className="text-[11px] truncate">🔥 {data.currentStreak}{t("auto.z_\uC77C_1229", "\uC77C")}</span>
      </button>;
  }
  
  return <>
      <button onClick={() => setShowDetail(true)} className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gradient-to-r ${gradient} shadow-card ${className}`}>
        <span className="text-base">{emoji}</span>
        <div className="text-left">
          <p className="text-[10px] font-extrabold text-white/80 uppercase tracking-wide">{data.level}</p>
          <p className="text-sm font-black text-white leading-tight truncate">🔥 {data.currentStreak}{t("auto.z_\uC77C\uC5F0\uC18D_1230", "\uC77C\uC5F0\uC18D")}</p>
        </div>
      </button>

      {/* Detail popup */}
      <AnimatePresence>
        {showDetail && <motion.div className="fixed inset-0 z-[9999] flex items-end justify-center" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} onClick={() => setShowDetail(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div className="relative z-10 w-full max-w-sm mx-4 mb-8 bg-card rounded-3xl p-6 shadow-float" initial={{
          y: 60,
          opacity: 0
        }} animate={{
          y: 0,
          opacity: 1
        }} exit={{
          y: 60,
          opacity: 0
        }} onClick={e => e.stopPropagation()}>
              {/* 레벨 배지 */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-3xl mb-4 mx-auto shadow-float`}>
                {emoji}
              </div>

              <h2 className="text-center text-lg font-black text-foreground mb-1">{data.level}</h2>
              <p className="text-center text-xs text-muted-foreground mb-5 truncate">{t("auto.z_Migo\uC5EC\uD589\uC790\uB4F1\uAE09_1231", "Migo\uC5EC\uD589\uC790\uB4F1\uAE09")}</p>

              {/* 통계 */}
              <div className="grid grid-cols-3 gap-3 mb-5 truncate">
                {[{
              label: t("auto.z_\uD604\uC7AC\uC2A4\uD2B8\uB9AD_1232", "\uD604\uC7AC\uC2A4\uD2B8\uB9AD"),
              value: `${data.currentStreak} days`,
              icon: "🔥"
            }, {
              label: t("auto.z_\uCD5C\uC7A5\uC2A4\uD2B8\uB9AD_1234", "\uCD5C\uC7A5\uC2A4\uD2B8\uB9AD"),
              value: `${data.longestStreak} days`,
              icon: "⭐"
            }, {
              label: t("auto.z_\uCD1D\uBC29\uBB38_1236", "\uCD1D\uBC29\uBB38"),
              value: `${data.totalDays} days`,
              icon: "📅"
            }].map(s => <div key={s.label} className="bg-muted rounded-2xl p-3 text-center">
                    <p className="text-lg">{s.icon}</p>
                    <p className="text-sm font-black text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>)}
              </div>

              {/* 다음 레벨 진행도 */}
              {next && <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground font-medium truncate">{t("auto.z_\uB2E4\uC74C\uB808\uBCA8_1238", "\uB2E4\uC74C\uB808\uBCA8")}{next.level}</span>
                    <span className="font-bold text-foreground truncate">{data.currentStreak} / {next.daysRequired}{t("auto.z_\uC77C_1239", "\uC77C")}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div className={`h-full rounded-full bg-gradient-to-r ${gradient}`} initial={{
                width: 0
              }} animate={{
                width: `${progress}%`
              }} transition={{
                duration: 0.6,
                ease: "easeOut"
              }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 text-center truncate">
                    {next.daysRequired - data.currentStreak}{t("auto.z_\uC77C\uB354\uC5F0\uC18D\uC811\uC18D\uD558\uBA74_1240", "\uC77C\uB354\uC5F0\uC18D\uC811\uC18D\uD558\uBA74")}{LEVEL_EMOJI[next.level]} {next.level}{t("auto.z_\uB2EC\uC131_1241", "\uB2EC\uC131")}</p>
                </div>}
              {!next && <p className="text-center text-sm font-bold text-amber-500 truncate">{t("auto.z_\uCD5C\uACE0\uB4F1\uAE09\uB2EC\uC131_1242", "\uCD5C\uACE0\uB4F1\uAE09\uB2EC\uC131")}</p>}

              <button onClick={() => setShowDetail(false)} className="mt-5 w-full py-3 rounded-2xl bg-muted text-muted-foreground text-sm font-bold">{t("auto.z_\uB2EB\uAE30_1243", "\uB2EB\uAE30")}</button>
            </motion.div>
          </motion.div>}
      </AnimatePresence>
    </>;
}