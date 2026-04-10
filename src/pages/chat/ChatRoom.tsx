import i18n from "@/i18n";
import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MoreVertical, ShieldAlert, Phone, CheckSquare, Shield, Crown, AlertTriangle, Languages, ChevronDown, Check, MapPin, Calendar, Map, Lock, Send, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { LANG_NAMES, SupportedLang } from "@/lib/translateService";
import { MeetProposalModal, ScheduleShareModal, ReportModal, DeleteConfirmModal } from "./ChatModals";
import MigoPlusModal from "@/components/MigoPlusModal";
import SOSModal from "@/components/SOSModal";
import ProfileDetailSheet from "@/components/ProfileDetailSheet";
import ReportBlockActionSheet from "@/components/ReportBlockActionSheet";

export interface ChatRoomProps {
  // State from parent
  thread: any;
  selectedChat: string | null;
  setSelectedChat: (id: string | null) => void;
  isMuted: boolean;
  isLocked: boolean;
  messages: any[];
  bottomRef: React.RefObject<HTMLDivElement>;

  // Subscription
  isPlus: boolean;
  canReadReceipts: boolean;
  setShowPlusModal: (v: boolean) => void;
  showPlusModal: boolean;

  // Actions
  handleToggleMute: (chatId: string, name: string) => void;
  handleNoShowReport: () => void;
  handleShareLocation: () => void;
  sendMessage: () => void;
  handleDeleteChat: (chatId: string) => void;
  handleReport: () => void;
  handleMeetProposal: () => void;
  handleScheduleShare: () => void;

  // Translation
  autoTranslate: boolean;
  setAutoTranslate: React.Dispatch<React.SetStateAction<boolean>>;
  targetLang: SupportedLang;
  setTargetLang: React.Dispatch<React.SetStateAction<SupportedLang>>;
  translateMap: Record<string, string>;
  loadingMap: Record<string, boolean>;
  handleTranslate: (msgId: string, text: string) => void;

  // Form State
  message: string;
  setMessage: (v: string) => void;

  // Modals / Overlays
  showMoreMenu: boolean;
  setShowMoreMenu: React.Dispatch<React.SetStateAction<boolean>>;
  showLangPicker: boolean;
  setShowLangPicker: React.Dispatch<React.SetStateAction<boolean>>;
  showMeetProposal: boolean;
  setShowMeetProposal: React.Dispatch<React.SetStateAction<boolean>>;
  showScheduleModal: boolean;
  setShowScheduleModal: React.Dispatch<React.SetStateAction<boolean>>;
  showReportModal: boolean;
  setShowReportModal: React.Dispatch<React.SetStateAction<boolean>>;
  reportReason: string;
  setReportReason: (v: string) => void;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  showSOS: boolean;
  setShowSOS: React.Dispatch<React.SetStateAction<boolean>>;
  viewingProfile: any | null;
  setViewingProfile: React.Dispatch<React.SetStateAction<any | null>>;
  actionSheetTarget: any | null;
  setActionSheetTarget: React.Dispatch<React.SetStateAction<any | null>>;

  // Meet / Schedule State
  meetDate: string;
  setMeetDate: (v: string) => void;
  meetPlace: string;
  setMeetPlace: (v: string) => void;
  scheduleDate: string;
  setScheduleDate: (v: string) => void;
  scheduleText: string;
  setScheduleText: (v: string) => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  thread, selectedChat, setSelectedChat, isMuted, isLocked, messages, bottomRef,
  isPlus, canReadReceipts, setShowPlusModal, showPlusModal,
  handleToggleMute, handleNoShowReport, handleShareLocation, sendMessage, handleDeleteChat, handleReport, handleMeetProposal, handleScheduleShare,
  autoTranslate, setAutoTranslate, targetLang, setTargetLang, translateMap, loadingMap, handleTranslate,
  message, setMessage,
  showMoreMenu, setShowMoreMenu,
  showLangPicker, setShowLangPicker,
  showMeetProposal, setShowMeetProposal,
  showScheduleModal, setShowScheduleModal,
  showReportModal, setShowReportModal, reportReason, setReportReason,
  showDeleteConfirm, setShowDeleteConfirm,
  showSOS, setShowSOS,
  viewingProfile, setViewingProfile,
  actionSheetTarget, setActionSheetTarget,
  meetDate, setMeetDate, meetPlace, setMeetPlace,
  scheduleDate, setScheduleDate, scheduleText, setScheduleText
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // ── 번역해서 보내기 상태 (Free: 하루 3회, Plus 무제한) ──
  const [translateSending, setTranslateSending] = useState(false);
  const FREE_DAILY_TRANSLATE_SEND = 3;
  const todayKey = `migo_translate_send_${new Date().toISOString().slice(0, 10)}`;
  const getTranslateSendCount = () => parseInt(localStorage.getItem(todayKey) || '0', 10);
  const incrementTranslateSendCount = () => localStorage.setItem(todayKey, String(getTranslateSendCount() + 1));

  const handleTranslateSend = useCallback(async () => {
    if (!message.trim()) return;
    if (!isPlus) {
      const used = getTranslateSendCount();
      if (used >= FREE_DAILY_TRANSLATE_SEND) {
        setShowPlusModal(true);
        return;
      }
    }
    setTranslateSending(true);
    try {
      const { translateText } = await import('@/lib/translateService');
      const translated = await translateText({ text: message, targetLang });
      if (translated && translated !== message) {
        // 번역된 텍스트로 message를 교체 후 전송
        setMessage(translated);
        // 짧은 딜레이 후 전송 (state 반영 대기)
        await new Promise(r => setTimeout(r, 50));
        sendMessage();
        if (!isPlus) incrementTranslateSendCount();
      } else {
        sendMessage();
      }
    } catch {
      sendMessage();
    } finally {
      setTranslateSending(false);
    }
  }, [message, targetLang, isPlus, sendMessage, setMessage]);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header (Backdrop Blur) */}
      <header className="sticky top-0 z-20 pt-safe bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => setSelectedChat(null)} className="transition-transform active:scale-90 p-1 -ml-1">
            <ArrowLeft size={22} className="text-foreground" />
          </button>
          {thread?.photo ? (
            <img src={thread.photo} alt="" className="w-10 h-10 rounded-full object-cover shadow-sm border border-border/10" loading="lazy" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold shadow-sm">
              {thread?.name?.[0] ?? "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="font-extrabold text-[15px] text-foreground truncate pl-0.5">{thread?.name}</h3>
              {isMuted && <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground font-bold shrink-0">🔕</span>}
            </div>
            <span className={`text-[11px] font-bold pl-0.5 ${thread?.online ? "text-emerald-500" : "text-muted-foreground"}`}>{thread?.online ? i18n.t('chat.online') : i18n.t('chat.offline')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* 신고/차단 버튼 — Guideline 1.2 직접 노출 */}
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setActionSheetTarget(thread)} className="w-9 h-9 flex items-center justify-center rounded-full text-red-400 bg-red-500/10 transition-colors hover:bg-red-500/20 border border-red-500/20">
              <ShieldAlert size={16} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/voice-call", { state: { contactId: thread?.id ?? "u1" } })} className="w-9 h-9 flex items-center justify-center rounded-full text-white bg-indigo-500 transition-colors hover:bg-indigo-600 shadow-md">
              <Phone size={15} fill="currentColor" />
            </motion.button>
            <div className="relative">
              <button onClick={() => setShowMoreMenu(v => !v)} className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-muted ml-1">
                <MoreVertical size={20} className="text-foreground" />
              </button>
              <AnimatePresence>
                {showMoreMenu && (
                  <motion.div className="absolute right-0 top-11 bg-card/95 backdrop-blur-md border border-border/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-1.5 min-w-[240px] z-[100]" initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }}>
                    <div className="fixed inset-0 z-[-1]" onClick={() => setShowMoreMenu(false)} />
                    <button onClick={() => { setShowMoreMenu(false); navigate("/trip-review", { state: { partnerName: thread?.name, partnerPhoto: thread?.photo, threadId: selectedChat, destination: i18n.t("auto.x4007") } }); }} className="w-full text-left px-4 py-3 text-[13px] font-bold text-emerald-600 rounded-2xl hover:bg-emerald-500/10 transition-colors flex items-center gap-2.5">
                      <CheckSquare size={14} />{i18n.t("auto.x4006")}
                    </button>
                    <button onClick={async () => { 
                        setShowMoreMenu(false); 
                        if (thread?.opponentId) {
                          // Profile view logic depends on passing appropriate args, or resolving at parent. 
                          // Handled correctly by parent if we pass setViewingProfile
                          setViewingProfile({ id: thread.opponentId }); // Simplified for extraction wrapper
                        }
                      }} className="w-full text-left px-4 py-3 text-[13px] font-semibold text-foreground rounded-2xl hover:bg-muted transition-colors">{i18n.t('chat.viewProfile')}
                    </button>
                    <button onClick={() => handleToggleMute(selectedChat!, thread?.name ?? "")} className="w-full text-left px-4 py-3 text-[13px] font-semibold text-foreground rounded-2xl hover:bg-muted transition-colors">
                      {isMuted ? i18n.t('chat.muteOff') : i18n.t('chat.muteOn')}
                    </button>
                    <button onClick={() => { setShowMoreMenu(false); setActionSheetTarget(thread); }} className="w-full text-left px-4 py-3 text-[13px] font-semibold text-red-500 rounded-2xl hover:bg-red-500/5 transition-colors">{i18n.t('chat.report')}</button>
                    <button onClick={() => { setShowMoreMenu(false); setShowDeleteConfirm(true); }} className="w-full text-left px-4 py-3 text-[13px] font-semibold text-red-500 rounded-2xl hover:bg-red-500/5 transition-colors">{i18n.t('chat.deleteChat')}</button>
                    <button onClick={() => { setShowMoreMenu(false); setShowSOS(true); }} className="w-full text-left px-4 py-3 text-[13px] font-bold text-orange-500 rounded-2xl hover:bg-orange-500/10 transition-colors flex items-center gap-2.5">
                      <AlertTriangle size={14} />{i18n.t('sos.title')}
                    </button>
                    <button onClick={() => { setShowMoreMenu(false); }} className="w-full text-left px-4 py-3 text-[13px] font-bold text-emerald-600 rounded-2xl hover:bg-emerald-500/10 transition-colors flex items-center gap-2.5">
                      <Shield size={14} /> {i18n.t('chat.safeCompanionBtn')}
                    </button>
                    
                    {isPlus && (
                      <div className="pt-1.5 mt-1.5 border-t border-border/50">
                        <button onClick={handleNoShowReport} className="w-full text-left px-4 py-3 text-[13px] font-bold text-rose-500 rounded-2xl hover:bg-rose-500/10 transition-colors flex items-center gap-2.5">
                          <Crown size={14} className="text-rose-500" />
                          {i18n.t('chat.noShowReport')}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Auto-translate bar */}
        <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setAutoTranslate(v => !v)} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-extrabold transition-all shadow-sm ${autoTranslate ? "bg-indigo-500 text-white border-transparent" : "bg-card border border-border text-foreground"}`}>
            <Languages size={12} />{i18n.t('chat.autoTranslate')} {autoTranslate ? "ON" : "OFF"}
          </motion.button>
          <div className="relative">
            <button onClick={() => setShowLangPicker(v => !v)} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-card text-[11px] font-extrabold text-foreground border border-border shadow-sm">
              {LANG_NAMES[targetLang]}
              <ChevronDown size={12} className="text-muted-foreground" />
            </button>
            <AnimatePresence>
              {showLangPicker && (
                <motion.div className="absolute left-0 top-9 bg-card/95 backdrop-blur-md border border-border/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-1.5 z-50 min-w-[150px] overflow-hidden" initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }}>
                  <div className="fixed inset-0 z-[-1]" onClick={() => setShowLangPicker(false)} />
                  {(Object.entries(LANG_NAMES) as [SupportedLang, string][]).map(([code, name]) => (
                    <button key={code} onClick={() => { setTargetLang(code); setShowLangPicker(false); }} className={`w-full text-left px-4 py-2.5 text-[13px] rounded-2xl transition-colors ${targetLang === code ? "bg-indigo-500/10 text-indigo-500 font-extrabold" : "text-foreground font-semibold hover:bg-muted"}`}>
                      {name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, idx) => {
          const isMe = msg.sender === "me";
          const isLastMine = isMe && messages.slice(idx + 1).every(m => m.sender !== "me");
          const translated = translateMap[msg.id];
          const isTranslating = loadingMap[msg.id];
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"} gap-1`}>
              <div className={`max-w-[78%] px-4 py-3 text-[14.5px] leading-relaxed whitespace-pre-line shadow-sm border border-black/5 dark:border-white/5 ${isMe ? "bg-primary text-primary-foreground rounded-[22px] rounded-br-[4px]" : "bg-card text-foreground rounded-[22px] rounded-bl-[4px]"}`}>
                {msg.text.startsWith(i18n.t("auto.g_1378", "현재위치공")) ? (
                  <div className="flex gap-3.5 items-center">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-blue-500/15">
                      <MapPin size={22} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-blue-500 mb-0.5 tracking-wider uppercase truncate">{i18n.t('chat.myCurrentLocation')}</p>
                      <p className="text-[14px] font-extrabold text-foreground mb-1 line-clamp-1">{msg.text.split('\n')[1] || i18n.t('chat.locationUnknown')}</p>
                      <a href={msg.text.split('\n')[2] || "#"} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-blue-500 hover:text-blue-600 transition-colors underline underline-offset-2">{i18n.t('chat.openMap')}</a>
                    </div>
                  </div>
                ) : msg.text.startsWith(i18n.t("auto.g_1379", "만남제안4")) ? (
                  <div className="flex gap-3.5 items-center">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-orange-500/15">
                      <Calendar size={22} className="text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-orange-500 mb-0.5 tracking-wider uppercase truncate">{i18n.t('chat.meetProposal')}</p>
                      <p className="text-[14px] font-extrabold text-foreground mb-1 truncate">{msg.text.split('\n')[1]?.replace(i18n.t("auto.g_1380", "날짜"), '') || ""}</p>
                      <p className="text-[12px] font-semibold text-muted-foreground truncate">{msg.text.split('\n')[2]?.replace(i18n.t("auto.g_1381", "장소"), '') || ""}</p>
                    </div>
                  </div>
                ) : msg.text.startsWith(i18n.t("auto.g_1382", "여행일정공")) ? (
                  <div className="flex gap-3.5 items-start">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-green-500/15 mt-1">
                      <Map size={22} className="text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-black text-green-500 mb-0.5 tracking-wider uppercase truncate">{i18n.t('chat.ourSchedule')}</p>
                      <p className="text-[12px] font-extrabold text-foreground mb-1.5 bg-foreground/5 inline-block px-2 py-0.5 rounded-lg text-left truncate">{msg.text.split('\n')[1]?.replace(i18n.t("auto.g_1383", "일시"), '')}</p>
                      <p className="text-[14px] font-medium text-foreground text-left truncate">{msg.text.split('\n').slice(2).join('\n').replace(i18n.t("auto.g_1384", "내용"), '')}</p>
                    </div>
                  </div>
                ) : <span className="font-medium tracking-tight break-words">{msg.text}</span>}
                
                <div className={`flex items-center ${isMe ? "justify-end" : "justify-start"} gap-1.5 mt-2`}>
                  <span className={`text-[10px] font-bold ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{msg.time}</span>
                  {isMe && canReadReceipts && (
                    <span className={`text-[10px] font-black flex items-center gap-0.5 ${isLastMine ? "text-primary-foreground/50" : "text-emerald-300"}`}>
                      <Check size={10} strokeWidth={3} />
                      <Check size={10} strokeWidth={3} className="-ml-2" />
                      {!isLastMine && <span className="text-[9px] drop-shadow-sm ml-0.5 tracking-tight truncate">{i18n.t('chat.read')}</span>}
                    </span>
                  )}
                </div>
              </div>

              {/* Translate button */}
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleTranslate(msg.id, msg.text)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold transition-all mt-1 ${translated ? "bg-indigo-500 text-white shadow-sm" : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"}`}>
                {isTranslating ? <motion.div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} /> : <Languages size={12} />}
                {isTranslating ? i18n.t('chat.translating') : translated ? i18n.t('chat.viewOriginal') : `${i18n.t('chat.translate')} (${LANG_NAMES[targetLang]})`}
              </motion.button>

              {/* Translated result */}
              <AnimatePresence>
                {translated && (
                  <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} className={`max-w-[78%] px-4 py-3 text-[14.5px] leading-relaxed shadow-sm border ${isMe ? "rounded-[22px] rounded-br-[4px]" : "rounded-[22px] rounded-bl-[4px]"}`} style={{ background: "rgba(99,102,241,0.06)", borderColor: "rgba(99,102,241,0.15)", color: "var(--foreground)" }}>
                    <div className="flex items-center gap-1.5 mb-1.5 opacity-80">
                      <Languages size={12} className="text-indigo-500" />
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{LANG_NAMES[targetLang]}</span>
                    </div>
                    <span className="font-medium tracking-tight break-words">{translated}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Locked overlay */}
      {isLocked && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-4 mb-2 p-4 rounded-3xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/30 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <Lock size={18} className="text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-extrabold text-foreground truncate">{i18n.t('chat.dailyLimitTitle')}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{i18n.t('chat.dailyLimitDesc')}</p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowPlusModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-extrabold shadow-lg shrink-0">
            <Crown size={12} /> Plus
          </motion.button>
        </motion.div>
      )}

      {/* Quick actions */}
      <div className="flex gap-2 px-4 pb-2 overflow-x-auto scrollbar-hide">
        <button onClick={handleShareLocation} className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground transition-colors hover:bg-border active:scale-95">
          <MapPin size={12} />{i18n.t('chat.shareLocation')}
        </button>
        <button onClick={() => setShowMeetProposal(true)} className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground transition-colors hover:bg-border active:scale-95">
          <Calendar size={12} />{i18n.t('chat.meetProposalBtn')}
        </button>
        <button onClick={() => setShowScheduleModal(true)} className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground transition-colors hover:bg-border active:scale-95">
          <Map size={12} />{i18n.t('chat.scheduleShareBtn')}
        </button>
      </div>

      {/* Floating Input Area */}
      <div className="px-3 pb-safe pt-2 mb-3 bg-gradient-to-t from-background via-background to-transparent relative z-20">
        <div className={`flex flex-col gap-2 rounded-[28px] px-2 py-2 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-border bg-card/90 backdrop-blur-xl ${isLocked ? "opacity-70" : ""}`}>
          <div className={`flex items-center gap-2 px-2`}>
            <input type="text" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) sendMessage(); }} placeholder={isLocked ? i18n.t('chat.lockedPlaceholder') : isMuted ? i18n.t('chat.inputMuted') : i18n.t('chat.input')} disabled={isLocked} className="flex-1 min-w-0 bg-transparent text-[15px] font-medium text-foreground placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed px-2 py-2.5" />
            {/* 번역해서 보내기 */}
            {!isLocked && message.trim() && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleTranslateSend}
                disabled={translateSending}
                title={isPlus ? `번역해서 보내기 (${LANG_NAMES[targetLang]})` : `번역해서 보내기 (무료 ${Math.max(0, FREE_DAILY_TRANSLATE_SEND - getTranslateSendCount())}회 남음)`}
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  translateSending
                    ? 'bg-indigo-400/30 text-indigo-400'
                    : isPlus
                      ? 'bg-indigo-500 text-white shadow-md'
                      : getTranslateSendCount() >= FREE_DAILY_TRANSLATE_SEND
                        ? 'bg-muted text-muted-foreground opacity-50'
                        : 'bg-indigo-500/15 border border-indigo-500/40 text-indigo-500'
                }`}
              >
                {translateSending
                  ? <motion.div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} />
                  : <Globe size={15} />
                }
              </motion.button>
            )}
            {isLocked ? (
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowPlusModal(true)} className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shrink-0">
                <Crown size={18} className="text-white drop-shadow-sm" />
              </motion.button>
            ) : (
              <button onClick={sendMessage} disabled={!message.trim()} className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center transition-transform active:scale-90 disabled:opacity-30 shrink-0">
                <Send size={18} className="text-white ml-0.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <MeetProposalModal showMeetProposal={showMeetProposal} setShowMeetProposal={setShowMeetProposal} meetDate={meetDate} setMeetDate={setMeetDate} meetPlace={meetPlace} setMeetPlace={setMeetPlace} handleMeetProposal={handleMeetProposal} />
      <ScheduleShareModal showScheduleModal={showScheduleModal} setShowScheduleModal={setShowScheduleModal} scheduleDate={scheduleDate} setScheduleDate={setScheduleDate} scheduleText={scheduleText} setScheduleText={setScheduleText} handleScheduleShare={handleScheduleShare} />
      <ReportModal showReportModal={showReportModal} setShowReportModal={setShowReportModal} thread={thread} reportReason={reportReason} setReportReason={setReportReason} handleReport={handleReport} />
      <DeleteConfirmModal showDeleteConfirm={showDeleteConfirm} setShowDeleteConfirm={setShowDeleteConfirm} selectedChat={selectedChat} handleDeleteChat={handleDeleteChat} />
      <MigoPlusModal isOpen={showPlusModal} onClose={() => setShowPlusModal(false)} />
      <SOSModal 
        isOpen={showSOS} 
        onClose={() => {
          setShowSOS(false);
          if (thread?.opponentId || selectedChat) {
            setSelectedChat(null);
          }
        }} 
        targetUserId={thread?.opponentId}
        targetGroupId={selectedChat}
      />
      <ProfileDetailSheet profile={viewingProfile} onClose={() => setViewingProfile(null)} showActions={false} />
      <ReportBlockActionSheet isOpen={!!actionSheetTarget} onClose={() => setActionSheetTarget(null)} targetType={actionSheetTarget?.isGroup ? "group" : "user"} targetId={actionSheetTarget?.isGroup ? actionSheetTarget?.id : (actionSheetTarget?.opponentId ?? "")} targetName={actionSheetTarget?.name ?? ""} />
    </div>
  );
};
