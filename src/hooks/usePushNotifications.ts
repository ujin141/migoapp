import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/lib/supabaseClient";

/**
 * usePushNotifications
 * iOS / Android 네이티브 푸시 알림 등록 훅
 *
 * 동작:
 * 1. 푸시 권한 요청
 * 2. APNs/FCM 토큰을 profiles.fcm_token에 저장
 * 3. 포그라운드 수신 → onForegroundNotif 콜백 호출
 * 4. 알림 탭(딥링크) → onNotificationAction 콜백 호출
 */
export const usePushNotifications = (
  userId: string | undefined,
  onForegroundNotif?: (title: string, body: string, data?: Record<string, string>) => void,
  onNotificationAction?: (data: Record<string, string>) => void,
) => {
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!userId) return;
    // 웹(브라우저)에서는 네이티브 푸시 미지원 — Notification API는 notificationService.ts 참조
    if (!Capacitor.isNativePlatform()) return;
    // 이미 등록됐으면 재등록 방지
    if (registeredRef.current) return;

    let cleanup: (() => void) | null = null;

    const registerPush = async () => {
      try {
        // ── 권한 확인 ──
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === "prompt") {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== "granted") {
          console.log("[Push] 권한 거부됨");
          return;
        }

        // ── 리스너 등록 ──

        // 토큰 등록 완료 → DB 저장
        await PushNotifications.addListener("registration", async (token) => {
          try {
            await supabase
              .from("profiles")
              .update({ fcm_token: token.value })
              .eq("id", userId);
          } catch {
            // 토큰 저장 실패는 조용히 무시 (앱 동작에 영향 없음)
          }
        });

        // 등록 에러
        await PushNotifications.addListener("registrationError", (_err) => {
          // 보안: 에러 상세 노출 금지
          console.warn("[Push] 등록 실패");
        });

        // 포그라운드 수신 (앱이 켜져 있을 때)
        await PushNotifications.addListener("pushNotificationReceived", (notification) => {
          const title = notification.title ?? "";
          const body = notification.body ?? "";
          const data = (notification.data ?? {}) as Record<string, string>;
          onForegroundNotif?.(title, body, data);
        });

        // 알림 탭 (백그라운드/종료 상태에서 탭)
        await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
          const data = (action.notification.data ?? {}) as Record<string, string>;
          onNotificationAction?.(data);
        });

        // APNs / FCM 에 등록 요청
        await PushNotifications.register();
        registeredRef.current = true;

        cleanup = () => {
          PushNotifications.removeAllListeners();
          registeredRef.current = false;
        };
      } catch {
        console.warn("[Push] 초기화 실패");
      }
    };

    registerPush();

    return () => {
      cleanup?.();
    };
  }, [userId]);
};
