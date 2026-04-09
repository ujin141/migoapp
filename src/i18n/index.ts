import i18n from "i18next";
import { FILTER_LOCALES } from "./filterLocales";
import { CHECKIN_LOCALES } from "./checkinLocales";
import { TIER_LOCALES } from "./tierLocales";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import resourcesToBackend from "i18next-resources-to-backend";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .use(
    resourcesToBackend(async (language: string, namespace: string) => {
      // json 파일을 동적으로 import (vite의 import() 사용 시 빌드타임에서 파일을 자동으로 분할합니다)
      const res = await import(`./locales/${language}.ts`);
      
      // Filter, Checkin, Tier locales are locally managed and small
      // We can directly mix them here.
      const FILTER = (FILTER_LOCALES as any)[language] || {};
      const CHECKIN = (CHECKIN_LOCALES as any)[language] || {};
      const TIER = (TIER_LOCALES as any)[language] || {};
      
      return { ...res.default, ...FILTER, ...CHECKIN, ...TIER };
    })
  )
  .init({
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "migo-lang",
      convertDetectedLanguage: (lng: string) => {
        const map: Record<string, string> = {
          zh: "zh", ko: "ko", ja: "ja", es: "es", fr: "fr", de: "de",
          pt: "pt", id: "id", vi: "vi", th: "th", ar: "ar", hi: "hi",
          ru: "ru", tr: "tr", it: "it", nl: "nl", pl: "pl", sv: "sv",
          da: "da", no: "no", fi: "fi", cs: "cs", ro: "ro", hu: "hu",
          el: "el", bg: "bg", uk: "uk", he: "he", bn: "bn", ta: "ta",
          te: "te", kn: "kn", ml: "ml", gu: "gu", mr: "mr", pa: "pa",
          fa: "fa", ur: "ur", sw: "sw", zu: "zu", ca: "ca", hr: "hr",
          sk: "sk", sl: "sl", lv: "lv", lt: "lt", et: "et", is: "is",
          en: "en",
        };
        const prefix = lng.split("-")[0].toLowerCase();
        return map[prefix] ?? "en";
      },
    },
    supportedLngs: [
      "ko", "en", "ja", "zh", "es", "fr", "de", "pt", "id", "vi", "th",
      "ar", "hi", "ru", "tr", "it", "nl", "pl", "sv", "da", "no", "fi",
      "cs", "ro", "hu", "el", "bg", "uk", "he", "bn", "ta", "te", "kn",
      "ml", "gu", "mr", "pa", "fa", "ur", "sw", "zu", "ca", "hr", "sk",
      "sl", "lv", "lt", "et", "is",
    ],
    nonExplicitSupportedLngs: true,
  });

export const LANGUAGES = [
  { code: "ko", label: "한국어",      flag: "🇰🇷" },
  { code: "en", label: "English",     flag: "🇺🇸" },
  { code: "ja", label: "日本語",      flag: "🇯🇵" },
  { code: "zh", label: "中文",        flag: "🇨🇳" },
  { code: "es", label: "Español",     flag: "🇪🇸" },
  { code: "fr", label: "Français",    flag: "🇫🇷" },
  { code: "de", label: "Deutsch",     flag: "🇩🇪" },
  { code: "pt", label: "Português",   flag: "🇧🇷" },
  { code: "id", label: "Indonesia",   flag: "🇮🇩" },
  { code: "vi", label: "Tiếng Việt",  flag: "🇻🇳" },
  { code: "th", label: "ภาษาไทย",    flag: "🇹🇭" },
  { code: "ar", label: "العربية",     flag: "🇸🇦" },
  { code: "hi", label: "हिन्दी",     flag: "🇮🇳" },
  { code: "ru", label: "Русский",     flag: "🇷🇺" },
  { code: "tr", label: "Türkçe",      flag: "🇹🇷" },
  { code: "it", label: "Italiano",    flag: "🇮🇹" },
  { code: "nl", label: "Nederlands",  flag: "🇳🇱" },
  { code: "pl", label: "Polski",      flag: "🇵🇱" },
  { code: "sv", label: "Svenska",     flag: "🇸🇪" },
  { code: "da", label: "Dansk",       flag: "🇩🇰" },
  { code: "no", label: "Norsk",       flag: "🇳🇴" },
  { code: "fi", label: "Suomi",       flag: "🇫🇮" },
  { code: "cs", label: "Čeština",     flag: "🇨🇿" },
  { code: "ro", label: "Română",      flag: "🇷🇴" },
  { code: "hu", label: "Magyar",      flag: "🇭🇺" },
  { code: "el", label: "Ελληνικά",   flag: "🇬🇷" },
  { code: "bg", label: "Български",  flag: "🇧🇬" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "he", label: "עברית",       flag: "🇮🇱" },
  { code: "bn", label: "বাংলা",       flag: "🇧🇩" },
  { code: "ta", label: "தமிழ்",      flag: "🇮🇳" },
  { code: "te", label: "తెలుగు",      flag: "🇮🇳" },
  { code: "kn", label: "ಕನ್ನಡ",      flag: "🇮🇳" },
  { code: "ml", label: "മലയാളം",     flag: "🇮🇳" },
  { code: "gu", label: "ગુજરાતી",    flag: "🇮🇳" },
  { code: "mr", label: "मराठी",      flag: "🇮🇳" },
  { code: "pa", label: "ਪੰਜਾਬੀ",     flag: "🇮🇳" },
  { code: "fa", label: "فارسی",       flag: "🇮🇷" },
  { code: "ur", label: "اردو",        flag: "🇵🇰" },
  { code: "sw", label: "Kiswahili",   flag: "🇰🇪" },
  { code: "zu", label: "isiZulu",     flag: "🇿🇦" },
  { code: "ca", label: "Català",      flag: "🏳️" },
  { code: "hr", label: "Hrvatski",    flag: "🇭🇷" },
  { code: "sk", label: "Slovenčina",  flag: "🇸🇰" },
  { code: "sl", label: "Slovenščina", flag: "🇸🇮" },
  { code: "lv", label: "Latviešu",    flag: "🇱🇻" },
  { code: "lt", label: "Lietuvių",    flag: "🇱🇹" },
  { code: "et", label: "Eesti",       flag: "🇪🇪" },
  { code: "is", label: "Íslenska",    flag: "🇮🇸" },
];

export default i18n;
