/**
 * fix_missing_nested_keys.mjs
 * Adds missing nested keys (notification, discover.groups/community/all/recruiting/almostFull,
 * match.filterGender, filter.genderAll/F/M, profile.title/editProfileBtn/subDesc, notif.*)
 * across all locale files that are missing them.
 */
import fs from 'fs';
import path from 'path';
const LOCALES_DIR = './src/i18n/locales';

// Keys that need to match per locale - nested path → translations map
// Format: { "section.key": { lang: value } }
const KEYS = {
  // notification section
  "notification.title": {
    en: "Notifications", ja: "通知", zh: "通知", es: "Notificaciones", fr: "Notifications",
    de: "Benachrichtigungen", pt: "Notificações", id: "Notifikasi", vi: "Thông báo",
    th: "การแจ้งเตือน", ar: "الإشعارات", hi: "सूचनाएं", ru: "Уведомления", tr: "Bildirimler",
    nl: "Meldingen", pl: "Powiadomienia", sv: "Aviseringar", da: "Notifikationer",
    no: "Varsler", fi: "Ilmoitukset", cs: "Oznámení", ro: "Notificări", hu: "Értesítések",
    el: "Ειδοποιήσεις", bg: "Известия", uk: "Сповіщення", he: "התראות",
    bn: "বিজ্ঞপ্তি", ta: "அறிவிப்புகள்", te: "నోటిఫికేషన్లు", kn: "ಅಧಿಸೂಚನೆಗಳು",
    ml: "അറിയിപ്പുകൾ", gu: "સૂચનાઓ", mr: "सूचना", pa: "ਸੂਚਨਾਵਾਂ",
    fa: "اعلان‌ها", ur: "اطلاعات", sw: "Arifa", zu: "Izaziso", ca: "Notificacions",
    hr: "Obavijesti", sk: "Oznámenia", sl: "Obvestila", lv: "Paziņojumi",
    lt: "Pranešimai", et: "Teavitused", is: "Tilkynningar"
  },
  "notification.empty": {
    en: "No notifications yet", ja: "通知はまだありません", zh: "暂无通知",
    es: "Aún no hay notificaciones", fr: "Pas encore de notifications",
    de: "Noch keine Benachrichtigungen", pt: "Ainda não há notificações",
    id: "Belum ada notifikasi", vi: "Chưa có thông báo", th: "ยังไม่มีการแจ้งเตือน",
    ar: "لا توجد إشعارات بعد", hi: "अभी तक कोई सूचना नहीं", ru: "Пока нет уведомлений",
    tr: "Henüz bildirim yok", nl: "Nog geen meldingen", pl: "Brak powiadomień",
    sv: "Inga aviseringar ännu", da: "Ingen notifikationer endnu"
  },
  "notification.emptyDesc": {
    en: "Find a travel companion!", ja: "旅の仲間を見つけましょう！", zh: "去寻找旅行伙伴吧！",
    es: "¡Encuentra un compañero de viaje!", fr: "Trouvez un compagnon de voyage!",
    de: "Finden Sie einen Reisegefährten!", pt: "Encontre um companheiro de viagem!",
    id: "Temukan teman perjalanan!", vi: "Tìm bạn đồng hành!", th: "หาเพื่อนร่วมเดินทาง!",
    ar: "ابحث عن رفيق رحلة!", hi: "यात्रा साथी खोजें!", ru: "Найдите попутчика!",
    tr: "Yol arkadaşı bulun!"
  },
  "notification.unread": {
    en: "{{count}} unread", ja: "{{count}}件未読", zh: "{{count}}条未读",
    es: "{{count}} sin leer", fr: "{{count}} non lu(s)", de: "{{count}} ungelesen",
    pt: "{{count}} não lida(s)", ru: "{{count}} непрочитано", tr: "{{count}} okunmadı"
  },
  "notification.markAll": {
    en: "Mark all read", ja: "すべて既読", zh: "全部标读",
    es: "Marcar todo como leído", fr: "Tout marquer lu", de: "Alle als gelesen markieren",
    pt: "Marcar tudo como lido", ru: "Отметить всё прочитанным", tr: "Tümünü okundu işaretle"
  },
  // discover section  
  "discover.groups": {
    en: "Travel Groups", ja: "旅グループ", zh: "旅行群组",
    es: "Grupos de Viaje", fr: "Groupes de Voyage", de: "Reisegruppen",
    pt: "Grupos de Viagem", id: "Grup Perjalanan", vi: "Nhóm Du lịch",
    th: "กลุ่มท่องเที่ยว", ar: "مجموعات السفر", hi: "यात्रा समूह",
    ru: "Туристические группы", tr: "Seyahat Grupları", nl: "Reisgroepen",
    pl: "Grupy Podróżne"
  },
  "discover.community": {
    en: "Community", ja: "コミュニティ", zh: "社区",
    es: "Comunidad", fr: "Communauté", de: "Gemeinschaft",
    pt: "Comunidade", id: "Komunitas", vi: "Cộng đồng",
    th: "ชุมชน", ar: "المجتمع", hi: "समुदाय",
    ru: "Сообщество", tr: "Topluluk", nl: "Gemeenschap",
    pl: "Społeczność"
  },
  "discover.all": {
    en: "All", ja: "全て", zh: "全部",
    es: "Todos", fr: "Tout", de: "Alle",
    pt: "Todos", id: "Semua", vi: "Tất cả",
    th: "ทั้งหมด", ar: "الكل", hi: "सभी",
    ru: "Все", tr: "Tümü"
  },
  "discover.recruiting": {
    en: "Recruiting", ja: "募集中", zh: "招募中",
    es: "Reclutando", fr: "En recrutement", de: "Rekrutierung",
    pt: "Recrutando", id: "Merekrut", vi: "Đang tuyển",
    th: "กำลังรับสมัคร", ar: "يجند", hi: "भर्ती",
    ru: "Набор участников", tr: "Üye Alınıyor"
  },
  "discover.almostFull": {
    en: "Almost Full", ja: "まもなく満員", zh: "快满了",
    es: "Casi lleno", fr: "Presque complet", de: "Fast voll",
    pt: "Quase cheio", id: "Hampir penuh", vi: "Gần đầy",
    th: "เกือบเต็มแล้ว", ar: "يكاد يمتلئ", hi: "लगभग भरा",
    ru: "Почти полная", tr: "Neredeyse Dolu"
  },
  "discover.searchPlaceholder": {
    en: "Search by destination, travel style...", ja: "目的地、旅行スタイルを検索...",
    zh: "搜索目的地、旅行风格...", es: "Buscar destino, estilo de viaje...",
    fr: "Rechercher destination, style de voyage...", de: "Ziel, Reisestil suchen...",
    pt: "Buscar destino, estilo de viagem...", ru: "Поиск по направлению, стилю...",
    tr: "Hedef, seyahat tarzı ara..."
  },
  // filter section
  "filter.genderAll": {
    en: "All", ja: "全て", zh: "全部",
    es: "Todos", fr: "Tous", de: "Alle",
    pt: "Todos", id: "Semua", vi: "Tất cả",
    th: "ทั้งหมด", ar: "الكل", hi: "सभी",
    ru: "Все", tr: "Tümü"
  },
  "filter.genderF": {
    en: "Female", ja: "女性", zh: "女性",
    es: "Femenino", fr: "Féminin", de: "Weiblich",
    pt: "Feminino", id: "Perempuan", vi: "Nữ",
    th: "หญิง", ar: "أنثى", hi: "महिला",
    ru: "Женский", tr: "Kadın"
  },
  "filter.genderM": {
    en: "Male", ja: "男性", zh: "男性",
    es: "Masculino", fr: "Masculin", de: "Männlich",
    pt: "Masculino", id: "Laki-laki", vi: "Nam",
    th: "ชาย", ar: "ذكر", hi: "पुरुष",
    ru: "Мужской", tr: "Erkek"
  },
  "filter.title": {
    en: "Filter Settings", ja: "フィルター設定", zh: "筛选设置",
    es: "Configuración de filtros", fr: "Paramètres de filtres",
    de: "Filtereinstellungen", pt: "Configurações de filtro",
    id: "Pengaturan filter", vi: "Cài đặt bộ lọc",
    th: "การตั้งค่าตัวกรอง", ar: "إعدادات الفلتر",
    hi: "फ़िल्टर सेटिंग", ru: "Настройки фильтра", tr: "Filtre Ayarları"
  },
  "filter.distance": {
    en: "Distance Radius", ja: "距離半径", zh: "距离范围",
    es: "Radio de distancia", fr: "Rayon de distance",
    de: "Entfernungsradius", pt: "Raio de distância",
    ru: "Радиус расстояния", tr: "Mesafe Yarıçapı"
  },
  "filter.reset": {
    en: "Reset", ja: "リセット", zh: "重置",
    es: "Restablecer", fr: "Réinitialiser", de: "Zurücksetzen",
    pt: "Redefinir", id: "Reset", vi: "Đặt lại",
    th: "รีเซ็ต", ar: "إعادة تعيين", hi: "रीसेट",
    ru: "Сбросить", tr: "Sıfırla"
  },
  "filter.apply": {
    en: "Apply", ja: "適用", zh: "应用",
    es: "Aplicar", fr: "Appliquer", de: "Anwenden",
    pt: "Aplicar", id: "Terapkan", vi: "Áp dụng",
    th: "ใช้งาน", ar: "تطبيق", hi: "लागू करें",
    ru: "Применить", tr: "Uygula"
  },
  "filter.style": {
    en: "Travel Style", ja: "旅行スタイル", zh: "旅行风格",
    es: "Estilo de viaje", fr: "Style de voyage", de: "Reisestil",
    pt: "Estilo de viagem", ru: "Стиль путешествия", tr: "Seyahat Tarzı"
  },
  // match section additional keys
  "match.filterGender": {
    en: "Who to Meet", ja: "出会いたい相手", zh: "遇见对象",
    es: "Con quién reunirse", fr: "Qui rencontrer",
    de: "Wen treffen", pt: "Com quem se encontrar",
    id: "Siapa yang ingin ditemui", vi: "Muốn gặp ai",
    th: "ต้องการพบใคร", ar: "من تريد لقاءه",
    hi: "किससे मिलना है", ru: "Кого встретить", tr: "Kimi Tanımak İstiyorsun"
  },
  "match.filterDist": {
    en: "Distance Radius", ja: "距離半径", zh: "距离范围",
    es: "Radio de distancia", fr: "Rayon de distance", de: "Entfernungsradius",
    pt: "Raio de distância", ru: "Радиус расстояния", tr: "Mesafe Yarıçapı"
  },
  "match.filterTitle": {
    en: "Filter Settings", ja: "フィルター設定", zh: "筛选设置",
    es: "Configuración de filtros", fr: "Paramètres de filtres",
    de: "Filtereinstellungen", pt: "Configurações de filtro",
    ru: "Настройки фильтра", tr: "Filtre Ayarları"
  },
  "match.filterReset": {
    en: "Reset", ja: "リセット", zh: "重置",
    es: "Restablecer", fr: "Réinitialiser", de: "Zurücksetzen",
    pt: "Redefinir", ru: "Сбросить", tr: "Sıfırla"
  },
  "match.empty": {
    en: "You've seen all nearby travelers!", ja: "周辺の旅行者を全員確認しました！",
    zh: "已查看所有附近旅行者！", es: "¡Ya has visto a todos los viajeros!",
    fr: "Vous avez vu tous les voyageurs!", de: "Sie haben alle Reisenden gesehen!",
    pt: "Você viu todos os viajantes!", ru: "Вы просмотрели всех путешественников!",
    tr: "Yakındaki tüm gezginleri gördünüz!"
  },
  "match.emptyDesc": {
    en: "New travelers will appear soon", ja: "新しい旅行者がまもなく現れます",
    zh: "新的旅行者即将出现", es: "Pronto aparecerán nuevos viajeros",
    fr: "De nouveaux voyageurs apparaîtront bientôt", de: "Neue Reisende erscheinen bald",
    pt: "Novos viajantes aparecerão em breve", ru: "Новые путешественники появятся скоро",
    tr: "Yakında yeni gezginler görünecek"
  },
  // profile section
  "profile.title": {
    en: "Profile", ja: "プロフィール", zh: "个人资料",
    es: "Perfil", fr: "Profil", de: "Profil",
    pt: "Perfil", id: "Profil", vi: "Hồ sơ",
    th: "โปรไฟล์", ar: "الملف الشخصي", hi: "प्रोफाइल",
    ru: "Профиль", tr: "Profil", nl: "Profiel",
    pl: "Profil"
  },
  "profile.editProfileBtn": {
    en: "Edit Profile", ja: "プロフィール編集", zh: "编辑资料",
    es: "Editar perfil", fr: "Modifier le profil",
    de: "Profil bearbeiten", pt: "Editar perfil",
    id: "Edit profil", vi: "Chỉnh sửa hồ sơ",
    th: "แก้ไขโปรไฟล์", ar: "تعديل الملف الشخصي",
    hi: "प्रोफाइल संपादित करें", ru: "Редактировать профиль",
    tr: "Profili Düzenle"
  },
  "profile.subDesc": {
    en: "Subscribe to Migo Plus for exclusive benefits.",
    ja: "Migo Plusに登録して特別な特典をご利用ください。",
    zh: "订阅Migo Plus享受独家福利。",
    es: "Suscríbete a Migo Plus para beneficios exclusivos.",
    fr: "Abonnez-vous à Migo Plus pour des avantages exclusifs.",
    de: "Abonnieren Sie Migo Plus für exklusive Vorteile.",
    pt: "Assine o Migo Plus para benefícios exclusivos.",
    ru: "Подпишитесь на Migo Plus для эксклюзивных привилегий.",
    tr: "Özel avantajlar için Migo Plus'a abone olun."
  },
  "profile.language": {
    en: "Language Settings", ja: "言語設定", zh: "语言设置",
    es: "Configuración de idioma", fr: "Paramètres de langue",
    de: "Spracheinstellungen", pt: "Configurações de idioma",
    ru: "Настройки языка", tr: "Dil Ayarları"
  },
  // notif (inside profilePage.settings)
  "notif.emptyDesc": {
    en: "Find a travel companion!", ja: "旅の仲間を見つけましょう！", zh: "去寻找旅行伙伴吧！",
    es: "¡Encuentra un compañero de viaje!", fr: "Trouvez un compagnon de voyage!",
    de: "Finden Sie einen Reisegefährten!", pt: "Encontre um companheiro de viagem!",
    ru: "Найдите попутчика!", tr: "Yol arkadaşı bulun!"
  }
};

// For each locale file, find and update each nested key
const localeFiles = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.ts'));
let totalUpdated = 0;

for (const file of localeFiles) {
  const lang = file.replace('.ts', '');
  if (lang === 'ko') continue; // skip Korean source
  
  const fp = path.join(LOCALES_DIR, file);
  let content = fs.readFileSync(fp, 'utf8');
  let changed = false;

  // Process each key
  for (const [dotPath, translations] of Object.entries(KEYS)) {
    const nativeVal = translations[lang];
    if (!nativeVal) continue;

    const [section, ...subParts] = dotPath.split('.');
    const subKey = subParts.join('.');
    
    // Try to find the key inside its section
    // Pattern: look for "section": { ... "subKey": "old value" ...}
    const escapedSubKey = subKey.replace(/\./g, '\\.').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escaped = escapedSubKey;
    const keyPatternStr = `("${escaped}"\\s*:\\s*)"(?:[^"\\\\]|\\\\.)*"`;
    const keyPattern = new RegExp(keyPatternStr, 'g');
    
    // Find the section first
    const sectionPattern = new RegExp(`"${section}"\\s*:\\s*\\{`, 'g');
    let sectionMatch;
    let found = false;
    
    while ((sectionMatch = sectionPattern.exec(content)) !== null) {
      const sectionStart = sectionMatch.index + sectionMatch[0].length;
      // Find the corresponding closing brace
      let depth = 1;
      let pos = sectionStart;
      while (pos < content.length && depth > 0) {
        if (content[pos] === '{') depth++;
        else if (content[pos] === '}') depth--;
        pos++;
      }
      const sectionEnd = pos;
      const sectionContent = content.substring(sectionStart, sectionEnd);
      
      // Check if subKey exists in this section
      const subKeyRegex = new RegExp(`"${escaped}"\\s*:\\s*"(?:[^"\\\\]|\\\\.)*"(,?)`);
      if (subKeyRegex.test(sectionContent)) {
        // Replace the value
        const escapedNative = nativeVal.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const newSectionContent = sectionContent.replace(
          subKeyRegex,
          (match, comma) => `"${subKey}": "${escapedNative}"${comma}`
        );
        if (newSectionContent !== sectionContent) {
          content = content.substring(0, sectionStart) + newSectionContent + content.substring(sectionEnd);
          changed = true;
          found = true;
        }
        break;
      }
    }
    
    if (!found) {
      // Key doesn't exist in any section of the right name - we need to add it
      // Find section and inject before its closing brace
      const sectionPattern2 = new RegExp(`("${section}"\\s*:\\s*\\{)`, 'g');
      let sectMatch = sectionPattern2.exec(content);
      if (sectMatch) {
        const sectionStart2 = sectMatch.index + sectMatch[0].length;
        let depth2 = 1;
        let pos2 = sectionStart2;
        while (pos2 < content.length && depth2 > 0) {
          if (content[pos2] === '{') depth2++;
          else if (content[pos2] === '}') depth2--;
          pos2++;
        }
        const closingBrace = pos2 - 1;
        // Find last non-whitespace before closing brace
        let insertPos = closingBrace - 1;
        while (insertPos > sectionStart2 && content[insertPos].match(/\s/)) insertPos--;
        
        const escapedNative = nativeVal.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const insertion = `,\n    "${subKey}": "${escapedNative}"`;
        
        // Add comma to last item if needed
        const charAtInsert = content[insertPos];
        let prefix = '';
        if (charAtInsert !== ',') prefix = '';
        
        content = content.substring(0, insertPos + 1) + insertion + '\n  ' + content.substring(insertPos + 1);
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(fp, content, 'utf8');
    totalUpdated++;
    console.log(`Updated: ${lang}.ts`);
  }
}

console.log(`\nDone. Updated ${totalUpdated} files.`);
