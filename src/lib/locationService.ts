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
            toast({
              title: i18n.t("auto.z_autoz위치권한없_325", { defaultValue: "위치 권한이 없습니다." }),
              variant: "destructive",
            });
          }
          return null;
        }
      }
    } else {
      if (!navigator.geolocation) {
        if (showToastOnFail) {
          toast({
            title: i18n.t("auto.z_autoz위치알수없_324", { defaultValue: "이 브라우저에서는 위치 기능을 지원하지 않습니다." }),
            variant: "destructive",
          });
        }
        return null; // Not Supported
      }
    }

    const position: Position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
  } catch (error: any) {
    console.error("[GPS Error]", error);
    if (showToastOnFail) {
      toast({
        title: "GPS Error",
        description: error.message || i18n.t("auto.z_autoz위치알수없_324", { defaultValue: "정확한 위치를 찾을 수 없습니다." }),
        variant: "destructive",
      });
    }
    return null;
  }
};
