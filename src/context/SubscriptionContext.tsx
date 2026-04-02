import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

export type PlanType = "free" | "plus" | "premium";

interface SubscriptionContextType {
  isPlus: boolean;
  isPremium: boolean;
  boostActive: boolean;
  boostSecondsLeft: number;
  boostsCount: number;
  superLikesLeft: number;
  maxSuperLikes: number;
  dailyDmCount: number;
  maxDailyDm: number;
  canSendDm: boolean;
  upgradePlus: (plan?: 'plus' | 'premium') => void;
  startBoost: () => void;
  consumeSuperLike: (toUserId?: string) => Promise<boolean>;
  consumeDm: () => boolean;
  // Plus 전용 기능 게이팅
  canGlobalMatch: boolean;       // 글로벌 전세계 여행자 매칭
  canViewLikers: boolean;        // 나를 좋아한 사람 목록 보기
  canNowFeatured: boolean;       // 지금여기있어요 최상단 고정
  canReadReceipts: boolean;      // 채팅 읽음 확인
  canHideLocation: boolean;      // 위치 숨기기
  canTravelDNAFull: boolean;     // 여행 DNA 상세 리포트
  // Premium 전용 기능 게이팅
  canJoinPremiumGroups: boolean; // 프리미엄 그룹 참여
  canPriorityPassport: boolean;  // 여권 인증 자동 처리 우선순위
  canUnlimitedAITrip: boolean;   // AI 여행 일정 생성 무제한
  canHighlightReviewBadge: boolean; // 동행 완료 리뷰 뱃지 강조
  canPremiumTheme: boolean;      // 프리미엄 프로필 테마
  canDedicatedSupport: boolean;  // 전담 고객 지원
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPlus: false, isPremium: false, boostActive: false, boostSecondsLeft: 0, boostsCount: 0,
  superLikesLeft: 0, maxSuperLikes: 0, dailyDmCount: 0, maxDailyDm: 10, canSendDm: true,
  upgradePlus: () => {}, startBoost: () => {}, consumeSuperLike: async () => false, consumeDm: () => false,
  canGlobalMatch: false, canViewLikers: false, canNowFeatured: false,
  canReadReceipts: false, canHideLocation: false, canTravelDNAFull: false,
  canJoinPremiumGroups: false,
  canPriorityPassport: false, canUnlimitedAITrip: false, canHighlightReviewBadge: false,
  canPremiumTheme: false, canDedicatedSupport: false,
});

export const useSubscription = () => useContext(SubscriptionContext);

const BOOST_DURATION = 30 * 60;
const MAX_FREE_DM = 10;

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isPlus, setIsPlus] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [boostActive, setBoostActive] = useState(false);
  const [boostSecondsLeft, setBoostSecondsLeft] = useState(0);
  const [boostsCount, setBoostsCount] = useState(0);
  const [superLikesLeft, setSuperLikesLeft] = useState(0);
  const [dailyDmCount, setDailyDmCount] = useState(0);

  const maxSuperLikes = isPremium ? Infinity : (isPlus ? 5 : 0);
  const maxDailyDm = isPlus ? Infinity : MAX_FREE_DM;
  const canSendDm = isPlus || dailyDmCount < MAX_FREE_DM;

  // ── DB에서 구독상태 + 아이템 잔량 로드 ──────────────────────────────────
  useEffect(() => {
    if (!user) return;
    // profiles에서 구독 플랜 로드
    supabase
      .from("profiles")
      .select("is_plus, boosts_count, plan, plus_expires_at")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        const now = new Date();
        const expiresAt = data?.plus_expires_at ? new Date(data.plus_expires_at) : null;
        const isExpired = expiresAt && expiresAt < now;

        if (!isExpired) {
          if (data?.plan === 'premium') {
            setIsPremium(true);
            setIsPlus(true);
          } else if (data?.is_plus || data?.plan === 'plus') {
            setIsPlus(true);
          }
        } else {
          // 체험 기간 또는 구독 기간 만료 시 로컬 상태 초기화
          setIsPremium(false);
          setIsPlus(false);
          
          // 만료되었지만 아직 DB에 premium/plus로 남아있다면 해제 업데이트 (Pseudo-cron)
          if (data?.plan !== 'free') {
            supabase.from('profiles').update({ plan: 'free', is_plus: false }).eq('id', user.id).then();
          }
        }
        if (data?.boosts_count !== undefined) {
          setBoostsCount(data.boosts_count);
        }
      });

    // user_items에서 슈퍼라이크/부스트 잔량 로드
    supabase
      .from("user_items")
      .select("super_likes, boosts")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSuperLikesLeft(data.super_likes ?? 0);
          setBoostsCount(data.boosts ?? 0);
        } else {
          // user_items 행 없으면 생성
          supabase.from("user_items").insert({ user_id: user.id }).then(() => {});
        }
      });
  }, [user]);

  // ── Migo Plus/Premium 업그레이드 (ex: 테스트 결제) ─────────────────────────────────
  const upgradePlus = useCallback(async (plan: 'plus' | 'premium' = 'plus') => {
    setIsPlus(true);
    if (plan === 'premium') setIsPremium(true);
    setDailyDmCount(0);
    const bonusBoosts = plan === 'premium' ? 5 : 1;
    const bonusSuperLikes = plan === 'premium' ? 9999 : 5;
    
    setBoostsCount(prev => prev + bonusBoosts);
    setSuperLikesLeft(prev => prev + bonusSuperLikes);

    if (user) {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await Promise.all([
        supabase.from("profiles").update({ is_plus: true, plan }).eq("id", user.id),
        supabase.from("subscriptions").insert({
          user_id: user.id, plan, status: 'active', expires_at: expiresAt,
          price_krw: plan === 'premium' ? 19900 : 9900
        }),
        supabase.from("user_items").upsert({
          user_id: user.id, boosts: boostsCount + bonusBoosts
        }, { onConflict: 'user_id' })
      ]);
    }
  }, [user, boostsCount]);

  const boostIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startBoost = useCallback(async () => {
    if (boostsCount <= 0 && !isPlus) return; // 잔여 부스트 없으면 불가
    
    // DB 업데이트
    if (user) {
      const expiresAt = new Date(Date.now() + BOOST_DURATION * 1000).toISOString();
      await supabase.from("profiles")
        .update({
          boosts_count: Math.max(0, boostsCount - 1),
          boost_expires_at: expiresAt
        })
        .eq("id", user.id);
    }

    setBoostsCount(prev => Math.max(0, prev - 1));
    if (boostIntervalRef.current) clearInterval(boostIntervalRef.current);
    setBoostActive(true);
    setBoostSecondsLeft(BOOST_DURATION);
    boostIntervalRef.current = setInterval(() => {
      setBoostSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(boostIntervalRef.current!);
          boostIntervalRef.current = null;
          setBoostActive(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, [boostsCount, isPlus, user]);

  const consumeSuperLike = useCallback(async (toUserId?: string): Promise<boolean> => {
    if (isPremium) return true; // Premium은 무제한
    if (superLikesLeft <= 0) return false;
    // DB RPC 호출 (슈퍼라이크 차감 + likes 삽입 원자적)
    if (user && toUserId) {
      const { data, error } = await supabase.rpc('record_superlike', { p_to_user: toUserId });
      if (error || !data?.success) return false;
      setSuperLikesLeft(data.remaining ?? superLikesLeft - 1);
    } else {
      // 미로그인 / toUserId 없을 시 로컬만 차감
      if (superLikesLeft <= 0) return false;
      setSuperLikesLeft(n => n - 1);
    }
    return true;
  }, [isPremium, superLikesLeft, user]);

  const consumeDm = useCallback((): boolean => {
    if (isPlus) return true;
    if (dailyDmCount >= MAX_FREE_DM) return false;
    setDailyDmCount((n) => n + 1);
    return true;
  }, [isPlus, dailyDmCount]);

  return (
    <SubscriptionContext.Provider value={{
      isPlus, isPremium, boostActive, boostSecondsLeft, boostsCount,
      superLikesLeft, maxSuperLikes,
      dailyDmCount, maxDailyDm, canSendDm,
      upgradePlus, startBoost, consumeSuperLike, consumeDm,
      // Plus 전용 기능 (모두 isPlus에 연동)
      canGlobalMatch: isPlus,
      canViewLikers: isPlus,
      canNowFeatured: isPlus,
      canReadReceipts: isPlus,
      canHideLocation: isPlus,
      canTravelDNAFull: isPlus,
      // Premium 전용 기능
      canJoinPremiumGroups: isPremium,
      canPriorityPassport: isPremium,
      canUnlimitedAITrip: isPremium,
      canHighlightReviewBadge: isPremium,
      canPremiumTheme: isPremium,
      canDedicatedSupport: isPremium,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};
