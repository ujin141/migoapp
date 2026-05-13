-- ============================================================
-- 04_admin_complete.sql
-- 어드민 전용 테이블 + RLS 정책 + RPC 함수 + 뷰 + 관리자 지정
-- Supabase Dashboard > SQL Editor 에서 실행 (01~03 이후)
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. 어드민 전용 테이블 (01d에 없는 것만)
-- ─────────────────────────────────────────────

-- reports 테이블에 어드민 컬럼 추가 (누락 시 대비)
ALTER TABLE reports ADD COLUMN IF NOT EXISTS admin_comment TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_at   TIMESTAMPTZ;

-- announcements: 공지사항 (어드민 전용)
CREATE TABLE IF NOT EXISTS announcements (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  type       TEXT DEFAULT 'info',
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "announcements_select" ON announcements;
CREATE POLICY "announcements_select" ON announcements FOR SELECT USING (true);
DROP POLICY IF EXISTS "announcements_admin_all" ON announcements;
CREATE POLICY "announcements_admin_all" ON announcements FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- admin_activity_log: 어드민 액션 로그
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  details     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activity_log_admin" ON admin_activity_log;
CREATE POLICY "activity_log_admin" ON admin_activity_log FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- app_settings: 앱 설정 키-값 저장소
CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "app_settings_select" ON app_settings;
CREATE POLICY "app_settings_select" ON app_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "app_settings_admin" ON app_settings;
CREATE POLICY "app_settings_admin" ON app_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- ─────────────────────────────────────────────
-- 2. RLS 정책: 어드민은 모든 테이블 접근 가능
-- ─────────────────────────────────────────────


-- profiles: 어드민 전체 업데이트 허용
DROP POLICY IF EXISTS "profiles_admin_update" ON profiles;
CREATE POLICY "profiles_admin_update" ON profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
  );

-- profiles: 어드민 삭제 허용
DROP POLICY IF EXISTS "profiles_admin_delete" ON profiles;
CREATE POLICY "profiles_admin_delete" ON profiles FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- posts: 어드민 전체 허용
DROP POLICY IF EXISTS "posts_admin" ON posts;
CREATE POLICY "posts_admin" ON posts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- reports: 어드민 전체 허용
DROP POLICY IF EXISTS "reports_admin" ON reports;
CREATE POLICY "reports_admin" ON reports FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- id_verifications: 어드민 전체 허용
DROP POLICY IF EXISTS "verif_admin" ON id_verifications;
CREATE POLICY "verif_admin" ON id_verifications FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- safety_checkins: 어드민 전체 허용
DROP POLICY IF EXISTS "safety_admin" ON safety_checkins;
CREATE POLICY "safety_admin" ON safety_checkins FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- trip_groups: 어드민 전체 허용
DROP POLICY IF EXISTS "groups_admin" ON trip_groups;
CREATE POLICY "groups_admin" ON trip_groups FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- in_app_notifications: 어드민 전체 허용
DROP POLICY IF EXISTS "notif_admin" ON in_app_notifications;
CREATE POLICY "notif_admin" ON in_app_notifications FOR ALL
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
  );

-- marketplace_items: 어드민 전체 허용
DROP POLICY IF EXISTS "market_admin" ON marketplace_items;
CREATE POLICY "market_admin" ON marketplace_items FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- ─────────────────────────────────────────────
-- 3. RPC 함수 (어드민 액션)
-- ─────────────────────────────────────────────

-- 대시보드 통계
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE (
  total_users           BIGINT,
  new_users_today       BIGINT,
  total_posts           BIGINT,
  total_groups          BIGINT,
  active_groups         BIGINT,
  pending_reports       BIGINT,
  sos_checkins          BIGINT,
  active_chat_rooms     BIGINT,
  pending_verifications BIGINT,
  total_marketplace     BIGINT
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    (SELECT COUNT(*) FROM profiles)                                                     AS total_users,
    (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE)                   AS new_users_today,
    (SELECT COUNT(*) FROM posts)                                                        AS total_posts,
    (SELECT COUNT(*) FROM trip_groups)                                                  AS total_groups,
    (SELECT COUNT(*) FROM trip_groups WHERE is_active = true)                           AS active_groups,
    (SELECT COUNT(*) FROM reports WHERE status = 'pending')                             AS pending_reports,
    (SELECT COUNT(*) FROM safety_checkins WHERE is_sos = true AND status != 'resolved') AS sos_checkins,
    (SELECT COUNT(*) FROM trip_groups WHERE is_active = true)                           AS active_chat_rooms,
    (SELECT COUNT(*) FROM id_verifications WHERE status = 'pending')                   AS pending_verifications,
    (SELECT COUNT(*) FROM marketplace_items WHERE is_active = true)                    AS total_marketplace;
$$;

-- 유저 정지
CREATE OR REPLACE FUNCTION admin_ban_user(
  target_user_id UUID, reason TEXT DEFAULT NULL, ban_days INTEGER DEFAULT NULL
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles
  SET is_banned = true, banned = true, ban_reason = reason,
      banned_until = CASE WHEN ban_days IS NOT NULL THEN NOW() + (ban_days || ' days')::INTERVAL ELSE NULL END
  WHERE id = target_user_id;
  RETURN FOUND;
END;
$$;

-- 유저 정지 해제
CREATE OR REPLACE FUNCTION admin_unban_user(target_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET is_banned = false, banned = false, ban_reason = NULL, banned_until = NULL
  WHERE id = target_user_id;
  RETURN FOUND;
END;
$$;

-- 신고 처리
CREATE OR REPLACE FUNCTION admin_resolve_report(report_id UUID, action TEXT, comment TEXT DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE reports SET status = action, admin_comment = comment, resolved_at = NOW()
  WHERE id = report_id;
  RETURN FOUND;
END;
$$;

-- 신분증 승인
CREATE OR REPLACE FUNCTION admin_approve_verification(verif_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_score   NUMERIC;
BEGIN
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
    -- 인앱 알림
    INSERT INTO in_app_notifications(user_id, title, content, type, read)
    VALUES (v_user_id, '✅ 신분증 인증 승인', '회원님의 신분증 인증이 승인되었습니다!', 'system', false);
  END IF;
  RETURN FOUND;
END;
$$;

-- 신분증 거절
CREATE OR REPLACE FUNCTION admin_reject_verification(verif_id UUID, reason TEXT DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_user_id UUID;
BEGIN
  UPDATE id_verifications SET status = 'rejected', reject_reason = reason, reviewed_at = NOW()
  WHERE id = verif_id RETURNING user_id INTO v_user_id;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO in_app_notifications(user_id, title, content, type, read)
    VALUES (v_user_id, '❌ 신분증 인증 반려',
      COALESCE('반려 사유: ' || reason, '신분증 인증이 반려되었습니다. 다시 제출해 주세요.'), 'system', false);
  END IF;
  RETURN FOUND;
END;
$$;

-- 게시글 삭제
CREATE OR REPLACE FUNCTION admin_delete_post(p_post_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM posts WHERE id = p_post_id;
  RETURN FOUND;
END;
$$;

-- 게시글 숨김/공개
CREATE OR REPLACE FUNCTION admin_update_post_hidden(p_post_id UUID, p_hidden BOOLEAN)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE posts SET hidden = p_hidden WHERE id = p_post_id;
  RETURN FOUND;
END;
$$;

-- 게시글 상단고정
CREATE OR REPLACE FUNCTION admin_update_post_pinned(p_post_id UUID, p_pinned BOOLEAN)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE posts SET pinned = p_pinned WHERE id = p_post_id;
  RETURN FOUND;
END;
$$;

-- 그룹 삭제
CREATE OR REPLACE FUNCTION admin_delete_group(p_group_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM trip_groups WHERE id = p_group_id;
  RETURN FOUND;
END;
$$;

-- 유저 계정 삭제
CREATE OR REPLACE FUNCTION admin_delete_user_account(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM profiles WHERE id = p_user_id;
  RETURN FOUND;
END;
$$;

-- 어드민 노트 업데이트
CREATE OR REPLACE FUNCTION admin_update_user_note(p_user_id UUID, p_note TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET admin_note = p_note WHERE id = p_user_id;
  RETURN FOUND;
END;
$$;

-- ─────────────────────────────────────────────
-- 4. 어드민 뷰
-- ─────────────────────────────────────────────

-- SOS 활성 체크인 뷰
DROP VIEW IF EXISTS admin_sos_active CASCADE;
CREATE OR REPLACE VIEW admin_sos_active AS
SELECT
  sc.id, sc.user_id, sc.location_name, sc.latitude, sc.longitude,
  sc.status, sc.is_sos, sc.created_at, sc.updated_at,
  p.name AS user_name, p.photo_url AS user_photo, p.email AS user_email
FROM safety_checkins sc
JOIN profiles p ON p.id = sc.user_id
WHERE sc.is_sos = true AND sc.status != 'resolved'
ORDER BY sc.created_at DESC;

-- 채팅방 요약 뷰 (trip_groups 기반)
DROP VIEW IF EXISTS admin_chat_room_summary CASCADE;
CREATE OR REPLACE VIEW admin_chat_room_summary AS
SELECT
  tg.id, tg.title, tg.description, tg.is_active, tg.member_count, tg.max_members,
  tg.created_at, COALESCE(tg.host_id, tg.created_by) AS created_by,
  p.name AS creator_name, p.photo_url AS creator_photo
FROM trip_groups tg
LEFT JOIN profiles p ON p.id = COALESCE(tg.host_id, tg.created_by)
ORDER BY tg.created_at DESC;

-- 유저 요약 뷰
DROP VIEW IF EXISTS admin_user_summary CASCADE;
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

-- ─────────────────────────────────────────────
-- 5. 관리자 계정 지정 (이메일 확인 후 실행)
-- ─────────────────────────────────────────────
UPDATE profiles
SET is_admin = true, role = 'admin'
WHERE email = 'ujin141@naver.com';

-- ─────────────────────────────────────────────
-- 6. app_settings 기본값 삽입
-- ─────────────────────────────────────────────
INSERT INTO app_settings (key, value) VALUES
  ('maintenance_mode',       '"false"'),
  ('min_app_version',        '"1.0.0"'),
  ('max_daily_likes_free',   '10'),
  ('max_daily_likes_plus',   '50'),
  ('super_like_limit_free',  '3'),
  ('boost_duration_minutes', '30'),
  ('match_radius_km',        '50'),
  ('featured_banner',        'null'),
  ('signup_bonus_likes',     '5')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────
-- 완료 메시지
-- ─────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ Admin patch applied successfully!';
  RAISE NOTICE '   - Missing columns added to profiles/reports';
  RAISE NOTICE '   - announcements, admin_activity_log, app_settings, subscriptions, purchases, promo_codes tables created';
  RAISE NOTICE '   - RLS policies set for admin access on all tables';
  RAISE NOTICE '   - All RPC functions created/updated';
  RAISE NOTICE '   - Admin views created';
  RAISE NOTICE '   - Admin account ujin141@naver.com granted admin role';
END $$;
