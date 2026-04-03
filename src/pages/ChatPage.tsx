import i18n from "@/i18n";
import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Send, MapPin, Calendar, ArrowLeft, MoreVertical, X, Check, AlertTriangle, Lock, Crown, Users, Phone, Languages, ChevronDown, Map, ShieldAlert, CheckSquare } from "lucide-react";
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

// Removed mock initialMessages

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
    dailyDmCount,
    maxDailyDm,
    canSendDm,
    consumeDm,
    canReadReceipts
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
          time: new Intl.DateTimeFormat('ko-KR', {
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
        time: new Intl.DateTimeFormat('ko-KR', {
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
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showMeetProposal, setShowMeetProposal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [meetDate, setMeetDate] = useState("");
  const [meetPlace, setMeetPlace] = useState("");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleText, setScheduleText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

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
  useEffect(() => {
    if (selectedChat) {
      markRead(selectedChat);
      setOpenThread(selectedChat);
    } else {
      setOpenThread(null);
    }
    return () => {
      setOpenThread(null);
    };
  }, [selectedChat, markRead, setOpenThread]);

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
        description: "잠시후다시",
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
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ko`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.borough || data.address?.suburb || data.address?.village || data.address?.county || "";
          const country = data.address?.country || "";
          if (city || country) locationStr = `${city ? city + ', ' : ''}${country}`;
        } catch (e) {
          console.error(e);
        }
        const text = i18n.t("auto.z_tmpl_470", {
          defaultValue: i18n.t("auto.z_tmpl_873", {
            defaultValue: t("auto.p11", {
              loc: locationStr,
              lat: latitude,
              lng: longitude
            })
          })
        });
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
        await supabase.from('messages').insert({
          thread_id: selectedChat,
          sender_id: user.id,
          text: "현재위치공"
        });
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
    const text = i18n.t("auto.z_tmpl_472", {
      defaultValue: i18n.t("auto.z_tmpl_875", {
        defaultValue: t("auto.p12", {
          date: scheduleDate,
          text: scheduleText
        })
      })
    });
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
    const text = i18n.t("auto.z_tmpl_473", {
      defaultValue: i18n.t("auto.z_tmpl_876", {
        defaultValue: t("auto.p13", {
          date: meetDate,
          place: meetPlace
        })
      })
    });
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
        title: isMuted ? i18n.t("auto.z_tmpl_474", {
          defaultValue: i18n.t("auto.z_tmpl_877", {
            defaultValue: t("auto.t5006", {
              v0: name
            })
          })
        }) : i18n.t("auto.z_tmpl_475", {
          defaultValue: i18n.t("auto.z_tmpl_878", {
            defaultValue: t("auto.t5007", {
              v0: name
            })
          })
        })
      });
      return isMuted ? prev.filter(id => id !== chatId) : [...prev, chatId];
    });
    setShowMoreMenu(false);
  };
  const handleReport = () => {
    if (!reportReason.trim()) {
      toast({
        title: t("alert.t28Title"),
        variant: "destructive"
      });
      return;
    }
    setShowReportModal(false);
    setReportReason("");
    setShowMoreMenu(false);
    toast({
      title: t("alert.t29Title"),
      description: t("alert.t29Desc")
    });
  };
  const handleDeleteChat = (_chatId: string) => {
    setSelectedChat(null);
    setShowDeleteConfirm(false);
    setShowMoreMenu(false);
    toast({
      title: t("alert.t30Title")
    });
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
      toast({
        title: "바로모임 파기 완료",
        description: "노쇼 신고가 접수되었으며 채팅방을 나갑니다.",
        duration: 3000
      });
      setSelectedChat(null);
      setShowMoreMenu(false);
    } catch (err) {
      console.error(err);
    }
  };
  const filteredThreads = threads.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()));

  // ─── DM Limit bar ─────────────────────────────────────────
  const dmLimitBar = !isPlus && <motion.div initial={{
    opacity: 0,
    y: -8
  }} animate={{
    opacity: 1,
    y: 0
  }} className={`mx-4 mb-2 px-4 py-2.5 rounded-2xl flex items-center justify-between ${dailyDmCount >= maxDailyDm ? "bg-red-500/10 border border-red-500/30" : "bg-amber-500/10 border border-amber-500/20"}`}>
      <div className="flex items-center gap-2">
        {dailyDmCount >= maxDailyDm ? <Lock size={13} className="text-red-500 shrink-0" /> : <Crown size={13} className="text-amber-500 shrink-0" />}
        <span className={`text-xs font-semibold ${dailyDmCount >= maxDailyDm ? "text-red-500" : "text-amber-500"}`}>
          {dailyDmCount >= maxDailyDm ? "오늘메시지" : t("auto.z_tmpl_477", {
          defaultValue: t("auto.z_tmpl_880", {
            defaultValue: t("auto.t5008", {
              v0: dailyDmCount,
              v1: maxDailyDm
            })
          })
        })}
        </span>
      </div>
      <button onClick={() => setShowPlusModal(true)} className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0 ${dailyDmCount >= maxDailyDm ? "bg-red-500 text-white" : "bg-amber-500/20 text-amber-500 border border-amber-500/30"}`}>
        {dailyDmCount >= maxDailyDm ? "업그레이드" : "Plus"}
      </button>
    </motion.div>;

  // ─── Chat view ────────────────────────────────────────────
  if (selectedChat) {
    const thread = threads.find(c => c.id === selectedChat);
    const isMuted = mutedChats.includes(selectedChat);
    const isLocked = !canSendDm;
    return <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <header className="bg-card border-b border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <button onClick={() => setSelectedChat(null)} className="transition-transform active:scale-90">
              <ArrowLeft size={20} className="text-foreground" />
            </button>
            {thread?.photo ? <img src={thread.photo} alt="" className="w-9 h-9 rounded-full object-cover" loading="lazy" onError={e => {
            (e.target as HTMLImageElement).style.display = 'none';
          }} /> : <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                {thread?.name?.[0] ?? "?"}
              </div>}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-foreground">{thread?.name}</h3>
                {isMuted && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{"알림끔"}</span>}
              </div>
              <span className="text-[10px] text-primary font-medium">{thread?.online ? t('chat.online') : "오프라인4"}</span>
            </div>
            <div className="flex items-center gap-1">
              <motion.button whileTap={{
              scale: 0.9
            }} onClick={() => navigate("/safety")} className="w-8 h-8 flex items-center justify-center rounded-xl text-orange-500 bg-orange-500/10 transition-colors hover:bg-orange-500/20">
                <ShieldAlert size={16} />
              </motion.button>
              <motion.button whileTap={{
              scale: 0.9
            }} onClick={() => navigate("/voice-call", {
              state: {
                contactId: thread?.id ?? "u1"
              }
            })} className="w-8 h-8 flex items-center justify-center rounded-xl text-primary transition-colors hover:bg-muted">
                <Phone size={17} />
              </motion.button>
              <div className="relative">
                <button onClick={() => setShowMoreMenu(v => !v)} className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors hover:bg-muted">
                  <MoreVertical size={18} className="text-muted-foreground" />
                </button>
                <AnimatePresence>
                  {showMoreMenu && <motion.div className="absolute right-0 top-10 bg-card border border-border rounded-2xl shadow-float p-1 min-w-[150px] z-50" initial={{
                  opacity: 0,
                  scale: 0.9,
                  y: -4
                }} animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0
                }} exit={{
                  opacity: 0,
                  scale: 0.9,
                  y: -4
                }}>
                      <div className="fixed inset-0 z-[-1]" onClick={() => setShowMoreMenu(false)} />
                      <button onClick={() => {
                    setShowMoreMenu(false);
                    navigate("/trip-review", {
                      state: {
                        partnerName: thread?.name,
                        partnerPhoto: thread?.photo,
                        threadId: selectedChat,
                        destination: t("auto.x4007")
                      }
                    });
                  }} className="w-full text-left px-4 py-2.5 text-sm text-emerald-500 rounded-xl hover:bg-emerald-500/10 transition-colors flex items-center gap-2">
                        <CheckSquare size={13} />{t("auto.x4006")}
                      </button>
                      <button onClick={() => {
                    setShowMoreMenu(false);
                    navigate("/profile", { state: { viewingThreadId: selectedChat } });
                  }} className="w-full text-left px-4 py-2.5 text-sm text-foreground rounded-xl hover:bg-muted transition-colors">{"프로필보기"}</button>
                      <button onClick={() => handleToggleMute(selectedChat, thread?.name ?? "")} className="w-full text-left px-4 py-2.5 text-sm text-foreground rounded-xl hover:bg-muted transition-colors">
                        {isMuted ? "알림켜기4" : "알림끄기4"}
                      </button>
                      <button onClick={() => {
                    setShowMoreMenu(false);
                    setShowReportModal(true);
                  }} className="w-full text-left px-4 py-2.5 text-sm text-red-500 rounded-xl hover:bg-red-500/10 transition-colors">{"신고하기4"}</button>
                      <button onClick={() => {
                    setShowMoreMenu(false);
                    setShowDeleteConfirm(true);
                  }} className="w-full text-left px-4 py-2.5 text-sm text-red-500 rounded-xl hover:bg-red-500/10 transition-colors">{t('chat.deleteChat')}</button>
                      <button onClick={() => {
                        setShowMoreMenu(false);
                        setShowSOS(true);
                      }} className="w-full text-left px-4 py-2.5 text-sm text-orange-500 rounded-xl hover:bg-orange-500/10 transition-colors flex items-center gap-2">
                        <AlertTriangle size={13} />{"긴급SOS"}
                      </button>
                      
                      {/* 프리미엄 유저 대상: 방폭 및 노쇼 제한 조치 */}
                      {isPlus && (
                        <div className="pt-2 mt-2 border-t border-border">
                          <button onClick={handleNoShowReport} className="w-full text-left px-4 py-2.5 text-sm font-bold text-rose-500 rounded-xl hover:bg-rose-500/10 transition-colors flex items-center gap-2">
                            <Crown size={13} className="text-rose-500" />
                            노쇼 신고 및 채팅방 나가기 (방폭)
                          </button>
                        </div>
                      )}
                    </motion.div>}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Auto-translate bar */}
          <div className="px-4 pb-2.5 flex items-center gap-2 flex-wrap">
            <motion.button whileTap={{
            scale: 0.93
          }} onClick={() => setAutoTranslate(v => !v)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${autoTranslate ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40" : "bg-muted text-muted-foreground border border-transparent"}`}>
              <Languages size={12} />{"자동번역4"}{autoTranslate ? "ON" : "OFF"}
            </motion.button>
            <div className="relative">
              <button onClick={() => setShowLangPicker(v => !v)} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-[11px] font-medium text-foreground border border-border">
                {LANG_NAMES[targetLang]}
                <ChevronDown size={10} />
              </button>
              <AnimatePresence>
                {showLangPicker && <motion.div className="absolute left-0 top-8 bg-card border border-border rounded-2xl shadow-float p-1.5 z-50 min-w-[140px]" initial={{
                opacity: 0,
                scale: 0.9,
                y: -4
              }} animate={{
                opacity: 1,
                scale: 1,
                y: 0
              }} exit={{
                opacity: 0,
                scale: 0.9
              }}>
                    <div className="fixed inset-0 z-[-1]" onClick={() => setShowLangPicker(false)} />
                    {(Object.entries(LANG_NAMES) as [SupportedLang, string][]).map(([code, name]) => <button key={code} onClick={() => {
                  setTargetLang(code);
                  setShowLangPicker(false);
                  setTranslateMap({});
                }} className={`w-full text-left px-3 py-2 text-xs rounded-xl transition-colors ${targetLang === code ? "bg-indigo-500/10 text-indigo-400 font-bold" : "text-foreground hover:bg-muted"}`}>
                        {name}
                      </button>)}
                  </motion.div>}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {dmLimitBar}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg, idx) => {
          const isMe = msg.sender === "me";
          const isLastMine = isMe && messages.slice(idx + 1).every(m => m.sender !== "me");
          const translated = translateMap[msg.id];
          const isTranslating = loadingMap[msg.id];
          return <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"} gap-1`}>
                <div className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${isMe ? "gradient-primary text-primary-foreground rounded-2xl rounded-br-md" : "bg-muted text-foreground rounded-2xl rounded-bl-md"}`}>
                  {/* Rich Custom Renderers */}
                  {msg.text.startsWith("현재위치공") ? <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-blue-500/20">
                        <MapPin size={18} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-blue-500 mb-0.5">{"내현재위치"}</p>
                        <p className="text-sm font-bold text-foreground mb-1 line-clamp-1">{msg.text.split('\n')[1] || "위치알수없"}</p>
                        <a href={msg.text.split('\n')[2] || "#"} target="_blank" rel="noopener noreferrer" className="text-[10px] font-medium text-blue-500 underline underline-offset-2">{"지도열기4"}</a>
                      </div>
                    </div> : msg.text.startsWith("만남제안4") ? <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-orange-500/20">
                        <Calendar size={18} className="text-orange-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-orange-500 mb-0.5">{"만남제안4"}</p>
                        <p className="text-sm font-bold text-foreground mb-0.5">{msg.text.split('\n')[1]?.replace("날짜", '') || ""}</p>
                        <p className="text-xs text-muted-foreground truncate">{msg.text.split('\n')[2]?.replace("장소", '') || ""}</p>
                      </div>
                    </div> : msg.text.startsWith("여행일정공") ? <div className="flex gap-3 items-start">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-green-500/20 mt-1">
                        <Map size={18} className="text-green-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-extrabold text-green-500 mb-0.5">{"우리의일정"}</p>
                        <p className="text-xs font-bold text-foreground mb-1 bg-background/50 inline-block px-2 py-0.5 rounded text-left">{msg.text.split('\n')[1]?.replace("일시", '')}</p>
                        <p className="text-sm text-foreground text-left">{msg.text.split('\n').slice(2).join('\n').replace("내용", '')}</p>
                      </div>
                    </div> : msg.text}
                  <div className={`flex items-center ${isMe ? "justify-end" : "justify-start"} gap-1 mt-1`}>
                    <span className={`text-[10px] ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{msg.time}</span>
                    {isMe && canReadReceipts && <span className={`text-[10px] font-bold flex items-center gap-0.5 ${isLastMine ? "text-primary-foreground/50" : "text-blue-300"}`}>
                        <Check size={9} strokeWidth={3} />
                        <Check size={9} strokeWidth={3} className="-ml-1.5" />
                        {!isLastMine && <span className="text-[8px]">{"읽음"}</span>}
                      </span>}
                  </div>
                </div>

                {/* Translate button — all messages */}
                <motion.button whileTap={{
              scale: 0.92
            }} onClick={() => handleTranslate(msg.id, msg.text)} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${translated ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "bg-muted/60 text-muted-foreground hover:text-foreground border border-border"}`}>
                  {isTranslating ? <motion.div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full" animate={{
                rotate: 360
              }} transition={{
                duration: 0.7,
                repeat: Infinity,
                ease: "linear"
              }} /> : <Languages size={10} />}
                  {isTranslating ? "번역중" : translated ? "원문보기5" : i18n.t("auto.z_tmpl_502", {
                defaultValue: i18n.t("auto.z_tmpl_905", {
                  defaultValue: i18n.t("auto.z_tmpl_805", {
                    defaultValue: `번역 (${LANG_NAMES[targetLang]})`
                  })
                })
              })}
                </motion.button>

                {/* Translated result */}
                <AnimatePresence>
                  {translated && <motion.div initial={{
                opacity: 0,
                y: -4,
                scale: 0.97
              }} animate={{
                opacity: 1,
                y: 0,
                scale: 1
              }} exit={{
                opacity: 0,
                y: -4,
                scale: 0.97
              }} className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed border ${isMe ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-bl-md"}`} style={{
                background: "rgba(99,102,241,0.08)",
                borderColor: "rgba(99,102,241,0.25)",
                color: "var(--foreground)"
              }}>
                      <div className="flex items-center gap-1 mb-1">
                        <Languages size={9} className="text-indigo-400" />
                        <span className="text-[9px] font-bold text-indigo-400">{"번역됨"}{LANG_NAMES[targetLang]})</span>
                      </div>
                      {translated}
                    </motion.div>}
                </AnimatePresence>
              </div>;
        })}
          <div ref={bottomRef} />
        </div>

        {/* Locked overlay */}
        {isLocked && <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} className="mx-4 mb-2 p-4 rounded-3xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/30 flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <Lock size={18} className="text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-extrabold text-foreground">{"오늘메시지"}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{"Plus로"}</p>
            </div>
            <motion.button whileTap={{
          scale: 0.95
        }} onClick={() => setShowPlusModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-extrabold shadow-lg shrink-0">
              <Crown size={12} /> Plus
            </motion.button>
          </motion.div>}

        {/* Quick actions */}
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto scrollbar-hide">
          <button onClick={handleShareLocation} className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground transition-colors hover:bg-border active:scale-95">
            <MapPin size={12} />{"위치"}</button>
          <button onClick={() => setShowMeetProposal(true)} className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground transition-colors hover:bg-border active:scale-95">
            <Calendar size={12} />{"제안"}</button>
          <button onClick={() => setShowScheduleModal(true)} className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground transition-colors hover:bg-border active:scale-95">
            <Map size={12} />{"일정공유5"}</button>
        </div>

        {/* Input */}
        <div className="px-4 pb-20 pt-2">
          <div className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 transition-colors ${isLocked ? "bg-muted/50" : "bg-muted"}`}>
            <input type="text" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) sendMessage(); }} placeholder={isLocked ? "Plus로" : isMuted ? "알림이꺼진" : "메시지입력"} disabled={isLocked} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed" />
            {isLocked ? <motion.button whileTap={{
            scale: 0.9
          }} onClick={() => setShowPlusModal(true)} className="w-9 h-9 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                <Crown size={16} className="text-white" />
              </motion.button> : <button onClick={sendMessage} disabled={!message.trim()} className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center transition-transform active:scale-90 disabled:opacity-40">
                <Send size={16} className="text-primary-foreground" />
              </button>}
          </div>
        </div>

        {/* Meet Proposal Modal */}
        <AnimatePresence>
          {showMeetProposal && <motion.div className="fixed inset-0 z-50 flex items-end justify-center px-safe pb-safe pt-safe" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} exit={{
          opacity: 0
        }}>
              <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowMeetProposal(false)} />
              <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 p-6 pb-20 shadow-float" initial={{
            y: "100%"
          }} animate={{
            y: 0
          }} exit={{
            y: "100%"
          }} transition={{
            type: "spring",
            damping: 25,
            stiffness: 300
          }}>
                <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-extrabold text-foreground">{"만남제안5"}</h3>
                  <button onClick={() => setShowMeetProposal(false)}><X size={20} className="text-muted-foreground" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-foreground mb-2 block">{"날짜"}</label>
                    <input type="date" value={meetDate} onChange={e => setMeetDate(e.target.value)} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-foreground mb-2 block">{"장소"}</label>
                    <input type="text" value={meetPlace} onChange={e => setMeetPlace(e.target.value)} placeholder={"예카오산로"} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <button onClick={handleMeetProposal} className="w-full py-3.5 rounded-2xl gradient-primary text-primary-foreground font-semibold text-sm shadow-card flex items-center justify-center gap-2 mt-2">
                    <Check size={16} />{"제안보내기"}</button>
                </div>
              </motion.div>
            </motion.div>}
        </AnimatePresence>

        {/* Schedule Share Modal */}
        <AnimatePresence>
          {showScheduleModal && <motion.div className="fixed inset-0 z-50 flex items-end justify-center px-safe pb-safe pt-safe" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} exit={{
          opacity: 0
        }}>
              <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowScheduleModal(false)} />
              <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 p-6 pb-20 shadow-float" initial={{
            y: "100%"
          }} animate={{
            y: 0
          }} exit={{
            y: "100%"
          }} transition={{
            type: "spring",
            damping: 25,
            stiffness: 300
          }}>
                <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2"><Map size={20} className="text-green-500" />{"일정공유하"}</h3>
                  <button onClick={() => setShowScheduleModal(false)}><X size={20} className="text-muted-foreground" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-foreground mb-2 block">{"언제할까요"}</label>
                    <input type="text" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} placeholder={"예5월"} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-green-500/30" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-foreground mb-2 block">{"어떤일정인"}</label>
                    <textarea value={scheduleText} onChange={e => setScheduleText(e.target.value)} placeholder={"예n카페투"} className="w-full h-32 resize-none bg-muted rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-green-500/30" />
                  </div>
                  <button onClick={handleScheduleShare} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold text-sm shadow-card flex items-center justify-center gap-2 mt-2">
                    <Check size={16} />{"채팅방에일"}</button>
                </div>
              </motion.div>
            </motion.div>}
        </AnimatePresence>

        {/* Report Modal */}
        <AnimatePresence>
          {showReportModal && <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-5" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} exit={{
          opacity: 0
        }}>
              <div className="absolute inset-0 bg-foreground/60 backdrop-blur-md" onClick={() => setShowReportModal(false)} />
              <motion.div className="relative z-10 w-full max-w-sm bg-card rounded-3xl p-6 shadow-float" initial={{
            scale: 0.85
          }} animate={{
            scale: 1
          }} exit={{
            scale: 0.85
          }} transition={{
            type: "spring",
            damping: 20
          }}>
                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={24} className="text-red-500" />
                </div>
                <h3 className="text-lg font-extrabold text-foreground text-center mb-1">{"신고하기5"}</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">{thread?.name}{"님을신고하"}</p>
                <div className="space-y-2 mb-4">
                  {["부적절한언", "스팸광고5", "허위프로필", "불쾌한내용", "기타"].map(reason => <button key={reason} onClick={() => setReportReason(reason)} className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${reportReason === reason ? "bg-red-500/10 text-red-500 border border-red-500/30" : "bg-muted text-foreground"}`}>
                      {reason}
                    </button>)}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowReportModal(false)} className="flex-1 py-3 rounded-2xl border border-border text-foreground font-semibold text-sm">{t('common.cancel')}</button>
                  <button onClick={handleReport} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm">{"신고"}</button>
                </div>
              </motion.div>
            </motion.div>}
        </AnimatePresence>

        {/* Delete Confirm */}
        <AnimatePresence>
          {showDeleteConfirm && <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-5" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} exit={{
          opacity: 0
        }}>
              <div className="absolute inset-0 bg-foreground/60 backdrop-blur-md" onClick={() => setShowDeleteConfirm(false)} />
              <motion.div className="relative z-10 w-full max-w-sm bg-card rounded-3xl p-6 shadow-float text-center" initial={{
            scale: 0.85
          }} animate={{
            scale: 1
          }} exit={{
            scale: 0.85
          }} transition={{
            type: "spring",
            damping: 20
          }}>
                <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <X size={24} className="text-destructive" />
                </div>
                <h3 className="text-lg font-extrabold text-foreground mb-2">{"대화를삭제"}</h3>
                <p className="text-sm text-muted-foreground mb-6">{"삭제된대화"}</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-2xl border border-border text-foreground font-semibold text-sm">{t('common.cancel')}</button>
                  <button onClick={() => handleDeleteChat(selectedChat)} className="flex-1 py-3 rounded-2xl bg-destructive text-white font-bold text-sm">{"삭제"}</button>
                </div>
              </motion.div>
            </motion.div>}
        </AnimatePresence>

        <MigoPlusModal isOpen={showPlusModal} onClose={() => setShowPlusModal(false)} />
        <SOSModal isOpen={showSOS} onClose={() => setShowSOS(false)} />
      </div>;
  }

  // ─── Chat list ────────────────────────────────────────────
  return <div className="min-h-screen bg-background safe-bottom">
      <header className="px-5 pt-4 pb-2">
        <h1 className="text-2xl font-extrabold text-foreground">{t('chat.title')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{"매칭된여행"}</p>
      </header>

      {dmLimitBar}

      {/* Ad Banner */}
      {ads.length > 0 && <div className="px-5 mb-2">
          {ads.map((ad, i) => {
        if (i > 0) return null; // Show only one banner
        return <motion.div key={ad.id} initial={{
          opacity: 0,
          y: -10
        }} animate={{
          opacity: 1,
          y: 0
        }} onClick={() => {
          recordAdClick(ad.id, null);
          if (ad.cta_url) window.open(ad.cta_url, "_blank");
        }} onViewportEnter={() => recordAdImpression(ad.id, null)} className="w-full bg-card rounded-2xl overflow-hidden shadow-float cursor-pointer relative">
                {ad.image_url && <img src={ad.image_url} alt={ad.title} className="w-full h-20 object-cover opacity-80" loading="lazy" />}
                <div className={`p-4 ${ad.image_url ? "absolute inset-0 bg-gradient-to-t from-black/80 flex flex-col justify-end" : ""}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground/80 backdrop-blur-sm border border-border/50">AD</span>
                    <h4 className={`text-sm font-extrabold ${ad.image_url ? "text-white" : "text-foreground"}`}>{ad.headline}</h4>
                  </div>
                  <p className={`text-xs line-clamp-1 ${ad.image_url ? "text-white/80" : "text-muted-foreground"}`}>{ad.body_text}</p>
                </div>
              </motion.div>;
      })}
        </div>}

      <div className="px-5 py-3">
        <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3">
          <Search size={18} className="text-muted-foreground" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={"대화검색5"} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
          {searchQuery && <button onClick={() => setSearchQuery("")}><X size={14} className="text-muted-foreground" /></button>}
        </div>
      </div>

      <div className="px-5 space-y-1 pb-24">
        {filteredThreads.length === 0 ? <div className="text-center py-12"><p className="text-muted-foreground text-sm">{"검색결과가"}</p></div> : filteredThreads.map(chat => {
        const groupChat = chat as GroupThread;
        return <button key={chat.id} onClick={() => setSelectedChat(chat.id)} className="w-full flex items-center gap-3 p-3 rounded-2xl transition-colors hover:bg-muted">
                <div className="relative">
                  {groupChat.isGroup && groupChat.memberPhotos && groupChat.memberPhotos.length >= 2 ? <div className="w-14 h-14 relative">
                      <img src={groupChat.memberPhotos[0]} alt="" className="w-10 h-10 rounded-xl object-cover absolute top-0 left-0 border-2 border-card" loading="lazy" />
                      <img src={groupChat.memberPhotos[1]} alt="" className="w-10 h-10 rounded-xl object-cover absolute bottom-0 right-0 border-2 border-card" loading="lazy" />
                    </div> : chat.photo ? <img src={chat.photo} alt="" className="w-14 h-14 rounded-2xl object-cover" loading="lazy" onError={e => {
              {
                (e.target as HTMLImageElement).style.display = 'none';
              }
            }} /> : <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground text-xl font-extrabold">
                        {chat.name?.[0] ?? "?"}
                      </div>}
                  {groupChat.isGroup ? <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-card">
                      <Users size={9} className="text-primary-foreground" />
                    </div> : chat.online && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-primary border-2 border-card" />}
                  {mutedChats.includes(chat.id) && <div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-muted border border-border flex items-center justify-center">
                      <span className="text-[8px]">🔕</span>
                    </div>}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm text-foreground truncate max-w-[150px]">{chat.name}</h4>
                      {groupChat.isGroup && <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">{"단톡"}{groupChat.memberCount}{"명"}</span>}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{chat.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{chat.lastMessage}</p>
                </div>
                {chat.unread > 0 && <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-primary-foreground">{chat.unread}</span>
                  </div>}
              </button>;
      })}
      </div>

      <MigoPlusModal isOpen={showPlusModal} onClose={() => setShowPlusModal(false)} />
    </div>;
};
export default ChatPage;