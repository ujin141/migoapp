import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MatchPage from "./MatchPage";
import { useAuth } from "@/hooks/useAuth";

/**
 * 루트 경로 / 진입 시:
 * - 로그인 완료된 상태면 MatchPage 바로 렌더
 * - 앱 첫 실행(hasSeenOnboarding 없음): /splash → 온보딩
 * - 앱 재실행(온보딩 완료): /login
 */
const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const hasSeenOnboarding = localStorage.getItem('migo_onboarding_done');
      if (!hasSeenOnboarding) {
        navigate('/splash', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  if (loading) return null;
  if (!user) return null;

  return <MatchPage />;
};

export default Index;
