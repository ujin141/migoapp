import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2, Users, Plane, Crown, RefreshCw } from "lucide-react";
import { fetchAdminGroups, deleteGroup } from "@/lib/adminService";
export const AdminGroups = () => {
  const {
    t
  } = useTranslation();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const load = async () => {
    setLoading(true);
    const dbGroups = await fetchAdminGroups();
    setGroups(dbGroups);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);
  const handleDelete = async (id: string) => {
    if (!confirm(i18n.t("auto.z_\uC815\uB9D0\uB85C\uC774\uADF8\uB8F9\uC744\uC0AD\uC81C\uD558_861"))) return;
    const success = await deleteGroup(id);
    if (success) setGroups(prev => prev.filter(g => g.id !== id));else alert("auto.z_\uADF8\uB8F9\uC0AD\uC81C\uC5D0\uC2E4\uD328\uD588\uC2B5\uB2C8_862");
  };
  const filtered = groups.filter(g => {
    const q = search.toLowerCase();
    return (g.title || "").toLowerCase().includes(q) || (g.hostName || "").toLowerCase().includes(q) || (g.destination || "").toLowerCase().includes(q);
  });
  const totalMembers = groups.reduce((a, g) => a + (g.memberCount || 0), 0);
  return <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">{t("auto.z_\uC5EC\uD589\uADF8\uB8F9\uAD00\uB9AC_863")}</h1>
          <p className="text-sm text-muted-foreground">{t("auto.z_\uCD1D_864")}{groups.length}{t("auto.z_\uAC1C\uD65C\uC131\uADF8\uB8F9\uC2E4\uC2DC\uAC04DB_865")}</p>
        </div>
        <motion.button whileTap={{
        scale: 0.95
      }} onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted text-muted-foreground text-sm">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{t("auto.z_\uC0C8\uB85C\uACE0\uCE68_866")}</motion.button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[{
        label: t("auto.z_\uC804\uCCB4\uADF8\uB8F9_867"),
        value: groups.length,
        icon: Plane,
        color: "from-blue-500 to-cyan-500"
      }, {
        label: t("auto.z_Premium\uADF8\uB8F9_868"),
        value: groups.filter(g => g.is_premium).length,
        icon: Crown,
        color: "from-amber-400 to-yellow-500"
      }, {
        label: t("auto.z_\uCD1D\uCC38\uC5EC\uC790_869"),
        value: totalMembers,
        icon: Users,
        color: "from-violet-500 to-purple-600"
      }].map(s => <div key={s.label} className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
              <s.icon size={16} className="text-white" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>)}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("auto.z_\uADF8\uB8F9\uBA85\uD638\uC2A4\uD2B8\uBAA9\uC801\uC9C0\uAC80_870")} className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors" />
      </div>

      {loading ? <div className="py-16 flex items-center justify-center gap-3 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">{t("auto.z_\uBD88\uB7EC\uC624\uB294\uC911_871")}</span>
        </div> : filtered.length === 0 ? <div className="py-16 text-center text-sm text-muted-foreground">{t("auto.z_\uC0DD\uC131\uB41C\uC5EC\uD589\uADF8\uB8F9\uC774\uC5C6\uC2B5_872")}</div> : <div className="grid grid-cols-2 gap-4">
          {filtered.map(g => {
        const memberCount = g.memberCount ?? 0;
        const maxMembers = g.max_members ?? 0;
        const fillPct = maxMembers > 0 ? Math.min(Math.round(memberCount / maxMembers * 100), 100) : 0;
        return <motion.div key={g.id} layout className="bg-card rounded-2xl p-5 border border-border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-extrabold text-foreground truncate">{g.title}</p>
                      {g.is_premium && <Crown size={12} className="text-amber-400 shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{i18n.t("auto.z_\uD638\uC2A4\uD2B8_873")}{g.hostName}</p>
                  </div>
                  <motion.button whileTap={{
              scale: 0.9
            }} onClick={() => handleDelete(g.id)} className="p-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors shrink-0 ml-2" title={i18n.t("auto.z_\uADF8\uB8F9\uC0AD\uC81C_874")}>
                    <Trash2 size={12} />
                  </motion.button>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Users size={10} />{memberCount}/{maxMembers > 0 ? maxMembers : "?"}{i18n.t("auto.z_\uBA85_875")}</span>
                  <span className="flex items-center gap-1"><Plane size={10} />{g.destination || i18n.t("auto.z_\uBBF8\uC815_876")}</span>
                  {g.entry_fee > 0 && <span className="flex items-center gap-1">₩{g.entry_fee.toLocaleString()}</span>}
                  {g.days_left != null && <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${g.days_left <= 2 ? "bg-red-500/10 text-red-400" : "bg-muted text-muted-foreground"}`}>
                      D-{g.days_left}
                    </span>}
                </div>

                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-primary transition-all" style={{
              width: `${fillPct}%`
            }} />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>{i18n.t("auto.z_\uCC38\uC5EC\uC728_877")}</span>
                  <span>{fillPct}% {maxMembers > 0 ? `(${memberCount}/${maxMembers})` : ""}</span>
                </div>
              </motion.div>;
      })}
        </div>}
    </div>;
};