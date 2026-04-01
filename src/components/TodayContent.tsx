import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

/** 날짜 기반으로 인덱스를 결정 — 매일 다른 콘텐츠 */
function getDayIndex(len: number) {
  return (new Date().getDate() + new Date().getMonth() * 31) % len;
}
// TIPS moved inside component to support reactive i18n.

// 이번 달 활성 여행자 수 (날짜 기반 의사 랜덤)
const todayTravelers = 800 + (new Date().getDate() * 37 + new Date().getMonth() * 7) % 400;
export default function TodayContent() {
  const {
    t
  } = useTranslation();
  
  const TIPS = [{
    icon: "🎒",
    text: t("auto.z_\uC9D0\uC740\uB3CC\uB3CC\uB9D0\uC544\uB123\uC73C\uBA743_1200"),
    city: t("auto.z_\uB3C4\uCFC4_1201"),
    flag: "🇯🇵",
    color: "from-pink-500 to-rose-500"
  }, {
    icon: "💳",
    text: t("auto.z_\uD2B8\uB798\uBE14\uCCB4\uD06C\uCE74\uB4DC\uB85CAT_1202"),
    city: t("auto.z_\uBC29\uCF55_1203"),
    flag: "🇹🇭",
    color: "from-amber-500 to-orange-500"
  }, {
    icon: "☁️",
    text: t("auto.z_\uD56D\uACF5\uAD8C\uC740\uD654\uC218\uC694\uC77C\uC0C8\uBCBD_1204"),
    city: t("auto.z_\uBC14\uB974\uC140\uB85C\uB098_1205"),
    flag: "🇪🇸",
    color: "from-blue-500 to-indigo-600"
  }, {
    icon: "🌐",
    text: t("auto.z_\uAD6C\uAE00\uBC88\uC5ED\uCE74\uBA54\uB77C\uB85C\uBA54\uB274_1206"),
    city: t("auto.z_\uB274\uC695_1207"),
    flag: "🇺🇸",
    color: "from-slate-500 to-gray-700"
  }, {
    icon: "🔌",
    text: t("auto.z_\uC720\uB7FD\uC5EC\uD589\uC5D4\uBA40\uD2F0\uC5B4\uB311\uD130_1208"),
    city: t("auto.z_\uBC1C\uB9AC_1209"),
    flag: "🇮🇩",
    color: "from-emerald-500 to-teal-500"
  }, {
    icon: "📱",
    text: t("auto.z_Migo\uC5D0\uC11C\uD604\uC9C0\uC5EC\uD589_1210"),
    city: t("auto.z_\uD30C\uB9AC_1211"),
    flag: "🇫🇷",
    color: "from-violet-500 to-purple-600"
  }, {
    icon: "🗺️",
    text: t("auto.z_\uC624\uD504\uB77C\uC778\uC9C0\uB3C4\uBBF8\uB9AC\uB2E4\uC6B4_1212"),
    city: t("auto.z_\uC2F1\uAC00\uD3EC\uB974_1213"),
    flag: "🇸🇬",
    color: "from-sky-500 to-blue-600"
  }, {
    icon: "🏥",
    text: t("auto.z_\uC5EC\uD589\uC790\uBCF4\uD5D8\uCD9C\uBC1C\uC804\uB0A0\uAE4C_1214"),
    city: t("auto.z_\uC774\uC2A4\uD0C4\uBD88_1215"),
    flag: "🇹🇷",
    color: "from-red-500 to-rose-600"
  }];

  const tip = TIPS[getDayIndex(TIPS.length)];
  const [expanded, setExpanded] = useState(false);
  return <div className="px-4 pb-2">
      {/* ── 슬림 배너 (항상 표시, 높이 ~52px) ── */}
      <motion.button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-card border border-border/50 shadow-sm" onClick={() => setExpanded(v => !v)} whileTap={{
      scale: 0.98
    }} layout>
        {/* 도시 뱃지 */}
        <div className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-xl bg-gradient-to-r ${tip.color}`}>
          <span className="text-sm">{tip.flag}</span>
          <span className="text-[10px] font-bold text-white">{tip.city}</span>
        </div>

        {/* 팁 텍스트 */}
        <div className="flex-1 text-left min-w-0">
          <p className="text-[11px] text-foreground leading-tight truncate">
            <span className="mr-1">{tip.icon}</span>{tip.text}
          </p>
        </div>

        {/* 여행자 수 + 토글 */}
        <div className="shrink-0 flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-primary">🔥 {todayTravelers}{i18n.language === 'ko' ? '명' : ' persons'}</span>
          {expanded ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
        </div>
      </motion.button>

      {/* ── 확장 패널 (선택적 열기) ── */}
      <AnimatePresence>
        {expanded && <motion.div initial={{
        height: 0,
        opacity: 0
      }} animate={{
        height: "auto",
        opacity: 1
      }} exit={{
        height: 0,
        opacity: 0
      }} transition={{
        duration: 0.2
      }} className="overflow-hidden">
            <div className="pt-2 grid grid-cols-3 gap-2">
              {[{
            label: t("auto.z_\uC624\uB298\uC5EC\uD589\uC790_1217"),
            value: `${todayTravelers}${i18n.language === 'ko' ? '명' : ' persons'}`,
            icon: "👤"
          }, {
            label: t("auto.z_\uD65C\uC131\uADF8\uB8F9_1219"),
            value: `${40 + new Date().getDate() * 13 % 60}${i18n.language === 'ko' ? '그룹' : ' groups'}`,
            icon: "👥"
          }, {
            label: t("auto.z_\uC624\uB298\uB9E4\uCE58_1221"),
            value: `${100 + new Date().getDate() * 29 % 150}${i18n.language === 'ko' ? '매치' : ' matches'}`,
            icon: "💫"
          }].map(s => <div key={s.label} className="bg-muted rounded-xl p-2 text-center">
                  <p className="text-base leading-tight">{s.icon}</p>
                  <p className="text-xs font-black text-foreground">{s.value}</p>
                  <p className="text-[9px] text-muted-foreground">{s.label}</p>
                </div>)}
            </div>
          </motion.div>}
      </AnimatePresence>
    </div>;
}