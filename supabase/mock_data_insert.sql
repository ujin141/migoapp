-- ============================================================
-- MIGO 모의 데이터 완전판 (v6 최종)
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 비밀번호 + 이메일 확인 처리
UPDATE auth.users SET
  encrypted_password  = crypt('Migo2024!', gen_salt('bf')),
  email_confirmed_at  = NOW(),
  updated_at          = NOW()
WHERE email = 'ujin141@naver.com';

DO $$
DECLARE
  my_id UUID;
  u1 UUID; u2 UUID; u3 UUID; u4 UUID;
  u5 UUID; u6 UUID; u7 UUID; u8 UUID;
  gid UUID;
BEGIN
  -- 테스트 계정 확인
  SELECT id INTO my_id FROM auth.users WHERE email='ujin141@naver.com' LIMIT 1;
  IF my_id IS NULL THEN RAISE EXCEPTION '계정 없음'; END IF;

  -- 내 프로필
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified)
  VALUES(my_id,'박민준','ujin141@naver.com','여행 좋아하는 개발자 ✈️',28,'남성','대한민국','서울특별시, 대한민국',37.5478,127.0742,ARRAY['한국어','English'],ARRAY['카페','사진','자연','음식'],'ENFP',true)
  ON CONFLICT (id) DO UPDATE SET name='박민준',lat=37.5478,lng=127.0742,location='서울특별시, 대한민국',verified=true;

  -- 모의 유저 auth 등록
  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE email='mock.yujin@migo.app') THEN INSERT INTO auth.users(id,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data,aud,role,is_super_admin) VALUES(gen_random_uuid(),'mock.yujin@migo.app','',NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{}','authenticated','authenticated',false); END IF;
  SELECT id INTO u1 FROM auth.users WHERE email='mock.yujin@migo.app' LIMIT 1;

  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE email='mock.kenji@migo.app') THEN INSERT INTO auth.users(id,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data,aud,role,is_super_admin) VALUES(gen_random_uuid(),'mock.kenji@migo.app','',NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{}','authenticated','authenticated',false); END IF;
  SELECT id INTO u2 FROM auth.users WHERE email='mock.kenji@migo.app' LIMIT 1;

  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE email='mock.sofia@migo.app') THEN INSERT INTO auth.users(id,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data,aud,role,is_super_admin) VALUES(gen_random_uuid(),'mock.sofia@migo.app','',NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{}','authenticated','authenticated',false); END IF;
  SELECT id INTO u3 FROM auth.users WHERE email='mock.sofia@migo.app' LIMIT 1;

  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE email='mock.ari@migo.app') THEN INSERT INTO auth.users(id,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data,aud,role,is_super_admin) VALUES(gen_random_uuid(),'mock.ari@migo.app','',NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{}','authenticated','authenticated',false); END IF;
  SELECT id INTO u4 FROM auth.users WHERE email='mock.ari@migo.app' LIMIT 1;

  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE email='mock.lena@migo.app') THEN INSERT INTO auth.users(id,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data,aud,role,is_super_admin) VALUES(gen_random_uuid(),'mock.lena@migo.app','',NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{}','authenticated','authenticated',false); END IF;
  SELECT id INTO u5 FROM auth.users WHERE email='mock.lena@migo.app' LIMIT 1;

  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE email='mock.marco@migo.app') THEN INSERT INTO auth.users(id,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data,aud,role,is_super_admin) VALUES(gen_random_uuid(),'mock.marco@migo.app','',NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{}','authenticated','authenticated',false); END IF;
  SELECT id INTO u6 FROM auth.users WHERE email='mock.marco@migo.app' LIMIT 1;

  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE email='mock.yuna@migo.app') THEN INSERT INTO auth.users(id,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data,aud,role,is_super_admin) VALUES(gen_random_uuid(),'mock.yuna@migo.app','',NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{}','authenticated','authenticated',false); END IF;
  SELECT id INTO u7 FROM auth.users WHERE email='mock.yuna@migo.app' LIMIT 1;

  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE email='mock.ahmed@migo.app') THEN INSERT INTO auth.users(id,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data,aud,role,is_super_admin) VALUES(gen_random_uuid(),'mock.ahmed@migo.app','',NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{}','authenticated','authenticated',false); END IF;
  SELECT id INTO u8 FROM auth.users WHERE email='mock.ahmed@migo.app' LIMIT 1;

  -- 모의 유저 profiles
  INSERT INTO profiles(id,name,email,bio,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,photo_url) VALUES
    (u1,'이유진', 'mock.yujin@migo.app', '카페 투어 좋아해요 ☕',       26,'여성','대한민국','서울특별시, 대한민국',37.5518,127.0798,ARRAY['한국어','English'],  ARRAY['카페','사진','야시장'],'ENFJ',true, 'free','https://randomuser.me/api/portraits/women/44.jpg'),
    (u2,'타나카 켄지','mock.kenji@migo.app', 'Surfer & yogi 🏄',            28,'남성','일본',    '서울특별시, 대한민국',37.5440,127.0680,ARRAY['English','日本語'], ARRAY['서핑','요가','자연'], 'ISTP',true, 'free','https://randomuser.me/api/portraits/men/32.jpg'),
    (u3,'소피아 로페즈','mock.sofia@migo.app', 'Architecture lover 🏛️',      24,'여성','스페인',  '서울특별시, 대한민국',37.5530,127.0660,ARRAY['English','Español'], ARRAY['건축','음식','예술'], 'INFJ',true, 'free','https://randomuser.me/api/portraits/women/68.jpg'),
    (u4,'김아리','mock.ari@migo.app',   '트레킹 전문가 🥾',            27,'여성','대한민국','서울특별시, 대한민국',37.5420,127.0720,ARRAY['한국어'],           ARRAY['트레킹','모험','자연'],'ESFP',false,'free','https://randomuser.me/api/portraits/women/55.jpg'),
    (u5,'레나 마르탱','mock.lena@migo.app',  'Food & wine lover 🍷',        25,'여성','프랑스',  '서울특별시, 대한민국',37.5500,127.0820,ARRAY['Français','English'],ARRAY['음식','럭셔리','카페'],'ENFJ',true, 'plus','https://randomuser.me/api/portraits/women/12.jpg'),
    (u6,'마르코 가르시아','mock.marco@migo.app', 'Diver & explorer 🤿',         30,'남성','멕시코',  '서울특별시, 대한민국',37.5460,127.0810,ARRAY['Español','English'], ARRAY['다이빙','자연','모험'],'ESTP',false,'free','https://randomuser.me/api/portraits/men/67.jpg'),
    (u7,'박유나','mock.yuna@migo.app',  '일본 맛집 헌터 🍣',            23,'여성','대한민국','서울특별시, 대한민국',37.5490,127.0700,ARRAY['한국어','日本語'],  ARRAY['음식','쇼핑','카페'],'ENFP',true, 'plus','https://randomuser.me/api/portraits/women/29.jpg'),
    (u8,'아흐마드 칼릴','mock.ahmed@migo.app', 'History & culture seeker 🕌', 29,'남성','이집트',  '서울특별시, 대한민국',37.5450,127.0760,ARRAY['English','عربي'],   ARRAY['역사','문화','건축'], 'INTJ',false,'free','https://randomuser.me/api/portraits/men/88.jpg')
  ON CONFLICT (id) DO NOTHING;

  -- ─── 여행 그룹 5개 ───────────────────────────────────────────
  INSERT INTO trip_groups(id,host_id,title,destination,dates,max_members,tags,description,entry_fee,is_premium)
  VALUES
    (gen_random_uuid(),u1,'치앙마이 카페 투어 🌿','태국 치앙마이','4월 5일~10일',4,ARRAY['카페','사진','야시장'],'님만해민 카페 골목부터 올드타운까지 같이 돌아봐요!',0,false),
    (gen_random_uuid(),u2,'발리 서핑 & 요가 🏄','인도네시아 발리','4월 15일~22일',5,ARRAY['서핑','요가','자연'],'꾸따 비치에서 서핑 배우고 우붓에서 요가까지!',0,false),
    (gen_random_uuid(),u5,'파리 미식 투어 🍷','프랑스 파리','5월 1일~7일',3,ARRAY['음식','럭셔리','예술'],'미슐랭 레스토랑부터 로컬 비스트로까지 파리의 맛을 탐험해요',10000,true),
    (gen_random_uuid(),u7,'오사카 맛집 헌팅 🍜','일본 오사카','4월 20일~25일',4,ARRAY['음식','쇼핑','문화'],'도톤보리, 쿠로몬 시장, 신사이바시 쇼핑까지!',0,false),
    (gen_random_uuid(),u4,'사파 트레킹 🥾','베트남 사파','5월 10일~15일',6,ARRAY['트레킹','모험','자연'],'호앙리엔 국립공원 트레킹, 소수민족 마을 방문, 라오까이 야시장',5000,false);

  -- 그룹장을 멤버로 자동 등록
  INSERT INTO trip_group_members(group_id,user_id)
  SELECT id, host_id FROM trip_groups WHERE host_id IN (u1,u2,u4,u5,u7)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ 완료! 로그인: ujin141@naver.com / Migo2024! | 여행자 8명 + 그룹 5개 추가됨';
END $$;
-- ─── 기존 모의 유저 name + photo_url 강제 업데이트 ─────────────────────
UPDATE profiles SET name='이유진',        photo_url='https://randomuser.me/api/portraits/women/44.jpg' WHERE email='mock.yujin@migo.app';
UPDATE profiles SET name='타나카 켄지',   photo_url='https://randomuser.me/api/portraits/men/32.jpg'   WHERE email='mock.kenji@migo.app';
UPDATE profiles SET name='소피아 로페즈', photo_url='https://randomuser.me/api/portraits/women/68.jpg' WHERE email='mock.sofia@migo.app';
UPDATE profiles SET name='김아리',        photo_url='https://randomuser.me/api/portraits/women/55.jpg' WHERE email='mock.ari@migo.app';
UPDATE profiles SET name='레나 마르탱',   photo_url='https://randomuser.me/api/portraits/women/12.jpg' WHERE email='mock.lena@migo.app';
UPDATE profiles SET name='마르코 가르시아', photo_url='https://randomuser.me/api/portraits/men/67.jpg' WHERE email='mock.marco@migo.app';
UPDATE profiles SET name='박유나',        photo_url='https://randomuser.me/api/portraits/women/29.jpg' WHERE email='mock.yuna@migo.app';
UPDATE profiles SET name='아흐마드 칼릴', photo_url='https://randomuser.me/api/portraits/men/88.jpg'   WHERE email='mock.ahmed@migo.app';

-- ─── 위치/거리 데이터 강제 업데이트 (ON CONFLICT DO NOTHING 우회) ────────────
UPDATE profiles SET location='서울특별시, 대한민국', lat=37.5518, lng=127.0798, bio='카페 투어 좋아해요 ☕', age=26, gender='여성', nationality='대한민국', languages=ARRAY['한국어','English'], interests=ARRAY['카페','사진','야시장'], mbti='ENFJ', verified=true, plan='free'    WHERE email='mock.yujin@migo.app';
UPDATE profiles SET location='서울특별시, 대한민국', lat=37.5440, lng=127.0680, bio='Surfer & yogi 🏄',    age=28, gender='남성', nationality='일본',    languages=ARRAY['English','日本語'],   interests=ARRAY['서핑','요가','자연'],   mbti='ISTP', verified=true, plan='free'    WHERE email='mock.kenji@migo.app';
UPDATE profiles SET location='서울특별시, 대한민국', lat=37.5530, lng=127.0660, bio='Architecture lover 🏛️', age=24, gender='여성', nationality='스페인', languages=ARRAY['English','Español'],  interests=ARRAY['건축','음식','예술'],   mbti='INFJ', verified=true, plan='free'    WHERE email='mock.sofia@migo.app';
UPDATE profiles SET location='서울특별시, 대한민국', lat=37.5420, lng=127.0720, bio='트레킹 전문가 🥾',    age=27, gender='여성', nationality='대한민국', languages=ARRAY['한국어'],             interests=ARRAY['트레킹','모험','자연'], mbti='ESFP', verified=false,plan='free'    WHERE email='mock.ari@migo.app';
UPDATE profiles SET location='서울특별시, 대한민국', lat=37.5500, lng=127.0820, bio='Food & wine lover 🍷', age=25, gender='여성', nationality='프랑스',  languages=ARRAY['Français','English'], interests=ARRAY['음식','럭셔리','카페'], mbti='ENFJ', verified=true, plan='plus', is_plus=true WHERE email='mock.lena@migo.app';
UPDATE profiles SET location='서울특별시, 대한민국', lat=37.5460, lng=127.0810, bio='Diver & explorer 🤿',  age=30, gender='남성', nationality='멕시코',  languages=ARRAY['Español','English'],  interests=ARRAY['다이빙','자연','모험'], mbti='ESTP', verified=false,plan='free'    WHERE email='mock.marco@migo.app';
UPDATE profiles SET location='서울특별시, 대한민국', lat=37.5490, lng=127.0700, bio='일본 맛집 헌터 🍣',   age=23, gender='여성', nationality='대한민국', languages=ARRAY['한국어','日本語'],    interests=ARRAY['음식','쇼핑','카페'],  mbti='ENFP', verified=true, plan='plus', is_plus=true WHERE email='mock.yuna@migo.app';
UPDATE profiles SET location='서울특별시, 대한민국', lat=37.5450, lng=127.0760, bio='History & culture seeker 🕌', age=29, gender='남성', nationality='이집트', languages=ARRAY['English','عربي'], interests=ARRAY['역사','문화','건축'], mbti='INTJ', verified=false, plan='free' WHERE email='mock.ahmed@migo.app';

