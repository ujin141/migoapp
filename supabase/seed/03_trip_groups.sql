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
