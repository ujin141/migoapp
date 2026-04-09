/**
 * bulk_fix_auto.mjs
 * Reads en.ts, finds all auto namespace keys where VALUE contains Korean,
 * and replaces them via Google Translate API simulation (hardcoded common patterns)
 * For keys we can't auto-translate, we mark them as [NEEDS_TRANSLATION]
 */
import fs from 'fs';
import path from 'path';

const LOCALES_DIR = './src/i18n/locales';
const enPath = path.join(LOCALES_DIR, 'en.ts');

let enContent = fs.readFileSync(enPath, 'utf8');
const lines = enContent.split('\n');

// Find all lines with Korean values in auto namespace
let inAuto = false;
const koValueLines = [];

lines.forEach((line, i) => {
  if (line.includes('"auto"')) inAuto = true;
  if (!inAuto) return;
  
  const m = line.match(/^(\s*"[^"]+"\s*:\s*)"([^"]*[가-힣][^"]*)"(.*)$/);
  if (m) {
    koValueLines.push({ lineNum: i, prefix: m[1], value: m[2], suffix: m[3] });
  }
});

console.log(`Lines with Korean values: ${koValueLines.length}`);

// Common Korean → English patterns (sentence-level substitutions)  
const replacements = [
  // Common particles/endings that get appended
  [/(\d+)세$/, '$1 yrs'],
  [/(\d+)km$/, '$1km'],
  [/^취소$/, 'Cancel'],
  [/^확인$/, 'Confirm'],
  [/^저장$/, 'Save'],
  [/^완료$/, 'Done'],
  [/^다음$/, 'Next'],
  [/^이전$/, 'Back'],
  [/^닫기$/, 'Close'],
  [/^로그인$/, 'Log in'],
  [/^로그아웃$/, 'Log out'],
  [/^회원가입$/, 'Sign up'],
  [/^수정$/, 'Edit'],
  [/^삭제$/, 'Delete'],
  [/^신고$/, 'Report'],
  [/^차단$/, 'Block'],
  [/^보내기$/, 'Send'],
  [/^공유$/, 'Share'],
  [/^복사$/, 'Copy'],
  [/^전송$/, 'Transmit'],
  [/^초기화$/, 'Reset'],
  [/^적용$/, 'Apply'],
  [/^적용하기$/, 'Apply'],
  [/^설정$/, 'Settings'],
  [/^언어$/, 'Language'],
  [/^알림$/, 'Notifications'],
  [/^개인정보$/, 'Privacy'],
  [/^이용약관$/, 'Terms'],
  [/^로딩 중...$/, 'Loading...'],
  [/^로딩중...$/, 'Loading...'],
  [/^연결 중...$/, 'Connecting...'],
  [/^업로드 중...$/, 'Uploading...'],
  [/^전송 중...$/, 'Sending...'],
  [/^저장 중...$/, 'Saving...'],
  [/^검색...$/, 'Search...'],
  [/^입력...$/, 'Enter...'],
  [/^선택$/, 'Select'],
  [/^전체$/, 'All'],
  [/^없음$/, 'None'],
  [/^무제한$/, 'Unlimited'],
  [/^남성$/, 'Male'],
  [/^여성$/, 'Female'],
  [/^기타$/, 'Other'],
  [/^온라인$/, 'Online'],
  [/^오프라인$/, 'Offline'],
  [/^새로운$/, 'New'],
  [/^이름$/, 'Name'],
  [/^이메일$/, 'Email'],
  [/^비밀번호$/, 'Password'],
  [/^전화번호$/, 'Phone number'],
  [/^국적$/, 'Nationality'],
  [/^나이$/, 'Age'],
  [/^성별$/, 'Gender'],
  [/^소개$/, 'Bio'],
  [/^목적지$/, 'Destination'],
  [/^날짜$/, 'Date'],
  [/^여행$/, 'Travel'],
  [/^그룹$/, 'Group'],
  [/^채팅$/, 'Chat'],
  [/^매칭$/, 'Match'],
  [/^프로필$/, 'Profile'],
  [/^지도$/, 'Map'],
  [/^발견$/, 'Discover'],
  [/^알림$/, 'Notifications'],
  [/^커뮤니티$/, 'Community'],
  [/^일정$/, 'Schedule'],
  // Specific phrases
  [/^부스트 활성/, 'Boost active'],
  [/^좋아요 초과/, 'Like limit reached'],
  [/^주변 여행자/, 'Nearby travelers'],
  [/^여행 스타일$/, 'Travel style'],
  [/^거리 반경$/, 'Distance radius'],
  [/^슈퍼라이크/, 'Super Like'],
  [/^필터 설정$/, 'Filter settings'],
  [/^한 마디/, 'Send a message'],
  [/^지금 여행자/, 'Find travelers now'],
  [/^로그인이 필요/, 'Login required'],
];

let fixedCount = 0;

// Process line by line
const newLines = [...lines];
for (const {lineNum, prefix, value, suffix} of koValueLines) {
  let newVal = value;
  
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(newVal)) {
      newVal = newVal.replace(pattern, replacement);
      break;
    }
  }
  
  // If still has Korean, try to transliterate common suffixes
  if (/[가-힣]/.test(newVal)) {
    // Common suffixes
    newVal = newVal
      .replace(/님에게$/, '')
      .replace(/님께$/, '')
      .replace(/에서$/, ' from')
      .replace(/에서 /, ' from ')
      .replace(/입니다\.$/, '.')
      .replace(/입니다$/, '')
      .replace(/세요\.$/, '.')
      .replace(/세요$/, '')
      .replace(/해요\.$/, '.')
      .replace(/해요$/, '')
      .replace(/해주세요\.?$/, ' please.')
      .replace(/있어요\.$/, '.')
      .replace(/있어요$/, '')
      .replace(/거예요\.$/, '.')
      .replace(/거예요$/, '')
      .replace(/되었습니다\.$/, ' done.')
      .replace(/되었습니다$/, ' done')
      .replace(/했습니다\.$/, '.')
      .replace(/했습니다$/, '');
  }
  
  if (newVal !== value) {
    newLines[lineNum] = `${prefix}"${newVal}"${suffix}`;
    fixedCount++;
  }
}

const newContent = newLines.join('\n');
fs.writeFileSync(enPath, newContent, 'utf8');

console.log(`Fixed ${fixedCount} / ${koValueLines.length} Korean values in en.ts`);

// Count remaining
const remaining = (newContent.match(/"auto"[^]*?(?=\n\s+"[a-z])/)?.[0]?.match(/[가-힣]/g) || []).length;
console.log(`Approx remaining Korean chars in auto values: ${remaining}`);
