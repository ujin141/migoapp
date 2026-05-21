-- ============================================================
-- add_notification_frequency_cap.sql
-- 푸시 알림 빈도 제한 기능 추가
-- ============================================================

-- 1. profiles 테이블에 알림 빈도 제한 컬럼 추가
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS notif_sent_today INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS notif_sent_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS max_notif_per_day INT DEFAULT 10;

-- 2. 매일 자정에 카운터 리셋하는 함수
CREATE OR REPLACE FUNCTION reset_daily_notif_counters()
RETURNS TABLE(reset_count INT) AS $$
BEGIN
  UPDATE profiles
  SET notif_sent_today = 0
  WHERE DATE(notif_sent_at) < CURRENT_DATE;
  
  RETURN QUERY SELECT COUNT(*)::INT FROM profiles WHERE DATE(notif_sent_at) < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.reset_daily_notif_counters() TO authenticated, service_role;

-- 3. 알림 생성 함수 (빈도 제한 포함)
-- notifications 테이블에 INSERT 전에 호출
CREATE OR REPLACE FUNCTION should_notify_user(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_sent_today INT;
  v_max_per_day INT;
  v_last_reset BOOLEAN;
BEGIN
  SELECT notif_sent_today, max_notif_per_day INTO v_sent_today, v_max_per_day
  FROM profiles
  WHERE id = user_id;
  
  -- 카운터 리셋 필요한지 확인
  v_last_reset := (
    SELECT DATE(notif_sent_at) < CURRENT_DATE
    FROM profiles
    WHERE id = user_id
  );
  
  IF v_last_reset THEN
    UPDATE profiles
    SET notif_sent_today = 0, notif_sent_at = NOW()
    WHERE id = user_id;
    v_sent_today := 0;
  END IF;
  
  -- 오늘 보낸 알림이 최대치 미만이면 TRUE, 초과하면 FALSE
  RETURN v_sent_today < v_max_per_day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.should_notify_user(UUID) TO authenticated, service_role;

-- 4. 알림 카운터 증가 함수
CREATE OR REPLACE FUNCTION increment_notif_sent_today(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET notif_sent_today = notif_sent_today + 1,
      notif_sent_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_notif_sent_today(UUID) TO authenticated, service_role;

-- 5. pg_cron 스케줄 (매일 자정에 카운터 리셋)
-- Supabase에서 pg_cron 활성화 필요:
-- SELECT cron.schedule('reset-daily-notif-counters', '0 0 * * *', 'SELECT public.reset_daily_notif_counters()');
-- 또는 Supabase Dashboard → SQL Editor → 위 쿼리 실행

-- 6. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_profiles_notif_sent_today ON profiles(notif_sent_today);
CREATE INDEX IF NOT EXISTS idx_profiles_notif_sent_at ON profiles(notif_sent_at);
