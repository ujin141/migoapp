import { useTranslation } from "react-i18next";
import { lazy, Suspense, useEffect } from "react";

// ── Stale chunk 방어: dynamic import 실패 시 한 번만 강제 새로고침 ─
const lazyWithRetry = (factory: () => Promise<{ default: React.ComponentType<any> }>) =>
  lazy(() =>
    factory().catch((err) => {
      // 이미 한 번 새로고침을 시도했으면 그냥 에러 throw (무한루프 방지)
      const reloaded = sessionStorage.getItem("chunk_reload");
      if (!reloaded) {
        sessionStorage.setItem("chunk_reload", "1");
        window.location.reload();
        // reload 후 이 Promise는 어차피 버려지므로 더미 반환
        return new Promise(() => {}) as any;
      }
      sessionStorage.removeItem("chunk_reload");
      throw err;
    })
  );
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav from "./components/BottomNav";
import TutorialOverlay, { useTutorial } from "./components/TutorialOverlay";
import { ChatProvider } from "./context/ChatContext";
import { NotificationProvider } from "./context/NotificationContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import { supabase } from "@/lib/supabaseClient";
import i18n from "./i18n";

// ── 즉시 로드 (첫 화면) ────────────────────────────────────────────
import SplashPage from "./pages/SplashPage";

// ── Lazy loading: 초기 번들 크기 절감 + 라우트별 코드 분할 ────────
const OnboardingPage    = lazyWithRetry(() => import("./pages/OnboardingPage"));
const LoginPage         = lazyWithRetry(() => import("./pages/LoginPage"));
const Index             = lazyWithRetry(() => import("./pages/Index"));
const DiscoverPage      = lazyWithRetry(() => import("./pages/DiscoverPage"));
const MapPage           = lazyWithRetry(() => import("./pages/MapPage"));
const ChatPage          = lazyWithRetry(() => import("./pages/ChatPage"));
const ProfilePage       = lazyWithRetry(() => import("./pages/ProfilePage"));
const NotificationPage  = lazyWithRetry(() => import("./pages/NotificationPage"));
const CreateTripPage    = lazyWithRetry(() => import("./pages/CreateTripPage"));
const VerificationPage  = lazyWithRetry(() => import("./pages/VerificationPage"));
const ProfileSetupPage  = lazyWithRetry(() => import("./pages/ProfileSetupPage"));
const TripCalendarPage  = lazyWithRetry(() => import("./pages/TripCalendarPage"));
const MeetReviewPage    = lazyWithRetry(() => import("./pages/MeetReviewPage"));
const MarketplacePage   = lazyWithRetry(() => import("./pages/MarketplacePage"));
const VoiceCallPage     = lazyWithRetry(() => import("./pages/VoiceCallPage"));
const AdminPage         = lazyWithRetry(() => import("./pages/AdminPage"));
const TermsPage         = lazyWithRetry(() => import("./pages/TermsPage"));
const PrivacyPage       = lazyWithRetry(() => import("./pages/PrivacyPage"));
const AuthCallbackPage  = lazyWithRetry(() => import("./pages/AuthCallbackPage"));
const DownloadPage      = lazyWithRetry(() => import("./pages/DownloadPage"));
const SafetyCheckInPage = lazyWithRetry(() => import("./pages/SafetyCheckInPage"));
const ShopPage          = lazyWithRetry(() => import("./pages/ShopPage"));
const NearbyPage        = lazyWithRetry(() => import("./pages/NearbyPage"));
const TripReviewPage    = lazyWithRetry(() => import("./pages/TripReviewPage"));
const NotFound          = lazyWithRetry(() => import("./pages/NotFound"));

// ── QueryClient: 캐싱 + 재시도 설정 ──────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5분: 실시간성 밸런스
      gcTime:    30 * 60 * 1000,      // 30분: 캐시 유지
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: "online",          // 오프라인 시 불필요 retry 제외
    },
    mutations: {
      retry: 0,
      networkMode: "online",
    },
  },
});

// ── 페이지 로딩 스피너 ───────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const hideNavRoutes = ["/create-trip", "/splash", "/onboarding", "/login", "/verification", "/profile-setup", "/trip-calendar", "/meet-review", "/marketplace", "/voice-call", "/admin", "/terms", "/privacy", "/auth/callback", "/download", "/safety", "/shop", "/nearby", "/trip-review"];

const pageVariants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.18, ease: "easeOut" } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.12 } },
};

const AppContent = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const showNav = !hideNavRoutes.includes(location.pathname);
  const isAdmin = location.pathname.startsWith("/admin");
  const noTutorialRoutes = ["/splash", "/onboarding", "/login", "/verification", "/profile-setup"];
  const showTutorial = !noTutorialRoutes.some((r) => location.pathname.startsWith(r));
  const { show: tutorialVisible, complete: completeTutorial } = useTutorial();

  // ── 앱 시작 시 GPS 권한 요청 (안드로이드 네이티브 다이얼로그 트리거) ──
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        localStorage.setItem('migo_my_lat', String(lat));
        localStorage.setItem('migo_my_lng', String(lng));
        // 현재 유저 프로필 DB에도 저장 (매칭 거리 계산 즉시 반영)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          supabase.from('profiles').update({ lat, lng }).eq('id', user.id);
        }
      },
      () => {
        // 권한 거부 시 무시 (MapPage GPS OFF 토글로 재시도 가능)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // ── 앱 시작 시 언어 자동 감지 (네이티브 기기 언어 확실하게 연동) ──
  useEffect(() => {
    const initLanguage = async () => {
      // 1. 사용자가 수동으로 인앱 설정에서 바꾼 언어가 있다면 최우선 적용
      const savedLang = localStorage.getItem('migo-lang');
      if (savedLang) { 
        i18n.changeLanguage(savedLang); 
        return; 
      }
      
      // 2. 네이티브 기기 언어를 Capacitor 플러그인을 통해 정확히 가져오기
      let prefix = 'en';
      try {
        const { Device } = await import('@capacitor/device');
        const langResult = await Device.getLanguageCode();
        // 안드로이드는 보통 'ko', 'ent("auto.x4000")ko-KR' 형태로 반환
        prefix = langResult.value.split('-')[0].toLowerCase();
      } catch (e) {
        // 웹이나 플러그인 오류 시 fallback
        const raw = navigator.language || navigator.languages?.[0] || 'en';
        prefix = raw.split('-')[0].toLowerCase();
      }

      const supported = ['ko','en','ja','zh','es','fr','de','pt','id','vi','th','ar','hi','ru','tr','it','nl','pl','sv','da','no','fi','cs','ro','hu','el','bg','uk','he','bn','ta','te','kn','ml','gu','mr','pa','fa','ur','sw','zu','ca','hr','sk','sl','lv','lt','et','is'];
      i18n.changeLanguage(supported.includes(prefix) ? prefix : 'en');
    };
    
    initLanguage();
  }, []);

  // Admin: full-width, no bottom nav, no animation wrapper
  if (isAdmin) {
    return (
      <Suspense fallback={<PageLoader />}>
        <AdminPage />
      </Suspense>
    );
  }

  return (
    <div className="max-w-lg mx-auto relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Suspense fallback={<PageLoader />}>
            <Routes location={location}>
              <Route path="/splash"         element={<SplashPage />} />
              <Route path="/onboarding"     element={<OnboardingPage />} />
              <Route path="/login"          element={<LoginPage />} />
              <Route path="/"               element={<Index />} />
              <Route path="/discover"       element={<DiscoverPage />} />
              <Route path="/map"            element={<MapPage />} />
              <Route path="/chat"           element={<ChatPage />} />
              <Route path="/profile"        element={<ProfilePage />} />
              <Route path="/notifications"  element={<NotificationPage />} />
              <Route path="/create-trip"    element={<CreateTripPage />} />
              <Route path="/verification"   element={<VerificationPage />} />
              <Route path="/profile-setup"  element={<ProfileSetupPage />} />
              <Route path="/trip-calendar"  element={<TripCalendarPage />} />
              <Route path="/meet-review"    element={<MeetReviewPage />} />
              <Route path="/marketplace"    element={<MarketplacePage />} />
              <Route path="/voice-call"     element={<VoiceCallPage />} />
              <Route path="/terms"          element={<TermsPage />} />
              <Route path="/privacy"        element={<PrivacyPage />} />
              <Route path="/auth/callback"  element={<AuthCallbackPage />} />
              <Route path="/download"        element={<DownloadPage />} />
              <Route path="/safety"          element={<SafetyCheckInPage />} />
              <Route path="/shop"            element={<ShopPage />} />
              <Route path="/nearby"          element={<NearbyPage />} />
              <Route path="/trip-review"     element={<TripReviewPage />} />
              <Route path="*"              element={<NotFound />} />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>
      {showNav && <BottomNav />}

      {/* Tutorial Overlay */}
      <AnimatePresence>
        {tutorialVisible && showTutorial && (
          <TutorialOverlay onComplete={completeTutorial} />
        )}
      </AnimatePresence>
    </div>
  );
};


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SubscriptionProvider>
        <ChatProvider>
          <NotificationProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <AppContent />
            </BrowserRouter>
          </NotificationProvider>
        </ChatProvider>
      </SubscriptionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
