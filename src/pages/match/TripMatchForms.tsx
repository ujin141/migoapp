import i18n from "@/i18n";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, MapPin, Sparkles, Crown, SlidersHorizontal, ChevronDown, Calendar, Check, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HOTPLACES } from "@/lib/placeRecommendations";
import type { TripVibe } from "@/lib/matchingEngine";

export interface InstantMeetPanelProps {
  mode: "random" | "premium" | "instant";
  isPlus: boolean;
  instantMeetsCount: number;
  hotplace: string;
  setHotplace: (v: string) => void;
  vibe: TripVibe;
  setVibe: (v: TripVibe) => void;
  showRandomSetup: boolean;
  setShowRandomSetup: (v: boolean | ((prev: boolean) => boolean)) => void;
  meetCity: string;
  setMeetCity: (v: string) => void;
  meetDate: string;
  setMeetDate: (v: string) => void;
  meetTime: string;
  setMeetTime: (v: string) => void;
  meetPlace: string;
  setMeetPlace: (v: string) => void;
  setShowPlusModal: (v: boolean) => void;
  handleStartInstantMeet: () => void;
  VIBES: { id: TripVibe; emoji: string; label: string; desc: string; }[];
  POPULAR_CITIES: string[];
  POPULAR_PLACES: string[];
}

export const InstantMeetPanel: React.FC<InstantMeetPanelProps> = ({
  mode,
  isPlus,
  instantMeetsCount,
  hotplace,
  setHotplace,
  vibe,
  setVibe,
  showRandomSetup,
  setShowRandomSetup,
  meetCity,
  setMeetCity,
  meetDate,
  setMeetDate,
  meetTime,
  setMeetTime,
  meetPlace,
  setMeetPlace,
  setShowPlusModal,
  handleStartInstantMeet,
  VIBES,
  POPULAR_CITIES,
  POPULAR_PLACES
}) => {
  const { i18n } = useTranslation();

  return (
    <AnimatePresence>
      {mode === "instant" && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-4 overflow-hidden pt-3"
        >
          {/* Hero Card */}
          <div className="relative rounded-3xl overflow-hidden mb-3" style={{ background: "linear-gradient(135deg, #ff4d6d 0%, #ff758c 50%, #c9184a 100%)" }}>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
              <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/5 translate-y-6 -translate-x-4" />
            </div>
            <div className="relative z-10 p-5 pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0 relative">
                  <span className="absolute -inset-0.5 rounded-2xl border border-white/40 animate-ping opacity-40" />
                  <Zap size={22} className="text-white" fill="currentColor" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-white leading-tight truncate">{i18n.t("instant.mainTitle", "주변 즉흥 바로모임")}</h3>
                  <p className="text-[11px] text-white/80 mt-0.5 leading-snug truncate">{i18n.t("instant.mainDesc", "지금 바로 만날 수 있는 최적의 상대를 매칭합니다.")}</p>
                </div>
              </div>
              <div className="flex gap-2 truncate">
                {[
                  { icon: "⚡", label: i18n.t("instant.tagInstant", "즉시 매칭") },
                  { icon: "📍", label: i18n.t("instant.tagLocation", "위치 기반") },
                  { icon: "⏱️", label: i18n.t("instant.tag1Hour", "1시간 내") },
                ].map((s, idx) => (
                  <div key={idx} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/15 backdrop-blur-sm">
                    <span className="text-sm">{s.icon}</span>
                    <span className="text-[10px] font-bold text-white whitespace-nowrap">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main options card */}
          <div className="bg-card rounded-3xl border border-border/60 overflow-hidden shadow-sm mb-3 truncate">
            {/* Hotplace Section */}
            <div className="p-4 border-b border-border/40">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                  <MapPin size={14} className="text-rose-500" />
                </div>
                <div>
                  <p className="text-[13px] font-extrabold text-foreground truncate">{i18n.t("instant.selectPlaceTitle", "모임 장소 선택")}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{i18n.t("instant.selectPlaceDesc", "핫한 장소를 골라보세요")}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 truncate">
                {HOTPLACES.slice(0, 6).map(h => (
                  <button
                    key={h.id}
                    onClick={() => setHotplace(h.id)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all active:scale-95 ${
                      hotplace === h.id
                        ? "border-rose-500 bg-rose-500/10 shadow-sm"
                        : "border-border/60 bg-background hover:border-rose-500/30 hover:bg-rose-500/5"
                    }`}
                  >
                    <span className="text-xl">{h.emoji || "📍"}</span>
                    <span className={`text-[10px] font-bold leading-tight text-center ${hotplace === h.id ? "text-rose-600" : "text-muted-foreground"}`}>
                      {h.name.split(" ")[0]}
                    </span>
                  </button>
                ))}
              </div>
              {HOTPLACES.length > 6 && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-none">
                  {HOTPLACES.slice(6).map(h => (
                    <button
                      key={h.id}
                      onClick={() => setHotplace(h.id)}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold border-2 transition-all active:scale-95 whitespace-nowrap ${
                        hotplace === h.id
                          ? "bg-rose-500 text-white border-rose-500"
                          : "bg-background text-muted-foreground border-border/60 hover:border-rose-500/30"
                      }`}
                    >
                      {h.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vibe Section */}
            <div className="p-4 truncate">
              <div className="flex items-center justify-between mb-3 truncate">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Sparkles size={14} className="text-violet-500" />
                  </div>
                  <div>
                    <p className="text-[13px] font-extrabold text-foreground truncate">{i18n.t("instant.vibeTitle", "만남 스타일")}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{i18n.t("instant.vibeDesc", "어떤 만남을 원하세요?")}</p>
                  </div>
                </div>
                {!isPlus && (
                  <button
                    onClick={() => setShowPlusModal(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20"
                  >
                    <Crown size={10} className="text-amber-500" />
                    <span className="text-[9px] font-extrabold text-amber-600 truncate">{i18n.t("instant.plusOnly", "Plus 전용")}</span>
                  </button>
                )}
              </div>

              {isPlus ? (
                <div className="grid grid-cols-4 gap-2">
                  {VIBES.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setVibe(v.id)}
                      className={`flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-2xl border-2 transition-all active:scale-95 ${
                        vibe === v.id
                          ? "border-violet-500 bg-violet-500/10"
                          : "border-border/60 bg-background hover:border-violet-500/30"
                      }`}
                    >
                      <span className="text-xl">{v.emoji}</span>
                      <span className={`text-[10px] font-bold ${vibe === v.id ? "text-violet-600" : "text-muted-foreground"}`}>{v.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="relative">
                  <div className="grid grid-cols-4 gap-2 pointer-events-none select-none">
                    {VIBES.map(v => (
                      <div key={v.id} className="flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-2xl border-2 border-border/40 bg-background opacity-40">
                        <span className="text-xl">{v.emoji}</span>
                        <span className="text-[10px] font-bold text-muted-foreground">{v.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
                    <button
                      onClick={() => setShowPlusModal(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold text-white shadow-lg"
                      style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
                    >
                      <Crown size={14} />
                      {i18n.t("instant.unlockPlus")}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Detailed Filters (Subscriber only) */}
            {isPlus ? (
              <div className="p-4 border-t border-border/40 bg-indigo-500/5">
                <button
                  onClick={() => setShowRandomSetup(v => !v)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                      <SlidersHorizontal size={14} className="text-blue-500" />
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-extrabold text-foreground truncate">{i18n.t("instant.randomMatchTitle")}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        {meetCity || meetDate || meetPlace
                          ? `${meetCity ? meetCity + ' ' : ''}${meetDate ? meetDate + ' ' + meetTime : ''}${meetPlace ? ' ' + meetPlace : ''}`
                          : i18n.t("instant.randomMatchNone")
                        }
                      </p>
                    </div>
                  </div>
                  <ChevronDown size={14} className={`text-muted-foreground transition-transform ${showRandomSetup ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {showRandomSetup && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                       <div className="pt-4 space-y-4">
                          <div>
                             <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-blue-600 uppercase tracking-wider mb-2">
                               <MapPin size={12} /> {i18n.t("instant.randomCity")}
                             </label>
                             <div className="flex gap-2 flex-wrap mb-2">
                               {POPULAR_CITIES.map(c => (
                                 <button key={c} onClick={() => setMeetCity(meetCity === c ? "" : c)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all active:scale-95 ${meetCity === c ? "bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20" : "bg-card text-muted-foreground border-border hover:border-blue-500/30"}`}>{c}</button>
                               ))}
                             </div>
                             <input type="text" value={meetCity} onChange={e => setMeetCity(e.target.value)} placeholder={i18n.t("instant.randomCityPlaceholder")} className="w-full bg-card rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20" />
                          </div>

                          <div>
                             <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-blue-600 uppercase tracking-wider mb-2">
                               <Calendar size={12} /> {i18n.t("instant.randomDateTime")}
                             </label>
                             <div className="grid grid-cols-2 gap-2">
                               <input type="date" value={meetDate} onChange={e => setMeetDate(e.target.value)} className="bg-card rounded-xl px-3 py-2.5 text-sm text-foreground outline-none border border-border focus:border-blue-500/50" />
                               <input type="time" value={meetTime} onChange={e => setMeetTime(e.target.value)} className="bg-card rounded-xl px-3 py-2.5 text-sm text-foreground outline-none border border-border focus:border-blue-500/50" />
                             </div>
                          </div>

                          <div>
                             <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-blue-600 uppercase tracking-wider mb-2">
                               <MapPin size={12} /> {i18n.t("instant.randomPlace")}
                             </label>
                             <div className="flex gap-2 flex-wrap mb-2">
                               {POPULAR_PLACES.map(p => (
                                 <button key={p} onClick={() => setMeetPlace(meetPlace === p ? "" : p)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all active:scale-95 ${meetPlace === p ? "bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/20" : "bg-card text-muted-foreground border-border hover:border-indigo-500/30"}`}>{p}</button>
                               ))}
                             </div>
                             <input type="text" value={meetPlace} onChange={e => setMeetPlace(e.target.value)} placeholder={i18n.t("instant.randomPlacePlaceholder")} className="w-full bg-card rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20" />
                          </div>

                          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowRandomSetup(false)} className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-extrabold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2">
                            <Check size={16} /> {i18n.t("instant.randomApply")}
                          </motion.button>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div 
                className="p-4 border-t border-border/40 bg-indigo-500/5 cursor-pointer relative group overflow-hidden" 
                onClick={() => setShowPlusModal(true)}
              >
                <div className="flex items-center justify-between opacity-50 transition-opacity group-hover:opacity-30">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                      <SlidersHorizontal size={14} className="text-blue-500" />
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-extrabold text-foreground truncate">{i18n.t("instant.randomMatchTitle")}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{i18n.t("instant.randomFilterDesc")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[9px] font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/20">
                    <Crown size={10} className="text-amber-500" /> <span className="mt-0.5 leading-none truncate">{i18n.t("instant.plusOnly")}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CTA + free notice */}
          <div className="mb-4 truncate">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleStartInstantMeet}
              className="w-full py-4 rounded-2xl text-white text-base font-black shadow-xl relative overflow-hidden flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #ff4d6d, #c9184a)" }}
            >
              <motion.div
                className="absolute inset-0 bg-white/25"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
                style={{ skewX: -20 }}
              />
              <Zap size={20} className="relative z-10" fill="currentColor" />
              <span className="relative z-10 truncate">{i18n.t("auto.v2_inst_enter", "바로모임 입장하기")}</span>
              <ChevronRight size={18} className="relative z-10 opacity-80" />
            </motion.button>
            {!isPlus && (
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <p className="text-[10px] text-muted-foreground font-medium truncate">
                  {i18n.t("auto.v2_inst_free", "일반 회원은 1회 무료 체험 제공")}
                  <span className="text-rose-500 font-bold ml-1 truncate">({1 - instantMeetsCount > 0 ? i18n.t("auto.t_0052", `${1 - instantMeetsCount}회 남음`) : i18n.t("auto.g_1508", "소진")})</span>
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
