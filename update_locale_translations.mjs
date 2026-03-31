/**
 * update_locale_translations.mjs
 * UPDATES (replaces) x4040-x4199, Chat DM, Plus modal keys in all non-en, non-ko locales
 * with proper native language translations instead of English stubs.
 */
import fs from 'fs';
import path from 'path';

const LOCALES_DIR = './src/i18n/locales';

// Full translation map: key -> {lang_code: "native translation"}
// ALL non-en locales will use their native language value; falls back to English if not listed
const TRANSLATIONS = {
  "x4040": {
    ja:"近くの旅行者", zh:"附近旅行者", es:"Viajeros cercanos", fr:"Voyageurs proches",
    de:"Reisende in der Nähe", pt:"Viajantes próximos", id:"Wisatawan terdekat",
    vi:"Du khách gần đây", th:"นักเดินทางใกล้เคียง", ar:"المسافرون القريبون",
    hi:"पास के यात्री", ru:"Путешественники рядом", tr:"Yakındaki Gezginler",
    it:"Viaggiatori vicini", nl:"Nabijgelegen reizigers", pl:"Pobliżu podróżnicy",
    sv:"Resenärer i närheten", da:"Nærliggende rejsende", no:"Reisende i nærheten",
    fi:"Lähellä olevat matkustajat", cs:"Cestující v okolí", ro:"Călători din apropiere",
    hu:"Közeli utazók", el:"Κοντινοί ταξιδιώτες", bg:"Близки пътници",
    uk:"Мандрівники поруч", he:"מטיילים קרובים", bn:"কাছের ভ্রমণকারী",
    ta:"அருகில் உள்ள பயணிகள்", te:"సమీపంలోని ప్రయాణికులు", kn:"ಹತ್ತಿರದ ಪ್ರಯಾಣಿಕರು",
    ml:"അടുത്തുള്ള യാത്രക്കാർ", gu:"નજીકના મુસાફરો", mr:"जवळचे प्रवासी",
    pa:"ਨੇੜੇ ਦੇ ਯਾਤਰੀ", fa:"مسافران نزدیک", ur:"قریبی مسافر",
    sw:"Wasafiri wa karibu", zu:"Abahambi abasondelene", ca:"Viatgers propers",
    hr:"Putnici u blizini", sk:"Cestovatelia v okolí", sl:"Popotniki v bližini",
    lv:"Tuvumā esošie ceļotāji", lt:"Artimi keliautojai", et:"Lähedased reisijad",
    is:"Ferðalangar í nágrenninu"
  },
  "x4041": {
    ja:"名の旅行者が近くにいます！", zh:"位旅行者在附近！", es:"¡viajeros cerca!",
    fr:"voyageurs proches!", de:"Reisende in der Nähe!", pt:"viajantes por perto!",
    id:"wisatawan di sekitar!", vi:"du khách gần đây!", th:"นักเดินทางอยู่ใกล้ๆ!",
    ar:"مسافرون قريبون!", hi:"यात्री पास में!", ru:"путешественников рядом!",
    tr:"gezgin yakınında!", it:"viaggiatori vicini!", nl:"reizigers in de buurt!",
    pl:"podróżnicy w pobliżu!"
  },
  "x4042": {
    ja:"リアルタイム更新", zh:"实时更新", es:"Actualizaciones en tiempo real",
    fr:"Mises à jour en temps réel", de:"Echtzeit-Updates", pt:"Atualizações em tempo real",
    id:"Pembaruan real-time", vi:"Cập nhật theo thời gian thực", th:"อัปเดตแบบเรียลไทม์",
    ar:"تحديثات فورية", hi:"रियल-टाइम अपडेट", ru:"Обновления в реальном времени",
    tr:"Gerçek zamanlı güncellemeler", it:"Aggiornamenti in tempo reale",
    nl:"Real-time updates", pl:"Aktualizacje w czasie rzeczywistym"
  },
  "x4043": {
    ja:"ローカル", zh:"本地人", es:"Local", fr:"Local", de:"Einheimisch",
    pt:"Local", id:"Lokal", vi:"Người địa phương", th:"คนท้องถิ่น",
    ar:"محلي", hi:"स्थानीय", ru:"Местный", tr:"Yerel", it:"Locale",
    nl:"Lokaal", pl:"Lokalny", sv:"Lokalt", da:"Lokal", no:"Lokal", fi:"Paikallinen"
  },
  "x4044": {
    ja:"オンライン", zh:"在线", es:"En línea", fr:"En ligne", de:"Online",
    pt:"Online", id:"Online", vi:"Trực tuyến", th:"ออนไลน์", ar:"متصل",
    hi:"ऑनलाइन", ru:"Онлайн", tr:"Çevrimiçi", it:"Online", nl:"Online", pl:"Online"
  },
  "x4045": {
    ja:"このフィルターに近くの旅行者がいません", zh:"此筛选条件下没有附近旅行者",
    es:"No hay viajeros cercanos con este filtro", fr:"Aucun voyageur à proximité",
    de:"Keine Reisenden in der Nähe mit diesem Filter", pt:"Nenhum viajante próximo",
    id:"Tidak ada wisatawan di sekitar", vi:"Không có du khách nào với bộ lọc này",
    th:"ไม่มีนักเดินทางอยู่ใกล้ๆ", ar:"لا يوجد مسافرون قريبون", hi:"इस फ़िल्टर में पास कोई यात्री नहीं",
    ru:"Нет путешественников рядом с этим фильтром", tr:"Bu filtrele yakında gezgin yok"
  },
  "x4046": {
    ja:"別のフィルターを試すか、後で確認してください", zh:"尝试其他筛选条件或稍后再查看",
    es:"Prueba diferentes filtros o vuelve más tarde", fr:"Essayez d'autres filtres ou revenez plus tard",
    de:"Versuche andere Filter oder schaue später noch einmal", pt:"Tente filtros diferentes ou volte mais tarde",
    ru:"Попробуйте другие фильтры или проверьте позже", tr:"Farklı filtreler deneyin veya daha sonra tekrar bakın"
  },
  "x4047": {
    ja:"グルメ巡り", zh:"美食探访", es:"Gastronomía", fr:"Gastronomie", de:"Essen & Genuss",
    pt:"Gastronomia", id:"Kuliner", vi:"Ẩm thực", th:"อาหาร", ar:"طعام", hi:"खान-पान",
    ru:"Еда и напитки", tr:"Yeme-İçme", it:"Gastronomia", nl:"Eten & Drinken", pl:"Jedzenie"
  },
  "x4048": {
    ja:"観光", zh:"观光游览", es:"Turismo", fr:"Tourisme", de:"Sightseeing",
    pt:"Turismo", id:"Wisata", vi:"Tham quan", th:"ท่องเที่ยว", ar:"سياحة",
    hi:"पर्यटन", ru:"Достопримечательности", tr:"Gezi", it:"Turismo", nl:"Sightseeing", pl:"Zwiedzanie"
  },
  "x4049": {
    ja:"ビジネス", zh:"商务", es:"Negocios", fr:"Affaires", de:"Geschäft",
    pt:"Negócios", id:"Bisnis", vi:"Kinh doanh", th:"ธุรกิจ", ar:"أعمال",
    hi:"व्यापार", ru:"Бизнес", tr:"İş", it:"Affari", nl:"Zakelijk", pl:"Biznes"
  },
  "x4050": {
    ja:"地元の友達", zh:"本地朋友", es:"Amigos locales", fr:"Amis locaux",
    de:"Lokale Freunde", pt:"Amigos locais", id:"Teman lokal", vi:"Bạn địa phương",
    th:"เพื่อนท้องถิ่น", ar:"أصدقاء محليون", hi:"स्थानीय दोस्त", ru:"Местные друзья",
    tr:"Yerel Arkadaşlar", it:"Amici locali", nl:"Lokale vrienden", pl:"Lokalni przyjaciele"
  },
  "x4083": {
    ja:"近く", zh:"附近", es:"Cercano", fr:"À proximité", de:"In der Nähe",
    pt:"Próximo", id:"Terdekat", vi:"Gần đây", th:"ใกล้เคียง", ar:"قريب",
    hi:"पास में", ru:"Рядом", tr:"Yakın", it:"Vicino", nl:"Dichtbij", pl:"W pobliżu"
  },
  "x4084": {
    ja:"グルメ巡り", zh:"美食探访", es:"Gastronomía", fr:"Gastronomie", de:"Essen",
    pt:"Gastronomia", id:"Kuliner", vi:"Ẩm thực", th:"อาหาร", ar:"طعام",
    hi:"खाना-पीना", ru:"Еда", tr:"Yemek"
  },
  "x4085": {
    ja:"観光", zh:"观光", es:"Turismo", fr:"Tourisme", de:"Sightseeing",
    pt:"Turismo", id:"Wisata", vi:"Tham quan", th:"ท่องเที่ยว", ar:"سياحة",
    hi:"पर्यटन", ru:"Туризм", tr:"Gezi"
  },
  "x4086": {
    ja:"ビジネス", zh:"商务", es:"Negocios", fr:"Affaires", de:"Geschäft",
    pt:"Negócios", id:"Bisnis", vi:"Kinh doanh", th:"ธุรกิจ", ar:"أعمال",
    hi:"व्यापार", ru:"Бизнес", tr:"İş"
  },
  "x4087": {
    ja:"地元の友達", zh:"本地朋友", es:"Amigos locales", fr:"Amis locaux",
    de:"Lokale Freunde", pt:"Amigos locais", id:"Teman lokal", vi:"Bạn địa phương",
    th:"เพื่อนท้องถิ่น", ar:"أصدقاء محليون", hi:"स्थानीय दोस्त", ru:"Местные друзья", tr:"Yerel Arkadaşlar"
  },
  "x4088": {
    ja:"地元", zh:"本地", es:"Local", fr:"Local", de:"Einheimisch",
    pt:"Local", id:"Lokal", vi:"Địa phương", th:"ท้องถิ่น", ar:"محلي",
    hi:"स्थानीय", ru:"Местный", tr:"Yerel"
  },
  "x4089": {
    ja:"旅行者", zh:"旅行者", es:"Viajero", fr:"Voyageur", de:"Reisender",
    pt:"Viajante", id:"Wisatawan", vi:"Du khách", th:"นักเดินทาง", ar:"مسافر",
    hi:"यात्री", ru:"Путешественник", tr:"Gezgin"
  },
  "x4090": {
    ja:"すべて", zh:"全部", es:"Todo", fr:"Tout", de:"Alle", pt:"Todos",
    id:"Semua", vi:"Tất cả", th:"ทั้งหมด", ar:"الكل", hi:"सभी",
    ru:"Все", tr:"Tümü", it:"Tutto", nl:"Alles", pl:"Wszystkie",
    sv:"Alla", da:"Alle", no:"Alle", fi:"Kaikki", cs:"Vše", ro:"Toate",
    hu:"Mind", el:"Όλα", bg:"Всички", uk:"Всі", he:"הכל"
  },
  "x4091": {
    ja:"💚 いいね！", zh:"💚 喜欢了！", es:"💚 ¡Me gusta!", fr:"💚 Aimé!",
    de:"💚 Geliked!", pt:"💚 Curtiu!", id:"💚 Disukai!", vi:"💚 Đã thích!",
    th:"💚 ชอบแล้ว!", ar:"💚 أعجبني!", hi:"💚 पसंद किया!", ru:"💚 Понравилось!",
    tr:"💚 Beğenildi!", it:"💚 Piaciuto!", nl:"💚 Leuk bevonden!"
  },
  // Chat DM limit banner
  "z_autoz오늘메시지_879": {
    ja:"今日のメッセージ上限に達しました 🔒",
    zh:"今日消息次数已达上限 🔒", es:"Límite de mensajes de hoy alcanzado 🔒",
    fr:"Limite de messages atteinte aujourd'hui 🔒", de:"Tageslimit für Nachrichten erreicht 🔒",
    pt:"Limite de mensagens de hoje atingido 🔒", id:"Batas pesan hari ini telah tercapai 🔒",
    vi:"Đã đạt giới hạn tin nhắn hôm nay 🔒", th:"ถึงขีดจำกัดข้อความวันนี้แล้ว 🔒",
    ar:"تم الوصول إلى حد الرسائل اليوم 🔒", hi:"आज की मैसेज सीमा पूरी हो गई 🔒",
    ru:"Дневной лимит сообщений исчерпан 🔒", tr:"Bugünkü mesaj limitine ulaşıldı 🔒"
  },
  "z_autoz업그레이드_881": {
    ja:"アップグレード", zh:"升级", es:"Actualizar", fr:"Mettre à niveau",
    de:"Upgraden", pt:"Atualizar", id:"Tingkatkan", vi:"Nâng cấp",
    th:"อัปเกรด", ar:"ترقية", hi:"अपग्रेड", ru:"Улучшить", tr:"Yükselt",
    it:"Aggiorna", nl:"Upgraden", pl:"Uaktualnij"
  },
  "z_autoz오늘메시지_907": {
    ja:"今日のメッセージ上限に達しました 🔒",
    zh:"今日消息次数已达上限 🔒", es:"Límite de mensajes de hoy alcanzado 🔒",
    fr:"Limite de messages atteinte 🔒", de:"Tageslimit für Nachrichten erreicht 🔒",
    pt:"Limite de mensagens atingido 🔒", ru:"Лимит сообщений исчерпан 🔒", tr:"Mesaj limitine ulaşıldı 🔒"
  },
  "z_autozPlus로_908": {
    ja:"無制限でチャットするにはPlusにアップグレードしてください。",
    zh:"升级到Plus享受无限对话。", es:"Actualiza a Plus para conversaciones ilimitadas.",
    fr:"Passez à Plus pour des conversations illimitées.", de:"Upgrade auf Plus für unbegrenzte Gespräche.",
    pt:"Atualize para Plus para conversas ilimitadas.", ru:"Перейдите на Plus для неограниченного чата.",
    tr:"Sınırsız sohbet için Plus'a yükseltin."
  },
  // Plus modal title
  "z_autoz여행동행의_1361": {
    ja:"無制限の旅行同行者", zh:"无限旅行伴侣", es:"Compañeros de viaje ilimitados",
    fr:"Compagnons de voyage illimités", de:"Unbegrenzte Reisegefährten",
    pt:"Companheiros de viagem ilimitados", ru:"Неограниченные попутчики",
    tr:"Sınırsız seyahat arkadaşı"
  },
  "z_autoz7일무료체_1362": {
    ja:"7日間無料体験", zh:"7天免费试用", es:"Prueba gratuita de 7 días",
    fr:"Essai gratuit de 7 jours", de:"7-tägige kostenlose Testversion",
    pt:"Teste gratuito de 7 dias", ru:"7-дневный бесплатный период",
    tr:"7 günlük ücretsiz deneme"
  },
  // Plus modal feature comparison
  "z_autoz하루라이크_1315": {
    ja:"1日のいいね数", zh:"每日喜欢数", es:"Me gusta diarios", fr:"J'aime quotidiens",
    de:"Tägliche Likes", pt:"Curtidas diárias", id:"Suka harian", vi:"Lượt thích hàng ngày",
    th:"ไลค์รายวัน", ar:"إعجابات يومية", hi:"दैनिक लाइक", ru:"Ежедневные лайки", tr:"Günlük Beğeniler"
  },
  "z_autoz무제한14_1317": {
    ja:"無制限 ♾️", zh:"无限 ♾️", es:"Ilimitados ♾️", fr:"Illimité ♾️",
    de:"Unbegrenzt ♾️", pt:"Ilimitados ♾️", id:"Tak terbatas ♾️", vi:"Không giới hạn ♾️",
    th:"ไม่จำกัด ♾️", ar:"غير محدود ♾️", hi:"असीमित ♾️", ru:"Безлимитно ♾️", tr:"Sınırsız ♾️"
  },
  "z_autoz슈퍼라이크_1318": {
    ja:"スーパーライク", zh:"超级喜欢", es:"Super Like", fr:"Super Like",
    de:"Super Like", pt:"Super Like", id:"Super Like", vi:"Siêu Thích",
    th:"ซูเปอร์ไลค์", ar:"إعجاب فائق", hi:"सुपर लाइक", ru:"Суперлайк", tr:"Süper Beğeni"
  },
  "z_autoz나를좋아한_1321": {
    ja:"いいねしてくれた人を見る", zh:"查看喜欢我的人", es:"Ver quién te gustó",
    fr:"Voir qui vous a aimé", de:"Sehen wer dich geliked hat", pt:"Ver quem curtiu você",
    id:"Lihat yang menyukai saya", vi:"Xem ai đã thích bạn", th:"ดูคนที่ชอบคุณ",
    ar:"رؤية من أعجب بك", hi:"देखें कितने लोगों ने लाइक किया", ru:"Кто лайкнул тебя",
    tr:"Seni beğenenleri gör"
  },
  // Chat DM quick actions
  "z_autoz위치506_909": {
    ja:"位置", zh:"位置", es:"Ubicación", fr:"Position", de:"Standort",
    pt:"Localização", id:"Lokasi", vi:"Vị trí", th:"ตำแหน่ง", ar:"موقع",
    hi:"स्थान", ru:"Местоположение", tr:"Konum"
  },
  "z_autoz제안507_910": {
    ja:"提案", zh:"提议", es:"Propuesta", fr:"Proposition", de:"Vorschlag",
    pt:"Proposta", id:"Usulan", vi:"Đề nghị", th:"ข้อเสนอ", ar:"اقتراح",
    hi:"प्रस्ताव", ru:"Предложение", tr:"Öneri"
  },
  "z_autoz일정공유5_911": {
    ja:"日程共有", zh:"行程分享", es:"Compartir itinerario", fr:"Partager le programme",
    de:"Zeitplan teilen", pt:"Compartilhar itinerário", ru:"Расписание", tr:"Takvim paylaş"
  },
  "z_autoz자동번역4_889": {
    ja:"自動翻訳", zh:"自动翻译", es:"Traducción automática", fr:"Traduction automatique",
    de:"Automatische Übersetzung", pt:"Tradução automática", id:"Terjemahan otomatis",
    vi:"Dịch tự động", th:"แปลอัตโนมัติ", ar:"ترجمة تلقائية", hi:"ऑटो अनुवाद",
    ru:"Авто-перевод", tr:"Otomatik çeviri"
  },
  // Subscription features
  "z_autoz글로벌매칭_1329": {
    ja:"グローバルマッチング", zh:"全球匹配", es:"Emparejamiento global",
    fr:"Correspondance mondiale", de:"Globales Matching", pt:"Matching global",
    ru:"Глобальный матчинг", tr:"Global Eşleştirme"
  },
  "z_autoz여행DNA_1332": {
    ja:"旅行DNAレポート", zh:"旅行DNA报告", es:"Informe de ADN de viaje",
    fr:"Rapport ADN voyage", de:"Reise-DNA-Bericht", pt:"Relatório DNA de viagem",
    ru:"Отчёт ДНК путешествий", tr:"Seyahat DNA Raporu"
  },
  // Distance display
  "p30": {
    ja:"{{dist}}m先", zh:"距{{dist}}米", es:"A {{dist}}m", fr:"À {{dist}}m",
    de:"{{dist}}m entfernt", pt:"A {{dist}}m", id:"{{dist}}m jauh", vi:"Cách {{dist}}m",
    th:"ห่าง {{dist}}ม.", ar:"على بعد {{dist}}م", hi:"{{dist}}मी. दूर",
    ru:"{{dist}}м от вас", tr:"{{dist}}m uzakta"
  },
  "p31": {
    ja:"{{city}}周辺 · リアルタイム更新", zh:"{{city}}周边 · 实时更新",
    es:"Cerca de {{city}} · Tiempo real", fr:"Près de {{city}} · Temps réel",
    de:"Rund um {{city}} · Echtzeit", pt:"Perto de {{city}} · Tempo real",
    id:"Sekitar {{city}} · Real-time", vi:"Gần {{city}} · Thời gian thực",
    th:"รอบๆ {{city}} · อัปเดตเรียลไทม์", ar:"حول {{city}} · الوقت الحقيقي",
    hi:"{{city}} के आसपास · रियल-टाइम", ru:"Вокруг {{city}} · Реальное время",
    tr:"{{city}} çevresinde · Gerçek zamanlı"
  },
  "t5008": {
    ja:"無料メッセージ {{v0}}/{{v1}} — Plusは無制限",
    zh:"免费消息 {{v0}}/{{v1}} — Plus无限制",
    es:"Mensajes gratis {{v0}}/{{v1}} — Ilimitados con Plus",
    fr:"Messages gratuits {{v0}}/{{v1}} — Illimités avec Plus",
    de:"Kostenlose Nachrichten {{v0}}/{{v1}} — Unbegrenzt mit Plus",
    pt:"Mensagens grátis {{v0}}/{{v1}} — Ilimitadas com Plus",
    id:"Pesan gratis {{v0}}/{{v1}} — Tidak terbatas dengan Plus",
    vi:"Tin nhắn miễn phí {{v0}}/{{v1}} — Không giới hạn với Plus",
    th:"ข้อความฟรี {{v0}}/{{v1}} — ไม่จำกัดด้วย Plus",
    ar:"رسائل مجانية {{v0}}/{{v1}} — غير محدودة مع Plus",
    hi:"मुफ़्त मैसेज {{v0}}/{{v1}} — Plus के साथ असीमित",
    ru:"Бесплатных сообщений {{v0}}/{{v1}} — Безлимитно с Plus",
    tr:"Ücretsiz mesaj {{v0}}/{{v1}} — Plus ile sınırsız"
  },
};

const files = fs.readdirSync(LOCALES_DIR)
  .filter(f => f.endsWith('.ts') && f !== 'ko.ts' && f !== 'en.ts');

let totalUpdated = 0;

for (const file of files) {
  const lang = file.replace('.ts', '');
  const fp = path.join(LOCALES_DIR, file);
  let content = fs.readFileSync(fp, 'utf8');
  const before = content;
  let updatedCount = 0;

  for (const [key, translations] of Object.entries(TRANSLATIONS)) {
    const nativeVal = translations[lang];
    if (!nativeVal) continue; // No native translation defined, skip (keep existing)
    
    // Find lines with this key and replace the value
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Check if this line contains the key
      if (line.includes(`"${key}":`) || line.includes(`"${key}" :`)) {
        // Replace the value
        const newLine = line.replace(
          /("(?:[^"\\]|\\.)*")\s*:\s*"(?:[^"\\]|\\.)*"(,?\s*)$/,
          (_, k, comma) => `${k}: "${nativeVal.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"${comma}`
        );
        if (newLine !== line) {
          lines[i] = newLine;
          updatedCount++;
        }
        break;
      }
    }
    content = lines.join('\n');
  }

  if (content !== before) {
    fs.writeFileSync(fp, content, 'utf8');
    totalUpdated++;
    console.log(`${lang}: updated ${updatedCount} keys`);
  }
}

console.log(`\nTotal locale files updated: ${totalUpdated}`);
