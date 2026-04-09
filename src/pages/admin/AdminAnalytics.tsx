import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Globe, RefreshCw, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell, Legend } from "recharts";
import { fetchAdminStats, fetchWeeklyStats, fetchMonthlySignups, fetchActiveUserCount, fetchGenderStats, fetchNationalityStats } from "@/lib/adminService";
const COLORS = ["#8b5cf6", "#ec4899", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];
export const AdminAnalytics = () => {
  const {
    t
  } = useTranslation();
  const [stats, setStats] = useState<any>({});
  const [weekly, setWeekly] = useState<any[]>([]);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [dau, setDau] = useState(0);
  const [gender, setGender] = useState<any[]>([]);
  const [nations, setNations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    const [s, w, m, d, g, n] = await Promise.all([fetchAdminStats(), fetchWeeklyStats(), fetchMonthlySignups(), fetchActiveUserCount(), fetchGenderStats(), fetchNationalityStats()]);
    setStats(s);
    setWeekly(w);
    setMonthly(m);
    setDau(d);
    setGender(g);
    setNations(n);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);
  return <div className="space-y-6 truncate">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2 truncate">
            <TrendingUp size={24} className="text-primary" />{t("auto.z_\uC0AC\uC6A9\uC790\uBD84\uC11D_1054", "\uC0AC\uC6A9\uC790\uBD84\uC11D")}</h1>
          <p className="text-sm text-muted-foreground mt-1 truncate">{t("auto.z_DAU\uC2E0\uADDC\uAC00\uC785\uC131\uBCC4\uAD6D_1055", "DAU\uC2E0\uADDC\uAC00\uC785\uC131\uBCC4\uAD6D")}</p>
        </div>
        <motion.button whileTap={{
        scale: 0.95
      }} onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted text-muted-foreground text-sm">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{t("auto.z_\uC0C8\uB85C\uACE0\uCE68_1056", "\uC0C8\uB85C\uACE0\uCE68")}</motion.button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 truncate">
        {[{
        label: t("auto.z_\uC804\uCCB4\uC720\uC800_1057", "\uC804\uCCB4\uC720\uC800"),
        value: stats.users || 0,
        icon: Users,
        color: "from-blue-500 to-cyan-500"
      }, {
        label: t("auto.z_\uC624\uB298\uD65C\uC131\uC720\uC800DAU_1058", "\uC624\uB298\uD65C\uC131\uC720\uC800DAU"),
        value: dau,
        icon: TrendingUp,
        color: "from-emerald-500 to-teal-500"
      }, {
        label: t("auto.z_\uC804\uCCB4\uAC8C\uC2DC\uAE00_1059", "\uC804\uCCB4\uAC8C\uC2DC\uAE00"),
        value: stats.posts || 0,
        icon: BarChart3,
        color: "from-violet-500 to-purple-600"
      }, {
        label: t("auto.z_\uC5EC\uD589\uADF8\uB8F9_1060", "\uC5EC\uD589\uADF8\uB8F9"),
        value: stats.groups || 0,
        icon: Globe,
        color: "from-pink-500 to-rose-500"
      }].map(c => <div key={c.label} className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center shrink-0`}>
              <c.icon size={16} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-extrabold text-foreground leading-tight">{c.value.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground break-keep leading-snug">{c.label}</p>
            </div>
          </div>)}
      </div>

      {/* Weekly Activity */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <p className="text-sm font-bold text-foreground mb-4 truncate">{t("auto.z_\uC8FC\uAC04\uC2E0\uADDC\uAC00\uC785\uADF8\uB8F9\uC0DD\uC131_1061", "\uC8FC\uAC04\uC2E0\uADDC\uAC00\uC785\uADF8\uB8F9\uC0DD\uC131")}</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={weekly}>
            <defs>
              <linearGradient id="au" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="am" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" tick={{
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
          }} />
            <Area type="monotone" dataKey="users" stroke="#8b5cf6" fill="url(#au)" strokeWidth={2} name={t("admin.newUser", "신규 유저")} />
            <Area type="monotone" dataKey="matches" stroke="#ec4899" fill="url(#am)" strokeWidth={2} name={t("admin.newGroup", "그룹 생성")} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Signups */}
      {monthly.length > 0 && <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-sm font-bold text-foreground mb-4 truncate">{t("auto.z_\uC6D4\uBCC4\uC2E0\uADDC\uAC00\uC785\uCD5C\uADFC6\uAC1C_1062", "\uC6D4\uBCC4\uC2E0\uADDC\uAC00\uC785\uCD5C\uADFC6\uAC1C")}</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthly}>
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
          }} />
              <Bar dataKey="users" fill="#8b5cf6" radius={[6, 6, 0, 0]} name={t("admin.newSignup", "신규 가입")} />
            </BarChart>
          </ResponsiveContainer>
        </div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 truncate">
        {/* Gender Distribution */}
        {gender.length > 0 && <div className="bg-card rounded-2xl border border-border p-5">
            <p className="text-sm font-bold text-foreground mb-4 truncate">{t("auto.z_\uC131\uBCC4\uBD84\uD3EC_1063", "\uC131\uBCC4\uBD84\uD3EC")}</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={gender} dataKey="count" nameKey="gender" cx="50%" cy="50%" outerRadius={70} label={({
              gender: g,
              percent
            }) => `${g} ${(percent * 100).toFixed(0)}%`}>
                  {gender.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 12,
              fontSize: 12
            }} />
              </PieChart>
            </ResponsiveContainer>
          </div>}

        {/* Nationality Top 10 */}
        {nations.length > 0 && <div className="bg-card rounded-2xl border border-border p-5">
            <p className="text-sm font-bold text-foreground mb-3 truncate">{t("auto.z_\uAD6D\uC801TOP10_1064", "\uAD6D\uC801TOP10")}</p>
            <div className="space-y-1.5 truncate">
              {nations.map((n: any, i: number) => {
            const maxCount = nations[0]?.count || 1;
            return <div key={n.country} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                    <span className="text-xs font-semibold text-foreground w-20 truncate">{n.country}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full">
                      <div className="h-2 rounded-full bg-primary" style={{
                  width: `${n.count / maxCount * 100}%`
                }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{n.count}</span>
                  </div>;
          })}
            </div>
          </div>}
      </div>
    </div>;
};
export default AdminAnalytics;