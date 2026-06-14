import i18n from "@/i18n";
import { supabase } from "@/lib/supabaseClient";

// ── 번역 결과 메모리 캐시 (트래픽 + API 비용 절감) ───────────────
// key: `${text}:${targetLang}`, value: 번역 결과
const _translateCache = new Map<string, string>();
const MAX_CACHE_SIZE = 500; // 최대 500개 캐싱 (메모리 관리)

// supabase.functions.invoke()를 사용:
//  - 인증 헤더(Authorization) 자동 첨부 (anon key + 세션 토큰)
//  - CORS preflight를 SDK가 처리하므로 localhost에서도 동작
async function fetchFromEdgeFunction(action: string, payload: Record<string, any>): Promise<any> {
  const { data, error } = await supabase.functions.invoke("clever-api", {
    body: { action, ...payload },
  });
  if (error) throw error;
  return data;
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
    // 안전한 HTML 엔티티 디코딩 (textarea.innerHTML XSS 취약점 패치)
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(translated, 'text/html');
      return doc.body.textContent || translated;
    } catch {
      return translated;
    }
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

// --- Profile Data Translation Mapping (Multilingual compatibility) ---

const NORMALIZE_LANG_MAP: Record<string, string> = {
  // Korean
  "한국어": "korean", "영어": "english", "일본어": "japanese", "중국어": "chinese", "스페인어": "spanish",
  "프랑스어": "french", "독일어": "german", "아랍어": "arabic", "러시아어": "russian", "포르투갈어": "portuguese",
  "힌디어": "hindi", "베트남어": "vietnamese", "태국어": "thai", "인도네시아어": "indonesian", "이탈리아어": "italian",
  "터키어": "turkish", "네덜란드어": "dutch", "폴란드어": "polish", "말레이어": "malay", "스웨덴어": "swedish",
  // English
  "korean": "korean", "english": "english", "japanese": "japanese", "chinese": "chinese", "spanish": "spanish",
  "french": "french", "german": "german", "arabic": "arabic", "russian": "russian", "portuguese": "portuguese",
  "hindi": "hindi", "vietnamese": "vietnamese", "thai": "thai", "indonesian": "indonesian", "italian": "italian",
  "italiano": "italian", "turkish": "turkish", "dutch": "dutch", "polish": "polish", "malay": "malay", "swedish": "swedish",
  // Japanese
  "韓国語": "korean", "英語": "english", "日本語": "japanese", "中国語": "chinese", "スペイン語": "spanish",
  "フランス語": "french", "ドイツ語": "german", "アラビア語": "arabic", "ロシア語": "russian", "ポルトガル語": "portuguese",
  "ヒンディー語": "hindi", "ベトナム語": "vietnamese", "タイ語": "thai", "インドネシア語": "indonesian", "イタリア語": "italian",
  "トルコ語": "turkish", "オランダ語": "dutch", "ポーランド語": "polish", "マレー語": "malay", "スウェーデン語": "swedish",
  // Chinese
  "韩语": "korean", "英语": "english", "日语": "japanese", "中文": "chinese", "西班牙语": "spanish",
  "法语": "french", "德语": "german", "阿拉伯语": "arabic", "俄语": "russian", "葡萄牙语": "portuguese",
  "印地语": "hindi", "越南语": "vietnamese", "泰语": "thai", "印尼语": "indonesian", "意大利语": "italian",
  "土耳其语": "turkish", "荷兰语": "dutch", "波兰语": "polish", "马来语": "malay", "瑞典语": "swedish"
};

const LOCALIZED_LANGS: Record<string, Record<string, string>> = {
  ko: {
    korean: "한국어", english: "영어", japanese: "일본어", chinese: "중국어", spanish: "스페인어",
    french: "프랑스어", german: "독일어", arabic: "아랍어", russian: "러시아어", portuguese: "포르투갈어",
    hindi: "힌디어", vietnamese: "베트남어", thai: "태국어", indonesian: "인도네시아어", italian: "이탈리아어",
    turkish: "터키어", dutch: "네덜란드어", polish: "폴란드어", malay: "말레이어", swedish: "스웨덴어"
  },
  en: {
    korean: "Korean", english: "English", japanese: "Japanese", chinese: "Chinese", spanish: "Spanish",
    french: "French", german: "German", arabic: "Arabic", russian: "Russian", portuguese: "Portuguese",
    hindi: "Hindi", vietnamese: "Vietnamese", thai: "Thai", indonesian: "Indonesian", italian: "Italian",
    turkish: "Turkish", dutch: "Dutch", polish: "Polish", malay: "Malay", swedish: "Swedish"
  },
  ja: {
    korean: "韓国語", english: "英語", japanese: "日本語", chinese: "中国語", spanish: "スペイン語",
    french: "フランス語", german: "ドイツ語", arabic: "アラビア語", russian: "ロシア語", portuguese: "ポルトガル語",
    hindi: "ヒンディー語", vietnamese: "ベトナム語", thai: "タイ語", indonesian: "インドネシア語", italian: "イタリア語",
    turkish: "トルコ語", dutch: "オランダ語", polish: "ポーランド語", malay: "マレー語", swedish: "スウェーデン語"
  },
  zh: {
    korean: "韩语", english: "英语", japanese: "日语", chinese: "中文", spanish: "西班牙语",
    french: "法语", german: "德语", arabic: "阿拉伯语", russian: "俄语", portuguese: "葡萄牙语",
    hindi: "印地语", vietnamese: "越南语", thai: "泰语", indonesian: "印尼语", italian: "意大利语",
    turkish: "土耳其语", dutch: "荷兰语", polish: "波兰语", malay: "马来语", swedish: "瑞典语"
  }
};

const NORMALIZE_STYLE_MAP: Record<string, string> = {
  // Korean
  "배낭여행": "backpacking", "배낭여행 🎒": "backpacking",
  "럭셔리": "luxury", "럭셔리 ✈️": "luxury",
  "자연트레킹": "trekking", "자연/트레킹": "trekking", "자연/트레킹 🏔️": "trekking",
  "맛집탐방": "gourmet", "맛집투어": "gourmet", "맛집탐방 🍜": "gourmet",
  "문화역사": "culture", "문화/역사": "culture", "문화/역사 🏛️": "culture",
  "휴양/호캉스": "recreation", "해변/휴양": "recreation", "호캉스": "recreation", "해변/휴양 🏖️": "recreation",
  "사진촬영": "photography", "사진여행": "photography", "사진촬영 📸": "photography", "사진": "photography",
  "나이트라이프": "nightlife", "나이트라이프 🌙": "nightlife",
  "쇼핑": "shopping", "쇼핑 🛍️": "shopping",
  "요가/힐링": "healing", "힐링/요가": "healing", "힐링/요가 🧘": "healing",
  "현지체험": "experience", "로컬체험": "experience", "로컬체험 🎭": "experience",
  "로드트립": "roadtrip", "드라이브": "roadtrip", "드라이브 🚗": "roadtrip",
  // English
  "backpacking trip": "backpacking", "backpacking": "backpacking", "backpacking 🎒": "backpacking",
  "luxury ✈️": "luxury", "luxury": "luxury",
  "nature trekking": "trekking", "nature/trekking": "trekking", "nature/trekking 🏔️": "trekking",
  "restaurant tour": "gourmet", "restaurant tour 🍜": "gourmet", "gourmet tour": "gourmet",
  "cultural history": "culture", "culture/history": "culture", "culture/history 🏛️": "culture",
  "recreation/hocance": "recreation", "beach/recreational": "recreation", "beach/recreational 🏖️": "recreation", "hocation": "recreation",
  "photo shoot": "photography", "take a photo": "photography", "take a photo 📸": "photography",
  "nightlife 🌙": "nightlife",
  "shopping 🛍️": "shopping",
  "yoga/healing": "healing", "healing/yoga": "healing", "healing/yoga 🧘": "healing",
  "local experience": "experience", "local experience 🎭": "experience",
  "road trip": "roadtrip", "drive": "roadtrip", "drive 🚗": "roadtrip"
};

const LOCALIZED_STYLES: Record<string, Record<string, string>> = {
  ko: {
    backpacking: "배낭여행 🎒", luxury: "럭셔리 ✈️", trekking: "자연/트레킹 🏔️", gourmet: "맛집탐방 🍜",
    culture: "문화/역사 🏛️", recreation: "해변/휴양 🏖️", photography: "사진촬영 📸", nightlife: "나이트라이프 🌙",
    shopping: "쇼핑 🛍️", healing: "힐링/요가 🧘", experience: "로컬체험 🎭", roadtrip: "드라이브 🚗"
  },
  en: {
    backpacking: "Backpacking 🎒", luxury: "Luxury ✈️", trekking: "Nature/Trekking 🏔️", gourmet: "Gourmet tour 🍜",
    culture: "Culture/History 🏛️", recreation: "Beach/Recreational 🏖️", photography: "Photography 📸", nightlife: "Nightlife 🌙",
    shopping: "Shopping 🛍️", healing: "Healing/Yoga 🧘", experience: "Local experience 🎭", roadtrip: "Drive 🚗"
  },
  ja: {
    backpacking: "バックパック 🎒", luxury: "ラグジュアリー ✈️", trekking: "自然/トレッキング 🏔️", gourmet: "グルメ巡り 🍜",
    culture: "文化/歴史 🏛️", recreation: "ビーチ/リゾート 🏖️", photography: "写真撮影 📸", nightlife: "ナイトライフ 🌙",
    shopping: "ショッピング 🛍️", healing: "ヒーリング/ヨガ 🧘", experience: "現地体験 🎭", roadtrip: "ドライブ 🚗"
  },
  zh: {
    backpacking: "背包客 🎒", luxury: "奢华旅行 ✈️", trekking: "徒步/自然 🏔️", gourmet: "美食寻访 🍜",
    culture: "文化/历史 🏛️", recreation: "海滩/度假 🏖️", photography: "拍照摄影 📸", nightlife: "夜生活 🌙",
    shopping: "购物 🛍️", healing: "疗愈/瑜伽 🧘", experience: "当地体验 🎭", roadtrip: "自驾 🚗"
  }
};

const NORMALIZE_NATION_MAP: Record<string, string> = {
  // Korea
  "대한민국": "korea", "대한민국 (🇰🇷)": "korea", "한국": "korea", "한국 (🇰🇷)": "korea", "south korea": "korea", "south korea (🇰🇷)": "korea", "korea": "korea", "韓国（🇰🇷）": "korea", "韩国 (🇨🇳)": "korea", "韩国 (🇰🇷)": "korea", "韩国": "korea",
  // USA
  "미국": "usa", "미국 (🇺🇸)": "usa", "usa": "usa", "usa (🇺🇸)": "usa", "united states": "usa", "united states (🇺🇸)": "usa", "米国": "usa",
  // Japan
  "일본": "japan", "일본 (🇯🇵)": "japan", "japan": "japan", "japan (🇯🇵)": "japan", "日本": "japan",
  // China
  "중국": "china", "중국 (🇨🇳)": "china", "china": "china", "china (🇨🇳)": "china", "中国": "china",
  // UK
  "영국": "uk", "영국 (🇬🇧)": "uk", "uk": "uk", "uk (🇬🇧)": "uk", "united kingdom": "uk", "united kingdom (🇬🇧)": "uk",
  // Australia
  "호주": "australia", "호주 (🇦🇺)": "australia", "australia": "australia", "australia (🇦🇺)": "australia", "오스트레일리아": "australia", "豪州": "australia",
  // Canada
  "캐나다": "canada", "캐나다 (🇨🇦)": "canada", "canada": "canada", "canada (🇨🇦)": "canada"
};

const LOCALIZED_NATIONS: Record<string, Record<string, string>> = {
  ko: {
    korea: "대한민국 (🇰🇷)", usa: "미국 (🇺🇸)", japan: "일본 (🇯🇵)", china: "중국 (🇨🇳)", uk: "영국 (🇬🇧)", australia: "호주 (🇦🇺)", canada: "캐나다 (🇨🇦)"
  },
  en: {
    korea: "South Korea (🇰🇷)", usa: "United States (🇺🇸)", japan: "Japan (🇯🇵)", china: "China (🇨🇳)", uk: "United Kingdom (🇬🇧)", australia: "Australia (🇦🇺)", canada: "Canada (🇨🇦)"
  },
  ja: {
    korea: "韓国 (🇰🇷)", usa: "米国 (🇺🇸)", japan: "日本 (🇯🇵)", china: "中国 (🇨🇳)", uk: "英国 (🇬🇧)", australia: "豪州 (🇦🇺)", canada: "カナダ (🇨🇦)"
  },
  zh: {
    korea: "韩国 (🇰🇷)", usa: "美国 (🇺🇸)", japan: "日本 (🇯🇵)", china: "中国 (🇨🇳)", uk: "英国 (🇬🇧)", australia: "澳大利亚 (🇦🇺)", canada: "加拿大 (🇨🇦)"
  }
};

export function translateLanguage(lang: string, locale: string): string {
  if (!lang) return "";
  const cleaned = lang.trim();
  const lower = cleaned.toLowerCase();
  const key = NORMALIZE_LANG_MAP[cleaned] || NORMALIZE_LANG_MAP[lower];
  if (key) {
    const loc = (locale || "en").substring(0, 2).toLowerCase();
    const localeMap = LOCALIZED_LANGS[loc] || LOCALIZED_LANGS["en"];
    return localeMap[key] || cleaned;
  }
  return cleaned;
}

export function translateTravelStyle(style: string, locale: string): string {
  if (!style) return "";
  const cleaned = style.trim();
  const lower = cleaned.toLowerCase();
  const key = NORMALIZE_STYLE_MAP[cleaned] || NORMALIZE_STYLE_MAP[lower];
  if (key) {
    const loc = (locale || "en").substring(0, 2).toLowerCase();
    const localeMap = LOCALIZED_STYLES[loc] || LOCALIZED_STYLES["en"];
    return localeMap[key] || cleaned;
  }
  return cleaned;
}

export function translateNationality(nation: string, locale: string): string {
  if (!nation) return "";
  const cleaned = nation.trim();
  const lower = cleaned.toLowerCase();
  const key = NORMALIZE_NATION_MAP[cleaned] || NORMALIZE_NATION_MAP[lower];
  if (key) {
    const loc = (locale || "en").substring(0, 2).toLowerCase();
    const localeMap = LOCALIZED_NATIONS[loc] || LOCALIZED_NATIONS["en"];
    return localeMap[key] || cleaned;
  }
  return cleaned;
}