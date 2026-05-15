-- ============================================================
-- Migo App - 완전 통합 스키마 (All-in-One)
-- 생성: sql/01a ~ sql/23 통합 + 중복 제거
-- 실행 순서: 이 파일 하나만 Supabase SQL Editor에서 실행
-- ============================================================


-- ── TABLES: Core (profiles, likes, matches, chat_threads) ──

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select"     ON profiles;

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

CREATE POLICY "profiles_select"     ON profiles FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes_select"     ON likes;

DROP POLICY IF EXISTS "likes_insert_own" ON likes;

DROP POLICY IF EXISTS "likes_delete_own" ON likes;

CREATE POLICY "likes_select"     ON likes FOR SELECT USING (auth.uid() = from_user OR auth.uid() = to_user);

CREATE POLICY "likes_insert_own" ON likes FOR INSERT WITH CHECK (auth.uid() = from_user);

CREATE POLICY "likes_delete_own" ON likes FOR DELETE USING (auth.uid() = from_user);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "matches_select" ON matches;

DROP POLICY IF EXISTS "matches_insert" ON matches;

CREATE POLICY "matches_select" ON matches FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "matches_insert" ON matches FOR INSERT WITH CHECK (true);

ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "threads_select" ON chat_threads;

DROP POLICY IF EXISTS "threads_insert" ON chat_threads;

DROP POLICY IF EXISTS "threads_delete" ON chat_threads;

DROP POLICY IF EXISTS "threads_update" ON chat_threads;

CREATE POLICY "threads_select" ON chat_threads FOR SELECT USING (
  EXISTS(SELECT 1 FROM chat_members WHERE chat_members.thread_id = id AND chat_members.user_id = auth.uid()) OR is_group = true
);

CREATE POLICY "threads_insert" ON chat_threads FOR INSERT WITH CHECK (true);

CREATE POLICY "threads_delete" ON chat_threads FOR DELETE USING (
  EXISTS(SELECT 1 FROM chat_members WHERE chat_members.thread_id = id AND chat_members.user_id = auth.uid())
);

CREATE POLICY "threads_update" ON chat_threads FOR UPDATE USING (
  EXISTS(SELECT 1 FROM chat_members WHERE chat_members.thread_id = id AND chat_members.user_id = auth.uid())
);

ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_select" ON chat_members;

DROP POLICY IF EXISTS "members_insert" ON chat_members;

CREATE OR REPLACE FUNCTION check_is_chat_member(target_thread_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_members
    WHERE thread_id = target_thread_id AND user_id = auth.uid()
  );

$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "members_select" ON chat_members FOR SELECT USING (
  check_is_chat_member(thread_id)
);

CREATE POLICY "members_insert" ON chat_members FOR INSERT WITH CHECK (
  (EXISTS (SELECT 1 FROM chat_threads WHERE id = thread_id AND is_group = true) AND auth.uid() = user_id)
  OR EXISTS (SELECT 1 FROM chat_threads WHERE id = thread_id AND created_by = auth.uid())
  OR check_is_chat_member(thread_id)
);


-- ── TABLES: Community (messages, notifications, posts, comments) ──

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select" ON messages;

DROP POLICY IF EXISTS "messages_insert" ON messages;

DROP POLICY IF EXISTS "messages_group_select" ON messages;

CREATE POLICY "messages_select" ON messages FOR SELECT USING (
  thread_id IN (SELECT thread_id FROM chat_members WHERE user_id = auth.uid())
  OR group_id IS NOT NULL  -- 그룹 메시지는 멤버면 볼 수 있음
);

CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id OR auth.uid() = user_id
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_select_own" ON notifications;

DROP POLICY IF EXISTS "notif_insert"     ON notifications;

DROP POLICY IF EXISTS "notif_update_own" ON notifications;

CREATE POLICY "notif_select_own" ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notif_insert"     ON notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "notif_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inapp_select_own" ON in_app_notifications;

DROP POLICY IF EXISTS "inapp_insert"     ON in_app_notifications;

DROP POLICY IF EXISTS "inapp_update_own" ON in_app_notifications;

CREATE POLICY "inapp_select_own" ON in_app_notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "inapp_insert"     ON in_app_notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "inapp_update_own" ON in_app_notifications FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select"     ON posts;

DROP POLICY IF EXISTS "posts_insert_own" ON posts;

DROP POLICY IF EXISTS "posts_update_own" ON posts;

DROP POLICY IF EXISTS "posts_delete_own" ON posts;

CREATE POLICY "posts_select"     ON posts FOR SELECT USING (hidden = false);

CREATE POLICY "posts_insert_own" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "posts_update_own" ON posts FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "posts_delete_own" ON posts FOR DELETE USING (auth.uid() = author_id);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_likes_select" ON post_likes;

DROP POLICY IF EXISTS "post_likes_insert" ON post_likes;

DROP POLICY IF EXISTS "post_likes_delete" ON post_likes;

CREATE POLICY "post_likes_select" ON post_likes FOR SELECT USING (true);

CREATE POLICY "post_likes_insert" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "post_likes_delete" ON post_likes FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select"     ON comments;

DROP POLICY IF EXISTS "comments_insert"     ON comments;

DROP POLICY IF EXISTS "comments_delete_own" ON comments;

CREATE POLICY "comments_select"     ON comments FOR SELECT USING (true);

CREATE POLICY "comments_insert"     ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "comments_delete_own" ON comments FOR DELETE USING (auth.uid() = author_id);


-- ── TABLES: Trips & Marketplace ──

IF word IS NULL THEN RETURN NULL;

FOR i IN 1..LENGTH(word) LOOP
        char_code := ascii(SUBSTRING(word FROM i FOR 1));

IF char_code >= 44032 AND char_code <= 55203 THEN
            cho_idx := (char_code - 44032) / 588;

result := result || SUBSTRING(chosung FROM cho_idx + 1 FOR 1);

ELSE
            result := result || SUBSTRING(word FROM i FOR 1);

$$ LANGUAGE plpgsql IMMUTABLE;

ALTER TABLE trip_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "groups_select"     ON trip_groups;

DROP POLICY IF EXISTS "groups_insert_own" ON trip_groups;

DROP POLICY IF EXISTS "groups_update_own" ON trip_groups;

DROP POLICY IF EXISTS "groups_delete_own" ON trip_groups;

CREATE POLICY "groups_select"     ON trip_groups FOR SELECT USING (true);

CREATE POLICY "groups_insert_own" ON trip_groups FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "groups_update_own" ON trip_groups FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "groups_delete_own" ON trip_groups FOR DELETE USING (auth.uid() = host_id);

ALTER TABLE trip_group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "group_members_select" ON trip_group_members;

DROP POLICY IF EXISTS "group_members_insert" ON trip_group_members;

DROP POLICY IF EXISTS "group_members_delete" ON trip_group_members;

CREATE POLICY "group_members_select" ON trip_group_members FOR SELECT USING (true);

CREATE POLICY "group_members_insert" ON trip_group_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "group_members_delete" ON trip_group_members FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE trip_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trip_app_select"      ON trip_applications;

DROP POLICY IF EXISTS "trip_app_insert"      ON trip_applications;

DROP POLICY IF EXISTS "trip_app_update_host" ON trip_applications;

CREATE POLICY "trip_app_select"      ON trip_applications FOR SELECT USING (true);

CREATE POLICY "trip_app_insert"      ON trip_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "trip_app_update_host" ON trip_applications FOR UPDATE USING (true);

ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_target_id_fkey;

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_insert"       ON reports;

DROP POLICY IF EXISTS "reports_select_own"   ON reports;

DROP POLICY IF EXISTS "reports_select_admin" ON reports;

DROP POLICY IF EXISTS "reports_update_admin" ON reports;

CREATE POLICY "reports_insert"       ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "reports_select_own"   ON reports FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "reports_select_admin" ON reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

CREATE POLICY "reports_update_admin" ON reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

ALTER TABLE marketplace_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mlikes_select" ON marketplace_likes;

DROP POLICY IF EXISTS "mlikes_insert" ON marketplace_likes;

DROP POLICY IF EXISTS "mlikes_delete" ON marketplace_likes;

CREATE POLICY "mlikes_select" ON marketplace_likes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "mlikes_insert" ON marketplace_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mlikes_delete" ON marketplace_likes FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocks_select_own" ON blocks;

DROP POLICY IF EXISTS "blocks_insert_own" ON blocks;

DROP POLICY IF EXISTS "blocks_delete_own" ON blocks;

CREATE POLICY "blocks_select_own" ON blocks FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "blocks_insert_own" ON blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "blocks_delete_own" ON blocks FOR DELETE USING (auth.uid() = blocker_id);

ALTER TABLE id_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "idv_select_own" ON id_verifications;

DROP POLICY IF EXISTS "idv_insert_own" ON id_verifications;

DROP POLICY IF EXISTS "idv_admin"      ON id_verifications;

CREATE POLICY "idv_select_own" ON id_verifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "idv_insert_own" ON id_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "idv_admin"      ON id_verifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketplace_select" ON marketplace_items;

DROP POLICY IF EXISTS "marketplace_admin"  ON marketplace_items;

CREATE POLICY "marketplace_select" ON marketplace_items FOR SELECT USING (is_active = true);

CREATE POLICY "marketplace_admin"  ON marketplace_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE meet_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select"     ON meet_reviews;

DROP POLICY IF EXISTS "reviews_insert_own" ON meet_reviews;

CREATE POLICY "reviews_select"     ON meet_reviews FOR SELECT USING (true);

CREATE POLICY "reviews_insert_own" ON meet_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

ALTER TABLE trip_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tr_select"     ON trip_reviews;

DROP POLICY IF EXISTS "tr_insert"     ON trip_reviews;

DROP POLICY IF EXISTS "tr_update_own" ON trip_reviews;

CREATE POLICY "tr_select"     ON trip_reviews FOR SELECT USING (true);

CREATE POLICY "tr_insert"     ON trip_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "tr_update_own" ON trip_reviews FOR UPDATE USING (auth.uid() = reviewer_id);


-- ── TABLES: Misc (ads, sos, call_logs, etc.) ──

ALTER TABLE trip_calendars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calendars_select_own" ON trip_calendars;

DROP POLICY IF EXISTS "calendars_insert_own" ON trip_calendars;

DROP POLICY IF EXISTS "calendars_delete_own" ON trip_calendars;

CREATE POLICY "calendars_select_own" ON trip_calendars FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "calendars_insert_own" ON trip_calendars FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "calendars_delete_own" ON trip_calendars FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trips_select"     ON trips;

DROP POLICY IF EXISTS "trips_insert_own" ON trips;

DROP POLICY IF EXISTS "trips_update_own" ON trips;

DROP POLICY IF EXISTS "trips_delete_own" ON trips;

CREATE POLICY "trips_select"     ON trips FOR SELECT USING (true);

CREATE POLICY "trips_insert_own" ON trips FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trips_update_own" ON trips FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "trips_delete_own" ON trips FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE safety_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checkin_own"    ON safety_checkins;

DROP POLICY IF EXISTS "checkin_select" ON safety_checkins;

DROP POLICY IF EXISTS "checkin_insert" ON safety_checkins;

DROP POLICY IF EXISTS "checkin_update" ON safety_checkins;

DROP POLICY IF EXISTS "checkin_delete" ON safety_checkins;

CREATE POLICY "checkin_select" ON safety_checkins FOR SELECT USING (true);

CREATE POLICY "checkin_insert" ON safety_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "checkin_update" ON safety_checkins FOR UPDATE USING (auth.uid() = user_id OR true);

CREATE POLICY "checkin_delete" ON safety_checkins FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pv_select" ON profile_views;

DROP POLICY IF EXISTS "pv_insert" ON profile_views;

CREATE POLICY "pv_select" ON profile_views FOR SELECT USING (auth.uid() = viewed_id OR auth.uid() = viewer_id);

CREATE POLICY "pv_insert" ON profile_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sub_own" ON subscriptions;

DROP POLICY IF EXISTS "sub_admin" ON subscriptions;

CREATE POLICY "sub_own" ON subscriptions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "sub_admin" ON subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "purchase_own" ON purchases;

DROP POLICY IF EXISTS "purchase_admin" ON purchases;

CREATE POLICY "purchase_own" ON purchases FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "purchase_admin" ON purchases FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
);

ALTER TABLE user_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ui_own" ON user_items;

CREATE POLICY "ui_own" ON user_items FOR ALL USING (auth.uid() = user_id);

ALTER TABLE online_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "os_select" ON online_status;

DROP POLICY IF EXISTS "os_upsert" ON online_status;

CREATE POLICY "os_select" ON online_status FOR SELECT USING (true);

CREATE POLICY "os_upsert" ON online_status FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE travel_check_ins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checkin_select" ON travel_check_ins;

DROP POLICY IF EXISTS "checkin_insert" ON travel_check_ins;

DROP POLICY IF EXISTS "checkin_update" ON travel_check_ins;

DROP POLICY IF EXISTS "checkin_delete" ON travel_check_ins;

CREATE POLICY "checkin_select" ON travel_check_ins FOR SELECT USING (true);

CREATE POLICY "checkin_insert" ON travel_check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "checkin_update" ON travel_check_ins FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "checkin_delete" ON travel_check_ins FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.hotplace_seekers REPLICA IDENTITY FULL;

ALTER TABLE public.hotplace_seekers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hotplace_seekers_select" ON public.hotplace_seekers;

DROP POLICY IF EXISTS "hotplace_seekers_insert" ON public.hotplace_seekers;

DROP POLICY IF EXISTS "hotplace_seekers_delete" ON public.hotplace_seekers;

CREATE POLICY "hotplace_seekers_select" ON public.hotplace_seekers FOR SELECT TO authenticated USING (true);

CREATE POLICY "hotplace_seekers_insert" ON public.hotplace_seekers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "hotplace_seekers_delete" ON public.hotplace_seekers FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ads_admin" ON ads;

CREATE POLICY "ads_admin" ON ads FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

ALTER TABLE ad_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ad_slots_select" ON ad_slots;

DROP POLICY IF EXISTS "ad_slots_admin" ON ad_slots;

CREATE POLICY "ad_slots_select" ON ad_slots FOR SELECT USING (true);

CREATE POLICY "ad_slots_admin" ON ad_slots FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

ALTER TABLE ad_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ad_clicks_insert" ON ad_clicks;

DROP POLICY IF EXISTS "ad_clicks_admin"  ON ad_clicks;

CREATE POLICY "ad_clicks_insert" ON ad_clicks FOR INSERT WITH CHECK (true);

CREATE POLICY "ad_clicks_admin"  ON ad_clicks FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ad_imp_insert" ON ad_impressions;

DROP POLICY IF EXISTS "ad_imp_admin"  ON ad_impressions;

CREATE POLICY "ad_imp_insert" ON ad_impressions FOR INSERT WITH CHECK (true);

CREATE POLICY "ad_imp_admin"  ON ad_impressions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chatmsg_select" ON chat_messages;

DROP POLICY IF EXISTS "chatmsg_insert" ON chat_messages;

CREATE POLICY "chatmsg_select" ON chat_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM chat_members WHERE thread_id = chat_messages.thread_id AND user_id = auth.uid()));

CREATE POLICY "chatmsg_insert" ON chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (SELECT 1 FROM chat_members WHERE thread_id = chat_messages.thread_id AND user_id = auth.uid())
  );

ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sos_insert" ON sos_alerts;

DROP POLICY IF EXISTS "sos_own"    ON sos_alerts;

DROP POLICY IF EXISTS "sos_admin"  ON sos_alerts;

CREATE POLICY "sos_insert" ON sos_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sos_own"    ON sos_alerts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "sos_admin"  ON sos_alerts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calllog_own"   ON call_logs;

DROP POLICY IF EXISTS "calllog_admin" ON call_logs;

CREATE POLICY "calllog_own"   ON call_logs FOR ALL   USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE POLICY "calllog_admin" ON call_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

ALTER TABLE broadcast_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bcast_admin" ON broadcast_logs;

CREATE POLICY "bcast_admin" ON broadcast_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ublocks_own" ON user_blocks;

CREATE POLICY "ublocks_own" ON user_blocks FOR ALL USING (auth.uid() = blocker_id);


-- ── TRIGGERS & AUTO FUNCTIONS ──

EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user error (non-blocking): %', SQLERRM;

$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

IF NEW.phone_verified = true THEN calculated_score := calculated_score + 15;

IF NEW.email_verified = true THEN calculated_score := calculated_score + 10;

IF NEW.id_verified = true THEN calculated_score := calculated_score + 40;

IF NEW.sns_connected = true THEN calculated_score := calculated_score + 15;

IF NEW.review_verified = true THEN calculated_score := calculated_score + 20;

NEW.trust_score := calculated_score;

CREATE TRIGGER trigger_calculate_trust_score
  BEFORE INSERT OR UPDATE OF phone_verified, email_verified, id_verified, sns_connected, review_verified
  ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION secure_calculate_trust_score();

IF NEW.no_show_count < OLD.no_show_count THEN
      NEW.no_show_count := OLD.no_show_count;

IF NEW.is_banned != OLD.is_banned THEN
      NEW.is_banned := OLD.is_banned;

IF NEW.id_verified != OLD.id_verified THEN NEW.id_verified := OLD.id_verified;

IF NEW.phone_verified != OLD.phone_verified THEN NEW.phone_verified := OLD.phone_verified;

CREATE TRIGGER trigger_block_sensitive_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION block_sensitive_profile_updates();

CREATE TRIGGER on_profile_created_items
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_items();

CREATE TRIGGER trigger_set_chat_creator
  BEFORE INSERT ON chat_threads
  FOR EACH ROW EXECUTE FUNCTION set_chat_thread_creator();

INSERT INTO chat_threads (is_group, name, photo_url)
  VALUES (true, NEW.title, NEW.cover_image)
  RETURNING id INTO v_thread_id;

NEW.thread_id := v_thread_id;

CREATE TRIGGER trg_trip_group_create_thread_on_insert
  BEFORE INSERT ON trip_groups FOR EACH ROW
  EXECUTE FUNCTION trg_trip_group_create_thread();

CREATE TRIGGER trg_trip_group_insert_host_on_insert
  AFTER INSERT ON trip_groups FOR EACH ROW
  EXECUTE FUNCTION trg_trip_group_insert_host();

IF TG_OP = 'INSERT' THEN
    SELECT thread_id INTO v_thread_id FROM trip_groups WHERE id = NEW.group_id;

IF v_thread_id IS NOT NULL THEN
      INSERT INTO chat_members (thread_id, user_id) VALUES (v_thread_id, NEW.user_id) ON CONFLICT DO NOTHING;

ELSIF TG_OP = 'DELETE' THEN
    SELECT thread_id INTO v_thread_id FROM trip_groups WHERE id = OLD.group_id;

IF v_thread_id IS NOT NULL THEN
      DELETE FROM chat_members WHERE thread_id = v_thread_id AND user_id = OLD.user_id;

CREATE TRIGGER trg_sync_chat_members_on_change
  AFTER INSERT OR DELETE ON trip_group_members FOR EACH ROW
  EXECUTE FUNCTION trg_sync_chat_members();

ELSIF TG_OP = 'DELETE' THEN
    UPDATE trip_groups SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.group_id;

RETURN COALESCE(NEW, OLD);

CREATE TRIGGER trg_sync_member_count
  AFTER INSERT OR DELETE ON trip_group_members
  FOR EACH ROW EXECUTE FUNCTION sync_group_member_count();

CREATE TRIGGER on_application_status
  AFTER UPDATE ON trip_applications
  FOR EACH ROW EXECUTE FUNCTION notify_application_status();

CREATE TRIGGER on_trip_review_insert
  AFTER INSERT ON trip_reviews
  FOR EACH ROW EXECUTE FUNCTION update_profile_review_stats();

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

CREATE TRIGGER trg_notify_on_like
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION notify_on_like();

INSERT INTO notifications (user_id, type, actor_id, target_id)
  VALUES (NEW.user1_id, 'match', NEW.user2_id, NEW.thread_id)
  ON CONFLICT DO NOTHING;

CREATE TRIGGER trg_notify_on_match
  AFTER INSERT ON matches
  FOR EACH ROW EXECUTE FUNCTION notify_on_match();

SELECT author_id INTO v_post_author FROM posts WHERE id = NEW.post_id;

IF v_post_author IS NULL OR v_post_author = NEW.author_id THEN RETURN NEW;

INSERT INTO notifications (user_id, type, actor_id, target_id, target_text)
  VALUES (v_post_author, 'comment', NEW.author_id, NEW.post_id, LEFT(NEW.text, 80));

CREATE TRIGGER trg_notify_on_comment
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

SELECT host_id, title INTO v_host_id, v_title FROM trip_groups WHERE id = NEW.group_id;

IF v_host_id IS NULL OR v_host_id = NEW.user_id THEN RETURN NEW;

INSERT INTO notifications (user_id, type, actor_id, target_id, target_text)
  VALUES (v_host_id, 'group_join', NEW.user_id, NEW.group_id, v_title);

CREATE TRIGGER trg_notify_on_group_join
  AFTER INSERT ON trip_group_members
  FOR EACH ROW EXECUTE FUNCTION notify_on_group_join();

DELETE FROM chat_threads
  WHERE meet_expires_at IS NOT NULL
    AND meet_expires_at < NOW();

GET DIAGNOSTICS deleted_count = ROW_COUNT;

RETURN deleted_count;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_chat_threads() TO authenticated, service_role;

EXCEPTION WHEN OTHERS THEN NULL;


-- ── RPC FUNCTIONS ──

IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated';

DELETE FROM profiles WHERE id = uid;

DELETE FROM auth.users WHERE id = uid;

REVOKE ALL ON FUNCTION delete_user() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;

v_items   user_items;

SELECT * INTO v_items FROM user_items WHERE user_id = v_user_id FOR UPDATE;

IF v_items.super_likes <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'no_superlike_left');

UPDATE user_items SET super_likes = super_likes - 1, updated_at = NOW()
  WHERE user_id = v_user_id;

INSERT INTO likes (from_user, to_user, kind)
  VALUES (v_user_id, p_to_user, 'super_like')
  ON CONFLICT (from_user, to_user) DO UPDATE SET kind = 'super_like';

RETURN json_build_object('success', true, 'remaining', v_items.super_likes - 1);

REVOKE ALL ON FUNCTION record_superlike(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION record_superlike(UUID) TO authenticated;

v_match_exists BOOLEAN;

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

RETURN json_build_object('matched', false);

REVOKE ALL ON FUNCTION check_and_create_match(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION check_and_create_match(UUID) TO authenticated;

SELECT email INTO v_email FROM public.profiles
  WHERE name = p_name AND phone = p_phone LIMIT 1;

IF v_email IS NULL THEN RETURN NULL;

v_at := position('@' IN v_email);

IF v_at > 0 THEN
    v_local := substring(v_email from 1 for v_at - 1);

IF length(v_local) <= 2 THEN
      RETURN substring(v_local,1,1) || '***' || substring(v_email from v_at);

ELSE
      RETURN substring(v_local,1,2) || repeat('*', length(v_local)-2) || substring(v_email from v_at);

GRANT EXECUTE ON FUNCTION public.find_email_by_phone(TEXT, TEXT) TO authenticated, anon;

GRANT EXECUTE ON FUNCTION increment_ad_clicks(UUID) TO authenticated, anon;

GRANT EXECUTE ON FUNCTION increment_ad_impressions(UUID) TO authenticated, anon;


-- ── ADMIN TABLES & RLS ──

ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_at   TIMESTAMPTZ;

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "announcements_select" ON announcements;

CREATE POLICY "announcements_select" ON announcements FOR SELECT USING (true);

DROP POLICY IF EXISTS "announcements_admin_all" ON announcements;

CREATE POLICY "announcements_admin_all" ON announcements FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_log_admin" ON admin_activity_log;

CREATE POLICY "activity_log_admin" ON admin_activity_log FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings_select" ON app_settings;

CREATE POLICY "app_settings_select" ON app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "app_settings_admin" ON app_settings;

CREATE POLICY "app_settings_admin" ON app_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

CREATE POLICY "profiles_admin_update" ON profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
  );

CREATE POLICY "profiles_admin_delete" ON profiles FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

CREATE POLICY "posts_admin" ON posts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

CREATE POLICY "reports_admin" ON reports FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

CREATE POLICY "verif_admin" ON id_verifications FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

CREATE POLICY "safety_admin" ON safety_checkins FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

CREATE POLICY "groups_admin" ON trip_groups FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

CREATE POLICY "notif_admin" ON in_app_notifications FOR ALL
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
  );

CREATE POLICY "market_admin" ON marketplace_items FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

UPDATE id_verifications SET status = 'approved', reviewed_at = NOW()
  WHERE id = verif_id RETURNING user_id INTO v_user_id;

IF v_user_id IS NOT NULL THEN
    -- trust_score 계산
    SELECT
      (CASE WHEN phone_verified THEN 15 ELSE 0 END) +
      (CASE WHEN email_verified THEN 10 ELSE 0 END) + 40 +
      (CASE WHEN sns_connected  THEN 15 ELSE 0 END) +
      (CASE WHEN review_verified THEN 20 ELSE 0 END)
    INTO v_score FROM profiles WHERE id = v_user_id;

UPDATE profiles SET verified = true, id_verified = true, trust_score = COALESCE(v_score, 40)
    WHERE id = v_user_id;

UPDATE id_verifications SET status = 'rejected', reject_reason = reason, reviewed_at = NOW()
  WHERE id = verif_id RETURNING user_id INTO v_user_id;

IF v_user_id IS NOT NULL THEN
    INSERT INTO in_app_notifications(user_id, title, content, type, read)
    VALUES (v_user_id, '❌ 신분증 인증 반려',
      COALESCE('반려 사유: ' || reason, '신분증 인증이 반려되었습니다. 다시 제출해 주세요.'), 'system', false);

CREATE OR REPLACE VIEW admin_sos_active AS
SELECT
  sc.id, sc.user_id, sc.location_name, sc.latitude, sc.longitude,
  sc.status, sc.is_sos, sc.created_at, sc.updated_at,
  p.name AS user_name, p.photo_url AS user_photo, p.email AS user_email
FROM safety_checkins sc
JOIN profiles p ON p.id = sc.user_id
WHERE sc.is_sos = true AND sc.status != 'resolved'
ORDER BY sc.created_at DESC;

CREATE OR REPLACE VIEW admin_chat_room_summary AS
SELECT
  tg.id, tg.title, tg.description, tg.is_active, tg.member_count, tg.max_members,
  tg.created_at, COALESCE(tg.host_id, tg.created_by) AS created_by,
  p.name AS creator_name, p.photo_url AS creator_photo
FROM trip_groups tg
LEFT JOIN profiles p ON p.id = COALESCE(tg.host_id, tg.created_by)
ORDER BY tg.created_at DESC;

CREATE OR REPLACE VIEW admin_user_summary AS
SELECT
  p.id, p.name, p.email, p.photo_url, p.nationality, p.verified, p.is_plus, p.plan,
  p.is_banned, p.banned, p.ban_reason, p.banned_until, p.admin_note, p.created_at,
  p.trust_score, p.user_type, p.gender, p.age,
  COALESCE(r.report_count, 0) AS received_reports
FROM profiles p
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS report_count FROM reports WHERE target_id = p.id
) r ON true;

RAISE NOTICE '   - Missing columns added to profiles/reports';

RAISE NOTICE '   - announcements, admin_activity_log, app_settings, subscriptions, purchases, promo_codes tables created';

RAISE NOTICE '   - RLS policies set for admin access on all tables';

RAISE NOTICE '   - All RPC functions created/updated';

RAISE NOTICE '   - Admin views created';

RAISE NOTICE '   - Admin account ujin141@naver.com granted admin role';


-- ── INDEXES ──

CREATE INDEX IF NOT EXISTS idx_likes_to               ON likes(to_user);

CREATE INDEX IF NOT EXISTS idx_likes_from_created      ON likes(from_user, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_matches_user2           ON matches(user2_id);

CREATE INDEX IF NOT EXISTS idx_messages_group_id       ON messages(group_id);

CREATE INDEX IF NOT EXISTS idx_messages_created_at     ON messages(created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notif_profile_view_dedup
  ON notifications (user_id, actor_id, type) WHERE type = 'profile_view';

CREATE INDEX IF NOT EXISTS idx_trip_groups_created_at   ON trip_groups(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_group_members_user       ON trip_group_members(user_id);

CREATE INDEX IF NOT EXISTS idx_trip_app_applicant       ON trip_applications(applicant_id);

CREATE INDEX IF NOT EXISTS idx_reports_created_at       ON reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_safety_checkins_status   ON safety_checkins(status);

CREATE INDEX IF NOT EXISTS idx_safety_checkins_created  ON safety_checkins(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tr_reviewer              ON trip_reviews(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_online_status_latln      ON online_status(lat, lng);

CREATE INDEX IF NOT EXISTS hotplace_seekers_hotplace_id_idx ON public.hotplace_seekers(hotplace_id, created_at DESC);


-- ── REALTIME & STORAGE ──

FOREACH t IN ARRAY ARRAY['matches','messages','notifications','trip_reviews','online_status']
  LOOP

      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);

EXCEPTION WHEN OTHERS THEN
      -- ignore already added or other errors
    END;

INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('id-docs', 'id-docs', false) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatar_all_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatar_upload_own"  ON storage.objects;

CREATE POLICY "avatar_upload_own" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "posts_all_public"   ON storage.objects;

CREATE POLICY "posts_all_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'posts');

DROP POLICY IF EXISTS "posts_upload_own"   ON storage.objects;

CREATE POLICY "posts_upload_own" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "id_docs_own"        ON storage.objects;

CREATE POLICY "id_docs_own" ON storage.objects
  FOR ALL USING (bucket_id = 'id-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "ad_images_public"     ON storage.objects;

CREATE POLICY "ad_images_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'ad-images');

DROP POLICY IF EXISTS "ad_images_admin_upload" ON storage.objects;

CREATE POLICY "ad_images_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'ad-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
  );


-- ── RETENTION: Features ──

ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checkin_select_own" ON daily_checkins;

DROP POLICY IF EXISTS "checkin_insert_own" ON daily_checkins;

CREATE POLICY "checkin_select_own" ON daily_checkins FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "checkin_insert_own" ON daily_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_user ON daily_checkins(user_id, checked_at DESC);

target_count INTEGER;

IF mock_ids IS NULL OR array_length(mock_ids, 1) < 5 THEN
    RETURN NEW;

IF target_count > array_length(mock_ids, 1) THEN
    target_count := array_length(mock_ids, 1);

FOREACH mock_id IN ARRAY mock_ids LOOP
    EXIT WHEN cnt >= target_count;

EXCEPTION WHEN OTHERS THEN
  -- 에러가 나도 가입 자체는 차단하지 않음
  RAISE LOG 'auto_generate_welcome_likes error (non-blocking): %', SQLERRM;

CREATE TRIGGER trg_welcome_likes
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION auto_generate_welcome_likes();

v_prev_streak INTEGER := 0;

v_new_streak INTEGER := 1;

v_reward TEXT := NULL;

v_already BOOLEAN := false;

SELECT streak, reward INTO v_new_streak, v_reward
    FROM daily_checkins WHERE user_id = p_user_id AND checked_at = CURRENT_DATE;

RETURN jsonb_build_object('already', true, 'streak', v_new_streak, 'reward', v_reward);

IF v_prev_streak IS NOT NULL THEN
    v_new_streak := v_prev_streak + 1;

ELSE
    v_new_streak := 1;

WHEN 5 THEN v_reward := 'boost_30m';

WHEN 7 THEN v_reward := 'super_like_1';

ELSE v_reward := 'badge_only';

ELSIF v_reward = 'boost_30m' THEN
    UPDATE profiles SET boost_expires_at = NOW() + INTERVAL '30 minutes' WHERE id = p_user_id;

RETURN jsonb_build_object('already', false, 'streak', v_new_streak, 'reward', v_reward);


-- ── RETENTION: Push ──

IF like_count > 0 THEN
      INSERT INTO in_app_notifications(user_id, title, content, type)
      VALUES(r.id, '🔥 ' || like_count || '명이 좋아합니다!', '지금 확인해보세요! 매칭 기회를 놓치지 마세요 💕', 'retention_3h')
      ON CONFLICT DO NOTHING;

INSERT INTO in_app_notifications(user_id, title, content, type)
    VALUES(r.id, '✈️ 새로운 여행 크루 ' || group_count || '개!', '회원님과 여행 스타일이 맞는 크루가 기다리고 있어요!', 'retention_24h')
    ON CONFLICT DO NOTHING;

INSERT INTO in_app_notifications(user_id, title, content, type)
    VALUES(r.id, '🎁 슈퍼라이크 3개 선물!', '돌아오셔서 감사해요! 슈퍼라이크 3개가 지급되었습니다 ⭐', 'retention_72h')
    ON CONFLICT DO NOTHING;

INSERT INTO in_app_notifications(user_id, title, content, type)
    VALUES(r.id, '📸 새로운 여행자 ' || new_users || '명!', '지난 일주일간 많은 여행자가 가입했어요! 지금 확인해보세요 🌏', 'retention_7d')
    ON CONFLICT DO NOTHING;

RAISE NOTICE '✅ 리텐션 푸시 발송 완료';

FOR r IN
    SELECT dc.user_id, dc.streak, p.fcm_token
    FROM daily_checkins dc
    JOIN profiles p ON p.id = dc.user_id
    WHERE dc.checked_at = CURRENT_DATE - 1
      AND dc.streak >= 3  -- 3일 이상 연속이었던 사람만
      AND NOT EXISTS(SELECT 1 FROM daily_checkins d2 WHERE d2.user_id = dc.user_id AND d2.checked_at = CURRENT_DATE)
      AND p.fcm_token IS NOT NULL
      AND p.email NOT LIKE '%@migo.app'
  LOOP
    INSERT INTO in_app_notifications(user_id, title, content, type)
    VALUES(r.user_id, '🔥 연속 ' || r.streak || '일 끊어질 위기!', '오늘 접속하면 연속 기록을 유지할 수 있어요! 보상도 기다리고 있어요 🎁', 'streak_break')
    ON CONFLICT DO NOTHING;


-- ── BADGES & REPORTS ──

CREATE TRIGGER trg_profile_badge
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION check_profile_master_badge();

IF FOUND THEN
    INSERT INTO in_app_notifications(user_id, title, content, type)
    VALUES (NEW.user_id, '뱃지 획득! ✈️', '트래블 홀릭 뱃지를 획득했습니다!', 'system');

CREATE TRIGGER trg_trip_badge
  AFTER INSERT ON trips
  FOR EACH ROW EXECUTE FUNCTION check_travel_holic_badge();

v_likes := floor(random() * 10 + 2)::INTEGER;

IF v_nearby_count > 0 THEN
    -- 유저에게 인앱 알림 발송
    INSERT INTO in_app_notifications(user_id, title, content, type)
    VALUES (
      p_user_id, 
      '근처에 새로운 매칭이 있어요! 📍', 
      '지금 내 근처에 ' || v_nearby_count || '명의 여행자가 있습니다. 확인해보세요!', 
      'system'
    );


-- ── SCHEMA FIXES ──

ALTER TABLE chat_threads ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE trip_groups ADD COLUMN IF NOT EXISTS entry_fee   INTEGER DEFAULT 0;

ALTER TABLE trip_groups ADD COLUMN IF NOT EXISTS is_premium  BOOLEAN DEFAULT false;

CREATE TRIGGER trg_sync_message_text
  BEFORE INSERT OR UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION sync_message_text_content();

CREATE TRIGGER trg_update_thread_last_msg
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_thread_last_message();

IF NOT FOUND THEN
    INSERT INTO online_status (user_id, is_online, last_seen)
    VALUES (auth.uid(), true, NOW())
    ON CONFLICT (user_id) DO UPDATE SET is_online = true, last_seen = NOW();

GRANT EXECUTE ON FUNCTION touch_active() TO authenticated;

FOREACH t IN ARRAY ARRAY['messages', 'chat_messages', 'online_status', 'hotplace_seekers', 'sos_alerts']
  LOOP

      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);

EXCEPTION WHEN OTHERS THEN
      -- ignore
    END;

UPDATE profiles SET setup_complete = true WHERE email LIKE '%@migo.app%';

RAISE NOTICE '   profiles: setup_complete, sns_handle, last_active_at 추가';

RAISE NOTICE '   messages: text 컬럼 추가 + content 동기화 트리거';

RAISE NOTICE '   reports: reported_user_id 추가';

RAISE NOTICE '   chat_threads: last_message_at, updated_at 추가 + 자동 업데이트 트리거';

RAISE NOTICE '   trip_groups: cover_image, entry_fee, is_premium 추가';

RAISE NOTICE '   touch_active() RPC 생성';

RAISE NOTICE '   Realtime 구독 + Storage 버킷 설정';


-- ── SYNC: Auth Verification ──

IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.profiles SET email_verified = true, email = NEW.email WHERE id = NEW.id;

CREATE TRIGGER trg_sync_auth_verification
  AFTER UPDATE OF phone_confirmed_at, email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_auth_verification_to_profiles();


-- ── SECURITY: Privilege Escalation ──

IF NEW.banned != OLD.banned THEN NEW.banned := OLD.banned;

IF NEW.email_verified != OLD.email_verified THEN NEW.email_verified := OLD.email_verified;

IF NEW.role != OLD.role THEN NEW.role := OLD.role;

IF NEW.plan != OLD.plan THEN NEW.plan := OLD.plan;

IF NEW.plus_expires_at != OLD.plus_expires_at THEN NEW.plus_expires_at := OLD.plus_expires_at;

IF NEW.boost_expires_at != OLD.boost_expires_at THEN NEW.boost_expires_at := OLD.boost_expires_at;

IF NEW.super_likes_left > OLD.super_likes_left THEN NEW.super_likes_left := OLD.super_likes_left;

IF NEW.avg_rating != OLD.avg_rating THEN NEW.avg_rating := OLD.avg_rating;

IF NEW.review_count != OLD.review_count THEN NEW.review_count := OLD.review_count;


-- ── SECURITY: Match ──

v_thread_is_group BOOLEAN;

v_caller_profile RECORD;

IF v_mutual THEN
      RETURN NEW;

CREATE TRIGGER trigger_enforce_chat_members
  BEFORE INSERT ON public.chat_members
  FOR EACH ROW EXECUTE FUNCTION enforce_chat_members_rules();


-- ── SECURITY: Group ──

CREATE TRIGGER trigger_enforce_group_join
  BEFORE INSERT ON public.trip_group_members
  FOR EACH ROW EXECUTE FUNCTION enforce_group_join_rules();

CREATE TRIGGER trigger_auto_join_approved
  AFTER UPDATE OF status ON public.trip_applications
  FOR EACH ROW EXECUTE FUNCTION auto_join_approved_applicants();


-- ── SECURITY: Admin RLS ──

CREATE POLICY "idv_admin" ON public.id_verifications
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
  );

CREATE POLICY "marketplace_admin" ON public.marketplace_items
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
  );

CREATE POLICY "marketplace_host_all" ON public.marketplace_items
  FOR ALL TO authenticated
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);


-- ── SECURITY: Items RLS ──

IF NEW.boosts > OLD.boosts THEN
      NEW.boosts := OLD.boosts;

IF NEW.nearby_days > OLD.nearby_days THEN
      NEW.nearby_days := OLD.nearby_days;

CREATE TRIGGER trigger_block_item_forging
  BEFORE UPDATE ON public.user_items
  FOR EACH ROW EXECUTE FUNCTION block_item_forging();

CREATE POLICY "purchase_own_select" ON public.purchases 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "sub_own_select" ON public.subscriptions 
  FOR SELECT USING (auth.uid() = user_id);


-- ── SECURITY: Matches RLS ──

DROP POLICY IF EXISTS "matches_delete" ON public.matches;


-- ── SECURITY: Admin Notes ──

IF NEW.ban_reason != OLD.ban_reason THEN NEW.ban_reason := OLD.ban_reason;

IF NEW.banned_until != OLD.banned_until THEN NEW.banned_until := OLD.banned_until;

IF NEW.has_badge != OLD.has_badge THEN NEW.has_badge := OLD.has_badge;

IF NEW.earned_badges != OLD.earned_badges THEN NEW.earned_badges := OLD.earned_badges;


-- ── SECURITY: Reviews ──

v_has_connection BOOLEAN;

IF NOT v_has_connection THEN
    RAISE EXCEPTION 'You can only review users you have matched or traveled with';

CREATE TRIGGER trigger_enforce_meet_review
  BEFORE INSERT ON public.meet_reviews
  FOR EACH ROW EXECUTE FUNCTION enforce_review_rules();

CREATE TRIGGER trigger_enforce_trip_review
  BEFORE INSERT ON public.trip_reviews
  FOR EACH ROW EXECUTE FUNCTION enforce_review_rules();


-- ── SECURITY: Likes ──

CREATE POLICY "likes_update_own" ON public.likes 
  FOR UPDATE USING (auth.uid() = from_user)
  WITH CHECK (kind != 'super_like');


-- ── SECURITY: API Rate Limits ──

IF NEW.admin_note != OLD.admin_note THEN NEW.admin_note := OLD.admin_note;

IF NEW.is_admin != OLD.is_admin THEN NEW.is_admin := OLD.is_admin;

IF NEW.is_plus != OLD.is_plus THEN NEW.is_plus := OLD.is_plus;

IF NEW.trust_score != OLD.trust_score THEN NEW.trust_score := OLD.trust_score;

IF NEW.translate_count < OLD.translate_count AND NEW.translate_last_reset = OLD.translate_last_reset THEN 
      NEW.translate_count := OLD.translate_count;

IF NEW.translate_last_reset != OLD.translate_last_reset THEN NEW.translate_last_reset := OLD.translate_last_reset;
