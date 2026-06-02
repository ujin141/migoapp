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
  // localStorage 안전망: DB 오류 시에도 이미 설정 완료한 유저 보호
  const localSetupDone = !!user?.id && localStorage.getItem(`migo_setup_done_${user.id}`) === '1';

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
    // ▶ 명시적으로 false이고 localStorage 안전망도 없을 때만 리다이렉트
    // setupComplete === false && !localSetupDone → 신규/미완료 유저만 해당
    // setupComplete === undefined → DB 조회 실패 fallback → 홈 화면 유지
    // localSetupDone === true → 이미 완료한 유저, DB 오류여도 홈 유지
    if (setupComplete === false && !localSetupDone) {
      navigate('/profile-setup', { replace: true });
    }
  }, [user, loading, setupComplete, localSetupDone, navigate]);

  if (loading) return null;
  // setupComplete === false && !localSetupDone: profile-setup으로 가는 중 → null
  // 그 외(true, undefined, localSetupDone=true): MatchPage 렌더
  if (!user || (setupComplete === false && !localSetupDone)) return null;

  return <MatchPage />;
};

export default Index;
