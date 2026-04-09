import i18n from '@/i18n'; // Assuming i18n is exported from here or adjust import

export interface PlaceRecommendation {
  id: string;
  name: string;
  type: "restaurant" | "bar" | "cafe";
  description: string;
  rating: number;
  distance: string; // e.g., "50m", "100m"
}

export interface Hotplace {
  id: string;
  name: string;
  emoji: string;
  country: string; // 국가명
  cities: string[]; // 어떤 도시에 속하는지
  lat: number;
  lng: number;
  category: 'city' | 'nature' | 'attraction' | 'club';
}

export const HOTPLACES: Hotplace[] = [
  // 한국 (Korea)
  { id: "hongdae", name: i18n.t("instant.places.hongdae", "홍대/연남 (Hongdae)"), emoji: "🎵", country: i18n.t("auto.g_0384", "한국"), cities: ["Seoul", i18n.t("auto.g_0385", "서울")], lat: 37.5563, lng: 126.9227, category: 'city' },
  { id: "gangnam", name: i18n.t("instant.places.gangnam", "강남/신논현 (Gangnam)"), emoji: "✨", country: i18n.t("auto.g_0386", "한국"), cities: ["Seoul", i18n.t("auto.g_0387", "서울")], lat: 37.4979, lng: 127.0276, category: 'city' },
  { id: "itaewon", name: i18n.t("instant.places.itaewon", "이태원 (Itaewon)"), emoji: "🌍", country: i18n.t("auto.g_0388", "한국"), cities: ["Seoul", i18n.t("auto.g_0389", "서울")], lat: 37.5340, lng: 126.9940, category: 'city' },
  { id: "busan", name: i18n.t("instant.places.busan", "광안리/해운대 (Busan)"), emoji: "🌊", country: i18n.t("auto.g_0390", "한국"), cities: ["Busan", i18n.t("auto.g_0391", "부산")], lat: 35.1557, lng: 129.1171, category: 'nature' },
  { id: "jeju", name: i18n.t("instant.places.jeju", "애월/함덕 (Jeju)"), emoji: "🍊", country: i18n.t("auto.g_0392", "한국"), cities: ["Jeju", i18n.t("auto.g_0393", "제주")], lat: 33.4658, lng: 126.3197, category: 'nature' },

  // 일본 (Japan)
  { id: "shibuya", name: i18n.t("instant.places.shibuya", "시부야 (Shibuya)"), emoji: "🗼", country: i18n.t("auto.g_0394", "일본"), cities: ["Tokyo", i18n.t("auto.g_0395", "도쿄"), i18n.t("auto.g_0396", "동경")], lat: 35.6595, lng: 139.7004, category: 'city' },
  { id: "shinjuku", name: i18n.t("instant.places.shinjuku", "신주쿠 (Shinjuku)"), emoji: "🏙️", country: i18n.t("auto.g_0397", "일본"), cities: ["Tokyo", i18n.t("auto.g_0398", "도쿄"), i18n.t("auto.g_0399", "동경")], lat: 35.6895, lng: 139.7004, category: 'city' },
  { id: "dotonbori", name: i18n.t("instant.places.dotonbori", "도톤보리 (Dotonbori)"), emoji: "🦀", country: i18n.t("auto.g_0400", "일본"), cities: ["Osaka", i18n.t("auto.g_0401", "오사카")], lat: 34.6687, lng: 135.5015, category: 'city' },
  { id: "fukuoka", name: i18n.t("instant.places.fukuoka", "텐진/나카스 (Fukuoka)"), emoji: "🍜", country: i18n.t("auto.g_0402", "일본"), cities: ["Fukuoka", i18n.t("auto.g_0403", "후쿠오카")], lat: 33.5897, lng: 130.4017, category: 'city' },

  // 동남아/대만 (SE Asia & Taiwan)
  { id: "khaosan", name: i18n.t("instant.places.khaosan", "카오산로드 (Khaosan)"), emoji: "🌺", country: i18n.t("auto.g_0404", "태국"), cities: ["Bangkok", i18n.t("auto.g_0405", "방콕")], lat: 13.7590, lng: 100.4971, category: 'city' },
  { id: "taipei", name: i18n.t("instant.places.taipei", "시먼딩 (Ximending)"), emoji: "🧋", country: i18n.t("auto.g_0406", "대만"), cities: ["Taipei", i18n.t("auto.g_0407", "타이베이")], lat: 25.0422, lng: 121.5083, category: 'city' },
  { id: "danang", name: i18n.t("instant.places.danang", "미케비치 (My Khe)"), emoji: "🏖️", country: i18n.t("auto.g_0408", "베트남"), cities: ["Da Nang", i18n.t("auto.g_0409", "다낭")], lat: 16.0544, lng: 108.2022, category: 'nature' },
  { id: "bali", name: i18n.t("instant.places.bali", "짱구/스미냑 (Canggu)"), emoji: "🌴", country: i18n.t("auto.g_0410", "인도네시아"), cities: ["Bali", i18n.t("auto.g_0411", "발리")], lat: -8.6478, lng: 115.1385, category: 'nature' },
  { id: "cebu", name: i18n.t("instant.places.cebu", "IT 파크 (IT Park)"), emoji: "🏝️", country: i18n.t("auto.g_0412", "필리핀"), cities: ["Cebu", i18n.t("auto.g_0413", "세부")], lat: 10.3276, lng: 123.9064, category: 'city' },

  // 미주/유럽/오세아니아 (West & Oceania)
  { id: "newyork", name: i18n.t("instant.places.newyork", "맨해튼 소호 (Manhattan)"), emoji: "🗽", country: i18n.t("auto.g_0414", "미국"), cities: ["New York", i18n.t("auto.g_0415", "뉴욕")], lat: 40.7128, lng: -74.0060, category: 'city' },
  { id: "london", name: i18n.t("instant.places.london", "소호/코번트가든 (London)"), emoji: "🎡", country: i18n.t("auto.g_0416", "영국"), cities: ["London", i18n.t("auto.g_0417", "런던")], lat: 51.5136, lng: -0.1365, category: 'city' },
  { id: "paris_marais", name: i18n.t("instant.places.paris_marais", "마레 지구 (Le Marais)"), emoji: "🗼", country: i18n.t("auto.g_0418", "프랑스"), cities: ["Paris", i18n.t("auto.g_0419", "파리")], lat: 48.8576, lng: 2.3592, category: 'city' },
  { id: "sydney", name: i18n.t("instant.places.sydney", "본다이/오페라 (Sydney)"), emoji: "🦘", country: i18n.t("auto.g_0420", "호주"), cities: ["Sydney", i18n.t("auto.g_0421", "시드니")], lat: -33.8915, lng: 151.2767, category: 'nature' },
  
  // 액티비티/테마파크/클럽 (Theme Parks, Clubs, Attractions)
  { id: "lotteworld", name: i18n.t("instant.places.lotteworld", "롯데월드/석촌호수 (Lotte World)"), emoji: "🎢", country: i18n.t("auto.g_0422", "한국"), cities: ["Seoul", i18n.t("auto.g_0423", "서울")], lat: 37.5113, lng: 127.0980, category: 'attraction' },
  { id: "usj", name: i18n.t("instant.places.usj", "유니버셜 스튜디오 (USJ)"), emoji: "🌎", country: i18n.t("auto.g_0424", "일본"), cities: ["Osaka", i18n.t("auto.g_0425", "오사카")], lat: 34.6654, lng: 135.4323, category: 'attraction' },
  { id: "disneyland", name: i18n.t("instant.places.disneyland", "도쿄 디즈니랜드 (Disneyland)"), emoji: "🎡", country: i18n.t("auto.g_0426", "일본"), cities: ["Tokyo", i18n.t("auto.g_0427", "도쿄")], lat: 35.6329, lng: 139.8804, category: 'attraction' },
  { id: "gyeongbokgung", name: i18n.t("instant.places.gyeongbokgung", "경복궁/북촌 (Gyeongbokgung)"), emoji: "🏯", country: i18n.t("auto.g_0428", "한국"), cities: ["Seoul", i18n.t("auto.g_0429", "서울")], lat: 37.5796, lng: 126.9770, category: 'attraction' },
  { id: "itaewon_club", name: i18n.t("instant.places.itaewon_club", "이태원 클럽 (Clubs)"), emoji: "🪩", country: i18n.t("auto.g_0430", "한국"), cities: ["Seoul", i18n.t("auto.g_0431", "서울")], lat: 37.5345, lng: 126.9945, category: 'club' },
  { id: "shibuya_club", name: i18n.t("instant.places.shibuya_club", "시부야 라운지 (Clubs)"), emoji: "🎧", country: i18n.t("auto.g_0432", "일본"), cities: ["Tokyo", i18n.t("auto.g_0433", "도쿄")], lat: 35.6580, lng: 139.6980, category: 'club' },
];

const RECOMMENDATION_DB: Record<string, PlaceRecommendation[]> = {
  hongdae: [
    { id: "h1", name: i18n.t("auto.g_0434", "상상마당 근처 펍"), type: "bar", description: i18n.t("auto.g_0435", "신나는 음악과 다양한 생맥주"), rating: 4.5, distance: "100m" },
    { id: "h2", name: i18n.t("auto.g_0436", "연트럴파크 맛집"), type: "restaurant", description: i18n.t("auto.g_0437", "웨이팅 필수 분위기 좋은 양식당"), rating: 4.8, distance: "250m" },
    { id: "h3", name: i18n.t("auto.g_0438", "루프탑 카페"), type: "cafe", description: i18n.t("auto.g_0439", "홍대 야경이 한눈에 보이는 카페"), rating: 4.3, distance: "50m" }
  ],
  gangnam: [
    { id: "g1", name: i18n.t("auto.g_0440", "강남역 11번 출구 이자카야"), type: "bar", description: i18n.t("auto.g_0441", "프라이빗 룸이 있는 깔끔한 술집"), rating: 4.6, distance: "150m" },
    { id: "g2", name: i18n.t("auto.g_0442", "신논현 고기집"), type: "restaurant", description: i18n.t("auto.g_0443", "초벌구이 삼겹살 전문점"), rating: 4.7, distance: "300m" }
  ],
  itaewon: [
    { id: "i1", name: i18n.t("auto.g_0444", "해방촌 라운지"), type: "bar", description: i18n.t("auto.g_0445", "칵테일과 야경이 멋진 이태원 라운지"), rating: 4.9, distance: "100m" },
    { id: "i2", name: i18n.t("auto.g_0446", "타코 전문점"), type: "restaurant", description: i18n.t("auto.g_0447", "외국인들이 즐겨 찾는 이국적인 맛"), rating: 4.4, distance: "50m" }
  ],
  busan: [
    { id: "b1", name: i18n.t("auto.g_0448", "광안리 오션뷰 펍"), type: "bar", description: i18n.t("auto.g_0449", "광안대교를 보며 맥주 한잔"), rating: 4.8, distance: "50m" },
    { id: "b2", name: i18n.t("auto.g_0450", "해운대 국밥집"), type: "restaurant", description: i18n.t("auto.g_0451", "현지인 추천 든든한 국밥 맛집"), rating: 4.5, distance: "200m" }
  ],
  jeju: [
    { id: "jj1", name: i18n.t("auto.g_0452", "애월 해안도로 카페"), type: "cafe", description: i18n.t("auto.g_0453", "제주 바다가 눈앞에 펼쳐지는 감성 카페"), rating: 4.8, distance: "30m" },
    { id: "jj2", name: i18n.t("auto.g_0454", "흑돼지 숯불구이"), type: "restaurant", description: i18n.t("auto.g_0455", "두툼한 제주 흑돼지와 한라산"), rating: 4.9, distance: "150m" }
  ],
  shibuya: [
    { id: "s1", name: i18n.t("auto.g_0456", "스크램블 교차로 야키토리"), type: "bar", description: i18n.t("auto.g_0457", "가볍게 꼬치와 생맥주"), rating: 4.6, distance: "150m" },
    { id: "s2", name: i18n.t("auto.g_0458", "스시 오마카세"), type: "restaurant", description: i18n.t("auto.g_0459", "현지 추천 초밥 맛집"), rating: 4.8, distance: "300m" }
  ],
  shinjuku: [
    { id: "sj1", name: i18n.t("auto.g_0460", "오모이데요코초 이자카야"), type: "bar", description: i18n.t("auto.g_0461", "레트로 감성의 뒷골목 술집"), rating: 4.7, distance: "100m" },
    { id: "sj2", name: i18n.t("auto.g_0462", "가부키초 라멘"), type: "restaurant", description: i18n.t("auto.g_0463", "심야에도 열려있는 진한 라멘"), rating: 4.5, distance: "150m" }
  ],
  dotonbori: [
    { id: "o1", name: i18n.t("auto.g_0464", "오코노미야키 맛집"), type: "restaurant", description: i18n.t("auto.g_0465", "도톤보리 강가의 철판구이"), rating: 4.9, distance: "50m" },
    { id: "o2", name: i18n.t("auto.g_0466", "글리코상 근처 선술집"), type: "bar", description: i18n.t("auto.g_0467", "퇴근 후 샐러리맨들의 성지"), rating: 4.6, distance: "100m" }
  ],
  fukuoka: [
    { id: "fk1", name: i18n.t("auto.g_0468", "나카스 포장마차(야타이)"), type: "bar", description: i18n.t("auto.g_0469", "강변에서 즐기는 야키토리와 하이볼"), rating: 4.7, distance: "50m" },
    { id: "fk2", name: i18n.t("auto.g_0470", "돈코츠 라멘 본점"), type: "restaurant", description: i18n.t("auto.g_0471", "진한 국물의 정통 하카타 라멘"), rating: 4.9, distance: "150m" }
  ],
  khaosan: [
    { id: "k1", name: i18n.t("auto.g_0472", "라이브 밴드 펍"), type: "bar", description: i18n.t("auto.g_0473", "전 세계 여행자들과 어울리는 펍"), rating: 4.7, distance: "0m" },
    { id: "k2", name: i18n.t("auto.g_0474", "길거리 팟타이"), type: "restaurant", description: i18n.t("auto.g_0475", "현지의 맛 그대로"), rating: 4.5, distance: "50m" }
  ],
  taipei: [
    { id: "tp1", name: i18n.t("auto.g_0476", "시먼 홍러우 야시장"), type: "restaurant", description: i18n.t("auto.g_0477", "지파이와 곱창국수 로컬 맛집"), rating: 4.6, distance: "100m" },
    { id: "tp2", name: i18n.t("auto.g_0478", "버블티 성지"), type: "cafe", description: i18n.t("auto.g_0479", "오리지널 대만식 프리미엄 쩐주단"), rating: 4.8, distance: "50m" }
  ],
  danang: [
    { id: "dn1", name: i18n.t("auto.g_0480", "해산물 로컬 식당"), type: "restaurant", description: i18n.t("auto.g_0481", "미케비치 앞 신선하고 저렴한 해산물"), rating: 4.6, distance: "20m" },
    { id: "dn2", name: i18n.t("auto.g_0482", "루프탑 비치 라운지"), type: "bar", description: i18n.t("auto.g_0483", "시원한 칵테일과 야자수 뷰"), rating: 4.5, distance: "200m" }
  ],
  bali: [
    { id: "bl1", name: i18n.t("auto.g_0484", "선셋 비치 클럽"), type: "bar", description: i18n.t("auto.g_0485", "짱구 해변의 황홀한 노을과 디제잉"), rating: 4.9, distance: "0m" },
    { id: "bl2", name: i18n.t("auto.g_0486", "발리식 브런치 카페"), type: "cafe", description: i18n.t("auto.g_0487", "건강한 스무디 볼과 커피"), rating: 4.7, distance: "150m" }
  ],
  cebu: [
    { id: "cb1", name: i18n.t("auto.g_0488", "세부 IT 파크 야시장"), type: "restaurant", description: i18n.t("auto.g_0489", "수많은 먹거리와 라이브 밴드"), rating: 4.5, distance: "100m" },
    { id: "cb2", name: i18n.t("auto.g_0490", "루프탑 스카이 라운지"), type: "bar", description: i18n.t("auto.g_0491", "도심 야경이 시원하게 보이는 칵테일 바"), rating: 4.6, distance: "250m" }
  ],
  newyork: [
    { id: "ny1", name: i18n.t("auto.g_0492", "소호 브런치 맛집"), type: "restaurant", description: i18n.t("auto.g_0493", "여유로운 아침을 여는 베이글 패스트라미"), rating: 4.8, distance: "100m" },
    { id: "ny2", name: i18n.t("auto.g_0494", "루프탑 이탈리안 바"), type: "bar", description: i18n.t("auto.g_0495", "맨해튼 스카이라인이 보이는 라운지"), rating: 4.9, distance: "300m" }
  ],
  london: [
    { id: "ld1", name: i18n.t("auto.g_0496", "소호 아이리시 펍"), type: "bar", description: i18n.t("auto.g_0497", "정통 기네스 생맥주와 피쉬앤칩스"), rating: 4.6, distance: "50m" },
    { id: "ld2", name: i18n.t("auto.g_0498", "코번트가든 애프터눈 티"), type: "cafe", description: i18n.t("auto.g_0499", "영국 황실 스타일의 럭셔리 티타임"), rating: 4.7, distance: "200m" }
  ],
  paris_marais: [
    { id: "p1", name: i18n.t("auto.g_0500", "테라스 와인바"), type: "bar", description: i18n.t("auto.g_0501", "파리지앵들이 즐기는 와인과 치즈"), rating: 4.8, distance: "200m" },
    { id: "p2", name: i18n.t("auto.g_0502", "클래식 프렌치 비스트로"), type: "restaurant", description: i18n.t("auto.g_0503", "정통 프랑스 코스 요리"), rating: 4.9, distance: "300m" }
  ],
  sydney: [
    { id: "sd1", name: i18n.t("auto.g_0504", "하버뷰 오이스터 바"), type: "restaurant", description: i18n.t("auto.g_0505", "탁 트인 뷰와 신선한 굴 요리"), rating: 4.8, distance: "150m" },
    { id: "sd2", name: i18n.t("auto.g_0506", "본다이 비치 펍"), type: "bar", description: i18n.t("auto.g_0507", "서퍼들의 성지, 시원한 호주 생맥주"), rating: 4.7, distance: "50m" }
  ],
  lotteworld: [
    { id: "lw1", name: i18n.t("auto.g_0508", "석촌호수 뷰 카페"), type: "cafe", description: i18n.t("auto.g_0509", "놀이공원 야경이 예쁜 감성 카페"), rating: 4.8, distance: "100m" },
    { id: "lw2", name: i18n.t("auto.g_0510", "송리단길 다이닝"), type: "restaurant", description: i18n.t("auto.g_0511", "웨이팅 필수 핫! 데이트 코스"), rating: 4.6, distance: "300m" }
  ],
  usj: [
    { id: "usj1", name: i18n.t("auto.g_0512", "시티워크 테마 펍"), type: "bar", description: i18n.t("auto.g_0513", "테마파크 퇴장 후 다같이 맥주 한잔!"), rating: 4.7, distance: "50m" },
    { id: "usj2", name: i18n.t("auto.g_0514", "타코야키 뮤지엄"), type: "restaurant", description: i18n.t("auto.g_0515", "오사카 명물 타코야키 파티"), rating: 4.5, distance: "100m" }
  ],
  disneyland: [
    { id: "ds1", name: i18n.t("auto.g_0516", "익스피어리 다이닝"), type: "restaurant", description: i18n.t("auto.g_0517", "랜드 옆 대형 쇼핑몰 맛집"), rating: 4.6, distance: "150m" },
    { id: "ds2", name: i18n.t("auto.g_0518", "디즈니 테마 라운지"), type: "bar", description: i18n.t("auto.g_0519", "어른들만의 꿈과 희망의 칵테일 바"), rating: 4.7, distance: "200m" }
  ],
  gyeongbokgung: [
    { id: "gb1", name: i18n.t("auto.g_0520", "북촌 한옥 비스트로"), type: "restaurant", description: i18n.t("auto.g_0521", "전통과 현대가 공존하는 퓨전 한식"), rating: 4.8, distance: "200m" },
    { id: "gb2", name: i18n.t("auto.g_0522", "삼청동 테라스 카페"), type: "cafe", description: i18n.t("auto.g_0523", "경복궁 야경 피크닉 후 티타임"), rating: 4.7, distance: "150m" }
  ],
  itaewon_club: [
    { id: "itc1", name: i18n.t("auto.g_0524", "심야 클럽 앤 라운지"), type: "bar", description: i18n.t("auto.g_0525", "신나는 음악과 애프터 파티 칵테일"), rating: 4.9, distance: "50m" },
    { id: "itc2", name: i18n.t("auto.g_0526", "새벽 햄버거 펍"), type: "restaurant", description: i18n.t("auto.g_0527", "놀고 나서 허기 달래기 좋은 수제버거"), rating: 4.6, distance: "100m" }
  ],
  shibuya_club: [
    { id: "sbc1", name: i18n.t("auto.g_0528", "대형 클럽 VIP 테이블"), type: "bar", description: i18n.t("auto.g_0529", "조인해서 같이 신나게 춤추기 좋은 곳"), rating: 4.8, distance: "50m" },
    { id: "sbc2", name: i18n.t("auto.g_0530", "시부야 심야 야키토리"), type: "restaurant", description: i18n.t("auto.g_0531", "아침까지 영업하는 꼬치구이 맛집"), rating: 4.5, distance: "200m" }
  ]
};

// 기본 반환 템플릿(지정 핫플레이스가 아닐 시)
const DEFAULT_RECOMMENDATIONS: PlaceRecommendation[] = [
  { id: "d1", name: i18n.t("auto.g_0532", "분위기 좋은 로컬 펍"), type: "bar", description: i18n.t("auto.g_0533", "시원한 생맥주와 대화하기 좋은 분위기"), rating: 4.5, distance: "100m" },
  { id: "d2", name: i18n.t("auto.g_0534", "인기 플레이스 식당"), type: "restaurant", description: i18n.t("auto.g_0535", "이 근처에서 가장 리뷰가 많은 맛집"), rating: 4.6, distance: "150m" },
  { id: "d3", name: i18n.t("auto.g_0536", "조용한 감성 카페"), type: "cafe", description: i18n.t("auto.g_0537", "부담없이 만나서 대화하기 좋은 곳"), rating: 4.4, distance: "50m" }
];

export function getRecommendationsForHotplace(hotplaceId: string): PlaceRecommendation[] {
  return RECOMMENDATION_DB[hotplaceId] || DEFAULT_RECOMMENDATIONS;
}
