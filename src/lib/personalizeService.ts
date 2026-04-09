/**
 * personalizeService.ts
 * 스와이프 패턴 학습 → 프로필 정렬 가중치 반영
 */

const KEY = "migo_pref";
const H24 = 24 * 60 * 60 * 1000; // 24시간 (ms)

interface Prefs {
  nationality: Record<string, number>; // 국가별 좋아요 카운트
  travelStyle: Record<string, number>; // 여행 스타일별 좋아요
  ageRange: Record<string, number>;    // 나이대별 선호
  likedIds?: string[];                  // legacy
  dislikedIds?: string[];               // legacy
  swipeLogs: Record<string, number>;   // id -> timestamp
}

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (!p.swipeLogs) p.swipeLogs = {};
      return p as Prefs;
    }
  } catch { /* ignore */ }
  return { nationality: {}, travelStyle: {}, ageRange: {}, swipeLogs: {} };
}

function savePrefs(p: Prefs) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

export function recordSwipe(profile: {
  id: string;
  nationality?: string;
  travel_style?: string;
  age?: number;
}, liked: boolean) {
  const p = loadPrefs();
  
  if (liked) {
    if (profile.nationality) p.nationality[profile.nationality] = (p.nationality[profile.nationality] || 0) + 1;
    if (profile.travel_style) p.travelStyle[profile.travel_style] = (p.travelStyle[profile.travel_style] || 0) + 1;
    if (profile.age) {
      const bucket = `${Math.floor(profile.age / 10) * 10}s`;
      p.ageRange[bucket] = (p.ageRange[bucket] || 0) + 1;
    }
  }
  
  // 기록 (무조건 24시간 제한을 위해)
  if (!p.swipeLogs) p.swipeLogs = {};
  p.swipeLogs[profile.id] = Date.now();

  // 정리 (24시간 지난 로그는 굳이 로컬스토리지에 들고 있을 필요 없으므로 클리어)
  const now = Date.now();
  for (const k of Object.keys(p.swipeLogs)) {
    if (now - p.swipeLogs[k] >= H24) {
      delete p.swipeLogs[k];
    }
  }

  savePrefs(p);
}

export function personalize<T extends {
  id: string;
  nationality?: string;
  travel_style?: string;
  age?: number;
}>(profiles: T[]): T[] {
  const p = loadPrefs();
  const now = Date.now();

  // 24시간 이내에 보았던(스와이프한) 상대는 완전히 날리기
  // legacy data 인 likedIds, dislikedIds 도 체크하지만 24시간 갱신이 불가능하므로 
  // 새로 찍히는 swipeLogs 만 24h 체크에 적극 반영.
  const unseen = profiles.filter(pr => {
    const swipedAt = p.swipeLogs?.[pr.id];
    if (swipedAt && now - swipedAt < H24) {
      return false; // 24시간 이내라면 숨김
    }
    return true;
  });

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
  return scored.map(s => s.pr);
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
  return Object.keys(loadPrefs().swipeLogs || {}).length;
}
