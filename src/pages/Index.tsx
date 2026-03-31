import { useNavigate } from "react-router-dom";
import LandingPage from "./LandingPage";
import MatchPage from "./MatchPage";
import { useAuth } from "@/hooks/useAuth";

/**
 * 루트 경로 / 진입 시:
 * - 로그인 안 된 상태면 /splash → 온보딩으로 이동
 * - 로그인된 상태라면 MatchPage 바로 렌더
 */
const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (loading) return null;   // 세션 확인 중
  if (!user) return <LandingPage />; // 로그인 안된 상태면 랜딩 페이지 노출

  return <MatchPage />;
};

export default Index;
