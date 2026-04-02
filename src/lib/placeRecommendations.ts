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
  cities: string[]; // 어떤 도시에 속하는지
}

export const HOTPLACES: Hotplace[] = [
  // 한국 (Korea)
  { id: "hongdae", name: i18n.t("instant.places.hongdae", "홍대/연남 (Hongdae)"), emoji: "🎵", cities: ["Seoul", "서울"] },
  { id: "gangnam", name: i18n.t("instant.places.gangnam", "강남/신논현 (Gangnam)"), emoji: "✨", cities: ["Seoul", "서울"] },
  { id: "itaewon", name: i18n.t("instant.places.itaewon", "이태원 (Itaewon)"), emoji: "🌍", cities: ["Seoul", "서울"] },
  { id: "busan", name: i18n.t("instant.places.busan", "광안리/해운대 (Busan)"), emoji: "🌊", cities: ["Busan", "부산"] },
  { id: "jeju", name: i18n.t("instant.places.jeju", "애월/함덕 (Jeju)"), emoji: "🍊", cities: ["Jeju", "제주"] },

  // 일본 (Japan)
  { id: "shibuya", name: i18n.t("instant.places.shibuya", "시부야 (Shibuya)"), emoji: "🗼", cities: ["Tokyo", "도쿄", "동경"] },
  { id: "shinjuku", name: i18n.t("instant.places.shinjuku", "신주쿠 (Shinjuku)"), emoji: "🏙️", cities: ["Tokyo", "도쿄", "동경"] },
  { id: "dotonbori", name: i18n.t("instant.places.dotonbori", "도톤보리 (Dotonbori)"), emoji: "🦀", cities: ["Osaka", "오사카"] },
  { id: "fukuoka", name: i18n.t("instant.places.fukuoka", "텐진/나카스 (Fukuoka)"), emoji: "🍜", cities: ["Fukuoka", "후쿠오카"] },

  // 동남아/대만 (SE Asia & Taiwan)
  { id: "khaosan", name: i18n.t("instant.places.khaosan", "카오산로드 (Khaosan)"), emoji: "🌺", cities: ["Bangkok", "방콕"] },
  { id: "taipei", name: i18n.t("instant.places.taipei", "시먼딩 (Ximending)"), emoji: "🧋", cities: ["Taipei", "타이베이"] },
  { id: "danang", name: i18n.t("instant.places.danang", "미케비치 (My Khe)"), emoji: "🏖️", cities: ["Da Nang", "다낭"] },
  { id: "bali", name: i18n.t("instant.places.bali", "짱구/스미냑 (Canggu)"), emoji: "🌴", cities: ["Bali", "발리"] },
  { id: "cebu", name: i18n.t("instant.places.cebu", "IT 파크 (IT Park)"), emoji: "🏝️", cities: ["Cebu", "세부"] },

  // 미주/유럽/오세아니아 (West & Oceania)
  { id: "newyork", name: i18n.t("instant.places.newyork", "맨해튼 소호 (Manhattan)"), emoji: "🗽", cities: ["New York", "뉴욕"] },
  { id: "london", name: i18n.t("instant.places.london", "소호/코번트가든 (London)"), emoji: "🎡", cities: ["London", "런던"] },
  { id: "paris_marais", name: i18n.t("instant.places.paris_marais", "마레 지구 (Le Marais)"), emoji: "🗼", cities: ["Paris", "파리"] },
  { id: "sydney", name: i18n.t("instant.places.sydney", "본다이/오페라 (Sydney)"), emoji: "🦘", cities: ["Sydney", "시드니"] },
];

const RECOMMENDATION_DB: Record<string, PlaceRecommendation[]> = {
  hongdae: [
    { id: "h1", name: "상상마당 근처 펍", type: "bar", description: "신나는 음악과 다양한 생맥주", rating: 4.5, distance: "100m" },
    { id: "h2", name: "연트럴파크 맛집", type: "restaurant", description: "웨이팅 필수 분위기 좋은 양식당", rating: 4.8, distance: "250m" },
    { id: "h3", name: "루프탑 카페", type: "cafe", description: "홍대 야경이 한눈에 보이는 카페", rating: 4.3, distance: "50m" }
  ],
  gangnam: [
    { id: "g1", name: "강남역 11번 출구 이자카야", type: "bar", description: "프라이빗 룸이 있는 깔끔한 술집", rating: 4.6, distance: "150m" },
    { id: "g2", name: "신논현 고기집", type: "restaurant", description: "초벌구이 삼겹살 전문점", rating: 4.7, distance: "300m" }
  ],
  itaewon: [
    { id: "i1", name: "해방촌 라운지", type: "bar", description: "칵테일과 야경이 멋진 이태원 라운지", rating: 4.9, distance: "100m" },
    { id: "i2", name: "타코 전문점", type: "restaurant", description: "외국인들이 즐겨 찾는 이국적인 맛", rating: 4.4, distance: "50m" }
  ],
  busan: [
    { id: "b1", name: "광안리 오션뷰 펍", type: "bar", description: "광안대교를 보며 맥주 한잔", rating: 4.8, distance: "50m" },
    { id: "b2", name: "해운대 국밥집", type: "restaurant", description: "현지인 추천 든든한 국밥 맛집", rating: 4.5, distance: "200m" }
  ],
  jeju: [
    { id: "jj1", name: "애월 해안도로 카페", type: "cafe", description: "제주 바다가 눈앞에 펼쳐지는 감성 카페", rating: 4.8, distance: "30m" },
    { id: "jj2", name: "흑돼지 숯불구이", type: "restaurant", description: "두툼한 제주 흑돼지와 한라산", rating: 4.9, distance: "150m" }
  ],
  shibuya: [
    { id: "s1", name: "스크램블 교차로 야키토리", type: "bar", description: "가볍게 꼬치와 생맥주", rating: 4.6, distance: "150m" },
    { id: "s2", name: "스시 오마카세", type: "restaurant", description: "현지 추천 초밥 맛집", rating: 4.8, distance: "300m" }
  ],
  shinjuku: [
    { id: "sj1", name: "오모이데요코초 이자카야", type: "bar", description: "레트로 감성의 뒷골목 술집", rating: 4.7, distance: "100m" },
    { id: "sj2", name: "가부키초 라멘", type: "restaurant", description: "심야에도 열려있는 진한 라멘", rating: 4.5, distance: "150m" }
  ],
  dotonbori: [
    { id: "o1", name: "오코노미야키 맛집", type: "restaurant", description: "도톤보리 강가의 철판구이", rating: 4.9, distance: "50m" },
    { id: "o2", name: "글리코상 근처 선술집", type: "bar", description: "퇴근 후 샐러리맨들의 성지", rating: 4.6, distance: "100m" }
  ],
  fukuoka: [
    { id: "fk1", name: "나카스 포장마차(야타이)", type: "bar", description: "강변에서 즐기는 야키토리와 하이볼", rating: 4.7, distance: "50m" },
    { id: "fk2", name: "돈코츠 라멘 본점", type: "restaurant", description: "진한 국물의 정통 하카타 라멘", rating: 4.9, distance: "150m" }
  ],
  khaosan: [
    { id: "k1", name: "라이브 밴드 펍", type: "bar", description: "전 세계 여행자들과 어울리는 펍", rating: 4.7, distance: "0m" },
    { id: "k2", name: "길거리 팟타이", type: "restaurant", description: "현지의 맛 그대로", rating: 4.5, distance: "50m" }
  ],
  taipei: [
    { id: "tp1", name: "시먼 홍러우 야시장", type: "restaurant", description: "지파이와 곱창국수 로컬 맛집", rating: 4.6, distance: "100m" },
    { id: "tp2", name: "버블티 성지", type: "cafe", description: "오리지널 대만식 프리미엄 쩐주단", rating: 4.8, distance: "50m" }
  ],
  danang: [
    { id: "dn1", name: "해산물 로컬 식당", type: "restaurant", description: "미케비치 앞 신선하고 저렴한 해산물", rating: 4.6, distance: "20m" },
    { id: "dn2", name: "루프탑 비치 라운지", type: "bar", description: "시원한 칵테일과 야자수 뷰", rating: 4.5, distance: "200m" }
  ],
  bali: [
    { id: "bl1", name: "선셋 비치 클럽", type: "bar", description: "짱구 해변의 황홀한 노을과 디제잉", rating: 4.9, distance: "0m" },
    { id: "bl2", name: "발리식 브런치 카페", type: "cafe", description: "건강한 스무디 볼과 커피", rating: 4.7, distance: "150m" }
  ],
  cebu: [
    { id: "cb1", name: "세부 IT 파크 야시장", type: "restaurant", description: "수많은 먹거리와 라이브 밴드", rating: 4.5, distance: "100m" },
    { id: "cb2", name: "루프탑 스카이 라운지", type: "bar", description: "도심 야경이 시원하게 보이는 칵테일 바", rating: 4.6, distance: "250m" }
  ],
  newyork: [
    { id: "ny1", name: "소호 브런치 맛집", type: "restaurant", description: "여유로운 아침을 여는 베이글 패스트라미", rating: 4.8, distance: "100m" },
    { id: "ny2", name: "루프탑 이탈리안 바", type: "bar", description: "맨해튼 스카이라인이 보이는 라운지", rating: 4.9, distance: "300m" }
  ],
  london: [
    { id: "ld1", name: "소호 아이리시 펍", type: "bar", description: "정통 기네스 생맥주와 피쉬앤칩스", rating: 4.6, distance: "50m" },
    { id: "ld2", name: "코번트가든 애프터눈 티", type: "cafe", description: "영국 황실 스타일의 럭셔리 티타임", rating: 4.7, distance: "200m" }
  ],
  paris_marais: [
    { id: "p1", name: "테라스 와인바", type: "bar", description: "파리지앵들이 즐기는 와인과 치즈", rating: 4.8, distance: "200m" },
    { id: "p2", name: "클래식 프렌치 비스트로", type: "restaurant", description: "정통 프랑스 코스 요리", rating: 4.9, distance: "300m" }
  ],
  sydney: [
    { id: "sd1", name: "하버뷰 오이스터 바", type: "restaurant", description: "탁 트인 뷰와 신선한 굴 요리", rating: 4.8, distance: "150m" },
    { id: "sd2", name: "본다이 비치 펍", type: "bar", description: "서퍼들의 성지, 시원한 호주 생맥주", rating: 4.7, distance: "50m" }
  ]
};

// 기본 반환 템플릿(지정 핫플레이스가 아닐 시)
const DEFAULT_RECOMMENDATIONS: PlaceRecommendation[] = [
  { id: "d1", name: "분위기 좋은 로컬 펍", type: "bar", description: "시원한 생맥주와 대화하기 좋은 분위기", rating: 4.5, distance: "100m" },
  { id: "d2", name: "인기 플레이스 식당", type: "restaurant", description: "이 근처에서 가장 리뷰가 많은 맛집", rating: 4.6, distance: "150m" },
  { id: "d3", name: "조용한 감성 카페", type: "cafe", description: "부담없이 만나서 대화하기 좋은 곳", rating: 4.4, distance: "50m" }
];

export function getRecommendationsForHotplace(hotplaceId: string): PlaceRecommendation[] {
  return RECOMMENDATION_DB[hotplaceId] || DEFAULT_RECOMMENDATIONS;
}
