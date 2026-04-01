import i18n from "@/i18n";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Calendar, Users, RotateCcw, Check, ChevronDown, Search } from "lucide-react";
import { useGlobalFilter } from "@/context/GlobalFilterContext";
import { useTranslation } from "react-i18next";

// ──────────────────────────────────────────────
// Popular destinations (quick select)
// ──────────────────────────────────────────────
const getPopularDestinations = (t: any) => [{
  emoji: "🗾",
  city: t("gf.c_tokyo"),
  label_city: t("gf.c_tokyo"),
  country: "일본",
  label_country: t("gf.n_jp")
}, {
  emoji: "🇰🇷",
  city: t("gf.c_seoul"),
  label_city: t("gf.c_seoul"),
  country: "한국",
  label_country: t("gf.n_kr")
}, {
  emoji: "🇹🇭",
  city: t("gf.c_bangkok"),
  label_city: t("gf.c_bangkok"),
  country: "태국",
  label_country: t("gf.n_th")
}, {
  emoji: "🌴",
  city: t("gf.c_bali"),
  label_city: t("gf.c_bali"),
  country: "인도네시아",
  label_country: t("gf.n_id")
}, {
  emoji: "🇻🇳",
  city: t("gf.c_danang"),
  label_city: t("gf.c_danang"),
  country: "베트남",
  label_country: t("gf.n_vn")
}, {
  emoji: "🇸🇬",
  city: t("gf.c_sg"),
  label_city: t("gf.c_sg"),
  country: "싱가포르",
  label_country: t("gf.n_sg")
}, {
  emoji: "🏯",
  city: t("gf.c_osaka"),
  label_city: t("gf.c_osaka"),
  country: "일본",
  label_country: t("gf.n_jp")
}, {
  emoji: "🇹🇼",
  city: t("gf.c_taipei"),
  label_city: t("gf.c_taipei"),
  country: "대만",
  label_country: t("gf.n_tw")
}, {
  emoji: "🗺️",
  city: t("gf.c_chiangmai"),
  label_city: t("gf.c_chiangmai"),
  country: "태국",
  label_country: t("gf.n_th")
}, {
  emoji: "🇵🇭",
  city: t("gf.c_cebu"),
  label_city: t("gf.c_cebu"),
  country: "필리핀",
  label_country: t("gf.n_ph")
}, {
  emoji: "🇪🇸",
  city: t("gf.c_bcn"),
  label_city: t("gf.c_bcn"),
  country: "스페인",
  label_country: t("gf.n_es")
}, {
  emoji: "🗼",
  city: t("gf.c_paris"),
  label_city: t("gf.c_paris"),
  country: "프랑스",
  label_country: t("gf.n_fr")
}];

// ──────────────────────────────────────────────
// Group size options
// ──────────────────────────────────────────────
const getGroupSizes = (t: any) => [{
  value: 2,
  label: t("auto.z_2\uBA85_652fc6"),
  icon: "👫"
}, {
  value: 3,
  label: t("auto.z_3\uBA85_38c9b2"),
  icon: "👨‍👩‍👦"
}, {
  value: 4,
  label: t("auto.z_4\uBA85_8b11ed"),
  icon: "👨‍👩‍👧‍👦"
}, {
  value: 5,
  label: t("auto.z_5\uBA85_234305"),
  icon: "🧑‍🤝‍🧑"
}, {
  value: 6,
  label: t("auto.z_6\uBA85_0f6d08"),
  icon: "👥"
}];

// ──────────────────────────────────────────────
// Date helpers
// ──────────────────────────────────────────────
const getWeekdays = (t: any) => [t("gf.w_sun"), t("gf.w_mon"), t("gf.w_tue"), t("gf.w_wed"), t("gf.w_thu"), t("gf.w_fri"), t("gf.w_sat")];
const getMonths = (t: any) => [t("gf.m_1"), t("gf.m_2"), t("gf.m_3"), t("gf.m_4"), t("gf.m_5"), t("gf.m_6"), t("gf.m_7"), t("gf.m_8"), t("gf.m_9"), t("gf.m_10"), t("gf.m_11"), t("gf.m_12")];
const today = () => new Date();
const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};
const fmt = (d: Date) => d.toISOString().split("T")[0];
const getDatePresets = (t: any) => [{
  label: t("auto.z_\uC774\uBC88\uC8FC\uB9D0_4eb8f2"),
  start: () => {
    const d = today();
    const diff = (6 - d.getDay() + 7) % 7 || 7;
    return fmt(addDays(d, diff));
  },
  end: () => {
    const d = today();
    const diff = (7 - d.getDay() + 7) % 7 || 7;
    return fmt(addDays(d, diff));
  }
}, {
  label: t("auto.z_\uB2E4\uC74C\uC8FC_415e52"),
  start: () => {
    const d = today();
    return fmt(addDays(d, 7 - d.getDay() + 1));
  },
  end: () => {
    const d = today();
    return fmt(addDays(d, 7 - d.getDay() + 7));
  }
}, {
  label: t("auto.z_\uC774\uBC88\uB2EC_35cb7d"),
  start: () => fmt(today()),
  end: () => {
    const d = today();
    return fmt(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  }
}, {
  label: t("auto.z_\uB2E4\uC74C\uB2EC_56cafa"),
  start: () => {
    const d = today();
    return fmt(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  },
  end: () => {
    const d = today();
    return fmt(new Date(d.getFullYear(), d.getMonth() + 2, 0));
  }
}];
function CalendarMonth({
  year,
  month,
  startDate,
  endDate,
  onSelect,
  weekdays
}: {
  year: number;
  month: number;
  startDate: string | null;
  endDate: string | null;
  onSelect: (s: string) => void;
  weekdays: string[];
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = fmt(today());
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({
    length: daysInMonth
  }, (_, i) => i + 1)];
  return <div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {weekdays.map((w, i) => <div key={i} className={`text-center text-[10px] font-semibold pb-1 ${i === 0 ? "text-rose-400" : i === 6 ? "text-blue-400" : "text-muted-foreground"}`}>{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, idx) => {
        if (!day) return <div key={`e-${idx}`} />;
        const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const isPast = ds < todayStr;
        const isStart = ds === startDate;
        const isEnd = ds === endDate;
        const isInRange = startDate && endDate && ds > startDate && ds < endDate;
        const isToday = ds === todayStr;
        return <button key={ds} disabled={isPast} onClick={() => onSelect(ds)} className={`relative h-8 w-full rounded-lg text-xs font-medium transition-all active:scale-95
                ${isPast ? "opacity-25 cursor-not-allowed" : "cursor-pointer"}
                ${isStart || isEnd ? "gradient-primary text-white font-bold shadow-sm" : ""}
                ${isInRange ? "bg-primary/15 text-primary rounded-none" : ""}
                ${!isStart && !isEnd && !isInRange && !isPast ? "hover:bg-muted text-foreground" : ""}
                ${isStart ? "rounded-r-none" : ""}
                ${isEnd ? "rounded-l-none" : ""}
                ${isToday && !isStart && !isEnd ? "ring-1 ring-primary/40" : ""}
              `}>
              {day}
              {isToday && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />}
            </button>;
      })}
      </div>
    </div>;
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────
interface GlobalFilterProps {
  open: boolean;
  onClose: () => void;
}
const GlobalFilter: React.FC<GlobalFilterProps> = ({
  open,
  onClose
}) => {
  const {
    filters,
    setDestination,
    setDateRange,
    setGroupSize,
    resetFilters
  } = useGlobalFilter();
  const [localDest, setLocalDest] = useState<string | null>(filters.destination);
  const [destSearch, setDestSearch] = useState("");
  const [localStart, setLocalStart] = useState<string | null>(filters.dateRange.start);
  const [localEnd, setLocalEnd] = useState<string | null>(filters.dateRange.end);
  const [localGroupSize, setLocalGroupSize] = useState<number | null>(filters.groupSize);
  const nowDate = today();
  const [calYear, setCalYear] = useState(nowDate.getFullYear());
  const [calMonth, setCalMonth] = useState(nowDate.getMonth());
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const popDestinations = getPopularDestinations(t);
  const groupSizes = getGroupSizes(t);
  const weekdays = getWeekdays(t);
  const months = getMonths(t);
  const datePresets = getDatePresets(t);

  useEffect(() => {
    if (open) {
      setLocalDest(filters.destination);
      setDestSearch(""); // search box always starts blank

      setLocalStart(filters.dateRange.start);
      setLocalEnd(filters.dateRange.end);
      setLocalGroupSize(filters.groupSize);
    }
  }, [open]);

  // Popular grid is always all 12 cities — only search box filters
  const filteredPopular = destSearch.trim() ? popDestinations.filter(d => d.city.includes(destSearch) || d.country.includes(destSearch) || d.city.toLowerCase().includes(destSearch.toLowerCase())) : popDestinations;
  const handleDestSelect = (city: string) => {
    // Only toggle selection — does NOT change the search input
    setLocalDest(prev => prev === city ? null : city);
  };
  const handleSearchChange = (v: string) => {
    setDestSearch(v);
    // If cleared, reset dest selection
    if (!v) setLocalDest(null);else setLocalDest(v); // free-text destination
  };
  const handleDateSelect = (dateStr: string) => {
    if (!localStart || localStart && localEnd) {
      setLocalStart(dateStr);
      setLocalEnd(null);
    } else {
      if (dateStr < localStart) {
        setLocalStart(dateStr);
        setLocalEnd(null);
      } else setLocalEnd(dateStr);
    }
  };
  const handleApply = () => {
    setDestination(localDest);
    setDateRange({
      start: localStart,
      end: localEnd
    });
    setGroupSize(localGroupSize);
    onClose();
  };
  const handleReset = () => {
    setLocalDest(null);
    setDestSearch("");
    setLocalStart(null);
    setLocalEnd(null);
    setLocalGroupSize(null);
    resetFilters();
  };
  const localActiveCount = (localDest ? 1 : 0) + (localStart || localEnd ? 1 : 0) + (localGroupSize !== null ? 1 : 0);
  const fmtKr = (d: string) => {
    const [, m, day] = d.split("-");
    const lang = i18n.language || "ko";
    if (lang.startsWith("ko") || lang.startsWith("ja") || lang.startsWith("zh")) {
      return `${parseInt(m)}${t("auto.z_\uC6D4_7c9d2f", { defaultValue: "월" })} ${parseInt(day)}${t("auto.z_\uC77C_5d2b7d", { defaultValue: "일" })}`;
    }
    return `${m}/${day}`;
  };
  const dateDisplay = localStart && localEnd ? `${fmtKr(localStart)} ~ ${fmtKr(localEnd)}` : localStart ? `${fmtKr(localStart)} ~` : null;
  return <AnimatePresence>
      {open && <>
          {/* Backdrop */}
          <motion.div key="gf-bd" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} transition={{
        duration: 0.2
      }} onClick={onClose} className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm pointer-events-auto" />

          {/* Sheet — motion.div IS the scroll container */}
          <motion.div key="gf-sheet" initial={{
        y: "100%"
      }} animate={{
        y: 0
      }} exit={{
        y: "100%"
      }} transition={{
        type: "spring",
        damping: 30,
        stiffness: 320
      }} className="fixed left-0 right-0 bottom-0 z-[60] max-w-lg mx-auto rounded-3xl mb-4 sm:mb-8 bg-background shadow-2xl" style={{
        maxHeight: "95vh",
        overflowY: "scroll",
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain"
      } as React.CSSProperties}>
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-background z-10">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header — sticky top */}
            <div className="sticky top-7 z-10 bg-background flex items-center justify-between px-5 py-3 border-b border-border/50">
              <div>
                <h2 className="text-lg font-extrabold text-foreground tracking-tight">{t("auto.z_\uC5EC\uD589\uD544\uD130_ef40d3")}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{t("auto.z_\uC6D0\uD558\uB294\uC5EC_063fc3")}</p>
              </div>
              <div className="flex items-center gap-2">
                {localActiveCount > 0 && <button onClick={handleReset} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all active:scale-95">
                    <RotateCcw size={11} />{t("auto.z_\uCD08\uAE30\uD654_2d7cf9")}</button>}
                <button onClick={onClose} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center transition-all active:scale-90">
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Scrollable content — just normal flow */}
            <div className="px-5 py-5 space-y-6">

              {/* Section 1: 여행지 검색 */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <MapPin size={14} className="text-emerald-500" />
                  </div>
                  <span className="text-sm font-bold text-foreground">{t("auto.z_\uC5EC\uD589\uC9C0_3d9769")}</span>
                  {localDest && <span className="ml-auto text-xs text-emerald-500 font-semibold flex items-center gap-1">
                      <Check size={11} /> {localDest}
                    </span>}
                </div>

                {/* Search input */}
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input ref={inputRef} type="text" value={destSearch} onChange={e => handleSearchChange(e.target.value)} placeholder={t("auto.z_\uB3C4\uCFC4\uD30C\uB9AC_8a3f30")} className="w-full bg-muted rounded-2xl pl-9 pr-9 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/60" />
                  {destSearch && <button onClick={() => {
                setDestSearch("");
                setLocalDest(null);
              }} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X size={13} className="text-muted-foreground" />
                    </button>}
                </div>

                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                  {destSearch ? t("gf.search_res") : t("gf.pop_city")}
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {filteredPopular.map(dest => {
                const sel = localDest === dest.city;
                return <motion.button key={dest.city} whileTap={{
                  scale: 0.95
                }} onClick={() => handleDestSelect(dest.city)} className={`relative flex-shrink-0 flex flex-col items-center gap-1 py-2 px-3 rounded-2xl border-2 transition-all ${sel ? "border-transparent bg-emerald-500/15 shadow-sm" : "border-border bg-muted/40"}`}>
                        <span className="text-xl">{dest.emoji}</span>
                        <span className={`text-[10px] font-bold whitespace-nowrap ${sel ? "text-emerald-600" : "text-foreground"}`}>{dest.city}</span>
                        {sel && <motion.div initial={{
                    scale: 0
                  }} animate={{
                    scale: 1
                  }} className="absolute top-1 right-1 w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check size={6} className="text-white" strokeWidth={3} />
                          </motion.div>}
                      </motion.button>;
              })}
                  {filteredPopular.length === 0 && <p className="text-xs text-muted-foreground py-2">"{destSearch}{t("auto.z_\uADF8\uB300\uB85C\uC801_fedcdd")}</p>}
                </div>
              </section>

              <div className="h-px bg-border" />

              {/* Section 2: 날짜 */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
                    <Calendar size={14} className="text-blue-500" />
                  </div>
                  <span className="text-sm font-bold text-foreground">{t("auto.z_\uB0A0\uC9DC_a93b53")}</span>
                  {dateDisplay && <span className="ml-auto text-xs text-blue-500 font-semibold">{dateDisplay}</span>}
                </div>
                <div className="flex gap-2 flex-wrap mb-4">
                  {datePresets.map(preset => {
                const pS = preset.start();
                const pE = preset.end();
                const active = localStart === pS && localEnd === pE;
                return <button key={preset.label} onClick={() => active ? (setLocalStart(null), setLocalEnd(null)) : (setLocalStart(pS), setLocalEnd(pE))} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 border ${active ? "gradient-primary text-white border-transparent shadow-sm" : "bg-muted border-border text-muted-foreground"}`}>
                        {preset.label}
                      </button>;
              })}
                </div>
                <div className="bg-muted/40 rounded-2xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => calMonth === 0 ? (setCalYear(y => y - 1), setCalMonth(11)) : setCalMonth(m => m - 1)} className="w-8 h-8 rounded-xl bg-background border border-border flex items-center justify-center active:scale-90">
                      <ChevronDown size={14} className="text-muted-foreground rotate-90" />
                    </button>
                    <span className="text-sm font-extrabold text-foreground">{calYear}{t("auto.z_\uB144_e29d2c")}{months[calMonth]}</span>
                    <button onClick={() => calMonth === 11 ? (setCalYear(y => y + 1), setCalMonth(0)) : setCalMonth(m => m + 1)} className="w-8 h-8 rounded-xl bg-background border border-border flex items-center justify-center active:scale-90">
                      <ChevronDown size={14} className="text-muted-foreground -rotate-90" />
                    </button>
                  </div>
                  <CalendarMonth year={calYear} month={calMonth} startDate={localStart} endDate={localEnd} onSelect={handleDateSelect} weekdays={weekdays} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-2 text-center">
                  {!localStart ? t("gf.sel_start") : !localEnd ? t("gf.sel_end") : dateDisplay}
                </p>
              </section>

              <div className="h-px bg-border" />

              {/* Section 3: 인원 수 */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
                    <Users size={14} className="text-purple-500" />
                  </div>
                  <span className="text-sm font-bold text-foreground">{t("auto.z_\uC778\uC6D0\uC218_553bc2")}</span>
                  {localGroupSize !== null && <span className="ml-auto text-xs text-purple-500 font-semibold flex items-center gap-1">
                      <Check size={11} /> {localGroupSize === 6 ? t("gf.s_6_more") : `${localGroupSize}${t("auto.z_\uBA85_db7391", { defaultValue: "명" })}`}
                    </span>}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <motion.button whileTap={{
                scale: 0.95
              }} onClick={() => setLocalGroupSize(null)} className={`flex-1 min-w-[60px] py-3 rounded-2xl flex flex-col items-center gap-1 transition-all border-2 ${localGroupSize === null ? "border-transparent bg-purple-500/15 shadow-sm" : "border-border bg-muted/50"}`}>
                    <span className="text-lg">✨</span>
                    <span className={`text-xs font-bold ${localGroupSize === null ? "text-purple-600" : "text-muted-foreground"}`}>{t("auto.z_\uC804\uCCB4_d1d0de")}</span>
                  </motion.button>
                  {groupSizes.map(gs => {
                const sel = localGroupSize === gs.value;
                return <motion.button key={gs.value} whileTap={{
                  scale: 0.95
                }} onClick={() => setLocalGroupSize(sel ? null : gs.value)} className={`flex-1 min-w-[60px] py-3 rounded-2xl flex flex-col items-center gap-1 transition-all border-2 relative overflow-hidden ${sel ? "border-transparent shadow-lg" : "border-border bg-muted/50"}`}>
                        {sel && <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 opacity-15" />}
                        <span className="text-lg relative z-10">{gs.icon}</span>
                        <span className={`text-xs font-bold relative z-10 ${sel ? "text-purple-600" : "text-muted-foreground"}`}>{gs.label}</span>
                        {sel && <motion.div initial={{
                    scale: 0
                  }} animate={{
                    scale: 1
                  }} className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                            <Check size={8} className="text-white" strokeWidth={3} />
                          </motion.div>}
                      </motion.button>;
              })}
                </div>
              </section>
            </div>

            {/* ── Apply button — sticky bottom ── */}
            <div className="sticky bottom-0 bg-background border-t border-border px-5 py-4" style={{
          paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))"
        }}>
              <motion.button whileTap={{
            scale: 0.97
          }} onClick={handleApply} className="w-full py-4 rounded-2xl font-extrabold text-base text-white shadow-lg gradient-primary relative overflow-hidden">
                <motion.div className="absolute inset-0 bg-white/10" animate={{
              x: ["-100%", "100%"]
            }} transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "linear"
            }} style={{
              skewX: -20
            }} />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {localActiveCount > 0 ? <><Check size={18} strokeWidth={3} />{t("auto.z_\uD544\uD130\uC801\uC6A9_a0bd26")}{localActiveCount}{t("auto.z_\uAC1C_d22b87")}</> : t("gf.view_all")}
                </span>
              </motion.button>
            </div>
          </motion.div>

        </>}
    </AnimatePresence>;
};
export default GlobalFilter;