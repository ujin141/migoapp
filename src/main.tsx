import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// HashRouter 호환: 일반 주소로 직접 접속 시 해시 경로로 강제 전환
if (window.location.pathname !== '/' && !window.location.hash) {
  let targetPath = window.location.pathname;
  if (targetPath === '/privacy-policy') targetPath = '/privacy';
  window.location.replace('/#' + targetPath + window.location.search);
}

// ── 전역 Promise 에러 핸들러 ──────────────────────────────────────
window.addEventListener('unhandledrejection', (event) => {
  const msg: string = event.reason?.message ?? String(event.reason ?? '');

  // 1. Supabase Lock 탈취 에러 — 무해함, 콘솔 차단
  if (msg.includes('was released because another request stole it')) {
    event.preventDefault();
    return;
  }

  // 2. Network 에러 — 재시도 로직이 있으므로 콘솔 경고만
  if (
    msg.includes('Failed to fetch') ||
    msg.includes('Load failed') ||
    msg.includes('NetworkError')
  ) {
    event.preventDefault();
    console.warn('[Network] unhandledrejection (network error, auto-retry expected):', msg);
    return;
  }

  // 3. Lazy chunk 로드 실패 — 강제 새로고침으로 복구
  if (msg.includes('Failed to load') && msg.includes('chunk')) {
    event.preventDefault();
    const reloaded = sessionStorage.getItem('chunk_reload_global');
    if (!reloaded) {
      sessionStorage.setItem('chunk_reload_global', '1');
      window.location.reload();
    } else {
      sessionStorage.removeItem('chunk_reload_global');
      console.error('[Chunk] Critical chunk load failure after retry:', msg);
    }
    return;
  }

  // 4. 나머지 — 개발 환경에서만 로깅 (프로덕션 노이즈 방지)
  if (import.meta.env.DEV) {
    console.error('[unhandledrejection]', event.reason);
  }
});

// ── 전역 동기 에러 핸들러 ─────────────────────────────────────────
window.addEventListener('error', (event) => {
  // 이미지/폰트 리소스 로드 실패는 ErrorBoundary로 가지 않음 — 무시
  if (event.target instanceof HTMLImageElement || event.target instanceof HTMLLinkElement) {
    return;
  }
  if (import.meta.env.DEV) {
    console.error('[window.onerror]', event.error ?? event.message);
  }
});

import ErrorBoundary from "./components/ErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
