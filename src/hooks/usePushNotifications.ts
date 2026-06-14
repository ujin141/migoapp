import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { FCM } from "@capacitor-community/fcm";
import { supabase } from "@/lib/supabaseClient";

/**
 * usePushNotifications
 * iOS / Android 네이티브 푸시 알림 등록 훅
 */
export const usePushNotifications = (
  userId: string | undefined,
  onForegroundNotif?: (title: string, body: string, data?: Record<string, string>) => void,
  onNotificationAction?: (data: Record<string, string>) => void,
) => {
  const registeredRef = useRef(false);
  
  const onForegroundNotifRef = useRef(onForegroundNotif);
  const onNotificationActionRef = useRef(onNotificationAction);

  useEffect(() => {
    onForegroundNotifRef.current = onForegroundNotif;
    onNotificationActionRef.current = onNotificationAction;
  }, [onForegroundNotif, onNotificationAction]);

  useEffect(() => {
    if (!userId) return;
    if (!Capacitor.isNativePlatform()) return;
    if (registeredRef.current) return;

    let isObsolete = false;

    const registerPush = async () => {
      try {
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === "prompt") {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== "granted" || isObsolete) {
          console.log("[Push] 권한 거부됨 또는 중단됨");
          return;
        }

        // Android 8.0+ 대응: 푸시 채널 생성 (배너 노출 및 소리 재생 강제 설정)
        if (Capacitor.getPlatform() === 'android') {
          try {
            await PushNotifications.createChannel({
              id: 'migo-notifications',
              name: 'Migo Notifications',
              description: 'General notifications from Migo',
              importance: 5, // IMPORTANCE_HIGH (배너 팝업)
              visibility: 1, // VISIBILITY_PUBLIC
              sound: 'default',
              vibration: true,
            });
            console.log("[Push] Android 알림 채널 생성 완료");
          } catch (channelErr) {
            console.warn("[Push] Android 알림 채널 생성 실패:", channelErr);
          }
        }

        await PushNotifications.addListener("registration", async (token) => {
          if (isObsolete) return;
          try {
            let finalToken = token.value;
            if (Capacitor.getPlatform() === 'ios') {
              const fcmTokenResult = await FCM.getToken();
              finalToken = fcmTokenResult.token;
            }

            await supabase
              .from("profiles")
              .update({ fcm_token: finalToken })
              .eq("id", userId);
          } catch {
          }
        });

        await PushNotifications.addListener("registrationError", (_err) => {
          if (isObsolete) return;
          console.warn("[Push] 등록 실패");
        });

        await PushNotifications.addListener("pushNotificationReceived", (notification) => {
          if (isObsolete) return;
          const title = notification.title ?? "";
          const body = notification.body ?? "";
          const data = (notification.data ?? {}) as Record<string, string>;
          onForegroundNotifRef.current?.(title, body, data);
        });

        await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
          if (isObsolete) return;
          const data = (action.notification.data ?? {}) as Record<string, string>;
          onNotificationActionRef.current?.(data);
        });

        if (!isObsolete) {
          await PushNotifications.register();
          registeredRef.current = true;
        }
      } catch {
        if (!isObsolete) console.warn("[Push] 초기화 실패");
      }
    };

    registerPush();

    return () => {
      isObsolete = true;
      if (registeredRef.current) {
        PushNotifications.removeAllListeners();
        registeredRef.current = false;
      }
    };
  }, [userId]);
};
