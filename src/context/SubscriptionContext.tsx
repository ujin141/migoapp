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
  canJoinPremiumGroups: false,
  canPriorityPassport: false, canUnlimitedAITrip: false, canHighlightReviewBadge: false,
  canPremiumTheme: false, canDedicatedSupport: false,
  maxChatThreads: 3, openedThreadCount: 0,
  canOpenChat: () => false, trackOpenedThread: () => {},
});

export const useSubscription = () => useContext(SubscriptionContext);

const BOOST_DURATION = 30 * 60;
const MAX_FREE_DM = 10;

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

  const maxSuperLikes = isPremium ? Infinity : (isPlus ? 5 : 0);
  const maxDailyDm = isPlus ? Infinity : MAX_FREE_DM;
  const canSendDm = isPlus || dailyDmCount < MAX_FREE_DM;
  // 채팅 열람 제한
  const maxChatThreads = isPremium ? Infinity : (isPlus ? 20 : 3);
  const openedThreadCount = openedThreads.size;

  const canOpenChat = useCallback((threadId: string): boolean => {
    if (isPremium) return true;
    if (openedThreads.has(threadId)) return true; // 이미 연 채팅방은 허용
    return openedThreads.size < maxChatThreads;
  }, [isPremium, openedThreads, maxChatThreads]);

  const trackOpenedThread = useCallback((threadId: string) => {
    if (openedThreads.has(threadId)) return;
    setOpenedThreads(prev => {
      const next = new Set(prev);
      next.add(threadId);
      try {
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem('migo_opened_threads', JSON.stringify({ date: today, ids: [...next] }));
      } catch {}
      return next;
    });
  }, [openedThreads]);

  // ── DB에서 구독상태 + 아이템 잔량 로드 ──────────────────────────────────
  useEffect(() => {
    if (!user || !sessionReady) return; // sessionReady: auth lockAcquired 완료 후 실행

    // profiles에서 구독 플랜 + 아이템 구매 상태 로드
    supabase
      .from("profiles")
      .select("is_plus, plan, plus_expires_at, has_badge, profile_theme, nearby_expires_at")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.has_badge) setHasVerifiedBadge(true);
        if (data?.profile_theme && data.profile_theme !== 'default') setHasProfileTheme(true);
        if (data?.nearby_expires_at) {
          const exp = new Date(data.nearby_expires_at);
          if (exp > new Date()) setNearbyUnlockedUntil(exp);
        }
        const now = new Date();
        // BUG-09 fix: plus_expires_at 이 null 이면 '만료 없음(영구)' 으로 처리
        const expiresAt = data?.plus_expires_at ? new Date(data.plus_expires_at) : null;
        const isExpired = expiresAt !== null && expiresAt < now; // null이면 만료 안 됨

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

          // 만료됐지만 아직 DB에 premium/plus로 남아있다면 해제 업데이트 (Pseudo-cron)
          if (data?.plan && data.plan !== 'free') {
            supabase.from('profiles')
              .update({ plan: 'free', is_plus: false })
              .eq('id', user.id)
              .then(({ error }) => {
                // 업데이트 실패는 로컈에만 기록 (DB와 로컈 간 불일치는 다음 앱 실행 시 처리됨)
                if (error) console.warn('[Sub] 만료 해제 DB 업데이트 실패:', error.message);
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

    // 실시간 아이템 잔량 업데이트 구독 (부스터/슈퍼라이크)
    const channel = supabase.channel('user_items_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_items', filter: `user_id=eq.${user.id}` }, (payload) => {
        if (payload.new) {
          const newItem = payload.new as any;
          if (newItem.boosts !== undefined) setBoostsCount(newItem.boosts);
          if (newItem.super_likes !== undefined) setSuperLikesLeft(newItem.super_likes);
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
      
      // 🚨 [CRITICAL SECURITY WARNING] 결제 우회(Payment Bypass) 취약점 구간
      // 현재 클라이언트 측에서 StoreKit 영수증 1차 검증만 수행 후, 직접 자신의 
      // 권한(is_plus)과 구독 레코드(subscriptions)를 DB에 강제 Insert 하고 있습니다.
      // 악성 사용자가 이 통신을 가로채거나 브라우저 콘솔에서 직접 함수를 호출하면, 
      // 실제 과금 없이 무료로 프리미엄 우회를 할 수 있습니다.
      // TODO: 영수증(Receipt) 토큰을 Edge Function으로 넘겨 Apple Server와 
      // 2차 검증(Server-to-Server)을 거친 뒤 서버에서 DB를 업데이트하도록 아키텍처를 변경해야 합니다.
      await Promise.all([
        supabase.from("profiles").update({ is_plus: true, plan }).eq("id", user.id),
        supabase.from("subscriptions").insert({
          user_id: user.id, plan, status: 'active', expires_at: expiresAt,
          price_krw: plan === 'premium' ? 19900 : 9900
        }),
        supabase.from("user_items").upsert({
          user_id: user.id, boosts: currentBoosts + bonusBoosts
        }, { onConflict: 'user_id' })
      ]);
    }
  }, [user]);

  // ── StoreKit IAP: 구독 구매 ──────────────────────────────────────────────
  const purchaseSubscriptionIAP = useCallback(async (productId: IAPProductId) => {
    const result = await iapPurchaseSubscription(productId);
    if (result.success) {
      const plan = getSubscriptionPlanFromProductId(productId);
      if (plan && user) {
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const bonusBoosts = plan === 'premium' ? 5 : 1;
        const bonusSuperLikes = plan === 'premium' ? 9999 : 5;
        setIsPlus(true);
        if (plan === 'premium') setIsPremium(true);
        setBoostsCount(prev => prev + bonusBoosts);
        setSuperLikesLeft(prev => prev + bonusSuperLikes);
        const { data: itemData } = await supabase.from("user_items").select("boosts").eq("user_id", user.id).maybeSingle();
        const currentBoosts = itemData?.boosts ?? 0;
        await Promise.all([
          supabase.from("profiles").update({ is_plus: true, plan, plus_expires_at: expiresAt }).eq("id", user.id),
          supabase.from("subscriptions").insert({
            user_id: user.id, plan, status: 'active', expires_at: expiresAt,
            price_krw: plan === 'premium' ? 99900 : 14900,
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
      // 아이템 종류별 처리 — 선언 순서 문제를 피하기 위해 setState + Supabase 직접 처리
      if (shopItemId.startsWith('superlike_')) {
        let amount = 0;
        if (shopItemId === 'superlike_3') amount = 3;
        else if (shopItemId === 'superlike_10') amount = 10;
        else if (shopItemId === 'superlike_30') amount = 30;
        setSuperLikesLeft(prev => prev + amount);
        const { data } = await supabase.from("user_items").select("super_likes").eq("user_id", user.id).maybeSingle();
        await supabase.from("user_items").upsert({ user_id: user.id, super_likes: (data?.super_likes ?? 0) + amount }, { onConflict: 'user_id' });
      } else if (shopItemId.startsWith('boost_')) {
        let amount = 0;
        if (shopItemId === 'boost_1') amount = 1;
        else if (shopItemId === 'boost_5') amount = 5;
        else if (shopItemId === 'boost_15') amount = 15;
        setBoostsCount(prev => prev + amount);
        const { data } = await supabase.from("user_items").select("boosts").eq("user_id", user.id).maybeSingle();
        await supabase.from("user_items").upsert({ user_id: user.id, boosts: (data?.boosts ?? 0) + amount }, { onConflict: 'user_id' });
      } else if (shopItemId === 'travel_pack') {
        setSuperLikesLeft(prev => prev + 10);
        setBoostsCount(prev => prev + 1);
        const { data } = await supabase.from("user_items").select("super_likes, boosts").eq("user_id", user.id).maybeSingle();
        await supabase.from("user_items").upsert({ user_id: user.id, super_likes: (data?.super_likes ?? 0) + 10, boosts: (data?.boosts ?? 0) + 1 }, { onConflict: 'user_id' });
      } else if (shopItemId === 'verified_badge') {
        setHasVerifiedBadge(true);
        await supabase.from("profiles").update({ has_badge: true }).eq("id", user.id);
      } else if (shopItemId === 'profile_theme') {
        setHasProfileTheme(true);
        await supabase.from("profiles").update({ profile_theme: 'aurora' }).eq("id", user.id); // default theme upon buying
      } else if (shopItemId === 'nearby_unlock') {
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        setNearbyUnlockedUntil(expires);
        await supabase.from("profiles").update({ nearby_expires_at: expires.toISOString() }).eq("id", user.id);
      }
    }
    return result;
  }, [user]);

  // ── StoreKit IAP: 구매 복원 ──────────────────────────────────────────────
  const restorePurchasesIAP = useCallback(async () => {
    const result = await restoreIAPPurchases();
    let restoredPlan: 'plus' | 'premium' | undefined;
    if (result.restored && result.activeSubscriptions.length > 0) {
      for (const sub of result.activeSubscriptions) {
        const plan = getSubscriptionPlanFromProductId(sub);
        if (plan === 'premium') { restoredPlan = 'premium'; break; }
        if (plan === 'plus') restoredPlan = 'plus';
      }
      if (restoredPlan && user) {
        setIsPlus(true);
        if (restoredPlan === 'premium') setIsPremium(true);
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
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
    // 낙관적 즉시 UI 업데이트
    setSuperLikesLeft(prev => prev + 10);
    setBoostsCount(prev => prev + 1);
    if (user) {
      // 단일 SELECT 후 단일 upsert — 레이스 컨디션 방지 (addSuperLikes + addBoosts 순차 실행 X)
      const { data } = await supabase.from("user_items").select("super_likes, boosts").eq("user_id", user.id).maybeSingle();
      await supabase.from("user_items").upsert({
        user_id: user.id,
        super_likes: (data?.super_likes ?? 0) + 10,
        boosts: (data?.boosts ?? 0) + 1,
      }, { onConflict: 'user_id' });
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
    if (boostsCount <= 0 && !isPlus) return; // 잔여 부스트 없으면 불가
    
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
    setDailyDmCount((n) => {
      const next = n + 1;
      // BUG-02 fix: persist to localStorage so count survives app restarts
      try {
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem('migo_dm_data', JSON.stringify({ count: next, date: today }));
      } catch {}
      return next;
    });
    return true;
  }, [isPlus, dailyDmCount]);

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
