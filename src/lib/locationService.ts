import { Geolocation, Position } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { toast } from '@/hooks/use-toast';
import i18n from '@/i18n';

export interface GeoLocationResult {
  lat: number;
  lng: number;
}

/**
 * getCurrentLocation
 * A unified robust GPS location fetcher utilizing Capacitor's exact native OS API.
 * Guarantees maximum active accuracy (`enableHighAccuracy: true`) and prevents 
 * permissions loops natively by verifying OS permissions.
 */
export const getCurrentLocation = async (showToastOnFail = false): Promise<GeoLocationResult | null> => {
  try {
    if (Capacitor.isNativePlatform()) {
      let permStatus = await Geolocation.checkPermissions();
      if (permStatus.location !== 'granted') {
        permStatus = await Geolocation.requestPermissions();
        if (permStatus.location !== 'granted') {
          if (showToastOnFail) {
            toast({ title: i18n.t("auto.g_0012", "위치 권한이 없어요"), variant: "destructive" });
          }
          return null;
        }
      }
    } else {
      // 웹: navigator.geolocation 지원 여부 확인
      if (!navigator.geolocation) {
        return null;
      }
      // 웹: Permissions API로 이미 거부됐으면 요청 없이 null 반환
      try {
        const perm = await navigator.permissions.query({ name: 'geolocation' });
        if (perm.state === 'denied') {
          // 사용자가 이미 거부한 상태 — 조용히 null 반환
          return null;
        }
      } catch {
        // Permissions API 미지원 브라우저는 그냥 진행
      }
    }

    const position: Position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000, // 30초 캐시 허용 (전력 절감)
    });

    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
  } catch (error: any) {
    // code 1 = PERMISSION_DENIED (사용자가 의도적으로 거부) — 에러가 아닌 정상 동작
    if (error?.code === 1 || error?.message?.toLowerCase().includes('denied')) {
      return null;
    }
    // 나머지 에러 (타임아웃 등)만 로그
    console.warn(i18n.t("auto.g_0356", "[GPS] 위치 가져오기 실패:"), error?.message || error);
    if (showToastOnFail) {
      toast({
        title: i18n.t("auto.g_0013", "위치를 가져올 수 없어요"),
        description: i18n.t("auto.g_0014", "잠시 후 다시 시도해주세요"),
        variant: "destructive",
      });
    }
    return null;
  }
};

