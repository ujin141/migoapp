import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle, MapPin, Clock, User, RefreshCw, X } from "lucide-react";
import { fetchSafetyCheckins, resolveSafetyCheckin } from "@/lib/adminService";

export const AdminSafetyCheckins = () => {
  const { t } = useTranslation();
  const [checkins, setCheckins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "sos" | "resolved">("all");
  const [selected, setSelected] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await fetchSafetyCheckins();
    setCheckins(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = checkins.filter(c => {
    if (filter === "sos") return c.is_sos && c.status !== "resolved";
    if (filter === "active") return c.status === "active" && !c.is_sos;
    if (filter === "resolved") return c.status === "resolved";
    return true;
  });

  const handleResolve = async (id: string) => {
    const ok = await resolveSafetyCheckin(id);
    if (ok) {
      setCheckins(prev => prev.map(c => c.id === id ? { ...c, status: "resolved" } : c));
      if (selected?.id === id) setSelected((prev: any) => ({ ...prev, status: "resolved" }));
    }
  };

  const sosCount = checkins.filter(c => c.is_sos && c.status !== "resolved").length;
  const activeCount = checkins.filter(c => c.status === "active").length;
  const resolvedCount = checkins.filter(c => c.status === "resolved").length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Shield size={22} className="text-emerald-400" />
            {"안전체크인"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {"안전체크인관리설명"}
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-muted-foreground text-sm hover:text-foreground transition-colors">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {"새로고침8"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "긴급SOS", value: sosCount, color: "from-red-500 to-rose-600", icon: AlertTriangle, urgent: sosCount > 0 },
          { label: "활성체크인", value: activeCount, color: "from-blue-500 to-cyan-500", icon: MapPin, urgent: false },
          { label: "처리완료", value: resolvedCount, color: "from-emerald-500 to-green-500", icon: CheckCircle, urgent: false },
        ].map(s => (
          <div key={s.label} className={`bg-card rounded-2xl p-4 border flex items-center gap-4 ${s.urgent ? "border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]" : "border-border"}`}>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0`}>
              <s.icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground break-keep">{s.label}</p>
            </div>
            {s.urgent && <span className="ml-auto px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold animate-pulse">⚠️ {"긴급SOS"}</span>}
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {[
          { id: "all" as const, label: "전체565" },
          { id: "sos" as const, label: `🆘 SOS (${sosCount})` },
          { id: "active" as const, label: "활성828" },
          { id: "resolved" as const, label: "처리완료" },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
            const userName = profile?.name || c.userName || "알수없음8";
            const userPhoto = profile?.photo_url || c.userPhoto;
            const timeAgo = new Date(c.created_at || c.checked_at || Date.now());
            const minsAgo = Math.floor((Date.now() - timeAgo.getTime()) / 60000);
            return (
              <motion.div key={c.id} layout
                className={`bg-card rounded-2xl border p-4 cursor-pointer hover:border-primary/30 transition-all ${c.is_sos && c.status !== "resolved" ? "border-red-500/40 shadow-[0_0_16px_rgba(239,68,68,0.1)]" : "border-border"}`}
                onClick={() => setSelected(c)}>
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    {userPhoto ? (
                      <img src={userPhoto} className="w-11 h-11 rounded-full object-cover" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center">
                        <User size={18} className="text-muted-foreground" />
                      </div>
                    )}
                    {c.is_sos && c.status !== "resolved" && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold animate-pulse">!</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-foreground text-sm">{userName}</span>
                      {c.is_sos && c.status !== "resolved" && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold">🆘 SOS</span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.status === "resolved" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"}`}>
                        {c.status === "resolved"
                          ? "처리완료"
                          : "활성828"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin size={10} />{c.location_name || "위치없음"}</span>
                      <span className="flex items-center gap-1"><Clock size={10} />{minsAgo < 60 ? `${minsAgo}m` : `${Math.floor(minsAgo / 60)}h`}</span>
                    </div>
                  </div>
                  {c.status !== "resolved" && (
                    <button onClick={e => { e.stopPropagation(); handleResolve(c.id); }}
                      className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors">
                      {"처리완료"}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-20 text-center text-sm text-muted-foreground">
              {filter === "sos"
                ? "긴급SOS없음"
                : filter === "resolved"
                ? "처리완료없음"
                : "체크인없음"}
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={() => setSelected(null)} />
            <motion.div className="relative z-10 w-full max-w-md bg-card rounded-3xl shadow-float border border-border p-6" initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-foreground">
                  {"체크인상세"}
                </h3>
                <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-muted"><X size={16} /></button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{"상태594"}</span>
                  <span className={`font-bold ${selected.status === "resolved" ? "text-emerald-400" : selected.is_sos ? "text-red-400" : "text-blue-400"}`}>
                    {selected.status === "resolved"
                      ? "처리완료"
                      : selected.is_sos ? "🆘 SOS"
                      : "활성828"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{"국가위치6"}</span>
                  <span className="font-bold text-foreground">{selected.location_name || "위치없음"}</span>
                </div>
                {selected.latitude && <div className="flex justify-between">
                  <span className="text-muted-foreground">{"좌표"}</span>
                  <span className="font-mono text-xs">{selected.latitude?.toFixed(4)}, {selected.longitude?.toFixed(4)}</span>
                </div>}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{"체크인시각"}</span>
                  <span>{new Date(selected.created_at || selected.checked_at).toLocaleString()}</span>
                </div>
                {selected.status !== "resolved" && (
                  <button onClick={() => { handleResolve(selected.id); setSelected(null); }}
                    className="w-full mt-2 py-3 rounded-2xl bg-emerald-500/10 text-emerald-400 font-bold hover:bg-emerald-500/20 transition-colors">
                    {"처리완료로변경"}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSafetyCheckins;
