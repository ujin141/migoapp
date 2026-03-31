/**
 * fix_match_empty_state.mjs
 * Updates j500-j509, empty, emptyDesc, emptyBtn keys in ALL locale files
 * with native language translations.
 */
import fs from 'fs';
import path from 'path';

const LOCALES_DIR = './src/i18n/locales';

// Key translations for Match Page empty state and swipe UI
const TRANSLATIONS = {
  // Match page empty state
  "j502": {
    en: "You've seen all nearby travelers!",
    ja: "周辺の旅行者を全員確認しました！",
    zh: "您已查看所有附近旅行者！",
    es: "¡Ya has visto a todos los viajeros cercanos!",
    fr: "Vous avez vu tous les voyageurs proches!",
    de: "Du hast alle Reisenden in der Nähe gesehen!",
    pt: "Você viu todos os viajantes próximos!",
    id: "Kamu sudah melihat semua wisatawan terdekat!",
    vi: "Bạn đã xem tất cả du khách gần đây!",
    th: "คุณได้ดูนักเดินทางทั้งหมดในบริเวณนี้แล้ว!",
    ar: "لقد رأيت جميع المسافرين القريبين!",
    hi: "आपने आसपास के सभी यात्री देख लिए!",
    ru: "Вы просмотрели всех путешественников рядом!",
    tr: "Yakındaki tüm gezginleri gördünüz!",
    it: "Hai visto tutti i viaggiatori vicini!",
    nl: "Je hebt alle reizigers in de buurt gezien!",
    pl: "Widziałeś już wszystkich podróżników w pobliżu!",
    sv: "Du har sett alla resenärer i närheten!",
    da: "Du har set alle rejsende i nærheden!",
    no: "Du har sett alle reisende i nærheten!",
    fi: "Olet nähnyt kaikki lähellä olevat matkustajat!",
    cs: "Viděli jste všechny cestovatele v okolí!",
    ro: "Ai văzut toți călătorii din apropiere!",
    hu: "Láttad az összes közeli utazót!",
    el: "Είδατε όλους τους κοντινούς ταξιδιώτες!",
    bg: "Видяхте всички пътници наоколо!",
    uk: "Ви переглянули всіх мандрівників поруч!",
    he: "ראית את כל המטיילים הקרובים!",
    bn: "আপনি কাছের সমস্ত ভ্রমণকারীদের দেখে ফেলেছেন!",
    ta: "அருகில் உள்ள அனைத்து பயணிகளையும் பார்த்துவிட்டீர்கள்!",
    te: "మీరు దగ్గరలోని అన్ని ప్రయాణికులను చూసారు!",
    kn: "ನೀವು ಹತ್ತಿರದ ಎಲ್ಲ ಪ್ರಯಾಣಿಕರನ್ನು ನೋಡಿದ್ದೀರಿ!",
    ml: "നിങ്ങൾ അടുത്തുള്ള എല്ലാ യാത്രക്കാരെയും കണ്ടു!",
    gu: "તમે નજીકના તમામ મુસાફરો જોઈ લીધા!",
    mr: "तुम्ही जवळच्या सर्व प्रवाशांना पाहिले!",
    pa: "ਤੁਸੀਂ ਨੇੜੇ ਦੇ ਸਾਰੇ ਯਾਤਰੀਆਂ ਨੂੰ ਦੇਖ ਲਿਆ!",
    fa: "شما همه مسافران نزدیک را دیدید!",
    ur: "آپ نے قریب کے تمام مسافر دیکھ لیے!",
    sw: "Umeona wasafiri wote wa karibu!",
    zu: "Ubabonile bonke abahambi abasondelene!",
    ca: "Ja has vist tots els viatgers propers!",
    hr: "Vidio si sve putnike u blizini!",
    sk: "Videli ste všetkých cestovateľov v okolí!",
    sl: "Videli ste vse popotnike v bližini!",
    lv: "Esat redzējis visus tuvumā esošos ceļotājus!",
    lt: "Matėte visus artimus keliautojus!",
    et: "Olete näinud kõiki lähedal olevaid reisijaid!",
    is: "Þú hefur séð alla ferðalanga í nágrenninu!"
  },
  "j503": {
    en: "New travelers will appear soon",
    ja: "まもなく新しい旅行者が現れます",
    zh: "很快将出现新的旅行者",
    es: "Nuevos viajeros aparecerán pronto",
    fr: "De nouveaux voyageurs apparaîtront bientôt",
    de: "Bald werden neue Reisende erscheinen",
    pt: "Novos viajantes aparecerão em breve",
    id: "Wisatawan baru akan segera muncul",
    vi: "Du khách mới sẽ sớm xuất hiện",
    th: "นักเดินทางใหม่จะปรากฏเร็วๆ นี้",
    ar: "سيظهر مسافرون جدد قريبًا",
    hi: "नए यात्री जल्द ही दिखाई देंगे",
    ru: "Скоро появятся новые путешественники",
    tr: "Yakında yeni gezginler görünecek",
    it: "Presto appariranno nuovi viaggiatori",
    nl: "Binnenkort verschijnen nieuwe reizigers",
    pl: "Wkrótce pojawią się nowi podróżnicy",
    sv: "Nya resenärer kommer snart att dyka upp",
    da: "Nye rejsende vil snart dukke op",
    no: "Nye reisende vil snart dukke opp",
    fi: "Uusia matkustajia ilmestyy pian",
    cs: "Brzy se objeví noví cestovatelé",
    ro: "Noi călători vor apărea în curând",
    hu: "Hamarosan új utazók jelennek meg",
    el: "Σύντομα θα εμφανιστούν νέοι ταξιδιώτες",
    bg: "Скоро ще се появят нови пътници",
    uk: "Незабаром з'являться нові мандрівники",
    he: "מטיילים חדשים יופיעו בקרוב",
    bn: "শীঘ্রই নতুন ভ্রমণকারীরা আসবে",
    ta: "விரைவில் புதிய பயணிகள் தோன்றுவார்கள்",
    te: "త్వరలో కొత్త ప్రయాణికులు కనిపిస్తారు",
    kn: "ಶೀಘ್ರದಲ್ಲೇ ಹೊಸ ಪ್ರಯಾಣಿಕರು ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತಾರೆ",
    ml: "ഉടൻ പുതിയ യാത്രക്കാർ ദൃശ്യമാകും",
    gu: "ટૂંક સમયમાં નવા મુસાફરો આવશે",
    mr: "लवकरच नवीन प्रवासी दिसतील",
    pa: "ਜਲਦੀ ਹੀ ਨਵੇਂ ਯਾਤਰੀ ਆਉਣਗੇ",
    fa: "به زودی مسافران جدید ظاهر خواهند شد",
    ur: "جلد ہی نئے مسافر آئیں گے",
    sw: "Wasafiri wapya wataonekana hivi karibuni",
    zu: "Abahambi abasha bazovela maduze",
    ca: "Aviat apareixeran nous viatgers",
    hr: "Uskoro će se pojaviti novi putnici",
    sk: "Čoskoro sa objavia noví cestovatelia",
    sl: "Kmalu se bodo pojavili novi popotniki",
    lv: "Drīz parādīsies jauni ceļotāji",
    lt: "Netrukus atsiras naujų keliautojų",
    et: "Peagi ilmuvad uued reisijad",
    is: "Nýir ferðalangar munu brátt birtast"
  },
  "j504": {
    en: "Try again after filter settings",
    ja: "フィルター設定後に再試行",
    zh: "设置筛选条件后重试",
    es: "Intentar de nuevo después de configurar filtros",
    fr: "Réessayer après configuration des filtres",
    de: "Nach dem Einstellen von Filtern erneut versuchen",
    pt: "Tente novamente após configurar filtros",
    id: "Coba lagi setelah pengaturan filter",
    vi: "Thử lại sau khi đặt bộ lọc",
    th: "ลองอีกครั้งหลังตั้งค่าตัวกรอง",
    ar: "حاول مجددًا بعد ضبط الفلاتر",
    hi: "फ़िल्टर सेटिंग के बाद पुनः प्रयास करें",
    ru: "Повторите попытку после настройки фильтров",
    tr: "Filtre ayarlarından sonra tekrar deneyin",
    it: "Riprova dopo aver impostato i filtri",
    nl: "Probeer opnieuw na filterinstellingen",
    pl: "Spróbuj ponownie po ustawieniu filtrów",
    sv: "Försök igen efter filterinställningar",
    da: "Prøv igen efter filterindstillinger",
    no: "Prøv igjen etter filterinnstillinger",
    fi: "Yritä uudelleen suodatinasetusten jälkeen",
    cs: "Zkuste to znovu po nastavení filtrů",
    ro: "Reîncercați după configurarea filtrelor",
    hu: "Próbálkozzon újra a szűrők beállítása után",
    el: "Δοκιμάστε ξανά μετά τη ρύθμιση φίλτρων",
    bg: "Опитайте отново след настройките на филтъра",
    uk: "Спробуйте ще раз після налаштування фільтрів",
    he: "נסה שוב לאחר הגדרות הסינון",
    bn: "ফিল্টার সেটিংসের পরে আবার চেষ্টা করুন",
    ta: "வடிகட்டி அமைப்புகளுக்குப் பிறகு மீண்டும் முயற்சிக்கவும்",
    ru: "Повторите после настройки фильтров"
  },
  "j505": {
    en: "You've completed today's free likes",
    ja: "今日の無料いいねを全て使い切りました",
    zh: "您已用完今天的免费喜欢次数",
    es: "Has completado los likes gratuitos de hoy",
    fr: "Vous avez utilisé tous vos likes gratuits du jour",
    de: "Sie haben alle kostenlosen Likes von heute genutzt",
    pt: "Você completou os likes gratuitos de hoje",
    id: "Kamu sudah menggunakan semua like gratis hari ini",
    vi: "Bạn đã dùng hết lượt thích miễn phí hôm nay",
    th: "คุณใช้ไลค์ฟรีวันนี้หมดแล้ว",
    ar: "لقد استخدمت جميع الإعجابات المجانية اليوم",
    hi: "आज के सभी मुफ़्त लाइक का इस्तेमाल हो गया",
    ru: "Вы использовали все бесплатные лайки сегодня",
    tr: "Bugünkü ücretsiz beğenilerinizi tükettiniz"
  },
  "j506": {
    en: "Upgrade to Plus for unlimited travel connections",
    ja: "Plusにアップグレードして無制限の旅行仲間を見つけよう",
    zh: "升级到Plus享受无限旅行连接",
    es: "Actualiza a Plus para conexiones de viaje ilimitadas",
    fr: "Passez à Plus pour des connections voyage illimitées",
    de: "Upgrade auf Plus für unbegrenzte Reiseverbindungen",
    pt: "Atualize para Plus para conexões de viagem ilimitadas",
    id: "Upgrade ke Plus untuk koneksi wisata tak terbatas",
    vi: "Nâng cấp lên Plus để có kết nối du lịch không giới hạn",
    th: "อัปเกรดเป็น Plus สำหรับการเชื่อมต่อการเดินทางไม่จำกัด",
    ar: "قم بالترقية إلى Plus لاتصالات سفر غير محدودة",
    hi: "असीमित यात्रा कनेक्शन के लिए Plus में अपग्रेड करें",
    ru: "Перейдите на Plus для неограниченных путешествий",
    tr: "Sınırsız seyahat bağlantıları için Plus'a geçin"
  },
  "j507": {
    en: "Travel Purpose",
    ja: "旅の目的",
    zh: "旅行目的",
    es: "Propósito del viaje",
    fr: "Objectif du voyage",
    de: "Reisezweck",
    pt: "Propósito da viagem",
    id: "Tujuan perjalanan",
    vi: "Mục đích chuyến đi",
    th: "วัตถุประสงค์การเดินทาง",
    ar: "الغرض من الرحلة",
    hi: "यात्रा का उद्देश्य",
    ru: "Цель путешествия",
    tr: "Seyahat amacı"
  },
  "j508": {
    en: " (optional)",
    ja: "（任意）",
    zh: "（可选）",
    es: " (opcional)",
    fr: " (optionnel)",
    de: " (optional)",
    pt: " (opcional)",
    id: " (opsional)",
    vi: " (tùy chọn)",
    th: " (ไม่บังคับ)",
    ar: " (اختياري)",
    hi: " (वैकल्पिक)",
    ru: " (необязательно)",
    tr: " (isteğe bağlı)"
  },
  "j509": {
    en: "Save and continue",
    ja: "保存して続ける",
    zh: "保存并继续",
    es: "Guardar y continuar",
    fr: "Enregistrer et continuer",
    de: "Speichern und weiter",
    pt: "Salvar e continuar",
    id: "Simpan dan lanjutkan",
    vi: "Lưu và tiếp tục",
    th: "บันทึกและดำเนินการต่อ",
    ar: "حفظ والمتابعة",
    hi: "सेव करें और जारी रखें",
    ru: "Сохранить и продолжить",
    tr: "Kaydet ve devam et"
  },
  // empty state keys (duplicate of j502/j503 but with different key names)
  "empty": {
    en: "You've seen all nearby travelers!",
    ja: "周辺の旅行者を全員確認しました！",
    zh: "您已查看所有附近旅行者！",
    es: "¡Ya has visto a todos los viajeros cercanos!",
    fr: "Vous avez vu tous les voyageurs proches!",
    de: "Du hast alle Reisenden in der Nähe gesehen!",
    pt: "Você viu todos os viajantes próximos!",
    id: "Kamu sudah melihat semua wisatawan terdekat!",
    vi: "Bạn đã xem tất cả du khách gần đây!",
    th: "คุณได้ดูนักเดินทางทั้งหมดในบริเวณนี้แล้ว!",
    ar: "لقد رأيت جميع المسافرين القريبين!",
    hi: "आपने आसपास के सभी यात्री देख लिए!",
    ru: "Вы просмотрели всех путешественников рядом!",
    tr: "Yakındaki tüm gezginleri gördünüz!"
  },
  "emptyDesc": {
    en: "New travelers will appear soon",
    ja: "まもなく新しい旅行者が現れます",
    zh: "很快将出现新的旅行者",
    es: "Nuevos viajeros aparecerán pronto",
    fr: "De nouveaux voyageurs apparaîtront bientôt",
    de: "Bald werden neue Reisende erscheinen",
    pt: "Novos viajantes aparecerão em breve",
    id: "Wisatawan baru akan segera muncul",
    vi: "Du khách mới sẽ sớm xuất hiện",
    th: "นักเดินทางใหม่จะปรากฏเร็วๆ นี้",
    ar: "سيظهر مسافرون جدد قريبًا",
    hi: "नए यात्री जल्द ही दिखाई देंगे",
    ru: "Скоро появятся новые путешественники",
    tr: "Yakında yeni gezginler görünecek"
  },
  "emptyBtn": {
    en: "Try again after filter settings",
    ja: "フィルター設定後に再試行",
    zh: "设置筛选条件后重试",
    es: "Intentar de nuevo tras filtros",
    fr: "Réessayer après le filtrage",
    de: "Nach Filtern erneut versuchen",
    pt: "Tente novamente após filtros",
    id: "Coba lagi setelah filter",
    vi: "Thử lại sau khi lọc",
    th: "ลองอีกครั้งหลังจากกรอง",
    ar: "حاول مجددًا بعد الفلاتر",
    hi: "फ़िल्टर के बाद पुनः प्रयास करें",
    ru: "Повторить после фильтров",
    tr: "Filtrelerden sonra tekrar deneyin"
  }
};

// Also update en.ts separately - it has Korean values for some keys
const EN_OVERRIDES = {
  "j500": "▶ Boost Active",
  "j501": "Like Limit Reached",
  "j502": "You've seen all nearby travelers!",
  "j503": "New travelers will appear soon",
  "j504": "Try again after filter settings",
  "j505": "You've completed today's free likes",
  "j506": "Upgrade to Plus for unlimited travel connections",
  "j507": "Travel Purpose",
  "j508": " (optional)",
  "j509": "Save and continue",
  "empty": "You've seen all nearby travelers!",
  "emptyDesc": "New travelers will appear soon",
  "emptyBtn": "Try again after filter settings"
};

const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.ts'));
let totalUpdated = 0;

for (const file of files) {
  const lang = file.replace('.ts', '');
  const fp = path.join(LOCALES_DIR, file);
  let lines = fs.readFileSync(fp, 'utf8').split('\n');
  let changed = false;

  // Determine the translation map to use
  const overrides = lang === 'en' ? EN_OVERRIDES : null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check each key
    for (const [key, translations] of Object.entries(TRANSLATIONS)) {
      const nativeVal = overrides ? overrides[key] : translations[lang];
      if (!nativeVal) continue;

      // Match the key in this line
      const keyPattern = `"${key}":`;
      if (line.includes(keyPattern) || line.includes(`"${key}" :`)) {
        // Replace value
        const newLine = line.replace(
          /("(?:[^"\\]|\\.)*")\s*:\s*"(?:[^"\\]|\\.)*"(,?)/,
          (_, k, comma) => `${k}: "${nativeVal.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"${comma}`
        );
        if (newLine !== line) {
          lines[i] = newLine;
          changed = true;
        }
      }
    }

    // Also handle en.ts specific overrides for keys not in TRANSLATIONS
    if (lang === 'en' && overrides) {
      for (const [key, val] of Object.entries(overrides)) {
        if (!TRANSLATIONS[key]) {
          const keyPattern = `"${key}":`;
          if (line.includes(keyPattern)) {
            const newLine = line.replace(
              /("(?:[^"\\]|\\.)*")\s*:\s*"(?:[^"\\]|\\.)*"(,?)/,
              (_, k, comma) => `${k}: "${val.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"${comma}`
            );
            if (newLine !== line) {
              lines[i] = newLine;
              changed = true;
            }
          }
        }
      }
    }
  }

  if (changed) {
    fs.writeFileSync(fp, lines.join('\n'), 'utf8');
    totalUpdated++;
    console.log(`Updated: ${lang}.ts`);
  }
}

console.log(`\nTotal updated: ${totalUpdated} files`);
