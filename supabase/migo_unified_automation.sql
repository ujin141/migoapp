-- ============================================================================
-- MIGO MONETIZATION & AUTOMATION UNIFIED SCRIPT
-- 이 스크립트는 기존의 '가입 즉시 15개 가짜 좋아요' 기능을 삭제하고,
-- 1. 주기적인 가짜 좋아요(Drip Likes) 발송 시스템
-- 2. 가짜 유저의 여행 피드(Drip Posts) 자동 업로드 및 50회 조회수 제한(소멸)
-- 기능을 모두 포함하는 통합 SQL 스크립트입니다.
-- ============================================================================

-- ============================================================================
-- PART 1: 기존 "Welcome Likes" 스팸 제거
-- ============================================================================
-- 가입 즉시 쏟아지는 가짜 좋아요 생성 트리거 및 함수 삭제
DROP TRIGGER IF EXISTS trg_welcome_likes ON profiles;
DROP FUNCTION IF EXISTS auto_generate_welcome_likes();

-- (선택 사항) 테스트 계정(@migo.app)이 보낸 모든 좋아요 삭제를 원하시면 아래 주석을 해제하세요.
-- DELETE FROM likes WHERE from_user IN (SELECT id FROM profiles WHERE email LIKE '%@migo.app');

-- pg_cron 익스텐션 활성화 (Supabase 백그라운드 스케줄러)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- PART 2: 게시물 조회수 추적 및 자동 소멸 (View Tracking)
-- ============================================================================
-- posts 테이블에 컬럼 보강 (tags, view_count, max_views)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS max_views INTEGER DEFAULT NULL;

-- 게시물 조회수 일괄 증가 및 한도(max_views) 도달 시 자동 숨김 처리 RPC
CREATE OR REPLACE FUNCTION increment_post_views(p_ids UUID[])
RETURNS void AS $$
BEGIN
  -- 전달받은 ID 배열에 해당하는 게시물의 조회수를 1 증가
  UPDATE public.posts
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = ANY(p_ids);

  -- 증가된 조회수가 최대 조회수에 도달하거나 초과했다면 알고리즘 및 지도에서 숨김 처리
  UPDATE public.posts
  SET hidden = true
  WHERE id = ANY(p_ids)
    AND max_views IS NOT NULL
    AND COALESCE(view_count, 0) >= max_views
    AND hidden = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 3: Drip Likes (결제 유도용 가짜 좋아요 봇)
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_drip_likes()
RETURNS void AS $$
DECLARE
  real_user RECORD;
  mock_id UUID;
  new_like_count INTEGER := 0;
BEGIN
  -- 최근 로그인 한 '무료' 실제 유저 중 최대 100명을 랜덤으로 선택 (결제 유도 타겟)
  FOR real_user IN
    SELECT id, name
    FROM profiles
    WHERE email NOT LIKE '%@migo.app'         -- 실제 유저
      AND (plan IS NULL OR plan = 'free')     -- 구독하지 않은 유저
      AND (is_plus IS NULL OR is_plus = false)-- Plus 권한이 없는 유저
    ORDER BY random()
    LIMIT 100
  LOOP
    -- 해당 유저에게 아직 좋아요를 보내지 않은 가짜 유저(mock) 1명을 랜덤하게 선택
    SELECT id INTO mock_id
    FROM profiles
    WHERE email LIKE '%@migo.app'
      AND id != real_user.id
      AND name IS NOT NULL 
      AND trim(name) != ''
      AND NOT EXISTS (
        SELECT 1 FROM likes 
        WHERE from_user = profiles.id AND to_user = real_user.id
      )
    ORDER BY random()
    LIMIT 1;

    -- 가짜 유저가 선정되었다면 좋아요 전송
    IF mock_id IS NOT NULL THEN
      -- likes 테이블에 좋아요 인서트
      INSERT INTO likes(from_user, to_user, kind, created_at)
      VALUES (mock_id, real_user.id, 'like', NOW())
      ON CONFLICT DO NOTHING;

      -- 인앱 알림 생성 (앱 상단/알림 탭에 노출되어 앱 접속 및 결제 유도)
      INSERT INTO in_app_notifications(user_id, title, content, type)
      VALUES (
        real_user.id,
        '새로운 좋아요 도착! 💕',
        '새로운 누군가 회원님을 좋아합니다. 프로필을 확인해보세요!',
        'like'
      );
      
      new_like_count := new_like_count + 1;
    END IF;
  END LOOP;
  
  -- Supabase 로그에 생성된 수량 기록
  RAISE LOG 'Generated % drip likes to induce monetization.', new_like_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 likes 스케줄 삭제
DO $$ BEGIN PERFORM cron.unschedule('drip-likes-job'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
-- 1시간마다 실행되도록 스케줄 등록 ('0 * * * *')
SELECT cron.schedule('drip-likes-job', '0 * * * *', 'SELECT generate_drip_likes();');

-- ============================================================================
-- PART 4: Drip Posts (지도/커뮤니티 활성화 여행 피드 봇)
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_drip_posts()
RETURNS void AS $$
DECLARE
  mock_user RECORD;
  post_content TEXT;
  random_photo TEXT;
  loc_tag TEXT;
  
  -- 가짜 메시지 풀 (자연스러운 피드)
  messages TEXT[] := ARRAY[
    'Loving the vibes here! ☀️ 날씨 너무 좋아요',
    'Found a hidden gem today 📸 완전 숨겨진 명소 발견!',
    'Who wants to grab a coffee nearby? ☕ 근처에서 커피 한 잔 하실 분?',
    'The weather is absolutely perfect for a walk! 🚶 산책하기 딱 좋은 날씨네요',
    'Any good restaurant recommendations around here? 🍽️ 이 근처 찐맛집 아시는 분?',
    'Just arrived! What should I do first? 🎒 방금 도착했어요! 뭐부터 할까요?',
    'Beautiful sunset view from here 🌅 여기서 보는 노을 최고입니다',
    'Nightlife in this area is amazing 🍻 밤 분위기 미쳤네요 같이 노실 분!',
    'Exploring the local streets 🚶‍♂️ 골목골목 구경하는 재미가 있네요',
    'Best trip ever! ✨ 이번 여행 진짜 레전드입니다'
  ];
  
  -- 랜덤 이미지 풀 (감성 사진 또는 사진 없이)
  photos TEXT[] := ARRAY[
    'https://images.unsplash.com/photo-1506744626753-1fa28f6e5c54?w=800&q=80',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
    'https://images.unsplash.com/photo-1504150558240-0b4fd8946624?w=800&q=80',
    'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&q=80',
    NULL, NULL, NULL -- 일부는 사진 없이 텍스트만 올리도록 자연스럽게 섞음
  ];
BEGIN
  -- 1~2시간 랜덤 텀을 주기 위해 50% 확률로 이번 턴을 건너뜀
  IF random() < 0.5 THEN
    RETURN;
  END IF;

  -- 위치 정보(lat, lng)가 있는 가짜 유저(mock) 1명을 랜덤하게 선택
  SELECT id, name, location, lat, lng 
  INTO mock_user
  FROM profiles
  WHERE email LIKE '%@migo.app'
    AND lat IS NOT NULL 
    AND lng IS NOT NULL
    AND name IS NOT NULL 
    AND trim(name) != ''
  ORDER BY random()
  LIMIT 1;

  IF mock_user.id IS NOT NULL THEN
    post_content := messages[floor(random() * array_length(messages, 1) + 1)];
    random_photo := photos[floor(random() * array_length(photos, 1) + 1)];
    
    -- 위치 태그 생성 (형식: _loc_:{lat}:{lng}:{locationName})
    loc_tag := '_loc_:' || mock_user.lat || ':' || mock_user.lng || ':' || COALESCE(mock_user.location, 'Unknown');

    -- 포스트 삽입 (50회 조회 한도 적용)
    INSERT INTO posts (
      author_id,
      title,
      content,
      image_url,
      tags,
      view_count,
      max_views,
      created_at
    ) VALUES (
      mock_user.id,
      mock_user.name || '님의 여행 기록',
      post_content,
      random_photo,
      ARRAY['여행', '일상', loc_tag],
      0,  -- 초기 조회수 0
      50, -- 50명 노출 한도
      NOW()
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 posts 스케줄 삭제
DO $$ BEGIN PERFORM cron.unschedule('drip-posts-job'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
-- 매시 정각에 실행되도록 스케줄 등록 (실제 작성은 랜덤 50%이므로 1~2시간 텀)
SELECT cron.schedule('drip-posts-job', '0 * * * *', 'SELECT generate_drip_posts()');

-- ============================================================================
-- PART 5: Dormant User Wake-up Bot (휴면 유저 저격 봇)
-- ============================================================================
-- 3일 이상 접속하지 않은(last_seen < 3일) 유저를 찾아
-- 가짜 유저(봇)가 좋아요를 보내서 푸시/이메일 알림을 유발해 앱으로 복귀시킵니다.

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
    FROM public.profiles AS p
    INNER JOIN public.online_status AS o ON p.id = o.user_id
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
      AND name IS NOT NULL 
      AND trim(name) != ''
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
SELECT cron.schedule('wake-up-dormant-job', '0 3 * * *', 'SELECT wake_up_dormant_users()');

-- ============================================================================
-- PART 6: Initial Cleanup (일회성 데이터 정리)
-- ============================================================================
-- 1. 닉네임이 없는 봇이 과거에 작성한 '알수없음' 피드 모두 삭제
DELETE FROM public.posts
WHERE author_id IN (
    SELECT id FROM public.profiles 
    WHERE email LIKE '%@migo.app' 
      AND (name IS NULL OR trim(name) = '')
);

-- 2. 닉네임이 없는 봇 계정들에게 무작위 기본 닉네임 부여해두기
UPDATE public.profiles
SET name = '여행자' || floor(random() * 10000)::text
WHERE email LIKE '%@migo.app' 
  AND (name IS NULL OR trim(name) = '');
