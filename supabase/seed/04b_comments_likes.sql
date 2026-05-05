-- MIGO Seed Part 4B: Comments + Post Likes
-- 최근 게시글에 댓글과 좋아요 추가
DO $$
DECLARE
  pid UUID; uid UUID;
  post_ids UUID[];
BEGIN
  -- 최근 게시글 ID 수집 (최대 20개)
  SELECT array_agg(id ORDER BY created_at DESC) INTO post_ids
  FROM (SELECT id, created_at FROM posts LIMIT 20) sub;

  IF post_ids IS NULL OR array_length(post_ids,1) < 5 THEN
    RAISE NOTICE '⚠️ 게시글이 충분하지 않습니다. 04a_posts.sql을 먼저 실행하세요';
    RETURN;
  END IF;

  -- 댓글 삽입 (각 게시글에 2~3개씩)
  SELECT id INTO uid FROM auth.users WHERE email='seed_02@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[1],uid,'완전 공감! 저도 가보고 싶어요 😍');
  SELECT id INTO uid FROM auth.users WHERE email='seed_16@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[1],uid,'いいですね！場所教えてください！');
  SELECT id INTO uid FROM auth.users WHERE email='seed_34@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[1],uid,'Looks amazing! Count me in! 🙋‍♀️');

  SELECT id INTO uid FROM auth.users WHERE email='seed_04@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[2],uid,'서핑 배우고 싶었는데! 다음에 같이 가요 🏄');
  SELECT id INTO uid FROM auth.users WHERE email='seed_46@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[2],uid,'Great waves there! I can give you some tips 🤙');

  SELECT id INTO uid FROM auth.users WHERE email='seed_01@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[3],uid,'도쿄 카페 너무 좋죠! 한국 카페도 추천해드릴게요 ☕');
  SELECT id INTO uid FROM auth.users WHERE email='seed_20@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[3],uid,'表参道大好き！韓国のカフェもおすすめですよ🥰');

  SELECT id INTO uid FROM auth.users WHERE email='seed_27@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[4],uid,'Paris is the best! I miss it so much 🥺');
  SELECT id INTO uid FROM auth.users WHERE email='seed_10@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[4],uid,'파리 여행 계획 중인데 리스트 공유해주세요!');

  SELECT id INTO uid FROM auth.users WHERE email='seed_44@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[5],uid,'Yes! That place is legendary! 🍗');
  SELECT id INTO uid FROM auth.users WHERE email='seed_03@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[5],uid,'방콕 야시장 너무 가고 싶어요! 위치 알려주세요 🙏');
  SELECT id INTO uid FROM auth.users WHERE email='seed_38@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[5],uid,'40 baht?! That is insanely cheap! Going tomorrow!');

  SELECT id INTO uid FROM auth.users WHERE email='seed_05@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[6],uid,'부산 일출 정말 예쁘죠! 🌅 광안리도 추천해요');

  SELECT id INTO uid FROM auth.users WHERE email='seed_52@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[7],uid,'I love Itaewon rooftop bars! Which one is it? 🍸');
  SELECT id INTO uid FROM auth.users WHERE email='seed_30@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[7],uid,'Friday sounds perfect! I''m in! 🙋‍♂️');

  SELECT id INTO uid FROM auth.users WHERE email='seed_15@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[8],uid,'사진 진짜 예쁘네요! 같이 출사 가고 싶어요 📸');

  SELECT id INTO uid FROM auth.users WHERE email='seed_07@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[9],uid,'弘大 진짜 좋죠! 광장시장 삼겹살 추천해요! 🥩');
  SELECT id INTO uid FROM auth.users WHERE email='seed_31@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[9],uid,'Welcome to Seoul! Try 광장시장 for the best 빈대떡!');

  SELECT id INTO uid FROM auth.users WHERE email='seed_33@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[10],uid,'Barcelona is amazing! Best tapas in the world 🇪🇸');

  SELECT id INTO uid FROM auth.users WHERE email='seed_11@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[11],uid,'치앙마이 코워킹 정보 감사해요! 저도 갈 예정이에요 💻');
  SELECT id INTO uid FROM auth.users WHERE email='seed_35@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[11],uid,'Punspace is also great! Highly recommend it 👍');

  SELECT id INTO uid FROM auth.users WHERE email='seed_06@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[13],uid,'꿀팁 감사해요! 배낭여행 준비 중인데 도움 많이 됐어요 🎒');

  SELECT id INTO uid FROM auth.users WHERE email='seed_19@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[14],uid,'ウブドのヨガ最高ですよね！🧘‍♀️ 私も行きたい！');

  SELECT id INTO uid FROM auth.users WHERE email='seed_39@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[15],uid,'As a chef I totally agree! Korean BBQ is next level 🔥');

  SELECT id INTO uid FROM auth.users WHERE email='seed_54@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[17],uid,'Try 엽떡! Even spicier than 불닭 🌶️😂');
  SELECT id INTO uid FROM auth.users WHERE email='seed_40@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[17],uid,'Thai food is spicy too but Korean spicy is different! Love it 🔥');

  SELECT id INTO uid FROM auth.users WHERE email='seed_09@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[18],uid,'야경 사진 대박이네요! 같이 출사 가요 📷');

  SELECT id INTO uid FROM auth.users WHERE email='seed_47@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[19],uid,'我也想试试！看起来太好喝了 ☕');

  SELECT id INTO uid FROM auth.users WHERE email='seed_43@migo.app';
  INSERT INTO comments(post_id,author_id,text) VALUES(post_ids[20],uid,'Goblin is my favorite drama! 😍 Where exactly is it?');

  -- Post Likes (게시글당 3~8개)
  FOR i IN 1..COALESCE(array_length(post_ids, 1), 0) LOOP
    IF post_ids[i] IS NOT NULL THEN
      SELECT id INTO uid FROM auth.users WHERE email='seed_0'||(1+(i%9))::TEXT||'@migo.app';
      IF uid IS NOT NULL THEN INSERT INTO post_likes(post_id,user_id) VALUES(post_ids[i],uid) ON CONFLICT DO NOTHING; END IF;
      SELECT id INTO uid FROM auth.users WHERE email='seed_'||(10+(i%15))::TEXT||'@migo.app';
      IF uid IS NOT NULL THEN INSERT INTO post_likes(post_id,user_id) VALUES(post_ids[i],uid) ON CONFLICT DO NOTHING; END IF;
      SELECT id INTO uid FROM auth.users WHERE email='seed_'||(30+(i%10))::TEXT||'@migo.app';
      IF uid IS NOT NULL THEN INSERT INTO post_likes(post_id,user_id) VALUES(post_ids[i],uid) ON CONFLICT DO NOTHING; END IF;
      SELECT id INTO uid FROM auth.users WHERE email='seed_'||(40+(i%8))::TEXT||'@migo.app';
      IF uid IS NOT NULL THEN INSERT INTO post_likes(post_id,user_id) VALUES(post_ids[i],uid) ON CONFLICT DO NOTHING; END IF;
    END IF;
  END LOOP;

  RAISE NOTICE '✅ Part 4B: 댓글 30개 + 좋아요 80개 완료';
END $$;
