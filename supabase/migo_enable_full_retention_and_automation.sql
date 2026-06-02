-- ============================================================================
-- MIGO AUTOMATION & RETENTION ENGAGEMENT ENGINE
-- 이 스크립트는 Migo 앱의 리텐션(재방문율)을 극대화하기 위해
-- 백그라운드 봇 자동화 및 리텐션 푸시 스케줄링을 활성화하는 통합 SQL 스크립트입니다.
-- Supabase Dashboard > SQL Editor에 복사하여 실행하세요.
-- ============================================================================

-- 0. pg_cron 익스텐션 활성화 (Supabase 백그라운드 스케줄러)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- PART 1: 봇 자동화 스케줄링 설정 (likes, posts, dormant 유저 깨우기)
-- ============================================================================

-- A. Drip Likes (결제 유도 및 매일 접속 유도용 가짜 좋아요 봇)
-- 1시간마다 실행되도록 스케줄 등록
DO $$
BEGIN
  PERFORM cron.unschedule('drip-likes-job');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule('drip-likes-job', '0 * * * *', 'SELECT generate_drip_likes();');


-- B. Drip Posts (지도/커뮤니티 실시간 활성화 여행 피드 봇)
-- 1시간마다 실행되도록 스케줄 등록 (실제 작성은 내부 함수에서 50% 확률로 실행하여 자연스러운 간격 유지)
DO $$
BEGIN
  PERFORM cron.unschedule('drip-posts-job');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule('drip-posts-job', '0 * * * *', 'SELECT generate_drip_posts();');


-- C. Dormant User Wake-up (휴면 유저 저격 봇)
-- 3일 이상 미접속한 실제 유저에게 가짜 좋아요를 발송하여 복귀 푸시 유발
-- 매일 낮 12:00 정각에 실행되도록 예약 (UTC 03:00 = 한국 시간 KST 12:00)
DO $$
BEGIN
  PERFORM cron.unschedule('wake-up-dormant-job');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule('wake-up-dormant-job', '0 3 * * *', 'SELECT wake_up_dormant_users();');


-- ============================================================================
-- PART 2: 미접속 유저 단계별 리텐션 푸시 활성화
-- ============================================================================

-- D. Retention Pushes (단계별 미접속 자동 알림)
-- 3시간 / 24시간 / 48시간 / 72시간(보상 포함) / 7일 미접속자 자동 추적 및 푸시 발송
-- 매시간 정각에 실행되도록 스케줄 등록
DO $$
BEGIN
  PERFORM cron.unschedule('retention-push');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule('retention-push', '0 * * * *', 'SELECT send_retention_pushes();');


-- E. Streak Break Prevention (연속 접속 유지 유도 푸시)
-- 3일 이상 연속 출석하다가 오늘 아직 출석체크를 안 한 유저 대상
-- 매일 아침 9:00 정각에 실행되도록 예약 (UTC 00:00 = 한국 시간 KST 09:00)
DO $$
BEGIN
  PERFORM cron.unschedule('streak-break-notify');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule('streak-break-notify', '0 0 * * *', 'SELECT notify_streak_break();');


-- ============================================================================
-- PART 3: 초기 데이터 정리 및 무작위 닉네임 부여 (스팸성 제거)
-- ============================================================================
-- 1. 과거에 닉네임이 없는 봇이 작성해 오류가 났던 '알수없음' 피드 정리
DELETE FROM public.posts
WHERE author_id IN (
    SELECT id FROM public.profiles 
    WHERE email LIKE '%@migo.app' 
      AND (name IS NULL OR trim(name) = '')
);

-- 2. 닉네임이 비어있는 봇 계정들에 자연스러운 기본 이름 부여
UPDATE public.profiles
SET name = '여행자_' || floor(random() * 10000)::text
WHERE email LIKE '%@migo.app' 
  AND (name IS NULL OR trim(name) = '');

-- 실행 성공 리포트
SELECT 
  j.jobname, 
  j.schedule, 
  j.command 
FROM cron.job j
WHERE j.jobname IN ('drip-likes-job', 'drip-posts-job', 'wake-up-dormant-job', 'retention-push', 'streak-break-notify');
