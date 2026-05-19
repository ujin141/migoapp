import { AnimatePresence, motion } from "framer-motion";
import { Heart, MessageCircle, Plane, MapPin, Calendar, Users, Handshake, Star, X, ChevronLeft, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export const MatchDetailModal = ({ showMatchDetail, setShowMatchDetail, matchedUsers }: any) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  // 매칭된 상대와 채팅방 열기 (matches 테이블에서 thread_id 조회)
  const openChat = async (partnerId: string) => {
    if (!user) return;
    setChatLoading(true);
    try {
      // matches 테이블에서 thread_id 조회 (양방향)
      const [u1, u2] = [user.id, partnerId].sort();
      const { data: match } = await supabase
        .from('matches')
        .select('thread_id')
        .eq('user1_id', u1)
        .eq('user2_id', u2)
        .maybeSingle();

      if (match?.thread_id) {
        setSelectedUser(null);
        setShowMatchDetail(false);
        navigate('/chat', { state: { threadId: match.thread_id } });
      } else {
        // fallback: chat_members에서 공통 1:1 thread 찾기
        const { data: myThreads } = await supabase
          .from('chat_members').select('thread_id').eq('user_id', user.id);
        const myIds = (myThreads || []).map((m: any) => m.thread_id);
        if (myIds.length > 0) {
          const { data: shared } = await supabase
            .from('chat_members').select('thread_id').eq('user_id', partnerId).in('thread_id', myIds);
          if (shared && shared.length > 0) {
            const { data: thread } = await supabase
              .from('chat_threads').select('id').in('id', shared.map((s: any) => s.thread_id))
              .eq('is_group', false).maybeSingle();
            if (thread) {
              setSelectedUser(null);
              setShowMatchDetail(false);
              navigate('/chat', { state: { threadId: thread.id } });
              return;
            }
          }
        }
        toast({ title: t('profile.chatNotFound', '채팅방을 찾을 수 없습니다'), variant: 'destructive' });
      }
    } catch {
      toast({ title: t('auto.g_0046', '채팅 시작 실패'), variant: 'destructive' });
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {showMatchDetail && <motion.div className="fixed inset-0 z-[60] flex items-end justify-center px-safe pb-safe pt-safe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => { setSelectedUser(null); setShowMatchDetail(false); }} />
          <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 shadow-float max-h-[80vh] overflow-y-auto" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}>
            <div className="px-5 pt-4 pb-20">
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Heart size={18} className="text-primary" />
                  <h3 className="text-lg font-extrabold text-foreground truncate">{t("profile.matchList")}</h3>
                </div>
                <span className="text-sm text-muted-foreground font-medium truncate">{t("profile.userCount", { count: matchedUsers.length })}</span>
              </div>
              <div className="space-y-3">
                {matchedUsers.length === 0 && <p className="text-xs text-muted-foreground text-center py-6 truncate">{t("profile.noMatches")}</p>}
                {matchedUsers.map((u: any) => (
                  <motion.div
                    key={u.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedUser(u)}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-muted cursor-pointer active:opacity-80 transition-all border border-transparent hover:border-primary/20"
                  >
                    {/* 프로필 사진 — 매칭된 유저는 블러 없이 선명하게 */}
                    <div className="relative shrink-0">
                      {u.photo ? (
                        <img src={u.photo} alt="" className="w-14 h-14 rounded-2xl object-cover shadow-sm ring-2 ring-primary/20" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center">
                          <span className="text-white font-extrabold text-xl">{u.name?.[0] ?? '?'}</span>
                        </div>
                      )}
                      {/* 매칭 표시 뱃지 */}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary border-2 border-card flex items-center justify-center">
                        <Heart size={9} className="text-white" fill="white" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-foreground">{u.name}</p>
                        <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-[9px] font-bold text-primary">{t("profile.matchBadge", "매칭")}</span>
                      </div>
                      {u.location && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin size={9} className="text-muted-foreground shrink-0" />
                          <p className="text-[11px] text-muted-foreground truncate">{u.location}</p>
                        </div>
                      )}
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {(u.tags || []).map((tag: string) => (
                          <span key={tag} className="px-2 py-0.5 rounded-full bg-card text-[9px] font-semibold text-muted-foreground">{tag}</span>
                        ))}
                      </div>
                    </div>

                    {/* 채팅 버튼 */}
                    <button
                      onClick={(e) => { e.stopPropagation(); openChat(u.id); }}
                      disabled={chatLoading}
                      className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center active:scale-90 transition-transform shadow-md shrink-0"
                    >
                      <MessageCircle size={16} className="text-primary-foreground" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>}

      {/* ── 매칭 유저 프로필 상세 뷰 ── */}
      {selectedUser && (
        <motion.div
          className="fixed inset-0 z-[70] flex flex-col bg-background"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        >
          {/* 상단 헤더 */}
          <div className="flex items-center justify-between px-4 pt-safe pb-3 border-b border-border/40 bg-card/80 backdrop-blur-lg">
            <button
              onClick={() => setSelectedUser(null)}
              className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center active:scale-90 transition-transform"
            >
              <ChevronLeft size={20} className="text-foreground" />
            </button>
            <div className="flex items-center gap-1.5">
              <Heart size={13} className="text-primary" fill="currentColor" />
              <span className="text-sm font-extrabold text-foreground">{t('profile.matched', '매칭됨')}</span>
            </div>
            <button
              onClick={() => { setSelectedUser(null); setShowMatchDetail(false); }}
              className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center active:scale-90 transition-transform"
            >
              <X size={18} className="text-foreground" />
            </button>
          </div>

          {/* 프로필 콘텐츠 */}
          <div className="flex-1 overflow-y-auto">
            {/* 대형 프로필 사진 — 블러 없음 */}
            <div className="relative w-full aspect-square max-h-[55vw] bg-muted overflow-hidden">
              {selectedUser.photo ? (
                <img src={selectedUser.photo} alt={selectedUser.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-primary flex items-center justify-center">
                  <span className="text-white font-black text-7xl">{selectedUser.name?.[0] ?? '?'}</span>
                </div>
              )}
              {/* 그라데이션 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4">
                <h2 className="text-2xl font-black text-white drop-shadow-lg">{selectedUser.name}</h2>
                {selectedUser.location && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin size={12} className="text-white/80" />
                    <span className="text-sm text-white/80 font-semibold">{selectedUser.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 정보 섹션 */}
            <div className="px-5 py-4 space-y-4">
              {/* 매칭 배지 */}
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-primary/8 border border-primary/20">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                  <Heart size={16} className="text-primary" fill="currentColor" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-primary">{t('profile.matchedLabel', '💘 서로 좋아요!')}</p>
                  <p className="text-[11px] text-muted-foreground">{t('profile.matchedDesc', '대화를 시작해보세요')}</p>
                </div>
              </div>

              {/* 태그 */}
              {selectedUser.tags && selectedUser.tags.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">{t('profile.interests', '관심사')}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.tags.map((tag: string) => (
                      <span key={tag} className="px-3 py-1.5 rounded-full bg-muted text-xs font-semibold text-foreground">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* 매칭 날짜 */}
              {selectedUser.date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar size={14} />
                  <span>{t('profile.matchedOn', '매칭일')}: {selectedUser.date}</span>
                </div>
              )}
            </div>
          </div>

          {/* 하단 채팅 버튼 */}
          <div className="px-5 py-4 border-t border-border/40 bg-card/80 backdrop-blur-lg" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => openChat(selectedUser.id)}
              disabled={chatLoading}
              className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-sm shadow-float flex items-center justify-center gap-2"
            >
              {chatLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={16} />
                  {t('profile.startChat', '대화 시작하기')}
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


export const TripDetailModal = ({ showTripDetail, setShowTripDetail, myTrips }: any) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {showTripDetail && <motion.div className="fixed inset-0 z-[60] flex items-end justify-center px-safe pb-safe pt-safe" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }}>
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowTripDetail(false)} />
          <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 shadow-float max-h-[80vh] overflow-y-auto" initial={{
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
            <div className="px-5 pt-4 pb-20">
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Plane size={18} className="text-primary" />
                  <h3 className="text-lg font-extrabold text-foreground truncate">{t("profile.myTrips")}</h3>
                </div>
                <span className="text-sm text-muted-foreground font-medium truncate">{t("profile.tripCount", {
                count: myTrips.length
              })}</span>
              </div>
              <div className="space-y-3">
                {myTrips.map((trip: any) => <div key={trip.id} className="flex items-center gap-3 p-3 rounded-2xl bg-muted">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl shrink-0 truncate">
                      {trip.title.split(' ')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{trip.title}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={10} className="text-primary" />
                        <p className="text-[11px] text-muted-foreground">{trip.destination}</p>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Calendar size={10} className="text-primary" />
                        <p className="text-[11px] text-muted-foreground">{trip.dates}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${trip.status === t("profile.statusOngoing") ? "bg-primary/10 text-primary" : trip.status === t("profile.statusUpcoming") ? "bg-accent/20 text-accent-foreground" : "bg-muted-foreground/10 text-muted-foreground"}`}>{trip.status}</span>
                      <div className="flex items-center gap-1">
                        <Users size={10} className="text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground truncate">{t("profile.memberCount", {
                      count: trip.members
                    })}</span>
                      </div>
                    </div>
                  </div>)}
              </div>
            </div>
          </motion.div>
        </motion.div>}
    </AnimatePresence>
  );
};

export const MeetingDetailModal = ({ showMeetingDetail, setShowMeetingDetail, myMeetings }: any) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {showMeetingDetail && <motion.div className="fixed inset-0 z-[60] flex items-end justify-center px-safe pb-safe pt-safe" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }}>
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowMeetingDetail(false)} />
          <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 shadow-float max-h-[80vh] overflow-y-auto" initial={{
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
            <div className="px-5 pt-4 pb-20">
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Handshake size={18} className="text-primary" />
                  <h3 className="text-lg font-extrabold text-foreground truncate">{t("profilePage.meetingsTitle")}</h3>
                </div>
                <span className="text-sm text-muted-foreground font-medium truncate">{t("profile.meetingCount", {
                count: myMeetings.length
              })}</span>
              </div>
              <div className="space-y-3">
                {myMeetings.map((meet: any) => <div key={meet.id} className="flex items-center gap-3 p-3 rounded-2xl bg-muted">
                    {meet.photo ? <img src={meet.photo} alt="" className="w-12 h-12 rounded-2xl object-cover" /> : <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
                        <span className="text-white font-extrabold text-lg">{meet.name?.[0] ?? '?'}</span>
                      </div>}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground">{meet.name}</p>
                        <span className="px-1.5 py-0.5 rounded-full bg-card text-[9px] font-semibold text-muted-foreground">{meet.type}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={10} className="text-primary" />
                        <p className="text-[11px] text-muted-foreground truncate">{meet.place}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{meet.date}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex truncate">
                        {Array.from({
                    length: 5
                  }).map((_, i) => <Star key={i} size={10} className={i < meet.rating ? "text-accent" : "text-border"} fill={i < meet.rating ? "currentColor" : "none"} />)}
                      </div>
                      <span className="text-[9px] text-muted-foreground">{meet.rating}.0 / 5.0</span>
                    </div>
                  </div>)}
              </div>
            </div>
          </motion.div>
        </motion.div>}
    </AnimatePresence>
  );
};
