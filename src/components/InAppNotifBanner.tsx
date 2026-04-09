import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Star, X } from "lucide-react";
export interface InAppNotifData {
  type: "like" | "superlike";
  actorName: string;
  actorPhoto: string;
  message?: string; // optional superlike message
}
interface InAppNotifBannerProps {
  notif: InAppNotifData | null;
  onClose: () => void;
}

/**
 * InAppNotifBanner
 * Slides in from the top when the user receives a Like or SuperLike.
 * - Like  → warm rose/pink gradient, heart icon, soft glow
 * - SuperLike → deep blue/indigo cosmic theme, star icon, animated glow
 *
 * Auto-dismisses after 3.5 seconds.
 */
const InAppNotifBanner = ({
  notif,
  onClose
}: InAppNotifBannerProps) => {
  const {
    t
  } = useTranslation();
  useEffect(() => {
    if (!notif) return;
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [notif, onClose]);
  const isLike = notif?.type === "like";
  return <AnimatePresence>
      {notif && <motion.div className="fixed top-0 left-0 right-0 z-[100] flex justify-center px-4 pt-14" initial={{
      y: -120,
      opacity: 0
    }} animate={{
      y: 0,
      opacity: 1
    }} exit={{
      y: -120,
      opacity: 0
    }} transition={{
      type: "spring",
      damping: 22,
      stiffness: 320
    }}>
          {isLike ? (/* ─────────── ❤️ LIKE BANNER ─────────── */
      <div className="w-full max-w-sm relative overflow-hidden rounded-2xl shadow-2xl" style={{
        background: "linear-gradient(135deg, #fff0f3 0%, #ffe4ec 100%)",
        border: "1.5px solid rgba(251,113,133,0.35)"
      }}>
              {/* Glow blob */}
              <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full opacity-40 blur-2xl" style={{
          background: "radial-gradient(circle, #f43f5e, transparent)"
        }} />

              <div className="relative flex items-center gap-3 px-4 py-3">
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md" style={{
            background: "linear-gradient(135deg, #f43f5e, #fb7185)"
          }}>
                  <Heart size={18} className="text-white" fill="white" />
                </div>

                {/* Avatar */}
                <div className="relative shrink-0">
                  {notif.actorPhoto ? <img src={notif.actorPhoto} alt={notif.actorName} className="w-10 h-10 rounded-xl object-cover border-2 border-rose-300" onError={e => {
              (e.target as HTMLImageElement).style.display = 'none';
            }} /> : <div className="w-10 h-10 rounded-xl bg-rose-200 flex items-center justify-center text-rose-600 font-extrabold text-sm">
                      {notif.actorName?.[0] ?? "?"}
                    </div>}
                  <span className="absolute -bottom-1 -right-1 text-xs">❤️</span>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-rose-700 truncate">{notif.actorName}{i18n.t("auto.z_\uB2D8\uC774\uC88B\uC544\uC694\uB97C\uBCF4\uB0C8\uC5B4\uC694_1043", "\uB2D8\uC774\uC88B\uC544\uC694\uB97C\uBCF4\uB0C8\uC5B4\uC694")}</p>
                  <p className="text-xs text-rose-400 mt-0.5 truncate">{i18n.t("auto.z_\uB9E4\uCE6D\uB420\uC218\uB3C4\uC788\uC5B4\uC694_1044", "\uB9E4\uCE6D\uB420\uC218\uB3C4\uC788\uC5B4\uC694")}</p>
                </div>

                {/* Close */}
                <button onClick={onClose} className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-rose-100 hover:bg-rose-200 transition-colors">
                  <X size={12} className="text-rose-400" />
                </button>
              </div>

              {/* Bottom progress bar — drains in 3.5s */}
              <motion.div className="h-0.5 rounded-b-2xl" style={{
          background: "linear-gradient(90deg, #f43f5e, #fb7185)"
        }} initial={{
          width: "100%"
        }} animate={{
          width: "0%"
        }} transition={{
          duration: 3.4,
          ease: "linear"
        }} />
            </div>) : (/* ─────────── ⭐ SUPER LIKE BANNER ─────────── */
      <div className="w-full max-w-sm relative overflow-hidden rounded-2xl shadow-2xl" style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
        border: "1.5px solid rgba(99,102,241,0.5)"
      }}>
              {/* Cosmic glow top */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full blur-2xl opacity-40" style={{
            background: "radial-gradient(circle, #6366f1, transparent)"
          }} />
                <div className="absolute -top-2 right-4 w-16 h-16 rounded-full blur-2xl opacity-30" style={{
            background: "radial-gradient(circle, #818cf8, transparent)"
          }} />
              </div>

              {/* Shimmer stripe */}
              <div className="h-0.5 w-full" style={{
          background: "linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6, #6366f1, #3b82f6)"
        }} />

              <div className="relative flex items-center gap-3 px-4 py-3">
                {/* Icon — animated star */}
                <motion.div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg" style={{
            background: "linear-gradient(135deg, #3b82f6, #6366f1)"
          }} animate={{
            rotate: [0, 8, -8, 0],
            scale: [1, 1.1, 1]
          }} transition={{
            duration: 1.5,
            repeat: Infinity
          }}>
                  <Star size={18} className="text-white" fill="white" />
                </motion.div>

                {/* Avatar with energy ring */}
                <div className="relative shrink-0">
                  <motion.div className="absolute inset-0 rounded-xl border border-indigo-500/60" animate={{
              scale: [1, 1.15],
              opacity: [0.8, 0]
            }} transition={{
              duration: 1.2,
              repeat: Infinity
            }} />
                  {notif.actorPhoto ? <img src={notif.actorPhoto} alt={notif.actorName} className="w-10 h-10 rounded-xl object-cover" style={{
              boxShadow: "0 0 12px rgba(99,102,241,0.5)"
            }} onError={e => {
              (e.target as HTMLImageElement).style.display = 'none';
            }} /> : <div className="w-10 h-10 rounded-xl bg-indigo-800 flex items-center justify-center text-indigo-200 font-extrabold text-sm" style={{
              boxShadow: "0 0 12px rgba(99,102,241,0.5)"
            }}>
                      {notif.actorName?.[0] ?? "?"}
                    </div>}
                  <span className="absolute -bottom-1 -right-1 text-xs">⭐</span>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0 truncate">
                  <p className="text-sm font-extrabold text-white truncate">{notif.actorName}{i18n.t("auto.z_\uB2D8\uC758\uC288\uD37C\uB77C\uC774\uD06C_1045", "\uB2D8\uC758\uC288\uD37C\uB77C\uC774\uD06C")}</p>
                  {notif.message ? <p className="text-xs text-indigo-300 mt-0.5 truncate">"{notif.message}"</p> : <p className="text-xs text-indigo-400 mt-0.5 truncate">{i18n.t("auto.z_\uC0C1\uB300\uBC29\uC774\uB2F9\uC2E0\uC744\uD2B9\uBCC4\uD788_1046", "\uC0C1\uB300\uBC29\uC774\uB2F9\uC2E0\uC744\uD2B9\uBCC4\uD788")}</p>}
                </div>

                {/* Close */}
                <button onClick={onClose} className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(99,102,241,0.3)"
          }}>
                  <X size={12} className="text-indigo-300" />
                </button>
              </div>

              {/* Bottom drain bar */}
              <motion.div className="h-0.5 rounded-b-2xl" style={{
          background: "linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)"
        }} initial={{
          width: "100%"
        }} animate={{
          width: "0%"
        }} transition={{
          duration: 3.4,
          ease: "linear"
        }} />
            </div>)}
        </motion.div>}
    </AnimatePresence>;
};
export default InAppNotifBanner;