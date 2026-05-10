const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

// Extract all t("key") and t("key", "fallback") from source
function extractUsedKeys(dirs) {
  const results = {};
  function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const f of fs.readdirSync(d)) {
      const full = path.join(d, f);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
        const c = fs.readFileSync(full, 'utf8');
        // t("key", "fallback") or t('key', 'fallback')
        let m;
        const r1 = /t\(["']([a-zA-Z][a-zA-Z0-9_.]+)["']\s*,\s*["']([^"']*?)["']\)/g;
        while ((m = r1.exec(c))) { if (!results[m[1]]) results[m[1]] = m[2]; }
        const r2 = /t\(["']([a-zA-Z][a-zA-Z0-9_.]+)["']\)/g;
        while ((m = r2.exec(c))) { if (!results[m[1]]) results[m[1]] = null; }
      }
    }
  }
  dirs.forEach(d => walk(d));
  return results;
}

// Check if key exists in file (flat or nested)
function keyExistsInFile(content, key) {
  // Check flat: "key.subkey":
  if (content.includes(`"${key}"`)) return true;
  // Check nested: split by dots
  const parts = key.split('.');
  if (parts.length >= 2) {
    // Check if parent object and child key both exist
    const hasParent = content.includes(`"${parts[0]}"`);
    const hasChild = content.includes(`"${parts[parts.length-1]}"`);
    if (hasParent && hasChild) return true;
  }
  return false;
}

const allKeys = extractUsedKeys([
  path.join(srcDir, 'pages'), path.join(srcDir, 'components'),
  path.join(srcDir, 'hooks'), path.join(srcDir, 'context')
]);

// Korean translations for keys without fallback
const KO_TRANSLATIONS = {
  // nav
  "nav.match": "매칭", "nav.discover": "탐색", "nav.map": "지도",
  "nav.chat": "채팅", "nav.profile": "프로필",
  // splash
  "splash.tagline": "새로운 여행 동반자를 만나세요",
  "splash.safeTagline": "안전하게 보호된 여행 커뮤니티",
  // onboarding
  "onboarding.skip": "건너뛰기", "onboarding.next": "다음", "onboarding.start": "시작하기",
  // profileSetup
  "profileSetup.addPhoto": "사진 추가", "profileSetup.bioLabel": "자기소개",
  "profileSetup.bioPlaceholder": "안녕하세요! 여행을 좋아하는 Migo입니다 ☕️",
  "profileSetup.dateLabel": "여행 기간", "profileSetup.datePlaceholder": "예: 1박2일~한달살기",
  "profileSetup.destLabel": "다음 목적지", "profileSetup.destPlaceholder": "떠나고 싶은 곳",
  "profileSetup.errBio": "자기소개를 작성해주세요", "profileSetup.errRegion": "지역을 선택해주세요",
  "profileSetup.errSave": "프로필 저장에 실패했습니다", "profileSetup.errStyle": "스타일을 선택해주세요",
  "profileSetup.langDefault": "한국어", "profileSetup.langLabel": "사용 언어",
  "profileSetup.maxFive": "최대 5개 선택 가능", "profileSetup.mbtiNotice": "성격 기반 매칭에 활용됩니다",
  "profileSetup.me": "나", "profileSetup.missionLabel": "여행 미션",
  "profileSetup.missionPlaceholder": "예: 세계 100대 맛집 정복!", "profileSetup.multi": "(복수 선택 가능)",
  "profileSetup.next": "다음", "profileSetup.noBio": "자기소개가 없습니다",
  "profileSetup.photoHint1": "얼굴이 잘 나온 사진이", "profileSetup.photoHint2": "매칭률을 높여요",
  "profileSetup.photoHint3": "", "profileSetup.preview": "프로필 미리보기",
  "profileSetup.regionsLabel": "선호 지역", "profileSetup.selectAll": "전체 선택",
  "profileSetup.selectedMbti": "선택된 MBTI", "profileSetup.start": "모든 입력을 끝내고 Migo 입장하기",
  "profileSetup.step5Sub": "이제 거의 다 왔어요! 🚀", "profileSetup.step5Title": "마무리 설정",
  "profileSetup.verified": "인증완료", "profileSetup.errSaveDesc": "네트워크를 확인해주세요",
  "profileSetup.doneTitle": "가입 완료! 🎉", "profileSetup.doneDesc": "매칭을 시작해보세요",
  "profileSetup.mbtiSelect": "MBTI 선택",
  // match
  "match.safeVerified": "인증 회원", "match.realTraveler": "실제 여행자",
  "match.safeChat": "안전 채팅", "match.noLocation": "위치 미설정",
  "match.traveler": "여행자",
  // common
  "common.cancel": "취소", "common.delete": "삭제", "common.on": "켜짐", "common.off": "꺼짐",
  // alert
  "alert.c53Desc": "이 게시글을 삭제하면 복구할 수 없습니다.",
  "alert.c54Desc": "그룹을 삭제하면 모든 멤버가 내보내집니다.",
  "alert.loginRequired": "로그인이 필요합니다", "alert.t6Desc": "정말 신고하시겠습니까?",
  // notification
  "notification.title": "알림", "notification.empty": "알림이 없습니다",
  // voice
  "voice.connecting": "연결 중...", "voice.connected": "연결됨", "voice.ended": "종료됨",
  // voiceCall
  "voiceCall.unknownUser": "알 수 없는 사용자", "voiceCall.video": "영상통화",
  "voiceCall.message": "메시지", "voiceCall.reject": "거절", "voiceCall.user": "상대방",
  "voiceCall.connecting": "연결 중...", "voiceCall.connected": "통화 중",
  "voiceCall.ended": "통화 종료", "voiceCall.mute": "음소거", "voiceCall.speaker": "스피커",
  // verifyBadge
  "verifyBadge.basic": "기본 인증", "verifyBadge.id": "신분증 인증", "verifyBadge.top": "최고 인증",
  // network
  "network.offline": "인터넷 연결 없음", "network.offlineDesc": "연결이 복구되면 자동 재개됩니다.",
  "network.online": "온라인 복귀 ✅",
  // daily
  "daily.title": "오늘의 추천 매치", "daily.best": "Best",
  // dest
  "dest.tokyo": "도쿄", "dest.kyoto": "교토", "dest.osaka": "오사카",
  "dest.bali": "발리", "dest.paris": "파리", "dest.bangkok": "방콕",
  // iap
  "iap.purchase_success": "구독 완료! 🎉", "iap.purchase_failed": "결제 실패",
  "iap.restore_none": "복원할 구독이 없습니다", "iap.restore": "구매 복원",
  // profileViews
  "profileViews.iapTitle": "🔒 프로필 조회 (준비 중)",
  "profileViews.iapDesc": "곧 이용 가능합니다.", "profileViews.iapInProgress": "준비 중",
  "profileViews.empty": "아직 프로필 조회 기록이 없습니다",
  // legalPages
  "legalPages.privacyTitle": "개인정보처리방침",
  // sos
  "sos.title": "긴급 SOS", "sos.locationChecking": "위치 확인 중...",
  // reportBlock
  "reportBlock.loginRequired": "로그인이 필요합니다",
  // mapPage
  "mapPage.locating": "위치 확인 중...", "mapPage.noDistance": "거리 정보 없음",
  // meetReview
  "meetReview.noRating": "평점 없음", "meetReview.placeholder": "후기를 작성해주세요",
  // tripCalendar
  "tripCalendar.title": "여행 캘린더",
  // marketplace
  "marketplace.hostSubmittedDesc": "호스트 신청이 완료되었습니다",
  // review
  "review.avgScore": "평균 점수", "review.receivedReviews": "받은 후기",
  "review.pendingReviews": "작성 대기", "review.tabWrite": "후기 작성",
  "review.tabReceived": "받은 후기", "review.count": "{{count}}건",
  "review.doneBadge": "후기 작성 완료", "review.noMatches": "매칭 없음",
  "review.noMatchesDesc": "매칭 후 후기를 작성할 수 있습니다",
  // tripMatch
  "tripMatch.joinSuccess": "참여 성공!", "tripMatch.searching": "검색 중...",
  "tripMatch.title": "여행 매칭", "tripMatch.filter": "필터",
  "tripMatch.randomMatch": "랜덤 매칭", "tripMatch.premiumMatch": "프리미엄 매칭",
  "tripMatch.subtitle": "나에게 맞는 여행을 찾아보세요", "tripMatch.pass": "패스",
  // shop
  "shop.autoRenewNote": "구독은 자동 갱신됩니다", "shop.billingNote": "결제 관련 안내",
  "shop.perMonth": "/ 월", "shop.privacyPolicy": "개인정보처리방침",
  "shop.processing": "처리 중...", "shop.restorePurchases": "구매 복원",
  "shop.termsOfUse": "이용약관",
  // settings
  "settings.title": "설정", "settings.language": "언어", "settings.notification": "알림",
  "settings.guide": "앱 가이드", "settings.logout": "로그아웃",
  "settings.privacy": "개인정보처리방침", "settings.terms": "이용약관",
  "settings.darkMode": "다크 모드", "settings.deleteAccount": "계정 삭제",
  // stats
  "stats.days": "일", "stats.times": "회",
  // groupPopup
  "groupPopup.expiredCountdown": "마감됨", "groupPopup.expiredTitle": "모집 마감",
  "groupPopup.min30Title": "30분 남음!", "groupPopup.hour1Title": "1시간 남음!",
  "groupPopup.untilDeadline": "마감까지", "groupPopup.membersCount": "{{count}}명",
  "groupPopup.joinNow": "지금 참여", "groupPopup.viewDetail": "상세 보기",
  // profileDetail
  "profileDetail.noLocation": "위치 미설정", "profileDetail.tripInfo": "여행 정보",
  "profileDetail.gender": "성별", "profileDetail.travelStyle": "여행 스타일",
  "profileDetail.languages": "사용 언어", "profileDetail.personality": "성격",
  "profileDetail.regions": "선호 지역",
  // lang
  "lang.ko": "한국어",
  // adminStatsNeedRefresh
  "adminStatsNeedRefresh": "통계 새로고침 필요",
};

// EN translations
const EN_TRANSLATIONS = {
  "nav.match": "Match", "nav.discover": "Discover", "nav.map": "Map",
  "nav.chat": "Chat", "nav.profile": "Profile",
  "splash.tagline": "Meet your next travel companion",
  "splash.safeTagline": "A safely protected travel community",
  "onboarding.skip": "Skip", "onboarding.next": "Next", "onboarding.start": "Get Started",
  "match.safeVerified": "Verified", "match.realTraveler": "Real Traveler",
  "match.safeChat": "Safe Chat", "match.noLocation": "No Location",
  "match.traveler": "Traveler",
  "common.cancel": "Cancel", "common.delete": "Delete", "common.on": "On", "common.off": "Off",
  "alert.c53Desc": "This post cannot be recovered once deleted.",
  "alert.c54Desc": "Deleting the group will remove all members.",
  "alert.loginRequired": "Login required", "alert.t6Desc": "Are you sure you want to report?",
  "notification.title": "Notifications", "notification.empty": "No notifications",
  "voice.connecting": "Connecting...", "voice.connected": "Connected", "voice.ended": "Ended",
  "voiceCall.unknownUser": "Unknown User", "voiceCall.video": "Video",
  "voiceCall.message": "Message", "voiceCall.reject": "Reject", "voiceCall.user": "User",
  "voiceCall.connecting": "Connecting...", "voiceCall.connected": "Connected",
  "voiceCall.ended": "Call Ended", "voiceCall.mute": "Mute", "voiceCall.speaker": "Speaker",
  "verifyBadge.basic": "Basic", "verifyBadge.id": "ID Verified", "verifyBadge.top": "Top Verified",
  "network.offline": "No Internet Connection",
  "network.offlineDesc": "Connection will resume automatically when restored.",
  "network.online": "Back Online ✅",
  "daily.title": "Today's Picks", "daily.best": "Best",
  "dest.tokyo": "Tokyo", "dest.kyoto": "Kyoto", "dest.osaka": "Osaka",
  "dest.bali": "Bali", "dest.paris": "Paris", "dest.bangkok": "Bangkok",
  "iap.purchase_success": "Subscription complete! 🎉", "iap.purchase_failed": "Payment failed",
  "iap.restore_none": "No purchases to restore", "iap.restore": "Restore Purchase",
  "profileViews.iapTitle": "🔒 Profile Views (Coming Soon)",
  "profileViews.iapDesc": "Coming soon!", "profileViews.iapInProgress": "Coming Soon",
  "profileViews.empty": "No profile views yet",
  "legalPages.privacyTitle": "Privacy Policy",
  "sos.title": "Emergency SOS", "sos.locationChecking": "Checking location...",
  "reportBlock.loginRequired": "Login required",
  "mapPage.locating": "Locating...", "mapPage.noDistance": "No distance info",
  "meetReview.noRating": "No rating", "meetReview.placeholder": "Write your review...",
  "tripCalendar.title": "Trip Calendar",
  "marketplace.hostSubmittedDesc": "Host application submitted",
  "review.avgScore": "Average Score", "review.receivedReviews": "Received Reviews",
  "review.pendingReviews": "Pending", "review.tabWrite": "Write Review",
  "review.tabReceived": "Received", "review.count": "{{count}} reviews",
  "review.doneBadge": "Review Complete", "review.noMatches": "No matches",
  "review.noMatchesDesc": "You can write reviews after matching",
  "tripMatch.joinSuccess": "Joined!", "tripMatch.searching": "Searching...",
  "tripMatch.title": "Trip Match", "tripMatch.filter": "Filter",
  "tripMatch.randomMatch": "Random Match", "tripMatch.premiumMatch": "Premium Match",
  "tripMatch.subtitle": "Find the perfect trip for you", "tripMatch.pass": "Pass",
  "shop.autoRenewNote": "Subscription auto-renews", "shop.billingNote": "Billing info",
  "shop.perMonth": "/ month", "shop.privacyPolicy": "Privacy Policy",
  "shop.processing": "Processing...", "shop.restorePurchases": "Restore Purchases",
  "shop.termsOfUse": "Terms of Use",
  "settings.title": "Settings", "settings.language": "Language", "settings.notification": "Notifications",
  "settings.guide": "App Guide", "settings.logout": "Logout",
  "settings.privacy": "Privacy Policy", "settings.terms": "Terms of Use",
  "settings.darkMode": "Dark Mode", "settings.deleteAccount": "Delete Account",
  "stats.days": "days", "stats.times": "times",
  "groupPopup.expiredCountdown": "Expired", "groupPopup.expiredTitle": "Recruitment Closed",
  "groupPopup.min30Title": "30 min left!", "groupPopup.hour1Title": "1 hour left!",
  "groupPopup.untilDeadline": "Until deadline", "groupPopup.membersCount": "{{count}} members",
  "groupPopup.joinNow": "Join Now", "groupPopup.viewDetail": "View Detail",
  "profileDetail.noLocation": "No Location", "profileDetail.tripInfo": "Trip Info",
  "profileDetail.gender": "Gender", "profileDetail.travelStyle": "Travel Style",
  "profileDetail.languages": "Languages", "profileDetail.personality": "Personality",
  "profileDetail.regions": "Preferred Regions",
  "lang.ko": "Korean",
  "adminStatsNeedRefresh": "Stats need refresh",
  "discover.trustHost": "Verified Host", "discover.trustSafe": "Instant Report",
  "discover.trustReview": "Review Verified", "discover.createFirst": "Create Group",
  "discover.verified": "Verified Host", "discover.emptyTrips": "No trips yet",
};

// Read files
const koPath = path.join(srcDir, 'i18n/locales/ko.ts');
const enPath = path.join(srcDir, 'i18n/locales/en.ts');
let koContent = fs.readFileSync(koPath, 'utf8');
let enContent = fs.readFileSync(enPath, 'utf8');

// Find missing keys that need to be added
let koAdded = 0, enAdded = 0;
let koLines = [], enLines = [];

for (const [key, fallback] of Object.entries(allKeys)) {
  // Skip false positives (DB column names, etc)
  if (['error_description','user_id','travel_dates','post_id','target_id','item_id',
       'to_user','from_user','thread_id','div','boosts','super_likes','ticket',
       'departureKeyword','destinationKeyword','photo_url','genderPref','duration'].includes(key)) continue;
  
  if (!keyExistsInFile(koContent, key)) {
    const koVal = KO_TRANSLATIONS[key] || fallback || key.split('.').pop();
    koLines.push(`  "${key}": "${koVal.replace(/"/g, '\\"')}",`);
    koAdded++;
  }
  
  if (!keyExistsInFile(enContent, key)) {
    const enVal = EN_TRANSLATIONS[key] || fallback || key.split('.').pop();
    enLines.push(`  "${key}": "${enVal.replace(/"/g, '\\"')}",`);
    enAdded++;
  }
}

// Append to ko.ts before the last line (};)
if (koLines.length > 0) {
  const koInsert = '\n  // === Auto-added missing translations ===\n' + koLines.join('\n') + '\n';
  koContent = koContent.replace(/\n};\s*export default ko;/, koInsert + '\n};\nexport default ko;');
  // Fallback: if replace didn't work, try another pattern
  if (!koContent.includes('Auto-added')) {
    koContent = koContent.replace(/\n};[\s\n]*export\s+default\s+ko/, koInsert + '\n};\nexport default ko');
  }
  fs.writeFileSync(koPath, koContent);
}

if (enLines.length > 0) {
  const enInsert = '\n  // === Auto-added missing translations ===\n' + enLines.join('\n') + '\n';
  enContent = enContent.replace(/\n};\s*export default en;/, enInsert + '\n};\nexport default en;');
  if (!enContent.includes('Auto-added')) {
    enContent = enContent.replace(/\n};[\s\n]*export\s+default\s+en/, enInsert + '\n};\nexport default en');
  }
  fs.writeFileSync(enPath, enContent);
}

console.log(`✅ ko.ts: ${koAdded}개 키 추가`);
console.log(`✅ en.ts: ${enAdded}개 키 추가`);
