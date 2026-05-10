const fs = require('fs');
const path = require('path');

function hasKorean(s) { return /[\uAC00-\uD7AF\u3131-\u3163]/.test(s); }

// ===== FIX EN.TS: auto.* keys with Korean =====
const enPath = path.join(__dirname, '../src/i18n/locales/en.ts');
let enContent = fs.readFileSync(enPath, 'utf8');
const enLines = enContent.split('\n');
let enFixed = 0;

// Build auto-translate map from ko.ts -> en.ts for auto keys
// For auto keys, get the English value from the existing nested structure in en.ts
// These keys often have values from ko.ts leaked in - replace with generic English

const autoKoToEn = {
  "제목": "Title", "내용": "Content", "발송중": "Sending", "알림발송": "Send notification",
  "미리보기": "Preview", "발송기록세션": "Send history session", "기타": "Other",
  "스팸": "Spam", "괴롭힘": "Harassment", "부적절콘텐츠": "Inappropriate content",
  "사기": "Fraud", "혐오발언": "Hate speech", "가짜프로필": "Fake profile",
  "신고대상유저를정지하": "Suspend reported user", "신고센터": "Report center",
  "대기": "Pending", "새로고침": "Refresh", "대기중": "Pending",
  "해결됨": "Resolved", "무시됨": "Dismissed", "신고유형": "Report type",
  "신고사유": "Report reason", "신고대상ID": "Reported user ID",
  "신고자": "Reporter", "알수없음": "Unknown", "접수일": "Date received",
  "현재상태": "Current status", "상세내용": "Details", "신고해결처리": "Resolve report",
  "처리중": "Processing", "신고대상계정정지해결": "Suspend and resolve reported account",
  "무시하기": "Dismiss", "유저목록을불러오지못": "Failed to load user list",
  "재시도": "Retry", "여행그룹관리": "Travel group management",
  "총": "Total", "전체그룹": "All groups", "총참여자": "Total members",
  "불러오는중": "Loading...", "호스트": "Host", "그룹삭제": "Delete group",
  "명": "members", "미정": "TBD", "참여율": "Participation rate",
  "만남장소와시간을입력": "Enter meeting place and time",
  "안전체크인등록완료": "Safety check-in registered",
  "등록실패": "Registration failed",
  "무사히만나셨군요": "Glad you met safely!",
  "동행후기를남겨보세요": "Leave a companion review!",
  "링크복사됨": "Link copied",
  "동행안전시스템": "Companion safety system",
  "여행자를지키는": "Protecting travelers",
  "스마트안전망": "Smart safety net",
  "만남장소시간등록": "Register meeting place & time",
  "귀가완료체크인": "Return check-in",
  "무사히귀가했다고알려": "Let them know you returned safely",
  "SOS긴급알림": "SOS emergency alert",
  "안전체크인등록하기": "Register safety check-in",
  "만남정보등록": "Register meeting info",
  "만남장소": "Meeting place", "만남시간": "Meeting time",
  "비상연락처등록": "Register emergency contact",
  "선택": "Select", "안전체크인등록": "Register safety check-in",
  "안전모드활성화중": "Safety mode active",
  "등록된만남정보": "Registered meeting info",
  "무사히귀가완료": "Safe return confirmed",
  "SOS발송됨": "SOS sent",
  "SOS긴급알림발송": "Send SOS emergency alert",
  "무사히돌아오셨군요": "Glad you returned safely!",
  "좋은동행되셨나요": "Was it a good companion?",
  "동행후기작성하기": "Write companion review",
  "홈으로돌아가기": "Go back to home",
  "중복가입차단": "Duplicate registration blocked",
  "소셜로그인에러": "Social login error",
  "성비균형": "Gender balance", "여성": "Female", "남성": "Male",
  "성비조절": "Gender ratio control", "구독하기": "Subscribe",
  "목적지": "Destination", "적용하기": "Apply", "프리미엄": "Premium",
  "그룹매칭": "Group match", "AI일정생성중": "AI generating itinerary...",
  "도착및체크인": "Arrival & check-in", "현지맛집탐방": "Local food exploration",
  "야경감상": "Night view", "AI여행일정자동생성": "AI auto-generated itinerary",
  "지금": "Now", "에": "at",
};

const newEnLines = [];
for (const line of enLines) {
  const m = line.match(/^(\s*"[^"]+"\s*:\s*)"([^"]*)"(,?\s*)$/);
  if (m && hasKorean(m[2])) {
    const val = m[2];
    // Try exact match first
    if (autoKoToEn[val]) {
      newEnLines.push(`${m[1]}"${autoKoToEn[val]}"${m[3]}`);
      enFixed++;
    } else {
      // Try partial match
      let found = false;
      for (const [ko, en] of Object.entries(autoKoToEn)) {
        if (val.includes(ko) && val.length <= ko.length + 5) {
          newEnLines.push(`${m[1]}"${en}"${m[3]}`);
          enFixed++;
          found = true;
          break;
        }
      }
      if (!found) {
        // Convert truncated Korean to reasonable English placeholder based on key name
        const keyMatch = line.match(/"([^"]+)"\s*:/);
        if (keyMatch) {
          const key = keyMatch[1];
          const parts = key.split('.');
          const lastPart = parts[parts.length - 1];
          // Use key name as English fallback
          const readable = lastPart.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
          newEnLines.push(`${m[1]}"${readable}"${m[3]}`);
          enFixed++;
        } else {
          newEnLines.push(line);
        }
      }
    }
  } else {
    newEnLines.push(line);
  }
}
fs.writeFileSync(enPath, newEnLines.join('\n'));
console.log(`✅ en.ts: ${enFixed} Korean values → English`);

// ===== FIX KO.TS: non-auto keys with pure English values =====
const koPath = path.join(__dirname, '../src/i18n/locales/ko.ts');
let koContent = fs.readFileSync(koPath, 'utf8');
const koLines = koContent.split('\n');
let koFixed = 0;
const newKoLines = [];

const enToKo = {
  "Title": "제목", "Content": "내용", "Sending": "발송 중", "Send notification": "알림 발송",
  "Preview": "미리보기", "Other": "기타", "Spam": "스팸", "Harassment": "괴롭힘",
  "Inappropriate content": "부적절한 콘텐츠", "Fraud": "사기", "Hate speech": "혐오 발언",
  "Fake profile": "가짜 프로필", "Report center": "신고 센터", "Pending": "대기중",
  "Refresh": "새로고침", "Resolved": "해결됨", "Dismissed": "무시됨",
  "Details": "상세 내용", "Processing": "처리 중", "Dismiss": "무시하기",
  "Retry": "재시도", "Loading...": "불러오는 중...", "Host": "호스트",
  "Delete group": "그룹 삭제", "TBD": "미정", "Select": "선택",
  "Subscribe": "구독하기", "Destination": "목적지", "Apply": "적용하기",
  "Premium": "프리미엄", "Female": "여성", "Male": "남성",
  "Total": "총", "All groups": "전체 그룹",
  "based group": "기반 그룹", "female": "여성",
  // Common English that should stay as-is in ko.ts
  "Plus": "Plus", "MBTI": "MBTI", "GPS": "GPS", "SOS": "SOS",
  "Google": "Google", "Apple": "Apple", "Migo": "Migo",
};

// Skip keys that are expected to have English values
const skipPatterns = ['email', 'url', 'MBTI', 'mbti', 'icon', 'emoji', 'Migo', 'Plus', 'GPS', 'SOS', 'Google', 'Apple', 'SSL', 'JWT', 'bcrypt', 'TLS', 'Supabase', 'CASCADE', 'APNs', 'FCM'];

for (const line of koLines) {
  const m = line.match(/^(\s*"([^"]+)"\s*:\s*)"([^"]*)"(,?\s*)$/);
  if (m) {
    const key = m[2];
    const val = m[3];
    // Check if pure English (no Korean) and not an expected English value
    if (val.length > 3 && !hasKorean(val) && /^[a-zA-Z\s]/.test(val) 
        && !key.startsWith('auto.') && !skipPatterns.some(p => key.includes(p) || val.includes(p))) {
      if (enToKo[val]) {
        newKoLines.push(`${m[1]}"${enToKo[val]}"${m[4]}`);
        koFixed++;
      } else {
        newKoLines.push(line); // Keep as-is if no translation found
      }
    } else {
      newKoLines.push(line);
    }
  } else {
    newKoLines.push(line);
  }
}
fs.writeFileSync(koPath, newKoLines.join('\n'));
console.log(`✅ ko.ts: ${koFixed} English values → Korean`);

// Final count of remaining issues
const finalEn = fs.readFileSync(enPath, 'utf8');
const finalKo = fs.readFileSync(koPath, 'utf8');
let remainEn = 0, remainKo = 0;
for (const line of finalEn.split('\n')) {
  const m2 = line.match(/^\s*"([^"]+)"\s*:\s*"([^"]*)"/);
  if (m2 && hasKorean(m2[2])) remainEn++;
}
for (const line of finalKo.split('\n')) {
  const m2 = line.match(/^\s*"([^"]+)"\s*:\s*"([^"]*)"/);
  if (m2 && m2[2].length > 5 && !hasKorean(m2[2]) && /^[a-zA-Z\s]+$/.test(m2[2]) && !m2[1].startsWith('auto.')) remainKo++;
}
console.log(`\n📊 Remaining: en.ts Korean=${remainEn}, ko.ts English-only=${remainKo}`);
