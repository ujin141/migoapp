import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "430px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        "2xl": "1.5rem",
        xl: "1rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "match-pop": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "match-pop": "match-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "slide-up": "slide-up 0.4s ease-out",
        "pulse-ring": "pulse-ring 1.5s ease-out infinite",
        "float": "float 3s ease-in-out infinite",
      },
    },
    // ── Safe Area 전용 spacing 제거 — index.css @layer utilities에서 일괄 관리
  },
  plugins: [
    require("tailwindcss-animate"),
    // Safe area inset 유틸리티 플러그인
    // 사용법: pt-safe, pb-safe, pl-safe, pr-safe, mt-safe, mb-safe 등
    // Safe area inset 유틸리티 플러그인 — index.css와 일치하도록 동기화
    ({ addUtilities }: { addUtilities: (utils: Record<string, Record<string, string>>) => void }) => {
      addUtilities({
        // 상단: 노치/펀치홀/Dynamic Island 대응 (32px 최소로 간주 02)
        ".pt-safe":         { paddingTop:    "max(env(safe-area-inset-top, 0px), 32px)" },
        ".pt-safe-exact":   { paddingTop:    "env(safe-area-inset-top, 0px)" },
        // 하단: 순수 기기 safe area만 (네비바 없는 풀스크린용)
        ".pb-safe":         { paddingBottom: "env(safe-area-inset-bottom, 0px)" },
        // 하단: 최소 1rem 보장 (통전 로그인 버튼용)
        ".pb-safe-or":      { paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" },
        ".pl-safe":         { paddingLeft:   "env(safe-area-inset-left, 0px)" },
        ".pr-safe":         { paddingRight:  "env(safe-area-inset-right, 0px)" },
        ".mt-safe":         { marginTop:     "max(env(safe-area-inset-top, 0px), 32px)" },
        ".mb-safe":         { marginBottom:  "env(safe-area-inset-bottom, 0px)" },
        ".ml-safe":         { marginLeft:    "env(safe-area-inset-left, 0px)" },
        ".mr-safe":         { marginRight:   "env(safe-area-inset-right, 0px)" },
        // pt-safe 보제금 버전
        ".pt-safe-min":     { paddingTop:    "max(12px, env(safe-area-inset-top, 0px))" },
        ".pb-safe-min":     { paddingBottom: "max(16px, env(safe-area-inset-bottom, 0px))" },
        // 전체 높이 (safe area 제외)
        ".h-safe-screen":   { height: "calc(100svh - env(safe-area-inset-top) - env(safe-area-inset-bottom))" },
        ".min-h-safe-screen": { minHeight: "calc(100svh - env(safe-area-inset-top) - env(safe-area-inset-bottom))" },
      });
    },
  ],
} satisfies Config;
