import i18n from "@/i18n";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Crown, Shuffle, Shield, Star, ChevronDown, ChevronUp, Users, MapPin, Calendar, Zap, Gift, Check, SlidersHorizontal, X, Languages, Share2, Clock } from "lucide-react";
import { translateText } from "@/lib/translateService";
import { TIER_LOCALES } from "@/i18n/tierLocales";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/context/SubscriptionContext";
import { supabase } from "@/lib/supabaseClient";
import { useTranslation } from "react-i18next";
import { toast } from "@/hooks/use-toast";
import { runMatchingEngine, type MatchInput, type MatchResult, type UserGender, type TripVibe, type GenderRatioPref } from "@/lib/matchingEngine";
import { GROUP_TIER_CONFIGS, getLocalizedPrice } from "@/lib/pricing";
import type { TripGroup } from "@/types/tripGroup";
import MatchCard from "@/components/MatchCard";
import PaymentModal from "@/components/PaymentModal";
import MigoPlusModal from "@/components/MigoPlusModal";
import { useGlobalFilter } from "@/context/GlobalFilterContext";
import { getChosung } from "@/lib/chosungUtils";

// ──────────────────────────────────────────────
// Vibe options
// ──────────────────────────────────────────────
const VIBES: {
  id: TripVibe;
  emoji: string;
  label: string;
  desc: string;
}[] = [{
  id: "any",
  emoji: "✨",
  label: i18n.t("auto.z_\uC804\uCCB4_d1d0de"),
  desc: i18n.t("auto.db_desc_상관없음", { defaultValue: "상관없어요" })
}, {
  id: "party",
  emoji: "🎉",
  label: i18n.t("auto.z_\uD30C\uD2F0\uD615_4f5e8d"),
  desc: i18n.t("auto.db_desc_즐기기2", { defaultValue: "신나게 즐기기" })
}, {
  id: "healing",
  emoji: "😊",
  label: i18n.t("auto.z_\uD790\uB9C1\uD615_36e087"),
  desc: i18n.t("auto.db_desc_여유", { defaultValue: "여유롭게 쉬기" })
}, {
  id: "serious",
  emoji: "🎯",
  label: i18n.t("auto.z_\uC9C4\uC9C0\uD615_570e91"),
  desc: i18n.t("auto.db_desc_목적여행2", { defaultValue: "목적 있는 여행" })
}];
const GENDER_PREFS: {
  id: GenderRatioPref;
  label: string;
  icon: string;
}[] = [{
  id: "any",
  label: i18n.t("auto.z_\uC0C1\uAD00\uC5C6\uC74C_cc228d"),
  icon: "✨"
}, {
  id: "balanced",
  label: i18n.t("auto.z_\uC131\uBE44\uADE0\uD615_ff683e"),
  icon: "👫"
}, {
  id: "more-female",
  label: i18n.t("auto.z_\uC5EC\uC131_cf65dd"),
  icon: "👩"
}, {
  id: "more-male",
  label: i18n.t("auto.z_\uB0A8\uC131_028e54"),
  icon: "👨"
}];

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────
const TripMatchPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    isPlus
  } = useSubscription();
  const {
    i18n
  } = useTranslation();

  // ── GlobalFilter ───────────────────────────────
  const {
    filters: globalFilters
  } = useGlobalFilter();

  // ── State ──────────────────────────────────────
  const [mode, setMode] = useState<"random" | "premium">("random");
  const [groups, setGroups] = useState<TripGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [accepted, setAccepted] = useState<Set<string>>(new Set());

  // Filter inputs
  const [destination, setDestination] = useState("");
  const [vibe, setVibe] = useState<TripVibe>("any");
  const [genderPref, setGenderPref] = useState<GenderRatioPref>("any");
  const [showFilters, setShowFilters] = useState(false);

  // Payment / Matching
  const [payTarget, setPayTarget] = useState<MatchResult | null>(null);
  const [detailGroup, setDetailGroup] = useState<TripGroup | null>(null);
  const [translateMap, setTranslateMap] = useState<Record<string, string>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const translateMapRef = React.useRef<Record<string, string>>({});
  const handleTranslate = React.useCallback(async (text: string, key: string) => {
    if (translateMapRef.current[key]) {
      // toggle off
      setTranslateMap(prev => {
        const next = { ...prev };
        delete next[key];
        translateMapRef.current = next;
        return next;
      });
      return;
    }
    if (!text.trim()) return;
    setLoadingMap(prev => ({ ...prev, [key]: true }));
    try {
      const targetLang = i18n.language.split("-")[0] || "en";
      const res = await translateText({ text, targetLang: targetLang as any });
      translateMapRef.current = { ...translateMapRef.current, [key]: res };
      setTranslateMap(prev => ({ ...prev, [key]: res }));
    } finally {
      setLoadingMap(prev => ({ ...prev, [key]: false }));
    }
  }, [i18n.language]);
  const [showPlusModal, setShowPlusModal] = useState(false);

  // User gender (from profile)
  const [myGender, setMyGender] = useState<UserGender>("other");

  // ── Load profile gender ──────────────────────
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("gender").eq("id", user.id).maybeSingle().then(({
      data
    }) => {
      if (data?.gender) {
        const g = data.gender.toLowerCase();
        if (g === "male" || g === "남" || g === "남성") setMyGender("male");else if (g === "female" || g === "여" || g === "여성") setMyGender("female");else setMyGender("other");
      }
    });
  }, [user]);

  // ── Load real groups from Supabase — GlobalFilter 연동 ──
  useEffect(() => {
    setLoading(true);
    let query = supabase.from("trip_groups").select("*, profiles:host_id(name, photo_url), trip_group_members(user_id)").eq("status", "active").order("created_at", {
      ascending: false
    }).limit(60);

    // 목적지 필터 (GlobalFilter.destination)
    if (globalFilters.destination) {
      const dest = globalFilters.destination;
      const cho = getChosung(dest);
      query = query.or(`destination.ilike.%${dest}%,title.ilike.%${dest}%,destination_chosung.ilike.%${cho}%,title_chosung.ilike.%${cho}%`);
    }
    // 인원 필터 (GlobalFilter.groupSize)
    if (globalFilters.groupSize !== null) {
      query = query.gte("max_members", globalFilters.groupSize);
    }
    query.then(({
      data
    }) => {
      let mapped: TripGroup[] = (data || []).map((g: any) => ({
        id: g.id,
        title: g.title,
        destination: g.destination || "",
        dates: g.dates || "",
        currentMembers: (g.trip_group_members || []).length,
        maxMembers: g.max_members ?? 6,
        tags: g.tags || [],
        hostId: g.host_id,
        hostPhoto: g.profiles?.photo_url || "",
        hostName: g.profiles?.name || "호스트",
        daysLeft: Math.max(0, Math.ceil((new Date(g.dates?.split("~")[1] || Date.now()).getTime() - Date.now()) / 86400000)),
        joined: (g.trip_group_members || []).some((m: any) => m.user_id === user?.id),
        memberPhotos: [],
        memberNames: [],
        isPremiumGroup: g.is_premium ?? false,
        coverImage: g.cover_image || "",
        description: g.description || "",
        schedule: g.schedule || [],
        entryFee: g.entry_fee || 0
      }));

      // 날짜 필터 (클라이언트 사이드 — dates는 텍스트 컬럼)
      if (globalFilters.dateRange.start) {
        const filterStart = new Date(globalFilters.dateRange.start);
        mapped = mapped.filter(g => {
          if (!g.dates) return true;
          const raw = g.dates.split("~")[0]?.trim().replace(/\./g, "-");
          const groupStart = new Date(raw);
          if (isNaN(groupStart.getTime())) return true;
          if (globalFilters.dateRange.end) {
            const filterEnd = new Date(globalFilters.dateRange.end);
            return groupStart <= filterEnd && new Date(g.dates.split("~")[1]?.trim().replace(/\./g, "-") || raw) >= filterStart;
          }
          return groupStart >= filterStart;
        });
      }
      setGroups(mapped);
      setLoading(false);
    });
  }, [user, globalFilters]);

  // ── Run matching engine ─────────────────────
  const matchInput = useMemo<MatchInput>(() => ({
    userId: user?.id ?? "",
    gender: myGender,
    destination,
    vibe,
    genderRatioPref: genderPref,
    isPremium: mode === "premium",
    minSize: 4,
    maxSize: 8
  }), [user?.id, myGender, destination, vibe, genderPref, mode]);
  const results = useMemo(() => {
    return runMatchingEngine(groups, matchInput).filter(r => !skipped.has(r.group.id));
  }, [groups, matchInput, skipped]);

  // ── Handlers ───────────────────────────────
  const handleAccept = (result: MatchResult) => {
    if (!user) {
      toast({
        title: i18n.t("auto.z_\uB85C\uADF8\uC778\uC774_c49092"),
        variant: "destructive"
      });
      return;
    }
    if (mode === "premium" && !isPlus) {
      setShowPlusModal(true);
      return;
    }
    setPayTarget(result);
  };
  const handleSkip = (result: MatchResult) => {
    setSkipped(prev => new Set([...prev, result.group.id]));
    toast({
      title: i18n.t("tripMatch.pass", {
        title: result.group.title
      }),
      duration: 1500
    });
  };
  const handlePaymentSuccess = () => {
    if (!payTarget) return;
    setAccepted(prev => new Set([...prev, payTarget.group.id]));
    setSkipped(prev => new Set([...prev, payTarget.group.id]));
    setPayTarget(null);
    toast({
      title: i18n.t("tripMatch.joinSuccess"),
      description: payTarget.group.title
    });
  };
  const activeFilterCount = [destination, vibe !== "any", genderPref !== "any"].filter(Boolean).length;

  // ──────────────────────────────────────────────
  // JSX
  // ──────────────────────────────────────────────
  return <div className="min-h-screen bg-background pb-32">
      {/* ── Loading Overlay ── */}
      <AnimatePresence>
        {loading && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-foreground">{i18n.t("tripMatch.searching")}</p>
            </div>
          </motion.div>}
      </AnimatePresence>

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-border/40">
        <div className="flex items-center gap-3 px-5 pt-12 pb-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center active:scale-90">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold text-foreground">{i18n.t("tripMatch.title")}</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {i18n.t("tripMatch.subtitle", {
              count: results.length
            })}
            </p>
          </div>
          {/* Filter button */}
          <button onClick={() => setShowFilters(v => !v)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${activeFilterCount > 0 ? "bg-primary/15 border-primary/40 text-primary" : "bg-muted border-transparent text-muted-foreground"}`}>
            <SlidersHorizontal size={12} />
            {i18n.t("tripMatch.filter")}
            {activeFilterCount > 0 && <span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] font-extrabold flex items-center justify-center">
                {activeFilterCount}
              </span>}
            {showFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {/* ── Mode toggle ── */}
        <div className="flex gap-2 px-5 pb-3">
          {/* Random */}
          <button onClick={() => setMode("random")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all text-sm font-extrabold ${mode === "random" ? "border-transparent bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25" : "border-border bg-muted text-muted-foreground"}`}>
            <Shuffle size={15} />
            {i18n.t("tripMatch.randomMatch")}
          </button>

          {/* Premium */}
          <button onClick={() => setMode("premium")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all text-sm font-extrabold relative overflow-hidden ${mode === "premium" ? "border-transparent bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30" : "border-amber-500/40 bg-amber-500/5 text-amber-600"}`}>
            {mode === "premium" && <motion.div className="absolute inset-0 bg-white/10" animate={{
            x: ["-100%", "100%"]
          }} transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "linear"
          }} style={{
            skewX: -20
          }} />}
            <Crown size={15} className="relative z-10" />
            <span className="relative z-10">{i18n.t("tripMatch.premiumMatch")}</span>
            {!isPlus && <Zap size={11} className="relative z-10 text-white/80" />}
          </button>
        </div>

        {/* ── Premium locked banner (sticky) ── */}
        <AnimatePresence>
          {mode === "premium" && !isPlus && <motion.div initial={{
          height: 0,
          opacity: 0
        }} animate={{
          height: "auto",
          opacity: 1
        }} exit={{
          height: 0,
          opacity: 0
        }} className="overflow-hidden">
              <div className="mx-5 mb-3 p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex items-center gap-3">
                <Crown size={16} className="text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-extrabold text-amber-600">{i18n.t("auto.z_Migo_cb3e39")}</p>
                  <p className="text-[10px] text-amber-600/70 truncate">{i18n.t("auto.z_\uC131\uBE44\uC870\uC808_788a9c")}</p>
                </div>
                <button onClick={() => setShowPlusModal(true)} className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-extrabold shrink-0">{i18n.t("auto.z_\uAD6C\uB3C5\uD558\uAE30_e60da1")}</button>
              </div>
            </motion.div>}
        </AnimatePresence>

        {/* ── Filter panel (sticky, inside header) ── */}
        <AnimatePresence>
          {showFilters && <motion.div initial={{
          height: 0,
          opacity: 0
        }} animate={{
          height: "auto",
          opacity: 1
        }} exit={{
          height: 0,
          opacity: 0
        }} className="overflow-hidden">
              <div className="mx-5 mb-3 p-4 rounded-2xl bg-muted/60 border border-border space-y-4">
                {/* Destination */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">{i18n.t("auto.z_\uBAA9\uC801\uC9C0_ffdbab")}</label>
                  <div className="relative">
                    <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                    <input type="text" value={destination} onChange={e => setDestination(e.target.value)} placeholder={i18n.t("auto.z_\uB3C4\uCFC4\uBC29\uCF55_7e3d81")} className="w-full bg-card rounded-xl pl-8 pr-8 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
                    {destination && <button onClick={() => setDestination("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                        <X size={13} className="text-muted-foreground" />
                      </button>}
                  </div>
                </div>

                {/* Vibe */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">{i18n.t("auto.z_\uC5EC\uD589\uC2A4\uD0C0_1d5cf5")}</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {VIBES.map(v => <button key={v.id} onClick={() => setVibe(v.id)} className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${vibe === v.id ? "border-transparent bg-primary/15 text-primary" : "border-border bg-card text-muted-foreground"}`}>
                        <span className="text-lg">{v.emoji}</span>
                        <span className="text-[10px] font-bold">{v.label}</span>
                      </button>)}
                  </div>
                </div>

                {/* Gender pref (Premium only) */}
                {mode === "premium" && <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">{i18n.t("auto.z_\uC131\uBE44\uC120\uD638_0632e9")}</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {GENDER_PREFS.map(g => <button key={g.id} onClick={() => setGenderPref(g.id)} className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-[10px] font-bold transition-all ${genderPref === g.id ? "border-transparent bg-pink-500/15 text-pink-600" : "border-border bg-card text-muted-foreground"}`}>
                          <span className="text-lg">{g.icon}</span>
                          {g.label}
                        </button>)}
                    </div>
                  </div>}

                {/* Apply / Reset row */}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => {
                setDestination("");
                setVibe("any");
                setGenderPref("any");
              }} className="flex-1 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-bold border border-border">{i18n.t("auto.z_\uCD08\uAE30\uD654_2d7cf9")}</button>
                  <button onClick={() => setShowFilters(false)} className="flex-1 py-2 rounded-xl gradient-primary text-white text-xs font-extrabold">{i18n.t("auto.z_\uC801\uC6A9\uD558\uAE30_52a947")}</button>
                </div>
              </div>
            </motion.div>}
        </AnimatePresence>
      </header>

      {/* ── Mode info banner ── */}
      <div className="px-5 mt-4">
        {mode === "random" ? <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/20">
            <Shuffle size={15} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-blue-600">{i18n.t("auto.z_\uC77C\uBC18\uB79C\uB364_9b266a")}</p>
              <p className="text-[10px] text-blue-500/70 mt-0.5">{i18n.t("auto.z_\uC131\uBE44\uBCF4\uC7A5_efe8fd")}</p>
            </div>
            {myGender === "female" && <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded-full bg-pink-500/15 text-pink-500">
                <Gift size={11} />
                <span className="text-[10px] font-extrabold">{i18n.t("auto.z_\uC5EC\uC131\uBB34\uB8CC_64c6fc")}</span>
              </div>}
          </div> : <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
            <Shield size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-600">{i18n.t("auto.z_\uD504\uB9AC\uBBF8\uC5C4_f33bf2")}</p>
              <p className="text-[10px] text-amber-500/70 mt-0.5">{i18n.t("auto.z_\uD3C9\uC81040_dbf77c")}</p>
            </div>
          </div>}
      </div>

      {/* ── Tier pricing overview ── */}
      {myGender !== "female" && <div className="px-5 mt-4">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{i18n.t("auto.z_\uCC38\uC5EC\uBE44\uC6A9_9565c9")}</p>
          <div className="flex gap-2">
            {GROUP_TIER_CONFIGS.map(cfg => {
          const fee = isPlus ? Math.round(cfg.krw * 0.5 / 100) * 100 : cfg.krw;
          return <div key={cfg.tier} className="flex-1 p-3 rounded-2xl bg-card border border-border text-center">
                  <div className="text-lg mb-1">{cfg.emoji}</div>
                  <div className="text-[10px] font-bold text-muted-foreground">
                    {TIER_LOCALES[i18n.language.split("-")[0] || "en"]?.tier?.[cfg.tier]?.label || cfg.label}
                  </div>
                  {isPlus && <div className="text-[9px] line-through text-muted-foreground/50">{getLocalizedPrice(cfg.krw, i18n.language)}</div>}
                  <div className="text-xs font-extrabold text-foreground mt-0.5">
                    {getLocalizedPrice(fee, i18n.language)}
                  </div>
                  {isPlus && <div className="text-[9px] text-primary font-bold">{i18n.t("auto.z_50\uD560\uC778_2bfea2")}</div>}
                </div>;
        })}
          </div>
          {!isPlus && <button onClick={() => setShowPlusModal(true)} className="w-full mt-2 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold border border-primary/20">{i18n.t("auto.z_\uAD6C\uB3C5\uD558\uBA74_880ca0")}</button>}
        </div>}

      {/* ── Female free notice ── */}
      {myGender === "female" && <div className="mx-5 mt-4 p-3 rounded-2xl bg-pink-500/5 border border-pink-500/20 flex items-center gap-2">
          <Gift size={14} className="text-pink-500 shrink-0" />
          <p className="text-xs text-pink-600 font-bold">{i18n.t("auto.z_\uC5EC\uC131\uC740\uBAA8_8e7181")}</p>
        </div>}

      {/* ── Results ── */}
      <div className="px-5 mt-5 space-y-4">
        {results.length === 0 ? <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Shuffle size={24} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-bold">{i18n.t("auto.z_\uB9E4\uCE6D\uAC00\uB2A5_95cffb")}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{i18n.t("auto.z_\uD544\uD130\uB97C\uC870_c7b924")}</p>
            {skipped.size > 0 && <button onClick={() => setSkipped(new Set())} className="mt-4 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-bold">{i18n.t("auto.z_\uD328\uC2A4\uD55C\uADF8_b637bd")}{skipped.size}{i18n.t("auto.z_\uAC1C_d22b87")}</button>}
          </div> : <>
            {/* Results count */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                <span className="font-extrabold text-foreground">{results.length}{i18n.t("auto.z_\uAC1C_1f31b2")}</span>{i18n.t("auto.z_\uADF8\uB8F9\uB9E4\uCE6D_748ec4")}</p>
              {accepted.size > 0 && <span className="flex items-center gap-1 text-xs text-emerald-500 font-bold">
                  <Check size={12} strokeWidth={3} /> {accepted.size}{i18n.t("auto.z_\uAC1C\uCC38\uC5EC\uC644_f9c3ae")}</span>}
            </div>

            <div className="relative w-full max-w-[420px] mx-auto mt-4" style={{ height: "65vh" }}>
              <AnimatePresence>
                {results.slice(0, 3).reverse().map((result, i, arr) => (
                  <MatchCard 
                    key={result.group.id} 
                    result={result} 
                    index={i} 
                    isTop={i === arr.length - 1}
                    onAccept={handleAccept} 
                    onSkip={handleSkip} 
                    isPremiumMode={mode === "premium"} 
                    onClickCard={(result) => setDetailGroup(result.group)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </>}
      </div>

      {/* ── Payment modal ── */}
      {payTarget && <PaymentModal isOpen={!!payTarget} onClose={() => setPayTarget(null)} groupTitle={payTarget.group.title} groupId={payTarget.group.id} groupTags={payTarget.group.tags} isPremiumGroup={payTarget.group.isPremiumGroup} onPaymentSuccess={handlePaymentSuccess} />}

      {/* ── Plus modal ── */}
      <MigoPlusModal isOpen={showPlusModal} onClose={() => setShowPlusModal(false)} />

      {/* ── Group Detail Modal ── */}
      <AnimatePresence>
        {detailGroup && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed inset-0 z-50 bg-background overflow-y-auto"
          >
            <div className="px-5 pt-12 pb-32">
              <button
                onClick={() => setDetailGroup(null)}
                className="flex items-center gap-2 text-sm text-muted-foreground mb-6 font-bold"
              >
                <ArrowLeft size={16} />{i18n.t("auto.z_autoz목록으로3_766", {defaultValue: "Go Back"})}
              </button>

              <div className="bg-card rounded-2xl p-4 shadow-card mb-4 border border-border/40">
                <div className="flex items-center gap-3 mb-3">
                  {detailGroup.hostPhoto ? (
                    <img
                      src={detailGroup.hostPhoto}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {detailGroup.hostName?.[0] || "M"}
                    </div>
                  )}
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-extrabold text-foreground break-words whitespace-pre-wrap">
                      {translateMap[`groupTitle_${detailGroup.id}`] || detailGroup.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{detailGroup.hostName}</p>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed break-words whitespace-pre-wrap">
                  {translateMap[`groupDesc_${detailGroup.id}`] || detailGroup.description}
                </p>
                
                {detailGroup.description && (
                  <div className="mt-4 pt-3 border-t border-border/40">
                    <button 
                      onClick={() => {
                        handleTranslate(detailGroup.title, `groupTitle_${detailGroup.id}`);
                        handleTranslate(detailGroup.description || "", `groupDesc_${detailGroup.id}`);
                        if (detailGroup.destination) handleTranslate(detailGroup.destination, `groupDest_${detailGroup.id}`);
                      }} 
                      className={`text-[11px] font-bold flex items-center gap-1.5 transition-colors px-2 py-1 -ml-2 rounded-lg ${
                        translateMap[`groupDesc_${detailGroup.id}`] 
                          ? "text-primary bg-primary/10" 
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Languages size={12} className={loadingMap[`groupDesc_${detailGroup.id}`] ? "animate-pulse" : ""} />
                      {loadingMap[`groupDesc_${detailGroup.id}`] 
                        ? i18n.t("auto.z_번역중_000", { defaultValue: "Translating..." }) 
                        : translateMap[`groupDesc_${detailGroup.id}`] 
                          ? i18n.t("auto.z_원문보기_001", { defaultValue: "Show original" }) 
                          : i18n.t("auto.z_번역보기_002", { defaultValue: "See translation" })
                      }
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-card rounded-2xl p-4 shadow-card mb-4 border border-border/40">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: i18n.t("auto.z_목적지_ffdbab", {defaultValue:"Destination"}), value: translateMap[`groupDest_${detailGroup.id}`] || detailGroup.destination, icon: MapPin },
                    { label: i18n.t("auto.z_날짜_a93b53", {defaultValue:"Dates"}), value: detailGroup.dates, icon: Calendar },
                    { label: i18n.t("auto.z_인원수_553bc2", {defaultValue:"Members"}), value: `${detailGroup.currentMembers}/${detailGroup.maxMembers}`, icon: Users },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-2">
                      <Icon size={14} className="text-primary shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">{label}</p>
                        <p className="text-xs font-bold text-foreground">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>;
};
export default TripMatchPage;