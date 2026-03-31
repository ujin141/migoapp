import fs from 'fs';

// 1. ProfilePage.tsx
let pp = fs.readFileSync('src/pages/ProfilePage.tsx', 'utf8');
pp = pp.replace('네, 탈퇴하겠습니다 (계정 삭제)', '{t("profile.withdrawConfirm")}');
pp = pp.replace('취소', '{t("profile.cancel")}');
pp = pp.replace('<h2 className="text-lg font-extrabold text-foreground">이용약관</h2>', '<h2 className="text-lg font-extrabold text-foreground">{t("profile.termsTitle")}</h2>');
pp = pp.replace('<p className="text-xs text-muted-foreground">시행일: 2025년 1월 1일 · 최종 수정: 2026년 3월 1일</p>', '<p className="text-xs text-muted-foreground">{t("profile.termsEffective")}</p>');
pp = pp.replace('{ title: "제1조 (목적)", content: "이 약관은 Lunatics Group Inc(이하 \'회사\')가 운영하는 모바일 애플리케이션 Migo(이하 \'서비스\')를 이용함에 있어 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다." }', '{ title: t("profile.terms1Title"), content: t("profile.terms1Content") }');
pp = pp.replace('{ title: "제2조 (정의)", content: "\'서비스\'란 회사가 제공하는 여행자 매칭 플랫폼 Migo 및 이와 관련한 일체의 서비스를 의미합니다. \'이용자\'란 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다. \'회원\'이란 회사에 개인정보를 제공하고 회원등록을 한 자로 회사의 정보를 지속적으로 제공받으며 회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다." }', '{ title: t("profile.terms2Title"), content: t("profile.terms2Content") }');
pp = pp.replace('{ title: "제3조 (약관의 효력 및 변경)", content: "이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력을 발생합니다. 회사는 합리적인 사유가 있는 경우 관련 법령에 위배되지 않는 범위에서 이 약관을 변경할 수 있으며, 변경 시 적용일자 및 개정사유를 명시하여 현행 약관과 함께 서비스 초기화면에 그 적용일자 7일 이전부터 공지합니다." }', '{ title: t("profile.terms3Title"), content: t("profile.terms3Content") }');
pp = pp.replace('{ title: "제4조 (회원가입)", content: "이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다. 회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다. 가입신청자가 이 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우, 등록 내용에 허위, 기재누락, 오기가 있는 경우, 만 14세 미만인 경우 등에는 가입을 거절할 수 있습니다." }', '{ title: t("profile.terms4Title"), content: t("profile.terms4Content") }');
pp = pp.replace('{ title: "제5조 (서비스의 제공 및 변경)", content: "회사는 다음과 같은 업무를 수행합니다. 여행자 프로필 매칭 서비스, 여행 그룹 생성 및 참여 서비스, 실시간 채팅 서비스, 위치 기반 여행자 탐색 서비스, Migo Plus 유료 구독 서비스 및 기타 회사가 추가 개발하거나 다른 회사와의 제휴 계약 등을 통해 회원에게 제공하는 일체의 서비스." }', '{ title: t("profile.terms5Title"), content: t("profile.terms5Content") }');
pp = pp.replace('{ title: "제6조 (서비스 이용)", content: "서비스 이용시간은 회사의 업무상 또는 기술상 특별한 지장이 없는 한 연중무휴를 원칙으로 합니다. 다만, 정기 점검 등의 필요로 회사가 정한 날이나 시간은 그러하지 아니합니다. 회사는 서비스를 일정 범위로 분할하여 각 범위별로 이용 가능 시간을 별도로 지정할 수 있습니다." }', '{ title: t("profile.terms6Title"), content: t("profile.terms6Content") }');
pp = pp.replace('{ title: "제7조 (이용자의 의무)", content: "이용자는 다음 행위를 하여서는 안 됩니다. 허위 정보 등록, 타인 정보 도용, 회사가 게시한 정보 변경, 회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 송신 또는 게시, 회사와 기타 제3자의 저작권 등 지식재산권 침해, 회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위, 외설적이거나 폭력적인 메시지나 화상을 유포하는 행위, 스팸 또는 불법 콘텐츠 게시 행위." }', '{ title: t("profile.terms7Title"), content: t("profile.terms7Content") }');
fs.writeFileSync('src/pages/ProfilePage.tsx', pp, 'utf8');

// 2. ProfileSetupPage.tsx
let psp = fs.readFileSync('src/pages/ProfileSetupPage.tsx', 'utf8');
const lines = psp.split('\n');
const sTarget = lines.findIndex(l => l.includes('const SETUP_STEPS = ['));
if (sTarget !== -1) {
  const eTarget = lines.findIndex((l, i) => i > sTarget && l.includes('];'));
  if (eTarget !== -1) {
    lines.splice(sTarget, eTarget - sTarget + 1);
  }
}
psp = lines.join('\n');
psp = psp.replace('const [languages, setLanguages] = useState<string[]>(["한국어"]);', 'const [languages, setLanguages] = useState<string[]>([t("profileSetup.langDefault", "한국어")]);');
// There's also `login.personality0Title` fb literals remaining:
psp = psp.replace('fb: "자유로운 즉흥형"', 'fb: t("login.personality1Title")');
psp = psp.replace('fb: "사람 만나길 좋아함"', 'fb: t("login.personality2Title")');
psp = psp.replace('fb: "혼자 여행 선호"', 'fb: t("login.personality3Title")');
psp = psp.replace('fb: "사진/기록 위주"', 'fb: t("login.personality4Title")');
psp = psp.replace('fb: "먹기 위해 여행"', 'fb: t("login.personality5Title")');
fs.writeFileSync('src/pages/ProfileSetupPage.tsx', psp, 'utf8');

// 3. TripCalendarPage.tsx
let tcp = fs.readFileSync('src/pages/TripCalendarPage.tsx', 'utf8');
tcp = tcp.replace('const DAYS = ["일", "월", "화", "수", "목", "금", "토"];', '');
tcp = tcp.replace('const MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];', '');
fs.writeFileSync('src/pages/TripCalendarPage.tsx', tcp, 'utf8');

// 4. VerificationPage.tsx
let vp = fs.readFileSync('src/pages/VerificationPage.tsx', 'utf8');
vp = vp.replace('>인증<', '>{t("verif.verifyBtn")}<');
vp = vp.replace('>번호 다시 입력<', '>{t("verif.reenterBtn")}<');
vp = vp.replace('인증\n', '{t("verif.verifyBtn")}\n');
vp = vp.replace('번호 다시 입력\n', '{t("verif.reenterBtn")}\n');
fs.writeFileSync('src/pages/VerificationPage.tsx', vp, 'utf8');

console.log('Very Final Purge Done');
