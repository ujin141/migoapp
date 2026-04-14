/**
 * useNetworkStatus — 온/오프라인 상태 감지 훅
 * navigator.onLine + online/offline 이벤트 기반
 * Capacitor 환경(iOS) 포함 동작
 */
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import i18n from "@/i18n";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine ?? true);

  useEffect(() => {
    let offlineToastShown = false;

    const handleOffline = () => {
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
    };

    const handleOnline = () => {
      setIsOnline(true);
      offlineToastShown = false;
      toast({
        title: i18n.t("network.online", "Back Online ✅"),
        duration: 3000,
      });
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return isOnline;
}
