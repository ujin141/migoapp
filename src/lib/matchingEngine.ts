import i18n from "@/i18n";
import type { TripGroup } from "@/types";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
export type UserGender = "male" | "female" | "other";
export type TripVibe = "party" | "healing" | "serious" | "any";
export type GenderRatioPref = "any" | "balanced" | "more-female" | "more-male" | "all-male" | "all-female";

export interface MatchInput {
  userId: string;
  gender: UserGender;
  destination: string;         // 빈 문자열 = 전체
  dateStart?: string;          // "YYYY-MM-DD"
  dateEnd?: string;
  minSize?: number;            // 기본 4
  maxSize?: number;            // 기본 8
  vibe: TripVibe;
  isPremium: boolean;          // (과거) 프리미엄 모드 선택 여부 (4.0 평점 필터용)
  isInstant?: boolean;         // 바로모임(1시간 이내 즉흥 만남) 여부
  hotplace?: string;           // 선택한 유명장소 아이디
  isPlusUser?: boolean;        // 유저의 실제 Migo Plus 구독 여부 (부스트용)
}

export interface GroupGenderStats {
  maleCount: number;
  femaleCount: number;
  otherCount: number;
  label: string;               // "2남2여" 등
}

export interface MatchResult {
  group: TripGroup;
  score: number;
  genderStats: GroupGenderStats;
  avgRating: number;
  feeForUser: number;          // 여성=0, 남성=티어가격, Plus=50%할인
  isFreeForUser: boolean;
  matchReasons: string[];      // 매칭 이유 배지
  isPremiumMatch: boolean;
}

// ──────────────────────────────────────────────
// Mock gender stats (실제 구현 시 DB 쿼리로 교체)
// ──────────────────────────────────────────────
function inferGenderStats(group: TripGroup): GroupGenderStats {
  if (group.memberGenders && group.memberGenders.length > 0) {
    const male = group.memberGenders.filter(g => g === 'male').length;
    const female = group.memberGenders.filter(g => g === 'female').length;
    const other = group.memberGenders.filter(g => g === 'unknown').length;
    return { maleCount: male, femaleCount: female, otherCount: other, label: i18n.t("auto.t_0016", `${male}남${female}여`) };
  }
  const total = group.currentMembers || 1;
  return { maleCount: total, femaleCount: 0, otherCount: 0, label: i18n.t("auto.t_0017", `${total}남0여`) };
}

// ──────────────────────────────────────────────
// Mock average rating per group
// ──────────────────────────────────────────────
export function mockGroupRating(group: TripGroup): number {
  if (group.avgRating !== undefined) return group.avgRating;
  return 4.5; // 기본 평점
}

// ──────────────────────────────────────────────
// Fee calculation
// ──────────────────────────────────────────────
import { inferGroupTier, getJoinFeeAfterDiscount, getTierConfig } from "@/lib/pricing";

export function getFeeForUser(
  group: TripGroup,
  gender: UserGender,
  isPlus: boolean
): { fee: number; isFree: boolean } {
  if (gender === "female") return { fee: 0, isFree: true };
  const tier = inferGroupTier(group.tags, group.title, group.isPremiumGroup);
  const cfg = getTierConfig(tier);
  const fee = getJoinFeeAfterDiscount(cfg.krw, isPlus);
  return { fee, isFree: false };
}

// ──────────────────────────────────────────────
// Scoring
// ──────────────────────────────────────────────
function scoreGroup(group: TripGroup, input: MatchInput): number {
  let score = 0;

  // 목적지 / 핫플레이스 매칭
  if (input.isInstant && input.hotplace) {
    if (group.destination.toLowerCase().includes("seoul") || group.destination.toLowerCase().includes(i18n.t("auto.g_0361", "서울")) || group.destination.toLowerCase().includes("tokyo")) {
      score += 60; // 임시로 즉석 만남 타겟 도시 그룹에 보너스
    } else {
      score += 40; 
    }
    // 프리미엄 구독자의 경우 매칭 부스트 (즉흥 만남일 때 최상단 노출)
    if (input.isPlusUser) {
      score += 150; 
    }
  } else if (input.destination) {
    const dest = input.destination.toLowerCase();
    if (group.destination.toLowerCase().includes(dest)) score += 30;
  } else {
    score += 15; // 전체 선택 시 기본 점수
  }

  // 날짜 겹침
  if (input.dateStart && input.dateEnd) {
    const groupDates = group.dates; // "YYYY-MM-DD ~ YYYY-MM-DD"
    const parts = groupDates.split("~").map(s => s.trim());
    if (parts.length === 2) {
      const gStart = new Date(parts[0]);
      const gEnd = new Date(parts[1]);
      const uStart = new Date(input.dateStart);
      const uEnd = new Date(input.dateEnd);
      const overlap = gStart <= uEnd && gEnd >= uStart;
      if (overlap) score += 40;
    }
  }

  // 인원 범위
  const min = input.minSize ?? 4;
  const max = input.maxSize ?? 8;
  if (group.maxMembers >= min && group.maxMembers <= max) score += 10;

  // 평점 보너스 (프리미엄)
  const rating = mockGroupRating(group);
  if (rating >= 4.5) score += 20;
  else if (rating >= 4.0) score += 12;
  else if (rating < 3.5) score -= 20; // 프리미엄 모드에서 저평점 페널티

  // 분위기 매칭
  if (input.vibe !== "any") {
    const VIBE_KWS: Record<TripVibe, string[]> = {
      party:   [i18n.t("auto.g_0362", "클럽"), i18n.t("auto.g_0363", "파티"), i18n.t("auto.g_0364", "나이트"), "night", "bar"],
      healing: [i18n.t("auto.g_0365", "힐링"), i18n.t("auto.g_0366", "편한"), i18n.t("auto.g_0367", "캐주얼"), i18n.t("auto.g_0368", "카페"), i18n.t("auto.g_0369", "자유")],
      serious: [i18n.t("auto.g_0370", "진지"), i18n.t("auto.g_0371", "목적"), i18n.t("auto.g_0372", "계획"), i18n.t("auto.g_0373", "투어"), i18n.t("auto.g_0374", "관광")],
      any:     [],
    };
    const all = [...group.tags, group.title].join(" ").toLowerCase();
    const hit = VIBE_KWS[input.vibe].some(k => all.includes(k));
    if (hit) score += 15;
  }

  // 프리미엄 그룹 보너스
  if (group.isPremiumGroup) score += 8;

  // 모집 중 보너스
  if (group.currentMembers < group.maxMembers) score += 5;

  return score;
}

// ──────────────────────────────────────────────
// Auto-filter: 문제 유저 개입 그룹 제외
// (실제로는 group_members → meet_reviews caution tag count로 계산)
// ──────────────────────────────────────────────
function hasProblematicUsers(group: TripGroup): boolean {
  if (group.hasProblematicUsers !== undefined) return group.hasProblematicUsers;
  return false;
}

// ──────────────────────────────────────────────
// Main matching engine
// ──────────────────────────────────────────────
export function runMatchingEngine(
  groups: TripGroup[],
  input: MatchInput
): MatchResult[] {
  const results: MatchResult[] = [];

  for (const group of groups) {
    // 기본 필터
    if (group.currentMembers >= group.maxMembers) continue; // 마감된 그룹 제외

    const min = input.minSize ?? 4;
    const max = input.maxSize ?? 8;
    if (group.maxMembers < min || group.maxMembers > max) continue;

    // 프리미엄 모드: 추가 필터
    if (input.isPremium) {
      const rating = mockGroupRating(group);
      if (rating < 4.0) continue;          // 평점 4.0 미만 제외
      if (hasProblematicUsers(group)) continue; // 문제 유저 포함 그룹 제외
    }

    const score = scoreGroup(group, input);
    if (score < 0) continue; // 너무 낮은 점수 제외

    const genderStats = inferGenderStats(group);
    const avgRating = mockGroupRating(group);
    const { fee, isFree } = getFeeForUser(group, input.gender, input.isPlusUser ?? false);

    // 매칭 이유 생성
    const reasons: string[] = [];
    if (group.destination.toLowerCase().includes(input.destination.toLowerCase()) && input.destination)
      reasons.push(i18n.t("auto.g_0375", "📍 목적지 일치"));
    if (avgRating >= 4.5) reasons.push(i18n.t("auto.g_0376", "⭐ 최고 평점"));
    if (group.isPremiumGroup) reasons.push(i18n.t("auto.g_0377", "👑 검증 그룹"));
    if (isFree) reasons.push(i18n.t("auto.g_0378", "🎁 여성 무료"));
    if (group.daysLeft <= 3) reasons.push(i18n.t("auto.g_0379", "⚡ 마감 임박"));
    if (group.currentMembers < group.maxMembers - 1) reasons.push(i18n.t("auto.g_0380", "✅ 여유 있음"));
    if (input.isInstant) reasons.push(i18n.t("auto.g_0381", "⚡ 바로모임 가능"));

    results.push({
      group,
      score,
      genderStats,
      avgRating,
      feeForUser: fee,
      isFreeForUser: isFree,
      matchReasons: reasons.slice(0, 3),
      isPremiumMatch: input.isPremium,
    });
  }

  // 점수 내림차순 정렬
  return results.sort((a, b) => b.score - a.score);
}
