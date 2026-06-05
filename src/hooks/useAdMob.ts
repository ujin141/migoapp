/**
 * useAdMob.ts
 * Google AdMob - 배너 / 전면 / 보상형 광고 통합 훅
 */
import { useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdOptions,
  BannerAdSize,
  BannerAdPosition,
  BannerAdPluginEvents,
  AdMobRewardItem,
} from '@capacitor-community/admob';

// ── 실제 광고 유닛 ID (Play Store 출시 시 사용) ───────────────────
const IOS_IDS = {
  banner:       'ca-app-pub-2237857753220220/1413464680',
  interstitial: 'ca-app-pub-2237857753220220/7487918441',
  rewarded:     'ca-app-pub-2237857753220220/7787301346',
};
const ANDROID_IDS = {
  banner:       'ca-app-pub-2237857753220220/4530582610',
  interstitial: 'ca-app-pub-2237857753220220/5600121706',
  rewarded:     'ca-app-pub-2237857753220220/3303314161',
};

// ── Google 공식 테스트 Ad Unit ID (항상 테스트 광고 반환) ──────────
// 디버그 빌드에서 자동으로 이 ID 사용 → 실 기기에서도 테스트 광고 확인 가능
const ANDROID_TEST_IDS = {
  banner:       'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  rewarded:     'ca-app-pub-3940256099942544/5224354917',
};
const IOS_TEST_IDS = {
  banner:       'ca-app-pub-3940256099942544/2934735716',
  interstitial: 'ca-app-pub-3940256099942544/4411468910',
  rewarded:     'ca-app-pub-3940256099942544/1712485313',
};

// ── 디버그 빌드 감지 ──────────────────────────────────────────────
// - Capacitor.DEBUG: 디버그 APK = true, 릴리즈 APK = false
// - import.meta.env.DEV: Vite 개발 서버 = true
// ✅ npm run build + debug APK (Android Studio에서 Run) → 테스트 광고
// ✅ npm run build + release APK (서명 빌드) → 실제 광고
const IS_DEBUG_BUILD: boolean =
  import.meta.env.DEV ||
  Boolean((Capacitor as any).DEBUG);

function getAdIds() {
  if (IS_DEBUG_BUILD) {
    return Capacitor.getPlatform() === 'android' ? ANDROID_TEST_IDS : IOS_TEST_IDS;
  }
  return Capacitor.getPlatform() === 'android' ? ANDROID_IDS : IOS_IDS;
}

// ── 초기화 (Promise 공유로 이중 초기화 레이스 컨디션 방지) ──────────
let admobInitialized = false;
let initPromise: Promise<void> | null = null;

async function ensureInit(): Promise<void> {
  if (admobInitialized) return;
  if (!Capacitor.isNativePlatform()) return;

  // 이미 진행 중인 초기화가 있으면 동일 Promise 대기 (이중 초기화 방지)
  if (!initPromise) {
    // STAB-4 fix: reject 시 initPromise를 null로 초기화하여 재시도 허용
    // 단, reject를 catch하지 않으면 await ensureInit()이 throw하므로 caller가 try-catch 필수
    initPromise = (async () => {
      try {
        await AdMob.requestTrackingAuthorization().catch(() => {});
        await AdMob.initialize({
          initializeForTesting: IS_DEBUG_BUILD,
          testingDevices: IS_DEBUG_BUILD ? ['EMULATOR'] : [],
        });
        admobInitialized = true;
        console.log(`[AdMob] initialized (${IS_DEBUG_BUILD ? '🧪 TEST' : '🟢 PROD'} mode)`);
      } catch (e) {
        console.warn('[AdMob] initialize error:', e);
        initPromise = null; // STAB-4: 실패 시 null로 초기화 → 다음 호출 시 재시도 가능
        // reject를 전파하지 않고 조용히 처리 (광고 미표시로 대체)
        // caller들은 try-catch 없이 await해도 안전 (throw 없음)
        return; // void 반환 → pending 방지
      }
    })();
  }

  return initPromise;
}

// 앱 시작 시 선제적으로 초기화 (배너 마운트 타이밍 레이스 방지)
if (Capacitor.isNativePlatform()) {
  ensureInit();
}

// ── 훅 ──────────────────────────────────────────────────────────
export function useAdMob() {
  const interstitialLoadedRef = useRef(false);
  const rewardedLoadedRef = useRef(false);

  useEffect(() => { ensureInit(); }, []);

  // ── 전면 광고 사전 로드 ──────────────────────────────────────
  const preloadInterstitial = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return false;
    await ensureInit();
    try {
      const adId = getAdIds().interstitial;
      console.log(`[AdMob] prepare interstitial: ${adId}`);
      await AdMob.prepareInterstitial({ adId });
      interstitialLoadedRef.current = true;
      return true;
    } catch (e) {
      interstitialLoadedRef.current = false;
      console.warn('[AdMob] preloadInterstitial error', e);
      return false;
    }
  }, []);

  // ── 전면 광고 표시 ────────────────────────────────────────────
  const showInterstitial = useCallback(async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) return false;
    await ensureInit();
    try {
      if (!interstitialLoadedRef.current) {
        const loaded = await preloadInterstitial();
        if (!loaded) return false;
      }
      await AdMob.showInterstitial();
      interstitialLoadedRef.current = false;
      preloadInterstitial(); // 다음을 위해 미리 로드
      return true;
    } catch (e) {
      console.warn('[AdMob] showInterstitial error', e);
      return false;
    }
  }, [preloadInterstitial]);

  // ── 보상형 광고 사전 로드 ─────────────────────────────────────
  const preloadRewarded = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return false;
    await ensureInit();
    try {
      const adId = getAdIds().rewarded;
      console.log(`[AdMob] prepare rewarded: ${adId}`);
      await AdMob.prepareRewardVideoAd({ adId });
      rewardedLoadedRef.current = true;
      return true;
    } catch (e) {
      rewardedLoadedRef.current = false;
      console.warn('[AdMob] preloadRewarded error', e);
      return false;
    }
  }, []);

  // ── 보상형 광고 표시 → 보상 콜백 ────────────────────────────
  const showRewarded = useCallback(async (
    onReward: (item: AdMobRewardItem) => void,
  ): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) return false;
    await ensureInit();
    try {
      if (!rewardedLoadedRef.current) {
        const loaded = await preloadRewarded();
        if (!loaded) return false;
      }
      const result = await AdMob.showRewardVideoAd();
      if (result) onReward(result);
      rewardedLoadedRef.current = false;
      preloadRewarded();
      return true;
    } catch (e) {
      console.warn('[AdMob] showRewarded error', e);
      return false;
    }
  }, [preloadRewarded]);

  return { preloadInterstitial, showInterstitial, preloadRewarded, showRewarded };
}

// ── 배너 광고 훅 (컴포넌트용) ────────────────────────────────────
export function useAdMobBanner(
  position: BannerAdPosition = BannerAdPosition.BOTTOM_CENTER,
  size: BannerAdSize = BannerAdSize.ADAPTIVE_BANNER,
  marginDp: number = 0
) {
  const shownRef = useRef(false);
  const listenerRef = useRef<any>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let mounted = true;

    const show = async () => {
      await ensureInit();
      if (!mounted) return;
      try {
        // ── 배너 로드 완료 이벤트: 실제 높이를 CSS 변수로 주입 ──────────
        // BottomNav가 이 값을 읽어 정확히 배너 위에 위치함
        listenerRef.current = await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (info) => {
          const heightPx = info?.height ?? 60;
          document.documentElement.style.setProperty('--admob-banner-height', `${heightPx}px`);
          console.log(`[AdMob] 배너 로드됨: 실제 높이=${heightPx}px`);
        });

        const options: BannerAdOptions = {
          adId: getAdIds().banner,
          adSize: size,
          position,
          margin: marginDp,
          isTesting: IS_DEBUG_BUILD,
        };
        console.log(`[AdMob] show banner: ${options.adId}`);
        await AdMob.showBanner(options);
        if (!mounted) {
          AdMob.removeBanner().catch(() => {});
          return;
        }
        shownRef.current = true;
      } catch (e) {
        console.warn('[AdMob] showBanner error:', e);
      }
    };

    show();

    return () => {
      mounted = false;
      // CSS 변수 초기화
      document.documentElement.style.removeProperty('--admob-banner-height');
      // 리스너 제거
      if (listenerRef.current) {
        listenerRef.current.remove?.();
        listenerRef.current = null;
      }
      AdMob.removeBanner().catch(() => {});
      shownRef.current = false;
    };
  }, [position, size, marginDp]);
}
