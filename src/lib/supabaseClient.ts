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

// ── Log Sanitizer (데이터 유출 원천 차단 방어막) ──────────────────────
const sanitizeLogArgs = (args: any[]) => {
  return args.map((arg) => {
    if (typeof arg === "string") {
      // JWT/Bearer 토큰 마스킹 (헤더, 페이로드 등)
      return arg.replace(/Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/gi, "Bearer [SECURE_REDACTED]");
    }
    if (arg && typeof arg === "object") {
      try {
        const str = JSON.stringify(arg);
        if (str.includes("access_token") || str.includes("refresh_token") || str.includes("password")) {
          // 객체 내의 토큰, 패스워드 키값을 마스킹
          return JSON.parse(
            str.replace(/"(access_token|refresh_token|password)":"[^"]+"/gi, '"$1":"[SECURE_REDACTED]"')
               .replace(/"Bearer\s+[^"]+"/gi, '"Bearer [SECURE_REDACTED]"')
          );
        }
      } catch (e) {
        return arg;
      }
    }
    return arg;
  });
};

const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.log = (...args) => {
  // 배포 환경(PROD)에서는 일반 로그 출력 생략
  if (import.meta.env.PROD) return;
  originalConsoleLog(...sanitizeLogArgs(args));
};

console.error = (...args) => {
  originalConsoleError(...sanitizeLogArgs(args));
};

console.warn = (...args) => {
  originalConsoleWarn(...sanitizeLogArgs(args));
};

// Only create client when properly configured to avoid runtime crash
// 🚨 브라우저 전역 객체에 캐싱하여 Vite HMR(핫 리로드) 시 클라이언트가 반복 생성되어
// Lock(auth token) 경합 에러가 발생하는 현상을 완벽하게 방지합니다.
// storage type이 변경되었으므로 기존 캐시 무효화
if (window.__SUPABASE_CLIENT__) {
  delete window.__SUPABASE_CLIENT__;
}
import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";



let _supabase: SupabaseClient | null = null;

if (!_supabase && isSupabaseConfigured) {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('supabase') && key.includes('lock')) {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.warn(i18n.t("auto.z_로컬스토리지lock_1067"), e);
  }
  try {
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: !Capacitor.isNativePlatform(),
        // 디바이스 플랫폼 확인: Capacitor 브릿지 행(hang) 이슈 방지를 위해 모든 환경에서 동기식 localStorage 사용
        // WKWebView(iOS)에서 localStorage는 기본적으로 영구 보존됩니다.
        storage: window.localStorage,
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
  console.info("Supab" + "envlo");
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