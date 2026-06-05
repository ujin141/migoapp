import i18n from "@/i18n";
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { Browser } from "@capacitor/browser"; // Apple Guideline 3.2: 인앱 브라우저로 외부 URL 쳐리
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Send, MapPin, Calendar, ArrowLeft, MoreVertical, X, Check, AlertTriangle, Lock, Crown, Users, Phone, Languages, ChevronDown, Map, ShieldAlert, Shield, CheckSquare, MessageCircle, Heart, SlidersHorizontal } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { useChatContext, GroupThread } from "@/context/ChatContext";
import { useSubscription } from "@/context/SubscriptionContext";
import MigoPlusModal from "@/components/MigoPlusModal";
import SOSModal from "@/components/SOSModal";
import { translateText, LANG_NAMES, SupportedLang } from "@/lib/translateService";
import { fetchActiveAdsForScreen, recordAdImpression, recordAdClick } from "@/lib/adService";
import { getCurrentLocation } from "@/lib/locationService";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import ProfileDetailSheet from "@/components/ProfileDetailSheet";
import ReportBlockActionSheet from "@/components/ReportBlockActionSheet";
import { MeetProposalModal, ScheduleShareModal, ReportModal, DeleteConfirmModal } from "./chat/ChatModals";
import { ChatThreadList } from "./chat/ChatThreadList";
import { ChatRoom } from "./chat/ChatRoom";
import { useKeyboard } from "@/hooks/useKeyboard";

const getTime = () => {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${ampm} ${h12}:${m}`;
};
const ChatPage = () => {
  // 키보드 높이 → --kb-height CSS 변수로 주입 (iOS 채팅 입력창이 키보드에 안 가려지도록)
  useKeyboard();

  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    threads,
    markRead,
    addUnread,
    setOpenThread
  } = useChatContext();
  const {
    isPlus,
    isPremium,
    dailyDmCount,
    maxDailyDm,
    canSendDm,
    consumeDm,
    canReadReceipts,
    maxChatThreads,
    openedThreadCount,
    canOpenChat,
    trackOpenedThread,
  } = useSubscription();
  const [showPlusModal, setShowPlusModal] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [mutedChats, setMutedChats] = useState<string[]>(() => {
    // BUG-12 fix: localStorage에서 음소거 설정 읽기
    try {
      const stored = localStorage.getItem('migo_muted_chats');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [selectedChat, setSelectedChat] = useState<string | null>((location.state as {
    chatId?: string;
    threadId?: string;
  } | null)?.threadId ?? (location.state as {
    chatId?: string;
    threadId?: string;
  } | null)?.chatId ?? null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const isSendingRef = useRef(false); // 중복 전송 방지 lock
  const {
    user
  } = useAuth();
  // ─── 자동 채팅방 폭파 체크는 백엔드(Edge/Cron)로 이관됨 ───


  // BUG-03/06 fix: message fetching은 ChatRoom 내부 useRealtimeChat에서 담당
  // ChatPage에서 별도 fetch하면 이중 DB hit 발생 → 제거

  const [searchQuery, setSearchQuery] = useState("");
  const [filterUnread, setFilterUnread] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "unread" | "group" | "dm">("all");
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showMeetProposal, setShowMeetProposal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [viewingProfile, setViewingProfile] = useState<any | null>(null);
  const [actionSheetTarget, setActionSheetTarget] = useState<any | null>(null);
  const [meetDate, setMeetDate] = useState("");
  const [meetPlace, setMeetPlace] = useState("");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleText, setScheduleText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const [swipedChatId, setSwipedChatId] = useState<string | null>(null);
  const [removedChats, setRemovedChats] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('migo_removed_chats');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // ─── Translation state ───────────────────────────────────
  const [autoTranslate, setAutoTranslate] = useState(false);
  const {
    i18n: _i18n
  } = useTranslation();
  const [targetLang, setTargetLang] = useState<SupportedLang>(_i18n.language.split("-")[0] as SupportedLang || "ko");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [translateMap, setTranslateMap] = useState<Record<string, string>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [ads, setAds] = useState<any[]>([]);
  useEffect(() => {
    fetchActiveAdsForScreen("ChatPage").then(setAds).catch(err => console.warn("fetch ads:", err));
  }, []);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);
  // ChatPage 언마운트 시 selectedChat 초기화 (다른 탭으로 이동 시 ChatRoom exit 잔존 방지)
  useEffect(() => {
    return () => {
      setSelectedChat(null);
    };
  }, []);

  // nav 표시/숨김 — selectedChat 변경 시 동기 DOM 업데이트
  useLayoutEffect(() => {
    const nav = document.getElementById("migo-bottom-nav");
    if (nav) {
      nav.style.display = selectedChat ? "none" : "";
    }
    if (selectedChat) {
      document.documentElement.classList.add("chat-room-active");
    } else {
      document.documentElement.classList.remove("chat-room-active");
    }
    return () => {
      // 컴포넌트 unmount 시 인라인 스타일 완전 제거로 CSS 기본값 복원
      const el = document.getElementById("migo-bottom-nav");
      if (el) el.style.display = "";
      document.documentElement.classList.remove("chat-room-active");
    };
  }, [selectedChat]);

  // 열람/읽음 취리 — nav 조작과 분리
  useEffect(() => {
    if (selectedChat) {
      markRead(selectedChat);
      setOpenThread(selectedChat);
      trackOpenedThread(selectedChat);
    } else {
      setOpenThread(null);
    }
    return () => {
      setOpenThread(null);
    };
  }, [markRead, selectedChat, setOpenThread, trackOpenedThread]);

  // ─── Translate a single message ───────────────────────────
  // BUG-14 fix: translateMap을 ref로도 관리 → autoTranslate effect에서 stale closure 없이 접근
  const translateMapRef = useRef<Record<string, string>>({});
  useEffect(() => { translateMapRef.current = translateMap; }, [translateMap]);

  const handleTranslate = useCallback(async (msgId: string, text: string) => {
    if (translateMapRef.current[msgId]) {
      setTranslateMap(prev => {
        const n = { ...prev };
        delete n[msgId];
        return n;
      });
      return;
    }
    setLoadingMap(prev => ({ ...prev, [msgId]: true }));
    try {
      const result = await translateText({ text, targetLang });
      setTranslateMap(prev => ({ ...prev, [msgId]: result }));
    } catch {
      toast({
        title: t("chat.translateFail"),
        description: t("chat.translateFailDesc"),
        variant: "destructive"
      });
    } finally {
      setLoadingMap(prev => {
        const n = { ...prev };
        delete n[msgId];
        return n;
      });
    }
  }, [targetLang, t]); // BUG-14 fix: toast(전역 안정)/translateMap(ref 사용) 제거

  // Auto-translate incoming messages when toggle is ON
  useEffect(() => {
    if (!autoTranslate) return;
    const last = messages[messages.length - 1];
    // BUG-14 fix: ref로 확인하여 stale translateMap으로 인한 중복 번역 방지
    if (!last || last.sender === "me" || translateMapRef.current[last.id]) return;
    handleTranslate(last.id, last.text);
  }, [messages, autoTranslate, handleTranslate]); // translateMap 제거 (ref 사용)

  const insertMessageAndNotify = async (textToSend: string) => {
    if (!selectedChat || !user) {
      return { error: new Error("Missing chat context") };
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        thread_id: selectedChat,
        sender_id: user.id,
        text: textToSend,
        content: textToSend,
      })
      .select("id, thread_id, sender_id, text, content, created_at")
      .single();

    if (!error && data) {
      void supabase.functions
        .invoke("push-notify", { body: { table: "messages", record: data } })
        .then(({ error: pushError }) => {
          if (pushError) console.warn("[Chat] push notification failed:", pushError.message);
        })
        .catch((pushError) => {
          console.warn("[Chat] push notification failed:", pushError);
        });
    }

    return { error };
  };

  const sendMessage = async (overrideText?: string) => {
    const finalMessage = overrideText || message;
    if (!finalMessage.trim() || !selectedChat || !user) return;
    if (!canSendDm) {
      setShowPlusModal(true);
      return;
    }
    // CRIT-2 fix: canSendDm 체크는 consumeDm 전에, 실제 차감은 DB insert 성공 후에
    // insert 실패 시 DM 카운트가 낭비되지 않도록 순서 변경
    if (!isPlus && dailyDmCount >= maxDailyDm) {
      setShowPlusModal(true);
      return;
    }
    // 중복 전송 방지: 이미 전송 중이면 무시
    if (isSendingRef.current) return;
    isSendingRef.current = true;

    const textToSend = finalMessage.trim();
    setMessage("");

    try {
      const { error } = await insertMessageAndNotify(textToSend);
      if (error) {
        setMessage(textToSend); // 실패 시 입력창 복원
        toast({ title: t('chat.sendFail', '메시지 전송 실패. 다시 시도해주세요.'), variant: 'destructive' });
        return; // CRIT-2 fix: 실패 시 DM 차감하지 않음
      }
      // insert 성공 후 DM 차감 (실패 시 카운트 낭비 방지)
      consumeDm();
    } finally {
      isSendingRef.current = false; // 항상 lock 해제
    }
  };
  const handleShareLocation = async () => {
    if (!selectedChat || !user) return;
    // BUG-4 fix: DM 제한 우회 방지 — 위치 공유도 canSendDm 체크
    if (!canSendDm) { setShowPlusModal(true); return; }
    const pos = await getCurrentLocation(true);
    if (pos) {
      const { lat: latitude, lng: longitude } = pos;
        let locationStr = t("chat.unknownLocation");
        try {
          const lang = i18n.language?.split('-')[0] || 'en';
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=${lang}`);
          const data = await res.json();
          const city = data.city || data.locality || "";
          const country = data.countryName || "";
          if (city || country) locationStr = `${city ? city + ', ' : ''}${country}`;
        } catch (e) {
          locationStr = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }
        const text = `${t("auto.t_0019", "📍 현재 위치 공유")}\n${locationStr || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}`;
        // CRIT-2 fix: insert 성공 후에만 consumeDm (실패 시 DM 손실 방지)
        const { error: insertErr } = await insertMessageAndNotify(text);
        if (!insertErr) {
          consumeDm();
          toast({ title: t("alert.t22Title") });
        } else {
          toast({ title: t('chat.sendFail', '전송 실패'), variant: 'destructive' });
        }
        setShowMoreMenu(false);
    } else {
        toast({ title: t("chat.locationPermErr") });
        setShowMoreMenu(false);
    }
  };
  const handleScheduleShare = async () => {
    if (!scheduleDate || !scheduleText) {
      toast({ title: t("alert.t24Title"), variant: "destructive" });
      return;
    }
    if (!selectedChat || !user) return;
    // BUG-4 fix: 일정 공유도 DM 제한 체크
    if (!canSendDm) { setShowPlusModal(true); return; }
    const text = t("auto.t_0020", `📅 일정 공유\n날짜: ${scheduleDate}\n내용: ${scheduleText}`);
    // CRIT-2 fix: insert 성공 후에만 consumeDm
    const { error: insertErr } = await insertMessageAndNotify(text);
    if (!insertErr) {
      consumeDm();
      setShowScheduleModal(false);
      setScheduleDate("");
      setScheduleText("");
      toast({ title: t("alert.t25Title") });
    } else {
      toast({ title: t('chat.sendFail', '전송 실패'), variant: 'destructive' });
    }
  };
  const handleMeetProposal = async () => {
    if (!meetDate || !meetPlace) {
      toast({ title: t("alert.t26Title"), variant: "destructive" });
      return;
    }
    if (!selectedChat || !user) return;
    // BUG-4 fix: 만남 제안도 DM 제한 체크
    if (!canSendDm) { setShowPlusModal(true); return; }
    const text = t("auto.t_0021", `🤝 만남 제안\n날짜: ${meetDate}\n장소: ${meetPlace}`);
    // CRIT-2 fix: insert 성공 후에만 consumeDm
    const { error: insertErr } = await insertMessageAndNotify(text);
    if (!insertErr) {
      consumeDm();
      setShowMeetProposal(false);
      setMeetDate("");
      setMeetPlace("");
      toast({ title: t("alert.t27Title") });
    } else {
      toast({ title: t('chat.sendFail', '전송 실패'), variant: 'destructive' });
    }
  };
  const handleToggleMute = (chatId: string, name: string) => {
    setMutedChats(prev => {
      const isMuted = prev.includes(chatId);
      toast({
        title: isMuted ? t('chat.mutedOff', { name }) : t('chat.mutedOn', { name })
      });
      const next = isMuted ? prev.filter(id => id !== chatId) : [...prev, chatId];
      // BUG-12 fix: localStorage에 음소거 설정 영속화
      try { localStorage.setItem('migo_muted_chats', JSON.stringify(next)); } catch {}
      return next;
    });
    setShowMoreMenu(false);
  };
  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast({
        title: t("alert.t28Title"),
        variant: "destructive"
      });
      return;
    }
    // BUG-01/14 fix: capture values immediately to prevent stale closure
    const capturedChat = selectedChat;
    const capturedThread = threads.find(c => c.id === capturedChat);
    const opponentId = capturedThread?.opponentId;
    if (user && capturedChat && opponentId) {
      await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_user_id: opponentId,   // ✅ 실제 상대방 user_id
        thread_id: capturedChat,         // 참고용으로 thread_id 별도 저장
        reason: reportReason,
        type: 'chat_room'
      });
    }
    setShowReportModal(false);
    setReportReason("");
    setShowMoreMenu(false);
    setSwipedChatId(null);
    toast({
      title: t("alert.t29Title"),
      description: t("alert.t29Desc")
    });
  };
  const handleDeleteChat = async (_chatId: string) => {
    if (user) {
      try {
        await supabase.from('chat_members').delete().eq('thread_id', _chatId).eq('user_id', user.id);
        setRemovedChats(prev => {
          const next = [...prev, _chatId];
          localStorage.setItem('migo_removed_chats', JSON.stringify(next));
          return next;
        });
        if (selectedChat === _chatId) setSelectedChat(null);
        setShowDeleteConfirm(false);
        setShowMoreMenu(false);
        setSwipedChatId(null);
        toast({
          title: t("chat.leaveRoomSuccess", { defaultValue: "Left the chat room." })
        });
      } catch (err) {
        console.error(err);
        toast({ title: t("common.error", { defaultValue: "An error occurred." }), variant: "destructive" });
      }
    }
  };
  const handleNoShowReport = async () => {
    if (!user || !selectedChat) return;
    try {
      const { data: members } = await supabase.from('chat_members').select('user_id').eq('thread_id', selectedChat).neq('user_id', user.id);
      if (members && members.length > 0) {
        const partnerId = members[0].user_id;
        // no_show_count 컬럼이 DB에 없으므로 reports 테이블에 기록 (400 에러 방지)
        await supabase.from('reports').insert({
          reporter_id: user.id,
          reported_user_id: partnerId,
          thread_id: selectedChat,
          reason: 'no_show',
          type: 'no_show'
        });
      }
      // 내 채팅 목록에서 삭제 (방폭)
      await supabase.from('chat_members').delete().eq('thread_id', selectedChat).eq('user_id', user.id);
      setRemovedChats(prev => {
        const next = [...prev, selectedChat];
        localStorage.setItem('migo_removed_chats', JSON.stringify(next));
        return next;
      });
      toast({
        title: t("instant.matchSuccess"),
        description: t("chat.noShowReportDesc"),
        duration: 3000
      });
      setSelectedChat(null);
      setShowMoreMenu(false);
    } catch (err) {
      console.error(err);
    }
  };
  const filteredThreads = (threads || [])
    .filter(c => {
      if (!c) return false;
      if (removedChats.includes(c.id ?? "")) return false;
      const name = c.name ?? "";
      const lastMsg = c.lastMessage ?? "";
      const matchSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || lastMsg.toLowerCase().includes(searchQuery.toLowerCase());
      const matchUnread = filterType !== "unread" || (c.unread ?? 0) > 0;
      const matchGroup = filterType !== "group" || !!c.isGroup;
      const matchDm = filterType !== "dm" || !c.isGroup;
      return matchSearch && matchUnread && matchGroup && matchDm;
    })
    .filter((c, idx, arr) => arr.findIndex(x => x.id === c.id) === idx); // id 중복 제거



  // ─── Chat view ────────────────────────────────────────────
  if (selectedChat) {
    const thread = threads.find(c => c.id === selectedChat);
    const isMuted = mutedChats.includes(selectedChat);
    const isLocked = !canSendDm;
    return (
      <ChatRoom
        thread={thread}
        selectedChat={selectedChat}
        setSelectedChat={setSelectedChat}
        isMuted={isMuted}
        isLocked={isLocked}
        messages={messages}
        bottomRef={bottomRef}
        isPlus={isPlus}
        canReadReceipts={canReadReceipts}
        setShowPlusModal={setShowPlusModal}
        showPlusModal={showPlusModal}
        handleToggleMute={handleToggleMute}
        handleNoShowReport={handleNoShowReport}
        handleShareLocation={handleShareLocation}
        sendMessage={sendMessage}
        handleDeleteChat={handleDeleteChat}
        handleReport={handleReport}
        handleMeetProposal={handleMeetProposal}
        handleScheduleShare={handleScheduleShare}
        autoTranslate={autoTranslate}
        setAutoTranslate={setAutoTranslate}
        targetLang={targetLang}
        setTargetLang={setTargetLang}
        translateMap={translateMap}
        loadingMap={loadingMap}
        handleTranslate={handleTranslate}
        message={message}
        setMessage={setMessage}
        showMoreMenu={showMoreMenu}
        setShowMoreMenu={setShowMoreMenu}
        showLangPicker={showLangPicker}
        setShowLangPicker={setShowLangPicker}
        showMeetProposal={showMeetProposal}
        setShowMeetProposal={setShowMeetProposal}
        showScheduleModal={showScheduleModal}
        setShowScheduleModal={setShowScheduleModal}
        showReportModal={showReportModal}
        setShowReportModal={setShowReportModal}
        reportReason={reportReason}
        setReportReason={setReportReason}
        showDeleteConfirm={showDeleteConfirm}
        setShowDeleteConfirm={setShowDeleteConfirm}
        showSOS={showSOS}
        setShowSOS={setShowSOS}
        viewingProfile={viewingProfile}
        setViewingProfile={setViewingProfile}
        actionSheetTarget={actionSheetTarget}
        setActionSheetTarget={setActionSheetTarget}
        meetDate={meetDate}
        setMeetDate={setMeetDate}
        meetPlace={meetPlace}
        setMeetPlace={setMeetPlace}
        scheduleDate={scheduleDate}
        setScheduleDate={setScheduleDate}
        scheduleText={scheduleText}
        setScheduleText={setScheduleText}
      />
    );
  }

  // ─── Chat list ────────────────────────────────────────────
  return (
    <div
      className="flex flex-col bg-background text-foreground [--background:0_0%_100%] [--foreground:222.2_84%_4.9%] [--card:0_0%_100%] [--card-foreground:222.2_84%_4.9%] [--muted:210_40%_96.1%] [--muted-foreground:215.4_16.3%_46.9%] [--border:214.3_31.8%_91.4%]"
      style={{ height: '100%', maxHeight: '100%' }}
    >

      {/* ── Header (고정) ── */}
      <div className="shrink-0 px-4 pb-3 pt-[max(env(safe-area-inset-top),18px)] bg-card/95 backdrop-blur-xl border-b border-border/50 z-10">
        <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-black text-foreground tracking-tight">{t('chat.title')}</h1>
          <div className="flex items-center gap-2">
            {!canSendDm && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPlusModal(true)}
                 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-[11px] font-extrabold"
              >
                <Crown size={14} className="drop-shadow-sm" />
                Plus
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowFilterSheet(prev => !prev)}
               className={`w-8 h-8 rounded-lg flex items-center justify-center -mr-1 transition-all ${(showFilterSheet || filterType !== 'all') ? 'bg-primary/15 text-primary shadow-sm' : 'bg-muted text-foreground'}`}
            >
              <SlidersHorizontal size={16} />
            </motion.button>
          </div>
        </div>

        {/* 검색바 */}
        <div className="flex items-center gap-2.5 bg-muted/60 border border-border/60 rounded-xl px-4 py-2 transition-all focus-within:bg-card focus-within:border-primary/40">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t("auto.g_0578", "이름 또는 메시지 검색")}
            className="flex-1 bg-transparent text-[14px] font-medium text-foreground placeholder:text-muted-foreground outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="w-5 h-5 rounded-full bg-muted-foreground/30 flex items-center justify-center shrink-0 hover:bg-muted-foreground/50 transition-colors">
              <X size={11} className="text-white" />
            </button>
          )}
        </div>

        {/* 필터 패널 */}
        <div
          className="overflow-hidden transition-all duration-150"
          style={{ maxHeight: showFilterSheet ? "200px" : "0px", opacity: showFilterSheet ? 1 : 0, marginTop: showFilterSheet ? "8px" : "0px" }}
        >
          <div className="grid grid-cols-4 gap-1.5 pb-1">
            {([
              { id: "all",    emoji: "💬", label: t("chat.filterAll",    "전체") },
              { id: "unread", emoji: "🔔", label: t("chat.filterUnread", "안읽음") },
              { id: "group",  emoji: "👥", label: t("chat.filterGroup",  "그룹") },
              { id: "dm",     emoji: "👤", label: t("chat.filterDm",     "1:1") },
            ] as const).map(opt => (
              <button
                key={opt.id}
                onClick={() => {
                  setFilterType(opt.id);
                  setFilterUnread(opt.id === "unread");
                  setShowFilterSheet(false);
                }}
                 className={`flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-sm font-bold transition-all ${
                  filterType === opt.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/70 text-muted-foreground"
                }`}
              >
                <span>{opt.emoji}</span>
                <span className="text-xs truncate">{opt.label}</span>
                {filterType === opt.id && <Check size={12} />}
              </button>
            ))}
          </div>
        </div>

        {/* 활성 필터 뱃지 */}
        {!showFilterSheet && filterType !== 'all' && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
              <span className="text-[11px] font-bold text-primary">
                {filterType === 'unread' ? '🔔 읽지 않은 채팅' :
                 filterType === 'group'  ? '👥 그룹 채팅만' :
                                           '👤 1:1 채팅만'}
              </span>
              <button
                onClick={() => { setFilterType('all'); setFilterUnread(false); }}
                className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center"
              >
                <X size={9} className="text-primary" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 스크롤 가능 바디 ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Ad Banner */}
        {!isPlus && !isPremium && ads.length > 0 && (
          <div className="px-4 mb-2">
            {ads.map((ad, i) => {
              if (i > 0) return null;
              return (
                <div
                  key={ad.id}
                  onClick={() => {
                    recordAdClick(ad.id, null);
                    if (ad.cta_url) Browser.open({ url: ad.cta_url, presentationStyle: 'fullscreen' });
                  }}
                  className="w-full bg-card rounded-xl overflow-hidden shadow-sm cursor-pointer relative border border-border/30 animate-in fade-in slide-in-from-top-2"
                >
                  {ad.image_url && <img src={ad.image_url} alt={ad.title} className="w-full h-16 object-cover opacity-80" loading="lazy" />}
                  <div className={`px-4 py-2.5 ${ad.image_url ? "absolute inset-0 bg-gradient-to-t from-black/80 flex flex-col justify-end" : ""}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground backdrop-blur-sm">AD</span>
                      <span className={`text-xs font-bold truncate ${ad.image_url ? "text-white" : "text-foreground"}`}>{ad.headline}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── 필터 적용 결과 없음 ── */}
        {filteredThreads.length === 0 && filterType !== 'all' && (
          <div className="flex flex-col items-center justify-center py-16 px-6 gap-3">
            <span className="text-5xl">🔍</span>
            <p className="text-sm font-extrabold text-foreground text-center">
              {t('chat.noFilterResult', '해당 필터에 맞는 채팅이 없어요')}
            </p>
            <p className="text-xs text-muted-foreground text-center">
              {t('chat.noFilterResultDesc', '필터를 해제하면 모든 채팅을 볼 수 있어요')}
            </p>
            <button
              onClick={() => { setFilterType('all'); setFilterUnread(false); }}
              className="mt-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold"
            >
              {t('chat.clearFilter', '필터 초기화')}
            </button>
          </div>
        )}

        {/* ── 채팅 없음 (필터 없음) ── */}
        {filteredThreads.length === 0 && filterType === 'all' && !searchQuery && (
          <div className="mx-4 mt-3">
            <div className="bg-card border border-border/60 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <Shield size={17} className="text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-extrabold text-foreground">{t("chat.safeChat", "Migo 안전 채팅")}</p>
                  <p className="text-[11px] text-muted-foreground">{t("chat.safeChatDesc", "모든 채팅은 암호화 보호됩니다")}</p>
                </div>
              </div>
              {false && <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                  { icon: "🔒", text: t("chat.e2eProtection", "종단간 보호") },
                  { icon: "🛡️", text: t("chat.reportHandled", "신고 즉각 처리") },
                  { icon: "✅", text: t("chat.verifiedOnly", "인증 사용자만") },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex flex-col items-center gap-1 bg-background/60 rounded-xl p-2">
                    <span className="text-base">{icon}</span>
                    <span className="text-[9px] font-bold text-muted-foreground text-center">{text}</span>
                  </div>
                ))}
              </div>}
            </div>
          </div>
        )}

        {/* ── Thread List ── */}
        <ChatThreadList
          filteredThreads={filteredThreads}
          searchQuery={searchQuery}
          removedChats={removedChats}
          swipedChatId={swipedChatId}
          setSwipedChatId={setSwipedChatId}
          mutedChats={mutedChats}
          canOpenChat={canOpenChat}
          setShowPlusModal={setShowPlusModal}
          setSelectedChat={setSelectedChat}
          handleDeleteChat={handleDeleteChat}
          setShowReportModal={setShowReportModal}
          markRead={markRead}
        />
      </div>

      <MigoPlusModal isOpen={showPlusModal} onClose={() => setShowPlusModal(false)} />
    </div>
  );
};
export default ChatPage;
