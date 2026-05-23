import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Calendar, Heart, MessageCircle, Zap, ChevronLeft, ChevronRight, User, Globe, Sparkles, Crown, Star, Languages, Loader2 } from "lucide-react";
import VerifyBadge from "./VerifyBadge";
import TravelDNA from "./TravelDNA";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { translateText } from "@/lib/translateService";

const getDeterministicHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const SAJU_ELEMENTS: Record<
  string,
  {
    emoji: string;
    color: string;
    textBg: string;
    glowColor: string;
    name: Record<string, string>;
    shortName: Record<string, string>;
    desc: Record<string, string>;
  }
> = {
  wood: {
    emoji: "🌲",
    color: "from-emerald-500 to-teal-600",
    textBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    glowColor: "shadow-emerald-500/20",
    name: {
      ko: "산들바람 즉흥 방랑자 (木 - Wood Nomad)",
      en: "Gentle Breeze Nomad (Wood Element)",
      ja: "そよ風の即興放浪者 (木)",
      zh: "微风即兴流浪者 (木)"
    },
    shortName: {
      ko: "산들바람 (木)",
      en: "Breeze (Wood)",
      ja: "そよ風 (木)",
      zh: "微风 (木)"
    },
    desc: {
      ko: "푸르른 나무처럼 자유롭고 생기발랄하며, 계획보다 발길이 닿는 대로 즉흥 탐험을 즐기는 활기찬 성향입니다.",
      en: "Free-spirited and vibrant like a green tree. You love spontaneous wanders where your feet lead, rather than strict plans.",
      ja: "青々とした木のように自由で活기에 찬 미식, 계획보다 발길이 닿는 즉흥적인 모험을 사랑합니다.",
      zh: "像青翠的树木一样自由而充满活力，相比死板的计划，更喜欢随心所欲的即兴探索。"
    }
  },
  fire: {
    emoji: "🔥",
    color: "from-rose-500 to-orange-600",
    textBg: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    glowColor: "shadow-rose-500/20",
    name: {
      ko: "태양의 열정 여행자 (火 - Golden Flame)",
      en: "Golden Flame Traveler (Fire Element)",
      ja: "太陽의 情熱旅行者 (火)",
      zh: "太阳的激情旅行者 (火)"
    },
    shortName: {
      ko: "태양열정 (火)",
      en: "Flame (Fire)",
      ja: "太陽情熱 (火)",
      zh: "太阳激情 (火)"
    },
    desc: {
      ko: "뜨겁게 타오르는 불꽃처럼 강렬한 에너지를 지녔으며, 밤새 즐기는 축제나 현지 번개 핫플레이스 탐험을 사랑합니다.",
      en: "Possesses an intense energy like a blazing flame. You love vibrant festivals, nightlife, and exploring local hot spots.",
      ja: "燃え上がる炎のような強烈なエネルギーを持ち、一晩中楽しむ祭りや現地のホットプレイス探検を愛しています。",
      zh: "拥有像烈火般强烈的能量，热爱彻夜狂欢的节日以及探索当地最热门的聚会场所。"
    }
  },
  earth: {
    emoji: "⛰️",
    color: "from-amber-600 to-yellow-700",
    textBg: "bg-amber-600/10 text-amber-400 border-amber-600/30",
    glowColor: "shadow-amber-600/20",
    name: {
      ko: "단단한 바위 계획 여행자 (土 - Iron Mountain)",
      en: "Iron Mountain Wanderer (Earth Element)",
      ja: "頑丈な岩의 計画旅行者 (土)",
      zh: "坚实岩石计划旅行者 (土)"
    },
    shortName: {
      ko: "단단바위 (土)",
      en: "Mountain (Earth)",
      ja: "頑丈岩 (土)",
      zh: "坚实岩石 (土)"
    },
    desc: {
      ko: "넓고 따뜻한 대지처럼 묵직하며, 꼼꼼하게 동선과 예산을 짜서 함께하는 사람들에게 높은 신뢰를 주는 든든한 가이드형입니다.",
      en: "Grounded and steady like the warm earth. You meticulously plan routes and budgets, providing safety and trust for everyone.",
      ja: "広大で温かい大地のように頼もしく、几帳面に移動ルートや予算を計画し、同伴者に高い信頼感を与えるガイドタイプです。",
      zh: "像宽广温暖的大地一样稳重，严谨地规划路线与预算，给旅伴带来百分百安全感与信任的向导型人格。"
    }
  },
  metal: {
    emoji: "💎",
    color: "from-cyan-500 to-blue-600",
    textBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    glowColor: "shadow-cyan-500/20",
    name: {
      ko: "화려한 보석 감성 Voyager (金 - Glimmering Jewel)",
      en: "Glimmering Jewel Voyager (Metal Element)",
      ja: "華やかな宝石の感性旅行者 (金)",
      zh: "华丽宝石感性旅行者 (金)"
    },
    shortName: {
      ko: "화려보석 (金)",
      en: "Jewel (Metal)",
      ja: "華やか宝石 (金)",
      zh: "华丽宝石 (金)"
    },
    desc: {
      ko: "다이아몬드처럼 빛나는 감각을 지녔으며, 감성 미술관, 빈티지 숍, 그리고 완벽한 미적 레이아웃의 인생샷을 찍는 여정을 선호합니다.",
      en: "Possesses a sparkling sensibility like a diamond. You prefer gorgeous art museums, vintage boutiques, and aesthetic photo walks.",
      ja: "ダイヤモンドのように輝く感性を持ち、おしゃれな美術館、ヴィンテージショップ、そして完璧なアングルの人生ショットを撮る旅を好みます。",
      zh: "拥有如钻石般闪耀的感官，偏爱感性美术馆、复古买手店，以及拍摄极具美感艺术照的打卡旅程。"
    }
  },
  water: {
    emoji: "🌊",
    color: "from-sky-500 to-indigo-600",
    textBg: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    glowColor: "shadow-sky-500/20",
    name: {
      ko: "유연한 강물 미식 탐험가 (水 - Ocean Explorer)",
      en: "Ocean Tides Explorer (Water Element)",
      ja: "柔軟な川の流れ의 美食探検家 (水)",
      zh: "柔美江河美食探险家 (水)"
    },
    shortName: {
      ko: "유연강물 (水)",
      en: "Ocean (Water)",
      ja: "柔軟な川 (水)",
      zh: "柔美江河 (水)"
    },
    desc: {
      ko: "끝없이 흐르는 강물처럼 유연하며, 유명한 숨겨진 미식 골목 투어를 좋아하고 어떤 낯선 여행 환경에도 막힘없이 녹아듭니다.",
      en: "Fluid and flexible like a flowing river. You adore hunting for hidden local restaurants and seamlessly adapt to any environment.",
      ja: "絶え間なく流れる川のように柔軟で、隠れたグルメ通りの探訪を愛し、どんな異国の旅行環境にも自然と溶け込みます。",
      zh: "像奔流不息的江河一样温柔且包容，热爱打卡隐藏的街头美食，并能毫无阻碍地融入任何陌生的旅行环境。"
    }
  }
};

const calculateSajuElement = (p: any): "wood" | "fire" | "earth" | "metal" | "water" => {
  if (!p) return "wood";
  const seedStr = p.id || p.name || "migo";
  const hash = getDeterministicHash(seedStr);
  
  const mbti = p.mbti || "";
  let mbtiModifier = 0;
  if (mbti.includes("E")) mbtiModifier += 1;
  if (mbti.includes("N")) mbtiModifier += 2;
  if (mbti.includes("F")) mbtiModifier += 3;
  if (mbti.includes("P")) mbtiModifier += 4;
  
  const idx = (hash + mbtiModifier + (p.age || 0)) % 5;
  const elements = ["wood", "fire", "earth", "metal", "water"] as const;
  return elements[idx];
};

const getSajuCompatibility = (el1: string, el2: string, lang: string) => {
  const l = (lang || "ko").toLowerCase();
  
  const isGenerating = 
    (el1 === "wood" && el2 === "fire") || (el2 === "wood" && el1 === "fire") ||
    (el1 === "fire" && el2 === "earth") || (el2 === "fire" && el1 === "earth") ||
    (el1 === "earth" && el2 === "metal") || (el2 === "earth" && el1 === "metal") ||
    (el1 === "metal" && el2 === "water") || (el2 === "metal" && el1 === "water") ||
    (el1 === "water" && el2 === "wood") || (el2 === "water" && el1 === "wood");

  if (el1 === el2) {
    return {
      score: 95,
      type: {
        ko: "거울 쌍둥이의 완벽한 조화 (☯️ Absolute Resonance)",
        en: "Mirror Twins: Perfect Resonance (☯️ Resonance)",
        ja: "鏡の双子：完璧な共鳴 (☯️ 共鳴)",
        zh: "镜面双胞胎：绝对共鸣 (☯️ 共鸣)"
      }[l] || "Mirror Twins: Perfect Resonance (☯️ Resonance)",
      story: {
        ko: "같은 오행의 원소를 나눠 가진 두 분은 거울을 보는 듯한 깊은 공감대를 형성합니다. 말하지 않아도 피로를 느끼는 타이밍이나 원하는 휴식지가 소름 돋게 일치하며, 가장 편안한 침묵을 공유할 수 있습니다.",
        en: "Sharing the exact same elemental energy, you form a deep connection like looking in a mirror. Your energy levels and need for rest match perfectly, allowing you to share the most comfortable silence.",
        ja: "同じ五行の元素を分かち合う二人は、鏡を見ているような深い共感を形成します。言葉にしなくても疲れるタイミングや好む休息地が驚くほど一致し、最も心地よい沈黙を共有できます。",
        zh: "共享相同五行元素的你们，就像在照镜子一样能形成极深的共鸣。即使不言不语，疲惫的时刻和渴望休息的地点也会惊人一致，能共享最舒适的宁静。"
      }[l] || ""
    };
  }

  if (isGenerating) {
    let storyKo = "";
    let storyEn = "";
    let storyJa = "";
    let storyZh = "";
    let relationshipType = "";

    if ((el1 === "wood" && el2 === "fire") || (el2 === "wood" && el1 === "fire")) {
      relationshipType = "목생화 (Wood Feeds Fire) 🔥";
      storyKo = "든든한 나무(Wood) 성향이 뜨거운 열정(Fire)을 끊임없이 보태주는 상생의 결합입니다! 한 명의 신선한 발상이 다른 한 명의 실행력에 큰 동력이 되어주며, 여행 내내 에너지가 바닥나지 않는 환상의 커플입니다.";
      storyEn = "A beautiful harmony where Wood continuously feeds and supports Fire's passion! One's fresh ideas fuel the other's execution, creating an unstoppable adventure where energy never runs dry.";
      storyJa = "頼もしい木(Wood)の性質が、熱い情熱(Fire)에 끊임없이 나무(Wood)를 대어주는 상생의 결합입니다! 한 명의 신선한 발상이 다른 한 명의 실행력에 큰 동력이 되어주며, 여행 내내 에너지가 바닥나지 않는 환상의 커플입니다.";
      storyZh = "稳固的木（Wood）属性不断为炽热的烈火（Fire）增添燃料的相生结合！一人的新奇想法成为另一人执行力的强大引擎，是整趟旅行活力无限的梦幻组合。";
    } else if ((el1 === "fire" && el2 === "earth") || (el2 === "fire" && el1 === "earth")) {
      relationshipType = "화생토 (Fire Generates Earth) ⛰️";
      storyKo = "불꽃(Fire)의 뜨거운 열정이 대지(Earth)를 더욱 풍요롭고 단단하게 가꾸어주는 궁합입니다! 활발하고 적극적인 주도가 든든한 안정감과 만나 최고의 시너지를 만들어내며, 잊지 못할 다채로운 인생 여행을 만듭니다.";
      storyEn = "The fiery passion of Fire warms and enriches the steady Earth. Lively exploration meets absolute security, producing a perfectly balanced travel harmony and unforgettable core memories.";
      storyJa = "炎(Fire)の熱い情熱が、大地(Earth)をより豊かで頑丈に育てる相性です！活発で積極的なリードが頼もしい安定感と出会い、最高の実りを生み出し、忘れられない多彩な人生の旅を作り出します。";
      storyZh = "烈火（Fire）的炙热激情使大地（Earth）更加富饶坚实的完美相配！活跃积极的引导与稳健的安定感交融，创造出最大的协同效应，缔造难以忘怀的多彩旅程。";
    } else if ((el1 === "earth" && el2 === "metal") || (el2 === "earth" && el1 === "metal")) {
      relationshipType = "토생금 (Earth Supports Metal) 💎";
      storyKo = "대지(Earth)의 따뜻한 품 속에서 빛나는 보석(Metal)이 탄생하는 형국입니다! 묵직한 배려와 섬세한 미적 감각이 결합하여, 여행 중 예상치 못한 아름다운 핫플레이스나 빈티지 명소를 함께 찾아내며 낭만을 즐깁니다.";
      storyEn = "A precious Jewel (Metal) is safely embraced and nurtured by the warm Earth. Grounded support combines with fine aesthetic tastes, leading you to find the most beautiful hidden boutiques and romantic spots.";
      storyJa = "大地(Earth)の温かい懐の中で、輝く宝石(Metal)が誕生する形です！大きな配慮と繊細な美のセンスが結びつき、旅の中で予期せぬ美しいホットプレイスやヴィンテージの名所を一緒に発見し、ロマンを楽しみます。";
      storyZh = "在大地（Earth）的温暖怀抱中孕育出璀璨宝石（Metal）的格局！厚重的体贴与细腻的美学感官相结合，在旅途中总能携手寻觅到意想不到的绝美打卡地，共享浪漫。";
    } else if ((el1 === "metal" && el2 === "water") || (el2 === "metal" && el1 === "water")) {
      relationshipType = "금생수 (Metal Generates Water) 🌊";
      storyKo = "단단하고 정교한 금속(Metal)의 이성적인 지혜가 맑고 유연한 물(Water)을 끊임없이 샘솟게 하는 가장 아름다운 상생 인연입니다. 꼼꼼한 계획과 부드러운 즉흥성의 균형이 완벽하여 여행 스트레스가 전혀 없는 천생연분입니다.";
      storyEn = "The rational wisdom of Metal helps the clear, flexible Water flow beautifully. Your balance between thorough planning and soft spontaneity is flawless, ensuring a 100% stress-free journey.";
      storyJa = "精巧な金属(Metal)の知恵が、清らかで柔軟な水(Water)を絶え間なく湧き出させる相生の関係です。几帳面な計画と優しい即興性のバランスが完璧で、旅行中のストレスが全くない天性の一致です。";
      storyZh = "坚实精细的金属（Metal）之理性智慧，令清澈柔韧的水（Water）源源不断涌出的最美相生因缘。缜密的计划与温柔 of 即兴达成了完美平衡，是毫无旅行压力的天作之合。";
    } else {
      relationshipType = "수생목 (Water Nourishes Wood) 🌲";
      storyKo = "맑고 유연한 강물(Water)이 푸르른 나무(Wood)에게 마르지 않는 생명력을 불어넣는 궁합입니다! 미식의 즐거움과 끊임없는 도보 탐험이 하나 되어 발길 닿는 곳마다 활력이 솟아나고 웃음소리가 끊이지 않는 여행을 완성합니다.";
      storyEn = "Clear Water feeds the growing Wood with endless vitality! Amazing foodie hunting combines with endless walking exploration, fueling each step with dynamic energy, laughter, and high spirit.";
      storyJa = "澄んだ川の水(Water)が、青々とした木(Wood)に尽きない生命力を吹き込む素晴らしい相性です！美食の喜びと絶え間ない探検が一つになり、行く先々で活力が湧き上がり、笑い声の絶えない旅を完成させます。";
      storyZh = "清澈柔美之水（Water）为翠绿之木（Wood）注入不竭生命力的相配！美食享乐与永无休止的步行探索融为一体，所到之处皆能涌现无限活力，充满欢声笑语。";
    }

    return {
      score: 99,
      type: relationshipType,
      story: {
        ko: storyKo,
        en: storyEn,
        ja: storyJa,
        zh: storyZh
      }[l] || storyEn
    };
  }

  let storyKo = "";
  let storyEn = "";
  let storyJa = "";
  let storyZh = "";
  let relationshipType = "";

  if ((el1 === "wood" && el2 === "earth") || (el2 === "wood" && el1 === "earth")) {
    relationshipType = "목극토 (Wood Parts Earth) ⛰️";
    storyKo = "자유로운 나무(Wood)와 견고한 대지(Earth)의 이색적인 조합입니다. 한 명의 과감한 즉흥 본능과 다른 한 명의 철저한 사전 준비가 격렬하게 부딪치지만, 오히려 서로가 가진 최고의 장점을 이끌어내 주는 밀당 궁합입니다.";
    storyEn = "A dynamic mix of free-spirited Wood and firm Earth. Though spontaneous vibes and careful prep might clash initially, you bring out the best in each other, forming a highly exciting, balanced duo.";
    storyJa = "自由な木(Wood)と堅固な大地(Earth)のユニークな出会いです。一人の過激な即興本能と、もう一人の徹底した事前準備がぶつかり合いますが、かえって互いの最高の強みを引き出し合う魅力的なコンビです。";
    storyZh = "自由之木（Wood）与坚实大地（Earth）的奇特组合。一人果敢的即兴本能与另一人彻底的提前准备虽有碰撞，却反能激发出彼此最大的闪光点，是充满张力的互补型。";
  } else if ((el1 === "earth" && el2 === "water") || (el2 === "earth" && el1 === "water")) {
    relationshipType = "토극수 (Earth Blocks Water) 🌊";
    storyKo = "묵직한 바위(Earth)가 유연한 강물(Water)을 품격 있게 가두고 길을 안내하는 형국입니다. 물 흐르듯 가려던 즉흥적인 여정에 든든한 닻을 내려주어, 놓치지 말아야 할 필수 랜드마크와 한정판 숨은 미식을 완벽히 챙기게 만듭니다.";
    storyEn = "The massive Earth guides the flowing Water with structured banks. A steady anchor is dropped onto a fluid journey, ensuring you don't miss key landmarks and exclusive local food gems.";
    storyJa = "どっしりとした岩(Earth)が柔軟な川の水(Water)を品よく受け止め、道案内をする形です。水が流れるように行こうとする即興の旅に頼もしい錨を下ろし、見逃せない定番スポットや限定美食を完璧に制覇できます。";
    storyZh = "沉稳岩石（Earth）为流淌之水（Water）端庄筑堤并指引方向的格局。为随性漫流的即兴旅程落下一枚稳固的锚，让你们绝不会错过不可不去的标志景点与限量版隐藏美食。";
  } else if ((el1 === "water" && el2 === "fire") || (el2 === "water" && el1 === "fire")) {
    relationshipType = "수극화 (Water Extinguishes Fire) 🔥";
    storyKo = "차가운 물(Water)과 뜨거운 불(Fire)의 아주 극적인 결합입니다! 정반대의 매력에 서로 자석처럼 강하게 끌리며, 밤의 불꽃 같은 축제 열기와 낮의 고즈넉하고 여유로운 온천/카페 힐링의 다채로운 매력을 최고치로 즐깁니다.";
    storyEn = "A highly dramatic blend of cool Water and hot Fire! Opposites attract like magnets, allowing you to enjoy the absolute peak of both wild festival nights and serene, healing daytime coffee walks.";
    storyJa = "冷たい水(Water)と熱い炎(Fire)のとても劇的な出会いです！正反対의 魅力에 磁石처럼 强하게 引き寄せられ、夜の熱狂的なお祭りと、昼ののどかでゆったりとした温泉・カフェ巡りの魅力を最大に楽しめます。";
    storyZh = "冷水（Water）与烈火（Fire）的极具戏剧性结合！正相反的魅力使你们像磁铁般强烈吸引，既能把夜幕下的烟花庆典狂欢推向极致，又能充分感受白昼里宁静悠闲的温泉与咖啡馆治愈之旅。";
  } else if ((el1 === "fire" && el2 === "metal") || (el2 === "fire" && el1 === "metal")) {
    relationshipType = "화극금 (Fire Melts Metal) 💎";
    storyKo = "타오르는 불꽃(Fire)이 원석(Metal)을 정교하게 제련하여 가장 빛나는 다이아몬드로 완성하는 조합입니다! 서로 다른 텐션이 만나 창조적인 불꽃을 일으키며, 여행 중 가장 독특하고 힙한 예술 스폿을 정복할 힘을 얻습니다.";
    storyEn = "Blazing Fire refines raw Metal into a sparkling, dazzling diamond! Your different energy levels trigger creative sparks, giving you the power to conquer the trendiest art spots and hidden neon alleys.";
    storyJa = "燃え上がる炎(Fire)が金属(Metal)を精巧に鍛え上げ、最も輝くダイヤモンドに仕上げる組み合わせです！異なるテンションが出会い、創造的な火花を散らし、旅の中で最も個性的でヒップな芸術スポットを制覇する力を得ます。";
    storyZh = "熊熊烈火（Fire）将金属矿石（Metal）精细冶炼成最闪耀钻石的组合！截然不同的气场相遇碰撞出创造性的火花，赋予你们在旅途中征服最独特、最前卫艺术地标的能量。";
  } else {
    relationshipType = "금극목 (Metal Cuts Wood) 🌲";
    storyKo = "예리하고 반짝이는 칼날(Metal)이 드넓은 나무(Wood)를 멋진 예술품으로 정교하게 조각하는 인연입니다. 다소 느슨하고 즉흥적일 수 있는 나무의 발걸음에 보석 같은 정교함을 불어넣어 인생 최고의 효율적인 여정을 완성합니다.";
    storyEn = "A sharp, sparkling blade (Metal) sculpts the wild green tree (Wood) into a masterpiece. Adding premium organization to an otherwise loose, spontaneous stroll, resulting in the most efficient and memorable trip.";
    storyJa = "鋭く輝く刃(Metal)が、広大な木(Wood)を素敵な芸術品へと精巧に彫刻するような関係です。少しルーズで即興的になりがちな木の足取りに宝石のような精緻さを吹き込み、人生最高の効率的で輝く旅を完成させます。";
    storyZh = "锋利闪亮的刀刃（Metal）将参天大木（Wood）精巧雕琢成传世艺术品的缘分。为原本有些松散即兴的木之步伐，注入珠宝般的精致感，成就人生中最高效、最美满的旅行。";
  }

  return {
    score: 88,
    type: relationshipType,
    story: {
      ko: storyKo,
      en: storyEn,
      ja: storyJa,
      zh: storyZh
    }[l] || storyEn
  };
};

interface ProfileDetailSheetProps {
  profile: any | null;
  onClose: () => void;
  onLike?: () => void;
  onChat?: () => void;
  showActions?: boolean;
}
const ProfileDetailSheet = ({
  profile,
  onClose,
  onLike,
  onChat,
  showActions = true
}: ProfileDetailSheetProps) => {
  const {
    t
  } = useTranslation();
  const [photoIdx, setPhotoIdx] = useState(0);
  const {
    user
  } = useAuth();
  const [bioTranslated, setBioTranslated] = useState<string | null>(null);
  const [bioTranslating, setBioTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true); // default open
  const [myProfileData, setMyProfileData] = useState<any>(null);
  const [selectedIcebreaker, setSelectedIcebreaker] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      const getMyProfile = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setMyProfileData(data);
        }
      };
      getMyProfile();
    }
  }, [user?.id]);

  // UUID validation helper
  const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  useEffect(() => {
    if (profile?.id && user?.id && profile.id !== user.id && isValidUUID(profile.id)) {
      // 내 프로필 본 사람 방문 기록 저장
      const logView = async () => {
        const {
          data
        } = await supabase.from("profile_views").select("id").eq("viewer_id", user.id).eq("viewed_id", profile.id).maybeSingle();
        if (!data) {
          const {
            error
          } = await supabase.from("profile_views").insert({
            viewer_id: user.id,
            viewed_id: profile.id
          });
          if (error && error.code !== '23505') {
            // Ignore 409 conflict
            console.error("Failed to log profile view:", error.message);
          }
        }
      };
      logView();
    }
  }, [profile?.id, user?.id]);

  // profile이 바뀌면 번역 캐시 초기화
  useEffect(() => {
    setBioTranslated(null);
    setShowTranslation(true);
    setPhotoIdx(0); // 사진 인덱스도 리셋
  }, [profile?.id]);

  // Auto-translate bio on open
  useEffect(() => {
    if (!profile?.bio) return;
    const doTranslate = async () => {
      setBioTranslating(true);
      try {
        const lang = i18n.language?.split('-')[0] || 'ko';
        const result = await translateText({
          text: profile.bio,
          targetLang: lang as any
        });
        if (result !== profile.bio) setBioTranslated(result);
      } catch (_) {
        // silently fail
      } finally {
        setBioTranslating(false);
      }
    };
    doTranslate();
  }, [profile?.id, profile?.bio]);
  // AI 성향 궁합 피드백 코칭 생성
  const getChemistryAdvice = (p: any, my: any) => {
    if (!my) return "Migo Plus로 가입하거나 로그인하시면 두 분만의 상세한 취향 분석 가이드를 열람하실 수 있습니다. ✨";
    const mbti = p.mbti || "";
    const myMbti = my.mbti || "";
    const isSpontaneous = mbti.includes("P") || p.travelMission === "즉흥 번개" || (p.interests && p.interests.includes("즉흥"));
    const mySpontaneous = myMbti.includes("P") || my.travel_mission === "즉흥 번개" || (my.interests && my.interests.includes("즉흥"));
    const isFoodie = p.travelMission?.includes("맛집") || p.interests?.some((i: string) => i.includes("맛집") || i.includes("미식"));
    const myFoodie = my.travel_mission?.includes("맛집") || my.interests?.some((i: string) => i.includes("맛집") || i.includes("미식"));
    
    if (isSpontaneous && mySpontaneous) {
      return "두 분은 무계획 즉흥 여행에서 최고의 행복을 느끼는 '완벽한 번개 소울메이트'입니다! 빡빡한 타임라인 대신 끌리는 골목길로 가벼운 발걸음을 옮길 때 시너지가 200% 납니다. 오늘 도쿄 골목 선술집이나 미식 투어를 즉흥적으로 같이 도전해보세요. 🌃";
    }
    if (isFoodie && myFoodie) {
      return "미식 탐험에 진심인 두 분! 로컬 숨겨진 이자카야 골목부터 예약 없이는 못 가는 핫플 디저트 카페까지 최고의 먹방 투어가 가능합니다. 서로 사진을 100장씩 찍어주며 음식을 정복하는 미식 번개를 적극 추천합니다! 🍲";
    }
    if (isSpontaneous && !mySpontaneous) {
      return "체계적인 계획파인 나(J)와 유연하고 즉흥적인 상대(P)의 보완적인 조합입니다! 한 명이 든든하게 중심 이동 경로를 잡고, 상대방이 예기치 못한 당일치기 모험의 즐거움을 더해준다면 가장 완벽하고 균형 잡힌 꿀조합이 완성됩니다. ⚖️";
    }
    if (mbti === myMbti && mbti) {
      return `서로 성향이 같은 '${mbti}'로 통합니다! 대화 스타일이나 체력 충전 주기 등이 물 흐르듯 비슷하여, 어색하게 애쓰지 않아도 노을 지는 강변이나 야경을 보며 편안하고 기분 좋은 침묵을 나눌 수 있는 최적의 여행 파트너입니다. 🌅`;
    }
    return "서로 다른 취향이 신선한 조화를 이루는 영양가 높은 인연입니다. 한 명의 액티브한 로컬 퀘스트 도전에 다른 한 명이 고즈넉한 카페 힐링 일정을 보태면서, 혼자라면 가보지 않았을 여행의 경계를 기분 좋게 확장하게 됩니다! ✈️";
  };

  // AI 아이스브레이커 덱 카드 리스트
  const getIcebreakerQuestions = (p: any, my: any) => {
    const mission = p.travelMission || "로컬 번개";
    return [
      {
        id: "photo",
        icon: "📸",
        title: "인생샷 미션",
        desc: "사진 찍어주기",
        question: `안녕하세요! 두 분 모두 여행 중에 서로 인생샷 건지는 걸 정말 좋아하시네요! 📸 서로 도쿄 골목에서 전신 인생샷 100장씩 찍어주며 경쟁해 볼까요?`
      },
      {
        id: "food",
        icon: "🍲",
        title: "비밀 로컬 미식",
        desc: "이자카야 맛집",
        question: `안녕하세요! 성향 궁합에서 미식 코드가 정말 높게 매칭되셨어요! 🍲 현지인만 아는 비밀 이자카야 맛집이나 숨겨진 로컬 꼬치구이 골목 오늘 저녁 같이 도장 깨기 하실래요?`
      },
      {
        id: "spontaneous",
        icon: "🎲",
        title: "즉흥 번개 퀘스트",
        desc: "성향 매칭 질문",
        question: `안녕하세요! MIGO 궁합에서 '${mission}' 케미가 아주 훌륭하게 나오셨어요! 🎲 오늘 오후 일정 없으시면 즉흥적으로 시부야 스크램블 교차로 근처 이색 카페에서 가볍게 커피 번개 어떠세요?`
      }
    ];
  };

  if (!profile) return null;

  // 여러 사진 지원 — photo_urls 또는 단일 photo
  const photos: string[] = profile.photoUrls && profile.photoUrls.length > 0 ? profile.photoUrls.filter((u: string) => !!u) : [profile.photo].filter((u: string | undefined): u is string => !!u);
  const travelStyles: string[] = Array.isArray(profile.travelStyle) ? profile.travelStyle : Array.isArray(profile.tags) ? profile.tags : [];
  const languages: string[] = Array.isArray(profile.languages) ? profile.languages : [];
  const scoreColor = (profile.matchScore ?? 0) >= 80 ? "text-emerald-400" : (profile.matchScore ?? 0) >= 60 ? "text-yellow-400" : "text-muted-foreground";
  const prevPhoto = () => setPhotoIdx(i => Math.max(0, i - 1));
  const nextPhoto = () => setPhotoIdx(i => Math.min(photos.length - 1, i + 1));
  return <AnimatePresence>
      {profile && <motion.div className="fixed inset-0 z-[70] flex items-end justify-center px-safe pb-safe pt-safe" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-foreground/70 backdrop-blur-md" onClick={onClose} />

          <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 overflow-hidden shadow-float max-h-[92vh] flex flex-col" initial={{
        y: "100%"
      }} animate={{
        y: 0
      }} exit={{
        y: "100%"
      }} transition={{
        type: "spring",
        damping: 28,
        stiffness: 300
      }}>
            {/* ── Theme & Premium Border ── */}
            {(() => {
              let shadows: string[] = [];

              if (profile.isPremium) {
                shadows.push("inset 0 0 0 4px rgba(251,191,36,1)"); // Gold Border for Premium
              } else if (profile.profileTheme && profile.profileTheme !== 'default') {
                const THEME_BORDERS: Record<string, string> = {
                  aurora: "inset 0 0 0 4px rgba(168,85,247,0.8)",
                  sunset: "inset 0 0 0 4px rgba(244,63,94,0.8)",
                  neon: "inset 0 0 0 4px rgba(6,182,212,0.8)",
                  midnight: "inset 0 0 0 4px rgba(30,41,59,0.9)",
                };
                shadows.push(THEME_BORDERS[profile.profileTheme] || THEME_BORDERS.aurora);
              }

              if (profile.profileTheme && profile.profileTheme !== 'default') {
                const THEME_GLOWS: Record<string, string> = {
                  aurora: "0 0 40px rgba(168,85,247,0.4)",
                  sunset: "0 0 40px rgba(244,63,94,0.4)",
                  neon: "0 0 40px rgba(6,182,212,0.4)",
                  midnight: "0 0 40px rgba(15,23,42,0.6)",
                };
                shadows.push(THEME_GLOWS[profile.profileTheme] || THEME_GLOWS.aurora);
              } else if (profile.isPremium) {
                shadows.push("0 0 30px rgba(251,191,36,0.3)");
              }

              if (shadows.length > 0) {
                return <div className="absolute inset-0 pointer-events-none rounded-3xl z-20" style={{ boxShadow: shadows.join(", ") }} />;
              }
              return null;
            })()}
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1">

              {/* ── Hero image with multi-photo slider ── */}
              <div className="relative h-72 w-full shrink-0 bg-muted overflow-hidden">

                {/* Main photo with fade animation */}
                <AnimatePresence initial={false} mode="wait">
                  {photos[photoIdx] ? (
                    <motion.img
                      key={photoIdx}
                      src={photos[photoIdx]}
                      alt={profile.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      onError={e => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        e.currentTarget.parentElement?.classList.add('gradient-primary');
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 gradient-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-6xl font-extrabold">{profile.name?.[0] ?? "?"}</span>
                    </div>
                  )}
                </AnimatePresence>

                {/* ── Theme custom bottom gradient ── */}
                {(() => {
                  let gradClass = "from-card via-card/20 to-transparent";
                  if (profile.profileTheme === "aurora") gradClass = "from-purple-900/90 via-purple-900/30 to-transparent";
                  if (profile.profileTheme === "sunset") gradClass = "from-pink-900/90 via-pink-900/30 to-transparent";
                  if (profile.profileTheme === "neon") gradClass = "from-cyan-900/90 via-cyan-900/30 to-transparent";
                  if (profile.profileTheme === "midnight") gradClass = "from-black/95 via-black/40 to-transparent";
                  
                  return <div className={`absolute inset-0 bg-gradient-to-t ${gradClass} pointer-events-none`} />;
                })()}

                {/* ── Invisible tap zones for swipe (left 40% / right 40%) ── */}
                {photos.length > 1 && (
                  <>
                    <div
                      className="absolute top-0 bottom-16 left-0 w-2/5 z-20 cursor-pointer"
                      onClick={() => setPhotoIdx(i => Math.max(0, i - 1))}
                    />
                    <div
                      className="absolute top-0 bottom-16 right-0 w-2/5 z-20 cursor-pointer"
                      onClick={() => setPhotoIdx(i => Math.min(photos.length - 1, i + 1))}
                    />
                  </>
                )}

                {/* ── Top: progress dots + counter pill ── */}
                {photos.length > 1 && (
                  <div className="absolute top-3 left-3 right-3 flex items-center gap-2 z-30 pointer-events-none">
                    {/* Dot progress bar */}
                    <div className="flex gap-1 flex-1">
                      {photos.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-200 ${i === photoIdx ? "bg-white" : "bg-white/40"}`}
                        />
                      ))}
                    </div>
                    {/* n/total pill */}
                    <div className="bg-black/55 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-0.5 pointer-events-auto shrink-0">
                      <span className="text-[11px] font-extrabold text-white leading-none">{photoIdx + 1}</span>
                      <span className="text-[10px] text-white/50 leading-none mx-0.5">/</span>
                      <span className="text-[11px] font-bold text-white/80 leading-none">{photos.length}</span>
                    </div>
                  </div>
                )}

                {/* ── Prev / Next chevron buttons ── */}
                {photos.length > 1 && <>
                    {photoIdx > 0 && (
                      <button
                        onClick={prevPhoto}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/70 backdrop-blur-sm flex items-center justify-center z-30 shadow-sm"
                      >
                        <ChevronLeft size={16} className="text-foreground" />
                      </button>
                    )}
                    {photoIdx < photos.length - 1 && (
                      <button
                        onClick={nextPhoto}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/70 backdrop-blur-sm flex items-center justify-center z-30 shadow-sm"
                      >
                        <ChevronRight size={16} className="text-foreground" />
                      </button>
                    )}
                  </>}

                {/* Close button */}
                <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-card/80 backdrop-blur-sm flex items-center justify-center shadow-card z-30">
                  <X size={16} className="text-foreground" />
                </button>

                {/* Match score badge */}
                <div
                  className="absolute left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card/80 backdrop-blur-sm shadow-card z-30"
                  style={{ top: photos.length > 1 ? '3.25rem' : '1rem' }}
                >
                  <Zap size={12} className={scoreColor} />
                  <span className={`text-xs font-extrabold ${scoreColor}`}>{i18n.t('profileDetail.matchScore', {
                  score: profile.matchScore ?? '?'
                })}</span>
                </div>

                {/* Name overlay */}
                <div className="absolute bottom-4 left-5 right-5 z-10 min-w-0">
                  <div className="flex items-center gap-2 flex-nowrap overflow-hidden">
                    <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="truncate">{profile.name}</span>
                      <span className="text-xl font-medium text-foreground/80 shrink-0">{profile.age && `, ${profile.age}`}</span>
                      {profile.nationality && <span className="text-xl ml-1 drop-shadow-sm shrink-0">{profile.nationality.match(/[^\x00-\x7F가-힣a-zA-Z]+/g)?.[0]?.trim() || profile.nationality}</span>}
                      {profile.isPlus && <span className="shrink-0"><Crown size={18} className="text-amber-500 fill-amber-500 ml-0.5" /></span>}
                      {profile.verified && <span className="shrink-0"><VerifyBadge level={profile.verifyLevel} /></span>}
                      {(profile.id_verified || profile.ticketVerified) && (
                        <span className="shrink-0 inline-flex items-center gap-1 bg-gradient-to-r from-emerald-400 to-teal-500 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(52,211,153,0.3)] border border-emerald-300 pointer-events-none text-white text-[9px] font-extrabold uppercase tracking-widest">
                          ✈️ Real Traveler
                        </span>
                      )}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <MapPin size={13} className="text-primary" />
                    <span className="text-sm text-muted-foreground border-r border-border pr-2 truncate">
                      {profile.location || i18n.t('profileDetail.noLocation')}{profile.distance ? ` · ${profile.distance}` : ""}
                    </span>
                    {profile.avgRating && <div className="flex items-center gap-1 bg-amber-400/15 px-2 py-0.5 rounded-full ml-1">
                        <Star size={11} className="text-amber-500 fill-amber-500" />
                        <span className="text-amber-600 dark:text-amber-400 text-xs font-extrabold">{profile.avgRating.toFixed(1)}</span>
                        {profile.reviewCount > 0 && <span className="text-amber-600/70 dark:text-amber-400/70 text-[10px]">({profile.reviewCount})</span>}
                      </div>}
                  </div>
                </div>
              </div>

              {/* ── Photo thumbnail strip — only when 2+ photos ── */}
              {photos.length > 1 && (
                <div className="px-4 pt-3 pb-0 border-b border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest truncate">{i18n.t("auto.g_0197", "사진")}</span>
                    <span className="text-[10px] font-bold bg-primary/10 text-primary rounded-full px-1.5 py-0.5 truncate">{photos.length}{i18n.t("auto.g_0198", "장")}</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-3 hide-scrollbar">
                    {photos.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setPhotoIdx(i)}
                        className={`relative shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden border-2 transition-all duration-150 ${
                          i === photoIdx
                            ? 'border-primary shadow-[0_0_0_3px_rgba(var(--primary)/0.2)]'
                            : 'border-transparent opacity-60 hover:opacity-90'
                        }`}
                      >
                        <img
                          src={url}
                          alt={`photo ${i + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {/* Selected overlay */}
                        {i === photoIdx && (
                          <div className="absolute inset-0 bg-primary/15 rounded-xl" />
                        )}
                        {/* Index badge */}
                        <div className="absolute bottom-1 right-1 bg-black/60 rounded-md text-[9px] text-white font-extrabold px-1 leading-tight">
                          {i + 1}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="px-5 py-4 space-y-4">

                {/* Bio with translation toggle */}
                {profile.bio && <div className="bg-muted/40 rounded-2xl p-4 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest truncate">{i18n.t("auto.z_\uC790\uAE30\uC18C\uAC1C_1276", "\uC790\uAE30\uC18C\uAC1C")}</p>
                      {profile.bio && <button onClick={() => setShowTranslation(v => !v)} className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition-all ${showTranslation ? "bg-primary/15 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"}`}>
                          {bioTranslating ? <Loader2 size={10} className="animate-spin" /> : <Languages size={10} />}{i18n.t("auto.z_\uBC88\uC5ED_1277", "\uBC88\uC5ED")}{showTranslation ? "ON" : "OFF"}
                        </button>}
                    </div>
                    {/* Original bio */}
                    <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>
                    {/* Translated bio */}
                    {showTranslation && bioTranslated && bioTranslated !== profile.bio && <div className="mt-2.5 pt-2.5 border-t border-border/60">
                        <p className="text-[10px] text-primary font-bold mb-1 flex items-center gap-1 truncate">
                          <Languages size={9} />{i18n.t("auto.z_\uBC88\uC5ED_1278", "\uBC88\uC5ED")}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{bioTranslated}</p>
                      </div>}
                    {showTranslation && bioTranslating && <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                        <Loader2 size={12} className="animate-spin" />{i18n.t("auto.z_\uBC88\uC5ED\uC911_1279", "\uBC88\uC5ED\uC911")}</div>}
                  </div>}

                {/* Trip info */}
                {(profile.destination || profile.dates) && <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted">
                    <Calendar size={15} className="text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium truncate">{i18n.t('profileDetail.tripInfo')}</p>
                      <p className="text-sm font-bold text-foreground">
                        {[profile.destination, profile.dates].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>}

                {/* MBTI + Gender row */}
                <div className="flex gap-2 truncate">
                  {profile.mbti && <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-primary/10 flex-1">
                      <Sparkles size={13} className="text-primary shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground font-medium">MBTI</p>
                        <p className="text-sm font-bold text-foreground">{profile.mbti}</p>
                      </div>
                    </div>}
                  {profile.gender && <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-muted flex-1">
                      <User size={13} className="text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground font-medium truncate">{i18n.t('profileDetail.gender')}</p>
                        <p className="text-sm font-bold text-foreground">{profile.gender}</p>
                      </div>
                    </div>}
                </div>

                {/* Travel style tags */}
                {travelStyles.length > 0 && <div>
                    <p className="text-xs font-bold text-muted-foreground mb-2 truncate">{i18n.t('profileDetail.travelStyle')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {travelStyles.map(s => <span key={s} className="px-3 py-1.5 rounded-xl text-xs font-semibold gradient-primary text-primary-foreground">
                          {s}
                        </span>)}
                    </div>
                  </div>}

                {/* Languages */}
                {languages.length > 0 && <div>
                    <p className="text-xs font-bold text-muted-foreground mb-2 truncate">{i18n.t('profileDetail.languages')}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Globe size={13} className="text-muted-foreground" />
                      {languages.map(l => <span key={l} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted text-foreground">{l}</span>)}
                    </div>
                  </div>}

                {/* 🧬 AI 5D 여행 DNA 궁합 Sandbox */}
                <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm space-y-4 mt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg animate-pulse">🔮</span>
                      <div>
                        <h4 className="text-sm font-black text-foreground leading-tight">AI 5D 여행 궁합 리포트</h4>
                        <p className="text-[10px] text-muted-foreground">성향 매칭 알고리즘 2.0</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-1 rounded-full shrink-0">
                      {profile.matchScore || 85}% 매치
                    </span>
                  </div>
                  
                  {/* Travel DNA Radar arcs */}
                  <div className="py-1 border-y border-border/40 my-1 pointer-events-auto">
                    <TravelDNA profile={profile} myProfile={myProfileData} compact={false} />
                  </div>

                  {/* AI Chemistry Advice */}
                  <div className="bg-muted/65 rounded-xl p-3 border border-border/50 text-xs leading-relaxed space-y-2">
                    <p className="font-extrabold text-foreground flex items-center gap-1">
                      <span>⚡</span> MIGO AI 성향 코칭 가이드
                    </p>
                    <p className="text-muted-foreground leading-relaxed whitespace-normal break-words">
                      {getChemistryAdvice(profile, myProfileData)}
                    </p>
                  </div>
                </div>

                {/* ☯️ Korean Traditional Saju Destiny Compass */}
                {(() => {
                  const targetElementKey = calculateSajuElement(profile);
                  const myElementKey = myProfileData ? calculateSajuElement(myProfileData) : null;
                  const lang = (i18n.language?.split('-')[0] || 'ko').toLowerCase();

                  const targetEl = SAJU_ELEMENTS[targetElementKey];
                  const myEl = myElementKey ? SAJU_ELEMENTS[myElementKey] : null;

                  const titleLabel = {
                    ko: "☯️ 한국 전통 음양오행 사주 나침반",
                    en: "☯️ Korean Traditional Saju Destiny Compass",
                    ja: "☯️ 韓国伝統の陰陽五行・四柱推命羅針盤",
                    zh: "☯️ 韩国传统阴阳五行八字罗盘"
                  }[lang] || "☯️ Korean Traditional Saju Destiny Compass";

                  const subtitleLabel = {
                    ko: "K-컬처 전통 사주 궁합 분석",
                    en: "Traditional K-Fortune Chemistry Analyzer",
                    ja: "K-Culture 伝統の四柱推命ケミ分析",
                    zh: "K-Culture 传统八字契合度分析"
                  }[lang] || "Traditional K-Fortune Chemistry Analyzer";

                  const myElementLabel = {
                    ko: "나의 여행 오행",
                    en: "My Saju Element",
                    ja: "私の五行元素",
                    zh: "我的五行元素"
                  }[lang] || "My Saju Element";

                  const targetElementLabel = {
                    ko: `${profile.name}님의 여행 오행`,
                    en: `${profile.name}'s Element`,
                    ja: `${profile.name}さんの五行`,
                    zh: `${profile.name}的五行`
                  }[lang] || `${profile.name}'s Element`;

                  const compatibilityStory = myElementKey 
                    ? getSajuCompatibility(myElementKey, targetElementKey, lang)
                    : null;

                  const loginPrompt = {
                    ko: "Migo Plus 가입 및 본인 프로필 생성을 완료하시면, 음양오행 사주 나침반을 회전하여 두 분만의 신비롭고 시적인 한국 전통 운명 궁합 리포트를 보실 수 있습니다. ✨",
                    en: "Complete your profile or join Migo Plus to spin the traditional Yin-Yang Compass and unlock your poetic Korean Saju travel compatibility report! ✨",
                    ja: "プロフィール作成またはログインを完了すると、陰陽五行羅針盤を回転させ、お二人の神秘的で詩的な韓国伝統運命相性レポートを閲覧できます。 ✨",
                    zh: "完成个人资料或登录后，即可旋转阴阳五行八字罗盘，解锁专属你们的神秘、诗意韩国传统运势契合度报告！ ✨"
                  }[lang] || "Complete your profile to unlock your Korean Saju travel compatibility report! ✨";

                  return (
                    <div className="relative overflow-hidden bg-gradient-to-b from-amber-950/20 to-card border border-amber-500/25 rounded-2xl p-4 shadow-lg shadow-amber-500/5 mt-3 space-y-4">
                      {/* Background decorations */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-20 h-20 bg-amber-600/5 rounded-full blur-2xl pointer-events-none" />

                      {/* Card Header */}
                      <div className="flex items-center justify-between border-b border-amber-500/10 pb-2.5">
                        <div className="flex items-center gap-2">
                          <motion.span 
                            className="text-xl inline-block"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                          >
                            ☯️
                          </motion.span>
                          <div>
                            <h4 className="text-sm font-black text-amber-400 tracking-wide leading-tight">
                              {titleLabel}
                            </h4>
                            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
                              {subtitleLabel}
                            </p>
                          </div>
                        </div>
                        {compatibilityStory && (
                          <span className="text-[10px] font-black text-amber-500 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full shrink-0">
                            {compatibilityStory.score}% Spark
                          </span>
                        )}
                      </div>

                      {/* Rotating Saju Compass Wheel UI */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-3 bg-muted/20 rounded-xl border border-amber-500/5">
                        <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
                          {/* Outer Ring with 8 Trigrams (팔괘) / Celestial Markings */}
                          <motion.div
                            className="absolute inset-0 rounded-full border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent flex items-center justify-center"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                          >
                            {/* Celestial ticks */}
                            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                              <span
                                key={deg}
                                className="absolute text-[6px] font-black text-amber-500/30 select-none"
                                style={{ transform: `rotate(${deg}deg) translateY(-40px)` }}
                              >
                                {deg === 0 ? "乾" : deg === 45 ? "兌" : deg === 90 ? "離" : deg === 135 ? "震" : deg === 180 ? "巽" : deg === 225 ? "坎" : deg === 270 ? "艮" : "坤"}
                              </span>
                            ))}
                          </motion.div>

                          {/* Inner Yin-Yang Compass Wheel */}
                          <motion.div
                            className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500/10 to-amber-600/30 border border-amber-500/40 shadow-inner flex items-center justify-center relative cursor-pointer"
                            whileTap={{ scale: 0.9 }}
                            animate={{ rotate: -360 }}
                            transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                          >
                            {/* Yin-Yang Center Logo */}
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-600 to-blue-600 flex items-center justify-center opacity-80 shadow-md">
                              <span className="text-[10px] text-white font-black select-none">☯️</span>
                            </div>
                            {/* Pointer needle */}
                            <div className="absolute top-1/2 left-1/2 w-8 h-0.5 bg-gradient-to-r from-amber-400 to-transparent origin-left -translate-y-1/2" />
                          </motion.div>
                        </div>

                        {/* Elements Comparison Grid */}
                        <div className="flex-1 w-full space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-center">
                            {/* My Element */}
                            <div className="bg-muted/40 border border-border/60 rounded-xl p-2 flex flex-col items-center">
                              <p className="text-[9px] text-muted-foreground font-semibold mb-0.5">{myElementLabel}</p>
                              {myEl ? (
                                <div className="flex flex-col items-center">
                                  <span className="text-xl filter drop-shadow">{myEl.emoji}</span>
                                  <p className="text-[10px] font-black text-foreground mt-0.5 whitespace-normal break-words leading-snug">
                                    {myEl.shortName[lang] || myEl.shortName.en}
                                  </p>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center py-0.5">
                                  <span className="text-lg">❓</span>
                                  <p className="text-[9px] text-muted-foreground font-medium">Locked</p>
                                </div>
                              )}
                            </div>

                            {/* Target Element */}
                            <div className="bg-muted/40 border border-border/60 rounded-xl p-2 flex flex-col items-center">
                              <p className="text-[9px] text-muted-foreground font-semibold mb-0.5">{targetElementLabel}</p>
                              <div className="flex flex-col items-center">
                                <span className="text-xl filter drop-shadow">{targetEl.emoji}</span>
                                <p className="text-[10px] font-black text-foreground mt-0.5 whitespace-normal break-words leading-snug">
                                  {targetEl.shortName[lang] || targetEl.shortName.en}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Saju Description for the profile owner */}
                          <div className="text-[10px] text-muted-foreground bg-muted/20 border border-border/40 rounded-xl p-2.5 leading-relaxed whitespace-normal break-words">
                            <p className="font-extrabold text-foreground mb-1 flex items-center gap-1">
                              <span>{targetEl.emoji}</span> {targetEl.name[lang] || targetEl.name.en}
                            </p>
                            {targetEl.desc[lang] || targetEl.desc.en}
                          </div>
                        </div>
                      </div>

                      {/* Compatibility Poetic Story or Premium CTA */}
                      {compatibilityStory ? (
                        <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 text-xs leading-relaxed space-y-1.5">
                          <p className="font-black text-amber-400 flex items-center gap-1.5">
                            <span>✨</span> {compatibilityStory.type}
                          </p>
                          <p className="text-muted-foreground leading-relaxed whitespace-normal break-words">
                            {compatibilityStory.story}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-muted/65 border border-border/50 rounded-xl p-3 text-xs leading-relaxed text-center space-y-1 relative overflow-hidden">
                          <p className="text-muted-foreground leading-relaxed whitespace-normal break-words blur-[0.3px]">
                            {loginPrompt}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 🃏 AI 아이스브레이커 카드 덱 */}
                <div className="space-y-3 mt-4">
                  <div>
                    <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 truncate">
                      <span>🃏</span> AI 아이스브레이커 카드 덱
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{i18n.t("auto.ko_deck_desc", { defaultValue: "성향 궁합 맞춤형 대화 추천 덱입니다. 탭하여 카드를 골라보세요!" })}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pointer-events-auto">
                    {getIcebreakerQuestions(profile, myProfileData).map((c) => (
                      <motion.button
                        key={c.id}
                        whileTap={{ scale: 0.95, y: 2 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
                          setSelectedIcebreaker(selectedIcebreaker === c.id ? null : c.id);
                        }}
                        className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-between gap-1.5 transition-all ${
                          selectedIcebreaker === c.id
                            ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-400 shadow-md shadow-amber-500/10 ring-1 ring-amber-400'
                            : 'bg-muted/40 border-border hover:bg-muted'
                        }`}
                      >
                        <span className="text-2xl filter drop-shadow">{c.icon}</span>
                        <div className="min-w-0">
                          <p className={`text-[10px] font-black truncate ${selectedIcebreaker === c.id ? 'text-amber-500' : 'text-foreground'}`}>
                            {c.title}
                          </p>
                          <p className="text-[8px] text-muted-foreground truncate leading-none mt-0.5">{c.desc}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Selected card detail bubble */}
                  <AnimatePresence>
                    {selectedIcebreaker && (() => {
                      const activeCard = getIcebreakerQuestions(profile, myProfileData).find(c => c.id === selectedIcebreaker);
                      if (!activeCard) return null;
                      return (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-transparent border border-amber-300/30 rounded-2xl p-4 space-y-3 mt-1.5 pointer-events-auto">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                                🔮 AI 추천 대화 첫마디
                              </span>
                              {/* Close */}
                              <button 
                                onClick={() => setSelectedIcebreaker(null)}
                                className="text-muted-foreground hover:text-foreground text-xs font-bold"
                              >
                                ✕
                              </button>
                            </div>
                            
                            <p className="text-xs text-foreground leading-relaxed font-semibold italic bg-card/45 p-3 rounded-xl border border-border/50">
                              "{activeCard.question}"
                            </p>

                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={() => {
                                // Copy to clipboard & trigger chat action
                                navigator.clipboard.writeText(activeCard.question).catch(() => {});
                                if (onChat) {
                                  onChat();
                                  onClose();
                                }
                              }}
                              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-[11px] shadow-md flex items-center justify-center gap-1.5"
                            >
                              <span>💬</span> 이 질문을 복사하고 대화 시작하기
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Action buttons — sticky bottom */}
            {showActions && <div className="flex gap-3 px-5 pb-10 pt-3 border-t border-border/30 bg-card shrink-0 truncate">
                {onLike && <motion.button whileTap={{
            scale: 0.95
          }} onClick={() => {
            onLike();
            onClose();
          }} className="flex-1 py-3.5 rounded-2xl gradient-primary text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-float">
                    <Heart size={18} fill="currentColor" /> {i18n.t('profileDetail.like')}
                  </motion.button>}
                {onChat && <motion.button whileTap={{
            scale: 0.95
          }} onClick={() => {
            onChat();
            onClose();
          }} className="flex-1 py-3.5 rounded-2xl bg-muted text-foreground font-bold flex items-center justify-center gap-2">
                    <MessageCircle size={18} /> {i18n.t('profileDetail.chat')}
                  </motion.button>}
              </div>}
          </motion.div>
        </motion.div>}
    </AnimatePresence>;
};
export default ProfileDetailSheet;