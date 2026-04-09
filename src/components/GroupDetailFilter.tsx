import i18n from "@/i18n";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, Check, MapPin, Calendar, Users, Compass, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

// ─── Types ───────────────────────────────────────────────────────────────────
export type TravelStyle = "관광" | "맛집" | "자연" | "휴양" | "나이트라이프" | null;
export type TravelDuration = "1-3일" | "4-7일" | "1-2주" | "2주+" | null;
export type GenderPref = "any" | "mixed" | "female-only" | "male-only";

export interface GroupDetailFilterState {
  departureKeyword: string;   // 출발지 검색어
  destinationKeyword: string; // 목적지 검색어
  travelStyle: TravelStyle;   // 여행 스타일
  duration: TravelDuration;   // 여행 기간
  genderPref: GenderPref;     // 성비
}

export const DEFAULT_GROUP_DETAIL_FILTER: GroupDetailFilterState = {
  departureKeyword: "",
  destinationKeyword: "",
  travelStyle: null,
  duration: null,
  genderPref: "any",
};

interface GroupDetailFilterProps {
  open: boolean;
  onClose: () => void;
  value: GroupDetailFilterState;
  onChange: (v: GroupDetailFilterState) => void;
  checkInCity?: string | null;
}

export function countGroupDetailFilters(f: GroupDetailFilterState): number {
  return (
    (f.departureKeyword.trim() ? 1 : 0) +
    (f.destinationKeyword.trim() ? 1 : 0) +
    (f.travelStyle !== null ? 1 : 0) +
    (f.duration !== null ? 1 : 0) +
    (f.genderPref !== "any" ? 1 : 0)
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const TRAVEL_STYLES: { id: TravelStyle; emoji: string; label: string; color: string; bg: string }[] = [
  { id: i18n.t("auto.g_0022", "관광"),       emoji: "🗺️",  label: i18n.t("auto.g_0023", "관광 / 투어"),   color: "text-emerald-600", bg: "bg-emerald-500/15 border-emerald-500/40" },
  { id: i18n.t("auto.g_0024", "맛집"),       emoji: "🍜",  label: i18n.t("auto.g_0025", "맛집 탐방"),      color: "text-orange-600",  bg: "bg-orange-500/15 border-orange-500/40" },
  { id: i18n.t("auto.g_0026", "자연"),       emoji: "🏔️", label: i18n.t("auto.g_0027", "자연 / 액티비티"), color: "text-teal-600",    bg: "bg-teal-500/15 border-teal-500/40" },
  { id: i18n.t("auto.g_0028", "휴양"),       emoji: "🏖️", label: i18n.t("auto.g_0029", "휴양 / 힐링"),    color: "text-blue-600",    bg: "bg-blue-500/15 border-blue-500/40" },
  { id: i18n.t("auto.g_0030", "나이트라이프"), emoji: "🎉",  label: i18n.t("auto.g_0031", "나이트라이프"),   color: "text-purple-600",  bg: "bg-purple-500/15 border-purple-500/40" },
];

const DURATIONS: { id: TravelDuration; label: string; sub: string }[] = [
  { id: i18n.t("auto.g_0032", "1-3일"), label: i18n.t("auto.g_0033", "1–3일"),  sub: i18n.t("auto.g_0034", "짧은 여행") },
  { id: i18n.t("auto.g_0035", "4-7일"), label: i18n.t("auto.g_0036", "4–7일"),  sub: i18n.t("auto.g_0037", "일주일 내외") },
  { id: i18n.t("auto.g_0038", "1-2주"), label: i18n.t("auto.g_0039", "1–2주"),  sub: i18n.t("auto.g_0040", "알찬 여행") },
  { id: i18n.t("auto.g_0041", "2주+"),  label: i18n.t("auto.g_0042", "2주 이상"), sub: i18n.t("auto.g_0043", "장기 여행") },
];

const GENDER_OPTS: { id: GenderPref; emoji: string; label: string }[] = [
  { id: "any",         emoji: "✨", label: i18n.t("auto.g_0044", "상관없음") },
  { id: "mixed",       emoji: "👫", label: i18n.t("auto.g_0045", "혼성") },
  { id: "female-only", emoji: "🙋‍♀️", label: i18n.t("auto.g_0046", "여성만") },
  { id: "male-only",   emoji: "🙋‍♂️", label: i18n.t("auto.g_0047", "남성만") },
];

// ─── Component ────────────────────────────────────────────────────────────────
const GroupDetailFilter: React.FC<GroupDetailFilterProps> = ({ open, onClose, value, onChange }) => {
  const [local, setLocal] = useState<GroupDetailFilterState>(value);
  useEffect(() => { if (open) setLocal(value); }, [open, value]);

  const activeCount = countGroupDetailFilters(local);
  const handleApply = () => { onChange(local); onClose(); };
  const handleReset = () => setLocal(DEFAULT_GROUP_DETAIL_FILTER);
  const set = <K extends keyof GroupDetailFilterState>(key: K, val: GroupDetailFilterState[K]) =>
    setLocal(prev => ({ ...prev, [key]: val }));

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="gdf-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            key="gdf-sheet"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[110] max-w-lg mx-auto"
          >
            <div className="bg-background rounded-t-3xl shadow-2xl flex flex-col" style={{ maxHeight: "90dvh" }}>
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                      <SlidersHorizontal size={13} className="text-primary" />
                    </div>
                    <h2 className="text-lg font-extrabold text-foreground tracking-tight truncate">{i18n.t("auto.g_0012", "동행 필터")}</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 ml-9 truncate">{i18n.t("auto.g_0013", "원하는 여행 동행 조건을 설정하세요")}</p>
                </div>
                <div className="flex items-center gap-2 truncate">
                  {activeCount > 0 && (
                    <button onClick={handleReset} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all active:scale-95">
                      <RotateCcw size={11} /> {i18n.t("auto.g_0014", "초기화")}</button>
                  )}
                  <button onClick={onClose} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center transition-all active:scale-90">
                    <X size={16} className="text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto px-5 pb-4 space-y-6 flex-1 min-h-0">

                {/* ① 출발지 / 목적지 검색 */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/15 flex items-center justify-center">
                      <Compass size={13} className="text-sky-500" />
                    </div>
                    <span className="text-sm font-bold text-foreground truncate">{i18n.t("auto.g_0015", "출발지 / 목적지")}</span>
                  </div>
                  <div className="space-y-2">
                    {/* 출발지 */}
                    <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-2xl px-3.5 py-2.5 focus-within:border-sky-400 transition-all truncate">
                      <MapPin size={13} className="text-sky-500 shrink-0" />
                      <input
                        value={local.departureKeyword}
                        onChange={e => set("departureKeyword", e.target.value)}
                        placeholder={i18n.t("auto.g_0048", "출발지 입력 (예: 서울, 부산)")}
                        className="flex-1 bg-transparent text-[13px] font-semibold text-foreground placeholder:text-muted-foreground/60 outline-none"
                      />
                      {local.departureKeyword && (
                        <button onClick={() => set("departureKeyword", "")} className="w-4 h-4 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                          <X size={9} className="text-muted-foreground" />
                        </button>
                      )}
                    </div>
                    {/* 목적지 */}
                    <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-2xl px-3.5 py-2.5 focus-within:border-teal-400 transition-all truncate">
                      <span className="text-teal-500 text-sm shrink-0">✈</span>
                      <input
                        value={local.destinationKeyword}
                        onChange={e => set("destinationKeyword", e.target.value)}
                        placeholder={i18n.t("auto.g_0049", "목적지 입력 (예: 도쿄, 방콕)")}
                        className="flex-1 bg-transparent text-[13px] font-semibold text-foreground placeholder:text-muted-foreground/60 outline-none"
                      />
                      {local.destinationKeyword && (
                        <button onClick={() => set("destinationKeyword", "")} className="w-4 h-4 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                          <X size={9} className="text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>
                </section>

                <div className="h-px bg-border" />

                {/* ② 여행 스타일 */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center">
                      <span className="text-sm">🗺️</span>
                    </div>
                    <span className="text-sm font-bold text-foreground truncate">{i18n.t("auto.g_0016", "여행 스타일")}</span>
                    {local.travelStyle && (
                      <span className="ml-auto text-xs text-orange-500 font-semibold flex items-center gap-1">
                        <Check size={11} /> {TRAVEL_STYLES.find(s => s.id === local.travelStyle)?.label}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mb-2">
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => set("travelStyle", null)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${local.travelStyle === null ? "border-transparent bg-rose-500/15 text-rose-600" : "border-border bg-muted/50 text-muted-foreground"}`}
                    >{i18n.t("auto.g_0017", "전체")}</motion.button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 truncate">
                    {TRAVEL_STYLES.map(style => {
                      const sel = local.travelStyle === style.id;
                      return (
                        <motion.button key={style.id} whileTap={{ scale: 0.97 }}
                          onClick={() => set("travelStyle", sel ? null : style.id)}
                          className={`relative flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${sel ? `border-transparent ${style.bg} shadow-sm` : "border-border bg-muted/40"}`}
                        >
                          <span className="text-xl leading-none">{style.emoji}</span>
                          <span className={`text-[12px] font-bold ${sel ? style.color : "text-foreground"}`}>{style.label}</span>
                          {sel && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                              className="absolute top-2 right-2 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                              <Check size={8} className="text-white" strokeWidth={3} />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </section>

                <div className="h-px bg-border" />

                {/* ③ 여행 기간 */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
                      <Calendar size={13} className="text-blue-500" />
                    </div>
                    <span className="text-sm font-bold text-foreground truncate">{i18n.t("auto.g_0018", "여행 기간")}</span>
                    {local.duration && (
                      <span className="ml-auto text-xs text-blue-500 font-semibold flex items-center gap-1">
                        <Check size={11} /> {local.duration}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 truncate">
                    {DURATIONS.map(d => {
                      const sel = local.duration === d.id;
                      return (
                        <motion.button key={d.id} whileTap={{ scale: 0.97 }}
                          onClick={() => set("duration", sel ? null : d.id)}
                          className={`relative flex flex-col items-center py-3 px-2 rounded-2xl border-2 transition-all ${sel ? "border-transparent bg-blue-500/15 shadow-sm" : "border-border bg-muted/40"}`}
                        >
                          <span className={`text-[13px] font-extrabold ${sel ? "text-blue-600" : "text-foreground"}`}>{d.label}</span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">{d.sub}</span>
                          {sel && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                              className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                              <Check size={8} className="text-white" strokeWidth={3} />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </section>

                <div className="h-px bg-border" />

                {/* ④ 성비 */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-pink-500/15 flex items-center justify-center">
                      <Users size={13} className="text-pink-500" />
                    </div>
                    <span className="text-sm font-bold text-foreground truncate">{i18n.t("auto.g_0019", "성비")}</span>
                    {local.genderPref !== "any" && (
                      <span className="ml-auto text-xs text-pink-500 font-semibold flex items-center gap-1">
                        <Check size={11} /> {GENDER_OPTS.find(g => g.id === local.genderPref)?.label}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 truncate">
                    {GENDER_OPTS.map(g => {
                      const sel = local.genderPref === g.id;
                      return (
                        <motion.button key={g.id} whileTap={{ scale: 0.95 }}
                          onClick={() => set("genderPref", g.id)}
                          className={`relative flex items-center gap-2.5 p-3 rounded-2xl border-2 transition-all ${sel ? "border-transparent bg-pink-500/15 shadow-sm" : "border-border bg-muted/40"}`}
                        >
                          <span className="text-lg leading-none">{g.emoji}</span>
                          <span className={`text-[12px] font-bold ${sel ? "text-pink-600" : "text-muted-foreground"}`}>{g.label}</span>
                          {sel && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                              className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center">
                              <Check size={8} className="text-white" strokeWidth={3} />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </section>

              </div>

              {/* Apply button */}
              <div className="flex-shrink-0 bg-background border-t border-border px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleApply}
                  className="w-full py-4 rounded-2xl font-extrabold text-base text-white shadow-lg gradient-primary relative overflow-hidden"
                >
                  <motion.div className="absolute inset-0 bg-white/10" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} style={{ skewX: -20 }} />
                  <span className="relative z-10 flex items-center justify-center gap-2 truncate">
                    {activeCount > 0 ? <><Check size={18} strokeWidth={3} />{i18n.t("auto.g_0020", "필터 적용 (")}{activeCount}{i18n.t("auto.g_0021", "개)")}</>: i18n.t("auto.g_0050", "전체 동행 보기")}
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
