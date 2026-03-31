import i18n from "i18next";
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
      ko: { translation: ko },
      en: { translation: en },
      ja: { translation: ja },
      zh: { translation: zh },
      es: { translation: es },
      fr: { translation: fr },
      de: { translation: de },
      pt: { translation: pt },
      id: { translation: id },
      vi: { translation: vi },
      th: { translation: th },
      ar: { translation: ar },
      hi: { translation: hi },
      ru: { translation: ru },
      tr: { translation: tr },
      it: { translation: it },
      nl: { translation: nl },
      pl: { translation: pl },
      sv: { translation: sv },
      da: { translation: da },
      no: { translation: no },
      fi: { translation: fi },
      cs: { translation: cs },
      ro: { translation: ro },
      hu: { translation: hu },
      el: { translation: el },
      bg: { translation: bg },
      uk: { translation: uk },
      he: { translation: he },
      bn: { translation: bn },
      ta: { translation: ta },
      te: { translation: te },
      kn: { translation: kn },
      ml: { translation: ml },
      gu: { translation: gu },
      mr: { translation: mr },
      pa: { translation: pa },
      fa: { translation: fa },
      ur: { translation: ur },
      sw: { translation: sw },
      zu: { translation: zu },
      ca: { translation: ca },
      hr: { translation: hr },
      sk: { translation: sk },
      sl: { translation: sl },
      lv: { translation: lv },
      lt: { translation: lt },
      et: { translation: et },
      is: { translation: is },
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
