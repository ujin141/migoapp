import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, RefreshCw, ExternalLink } from "lucide-react";
import { fetchAdminReports, updateReportStatus, updateUserBan } from "@/lib/adminService";
const typeLabel = (t: string) => t === "user" ? {
  label: i18n.t("auto.z_\uC720\uC800_628", "\uC720\uC800"),
  cls: "bg-violet-500/10 text-violet-400"
} : t === "post" ? {
  label: i18n.t("auto.z_\uAC8C\uC2DC\uAE00_629", "\uAC8C\uC2DC\uAE00"),
  cls: "bg-orange-500/10 text-orange-400"
} : t === "message" ? {
  label: i18n.t("auto.z_\uBA54\uC2DC\uC9C0_630", "\uBA54\uC2DC\uC9C0"),
  cls: "bg-blue-500/10 text-blue-400"
} : {
  label: t || i18n.t("auto.z_\uAE30\uD0C0_631", "\uAE30\uD0C0"),
  cls: "bg-muted text-muted-foreground"
};
const reasonLabel = (r: string) => {
  const map: Record<string, string> = {
    spam: i18n.t("auto.z_\uC2A4\uD338_632", "\uC2A4\uD338"),
    harassment: i18n.t("auto.z_\uAD34\uB86D\uD798_633", "\uAD34\uB86D\uD798"),
    inappropriate: i18n.t("auto.z_\uBD80\uC801\uC808\uCF58\uD150\uCE20_634", "\uBD80\uC801\uC808\uCF58\uD150\uCE20"),
    scam: i18n.t("auto.z_\uC0AC\uAE30_635", "\uC0AC\uAE30"),
    hate_speech: i18n.t("auto.z_\uD610\uC624\uBC1C\uC5B8_636", "\uD610\uC624\uBC1C\uC5B8"),
    fake_profile: i18n.t("auto.z_\uAC00\uC9DC\uD504\uB85C\uD544_637", "\uAC00\uC9DC\uD504\uB85C\uD544")
  };
  return map[r] || r;
};
export const AdminReports = () => {
  const {
    t
  } = useTranslation();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"all" | "pending" | "resolved" | "dismissed">("pending");
  const [selected, setSelected] = useState<any | null>(null);
  const [banning, setBanning] = useState(false);
  const load = async () => {
    setLoading(true);
    const data = await fetchAdminReports();
    setReports(data);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);
  const resolve = async (id: string) => {
    const success = await updateReportStatus(id, "resolved");
    if (success) {
      setReports(prev => prev.map(r => r.id === id ? {
        ...r,
        status: "resolved"
      } : r));
      if (selected?.id === id) setSelected((p: any) => ({
        ...p,
        status: "resolved"
      }));
    }
  };
  const dismiss = async (id: string) => {
    const success = await updateReportStatus(id, "dismissed");
    if (success) {
      setReports(prev => prev.map(r => r.id === id ? {
        ...r,
        status: "dismissed"
      } : r));
      if (selected?.id === id) setSelected((p: any) => ({
        ...p,
        status: "dismissed"
      }));
    }
  };
  const banTarget = async (targetId: string, reportId: string) => {
    if (!confirm(i18n.t("auto.z_\uC2E0\uACE0\uB300\uC0C1\uC720\uC800\uB97C\uC815\uC9C0\uD558_638", "\uC2E0\uACE0\uB300\uC0C1\uC720\uC800\uB97C\uC815\uC9C0\uD558"))) return;
    setBanning(true);
    await updateUserBan(targetId, true);
    await updateReportStatus(reportId, "resolved");
    setReports(prev => prev.map(r => r.id === reportId ? {
      ...r,
      status: "resolved"
    } : r));
    setSelected(null);
    setBanning(false);
  };
  const filtered = reports.filter(r => status === "all" || r.status === status);
  const pending = reports.filter(r => r.status === "pending").length;
  return <div className="truncate">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground truncate">{t("auto.z_\uC2E0\uACE0\uC13C\uD130_639", "\uC2E0\uACE0\uC13C\uD130")}</h1>
          <p className="text-sm text-muted-foreground truncate">{t("auto.z_\uB300\uAE30_640", "\uB300\uAE30")}{pending}{t("auto.z_\uAC74\uC804\uCCB4_641", "\uAC74\uC804\uCCB4")}{reports.length}{t("auto.z_\uAC74\uC2E4\uC2DC\uAC04DB\uC5F0\uB3D9_642", "\uAC74\uC2E4\uC2DC\uAC04DB\uC5F0\uB3D9")}</p>
        </div>
        <motion.button whileTap={{
        scale: 0.95
      }} onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted text-muted-foreground text-sm">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{t("auto.z_\uC0C8\uB85C\uACE0\uCE68_643", "\uC0C8\uB85C\uACE0\uCE68")}</motion.button>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-3 gap-3 mb-5 truncate">
        {[{
        label: t("auto.z_\uB300\uAE30\uC911_644", "\uB300\uAE30\uC911"),
        count: reports.filter(r => r.status === "pending").length,
        color: "text-red-400 bg-red-500/10"
      }, {
        label: t("auto.z_\uD574\uACB0\uB428_645", "\uD574\uACB0\uB428"),
        count: reports.filter(r => r.status === "resolved").length,
        color: "text-emerald-400 bg-emerald-500/10"
      }, {
        label: t("auto.z_\uBB34\uC2DC\uB428_646", "\uBB34\uC2DC\uB428"),
        count: reports.filter(r => r.status === "dismissed").length,
        color: "text-muted-foreground bg-muted"
      }].map(s => <div key={s.label} className={`rounded-2xl p-3 text-center ${s.color}`}>
            <p className="text-2xl font-extrabold">{s.count}</p>
            <p className="text-xs font-semibold">{s.label}</p>
          </div>)}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 truncate">
        {(["all", "pending", "resolved", "dismissed"] as const).map(s => <button key={s} onClick={() => setStatus(s)} className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${status === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {s === "all" ? i18n.t("auto.z_\uC804\uCCB4_647", "\uC804\uCCB4") : s === "pending" ? i18n.t("auto.z_\uB300\uAE30\uC911_648", "\uB300\uAE30\uC911") : s === "resolved" ? i18n.t("auto.z_\uD574\uACB0\uB428_649", "\uD574\uACB0\uB428") : i18n.t("auto.z_\uBB34\uC2DC\uD568_650", "\uBB34\uC2DC\uD568")}
            {s === "pending" && pending > 0 && <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] inline-flex items-center justify-center">{pending}</span>}
          </button>)}
      </div>

      {loading ? <div className="py-16 flex items-center justify-center gap-3 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm truncate">{t("auto.z_\uBD88\uB7EC\uC624\uB294\uC911_651", "\uBD88\uB7EC\uC624\uB294\uC911")}</span>
        </div> : <div className="space-y-3 truncate">
          {filtered.map(r => {
        const {
          label,
          cls
        } = typeLabel(r.type);
        return <motion.div key={r.id} layout onClick={() => setSelected(r)} className={`bg-card rounded-2xl p-5 border transition-all cursor-pointer hover:border-primary/30
                  ${r.status === "pending" ? "border-red-500/20" : r.status === "resolved" ? "border-emerald-500/20 opacity-70" : "border-border opacity-50"}`}>
                <div className="flex items-center justify-between gap-4 truncate">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${cls}`}>{label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === "pending" ? "bg-red-500/10 text-red-400" : r.status === "resolved" ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                        {r.status === "pending" ? i18n.t("auto.z_\uB300\uAE30_652", "\uB300\uAE30") : r.status === "resolved" ? i18n.t("auto.z_\uD574\uACB0_653", "\uD574\uACB0") : i18n.t("auto.z_\uBB34\uC2DC_654", "\uBB34\uC2DC")}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">{new Date(r.created_at).toLocaleDateString("ko-KR")}</span>
                    </div>
                    <p className="font-bold text-foreground text-sm mb-0.5">{reasonLabel(r.reason)}</p>
                    <p className="text-xs text-muted-foreground truncate">{i18n.t("auto.z_\uC2E0\uACE0\uC790_655", "\uC2E0\uACE0\uC790")}{r.reporterName || i18n.t("auto.z_\uC54C\uC218\uC5C6\uC74C_656", "\uC54C\uC218\uC5C6\uC74C")}</p>
                    {r.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">"{r.description}"</p>}
                  </div>
                  {r.status === "pending" && <div className="flex gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      <motion.button whileTap={{
                scale: 0.9
              }} onClick={() => resolve(r.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors">
                        <Check size={11} />{i18n.t("auto.z_\uD574\uACB0_657", "\uD574\uACB0")}</motion.button>
                      <motion.button whileTap={{
                scale: 0.9
              }} onClick={() => dismiss(r.id)} className="p-2 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 transition-colors" title={i18n.t("auto.z_\uBB34\uC2DC_658", "\uBB34\uC2DC")}>
                        <X size={14} />
                      </motion.button>
                    </div>}
                </div>
              </motion.div>;
      })}
          {filtered.length === 0 && <div className="py-16 text-center text-sm text-muted-foreground truncate">{t("auto.z_\uC2E0\uACE0\uB0B4\uC5ED\uC774\uC5C6\uC2B5\uB2C8\uB2E4_659", "\uC2E0\uACE0\uB0B4\uC5ED\uC774\uC5C6\uC2B5\uB2C8\uB2E4")}</div>}
        </div>}

      {/* Report detail panel */}
      <AnimatePresence>
        {selected && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelected(null)}>
            <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />
            <motion.div initial={{
          x: "100%"
        }} animate={{
          x: 0
        }} exit={{
          x: "100%"
        }} transition={{
          type: "spring",
          damping: 28,
          stiffness: 300
        }} className="relative z-10 w-96 bg-card border-l border-border h-screen overflow-y-auto shadow-float" onClick={e => e.stopPropagation()}>
              <div className="p-6 truncate">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-extrabold text-foreground truncate">{t("auto.z_\uC2E0\uACE0\uC0C1\uC138_660", "\uC2E0\uACE0\uC0C1\uC138")}</h3>
                  <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center"><X size={14} /></button>
                </div>

                <div className="space-y-3 mb-6 truncate">
                  {[{
                label: t("auto.z_\uC2E0\uACE0\uC720\uD615_661", "\uC2E0\uACE0\uC720\uD615"),
                value: typeLabel(selected.type).label
              }, {
                label: t("auto.z_\uC2E0\uACE0\uC0AC\uC720_662", "\uC2E0\uACE0\uC0AC\uC720"),
                value: reasonLabel(selected.reason)
              }, {
                label: t("auto.z_\uC2E0\uACE0\uB300\uC0C1ID_663", "\uC2E0\uACE0\uB300\uC0C1ID"),
                value: selected.target_id?.slice(0, 16) + "...",
                mono: true
              }, {
                label: t("auto.z_\uC2E0\uACE0\uC790_664", "\uC2E0\uACE0\uC790"),
                value: selected.reporterName || t("auto.z_\uC54C\uC218\uC5C6\uC74C_665", "\uC54C\uC218\uC5C6\uC74C")
              }, {
                label: t("auto.z_\uC811\uC218\uC77C_666", "\uC811\uC218\uC77C"),
                value: new Date(selected.created_at).toLocaleDateString("ko-KR")
              }, {
                label: t("auto.z_\uD604\uC7AC\uC0C1\uD0DC_667", "\uD604\uC7AC\uC0C1\uD0DC"),
                value: selected.status === "pending" ? t("auto.z_\uB300\uAE30\uC911_668", "\uB300\uAE30\uC911") : selected.status === "resolved" ? t("auto.z_\uD574\uACB0\uB428_669", "\uD574\uACB0\uB428") : t("auto.z_\uBB34\uC2DC\uB428_670", "\uBB34\uC2DC\uB428")
              }].map(i => <div key={i.label} className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-xs text-muted-foreground">{i.label}</span>
                      <span className={`text-xs font-semibold text-foreground ${i.mono ? "font-mono text-[10px]" : ""}`}>{i.value}</span>
                    </div>)}
                </div>

                {selected.description && <div className="mb-6 p-4 bg-muted/40 rounded-xl">
                    <p className="text-[11px] font-bold text-muted-foreground mb-1 truncate">{t("auto.z_\uC0C1\uC138\uB0B4\uC6A9_671", "\uC0C1\uC138\uB0B4\uC6A9")}</p>
                    <p className="text-xs text-foreground leading-relaxed">{selected.description}</p>
                  </div>}

                {selected.status === "pending" && <div className="space-y-2 truncate">
                    <motion.button whileTap={{
                scale: 0.97
              }} onClick={() => resolve(selected.id)} className="w-full py-2.5 rounded-xl text-sm font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2">
                      <Check size={14} />{t("auto.z_\uC2E0\uACE0\uD574\uACB0\uCC98\uB9AC_672", "\uC2E0\uACE0\uD574\uACB0\uCC98\uB9AC")}</motion.button>
                    {selected.type === "user" && selected.target_id && <motion.button whileTap={{
                scale: 0.97
              }} onClick={() => banTarget(selected.target_id, selected.id)} disabled={banning} className="w-full py-2.5 rounded-xl text-sm font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                        {banning ? t("auto.z_\uCC98\uB9AC\uC911_673", "\uCC98\uB9AC\uC911") : t("auto.z_\uC2E0\uACE0\uB300\uC0C1\uACC4\uC815\uC815\uC9C0\uD574\uACB0_674", "\uC2E0\uACE0\uB300\uC0C1\uACC4\uC815\uC815\uC9C0\uD574\uACB0")}
                      </motion.button>}
                    <motion.button whileTap={{
                scale: 0.97
              }} onClick={() => {
                dismiss(selected.id);
                setSelected(null);
              }} className="w-full py-2.5 rounded-xl text-sm font-bold bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">{t("auto.z_\uBB34\uC2DC\uD558\uAE30_675", "\uBB34\uC2DC\uD558\uAE30")}</motion.button>
                  </div>}
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>
    </div>;
};