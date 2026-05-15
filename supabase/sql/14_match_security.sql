-- ============================================================
-- 14_match_security.sql (v2)
-- 강제 1:1 채팅 개설(Forced Chat) 취약점 방어 및 바로모임 자동 차감
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION enforce_chat_members_rules()
RETURNS TRIGGER AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_thread_is_group BOOLEAN;
  v_mutual BOOLEAN;
  v_caller_profile RECORD;
BEGIN
  -- 백엔드 서비스롤(관리자) 무조건 통과
  IF auth.role() != 'authenticated' THEN
    RETURN NEW;
  END IF;

  -- 1. 대상이 속한 채팅방이 1:1 방인지 그룹 방인지 확인
  SELECT is_group INTO v_thread_is_group FROM chat_threads WHERE id = NEW.thread_id;
  
  -- 그룹 방인 경우 추가 검증 없이 통과 (그룹은 별도의 참가 로직이 있음)
  IF v_thread_is_group THEN
    RETURN NEW;
  END IF;

  -- 2. 1:1 채팅방의 경우, 본인이 아닌 "타인"을 방에 추가하려는 순간을 포착 (상대방 초대 시점)
  IF NEW.user_id != v_caller THEN
    -- A. 상호 좋아요(Mutual Like) 확인
    SELECT EXISTS (
      SELECT 1 FROM likes WHERE from_user = v_caller AND to_user = NEW.user_id
    ) AND EXISTS (
      SELECT 1 FROM likes WHERE from_user = NEW.user_id AND to_user = v_caller
    ) INTO v_mutual;

    IF v_mutual THEN
      RETURN NEW; -- 정상 매칭 허용
    END IF;

    -- B. 상호 좋아요가 없으면 "바로모임 (Instant Meet)" 으로 간주하여 제한 검증 및 차감
    SELECT * INTO v_caller_profile FROM profiles WHERE id = v_caller FOR UPDATE;
    
    -- 플러스/프리미엄 멤버는 무제한
    IF v_caller_profile.is_plus = true THEN
      RETURN NEW;
    END IF;

    -- 무료 유저 횟수 제한 (3회 초과 시 에러 발생시켜 채팅 참가 차단)
    IF v_caller_profile.instant_meets_count >= 3 THEN
      RAISE EXCEPTION 'Instant meet limit reached';
    END IF;

    -- 횟수 1 증가 (차감 효과) - 이 업데이트는 트랜잭션 내에서 원자적으로 처리됨
    UPDATE profiles SET instant_meets_count = instant_meets_count + 1 WHERE id = v_caller;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 matches 테이블 트리거 제거 (오작동 방지)
DROP TRIGGER IF EXISTS trigger_enforce_match_rules ON public.matches;

-- chat_members 테이블에 강력한 삽입 방어 트리거 적용
DROP TRIGGER IF EXISTS trigger_enforce_chat_members ON public.chat_members;
CREATE TRIGGER trigger_enforce_chat_members
  BEFORE INSERT ON public.chat_members
  FOR EACH ROW EXECUTE FUNCTION enforce_chat_members_rules();

COMMIT;
