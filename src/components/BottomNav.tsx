import { useLocation, useNavigate } from "react-router-dom";
import { Heart, Compass, Map, MessageCircle, User } from "lucide-react";
import { useChatContext } from "@/context/ChatContext";
import { useTranslation } from "react-i18next";
import { useNotifications } from "@/context/NotificationContext";
import { triggerHaptic } from "@/lib/haptics";
import { useSubscription } from "@/context/SubscriptionContext";
import { Capacitor } from "@capacitor/core";

interface TabDef {
  path: string;
  icon: React.ElementType;
  label: string;
  chatBadge?: boolean;
  notifBadge?: boolean;
}

export const NAV_H = 52;     // BottomNav 높이 (px)
export const BANNER_H = 75;  // AdMob 배너용 예약 높이 (px) - 가변 높이 및 버튼 터치 영역 침범 방지용 넉넉한 여백
export const BANNER_MARGIN = NAV_H; // 네이티브 플러그인(Android/iOS 공통)이 Safe Area 위로 BottomNav 높이(52)만큼 배너를 띄움

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalUnread } = useChatContext();
  const { unreadCount: notifUnread } = useNotifications();
  const { t } = useTranslation();
  const { isPlus, isPremium } = useSubscription();

  const isNative = Capacitor.isNativePlatform();
  const showAds = !isPlus && !isPremium && isNative;

  // BottomNav는 화면 맨 아래 (bottom = 0)
  // AdMob 배너는 margin=80dp로 BottomNav 위에 띄움
  const navBottom = '0px';

  const tabs: TabDef[] = [
    { path: "/",         icon: Heart,         label: t("nav.match") },
    { path: "/discover", icon: Compass,       label: t("nav.discover") },
    { path: "/map",      icon: Map,           label: t("nav.map") },
    { path: "/chat",     icon: MessageCircle, label: t("nav.chat"),    chatBadge: true },
    { path: "/profile",  icon: User,          label: t("nav.profile"), notifBadge: true },
  ];

  return (
    <nav
      id="migo-bottom-nav"
      className="fixed left-0 right-0 z-[100] bg-card border-t border-border/60"
      style={{ bottom: navBottom }}
    >
      <div className="flex items-center justify-around px-2" style={{ height: `${NAV_H}px` }}>
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          const showChatBadge  = tab.chatBadge  && totalUnread > 0;
          const showNotifBadge = tab.notifBadge && notifUnread  > 0;
          return (
            <button
              key={tab.path}
              onClick={() => { triggerHaptic("light"); navigate(tab.path); }}
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
              <span className={`text-[10px] font-semibold transition-colors leading-none px-0.5 text-center ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
