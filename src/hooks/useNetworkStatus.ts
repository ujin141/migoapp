/**
 * useNetworkStatus — 온/오프라인 상태 감지 훅
 * navigator.onLine + online/offline 이벤트 기반
 * Capacitor 환경(iOS) 포함 동작
 */
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import i18n from 'i18next';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine ?? true);

  useEffect(() => {
    let offlineToastShown = false;
    let offlineTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let onlineTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleOffline = () => {
      if (onlineTimeoutId) {
        clearTimeout(onlineTimeoutId);
        onlineTimeoutId = null;
      }
      
      // 1.5초 디바운스: 일시적인 신호 흔들림 시 토스트 노출 차단
      if (!offlineTimeoutId) {
        offlineTimeoutId = setTimeout(() => {
          setIsOnline(false);
          if (!offlineToastShown) {
            offlineToastShown = true;
            toast({
              title: i18n.t("network.offline", "No Internet Connection"),
              description: i18n.t("network.offlineDesc", "Connection will resume automatically when restored."),
              variant: "destructive",
              duration: 0, // 직접 닫기 전까지 유지
            });
          }
        }, 1500);
      }
    };

    const handleOnline = () => {
      if (offlineTimeoutId) {
        clearTimeout(offlineTimeoutId);
        offlineTimeoutId = null;
      }
      
      setIsOnline(true);

      // 이미 오프라인 토스트가 표시된 경우에만 온라인 복귀 알림을 500ms 디바운스 후 표시
      if (offlineToastShown && !onlineTimeoutId) {
        onlineTimeoutId = setTimeout(() => {
          offlineToastShown = false;
          toast({
            title: i18n.t("network.online", "Back Online ✅"),
            duration: 3000,
          });
        }, 500);
      } else if (!offlineToastShown) {
        offlineToastShown = false;
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      if (offlineTimeoutId) clearTimeout(offlineTimeoutId);
      if (onlineTimeoutId) clearTimeout(onlineTimeoutId);
    };
  }, []);

  return isOnline;
}
