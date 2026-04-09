import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
// import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/lib/supabaseClient";

export const usePushNotifications = (userId: string | undefined) => {
  useEffect(() => {
    /*
    if (!userId) return;
    // 브라우저에서는 동작하지 않음 (오직 네이티브 iOS/Android)
    if (!Capacitor.isNativePlatform()) return;

    let isRegistered = false;

    const registerPush = async () => {
      try {
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === "prompt") {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== "granted") {
          console.log("User denied push notification permissions");
          return;
        }

        // Add listeners
        await PushNotifications.addListener("registration", async (token) => {
          console.log("FCM Token:", token.value);
          // DB에 토큰 저장
          await supabase
            .from("profiles")
            .update({ fcm_token: token.value })
            .eq("id", userId);
        });

        await PushNotifications.addListener("registrationError", (err) => {
          console.error("Registration error:", err.error);
        });

        await PushNotifications.addListener("pushNotificationReceived", (notification) => {
          console.log("Push received:", notification);
          // Foreground 앱 활성화 중일때의 동작 (이미 in-app notification이 뜨므로 무시하거나 별도 처리 가능)
        });

        await PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
          console.log("Push action performed:", notification.actionId);
          // 앱 꺼져 있을 때 푸시 터치해서 들어온 경우 -> 특정 채팅방 리다이렉트 등 딥링킹 로직
          const data = notification.notification.data;
          // 예: if (data.url) window.location.href = data.url;
        });

        // Register with Apple / Google
        await PushNotifications.register();
        isRegistered = true;
      } catch (error) {
        console.error("Failed to setup push notifications", error);
      }
    };

    registerPush();

    return () => {
      if (isRegistered) {
        PushNotifications.removeAllListeners();
      }
    };
    */
  }, [userId]);
};
