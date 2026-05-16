import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Custom hook to handle App Tracking Transparency (ATT) on iOS.
 * Uses @capgo/capacitor-app-tracking-transparency plugin to show
 * the native iOS ATT permission dialog (required by Guideline 5.1.2i).
 *
 * - 앱 최초 실행 시 ATT 팝업을 표시합니다.
 * - iOS가 아닌 환경(Android, Web)에서는 아무 동작도 하지 않습니다.
 * - 이미 결정된 상태(authorized/denied)면 팝업을 다시 표시하지 않습니다.
 */
export function useATT() {
  useEffect(() => {
    async function requestTrackingPermission() {
      if (Capacitor.getPlatform() !== 'ios') return;

      try {
        const { AppTrackingTransparency } = await import(
          'capacitor-plugin-app-tracking-transparency'
        );

        // 현재 권한 상태 확인
        const { status } = await AppTrackingTransparency.getStatus();

        // 아직 결정되지 않은 경우에만 팝업 표시
        if (status === 'notDetermined') {
          await AppTrackingTransparency.requestPermission();
        }
      } catch (e) {
        // 플러그인 없거나 지원 안 하는 환경 — 조용히 무시
        console.warn('[ATT] AppTrackingTransparency not available:', e);
      }
    }

    // 앱 시작 후 3초 뒤에 호출하여 스플래시 화면(2초)과 겹쳐서 ATT 요청이 무시되는 문제 방지
    const timer = setTimeout(requestTrackingPermission, 3000);
    return () => clearTimeout(timer);
  }, []);
}
