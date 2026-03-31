// MyMemory 무료 번역 API (API키 불필요, 1일 1000 words/IP)
const cache = new Map<string, string>();

export async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text.trim()) return text;
  const key = `${targetLang}:${text}`;
  if (cache.has(key)) return cache.get(key)!;

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${targetLang}`;
    const res = await fetch(url);
    const data = await res.json();
    const translated = data?.responseData?.translatedText ?? text;
    cache.set(key, translated);
    return translated;
  } catch {
    return text;
  }
}
