-- ============================================================
-- 21_reviews_security.sql
-- 허위 리뷰 및 평판 조작(Reputation Attack) 방어
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION enforce_review_rules()
RETURNS TRIGGER AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_has_connection BOOLEAN;
  v_target UUID;
BEGIN
  -- 관리자 및 백엔드(트리거 등)는 예외
  IF auth.role() != 'authenticated' THEN
    RETURN NEW;
  END IF;

  -- 리뷰어 본인이 맞는지 확인 (기존 RLS로도 방어되지만 이중 보안)
  IF NEW.reviewer_id != v_caller THEN
    RAISE EXCEPTION 'You can only write reviews as yourself';
  END IF;

  -- 타겟 추출 (meet_reviews는 reviewed_id, trip_reviews는 reviewee_id)
  -- 본 트리거는 meet_reviews와 trip_reviews 양쪽에 적용할 수 있도록 유연하게 작성
  BEGIN
    v_target := NEW.reviewed_id; -- meet_reviews 테이블인 경우
  EXCEPTION WHEN undefined_column THEN
    v_target := NEW.reviewee_id; -- trip_reviews 테이블인 경우
  END;

  -- 자기 자신에게 리뷰를 남기는 행위 차단 (어뷰징)
  IF v_caller = v_target THEN
    RAISE EXCEPTION 'You cannot review yourself';
  END IF;

  -- 리뷰어와 리뷰 대상자가 실제로 만난 적이 있는지(매칭, 같은 채팅방, 같은 그룹, 같은 안전 체크인 등) 검증
  SELECT EXISTS (
    -- 1. 1:1 매칭이 성사된 적 있는가?
    SELECT 1 FROM matches 
    WHERE (user1_id = v_caller AND user2_id = v_target) 
       OR (user1_id = v_target AND user2_id = v_caller)
  ) OR EXISTS (
    -- 2. 같은 그룹 여행(trip_groups) 멤버였던 적 있는가?
    SELECT 1 FROM trip_group_members tgm1
    JOIN trip_group_members tgm2 ON tgm1.group_id = tgm2.group_id
    WHERE tgm1.user_id = v_caller AND tgm2.user_id = v_target
  ) OR EXISTS (
    -- 3. 안전 체크인(safety_checkins) 기록이 있는가?
    SELECT 1 FROM safety_checkins 
    WHERE (user_id = v_caller AND partner_id = v_target) 
       OR (user_id = v_target AND partner_id = v_caller)
  ) INTO v_has_connection;

  IF NOT v_has_connection THEN
    RAISE EXCEPTION 'You can only review users you have matched or traveled with';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- meet_reviews 트리거 적용
DROP TRIGGER IF EXISTS trigger_enforce_meet_review ON public.meet_reviews;
CREATE TRIGGER trigger_enforce_meet_review
  BEFORE INSERT ON public.meet_reviews
  FOR EACH ROW EXECUTE FUNCTION enforce_review_rules();

-- trip_reviews 트리거 적용
DROP TRIGGER IF EXISTS trigger_enforce_trip_review ON public.trip_reviews;
CREATE TRIGGER trigger_enforce_trip_review
  BEFORE INSERT ON public.trip_reviews
  FOR EACH ROW EXECUTE FUNCTION enforce_review_rules();

COMMIT;
