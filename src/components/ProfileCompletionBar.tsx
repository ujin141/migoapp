import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ChevronRight, Zap } from "lucide-react";

interface ProfileData {
  name?: string;
  bio?: string;
  photoUrl?: string;
  location?: string;
  travelDates?: string;
  travelMission?: string;
  visitedCountries?: string[];
  tags?: string[];
  profilePhotos?: { url: string }[];
  userType?: string;
}

interface CompletionItem {
  labelKey: string;
  done: boolean;
  weight: number;
}

function calcCompletion(profile: ProfileData): { score: number; items: CompletionItem[] } {
  const items: CompletionItem[] = [
    { labelKey: "retention.completion.upload_photo",   done: !!profile.photoUrl,                         weight: 25 },
    { labelKey: "retention.completion.set_name",       done: !!(profile.name && profile.name.length > 1), weight: 10 },
    { labelKey: "retention.completion.write_bio",      done: !!(profile.bio && profile.bio.length >= 20), weight: 20 },
    { labelKey: "retention.completion.travel_style",   done: !!profile.userType,                          weight: 10 },
    { labelKey: "retention.completion.set_location",   done: !!profile.location,                          weight: 10 },
    { labelKey: "retention.completion.travel_dates",   done: !!profile.travelDates,                       weight: 10 },
    { labelKey: "retention.completion.travel_mission", done: !!profile.travelMission,                     weight: 5  },
    { labelKey: "retention.completion.interests",      done: (profile.tags?.length ?? 0) >= 3,            weight: 5  },
    { labelKey: "retention.completion.more_photos",    done: (profile.profilePhotos?.length ?? 0) >= 2,   weight: 5  },
  ];
  const score = items.reduce((acc, item) => (item.done ? acc + item.weight : acc), 0);
  return { score, items };
}

function barColor(score: number): string {
  if (score >= 80) return "from-emerald-400 to-green-500";
  if (score >= 60) return "from-amber-400 to-yellow-500";
  return "from-rose-400 to-orange-500";
}

interface Props {
  profile: ProfileData;
  onEditClick?: () => void;
  compact?: boolean;
}

export default function ProfileCompletionBar({ profile, onEditClick, compact = false }: Props) {
  const { t } = useTranslation();
  const { score, items } = calcCompletion(profile);
  const missing = items.filter(i => !i.done);
  const color = barColor(score);

  // 완성도에 따른 부스트 텍스트
  const boostText = score >= 90
    ? t("retention.completion.score_max", "Match rate at max!")
    : score >= 70
    ? t("retention.completion.score_high", "{{count}}x match boost", { count: Math.round(score / 10) })
    : score >= 50
    ? t("retention.completion.score_mid", "Complete for 3x matches")
    : t("retention.completion.score_low", "Complete for 5x matches");

  if (score >= 100) return null;

  if (compact) {
    return (
      <button
        onClick={onEditClick}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-700/40"
      >
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
              {t("retention.completion.title", "Profile {{score}}% complete", { score })}
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-500 font-semibold">
              {boostText} ⚡
            </span>
          </div>
          <div className="h-1.5 bg-amber-200/60 dark:bg-amber-900/40 rounded-full overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${color} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
        <ChevronRight size={14} className="text-amber-500 shrink-0" />
      </button>
    );
  }

  // 확장 버전
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-amber-200/60 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-950/30 p-4 mb-3"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Zap size={14} className="text-amber-500" />
          <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400">
            {t("retention.completion.title", "Profile {{score}}% complete", { score })}
          </span>
        </div>
        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
          {boostText}
        </span>
      </div>

      <div className="h-2 bg-amber-200/60 dark:bg-amber-900/40 rounded-full overflow-hidden mb-3">
        <motion.div
          className={`h-full bg-gradient-to-r ${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      {missing.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-amber-600/70 dark:text-amber-500/70 font-semibold mb-1">
            {t("retention.completion.cta", "Complete profile for more matches!")}
          </p>
          {missing.slice(0, 2).map(item => (
            <button
              key={item.labelKey}
              onClick={onEditClick}
              className="w-full flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-white/60 dark:bg-black/20 border border-amber-100 dark:border-amber-800/30 hover:bg-white dark:hover:bg-black/30 transition-colors"
            >
              <span className="text-[11px] text-foreground/80 font-medium">
                ○ {t(item.labelKey, item.labelKey)}
              </span>
              <span className="text-[10px] text-amber-500 font-bold">+{item.weight}%</span>
            </button>
          ))}
          {missing.length > 2 && (
            <p className="text-[10px] text-amber-500/60 text-center">
              {t("retention.completion.more_items", "{{count}} more items", { count: missing.length - 2 })}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
