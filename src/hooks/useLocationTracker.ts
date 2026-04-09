import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Location {
  lat: number;
  lng: number;
}

const DISTANCE_THRESHOLD = 0.01; // 10미터 (km 단위)
const TIME_THRESHOLD = 10000; // 10초 (가만히 있어도 10초마다 갱신)

// Haversine formula (km 리턴)
const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371; 
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useLocationTracker = (userId: string | undefined, enabled: boolean = true) => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  
  const lastSentRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!userId || !enabled) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    // Initialize Broadcast Channel
    if (!channelRef.current) {
      channelRef.current = supabase.channel("public-map");
      channelRef.current.subscribe();
    }

    const broadcastLocation = (lat: number, lng: number) => {
      if (!channelRef.current) return;
      // 채널이 joined 상태일 때만 send (미연결 시 REST fallback 경고 방지)
      if ((channelRef.current as any).state === 'joined') {
        channelRef.current.send({
          type: 'broadcast',
          event: 'location_update',
          payload: {
            user_id: userId,
            lat,
            lng,
            timestamp: Date.now()
          }
        });
      }
      lastSentRef.current = { lat, lng, time: Date.now() };
    };

    let watchId: number;

    const startTracking = () => {
      if (!navigator.geolocation) return;
      
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          setCurrentLocation({ lat, lng });

          const now = Date.now();
          const last = lastSentRef.current;

          if (!last) {
            // 최초 접속 시 무조건 쏨
            broadcastLocation(lat, lng);
            return;
          }

          const distance = getDistance(last.lat, last.lng, lat, lng);
          const timeElapsed = now - last.time;

          // 거리 제한(10m) 또는 시간 제한(10s) 중 하나라도 초과하면 쏨 (DB 비용 최적화의 핵심)
          if (distance >= DISTANCE_THRESHOLD || timeElapsed >= TIME_THRESHOLD) {
            broadcastLocation(lat, lng);
          }
        },
        (error) => {
          console.error("WatchPosition error:", error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000,
        }
      );
    };

    startTracking();

    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, enabled]);

  return currentLocation;
};
