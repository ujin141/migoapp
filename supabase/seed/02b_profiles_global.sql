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
