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
    port: 8082,
    strictPort: true,
    hmr: { overlay: false },
    // SEC-XSS: 개발 서버 보안 헤더 추가
    // ⚠️ 프로덕션(Nginx/Cloudflare)에서도 동일 헤더를 서버 레벨에서 설정 필요
    headers: {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
    },
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
    // ── Capacitor Android WebView 흰 화면 수정 ──────────────────────
    // Vite가 생성하는 crossorigin 속성이 Capacitor 로컬 서버에서
    // CORS 오류를 일으켜 CSS/JS 로드 실패 → 흰 화면 발생
    {
      name: 'remove-crossorigin',
      transformIndexHtml(html: string) {
        return html.replace(/ crossorigin(="[^"]*")?/g, '');
      },
    },
  ].filter(Boolean),

  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },

  // ── 의존성 사전 번들 (콜드 스타트 단축) ────────────────────────
  optimizeDeps: {
    entries: ["index.html"],
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
    modulePreload: { polyfill: false }, // crossorigin 없는 preload
    target: "es2020",
    chunkSizeWarningLimit: 950,
    cssCodeSplit: true,
    reportCompressedSize: false,

    rollupOptions: {
      external: [],
      output: {
        // 청크 파일명에 contenthash 포함
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },

    },
  },
}));
