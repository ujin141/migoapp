import fs from 'fs';

// --- MeetReviewPage.tsx ---
if (fs.existsSync('src/pages/MeetReviewPage.tsx')) {
  let mrp = fs.readFileSync('src/pages/MeetReviewPage.tsx', 'utf8');
  mrp = mrp.replace(/>평균 평점</g, '>{t("review.avgScore")}<');
  mrp = mrp.replace(/>받은 후기</g, '>{t("review.receivedReviews")}<');
  mrp = mrp.replace(/>작성 대기</g, '>{t("review.pendingReviews")}<');
  mrp = mrp.replace(/>\{reviews.length\}개</g, '>{t("review.count", {count: reviews.length})}<');
  mrp = mrp.replace(/>\{users.filter\(u => !u.reviewed\).length\}개</g, '>{t("review.count", {count: users.filter(u => !u.reviewed).length})}<');
  mrp = mrp.replace('t === "write" ? "✍️ 후기 남기기" : "⭐ 받은 후기"', 't === "write" ? t("review.tabWrite") : t("review.tabReceived")');
  mrp = mrp.replace(/>아직 매칭된 상대가 없어요</g, '>{t("review.noMatches")}<');
  mrp = mrp.replace(/>매칭 후 후기를 남길 수 있어요 💬</g, '>{t("review.noMatchesDesc")}<');
  mrp = mrp.replace(/>후기 작성 완료</g, '>{t("review.doneBadge")}<');
  mrp = mrp.replace(/>후기 쓰기</g, '>{t("review.writeBtn")}<');
  fs.writeFileSync('src/pages/MeetReviewPage.tsx', mrp, 'utf8');
}

// --- NotificationPage.tsx ---
if (fs.existsSync('src/pages/NotificationPage.tsx')) {
  let np = fs.readFileSync('src/pages/NotificationPage.tsx', 'utf8');
  np = np.replace('return "님이 내 프로필을 봤어요";', 'return t("notif.viewedProfile");');
  np = np.replace('return n.target ? `님이 메시지와 함께 좋아요를 보냈어요 💛` : "님이 좋아요를 보냈어요 💛";', 'return n.target ? t("notif.likedMsg") : t("notif.liked");');
  np = np.replace('return n.target ? `님이 슈퍼라이크를 보냈어요! ⭐ "${n.target}"` : "님이 슈퍼라이크를 보냈어요! ⭐";', 'return n.target ? t("notif.superlikedTarget", {target: n.target}) : t("notif.superliked");');
  np = np.replace('return `님이 "${n.target}"에 댓글을 남겼어요`;', 'return t("notif.commentedTarget", {target: n.target});');
  np = np.replace('return "님과 매칭됐어요! 🎉";', 'return t("notif.matched");');
  np = np.replace('location: data.location || "서울특별시",', 'location: data.location || t("notif.defaultLoc"),');
  np = np.replace(/>읽지 않은 알림 \{unreadCount\}개</g, '>{t("notif.unreadCount", {count: unreadCount})}<');
  np = np.replace(/>모두 읽음</g, '>{t("notif.readAll")}<');
  np = np.replace(/>\{profileViewCount\}명이 내 프로필을 보았어요!</g, '>{t("notif.viewCount", {count: profileViewCount})}<');
  np = np.replace('isPlus ? "아래 알림 목록에서 방문자를 확인해보세요." : "Migo Plus로 업그레이드하고 누군지 확인하세요 🔒"', 'isPlus ? t("notif.viewDescPlus") : t("notif.viewDescNone")');
  np = np.replace('["profile_view", "like", "superlike"].includes(n.type) && !isPlus ? "누군가" : n.actor', '["profile_view", "like", "superlike"].includes(n.type) && !isPlus ? t("notif.someone") : n.actor');
  np = np.replace(/>여행 동행을 찾아보세요!</g, '>{t("notif.emptyDesc")}<');
  fs.writeFileSync('src/pages/NotificationPage.tsx', np, 'utf8');
}

// --- ProfilePage.tsx ---
if (fs.existsSync('src/pages/ProfilePage.tsx')) {
  let pp2 = fs.readFileSync('src/pages/ProfilePage.tsx', 'utf8');
  pp2 = pp2.replace(/>프로필 수정</g, '>{t("profile.editProfileBtn")}<');
  pp2 = pp2.replace(/>저장하기</g, '>{t("profile.saveBtn")}<');
  pp2 = pp2.replace(/>로그아웃</g, '>{t("profile.logoutBtn")}<');
  pp2 = pp2.replace(/>\{matchedUsers.length\}명</g, '>{t("profile.userCount", {count: matchedUsers.length})}<');
  pp2 = pp2.replace(/>\{myTrips.length\}회</g, '>{t("profile.tripCount", {count: myTrips.length})}<');
  pp2 = pp2.replace(/>\{trip.members\}명</g, '>{t("profile.memberCount", {count: trip.members})}<');
  pp2 = pp2.replace(/>\{myMeetings.length\}회</g, '>{t("profile.meetingCount", {count: myMeetings.length})}<');
  pp2 = pp2.replace(/>취소</g, '>{t("profile.cancelBtn")}<');
  fs.writeFileSync('src/pages/ProfilePage.tsx', pp2, 'utf8');
}

// --- VerificationPage.tsx ---
if (fs.existsSync('src/pages/VerificationPage.tsx')) {
  let vp2 = fs.readFileSync('src/pages/VerificationPage.tsx', 'utf8');
  vp2 = vp2.replace(/>인증</g, '>{t("verif.verifyBtn")}<');
  vp2 = vp2.replace(/인증\n/g, '{t("verif.verifyBtn")}\n');
  fs.writeFileSync('src/pages/VerificationPage.tsx', vp2, 'utf8');
}

// --- ProfileSetupPage.tsx ---
if (fs.existsSync('src/pages/ProfileSetupPage.tsx')) {
  let psp2 = fs.readFileSync('src/pages/ProfileSetupPage.tsx', 'utf8');
  psp2 = psp2.replace(/\{ title: "프로필 사진 &\n자기소개", sub: "첫인상이 중요해요 📸", icon: "🤳" \}/g, '{ title: t("profileSetup.step1Title"), sub: t("profileSetup.step1Sub"), icon: "🤳" }');
  psp2 = psp2.replace(/\{ title: "여행 스타일\n&\n선호도", sub: "나와 맞는 동행을 찾아요", icon: "✈️" \}/g, '{ title: t("profileSetup.step2Title"), sub: t("profileSetup.step2Sub"), icon: "✈️" }');
  psp2 = psp2.replace(/\{ title: "관심 여행지 &\n언어", sub: "어디로 떠나고 싶으세요\?", icon: "🗺️" \}/g, '{ title: t("profileSetup.step3Title"), sub: t("profileSetup.step3Sub"), icon: "🗺️" }');
  psp2 = psp2.replace(/\{ title: "성격 유형\n&\n여행 방식", sub: "어떤 여행자인지 알려주세요", icon: "🧭" \}/g, '{ title: t("profileSetup.step4Title"), sub: t("profileSetup.step4Sub"), icon: "🧭" }');
  psp2 = psp2.replace(/\{ title: "MBTI", sub: "나의 성격 유형을 알려주세요 ✨", icon: "🧠" \}/g, '{ title: t("profileSetup.step5Title"), sub: t("profileSetup.step5Sub"), icon: "🧠" }');
  fs.writeFileSync('src/pages/ProfileSetupPage.tsx', psp2, 'utf8');
}

console.log("Absolute Final Patch Done");
