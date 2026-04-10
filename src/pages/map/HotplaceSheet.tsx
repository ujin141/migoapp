/**
 * HotplaceSheet.tsx
 * ──────────────────────────────────────────────────────────────────
 * 핫플레이스 상세 바텀시트 ─ 동반자 구하기 기능 포함
 *
 * 기능:
 * 1. 핫플레이스 이름/국가/거리/카테고리 정보 표시
 * 2. 현재 그 장소에서 동반자 구하는 유저 목록 (DB: hotplace_seekers)
 * 3. "나도 구인" 등록 / 취소
 * 4. 동반자 신청 → trip_groups 자동 생성
 * 5. 가상 투입 / 클룩 예매 / 구글지도 바로가기
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Plus, MapPin, Zap, Calendar, Globe, ChevronRight, UserPlus, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Hotplace } from "@/lib/placeRecommendations";

// ─── types ────────────────────────────────────────────────────────

interface Seeker {
  id: string;
  user_id: string;
  hotplace_id: string;
  message: string | null;
  meet_date: string | null;    // YYYY-MM-DD
  meet_time: string | null;    // HH:MM
  max_members: number | null;  // 2~10
  created_at: string;
  profiles: {
    name: string;
    photo_url: string | null;
    age: number | null;
    nationality: string | null;
    bio: string | null;
  } | null;
}

interface Props {
  hotplace: Hotplace | null;
  myLatLngRef: React.MutableRefObject<{ lat: number; lng: number } | null>;
  calcDist: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
  distLabel: (d: number) => string;
  onClose: () => void;
  onFlyTo: (h: Hotplace) => void;
  onProfileClick?: (userId: string) => void;
}

// ─── category style map ───────────────────────────────────────────
const CATEGORY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  city:       { color: "text-blue-600",    bg: "bg-blue-50",    label: "🏙️ 도심/시내" },
  nature:     { color: "text-emerald-600", bg: "bg-emerald-50", label: "🌊 바다/자연" },
  attraction: { color: "text-purple-600",  bg: "bg-purple-50",  label: "🎡 관광/테마파크" },
  club:       { color: "text-pink-600",    bg: "bg-pink-50",    label: "🪩 클럽/라운지" },
};

// ─── Component ───────────────────────────────────────────────────

export const HotplaceSheet = ({
  hotplace,
  myLatLngRef,
  calcDist,
  distLabel,
  onClose,
  onFlyTo,
  onProfileClick,
}: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [seekers, setSeekers]           = useState<Seeker[]>([]);
  const [loading, setLoading]           = useState(false);
  const [mySeekerId, setMySeekerId]     = useState<string | null>(null);
  const [myMessage, setMyMessage]       = useState("");
  const [myMeetDate, setMyMeetDate]     = useState("");          // YYYY-MM-DD
  const [myMeetTime, setMyMeetTime]     = useState("");          // HH:MM
  const [myMaxMembers, setMyMaxMembers] = useState(4);           // 기본 4명
  const [showMsgInput, setShowMsgInput] = useState(false);
  const [joining, setJoining]           = useState<string | null>(null);
  const [activeTab, setActiveTab]       = useState<"info" | "seekers">("info");

  // ── 동반자 구인 목록 로드 ─────────────────────────────────────
  const loadSeekers = useCallback(async () => {
    if (!hotplace) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("hotplace_seekers")
        .select(`
          id, user_id, hotplace_id, message, created_at,
          profiles (name, photo_url, age, nationality, bio)
        `)
        .eq("hotplace_id", hotplace.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setSeekers(data as Seeker[]);
        const mine = data.find((s: any) => s.user_id === user?.id);
        setMySeekerId(mine ? mine.id : null);
        if (mine) setMyMessage(mine.message || "");
      }
    } finally {
      setLoading(false);
    }
  }, [hotplace, user?.id]);

  useEffect(() => {
    if (hotplace) {
      setSeekers([]);
      setMySeekerId(null);
      setMyMessage("");
      setMyMeetDate("");
      setMyMeetTime("");
      setMyMaxMembers(4);
      setShowMsgInput(false);
      setActiveTab("info");
      loadSeekers();
    }
  }, [hotplace?.id]);

  // ── 구인 등록 ─────────────────────────────────────────────────
  const handleRegisterSeeker = async () => {
    if (!user || !hotplace) return;
    const { data, error } = await supabase
      .from("hotplace_seekers")
      .insert({
        user_id: user.id,
        hotplace_id: hotplace.id,
        message: myMessage.trim() || null,
        meet_date: myMeetDate || null,
        meet_time: myMeetTime || null,
        max_members: myMaxMembers,
      })
      .select("id")
      .single();
    if (!error && data) {
      setMySeekerId(data.id);
      setShowMsgInput(false);
      await loadSeekers();
      toast({ title: t("hotplace.seekerRegistered", "✅ 동반자 구인 등록 완료!"), description: hotplace.name });
      setActiveTab("seekers");
    }
  };

  // ── 구인 취소 ─────────────────────────────────────────────────
  const handleCancelSeeker = async () => {
    if (!mySeekerId) return;
    await supabase.from("hotplace_seekers").delete().eq("id", mySeekerId);
    setMySeekerId(null);
    setMyMessage("");
    await loadSeekers();
    toast({ title: t("hotplace.seekerCancelled", "구인 취소됨") });
  };

  // ── 함께 가자! 신청 ───────────────────────────────────────────
  const handleJoin = async (seeker: Seeker) => {
    if (!user || !hotplace || joining) return;
    setJoining(seeker.user_id);
    try {
      // 이미 둘 사이 그룹 있는지 확인
      const { data: existing } = await supabase
        .from("trip_groups")
        .select("id")
        .contains("tags", [`_loc_:${hotplace.lat}:${hotplace.lng}`])
        .eq("host_id", seeker.user_id)
        .limit(1)
        .maybeSingle();

      let groupId: string;

      if (existing) {
        groupId = existing.id;
        // 이미 있으면 멤버로 합류
        await supabase.from("trip_group_members").upsert(
          { group_id: groupId, user_id: user.id },
          { onConflict: "group_id,user_id" }
        );
      } else {
        // 새 그룹 생성
        const { data: grp, error } = await supabase
          .from("trip_groups")
          .insert({
            title: `${hotplace.emoji} ${hotplace.name.split(" (")[0]} 같이 가요!`,
            destination: `${hotplace.name}, ${hotplace.country}`,
            dates: t("map.today", "오늘"),
            description: seeker.message || t("hotplace.defaultDesc", "함께 여행할 동반자를 찾고 있어요 😊"),
            host_id: seeker.user_id,
            max_members: 6,
            status: "recruiting",
            tags: [`_loc_:${hotplace.lat}:${hotplace.lng}`, hotplace.category, hotplace.name.split(" (")[0]],
          })
          .select("id")
          .single();
        if (error || !grp) throw error;
        groupId = grp.id;

        await supabase.from("trip_group_members").insert([
          { group_id: groupId, user_id: seeker.user_id },
          { group_id: groupId, user_id: user.id },
        ]);
      }

      // 알림 전송
      await supabase.from("in_app_notifications").insert({
        user_id: seeker.user_id,
        type: "match",
        title: t("hotplace.joinNotifTitle", "동반자 신청이 왔어요! 🎉"),
        content: t("hotplace.joinNotifBody", `${user.name || "누군가"}님이 ${hotplace.name.split(" (")[0]}에서 함께 가고 싶어합니다!`),
      });

      toast({
        title: t("hotplace.joinSuccess", "🎉 함께 가기 신청 완료!"),
        description: t("hotplace.joinDesc", "그룹이 만들어졌어요. 채팅에서 확인하세요."),
      });
    } catch (err) {
      console.error(err);
      toast({ title: t("hotplace.joinFail", "신청 실패"), variant: "destructive" });
    } finally {
      setJoining(null);
    }
  };

  const catConfig = hotplace ? (CATEGORY_CONFIG[hotplace.category] ?? { color: "text-primary", bg: "bg-primary/10", label: hotplace.category }) : null;

  const distInfo = (() => {
    if (!myLatLngRef.current || !hotplace) return null;
    const d = calcDist(myLatLngRef.current.lat, myLatLngRef.current.lng, hotplace.lat, hotplace.lng);
    return { label: distLabel(d), walk: Math.max(1, Math.ceil((d * 1000) / 75)) };
  })();

  return (
    <AnimatePresence>
      {hotplace && (
        <>
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            className="absolute left-0 right-0 z-50 bg-white dark:bg-zinc-900 rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.18)] border-t border-black/5 dark:border-white/5 flex flex-col"
            style={{ bottom: 0, maxHeight: "82vh" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={(_, i) => { if (i.offset.y > 80) onClose(); }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-black/10 dark:bg-white/10" />
            </div>

            {/* ── HEADER ── */}
            <div className="px-5 pb-3 shrink-0">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-2xl shadow-md shrink-0">
                  {hotplace.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-extrabold text-[17px] text-foreground leading-tight">{hotplace.name}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">
                    {hotplace.country} · {hotplace.cities[0]}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {catConfig && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catConfig.bg} ${catConfig.color}`}>
                        {catConfig.label}
                      </span>
                    )}
                    {distInfo && (
                      <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <MapPin size={9} /> {distInfo.label} · 🚶 {distInfo.walk}{t("auto.ko_0132", "분")}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0"
                >
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>

              {/* Seeker count badge */}
              {seekers.length > 0 && (
                <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
                  <Zap size={14} className="text-amber-500 shrink-0" fill="currentColor" />
                  <p className="text-xs font-bold text-amber-700">
                    {t("hotplace.seekerCount", `지금 ${seekers.length}명이 동반자를 찾고 있어요!`).replace("${seekers.length}", String(seekers.length))}
                  </p>
                </div>
              )}
            </div>

            {/* ── TABS ── */}
            <div className="px-5 shrink-0 flex gap-1 pb-2">
              {([
                { id: "info", label: t("hotplace.tabInfo", "장소 정보") },
                { id: "seekers", label: `${t("hotplace.tabSeekers", "동반자 구하기")}${seekers.length > 0 ? ` (${seekers.length})` : ""}` },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── SCROLLABLE CONTENT ── */}
            <div className="overflow-y-auto flex-1 px-5 pb-safe-min scrollbar-none">
              {/* ── INFO TAB ── */}
              {activeTab === "info" && (
                <div className="space-y-4 pt-1 pb-6">

                  {/* ── Quick Action Buttons: Horizontal Flex ── */}
                  <div className="flex gap-2">
                    {/* 가상 투입 */}
                    <button
                      onClick={() => onFlyTo(hotplace)}
                      className="flex-1 flex flex-col items-center justify-center py-3.5 rounded-2xl bg-muted/50 active:scale-95 transition-transform"
                    >
                      <div className="w-11 h-11 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center mb-2 shrink-0">
                        <Globe size={20} />
                      </div>
                      <p className="text-[11px] font-extrabold text-foreground">{t("auto.ko_0133", "가상 투입")}</p>
                    </button>

                    {/* 구글 지도 (길찾기) */}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotplace.name)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex flex-col items-center justify-center py-3.5 rounded-2xl bg-muted/50 active:scale-95 transition-transform"
                    >
                      <div className="w-11 h-11 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-2 shrink-0">
                        <MapPin size={20} />
                      </div>
                      <p className="text-[11px] font-extrabold text-foreground">{t("auto.ko_0135", "구글 지도")}</p>
                    </a>

                    {/* 예매 (attraction) 또는 정보 검색 */}
                    {hotplace.category === "attraction" ? (
                      <a
                        href={`https://www.klook.com/ko/search/result/?query=${encodeURIComponent(hotplace.name)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex-1 flex flex-col items-center justify-center py-3.5 rounded-2xl bg-muted/50 active:scale-95 transition-transform"
                      >
                        <div className="w-11 h-11 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-2 shrink-0">
                          <Calendar size={20} />
                        </div>
                        <p className="text-[11px] font-extrabold text-foreground">{t("auto.ko_0134", "티켓/예매")}</p>
                      </a>
                    ) : (
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(hotplace.name + " 여행 정보")}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex-1 flex flex-col items-center justify-center py-3.5 rounded-2xl bg-muted/50 active:scale-95 transition-transform"
                      >
                        <div className="w-11 h-11 rounded-full bg-slate-500/10 text-slate-500 flex items-center justify-center mb-2 shrink-0">
                          <span className="text-xl">🔍</span>
                        </div>
                        <p className="text-[11px] font-extrabold text-foreground">{t("hotplace.searchInfo", "정보 검색")}</p>
                      </a>
                    )}
                  </div>

                  {/* ── 장소 팁 카드 ── */}
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-4 border border-primary/10">
                    <p className="text-xs font-bold text-primary mb-1">💡 {t("hotplace.tipTitle", "이 장소 팁")}</p>
                    <p className="text-[11px] text-foreground/80 leading-normal whitespace-normal break-words">
                      {hotplace.category === "attraction"
                        ? t("hotplace.tipAttraction", "테마파크·관광명소는 동반자가 있으면 훨씬 즐거워요! 동반자 구하기 탭에서 지금 모집 중인 여행자를 만나보세요.")
                        : hotplace.category === "club"
                        ? t("hotplace.tipClub", "혼자 가기 부담되는 클럽이나 라운지도 Migo로 동반자를 찾으면 안심하고 즐길 수 있어요!")
                        : hotplace.category === "nature"
                        ? t("hotplace.tipNature", "해변·자연 명소는 같이 가면 안전하고 사진도 찍어줄 수 있어 더 좋아요 📸")
                        : t("hotplace.tipCity", "현지 맛집·핫플은 로컬을 아는 동반자와 함께라면 더 깊이 즐길 수 있어요!")}
                    </p>
                  </div>

                  {/* ── 동반자 미리보기 ── */}
                  {seekers.length > 0 && (
                    <button
                      onClick={() => setActiveTab("seekers")}
                      className="w-full flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-3.5 active:scale-95 transition-transform"
                    >
                      <div className="flex -space-x-2 shrink-0">
                        {seekers.slice(0, 3).map(s => (
                          s.profiles?.photo_url
                            ? <img key={s.id} src={s.profiles.photo_url} className="w-8 h-8 rounded-full object-cover border-2 border-white" />
                            : <div key={s.id} className="w-8 h-8 rounded-full bg-amber-300 border-2 border-white flex items-center justify-center text-xs font-bold text-white">{s.profiles?.name?.[0] ?? "?"}</div>
                        ))}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-xs font-extrabold text-amber-700 truncate">
                          {t("hotplace.seekerPreviewTitle", `지금 ${seekers.length}명이 같이 갈 사람을 찾고 있어요`).replace("${seekers.length}", String(seekers.length))}
                        </p>
                        <p className="text-[10px] text-amber-600 mt-0.5">{t("hotplace.seekerPreviewSub", "탭해서 신청하기 →")}</p>
                      </div>
                      <ChevronRight size={16} className="text-amber-500 shrink-0" />
                    </button>
                  )}
                </div>
              )}

              {/* ── SEEKERS TAB ── */}
              {activeTab === "seekers" && (
                <div className="pt-1 pb-6 space-y-3">
                  {/* My registration CTA */}
                  {!mySeekerId ? (
                    <div>
                      {!showMsgInput ? (
                        <button
                          onClick={() => setShowMsgInput(true)}
                          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-extrabold text-sm shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                          <UserPlus size={16} />
                          {t("hotplace.registerSeeker", "나도 동반자 구하기 🙋")}
                        </button>
                      ) : (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3.5">
                          {/* 모임 시간/인원 등 상세 정보 (옵션) */}
                          <div className="flex flex-col gap-3">
                            <div className="space-y-1.5">
                              <p className="text-[11px] font-extrabold text-amber-700">{t("hotplace.meetDateLabel", "날짜 (선택)")}</p>
                              <input
                                type="date"
                                value={myMeetDate}
                                onChange={e => setMyMeetDate(e.target.value)}
                                className="w-full text-xs font-bold bg-white border border-amber-200 rounded-xl px-2.5 py-2 outline-none focus:ring-2 focus:ring-amber-400 text-foreground"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <p className="text-[11px] font-extrabold text-amber-700">{t("hotplace.meetTimeLabel", "시간 (선택)")}</p>
                              <input
                                type="time"
                                value={myMeetTime}
                                onChange={e => setMyMeetTime(e.target.value)}
                                className="w-full text-xs font-bold bg-white border border-amber-200 rounded-xl px-2.5 py-2 outline-none focus:ring-2 focus:ring-amber-400 text-foreground"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="flex justify-between">
                              <p className="text-[11px] font-extrabold text-amber-700">{t("hotplace.maxMembersLabel", "모집 인원")}</p>
                              <p className="text-[11px] font-bold text-amber-600">{myMaxMembers}{t("hotplace.membersUnit", "명")}</p>
                            </div>
                            <input
                              type="range"
                              min="2" max="10" step="1"
                              value={myMaxMembers}
                              onChange={e => setMyMaxMembers(Number(e.target.value))}
                              className="w-full accent-amber-500"
                            />
                            <div className="flex justify-between text-[9px] text-amber-500/70 font-bold px-1">
                              <span>2명</span><span>10명</span>
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-1">
                            <p className="text-[11px] font-extrabold text-amber-700">{t("hotplace.msgLabel", "한마디 메시지 (선택)")}</p>
                            <input
                              value={myMessage}
                              onChange={e => setMyMessage(e.target.value)}
                              placeholder={t("hotplace.msgPlaceholder", "어떤 목표로 가는지, 누구와 가고 싶은지 등")}
                              className="w-full text-sm bg-white border border-amber-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-400 text-foreground placeholder:text-muted-foreground/60"
                              maxLength={80}
                            />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button onClick={() => setShowMsgInput(false)} className="flex-1 py-2.5 rounded-xl bg-white border border-border text-xs font-extrabold text-muted-foreground active:scale-95 transition-transform">
                              {t("common.cancel", "취소")}
                            </button>
                            <button onClick={handleRegisterSeeker} className="flex-[2] py-2.5 rounded-xl bg-amber-500 text-white text-[13px] font-extrabold shadow-sm active:scale-95 transition-transform">
                              {t("hotplace.registerConfirm", "이 설정으로 등록하기")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-green-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <p className="text-[13px] font-extrabold text-green-700">{t("hotplace.myPostActive", "내 동반자 모집 진행 중")}</p>
                            <span className="text-[9px] font-bold bg-green-200/50 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Users size={10} /> 최대 {myMaxMembers}명
                            </span>
                          </div>
                          {(myMeetDate || myMeetTime) && (
                            <p className="text-[10px] text-green-600 font-bold mb-1 flex items-center gap-1">
                              <Calendar size={10} /> {myMeetDate} {myMeetTime}
                            </p>
                          )}
                          {myMessage && <p className="text-[11px] text-green-700/80 truncate mt-0.5 leading-snug">"{myMessage}"</p>}
                        </div>
                      </div>
                      <button onClick={handleCancelSeeker} className="text-[10px] font-bold text-red-500 px-2 py-1 rounded-lg bg-red-50 border border-red-200 shrink-0 active:scale-95">
                        {t("hotplace.cancelSeeker", "취소")}
                      </button>
                    </div>
                  )}

                  {/* Seeker list */}
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : seekers.length === 0 ? (
                    <div className="flex flex-col items-center py-10 gap-3">
                      <span className="text-5xl">🙋</span>
                      <p className="text-sm font-extrabold text-foreground">{t("hotplace.emptyTitle", "아직 모집 중인 사람이 없어요")}</p>
                      <p className="text-xs text-muted-foreground text-center leading-relaxed">
                        {t("hotplace.emptyDesc", "먼저 동반자를 구해보세요!\n누군가가 곧 함께하고 싶어할 거예요 😊")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {seekers.filter(s => s.user_id !== user?.id).map(seeker => {
                        const isJoining = joining === seeker.user_id;
                        const timeAgo = (() => {
                          const diff = Date.now() - new Date(seeker.created_at).getTime();
                          const min = Math.floor(diff / 60000);
                          if (min < 60) return `${min}분 전`;
                          const h = Math.floor(min / 60);
                          if (h < 24) return `${h}시간 전`;
                          return `${Math.floor(h / 24)}일 전`;
                        })();

                        return (
                          <div key={seeker.id} className="bg-white dark:bg-zinc-800 rounded-2xl p-3.5 border border-border/50 shadow-sm flex gap-3 items-start">
                            {/* Avatar */}
                            <button onClick={() => onProfileClick?.(seeker.user_id)} className="shrink-0">
                              {seeker.profiles?.photo_url
                                ? <img src={seeker.profiles.photo_url} className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm" />
                                : <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-sm">{seeker.profiles?.name?.[0] ?? "?"}</div>
                              }
                            </button>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-sm text-foreground">
                                  {seeker.profiles?.name ?? t("map.user", "여행자")}
                                </span>
                                {seeker.profiles?.age && (
                                  <span className="text-[10px] text-muted-foreground">{seeker.profiles.age}세</span>
                                )}
                                {seeker.profiles?.nationality && (
                                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">
                                    {seeker.profiles.nationality}
                                  </span>
                                )}
                                <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{timeAgo}</span>
                              </div>

                              {seeker.profiles?.bio && (
                                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{seeker.profiles.bio}</p>
                              )}

                              {/* Meeting Details */}
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                <div className="bg-muted px-2 py-1 rounded border border-border/50 flex items-center gap-1.5">
                                  <Users size={10} className="text-muted-foreground" />
                                  <span className="text-[10px] font-extrabold text-foreground">{t("auto.ko_0174", "최대")} {seeker.max_members || 4}{t("auto.ko_0175", "명")}</span>
                                </div>
                                {(seeker.meet_date || seeker.meet_time) && (
                                  <div className="bg-primary/5 px-2 py-1 rounded border border-primary/20 flex items-center gap-1.5">
                                    <Calendar size={10} className="text-primary" />
                                    <span className="text-[10px] font-extrabold text-primary">
                                      {seeker.meet_date} {seeker.meet_time}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {seeker.message && (
                                <div className="mt-2 bg-amber-50 border border-amber-100/80 rounded-xl px-3 py-2 shadow-sm">
                                  <p className="text-[11px] text-amber-700 font-bold leading-snug break-keep">💬 {seeker.message}</p>
                                </div>
                              )}

                              <div className="mt-2 flex gap-2">
                                <button
                                  onClick={() => handleJoin(seeker)}
                                  disabled={isJoining}
                                  className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 text-white text-[11px] font-extrabold active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-1 shadow-sm"
                                >
                                  {isJoining
                                    ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    : <><Plus size={11} /> {t("hotplace.joinBtn", "함께 가요!")}</>
                                  }
                                </button>
                                <button
                                  onClick={() => onProfileClick?.(seeker.user_id)}
                                  className="px-3 py-1.5 rounded-xl bg-muted text-[11px] font-bold text-muted-foreground active:scale-95 transition-transform"
                                >
                                  {t("map.profile", "프로필")}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
