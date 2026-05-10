-- ============================================================
-- 02_triggers.sql - 트리거 + 자동화 함수
-- 01_tables.sql, 01b_tables.sql 실행 후 실행하세요
-- ============================================================

-- 신규 회원 프로필 자동 생성
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, plan, is_plus, plus_expires_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.email, ''),
    'premium',
    true,
    NOW() + INTERVAL '1 day'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user error (non-blocking): %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trust Score 자동 계산
CREATE OR REPLACE FUNCTION secure_calculate_trust_score()
RETURNS TRIGGER AS $$
DECLARE
  calculated_score NUMERIC(4,1) := 0;
BEGIN
  IF NEW.phone_verified = true THEN calculated_score := calculated_score + 15; END IF;
  IF NEW.email_verified = true THEN calculated_score := calculated_score + 10; END IF;
  IF NEW.id_verified = true THEN calculated_score := calculated_score + 40; END IF;
  IF NEW.sns_connected = true THEN calculated_score := calculated_score + 15; END IF;
  IF NEW.review_verified = true THEN calculated_score := calculated_score + 20; END IF;
  NEW.trust_score := calculated_score;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_calculate_trust_score ON public.profiles;
CREATE TRIGGER trigger_calculate_trust_score
  BEFORE INSERT OR UPDATE OF phone_verified, email_verified, id_verified, sns_connected, review_verified
  ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION secure_calculate_trust_score();

-- 민감 필드 변조 방지
CREATE OR REPLACE FUNCTION block_sensitive_profile_updates()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    IF NEW.instant_meets_count < OLD.instant_meets_count THEN
      NEW.instant_meets_count := OLD.instant_meets_count;
    END IF;
    IF NEW.no_show_count < OLD.no_show_count THEN
      NEW.no_show_count := OLD.no_show_count;
    END IF;
    IF NEW.is_banned != OLD.is_banned THEN
      NEW.is_banned := OLD.is_banned;
    END IF;
    IF NEW.id_verified != OLD.id_verified THEN NEW.id_verified := OLD.id_verified; END IF;
    IF NEW.phone_verified != OLD.phone_verified THEN NEW.phone_verified := OLD.phone_verified; END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_block_sensitive_update ON public.profiles;
CREATE TRIGGER trigger_block_sensitive_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION block_sensitive_profile_updates();

-- 신규 회원 user_items 자동 생성
CREATE OR REPLACE FUNCTION handle_new_user_items()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_items (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_items ON profiles;
CREATE TRIGGER on_profile_created_items
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_items();

-- chat_threads 생성자 자동 설정
CREATE OR REPLACE FUNCTION set_chat_thread_creator() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_chat_creator ON chat_threads;
CREATE TRIGGER trigger_set_chat_creator
  BEFORE INSERT ON chat_threads
  FOR EACH ROW EXECUTE FUNCTION set_chat_thread_creator();

-- trip_group 생성 시 chat_thread 자동 생성
CREATE OR REPLACE FUNCTION trg_trip_group_create_thread()
RETURNS TRIGGER AS $$
DECLARE
  v_thread_id UUID;
BEGIN
  INSERT INTO chat_threads (is_group, name, photo_url)
  VALUES (true, NEW.title, NEW.cover_image)
  RETURNING id INTO v_thread_id;
  NEW.thread_id := v_thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_trip_group_create_thread_on_insert ON trip_groups;
CREATE TRIGGER trg_trip_group_create_thread_on_insert
  BEFORE INSERT ON trip_groups FOR EACH ROW
  EXECUTE FUNCTION trg_trip_group_create_thread();

-- trip_group 생성 시 호스트를 멤버로 자동 추가
CREATE OR REPLACE FUNCTION trg_trip_group_insert_host()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO trip_group_members (group_id, user_id)
  VALUES (NEW.id, NEW.host_id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_trip_group_insert_host_on_insert ON trip_groups;
CREATE TRIGGER trg_trip_group_insert_host_on_insert
  AFTER INSERT ON trip_groups FOR EACH ROW
  EXECUTE FUNCTION trg_trip_group_insert_host();

-- trip_group_members 변경 시 chat_members 자동 동기화
CREATE OR REPLACE FUNCTION trg_sync_chat_members()
RETURNS TRIGGER AS $$
DECLARE
  v_thread_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT thread_id INTO v_thread_id FROM trip_groups WHERE id = NEW.group_id;
    IF v_thread_id IS NOT NULL THEN
      INSERT INTO chat_members (thread_id, user_id) VALUES (v_thread_id, NEW.user_id) ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT thread_id INTO v_thread_id FROM trip_groups WHERE id = OLD.group_id;
    IF v_thread_id IS NOT NULL THEN
      DELETE FROM chat_members WHERE thread_id = v_thread_id AND user_id = OLD.user_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_chat_members_on_change ON trip_group_members;
CREATE TRIGGER trg_sync_chat_members_on_change
  AFTER INSERT OR DELETE ON trip_group_members FOR EACH ROW
  EXECUTE FUNCTION trg_sync_chat_members();

-- trip_group_members 변경 시 member_count 자동 동기화
CREATE OR REPLACE FUNCTION sync_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE trip_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE trip_groups SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.group_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_member_count ON trip_group_members;
CREATE TRIGGER trg_sync_member_count
  AFTER INSERT OR DELETE ON trip_group_members
  FOR EACH ROW EXECUTE FUNCTION sync_group_member_count();

-- 지원 상태 변경 시 알림
CREATE OR REPLACE FUNCTION notify_application_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (user_id, type, actor_id, target_id, target_text)
    VALUES (
      NEW.applicant_id,
      CASE NEW.status
        WHEN 'approved' THEN 'group_approved'
        WHEN 'rejected' THEN 'group_rejected'
        ELSE 'group_status_changed'
      END,
      NULL,
      NEW.group_id,
      NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_application_status ON trip_applications;
CREATE TRIGGER on_application_status
  AFTER UPDATE ON trip_applications
  FOR EACH ROW EXECUTE FUNCTION notify_application_status();

-- 리뷰 삽입 시 avg_rating 자동 업데이트
CREATE OR REPLACE FUNCTION update_profile_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET
    avg_rating   = (SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM trip_reviews WHERE reviewee_id = NEW.reviewee_id),
    review_count = (SELECT COUNT(*) FROM trip_reviews WHERE reviewee_id = NEW.reviewee_id),
    trip_count   = trip_count + 1
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_trip_review_insert ON trip_reviews;
CREATE TRIGGER on_trip_review_insert
  AFTER INSERT ON trip_reviews
  FOR EACH ROW EXECUTE FUNCTION update_profile_review_stats();

-- 알림 트리거: 좋아요
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.from_user = NEW.to_user THEN RETURN NEW; END IF;
  INSERT INTO notifications (user_id, type, actor_id, target_id)
  VALUES (
    NEW.to_user,
    CASE NEW.kind
      WHEN 'super_like' THEN 'superlike'
      WHEN 'superlike'  THEN 'superlike'
      ELSE 'like'
    END,
    NEW.from_user,
    NULL
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_like ON likes;
CREATE TRIGGER trg_notify_on_like
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- 알림 트리거: 매칭
CREATE OR REPLACE FUNCTION notify_on_match()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, actor_id, target_id)
  VALUES (NEW.user2_id, 'match', NEW.user1_id, NEW.thread_id)
  ON CONFLICT DO NOTHING;
  INSERT INTO notifications (user_id, type, actor_id, target_id)
  VALUES (NEW.user1_id, 'match', NEW.user2_id, NEW.thread_id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_match ON matches;
CREATE TRIGGER trg_notify_on_match
  AFTER INSERT ON matches
  FOR EACH ROW EXECUTE FUNCTION notify_on_match();

-- 알림 트리거: 댓글
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author UUID;
BEGIN
  SELECT author_id INTO v_post_author FROM posts WHERE id = NEW.post_id;
  IF v_post_author IS NULL OR v_post_author = NEW.author_id THEN RETURN NEW; END IF;
  INSERT INTO notifications (user_id, type, actor_id, target_id, target_text)
  VALUES (v_post_author, 'comment', NEW.author_id, NEW.post_id, LEFT(NEW.text, 80));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_comment ON comments;
CREATE TRIGGER trg_notify_on_comment
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- 알림 트리거: 그룹 가입
CREATE OR REPLACE FUNCTION notify_on_group_join()
RETURNS TRIGGER AS $$
DECLARE
  v_host_id  UUID;
  v_title    TEXT;
BEGIN
  SELECT host_id, title INTO v_host_id, v_title FROM trip_groups WHERE id = NEW.group_id;
  IF v_host_id IS NULL OR v_host_id = NEW.user_id THEN RETURN NEW; END IF;
  INSERT INTO notifications (user_id, type, actor_id, target_id, target_text)
  VALUES (v_host_id, 'group_join', NEW.user_id, NEW.group_id, v_title);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_group_join ON trip_group_members;
CREATE TRIGGER trg_notify_on_group_join
  AFTER INSERT ON trip_group_members
  FOR EACH ROW EXECUTE FUNCTION notify_on_group_join();

-- 만료 채팅방 자동 삭제 함수 (pg_cron용)
CREATE OR REPLACE FUNCTION cleanup_expired_chat_threads()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM chat_threads
  WHERE meet_expires_at IS NOT NULL
    AND meet_expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_chat_threads() TO authenticated, service_role;

-- profile_view 중복 알림 정리
DELETE FROM notifications
WHERE type = 'profile_view'
  AND id NOT IN (
    SELECT DISTINCT ON (user_id, actor_id) id
    FROM notifications
    WHERE type = 'profile_view'
    ORDER BY user_id, actor_id, created_at DESC
  );

-- notifications Realtime 설정
DO $$
BEGIN
  BEGIN
    ALTER TABLE notifications REPLICA IDENTITY FULL;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END;
$$;
