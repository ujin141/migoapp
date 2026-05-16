import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  esbuild: {
    // 프로덕션 빌드에서 console.log/debug 완전 제거 (번들 크기 절감 + 정보 보호)
    drop: mode === "production" ? ["console", "debugger"] : [],
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
    target: "es2020",           // 모던 브라우저: 더 나은 tree-shaking
    chunkSizeWarningLimit: 800,
    cssCodeSplit: true,
    reportCompressedSize: false, // 빌드 속도 개선
    rollupOptions: {
      output: {
        // 청크 파일명에 해시 포함 (캐시 버스팅)
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
}));
