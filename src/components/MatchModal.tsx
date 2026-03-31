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
    "photo": [i18n.t("auto.z_tmpl_1505", {
      defaultValue: `Know any great photo spots in ${destination}? Let's go! 📸`
    }), i18n.t("auto.z_autoz\uC5B4\uB5A4\uCE74\uBA54\uB77C_1390")],
    "food": [i18n.t("auto.z_tmpl_1507", {
      defaultValue: `Can you recommend food spots in ${destination}? I love local food 🍜`
    }), i18n.t("auto.z_autoz\uC624\uB298\uC800\uB141\uD63C_1392")],
    "photo trip": [i18n.t("auto.z_tmpl_1509", {
      defaultValue: `Looking for great shots in ${destination}! Want to join? 📷`
    })],
    "food tour": [i18n.t("auto.z_autoz\uC624\uB298\uBB50\uB4DC\uC168_1394")],
    "activity": [i18n.t("auto.z_autoz\uD639\uC2DC\uC11C\uD551\uC2A4_1395"), i18n.t("auto.z_tmpl_1512", {
      defaultValue: `What activities are you planning in ${destination}?`
    })],
    "nature": [i18n.t("auto.z_tmpl_1513", {
      defaultValue: `Know any nice trails near ${destination}? Let's hike! 🌿`
    })],
    "luxury": [i18n.t("auto.z_autoz\uC5B4\uB514\uBA38\uBB3C\uACE0_1398")],
    "local": [i18n.t("auto.z_autoz\uD604\uC9C0\uC778\uCC98\uB7FC_1399")],
    "long term": [i18n.t("auto.z_autoz\uC7A5\uAE30\uC5EC\uD589\uC774_1400")]
  };
  const results: string[] = [];

  // 미션 있으면 최우선
  if (mission) {
    results.push(i18n.t("auto.z_tmpl_1517", {
      defaultValue: i18n.t("auto.z_tmpl_1401", {
        defaultValue: `I've been wanting to "${mission}" too! Let's go? 🎯`
      })
    }));
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
  const defaults = [i18n.t("auto.z_tmpl_1518", {
    defaultValue: i18n.t("auto.z_tmpl_1402", {
      defaultValue: `First time in ${destination}? I just arrived too! ✈️`
    })
  }), i18n.t("auto.z_autoz\uC5B4\uB5BB\uAC8C\uC5EC\uAE30_1403"), i18n.t("auto.z_autoz\uC624\uB298\uBB50\uD560\uACC4_1404"), i18n.t("auto.z_autoz\uD63C\uC790\uC5EC\uD589\uC911_1405")];
  while (results.length < 3) {
    const next = defaults[results.length % defaults.length];
    if (!results.includes(next)) results.push(next);else break;
  }
  return [...new Set(results)].slice(0, 3);
};

// ── 즉시 만남 장소 제안 ──
const suggestMeetingPlace = (destination: string): string => {
  const SPOTS: Record<string, string> = {
    [i18n.t("dest.tokyo", "도쿄")]: i18n.t("auto.z_autoz\uC2DC\uBD80\uC57C\uC2A4\uD0C0_1406"),
    [i18n.t("dest.kyoto", "교토")]: i18n.t("auto.z_autoz\uAE30\uC628\uCE74\uD398\uAC70_1407"),
    [i18n.t("dest.osaka", "오사카")]: i18n.t("auto.z_autoz\uB3C4\uD1B0\uBCF4\uB9AC\uAE00_1408"),
    [i18n.t("dest.bali", "발리")]: i18n.t("auto.z_Seminyak해변_1525"),
    [i18n.t("dest.paris", "파리")]: i18n.t("auto.z_autoz\uC5D0\uD3A0\uD0D1\uADFC\uCC98_1410"),
    [i18n.t("dest.danang", "다낭")]: i18n.t("auto.z_autoz\uBBF8\uCF00\uBE44\uCE58\uADFC_1411")
  };
  for (const [city, spot] of Object.entries(SPOTS)) {
    if (destination?.includes(city)) return spot;
  }
  return i18n.t("auto.z_autoz\uADFC\uCC98\uCE74\uD398\uC5D0_1412");
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
            <motion.div className={`relative z-10 w-full max-w-sm bg-card rounded-t-3xl sm:rounded-3xl shadow-float overflow-hidden`} initial={{
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

                {isSuperLike ? <h2 className="text-base font-extrabold text-blue-400 mt-2">{t("auto.z_autoz\uC288\uD37C\uB77C\uC774\uD06C_1413")}</h2> : <h2 className="text-base font-extrabold gradient-text mt-2">{t("auto.z_autoz\uC11C\uB85C\uB9E4\uCE6D\uB410_1414")}</h2>}
              </div>

              {/* Tinder/Meeff와 다른 핵심 차별점 영역 */}
              <div className="px-5 pb-5 space-y-4">

                {/* [차별점 0] 여행 DNA 궁합 분석 (완전히 새로운 차원!) */}
                <TravelDNA profile={profile} myProfile={myProfile} compact={false} />

                {/* [차별점 1] 미션 공유 - 같은 미션이 있는 경우 */}
                {profile.travelMission && <div className="rounded-2xl p-3.5 border" style={{
              background: 'rgba(99,102,241,0.08)',
              borderColor: 'rgba(99,102,241,0.25)'
            }}>
                    <p className="text-[9px] font-extrabold text-indigo-400 mb-1.5 uppercase tracking-wider">🎯 {profile.name}{t("auto.z_autoz\uC758\uC5EC\uD589\uBBF8\uC158_1415")}</p>
                    <p className="text-sm font-bold text-foreground">{profile.travelMission}</p>
                  </div>}

                {/* [차별점 2] AI 아이스브레이커 - 공통관심사 기반 첫마디 추천 */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Zap size={12} className="text-yellow-400 fill-yellow-400" />
                    <p className="text-[11px] font-extrabold text-foreground">{t("auto.z_autozAI\uCD94\uCC9C\uCCAB_1416")}</p>
                    <span className="text-[9px] text-muted-foreground">{t("auto.z_autoz\uACF5\uD1B5\uAD00\uC2EC\uC0AC_1417")}</span>
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
                  <p className="text-[9px] font-extrabold text-emerald-400 mb-1 uppercase tracking-wider">{t("auto.z_autoz\uC989\uC2DC\uB9CC\uB0A8\uCD94_1418")}</p>
                  <p className="text-sm text-foreground font-semibold">{meetingPlace}{t("auto.z_autoz\uC5D0\uC11C\uC9C0\uAE08\uBC14_1419")}</p>
                </div>

                {/* 버튼 */}
                <div className="flex gap-3 pt-1">
                  <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors">{t("auto.z_autoz\uB098\uC911\uC5D015_1420")}</button>
                  <motion.button onClick={onChat} whileTap={{
                scale: 0.97
              }} className={`flex-2 px-6 py-3 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-card ${isSuperLike ? "bg-gradient-to-r from-blue-500 to-indigo-600" : "gradient-primary text-primary-foreground"}`}>
                    <MessageCircle size={15} />
                    {selectedIcebreaker ? t("auto.z_autoz\uC774\uAC78\uB85C\uCC44\uD305_1421") : t("auto.z_autoz\uCC44\uD305\uD558\uAE301_1422")}
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