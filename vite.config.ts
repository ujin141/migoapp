import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "./" : "/",

  esbuild: {
    // 프로덕션 빌드: console.* + debugger 완전 제거
    drop: mode === "production" ? ["console", "debugger"] : [],
    legalComments: "none",
  },

  server: {
    host: "0.0.0.0",
    port: 8080,
    hmr: { overlay: false },
    watch: {
      // android/ios 빌드 산출물이 HMR 무한루프를 유발하므로 감시 제외
      ignored: [
        "**/android/**",
        "**/ios/**",
        "**/.git/**",
        "**/node_modules/**",
      ],
    },
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },

  // ── 의존성 사전 번들 (콜드 스타트 단축) ────────────────────────
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "framer-motion",
      "@supabase/supabase-js",
      "i18next",
      "react-i18next",
      "lucide-react",
      "date-fns",
    ],
    exclude: ["@capacitor/android", "@capacitor/ios"],
  },

  build: {
    sourcemap: false,
    minify: "esbuild",
    target: "es2020",
    chunkSizeWarningLimit: 600,
    cssCodeSplit: true,
    reportCompressedSize: false,

    rollupOptions: {
      output: {
        // ── 수동 청크 분할: Windows(\) + Mac(/) 경로 모두 호환 ──
        // 정규식으로 node_modules 매칭 (경로 구분자 무관)
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/node_modules[\\/](react|react-dom)[\\/]/.test(id)) return "vendor-react";
          if (/node_modules[\\/]react-router/.test(id)) return "vendor-router";
          if (/node_modules[\\/]@supabase/.test(id)) return "vendor-supabase";
          if (/node_modules[\\/]framer-motion/.test(id)) return "vendor-motion";
          if (/node_modules[\\/](i18next|react-i18next)/.test(id)) return "vendor-i18n";
          if (/node_modules[\\/](recharts|d3-)/.test(id)) return "vendor-charts";
          if (/node_modules[\\/]lucide-react/.test(id)) return "vendor-icons";
          return "vendor-misc";
        },

        // 청크·에셋 파일명에 contenthash 포함 → CDN/브라우저 영구 캐시
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },

      // treeshake: moduleSideEffects 기본값(true) 유지 — false 시 빈 청크 발생
      treeshake: {
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
      },
    },
  },
}));
