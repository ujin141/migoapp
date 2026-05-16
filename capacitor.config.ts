import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lunaticsgroup.migo',
  appName: 'Migo',
  webDir: 'dist',
  server: {
    // Android에서 HTTPS 스킴 사용 (Mixed Content 방지 + Google Play 정책 준수)
    androidScheme: 'https',
    // iOS에서도 동일하게 적용
    iosScheme: 'capacitor',
    allowNavigation: [
      'supabase.co',
      '*.supabase.co',
      'maps.googleapis.com',
      '*.googleapis.com',
    ],
  },
  android: {
    // 빌드 타입 설정
    buildOptions: {
      keystorePath: 'release/migo-release.jks',
      keystoreAlias: 'migo',
    },
    // Android 상태바 / 내비게이션바 설정
    backgroundColor: '#09090b',
  },
  ios: {
    backgroundColor: '#09090b',
    contentInset: 'automatic',
    scrollEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#09090b',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    // ── Google AdMob ─────────────────────────────────────────────
    // iOS:     https://apps.admob.com → 앱 → 앱 설정 → 앱 ID
    // Android: 별도 android/app/src/main/AndroidManifest.xml에도 추가 필요
    AdMob: {
      appId: {
        ios: 'ca-app-pub-2237857753220220~5402641159',     // User provided App ID
        android: 'ca-app-pub-2237857753220220~5402641159', // User provided App ID
      },
    },
    Geolocation: {
      // iOS 위치 권한 메시지
    },
    CapacitorHttp: {
      enabled: false, // 기본 Fetch API 사용
    },
    Keyboard: {
      // 'none': WebView가 키보드에 의해 자동 리사이즈되지 않음
      // → useKeyboard 훅이 --kb-height CSS 변수로 직접 처리
      resize: 'none',
      resizeOnFullScreen: true,
      style: 'default', // 'dark' | 'light' | 'default'
    },
  },
};

export default config;
