import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Users, CreditCard, Crown, RefreshCw, ShoppingBag, BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { fetchRevenueStats, fetchSubscriptionList, fetchPurchaseHistory } from "@/lib/adminService";
const planColor: Record<string, string> = {
  plus: "bg-violet-500/10 text-violet-400",
  premium: "bg-amber-500/10 text-amber-400",
  free: "bg-muted text-muted-foreground",
  active: "bg-emerald-500/10 text-emerald-400",
  cancelled: "bg-red-500/10 text-red-400",
  expired: "bg-orange-500/10 text-orange-400"
};
type RevenueTab = "overview" | "subscriptions" | "purchases";
export const AdminRevenue = () => {
  const {
    t
  } = useTranslation();
  const [tab, setTab] = useState<RevenueTab>("overview");
  const [stats, setStats] = useState({
    total: 0,
    monthly: 0,
    subs: 0,
    purchases: 0,
    churnRate: 0
  });
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Build a mini monthly bar from purchases
  const [chartData, setChartData] = useState<any[]>([]);
  const load = async () => {
    setLoading(true);
    const [s, subs, purs] = await Promise.all([fetchRevenueStats(), fetchSubscriptionList(), fetchPurchaseHistory()]);
    setStats(s);
    setSubscriptions(subs);
    setPurchases(purs);

    // Group purchases by month for chart
    const monthly: Record<string, number> = {};
    purs.forEach((p: any) => {
      const m = new Date(p.created_at).toLocaleString("default", {
        month: "short"
      });
      monthly[m] = (monthly[m] || 0) + (p.amount || 0);
    });
    setChartData(Object.entries(monthly).map(([month, revenue]) => ({
      month,
      revenue
    })));
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);
  const statCards = [{
    label: t("auto.z_\uCD1D\uC218\uC775_933"),
    value: `₩${stats.total.toLocaleString()}`,
    icon: DollarSign,
    gradient: "from-emerald-500 to-teal-600"
  }, {
    label: t("auto.z_\uC774\uBC88\uB2EC\uC218\uC775_934"),
    value: `₩${stats.monthly.toLocaleString()}`,
    icon: TrendingUp,
    gradient: "from-blue-500 to-cyan-500"
  }, {
    label: t("auto.z_\uD65C\uC131\uAD6C\uB3C5\uC790_935"),
    value: stats.subs,
    icon: Crown,
    gradient: "from-violet-500 to-purple-600"
  }, {
    label: t("auto.z_\uCD1D\uAD6C\uB9E4\uAC74\uC218_936"),
    value: stats.purchases,
    icon: ShoppingBag,
    gradient: "from-pink-500 to-rose-500"
  }, {
    label: t("auto.z_\uC774\uD0C8\uB960Churn_937"),
    value: `${stats.churnRate}%`,
    icon: BarChart3,
    gradient: "from-orange-500 to-amber-500"
  }];
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <DollarSign size={24} className="text-primary" />{t("auto.z_\uC218\uC775\uAD00\uB9AC_938")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("auto.z_\uAD6C\uB3C5\uD604\uD669\uC778\uC571\uAD6C\uB9E4\uB0B4\uC5ED_939")}</p>
        </div>
        <motion.button whileTap={{
        scale: 0.95
      }} onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted text-muted-foreground text-sm">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{t("auto.z_\uC0C8\uB85C\uACE0\uCE68_940")}</motion.button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map(c => <div key={c.label} className="bg-card rounded-2xl p-4 border border-border flex flex-col gap-2">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center`}>
              <c.icon size={16} className="text-white" />
            </div>
            <p className="text-xl font-extrabold text-foreground">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>)}
      </div>

      {/* Chart */}
      {chartData.length > 0 && <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-sm font-bold text-foreground mb-4">{t("auto.z_\uC6D4\uBCC4\uC218\uC775\uCD94\uC774_941")}</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{
            fill: "#888",
            fontSize: 11
          }} />
              <YAxis tick={{
            fill: "#888",
            fontSize: 11
          }} />
              <Tooltip contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 12,
            fontSize: 12
          }} formatter={(v: any) => [`₩${Number(v).toLocaleString()}`, i18n.t("auto.z_\uC218\uC775_942")]} />
              <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>}

      {/* Tabs */}
      <div className="flex gap-2 mb-2">
        {(["overview", "subscriptions", "purchases"] as const).map(t => <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all
            ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {t === "overview" ? i18n.t("auto.z_\uAC1C\uC694_943") : t === "subscriptions" ? i18n.t("admin.tabSubscriptions", {
          defaultValue: `Subscriptions (${subscriptions.length})`
        }) : i18n.t("admin.tabPurchases", {
          defaultValue: `Purchases (${purchases.length})`
        })}
          </button>)}
      </div>

      {/* Subscriptions */}
      {tab === "subscriptions" && <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {loading ? <div className="p-12 text-center text-muted-foreground text-sm">{t("auto.z_\uBD88\uB7EC\uC624\uB294\uC911_946")}</div> : subscriptions.length === 0 ? <div className="p-12 text-center text-muted-foreground text-sm">{t("auto.z_\uAD6C\uB3C5\uB370\uC774\uD130\uAC00\uC5C6\uC2B5\uB2C8\uB2E4_947")}</div> : <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    {[t("auto.z_\uC720\uC800_948"), t("auto.z_\uD50C\uB79C_949"), t("auto.z_\uAE08\uC561_950"), t("auto.z_\uC0C1\uD0DC_951"), t("auto.z_\uC2DC\uC791\uC77C_952")].map(h => <th key={h} className="p-4 text-xs font-bold text-muted-foreground">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {subscriptions.map(s => <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {s.userPhoto ? <img src={s.userPhoto} className="w-8 h-8 rounded-lg object-cover" /> : <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {s.userName?.[0] || "?"}
                            </div>}
                          <div>
                            <p className="text-sm font-semibold text-foreground">{s.userName}</p>
                            <p className="text-[10px] text-muted-foreground">{s.userEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${planColor[s.plan] || "bg-muted text-muted-foreground"}`}>
                          {s.plan}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-bold text-foreground">₩{(s.amount || 0).toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${planColor[s.status] || "bg-muted"}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString("ko-KR")}</td>
                    </tr>)}
                </tbody>
              </table>
            </div>}
        </div>}

      {/* Purchases */}
      {tab === "purchases" && <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {loading ? <div className="p-12 text-center text-muted-foreground text-sm">{t("auto.z_\uBD88\uB7EC\uC624\uB294\uC911_953")}</div> : purchases.length === 0 ? <div className="p-12 text-center text-muted-foreground text-sm">{t("auto.z_\uAD6C\uB9E4\uB0B4\uC5ED\uC774\uC5C6\uC2B5\uB2C8\uB2E4_954")}</div> : <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    {[t("auto.z_\uC720\uC800_955"), t("auto.z_\uC544\uC774\uD15C\uC720\uD615_956"), t("auto.z_\uAE08\uC561_957"), t("auto.z_\uACB0\uC81C\uC77C_958")].map(h => <th key={h} className="p-4 text-xs font-bold text-muted-foreground">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {purchases.map(p => <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <p className="text-sm font-semibold text-foreground">{p.userName}</p>
                        <p className="text-[10px] text-muted-foreground">{p.userEmail}</p>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400">
                          {p.item_type || i18n.t("auto.z_\uAE30\uD0C0_959")}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-bold text-foreground">₩{(p.amount || 0).toLocaleString()}</td>
                      <td className="p-4 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("ko-KR")}</td>
                    </tr>)}
                </tbody>
              </table>
            </div>}
        </div>}

      {tab === "overview" && !loading && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl border border-border p-5">
            <p className="text-sm font-bold text-foreground mb-3">{t("auto.z_\uAD6C\uB3C5\uD50C\uB79C\uBD84\uD3EC_960")}</p>
            {["plus", "premium", "free"].map(plan => {
          const count = subscriptions.filter(s => s.plan === plan).length;
          const total = subscriptions.length || 1;
          return <div key={plan} className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold w-16 text-center ${planColor[plan]}`}>{plan}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full">
                    <div className="h-2 rounded-full bg-primary transition-all" style={{
                width: `${count / total * 100}%`
              }} />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-8 text-right">{count}</span>
                </div>;
        })}
          </div>
          <div className="bg-card rounded-2xl border border-border p-5">
            <p className="text-sm font-bold text-foreground mb-3">{t("auto.z_\uC778\uC571\uAD6C\uB9E4\uC720\uD615\uBD84\uD3EC_961")}</p>
            {["super_like", "boost", "badge", "nearby"].map(type => {
          const count = purchases.filter(p => p.item_type === type).length;
          const total = purchases.length || 1;
          return <div key={type} className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-bold text-muted-foreground w-20 truncate">{type}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full">
                    <div className="h-2 rounded-full bg-blue-500 transition-all" style={{
                width: `${count / total * 100}%`
              }} />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-8 text-right">{count}</span>
                </div>;
        })}
          </div>
        </div>}
    </div>;
};
export default AdminRevenue;