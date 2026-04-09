import i18n from "@/i18n";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Star, Zap, MapPin, Copy, Check } from "lucide-react";
import ProfileDetailSheet from "./ProfileDetailSheet";
import TravelDNA from "./TravelDNA";
interface MatchModalProps {
  isOpen: boolean;
  profile: any | null;
  onClose: () => void;
  onChat: () => void;
  isSuperLike?: boolean;
  superLikeMessage?: string;
  myProfile?: any; // 내 프로필 (아이스브레이커 생성용)
}

// ── AI 아이스브레이커 생성 (공통 관심사 기반, API 불필요) ──
const generateIcebreakers = (profile: any, myProfile?: any): string[] => {
  const theirTags = [...(profile.travelStyle || []), ...(profile.tags || [])];
  const myTags = myProfile ? [...(myProfile.travel_style || []), ...(myProfile.interests || [])] : [];
  const destination = profile.destination || profile.location || "";
  const mission = profile.travelMission;
  const TEMPLATE_MAP: Record<string, string[]> = {
    "photo": [`Know any great photo spots in ${destination}? Let's go! 📸`, i18n.t("auto.g_0060", "어떤카메라")],
    "food": [`Can you recommend food spots in ${destination}? I love local food 🍜`, i18n.t("auto.g_0061", "오늘저녁혼")],
    "photo trip": [`Looking for great shots in ${destination}! Want to join? 📷`],
    "food tour": [i18n.t("auto.g_0062", "오늘뭐드셨")],
    "activity": [i18n.t("auto.g_0063", "혹시서핑스"), `What activities are you planning in ${destination}?`],
    "nature": [`Know any nice trails near ${destination}? Let's hike! 🌿`],
    "luxury": [i18n.t("auto.g_0064", "어디머물고")],
    "local": [i18n.t("auto.g_0065", "현지인처럼")],
    "long term": [i18n.t("auto.g_0066", "장기여행이")]
  };
  const results: string[] = [];

  // 미션 있으면 최우선
  if (mission) {
    results.push(`I've been wanting to "${mission}" too! Let's go? 🎯`);
  }

  // 공통 관심사 기반
  const shared = theirTags.filter(t => myTags.some(mt => mt.includes(t) || t.includes(mt)));
  for (const tag of [...shared, ...theirTags].slice(0, 3)) {
    for (const [key, msgs] of Object.entries(TEMPLATE_MAP)) {
      if (tag.includes(key) || key.includes(tag)) {
        results.push(...msgs);
        break;
      }
    }
    if (results.length >= 3) break;
  }

  // 기본 폴백
  const defaults = [`First time in ${destination}? I just arrived too! ✈️`, i18n.t("auto.g_0067", "어떻게여기"), i18n.t("auto.g_0068", "오늘뭐할계"), i18n.t("auto.g_0069", "혼자여행중")];
  while (results.length < 3) {
    const next = defaults[results.length % defaults.length];
    if (!results.includes(next)) results.push(next);else break;
  }
  return [...new Set(results)].slice(0, 3);
};

// ── 즉시 만남 장소 제안 ──
const suggestMeetingPlace = (destination: string): string => {
  const SPOTS: Record<string, string> = {
    [i18n.t("dest.tokyo", "도쿄")]: i18n.t("auto.g_0070", "시부야스타"),
    [i18n.t("dest.kyoto", "교토")]: i18n.t("auto.g_0071", "기온카페거"),
    [i18n.t("dest.osaka", "오사카")]: i18n.t("auto.g_0072", "도톰보리글"),
    [i18n.t("dest.bali", "발리")]: i18n.t("auto.z_Seminyak해변_1525", "Seminyak해변"),
    [i18n.t("dest.paris", "파리")]: i18n.t("auto.g_0073", "에펠탑근처"),
    [i18n.t("dest.danang", "다낭")]: i18n.t("auto.g_0074", "미케비치근")
  };
  for (const [city, spot] of Object.entries(SPOTS)) {
    if (destination?.includes(city)) return spot;
  }
  return i18n.t("auto.g_0075", "근처카페에");
};
const MatchModal = ({
  isOpen,
  profile,
  onClose,
  onChat,
  isSuperLike = false,
  superLikeMessage = "",
  myProfile
}: MatchModalProps) => {
  const {
    t
  } = useTranslation();
  const [showDetail, setShowDetail] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [selectedIcebreaker, setSelectedIcebreaker] = useState<string | null>(null);
  if (!profile) return null;
  const icebreakers = generateIcebreakers(profile, myProfile);
  const meetingPlace = suggestMeetingPlace(profile.destination || profile.location || "");
  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedIdx(idx);
    setSelectedIcebreaker(text);
    setTimeout(() => setCopiedIdx(null), 2000);
  };
  return <>
      <AnimatePresence>
        {isOpen && <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-6" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }}>
            <div className="absolute inset-0 bg-foreground/70 backdrop-blur-md" onClick={onClose} />
            <motion.div className={`relative z-10 w-full max-w-sm bg-card rounded-3xl mb-4 sm:mb-8 shadow-float overflow-hidden`} initial={{
          y: 100,
          opacity: 0
        }} animate={{
          y: 0,
          opacity: 1
        }} exit={{
          y: 100,
          opacity: 0
        }} transition={{
          type: "spring",
          damping: 25,
          stiffness: 300
        }}>
              {/* 매치 헤더 - 그라디언트 배경 */}
              <div className={`p-6 pb-4 text-center relative ${isSuperLike ? "bg-gradient-to-b from-blue-600/20 to-card" : "bg-gradient-to-b from-primary/20 to-card"}`}>
                <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground">
                  <X size={20} />
                </button>

                {/* 프로필 사진 */}
                <button onClick={() => setShowDetail(true)} className="relative w-20 h-20 mx-auto mb-3 block group">
                  {profile.photo ? <img src={profile.photo} alt={profile.name} className={`w-20 h-20 rounded-full object-cover ring-4 ${isSuperLike ? "ring-blue-500/50" : "ring-primary/50"}`} /> : <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl ring-4 ${isSuperLike ? "ring-blue-500/50 bg-blue-500/20" : "ring-primary/50 bg-primary/20"}`}>
                      {profile.name?.[0] || "?"}
                    </div>}
                  <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center ${isSuperLike ? "bg-gradient-to-br from-blue-500 to-indigo-600" : "gradient-primary"}`}>
                    {isSuperLike ? <Star size={13} className="text-white" fill="white" /> : <span className="text-sm">🎉</span>}
                  </div>
                </button>

                <p className="text-lg font-extrabold text-foreground">{profile.name}{profile.age ? `, ${profile.age}` : ""}</p>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <MapPin size={11} className="text-accent" />
                  <p className="text-xs text-muted-foreground">{profile.destination || profile.location}</p>
                </div>

                {isSuperLike ? <h2 className="text-base font-extrabold text-blue-400 mt-2 truncate">{i18n.t("auto.g_0076", "슈퍼라이크")}</h2> : <h2 className="text-base font-extrabold gradient-text mt-2 truncate">{i18n.t("auto.g_0077", "서로매칭됐")}</h2>}
              </div>

              {/* Tinder/Meeff와 다른 핵심 차별점 영역 */}
              <div className="px-5 pb-5 space-y-4 truncate">

                {/* [차별점 0] 여행 DNA 궁합 분석 (완전히 새로운 차원!) */}
                <TravelDNA profile={profile} myProfile={myProfile} compact={false} />

                {/* [차별점 1] 미션 공유 - 같은 미션이 있는 경우 */}
                {profile.travelMission && <div className="rounded-2xl p-3.5 border" style={{
              background: 'rgba(99,102,241,0.08)',
              borderColor: 'rgba(99,102,241,0.25)'
            }}>
                    <p className="text-[9px] font-extrabold text-indigo-400 mb-1.5 uppercase tracking-wider truncate">🎯 {profile.name}{i18n.t("auto.g_0078", "의여행미션")}</p>
                    <p className="text-sm font-bold text-foreground">{profile.travelMission}</p>
                  </div>}

                {/* [차별점 2] AI 아이스브레이커 - 공통관심사 기반 첫마디 추천 */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Zap size={12} className="text-yellow-400 fill-yellow-400" />
                    <p className="text-[11px] font-extrabold text-foreground truncate">{i18n.t("auto.g_0079", "AI추천첫")}</p>
                    <span className="text-[9px] text-muted-foreground truncate">{i18n.t("auto.g_0080", "공통관심사")}</span>
                  </div>
                  <div className="space-y-2">
                    {icebreakers.map((msg, i) => <motion.button key={i} onClick={() => handleCopy(msg, i)} whileTap={{
                  scale: 0.98
                }} className={`w-full text-left rounded-2xl p-3 text-sm transition-all border ${selectedIcebreaker === msg ? 'border-primary/50 bg-primary/8' : 'border-border bg-muted/50 hover:border-primary/30 hover:bg-muted'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <span className="leading-snug text-foreground/90">{msg}</span>
                          <span className="shrink-0 mt-0.5">
                            {copiedIdx === i ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} className="text-muted-foreground" />}
                          </span>
                        </div>
                      </motion.button>)}
                  </div>
                </div>

                {/* [차별점 3] 즉시 만남 제안 */}
                <div className="rounded-2xl p-3 border border-emerald-500/20 bg-emerald-500/5">
                  <p className="text-[9px] font-extrabold text-emerald-400 mb-1 uppercase tracking-wider truncate">{i18n.t("auto.g_0081", "즉시만남추")}</p>
                  <p className="text-sm text-foreground font-semibold truncate">{meetingPlace}{i18n.t("auto.g_0082", "에서지금바")}</p>
                </div>

                {/* 버튼 */}
                <div className="flex gap-3 pt-1">
                  <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors">{i18n.t("auto.g_0083", "나중에")}</button>
                  <motion.button onClick={onChat} whileTap={{
                scale: 0.97
              }} className={`flex-2 px-6 py-3 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-card ${isSuperLike ? "bg-gradient-to-r from-blue-500 to-indigo-600" : "gradient-primary text-primary-foreground"}`}>
                    <MessageCircle size={15} />
                    {selectedIcebreaker ? i18n.t("auto.g_0084", "이걸로채팅") : i18n.t("auto.g_0085", "채팅하기")}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      {showDetail && <ProfileDetailSheet profile={profile} onClose={() => setShowDetail(false)} onChat={onChat} showActions={true} />}
    </>;
};
export default MatchModal;