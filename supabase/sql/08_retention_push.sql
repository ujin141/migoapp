-- ============================================================
-- MIGO 리텐션 Phase 1-2: 미접속 유저 자동 재방문 유도 푸시
-- pg_cron으로 매시간 실행 → 미접속 유저에게 단계별 푸시 발송
-- ============================================================

-- 마지막 활동 시간 추적 (프로필에 컬럼 추가)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- 로그인/앱열기 시 last_active_at 갱신하는 함수 (프론트에서 RPC 호출)
CREATE OR REPLACE FUNCTION touch_active(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET last_active_at = NOW() WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 미접속 유저 푸시 발송 함수 (pg_cron에서 호출)
-- 시나리오:
--   3시간 미접속: "🔥 N명이 회원님을 좋아합니다! 확인해보세요"
--   24시간: "✈️ 회원님과 여행 스타일이 맞는 크루가 N개 있어요!"
--   48시간: "😢 여행 친구들이 기다리고 있어요!"
--   72시간: "🎁 돌아오시면 슈퍼라이크 3개 드려요!"
--   7일:   "📸 새로운 여행자 N명이 가입했어요!"
-- ============================================================
CREATE OR REPLACE FUNCTION send_retention_pushes()
RETURNS void AS $$
DECLARE
  r RECORD;
  like_count INTEGER;
  group_count INTEGER;
  new_users INTEGER;
BEGIN
  -- === 3시간 미접속 ===
  FOR r IN
    SELECT p.id, p.fcm_token
    FROM profiles p
    WHERE p.fcm_token IS NOT NULL
      AND p.last_active_at < NOW() - INTERVAL '3 hours'
      AND p.last_active_at >= NOW() - INTERVAL '4 hours'
      AND p.email NOT LIKE '%@migo.app'  -- 모의유저 제외
  LOOP
    SELECT COUNT(*) INTO like_count FROM likes WHERE to_user = r.id;
    IF like_count > 0 THEN
      INSERT INTO in_app_notifications(user_id, title, content, type)
      VALUES(r.id, '🔥 ' || like_count || '명이 좋아합니다!', '지금 확인해보세요! 매칭 기회를 놓치지 마세요 💕', 'retention_3h')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- === 24시간 미접속 ===
  FOR r IN
    SELECT p.id, p.fcm_token
    FROM profiles p
    WHERE p.fcm_token IS NOT NULL
      AND p.last_active_at < NOW() - INTERVAL '24 hours'
      AND p.last_active_at >= NOW() - INTERVAL '25 hours'
      AND p.email NOT LIKE '%@migo.app'
  LOOP
    SELECT COUNT(*) INTO group_count FROM trip_groups WHERE created_at > NOW() - INTERVAL '7 days';
    INSERT INTO in_app_notifications(user_id, title, content, type)
    VALUES(r.id, '✈️ 새로운 여행 크루 ' || group_count || '개!', '회원님과 여행 스타일이 맞는 크루가 기다리고 있어요!', 'retention_24h')
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- === 48시간 미접속 ===
  FOR r IN
    SELECT p.id
    FROM profiles p
    WHERE p.fcm_token IS NOT NULL
      AND p.last_active_at < NOW() - INTERVAL '48 hours'
      AND p.last_active_at >= NOW() - INTERVAL '49 hours'
      AND p.email NOT LIKE '%@migo.app'
  LOOP
    INSERT INTO in_app_notifications(user_id, title, content, type)
    VALUES(r.id, '😢 여행 친구들이 기다려요', '매칭된 친구들과의 대화를 이어가보세요! 새로운 동행자도 찾아보세요 ✈️', 'retention_48h')
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- === 72시간 미접속 (보상 제공) ===
  FOR r IN
    SELECT p.id
    FROM profiles p
    WHERE p.fcm_token IS NOT NULL
      AND p.last_active_at < NOW() - INTERVAL '72 hours'
      AND p.last_active_at >= NOW() - INTERVAL '73 hours'
      AND p.email NOT LIKE '%@migo.app'
  LOOP
    -- 슈퍼라이크 3개 보상
    UPDATE profiles SET super_likes_left = COALESCE(super_likes_left, 0) + 3 WHERE id = r.id;
    INSERT INTO in_app_notifications(user_id, title, content, type)
    VALUES(r.id, '🎁 슈퍼라이크 3개 선물!', '돌아오셔서 감사해요! 슈퍼라이크 3개가 지급되었습니다 ⭐', 'retention_72h')
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- === 7일 미접속 ===
  FOR r IN
    SELECT p.id
    FROM profiles p
    WHERE p.fcm_token IS NOT NULL
      AND p.last_active_at < NOW() - INTERVAL '7 days'
      AND p.last_active_at >= NOW() - INTERVAL '7 days 1 hour'
      AND p.email NOT LIKE '%@migo.app'
  LOOP
    SELECT COUNT(*) INTO new_users FROM profiles WHERE created_at > NOW() - INTERVAL '7 days';
    INSERT INTO in_app_notifications(user_id, title, content, type)
    VALUES(r.id, '📸 새로운 여행자 ' || new_users || '명!', '지난 일주일간 많은 여행자가 가입했어요! 지금 확인해보세요 🌏', 'retention_7d')
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE '✅ 리텐션 푸시 발송 완료';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- pg_cron 스케줄 (Supabase Dashboard에서 설정)
-- SELECT cron.schedule('retention-push', '0 * * * *', 'SELECT send_retention_pushes()');
-- → 매시 정각마다 실행

-- ============================================================
-- 연속접속 끊김 알림 (매일 아침 9시 실행)
-- 어제 체크인했지만 오늘 안 한 유저에게 알림
-- ============================================================
CREATE OR REPLACE FUNCTION notify_streak_break()
RETURNS void AS $$
DECLARE
  r RECORD;
BEGIN
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
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- pg_cron 스케줄 (Supabase Dashboard에서 설정)
-- SELECT cron.schedule('streak-break-notify', '0 0 * * *', 'SELECT notify_streak_break()');
-- → 매일 KST 9:00 (UTC 00:00) 실행
