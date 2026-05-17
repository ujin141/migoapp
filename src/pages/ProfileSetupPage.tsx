import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Check, ChevronRight, Sparkles, X, ArrowLeft, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import siteLogo from "@/assets/site-logo.png";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { compressImage } from "@/lib/imageCompression";

/* ─── 데이터 상수 ──────────────────────────────── */
const TRAVEL_STYLES = [
  "배낭여행 🎒", "럭셔리 ✈️", "자연/트레킹 🏔️", "맛집탐방 🍜",
  "문화/역사 🏛️", "해변/휴양 🏖️", "사진촬영 📸", "나이트라이프 🌙",
  "쇼핑 🛍️", "힐링/요가 🧘", "로컬체험 🎭", "드라이브 🚗",
];
const REGIONS = [
  "동남아 🌴", "유럽 🏰", "일본 🗾", "미국/캐나다 🗽",
  "중남미 🌎", "오세아니아 🦘", "중동/아프리카 🌍",
  "국내여행 🇰🇷", "중국/대만 🐉", "인도 🕌",
];
const PERSONALITIES = [
  { id: "planner", emoji: "📋", label: "계획형 플래너" },
  { id: "free",    emoji: "🌊", label: "자유로운 영혼" },
  { id: "social",  emoji: "🤝", label: "소셜 버터플라이" },
  { id: "solo",    emoji: "🎧", label: "나홀로 여행자" },
  { id: "photo",   emoji: "📸", label: "사진 수집가" },
  { id: "food",    emoji: "🍽️", label: "미식 탐험가" },
];
const MBTI_LIST = ["INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP","ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP"];
const MBTI_COLOR: Record<string,string> = {
  INTJ:"indigo",INTP:"indigo",ENTJ:"purple",ENTP:"purple",
  INFJ:"teal",INFP:"teal",ENFJ:"emerald",ENFP:"emerald",
  ISTJ:"blue",ISFJ:"blue",ESTJ:"orange",ESFJ:"orange",
  ISTP:"slate",ISFP:"pink",ESTP:"red",ESFP:"yellow",
};
const NATIONALITIES = [
  { v:"South Korea", f:"🇰🇷", l:"대한민국" },
  { v:"United States", f:"🇺🇸", l:"미국" },
  { v:"Japan", f:"🇯🇵", l:"일본" },
  { v:"China", f:"🇨🇳", l:"중국" },
  { v:"Taiwan", f:"🇹🇼", l:"대만" },
  { v:"United Kingdom", f:"🇬🇧", l:"영국" },
  { v:"Canada", f:"🇨🇦", l:"캐나다" },
  { v:"Australia", f:"🇦🇺", l:"호주" },
  { v:"France", f:"🇫🇷", l:"프랑스" },
  { v:"Germany", f:"🇩🇪", l:"독일" },
  { v:"Other", f:"🌍", l:"기타" },
];

const STEPS = [
  { emoji: "🤳", title: "프로필 사진", sub: "첫인상이 중요해요" },
  { emoji: "✈️", title: "여행 취향", sub: "어떻게 여행하나요?" },
  { emoji: "🧠", title: "나는 어떤 여행자?", sub: "선택 사항이에요" },
];

/* ─── 애니메이션 variants ─────────────────────── */
const slide = (dir: number) => ({
  initial: { opacity: 0, x: dir * 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.24, ease: [0.25,0.46,0.45,0.94] } },
  exit:    { opacity: 0, x: dir * -30, transition: { duration: 0.18 } },
});

/* ─── 서브 컴포넌트 ───────────────────────────── */
const Chip = ({ label, selected, onClick, disabled }: { label:string; selected:boolean; onClick:()=>void; disabled?:boolean }) => (
  <motion.button
    whileTap={{ scale: 0.94 }}
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all select-none
      ${selected
        ? "bg-primary text-primary-foreground border-primary shadow-sm"
        : "bg-card text-foreground border-border"}
      ${disabled && !selected ? "opacity-30 pointer-events-none" : ""}`}
  >
    {label}
  </motion.button>
);

/* ─── 메인 컴포넌트 ───────────────────────────── */
const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const { user, refreshPhotoUrl } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  /* Step 0 */
  const [photos, setPhotos] = useState<Array<{ file: File; url: string }>>([]);
  const [userType, setUserType] = useState<"traveler"|"local">("traveler");
  const [nickname, setNickname] = useState("");
  const [nationality, setNationality] = useState("");
  const [bio, setBio] = useState("");

  /* Step 1 */
  const [styles, setStyles] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);

  /* Step 2 */
  const [personality, setPersonality] = useState<string[]>([]);
  const [mbti, setMbti] = useState<string|null>(null);

  const [saving, setSaving] = useState(false);

  /* cleanup blob URLs */
  useEffect(() => () => { photos.forEach(p => URL.revokeObjectURL(p.url)); }, []);

  const toggle = (item: string, list: string[], set: (v:string[])=>void, max=99) =>
    set(list.includes(item) ? list.filter(i=>i!==item) : list.length < max ? [...list, item] : list);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const toAdd = files.slice(0, 6 - photos.length).map(f => ({ file: f, url: URL.createObjectURL(f) }));
    if (toAdd.length) setPhotos(prev => [...prev, ...toAdd]);
    e.target.value = "";
  };

  const removePhoto = (idx: number) =>
    setPhotos(prev => { URL.revokeObjectURL(prev[idx].url); return prev.filter((_,i)=>i!==idx); });

  const goNext = () => { setDirection(1); setStep(s => s + 1); };
  const goPrev = () => { setDirection(-1); setStep(s => s - 1); };

  const handleNext = async () => {
    /* validation */
    if (step === 0) {
      if (photos.length === 0) { toast({ title: "📸 사진을 1장 이상 추가해주세요", variant: "destructive" }); return; }
      if (!nickname.trim())    { toast({ title: "닉네임을 입력해주세요", variant: "destructive" }); return; }
      if (!nationality)        { toast({ title: "국적을 선택해주세요", variant: "destructive" }); return; }
      goNext(); return;
    }
    if (step === 1) {
      if (styles.length === 0) { toast({ title: "여행 스타일을 1개 이상 골라주세요", variant: "destructive" }); return; }
      goNext(); return;
    }

    /* step 2 → save */
    if (!user) { navigate("/"); return; }
    setSaving(true);
    try {
      let uploadedUrls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const compressed = await compressImage(photos[i].file);
        const ext = compressed.name.split(".").pop();
        const path = `${user.id}/profile_${Date.now()}_${i}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("avatars").upload(path, compressed, { upsert: true, contentType: compressed.type });
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
      toast({ title: "🎉 프로필 완성!", description: "Migo에 오신 걸 환영해요 ✈️" });
      setTimeout(() => navigate("/"), 600);
    } catch {
      toast({ title: "오류가 발생했습니다. 다시 시도해주세요", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const progress = step / (STEPS.length - 1) * 100;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* 배경 그라데이션 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-accent/8 blur-3xl" />
      </div>

      {/* 상단 헤더 */}
      <div className="relative z-10 px-5 pt-14 pb-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {step > 0 && (
              <motion.button whileTap={{ scale:0.9 }} onClick={goPrev}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <ArrowLeft size={16} className="text-foreground" />
              </motion.button>
            )}
            <img src={siteLogo} alt="Migo" className="h-7 object-contain" />
          </div>
          <span className="text-xs font-bold text-muted-foreground tabular-nums">{step + 1} / {STEPS.length}</span>
        </div>

        {/* 프로그레스 바 */}
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full gradient-primary"
            animate={{ width: `${progress}%` }}
            transition={{ type:"spring", stiffness:260, damping:26 }} />
        </div>
      </div>

      {/* 스텝 제목 */}
      <AnimatePresence mode="wait">
        <motion.div key={`hd-${step}`}
          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
          transition={{ duration:0.2 }}
          className="relative z-10 px-6 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[26px] leading-none">{STEPS[step].emoji}</span>
            <div>
              <h2 className="text-[19px] font-extrabold text-foreground leading-tight">{STEPS[step].title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{STEPS[step].sub}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 폼 영역 */}
      <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain">
        <AnimatePresence mode="wait" custom={direction}>

          {/* ── STEP 0: 사진 + 기본 정보 ── */}
          {step === 0 && (
            <motion.div key="s0" {...slide(direction)} className="px-5 pb-8 space-y-5">

              {/* 사진 피커 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-foreground">
                    프로필 사진 <span className="text-rose-500">*</span>
                  </span>
                  <span className={`text-[11px] font-bold ${photos.length > 0 ? "text-emerald-500" : "text-muted-foreground"}`}>
                    {photos.length} / 6
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {photos.map((p, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
                      <img src={p.url} alt="" className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[9px] font-extrabold text-center py-0.5">
                          대표
                        </div>
                      )}
                      <button onClick={() => removePhoto(idx)}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/55 flex items-center justify-center backdrop-blur-sm">
                        <X size={10} className="text-white" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 6 && (
                    <motion.button whileTap={{ scale:0.94 }} onClick={() => fileRef.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed border-border bg-muted flex flex-col items-center justify-center gap-1.5 transition-colors active:bg-muted/70">
                      <Camera size={22} className="text-muted-foreground" />
                      <span className="text-[10px] font-semibold text-muted-foreground">추가</span>
                    </motion.button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
              </div>

              {/* 구분선 */}
              <div className="h-px bg-border" />

              {/* 여행자 / 로컬 */}
              <div className="flex bg-muted rounded-2xl p-1 gap-1">
                {(["traveler","local"] as const).map(type => (
                  <button key={type} onClick={() => setUserType(type)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      userType === type ? "bg-card shadow text-foreground" : "text-muted-foreground"
                    }`}>
                    {type === "traveler" ? "✈️ 여행자" : "🏡 로컬 가이드"}
                  </button>
                ))}
              </div>

              {/* 닉네임 */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-foreground flex items-center gap-1">
                  닉네임 <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center bg-muted rounded-2xl px-4 h-12 gap-2 focus-within:ring-2 focus-within:ring-primary/30 transition-all">
                  <User size={15} className="text-muted-foreground shrink-0" />
                  <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} maxLength={20}
                    placeholder="예) 미고여행자" autoComplete="off"
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                  <span className="text-[10px] text-muted-foreground shrink-0">{nickname.length}/20</span>
                </div>
              </div>

              {/* 국적 */}
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-foreground flex items-center gap-1">
                  국적 <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {NATIONALITIES.map(n => (
                    <motion.button key={n.v} whileTap={{ scale:0.94 }} onClick={() => setNationality(n.v)}
                      className={`flex flex-col items-center gap-0.5 py-3 rounded-2xl border-2 text-sm transition-all ${
                        nationality === n.v
                          ? "border-primary bg-primary/8 text-foreground"
                          : "border-border bg-card text-muted-foreground"
                      }`}>
                      <span className="text-xl leading-none">{n.f}</span>
                      <span className="text-[11px] font-semibold">{n.l}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* 자기소개 (선택) */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-foreground flex items-center gap-1.5">
                  자기소개
                  <span className="text-[10px] font-normal text-muted-foreground">(선택)</span>
                </label>
                <div className="bg-muted rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-primary/30 transition-all">
                  <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={100} rows={2}
                    placeholder="어떤 여행을 좋아하나요? 짧게 소개해주세요 ✈️"
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none" />
                  <p className="text-[10px] text-muted-foreground text-right mt-1">{bio.length}/100</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 1: 여행 스타일 + 관심 지역 ── */}
          {step === 1 && (
            <motion.div key="s1" {...slide(direction)} className="px-5 pb-8 space-y-6">

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-bold text-foreground">
                    여행 스타일 <span className="text-rose-500">*</span>
                  </p>
                  <span className={`text-[11px] font-bold ${styles.length > 0 ? "text-primary" : "text-muted-foreground"}`}>
                    {styles.length} / 5
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TRAVEL_STYLES.map(s => (
                    <Chip key={s} label={s} selected={styles.includes(s)}
                      onClick={() => toggle(s, styles, setStyles, 5)}
                      disabled={!styles.includes(s) && styles.length >= 5} />
                  ))}
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="space-y-3">
                <p className="text-[13px] font-bold text-foreground flex items-center gap-1.5">
                  관심 여행지
                  <span className="text-[10px] font-normal text-muted-foreground">(선택, 복수 가능)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {REGIONS.map(r => (
                    <Chip key={r} label={r} selected={regions.includes(r)}
                      onClick={() => toggle(r, regions, setRegions)} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: 퍼스낼리티 + MBTI (선택) ── */}
          {step === 2 && (
            <motion.div key="s2" {...slide(direction)} className="px-5 pb-8 space-y-6">

              <div className="space-y-3">
                <p className="text-[13px] font-bold text-foreground">여행 성격</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {PERSONALITIES.map(p => {
                    const sel = personality.includes(p.id);
                    return (
                      <motion.button key={p.id} whileTap={{ scale:0.95 }}
                        onClick={() => toggle(p.id, personality, setPersonality)}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${
                          sel ? "border-primary bg-primary/6 shadow-sm" : "border-border bg-card"
                        }`}>
                        <span className="text-2xl leading-none shrink-0">{p.emoji}</span>
                        <span className="text-[12px] font-semibold text-foreground leading-tight flex-1">{p.label}</span>
                        {sel && (
                          <div className="w-4.5 h-4.5 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <Check size={9} className="text-primary-foreground" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="space-y-3">
                <p className="text-[13px] font-bold text-foreground">MBTI</p>
                <div className="grid grid-cols-4 gap-2">
                  {MBTI_LIST.map(type => {
                    const sel = mbti === type;
                    const color = MBTI_COLOR[type];
                    return (
                      <motion.button key={type} whileTap={{ scale:0.90 }}
                        onClick={() => setMbti(sel ? null : type)}
                        className={`py-3 rounded-2xl border-2 font-extrabold text-[13px] transition-all ${
                          sel
                            ? `bg-${color}-500/15 text-${color}-500 border-${color}-500/40 shadow-sm scale-105`
                            : "border-border bg-card text-muted-foreground"
                        }`}>
                        {type}
                      </motion.button>
                    );
                  })}
                </div>
                {mbti && (
                  <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                    className="py-3 px-4 rounded-2xl bg-card border border-border flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">선택됨</span>
                    <span className="text-lg font-black text-foreground">{mbti}</span>
                  </motion.div>
                )}
              </div>

              {/* 프로필 미리보기 */}
              {nickname && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">미리보기</p>
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border shadow-sm">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-muted shrink-0">
                      {photos[0]?.url
                        ? <img src={photos[0].url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><User size={20} className="text-muted-foreground" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{nickname}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{bio || "자기소개 없음"}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {styles.slice(0,3).map(s => (
                          <span key={s} className="px-2 py-0.5 rounded-full bg-muted text-[9px] font-semibold text-muted-foreground">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* 하단 CTA */}
      <div className="relative z-10 px-5 pt-3 pb-10 shrink-0 border-t border-border/50 bg-background/80 backdrop-blur-sm">
        {isLast && (
          <p className="text-center text-[11px] text-muted-foreground mb-3">
            성격/MBTI는 나중에 언제든지 변경 가능해요 👌
          </p>
        )}
        <motion.button whileTap={{ scale:0.97 }} onClick={handleNext} disabled={saving}
          className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-[15px] shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity">
          {saving
            ? <>
                <motion.div className="w-5 h-5 border-2 border-primary-foreground/60 border-t-primary-foreground rounded-full"
                  animate={{ rotate:360 }} transition={{ duration:0.7, repeat:Infinity, ease:"linear" }} />
                저장 중...
              </>
            : isLast
              ? <><Sparkles size={17} /> 프로필 완성하기</>
              : <>다음 <ChevronRight size={18} /></>}
        </motion.button>
      </div>
    </div>
  );
};

export default ProfileSetupPage;