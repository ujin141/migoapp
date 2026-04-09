import i18n from "@/i18n";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Map, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { GroupThread } from "@/context/ChatContext"; // assuming `thread` is GroupThread or any

export const MeetProposalModal = ({
  showMeetProposal,
  setShowMeetProposal,
  meetDate,
  setMeetDate,
  meetPlace,
  setMeetPlace,
  handleMeetProposal
}: {
  showMeetProposal: boolean;
  setShowMeetProposal: (v: boolean) => void;
  meetDate: string;
  setMeetDate: (v: string) => void;
  meetPlace: string;
  setMeetPlace: (v: string) => void;
  handleMeetProposal: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {showMeetProposal && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center px-safe pb-safe pt-safe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowMeetProposal(false)} />
          <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 p-6 pb-20 shadow-float" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-foreground truncate">{i18n.t('chat.meetProposal')}</h3>
              <button onClick={() => setShowMeetProposal(false)}><X size={20} className="text-muted-foreground" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">{i18n.t('chat.meetDate')}</label>
                <input type="date" value={meetDate} onChange={e => setMeetDate(e.target.value)} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">{i18n.t('chat.meetPlace')}</label>
                <input type="text" value={meetPlace} onChange={e => setMeetPlace(e.target.value)} placeholder={i18n.t('chat.meetPlaceholder')} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <button onClick={handleMeetProposal} className="w-full py-3.5 rounded-2xl gradient-primary text-primary-foreground font-semibold text-sm shadow-card flex items-center justify-center gap-2 mt-2">
                <Check size={16} />{i18n.t('chat.meetSend')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const ScheduleShareModal = ({
  showScheduleModal,
  setShowScheduleModal,
  scheduleDate,
  setScheduleDate,
  scheduleText,
  setScheduleText,
  handleScheduleShare
}: {
  showScheduleModal: boolean;
  setShowScheduleModal: (v: boolean) => void;
  scheduleDate: string;
  setScheduleDate: (v: string) => void;
  scheduleText: string;
  setScheduleText: (v: string) => void;
  handleScheduleShare: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {showScheduleModal && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center px-safe pb-safe pt-safe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowScheduleModal(false)} />
          <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 p-6 pb-20 shadow-float" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2 truncate"><Map size={20} className="text-green-500" />{i18n.t('chat.scheduleShare')}</h3>
              <button onClick={() => setShowScheduleModal(false)}><X size={20} className="text-muted-foreground" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">{i18n.t('chat.scheduleWhen')}</label>
                <input type="text" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} placeholder={i18n.t('chat.scheduleDatePlaceholder')} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-green-500/30" />
              </div>
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">{i18n.t('chat.scheduleWhat')}</label>
                <textarea value={scheduleText} onChange={e => setScheduleText(e.target.value)} placeholder={i18n.t('chat.scheduleContentPlaceholder')} className="w-full h-32 resize-none bg-muted rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-green-500/30" />
              </div>
              <button onClick={handleScheduleShare} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold text-sm shadow-card flex items-center justify-center gap-2 mt-2">
                <Check size={16} />{i18n.t('chat.scheduleShareBtn')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const ReportModal = ({
  showReportModal,
  setShowReportModal,
  thread,
  reportReason,
  setReportReason,
  handleReport
}: {
  showReportModal: boolean;
  setShowReportModal: (v: boolean) => void;
  thread: any;
  reportReason: string;
  setReportReason: (v: string) => void;
  handleReport: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {showReportModal && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-foreground/60 backdrop-blur-md" onClick={() => setShowReportModal(false)} />
          <motion.div className="relative z-10 w-full max-w-sm bg-card rounded-3xl p-6 shadow-float" initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }} transition={{ type: "spring", damping: 20 }}>
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-extrabold text-foreground text-center mb-1 truncate">{i18n.t("auto.g_1367", "신고하기")}</h3>
            <p className="text-sm text-muted-foreground text-center mb-4 truncate">{thread?.name}{i18n.t("auto.g_1368", "님을 신고합니다")}</p>
            <div className="space-y-2 mb-4 truncate">
              {[i18n.t("auto.g_1373", "부적절한 언어"), i18n.t("auto.g_1374", "스팸/광고"), i18n.t("auto.g_1375", "허위 프로필"), i18n.t("auto.g_1376", "불쾌한 내용"), i18n.t("auto.g_1377", "기타")].map(reason => (
                <button key={reason} onClick={() => setReportReason(reason)} className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${reportReason === reason ? "bg-red-500/10 text-red-500 border border-red-500/30" : "bg-muted text-foreground"}`}>
                  {reason}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowReportModal(false)} className="flex-1 py-3 rounded-2xl border border-border text-foreground font-semibold text-sm">{i18n.t('common.cancel')}</button>
              <button onClick={handleReport} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm">{i18n.t("auto.g_1369", "신고")}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const DeleteConfirmModal = ({
  showDeleteConfirm,
  setShowDeleteConfirm,
  selectedChat,
  handleDeleteChat
}: {
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (v: boolean) => void;
  selectedChat: string | null;
  handleDeleteChat: (chatId: string) => void;
}) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {showDeleteConfirm && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-foreground/60 backdrop-blur-md" onClick={() => setShowDeleteConfirm(false)} />
          <motion.div className="relative z-10 w-full max-w-sm bg-card rounded-3xl p-6 shadow-float text-center" initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }} transition={{ type: "spring", damping: 20 }}>
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <X size={24} className="text-destructive" />
            </div>
            <h3 className="text-lg font-extrabold text-foreground mb-2 truncate">{i18n.t("auto.g_1370", "대화를 삭제하시겠습니까?")}</h3>
            <p className="text-sm text-muted-foreground mb-6 truncate">{i18n.t("auto.g_1371", "삭제된 대화는 복구할 수 없습니다.")}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-2xl border border-border text-foreground font-semibold text-sm">{i18n.t('common.cancel')}</button>
              <button onClick={() => selectedChat && handleDeleteChat(selectedChat)} className="flex-1 py-3 rounded-2xl bg-destructive text-white font-bold text-sm">{i18n.t("auto.g_1372", "삭제")}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
