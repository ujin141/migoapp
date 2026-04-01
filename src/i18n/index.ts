import i18n from "i18next";
import { FILTER_LOCALES } from "./filterLocales";
import { CHECKIN_LOCALES } from "./checkinLocales";
import { TIER_LOCALES } from "./tierLocales";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ko from "./locales/ko";
import en from "./locales/en";
import ja from "./locales/ja";
import zh from "./locales/zh";
import es from "./locales/es";
import fr from "./locales/fr";
import de from "./locales/de";
import pt from "./locales/pt";
import id from "./locales/id";
import vi from "./locales/vi";
import th from "./locales/th";
import ar from "./locales/ar";
import hi from "./locales/hi";
import ru from "./locales/ru";
import tr from "./locales/tr";
import it from "./locales/it";
import nl from "./locales/nl";
import pl from "./locales/pl";
import sv from "./locales/sv";
import da from "./locales/da";
import no from "./locales/no";
import fi from "./locales/fi";
import cs from "./locales/cs";
import ro from "./locales/ro";
import hu from "./locales/hu";
import el from "./locales/el";
import bg from "./locales/bg";
import uk from "./locales/uk";
import he from "./locales/he";
import bn from "./locales/bn";
import ta from "./locales/ta";
import te from "./locales/te";
import kn from "./locales/kn";
import ml from "./locales/ml";
import gu from "./locales/gu";
import mr from "./locales/mr";
import pa from "./locales/pa";
import fa from "./locales/fa";
import ur from "./locales/ur";
import sw from "./locales/sw";
import zu from "./locales/zu";
import ca from "./locales/ca";
import hr from "./locales/hr";
import sk from "./locales/sk";
import sl from "./locales/sl";
import lv from "./locales/lv";
import lt from "./locales/lt";
import et from "./locales/et";
import is from "./locales/is";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ko: { translation: { ...ko, ...FILTER_LOCALES.ko, ...CHECKIN_LOCALES.ko, ...TIER_LOCALES.ko } },
      en: { translation: { ...en, ...FILTER_LOCALES.en, ...CHECKIN_LOCALES.en, ...TIER_LOCALES.en } },
      ja: { translation: { ...ja, ...FILTER_LOCALES.ja, ...CHECKIN_LOCALES.ja, ...TIER_LOCALES.ja } },
      zh: { translation: { ...zh, ...FILTER_LOCALES.zh, ...CHECKIN_LOCALES.zh, ...TIER_LOCALES.zh } },
      es: { translation: { ...es, ...FILTER_LOCALES.es, ...CHECKIN_LOCALES.es, ...TIER_LOCALES.es } },
      fr: { translation: { ...fr, ...FILTER_LOCALES.fr, ...CHECKIN_LOCALES.fr, ...TIER_LOCALES.fr } },
      de: { translation: { ...de, ...FILTER_LOCALES.de, ...CHECKIN_LOCALES.de, ...TIER_LOCALES.de } },
      pt: { translation: { ...pt, ...FILTER_LOCALES.pt, ...CHECKIN_LOCALES.pt, ...TIER_LOCALES.pt } },
      id: { translation: { ...id, ...FILTER_LOCALES.id, ...CHECKIN_LOCALES.id, ...TIER_LOCALES.id } },
      vi: { translation: { ...vi, ...FILTER_LOCALES.vi, ...CHECKIN_LOCALES.vi, ...TIER_LOCALES.vi } },
      th: { translation: { ...th, ...FILTER_LOCALES.th, ...CHECKIN_LOCALES.th, ...TIER_LOCALES.th } },
      ar: { translation: { ...ar, ...FILTER_LOCALES.ar, ...CHECKIN_LOCALES.ar, ...TIER_LOCALES.ar } },
      hi: { translation: { ...hi, ...FILTER_LOCALES.hi, ...CHECKIN_LOCALES.hi, ...TIER_LOCALES.hi } },
      ru: { translation: { ...ru, ...FILTER_LOCALES.ru, ...CHECKIN_LOCALES.ru, ...TIER_LOCALES.ru } },
      tr: { translation: { ...tr, ...FILTER_LOCALES.tr, ...CHECKIN_LOCALES.tr, ...TIER_LOCALES.tr } },
      it: { translation: { ...it, ...FILTER_LOCALES.it, ...CHECKIN_LOCALES.it, ...TIER_LOCALES.it } },
      nl: { translation: { ...nl, ...FILTER_LOCALES.nl, ...CHECKIN_LOCALES.nl, ...TIER_LOCALES.nl } },
      pl: { translation: { ...pl, ...FILTER_LOCALES.pl, ...CHECKIN_LOCALES.pl, ...TIER_LOCALES.pl } },
      sv: { translation: { ...sv, ...FILTER_LOCALES.sv, ...CHECKIN_LOCALES.sv, ...TIER_LOCALES.sv } },
      da: { translation: { ...da, ...FILTER_LOCALES.da, ...CHECKIN_LOCALES.da, ...TIER_LOCALES.da } },
      no: { translation: { ...no, ...FILTER_LOCALES.no, ...CHECKIN_LOCALES.no, ...TIER_LOCALES.no } },
      fi: { translation: { ...fi, ...FILTER_LOCALES.fi, ...CHECKIN_LOCALES.fi, ...TIER_LOCALES.fi } },
      cs: { translation: { ...cs, ...FILTER_LOCALES.cs, ...CHECKIN_LOCALES.cs, ...TIER_LOCALES.cs } },
      ro: { translation: { ...ro, ...FILTER_LOCALES.ro, ...CHECKIN_LOCALES.ro, ...TIER_LOCALES.ro } },
      hu: { translation: { ...hu, ...FILTER_LOCALES.hu, ...CHECKIN_LOCALES.hu, ...TIER_LOCALES.hu } },
      el: { translation: { ...el, ...FILTER_LOCALES.el, ...CHECKIN_LOCALES.el, ...TIER_LOCALES.el } },
      bg: { translation: { ...bg, ...FILTER_LOCALES.bg, ...CHECKIN_LOCALES.bg, ...TIER_LOCALES.bg } },
      uk: { translation: { ...uk, ...FILTER_LOCALES.uk, ...CHECKIN_LOCALES.uk, ...TIER_LOCALES.uk } },
      he: { translation: { ...he, ...FILTER_LOCALES.he, ...CHECKIN_LOCALES.he, ...TIER_LOCALES.he } },
      bn: { translation: { ...bn, ...FILTER_LOCALES.bn, ...CHECKIN_LOCALES.bn, ...TIER_LOCALES.bn } },
      ta: { translation: { ...ta, ...FILTER_LOCALES.ta, ...CHECKIN_LOCALES.ta, ...TIER_LOCALES.ta } },
      te: { translation: { ...te, ...FILTER_LOCALES.te, ...CHECKIN_LOCALES.te, ...TIER_LOCALES.te } },
      kn: { translation: { ...kn, ...FILTER_LOCALES.kn, ...CHECKIN_LOCALES.kn, ...TIER_LOCALES.kn } },
      ml: { translation: { ...ml, ...FILTER_LOCALES.ml, ...CHECKIN_LOCALES.ml, ...TIER_LOCALES.ml } },
      gu: { translation: { ...gu, ...FILTER_LOCALES.gu, ...CHECKIN_LOCALES.gu, ...TIER_LOCALES.gu } },
      mr: { translation: { ...mr, ...FILTER_LOCALES.mr, ...CHECKIN_LOCALES.mr, ...TIER_LOCALES.mr } },
      pa: { translation: { ...pa, ...FILTER_LOCALES.pa, ...CHECKIN_LOCALES.pa, ...TIER_LOCALES.pa } },
      fa: { translation: { ...fa, ...FILTER_LOCALES.fa, ...CHECKIN_LOCALES.fa, ...TIER_LOCALES.fa } },
      ur: { translation: { ...ur, ...FILTER_LOCALES.ur, ...CHECKIN_LOCALES.ur, ...TIER_LOCALES.ur } },
      sw: { translation: { ...sw, ...FILTER_LOCALES.sw, ...CHECKIN_LOCALES.sw, ...TIER_LOCALES.sw } },
      zu: { translation: { ...zu, ...FILTER_LOCALES.zu, ...CHECKIN_LOCALES.zu, ...TIER_LOCALES.zu } },
      ca: { translation: { ...ca, ...FILTER_LOCALES.ca, ...CHECKIN_LOCALES.ca, ...TIER_LOCALES.ca } },
      hr: { translation: { ...hr, ...FILTER_LOCALES.hr, ...CHECKIN_LOCALES.hr, ...TIER_LOCALES.hr } },
      sk: { translation: { ...sk, ...FILTER_LOCALES.sk, ...CHECKIN_LOCALES.sk, ...TIER_LOCALES.sk } },
      sl: { translation: { ...sl, ...FILTER_LOCALES.sl, ...CHECKIN_LOCALES.sl, ...TIER_LOCALES.sl } },
      lv: { translation: { ...lv, ...FILTER_LOCALES.lv, ...CHECKIN_LOCALES.lv, ...TIER_LOCALES.lv } },
      lt: { translation: { ...lt, ...FILTER_LOCALES.lt, ...CHECKIN_LOCALES.lt, ...TIER_LOCALES.lt } },
      et: { translation: { ...et, ...FILTER_LOCALES.et, ...CHECKIN_LOCALES.et, ...TIER_LOCALES.et } },
      is: { translation: { ...is, ...FILTER_LOCALES.is, ...CHECKIN_LOCALES.is, ...TIER_LOCALES.is } },
    },
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: {
      order: ["navigator", "htmlTag", "localStorage"],
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
