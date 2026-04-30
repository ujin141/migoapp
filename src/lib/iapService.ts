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
  PLUS_QUARTERLY: 'com.lunaticsgroup.migo.sub.plus.q1', // 3개월 구독
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

// 구독 상품 ID 목록 (App Store Connect에 등록된 모든 구독 상품)
export const SUBSCRIPTION_PRODUCT_IDS = [
  IAP_PRODUCT_IDS.PLUS_MONTHLY,
  IAP_PRODUCT_IDS.PLUS_QUARTERLY, // 3개월 구독 — App Store Connect 등록 필수
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

// billingCycle → productId 매핑 (Plus) — App Store Connect 등록 기준
export const PLUS_BILLING_CYCLE_MAP: Record<'monthly' | 'quarterly' | 'yearly', string> = {
  monthly:   IAP_PRODUCT_IDS.PLUS_MONTHLY,
  quarterly: IAP_PRODUCT_IDS.PLUS_QUARTERLY,
  yearly:    IAP_PRODUCT_IDS.PLUS_YEARLY,
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
  // Note: @capgo/native-purchases v6 uses StoreKit 2 directly — no setup() call needed.
  // purchaseProduct() first calls Product.products(for: [id]); if empty it rejects
  // with "Cannot find product for id ...". This typically means the product is not
  // in "Ready to Submit" status in App Store Connect, or the Paid Apps Agreement
  // is not active. We surface this as a distinct error code.
  try {
    const transaction = await NativePurchases.purchaseProduct({
      productIdentifier: productId,
      productType: PURCHASE_TYPE.SUBS,
    });
    return { success: true, transactionId: String(transaction.transactionId) };
  } catch (e: any) {
    const message = e?.message || String(e);
    if (message.includes('cancel') || message.includes('Cancel') || e?.code === 2) {
      return { success: false, cancelled: true };
    }
    // StoreKit 2 returns this when App Store Connect product is not found/ready
    const isProductNotFound = message.includes('Cannot find product') || message.includes('invalid product');
    console.warn('[IAP] purchaseSubscription failed:', isProductNotFound ? 'product_not_found' : 'store_error');
    return {
      success: false,
      error: isProductNotFound ? 'product_not_found' : message,
    };
  }
};

// ── 소비성 아이템 구매 ───────────────────────────────────────
export const purchaseConsumable = async (productId: IAPProductId): Promise<PurchaseResult> => {
  if (!isNativePlatform()) {
    return { success: false, error: 'not_native' };
  }
  try {
    const transaction = await NativePurchases.purchaseProduct({
      productIdentifier: productId,
      productType: PURCHASE_TYPE.INAPP,
    });
    return { success: true, transactionId: String(transaction.transactionId) };
  } catch (e: any) {
    const message = e?.message || String(e);
    if (message.includes('cancel') || message.includes('Cancel') || e?.code === 2) {
      return { success: false, cancelled: true };
    }
    const isProductNotFound = message.includes('Cannot find product') || message.includes('invalid product');
    console.warn('[IAP] purchaseConsumable failed:', isProductNotFound ? 'product_not_found' : 'store_error');
    return {
      success: false,
      error: isProductNotFound ? 'product_not_found' : message,
    };
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
    // 에러 메시지를 외부에 노출하지 않고 오류 코드만 전달
    console.warn('[IAP] restorePurchases failed');
    return { restored: false, activeSubscriptions: [], error: 'restore_failed' };
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
