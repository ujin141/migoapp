import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Star, Eye, Lock, X } from "lucide-react";

export interface InAppNotifData {
  type: "like" | "superlike" | "profile_view";
  actorName: string;
  actorPhoto: string;
  message?: string; // optional superlike message
  isBlurred?: boolean; // true → photo is blurred (non-Plus)
}

interface InAppNotifBannerProps {
  notif: InAppNotifData | null;
  onClose: () => void;
}

/**
 * InAppNotifBanner
 * Slides in from the top for:
 * - Like        → warm rose/pink gradient, heart icon
 * - SuperLike   → deep blue/indigo cosmic theme, star icon
 * - ProfileView → violet/purple "👀" theme, blurred or clear photo
 *
 * Auto-dismisses after 3.5 seconds.
 */
const InAppNotifBanner = ({ notif, onClose }: InAppNotifBannerProps) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!notif) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [notif, onClose]);

  const isLike = notif?.type === "like";
  const isSuperLike = notif?.type === "superlike";
  const isProfileView = notif?.type === "profile_view";

  return (
    <AnimatePresence>
      {notif && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[100] flex justify-center px-4 pt-14"
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -120, opacity: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 320 }}
        >
          {/* ─────────── ❤️ LIKE BANNER ─────────── */}
          {isLike && (
            <div
              className="w-full max-w-sm relative overflow-hidden rounded-2xl shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #fff0f3 0%, #ffe4ec 100%)",
                border: "1.5px solid rgba(251,113,133,0.35)",
              }}
            >
              <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full opacity-40 blur-2xl"
                style={{ background: "radial-gradient(circle, #f43f5e, transparent)" }} />

              <div className="relative flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                  style={{ background: "linear-gradient(135deg, #f43f5e, #fb7185)" }}>
                  <Heart size={18} className="text-white" fill="white" />
                </div>

                <div className="relative shrink-0">
                  {/* 프로필 사진 컨테이너 */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-rose-300">
                    {notif.actorPhoto ? (
                      <img
                        src={notif.actorPhoto}
                        alt={notif.isBlurred ? '?' : notif.actorName}
                        className="w-full h-full object-cover"
                        style={notif.isBlurred ? { filter: 'blur(8px)', transform: 'scale(1.2)' } : {}}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full bg-rose-200 flex items-center justify-center text-rose-600 font-extrabold text-sm"
                        style={notif.isBlurred ? { filter: 'blur(6px)' } : {}}>
                        {notif.isBlurred ? '?' : (notif.actorName?.[0] ?? '?')}
                      </div>
                    )}
                  </div>
                  {/* 잠금 아이콘 (비구독자) */}
                  {notif.isBlurred && (
                    <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/15">
                      <div className="w-4 h-4 rounded-full bg-black/60 flex items-center justify-center">
                        <Lock size={8} className="text-rose-100" />
                      </div>
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 text-xs">❤️</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-rose-700 truncate">
                    {notif.isBlurred
                      ? i18n.t('notif.someoneliked', '누군가 나를 좋아해요!')
                      : `${notif.actorName}${i18n.t('auto.z_님이좋아요를보냈어요_1043', '님이좋아요를보냈어요')}`}
                  </p>
                  <p className="text-xs text-rose-400 mt-0.5 truncate">
                    {notif.isBlurred
                      ? i18n.t('notif.someonelikedSub', 'Plus로 업그레이드하면 누군지 알 수 있어요 ✨')
                      : i18n.t('auto.z_매칭될수도있어요_1044', '매칭될수도있어요')}
                  </p>
                </div>

                <button onClick={onClose}
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-rose-100 hover:bg-rose-200 transition-colors">
                  <X size={12} className="text-rose-400" />
                </button>
              </div>

              <motion.div className="h-0.5 rounded-b-2xl"
                style={{ background: "linear-gradient(90deg, #f43f5e, #fb7185)" }}
                initial={{ width: "100%" }} animate={{ width: "0%" }}
                transition={{ duration: 3.9, ease: "linear" }} />
            </div>
          )}

          {/* ─────────── ⭐ SUPER LIKE BANNER ─────────── */}
          {isSuperLike && (
            <div
              className="w-full max-w-sm relative overflow-hidden rounded-2xl shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
                border: "1.5px solid rgba(99,102,241,0.5)",
              }}
            >
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full blur-2xl opacity-40"
                  style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
                <div className="absolute -top-2 right-4 w-16 h-16 rounded-full blur-2xl opacity-30"
                  style={{ background: "radial-gradient(circle, #818cf8, transparent)" }} />
              </div>

              <div className="h-0.5 w-full"
                style={{ background: "linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6, #6366f1, #3b82f6)" }} />

              <div className="relative flex items-center gap-3 px-4 py-3">
                <motion.div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
                  animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}>
                  <Star size={18} className="text-white" fill="white" />
                </motion.div>

                <div className="relative shrink-0">
                  <motion.div className="absolute inset-0 rounded-xl border border-indigo-500/60"
                    animate={{ scale: [1, 1.15], opacity: [0.8, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity }} />
                  {/* 프로필 사진 컨테이너 */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden"
                    style={{ boxShadow: "0 0 12px rgba(99,102,241,0.5)" }}>
                    {notif.actorPhoto ? (
                      <img
                        src={notif.actorPhoto}
                        alt={notif.isBlurred ? '?' : notif.actorName}
                        className="w-full h-full object-cover"
                        style={notif.isBlurred ? { filter: 'blur(8px)', transform: 'scale(1.2)' } : {}}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full bg-indigo-800 flex items-center justify-center text-indigo-200 font-extrabold text-sm"
                        style={notif.isBlurred ? { filter: 'blur(6px)' } : {}}>
                        {notif.isBlurred ? '?' : (notif.actorName?.[0] ?? '?')}
                      </div>
                    )}
                  </div>
                  {/* 잠금 아이콘 (비구독자) */}
                  {notif.isBlurred && (
                    <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/15">
                      <div className="w-4 h-4 rounded-full bg-black/60 flex items-center justify-center">
                        <Lock size={8} className="text-indigo-200" />
                      </div>
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 text-xs">⭐</span>
                </div>

                <div className="flex-1 min-w-0 truncate">
                  <p className="text-sm font-extrabold text-white truncate">
                    {notif.isBlurred
                      ? i18n.t('notif.someonesuperliked', '누군가 슈퍼라이크를 보냈어요!')
                      : `${notif.actorName}${i18n.t('auto.z_님의슈퍼라이크_1045', '님의슈퍼라이크')}`}
                  </p>
                  {notif.isBlurred ? (
                    <p className="text-xs text-indigo-300 mt-0.5 truncate">
                      {i18n.t('notif.someonesuperlikedSub', 'Plus로 업그레이드하면 누군지 알 수 있어요 ✨')}
                    </p>
                  ) : notif.message ? (
                    <p className="text-xs text-indigo-300 mt-0.5 truncate">"{notif.message}"</p>
                  ) : (
                    <p className="text-xs text-indigo-400 mt-0.5 truncate">
                      {i18n.t("auto.z_상대방이당신을특별히_1046", "상대방이당신을특별히")}
                    </p>
                  )}
                </div>

                <button onClick={onClose}
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(99,102,241,0.3)" }}>
                  <X size={12} className="text-indigo-300" />
                </button>
              </div>

              <motion.div className="h-0.5 rounded-b-2xl"
                style={{ background: "linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)" }}
                initial={{ width: "100%" }} animate={{ width: "0%" }}
                transition={{ duration: 3.9, ease: "linear" }} />
            </div>
          )}

          {/* ─────────── 👀 PROFILE VIEW BANNER ─────────── */}
          {isProfileView && (
            <div
              className="w-full max-w-sm relative overflow-hidden rounded-2xl shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #1a0533 0%, #2d1060 50%, #1e0a4a 100%)",
                border: "1.5px solid rgba(167,139,250,0.4)",
              }}
            >
              {/* 배경 글로우 */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-4 -left-4 w-28 h-28 rounded-full blur-2xl opacity-50"
                  style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
                <div className="absolute -bottom-4 right-4 w-20 h-20 rounded-full blur-2xl opacity-30"
                  style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }} />
              </div>

              {/* 상단 shimmer 라인 */}
              <div className="h-0.5 w-full"
                style={{ background: "linear-gradient(90deg, #7c3aed, #a78bfa, #c4b5fd, #a78bfa, #7c3aed)" }} />

              <div className="relative flex items-center gap-3 px-4 py-3">
                {/* 눈 아이콘 */}
                <motion.div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Eye size={18} className="text-white" />
                </motion.div>

                {/* 프로필 사진 (블러 or 선명) */}
                <div className="relative shrink-0">
                  {/* 에너지 링 */}
                  <motion.div
                    className="absolute inset-0 rounded-xl border border-purple-400/60"
                    animate={{ scale: [1, 1.18], opacity: [0.7, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  />
                  <div className="w-10 h-10 rounded-xl overflow-hidden"
                    style={{ boxShadow: "0 0 14px rgba(167,139,250,0.5)" }}>
                    {notif.actorPhoto ? (
                      <img
                        src={notif.actorPhoto}
                        alt="?"
                        className="w-full h-full object-cover"
                        style={notif.isBlurred
                          ? { filter: "blur(8px)", transform: "scale(1.2)" }
                          : {}}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div
                        className="w-full h-full bg-purple-800 flex items-center justify-center text-purple-200 font-extrabold text-sm"
                        style={notif.isBlurred ? { filter: "blur(6px)" } : {}}
                      >
                        {notif.isBlurred ? "?" : (notif.actorName?.[0] ?? "?")}
                      </div>
                    )}
                  </div>
                  {/* 잠금 아이콘 (비구독자) */}
                  {notif.isBlurred && (
                    <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/20">
                      <div className="w-4 h-4 rounded-full bg-black/70 flex items-center justify-center">
                        <Lock size={8} className="text-white" />
                      </div>
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 text-xs">👀</span>
                </div>

                {/* 텍스트 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-white truncate">
                    {notif.isBlurred
                      ? t("notif.profileViewBlur", "누군가 내 프로필을 봤어요!")
                      : `${notif.actorName}${t("notif.profileViewed", "님이 프로필을 봤어요")}`}
                  </p>
                  <p className="text-xs mt-0.5 truncate"
                    style={{ color: "rgba(196,181,253,0.8)" }}>
                    {notif.isBlurred
                      ? t("notif.profileViewBlurSub", "Plus로 업그레이드하면 누군지 확인할 수 있어요 ✨")
                      : t("notif.profileViewSub", "프로필이 인기있어요 🔥")}
                  </p>
                </div>

                <button onClick={onClose}
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(167,139,250,0.3)" }}>
                  <X size={12} className="text-purple-300" />
                </button>
              </div>

              {/* 하단 drain bar */}
              <motion.div className="h-0.5 rounded-b-2xl"
                style={{ background: "linear-gradient(90deg, #7c3aed, #a78bfa, #c4b5fd)" }}
                initial={{ width: "100%" }} animate={{ width: "0%" }}
                transition={{ duration: 3.9, ease: "linear" }} />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InAppNotifBanner;