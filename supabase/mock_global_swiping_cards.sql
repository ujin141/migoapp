-- Global Awesome Swiping Cards Mock Data
DO $$
DECLARE
  uids UUID[] := ARRAY[
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
  ];
  emails TEXT[] := ARRAY[
    'global_mock0@migo.app', 'global_mock1@migo.app', 'global_mock2@migo.app', 'global_mock3@migo.app', 'global_mock4@migo.app',
    'global_mock5@migo.app', 'global_mock6@migo.app', 'global_mock7@migo.app', 'global_mock8@migo.app', 'global_mock9@migo.app',
    'global_mock10@migo.app', 'global_mock11@migo.app', 'global_mock12@migo.app', 'global_mock13@migo.app', 'global_mock14@migo.app'
  ];
  i INT;
BEGIN
  -- 1. Create or Find Auth Users
  FOR i IN 1..15 LOOP
    IF NOT EXISTS(SELECT 1 FROM auth.users WHERE email=emails[i]) THEN 
      INSERT INTO auth.users(id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role, is_super_admin) 
      VALUES(uids[i], emails[i], '', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated', false); 
    ELSE
      uids[i] := (SELECT id FROM auth.users WHERE email=emails[i] LIMIT 1);
    END IF;
  END LOOP;

  -- 2. Clear old identical mocks
  DELETE FROM profiles WHERE email LIKE 'global_mock%@migo.app';

  -- 3. Insert Profiles (Various Distances & Countries)
  INSERT INTO profiles(id, name, email, bio, age, gender, nationality, location, lat, lng, languages, interests, mbti, verified, is_plus, plan, photo_url, photo_urls) VALUES
  (uids[1],  'Elena',  emails[1],  'Life is better in a bikini 🏖️ Always chasing the sun. Show me the best hidden beaches?', 24, '여성', '🇪🇸 스페인', 'Ibiza, Spain', 38.9067, 1.4206, ARRAY['Español', 'English'], ARRAY['파티', '서핑', '바다'], 'ESFP', true, true, 'premium', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80', ARRAY['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80']),
  (uids[2],  'Sophia', emails[2],  'Just moved to New York! Need a partner for trying out all the Michelin star restaurants 🍷✨', 26, '여성', '🇺🇸 미국', 'New York, USA', 40.7128, -74.0060, ARRAY['English'], ARRAY['미식', '와인', '예술'], 'ENTJ', true, false, 'basic', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80', ARRAY['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80']),
  (uids[3],  'Kiko',   emails[3],  '週末は京都でゆっくり過ごすのが好き🍵 カメラを持って散歩しましょう！', 25, '여성', '🇯🇵 일본', 'Kyoto, Japan', 35.0116, 135.7681, ARRAY['日本語', 'English'], ARRAY['사진', '카페', '산책'], 'INFP', true, true, 'premium', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80', ARRAY['https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80', 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80']),
  (uids[4],  'Amelie', emails[4],  'La vie est belle 🌸 Cherche quelqu''un pour boire un verre au bord de la Seine ce soir.', 27, '여성', '🇫🇷 프랑스', 'Paris, France', 48.8566, 2.3522, ARRAY['Français', 'English'], ARRAY['로맨틱', '건축', '와인'], 'ENFJ', true, false, 'basic', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80', ARRAY['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80', 'https://images.unsplash.com/photo-1526413232644-8a40f41ce931?w=800&q=80']),
  (uids[5],  'Layla',  emails[5],  'Desert safaris and luxurious dinners. I love exploring new cultures. Match me if you are adventurous! 🐪✨', 23, '여성', '🇦🇪 UAE', 'Dubai, UAE', 25.2048, 55.2708, ARRAY['Arabic', 'English'], ARRAY['쇼핑', '럭셔리', '드라이브'], 'ESTP', true, true, 'premium', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80', ARRAY['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80']),
  
  (uids[6],  'Mateo',  emails[6],  'Surfing early morning, designing apps by day. Let''s grab some tacos and a margarita! 🌮🌊', 28, '남성', '🇲🇽 멕시코', 'Cancun, Mexico', 21.1619, -86.8515, ARRAY['Español', 'English'], ARRAY['서핑', '스타트업', '음악'], 'ENTP', true, true, 'premium', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80', ARRAY['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80']),
  (uids[7],  'Liam',   emails[7],  'London born and bred. I know the best secret pubs in Soho. First pint is on me! 🍻', 29, '남성', '🇬🇧 영국', 'London, UK', 51.5074, -0.1278, ARRAY['English'], ARRAY['펍', '축구', '음악'], 'ESTJ', true, false, 'basic', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80', ARRAY['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80']),
  (uids[8],  'Luca',   emails[8],  'Fotografo professionista a Roma. Ti va di farti qualche foto davanti al Colosseo? 📸🍷', 27, '남성', '🇮🇹 이탈리아', 'Rome, Italy', 41.9028, 12.4964, ARRAY['Italiano', 'English'], ARRAY['사진', '예술', '커피'], 'INFP', true, true, 'premium', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80', ARRAY['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80']),
  (uids[9],  'Noah',   emails[9],  'G’day! Bondi beach local. Always up for a coastal walk and an iced latte. 🏄‍♂️☕️', 26, '남성', '🇦🇺 호주', 'Sydney, Australia', -33.8688, 151.2093, ARRAY['English'], ARRAY['아웃도어', '피트니스', '커피'], 'ENFP', true, true, 'premium', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80', ARRAY['https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80']),
  (uids[10], 'Chen',   emails[10], '주말마다 제주도 방주교회 근처에서 스냅사진을 찍고 있어요. 피사체가 되어주실 분! 📸', 28, '남성', '대한민국', '제주도, 대한민국', 33.4996, 126.5312, ARRAY['한국어', 'English'], ARRAY['사진', '드라이브', '오션뷰'], 'ISTP', true, false, 'basic', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80', ARRAY['https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80']),

  (uids[11], 'Maria',  emails[11], 'O Rio de Janeiro continua lindo! Vamos tomar uma caipirinha no Leblon? 🍹🏖️', 25, '여성', '🇧🇷 브라질', 'Rio de Janeiro, Brazil', -22.9068, -43.1729, ARRAY['Português', 'English'], ARRAY['댄스', '해변', '파티'], 'ESFJ', true, true, 'premium', 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80', ARRAY['https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80']),
  (uids[12], 'Yuna',   emails[12], '방콕 수영장 예쁜 호텔 추천받아요! 🇹🇭 저랑 같이 야시장 돌면서 망고스틴 드실 분? 🥺', 24, '여성', '대한민국', 'Bangkok, Thailand', 13.7563, 100.5018, ARRAY['한국어', 'English'], ARRAY['수영장', '야시장', '먹방'], 'ENFP', true, true, 'premium', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80', ARRAY['https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80']),
  (uids[13], 'David',  emails[13], 'Just arrived in Bali for a digital nomad retreat. If you want to grab coffee in Canggu, hit me up! 💻🌴', 31, '남성', '🇨🇦 캐나다', 'Bali, Indonesia', -8.4095, 115.1889, ARRAY['English', 'Français'], ARRAY['서핑', '노마드', '커피'], 'INTJ', true, true, 'premium', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80', ARRAY['https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80']),
  (uids[14], 'Mia',    emails[14], 'I believe in good karma and great tequila. Let''s go to a festival! 🎶🌸', 22, '여성', '🇺🇸 미국', 'Los Angeles, USA', 34.0522, -118.2437, ARRAY['English'], ARRAY['페스티벌', '패션', '드라이브'], 'ENTP', true, false, 'basic', 'https://images.unsplash.com/photo-1526413232644-8a40f41ce931?w=800&q=80', ARRAY['https://images.unsplash.com/photo-1526413232644-8a40f41ce931?w=800&q=80']),
  (uids[15], 'James',  emails[15], '부산 로컬입니다. 해운대 맛집이랑 요트 뷰포인트 다 알아요 😎 커피 한잔 하면서 투어 어때요?', 30, '남성', '대한민국', 'Busan, Korea', 35.1796, 129.0756, ARRAY['한국어', 'English'], ARRAY['요트', '드라이브', '오션뷰'], 'ESTJ', true, true, 'premium', 'https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=800&q=80', ARRAY['https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=800&q=80']);

END $$;
