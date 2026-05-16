-- MIGO Seed Part 3: Trip Groups (5개) + Members
DO $$
DECLARE
  u UUID; g UUID;
  host_email TEXT;
BEGIN
  -- departure 컬럼이 없는 경우 동적으로 추가
  ALTER TABLE trip_groups ADD COLUMN IF NOT EXISTS departure TEXT;

  -- Group 1: 제주도 힐링 (Korean)
  SELECT id INTO u FROM auth.users WHERE email='seed_08@migo.app';
  UPDATE profiles SET name = '송민서', photo_url = 'https://randomuser.me/api/portraits/women/45.jpg' WHERE id = u;
  INSERT INTO trip_groups(id,host_id,title,departure,destination,dates,max_members,tags,description,entry_fee,is_premium,cover_image,status)
  VALUES(gen_random_uuid(),u,'[서울 출발] 제주 힐링 드라이브 🍊','서울','제주도','5월 10일~13일',4,ARRAY['드라이브','카페','힐링'],'서울 김포공항에서 같이 출발해서 제주도 해안도로 드라이브하실 분! 렌트카는 제가 미리 예약해뒀습니다.',0,false,'https://randomuser.me/api/portraits/women/45.jpg','recruiting');

  -- Group 2: 오사카 먹방 (Japanese)
  SELECT id INTO u FROM auth.users WHERE email='seed_16@migo.app';
  UPDATE profiles SET name = 'Sakura', photo_url = 'https://randomuser.me/api/portraits/women/24.jpg' WHERE id = u;
  INSERT INTO trip_groups(id,host_id,title,departure,destination,dates,max_members,tags,description,entry_fee,is_premium,cover_image,status)
  VALUES(gen_random_uuid(),u,'[東京出発] 大阪グルメツアー🍜','東京','Osaka, Japan','5월 15일~19일',5,ARRAY['맛집','야시장','먹방'],'東京駅から新幹線で一緒に出発しましょう！道頓堀から黒門市場まで大阪グルメを完全制覇する予定です。',0,false,'https://randomuser.me/api/portraits/women/24.jpg','recruiting');

  -- Group 3: 발리 서핑+요가 (English)
  SELECT id INTO u FROM auth.users WHERE email='seed_37@migo.app';
  UPDATE profiles SET name = 'Jake', photo_url = 'https://randomuser.me/api/portraits/men/35.jpg' WHERE id = u;
  INSERT INTO trip_groups(id,host_id,title,departure,destination,dates,max_members,tags,description,entry_fee,is_premium,cover_image,status)
  VALUES(gen_random_uuid(),u,'[NY Departure] Bali Nomad Meetup 💻','New York','Bali, Indonesia','5월 20일~27일',8,ARRAY['서핑','요가','해변'],'Flying out from JFK next week! Let''s work from the best cafes in Canggu and surf on the weekends. All nomads welcome!',15000,true,'https://randomuser.me/api/portraits/men/35.jpg','recruiting');

  -- Group 4: 바르셀로나 (Spanish)
  SELECT id INTO u FROM auth.users WHERE email='seed_25@migo.app';
  UPDATE profiles SET name = 'Clara', photo_url = 'https://randomuser.me/api/portraits/women/68.jpg' WHERE id = u;
  INSERT INTO trip_groups(id,host_id,title,departure,destination,dates,max_members,tags,description,entry_fee,is_premium,cover_image,status)
  VALUES(gen_random_uuid(),u,'[Madrid Salida] Barcelona Playa & Tapas 🌊','Madrid','Barcelona, Spain','6월 5일~10일',5,ARRAY['해변','맛집','건축'],'¡Saliendo de Madrid el viernes! Sagrada Familia, Barrio Gótico, y la playa de la Barceloneta. ¡Yo conozco los mejores bares de tapas!',0,false,'https://randomuser.me/api/portraits/women/68.jpg','recruiting');

  -- Group 5: 파리 미술관 (French)
  SELECT id INTO u FROM auth.users WHERE email='seed_24@migo.app';
  UPDATE profiles SET name = 'Léa', photo_url = 'https://randomuser.me/api/portraits/women/44.jpg' WHERE id = u;
  INSERT INTO trip_groups(id,host_id,title,departure,destination,dates,max_members,tags,description,entry_fee,is_premium,cover_image,status)
  VALUES(gen_random_uuid(),u,'[Paris Départ] Voyage à Séoul et K-Culture 🇰🇷','Paris','Séoul, Corée du Sud','6월 1일~7일',4,ARRAY['예술','건축','문화'],'Départ de CDG Paris! Recherche de compagnons pour explorer Séoul. Cafés, palais historiques, et beaucoup de barbecue coréen au programme.',20000,true,'https://randomuser.me/api/portraits/women/44.jpg','recruiting');

  RAISE NOTICE '✅ Part 3: 여행 그룹 5개 완료';
END $$;
