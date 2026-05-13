-- MIGO Seed Part 1: Create 60 Auth Users
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  _emails TEXT[] := ARRAY[
    'seed_01@migo.app','seed_02@migo.app','seed_03@migo.app','seed_04@migo.app','seed_05@migo.app',
    'seed_06@migo.app','seed_07@migo.app','seed_08@migo.app','seed_09@migo.app','seed_10@migo.app',
    'seed_11@migo.app','seed_12@migo.app','seed_13@migo.app','seed_14@migo.app','seed_15@migo.app',
    'seed_16@migo.app','seed_17@migo.app','seed_18@migo.app','seed_19@migo.app','seed_20@migo.app',
    'seed_21@migo.app','seed_22@migo.app','seed_23@migo.app','seed_24@migo.app','seed_25@migo.app',
    'seed_26@migo.app','seed_27@migo.app','seed_28@migo.app','seed_29@migo.app','seed_30@migo.app',
    'seed_31@migo.app','seed_32@migo.app','seed_33@migo.app','seed_34@migo.app','seed_35@migo.app',
    'seed_36@migo.app','seed_37@migo.app','seed_38@migo.app','seed_39@migo.app','seed_40@migo.app',
    'seed_41@migo.app','seed_42@migo.app','seed_43@migo.app','seed_44@migo.app','seed_45@migo.app',
    'seed_46@migo.app','seed_47@migo.app','seed_48@migo.app','seed_49@migo.app','seed_50@migo.app',
    'seed_51@migo.app','seed_52@migo.app','seed_53@migo.app','seed_54@migo.app','seed_55@migo.app',
    'seed_56@migo.app','seed_57@migo.app','seed_58@migo.app','seed_59@migo.app','seed_60@migo.app'
  ];
  _e TEXT;
BEGIN
  FOREACH _e IN ARRAY _emails LOOP
    IF NOT EXISTS(SELECT 1 FROM auth.users WHERE email=_e) THEN
      INSERT INTO auth.users(id,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data,aud,role,is_super_admin)
      VALUES(gen_random_uuid(),_e,'',NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{}','authenticated','authenticated',false);
    END IF;
  END LOOP;
  RAISE NOTICE '✅ Part 1 완료: Auth 유저 60명 생성';
END $$;
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
-- MIGO Seed Part 2B: Global Profiles (유럽+미국+동남아+기타 37명)
DO $$
DECLARE u UUID;
BEGIN
  -- 유럽 여성 6명
  SELECT id INTO u FROM auth.users WHERE email='seed_24@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Léa','seed_24@migo.app','Parisienne qui adore voyager 🗼 Je cherche des amis pour explorer ensemble!',25,'여성','프랑스','Paris, France',48.8566,2.3522,ARRAY['Français','English'],ARRAY['와인','예술','건축'],'ENFJ',true,'premium','https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&q=80',ARRAY['럭셔리','문화탐방']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_25@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Clara','seed_25@migo.app','Hola! Barcelona local 🌊 Te enseño los mejores tapas bars!',26,'여성','스페인','Barcelona, Spain',41.3874,2.1686,ARRAY['Español','English','Français'],ARRAY['맛집','해변','파티'],'ESFP',true,'free','https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&q=80',ARRAY['로컬체험','파티']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_26@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Anna','seed_26@migo.app','Berlin DJ & traveler 🎧 Always looking for cool spots worldwide',24,'여성','독일','Berlin, Germany',52.5200,13.4050,ARRAY['Deutsch','English'],ARRAY['음악','클럽','예술'],'ENTP',true,'free','https://images.unsplash.com/photo-1554151228-14d9def656e4?w=600&q=80',ARRAY['파티','문화탐방']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_27@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Giulia','seed_27@migo.app','Ciao! Amo la cucina e il vino 🍝🍷 Cerco compagni di viaggio!',27,'여성','이탈리아','Rome, Italy',41.9028,12.4964,ARRAY['Italiano','English'],ARRAY['요리','와인','역사'],'ISFP',true,'premium','https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&q=80',ARRAY['미식투어','역사']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_28@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Emma','seed_28@migo.app','London girl exploring Asia! 🇬🇧 First time in Seoul, show me around?',23,'여성','영국','London, UK',51.5074,-0.1278,ARRAY['English'],ARRAY['카페','쇼핑','펍'],'ESTP',true,'free','https://images.unsplash.com/photo-1485893086445-ed75865251e0?w=600&q=80',ARRAY['배낭여행','로컬체험']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_29@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Elsa','seed_29@migo.app','Swedish minimalist traveler 🇸🇪 Love nature, hiking and fika ☕',25,'여성','스웨덴','Stockholm, Sweden',59.3293,18.0686,ARRAY['Svenska','English'],ARRAY['하이킹','자연','카페'],'INFP',true,'free','https://randomuser.me/api/portraits/women/82.jpg',ARRAY['힐링','자연탐험']) ON CONFLICT(id) DO NOTHING;

  -- 유럽 남성 4명
  SELECT id INTO u FROM auth.users WHERE email='seed_30@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Hugo','seed_30@migo.app','Photographe français basé à Seoul 📸 Je cherche des modèles!',28,'남성','프랑스','서울 이태원',37.5345,126.9946,ARRAY['Français','English','한국어'],ARRAY['사진','예술','카페'],'INFP',true,'premium','https://images.unsplash.com/photo-1504593811423-6dd665756598?w=600&q=80',ARRAY['감성여행','사진']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_31@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Marco','seed_31@migo.app','Italian chef traveling the world for food inspiration 🍕 Let''s cook together!',30,'남성','이탈리아','서울 종로구',37.5729,126.9794,ARRAY['Italiano','English'],ARRAY['요리','맛집','와인'],'ESTJ',true,'free','https://randomuser.me/api/portraits/men/42.jpg',ARRAY['미식투어','문화탐방']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_32@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Felix','seed_32@migo.app','Berliner Techno-Fan auf Weltreise 🎶 Wer zeigt mir die Clubs in Seoul?',26,'남성','독일','서울 홍대',37.5563,126.9237,ARRAY['Deutsch','English'],ARRAY['음악','클럽','맥주'],'ENTP',true,'free','https://randomuser.me/api/portraits/men/29.jpg',ARRAY['파티','로컬체험']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_33@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Pablo','seed_33@migo.app','Surfista español viajando por Asia 🏄 ¿Alguien para surfear en Bali?',27,'남성','스페인','Bali, Indonesia',-8.4095,115.1889,ARRAY['Español','English'],ARRAY['서핑','해변','요가'],'ESTP',true,'free','https://randomuser.me/api/portraits/men/51.jpg',ARRAY['액티비티','서핑']) ON CONFLICT(id) DO NOTHING;

  -- 미국/캐나다 여성 3명
  SELECT id INTO u FROM auth.users WHERE email='seed_34@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Olivia','seed_34@migo.app','NYC girl teaching English in Seoul! 🗽 Weekend trip buddy wanted',25,'여성','미국','서울 강남구',37.5172,127.0473,ARRAY['English','한국어'],ARRAY['카페','브런치','사진'],'ENFJ',true,'free','https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=600&q=80',ARRAY['로컬체험','카페투어']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_35@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Sophie','seed_35@migo.app','Canadian backpacker 🍁 6 months in Asia and loving every minute!',24,'여성','캐나다','Chiang Mai, Thailand',18.7883,98.9853,ARRAY['English','Français'],ARRAY['배낭여행','요가','자연'],'INFP',true,'free','https://randomuser.me/api/portraits/women/36.jpg',ARRAY['배낭여행','힐링']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_36@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Ava','seed_36@migo.app','LA vibes in Tokyo 🌴 Fashion blogger exploring Asian street style',23,'여성','미국','Tokyo, Japan',35.6595,139.7004,ARRAY['English'],ARRAY['패션','쇼핑','카페'],'ESFP',true,'premium','https://randomuser.me/api/portraits/women/41.jpg',ARRAY['쇼핑','감성여행']) ON CONFLICT(id) DO NOTHING;

  -- 미국/캐나다 남성 3명
  SELECT id INTO u FROM auth.users WHERE email='seed_37@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Jake','seed_37@migo.app','Digital nomad from SF 💻 Working from cafes in Bali. Coffee addict ☕',29,'남성','미국','Canggu, Bali',-8.6478,115.1385,ARRAY['English'],ARRAY['디지털노마드','코워킹','커피'],'INTJ',true,'premium','https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80',ARRAY['디지털노마드','카페투어']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_38@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Ethan','seed_38@migo.app','Canadian snowboarder turned travel junkie 🏂 Exploring SE Asia now!',27,'남성','캐나다','Bangkok, Thailand',13.7563,100.5018,ARRAY['English','Français'],ARRAY['스노보드','맥주','어드벤처'],'ESTP',true,'free','https://randomuser.me/api/portraits/men/15.jpg',ARRAY['액티비티','어드벤처']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_39@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Ryan','seed_39@migo.app','Chef from Chicago 🍳 Exploring street food markets across Asia',31,'남성','미국','서울 을지로',37.5660,127.0000,ARRAY['English','한국어'],ARRAY['요리','맛집','야시장'],'ENFP',true,'free','https://randomuser.me/api/portraits/men/20.jpg',ARRAY['미식투어','로컬체험']) ON CONFLICT(id) DO NOTHING;

  -- 동남아 여성 4명
  SELECT id INTO u FROM auth.users WHERE email='seed_40@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Ploy','seed_40@migo.app','สวัสดีค่ะ! Bangkok local guide 🇹🇭 I know the best hidden gems!',24,'여성','태국','Bangkok, Thailand',13.7563,100.5018,ARRAY['ไทย','English'],ARRAY['맛집','야시장','사원'],'ESFJ',true,'free','https://randomuser.me/api/portraits/women/53.jpg',ARRAY['로컬체험','맛집투어']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_41@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Linh','seed_41@migo.app','Xin chào! 🇻🇳 Hanoi coffee lover. Let me show you egg coffee!',23,'여성','베트남','Hanoi, Vietnam',21.0278,105.8342,ARRAY['Tiếng Việt','English'],ARRAY['커피','사진','문화'],'INFJ',true,'free','https://randomuser.me/api/portraits/women/59.jpg',ARRAY['카페투어','문화탐방']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_42@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Mei','seed_42@migo.app','Bali yoga instructor 🧘‍♀ Join my sunrise session in Ubud!',26,'여성','인도네시아','Ubud, Bali',-8.5069,115.2625,ARRAY['Bahasa','English'],ARRAY['요가','명상','건강'],'INFP',true,'premium','https://randomuser.me/api/portraits/women/65.jpg',ARRAY['웰니스','힐링']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_43@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Angel','seed_43@migo.app','Filipina travel vlogger 📹 Exploring Korea for the first time! 🇰🇷',22,'여성','필리핀','서울 명동',37.5636,126.9869,ARRAY['Filipino','English'],ARRAY['브이로그','쇼핑','맛집'],'ENFP',true,'free','https://randomuser.me/api/portraits/women/71.jpg',ARRAY['쇼핑','맛집투어']) ON CONFLICT(id) DO NOTHING;

  -- 동남아 남성 3명
  SELECT id INTO u FROM auth.users WHERE email='seed_44@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Krit','seed_44@migo.app','Thai chef & food tour guide 🍜 Best pad thai in Bangkok, trust me!',28,'남성','태국','Bangkok, Thailand',13.7449,100.5340,ARRAY['ไทย','English'],ARRAY['요리','맛집','야시장'],'ESTJ',true,'free','https://randomuser.me/api/portraits/men/58.jpg',ARRAY['미식투어','로컬체험']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_45@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Minh','seed_45@migo.app','Saigon motorbike tour guy 🏍️ I''ll show you the real Vietnam!',27,'남성','베트남','Ho Chi Minh, Vietnam',10.8231,106.6297,ARRAY['Tiếng Việt','English'],ARRAY['바이크','어드벤처','맛집'],'ESTP',true,'free','https://randomuser.me/api/portraits/men/64.jpg',ARRAY['어드벤처','로컬체험']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_46@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Adi','seed_46@migo.app','Bali surf instructor 🏄 Catch waves with me in Uluwatu!',29,'남성','인도네시아','Uluwatu, Bali',-8.8291,115.0849,ARRAY['Bahasa','English'],ARRAY['서핑','해변','음악'],'ESFP',true,'premium','https://randomuser.me/api/portraits/men/70.jpg',ARRAY['서핑','액티비티']) ON CONFLICT(id) DO NOTHING;

  -- 중화권 5명
  SELECT id INTO u FROM auth.users WHERE email='seed_47@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'小雨','seed_47@migo.app','来自上海的旅行博主 📸 最近在韩国拍Vlog！一起玩吧！',24,'여성','중국','서울 홍대',37.5563,126.9237,ARRAY['中文','English','한국어'],ARRAY['브이로그','사진','카페'],'ENFP',true,'free','https://randomuser.me/api/portraits/women/77.jpg',ARRAY['감성여행','사진']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_48@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'雅婷','seed_48@migo.app','台北女孩環遊世界中 🌏 喜歡咖啡和獨立書店',25,'여성','대만','Taipei, Taiwan',25.0330,121.5654,ARRAY['中文','English','日本語'],ARRAY['카페','독서','문화'],'INFJ',true,'premium','https://randomuser.me/api/portraits/women/83.jpg',ARRAY['문화탐방','카페투어']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_49@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'思琪','seed_49@migo.app','深圳来的程序员 💻 周末喜欢爬山和探店',23,'여성','중국','Shenzhen, China',22.5431,114.0579,ARRAY['中文','English'],ARRAY['하이킹','카페','테크'],'INTJ',false,'free','https://randomuser.me/api/portraits/women/89.jpg',ARRAY['디지털노마드','자연탐험']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_50@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'浩然','seed_50@migo.app','香港攝影師 📷 在首爾找人一起拍街拍！',28,'남성','홍콩','서울 을지로',37.5660,126.9979,ARRAY['中文','English','한국어'],ARRAY['사진','예술','건축'],'ISTP',true,'free','https://randomuser.me/api/portraits/men/76.jpg',ARRAY['감성여행','사진']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_51@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'志偉','seed_51@migo.app','台灣背包客 🎒 走過30國 最愛東南亞！',30,'남성','대만','Da Nang, Vietnam',16.0544,108.2022,ARRAY['中文','English'],ARRAY['배낭여행','역사','맛집'],'ENTP',true,'free','https://randomuser.me/api/portraits/men/82.jpg',ARRAY['배낭여행','문화탐방']) ON CONFLICT(id) DO NOTHING;

  -- 기타 (호주, 브라질, 인도, 터키 등) 9명
  SELECT id INTO u FROM auth.users WHERE email='seed_52@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Chloe','seed_52@migo.app','Aussie girl in Seoul! 🦘 Looking for hiking buddies on weekends',25,'여성','호주','서울 이태원',37.5345,126.9946,ARRAY['English'],ARRAY['하이킹','맥주','브런치'],'ESFP',true,'free','https://randomuser.me/api/portraits/women/91.jpg',ARRAY['자연탐험','로컬체험']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_53@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Luca','seed_53@migo.app','Brazilian DJ on world tour 🎧🇧🇷 Where''s the best nightlife in Asia?',27,'남성','브라질','서울 강남구',37.5172,127.0473,ARRAY['Português','English','Español'],ARRAY['음악','파티','해변'],'ENFP',true,'premium','https://randomuser.me/api/portraits/men/85.jpg',ARRAY['파티','음악']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_54@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Priya','seed_54@migo.app','Indian foodie exploring Korean cuisine! 🍛→🍜 Spicy food challenge?',24,'여성','인도','서울 신촌',37.5596,126.9392,ARRAY['Hindi','English'],ARRAY['맛집','요리','문화'],'ENFJ',true,'free','https://randomuser.me/api/portraits/women/93.jpg',ARRAY['미식투어','문화탐방']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_55@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Elif','seed_55@migo.app','Merhaba! 🇹🇷 Turkish traveler. I love K-dramas and came to visit!',23,'여성','터키','서울 명동',37.5636,126.9869,ARRAY['Türkçe','English'],ARRAY['K-드라마','쇼핑','카페'],'ESFJ',true,'free','https://randomuser.me/api/portraits/women/95.jpg',ARRAY['쇼핑','문화탐방']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_56@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Noah','seed_56@migo.app','Kiwi backpacker 🇳🇿 3 months into my Asia trip! Join me!',26,'남성','뉴질랜드','Chiang Mai, Thailand',18.7883,98.9853,ARRAY['English'],ARRAY['배낭여행','트레킹','맥주'],'ISTP',true,'free','https://randomuser.me/api/portraits/men/88.jpg',ARRAY['배낭여행','어드벤처']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_57@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Fatima','seed_57@migo.app','مرحبا! 🇸🇦 Saudi traveler discovering East Asia for the first time ✨',25,'여성','사우디','서울 잠실',37.5133,127.1001,ARRAY['العربية','English'],ARRAY['쇼핑','럭셔리','카페'],'ISFP',true,'premium','https://randomuser.me/api/portraits/women/97.jpg',ARRAY['럭셔리','쇼핑']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_58@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Carlos','seed_58@migo.app','Argentinian mate lover 🧉 Traveling Asia on a motorcycle!',29,'남성','아르헨티나','Da Nang, Vietnam',16.0544,108.2022,ARRAY['Español','English'],ARRAY['바이크','어드벤처','맥주'],'ESTP',true,'free','https://randomuser.me/api/portraits/men/91.jpg',ARRAY['어드벤처','바이크']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_59@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Zara','seed_59@migo.app','South African safari guide turned Asia explorer 🦁→🐉 Nature lover!',26,'여성','남아공','Siem Reap, Cambodia',13.3671,103.8600,ARRAY['English','Afrikaans'],ARRAY['자연','사진','모험'],'ENFP',true,'free','https://randomuser.me/api/portraits/women/99.jpg',ARRAY['자연탐험','사진']) ON CONFLICT(id) DO NOTHING;

  SELECT id INTO u FROM auth.users WHERE email='seed_60@migo.app';
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url,travel_style) VALUES(u,'Omar','seed_60@migo.app','Egyptian archaeologist on vacation 🏺 Looking for history buffs!',31,'남성','이집트','서울 종로구',37.5735,126.9790,ARRAY['العربية','English'],ARRAY['역사','고고학','문화'],'INTJ',true,'free','https://randomuser.me/api/portraits/men/94.jpg',ARRAY['역사','문화탐방']) ON CONFLICT(id) DO NOTHING;

  RAISE NOTICE '✅ Part 2B: 글로벌 프로필 37명 완료';
END $$;
-- MIGO Seed Part 3: Trip Groups (20개) + Members
DO $$
DECLARE
  u UUID; g UUID;
  host_email TEXT;
BEGIN
  -- Group 1: 제주도 힐링
  SELECT id INTO u FROM auth.users WHERE email='seed_08@migo.app';
  INSERT INTO trip_groups(id,host_id,title,destination,dates,max_members,tags,description,entry_fee,is_premium,cover_image)
  VALUES(gen_random_uuid(),u,'제주 힐링 드라이브 🍊','제주도','5월 10일~13일',4,ARRAY['드라이브','카페','힐링'],'해안도로 드라이브하면서 숨은 카페 찾기! 렌트카는 제가 준비해요',0,false,'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=800&q=80');

  -- Group 2: 오사카 먹방
  SELECT id INTO u FROM auth.users WHERE email='seed_18@migo.app';
  INSERT INTO trip_groups(id,host_id,title,destination,dates,max_members,tags,description,entry_fee,is_premium,cover_image)
  VALUES(gen_random_uuid(),u,'大阪グルメツアー🍜','일본 오사카','5월 15일~19일',5,ARRAY['맛집','야시장','먹방'],'도톤보리부터 쿠로몬 시장까지! 오사카 먹방 완전정복',0,false,'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80');

  -- Group 3: 방콕 야시장
  SELECT id INTO u FROM auth.users WHERE email='seed_40@migo.app';
  INSERT INTO trip_groups(id,host_id,title,destination,dates,max_members,tags,description,entry_fee,is_premium,cover_image)
  VALUES(gen_random_uuid(),u,'Bangkok Night Market Tour 🌙','태국 방콕','5월 12일~16일',6,ARRAY['야시장','맛집','쇼핑'],'로컬이 안내하는 진짜 방콕 야시장! 짜뚜짝, 아시아티크, 탈랏롯파이',0,false,'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80');

  -- Group 4: 발리 서핑+요가
  SELECT id INTO u FROM auth.users WHERE email='seed_46@migo.app';
  INSERT INTO trip_groups(id,host_id,title,destination,dates,max_members,tags,description,entry_fee,is_premium,cover_image)
  VALUES(gen_random_uuid(),u,'Bali Surf & Yoga Retreat 🏄','인도네시아 발리','5월 20일~27일',8,ARRAY['서핑','요가','해변'],'Morning surf at Uluwatu + sunset yoga in Ubud. All levels welcome!',15000,true,'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80');

  -- Group 5: 파리 미술관
  SELECT id INTO u FROM auth.users WHERE email='seed_24@migo.app';
  INSERT INTO trip_groups(id,host_id,title,destination,dates,max_members,tags,description,entry_fee,is_premium,cover_image)
  VALUES(gen_random_uuid(),u,'Paris Art & Wine Tour 🎨🍷','프랑스 파리','6월 1일~7일',4,ARRAY['예술','와인','건축'],'Louvre, Orsay, Montmartre + wine tasting. Je vous guide!',20000,true,'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80');

  -- Group 6: 서울 한강 피크닉
  SELECT id INTO u FROM auth.users WHERE email='seed_01@migo.app';
  INSERT INTO trip_groups(id,host_id,title,destination,dates,max_members,tags,description,entry_fee,is_premium,cover_image)
  VALUES(gen_random_uuid(),u,'한강 치맥 피크닉 🍗🍺','서울 한강','5월 11일',10,ARRAY['피크닉','치맥','한강'],'날씨 좋은 주말! 한강에서 치맥하면서 여행 이야기 나눠요',0,false,'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800&q=80');

  -- Group 7: 다낭 호이안
  SELECT id INTO u FROM auth.users WHERE email='seed_45@migo.app';
  INSERT INTO trip_groups(id,host_id,title,destination,dates,max_members,tags,description,entry_fee,is_premium,cover_image)
  VALUES(gen_random_uuid(),u,'Da Nang & Hoi An Adventure 🏮','베트남 다낭','5월 18일~22일',5,ARRAY['문화','맛집','해변'],'바나힐 + 호이안 야시장 + 미케비치! 오토바이 투어도 가능!',0,false,'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80');

  -- Group 8: 교토 사찰
  SELECT id INTO u FROM auth.users WHERE email='seed_17@migo.app';
  INSERT INTO trip_groups(id,host_id,title,destination,dates,max_members,tags,description,entry_fee,is_premium,cover_image)
  VALUES(gen_random_uuid(),u,'京都寺院めぐり 🌸','일본 교토','5월 25일~28일',4,ARRAY['사찰','역사','기모노'],'金閣寺、伏見稲荷、嵐山を一緒に巡りましょう！着物レンタル付き',5000,false,'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80');

  -- Group 9: 바르셀로나
  SELECT id INTO u FROM auth.users WHERE email='seed_25@migo.app';
  INSERT INTO trip_groups(id,host_id,title,destination,dates,max_members,tags,description,entry_fee,is_premium,cover_image)
  VALUES(gen_random_uuid(),u,'Barcelona Beach & Tapas 🌊','스페인 바르셀로나','6월 5일~10일',5,ARRAY['해변','맛집','건축'],'Sagrada Familia, Gothic Quarter, Barceloneta Beach! ¡Vamos!',0,false,'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80');

  -- Group 10: 부산 여름
  SELECT id INTO u FROM auth.users WHERE email='seed_14@migo.app';
  INSERT INTO trip_groups(id,host_id,title,destination,dates,max_members,tags,description,entry_fee,is_premium,cover_image)
  VALUES(gen_random_uuid(),u,'부산 해운대 서핑+회 🏖️','부산','5월 17일~19일',6,ARRAY['서핑','맛집','해변'],'해운대 서핑 레슨 + 자갈치시장 회 + 광안리 야경! 부산 로컬이 가이드',0,false,'https://images.unsplash.com/photo-1577587230708-187fdbef4d91?w=800&q=80');

  -- Group 11: 치앙마이 디지털노마드
  SELECT id INTO u FROM auth.users WHERE email='seed_37@migo.app';
  INSERT INTO trip_groups(id,host_id,title,destination,dates,max_members,tags,description,entry_fee,is_premium,cover_image)
  VALUES(gen_random_uuid(),u,'Chiang Mai Nomad Meetup 💻','태국 치앙마이','6월 10일~20일',8,ARRAY['디지털노마드','코워킹','카페'],'Work from the best cafes in CM! Weekly meetup + weekend trips included',0,false,'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80');

  -- Group 12: 도쿄 서브컬처
  SELECT id INTO u FROM auth.users WHERE email='seed_16@migo.app';
  INSERT INTO trip_groups(id,host_id,title,destination,dates,max_members,tags,description,entry_fee,is_premium,cover_image)
  VALUES(gen_random_uuid(),u,'東京サブカル巡り 🎌','일본 도쿄','6월 7일~11일',4,ARRAY['애니','게임','쇼핑'],'秋葉原、原宿、下北沢！サブカル好き集まれ～',0,false,'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80');

  -- Group 13: 경주 역사
  SELECT id INTO u FROM auth.users WHERE email='seed_10@migo.app';
  INSERT INTO trip_groups(id,host_id,title,destination,dates,max_members,tags,description,entry_fee,is_premium,cover_image)
  VALUES(gen_random_uuid(),u,'경주 역사 문화 여행 🏛️','경주','5월 24일~26일',5,ARRAY['역사','문화','자전거'],'불국사, 석굴암, 첨성대! 자전거로 돌아보는 천년고도',0,false,'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800&q=80');

  -- Group 14: 런던 펍크롤
  SELECT id INTO u FROM auth.users WHERE email='seed_28@migo.app';
  INSERT INTO trip_groups(id,host_id,title,destination,dates,max_members,tags,description,entry_fee,is_premium,cover_image)
  VALUES(gen_random_uuid(),u,'London Pub Crawl & History 🍻','영국 런던','6월 15일~20일',6,ARRAY['펍','역사','문화'],'Secret pubs in Soho + Tower of London + Camden Market! First pint on me',0,false,'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80');

  -- Group 15: 대만 먹방
  SELECT id INTO u FROM auth.users WHERE email='seed_48@migo.app';
  INSERT INTO trip_groups(id,host_id,title,destination,dates,max_members,tags,description,entry_fee,is_premium,cover_image)
  VALUES(gen_random_uuid(),u,'台北夜市美食之旅 🧋','대만 타이베이','5월 30일~6월 3일',5,ARRAY['야시장','맛집','카페'],'士林夜市、饒河夜市、永康街！台灣在地人帶你吃遍台北',0,false,'https://images.unsplash.com/photo-1470004914212-05527e49370b?w=800&q=80');

  -- Group 16: 하노이 커피
  SELECT id INTO u FROM auth.users WHERE email='seed_41@migo.app';
  INSERT INTO trip_groups(id,host_id,title,destination,dates,max_members,tags,description,entry_fee,is_premium,cover_image)
  VALUES(gen_random_uuid(),u,'Hanoi Egg Coffee Tour ☕','베트남 하노이','5월 14일~17일',4,ARRAY['커피','카페','문화'],'Famous egg coffee + hidden local cafes + Old Quarter walking tour',0,false,'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80');

  -- Group 17: 서울 K-culture
  SELECT id INTO u FROM auth.users WHERE email='seed_55@migo.app';
  INSERT INTO trip_groups(id,host_id,title,destination,dates,max_members,tags,description,entry_fee,is_premium,cover_image)
  VALUES(gen_random_uuid(),u,'Seoul K-Culture Tour 🎤','서울','5월 13일~15일',6,ARRAY['K-POP','K-드라마','쇼핑'],'HYBE Insight + K-drama filming locations + Myeongdong shopping!',0,false,'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800&q=80');

  -- Group 18: 캄보디아 앙코르
  SELECT id INTO u FROM auth.users WHERE email='seed_59@migo.app';
  INSERT INTO trip_groups(id,host_id,title,destination,dates,max_members,tags,description,entry_fee,is_premium,cover_image)
  VALUES(gen_random_uuid(),u,'Angkor Wat Sunrise Trek 🌅','캄보디아 시엠립','6월 12일~16일',5,ARRAY['역사','트레킹','사진'],'Sunrise at Angkor Wat + hidden temples + floating village tour',5000,false,'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80');

  -- Group 19: 홍콩 야경
  SELECT id INTO u FROM auth.users WHERE email='seed_50@migo.app';
  INSERT INTO trip_groups(id,host_id,title,destination,dates,max_members,tags,description,entry_fee,is_premium,cover_image)
  VALUES(gen_random_uuid(),u,'Hong Kong Night Photography 📸','홍콩','6월 20일~24일',4,ARRAY['사진','야경','맛집'],'Victoria Peak + Mong Kok neon + dim sum tour! 一起來拍照！',0,false,'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800&q=80');

  -- Group 20: 뉴질랜드 트레킹
  SELECT id INTO u FROM auth.users WHERE email='seed_56@migo.app';
  INSERT INTO trip_groups(id,host_id,title,destination,dates,max_members,tags,description,entry_fee,is_premium,cover_image)
  VALUES(gen_random_uuid(),u,'NZ Tongariro Alpine Crossing ⛰️','뉴질랜드','7월 5일~12일',4,ARRAY['트레킹','자연','모험'],'One of the greatest day hikes in the world! Stunning volcanic landscapes',10000,true,'https://images.unsplash.com/photo-1469521669194-babb45599def?w=800&q=80');

  RAISE NOTICE '✅ Part 3: 여행 그룹 20개 완료';
END $$;
-- MIGO Seed Part 4: Community Posts (40개) + Comments (40개)
DO $$
DECLARE u UUID; p UUID;
BEGIN
  -- === 커뮤니티 글 40개 ===

  SELECT id INTO u FROM auth.users WHERE email='seed_01@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'서울 카페 추천','성수동에 새로 오픈한 카페가 너무 예뻐요! 루프탑에서 한강뷰 보면서 커피 마시는데 최고 ☕✨ 같이 갈 사람?','https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80',NOW()-INTERVAL '1 hour');

  SELECT id INTO u FROM auth.users WHERE email='seed_09@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'양양 서핑 후기','이번 주말 양양에서 서핑했어요 🏄 파도 컨디션 최고였음! 다음주도 갈 건데 같이 갈 사람 모집합니다','https://images.unsplash.com/photo-1502680390548-bdbac40a5e55?w=600&q=80',NOW()-INTERVAL '2 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_16@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'東京カフェ巡り','表参道の新しいカフェに行ってきました！抹茶ティラミスが絶品でした🍵 韓国のカフェも行きたいな～','https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80',NOW()-INTERVAL '3 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_24@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'Paris tips','Si vous visitez Paris, ne manquez pas le Marais! Les meilleurs falafel et galeries d''art 🎨 DM me for my secret list!','https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',NOW()-INTERVAL '4 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_40@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'Bangkok street food 🍜','ข้าวมันไก่ตรงซอยนี้อร่อยมาก! Best chicken rice in Bangkok! Only 40 baht! I can take you there 😋','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',NOW()-INTERVAL '5 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_05@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'부산 일출 명소','해운대 해변에서 본 일출이 너무 아름다웠어요 🌅 새벽에 일어나기 힘들었지만 그만한 가치가 있었어요!','https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',NOW()-INTERVAL '6 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_34@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'Seoul hidden gems','Found an amazing rooftop bar in Itaewon with a view of N Seoul Tower! 🌃 Who wants to join this Friday?','https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600&q=80',NOW()-INTERVAL '7 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_21@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'写真撮影スポット','鎌倉の江ノ電沿いで最高の写真が撮れました📸 韓国でもおすすめの撮影スポットあったら教えてください！','https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',NOW()-INTERVAL '8 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_47@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'韩国旅行日记','来首尔第一天就爱上了这里！弘大的街头表演太棒了🎤 有没有人推荐好吃的烤肉店？','https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600&q=80',NOW()-INTERVAL '9 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_25@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'¡Barcelona es increíble!','La Sagrada Familia me dejó sin palabras 🤩 Si vienen a Barcelona, les puedo hacer de guía. ¡Tapas y sangría incluidas!','https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',NOW()-INTERVAL '10 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_02@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'치앙마이 한달살이 팁','님만해민 근처 좋은 코워킹 스페이스 찾았어요! 한달 3만원이면 에어컨+와이파이+커피 무제한 ☕💻','https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80',NOW()-INTERVAL '12 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_37@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'Digital nomad life in Bali','Working from a rice paddy view cafe in Ubud 🌾💻 This is the dream! Anyone else remote working in Bali?','https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',NOW()-INTERVAL '14 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_10@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'배낭여행 필수 준비물','15개국 다녀본 경험으로 정리한 배낭여행 짐 리스트! 🎒 궁금하신 분 댓글 달아주세요',NULL,NOW()-INTERVAL '16 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_42@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'Ubud morning yoga 🧘‍♀️','Sunrise yoga at the rice terraces was magical ✨ Free session every morning at 6am. All levels welcome!','https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',NOW()-INTERVAL '18 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_31@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'Korean BBQ review 🥩','As an Italian chef, I must say Korean BBQ is on another level! 삼겹살 with soju = perfetto! 🇮🇹❤️🇰🇷','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',NOW()-INTERVAL '20 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_07@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'면세점 꿀팁 공유','인천공항 면세점 할인 꿀팁 정리했어요! 🛍️ 이거 모르면 손해 ㅋㅋ 댓글로 질문 받아요~',NULL,NOW()-INTERVAL '22 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_54@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'Korean spicy food challenge 🌶️','I tried 불닭볶음면 for the first time... my mouth is still on fire 🔥😂 But I LOVE it! Any more spicy food recommendations?',NULL,NOW()-INTERVAL '1 day');

  SELECT id INTO u FROM auth.users WHERE email='seed_15@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'서울 야경 사진 모음','남산타워, 63빌딩, DDP 야경 사진 📷✨ 야경 좋아하시는 분 같이 출사 가요!','https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600&q=80',NOW()-INTERVAL '1 day 2 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_41@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'Hanoi egg coffee ☕','Cà phê trứng is the best invention ever! Creamy, sweet, and so unique. You must try it when in Hanoi!','https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80',NOW()-INTERVAL '1 day 4 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_55@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'K-drama filming spots','Visited the Goblin filming location in Seoul! 🎬 So surreal to see it in person. Any other drama location recommendations?',NULL,NOW()-INTERVAL '1 day 6 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_11@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'디지털노마드 카페 추천','서울에서 작업하기 좋은 카페 TOP 5 정리했어요! 콘센트+와이파이+분위기 다 갖춘 곳만 엄선 💻☕',NULL,NOW()-INTERVAL '1 day 8 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_48@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'台北夜市推薦','士林夜市的雞排真的太大太好吃了！🍗 還有珍珠奶茶🧋 台灣美食不能錯過！',NULL,NOW()-INTERVAL '1 day 10 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_52@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'Hiking Bukhansan!','Just climbed Bukhansan and the view from the top was INSANE 🏔️ Seoul looks so beautiful from up there! Who''s next?','https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600&q=80',NOW()-INTERVAL '1 day 12 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_03@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'이태원 맛집 리스트','이태원 세계음식 맛집 리스트 공유해요! 🌮🍕🍜 타코부터 피자, 라멘까지 다 있어요',NULL,NOW()-INTERVAL '2 days');

  SELECT id INTO u FROM auth.users WHERE email='seed_30@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'Portrait photography','Looking for models in Seoul for a travel photography project 📸 Free photos in exchange! DM me if interested','https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80',NOW()-INTERVAL '2 days 3 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_20@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'ソウル留学生活','韓国に留学して3ヶ月！毎日楽しすぎる🥰 週末一緒に遊んでくれる友達募集中です！韓国語も練習したい！',NULL,NOW()-INTERVAL '2 days 5 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_13@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'크래프트 맥주 투어','을지로 맥주 골목에서 크래프트 맥주 5종 테이스팅 했어요 🍺 맥주 좋아하시는 분 같이 가요!',NULL,NOW()-INTERVAL '2 days 8 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_43@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'First time in Korea! 🇰🇷','Everything is so clean and organized! The subway system is amazing 🚇 Any tips for a Filipino traveler in Seoul?',NULL,NOW()-INTERVAL '2 days 10 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_08@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'제주 올레길 추천','올레길 7코스 걸어왔어요! 바다 옆으로 걷는 길이 너무 예뻐요 🌊 제주 오시면 꼭 걸어보세요',NULL,NOW()-INTERVAL '3 days');

  SELECT id INTO u FROM auth.users WHERE email='seed_27@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'Roma food tour 🍝','Ho trovato la migliore carbonara a Trastevere! Se venite a Roma, vi porto io! Best pasta of my life 🤌','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',NOW()-INTERVAL '3 days 4 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_04@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'성수동 사진 명소','성수동 카페거리에서 찍은 사진들! 📸 인스타 감성 폭발하는 곳이에요 ✨ 같이 출사 갈 사람?','https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80',NOW()-INTERVAL '3 days 8 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_46@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'Uluwatu sunset surf 🌅','Caught the best waves during golden hour at Uluwatu today! 🏄 The sunset was unreal. Bali never disappoints!','https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',NOW()-INTERVAL '4 days');

  SELECT id INTO u FROM auth.users WHERE email='seed_06@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'워홀 준비 가이드','호주 워홀 준비하면서 정리한 가이드 공유해요! 비자, 보험, 짐 리스트 다 있어요 🇦🇺 질문 환영!',NULL,NOW()-INTERVAL '4 days 6 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_53@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'Seoul nightlife guide 🌙','As a DJ, I must say Seoul''s club scene is INSANE! Gangnam and Hongdae have completely different vibes. Who''s coming out tonight?',NULL,NOW()-INTERVAL '4 days 12 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_22@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'湘南サーフィン日記','今日の波最高だった！🏄‍♂️ サーフィン後のラーメンが最高の幸せ🍜 一緒にサーフィンする仲間募集！',NULL,NOW()-INTERVAL '5 days');

  SELECT id INTO u FROM auth.users WHERE email='seed_57@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'Seoul shopping haul! 🛍️','Myeongdong and Gangnam shopping was AMAZING! Found so many K-beauty products ✨ Happy to share my recommendations!',NULL,NOW()-INTERVAL '5 days 6 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_14@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'부산 로컬 맛집','자갈치시장 근처 숨은 회집 발견! 🐟 관광객은 모르는 진짜 로컬 맛집이에요. 부산 오시면 데려갈게요!',NULL,NOW()-INTERVAL '6 days');

  SELECT id INTO u FROM auth.users WHERE email='seed_26@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'Berlin vs Seoul nightlife','Both cities have amazing electronic music scenes! 🎧 Berlin has techno, Seoul has K-hiphop. Can''t choose a favorite!',NULL,NOW()-INTERVAL '6 days 8 hours');

  SELECT id INTO u FROM auth.users WHERE email='seed_12@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'북한산 등산 후기','오늘 백운대 정상 찍었어요! ⛰️ 서울 시내가 한눈에 보이는 뷰 최고! 다음주 관악산 갈 건데 같이 갈 사람?',NULL,NOW()-INTERVAL '7 days');

  SELECT id INTO u FROM auth.users WHERE email='seed_58@migo.app';
  INSERT INTO posts(id,author_id,title,content,image_url,created_at) VALUES
  (gen_random_uuid(),u,'Motorcycle trip Vietnam 🏍️','Da Nang to Hoi An on a motorbike - best road trip ever! The coastal road is breathtaking. Highly recommend!','https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&q=80',NOW()-INTERVAL '8 days');

  RAISE NOTICE '✅ Part 4A: 커뮤니티 글 40개 완료';
END $$;
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
-- MIGO Seed Part 6: Marketplace + Trips + Announcements + Promo

-- ─── 0. 사전 필수 작업 (에러 방지) ───────────────────────────────────────────
-- 기존 DB에 누락되었을 수 있는 marketplace_items 컬럼 자동 추가
ALTER TABLE marketplace_items ADD COLUMN IF NOT EXISTS destination TEXT;
ALTER TABLE marketplace_items ADD COLUMN IF NOT EXISTS duration TEXT;
ALTER TABLE marketplace_items ADD COLUMN IF NOT EXISTS max_people INTEGER DEFAULT 10;
ALTER TABLE marketplace_items ADD COLUMN IF NOT EXISTS current_people INTEGER DEFAULT 0;
ALTER TABLE marketplace_items ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE marketplace_items ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE marketplace_items ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- 기존 DB에 누락되었을 수 있는 trips 컬럼 자동 추가
ALTER TABLE trips ADD COLUMN IF NOT EXISTS emoji TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS travel_style TEXT[];
ALTER TABLE trips ADD COLUMN IF NOT EXISTS notes TEXT;

DO $$
DECLARE u UUID;
BEGIN
  -- === Marketplace Items (12개) ===
  SELECT id INTO u FROM auth.users WHERE email='seed_08@migo.app';
  INSERT INTO marketplace_items(host_id,title,description,category,price,destination,duration,max_people,image,tags,featured) VALUES
  (u,'제주 숨은 카페 드라이브 투어 🍊','로컬이 안내하는 제주 동쪽 해안도로 드라이브! 숨은 카페 3곳 + 비밀 해변. 렌트카 포함','tour',45000,'제주도','6시간',4,'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=600&q=80',ARRAY['드라이브','카페','제주'],true);

  SELECT id INTO u FROM auth.users WHERE email='seed_14@migo.app';
  INSERT INTO marketplace_items(host_id,title,description,category,price,destination,duration,max_people,image,tags,featured) VALUES
  (u,'부산 해운대 서핑 레슨 🏄','초보자 환영! 장비 대여 + 1시간 레슨 + 해운대 맛집 가이드. 로컬 서퍼가 직접 가르쳐요','activity',35000,'부산','3시간',6,'https://images.unsplash.com/photo-1502680390548-bdbac40a5e55?w=600&q=80',ARRAY['서핑','해변','부산'],true);

  SELECT id INTO u FROM auth.users WHERE email='seed_40@migo.app';
  INSERT INTO marketplace_items(host_id,title,description,category,price,destination,duration,max_people,image,tags,featured) VALUES
  (u,'Bangkok Night Market & Street Food 🌙','Local guide takes you to 3 best night markets! Tasting 10+ dishes included. ข้าวมันไก่ guaranteed!','tour',25000,'방콕','4시간',8,'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',ARRAY['야시장','맛집','방콕'],true);

  SELECT id INTO u FROM auth.users WHERE email='seed_17@migo.app';
  INSERT INTO marketplace_items(host_id,title,description,category,price,destination,duration,max_people,image,tags,featured) VALUES
  (u,'京都着物体験＆寺院ツアー 🌸','着物レンタル + プロカメラマン撮影 + 金閣寺・伏見稲荷ガイド付き','experience',55000,'교토','5시간',4,'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',ARRAY['기모노','사찰','교토'],false);

  SELECT id INTO u FROM auth.users WHERE email='seed_30@migo.app';
  INSERT INTO marketplace_items(host_id,title,description,category,price,destination,duration,max_people,image,tags,featured) VALUES
  (u,'Seoul Portrait Photography 📸','Professional portrait session at top Seoul locations! 20+ edited photos delivered. French photographer with 10yr exp','service',65000,'서울','2시간',2,'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80',ARRAY['사진','포트레이트','서울'],true);

  SELECT id INTO u FROM auth.users WHERE email='seed_42@migo.app';
  INSERT INTO marketplace_items(host_id,title,description,category,price,destination,duration,max_people,image,tags,featured) VALUES
  (u,'Ubud Sunrise Yoga & Rice Terrace 🧘','Morning yoga at rice terrace + healthy brunch + meditation session. Start your day in paradise!','experience',30000,'발리','3시간',10,'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',ARRAY['요가','힐링','발리'],false);

  SELECT id INTO u FROM auth.users WHERE email='seed_41@migo.app';
  INSERT INTO marketplace_items(host_id,title,description,category,price,destination,duration,max_people,image,tags,featured) VALUES
  (u,'Hanoi Old Quarter Walking Tour ☕','Egg coffee + 36 streets history + hidden temples + street food. Local guide who speaks English!','tour',20000,'하노이','3시간',6,'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&q=80',ARRAY['커피','역사','하노이'],false);

  SELECT id INTO u FROM auth.users WHERE email='seed_31@migo.app';
  INSERT INTO marketplace_items(host_id,title,description,category,price,destination,duration,max_people,image,tags,featured) VALUES
  (u,'Italian Cooking Class in Seoul 🍝','Learn authentic carbonara & tiramisu from an Italian chef! Ingredients & wine included','experience',55000,'서울','3시간',6,'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',ARRAY['요리','이탈리안','서울'],true);

  SELECT id INTO u FROM auth.users WHERE email='seed_46@migo.app';
  INSERT INTO marketplace_items(host_id,title,description,category,price,destination,duration,max_people,image,tags,featured) VALUES
  (u,'Uluwatu Surf Lesson + Temple 🏄','Beginner-friendly! Board rental + 2hr lesson + Uluwatu Temple sunset. Best day in Bali!','activity',40000,'발리','6시간',4,'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',ARRAY['서핑','사원','발리'],false);

  SELECT id INTO u FROM auth.users WHERE email='seed_48@migo.app';
  INSERT INTO marketplace_items(host_id,title,description,category,price,destination,duration,max_people,image,tags,featured) VALUES
  (u,'台北夜市美食導覽 🧋','士林、饒河、寧夏三大夜市一晚走透！嚐遍10種以上小吃＋珍奶推薦','tour',22000,'타이베이','4시간',8,'https://images.unsplash.com/photo-1470004914212-05527e49370b?w=600&q=80',ARRAY['야시장','먹방','타이베이'],false);

  SELECT id INTO u FROM auth.users WHERE email='seed_10@migo.app';
  INSERT INTO marketplace_items(host_id,title,description,category,price,destination,duration,max_people,image,tags,featured) VALUES
  (u,'경주 자전거 역사 투어 🚲','불국사→석굴암→첨성대→안압지. 자전거 대여 + 가이드 포함. 천년고도를 페달로!','tour',30000,'경주','5시간',6,'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600&q=80',ARRAY['자전거','역사','경주'],false);

  SELECT id INTO u FROM auth.users WHERE email='seed_25@migo.app';
  INSERT INTO marketplace_items(host_id,title,description,category,price,destination,duration,max_people,image,tags,featured) VALUES
  (u,'Barcelona Tapas & Wine Tour 🍷','5 authentic tapas bars + wine pairing. Skip the tourist traps! Local guide from Barcelona','tour',50000,'바르셀로나','4시간',6,'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',ARRAY['타파스','와인','바르셀로나'],false);

  -- === Trips / Travel Plans (15개) ===
  SELECT id INTO u FROM auth.users WHERE email='seed_01@migo.app';
  INSERT INTO trips(user_id,destination,start_date,end_date,emoji,color,travel_style,notes) VALUES
  (u,'오사카','2026-05-15','2026-05-19','🍜','#f59e0b',ARRAY['맛집투어'],'도톤보리 먹방 + 교토 당일치기');

  SELECT id INTO u FROM auth.users WHERE email='seed_09@migo.app';
  INSERT INTO trips(user_id,destination,start_date,end_date,emoji,color,travel_style,notes) VALUES
  (u,'발리','2026-05-20','2026-05-27','🏄','#06b6d4',ARRAY['서핑','액티비티'],'울루와뚜 서핑 + 우붓 힐링');

  SELECT id INTO u FROM auth.users WHERE email='seed_16@migo.app';
  INSERT INTO trips(user_id,destination,start_date,end_date,emoji,color,travel_style,notes) VALUES
  (u,'서울','2026-05-10','2026-05-14','🇰🇷','#8b5cf6',ARRAY['카페투어','쇼핑'],'성수동 카페 + 명동 쇼핑');

  SELECT id INTO u FROM auth.users WHERE email='seed_24@migo.app';
  INSERT INTO trips(user_id,destination,start_date,end_date,emoji,color,travel_style,notes) VALUES
  (u,'도쿄','2026-06-01','2026-06-07','🗼','#ec4899',ARRAY['문화탐방','맛집투어'],'하라주쿠 + 아키하바라 + 츠키지');

  SELECT id INTO u FROM auth.users WHERE email='seed_34@migo.app';
  INSERT INTO trips(user_id,destination,start_date,end_date,emoji,color,travel_style,notes) VALUES
  (u,'제주도','2026-05-17','2026-05-19','🍊','#22c55e',ARRAY['드라이브','힐링'],'올레길 트레킹 + 카페 투어');

  SELECT id INTO u FROM auth.users WHERE email='seed_37@migo.app';
  INSERT INTO trips(user_id,destination,start_date,end_date,emoji,color,travel_style,notes) VALUES
  (u,'치앙마이','2026-06-10','2026-06-20','💻','#6366f1',ARRAY['디지털노마드'],'코워킹 + 주말 트레킹');

  SELECT id INTO u FROM auth.users WHERE email='seed_40@migo.app';
  INSERT INTO trips(user_id,destination,start_date,end_date,emoji,color,travel_style,notes) VALUES
  (u,'서울','2026-05-12','2026-05-16','🇰🇷','#ef4444',ARRAY['맛집투어','문화탐방'],'광장시장 + 이태원 + 홍대');

  SELECT id INTO u FROM auth.users WHERE email='seed_47@migo.app';
  INSERT INTO trips(user_id,destination,start_date,end_date,emoji,color,travel_style,notes) VALUES
  (u,'부산','2026-05-24','2026-05-27','🌊','#0ea5e9',ARRAY['해변','맛집투어'],'해운대 + 자갈치시장');

  SELECT id INTO u FROM auth.users WHERE email='seed_05@migo.app';
  INSERT INTO trips(user_id,destination,start_date,end_date,emoji,color,travel_style,notes) VALUES
  (u,'다낭','2026-06-05','2026-06-10','🏖️','#14b8a6',ARRAY['해변','힐링'],'미케비치 + 호이안 + 바나힐');

  SELECT id INTO u FROM auth.users WHERE email='seed_28@migo.app';
  INSERT INTO trips(user_id,destination,start_date,end_date,emoji,color,travel_style,notes) VALUES
  (u,'서울','2026-05-13','2026-05-20','🇰🇷','#a855f7',ARRAY['로컬체험','파티'],'이태원 + 홍대 + 강남');

  SELECT id INTO u FROM auth.users WHERE email='seed_55@migo.app';
  INSERT INTO trips(user_id,destination,start_date,end_date,emoji,color,travel_style,notes) VALUES
  (u,'서울','2026-05-11','2026-05-15','🇰🇷','#f43f5e',ARRAY['K-드라마','쇼핑'],'드라마 촬영지 + 명동 쇼핑');

  SELECT id INTO u FROM auth.users WHERE email='seed_22@migo.app';
  INSERT INTO trips(user_id,destination,start_date,end_date,emoji,color,travel_style,notes) VALUES
  (u,'양양','2026-05-18','2026-05-20','🏄','#06b6d4',ARRAY['서핑'],'양양 서핑 위크엔드');

  SELECT id INTO u FROM auth.users WHERE email='seed_42@migo.app';
  INSERT INTO trips(user_id,destination,start_date,end_date,emoji,color,travel_style,notes) VALUES
  (u,'치앙마이','2026-06-15','2026-06-22','🧘','#10b981',ARRAY['요가','힐링'],'요가 리트릿 + 코끼리 보호소');

  SELECT id INTO u FROM auth.users WHERE email='seed_48@migo.app';
  INSERT INTO trips(user_id,destination,start_date,end_date,emoji,color,travel_style,notes) VALUES
  (u,'오사카','2026-06-07','2026-06-11','🍜','#f59e0b',ARRAY['맛집투어'],'오사카 먹방 + 나라 사슴공원');

  SELECT id INTO u FROM auth.users WHERE email='seed_53@migo.app';
  INSERT INTO trips(user_id,destination,start_date,end_date,emoji,color,travel_style,notes) VALUES
  (u,'방콕','2026-05-25','2026-05-30','🎧','#7c3aed',ARRAY['파티','음악'],'방콕 클럽 + 카오산로드');

  -- === Announcements (4개) ===
  INSERT INTO announcements(title,content,type,is_active) VALUES
  ('🎉 Migo v2.0 업데이트!','새로운 여행 매칭 알고리즘과 글로벌 스와이핑 카드 기능이 추가되었습니다! 더 정확한 동행자를 찾아보세요.','update',true),
  ('🌏 글로벌 오픈 이벤트','전 세계 여행자와 연결하세요! 신규 가입 시 Migo Plus 3일 무료 체험 + 슈퍼라이크 5개 증정','event',true),
  ('🔒 안전 여행 가이드','안전한 동행을 위한 Migo 가이드라인이 업데이트되었습니다. 안전 체크인 기능을 활용해주세요.','info',true),
  ('☀️ 여름 여행 시즌!','5~8월 여름 여행 시즌! 인기 여행지별 동행 크루가 활발하게 모집 중입니다. 지금 참여하세요!','event',true);

  -- === Promo Codes (3개) ===
  INSERT INTO promo_codes(code,discount,max_limit,is_active,expires_at) VALUES
  ('WELCOME2026','50%',500,true,'2026-12-31'::TIMESTAMPTZ),
  ('SUMMER','30%',200,true,'2026-08-31'::TIMESTAMPTZ),
  ('MIGO1ST','100%',100,true,'2026-06-30'::TIMESTAMPTZ);

  RAISE NOTICE '✅ Part 6: 마켓플레이스 12개 + 여행일정 15개 + 공지 4개 + 프로모 3개 완료';
END $$;
