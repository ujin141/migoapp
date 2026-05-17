import i18n from "@/i18n";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Check, ChevronRight, Sparkles, X, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import siteLogo from "@/assets/site-logo.png";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { compressImage } from "@/lib/imageCompression";

const MBTI_COLOR: Record<string, string> = {
  INTJ:"bg-indigo-500/20 text-indigo-500 border-indigo-500/40", INTP:"bg-indigo-500/20 text-indigo-500 border-indigo-500/40",
  ENTJ:"bg-purple-500/20 text-purple-500 border-purple-500/40", ENTP:"bg-purple-500/20 text-purple-500 border-purple-500/40",
  INFJ:"bg-teal-500/20 text-teal-500 border-teal-500/40",   INFP:"bg-teal-500/20 text-teal-500 border-teal-500/40",
  ENFJ:"bg-green-500/20 text-green-500 border-green-500/40", ENFP:"bg-green-500/20 text-green-500 border-green-500/40",
  ISTJ:"bg-blue-500/20 text-blue-500 border-blue-500/40",  ISFJ:"bg-blue-500/20 text-blue-500 border-blue-500/40",
  ESTJ:"bg-orange-500/20 text-orange-500 border-orange-500/40", ESFJ:"bg-orange-500/20 text-orange-500 border-orange-500/40",
  ISTP:"bg-gray-500/20 text-gray-500 border-gray-500/40",  ISFP:"bg-pink-500/20 text-pink-500 border-pink-500/40",
  ESTP:"bg-red-500/20 text-red-500 border-red-500/40",    ESFP:"bg-yellow-500/20 text-yellow-500 border-yellow-500/40",
};
const MBTI_TYPES = Object.keys(MBTI_COLOR);

const TRAVEL_STYLES = ["배낭여행 🎒","럭셔리 ✈️","자연/트레킹 🏔️","맛집탐방 🍜","문화/역사 🏛️","해변/휴양 🏖️","사진촬영 📸","나이트라이프 🌙","쇼핑 🛍️","힐링/요가 🧘"];
const REGIONS = ["동남아 🌴","유럽 🏰","일본 🗾","미국/캐나다 🗽","중남미 🌎","오세아니아 🦘","중동/아프리카 🌍","국내여행 🇰🇷","중국/대만 🐉","인도 🕌"];
const PERSONALITIES = [
  { id:"planner", emoji:"📋", label:"계획형 플래너" },
  { id:"free",    emoji:"🌊", label:"자유로운 영혼" },
  { id:"social",  emoji:"🤝", label:"소셜 버터플라이" },
  { id:"solo",    emoji:"🎧", label:"나홀로 여행자" },
  { id:"photo",   emoji:"📸", label:"사진 수집가" },
  { id:"food",    emoji:"🍽️", label:"미식 탐험가" },
];

const NATIONALITIES = [
  { value:"South Korea", label:"🇰🇷 대한민국" },
  { value:"United States", label:"🇺🇸 미국" },
  { value:"Japan", label:"🇯🇵 일본" },
  { value:"China", label:"🇨🇳 중국" },
  { value:"Taiwan", label:"🇹🇼 대만" },
  { value:"United Kingdom", label:"🇬🇧 영국" },
  { value:"Canada", label:"🇨🇦 캐나다" },
  { value:"Australia", label:"🇦🇺 호주" },
  { value:"France", label:"🇫🇷 프랑스" },
  { value:"Germany", label:"🇩🇪 독일" },
  { value:"Other", label:"🌍 기타" },
];

const STEPS = [
  { icon:"🤳", title:"나를 소개해요", sub:"사진과 기본 정보를 알려주세요" },
  { icon:"✈️", title:"여행 스타일", sub:"어떻게 여행하나요?" },
  { icon:"🧠", title:"성격 유형", sub:"선택하지 않아도 됩니다 (선택)" },
];

const pageVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.22 } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.18 } },
};

const ProfileSetupPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, refreshPhotoUrl } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);

  // Step 0
  const [photos, setPhotos] = useState<Array<{ file: File; url: string }>>([]);
  const [nickname, setNickname] = useState("");
  const [nationality, setNationality] = useState("");
  const [bio, setBio] = useState("");
  const [userType, setUserType] = useState<"traveler"|"local">("traveler");

  // Step 1
  const [styles, setStyles] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);

  // Step 2
  const [personality, setPersonality] = useState<string[]>([]);
  const [mbti, setMbti] = useState<string|null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => () => { photos.forEach(p => URL.revokeObjectURL(p.url)); }, []);

  const toggleItem = (item: string, list: string[], setList: (v: string[]) => void, max = 99) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : list.length < max ? [...list, item] : list);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const toAdd = files.slice(0, 6 - photos.length).map(f => ({ file: f, url: URL.createObjectURL(f) }));
    if (toAdd.length) setPhotos(prev => [...prev, ...toAdd]);
    e.target.value = "";
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos(prev => { URL.revokeObjectURL(prev[idx].url); return prev.filter((_, i) => i !== idx); });
  };

  const handleNext = async () => {
    if (step === 0) {
      if (photos.length === 0) { toast({ title: "사진을 1장 이상 추가해주세요 📸", variant: "destructive" }); return; }
      if (!nickname.trim()) { toast({ title: "닉네임을 입력해주세요", variant: "destructive" }); return; }
      if (!nationality) { toast({ title: "국적을 선택해주세요", variant: "destructive" }); return; }
    }
    if (step === 1 && styles.length === 0) {
      toast({ title: "여행 스타일을 1개 이상 선택해주세요", variant: "destructive" }); return;
    }
    if (step === 2) {
      // 저장
      if (!user) { navigate("/"); return; }
      setSaving(true);
      try {
        let uploadedUrls: string[] = [];
        for (let i = 0; i < photos.length; i++) {
          const compressed = await compressImage(photos[i].file);
          const ext = compressed.name.split(".").pop();
          const path = `${user.id}/profile_${Date.now()}_${i}.${ext}`;
          const { error: upErr } = await supabase.storage.from("avatars").upload(path, compressed, { upsert: true, contentType: compressed.type });
          if (!upErr) {
            const { data } = supabase.storage.from("avatars").getPublicUrl(path);
            uploadedUrls.push(data.publicUrl);
          }
        }
        const { error } = await supabase.from("profiles").update({
          name: nickname.trim(),
          user_type: userType,
          nationality,
          bio: bio.trim() || null,
          interests: styles,
          preferred_regions: regions,
          personality_tags: personality,
          mbti: mbti || null,
          ...(uploadedUrls.length ? { photo_url: uploadedUrls[0], photo_urls: uploadedUrls } : {}),
          setup_complete: true,
          lat: parseFloat(localStorage.getItem("migo_my_lat") || "0") || null,
          lng: parseFloat(localStorage.getItem("migo_my_lng") || "0") || null,
        }).eq("id", user.id);

        if (error) { toast({ title: "저장 실패", description: error.message, variant: "destructive" }); setSaving(false); return; }
        await refreshPhotoUrl?.();
        toast({ title: "🎉 프로필이 완성됐어요!", description: "여행 친구를 만나러 가볼까요?" });
        setTimeout(() => navigate("/"), 700);
      } catch {
        toast({ title: "저장 중 오류가 발생했습니다", variant: "destructive" });
      } finally {
        setSaving(false);
      }
      return;
    }
    setStep(s => s + 1);
  };

  const progress = (step / (STEPS.length - 1)) * 100;

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
      {/* Animated blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div className="absolute w-80 h-80 rounded-full bg-primary/10 blur-3xl"
          animate={{ scale:[1,1.1,1], x:[0,30,0], y:[0,-20,0] }}
          transition={{ duration:8, repeat:Infinity, ease:"easeInOut" }}
          style={{ top:"-20%", right:"-20%" }} />
        <motion.div className="absolute w-64 h-64 rounded-full bg-accent/10 blur-3xl"
          animate={{ scale:[1,1.15,1], y:[0,20,0] }}
          transition={{ duration:6, repeat:Infinity, ease:"easeInOut", delay:2 }}
          style={{ bottom:"5%", left:"-15%" }} />
      </div>

      {/* Header */}
      <div className="px-5 pt-12 pb-3 z-10 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform">
                <ArrowLeft size={16} className="text-foreground" />
              </button>
            )}
            <img src={siteLogo} alt="Migo" className="h-8 object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">{step + 1} / {STEPS.length}</span>
          </div>
        </div>
        {/* Progress */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full gradient-primary"
            animate={{ width:`${progress}%` }}
            transition={{ type:"spring", damping:20 }} />
        </div>
      </div>

      {/* Step title */}
      <AnimatePresence mode="wait">
        <motion.div key={`title-${step}`} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
          transition={{ duration:0.2 }} className="px-6 pb-3 z-10 shrink-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-2xl">{STEPS[step].icon}</span>
            <h2 className="text-xl font-extrabold text-foreground">{STEPS[step].title}</h2>
          </div>
          <p className="text-sm text-muted-foreground ml-9">{STEPS[step].sub}</p>
        </motion.div>
      </AnimatePresence>

      {/* Form */}
      <div className="flex-1 overflow-y-auto z-10">
        <AnimatePresence mode="wait">

          {/* ── STEP 0: 사진 + 기본정보 ── */}
          {step === 0 && (
            <motion.div key="s0" variants={pageVariants} initial="initial" animate="animate" exit="exit"
              className="px-5 pb-6 space-y-4">

              {/* 사진 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-foreground">프로필 사진 <span className="text-rose-500">*</span></span>
                  <span className={`text-[10px] font-bold ${photos.length > 0 ? "text-green-400" : "text-rose-400"}`}>{photos.length}/6</span>
                </div>
                <div className={`grid grid-cols-3 gap-2 p-2 rounded-2xl transition-all ${photos.length === 0 ? "ring-2 ring-rose-500/40 bg-rose-500/5" : "ring-2 ring-green-500/20"}`}>
                  {photos.map((p, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border-2 border-border">
                      <img src={p.url} alt="" className="w-full h-full object-cover" />
                      {idx === 0 && <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[8px] font-extrabold px-1.5 py-0.5 rounded-full">대표</div>}
                      <button onClick={() => handleRemovePhoto(idx)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                        <X size={10} className="text-white" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 6 && (
                    <motion.div whileTap={{ scale:0.95 }} onClick={() => fileRef.current?.click()}
                      className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer ${photos.length === 0 ? "border-rose-400/60 bg-rose-500/10" : "border-primary/30 bg-muted"}`}>
                      <Camera size={20} className={photos.length === 0 ? "text-rose-400" : "text-primary/60"} />
                      <span className={`text-[10px] font-bold ${photos.length === 0 ? "text-rose-400" : "text-primary/60"}`}>
                        {photos.length === 0 ? "사진 추가" : "+ 추가"}
                      </span>
                    </motion.div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
                <p className="text-[10px] text-muted-foreground text-center mt-1.5">첫 번째 사진이 대표 사진으로 사용됩니다</p>
              </div>

              {/* 여행자/로컬 */}
              <div className="flex bg-muted rounded-2xl p-1">
                {(["traveler","local"] as const).map(type => (
                  <button key={type} onClick={() => setUserType(type)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${userType === type ? "bg-card shadow text-foreground" : "text-muted-foreground"}`}>
                    {type === "traveler" ? "✈️ 여행자" : "🏡 로컬 가이드"}
                  </button>
                ))}
              </div>

              {/* 닉네임 */}
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-1">
                  닉네임 <span className="text-rose-500">*</span>
                </label>
                <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} maxLength={20}
                  placeholder="예) 미고여행자" autoComplete="off"
                  className="w-full bg-muted rounded-2xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" />
                <p className="text-[10px] text-muted-foreground text-right mt-1">{nickname.length}/20</p>
              </div>

              {/* 국적 */}
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-1">
                  국적 <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {NATIONALITIES.map(n => (
                    <motion.button key={n.value} whileTap={{ scale:0.96 }}
                      onClick={() => setNationality(n.value)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-semibold text-left transition-all border-2 flex items-center gap-2 ${nationality === n.value ? "border-primary bg-primary/10 text-foreground" : "border-border bg-muted text-muted-foreground"}`}>
                      {nationality === n.value && <Check size={12} className="text-primary shrink-0" />}
                      <span className="truncate">{n.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* 자기소개 (선택) */}
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-1">
                  자기소개 <span className="text-muted-foreground font-normal">(선택)</span>
                </label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={100} rows={2}
                  placeholder="어떤 여행을 좋아하나요? 짧게 소개해주세요 ✈️"
                  className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:ring-2 focus:ring-primary/30" />
                <p className="text-[10px] text-muted-foreground text-right mt-1">{bio.length}/100</p>
              </div>
            </motion.div>
          )}

          {/* ── STEP 1: 여행 스타일 + 관심 지역 ── */}
          {step === 1 && (
            <motion.div key="s1" variants={pageVariants} initial="initial" animate="animate" exit="exit"
              className="px-5 pb-6 space-y-5">

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-foreground">여행 스타일 <span className="text-rose-500">*</span></p>
                  <span className="text-[10px] text-muted-foreground font-bold">{styles.length}/5 선택</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TRAVEL_STYLES.map(s => {
                    const sel = styles.includes(s);
                    const disabled = !sel && styles.length >= 5;
                    return (
                      <motion.button key={s} whileTap={{ scale:0.95 }}
                        onClick={() => toggleItem(s, styles, setStyles, 5)}
                        className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all border-2 ${sel ? "gradient-primary text-primary-foreground border-transparent shadow-sm" : "bg-muted text-muted-foreground border-transparent"} ${disabled ? "opacity-30" : ""}`}>
                        {s}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-foreground mb-2">관심 여행지 <span className="text-muted-foreground font-normal">(선택, 복수 가능)</span></p>
                <div className="flex flex-wrap gap-2">
                  {REGIONS.map(r => {
                    const sel = regions.includes(r);
                    return (
                      <motion.button key={r} whileTap={{ scale:0.95 }}
                        onClick={() => toggleItem(r, regions, setRegions)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border-2 ${sel ? "gradient-primary text-primary-foreground border-transparent shadow-sm" : "bg-muted text-muted-foreground border-transparent"}`}>
                        {r}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: 퍼스낼리티 + MBTI (선택) ── */}
          {step === 2 && (
            <motion.div key="s2" variants={pageVariants} initial="initial" animate="animate" exit="exit"
              className="px-5 pb-6 space-y-5">

              <div>
                <p className="text-xs font-bold text-foreground mb-3">나는 어떤 여행자? <span className="text-muted-foreground font-normal">(복수 선택)</span></p>
                <div className="grid grid-cols-2 gap-3">
                  {PERSONALITIES.map(p => {
                    const sel = personality.includes(p.id);
                    return (
                      <motion.button key={p.id} whileTap={{ scale:0.95 }}
                        onClick={() => toggleItem(p.id, personality, setPersonality)}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${sel ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card"}`}>
                        <span className="text-2xl shrink-0">{p.emoji}</span>
                        <span className="text-xs font-semibold text-foreground leading-tight">{p.label}</span>
                        {sel && <div className="ml-auto w-5 h-5 rounded-full gradient-primary flex items-center justify-center shrink-0"><Check size={10} className="text-primary-foreground" /></div>}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-foreground mb-3">MBTI <span className="text-muted-foreground font-normal">(선택)</span></p>
                <div className="grid grid-cols-4 gap-2">
                  {MBTI_TYPES.map(type => {
                    const sel = mbti === type;
                    const color = MBTI_COLOR[type];
                    return (
                      <motion.button key={type} whileTap={{ scale:0.92 }}
                        onClick={() => setMbti(sel ? null : type)}
                        className={`py-3 rounded-2xl border-2 font-extrabold text-sm transition-all ${sel ? `${color} shadow-sm scale-105` : "border-border bg-card text-muted-foreground"}`}>
                        {type}
                      </motion.button>
                    );
                  })}
                </div>
                {mbti && (
                  <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                    className="mt-3 p-3 rounded-2xl bg-card border border-border text-center">
                    <p className="text-2xl font-black">{mbti}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">나중에 언제든지 변경할 수 있어요</p>
                  </motion.div>
                )}
              </div>

              {/* 프로필 미리보기 */}
              {nickname && (
                <div className="p-4 rounded-2xl bg-card border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-3">미리보기</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-muted shrink-0">
                      {photos[0]?.url
                        ? <img src={photos[0].url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-xl">👤</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{nickname}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{bio || "자기소개 없음"}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {styles.slice(0,3).map(s => <span key={s} className="px-2 py-0.5 rounded-full bg-muted text-[9px] font-semibold text-muted-foreground">{s}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* CTA */}
      <div className="px-5 pb-10 pt-3 z-10 shrink-0">
        {step === 2 && (
          <p className="text-center text-xs text-muted-foreground mb-3">성격/MBTI는 건너뛰어도 됩니다 👌</p>
        )}
        <motion.button whileTap={{ scale:0.97 }} onClick={handleNext} disabled={saving}
          className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-base shadow-lg flex items-center justify-center gap-2 disabled:opacity-60">
          {saving
            ? <><motion.div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full" animate={{ rotate:360 }} transition={{ duration:0.7, repeat:Infinity, ease:"linear" }} /> 저장 중...</>
            : step === STEPS.length - 1
              ? <><Sparkles size={18} /> 프로필 완성하기 🎉</>
              : <>다음 <ChevronRight size={18} /></>}
        </motion.button>
      </div>
    </div>
  );
};

export default ProfileSetupPage;