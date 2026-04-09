import { useTranslation } from "react-i18next";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

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
import { getCurrentLocation } from "@/lib/locationService";
import { checkInStreak } from "@/lib/streakService";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useATT } from "@/hooks/useATT";
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
const CommunityGuidelinesPage = lazyWithRetry(() => import("./pages/CommunityGuidelinesPage"));
const RefundPolicyPage  = lazyWithRetry(() => import("./pages/RefundPolicyPage"));
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

const hideNavRoutes = ["/create-trip", "/splash", "/onboarding", "/login", "/verification", "/profile-setup", "/trip-calendar", "/meet-review", "/marketplace", "/voice-call", "/admin", "/terms", "/privacy", "/auth/callback", "/download", "/safety", "/shop", "/nearby", "/trip-review", "/trip-match", "/find-account", "/reset-password", "/community-guidelines", "/refund-policy"];

const pageVariants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.18, ease: "easeOut" } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.12 } },
};

const PUBLIC_ROUTES = ["/splash", "/onboarding", "/login", "/auth/callback", "/terms", "/privacy", "/download", "/find-account", "/reset-password", "/community-guidelines", "/refund-policy"];

const AppContent = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // 강제 스플래시: 세션 중 최초 접속 시 무조건 2초 노출
  const [showInitialSplash, setShowInitialSplash] = useState(() => {
    return !sessionStorage.getItem('migo_splash_shown');
  });

  // EULA 동의 상태
  const [showEula, setShowEula] = useState(false);
  const [eulaScrolled, setEulaScrolled] = useState(false);
  const eulaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && !localStorage.getItem('migo_eula_agreed')) {
      setShowEula(true);
    }
  }, [user]);

  // 콘텐츠가 스크롤 없이 다 보일 때 자동 활성화
  useEffect(() => {
    if (showEula && eulaRef.current) {
      const el = eulaRef.current;
      if (el.scrollHeight <= el.clientHeight + 10) {
        setEulaScrolled(true);
      }
    }
  }, [showEula]);

  useEffect(() => {
    if (showInitialSplash) {
      const timer = setTimeout(() => {
        setShowInitialSplash(false);
        sessionStorage.setItem('migo_splash_shown', '1');
      }, 2000); // 무조건 2초간 노출
      return () => clearTimeout(timer);
    }
  }, [showInitialSplash]);

  const showNav = !hideNavRoutes.includes(location.pathname);
  const isAdmin = location.pathname.startsWith("/admin");
  const noTutorialRoutes = ["/splash", "/onboarding", "/login", "/verification", "/profile-setup", "/find-account", "/reset-password"];
  const showTutorial = !noTutorialRoutes.some((r) => location.pathname.startsWith(r));
  const { show: tutorialVisible, complete: completeTutorial } = useTutorial();

  // ── 네이티브 푸시 권한 및 토큰 레지스터 (백그라운드 알림용) ──
  usePushNotifications(user?.id);

  // ── (iOS 전용) 앱 추적 투명성(ATT) 권한 요청 ──
  useATT();

  // ── 인증 상태 중앙 감지: 미로그인 시 스플래시/로그인으로 자동 이동 등 ──
  useEffect(() => {
    if (loading) return;
    const isPublicRoute = PUBLIC_ROUTES.some(r => location.pathname.startsWith(r));
    if (!user && !isPublicRoute) {
      const hasSeenOnboarding = localStorage.getItem('migo_onboarding_done');
      navigate(hasSeenOnboarding ? '/login' : '/splash', { replace: true });
    } else if (user && (location.pathname === '/login' || location.pathname === '/splash' || location.pathname === '/onboarding')) {
      navigate('/', { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  // ── 네이티브 앱 OAuth 딥링크 수신 핸들러 ──
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const authListener = CapApp.addListener('appUrlOpen', async (data) => {
        // migoapp://login-callback#access_token=... 형식의 URL 수신 시
        if (data.url && data.url.includes('login-callback')) {
          // 인앱 브라우저 닫기
          Browser.close().catch(() => {});
          const urlObj = new URL(data.url);
          const code = urlObj.searchParams.get('code');
          if (code) {
             await supabase.auth.exchangeCodeForSession(code);
             return;
          }
          const urlParts = data.url.split('#');
          if (urlParts.length > 1) {
            const searchParams = new URLSearchParams(urlParts[1]); 
            const access_token = searchParams.get('access_token');
            const refresh_token = searchParams.get('refresh_token');
            if (access_token && refresh_token) {
              await supabase.auth.setSession({ access_token, refresh_token });
            }
          }
        }
      });
      return () => {
        authListener.then(listener => listener.remove());
      };
    }
  }, []);

  // 체크인 스트리크: user 세션 시작 시 1회만 실행
  useEffect(() => {
    if (user) checkInStreak();
  }, [user?.id]);

  // ── GPS 권한 요청만: 위치 자동 업데이트 제거 (Apple 5.1.2 - 수동 체크인만 허용) ──
  useEffect(() => {
    if (!user) return;
    // 위치 권한 요청만 하고, 프로필 자동 업데이트는 하지 않음
    // 위치 공유는 SafetyCheckInPage에서 수동으로만 허용
    getCurrentLocation(false).then(pos => {
      if (!pos) return;
      localStorage.setItem('migo_my_lat', String(pos.lat));
      localStorage.setItem('migo_my_lng', String(pos.lng));
      // ❌ 자동 위치 업데이트 제거 (Apple Guideline 5.1.2)
      // await supabase.from('profiles').update({ lat, lng }).eq('id', user.id);
    });
  }, [user?.id]);

  // ── 언어 자동 감지 ────────────────────────────────────────────
  useEffect(() => {
    const initLanguage = async () => {
      // 1) 사용자가 직접 선택한 언어가 있으면 무조건 우선 적용
      const savedLang = localStorage.getItem('migo-lang');
      if (savedLang) {
        if (i18n.language !== savedLang) i18n.changeLanguage(savedLang);
        return;
      }
      // 2) 저장된 언어 없으면 디바이스/브라우저 언어로 감지
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
      const lang = supported.includes(prefix) ? prefix : 'en';
      i18n.changeLanguage(lang);
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
              <Route path="/community-guidelines" element={<CommunityGuidelinesPage />} />
              <Route path="/refund-policy"  element={<RefundPolicyPage />} />
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
      
      {/* 강제 스플래시 오버레이 */}
      <AnimatePresence>
        {showInitialSplash && (
          <motion.div
            className="fixed inset-0 z-[100]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <SplashPage isOverlay={true} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* EULA 동의 모달 (Guideline 1.2 필수) */}
      {showEula && (
        <div className="fixed inset-0 z-[200] bg-black/70 flex items-end justify-center">
          <div className="bg-background w-full max-w-lg rounded-t-3xl p-6 pb-10 flex flex-col gap-4 max-h-[85vh]">
            <h2 className="text-lg font-bold text-foreground">이용약관 동의</h2>
            <p className="text-sm text-muted-foreground">Migo를 이용하기 전에 아래 약관에 동의해주세요.</p>
            <div
              ref={eulaRef}
              onScroll={(e) => {
                const el = e.currentTarget;
                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) setEulaScrolled(true);
              }}
              className="flex-1 overflow-y-auto text-xs text-muted-foreground space-y-3 border border-border rounded-xl p-4 min-h-[200px]"
            >
              <p className="font-semibold text-foreground">커뮤니티 가이드라인 및 이용약관</p>
              <p>Migo는 여행자들이 안전하게 만날 수 있는 플랫폼입니다. 다음 규칙을 반드시 준수해야 합니다:</p>
              <p>1. <strong>불쾌한 콘텐츠 금지:</strong> 폭력적, 성적, 혐오적 콘텐츠는 즉시 삭제되며 계정이 정지됩니다.</p>
              <p>2. <strong>신고 및 차단:</strong> 부적절한 사용자는 즉시 신고하거나 차단할 수 있습니다. 신고된 콘텐츠는 24시간 내 검토됩니다.</p>
              <p>3. <strong>개인정보 보호:</strong> 타인의 개인정보를 동의 없이 공유하는 것은 금지됩니다.</p>
              <p>4. <strong>사기 및 스팸 금지:</strong> 허위 정보, 스팸, 사기 행위는 즉시 계정 정지 사유가 됩니다.</p>
              <p>5. <strong>연령 제한:</strong> Migo는 17세 이상만 이용 가능합니다.</p>
              <p>6. <strong>위치 정보:</strong> 위치 공유는 수동 체크인으로만 이루어지며, 자동 공유는 없습니다.</p>
              <p>전체 이용약관은 설정 &gt; 이용약관에서 확인할 수 있습니다. 위반 시 콘텐츠 삭제 및 계정 정지 조치가 취해집니다.</p>
            </div>
            <button
              disabled={!eulaScrolled}
              onClick={() => {
                localStorage.setItem('migo_eula_agreed', '1');
                setShowEula(false);
              }}
              className={`w-full py-3 rounded-2xl font-bold text-sm transition-all ${
                eulaScrolled
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {eulaScrolled ? '동의하고 시작하기' : '아래로 스크롤하여 약관 확인'}
            </button>
          </div>
        </div>
      )}
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
              <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
