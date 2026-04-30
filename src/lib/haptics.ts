/**
 * haptics.ts
 * ──────────
 * Capacitor Haptics 래퍼.
 * 네이티브 환경에서만 동작하고, 웹/브라우저에서는 no-op.
 */

import { Capacitor } from "@capacitor/core";

let hapticsModule: typeof import("@capacitor/haptics") | null = null;

async function getHaptics() {
  if (!Capacitor.isNativePlatform()) return null;
  if (!hapticsModule) {
    hapticsModule = await import("@capacitor/haptics");
  }
  return hapticsModule;
}

export type HapticStyle =
  | "light"     // 가벼운 탭 (탭바 이동, 일반 버튼)
  | "medium"    // 중간 (전송, 확인)
  | "heavy"     // 강한 (삭제, 경고)
  | "success"   // 성공 패턴 (구매, 인증 완료)
  | "warning"   // 경고 패턴 (신고, 주의 액션)
  | "error";    // 에러 패턴 (실패, 오류)

/**
 * 햅틱 피드백 트리거
 * @param style - 햅틱 스타일
 */
export async function triggerHaptic(style: HapticStyle): Promise<void> {
  try {
    const h = await getHaptics();
    if (!h) return;

    const { Haptics, ImpactStyle, NotificationType } = h;

    switch (style) {
      case "light":
        await Haptics.impact({ style: ImpactStyle.Light });
        break;
      case "medium":
        await Haptics.impact({ style: ImpactStyle.Medium });
        break;
      case "heavy":
        await Haptics.impact({ style: ImpactStyle.Heavy });
        break;
      case "success":
        await Haptics.notification({ type: NotificationType.Success });
        break;
      case "warning":
        await Haptics.notification({ type: NotificationType.Warning });
        break;
      case "error":
        await Haptics.notification({ type: NotificationType.Error });
        break;
    }
  } catch {
    // 햅틱 실패는 무시 (비필수 기능)
  }
}

/**
 * 선택 변경 햅틱 (스크롤 피커, 토글 등)
 */
export async function triggerSelectionHaptic(): Promise<void> {
  try {
    const h = await getHaptics();
    if (!h) return;
    await h.Haptics.selectionStart();
    await h.Haptics.selectionEnd();
  } catch {
    // 무시
  }
}
