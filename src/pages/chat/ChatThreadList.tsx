import i18n from "@/i18n";
import React from "react";
import { motion } from "framer-motion";
import { Lock, Users, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "@/hooks/use-toast";
import type { GroupThread } from "@/context/ChatContext";

export interface ChatThreadListProps {
  filteredThreads: any[];
  searchQuery: string;
  removedChats: string[];
  swipedChatId: string | null;
  setSwipedChatId: (id: string | null) => void;
  mutedChats: string[];
  canOpenChat: (id: string) => boolean;
  setShowPlusModal: (v: boolean) => void;
  setSelectedChat: (id: string | null) => void;
  handleDeleteChat: (id: string) => void;
  setShowReportModal: (v: boolean) => void;
  markRead: (id: string) => void;
}

export const ChatThreadList: React.FC<ChatThreadListProps> = ({
  filteredThreads,
  searchQuery,
  swipedChatId,
  setSwipedChatId,
  mutedChats,
  canOpenChat,
  setShowPlusModal,
  setSelectedChat,
  handleDeleteChat,
  setShowReportModal,
  markRead
}) => {
  const { t } = useTranslation();

  return (
    <div className="px-0 pb-28 pt-2 truncate">
      {filteredThreads.length === 0 ? (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex flex-col items-center text-center pt-20 pb-8 px-6"
        >
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-[32px] bg-muted/60 flex items-center justify-center shadow-inner border border-white/10">
              <MessageCircle size={36} className="text-muted-foreground/50" />
            </div>
          </div>
          <h3 className="text-lg font-extrabold text-foreground mb-1.5 tracking-tight truncate">
            {searchQuery ? i18n.t("auto.g_1389", "검색 결과 없음") : i18n.t("auto.g_1390", "아직 대화가 없어요")}
          </h3>
          <p className="text-[13px] font-medium text-muted-foreground mb-8 leading-relaxed max-w-[200px] truncate">
            {searchQuery
              ? i18n.t("auto.g_1391", "다른 키워드로 검색해보세요")
              : '마음에 드는 여행자에게\n먼저 인사를 건네보세요 ✈️'}
          </p>
          {!searchQuery && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { window.location.hash = '/'; }}
              className="px-6 py-3.5 rounded-full bg-foreground text-background font-bold text-[13px] shadow-md flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              {i18n.t("auto.g_1385", "여행자 둘러보기")}</motion.button>
          )}
        </motion.div>
      ) : (
        <div className="flex flex-col truncate">
          {filteredThreads.map((chat, idx, arr) => {
            const groupChat = chat as GroupThread;
            const isLocked = !canOpenChat(chat.id);
            const isLast = idx === arr.length - 1;
            
            return (
              <div key={chat.id} className="relative w-full overflow-hidden bg-background">
                {/* Underlay Left (Swipe Right actions) */}
                <div className="absolute inset-y-0 left-0 flex items-stretch">
                  <button onClick={() => { setSwipedChatId(null); handleDeleteChat(chat.id); }} className="px-5 bg-red-500 text-white font-extrabold text-[13px] flex items-center justify-center transition-opacity hover:opacity-90">{i18n.t("auto.g_1386", "나가기")}</button>
                  <button onClick={() => { setSwipedChatId(null); setSelectedChat(chat.id); setShowReportModal(true); }} className="px-5 bg-orange-500 text-white font-extrabold text-[13px] flex items-center justify-center transition-opacity hover:opacity-90">{i18n.t("auto.g_1387", "신고")}</button>
                </div>
                {/* Underlay Right (Swipe Left action feedback) */}
                <div className="absolute inset-y-0 right-0 flex items-stretch">
                  <div className="px-6 bg-emerald-500 text-white font-extrabold text-[13px] flex items-center justify-center truncate">{i18n.t("auto.g_1388", "읽음 처리")}</div>
                </div>

                <motion.div
                  drag="x"
                  dragDirectionLock
                  dragConstraints={{ left: 0, right: swipedChatId === chat.id ? 140 : 0 }}
                  animate={{ x: swipedChatId === chat.id ? 140 : 0 }}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "100px" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  onDragEnd={(e, info) => {
                    if (swipedChatId === chat.id) {
                      if (info.offset.x < -30) setSwipedChatId(null);
                    } else {
                      if (info.offset.x > 50) {
                        setSwipedChatId(chat.id);
                      } else if (info.offset.x < -50) {
                        markRead(chat.id);
                        toast({ title: i18n.t("auto.g_0051", "읽음 처리되었습니다.") });
                        setSwipedChatId(null);
                      }
                    }
                  }}
                  className="relative z-10 w-full"
                >
                  <button
                    onClick={() => {
                      if (swipedChatId === chat.id) setSwipedChatId(null);
                      else {
                        if (isLocked) { setShowPlusModal(true); return; }
                        setSelectedChat(chat.id);
                      }
                    }}
                    className={`w-full flex items-center gap-4 px-5 py-3 transition-colors active:bg-muted/50 bg-background ${swipedChatId === chat.id ? 'shadow-[4px_0_15px_rgba(0,0,0,0.1)] rounded-xl' : ''} ${isLocked ? 'opacity-60' : ''}`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0 py-1">
                      {groupChat.isGroup && groupChat.memberPhotos && groupChat.memberPhotos.length >= 2 ? (
                        <div className="w-[52px] h-[52px] relative">
                          <img src={groupChat.memberPhotos[0]} alt="" className="w-9 h-9 rounded-full object-cover absolute top-0 left-0 border-2 border-background shadow-sm" loading="lazy" />
                          <img src={groupChat.memberPhotos[1]} alt="" className="w-9 h-9 rounded-full object-cover absolute bottom-0 right-0 border-2 border-background shadow-sm" loading="lazy" />
                        </div>
                      ) : chat.photo ? (
                        <img src={chat.photo} alt="" className="w-[52px] h-[52px] rounded-full object-cover shadow-sm border border-border/30" loading="lazy" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="w-[52px] h-[52px] rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xl font-extrabold shadow-sm">
                          {chat.name?.[0] ?? "?"}
                        </div>
                      )}
                      {/* Online indicator */}
                      {!groupChat.isGroup && chat.online && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background" />
                      )}
                      {/* Group badge */}
                      {groupChat.isGroup && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                          <Users size={10} className="text-white" />
                        </div>
                      )}
                      {/* Muted badge */}
                      {mutedChats.includes(chat.id) && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-background border border-border flex items-center justify-center">
                          <span className="text-[7px]">🔕</span>
                        </div>
                      )}
                    </div>

                    {/* Content wrapped with border-b for seamless list */}
                    <div className={`flex-1 min-w-0 text-left py-3 flex items-center gap-2 ${!isLast && swipedChatId !== chat.id ? 'border-b border-border/40' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-extrabold text-[15px] text-foreground truncate">{chat.name}</span>
                            {groupChat.isGroup && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground shrink-0 leading-none">
                                {groupChat.memberCount}
                              </span>
                            )}
                          </div>
                          <span className={`text-[11px] font-bold shrink-0 ${chat.unread > 0 ? "text-primary" : "text-muted-foreground/60"}`}>{chat.time}</span>
                        </div>
                        <p className={`text-[13px] truncate leading-tight ${chat.unread > 0 ? "font-bold text-foreground" : "font-medium text-muted-foreground line-clamp-2 white-space-normal"}`}>
                          {isLocked ? i18n.t("auto.g_1392", "🔒 수신된 메시지가 있습니다. Plus로 확인하세요") : chat.lastMessage}
                        </p>
                      </div>

                      {/* Right badge */}
                      {chat.unread > 0 && !isLocked ? (
                        <div className="min-w-[22px] h-[22px] rounded-full bg-primary flex items-center justify-center shrink-0 px-1.5 shadow-sm transform transition-transform animate-in zoom-in">
                          <span className="text-[10px] font-black text-white">{chat.unread > 99 ? '99+' : chat.unread}</span>
                        </div>
                      ) : isLocked ? (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-md flex items-center justify-center shrink-0 mt-2">
                          <Lock size={12} className="text-white shrink-0 drop-shadow-sm" />
                        </div>
                      ) : null}
                    </div>
                  </button>
                </motion.div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
