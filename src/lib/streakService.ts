/**
 * streakService.ts
 * 로컬스토리지 기반 연속 사용 스트릭 & 레벨 시스템
 */

const STREAK_KEY = "migo_streak";

export interface StreakData {
  currentStreak: number;    // 현재 연속 일수
  longestStreak: number;    // 최장 연속 일수
  lastVisit: string;        // ISO date 'YYYY-MM-DD'
  totalDays: number;        // 누적 방문 일수
  level: StreakLevel;
  xp: number;               // 경험치
}

export type StreakLevel = "Explorer" | "Wanderer" | "Adventurer" | "Nomad" | "Legend";

const LEVEL_THRESHOLDS: Record<StreakLevel, number> = {
  Explorer:   0,
  Wanderer:   7,
  Adventurer: 21,
  Nomad:      60,
  Legend:     120,
};

export function getLevel(streak: number): StreakLevel {
  if (streak >= 120) return "Legend";
  if (streak >= 60)  return "Nomad";
  if (streak >= 21)  return "Adventurer";
  if (streak >= 7)   return "Wanderer";
  return "Explorer";
}

export function getNextLevel(current: StreakLevel): { level: StreakLevel; daysRequired: number } | null {
  const order: StreakLevel[] = ["Explorer", "Wanderer", "Adventurer", "Nomad", "Legend"];
  const idx = order.indexOf(current);
  if (idx >= order.length - 1) return null;
  const next = order[idx + 1];
  return { level: next, daysRequired: LEVEL_THRESHOLDS[next] };
}

export function loadStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) return JSON.parse(raw) as StreakData;
  } catch {/* ignore */}
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastVisit: "",
    totalDays: 0,
    level: "Explorer",
    xp: 0,
  };
}

/** 앱 접속 시 호출. 스트릭 갱신 후 반환 */
export function checkInStreak(): { data: StreakData; isNew: boolean; leveledUp: boolean } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;
  const prev = loadStreak();

  if (prev.lastVisit === today) {
    // 오늘 이미 체크인 완료
    return { data: prev, isNew: false, leveledUp: false };
  }

  const prevDate = prev.lastVisit ? new Date(prev.lastVisit) : null;
  const todayDate = new Date(today);
  const diffDays = prevDate
    ? Math.round((todayDate.getTime() - prevDate.getTime()) / 86400000)
    : 99;

  const newStreak = diffDays === 1 ? prev.currentStreak + 1 : 1;
  const newLongest = Math.max(prev.longestStreak, newStreak);
  const newTotal = prev.totalDays + 1;
  const newXp = prev.xp + 10 + (newStreak > 1 ? 5 : 0); // 연속 보너스
  const prevLevel = prev.level;
  const newLevel = getLevel(newStreak);

  const next: StreakData = {
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastVisit: today,
    totalDays: newTotal,
    level: newLevel,
    xp: newXp,
  };

  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(next));
  } catch {/* ignore */}

  return { data: next, isNew: true, leveledUp: newLevel !== prevLevel };
}

export const LEVEL_COLORS: Record<StreakLevel, string> = {
  Explorer:   "from-emerald-400 to-teal-500",
  Wanderer:   "from-blue-400 to-sky-500",
  Adventurer: "from-violet-500 to-purple-600",
  Nomad:      "from-orange-400 to-amber-500",
  Legend:     "from-yellow-400 to-red-500",
};

export const LEVEL_EMOJI: Record<StreakLevel, string> = {
  Explorer:   "🌱",
  Wanderer:   "🧭",
  Adventurer: "⚡",
  Nomad:      "🔥",
  Legend:     "👑",
};
