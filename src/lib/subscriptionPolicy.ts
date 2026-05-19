/**
 * MIGO 구독 기능 정책 명세
 * ─────────────────────────────────────
 * 이 파일이 무료/Plus/Premium 기능 경계의 단일 진실 원천(Single Source of Truth)입니다.
 * UI 게이팅 시 SubscriptionContext의 플래그를 직접 사용하되,
 * 정책 문서는 여기를 참조하세요.
 */

export const SUBSCRIPTION_POLICY = {
  /* ─── FREE (무료) ─────────────────────────────────────── */
  free: {
    // 매칭/좋아요
    dailyLikes: 10,          // 하루 좋아요 10회
    superLikes: 0,           // 슈퍼라이크 없음
    viewWhoLikedMe: false,   // 나를 좋아요한 사람 못봄 (블러)
    globalMatch: false,      // 국가 필터 고정 (현지인만)

    // 채팅
    dailyDm: 3,              // 하루 DM 3건 (canSendDm)
    readReceipts: false,     // 읽음 확인 불가
    voiceCall: false,        // 음성통화 불가

    // Nearby
    nearbyView: false,       // 내 주변 탐색 잠금 (Plus 전용)

    // 지도
    mapFilters: "basic",     // 기본 필터만 (성별, 거리)
    hideMyLocation: false,   // 내 위치 숨기기 불가

    // 여행 그룹
    joinPremiumGroups: false,

    // 프로필 부스트
    boosts: 0,

    // 광고
    showAds: true,

    // 번역
    dailyTranslate: 5,       // 채팅 번역 5회/일

    // 기타
    travelDNA: "preview",    // Travel DNA 미리보기만
    profileTheme: false,     // 프로필 테마 커스텀 불가
    verifiedBadge: false,    // 인증 뱃지 없음
    priorityInSearch: false, // 검색 우선 노출 없음
  },

  /* ─── PLUS ────────────────────────────────────────────── */
  plus: {
    dailyLikes: Infinity,
    superLikes: 5,           // 월 기본 5개 + 구매 가능
    viewWhoLikedMe: true,    // 나를 좋아요한 사람 열람 ✅
    globalMatch: true,       // 전 세계 매칭 ✅

    dailyDm: Infinity,       // DM 무제한 ✅
    readReceipts: true,      // 읽음 확인 ✅
    voiceCall: true,         // 음성통화 ✅

    nearbyView: true,        // 내 주변 탐색 ✅

    mapFilters: "advanced",  // 고급 필터 (관심사, 여행목적 등) ✅
    hideMyLocation: true,    // 내 위치 숨기기 ✅

    joinPremiumGroups: false,// Premium 그룹은 프리미엄만

    boosts: 1,               // 매월 1개 부스트 제공
    showAds: false,          // 광고 제거 ✅

    dailyTranslate: Infinity,// 번역 무제한 ✅
    travelDNA: "full",       // Travel DNA 전체 ✅
    profileTheme: false,     // 테마 별도 구매
    verifiedBadge: false,    // 뱃지 별도 구매
    priorityInSearch: true,  // 검색 우선 노출 ✅
  },

  /* ─── PREMIUM ─────────────────────────────────────────── */
  premium: {
    // Plus 모든 기능 포함 +
    superLikes: Infinity,    // 슈퍼라이크 무제한 ✅
    voiceCall: true,

    joinPremiumGroups: true, // 프리미엄 그룹 입장 ✅
    boosts: 5,               // 매월 5개 부스트 ✅
    aiTripPlanner: Infinity, // AI 여행 플래너 무제한 ✅
    highlightReviewBadge: true, // 리뷰 하이라이트 뱃지 ✅
    premiumTheme: true,      // 프리미엄 프로필 테마 ✅
    dedicatedSupport: true,  // 전담 지원 ✅
    priorityPassport: true,  // 여권 우선 인증 ✅
  },
} as const;

/**
 * 기능별 잠금 메시지 (UI 레이블용)
 */
export const FEATURE_GATE_LABELS = {
  viewWhoLikedMe:      { tier: "plus",    key: "gate.viewLikers",      fallback: "나를 좋아요한 사람 보기" },
  globalMatch:         { tier: "plus",    key: "gate.globalMatch",     fallback: "전 세계 매칭" },
  nearbyView:          { tier: "plus",    key: "gate.nearby",          fallback: "내 주변 탐색" },
  hideMyLocation:      { tier: "plus",    key: "gate.hideLocation",    fallback: "위치 숨기기" },
  readReceipts:        { tier: "plus",    key: "gate.readReceipts",    fallback: "읽음 확인" },
  voiceCall:           { tier: "plus",    key: "gate.voiceCall",       fallback: "음성통화" },
  travelDNAFull:       { tier: "plus",    key: "gate.travelDNA",       fallback: "Travel DNA 전체" },
  mapAdvancedFilters:  { tier: "plus",    key: "gate.mapFilters",      fallback: "고급 지도 필터" },
  joinPremiumGroups:   { tier: "premium", key: "gate.premiumGroups",   fallback: "프리미엄 그룹" },
  aiTripPlanner:       { tier: "premium", key: "gate.aiTrip",          fallback: "AI 여행 플래너 무제한" },
  premiumTheme:        { tier: "premium", key: "gate.premiumTheme",    fallback: "프리미엄 테마" },
  priorityPassport:    { tier: "premium", key: "gate.priorityPassport",fallback: "여권 우선 인증" },
} as const;
