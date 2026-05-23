import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Globe, Sparkles, MapPin, Compass, Info, Check, User } from "lucide-react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Solar, Lunar } from "lunar-javascript";

// 천간 데이터 정의 (Heavenly Stems)
interface StemData {
  hanja: string;
  korean: string;
  element: "wood" | "fire" | "earth" | "metal" | "water";
  yinYang: "+" | "-";
  title: Record<string, string>;
  desc: Record<string, string>;
  travelVibe: Record<string, string>;
}

const STEMS: StemData[] = [
  {
    hanja: "甲",
    korean: "갑목",
    element: "wood",
    yinYang: "+",
    title: {
      ko: "🌲 위풍당당 거대 소나무 (甲木 - Giant Pine)",
      en: "🌲 Giant Pine Tree (Jap-Wood)",
      ja: "🌲 威風堂々たる巨大な松 (甲木)",
      zh: "🌲 威风凛凛的巨松 (甲木)"
    },
    desc: {
      ko: "사주의 으뜸인 갑목으로 태어난 당신은 늘 곧고 곧은 대나무처럼 타인에게 의지하기보다 스스로 개척하는 든든한 리더이자 개척자입니다. 성실하고 독립심이 강하며, 어떤 역경에도 뒤로 물러서지 않는 당당함이 돋보입니다.",
      en: "Born under the grand Jap-Wood (Pine Tree), you are a natural-born leader and pioneer. Meticulous, independent, and upright like a cedar, you carve your own path rather than relying on others, standing proud against any storm.",
      ja: "四柱推命の筆頭である甲木に生まれたあなたは、常に真っ直ぐな松のように他人に頼るよりも自ら切り開く心強いリーダーであり開拓者です。誠実で独立心が強く、どんな逆境にも屈しない堂々とした姿が魅力的です。",
      zh: "生于甲木（巨松）的你，是天生的领导者与开拓者。正直独立，像青松一样挺拔，相比依赖他人，你更喜欢自我开拓，在风雨中也傲然挺立。"
    },
    travelVibe: {
      ko: "고전적이고 웅장한 자연 경관, 스릴 넘치는 산악 트레킹이나 높은 랜드마크 전망대를 정복하는 여행이 최고의 활력을 줍니다.",
      en: "Grand historic sites, lush green forest hikes, and conquering towering landmarks/views give you the ultimate adrenaline rush.",
      ja: "古典的で雄大な自然の景観、スリル満点の山岳トレッキングや高いランドマークの展望台を制覇する旅が、あなたに最高の活力を与えます。",
      zh: "古典雄壮的自然景观、惊险的山地徒步或征服高耸地标的观景台，最能唤醒你的无限活力。"
    }
  },
  {
    hanja: "乙",
    korean: "을목",
    element: "wood",
    yinYang: "-",
    title: {
      ko: "🌿 유연한 들꽃과 덩굴 (乙木 - Gentle Vine)",
      en: "🌿 Gentle Wildflower & Vine (Eul-Wood)",
      ja: "🌿 しなやかな野花と蔓 (乙木)",
      zh: "🌿 柔韧的野花与藤蔓 (乙木)"
    },
    desc: {
      ko: "부드러운 덩굴과 생기 넘치는 잔디처럼 태어난 당신은 어떤 환경에서도 적응하고 피어날 수 있는 놀라운 생명력과 친화력을 지녔습니다. 타인의 마음을 세심히 헤아릴 줄 알며, 예술적인 감각과 섬세함이 최대 장점입니다.",
      en: "Like a beautiful wildflower or climbing vine, you possess amazing adaptability and social affinity. You are highly empathetic, creative, and artistically sensitive, finding ways to bloom beautifully in any climate.",
      ja: "しなやかな蔓や生き生きとした野花のように生まれたあなたは、どんな環境でも適応し花を咲かせることができる素晴らしい生命力と協調性を持っています。他人の気持ちを細やかに思いやることができ、芸術的なセンスと繊細さが最大の強みです。",
      zh: "像美丽的野花与攀爬的藤蔓，你拥有惊人的适应力与人际亲和力。心思细腻，富有艺术感知，无论身处何境，都能坚韧地绽放出别样美丽。"
    },
    travelVibe: {
      ko: "예쁘고 감각적인 인테리어의 카페 호핑, 골목길 빈티지 숍 탐방, 그리고 아기자기한 정원/플라워 마켓 힐링 일정을 사랑합니다.",
      en: "Sensory café hopping with aesthetic interiors, exploring local vintage boutiques, and romantic strolls through floral gardens.",
      ja: "おしゃれで感覚的なインテリアのカフェ巡り、路地裏のヴィンテージショップ探訪、そして愛らしい庭園やフラワーマーケットでのヒーリングが大好きです。",
      zh: "打卡极具美感艺术设计的咖啡馆，探索街角复古买手店，以及在精致浪漫的花园中享受治愈漫步。"
    }
  },
  {
    hanja: "丙",
    korean: "병화",
    element: "fire",
    yinYang: "+",
    title: {
      ko: "☀️ 하늘의 뜨거운 태양 (丙火 - Blazing Sun)",
      en: "☀️ Blazing Sun (Byeong-Fire)",
      ja: "☀️ 空を照らす情熱の太陽 (丙火)",
      zh: "☀️ 天空炽热的太阳 (丙火)"
    },
    desc: {
      ko: "하늘에 빛나는 태양의 에너지를 타고난 당신은 활달하고 쾌활하며, 주변에 밝은 희망을 전파하는 해피바이러스입니다. 열정적이며 화끈한 자기 표현력을 가졌고, 언제 어디서나 존재감 넘치는 무대의 주인공이 됩니다.",
      en: "Endowed with the energetic force of the sun. You are bright, warm-hearted, and incredibly expressive, acting as a happy virus. Naturally passionate and extroverted, you shine like a superstar wherever you set foot.",
      ja: "空に輝く太陽のエネルギーを持って生まれたあなたは、明るく快活で、周囲に希望を届けるハッピーウイルスです。情熱的で率直な自己表現力を持ち、いつでもどこでも圧倒的な存在感を放つ主人公になります。",
      zh: "天生拥有太阳般耀眼夺目的能量。你性格开朗，热情洋溢，如同一剂快乐病毒照亮身边人。直率敢言，天生瞩目，无论走到哪里都是舞台最中央的主角。"
    },
    travelVibe: {
      ko: "불꽃놀이가 있는 대형 축제, 화려한 야경이 펼쳐지는 루프탑 파티, 현지 번개 펍 크롤링처럼 가슴 뛰는 액티비티가 최고입니다.",
      en: "Vibrant local festivals with fireworks, glamorous rooftop nightlife with starry views, and high-energy pub crawls with new friends.",
      ja: "花火が打ち上がる大フェスティバル、華やかな夜景が広がるルーフトップバー、現地の賑やかなパブ巡りなど、胸が躍るアクティビティが最高です。",
      zh: "烟花璀璨的大型庆典、坐拥华丽夜景的屋顶露台派对，以及与新朋友一起体验极具当地特色的酒吧夜间探索。"
    }
  },
  {
    hanja: "丁",
    korean: "정화",
    element: "fire",
    yinYang: "-",
    title: {
      ko: "🕯️ 따스한 밤하늘의 촛불 (丁火 - Cozy Lantern)",
      en: "🕯️ Warm Cozy Candle (Jeong-Fire)",
      ja: "🕯️ 温かな夜空を照らす灯火 (丁火)",
      zh: "🕯️ 温暖夜空的烛光 (丁火)"
    },
    desc: {
      ko: "은은하게 밤을 밝히는 등불과 촛불을 뜻하는 당신은 사려 깊고 다정하며, 보이지 않는 곳에서 묵묵히 타인을 챙겨주는 사주입니다. 겉으론 차분해 보이지만 내면에 뜨거운 예술적 열정과 지혜를 품고 있는 매력적인 현자입니다.",
      en: "Representing the glowing starlight or warm hearth, you are exceptionally gentle, thoughtful, and loyal. While calm on the surface, you harbor a rich inner flame of creativity, deep wisdom, and sincere affection.",
      ja: "静かに夜を照らすランタンや灯火を意味するあなたは、思慮深く優しく、見えない場所で黙々と他人を気遣うことができます。外見は落ち着いて見えますが、内面に熱い芸術的情熱と知恵を秘めている賢者タイプです。",
      zh: "代表着在黑夜中静静跳动的烛光与星火，你体贴温柔，总在旁人看不见的地方默默给予关怀。外表安静内敛，内心却藏着炽热的艺术才华与智慧。"
    },
    travelVibe: {
      ko: "고즈넉한 LP 바 감상, 분위기 있는 재즈 카페, 밤하늘 별 보며 나누는 캠프파이어 번개처럼 로맨틱하고 정적 밤 여정이 딱입니다.",
      en: "Listening to vinyl records in cozy LP bars, aesthetic jazz clubs, or sharing warm conversations under a campfire starry sky.",
      ja: "落ち着いた雰囲気のレコード（LP）バー、お洒落なジャズカフェ、満天の星の下で語り合うキャンプファイヤーなど、ロマンチックで穏やかな夜の旅が最適です。",
      zh: "在复古黑胶唱片吧聆听旋律，打卡有情调的爵士咖啡馆，或是在篝火星空下与懂你的人静谧畅谈。"
    }
  },
  {
    hanja: "戊",
    korean: "무토",
    element: "earth",
    yinYang: "+",
    title: {
      ko: "⛰️ 흔들림 없는 태산 (戊土 - Majestic Mountain)",
      en: "⛰️ Majestic Silent Mountain (Mu-Earth)",
      ja: "⛰️ 揺るぎない威風堂々たる大山 (戊土)",
      zh: "⛰️ 巍然屹立的泰山 (戊土)"
    },
    desc: {
      ko: "넓고 높은 태산의 기질을 지닌 당신은 묵직하고 신의가 깊어 함께하는 사람들에게 절대적인 안정감과 신뢰를 주는 든든한 등대입니다. 사사로운 감정에 휘둘리지 않고 큰 흐름을 관망하는 도량과 넓은 포용력이 큰 무기입니다.",
      en: "Reflecting the steady power of a majestic mountain, you are deeply reliable, honest, and protective. You do not sway under trivial emotions, offering absolute safety and wise support to everyone on your journey.",
      ja: "広くて高い大山の気質を持つあなたは、どっしりとして信頼が厚く、一緒にいる人々に絶対的な安定感を与える心強い存在です。些細な感情に流されず、大局を見渡す広い度量と包容力を持っています。",
      zh: "拥有高大巍峨的泰山气度。你沉稳忠诚，能给旅伴带来绝对的安全感与踏实感。不轻易被琐碎的情绪所左右，心胸宽广，看重长远与格局。"
    },
    travelVibe: {
      ko: "수백 년 역사가 보존된 고궁 유적지 탐험, 국립공원의 웅장한 대자연 투어, 깊이 있는 박물관 투어처럼 중후한 여행이 좋습니다.",
      en: "Exploring centuries-old historical ruins, sweeping National Park hiking trails, and immersive museum walks packed with heritage.",
      ja: "数百年の歴史が保存された王宮跡地、国立公園の雄大な自然ツアー、知識を深める美術館・博物館巡りなど、深みのある旅が似合います。",
      zh: "探索保存了数百年历史的故宫遗迹、国家公园的壮丽大自然徒步，或是一场能让人静心吸收底蕴的博物馆深度游。"
    }
  },
  {
    hanja: "己",
    korean: "기토",
    element: "earth",
    yinYang: "-",
    title: {
      ko: "🌾 곡식을 키우는 따뜻한 옥토 (己土 - Fertile Soil)",
      en: "🌾 Warm Nurturing Earth (Gi-Earth)",
      ja: "🌾 作物を育てる温かな大地 (己土)",
      zh: "🌾 孕育万物的温暖沃土 (己土)"
    },
    desc: {
      ko: "만물을 따뜻하게 감싸 안는 옥토와 어머니의 정원 같은 기질의 당신은 다정하고 포용력이 넘칩니다. 사람들의 이야기를 온화하게 경청하며, 모든 사람을 기분 좋게 하나로 이어주는 뛰어난 사회적 포용력과 요리/예술 재능을 지녔습니다.",
      en: "Embodying the warm, nurturing garden soil, you are deeply compassionate, gentle, and welcoming. You are a great listener and a natural connector, bringing people together with cozy warmth, fine tastes, or culinary talents.",
      ja: "万物を温かく包み込む肥沃な大地や母親の庭園のような性質を持つあなたは、とても優しく包容力に満ちています。人々の話を穏やかに聞き、みんなを心地よく繋ぐ社交性と、料理や芸術の豊かな才能を持っています。",
      zh: "如同一片温暖肥沃的田园土壤，你温柔体贴，具有极强的包容心。是一位出色的聆听者，总能用温和的能量凝聚身边的旅伴，也往往在美食或手工艺术上极有天赋。"
    },
    travelVibe: {
      ko: "전국 각지의 유명 숨겨진 미식 노포 골목 도장 깨기, 전통 시장 먹거리 투어, 아늑한 시골 힐링 펜션 여행이 마음에 안정을 줍니다.",
      en: "Tasting through hidden historical street-food alleys, lively local market food tours, and healing getaways in organic countryside pensions.",
      ja: "隠れたグルメ通りの食べ歩き、伝統市場のローカルフードツアー、のどかな田舎の温泉・コテージ旅行などが心に安らぎを与えます。",
      zh: "寻访大路小巷里饱含故事的隐秘美食老店，体验当地充满市井烟火气的传统市场吃播之旅，或在宁静乡村的民宿中尽情放松。"
    }
  },
  {
    hanja: "庚",
    korean: "경금",
    element: "metal",
    yinYang: "+",
    title: {
      ko: "⚔️ 정의로운 단단한 무쇠와 칼 (庚金 - Raw Sword)",
      en: "⚔️ Sharp Relentless Sword (Gyeong-Metal)",
      ja: "⚔️ 正義感あふれる頑丈な剣 (庚金)",
      zh: "⚔️ 正义刚毅的钢铁长剑 (庚金)"
    },
    desc: {
      ko: "강철처럼 단단하고 단호하며 불의를 참지 못하는 결단력과 정의감의 화신입니다. 거침없고 시원시원한 성격으로 강한 추진력을 지녔으며, 우유부단하지 않고 일단 결정하면 거침없이 돌파하는 멋진 카리스마의 소유자입니다.",
      en: "Solid and resolute like raw steel. You are the embodiment of decisiveness, fairness, and bold determination. Extroverted, direct, and dynamic, you despise hesitation and lead with irresistible charismatic drive.",
      ja: "鋼のように頑丈で果敢であり、曲がったことが許せない決断力と正義感の持ち主です。さっぱりとした涼しげな性格で強い推進力を持ち、優柔不断さを嫌い、一度決めれば迷わず突破するカリスマの持ち主です。",
      zh: "坚硬刚毅如钢铁长剑，是正义与果断的代名词。性格直爽豁达，执行力爆棚，面对选择毫不优柔寡断，一旦做出决策就会一往无前地去突破，天生自带霸气气场。"
    },
    travelVibe: {
      ko: "자유를 만끽하는 끝없는 고속도로 자동차 로드 트립, 짜릿한 스카이다이빙이나 산악 ATV 등 와일드하고 쿨한 아웃도어 스포츠.",
      en: "Epic cross-country highway road trips, thrilling skydiving, mountain biking, or rugged off-road ATV adventures.",
      ja: "自由を満喫する果てしないロードトリップ、スリル満点の 스카이 다이빙이나オフロードATVなど、ワイルドでクールなアウトドアスポーツがぴったりです。",
      zh: "体验在无边公路上的自驾之旅，挑战高空跳伞、越野ATV等充满野性与凉意的高能量户外运动。"
    }
  },
  {
    hanja: "辛",
    korean: "신금",
    element: "metal",
    yinYang: "-",
    title: {
      ko: "💎 빛나는 밤하늘의 다이아몬드 (辛金 - Polished Jewel)",
      en: "💎 Glittering Polished Jewel (Sin-Metal)",
      ja: "💎 輝く最高級のダイヤモンド (辛金)",
      zh: "💎 璀璨夺目的珠宝玉石 (辛金)"
    },
    desc: {
      ko: "정교하게 다듬어진 다이아몬드나 보석처럼 빛나는 감성의 소유자인 당신은 매우 예리하고 미적 안목이 대단히 뛰어납니다. 청결하고 깔끔한 성격을 지향하며, 남들과 다른 독창적인 스페셜티와 섬세함을 자부하는 완벽주의자입니다.",
      en: "Like a flawlessly polished diamond, you are refined, glamorous, and possess unmatched aesthetic taste. Highly sharp, clean, and unique, you value pristine premium experiences and proud independent originality.",
      ja: "精巧に磨かれたダイヤモンドや宝石のように輝く感性を持つあなたは、非常に鋭く洗練された審美眼を持っています。清潔感とこだわりを重視し、他人とは違う特別感と繊細さを誇る完璧主義者です。",
      zh: "如同经过极致雕琢的璀璨宝石，你气质高雅，拥有无可挑剔的美学鉴赏力。追求精致，心思细腻，在许多领域都极具独创力，是一个自带高贵感的完美主义者。"
    },
    travelVibe: {
      ko: "최첨단 디자인의 미술관, 해외 명품 빈티지 쇼룸 쇼핑, 파인 다이닝 미식 코스 요리처럼 최고로 엄선된 프리미엄 럭셔리 루틴.",
      en: "Stunning avant-garde design museums, luxury boutique shopping tours, and multi-course fine dining gastronomy journeys.",
      ja: "最先端デザインの美術館、高級ブランドのヴィンテージショップ巡り、ファインダイニングの絶品コース料理など、厳選された贅택な旅を望みます。",
      zh: "流连于最具前沿设计感的美术馆，漫步于奢侈品买手店，以及预订一顿仪式感满满的米其林精致法式日式料理。"
    }
  },
  {
    hanja: "壬",
    korean: "임수",
    element: "water",
    yinYang: "+",
    title: {
      ko: "🌊 끝없는 드넓은 대양과 바다 (壬水 - Great Ocean)",
      en: "🌊 Deep Infinite Ocean (Im-Water)",
      ja: "🌊 果てしなく広がる神秘の深海 (壬水)",
      zh: "🌊 奔流不息的无垠大洋 (壬水)"
    },
    desc: {
      ko: "모든 물줄기를 받아들이는 거대한 바다의 기질을 가진 당신은 지혜롭고 깊이 있으며 통이 큽니다. 머리가 명석하고 임기응변에 대단히 강하며, 큰 흐름을 조율하고 기획할 줄 아는 통솔력과 대범한 스케일을 자랑합니다.",
      en: "Reflecting the vast, deep, and dynamic power of the ocean, you are incredibly wise, adaptable, and far-sighted. Excellent at strategic thinking, you possess a giant scale of mind, flowing smoothly past obstacle with bold grace.",
      ja: "すべての川を受け入れる巨大な海のような気質を持つあなたは、聡明で深く、スケールが大きい人です。頭脳明晰で臨機応変に強く、全体の流れを捉えて企画・統率する大らかな度量を誇ります。",
      zh: "拥有容纳百川的大海般气度。你聪慧深邃，思想开阔，有着极强的随机应变能力。擅长纵观全局，运筹帷幄，行事风格豁达大气，自带洒脱光环。"
    },
    travelVibe: {
      ko: "푸른 파도가 출렁이는 서핑 해변, 로맨틱한 요트 보트 세일링, 도시 야경이 비치는 아름다운 해안 드라이브 코스.",
      en: "Splashing into surfing beaches, scenic romantic yacht sailing, and epic drives along coastal cliffs overlooking city light arrays.",
      ja: "青い波が寄せるサーフィンビーチ、優雅なヨットクルージング、都会の夜景を望む美しい海岸線ドライブなどが最適です。",
      zh: "在海风呼啸的沙滩体验冲浪刺激，包下一艘游艇随波逐流，或在霓虹初上时沿着绝美海岸线兜风散心。"
    }
  },
  {
    hanja: "癸",
    korean: "계수",
    element: "water",
    yinYang: "-",
    title: {
      ko: "🌧️ 만물을 적시는 밤이슬과 비 (癸水 - Morning Rain)",
      en: "🌧️ Gentle Mist & Morning Rain (Gye-Water)",
      ja: "🌧️ 万物を潤す静かな朝霧と雨 (癸水)",
      zh: "🌧️ 润泽万物的清晨细雨 (癸水)"
    },
    desc: {
      ko: "맑고 깨끗한 아침이슬과 생명의 단비를 상징하는 당신은 지극히 유연하고 세심하며, 타인의 아픔을 깊이 위로할 줄 아는 힐러 사주입니다. 통찰력이 매우 깊어 보이지 않는 본질을 꿰뚫어 보며, 평화주의자로서 부드러운 화합을 도모합니다.",
      en: "Embodying the clear morning dew and gentle life-giving rain. You are highly intuitive, flexible, and deeply empathetic. You notice the subtlest changes in others' feelings, serving as a peaceful harmonizer and healer.",
      ja: "清らかな朝露や恵みの雨を象徴するあなたは、極めて柔軟で細やかであり、他人の痛みを深く受け止めて癒す力を持っています。洞察力が非常に鋭く、物事の本質を見抜き、優しく調和を重んじる平和主義者です。",
      zh: "象征着清晨莹润的露珠与滋润万物的甘霖。你温柔灵动，心思极为细腻，具有极强的共情与治愈力。直觉敏锐，洞察力极强，是向往纯净与和平的温柔使者。"
    },
    travelVibe: {
      ko: "숲속의 고요한 웰니스 온천 스파, 한적한 사찰에서의 차 명상 템플스테이, 조용하게 흐르는 강변 보트 힐링 일정.",
      en: "Secluded forest wellness hot spring spa getaways, tranquil temple-stay tea ceremonies, and silent riverboat cruises with mist morning views.",
      ja: "森の中の静かなウェルネス温泉スパ、静かなお寺での茶道瞑想テンプルステイ、ゆったりと流れる川沿いでのヒー링ボートトリップがおすすめです。",
      zh: "在森林环绕的温泉SPA放松身심，去清幽的古寺体验禅茶与打坐，或是体验清晨薄雾中在宁静河畔的疗愈行船。"
    }
  }
];

// 지지 오행 매핑 (12 Earthly Branches)
interface BranchData {
  hanja: string;
  korean: string;
  element: "wood" | "fire" | "earth" | "metal" | "water";
  animal: string;
}
const BRANCHES: BranchData[] = [
  { hanja: "子", korean: "자수", element: "water", animal: "🐭" },
  { hanja: "丑", korean: "축토", element: "earth", animal: "🐮" },
  { hanja: "寅", korean: "인목", element: "wood", animal: "🐯" },
  { hanja: "卯", korean: "묘목", element: "wood", animal: "🐰" },
  { hanja: "辰", korean: "진토", element: "earth", animal: "🐲" },
  { hanja: "巳", korean: "사화", element: "fire", animal: "🐍" },
  { hanja: "午", korean: "오화", element: "fire", animal: "🐴" },
  { hanja: "未", korean: "미토", element: "earth", animal: "🐑" },
  { hanja: "申", korean: "신금", element: "metal", animal: "🐵" },
  { hanja: "酉", korean: "유금", element: "metal", animal: "🐔" },
  { hanja: "戌", korean: "술토", element: "earth", animal: "🐶" },
  { hanja: "亥", korean: "해수", element: "water", animal: "🐷" }
];

// 오행 색상 및 명리 매핑 데이터
const ELEMENT_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  wood: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", label: "木 (Wood)" },
  fire: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30", label: "火 (Fire)" },
  earth: { bg: "bg-amber-600/10", text: "text-amber-400", border: "border-amber-600/30", label: "土 (Earth)" },
  metal: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30", label: "金 (Metal)" },
  water: { bg: "bg-blue-900/20", text: "text-blue-400", border: "border-blue-500/30", label: "水 (Water)" }
};

interface MySajuDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedBirthInfo?: any;
  onSaveBirthInfo: (info: any) => void;
}

export default function MySajuDetailModal({
  isOpen,
  onClose,
  savedBirthInfo,
  onSaveBirthInfo
}: MySajuDetailModalProps) {
  const { t } = useTranslation();
  const lang = (i18n.language?.split('-')[0] || 'ko').toLowerCase();

  // 입력 필드들
  const [year, setYear] = useState<string>("1995");
  const [month, setMonth] = useState<string>("5");
  const [day, setDay] = useState<string>("24");
  const [hour, setHour] = useState<string>("14");
  const [calendarType, setCalendarType] = useState<"solar" | "lunar">("solar");
  
  const [activeTab, setActiveTab] = useState<"pillars" | "personality" | "travel">("pillars");
  const [isCalculated, setIsCalculated] = useState<boolean>(false);

  // 로드 시 기존 저장 정보 복원
  useEffect(() => {
    if (savedBirthInfo) {
      setYear(savedBirthInfo.year || "1995");
      setMonth(savedBirthInfo.month || "5");
      setDay(savedBirthInfo.day || "24");
      setHour(savedBirthInfo.hour !== undefined ? String(savedBirthInfo.hour) : "14");
      setCalendarType(savedBirthInfo.calendarType || "solar");
      setIsCalculated(true);
    }
  }, [savedBirthInfo]);

  // ── 육십갑자 만세력 수학적 공식 연산 엔진 ──
  const runSajuCalculation = () => {
    const yr = parseInt(year);
    const mo = parseInt(month);
    const dy = parseInt(day);
    const hr = hour === "unknown" ? 12 : parseInt(hour);

    const getStemByHanja = (hanja: string): StemData => {
      return STEMS.find(s => s.hanja === hanja) || STEMS[0];
    };

    const getBranchByHanja = (hanja: string): BranchData => {
      return BRANCHES.find(b => b.hanja === hanja) || BRANCHES[0];
    };

    let lunarDate;
    if (calendarType === "lunar") {
      lunarDate = Lunar.fromYmdHms(yr, mo, dy, hr, 0, 0);
    } else {
      const solarDate = Solar.fromYmdHms(yr, mo, dy, hr, 0, 0);
      lunarDate = solarDate.getLunar();
    }

    const eightChar = lunarDate.getEightChar();
    const yrStr = eightChar.getYear();
    const moStr = eightChar.getMonth();
    const dyStr = eightChar.getDay();
    const hrStr = eightChar.getTime();

    const yearPillar = {
      stem: getStemByHanja(yrStr.substring(0, 1)),
      branch: getBranchByHanja(yrStr.substring(1, 2))
    };

    const monthPillar = {
      stem: getStemByHanja(moStr.substring(0, 1)),
      branch: getBranchByHanja(moStr.substring(1, 2))
    };

    const dayPillar = {
      stem: getStemByHanja(dyStr.substring(0, 1)),
      branch: getBranchByHanja(dyStr.substring(1, 2))
    };

    const hourPillar = hour === "unknown" ? null : {
      stem: getStemByHanja(hrStr.substring(0, 1)),
      branch: getBranchByHanja(hrStr.substring(1, 2))
    };

    return {
      yearPillar,
      monthPillar,
      dayPillar,
      hourPillar
    };
  };

  const handleCalculate = () => {
    Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
    const info = {
      year,
      month,
      day,
      hour,
      calendarType
    };
    onSaveBirthInfo(info);
    setIsCalculated(true);
  };

  const resetCalculation = () => {
    setIsCalculated(false);
  };

  const calculationResult = isCalculated ? runSajuCalculation() : null;
  const dayMaster = calculationResult?.dayPillar.stem;

  // 오행 8글자 갯수 세기
  const getElementsDistribution = () => {
    if (!calculationResult) return { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    const elements = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    
    // Stems
    elements[calculationResult.yearPillar.stem.element]++;
    elements[calculationResult.monthPillar.stem.element]++;
    elements[calculationResult.dayPillar.stem.element]++;
    if (calculationResult.hourPillar) {
      elements[calculationResult.hourPillar.stem.element]++;
    }

    // Branches
    elements[calculationResult.yearPillar.branch.element]++;
    elements[calculationResult.monthPillar.branch.element]++;
    elements[calculationResult.dayPillar.branch.element]++;
    if (calculationResult.hourPillar) {
      elements[calculationResult.hourPillar.branch.element]++;
    }

    return elements;
  };

  const elementDistribution = getElementsDistribution();
  const totalLetters = calculationResult?.hourPillar ? 8 : 6;

  // 년/월/일/시 드롭다운 데이터
  const years = Array.from({ length: 70 }, (_, i) => String(1950 + i));
  const months = Array.from({ length: 12 }, (_, i) => String(1 + i));
  const days = Array.from({ length: 31 }, (_, i) => String(1 + i));
  const hours = [
    { value: "unknown", label: { ko: "모름", en: "Unknown", ja: "不明", zh: "未知" }[lang] },
    ...Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: `${String(i).padStart(2, '0')}:00` }))
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-end justify-center px-safe pb-safe pt-safe">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-foreground/60 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal Container */}
        <motion.div
          className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-t-3xl overflow-hidden shadow-float max-h-[94vh] flex flex-col border border-amber-500/20"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/80 bg-gradient-to-r from-amber-950/20 to-card">
            <div className="flex items-center gap-2">
              <span className="text-xl animate-spin-slow">☯️</span>
              <div>
                <h3 className="text-sm font-black text-amber-400 tracking-wider">
                  {{ ko: "한국 전통 사주 명리학 분석기", en: "Traditional K-Saju Palja Analyzer", ja: "韓国伝統の四柱推命・八字鑑定", zh: "韩国传统四柱八字详批" }[lang]}
                </h3>
                <p className="text-[9px] text-muted-foreground uppercase font-semibold tracking-wider">
                  {{ ko: "음양오행 만세력 정교 분석 리포트", en: "Premium Sexagenary Fortune Report", ja: "陰陽五行万年暦精密分析", zh: "阴阳五行精细运势报告" }[lang]}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {!isCalculated ? (
              /* ── 입력 폼 (Input Form) ── */
              <div className="space-y-4">
                <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-black">
                    <Calendar size={14} />
                    <span>{{ ko: "생년월일시 입력", en: "Birth Date & Time", ja: "生年月日時の入力", zh: "输入生辰八字" }[lang]}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {{
                      ko: "태어난 연주, 월주, 일주, 시주를 정밀하게 도출하기 위해 생년월일시 정보를 정확히 입력해 주세요.",
                      en: "To accurately calculate your Year, Month, Day, and Hour Pillars, please enter your exact birth details.",
                      ja: "あなたの生まれた年柱、月柱、日柱、時柱を精密に算出するため、正確な生年月日時を入力してください。",
                      zh: "为了精准推算您的年柱、月柱、日柱和时柱，请准确输入您的生辰八字。"
                    }[lang]}
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {/* 년 */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted-foreground font-semibold">{{ ko: "태어난 해", en: "Year", ja: "年", zh: "出生年份" }[lang]}</label>
                      <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-full px-2 py-2.5 rounded-xl border border-border/80 bg-muted/50 text-xs font-bold text-foreground focus:ring-1 focus:ring-amber-500/50 focus:outline-none"
                      >
                        {years.map((y) => (
                          <option key={y} value={y}>{y}년</option>
                        ))}
                      </select>
                    </div>

                    {/* 월 */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted-foreground font-semibold">{{ ko: "태어난 월", en: "Month", ja: "月", zh: "出生月份" }[lang]}</label>
                      <select
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="w-full px-2 py-2.5 rounded-xl border border-border/80 bg-muted/50 text-xs font-bold text-foreground focus:ring-1 focus:ring-amber-500/50 focus:outline-none"
                      >
                        {months.map((m) => (
                          <option key={m} value={m}>{m}월</option>
                        ))}
                      </select>
                    </div>

                    {/* 일 */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted-foreground font-semibold">{{ ko: "태어난 일", en: "Day", ja: "日", zh: "出生日期" }[lang]}</label>
                      <select
                        value={day}
                        onChange={(e) => setDay(e.target.value)}
                        className="w-full px-2 py-2.5 rounded-xl border border-border/80 bg-muted/50 text-xs font-bold text-foreground focus:ring-1 focus:ring-amber-500/50 focus:outline-none"
                      >
                        {days.map((d) => (
                          <option key={d} value={d}>{d}일</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {/* 시간 */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted-foreground font-semibold">{{ ko: "태어난 시간 (시)", en: "Hour", ja: "出生時間", zh: "出生时辰" }[lang]}</label>
                      <select
                        value={hour}
                        onChange={(e) => setHour(e.target.value)}
                        className="w-full px-2 py-2.5 rounded-xl border border-border/80 bg-muted/50 text-xs font-bold text-foreground focus:ring-1 focus:ring-amber-500/50 focus:outline-none"
                      >
                        {hours.map((h) => (
                          <option key={h.value} value={h.value}>{h.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* 양력 / 음력 */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted-foreground font-semibold">{{ ko: "양력 / 음력", en: "Solar / Lunar", ja: "陽暦 / 陰暦", zh: "公历 / 农历" }[lang]}</label>
                      <div className="grid grid-cols-2 gap-1 bg-muted/65 p-1 rounded-xl border border-border/60">
                        <button
                          onClick={() => setCalendarType("solar")}
                          className={`py-1.5 rounded-lg text-[10px] font-black transition-all ${
                            calendarType === "solar"
                              ? "bg-card text-foreground shadow-sm"
                              : "text-muted-foreground"
                          }`}
                        >
                          {{ ko: "양력", en: "Solar", ja: "陽暦", zh: "公历" }[lang]}
                        </button>
                        <button
                          onClick={() => setCalendarType("lunar")}
                          className={`py-1.5 rounded-lg text-[10px] font-black transition-all ${
                            calendarType === "lunar"
                              ? "bg-card text-foreground shadow-sm"
                              : "text-muted-foreground"
                          }`}
                        >
                          {{ ko: "음력", en: "Lunar", ja: "陰暦", zh: "农历" }[lang]}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCalculate}
                  className="w-full py-3.5 rounded-2xl gradient-primary text-white font-extrabold text-xs shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:opacity-95"
                >
                  <Sparkles size={14} className="animate-pulse" />
                  <span>{{ ko: "사주명리 만세력 분석 시작", en: "Start Saju-Palja Analysis", ja: "四柱推命・八字の鑑定を開始", zh: "开始生成八字祥批" }[lang]}</span>
                </motion.button>
              </div>
            ) : (
              /* ── 결과 화면 (Result Report) ── */
              <div className="space-y-4">
                {/* 탭 네비게이션 */}
                <div className="flex bg-muted/60 p-1 rounded-2xl border border-border/80">
                  {(["pillars", "personality", "travel"] as const).map((tab) => {
                    const label = {
                      pillars: { ko: "☯️ 사주팔자", en: "☯️ Four Pillars", ja: "☯️ 四柱八字", zh: "☯️ 四柱八字" }[lang],
                      personality: { ko: "👤 성향분석", en: "👤 Personality", ja: "👤 性質鑑定", zh: "👤 性格解析" }[lang],
                      travel: { ko: "✈️ 여행운명", en: "✈️ Travel Fate", ja: "✈️ 旅行運勢", zh: "✈️ 出行运势" }[lang]
                    }[tab];
                    return (
                      <button
                        key={tab}
                        onClick={() => {
                          Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
                          setActiveTab(tab);
                        }}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${
                          activeTab === tab
                            ? "bg-card text-amber-500 shadow-sm border border-amber-500/10"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* 탭 1: 사주팔자 만세력 격자 */}
                {activeTab === "pillars" && calculationResult && (
                  <div className="space-y-4">
                    {/* 만세력 격자 표 */}
                    <div className="bg-gradient-to-b from-amber-950/10 to-card border border-amber-500/25 rounded-2xl p-4 space-y-3 relative">
                      <div className="absolute top-2 right-2 text-[9px] text-amber-500 font-bold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-widest">
                        {calendarType.toUpperCase()}
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center">
                        {/* 헤더 */}
                        {["시주 (Hour)", "일주 (Day)", "월주 (Month)", "연주 (Year)"].map((pHeader, i) => (
                          <div key={i} className="text-[9px] text-muted-foreground font-semibold leading-tight">
                            {pHeader.split(" ")[0]}
                          </div>
                        ))}

                        {/* 천간 (Heavenly Stems) */}
                        {[
                          calculationResult.hourPillar,
                          calculationResult.dayPillar,
                          calculationResult.monthPillar,
                          calculationResult.yearPillar
                        ].map((pillar, i) => {
                          if (!pillar) {
                            return (
                              <div key={i} className="bg-muted/30 border border-dashed border-border/80 rounded-xl py-3 flex items-center justify-center text-xs text-muted-foreground font-black">
                                <span>시 부족</span>
                              </div>
                            );
                          }
                          const col = ELEMENT_COLORS[pillar.stem.element];
                          const isDayMaster = i === 1; // 일간이 나 자신
                          return (
                            <div
                              key={i}
                              className={`rounded-xl py-2.5 border flex flex-col items-center justify-center gap-0.5 relative transition-all ${col.bg} ${col.border} ${
                                isDayMaster ? "ring-2 ring-amber-400 shadow-md shadow-amber-400/5 scale-105 bg-gradient-to-b from-amber-500/10" : ""
                              }`}
                            >
                              {isDayMaster && (
                                <span className="absolute -top-2 bg-amber-400 text-black text-[7px] font-black px-1 rounded-full uppercase scale-90">
                                  본인
                                </span>
                              )}
                              <span className="text-xl font-bold text-foreground font-serif leading-none">{pillar.stem.hanja}</span>
                              <span className="text-[9px] font-extrabold text-foreground">{pillar.stem.korean.split("")[0]}</span>
                              <span className="text-[8px] opacity-60 font-semibold">{col.label.split(" ")[0]}</span>
                            </div>
                          );
                        })}

                        {/* 지지 (Earthly Branches) */}
                        {[
                          calculationResult.hourPillar,
                          calculationResult.dayPillar,
                          calculationResult.monthPillar,
                          calculationResult.yearPillar
                        ].map((pillar, i) => {
                          if (!pillar) {
                            return (
                              <div key={i} className="bg-muted/30 border border-dashed border-border/80 rounded-xl py-3 flex items-center justify-center text-xs text-muted-foreground font-black">
                                <span>-</span>
                              </div>
                            );
                          }
                          const col = ELEMENT_COLORS[pillar.branch.element];
                          return (
                            <div
                              key={i}
                              className={`rounded-xl py-2.5 border flex flex-col items-center justify-center gap-0.5 transition-all ${col.bg} ${col.border}`}
                            >
                              <span className="text-xl font-bold text-foreground font-serif leading-none">{pillar.branch.hanja}</span>
                              <span className="text-[9px] font-extrabold text-foreground">{pillar.branch.korean.split("")[0]}{pillar.branch.animal}</span>
                              <span className="text-[8px] opacity-60 font-semibold">{col.label.split(" ")[0]}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 오행 통계 그래프 */}
                    <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-1 text-[11px] font-black text-foreground">
                        <Compass size={13} className="text-amber-500" />
                        <span>{{ ko: "나의 오행 분포율", en: "My Five Elements Ratio", ja: "私の五行分布率", zh: "我的五行分布率" }[lang]}</span>
                      </div>

                      <div className="space-y-2.5 pt-1.5">
                        {Object.entries(elementDistribution).map(([el, count]) => {
                          const col = ELEMENT_COLORS[el];
                          const pct = Math.round((count / totalLetters) * 100);
                          if (count === 0) return null;
                          return (
                            <div key={el} className="flex items-center gap-2 text-[10px]">
                              <span className={`w-14 font-extrabold shrink-0 ${col.text}`}>{col.label}</span>
                              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full bg-gradient-to-r ${
                                    el === "wood" ? "from-emerald-400 to-teal-500" :
                                    el === "fire" ? "from-rose-400 to-orange-500" :
                                    el === "earth" ? "from-amber-400 to-yellow-600" :
                                    el === "metal" ? "from-cyan-400 to-blue-500" :
                                    "from-blue-600 to-indigo-700"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="w-8 text-right font-black text-foreground shrink-0">{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 탭 2: 일간 상세 성향 분석 */}
                {activeTab === "personality" && dayMaster && (
                  <div className="space-y-3">
                    <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-1.5 pb-1 border-b border-border/50">
                        <span className="text-2xl filter drop-shadow">{dayMaster.emoji}</span>
                        <div>
                          <h4 className="text-xs font-black text-amber-500 leading-tight">
                            {dayMaster.title[lang] || dayMaster.title.en}
                          </h4>
                          <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">
                            {{ ko: "나의 명리 수호 일간", en: "My Heavenly Day Master", ja: "私の守護日柱", zh: "我的本命日元" }[lang]}
                          </p>
                        </div>
                      </div>

                      <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-normal break-words pt-1.5">
                        {dayMaster.desc[lang] || dayMaster.desc.en}
                      </p>
                    </div>

                    <div className="bg-muted/40 border border-border/60 rounded-xl p-3 text-[10px] leading-relaxed flex gap-2">
                      <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-muted-foreground leading-relaxed">
                        {{
                          ko: "사주명리학에서 일간(일주 천간)은 태어난 주의 주인공이자 본래의 타고난 진정한 자아를 상징합니다. 본 성향 리포트는 동양 전통 명리 계산법을 충실히 반영하여 계산되었습니다.",
                          en: "In Saju philosophy, the Day Master (Heavenly Stem of the Day) represents your true, authentic self. This report is accurately calculated according to traditional ancient formulas.",
                          ja: "四柱推命において日柱の天干（日干）は、あなたが生まれた日の主役であり、生まれ持った本来の真実の自我を象徴しています。東洋の伝統に則り精密に鑑定されました。",
                          zh: "在四柱八字命理中，日干（日柱天干）代表着您诞生那一天的核心力量，象征着您最本真、最与生俱来的自我。本报告忠实遵循传统八字算法推算生成。"
                        }[lang]}
                      </p>
                    </div>
                  </div>
                )}

                {/* 탭 3: 여행 운명 리포트 */}
                {activeTab === "travel" && dayMaster && (
                  <div className="space-y-4">
                    {/* 추천 여행지 및 성향 매칭 */}
                    <div className="bg-gradient-to-br from-amber-950/20 to-card border border-amber-500/25 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-black text-amber-400">
                        <MapPin size={14} />
                        <span>{{ ko: "K-여행 아키타입 운명 보고서", en: "My Saju Travel Fate", ja: "K-旅行アーキタイプ運勢", zh: "K-出行人格运势报告" }[lang]}</span>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[11px] text-foreground leading-relaxed whitespace-normal break-words">
                          {dayMaster.travelVibe[lang] || dayMaster.travelVibe.en}
                        </p>

                        <div className="grid grid-cols-2 gap-2 pt-2 text-center">
                          <div className="bg-muted/40 border border-border/80 rounded-xl p-2">
                            <p className="text-[8px] text-muted-foreground font-semibold">{{ ko: "수호 매칭 오행", en: "Lucky Elements", ja: "相性の良い五行", zh: "相生相合五行" }[lang]}</p>
                            <p className="text-[10px] font-black text-foreground mt-1">
                              {dayMaster.element === "wood" ? "🔥 Fire / 🌊 Water" :
                               dayMaster.element === "fire" ? "🌲 Wood / ⛰️ Earth" :
                               dayMaster.element === "earth" ? "🔥 Fire / 💎 Metal" :
                               dayMaster.element === "metal" ? "⛰️ Earth / 🌊 Water" :
                               "💎 Metal / 🌲 Wood"}
                            </p>
                          </div>
                          <div className="bg-muted/40 border border-border/80 rounded-xl p-2">
                            <p className="text-[8px] text-muted-foreground font-semibold">{{ ko: "추천 추천 도시", en: "Lucky Cities", ja: "おすすめ都市", zh: "推荐旅行城市" }[lang]}</p>
                            <p className="text-[10px] font-black text-foreground mt-1">
                              {dayMaster.element === "wood" ? "Kyoto 🌲, Portland" :
                               dayMaster.element === "fire" ? "Tokyo 🗼, Las Vegas" :
                               dayMaster.element === "earth" ? "Seoul 🏰, Rome" :
                               dayMaster.element === "metal" ? "New York 💎, Paris" :
                               "Okinawa 🌊, Venice"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {/* 생년월일 수정 */}
                      <button
                        onClick={resetCalculation}
                        className="flex-1 py-3.5 rounded-2xl bg-muted border border-border/80 text-muted-foreground font-extrabold text-xs active:opacity-80 transition-all text-center"
                      >
                        {{ ko: "정보 수정하기", en: "Change Birth Info", ja: "登録情報を変更", zh: "修改生辰信息" }[lang]}
                      </button>
                      <button
                        onClick={onClose}
                        className="flex-1 py-3.5 rounded-2xl gradient-primary text-white font-extrabold text-xs active:opacity-95 shadow-md shadow-primary/10 text-center"
                      >
                        {{ ko: "분석 닫기", en: "Close Report", ja: "鑑定を閉じる", zh: "关闭分析" }[lang]}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
