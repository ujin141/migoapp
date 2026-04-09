import { useLocation, useNavigate } from "react-router-dom";
import { Heart, Compass, Map, MessageCircle, User } from "lucide-react";
import { useChatContext } from "@/context/ChatContext";
import { useTranslation } from "react-i18next";
import { useNotifications } from "@/context/NotificationContext";

interface TabDef {
  path: string;
  icon: React.ElementType;
  label: string;
  chatBadge?: boolean;
  notifBadge?: boolean;
}

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalUnread } = useChatContext();
  const { unreadCount: notifUnread } = useNotifications();
  const { t } = useTranslation();

  const tabs: TabDef[] = [
    { path: "/",         icon: Heart,         label: t("nav.match") },
    { path: "/discover", icon: Compass,       label: t("nav.discover") },
    { path: "/map",      icon: Map,           label: t("nav.map") },
    { path: "/chat",     icon: MessageCircle, label: t("nav.chat"),    chatBadge: true },
    { path: "/profile",  icon: User,          label: t("nav.profile"), notifBadge: true },
  ];

  return (
    <nav id="migo-bottom-nav" className="fixed bottom-0 left-0 right-0 z-[100] bg-card/97 backdrop-blur-xl border-t border-border/60">
      <div className="flex items-center justify-around max-w-lg mx-auto px-2" style={{ height: '52px' }}>
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          const showChatBadge  = tab.chatBadge  && totalUnread > 0;
          const showNotifBadge = tab.notifBadge && notifUnread  > 0;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 min-w-0 group"
            >
              <div className={`relative flex items-center justify-center rounded-xl transition-all duration-200 ${
                isActive ? 'gradient-primary w-10 h-7 shadow-sm scale-105' : 'w-10 h-7'
              }`}>
                <Icon
                  size={isActive ? 17 : 18}
                  className={`transition-all duration-200 ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {showChatBadge && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-0.5 rounded-full bg-red-500 flex items-center justify-center text-[9px] font-extrabold text-white shadow-sm">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
                {showNotifBadge && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-0.5 rounded-full bg-red-500 flex items-center justify-center text-[9px] font-extrabold text-white shadow-sm">
                    {notifUnread > 99 ? "99+" : notifUnread}
                  </span>
                )}
              </div>
              <span className={`nav-label text-[10px] font-semibold transition-colors leading-none px-0.5 text-center ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* iOS home indicator safe area */}
      <div style={{ height: 'env(safe-area-inset-bottom, 0px)', background: 'inherit' }} />
    </nav>
  );
};

export default BottomNav;
