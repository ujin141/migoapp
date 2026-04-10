import i18n from "@/i18n";
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
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

const getTime = () => {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  return `${ampm} ${h > 12 ? h - 12 : h}:${m}`;
};
const ChatPage = () => {
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
  const [mutedChats, setMutedChats] = useState<string[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>((location.state as {
    chatId?: string;
    threadId?: string;
  } | null)?.threadId ?? (location.state as {
    chatId?: string;
    threadId?: string;
  } | null)?.chatId ?? null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const {
    user
  } = useAuth();
  // ─── 자동 채팅방 폭파 체크는 백엔드(Edge/Cron)로 이관됨 ───


  useEffect(() => {
    if (!selectedChat || !user) return;
    const fetchMessages = async () => {
      const {
        data,
        error
      } = await supabase.from('messages').select('*').eq('thread_id', selectedChat).order('created_at', {
        ascending: false
      }).limit(100);
      if (!error && data) {
        setMessages(data.reverse().map(m => ({
          id: m.id,
          text: m.text,
          sender: m.sender_id === user.id ? "me" : "other",
          time: new Intl.DateTimeFormat(i18n.language, {
            hour: 'numeric',
            minute: 'numeric'
          }).format(new Date(m.created_at))
        })));
      }
    };
    fetchMessages();
    const channel = supabase.channel(`room:${selectedChat}`).on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `thread_id=eq.${selectedChat}`
    }, payload => {
      const newMsg = payload.new;
      setMessages(prev => [...prev, {
        id: newMsg.id,
        text: newMsg.text,
        sender: newMsg.sender_id === user?.id ? "me" : "other",
        time: new Intl.DateTimeFormat(i18n.language, {
          hour: 'numeric',
          minute: 'numeric'
        }).format(new Date(newMsg.created_at))
      }]);
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChat, user]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUnread, setFilterUnread] = useState(false);
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
    fetchActiveAdsForScreen("ChatPage").then(setAds);
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // nav 표시/숨김 — selectedChat 변경 시 동기 DOM 업데이트
  useLayoutEffect(() => {
    const nav = document.getElementById("migo-bottom-nav");
    if (!nav) return;
    nav.style.display = selectedChat ? "none" : "";
    return () => {
      // 컴포넌트 unmount 시 인라인 스타일 완전 제거로 CSS 기본값 복원
      const el = document.getElementById("migo-bottom-nav");
      if (el) el.style.display = "";
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
  }, [selectedChat]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Translate a single message ───────────────────────────
  const handleTranslate = useCallback(async (msgId: string, text: string) => {
    if (translateMap[msgId]) {
      setTranslateMap(prev => {
        const n = {
          ...prev
        };
        delete n[msgId];
        return n;
      });
      return;
    }
    setLoadingMap(prev => ({
      ...prev,
      [msgId]: true
    }));
    try {
      const result = await translateText({
        text,
        targetLang
      });
      setTranslateMap(prev => ({
        ...prev,
        [msgId]: result
      }));
    } catch {
      toast({
        title: t("chat.translateFail"),
        description: t("chat.translateFailDesc"),
        variant: "destructive"
      });
    } finally {
      setLoadingMap(prev => {
        const n = {
          ...prev
        };
        delete n[msgId];
        return n;
      });
    }
  }, [targetLang, translateMap]);

  // Auto-translate incoming messages when toggle is ON
  useEffect(() => {
    if (!autoTranslate) return;
    const last = messages[messages.length - 1];
    if (!last || last.sender === "me" || translateMap[last.id]) return;
    handleTranslate(last.id, last.text);
  }, [messages, autoTranslate]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = async () => {
    if (!message.trim() || !selectedChat || !user) return;
    if (!canSendDm) {
      setShowPlusModal(true);
      return;
    }
    const allowed = consumeDm();
    if (!allowed) {
      setShowPlusModal(true);
      return;
    }

    // Prevent double sending text
    const textToSend = message.trim();
    setMessage("");

    // Insert to DB (컬럼명: text)
    await supabase.from('messages').insert({
      thread_id: selectedChat,
      sender_id: user.id,
      text: textToSend
    });
  };
  const handleShareLocation = async () => {
    if (!selectedChat || !user) return;
    const pos = await getCurrentLocation(true);
    if (pos) {
      const { lat: latitude, lng: longitude } = pos;
        let locationStr = t("chat.unknownLocation");
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=${i18n.language}`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.borough || data.address?.suburb || data.address?.village || data.address?.county || "";
          const country = data.address?.country || "";
          if (city || country) locationStr = `${city ? city + ', ' : ''}${country}`;
        } catch (e) {
          console.error(e);
        }
        const text = t("auto.t_0019", `📍 현재 위치 공유\n${locationStr || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}`);
        await supabase.from('messages').insert({
          thread_id: selectedChat,
          sender_id: user.id,
          text: text
        });
        toast({
          title: t("alert.t22Title")
        });
        setShowMoreMenu(false);
    } else {
        toast({
          title: t("chat.locationPermErr")
        });
        setShowMoreMenu(false);
    }
  };
  const handleScheduleShare = async () => {
    if (!scheduleDate || !scheduleText) {
      toast({
        title: t("alert.t24Title"),
        variant: "destructive"
      });
      return;
    }
    if (!selectedChat || !user) return;
    const text = t("auto.t_0020", `📅 일정 공유\n날짜: ${scheduleDate}\n내용: ${scheduleText}`);
    await supabase.from('messages').insert({
      thread_id: selectedChat,
      sender_id: user.id,
      text: text
    });
    setShowScheduleModal(false);
    setScheduleDate("");
    setScheduleText("");
    toast({
      title: t("alert.t25Title")
    });
  };
  const handleMeetProposal = async () => {
    if (!meetDate || !meetPlace) {
      toast({
        title: t("alert.t26Title"),
        variant: "destructive"
      });
      return;
    }
    if (!selectedChat || !user) return;
    const text = t("auto.t_0021", `🤝 만남 제안\n날짜: ${meetDate}\n장소: ${meetPlace}`);
    await supabase.from('messages').insert({
      thread_id: selectedChat,
      sender_id: user.id,
      text: text
    });
    setShowMeetProposal(false);
    setMeetDate("");
    setMeetPlace("");
    toast({
      title: t("alert.t27Title")
    });
  };
  const handleToggleMute = (chatId: string, name: string) => {
    setMutedChats(prev => {
      const isMuted = prev.includes(chatId);
      toast({
        title: isMuted ? t('chat.mutedOff', { name }) : t('chat.mutedOn', { name })
      });
      return isMuted ? prev.filter(id => id !== chatId) : [...prev, chatId];
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
    if (user && selectedChat) {
      await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_user_id: selectedChat,
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
          title: t("chat.leaveRoomSuccess", { defaultValue: "채팅방을 나갔습니다." })
        });
      } catch (err) {
        console.error(err);
        toast({ title: t("common.error", { defaultValue: "오류가 발생했습니다." }), variant: "destructive" });
      }
    }
  };
  const handleNoShowReport = async () => {
    // 모의: 방폭 및 노쇼 스택 증가 처리 (프리미엄 혜택)
    if (!user || !selectedChat) return;
    try {
      const { data: members } = await supabase.from('chat_members').select('user_id').eq('thread_id', selectedChat).neq('user_id', user.id);
      if (members && members.length > 0) {
        const partnerId = members[0].user_id;
        const { data: pData } = await supabase.from('profiles').select('no_show_count').eq('id', partnerId).maybeSingle();
        if (pData) {
          await supabase.from('profiles').update({ no_show_count: (pData.no_show_count || 0) + 1 }).eq('id', partnerId);
        }
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
  const filteredThreads = threads.filter(c => {
    if (removedChats.includes(c.id)) return false;
    const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    const matchUnread = !filterUnread || c.unread > 0;
    return matchSearch && matchUnread;
  });


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
    <div className="min-h-screen bg-background safe-bottom">

      {/* ── Header ── */}
      <div className="px-5 pb-4 pt-[max(env(safe-area-inset-top),24px)] bg-card/90 backdrop-blur-xl sticky top-0 z-10 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-black text-foreground tracking-tight">{t('chat.title')}</h1>
          <div className="flex items-center gap-2">
            {!canSendDm && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPlusModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-md text-white text-[11px] font-extrabold"
              >
                <Crown size={14} className="drop-shadow-sm" />
                Plus
              </motion.button>
            )}
            <motion.button 
              whileTap={{ scale: 0.9 }} 
              onClick={() => {
                setFilterUnread((prev) => {
                  const nextVal = !prev;
                  setTimeout(() => {
                    if (nextVal) {
                      toast({ title: t("chat.filterUnreadOnly", { defaultValue: "안 읽은 메시지만 모아보기" }), duration: 2000 });
                    } else {
                      toast({ title: t("chat.filterAll", { defaultValue: "모든 메시지 보기" }), duration: 2000 });
                    }
                  }, 0);
                  return nextVal;
                });
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center -mr-1 transition-all ${filterUnread ? 'bg-primary/15 text-primary shadow-sm' : 'bg-muted text-foreground'}`}
            >
              <SlidersHorizontal size={16} />
            </motion.button>
          </div>
        </div>

        {/* 검색바 */}
        <div className="flex items-center gap-2.5 bg-muted/60 border border-border/60 rounded-full px-4 py-2.5 transition-all focus-within:bg-card focus-within:border-primary/40 focus-within:shadow-sm">
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
      </div>

      {/* Ad Banner */}
      {ads.length > 0 && (
        <div className="px-5 mb-3">
          {ads.map((ad, i) => {
            if (i > 0) return null;
            return (
              <motion.div
                key={ad.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => { recordAdClick(ad.id, null); if (ad.cta_url) window.open(ad.cta_url, "_blank"); }}
                onViewportEnter={() => recordAdImpression(ad.id, null)}
                className="w-full bg-card rounded-2xl overflow-hidden shadow-card cursor-pointer relative border border-border/30"
              >
                {ad.image_url && <img src={ad.image_url} alt={ad.title} className="w-full h-16 object-cover opacity-80" loading="lazy" />}
                <div className={`px-4 py-2.5 ${ad.image_url ? "absolute inset-0 bg-gradient-to-t from-black/80 flex flex-col justify-end" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground backdrop-blur-sm">AD</span>
                    <span className={`text-xs font-bold truncate ${ad.image_url ? "text-white" : "text-foreground"}`}>{ad.headline}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
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

      <MigoPlusModal isOpen={showPlusModal} onClose={() => setShowPlusModal(false)} />
    </div>
  );
};
export default ChatPage;