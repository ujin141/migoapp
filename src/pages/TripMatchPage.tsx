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
import type { TripGroup } from "@/types";
import MatchCard from "@/components/MatchCard";
import PaymentModal from "@/components/PaymentModal";
import MigoPlusModal from "@/components/MigoPlusModal";
import { useGlobalFilter } from "@/context/GlobalFilterContext";
import { getChosung } from "@/lib/chosungUtils";
import { HOTPLACES } from "@/lib/placeRecommendations";
import { GroupDetailModal, InstantRecommendationModal } from "./match/TripMatchModals";
import { InstantMeetPanel } from "./match/TripMatchForms";

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
    isPlus,
    isPremium
  } = useSubscription();
  const {
    t,
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
    label: i18n.t("auto.z_\uC0C1\uAD00\uC5C6\uC74C_cc228d", "\uC0C1\uAD00\uC5C6\uC74C"),
    icon: "✨"
  }, {
    id: "balanced",
    label: i18n.t("auto.z_\uC131\uBE44\uADE0\uD615_ff683e", "\uC131\uBE44\uADE0\uD615"),
    icon: "👫"
  }, {
    id: "more-female",
    label: i18n.t("auto.z_\uC5EC\uC131_cf65dd", "\uC5EC\uC131"),
    icon: "👩"
  }, {
    id: "more-male",
    label: i18n.t("auto.z_\uB0A8\uC131_028e54", "\uB0A8\uC131"),
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
    // Intercept location.state if navigated from external sheet (e.g. MapPage's GroupSheet)
    if (location.state?.detailGroup) {
      setDetailGroup(location.state.detailGroup);
      const newState = { ...location.state };
      delete newState.detailGroup;
      window.history.replaceState({}, document.title, location.pathname);
    }

    if (!user) return;
    supabase.from("profiles").select("gender").eq("id", user.id).maybeSingle().then(({
      data
    }) => {
      if (data) {
        setInstantMeetsCount(parseInt(localStorage.getItem(`migo_instant_${user.id}`) || '0')); // LocalStorage fallback
        setNoShowCount(0);
        if (data.gender) {
           const g = data.gender.toLowerCase();
           if (g === "male" || g === t("auto.g_1063", "남") || g === t("auto.g_1064", "남성")) setMyGender("male");else if (g === "female" || g === t("auto.g_1065", "여") || g === t("auto.g_1066", "여성")) setMyGender("female");else setMyGender("other");
        }
      }
    });
  }, [user]);

  // ── Load real groups from Supabase — GlobalFilter 연동 ──
  useEffect(() => {
    setLoading(true);
    let query = supabase.from("trip_groups").select("*, profiles:host_id(name, photo_url, trust_score, no_show_count), trip_group_members(user_id, profiles(gender, no_show_count))").eq("status", "active").order("created_at", {
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
        hostName: g.profiles?.name || t("auto.g_1067", "호스트"),
        daysLeft: Math.max(0, Math.ceil((new Date(g.dates?.split("~")[1] || Date.now()).getTime() - Date.now()) / 86400000)),
        joined: (g.trip_group_members || []).some((m: any) => m.user_id === user?.id),
        memberPhotos: [],
        memberNames: [],
        isPremiumGroup: g.is_premium ?? false,
        coverImage: g.cover_image || "",
        description: g.description || "",
        schedule: g.schedule || [],
        entryFee: g.entry_fee || 0,
        memberGenders: (g.trip_group_members || []).map((m: any) => m.profiles?.gender || "unknown"),
        avgRating: g.profiles?.trust_score ? Math.round((g.profiles.trust_score / 20) * 10) / 10 : 4.5,
        hasProblematicUsers: ((g.profiles?.no_show_count && g.profiles.no_show_count > 0) || (g.trip_group_members || []).some((m: any) => m.profiles?.no_show_count > 0)) ? true : false,
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
        title: i18n.t("auto.z_\uB85C\uADF8\uC778\uC774_c49092", "\uB85C\uADF8\uC778\uC774"),
        variant: "destructive"
      });
      return;
    }
    if (mode === "premium" && !isPremium) {
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
        setInstantMeetsCount(prev => {
          const next = prev + 1;
          localStorage.setItem(`migo_instant_${user.id}`, next.toString());
          return next;
        });
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
  return <div className="min-h-screen bg-background truncate" style={{ paddingBottom: 'calc(8rem + env(safe-area-inset-bottom, 0px))' }}>
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
              <p className="text-sm font-bold text-foreground truncate">{i18n.t("tripMatch.searching")}</p>
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
            <span className="hidden sm:inline truncate">{i18n.t("tripMatch.filter")}</span>
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
          {mode === "premium" && !isPremium && <motion.div initial={{
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
                  <p className="text-xs font-extrabold text-amber-600 truncate">{i18n.t("auto.z_Migo_cb3e39", "Migo")}</p>
                  <p className="text-[10px] text-amber-600/70 truncate">{i18n.t("auto.z_\uC131\uBE44\uC870\uC808_788a9c", "\uC131\uBE44\uC870\uC808")}</p>
                </div>
                <button onClick={() => setShowPlusModal(true)} className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-extrabold shrink-0">{i18n.t("auto.z_\uAD6C\uB3C5\uD558\uAE30_e60da1", "\uAD6C\uB3C5\uD558\uAE30")}</button>
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
              <div className="mx-5 mb-3 p-4 rounded-2xl bg-muted/60 border border-border space-y-4 truncate">
                {/* Destination */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">{i18n.t("auto.z_\uBAA9\uC801\uC9C0_ffdbab", "\uBAA9\uC801\uC9C0")}</label>
                  <div className="relative">
                    <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                    <input type="text" value={destination} onChange={e => setDestination(e.target.value)} placeholder={i18n.t("auto.z_\uB3C4\uCFC4\uBC29\uCF55_7e3d81", "\uB3C4\uCFC4\uBC29\uCF55")} className="w-full bg-card rounded-xl pl-8 pr-8 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
                    {destination && <button onClick={() => setDestination("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                        <X size={13} className="text-muted-foreground" />
                      </button>}
                  </div>
                </div>

                {/* Vibe */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">{i18n.t("auto.z_\uC5EC\uD589\uC2A4\uD0C0_1d5cf5", "\uC5EC\uD589\uC2A4\uD0C0")}</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {VIBES.map(v => <button key={v.id} onClick={() => setVibe(v.id)} className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${vibe === v.id ? "border-transparent bg-primary/15 text-primary" : "border-border bg-card text-muted-foreground"}`}>
                        <span className="text-lg">{v.emoji}</span>
                        <span className="text-[10px] font-bold">{v.label}</span>
                      </button>)}
                  </div>
                </div>

                {/* Gender pref (Premium only) */}
                {mode === "premium" && <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">{i18n.t("auto.z_\uC131\uBE44\uC120\uD638_0632e9", "\uC131\uBE44\uC120\uD638")}</label>
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
              }} className="flex-1 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-bold border border-border">{i18n.t("auto.z_\uCD08\uAE30\uD654_2d7cf9", "\uCD08\uAE30\uD654")}</button>
                  <button onClick={() => setShowFilters(false)} className="flex-1 py-2 rounded-xl gradient-primary text-white text-xs font-extrabold">{i18n.t("auto.z_\uC801\uC6A9\uD558\uAE30_52a947", "\uC801\uC6A9\uD558\uAE30")}</button>
                </div>
              </div>
            </motion.div>}
        </AnimatePresence>
      </header>

      {/* ── Instant Meetup (바로모임) - Redesigned ── */}
      <InstantMeetPanel
        mode={mode}
        isPlus={isPlus}
        instantMeetsCount={instantMeetsCount}
        hotplace={hotplace}
        setHotplace={setHotplace}
        vibe={vibe}
        setVibe={setVibe}
        showRandomSetup={showRandomSetup}
        setShowRandomSetup={setShowRandomSetup}
        meetCity={meetCity}
        setMeetCity={setMeetCity}
        meetDate={meetDate}
        setMeetDate={setMeetDate}
        meetTime={meetTime}
        setMeetTime={setMeetTime}
        meetPlace={meetPlace}
        setMeetPlace={setMeetPlace}
        setShowPlusModal={setShowPlusModal}
        handleStartInstantMeet={handleStartInstantMeet}
        VIBES={VIBES}
        POPULAR_CITIES={POPULAR_CITIES}
        POPULAR_PLACES={POPULAR_PLACES}
      />

      {/* ── Mode info banner ── */}
      <div className="px-4 mt-3 space-y-3 truncate">
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
              <p className="text-xs font-bold text-amber-600 truncate">{i18n.t("auto.z_\uD504\uB9AC\uBBF8\uC5C4_f33bf2", "\uD504\uB9AC\uBBF8\uC5C4")}</p>
              <p className="text-[10px] text-amber-500/70 mt-0.5 line-clamp-2">{i18n.t("auto.z_\uD3C9\uC81040_dbf77c", "\uD3C9\uC81040")}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Tier pricing overview ── */}
      {myGender !== "female" && <div className="px-4 mt-3 truncate">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2 truncate">{i18n.t("auto.z_\uCC38\uC5EC\uBE44\uC6A9_9565c9", "\uCC38\uC5EC\uBE44\uC6A9")}</p>
          <div className="flex gap-2 truncate">
            {GROUP_TIER_CONFIGS.map(cfg => {
          const fee = isPlus ? Math.round(cfg.krw * 0.5 / 100) * 100 : cfg.krw;
          return <div key={cfg.tier} className="flex-1 p-3 rounded-2xl bg-card border border-border text-center truncate">
                  <div className="text-lg mb-1">{cfg.emoji}</div>
                  <div className="text-[10px] font-bold text-muted-foreground truncate">
                    {TIER_LOCALES[i18n.language.split("-")[0] || "en"]?.tier?.[cfg.tier]?.label || cfg.label}
                  </div>
                  {isPlus && <div className="text-[9px] line-through text-muted-foreground/50">{getLocalizedPrice(cfg.krw, i18n.language)}</div>}
                  <div className="text-xs font-extrabold text-foreground mt-0.5">
                    {getLocalizedPrice(fee, i18n.language)}
                  </div>
                  {isPlus && <div className="text-[9px] text-primary font-bold truncate">{i18n.t("auto.z_50\uD560\uC778_2bfea2", "50\uD560\uC778")}</div>}
                </div>;
        })}
          </div>
          {!isPlus && <button onClick={() => setShowPlusModal(true)} className="w-full mt-2 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold border border-primary/20">{i18n.t("auto.z_\uAD6C\uB3C5\uD558\uBA74_880ca0", "\uAD6C\uB3C5\uD558\uBA74")}</button>}
        </div>}

      {/* ── Female free notice ── */}
      {myGender === "female" && <div className="mx-4 mt-3 p-3 rounded-2xl bg-pink-500/5 border border-pink-500/20 flex items-center gap-2">
          <Gift size={14} className="text-pink-500 shrink-0" />
          <p className="text-xs text-pink-600 font-bold truncate">{i18n.t("auto.z_\uC5EC\uC131\uC740\uBAA8_8e7181", "\uC5EC\uC131\uC740\uBAA8")}</p>
        </div>}

      {/* ── Results (Only show when not in instant mode) ── */}
      {mode !== "instant" && (
        <div className="px-4 mt-4 space-y-4 truncate">
          {results.length === 0 ? <div className="text-center py-20 truncate">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Shuffle size={24} className="text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-bold truncate">{i18n.t("auto.z_\uB9E4\uCE6D\uAC00\uB2A5_95cffb", "\uB9E4\uCE6D\uAC00\uB2A5")}</p>
              <p className="text-xs text-muted-foreground/60 mt-1 truncate">{i18n.t("auto.z_\uD544\uD130\uB97C\uC870_c7b924", "\uD544\uD130\uB97C\uC870")}</p>
              {skipped.size > 0 && <button onClick={() => setSkipped(new Set())} className="mt-4 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-bold">{i18n.t("auto.z_\uD328\uC2A4\uD55C\uADF8_b637bd", "\uD328\uC2A4\uD55C\uADF8")}{skipped.size}{i18n.t("auto.z_\uAC1C_d22b87", "\uAC1C")}</button>}
            </div> : <>
              {/* Results count */}
              <div className="flex items-center justify-between truncate">
                <p className="text-xs text-muted-foreground truncate">
                  <span className="font-extrabold text-foreground truncate">{results.length}{i18n.t("auto.z_\uAC1C_1f31b2", "\uAC1C")}</span>{i18n.t("auto.z_\uADF8\uB8F9\uB9E4\uCE6D_748ec4", "\uADF8\uB8F9\uB9E4\uCE6D")}</p>
                {accepted.size > 0 && <span className="flex items-center gap-1 text-xs text-emerald-500 font-bold truncate">
                    <Check size={12} strokeWidth={3} /> {accepted.size}{i18n.t("auto.z_\uAC1C\uCC38\uC5EC\uC644_f9c3ae", "\uAC1C\uCC38\uC5EC\uC644")}</span>}
              </div>

              <div className="relative w-full max-w-[420px] mx-auto mt-4" style={{ height: mode === "premium" ? "420px" : "360px" }}>
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
      <GroupDetailModal
        detailGroup={detailGroup}
        setDetailGroup={setDetailGroup}
        translateMap={translateMap}
        loadingMap={loadingMap}
        handleTranslate={handleTranslate}
      />

      {/* ── Recommendation Modal (Instant Meet only) ── */}
      <InstantRecommendationModal
        showRecommendation={showRecommendation}
        setShowRecommendation={setShowRecommendation}
        hotplace={hotplace}
        createdThreadId={createdThreadId}
      />
    </div>;
};
export default TripMatchPage;