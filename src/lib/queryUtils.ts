/**
 * queryUtils.ts — 네트워크 비용 절감 + 성능 최적화 유틸
 *
 * 1. createDeduplicatedFetch  : 동일 키 동시 요청 1회만 실행 (inflight dedup)
 * 2. batchFetchProfiles       : 여러 user_id 한 번에 조회 (N+1 방지)
 * 3. PAGE_SIZE                : 전역 페이지 크기 상수
 */

import { supabase, getCached, setCache } from "./supabaseClient";

// ── 전역 페이지 크기 ────────────────────────────────────────────
export const PAGE_SIZE = 20;           // 기존 30~50 → 20으로 절감
export const GROUPS_PAGE_SIZE = 20;
export const POSTS_PAGE_SIZE = 20;
export const NOTIFS_PAGE_SIZE = 30;   // 기존 50 → 30

// ── Inflight dedup: 같은 키 동시 요청 1번만 실행 ────────────────
const _inFlight = new Map<string, Promise<any>>();

export function createDeduplicatedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 30_000
): Promise<T> {
  // 캐시 히트
  const cached = getCached<T>(key);
  if (cached !== null) return Promise.resolve(cached);

  // 이미 같은 요청이 진행 중이면 그 Promise를 공유
  if (_inFlight.has(key)) return _inFlight.get(key) as Promise<T>;

  const promise = fetcher()
    .then((data) => {
      setCache(key, data, ttlMs);
      return data;
    })
    .finally(() => {
      _inFlight.delete(key);
    });

  _inFlight.set(key, promise);
  return promise;
}

// ── 프로필 배치 조회 (N+1 제거) ──────────────────────────────────
// 한 번에 최대 200개 id를 IN() 쿼리로 묶어 조회
const _profileBatchQueue: Map<
  string,
  { resolve: (v: any) => void; reject: (e: any) => void }
> = new Map();
let _profileBatchTimer: ReturnType<typeof setTimeout> | null = null;

const PROFILE_FIELDS = "id, name, photo_url, verified, plan" as const;

function _flushProfileBatch() {
  _profileBatchTimer = null;
  if (_profileBatchQueue.size === 0) return;

  const ids = [..._profileBatchQueue.keys()];
  const pending = new Map(_profileBatchQueue);
  _profileBatchQueue.clear();

  supabase
    .from("profiles")
    .select(PROFILE_FIELDS)
    .in("id", ids)
    .then(({ data, error }) => {
      if (error) {
        pending.forEach(({ reject }) => reject(error));
        return;
      }
      const map: Record<string, any> = {};
      for (const p of data || []) map[p.id] = p;
      pending.forEach(({ resolve }, id) => resolve(map[id] ?? null));
    });
}

export function batchFetchProfile(userId: string): Promise<{
  id: string;
  name: string;
  photo_url: string;
  verified: boolean;
  plan: string;
} | null> {
  // 캐시 히트
  const cacheKey = `profile:${userId}`;
  const cached = getCached<any>(cacheKey);
  if (cached !== null) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    _profileBatchQueue.set(userId, {
      resolve: (v) => {
        if (v) setCache(cacheKey, v, 5 * 60_000);
        resolve(v);
      },
      reject,
    });
    // 10ms 디바운스로 배치 플러시
    if (!_profileBatchTimer) {
      _profileBatchTimer = setTimeout(_flushProfileBatch, 10);
    }
  });
}

// ── Supabase 이미지 URL 변환: 리사이즈 파라미터 추가 ──────────────
// Supabase Storage Image Transform API (Pro 플랜 이상)
// anon 플랜에서도 width/quality 파라미터 추가 시 CDN 캐시 히트율 향상
export function getOptimizedImageUrl(
  url: string | null | undefined,
  width = 400,
  quality = 75
): string {
  if (!url) return "";
  // 이미 Supabase Storage URL이면 transform 파라미터 추가
  if (url.includes("/storage/v1/object/public/")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}width=${width}&quality=${quality}`;
  }
  return url;
}

// ── 날짜 포맷 메모이제이션 (반복 Intl 객체 생성 방지) ─────────────
const _dtfCache = new Map<string, Intl.DateTimeFormat>();

export function getDateFormatter(locale: string): Intl.DateTimeFormat {
  if (!_dtfCache.has(locale)) {
    _dtfCache.set(
      locale,
      new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" })
    );
  }
  return _dtfCache.get(locale)!;
}

export function formatDateCached(isoStr: string, locale: string): string {
  try {
    return getDateFormatter(locale).format(new Date(isoStr));
  } catch {
    return isoStr.slice(0, 10);
  }
}
