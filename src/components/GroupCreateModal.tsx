import i18n from "@/i18n";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Calendar, Users, Check, ChevronRight, ChevronLeft, Tag, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

// ─── 자동완성 데이터 ────────────────────────────────────────────────────────
const DESTINATIONS = [
  { name: i18n.t("auto.ko_0286", "서울"), country: i18n.t("auto.ko_0287", "대한민국"), emoji: "🇰🇷" },
  { name: i18n.t("auto.ko_0288", "부산"), country: i18n.t("auto.ko_0289", "대한민국"), emoji: "🇰🇷" },
  { name: i18n.t("auto.ko_0290", "제주"), country: i18n.t("auto.ko_0291", "대한민국"), emoji: "🇰🇷" },
  { name: i18n.t("auto.ko_0292", "경주"), country: i18n.t("auto.ko_0293", "대한민국"), emoji: "🇰🇷" },
  { name: i18n.t("auto.ko_0294", "강릉"), country: i18n.t("auto.ko_0295", "대한민국"), emoji: "🇰🇷" },
  { name: i18n.t("auto.ko_0296", "전주"), country: i18n.t("auto.ko_0297", "대한민국"), emoji: "🇰🇷" },
  { name: i18n.t("auto.ko_0298", "도쿄"), country: i18n.t("auto.ko_0299", "일본"), emoji: "🇯🇵" },
  { name: i18n.t("auto.ko_0300", "오사카"), country: i18n.t("auto.ko_0301", "일본"), emoji: "🇯🇵" },
  { name: i18n.t("auto.ko_0302", "교토"), country: i18n.t("auto.ko_0303", "일본"), emoji: "🇯🇵" },
  { name: i18n.t("auto.ko_0304", "후쿠오카"), country: i18n.t("auto.ko_0305", "일본"), emoji: "🇯🇵" },
  { name: i18n.t("auto.ko_0306", "삿포로"), country: i18n.t("auto.ko_0307", "일본"), emoji: "🇯🇵" },
  { name: i18n.t("auto.ko_0308", "오키나와"), country: i18n.t("auto.ko_0309", "일본"), emoji: "🇯🇵" },
  { name: i18n.t("auto.ko_0310", "방콕"), country: i18n.t("auto.ko_0311", "태국"), emoji: "🇹🇭" },
  { name: i18n.t("auto.ko_0312", "치앙마이"), country: i18n.t("auto.ko_0313", "태국"), emoji: "🇹🇭" },
  { name: i18n.t("auto.ko_0314", "푸켓"), country: i18n.t("auto.ko_0315", "태국"), emoji: "🇹🇭" },
  { name: i18n.t("auto.ko_0316", "발리"), country: i18n.t("auto.ko_0317", "인도네시아"), emoji: "🇮🇩" },
  { name: i18n.t("auto.ko_0318", "싱가포르"), country: i18n.t("auto.ko_0319", "싱가포르"), emoji: "🇸🇬" },
  { name: i18n.t("auto.ko_0320", "쿠알라룸푸르"), country: i18n.t("auto.ko_0321", "말레이시아"), emoji: "🇲🇾" },
  { name: i18n.t("auto.ko_0322", "코타키나발루"), country: i18n.t("auto.ko_0323", "말레이시아"), emoji: "🇲🇾" },
  { name: i18n.t("auto.ko_0324", "다낭"), country: i18n.t("auto.ko_0325", "베트남"), emoji: "🇻🇳" },
  { name: i18n.t("auto.ko_0326", "호치민"), country: i18n.t("auto.ko_0327", "베트남"), emoji: "🇻🇳" },
  { name: i18n.t("auto.ko_0328", "하노이"), country: i18n.t("auto.ko_0329", "베트남"), emoji: "🇻🇳" },
  { name: i18n.t("auto.ko_0330", "나트랑"), country: i18n.t("auto.ko_0331", "베트남"), emoji: "🇻🇳" },
  { name: i18n.t("auto.ko_0332", "마닐라"), country: i18n.t("auto.ko_0333", "필리핀"), emoji: "🇵🇭" },
  { name: i18n.t("auto.ko_0334", "세부"), country: i18n.t("auto.ko_0335", "필리핀"), emoji: "🇵🇭" },
  { name: i18n.t("auto.ko_0336", "보라카이"), country: i18n.t("auto.ko_0337", "필리핀"), emoji: "🇵🇭" },
  { name: i18n.t("auto.ko_0338", "타이베이"), country: i18n.t("auto.ko_0339", "대만"), emoji: "🇹🇼" },
  { name: i18n.t("auto.ko_0340", "가오슝"), country: i18n.t("auto.ko_0341", "대만"), emoji: "🇹🇼" },
  { name: i18n.t("auto.ko_0342", "홍콩"), country: i18n.t("auto.ko_0343", "홍콩"), emoji: "🇭🇰" },
  { name: i18n.t("auto.ko_0344", "마카오"), country: i18n.t("auto.ko_0345", "마카오"), emoji: "🇲🇴" },
  { name: i18n.t("auto.ko_0346", "파리"), country: i18n.t("auto.ko_0347", "프랑스"), emoji: "🇫🇷" },
  { name: i18n.t("auto.ko_0348", "로마"), country: i18n.t("auto.ko_0349", "이탈리아"), emoji: "🇮🇹" },
  { name: i18n.t("auto.ko_0350", "바르셀로나"), country: i18n.t("auto.ko_0351", "스페인"), emoji: "🇪🇸" },
  { name: i18n.t("auto.ko_0352", "런던"), country: i18n.t("auto.ko_0353", "영국"), emoji: "🇬🇧" },
  { name: i18n.t("auto.ko_0354", "암스테르담"), country: i18n.t("auto.ko_0355", "네덜란드"), emoji: "🇳🇱" },
  { name: i18n.t("auto.ko_0356", "베를린"), country: i18n.t("auto.ko_0357", "독일"), emoji: "🇩🇪" },
  { name: i18n.t("auto.ko_0358", "프라하"), country: i18n.t("auto.ko_0359", "체코"), emoji: "🇨🇿" },
  { name: i18n.t("auto.ko_0360", "부다페스트"), country: i18n.t("auto.ko_0361", "헝가리"), emoji: "🇭🇺" },
  { name: i18n.t("auto.ko_0362", "비엔나"), country: i18n.t("auto.ko_0363", "오스트리아"), emoji: "🇦🇹" },
  { name: i18n.t("auto.ko_0364", "인터라켄"), country: i18n.t("auto.ko_0365", "스위스"), emoji: "🇨🇭" },
  { name: i18n.t("auto.ko_0366", "취리히"), country: i18n.t("auto.ko_0367", "스위스"), emoji: "🇨🇭" },
  { name: i18n.t("auto.ko_0368", "리스본"), country: i18n.t("auto.ko_0369", "포르투갈"), emoji: "🇵🇹" },
  { name: i18n.t("auto.ko_0370", "아테네"), country: i18n.t("auto.ko_0371", "그리스"), emoji: "🇬🇷" },
  { name: i18n.t("auto.ko_0372", "두바이"), country: "UAE", emoji: "🇦🇪" },
  { name: i18n.t("auto.ko_0373", "이스탄불"), country: i18n.t("auto.ko_0374", "터키"), emoji: "🇹🇷" },
  { name: i18n.t("auto.ko_0375", "뉴욕"), country: i18n.t("auto.ko_0376", "미국"), emoji: "🇺🇸" },
  { name: i18n.t("auto.ko_0377", "로스앤젤레스"), country: i18n.t("auto.ko_0378", "미국"), emoji: "🇺🇸" },
  { name: i18n.t("auto.ko_0379", "하와이"), country: i18n.t("auto.ko_0380", "미국"), emoji: "🇺🇸" },
  { name: i18n.t("auto.ko_0381", "시드니"), country: i18n.t("auto.ko_0382", "호주"), emoji: "🇦🇺" },
  { name: i18n.t("auto.ko_0383", "멜버른"), country: i18n.t("auto.ko_0384", "호주"), emoji: "🇦🇺" },
  { name: i18n.t("auto.ko_0385", "퀸즈타운"), country: i18n.t("auto.ko_0386", "뉴질랜드"), emoji: "🇳🇿" },
  { name: i18n.t("auto.ko_0387", "몰디브"), country: i18n.t("auto.ko_0388", "몰디브"), emoji: "🇲🇻" },
  { name: i18n.t("auto.ko_0389", "사이판"), country: i18n.t("auto.ko_0390", "사이판"), emoji: "🏝️" },
  { name: i18n.t("auto.ko_0391", "괌"), country: i18n.t("auto.ko_0392", "괌"), emoji: "🏝️" }
];

// ─── 자동완성 인풋 ────────────────────────────────────────────────────────
interface ACProps {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  isDestination?: boolean;
}
const ACInput: React.FC<ACProps> = ({ value, onChange, placeholder, isDestination }) => {
  const [open, setOpen] = useState(false);
  const q = value.trim().toLowerCase();
  const suggestions = q.length >= 1
    ? DESTINATIONS.filter(d =>
        d.name.toLowerCase().includes(q) || d.country.toLowerCase().includes(q)
      ).slice(0, 6)
    : [];

  return (
    <div className="relative flex-1 min-w-0">
      <div className={`flex items-center gap-2 px-3 py-3 rounded-2xl bg-muted/50 border border-border focus-within:border-primary/50 focus-within:bg-background transition-all`}>
        <MapPin size={15} className={`shrink-0 ${isDestination ? "text-blue-500" : "text-emerald-500"}`} />
        <input
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          autoComplete="off"
          className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/70 outline-none min-w-0 font-medium"
        />
        {value && (
          <button
            onMouseDown={e => e.preventDefault()}
            onClick={() => { onChange(""); setOpen(false); }}
            className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0 hover:bg-muted-foreground/20 transition-colors"
          >
            <X size={10} className="text-muted-foreground" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.13 }}
            className="absolute z-[300] top-full left-0 right-0 mt-2 bg-popover/95 backdrop-blur-xl border border-border rounded-2xl shadow-float overflow-hidden"
          >
            {suggestions.map((d, i) => (
              <li key={`${d.name}-${i}`}>
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { onChange(d.name); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/10 transition-colors text-left group"
                >
                  <span className="text-xl leading-none shrink-0">{d.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold text-foreground leading-tight">{d.name}</p>
                    <p className="text-[11px] text-muted-foreground">{d.country}</p>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── 스타일 옵션 ────────────────────────────────────────────────────────────
const STYLE_OPTIONS = [
  { label: i18n.t("auto.ko_0393", "관광 · 투어"), emoji: "🗺️" },
  { label: i18n.t("auto.ko_0394", "맛집 탐방"), emoji: "🍜" },
  { label: i18n.t("auto.ko_0395", "자연 · 액티비티"), emoji: "🏔️" },
  { label: i18n.t("auto.ko_0396", "휴양 · 힐링"), emoji: "🏖️" },
  { label: i18n.t("auto.ko_0397", "나이트라이프"), emoji: "🎉" },
  { label: i18n.t("auto.ko_0398", "문화 · 예술"), emoji: "🎨" },
];

// 인기 태그
const QUICK_TAGS = [i18n.t("auto.ko_0399", "감성"), i18n.t("auto.ko_0400", "맛집"), i18n.t("auto.ko_0401", "사진"), i18n.t("auto.ko_0402", "쇼핑"), i18n.t("auto.ko_0403", "트레킹"), i18n.t("auto.ko_0404", "드라이브"), i18n.t("auto.ko_0405", "건축"), i18n.t("auto.ko_0406", "야경"), i18n.t("auto.ko_0407", "온천"), i18n.t("auto.ko_0408", "럭셔리")];

// ─── 메인 컴포넌트 ──────────────────────────────────────────────────────────
interface GroupCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (group: any) => void;
}

const STEPS = [i18n.t("auto.ko_0409", "경로 설정"), i18n.t("auto.ko_0410", "일정 · 인원"), i18n.t("auto.ko_0411", "스타일 · 태그")];

const GroupCreateModal: React.FC<GroupCreateModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { user } = useAuth();
  
  // 스텝
  const [step, setStep] = useState(0);

  // 폼
  const [title, setTitle] = useState("");
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [dates, setDates] = useState("");
  const [description, setDescription] = useState("");
  const [maxMembers, setMaxMembers] = useState(4);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setStep(0); setTitle(""); setDeparture(""); setDestination("");
    setDates(""); setDescription(""); setMaxMembers(4);
    setSelectedStyle(null); setTags([]); setTagInput("");
  };

  const handleClose = () => { reset(); onClose(); };

  const toggleTag = (t: string) => {
    if (tags.includes(t)) setTags(prev => prev.filter(x => x !== t));
    else if (tags.length < 5) setTags(prev => [...prev, t]);
  };

  const addCustomTag = () => {
    const t = tagInput.trim().replace(/^#/, "");
    if (t && !tags.includes(t) && tags.length < 5) setTags(prev => [...prev, t]);
    setTagInput("");
  };

  const canNext = () => {
    if (step === 0) return destination.trim().length > 0;
    if (step === 1) return dates.trim().length > 0 && title.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    if (!user) { toast({ title: i18n.t("auto.g_0000", "로그인이 필요합니다."), variant: "destructive" }); return; }
    setSaving(true);
    const styleTag = selectedStyle ? [selectedStyle] : [];
    const groupData = {
      title: title || i18n.t("auto.t_0002", `${destination} 여행 동행 구합니다`),
      departure: departure.trim(),
      destination: destination.trim(),
      dates: dates.trim(),
      description: description.trim(),
      max_members: maxMembers,
      tags: [...styleTag, ...tags],
      entry_fee: 0,
      creation_fee: 0,
      host_id: user.id,
      status: "active",
      created_at: new Date().toISOString(),
    };
    try {
      const { data, error } = await supabase.from("trip_groups").insert(groupData).select().single();
      if (error) throw error;
      toast({ title: i18n.t("auto.t_0000", `✈️ ${destination} 동행 모집이 시작됐어요!`) });
      onCreated(data); reset(); onClose();
    } catch {
      toast({ title: i18n.t("auto.g_0001", "오류가 발생했습니다. 다시 시도해주세요."), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-md mx-auto flex flex-col bg-card rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-float"
            style={{ maxHeight: "calc(100dvh - 32px)" }}
            initial={{ y: 60, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
          >
            {/* ── 상단 헤더 ── */}
            <div className="relative bg-card px-5 pt-5 pb-5 shrink-0 border-b border-border/40">
              
              {/* Handle + 닫기 */}
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1.5 rounded-full bg-muted-foreground/20" />
              </div>
              
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-xl">✈️</span>
                    <span className="text-primary text-[10px] font-extrabold uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full truncate">{i18n.t("auto.ko_0265", "동행 모집")}</span>
                  </div>
                  <h2 className="text-foreground text-2xl font-black tracking-tight truncate">
                    {i18n.t("auto.ko_0266", "새 여행 동행")}<span className="gradient-text bg-clip-text text-transparent truncate">{i18n.t("auto.ko_0267", "만들기")}</span>
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center transition-colors mt-2"
                >
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>

              {/* 스텝 인디케이터 */}
              <div className="flex items-center gap-2 mt-5">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex items-center gap-1.5 flex-1 h-2">
                    <div className={`h-full rounded-full transition-all duration-500 flex-1 ${i <= step ? "gradient-primary" : "bg-muted"}`} />
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground text-[12px] mt-2 font-bold flex justify-between">
                <span>{STEPS[step]}</span>
                <span>{step + 1} / {STEPS.length}</span>
              </p>
            </div>

            {/* ── 본문 ── */}
            <div className="bg-background flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
              <AnimatePresence mode="wait">
                {/* STEP 0: 경로 */}
                {step === 0 && (
                  <motion.div key="step0"
                    className="px-5 py-6 space-y-5"
                    initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="truncate">
                      <p className="text-[13px] font-extrabold text-foreground mb-3 flex items-center gap-1.5 truncate">
                        <MapPin size={16} className="text-primary"/> 
                        {i18n.t("auto.ko_0268", "어디로 떠나실 건가요?")}</p>

                      {/* 출발지 → 목적지 카드 */}
                      <div className="bg-card rounded-3xl p-4 shadow-sm border border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-[3px] border-emerald-100" />
                            <div className="w-0.5 h-8 bg-gradient-to-b from-emerald-400/50 to-blue-500/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border-[3px] border-blue-100" />
                          </div>
                          <div className="flex-1 space-y-2.5">
                            <ACInput
                              value={departure}
                              onChange={setDeparture}
                              placeholder={i18n.t("auto.ko_0412", "출발지 (예: 서울)")}
                            />
                            <ACInput
                              value={destination}
                              onChange={setDestination}
                              placeholder={i18n.t("auto.ko_0413", "목적지 * (예: 도쿄, 발리)")}
                              isDestination
                            />
                          </div>
                        </div>
                      </div>

                      {!destination && (
                        <p className="text-[11px] text-orange-500 font-medium mt-2 flex items-center gap-1 ml-1 truncate">
                          <span>⚡</span> {i18n.t("auto.ko_0269", "목적지는 필수로 입력해주세요.")}</p>
                      )}
                    </div>

                    {/* 인기 목적지 */}
                    <div className="pt-2">
                      <p className="text-[12px] font-bold text-muted-foreground mb-3 flex items-center gap-1.5 truncate">
                        <Sparkles size={14} className="text-amber-500" /> {i18n.t("auto.ko_0270", "인기 여행지")}</p>
                      <div className="flex flex-wrap gap-2.5 truncate">
                        {[
                          { name: i18n.t("auto.ko_0414", "도쿄"), e: "🇯🇵" }, { name: i18n.t("auto.ko_0415", "방콕"), e: "🇹🇭" }, { name: i18n.t("auto.ko_0416", "발리"), e: "🇮🇩" },
                          { name: i18n.t("auto.ko_0417", "파리"), e: "🇫🇷" }, { name: i18n.t("auto.ko_0418", "싱가포르"), e: "🇸🇬" }, { name: i18n.t("auto.ko_0419", "다낭"), e: "🇻🇳" },
                          { name: i18n.t("auto.ko_0420", "제주"), e: "🇰🇷" }, { name: i18n.t("auto.ko_0421", "오사카"), e: "🇯🇵" },
                        ].map(d => (
                          <button
                            key={d.name}
                            onClick={() => setDestination(d.name)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-bold transition-all shadow-sm ${
                              destination === d.name
                                ? "gradient-primary text-white border-transparent"
                                : "bg-card border border-border text-foreground hover:border-primary/50"
                            }`}
                          >
                            <span className="text-[14px]">{d.e}</span>{d.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 1: 일정 · 인원 */}
                {step === 1 && (
                  <motion.div key="step1"
                    className="px-5 py-6 space-y-6"
                    initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* 경로 프리뷰 */}
                    <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-primary/5 border border-primary/10">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin size={16} className="text-primary"/>
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-foreground text-[14px] font-medium truncate">{departure || i18n.t("auto.ko_0422", "어디서든")}</span>
                        <ChevronRight size={14} className="text-primary" />
                        <span className="text-foreground font-bold text-[15px]">{destination}</span>
                      </div>
                    </div>

                    {/* 제목 */}
                    <div>
                      <p className="text-[13px] font-extrabold text-foreground mb-2 truncate">{i18n.t("auto.ko_0271", "모집 제목")}</p>
                      <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder={i18n.t("auto.t_0003", `${destination} 여행 동행 구합니다`)}
                        className="w-full px-4 py-3.5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-[15px] text-foreground placeholder:text-muted-foreground/60 outline-none font-medium transition-all shadow-sm"
                      />
                    </div>

                    {/* 날짜 */}
                    <div>
                      <p className="text-[13px] font-extrabold text-foreground mb-2 truncate">{i18n.t("auto.ko_0272", "여행 날짜")}</p>
                      <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-card border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-sm">
                        <Calendar size={18} className="text-primary shrink-0" />
                        <input
                          value={dates}
                          onChange={e => setDates(e.target.value)}
                          placeholder={i18n.t("auto.ko_0423", "예: 5월 20일~25일 (5박6일)")}
                          className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/60 outline-none font-medium"
                        />
                      </div>
                    </div>

                    {/* 인원 */}
                    <div>
                      <p className="text-[13px] font-extrabold text-foreground mb-3 truncate">{i18n.t("auto.ko_0273", "최대 인원")}</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <Users size={18} className="text-muted-foreground" />
                        </div>
                        <div className="flex gap-2.5 flex-wrap flex-1">
                          {[2, 3, 4, 5, 6].map(n => (
                            <motion.button
                              key={n}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setMaxMembers(n)}
                              className={`w-12 h-12 rounded-2xl text-[15px] font-black transition-all ${
                                maxMembers === n
                                  ? "gradient-primary text-white shadow-md"
                                  : "bg-card border border-border text-foreground hover:border-primary/40 shadow-sm"
                              }`}
                            >{n}</motion.button>
                          ))}
                        </div>
                        <span className="text-[14px] font-bold text-muted-foreground ml-1 truncate">{i18n.t("auto.ko_0274", "명")}</span>
                      </div>
                    </div>

                    {/* 소개 */}
                    <div>
                      <p className="text-[13px] font-extrabold text-foreground mb-2 flex items-center justify-between">
                        <span className="truncate">{i18n.t("auto.ko_0275", "소개 (선택)")}</span>
                        <span className="text-[11px] font-normal text-muted-foreground truncate">{i18n.t("auto.ko_0276", "짧게 적어주세요")}</span>
                      </p>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder={i18n.t("auto.ko_0424", "어떤 동행을 원하시나요? 비용 관리나 여행 스타일 등을 적어두면 매칭률이 올라가요.")}
                        rows={3}
                        className="w-full px-4 py-4 rounded-2xl bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-[14px] text-foreground placeholder:text-muted-foreground/50 outline-none resize-none transition-all shadow-sm leading-relaxed"
                      />
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: 스타일 · 태그 */}
                {step === 2 && (
                  <motion.div key="step2"
                    className="px-5 py-6 space-y-7"
                    initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* 미리보기 요약 */}
                    <div className="p-4 rounded-2xl gradient-primary text-white shadow-md relative overflow-hidden">
                      <div className="absolute -bottom-4 -right-4 text-[80px] opacity-10 rotate-12">✈️</div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <Sparkles size={14} className="text-white/90" />
                          <p className="text-[11px] font-extrabold text-white/90 uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full truncate">{i18n.t("auto.ko_0277", "모집 미리보기")}</p>
                        </div>
                        <p className="text-white font-black text-[16px] leading-snug truncate">{title || i18n.t("auto.t_0004", `${destination} 여행 동행 구합니다`)}</p>
                        <p className="text-white/80 text-[12px] font-medium mt-1.5 flex items-center gap-1 truncate">
                          <Calendar size={12}/> {dates || i18n.t("auto.ko_0425", "날짜 미정")} · <Users size={12}/> {i18n.t("auto.ko_0278", "최대")}{maxMembers}{i18n.t("auto.ko_0279", "명")}</p>
                      </div>
                    </div>

                    {/* 여행 스타일 */}
                    <div>
                      <p className="text-[13px] font-extrabold text-foreground mb-3 truncate">{i18n.t("auto.ko_0280", "대표 여행 스타일 (1개 선택)")}</p>
                      <div className="grid grid-cols-3 gap-2.5 truncate">
                        {STYLE_OPTIONS.map(s => (
                          <motion.button
                            key={s.label}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedStyle(selectedStyle === s.label ? null : s.label)}
                            className={`flex flex-col items-center gap-2 py-4 rounded-2xl border text-center transition-all shadow-sm ${
                              selectedStyle === s.label
                                ? `gradient-primary border-transparent text-white shadow-md`
                                : "bg-card border-border text-foreground hover:border-primary/50"
                            }`}
                          >
                            <span className="text-2xl">{s.emoji}</span>
                            <span className="text-[12px] font-bold leading-tight">{s.label}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* 태그 */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[13px] font-extrabold text-foreground truncate">{i18n.t("auto.ko_0281", "해시태그 (최대 5개)")}</p>
                        <span className="text-[12px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{tags.length}/5</span>
                      </div>

                      {/* 빠른 태그 */}
                      <div className="flex flex-wrap gap-2 mb-4 truncate">
                        {QUICK_TAGS.map(t => (
                          <button
                            key={t}
                            onClick={() => toggleTag(t)}
                            className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all ${
                              tags.includes(t)
                                ? "gradient-primary text-white shadow-md border-transparent"
                                : "bg-card border border-border text-muted-foreground hover:border-primary/40 shadow-sm"
                            }`}
                          >#{t}</button>
                        ))}
                      </div>

                      {/* 직접 입력 */}
                      <div className="flex gap-2">
                        <div className="flex items-center gap-2.5 flex-1 px-4 py-3 rounded-2xl bg-card border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-sm">
                          <Tag size={16} className="text-muted-foreground shrink-0" />
                          <input
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); addCustomTag(); } }}
                            placeholder={i18n.t("auto.ko_0426", "직접 입력 후 추가")}
                            className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/60 outline-none font-medium"
                          />
                        </div>
                        <button onClick={addCustomTag} className="px-5 py-3 rounded-2xl gradient-primary text-white text-[14px] font-bold shadow-md active:scale-95 transition-transform">{i18n.t("auto.ko_0282", "추가")}</button>
                      </div>

                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {tags.map(t => (
                            <span key={t} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-[12px] font-bold text-primary">
                              #{t}
                              <button onClick={() => setTags(p => p.filter(x => x !== t))} className="text-primary/60 hover:text-primary ml-1 -mr-1">
                                <X size={12}/>
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── 하단 고정 버튼 ── */}
            <div className="bg-card border-t border-border/40 px-5 pt-4 pb-8 sm:pb-6 shrink-0 z-20 shadow-[0_-4px_16px_rgba(0,0,0,0.02)]">
              <div className="flex gap-3">
                {step > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setStep(s => s - 1)}
                    className="w-[52px] h-[52px] rounded-2xl bg-muted flex items-center justify-center hover:bg-muted-foreground/10 transition-colors"
                  >
                    <ChevronLeft size={20} className="text-foreground" />
                  </motion.button>
                )}
                <motion.button
                  whileTap={canNext() && !saving ? { scale: 0.97 } : {}}
                  disabled={!canNext() || saving}
                  onClick={handleNext}
                  className={`flex-1 h-[52px] rounded-2xl font-extrabold text-[15px] flex items-center justify-center gap-2 transition-all ${
                    canNext() && !saving
                      ? "gradient-primary text-white shadow-lg"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {saving ? (
                    <span className="flex items-center gap-2 truncate">
                      <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}>⟳</motion.span>
                      {i18n.t("auto.ko_0283", "저장 중...")}</span>
                  ) : step < STEPS.length - 1 ? (
                    <><span className="truncate">{i18n.t("auto.ko_0284", "다음으로")}</span><ChevronRight size={18} /></>
                  ) : (
                    <><Check size={18} /><span className="truncate">{i18n.t("auto.ko_0285", "동행 모집 등록하기")}</span></>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GroupCreateModal;