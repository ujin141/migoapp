import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MatchPage from "./MatchPage";
import { useAuth } from "@/hooks/useAuth";

/**
 * 루트 경로 / 진입 시:
 * - 로그인 완료 + setupComplete된 상태면 MatchPage 바로 렌더
 * - setupComplete 미완료: /profile-setup 으로 리다이렉트
 * - 앱 첫 실행(hasSeenOnboarding 없음): /splash → 온보딩
 * - 앱 재실행(온보딩 완료): /login
 */
const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const setupComplete = user?.setupComplete;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const hasSeenOnboarding = localStorage.getItem('migo_onboarding_done');
      if (!hasSeenOnboarding) {
        navigate('/splash', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
      return;
    }
    // 로그인은 됐지만 프로필 셋업이 안 된 경우
    if (!setupComplete) {
      navigate('/profile-setup', { replace: true });
    }
  }, [user, loading, setupComplete, navigate]);

  if (loading) return null;
  if (!user || !setupComplete) return null;

  return <MatchPage />;
};

export default Index;
