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
