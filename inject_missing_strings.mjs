import fs from 'fs';
import path from 'path';

const koPath = path.join(process.cwd(), 'src', 'i18n', 'locales', 'ko.ts');
let koStr = fs.readFileSync(koPath, 'utf8');

const startIdx = koStr.indexOf('{');
const endIdx = koStr.lastIndexOf('}');
const jsonStr = koStr.substring(startIdx, endIdx + 1);
const obj = (new Function(`return (${jsonStr})`))();

// Direct forced injection
if (!obj.meetReview) obj.meetReview = {};
if (!obj.review) obj.review = {};

Object.assign(obj.meetReview, {
  noRating: "별점을 입력해주세요.",
  overallRate: "전체 평점을 남겨주세요",
  title: "동행 리뷰 조회 및 쓰기",
  subtitle: "함께 다녀온 동행에게 매너 평가를 남겨주세요",
  placeholder: "만남은 어떠셨나요? 솔직한 후기를 남겨주세요.",
  submitBtn: "후기 제출하기",
  whatGood: "어떤 점이 인상 깊었나요?",
  anyDiscomfort: "불편하거나 아쉬운 점이 있었나요?",
  detailReview: "상세한 글 후기를 남겨주세요",
  writeReviewBtn: "✍️ 후기 남기기",
  rate5: "최고! 완벽했어요",
  rate4: "좋았어요!",
  rate3: "보통이었어요",
  rate2: "조금 아쉬웠어요",
  rate1: "별로였어요"
});

Object.assign(obj.review, {
  avgScore: "나의 평균 매너 점수",
  receivedReviews: "총 받은 후기",
  count: "{{count}}건",
  pendingReviews: "아직 작성하지 않은 후기",
  tabWrite: "내가 남길 후기 (대기중)",
  tabReceived: "상대방이 나에게 남긴 후기",
  noMatches: "아직 같이 다녀온 여행자가 없습니다.",
  noMatchesDesc: "매칭 후 캘린더 일정이 겹치는 이용자와 함께 여행을 떠나보세요!",
  doneBadge: "후기 남김 완료"
});

const finalKo = `const ko = ${JSON.stringify(obj, null, 2)};\nexport default ko;\n`;
fs.writeFileSync(koPath, finalKo, 'utf8');
console.log("Forced meetReview & review mapping injected into ko.ts!");
