import fs from 'fs';
import path from 'path';

const localesDir = path.join(process.cwd(), 'src', 'i18n', 'locales');
const findAccountPath = path.join(process.cwd(), 'src', 'pages', 'FindAccountPage.tsx');
const resetPasswordPath = path.join(process.cwd(), 'src', 'pages', 'ResetPasswordPage.tsx');

const koTranslations = {
  findAccount: {
    noName: "이름을 먼저 입력해주세요.",
    needPhone: "휴대폰 번호를 입력해주세요.",
    otpSent: "인증번호가 발송되었습니다.",
    noMatch: "일치하는 계정 정보가 없습니다.",
    success: "본인인증 완료 및 아이디 찾기 성공",
    otpFail: "인증 실패",
    badEmail: "올바른 이메일 주소를 입력해주세요.",
    resetMailSent: "비밀번호 재설정 메일이 발송되었습니다. 메일함을 확인해주세요.",
    resetMailFail: "전송 실패",
    title: "계정 복구",
    tabId: "아이디 찾기",
    tabPw: "비밀번호 찾기",
    descId: "가입 시 등록한 **이름**과 **휴대폰 번호(+인증)**가 일치해야 조회가 가능합니다.",
    inputName: "가입한 이름",
    inputNamePh: "홍길동",
    inputPhone: "휴대폰 번호",
    btnOtpResend: "인증문자 다시 받기",
    btnOtpSend: "인증문자 받기",
    otpLabel: "인증번호 입력",
    otpPh: "6자리 숫자",
    btnOtpWait: "조회 중...",
    btnVerifyOtp: "인증 확인 및 아이디 찾기",
    foundIdLabel: "고객님의 가입 이메일(아이디)",
    btnLogin: "이 계정으로 로그인하기",
    descPw: "가입 시 등록하신 이메일 주소를 입력해 주시면 **비밀번호 재설정 링크**가 포함된 메일을 발송해 드립니다.",
    inputEmail: "가입한 이메일",
    inputEmailPh: "hello@example.com",
    btnResetWait: "발송 중...",
    btnResetSend: "재설정 링크 받기",
    resetDoneTitle: "이메일 발송 완료",
    resetDoneDesc1: "로 비밀번호 재설정 링크를 보냈습니다.",
    resetDoneDesc2: "메일함을 확인해 주세요.",
    btnBackLogin: "로그인 페이지로 돌아가기",
    authCmp: "인증 실패"
  },
  resetPassword: {
    changeFail: "변경 실패",
    btnChange: "비밀번호 변경 완료하기",
    changeSuccess: "비밀번호가 성공적으로 변경되었습니다.",
    invalidLink: "유효하지 않거나 만료된 링크입니다.",
    doneTitle: "변경이 완료되었습니다!",
    confirmPw: "비밀번호 확인",
    setNew: "새 비밀번호 설정",
    newPw: "새 비밀번호",
    descNew: "안전하게 로그인할 수 있도록 8자 이상의 강력한 새 비밀번호를 입력해주세요.",
    descDone: "안전한 서비스 이용을 위해 새 비밀번호를 기억해 주세요. 곧 로그인 화면으로 이동합니다."
  }
};

// 1. Update ko.ts
let koContent = fs.readFileSync(path.join(localesDir, 'ko.ts'), 'utf8');
if (!koContent.includes('findAccount')) {
  const insertBefore = '};\nexport default ko;';
  const insertionPoint = koContent.lastIndexOf(insertBefore);
  if (insertionPoint !== -1) {
    const jsonStr = JSON.stringify(koTranslations, null, 2);
    // remove open/close braces to append
    const innerJson = jsonStr.substring(jsonStr.indexOf('\n') + 1, jsonStr.lastIndexOf('\n'));
    koContent = koContent.substring(0, insertionPoint) + '  ,\n  ' + innerJson + '\n' + koContent.substring(insertionPoint);
    fs.writeFileSync(path.join(localesDir, 'ko.ts'), koContent, 'utf8');
    console.log("Updated ko.ts successfully.");
  }
}

// 2. Patch FindAccountPage.tsx
let fap = fs.readFileSync(findAccountPath, 'utf8');
const fapReplacements = [
  ['"이름을 먼저 입력해주세요."', 't("findAccount.noName")'],
  ['"인증번호가 발송되었습니다."', 't("findAccount.otpSent")'],
  ['"일치하는 계정 정보가 없습니다."', 't("findAccount.noMatch")'],
  ['"본인인증 완료 및 아이디 찾기 성공"', 't("findAccount.success")'],
  ['"인증 실패"', 't("findAccount.otpFail")'],
  ['"올바른 이메일 주소를 입력해주세요."', 't("findAccount.badEmail")'],
  ['"비밀번호 재설정 메일이 발송되었습니다. 메일함을 확인해주세요."', 't("findAccount.resetMailSent")'],
  ['"전송 실패"', 't("findAccount.resetMailFail")'],
  ['>계정 복구<', '>{t("findAccount.title")}<'],
  ['>아이디 찾기<', '>{t("findAccount.tabId")}<'],
  ['>비밀번호 찾기<', '>{t("findAccount.tabPw")}<'],
  ['>가입 시 등록한 **이름**과 **휴대폰 번호(+인증)**가 일치해야 조회가 가능합니다.<', '>{t("findAccount.descId")}<'],
  ['>가입한 이름<', '>{t("findAccount.inputName")}<'],
  ['"홍길동"', 't("findAccount.inputNamePh")'],
  ['>휴대폰 번호<', '>{t("findAccount.inputPhone")}<'],
  ['"인증문자 다시 받기"', 't("findAccount.btnOtpResend")'],
  ['"인증문자 받기"', 't("findAccount.btnOtpSend")'],
  ['>인증번호 입력<', '>{t("findAccount.otpLabel")}<'],
  ['"6자리 숫자"', 't("findAccount.otpPh")'],
  ['"조회 중..."', 't("findAccount.btnOtpWait")'],
  ['"인증 확인 및 아이디 찾기"', 't("findAccount.btnVerifyOtp")'],
  ['>고객님의 가입 이메일(아이디)<', '>{t("findAccount.foundIdLabel")}<'],
  ['>이 계정으로 로그인하기<', '>{t("findAccount.btnLogin")}<'],
  ['>가입 시 등록하신 이메일 주소를 입력해 주시면 **비밀번호 재설정 링크**가 포함된 메일을 발송해 드립니다.<', '>{t("findAccount.descPw")}<'],
  ['>가입한 이메일<', '>{t("findAccount.inputEmail")}<'],
  ['"hello@example.com"', 't("findAccount.inputEmailPh")'],
  ['"재설정 링크 받기"', 't("findAccount.btnResetSend")'],
  ['>이메일 발송 완료<', '>{t("findAccount.resetDoneTitle")}<'],
  ['>로그인 페이지로 돌아가기<', '>{t("findAccount.btnBackLogin")}<']
];
for (const [kr, en] of fapReplacements) {
  fap = fap.split(kr).join(en);
}
// Special case JSX logic
fap = fap.replace(
  '>\n                    <strong className="text-foreground">{email}</strong> 로 비밀번호 재설정 링크를 보냈습니다.<br />메일함을 확인해 주세요.\n                  </p>',
  '>\n                    <strong className="text-foreground">{email}</strong> {t("findAccount.resetDoneDesc1")}<br />{t("findAccount.resetDoneDesc2")}\n                  </p>'
);
fs.writeFileSync(findAccountPath, fap, 'utf8');
console.log("Updated FindAccountPage.tsx successfully.");

// 3. Patch ResetPasswordPage.tsx
let rpp = fs.readFileSync(resetPasswordPath, 'utf8');
const rppReplacements = [
  ['"변경 실패"', 't("resetPassword.changeFail")'],
  ['"비밀번호 변경 완료하기"', 't("resetPassword.btnChange")'],
  ['"비밀번호가 성공적으로 변경되었습니다."', 't("resetPassword.changeSuccess")'],
  ['"유효하지 않거나 만료된 링크입니다."', 't("resetPassword.invalidLink")'],
  ['>유효하지 않거나 만료된 링크입니다.<', '>{t("resetPassword.invalidLink")}<'],
  ['>변경이 완료되었습니다!<', '>{t("resetPassword.doneTitle")}<'],
  ['>비밀번호 확인<', '>{t("resetPassword.confirmPw")}<'],
  ['>새 비밀번호 설정<', '>{t("resetPassword.setNew")}<'],
  ['>새 비밀번호<', '>{t("resetPassword.newPw")}<'],
  ['>안전하게 로그인할 수 있도록 8자 이상의 강력한 새 비밀번호를 입력해주세요.<', '>{t("resetPassword.descNew")}<'],
  ['>안전한 서비스 이용을 위해 새 비밀번호를 기억해 주세요. 곧 로그인 화면으로 이동합니다.<', '>{t("resetPassword.descDone")}<']
];
for (const [kr, en] of rppReplacements) {
  rpp = rpp.split(kr).join(en);
}
fs.writeFileSync(resetPasswordPath, rpp, 'utf8');
console.log("Updated ResetPasswordPage.tsx successfully.");

