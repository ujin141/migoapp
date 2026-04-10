import { useState, useEffect } from "react";
import { OverlayView } from "@react-google-maps/api";
import { Hotplace } from "@/lib/placeRecommendations";

// 부드러운 위치 보간을 처리하는 마커 컴포넌트
export const SmoothTravelerMarker = ({ t, isSelected, onClick }: { t: any, isSelected: boolean, onClick: () => void }) => {
  const [pos, setPos] = useState({ lat: t.lat, lng: t.lng });
  
  // 목적지로 부드럽게 이동 (선형 보간)
  useEffect(() => {
    if (t.lat === pos.lat && t.lng === pos.lng) return;
    
    let frame: number;
    let progress = 0;
    const startPos = { ...pos };
    
    const animate = () => {
      progress += 0.05; // 한 프레임당 5%씩 이동 (대략 20프레임 = 0.3초)
      if (progress >= 1) {
        setPos({ lat: t.lat, lng: t.lng });
        return;
      }
      setPos({
        lat: startPos.lat + (t.lat - startPos.lat) * progress,
        lng: startPos.lng + (t.lng - startPos.lng) * progress
      });
      frame = requestAnimationFrame(animate);
    };
    
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [t.lat, t.lng]);

  return (
    <OverlayView position={pos} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
      <div className="flex flex-col items-center cursor-pointer group -translate-x-1/2 -translate-y-1/2" onClick={onClick}>
        <div className={`absolute w-12 h-12 rounded-full ${isSelected ? "bg-primary/40" : "bg-primary/20"} animate-pulse`} />
        <div className="relative">
          {t.photo ? <img src={t.photo} alt={t.name} className={`w-11 h-11 rounded-full object-cover border-2 shadow-lg transition-transform ${isSelected ? "border-primary scale-110" : "border-white"}`} /> : <div className={`w-11 h-11 rounded-full border-2 shadow-lg flex items-center justify-center gradient-primary ${isSelected ? "border-primary scale-110" : "border-white"}`}>
              <span className="text-white font-extrabold text-sm">{t.name?.[0] ?? "?"}</span>
            </div>}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
        </div>
        {isSelected && <div className="mt-1 bg-white/90 backdrop-blur-sm rounded-xl px-2 py-0.5 shadow-md whitespace-nowrap">
            <span className="text-[10px] font-bold text-gray-800">{t.name}</span>
            <span className="text-[10px] text-gray-500 ml-1">{t.distance}</span>
          </div>}
        {t.rightNowMessage && !isSelected && (
          <div className="mt-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg px-2 py-1 shadow-[0_0_15px_rgba(251,191,36,0.5)] whitespace-nowrap animate-bounce">
            <span className="text-[10px] font-extrabold text-white">⚡ {t.rightNowMessage}</span>
          </div>
        )}
      </div>
    </OverlayView>
  );
};

// 핫플레이스 마커 컴포넌트
export const HotplaceMarker = ({ h, isSelected, onClick }: { h: Hotplace, isSelected: boolean, onClick: () => void }) => {
  return (
    <OverlayView position={{ lat: h.lat, lng: h.lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
      <div className={`flex flex-col items-center cursor-pointer transition-transform ${isSelected ? 'scale-125 z-50' : 'scale-100 z-10 hover:scale-110'} -translate-x-1/2 -translate-y-[100%]`} onClick={onClick}>
        <div className="relative">
          <div className="w-12 h-12 rounded-xl border-2 border-white shadow-xl overflow-hidden bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center">
            <span className="text-2xl drop-shadow-md">{h.emoji}</span>
          </div>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 transform origin-center border-b-2 border-r-2 border-transparent shadow-sm" />
          
          {isSelected && (
             <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center border border-white shadow-sm">
               <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
             </div>
          )}
        </div>
        {!isSelected && (
          <div className="mt-1.5 bg-white/95 backdrop-blur-sm rounded-xl px-2 py-0.5 shadow-md whitespace-nowrap border border-black/5">
            <span className="text-[10px] font-bold text-gray-800 truncate block">{h.name.split(' (')[0]}</span>
          </div>
        )}
      </div>
    </OverlayView>
  );
};

// 실제 구글 맛집/카페/바 마커 컴포넌트
export const RestaurantMarker = ({ place, isSelected, onClick }: { place: any, isSelected: boolean, onClick: () => void }) => {
  const typeEmoji = place.types?.includes('restaurant') ? '🍽️'
    : place.types?.includes('bar') ? '🍺'
    : place.types?.includes('cafe') ? '☕'
    : '📍';
  const borderColor = place.types?.includes('restaurant') ? (isSelected ? 'border-orange-500' : 'border-orange-200')
    : place.types?.includes('bar') ? (isSelected ? 'border-amber-500' : 'border-amber-200')
    : (isSelected ? 'border-sky-500' : 'border-sky-200');
  const pulseColor = place.types?.includes('restaurant') ? 'bg-orange-500/30'
    : place.types?.includes('bar') ? 'bg-amber-500/30'
    : 'bg-sky-500/30';
  return (
    <OverlayView position={{ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
      <div className="flex flex-col items-center cursor-pointer -translate-x-1/2 -translate-y-[110%]" onClick={onClick}>
        <div className={`relative w-10 h-10 rounded-xl border-2 ${borderColor} bg-white shadow-lg flex items-center justify-center transition-transform ${isSelected ? 'scale-125' : 'hover:scale-110'}`}>
          {isSelected && <div className={`absolute inset-0 rounded-xl ${pulseColor} animate-pulse`} />}
          <span className="text-lg relative z-10">{typeEmoji}</span>
        </div>
        <div className="mt-0.5 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-0.5 shadow-md whitespace-nowrap border border-black/5">
          <span className="text-[9px] font-bold text-gray-800 truncate block max-w-[80px]">{place.name}</span>
          {place.rating && <span className="text-[9px] text-amber-500 font-extrabold"> ⭐{place.rating}</span>}
        </div>
        {/* Callout triangle */}
        <div className="w-2 h-2 bg-white border-b border-r border-black/5 rotate-45 -mt-1 shadow-sm" />
      </div>
    </OverlayView>
  );
};
