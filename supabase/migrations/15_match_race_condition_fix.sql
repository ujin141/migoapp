-- get_or_create_match_thread PL/pgSQL 함수 생성 (동시 매칭 시 대화방 중복 생성 방어)
CREATE OR REPLACE FUNCTION public.get_or_create_match_thread(p_user_a UUID, p_user_b UUID)
RETURNS UUID AS $$
DECLARE
  v_u1 UUID;
  v_u2 UUID;
  v_thread_id UUID;
  v_existing_thread_id UUID;
BEGIN
  -- 1. 두 사용자 ID 정렬 (대칭적 관계 보장)
  v_u1 := least(p_user_a, p_user_b);
  v_u2 := greatest(p_user_a, p_user_b);

  -- 2. 이미 존재하는 매치 확인
  SELECT thread_id INTO v_existing_thread_id
  FROM public.matches
  WHERE user1_id = v_u1 AND user2_id = v_u2;

  IF v_existing_thread_id IS NOT NULL THEN
    RETURN v_existing_thread_id;
  END IF;

  -- 3. 매치가 존재하지 않으므로 트랜잭션 내에서 생성 시도
  BEGIN
    -- chat_threads 생성
    INSERT INTO public.chat_threads (is_group, name, unread_count)
    VALUES (false, null, 0)
    RETURNING id INTO v_thread_id;

    -- chat_members 등록
    INSERT INTO public.chat_members (thread_id, user_id)
    VALUES 
      (v_thread_id, p_user_a),
      (v_thread_id, p_user_b);

    -- matches 등록 (여기서 동시에 들어올 시 unique_violation 발생)
    INSERT INTO public.matches (user1_id, user2_id, thread_id)
    VALUES (v_u1, v_u2, v_thread_id);

    RETURN v_thread_id;

  EXCEPTION WHEN unique_violation THEN
    -- 동시 요청으로 이미 matches가 다른 세션에 의해 삽입되었을 경우
    -- 생성된 thread는 트랜잭션 예외 발생으로 자동 롤백됨.
    -- 이미 생성된 match의 thread_id를 조회하여 반환
    SELECT thread_id INTO v_existing_thread_id
    FROM public.matches
    WHERE user1_id = v_u1 AND user2_id = v_u2;

    RETURN v_existing_thread_id;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
