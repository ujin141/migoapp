import { AnimatePresence, motion } from "framer-motion";
import { Heart, MessageCircle, Plane, MapPin, Calendar, Users, Handshake, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export const MatchDetailModal = ({ showMatchDetail, setShowMatchDetail, matchedUsers }: any) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {showMatchDetail && <motion.div className="fixed inset-0 z-[60] flex items-end justify-center px-safe pb-safe pt-safe" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }}>
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowMatchDetail(false)} />
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
                  <Heart size={18} className="text-primary" />
                  <h3 className="text-lg font-extrabold text-foreground truncate">{t("profile.matchList")}</h3>
                </div>
                <span className="text-sm text-muted-foreground font-medium truncate">{t("profile.userCount", {
                count: matchedUsers.length
              })}</span>
              </div>
              <div className="space-y-3 truncate">
                {matchedUsers.length === 0 && <p className="text-xs text-muted-foreground text-center py-6 truncate">{t("profile.noMatches")}</p>}
                {matchedUsers.map((u: any) => <div key={u.id} className="flex items-center gap-3 p-3 rounded-2xl bg-muted">
                    <div className="relative">
                      {u.photo ? <img src={u.photo} alt="" className="w-12 h-12 rounded-2xl object-cover" /> : <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
                          <span className="text-white font-extrabold text-lg">{u.name?.[0] ?? '?'}</span>
                        </div>}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${u.matched ? "bg-primary" : "bg-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 truncate">
                        <p className="text-sm font-bold text-foreground">{u.name}</p>
                        {u.matched && <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-[9px] font-bold text-primary truncate">{t("profile.matchBadge")}</span>}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{u.location}</p>
                      <div className="flex gap-1 mt-1">
                        {u.tags.map((tag: string) => <span key={tag} className="px-2 py-0.5 rounded-full bg-card text-[9px] font-semibold text-muted-foreground">{tag}</span>)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[10px] text-muted-foreground">{u.date}</span>
                      <button onClick={() => {
                  setShowMatchDetail(false);
                  navigate("/chat", {
                    state: {
                      chatId: u.id
                    }
                  });
                }} className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center active:scale-90 transition-transform">
                        <MessageCircle size={14} className="text-primary-foreground" />
                      </button>
                    </div>
                  </div>)}
              </div>
            </div>
          </motion.div>
        </motion.div>}
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
              <div className="space-y-3 truncate">
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
              <div className="space-y-3 truncate">
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
