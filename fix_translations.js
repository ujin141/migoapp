const fs = require('fs');

const engAdditions = `
  tutorial: {
    welcome: { title: "Welcome to Migo!", desc: "Ready for a special experience connecting with travelers worldwide? Let us guide you." },
    swipe: { title: "Swipe to Match", desc: "Swipe right on a traveler you like to send a match request! Swipe left to pass." },
    discover: { title: "Explore Groups", desc: "Find travel groups that match your style and join them in the Discover tab." },
    map: { title: "Find Travelers Nearby", desc: "Check out travelers near you in real-time on the Map tab." },
    chat: { title: "Match & Chat!", desc: "Once matched, start a conversation in the Chat tab." },
    profile: { title: "Decorate Your Profile", desc: "A complete profile increases your matching rate!" },
    done: { title: "All Set!", desc: "Enjoy Migo to the fullest." },
    hints: { discover: "Discover Tab (bottom 2nd)", map: "Map Tab (bottom 3rd)", chat: "Chat Tab (bottom 4th)", profile: "Profile Tab (bottom 5th)" },
    buttons: { start: "Start 🚀", next: "Next" }
  },
  trustModal: {
    levels: [
      { label: "Basic", sub: "Phone Verified", desc: "Protect your account.", how: "Done at signup" },
      { label: "ID Verified", sub: "Identity Verified", desc: "Get maximum trust.", how: "Submit ID card" },
      { label: "Top Trust", sub: "All Verified", desc: "Most trusted user.", how: "Complete all verifications" }
    ],
    title: "Trust Verification", subtitle: "Higher trust means better matches",
    currentStatus: "Current Status", completedBadge: "Completed", nextBadge: "Next Step",
    status: { none: "Unverified — Start Verification", basic: "✅ Basic Verified", id: "🪪 ID Verified", top: "🏆 Top Trust" },
    buttons: { processing: "Processing...", basic: "Verify Phone", id: "Request ID Verification", top: "Request Face Verification" },
    footer: "Info used for verification only and stored encrypted.",
    errors: { login: { title: "Login required." }, request: { title: "Request failed", desc: "Unknown error" } },
    info: { basic: { title: "Basic Verification", desc: "Done automatically at signup." } },
    success: { id: { title: "ID Verification Requested!" }, top: { title: "Top Trust Requested!" }, desc: "Admin will review within 24 hours." }
  },
  voice: {
    unknownUser: "User", unknownUserFull: "Unknown User", callEnded: "Call ended",
    unmute: "Unmute", mute: "Mute", speaker: "Speaker", accept: "Accept", decline: "Decline", inCall: "In Call...", connecting: "Connecting..."
  },
  swipe: { bio: { original: "Original", translate: "Translate" }, likesMe: "Likes me!", interests: "Interests" },
  setup: {
    step0: { title: "Photo &\\nBio", desc: "First impressions matter ✨" },
    step1: { title: "Travel Style\\n&\\nPreferences", desc: "Find matching companions" },
    step2: { title: "Destination &\\nDates", desc: "Can we meet up?" },
    step3: { title: "Travel Vibe\\n&\\nLanguage", desc: "Tell us what kind of traveler you are" },
    step4: { desc: "Let me know your MBTI 👀" },
    ui: {
      photoAdd: "Add Photo", photoTip: "Upload a nice photo showing your face 📸", photoBoost: "30% Match Boost", photoAwesome: "Awesome profile!",
      bioLabel: "Bio *", destLabel: "Destination", datesLabel: "Travel Dates", max5: "Max 5 selections",
      styleLabel: "I want companions who are", vibeLabel: "My Vibe", multiSelect: "(Multi-select)",
      langLabel: "Languages Spoken", regionLabel: "Select Destination Regions", preview: "Profile Preview", nameAge: "Name (Age)",
      bioPreview: "Bio preview", mbtiSelect: "Select your MBTI (Optional)", yourMbti: "Your MBTI", mbtiTip: "MBTI compatibility will be considered ✨"
    },
    placeholders: { bio: "Tell us about the trip you want 😊", dest: "e.g., Chiang Mai, Tokyo, Da Nang...", dates: "e.g., Apr 1 - 10" },
    buttons: { start: "Start Migo!" },
    errors: { bio: "Please add a photo and bio", style: "Choose at least one travel style", region: "Choose at least one region", save: "Save Failed", saveDesc: "Please try again later" },
    success: { title: "Profile Setup Complete!", desc: "Enjoy your trip with Migo!" }
  },
  verify: {
    title: "Verification Center", subtitle: "Build trust for better trips", comingSoon: "Coming soon",
    countries: { sg: "Singapore", th: "Thailand", vn: "Vietnam", id: "Indonesia", my: "Malaysia", ph: "Philippines", br: "Brazil", mx: "Mexico", es: "Spain", it: "Italy" },
    items: {
      phone: { title: "Phone Verification", desc: "Protect your account with a real number", badge: "📱 Verified" },
      email: { title: "Email Verification", desc: "Get account recovery and notifs", badge: "✉️ Verified" },
      id: { title: "ID Verification 🪪", desc: "Get maximum trust with real name verification", badge: "🪪 ID Verified" },
      sns: { title: "SNS Link", desc: "Link your Instagram or Facebook", badge: "🔗 Linked" },
      review: { title: "Trip Reviews", desc: "Boost trust with reviews", badge: "⭐ Verified" }
    },
    levels: { top: "Top Trust", high: "High Trust", verified: "Verified", basic: "Basic Trust", none: "Unverified" },
    ui: { next: "Next →", processing: "Processing..." },
    errors: { server: "A server error occurred.", updateFail: "Failed to update verification", login: "Please log in.", phoneRequired: "Enter your phone number.", otpRequired: "Enter the 6-digit OTP.", alreadyVerified: "Already verified." },
    success: { id: { title: "ID Verified!", desc: "Your ID verification has been approved." }, otpSent: "OTP sent.", phone: { title: "Phone Verified!", desc: "Your trust score increased." }, request: { title: "Request Submitted", desc: "Our team will review it." } },
    placeholders: { phone: "Phone number (digits only)", otp: "6-digit OTP" },
    buttons: { sendOtp: "Send OTP", resend: "Resend OTP", confirm: "Confirm", submit: "Submit" },
    id: { uploadDesc: "Upload your ID photo.", uploadTip: "Ensure no glare and clear photo.", prompt: "Proceed with ID verification?" },
    status: { verified: "Verified", pending: "Pending Approval" }
  },
  login: {
    otpDone: "✅ Phone verified!",
    otpError: "Invalid code",
    otpErrorDesc: "Code is incorrect or expired. Please try again.",
    signupDone: "🎉 Welcome to Migo!",
    loginFail: "Sign in failed",
    signupFail: "Sign up failed"
  },
`;

const korAdditions = `
  tutorial: {
    welcome: { title: "Migo에 오신 걸 환영해요!", desc: "전 세계 여행자와 연결되는 특별한 경험을 시작해볼까요?" },
    swipe: { title: "스와이프로 인연 찾기", desc: "마음에 드는 여행자를 오른쪽으로 스와이프하면 매칭 요청을 보낼 수 있어요! 왼쪽은 패스." },
    discover: { title: "여행 그룹 탐색", desc: "탐색 탭에서 나와 여행 스타일이 맞는 그룹을 찾고 참여해보세요." },
    map: { title: "지도로 주변 여행자 찾기", desc: "지도 탭에서 지금 내 근처에 있는 여행자를 실시간으로 확인할 수 있어요." },
    chat: { title: "매칭되면 바로 채팅!", desc: "매칭 성사 시 채팅 탭에서 대화를 시작하세요." },
    profile: { title: "나만의 프로필 꾸미기", desc: "프로필을 완성할수록 매칭 확률이 높아져요!" },
    done: { title: "준비 완료!", desc: "이제 Migo를 마음껏 즐겨보세요." },
    hints: { discover: "탐색 탭 (하단 두 번째 아이콘)", map: "지도 탭 (하단 세 번째 아이콘)", chat: "채팅 탭 (하단 네 번째 아이콘)", profile: "프로필 탭 (하단 다섯 번째 아이콘)" },
    buttons: { start: "시작하기 🚀", next: "다음" }
  },
  trustModal: {
    levels: [
      { label: "기본 인증", sub: "전화번호 인증", desc: "실제 사용 번호로 계정을 보호해요.", how: "가입 시 자동 완료" },
      { label: "본인 확인", sub: "신분증 인증", desc: "최고 수준의 신뢰도를 얻어요.", how: "신분증 제출" },
      { label: "최고 신뢰", sub: "전체 인증 완료", desc: "가장 신뢰할 수 있는 사용자.", how: "모든 인증 완료" }
    ],
    title: "신뢰 인증 관리", subtitle: "인증 단계가 높을수록 매칭률이 올라가요",
    currentStatus: "현재 인증 상태", completedBadge: "완료", nextBadge: "다음 단계",
    status: { none: "미인증 — 인증을 시작하세요", basic: "✅ 기본 인증 완료", id: "🪪 본인 확인 완료", top: "🏆 최고 신뢰 완료" },
    buttons: { processing: "처리 중...", basic: "전화번호 인증하기", id: "신분증 인증 요청", top: "얼굴 인증 요청" },
    footer: "정보는 인증 목적으로만 사용되며 암호화 보관됩니다",
    errors: { login: { title: "로그인이 필요합니다." }, request: { title: "요청 실패", desc: "알 수 없는 오류" } },
    info: { basic: { title: "기본 인증 안내", desc: "전화번호 인증은 가입 시 완료됩니다." } },
    success: { id: { title: "본인확인 인증 요청 접수!" }, top: { title: "최고신뢰 인증 요청 접수!" }, desc: "운영자가 검토 후결과 안내." }
  },
  voice: {
    unknownUser: "사용자", unknownUserFull: "알려지지 않은 유저", callEnded: "통화가 종료됐어요",
    unmute: "음소거 해제", mute: "음소거", speaker: "스피커", accept: "수락", decline: "거절", inCall: "통화 중...", connecting: "연결 중..."
  },
  swipe: { bio: { original: "원본", translate: "번역" }, likesMe: "나를 좋아해요!", interests: "관심사" },
  setup: {
    step0: { title: "사진 &\\n자기소개", desc: "첫인상이 중요해요 ✨" },
    step1: { title: "여행 스타일\\n&\\n선호", desc: "나와 맞는 동행을 찾아요" },
    step2: { title: "목적지 &\\n일정", desc: "우리 만날 수 있을까요?" },
    step3: { title: "여행 성향\\n&\\n언어", desc: "어떤 여행객인지 알려주세요" },
    step4: { desc: "내 MBTI를 알려줄래 👀" },
    ui: {
      photoAdd: "사진 등록", photoTip: "얼굴이 잘 나온 멋진 사진을 등록해주세요 📸", photoBoost: "30% 매칭률 상승", photoAwesome: "멋진 프로필!",
      bioLabel: "자기소개 *", destLabel: "목적지", datesLabel: "여행 기간", max5: "최대 5개 선택 가능",
      styleLabel: "이런 동행을 원해요", vibeLabel: "내 성향", multiSelect: "(다중 선택)",
      langLabel: "구사하는 언어", regionLabel: "해당되는 여행 지역 선택", preview: "내 프로필 미리보기', nameAge: '이름 (나이)",
      bioPreview: "자기소개 미리보기", mbtiSelect: "내 MBTI를 선택해주세요 (선택사항)", yourMbti: "당신의 MBTI", mbtiTip: "매칭 시 MBTI 호환성을 반영해드립니다 ✨"
    },
    placeholders: { bio: "어떤 여행을 하고 싶고, 어떤 동행을 찾고 있는지 알려주세요 😊", dest: "예: 치앙마이, 도쿄, 다낭...", dates: "예: 4월 1일 - 10일" },
    buttons: { start: "Migo 시작하기!" },
    errors: { bio: "사진과 자기소개를 입력해주세요", style: "여행 스타일을 하나 이상 골라주세요", region: "관심 지역을 하나 이상 골라주세요", save: "저장 실패", saveDesc: "잠시 후 다시 시도해주세요" },
    success: { title: "프로필 설정 완료!", desc: "Migo와 함께 즐거운 여행되세요!" }
  },
  verify: {
    title: "인증 센터", subtitle: "신뢰할 수 있는 여행을 만들어요", comingSoon: "지원 예정",
    countries: { sg: "싱가포르", th: "태국", vn: "베트남", id: "인도네시아", my: "말레이시아", ph: "필리핀', br: '브라질", mx: "멕시코", es: "스페인", it: "이탈리아" },
    items: {
      phone: { title: "전화번호 인증", desc: "실제 사용 중인 번호로 계정을 보호해요", badge: "📱 인증됨" },
      email: { title: "이메일 인증", desc: "이메일로 계정 복구 및 알림을 받아요", badge: "✉️ 인증됨" },
      id: { title: "신분증 인증 🪪", desc: "실명 인증으로 최고 수준의 신뢰도를 얻어요", badge: "🪪 본인확인" },
      sns: { title: "SNS 연동", desc: "Instagram · Facebook 계정을 연결해요", badge: "🔗 SNS 연결" },
      review: { title: "여행 후기 평점", desc: "다른 여행자에게 후기를 받아 신뢰도를 올려요", badge: "⭐ 후기 인증" }
    },
    levels: { top: "최고 신뢰", high: "높은 신뢰", verified: "인증됨", basic: "기본 인증", none: "미인증" },
    ui: { next: "다음 →", processing: "처리 중..." },
    errors: { server: "서버 오류가 발생했습니다.", updateFail: "인증 내역 업데이트 실패", login: "로그인이 필요합니다.", phoneRequired: "전화번호를 입력해주세요.", otpRequired: "인증번호 6자리를 입력해주세요.", alreadyVerified: "이미 인증된 항목입니다." },
    success: { id: { title: "신분증 인증 완료!", desc: "신분증 인증이 승인되었습니다." }, otpSent: "인증번호를 발송했습니다.", phone: { title: "전화번호 인증 완료!", desc: "신뢰도가 상승했습니다." }, request: { title: "인증 요청 접수", desc: "운영팀에서 확인 후 승인해드립니다." } },
    placeholders: { phone: "전화번호 입력 (- 제외)", otp: "인증번호 6자리" },
    buttons: { sendOtp: "인증번호 발송", resend: "인증번호 재발송", confirm: "확인", submit: "제출하기" },
    id: { uploadDesc: "신분증 사진을 업로드해주세요.", uploadTip: "빛 반사가 없도록 선명하게 촬영해주세요.", prompt: "신분증 인증을 진행하시겠습니까?" },
    status: { verified: "인증 완료", pending: "승인 대기 중" }
  },
  login: {
    otpDone: "✅ 전화번호 인증 완료!",
    otpError: "인증번호 오류",
    otpErrorDesc: "코드가 올바르지 않거나 만료되었습니다. 재전송해 주세요.",
    signupDone: "🎉 Migo 가입을 환영해요!",
    loginFail: "로그인 실패",
    signupFail: "회원가입 실패"
  },
`;

['src/i18n/locales/ko.ts', 'src/i18n/locales/en.ts'].forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  const insertStr = f.includes('ko.ts') ? korAdditions : engAdditions;
  
  // First clear out the duplicate keys we know about to avoid compilation errors
  c = c.replace(/\\s+signupDone: .+/, '');
  c = c.replace(/\\s+loginFail: .+/, '');
  c = c.replace(/\\s+signupFail: .+/, '');
  c = c.replace(/\\s+otpDone: .+/, '');
  c = c.replace(/\\s+otpError: .+/, '');
  c = c.replace(/\\s+otpErrorDesc: .+/, '');
  
  if (!c.includes('tutorial: {')) {
    const lines = c.split('\\n');
    // Insert just before the last line (which is probably `};` or `export default ko;`)
    // Actually, ko.ts ends with:
    // };
    // export default ko;
    
    // Find the last `};`
    let lastBraceIdx = -1;
    for(let i=lines.length-1; i>=0; i--) {
       if (lines[i].trim() === '};' || lines[i].trim() === '}') {
           lastBraceIdx = i;
           break;
       }
    }
    
    if (lastBraceIdx !== -1) {
       // ensure the preceding line has a comma
       if (lines[lastBraceIdx-1] && !lines[lastBraceIdx-1].trim().endsWith(',')) {
          lines[lastBraceIdx-1] += ',';
       }
       lines.splice(lastBraceIdx, 0, insertStr);
       c = lines.join('\\n');
       fs.writeFileSync(f, c, 'utf8');
       console.log(f + ' updated successfully.');
    } else {
       console.log(f + ' could not find insertion point.');
    }
  }
});
