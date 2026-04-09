import { motion, AnimatePresence } from "framer-motion";
import { Bell, Eye, Heart, MessageSquare, Check, UserRound, Star, Lock, ChevronRight } from "lucide-react";
import { useNotifications, NotifType, Notif } from "@/context/NotificationContext";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import MigoPlusModal from "@/components/MigoPlusModal";
import ProfileDetailSheet from "@/components/ProfileDetailSheet";
import { useSubscription } from "@/context/SubscriptionContext";
import { supabase } from "@/lib/supabaseClient";
const notifIcon = (type: NotifType) => {
  switch (type) {
    case "profile_view": return { Icon: Eye, color: "bg-blue-500/10 text-blue-500" };
    case "like": return { Icon: Heart, color: "bg-red-500/10 text-red-500" };
    case "superlike": return { Icon: Star, color: "bg-indigo-500/10 text-indigo-400" };
    case "comment": return { Icon: MessageSquare, color: "bg-primary/10 text-primary" };
    case "match": return { Icon: UserRound, color: "bg-accent/30 text-accent-foreground" };
  }
};



const NotificationPage = () => {
  const { t } = useTranslation();

  const notifMessage = (n: Notif) => {
    switch (n.type) {
      case "profile_view": return t("notif.viewedProfile");
      case "like":       return n.target ? t("notif.likedMsg") : t("notif.liked");
      case "superlike":  return n.target ? t("notif.superlikedTarget", {target: n.target}) : t("notif.superliked");
      case "comment":    return t("notif.commentedTarget", {target: n.target});
      case "match":      return t("notif.matched");
    }
  };

  const { notifs, unreadCount, markRead, markAllRead } = useNotifications();
  const { isPlus } = useSubscription();
  const [showPlusModal, setShowPlusModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);

  const fetchProfile = async (actorId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', actorId).single();
    if (data) {
      setSelectedProfile({
        id: data.id,
        name: data.name,
        age: data.age,
        nationality: data.nationality || '',
        gender: data.gender,
        bio: data.bio,
        location: data.location || t("notif.defaultLoc"),
        photo: data.photo_url,
        photoUrls: data.photo_urls,
        travelStyle: data.travel_style,
        languages: data.languages,
        mbti: data.mbti,
        verified: data.phone_verified,
        verifyLevel: data.phone_verified ? "basic" : "none",
        isPlus: data.is_plus,
        tags: data.interests || data.travel_style || []
      });
    }
  };

  const profileViews = notifs.filter(n => n.type === "profile_view");
  const profileViewCount = profileViews.length;

  return (
    <div className="min-h-screen bg-background safe-bottom truncate">
      {/* Header */}
      <div className="px-5 pt-safe pb-4 flex items-center justify-between truncate">
        <div className="truncate">
          <h1 className="text-2xl font-extrabold text-foreground truncate">{t('notification.title')}</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{t("notif.unreadCount", {count: unreadCount})}</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary"
          >
            <Check size={14} /> {t("auto.j529")}
          </button>
        )}
      </div>

      {/* Profile Views Banner */}
      {profileViewCount > 0 && (
        <div className="px-5 mb-5">
          <div 
            onClick={() => {
              if (!isPlus) setShowPlusModal(true);
            }}
            className="w-full relative overflow-hidden rounded-2xl p-4 flex items-center justify-between shadow-card bg-gradient-to-r from-amber-500 to-orange-500 cursor-pointer transition-transform active:scale-95"
          >
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <span className="text-white font-black text-lg">{profileViewCount}</span>
              </div>
              <div>
                <p className="text-white font-extrabold text-sm truncate">{t("notif.viewCount", {count: profileViewCount})}</p>
                <p className="text-white/80 text-[11px] font-bold mt-0.5 truncate">
                  {isPlus ? t("notif.viewDescPlus") : t("notif.viewDescNone")}
                </p>
              </div>
            </div>
            <div className="relative z-10 shrink-0">
              {isPlus ? <ChevronRight size={20} className="text-white" /> : <Lock size={18} className="text-white" />}
            </div>
          </div>
        </div>
      )}

      {/* Notif list */}
      <div className="px-5 space-y-2 truncate">
        <AnimatePresence mode="popLayout">
          {notifs.map((n) => {
            const { Icon, color } = notifIcon(n.type);
            return (
              <motion.button
                key={n.id}
                layout
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 50 }}
                onClick={() => {
                  markRead(n.id);
                  if (["profile_view", "like", "superlike"].includes(n.type)) {
                    if (!isPlus) setShowPlusModal(true);
                    else if (n.actorId) fetchProfile(n.actorId);
                  } else if (n.actorId) {
                    fetchProfile(n.actorId);
                  }
                }}
                className={`w-full flex items-start gap-3 p-4 rounded-2xl text-left transition-colors ${
                  n.read ? "bg-card" : "bg-primary/5 border border-primary/20"
                }`}
              >
                {/* Actor photo + type icon */}
                <div className="relative shrink-0">
                  {n.actorPhoto && !(["profile_view", "like", "superlike"].includes(n.type) && !isPlus) ? (
                    <img src={n.actorPhoto} alt="" className="w-12 h-12 rounded-2xl object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground text-lg font-extrabold">
                      {["profile_view", "like", "superlike"].includes(n.type) && !isPlus ? "?" : (n.actor?.[0] ?? "?")}
                    </div>
                  )}
                  {["profile_view", "like", "superlike"].includes(n.type) && !isPlus && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/20 rounded-2xl backdrop-blur-sm">
                      <Lock size={16} className="text-foreground" />
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${color}`}>
                    <Icon size={13} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">
                    <span className="font-bold truncate">{["profile_view", "like", "superlike"].includes(n.type) && !isPlus ? t("notif.someone") : n.actor}</span>
                    {notifMessage(n)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
                </div>

                {!n.read && (
                  <div className="w-2.5 h-2.5 rounded-full gradient-primary shrink-0 mt-1.5" />
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>

        {notifs.length === 0 && (
          <div className="text-center py-20">
            <Bell size={36} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground truncate">{t('notification.empty')}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{t("notif.emptyDesc")}</p>
          </div>
        )}
      </div>

      <MigoPlusModal isOpen={showPlusModal} onClose={() => setShowPlusModal(false)} />
      {selectedProfile && (
        <ProfileDetailSheet
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  );
};

export default NotificationPage;
