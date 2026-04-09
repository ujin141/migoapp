import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  esbuild: {
    drop: ["console", "debugger"],
    // 불필요한 주석 제거
    legalComments: "none",
  },
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  // 의존성 사전 번들 최적화 (콜드 스타트 속도 개선)
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "framer-motion",
      "@supabase/supabase-js",
      "i18next",
      "react-i18next",
    ],
    exclude: ["@capacitor/android", "@capacitor/ios"],
  },
  build: {
    sourcemap: false,
    minify: "esbuild",
    // es2020: 더 나은 tree-shaking + 모던 브라우저 지원
    // target: "es2020",
    // chunking strategies and rollupOptions removed to let Vite handle it natively
    // to fix createContext undefined chunk issues.
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    // 롤업 빌드 병렬화
    reportCompressedSize: false, // 빌드 속도 개선 (크기 보고 생략)
  },
}));
