import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Calendar, Heart, MessageCircle, Zap, ChevronLeft, ChevronRight, User, Globe, Sparkles, Crown, Star, Languages, Loader2 } from "lucide-react";
import VerifyBadge from "./VerifyBadge";
import TravelDNA from "./TravelDNA";
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
  const [myProfileData, setMyProfileData] = useState<any>(null);
  const [selectedIcebreaker, setSelectedIcebreaker] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      const getMyProfile = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setMyProfileData(data);
        }
      };
      getMyProfile();
    }
  }, [user?.id]);

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
  // AI 성향 궁합 피드백 코칭 생성
  const getChemistryAdvice = (p: any, my: any) => {
    if (!my) return "Migo Plus로 가입하거나 로그인하시면 두 분만의 상세한 취향 분석 가이드를 열람하실 수 있습니다. ✨";
    const mbti = p.mbti || "";
    const myMbti = my.mbti || "";
    const isSpontaneous = mbti.includes("P") || p.travelMission === "즉흥 번개" || (p.interests && p.interests.includes("즉흥"));
    const mySpontaneous = myMbti.includes("P") || my.travel_mission === "즉흥 번개" || (my.interests && my.interests.includes("즉흥"));
    const isFoodie = p.travelMission?.includes("맛집") || p.interests?.some((i: string) => i.includes("맛집") || i.includes("미식"));
    const myFoodie = my.travel_mission?.includes("맛집") || my.interests?.some((i: string) => i.includes("맛집") || i.includes("미식"));
    
    if (isSpontaneous && mySpontaneous) {
      return "두 분은 무계획 즉흥 여행에서 최고의 행복을 느끼는 '완벽한 번개 소울메이트'입니다! 빡빡한 타임라인 대신 끌리는 골목길로 가벼운 발걸음을 옮길 때 시너지가 200% 납니다. 오늘 도쿄 골목 선술집이나 미식 투어를 즉흥적으로 같이 도전해보세요. 🌃";
    }
    if (isFoodie && myFoodie) {
      return "미식 탐험에 진심인 두 분! 로컬 숨겨진 이자카야 골목부터 예약 없이는 못 가는 핫플 디저트 카페까지 최고의 먹방 투어가 가능합니다. 서로 사진을 100장씩 찍어주며 음식을 정복하는 미식 번개를 적극 추천합니다! 🍲";
    }
    if (isSpontaneous && !mySpontaneous) {
      return "체계적인 계획파인 나(J)와 유연하고 즉흥적인 상대(P)의 보완적인 조합입니다! 한 명이 든든하게 중심 이동 경로를 잡고, 상대방이 예기치 못한 당일치기 모험의 즐거움을 더해준다면 가장 완벽하고 균형 잡힌 꿀조합이 완성됩니다. ⚖️";
    }
    if (mbti === myMbti && mbti) {
      return `서로 성향이 같은 '${mbti}'로 통합니다! 대화 스타일이나 체력 충전 주기 등이 물 흐르듯 비슷하여, 어색하게 애쓰지 않아도 노을 지는 강변이나 야경을 보며 편안하고 기분 좋은 침묵을 나눌 수 있는 최적의 여행 파트너입니다. 🌅`;
    }
    return "서로 다른 취향이 신선한 조화를 이루는 영양가 높은 인연입니다. 한 명의 액티브한 로컬 퀘스트 도전에 다른 한 명이 고즈넉한 카페 힐링 일정을 보태면서, 혼자라면 가보지 않았을 여행의 경계를 기분 좋게 확장하게 됩니다! ✈️";
  };

  // AI 아이스브레이커 덱 카드 리스트
  const getIcebreakerQuestions = (p: any, my: any) => {
    const mission = p.travelMission || "로컬 번개";
    return [
      {
        id: "photo",
        icon: "📸",
        title: "인생샷 미션",
        desc: "사진 찍어주기",
        question: `안녕하세요! 두 분 모두 여행 중에 서로 인생샷 건지는 걸 정말 좋아하시네요! 📸 서로 도쿄 골목에서 전신 인생샷 100장씩 찍어주며 경쟁해 볼까요?`
      },
      {
        id: "food",
        icon: "🍲",
        title: "비밀 로컬 미식",
        desc: "이자카야 맛집",
        question: `안녕하세요! 성향 궁합에서 미식 코드가 정말 높게 매칭되셨어요! 🍲 현지인만 아는 비밀 이자카야 맛집이나 숨겨진 로컬 꼬치구이 골목 오늘 저녁 같이 도장 깨기 하실래요?`
      },
      {
        id: "spontaneous",
        icon: "🎲",
        title: "즉흥 번개 퀘스트",
        desc: "성향 매칭 질문",
        question: `안녕하세요! MIGO 궁합에서 '${mission}' 케미가 아주 훌륭하게 나오셨어요! 🎲 오늘 오후 일정 없으시면 즉흥적으로 시부야 스크램블 교차로 근처 이색 카페에서 가볍게 커피 번개 어떠세요?`
      }
    ];
  };

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
            {/* ── Theme & Premium Border ── */}
            {(() => {
              let shadows: string[] = [];

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
              }

              if (profile.profileTheme && profile.profileTheme !== 'default') {
                const THEME_GLOWS: Record<string, string> = {
                  aurora: "0 0 40px rgba(168,85,247,0.4)",
                  sunset: "0 0 40px rgba(244,63,94,0.4)",
                  neon: "0 0 40px rgba(6,182,212,0.4)",
                  midnight: "0 0 40px rgba(15,23,42,0.6)",
                };
                shadows.push(THEME_GLOWS[profile.profileTheme] || THEME_GLOWS.aurora);
              } else if (profile.isPremium) {
                shadows.push("0 0 30px rgba(251,191,36,0.3)");
              }

              if (shadows.length > 0) {
                return <div className="absolute inset-0 pointer-events-none rounded-3xl z-20" style={{ boxShadow: shadows.join(", ") }} />;
              }
              return null;
            })()}
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
                      onError={e => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        e.currentTarget.parentElement?.classList.add('gradient-primary');
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 gradient-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-6xl font-extrabold">{profile.name?.[0] ?? "?"}</span>
                    </div>
                  )}
                </AnimatePresence>

                {/* ── Theme custom bottom gradient ── */}
                {(() => {
                  let gradClass = "from-card via-card/20 to-transparent";
                  if (profile.profileTheme === "aurora") gradClass = "from-purple-900/90 via-purple-900/30 to-transparent";
                  if (profile.profileTheme === "sunset") gradClass = "from-pink-900/90 via-pink-900/30 to-transparent";
                  if (profile.profileTheme === "neon") gradClass = "from-cyan-900/90 via-cyan-900/30 to-transparent";
                  if (profile.profileTheme === "midnight") gradClass = "from-black/95 via-black/40 to-transparent";
                  
                  return <div className={`absolute inset-0 bg-gradient-to-t ${gradClass} pointer-events-none`} />;
                })()}

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
                <div className="absolute bottom-4 left-5 right-5 z-10 min-w-0">
                  <div className="flex items-center gap-2 flex-nowrap overflow-hidden">
                    <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="truncate">{profile.name}</span>
                      <span className="text-xl font-medium text-foreground/80 shrink-0">{profile.age && `, ${profile.age}`}</span>
                      {profile.nationality && <span className="text-xl ml-1 drop-shadow-sm shrink-0">{profile.nationality.match(/[^\x00-\x7F가-힣a-zA-Z]+/g)?.[0]?.trim() || profile.nationality}</span>}
                      {profile.isPlus && <span className="shrink-0"><Crown size={18} className="text-amber-500 fill-amber-500 ml-0.5" /></span>}
                      {profile.verified && <span className="shrink-0"><VerifyBadge level={profile.verifyLevel} /></span>}
                      {(profile.id_verified || profile.ticketVerified) && (
                        <span className="shrink-0 inline-flex items-center gap-1 bg-gradient-to-r from-emerald-400 to-teal-500 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(52,211,153,0.3)] border border-emerald-300 pointer-events-none text-white text-[9px] font-extrabold uppercase tracking-widest">
                          ✈️ Real Traveler
                        </span>
                      )}
                    </h2>
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

                {/* 🧬 AI 5D 여행 DNA 궁합 Sandbox */}
                <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm space-y-4 mt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg animate-pulse">🔮</span>
                      <div>
                        <h4 className="text-sm font-black text-foreground leading-tight">AI 5D 여행 궁합 리포트</h4>
                        <p className="text-[10px] text-muted-foreground">성향 매칭 알고리즘 2.0</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-1 rounded-full shrink-0">
                      {profile.matchScore || 85}% 매치
                    </span>
                  </div>
                  
                  {/* Travel DNA Radar arcs */}
                  <div className="py-1 border-y border-border/40 my-1 pointer-events-auto">
                    <TravelDNA profile={profile} myProfile={myProfileData} compact={false} />
                  </div>

                  {/* AI Chemistry Advice */}
                  <div className="bg-muted/65 rounded-xl p-3 border border-border/50 text-xs leading-relaxed space-y-2">
                    <p className="font-extrabold text-foreground flex items-center gap-1">
                      <span>⚡</span> MIGO AI 성향 코칭 가이드
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      {getChemistryAdvice(profile, myProfileData)}
                    </p>
                  </div>
                </div>

                {/* 🃏 AI 아이스브레이커 카드 덱 */}
                <div className="space-y-3 mt-4">
                  <div>
                    <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 truncate">
                      <span>🃏</span> AI 아이스브레이커 카드 덱
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{i18n.t("auto.ko_deck_desc", { defaultValue: "성향 궁합 맞춤형 대화 추천 덱입니다. 탭하여 카드를 골라보세요!" })}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pointer-events-auto">
                    {getIcebreakerQuestions(profile, myProfileData).map((c) => (
                      <motion.button
                        key={c.id}
                        whileTap={{ scale: 0.95, y: 2 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
                          setSelectedIcebreaker(selectedIcebreaker === c.id ? null : c.id);
                        }}
                        className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-between gap-1.5 transition-all ${
                          selectedIcebreaker === c.id
                            ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-400 shadow-md shadow-amber-500/10 ring-1 ring-amber-400'
                            : 'bg-muted/40 border-border hover:bg-muted'
                        }`}
                      >
                        <span className="text-2xl filter drop-shadow">{c.icon}</span>
                        <div className="min-w-0">
                          <p className={`text-[10px] font-black truncate ${selectedIcebreaker === c.id ? 'text-amber-500' : 'text-foreground'}`}>
                            {c.title}
                          </p>
                          <p className="text-[8px] text-muted-foreground truncate leading-none mt-0.5">{c.desc}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Selected card detail bubble */}
                  <AnimatePresence>
                    {selectedIcebreaker && (() => {
                      const activeCard = getIcebreakerQuestions(profile, myProfileData).find(c => c.id === selectedIcebreaker);
                      if (!activeCard) return null;
                      return (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-transparent border border-amber-300/30 rounded-2xl p-4 space-y-3 mt-1.5 pointer-events-auto">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                                🔮 AI 추천 대화 첫마디
                              </span>
                              {/* Close */}
                              <button 
                                onClick={() => setSelectedIcebreaker(null)}
                                className="text-muted-foreground hover:text-foreground text-xs font-bold"
                              >
                                ✕
                              </button>
                            </div>
                            
                            <p className="text-xs text-foreground leading-relaxed font-semibold italic bg-card/45 p-3 rounded-xl border border-border/50">
                              "{activeCard.question}"
                            </p>

                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={() => {
                                // Copy to clipboard & trigger chat action
                                navigator.clipboard.writeText(activeCard.question).catch(() => {});
                                if (onChat) {
                                  onChat();
                                  onClose();
                                }
                              }}
                              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-[11px] shadow-md flex items-center justify-center gap-1.5"
                            >
                              <span>💬</span> 이 질문을 복사하고 대화 시작하기
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                </div>
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