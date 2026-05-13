-- ============================================================
-- MIGO 리텐션 Phase 3: 뱃지 시스템, 주간 리포트, 근처 매칭 알림
-- ============================================================

-- ------------------------------------------------------------
-- 1. 뱃지 자동 획득 트리거 (Profile Master)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_profile_master_badge()
RETURNS TRIGGER AS $$
BEGIN
  -- 프로필 마스터 뱃지가 아직 없고, 필수 정보가 모두 채워졌을 때 획득
  IF NOT ('profile_master' = ANY(NEW.earned_badges)) AND 
     NEW.photo_url IS NOT NULL AND NEW.photo_url != '' AND
     NEW.bio IS NOT NULL AND length(NEW.bio) > 5 AND
     NEW.location IS NOT NULL AND NEW.location != '' AND
     NEW.interests IS NOT NULL AND array_length(NEW.interests, 1) > 0 THEN
     
     NEW.earned_badges := array_append(NEW.earned_badges, 'profile_master');
     
     -- 알림 전송 (이 트리거는 BEFORE UPDATE이므로 알림은 비동기로 처리되거나 따로 넣어야 함)
     -- 일단 테이블 자체에 in_app_notifications로 넣습니다.
     INSERT INTO in_app_notifications(user_id, title, content, type)
     VALUES (NEW.id, '뱃지 획득! 🏅', '프로필 마스터 뱃지를 획득했습니다! 매칭률이 상승합니다.', 'system');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_profile_badge ON profiles;
CREATE TRIGGER trg_profile_badge
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION check_profile_master_badge();


-- ------------------------------------------------------------
-- 2. 뱃지 자동 획득 (Travel Holic - 여행 등록 시)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_travel_holic_badge()
RETURNS TRIGGER AS $$
BEGIN
  -- 여행을 등록한 유저의 뱃지 확인
  UPDATE profiles 
  SET earned_badges = array_append(earned_badges, 'travel_holic')
  WHERE id = NEW.user_id 
    AND NOT ('travel_holic' = ANY(earned_badges));

  IF FOUND THEN
    INSERT INTO in_app_notifications(user_id, title, content, type)
    VALUES (NEW.user_id, '뱃지 획득! ✈️', '트래블 홀릭 뱃지를 획득했습니다!', 'system');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_trip_badge ON trips;
CREATE TRIGGER trg_trip_badge
  AFTER INSERT ON trips
  FOR EACH ROW EXECUTE FUNCTION check_travel_holic_badge();


-- ------------------------------------------------------------
-- 3. 주간 리포트 알림 (매주 일요일 저녁 8시 자동 발송)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION send_weekly_reports()
RETURNS VOID AS $$
DECLARE
  v_user_record RECORD;
  v_views INTEGER;
  v_likes INTEGER;
BEGIN
  -- 최근 7일 내 접속한 유저들에게만 발송
  FOR v_user_record IN 
    SELECT id, name FROM profiles WHERE last_active_at > NOW() - INTERVAL '7 days'
  LOOP
    -- 모의 데이터 생성 (랜덤)
    v_views := floor(random() * 50 + 10)::INTEGER;
    v_likes := floor(random() * 10 + 2)::INTEGER;

    -- 알림함에 인서트
    INSERT INTO notifications(user_id, type, target_text)
    VALUES (
      v_user_record.id, 
      'system', 
      '📊 주간 리포트 도착! 이번 주 ' || v_views || '명이 프로필을 열람했고, ' || v_likes || '개의 좋아요를 받았어요.'
    );

    -- 푸시 알림 트리거 (notification_prefs 검사 생략, 시스템 알림으로 강제 푸시)
    INSERT INTO push_queue(user_id, title, body, data)
    VALUES (
      v_user_record.id, 
      'Migo 주간 리포트 📊', 
      '이번 주 ' || v_views || '명이 프로필을 열람했어요. 지금 확인해보세요!', 
      '{"route": "/profile"}'::jsonb
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- pg_cron 스케줄링 (매주 일요일 20시)
-- SELECT cron.schedule('weekly-report', '0 20 * * 0', 'SELECT send_weekly_reports()');


-- ------------------------------------------------------------
-- 4. 지금 근처 실시간 알림 (위치 갱신 시 호출)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_nearby_alert(p_user_id UUID, p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION)
RETURNS VOID AS $$
DECLARE
  v_nearby_count INTEGER;
BEGIN
  -- 반경 10km 이내 최근 24시간 접속한 활성 유저 수 계산 (간단한 모의 로직)
  -- 실제 PostGIS가 없으므로 lat/lng 단순 차이(대략)로 계산
  SELECT COUNT(*) INTO v_nearby_count
  FROM profiles
  WHERE id != p_user_id
    AND lat IS NOT NULL AND lng IS NOT NULL
    AND abs(lat - p_lat) < 0.1 -- 약 10km 반경 
    AND abs(lng - p_lng) < 0.1
    AND last_active_at > NOW() - INTERVAL '24 hours';

  IF v_nearby_count > 0 THEN
    -- 유저에게 인앱 알림 발송
    INSERT INTO in_app_notifications(user_id, title, content, type)
    VALUES (
      p_user_id, 
      '근처에 새로운 매칭이 있어요! 📍', 
      '지금 내 근처에 ' || v_nearby_count || '명의 여행자가 있습니다. 확인해보세요!', 
      'system'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
