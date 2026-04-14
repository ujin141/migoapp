/**
 * iapService.ts
 * Native StoreKit IAP 연동 서비스 (Apple Guideline 3.1.1)
 * @capgo/native-purchases v6 사용
 */
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';
import { Capacitor } from '@capacitor/core';

// ── 상품 ID 정의 ───────────────────────────────────────────────
export const IAP_PRODUCT_IDS = {
  // 구독 상품
  PLUS_MONTHLY:   'com.lunaticsgroup.migo.sub.plus.m1',
  PLUS_QUARTERLY: 'com.lunaticsgroup.migo.plus_quarterly', // (추후 필요시 추가)
  PLUS_YEARLY:    'com.lunaticsgroup.migo.sub.plus.y1',
  PREMIUM_MONTHLY:'com.lunaticsgroup.migo.sub.premium.m1',

  // 소비성 아이템
  SUPERLIKE_3:    'com.lunaticsgroup.migo.superlike3',
  SUPERLIKE_10:   'com.lunaticsgroup.migo.superlike10',
  SUPERLIKE_30:   'com.lunaticsgroup.migo.superlike30',
  BOOST_1:        'com.lunaticsgroup.migo.boost1',
  BOOST_5:        'com.lunaticsgroup.migo.boost5',
  BOOST_15:       'com.lunaticsgroup.migo.boost15',
  TRAVEL_PACK:    'com.lunaticsgroup.migo.travel_pack',
  VERIFIED_BADGE: 'com.lunaticsgroup.migo.verifiedbadge',
  PROFILE_THEME:  'com.lunaticsgroup.migo.item.profiletheme',
  NEARBY_UNLOCK:  'com.lunaticsgroup.migo.nearby_unlock',
} as const;

export type IAPProductId = typeof IAP_PRODUCT_IDS[keyof typeof IAP_PRODUCT_IDS];

// 구독 상품 ID 목록
export const SUBSCRIPTION_PRODUCT_IDS = [
  IAP_PRODUCT_IDS.PLUS_MONTHLY,
  // IAP_PRODUCT_IDS.PLUS_QUARTERLY, // App Store Connect 미등록 — 추후 추가 시 활성화
  IAP_PRODUCT_IDS.PLUS_YEARLY,
  IAP_PRODUCT_IDS.PREMIUM_MONTHLY,
];

// 소비성 아이템 ID 목록
export const CONSUMABLE_PRODUCT_IDS = [
  IAP_PRODUCT_IDS.SUPERLIKE_3,
  IAP_PRODUCT_IDS.SUPERLIKE_10,
  IAP_PRODUCT_IDS.SUPERLIKE_30,
  IAP_PRODUCT_IDS.BOOST_1,
  IAP_PRODUCT_IDS.BOOST_5,
  IAP_PRODUCT_IDS.BOOST_15,
  IAP_PRODUCT_IDS.TRAVEL_PACK,
  IAP_PRODUCT_IDS.VERIFIED_BADGE,
  IAP_PRODUCT_IDS.PROFILE_THEME,
  IAP_PRODUCT_IDS.NEARBY_UNLOCK,
];

// billingCycle → productId 매핑 (Plus)
export const PLUS_BILLING_CYCLE_MAP: Record<'monthly' | 'yearly', string> = {
  monthly:   IAP_PRODUCT_IDS.PLUS_MONTHLY,
  yearly:    IAP_PRODUCT_IDS.PLUS_YEARLY,
  // quarterly: IAP_PRODUCT_IDS.PLUS_QUARTERLY, // 미등록 — 추후 활성화
};

// ShopPage 아이템 ID → productId 매핑
export const SHOP_ITEM_PRODUCT_MAP: Record<string, IAPProductId> = {
  superlike_3:    IAP_PRODUCT_IDS.SUPERLIKE_3,
  superlike_10:   IAP_PRODUCT_IDS.SUPERLIKE_10,
  superlike_30:   IAP_PRODUCT_IDS.SUPERLIKE_30,
  boost_1:        IAP_PRODUCT_IDS.BOOST_1,
  boost_5:        IAP_PRODUCT_IDS.BOOST_5,
  boost_15:       IAP_PRODUCT_IDS.BOOST_15,
  travel_pack:    IAP_PRODUCT_IDS.TRAVEL_PACK,
  verified_badge: IAP_PRODUCT_IDS.VERIFIED_BADGE,
  profile_theme:  IAP_PRODUCT_IDS.PROFILE_THEME,
  nearby_unlock:  IAP_PRODUCT_IDS.NEARBY_UNLOCK,
};

// ── 네이티브 환경 체크 —————————————————————
// iOS: StoreKit, Android: Google Play Billing (→ @capgo/native-purchases 자동 선택)
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/** @deprecated 구 iOS 전용 체크 — 이제 isNativePlatform() 사용 */
export const isNativeIOS = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
};

export const isAndroid = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

// ── 결제 지원 여부 확인 ──────────────────────────────
export const checkBillingSupported = async (): Promise<boolean> => {
  // iOS: StoreKit, Android: Google Play Billing 둘 다 지원
  if (!isNativePlatform()) return false;
  try {
    const { isBillingSupported } = await NativePurchases.isBillingSupported();
    return isBillingSupported;
  } catch {
    return false;
  }
};

// ── 상품 정보 조회 ───────────────────────────────────
export const getIAPProducts = async (productIds: string[], isSubscription = true) => {
  if (!isNativePlatform()) return [];  // iOS + Android 모두 지원
  try {
    const { products } = await NativePurchases.getProducts({
      productIdentifiers: productIds,
      productType: isSubscription ? PURCHASE_TYPE.SUBS : PURCHASE_TYPE.INAPP,
    });
    return products;
  } catch (e) {
    console.warn('[IAP] getProducts error:', e);
    return [];
  }
};

// ── 구독 상품 구매 ───────────────────────────────────────────
export interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  cancelled?: boolean;
}

export const purchaseSubscription = async (productId: IAPProductId): Promise<PurchaseResult> => {
  if (!isNativePlatform()) {
    return { success: false, error: 'not_native' };
  }
  try {
    await getIAPProducts([productId], true);
    const transaction = await NativePurchases.purchaseProduct({
      productIdentifier: productId,
      productType: PURCHASE_TYPE.SUBS,
    });
    return { success: true, transactionId: transaction.transactionId };
  } catch (e: any) {
    const message = e?.message || String(e);
    if (message.includes('cancel') || message.includes('Cancel') || message.includes('2')) {
      return { success: false, cancelled: true };
    }
    console.error('[IAP] purchaseSubscription error:', e);
    return { success: false, error: message };
  }
};

// ── 소비성 아이템 구매 ───────────────────────────────────────
export const purchaseConsumable = async (productId: IAPProductId): Promise<PurchaseResult> => {
  if (!isNativePlatform()) {
    return { success: false, error: 'not_native' };
  }
  try {
    await getIAPProducts([productId], false);
    const transaction = await NativePurchases.purchaseProduct({
      productIdentifier: productId,
      productType: PURCHASE_TYPE.INAPP,
    });
    return { success: true, transactionId: transaction.transactionId };
  } catch (e: any) {
    const message = e?.message || String(e);
    if (message.includes('cancel') || message.includes('Cancel') || message.includes('2')) {
      return { success: false, cancelled: true };
    }
    console.error('[IAP] purchaseConsumable error:', e);
    return { success: false, error: message };
  }
};

// ── 구매 복원 ────────────────────────────────────────────────
export const restoreIAPPurchases = async (): Promise<{
  restored: boolean;
  activeSubscriptions: string[];
  error?: string;
}> => {
  if (!isNativePlatform()) {
    return { restored: false, activeSubscriptions: [], error: 'not_native' };
  }
  try {
    const { customerInfo } = await NativePurchases.restorePurchases();
    return {
      restored: true,
      activeSubscriptions: customerInfo.activeSubscriptions as unknown as string[],
    };
  } catch (e: any) {
    console.error('[IAP] restorePurchases error:', e);
    return { restored: false, activeSubscriptions: [], error: e?.message };
  }
};

// ── productId → 플랜 타입 ────────────────────────────────────
export const getSubscriptionPlanFromProductId = (productId: string): 'plus' | 'premium' | null => {
  if (productId === IAP_PRODUCT_IDS.PREMIUM_MONTHLY) return 'premium';
  if (([
    IAP_PRODUCT_IDS.PLUS_MONTHLY,
    IAP_PRODUCT_IDS.PLUS_QUARTERLY,
    IAP_PRODUCT_IDS.PLUS_YEARLY,
  ] as string[]).includes(productId)) return 'plus';
  return null;
};
