import i18n from "@/i18n";


// ── 번역 결과 메모리 캐시 (트래픽 + API 비용 절감) ───────────────
// key: `${text}:${targetLang}`, value: 번역 결과
const _translateCache = new Map<string, string>();
const MAX_CACHE_SIZE = 500; // 최대 500개 캐싱 (메모리 관리)

function getSupabaseFunctionUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  if (!url) return '';
  return `${url}/functions/v1/clever-api`;
}

async function fetchFromEdgeFunction(action: string, payload: Record<string, any>): Promise<any> {
  const url = getSupabaseFunctionUrl();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${anonKey}`
    },
    body: JSON.stringify({ action, ...payload })
  });
  return res.json();
}

/**
 * 언어 코드 → 언어명 매핑
 */
const LANG_NAMES: Record<string, string> = {
  ko: "Korean",
  en: "English",
  ja: "Japanese",
  zh: "Chinese (Simplified)",
  es: "Spanish",
  fr: "French",
  th: "Thai",
  id: "Indonesian",
  vi: "Vietnamese",
  de: "German"
};
export type SupportedLang = keyof typeof LANG_NAMES;
export interface TranslateOptions {
  text: string;
  targetLang: SupportedLang;
  sourceLang?: SupportedLang; // 자동 감지 시 생략 가능
}

/**
 * 텍스트를 Edge Function을 통해 번역합니다.
 */
export async function translateText({
  text,
  targetLang,
  sourceLang
}: TranslateOptions): Promise<string> {
  // 빈 텍스트 즉시 반환
  if (!text.trim()) return text;

  // 캐시 체크
  const cacheKey = `${text}::${targetLang}`;
  if (_translateCache.has(cacheKey)) {
    return _translateCache.get(cacheKey)!;
  }

  try {
    const data = await fetchFromEdgeFunction("translate", {
      text,
      targetLang: LANG_NAMES[targetLang],
      sourceLang: sourceLang ? LANG_NAMES[sourceLang] : undefined
    });
    
    if (data.success && data.translated) {
      const result = data.translated;
      // 캐시 저장
      if (_translateCache.size >= MAX_CACHE_SIZE) {
        const firstKey = _translateCache.keys().next().value;
        if (firstKey !== undefined) _translateCache.delete(firstKey);
      }
      _translateCache.set(cacheKey, result);
      return result;
    }
    // 실패시 fallback (MyMemory)
    return simulateTranslation(text, targetLang);
  } catch (err) {
    console.warn("Translation edge function failed, using fallback.", err);
    return simulateTranslation(text, targetLang);
  }
}

/**
 * 캐시 초기화 (언어 변경 시 호출)
 */
export function clearTranslateCache(): void {
  _translateCache.clear();
}

/**
 * 텍스트 내용 기반 소스 언어 간단 추론 (MyMemory auto 미지원 대응)
 */
function guessSourceLang(text: string): string {
  if (/[\uAC00-\uD7A3]/.test(text)) return "ko";
  if (/[\u3040-\u30FF\u31F0-\u31FF]/.test(text)) return "ja";
  if (/[\u4E00-\u9FFF]/.test(text)) return "zh";
  if (/[\u0E00-\u0E7F]/.test(text)) return "th";
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  return "en";
}

/**
 * 무료 번역 API 사용 (fallback) — MyMemory는 auto 소스 미지원이므로 자동 감지
 */
async function simulateTranslation(text: string, targetLang: SupportedLang): Promise<string> {
  try {
    const src = guessSourceLang(text);
    // 소스 == 타겟이면 번역 불필요
    if (src === targetLang) return text;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${src}|${targetLang}`;
    const res = await fetch(url);
    if (!res.ok) return text;
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    if (!translated || translated === text) return text;
    const txt = document.createElement('textarea');
    txt.innerHTML = translated;
    return txt.value;
  } catch {
    return text;
  }
}

/**
 * 언어 자동 감지
 */
export async function detectLanguage(text: string): Promise<SupportedLang> {
  if (!text.trim()) return "en";
  try {
    const data = await fetchFromEdgeFunction("detect-language", { text });
    if (data.success && data.detected) {
      const code = data.detected.toLowerCase();
      return (code in LANG_NAMES ? code : "en") as SupportedLang;
    }
  } catch (err) {
    console.warn("Language detection edge function failed", err);
  }
  return /[\uAC00-\uD7A3]/.test(text) ? "ko" : "en";
}

export { LANG_NAMES };