import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bell, MapPin, Navigation, ShoppingBag, SlidersHorizontal } from "lucide-react";
import siteLogo from "@/assets/site-logo.png";
import PageGuide from "@/components/PageGuide";
import { CheckIn } from "@/lib/checkInService";
import { useNotifications } from "@/context/NotificationContext";

interface TopHeaderProps {
  className?: string;
  activeCheckIn?: CheckIn | null;
  onCheckInClick?: () => void;
  filterCount?: number;
  onFilterClick?: () => void;
  pageGuideType: "match" | "map" | "community" | "chat" | "profile" | "admin" | "other";
}

export default function TopHeader({
  className = "flex items-center justify-between px-2 sm:px-4 pt-safe pb-3 bg-background overflow-hidden",
  activeCheckIn,
  onCheckInClick,
  filterCount = 0,
  onFilterClick,
  pageGuideType
}: TopHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  return (
    <header className={className}>
      <div className="flex items-center gap-1 sm:gap-2 pointer-events-auto shrink min-w-0 max-w-[50%]">
        <img src={siteLogo} alt="Migo" className="h-6 sm:h-8 object-contain shrink-0" loading="lazy" />
        <PageGuide page={pageGuideType as any} />
        {/* GPS 체크인 필 */}
        <button
          onClick={onCheckInClick}
          className={`flex shrink items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all active:scale-95 border min-w-0 ${
            activeCheckIn
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600'
              : 'bg-muted border-transparent text-muted-foreground'
          }`}
        >
          <MapPin size={12} className={activeCheckIn ? 'text-emerald-500 shrink-0' : 'text-muted-foreground shrink-0'} />
          <span className="truncate flex-1 min-w-0 max-w-[60px]">{activeCheckIn ? activeCheckIn.city : t("auto.ko_0259", "체크인")}</span>
          {activeCheckIn && <span className="w-1.5 h-1.5 shrink-0 bg-emerald-500 rounded-full" />}
        </button>
      </div>
      <div className="flex items-center justify-end gap-1 sm:gap-1.5 pointer-events-auto shrink-0 max-w-[45%]">
        {/* 근쳐 여행자 */}
        <button onClick={() => navigate("/nearby")} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center relative transition-transform active:scale-90">
          <Navigation size={13} className="text-emerald-500" />
          {localStorage.getItem('migo_nearby_seen') !== '1' && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border border-background" />
          )}
        </button>
        {/* 알림 */}
        <button onClick={() => navigate("/notifications")} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-muted flex items-center justify-center relative transition-transform active:scale-90 z-40">
          <Bell size={13} className="text-muted-foreground" />
          {unreadCount > 0 && <motion.span key={unreadCount} initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-red-500 flex items-center justify-center text-[8px] font-extrabold text-white">{unreadCount > 99 ? '99+' : unreadCount}</motion.span>}
        </button>
        {/* 쇼핑 */}
        <button onClick={() => navigate("/shop")} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center transition-transform active:scale-90">
          <ShoppingBag size={13} className="text-primary" />
        </button>
        {/* 필터 */}
        <button onClick={onFilterClick} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-muted flex items-center justify-center relative transition-transform active:scale-90">
          <SlidersHorizontal size={13} className={filterCount > 0 ? "text-primary" : "text-muted-foreground"} />
          {filterCount > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full gradient-primary flex items-center justify-center text-[8px] font-bold text-primary-foreground">{filterCount}</span>}
        </button>
      </div>
    </header>
  );
}
