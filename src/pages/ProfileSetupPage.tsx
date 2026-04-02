import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Check, ChevronRight, Sparkles, Globe, MapPin, Calendar, User, Heart, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import siteLogo from "@/assets/site-logo.png";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { compressImage } from "@/lib/imageCompression";
const MBTI_COLOR: Record<string, string> = {
  INTJ: "bg-indigo-500/20 text-indigo-500 border-indigo-500/40",
  INTP: "bg-indigo-500/20 text-indigo-500 border-indigo-500/40",
  ENTJ: "bg-purple-500/20 text-purple-500 border-purple-500/40",
  ENTP: "bg-purple-500/20 text-purple-500 border-purple-500/40",
  INFJ: "bg-teal-500/20 text-teal-500 border-teal-500/40",
  INFP: "bg-teal-500/20 text-teal-500 border-teal-500/40",
  ENFJ: "bg-green-500/20 text-green-500 border-green-500/40",
  ENFP: "bg-green-500/20 text-green-500 border-green-500/40",
  ISTJ: "bg-blue-500/20 text-blue-500 border-blue-500/40",
  ISFJ: "bg-blue-500/20 text-blue-500 border-blue-500/40",
  ESTJ: "bg-orange-500/20 text-orange-500 border-orange-500/40",
  ESFJ: "bg-orange-500/20 text-orange-500 border-orange-500/40",
  ISTP: "bg-gray-500/20 text-gray-500 border-gray-500/40",
  ISFP: "bg-pink-500/20 text-pink-500 border-pink-500/40",
  ESTP: "bg-red-500/20 text-red-500 border-red-500/40",
  ESFP: "bg-yellow-500/20 text-yellow-500 border-yellow-500/40"
};
const MBTI_TYPES = Object.keys(MBTI_COLOR);

// Setup steps: 0=photo/bio, 1=style, 2=destination, 3=personality, 4=done

const ProfileSetupPage = () => {
  const {
    t
  } = useTranslation();
  const getArr = (k: string, fb: any[]) => {
    const v = t(k, {
      returnObjects: true
    });
    return Array.isArray(v) && v.length ? v : fb;
  };
  const TRAVEL_STYLES = getArr("travelStyles", [t("auto.z_autoz배낭여행5_81"), t("auto.z_autoz럭셔리52_82"), t("auto.z_autoz자연트레킹_83"), t("auto.z_autoz맛집탐방5_84"), t("auto.z_autoz문화역사5_85"), t("auto.z_autoz휴양호캉스_86"), t("auto.z_autoz사진촬영5_87"), t("auto.z_autoz나이트라이_88"), t("auto.z_autoz쇼핑59_89"), t("auto.z_autoz요가힐링6_90"), t("auto.z_autoz현지체험6_91"), t("auto.z_autoz로드트립6_92")]);
  const REGIONS = getArr("regions", [t("auto.z_autoz동남아63_93"), t("auto.z_autoz유럽64_94"), t("auto.z_autoz일본65_95"), t("auto.z_autoz미주캐나다_96"), t("auto.z_autoz중남미67_97"), t("auto.z_autoz중동아프리_98"), t("auto.z_autoz대양주69_99"), t("auto.z_autoz국내70_100"), t("auto.z_autoz중화권71_101"), t("auto.z_autoz인도권72_102")]);
  const LANGUAGES = getArr("login.languages", [t("auto.z_autoz한국어73_103"), "English", "日本語", "中文", "Español", "Français", "Deutsch", "عربي", "Русский", "Português", "हिन्दी", "Tiếng Việt", "ภาษาไทย", "Bahasa Indonesia", "Italiano", "Türkçe", "Nederlands", "Polski", "Bahasa Melayu", "Svenska"]);
  const PERSONALITIES = [{
    id: "planner",
    emoji: "📋",
    titleKey: "profileSetup.personality0",
    fb: t("auto.p534")
  }, {
    id: "free",
    emoji: "🌊",
    titleKey: "login.personality1Title",
    fb: t("login.personality1Title")
  }, {
    id: "social",
    emoji: "🤝",
    titleKey: "login.personality2Title",
    fb: t("login.personality2Title")
  }, {
    id: "solo",
    emoji: "🎧",
    titleKey: "login.personality3Title",
    fb: t("login.personality3Title")
  }, {
    id: "photo",
    emoji: "📸",
    titleKey: "login.personality4Title",
    fb: t("login.personality4Title")
  }, {
    id: "food",
    emoji: "🍽️",
    titleKey: "login.personality5Title",
    fb: t("login.personality5Title")
  }].map(p => ({
    ...p,
    label: t(p.titleKey) === p.titleKey ? p.fb : t(p.titleKey)
  }));
  const SETUP_STEPS = getArr("profileSetup.steps", [{
    title: t("auto.p535"),
    sub: t("auto.p536"),
    icon: "🤳"
  }, {
    title: t("auto.p537"),
    sub: t("auto.p538"),
    icon: "✈️"
  }, {
    title: t("auto.p539"),
    sub: t("auto.p540"),
    icon: "🗺️"
  }, {
    title: t("auto.p541"),
    sub: t("auto.p542"),
    icon: "🧭"
  }, {
    title: t("profileSetup.step5Title"),
    sub: t("profileSetup.step5Sub"),
    icon: "🧠"
  }]);
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const MAX_PROFILE_PHOTOS = 6;

  // Step 0
  const [profilePhotos, setProfilePhotos] = useState<Array<{ file: File; url: string }>>([]);
  const [userType, setUserType] = useState<"traveler" | "local">("traveler");
  const [bio, setBio] = useState("");
  const [travelMission, setTravelMission] = useState("");
  const [destination, setDestination] = useState("");
  const [travelDate, setTravelDate] = useState("");

  // Step 1
  const [styles, setStyles] = useState<string[]>([]);

  // Step 2
  const [regions, setRegions] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([t("profileSetup.langDefault", t("auto.z_autoz한국어74_104"))]);

  // Step 3
  const [personality, setPersonality] = useState<string[]>([]);
  // Step 4 - MBTI
  const [mbti, setMbti] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const toggleItem = (item: string, list: string[], setList: (v: string[]) => void, max = 99) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else if (list.length < max) {
      setList([...list, item]);
    }
  };
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_PROFILE_PHOTOS - profilePhotos.length;
    const toAdd = files.slice(0, remaining).map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));
    if (toAdd.length) {
      setProfilePhotos(prev => [...prev, ...toAdd]);
    }
    e.target.value = "";
  };
  const handleNext = async () => {
    if (step === 0 && !bio.trim()) {
      toast({
        title: t("profileSetup.errBio"),
        variant: "destructive"
      });
      return;
    }
    if (step === 1 && styles.length === 0) {
      toast({
        title: t("profileSetup.errStyle"),
        variant: "destructive"
      });
      return;
    }
    if (step === 2 && regions.length === 0) {
      toast({
        title: t("profileSetup.errRegion"),
        variant: "destructive"
      });
      return;
    }
    if (step === 3) {
      // MBTI 선택 (스킵 가능)
      setStep(s => s + 1);
      return;
    }
    if (step === 4) {
      if (!user) {
        navigate("/");
        return;
      }
      setSaving(true);
      try {
        let uploadedUrls: string[] = [];

        // 사진 업로드
        for (let i = 0; i < profilePhotos.length; i++) {
          const file = profilePhotos[i].file;
          const compressedFile = await compressImage(file);
          const ext = compressedFile.name.split(".").pop();
          const path = `${user.id}/profile_${Date.now()}_${i}.${ext}`;
          const { error: upErr } = await supabase.storage.from("avatars").upload(path, compressedFile, {
            upsert: true,
            contentType: compressedFile.type
          });
          if (!upErr) {
            const { data } = supabase.storage.from("avatars").getPublicUrl(path);
            uploadedUrls.push(data.publicUrl);
          }
        }
        
        const photoUrl = uploadedUrls[0];

        // profiles 업데이트
        await supabase.from("profiles").update({
          user_type: userType,
          travel_mission: travelMission,
          bio,
          location: destination,
          travel_dates: travelDate,
          interests: styles,
          languages,
          preferred_regions: regions,
          personality_tags: personality,
          mbti: mbti || null,
          ...(photoUrl ? {
            photo_url: photoUrl,
            photo_urls: uploadedUrls
          } : {}),
          setup_complete: true
        }).eq("id", user.id);
        toast({
          title: t("profileSetup.doneTitle"),
          description: t("profileSetup.doneDesc")
        });
        setTimeout(() => navigate("/"), 800);
      } catch {
        toast({
          title: t("profileSetup.errSave"),
          description: t("profileSetup.errSaveDesc"),
          variant: "destructive"
        });
      } finally {
        setSaving(false);
      }
      return;
    }
    setStep(s => s + 1);
  };
  const progress = step / (SETUP_STEPS.length - 1) * 100;
  return <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div className="absolute w-96 h-96 rounded-full bg-primary/10 blur-3xl" animate={{
        scale: [1, 1.1, 1],
        x: [0, 30, 0],
        y: [0, -20, 0]
      }} transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }} style={{
        top: "-20%",
        right: "-20%"
      }} />
        <motion.div className="absolute w-72 h-72 rounded-full bg-accent/10 blur-3xl" animate={{
        scale: [1, 1.15, 1],
        y: [0, 20, 0]
      }} transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 2
      }} style={{
        bottom: "5%",
        left: "-15%"
      }} />
      </div>

      {/* Header */}
      <div className="px-5 pt-12 pb-4 z-10 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <img src={siteLogo} alt="Migo" className="h-10 object-contain" />
          <span className="text-xs font-bold text-muted-foreground">{step + 1}/{SETUP_STEPS.length}</span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full gradient-primary" animate={{
          width: `${progress}%`
        }} transition={{
          type: "spring",
          damping: 20
        }} />
        </div>
      </div>

      {/* Step title */}
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{
        opacity: 0,
        y: 12
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: -12
      }} transition={{
        duration: 0.25
      }} className="px-6 pb-4 z-10 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{SETUP_STEPS[step].icon}</span>
            <h2 className="text-xl font-extrabold text-foreground whitespace-pre-line">{SETUP_STEPS[step].title}</h2>
          </div>
          <p className="text-sm text-muted-foreground ml-9">{SETUP_STEPS[step].sub}</p>
        </motion.div>
      </AnimatePresence>

      {/* Form area */}
      <div className="flex-1 overflow-y-auto z-10">
        <AnimatePresence mode="wait">

          {/* ─── STEP 0: PHOTO + BIO ─── */}
          {step === 0 && <motion.div key="step0" className="px-6 pb-6 space-y-5" initial={{
          opacity: 0,
          x: 30
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -30
        }} transition={{
          duration: 0.25
        }}>

              {/* Photo picker */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">{t("profileSetup.addPhoto")}</span>
                  <span className="text-[10px] text-muted-foreground">{profilePhotos.length}/{MAX_PROFILE_PHOTOS}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {profilePhotos.map((photoItem, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-border shadow-sm">
                      <img src={photoItem.url} alt="" className="w-full h-full object-cover" />
                      {idx === 0 && <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-extrabold px-1.5 py-0.5 rounded-full z-10">Main</div>}
                      <button onClick={(e) => { e.stopPropagation(); setProfilePhotos(prev => prev.filter((_, i) => i !== idx)); }} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center z-10">
                        <X size={10} className="text-white" />
                      </button>
                    </div>
                  ))}
                  {profilePhotos.length < MAX_PROFILE_PHOTOS && (
                    <motion.div whileTap={{ scale: 0.95 }} onClick={() => fileRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-primary/30 bg-muted flex flex-col items-center justify-center gap-1 cursor-pointer">
                      <Camera size={18} className="text-primary/60" />
                      <span className="text-[10px] text-primary/60">{t("profileSetup.addPhoto", "Add Photo")}</span>
                    </motion.div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
                <p className="text-xs text-muted-foreground mt-1 text-center">{t("profileSetup.photoHint1")} <span className="text-primary font-bold">{t("profileSetup.photoHint2")}</span> {t("profileSetup.photoHint3")}</p>
              </div>

              {/* User Type */}
              <div className="flex bg-muted rounded-2xl p-1 mb-2">
                <button className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${userType === 'traveler' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`} onClick={() => setUserType('traveler')}>
                  {t('profileSetup.traveler', t("auto.x4097"))}
                </button>
                <button className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${userType === 'local' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`} onClick={() => setUserType('local')}>
                  {t('profileSetup.localGuide', t("auto.x4098"))}
                </button>
              </div>

              {/* Travel Mission */}
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">{t("profileSetup.missionLabel", t("auto.x4099"))}</label>
                <input type="text" value={travelMission} onChange={e => setTravelMission(e.target.value)} maxLength={50} placeholder={t("profileSetup.missionPlaceholder", t("auto.x4100"))} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" />
              </div>

              {/* Bio */}
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">{t("profileSetup.bioLabel")}</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={120} rows={3} placeholder={t("profileSetup.bioPlaceholder")} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:ring-2 focus:ring-primary/30" />
                <p className="text-[10px] text-muted-foreground text-right mt-1">{bio.length}/120</p>
              </div>

              {/* Next travel destination */}
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">{t("profileSetup.destLabel")}</label>
                <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3">
                  <MapPin size={16} className="text-primary shrink-0" />
                  <input type="text" value={destination} onChange={e => setDestination(e.target.value)} placeholder={t("profileSetup.destPlaceholder")} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                </div>
              </div>

              {/* Travel dates */}
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">{t("profileSetup.dateLabel")}</label>
                <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3">
                  <Calendar size={16} className="text-primary shrink-0" />
                  <input type="text" value={travelDate} onChange={e => setTravelDate(e.target.value)} placeholder={t("profileSetup.datePlaceholder")} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                </div>
              </div>
            </motion.div>}

          {/* ─── STEP 1: TRAVEL STYLE ─── */}
          {step === 1 && <motion.div key="step1" className="px-6 pb-6" initial={{
          opacity: 0,
          x: 30
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -30
        }} transition={{
          duration: 0.25
        }}>
              <p className="text-xs text-muted-foreground mb-3">{t("profileSetup.maxFive")} <span className="text-foreground font-bold">({styles.length}/5)</span></p>
              <div className="flex flex-wrap gap-2">
                {TRAVEL_STYLES.map(s => {
              const selected = styles.includes(s);
              return <motion.button key={s} whileTap={{
                scale: 0.95
              }} onClick={() => toggleItem(s, styles, setStyles, 5)} className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all border-2 ${selected ? "gradient-primary text-primary-foreground border-transparent shadow-card" : "bg-muted text-muted-foreground border-transparent hover:border-primary/30"} ${!selected && styles.length >= 5 ? "opacity-40" : ""}`}>
                      {s}
                    </motion.button>;
            })}
              </div>
            </motion.div>}

          {/* ─── STEP 2: REGIONS + LANGUAGES ─── */}
          {step === 2 && <motion.div key="step2" className="px-6 pb-6 space-y-5" initial={{
          opacity: 0,
          x: 30
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -30
        }} transition={{
          duration: 0.25
        }}>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Globe size={14} className="text-primary" />
                  <p className="text-xs font-bold text-foreground">{t("profileSetup.regionsLabel")} <span className="text-muted-foreground font-normal">{t("profileSetup.multi")}</span></p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {REGIONS.map(r => <button key={r} onClick={() => toggleItem(r, regions, setRegions)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border-2 ${regions.includes(r) ? "gradient-primary text-primary-foreground border-transparent shadow-card" : "bg-muted text-muted-foreground border-transparent"}`}>{r}</button>)}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User size={14} className="text-primary" />
                  <p className="text-xs font-bold text-foreground">{t("profileSetup.langLabel")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(l => <button key={l} onClick={() => toggleItem(l, languages, setLanguages)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border-2 ${languages.includes(l) ? "gradient-primary text-primary-foreground border-transparent shadow-card" : "bg-muted text-muted-foreground border-transparent"}`}>{l}</button>)}
                </div>
              </div>
            </motion.div>}

          {/* ─── STEP 3: PERSONALITY ─── */}
          {step === 3 && <motion.div key="step3" className="px-6 pb-6" initial={{
          opacity: 0,
          x: 30
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -30
        }} transition={{
          duration: 0.25
        }}>
              <p className="text-xs text-muted-foreground mb-3">{t("profileSetup.selectAll")}</p>
              <div className="grid grid-cols-2 gap-3">
                {PERSONALITIES.map(p => {
              const selected = personality.includes(p.id);
              return <motion.button key={p.id} whileTap={{
                scale: 0.95
              }} onClick={() => toggleItem(p.id, personality, setPersonality)} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${selected ? "border-primary bg-primary/5 shadow-card" : "border-border bg-card"}`}>
                      <span className="text-3xl">{p.emoji}</span>
                      <span className="text-xs font-semibold text-foreground text-center leading-tight">{p.label}</span>
                      {selected && <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center"><Check size={12} className="text-primary-foreground" /></div>}
                    </motion.button>;
            })}
              </div>

              {/* Profile preview */}
              <div className="mt-5 p-4 rounded-2xl bg-card border border-border shadow-card">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-3">{t("profileSetup.preview")}</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-muted shrink-0">
                    {profilePhotos[0]?.url ? <img src={profilePhotos[0].url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User size={20} className="text-muted-foreground" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm text-foreground">{t("profileSetup.me")}</p>
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/40 text-[8px] font-extrabold text-sky-400">✅ {t("profileSetup.verified")}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{bio || t("profileSetup.noBio")}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {styles.slice(0, 3).map(s => <span key={s} className="px-2 py-0.5 rounded-full bg-muted text-[9px] font-semibold text-muted-foreground">{s}</span>)}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>}

          {/* ─── STEP 4: MBTI ─── */}
          {step === 4 && <motion.div key="step4" className="px-6 pb-6" initial={{
          opacity: 0,
          x: 30
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -30
        }} transition={{
          duration: 0.25
        }}>
              <p className="text-xs text-muted-foreground mb-4">{t('profileSetup.mbtiSelect')}</p>
              <div className="grid grid-cols-4 gap-2">
                {MBTI_TYPES.map(type => {
              const selected = mbti === type;
              const colorClass = MBTI_COLOR[type] || "bg-muted text-foreground border-border";
              return <motion.button key={type} whileTap={{
                scale: 0.92
              }} onClick={() => setMbti(selected ? null : type)} className={`py-3 rounded-2xl border-2 font-extrabold text-sm transition-all ${selected ? `${colorClass} shadow-card scale-105` : "border-border bg-card text-muted-foreground"}`}>
                      {type}
                    </motion.button>;
            })}
              </div>
              {mbti && <motion.div initial={{
            opacity: 0,
            y: 8
          }} animate={{
            opacity: 1,
            y: 0
          }} className="mt-5 p-4 rounded-2xl bg-card border border-border shadow-card text-center">
                  <p className="text-xs text-muted-foreground mb-1">{t("profileSetup.selectedMbti")}</p>
                  <p className={`text-3xl font-black`}>{mbti}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t("profileSetup.mbtiNotice")}</p>
                </motion.div>}
            </motion.div>}
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <div className="px-6 pb-10 pt-2 z-10 shrink-0">
        {step < SETUP_STEPS.length - 1 && <p className="text-xs text-center text-muted-foreground mb-2">
            <button onClick={() => {
          step < 3 ? setStep(step + 1) : navigate("/");
        }} className="text-muted-foreground underline">{t('profileSetup.skip')}</button>
          </p>}
        <motion.button whileTap={{
        scale: 0.97
      }} onClick={handleNext} className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-base shadow-float flex items-center justify-center gap-2">
          {step === SETUP_STEPS.length - 1 ? <><Sparkles size={18} /> {t("profileSetup.start")}</> : <>{t("profileSetup.next")} <ChevronRight size={18} /></>}
        </motion.button>
      </div>
    </div>;
};
export default ProfileSetupPage;