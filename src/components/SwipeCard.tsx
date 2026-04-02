import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from "framer-motion";
import { MapPin, Calendar, Star, ChevronUp, Crown, Languages, Home, Zap, Shield, Info, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { translateText } from "@/lib/translateService";
import ProfileDetailSheet from "./ProfileDetailSheet";
import VerifyBadge from "./VerifyBadge";
import TravelDNA from "./TravelDNA";
import { useSubscription } from "@/context/SubscriptionContext";
import i18n from "@/i18n";
const NATIONALITY_FLAG: Record<string, string> = {
  "South Korea": "🇰🇷",
  "United States": "🇺🇸",
  "Canada": "🇨🇦",
  "United Kingdom": "🇬🇧",
  "Australia": "🇦🇺",
  "Japan": "🇯🇵",
  "China": "🇨🇳",
  "Taiwan": "🇹🇼",
  "Singapore": "🇸🇬",
  "Thailand": "🇹🇭",
  "Vietnam": "🇻🇳",
  "Indonesia": "🇮🇩",
  "Malaysia": "🇲🇾",
  "Philippines": "🇵🇭",
  "India": "🇮🇳",
  "France": "🇫🇷",
  "Germany": "🇩🇪",
  "Italy": "🇮🇹",
  "Spain": "🇪🇸",
  "New Zealand": "🇳🇿",
  "Switzerland": "🇨🇭",
  "Netherlands": "🇳🇱",
  "Russia": "🇷🇺",
  "Brazil": "🇧🇷",
  "Mexico": "🇲🇽",
  "Turkey": "🇹🇷",
  "UAE": "🇦🇪",
  "United Arab Emirates": "🇦🇪"
};
const getNationalityFlag = (nationality?: string): string => {
  if (!nationality) return "";
  const emojiMatch = nationality.match(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu);
  if (emojiMatch?.length) return emojiMatch[0];
  for (const [key, flag] of Object.entries(NATIONALITY_FLAG)) {
    if (nationality.includes(key)) return flag;
  }
  return "";
};

// 호환성 점수 바 컴포넌트
const CompatBar = ({
  label,
  value,
  color
}: {
  label: string;
  value: number;
  color: string;
}) => <div className="flex items-center gap-1.5">
    <span className="text-[9px] text-primary-foreground/60 w-10 shrink-0">{label}</span>
    <div className="flex-1 h-1 bg-white/15 rounded-full overflow-hidden">
      <motion.div initial={{
      width: 0
    }} animate={{
      width: `${value}%`
    }} transition={{
      duration: 0.8,
      ease: "easeOut"
    }} className="h-full rounded-full" style={{
      background: color
    }} />
    </div>
    <span className="text-[9px] font-bold text-primary-foreground/80">{value}%</span>
  </div>;
interface SwipeCardProps {
  profile: any;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTop: boolean;
  isSuperLiked?: boolean;
  onProfileView?: (profileId: string) => void;
  myProfile?: any; // 내 프로필 (호환성 계산용)
}
const SwipeCard = ({
  profile,
  onSwipeLeft,
  onSwipeRight,
  isTop,
  isSuperLiked,
  onProfileView,
  myProfile
}: SwipeCardProps) => {
  const {
    t,
    i18n
  } = useTranslation();
  const {
    canViewLikers
  } = useSubscription();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);
  const [showDetail, setShowDetail] = useState(false);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const photos = profile.photoUrls && profile.photoUrls.length > 0 ? profile.photoUrls : profile.photo ? [profile.photo] : [];
  const currentPhoto = photos[currentPhotoIdx];
  const [bioT, setBioT] = useState('');
  const [loadingBio, setLoadingBio] = useState(false);
  const [showCompat, setShowCompat] = useState(false);
  const handleBioTranslate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bioT) {
      setBioT('');
      return;
    }
    if (!profile.bio) return;
    setLoadingBio(true);
    const lang = i18n.language.split('-')[0] as any;
    const result = await translateText({
      text: profile.bio,
      targetLang: lang
    });
    setBioT(result);
    setLoadingBio(false);
  };

  // 호환성 점수 세부 계산
  const compatDetails = (() => {
    if (!myProfile) return null;
    const myStyles: string[] = myProfile.travel_style || myProfile.interests || [];
    const pStyles: string[] = profile.travelStyle || [];
    const myLangs: string[] = myProfile.languages || [];
    const pLangs: string[] = profile.languages || [];
    const styleScore = myStyles.length && pStyles.length ? Math.round(myStyles.filter(s => pStyles.includes(s)).length / Math.max(myStyles.length, pStyles.length) * 100) : 50;
    const langScore = myLangs.length && pLangs.length ? Math.round(myLangs.filter(l => pLangs.includes(l)).length / Math.max(myLangs.length, pLangs.length) * 100) : 50;

    // 예산 호환성
    const BUDGET_IDX: Record<string, number> = {
      low: 0,
      mid: 1,
      high: 2,
      luxury: 3
    };
    const myBudget = BUDGET_IDX[myProfile.budget_range || 'mid'] ?? 1;
    const pBudget = BUDGET_IDX[profile.budgetRange || 'mid'] ?? 1;
    const budgetScore = Math.max(0, 100 - Math.abs(myBudget - pBudget) * 35);
    return {
      styleScore,
      langScore,
      budgetScore
    };
  })();
  const isDragging = useRef(false);
  const dragDistance = useRef(0);
  const handleDragStart = () => {
    isDragging.current = false;
    dragDistance.current = 0;
  };
  const handleDrag = (_: unknown, info: PanInfo) => {
    dragDistance.current = Math.abs(info.offset.x);
    if (dragDistance.current > 8) isDragging.current = true;
  };
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 120) onSwipeRight();else if (info.offset.x < -120) onSwipeLeft();
    setTimeout(() => {
      isDragging.current = false;
      dragDistance.current = 0;
    }, 50);
  };
  const handleTap = () => {
    if (isDragging.current || dragDistance.current > 8) return;
    if (profile?.id) onProfileView?.(profile.id);
    setShowDetail(true);
  };
  const isLocal = profile.userType === 'local' || profile.user_type === 'local';
  const trustScore = profile.trustScore ?? profile.trust_score;
  const isBlurTarget = profile.isLiker && !canViewLikers;
  return <>
    <motion.div className="absolute inset-0 cursor-grab active:cursor-grabbing" style={{
      x,
      rotate,
      zIndex: isTop ? 10 : 0
    }} drag={isTop ? "x" : false} dragConstraints={{
      left: 0,
      right: 0
    }} dragElastic={0.9} onDragStart={handleDragStart} onDrag={handleDrag} onDragEnd={handleDragEnd} onTap={isTop ? handleTap : undefined} exit={{
      x: 300,
      opacity: 0,
      transition: {
        duration: 0.3
      }
    }}>
      <div className="relative w-full h-full rounded-3xl bg-card overflow-hidden shadow-float">
        {/* Top Progress Dots */}
        {photos.length > 1 && (
          <div className="absolute top-2 left-2 right-2 flex gap-1 z-30 pointer-events-none">
            {photos.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i === currentPhotoIdx ? "bg-white" : "bg-white/40"}`} />
            ))}
          </div>
        )}

        {/* Full Screen Image */}
        {currentPhoto ? <>
            <img src={currentPhoto} alt="Profile" className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${isBlurTarget ? 'blur-2xl scale-110 brightness-75' : ''}`} draggable="false" />
            {isBlurTarget && <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center z-10 pointer-events-none">
                <Crown size={48} className="text-amber-400 mb-4 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                <p className="text-white font-black text-xl drop-shadow-lg text-center px-4">{t("auto.z_\uB098\uB97C\uC88B\uC544\uC694\uD588\uC5B4\uC694_1223")}</p>
                <p className="text-white/80 text-sm mt-2 font-bold text-center px-6 leading-relaxed">{t("auto.z_MIGOPlus\uC774\uC0C1_1224")}<br />{t("auto.z_\uB204\uAD70\uC9C0\uD655\uC778\uD560\uC218\uC788\uC2B5\uB2C8_1225")}</p>
              </div>}
          </> : <div className="absolute inset-0 w-full h-full gradient-primary flex flex-col items-center justify-center p-6 text-center">
             <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3">
                <span className="text-3xl font-black text-white">{profile.name?.[0] || "?"}</span>
             </div>
             <p className="text-white/80 text-sm font-semibold">{t('auto.j507')}</p>
          </div>}

        {/* Tap areas for photo sliding (left 40%, right 40%) */}
        {isTop && photos.length > 1 && (
          <>
            <div 
              className="absolute top-10 bottom-32 left-0 w-[40%] z-20 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (currentPhotoIdx > 0) setCurrentPhotoIdx(i => i - 1);
              }}
            />
            <div 
              className="absolute top-10 bottom-32 right-0 w-[40%] z-20 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (currentPhotoIdx < photos.length - 1) setCurrentPhotoIdx(i => i + 1);
              }}
            />
          </>
        )}

        {/* ── 현지인 테두리 / 프리미엄 테두리 ── */}
        {profile.isPremium ? <div className="absolute inset-0 pointer-events-none rounded-3xl" style={{
          boxShadow: "inset 0 0 0 4px rgba(251,191,36,0.8), 0 0 20px rgba(251,191,36,0.3)"
        }} /> : isLocal ? <div className="absolute inset-0 pointer-events-none rounded-3xl" style={{
          boxShadow: "inset 0 0 0 3px rgba(34,197,94,0.7)"
        }} /> : null}

        {/* Like/Nope indicators */}
        <motion.div className="absolute top-8 right-6 border-4 border-primary rounded-xl px-4 py-2 rotate-12 z-50 backdrop-blur-sm bg-background/50" style={{
          opacity: likeOpacity
        }}>
          <span className="text-primary text-2xl font-black tracking-widest uppercase">LIKE</span>
        </motion.div>
        <motion.div className="absolute top-8 left-6 border-4 border-rose-500 rounded-xl px-4 py-2 -rotate-12 z-50 backdrop-blur-sm bg-background/50" style={{
          opacity: nopeOpacity
        }}>
          <span className="text-rose-500 text-2xl font-black tracking-widest uppercase">NOPE</span>
        </motion.div>

        {/* SuperLike Indicator */}
        <AnimatePresence>
          {isSuperLiked && <motion.div initial={{
            scale: 0,
            opacity: 0
          }} animate={{
            scale: 1,
            opacity: 1
          }} exit={{
            scale: 0,
            opacity: 0
          }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-blue-500/20 backdrop-blur-md p-6 rounded-full border-2 border-blue-400 shadow-2xl">
                <motion.div animate={{
              rotate: 360
            }} transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}>
                   <Star size={48} className="text-blue-400 fill-blue-400 drop-shadow-lg" />
                </motion.div>
             </motion.div>}
        </AnimatePresence>

        {/* Gradient Overlay for Text */}
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none" />

        {/* Profile Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pt-12 flex flex-col gap-2 pointer-events-none">
          <div className="flex justify-between items-end">
             <div className="flex flex-col">
                <h2 className="text-3xl font-black text-white drop-shadow-lg flex items-center gap-2">
                   {profile.name}
                   <span className="text-2xl font-medium text-white/80">{profile.age && `, ${profile.age}`}</span>
                   {profile.verified && <VerifyBadge level={profile.verifyLevel} />}
                </h2>
                
                {/* ── 배지 ── */}
                <div className="flex items-center gap-2 mt-2">
                   {isLocal && !profile.isPremium && <div className="flex items-center gap-1 bg-emerald-500 px-2.5 py-1 rounded shadow-sm">
                         <Home size={11} className="text-white" />
                         <span className="text-white text-[10px] font-extrabold uppercase tracking-wide">{t("auto.z_\uD604\uC9C0\uC778_1226")}</span>
                      </div>}
                   {profile.isPremium && <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 rounded shadow-md border border-amber-300 pointer-events-none">
                         <Crown size={11} className="text-white fill-white" />
                         <span className="text-white text-[10px] font-extrabold uppercase tracking-widest drop-shadow-md">Premium</span>
                      </div>}
                   {(trustScore ?? 0) > 0 && <div className={`flex items-center gap-1 border px-2 py-1 rounded shadow-sm backdrop-blur ${profile.isPremium ? 'bg-amber-500/20 border-amber-300' : 'bg-black/40 border-white/20'}`}>
                         <Shield size={10} className={profile.isPremium ? "text-amber-400" : "text-emerald-400"} />
                         <span className={`text-[10px] font-bold ${profile.isPremium ? 'text-amber-300 drop-shadow-sm' : 'text-white'}`}>{t("auto.z_\uC2E0\uB8B0_1227")}{trustScore}</span>
                      </div>}
                </div>

                {isTop && profile.isLiker && !isBlurTarget && <div className="mt-2 text-[11px] font-bold text-amber-300 flex items-center gap-1.5 drop-shadow pointer-events-none">
                      <Star size={12} className="fill-amber-300" />{t("auto.z_\uB098\uB97C\uBA3C\uC800\uC88B\uC544\uC694\uD588\uC5B4\uC694_1228")}</div>}
             </div>

             {/* Info Button */}
             <button onClick={e => {
              e.stopPropagation();
              if (profile?.id) onProfileView?.(profile.id);
              setShowDetail(true);
            }} className="pointer-events-auto w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center transition-transform hover:scale-110 active:scale-95 border border-white/30 shrink-0">
               <Info size={20} className="text-white" />
             </button>
          </div>

          <div className="flex items-center gap-2 text-white/90 text-sm font-semibold drop-shadow-md">
            <MapPin size={16} />
            <span className="line-clamp-1">
              {profile.location}
              {profile.distance ? ` • ${profile.distance}` : ""}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-white/80 text-sm font-medium drop-shadow-md line-clamp-2 leading-relaxed max-w-[85%]">
             <span className="opacity-70"><User size={14} className="inline mr-1 -mt-0.5" /></span>
             {bioT || profile.bio}
          </div>

          {/* Tags */}
          {profile.tags && profile.tags.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">
               {profile.tags.slice(0, 3).map(tag => <span key={tag} className="px-2 py-1 rounded-md bg-white/10 backdrop-blur border border-white/20 text-white text-[10px] font-extrabold uppercase tracking-widest shadow-sm">
                     {tag}
                  </span>)}
            </div>}
        </div>
      </div>
    </motion.div>

    {showDetail && <ProfileDetailSheet profile={profile} onClose={() => setShowDetail(false)} onLike={onSwipeRight} showActions={true} />}
  </>;
};

export default SwipeCard;