-- ============================================================
-- 15_group_security.sql
-- 강제 그룹 가입(Forced Group Join) 취약점 방어 및 승인 트리거 자동화
-- ============================================================

BEGIN;

-- 1. 그룹 멤버 가입 시 그룹의 상태(status)와 최대 인원수를 확인하는 트리거
CREATE OR REPLACE FUNCTION enforce_group_join_rules()
RETURNS TRIGGER AS $$
DECLARE
  v_group RECORD;
  v_current_count INT;
BEGIN
  -- 백엔드/트리거(서비스롤)인 경우 제한 검증 패스
  IF auth.role() != 'authenticated' THEN
    RETURN NEW;
  END IF;

  -- 타인을 강제로 그룹에 넣으려는 시도 차단 (자신만 가입 가능)
  IF auth.uid() != NEW.user_id THEN
    RAISE EXCEPTION 'You can only join a group as yourself';
  END IF;

  -- 그룹 정보 조회
  SELECT * INTO v_group FROM trip_groups WHERE id = NEW.group_id FOR UPDATE;

  -- 현재 멤버 수 조회
  SELECT COUNT(*) INTO v_current_count FROM trip_group_members WHERE group_id = NEW.group_id;

  -- 인원 초과 확인
  IF v_current_count >= v_group.max_members THEN
    RAISE EXCEPTION 'Group is full';
  END IF;

  -- 그룹이 공개 모집 상태(recruiting)가 아니면 직접 가입 불가 (초대/승인 전용)
  IF v_group.status != 'recruiting' THEN
    RAISE EXCEPTION 'Cannot directly join a non-recruiting group';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_enforce_group_join ON public.trip_group_members;
CREATE TRIGGER trigger_enforce_group_join
  BEFORE INSERT ON public.trip_group_members
  FOR EACH ROW EXECUTE FUNCTION enforce_group_join_rules();

-- 2. 호스트가 지원자 승인(approved) 시 자동으로 멤버 테이블에 추가하는 트리거
CREATE OR REPLACE FUNCTION auto_join_approved_applicants()
RETURNS TRIGGER AS $$
BEGIN
  -- 지원 상태가 approved로 변경된 경우에만 작동
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO trip_group_members (group_id, user_id)
    VALUES (NEW.group_id, NEW.applicant_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_join_approved ON public.trip_applications;
CREATE TRIGGER trigger_auto_join_approved
  AFTER UPDATE OF status ON public.trip_applications
  FOR EACH ROW EXECUTE FUNCTION auto_join_approved_applicants();

COMMIT;
