import i18n from "@/i18n";
/**
 * useGeoDistance - 사용자 현재 위치 + Haversine 거리 계산 훅
 * 앱 전역에서 사용 가능한 위치 기반 거리 계산 유틸
 */
import { useState, useEffect, useCallback } from "react";
interface GeoPosition {
  lat: number;
  lng: number;
}

// Haversine 공식으로 두 좌표 간 거리 계산 (km)
export const haversineKm = (a: GeoPosition, b: GeoPosition): number => {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const sin = Math.sin;
  const cos = Math.cos;
  const h = sin(dLat / 2) ** 2 + cos(a.lat * Math.PI / 180) * cos(b.lat * Math.PI / 180) * sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
};

// 거리 → 사람이 읽기 쉬운 라벨
export const distanceLabel = (km: number): string => {
  if (km < 0.1) return i18n.t("auto.z_autoz50m\uC774\uB0B4_1108");
  if (km < 0.3) return `${Math.round(km * 1000)}m`;
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
};

// 거리 → 이동 시간 텍스트
export const travelTimeLabel = (km: number): string => {
  if (km < 0.3) return i18n.t("auto.z_autoz\uB3C4\uBCF43\uBD841_1109");
  if (km < 1) {
    return i18n.t("dist.walk", {
      time: Math.round(km / 0.08),
      defaultValue: `Walk ${Math.round(km / 0.08)} min 🚶`
    });
  }
  if (km < 3) {
    return i18n.t("dist.bike", {
      time: Math.round(km / 0.25),
      defaultValue: `Bike ${Math.round(km / 0.25)} min 🚴`
    });
  }
  if (km < 10) {
    return i18n.t("dist.subway", {
      time: Math.round(km / 0.5),
      defaultValue: `Subway ${Math.round(km / 0.5)} min 🚇`
    });
  }
  return i18n.t("dist.car", {
    time: Math.round(km / 0.7),
    defaultValue: `Drive ${Math.round(km / 0.7)} min 🚗`
  });
};

// 거리 → 색상 (만날 수 있는가 신호등)
export const distanceColor = (km: number): string => {
  if (km < 1) return "#10b981"; // 초록 - 즉시 가능
  if (km < 5) return "#f59e0b"; // 노랑 - 가까운 편
  if (km < 15) return "#f97316"; // 주황 - 이동 필요
  return "#6b7280"; // 회색 - 멀다
};

// 거리 → 만남 가능 여부 텍스트
export const meetabilityLabel = (km: number): string => {
  if (km < 1) return i18n.t("auto.z_autoz\uC9C0\uAE08\uB2F9\uC7A5\uB9CC_1114");
  if (km < 5) return i18n.t("auto.z_autoz\uAC00\uAE4C\uC6B4\uAC70\uB9AC_1115");
  if (km < 15) return i18n.t("auto.z_autoz\uC774\uB3D9\uD558\uBA74\uB9CC_1116");
  return i18n.t("auto.z_autoz\uC880\uBA40\uC9C0\uB9CC\uB9CC_1117");
};

// 중간 지점 계산
export const getMidpoint = (a: GeoPosition, b: GeoPosition): GeoPosition => ({
  lat: (a.lat + b.lat) / 2,
  lng: (a.lng + b.lng) / 2
});

// Google Maps URL 생성
export const googleMapsUrl = (a: GeoPosition, b: GeoPosition): string => `https://www.google.com/maps/dir/${a.lat},${a.lng}/${b.lat},${b.lng}`;

// 중간 지점 네이버지도 URL
export const naverMidpointUrl = (mid: GeoPosition): string => `https://map.naver.com/v5/search/%EA%B7%BC%EC%B2%98%EC%B9%B4%ED%8E%98?c=${mid.lng},${mid.lat},15,0,0,0,dh`;

// ── 훅 ──────────────────────────────────────────────
const useGeoDistance = () => {
  const [myPos, setMyPos] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError(i18n.t("auto.z_autoz\uC774\uBE0C\uB77C\uC6B0\uC800_1118"));
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(pos => {
      setMyPos({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      });
      setLoading(false);
    }, err => {
      setError(err.message);
      setLoading(false);
      // 위치 권한 거부 시 서울 중심 fallback (데모용)
      setMyPos({
        lat: 37.5665,
        lng: 126.9780
      });
    }, {
      enableHighAccuracy: true,
      timeout: 8000
    });
  }, []);
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);
  const distanceTo = useCallback((target: GeoPosition): number | null => {
    if (!myPos) return null;
    return haversineKm(myPos, target);
  }, [myPos]);
  return {
    myPos,
    error,
    loading,
    distanceTo,
    requestLocation
  };
};
export default useGeoDistance;