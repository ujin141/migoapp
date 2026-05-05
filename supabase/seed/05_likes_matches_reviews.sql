-- MIGO Seed Part 5: Likes toward main user + Matches + Reviews

-- ─── 0. 사전 필수 작업 (에러 방지) ───────────────────────────────────────────
-- profiles 테이블에 통계 관련 컬럼 누락 시 트리거 오류를 방지하기 위해 강제 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trip_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS no_show_count INTEGER DEFAULT 0;

DO $$
DECLARE
  me UUID; u UUID; t UUID;
  likers TEXT[] := ARRAY[
    'seed_01@migo.app','seed_02@migo.app','seed_04@migo.app','seed_05@migo.app',
    'seed_07@migo.app','seed_16@migo.app','seed_17@migo.app','seed_20@migo.app',
    'seed_24@migo.app','seed_34@migo.app','seed_40@migo.app','seed_42@migo.app',
    'seed_43@migo.app','seed_47@migo.app','seed_55@migo.app'
  ];
  matcher_emails TEXT[] := ARRAY[
    'seed_01@migo.app','seed_16@migo.app','seed_34@migo.app','seed_40@migo.app','seed_47@migo.app'
  ];
  e TEXT;
BEGIN
  SELECT id INTO me FROM auth.users WHERE email='ujin141@naver.com';
  IF me IS NULL THEN RAISE NOTICE '⚠️ ujin141@naver.com 없음'; RETURN; END IF;

  -- === 15명이 나를 좋아요 ===
  FOREACH e IN ARRAY likers LOOP
    SELECT id INTO u FROM auth.users WHERE email=e;
    IF u IS NOT NULL THEN
      INSERT INTO likes(from_user,to_user,kind) VALUES(u,me,'like') ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- === 5명과 상호 매칭 ===
  FOREACH e IN ARRAY matcher_emails LOOP
    SELECT id INTO u FROM auth.users WHERE email=e;
    IF u IS NOT NULL THEN
      -- 내가 상대를 좋아요
      INSERT INTO likes(from_user,to_user,kind) VALUES(me,u,'like') ON CONFLICT DO NOTHING;
      -- 채팅방 생성
      INSERT INTO chat_threads(id,is_group) VALUES(gen_random_uuid(),false) RETURNING id INTO t;
      INSERT INTO chat_members(thread_id,user_id) VALUES(t,me),(t,u) ON CONFLICT DO NOTHING;
      -- 매칭 기록
      INSERT INTO matches(user1_id,user2_id,thread_id) VALUES(LEAST(me,u),GREATEST(me,u),t) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- === Trip Reviews (40개) - 모의 유저 간 상호 리뷰 ===
  -- 한국 유저 리뷰
  SELECT id INTO u FROM auth.users WHERE email='seed_01@migo.app';
  SELECT id INTO t FROM auth.users WHERE email='seed_02@migo.app';
  INSERT INTO trip_reviews(reviewer_id,reviewee_id,rating,tags,comment,destination) VALUES(u,t,5,ARRAY['친절해요','시간약속','대화가 잘 통해요'],'같이 치앙마이 한달살이 너무 재밌었어요! 최고의 동행자 🌟','치앙마이') ON CONFLICT DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_02@migo.app';
  SELECT id INTO t FROM auth.users WHERE email='seed_01@migo.app';
  INSERT INTO trip_reviews(reviewer_id,reviewee_id,rating,tags,comment,destination) VALUES(u,t,5,ARRAY['유머러스','분위기메이커','맛집을 잘 찾아요'],'서연이랑 카페 투어 너무 좋았어요! 카페 찾는 능력 최고 ☕','치앙마이') ON CONFLICT DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_09@migo.app';
  SELECT id INTO t FROM auth.users WHERE email='seed_46@migo.app';
  INSERT INTO trip_reviews(reviewer_id,reviewee_id,rating,tags,comment,destination) VALUES(u,t,5,ARRAY['액티비티 전문가','친절해요','안전의식'],'발리에서 서핑 배웠는데 정말 잘 가르쳐줬어요! 🏄','발리') ON CONFLICT DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_46@migo.app';
  SELECT id INTO t FROM auth.users WHERE email='seed_09@migo.app';
  INSERT INTO trip_reviews(reviewer_id,reviewee_id,rating,tags,comment,destination) VALUES(u,t,4,ARRAY['열정적','분위기메이커','시간약속'],'Great surfing buddy! Very enthusiastic and fun to be with 🤙','발리') ON CONFLICT DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_10@migo.app';
  SELECT id INTO t FROM auth.users WHERE email='seed_60@migo.app';
  INSERT INTO trip_reviews(reviewer_id,reviewee_id,rating,tags,comment,destination) VALUES(u,t,5,ARRAY['지식이 풍부해요','대화가 잘 통해요','역사 전문가'],'역사 이야기 들으면서 다니니까 여행이 10배 재밌어졌어요!','경주') ON CONFLICT DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_16@migo.app';
  SELECT id INTO t FROM auth.users WHERE email='seed_07@migo.app';
  INSERT INTO trip_reviews(reviewer_id,reviewee_id,rating,tags,comment,destination) VALUES(u,t,5,ARRAY['친절해요','쇼핑 전문가','유머러스'],'一緒にショッピングして楽しかった！韓国の化粧品おすすめたくさん教えてくれた ✨','서울') ON CONFLICT DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_24@migo.app';
  SELECT id INTO t FROM auth.users WHERE email='seed_27@migo.app';
  INSERT INTO trip_reviews(reviewer_id,reviewee_id,rating,tags,comment,destination) VALUES(u,t,5,ARRAY['맛집을 잘 찾아요','요리 실력 최고','대화가 잘 통해요'],'Giulia knows the best restaurants! Carbonara was perfetta! 🍝','로마') ON CONFLICT DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_34@migo.app';
  SELECT id INTO t FROM auth.users WHERE email='seed_39@migo.app';
  INSERT INTO trip_reviews(reviewer_id,reviewee_id,rating,tags,comment,destination) VALUES(u,t,4,ARRAY['맛집을 잘 찾아요','유머러스','분위기메이커'],'Ryan showed me the best 포장마차 in Seoul! 🥟 So fun!','서울') ON CONFLICT DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_40@migo.app';
  SELECT id INTO t FROM auth.users WHERE email='seed_44@migo.app';
  INSERT INTO trip_reviews(reviewer_id,reviewee_id,rating,tags,comment,destination) VALUES(u,t,5,ARRAY['맛집을 잘 찾아요','로컬 전문가','친절해요'],'Krit is the best food guide! Real local experience 🍜','방콕') ON CONFLICT DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_37@migo.app';
  SELECT id INTO t FROM auth.users WHERE email='seed_42@migo.app';
  INSERT INTO trip_reviews(reviewer_id,reviewee_id,rating,tags,comment,destination) VALUES(u,t,5,ARRAY['웰니스 전문가','차분해요','힐링'],'Mei''s yoga session changed my life! 🧘 So peaceful','발리') ON CONFLICT DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_03@migo.app';
  SELECT id INTO t FROM auth.users WHERE email='seed_05@migo.app';
  INSERT INTO trip_reviews(reviewer_id,reviewee_id,rating,tags,comment,destination) VALUES(u,t,4,ARRAY['차분해요','힐링','대화가 잘 통해요'],'같이 부산 여행 너무 힐링이었어요! 요가도 알려줘서 감사 🧘‍♀','부산') ON CONFLICT DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_05@migo.app';
  SELECT id INTO t FROM auth.users WHERE email='seed_03@migo.app';
  INSERT INTO trip_reviews(reviewer_id,reviewee_id,rating,tags,comment,destination) VALUES(u,t,5,ARRAY['맛집을 잘 찾아요','유머러스','에너지 넘쳐요'],'하은이 덕분에 부산 맛집 다 정복했어요! 먹방 여행 최고 🍜','부산') ON CONFLICT DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_25@migo.app';
  SELECT id INTO t FROM auth.users WHERE email='seed_33@migo.app';
  INSERT INTO trip_reviews(reviewer_id,reviewee_id,rating,tags,comment,destination) VALUES(u,t,5,ARRAY['액티비티 전문가','분위기메이커','친절해요'],'Pablo is an amazing surf buddy! ¡Fue increíble! 🏄','발리') ON CONFLICT DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_47@migo.app';
  SELECT id INTO t FROM auth.users WHERE email='seed_50@migo.app';
  INSERT INTO trip_reviews(reviewer_id,reviewee_id,rating,tags,comment,destination) VALUES(u,t,5,ARRAY['사진 실력 최고','대화가 잘 통해요','친절해요'],'浩然拍的照片太好看了！帮我拍了好多美照 📸','서울') ON CONFLICT DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_52@migo.app';
  SELECT id INTO t FROM auth.users WHERE email='seed_12@migo.app';
  INSERT INTO trip_reviews(reviewer_id,reviewee_id,rating,tags,comment,destination) VALUES(u,t,5,ARRAY['등산 전문가','안전의식','체력 좋아요'],'Best hiking buddy! 시우 knew every trail on Bukhansan ⛰️','서울') ON CONFLICT DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_41@migo.app';
  SELECT id INTO t FROM auth.users WHERE email='seed_45@migo.app';
  INSERT INTO trip_reviews(reviewer_id,reviewee_id,rating,tags,comment,destination) VALUES(u,t,4,ARRAY['로컬 전문가','드라이빙 실력','모험심'],'Minh''s motorbike tour was unforgettable! 🏍️ So exciting!','호치민') ON CONFLICT DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_55@migo.app';
  SELECT id INTO t FROM auth.users WHERE email='seed_07@migo.app';
  INSERT INTO trip_reviews(reviewer_id,reviewee_id,rating,tags,comment,destination) VALUES(u,t,5,ARRAY['쇼핑 전문가','친절해요','한국어 도움'],'다인 helped me find the best K-beauty products! So sweet 💕','서울') ON CONFLICT DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_30@migo.app';
  SELECT id INTO t FROM auth.users WHERE email='seed_04@migo.app';
  INSERT INTO trip_reviews(reviewer_id,reviewee_id,rating,tags,comment,destination) VALUES(u,t,5,ARRAY['사진 실력 최고','감성적','시간약속'],'예진 is a great photography partner! Such a good eye 📸','서울') ON CONFLICT DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_28@migo.app';
  SELECT id INTO t FROM auth.users WHERE email='seed_31@migo.app';
  INSERT INTO trip_reviews(reviewer_id,reviewee_id,rating,tags,comment,destination) VALUES(u,t,5,ARRAY['요리 실력 최고','맛집을 잘 찾아요','유머러스'],'Marco cooked us Italian dinner in Seoul! Best carbonara ever! 🍝','서울') ON CONFLICT DO NOTHING;

  -- 나(main user)에 대한 리뷰
  SELECT id INTO u FROM auth.users WHERE email='seed_01@migo.app';
  INSERT INTO trip_reviews(reviewer_id,reviewee_id,rating,tags,comment,destination) VALUES(u,me,5,ARRAY['친절해요','분위기메이커','대화가 잘 통해요'],'같이 여행하면 시간 가는 줄 몰라요! 최고의 동행자 ⭐','서울') ON CONFLICT DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_16@migo.app';
  INSERT INTO trip_reviews(reviewer_id,reviewee_id,rating,tags,comment,destination) VALUES(u,me,5,ARRAY['시간약속','유머러스','맛집을 잘 찾아요'],'一緒に旅行して最高でした！また行きたい！🌟','도쿄') ON CONFLICT DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_34@migo.app';
  INSERT INTO trip_reviews(reviewer_id,reviewee_id,rating,tags,comment,destination) VALUES(u,me,4,ARRAY['대화가 잘 통해요','친절해요','유머러스'],'Such a fun travel buddy! Made the whole trip 10x better 😄','서울') ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Part 5: 좋아요 15개 + 매칭 5개 + 리뷰 21개 완료';
END $$;
