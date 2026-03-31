import i18n from "@/i18n";
/**
 * notificationService.ts
 * Web Push Notification — 매치/메시지/그룹 알림
 */

const VAPID_PUBLIC = ""; // Capacitor 앱이나 실제 배포 시 설정

/** 브라우저 알림 권한 요청 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const perm = await Notification.requestPermission();
  return perm === "granted";
}

/** 즉시 알림 표시 (로컬) */
export function showLocalNotification(title: string, body: string, iconPath = "/pwa-192x192.png") {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: iconPath,
      badge: iconPath,
      tag: "migo-notification",
      silent: false
    });
  } catch {/* 구형 브라우저 무시 */}
}

/** 매치 알림 */
export function notifyMatch(matchedName: string) {
  showLocalNotification(i18n.t("auto.z_autoz매칭성공_1106"), i18n.t("notif.matchSuccess", {
    name: matchedName,
    defaultValue: `You matched with {{name}}! Start chatting now.`
  }));
}

/** 새 메시지 알림 */
export function notifyMessage(senderName: string, preview: string) {
  showLocalNotification(`💬 ${senderName}`, preview.length > 50 ? preview.slice(0, 50) + "…" : preview);
}

/** 그룹 새 멤버 알림 */
export function notifyGroupJoin(groupTitle: string, memberName: string) {
  showLocalNotification(i18n.t("auto.z_autoz새멤버왔_1108"), i18n.t("notif.groupJoin", {
    name: memberName,
    title: groupTitle,
    defaultValue: `{{name}} joined '{{title}}'!`
  }));
}

/** 스트릭 리마인더 (오후 8시 체크 후 미접속 시) */
export function notifyStreakReminder(currentStreak: number) {
  if (currentStreak < 1) return;
  showLocalNotification(i18n.t("auto.z_스트릭이끊어질위기_1072"), i18n.t("notif.streak", {
    streak: currentStreak,
    defaultValue: `You're on a {{streak}}-day streak! Check in on Migo today.`
  }));
}