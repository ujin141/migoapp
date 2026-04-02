import i18n from "@/i18n";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Crown, Shuffle, Shield, Star, ChevronDown, ChevronUp, Users, MapPin, Calendar, Zap, Gift, Check, SlidersHorizontal, X, Languages, Share2, Clock, ChevronRight, Lock } from "lucide-react";
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
import { HOTPLACES, getRecommendationsForHotplace, PlaceRecommendation } from "@/lib/placeRecommendations";

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────
const TripMatchPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
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

  // ── VIBES & GENDER PREFS ─────────────────────
  const VIBES = useMemo<{ id: TripVibe; emoji: string; label: string; desc: string; }[]>(() => ([{
    id: "any",
    emoji: "✨",
    label: i18n.t("instant.styles.any"),
    desc: i18n.t("auto.db_desc_상관없음", { defaultValue: "상관없어요" })
  }, {
    id: "party",
    emoji: "🎉",
    label: i18n.t("instant.styles.party"),
    desc: i18n.t("auto.db_desc_즐기기2", { defaultValue: "신나게 즐기기" })
  }, {
    id: "healing",
    emoji: "😊",
    label: i18n.t("instant.styles.healing"),
    desc: i18n.t("auto.db_desc_여유", { defaultValue: "여유롭게 쉬기" })
  }, {
    id: "serious",
    emoji: "🎯",
    label: i18n.t("instant.styles.serious"),
    desc: i18n.t("auto.db_desc_목적여행2", { defaultValue: "목적 있는 여행" })
  }]), [i18n]);

  const GENDER_PREFS = useMemo<{ id: GenderRatioPref; label: string; icon: string; }[]>(() => ([{
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
  }]), [i18n]);

  // ── State ──────────────────────────────────────
  const [mode, setMode] = useState<"random" | "premium" | "instant">((location.state as any)?.initialMode || "random");
  const [hotplace, setHotplace] = useState<string>("hongdae");
  const [showRecommendation, setShowRecommendation] = useState<MatchResult | null>(null);
  const [groups, setGroups] = useState<TripGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [accepted, setAccepted] = useState<Set<string>>(new Set());

  // Filter inputs
  const [destination, setDestination] = useState("");
  const [vibe, setVibe] = useState<TripVibe>("any");
  const [genderPref, setGenderPref] = useState<GenderRatioPref>("any");
  const [showFilters, setShowFilters] = useState(false);

  // ── Random Match Setup ─────────────────────────
  const [showRandomSetup, setShowRandomSetup] = useState(false);
  const [meetCity, setMeetCity] = useState("");
  const [meetDate, setMeetDate] = useState("");
  const [meetTime, setMeetTime] = useState("18:00");
  const [meetPlace, setMeetPlace] = useState("");
  const POPULAR_CITIES = Object.values(i18n.t("instant.popCities", { returnObjects: true })) as string[];
  const POPULAR_PLACES = Object.values(i18n.t("instant.popPlaces", { returnObjects: true })) as string[];

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

  // User specific data (from profile)
  const [myGender, setMyGender] = useState<UserGender>("other");
  const [instantMeetsCount, setInstantMeetsCount] = useState(0);
  const [noShowCount, setNoShowCount] = useState(0);
  const [createdThreadId, setCreatedThreadId] = useState<string | null>(null);

  // ── Load profile data ──────────────────────
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("gender").eq("id", user.id).maybeSingle().then(({
      data
    }) => {
      if (data) {
        setInstantMeetsCount(0); // DB columns removed to fix 400 Bad Request
        setNoShowCount(0);
        if (data.gender) {
           const g = data.gender.toLowerCase();
           if (g === "male" || g === "남" || g === "남성") setMyGender("male");else if (g === "female" || g === "여" || g === "여성") setMyGender("female");else setMyGender("other");
        }
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
    isInstant: mode === "instant",
    hotplace: hotplace,
    isPlusUser: isPlus,
    minSize: 4,
    maxSize: 8
  }), [user?.id, myGender, destination, vibe, genderPref, mode, hotplace, isPlus]);
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

  // ── 랜덤 매칭 시작 (위치/시간/장소 포함) ──────────────────
  const handleStartRandomMeet = async () => {
    if (!user) return;
    if (results.length === 0) {
      toast({ title: i18n.t("instant.matchFail"), description: i18n.t("instant.matchFailDesc"), variant: "destructive" });
      return;
    }
    const target = results[0];
    // 약속 시간 계산 (meetDate + meetTime → UTC ISO string)
    let expiresAt: string | null = null;
    if (meetDate && meetTime) {
      expiresAt = new Date(`${meetDate}T${meetTime}:00`).toISOString();
    }
    const locationTag = meetCity ? ` · ${meetCity}` : "";
    const placeTag = meetPlace ? ` · ${meetPlace}` : "";
    const timeTag = meetDate ? ` · ${meetDate} ${meetTime}` : "";
    const threadName = `${i18n.t("instant.randomMatchPrefix")}${locationTag}${timeTag}${placeTag}`;
    setLoading(true);
    try {
      // 새 컬럼이 있는 경우 시도, 없으면 기존 컬럼만 사용
      let newThread: any = null;
      let thError: any = null;
      const meetingPlace = `${meetCity || i18n.t("instant.unknownPlace")} ${meetPlace || ""}`.trim();
      const meetingTime = meetDate ? `${meetDate} ${meetTime}` : i18n.t("instant.unknownTime");
      const insertPayload: any = {
        name: threadName,
        photo: target.group.hostPhoto || null,
        last_message: i18n.t("instant.chatLastMsg", { place: meetingPlace, time: meetingTime }),
        unread_count: 0,
      };
      if (expiresAt) insertPayload.meet_expires_at = expiresAt;

      const res1 = await supabase.from('chat_threads').insert(insertPayload).select('id').single();
      if (res1.error && (res1.error.code === '42703' || res1.error.message?.includes('column'))) {
        // 컬럼 없음 → 기본 삽입
        const res2 = await supabase.from('chat_threads').insert({
          name: threadName,
          photo_url: target.group.hostPhoto || null,
        }).select('id').single();
        newThread = res2.data;
        thError = res2.error;
      } else {
        newThread = res1.data;
        thError = res1.error;
      }
      if (thError || !newThread) throw new Error("Thread creation failed: " + (thError?.message || "unknown"));
      const tid = newThread.id;

      await supabase.from('chat_members').insert([
        { thread_id: tid, user_id: user.id },
        { thread_id: tid, user_id: target.group.hostId }
      ]);
      // 채팅방에 약속 정보 메시지 전송
      await supabase.from('messages').insert({
        thread_id: tid,
        sender_id: user.id,
        text: `${i18n.t("instant.proposalTitle")}\n${i18n.t("instant.proposalDate", { date: meetDate || i18n.t("instant.unknownTime"), time: meetTime || "" })}\n${i18n.t("instant.proposalPlace", { city: meetCity || "", place: meetPlace || i18n.t("instant.unknownPlace") })}\n\n${i18n.t("instant.proposalEnd")}`
      });
      setCreatedThreadId(tid);
      setShowRecommendation(target);
      toast({ title: i18n.t("instant.matchSuccessTitle"), description: threadName });
    } catch (err) {
      console.error("Random Meet Error:", err);
      toast({ title: i18n.t("instant.roomError"), description: i18n.t("instant.roomErrorDesc"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStartInstantMeet = async () => {
    if (!user) return;
    if (results.length === 0) {
      toast({ title: i18n.t("instant.matchFail"), description: i18n.t("instant.matchFailDesc2"), variant: "destructive" });
      return;
    }
    const target = results[0];
    // 바로모임: 1시간 후 자동 만료
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    setLoading(true);
    const threadTitle = (meetCity || meetDate || meetPlace) ? `💎 ${meetCity||""} ${meetPlace||""}`.trim() : `${i18n.t("instant.chatPrefix")}${target.group.title.substring(0, 10)}...`;
    
    const meetingPlace = `${meetCity || i18n.t("instant.unknownPlace")} ${meetPlace || ""}`.trim();
    const meetingTime = meetDate ? `${meetDate} ${meetTime}` : i18n.t("instant.unknownTime");

    const lastMsg = (meetCity || meetDate || meetPlace) 
      ? i18n.t("instant.chatLastMsg", { place: meetingPlace, time: meetingTime }) 
      : i18n.t("instant.chatLastMsgDefault");

    try {
      // Create new chat thread for this instant meet
      const tid = crypto.randomUUID();
      let thError: any = null;

      // Try with meet_expires_at (requires DB migration)
      const res1 = await supabase.from('chat_threads').insert({
        id: tid,
        name: threadTitle,
        photo: target.group.hostPhoto || null,
        last_message: lastMsg,
        unread_count: 0,
        meet_expires_at: expiresAt,
      });

      if (res1.error && res1.error.code === '42703') {
        // Column does not exist yet → fallback without new columns
        const res2 = await supabase.from('chat_threads').insert({
          id: tid,
          name: threadTitle,
          photo_url: target.group.hostPhoto || null,
        });
        thError = res2.error;
      } else {
        thError = res1.error;
      }

      if (thError) {
        console.error("Thread creation DB error:", thError);
        throw new Error("Thread creation failed");
      }


      // Add user and host to the thread
      await supabase.from('chat_members').insert([
        { thread_id: tid, user_id: user.id },
        { thread_id: tid, user_id: target.group.hostId }
      ]);
      
      // Update instant_meets_count (if free user, it will lock next time)
      if (!isPlus) {
        // DB column removed, so just update local state
        // await supabase.from('profiles').update({ instant_meets_count: instantMeetsCount + 1 }).eq('id', user.id);
        setInstantMeetsCount(prev => prev + 1);
      }

      setCreatedThreadId(tid);
      setShowRecommendation(target);
    } catch (err) {
      console.error("Instant Meet Error:", err);
      toast({ title: i18n.t("instant.roomError"), description: i18n.t("instant.roomErrorDesc"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const activeFilterCount = [destination, vibe !== "any", genderPref !== "any"].filter(Boolean).length;

  // ──────────────────────────────────────────────
  // JSX
  // ──────────────────────────────────────────────
  return <div className="min-h-screen bg-background" style={{ paddingBottom: 'calc(8rem + env(safe-area-inset-bottom, 0px))' }}>
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
        <div className="flex items-center gap-3 px-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 12px)', paddingBottom: '12px' }}>
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center active:scale-90 shrink-0">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold text-foreground truncate">{i18n.t("tripMatch.title")}</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {i18n.t("tripMatch.subtitle", {
              count: results.length
            })}
            </p>
          </div>
          {/* Filter button */}
          <button onClick={() => setShowFilters(v => !v)} className={`flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold border transition-all shrink-0 ${activeFilterCount > 0 ? "bg-primary/15 border-primary/40 text-primary" : "bg-muted border-transparent text-muted-foreground"}`}>
            <SlidersHorizontal size={12} />
            <span className="hidden sm:inline">{i18n.t("tripMatch.filter")}</span>
            {activeFilterCount > 0 && <span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] font-extrabold flex items-center justify-center">
                {activeFilterCount}
              </span>}
            {showFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {/* ── Mode toggle ── */}
        <div className="flex gap-1.5 px-4 pb-3">
          {/* Random */}
          <button onClick={() => setMode("random")} className={`flex-1 min-w-0 flex items-center justify-center gap-1 py-2.5 rounded-xl border-2 transition-all text-xs font-extrabold ${mode === "random" ? "border-transparent bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25" : "border-border bg-muted text-muted-foreground"}`}>
            <Shuffle size={13} className="shrink-0" />
            <span className="relative z-10 truncate">{i18n.t("tripMatch.randomMatch")}</span>
          </button>

          {/* Instant (바로모임) */}
          <button onClick={() => {
            if (noShowCount >= 3) {
              toast({ title: i18n.t("auto.v2_limit_title", { defaultValue: "이용 제한됨" }), description: i18n.t("auto.v2_limit_desc", { defaultValue: "노쇼가 3회 이상 누적되어 바로모임을 사용할 수 없습니다." }), variant: "destructive", duration: 3000 });
              return;
            }
            if (!isPlus && instantMeetsCount >= 1) {
              toast({ title: i18n.t("auto.v2_limit_free", { defaultValue: "무료 이용 완료" }), description: i18n.t("auto.v2_limit_free_desc", { defaultValue: "프리미엄 구독자는 바로모임을 무제한으로 이용할 수 있습니다." }), duration: 3000 });
              setShowPlusModal(true);
              return;
            }
            setMode("instant");
          }} className={`flex-1 min-w-0 flex items-center justify-center gap-1 py-2.5 rounded-xl border-2 transition-all text-xs font-extrabold relative overflow-hidden ${mode === "instant" ? "border-transparent bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30" : "border-rose-500/30 bg-rose-500/5 text-rose-600"} ${noShowCount >= 3 ? "opacity-50 cursor-not-allowed" : ""}`}>
            {noShowCount >= 3 ? <Lock size={13} className="relative z-10 shrink-0" /> : <Zap size={13} className="relative z-10 shrink-0" />}
            <span className="relative z-10 truncate">{i18n.t("auto.v2_instant", "바로모임")}</span>
          </button>

          {/* Premium */}
          <button onClick={() => setMode("premium")} className={`flex-1 min-w-0 flex items-center justify-center gap-1 py-2.5 rounded-xl border-2 transition-all text-xs font-extrabold relative overflow-hidden ${mode === "premium" ? "border-transparent bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30" : "border-amber-500/40 bg-amber-500/5 text-amber-600"}`}>
            {mode === "premium" && <motion.div className="absolute inset-0 bg-white/10" animate={{
            x: ["-100%", "100%"]
          }} transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "linear"
          }} style={{
            skewX: -20
          }} />}
            <Crown size={13} className="relative z-10 shrink-0" />
            <span className="relative z-10 truncate">{i18n.t("tripMatch.premiumMatch")}</span>
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

      {/* ── Instant Meetup (바로모임) - Redesigned ── */}
      <AnimatePresence>
        {mode === "instant" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 overflow-hidden pt-3"
          >
            {/* Hero Card */}
            <div className="relative rounded-3xl overflow-hidden mb-3" style={{ background: "linear-gradient(135deg, #ff4d6d 0%, #ff758c 50%, #c9184a 100%)" }}>
              {/* Background decoration */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
                <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/5 translate-y-6 -translate-x-4" />
              </div>
              <div className="relative z-10 p-5 pb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0 relative">
                    <span className="absolute -inset-0.5 rounded-2xl border border-white/40 animate-ping opacity-40" />
                    <Zap size={22} className="text-white" fill="currentColor" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-white leading-tight">{i18n.t("instant.mainTitle", "주변 즉흥 바로모임")}</h3>
                    <p className="text-[11px] text-white/80 mt-0.5 leading-snug">{i18n.t("instant.mainDesc", "지금 바로 만날 수 있는 최적의 상대를 매칭합니다.")}</p>
                  </div>
                </div>
                {/* Quick stats row */}
                <div className="flex gap-2">
                  {[
                    { icon: "⚡", label: i18n.t("instant.tagInstant", "즉시 매칭") },
                    { icon: "📍", label: i18n.t("instant.tagLocation", "위치 기반") },
                    { icon: "⏱️", label: i18n.t("instant.tag1Hour", "1시간 내") },
                  ].map((s, idx) => (
                    <div key={idx} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/15 backdrop-blur-sm">
                      <span className="text-sm">{s.icon}</span>
                      <span className="text-[10px] font-bold text-white whitespace-nowrap">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main options card */}
            <div className="bg-card rounded-3xl border border-border/60 overflow-hidden shadow-sm mb-3">

              {/* Hotplace Section */}
              <div className="p-4 border-b border-border/40">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                    <MapPin size={14} className="text-rose-500" />
                  </div>
                  <div>
                    <p className="text-[13px] font-extrabold text-foreground">{i18n.t("instant.selectPlaceTitle", "모임 장소 선택")}</p>
                    <p className="text-[10px] text-muted-foreground">{i18n.t("instant.selectPlaceDesc", "핫한 장소를 골라보세요")}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {HOTPLACES.slice(0, 6).map(h => (
                    <button
                      key={h.id}
                      onClick={() => setHotplace(h.id)}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all active:scale-95 ${
                        hotplace === h.id
                          ? "border-rose-500 bg-rose-500/10 shadow-sm"
                          : "border-border/60 bg-background hover:border-rose-500/30 hover:bg-rose-500/5"
                      }`}
                    >
                      <span className="text-xl">{h.emoji || "📍"}</span>
                      <span className={`text-[10px] font-bold leading-tight text-center ${hotplace === h.id ? "text-rose-600" : "text-muted-foreground"}`}>
                        {h.name.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
                {/* More hotplaces - horizontal scroll */}
                {HOTPLACES.length > 6 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-none">
                    {HOTPLACES.slice(6).map(h => (
                      <button
                        key={h.id}
                        onClick={() => setHotplace(h.id)}
                        className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold border-2 transition-all active:scale-95 whitespace-nowrap ${
                          hotplace === h.id
                            ? "bg-rose-500 text-white border-rose-500"
                            : "bg-background text-muted-foreground border-border/60 hover:border-rose-500/30"
                        }`}
                      >
                        {h.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Vibe Section */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                      <Sparkles size={14} className="text-violet-500" />
                    </div>
                    <div>
                      <p className="text-[13px] font-extrabold text-foreground">{i18n.t("instant.vibeTitle", "만남 스타일")}</p>
                      <p className="text-[10px] text-muted-foreground">{i18n.t("instant.vibeDesc", "어떤 만남을 원하세요?")}</p>
                    </div>
                  </div>
                  {!isPlus && (
                    <button
                      onClick={() => setShowPlusModal(true)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20"
                    >
                      <Crown size={10} className="text-amber-500" />
                      <span className="text-[9px] font-extrabold text-amber-600">{i18n.t("instant.plusOnly", "Plus 전용")}</span>
                    </button>
                  )}
                </div>

                {isPlus ? (
                  <div className="grid grid-cols-4 gap-2">
                    {VIBES.map(v => (
                      <button
                        key={v.id}
                        onClick={() => setVibe(v.id)}
                        className={`flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-2xl border-2 transition-all active:scale-95 ${
                          vibe === v.id
                            ? "border-violet-500 bg-violet-500/10"
                            : "border-border/60 bg-background hover:border-violet-500/30"
                        }`}
                      >
                        <span className="text-xl">{v.emoji}</span>
                        <span className={`text-[10px] font-bold ${vibe === v.id ? "text-violet-600" : "text-muted-foreground"}`}>{v.label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Locked state for free users - show blurred vibes */
                  <div className="relative">
                    <div className="grid grid-cols-4 gap-2 pointer-events-none select-none">
                      {VIBES.map(v => (
                        <div key={v.id} className="flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-2xl border-2 border-border/40 bg-background opacity-40">
                          <span className="text-xl">{v.emoji}</span>
                          <span className="text-[10px] font-bold text-muted-foreground">{v.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
                      <button
                        onClick={() => setShowPlusModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold text-white shadow-lg"
                        style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
                      >
                        <Crown size={14} />
                        {i18n.t("instant.unlockPlus")}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Detailed Filters (City, Date, Place) moved from Random Match - Subscriber only */}
              {isPlus ? (
                <div className="p-4 border-t border-border/40 bg-indigo-500/5">
                  <button
                    onClick={() => setShowRandomSetup(v => !v)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                        <SlidersHorizontal size={14} className="text-blue-500" />
                      </div>
                      <div className="text-left">
                        <p className="text-[13px] font-extrabold text-foreground">{i18n.t("instant.randomMatchTitle")}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {meetCity || meetDate || meetPlace
                            ? `${meetCity ? meetCity + ' ' : ''}${meetDate ? meetDate + ' ' + meetTime : ''}${meetPlace ? ' ' + meetPlace : ''}`
                            : i18n.t("instant.randomMatchNone")
                          }
                        </p>
                      </div>
                    </div>
                    <ChevronDown size={14} className={`text-muted-foreground transition-transform ${showRandomSetup ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {showRandomSetup && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                         <div className="pt-4 space-y-4">
                            {/* 도시/위치 */}
                            <div>
                               <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-blue-600 uppercase tracking-wider mb-2">
                                 <MapPin size={12} /> {i18n.t("instant.randomCity")}
                               </label>
                               <div className="flex gap-2 flex-wrap mb-2">
                                 {POPULAR_CITIES.map(c => (
                                   <button key={c} onClick={() => setMeetCity(meetCity === c ? "" : c)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all active:scale-95 ${meetCity === c ? "bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20" : "bg-card text-muted-foreground border-border hover:border-blue-500/30"}`}>{c}</button>
                                 ))}
                               </div>
                               <input type="text" value={meetCity} onChange={e => setMeetCity(e.target.value)} placeholder={i18n.t("instant.randomCityPlaceholder")} className="w-full bg-card rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20" />
                            </div>

                            {/* 날짜 & 시간 */}
                            <div>
                               <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-blue-600 uppercase tracking-wider mb-2">
                                 <Calendar size={12} /> {i18n.t("instant.randomDateTime")}
                               </label>
                               <div className="grid grid-cols-2 gap-2">
                                 <input type="date" value={meetDate} onChange={e => setMeetDate(e.target.value)} className="bg-card rounded-xl px-3 py-2.5 text-sm text-foreground outline-none border border-border focus:border-blue-500/50" />
                                 <input type="time" value={meetTime} onChange={e => setMeetTime(e.target.value)} className="bg-card rounded-xl px-3 py-2.5 text-sm text-foreground outline-none border border-border focus:border-blue-500/50" />
                               </div>
                            </div>

                            {/* 장소 */}
                            <div>
                               <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-blue-600 uppercase tracking-wider mb-2">
                                 <MapPin size={12} /> {i18n.t("instant.randomPlace")}
                               </label>
                               <div className="flex gap-2 flex-wrap mb-2">
                                 {POPULAR_PLACES.map(p => (
                                   <button key={p} onClick={() => setMeetPlace(meetPlace === p ? "" : p)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all active:scale-95 ${meetPlace === p ? "bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/20" : "bg-card text-muted-foreground border-border hover:border-indigo-500/30"}`}>{p}</button>
                                 ))}
                               </div>
                               <input type="text" value={meetPlace} onChange={e => setMeetPlace(e.target.value)} placeholder={i18n.t("instant.randomPlacePlaceholder")} className="w-full bg-card rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20" />
                            </div>

                            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowRandomSetup(false)} className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-extrabold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2">
                              <Check size={16} /> {i18n.t("instant.randomApply")}
                            </motion.button>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div 
                  className="p-4 border-t border-border/40 bg-indigo-500/5 cursor-pointer relative group overflow-hidden" 
                  onClick={() => setShowPlusModal(true)}
                >
                  <div className="flex items-center justify-between opacity-50 transition-opacity group-hover:opacity-30">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                        <SlidersHorizontal size={14} className="text-blue-500" />
                      </div>
                      <div className="text-left">
                        <p className="text-[13px] font-extrabold text-foreground">{i18n.t("instant.randomMatchTitle")}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{i18n.t("instant.randomFilterDesc")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[9px] font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/20">
                      <Crown size={10} className="text-amber-500" /> <span className="mt-0.5 leading-none">{i18n.t("instant.plusOnly")}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CTA + free notice */}
            <div className="mb-4">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleStartInstantMeet}
                className="w-full py-4 rounded-2xl text-white text-base font-black shadow-xl relative overflow-hidden flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #ff4d6d, #c9184a)" }}
              >
                <motion.div
                  className="absolute inset-0 bg-white/25"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
                  style={{ skewX: -20 }}
                />
                <Zap size={20} className="relative z-10" fill="currentColor" />
                <span className="relative z-10">{i18n.t("auto.v2_inst_enter", "바로모임 입장하기")}</span>
                <ChevronRight size={18} className="relative z-10 opacity-80" />
              </motion.button>
              {!isPlus && (
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <p className="text-[10px] text-muted-foreground font-medium">
                    {i18n.t("auto.v2_inst_free", "일반 회원은 1회 무료 체험 제공")}
                    <span className="text-rose-500 font-bold ml-1">({1 - instantMeetsCount > 0 ? `${1 - instantMeetsCount}회 남음` : "소진"})</span>
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mode info banner ── */}
      <div className="px-4 mt-3 space-y-3">
        {mode === "instant" && (
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/20">
            <Zap size={15} className="text-rose-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-rose-600 truncate">{i18n.t("auto.v2_inst_info_title", "즉흥 바로모임 (1시간 내 만남)")}</p>
              <p className="text-[10px] text-rose-500/70 mt-0.5 line-clamp-2">{i18n.t("auto.v2_inst_info_desc", "선택한 장소 주변의 즉석 만남입니다. 수락 시 주변 음식점/술집이 추천됩니다.")}</p>
            </div>
          </div>
        )}
        {mode === "premium" && (
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
            <Shield size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-amber-600 truncate">{i18n.t("auto.z_\uD504\uB9AC\uBBF8\uC5C4_f33bf2")}</p>
              <p className="text-[10px] text-amber-500/70 mt-0.5 line-clamp-2">{i18n.t("auto.z_\uD3C9\uC81040_dbf77c")}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Tier pricing overview ── */}
      {myGender !== "female" && <div className="px-4 mt-3">
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
      {myGender === "female" && <div className="mx-4 mt-3 p-3 rounded-2xl bg-pink-500/5 border border-pink-500/20 flex items-center gap-2">
          <Gift size={14} className="text-pink-500 shrink-0" />
          <p className="text-xs text-pink-600 font-bold">{i18n.t("auto.z_\uC5EC\uC131\uC740\uBAA8_8e7181")}</p>
        </div>}

      {/* ── Results (Only show when not in instant mode) ── */}
      {mode !== "instant" && (
        <div className="px-4 mt-4 space-y-4">
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

              <div className="relative w-full max-w-[420px] mx-auto mt-4" style={{ height: "360px" }}>
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
      )}


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

      {/* ── Recommendation Modal (Instant Meet only) ── */}
      <AnimatePresence>
        {showRecommendation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRecommendation(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="relative w-full max-w-sm bg-card rounded-3xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="p-5 pb-3 border-b border-border/50 text-center">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-3">
                  <Zap size={24} className="text-rose-500" />
                </div>
                <h3 className="text-lg font-extrabold text-foreground mb-1">매칭 성공! 바로모임 시작</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  1시간 내로 만남을 완료해 주세요.<br/>
                  모임 장소 근처의 추천 스팟을 확인해 보세요!
                </p>
              </div>

              {/* Recommendations */}
              <div className="p-4 overflow-y-auto space-y-3 bg-muted/30">
                {getRecommendationsForHotplace(hotplace).map((place: PlaceRecommendation) => (
                  <div key={place.id} className="p-3 bg-card rounded-2xl border border-border shadow-sm flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xl">
                        {place.type === "restaurant" ? "🍽️" : place.type === "bar" ? "🍺" : "☕"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-sm font-extrabold text-foreground truncate">{place.name}</h4>
                        <div className="flex items-center gap-0.5 shrink-0 bg-yellow-500/10 px-1.5 py-0.5 rounded-md">
                          <Star size={10} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-[10px] font-bold text-yellow-600">{place.rating}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug mb-2">
                        {place.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {place.distance}
                        </span>
                        <button className="text-[10px] font-bold text-blue-500 flex items-center gap-1 hover:underline">
                          지도 보기 <ChevronRight size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action */}
              <div className="p-4 border-t border-border/50 bg-card">
                <button onClick={() => {
                  setShowRecommendation(null);
                  navigate('/chat', { state: { threadId: createdThreadId } });
                }} className="w-full py-3.5 rounded-2xl gradient-primary text-white text-sm font-extrabold shadow-lg shadow-primary/25 relative overflow-hidden">
                  <motion.div className="absolute inset-0 bg-white/20" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }} style={{ skewX: -20 }} />
                  생성된 채팅방으로 바로가기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>;
};
export default TripMatchPage;