import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import {
  purchaseSubscription as iapPurchaseSubscription,
  purchaseConsumable as iapPurchaseConsumable,
  restoreIAPPurchases,
  getSubscriptionPlanFromProductId,
  SHOP_ITEM_PRODUCT_MAP,
  PLUS_BILLING_CYCLE_MAP,
  IAP_PRODUCT_IDS,
  isNativeIOS,
  type IAPProductId,
} from "@/lib/iapService";

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
  // 아이템 구매 상태
  hasVerifiedBadge: boolean;
  hasProfileTheme: boolean;
  nearbyUnlockedUntil: Date | null;
  upgradePlus: (plan?: 'plus' | 'premium') => void;
  // StoreKit IAP
  purchaseSubscriptionIAP: (productId: IAPProductId) => Promise<{ success: boolean; error?: string; cancelled?: boolean }>;
  purchaseItemIAP: (shopItemId: string) => Promise<{ success: boolean; error?: string; cancelled?: boolean }>;
  restorePurchasesIAP: () => Promise<{ restored: boolean; restoredPlan?: 'plus' | 'premium' }>;
  startBoost: () => void;
  addBoosts: (amount: number) => void;
  addSuperLikes: (amount: number) => Promise<void>;
  consumeSuperLike: (toUserId?: string) => Promise<boolean>;
  consumeDm: () => boolean;
  purchaseVerifiedBadge: () => Promise<void>;
  purchaseProfileTheme: () => Promise<void>;
  purchaseNearbyUnlock: () => Promise<void>;
  purchaseTravelPack: () => Promise<void>;
  // Plus 전용 기능 게이팅
  canGlobalMatch: boolean;
  canViewLikers: boolean;
  canNowFeatured: boolean;
  canReadReceipts: boolean;
  canHideLocation: boolean;
  canTravelDNAFull: boolean;
  canVoiceCall: boolean;         // 음성통화 (Plus+)
  canAdvancedMapFilters: boolean;// 고급 지도 필터 (Plus+)
  canRemoveAds: boolean;         // 광고 제거 (Plus+)
  canNearbyView: boolean;        // 내 주변 탐색 (Plus+)
  dailyLikeLimit: number;        // 하루 좋아요 한도 (free=10, plus=∞)
  // Premium 전용 기능 게이팅
  canJoinPremiumGroups: boolean;
  canPriorityPassport: boolean;
  canUnlimitedAITrip: boolean;
  canHighlightReviewBadge: boolean;
  canPremiumTheme: boolean;
  canDedicatedSupport: boolean;
  // 채팅 열람 제한
  maxChatThreads: number;
  openedThreadCount: number;
  canOpenChat: (threadId: string) => boolean;
  trackOpenedThread: (threadId: string) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPlus: false, isPremium: false, boostActive: false, boostSecondsLeft: 0, boostsCount: 0,
  superLikesLeft: 0, maxSuperLikes: 0, dailyDmCount: 0, maxDailyDm: 10, canSendDm: true,
  hasVerifiedBadge: false, hasProfileTheme: false, nearbyUnlockedUntil: null,
  upgradePlus: () => {}, startBoost: () => {}, addBoosts: () => {},
  addSuperLikes: async () => {}, consumeSuperLike: async () => false, consumeDm: () => false,
  purchaseVerifiedBadge: async () => {}, purchaseProfileTheme: async () => {},
  purchaseNearbyUnlock: async () => {}, purchaseTravelPack: async () => {},
  purchaseSubscriptionIAP: async () => ({ success: false }),
  purchaseItemIAP: async () => ({ success: false }),
  restorePurchasesIAP: async () => ({ restored: false }),
  canGlobalMatch: false, canViewLikers: false, canNowFeatured: false,
  canReadReceipts: false, canHideLocation: false, canTravelDNAFull: false,
  canVoiceCall: false, canAdvancedMapFilters: false, canRemoveAds: false, canNearbyView: false,
  dailyLikeLimit: 10,
  canJoinPremiumGroups: false,
  canPriorityPassport: false, canUnlimitedAITrip: false, canHighlightReviewBadge: false,
  canPremiumTheme: false, canDedicatedSupport: false,
  maxChatThreads: 3, openedThreadCount: 0,
  canOpenChat: () => false, trackOpenedThread: () => {},
});

export const useSubscription = () => useContext(SubscriptionContext);

const BOOST_DURATION = 30 * 60;
const MAX_FREE_DM = 3; // 무료 유저 하루 DM 제한 (3개)

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user, sessionReady } = useAuth();
  const [isPlus, setIsPlus] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [boostActive, setBoostActive] = useState(false);
  const [boostSecondsLeft, setBoostSecondsLeft] = useState(0);
  const [boostsCount, setBoostsCount] = useState(0);
  const [superLikesLeft, setSuperLikesLeft] = useState(0);
  const [dailyDmCount, setDailyDmCount] = useState<number>(() => {
    // BUG-02 fix: persist DM count across app restarts with daily reset
    try {
      const stored = localStorage.getItem('migo_dm_data');
      if (stored) {
        const { count, date } = JSON.parse(stored);
        const today = new Date().toISOString().slice(0, 10);
        if (date === today) return count as number;
      }
    } catch {}
    return 0;
  });
  // 아이템 구매 상태
  const [hasVerifiedBadge, setHasVerifiedBadge] = useState(false);
  const [hasProfileTheme, setHasProfileTheme] = useState(false);
  const [nearbyUnlockedUntil, setNearbyUnlockedUntil] = useState<Date | null>(null);
  // 열람한 채팅방 ID 목록 (localStorage 영속)
  // BUG-M3 fix: 일별 리셋 — 오늘 날짜가 바뀌면 목록 초기화 (무료 유저 영구 잠금 방지)
  const [openedThreads, setOpenedThreads] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('migo_opened_threads');
      if (stored) {
        const { date, ids } = JSON.parse(stored);
        const today = new Date().toISOString().slice(0, 10);
        if (date === today) return new Set(ids);
      }
      return new Set();
    } catch { return new Set(); }
  });

  // ISSUE-2 fix: maxSuperLikes = 실제 잔량 기준 (구매팩 포함). Plus 기본 제공량 5개가 아닌 현재 잔량을 상한선으로 사용.
  // SuperLikeModal의 "N개 남음" 표시가 구매 팩 수량을 포함한 정확한 값이 됨.
  const maxSuperLikes = isPremium ? Infinity : superLikesLeft;
  const maxDailyDm = isPlus ? Infinity : MAX_FREE_DM;
  const canSendDm = isPlus || dailyDmCount < MAX_FREE_DM;
  // 무료: 채팅방 3개, Plus 이상: 무제한
  const maxChatThreads = isPlus ? Infinity : 3;
  const openedThreadCount = openedThreads.size;
  // 무료: 하루 좋아요 10회, Plus 이상: 무제한
  const dailyLikeLimit = isPlus ? Infinity : 10;

  // BUG-13 fix: openedThreads를 ref로도 관리하여 trackOpenedThread의 불필요한 재생성 방지
  const openedThreadsRef = useRef<Set<string>>(openedThreads);
  useEffect(() => { openedThreadsRef.current = openedThreads; }, [openedThreads]);

  const canOpenChat = useCallback((threadId: string): boolean => {
    if (isPremium) return true;
    if (openedThreadsRef.current.has(threadId)) return true;
    return openedThreadsRef.current.size < maxChatThreads;
  }, [isPremium, maxChatThreads]); // BUG-13 fix: openedThreads 대신 ref 사용

  const trackOpenedThread = useCallback((threadId: string) => {
    if (openedThreadsRef.current.has(threadId)) return; // BUG-13 fix: ref 사용
    setOpenedThreads(prev => {
      const next = new Set(prev);
      next.add(threadId);
      try {
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem('migo_opened_threads', JSON.stringify({ date: today, ids: [...next] }));
      } catch {}
      return next;
    });
  }, []); // BUG-13 fix: deps 없음 (내부에서 ref 사용하므로 stale closure 없음)

  // ── DB에서 구독상태 + 아이템 잔량 로드 ──────────────────────────────────
  useEffect(() => {
    if (!user || !sessionReady) return; // sessionReady: auth lockAcquired 완료 후 실행

    // profiles에서 구독 플랜 + 아이템 구매 상태 로드
    supabase
      .from("profiles")
      .select("is_plus, plan, plus_expires_at, has_badge, profile_theme, nearby_expires_at")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        // DB 조회 실패 시 현재 구독 상태 유지 (free로 강제 전환하지 않음)
        if (error) {
          console.warn('[Subscription] profiles load error:', error.message);
          return;
        }
        if (data?.has_badge) setHasVerifiedBadge(true);
        if (data?.profile_theme && data.profile_theme !== 'default') setHasProfileTheme(true);
        if (data?.nearby_expires_at) {
          const exp = new Date(data.nearby_expires_at);
          if (exp > new Date()) setNearbyUnlockedUntil(exp);
        }
        const now = new Date();
        // 구독 상태 판단:
        // 1. is_plus 또는 plan이 plus/premium 이어야 함
        // 2. plus_expires_at이 설정되어 있으면 → 현재보다 미래여야 함
        // 3. plus_expires_at이 null이면 → DB에 설정된 is_plus 값 그대로 신뢰 (어드민 부여 등)
        const expiresAt = data?.plus_expires_at ? new Date(data.plus_expires_at) : null;
        const isExpired = expiresAt !== null && expiresAt < now;
        // DB에서 실제로 구독 상태인지 확인 (is_plus 필드 우선)
        const dbIsPlus = !!(data?.is_plus || data?.plan === 'plus' || data?.plan === 'premium');

        if (dbIsPlus && !isExpired) {
          if (data?.plan === 'premium') {
            setIsPremium(true);
            setIsPlus(true);
          } else {
            setIsPlus(true);
          }
        } else {
          // 만료되었거나 DB에 구독 상태 아님 → free로 초기화
          setIsPremium(false);
          setIsPlus(false);

          // 만료됐지만 아직 DB에 plus/premium으로 남아있다면 즉시 정리
          if (data?.plan && data.plan !== 'free') {
            supabase.from('profiles')
              .update({ plan: 'free', is_plus: false })
              .eq('id', user.id)
              .then(({ error: updateErr }) => {
                if (updateErr) console.warn('[Sub] 만료 해제 DB 업데이트 실패:', updateErr.message);
              });
          }
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
          // BUG-01 fix: insert → upsert (race condition으로 409 Conflict 방지)
          supabase.from("user_items").upsert({ user_id: user.id }, { onConflict: 'user_id' }).then(() => {});
        }
      });

    // 실시간 데이터 업데이트 구독 (아이템 + 구독 상태)
    // 채널 이름에 user.id 포함: 유저 변경 시 채널 충돌 방지
    const channel = supabase.channel(`user_subscription_realtime:${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_items', filter: `user_id=eq.${user.id}` }, (payload) => {
        if (payload.new) {
          const newItem = payload.new as any;
          if (newItem.boosts !== undefined) setBoostsCount(newItem.boosts);
          if (newItem.super_likes !== undefined) setSuperLikesLeft(newItem.super_likes);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (payload) => {
        if (payload.new) {
          const p = payload.new as any;
          // 아이템 뱃지/테마 갱신
          if (p.has_badge !== undefined) setHasVerifiedBadge(p.has_badge);
          if (p.profile_theme !== undefined) setHasProfileTheme(p.profile_theme && p.profile_theme !== 'default');
          if (p.nearby_expires_at) {
            const exp = new Date(p.nearby_expires_at);
            if (exp > new Date()) setNearbyUnlockedUntil(exp);
            else setNearbyUnlockedUntil(null);
          }
          
          // 구독 상태 실시간 갱신
          const now = new Date();
          const expiresAt = p.plus_expires_at ? new Date(p.plus_expires_at) : null;
          const isExpired = expiresAt !== null && expiresAt < now;
          const dbIsPlus = !!(p.is_plus || p.plan === 'plus' || p.plan === 'premium');

          if (dbIsPlus && !isExpired) {
            if (p.plan === 'premium') {
              setIsPremium(true);
              setIsPlus(true);
            } else {
              setIsPremium(false);
              setIsPlus(true);
            }
          } else {
            setIsPremium(false);
            setIsPlus(false);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, sessionReady]);

  // ── Migo Plus/Premium 업그레이드 (ex: 테스트 결제) ─────────────────────────────────
  const upgradePlus = useCallback(async (plan: 'plus' | 'premium' = 'plus') => {
    const bonusBoosts = plan === 'premium' ? 5 : 1;
    const bonusSuperLikes = plan === 'premium' ? 9999 : 5;

    setIsPlus(true);
    if (plan === 'premium') setIsPremium(true);
    setDailyDmCount(0);
    setBoostsCount(prev => prev + bonusBoosts);
    setSuperLikesLeft(prev => prev + bonusSuperLikes);

    if (user) {
      // 최신 boostsCount를 읽기 위해 DB에서 현재 값을 가져온 후 업데이트
      const { data: itemData } = await supabase.from("user_items").select("boosts").eq("user_id", user.id).maybeSingle();
      const currentBoosts = itemData?.boosts ?? 0;
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const results = await Promise.allSettled([
        supabase.from("profiles").update({ is_plus: true, plan }).eq("id", user.id),
        supabase.from("subscriptions").insert({
          user_id: user.id, plan, status: 'active', expires_at: expiresAt,
          price_krw: plan === 'premium' ? 99900 : 14900
        }),
        supabase.from("user_items").upsert({
          user_id: user.id, boosts: currentBoosts + bonusBoosts
        }, { onConflict: 'user_id' })
      ]);
      
      // DB 업데이트 실패 시 롤백
      if (results.some(r => r.status === 'fulfilled' && r.value.error)) {
        setIsPlus(false);
        setIsPremium(false);
        setBoostsCount(prev => prev - bonusBoosts);
        setSuperLikesLeft(prev => prev - bonusSuperLikes);
        console.error('[Upgrade] DB update failed — rolling back UI');
      }
    }
  }, [user]);

  // ── productId → 구독 기간(일) 계산 헬퍼 ────────────────────────────────
  const getSubscriptionDays = (productId: string): number => {
    if (productId.includes('.y1'))  return 365; // 연간
    if (productId.includes('.q1'))  return 90;  // 3개월
    return 30;                                  // 월간 (기본)
  };

  // ── StoreKit IAP: 구독 구매 ──────────────────────────────────────────────
  const purchaseSubscriptionIAP = useCallback(async (productId: IAPProductId) => {
    const result = await iapPurchaseSubscription(productId);
    if (result.success) {
      const plan = getSubscriptionPlanFromProductId(productId);
      if (plan && user) {
        const days = getSubscriptionDays(productId);
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        const bonusBoosts = plan === 'premium' ? 5 : 1;
        const bonusSuperLikes = plan === 'premium' ? 9999 : 5;
        // 낙관적 UI 업데이트
        setIsPlus(true);
        if (plan === 'premium') setIsPremium(true);
        setBoostsCount(prev => prev + bonusBoosts);
        setSuperLikesLeft(prev => prev + bonusSuperLikes);
        const { data: itemData } = await supabase.from("user_items").select("boosts").eq("user_id", user.id).maybeSingle();
        const currentBoosts = itemData?.boosts ?? 0;
        // price_krw: productId 기준 실제 가격 반영
        const priceKrw = plan === 'premium' ? 99900 : (days >= 365 ? 99900 : days >= 90 ? 34900 : 14900);
        await Promise.all([
          supabase.from("profiles").update({ is_plus: true, plan, plus_expires_at: expiresAt }).eq("id", user.id),
          supabase.from("subscriptions").insert({
            user_id: user.id, plan, status: 'active', expires_at: expiresAt,
            price_krw: priceKrw,
            iap_product_id: productId,
            iap_transaction_id: result.transactionId,
          }),
          supabase.from("user_items").upsert({
            user_id: user.id, boosts: currentBoosts + bonusBoosts
          }, { onConflict: 'user_id' }),
        ]);
      }
    }
    return result;
  }, [user]);

  // ── StoreKit IAP: 소비성 아이템 구매 ────────────────────────────────────
  const purchaseItemIAP = useCallback(async (shopItemId: string) => {
    const productId = SHOP_ITEM_PRODUCT_MAP[shopItemId];
    if (!productId) return { success: false, error: 'unknown_item' };
    const result = await iapPurchaseConsumable(productId);
    if (result.success && user) {
      if (shopItemId.startsWith('superlike_')) {
        let amount = 0;
        if (shopItemId === 'superlike_3') amount = 3;
        else if (shopItemId === 'superlike_10') amount = 10;
        else if (shopItemId === 'superlike_30') amount = 30;
        // ARCH-1 fix: 낙관적 UI, DB 실패 시 롤백
        setSuperLikesLeft(prev => prev + amount);
        const { data, error: dbError } = await supabase.from("user_items").select("super_likes").eq("user_id", user.id).maybeSingle();
        const { error: upsertError } = await supabase.from("user_items").upsert({ user_id: user.id, super_likes: (data?.super_likes ?? 0) + amount }, { onConflict: 'user_id' });
        if (dbError || upsertError) {
          setSuperLikesLeft(prev => prev - amount); // 롤백
          return { success: false, error: 'db_error' };
        }
      } else if (shopItemId.startsWith('boost_')) {
        let amount = 0;
        if (shopItemId === 'boost_1') amount = 1;
        else if (shopItemId === 'boost_5') amount = 5;
        else if (shopItemId === 'boost_15') amount = 15;
        setBoostsCount(prev => prev + amount);
        const { data, error: dbError } = await supabase.from("user_items").select("boosts").eq("user_id", user.id).maybeSingle();
        const { error: upsertError } = await supabase.from("user_items").upsert({ user_id: user.id, boosts: (data?.boosts ?? 0) + amount }, { onConflict: 'user_id' });
        if (dbError || upsertError) {
          setBoostsCount(prev => prev - amount); // 롤백
          return { success: false, error: 'db_error' };
        }
      } else if (shopItemId === 'travel_pack') {
        setSuperLikesLeft(prev => prev + 10);
        setBoostsCount(prev => prev + 1);
        const { data, error: dbError } = await supabase.from("user_items").select("super_likes, boosts").eq("user_id", user.id).maybeSingle();
        const { error: upsertError } = await supabase.from("user_items").upsert({ user_id: user.id, super_likes: (data?.super_likes ?? 0) + 10, boosts: (data?.boosts ?? 0) + 1 }, { onConflict: 'user_id' });
        if (dbError || upsertError) {
          setSuperLikesLeft(prev => prev - 10); // 롤백
          setBoostsCount(prev => prev - 1);
          return { success: false, error: 'db_error' };
        }
      } else if (shopItemId === 'verified_badge') {
        setHasVerifiedBadge(true);
        const { error: updateError } = await supabase.from("profiles").update({ has_badge: true }).eq("id", user.id);
        if (updateError) { setHasVerifiedBadge(false); return { success: false, error: 'db_error' }; }
      } else if (shopItemId === 'profile_theme') {
        setHasProfileTheme(true);
        const { error: updateError } = await supabase.from("profiles").update({ profile_theme: 'aurora' }).eq("id", user.id);
        if (updateError) { setHasProfileTheme(false); return { success: false, error: 'db_error' }; }
      } else if (shopItemId === 'nearby_unlock') {
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        setNearbyUnlockedUntil(expires);
        const { error: updateError } = await supabase.from("profiles").update({ nearby_expires_at: expires.toISOString() }).eq("id", user.id);
        if (updateError) { setNearbyUnlockedUntil(null); return { success: false, error: 'db_error' }; }
      }
    }
    return result;
  }, [user]);

  // ── StoreKit IAP: 구매 복원 ──────────────────────────────────────────────
  const restorePurchasesIAP = useCallback(async () => {
    const result = await restoreIAPPurchases();
    let restoredPlan: 'plus' | 'premium' | undefined;
    let restoredProductId: string | undefined;
    if (result.restored && result.activeSubscriptions.length > 0) {
      for (const sub of result.activeSubscriptions) {
        const plan = getSubscriptionPlanFromProductId(sub);
        if (plan === 'premium') { restoredPlan = 'premium'; restoredProductId = sub; break; }
        if (plan === 'plus') { restoredPlan = 'plus'; restoredProductId = sub; }
      }
      if (restoredPlan && user) {
        setIsPlus(true);
        if (restoredPlan === 'premium') setIsPremium(true);
        // 복원 시에도 productId 기반으로 만료일 계산
        const days = restoredProductId ? getSubscriptionDays(restoredProductId) : 30;
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from("profiles").update({ is_plus: true, plan: restoredPlan, plus_expires_at: expiresAt }).eq("id", user.id);
      }
    }
    return { restored: result.restored, restoredPlan };
  }, [user]);

  const addBoosts = useCallback(async (amount: number) => {
    setBoostsCount(prev => prev + amount);
    if (user) {
      const { data: itemData } = await supabase.from("user_items").select("boosts").eq("user_id", user.id).maybeSingle();
      const currentBoosts = itemData?.boosts ?? 0;
      await supabase.from("user_items").upsert({
        user_id: user.id, boosts: currentBoosts + amount
      }, { onConflict: 'user_id' });
    }
  }, [user]);

  const addSuperLikes = useCallback(async (amount: number) => {
    setSuperLikesLeft(prev => prev + amount);
    if (user) {
      const { data: itemData } = await supabase.from("user_items").select("super_likes").eq("user_id", user.id).maybeSingle();
      const current = itemData?.super_likes ?? 0;
      await supabase.from("user_items").upsert({
        user_id: user.id, super_likes: current + amount
      }, { onConflict: 'user_id' });
    }
  }, [user]);

  const purchaseVerifiedBadge = useCallback(async () => {
    setHasVerifiedBadge(true);
    if (user) await supabase.from("profiles").update({ has_badge: true }).eq("id", user.id);
  }, [user]);

  const purchaseProfileTheme = useCallback(async () => {
    setHasProfileTheme(true);
    if (user) await supabase.from("profiles").update({ profile_theme: 'aurora' }).eq("id", user.id);
  }, [user]);

  const purchaseNearbyUnlock = useCallback(async () => {
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    setNearbyUnlockedUntil(expires);
    if (user) await supabase.from("profiles").update({ nearby_expires_at: expires.toISOString() }).eq("id", user.id);
  }, [user]);

  const purchaseTravelPack = useCallback(async () => {
    // ARCH-1 fix: 낙관적 UI 업데이트 + DB 실패 시 롤백
    setSuperLikesLeft(prev => prev + 10);
    setBoostsCount(prev => prev + 1);
    if (user) {
      const { data, error: dbError } = await supabase.from("user_items").select("super_likes, boosts").eq("user_id", user.id).maybeSingle();
      const { error: upsertError } = await supabase.from("user_items").upsert({
        user_id: user.id,
        super_likes: (data?.super_likes ?? 0) + 10,
        boosts: (data?.boosts ?? 0) + 1,
      }, { onConflict: 'user_id' });
      if (dbError || upsertError) {
        // DB 저장 실패 시 낙관적 업데이트 롤백
        setSuperLikesLeft(prev => prev - 10);
        setBoostsCount(prev => prev - 1);
        console.error('[purchaseTravelPack] DB upsert failed:', dbError || upsertError);
      }
    }
  }, [user]);

  const boostIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // BUG-04 fix: boost interval cleanup — 컴포넌트 언마운트 시 interval 정리
  useEffect(() => {
    return () => {
      if (boostIntervalRef.current) {
        clearInterval(boostIntervalRef.current);
        boostIntervalRef.current = null;
      }
    };
  }, []);

  const startBoost = useCallback(async () => {
    // BUG-2 fix: isPlus여도 boostsCount <= 0이면 실행 불가 (음수 방지)
    if (boostsCount <= 0) return;
    
    // DB 업데이트
    if (user) {
      const expiresAt = new Date(Date.now() + BOOST_DURATION * 1000).toISOString();
      await Promise.all([
        supabase.from("profiles")
          .update({
            boost_expires_at: expiresAt
          })
          .eq("id", user.id),
        supabase.from("user_items")
          .update({ boosts: Math.max(0, boostsCount - 1) })
          .eq("user_id", user.id)
      ]);
    }

    setBoostsCount(prev => Math.max(0, prev - 1));
    if (boostIntervalRef.current) clearInterval(boostIntervalRef.current);
    setBoostActive(true);
    setBoostSecondsLeft(BOOST_DURATION);

    // 1초 tick — requestAnimationFrame 없이 setTimeout으로 drift 방지
    const endTime = Date.now() + BOOST_DURATION * 1000;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setBoostSecondsLeft(remaining);
      if (remaining <= 0) {
        if (boostIntervalRef.current) { clearInterval(boostIntervalRef.current); boostIntervalRef.current = null; }
        setBoostActive(false);
      }
    };
    boostIntervalRef.current = setInterval(tick, 1000);
  }, [boostsCount, user]);

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

  // BUG-9 fix: dailyDmCount를 ref로도 관리하여 stale closure 방지 (연속 클릭 시 제한 초과 방지)
  const dailyDmCountRef = useRef<number>(0);
  useEffect(() => { dailyDmCountRef.current = dailyDmCount; }, [dailyDmCount]);

  const consumeDm = useCallback((): boolean => {
    if (isPlus) return true;
    // ref를 읽어 즉각적인 값 체크 (stale closure 방지)
    if (dailyDmCountRef.current >= MAX_FREE_DM) return false;
    // 즉시 ref 카운트 올려서 연속 터치 시 이중 소비 방지
    dailyDmCountRef.current += 1;
    const next = dailyDmCountRef.current;
    setDailyDmCount(next);
    try {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('migo_dm_data', JSON.stringify({ count: next, date: today }));
    } catch {}
    return true;
  }, [isPlus]);

  return (
    <SubscriptionContext.Provider value={{
      isPlus, isPremium, boostActive, boostSecondsLeft, boostsCount,
      superLikesLeft, maxSuperLikes,
      dailyDmCount, maxDailyDm, canSendDm,
      hasVerifiedBadge, hasProfileTheme, nearbyUnlockedUntil,
      upgradePlus, startBoost, addBoosts, addSuperLikes, consumeSuperLike, consumeDm,
      purchaseVerifiedBadge, purchaseProfileTheme, purchaseNearbyUnlock, purchaseTravelPack,
      purchaseSubscriptionIAP, purchaseItemIAP, restorePurchasesIAP,
      canGlobalMatch: isPlus,
      canViewLikers: isPlus,
      canNowFeatured: isPlus,
      canReadReceipts: isPlus,
      canHideLocation: isPlus,
      canTravelDNAFull: isPlus,
      canVoiceCall: isPlus,
      canAdvancedMapFilters: isPlus,
      canRemoveAds: isPlus,
      canNearbyView: isPlus,
      dailyLikeLimit,
      canJoinPremiumGroups: isPremium,
      canPriorityPassport: isPremium,
      canUnlimitedAITrip: isPremium,
      canHighlightReviewBadge: isPremium,
      canPremiumTheme: isPremium || hasProfileTheme,
      canDedicatedSupport: isPremium,
      maxChatThreads,
      openedThreadCount,
      canOpenChat,
      trackOpenedThread,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};
