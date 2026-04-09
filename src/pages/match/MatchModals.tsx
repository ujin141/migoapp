import i18n from "@/i18n";
import { AnimatePresence, motion } from "framer-motion";
import { X, Heart, Star, Lock, Crown, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

// ─── Constants ───
export const TRAVEL_STYLES = [
  { id: i18n.t("auto.x4046", "카페"), i18nKey: "auto.g_1479" },
  { id: i18n.t("auto.x4047", "트레킹"), i18nKey: "auto.g_1480" },
  { id: i18n.t("auto.x4048", "서핑"), i18nKey: "auto.g_1481" },
  { id: i18n.t("auto.x4049", "야시장"), i18nKey: "auto.g_1482" },
  { id: i18n.t("auto.x4050", "사진"), i18nKey: "auto.g_1483" },
  { id: i18n.t("auto.x4051", "음식"), i18nKey: "auto.g_1484" },
  { id: i18n.t("auto.x4052", "건축"), i18nKey: "auto.g_1485" },
  { id: i18n.t("auto.x4053", "자연"), i18nKey: "auto.g_1486" },
  { id: i18n.t("auto.x4054", "럭셔리"), i18nKey: "auto.g_1487" },
  { id: i18n.t("auto.x4055", "배낭여행"), i18nKey: "auto.g_1488" }
];
export const LANGUAGE_OPTIONS = [
  { id: i18n.t("auto.x4056", "한국어"), i18nKey: "auto.g_1489" },
  "English", "日本語", "中文", "Español", "Français", "Deutsch", "عربي", "Русский", "Português", "हिन्दी", "Tiếng Việt", "ภาษาไทย", "Bahasa Indonesia", "Italiano", "Türkçe", "Nederlands", "Polski", "Bahasa Melayu", "Svenska"
];

// ─── Mission Modal ───
export const MissionModal = ({
  showMissionModal,
  setShowMissionModal,
  selectDailyMission
}: any) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {showMissionModal && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
          <motion.div
            className="relative w-full max-w-sm bg-card rounded-[24px] p-6 shadow-float border border-border/50 text-center"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 25 }}
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <span className="text-2xl animate-bounce">🎯</span>
            </div>
            <h3 className="text-xl font-extrabold text-foreground mb-1 truncate">{i18n.t("match.missionTitle", { defaultValue: "오늘, 어떤 동행을 원하세요?" })}</h3>
            <p className="text-sm text-muted-foreground mb-6 truncate">{i18n.t("match.missionDesc", { defaultValue: "설정한 목적에 맞는 여행자를 우선 보여드려요!" })}</p>
            
            <div className="grid grid-cols-2 gap-2 mb-6 truncate">
              {[
                { id: i18n.t("auto.g_1490", "맛집/카페 탐방 ☕"), icon: '☕', label: i18n.t("auto.g_1491", "맛집/카페") },
                { id: i18n.t("auto.g_1492", "야경/인생샷 📸"), icon: '📸', label: i18n.t("auto.g_1493", "야경/스냅") },
                { id: i18n.t("auto.g_1494", "디즈니/테마파크 🎢"), icon: '🎢', label: i18n.t("auto.g_1495", "테마파크") },
                { id: i18n.t("auto.g_1496", "렌터카 쉐어 🚗"), icon: '🚗', label: i18n.t("auto.g_1497", "렌터카 쉐어") },
                { id: i18n.t("auto.g_1498", "미술관/투어 🏛️"), icon: '🏛️', label: i18n.t("auto.g_1499", "전시/투어") },
                { id: i18n.t("auto.g_1500", "현지 펍/클럽 🍻"), icon: '🍻', label: i18n.t("auto.g_1501", "펍/클럽") }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => selectDailyMission(m.id)}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-border/50 bg-muted/30 hover:bg-primary/10 hover:border-primary/40 transition-colors active:scale-95"
                >
                  <span className="text-2xl">{m.icon}</span>
                  <span className="text-xs font-bold text-foreground">{m.label}</span>
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                localStorage.setItem('migo_mission_date', today);
                setShowMissionModal(false);
              }} 
              className="text-xs text-muted-foreground underline underline-offset-4 font-semibold active:opacity-70"
            >
              {i18n.t("auto.g_1472", "다음에 설정할게요")}</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Like Popup Modal ───
export const LikePopupModal = ({
  showLikePopup,
  likePopupProfile,
}: any) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {showLikePopup && likePopupProfile && (
        <motion.div className="fixed inset-0 z-[65] flex items-center justify-center pointer-events-none" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} exit={{
          opacity: 0
        }} transition={{
          duration: 0.3
        }}>
          {/* Soft vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-rose-500/20 via-transparent to-rose-500/10" />

          {/* Floating hearts — scattered */}
          {[{ x: -80, y: -120, size: 28, delay: 0, rotate: -15 }, 
            { x: 90,  y: -150, size: 20, delay: 0.1, rotate: 20 }, 
            { x: -50, y: -60, size: 14, delay: 0.15, rotate: -30 }, 
            { x: 120, y: -80, size: 24, delay: 0.05, rotate: 10 }, 
            { x: -120, y: 30, size: 16, delay: 0.2, rotate: -40 }, 
            { x: 70, y: 50, size: 32, delay: 0.1, rotate: 15 }, 
            { x: 0, y: -180, size: 12, delay: 0.25, rotate: 5 }, 
            { x: -90, y: -40, size: 22, delay: 0.12, rotate: -20 }, 
            { x: 100, y: 40, size: 18, delay: 0.25, rotate: 25 }, 
            { x: 30, y: -180, size: 12, delay: 0.3, rotate: -5 }, 
            { x: -30, y: 100, size: 22, delay: 0.12, rotate: 15 }
          ].map((h, i) => (
            <motion.div key={i} className="absolute" initial={{
              x: 0, y: 0, scale: 0, opacity: 0, rotate: 0
            }} animate={{
              x: h.x, y: h.y, scale: 1.2, opacity: [0, 1, 1, 0], rotate: h.rotate
            }} transition={{
              duration: 1.6, delay: h.delay, ease: "easeOut"
            }}>
              <Heart size={h.size} className="text-rose-400" fill="currentColor" />
            </motion.div>
          ))}

          {/* Main card */}
          <motion.div className="relative bg-card/95 backdrop-blur-xl rounded-3xl px-8 py-6 shadow-float border border-rose-500/20 text-center max-w-xs w-full mx-6" initial={{
            scale: 0.5, y: 60, opacity: 0
          }} animate={{
            scale: 1, y: 0, opacity: 1
          }} exit={{
            scale: 0.9, y: -20, opacity: 0
          }} transition={{
            type: "spring", damping: 18, stiffness: 300, delay: 0.05
          }}>
            {/* Big animated heart */}
            <motion.div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center mx-auto mb-3 shadow-lg" initial={{
              scale: 0, rotate: -30
            }} animate={{
              scale: [0, 1.25, 1], rotate: [-30, 10, 0]
            }} transition={{
              duration: 0.5, delay: 0.1, type: "spring"
            }}>
              <Heart size={36} className="text-white" fill="currentColor" />
            </motion.div>

            {/* Profile snapshot */}
            <div className="flex items-center justify-center gap-2 mb-3">
              {likePopupProfile.photo ? (
                <img src={likePopupProfile.photo} alt="" className="w-8 h-8 rounded-xl object-cover border-2 border-rose-400" loading="lazy" onError={e => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }} />
              ) : (
                <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                  {likePopupProfile.name?.[0] ?? "?"}
                </div>
              )}
              <p className="text-base font-extrabold text-foreground truncate">{likePopupProfile.name}{i18n.t("auto.g_1473", "님께 좋아요")}</p>
            </div>

            <p className="text-sm text-muted-foreground mb-3 truncate">{i18n.t("auto.j505")}</p>

            {/* Match probability pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30">
              <Zap size={11} className="text-rose-400" />
              <span className="text-xs font-bold text-rose-400 truncate">{i18n.t("auto.g_1474", "매칭확률")}{Math.round(Math.max(0.3, (likePopupProfile.matchScore ?? 50) / 100) * 100)}%</span>
            </div>

            {/* Auto-close progress bar */}
            <motion.div className="absolute bottom-0 left-0 h-1 rounded-b-3xl bg-gradient-to-r from-rose-400 to-pink-600" initial={{
              width: "100%"
            }} animate={{
              width: "0%"
            }} transition={{
              duration: 2.0, ease: "linear"
            }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Super Like Modal ───
export const SuperLikeModal = ({
  showSuperLikeModal, setShowSuperLikeModal,
  pendingSuperProfile, 
  superMsg, setSuperMsg,
  superLikesLeft, isPlus,
  confirmSuperLike
}: any) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {showSuperLikeModal && pendingSuperProfile && <motion.div className="fixed inset-0 z-[60] flex items-end justify-center px-safe pb-safe pt-safe" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }}>
          {/* Deep cosmic backdrop */}
          <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at 50% 80%, rgba(99,102,241,0.25) 0%, rgba(0,0,0,0.7) 100%)"
      }} onClick={() => setShowSuperLikeModal(false)} />

          {/* Floating star particles in backdrop */}
          {[...Array(12)].map((_, i) => <motion.div key={i} className="absolute" style={{
        left: `${10 + i * 7.5 % 85}%`,
        top: `${5 + i * 11 % 55}%`
      }} animate={{
        y: [-5, 5, -5],
        opacity: [0.3, 1, 0.3],
        scale: [0.8, 1.3, 0.8]
      }} transition={{
        duration: 2 + i % 3,
        repeat: Infinity,
        delay: i * 0.18,
        ease: "easeInOut"
      }}>
              <Star size={i % 3 === 0 ? 10 : 6} className="text-blue-300" fill="currentColor" />
            </motion.div>)}

          <motion.div className="relative z-10 w-full max-w-lg mx-auto rounded-[32px] mb-4 sm:mb-8 overflow-hidden pb-12 shadow-float" style={{
        background: "linear-gradient(180deg, #0f1729 0%, #111827 100%)",
        border: "1px solid rgba(99,102,241,0.3)",
        borderBottom: "none"
      }} initial={{
        y: "100%"
      }} animate={{
        y: 0
      }} exit={{
        y: "100%"
      }} transition={{
        type: "spring",
        damping: 28,
        stiffness: 300
      }}>
            {/* Top glow stripe */}
            <div className="h-1 w-full" style={{
          background: "linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6, #6366f1, #3b82f6)"
        }} />

            <div className="px-6 pt-5 pb-4">
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

              {/* SUPER LIKE header */}
              <div className="text-center mb-5">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  {[0, 1, 2].map(i => <motion.div key={i} animate={{
                scale: [1, 1.4, 1],
                rotate: [0, 15, 0]
              }} transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2
              }}>
                      <Star size={i === 1 ? 22 : 14} className="text-blue-400" fill="currentColor" />
                    </motion.div>)}
                </div>
                <p className="text-xs font-extrabold tracking-[0.2em] text-blue-400 uppercase">Super Like</p>
              </div>

              {/* Profile with energy ring */}
              <div className="flex items-center gap-4 mb-5">
                <div className="relative shrink-0">
                  {/* Pulsing energy rings */}
                  {[1, 2].map(ring => <motion.div key={ring} className="absolute inset-0 rounded-2xl border border-blue-500/50" animate={{
                scale: [1, 1 + ring * 0.12],
                opacity: [0.8, 0]
              }} transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: ring * 0.4
              }} />)}
                  <img src={pendingSuperProfile.photo} alt="" className="w-16 h-16 rounded-2xl object-cover" style={{
                boxShadow: "0 0 20px rgba(99,102,241,0.5)"
              }} loading="lazy" />
                  <motion.div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg" style={{
                background: "linear-gradient(135deg, #3b82f6, #6366f1)"
              }} animate={{
                rotate: [0, 10, -10, 0]
              }} transition={{
                duration: 2,
                repeat: Infinity
              }}>
                    <Star size={14} className="text-white" fill="white" />
                  </motion.div>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white truncate">{pendingSuperProfile.name}{i18n.t("auto.g_1475", "님께")}</h3>
                  <p className="text-sm font-bold truncate" style={{
                background: "linear-gradient(90deg, #60a5fa, #a78bfa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>{i18n.t("auto.j506")}</p>
                  <p className="text-xs text-white/40 mt-0.5">{pendingSuperProfile.destination} · {pendingSuperProfile.dates}</p>
                </div>
              </div>

              {/* Remaining count visual */}
              <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-2xl" style={{
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.25)"
          }}>
                <div className="flex gap-1">
                  {isPlus ? <Crown size={14} className="text-blue-400" /> : Array.from({
                length: 3
              }).map((_, i) => <Star key={i} size={13} className={i < superLikesLeft ? "text-blue-400 fill-blue-400" : "text-white/20 fill-white/10"} />)}
                </div>
                <span className="text-xs font-bold text-blue-300 truncate">
                  {isPlus ? i18n.t("auto.g_1502", "슈퍼라이크 무제한") : i18n.t("auto.t_0049", `슈퍼라이크 ${superLikesLeft}개 남음`)}
                </span>
              </div>

              {/* Message input */}
              <div className="mb-3">
                <label className="text-xs font-bold text-white/60 mb-2 block">{i18n.t("auto.j507")}<span className="text-white/30 font-normal truncate">{i18n.t("auto.j508")}</span></label>
                <div className="relative">
                  <textarea value={superMsg} onChange={e => setSuperMsg(e.target.value)} maxLength={80} rows={2} placeholder={i18n.t("auto.g_1503", "여행에 대한 진심을 전해보세요...")} className="w-full px-4 py-3 pr-12 rounded-2xl text-white text-sm placeholder:text-white/30 outline-none resize-none transition-all" style={{
                background: "rgba(255,255,255,0.06)",
                border: "1.5px solid rgba(99,102,241,0.3)",
                caretColor: "#60a5fa"
              }} onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.8)"} onBlur={e => e.target.style.borderColor = "rgba(99,102,241,0.3)"} />
                  <span className="absolute bottom-2.5 right-3 text-[10px] text-white/30">{superMsg.length}/80</span>
                </div>
              </div>

              {/* Quick message chips */}
              <div className="flex flex-wrap gap-1.5 mb-5 truncate">
                {[pendingSuperProfile?.destination ? i18n.t("auto.t_0050", `${pendingSuperProfile.destination}로 여행 가나요?`) : i18n.t("auto.g_1504", "여행 같이 가요!"), i18n.t("auto.g_1505", "같이 여행해요!"), i18n.t("auto.g_1506", "관심사가 비슷해요"), i18n.t("auto.g_1507", "맛집 같이 탐방해요")].map(q => <button key={q} onClick={() => setSuperMsg(q)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${superMsg === q ? "text-white" : "text-white/50"}`} style={{
              background: superMsg === q ? "linear-gradient(135deg,#3b82f6,#6366f1)" : "rgba(255,255,255,0.06)",
              border: "1px solid rgba(99,102,241,0.25)"
            }}>{q}</button>)}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button onClick={() => setShowSuperLikeModal(false)} className="flex-1 py-3.5 rounded-2xl text-white/60 font-semibold text-sm" style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)"
            }}>
                  {i18n.t("auto.j509")}
                </button>
                <motion.button whileTap={{
              scale: 0.96
            }} onClick={confirmSuperLike} className="flex-1 py-3.5 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2" style={{
              background: "linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6)",
              boxShadow: "0 8px 24px rgba(99,102,241,0.5)"
            }}>
                  <Star size={16} fill="white" className="text-white" />
                  {i18n.t("auto.j510")}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>}
    </AnimatePresence>
  );
};

// ─── Login Gate Modal ───
export const LoginGateModal = ({
  showLoginGate, setShowLoginGate
}: any) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {showLoginGate && <motion.div className="fixed inset-0 z-[80] flex items-end justify-center px-safe pb-safe pt-safe" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }}>
          <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={() => setShowLoginGate(false)} />
          <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 p-6 pb-10 shadow-float" initial={{
        y: "100%"
      }} animate={{
        y: 0
      }} exit={{
        y: "100%"
      }} transition={{
        type: "spring",
        damping: 25,
        stiffness: 300
      }}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />
            {/* Icon */}
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Heart size={28} className="text-primary" fill="currentColor" />
            </div>
            <h2 className="text-xl font-extrabold text-foreground text-center mb-2 truncate">
              {i18n.t("auto.j516")}
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed truncate">
              {i18n.t("auto.j517")}<br />{i18n.t("auto.j518")}
            </p>
            <div className="space-y-3">
              <motion.button whileTap={{
            scale: 0.97
          }} onClick={() => {
            setShowLoginGate(false);
            navigate("/login");
          }} className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-sm shadow-card">
                {i18n.t("auto.j519")}
              </motion.button>
              <motion.button whileTap={{
            scale: 0.97
          }} onClick={() => {
            setShowLoginGate(false);
            navigate("/onboarding");
          }} className="w-full py-4 rounded-2xl border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors">
                {i18n.t("auto.j520")}
              </motion.button>
              <button onClick={() => setShowLoginGate(false)} className="w-full py-2 text-xs text-muted-foreground">
                {i18n.t("auto.j521")}
              </button>
            </div>
          </motion.div>
        </motion.div>}
    </AnimatePresence>
  );
};

// ─── Filter Modal ───
export const FilterModal = ({
  showFilterModal, setShowFilterModal,
  filterAge, setFilterAge,
  filterDistance, setFilterDistance,
  filterGender, setFilterGender,
  filterMbti, setFilterMbti,
  filterLanguages, setFilterLanguages,
  filterTravelStyle, setFilterTravelStyle,
  totalActiveFilterCount,
  isPlus, canGlobalMatch,
  setCurrentIndex, setShowPlusModal
}: any) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {showFilterModal && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={() => setShowFilterModal(false)} />

          {/* Sheet */}
          <motion.div
            className="relative z-10 w-full max-w-lg mx-auto bg-card flex flex-col"
            style={{ borderRadius: '28px 28px 0 0', height: 'calc(100vh - 56px)', maxHeight: 'calc(100vh - 56px)' }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
          >
            {/* ── Sticky Header ── */}
            <div className="shrink-0 px-5 pt-4 pb-3 border-b border-border/50">
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-foreground truncate">{i18n.t("match.filterTitle")}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{i18n.t("match.filterDesc")}</p>
                </div>
                <div className="flex items-center gap-2 truncate">
                  {totalActiveFilterCount > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold truncate">
                      {totalActiveFilterCount}{i18n.t("auto.g_1476", "개 적용")}</span>
                  )}
                  <button
                    onClick={() => {
                      setFilterAge([18, 45]);
                      setFilterDistance(10);
                      setFilterGender('all');
                      setFilterMbti([]);
                      setFilterLanguages([]);
                      setFilterTravelStyle([]);
                    }}
                    className="text-xs text-muted-foreground font-bold border border-border rounded-xl px-3 py-1.5 active:scale-95 transition-transform"
                  >
                    {i18n.t("match.filterReset")}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Scrollable Body ── */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5" style={{ overscrollBehavior: 'contain' }}>

              {/* 만남 대상 */}
              <div className="bg-muted/50 rounded-2xl p-4">
                <p className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest mb-3 truncate">
                  {i18n.t("match.filterGender")}
                </p>
                <div className="flex gap-2 truncate">
                  {(['all', 'male', 'female'] as const).map(g => (
                    <button
                      key={g}
                      onClick={() => setFilterGender(g)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                        filterGender === g
                          ? 'gradient-primary text-primary-foreground shadow-sm'
                          : 'bg-card text-muted-foreground border border-border'
                      }`}
                    >
                      {g === 'all' ? i18n.t('general.all') : g === 'male' ? i18n.t('general.male') : i18n.t('general.female')}
                    </button>
                  ))}
                </div>
              </div>

              {/* 여행 스타일 */}
              <div className="bg-muted/50 rounded-2xl p-4">
                <p className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest mb-3 truncate">
                  {i18n.t("auto.j513")}
                </p>
                <div className="flex flex-wrap gap-2 truncate">
                  {TRAVEL_STYLES.map(tag => (
                    <button
                      key={tag.i18nKey}
                      onClick={() => setFilterTravelStyle((prev: string[]) => prev.includes(tag.id) ? prev.filter(x => x !== tag.id) : [...prev, tag.id])}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                        filterTravelStyle.includes(tag.id)
                          ? 'gradient-primary text-primary-foreground shadow-sm'
                          : 'bg-card text-muted-foreground border border-border'
                      }`}
                    >
                      {t(tag.i18nKey, tag.id)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 나이대 */}
              <div className="bg-muted/50 rounded-2xl p-4 relative truncate">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest truncate">
                    {i18n.t("match.filterAge")}
                    {filterAge[0] !== 18 || filterAge[1] !== 45
                      ? <span className="ml-2 text-primary normal-case font-bold truncate">{filterAge[0]}~{filterAge[1]}{i18n.language === 'ko' ? t("auto.x4057", "세") : ""}</span>
                      : null}
                  </p>
                  {!isPlus && <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500"><Crown size={11} className="text-amber-500" />Plus</span>}
                </div>
                <div className={`flex gap-2 flex-wrap ${!isPlus ? "opacity-30 blur-[1px] pointer-events-none" : ""}`}>
                  {[[18, 25], [20, 30], [25, 35], [30, 40], [35, 50], [18, 60]].map(([s, e]) => (
                    <button
                      key={`${s}-${e}`}
                      onClick={() => setFilterAge([s, e])}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                        filterAge[0] === s && filterAge[1] === e
                          ? 'gradient-primary text-primary-foreground shadow-sm'
                          : 'bg-card text-muted-foreground border border-border'
                      }`}
                    >
                      {s}~{e}{i18n.language === 'ko' ? t("auto.x4058", "세") : ""}</button>
                  ))}
                </div>
                {!isPlus && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer rounded-2xl" onClick={() => setShowPlusModal(true)}>
                    <div className="bg-background/90 px-4 py-2 rounded-full shadow-md flex items-center gap-2 border border-border">
                      <Lock size={13} className="text-foreground" />
                      <span className="text-xs font-bold text-foreground truncate">{i18n.t("match.filterAgePlus")}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 거리 */}
              <div className="bg-muted/50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest truncate">
                    {i18n.t("match.filterDist")}
                    <span className="ml-2 text-primary normal-case font-bold truncate">
                      {filterDistance === 9999 ? i18n.t('general.unlimited') : `${filterDistance}km`}
                    </span>
                  </p>
                  {!canGlobalMatch && <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500"><Crown size={11} />Plus</span>}
                </div>
                <div className="flex gap-2 truncate">
                  {[10, 30, 50, 100, 9999].map(d => (
                    <button
                      key={d}
                      onClick={() => {
                        if (d === 9999 && !canGlobalMatch) {
                          setShowPlusModal(true);
                        } else {
                          setFilterDistance(d);
                        }
                      }}
                      className={`relative flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 ${
                        filterDistance === d
                          ? 'gradient-primary text-primary-foreground shadow-sm'
                          : 'bg-card text-muted-foreground border border-border'
                      } ${d === 9999 && !canGlobalMatch ? 'opacity-60' : ''}`}
                    >
                      {d === 9999 ? i18n.t('general.unlimited') : `${d}km`}
                      {d === 9999 && !canGlobalMatch && <Lock size={9} className="absolute top-1 right-1 opacity-60" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 선호 언어 */}
              <div className="bg-muted/50 rounded-2xl p-4 relative truncate">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest truncate">
                    {i18n.t("match.filterLang")}
                    <span className="ml-1 font-normal normal-case text-muted-foreground/70 truncate">({i18n.t("general.multiSelect")})</span>
                  </p>
                  {!isPlus && <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500"><Crown size={11} />Plus</span>}
                </div>
                <div className={`flex gap-2 flex-wrap ${!isPlus ? "opacity-30 blur-[1px] pointer-events-none" : ""}`}>
                  {LANGUAGE_OPTIONS.map(l => {
                    const id = typeof l === 'string' ? l : l.id;
                    const label = typeof l === 'string' ? l : t(l.i18nKey, l.id);
                    return (
                    <button
                      key={id}
                      onClick={() => setFilterLanguages((prev: string[]) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 ${
                        filterLanguages.includes(id)
                          ? 'gradient-primary text-primary-foreground shadow-sm'
                          : 'bg-card text-muted-foreground border border-border'
                      }`}
                    >
                      {label}
                    </button>
                  )})}
                </div>
                {!isPlus && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer rounded-2xl" onClick={() => setShowPlusModal(true)}>
                    <div className="bg-background/90 px-4 py-2 rounded-full shadow-md flex items-center gap-2 border border-border">
                      <Lock size={13} className="text-foreground" />
                      <span className="text-xs font-bold text-foreground truncate">{i18n.t("match.filterLangPlus")}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* MBTI */}
              <div className="bg-muted/50 rounded-2xl p-4">
                <p className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest mb-3 truncate">
                  {i18n.t("match.filterMBTI")}
                  <span className="ml-1 font-normal normal-case text-muted-foreground/70 truncate">({i18n.t("general.multiSelect")})</span>
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {['ENFP', 'ENFJ', 'ENTP', 'ENTJ', 'ESFP', 'ESFJ', 'ESTP', 'ESTJ', 'INFP', 'INFJ', 'INTP', 'INTJ', 'ISFP', 'ISFJ', 'ISTP', 'ISTJ'].map(m => (
                    <button
                      key={m}
                      onClick={() => setFilterMbti((prev: string[]) => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])}
                      className={`py-2 rounded-xl text-[11px] font-bold text-center transition-all active:scale-95 ${
                        filterMbti.includes(m)
                          ? 'gradient-primary text-primary-foreground shadow-sm'
                          : 'bg-card text-muted-foreground border border-border'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* 하단 여백 (sticky 버튼 가림 방지) */}
              <div className="h-2" />
            </div>

            {/* ── Sticky Footer: 확인 버튼 ── */}
            <div className="shrink-0 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-border/50 bg-card">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setShowFilterModal(false);
                  setCurrentIndex(0);
                  if (totalActiveFilterCount > 0) {
                    toast({
                      title: i18n.t("auto.p527"),
                      description: i18n.t("auto.t_0023", `${totalActiveFilterCount}개 필터 적용됨`)
                    });
                  }
                }}
                className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-sm shadow-float"
              >
                {totalActiveFilterCount > 0 ? i18n.t("auto.t_0051", `${i18n.t("auto.j522")} (${totalActiveFilterCount}개 적용)`) : i18n.t("auto.j522")}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
