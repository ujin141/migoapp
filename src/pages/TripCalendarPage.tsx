import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Plus, X, Check, Users, ChevronLeft, ChevronRight, Sparkles, MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { useChatContext } from "@/context/ChatContext";

// ─── Types ───────────────────────────────────────────────
interface TripPlan {
  id: string;
  destination: string;
  startDate: string; // "2026-MM-DD"
  endDate: string;
  emoji: string;
  color: string;
}
interface NearbyUser {
  id: string;
  name: string;
  photo: string;
  destination: string;
  startDate: string;
  endDate: string;
  overlapDays: number;
  verified?: boolean;
}

// ─── Tiny calendar helpers ────────────────────────────────

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function dateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function isBetween(date: string, start: string, end: string) {
  return date >= start && date <= end;
}

// ─── AddTripModal ─────────────────────────────────────────
interface AddTripModalProps {
  onClose: () => void;
  onAdd: (trip: TripPlan) => void;
}
const getPalette = (t: any) => [{
  color: "#f43f5e",
  label: i18n.t("trip.colorRose")
}, {
  color: "#f97316",
  label: i18n.t("trip.colorOrange")
}, {
  color: "#6366f1",
  label: i18n.t("trip.colorIndigo")
}, {
  color: "#10b981",
  label: i18n.t("trip.colorEmerald")
}, {
  color: "#8b5cf6",
  label: i18n.t("trip.colorPurple")
}, {
  color: "#0ea5e9",
  label: i18n.t("trip.colorSky")
}];
const EMOJIS = ["✈️", "🏖️", "🏔️", "☕", "🎭", "🏄", "🌸", "🌿", "🎒", "🍜"];
const AddTripModal = ({
  onClose,
  onAdd
}: AddTripModalProps) => {
  const {
    t
  } = useTranslation();
  const PALETTE = getPalette(t);
  const [dest, setDest] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [color, setColor] = useState(PALETTE[0].color);
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const handleAdd = () => {
    if (!dest.trim() || !start || !end) {
      toast({
        title: t("trip.fillAll"),
        variant: "destructive"
      });
      return;
    }
    if (start > end) {
      toast({
        title: t("trip.dateError"),
        variant: "destructive"
      });
      return;
    }
    onAdd({
      id: Date.now().toString(),
      destination: dest,
      startDate: start,
      endDate: end,
      emoji,
      color
    });
    onClose();
  };
  return <motion.div className="fixed inset-0 z-[70] flex items-end justify-center px-safe pb-safe pt-safe" initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} exit={{
    opacity: 0
  }}>
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-md" onClick={onClose} />
      <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 p-6 pb-12 shadow-float" initial={{
      y: "100%"
    }} animate={{
      y: 0
    }} exit={{
      y: "100%"
    }} transition={{
      type: "spring",
      damping: 28,
      stiffness: 300
    }}>

        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
        <h3 className="text-lg font-extrabold text-foreground mb-4 truncate">{t("trip.newTrip")}</h3>

        {/* Destination */}
        <div className="mb-3">
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t("trip.destination")}</label>
          <div className="flex items-center gap-2 bg-muted rounded-2xl px-4 py-3">
            <MapPin size={15} className="text-primary shrink-0" />
            <input type="text" value={dest} onChange={e => setDest(e.target.value)} placeholder={t("trip.destPlaceholder")} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t("trip.startDate")}</label>
            <input type="date" value={start} onChange={e => setStart(e.target.value)} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t("trip.endDate")}</label>
            <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground outline-none" />
          </div>
        </div>

        {/* Emoji */}
        <div className="mb-4">
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t("trip.emoji")}</label>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map(e => <button key={e} onClick={() => setEmoji(e)} className={`w-10 h-10 rounded-xl text-lg transition-all ${emoji === e ? "bg-primary/20 ring-2 ring-primary" : "bg-muted"}`}>
                {e}
              </button>)}
          </div>
        </div>

        {/* Color */}
        <div className="mb-6">
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t("trip.color")}</label>
          <div className="flex gap-2">
            {PALETTE.map(p => <button key={p.color} onClick={() => setColor(p.color)} className="w-8 h-8 rounded-full transition-transform active:scale-90 flex items-center justify-center" style={{
            backgroundColor: p.color
          }}>
                {color === p.color && <Check size={14} className="text-white" strokeWidth={3} />}
              </button>)}
          </div>
        </div>

        <motion.button whileTap={{
        scale: 0.97
      }} onClick={handleAdd} className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-sm shadow-float flex items-center justify-center gap-2">
          <Plus size={18} /> {t("trip.addBtn")}
        </motion.button>
      </motion.div>
    </motion.div>;
};

// ─── Overlap days calculator ─────────────────────────────
function calcOverlapDays(s1: string, e1: string, s2: string, e2: string): number {
  const overlapStart = s1 > s2 ? s1 : s2;
  const overlapEnd = e1 < e2 ? e1 : e2;
  if (overlapStart > overlapEnd) return 0;
  const ms = new Date(overlapEnd).getTime() - new Date(overlapStart).getTime();
  return Math.round(ms / 86400000) + 1;
}

// ─── Main Page ────────────────────────────────────────────
const TripCalendarPage = () => {
  const {
    t
  } = useTranslation();
  const getArr = (k: string, fb: string[]) => {
    const v = t(k, {
      returnObjects: true
    });
    return Array.isArray(v) && v.length ? v : fb;
  };
  const DAYS = getArr("trip.days", [t("auto.g_1044", "일8"), t("auto.g_1045", "월9"), t("auto.g_1046", "화"), t("auto.g_1047", "수"), t("auto.g_1048", "목"), t("auto.g_1049", "금"), t("auto.g_1050", "토")]);
  const MONTHS = getArr("trip.months", [t("auto.g_1051", "1월"), t("auto.g_1052", "2월"), t("auto.g_1053", "3월"), t("auto.g_1054", "4월"), t("auto.g_1055", "5월"), t("auto.g_1056", "6월"), t("auto.g_1057", "7월"), t("auto.g_1058", "8월"), t("auto.g_1059", "9월"), t("auto.g_1060", "10월"), t("auto.g_1061", "11월"), t("auto.g_1062", "12월")]);
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [trips, setTrips] = useState<TripPlan[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [tab, setTab] = useState<"calendar" | "overlap">("calendar");
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const days = daysInMonth(viewYear, viewMonth);
  const firstDay = firstDayOfMonth(viewYear, viewMonth);
  useEffect(() => {
    if (!user) return;
    const fetchNearby = async (myTrips: TripPlan[]) => {
      const {
        data
      } = await supabase.from('trips').select('*, profiles(name, photo_url, verified)').neq('user_id', user.id).limit(20);
      if (data) {
        const withOverlap = data.map((d: any) => {
          const overlap = myTrips.reduce((max, myT) => {
            const o = calcOverlapDays(myT.startDate, myT.endDate, d.start_date, d.end_date);
            return o > max ? o : max;
          }, 0);
          return {
            id: d.user_id,
            name: d.profiles?.name || t('trip.anonymous'),
            photo: d.profiles?.photo_url || "",
            destination: d.destination,
            startDate: d.start_date,
            endDate: d.end_date,
            overlapDays: overlap,
            verified: d.profiles?.verified || false
          };
        }).filter(u => u.overlapDays > 0);
        setNearbyUsers(withOverlap);
      }
    };
    const fetchAll = async () => {
      const {
        data: tripData
      } = await supabase.from('trips').select('*').eq('user_id', user.id);
      const formatted: TripPlan[] = tripData ? tripData.map(d => ({
        id: d.id,
        destination: d.destination,
        startDate: d.start_date,
        endDate: d.end_date,
        emoji: d.emoji || '🛫',
        color: d.color || '#6366f1'
      })) : [];
      setTrips(formatted);
      fetchNearby(formatted);
    };
    fetchAll();
  }, [user]);
  const sendDM = async (targetUserId: string, targetName: string) => {
    if (!user) return;
    try {
      // 기존 DM 스레드 확인
      const {
        data: existing
      } = await supabase.from('chat_members').select('thread_id').eq('user_id', user.id);
      const myThreadIds = (existing || []).map((r: any) => r.thread_id);
      if (myThreadIds.length > 0) {
        const {
          data: shared
        } = await supabase.from('chat_members').select('thread_id').eq('user_id', targetUserId).in('thread_id', myThreadIds).limit(1);
        if (shared && shared.length > 0) {
          navigate("/chat");
          return;
        }
      }
      // 새 DM 스레드 생성
      const {
        data: newThread
      } = await supabase.from('chat_threads').insert({
        is_group: false
      }).select().single();
      if (newThread) {
        await supabase.from('chat_members').insert([{
          thread_id: newThread.id,
          user_id: user.id
        }, {
          thread_id: newThread.id,
          user_id: targetUserId
        }]);
      }
      toast({
        title: t("trip.chatStarted", {
          name: targetName
        })
      });
      navigate('/chat');
    } catch {
      toast({
        title: t("trip.msgSent", {
          name: targetName
        })
      });
      navigate('/chat');
    }
  };
  const handleAddTrip = async (trip: TripPlan) => {
    if (!user) return;
    const {
      data
    } = await supabase.from('trips').insert({
      user_id: user.id,
      destination: trip.destination,
      start_date: trip.startDate,
      end_date: trip.endDate,
      emoji: trip.emoji,
      color: trip.color
    }).select().single();
    if (data) {
      setTrips(prev => [...prev, {
        id: data.id,
        destination: data.destination,
        startDate: data.start_date,
        endDate: data.end_date,
        emoji: data.emoji || '🛫',
        color: data.color || '#6366f1'
      }]);
      toast({
        title: t("trip.added", {
          dest: trip.destination
        })
      });
    }
  };
  const removeTrip = async (id: string) => {
    await supabase.from('trips').delete().eq('id', id);
    setTrips(prev => prev.filter(t => t.id !== id));
    toast({
      title: t("trip.deleted")
    });
  };

  // Which trips cover a given date?
  const tripsOnDay = (day: number) => {
    const d = dateStr(viewYear, viewMonth, day);
    return trips.filter(t => isBetween(d, t.startDate, t.endDate));
  };

  // How many nearby users overlap on a specific day?
  const overlapUsersOnDay = (day: number) => {
    const d = dateStr(viewYear, viewMonth, day);
    return nearbyUsers.filter(u => isBetween(d, u.startDate, u.endDate)).length;
  };
  return <div className="min-h-screen bg-background safe-bottom pb-24 truncate">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center active:scale-90 transition-transform">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-foreground truncate">{t("tripCalendar.title")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{t('trip.subtitle')}</p>
        </div>
        <motion.button whileTap={{
        scale: 0.92
      }} onClick={() => setShowAddModal(true)} className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-card">
          <Plus size={18} className="text-primary-foreground" />
        </motion.button>
      </header>

      {/* Tabs */}
      <div className="flex mx-5 mb-4 bg-muted rounded-2xl p-1 truncate">
        {(["calendar", "overlap"] as const).map(tabItem => <button key={tabItem} onClick={() => setTab(tabItem)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${tab === tabItem ? "bg-card text-foreground shadow-card" : "text-muted-foreground"}`}>
            {tabItem === "calendar" ? t("trip.tabMine") : t("trip.tabOverlap")}
          </button>)}
      </div>

      {/* ── CALENDAR TAB ── */}
      {tab === "calendar" && <div className="px-5 space-y-4">
          {/* Month navigation */}
          <div className="bg-card rounded-3xl p-4 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => {
            if (viewMonth === 0) {
              setViewMonth(11);
              setViewYear(y => y - 1);
            } else setViewMonth(m => m - 1);
          }} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center active:scale-90">
                <ChevronLeft size={16} className="text-foreground" />
              </button>
              <span className="text-base font-extrabold text-foreground">
                {viewYear} {MONTHS[viewMonth]}
              </span>
              <button onClick={() => {
            if (viewMonth === 11) {
              setViewMonth(0);
              setViewYear(y => y + 1);
            } else setViewMonth(m => m + 1);
          }} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center active:scale-90">
                <ChevronRight size={16} className="text-foreground" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2 truncate">
              {DAYS.map(d => <div key={d} className={`text-center text-[10px] font-bold py-1 ${d === t("trip.days", {
            returnObjects: true
          })[0] ? "text-rose-400" : d === t("trip.days", {
            returnObjects: true
          })[6] ? "text-blue-400" : "text-muted-foreground"}`}>
                  {d}
                </div>)}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-1 truncate">
              {Array.from({
            length: firstDay
          }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({
            length: days
          }).map((_, i) => {
            const day = i + 1;
            const dayDate = dateStr(viewYear, viewMonth, day);
            const todayStr = today.toISOString().split("T")[0];
            const isToday = dayDate === todayStr;
            const coveredBy = tripsOnDay(day);
            const dotColors = coveredBy.map(t => t.color);
            return <div key={day} className="flex flex-col items-center py-1">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-semibold transition-all ${isToday ? "gradient-primary text-primary-foreground font-extrabold shadow-card" : coveredBy.length > 0 ? "bg-primary/10 text-foreground" : "text-foreground"}`}>
                      {day}
                    </div>
                    {dotColors.length > 0 && <div className="flex gap-0.5 mt-0.5">
                        {dotColors.slice(0, 2).map((c, ci) => <div key={ci} className="w-1.5 h-1.5 rounded-full" style={{
                  backgroundColor: c
                }} />)}
                      </div>}
                  </div>;
          })}
            </div>
          </div>

          {/* My trip list */}
          <div className="truncate">
            <h3 className="text-sm font-extrabold text-foreground mb-2 px-1 truncate">{t("trip.myTrips", {
            count: trips.length
          })}</h3>
            {trips.length === 0 ? <div className="bg-card rounded-3xl p-8 text-center shadow-card">
                <div className="text-4xl mb-2">🗺️</div>
                <p className="text-sm text-muted-foreground truncate">{t("trip.noTrips")}</p>
                <button onClick={() => setShowAddModal(true)} className="mt-3 text-primary text-sm font-bold">+ {t("trip.addBtn")}</button>
              </div> : <div className="space-y-2">
                {trips.map(trip => <motion.div key={trip.id} layout className="bg-card rounded-2xl p-4 flex items-center gap-3 shadow-card">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{
              backgroundColor: `${trip.color}20`,
              border: `1.5px solid ${trip.color}40`
            }}>
                      {trip.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{trip.destination}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {trip.startDate.slice(5).replace("-", "/")} ~ {trip.endDate.slice(5).replace("-", "/")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{
                backgroundColor: trip.color
              }} />
                      <button onClick={() => removeTrip(trip.id)} className="w-7 h-7 rounded-xl bg-muted flex items-center justify-center active:scale-90">
                        <X size={13} className="text-muted-foreground" />
                      </button>
                    </div>
                  </motion.div>)}
              </div>}
          </div>
        </div>}

      {/* ── OVERLAP TAB ── */}
      {tab === "overlap" && <div className="px-5 space-y-3 truncate">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-primary" />
              <p className="text-xs font-extrabold text-primary truncate">{t("trip.overlapTitle")}</p>
            </div>
            <p className="text-xs text-muted-foreground truncate">{t("trip.overlapDesc")}</p>
          </div>

          {nearbyUsers.map(user => <motion.div key={user.id} layout initial={{
        opacity: 0,
        y: 8
      }} animate={{
        opacity: 1,
        y: 0
      }} className="bg-card rounded-2xl p-4 flex items-center gap-3 shadow-card">
              {/* Avatar */}
              <div className="relative shrink-0">
                <img src={user.photo} alt={user.name} className="w-14 h-14 rounded-2xl object-cover" />
                {user.verified && <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-card">
                    <Check size={9} className="text-white" strokeWidth={3} />
                  </div>}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="font-bold text-sm text-foreground">{user.name}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{
              backgroundColor: "rgba(99,102,241,0.15)",
              color: "#6366f1"
            }}>
                    {user.destination}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {user.startDate.slice(5).replace("-", "/")} ~ {user.endDate.slice(5).replace("-", "/")}
                </p>
                <div className="flex items-center gap-1 mt-1.5">
                  <Calendar size={10} className="text-primary" />
                  <span className="text-[11px] font-bold text-primary truncate">{t("trip.overlapDays", {
                days: user.overlapDays
              })}</span>
                </div>
              </div>

              <motion.button whileTap={{
          scale: 0.9
        }} onClick={() => sendDM(user.id, user.name)} className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-card shrink-0">
                <MessageCircle size={16} className="text-primary-foreground" />
              </motion.button>
            </motion.div>)}

          {/* Overlap heatmap summary */}
          <div className="bg-card rounded-2xl p-4 shadow-card">
            <p className="text-xs font-bold text-muted-foreground mb-3 truncate">{t("trip.monthAvail")}</p>
            <div className="flex items-end gap-1 h-12">
              {Array.from({
            length: days
          }).map((_, i) => {
            const overlapCount = overlapUsersOnDay(i + 1);
            const h = Math.min(3, overlapCount); // Cap height logic (0~3)
            return <div key={i} className="flex-1 rounded-sm transition-all" style={{
              height: `${(h + 1) * 25}%`,
              backgroundColor: h === 0 ? "var(--muted)" : h === 1 ? "rgba(99,102,241,0.3)" : h === 2 ? "rgba(99,102,241,0.6)" : "#6366f1"
            }} />;
          })}
            </div>
            <div className="flex items-center gap-3 mt-2 truncate">
              {[{
            color: "var(--muted)",
            label: t("trip.availNone")
          }, {
            color: "rgba(99,102,241,0.3)",
            label: t("trip.availOne")
          }, {
            color: "rgba(99,102,241,0.6)",
            label: t("trip.availTwo")
          }, {
            color: "#6366f1",
            label: t("trip.availMany")
          }].map(item => <div key={item.label} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{
              backgroundColor: item.color
            }} />
                  <span className="text-[9px] text-muted-foreground">{item.label}</span>
                </div>)}
            </div>
          </div>
        </div>}

      {/* Add modal */}
      <AnimatePresence>
        {showAddModal && <AddTripModal onClose={() => setShowAddModal(false)} onAdd={handleAddTrip} />}
      </AnimatePresence>
    </div>;
};
export default TripCalendarPage;