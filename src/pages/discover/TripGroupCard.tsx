import { memo } from "react";
import { motion } from "framer-motion";
import { Check, MapPin, Calendar } from "lucide-react";
import { TripGroup } from "@/types";
import { inferGroupTier, getTierConfig } from "@/lib/pricing";

interface TripGroupCardProps {
  g: TripGroup;
  gIdx: number;
  onClick: () => void;
  t: (key: string, defaultValue?: string) => string;
}

const TripGroupCard = memo(
  ({ g, gIdx, onClick, t }: TripGroupCardProps) => {
    const tier = inferGroupTier(g.tags, g.title, g.isPremiumGroup ?? false);
    const fillRatio = g.currentMembers / Math.max(g.maxMembers, 1);
    const isAlmostFull = fillRatio >= 0.75;
    const isUrgent = g.daysLeft <= 3;
    const isFull = g.currentMembers >= g.maxMembers;
    const seatsLeft = g.maxMembers - g.currentMembers;

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: gIdx * 0.04, duration: 0.2 }}
        className="bg-card rounded-xl shadow-sm overflow-hidden cursor-pointer border border-border/50 active:scale-[0.985] transition-transform"
        onClick={onClick}
      >
        <div className="p-3.5">
          {/* Row 1: host avatar + title + D-day badge */}
          <div className="flex items-start gap-3 mb-2.5">
            <div className="relative shrink-0">
              {g.hostPhoto ? (
                <img
                  src={g.hostPhoto}
                  alt=""
                  className="w-9 h-9 rounded-lg object-cover shadow-sm"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-primary font-extrabold text-sm">
                  {g.hostName?.[0] || "M"}
                </div>
              )}
              {/* Host verified badge */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center">
                <Check size={8} className="text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-extrabold text-foreground leading-tight line-clamp-1 mb-0.5">
                {g.title}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">{g.hostName}</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                <span className="text-[10px] text-emerald-600 font-semibold">
                  ✅ {t("discover.verified", "인증 호스트")}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {isUrgent ? (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 whitespace-nowrap">
                  🔥 D-{g.daysLeft}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground font-semibold whitespace-nowrap">
                  D-{g.daysLeft}
                </span>
              )}
              {tier === "premium" && (
                <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/20">
                  VIP
                </span>
              )}
            </div>
          </div>

          {/* Row 2: 출발 → 목적지 + 날짜 */}
          <div className="flex items-center gap-1.5 mb-2 bg-muted/50 rounded-lg px-3 py-2">
            <MapPin size={10} className="text-muted-foreground shrink-0" />
            <span className="text-[11px] font-semibold text-foreground truncate">
              {g.departure || t("auto.ko_0086", "미정")}
            </span>
            <span className="text-primary font-black text-[11px] px-1">→</span>
            <span className="text-[12px] font-extrabold text-primary flex-1 truncate">
              {g.destination}
            </span>
            <span className="w-px h-3 bg-border/50" />
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground shrink-0 ml-1">
              <Calendar size={9} />
              <span className="truncate max-w-[72px]">{g.dates}</span>
            </span>
          </div>

          {/* Row 3: 인원 progress + seat info */}
          <div className="mb-1.5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[11px] font-bold ${
                    isFull ? "text-red-500" : isAlmostFull ? "text-orange-500" : "text-foreground"
                  }`}
                >
                  {g.currentMembers}/{g.maxMembers}
                  {t("auto.ko_0012", "명")}
                </span>
              </div>
              <span
                className={`text-[10px] font-extrabold ${
                  isFull ? "text-red-500" : isAlmostFull ? "text-orange-500" : "text-emerald-600"
                }`}
              >
                {isFull
                  ? t("discover.full", "마감🔴")
                  : isAlmostFull
                  ? t("discover.almostFull", `잔여 ${seatsLeft}석`)
                  : t("discover.seatsLeft", `${seatsLeft}자리 남음`)}
              </span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  isFull ? "bg-red-500" : isAlmostFull ? "bg-orange-400" : "bg-gradient-to-r from-teal-400 to-blue-500"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(fillRatio * 100, 100)}%` }}
                transition={{ duration: 0.6, delay: gIdx * 0.05 }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  },
  (prev, next) => {
    return (
      prev.g.id === next.g.id &&
      prev.g.currentMembers === next.g.currentMembers &&
      prev.g.maxMembers === next.g.maxMembers &&
      prev.g.daysLeft === next.g.daysLeft &&
      prev.g.dates === next.g.dates &&
      prev.g.destination === next.g.destination &&
      prev.g.departure === next.g.departure &&
      prev.g.title === next.g.title &&
      prev.gIdx === next.gIdx
    );
  }
);

export default TripGroupCard;
