-- ============================================================================
-- Migo App - Dormant User Wake-up Bot (휴면 유저 저격 봇)
-- 3일 이상 접속하지 않은(last_seen < 3일) 유저를 찾아
-- 가짜 유저(봇)가 좋아요를 보내서 푸시/이메일 알림을 유발해 앱으로 복귀시킵니다.
-- ============================================================================

CREATE OR REPLACE FUNCTION wake_up_dormant_users()
RETURNS void AS $$
DECLARE
  dormant_user RECORD;
  mock_id UUID;
  wake_count INTEGER := 0;
BEGIN
  -- 최근 3일 이상 접속하지 않은 유저 타겟팅 (최대 100명씩 처리)
  FOR dormant_user IN
    SELECT p.id, p.name
    JOIN online_status o ON p.id = o.user_id
    WHERE p.email NOT LIKE '%@migo.app'         -- 실제 유저만
      AND o.last_seen < NOW() - INTERVAL '3 days' -- 3일 이상 미접속
    ORDER BY o.last_seen ASC
    LIMIT 100
  LOOP
    -- 해당 유저에게 아직 좋아요를 보내지 않은 가짜 유저(mock) 1명을 랜덤하게 선택
    SELECT id INTO mock_id
    FROM profiles
    WHERE email LIKE '%@migo.app'
      AND id != dormant_user.id
      AND NOT EXISTS (
        SELECT 1 FROM likes 
        WHERE from_user = profiles.id AND to_user = dormant_user.id
      )
    ORDER BY random()
    LIMIT 1;

    -- 가짜 유저가 선정되었다면 좋아요 전송 및 알림 생성
    IF mock_id IS NOT NULL THEN
      -- likes 테이블에 좋아요 인서트
      INSERT INTO likes(from_user, to_user, kind, created_at)
      VALUES (mock_id, dormant_user.id, 'like', NOW())
      ON CONFLICT DO NOTHING;

      -- 인앱 알림 생성 (다음 접속 시 노출)
      INSERT INTO in_app_notifications(user_id, title, content, type)
      VALUES (
        dormant_user.id,
        '새로운 인연이 기다리고 있어요! 💕',
        '회원님을 마음에 들어 하는 분이 있습니다. 지금 접속해서 누군지 확인해보세요!',
        'like'
      );
      
      wake_count := wake_count + 1;
    END IF;
  END LOOP;
  
  -- 실행 결과 로그 남기기
  RAISE LOG 'Wake-up bot sent drip likes to % dormant users.', wake_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 스케줄 삭제
DO $$ BEGIN PERFORM cron.unschedule('wake-up-dormant-job'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 매일 낮 12시 정각에 실행되도록 예약 (한국 시간 기준 서버 타임존에 따라 조절 필요, 여기선 UTC 기준 03:00 = 한국 12:00)
SELECT cron.schedule('wake-up-dormant-job', '0 3 * * *', 'SELECT wake_up_dormant_users();');
