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
    // ▶ 명시적으로 false일 때만 리다이렉트 (프로필 DB 쉽취 실패 시 undefined 유지 → 홈 화면 유지)
    // !setupComplete가 아닌 setupComplete === false: undefined는 네트워크 오류 fallback, 기존 유저 보호
    if (setupComplete === false) {
      navigate('/profile-setup', { replace: true });
    }
  }, [user, loading, setupComplete, navigate]);

  if (loading) return null;
  // setupComplete === false: profile-setup으로 각지 중 → null
  // setupComplete === undefined: DB 조회 실패 fallback → MatchPage 허용
  if (!user || setupComplete === false) return null;

  return <MatchPage />;
};

export default Index;
