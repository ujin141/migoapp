import fs from 'fs';

// --- ProfilePage.tsx ---
let pp = fs.readFileSync('src/pages/ProfilePage.tsx', 'utf8');

const ppReplacements = {
  '슈퍼라이크 무제한 · 부스트 · 프로필 본 사람': '{t("profile.subDesc")}',
  '>프로필 수정<': '>{t("profile.editProfile")}<',
  '예: 3월 20일 - 28일': '{t("profile.datePlaceholder")}',
  '알림 설정이 저장되었어요 ✅': 't("profile.notifSaved")',
  '>저장하기<': '>{t("profile.saveBtn")}<',
  '{ value: "everyone", label: "모든 사람", desc: "앱 사용자 모두에게 공개" }': '{ value: "everyone", label: t("profile.everyone"), desc: t("profile.everyoneDesc") }',
  '개인정보 설정이 저장되었어요 ✅': 't("profile.privacySaved")',
  'q: "Migo는 어떤 앱인가요?", a: "여행 중인 사람들끼리 매칭하여 동행을 찾을 수 있는 여행 소셜 앱입니다."': 'q: t("profile.faq1q"), a: t("profile.faq1a")',
  'q: "매칭은 어떻게 이루어지나요?", a: "두 사람이 서로 좋아요를 누르면 매칭이 성사됩니다."': 'q: t("profile.faq2q"), a: t("profile.faq2a")',
  'q: "슈퍼라이크는 무엇인가요?", a: "상대방에게 특별한 관심을 표현하는 기능으로, 항상 매칭이 됩니다."': 'q: t("profile.faq3q"), a: t("profile.faq3a")',
  'q: "안전하게 이용하려면?", a: "처음 만남은 공개된 장소에서 만나고, 신뢰할 수 없는 사람은 신고해주세요."': 'q: t("profile.faq4q"), a: t("profile.faq4a")',
  'q: "계정은 어디서 삭제하나요?", a: "설정 > 계정 삭제 메뉴에서 진행할 수 있습니다."': 'q: t("profile.faq5q"), a: t("profile.faq5a")',
  '>로그아웃 후에도 언제든지 다시 로그인할 수 있어요<': '>{t("profile.logoutDesc")}<',
  '>로그아웃<': '>{t("profile.logoutBtn")}<',
  '>매칭 목록<': '>{t("profile.matchList")}<',
  '>아직 매칭된 상대가 없어요<': '>{t("profile.noMatches")}<',
  '>매칭<': '>{t("profile.matchBadge")}<',
  '>내 여행<': '>{t("profile.myTrips")}<',
  'trip.status === "진행 중"': 'trip.status === t("profile.statusOngoing")',
  'trip.status === "예정"': 'trip.status === t("profile.statusUpcoming")',
  '>정말로 탈퇴하시겠습니까?<': '>{t("profile.withdrawConfirmTitle")}<',
  '탈퇴 시 프로필, 메시지, 여행 일정 등<br />모든 데이터가 삭제되어 복구할 수 없습니다.': '{t("profile.withdrawConfirmDesc1")}<br />{t("profile.withdrawConfirmDesc2")}',
  '>취소<': '>{t("profile.cancelBtn")}<',
  '>네, 탈퇴하겠습니다 (계정 삭제)<': '>{t("profile.withdrawBtn")}<'
};

for (const [k, v] of Object.entries(ppReplacements)) {
  pp = pp.replace(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), v);
}
fs.writeFileSync('src/pages/ProfilePage.tsx', pp, 'utf8');


// --- PrivacyPage.tsx ---
if (fs.existsSync('src/pages/PrivacyPage.tsx')) {
  let pvp = fs.readFileSync('src/pages/PrivacyPage.tsx', 'utf8');
  const pvpReplacements = {
    '서비스 제공을 위한 업무 위탁 (아래 위탁 업체 참고)': '{t("privacy.bullet1")}',
    '5. 개인정보 처리 위탁': '{t("privacy.h5")}',
    'Twilio Inc. (미국)': '{t("privacy.twilio")}',
    '위탁 업무: SMS 본인인증': '{t("privacy.twilioDesc")}',
    'Supabase Inc. (미국)': '{t("privacy.supabase")}',
    '위탁 업무: 서버 인프라, 데이터베이스, 인증': '{t("privacy.supabaseDesc")}',
    '각 업체는 Migo와 동등한 수준의 개인정보 보호 조치를 취하도록 계약되어 있습니다.': '{t("privacy.notice")}',
    '6. 사용자의 권리': '{t("privacy.h6")}',
    '사용자는 언제든지 다음 권리를 행사할 수 있습니다:': '{t("privacy.rightsIntro")}',
    '개인정보 열람 요청': '{t("privacy.right1")}',
    '개인정보 수정 요청': '{t("privacy.right2")}',
    '개인정보 삭제 요청 (탈퇴)': '{t("privacy.right3")}',
    '개인정보 처리 정지 요청': '{t("privacy.right4")}',
    '마케팅 수신 동의 철회': '{t("privacy.right5")}',
    '7. 개인정보 보안': '{t("privacy.h7")}',
    'Migo는 개인정보 보호를 위해 다음 조치를 취합니다:': '{t("privacy.secIntro")}',
    '256-bit SSL/TLS 암호화 전송': '{t("privacy.sec1")}',
    '비밀번호 단방향 암호화 저장': '{t("privacy.sec2")}',
    'Row Level Security (RLS) 적용': '{t("privacy.sec3")}',
    '정기적인 보안 점검': '{t("privacy.sec4")}',
    '8. 개인정보 보호책임자': '{t("privacy.h8")}',
    '담당:': '{t("privacy.managerLabel")}',
    'Migo 개인정보 보호팀': '{t("privacy.managerName")}',
    '이메일:': '{t("privacy.emailLabel")}'
  };

  for (const [k, v] of Object.entries(pvpReplacements)) {
    pvp = pvp.replace(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), v);
  }
  fs.writeFileSync('src/pages/PrivacyPage.tsx', pvp, 'utf8');
}


// --- ProfileSetupPage.tsx ---
let psp = fs.readFileSync('src/pages/ProfileSetupPage.tsx', 'utf8');
psp = psp.replace(/\{ title: "프로필 사진 &\n자기소개", sub: "첫인상이 중요해요 📸", icon: "🤳" \},/g, '{ title: t("profileSetup.step1Title"), sub: t("profileSetup.step1Sub"), icon: "🤳" },');
psp = psp.replace(/\{ title: "여행 스타일\n&\n선호도", sub: "나와 맞는 동행을 찾아요", icon: "✈️" \},/g, '{ title: t("profileSetup.step2Title"), sub: t("profileSetup.step2Sub"), icon: "✈️" },');
psp = psp.replace(/\{ title: "관심 여행지 &\n언어", sub: "어디로 떠나고 싶으세요\?", icon: "🗺️" \},/g, '{ title: t("profileSetup.step3Title"), sub: t("profileSetup.step3Sub"), icon: "🗺️" },');
psp = psp.replace(/\{ title: "성격 유형\n&\n여행 방식", sub: "어떤 여행자인지 알려주세요", icon: "🧭" \},/g, '{ title: t("profileSetup.step4Title"), sub: t("profileSetup.step4Sub"), icon: "🧭" },');
psp = psp.replace(/\{ title: "MBTI", sub: "나의 성격 유형을 알려주세요 ✨", icon: "🧠" \},/g, '{ title: t("profileSetup.step5Title"), sub: t("profileSetup.step5Sub"), icon: "🧠" },');
fs.writeFileSync('src/pages/ProfileSetupPage.tsx', psp, 'utf8');

// --- VerificationPage.tsx ---
let vp = fs.readFileSync('src/pages/VerificationPage.tsx', 'utf8');
vp = vp.replace(/>인증</g, '>{t("verif.verifyBtn")}<');
vp = vp.replace(/>번호 다시 입력</g, '>{t("verif.reenterBtn")}<');
vp = vp.replace(/인증\n/g, '{t("verif.verifyBtn")}\n');
vp = vp.replace(/번호 다시 입력\n/g, '{t("verif.reenterBtn")}\n');
// Fix exact matches for those floating texts
vp = vp.replace('<div className="font-extrabold text-[15px] mb-2">인증</div>', '<div className="font-extrabold text-[15px] mb-2">{t("verif.verifyBtn")}</div>');
vp = vp.replace('<div className="font-extrabold text-[15px] mb-2 bg-clip-text text-transparent gradient-primary">번호 다시 입력</div>', '<div className="font-extrabold text-[15px] mb-2 bg-clip-text text-transparent gradient-primary">{t("verif.reenterBtn")}</div>');
fs.writeFileSync('src/pages/VerificationPage.tsx', vp, 'utf8');

console.log("Translations Patched");
