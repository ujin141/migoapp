-- ============================================================
-- 03_rpc_functions.sql - 앱에서 호출하는 RPC 함수
-- 02_triggers.sql 실행 후 실행하세요
-- ============================================================

-- delete_user: 회원 탈퇴
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  DELETE FROM profiles WHERE id = uid;
  DELETE FROM auth.users WHERE id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION delete_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;

-- record_superlike: 슈퍼라이크 차감 + like 삽입
CREATE OR REPLACE FUNCTION record_superlike(p_to_user UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_items   user_items;
BEGIN
  SELECT * INTO v_items FROM user_items WHERE user_id = v_user_id FOR UPDATE;
  IF v_items.super_likes <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'no_superlike_left');
  END IF;
  UPDATE user_items SET super_likes = super_likes - 1, updated_at = NOW()
  WHERE user_id = v_user_id;
  INSERT INTO likes (from_user, to_user, kind)
  VALUES (v_user_id, p_to_user, 'super_like')
  ON CONFLICT (from_user, to_user) DO UPDATE SET kind = 'super_like';
  RETURN json_build_object('success', true, 'remaining', v_items.super_likes - 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION record_superlike(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_superlike(UUID) TO authenticated;

-- check_and_create_match: 쌍방 좋아요 시 자동 매칭
CREATE OR REPLACE FUNCTION check_and_create_match(p_to_user UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id      UUID := auth.uid();
  v_match_exists BOOLEAN;
  v_thread_id    UUID;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM likes WHERE from_user = p_to_user AND to_user = v_user_id
  ) INTO v_match_exists;

  IF v_match_exists THEN
    INSERT INTO chat_threads (is_group) VALUES (false) RETURNING id INTO v_thread_id;
    INSERT INTO chat_members (thread_id, user_id)
    VALUES (v_thread_id, v_user_id), (v_thread_id, p_to_user)
    ON CONFLICT DO NOTHING;
    INSERT INTO matches (user1_id, user2_id, thread_id)
    VALUES (LEAST(v_user_id, p_to_user), GREATEST(v_user_id, p_to_user), v_thread_id)
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
    INSERT INTO notifications (user_id, type, actor_id, target_id)
    VALUES (p_to_user, 'match', v_user_id, v_thread_id);
    INSERT INTO notifications (user_id, type, actor_id, target_id)
    VALUES (v_user_id, 'match', p_to_user, v_thread_id);
    RETURN json_build_object('matched', true, 'thread_id', v_thread_id);
  END IF;
  RETURN json_build_object('matched', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION check_and_create_match(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_and_create_match(UUID) TO authenticated;

-- find_email_by_phone: 이메일 찾기 (마스킹)
CREATE OR REPLACE FUNCTION public.find_email_by_phone(p_name TEXT, p_phone TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_email TEXT; v_at INT; v_local TEXT;
BEGIN
  SELECT email INTO v_email FROM public.profiles
  WHERE name = p_name AND phone = p_phone LIMIT 1;
  IF v_email IS NULL THEN RETURN NULL; END IF;
  v_at := position('@' IN v_email);
  IF v_at > 0 THEN
    v_local := substring(v_email from 1 for v_at - 1);
    IF length(v_local) <= 2 THEN
      RETURN substring(v_local,1,1) || '***' || substring(v_email from v_at);
    ELSE
      RETURN substring(v_local,1,2) || repeat('*', length(v_local)-2) || substring(v_email from v_at);
    END IF;
  END IF;
  RETURN v_email;
END;
$$;
GRANT EXECUTE ON FUNCTION public.find_email_by_phone(TEXT, TEXT) TO authenticated, anon;
