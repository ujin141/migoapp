import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  esbuild: {
    drop: ["console", "debugger"],
  },
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // NOTE: Compression plugins disabled - .gz/.br files cause Android Duplicate resource errors
    // Web compression should be handled at CDN/server level (Vercel handles this automatically)
  ].filter(Boolean),
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    // 소스맵 비활성화 (번들 크기 절감 + API key 역추적 방지)
    sourcemap: false,
    // 압축 레벨 최대화
    minify: "esbuild",
    target: "es2018",
    rollupOptions: {
      output: {
        // 세밀한 코드 분할: 필요한 청크만 로드
        manualChunks: (id) => {
          // React 코어 (항상 가장 먼저 로드)
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) return "react-core";
          // Supabase — React 무관, 독립 패키지
          if (id.includes("node_modules/@supabase")) return "supabase";
          // OpenAI — React 무관, 독립 패키지
          if (id.includes("node_modules/openai")) return "openai";
          // i18n 번역 데이터 — React 무관, 매우 큼
          if (id.includes("/i18n/locales/")) return "i18n-locales";
          if (id.includes("node_modules/i18next")) return "i18n-core";
          // NOTE: React에 의존하는 패키지(framer-motion, radix-ui, recharts, react-router 등)는
          // manualChunk 분리 시 react-core보다 먼저 로드되어 createContext/forwardRef 오류 발생.
          // Vite가 자동으로 lazy 청크 단위로 포함시키도록 여기서는 제외함.
        },
        // 청크 파일 이름에 콘텐츠 해시 추가 (캐시 버스팅)
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    // 큰 청크 경고 기준 (kb)
    chunkSizeWarningLimit: 1500,
    // CSS 코드 분할
    cssCodeSplit: true,
  },
}));
