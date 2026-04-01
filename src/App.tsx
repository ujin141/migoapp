import { useTranslation } from "react-i18next";
import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav from "./components/BottomNav";
import TutorialOverlay, { useTutorial } from "./components/TutorialOverlay";
import { ChatProvider } from "./context/ChatContext";
import { NotificationProvider } from "./context/NotificationContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import { GlobalFilterProvider } from "./context/GlobalFilterContext";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import i18n from "./i18n";

// ── 즉시 로드 (첫 화면) ────────────────────────────────────────────
import SplashPage from "./pages/SplashPage";

// ── Stale chunk 방어: dynamic import 실패 시 한 번만 강제 새로고침 ─
const lazyWithRetry = (factory: () => Promise<{ default: React.ComponentType<any> }>) =>
  lazy(() =>
    factory().catch((err) => {
      const reloaded = sessionStorage.getItem("chunk_reload");
      if (!reloaded) {
        sessionStorage.setItem("chunk_reload", "1");
        window.location.reload();
        return new Promise(() => {}) as any;
      }
      sessionStorage.removeItem("chunk_reload");
      throw err;
    })
  );

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
const TripMatchPage     = lazyWithRetry(() => import("./pages/TripMatchPage"));
const FindAccountPage   = lazyWithRetry(() => import("./pages/FindAccountPage"));
const ResetPasswordPage = lazyWithRetry(() => import("./pages/ResetPasswordPage"));
const NotFound          = lazyWithRetry(() => import("./pages/NotFound"));

// ── QueryClient ──────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime:    30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: "online",
    },
    mutations: {
      retry: 0,
      networkMode: "online",
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const hideNavRoutes = ["/create-trip", "/splash", "/onboarding", "/login", "/verification", "/profile-setup", "/trip-calendar", "/meet-review", "/marketplace", "/voice-call", "/admin", "/terms", "/privacy", "/auth/callback", "/download", "/safety", "/shop", "/nearby", "/trip-review", "/trip-match", "/find-account", "/reset-password"];

const pageVariants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.18, ease: "easeOut" } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.12 } },
};

const PUBLIC_ROUTES = ["/splash", "/onboarding", "/login", "/auth/callback", "/terms", "/privacy", "/download", "/find-account", "/reset-password"];

const AppContent = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const showNav = !hideNavRoutes.includes(location.pathname);
  const isAdmin = location.pathname.startsWith("/admin");
  const noTutorialRoutes = ["/splash", "/onboarding", "/login", "/verification", "/profile-setup", "/find-account", "/reset-password"];
  const showTutorial = !noTutorialRoutes.some((r) => location.pathname.startsWith(r));
  const { show: tutorialVisible, complete: completeTutorial } = useTutorial();

  // ── 인증 상태 중앙 감지: 미로그인 시 스플래시/로그인으로 자동 이동 ──
  useEffect(() => {
    if (loading) return;
    const isPublicRoute = PUBLIC_ROUTES.some(r => location.pathname.startsWith(r));
    if (!user && !isPublicRoute) {
      const hasSeenOnboarding = localStorage.getItem('migo_onboarding_done');
      navigate(hasSeenOnboarding ? '/login' : '/splash', { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  // ── GPS 권한 요청 ──────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        localStorage.setItem('migo_my_lat', String(lat));
        localStorage.setItem('migo_my_lng', String(lng));
        const { data: { user: su } } = await supabase.auth.getUser();
        if (su) supabase.from('profiles').update({ lat, lng }).eq('id', su.id);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // ── 언어 자동 감지 ────────────────────────────────────────────
  useEffect(() => {
    const initLanguage = async () => {
      const savedLang = localStorage.getItem('migo-lang');
      if (savedLang) { i18n.changeLanguage(savedLang); return; }
      let prefix = 'en';
      try {
        const { Device } = await import('@capacitor/device');
        const langResult = await Device.getLanguageCode();
        prefix = langResult.value.split('-')[0].toLowerCase();
      } catch {
        const raw = navigator.language || navigator.languages?.[0] || 'en';
        prefix = raw.split('-')[0].toLowerCase();
      }
      const supported = ['ko','en','ja','zh','es','fr','de','pt','id','vi','th','ar','hi','ru','tr','it','nl','pl','sv','da','no','fi','cs','ro','hu','el','bg','uk','he','bn','ta','te','kn','ml','gu','mr','pa','fa','ur','sw','zu','ca','hr','sk','sl','lv','lt','et','is'];
      i18n.changeLanguage(supported.includes(prefix) ? prefix : 'en');
    };
    initLanguage();
  }, []);

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
              <Route path="/download"       element={<DownloadPage />} />
              <Route path="/find-account"   element={<FindAccountPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/safety"         element={<SafetyCheckInPage />} />
              <Route path="/shop"           element={<ShopPage />} />
              <Route path="/nearby"         element={<NearbyPage />} />
              <Route path="/trip-review"    element={<TripReviewPage />} />
              <Route path="/trip-match"     element={<TripMatchPage />} />
              <Route path="*"              element={<NotFound />} />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>
      {showNav && <BottomNav />}
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
      <GlobalFilterProvider>
        <SubscriptionProvider>
          <ChatProvider>
            <NotificationProvider>
              <HashRouter>
                <AppContent />
              </HashRouter>
            </NotificationProvider>
          </ChatProvider>
        </SubscriptionProvider>
      </GlobalFilterProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
