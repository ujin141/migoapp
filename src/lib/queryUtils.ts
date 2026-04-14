/**
 * withRetry — Supabase 쿼리 네트워크 에러 시 1회 재시도 래퍼
 * 
 * 사용법:
 *   const { data, error } = await withRetry(() =>
 *     supabase.from('profiles').select('id,name').eq('id', userId).single()
 *   );
 *
 * 재시도 조건:
 *  - FetchError (네트워크 단절)
 *  - 503 Service Unavailable
 *  - 429 Too Many Requests (1초 후 재시도)
 */

type SupabaseResult<T> = { data: T | null; error: any };

const RETRIABLE_CODES = new Set([503, 429, 408]);
const RETRIABLE_MSGS = ["Failed to fetch", "NetworkError", "Load failed", "timeout"];

function isRetriable(error: any): boolean {
  if (!error) return false;
  if (RETRIABLE_CODES.has(error.status ?? error.code)) return true;
  const msg: string = error.message ?? String(error);
  return RETRIABLE_MSGS.some(m => msg.includes(m));
}

export async function withRetry<T>(
  fn: () => Promise<SupabaseResult<T>>,
  delayMs = 1000
): Promise<SupabaseResult<T>> {
  const result = await fn();
  if (result.error && isRetriable(result.error)) {
    await new Promise(r => setTimeout(r, delayMs));
    return fn(); // 1회 재시도
  }
  return result;
}

/**
 * safeQuery — try/catch + withRetry 결합 래퍼
 * 예외가 발생해도 { data: null, error } 형태로 안전하게 반환
 */
export async function safeQuery<T>(
  fn: () => Promise<SupabaseResult<T>>,
  fallback: T | null = null
): Promise<SupabaseResult<T>> {
  try {
    return await withRetry(fn);
  } catch (e: any) {
    console.warn("[safeQuery] caught exception:", e?.message ?? e);
    return { data: fallback, error: e };
  }
}
