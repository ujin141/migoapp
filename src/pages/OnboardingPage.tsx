import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import traveler1 from "@/assets/traveler-1.jpg";
import traveler2 from "@/assets/traveler-2.jpg";
import traveler3 from "@/assets/traveler-3.jpg";
import traveler4 from "@/assets/traveler-4.jpg";
import siteLogo from "@/assets/site-logo.png";


const SLIDE_PHOTOS = [
  { photos: [traveler1, traveler2], color: "from-primary/30 to-accent/20", emoji: "✈️", badge: "🌏 42+" },
  { photos: [traveler3, traveler4], color: "from-accent/30 to-primary/20", emoji: "💜", badge: "🔥 100+" },
  { photos: [traveler2, traveler3], color: "from-primary/20 to-accent/30", emoji: "🗺️", badge: "📍 GPS" },
];

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);

  const slides = SLIDE_PHOTOS.map((s, i) => ({
    id: i,
    ...s,
    title: t(`onboarding.slide${i + 1}Title`),
    desc: t(`onboarding.slide${i + 1}Desc`),
  }));

  const goTo = (next: number) => {
    setDirection(next > page ? 1 : -1);
    setPage(next);
  };

  const handleNext = () => {
    if (page < slides.length - 1) {
      goTo(page + 1);
    } else {
      localStorage.setItem("migo_onboarding_done", "1");
      navigate("/login");
    }
  };

  const slide = slides[page];

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
      {/* Header: logo left / skip right */}
      <motion.div
        className="flex items-center justify-between px-5 pt-10 pb-2 z-20 shrink-0"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <img src={siteLogo} alt="Migo" className="h-14 object-contain" />
        <motion.button
          onClick={() => { localStorage.setItem("migo_onboarding_done", "1"); navigate("/login"); }}
          className="text-sm font-semibold text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {t('onboarding.skip')}
        </motion.button>
      </motion.div>

      {/* Slide content */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={slide.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="absolute inset-0 flex flex-col"
          >
            {/* Visual area */}
            <div className={`relative h-[55%] w-full bg-gradient-to-br ${slide.color} overflow-hidden`}>
              {/* Animated background circles */}
              <motion.div
                className="absolute w-72 h-72 rounded-full bg-primary/10 blur-3xl"
                animate={{ scale: [1, 1.2, 1], x: [0, 20, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                style={{ top: "-20%", left: "-10%" }}
              />
              <motion.div
                className="absolute w-56 h-56 rounded-full bg-accent/15 blur-3xl"
                animate={{ scale: [1, 1.15, 1], x: [0, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                style={{ bottom: "-10%", right: "-10%" }}
              />

              {/* Floating photo cards */}
              <motion.div
                className="absolute"
                style={{ top: "15%", left: "12%" }}
                initial={{ y: 60, opacity: 0, rotate: -8 }}
                animate={{ y: 0, opacity: 1, rotate: -6 }}
                transition={{ delay: 0.1, type: "spring", damping: 18 }}
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-36 h-48 rounded-2xl overflow-hidden shadow-float border-[3px] border-card"
                >
                  <img src={slide.photos[0]} alt="" className="w-full h-full object-cover" />
                </motion.div>
              </motion.div>

              <motion.div
                className="absolute"
                style={{ top: "28%", right: "8%" }}
                initial={{ y: 60, opacity: 0, rotate: 8 }}
                animate={{ y: 0, opacity: 1, rotate: 7 }}
                transition={{ delay: 0.2, type: "spring", damping: 18 }}
              >
                <motion.div
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="w-32 h-44 rounded-2xl overflow-hidden shadow-float border-[3px] border-card"
                >
                  <img src={slide.photos[1]} alt="" className="w-full h-full object-cover" />
                </motion.div>
              </motion.div>

              {/* Badge */}
              <motion.div
                className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-card"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
              >
                <span className="text-xs font-bold text-foreground">{slide.badge}</span>
              </motion.div>



            </div>

            {/* Text area */}
            <div className="flex-1 px-6 pt-6">
              <motion.h2
                className="text-3xl font-extrabold text-foreground leading-tight whitespace-pre-line"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                {slide.title}
              </motion.h2>
              <motion.p
                className="text-sm text-muted-foreground mt-3 leading-relaxed"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                {slide.desc}
              </motion.p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="px-6 pb-12 space-y-6">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => goTo(i)}
              initial={false}
              animate={{
                width: i === page ? 24 : 8,
                backgroundColor: i === page ? "hsl(var(--primary))" : "hsl(var(--border))",
              }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="h-2 rounded-full"
            />
          ))}
        </div>

        {/* CTA Button */}
        <motion.button
          onClick={handleNext}
          className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-bold text-base shadow-float transition-transform active:scale-[0.98]"
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {page < slides.length - 1 ? t('onboarding.next') : t('onboarding.start') + ' 🚀'}
        </motion.button>

        {/* Already have account */}
        {page === slides.length - 1 && (
          <motion.p
            className="text-center text-sm text-muted-foreground"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            {t('login.hasAccount')}
            <button
              onClick={() => navigate("/login")}
              className="text-primary font-bold"
            >
              {t('login.login')}
            </button>
          </motion.p>
        )}

        {/* Privacy Policy & Terms links (Store Crawler 호환용 a 태그) */}
        <div className="text-[10px] text-center text-muted-foreground pt-1 flex justify-center gap-1.5">
          <a
            href="/terms"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            {t('login.terms')}
          </a>
          <span>·</span>
          <a
            href="/privacy"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            {t('login.privacy')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
