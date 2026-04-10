import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bell, MapPin, Navigation, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { CheckIn } from "@/lib/checkInService";
import { useNotifications } from "@/context/NotificationContext";

interface TopHeaderProps {
  className?: string;
  activeCheckIn?: CheckIn | null;
  onCheckInClick?: () => void;
  filterCount?: number;
  onFilterClick?: () => void;
  /** MapPage용: 위치 라벨 직접 지정 */
  locationLabel?: string;
  /** MapPage용: 위치 공유 활성 여부 */
  locationActive?: boolean;
  /** MatchPage 전용: 근처 여행자 버튼 */
  showNearby?: boolean;
  /** MatchPage 전용: 쇼핑 버튼 */
  showShop?: boolean;
}

export default function TopHeader({
  className = "flex items-center justify-between px-4 pt-safe pb-2 bg-background overflow-hidden",
  activeCheckIn,
  onCheckInClick,
  filterCount = 0,
  onFilterClick,
  locationLabel,
  locationActive,
  showNearby = false,
  showShop = false,
}: TopHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  // MapPage에서 locationLabel이 전달되면 위치 버튼을 메인으로 사용
  const leftButton = locationLabel ? (
    <button
      onClick={onCheckInClick}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl font-bold transition-all active:scale-95 border ${
        locationActive
          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600'
          : 'bg-muted border-transparent text-muted-foreground'
      }`}
    >
      <MapPin size={15} className={locationActive ? 'text-emerald-500 shrink-0' : 'text-muted-foreground shrink-0'} />
      <span className="text-[13px] truncate max-w-[160px]">{locationLabel}</span>
      {locationActive && <span className="w-2 h-2 shrink-0 bg-emerald-500 rounded-full animate-pulse" />}
    </button>
  ) : (
    // MatchPage 등 기존 체크인 버튼
    <button
      onClick={onCheckInClick}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl font-bold transition-all active:scale-95 border ${
        activeCheckIn
          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600'
          : 'bg-muted border-transparent text-muted-foreground'
      }`}
    >
      <MapPin size={15} className={activeCheckIn ? 'text-emerald-500 shrink-0' : 'text-muted-foreground shrink-0'} />
      <span className="text-[13px] truncate max-w-[140px]">
        {activeCheckIn ? activeCheckIn.city : t("auto.ko_0259", "체크인")}
      </span>
      {activeCheckIn
        ? <span className="w-2 h-2 shrink-0 bg-emerald-500 rounded-full" />
        : <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full shrink-0">NEW</span>
      }
    </button>
  );

  return (
    <header className={className}>
      {leftButton}

      {/* 우측: (근처 여행자) + (쇼핑) + 알림 + 필터 */}
      <div className="flex items-center gap-2 pointer-events-auto shrink-0">
        {showNearby && (
          <button
            onClick={() => navigate("/nearby")}
            className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center relative transition-transform active:scale-90"
          >
            <Navigation size={15} className="text-emerald-500" />
            {localStorage.getItem('migo_nearby_seen') !== '1' && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-background" />
            )}
          </button>
        )}
        {showShop && (
          <button
            onClick={() => navigate("/shop")}
            className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center transition-transform active:scale-90"
          >
            <ShoppingBag size={15} className="text-primary" />
          </button>
        )}
        <button
          onClick={() => navigate("/notifications")}
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center relative transition-transform active:scale-90"
        >
          <Bell size={16} className="text-muted-foreground" />
          {unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 rounded-full bg-red-500 flex items-center justify-center text-[9px] font-extrabold text-white"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </button>
        <button
          onClick={onFilterClick}
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center relative transition-transform active:scale-90"
        >
          <SlidersHorizontal size={16} className={filterCount > 0 ? "text-primary" : "text-muted-foreground"} />
          {filterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full gradient-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground">
              {filterCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
