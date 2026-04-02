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
              title: "위치권한없",
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
            title: "위치알수없",
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
        description: error.message || "위치알수없",
        variant: "destructive",
      });
    }
    return null;
  }
};
