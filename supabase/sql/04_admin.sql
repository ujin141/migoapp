-- ============================================================
-- 04_admin.sql - 어드민 함수 + 뷰 + 관리자 지정
-- 03_rpc_functions.sql 실행 후 실행하세요
-- ============================================================

-- 관리자 대시보드 통계
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE (
  total_users            BIGINT,
  new_users_today        BIGINT,
  total_posts            BIGINT,
  total_groups           BIGINT,
  active_groups          BIGINT,
  pending_reports        BIGINT,
  sos_checkins           BIGINT,
  active_chat_rooms      BIGINT,
  pending_verifications  BIGINT,
  total_marketplace      BIGINT
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

-- 유저 밴
CREATE OR REPLACE FUNCTION admin_ban_user(
  target_user_id UUID, reason TEXT DEFAULT NULL, ban_days INTEGER DEFAULT NULL
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles
  SET is_banned = true, ban_reason = reason,
      banned_until = CASE WHEN ban_days IS NOT NULL THEN NOW() + (ban_days || ' days')::INTERVAL ELSE NULL END
  WHERE id = target_user_id;
  RETURN FOUND;
END;
$$;

-- 유저 밴 해제
CREATE OR REPLACE FUNCTION admin_unban_user(target_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET is_banned = false, ban_reason = NULL, banned_until = NULL WHERE id = target_user_id;
  RETURN FOUND;
END;
$$;

-- 신고 처리
CREATE OR REPLACE FUNCTION admin_resolve_report(report_id UUID, action TEXT, comment TEXT DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE reports SET status = action, admin_comment = comment, resolved_at = NOW() WHERE id = report_id;
  RETURN FOUND;
END;
$$;

-- 신분증 승인
CREATE OR REPLACE FUNCTION admin_approve_verification(verif_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  UPDATE id_verifications SET status = 'approved', reviewed_at = NOW()
  WHERE id = verif_id RETURNING user_id INTO v_user_id;
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET verified = true WHERE id = v_user_id;
  END IF;
  RETURN FOUND;
END;
$$;

-- 신분증 거절
CREATE OR REPLACE FUNCTION admin_reject_verification(verif_id UUID, reason TEXT DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE id_verifications SET status = 'rejected', reject_reason = reason, reviewed_at = NOW() WHERE id = verif_id;
  RETURN FOUND;
END;
$$;

-- 어드민 뷰: SOS 활성
DROP VIEW IF EXISTS admin_sos_active;
CREATE VIEW admin_sos_active AS
SELECT sc.id, sc.user_id, sc.location_name, sc.latitude, sc.longitude, sc.status, sc.is_sos,
       sc.created_at, sc.updated_at, p.name AS user_name, p.photo_url AS user_photo, p.email AS user_email
FROM safety_checkins sc JOIN profiles p ON p.id = sc.user_id
WHERE sc.is_sos = true AND sc.status != 'resolved'
ORDER BY sc.created_at DESC;

-- 어드민 뷰: 채팅방 요약
DROP VIEW IF EXISTS admin_chat_room_summary;
CREATE VIEW admin_chat_room_summary AS
SELECT tg.id, tg.title, tg.description, tg.is_active, tg.member_count, tg.max_members,
       tg.created_at, tg.created_by, p.name AS creator_name, p.photo_url AS creator_photo,
       (SELECT COUNT(*) FROM messages m WHERE m.group_id = tg.id) AS message_count,
       (SELECT MAX(m.created_at) FROM messages m WHERE m.group_id = tg.id) AS last_message_at
FROM trip_groups tg LEFT JOIN profiles p ON p.id = COALESCE(tg.created_by, tg.host_id)
ORDER BY tg.created_at DESC;

-- 어드민 뷰: 유저 요약
DROP VIEW IF EXISTS admin_user_summary;
CREATE VIEW admin_user_summary AS
SELECT p.id, p.name, p.email, p.photo_url, p.nationality, p.verified, p.is_plus, p.plan,
       p.is_banned, p.ban_reason, p.banned_until, p.admin_note, p.created_at,
       COALESCE(r.report_count, 0) AS received_reports,
       COALESCE(pv.view_count, 0)  AS profile_views
FROM profiles p
LEFT JOIN LATERAL (SELECT COUNT(*) AS report_count FROM reports WHERE target_id = p.id) r ON true
LEFT JOIN LATERAL (SELECT COUNT(*) AS view_count FROM profile_views WHERE viewed_id = p.id) pv ON true;

-- 관리자 지정
UPDATE profiles
SET is_admin = true, role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'ujin141@naver.com' LIMIT 1
);
