/**
 * personalizeService.ts
 * 스와이프 패턴 학습 → 프로필 정렬 가중치 반영
 */

const KEY = "migo_pref";

interface Prefs {
  nationality: Record<string, number>; // 국가별 좋아요 카운트
  travelStyle: Record<string, number>; // 여행 스타일별 좋아요
  ageRange: Record<string, number>;    // 나이대별 선호
  likedIds: string[];                  // 좋아요한 user id
  dislikedIds: string[];
}

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { nationality: {}, travelStyle: {}, ageRange: {}, likedIds: [], dislikedIds: [] };
}

function savePrefs(p: Prefs) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

/** 스와이프 이벤트 기록 */
export function recordSwipe(profile: {
  id: string;
  nationality?: string;
  travel_style?: string;
  age?: number;
}, liked: boolean) {
  const p = loadPrefs();
  if (liked) {
    if (!p.likedIds.includes(profile.id)) p.likedIds.push(profile.id);
    if (profile.nationality) p.nationality[profile.nationality] = (p.nationality[profile.nationality] || 0) + 1;
    if (profile.travel_style) p.travelStyle[profile.travel_style] = (p.travelStyle[profile.travel_style] || 0) + 1;
    if (profile.age) {
      const bucket = `${Math.floor(profile.age / 10) * 10}s`;
      p.ageRange[bucket] = (p.ageRange[bucket] || 0) + 1;
    }
  } else {
    if (!p.dislikedIds.includes(profile.id)) p.dislikedIds.push(profile.id);
  }
  // 최대 500개 유지
  if (p.likedIds.length > 500) p.likedIds = p.likedIds.slice(-500);
  if (p.dislikedIds.length > 500) p.dislikedIds = p.dislikedIds.slice(-500);
  savePrefs(p);
}

/** 프로필 배열에 가중치 적용하여 정렬 */
export function personalize<T extends {
  id: string;
  nationality?: string;
  travel_style?: string;
  age?: number;
}>(profiles: T[]): T[] {
  const p = loadPrefs();

  // 이미 본 프로필 제외
  const seen = new Set([...p.likedIds, ...p.dislikedIds]);
  const unseen = profiles.filter(pr => !seen.has(pr.id));
  const seen_arr = profiles.filter(pr => seen.has(pr.id));

  // 가중치 계산
  const scored = unseen.map(pr => {
    let score = 0;
    if (pr.nationality && p.nationality[pr.nationality]) score += p.nationality[pr.nationality] * 2;
    if (pr.travel_style && p.travelStyle[pr.travel_style]) score += p.travelStyle[pr.travel_style] * 1.5;
    if (pr.age) {
      const bucket = `${Math.floor(pr.age / 10) * 10}s`;
      if (p.ageRange[bucket]) score += p.ageRange[bucket];
    }
    return { pr, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return [...scored.map(s => s.pr), ...seen_arr];
}

/** 선호 국가 Top3 */
export function getTopNationalities(n = 3): string[] {
  const p = loadPrefs();
  return Object.entries(p.nationality)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([k]) => k);
}

export function getLikedCount(): number {
  return loadPrefs().likedIds.length;
}
