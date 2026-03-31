import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
/**
 * TravelDNA - 여행 DNA 궁합 분석 컴포넌트
 * Tinder/Meeff와의 핵심 차별점:
 * - 외모가 아닌 "여행 성향" 5차원 매칭
 * - 즉흥vs계획, 아침vs밤, 활동vs여유, 절약vs경험, 혼자vs함께
 * - 시각적 DNA 바로 % 매칭 즉시 표시
 */
import { motion } from "framer-motion";
import { useSubscription } from "@/context/SubscriptionContext";
import { Lock } from "lucide-react";
interface DNADimension {
  label: string;
  emoji: string;
  myScore: number; // 0~100
  theirScore: number; // 0~100
  color: string;
}
interface TravelDNAProps {
  profile: any;
  myProfile?: any;
  compact?: boolean; // SwipeCard용 압축 모드
}

// 프로필 데이터로 DNA 추론 (mbti, interests, travel_style 기반)
const inferDNA = (profile: any): Record<string, number> => {
  const interests = [...(profile?.interests || []), ...(profile?.tags || [])];
  const travelStyle = profile?.travelStyle || profile?.travel_style || [];
  const mbti = profile?.mbti || "";

  // 즉흥vs계획 (E=즉흥, J=계획)
  const spontaneous = mbti.includes("P") ? 75 : mbti.includes("J") ? 30 : travelStyle.some((s: string) => s.includes(i18n.t("auto.z_autoz\uC989\uD765133_1159"))) ? 80 : travelStyle.some((s: string) => s.includes(i18n.t("auto.z_autoz\uACC4\uD68D133_1160"))) ? 25 : 55;

  // 활동vs여유 (활동적 관심사 기반)
  const active = interests.some(i => [i18n.t("auto.z_autoz\uD558\uC774\uD0B913_1161"), i18n.t("auto.z_autoz\uC11C\uD551133_1162"), i18n.t("auto.z_autoz\uC561\uD2F0\uBE44\uD2F01_1163"), i18n.t("auto.z_autoz\uC2A4\uD3EC\uCE2013_1164"), i18n.t("auto.z_autoz\uD2B8\uB808\uD0B913_1165")].some(k => i.includes(k))) ? 80 : interests.some(i => [i18n.t("auto.z_autoz\uCE74\uD398134_1166"), i18n.t("auto.z_autoz\uC5EC\uC720134_1167"), i18n.t("auto.z_autoz\uD790\uB9C1134_1168"), "spa", i18n.t("auto.z_autoz\uD734\uC591134_1169")].some(k => i.includes(k))) ? 25 : 55;

  // 아침vs밤 (MBTI E=조금 더 아침, I=밤)
  const earlyBird = mbti.includes("E") ? 60 : mbti.includes("I") ? 40 : 52;

  // 절약vs경험 (budget_range 기반)
  const budget = profile?.budgetRange === "low" ? 25 : profile?.budgetRange === "high" ? 85 : interests.some(i => [i18n.t("auto.z_autoz\uB7ED\uC154\uB9AC13_1170"), i18n.t("auto.z_autoz\uD30C\uC778\uB2E4\uC774\uB2DD_1171"), i18n.t("auto.z_autoz\uBE44\uC988\uB2C8\uC2A41_1172")].some(k => i.includes(k))) ? 80 : interests.some(i => [i18n.t("auto.z_autoz\uAC00\uC131\uBE4413_1173"), i18n.t("auto.z_autoz\uC800\uC608\uC0B013_1174"), i18n.t("auto.z_autoz\uAC8C\uC2A4\uD2B8\uD558\uC6B0_1175")].some(k => i.includes(k))) ? 20 : 55;

  // 혼자시간vs함께 (I=혼자, E=함께)
  const social = mbti.includes("E") ? 75 : mbti.includes("I") ? 35 : 55;
  return {
    spontaneous,
    active,
    earlyBird,
    budget,
    social
  };
};
const getMatchPct = (a: number, b: number): number => {
  const diff = Math.abs(a - b);
  return Math.round(100 - diff * 0.9);
};
const DIMENSIONS = [{
  key: "spontaneous",
  label: i18n.t("auto.z_autoz\uC989\uD765\uC80113_1176"),
  emoji: "⚡",
  labelA: i18n.t("auto.z_autoz\uC989\uD765135_1177"),
  labelB: i18n.t("auto.z_autoz\uACC4\uD68D135_1178"),
  color: "#f59e0b"
}, {
  key: "active",
  label: i18n.t("auto.z_autoz\uD65C\uB3D9\uC80113_1179"),
  emoji: "🏃",
  labelA: i18n.t("auto.z_autoz\uC561\uD2F0\uBE0C13_1180"),
  labelB: i18n.t("auto.z_autoz\uC5EC\uC720135_1181"),
  color: "#10b981"
}, {
  key: "earlyBird",
  label: i18n.t("auto.z_autoz\uC544\uCE68\uD61513_1182"),
  emoji: "🌅",
  labelA: i18n.t("auto.z_autoz\uC544\uCE68\uD61513_1183"),
  labelB: i18n.t("auto.z_autoz\uC57C\uD589\uC13113_1184"),
  color: "#8b5cf6"
}, {
  key: "budget",
  label: i18n.t("auto.z_autoz\uACBD\uD5D8\uC911\uC2DC1_1185"),
  emoji: "💰",
  labelA: i18n.t("auto.z_autoz\uACBD\uD5D8\uC911\uC2EC1_1186"),
  labelB: i18n.t("auto.z_autoz\uC808\uC57D\uD61513_1187"),
  color: "#3b82f6"
}, {
  key: "social",
  label: i18n.t("auto.z_autoz\uD65C\uBC1C\uD56813_1188"),
  emoji: "👥",
  labelA: i18n.t("auto.z_autoz\uD568\uAED8136_1189"),
  labelB: i18n.t("auto.z_autoz\uD63C\uC790136_1190"),
  color: "#ec4899"
}];
const TravelDNA = ({
  profile,
  myProfile,
  compact = false
}: TravelDNAProps) => {
  const {
    t
  } = useTranslation();
  const theirDNA = inferDNA(profile);
  const myDNA = myProfile ? inferDNA(myProfile) : null;
  const dimensions: DNADimension[] = DIMENSIONS.map(d => ({
    label: d.label,
    emoji: d.emoji,
    myScore: myDNA ? myDNA[d.key] : 50,
    theirScore: theirDNA[d.key],
    color: d.color
  }));
  const overallMatch = myDNA ? Math.round(dimensions.reduce((sum, d) => sum + getMatchPct(d.myScore, d.theirScore), 0) / dimensions.length) : Math.round(dimensions.reduce((sum, d) => sum + d.theirScore, 0) / dimensions.length);
  if (compact) {
    // SwipeCard 압축 모드: 총점 + 3개 바만
    return <div className="space-y-1">
        {/* 한 줄 요약 */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[10px] font-extrabold text-white/70 uppercase tracking-wider">{t("auto.z_autoz\uC5EC\uD589DNA_1191")}</span>
          <span className="ml-auto text-[11px] font-extrabold" style={{
          color: overallMatch >= 80 ? "#10b981" : overallMatch >= 60 ? "#f59e0b" : "#ef4444"
        }}>
            {overallMatch}{t("auto.z_autoz\uB9E4\uCE6D136_1192")}</span>
        </div>
        {dimensions.slice(0, 3).map((d, i) => {
        const match = myDNA ? getMatchPct(d.myScore, d.theirScore) : Math.round(d.theirScore);
        return <div key={i} className="flex items-center gap-1.5">
              <span className="text-[10px] w-4 text-center">{d.emoji}</span>
              <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div className="h-full rounded-full" style={{
              background: d.color
            }} initial={{
              width: 0
            }} animate={{
              width: `${d.theirScore}%`
            }} transition={{
              delay: i * 0.1,
              type: "spring",
              damping: 20
            }} />
              </div>
              <span className="text-[9px] text-white/60 w-6 text-right">{d.theirScore}%</span>
            </div>;
      })}
      </div>;
  }

  // 풀 모드 (MatchModal용)
  const {
    canTravelDNAFull
  } = useSubscription();
  if (!canTravelDNAFull) {
    return <div className="rounded-2xl p-4 border border-white/10 bg-white/5 relative overflow-hidden group">
      <div className="flex items-center justify-between mb-3 blur-sm opacity-50 select-none">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🧬</span>
          <span className="text-xs font-extrabold text-foreground">{t("auto.z_autoz\uC5EC\uD589DNA_1193")}</span>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-500">
          <span className="text-xs font-extrabold">--{t("auto.z_autoz\uC77C\uCE58137_1194")}</span>
        </div>
      </div>

      <div className="space-y-4 blur-md opacity-40 select-none">
         <div className="h-3 bg-white/20 rounded-full w-full"></div>
         <div className="h-3 bg-white/20 rounded-full w-4/5"></div>
         <div className="h-3 bg-white/20 rounded-full w-5/6"></div>
         <div className="h-3 bg-white/20 rounded-full w-3/4"></div>
      </div>

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 rounded-2xl bg-black/20">
        <div className="bg-background/95 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl flex flex-col items-center gap-3 border border-border mt-2">
           <Lock size={24} className="text-amber-500" />
           <p className="text-sm font-bold text-foreground text-center">{t("auto.z_Plus\uACB0\uC81C\uC2DC_1195")}<br />{t("auto.z_5\uCC28\uC6D0\uC5EC\uD589DNA\uBD84\uC11D_1196")}</p>
        </div>
      </div>
    </div>;
  }
  return <div className="rounded-2xl p-4 border border-white/10 bg-white/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🧬</span>
          <span className="text-xs font-extrabold text-foreground">{t("auto.z_autoz\uC5EC\uD589DNA_1197")}</span>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{
        background: overallMatch >= 80 ? "rgba(16,185,129,0.15)" : overallMatch >= 60 ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
        color: overallMatch >= 80 ? "#10b981" : overallMatch >= 60 ? "#f59e0b" : "#ef4444"
      }}>
          <span className="text-xs font-extrabold">{overallMatch}{t("auto.z_autoz\uC77C\uCE58137_1198")}</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {dimensions.map((d, i) => {
        const match = myDNA ? getMatchPct(d.myScore, d.theirScore) : Math.round(d.theirScore);
        const dim = DIMENSIONS[i];
        return <div key={i}>
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-[11px]">{d.emoji}</span>
                  <span className="text-[10px] text-muted-foreground">{dim.labelA}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{dim.labelB}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {/* 내 점수 (왼쪽) */}
                {myDNA && <div className="w-6 text-[9px] text-right font-bold" style={{
              color: d.color
            }}>
                    {Math.round(d.myScore)}
                  </div>}
                {/* 바 */}
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden relative">
                  {/* 상대방 바 */}
                  <motion.div className="absolute inset-y-0 left-0 rounded-full opacity-60" style={{
                background: d.color
              }} initial={{
                width: 0
              }} animate={{
                width: `${d.theirScore}%`
              }} transition={{
                delay: i * 0.08,
                type: "spring",
                damping: 20
              }} />
                  {/* 내 바 (겹쳐서 표시) */}
                  {myDNA && <motion.div className="absolute top-0 bottom-0 w-0.5 rounded-full" style={{
                background: "#fff",
                left: `${d.myScore}%`
              }} initial={{
                opacity: 0
              }} animate={{
                opacity: 1
              }} transition={{
                delay: 0.5
              }} />}
                </div>
                {/* 상대방 점수 */}
                <div className="w-6 text-[9px] font-bold" style={{
              color: d.color
            }}>
                  {Math.round(d.theirScore)}
                </div>
              </div>
            </div>;
      })}
      </div>

      {myDNA && <p className="text-[9px] text-muted-foreground text-center mt-3">{t("auto.z_autoz\uD770\uC0C9\uC120\uB098\uCEEC_1199")}</p>}
    </div>;
};
export default TravelDNA;
export { inferDNA, getMatchPct };