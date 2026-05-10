import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { Gift, Flame, X, Check, Star, Zap, Crown } from "lucide-react";

interface CheckinResult {
  already: boolean;
  streak: number;
  reward: string;
}

const REWARD_INFO: Record<string, { icon: string; label: string; color: string }> = {
  badge_only:    { icon: "✅", label: "출석 도장 완료!", color: "from-slate-400 to-slate-500" },
  super_like_1:  { icon: "⭐", label: "슈퍼라이크 1개", color: "from-yellow-400 to-amber-500" },
  boost_30m:     { icon: "⚡", label: "프로필 부스트 30분", color: "from-purple-500 to-pink-500" },
};

export default function DailyCheckinModal() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [animPhase, setAnimPhase] = useState<"enter" | "reward" | "done">("enter");

  // 앱 진입 시 자동 출석체크
  useEffect(() => {
    if (!user) return;

    const checkedToday = sessionStorage.getItem("migo_checkin_today");
    if (checkedToday === new Date().toISOString().split("T")[0]) return;

    // touch_active + 출석체크 (async IIFE로 안전하게 실행)
    (async () => {
      try {
        await supabase.rpc("touch_active", { p_user_id: user.id });
      } catch {
        // touch_active 실패해도 무시
      }
      try {
        const { data, error } = await supabase.rpc("do_daily_checkin", { p_user_id: user.id });
        if (error || !data) return;
        const d = data as CheckinResult;
        setResult(d);
        sessionStorage.setItem("migo_checkin_today", new Date().toISOString().split("T")[0]);
        // 이미 체크인한 경우 모달 안 띄움
        if (!d.already) {
          setShow(true);
          setAnimPhase("enter");
          setTimeout(() => setAnimPhase("reward"), 800);
        }
      } catch {
        // 출석체크 실패 무시
      }
    })();
  }, [user]);

  const close = useCallback(() => {
    setAnimPhase("done");
    setTimeout(() => setShow(false), 300);
  }, []);

  if (!show || !result) return null;

  const reward = REWARD_INFO[result.reward] || REWARD_INFO.super_like_1;
  const streakDays = [1, 2, 3, 4, 5, 6, 7];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="relative w-full max-w-sm bg-card rounded-3xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.7, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header gradient */}
            <div className={`h-32 bg-gradient-to-br ${reward.color} flex items-center justify-center relative overflow-hidden`}>
              {/* Floating particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-white/30"
                  initial={{ y: 0, x: 0, opacity: 0 }}
                  animate={{
                    y: [-20, -60],
                    x: [0, (i % 2 === 0 ? 1 : -1) * (10 + i * 5)],
                    opacity: [0, 1, 0],
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                  style={{ left: `${15 + i * 12}%`, bottom: "20%" }}
                />
              ))}

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2, damping: 12 }}
                className="text-center z-10"
              >
                <div className="text-5xl mb-1">{reward.icon}</div>
                <p className="text-white/90 text-xs font-bold">{t("checkin.title", "출석체크 완료!")}</p>
              </motion.div>

              <button
                onClick={close}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"
              >
                <X size={14} className="text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-4">
              {/* Streak counter */}
              <div className="text-center mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.4, damping: 15 }}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-orange-100 border border-orange-200"
                >
                  <Flame size={14} className="text-orange-500" />
                  <span className="text-sm font-black text-orange-600">
                    {result.streak}{t("checkin.days", "일")} {t("checkin.streak", "연속 접속!")}
                  </span>
                </motion.div>
              </div>

              {/* 7-day progress */}
              <div className="flex justify-between mb-4 px-1">
                {streakDays.map((day) => {
                  const isCompleted = day <= result.streak;
                  const isCurrent = day === result.streak;
                  const isSpecial = day === 3 || day === 5 || day === 7;
                  return (
                    <motion.div
                      key={day}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + day * 0.08 }}
                      className="flex flex-col items-center gap-1"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                          isCompleted
                            ? isCurrent
                              ? "bg-gradient-to-br from-primary to-emerald-400 border-primary text-white scale-110 shadow-lg"
                              : "bg-primary/20 border-primary/40 text-primary"
                            : "bg-muted border-border text-muted-foreground"
                        }`}
                      >
                        {isCompleted ? (
                          <Check size={14} strokeWidth={3} />
                        ) : isSpecial ? (
                          <Gift size={12} />
                        ) : (
                          day
                        )}
                      </div>
                      <span className={`text-[9px] font-bold ${isCompleted ? "text-primary" : "text-muted-foreground"}`}>
                        {day === 7 ? "👑" : `D${day}`}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Reward */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={animPhase !== "enter" ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 }}
                className="bg-muted rounded-2xl p-3 text-center mb-4"
              >
                <p className="text-[10px] text-muted-foreground mb-1">{t("checkin.todayReward", "오늘의 보상")}</p>
                <p className="text-sm font-black text-foreground">{reward.icon} {reward.label}</p>
              </motion.div>

              {/* CTA */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={close}
                className="w-full py-3 rounded-2xl gradient-primary text-white text-sm font-extrabold shadow-lg"
              >
                {t("checkin.confirm", "확인 ✨")}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
