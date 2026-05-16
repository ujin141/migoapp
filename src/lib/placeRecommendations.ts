// placeRecommendations.ts
// ⚠️ 이 파일은 모듈 최상위에서 i18n.t()를 호출하지 않습니다.
// i18n 초기화 전에 import되면 번역값이 undefined가 되어 마커 데이터 전체가 깨집니다.

export interface PlaceRecommendation {
  id: string;
  name: string;
  type: "restaurant" | "bar" | "cafe";
  description: string;
  rating: number;
  distance: string;
}

export interface Hotplace {
  id: string;
  name: string;
  nameKey: string;   // i18n 번역 키 (컴포넌트에서 useTranslation으로 처리)
  emoji: string;
  country: string;
  countryKey: string;
  cities: string[];
  lat: number;
  lng: number;
  category: 'city' | 'nature' | 'attraction' | 'club';
}

export const HOTPLACES: Hotplace[] = [
  // 한국 (Korea)
  { id: "hongdae",       name: "홍대/연남 (Hongdae)",             nameKey: "instant.places.hongdae",       emoji: "🎵", country: "한국",        countryKey: "auto.g_0384", cities: ["Seoul", "서울"],         lat: 37.5563, lng: 126.9227, category: 'city' },
  { id: "gangnam",       name: "강남/신논현 (Gangnam)",            nameKey: "instant.places.gangnam",       emoji: "✨", country: "한국",        countryKey: "auto.g_0386", cities: ["Seoul", "서울"],         lat: 37.4979, lng: 127.0276, category: 'city' },
  { id: "itaewon",       name: "이태원 (Itaewon)",                 nameKey: "instant.places.itaewon",       emoji: "🌍", country: "한국",        countryKey: "auto.g_0388", cities: ["Seoul", "서울"],         lat: 37.5340, lng: 126.9940, category: 'city' },
  { id: "busan",         name: "광안리/해운대 (Busan)",            nameKey: "instant.places.busan",         emoji: "🌊", country: "한국",        countryKey: "auto.g_0390", cities: ["Busan", "부산"],         lat: 35.1557, lng: 129.1171, category: 'nature' },
  { id: "jeju",          name: "애월/함덕 (Jeju)",                 nameKey: "instant.places.jeju",          emoji: "🍊", country: "한국",        countryKey: "auto.g_0392", cities: ["Jeju", "제주"],          lat: 33.4658, lng: 126.3197, category: 'nature' },

  // 일본 (Japan)
  { id: "shibuya",       name: "시부야 (Shibuya)",                 nameKey: "instant.places.shibuya",       emoji: "🗼", country: "일본",        countryKey: "auto.g_0394", cities: ["Tokyo", "도쿄"],         lat: 35.6595, lng: 139.7004, category: 'city' },
  { id: "shinjuku",      name: "신주쿠 (Shinjuku)",               nameKey: "instant.places.shinjuku",      emoji: "🏙️", country: "일본",       countryKey: "auto.g_0397", cities: ["Tokyo", "도쿄"],         lat: 35.6895, lng: 139.7004, category: 'city' },
  { id: "dotonbori",     name: "도톤보리 (Dotonbori)",            nameKey: "instant.places.dotonbori",     emoji: "🦀", country: "일본",        countryKey: "auto.g_0400", cities: ["Osaka", "오사카"],       lat: 34.6687, lng: 135.5015, category: 'city' },
  { id: "fukuoka",       name: "텐진/나카스 (Fukuoka)",           nameKey: "instant.places.fukuoka",       emoji: "🍜", country: "일본",        countryKey: "auto.g_0402", cities: ["Fukuoka", "후쿠오카"],   lat: 33.5897, lng: 130.4017, category: 'city' },

  // 동남아/대만 (SE Asia & Taiwan)
  { id: "khaosan",       name: "카오산로드 (Khaosan)",            nameKey: "instant.places.khaosan",       emoji: "🌺", country: "태국",        countryKey: "auto.g_0404", cities: ["Bangkok", "방콕"],       lat: 13.7590, lng: 100.4971, category: 'city' },
  { id: "taipei",        name: "시먼딩 (Ximending)",              nameKey: "instant.places.taipei",        emoji: "🧋", country: "대만",        countryKey: "auto.g_0406", cities: ["Taipei", "타이베이"],    lat: 25.0422, lng: 121.5083, category: 'city' },
  { id: "danang",        name: "미케비치 (My Khe)",               nameKey: "instant.places.danang",        emoji: "🏖️", country: "베트남",     countryKey: "auto.g_0408", cities: ["Da Nang", "다낭"],       lat: 16.0544, lng: 108.2022, category: 'nature' },
  { id: "bali",          name: "짱구/스미냑 (Canggu)",            nameKey: "instant.places.bali",          emoji: "🌴", country: "인도네시아",  countryKey: "auto.g_0410", cities: ["Bali", "발리"],          lat: -8.6478, lng: 115.1385, category: 'nature' },
  { id: "cebu",          name: "IT 파크 (IT Park)",               nameKey: "instant.places.cebu",          emoji: "🏝️", country: "필리핀",     countryKey: "auto.g_0412", cities: ["Cebu", "세부"],          lat: 10.3276, lng: 123.9064, category: 'city' },

  // 미주/유럽/오세아니아
  { id: "newyork",       name: "맨해튼 소호 (Manhattan)",         nameKey: "instant.places.newyork",       emoji: "🗽", country: "미국",        countryKey: "auto.g_0414", cities: ["New York", "뉴욕"],      lat: 40.7128, lng: -74.0060, category: 'city' },
  { id: "london",        name: "소호/코번트가든 (London)",        nameKey: "instant.places.london",        emoji: "🎡", country: "영국",        countryKey: "auto.g_0416", cities: ["London", "런던"],        lat: 51.5136, lng: -0.1365,  category: 'city' },
  { id: "paris_marais",  name: "마레 지구 (Le Marais)",           nameKey: "instant.places.paris_marais",  emoji: "🗼", country: "프랑스",      countryKey: "auto.g_0418", cities: ["Paris", "파리"],         lat: 48.8576, lng: 2.3592,   category: 'city' },
  { id: "sydney",        name: "본다이/오페라 (Sydney)",          nameKey: "instant.places.sydney",        emoji: "🦘", country: "호주",        countryKey: "auto.g_0420", cities: ["Sydney", "시드니"],      lat: -33.8915, lng: 151.2767, category: 'nature' },

  // 액티비티/테마파크/클럽
  { id: "lotteworld",    name: "롯데월드/석촌호수 (Lotte World)", nameKey: "instant.places.lotteworld",    emoji: "🎢", country: "한국",        countryKey: "auto.g_0422", cities: ["Seoul", "서울"],         lat: 37.5113, lng: 127.0980, category: 'attraction' },
  { id: "usj",           name: "유니버셜 스튜디오 (USJ)",        nameKey: "instant.places.usj",           emoji: "🌎", country: "일본",        countryKey: "auto.g_0424", cities: ["Osaka", "오사카"],       lat: 34.6654, lng: 135.4323, category: 'attraction' },
  { id: "disneyland",    name: "도쿄 디즈니랜드 (Disneyland)",   nameKey: "instant.places.disneyland",    emoji: "🎡", country: "일본",        countryKey: "auto.g_0426", cities: ["Tokyo", "도쿄"],         lat: 35.6329, lng: 139.8804, category: 'attraction' },
  { id: "gyeongbokgung", name: "경복궁/북촌 (Gyeongbokgung)",   nameKey: "instant.places.gyeongbokgung", emoji: "🏯", country: "한국",        countryKey: "auto.g_0428", cities: ["Seoul", "서울"],         lat: 37.5796, lng: 126.9770, category: 'attraction' },
  { id: "itaewon_club",  name: "이태원 클럽 (Clubs)",            nameKey: "instant.places.itaewon_club",  emoji: "🪩", country: "한국",        countryKey: "auto.g_0430", cities: ["Seoul", "서울"],         lat: 37.5345, lng: 126.9945, category: 'club' },
  { id: "shibuya_club",  name: "시부야 라운지 (Clubs)",          nameKey: "instant.places.shibuya_club",  emoji: "🎧", country: "일본",        countryKey: "auto.g_0432", cities: ["Tokyo", "도쿄"],         lat: 35.6580, lng: 139.6980, category: 'club' },
];

// ─── 정적 맛집 추천 데이터 (i18n 없음) ───────────────────────────────────────
const RECOMMENDATION_DB: Record<string, PlaceRecommendation[]> = {
  hongdae: [
    { id: "h1",  name: "상상마당 근처 펍",      type: "bar",        description: "신나는 음악과 다양한 생맥주",          rating: 4.5, distance: "100m" },
    { id: "h2",  name: "연트럴파크 맛집",       type: "restaurant", description: "웨이팅 필수 분위기 좋은 양식당",       rating: 4.8, distance: "250m" },
    { id: "h3",  name: "루프탑 카페",           type: "cafe",       description: "홍대 야경이 한눈에 보이는 카페",       rating: 4.3, distance: "50m"  },
  ],
  gangnam: [
    { id: "g1",  name: "강남역 11번 출구 이자카야", type: "bar",     description: "프라이빗 룸이 있는 깔끔한 술집",      rating: 4.6, distance: "150m" },
    { id: "g2",  name: "신논현 고기집",          type: "restaurant", description: "초벌구이 삼겹살 전문점",               rating: 4.7, distance: "300m" },
  ],
  itaewon: [
    { id: "i1",  name: "해방촌 라운지",          type: "bar",        description: "칵테일과 야경이 멋진 이태원 라운지",   rating: 4.9, distance: "100m" },
    { id: "i2",  name: "타코 전문점",            type: "restaurant", description: "외국인들이 즐겨 찾는 이국적인 맛",     rating: 4.4, distance: "50m"  },
  ],
  busan: [
    { id: "b1",  name: "광안리 오션뷰 펍",       type: "bar",        description: "광안대교를 보며 맥주 한잔",            rating: 4.8, distance: "50m"  },
    { id: "b2",  name: "해운대 국밥집",          type: "restaurant", description: "현지인 추천 든든한 국밥 맛집",         rating: 4.5, distance: "200m" },
  ],
  jeju: [
    { id: "jj1", name: "애월 해안도로 카페",     type: "cafe",       description: "제주 바다가 눈앞에 펼쳐지는 감성 카페", rating: 4.8, distance: "30m"  },
    { id: "jj2", name: "흑돼지 숯불구이",        type: "restaurant", description: "두툼한 제주 흑돼지와 한라산",          rating: 4.9, distance: "150m" },
  ],
  shibuya: [
    { id: "s1",  name: "스크램블 교차로 야키토리", type: "bar",      description: "가볍게 꼬치와 생맥주",                 rating: 4.6, distance: "150m" },
    { id: "s2",  name: "스시 오마카세",          type: "restaurant", description: "현지 추천 초밥 맛집",                  rating: 4.8, distance: "300m" },
  ],
  shinjuku: [
    { id: "sj1", name: "오모이데요코초 이자카야", type: "bar",       description: "레트로 감성의 뒷골목 술집",            rating: 4.7, distance: "100m" },
    { id: "sj2", name: "가부키초 라멘",          type: "restaurant", description: "심야에도 열려있는 진한 라멘",          rating: 4.5, distance: "150m" },
  ],
  dotonbori: [
    { id: "o1",  name: "오코노미야키 맛집",       type: "restaurant", description: "도톤보리 강가의 철판구이",             rating: 4.9, distance: "50m"  },
    { id: "o2",  name: "글리코상 근처 선술집",   type: "bar",        description: "퇴근 후 샐러리맨들의 성지",            rating: 4.6, distance: "100m" },
  ],
  fukuoka: [
    { id: "fk1", name: "나카스 포장마차(야타이)", type: "bar",       description: "강변에서 즐기는 야키토리와 하이볼",     rating: 4.7, distance: "50m"  },
    { id: "fk2", name: "돈코츠 라멘 본점",       type: "restaurant", description: "진한 국물의 정통 하카타 라멘",         rating: 4.9, distance: "150m" },
  ],
  khaosan: [
    { id: "k1",  name: "라이브 밴드 펍",          type: "bar",        description: "전 세계 여행자들과 어울리는 펍",       rating: 4.7, distance: "0m"   },
    { id: "k2",  name: "길거리 팟타이",           type: "restaurant", description: "현지의 맛 그대로",                     rating: 4.5, distance: "50m"  },
  ],
  taipei: [
    { id: "tp1", name: "시먼 홍러우 야시장",     type: "restaurant", description: "지파이와 곱창국수 로컬 맛집",          rating: 4.6, distance: "100m" },
    { id: "tp2", name: "버블티 성지",            type: "cafe",       description: "오리지널 대만식 프리미엄 쩐주단",      rating: 4.8, distance: "50m"  },
  ],
  danang: [
    { id: "dn1", name: "해산물 로컬 식당",        type: "restaurant", description: "미케비치 앞 신선하고 저렴한 해산물",   rating: 4.6, distance: "20m"  },
    { id: "dn2", name: "루프탑 비치 라운지",      type: "bar",        description: "시원한 칵테일과 야자수 뷰",            rating: 4.5, distance: "200m" },
  ],
  bali: [
    { id: "bl1", name: "선셋 비치 클럽",          type: "bar",        description: "짱구 해변의 황홀한 노을과 디제잉",     rating: 4.9, distance: "0m"   },
    { id: "bl2", name: "발리식 브런치 카페",      type: "cafe",       description: "건강한 스무디 볼과 커피",              rating: 4.7, distance: "150m" },
  ],
  cebu: [
    { id: "cb1", name: "세부 IT 파크 야시장",     type: "restaurant", description: "수많은 먹거리와 라이브 밴드",          rating: 4.5, distance: "100m" },
    { id: "cb2", name: "루프탑 스카이 라운지",    type: "bar",        description: "도심 야경이 시원하게 보이는 칵테일 바", rating: 4.6, distance: "250m" },
  ],
  newyork: [
    { id: "ny1", name: "소호 브런치 맛집",        type: "restaurant", description: "여유로운 아침을 여는 베이글 패스트라미", rating: 4.8, distance: "100m" },
    { id: "ny2", name: "루프탑 이탈리안 바",      type: "bar",        description: "맨해튼 스카이라인이 보이는 라운지",    rating: 4.9, distance: "300m" },
  ],
  london: [
    { id: "ld1", name: "소호 아이리시 펍",        type: "bar",        description: "정통 기네스 생맥주와 피쉬앤칩스",     rating: 4.6, distance: "50m"  },
    { id: "ld2", name: "코번트가든 애프터눈 티",  type: "cafe",       description: "영국 황실 스타일의 럭셔리 티타임",    rating: 4.7, distance: "200m" },
  ],
  paris_marais: [
    { id: "p1",  name: "테라스 와인바",           type: "bar",        description: "파리지앵들이 즐기는 와인과 치즈",     rating: 4.8, distance: "200m" },
    { id: "p2",  name: "클래식 프렌치 비스트로",  type: "restaurant", description: "정통 프랑스 코스 요리",               rating: 4.9, distance: "300m" },
  ],
  sydney: [
    { id: "sd1", name: "하버뷰 오이스터 바",      type: "restaurant", description: "탁 트인 뷰와 신선한 굴 요리",          rating: 4.8, distance: "150m" },
    { id: "sd2", name: "본다이 비치 펍",          type: "bar",        description: "서퍼들의 성지, 시원한 호주 생맥주",    rating: 4.7, distance: "50m"  },
  ],
  lotteworld: [
    { id: "lw1", name: "석촌호수 뷰 카페",        type: "cafe",       description: "놀이공원 야경이 예쁜 감성 카페",       rating: 4.8, distance: "100m" },
    { id: "lw2", name: "송리단길 다이닝",         type: "restaurant", description: "웨이팅 필수 핫! 데이트 코스",          rating: 4.6, distance: "300m" },
  ],
  usj: [
    { id: "usj1", name: "시티워크 테마 펍",       type: "bar",        description: "테마파크 퇴장 후 다같이 맥주 한잔!",   rating: 4.7, distance: "50m"  },
    { id: "usj2", name: "타코야키 뮤지엄",        type: "restaurant", description: "오사카 명물 타코야키 파티",             rating: 4.5, distance: "100m" },
  ],
  disneyland: [
    { id: "ds1", name: "익스피어리 다이닝",       type: "restaurant", description: "랜드 옆 대형 쇼핑몰 맛집",             rating: 4.6, distance: "150m" },
    { id: "ds2", name: "디즈니 테마 라운지",      type: "bar",        description: "어른들만의 꿈과 희망의 칵테일 바",     rating: 4.7, distance: "200m" },
  ],
  gyeongbokgung: [
    { id: "gb1", name: "북촌 한옥 비스트로",      type: "restaurant", description: "전통과 현대가 공존하는 퓨전 한식",     rating: 4.8, distance: "200m" },
    { id: "gb2", name: "삼청동 테라스 카페",      type: "cafe",       description: "경복궁 야경 피크닉 후 티타임",         rating: 4.7, distance: "150m" },
  ],
  itaewon_club: [
    { id: "itc1", name: "심야 클럽 앤 라운지",   type: "bar",        description: "신나는 음악과 애프터 파티 칵테일",     rating: 4.9, distance: "50m"  },
    { id: "itc2", name: "새벽 햄버거 펍",        type: "restaurant", description: "놀고 나서 허기 달래기 좋은 수제버거",  rating: 4.6, distance: "100m" },
  ],
  shibuya_club: [
    { id: "sbc1", name: "대형 클럽 VIP 테이블",  type: "bar",        description: "조인해서 같이 신나게 춤추기 좋은 곳",  rating: 4.8, distance: "50m"  },
    { id: "sbc2", name: "시부야 심야 야키토리",   type: "restaurant", description: "아침까지 영업하는 꼬치구이 맛집",       rating: 4.5, distance: "200m" },
  ],
};

const DEFAULT_RECOMMENDATIONS: PlaceRecommendation[] = [
  { id: "d1", name: "분위기 좋은 로컬 펍",    type: "bar",        description: "시원한 생맥주와 대화하기 좋은 분위기", rating: 4.5, distance: "100m" },
  { id: "d2", name: "인기 플레이스 식당",     type: "restaurant", description: "이 근처에서 가장 리뷰가 많은 맛집",     rating: 4.6, distance: "150m" },
  { id: "d3", name: "조용한 감성 카페",       type: "cafe",       description: "부담없이 만나서 대화하기 좋은 곳",     rating: 4.4, distance: "50m"  },
];

export function getRecommendationsForHotplace(hotplaceId: string): PlaceRecommendation[] {
  return RECOMMENDATION_DB[hotplaceId] || DEFAULT_RECOMMENDATIONS;
}
