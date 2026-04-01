import i18n from "@/i18n";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, Check, Flame, Users, Globe, Smile, Map, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

export type ActivityType = "투어" | "맛집" | "카페" | "클럽" | null;
export type GenderRatio = "any" | "2남2여" | "3남1여" | "1남3여" | "all-male" | "all-female";
export type LanguagePref = "any" | "korean" | "foreign" | "mixed";
export type GroupVibe = "any" | "편한" | "파티" | "진지";
export interface GroupDetailFilterState {
  activity: ActivityType;
  genderRatio: GenderRatio;
  language: LanguagePref;
  vibe: GroupVibe;
  checkInOnly: boolean;
}
export const DEFAULT_GROUP_DETAIL_FILTER: GroupDetailFilterState = {
  activity: null,
  genderRatio: "any",
  language: "any",
  vibe: "any",
  checkInOnly: false
};
interface GroupDetailFilterProps {
  open: boolean;
  onClose: () => void;
  value: GroupDetailFilterState;
  onChange: (v: GroupDetailFilterState) => void;
  checkInCity?: string | null;
}

const getActivities = (t: any): { id: ActivityType; emoji: string; label: string; color: string; bg: string; }[] => [
  { id: "투어", emoji: "🗺️", label: t("gdf.tour"), color: "text-emerald-600", bg: "bg-emerald-500/15 border-emerald-500/40" },
  { id: "맛집", emoji: "🍜", label: t("gdf.food"), color: "text-orange-600", bg: "bg-orange-500/15 border-orange-500/40" },
  { id: "카페", emoji: "☕", label: t("gdf.cafe"), color: "text-amber-600", bg: "bg-amber-500/15 border-amber-500/40" },
  { id: "클럽", emoji: "🎶", label: t("gdf.club"), color: "text-purple-600", bg: "bg-purple-500/15 border-purple-500/40" }
];
const getGenderRatios = (t: any): { id: GenderRatio; label: string; icon: string; }[] => [
  { id: "any", label: t("gdf.any"), icon: "✨" },
  { id: "2남2여", label: t("gdf.g_2m2f"), icon: "👫" },
  { id: "3남1여", label: t("gdf.g_3m1f"), icon: "👨‍👨‍👧" },
  { id: "1남3여", label: t("gdf.g_1m3f"), icon: "👩‍👩‍��" },
  { id: "all-male", label: t("gdf.g_all_m"), icon: "🙋‍♂️" },
  { id: "all-female", label: t("gdf.g_all_f"), icon: "🙋‍♀️" }
];
const getLanguages = (t: any): { id: LanguagePref; label: string; icon: string; desc: string; }[] => [
  { id: "any", label: t("gdf.l_any"), icon: "🌐", desc: t("gdf.l_any_desc") },
  { id: "korean", label: t("gdf.l_ko"), icon: "🇰🇷", desc: t("gdf.l_ko_desc") },
  { id: "foreign", label: t("gdf.l_for"), icon: "🌍", desc: t("gdf.l_for_desc") },
  { id: "mixed", label: t("gdf.l_mix"), icon: "🤝", desc: t("gdf.l_mix_desc") }
];
const getVibes = (t: any): { id: GroupVibe; label: string; icon: string; desc: string; color: string; }[] => [
  { id: "any", label: t("gdf.any"), icon: "✨", desc: t("gdf.v_any_desc"), color: "text-muted-foreground" },
  { id: "편한", label: t("gdf.v_cas"), icon: "😊", desc: t("gdf.v_cas_desc"), color: "text-emerald-600" },
  { id: "파티", label: t("gdf.v_party"), icon: "🎉", desc: t("gdf.v_party_desc"), color: "text-pink-600" },
  { id: "진지", label: t("gdf.v_ser"), icon: "🎯", desc: t("gdf.v_ser_desc"), color: "text-blue-600" }
];

export function countGroupDetailFilters(f: GroupDetailFilterState): number {
  return (f.activity !== null ? 1 : 0) + (f.genderRatio !== "any" ? 1 : 0) + (f.language !== "any" ? 1 : 0) + (f.vibe !== "any" ? 1 : 0) + (f.checkInOnly ? 1 : 0);
}

const GroupDetailFilter: React.FC<GroupDetailFilterProps> = ({ open, onClose, value, onChange, checkInCity }) => {
  const { t } = useTranslation();
  const [local, setLocal] = useState<GroupDetailFilterState>(value);
  useEffect(() => {
    if (open) setLocal(value);
  }, [open, value]);
  const activeCount = countGroupDetailFilters(local);
  const handleApply = () => { onChange(local); onClose(); };
  const handleReset = () => setLocal(DEFAULT_GROUP_DETAIL_FILTER);
  const set = <K extends keyof GroupDetailFilterState,>(key: K, val: GroupDetailFilterState[K]) => setLocal(prev => ({ ...prev, [key]: val }));
  
  const activities = getActivities(t);
  const genderRatios = getGenderRatios(t);
  const languages = getLanguages(t);
  const vibes = getVibes(t);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="gdf-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose} className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm" />
          <motion.div key="gdf-sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 320 }} className="fixed bottom-0 left-0 right-0 z-[60] max-w-lg mx-auto">
            <div className="bg-background rounded-3xl mb-4 sm:mb-8 shadow-2xl flex flex-col" style={{ maxHeight: "88dvh" }}>
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>
              <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center"><SlidersHorizontal size={13} className="text-primary" /></div>
                    <h2 className="text-lg font-extrabold text-foreground tracking-tight">{t("gdf.title")}</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 ml-9">{t("gdf.desc")}</p>
                </div>
                <div className="flex items-center gap-2">
                  {activeCount > 0 && <button onClick={handleReset} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all active:scale-95"><RotateCcw size={11} />{t("gdf.reset")}</button>}
                  <button onClick={onClose} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center transition-all active:scale-90"><X size={16} className="text-muted-foreground" /></button>
                </div>
              </div>

              <div className="overflow-y-scroll px-5 pb-4 space-y-6 flex-1 min-h-0">
                {checkInCity && (
                  <section>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => set("checkInOnly", !local.checkInOnly)} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${local.checkInOnly ? "border-transparent bg-emerald-500/10 shadow-sm" : "border-border bg-muted/40"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${local.checkInOnly ? "bg-emerald-500" : "bg-muted"}`}>
                          <Map size={16} className={local.checkInOnly ? "text-white" : "text-muted-foreground"} />
                        </div>
                        <div className="text-left">
                          <div className={`text-sm font-extrabold ${local.checkInOnly ? "text-emerald-600" : "text-foreground"}`}>{t("gdf.chk")}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{t("gdf.cur")}{checkInCity}{t("gdf.based")}</div>
                        </div>
                      </div>
                      <div className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${local.checkInOnly ? "bg-emerald-500" : "bg-border"}`}>
                        <motion.div animate={{ x: local.checkInOnly ? 24 : 2 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
                      </div>
                    </motion.button>
                  </section>
                )}
                {checkInCity && <div className="h-px bg-border" />}

                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center"><Flame size={13} className="text-orange-500" /></div>
                    <span className="text-sm font-bold text-foreground">{t("gdf.activity")}</span>
                    {local.activity && <span className="ml-auto text-xs text-orange-500 font-semibold flex items-center gap-1"><Check size={11} /> {activities.find(a => a.id === local.activity)?.label || local.activity}</span>}
                  </div>
                  <div className="flex gap-2 mb-2">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => set("activity", null)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${local.activity === null ? "border-transparent bg-rose-500/15 text-rose-600" : "border-border bg-muted/50 text-muted-foreground"}`}>{t("gdf.any")}</motion.button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {activities.map(act => {
                      const sel = local.activity === act.id;
                      return (
                        <motion.button key={act.id} whileTap={{ scale: 0.97 }} onClick={() => set("activity", sel ? null : act.id)} className={`relative flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all ${sel ? `border-transparent ${act.bg} shadow-sm` : "border-border bg-muted/40"}`}>
                          <span className="text-xl">{act.emoji}</span>
                          <span className={`text-sm font-bold ${sel ? act.color : "text-foreground"}`}>{act.label}</span>
                          {sel && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center"><Check size={8} className="text-white" strokeWidth={3} /></motion.div>}
                        </motion.button>
                      );
                    })}
                  </div>
                </section>
                <div className="h-px bg-border" />

                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-pink-500/15 flex items-center justify-center"><Users size={13} className="text-pink-500" /></div>
                    <span className="text-sm font-bold text-foreground">{t("gdf.gender")}</span>
                    {local.genderRatio !== "any" && <span className="ml-auto text-xs text-pink-500 font-semibold flex items-center gap-1"><Check size={11} /> {genderRatios.find(g => g.id === local.genderRatio)?.label}</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {genderRatios.map(gr => {
                      const sel = local.genderRatio === gr.id;
                      return (
                        <motion.button key={gr.id} whileTap={{ scale: 0.95 }} onClick={() => set("genderRatio", gr.id)} className={`relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all ${sel ? "border-transparent bg-pink-500/15 shadow-sm" : "border-border bg-muted/40"}`}>
                          <span className="text-lg">{gr.icon}</span>
                          <span className={`text-[11px] font-bold ${sel ? "text-pink-600" : "text-muted-foreground"}`}>{gr.label}</span>
                          {sel && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center"><Check size={8} className="text-white" strokeWidth={3} /></motion.div>}
                        </motion.button>
                      );
                    })}
                  </div>
                </section>
                <div className="h-px bg-border" />

                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center"><Globe size={13} className="text-blue-500" /></div>
                    <span className="text-sm font-bold text-foreground">{t("gdf.lang")}</span>
                    {local.language !== "any" && <span className="ml-auto text-xs text-blue-500 font-semibold flex items-center gap-1"><Check size={11} /> {languages.find(l => l.id === local.language)?.label}</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {languages.map(lang => {
                      const sel = local.language === lang.id;
                      return (
                        <motion.button key={lang.id} whileTap={{ scale: 0.97 }} onClick={() => set("language", lang.id)} className={`relative flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all ${sel ? "border-transparent bg-blue-500/15 shadow-sm" : "border-border bg-muted/40"}`}>
                          <span className="text-xl">{lang.icon}</span>
                          <div className="text-left">
                            <div className={`text-sm font-bold ${sel ? "text-blue-600" : "text-foreground"}`}>{lang.label}</div>
                            <div className="text-[10px] text-muted-foreground">{lang.desc}</div>
                          </div>
                          {sel && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center"><Check size={8} className="text-white" strokeWidth={3} /></motion.div>}
                        </motion.button>
                      );
                    })}
                  </div>
                </section>
                <div className="h-px bg-border" />

                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center"><Smile size={13} className="text-violet-500" /></div>
                    <span className="text-sm font-bold text-foreground">{t("gdf.vibe")}</span>
                    {local.vibe !== "any" && <span className="ml-auto text-xs text-violet-500 font-semibold flex items-center gap-1"><Check size={11} /> {vibes.find(v => v.id === local.vibe)?.label || local.vibe}</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {vibes.map(vibe => {
                      const sel = local.vibe === vibe.id;
                      return (
                        <motion.button key={vibe.id} whileTap={{ scale: 0.97 }} onClick={() => set("vibe", vibe.id)} className={`relative flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all ${sel ? "border-transparent bg-violet-500/15 shadow-sm" : "border-border bg-muted/40"}`}>
                          <span className="text-2xl">{vibe.icon}</span>
                          <div className="text-left">
                            <div className={`text-sm font-bold ${sel ? vibe.color : "text-foreground"}`}>{vibe.label}</div>
                            <div className="text-[10px] text-muted-foreground">{vibe.desc}</div>
                          </div>
                          {sel && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center"><Check size={8} className="text-white" strokeWidth={3} /></motion.div>}
                        </motion.button>
                      );
                    })}
                  </div>
                </section>
              </div>

              <div className="flex-shrink-0 bg-background border-t border-border px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleApply} className="w-full py-4 rounded-2xl font-extrabold text-base text-white shadow-lg gradient-primary relative overflow-hidden">
                  <motion.div className="absolute inset-0 bg-white/10" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} style={{ skewX: -20 }} />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {activeCount > 0 ? <><Check size={18} strokeWidth={3} />{t("gdf.apply")}{activeCount}{t("gdf.unit")}</> : t("gdf.all")}
                  </span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
export default GroupDetailFilter;
