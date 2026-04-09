/**
 * fix_safety_page_translations.mjs
 * Updates safety check-in page z_ keys in all locales with native translations
 */
import fs from 'fs';
import path from 'path';

const LOCALES_DIR = './src/i18n/locales';

// Key -> {lang: translation}  (based on ko.ts keys for SafetyCheckInPage)
const TRANSLATIONS = {
  // Safety Check-In Page strings
  "z_만남장소와시간을입력_33": {
    en: "Please enter meeting place and time",
    ja: "待ち合わせ場所と時間を入力してください",
    zh: "请输入见面地点和时间",
    es: "Por favor ingrese el lugar y hora de encuentro",
    fr: "Veuillez entrer le lieu et l'heure de la rencontre",
    de: "Bitte Treffpunkt und Uhrzeit eingeben",
    pt: "Por favor, insira o local e hora do encontro",
    id: "Silakan masukkan tempat dan waktu pertemuan",
    vi: "Vui lòng nhập địa điểm và thời gian gặp mặt",
    th: "กรุณาระบุสถานที่และเวลานัดหมาย",
    ar: "يرجى إدخال مكان وموعد اللقاء",
    hi: "कृपया मिलने का स्थान और समय दर्ज करें",
    ru: "Пожалуйста, введите место и время встречи",
    tr: "Lütfen buluşma yeri ve zamanını girin"
  },
  "z_안전체크인등록완료_34": {
    en: "✅ Safety check-in registered!",
    ja: "✅ 安全チェックイン登録完了！",
    zh: "✅ 安全登记完成！",
    es: "✅ ¡Registro de seguridad completado!",
    fr: "✅ Enregistrement de sécurité complété!",
    de: "✅ Sicherheits-Check-in registriert!",
    pt: "✅ Check-in de segurança registrado!",
    id: "✅ Check-in keamanan terdaftar!",
    vi: "✅ Đăng ký an toàn hoàn tất!",
    th: "✅ ลงทะเบียนเช็คอินความปลอดภัยแล้ว!",
    ar: "✅ تم تسجيل تسجيل الوصول الأمني!",
    hi: "✅ सुरक्षा चेक-इन पंजीकृत!",
    ru: "✅ Безопасный чек-ин зарегистрирован!",
    tr: "✅ Güvenlik check-in kaydedildi!"
  },
  "z_비상연락처에링크를공_35": {
    en: "We shared the link with your emergency contact",
    ja: "緊急連絡先にリンクを共有しました",
    zh: "已与紧急联系人共享链接",
    es: "Compartimos el enlace con tu contacto de emergencia",
    fr: "Nous avons partagé le lien avec votre contact d'urgence",
    de: "Link wurde mit Notfallkontakt geteilt",
    pt: "Compartilhamos o link com seu contato de emergência",
    ru: "Мы поделились ссылкой с вашим экстренным контактом",
    tr: "Acil kişinizle bağlantıyı paylaştık"
  },
  "z_등록실패_36": {
    en: "Registration failed",
    ja: "登録失敗",
    zh: "注册失败",
    es: "Error de registro",
    fr: "Échec de l'enregistrement",
    de: "Registrierung fehlgeschlagen",
    pt: "Falha no registro",
    ru: "Ошибка регистрации",
    tr: "Kayıt başarısız"
  },
  "z_무사히만나셨군요_37": {
    en: "🎉 You met safely!",
    ja: "🎉 無事に会えましたね！",
    zh: "🎉 你们安全见面了！",
    es: "🎉 ¡Se encontraron con seguridad!",
    fr: "🎉 Vous vous êtes rencontrés en sécurité!",
    de: "🎉 Sie haben sich sicher getroffen!",
    pt: "🎉 Vocês se encontraram com segurança!",
    ru: "🎉 Вы безопасно встретились!",
    tr: "🎉 Güvenle buluştunuz!"
  },
  "z_동행후기를남겨보세요_38": {
    en: "Please leave a review of your companion",
    ja: "同行レビューを書いてみましょう",
    zh: "请留下您的同伴评价",
    es: "Por favor deja una reseña de tu compañero",
    fr: "Laissez un avis sur votre compagnon",
    de: "Hinterlassen Sie eine Bewertung Ihres Begleiters",
    pt: "Por favor, deixe uma avaliação do seu companheiro",
    ru: "Оставьте отзыв о вашем попутчике",
    tr: "Yol arkadaşınız için yorum bırakın"
  },
  "z_Migo안전체크인_39": {
    en: "Migo Safety Check-In",
    ja: "Migo 安全チェックイン",
    zh: "Migo 安全打卡",
    es: "Migo Check-In de Seguridad",
    fr: "Migo Enregistrement de Sécurité",
    de: "Migo Sicherheits-Check-in",
    pt: "Migo Check-In de Segurança",
    ru: "Migo Безопасный чек-ин",
    tr: "Migo Güvenlik Check-in"
  },
  "z_링크복사됨_41": {
    en: "Link copied!",
    ja: "リンクコピー済み！",
    zh: "链接已复制！",
    es: "¡Enlace copiado!",
    fr: "Lien copié!",
    de: "Link kopiert!",
    pt: "Link copiado!",
    ru: "Ссылка скопирована!",
    tr: "Bağlantı kopyalandı!"
  },
  "z_비상연락처에붙여넣어_42": {
    en: "Paste and share with your emergency contact",
    ja: "緊急連絡先に貼り付けて共有してください",
    zh: "粘贴并共享给紧急联系人",
    es: "Pega y comparte con tu contacto de emergencia",
    fr: "Collez et partagez avec votre contact d'urgence",
    de: "Einfügen und mit Notfallkontakt teilen",
    pt: "Cole e compartilhe com seu contato de emergência",
    ru: "Вставьте и отправьте экстренному контакту",
    tr: "Acil kişinizle yapıştırıp paylaşın"
  },
  "z_동행안전시스템_43": {
    en: "Companion Safety System",
    ja: "同行安全システム",
    zh: "同伴安全系统",
    es: "Sistema de Seguridad para Compañeros",
    fr: "Système de Sécurité des Compagnons",
    de: "Begleiter-Sicherheitssystem",
    pt: "Sistema de Segurança para Companheiros",
    id: "Sistem Keamanan Teman Perjalanan",
    vi: "Hệ thống An toàn Bạn đồng hành",
    th: "ระบบความปลอดภัยสำหรับเพื่อนร่วมทาง",
    ar: "نظام سلامة الرفيق",
    hi: "यात्री सुरक्षा प्रणाली",
    ru: "Система безопасности попутчика",
    tr: "Yol Arkadaşı Güvenlik Sistemi"
  },
  "z_Migo만의여행자안_44": {
    en: "Migo's exclusive traveler safety protection",
    ja: "Migoだけの旅行者安全保護機能",
    zh: "Migo独有的旅行者安全保护功能",
    es: "Protección exclusiva de seguridad para viajeros de Migo",
    fr: "Protection de sécurité exclusive pour voyageurs de Migo",
    de: "Migoexklusiver Reisender-Sicherheitsschutz",
    pt: "Proteção de segurança exclusiva da Migo para viajantes",
    ru: "Эксклюзивная защита безопасности путешественников Migo",
    tr: "Migo'nun münhasır gezgin güvenlik koruması"
  },
  "z_여행자를지키는_45": {
    en: "Smart Safety Net",
    ja: "旅行者を守る",
    zh: "保护旅行者的",
    es: "Red de Seguridad Inteligente",
    fr: "Filet de Sécurité Intelligent",
    de: "Intelligentes Sicherheitsnetz",
    pt: "Rede de Segurança Inteligente",
    id: "Jaring Keselamatan Cerdas",
    vi: "Mạng An toàn Thông minh",
    th: "เครือข่ายความปลอดภัยอัจฉริยะ",
    ar: "شبكة الأمان الذكية للمسافر",
    hi: "स्मार्ट सुरक्षा नेट",
    ru: "Умная защитная сеть для путешественников",
    tr: "Akıllı Güvenlik Ağı"
  },
  "z_스마트안전망_46": {
    en: "for Travelers",
    ja: "スマート安全網",
    zh: "智能安全网",
    es: "para Viajeros",
    fr: "pour les Voyageurs",
    de: "für Reisende",
    pt: "para Viajantes",
    id: "untuk Wisatawan",
    vi: "cho Du khách",
    th: "สำหรับนักเดินทาง",
    ar: "للمسافرين",
    hi: "यात्रियों के लिए",
    ru: "для Путешественников",
    tr: "Gezginler İçin"
  },
  "z_틴더미프에는없는Mi_47": {
    en: "Unlike Tinder & meetup apps,",
    ja: "ティンダー・Meetupにはない、Migoだけの",
    zh: "与交友软件不同，Migo独有的",
    es: "A diferencia de Tinder y apps de encuentro,",
    fr: "Contrairement à Tinder et applications de rencontre,",
    de: "Anders als Tinder und Begegnungs-Apps,",
    pt: "Diferente do Tinder e apps de encontro,",
    ru: "В отличие от Tinder и встреч-приложений,",
    tr: "Tinder ve buluşma uygulamalarından farklı olarak,"
  },
  "z_동행안전시스템입니다_48": {
    en: "this is Migo's companion safety system",
    ja: "同行安全システムです",
    zh: "这是Migo的同伴安全系统",
    es: "este es el sistema de seguridad de compañeros de Migo",
    fr: "c'est le système de sécurité des compagnons de Migo",
    de: "dies ist Migoein Begleiter-Sicherheitssystem",
    pt: "este é o sistema de segurança de companheiros da Migo",
    ru: "это система безопасности попутчика Migo",
    tr: "bu Migo'nun yol arkadaşı güvenlik sistemidir"
  },
  "z_만남장소시간등록_49": {
    en: "Register Meeting Place & Time",
    ja: "待ち合わせ場所・時間登録",
    zh: "登记见面地点和时间",
    es: "Registrar Lugar y Hora de Encuentro",
    fr: "Enregistrer Lieu et Heure de Rencontre",
    de: "Treffpunkt und Uhrzeit registrieren",
    pt: "Registrar Local e Hora do Encontro",
    id: "Daftarkan Tempat & Waktu Pertemuan",
    vi: "Đăng ký Địa điểm & Thời gian Gặp mặt",
    th: "ลงทะเบียนสถานที่และเวลานัดหมาย",
    ar: "تسجيل مكان وموعد اللقاء",
    hi: "मिलने की जगह और समय दर्ज करें",
    ru: "Зарегистрировать место и время встречи",
    tr: "Buluşma Yeri ve Zamanını Kaydet"
  },
  "z_동행미팅정보를앱에미_50": {
    en: "Pre-register meeting info in app",
    ja: "同行ミーティング情報をアプリに事前登録",
    zh: "提前在应用程序中登记会面信息",
    es: "Pre-registrar info de reunión en la app",
    fr: "Pré-enregistrez les infos de réunion dans l'app",
    de: "Treffen-Infos vorher in der App registrieren",
    pt: "Pré-registrar info de reunião no app",
    ru: "Заранее зарегистрируйте информацию о встрече",
    tr: "Buluşma bilgilerini önceden uygulamaya kaydedin"
  },
  "z_비상연락처에자동공유_51": {
    en: "Auto-share with Emergency Contact",
    ja: "緊急連絡先に自動共有",
    zh: "自动与紧急联系人共享",
    es: "Compartir automáticamente con Contacto de Emergencia",
    fr: "Partage automatique avec Contact d'urgence",
    de: "Automatisch mit Notfallkontakt teilen",
    pt: "Compartilhar automaticamente com Contato de Emergência",
    id: "Auto-bagikan ke Kontak Darurat",
    vi: "Tự động chia sẻ với Liên lạc Khẩn cấp",
    th: "แชร์อัตโนมัติกับผู้ติดต่อฉุกเฉิน",
    ar: "مشاركة تلقائية مع جهة الاتصال الطارئة",
    hi: "आपातकालीन संपर्क के साथ स्वतः साझा करें",
    ru: "Автоматически поделиться с экстренным контактом",
    tr: "Acil kişiyle otomatik paylaş"
  },
  "z_링크하나로위치정보즉_52": {
    en: "Instantly share location with one link",
    ja: "リンク一つで位置情報を即座に共有",
    zh: "一个链接即时共享位置信息",
    es: "Comparte ubicación al instante con un enlace",
    fr: "Partagez la localisation instantanément avec un lien",
    de: "Standort mit einem Link sofort teilen",
    pt: "Compartilhe localização instantaneamente com um link",
    ru: "Мгновенно поделитесь местоположением по одной ссылке",
    tr: "Bir bağlantıyla konumu anında paylaşın"
  },
  "z_귀가완료체크인_53": {
    en: "Safe Return Check-In",
    ja: "帰宅完了チェックイン",
    zh: "安全归来打卡",
    es: "Check-in de Regreso Seguro",
    fr: "Check-in de Retour en Sécurité",
    de: "Sicherer Heimweg-Check-in",
    pt: "Check-in de Retorno Seguro",
    id: "Check-in Pulang Selamat",
    vi: "Báo an toàn khi về nhà",
    th: "เช็คอินกลับบ้านปลอดภัย",
    ar: "تسجيل العودة الآمنة",
    hi: "सुरक्षित वापसी चेक-इन",
    ru: "Чек-ин безопасного возвращения",
    tr: "Güvenli Dönüş Check-in"
  },
  "z_무사히귀가했다고알려_54": {
    en: "Let us know you've returned safely",
    ja: "無事に帰宅したことを知らせてください",
    zh: "请告知您已安全回家",
    es: "Avísanos que has regresado con seguridad",
    fr: "Dites-nous que vous êtes rentré en sécurité",
    de: "Teilen Sie mit, dass Sie sicher zurückgekehrt sind",
    pt: "Avise-nos que você voltou com segurança",
    ru: "Сообщите нам, что вы вернулись безопасно",
    tr: "Güvenle döndüğünüzü bildirin"
  },
  "z_SOS긴급알림_55": {
    en: "SOS Emergency Alert",
    ja: "SOS緊急アラート",
    zh: "SOS紧急警报",
    es: "Alerta de Emergencia SOS",
    fr: "Alerte d'urgence SOS",
    de: "SOS Notfallalarm",
    pt: "Alerta de Emergência SOS",
    id: "Peringatan Darurat SOS",
    vi: "Cảnh báo khẩn cấp SOS",
    th: "การแจ้งเตือนฉุกเฉิน SOS",
    ar: "تنبيه طوارئ SOS",
    hi: "SOS आपातकालीन जगा",
    ru: "Экстренный сигнал SOS",
    tr: "SOS Acil Uyarı"
  },
  "z_위험시비상연락처에즉_56": {
    en: "Instant alert to emergency contact in danger",
    ja: "危険時に緊急連絡先へ即座に通知送信",
    zh: "危险时立即向紧急联系人发送警报",
    es: "Alerta instantánea al contacto de emergencia en peligro",
    fr: "Alarme instantanée au contact d'urgence en danger",
    de: "Sofortige Benachrichtigung an Notfallkontakt in Gefahr",
    pt: "Alerta instantâneo para contato de emergência em perigo",
    ru: "Мгновенное оповещение экстренного контакта при опасности",
    tr: "Tehlike durumunda acil kişiye anında uyarı"
  },
  "z_안전체크인등록하기_57": {
    en: "Register Safety Check-In",
    ja: "安全チェックインを登録",
    zh: "注册安全打卡",
    es: "Registrar Check-In de Seguridad",
    fr: "Enregistrer Check-In de Sécurité",
    de: "Sicherheits-Check-in registrieren",
    pt: "Registrar Check-In de Segurança",
    id: "Daftarkan Check-in Keamanan",
    vi: "Đăng ký Check-in An toàn",
    th: "ลงทะเบียนเช็คอินความปลอดภัย",
    ar: "تسجيل تسجيل الوصول الأمني",
    hi: "सुरक्षा चेक-इन दर्ज करें",
    ru: "Зарегистрировать безопасный чек-ин",
    tr: "Güvenlik Check-in'i Kaydet"
  },
  "z_만남정보등록_58": {
    en: "📍 Meeting Info Registration",
    ja: "📍 待ち合わせ情報登録",
    zh: "📍 见面信息登记",
    es: "📍 Registro de Información de Encuentro",
    fr: "📍 Enregistrement Info de Rencontre",
    de: "📍 Treff-Informationsregistrierung",
    pt: "📍 Registro de Informações de Encontro",
    ru: "📍 Регистрация информации о встрече",
    tr: "📍 Buluşma Bilgisi Kaydı"
  },
  "z_미팅전에아래정보를등_59": {
    en: "Register the info below before meeting for quick help in emergencies",
    ja: "会う前に以下の情報を登録すると、緊急時に素早い支援が受けられます",
    zh: "在见面前登记以下信息，紧急情况下可以快速获得帮助",
    es: "Registra la información antes de quedar para ayuda rápida en emergencias",
    fr: "Enregistrez ces infos avant de vous retrouver pour une aide rapide en urgence",
    de: "Registrieren Sie die Infos vor dem Treffen für schnelle Hilfe im Notfall",
    pt: "Registre as informações antes do encontro para ajuda rápida em emergências",
    ru: "Зарегистрируйте информацию до встречи для быстрой помощи в экстренных ситуациях",
    tr: "Acil durumlarda hızlı yardım için buluşmadan önce bilgileri kaydedin"
  },
  "z_만남장소_60": {
    en: "Meeting Place",
    ja: "待ち合わせ場所",
    zh: "见面地点",
    es: "Lugar de Encuentro",
    fr: "Lieu de Rencontre",
    de: "Treffpunkt",
    pt: "Local de Encontro",
    id: "Tempat Pertemuan",
    vi: "Địa điểm Gặp mặt",
    th: "สถานที่นัดหมาย",
    ar: "مكان اللقاء",
    hi: "मिलने की जगह",
    ru: "Место встречи",
    tr: "Buluşma Yeri"
  },
  "z_예홍대입구역2번출구_61": {
    en: "e.g. Entrance of Central Park, Starbucks",
    ja: "例: 新宿駅東口、スターバックス",
    zh: "例：地铁站A出口，星巴克",
    es: "ej. Entrada del Parque Central, Starbucks",
    fr: "ex. Entrée du Parc Central, Starbucks",
    de: "z.B. Hauptbahnhof Eingang, Starbucks",
    pt: "ex. Entrada do Parque Central, Starbucks",
    ru: "напр. Вход в Центральный парк, Starbucks",
    tr: "ör. Merkez Park Girişi, Starbucks"
  },
  "z_만남시간_62": {
    en: "Meeting Time",
    ja: "待ち合わせ時間",
    zh: "见面时间",
    es: "Hora de Encuentro",
    fr: "Heure de Rencontre",
    de: "Treffzeit",
    pt: "Hora do Encontro",
    id: "Waktu Pertemuan",
    vi: "Thời gian Gặp mặt",
    th: "เวลานัดหมาย",
    ar: "موعد اللقاء",
    hi: "मिलने का समय",
    ru: "Время встречи",
    tr: "Buluşma Zamanı"
  },
  "z_비상연락처등록_63": {
    en: "Emergency Contact Registration",
    ja: "緊急連絡先登録",
    zh: "紧急联系人登记",
    es: "Registro de Contacto de Emergencia",
    fr: "Enregistrement Contact d'urgence",
    de: "Notfallkontakt-Registrierung",
    pt: "Registro de Contato de Emergência",
    ru: "Регистрация экстренного контакта",
    tr: "Acil Kişi Kaydı"
  },
  "z_선택_64": {
    en: "(optional)",
    ja: "（任意）",
    zh: "（可选）",
    es: "(opcional)",
    fr: "(optionnel)",
    de: "(optional)",
    pt: "(opcional)",
    ru: "(необязательно)",
    tr: "(isteğe bağlı)"
  },
  "z_연락처이름예엄마_65": {
    en: "Contact name (e.g. Mom)",
    ja: "連絡先の名前（例：お母さん）",
    zh: "联系人姓名（例：妈妈）",
    es: "Nombre del contacto (ej. Mamá)",
    fr: "Nom du contact (ex. Maman)",
    de: "Kontaktname (z.B. Mama)",
    pt: "Nome do contato (ex. Mãe)",
    ru: "Имя контакта (напр. Мама)",
    tr: "Kişi adı (ör. Anne)"
  },
  "z_전화번호또는카카오톡_66": {
    en: "Phone number or messaging ID",
    ja: "電話番号またはメッセージID",
    zh: "电话号码或消息ID",
    es: "Número de teléfono o ID de mensajería",
    fr: "Numéro de téléphone ou ID de messagerie",
    de: "Telefonnummer oder Messaging-ID",
    pt: "Número de telefone ou ID de mensagem",
    ru: "Номер телефона или ID для сообщений",
    tr: "Telefon numarası veya mesajlaşma ID'si"
  },
  "z_안전체크인등록_67": {
    en: "Register Safety Check-In",
    ja: "安全チェックイン登録",
    zh: "注册安全打卡",
    es: "Registrar Check-In de Seguridad",
    fr: "Enregistrer Check-In de Sécurité",
    de: "Sicherheits-Check-in registrieren",
    pt: "Registrar Check-In de Segurança",
    ru: "Зарегистрировать безопасный чек-ин",
    tr: "Güvenlik Check-in Kaydet"
  },
  "z_안전모드활성화중_68": {
    en: "Safety Mode Active",
    ja: "安全モード有効中",
    zh: "安全模式已激活",
    es: "Modo de Seguridad Activo",
    fr: "Mode Sécurité Actif",
    de: "Sicherheitsmodus aktiv",
    pt: "Modo de Segurança Ativo",
    ru: "Режим безопасности активен",
    tr: "Güvenlik Modu Etkin"
  },
  "z_비상연락처에링크를공_69": {
    en: "Please share the link with your emergency contact",
    ja: "緊急連絡先にリンクを共有してください",
    zh: "请与紧急联系人共享链接",
    es: "Por favor comparte el enlace con tu contacto de emergencia",
    fr: "Veuillez partager le lien avec votre contact d'urgence",
    de: "Bitte teilen Sie den Link mit Ihrem Notfallkontakt",
    pt: "Por favor, compartilhe o link com seu contato de emergência",
    ru: "Пожалуйста, поделитесь ссылкой с экстренным контактом",
    tr: "Lütfen bağlantıyı acil kişinizle paylaşın"
  },
  "z_등록된만남정보_70": {
    en: "Registered Meeting Info",
    ja: "登録済み待ち合わせ情報",
    zh: "已登记见面信息",
    es: "Información de Encuentro Registrada",
    fr: "Infos de Rencontre Enregistrées",
    de: "Registrierte Treffen-Informationen",
    pt: "Informações de Encontro Registradas",
    ru: "Зарегистрированная информация о встрече",
    tr: "Kayıtlı Buluşma Bilgisi"
  },
  "z_비상연락처에공유하기_71": {
    en: "Share with Emergency Contact",
    ja: "緊急連絡先に共有する",
    zh: "与紧急联系人共享",
    es: "Compartir con Contacto de Emergencia",
    fr: "Partager avec Contact d'urgence",
    de: "Mit Notfallkontakt teilen",
    pt: "Compartilhar com Contato de Emergência",
    ru: "Поделиться с экстренным контактом",
    tr: "Acil Kişiyle Paylaş"
  },
  "z_무사히귀가완료_72": {
    en: "Safe Return Complete ✅",
    ja: "無事に帰宅完了 ✅",
    zh: "安全归来完成 ✅",
    es: "Regreso Seguro Completado ✅",
    fr: "Retour en Sécurité Complété ✅",
    de: "Sicherer Heimweg abgeschlossen ✅",
    pt: "Retorno Seguro Concluído ✅",
    ru: "Безопасное возвращение завершено ✅",
    tr: "Güvenli Dönüş Tamamlandı ✅"
  },
  "z_SOS발송됨_73": {
    en: "🚨 SOS Sent",
    ja: "🚨 SOS送信済み",
    zh: "🚨 SOS已发送",
    es: "🚨 SOS Enviado",
    fr: "🚨 SOS Envoyé",
    de: "🚨 SOS gesendet",
    pt: "🚨 SOS Enviado",
    ru: "🚨 SOS отправлен",
    tr: "🚨 SOS Gönderildi"
  },
  "z_비상연락처에긴급알림_74": {
    en: "Emergency alert sent to your emergency contact",
    ja: "緊急連絡先に緊急アラートを送りました",
    zh: "已向紧急联系人发送紧急警报",
    es: "Alerta de emergencia enviada a tu contacto de emergencia",
    fr: "Alerte d'urgence envoyée à votre contact d'urgence",
    de: "Notfallalarm an Notfallkontakt gesendet",
    pt: "Alerta de emergência enviado ao contato de emergência",
    ru: "Экстренный сигнал отправлен вашему контакту",
    tr: "Acil kişinize acil uyarı gönderildi"
  },
  "z_SOS긴급알림발송_75": {
    en: "Send SOS Emergency Alert",
    ja: "SOS緊急アラート送信",
    zh: "发送SOS紧急警报",
    es: "Enviar Alerta de Emergencia SOS",
    fr: "Envoyer Alerte d'urgence SOS",
    de: "SOS Notfallalarm senden",
    pt: "Enviar Alerta de Emergência SOS",
    ru: "Отправить экстренный сигнал SOS",
    tr: "SOS Acil Uyarısı Gönder"
  },
  "z_무사히돌아오셨군요_76": {
    en: "You returned safely! 🎉",
    ja: "無事に帰って来ましたね！🎉",
    zh: "您已安全归来！🎉",
    es: "¡Regresó con seguridad! 🎉",
    fr: "Vous êtes revenu en sécurité! 🎉",
    de: "Sie sind sicher zurückgekehrt! 🎉",
    pt: "Você voltou com segurança! 🎉",
    ru: "Вы благополучно вернулись! 🎉",
    tr: "Güvenle geri döndünüz! 🎉"
  },
  "z_좋은동행되셨나요_77": {
    en: "How was your travel companion?",
    ja: "良い同行でしたか？",
    zh: "旅行伴侣怎么样？",
    es: "¿Qué tal fue tu compañero de viaje?",
    fr: "Comment était votre compagnon de voyage?",
    de: "Wie war Ihr Reisegefährte?",
    pt: "Como foi seu companheiro de viagem?",
    ru: "Каким был ваш попутчик?",
    tr: "Yol arkadaşınız nasıldı?"
  },
  "z_후기를남겨주시면다른_78": {
    en: "Your review will help other travelers",
    ja: "レビューを残していただくと他の旅行者の参考になります",
    zh: "您的评价将帮助其他旅行者",
    es: "Tu reseña ayudará a otros viajeros",
    fr: "Votre avis aidera d'autres voyageurs",
    de: "Ihre Bewertung wird anderen Reisenden helfen",
    pt: "Sua avaliação ajudará outros viajantes",
    ru: "Ваш отзыв поможет другим путешественникам",
    tr: "Yorumunuz diğer gezginlere yardımcı olacak"
  },
  "z_동행후기작성하기_79": {
    en: "Write Companion Review",
    ja: "同行レビューを書く",
    zh: "写旅伴评价",
    es: "Escribir Reseña del Compañero",
    fr: "Écrire un Avis sur le Compagnon",
    de: "Begleiter-Bewertung schreiben",
    pt: "Escrever Avaliação do Companheiro",
    ru: "Написать отзыв о попутчике",
    tr: "Yol Arkadaşı Yorumu Yaz"
  },
  "z_홈으로돌아가기_80": {
    en: "Go back to Home",
    ja: "ホームへ戻る",
    zh: "返回首页",
    es: "Volver al Inicio",
    fr: "Retourner à l'Accueil",
    de: "Zurück zur Startseite",
    pt: "Voltar ao Início",
    id: "Kembali ke Beranda",
    vi: "Về Trang chủ",
    th: "กลับหน้าหลัก",
    ar: "العودة إلى الرئيسية",
    hi: "होम पर वापस जाएं",
    ru: "Вернуться на главную",
    tr: "Ana Sayfaya Dön"
  }
};

const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.ts') && f !== 'ko.ts');
let totalUpdated = 0;

for (const file of files) {
  const lang = file.replace('.ts', '');
  const fp = path.join(LOCALES_DIR, file);
  let lines = fs.readFileSync(fp, 'utf8').split('\n');
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const [key, translations] of Object.entries(TRANSLATIONS)) {
      const nativeVal = translations[lang];
      if (!nativeVal) continue;
      
      if (line.includes(`"${key}":`) || line.includes(`"${key}" :`)) {
        const newLine = line.replace(
          /("(?:[^"\\]|\\.)*")\s*:\s*"(?:[^"\\]|\\.)*"(,?)/,
          (_, k, comma) => `${k}: "${nativeVal.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"${comma}`
        );
        if (newLine !== line) {
          lines[i] = newLine;
          changed = true;
        }
        break;
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
