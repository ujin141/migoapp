import i18n from "@/i18n";
import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from "framer-motion";
import { MapPin, Calendar, Star, ChevronUp, Crown, Languages, Home, Zap, Shield, Info, User, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { translateText } from "@/lib/translateService";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import ProfileDetailSheet from "./ProfileDetailSheet";
import ReportBlockActionSheet from "./ReportBlockActionSheet";
import VerifyBadge from "./VerifyBadge";
import TravelDNA, { inferDNA, getMatchPct } from "./TravelDNA";
import { useSubscription } from "@/context/SubscriptionContext";
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

const getOnlineLabel = (isOnline?: boolean, lastSeen?: string | null, _profileId?: string): { label: string; color: string; pulse: boolean } | null => {
  if (isOnline) return { label: i18n.t("auto.v2_online", "접속 중"), color: "bg-emerald-500", pulse: true };
  if (!lastSeen) return null;

  const diff = Date.now() - new Date(lastSeen).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 30) return { label: i18n.t("auto.v2_online_just", "방금 접속"), color: "bg-emerald-400", pulse: false };
  if (mins < 120) return { label: i18n.t("auto.v2_online_mins", { mins, defaultValue: `${mins}분 전` }), color: "bg-amber-400", pulse: false };
  
  const hrs = Math.floor(mins / 60);
  if (hrs < 72) return { label: i18n.t("auto.v2_online_hrs", { hrs, defaultValue: `${hrs}시간 전` }), color: "bg-orange-400", pulse: false };
  return null;
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
  onChat?: () => void;
  isTop: boolean;
  isSuperLiked?: boolean;
  onProfileView?: (profileId: string) => void;
  myProfile?: any; // 내 프로필 (호환성 계산용)
  myDailyMission?: string;
  onPremiumClick?: () => void;
}
const SwipeCard = ({
  profile,
  onSwipeLeft,
  onSwipeRight,
  onChat,
  isTop,
  isSuperLiked,
  onProfileView,
  myProfile,
  myDailyMission,
  onPremiumClick
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
  const [showReport, setShowReport] = useState(false);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const photos = profile.photoUrls && profile.photoUrls.length > 0 ? profile.photoUrls : profile.photo ? [profile.photo] : [];
  const currentPhoto = photos[currentPhotoIdx];
  const [bioT, setBioT] = useState('');
  const [loadingBio, setLoadingBio] = useState(false);
  const [showCompat, setShowCompat] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
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

  // 1. Calculate overall compatibility score
  const overallMatch = (() => {
    const theirDNA = inferDNA(profile);
    const myDNA = myProfile ? inferDNA(myProfile) : null;
    if (!myDNA) return 75; // Fallback score
    
    const spontaneousVal = getMatchPct(myDNA.spontaneous, theirDNA.spontaneous);
    const activeVal = getMatchPct(myDNA.active, theirDNA.active);
    const earlyBirdVal = getMatchPct(myDNA.earlyBird, theirDNA.earlyBird);
    const budgetVal = getMatchPct(myDNA.budget, theirDNA.budget);
    const socialVal = getMatchPct(myDNA.social, theirDNA.social);
    
    return Math.round((spontaneousVal + activeVal + earlyBirdVal + budgetVal + socialVal) / 5);
  })();

  const fateInsight = (() => {
    const source = `${profile.id || profile.name || "migo"}:${profile.location || ""}`;
    const seed = Array.from(source).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const tags: string[] = profile.tags || profile.interests || profile.travelStyle || [];
    const mood = profile.travelMission || tags[0] || "여행 무드";
    const routeScore = Math.min(96, Math.max(61, overallMatch + (seed % 17) - 6));
    const nearMinutes = 12 + (seed % 39);
    const distanceKm = typeof profile.distanceKm === "number" ? profile.distanceKm : null;

    if (distanceKm !== null && distanceKm <= 5) {
      return {
        label: "MISSED CROSSING",
        title: "오늘 스친 가능성",
        detail: `${nearMinutes}분 차이로 근처에 있었을 수 있어요`,
        metric: `${Math.min(94, routeScore + 4)}%`,
      };
    }

    if (routeScore >= 84) {
      return {
        label: "ROUTE FATE",
        title: "내일 동선 겹침",
        detail: `${mood} 루트가 비슷한 여행자`,
        metric: `${routeScore}%`,
      };
    }

    return {
      label: "TRAVEL DNA",
      title: "여행 취향 닮음",
      detail: `${mood} 성향이 가까운 사람`,
      metric: `${routeScore}%`,
    };
  })();

  // 신비롭고 럭셔리한 천체 여행 타로카드 아키타입 매핑
  const getTarotArchetype = () => {
    const mbti = profile.mbti || "";
    const interests = profile.interests || [];
    const isSpontaneous = mbti.includes("P") || profile.travelMission === "즉흥 번개" || interests.some((i: string) => i.includes("즉흥"));
    const isFoodie = profile.travelMission?.includes("맛집") || interests.some((i: string) => i.includes("맛집") || i.includes("미식") || i.includes("카페"));
    const isNight = profile.travelMission?.includes("야경") || interests.some((i: string) => i.includes("야경") || i.includes("밤") || i.includes("클럽") || i.includes("술"));
    
    if (isSpontaneous && isFoodie) {
      return {
        title: "THE CELESTIAL GOURMETS",
        subtitle: "🔮 우주적 즉흥 미식 탐험가 🔮",
        spark: "98%",
        description: "두 분은 낯선 도시의 뒷골목 노포 맛집과 즉흥적인 밤 야시장 투어를 함께 정복하기 위해 매칭된 환상의 미식 메이트입니다! 식도락의 별자리가 빛납니다. 🍲"
      };
    }
    if (isSpontaneous && isNight) {
      return {
        title: "THE NEON NOMADS",
        subtitle: "🔮 화려한 네온 야경의 유랑자 🔮",
        spark: "96%",
        description: "찬란한 도시 야경 아래 시원한 생맥주 잔을 즉흥적으로 부딪칠 때 케미가 은하수처럼 폭발하는 밤동행 파트너입니다. 어둠 속에 가장 찬란한 우정입니다! 🌃"
      };
    }
    if (isFoodie) {
      return {
        title: "THE LOCAL GOURMETS",
        subtitle: "🔮 깊은 미식 맛의 순례자 🔮",
        spark: "93%",
        description: "숨겨진 로컬 맛집부터 SNS 핫플 디저트 카페 투어까지 취향이 온전히 통합니다. 함께 맛있는 추억을 숟가락 가득 채워갈 운명적인 맛 인연입니다. ☕"
      };
    }
    if (mbti.includes("E")) {
      return {
        title: "THE SUN KINGS & QUEENS",
        subtitle: "🔮 에너제틱 태양의 동반자 🔮",
        spark: "94%",
        description: "지치지 않는 텐션으로 전 세계 테마파크와 페스티벌을 누비며 우정을 증폭시킬 최고의 동행입니다. 걷는 곳마다 축제 분위기가 열릴 거예요! 🎡"
      };
    }
    return {
      title: "THE WANDERLUST STARS",
      subtitle: "🔮 고요하게 흐르는 은하수 여행자 🔮",
      spark: "95%",
      description: "노을 지는 강변을 묵묵히 걷거나 잔잔한 음악을 함께 들으며 여행할 때 가장 완벽한 교감을 나눕니다. 서로를 말없이 배려하는 가장 품격있는 동행입니다. ✈️"
    };
  };

  const tarot = getTarotArchetype();

  const isDragging = useRef(false);
  const dragDistance = useRef(0);
  const hapticTriggered = useRef(false);

  const handleDragStart = () => {
    isDragging.current = false;
    dragDistance.current = 0;
    hapticTriggered.current = false;
  };
  const handleDrag = (_: unknown, info: PanInfo) => {
    dragDistance.current = Math.abs(info.offset.x);
    if (dragDistance.current > 8) isDragging.current = true;
    
    // 네이티브 느낌: 스와이프 임계점(120)을 지날 때 살짝 틱- 하는 햅틱 피드백
    if (dragDistance.current > 120 && !hapticTriggered.current) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      hapticTriggered.current = true;
    } else if (dragDistance.current < 110 && hapticTriggered.current) {
      // 임계점 밑으로 다시 돌아오면 초기화 (다시 넘을 때 또 반응)
      hapticTriggered.current = false;
    }
  };
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 120) {
      onSwipeRight();
    } else if (info.offset.x < -120) {
      onSwipeLeft();
    } else if (dragDistance.current > 20) {
      // 카드가 다시 제자리로 돌아갈 때 튕김(Snap) 햅틱
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }
    setTimeout(() => {
      isDragging.current = false;
      dragDistance.current = 0;
    }, 50);
  };
  const handleTap = () => {
    if (isDragging.current || dragDistance.current > 8) return;
    if (isBlurTarget) {
      if (onPremiumClick) onPremiumClick();
      return;
    }
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
    }} dragElastic={0.6} onDragStart={handleDragStart} onDrag={handleDrag} onDragEnd={handleDragEnd} onTap={isTop ? handleTap : undefined} exit={{
      x: 300,
      opacity: 0,
      rotate: 15,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    }}>
      <div 
        className="w-full h-full relative transition-transform duration-700"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          perspective: "1000px"
        }}
      >
        {/* 앞면 (Profile Front Card) */}
        <div 
          className="absolute inset-0 rounded-[28px] bg-card overflow-hidden shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] truncate touch-none select-none"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden"
          }}
        >
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
            <img src={currentPhoto} alt="Profile" className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${isBlurTarget ? 'blur-2xl scale-110 brightness-75' : ''}`} draggable="false" onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              e.currentTarget.parentElement?.classList.add('gradient-primary');
            }} />
            {isBlurTarget && <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center z-10 pointer-events-none">
                <Crown size={48} className="text-amber-400 mb-4 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                <p className="text-white font-black text-xl drop-shadow-lg text-center px-4 truncate">{i18n.t("auto.z_\uB098\uB97C\uC88B\uC544\uC694\uD588\uC5B4\uC694_1223", "\uB098\uB97C\uC88B\uC544\uC694\uD588\uC5B4\uC694")}</p>
                <p className="text-white/80 text-sm mt-2 font-bold text-center px-6 leading-relaxed truncate">{i18n.t("auto.z_MIGOPlus\uC774\uC0C1_1224", "MIGOPlus\uC774\uC0C1")}<br />{i18n.t("auto.z_\uB204\uAD70\uC9C0\uD655\uC778\uD560\uC218\uC788\uC2B5\uB2C8_1225", "\uB204\uAD70\uC9C0\uD655\uC778\uD560\uC218\uC788\uC2B5\uB2C8")}</p>
              </div>}
          </> : <div className="absolute inset-0 w-full h-full gradient-primary flex flex-col items-center justify-center p-6 text-center">
             <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3">
                <span className="text-3xl font-black text-white">{profile.name?.[0] || "?"}</span>
             </div>
             <p className="text-white/80 text-sm font-semibold truncate">{i18n.t('auto.j507')}</p>
          </div>}

        {/* ── DNA 궁합 매칭 배지 ── */}
        {isTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.15 }}
            onClick={(e) => {
              e.stopPropagation();
              Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
              setIsFlipped(true);
            }}
            className="absolute top-5 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-full px-2.5 py-1.5 shadow-[0_0_15px_rgba(251,191,36,0.35)] border border-amber-400/40 z-30 pointer-events-auto cursor-pointer select-none active:scale-95 transition-transform"
          >
            <motion.span 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-xs shrink-0"
            >
              🔮
            </motion.span>
            <span className="text-[10px] text-amber-300 font-extrabold tracking-wide leading-none shrink-0">
              Fate Sync {overallMatch}%
            </span>
            <span className="text-[7px] text-amber-300/60 leading-none shrink-0">▼</span>
          </motion.div>
        )}

        {/* ── 실시간 접속 상태 배지 ── */}
        {(() => {
          const onlineBadge = getOnlineLabel(profile.isOnline, profile.lastSeen, profile.id);
          if (!onlineBadge || !isTop) return null;
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="absolute top-5 right-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-md rounded-full px-2.5 py-1.5 shadow-lg border border-white/15 z-30 pointer-events-none"
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${onlineBadge.color} ${onlineBadge.pulse ? 'animate-pulse' : ''}`}
              />
              <span className="text-[10px] text-white font-bold tracking-wide leading-none">{onlineBadge.label}</span>
            </motion.div>
          );
        })()}

        {/* Tap areas for photo sliding (left 40%, right 40%) */}
        {isTop && photos.length > 1 && (
          <>
            <div 
              className="absolute top-10 bottom-32 left-0 w-[40%] z-20 cursor-pointer touch-none"
              onClick={(e) => {
                e.stopPropagation();
                if (currentPhotoIdx > 0) {
                  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
                  setCurrentPhotoIdx(i => i - 1);
                }
              }}
            />
            <div 
              className="absolute top-10 bottom-32 right-0 w-[40%] z-20 cursor-pointer touch-none"
              onClick={(e) => {
                e.stopPropagation();
                if (currentPhotoIdx < photos.length - 1) {
                  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
                  setCurrentPhotoIdx(i => i + 1);
                }
              }}
            />
          </>
        )}

        {/* ── 현지인 테두리 / 프리미엄 테두리 / 프로필 테마 ── */}
        {(() => {
          let shadows: string[] = [];
          
          // 1. Inset Border (Premium vs Theme vs Local)
          if (profile.isPremium) {
            shadows.push("inset 0 0 0 4px rgba(251,191,36,1)"); // Gold Border for Premium
          } else if (profile.profileTheme && profile.profileTheme !== 'default') {
            const THEME_BORDERS: Record<string, string> = {
              aurora: "inset 0 0 0 4px rgba(168,85,247,0.8)",
              sunset: "inset 0 0 0 4px rgba(244,63,94,0.8)",
              neon: "inset 0 0 0 4px rgba(6,182,212,0.8)",
              midnight: "inset 0 0 0 4px rgba(30,41,59,0.9)",
            };
            shadows.push(THEME_BORDERS[profile.profileTheme] || THEME_BORDERS.aurora);
          } else if (isLocal) {
            shadows.push("inset 0 0 0 3px rgba(34,197,94,0.7)");
          }

          // 2. Outer Glow (Theme vs Premium)
          if (profile.profileTheme && profile.profileTheme !== 'default') {
            const THEME_GLOWS: Record<string, string> = {
              aurora: "0 0 40px rgba(168,85,247,0.6)",
              sunset: "0 0 40px rgba(244,63,94,0.6)",
              neon: "0 0 40px rgba(6,182,212,0.6)",
              midnight: "0 0 40px rgba(15,23,42,0.8)",
            };
            shadows.push(THEME_GLOWS[profile.profileTheme] || THEME_GLOWS.aurora);
          } else if (profile.isPremium) {
            shadows.push("0 0 30px rgba(251,191,36,0.4)");
          }

          // 3. Holographic Match Aura Glow for 90%+ compatibility
          if (overallMatch >= 90) {
            shadows.push("0 0 35px 5px rgba(244,63,94,0.45), inset 0 0 0 4px rgba(244,63,94,0.75)");
          }

          if (shadows.length > 0) {
            return <div className="absolute inset-0 pointer-events-none rounded-3xl z-10 transition-all duration-300" style={{
              boxShadow: shadows.join(", ")
            }} />;
          }
          return null;
        })()}

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
        {(() => {
          let gradClass = "from-black/95 via-black/50 to-transparent";
          if (profile.profileTheme === "aurora") gradClass = "from-purple-900/95 via-purple-700/60 to-transparent";
          if (profile.profileTheme === "sunset") gradClass = "from-rose-900/95 via-rose-700/60 to-transparent";
          if (profile.profileTheme === "neon") gradClass = "from-cyan-900/95 via-cyan-700/60 to-transparent";
          if (profile.profileTheme === "midnight") gradClass = "from-slate-900/95 via-slate-800/60 to-transparent";
          
          return <div className={`absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t ${gradClass} pointer-events-none transition-colors duration-500`} />;
        })()}

        {/* Profile Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pt-12 flex flex-col gap-2 pointer-events-none">
          <div className="flex justify-between items-end gap-2">
             <div className="flex flex-col flex-1 min-w-0">
                <h2 className="text-2xl font-black text-white drop-shadow-lg flex items-center gap-2 truncate">
                   <span className="truncate">{profile.name}</span>
                   <span className="text-xl font-medium text-white/80 shrink-0">{profile.age && `, ${profile.age}`}</span>
                   {profile.verified && <span className="shrink-0"><VerifyBadge level={profile.verifyLevel} /></span>}
                </h2>
                
                {/* ── 배지 ── */}
                <div className="flex items-center gap-2 mt-2 truncate">
                   {isLocal && <div className="flex items-center gap-1 bg-emerald-500 px-2.5 py-1 rounded shadow-sm">
                         <Home size={11} className="text-white" />
                         <span className="text-white text-[10px] font-extrabold uppercase tracking-wide truncate">{i18n.t("auto.z_\uD604\uC9C0\uC778_1226", "\uD604\uC9C0\uC778")}</span>
                      </div>}
                   {profile.isPremium && <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 rounded shadow-md border border-amber-300 pointer-events-none">
                         <Crown size={11} className="text-white fill-white" />
                         <span className="text-white text-[10px] font-extrabold uppercase tracking-widest drop-shadow-md">Premium</span>
                      </div>}
                   {profile.ticketVerified && <div className="flex items-center gap-1 bg-gradient-to-r from-emerald-400 to-teal-500 px-2.5 py-1 rounded shadow-[0_0_10px_rgba(52,211,153,0.5)] border border-emerald-300 pointer-events-none">
                         <span className="text-white text-[10px] font-extrabold uppercase tracking-widest drop-shadow-md flex items-center gap-1">✈️ Real Traveler</span>
                      </div>}
                   {(trustScore ?? 0) > 0 && <div className={`flex items-center gap-1 border px-2 py-1 rounded shadow-sm backdrop-blur ${profile.isPremium ? 'bg-amber-500/20 border-amber-300' : 'bg-black/40 border-white/20'}`}>
                         <Shield size={10} className={profile.isPremium ? "text-amber-400" : "text-emerald-400"} />
                         <span className={`text-[10px] font-bold ${profile.isPremium ? 'text-amber-300 drop-shadow-sm' : 'text-white'}`}>{i18n.t("auto.z_\uC2E0\uB8B0_1227", "\uC2E0\uB8B0")}{trustScore}</span>
                      </div>}
                </div>

                {isTop && profile.isLiker && !isBlurTarget && <div className="mt-2 text-[11px] font-bold text-amber-300 flex items-center gap-1.5 drop-shadow pointer-events-none truncate">
                      <Star size={12} className="fill-amber-300" />{i18n.t("auto.z_\uB098\uB97C\uBA3C\uC800\uC88B\uC544\uC694\uD588\uC5B4\uC694_1228", "\uB098\uB97C\uBA3C\uC800\uC88B\uC544\uC694\uD588\uC5B4\uC694")}</div>}
             </div>

             {/* Action Buttons */}
             <div className="flex gap-2 pointer-events-auto">
               {/* 신고하기 버튼 — Guideline 1.2 */}
               <button onClick={e => {
                 e.stopPropagation();
                 Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
                 setShowReport(true);
               }} className="w-8 h-8 rounded-full bg-red-500/20 backdrop-blur-md flex items-center justify-center filter transition-transform active:scale-90 border border-red-400/40 shrink-0">
                 <ShieldAlert size={16} className="text-red-300" />
               </button>
               {/* Info Button */}
               <button onClick={e => {
                 e.stopPropagation();
                 if (isBlurTarget) {
                   if (onPremiumClick) onPremiumClick();
                   return;
                 }
                 Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
                 if (profile?.id) onProfileView?.(profile.id);
                 setShowDetail(true);
               }} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center filter transition-transform active:scale-90 border border-white/30 shrink-0">
                 <Info size={18} className="text-white" />
               </button>
             </div>
          </div>

          <div className="flex items-center gap-2 text-white/90 text-sm font-semibold drop-shadow-md">
            <MapPin size={16} />
            <span className="line-clamp-1">
              {profile.location}
              {profile.distance ? ` • ${profile.distance}` : ""}
            </span>
          </div>

          {isTop && !isBlurTarget && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
                setIsFlipped(true);
              }}
              className="pointer-events-auto w-full rounded-xl bg-black/45 border border-white/15 backdrop-blur-md px-3 py-2 text-left active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Zap size={12} className="text-amber-300 fill-amber-300" />
                    <span className="text-[9px] font-black tracking-[0.18em] text-amber-200">
                      {fateInsight.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-black text-white truncate">{fateInsight.title}</p>
                  <p className="mt-0.5 text-[10px] font-semibold text-white/65 truncate">{fateInsight.detail}</p>
                </div>
                <div className="shrink-0 h-10 w-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
                  <span className="text-[11px] font-black text-white">{fateInsight.metric}</span>
                </div>
              </div>
            </button>
          )}
          
          <div className="flex items-center gap-2 text-white/80 text-[13px] font-medium drop-shadow-md line-clamp-2 leading-snug max-w-[85%]">
             <span className="opacity-70"><User size={14} className="inline mr-1 -mt-0.5" /></span>
             {bioT || profile.bio}
          </div>

          {/* Mission & Tags */}
          <div className="flex flex-wrap gap-1.5 mt-2 truncate pointer-events-auto">
            {profile.travelMission && (
              <motion.span 
                animate={profile.travelMission === myDailyMission ? {
                  boxShadow: [
                    "0 0 0px rgba(244,63,94,0)",
                    "0 0 12px rgba(244,63,94,0.6)",
                    "0 0 0px rgba(244,63,94,0)"
                  ],
                  scale: [1, 1.03, 1]
                } : {}}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className={`px-2 py-1 rounded-md backdrop-blur border text-[10px] font-extrabold uppercase tracking-widest shadow-sm flex items-center gap-1.5 ${
                  profile.travelMission === myDailyMission 
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 border-rose-400 text-white shadow-rose-500/30 shadow-md ring-1 ring-white/50 pointer-events-auto' 
                    : 'bg-white/20 border-white/30 text-white'
                }`}
              >
                🎯 {profile.travelMission} {profile.travelMission === myDailyMission && (
                  <span className="text-[9px] bg-white text-rose-500 font-extrabold px-1 rounded animate-pulse shrink-0">
                    {i18n.t("auto.g_0235", "매치!")} 🔥
                  </span>
                )}
              </motion.span>
            )}
            {profile.tags && profile.tags.slice(0, 3).map((tag: string) => (
              <span key={tag} className="px-1.5 py-0.5 rounded-md bg-white/10 backdrop-blur border border-white/20 text-white text-[10px] font-extrabold uppercase tracking-widest shadow-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* DNA Match detail overlay sheet inside the card */}
        <AnimatePresence>
          {showCompat && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute inset-x-3 bottom-20 top-12 bg-black/90 backdrop-blur-lg rounded-2xl p-4 z-40 border border-white/10 flex flex-col justify-between overflow-y-auto pointer-events-auto cursor-default"
              onClick={(e) => e.stopPropagation()} // Prevent card swipe actions on taps
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🧬</span>
                    <div>
                      <h4 className="text-sm font-black text-white leading-tight">
                        {profile.name}{t("auto.ko_with_compatibility", { defaultValue: "님과의 여행 DNA 궁합" })}
                      </h4>
                      <p className="text-[10px] text-white/50">{t("auto.ko_dna_desc", { defaultValue: "5차원 분석 매칭 지수" })}</p>
                    </div>
                  </div>
                  
                  {/* Close button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
                      setShowCompat(false);
                    }}
                    className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70 active:bg-white/20 active:scale-95 transition-transform"
                  >
                    ✕
                  </button>
                </div>

                <div className="py-2">
                  <TravelDNA profile={profile} myProfile={myProfile} compact={false} />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 text-center">
                <p className="text-[10px] text-white/40 leading-relaxed">
                  {t("auto.ko_dna_footer", { defaultValue: "취향이 잘 맞을수록 매치 및 동행 성사율이 3.8배 높아집니다! ✈️" })}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div> {/* 앞면 (Profile Front Card) 종료 */}

      {/* 뒷면 (Tarot Back Card) */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
          setIsFlipped(false); // Flip back to front on click!
        }}
        className="absolute inset-0 rounded-[28px] overflow-hidden shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] touch-none select-none border-[5px] border-amber-400/60 cursor-pointer pointer-events-auto flex flex-col justify-between p-6 text-white text-center"
        style={{ 
          transform: "rotateY(180deg)", 
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          background: "radial-gradient(circle at center, #2e1065 0%, #090514 100%)"
        }}
      >
        {/* Ornate Gold Inner Frame */}
        <div className="absolute inset-2 border border-amber-400/30 rounded-[22px] pointer-events-none z-0 flex flex-col justify-between p-4" />
        
        {/* Starry dust background */}
        <div 
          className="absolute inset-0 opacity-30 mix-blend-screen pointer-events-none z-0" 
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&q=80')",
            backgroundSize: "cover"
          }}
        />

        {/* Tarot Card Top Header */}
        <div className="flex flex-col items-center gap-1.5 mt-2 z-10">
          <span className="text-[10px] uppercase tracking-[0.25em] text-amber-300 font-extrabold drop-shadow">MIGO DESTINY TAROT</span>
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
        </div>
        
        {/* Cosmic emblem and details */}
        <div className="flex flex-col items-center gap-3 my-auto z-10">
          {/* Pulsing celestial moon/sun emblem */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 rounded-full border-2 border-dashed border-amber-400/40 flex items-center justify-center relative bg-amber-400/5 backdrop-blur-sm shadow-[0_0_20px_rgba(251,191,36,0.1)]"
          >
            <div className="w-14 h-14 rounded-full border border-amber-400/30 flex items-center justify-center bg-black/40">
              <span className="text-2xl filter drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]">🔮</span>
            </div>
            <span className="absolute -top-1.5 text-[8px] text-amber-300/60">★</span>
            <span className="absolute -bottom-1.5 text-[8px] text-amber-300/60">★</span>
            <span className="absolute -left-1.5 text-[8px] text-amber-300/60">★</span>
            <span className="absolute -right-1.5 text-[8px] text-amber-300/60">★</span>
          </motion.div>

          <div className="flex flex-col items-center mt-1">
            <h3 className="font-serif text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-wider leading-none">
              {tarot.title}
            </h3>
            <p className="text-[10px] text-amber-300 font-extrabold mt-1 tracking-widest uppercase drop-shadow">{tarot.subtitle}</p>
          </div>

          <div className="bg-amber-400/10 border border-amber-400/35 px-4 py-1 rounded-full mt-1.5 shadow-[0_0_15px_rgba(251,191,36,0.15)] flex items-center gap-1.5">
            <span className="text-[9px] text-amber-300 font-extrabold uppercase tracking-wider">⚡ Fate Spark</span>
            <span className="text-[11px] font-black text-amber-200 animate-pulse">{tarot.spark}</span>
          </div>

          <p className="text-[11px] text-slate-200 leading-relaxed font-bold px-3 max-w-[280px] mt-2 whitespace-pre-line drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
            {tarot.description}
          </p>
        </div>

        {/* Card bottom flip hint */}
        <div className="flex flex-col items-center gap-1 mb-2 z-10">
          <span className="text-[9px] text-amber-400/70 font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
            <span>↩</span> 카드를 탭하여 사진으로 복귀
          </span>
          <span className="text-[7px] text-white/20">MIGO Travelers Starry Match System</span>
        </div>
      </div> {/* 뒷면 (Tarot Back Card) 종료 */}
    </div> {/* 3D Perspective Card 종료 */}
  </motion.div>

    {showDetail && <ProfileDetailSheet profile={profile} onClose={() => setShowDetail(false)} onLike={onSwipeRight} onChat={onChat} showActions={true} />}
    {/* 신고/차단 시트 — Guideline 1.2 */}
    <ReportBlockActionSheet
      isOpen={showReport}
      onClose={() => setShowReport(false)}
      targetType="user"
      targetId={profile.id ?? ''}
      targetName={profile.name ?? ''}
      authorId={profile.id}
    />
  </>;
};

export default SwipeCard;
