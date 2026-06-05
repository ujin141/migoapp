import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  ArrowRight, 
  Download, 
  Lock, 
  MapPin, 
  RotateCcw, 
  Share2, 
  Compass, 
  Users,
  Image as ImageIcon,
  User
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import LanguagePicker from "@/components/LanguagePicker";

// Saju Element Profile Templates mapped to i18n keys
const SAJU_DATA = {
  wood: {
    emoji: "🌲",
    color: "from-emerald-500 to-teal-600",
    textBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    glowColor: "shadow-emerald-500/20",
    nameKey: "travelDna.elements.wood.name",
    shortNameKey: "travelDna.elements.wood.shortName",
    descKey: "travelDna.elements.wood.desc",
    tags: ["#Spontaneous", "#NatureLover", "#RoadTrip", "#Wanderlust"]
  },
  fire: {
    emoji: "🔥",
    color: "from-rose-500 to-orange-600",
    textBg: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    glowColor: "shadow-rose-500/20",
    nameKey: "travelDna.elements.fire.name",
    shortNameKey: "travelDna.elements.fire.shortName",
    descKey: "travelDna.elements.fire.desc",
    tags: ["#Nightlife", "#Festivals", "#SocialButterfly", "#PartyAnimal"]
  },
  earth: {
    emoji: "⛰️",
    color: "from-amber-600 to-yellow-700",
    textBg: "bg-amber-600/10 text-amber-400 border-amber-600/30",
    glowColor: "shadow-amber-600/20",
    nameKey: "travelDna.elements.earth.name",
    shortNameKey: "travelDna.elements.earth.shortName",
    descKey: "travelDna.elements.earth.desc",
    tags: ["#ItineraryKing", "#HistoryBuff", "#SafetyFirst", "#DetailOriented"]
  },
  metal: {
    emoji: "💎",
    color: "from-cyan-500 to-blue-600",
    textBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    glowColor: "shadow-cyan-500/20",
    nameKey: "travelDna.elements.metal.name",
    shortNameKey: "travelDna.elements.metal.shortName",
    descKey: "travelDna.elements.metal.desc",
    tags: ["#AestheticView", "#MuseumLover", "#InstaWorthy", "#VintageBoutiques"]
  },
  water: {
    emoji: "🌊",
    color: "from-sky-500 to-indigo-600",
    textBg: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    glowColor: "shadow-sky-500/20",
    nameKey: "travelDna.elements.water.name",
    shortNameKey: "travelDna.elements.water.shortName",
    descKey: "travelDna.elements.water.desc",
    tags: ["#FoodieHeaven", "#StreetFood", "#LocalAlleys", "#Adaptable"]
  }
};

const COMPATIBILITY_SCORES: Record<string, Record<string, number>> = {
  wood: { wood: 80, fire: 95, earth: 60, metal: 55, water: 90 },
  fire: { wood: 95, fire: 80, earth: 90, metal: 50, water: 45 },
  earth: { wood: 60, fire: 90, earth: 80, metal: 85, water: 65 },
  metal: { wood: 55, fire: 50, earth: 85, metal: 80, water: 92 },
  water: { wood: 90, fire: 45, earth: 65, metal: 92, water: 80 }
};

const QUESTIONS = [
  {
    titleKey: "travelDna.questions.0.title",
    options: [
      { textKey: "travelDna.questions.0.options.0", value: 0 },
      { textKey: "travelDna.questions.0.options.1", value: 1 }
    ]
  },
  {
    titleKey: "travelDna.questions.1.title",
    options: [
      { textKey: "travelDna.questions.1.options.0", value: 0 },
      { textKey: "travelDna.questions.1.options.1", value: 1 }
    ]
  },
  {
    titleKey: "travelDna.questions.2.title",
    options: [
      { textKey: "travelDna.questions.2.options.0", value: 0 },
      { textKey: "travelDna.questions.2.options.1", value: 1 }
    ]
  },
  {
    titleKey: "travelDna.questions.3.title",
    options: [
      { textKey: "travelDna.questions.3.options.0", value: 0 },
      { textKey: "travelDna.questions.3.options.1", value: 1 }
    ]
  }
];

// Mock travelers database mapped to archetypes to trigger FOMO
const MOCK_TRAVELERS = {
  wood: [
    { name: "MigoExplorer", distance: 1.2, match: 98, tags: ["#Spontaneous", "#RoadTrip"] },
    { name: "Yuki_Tokyo", distance: 2.4, match: 92, tags: ["#NatureLover", "#Hiking"] },
    { name: "BackpackDan", distance: 4.1, match: 89, tags: ["#Wanderlust", "#SoloTravel"] }
  ],
  fire: [
    { name: "FestivalQueen", distance: 0.8, match: 99, tags: ["#Nightlife", "#Festivals"] },
    { name: "Carlos_Bcn", distance: 1.9, match: 95, tags: ["#SocialButterfly", "#PubCrawl"] },
    { name: "VibeSeeker", distance: 3.5, match: 91, tags: ["#PartyAnimal", "#LiveMusic"] }
  ],
  earth: [
    { name: "ItineraryGuru", distance: 1.5, match: 97, tags: ["#ItineraryKing", "#HistoryBuff"] },
    { name: "SafeBasecamp", distance: 2.8, match: 94, tags: ["#SafetyFirst", "#NatureTrails"] },
    { name: "CulturalGuide", distance: 5.2, match: 88, tags: ["#DetailOriented", "#Museums"] }
  ],
  metal: [
    { name: "AestheticVoyager", distance: 1.1, match: 98, tags: ["#AestheticView", "#InstaWorthy"] },
    { name: "Artsy_Chloe", distance: 2.3, match: 93, tags: ["#MuseumLover", "#Design"] },
    { name: "BoutiqueHunter", distance: 3.9, match: 90, tags: ["#VintageBoutiques", "#Cafes"] }
  ],
  water: [
    { name: "FoodieHeaven", distance: 0.9, match: 99, tags: ["#FoodieHeaven", "#StreetFood"] },
    { name: "LocalFlavors", distance: 2.1, match: 96, tags: ["#LocalAlleys", "#Adaptable"] },
    { name: "CafeConnoisseur", distance: 4.3, match: 87, tags: ["#CozyCafes", "#HiddenGems"] }
  ]
};

export default function TravelDnaPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // URL 파라미터 파싱 (친구 궁합 비교용)
  const friendElement = searchParams.get("friendElement") as "wood" | "fire" | "earth" | "metal" | "water" | null;
  const friendName = searchParams.get("friendName");

  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState("");

  const [step, setStep] = useState<"intro" | "quiz" | "calculating" | "result">("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [resultElement, setResultElement] = useState<"wood" | "fire" | "earth" | "metal" | "water">("wood");

  // 닉네임 입력 및 Canvas 카드 저장 관련 상태
  const [nickname, setNickname] = useState("");
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardImage, setCardImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 리퍼럴 코드 자동 로드
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("referral_code")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.referral_code) {
          setReferralCode(data.referral_code);
        }
      });
  }, [user]);

  const handleStart = () => {
    setAnswers([]);
    setCurrentQuestion(0);
    setStep("quiz");
  };

  const handleAnswer = (optionValue: number) => {
    const nextAnswers = [...answers, optionValue];
    setAnswers(nextAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setStep("calculating");
      
      const result = calculateResult(nextAnswers);
      setResultElement(result);

      setTimeout(() => {
        setStep("result");
      }, 1800);
    }
  };

  const calculateResult = (ans: number[]): "wood" | "fire" | "earth" | "metal" | "water" => {
    const key = ans.join('');
    
    const mapping: Record<string, "wood" | "fire" | "earth" | "metal" | "water"> = {
      "0000": "metal",
      "0001": "water",
      "0010": "earth",
      "0011": "earth",
      "0100": "metal",
      "0101": "fire",
      "0110": "earth",
      "0111": "earth",
      "1000": "wood",
      "1001": "water",
      "1010": "wood",
      "1011": "water",
      "1100": "wood",
      "1101": "fire",
      "1110": "wood",
      "1111": "fire"
    };
    
    return mapping[key] || "wood";
  };

  // Web Share API를 사용한 동적 OG 주소 전송
  const handleShare = () => {
    const displayName = nickname || user?.user_metadata?.name || "Traveler";
    
    // Vercel Serverless Function 공유 엔드포인트 주소
    const shareUrl = `${window.location.origin}/api/share?element=${resultElement}&name=${encodeURIComponent(displayName)}${referralCode ? `&ref=${referralCode}` : ''}`;

    if (navigator.share) {
      navigator.share({
        title: t(`travelDna.elements.${resultElement}.name`),
        text: `${displayName}님이 당신을 궁합 테스트에 초대했습니다!`,
        url: shareUrl
      }).catch((err) => {
        console.warn("Web Share cancelled/failed:", err);
      });
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast({
          title: t("travelDna.copied"),
        });
      }).catch((err) => {
        console.error("Failed to copy link:", err);
      });
    }
  };

  // Canvas 기반 인스타 스토리 이미지 카드 생성
  const generateSharingCard = () => {
    const defaultName = nickname || user?.user_metadata?.name || "";
    if (!defaultName) {
      setShowNicknameModal(true);
      return;
    }

    setShowCardModal(true);
    setCardImage(null);

    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = 1080;
      canvas.height = 1920;

      // 1. 오행 요소별 매칭 색상 그라데이션
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      if (resultElement === "wood") {
        grad.addColorStop(0, "#10b981");
        grad.addColorStop(1, "#0f766e");
      } else if (resultElement === "fire") {
        grad.addColorStop(0, "#f43f5e");
        grad.addColorStop(1, "#ea580c");
      } else if (resultElement === "earth") {
        grad.addColorStop(0, "#d97706");
        grad.addColorStop(1, "#a16207");
      } else if (resultElement === "metal") {
        grad.addColorStop(0, "#06b6d4");
        grad.addColorStop(1, "#2563eb");
      } else {
        grad.addColorStop(0, "#0ea5e9");
        grad.addColorStop(1, "#4f46e5");
      }

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. 데코레이션 링
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.beginPath();
      ctx.arc(100, 200, 300, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(canvas.width - 100, canvas.height - 300, 400, 0, Math.PI * 2);
      ctx.fill();

      // 3. MIGO 로고
      ctx.fillStyle = "#ffffff";
      ctx.font = "black 90px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("M I G O", canvas.width / 2, 220);

      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.font = "bold 38px sans-serif";
      ctx.fillText("TRAVEL DNA TEST", canvas.width / 2, 310);

      // 4. 화이트 바디 카드
      const cardX = 90;
      const cardY = 420;
      const cardW = canvas.width - (cardX * 2);
      const cardH = 1100;
      const radius = 60;

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

      // 5. 유저 이름
      ctx.fillStyle = "#6366f1";
      ctx.font = "bold 44px sans-serif";
      ctx.fillText(`${defaultName}'s Travel DNA`, canvas.width / 2, cardY + 160);

      // 6. 이모지
      const saju = SAJU_DATA[resultElement];
      ctx.font = "160px sans-serif";
      ctx.fillText(saju.emoji, canvas.width / 2, cardY + 380);

      // 7. 유형 이름
      ctx.fillStyle = "#1e293b";
      ctx.font = "black 60px sans-serif";
      // 번역 적용
      ctx.fillText(t(saju.nameKey), canvas.width / 2, cardY + 540);

      // 8. 숏 키워드
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 36px sans-serif";
      ctx.fillText(t(saju.shortNameKey), canvas.width / 2, cardY + 620);

      // 9. 설명글 (멀티라인 줄바꿈 처리)
      ctx.fillStyle = "#475569";
      ctx.font = "normal 34px sans-serif";
      const descText = t(saju.descKey);
      const words = descText.split(' ');
      let line = '';
      let lineY = cardY + 740;
      const maxWidth = cardW - 160;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, canvas.width / 2, lineY);
          line = words[n] + ' ';
          lineY += 50;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, canvas.width / 2, lineY);

      // 10. 해시태그 목록
      ctx.fillStyle = "#8b5cf6";
      ctx.font = "bold 34px sans-serif";
      ctx.fillText(saju.tags.join("  "), canvas.width / 2, cardY + 980);

      // 11. 하단 도메인 안내
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = "black 42px sans-serif";
      ctx.fillText("나도 사주 궁합 보러 가기 👉 www.migo-go.com", canvas.width / 2, cardY + 1240);

      setCardImage(canvas.toDataURL("image/png"));
    }, 150);
  };

  const handleDownloadCard = () => {
    if (!cardImage) return;
    const link = document.createElement("a");
    link.download = `migo_travel_dna_${nickname || "result"}.png`;
    link.href = cardImage;
    link.click();
    toast({
      title: t("invite.downloadSuccess", "Image saved to gallery! 📸"),
    });
  };

  const currentQ = QUESTIONS[currentQuestion];
  const activeSaju = SAJU_DATA[resultElement];

  // 궁합 분석 결과
  const compatScore = friendElement ? COMPATIBILITY_SCORES[friendElement][resultElement] : 0;
  const compatKey = friendElement ? `travelDna.compatibility.${friendElement}_${resultElement}` : "";

  return (
    <div className="min-h-screen bg-[#0d0f14] text-white flex flex-col items-center justify-between pb-8 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[350px] h-[350px] rounded-full bg-violet-600/15 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-sky-500/10 blur-[90px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-md px-6 pt-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-600/20">
            <Compass className="w-5 h-5 text-white animate-spin-slow" />
          </div>
          <span className="font-extrabold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            MIGO
          </span>
        </div>
        
        {/* 수동 언어 선택기 연동 */}
        <LanguagePicker />
      </header>

      {/* Main Flow Container */}
      <main className="w-full max-w-md px-6 flex-1 flex flex-col justify-center z-10 py-4">
        {/* 친구 매칭 인트로 공지 바 */}
        {step === "intro" && friendName && friendElement && (
          <div className="w-full bg-indigo-600/10 border border-indigo-500/20 px-4 py-3.5 rounded-2xl text-xs font-semibold text-indigo-400 mb-6 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            {t("travelDna.compatibility.intro", { friendName })}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* 1. INTRO SCREEN */}
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-center flex flex-col items-center py-6"
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full blur-2xl opacity-40 scale-125" />
                <div className="w-24 h-24 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center relative shadow-2xl">
                  <Sparkles className="w-10 h-10 text-violet-400 animate-pulse" />
                </div>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight leading-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-gray-400">
                {t("travelDna.title")}
              </h1>

              <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-10">
                {t("travelDna.subtitle")}
              </p>

              <div className="w-full flex justify-center gap-3 mb-8">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold">🌲 {t("travelDna.elements.wood.shortName")}</span>
                <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full text-xs font-semibold">🔥 {t("travelDna.elements.fire.shortName")}</span>
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-semibold">⛰️ {t("travelDna.elements.earth.shortName")}</span>
                <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full text-xs font-semibold">💎 {t("travelDna.elements.metal.shortName")}</span>
                <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-3 py-1 rounded-full text-xs font-semibold">🌊 {t("travelDna.elements.water.shortName")}</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleStart}
                className="w-full py-4 rounded-2xl font-extrabold text-sm shadow-xl shadow-violet-600/30 flex items-center justify-center gap-2 text-white bg-gradient-to-r from-violet-600 to-indigo-600"
              >
                {t("travelDna.startBtn")}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}

          {/* 2. QUIZ SCREEN */}
          {step === "quiz" && currentQ && (
            <motion.div
              key={`question-${currentQuestion}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col flex-1 justify-between py-6"
            >
              <div>
                {/* Progress Bar */}
                <div className="mb-8">
                  <div className="flex justify-between items-center text-xs text-slate-500 font-semibold mb-2">
                    <span>{t("travelDna.questionProgress", { current: currentQuestion + 1, total: QUESTIONS.length })}</span>
                    <span>{Math.round(((currentQuestion + 1) / QUESTIONS.length) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-violet-600 to-indigo-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentQuestion + 1) / QUESTIONS.length) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Question Title */}
                <h2 className="text-xl font-bold leading-snug mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                  {t(currentQ.titleKey)}
                </h2>
              </div>

              {/* Options */}
              <div className="space-y-4 my-auto">
                {currentQ.options.map((opt, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(opt.value)}
                    className="w-full text-left p-5 rounded-2xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-violet-500/50 transition-all flex items-start gap-4"
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mt-0.5 border border-slate-700 text-xs font-bold text-slate-400">
                      {i === 0 ? "A" : "B"}
                    </div>
                    <span className="text-sm font-medium leading-relaxed text-gray-200">
                      {t(opt.textKey)}
                    </span>
                  </motion.button>
                ))}
              </div>

              <div className="h-8" />
            </motion.div>
          )}

          {/* 3. CALCULATING SCREEN */}
          {step === "calculating" && (
            <motion.div
              key="calculating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center flex flex-col items-center py-12"
            >
              <div className="relative mb-8">
                <div className="w-16 h-16 rounded-full border-4 border-violet-600/30 border-t-violet-500 animate-spin" />
                <Sparkles className="w-6 h-6 text-indigo-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <p className="text-gray-400 text-sm font-semibold animate-pulse">
                {t("travelDna.calculating")}
              </p>
            </motion.div>
          )}

          {/* 4. RESULT SCREEN */}
          {step === "result" && activeSaju && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6 py-4"
            >
              {/* 친구 궁합 비교 결과 카드 (friend 파라미터가 있을 때만 노출) */}
              {friendName && friendElement && (
                <div className="p-5 rounded-3xl bg-indigo-950/40 border border-indigo-500/30 shadow-xl relative overflow-hidden">
                  <div className="text-center mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">
                      {t("travelDna.compatibility.resultHeader")}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between px-4 mb-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl">{SAJU_DATA[friendElement].emoji}</span>
                      <span className="text-xs font-bold text-gray-300">{friendName}</span>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-black text-indigo-400">{compatScore}%</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase">{t("travelDna.compatibility.score")}</span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl">{activeSaju.emoji}</span>
                      <span className="text-xs font-bold text-gray-300">YOU</span>
                    </div>
                  </div>

                  <p className="text-xs text-indigo-200 text-center leading-relaxed font-medium bg-indigo-950/60 p-3.5 rounded-2xl border border-indigo-500/15">
                    {t(compatKey)}
                  </p>
                </div>
              )}

              {/* Premium Result Card */}
              <div className={`p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden`}>
                <div className={`absolute top-0 right-0 w-48 h-48 rounded-full bg-gradient-to-br ${activeSaju.color} opacity-15 blur-[50px] pointer-events-none`} />

                <div className="text-center mb-4">
                  <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">
                    {t("travelDna.resultTitle")}
                  </span>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className={`absolute inset-0 bg-gradient-to-r ${activeSaju.color} rounded-full blur-xl opacity-40`} />
                    <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-4xl shadow-xl relative">
                      {activeSaju.emoji}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold tracking-tight text-white mb-2 leading-snug">
                    {t(activeSaju.nameKey)}
                  </h3>

                  <div className="inline-block px-3 py-1 rounded-full text-xs font-bold border border-slate-700 bg-slate-800/50 text-slate-300 mb-4">
                    {t(activeSaju.shortNameKey)}
                  </div>

                  <p className="text-sm text-gray-300 leading-relaxed max-w-sm px-2">
                    {t(activeSaju.descKey)}
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-1.5 mt-5">
                  {activeSaju.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-md bg-slate-800/30 text-gray-400 border border-slate-800">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Local Compatible Matches Panel */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Users className="w-4 h-4 text-violet-400" />
                  <h4 className="text-sm font-bold text-gray-200">
                    {t("travelDna.matchHeader")}
                  </h4>
                </div>

                <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-950/40 p-1.5">
                  <div className="space-y-2">
                    {MOCK_TRAVELERS[resultElement].map((traveler, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/40 border border-slate-900/60"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border border-white/5 relative overflow-hidden`}>
                            <div className="absolute inset-0 bg-violet-600/35 filter blur-[3px]" />
                            <div className="z-10 text-white opacity-40">?</div>
                          </div>

                          <div className="space-y-0.5">
                            <div className="text-xs font-bold text-gray-300 filter blur-[4px] select-none">
                              {traveler.name}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                              <span className="flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5" />
                                {traveler.distance} {t("travelDna.kmAway")}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            {t("travelDna.matchPercentage")}
                          </span>
                          <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                            {traveler.match}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Lock Screen Glass Overlay */}
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[6px] flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mb-2.5 shadow-lg shadow-violet-500/10">
                      <Lock className="w-4 h-4 text-violet-400" />
                    </div>
                    <p className="text-xs font-bold text-slate-200 max-w-[240px] leading-relaxed mb-3">
                      {t("travelDna.unlockOverlayText")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleShare}
                  className="py-3.5 rounded-2xl font-bold text-xs bg-slate-900 border border-slate-800 text-gray-300 hover:text-white flex items-center justify-center gap-2 transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {t("travelDna.shareBtn")}
                </button>
                <button
                  onClick={generateSharingCard}
                  className="py-3.5 rounded-2xl font-bold text-xs bg-gradient-to-r from-violet-600/40 to-indigo-600/40 border border-violet-500/30 text-gray-200 hover:text-white flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  {t("invite.generateCardBtn", "스토리 카드 만들기")}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={handleStart}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-400 flex items-center gap-1.5 mx-auto transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  {t("travelDna.restart")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Persistent Download CTA Bar */}
      <footer className="w-full max-w-md px-6 z-10 shrink-0">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/download")}
          className="w-full py-4 rounded-2xl font-extrabold text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-2 text-white bg-gradient-to-r from-violet-600 to-indigo-600 border border-violet-500/20"
        >
          <Download className="w-4 h-4" />
          {t("travelDna.downloadBtn")}
        </motion.button>
      </footer>

      {/* 닉네임 입력 모달 */}
      <AnimatePresence>
        {showNicknameModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0" onClick={() => setShowNicknameModal(false)} />
            <motion.div
              className="relative z-10 w-full max-w-xs bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <User size={16} className="text-violet-400" />
                이름 입력
              </h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                인스타그램 공유 카드에 표시할 이름을 입력해주세요.
              </p>
              <input
                type="text"
                maxLength={10}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="이름을 입력하세요"
                className="w-full bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-violet-500 transition-colors"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowNicknameModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs active:bg-slate-800/80"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    if (nickname.trim()) {
                      setShowNicknameModal(false);
                      generateSharingCard();
                    }
                  }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs active:opacity-90"
                >
                  확인
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 스토리 카드 생성 모달 */}
      <AnimatePresence>
        {showCardModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0" onClick={() => setShowCardModal(false)} />
            <motion.div
              className="relative z-10 w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col items-center gap-4"
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
            >
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-violet-400 animate-pulse" />
                내 결과 스토리 카드
              </h3>

              {/* 렌더링용 캔버스 (숨김) */}
              <canvas ref={canvasRef} className="hidden" />

              {/* 미리보기 이미지 */}
              <div className="w-full aspect-[9/16] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner relative flex items-center justify-center">
                {cardImage ? (
                  <img src={cardImage} alt="Migo Travel DNA Card" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                    <span className="text-xs text-slate-500">이미지 생성 중...</span>
                  </div>
                )}
              </div>

              {/* 가이드 안내 */}
              <div className="w-full bg-slate-950 border border-slate-900 rounded-xl p-3 text-left">
                <p className="text-[11px] font-bold text-gray-200">💡 스토리 공유 방법</p>
                <ol className="text-[10px] text-slate-400 list-decimal pl-4 mt-1 space-y-0.5 leading-snug">
                  <li>아래 저장 단추를 눌러 갤러리에 저장합니다.</li>
                  <li>인스타그램 스토리에 이 카드를 업로드합니다.</li>
                  <li>오른쪽 위 공유 링크 스티커를 통해 내 링크를 함께 추가해보세요!</li>
                </ol>
              </div>

              {/* 작업 단추 */}
              <div className="w-full flex gap-2">
                <button
                  onClick={() => setShowCardModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-850 text-slate-400 font-bold text-xs border border-slate-800 active:bg-slate-850/80"
                >
                  {t("invite.close")}
                </button>
                <button
                  disabled={!cardImage}
                  onClick={handleDownloadCard}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 active:opacity-90 disabled:opacity-50"
                >
                  <Download size={14} />
                  갤러리에 저장
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
