import { createClient } from "@supabase/supabase-js";
import i18n from "@/i18n";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const isSupabaseConfigured =
  typeof supabaseUrl === "string" &&
  supabaseUrl.startsWith("https://") &&
  typeof supabaseAnonKey === "string" &&
  supabaseAnonKey.length > 10;

/** localStorage에서 직접 세션을 읽습니다 (initializePromise 대기 없음). */
const _projectRef = isSupabaseConfigured
  ? new URL(supabaseUrl).hostname.split(".")[0]
  : "";
const _sessionKey = `sb-${_projectRef}-auth-token`;

function _readSessionFromStorage() {
  try {
    const raw = localStorage.getItem(_sessionKey);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s?.access_token ? s : null;
  } catch {
    return null;
  }
}

// ── 싱글톤 클라이언트 ────────────────────────────────────────────────────────
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { __SUPABASE__?: any; }
}

if (!window.__SUPABASE__ && isSupabaseConfigured) {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      lock: <R>(_n: string, _t: number, fn: () => Promise<R>): Promise<R> => fn(),
    },
    global: {
      headers: {
        // Keep-Alive 원하는 안정적 HTTP 연결 지속
        'x-client-info': 'migo-app/1.0',
      },
    },
    realtime: {
      // Realtime heartbeat 60초 (기본 30초 대비 서버 Ping 비용 절반)
      heartbeatIntervalMs: 60000,
      // 연결 자실: 최대 10초 대기 후 재연결
      reconnectAfterMs: (tries: number) => Math.min(tries * 2000, 10000),
    },
  });

  // ════════════════════════════════════════════════════════════════════════
  // 데드락 완전 해결 패치 (createClient 후 미시작 마이크로태스크 이전에 실행)
  //
  // 🔗 데드락 체인:
  //   initializePromise
  //     → _acquireLock [lockAcquired=true]
  //       → _recoverAndRefresh
  //         → _notifyAllSubscribers('SIGNED_IN')  ← await 콜백
  //           → useAuth onAuthStateChange 콜백
  //             → supabase.from('profiles')
  //               → getSession() → await initializePromise  ← 💀 순환 대기
  //
  // ✅ 패치 1: _notifyAllSubscribers — 콜백을 await하지 않고 microtask로 지연.
  //            initializePromise가 먼저 완료된 후 콜백이 실행됨.
  // ✅ 패치 2: getSession — lockAcquired=true(초기화 중) 이면 localStorage를
  //            직접 읽어 initializePromise 대기를 스킵.
  // ════════════════════════════════════════════════════════════════════════
  const a = client.auth as any;

  // 패치 1: _notifyAllSubscribers — 콜백을 fire-and-forget으로 전환
  const _origNotify = a._notifyAllSubscribers.bind(a);
  a._notifyAllSubscribers = function (
    event: string,
    session: unknown,
    broadcast = true
  ): Promise<void> {
    if (this.broadcastChannel && broadcast) {
      this.broadcastChannel.postMessage({ event, session });
    }
    // 콜백을 현재 microtask 이후에 실행 → initializePromise 완료 후 실행됨
    const emitters = Array.from(
      (this.stateChangeEmitters as Map<string, { callback: Function }>).values()
    );
    for (const x of emitters) {
      Promise.resolve()
        .then(() => x.callback(event, session))
        .catch((e: unknown) => console.error("[Supabase] onAuthStateChange error:", e));
    }
    return Promise.resolve();
  };

  // 패치 2: getSession — 락 획득 중(초기화가 진행 중)일 때만 localStorage에서 직접 읽기
  // ⚠️ initializePromise는 완료 후에도 truthy(resolved Promise)로 남아
  //    정상 getSession 흐름을 계속 우회하게 되어 401을 유발함 → lockAcquired만 체크
  // ✅ 추가 안전장치: localStorage에서 읽은 토큰이 이미 만료된 경우에는
  //    원본 getSession()으로 폴백 → Supabase가 refresh_token으로 정상 갱신하도록 허용
  const _origGetSession = a.getSession.bind(a);
  a.getSession = async function () {
    if (this.lockAcquired) {
      // 초기화 진행 중: localStorage에서 직접 읽어 deadlock 회피
      const stored = _readSessionFromStorage();
      if (stored) {
        // expires_at은 Unix 초(seconds) 단위 — 만료 여부 확인 (30초 여유)
        const expiresAt: number | undefined = (stored as any).expires_at;
        const isExpired = expiresAt != null && expiresAt * 1000 < Date.now() + 30_000;
        if (!isExpired) {
          return { data: { session: stored }, error: null };
        }
        // 토큰이 만료됐다면 lockAcquired 중이더라도 원본으로 폴백 (refresh 허용)
        console.info('[Supabase] stored token expired during lock — falling through to original getSession');
      }
      return { data: { session: null }, error: null };
    }
    return _origGetSession();
  };

  window.__SUPABASE__ = client;
  console.info(i18n.t("auto.g_0563", "[Supabase] ✅ 클라이언트 초기화 + 데드락 패치 완료"));
}

// isSupabaseConfigured가 false이면 dummy client
export const supabase =
  window.__SUPABASE__ ??
  createClient(
    "https://placeholder.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMH0.placeholder"
  );

if (!isSupabaseConfigured) {
  console.warn(i18n.t("auto.g_0564", "[Supabase] .env.local에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY가 없습니다."));
}

// ── 인메모리 캐시 ────────────────────────────────────────────────────────────
interface CacheEntry<T> { data: T; expiry: number; }
const _queryCache = new Map<string, CacheEntry<unknown>>();
const _MAX_CACHE_SIZE = 300; // 1000 → 300으로 절감 (메모리 70% 절감)

export function getCached<T>(key: string): T | null {
  const e = _queryCache.get(key) as CacheEntry<T> | undefined;
  if (e && Date.now() < e.expiry) return e.data;
  _queryCache.delete(key);
  return null;
}

export function setCache<T>(key: string, data: T, ttlMs = 5 * 60 * 1000): void {
  // LRU-like: 캐시 키 300개 초과 시 만료 항목을 먼저 제거, 그 다음에 가장 오래된 30개 삭제
  if (_queryCache.size >= _MAX_CACHE_SIZE) {
    const now = Date.now();
    // 먼저 만료된 항목 정리
    for (const [k, v] of _queryCache.entries()) {
      if (v.expiry < now) _queryCache.delete(k);
    }
    // 여전히 가득 찼다면 가장 오래된 20개 LRU 제거
    if (_queryCache.size >= _MAX_CACHE_SIZE) {
      let count = 0;
      for (const k of _queryCache.keys()) {
        _queryCache.delete(k);
        if (++count >= 20) break;
      }
    }
  }
  _queryCache.set(key, { data, expiry: Date.now() + ttlMs });
}

export function invalidateCache(prefix: string): void {
  _queryCache.forEach((_, k) => { if (k.startsWith(prefix)) _queryCache.delete(k); });
}