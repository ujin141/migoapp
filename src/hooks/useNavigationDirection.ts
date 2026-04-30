/**
 * useNavigationDirection
 * ──────────────────────
 * 네이티브 iOS/Android처럼 페이지 전환 방향을 추적합니다.
 *  - 'push'  : 새 화면으로 이동 (오른쪽에서 슬라이드 인)
 *  - 'pop'   : 뒤로가기 (왼쪽으로 슬라이드 아웃)
 *  - 'tab'   : 탭바 전환 (fade only, 슬라이드 없음)
 */

import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export type NavDirection = "push" | "pop" | "tab";

const TAB_PATHS = ["/", "/discover", "/map", "/chat", "/profile"];

// 전역 ref로 방향 공유 (Context 없이 단순화)
let _direction: NavDirection = "push";
export const getNavDirection = () => _direction;

export function useNavigationDirection() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const prevPathRef = useRef<string>(location.pathname);

  useEffect(() => {
    const prevPath = prevPathRef.current;
    const nextPath = location.pathname;

    const prevIsTab = TAB_PATHS.includes(prevPath);
    const nextIsTab = TAB_PATHS.includes(nextPath);

    if (prevIsTab && nextIsTab) {
      _direction = "tab";
    } else if (navigationType === "POP") {
      _direction = "pop";
    } else {
      _direction = "push";
    }

    prevPathRef.current = nextPath;
  }, [location.pathname, navigationType]);

  return _direction;
}
