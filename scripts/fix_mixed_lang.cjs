const fs = require('fs');
const path = require('path');

// Detect if string contains Korean characters
function hasKorean(s) { return /[\uAC00-\uD7AF\u3131-\u3163\u1100-\u11FF]/.test(s); }
function hasJapanese(s) { return /[\u3040-\u309F\u30A0-\u30FF]/.test(s); }
function hasChinese(s) { return /[\u4E00-\u9FFF]/.test(s); }
function isEnglishOnly(s) { return !hasKorean(s) && !hasJapanese(s) && !hasChinese(s); }

// Map of Korean -> English translations for common app terms
const KO_TO_EN = {
  "전체": "All", "안읽음": "Unread", "그룹": "Group", "1:1": "1:1",
  "해당 필터에 맞는 채팅이 없어요": "No chats match this filter",
  "필터를 해제하면 모든 채팅을 볼 수 있어요": "Remove the filter to see all chats",
  "필터 초기화": "Clear filter",
  "Migo 안전 채팅": "Migo Safe Chat",
  "모든 채팅은 암호화 보호됩니다": "All chats are protected with encryption",
  "Migo 개인정보 처리방침": "Migo Privacy Policy",
  "시행일: 2026년 4월 7일 · Lunatics Group Inc.": "Effective: April 7, 2026 · Lunatics Group Inc.",
  "아래 표는 Apple App Store 개인정보 영양 라벨의 정확한 기재 내용과 동일합니다.": "The table below matches the Apple App Store privacy nutrition label.",
  "Migo는 연애·교류 앱 특성상 이용자가 자발적으로 입력한 성적 지향, 종교, 정치적 견해 등 민감 정보를 수집할 수 있습니다. 이는 오직 매칭 알고리즘 개선 목적에만 사용되며, 제3자에게 절대 판매·공유되지 않습니다.": "As a social matching app, Migo may collect sensitive information such as sexual orientation, religion, and political views voluntarily entered by users. This is used solely to improve the matching algorithm and is never sold or shared with third parties.",
  "회사는 서비스 운영을 위해 아래 수탁사에 최소한의 데이터를 위탁합니다. 수탁사들은 위탁 목적 외에 데이터를 사용하거나 타 제3자에게 재판매할 수 없습니다.": "The company entrusts minimal data to the following processors for service operation. Processors cannot use data beyond the entrusted purpose or resell to third parties.",
  "데이터베이스": "Database",
  "프로필, 메시지, 위치(24h 후 삭제)": "Profile, messages, location (deleted after 24h)",
  "지도 / 인증 / 번역 / 푸시 알림": "Maps / Auth / Translation / Push Notifications",
  "GPS 좌표(지도), 이메일(로그인), 메시지 텍스트(번역), FCM 토큰": "GPS coordinates (maps), email (login), message text (translation), FCM token",
  "푸시 알림 / 인앱 결제": "Push Notifications / In-App Purchases",
  "APNs 토큰, 구독 영수증": "APNs token, subscription receipt",
  "원문 보기": "View original",
  "전달 데이터": "Transferred data",
  "⚠️ 회사는 사용자 데이터를 광고 네트워크, 데이터 브로커, 또는 제3자에게 판매하지 않습니다.": "⚠️ The company does not sell user data to ad networks, data brokers, or third parties.",
  "위치 수집은 앱이 포어그라운드 상태일 때만 수행됩니다.": "Location collection is performed only when the app is in the foreground.",
  "주변 여행자 표시, 더 가까운 매칭 제안, 지도 기능 이외의 목적으로 위치 데이터를 사용하지 않습니다.": "Location data is not used for purposes other than displaying nearby travelers, suggesting closer matches, and map features.",
  "GPS 좌표는 세션 종료 후 24시간 이내 자동 삭제됩니다.": "GPS coordinates are automatically deleted within 24 hours after the session ends.",
  "iOS 설정 → 개인정보 보호 및 보안 → 위치 서비스 → Migo에서 언제든지 위치 권한을 철회할 수 있습니다.": "You can revoke location permission at any time in iOS Settings → Privacy & Security → Location Services → Migo.",
  "백그라운드 위치 추적 및 Always-On 위치 권한은 요청하지 않습니다.": "Background location tracking and Always-On location permissions are not requested.",
  "Migo Plus / Premium 구독은 Apple 인앱결제(IAP)로만 처리됩니다. 회사는 신용카드 번호, CVC 등 카드 정보를 저장하지 않습니다.": "Migo Plus / Premium subscriptions are processed only through Apple In-App Purchase (IAP). The company does not store credit card numbers, CVC, or other card information.",
  "Apple 영수증 검증을 통해 구독 상태를 확인합니다.": "Subscription status is verified through Apple receipt validation.",
  "환불 정책: App Store 환불 정책을 따릅니다.": "Refund policy: Follows the App Store refund policy.",
  "모든 데이터 전송: TLS 1.3 암호화": "All data transmission: TLS 1.3 encryption",
  "비밀번호: bcrypt 해시 저장 (평문 미저장)": "Passwords: bcrypt hash storage (no plaintext)",
  "JWT 세션 토큰, 만료 시 자동 폐기": "JWT session tokens, automatically discarded upon expiry",
  "Supabase Row Level Security(RLS) — 본인 데이터에만 접근 가능": "Supabase Row Level Security (RLS) — access only to own data",
  "최소 권한 원칙: 서비스 제공에 필요한 데이터만 접근": "Principle of least privilege: access only data necessary for service",
  "탈퇴 즉시 CASCADE DELETE로 영구 삭제:": "Upon withdrawal, permanently deleted via CASCADE DELETE:",
  "프로필(이름, 사진, 생년월일, 성별)": "Profile (name, photo, date of birth, gender)",
  "모든 메시지 및 채팅방": "All messages and chat rooms",
  "좋아요·매칭 이력": "Like/match history",
  "위치 데이터": "Location data",
  "단, 전자상거래법에 따라 결제 기록은 5년간 별도 보관 후 파기합니다.": "However, payment records are kept separately for 5 years per e-commerce law before destruction.",
  "계정 삭제: 앱 내 프로필 → 설정 → 회원 탈퇴 또는 privacy@lunaticsgroup.com 이메일 요청": "Account deletion: In-app Profile → Settings → Delete Account or email privacy@lunaticsgroup.com",
  "만 13세 미만 아동의 개인정보를 의도적으로 수집하지 않습니다. 아동임이 확인될 경우 즉시 계정과 관련 데이터를 삭제합니다.": "We do not intentionally collect personal information from children under 13. If a child is identified, the account and related data are immediately deleted.",
  "EEA 거주 이용자는 다음 권리를 보유합니다:": "EEA residents have the following rights:",
  "열람권 — 보유 데이터 조회 요청": "Right of access — request to view held data",
  "정정권 — 부정확한 정보 수정 요청": "Right to rectification — request to correct inaccurate information",
  "삭제권(잊힐 권리)": "Right to erasure (right to be forgotten)",
  "이동권 — 구조화된 형식으로 데이터 수령": "Right to portability — receive data in structured format",
  "처리 반대권 및 제한권": "Right to object and restrict processing",
  "동의 철회권 — 철회해도 기존 처리의 적법성은 유지": "Right to withdraw consent — withdrawal does not affect prior lawful processing",
  "권리 행사: privacy@lunaticsgroup.com — 30일 이내 처리": "Exercise rights: privacy@lunaticsgroup.com — processed within 30 days",
  "수집·공유되는 개인정보의 종류 및 목적 알 권리": "Right to know categories and purposes of personal information collected/shared",
  "개인정보 판매 거부권 (Migo는 데이터를 판매하지 않습니다)": "Right to opt-out of sale (Migo does not sell data)",
  "권리 행사에 따른 차별 금지": "Non-discrimination for exercising rights",
  "회사": "Company",
  "개인정보 보호책임자": "Data Protection Officer",
  "개인정보 문의": "Privacy inquiries",
  "고객지원": "Customer support",
  "문의 접수 후 영업일 기준 7일 이내 회신합니다.": "We respond within 7 business days of receiving an inquiry.",
  "본 방침은 2026년 4월 7일부터 적용됩니다.": "This policy is effective from April 7, 2026.",
  "© 2026 Lunatics Group Inc. 모든 권리 보유.": "© 2026 Lunatics Group Inc. All rights reserved.",
  "Data destruction and privacy terms": "Data destruction and privacy terms",
  "프로필 완성도": "Profile completion",
  "프로필을 완성하고 매칭률을 3배 높여보세요! 🔥": "Complete your profile and boost your match rate 3x! 🔥",
  "조금만 더 채우면 완벽한 프로필이 돼요! ✨": "Just a little more to complete your profile! ✨",
  "내 뱃지": "My badges",
  "아직 획득한 뱃지가 없어요": "No badges earned yet",
  "앱에서 활동하며 멋진 뱃지를 수집해보세요!": "Be active and collect awesome badges!",
  "모든 데이터는 암호화되어 안전하게 보호됩니다": "All data is encrypted and securely protected",
  "항목 선택 후 제출": "Select items and submit",
  "주민등록증": "National ID",
  "운전면허증": "Driver's License",
  "여권3": "Passport",
  "빛반사가없": "No light reflection",
  "어두운배경": "Dark background",
  "주민등록번": "ID number",
  "인증 정보는 암호화 저장되며 외부에 공개되지 않습니다. 신뢰 점수만 다른 사용자에게 표시됩니다.": "Verification info is encrypted and not disclosed. Only the trust score is shown to other users.",
  "연동하기": "Connect",
  "새로운 매치!": "New match!",
  "만료된 매치": "Expired match",
  "누군가 나에게 좋아요를 보내면 알림": "Notify when someone sends you a like",
  "슈퍼라이크 수신 시 알림": "Notify when receiving a Super Like",
  "내 게시글에 댓글이 달리면 알림": "Notify when comments are added to your post",
  "시스템 알림": "System notifications",
  "업데이트·공지·이벤트 알림": "Update, announcement & event notifications",
  "받고 싶은 알림을 선택하세요": "Choose which notifications you want to receive",
  "일": "days",
  "오늘의 보상": "Today's reward",
  "관광 / 투어": "Sightseeing / Tour",
  "맛집 탐방": "Food exploration",
  "자연 / 액티비티": "Nature / Activities",
  "휴양 / 힐링": "Relaxation / Healing",
  "나이트라이프": "Nightlife",
  "1–3일": "1–3 days",
  "짧은 여행": "Short trip",
  "4–7일": "4–7 days",
  "일주일 내외": "About a week",
  "1–2주": "1–2 weeks",
  "알찬 여행": "Fulfilling trip",
  "2주 이상": "2+ weeks",
  "장기 여행": "Long trip",
  "상관없음": "Any",
  "혼성": "Mixed",
  "여성만": "Women only",
  "남성만": "Men only",
  "출발지 / 목적지": "Departure / Destination",
  "출발지 입력 (예: 서울, 부산)": "Enter departure (e.g. Seoul, Busan)",
  "목적지 입력 (예: 도쿄, 방콕)": "Enter destination (e.g. Tokyo, Bangkok)",
  "여행 스타일": "Travel style",
  "여행 기간": "Trip duration",
  "필터 적용": "Apply filter",
  "개": "filters",
  "방금 전": "Just now",
  "새 메시지": "New message",
};

const enPath = path.join(__dirname, '../src/i18n/locales/en.ts');
let content = fs.readFileSync(enPath, 'utf8');
let fixCount = 0;

// Process each line in the auto-added section
const lines = content.split('\n');
const newLines = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Match pattern: "key": "value",
  const m = line.match(/^(\s*"[^"]+"\s*:\s*)"([^"]*)"(,?\s*)$/);
  if (m && hasKorean(m[2])) {
    const val = m[2];
    if (KO_TO_EN[val]) {
      newLines.push(`${m[1]}"${KO_TO_EN[val]}"${m[3]}`);
      fixCount++;
    } else {
      // Keep as-is but log
      newLines.push(line);
      console.log(`⚠️ No EN translation for: "${val}"`);
    }
  } else {
    newLines.push(line);
  }
}

content = newLines.join('\n');
fs.writeFileSync(enPath, content);
console.log(`\n✅ en.ts: ${fixCount}개 한국어→영어 수정 완료`);
