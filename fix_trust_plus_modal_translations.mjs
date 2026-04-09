/**
 * fix_trust_plus_modal_translations.mjs  
 * Injects native translations for TrustVerifyModal (1298-1334) and PlusModal (1307-1357) keys
 */
import fs from 'fs';
import path from 'path';

const LOCALES_DIR = './src/i18n/locales';

const TRANSLATIONS = {
  // ── TrustVerifyModal keys ──────────────────────────────────────────────────
  "z_autozLv1베이_1298": {
    en: "✅ Basic Verification", ja: "✅ ベーシック認証", zh: "✅ 基本认证",
    es: "✅ Verificación Básica", fr: "✅ Vérification Basique",
    de: "✅ Basisverifizierung", pt: "✅ Verificação Básica",
    id: "✅ Verifikasi Dasar", vi: "✅ Xác thực Cơ bản", th: "✅ การยืนยันพื้นฐาน",
    ar: "✅ التحقق الأساسي", hi: "✅ बेसिक सत्यापन", ru: "✅ Базовая верификация",
    tr: "✅ Temel Doğrulama"
  },
  "z_autoz본인인증9_1299": {
    en: "Phone verification", ja: "本人確認", zh: "手机验证",
    es: "Verificación por teléfono", fr: "Vérification par téléphone",
    de: "Telefonverifizierung", pt: "Verificação por telefone",
    ru: "Верификация по телефону", tr: "Telefon doğrulaması"
  },
  "z_autoz가입시휴대_1300": {
    en: "Verify you are real with phone verification. Match rate increases 20%.",
    ja: "電話番号認証で本人であることを証明。マッチング率が20%向上します。",
    zh: "通过手机验证证明您的真实身份，匹配率提升20%。",
    es: "Verifica que eres real con verificación por teléfono. La tasa de coincidencia aumenta un 20%.",
    fr: "Vérifiez votre identité par téléphone. Taux de correspondance augmente de 20%.",
    de: "Bestätigen Sie Ihre Identität per Telefon. Matchrate steigt um 20%.",
    pt: "Verifique sua identidade por telefone. Taxa de correspondência aumenta 20%.",
    ru: "Подтвердите личность по телефону. Показатель совпадений растёт на 20%.",
    tr: "Telefon doğrulamasıyla kimliğinizi kanıtlayın. Eşleşme oranı %20 artar."
  },
  "z_autoz휴대폰번호_1301": {
    en: "Automatically granted after phone verification on signup",
    ja: "登録時の電話番号認証後に自動で付与",
    zh: "注册时手机验证后自动授予",
    es: "Otorgado automáticamente después de verificación en el registro",
    fr: "Accordé automatiquement après vérification téléphonique à l'inscription",
    de: "Nach Telefonverifizierung bei Registrierung automatisch vergeben",
    pt: "Concedido automaticamente após verificação por telefone no cadastro",
    ru: "Автоматически предоставляется после верификации при регистрации",
    tr: "Kayıt sırasında telefon doğrulamasından sonra otomatik verilir"
  },
  "z_autozLv2프라_1302": {
    en: "🪪 Identity Verification", ja: "🪪 本人確認認証", zh: "🪪 身份验证",
    es: "🪪 Verificación de Identidad", fr: "🪪 Vérification d'Identité",
    de: "🪪 Identitätsverifizierung", pt: "🪪 Verificação de Identidade",
    ru: "🪪 Верификация личности", tr: "🪪 Kimlik Doğrulama"
  },
  "z_autoz신분증인증_1303": {
    en: "ID verification", ja: "身分証認証", zh: "证件验证",
    es: "Verificación de documento", fr: "Vérification de pièce d'identité",
    de: "Ausweisverifizierung", pt: "Verificação de documento",
    ru: "Верификация удостоверения", tr: "Kimlik belgesi doğrulaması"
  },
  "z_autoz정부발급신_1304": {
    en: "Get the highest trust level with real-name verification.",
    ja: "実名確認で最高の信頼レベルを取得。",
    zh: "通过实名认证获得最高信任等级。",
    es: "Obtenga el nivel de confianza más alto con verificación de nombre real.",
    fr: "Obtenez le niveau de confiance le plus élevé avec la vérification du nom réel.",
    de: "Erreichen Sie das höchste Vertrauenslevel mit Echtnamenverifizierung.",
    pt: "Obtenha o nível de confiança mais alto com verificação de nome real.",
    ru: "Получите наивысший уровень доверия с верификацией реального имени.",
    tr: "Gerçek ad doğrulamasıyla en yüksek güven seviyesine ulaşın."
  },
  "z_autoz앱내신분증_1305": {
    en: "Submit ID → Admin review → Trust badge applied",
    ja: "身分証提出 → 管理者審査 → トラスト認証付与",
    zh: "提交证件 → 管理员审核 → 信任徽章授予",
    es: "Enviar documento → Revisión admin → Insignia de confianza aplicada",
    fr: "Soumettre ID → Examen admin → Badge de confiance appliqué",
    de: "Ausweis einreichen → Admin-Prüfung → Trust-Badge vergeben",
    pt: "Enviar ID → Revisão admin → Selo de confiança aplicado",
    ru: "Отправить удостоверение → Проверка администратором → Значок доверия",
    tr: "Kimlik gönder → Yönetici incelemesi → Güven rozeti verilir"
  },
  "z_autozLv3골드_1306": {
    en: "🏆 Top Trust", ja: "🏆 トップトラスト", zh: "🏆 最高信任",
    es: "🏆 Confianza Máxima", fr: "🏆 Confiance Maximale",
    de: "🏆 Höchstes Vertrauen", pt: "🏆 Confiança Máxima",
    ru: "🏆 Высшее доверие", tr: "🏆 En Yüksek Güven"
  },
  "z_autoz심층인증9_1307": {
    en: "Full verification complete", ja: "全認証完了", zh: "完整验证完成",
    es: "Verificación completa", fr: "Vérification complète", de: "Vollständige Verifizierung",
    pt: "Verificação completa", ru: "Полная верификация завершена", tr: "Tam doğrulama tamamlandı"
  },
  "z_autoz재직학위소_1308": {
    en: "Complete all verifications to achieve the highest trust status.",
    ja: "全ての認証を完了して最高信頼ステータスを達成してください。",
    zh: "完成所有验证以达到最高信任状态。",
    es: "Complete todas las verificaciones para lograr el estado de confianza más alto.",
    fr: "Complétez toutes les vérifications pour atteindre le statut de confiance maximum.",
    de: "Schließen Sie alle Verifizierungen ab, um den höchsten Vertrauensstatus zu erreichen.",
    pt: "Complete todas as verificações para atingir o status de confiança mais alto.",
    ru: "Завершите все верификации для достижения наивысшего уровня доверия.",
    tr: "En yüksek güven statüsüne ulaşmak için tüm doğrulamaları tamamlayın."
  },
  "z_autoz증빙서류제_1309": {
    en: "Phone + Email + ID + SNS verification complete",
    ja: "電話 + メール + 身分証 + SNS認証完了",
    zh: "电话 + 邮件 + 证件 + SNS验证完成",
    es: "Teléfono + Email + Documento + SNS verificación completa",
    fr: "Téléphone + Email + Pièce d'identité + SNS vérification complète",
    de: "Telefon + Email + Ausweis + SNS Verifizierung abgeschlossen",
    pt: "Telefone + Email + ID + SNS verificação completa",
    ru: "Телефон + Почта + Удостоверение + SNS верификация завершена",
    tr: "Telefon + E-posta + Kimlik + SNS doğrulaması tamamlandı"
  },
  "z_autoz기본인증9_1310": {
    en: "Basic Verification", ja: "基本認証", zh: "基本认证",
    es: "Verificación Básica", fr: "Vérification Basique", de: "Basisverifizierung",
    pt: "Verificação Básica", ru: "Базовая верификация", tr: "Temel Doğrulama"
  },
  "z_autoz전화번호인_1311": {
    en: "Phone verification", ja: "電話番号認証", zh: "手机验证",
    es: "Verificación por teléfono", fr: "Vérification téléphonique",
    de: "Telefonverifizierung", pt: "Verificação por telefone",
    ru: "Верификация по телефону", tr: "Telefon doğrulaması"
  },
  "z_autoz본인확인9_1312": {
    en: "Identity Verification", ja: "本人確認", zh: "身份验证",
    es: "Verificación de Identidad", fr: "Vérification d'Identité",
    de: "Identitätsverifizierung", pt: "Verificação de Identidade",
    ru: "Верификация личности", tr: "Kimlik Doğrulama"
  },
  "z_autoz신분증인증_1313": {
    en: "ID verification", ja: "身分証認証", zh: "证件认证",
    es: "Verificación de documento", fr: "Vérification de pièce d'identité",
    de: "Ausweisverifizierung", pt: "Verificação de documento",
    ru: "Верификация удостоверения", tr: "Kimlik belgesi doğrulaması"
  },
  "z_autoz최고신뢰9_1314": {
    en: "Top Trust", ja: "トップトラスト", zh: "最高信任",
    es: "Confianza Máxima", fr: "Confiance Maximale",
    de: "Höchstes Vertrauen", pt: "Confiança Máxima",
    ru: "Высшее доверие", tr: "En Yüksek Güven"
  },
  "z_autoz전체인증완_1315": {
    en: "Full verification complete", ja: "全認証完了", zh: "完整验证完成",
    es: "Verificación completa", fr: "Vérification complète",
    de: "Vollständige Verifizierung", pt: "Verificação completa",
    ru: "Полная верификация", tr: "Tam doğrulama"
  },
  "z_autoz기본인증안_1316": {
    en: "Basic Verification Info", ja: "基本認証案内", zh: "基本认证说明",
    es: "Información de Verificación Básica", fr: "Info Vérification Basique",
    de: "Basisverifizierungs-Info", pt: "Info de Verificação Básica",
    ru: "Информация о базовой верификации", tr: "Temel Doğrulama Bilgisi"
  },
  "z_autoz전화번호인_1317": {
    en: "Phone verification is automatically completed at signup. If not verified, go to Profile → Phone verification.",
    ja: "電話番号認証は登録時に自動的に完了します。未認証の場合はプロフィール → 電話番号認証を行ってください。",
    zh: "手机验证在注册时自动完成。未验证时请前往个人资料→手机验证。",
    es: "La verificación por teléfono se completa automáticamente en el registro. Si no verificado, vaya a Perfil → Verificación telefónica.",
    fr: "La vérification téléphonique est automatiquement complétée à l'inscription.",
    de: "Telefonverifizierung wird bei Registrierung automatisch abgeschlossen.",
    pt: "Verificação por telefone é automaticamente concluída no cadastro.",
    ru: "Верификация телефона автоматически завершается при регистрации.",
    tr: "Telefon doğrulaması kayıt sırasında otomatik tamamlanır."
  },
  "z_autoz운영자가2_1320": {
    en: "Admin will review and notify you within 24 hours.",
    ja: "管理者が24時間以内に審査し、結果をお知らせします。",
    zh: "管理员将在24小时内审核并通知您。",
    es: "El administrador revisará y le notificará dentro de 24 horas.",
    fr: "L'administrateur examinera et vous notifiera dans les 24 heures.",
    de: "Der Administrator prüft und benachrichtigt Sie innerhalb von 24 Stunden.",
    pt: "O administrador revisará e notificará você em 24 horas.",
    ru: "Администратор проверит и уведомит вас в течение 24 часов.",
    tr: "Yönetici 24 saat içinde inceleyip sizi bilgilendirecek."
  },
  "z_autoz신뢰인증관_1321": {
    en: "Trust Verification Management", ja: "信頼認証管理", zh: "信任认证管理",
    es: "Gestión de Verificación de Confianza", fr: "Gestion de la Vérification de Confiance",
    de: "Trust-Verifizierungsverwaltung", pt: "Gerenciamento de Verificação de Confiança",
    ru: "Управление верификацией доверия", tr: "Güven Doğrulama Yönetimi"
  },
  "z_autoz인증단계가_1322": {
    en: "Higher verification level = higher match rate",
    ja: "認証レベルが高いほどマッチング率が上がります",
    zh: "认证级别越高，匹配率越高",
    es: "Mayor nivel de verificación = mayor tasa de coincidencia",
    fr: "Niveau de vérification plus élevé = taux de correspondance plus élevé",
    de: "Höheres Verifizierungslevel = höhere Matchrate",
    pt: "Maior nível de verificação = maior taxa de correspondência",
    ru: "Чем выше уровень верификации, тем выше показатель совпадений",
    tr: "Daha yüksek doğrulama seviyesi = daha yüksek eşleşme oranı"
  },
  "z_autoz현재인증상_1323": {
    en: "Current Verification Status", ja: "現在の認証状態", zh: "当前认证状态",
    es: "Estado de Verificación Actual", fr: "Statut de Vérification Actuel",
    de: "Aktueller Verifizierungsstatus", pt: "Status de Verificação Atual",
    ru: "Текущий статус верификации", tr: "Mevcut Doğrulama Durumu"
  },
  "z_autoz미인증인증_1324": {
    en: "Not verified — Start verification", ja: "未認証 — 認証を開始してください",
    zh: "未验证 — 开始验证", es: "No verificado — Iniciar verificación",
    fr: "Non vérifié — Commencer la vérification", de: "Nicht verifiziert — Verifizierung starten",
    pt: "Não verificado — Iniciar verificação", ru: "Не верифицирован — Начать верификацию",
    tr: "Doğrulanmadı — Doğrulamayı başlatın"
  },
  "z_autoz기본인증완_1325": {
    en: "✅ Basic verification complete", ja: "✅ 基本認証完了",
    zh: "✅ 基本认证完成", es: "✅ Verificación básica completa",
    fr: "✅ Vérification basique complète", de: "✅ Basisverifizierung abgeschlossen",
    pt: "✅ Verificação básica completa", ru: "✅ Базовая верификация завершена",
    tr: "✅ Temel doğrulama tamamlandı"
  },
  "z_autoz본인확인완_1326": {
    en: "🪪 Identity verification complete", ja: "🪪 本人確認完了",
    zh: "🪪 身份验证完成", es: "🪪 Verificación de identidad completa",
    fr: "🪪 Vérification d'identité complète", de: "🪪 Identitätsverifizierung abgeschlossen",
    pt: "🪪 Verificação de identidade completa", ru: "🪪 Верификация личности завершена",
    tr: "🪪 Kimlik doğrulaması tamamlandı"
  },
  "z_autoz최고신뢰완_1327": {
    en: "🏆 Top trust complete", ja: "🏆 最高信頼完了",
    zh: "🏆 最高信任完成", es: "🏆 Confianza máxima completa",
    fr: "🏆 Confiance maximale complète", de: "🏆 Höchstes Vertrauen abgeschlossen",
    pt: "🏆 Confiança máxima completa", ru: "🏆 Высшее доверие завершено",
    tr: "🏆 En yüksek güven tamamlandı"
  },
  "z_autoz완료997_1328": {
    en: "완료", ja: "完了", zh: "完成", es: "Completado", fr: "Terminé",
    de: "Abgeschlossen", pt: "Concluído", ru: "Завершено", tr: "Tamamlandı"
  },
  "z_autoz다음단계9_1329": {
    en: "Next Step", ja: "次のステップ", zh: "下一步",
    es: "Siguiente Paso", fr: "Prochaine Étape", de: "Nächster Schritt",
    pt: "Próximo Passo", ru: "Следующий шаг", tr: "Sonraki Adım"
  },
  "z_autoz처리중99_1330": {
    en: "Processing...", ja: "処理中...", zh: "处理中...",
    es: "Procesando...", fr: "Traitement...", de: "Wird verarbeitet...",
    pt: "Processando...", ru: "Обработка...", tr: "İşleniyor..."
  },
  "z_autoz전화번호인_1331": {
    en: "Phone Verification", ja: "電話番号認証", zh: "手机验证",
    es: "Verificación por teléfono", fr: "Vérification téléphonique",
    de: "Telefonverifizierung", pt: "Verificação por telefone",
    ru: "Верификация телефона", tr: "Telefon doğrulaması"
  },
  "z_autoz신분증인증_1332": {
    en: "Request ID Verification", ja: "身分証のリクエスト", zh: "请求证件验证",
    es: "Solicitar Verificación de Documento", fr: "Demander Vérification de Pièce d'Identité",
    de: "Ausweisverifizierung anfordern", pt: "Solicitar Verificação de Documento",
    ru: "Запросить верификацию удостоверения", tr: "Kimlik Doğrulaması İste"
  },
  "z_autoz얼굴인증요_1333": {
    en: "Request Face Verification", ja: "顔認証のリクエスト", zh: "请求人脸验证",
    es: "Solicitar Verificación Facial", fr: "Demander Vérification Faciale",
    de: "Gesichtsverifizierung anfordern", pt: "Solicitar Verificação Facial",
    ru: "Запросить верификацию лица", tr: "Yüz Doğrulaması İste"
  },
  "z_autoz제출된정보_1334": {
    en: "Submitted information is used only for verification purposes and stored encrypted",
    ja: "提出された情報は認証目的でのみ使用され、暗号化されています",
    zh: "提交的信息仅用于认证目的并加密存储",
    es: "La información enviada se usa solo para verificación y se almacena cifrada",
    fr: "Les informations soumises ne sont utilisées qu'à des fins de vérification et sont cryptées",
    de: "Eingereichte Informationen werden nur für Verifizierungszwecke verwendet und verschlüsselt gespeichert",
    pt: "Informações enviadas são usadas apenas para verificação e armazenadas criptografadas",
    ru: "Отправленная информация используется только для верификации и хранится в зашифрованном виде",
    tr: "Gönderilen bilgiler yalnızca doğrulama amacıyla kullanılır ve şifreli saklanır"
  },

  // ── PlusModal comparison feature labels (1315-1357) ───────────────────────
  "z_autoz하루라이크_1315": {
    en: "Daily Likes", ja: "1日のいいね数", zh: "每日喜欢数",
    es: "Likes Diarios", fr: "J'aime Quotidiens", de: "Tägliche Likes",
    pt: "Curtidas Diárias", id: "Suka Harian", vi: "Lượt thích hàng ngày",
    th: "ไลค์รายวัน", ar: "إعجابات يومية", hi: "दैनिक लाइक",
    ru: "Ежедневные лайки", tr: "Günlük Beğeniler"
  },
  "z_autoz10개14_1316": {
    en: "10 per day", ja: "10個/日", zh: "每日10个",
    es: "10 por día", fr: "10 par jour", de: "10 pro Tag",
    pt: "10 por dia", ru: "10 в день", tr: "Günde 10"
  },
  "z_autoz무제한14_1317": {
    en: "Unlimited ♾️", ja: "無制限 ♾️", zh: "无限 ♾️",
    es: "Ilimitados ♾️", fr: "Illimité ♾️", de: "Unbegrenzt ♾️",
    pt: "Ilimitados ♾️", id: "Tak terbatas ♾️", vi: "Không giới hạn ♾️",
    th: "ไม่จำกัด ♾️", ar: "غير محدود ♾️", hi: "असीमित ♾️",
    ru: "Безлимитно ♾️", tr: "Sınırsız ♾️"
  },
  "z_autoz슈퍼라이크_1318": {
    en: "Super Like", ja: "スーパーライク", zh: "超级喜欢",
    es: "Super Like", fr: "Super Like", de: "Super Like",
    pt: "Super Like", ru: "Суперлайк", tr: "Süper Beğeni"
  },
  "z_autoz3회주14_1319": {
    en: "3 per week", ja: "3回/週", zh: "每周3次",
    es: "3 por semana", fr: "3 par semaine", de: "3 pro Woche",
    pt: "3 por semana", ru: "3 в неделю", tr: "Haftada 3"
  },
  "z_autoz무제한14_1320": {
    en: "Unlimited ⭐", ja: "無制限 ⭐", zh: "无限 ⭐",
    es: "Ilimitados ⭐", fr: "Illimité ⭐", de: "Unbegrenzt ⭐",
    pt: "Ilimitados ⭐", ru: "Безлимитно ⭐", tr: "Sınırsız ⭐"
  },
  "z_autoz나를좋아한_1321": {
    en: "See Who Liked You", ja: "いいねしてくれた人を見る", zh: "查看喜欢我的人",
    es: "Ver quién te gustó", fr: "Voir qui vous a aimé",
    de: "Sehen wer dich geliked hat", pt: "Ver quem curtiu você",
    id: "Lihat yang menyukai saya", vi: "Xem ai đã thích bạn",
    th: "ดูคนที่ชอบคุณ", ar: "رؤية من أعجب بك",
    hi: "देखें कितने लोगों ने लाइक किया", ru: "Кто лайкнул тебя",
    tr: "Seni beğenenleri gör"
  },
  "z_autoz숨김145_1322": {
    en: "Hidden", ja: "非表示", zh: "隐藏",
    es: "Oculto", fr: "Caché", de: "Verborgen",
    pt: "Oculto", ru: "Скрыто", tr: "Gizli"
  },
  "z_autoz전체공개1_1323": {
    en: "✅ Fully visible", ja: "✅ 全体公開", zh: "✅ 完全公开",
    es: "✅ Totalmente visible", fr: "✅ Entièrement visible",
    de: "✅ Vollständig sichtbar", pt: "✅ Totalmente visível",
    ru: "✅ Полностью видно", tr: "✅ Tamamen görünür"
  },
  "z_autoz프로필부스_1324": {
    en: "Profile Boost", ja: "プロフィールブースト", zh: "个人资料推广",
    es: "Impulso de Perfil", fr: "Boost de Profil", de: "Profil-Boost",
    pt: "Impulso de Perfil", ru: "Буст профиля", tr: "Profil Artışı"
  },
  "z_autoz1회월제공_1325": {
    en: "1x/month provided", ja: "1回/月提供 ⚡", zh: "每月提供1次",
    es: "1x/mes proporcionado", fr: "1x/mois fourni",
    de: "1x/Monat bereitgestellt", pt: "1x/mês fornecido",
    ru: "1 раз/месяц", tr: "Ayda 1 sağlanır"
  },
  "z_autoz상세필터1_1326": {
    en: "Advanced Filters", ja: "詳細フィルター", zh: "高级筛选",
    es: "Filtros Avanzados", fr: "Filtres Avancés", de: "Erweiterte Filter",
    pt: "Filtros Avançados", ru: "Расширенные фильтры", tr: "Gelişmiş Filtreler"
  },
  "z_autoz기본만14_1327": {
    en: "Basic only", ja: "基本のみ", zh: "仅基础",
    es: "Solo básico", fr: "Basique seulement", de: "Nur Basic",
    pt: "Apenas básico", ru: "Только базовые", tr: "Yalnızca temel"
  },
  "z_autozMBTI예_1328": {
    en: "MBTI · Budget · Style", ja: "MBTI・予算・スタイル", zh: "MBTI·预算·风格",
    es: "MBTI · Presupuesto · Estilo", fr: "MBTI · Budget · Style",
    de: "MBTI · Budget · Stil", pt: "MBTI · Orçamento · Estilo",
    ru: "MBTI · Бюджет · Стиль", tr: "MBTI · Bütçe · Tarz"
  },
  "z_autoz글로벌매칭_1329": {
    en: "Global Matching", ja: "グローバルマッチング", zh: "全球匹配",
    es: "Emparejamiento Global", fr: "Correspondance Mondiale",
    de: "Globales Matching", pt: "Matching Global",
    id: "Pencocokan Global", vi: "Kết nối Toàn cầu",
    th: "การจับคู่ระดับโลก", ar: "المطابقة العالمية",
    hi: "वैश्विक मिलान", ru: "Глобальный матчинг", tr: "Global Eşleştirme"
  },
  "z_autoz현지만14_1330": {
    en: "Local area only", ja: "現地のみ", zh: "仅本地",
    es: "Solo área local", fr: "Zone locale seulement",
    de: "Nur lokaler Bereich", pt: "Apenas área local",
    ru: "Только локальная область", tr: "Yalnızca yerel alan"
  },
  "z_autoz전세계여행_1331": {
    en: "🌍 Worldwide travelers", ja: "🌍 全世界の旅行者", zh: "🌍 全球旅行者",
    es: "🌍 Viajeros mundiales", fr: "🌍 Voyageurs mondiaux",
    de: "🌍 Weltweite Reisende", pt: "🌍 Viajantes mundiais",
    ru: "🌍 Путешественники по всему миру", tr: "🌍 Dünya geneli gezginler"
  },
  "z_autoz여행DNA_1332": {
    en: "Travel DNA Report", ja: "旅行DNAレポート", zh: "旅行DNA报告",
    es: "Informe ADN de Viaje", fr: "Rapport ADN Voyage",
    de: "Reise-DNA-Bericht", pt: "Relatório DNA de Viagem",
    ru: "Отчёт ДНК путешествий", tr: "Seyahat DNA Raporu"
  },
  "z_autoz5차원풀분_1333": {
    en: "5-axis full analysis", ja: "5軸完全分析", zh: "5维全面分析",
    es: "Análisis completo de 5 ejes", fr: "Analyse complète 5 axes",
    de: "5-Achsen Vollanalyse", pt: "Análise completa 5 eixos",
    ru: "Полный анализ по 5 осям", tr: "5 eksenli tam analiz"
  },
  "z_autoz지금여기있_1334": {
    en: "Featured Now", ja: "今ここにいます", zh: "现在就在这里",
    es: "Destacado Ahora", fr: "En Vedette Maintenant",
    de: "Jetzt hervorgehoben", pt: "Em Destaque Agora",
    ru: "Сейчас здесь", tr: "Şu An Burada"
  },
  "z_autoz일반노출1_1335": {
    en: "Normal exposure", ja: "通常表示", zh: "普通曝光",
    es: "Exposición normal", fr: "Exposition normale",
    de: "Normale Sichtbarkeit", pt: "Exposição normal",
    ru: "Обычная видимость", tr: "Normal görünürlük"
  },
  "z_autoz최상단고정_1336": {
    en: "Top pinned 🔴", ja: "最上位固定 🔴", zh: "顶部固定 🔴",
    es: "Fijado en la cima 🔴", fr: "Épinglé en haut 🔴",
    de: "Oben fixiert 🔴", pt: "Fixado no topo 🔴",
    ru: "Закреплено вверху 🔴", tr: "En üstte sabitlendi 🔴"
  },
  "z_autoz채팅읽음확_1337": {
    en: "Chat Read Receipts", ja: "チャット既読確認", zh: "聊天已读回执",
    es: "Confirmaciones de lectura", fr: "Accusés de lecture",
    de: "Chat-Lesebestätigungen", pt: "Confirmações de leitura",
    ru: "Уведомления о прочтении", tr: "Sohbet okundu bilgisi"
  },
  "z_autoz읽음체크1_1338": {
    en: "✅ Read check", ja: "✅ 既読チェック", zh: "✅ 已读确认",
    es: "✅ Confirmación de lectura", fr: "✅ Confirmation de lecture",
    de: "✅ Gelesencheck", pt: "✅ Confirmação de leitura",
    ru: "✅ Отметка о прочтении", tr: "✅ Okundu işareti"
  },
  "z_autoz위치숨기기_1339": {
    en: "Hide Location", ja: "位置を隠す", zh: "隐藏位置",
    es: "Ocultar Ubicación", fr: "Masquer la Position",
    de: "Standort verbergen", pt: "Ocultar Localização",
    ru: "Скрыть местоположение", tr: "Konumu Gizle"
  },
  "z_autoz대략위치만_1340": {
    en: "✅ Approximate only", ja: "✅ おおよそ位置のみ", zh: "✅ 仅大概位置",
    es: "✅ Solo aproximada", fr: "✅ Approximative seulement",
    de: "✅ Nur ungefähr", pt: "✅ Apenas aproximada",
    ru: "✅ Только приблизительно", tr: "✅ Yaklaşık konum"
  },
  "z_autoz고급안전체_1341": {
    en: "Advanced Safety Check-in", ja: "高度なセーフティチェックイン", zh: "高级安全打卡",
    es: "Check-in de Seguridad Avanzado", fr: "Check-in Sécurité Avancé",
    de: "Erweiterter Sicherheits-Check-in", pt: "Check-in de Segurança Avançado",
    ru: "Расширенный безопасный чек-ин", tr: "Gelişmiş Güvenlik Check-in"
  },
  "z_autoz기본147_1342": {
    en: "Basic only", ja: "基本のみ", zh: "仅基础",
    es: "Solo básico", fr: "Basique seulement", de: "Nur Basic",
    pt: "Apenas básico", ru: "Только базовый", tr: "Yalnızca temel"
  },
  "z_autoz비상연락처_1343": {
    en: "Emergency contact auto-alert", ja: "緊急連絡先自動通知", zh: "紧急联系人自动提醒",
    es: "Alerta automática de contacto de emergencia", fr: "Alerte automatique contact d'urgence",
    de: "Notfallkontakt-Autowarnung", pt: "Alerta automático de contato de emergência",
    ru: "Авто-оповещение экстренного контакта", tr: "Acil kişi otomatik uyarı"
  },
  "z_autoz프리미엄그_1344": {
    en: "Premium Group Access", ja: "プレミアムグループ参加", zh: "高级群组参与",
    es: "Acceso a Grupos Premium", fr: "Accès Groupes Premium",
    de: "Premium-Gruppenzugang", pt: "Acesso a Grupos Premium",
    ru: "Доступ к премиум группам", tr: "Premium Grup Erişimi"
  },
  "z_autoz무제한14_1345": {
    en: "Unlimited", ja: "無制限", zh: "无限制",
    es: "Ilimitado", fr: "Illimité", de: "Unbegrenzt",
    pt: "Ilimitado", ru: "Безлимитно", tr: "Sınırsız"
  },
  "z_autozPlus뱃_1346": {
    en: "Plus Badge", ja: "Plusバッジ", zh: "Plus徽章",
    es: "Insignia Plus", fr: "Badge Plus", de: "Plus-Abzeichen",
    pt: "Distintivo Plus", ru: "Значок Plus", tr: "Plus Rozeti"
  },
  "z_autoz프로필표시_1347": {
    en: "👑 Profile display", ja: "👑 プロフィール表示", zh: "👑 个人资料显示",
    es: "👑 Mostrado en perfil", fr: "👑 Affiché sur le profil",
    de: "👑 Profilanzeige", pt: "👑 Exibido no perfil",
    ru: "👑 Отображение в профиле", tr: "👑 Profil gösterimi"
  },
  "z_autoz광고제거1_1348": {
    en: "Remove Ads", ja: "広告削除", zh: "去除广告",
    es: "Eliminar Anuncios", fr: "Supprimer les Publicités",
    de: "Werbung entfernen", pt: "Remover Anúncios",
    ru: "Убрать рекламу", tr: "Reklamları Kaldır"
  },
  "z_autoz광고있음1_1349": {
    en: "Has ads", ja: "広告あり", zh: "有广告",
    es: "Con publicidad", fr: "Avec publicités", de: "Mit Werbung",
    pt: "Com anúncios", ru: "Есть реклама", tr: "Reklam var"
  },
  "z_autoz광고없음1_1350": {
    en: "✅ Ad-free", ja: "✅ 広告なし", zh: "✅ 无广告",
    es: "✅ Sin publicidad", fr: "✅ Sans publicité", de: "✅ Werbefrei",
    pt: "✅ Sem anúncios", ru: "✅ Без рекламы", tr: "✅ Reklamsız"
  },

  // Plus modal highlight feature cards
  "z_autoz여행DNA_1351": {
    en: "Travel DNA", ja: "旅行DNA", zh: "旅行DNA",
    es: "ADN de Viaje", fr: "ADN Voyage", de: "Reise-DNA",
    pt: "DNA de Viagem", ru: "ДНК путешествий", tr: "Seyahat DNA"
  },
  "z_autoz5차원성향_1352": {
    en: "5D travel personality analysis", ja: "5次元旅行性向分析",
    zh: "5维旅行倾向分析", es: "Análisis de personalidad 5D",
    fr: "Analyse de personnalité 5D", de: "5D-Reisepersönlichkeitsanalyse",
    pt: "Análise de personalidade 5D", ru: "5D-анализ туристической личности",
    tr: "5D seyahat kişilik analizi"
  },
  "z_autoz지금여기있_1353": {
    en: "Show as currently here. Top visibility in the area.",
    ja: "現在ここにいることを表示。エリアで最上位の表示。",
    zh: "显示为当前在此。区域内最高曝光。",
    es: "Muéstrate como actualmente aquí. Máxima visibilidad en el área.",
    fr: "Affichez votre présence. Visibilité maximale dans la zone.",
    de: "Als aktuell anwesend anzeigen. Höchste Sichtbarkeit im Bereich.",
    pt: "Mostre-se como presente aqui. Máxima visibilidade na área.",
    ru: "Показывайтесь как сейчас здесь. Максимальная видимость в области.",
    tr: "Şu an burada olarak gösterin. Bölgede en yüksek görünürlük."
  },
  "z_autoz내가좋아요_1354": {
    en: "Who Liked Me List", ja: "내가 좋아요 받은 목록", zh: "喜欢我的列表",
    es: "Lista de quienes me gustaron", fr: "Liste de ceux qui m'ont aimé",
    de: "Wer mich geliked hat", pt: "Lista de quem curtiu mim",
    ru: "Список лайкнувших меня", tr: "Beni beğenenler listesi"
  },
  "z_autoz먼저라이크_1355": {
    en: "See who liked you first → direct match",
    ja: "先に自分をいいねした人を確認・マッチング",
    zh: "查看先喜欢你的人→直接匹配",
    es: "Ver quién te gustó primero → emparejamiento directo",
    fr: "Voir qui vous a aimé en premier → correspondance directe",
    de: "Sehen wer dich zuerst geliked hat → direktes Matching",
    pt: "Ver quem curtiu você primeiro → match direto",
    ru: "Кто лайкнул тебя первым → прямой матч",
    tr: "Sizi ilk beğeneni görün → doğrudan eşleşme"
  },
  "z_autoz글로벌매칭_1356": {
    en: "Global Matching", ja: "グローバルマッチング", zh: "全球匹配",
    es: "Emparejamiento Global", fr: "Correspondance Mondiale",
    de: "Globales Matching", pt: "Matching Global",
    ru: "Глобальный матчинг", tr: "Global Eşleştirme"
  },
  "z_autoz전세계어디_1357": {
    en: "Connect with local travelers anywhere in the world",
    ja: "世界中どこでも現地旅行者と繋がる",
    zh: "在世界任何地方与当地旅行者联系",
    es: "Conéctate con viajeros locales en cualquier parte del mundo",
    fr: "Connectez-vous avec des voyageurs locaux partout dans le monde",
    de: "Verbinden Sie sich mit lokalen Reisenden überall auf der Welt",
    pt: "Conecte-se com viajantes locais em qualquer lugar do mundo",
    ru: "Связывайтесь с местными путешественниками по всему миру",
    tr: "Dünyanın her yerinde yerel gezginlerle bağlanın"
  },

  // Plus modal tab labels
  "z_autoz신기능1_1361": {
    en: "✨ New Features", ja: "✨ 新機能", zh: "✨ 新功能",
    es: "✨ Nuevas Funciones", fr: "✨ Nouvelles Fonctions", de: "✨ Neue Funktionen",
    pt: "✨ Novas Funcionalidades", ru: "✨ Новые функции", tr: "✨ Yeni Özellikler"
  },
  "z_autoz무료vsPlus_1362": {
    en: "📊 Free vs Plus", ja: "📊 無料 vs プラス", zh: "📊 免费 vs Plus",
    es: "📊 Gratuito vs Plus", fr: "📊 Gratuit vs Plus",
    de: "📊 Kostenlos vs Plus", pt: "📊 Gratuito vs Plus",
    ru: "📊 Бесплатно vs Plus", tr: "📊 Ücretsiz vs Plus"
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
