import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Globe, Sparkles, MapPin, Compass, Info, Check, User, Heart as HeartIcon, Crown, Share2, Download, Copy } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";
import { Capacitor } from "@capacitor/core";
import { Solar, Lunar } from "lunar-javascript";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";

// 천간 데이터 정의 (Heavenly Stems)
interface StemData {
  hanja: string;
  korean: string;
  element: "wood" | "fire" | "earth" | "metal" | "water";
  yinYang: "+" | "-";
  title: Record<string, string>;
  desc: Record<string, string>;
  travelVibe: Record<string, string>;
  loveVibe: Record<string, string>;
  wealthVibe: Record<string, string>;
  charmVibe: Record<string, string>;
  careerVibe: Record<string, string>;
}

const STEM_TRANSLATIONS: Record<string, Record<string, string>> = {
  "甲": { ko: "갑", en: "Jia", ja: "甲", zh: "甲" },
  "乙": { ko: "을", en: "Yi", ja: "乙", zh: "乙" },
  "丙": { ko: "병", en: "Bing", ja: "丙", zh: "丙" },
  "丁": { ko: "정", en: "Ding", ja: "丁", zh: "丁" },
  "戊": { ko: "무", en: "Wu", ja: "戊", zh: "戊" },
  "己": { ko: "기", en: "Ji", ja: "己", zh: "己" },
  "庚": { ko: "경", en: "Geng", ja: "庚", zh: "庚" },
  "辛": { ko: "신", en: "Xin", ja: "辛", zh: "辛" },
  "壬": { ko: "임", en: "Ren", ja: "壬", zh: "壬" },
  "癸": { ko: "계", en: "Gui", ja: "癸", zh: "癸" },
};

const BRANCH_TRANSLATIONS: Record<string, Record<string, string>> = {
  "子": { ko: "자", en: "Zi", ja: "子", zh: "子" },
  "丑": { ko: "축", en: "Chou", ja: "丑", zh: "丑" },
  "寅": { ko: "인", en: "Yin", ja: "寅", zh: "寅" },
  "卯": { ko: "묘", en: "Mao", ja: "卯", zh: "卯" },
  "辰": { ko: "진", en: "Chen", ja: "辰", zh: "辰" },
  "巳": { ko: "사", en: "Si", ja: "巳", zh: "巳" },
  "午": { ko: "오", en: "Wu", ja: "午", zh: "午" },
  "未": { ko: "미", en: "Wei", ja: "未", zh: "未" },
  "申": { ko: "신", en: "Shen", ja: "申", zh: "申" },
  "酉": { ko: "유", en: "You", ja: "酉", zh: "酉" },
  "戌": { ko: "술", en: "Xu", ja: "戌", zh: "戌" },
  "亥": { ko: "해", en: "Hai", ja: "亥", zh: "亥" },
};

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
      ja: "四柱推命の筆頭である甲木に生まれたあなたはいつもまっすぐな松のように他人に頼るよりも自分で開拓していくリーダーであり開拓者です。誠実で独立心が強く、どんな難しさにも後ろに引っ張らない堂々しさが際立っています。",
      zh: "生于甲木（巨松）的你，是天生的领导者与开拓者. 正直独立，像青松一样挺拔，相比依赖他人，你更喜欢自我开拓，在风雨中也傲然挺立。"
    },
    travelVibe: {
      ko: "고전적이고 웅장한 자연 경관, 스릴 넘치는 산악 트레킹이나 높은 랜드마크 전망대를 정복하는 여행이 최고의 활력을 줍니다.",
      en: "Grand historic sites, lush green forest hikes, and conquering towering landmarks/views give you the ultimate adrenaline rush.",
      ja: "古典的で壮大な自然の景色、スリリングな山のトレッキングや高いランドマークの展望台を征服する旅行が最高の活力を与えます。",
      zh: "古典&nbsp;of&nbsp;自然景观、惊险的山地徒步或征服高耸地标的观景台，最能唤醒你的无限活力。"
    },
    loveVibe: {
      ko: "듬직하고 솔직한 연애를 지향합니다. 거짓이 없고 우직하여 상대방에게 든든한 안정감을 주며, 한 번 마음을 준 사람에게는 굳건한 신의를 지킵니다. 리드하는 연애를 선호합니다.",
      en: "Stands strong and direct in love. Honest, protective, and highly loyal. You prefer taking the lead and providing absolute safety and reliability to your partner.",
      ja: "頼もしく率直な恋愛を目指します。偽りがなく、右直して相手に心強い安定感を与え、一度心を与えた人には固い信義を守ります。リードする恋愛を好む。",
      zh: "向往深沉而坦率的恋爱. 为人真诚而正直，能给伴侣带来极强的安全感. 一旦认定一个人就会极其专一，在感情里往往喜欢占据主导权。"
    },
    wealthVibe: {
      ko: "추진력 넘치는 사업가와 개척자 스타일입니다. 스스로 돈의 흐름을 만들어가는 독립성이 강하며, 직장 내에서도 핵심 리더십을 발휘하여 주도적으로 성과를 올리고 큰 재물을 거머쥐는 능력이 대단합니다.",
      en: "Natural pioneer and entrepreneur. You possess a powerful drive to create new wealth from scratch, excelling in leadership roles and expanding your assets independently.",
      ja: "推進力あふれる実業家とパイオニアスタイル。自らお金の流れを作っていく独立性が強く、職場内でもコアリーダーシップを発揮し、主導的に成果を上げ、大きな富を握る能力がすごいです。",
      zh: "积极进取的商人和先锋风格。他们在创造自己的资金流方面具有很强的独立性，并且通过在职场中展现核心领导力来带头取得成果并获得巨大财富的能力令人瞩目。"
    },
    charmVibe: {
      ko: "타인을 압도하는 거침없는 리더십과 곧고 당당한 기품. 어떤 역경에도 흔들리지 않는 곧은 태도와 위기를 극복하는 우직함이 상대방에게 강렬한 의지와 매력을 자아냅니다.",
      en: "Irresistible, charismatic leadership and dignified elegance. Your unyielding upright posture and simple fortitude in the face of any storm attract others with strong, attractive safety.",
      ja: "他人を圧倒するよどみのないリーダーシップと真っ直ぐで堂々とした気品. どんな逆境にも揺るがない一本気な態度と危機を克服する愚直さが強い魅力を生みます.",
      zh: "具有压倒性的果敢领导力与高贵挺拔的气度. 面对任何逆境都决不妥协的正直姿态，以及大智若愚般的坚韧抗挫力，能唤醒旁人极强烈的依恋与崇拜。"
    },
    careerVibe: {
      ko: "스타트업 CEO, 프로젝트 총괄 리더, 개척 분야 벤처사업가, 교육자, 공무원 등 본인이 주도권을 쥐고 설계하는 리딩 포지션이 완벽히 어울립니다.",
      en: "Perfect for start-up CEOs, project directors, pioneer venture developers, educators, or strategic public administrators—any position where you architect and take charge.",
      ja: "スタートアップCEO、プロジェクト統括リーダー、ベンチャー事業家、教育者、公務員など、自ら主導権を握って設計するポジションが似合います.",
      zh: "非常适合创业型公司CEO、项目总规划师、新赛道开拓者、卓越教育家或公共行政高管等需要绝对主导与顶层设计的领袖岗位。"
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
      ja: "シナモンのつると生き生きとした草のように生まれたあなたは、どんな環境でも適応し、咲くことができる素晴らしい生命力と親和性を持っていました。他人の心を丁寧に計り知れないことを知り、芸術的な感覚と繊細さが最大の利点です。",
      zh: "像美丽的野花与攀爬的藤蔓，你拥有惊人的适应力与人际亲和力. 心思细腻，富有艺术感知，无论身处何境，都能坚韧地绽放出别样美丽。"
    },
    travelVibe: {
      ko: "예쁘고 감각적인 인테리어의 카페 호핑, 골목길 빈티지 숍 탐방, 그리고 아기자기한 정원/플라워 마켓 힐링 일정을 사랑합니다.",
      en: "Sensory café hopping with aesthetic interiors, exploring local vintage boutiques, and romantic strolls through floral gardens.",
      ja: "きれいでセンセーショナルなインテリアのカフェホッピング、路地ヴィンテージショップを訪れる、そして赤ちゃんの庭/フラワーマーケットヒーリングスケジュールが大好きです。",
      zh: "打卡极具美感艺术设计的咖啡馆，探索街角复古买手店，以及在精致浪漫的花园中享受治愈漫步。"
    },
    loveVibe: {
      ko: "섬세하고 다정한 소통을 사랑합니다. 상대방의 사소한 감정 변화도 섬세하게 알아차리며, 주변과 조화를 이루고 상대의 장점을 피워내는 따스한 꽃밭 같은 연애를 선호합니다.",
      en: "Warm, empathetic, and sweet. You notice the subtlest emotional shifts in your partner and support them with caring devotion, creating a cozy and romantic atmosphere.",
      ja: "繊細で優しいコミュニケーションが大好きです。相手の些細な感情変化も繊細に気づき、周辺と調和して相手の長所を咲かせる暖かい花畑のような恋愛を好みます。",
      zh: "偏爱细腻且温柔的沟通方式. 善于捕捉伴侣细微的情绪变化，能像春风化雨般包容与引导对方，共同营造充满诗意与温馨的浪漫氛围。"
    },
    wealthVibe: {
      ko: "실속이 매우 강한 영리한 자산 관리자 스타일입니다. 모진 환경에서도 살아남는 놀라운 적응력과 생활력을 가졌으며, 디테일한 네트워킹과 트렌디한 감각, 예술적 재능을 활용하여 알차게 재산을 늘려갑니다.",
      en: "Shrewd and highly adaptable asset builder. You leverage close social networking, creative details, and trends to build secure, highly practical wealth steadily over time.",
      ja: "ストールが非常に強い巧妙なアセットマネージャースタイルです。モジン環境でも生き残る驚くべき適応力と生活力を持ち、ディテールなネットワーキングとトレンディな感覚、芸術的才能を活用し、充実した財産を増やしていきます。",
      zh: "极具商业敏锐度的理财家. 拥有在任何逆境中都能顽强生存的超强适应力，善于利用人际网络、精细的时尚触觉与艺术天赋，稳健地积攒属于自己的财富帝国。"
    },
    charmVibe: {
      ko: "상대를 편안하게 만드는 극강의 다정함과 부드러운 친화력. 어떤 환경에서도 피어나는 유연한 사교성과 섬세한 감성적 안목이 주변 사람들의 마음을 은은하게 스며들게 만듭니다.",
      en: "Ultra-soothing gentleness and dynamic affinity. Your flexible social charm that blooms anywhere, combined with a delicate aesthetic eye, melts anyone's heart instantly.",
      ja: "相手をリラックスさせる極上の優しさと柔らかな親和力. どんな環境でも花開く柔軟な社交性と繊細な感性が周囲の人々の心に自然に染み渡ります.",
      zh: "能够让人彻底放松的极致温柔与亲和磁场. 无论身处何处都能自如绽放的社交弹性，以及敏锐的感性审美眼光，能润物无声地融入每个人的心田。"
    },
    careerVibe: {
      ko: "크리에이티브 디렉터, 예술/디자인 계열 전문가, 인사 관리(HR), 상담사, 콘텐츠 플래너 등 조화와 소통, 감각적 스킬이 요구되는 분야가 제격입니다.",
      en: "Perfect for creative directors, art/design specialists, human resources (HR), counselors, and content planners where harmony, sensory skills, and close communication are paramount.",
      ja: "クリエイティブディレクター、芸術/デザイン系専門家、人事管理（HR）、カウンセラー、コンテンツプランナーなど調和とコミュニケーション、感覚的スキルが求められる分野が適格です。",
      zh: "非常适合创意艺术总监、工业视觉设计大师、人力资源管理(HR)、心理咨询专家或核心新媒体策划等高度依靠人际共情与美感表现的岗位。"
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
      ja: "☀️空の熱い太陽（丙火）",
      zh: "☀️ 天空炽热的太阳 (丙火)"
    },
    desc: {
      ko: "하늘에 빛나는 태양의 에너지를 타고난 당신은 활달하고 쾌활하며, 주변에 밝은 희망을 전파하는 해피바이러스입니다. 열정적이며 화끈한 자기 표현력을 가졌고, 언제 어디서나 존재감 넘치는 무대의 주인공이 됩니다.",
      en: "Endowed with the energetic force of the sun. You are bright, warm-hearted, and incredibly expressive, acting as a happy virus. Naturally passionate and extroverted, you shine like a superstar wherever you set foot.",
      ja: "空に輝く太陽のエネルギーに生まれたあなたは、活気に満ちた、陽気で、周囲に明るい希望を伝えるハッピーウイルスです。情熱的で熱い自己表現力を持ち、いつでもどこでも存在感あふれる舞台の主人公になります。",
      zh: "天堂的生活是可能的，而世界的速度是有限的。 你性格开朗，热情洋溢，就像快乐病毒般的身体边人。他有着直接而充满激情的自我表达能力，随时随地成为存在感极强的舞台主角。"
    },
    travelVibe: {
      ko: "불꽃놀이가 있는 대형 축제, 화려한 야경이 펼쳐지는 루프탑 파티, 현지 번개 펍 크롤링처럼 가슴 뛰는 액티비티가 최고입니다.",
      en: "Vibrant local festivals with fireworks, glamorous rooftop nightlife with starry views, and high-energy pub crawls with new friends.",
      ja: "花火のある大型フェスティバル、華やかな夜景が広がるルーフトップパーティー、地元の雷パブクロールのように胸元のアクティビティが最高です。",
      zh: "烟花璀璨的大型庆典、坐拥华丽夜景的屋顶露台派对，以及与新朋友一起体验极具当地特色的酒吧夜间探索。"
    },
    loveVibe: {
      ko: "불꽃처럼 뜨겁고 숨김이 없는 열정적인 연애를 합니다. 첫눈에 반하는 사랑에 약하며, 연인에게 자신의 밝고 따뜻한 에너지를 거침없이 표현하고 퍼주는 아낌없는 사랑꾼입니다.",
      en: "Blazingly passionate and direct. You fall in love intensely and express your warm affection without hesitation, lighting up your partner's life like a superstar.",
      ja: "花火のように熱く隠れない情熱的な恋愛をします。一目惚れする愛に弱く、恋人に自分の明るく暖かいエネルギーを慌てて表現し広げる惜しみない愛者です。",
      zh: "轰轰烈烈、毫无保留的热烈恋爱型. 容易一眼万年，恋爱中会用阳光般的热烈能量彻底照亮对方，毫不吝啬地为心爱的人付出一切。"
    },
    wealthVibe: {
      ko: "스케일이 큰 화끈한 투자자나 마케터 스타일입니다. 자기 자신을 브랜드화하여 사람들을 끌어모으는 능력이 대단하며, 미적 감각과 대범함을 살린 큰 스케일의 사업이나 광고 활동을 통해 풍부한 재화를 창출해 냅니다.",
      en: "High-scale brand builder and bold investor. You generate wealth by making yourself a bright, trusted authority, attracting vast crowds and launching energetic businesses.",
      ja: "スケールの大きい熱い投資家やマーケティングスタイルです。自分自身をブランド化して人々を引き寄せる能力がすばらしく、美的感覚と大範さを活かした大きなスケールの事業や広告活動を通じて豊かな財貨を創出します。",
      zh: "格局宏大的投资家与自我品牌塑造者. 天生具有极强的个人号召力与舞台感，擅长通过大规模的商业运作、创意营销或艺术传播创造爆发性的财富。"
    },
    charmVibe: {
      ko: "무대를 장악하는 독보적인 존재감과 세상을 비추는 밝은 에너지. 숨김없이 솔직한 사랑스러움과 언제나 긍정적인 희망을 전파하는 해피바이러스 기질이 사람들을 자석처럼 끌어당깁니다.",
      en: "Stunning stage presence and brilliant, illuminating energy. Your transparent, genuine affection and joy act as a happy magnet that draws everyone in.",
      ja: "舞台を圧倒する絶対的な存在感と世の中を照らす明るいエネルギー. 率直で愛らしい魅力といつも前向きな希望を届けるハッピーウイルス質が人を惹きつけます.",
      zh: "掌控全场的绝对瞩目感，以及普照世间的明媚正能量. 坦诚炽烈的率真磁场，配合无可救药的快乐感染力，能瞬间吸引无数追随者。"
    },
    careerVibe: {
      ko: "엔터테이너, 마케팅 총괄, 대외 커뮤니케이터, 미디어 방송 크리에이터, 영업 및 홍보 디렉터처럼 자신을 밝히고 무대 중심에 서는 직군이 완벽합니다.",
      en: "Perfect for entertainers, marketing directors, global PR communicators, media creators, and high-level sales coordinators—roles where you take the spotlight.",
      ja: "エンターテイナー、マーケティング総括、対外コミュニケーター、メディア放送クリエイター、セールス、プロモーションディレクターのように自分自身を明らかにし、ステージの中心に立つ直軍が完璧です。",
      zh: "非常适合舞台艺人、品牌营销创意总监、金牌公关官、千万级自媒体主播或市场开拓总监等需要站在聚光灯正中央的明星岗位。"
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
      ja: "🕯️ 穏やかな夜空のキャンドル（丁火）",
      zh: "🕯️ 温暖夜空的烛光 (丁火)"
    },
    desc: {
      ko: "은은하게 밤을 밝히는 등불과 촛불을 뜻하는 당신은 사려 깊고 다정하며, 보이지 않는 곳에서 묵묵히 타인을 챙겨주는 사주입니다. 겉으론 차분해 보이지만 내면에 뜨거운 예술적 열정과 지혜를 품고 있는 매력적인 현자입니다.",
      en: "Representing the glowing starlight or warm hearth, you are exceptionally gentle, thoughtful, and loyal. While calm on the surface, you harbor a rich inner flame of creativity, deep wisdom, and sincere affection.",
      ja: "穏やかに夜を照らすランタンとキャンドルを意味するあなたは思慮深く、優しく、目に見えない場所で黙々と他人を握ってくれる社主です。一見落ち着いて見えますが、内面に熱い芸術的情熱と知恵を抱いている魅力的な賢者です。",
      zh: "代表着在黑夜中静静跳动的烛光与星火，你体贴温柔，总在旁人看不见的地方默默给予关怀. 外表安静内敛，内心却藏着炽热 of 艺术才华与智慧。"
    },
    travelVibe: {
      ko: "고즈넉한 LP 바 감상, 분위기 있는 재즈 카페, 밤하늘 별 보며 나누는 캠프파이어 번개처럼 로맨틱하고 정적 밤 여정이 딱입니다.",
      en: "Listening to vinyl records in cozy LP bars, aesthetic jazz clubs, or sharing warm conversations under a campfire starry sky.",
      ja: "静かなLPバー鑑賞、雰囲気のあるジャズカフェ、夜空の星を見ながら分かち合うキャンプファイヤー雷のように、ロマンチックで静的な夜の旅がピッタリです。",
      zh: "在复古&nbsp;LP&nbsp;唱片吧聆听旋律，打卡有情调的爵士咖啡馆，或是在篝火星空下与懂你的人静谧畅谈."
    },
    loveVibe: {
      ko: "은은하고 사려 깊은 연애를 합니다. 겉으로는 조용해 보여도 연인을 향한 일편단심의 따뜻한 불꽃을 지녔으며, 보이지 않는 곳에서 상대방의 상처를 따스하게 보듬어주는 치유의 연애를 합니다.",
      en: "Quietly devoted and deeply romantic. Though calm on the surface, you hold a warm inner flame of loyalty, acting as a healing, gentle protector to your partner.",
      ja: "ほのかで思いやりのある恋愛をします。表では静かで見せても恋人に向かった一片断心の暖かい花火を持っており、見えないところで相手の傷を暖かく補う癒しの恋愛をします。",
      zh: "保持温柔体贴的关系。虽然表面上看起来很安静，但他们对爱人却有着一心一意的温暖火焰，他们在看不见的地方温暖地抚慰对方的伤口，建立一种治愈的关系。"
    },
    wealthVibe: {
      ko: "전문 지식과 분석력을 갖춘 연구원이나 설계자 스타일입니다. 신중하고 섬세하게 재무 포트폴리오를 작성하며, 한 분야의 스페셜리스트로서 묵묵히 활약하며 마르지 않는 샘물 같은 안정적인 수익 흐름을 구축합니다.",
      en: "Expert specialist and careful financial planner. You prefer security and build constant, reliable income flows by mastering a highly technical niche or creative domain.",
      ja: "専門知識と分析力を備えた研究者や設計者スタイルです。慎重で繊細な財務ポートフォリオを作成し、ある分野のスペシャリストとして黙々と活躍し、乾かない湧水のような安定した収益フローを構築します。",
      zh: "拥有卓越钻研力的技术专家与系统分析师. 倾向于通过专业知识构建安全的财务护城河，在一个特定垂直领域做深做精，获取源源不断的高品质持久收益。"
    },
    charmVibe: {
      ko: "따스하게 밤을 녹이는 은은한 다정함과 차분하고 예리한 신비감. 겉으로는 차분해 보여도 사려 깊은 세밀한 위로와 경청으로 상대의 숨겨진 고민과 아픔을 말없이 치유해 주는 반전 매력이 있습니다.",
      en: "Soothing lantern-like warmth and subtle, sharp mystery. You heal others' hidden worries with your silent, highly deep empathy and active listening skills.",
      ja: "夜を温かく溶かす穏やかな優しさと落ち着いたミステリアスさ. 静かに見えても細やかな配慮と傾聴で相手の心の傷をそっと癒す反転の魅力を持っています.",
      zh: "在静谧深夜温柔抚慰心灵的烛光，以及安静神秘的高雅磁场. 喜欢用默默的倾听与细腻的同理心抚平对方内心的褶皱，拥有让人欲罢不能的疗愈力。"
    },
    careerVibe: {
      ko: "고도의 전문 연구원, IT 시스템 설계자, 심리상담 치료사, 작가, 금융 분석가처럼 은밀하면서도 고도의 고부가가치 전문성을 발휘하는 천직이 맞습니다.",
      en: "Superb for expert research fellows, IT systems architects, psychologists, novelists, and financial analysts—roles requiring quiet, high-value expertise.",
      ja: "高度な専門研究者、ITシステム設計者、心理相談セラピスト、作家、金融アナリストのように、秘密ながら高度な高付加価値の専門性を発揮する天職が正しい。",
      zh: "非常适合高端研发科学家、顶级IT架构师、深层心理咨询专家、科幻作家或量化金融分析师等需要精深垂直研究的独立高薪岗位。"
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
      ja: "⛰️揺れのない太山（戊土）",
      zh: "⛰️ 巍然屹立的泰山 (戊土)"
    },
    desc: {
      ko: "넓고 높은 태산의 기질을 지닌 당신은 묵직하고 신의가 깊어 함께하는 사람들에게 절대적인 안정감과 신뢰를 주는 든든한 등대입니다. 사사로운 감정에 휘둘리지 않고 큰 흐름을 관망하는 도량과 넓은 포용력이 큰 무기입니다.",
      en: "Reflecting the steady power of a majestic mountain, you are deeply reliable, honest, and protective. You do not sway under trivial emotions, offering absolute safety and wise support to everyone on your journey.",
      ja: "広くて高い泰山の気質を持つあなたは、どっしりと神義が深く、一緒にいる人々に絶対的な安定感と信頼を与える心強い灯台です。爽やかな感情に振り回されず、大きな流れを観望する度量と広い包容力が大きい武器です。",
      zh: "拥有高大巍峨的泰山气度. 你沉稳忠诚，能给旅伴带来绝对的安全感与踏实感. 不轻易被琐碎的情绪所左右，心胸宽广，看重长远与格局。"
    },
    travelVibe: {
      ko: "수백 년 역사가 보존된 고궁 유적지 탐험, 국립공원의 웅장한 대자연 투어, 깊이 있는 박물관 투어처럼 중후한 여행이 좋습니다.",
      en: "Exploring centuries-old historical ruins, sweeping National Park hiking trails, and immersive museum walks packed with heritage.",
      ja: "数百年の歴史が保存された故宮遺跡の探検、国立公園の壮大な大自然ツアー、深い博物館ツアーのような重厚な旅行がお勧めです。",
      zh: "我们推荐深度旅行，例如探索保存了数百年历史的古老宫殿遗址，游览国家公园的壮丽自然，或深度博物馆之旅。"
    },
    loveVibe: {
      ko: "태산처럼 흔들림 없는 묵직하고 믿음직한 연애를 지향합니다. 쉽게 흔들리거나 감정적이지 않으며, 연인이 기댈 수 있는 큰 그늘이 되어 오랜 시간 동안 단단한 신뢰를 지켜나가는 스타일입니다.",
      en: "Steady and deep like a majestic mountain. You avoid emotional turbulence and act as a reliable shelter, building deep, long-term trust and mutual respect.",
      ja: "テサンのように揺れのない暗くて信頼できる恋愛を目指します。簡単に揺れたり感情的ではなく、恋人が寄りかかえる大きな陰になって長時間堅い信頼を守っていくスタイルです。",
      zh: "我们的目标是建立像泰山一样坚不可摧的厚重可靠的关系。这是一种不易动摇或情绪化的风格，成为恋人可以依靠的巨大阴影，长期保持牢固的信任。"
    },
    wealthVibe: {
      ko: "장기적인 안목을 가진 부동산이나 묵직한 자산 신탁 스타일입니다. 조급하게 일확천금을 노리기보다, 가치 있는 것에 묵직하게 장기 투자하여 대기만성형으로 안정적인 큰 부를 일궈내는 포용력 넓은 자산가입니다.",
      en: "Long-term value investor and asset guardian. You despise reckless gambles, building monumental wealth through patience, strategic real estate, or high-value physical assets.",
      ja: "長期的な目を持つ不動産や濃厚な資産信託スタイルです。早急に一確天金を狙うより、価値あるものにずっと長期投資し、大気慢成形で安定した大きな富を生み出す包容力広い資産家です。",
      zh: "科技部大型事业单位。它是一艘通过投资无害良善的资产，投资长期价值高的资产，创造巨大资产的船只。"
    },
    charmVibe: {
      ko: "곁에만 있어도 안심이 되는 거대한 안식처와 흔들림 없는 묵직함. 감정 기복이 적어 연인이 언제든 와서 마음 놓고 기댈 수 있는 따스하고 든든한 품이 최고의 마성적 매력입니다.",
      en: "Sweeping safety of a massive sanctuary and absolute emotional stability. Your mature, accommodating nature acts as the ultimate safe haven that partners cherish.",
      ja: "側にいるだけで安心できる大きな居場所と揺るぎない安定感. 感情の起伏が少なく, いつでも信頼して頼れる強固な温もりが最大の魅力です.",
      zh: "令人在侧便倍感安心的稳重感，与厚德载物的包容气量. 没有情绪起伏的阴晴不定，能够像大地一样默默承托对方所有的脆弱与心声。"
    },
    careerVibe: {
      ko: "부동산 개발 전문가, 자산 신탁 관리자, 대형 공무/행정 관리직, 건축/안전 감독관 등 장기적 안목과 높은 신의가 요구되는 중후한 리딩 분야가 맞습니다.",
      en: "Superb for real estate developers, asset trust managers, macro public administration officials, and major construction directors where steady leadership is key.",
      ja: "不動産開発、アセット信託運用、大型行政管理職、建設・安全監督官など長期的な視点と高い信用が求められる分野が向きます.",
      zh: "非常适合重资产运营开发、信托基金管理人、大型跨国集团风控官、政府大型基建工程主管等需要强力承托与长远规划的岗位。"
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
      ja: "🌾万物を包む暖かい大地（己土）",
      zh: "🌾 孕育万物的温暖沃土 (己土)"
    },
    desc: {
      ko: "만물을 따뜻하게 감싸 안는 옥토와 어머니의 정원 같은 기질의 당신은 다정하고 포용력이 넘칩니다. 사람들의 이야기를 온화하게 경청하며, 모든 사람을 기분 좋게 하나로 이어주는 뛰어난 사회적 포용력과 요리/예술 재능을 지녔습니다.",
      en: "Embodying the warm, nurturing garden soil, you are deeply compassionate, gentle, and welcoming. You are a great listener and a natural connector, bringing people together with cozy warmth, fine tastes, or culinary talents.",
      ja: "万物を暖かく包み込むオクトと母の庭のような気質のあなたは優しく包容力があふれます。人々の物語を穏やかに聞き、すべての人を心地よく一つにつなげる優れた社会的包容力と料理/芸術才能を持っています。",
      zh: "如同一片温暖肥沃的田园土壤，你温柔体贴，具有极强的包容心. 是一位出色的聆听者，总能用温和的能量凝聚身边的旅伴，也往往在美食或手工艺术上极有天赋。"
    },
    travelVibe: {
      ko: "전국 각지의 유명 숨겨진 미식 노포 골목 도장 깨기, 전통 시장 먹거리 투어, 아늑한 시골 힐링 펜션 여행이 마음에 안정을 줍니다.",
      en: "Tasting through hidden historical street-food alleys, lively local market food tours, and healing getaways in organic countryside pensions.",
      ja: "全国各地の有名な隠されたグルメ老舗路地のゴム印を破る、伝統的な市場グルメツアー、居心地の良い田舎の癒しのペンション旅行が心に落ち着きます。",
      zh: "闯遍全国各地著名的隐秘美食店的小巷，来一场传统市场的美食之旅，前往舒适的乡村疗养民宿，让你安心无忧。"
    },
    loveVibe: {
      ko: "만물을 품는 대지처럼 포근하고 헌신적인 연애를 합니다. 상대의 고민을 늘 경청하며 온화하게 수용하고, 요리나 소소한 선물로 일상 속에서 다정다감하게 사랑을 전달하는 연애를 즐깁니다.",
      en: "Cozy, nurturing, and incredibly compassionate. You express your love through quiet acts of service, warm home-cooked meals, and gentle comfort, keeping love peaceful.",
      ja: "万物を抱く大地のようにふわふわで献身的な恋愛をします。相手の悩みをいつも聴いて穏やかに受け入れ、料理や少しの贈り物で日常の中で優しく愛を伝える恋愛を楽しみます。",
      zh: "我们有一份爱，就像大地包容万物一样温暖、专一。我喜欢这样的关系：我总是倾听并温柔地接受对方的担忧，并在日常生活中通过烹饪或小礼物温柔地传达爱。"
    },
    wealthVibe: {
      ko: "곡식을 차곡차곡 쌓는 성실한 알부자 스타일입니다. 매우 알뜰하고 계획적이며, 요식업, 조경, 교육 등 사람들에게 직접적이고 유용한 가치를 제공하는 실질적 사업이나 꼼꼼한 저축을 통해 탄탄한 부를 축적합니다.",
      en: "Pragmatic, detail-oriented accumulator of wealth. You excel in providing practical value (food, education, service) and grow your fortune step-by-step with impeccable savings.",
      ja: "穀物をチャゴクチャゴク積む誠実なアルブジャスタイルです。非常に精巧で計画的で、飲食業、造園、教育などの人々に直接的で有用な価値を提供する実用的なビジネスや細心の注意を払うことによって、堅実な富を蓄積します。",
      zh: "积沙成塔、务实笃行的金牌理财专家. 擅长在餐饮、绿化、教育或日常实体服务等能 planetary 级别地带来稳定和安心。"
    },
    charmVibe: {
      ko: "엄마 품 같은 포근한 다정함과 부드러운 화합 능력. 상대방의 사소한 투정까지 온화하게 보듬어주는 무한한 이해심과 손맛, 다정한 말 한마디가 가슴을 깊숙이 파고듭니다.",
      en: "Deep mother-like comforting gentleness and absolute harmony skills. Your endless understanding that embraces even minor complaints melts defensive hearts.",
      ja: "お母さんの腕の中のような温かさと調和の力. 相手の些細なわがままも温かく受け止める深い理解と手料理、優しい一言が胸に響きます.",
      zh: "如同母亲怀抱般的包容温存，与融化人际冰雪的温和沟通. 毫无攻击性的倾听，以及在精致手作、美食或细节中流露的爱意，能直击心灵防线。"
    },
    careerVibe: {
      ko: "식음료(F&B) 사업가, 교육자, 복지/의료 전문가, 플래너, 가드닝 및 친환경 산업 전문가 등 실질적으로 사람을 보살피고 영양을 제공하는 진로가 가장 길합니다.",
      en: "Impeccable for food & beverage (F&B) operators, educators, social work/medical experts, event planners, and organic agriculture leaders.",
      ja: "飲食・食品(F&B)事業家、教育者、福祉・医療専門家、プランナー、環境・農業産業の専門家など実用的に人を支える職種が合います.",
      zh: "非常适合高端酒店餐饮(F&B)主理人、卓越幼儿与青少年教育家、深层福利医疗专家、活动策划大师或都市绿色环保空间设计师。"
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
      ja: "⚔️正義の硬いナイフ（庚金）",
      zh: "⚔️ 正义刚毅的钢铁长剑 (庚金)"
    },
    desc: {
      ko: "강철처럼 단단하고 단호하며 불의를 참지 못하는 결단력과 정의감의 화신입니다. 거침없고 시원시원한 성격으로 강한 추진력을 지녔으며, 우유부단하지 않고 일단 결정하면 거침없이 돌파하는 멋진 카리스마의 소유자입니다.",
      en: "Solid and resolute like raw steel. You are the embodiment of decisiveness, fairness, and bold determination. Extroverted, direct, and dynamic, you despise hesitation and lead with irresistible charismatic drive.",
      ja: "スチールのように硬くて断固として、不意を我慢できない決断力と正義感の化身です。荒々しくて涼しい性格で強い推進力を持ち、牛乳を断らずに一度決めれば、荒れもなく突破する素敵なカリスマの持ち主です。",
      zh: "他坚如钢铁，是决断和正义的化身，不能容忍不公正。他性格直爽、清爽，驱动力极强。他并不是优柔寡断，一旦决定，他就有巨大的魅力，毫不犹豫地突破。"
    },
    travelVibe: {
      ko: "자유를 만끽하는 끝없는 고속도로 자동차 로드 트립, 짜릿한 스카이다이빙이나 산악 ATV 등 와일드하고 쿨한 아웃도어 스포츠.",
      en: "Epic cross-country highway road trips, thrilling skydiving, mountain biking, or rugged off-road ATV adventures.",
      ja: "自由を満喫する無限の高速道路車ロードトリップ、爽やかなスカイダイビングや山岳ATVなどワイルドでクールなアウトドアスポーツ。",
      zh: "体验在无边公路上的自驾之旅，挑战高空跳伞、越野ATV等充满野性与凉意的高能量户外运动。"
    },
    loveVibe: {
      ko: "밀당이 없는 확실하고 시원시원한 연애를 선호합니다. 호불호가 매우 뚜렷하고 정의로워 연인을 지키는 든든한 보디가드 역할을 자처하며, 맺고 끊음이 확실하여 뒤끝 없는 깔끔한 사랑을 지향합니다.",
      en: "Direct, bold, and fiercely protective. You hate complicated mind games and prefer transparent, straightforward communication, standing tall as your partner's ultimate shield.",
      ja: "密糖のない確実で涼しい恋愛を好みます。ホブホが非常に明確で正義で恋人を守る心強いボディーガードの役割を自治し、結び、絶え間がないことを確実にし、無限のきれいな愛を目指します。",
      zh: "爽快直率、绝不拖泥带水的豪迈恋爱风. 极度反感欲擒故纵的拉扯，在感情中勇于扮演捍卫爱人的黑骑士，行事坦荡，爱恨分明，给对方最直观的安全感。"
    },
    wealthVibe: {
      ko: "승부사 기질을 지닌 단호한 금융가나 정밀 엔지니어 스타일입니다. 결단력과 강력한 추진력으로 무장하여 일의 효율을 극대화하며, 과감한 결단과 깔끔한 위기 관리를 통해 큰 비즈니스 딜이나 금융 투자에서 성과를 냅니다.",
      en: "Decisive dealmaker and robust risk manager. Equipped with sharp logic and bold resolution, you excel in high-stakes finance, engineering, or sweeping corporate operations.",
      ja: "勝負士の基質を持つ断固たる金融家や精密エンジニアスタイルです。決断力と強力な推進力で武装し、仕事の効率を最大化し、大胆な決断ときちんとした危機管理を通じ、大きなビジネスディールや金融投資で成果を上げます。",
      zh: "天降，财富，掌控，冷却，冷却，控制，控制，控制，控制。有了决心，我们就能最大限度地提高工作效率。"
    },
    charmVibe: {
      ko: "거침없이 시원한 솔직함과 연인을 목숨 걸고 지키는 든든한 카리스마. 우유부단하게 시간 끌지 않는 확실한 행동력이 상대에게 대단히 남성적이고 크나큰 카리스마로 비춰집니다.",
      en: "Blunt, refreshing honesty and a protective shield personality. Your quick decision-making and reliable action inspire absolute trust.",
      ja: "ストレートで爽快な率直さと恋人を全力で守るリーダーシップ. 決断を先延ばしにしない行動力が大きなカリスマとして相手に映ります.",
      zh: "雷厉风行的直率与毫无畏惧的爱人防线. 绝不拖泥带水，敢于担当，在危机时刻挺身而出的帅气决断力是最撩人的荷尔蒙。"
    },
    careerVibe: {
      ko: "금융/M&A 전문가, 정밀 기계 엔지니어, 법률/검경/군인 수사관, 고위 의사처럼 날카로운 분석과 과감한 돌파구가 필요한 고소득 의사결정 전문직이 최고의 적성입니다.",
      en: "Top-tier for investment banking / M&A specialists, precision engineers, law enforcement / military officers, and surgeons requiring swift decisions.",
      ja: "金融/M&A専門家、精密機械エンジニア、弁護士・警察・軍人、外科医など高い推進力と明確な判断が必要な職種が向きます.",
      zh: "非常适合顶尖投行并购专家、高级精密机械工程师、高级检察官/刑警/特种军官、或需要在极短时间内做出重大裁决的外科主治医师。"
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
      ja: "💎夜空のダイヤモンドジュエリー（辛金）",
      zh: "💎 璀璨夺目的珠宝玉石 (辛金)"
    },
    desc: {
      ko: "정교하게 다듬어진 다이아몬드나 보석처럼 빛나는 감성의 소유자인 당신은 매우 예리하고 미적 안목이 대단히 뛰어납니다. 청결하고 깔끔한 성격을 지향하며, 남들과 다른 독창적인 스페셜티와 섬세함을 자부하는 완벽주의자입니다.",
      en: "Like a flawlessly polished diamond, you are refined, glamorous, and possess unmatched aesthetic taste. Highly sharp, clean, and unique, you value pristine premium experiences and proud independent originality.",
      ja: "精巧に仕上げられたダイヤモンドや宝石のように輝く感性の所有者であるあなたは非常に鋭く美的目が非常に優れています。清潔ですっきりとした性格を目指し、他人や他の独創的なスペシャルティと繊細さを誇る完璧主義者です。",
      zh: "如同经过极致雕琢的璀璨宝石，你气质高雅，拥有无可挑剔的美学鉴赏力. 追求精致，心思细腻，在许多领域都极具独创力，是一个自带高贵感的完美主义者。"
    },
    travelVibe: {
      ko: "최첨단 디자인의 미술관, 해외 명품 빈티지 쇼룸 쇼핑, 파인 다이닝 미식 코스 요리처럼 최고로 엄선된 프리미엄 럭셔리 루틴.",
      en: "Stunning avant-garde design museums, luxury boutique shopping tours, and multi-course fine dining gastronomy journeys.",
      ja: "最先端デザインの美術館、海外高級ヴィンテージショールームショッピング、ファインダイニンググルメコース料理のように最高に厳選されたプレミアムラグジュアリールーチン。",
      zh: "前沿设计艺术画廊、海外奢华复古陈列室购物、精致美食套餐等顶级奢华套路，精选精选。"
    },
    loveVibe: {
      ko: "세련되고 품격 있는 프리미엄 연애를 지향합니다. 사람을 보는 눈이 대단히 높고 섬세하여 쉽게 마음을 열지 않지만, 한 번 내 사람이 되면 세상에서 가장 특별하고 빛나는 다이아몬드 같은 대우를 해줍니다.",
      en: "Elegant, sophisticated, and highly selective. While you don't open your heart easily, once you commit, you treat your partner with the utmost specialty, romance, and respect.",
      ja: "おしゃれで上品なプレミアム恋愛を目指します。人を見る目が非常に高く繊細で簡単に心を開けませんが、一度私の人になると、世界で最も特別で輝くダイヤモンドのような扱いをしてくれます。",
      zh: "我们的目标是建立精致而优雅的优质关系。他对人的眼光很高很细腻，不轻易敞开心扉，但一旦成为我的人，他就把我当作世界上最特别、最闪亮的钻石。"
    },
    wealthVibe: {
      ko: "고부가가치를 창출하는 프리미엄 전문직 스타일입니다. 최고의 정밀함과 심미안, 특별한 아이디어를 지녔으며, 명품 비즈니스나 하이테크 분야, 정교한 라이선스 사업 등 남들과 완전히 차별화된 고수익 전문직에서 활약합니다.",
      en: "High-value professional and elite designer. You thrive in premium, hyper-specialized niches—luxury businesses, high-tech, intellectual property—generating top-tier wealth.",
      ja: "高付加価値を創出するプレミアム専門職スタイルです。最高の精密さと審美案、特別なアイデアを持ち、高級ビジネスやハイテク分野、洗練されたライセンス事業など、他人と完全に差別化された高収益専門職で活躍します。",
      zh: "这是一种创造高附加值的优质专业风格。他们拥有最高水准的精准度、审美观和独特的想法，活跃在与其他人完全区别的高利润专业岗位，如奢侈品业务、高科技领域、尖端授权业务等。"
    },
    charmVibe: {
      ko: "완벽하게 다듬어진 다이아몬드 아우라와 정갈하고 차가운 이지성. 쉽게 다가갈 수 없는 차가운 귀족 같다가도, 소중한 사람만을 향해 세련되고 화려한 안목을 선물하는 독점적 소유 욕구가 엄청난 매력입니다.",
      en: "Flawless diamond-like aura and pristine intellectual elegance. Your elegant standard and sharp sensory touch attract deep adoration.",
      ja: "洗練されたダイヤモンドのようなオーラと知的な上品さ. 誰にでも心を開かない高潔さと、大切な人だけに特別なこだわりを見せるギャップが人を虜にします.",
      zh: "完美切割的钻石气场，与纤尘不染的高冷理智. 宛如不易亲近的贵族，却只为一人展现极致细腻的高雅呵护，这种专属感具有绝对的致命诱惑。"
    },
    careerVibe: {
      ko: "명품 명품 쥬얼리/패션 디자이너, 정밀 기술 연구원, 변호사/회계사 등 라이선스 전문직, 럭셔리 마켓 헤드 등 극도로 섬세함과 독보적 가치를 다루는 진로가 최고입니다.",
      en: "Unrivaled for luxury fashion/jewelry designers, microtech researchers, elite attorneys, CPAs, and high-end brand curators.",
      ja: "高級ジュエリー・ファッションデザイナー、精密研究員、弁護士・会計士などの士業、高級ブランドバイヤーなど独自のクオリティを追求する職群が向きます.",
      zh: "极适合奢侈品珠宝/时尚高定设计师、超微半导体芯片工程师、金牌大律师/高端注册会计师、或豪车豪宅等超高端品牌首席采购官。"
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
      ja: "🌊無限の広い海と海（壬水）",
      zh: "🌊 奔流不息的无垠大洋 (壬水)"
    },
    desc: {
      ko: "모든 물줄기를 받아들이는 거대한 바다의 기질을 가진 당신은 지혜롭고 깊이 있으며 통이 큽니다. 머리가 명석하고 임기응변에 대단히 강하며, 큰 흐름을 조율하고 기획할 줄 아는 통솔력과 대범한 스케일을 자랑합니다.",
      en: "Reflecting the vast, deep, and dynamic power of the ocean, you are incredibly wise, adaptable, and far-sighted. Excellent at strategic thinking, you possess a giant scale of mind, flowing smoothly past obstacle with bold grace.",
      ja: "すべての水の流れを受け入れる巨大な海の気質を持つあなたは賢明で深く、樽が大きいです。頭が明確で臨機応変に非常に強く、大きな流れを調整して企画することができる統率力と大規模なスケールを誇ります。",
      zh: "拥有容纳百川的大海般气度. 你聪慧深邃，思想开阔，有着极强的随机应变能力. 擅长纵观全局，运筹帷幄，行事风格豁达大气，自带洒脱光环。"
    },
    travelVibe: {
      ko: "푸른 파도가 출렁이는 서핑 해변, 로맨틱한 요트 보트 세일링, 도시 야경이 비치는 아름다운 해안 드라이브 코스.",
      en: "Splashing into surfing beaches, scenic romantic yacht sailing, and epic drives along coastal cliffs overlooking city light arrays.",
      ja: "青い波が出るサーフィンビーチ、ロマンチックなヨットボートセーリング、街の夜景が映える美しい海岸ドライブコース。",
      zh: "在海风呼啸的沙滩体验冲浪刺激，包下一艘游艇随波逐流，或在霓虹初上时沿着绝美海岸线兜风散心。"
    },
    loveVibe: {
      ko: "바다처럼 깊고 포용력 넓은 어른스러운 연애를 합니다. 연인의 실수를 너그럽게 품어줄 줄 아는 넓은 그릇을 지녔으며, 지혜롭고 유연하여 연애 관계에서도 큰 흐름을 자연스럽고 평화롭게 주도해 나갑니다.",
      en: "Deep, far-sighted, and fluid like the ocean. You are extremely understanding and strategically direct your relationship with quiet wisdom and broad, accommodating affection.",
      ja: "海のように深く包容力広い大人な恋愛をします。恋人のミスを寛大に抱かせてくれる広いボウルを持っており、賢くて柔軟で、恋愛関係でも大きな流れを自然で平和に導いていきます。",
      zh: "我拥有一种成年人般的关系，像海洋一样​​深厚和宽容。他们能够宽容地容忍爱人的错误，而且明智而灵活，在恋爱关系中引导自然、平和的潮流。"
    },
    wealthVibe: {
      ko: "글로벌 무역이나 거시적 유통망을 다루는 큰 손 스타일입니다. 생각의 범위와 판이 대단히 넓으며, 유통, 해운, IT 네트워킹처럼 물이 흐르듯 돈을 계속 순환시키고 지혜롭게 판을 설계하여 메가톤급 부를 움직입니다.",
      en: "Global merchant and macro-network strategist. You thrive in trade, logistics, and tech systems that keep massive assets circulating smoothly, generating scale-defying wealth.",
      ja: "グローバル貿易や巨視的な流通網を扱う大きな手スタイルです。思考の範囲と版が非常に広く、流通、海運、ITネットワーキングのように水が流​​れるようにお金を循環させ続け、賢く版を設計してメガトン級部を動かします。",
      zh: "四海四海，航线各异。它可以灵活地移动极大的板材。"
    },
    charmVibe: {
      ko: "끝없는 심해 같은 신비로움과 속을 알 수 없어 더 끌리는 포용력. 소소한 실수를 유머러스하게 넘기는 바다 같은 도량과 막힘없는 임기응변, 거시적 지혜가 이성에게 엄청난 매력으로 다가옵니다.",
      en: "Infinite ocean-like mystique and strategic, broad adaptability. Your intellectual ease and deep, calm scale of mind make you highly magnetic.",
      ja: "どこまでも深い海のような神秘的さと器の広さ. 恋人の失敗を寛容に笑い飛ばす度量と、臨機応変な知恵が大人の色気として感じられます.",
      zh: "如无尽深海般令人渴望探索的神秘感，与广阔的宏观格局. 能用幽默化解尴尬，包容对方的小脾气，在无形中从容掌控全场，尽显优雅的高智商性感。"
    },
    careerVibe: {
      ko: "글로벌 무역 전문가, 유통/물류 총괄, 거시 경제/투자 애널리스트, 대규모 소프트웨어 플랫폼 설계가처럼 흐름을 만들고 재화의 순환을 지휘하는 거시적 비즈니스가 천직입니다.",
      en: "Unmatched for global trading directors, shipping logistics CEOs, macro investment analysts, and enterprise cloud platform architects.",
      ja: "グローバル貿易専門家、流通・物流管理、マクロ経済・投資アナリスト、大型ソフトウェアプラットフォーム設計者など、大局を動かす分野が適職です.",
      zh: "极其适合跨国物流/海运巨头掌舵人、全球宏观对冲基金首席架构师、大型云端SaaS平台总设计师等掌握巨大物流与信息流循环的支柱岗位。"
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
      ja: "🌧️万物を濡らす夜露と雨（癸水）",
      zh: "🌧️ 润泽万物的清晨细雨 (癸水)"
    },
    desc: {
      ko: "맑고 깨끗한 아침이슬과 생명의 단비를 상징하는 당신은 지극히 유연하고 세심하며, 타인의 아픔을 깊이 위로할 줄 아는 힐러 사주입니다. 통찰력이 매우 깊어 보이지 않는 본질을 꿰뚫어 보며, 평화주의자로서 부드러운 화합을 도모합니다.",
      en: "Embodying the clear morning dew and gentle life-giving rain. You are highly intuitive, flexible, and deeply empathetic. You notice the subtlest changes in others' feelings, serving as a peaceful harmonizer and healer.",
      ja: "明るく清潔な朝露と命の丹念を象徴するあなたは、極めて柔軟で細心の注意を払い、他人の痛みを深く慰めることを知っているヒーラーです。洞察力が非常に深く見えない本質を貫き、平和主義者として柔らかい和合を図ります。",
      zh: "象征着清晨莹润的露珠与滋润万物的甘霖. 你温柔灵动，心思极为细腻，具有极强的共情与治愈力. 直觉敏锐，洞察力极强，是向往纯净与和平的温柔使者。"
    },
    travelVibe: {
      ko: "숲속의 고요한 웰니스 온천 스파, 한적한 사찰에서의 차 명상 템플스테이, 조용하게 흐르는 강변 보트 힐링 일정.",
      en: "Secluded forest wellness hot spring spa getaways, tranquil temple-stay tea ceremonies, and silent riverboat cruises with mist morning views.",
      ja: "森の中の静かなウェルネス温泉スパ、静かな寺院での紅茶瞑想テンプルステイ、静かに流れる川沿いのボートヒーリングスケジュール。",
      zh: "森林中宁静的养生温泉水疗、幽静寺庙的茶禅寺住宿、沿着静静流淌的河流乘船游览疗愈。"
    },
    loveVibe: {
      ko: "단비처럼 촉촉하게 젖어드는 감성적이고 세밀한 연애를 합니다. 상대방의 사소한 필요까지 물 흐르듯 챙겨주며, 평화롭고 조화로운 관계를 지향하는 따스하고 로맨틱한 공감 능력을 발휘합니다.",
      en: "Intuitively tender, gentle, and highly romantic. You naturally care for your partner's smallest needs, aligning yourself to their frequency and providing sweet emotional harmony.",
      ja: "ダンビーのようにしっとりと濡れる感性的で細かい恋愛をします。相手の些細なニーズまで水の流れのように握ってくれ、平和で調和のとれた関係を目指す暖かくロマンチックな共感能力を発揮します。",
      zh: "若春雨般润物无声、饱含灵性与柔情的感性爱恋. 具有极高的共情才华，总能以极温柔的方式察觉爱人最细腻的需求，在平和宁静中建立坚实爱意。"
    },
    wealthVibe: {
      ko: "창의적인 지식 자산이나 콘텐츠 기획자 스타일입니다. 뛰어난 직관과 유연성, 세심한 기획력의 소유자로, 컨설팅, 미디어 콘텐츠, 정보 기술 등 두뇌를 활용한 지식재산권(IP)과 유연한 프리랜서 활동으로 알차게 재산을 늘립니다.",
      en: "Creative IP creator and intuitive consultant. You generate rich wealth using mental intelligence—consulting, copywriting, media, coding—building smart streams of passive income.",
      ja: "創造的な知識資産やコンテンツプランナースタイル。優れた直観と柔軟性、細心の企画力の所有者で、コンサルティング、メディアコンテンツ、情報技術など、脳を活用した知的財産権（IP）と柔軟なフリーランス活動で充実した財産を増やします。",
      zh: "创意知识资产或内容规划风格。作为一个具有出色直觉、灵活性和缜密计划的人，他通过知识产权（IP）和灵活的自由职业活动增加了自己的财富，在咨询、媒体内容和信息技术方面运用了自己的大脑。"
    },
    charmVibe: {
      ko: "촉촉이 젖어드는 다정한 공감 능력과 반짝반짝 빛나는 지적 위트. 상대의 미세한 기분 변화까지 다 알아채고 맞춰주는 세심한 센스와 부드러운 유머 감각이 상대를 서서히 중독 시켜 빠져나갈 수 없게 만듭니다.",
      en: "Gentle dew-like deep empathy and sparkling intellectual wit. Your soft humor and deep emotional intelligence make you incredibly addictive.",
      ja: "心に染み渡る共感力とキラリと光る知的なウィット. 相手の些細な気持ちの変化に気づき、優しく包むユーモアが相手を夢中にさせます.",
      zh: "温柔的同理心能力和闪闪发光的智慧。他们细心的细节感和温和的幽默感，让他们能够注意到并适应对方情绪的细微变化，逐渐让对方着迷，让他们无法逃脱。"
    },
    careerVibe: {
      ko: "지식재산권(IP) 기획자, IT/AI 테크 컨설턴트, 심리 전문가, 미디어 기획 연출가, 프리랜서 전문 컨설턴트 등 두뇌와 직관을 자산화하는 지적 크리에이티브 업종이 가장 잘 맞습니다.",
      en: "Highly suited for intellectual property (IP) developers, AI/tech consultants, mental health experts, media showrunners, and top-tier independent advisors.",
      ja: "知的財産(IP)プランナー、IT/AI技術コンサルタント、心理学者、メディア企画ディレクター、フリーランスコンサルタントなど無形知識資産を扱う仕事が合います.",
      zh: "极适合前沿人工智能(AI)技术咨询师、知识产权(IP)操盘手、高级临床心理咨询专家、王牌综艺与电影制片人、或自由创意内容战略家。"
    }
  }
];

// Dropdown translation mappings
const TRANSLATIONS = {
  year: { ko: "년", en: "Year", ja: "年", zh: "年" },
  month: { ko: "월", en: "Month", ja: "月", zh: "月" },
  day: { ko: "일", en: "Day", ja: "日", zh: "日" },
  hour: { ko: "시", en: "Hour", ja: "時", zh: "时" },
  dayMaster: { ko: "일간", en: "Day Master", ja: "日干", zh: "日元" },
  sajuPillars: {
    hour: { ko: "시주", en: "Hour", ja: "時柱", zh: "时柱" },
    day: { ko: "일주", en: "Day", ja: "日柱", zh: "日柱" },
    month: { ko: "월주", en: "Month", ja: "月柱", zh: "月柱" },
    year: { ko: "연주", en: "Year", ja: "年柱", zh: "年柱" }
  }
};

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

interface GuardianStar {
  id: string;
  emoji: string;
  name: Record<string, string>;
  subtitle: Record<string, string>;
  desc: Record<string, string>;
}

const GUARDIAN_STARS: Record<string, GuardianStar> = {
  yeokma: {
    id: "yeokma",
    emoji: "🐎",
    name: {
      ko: "역마살 (Traveler Star)",
      en: "🐎 Yeokma Star (The Eternal Wanderer)",
      ja: "🐎 駅馬殺 (永遠の放浪者)",
      zh: "🐎 驿马星 (天生无疆行者)"
    },
    subtitle: {
      ko: "글로벌 활동력과 무한한 탐험가적 기질",
      en: "Global Activity & Infinite Explorer Spirit",
      ja: "グローバルな活動力と無限の探検家気質",
      zh: "纵横四海的移动磁场与探险天赋"
    },
    desc: {
      ko: "지평선 너머 미지의 영역으로 끊임없이 이동하는 야생마의 강렬한 활동 에너지를 상징합니다. 한곳에 머무르기보다 전 세계의 숨겨진 장소들을 개척하고 끊임없이 이동하며 새로운 자극과 사람들을 만날 때 운이 비약적으로 트이며 큰 성공을 거두는 축복받은 글로벌 노마드 스타입니다.",
      en: "Symbolizes the wild stallion galloping past horizons into unknown territories. Instead of staying in one place, you thrive by traveling globally, exploring hidden alleys, and embracing change. Your ultimate financial and life success unlocks seamlessly when you move, making you a blessed global nomad.",
      ja: "地平線を超えて未知の領域に絶えず移動する野生の馬の強烈な活動エネルギーを象徴しています。一箇所に滞在するよりも、世界中の隠された場所を開拓し、絶えず移動し、新しい刺激と人々に会うとき、運が飛躍的になり、大きな成功を収める祝福されたグローバルノーマドスターです。",
      zh: "象征着狂奔越过地平线、向未知领域进发的狂野骏马. 相比安分守己，你更适合在世界各个角落穿梭，开拓隐秘的旅行线路. 每当你的脚步在移动，你的财富与贵人运势就会呈爆发式上升，是天赐的全球化游牧之星。"
    }
  },
  dohwa: {
    id: "dohwa",
    emoji: "✨",
    name: {
      ko: "도화살 (Peach Blossom Charm)",
      en: "✨ Dohwa Star (Peach Blossom Attraction)",
      ja: "✨ 桃花殺 (人々を魅了する星)",
      zh: "✨ 桃花星 (绝代风华万人迷)"
    },
    subtitle: {
      ko: "사람들을 자석처럼 끌어당기는 치명적 매력",
      en: "Irresistible Magnetic Aura & Star Quality",
      ja: "磁石のように人々を惹きつける致命的な魅力",
      zh: "磁铁般吸引人心的致命风华与社交魅力"
    },
    desc: {
      ko: "향기로운 복사꽃처럼 남녀노소 불문하고 주변 사람들을 자석처럼 끌어당겨 사랑받게 만드는 치명적인 매력의 스타입니다. 특별히 노력하지 않아도 눈빛, 미소, 목소리 자체에서 독특한 색채와 매력이 뿜어져 나와 어디서나 주인공이 되며, 대중을 매료시키는 예술, SNS, 마케팅, 글로벌 네트워킹 분야에서 최고의 강점을 발휘합니다.",
      en: "Like highly aromatic peach blossoms in full bloom, you possess a magnetic charm that draws people to you naturally. Even without trying, your gaze, voice, or laughter radiates an inviting star quality. You are destined to shine in front of crowds, excelling in marketing, social networking, arts, and dynamic self-branding.",
      ja: "香りの良い桃の花のように、老若男女問わず周囲の人々を磁石のように惹きつけて愛される致命的な魅力の星です. 特段の努力をしなくても、眼差し、笑顔、声自体から独特の色彩と魅力が溢れ出てどこでも主人公になり、大衆を魅了する芸術, SNS, マーケティング, グローバルネットワーク分野で最高の強みを発揮します.",
      zh: "如同春日里盛放的娇艳桃花，自带一种让人心甘情愿为你倾倒的极致磁场. 无需刻意迎合，你的一颦一笑、举手投足间都会自然散发出独特的感性光芒. 极易成为社交或工作场合的焦点，在个人IP、创意营销、全球社交与时尚艺术领域具有所向庇靡的顶级红利。"
    }
  },
  hwagae: {
    id: "hwagae",
    emoji: "🎨",
    name: {
      ko: "화개살 (Artistic Insight Star)",
      en: "🎨 Hwagae Star (Deep Artistic Soul)",
      ja: "🎨 華蓋殺 (芸術と高いインサイトの星)",
      zh: "🎨 华盖星 (孤高深邃的艺术巨匠)"
    },
    subtitle: {
      ko: "깊은 통찰력, 예술적 재능과 신비한 매력",
      en: "Deep Philosophical Insight & Creative Brilliance",
      ja: "深い洞察力、芸術的才能と神秘的な魅力",
      zh: "超凡脱俗的洞察力、创意灵感与神秘气场"
    },
    desc: {
      ko: "아름다운 예술적 향기와 심오한 정신세계의 깊이를 상징하는 고귀한 스타입니다. 사물의 본질을 꿰뚫어 보는 탁월한 통찰력과 직관을 타고났으며, 문학, 미술, 디자인, 기획, 학문 등 고도의 정신적 고부가가치를 창출하는 창작 활동에서 대가의 반열에 오를 수 있는 재능을 뜻합니다. 차분하면서도 속 깊은 신비로운 아우라가 최고의 매력입니다.",
      en: "Symbolizes a highly elegant artistic aura and deep spiritual depth. Blessed with powerful intuition and a unique ability to read the hidden patterns of life, you excel in literature, design, high-level planning, or deep studies. Your quiet, highly intellectual mystery is a quiet magnetic force that commands deep respect from others.",
      ja: "美しい芸術的な香りと深遠な精神世界の深さを象徴する高貴な星です. 物事の本質を見抜く卓越した洞察力と直感を生まれ持っており、文学、美術、デザイン、企画、学問など高度な精神的価値を生み出す創作活動で第一人者になれる才能を意味します. 落ち着いていながらも奥深い神秘的なオーラが最大の魅力です.",
      zh: "象征着华丽艺术才华与深邃精神世界的尊贵星辰. 天生具备看透世事本质的卓越直觉与慧根，在文学创作、美学视觉、顶层设计、高级研发或哲学咨询等需要极高精神维度与灵感爆发的领域中，极易成为一代大师. 这种安静而超凡脱俗的神秘感，是你最致命的知性杀手锏。"
    }
  }
};

const TEN_GODS_INFO: Record<string, { name: Record<string, string>; vibe: Record<string, string> }> = {
  비겁: {
    name: { ko: "비겁 (Self-Will & Drive)", en: "Self-Will & Drive (Bi-Gyeop)", ja: "比劫 (自己意志と推進力)", zh: "比劫 (自尊自强与主观能动性)" },
    vibe: {
      ko: "강한 독립심과 주체적 의지, 타인에게 휘둘리지 않는 자아성찰을 뜻합니다.",
      en: "Represents strong independence, absolute self-reliance, and refusal to be swayed by others.",
      ja: "強い独立心と主体的な意志、他人に振り回されない主体性を意味します.",
      zh: "象征强大的独立自尊心、坚韧不拔的意志力以及不随波逐流的自主性。"
    }
  },
  식상: {
    name: { ko: "식상 (Expressive-Charm)", en: "Expressive-Charm & Talent (Sik-Sang)", ja: "食傷 (自己表現と魅力の才能)", zh: "食伤 (艺术灵感与才华表达)" },
    vibe: {
      ko: "치명적인 매력 표출, 풍부한 창의력, 부드러운 화술과 뛰어난 표현 재능을 뜻합니다.",
      en: "Represents natural charisma, creative expression, superb communication, and sensual artistic talent.",
      ja: "致命的な魅力の表出、豊かな創意工夫、柔らかな話術と優れた表現才能を意味します.",
      zh: "代表极具感染力的个人魅力、旺盛的创意思维、流利的表达艺术与才华释放。"
    }
  },
  재성: {
    name: { ko: "재성 (Wealth-Execution)", en: "Wealth-Execution & Assets (Jae-Seong)", ja: "財星 (資産の運用と実行力)", zh: "财星 (财富运作与务实行动力)" },
    vibe: {
      ko: "탁월한 시장 감각, 철저한 실행력, 결과 중심적 사업 및 자산 관리 재능을 뜻합니다.",
      en: "Represents superb market sense, impeccable execution, asset building, and result-oriented drive.",
      ja: "卓越した市場感覚、徹底した実行力、結果中心のビジネスおよび資産運用才能を意味します.",
      zh: "象征敏锐的商业嗅觉、高超的资源整合手段以及以结果为导向的财富打理天赋。"
    }
  },
  관성: {
    name: { ko: "관성 (Career-Discipline)", en: "Career-Discipline & Honor (Gwan-Seong)", ja: "官星 (社会的ステータスと規律力)", zh: "官星 (职业声誉与自律领导力)" },
    vibe: {
      ko: "책임감 있는 리더십, 조직 내 명예, 규칙 준수와 확실한 커리어 행정력을 뜻합니다.",
      en: "Represents responsible leadership, organizational honor, self-discipline, and strong career power.",
      ja: "責任感のあるリーダーシップ、組織内での名誉、ルールの遵守と確かなキャリア管理力を意味します.",
      zh: "代表极强的社会责任感、职场声誉、出色的组织管理力与高度的自律精神。"
    }
  },
  인성: {
    name: { ko: "인성 (Wisdom-Academic)", en: "Wisdom-Academic & Learning (In-Seong)", ja: "印星 (知恵、学びとドキュメント運)", zh: "印星 (深邃智慧与学术文化底蕴)" },
    vibe: {
      ko: "깊은 지혜와 학습 능력, 높은 문서적 라이선스 자산과 타인의 공감 및 서포트 수용력을 뜻합니다.",
      en: "Represents deep wisdom, learning excellence, license/IP acquisition, and receipt of support.",
      ja: "深い知恵と学習能力、高いライセンス資産と他者からの共感・サポート力などを意味します.",
      zh: "象征深沉的求知欲、严谨的学术与思考力、极高的名誉资质（IP）与吸纳贵人助力之气。"
    }
  }
};

const TEN_GODS_CAREERS: Record<string, Record<string, string>> = {
  비겁: {
    ko: "🎯 [1인 비즈니스 및 자기 주도형 천직] 독립성이 강력하여 상사의 간섭이 적고 스스로 결정권을 갖는 1인 창업가, 전문직 프리랜서, 개인 크리에이터, 혹은 본인의 페이스대로 독자 추진하는 프로젝트 디렉터 직군에서 최고의 능력을 발휘합니다.",
    en: "🎯 [Independent Creator & Solo Entrepreneur] With exceptional self-drive, you thrive best in positions with absolute autonomy. You make a perfect solo startup founder, specialized freelancer, content creator, or independent project architect.",
    ja: "🎯[1人ビジネスおよび自己主導型天職]独立性が強力で、上司の干渉が少なく、自ら決定権を持つ1人創業者、専門職フリーランサー、個人クリエイター、あるいは本人のペースで独自に推進するプロジェクトディレクター職群で最高の能力を発揮します。",
    zh: "🎯【单人创业，自主事业】独立性强，可以展现自己作为个人创业者、职业自由职业者、个人创作者或项目总监的最佳能力，按照自己的步调独立追求事物，很少受到上级的干扰，有自己做决定的权利。"
  },
  식상: {
    ko: "🎨 [예술 크리에이티브 및 트렌드 기획 천직] 아이디어와 표현력이 무궁무진하여 무에서 유를 창출하는 제품 디자이너, 콘텐츠 연출가, 마케팅 총괄 디렉터, 요식 F&B 기획자, 혹은 대중과 밀접히 소통하는 영업 카운셀러에서 최고의 스타가 됩니다.",
    en: "🎨 [Creative Creator & Trend Director] Blessed with endless ideas and expression, you excel in creating value from scratch. You shine as a product designer, content director, creative marketer, global F&B curator, or high-touch consultant.",
    ja: "🎨 [芸術クリエイティブとトレンド企画天職] アイデアと表現力が無関心で大根でゆうを創出する製品デザイナー、コンテンツ演出家、マーケティング総括ディレクター、食料F&B企画者、あるいは大衆と密接にコミュニケーションする営業カウンセラーで最高のスターになります。",
    zh: "🎨【艺术创意与潮流策划职业】拥有无尽的创意和表现力，你可以成为白手起家的产品设计师、内容总监、营销总监、餐厅餐饮策划师、与大众密切沟通的销售顾问等顶级明星。"
  },
  재성: {
    ko: "💰 [자산 관리 및 결과 실행형 비즈니스 천직] 시장의 흐름과 자금 유입의 냄새를 맡는 직관이 탁월합니다. 벤처 투자 애널리스트, 기업 재무 총괄(CFO), 실질적 유통 물류 사업가, 혹은 부동산 개발 전문가처럼 결과를 즉각 실현해내는 사업 경영직이 완벽히 어울립니다.",
    en: "💰 [Asset Builder & Result-Driven Entrepreneur] You have a golden instinct for financial flows. You excel as a venture capitalist, Chief Financial Officer (CFO), macro logistics entrepreneur, or high-level real estate developer.",
    ja: "💰 [資産管理＆実行力重視のビジネス天職] 市場の流れと金運の嗅覚が卓越しています。ベンチャー投資アナリスト、CFO、流通物流実業家、または不動産専門家などの数値と決定を扱う経営ポジション。",
    zh: "💰【资产管理和结果导向的商业职业】对市场趋势和资金流入有出色的直觉。立即见效的企业管理职位，如风险投资分析师、企业财务主管（CFO）、实用的分销物流商人或房地产开发专家，都是完美的选择。"
  },
  관성: {
    ko: "👑 [공공 기관, 대기업 임원 및 조직 총괄 천직] 강한 책임감과 자율 규율력을 가졌습니다. 공무원 고위직, 글로벌 대기업의 핵심 본부장, 법률 수사관, 공적 감독관, 혹은 의료계의 의사결정권자처럼 확실한 위계와 신뢰가 보장된 조직의 리더로 대성합니다.",
    en: "👑 [Corporate Executive & Public Administration] Blessed with high organization and responsibility, you excel in structured systems. You shine as a high-ranking public official, key corporate director, legal prosecutor, auditor, or clinical leader.",
    ja: "👑 [官公庁、大企業重役＆組織マネジメントの天職] 強い責任感と自己制御力がすごいです。公務員高位職、グローバル企業本部長、裁判所、監査、あるいは臨床および医療リーダーなど体系の中でリーダーシップを発揮する席。",
    zh: "👑【政府的高标准，驾驭光明的能力，光明的胸怀。在高级公职人员、大公司高管、法官、审计员或关键领导职位中展现出强有力的领导力。"
  },
  인성: {
    ko: "📚 [연구 컨설팅, 지식재산권(IP) 및 교육 현자 천직] 깊은 사고력과 학습 능력을 갖춘 학자 스타일입니다. AI/IT 연구원, 특허 라이선스 관리 전문가, 심리 치료 전문가, 대학교수 및 교육 컨설턴트, 혹은 전문 저술가 분야에서 평생 마르지 않는 지적 부를 쌓습니다.",
    en: "📚 [Academic Fellow, IP Developer & Strategic Advisor] A natural scholar with deep thinking and wisdom. You thrive as an R&D AI researcher, IP/patent attorney, psychologist, university professor, strategic educator, or expert writer.",
    ja: "📚 [研究コンサルティング＆知的財産（IP）・教育の天職] 深い思考力と学習能力を備えた学者基質です。研究員、ライセンス専門家、心理相談セラピスト、教授、専門著述家など無形知識を創造し、助言する分野。",
    zh: "📚【深度研发与知识产权（IP）决策天职】头脑空虚，知识空虚。 极适合AI/IT核心研究人员、专利授权专家、心理治疗师、教授、专业作家等创造智力价值的创意和咨询领域。"
  }
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
  const { toast } = useToast();
  const { user } = useAuth();
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lang = (i18n.language?.split('-')[0] || 'ko').toLowerCase();
  const hasHydratedBirthInfoRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    window.dispatchEvent(new CustomEvent("migo:ad-overlay", { detail: { active: true } }));
    return () => {
      window.dispatchEvent(new CustomEvent("migo:ad-overlay", { detail: { active: false } }));
    };
  }, [isOpen]);

  // 입력 필드들
  const [year, setYear] = useState<string>("1995");
  const [month, setMonth] = useState<string>("5");
  const [day, setDay] = useState<string>("24");
  const [hour, setHour] = useState<string>("14");
  const [calendarType, setCalendarType] = useState<"solar" | "lunar">("solar");
  
  const [activeTab, setActiveTab] = useState<"pillars" | "personality" | "love" | "wealth" | "travel">("pillars");
  const [isCalculated, setIsCalculated] = useState<boolean>(false);
  const [isRewardAdLoading, setIsRewardAdLoading] = useState(false);
  const [calculationResult, setCalculationResult] = useState<{
    yearPillar: { stem: StemData; branch: BranchData };
    monthPillar: { stem: StemData; branch: BranchData };
    dayPillar: { stem: StemData; branch: BranchData };
    hourPillar: { stem: StemData; branch: BranchData } | null;
  } | null>(null);

  const selectResultTab = (tab: "pillars" | "personality" | "love" | "wealth" | "travel") => {
    if (!isCalculated) return;
    triggerHaptic("light");
    setActiveTab(tab);
  };

  // Load saved birth info only when the modal opens. Saving an analysis updates
  // savedBirthInfo from the parent, and resetting here would hide the result.
  useEffect(() => {
    if (!isOpen) {
      hasHydratedBirthInfoRef.current = false;
      return;
    }

    if (hasHydratedBirthInfoRef.current) return;
    hasHydratedBirthInfoRef.current = true;

    if (savedBirthInfo) {
      setYear(savedBirthInfo.year || "1995");
      setMonth(savedBirthInfo.month || "5");
      setDay(savedBirthInfo.day || "24");
      setHour(savedBirthInfo.hour !== undefined ? String(savedBirthInfo.hour) : "14");
      setCalendarType(savedBirthInfo.calendarType || "solar");
    }

    setActiveTab("pillars");
    setCalculationResult(null);
    setIsCalculated(false);
  }, [isOpen, savedBirthInfo]);

  // ── 육십갑자 만세력 수학적 공식 연산 엔진 ──
  const runSajuCalculation = () => {
    const yr = parseInt(year);
    const mo = parseInt(month);
    const dy = parseInt(day);
    const hr = hour === "unknown" ? 12 : parseInt(hour);

    if (
      Number.isNaN(yr) ||
      Number.isNaN(mo) ||
      Number.isNaN(dy) ||
      Number.isNaN(hr) ||
      mo < 1 ||
      mo > 12 ||
      dy < 1 ||
      dy > 31 ||
      hr < 0 ||
      hr > 23
    ) {
      throw new Error("Invalid birth date input");
    }

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
    triggerHaptic("medium");
    try {
      const result = runSajuCalculation();
      const master = result.dayPillar.stem;
      setCalculationResult(result);
      const info = {
        year,
        month,
        day,
        hour,
        calendarType,
        sajuCompleted: true,
        sajuProfile: {
          dayMaster: {
            hanja: master.hanja,
            korean: master.korean,
            element: master.element,
            emoji: master.emoji,
            title: master.title,
            desc: master.desc,
            travelVibe: master.travelVibe,
            loveVibe: master.loveVibe,
            wealthVibe: master.wealthVibe,
            charmVibe: master.charmVibe,
            careerVibe: master.careerVibe,
          },
          pillars: {
            year: `${result.yearPillar.stem.hanja}${result.yearPillar.branch.hanja}`,
            month: `${result.monthPillar.stem.hanja}${result.monthPillar.branch.hanja}`,
            day: `${result.dayPillar.stem.hanja}${result.dayPillar.branch.hanja}`,
            hour: result.hourPillar ? `${result.hourPillar.stem.hanja}${result.hourPillar.branch.hanja}` : null,
          },
          updatedAt: new Date().toISOString(),
        }
      };
      onSaveBirthInfo(info);
      setIsCalculated(true);
    } catch (error) {
      console.error("[Saju] calculation failed", error);
      setCalculationResult(null);
      setIsCalculated(false);
      toast({
        title: t("saju.calculateFail", "분석을 완료하지 못했습니다."),
        description: t("saju.calculateFailDesc", "생년월일을 다시 확인한 뒤 시도해주세요."),
        variant: "destructive",
      });
    }
  };

  const handleCalculateWithRewardAd = async () => {
    if (isRewardAdLoading) return;
    setIsRewardAdLoading(true);
    try {
      handleCalculate();
    } finally {
      setIsRewardAdLoading(false);
    }
  };

  const resetCalculation = () => {
    setIsCalculated(false);
    setCalculationResult(null);
  };

  const generateSajuStoryCard = async () => {
    if (!user || !calculationResult) return;
    setShowCardModal(true);
    setCardImage(null);

    setTimeout(async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = 1080;
      canvas.height = 1920;

      // 1. Fetch user profile data to get referral code, photo url, etc.
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, photo_url, nationality, referral_code")
        .eq("id", user.id)
        .single();

      const refCode = profile?.referral_code || "MIGO-VIP";

      // 2. Define colors based on Saju element
      const elem = calculationResult.dayPillar.stem.element;
      let startColor = "#4f46e5"; // default Indigo
      let endColor = "#ec4899"; // default Pink
      let elementHanja = "木";
      
      const elemTextMap = {
        wood: { ko: "목 (Wood)", en: "Wood", ja: "木 (Wood)", zh: "木 (Wood)" },
        fire: { ko: "화 (Fire)", en: "Fire", ja: "火 (Fire)", zh: "火 (Fire)" },
        earth: { ko: "토 (Earth)", en: "Earth", ja: "土 (Earth)", zh: "土 (Earth)" },
        metal: { ko: "금 (Metal)", en: "Metal", ja: "金 (Metal)", zh: "金 (Metal)" },
        water: { ko: "수 (Water)", en: "Water", ja: "水 (Water)", zh: "水 (Water)" },
      };
      const elementKorean = elemTextMap[elem as StemData["element"]]?.[lang] || elemTextMap[elem as StemData["element"]]?.ko || "Wood";
      
      if (elem === "wood") {
        startColor = "#064e3b"; // emerald-900
        endColor = "#10b981"; // emerald-500
        elementHanja = "木";
      } else if (elem === "fire") {
        startColor = "#7f1d1d"; // rose-950
        endColor = "#f43f5e"; // rose-500
        elementHanja = "火";
      } else if (elem === "earth") {
        startColor = "#78350f"; // amber-950
        endColor = "#f59e0b"; // amber-500
        elementHanja = "土";
      } else if (elem === "metal") {
        startColor = "#164e63"; // cyan-950
        endColor = "#06b6d4"; // cyan-500
        elementHanja = "金";
      } else if (elem === "water") {
        startColor = "#0f172a"; // slate-900
        endColor = "#3b82f6"; // blue-500
        elementHanja = "水";
      }

      // 3. Draw gradient background
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, startColor);
      grad.addColorStop(1, endColor);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 4. Draw background decorative circles
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.beginPath();
      ctx.arc(200, 300, 350, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(canvas.width - 200, canvas.height - 400, 450, 0, Math.PI * 2);
      ctx.fill();

      // 5. App Logo
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 90px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("M I G O", canvas.width / 2, 220);

      // Subtitle
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.font = "bold 38px sans-serif";
      ctx.fillText("Traditional K-Saju Travel Destiny", canvas.width / 2, 330);

      // 6. Draw Card Window (Glassmorphic Container)
      const cardX = 90;
      const cardY = 440;
      const cardW = canvas.width - (cardX * 2);
      const cardH = 1060;
      const radius = 50;

      ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
      ctx.beginPath();
      ctx.moveTo(cardX + radius, cardY);
      ctx.lineTo(cardX + cardW - radius, cardY);
      ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + radius);
      ctx.lineTo(cardX + cardW, cardY + cardH - radius);
      ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - radius, cardY + cardH);
      ctx.lineTo(cardX + radius, cardY + cardH);
      ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - radius);
      ctx.lineTo(cardX, cardY + radius);
      ctx.quadraticCurveTo(cardX, cardY, cardX + radius, cardY);
      ctx.closePath();
      ctx.fill();

      // 7. Avatar drawing
      const avatarX = canvas.width / 2;
      const avatarY = cardY + 180;
      const avatarR = 110;

      const drawAvatar = (imageObj?: HTMLImageElement) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        if (imageObj) {
          ctx.drawImage(imageObj, avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
        } else {
          ctx.fillStyle = "#6366f1";
          ctx.fillRect(avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 90px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(profile?.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "M", avatarX, avatarY);
        }
        ctx.restore();

        // Border
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
        ctx.stroke();
      };

      if (profile?.photo_url) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          drawAvatar(img);
          drawCardDetails();
        };
        img.onerror = () => {
          drawAvatar();
          drawCardDetails();
        };
        img.src = profile.photo_url;
      } else {
        drawAvatar();
        drawCardDetails();
      }

      function drawCardDetails() {
        // Name & Title
        ctx.fillStyle = "#0f172a"; // slate-900
        ctx.font = "bold 56px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(profile?.name || "Traveler", canvas.width / 2, cardY + 330);

        // Element Badge
        ctx.fillStyle = "#475569"; // slate-600
        ctx.font = "bold 34px sans-serif";
        ctx.fillText(`일간: ${calculationResult.dayPillar.stem.title[lang] || calculationResult.dayPillar.stem.title.ko}`, canvas.width / 2, cardY + 395);

        // Draw Saju Pillars Box
        const gridX = cardX + 50;
        const gridY = cardY + 450;
        const gridW = cardW - 100;
        const gridH = 220;

        ctx.fillStyle = "#f8fafc"; // slate-50
        ctx.strokeStyle = "#e2e8f0"; // slate-200
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(gridX, gridY, gridW, gridH);
        ctx.fill();
        ctx.stroke();

        // Pillars Text Drawing
        const pColW = gridW / 4;
        const pHeaders = ["시주 (Time)", "일주 (Day)", "월주 (Month)", "연주 (Year)"];
        const pStems = [
          calculationResult.hourPillar?.stem,
          calculationResult.dayPillar.stem,
          calculationResult.monthPillar.stem,
          calculationResult.yearPillar.stem
        ];
        const pBranches = [
          calculationResult.hourPillar?.branch,
          calculationResult.dayPillar.branch,
          calculationResult.monthPillar.branch,
          calculationResult.yearPillar.branch
        ];

        for (let i = 0; i < 4; i++) {
          const colX = gridX + pColW * i + pColW / 2;
          
          // Header
          ctx.fillStyle = "#64748b"; // slate-500
          ctx.font = "bold 26px sans-serif";
          ctx.fillText(pHeaders[i].split(" ")[0], colX, gridY + 45);

          const stem = pStems[i];
          const branch = pBranches[i];

          if (!stem || !branch) {
            ctx.fillStyle = "#94a3b8";
            ctx.font = "bold 28px sans-serif";
            ctx.fillText("-", colX, gridY + 110);
            ctx.fillText("-", colX, gridY + 170);
            continue;
          }

          // Stem Hanja & Korean
          ctx.fillStyle = "#1e293b";
          ctx.font = "bold 34px sans-serif";
          const stemName = (STEM_TRANSLATIONS[stem.hanja] || {})[lang] || stem.hanja;
          ctx.fillText(`${stem.hanja}(${stemName})`, colX, gridY + 110);

          // Branch Hanja & Korean & Animal
          ctx.fillStyle = "#475569";
          ctx.font = "bold 32px sans-serif";
          const branchName = (BRANCH_TRANSLATIONS[branch.hanja] || {})[lang] || branch.hanja;
          ctx.fillText(`${branch.hanja}(${branchName}${branch.animal})`, colX, gridY + 175);
        }

        // Charm description (Text wrapping)
        ctx.fillStyle = "#334155"; // slate-700
        ctx.font = "normal 32px sans-serif";
        ctx.textAlign = "center";
        
        const textToWrap = calculationResult.dayPillar.stem.charmVibe[lang] || calculationResult.dayPillar.stem.charmVibe.ko;
        const maxTextWidth = cardW - 120;
        const startTextY = cardY + 740;
        const lineHeight = 46;

        // Custom wrapping function helper
        let line = "";
        let currentY = startTextY;
        for (let i = 0; i < textToWrap.length; i++) {
          let char = textToWrap[i];
          let testLine = line + char;
          let testWidth = ctx.measureText(testLine).width;
          if (testWidth > maxTextWidth && i > 0) {
            ctx.fillText(line, canvas.width / 2, currentY);
            line = char;
            currentY += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, canvas.width / 2, currentY);

        // Lucky items at the bottom of white box
        const luckyY = cardY + 970;
        ctx.fillStyle = "#6366f1"; // primary-indigo
        ctx.font = "bold 32px sans-serif";
        
        let luckyCities = "";
        if (elem === "wood") luckyCities = "Kyoto 🌲, Portland 🏔️";
        else if (elem === "fire") luckyCities = "Tokyo 🗼, Las Vegas 🎰";
        else if (elem === "earth") luckyCities = "Seoul 🏰, Rome 🏛️";
        else if (elem === "metal") luckyCities = "New York 🗽, Paris 🗼";
        else luckyCities = "Okinawa 🌊, Venice ⛵";

        ctx.fillText(
          {
            ko: `🍀 행운의 매칭: ${elementKorean}  |  ✈️ 추천 도시: ${luckyCities}`,
            en: `🍀 Lucky Match: ${elementKorean}  |  ✈️ Recommended: ${luckyCities}`,
            ja: `🍀 幸運の要素: ${elementKorean}  |  ✈️ おすすめの都市: ${luckyCities}`,
            zh: `🍀 幸运五行: ${elementKorean}  |  ✈️ 推荐城市: ${luckyCities}`
          }[lang] || `🍀 Lucky Match: ${elementKorean}  |  ✈️ Recommended: ${luckyCities}`,
          canvas.width / 2,
          luckyY
        );

        // --- Bottom Area (Black Card Background) ---
        // Referral Code Box
        const codeW = 660;
        const codeH = 130;
        const codeX = (canvas.width - codeW) / 2;
        const codeY = cardY + cardH + 70;
        const codeR = 30;

        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.rect(codeX, codeY, codeW, codeH);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 46px sans-serif";
        ctx.fillText(
          `${{ ko: "초대코드", en: "Referral Code", ja: "招待コード", zh: "邀请码" }[lang] || "Referral Code"}: ${refCode}`,
          canvas.width / 2,
          codeY + 65
        );

        // Call to action
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.font = "bold 38px sans-serif";
        ctx.fillText(
          {
            ko: "가입할 때 위 코드를 적으면 무료 슈퍼라이크 3개! 🎁",
            en: "Use this code to get 3 free Super Likes! 🎁",
            ja: "登録時にコード入力でスーパーライク3個無料！ 🎁",
            zh: "注册时填写邀请码即赠3个免费超级喜欢！ 🎁"
          }[lang] || "Use this code to get 3 free Super Likes! 🎁",
          canvas.width / 2,
          codeY + 200
        );

        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.font = "normal 30px sans-serif";
        ctx.fillText(
          {
            ko: "내 운명의 여행 동행, 지금 Migo 앱에서 만나보세요.",
            en: "Find your destiny travel buddy now in the Migo app.",
            ja: "運命の旅行パートナー、今すぐMigoアプリで探そう。",
            zh: "现在就在Migo应用里，邂逅你的命中注定旅伴。"
          }[lang] || "Find your destiny travel buddy now in the Migo app.",
          canvas.width / 2,
          codeY + 270
        );

        // Convert canvas to image url
        setCardImage(canvas.toDataURL("image/png"));
      }
    }, 150);
  };

  const handleDownloadCard = () => {
    if (!cardImage) return;
    const link = document.createElement("a");
    link.download = `migo_saju_fate_${user?.id || 'guest'}.png`;
    link.href = cardImage;
    link.click();
    toast({
      title: t("invite.downloadSuccess", "Image saved to gallery! 📸"),
      duration: 3000,
    });
  };

  const handleCopyInviteLink = () => {
    if (!user) return;
    const link = `${window.location.origin}/login?ref=${user.id}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast({
      title: t("invite.copied", "Copied to clipboard! 📋"),
      duration: 2000,
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

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

  // 지지의 수호 신살(神煞) 계산
  const getActiveStars = () => {
    if (!calculationResult) return [];
    const activeBranches = [
      calculationResult.yearPillar.branch.hanja,
      calculationResult.monthPillar.branch.hanja,
      calculationResult.dayPillar.branch.hanja,
      calculationResult.hourPillar ? calculationResult.hourPillar.branch.hanja : null
    ].filter(Boolean) as string[];

    const hasYeokma = activeBranches.some(b => ["寅", "申", "巳", "亥"].includes(b));
    const hasDohwa = activeBranches.some(b => ["子", "午", "卯", "酉"].includes(b));
    const hasHwagae = activeBranches.some(b => ["辰", "戌", "丑", "未"].includes(b));

    const stars = [];
    if (hasDohwa) stars.push(GUARDIAN_STARS.dohwa);
    if (hasYeokma) stars.push(GUARDIAN_STARS.yeokma);
    if (hasHwagae) stars.push(GUARDIAN_STARS.hwagae);
    if (stars.length === 0) {
      stars.push(GUARDIAN_STARS.dohwa); // 지지의 억제 없는 매력 부여
    }
    return stars;
  };

  const activeStars = getActiveStars();

  // 지지 및 천간의 십신(十神) 분포 계산
  const getTenGodsCategory = (dmEl: string, targetEl: string): "비겁" | "식상" | "재성" | "관성" | "인성" => {
    const elements = ["wood", "fire", "earth", "metal", "water"];
    const dmIdx = elements.indexOf(dmEl);
    const targetIdx = elements.indexOf(targetEl);
    const diff = (targetIdx - dmIdx + 5) % 5;
    
    if (diff === 0) return "비겁";
    if (diff === 1) return "식상";
    if (diff === 2) return "재성";
    if (diff === 3) return "관성";
    return "인성";
  };

  const getTenGodsDistribution = () => {
    if (!calculationResult) return { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
    const dmEl = calculationResult.dayPillar.stem.element;
    const dist = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };

    const addPillar = (pillar: any) => {
      if (!pillar) return;
      dist[getTenGodsCategory(dmEl, pillar.stem.element)]++;
      dist[getTenGodsCategory(dmEl, pillar.branch.element)]++;
    };

    addPillar(calculationResult.yearPillar);
    addPillar(calculationResult.monthPillar);
    addPillar(calculationResult.dayPillar);
    addPillar(calculationResult.hourPillar);

    return dist;
  };

  const tenGodsDistribution = getTenGodsDistribution();

  const getDominantTenGods = () => {
    return (Object.entries(tenGodsDistribution) as Array<["비겁" | "식상" | "재성" | "관성" | "인성", number]>)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "비겁";
  };

  const dominantTenGods = getDominantTenGods();

  const getDetailedSajuSections = () => {
    if (!dayMaster) return null;

    const elementLabel: Record<StemData["element"], Record<string, string>> = {
      wood: { ko: "목(木)", en: "Wood(木)", ja: "木(木)", zh: "木(木)" },
      fire: { ko: "화(火)", en: "Fire(火)", ja: "火(火)", zh: "火(火)" },
      earth: { ko: "토(土)", en: "Earth(土)", ja: "土(土)", zh: "土(土)" },
      metal: { ko: "금(金)", en: "Metal(金)", ja: "金(金)", zh: "金(金)" },
      water: { ko: "수(水)", en: "Water(水)", ja: "水(水)", zh: "水(水)" },
    };

    const elementTone: Record<StemData["element"], {
      personality: Record<string, string>[];
      love: Record<string, string>[];
      wealth: Record<string, string>[];
      travel: Record<string, string>[];
    }> = {
      wood: {
        personality: [
          {
            ko: "성장 욕구가 강해서 정체된 관계나 반복 업무보다, 스스로 방향을 세우고 넓혀가는 환경에서 빛납니다.",
            en: "Highly driven by growth; you shine in environments where you can set your own direction and expand, rather than in stagnant relationships or repetitive work.",
            ja: "成長意欲が強く、停滞した関係や繰り返しの業務より、自ら方向性を立てて広げていく環境で輝きます。",
            zh: "成长欲望强烈；比起停滞的关系或重复的工作，在能够自己设定方向并不断扩展的环境中更显耀眼。"
          },
          {
            ko: "겉으로는 담백해 보여도 기준이 분명하고, 한번 신뢰한 사람에게는 오래 책임지는 타입입니다.",
            en: "Although appearing simple on the outside, you have clear standards and take long-term responsibility for those you trust.",
            ja: "表面的には淡泊に見えても基準が明確で、一度信頼した人には長く責任を果たすタイプです。",
            zh: "外表看似平淡，但内心标准明确，一旦信任一个人，就会长期承担起责任。"
          },
          {
            ko: "고집이 강해 보일 수 있으니, 중요한 결정 전에는 상대가 이해할 시간을 주는 것이 매력을 더 크게 만듭니다.",
            en: "Since you can seem stubborn, giving others time to understand before making major decisions will make you much more charming.",
            ja: "こだわりが強く見えることがあるため、重要な決定の前には相手が理解する時間を与えることが、魅力をさらに高めます。",
            zh: "由于可能显得有些固执，在做重大决定前给对方理解的时间会让你更有魅力。"
          }
        ],
        love: [
          {
            ko: "연애에서는 보호자 기질이 강합니다. 말보다 행동으로 챙기는 방식이 자연스럽습니다.",
            en: "A strong protective instinct in romance; caring through actions rather than words comes naturally to you.",
            ja: "恋愛では保護者気質が強いです。言葉より行動で気遣う方法が自然です。",
            zh: "恋爱中具有强烈的保护者气质；比起言语，用行动来照顾对方对你来说更自然。"
          },
          {
            ko: "상대가 불안정하거나 우유부단하면 답답함을 느끼기 쉽지만, 함께 목표를 세우면 관계 몰입도가 높아집니다.",
            en: "You easily feel frustrated if your partner is unstable or indecisive, but setting goals together deepens your relationship commitment.",
            ja: "相手が不安定だったり優柔不断だと息苦しさを感じやすいですが、一緒に目標を立てると関係への没頭度が高まります。",
            zh: "如果对方不稳定或优柔寡断，你容易感到郁闷，但一旦共同制定目标，对感情的投入度就会提高。"
          },
          {
            ko: "좋은 궁합은 당신의 방향성을 존중하면서도 감정 표현을 부드럽게 열어주는 사람입니다.",
            en: "A great match is someone who respects your direction while gently encouraging you to express your emotions.",
            ja: "相性が良いのは、あなたの方向性を尊重しながらも、感情表現を優しく引き出してくれる人です。",
            zh: "最适合的伴侣是既能尊重你的方向，又能温柔地引导你表达情感的人。"
          }
        ],
        wealth: [
          {
            ko: "직접 판을 만들고 키우는 재물 흐름에 강합니다. 사업, 프로젝트 리딩, 브랜드 구축과 잘 맞습니다.",
            en: "Strong in creating and scaling your own financial playing field; well-suited for business, project leadership, and brand building.",
            ja: "自ら場を作り育てる財の流れに強いです。起業、プロジェクトのリード、ブランド構築とよく合います。",
            zh: "擅长自己搭建舞台并做大财富流；非常适合创业、项目主导和品牌建设。"
          },
          {
            ko: "초반에는 느려도 장기적으로 신뢰 자산이 쌓이면 크게 확장되는 구조가 유리합니다.",
            en: "Even if progress is slow at first, you benefit from a structure that scales massively once trust assets build up over time.",
            ja: "序盤は遅くても、長期的に信頼資産が積み重なると大きく拡張する構造が有利です。",
            zh: "起步阶段可能较慢，但长远来看，一旦积累起信用资产，就容易实现爆发式扩张。"
          },
          {
            ko: "혼자 다 짊어지려는 습관만 줄이면 팀과 자본을 끌어오는 힘이 커집니다.",
            en: "If you reduce the habit of carrying everything yourself, your power to attract teams and capital will grow significantly.",
            ja: "一人で全てを背負おうとする習慣を減らせば、チームと資本を引き寄せる力が大きくなります。",
            zh: "只要改掉独自承担一切的习惯，吸引团队和资本的力量就会大大增强。"
          }
        ],
        travel: [
          {
            ko: "숲, 오래된 도시, 큰 랜드마크처럼 스케일과 역사감이 있는 장소에서 에너지가 회복됩니다.",
            en: "Your energy is restored in places with scale and a sense of history, like forests, ancient cities, or grand landmarks.",
            ja: "森、古い都市、大きなランドマークのように、スケールと歴史感のある場所でエネルギーが回復します。",
            zh: "在森林、古城、大型地标等具有宏大尺度和历史感的地方，最能恢复你的能量。"
          },
          {
            ko: "즉흥 여행보다 목적이 있는 루트가 좋습니다. 정상, 박물관, 오래된 거리처럼 성취감이 남는 코스를 추천합니다.",
            en: "A purposeful route is better than spontaneous trips; courses that leave a sense of achievement, like mountain peaks, museums, and historic streets, are recommended.",
            ja: "即興の旅行より目的のあるルートが良いです。山頂、博物館、歴史ある通りなど、達成感が残るコースをおすすめします。",
            zh: "比起即兴旅行，有明确目的地的路线更佳；推荐能带给你成就感的路线，如登顶、参观博物馆或漫步古老街区。"
          }
        ],
      },
      fire: {
        personality: [
          {
            ko: "존재감과 표현력이 강해서 분위기를 바꾸는 힘이 있습니다. 사람들은 당신을 기억하기 쉽습니다.",
            en: "A strong presence and expressiveness allow you to change the atmosphere; people easily remember you.",
            ja: "存在感と表現力が強く、雰囲気を変える力があります。人々はあなたを覚えやすいです。",
            zh: "拥有强烈的存在感和表现力，能够带动气氛；人们很容易记住你。"
          },
          {
            ko: "감정이 빠르게 올라오는 만큼 호감도 빠르고, 흥미를 잃는 속도도 빠를 수 있습니다.",
            en: "As quickly as your emotions rise, you develop likeness fast, but you may also lose interest quickly.",
            ja: "感情が急速に高まる分、好感を持つのも早いですが、興味を失う速度も早いかもしれません。",
            zh: "感情升温得快，产生好感也快，但失去兴趣的速度可能也同样迅速。"
          },
          {
            ko: "지속력을 만들려면 즉흥적인 에너지에 루틴을 붙이는 것이 핵심입니다.",
            en: "The key to building sustainability is adding structured routines to your spontaneous energy.",
            ja: "持続力を生み出すには、即興的なエネルギーにルーティンを紐付けることが核心です。",
            zh: "若想获得持久力，关键是将日常习惯与即兴能量相结合。"
          }
        ],
        love: [
          {
            ko: "연애에서는 확신과 설렘을 중요하게 봅니다. 마음이 움직이면 숨기기보다 표현하는 쪽입니다.",
            en: "Valuing certainty and excitement in love; once your heart moves, you prefer expressing it over hiding it.",
            ja: "恋愛では確信とときめきを重視します。心が動けば、隠すより表現するタイプです。",
            zh: "恋爱中非常看重确定感与心动感；心动时比起隐藏，更倾向于直接表达。"
          },
          {
            ko: "단조로운 관계보다 함께 웃고 움직이고 경험을 만드는 관계에서 애정이 커집니다.",
            en: "Affection grows in relationships where you laugh, move, and build experiences together, rather than in monotonous ones.",
            ja: "単調な関係より、一緒に笑って動き、経験を創り出す関係で愛情が深まります。",
            zh: "比起平淡单调的关系，共同欢笑、共同行动、共同创造体验的关系更能让你的爱意加深。"
          },
          {
            ko: "상대가 당신의 열정을 부담이 아니라 활력으로 받아줄 때 오래 갑니다.",
            en: "Your relationship lasts long when your partner accepts your passion as vitality rather than a burden.",
            ja: "相手があなたの情熱を負担ではなく活力として受け止めてくれる時、長く続きます。",
            zh: "当对方把你的热情视为活力而非负担时，感情才能持久。"
          }
        ],
        wealth: [
          {
            ko: "사람들의 주목을 모으는 일, 콘텐츠, 마케팅, 세일즈, 퍼스널 브랜딩에서 수익 운이 살아납니다.",
            en: "Wealth fortune shines in areas that attract public attention: content creation, marketing, sales, and personal branding.",
            ja: "人々の注目を集める仕事、コンテンツ、マーケティング、セールス、パーソナルブランディングで収益運が活性化します。",
            zh: "在吸引人们注意力的工作、内容创作、营销、销售以及个人品牌塑造中，最容易盘活财运。"
          },
          {
            ko: "감각은 좋지만 소비도 빠를 수 있으니, 수입이 들어오는 즉시 자동 저축/투자 구조를 만들어야 합니다.",
            en: "While having great instincts, you might spend quickly; set up automatic savings/investment structures as soon as income arrives.",
            ja: "センスは良いですが消費も早いため、収入が入るや否や自動貯蓄・投資の仕組みを作る必要があります。",
            zh: "虽然直觉敏锐但消费也快，因此一有收入就应该建立自动储蓄或投资渠道。"
          },
          {
            ko: "당신의 얼굴, 말, 취향, 스토리가 곧 자산이 되는 타입입니다.",
            en: "You are the type whose face, voice, taste, and personal story serve as your main assets.",
            ja: "あなたの顔、言葉、好み、ストーリーがそのまま資産になるタイプです。",
            zh: "你是那种脸庞、言谈、品味和个人故事本身就能转化为资产的类型。"
          }
        ],
        travel: [
          {
            ko: "축제, 야경, 루프탑, 공연, 현지 모임처럼 생동감 있는 여행에서 만족도가 큽니다.",
            en: "High satisfaction in lively travel experiences, such as festivals, night views, rooftops, performances, or local meetups.",
            ja: "フェスティバル、夜景、ルーフトップ、公演、現地での集まりなど、躍動感のある旅行で満足度が大きいです。",
            zh: "在节日庆典、迷人夜景、天台酒吧、演出以及当地聚会等充满生机活力的旅行中满足感最强。"
          },
          {
            ko: "조용한 휴양만 오래 하면 금방 지루해질 수 있어 하루에 하나는 강한 하이라이트를 넣는 것이 좋습니다.",
            en: "Quiet retreats can quickly get boring; it is best to plan at least one strong highlight event per day.",
            ja: "静かな休養ばかりだとすぐに退屈してしまうため、一日に一つは強いハイライトを入れるのが良いでしょう。",
            zh: "如果只是长时间安静休养，容易感到枯燥，建议每天都安排一个亮眼的主题活动。"
          }
        ],
      },
      earth: {
        personality: [
          {
            ko: "안정감과 현실 감각이 강합니다. 주변 사람들은 당신에게 묵직한 신뢰를 느끼기 쉽습니다.",
            en: "Strong sense of stability and realism; people around you easily place deep trust in you.",
            ja: "安定感と現実感覚が強いです。周りの人はあなたに厚い信頼を感じやすいです。",
            zh: "具有强烈的稳定感和现实感；身边的人很容易对你产生深厚的信任。"
          },
          {
            ko: "상황을 오래 보고 판단하는 편이라 결정은 느려 보여도, 한번 정하면 쉽게 흔들리지 않습니다.",
            en: "You observe situations long before deciding, so while choices seem slow, you rarely shake once resolved.",
            ja: "状況を長く観察して判断する方なので、決定は遅く見えても、一度決めれば簡単に揺るぎません。",
            zh: "倾向于长期观察并判断形势，决定看起来可能较慢，但一旦下定决心就绝不易动摇。"
          },
          {
            ko: "지나치게 책임을 떠안으면 감정 표현이 줄어들 수 있어, 힘든 점을 말로 꺼내는 연습이 필요합니다.",
            en: "Taking on too much responsibility can reduce your emotional expression; practice voicing your hardships.",
            ja: "過度に責任を背負い込むと感情表現が減ることがあるため、大変なことを言葉にする練習が必要です。",
            zh: "如果过度承担责任，可能会减少情感表达，需要练习把辛苦说出来。"
          }
        ],
        love: [
          {
            ko: "연애에서는 편안함, 생활 리듬, 약속의 안정성을 중요하게 봅니다.",
            en: "Valuing comfort, daily rhythm, and the reliability of promises in romance.",
            ja: "恋愛では快適さ、生活リズム、約束の安定性を重視します。",
            zh: "恋爱中非常注重舒适度、生活节奏以及约定的稳定性。"
          },
          {
            ko: "화려한 이벤트보다 꾸준한 연락, 현실적인 배려, 함께 쌓는 루틴에 마음이 깊어집니다.",
            en: "Affection deepens through steady contact, practical care, and shared routines rather than flashy events.",
            ja: "華やかなイベントより、地道な連絡、現実的な配慮、一緒に積み重ねるルーティンに心が深まります。",
            zh: "比起华丽的浪漫惊喜，持续的联系、务实的体贴以及共同积累的日常习惯更能打动你。"
          },
          {
            ko: "좋은 궁합은 당신에게 기대기만 하는 사람이 아니라, 함께 삶을 정돈해주는 사람입니다.",
            en: "A great partner is someone who helps organize life together rather than simply leaning on you.",
            ja: "相性が良いのは、あなたに依存するだけの人ではなく、一緒に生活を整えてくれる人です。",
            zh: "最适合你的伴侣不是单方面依赖你的人，而是能与你共同梳理和规划生活的人。"
          }
        ],
        wealth: [
          {
            ko: "부동산, 운영, 관리, 교육, 식음료, 커뮤니티처럼 기반을 쌓는 분야와 잘 맞습니다.",
            en: "Well-suited for foundation-building fields: real estate, operations, management, education, F&B, and communities.",
            ja: "不動産、運営、管理、教育、飲食、コミュニティのように、基盤を築く分野とよく合います。",
            zh: "非常适合需要积累基石的领域：如房地产、运营、管理、教育、餐饮和社群服务。"
          },
          {
            ko: "한 번에 크게 벌기보다 손실을 줄이고 안정적으로 키우는 방식이 장기적으로 유리합니다.",
            en: "Rather than seeking quick fortunes, reducing losses and growing steadily benefits you in the long run.",
            ja: "一度に大幅に稼ぐよりも損失を減らし、安定的に育てる方法が長期的に有利です。",
            zh: "比起一次性赚大钱，降低损失并稳步做大的方式在长远来看对你更为有利。"
          },
          {
            ko: "숫자와 계약을 꼼꼼히 보면 재물 운이 더 단단해집니다.",
            en: "Paying close attention to numbers and contract details secures your wealth fortune further.",
            ja: "数字と契約を几帳面に確認すると、財運がより強固になります。",
            zh: "对数据和合同细节多加留心，会让你的财运更加稳固。"
          }
        ],
        travel: [
          {
            ko: "도시의 생활감, 오래된 건축, 로컬 시장, 역사 유적처럼 땅의 이야기가 있는 장소가 잘 맞습니다.",
            en: "You enjoy places with stories of the land: urban life, historic architecture, local markets, and ancient ruins.",
            ja: "都市の生活感、古い建築、ローカル市場、歴史遺跡のように、大地の物語がある場所がよく合います。",
            zh: "融入城市生活感、古老建筑、当地市场以及历史遗迹等蕴含土地故事的地方最适合你。"
          },
          {
            ko: "숙소 컨디션과 동선 안정성이 만족도를 크게 좌우합니다. 무리한 이동보다 깊게 머무는 여행이 좋습니다.",
            en: "Accommodation quality and route stability heavily affect your trip satisfaction; prefer deep stays over rushed transits.",
            ja: "宿のコンディションと移動経路の安定性が満足度を大きく左右します。無理な移動より、深く留まる旅行が良いです。",
            zh: "住宿条件和行程路线的稳定性极大影响着你的出行体验；比起紧凑的奔波，深度停留的旅行更为合适。"
          }
        ],
      },
      metal: {
        personality: [
          {
            ko: "기준, 완성도, 선명한 취향이 강합니다. 대충 넘어가는 것보다 제대로 정리하는 데 재능이 있습니다.",
            en: "Clear standards, quality-oriented, and distinct tastes; talented in organizing things properly rather than letting them slide.",
            ja: "基準、完成度、鮮明な好みが強いです。適当に済ませるより、きちんと整理することに才能があります。",
            zh: "极富原则、讲究品质且品味鲜明；擅长把事情梳理得井井有条，绝不应付了事。"
          },
          {
            ko: "말수가 많지 않아도 판단력이 또렷해서, 중요한 순간에 존재감이 강해집니다.",
            en: "Even if quiet, your clear judgment makes your presence stand out during key moments.",
            ja: "口数が少なくても判断力がはっきりしているため、重要な瞬間に存在感が強まります。",
            zh: "虽然话可能不多但判断力十分清晰，在关键时刻往往能展现出极强的存在感。"
          },
          {
            ko: "완벽주의가 높아지면 스스로를 몰아붙일 수 있으니, 80점에서 공개하고 개선하는 방식이 필요합니다.",
            en: "Intense perfectionism can cause self-pressure; try sharing your work at 80% completion and refining it later.",
            ja: "完璧主義が高まると自分を追い詰めることがあるため、80%の段階で公開して改善していくやり方が必要です。",
            zh: "完美主义倾向明显，容易给自己施压；可以尝试在完成度达到80%时就呈现出来，然后边推进边优化。"
          }
        ],
        love: [
          {
            ko: "연애에서는 존중, 품격, 약속의 정확성을 중요하게 봅니다.",
            en: "Prioritizing respect, dignity, and promise precision in romance.",
            ja: "恋愛では尊重、品格、約束の正確性を重視します。",
            zh: "恋爱中格外看重尊重、品质以及承诺的精确度。"
          },
          {
            ko: "쉽게 마음을 열지는 않지만, 한번 선택하면 상대를 특별하게 대하고 관계의 질을 높이려 합니다.",
            en: "You do not open up easily, but once chosen, you treat your partner specially and strive for relationship quality.",
            ja: "簡単には心を開きませんが、一度選ぶと相手を特別に扱い、関係の質を高めようとします。",
            zh: "不容易轻易敞开心扉，但一旦认定对方，就会格外体贴并倾力提升感情品质。"
          },
          {
            ko: "좋은 궁합은 당신의 기준을 인정하면서도 차갑게 굳지 않게 감정 온도를 올려주는 사람입니다.",
            en: "A great match is someone who respects your standards while warming up your emotions so you do not freeze up.",
            ja: "相性が良いのは、あなたの基準を認めながらも、冷たく固まらないように感情の温度を上げてくれる人です。",
            zh: "最适合你的伴侣是既能认同你的原则，又能用温暖的情感融化你偶尔流露出的冷淡的人。"
          }
        ],
        wealth: [
          {
            ko: "전문성, 기술, 법률, 금융, 디자인, 명품/프리미엄 서비스처럼 고부가가치 분야와 잘 맞습니다.",
            en: "Well-suited for high-value areas: expertise, technology, law, finance, design, and luxury/premium services.",
            ja: "専門性、技術、法律、金融、デザイン、名品・プレミアムサービスのような高付加価値分野とよく合います。",
            zh: "非常契合高附加值的领域：如专业技术、法律、金融、设计以及奢侈品/高端服务行业。"
          },
          {
            ko: "돈을 버는 핵심은 '선택과 집중'입니다. 너무 많은 일을 벌이기보다 한 분야에서 권위를 쌓는 것이 좋습니다.",
            en: "The key to making money is 'focus and concentration'; establish authority in one field rather than scattering efforts.",
            ja: "稼ぎの核心は「選択と集中」です。多くの仕事を広げるより、一つの分野で権威を築くのが良いです。",
            zh: "致富的关键在于“选择与集中”；与其多线开花，不如在一个领域深耕出无可替代的权威性。"
          },
          {
            ko: "브랜드의 디테일, 가격 정책, 계약 조건을 다듬을수록 수익성이 높아집니다.",
            en: "Refining brand details, pricing models, and contract terms increases your profitability.",
            ja: "ブランドのディテール、価格政策、契約条件を整えるほど、収益性が高まります。",
            zh: "越是精心雕琢品牌细节、定价策略和合同条款，盈利能力就越高。"
          }
        ],
        travel: [
          {
            ko: "미술관, 디자인 호텔, 고급 편집숍, 정돈된 도시 풍경처럼 취향과 완성도가 있는 여행이 잘 맞습니다.",
            en: "Excellent match for tasteful, high-quality trips: museums, design hotels, luxury boutiques, and clean urban scenery.",
            ja: "美術館、デザインホテル、高級セレクトショップ、整った都市風景のように、好みの完成度が高い旅行がよく合います。",
            zh: "十分向往高品味、高品质的旅行：如美术馆探访、设计酒店入住、高端买手店购物或整洁雅致的都市漫步。"
          },
          {
            ko: "사진, 쇼핑, 미식 코스를 미리 큐레이션하면 만족도가 크게 올라갑니다.",
            en: "Curating photo spots, shopping lists, and fine dining routes beforehand maximizes your trip satisfaction.",
            ja: "写真、ショッピング、美食コースをあらかじめキュレーションしておくと、満足度が大きく上がります。",
            zh: "提前甄选好摄影点、购物清单和美食路线，会极大提升你的旅行满意度。"
          }
        ],
      },
      water: {
        personality: [
          {
            ko: "직관, 관찰력, 정보 흡수력이 강합니다. 겉으로 조용해 보여도 머릿속에서는 많은 흐름을 읽고 있습니다.",
            en: "Strong intuition, observation, and information absorption; quiet on the outside but scanning many currents in your head.",
            ja: "直感、観察力、情報吸収力が強いです。外見は静かに見えても、頭の中では多くの流れを読んでいます。",
            zh: "具有敏锐的直觉、观察力和学习力；外表看似沉静，大脑里却在快速捕捉万物动向。"
          },
          {
            ko: "환경 변화에 잘 적응하고, 사람의 감정과 분위기를 빠르게 파악합니다.",
            en: "Adapts well to environmental changes and quickly senses others' emotions and the room's atmosphere.",
            ja: "環境の変化にうまく適応し、人の感情や雰囲気を素早く把握します。",
            zh: "能迅速适应环境变化，极易察觉他人的情感起伏和现场氛围。"
          },
          {
            ko: "생각이 깊어질수록 실행이 늦어질 수 있으니, 작은 결정을 빨리 내리는 습관이 운을 움직입니다.",
            en: "Deeper thoughts can slow down your execution; practicing quick minor decisions will activate your fortune.",
            ja: "考えが深まるほど実行が遅れることがあるため、小さな決定を早く下す習慣が運を動かします。",
            zh: "容易因思虑过度而推迟行动，养成快速做出小决定的习惯有助于改善你的运势。"
          }
        ],
        love: [
          {
            ko: "연애에서는 정서적 연결과 대화의 깊이를 중요하게 봅니다.",
            en: "Valuing emotional connection and the depth of conversations in love.",
            ja: "恋愛では情緒的な繋がりと会話の深さを重視します。",
            zh: "恋爱中特别注重精神层面的共鸣与对话的深度。"
          },
          {
            ko: "상대의 마음을 잘 읽지만, 정작 내 마음은 늦게 드러낼 수 있습니다. 원하는 것을 분명히 말할수록 관계가 편해집니다.",
            en: "You read your partner's mind well, but reveal your own slowly; stating your wants clearly eases the relationship.",
            ja: "相手の心はよく読みますが、自分の心は遅れて見せる傾向があります。望むことを明確に言うほど関係が楽になります。",
            zh: "很善于读懂对方的心思，但袒露自我却比较慢；越能明确表达心中所求，相处就会越轻松。"
          },
          {
            ko: "좋은 궁합은 당신의 속도를 존중하면서도 현실적인 결정을 함께 내려주는 사람입니다.",
            en: "A great match is someone who respects your pace while helping you make practical decisions.",
            ja: "相性が良いのは、あなたのペースを尊重しながらも、現実的な決定を一緒に下してくれる人です。",
            zh: "最适合你的伴侣是既能尊重你的节奏，又能与你共同做出务实决定的类型。"
          }
        ],
        wealth: [
          {
            ko: "정보, 언어, 기획, IT, 상담, 무역, 콘텐츠처럼 흐름을 읽고 연결하는 분야에서 강합니다.",
            en: "Strong in reading and connecting flows: information, languages, planning, IT, consulting, trade, and content creation.",
            ja: "情報、言語、企画、IT、相談、貿易、コンテンツのように、流れを読み繋ぐ分野で強みがあります。",
            zh: "在解析事物流动与做链接的领域极具优势：如信息、语言、企划、IT、咨询、贸易以及内容创作。"
          },
          {
            ko: "한 가지 수입원보다 여러 흐름을 만드는 구조가 어울립니다. 콘텐츠, 자동화, 네트워크 수익과 궁합이 좋습니다.",
            en: "A structure generating multiple income streams fits you better than a single source; matches well with content, automation, or network revenue.",
            ja: "単一の収入源より、複数の流れを作る構造が合っています。コンテンツ、自動化、ネットワーク収益と相性が良いです。",
            zh: "比起单一的收入源，多元化流水线更适合你；非常契合内容、自动化或网络化管道收益。"
          },
          {
            ko: "아이디어가 많기 때문에 기록과 우선순위 정리가 곧 돈이 됩니다.",
            en: "Since you have abundant ideas, writing them down and prioritizing them directly generates wealth.",
            ja: "アイデアが多いため、記録と優先順位の整理がそのままお金に繋がります。",
            zh: "灵感极多，因此把想法记录下来并梳理出优先级就是你的致富突破口。"
          }
        ],
        travel: [
          {
            ko: "바다, 강, 온천, 비 오는 도시, 조용한 골목처럼 감정이 정리되는 여행이 잘 맞습니다.",
            en: "You vibe well with emotional, calming trips: oceans, rivers, hot springs, rainy cities, or quiet alleys.",
            ja: "海、川、温泉、雨の降る都市、静かな路地のように、感情が整理される旅行がよく合います。",
            zh: "非常契合能沉淀情绪的旅行地：如大海、河流、温泉、落雨的城市或静谧的小巷。"
          },
          {
            ko: "혼자만의 시간과 깊은 대화가 있는 동행을 섞으면 재방문하고 싶은 여행 기억이 만들어집니다.",
            en: "Blending alone time with deep-conversation companionship leaves travel memories you will want to revisit.",
            ja: "一人だけの時間と深い対話がある同行を交ぜると、再訪問したくなる旅行の思い出が作られます。",
            zh: "将独处时光与能进行深度对话的陪伴相结合，会创造出让你魂牵梦绕、想要故地重游的旅行记忆。"
          }
        ],
      },
    };

    const dominantElement = (Object.entries(elementDistribution) as Array<[StemData["element"], number]>)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || dayMaster.element;
    const dayMasterRatio = Math.round((elementDistribution[dayMaster.element] / totalLetters) * 100);
    const dominantRatio = Math.round((elementDistribution[dominantElement] / totalLetters) * 100);
    const balanceNote = dayMasterRatio >= 38
      ? {
          ko: `${elementLabel[dayMaster.element].ko} 기운이 강하게 드러납니다. 장점은 선명하지만, 같은 방식만 반복하면 피로도가 올라갈 수 있습니다.`,
          en: `The energy of ${elementLabel[dayMaster.element].en} is strongly prominent. While your strengths are distinct, repeating the same patterns can increase fatigue.`,
          ja: `${elementLabel[dayMaster.element].ja}のエネルギーが強く表れています。強みは鮮明ですが、同じ方式ばかり繰り返すと疲労度が高まる可能性があります。`,
          zh: `${elementLabel[dayMaster.element].zh}的能量极其强劲. 虽然优点鲜明，但如果一味沿用旧有模式，容易增加疲劳感.`
        }[lang] || `${elementLabel[dayMaster.element].ko} 기운이 강하게 드러납니다. 장점은 선명하지만, 같은 방식만 반복하면 피로도가 올라갈 수 있습니다.`
      : dayMasterRatio <= 12
        ? {
            ko: `${elementLabel[dayMaster.element].ko} 기운이 섬세하게 숨어 있습니다. 겉모습보다 내면의 욕구를 의식적으로 꺼내야 운이 살아납니다.`,
            en: `The energy of ${elementLabel[dayMaster.element].en} is delicately hidden. You must consciously bring out your inner desires to activate your fortune.`,
            ja: `${elementLabel[dayMaster.element].ja}のエネルギーが繊細に隠れています。外見より内面の欲求を意識的に引き出すことで運気が活性化します。`,
            zh: `${elementLabel[dayMaster.element].zh}的能量细腻地隐藏着. 相比于外表，需要有意识地释放内心深处的渴求，才能激活你的运势.`
          }[lang] || `${elementLabel[dayMaster.element].ko} 기운이 섬세하게 숨어 있습니다. 겉모습보다 내면의 욕구를 의식적으로 꺼내야 운이 살아납니다.`
        : {
            ko: `${elementLabel[dayMaster.element].ko} 기운이 비교적 균형 있게 작동합니다. 상황에 맞춰 부드럽게 강약 조절이 가능합니다.`,
            en: `The energy of ${elementLabel[dayMaster.element].en} operates in relative balance. You can smoothly adjust your intensity to suit the situation.`,
            ja: `${elementLabel[dayMaster.element].ja}のエネルギーが比較的バランスよく働いています。状況に合わせてスムーズに強弱を調節できます。`,
            zh: `${elementLabel[dayMaster.element].zh}的能量处于相对平衡的状态. 能够根据具体情况自如、温和地调节力度.`
          }[lang] || `${elementLabel[dayMaster.element].ko} 기운이 비교적 균형 있게 작동합니다. 상황에 맞춰 부드럽게 강약 조절이 가능합니다.`;

    return {
      dominant: `${elementLabel[dominantElement][lang] || elementLabel[dominantElement].ko} ${dominantRatio}%`,
      balanceNote,
      personality: elementTone[dayMaster.element].personality.map(item => item[lang] || item.ko),
      love: elementTone[dayMaster.element].love.map(item => item[lang] || item.ko),
      wealth: elementTone[dayMaster.element].wealth.map(item => item[lang] || item.ko),
      travel: elementTone[dayMaster.element].travel.map(item => item[lang] || item.ko),
    };
  };

  const detailedSaju = getDetailedSajuSections();

  const renderDetailedBullets = (
    title: string,
    items: string[],
    tone: "amber" | "rose" | "emerald" | "blue" = "amber"
  ) => {
    const toneClass = {
      amber: "border-amber-500/15 bg-amber-500/5 text-amber-500",
      rose: "border-rose-500/15 bg-rose-500/5 text-rose-400",
      emerald: "border-emerald-500/15 bg-emerald-500/5 text-emerald-400",
      blue: "border-blue-500/15 bg-blue-500/5 text-blue-400",
    }[tone];

    return (
      <div className={`rounded-2xl border p-3.5 space-y-2 ${toneClass}`}>
        <div className="flex items-center justify-between gap-2">
          <h5 className="text-[11px] font-black text-foreground">{title}</h5>
          {detailedSaju?.dominant && (
            <span className="text-[9px] font-black px-2 py-1 rounded-full bg-background/70 border border-border text-muted-foreground">
              {detailedSaju.dominant}
            </span>
          )}
        </div>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={`${title}-${index}`} className="flex gap-2 text-[11px] leading-relaxed text-muted-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-current shrink-0 opacity-80" />
              <p className="whitespace-normal break-words">{item}</p>
            </div>
          ))}
        </div>
        {detailedSaju?.balanceNote && (
          <p className="pt-2 border-t border-current/10 text-[10px] leading-relaxed text-muted-foreground">
            {detailedSaju.balanceNote}
          </p>
        )}
      </div>
    );
  };

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
      <div
        className="fixed inset-0 z-[80] flex items-end justify-center px-safe"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 18px)",
          paddingBottom: "calc(var(--app-nav-height, 84px) + env(safe-area-inset-bottom, 0px) + 12px)",
        }}
      >
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
          className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-t-3xl overflow-hidden shadow-float flex flex-col border border-amber-500/20"
          style={{
            maxHeight: "calc(100dvh - env(safe-area-inset-top, 0px) - var(--app-nav-height, 84px) - env(safe-area-inset-bottom, 0px) - 42px)",
          }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
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

          <div className="flex-1 overflow-y-auto px-5 pt-4 space-y-4" style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom, 0px))" }}>
            {!isCalculated ? (
              /* ── 입력 폼 (Input Form) ── */
              <div className="space-y-4">
                <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-black">
                    <Calendar size={14} />
                    <span>{{ ko: "생년월일시 입력", en: "Birth Information", ja: "出生情報", zh: "出生信息" }[lang]}</span>
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
                          <option key={y} value={y}>
                            {y}{{ ko: "년", en: "", ja: "年", zh: "年" }[lang] || ""}
                          </option>
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
                          <option key={m} value={m}>
                            {m}{{ ko: "월", en: "", ja: "月", zh: "月" }[lang] || ""}
                          </option>
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
                          <option key={d} value={d}>
                            {d}{{ ko: "일", en: "", ja: "日", zh: "日" }[lang] || ""}
                          </option>
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
                  onClick={handleCalculateWithRewardAd}
                  disabled={isRewardAdLoading}
                  className="w-full py-3.5 rounded-2xl gradient-primary text-white font-extrabold text-xs shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:opacity-95 disabled:opacity-70 disabled:pointer-events-none"
                >
                  <Sparkles size={14} className="animate-pulse" />
                  <span>
                    {isRewardAdLoading
                      ? ({ ko: "\uBD84\uC11D \uC911...", en: "Analyzing...", ja: "\u5206\u6790\u4E2D...", zh: "\u5206\u6790\u4E2D..." }[lang])
                      : ({ ko: "\uC0AC\uC8FC \uD314\uC790 \uB9CC\uC138\uB825 \uC0C1\uC138\uBD84\uC11D\uD558\uAE30", en: "Start Saju-Palja Analysis", ja: "\u56DB\u67F1\u63A8\u547D\u3092\u8A73\u3057\u304F\u5206\u6790", zh: "\u751F\u6210\u516B\u5B57\u8BE6\u6279" }[lang])
                    }
                  </span>
                </motion.button>
              </div>
            ) : (
              /* ── 결과 화면 (Result Report) ── */
              <div className="space-y-4">
                                {/* 탭 네비게이션 */}
                <div className="flex bg-muted/60 p-1 rounded-2xl border border-border/80 flex-wrap gap-y-1">
                  {(["pillars", "personality", "love", "wealth", "travel"] as const).map((tab) => {
                    const label = {
                      pillars: { ko: "☯️ 만세력", en: "☯️ Pillars", ja: "☯️ 四柱", zh: "☯️ 命盘" }[lang],
                      personality: { ko: "👤 성향", en: "👤 Character", ja: "👤 性格", zh: "👤 性格" }[lang],
                      love: { ko: "❤️ 연애", en: "❤️ Love", ja: "❤️ 恋愛", zh: "❤️ 恋爱" }[lang],
                      wealth: { ko: "💵 재물", en: "💵 Wealth", ja: "💵 財運", zh: "💵 财运" }[lang],
                      travel: { ko: "✈️ 여행", en: "✈️ Travel", ja: "✈️ 旅行", zh: "✈️ 出行" }[lang]
                    }[tab];
                    return (
                      <button
                        type="button"
                        key={tab}
                        role="tab"
                        aria-selected={activeTab === tab}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          selectResultTab(tab);
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
                        {[
                          { ko: "시주", en: "Hour", ja: "時柱", zh: "时柱" },
                          { ko: "일주", en: "Day", ja: "日柱", zh: "日柱" },
                          { ko: "월주", en: "Month", ja: "月柱", zh: "月柱" },
                          { ko: "연주", en: "Year", ja: "年柱", zh: "年柱" }
                        ].map((pHeader, i) => (
                          <div key={i} className="text-[9px] text-muted-foreground font-semibold leading-tight">
                            {pHeader[lang] || pHeader.ko}
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
                                <span>{{ ko: "시 부족", en: "No Hour", ja: "時柱なし", zh: "无时柱" }[lang] || "No Hour"}</span>
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
                                  {{ ko: "본인", en: "Me", ja: "自分", zh: "本人" }[lang] || "Me"}
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
                              <span className="text-[9px] font-extrabold text-foreground">
                                {((BRANCH_TRANSLATIONS[pillar.branch.hanja] || {})[lang] || pillar.branch.hanja) + pillar.branch.animal}
                              </span>
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

                    {/* 십신 통계 그래프 */}
                    <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-black text-foreground pb-1 border-b border-border/40">
                        <span className="text-xs">🔮</span>
                        <span>{{ ko: "나의 5대 운명 핵심 에너지 (십신 분포)", en: "My Five Cosmic Forces Balance (Ten Gods)", ja: "私の運命5大エネルギー (十神分布)", zh: "我的五大命运核心能量 (十神分布)" }[lang]}</span>
                      </div>

                      <div className="space-y-3 pt-1">
                        {Object.entries(tenGodsDistribution).map(([key, count]) => {
                          const info = TEN_GODS_INFO[key];
                          const pct = Math.round((count / totalLetters) * 100);
                          const barColors = {
                            비겁: "from-emerald-400 to-teal-500",
                            식상: "from-rose-400 to-orange-500",
                            재성: "from-amber-400 to-yellow-600",
                            관성: "from-cyan-400 to-blue-500",
                            인성: "from-blue-600 to-indigo-700"
                          }[key];

                          return (
                            <div key={key} className="space-y-1">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-extrabold text-foreground">{info.name[lang] || info.name.ko}</span>
                                <span className="font-black text-amber-500">{pct}%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={`h-full rounded-full bg-gradient-to-r ${barColors}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                              <p className="text-[8px] text-muted-foreground leading-normal pl-0.5">{info.vibe[lang] || info.vibe.ko}</p>
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

                    {/* 매력 포인트 서브 카드 */}
                    <div className="bg-gradient-to-br from-rose-950/10 to-card border border-rose-500/20 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-1.5 pb-1 border-b border-rose-500/10">
                        <span className="text-sm shrink-0">✨</span>
                        <h5 className="text-[11px] font-black text-rose-400">
                          {{ ko: "나의 치명적인 매력 포인트", en: "My Unique Charm Points", ja: "私の魅力ポイント", zh: "我的核心魅力点" }[lang]}
                        </h5>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-normal break-words">
                        {dayMaster.charmVibe[lang] || dayMaster.charmVibe.en}
                      </p>
                    </div>

                    {detailedSaju && renderDetailedBullets(
                      {
                        ko: "성격과 매력의 세부 해석",
                        en: "Detailed Analysis of Personality & Charm",
                        ja: "性格と魅力の詳細な分析",
                        zh: "性格与魅力细节解析"
                      }[lang] || "Detailed Analysis of Personality & Charm",
                      detailedSaju.personality,
                      "amber"
                    )}

                    {/* 수호 신살 배지 및 상세 카드 */}
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center gap-1.5 pb-1 border-b border-border/40">
                        <span className="text-xs">🛡️</span>
                        <h5 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                          {{ ko: "나의 수호 명리 신살 배지", en: "My Celestial Guardian Stars", ja: "私の守護神殺", zh: "我的本命守护神煞" }[lang]}
                        </h5>
                      </div>

                      <div className="space-y-2.5">
                        {activeStars.map((star) => (
                          <div 
                            key={star.id} 
                            className="bg-gradient-to-br from-amber-500/5 via-card to-card border border-amber-500/25 rounded-2xl p-4 space-y-2 shadow-sm relative overflow-hidden"
                          >
                            {/* Star Glow */}
                            <div className="absolute -top-6 -right-6 w-16 h-16 bg-amber-400/5 rounded-full blur-xl pointer-events-none" />
                            
                            <div className="flex items-center gap-2 border-b border-border/40 pb-1.5">
                              <span className="text-xl shrink-0 filter drop-shadow">{star.emoji}</span>
                              <div>
                                <h6 className="text-[11px] font-black text-amber-500 leading-tight">
                                  {star.name[lang] || star.name.ko}
                                </h6>
                                <p className="text-[8px] text-muted-foreground font-semibold leading-none mt-0.5">
                                  {star.subtitle[lang] || star.subtitle.ko}
                                </p>
                              </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed whitespace-normal break-words">
                              {star.desc[lang] || star.desc.ko}
                            </p>
                          </div>
                        ))}
                      </div>
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

                                {/* 탭 3: 연애 및 궁합 분석 */}
                {activeTab === "love" && dayMaster && (
                  <div className="space-y-3">
                    <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-1.5 pb-1 border-b border-border/50">
                        <span className="text-2xl filter drop-shadow">❤️</span>
                        <div>
                          <h4 className="text-xs font-black text-rose-400 leading-tight">
                            {(() => {
                              const stemName = (STEM_TRANSLATIONS[dayMaster.hanja] || {})[lang] || dayMaster.hanja;
                              return {
                                ko: `${dayMaster.korean}의 연애운 및 궁합 성향`,
                                en: `Love & Compatibility Fortune of ${stemName}`,
                                ja: `${stemName}の恋愛運と相性傾向`,
                                zh: `${stemName}的恋爱运势与契合倾向`
                              }[lang] || `${dayMaster.korean}의 연애운 및 궁합 성향`;
                            })()}
                          </h4>
                          <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">
                            ${{ ko: "명리 기반 타고난 로맨스 기질", en: "Your Celestial Romance Archetype", ja: "生まれ持った恋愛気質", zh: "八字本命恋爱静态运" }[lang]}
                          </p>
                        </div>
                      </div>

                      <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-normal break-words pt-1.5">
                        {dayMaster.loveVibe[lang] || dayMaster.loveVibe.en}
                      </p>
                    </div>

                    {detailedSaju && renderDetailedBullets(
                      {
                        ko: "연애 스타일과 잘 맞는 관계",
                        en: "Love Style & Compatible Relationships",
                        ja: "恋愛スタイルと相性の良い関係",
                        zh: "恋爱风格与契合关系"
                      }[lang] || "Love Style & Compatible Relationships",
                      detailedSaju.love,
                      "rose"
                    )}

                    <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-3 text-[10px] leading-relaxed flex gap-2">
                      <HeartIcon size={14} className="text-rose-400 shrink-0 mt-0.5" />
                      <p className="text-muted-foreground leading-relaxed">
                        ${{
                          ko: "사주에서 일간은 본인의 핵심 연애관이자 매력 포인트를 상징합니다. 연인의 사주에 상생 원소(목생화, 금생수 등)가 있으면 관계의 피로도가 매우 낮고 서로를 충전해 줍니다.",
                          en: "Your Day Master reveals your core romantic approach and charm profile. When a partner holds generating elements (e.g. Wood feeding Fire), it charges your spirit with zero friction.",
                          ja: "四柱推命の日柱は、あなたの本質的な恋愛観や魅力を象徴します. 相生の五行（木生火、金生水など）を持つ相手とは非常に相性が良く、心地よい関係を長続きさせられます.",
                          zh: "在八字中，日元象征着您最核心的恋爱观与本命桃花磁场. 如果伴侣的日柱拥有相生的五行元素（如木生火、金生水），双方的相处就会非常轻松甜蜜、互相滋养。"
                        }[lang]}
                      </p>
                    </div>
                  </div>
                )}

                {/* 탭 4: 재물 및 직업 적성 분석 */}
                {activeTab === "wealth" && dayMaster && (
                  <div className="space-y-3">
                    <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-1.5 pb-1 border-b border-border/50">
                        <span className="text-2xl filter drop-shadow">💵</span>
                        <div>
                          <h4 className="text-xs font-black text-emerald-400 leading-tight">
                            {(() => {
                              const stemName = (STEM_TRANSLATIONS[dayMaster.hanja] || {})[lang] || dayMaster.hanja;
                              return {
                                ko: `${dayMaster.korean}의 재물운 및 비즈니스 기회`,
                                en: `Wealth Fortune & Business Opportunities of ${stemName}`,
                                ja: `${stemName}の財運とビジネスチャンス`,
                                zh: `${stemName}的财运与商业机遇`
                              }[lang] || `${dayMaster.korean}의 재물운 및 비즈니스 기회`;
                            })()}
                          </h4>
                          <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">
                            ${{ ko: "타고난 재무 포트폴리오와 천직", en: "Your Cosmic Wealth & Business Fortune", ja: "生まれ持った財運・適職", zh: "八字本命财运与职业天赋" }[lang]}
                          </p>
                        </div>
                      </div>

                      <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-normal break-words pt-1.5">
                        {dayMaster.wealthVibe[lang] || dayMaster.wealthVibe.en}
                      </p>
                    </div>

                    {/* 진로 및 천직 서브 카드 */}
                    <div className="bg-gradient-to-br from-emerald-950/10 to-card border border-emerald-500/20 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-1.5 pb-1 border-b border-emerald-500/10">
                        <span className="text-sm shrink-0">🎓</span>
                        <h5 className="text-[11px] font-black text-emerald-400">
                          {{ ko: "추천 진로, 천직 및 직업군", en: "Lucky Career & Calling Paths", ja: "おすすめの適職・キャリア", zh: "推荐职业与人生方向" }[lang]}
                        </h5>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-normal break-words">
                        {dayMaster.careerVibe[lang] || dayMaster.careerVibe.en}
                      </p>
                    </div>

                    {detailedSaju && renderDetailedBullets(
                      {
                        ko: "재물 흐름과 진로 전략",
                        en: "Wealth Flow & Career Strategy",
                        ja: "財政の流れとキャリア戦略",
                        zh: "财运流向与职业策略"
                      }[lang] || "Wealth Flow & Career Strategy",
                      detailedSaju.wealth,
                      "emerald"
                    )}

                    {/* 천직 십신 기질 특화 카드 */}
                    <div className="bg-gradient-to-br from-emerald-950/15 via-card to-card border border-emerald-500/30 rounded-2xl p-4 space-y-2.5 shadow-md relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                      
                      <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                        <span className="text-sm shrink-0">🎯</span>
                        <div>
                          <h6 className="text-[11px] font-black text-emerald-400 leading-tight">
                            {{ ko: "나의 십신 에너지 맞춤형 천직 제안", en: "Cosmic Ten Gods Career Path Match", ja: "私の十神エネルギー適職提案", zh: "专属十神能量天职规划" }[lang]}
                          </h6>
                          <p className="text-[8px] text-muted-foreground font-semibold leading-none mt-0.5">
                            {{ ko: "가장 강력한 주도 에너지를 활용한 100% 성공 전략", en: "Unlocking 100% success by leveraging your primary dynamic force", ja: "最も強いエネルギーを活用した成功戦略", zh: "发挥最强本命能量的致富突破点" }[lang]}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-[10.5px] text-muted-foreground leading-relaxed whitespace-normal break-words">
                        {TEN_GODS_CAREERS[dominantTenGods][lang] || TEN_GODS_CAREERS[dominantTenGods].ko}
                      </p>
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-[10px] leading-relaxed flex gap-2">
                      <Crown size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-muted-foreground leading-relaxed">
                        ${{
                          ko: "사주명리에서 본인의 일간에 따라 재물을 취하는 방식(재성)과 행동 방식(식상)이 다릅니다. 이 보고서는 본인의 타고난 기질을 극대화하여 부를 얻는 최선의 방향성을 제시합니다.",
                          en: "Your Day Master determines how you attract wealth (Wealth Star) and create opportunities. This report guides you on the highest cosmic alignment to maximize your professional gains.",
                          ja: "四柱推命において、あなたの財を成す力や行動力は、日干の種類によって千差万別です. このレポートは、あなたが生まれ持った長所を最大限に発揮して成功するための道標を示しています.",
                          zh: "在八字命理中，日元的强弱与五行属性决定了您获取财富的途径（财星）与行动逻辑（食伤）. 本报告旨在引导您顺应天命磁场，最大化释放您的职业与财运天赋。"
                        }[lang]}
                      </p>
                    </div>
                  </div>
                )}

                {/* 탭 5: 여행 운명 리포트 */}
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

                    {detailedSaju && renderDetailedBullets(
                      {
                        ko: "여행 취향과 동행 매칭 포인트",
                        en: "Travel Preferences & Companion Matching",
                        ja: "旅行の好みと同伴者のマッチングポイント",
                        zh: "旅行偏好与同伴契合点"
                      }[lang] || "Travel Preferences & Companion Matching",
                      detailedSaju.travel,
                      "blue"
                    )}

                    <button
                      onClick={generateSajuStoryCard}
                      className="w-full py-4 mb-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white font-extrabold text-xs active:scale-[0.98] hover:scale-[1.01] transition-all text-center flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
                    >
                      <Share2 size={15} />
                      {{
                        ko: "인스타 스토리 공유용 카드 만들기 📸",
                        en: "Make Instagram Story Card 📸",
                        ja: "ストーリー共有カードを作成 📸",
                        zh: "制作 Instagram 快拍分享卡 📸"
                      }[lang] || "Make Instagram Story Card 📸"}
                    </button>

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

        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" style={{ display: "none" }} />

        {/* ── Instagram Story Card Preview Modal ── */}
        <AnimatePresence>
          {showCardModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl">
              {/* Backdrop */}
              <motion.div
                className="absolute inset-0 bg-black/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCardModal(false)}
              />

              {/* Modal Body */}
              <motion.div
                className="relative z-10 w-full max-w-sm bg-card border border-border/80 rounded-3xl p-5 flex flex-col items-center gap-4 shadow-2xl"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
              >
                {/* Header */}
                <div className="w-full flex justify-between items-center pb-2 border-b border-border/40">
                  <span className="text-xs font-black text-foreground flex items-center gap-1">
                    <Sparkles size={14} className="text-amber-500 animate-pulse" />
                    {{
                      ko: "인스타 공유용 운명 카드",
                      en: "Instagram Story Fate Card",
                      ja: "ストーリー共有カード",
                      zh: "快拍分享运势卡"
                    }[lang] || "Instagram Story Fate Card"}
                  </span>
                  <button
                    onClick={() => setShowCardModal(false)}
                    className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Story Card Image Preview */}
                <div className="relative w-full aspect-[9/16] max-h-[45vh] bg-muted/40 rounded-2xl overflow-hidden border border-border/60 flex items-center justify-center">
                  {cardImage ? (
                    <img
                      src={cardImage}
                      alt="Saju Story Card"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                      <span className="text-[10px] font-bold">
                        {{
                          ko: "스토리 카드를 생성 중입니다...",
                          en: "Generating Story Card...",
                          ja: "カードを生成中...",
                          zh: "正在生成卡片..."
                        }[lang] || "Generating Story Card..."}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="w-full space-y-2 pt-1">
                  <button
                    disabled={!cardImage}
                    onClick={handleDownloadCard}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white font-extrabold text-xs active:scale-[0.98] hover:scale-[1.01] transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                  >
                    <Download size={14} />
                    {{
                      ko: "스토리 카드 다운로드 📥",
                      en: "Download Story Card 📥",
                      ja: "画像を保存 📥",
                      zh: "下载卡片 📥"
                    }[lang] || "Download Story Card 📥"}
                  </button>

                  <button
                    onClick={handleCopyInviteLink}
                    className="w-full py-3 rounded-xl bg-muted border border-border/80 text-foreground font-extrabold text-xs active:scale-[0.98] hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                  >
                    <Copy size={14} />
                    {copiedLink
                      ? ({ ko: "초대 링크 복사 완료! ✅", en: "Copied! ✅", ja: "コピー完了! ✅", zh: "链接已复制! ✅" }[lang] || "Copied! ✅")
                      : ({ ko: "내 초대 링크 복사하기 📋", en: "Copy My Invite Link 📋", ja: "招待リンクをコピー 📋", zh: "复制邀请链接 📋" }[lang] || "Copy My Invite Link 📋")
                    }
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}
