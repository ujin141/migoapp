import { useLocation, useNavigate } from "react-router-dom";
import { Heart, Compass, Map, MessageCircle, User } from "lucide-react";
import { useChatContext } from "@/context/ChatContext";
import { useTranslation } from "react-i18next";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalUnread } = useChatContext();
  const { t } = useTranslation();

  const tabs = [
    { path: "/",         icon: Heart,          label: t("nav.match") },
    { path: "/discover", icon: Compass,         label: t("nav.discover") },
    { path: "/map",      icon: Map,             label: t("nav.map") },
    { path: "/chat",     icon: MessageCircle,   label: t("nav.chat"), badge: true },
    { path: "/profile",  icon: User,            label: t("nav.profile") },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around max-w-lg mx-auto px-1" style={{ height: '60px' }}>
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          const showBadge = tab.badge && totalUnread > 0;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 min-w-0"
            >
              <div className={`relative p-1.5 rounded-xl transition-all duration-200 ${isActive ? "gradient-primary shadow-card" : ""}`}>
                <Icon
                  size={21}
                  className={`transition-colors duration-200 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-full gradient-primary flex items-center justify-center text-[9px] font-extrabold text-primary-foreground shadow-card animate-pulse">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-semibold transition-colors w-full text-center overflow-hidden whitespace-nowrap overflow-ellipsis ${isActive ? "gradient-text" : "text-muted-foreground"}`}>
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
