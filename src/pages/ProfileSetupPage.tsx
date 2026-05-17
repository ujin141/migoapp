import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Check, ChevronRight, Sparkles, X, ArrowLeft, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import siteLogo from "@/assets/site-logo.png";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { compressImage } from "@/lib/imageCompression";
import { useTranslation } from "react-i18next";

// 국가 코드(ISO 3166-1 alpha-2) 기반 국적 목록 — Intl.DisplayNames로 현재 언어에 맞게 자동 변환
const NATIONALITY_CODES: Array<{ code: string; flag: string; fallback: string }> = [
  // ── 아시아 ──
  { code: "KR", flag: "🇰🇷", fallback: "South Korea" },
  { code: "JP", flag: "🇯🇵", fallback: "Japan" },
  { code: "CN", flag: "🇨🇳", fallback: "China" },
  { code: "TW", flag: "🇹🇼", fallback: "Taiwan" },
  { code: "HK", flag: "🇭🇰", fallback: "Hong Kong" },
  { code: "VN", flag: "🇻🇳", fallback: "Vietnam" },
  { code: "TH", flag: "🇹🇭", fallback: "Thailand" },
  { code: "PH", flag: "🇵🇭", fallback: "Philippines" },
  { code: "ID", flag: "🇮🇩", fallback: "Indonesia" },
  { code: "MY", flag: "🇲🇾", fallback: "Malaysia" },
  { code: "SG", flag: "🇸🇬", fallback: "Singapore" },
  { code: "MM", flag: "🇲🇲", fallback: "Myanmar" },
  { code: "KH", flag: "🇰🇭", fallback: "Cambodia" },
  { code: "IN", flag: "🇮🇳", fallback: "India" },
  { code: "NP", flag: "🇳🇵", fallback: "Nepal" },
  { code: "LK", flag: "🇱🇰", fallback: "Sri Lanka" },
  { code: "BD", flag: "🇧🇩", fallback: "Bangladesh" },
  { code: "PK", flag: "🇵🇰", fallback: "Pakistan" },
  { code: "MN", flag: "🇲🇳", fallback: "Mongolia" },
  { code: "KZ", flag: "🇰🇿", fallback: "Kazakhstan" },
  { code: "UZ", flag: "🇺🇿", fallback: "Uzbekistan" },
  // ── 유럽 ──
  { code: "GB", flag: "🇬🇧", fallback: "United Kingdom" },
  { code: "FR", flag: "🇫🇷", fallback: "France" },
  { code: "DE", flag: "🇩🇪", fallback: "Germany" },
  { code: "ES", flag: "🇪🇸", fallback: "Spain" },
  { code: "IT", flag: "🇮🇹", fallback: "Italy" },
  { code: "NL", flag: "🇳🇱", fallback: "Netherlands" },
  { code: "BE", flag: "🇧🇪", fallback: "Belgium" },
  { code: "CH", flag: "🇨🇭", fallback: "Switzerland" },
  { code: "AT", flag: "🇦🇹", fallback: "Austria" },
  { code: "SE", flag: "🇸🇪", fallback: "Sweden" },
  { code: "NO", flag: "🇳🇴", fallback: "Norway" },
  { code: "DK", flag: "🇩🇰", fallback: "Denmark" },
  { code: "FI", flag: "🇫🇮", fallback: "Finland" },
  { code: "PT", flag: "🇵🇹", fallback: "Portugal" },
  { code: "PL", flag: "🇵🇱", fallback: "Poland" },
  { code: "CZ", flag: "🇨🇿", fallback: "Czech Republic" },
  { code: "HU", flag: "🇭🇺", fallback: "Hungary" },
  { code: "RO", flag: "🇷🇴", fallback: "Romania" },
  { code: "GR", flag: "🇬🇷", fallback: "Greece" },
  { code: "RU", flag: "🇷🇺", fallback: "Russia" },
  { code: "UA", flag: "🇺🇦", fallback: "Ukraine" },
  { code: "TR", flag: "🇹🇷", fallback: "Turkey" },
  { code: "IE", flag: "🇮🇪", fallback: "Ireland" },
  // ── 아메리카 ──
  { code: "US", flag: "🇺🇸", fallback: "United States" },
  { code: "CA", flag: "🇨🇦", fallback: "Canada" },
  { code: "MX", flag: "🇲🇽", fallback: "Mexico" },
  { code: "BR", flag: "🇧🇷", fallback: "Brazil" },
  { code: "AR", flag: "🇦🇷", fallback: "Argentina" },
  { code: "CL", flag: "🇨🇱", fallback: "Chile" },
  { code: "CO", flag: "🇨🇴", fallback: "Colombia" },
  { code: "PE", flag: "🇵🇪", fallback: "Peru" },
  // ── 중동 ──
  { code: "AE", flag: "🇦🇪", fallback: "UAE" },
  { code: "SA", flag: "🇸🇦", fallback: "Saudi Arabia" },
  { code: "IL", flag: "🇮🇱", fallback: "Israel" },
  { code: "IR", flag: "🇮🇷", fallback: "Iran" },
  { code: "JO", flag: "🇯🇴", fallback: "Jordan" },
  // ── 아프리카 ──
  { code: "ZA", flag: "🇿🇦", fallback: "South Africa" },
  { code: "EG", flag: "🇪🇬", fallback: "Egypt" },
  { code: "MA", flag: "🇲🇦", fallback: "Morocco" },
  { code: "NG", flag: "🇳🇬", fallback: "Nigeria" },
  { code: "KE", flag: "🇰🇪", fallback: "Kenya" },
  { code: "ET", flag: "🇪🇹", fallback: "Ethiopia" },
  // ── 오세아니아 ──
  { code: "AU", flag: "🇦🇺", fallback: "Australia" },
  { code: "NZ", flag: "🇳🇿", fallback: "New Zealand" },
  { code: "FJ", flag: "🇫🇯", fallback: "Fiji" },
];

/** Intl.DisplayNames로 언어별 국가명 반환. 지원 안 하는 언어는 fallback(English) */
function getCountryName(code: string, locale: string, fallback: string): string {
  try {
    const dn = new Intl.DisplayNames([locale, 'en'], { type: 'region' });
    return dn.of(code) ?? fallback;
  } catch {
    return fallback;
  }
}

const MBTI_LIST = ["INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP","ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP"];
const MBTI_COLOR: Record<string,string> = {
  INTJ:"indigo",INTP:"indigo",ENTJ:"purple",ENTP:"purple",
  INFJ:"teal",INFP:"teal",ENFJ:"emerald",ENFP:"emerald",
  ISTJ:"blue",ISFJ:"blue",ESTJ:"orange",ESFJ:"orange",
  ISTP:"slate",ISFP:"pink",ESTP:"red",ESFP:"yellow",
};

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
  const { i18n } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);

  // 언어 변경 시 자동으로 국가명 재계산 (Intl.DisplayNames 활용)
  const NATIONALITIES = useMemo(() => {
    const locale = i18n.language || 'ko';
    const otherLabel = (() => {
      if (locale.startsWith('ko')) return '기타';
      if (locale.startsWith('ja')) return 'その他';
      if (locale.startsWith('zh')) return '其他';
      if (locale.startsWith('fr')) return 'Autre';
      if (locale.startsWith('de')) return 'Andere';
      if (locale.startsWith('es')) return 'Otro';
      return 'Other';
    })();
    const list = NATIONALITY_CODES.map(({ code, flag, fallback }) => ({
      v: code,
      f: flag,
      l: getCountryName(code, locale, fallback),
    }));
    list.push({ v: 'Other', f: '🌍', l: otherLabel });
    return list;
  }, [i18n.language]);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  /* Step 0 */
  const [photos, setPhotos] = useState<Array<{ file: File; url: string }>>([]);
  const [userType, setUserType] = useState<"traveler"|"local">("traveler");
  const [nickname, setNickname] = useState("");
  const [nationality, setNationality] = useState("");
  const [natSearch, setNatSearch] = useState("");
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

      // ✅ refreshPhotoUrl을 await로 완전 완료 후 navigate
      // (refreshPhotoUrl 내부에서 enrichWithProfilePhoto → DB에서 setup_complete=true 읽어
      //  globalUser.setupComplete = true로 반영되어야 App.tsx 가드가 통과시켜줌)
      await refreshPhotoUrl?.();

      toast({ title: "🎉 프로필 완성!", description: "Migo에 오신 걸 환영해요 ✈️" });
      // 토스트가 잠깐 보이도록 짧게 대기 후 이동
      await new Promise(r => setTimeout(r, 300));
      navigate("/", { replace: true });
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
                  {nationality && <span className="ml-auto text-primary text-[12px]">✓ 선택됨</span>}
                </label>
                {/* 검색 */}
                <div className="flex items-center bg-muted rounded-xl px-3 h-9 gap-2 focus-within:ring-2 focus-within:ring-primary/30 transition-all">
                  <span className="text-muted-foreground text-sm">🔍</span>
                  <input
                    type="text"
                    value={natSearch}
                    onChange={e => setNatSearch(e.target.value)}
                    placeholder="국가 검색..."
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  />
                  {natSearch && (
                    <button onClick={() => setNatSearch('')} className="text-muted-foreground">
                      <X size={12} />
                    </button>
                  )}
                </div>
                {/* 선택된 국적 미리보기 */}
                {nationality && (
                  <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2">
                    <span className="text-xl">{NATIONALITIES.find(n => n.v === nationality)?.f}</span>
                    <span className="text-sm font-bold text-primary">{NATIONALITIES.find(n => n.v === nationality)?.l}</span>
                    <span className="text-xs text-primary/70 ml-auto">{nationality}</span>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto overscroll-contain pr-0.5">
                  {NATIONALITIES.filter(n =>
                    !natSearch ||
                    n.l.includes(natSearch) ||
                    n.v.toLowerCase().includes(natSearch.toLowerCase())
                  ).map(n => (
                    <motion.button key={n.v} whileTap={{ scale:0.94 }} onClick={() => setNationality(n.v)}
                      className={`flex flex-col items-center gap-0.5 py-2.5 rounded-2xl border-2 text-sm transition-all ${
                        nationality === n.v
                          ? "border-primary bg-primary/8 text-foreground"
                          : "border-border bg-card text-muted-foreground"
                      }`}>
                      <span className="text-xl leading-none">{n.f}</span>
                      <span className="text-[10px] font-semibold text-center leading-tight px-1">{n.l}</span>
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