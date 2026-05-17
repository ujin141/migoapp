/**
 * AdBanner.tsx
 * 네이티브 AdMob 배너 광고 래퍼 컴포넌트
 *
 * - iOS/Android 네이티브 앱: AdMob SDK 배너 (실제 광고)
 * - 웹/시뮬레이터: 아무것도 렌더링하지 않음
 *
 * 사용법:
 *   <AdBanner position={BannerAdPosition.BOTTOM_CENTER} />
 */
import { Capacitor } from '@capacitor/core';
import { BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';
import { useAdMobBanner } from '@/hooks/useAdMob';

interface AdBannerProps {
  position?: BannerAdPosition;
  size?: BannerAdSize;
  /** 배너가 차지하는 여백 높이(px) - 콘텐츠 밀림 방지용 */
  reservedHeight?: number;
  /** 하단 네비게이션 바 등과의 겹침 방지용 여백 (DP) */
  margin?: number;
}

export default function AdBanner({
  position = BannerAdPosition.BOTTOM_CENTER,
  size = BannerAdSize.ADAPTIVE_BANNER,
  reservedHeight = 60,
  margin = 0,
}: AdBannerProps) {
  // 네이티브 배너를 마운트/언마운트 시 자동 show/remove
  useAdMobBanner(position, size, margin);

  // 웹에서는 렌더링 없음
  if (!Capacitor.isNativePlatform()) return null;

  // 배너가 콘텐츠를 가리지 않도록 여백 div만 렌더링
  // (실제 배너는 네이티브 레이어에 렌더링됨)
  return (
    <div
      style={{ height: `${reservedHeight}px`, flexShrink: 0 }}
      aria-hidden="true"
    />
  );
}
