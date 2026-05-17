/**
 * useAdMob.ts
 * Google AdMob - 배너 / 전면 / 보상형 광고 통합 훅
 *
 * 사용법:
 *   const { showInterstitial, showRewarded } = useAdMob();
 */
import { useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdOptions,
  BannerAdSize,
  BannerAdPosition,
  AdOptions,
  RewardAdOptions,
  AdLoadInfo,
  RewardItem,
} from '@capacitor-community/admob';

// ── 광고 유닛 ID ─────────────────────────────────────────────────
// ⚠️ 테스트 중에는 테스트 ID 사용 (실 계정 ID로 교체 시 주석에 명시)
const IOS_IDS = {
  // 실제 iOS 광고 단위 ID 적용
  banner:       'ca-app-pub-2237857753220220/3435324499', // User provided iOS Banner
  interstitial: 'ca-app-pub-2237857753220220/4551148350', // User provided iOS Interstitial
  rewarded:     'ca-app-pub-2237857753220220/9938977497', // User provided iOS Rewarded
};

const ANDROID_IDS = {
  // 실제 Android 광고 단위 ID (2025-05 재발급)
  banner:       'ca-app-pub-2237857753220220/4530582610', // Android Banner
  interstitial: 'ca-app-pub-2237857753220220/3303314161', // Android Interstitial
  rewarded:     'ca-app-pub-2237857753220220/5600121706', // Android Rewarded
};

function getAdIds() {
  return Capacitor.getPlatform() === 'android' ? ANDROID_IDS : IOS_IDS;
}

let admobInitialized = false;

async function ensureInit() {
  if (admobInitialized) return;
  if (!Capacitor.isNativePlatform()) return;
  try {
    await AdMob.initialize({
      // 아동용 앱이 아닌 경우 false
      requestTrackingAuthorization: true,
      testingDevices: [],
      initializeForTesting: false, // 테스트 ID 사용 시 false
    });
    admobInitialized = true;
  } catch (e) {
    console.warn('[AdMob] initialize error', e);
  }
}

// ── 훅 ──────────────────────────────────────────────────────────
export function useAdMob() {
  const interstitialLoadedRef = useRef(false);
  const rewardedLoadedRef = useRef(false);

  useEffect(() => {
    ensureInit();
  }, []);

  // ── 전면 광고 사전 로드 ──────────────────────────────────────
  const preloadInterstitial = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    await ensureInit();
    try {
      const options: AdOptions = { adId: getAdIds().interstitial };
      await AdMob.prepareInterstitial(options);
      interstitialLoadedRef.current = true;
    } catch (e) {
      console.warn('[AdMob] preloadInterstitial error', e);
    }
  }, []);

  // ── 전면 광고 표시 ────────────────────────────────────────────
  const showInterstitial = useCallback(async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) return false;
    await ensureInit();
    try {
      if (!interstitialLoadedRef.current) {
        await preloadInterstitial();
      }
      await AdMob.showInterstitial();
      interstitialLoadedRef.current = false;
      // 다음 표시를 위해 미리 로드
      preloadInterstitial();
      return true;
    } catch (e) {
      console.warn('[AdMob] showInterstitial error', e);
      return false;
    }
  }, [preloadInterstitial]);

  // ── 보상형 광고 사전 로드 ─────────────────────────────────────
  const preloadRewarded = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    await ensureInit();
    try {
      const options: RewardAdOptions = { adId: getAdIds().rewarded };
      await AdMob.prepareRewardVideoAd(options);
      rewardedLoadedRef.current = true;
    } catch (e) {
      console.warn('[AdMob] preloadRewarded error', e);
    }
  }, []);

  // ── 보상형 광고 표시 → 보상 콜백 ────────────────────────────
  const showRewarded = useCallback(async (
    onReward: (item: RewardItem) => void,
  ): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) return false;
    await ensureInit();
    try {
      if (!rewardedLoadedRef.current) {
        await preloadRewarded();
      }
      const result = await AdMob.showRewardVideoAd();
      if (result?.value) onReward(result.value);
      rewardedLoadedRef.current = false;
      preloadRewarded();
      return true;
    } catch (e) {
      console.warn('[AdMob] showRewarded error', e);
      return false;
    }
  }, [preloadRewarded]);

  return {
    preloadInterstitial,
    showInterstitial,
    preloadRewarded,
    showRewarded,
  };
}

// ── 배너 광고 훅 (컴포넌트용) ────────────────────────────────────
export function useAdMobBanner(
  position: BannerAdPosition = BannerAdPosition.BOTTOM_CENTER,
  size: BannerAdSize = BannerAdSize.ADAPTIVE_BANNER,
) {
  const shownRef = useRef(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let mounted = true;

    const show = async () => {
      await ensureInit();
      if (!mounted) return;
      try {
        const options: BannerAdOptions = {
          adId: getAdIds().banner,
          adSize: size,
          position,
          margin: 0,
          isTesting: false,
        };
        await AdMob.showBanner(options);
        shownRef.current = true;
      } catch (e) {
        console.warn('[AdMob] showBanner error', e);
      }
    };

    show();

    return () => {
      mounted = false;
      if (shownRef.current) {
        AdMob.removeBanner().catch(() => {});
        shownRef.current = false;
      }
    };
  }, [position, size]);
}
