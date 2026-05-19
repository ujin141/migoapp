import { Capacitor } from '@capacitor/core';
import { BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';
import { useAdMobBanner } from '@/hooks/useAdMob';
import { NAV_H, BANNER_MARGIN } from './BottomNav';

interface AdBannerProps {
  position?: BannerAdPosition;
  size?: BannerAdSize;
  reservedHeight?: number;
}

// App.tsx의 fixed 컨테이너가 웹 뷰 영역을 확보하고,
// 네이티브 배너는 margin=NAV_H(52)로 하단 네비게이션 바로 위에 띄웁니다.
export default function AdBanner({
  position = BannerAdPosition.BOTTOM_CENTER,
  size = BannerAdSize.ADAPTIVE_BANNER,
  reservedHeight = 60,
}: AdBannerProps) {
  // margin=BANNER_MARGIN(86): 네이티브 플러그인이 배너를 화면 맨 아래에서 안전하게 띄워 렌더링
  useAdMobBanner(position, size, BANNER_MARGIN);

  if (!Capacitor.isNativePlatform()) return null;

  return (
    <div style={{ height: `${reservedHeight}px`, flexShrink: 0 }} aria-hidden="true" />
  );
}
