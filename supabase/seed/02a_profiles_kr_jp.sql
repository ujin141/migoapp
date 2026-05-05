-- MIGO Seed Part 2A: Korean + Japanese Profiles (25명)
DO $$
DECLARE
  u UUID;
BEGIN
  -- === 한국 여성 8명 ===
  SELECT id INTO u FROM auth.users WHERE email='seed_01@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style,user_type)
  VALUES(u,'김서연','seed_01@migo.app','주말마다 새로운 카페 찾아다녀요 ☕ 같이 투어 가실 분?',24,'여성','대한민국','서울 강남구',37.4979,127.0276,ARRAY['한국어','English'],ARRAY['카페','사진','맛집'],'ENFP',true,'free',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80',ARRAY['감성여행','카페투어'],'traveler') ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_02@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style,user_type)
  VALUES(u,'이지은','seed_02@migo.app','한달살이 3번 해봤어요! 다낭 치앙마이 발리 🏝️ 다음은 어디?',26,'여성','대한민국','서울 마포구',37.5536,126.9368,ARRAY['한국어','English'],ARRAY['한달살이','요가','자연'],'INFJ',true,'plus',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&q=80',ARRAY['한달살이','힐링'],'traveler') ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_03@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style,user_type)
  VALUES(u,'박하은','seed_03@migo.app','먹방이 여행의 전부! 🍜 맛집 리스트 공유해요',23,'여성','대한민국','서울 용산구',37.5326,126.9906,ARRAY['한국어'],ARRAY['맛집','쇼핑','야시장'],'ESFP',false,'free',
  'https://images.unsplash.com/photo-1496440737103-cd596325d314?w=600&q=80',ARRAY['맛집투어','쇼핑'],'traveler') ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_04@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style,user_type)
  VALUES(u,'최예진','seed_04@migo.app','사진 찍는 거 좋아해요 📸 서로 찍어줄 여행 친구 구함!',25,'여성','대한민국','서울 성동구',37.5633,127.0371,ARRAY['한국어','English'],ARRAY['사진','건축','카페'],'ISFP',true,'free',
  'https://images.unsplash.com/photo-1502767089025-6572583495f4?w=600&q=80',ARRAY['감성여행','사진'],'traveler') ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_05@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style,user_type)
  VALUES(u,'정수빈','seed_05@migo.app','요가와 명상 좋아하는 자유로운 영혼 🧘‍♀ 느린 여행 즐겨요',27,'여성','대한민국','부산 해운대구',35.1631,129.1636,ARRAY['한국어','English'],ARRAY['요가','명상','자연'],'INFP',true,'premium',
  'https://images.unsplash.com/photo-1515023115894-bacee5e1b8c5?w=600&q=80',ARRAY['힐링','웰니스'],'traveler') ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_06@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style,user_type)
  VALUES(u,'한소율','seed_06@migo.app','워홀 준비 중! 호주 정보 공유하실 분? 🇦🇺',22,'여성','대한민국','서울 관악구',37.4784,126.9516,ARRAY['한국어','English'],ARRAY['워홀','배낭여행','캠핑'],'ENTP',false,'free',
  'https://images.unsplash.com/photo-1519975258993-60b42d1c2ee2?w=600&q=80',ARRAY['배낭여행','어드벤처'],'traveler') ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_07@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style,user_type)
  VALUES(u,'윤다인','seed_07@migo.app','K-뷰티 블로거 ✨ 면세점 쇼핑 같이 갈 사람!',24,'여성','대한민국','서울 송파구',37.5145,127.1059,ARRAY['한국어','English','日本語'],ARRAY['뷰티','쇼핑','카페'],'ESFJ',true,'free',
  'https://randomuser.me/api/portraits/women/33.jpg',ARRAY['쇼핑','럭셔리'],'traveler') ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_08@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style,user_type)
  VALUES(u,'송민서','seed_08@migo.app','제주살이 6개월째 🍊 제주 로컬 맛집 다 알아요',28,'여성','대한민국','제주시',33.4996,126.5312,ARRAY['한국어'],ARRAY['카페','자연','드라이브'],'ISFJ',true,'plus',
  'https://randomuser.me/api/portraits/women/45.jpg',ARRAY['로컬투어','힐링'],'local') ON CONFLICT(id) DO NOTHING;

  -- === 한국 남성 7명 ===
  SELECT id INTO u FROM auth.users WHERE email='seed_09@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style,user_type)
  VALUES(u,'장현우','seed_09@migo.app','서핑하다 여행에 빠진 사람 🏄 같이 바다 보러 갈래요?',27,'남성','대한민국','양양군',38.0753,128.6189,ARRAY['한국어','English'],ARRAY['서핑','캠핑','자연'],'ESTP',true,'free',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&q=80',ARRAY['액티비티','서핑'],'traveler') ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_10@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style,user_type)
  VALUES(u,'김도윤','seed_10@migo.app','배낭여행 15개국 🎒 여행 팁 무한 공유합니다',29,'남성','대한민국','서울 종로구',37.5735,126.9790,ARRAY['한국어','English','Español'],ARRAY['배낭여행','역사','문화'],'ENTP',true,'free',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&q=80',ARRAY['배낭여행','문화탐방'],'traveler') ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_11@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style,user_type)
  VALUES(u,'이준혁','seed_11@migo.app','프리랜서라 시간 자유! 평일 여행도 OK ✈️',26,'남성','대한민국','서울 강서구',37.5509,126.8495,ARRAY['한국어','English'],ARRAY['디지털노마드','카페','코워킹'],'INTJ',true,'premium',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=600&q=80',ARRAY['디지털노마드','자유여행'],'traveler') ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_12@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style,user_type)
  VALUES(u,'박시우','seed_12@migo.app','등산과 캠핑 좋아하는 아웃도어맨 ⛰️ 같이 트레킹!',30,'남성','대한민국','서울 노원구',37.6543,127.0568,ARRAY['한국어'],ARRAY['등산','캠핑','트레킹'],'ISTJ',false,'free',
  'https://randomuser.me/api/portraits/men/22.jpg',ARRAY['트레킹','캠핑'],'traveler') ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_13@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style,user_type)
  VALUES(u,'오태민','seed_13@migo.app','크래프트 맥주 탐방 중 🍺 세계 맥주 마시러 다녀요',28,'남성','대한민국','서울 영등포구',37.5264,126.8963,ARRAY['한국어','English'],ARRAY['맥주','맛집','펍'],'ENFJ',true,'free',
  'https://randomuser.me/api/portraits/men/35.jpg',ARRAY['맛집투어','펍크롤'],'traveler') ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_14@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style,user_type)
  VALUES(u,'유민재','seed_14@migo.app','부산 로컬입니다 😎 광안리 맛집 다 알아요!',31,'남성','대한민국','부산 수영구',35.1454,129.1130,ARRAY['한국어','English'],ARRAY['맛집','오션뷰','드라이브'],'ESTJ',true,'plus',
  'https://randomuser.me/api/portraits/men/48.jpg',ARRAY['로컬투어','드라이브'],'local') ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_15@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style,user_type)
  VALUES(u,'강지호','seed_15@migo.app','야경 사진 전문 📷 서울부터 유럽까지 야경 투어',25,'남성','대한민국','서울 중구',37.5641,126.9979,ARRAY['한국어','English'],ARRAY['사진','야경','건축'],'INTP',true,'free',
  'https://randomuser.me/api/portraits/men/55.jpg',ARRAY['감성여행','사진'],'traveler') ON CONFLICT(id) DO NOTHING;

  -- === 일본 여성 5명 ===
  SELECT id INTO u FROM auth.users WHERE email='seed_16@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style,user_type)
  VALUES(u,'佐藤 美咲','seed_16@migo.app','東京でカフェ巡りしてます☕ 韓国のカフェも大好き！一緒に行きましょう',24,'여성','일본','Tokyo, Japan',35.6762,139.6503,ARRAY['日本語','English','한국어'],ARRAY['카페','스위츠','사진'],'ENFP',true,'free',
  'https://randomuser.me/api/portraits/women/51.jpg',ARRAY['카페투어','감성여행'],'traveler') ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_17@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style,user_type)
  VALUES(u,'田中 花','seed_17@migo.app','京都で着物レンタルしませんか？🌸 寺院巡り好きです',23,'여성','일본','Kyoto, Japan',35.0116,135.7681,ARRAY['日本語','English'],ARRAY['역사','사찰','기모노'],'ISFJ',true,'premium',
  'https://randomuser.me/api/portraits/women/57.jpg',ARRAY['문화탐방','역사'],'traveler') ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_18@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style,user_type)
  VALUES(u,'Yuki','seed_18@migo.app','大阪のストリートフード最高！🍜 食べ歩き仲間募集中',26,'여성','일본','Osaka, Japan',34.6937,135.5023,ARRAY['日本語','English'],ARRAY['맛집','야시장','먹방'],'ESFP',true,'free',
  'https://randomuser.me/api/portraits/women/63.jpg',ARRAY['맛집투어','로컬체험'],'traveler') ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_19@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style,user_type)
  VALUES(u,'Mana','seed_19@migo.app','ダイビングとビーチが大好き🤿 沖縄からバリまで！',25,'여성','일본','Okinawa, Japan',26.3344,127.8056,ARRAY['日本語','English'],ARRAY['다이빙','해변','스노클링'],'ESTP',false,'free',
  'https://randomuser.me/api/portraits/women/69.jpg',ARRAY['액티비티','해변'],'traveler') ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_20@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style,user_type)
  VALUES(u,'Rin','seed_20@migo.app','ソウルに留学中です🇰🇷 週末一緒にお出かけしたい！',22,'여성','일본','서울 서대문구',37.5791,126.9368,ARRAY['日本語','한국어','English'],ARRAY['카페','쇼핑','K-POP'],'ENFJ',true,'free',
  'https://randomuser.me/api/portraits/women/75.jpg',ARRAY['쇼핑','문화탐방'],'traveler') ON CONFLICT(id) DO NOTHING;

  -- === 일본 남성 3명 ===
  SELECT id INTO u FROM auth.users WHERE email='seed_21@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style,user_type)
  VALUES(u,'Ryo','seed_21@migo.app','カメラマンです📸 ポートレート撮らせてください！旅先の写真も◎',27,'남성','일본','Tokyo, Japan',35.6895,139.6917,ARRAY['日本語','English'],ARRAY['사진','예술','영화'],'INFP',true,'free',
  'https://randomuser.me/api/portraits/men/61.jpg',ARRAY['감성여행','사진'],'traveler') ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_22@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style,user_type)
  VALUES(u,'Haruto','seed_22@migo.app','サーフィンとラーメン巡りが趣味🏄‍♂️🍜 湘南から来ました',28,'남성','일본','Kamakura, Japan',35.3192,139.5466,ARRAY['日本語','English'],ARRAY['서핑','라멘','자연'],'ISTP',true,'premium',
  'https://randomuser.me/api/portraits/men/67.jpg',ARRAY['액티비티','맛집투어'],'traveler') ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_23@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style,user_type)
  VALUES(u,'Sota','seed_23@migo.app','福岡在住のバリスタ☕ 世界中のコーヒーショップを巡りたい',26,'남성','일본','Fukuoka, Japan',33.5904,130.4017,ARRAY['日本語','한국어'],ARRAY['커피','바리스타','카페'],'INFJ',true,'free',
  'https://randomuser.me/api/portraits/men/73.jpg',ARRAY['카페투어','로컬체험'],'traveler') ON CONFLICT(id) DO NOTHING;

  RAISE NOTICE '✅ Part 2A: 한국 15명 + 일본 8명 프로필 완료';
END $$;
