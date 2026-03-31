import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// 🚨 Supabase 내부 버그로 인해 다중 탭/핫 리로드 진행 시 던져지는
// 무해한 Lock 탈취 에러를 콘솔에 출력되지 않도록 차단합니다.
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && typeof event.reason.message === 'string') {
    if (event.reason.message.includes('was released because another request stole it')) {
      event.preventDefault(); // 콘솔 출력 완벽 차단
    }
  }
});

createRoot(document.getElementById("root")!).render(<App />);
