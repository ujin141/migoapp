/**
 * useKeyboard
 * ───────────
 * Capacitor Keyboard 훅.
 * 키보드 높이를 CSS 변수 --kb-height 에 주입하여
 * 채팅 입력창 등이 키보드에 가려지지 않도록 처리.
 *
 * 네이티브 환경에서만 Capacitor Keyboard API를 사용하며,
 * 웹에서는 visualViewport API fallback을 사용.
 */

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

function setKbHeight(px: number) {
  document.documentElement.style.setProperty("--kb-height", `${px}px`);
}

export function useKeyboard() {
  useEffect(() => {
    // CSS 변수 초기화
    setKbHeight(0);

    if (Capacitor.isNativePlatform()) {
      // ── 네이티브: @capacitor/keyboard API 사용 ──
      let showListener: any;
      let hideListener: any;

      (async () => {
        try {
          const { Keyboard } = await import("@capacitor/keyboard");

          showListener = await Keyboard.addListener("keyboardWillShow", (info) => {
            setKbHeight(info.keyboardHeight);
          });

          hideListener = await Keyboard.addListener("keyboardWillHide", () => {
            setKbHeight(0);
          });
        } catch {
          // Keyboard 플러그인 미지원 환경 fallback
        }
      })();

      return () => {
        showListener?.remove?.();
        hideListener?.remove?.();
      };
    } else {
      // ── 웹: visualViewport API fallback ──
      const vv = window.visualViewport;
      if (!vv) return;

      const onResize = () => {
        const diff = window.innerHeight - vv.height;
        setKbHeight(diff > 50 ? diff : 0); // 50px 이하는 키보드 아님으로 판단
      };

      vv.addEventListener("resize", onResize);
      return () => vv.removeEventListener("resize", onResize);
    }
  }, []);
}
