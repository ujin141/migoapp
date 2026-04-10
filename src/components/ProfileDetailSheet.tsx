import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Calendar, Heart, MessageCircle, Zap, ChevronLeft, ChevronRight, User, Globe, Sparkles, Crown, Star, Languages, Loader2 } from "lucide-react";
import VerifyBadge from "./VerifyBadge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { translateText } from "@/lib/translateService";
interface ProfileDetailSheetProps {
  profile: any | null;
  onClose: () => void;
  onLike?: () => void;
  onChat?: () => void;
  showActions?: boolean;
}
const ProfileDetailSheet = ({
  profile,
  onClose,
  onLike,
  onChat,
  showActions = true
}: ProfileDetailSheetProps) => {
  const {
    t
  } = useTranslation();
  const [photoIdx, setPhotoIdx] = useState(0);
  const {
    user
  } = useAuth();
  const [bioTranslated, setBioTranslated] = useState<string | null>(null);
  const [bioTranslating, setBioTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true); // default open

  // UUID validation helper
  const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  useEffect(() => {
    if (profile?.id && user?.id && profile.id !== user.id && isValidUUID(profile.id)) {
      // 내 프로필 본 사람 방문 기록 저장
      const logView = async () => {
        const {
          data
        } = await supabase.from("profile_views").select("id").eq("viewer_id", user.id).eq("viewed_id", profile.id).maybeSingle();
        if (!data) {
          const {
            error
          } = await supabase.from("profile_views").insert({
            viewer_id: user.id,
            viewed_id: profile.id
          });
          if (error && error.code !== '23505') {
            // Ignore 409 conflict
            console.error("Failed to log profile view:", error.message);
          }
        }
      };
      logView();
    }
  }, [profile?.id, user?.id]);

  // profile이 바뀌면 번역 캐시 초기화
  useEffect(() => {
    setBioTranslated(null);
    setShowTranslation(true);
    setPhotoIdx(0); // 사진 인덱스도 리셋
  }, [profile?.id]);

  // Auto-translate bio on open
  useEffect(() => {
    if (!profile?.bio) return;
    const doTranslate = async () => {
      setBioTranslating(true);
      try {
        const lang = i18n.language?.split('-')[0] || 'ko';
        const result = await translateText({
          text: profile.bio,
          targetLang: lang as any
        });
        if (result !== profile.bio) setBioTranslated(result);
      } catch (_) {
        // silently fail
      } finally {
        setBioTranslating(false);
      }
    };
    doTranslate();
  }, [profile?.id, profile?.bio]);
  if (!profile) return null;

  // 여러 사진 지원 — photo_urls 또는 단일 photo
  const photos: string[] = profile.photoUrls && profile.photoUrls.length > 0 ? profile.photoUrls.filter((u: string) => !!u) : [profile.photo].filter((u: string | undefined): u is string => !!u);
  const travelStyles: string[] = Array.isArray(profile.travelStyle) ? profile.travelStyle : Array.isArray(profile.tags) ? profile.tags : [];
  const languages: string[] = Array.isArray(profile.languages) ? profile.languages : [];
  const scoreColor = (profile.matchScore ?? 0) >= 80 ? "text-emerald-400" : (profile.matchScore ?? 0) >= 60 ? "text-yellow-400" : "text-muted-foreground";
  const prevPhoto = () => setPhotoIdx(i => Math.max(0, i - 1));
  const nextPhoto = () => setPhotoIdx(i => Math.min(photos.length - 1, i + 1));
  return <AnimatePresence>
      {profile && <motion.div className="fixed inset-0 z-[70] flex items-end justify-center px-safe pb-safe pt-safe" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-foreground/70 backdrop-blur-md" onClick={onClose} />

          <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 overflow-hidden shadow-float max-h-[92vh] flex flex-col" initial={{
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
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1">

              {/* ── Hero image with multi-photo slider ── */}
              <div className="relative h-72 w-full shrink-0 bg-muted overflow-hidden">

                {/* Main photo with fade animation */}
                <AnimatePresence initial={false} mode="wait">
                  {photos[photoIdx] ? (
                    <motion.img
                      key={photoIdx}
                      src={photos[photoIdx]}
                      alt={profile.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="absolute inset-0 gradient-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-6xl font-extrabold">{profile.name?.[0] ?? "?"}</span>
                    </div>
                  )}
                </AnimatePresence>

                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent pointer-events-none" />

                {/* ── Invisible tap zones for swipe (left 40% / right 40%) ── */}
                {photos.length > 1 && (
                  <>
                    <div
                      className="absolute top-0 bottom-16 left-0 w-2/5 z-20 cursor-pointer"
                      onClick={() => setPhotoIdx(i => Math.max(0, i - 1))}
                    />
                    <div
                      className="absolute top-0 bottom-16 right-0 w-2/5 z-20 cursor-pointer"
                      onClick={() => setPhotoIdx(i => Math.min(photos.length - 1, i + 1))}
                    />
                  </>
                )}

                {/* ── Top: progress dots + counter pill ── */}
                {photos.length > 1 && (
                  <div className="absolute top-3 left-3 right-3 flex items-center gap-2 z-30 pointer-events-none">
                    {/* Dot progress bar */}
                    <div className="flex gap-1 flex-1">
                      {photos.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-200 ${i === photoIdx ? "bg-white" : "bg-white/40"}`}
                        />
                      ))}
                    </div>
                    {/* n/total pill */}
                    <div className="bg-black/55 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-0.5 pointer-events-auto shrink-0">
                      <span className="text-[11px] font-extrabold text-white leading-none">{photoIdx + 1}</span>
                      <span className="text-[10px] text-white/50 leading-none mx-0.5">/</span>
                      <span className="text-[11px] font-bold text-white/80 leading-none">{photos.length}</span>
                    </div>
                  </div>
                )}

                {/* ── Prev / Next chevron buttons ── */}
                {photos.length > 1 && <>
                    {photoIdx > 0 && (
                      <button
                        onClick={prevPhoto}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/70 backdrop-blur-sm flex items-center justify-center z-30 shadow-sm"
                      >
                        <ChevronLeft size={16} className="text-foreground" />
                      </button>
                    )}
                    {photoIdx < photos.length - 1 && (
                      <button
                        onClick={nextPhoto}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/70 backdrop-blur-sm flex items-center justify-center z-30 shadow-sm"
                      >
                        <ChevronRight size={16} className="text-foreground" />
                      </button>
                    )}
                  </>}

                {/* Close button */}
                <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-card/80 backdrop-blur-sm flex items-center justify-center shadow-card z-30">
                  <X size={16} className="text-foreground" />
                </button>

                {/* Match score badge */}
                <div
                  className="absolute left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card/80 backdrop-blur-sm shadow-card z-30"
                  style={{ top: photos.length > 1 ? '3.25rem' : '1rem' }}
                >
                  <Zap size={12} className={scoreColor} />
                  <span className={`text-xs font-extrabold ${scoreColor}`}>{i18n.t('profileDetail.matchScore', {
                  score: profile.matchScore ?? '?'
                })}</span>
                </div>

                {/* Name overlay */}
                <div className="absolute bottom-4 left-5 right-5 z-10">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-1.5 flex-wrap">
                      <span>{profile.name}</span>
                      {profile.age && <span>, {profile.age}</span>}
                      {profile.nationality && <span className="text-xl ml-1 drop-shadow-sm">{profile.nationality.match(/[^\x00-\x7F가-힣a-zA-Z]+/g)?.[0]?.trim() || profile.nationality}</span>}
                      {profile.isPlus && <Crown size={18} className="text-amber-500 fill-amber-500 ml-0.5" />}
                    </h2>
                    {profile.verified && <VerifyBadge level={profile.verifyLevel} />}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <MapPin size={13} className="text-primary" />
                    <span className="text-sm text-muted-foreground border-r border-border pr-2 truncate">
                      {profile.location || i18n.t('profileDetail.noLocation')}{profile.distance ? ` · ${profile.distance}` : ""}
                    </span>
                    {profile.avgRating && <div className="flex items-center gap-1 bg-amber-400/15 px-2 py-0.5 rounded-full ml-1">
                        <Star size={11} className="text-amber-500 fill-amber-500" />
                        <span className="text-amber-600 dark:text-amber-400 text-xs font-extrabold">{profile.avgRating.toFixed(1)}</span>
                        {profile.reviewCount > 0 && <span className="text-amber-600/70 dark:text-amber-400/70 text-[10px]">({profile.reviewCount})</span>}
                      </div>}
                  </div>
                </div>
              </div>

              {/* ── Photo thumbnail strip — only when 2+ photos ── */}
              {photos.length > 1 && (
                <div className="px-4 pt-3 pb-0 border-b border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest truncate">{i18n.t("auto.g_0197", "사진")}</span>
                    <span className="text-[10px] font-bold bg-primary/10 text-primary rounded-full px-1.5 py-0.5 truncate">{photos.length}{i18n.t("auto.g_0198", "장")}</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-3 hide-scrollbar">
                    {photos.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setPhotoIdx(i)}
                        className={`relative shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden border-2 transition-all duration-150 ${
                          i === photoIdx
                            ? 'border-primary shadow-[0_0_0_3px_rgba(var(--primary)/0.2)]'
                            : 'border-transparent opacity-60 hover:opacity-90'
                        }`}
                      >
                        <img
                          src={url}
                          alt={`photo ${i + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {/* Selected overlay */}
                        {i === photoIdx && (
                          <div className="absolute inset-0 bg-primary/15 rounded-xl" />
                        )}
                        {/* Index badge */}
                        <div className="absolute bottom-1 right-1 bg-black/60 rounded-md text-[9px] text-white font-extrabold px-1 leading-tight">
                          {i + 1}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="px-5 py-4 space-y-4 truncate">

                {/* Bio with translation toggle */}
                {profile.bio && <div className="bg-muted/40 rounded-2xl p-4 border border-border truncate">
                    <div className="flex items-center justify-between mb-2 truncate">
                      <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest truncate">{i18n.t("auto.z_\uC790\uAE30\uC18C\uAC1C_1276", "\uC790\uAE30\uC18C\uAC1C")}</p>
                      {profile.bio && <button onClick={() => setShowTranslation(v => !v)} className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition-all ${showTranslation ? "bg-primary/15 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"}`}>
                          {bioTranslating ? <Loader2 size={10} className="animate-spin" /> : <Languages size={10} />}{i18n.t("auto.z_\uBC88\uC5ED_1277", "\uBC88\uC5ED")}{showTranslation ? "ON" : "OFF"}
                        </button>}
                    </div>
                    {/* Original bio */}
                    <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>
                    {/* Translated bio */}
                    {showTranslation && bioTranslated && bioTranslated !== profile.bio && <div className="mt-2.5 pt-2.5 border-t border-border/60">
                        <p className="text-[10px] text-primary font-bold mb-1 flex items-center gap-1 truncate">
                          <Languages size={9} />{i18n.t("auto.z_\uBC88\uC5ED_1278", "\uBC88\uC5ED")}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{bioTranslated}</p>
                      </div>}
                    {showTranslation && bioTranslating && <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                        <Loader2 size={12} className="animate-spin" />{i18n.t("auto.z_\uBC88\uC5ED\uC911_1279", "\uBC88\uC5ED\uC911")}</div>}
                  </div>}

                {/* Trip info */}
                {(profile.destination || profile.dates) && <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted">
                    <Calendar size={15} className="text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium truncate">{i18n.t('profileDetail.tripInfo')}</p>
                      <p className="text-sm font-bold text-foreground">
                        {[profile.destination, profile.dates].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>}

                {/* MBTI + Gender row */}
                <div className="flex gap-2 truncate">
                  {profile.mbti && <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-primary/10 flex-1">
                      <Sparkles size={13} className="text-primary shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground font-medium">MBTI</p>
                        <p className="text-sm font-bold text-foreground">{profile.mbti}</p>
                      </div>
                    </div>}
                  {profile.gender && <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-muted flex-1">
                      <User size={13} className="text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground font-medium truncate">{i18n.t('profileDetail.gender')}</p>
                        <p className="text-sm font-bold text-foreground">{profile.gender}</p>
                      </div>
                    </div>}
                </div>

                {/* Travel style tags */}
                {travelStyles.length > 0 && <div>
                    <p className="text-xs font-bold text-muted-foreground mb-2 truncate">{i18n.t('profileDetail.travelStyle')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {travelStyles.map(s => <span key={s} className="px-3 py-1.5 rounded-xl text-xs font-semibold gradient-primary text-primary-foreground">
                          {s}
                        </span>)}
                    </div>
                  </div>}

                {/* Languages */}
                {languages.length > 0 && <div>
                    <p className="text-xs font-bold text-muted-foreground mb-2 truncate">{i18n.t('profileDetail.languages')}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Globe size={13} className="text-muted-foreground" />
                      {languages.map(l => <span key={l} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted text-foreground">{l}</span>)}
                    </div>
                  </div>}
              </div>
            </div>

            {/* Action buttons — sticky bottom */}
            {showActions && <div className="flex gap-3 px-5 pb-10 pt-3 border-t border-border/30 bg-card shrink-0 truncate">
                {onLike && <motion.button whileTap={{
            scale: 0.95
          }} onClick={() => {
            onLike();
            onClose();
          }} className="flex-1 py-3.5 rounded-2xl gradient-primary text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-float">
                    <Heart size={18} fill="currentColor" /> {i18n.t('profileDetail.like')}
                  </motion.button>}
                {onChat && <motion.button whileTap={{
            scale: 0.95
          }} onClick={() => {
            onChat();
            onClose();
          }} className="flex-1 py-3.5 rounded-2xl bg-muted text-foreground font-bold flex items-center justify-center gap-2">
                    <MessageCircle size={18} /> {i18n.t('profileDetail.chat')}
                  </motion.button>}
              </div>}
          </motion.div>
        </motion.div>}
    </AnimatePresence>;
};
export default ProfileDetailSheet;