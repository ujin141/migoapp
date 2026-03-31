import fs from 'fs';

// 1. ProfileSetupPage.tsx: Remove lines 14-45
let psp = fs.readFileSync('src/pages/ProfileSetupPage.tsx', 'utf8');
let pLines = psp.split('\n');
pLines.splice(13, 31); // Removes the old TRAVEL_STYLES, REGIONS, LANGUAGES, PERSONALITIES
psp = pLines.join('\n');
// Also remove SETUP_STEPS (around line 66)
psp = psp.replace(/\n\/\/ Setup steps: 0=photo\/bio, 1=style, 2=destination, 3=personality, 4=done\nconst SETUP_STEPS = \[\n([\s\S]*?)\];\n/, '');
// Also replace string templates
psp = psp.replace('{ id: "planner", emoji: "📋", titleKey: "login.personality0Title", fb: "꼼꼼한 계획형" }', '{ id: "planner", emoji: "📋", titleKey: "profileSetup.personality0", fb: "꼼꼼한 계획형" }');
psp = psp.replace('<><Sparkles size={18} /> Migo 시작하기!</>', '<><Sparkles size={18} /> {t("profileSetup.start")}</>');
psp = psp.replace('<>다음 <ChevronRight size={18} /></>', '<>{t("profileSetup.next")} <ChevronRight size={18} /></>');
psp = psp.replace('<p className="text-xs text-muted-foreground mb-1">선택한 MBTI</p>', '<p className="text-xs text-muted-foreground mb-1">{t("profileSetup.selectedMbti")}</p>');
psp = psp.replace('<p className="text-xs text-muted-foreground mt-1">매칭 시 MBTI 호환성이 반영됩니다 ✨</p>', '<p className="text-xs text-muted-foreground mt-1">{t("profileSetup.mbtiNotice")}</p>');
fs.writeFileSync('src/pages/ProfileSetupPage.tsx', psp, 'utf8');

// 2. ProfilePage.tsx: Replace lines 1221-1239
let pp = fs.readFileSync('src/pages/ProfilePage.tsx', 'utf8');
pp = pp.replace('{ title: "제8조 (저작권)", content: "회사가 작성한 저작물에 대한 저작권 기타 지식재산권은 회사에 귀속합니다. 이용자는 회사가 제공하는 서비스를 이용함으로써 얻은 정보 중 회사에게 지식재산권이 귀속된 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다." }', '{ title: t("profile.terms8Title"), content: t("profile.terms8Content") }');
pp = pp.replace('{ title: "제9조 (책임제한)", content: "회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다. 회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다. 본 서비스를 통해 만난 이용자 간 발생하는 분쟁에 대해 회사는 개입의 의무가 없으며, 이로 인한 피해에 대해 회사는 책임을 지지 않습니다. 단, 신고된 사항에 대해 내부 정책에 따라 처리합니다." }', '{ title: t("profile.terms9Title"), content: t("profile.terms9Content") }');
pp = pp.replace('{ title: "제10조 (분쟁해결)", content: "회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여 피해보상처리기구를 설치·운영합니다. 회사와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은 민사소송법상의 관할법원에 제기합니다."}', '{ title: t("profile.terms10Title"), content: t("profile.terms10Content")}');
pp = pp.replace('<p className="text-xs text-muted-foreground"><span className="font-bold text-foreground">사업자 정보</span><br />회사명: Lunatics Group Inc<br />대표자: 송우진<br />이메일: support@lunaticsgroup.co.kr</p>', '<p className="text-xs text-muted-foreground"><span className="font-bold text-foreground">{t("profile.companyInfo")}</span><br />{t("profile.companyName")}: Lunatics Group Inc<br />{t("profile.ceo")}: {t("profile.managerName")}<br />{t("profile.email")}: support@lunaticsgroup.co.kr</p>');
fs.writeFileSync('src/pages/ProfilePage.tsx', pp, 'utf8');

// 3. TripCalendarPage.tsx
let tcp = fs.readFileSync('src/pages/TripCalendarPage.tsx', 'utf8');
tcp = tcp.replace('const DAYS = ["일", "월", "화", "수", "목", "금", "토"];\nconst MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];\n', '');
tcp = tcp.replace('d === "일" ? "text-rose-400" : d === "토" ? "text-blue-400" : "text-muted-foreground"', 'd === t("trip.days", {returnObjects:true})[0] ? "text-rose-400" : d === t("trip.days", {returnObjects:true})[6] ? "text-blue-400" : "text-muted-foreground"');
fs.writeFileSync('src/pages/TripCalendarPage.tsx', tcp, 'utf8');

// 4. VerificationPage.tsx
let vp = fs.readFileSync('src/pages/VerificationPage.tsx', 'utf8');
vp = vp.replace('{/* 앞면 */}', '{/* Front */}');
vp = vp.replace('{/* 뒷면 */}', '{/* Back */}');
vp = vp.replace('const idTypes = getArr(\'verif.id.idTypes\', ["주민등록증", "운전면허증", "여권"]);\nconst idTips = getArr(\'verif.id.tips\', ["만료되지 않은 신분증을 사용해주세요", "사진이 선명하게 보이도록 촬영해요", "개인정보는 보호되어 안전하게 보관해요", "인증 후 원본은 즉시 삭제됩니다"]);', '');
fs.writeFileSync('src/pages/VerificationPage.tsx', vp, 'utf8');

console.log('Purge done');
