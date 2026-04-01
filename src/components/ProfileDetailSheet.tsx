import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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

  // Auto-translate bio on open
  useEffect(() => {
    if (!profile?.bio || bioTranslated) return;
    const doTranslate = async () => {
      setBioTranslating(true);
      try {
        const result = await translateText({
          text: profile.bio,
          targetLang: 'ko'
        });
        if (result !== profile.bio) setBioTranslated(result);
      } catch (_) {
        // silently fail
      } finally {
        setBioTranslating(false);
      }
    };
    doTranslate();
  }, [profile?.bio]);
  if (!profile) return null;

  // 여러 사진 지원 — photo_urls 또는 단일 photo
  const photos: string[] = profile.photoUrls && profile.photoUrls.length > 0 ? profile.photoUrls : [profile.photo].filter(Boolean);
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

              {/* Hero image with slider */}
              <div className="relative h-72 w-full shrink-0">
                {photos[photoIdx] ? <img src={photos[photoIdx]} alt={profile.name} className="w-full h-full object-cover" loading="lazy" onError={e => {
              (e.target as HTMLImageElement).style.display = 'none';
            }} /> : <div className="w-full h-full gradient-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-6xl font-extrabold">{profile.name?.[0] ?? "?"}</span>
                  </div>}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />

                {/* Photo nav */}
                {photos.length > 1 && <>
                    {/* Dots */}
                    <div className="absolute top-3 left-0 right-0 flex justify-center gap-1">
                      {photos.map((_, i) => <div key={i} className={`h-1 rounded-full transition-all ${i === photoIdx ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />)}
                    </div>
                    {photoIdx > 0 && <button onClick={prevPhoto} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/70 backdrop-blur-sm flex items-center justify-center">
                        <ChevronLeft size={16} className="text-foreground" />
                      </button>}
                    {photoIdx < photos.length - 1 && <button onClick={nextPhoto} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/70 backdrop-blur-sm flex items-center justify-center">
                        <ChevronRight size={16} className="text-foreground" />
                      </button>}
                  </>}

                {/* Close button */}
                <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-card/80 backdrop-blur-sm flex items-center justify-center shadow-card">
                  <X size={16} className="text-foreground" />
                </button>

                {/* Match score badge */}
                <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card/80 backdrop-blur-sm shadow-card">
                  <Zap size={12} className={scoreColor} />
                  <span className={`text-xs font-extrabold ${scoreColor}`}>{t('profileDetail.matchScore', {
                  score: profile.matchScore ?? '?'
                })}</span>
                </div>

                {/* Name overlay */}
                <div className="absolute bottom-4 left-5 right-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-1.5 flex-wrap">
                      <span>{profile.name}</span>
                      {profile.age && <span className="">, {profile.age}</span>}
                      {profile.nationality && <span className="text-xl ml-1 drop-shadow-sm">{profile.nationality.match(/[^\x00-\x7F가-힣a-zA-Z]+/g)?.[0]?.trim() || profile.nationality}</span>}
                      {profile.isPlus && <Crown size={18} className="text-amber-500 fill-amber-500 ml-0.5" />}
                    </h2>
                    {profile.verified && <VerifyBadge level={profile.verifyLevel} />}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <MapPin size={13} className="text-primary" />
                    <span className="text-sm text-muted-foreground border-r border-border pr-2">
                      {profile.location || t('profileDetail.noLocation')}{profile.distance ? ` · ${profile.distance}` : ""}
                    </span>
                    {profile.avgRating && <div className="flex items-center gap-1 bg-amber-400/15 px-2 py-0.5 rounded-full ml-1">
                        <Star size={11} className="text-amber-500 fill-amber-500" />
                        <span className="text-amber-600 dark:text-amber-400 text-xs font-extrabold">{profile.avgRating.toFixed(1)}</span>
                        {profile.reviewCount > 0 && <span className="text-amber-600/70 dark:text-amber-400/70 text-[10px]">({profile.reviewCount})</span>}
                      </div>}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="px-5 py-4 space-y-4">

                {/* Bio with translation toggle */}
                {profile.bio && <div className="bg-muted/40 rounded-2xl p-4 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">{t("auto.z_\uC790\uAE30\uC18C\uAC1C_1276")}</p>
                      {profile.bio && <button onClick={() => setShowTranslation(v => !v)} className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition-all ${showTranslation ? "bg-primary/15 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"}`}>
                          {bioTranslating ? <Loader2 size={10} className="animate-spin" /> : <Languages size={10} />}{t("auto.z_\uBC88\uC5ED_1277")}{showTranslation ? "ON" : "OFF"}
                        </button>}
                    </div>
                    {/* Original bio */}
                    <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>
                    {/* Translated bio */}
                    {showTranslation && bioTranslated && bioTranslated !== profile.bio && <div className="mt-2.5 pt-2.5 border-t border-border/60">
                        <p className="text-[10px] text-primary font-bold mb-1 flex items-center gap-1">
                          <Languages size={9} />{t("auto.z_\uBC88\uC5ED_1278")}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{bioTranslated}</p>
                      </div>}
                    {showTranslation && bioTranslating && <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Loader2 size={12} className="animate-spin" />{t("auto.z_\uBC88\uC5ED\uC911_1279")}</div>}
                  </div>}

                {/* Trip info */}
                {(profile.destination || profile.dates) && <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted">
                    <Calendar size={15} className="text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{t('profileDetail.tripInfo')}</p>
                      <p className="text-sm font-bold text-foreground">
                        {[profile.destination, profile.dates].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>}

                {/* MBTI + Gender row */}
                <div className="flex gap-2">
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
                        <p className="text-[10px] text-muted-foreground font-medium">{t('profileDetail.gender')}</p>
                        <p className="text-sm font-bold text-foreground">{profile.gender}</p>
                      </div>
                    </div>}
                </div>

                {/* Travel style tags */}
                {travelStyles.length > 0 && <div>
                    <p className="text-xs font-bold text-muted-foreground mb-2">{t('profileDetail.travelStyle')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {travelStyles.map(s => <span key={s} className="px-3 py-1.5 rounded-xl text-xs font-semibold gradient-primary text-primary-foreground">
                          {s}
                        </span>)}
                    </div>
                  </div>}

                {/* Languages */}
                {languages.length > 0 && <div>
                    <p className="text-xs font-bold text-muted-foreground mb-2">{t('profileDetail.languages')}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Globe size={13} className="text-muted-foreground" />
                      {languages.map(l => <span key={l} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted text-foreground">{l}</span>)}
                    </div>
                  </div>}
              </div>
            </div>

            {/* Action buttons — sticky bottom */}
            {showActions && <div className="flex gap-3 px-5 pb-10 pt-3 border-t border-border/30 bg-card shrink-0">
                {onLike && <motion.button whileTap={{
            scale: 0.95
          }} onClick={() => {
            onLike();
            onClose();
          }} className="flex-1 py-3.5 rounded-2xl gradient-primary text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-float">
                    <Heart size={18} fill="currentColor" /> {t('profileDetail.like')}
                  </motion.button>}
                {onChat && <motion.button whileTap={{
            scale: 0.95
          }} onClick={() => {
            onChat();
            onClose();
          }} className="flex-1 py-3.5 rounded-2xl bg-muted text-foreground font-bold flex items-center justify-center gap-2">
                    <MessageCircle size={18} /> {t('profileDetail.chat')}
                  </motion.button>}
              </div>}
          </motion.div>
        </motion.div>}
    </AnimatePresence>;
};
export default ProfileDetailSheet;