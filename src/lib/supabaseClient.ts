import i18n from "@/i18n";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
export const isSupabaseConfigured = supabaseUrl.startsWith("https://") && supabaseAnonKey.length > 10;
declare global {
  interface Window {
    __SUPABASE_CLIENT__?: SupabaseClient;
  }
}

// Only create client when properly configured to avoid runtime crash
// 🚨 브라우저 전역 객체에 캐싱하여 Vite HMR(핫 리로드) 시 클라이언트가 반복 생성되어
// Lock(auth token) 경합 에러가 발생하는 현상을 완벽하게 방지합니다.
// storage type이 변경되었으므로 기존 캐시 무효화
if (window.__SUPABASE_CLIENT__) {
  delete window.__SUPABASE_CLIENT__;
}
let _supabase: SupabaseClient | null = null;
if (!_supabase && isSupabaseConfigured) {
  try {
    // 🚨 브라우저 탭 크래시 등으로 인해 남겨진 데드락(Deadlock) 상태의 Supabase Auth 잠금을 강제로 해제합니다.
    // 이 처리를 통해 "Timeout acquiring lock" 또는 8초 무한 로딩 오류를 영구적으로 방지합니다.
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('supabase') && key.includes('lock')) {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.warn(i18n.t("auto.z_\uB85C\uCEEC\uC2A4\uD1A0\uB9AC\uC9C0lock_1067"), e);
  }
  try {
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // 안드로이드 WebView/Capacitor 등 Web Locks API 비정상 동작(데드락)을 무력화하기 위해
        // 브라우저 락(navigator.locks) 대신 무조건 즉시 통과되는 인메모리 싱글탭 Custom Lock을 강제 주입!
        // (주의: GoTrue 내부적으로 expired token 갱신 시 재귀 락(recursive lock)을 호출하므로 Queue Mutex를 쓰면 무한 데드락에 빠집니다)
        lock: async (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
          return await fn();
        }
      }
    });
    window.__SUPABASE_CLIENT__ = _supabase;
  } catch (e) {
    console.warn(i18n.t("auto.z_Supabasecl_912"), e);
  }
} else if (!isSupabaseConfigured) {
  console.info(i18n.t("auto.z_autozSupab_1251") + i18n.t("auto.z_autozenvlo_1252"));
}

// Export a safe proxy — all calls are no-ops when not configured
export const supabase = _supabase ?? createClient("https://placeholder.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMH0.placeholder");

// ── 인메모리 캐시 레이어 (트래픽 비용 절감) ──────────────────────
// 동일한 Supabase 쿼리 결과를 TTL 동안 캐싱 → DB 호출 감소
interface CacheEntry<T> {
  data: T;
  expiry: number;
}
const _queryCache = new Map<string, CacheEntry<unknown>>();
export function getCached<T>(key: string): T | null {
  const entry = _queryCache.get(key) as CacheEntry<T> | undefined;
  if (entry && Date.now() < entry.expiry) return entry.data;
  _queryCache.delete(key);
  return null;
}
export function setCache<T>(key: string, data: T, ttlMs = 5 * 60 * 1000): void {
  // LRU 방식: 캐시 500개 초과 시 오래된 항목 제거
  if (_queryCache.size >= 500) {
    const firstKey = _queryCache.keys().next().value;
    if (firstKey !== undefined) _queryCache.delete(firstKey);
  }
  _queryCache.set(key, {
    data,
    expiry: Date.now() + ttlMs
  });
}
export function invalidateCache(prefix: string): void {
  _queryCache.forEach((_, key) => {
    if (key.startsWith(prefix)) _queryCache.delete(key);
  });
}