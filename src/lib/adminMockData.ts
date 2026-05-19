// ============================================================
// adminMockData.ts — 어드민 패널 Mock 데이터
// DB 미연결 환경에서 풍부한 샘플 데이터 제공
// ============================================================

export const MOCK_USERS = [
  { id:"u1", name:"김민준", email:"minjun@example.com", nationality:"KR", location:"Seoul, Korea", age:27, gender:"male", plan:"premium", is_plus:true, verified:true, banned:false, created_at:"2024-11-01T09:00:00Z", plus_expires_at:"2025-12-01T00:00:00Z", bio:"여행을 사랑하는 사진작가입니다.", interests:["사진","음식","등산"], mbti:"ENFP", photo_url:"https://i.pravatar.cc/150?img=1" },
  { id:"u2", name:"Sarah Johnson", email:"sarah.j@example.com", nationality:"US", location:"New York, USA", age:25, gender:"female", plan:"plus", is_plus:true, verified:true, banned:false, created_at:"2024-11-05T10:00:00Z", plus_expires_at:"2025-06-05T00:00:00Z", bio:"Solo traveler & coffee lover.", interests:["커피","독서","요가"], mbti:"INFJ", photo_url:"https://i.pravatar.cc/150?img=2" },
  { id:"u3", name:"이지호", email:"jiho@example.com", nationality:"KR", location:"Busan, Korea", age:30, gender:"male", plan:"free", is_plus:false, verified:false, banned:false, created_at:"2024-12-01T08:00:00Z", plus_expires_at:null, bio:"부산 사나이, 해산물 마니아.", interests:["서핑","음식"], mbti:"ISTP", photo_url:"https://i.pravatar.cc/150?img=3" },
  { id:"u4", name:"Emma Wilson", email:"emma.w@example.com", nationality:"UK", location:"London, UK", age:28, gender:"female", plan:"plus", is_plus:true, verified:true, banned:false, created_at:"2024-10-15T07:00:00Z", plus_expires_at:"2025-04-15T00:00:00Z", bio:"Museum addict and tea enthusiast.", interests:["박물관","차","문화"], mbti:"INTJ", photo_url:"https://i.pravatar.cc/150?img=4" },
  { id:"u5", name:"박지수", email:"jisoo@example.com", nationality:"KR", location:"Jeju, Korea", age:24, gender:"female", plan:"free", is_plus:false, verified:false, banned:true, created_at:"2025-01-10T11:00:00Z", plus_expires_at:null, bio:"제주살이 중.", interests:["자연","카페"], mbti:"ESFP", photo_url:"https://i.pravatar.cc/150?img=5" },
  { id:"u6", name:"Yuki Tanaka", email:"yuki@example.com", nationality:"JP", location:"Tokyo, Japan", age:26, gender:"female", plan:"premium", is_plus:true, verified:true, banned:false, created_at:"2024-09-20T06:00:00Z", plus_expires_at:"2026-01-01T00:00:00Z", bio:"Anime fan meets real adventures.", interests:["애니","음식","쇼핑"], mbti:"ENFJ", photo_url:"https://i.pravatar.cc/150?img=6" },
  { id:"u7", name:"Carlos Mendez", email:"carlos@example.com", nationality:"MX", location:"Mexico City, Mexico", age:32, gender:"male", plan:"free", is_plus:false, verified:true, banned:false, created_at:"2025-01-20T14:00:00Z", plus_expires_at:null, bio:"Chef & food explorer.", interests:["요리","여행"], mbti:"ENTP", photo_url:"https://i.pravatar.cc/150?img=7" },
  { id:"u8", name:"최은서", email:"eunseo@example.com", nationality:"KR", location:"Seoul, Korea", age:22, gender:"female", plan:"plus", is_plus:true, verified:false, banned:false, created_at:"2025-02-01T09:30:00Z", plus_expires_at:"2025-08-01T00:00:00Z", bio:"디지털 노마드 꿈나무.", interests:["코딩","카페"], mbti:"INTP", photo_url:"https://i.pravatar.cc/150?img=8" },
  { id:"u9", name:"Liam Chen", email:"liam.c@example.com", nationality:"SG", location:"Singapore", age:29, gender:"male", plan:"premium", is_plus:true, verified:true, banned:false, created_at:"2024-08-11T12:00:00Z", plus_expires_at:"2025-08-11T00:00:00Z", bio:"Finance by day, foodie by night.", interests:["음식","투자"], mbti:"ESTJ", photo_url:"https://i.pravatar.cc/150?img=9" },
  { id:"u10", name:"Sofia Rossi", email:"sofia@example.com", nationality:"IT", location:"Rome, Italy", age:27, gender:"female", plan:"free", is_plus:false, verified:true, banned:false, created_at:"2025-01-25T16:00:00Z", plus_expires_at:null, bio:"Pasta & art lover.", interests:["예술","요리","패션"], mbti:"ISFP", photo_url:"https://i.pravatar.cc/150?img=10" },
];

export const MOCK_POSTS = [
  { id:"p1", content:"도쿄 여행 후기! 신주쿠에서 만난 현지 친구들 덕분에 정말 특별한 경험을 했어요 🗼", tags:["일본","도쿄"], image_url:"https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400", created_at:"2025-05-18T10:00:00Z", hidden:false, pinned:true, authorName:"김민준", likes:142, comments:28 },
  { id:"p2", content:"바르셀로나 사그라다 파밀리아! 이 건물 앞에서 한국인 여행자들과 즉석 사진 모임을 했답니다 🇪🇸", tags:["스페인","건축"], image_url:"https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400", created_at:"2025-05-17T14:00:00Z", hidden:false, pinned:false, authorName:"Sarah Johnson", likes:98, comments:15 },
  { id:"p3", content:"제주 올레길 7코스 완주! 다리는 아프지만 마음은 가득 차요 🍊", tags:["제주","등산"], image_url:"https://images.unsplash.com/photo-1580407996489-1de3f93b1cec?w=400", created_at:"2025-05-16T09:00:00Z", hidden:false, pinned:false, authorName:"이지호", likes:67, comments:9 },
  { id:"p4", content:"부적절한 광고성 게시글입니다 (숨김 처리됨)", tags:[], image_url:null, created_at:"2025-05-15T08:00:00Z", hidden:true, pinned:false, authorName:"Unknown", likes:0, comments:0 },
  { id:"p5", content:"교토의 금각사, 새벽 6시에 가면 사람이 없어요! 꿀팁 공유합니다 🍵", tags:["일본","교토"], image_url:"https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400", created_at:"2025-05-14T07:00:00Z", hidden:false, pinned:false, authorName:"Yuki Tanaka", likes:201, comments:44 },
];

export const MOCK_REPORTS = [
  { id:"r1", reason:"스팸/광고", status:"pending", created_at:"2025-05-18T11:00:00Z", reporterName:"김민준", targetType:"user", targetName:"Unknown User", description:"광고성 DM을 반복적으로 발송함" },
  { id:"r2", reason:"부적절한 콘텐츠", status:"pending", created_at:"2025-05-17T15:00:00Z", reporterName:"Sarah Johnson", targetType:"post", targetName:"게시글 #4", description:"성인 콘텐츠 포함" },
  { id:"r3", reason:"허위 프로필", status:"resolved", created_at:"2025-05-16T10:00:00Z", reporterName:"이지호", targetType:"user", targetName:"Fake User", description:"타인의 사진을 도용한 프로필" },
  { id:"r4", reason:"괴롭힘/위협", status:"dismissed", created_at:"2025-05-15T09:00:00Z", reporterName:"Emma Wilson", targetType:"user", targetName:"박지수", description:"채팅에서 위협적 메시지 발송" },
  { id:"r5", reason:"사기", status:"pending", created_at:"2025-05-14T08:00:00Z", reporterName:"Carlos Mendez", targetType:"marketplace", targetName:"중고 카메라 판매글", description:"입금 후 연락두절" },
];

export const MOCK_GROUPS = [
  { id:"g1", title:"도쿄 벚꽃 여행단 🌸", destination:"Tokyo, Japan", max_members:8, is_premium:true, entry_fee:50000, created_at:"2025-04-01T00:00:00Z", status:"active", hostName:"Yuki Tanaka", memberCount:6 },
  { id:"g2", title:"바르셀로나 한달살기", destination:"Barcelona, Spain", max_members:5, is_premium:false, entry_fee:0, created_at:"2025-04-10T00:00:00Z", status:"active", hostName:"Sarah Johnson", memberCount:4 },
  { id:"g3", title:"제주 올레길 완주 챌린지", destination:"Jeju, Korea", max_members:10, is_premium:false, entry_fee:0, created_at:"2025-03-20T00:00:00Z", status:"active", hostName:"이지호", memberCount:7 },
  { id:"g4", title:"싱가포르 맛집 투어 🍜", destination:"Singapore", max_members:6, is_premium:true, entry_fee:30000, created_at:"2025-05-01T00:00:00Z", status:"active", hostName:"Liam Chen", memberCount:5 },
  { id:"g5", title:"로마 역사 탐방단", destination:"Rome, Italy", max_members:8, is_premium:false, entry_fee:0, created_at:"2025-02-15T00:00:00Z", status:"closed", hostName:"Sofia Rossi", memberCount:8 },
];

export const MOCK_VERIFICATIONS = [
  { id:"v1", user_id:"u3", status:"pending", created_at:"2025-05-18T09:00:00Z", userName:"이지호", userEmail:"jiho@example.com", id_type:"passport", front_url:"https://via.placeholder.com/300x200?text=ID+Front", back_url:"https://via.placeholder.com/300x200?text=ID+Back" },
  { id:"v2", user_id:"u8", status:"pending", created_at:"2025-05-17T10:00:00Z", userName:"최은서", userEmail:"eunseo@example.com", id_type:"resident_card", front_url:"https://via.placeholder.com/300x200?text=ID+Front", back_url:null },
  { id:"v3", user_id:"u5", status:"rejected", created_at:"2025-05-15T11:00:00Z", userName:"박지수", userEmail:"jisoo@example.com", id_type:"passport", front_url:"https://via.placeholder.com/300x200?text=ID+Front", back_url:null },
];

export const MOCK_MARKETPLACE = [
  { id:"m1", title:"Sony A7III 카메라 판매", price:1500000, category:"electronics", status:"active", created_at:"2025-05-10T00:00:00Z", sellerName:"김민준", image_url:"https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300" },
  { id:"m2", title:"여행용 백팩 (45L)", price:85000, category:"travel", status:"active", created_at:"2025-05-12T00:00:00Z", sellerName:"Emma Wilson", image_url:"https://images.unsplash.com/photo-1622260614153-03223fb72052?w=300" },
  { id:"m3", title:"도쿄 JR패스 7일권 (미사용)", price:120000, category:"tickets", status:"sold", created_at:"2025-05-08T00:00:00Z", sellerName:"Yuki Tanaka", image_url:"https://images.unsplash.com/photo-1580407996489-1de3f93b1cec?w=300" },
  { id:"m4", title:"싱가포르 이심 30일", price:25000, category:"telecom", status:"active", created_at:"2025-05-14T00:00:00Z", sellerName:"Liam Chen", image_url:"https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=300" },
];

export const MOCK_SAFETY = [
  { id:"s1", user_id:"u2", type:"sos", status:"active", location:"Madrid, Spain", created_at:"2025-05-18T03:00:00Z", resolved_at:null, userName:"Sarah Johnson", userEmail:"sarah.j@example.com", userPhoto:"https://i.pravatar.cc/150?img=2", notes:"늦은 밤 혼자 이동 중" },
  { id:"s2", user_id:"u4", type:"checkin", status:"resolved", location:"Lisbon, Portugal", created_at:"2025-05-17T18:00:00Z", resolved_at:"2025-05-17T18:30:00Z", userName:"Emma Wilson", userEmail:"emma.w@example.com", userPhoto:"https://i.pravatar.cc/150?img=4", notes:"안전 확인됨" },
  { id:"s3", user_id:"u6", type:"sos", status:"resolved", location:"Osaka, Japan", created_at:"2025-05-16T22:00:00Z", resolved_at:"2025-05-16T22:45:00Z", userName:"Yuki Tanaka", userEmail:"yuki@example.com", userPhoto:"https://i.pravatar.cc/150?img=6", notes:"지갑 분실, 경찰서 도움 받음" },
];

export const MOCK_CHATS = [
  { id:"c1", thread_id:"t1", participants:["김민준","Sarah Johnson"], lastMessage:"도쿄역에서 만나요!", messageCount:24, created_at:"2025-05-18T10:00:00Z", isGroup:false },
  { id:"c2", thread_id:"t2", participants:["도쿄 벚꽃 여행단"], lastMessage:"내일 아사쿠사 몇 시에 모여요?", messageCount:156, created_at:"2025-05-17T15:00:00Z", isGroup:true },
  { id:"c3", thread_id:"t3", participants:["이지호","Emma Wilson"], lastMessage:"제주 일정 공유드립니다!", messageCount:12, created_at:"2025-05-16T09:00:00Z", isGroup:false },
  { id:"c4", thread_id:"t4", participants:["바르셀로나 한달살기"], lastMessage:"오늘 저녁 가우디 투어 어때요?", messageCount:87, created_at:"2025-05-15T18:00:00Z", isGroup:true },
];

export const MOCK_REVENUE = {
  total: 48750000,
  monthly: 12300000,
  subs: 142,
  purchases: 89,
  churnRate: 8,
  subscriptions: [
    { id:"sub1", userName:"김민준", plan:"premium", price_krw:99900, status:"active", created_at:"2025-04-01T00:00:00Z", expires_at:"2026-04-01T00:00:00Z" },
    { id:"sub2", userName:"Sarah Johnson", plan:"plus", price_krw:14900, status:"active", created_at:"2025-05-01T00:00:00Z", expires_at:"2025-06-01T00:00:00Z" },
    { id:"sub3", userName:"Yuki Tanaka", plan:"premium", price_krw:99900, status:"active", created_at:"2025-01-01T00:00:00Z", expires_at:"2026-01-01T00:00:00Z" },
    { id:"sub4", userName:"Emma Wilson", plan:"plus", price_krw:34900, status:"active", created_at:"2025-02-01T00:00:00Z", expires_at:"2025-05-01T00:00:00Z" },
    { id:"sub5", userName:"Liam Chen", plan:"premium", price_krw:99900, status:"active", created_at:"2024-08-01T00:00:00Z", expires_at:"2025-08-01T00:00:00Z" },
    { id:"sub6", userName:"최은서", plan:"plus", price_krw:14900, status:"active", created_at:"2025-02-01T00:00:00Z", expires_at:"2025-08-01T00:00:00Z" },
    { id:"sub7", userName:"Carlos Mendez", plan:"plus", price_krw:14900, status:"cancelled", created_at:"2025-01-01T00:00:00Z", expires_at:"2025-02-01T00:00:00Z" },
  ],
  monthly_chart: [
    { month:"12월", revenue:6800000, subs:98 },
    { month:"1월", revenue:8200000, subs:112 },
    { month:"2월", revenue:9100000, subs:118 },
    { month:"3월", revenue:10400000, subs:127 },
    { month:"4월", revenue:11700000, subs:135 },
    { month:"5월", revenue:12300000, subs:142 },
  ],
};

export const MOCK_ANALYTICS = {
  activeUsers: 1247,
  dau: 342,
  monthlySignups: [
    { month:"12월", users:145 },
    { month:"1월", users:189 },
    { month:"2월", users:234 },
    { month:"3월", users:278 },
    { month:"4월", users:312 },
    { month:"5월", users:189 },
  ],
  gender: [
    { gender:"male", count:521 },
    { gender:"female", count:634 },
    { gender:"other", count:92 },
  ],
  nationality: [
    { country:"KR", count:412 },
    { country:"US", count:198 },
    { country:"JP", count:156 },
    { country:"UK", count:89 },
    { country:"SG", count:78 },
    { country:"AU", count:67 },
    { country:"DE", count:54 },
    { country:"FR", count:48 },
    { country:"IT", count:45 },
    { country:"MX", count:42 },
  ],
  weekly: [
    { day:"월", users:48, matches:23, revenue:890000 },
    { day:"화", users:52, matches:31, revenue:1020000 },
    { day:"수", users:61, matches:28, revenue:980000 },
    { day:"목", users:55, matches:34, revenue:1150000 },
    { day:"금", users:78, matches:42, revenue:1380000 },
    { day:"토", users:94, matches:56, revenue:1720000 },
    { day:"일", users:87, matches:49, revenue:1590000 },
  ],
  retentionRate: 68,
  avgSessionMin: 12.4,
  matchRate: 34,
};

export const MOCK_ANNOUNCEMENTS = [
  { id:"a1", title:"Migo v3.0 업데이트 안내", content:"새로운 슈퍼라이크 기능과 그룹 여행 기능이 추가되었습니다!", type:"update", created_at:"2025-05-15T09:00:00Z", is_active:true },
  { id:"a2", title:"서버 점검 예정 (5/20 새벽 2시)", content:"더 나은 서비스를 위해 잠시 점검이 있을 예정입니다.", type:"warning", created_at:"2025-05-14T10:00:00Z", is_active:true },
  { id:"a3", title:"여름 프리미엄 할인 이벤트!", content:"6월 한 달간 Premium 구독 30% 할인 진행합니다.", type:"info", created_at:"2025-05-10T08:00:00Z", is_active:true },
];

export const MOCK_ACTIVITY_LOG = [
  { id:"l1", action:"USER_BAN", admin:"admin@migo.app", target:"박지수", detail:"커뮤니티 가이드라인 위반", created_at:"2025-05-18T11:30:00Z" },
  { id:"l2", action:"POST_HIDDEN", admin:"admin@migo.app", target:"게시글 #4", detail:"광고성 콘텐츠 숨김 처리", created_at:"2025-05-17T16:00:00Z" },
  { id:"l3", action:"VERIF_APPROVED", admin:"admin@migo.app", target:"이지호", detail:"신분증 심사 승인 (여권)", created_at:"2025-05-17T14:00:00Z" },
  { id:"l4", action:"REPORT_RESOLVED", admin:"admin@migo.app", target:"신고 #3", detail:"허위 프로필 신고 처리 완료", created_at:"2025-05-16T11:00:00Z" },
  { id:"l5", action:"PLAN_GRANTED", admin:"admin@migo.app", target:"최은서", detail:"Plus 30일 수동 부여", created_at:"2025-05-15T10:00:00Z" },
  { id:"l6", action:"ANNOUNCEMENT", admin:"admin@migo.app", target:"전체 유저", detail:"v3.0 업데이트 공지 발행", created_at:"2025-05-14T09:00:00Z" },
  { id:"l7", action:"PUSH_SENT", admin:"admin@migo.app", target:"Plus 유저 142명", detail:"여름 할인 마케팅 푸시 발송", created_at:"2025-05-13T08:00:00Z" },
  { id:"l8", action:"USER_DELETE", admin:"admin@migo.app", target:"Fake User", detail:"허위 프로필 계정 영구 삭제", created_at:"2025-05-12T15:00:00Z" },
  { id:"l9", action:"PROMO_CREATED", admin:"admin@migo.app", target:"SUMMER30", detail:"프로모 코드 생성 (30% 할인)", created_at:"2025-05-10T10:00:00Z" },
  { id:"l10", action:"MARKETPLACE_HIDDEN", admin:"admin@migo.app", target:"마켓 상품 #5", detail:"사기 의심 상품 숨김 처리", created_at:"2025-05-09T13:00:00Z" },
];

export const MOCK_APP_SETTINGS = {
  max_daily_likes: 20,
  max_daily_dm_free: 5,
  super_like_daily_limit: 1,
  boost_duration_minutes: 30,
  min_age_requirement: 18,
  maintenance_mode: false,
  new_user_registration: true,
  force_update_version: "3.0.0",
  app_store_url: "https://apps.apple.com/app/migo",
  play_store_url: "https://play.google.com/store/apps/details?id=com.migo",
  support_email: "support@migo.app",
  terms_version: "2024.1",
  welcome_bonus_superlike: 3,
  referral_bonus_days: 7,
};

export const MOCK_STATS = {
  users: 1247,
  posts: 3892,
  groups: 284,
  reports: 5,
  activeAds: 3,
};

export const MOCK_TODAY = {
  newUsers: 23,
  sosCheckins: 2,
  activeChats: 189,
  newReports: 3,
};
