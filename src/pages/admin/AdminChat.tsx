import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Users, Plane, RefreshCw, Eye, Power, PowerOff, Clock, ChevronRight } from "lucide-react";
import { fetchAdminChatRooms, fetchAdminMessages, deactivateChatRoom } from "@/lib/adminService";
import { useTranslation } from "react-i18next";

export const AdminChat = () => {
  const { t } = useTranslation();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const load = async () => {
    setLoading(true);
    const data = await fetchAdminChatRooms();
    setRooms(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleViewMessages = async (room: any) => {
    setSelectedRoom(room);
    setMsgLoading(true);
    const data = await fetchAdminMessages(room.id);
    setMessages(data);
    setMsgLoading(false);
  };

  const handleDeactivate = async (roomId: string) => {
    if (!confirm(t("admin.deactivateRoomConfirm", "이 채팅방을 비활성화하시겠습니까?"))) return;
    const ok = await deactivateChatRoom(roomId);
    if (ok) {
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, is_active: false } : r));
      if (selectedRoom?.id === roomId) setSelectedRoom((p: any) => ({ ...p, is_active: false }));
    }
  };

  const filtered = rooms.filter(r => {
    if (filter === "active") return r.is_active !== false;
    if (filter === "inactive") return r.is_active === false;
    return true;
  });

  const activeCount = rooms.filter(r => r.is_active !== false).length;
  const totalMembers = rooms.reduce((s, r) => s + (r.member_count || 0), 0);

  return (
    <div className="flex gap-6 h-full">
      {/* Left Panel — Room List */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
              <MessageSquare size={22} className="text-blue-400" /> {t("admin.chatMonitor", "채팅방 모니터링")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{t("admin.chatMonitorDesc", "활성 여행 그룹 채팅방을 관리합니다")}</p>
          </div>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-muted-foreground text-sm hover:text-foreground transition-colors">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> {t("admin.refresh", "새로고침")}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: t("admin.allRooms", "전체 채팅방"), value: rooms.length, icon: MessageSquare, color: "from-violet-500 to-purple-600" },
            { label: t("admin.activeRooms", "활성 채팅방"), value: activeCount, icon: Power, color: "from-emerald-500 to-green-500" },
            { label: t("admin.totalMembers", "전체 참여자"), value: totalMembers, icon: Users, color: "from-blue-500 to-cyan-500" },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0`}>
                <s.icon size={16} className="text-white" />
              </div>
              <div>
                <p className="text-xl font-extrabold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {[{ id: "all" as const, label: t("admin.all", "전체") }, { id: "active" as const, label: t("admin.active", "활성") }, { id: "inactive" as const, label: t("admin.inactive", "비활성") }].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Room List */}
        {loading ? (
          <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            {filtered.map(room => {
              const createdBy = Array.isArray(room.profiles) ? room.profiles[0] : room.profiles;
              const creatorName = createdBy?.name || t("admin.unknown", "알 수 없음");
              const isActive = room.is_active !== false;
              const timeAgo = new Date(room.created_at);
              const daysAgo = Math.floor((Date.now() - timeAgo.getTime()) / 86400000);

              return (
                <motion.div key={room.id} layout
                  className={`bg-card rounded-2xl border p-4 transition-all ${selectedRoom?.id === room.id ? "border-primary/50" : "border-border"} ${!isActive ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActive ? "bg-blue-500/10" : "bg-muted"}`}>
                      <Plane size={16} className={isActive ? "text-blue-400" : "text-muted-foreground"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground text-sm truncate">{room.title || t("admin.noTitle", "제목 없음")}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                          {isActive ? t("admin.active", "활성") : t("admin.inactive", "비활성")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><Users size={10} />{room.member_count || 0}/{room.max_members || "∞"}{t("admin.persons", "명")}</span>
                        <span>{t("admin.creator", "개설자:")} {creatorName}</span>
                        <span className="flex items-center gap-1"><Clock size={10} />{daysAgo === 0 ? t("admin.today", "오늘") : t("admin.daysAgoFormat", { days: daysAgo, defaultValue: `${daysAgo}일 전` })}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => handleViewMessages(room)}
                        className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors" title={t("admin.viewMsg", "메시지 보기")}>
                        <Eye size={14} />
                      </button>
                      {isActive && (
                        <button onClick={() => handleDeactivate(room.id)}
                          className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title={t("admin.deactivateRoom", "채팅방 비활성화")}>
                          <PowerOff size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-20 text-center text-sm text-muted-foreground">{t("admin.noRooms", "채팅방이 없습니다")}</div>
            )}
          </div>
        )}
      </div>

      {/* Right Panel — Message Viewer */}
      <AnimatePresence>
        {selectedRoom && (
          <motion.div
            className="w-96 shrink-0 bg-card border border-border rounded-3xl flex flex-col overflow-hidden shadow-float"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <p className="font-extrabold text-foreground text-sm truncate">{selectedRoom.title}</p>
                <p className="text-xs text-muted-foreground">{selectedRoom.member_count || 0}{t("admin.memberJoined", "명 참여")}</p>
              </div>
              <button onClick={() => setSelectedRoom(null)}
                className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {msgLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">{t("admin.noMsg", "메시지가 없습니다")}</div>
              ) : (
                [...messages].reverse().map(msg => {
                  const sender = Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles;
                  return (
                    <div key={msg.id} className="flex items-start gap-2">
                      {sender?.photo_url ? (
                        <img src={sender.photo_url} className="w-7 h-7 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Users size={12} className="text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground mb-0.5">{sender?.name || t("admin.unknown", "알 수 없음")}</p>
                        <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2 text-xs text-foreground break-words">{msg.content}</div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(msg.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminChat;
