import i18n from "@/i18n";
import { AnimatePresence, motion } from "framer-motion";
import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";

interface GroupSheetProps {
  selectedGroup: any | null;
  setSelectedGroup: (group: any | null) => void;
  myLatLngRef: React.MutableRefObject<{ lat: number; lng: number } | null>;
  calcDist: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
  distLabel: (dist: number) => string;
}

export const GroupSheet = ({
  selectedGroup,
  setSelectedGroup,
  myLatLngRef,
  calcDist,
  distLabel
}: GroupSheetProps) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {selectedGroup && <motion.div className="absolute left-4 right-4 z-30" style={{ bottom: "calc(95px + env(safe-area-inset-bottom, 0px))" }} initial={{
      y: 40,
      opacity: 0
    }} animate={{
      y: 0,
      opacity: 1
    }} exit={{
      y: 40,
      opacity: 0
    }} transition={{
      type: "spring",
      damping: 25,
      stiffness: 300
    }}>
          <div className="bg-card rounded-3xl p-4 shadow-float border border-border/60 flex flex-col transition-all relative overflow-hidden">
            <div className="flex items-start gap-3.5 relative z-10 w-full" onClick={() => setSelectedGroup(null)}>
              {/* 이미지 */}
              <div className="relative shrink-0 mt-0.5">
                {selectedGroup.coverImage ? (
                  <img src={selectedGroup.coverImage} className="w-14 h-14 rounded-2xl object-cover shadow-sm cursor-pointer border border-border/50" onClick={() => setSelectedGroup(null)} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl shadow-sm border border-primary/20 cursor-pointer" onClick={() => setSelectedGroup(null)}>
                    🛩️
                  </div>
                )}
              </div>
              
              {/* 메인 정보 */}
              <div className="flex-1 min-w-0 pb-1 cursor-pointer">
                <div className="flex items-center gap-1.5 mb-1.5">
                   <span className="text-[10px] font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap truncate">
                     {selectedGroup.isPremiumGroup ? i18n.t("map.premium") : i18n.t("auto.g_1471", "동행 모집")}
                   </span>
                </div>
                <h4 className="font-extrabold text-[16px] text-foreground leading-tight truncate">{selectedGroup.title}</h4>
                <p className="text-[12px] font-medium text-muted-foreground truncate mt-1.5 flex items-center gap-1">
                  <Users size={12} className="inline text-muted-foreground" />
                  {selectedGroup.currentMembers}/{selectedGroup.maxMembers}{i18n.t("auto.g_1465", "명 · 📍")}{selectedGroup.destination}
                </p>
              </div>
            </div>

            {/* 하단 거리 정보 및 버튼 박스 */}
            <div className="flex items-center justify-between gap-3 border-t border-border/40 mt-3 pt-3">
              <div className="min-w-0 truncate">
                {(() => {
                  if (!myLatLngRef.current || !selectedGroup.lat || !selectedGroup.lng) return <div className="text-[12px] text-muted-foreground font-medium truncate">{i18n.t("auto.g_1466", "위치 확인 불가")}</div>;
                  const d = calcDist(myLatLngRef.current.lat, myLatLngRef.current.lng, selectedGroup.lat, selectedGroup.lng);
                  const walkTime = Math.max(1, Math.ceil((d * 1000) / 75));
                  return (
                    <div className="flex items-center gap-1 text-[13px] font-black text-primary truncate">
                      <span className="truncate">{i18n.t("auto.g_1467", "🚶 약")}{walkTime}{i18n.t("auto.g_1468", "분")}</span>
                      <span className="text-primary/40 text-[10px]">●</span>
                      <span className="opacity-80 font-bold">{distLabel(d)}</span>
                    </div>
                  );
                })()}
              </div>

              <div className="flex items-center gap-2 shrink-0 truncate">
                {selectedGroup.lat && selectedGroup.lng && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedGroup.destination || `${selectedGroup.lat},${selectedGroup.lng}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-secondary/60 text-secondary-foreground text-[12px] font-bold hover:bg-secondary/80 transition-colors flex items-center justify-center border border-border"
                  >
                    {i18n.t("auto.g_1469", "지도 검색")}</a>
                )}
                <button className="px-4 py-2 rounded-xl gradient-primary text-white text-[12px] font-extrabold shadow-md active:scale-95 transition-transform flex items-center">
                  {i18n.t("auto.g_1470", "자세히 보기")}</button>
              </div>
            </div>
          </div>
        </motion.div>}
    </AnimatePresence>
  );
};
