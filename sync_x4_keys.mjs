/**
 * sync_x4_keys.mjs
 * Adds missing x40xx-x41xx keys to ALL locale files.
 * For each locale, provides translations for nearby/chat/plus UI strings.
 * Falls back to English for languages not in the map.
 */
import fs from 'fs';
import path from 'path';

const LOCALES_DIR = './src/i18n/locales';

// All critically missing keys with translations per language
// Format: key -> { default (English), ja, zh, es, fr, de, pt, id, vi, th, ar, hi, ru, tr, it, nl, pl, ... }
const KEY_TRANSLATIONS = {
  // ── Nearby page header ─────────────────────────────────────────────────────
  "x4040": {
    en: "Nearby Travelers", ja: "近くの旅行者", zh: "附近旅行者", es: "Viajeros cercanos",
    fr: "Voyageurs proches", de: "Reisende in der Nähe", pt: "Viajantes próximos",
    id: "Wisatawan terdekat", vi: "Du khách gần đây", th: "นักเดินทางใกล้เคียง",
    ar: "المسافرون القريبون", hi: "पास के यात्री", ru: "Ближайшие путешественники",
    tr: "Yakındaki Gezginler", it: "Viaggiatori vicini", nl: "Nabijgelegen reizigers",
    pl: "Pobliskie podróżnicy", sv: "Resenärer i närheten", da: "Nærliggende rejsende",
    no: "Reisende i nærheten", fi: "Lähellä olevat matkustajat",
  },
  "x4041": {
    en: "travelers nearby!", ja: "名の旅行者が近くにいます！", zh: "位旅行者在附近！",
    es: "¡viajeros cerca!", fr: "voyageurs près de vous !", de: "Reisende in der Nähe!",
    pt: "viajantes por perto!", id: "wisatawan di sekitar!", vi: "du khách gần đây!",
    th: "นักเดินทางอยู่ใกล้ๆ!", ar: "مسافرون قريبون!", hi: "यात्री पास में! ",
    ru: "путешественников рядом!", tr: "gezgin yakınında!", it: "viaggiatori vicini!",
    nl: "reizigers in de buurt!", pl: "podróżnicy w pobliżu!",
  },
  "x4042": {
    en: "Real-time updates", ja: "リアルタイム更新", zh: "实时更新",
    es: "Actualizaciones en tiempo real", fr: "Mises à jour en temps réel",
    de: "Echtzeit-Updates", pt: "Atualizações em tempo real",
    id: "Pembaruan real-time", vi: "Cập nhật theo thời gian thực",
    th: "อัปเดตแบบเรียลไทม์", ar: "تحديثات فورية", hi: "रियल-टाइम अपडेट",
    ru: "Обновления в реальном времени", tr: "Gerçek zamanlı güncellemeler",
  },
  "x4043": {
    en: "Local", ja: "ローカル", zh: "本地人", es: "Local", fr: "Local",
    de: "Einheimisch", pt: "Local", id: "Lokal", vi: "Người địa phương",
    th: "คนท้องถิ่น", ar: "محلي", hi: "स्थानीय", ru: "Местный", tr: "Yerel",
    it: "Locale", nl: "Lokaal", pl: "Lokalny",
  },
  "x4044": {
    en: "Online", ja: "オンライン", zh: "在线", es: "En línea", fr: "En ligne",
    de: "Online", pt: "Online", id: "Online", vi: "Trực tuyến",
    th: "ออนไลน์", ar: "متصل", hi: "ऑनलाइन", ru: "Онлайн", tr: "Çevrimiçi",
  },
  "x4045": {
    en: "No nearby travelers in this filter", ja: "このフィルターで近くの旅行者がいません",
    zh: "此筛选条件下没有附近旅行者", es: "No hay viajeros cercanos con este filtro",
    fr: "Aucun voyageur à proximité avec ce filtre", de: "Keine Reisenden in der Nähe",
    pt: "Nenhum viajante próximo com este filtro", id: "Tidak ada wisatawan di sekitar",
    vi: "Không có du khách nào với bộ lọc này", th: "ไม่มีนักเดินทางใกล้เคียงในตัวกรองนี้",
    ar: "لا يوجد مسافرون قريبون بهذا التصفية", ru: "Нет путешественников рядом с этим фильтром",
  },
  "x4046": {
    en: "Try different filters or check back later",
    ja: "別のフィルターを試すか、後でもう一度確認してください",
    zh: "请尝试其他筛选条件或稍后再查看",
    es: "Prueba diferentes filtros o vuelve más tarde",
    fr: "Essayez d'autres filtres ou revenez plus tard",
    de: "Versuche andere Filter oder schaue später wieder nach",
    pt: "Tente filtros diferentes ou volte mais tarde",
    ru: "Попробуйте другие фильтры или проверьте позже",
  },
  // ── Filter buttons ──────────────────────────────────────────────────────────
  "x4047": {
    en: "Food & Dining", ja: "グルメ", zh: "美食", es: "Gastronomía", fr: "Gastronomie",
    de: "Essen & Trinken", pt: "Gastronomia", id: "Kuliner", vi: "Ẩm thực",
    th: "อาหาร", ar: "طعام", hi: "खान-पान", ru: "Еда", tr: "Yeme-içme",
    it: "Gastronomia", nl: "Eten", pl: "Jedzenie",
  },
  "x4048": {
    en: "Sightseeing", ja: "観光", zh: "观光", es: "Turismo", fr: "Tourisme",
    de: "Sightseeing", pt: "Turismo", id: "Wisata", vi: "Tham quan",
    th: "ท่องเที่ยว", ar: "السياحة", hi: "दर्शनीय स्थल", ru: "Достопримечательности",
    tr: "Gezi", it: "Turismo", nl: "Bezienswaardigheden",
  },
  "x4049": {
    en: "Business", ja: "ビジネス", zh: "商务", es: "Negocios", fr: "Affaires",
    de: "Geschäft", pt: "Negócios", id: "Bisnis", vi: "Kinh doanh",
    th: "ธุรกิจ", ar: "أعمال", hi: "व्यापार", ru: "Бизнес", tr: "İş",
  },
  "x4050": {
    en: "Local Friends", ja: "地元の友達", zh: "本地朋友", es: "Amigos locales",
    fr: "Amis locaux", de: "Lokale Freunde", pt: "Amigos locais", id: "Teman lokal",
    vi: "Bạn địa phương", th: "เพื่อนท้องถิ่น", ar: "أصدقاء محليون",
    hi: "स्थानीय दोस्त", ru: "Местные друзья", tr: "Yerel Arkadaşlar",
  },
  "x4083": {
    en: "Nearby", ja: "近く", zh: "附近", es: "Cercano", fr: "À proximité",
    de: "In der Nähe", pt: "Próximo", id: "Terdekat", vi: "Gần đây",
    th: "ใกล้เคียง", ar: "قريب", hi: "पास में", ru: "Рядом", tr: "Yakın",
  },
  "x4084": { en: "Food & Dining", ja: "グルメ", zh: "美食", es: "Gastronomía", fr: "Gastronomie", de: "Essen", pt: "Gastronomia", id: "Kuliner", vi: "Ẩm thực", th: "อาหาร", ar: "طعام", hi: "खाना-पीना", ru: "Еда", tr: "Yemek" },
  "x4085": { en: "Sightseeing", ja: "観光", zh: "观光", es: "Turismo", fr: "Tourisme", de: "Sightseeing", pt: "Turismo", id: "Wisata", vi: "Tham quan", th: "ท่องเที่ยว", ar: "سياحة", hi: "पर्यटन", ru: "Туризм", tr: "Gezi" },
  "x4086": { en: "Business", ja: "ビジネス", zh: "商务", es: "Negocios", fr: "Affaires", de: "Geschäft", pt: "Negócios", id: "Bisnis", vi: "Kinh doanh", th: "ธุรกิจ", ar: "أعمال", hi: "व्यापार", ru: "Бизнес", tr: "İş" },
  "x4087": { en: "Local Friends", ja: "地元の友達", zh: "本地朋友", es: "Amigos locales", fr: "Amis locaux", de: "Lokale Freunde", pt: "Amigos locais", id: "Teman lokal", vi: "Bạn địa phương", th: "เพื่อนท้องถิ่น", ar: "أصدقاء محليون", hi: "स्थानीय दोस्त", ru: "Местные друзья", tr: "Yerel Arkadaşlar" },
  "x4088": { en: "Local", ja: "地元", zh: "本地", es: "Local", fr: "Local", de: "Einheimisch", pt: "Local", id: "Lokal", vi: "Địa phương", th: "ท้องถิ่น", ar: "محلي", hi: "स्थानीय", ru: "Местный", tr: "Yerel" },
  "x4089": { en: "Traveler", ja: "旅行者", zh: "旅行者", es: "Viajero", fr: "Voyageur", de: "Reisender", pt: "Viajante", id: "Wisatawan", vi: "Du khách", th: "นักเดินทาง", ar: "مسافر", hi: "यात्री", ru: "Путешественник", tr: "Gezgin" },
  "x4090": { en: "All", ja: "すべて", zh: "全部", es: "Todo", fr: "Tout", de: "Alle", pt: "Todos", id: "Semua", vi: "Tất cả", th: "ทั้งหมด", ar: "الكل", hi: "सभी", ru: "Все", tr: "Tümü", it: "Tutto", nl: "Alles", pl: "Wszystkie" },
  "x4091": { en: "💚 Liked!", ja: "💚 いいね！", zh: "💚 喜欢了！", es: "💚 ¡Me gusta!", fr: "💚 Aimé !", de: "💚 Geliked!", pt: "💚 Curtiu!", id: "💚 Disukai!", vi: "💚 Đã thích!", th: "💚 ชอบแล้ว!", ar: "💚 أعجبني!", hi: "💚 पसंद किया!", ru: "💚 Понравилось!", tr: "💚 Beğenildi!" },
  // ── Chat limit banner ───────────────────────────────────────────────────────
  "z_autoz오늘메시지_879": {
    en: "Today's message limit reached 🔒", ja: "今日のメッセージ上限に達しました 🔒",
    zh: "今日消息次数已达上限 🔒", es: "Límite de mensajes de hoy alcanzado 🔒",
    fr: "Limite de messages atteinte 🔒", de: "Tageslimit für Nachrichten erreicht 🔒",
    pt: "Limite de mensagens de hoje atingido 🔒", id: "Batas pesan hari ini tercapai 🔒",
    vi: "Đã đạt giới hạn tin nhắn hôm nay 🔒", th: "ถึงขีดจำกัดข้อความวันนี้แล้ว 🔒",
    ar: "تم الوصول إلى حد الرسائل اليوم 🔒", hi: "आज की मैसेज सीमा पहुंच गई 🔒",
    ru: "Дневной лимит сообщений достигнут 🔒", tr: "Günlük mesaj limitine ulaşıldı 🔒",
  },
  "z_autoz업그레이드_881": {
    en: "Upgrade", ja: "アップグレード", zh: "升级", es: "Actualizar",
    fr: "Mettre à niveau", de: "Upgraden", pt: "Atualizar", id: "Upgrade",
    vi: "Nâng cấp", th: "อัพเกรด", ar: "ترقية", hi: "अपग्रेड", ru: "Улучшить", tr: "Yükselt",
  },
  "z_autoz오늘메시지_907": {
    en: "Today's message limit reached 🔒", ja: "今日のメッセージ上限に達しました 🔒",
    zh: "今日消息次数已达上限 🔒", es: "Límite de mensajes de hoy alcanzado 🔒",
    fr: "Limite de messages atteinte 🔒", de: "Tageslimit für Nachrichten erreicht 🔒",
    pt: "Limite de mensagens atingido 🔒", ru: "Лимит сообщений достигнут 🔒",
  },
  "z_autozPlus로_908": {
    en: "Upgrade to Plus for unlimited conversations.", ja: "Plusにアップグレードして無制限でチャットしよう。",
    zh: "升级到Plus享受无限对话。", es: "Actualiza a Plus para conversaciones ilimitadas.",
    fr: "Passez à Plus pour des conversations illimitées.", de: "Upgrade auf Plus für unbegrenzte Gespräche.",
    pt: "Atualize para Plus para conversas ilimitadas.", ru: "Перейдите на Plus для неограниченных разговоров.",
  },
  // ── Plus modal features ─────────────────────────────────────────────────────
  "z_autoz하루라이크_1315": {
    en: "Daily Likes", ja: "1日のいいね", zh: "每日喜欢", es: "Me gusta diarios",
    fr: "J'aime quotidiens", de: "Tägliche Likes", pt: "Curtidas diárias",
    id: "Suka harian", vi: "Lượt thích hàng ngày", th: "ไลค์รายวัน",
    ar: "إعجابات يومية", hi: "दैनिक लाइक", ru: "Ежедневные лайки", tr: "Günlük Beğeniler",
  },
  "z_autoz무제한14_1317": {
    en: "Unlimited ♾️", ja: "無制限 ♾️", zh: "无限 ♾️", es: "Ilimitados ♾️",
    fr: "Illimité ♾️", de: "Unbegrenzt ♾️", pt: "Ilimitados ♾️", id: "Tak terbatas ♾️",
    vi: "Không giới hạn ♾️", th: "ไม่จำกัด ♾️", ar: "غير محدود ♾️",
    hi: "असीमित ♾️", ru: "Безлимитно ♾️", tr: "Sınırsız ♾️",
  },
  "z_autoz슈퍼라이크_1318": {
    en: "Super Like", ja: "スーパーライク", zh: "超级喜欢", es: "Super Like",
    fr: "Super Like", de: "Super Like", pt: "Super Like", id: "Super Like",
    vi: "Siêu Thích", th: "ซูเปอร์ไลค์", ar: "إعجاب فائق", hi: "सुपर लाइक",
    ru: "Суперлайк", tr: "Süper Beğeni",
  },
  "z_autoz무제한14_1320": { en: "Unlimited ⭐", ja: "無制限 ⭐", zh: "无限 ⭐", es: "Ilimitados ⭐", fr: "Illimité ⭐", de: "Unbegrenzt ⭐", pt: "Ilimitados ⭐", ru: "Безлимитно ⭐", tr: "Sınırsız ⭐" },
  "z_autoz나를좋아한_1321": {
    en: "See who liked me", ja: "いいねしてくれた人を見る", zh: "查看喜欢我的人",
    es: "Ver quién me gustó", fr: "Voir qui m'a aimé", de: "Sehen wer mich geliked hat",
    pt: "Ver quem curtiu você", id: "Lihat yang menyukai saya", vi: "Xem ai đã thích tôi",
    th: "ดูคนที่ชอบฉัน", ar: "رؤية من أعجب بي", hi: "देखें किसने लाइक किया",
    ru: "Посмотреть кто лайкнул", tr: "Beni beğenenleri gör",
  },
  "z_autoz전체공개1_1323": {
    en: "✅ Visible", ja: "✅ 公開", zh: "✅ 可见", es: "✅ Visible",
    fr: "✅ Visible", de: "✅ Sichtbar", pt: "✅ Visível", ru: "✅ Видно",
  },
  "z_autoz프로필부스_1324": {
    en: "Profile Boost", ja: "プロフィールブースト", zh: "个人资料加速",
    es: "Impulso de perfil", fr: "Boost de profil", de: "Profil-Boost",
    pt: "Impulso de perfil", ru: "Буст профиля", tr: "Profil Güçlendirme",
  },
  "z_autoz상세필터1_1326": {
    en: "Advanced Filter", ja: "詳細フィルター", zh: "高级筛选",
    es: "Filtro avanzado", fr: "Filtre avancé", de: "Erweiterter Filter",
    pt: "Filtro avançado", ru: "Расширенный фильтр", tr: "Gelişmiş Filtre",
  },
  "z_autoz글로벌매칭_1329": {
    en: "Global Matching", ja: "グローバルマッチング", zh: "全球匹配",
    es: "Emparejamiento global", fr: "Correspondance mondiale", de: "Globales Matching",
    pt: "Matching global", ru: "Глобальный матчинг", tr: "Global Eşleştirme",
  },
  "z_autoz여행DNA_1332": {
    en: "Travel DNA Report", ja: "旅行DNAレポート", zh: "旅行DNA报告",
    es: "Informe de ADN de viaje", fr: "Rapport ADN voyage", de: "Reise-DNA-Bericht",
    pt: "Relatório de DNA de viagem", ru: "Отчёт ДНК путешествий", tr: "Seyahat DNA Raporu",
  },
  // ── Subscription modal header ───────────────────────────────────────────────
  "z_autoz여행동행의_1361": {
    en: "Unlimited travel companions", ja: "無制限の旅行同行者", zh: "无限旅行伴侣",
    es: "Compañeros de viaje ilimitados", fr: "Compagnons de voyage illimités",
    de: "Unbegrenzte Reisegefährten", pt: "Companheiros de viagem ilimitados",
    ru: "Неограниченные попутчики", tr: "Sınırsız seyahat arkadaşı",
  },
  "z_autoz7일무료체_1362": {
    en: "7-day free trial", ja: "7日間無料体験", zh: "7天免费试用",
    es: "Prueba gratuita de 7 días", fr: "Essai gratuit de 7 jours",
    de: "7-tägige kostenlose Testversion", pt: "Teste gratuito de 7 dias",
    ru: "7-дневный бесплатный период", tr: "7 günlük ücretsiz deneme",
  },
  "z_autoz언제든지취_1372": {
    en: "Cancel anytime · Auto-renews · First 7 days free",
    ja: "いつでもキャンセル可能・自動更新・最初の7日間無料",
    zh: "随时取消·自动续费·前7天免费",
    es: "Cancela cuando quieras · Renovación automática · Primeros 7 días gratis",
    fr: "Annulez quand vous voulez · Renouvellement auto · 7 premiers jours gratuits",
    de: "Jederzeit kündigen · Automatische Verlängerung · Erste 7 Tage kostenlos",
    pt: "Cancele quando quiser · Renovação automática · Primeiros 7 dias grátis",
    ru: "Отмена в любое время · Автопродление · Первые 7 дней бесплатно",
    tr: "İstediğinizde iptal edin · Otomatik yenileme · İlk 7 gün ücretsiz",
  },
  // ── Match page banner strings ───────────────────────────────────────────────
  "z_새로운매치_1068": {
    en: "🎉 New Match!", ja: "🎉 新しいマッチ！", zh: "🎉 新匹配！",
    es: "🎉 ¡Nuevo Match!", fr: "🎉 Nouveau Match!", de: "🎉 Neues Match!",
    pt: "🎉 Novo Match!", ru: "🎉 Новый матч!", tr: "🎉 Yeni Eşleşme!",
  },
  // ── Subscription/pricing page new feature cards ─────────────────────────────
  "z_autoz여행DNA_1351": {
    en: "Travel DNA Report", ja: "旅行DNAレポート", zh: "旅行DNA报告",
    es: "Informe ADN de Viaje", fr: "Rapport ADN Voyage", de: "Reise-DNA-Report",
    pt: "Relatório DNA de Viagem", ru: "Отчёт ДНК путешествий",
  },
  "z_autoz내가좋아요_1354": {
    en: "Received Likes List", ja: "もらったいいねリスト", zh: "收到的喜欢列表",
    es: "Lista de me gustas recibidos", fr: "Liste des j'aimes reçus",
    de: "Liste der erhaltenen Likes", pt: "Lista de curtidas recebidas",
    ru: "Список полученных лайков",
  },
  "z_autoz글로벌매칭_1356": {
    en: "Global Matching", ja: "グローバルマッチング", zh: "全球匹配",
    es: "Emparejamiento global", fr: "Correspondance mondiale",
    de: "Globales Matching", pt: "Matching global", ru: "Глобальный матчинг",
  },
  "z_autozMigoP_1359": {
    en: "👑 Migo Plus Activated!", ja: "👑 Migo Plus アクティベーション！",
    zh: "👑 Migo Plus 已激活！", es: "👑 ¡Migo Plus activado!",
    fr: "👑 Migo Plus activé!", de: "👑 Migo Plus aktiviert!",
    pt: "👑 Migo Plus ativado!", ru: "👑 Migo Plus активирован!",
  },
  // ── p-keys (interpolated) ───────────────────────────────────────────────────
  "p30": {
    en: "{{dist}}m away", ja: "{{dist}}m先", zh: "距{{dist}}米", es: "A {{dist}}m",
    fr: "À {{dist}}m", de: "{{dist}}m entfernt", pt: "A {{dist}}m", ru: "{{dist}}м от вас",
  },
  "p31": {
    en: "Around {{city}} · Real-time updates", ja: "{{city}}周辺 · リアルタイム更新",
    zh: "{{city}}周边 · 实时更新", es: "Cerca de {{city}} · En tiempo real",
    fr: "Près de {{city}} · Temps réel", de: "Rund um {{city}} · Echtzeit",
    pt: "Perto de {{city}} · Tempo real", ru: "Рядом с {{city}} · Реальное время",
  },
  "t5008": {
    en: "Free messages {{v0}}/{{v1}} - Unlimited with Plus",
    ja: "無料メッセージ {{v0}}/{{v1}} - Plusは無制限",
    zh: "免费消息 {{v0}}/{{v1}} - Plus无限制",
    es: "Mensajes gratis {{v0}}/{{v1}} - Ilimitados con Plus",
    fr: "Messages gratuits {{v0}}/{{v1}} - Illimités avec Plus",
    de: "Kostenlose Nachrichten {{v0}}/{{v1}} - Unbegrenzt mit Plus",
    pt: "Mensagens grátis {{v0}}/{{v1}} - Ilimitadas com Plus",
    ru: "Бесплатных сообщений {{v0}}/{{v1}} - Безлимитно с Plus",
    tr: "Ücretsiz mesaj {{v0}}/{{v1}} - Plus ile sınırsız",
  },
};

// Language code to translation key map
const LANG_ORDER = [
  'en','ja','zh','es','fr','de','pt','id','vi','th','ar','hi','ru','tr',
  'it','nl','pl','sv','da','no','fi','cs','ro','hu','el','bg','uk','he',
  'bn','ta','te','kn','ml','gu','mr','pa','fa','ur','sw','zu','ca','hr',
  'sk','sl','lv','lt','et','is'
];

const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.ts') && f !== 'ko.ts');
let totalAdded = 0;

for (const file of files) {
  const lang = file.replace('.ts', '');
  const filePath = path.join(LOCALES_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.trim()) {
    console.log(`SKIP (empty): ${file}`);
    continue;
  }
  
  // Find the last entry in the file and append before the closing };
  const keysAdded = [];
  
  for (const [key, translations] of Object.entries(KEY_TRANSLATIONS)) {
    // Check if key already exists
    const keyStr = '"' + key + '"';
    if (content.includes(keyStr + ':') || content.includes(keyStr + ' :')) {
      continue; // already exists
    }
    
    // Get translation for this language, fall back to English
    const val = translations[lang] || translations['en'] || '';
    if (val) {
      keysAdded.push(`    "${key}": "${val.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
    }
  }
  
  if (keysAdded.length > 0) {
    // Find the last closing of the translation object and insert before it
    // Pattern: ends with   }\n};\nexport default xxx;
    const exportIdx = content.lastIndexOf('export default');
    const mainCloseIdx = content.lastIndexOf('};', exportIdx);
    
    // Find the last key-value pair closing before main }; 
    const insertionPoint = content.lastIndexOf('\n  }', mainCloseIdx);
    
    const insertion = ',\n' + keysAdded.join(',\n');
    content = content.substring(0, insertionPoint) + insertion + content.substring(insertionPoint);
    
    fs.writeFileSync(filePath, content, 'utf8');
    totalAdded += keysAdded.length;
    console.log(`${lang}: added ${keysAdded.length} keys`);
  }
}

console.log(`\nTotal keys added across all locales: ${totalAdded}`);
