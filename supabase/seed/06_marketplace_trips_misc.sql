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
