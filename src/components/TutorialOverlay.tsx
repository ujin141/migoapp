import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

// ─── Tutorial Step Definition ───
interface TutorialStep {
  id: string;
  emoji: string;
  title: string;
  description: string;
  highlight?: string; // optional CSS selector to spotlight
  position?: "top" | "center" | "bottom";
}
const TUTORIAL_STEPS: TutorialStep[] = [{
  id: "welcome",
  emoji: "👋",
  title: i18n.t("auto.z_Migo\uC5D0\uC624\uC2E0\uAC78\uD658\uC601_949"),
  description: i18n.t("auto.z_\uC804\uC138\uACC4\uC5EC\uD589\uC790\uC640\uC5F0\uACB0\uB418_950"),
  position: "center"
}, {
  id: "swipe",
  emoji: "💜",
  title: i18n.t("auto.z_\uC2A4\uC640\uC774\uD504\uB85C\uC778\uC5F0\uCC3E\uAE30_951"),
  description: i18n.t("auto.z_\uB9C8\uC74C\uC5D0\uB4DC\uB294\uC5EC\uD589\uC790\uB97C\uC624_952"),
  position: "center"
}, {
  id: "discover",
  emoji: "🧭",
  title: i18n.t("auto.z_\uC5EC\uD589\uADF8\uB8F9\uD0D0\uC0C9_953"),
  description: i18n.t("auto.z_\uD0D0\uC0C9\uD0ED\uC5D0\uC11C\uB098\uC640\uC5EC\uD589\uC2A4_954"),
  position: "bottom"
}, {
  id: "map",
  emoji: "📍",
  title: i18n.t("auto.z_\uC9C0\uB3C4\uB85C\uC8FC\uBCC0\uC5EC\uD589\uC790\uCC3E\uAE30_955"),
  description: i18n.t("auto.z_\uC9C0\uB3C4\uD0ED\uC5D0\uC11C\uC9C0\uAE08\uB0B4\uADFC\uCC98_956"),
  position: "bottom"
}, {
  id: "chat",
  emoji: "💬",
  title: i18n.t("auto.z_\uB9E4\uCE6D\uB418\uBA74\uBC14\uB85C\uCC44\uD305_957"),
  description: i18n.t("auto.z_\uB9E4\uCE6D\uC774\uC131\uC0AC\uB418\uBA74\uCC44\uD305\uD0ED_958"),
  position: "bottom"
}, {
  id: "profile",
  emoji: "✨",
  title: i18n.t("auto.z_\uB098\uB9CC\uC758\uD504\uB85C\uD544\uAFB8\uBBF8\uAE30_959"),
  description: i18n.t("auto.z_\uD504\uB85C\uD544\uC744\uC644\uC131\uD560\uC218\uB85D\uB9E4_960"),
  position: "bottom"
}, {
  id: "done",
  emoji: "🚀",
  title: i18n.t("auto.z_\uC900\uBE44\uC644\uB8CC_961"),
  description: i18n.t("auto.z_\uC774\uC81CMigo\uB97C\uB9C8\uC74C\uAECF_962"),
  position: "center"
}];

// Bottom nav icon positions (approximate, for spotlight hints)
const NAV_HINTS: Record<string, string> = {
  discover: i18n.t("auto.z_\uD0D0\uC0C9\uD0ED\uD558\uB2E8\uB450\uBC88\uC9F8\uC544\uC774_963"),
  map: i18n.t("auto.z_\uC9C0\uB3C4\uD0ED\uD558\uB2E8\uC138\uBC88\uC9F8\uC544\uC774_964"),
  chat: i18n.t("auto.z_\uCC44\uD305\uD0ED\uD558\uB2E8\uB124\uBC88\uC9F8\uC544\uC774_965"),
  profile: i18n.t("auto.z_\uD504\uB85C\uD544\uD0ED\uD558\uB2E8\uB2E4\uC12F\uBC88\uC9F8_966")
};
const STORAGE_KEY = "migo_tutorial_done";
export function useTutorial() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Small delay so the main UI renders first
      const t = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(t);
    }
  }, []);
  const complete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  }, []);
  const restart = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setShow(true);
  }, []);
  return {
    show,
    complete,
    restart
  };
}
interface TutorialOverlayProps {
  onComplete: () => void;
}
const TutorialOverlay = ({
  onComplete
}: TutorialOverlayProps) => {
  const {
    t
  } = useTranslation();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const current = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;
  const isFirst = step === 0;
  const goNext = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setDirection(1);
    setStep(s => s + 1);
  };
  const goPrev = () => {
    if (isFirst) return;
    setDirection(-1);
    setStep(s => s - 1);
  };
  const slideVariants = {
    enter: (d: number) => ({
      x: d > 0 ? 60 : -60,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (d: number) => ({
      x: d > 0 ? -60 : 60,
      opacity: 0
    })
  };
  return <motion.div className="fixed inset-0 z-[200] flex flex-col items-center justify-end" initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} exit={{
    opacity: 0
  }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onComplete} />

      {/* Card */}
      <motion.div className="relative w-full max-w-lg bg-card rounded-3xl mb-4 sm:mb-8 shadow-2xl overflow-hidden pb-safe" initial={{
      y: "100%"
    }} animate={{
      y: 0
    }} exit={{
      y: "100%"
    }} transition={{
      type: "spring",
      damping: 28,
      stiffness: 280
    }}>
        {/* Decorative gradient bar */}
        <div className="h-1 w-full" style={{
        background: "linear-gradient(90deg, #8b5cf6, #ec4899, #f97316)"
      }} />

        {/* Close button */}
        <button onClick={onComplete} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
          <X size={15} className="text-muted-foreground" />
        </button>

        {/* Step counter badge */}
        <div className="flex items-center gap-1.5 px-6 pt-5 pb-2">
          <Sparkles size={13} className="text-primary" />
          <span className="text-[11px] font-bold text-primary tracking-wide uppercase">
            {step + 1} / {TUTORIAL_STEPS.length}
          </span>
        </div>

        {/* Animated step content */}
        <div className="relative overflow-hidden" style={{
        height: 220
      }}>
          <AnimatePresence custom={direction} mode="wait">
            <motion.div key={current.id} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{
            type: "spring",
            damping: 26,
            stiffness: 300
          }} className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
              {/* Emoji */}
              <motion.div className="text-6xl mb-5 select-none" initial={{
              scale: 0.6,
              opacity: 0
            }} animate={{
              scale: 1,
              opacity: 1
            }} transition={{
              delay: 0.05,
              type: "spring",
              damping: 14
            }}>
                {current.emoji}
              </motion.div>

              <h2 className="text-xl font-extrabold text-foreground leading-tight mb-3">
                {t(`tutorial.step${step}.title`, {
                defaultValue: current.title
              })}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                {t(`tutorial.step${step}.desc`, {
                defaultValue: current.description
              })}
              </p>

              {/* Nav hint chip */}
              {NAV_HINTS[current.id] && <motion.div className="mt-4 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20" initial={{
              opacity: 0,
              y: 8
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 0.2
            }}>
                  <span className="text-[11px] font-semibold text-primary">
                    👇 {t(`tutorial.navHint${current.id}`, {
                  defaultValue: NAV_HINTS[current.id]
                })}
                  </span>
                </motion.div>}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-5">
          {TUTORIAL_STEPS.map((_, i) => <motion.div key={i} initial={false} animate={{
          width: i === step ? 20 : 6,
          backgroundColor: i === step ? "hsl(var(--primary))" : "hsl(var(--border))"
        }} transition={{
          type: "spring",
          damping: 20,
          stiffness: 300
        }} className="h-1.5 rounded-full cursor-pointer" onClick={() => {
          setDirection(i > step ? 1 : -1);
          setStep(i);
        }} />)}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 px-6 pb-8">
          {/* Prev */}
          <motion.button onClick={goPrev} className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${isFirst ? "opacity-0 pointer-events-none" : "bg-muted text-foreground hover:bg-muted/80"}`} whileTap={{
          scale: 0.93
        }}>
            <ChevronLeft size={20} />
          </motion.button>

          {/* Next / Done */}
          <motion.button onClick={goNext} className="flex-1 py-3.5 rounded-2xl font-bold text-base text-primary-foreground flex items-center justify-center gap-2 shadow-lg" style={{
          background: isLast ? "linear-gradient(135deg, #8b5cf6, #ec4899)" : "linear-gradient(135deg, #8b5cf6, #a78bfa)"
        }} whileTap={{
          scale: 0.97
        }}>
            {isLast ? <>{t("onboarding.start")} 🚀</> : <>{t("onboarding.next")} <ChevronRight size={16} />
              </>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>;
};
export default TutorialOverlay;