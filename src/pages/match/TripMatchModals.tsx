import i18n from "@/i18n";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Languages, MapPin, Calendar, Users, Zap, Star, ChevronRight } from "lucide-react";
import type { TripGroup } from "@/types";
import type { MatchResult } from "@/lib/matchingEngine";
import { getRecommendationsForHotplace, PlaceRecommendation } from "@/lib/placeRecommendations";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export const GroupDetailModal = ({
  detailGroup,
  setDetailGroup,
  translateMap,
  loadingMap,
  handleTranslate
}: {
  detailGroup: TripGroup | null;
  setDetailGroup: (v: TripGroup | null) => void;
  translateMap: Record<string, string>;
  loadingMap: Record<string, boolean>;
  handleTranslate: (text: string, key: string) => void;
}) => {
  const { i18n } = useTranslation();

  return (
    <AnimatePresence>
      {detailGroup && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="fixed inset-0 z-50 bg-background overflow-y-auto"
        >
          <div className="px-5 pt-12 pb-32">
            <button
              onClick={() => setDetailGroup(null)}
              className="flex items-center gap-2 text-sm text-muted-foreground mb-6 font-bold"
            >
              <ArrowLeft size={16} />{i18n.t("auto.ko_0432", "목록으로")}
            </button>

            <div className="bg-card rounded-2xl p-4 shadow-card mb-4 border border-border/40 truncate">
              <div className="flex items-center gap-3 mb-3">
                {detailGroup.hostPhoto ? (
                  <img
                    src={detailGroup.hostPhoto}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {detailGroup.hostName?.[0] || "M"}
                  </div>
                )}
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-extrabold text-foreground break-words whitespace-pre-wrap">
                    {translateMap[`groupTitle_${detailGroup.id}`] || detailGroup.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{detailGroup.hostName}</p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground leading-relaxed break-words whitespace-pre-wrap">
                {translateMap[`groupDesc_${detailGroup.id}`] || detailGroup.description}
              </p>
              
              {detailGroup.description && (
                <div className="mt-4 pt-3 border-t border-border/40">
                  <button 
                    onClick={() => {
                      handleTranslate(detailGroup.title, `groupTitle_${detailGroup.id}`);
                      handleTranslate(detailGroup.description || "", `groupDesc_${detailGroup.id}`);
                      if (detailGroup.destination) handleTranslate(detailGroup.destination, `groupDest_${detailGroup.id}`);
                    }} 
                    className={`text-[11px] font-bold flex items-center gap-1.5 transition-colors px-2 py-1 -ml-2 rounded-lg ${
                      translateMap[`groupDesc_${detailGroup.id}`] 
                        ? "text-primary bg-primary/10" 
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Languages size={12} className={loadingMap[`groupDesc_${detailGroup.id}`] ? "animate-pulse" : ""} />
                    {loadingMap[`groupDesc_${detailGroup.id}`] 
                      ? i18n.t("auto.z_번역중_000", { defaultValue: "Translating..." }) 
                      : translateMap[`groupDesc_${detailGroup.id}`] 
                        ? i18n.t("auto.z_원문보기_001", { defaultValue: "Show original" }) 
                        : i18n.t("auto.z_번역보기_002", { defaultValue: "See translation" })
                    }
                  </button>
                </div>
              )}
            </div>

            <div className="bg-card rounded-2xl p-4 shadow-card mb-4 border border-border/40">
              <div className="grid grid-cols-2 gap-3 truncate">
                {[
                  { label: i18n.t("auto.z_목적지_ffdbab", {defaultValue:"Destination"}), value: translateMap[`groupDest_${detailGroup.id}`] || detailGroup.destination, icon: MapPin },
                  { label: i18n.t("auto.z_날짜_a93b53", {defaultValue:"Dates"}), value: detailGroup.dates, icon: Calendar },
                  { label: i18n.t("auto.z_인원수_553bc2", {defaultValue:"Members"}), value: `${detailGroup.currentMembers}/${detailGroup.maxMembers}`, icon: Users },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon size={14} className="text-primary shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                      <p className="text-xs font-bold text-foreground">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const InstantRecommendationModal = ({
  showRecommendation,
  setShowRecommendation,
  hotplace,
  createdThreadId
}: {
  showRecommendation: MatchResult | null;
  setShowRecommendation: (v: MatchResult | null) => void;
  hotplace: string;
  createdThreadId: string | null;
}) => {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {showRecommendation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRecommendation(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="relative w-full max-w-sm bg-card rounded-3xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[85vh]">
            <div className="p-5 pb-3 border-b border-border/50 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-3">
                <Zap size={24} className="text-rose-500" />
              </div>
              <h3 className="text-lg font-extrabold text-foreground mb-1 truncate">{i18n.t("auto.ko_0427", "매칭 성공! 바로모임 시작")}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed truncate">
                {i18n.t("auto.ko_0428", "1시간 내로 만남을 완료해 주세요.")}<br/>
                {i18n.t("auto.ko_0429", "모임 장소 근처의 추천 스팟을 확인해 보세요!")}</p>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 bg-muted/30">
              {getRecommendationsForHotplace(hotplace).map((place: PlaceRecommendation) => (
                <div key={place.id} className="p-3 bg-card rounded-2xl border border-border shadow-sm flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xl truncate">
                      {place.type === "restaurant" ? "🍽️" : place.type === "bar" ? "🍺" : "☕"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-sm font-extrabold text-foreground truncate">{place.name}</h4>
                      <div className="flex items-center gap-0.5 shrink-0 bg-yellow-500/10 px-1.5 py-0.5 rounded-md">
                        <Star size={10} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-[10px] font-bold text-yellow-600">{place.rating}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug mb-2">
                      {place.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {place.distance}
                      </span>
                      <button className="text-[10px] font-bold text-blue-500 flex items-center gap-1 hover:underline">
                        {i18n.t("auto.ko_0430", "지도 보기")}<ChevronRight size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border/50 bg-card">
              <button onClick={() => {
                setShowRecommendation(null);
                navigate('/chat', { state: { threadId: createdThreadId } });
              }} className="w-full py-3.5 rounded-2xl gradient-primary text-white text-sm font-extrabold shadow-lg shadow-primary/25 relative overflow-hidden">
                <motion.div className="absolute inset-0 bg-white/20" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }} style={{ skewX: -20 }} />
                {i18n.t("auto.ko_0431", "생성된 채팅방으로 바로가기")}</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
