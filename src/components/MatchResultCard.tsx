import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Sparkles } from "lucide-react";
interface Profile {
  id: string;
  name: string;
  nationality?: string;
  travel_style?: string;
  languages?: string[];
  tags?: string[];
}
interface MatchResultCardProps {
  isOpen: boolean;
  myProfile: Profile | null;
  matchedProfile: Profile;
  onClose: () => void;
  onChat: () => void;
}

/** 두 프로필 간 공통점 추출 */
function findCommon(me: Profile | null, other: Profile) {
  const common: string[] = [];
  if (!me) return common;
  if (me.nationality === other.nationality) common.push(`🌏 같은 국적 (${other.nationality})`);
  if (me.travel_style && me.travel_style === other.travel_style) common.push(`🎒 ${other.travel_style} 여행 스타일`);
  const sharedLangs = (me.languages || []).filter(l => (other.languages || []).includes(l));
  if (sharedLangs.length > 0) common.push(`💬 공통 언어: ${sharedLangs.join(", ")}`);
  const sharedTags = (me.tags || []).filter(t => (other.tags || []).includes(t));
  sharedTags.slice(0, 2).forEach(t => common.push(`✨ 공통 관심사: #${t}`));
  return common;
}
const ICE_BREAKERS = [i18n.t("auto.z_\uAC00\uC7A5\uC778\uC0C1\uAE4A\uC5C8\uB358\uC5EC\uD589\uC9C0_1377"), i18n.t("auto.z_\uC5EC\uD589\uC911\uAC00\uC7A5\uAE30\uC5B5\uC5D0\uB0A8\uB294_1378"), i18n.t("auto.z_\uBC84\uD0B7\uB9AC\uC2A4\uD2B8\uC5EC\uD589\uC9C01\uC21C_1379"), i18n.t("auto.z_\uD63C\uC790\uC5EC\uD589vs\uD568\uAED8\uC5EC\uD589_1380"), i18n.t("auto.z_\uC9C0\uAE08\uAE4C\uC9C0\uAC00\uBCF8\uB098\uB77C\uAC00\uBA87_1381"), i18n.t("auto.z_\uC5EC\uD589\uC911\uAC00\uC7A5\uBB34\uC11C\uC6E0\uB358\uACBD_1382"), i18n.t("auto.z_\uC774\uBC88\uC5EC\uD589\uC5D0\uC11C\uAF2D\uD574\uBCF4\uACE0_1383")];
export default function MatchResultCard({
  isOpen,
  myProfile,
  matchedProfile,
  onClose,
  onChat
}: MatchResultCardProps) {
  const {
    t
  } = useTranslation();
  const common = findCommon(myProfile, matchedProfile);
  const ice = ICE_BREAKERS[Math.floor(Math.random() * ICE_BREAKERS.length)];
  return <AnimatePresence>
      {isOpen && <motion.div className="fixed inset-0 z-[95] flex items-center justify-center px-4" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
          <motion.div className="relative z-10 w-full max-w-sm bg-card rounded-3xl p-6 shadow-float overflow-hidden" initial={{
        scale: 0.8,
        opacity: 0
      }} animate={{
        scale: 1,
        opacity: 1
      }} exit={{
        scale: 0.8,
        opacity: 0
      }} transition={{
        type: "spring",
        damping: 20,
        stiffness: 260
      }}>
            {/* 배경 글로우 */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />

            {/* 닫기 */}
            <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-muted flex items-center justify-center">
              <X size={14} className="text-muted-foreground" />
            </button>

            {/* 매치 헤더 */}
            <div className="text-center mb-5">
              <motion.div initial={{
            scale: 0
          }} animate={{
            scale: 1
          }} transition={{
            delay: 0.1,
            type: "spring"
          }} className="text-5xl mb-2">
                🎉
              </motion.div>
              <h2 className="text-xl font-black text-foreground">It's a Match!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-bold text-primary">{matchedProfile.name}</span>{t("auto.z_\uB2D8\uACFC\uB9E4\uCE6D\uB418\uC5C8\uC5B4\uC694_1384")}</p>
            </div>

            {/* 공통점 */}
            {common.length > 0 && <div className="bg-primary/5 rounded-2xl p-3 mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles size={13} className="text-primary" />
                  <p className="text-xs font-extrabold text-primary">{t("auto.z_\uACF5\uD1B5\uC810\uBC1C\uACAC_1385")}</p>
                </div>
                <div className="space-y-1">
                  {common.map((c, i) => <motion.p key={i} className="text-xs text-foreground" initial={{
              opacity: 0,
              x: -8
            }} animate={{
              opacity: 1,
              x: 0
            }} transition={{
              delay: 0.2 + i * 0.08
            }}>
                      {c}
                    </motion.p>)}
                </div>
              </div>}

            {/* 아이스브레이커 */}
            <div className="bg-muted rounded-2xl p-3 mb-5">
              <p className="text-[10px] font-bold text-muted-foreground mb-1">{t("auto.z_\uB300\uD654\uC2DC\uC791\uCD94\uCC9C\uC9C8\uBB38_1386")}</p>
              <p className="text-xs text-foreground font-medium">"{ice}"</p>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-muted text-muted-foreground text-sm font-bold">{t("auto.z_\uB098\uC911\uC5D0_1387")}</button>
              <motion.button whileTap={{
            scale: 0.97
          }} onClick={onChat} className="flex-[2] py-3 rounded-2xl gradient-primary text-primary-foreground text-sm font-extrabold flex items-center justify-center gap-2">
                <MessageCircle size={16} />{t("auto.z_\uC9C0\uAE08\uB300\uD654\uD558\uAE30_1388")}</motion.button>
            </div>
          </motion.div>
        </motion.div>}
    </AnimatePresence>;
}