/**
 * fix_en_auto_values.mjs
 * Translates all Korean values in en.ts auto namespace to English
 * then resyncs all non-KO locale auto namespaces
 */
import fs from 'fs';
import path from 'path';

const LOCALES_DIR = './src/i18n/locales';

// Known Korean → English translations for MatchPage j-keys and common strings
// These are extracted from the context of MatchPage.tsx
const TRANSLATIONS = {
  // MatchPage j500-j522 (filter modal, boost, empty states)
  'j500': 'Boost activated! Your profile is being boosted',
  'j501': 'No more likes today! Upgrade to Plus for unlimited',
  'j502': 'You\'ve seen all nearby travelers!',
  'j503': 'New travelers will appear soon',
  'j504': 'Try again after filter settings',
  'j505': '❤️ You sent a like',
  'j506': 'Super Like',
  'j507': 'Send a message',
  'j508': '(optional)',
  'j509': 'Cancel',
  'j510': 'Send Super Like',
  'j511': 'Filter settings',
  'j512': 'Distance radius',
  'j513': 'Travel style',
  'j514': 'Reset',
  'j515': 'Apply',
  'j516': 'Login required',
  'j517': 'Please log in to start matching',
  'j518': 'with other travelers!',
  'j519': 'Login',
  'j520': 'Sign up',
  'j521': 'Continue as guest',
  'j522': 'Find travelers now',
};

// Common Korean phrases → English (for patterns in values)
const PHRASE_MAP = [
  // MatchPage related
  ['부스트 활성화! 내 프로필이 상위 노출 중', 'Boost active! Your profile is featured at the top'],
  ['오늘 반응 없는 진!. Plus로 무제한 가능', 'No more likes today! Unlimited with Plus'],
  ['주변 여행자를 모두 확인했어요!', 'You\'ve seen all nearby travelers!'],
  ['잠시 후 새로운 여행자가 나타날 거예요', 'New travelers will appear soon'],
  ['필터 설정 후 다시 보기', 'Try again after adjusting filters'],
  ['❤️ 좋아요를 보냈어요', '❤️ You sent a like'],
  ['슈퍼라이크', 'Super Like'],
  ['한 마디 보내기', 'Send a message'],
  ['(선택)', '(optional)'],
  ['취소', 'Cancel'],
  ['슈퍼라이크 보내기', 'Send Super Like'],
  ['필터 설정', 'Filter settings'],
  ['거리 반경', 'Distance radius'],
  ['여행 스타일', 'Travel style'],
  ['초기화', 'Reset'],
  ['적용하기', 'Apply'],
  ['로그인이 필요해요', 'Login required'],
  ['로그인 후 다른 여행자와', 'Log in and match'],
  ['매칭을 시작해보세요!', 'with other travelers!'],
  ['로그인', 'Log in'],
  ['회원가입', 'Sign up'],
  ['둘러보기', 'Browse'],
  ['지금 여행자 찾기', 'Find travelers now'],
  // Profile page related
  ['인증완료 유저', 'Verified user'],
  ['Migo Plus로 업그레이드', 'Upgrade to Migo Plus'],
  ['Migo Plus 구독으로 특별한 혜택을 누려보세요.', 'Unlock exclusive benefits with Migo Plus.'],
  ['위치 감지 중...', 'Detecting location...'],
  ['프로필 수정', 'Edit profile'],
  ['부스트 없음', 'No boosts'],
  ['동행 안전 시스템', 'Travel Safety System'],
  ['여행 그룹', 'Travel Groups'],
  ['여행 캘린더', 'Travel Calendar'],
  ['만남 일기', 'Meeting Diary'],
  ['여행 마켓', 'Travel Market'],
  // General UI
  ['세', ' yrs'],
  ['님께 좋아요', ' liked you'],
  ['님께 142', ' Super Like!'],
  ['매칭점수1', 'Match score: '],
  ['점131', ' pts'],
  ['슈퍼라이크_210', 'Unlimited Super Likes'],
  ['같이여행해_211', "Let's travel together! ✈️"],
  ['관심사가비_212', 'Seems like we share interests 😊'],
  ['맛집같이탐_213', "Let's explore local food together 🍜"],
  ['부스트사용_205', 'Use Boost'],
  ['부스트Pl_206', 'Boost (Plus only)'],
  ['여행자우선매칭중_195', ' - Priority matching active'],
  ['활성_197', 'Active'],
  ['님께좋아요_207', ' liked you!'],
  ['매칭확률1_208', 'Match probability: '],
  ['님께142_209', ' Super Like!'],
  ['세151_215', ' yrs'],
  ['세152_216', ' yrs'],
  // Months
  ['1월', 'January'],
  ['2월', 'February'],
  ['3월', 'March'],
  ['4월', 'April'],
  ['5월', 'May'],
  ['6월', 'June'],
  ['7월', 'July'],
  ['8월', 'August'],
  ['9월', 'September'],
  ['10월', 'October'],
  ['11월', 'November'],
  ['12월', 'December'],
];

function extractAutoBlock(content) {
  const autoStart = content.indexOf('"auto":');
  if (autoStart === -1) return null;
  let depth = 0;
  let start = content.indexOf('{', autoStart);
  let end = start;
  for (let i = start; i < content.length; i++) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  return { start, end, block: content.substring(start, end + 1) };
}

// Fix en.ts
let enContent = fs.readFileSync(path.join(LOCALES_DIR, 'en.ts'), 'utf8');
let changed = false;

// Replace j-key Korean values with English
for (const [key, engVal] of Object.entries(TRANSLATIONS)) {
  // Match: "key": "any Korean value"
  const pattern = new RegExp(`("${key}":\\s*)"([^"]*[가-힣][^"]*)"`, 'g');
  const newContent = enContent.replace(pattern, `$1"${engVal}"`);
  if (newContent !== enContent) { changed = true; enContent = newContent; }
}

// Also replace by Korean phrase patterns in values
for (const [koPhrase, engPhrase] of PHRASE_MAP) {
  const escaped = koPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`("z_[^"]+": *)"([^"]*${escaped.substring(0,8)}[^"]*)"`, 'g');
  const newContent = enContent.replace(pattern, (match, prefix, val) => {
    if (/[가-힣]/.test(val)) return `${prefix}"${engPhrase}"`;
    return match;
  });
  if (newContent !== enContent) { changed = true; enContent = newContent; }
}

if (changed) {
  fs.writeFileSync(path.join(LOCALES_DIR, 'en.ts'), enContent, 'utf8');
  console.log('✅ Fixed en.ts auto namespace');
}

// Count remaining Korean in en.ts auto
const enAuto = extractAutoBlock(enContent);
const remainingKo = (enAuto?.block.match(/[가-힣]/g) || []).length;
console.log(`Remaining Korean chars in en.ts auto: ${remainingKo}`);
