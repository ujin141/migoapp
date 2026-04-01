import i18n from "@/i18n";
import React from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Star, Check, MapPin, Calendar, Users, Crown, Zap, Gift } from "lucide-react";
import type { MatchResult } from "@/lib/matchingEngine";
import { getLocalizedPrice } from "@/lib/pricing";
import { useTranslation } from "react-i18next";
import { translateText } from "@/lib/translateService";
import { useState, useCallback } from "react";

// ──────────────────────────────────────────────
// Gender ratio visualizer
// ──────────────────────────────────────────────
const GenderBar = ({
  maleCount,
  femaleCount,
  total
}: {
  maleCount: number;
  femaleCount: number;
  total: number;
}) => {
  const malePct = total > 0 ? Math.round(maleCount / total * 100) : 50;
  return <div className="flex items-center gap-2">
      <span className="text-[10px] text-blue-400 font-bold">👨 {maleCount}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-muted">
        <div className="h-full rounded-full" style={{
        width: `${malePct}%`,
        background: "linear-gradient(90deg, #3b82f6, #ec4899)"
      }} />
      </div>
      <span className="text-[10px] text-pink-400 font-bold">{femaleCount} 👩</span>
    </div>;
};

// ──────────────────────────────────────────────
// Vibe icon
// ──────────────────────────────────────────────
function vibeEmoji(tags: string[]): string {
  const all = tags.join(" ").toLowerCase();
  if (["클럽", "파티", "나이트", "bar"].some(k => all.includes(k))) return "🎉";
  if (["힐링", "카페", "편한"].some(k => all.includes(k))) return "😊";
  if (["투어", "진지", i18n.t("auto.db_match_history", { defaultValue: "역사" }), "문화"].some(k => all.includes(k))) return "🎯";
  return "✨";
}

// ──────────────────────────────────────────────
// MatchCard Component
// ──────────────────────────────────────────────
interface MatchCardProps {
  result: MatchResult;
  index: number;
  onAccept: (result: MatchResult) => void;
  onSkip: (result: MatchResult) => void;
  onClickCard?: (result: MatchResult) => void;
  isPremiumMode: boolean;
  isTop?: boolean;
}
const MatchCard: React.FC<MatchCardProps> = ({
  result,
  index,
  onAccept,
  onSkip,
  onClickCard,
  isPremiumMode,
  isTop
}) => {
  const {
    i18n
  } = useTranslation();
  const targetLangAuto = i18n.language.split("-")[0] || "en";
  const targetLang = targetLangAuto as "en" | "ko" | "ja" | "zh" | "es" | "fr" | "th" | "id" | "vi" | "de";

  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [translatedDest, setTranslatedDest] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (translatedTitle) {
      setTranslatedTitle(null);
      setTranslatedDest(null);
      return;
    }
    setIsTranslating(true);
    try {
      if (result.group.title) {
        const titleRes = await translateText({ text: result.group.title, targetLang });
        setTranslatedTitle(titleRes);
      }
      if (result.group.destination) {
        const destRes = await translateText({ text: result.group.destination, targetLang });
        setTranslatedDest(destRes);
      }
    } finally {
      setIsTranslating(false);
    }
  }, [result.group.title, result.group.destination, targetLang, translatedTitle]);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const dragged = React.useRef(false);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    dragged.current = Math.abs(info.offset.x) > 5 || Math.abs(info.offset.y) > 5;
    if (info.offset.x > 120) onAccept(result);
    else if (info.offset.x < -120) onSkip(result);
  };

  const handleCardClick = () => {
    if (dragged.current) { dragged.current = false; return; }
    onClickCard?.(result);
  };
  const {
    group,
    genderStats,
    avgRating,
    feeForUser,
    isFreeForUser,
    matchReasons
  } = result;
  const total = genderStats.maleCount + genderStats.femaleCount + genderStats.otherCount;
  const ratingColor = avgRating >= 4.5 ? "text-amber-400" : avgRating >= 4.0 ? "text-emerald-400" : "text-muted-foreground";
  return <motion.div initial={isTop !== undefined ? undefined : {
    opacity: 0,
    y: 24
  }} animate={isTop !== undefined ? undefined : {
    opacity: 1,
    y: 0
  }} transition={isTop !== undefined ? undefined : {
    delay: index * 0.06,
    duration: 0.35
  }} exit={isTop !== undefined ? { x: x.get() > 0 ? 300 : -300, opacity: 0, transition: { duration: 0.3 } } : undefined}
  style={isTop !== undefined ? { x, rotate, zIndex: isTop ? 10 : 0 } : undefined}
  drag={isTop ? "x" : false}
  dragConstraints={{ left: 0, right: 0 }}
  dragElastic={0.9}
  onDragEnd={handleDragEnd}
  onClick={handleCardClick}
  className={`bg-card rounded-3xl shadow-card overflow-hidden border border-border/40 ${isTop !== undefined ? "absolute inset-0" : ""} ${onClickCard ? "cursor-pointer" : ""}`}>
      {/* Cover image */}
      <div className="relative w-full h-36 overflow-hidden bg-gradient-to-br from-primary/20 to-purple-500/20">
        {group.coverImage && <img src={group.coverImage} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div className="flex gap-1.5">
            {group.isPremiumGroup && <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30 backdrop-blur-sm">
                <Crown size={9} />{i18n.t("auto.z_\uAC80\uC99D_0a4c43")}</span>}
            {isPremiumMode && <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm">{i18n.t("auto.z_\uD504\uB9AC\uBBF8\uC5C4_5ee37b")}</span>}
          </div>
          {/* Rating */}
          <span className={`flex items-center gap-1 text-xs font-extrabold px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-sm ${ratingColor}`}>
            <Star size={10} fill="currentColor" /> {avgRating.toFixed(1)}
          </span>
        </div>

        {/* Vibe */}
        <div className="absolute bottom-2 left-3">
          <span className="text-2xl">{vibeEmoji(group.tags)}</span>
        </div>

        {/* Title */}
        <div className="absolute bottom-2 left-10 right-3">
          <div className="flex justify-between items-end gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-white truncate">{translatedTitle || group.title}</h3>
              <p className="text-[10px] text-white/70 truncate">{translatedDest || group.destination}</p>
            </div>
            {/* Translation Button */}
            <button 
              onClick={handleTranslate}
              className={`flex items-center justify-center p-1.5 rounded-full shrink-0 transition-all shadow-sm backdrop-blur-md ${
                translatedTitle 
                  ? "bg-primary text-white border border-primary/50" 
                  : "bg-black/40 text-white/70 border border-white/20 hover:bg-black/60"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isTranslating ? "animate-pulse" : ""}>
                <path d="m5 8 6 6"/>
                <path d="m4 14 6-6 2-3"/>
                <path d="M2 5h12"/>
                <path d="M7 2h1"/>
                <path d="m22 22-5-10-5 10"/>
                <path d="M14 18h6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Match reasons */}
        {matchReasons.length > 0 && <div className="flex flex-wrap gap-1">
            {matchReasons.map(r => <span key={r} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {r}
              </span>)}
          </div>}

        {/* Meta row */}
        <div className="flex flex-wrap gap-3">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar size={10} /> {group.dates}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Users size={10} /> {group.currentMembers}/{group.maxMembers}{i18n.t("auto.z_\uBA85_7b3c6e")}</span>
          {group.daysLeft <= 5 && <span className="flex items-center gap-1 text-[11px] text-orange-500 font-bold">
              <Zap size={10} /> D-{group.daysLeft}
            </span>}
        </div>

        {/* Gender bar (Premium mode only) */}
        {isPremiumMode && <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{i18n.t("auto.z_\uC131\uBE44_e2b321")}</span>
            <GenderBar maleCount={genderStats.maleCount} femaleCount={genderStats.femaleCount} total={total} />
            <span className="text-[10px] text-muted-foreground">{genderStats.label}</span>
          </div>}

        {/* Host */}
        <div className="flex items-center gap-2">
          {group.hostPhoto ? <img src={group.hostPhoto} alt="" className="w-7 h-7 rounded-lg object-cover" /> : <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">{group.hostName?.[0] || "M"}</div>}
          <div>
            <span className="text-[11px] font-bold text-foreground">{group.hostName}</span>
            {group.hostCompletedGroups && group.hostCompletedGroups > 0 && <span className="text-[9px] text-amber-400 font-bold ml-1.5">🏆 {group.hostCompletedGroups}{i18n.t("auto.z_\uBC88\uC644\uC8FC_f431d0")}</span>}
          </div>
          {group.isPremiumGroup && <div className="ml-auto w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check size={8} className="text-white" strokeWidth={3} />
            </div>}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {group.tags.slice(0, 4).map(tag => <span key={tag} className="text-[10px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">#{tag}</span>)}
        </div>

        {/* Price + CTA */}
        <div className="flex items-center gap-3 pt-1">
          {/* Fee display */}
          <div className="flex-1">
            {isFreeForUser ? <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-pink-500/20 flex items-center justify-center">
                  <Gift size={10} className="text-pink-500" />
                </div>
                <span className="text-sm font-extrabold text-pink-500">{i18n.t("auto.z_\uC5EC\uC131\uBB34\uB8CC_64c6fc")}</span>
              </div> : <div>
                <span className="text-xs text-muted-foreground">{i18n.t("auto.z_\uCC38\uC5EC\uBE44_e18045")}</span>
                <p className="text-base font-extrabold text-foreground">
                  {getLocalizedPrice(feeForUser, i18n.language)}
                </p>
              </div>}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <motion.button whileTap={{
            scale: 0.93
          }} onClick={(e) => { e.stopPropagation(); onSkip(result); }} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl">
              👋
            </motion.button>
            <motion.button whileTap={{
            scale: 0.95
          }} onClick={(e) => { e.stopPropagation(); onAccept(result); }} className="flex items-center gap-2 px-4 h-10 rounded-xl gradient-primary text-white text-xs font-extrabold shadow-card">{i18n.t("auto.z_\uCC38\uC5EC\uD558\uAE30_0892a2")}</motion.button>
          </div>
        </div>
      </div>
    </motion.div>;
};
export default MatchCard;