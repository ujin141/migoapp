import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Users, Heart, Plane, TrendingUp, FileText, Flag, Crown, Check, Clock, DollarSign, Bell, X, Plus, Megaphone, RefreshCw } from "lucide-react";
import { fetchAdminStats, fetchAdminUsers, fetchAdminReports, fetchAnnouncements, createAnnouncement, deleteAnnouncement, fetchWeeklyStats, fetchTodayStats } from "@/lib/adminService";
import { fetchAds } from "@/lib/adService";
const CustomTooltip = ({
  active,
  payload,
  label
}: any) => {
  if (active && payload?.length) {
    return <div className="bg-card border border-border rounded-xl p-3 shadow-float text-xs">
        <p className="font-bold text-foreground mb-1">{label}</p>
        {payload.map((p: any) => <p key={p.name} style={{
        color: p.color
      }}>{p.name}: {p.value}</p>)}
      </div>;
  }
  return null;
};
type AnnouncementType = "info" | "warning" | "update";
export const AdminDashboard = () => {
  const {
    t
  } = useTranslation();
  const [stats, setStats] = useState({
    users: 0,
    posts: 0,
    groups: 0,
    reports: 0,
    activeAds: 0
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [liveChartData, setLiveChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [todayStats, setTodayStats] = useState({ newUsers: 0, sosCheckins: 0, activeChats: 0, newReports: 0 });

  // Announcement form
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annType, setAnnType] = useState<AnnouncementType>("info");
  const [savingAnn, setSavingAnn] = useState(false);

  // 쿼리가 hang될 경우 ms 후 fallback 값으로 resolve
  const withTimeout = <T,>(p: Promise<T>, fallback: T, ms = 8000): Promise<T> => Promise.race([p, new Promise<T>(r => setTimeout(() => r(fallback), ms))]);
  const load = async () => {
    setLoading(true);
    try {
      const emptyStats = {
        users: 0,
        posts: 0,
        groups: 0,
        reports: 0
      };
      const [dbStats, ads, users, reports, anns, weekly, today] = await Promise.all([withTimeout(fetchAdminStats(), emptyStats), withTimeout(fetchAds("active"), []), withTimeout(fetchAdminUsers(), []), withTimeout(fetchAdminReports(), []), withTimeout(fetchAnnouncements(), []), withTimeout(fetchWeeklyStats(), []), withTimeout(fetchTodayStats(), { newUsers: 0, sosCheckins: 0, activeChats: 0, newReports: 0 })]);
      setStats({
        ...dbStats,
        activeAds: ads.length
      });
      setRecentUsers((users || []).slice(0, 5));
      setRecentReports((reports || []).filter((r: any) => r.status === "pending").slice(0, 4));
      setAnnouncements(anns || []);
      setTodayStats(today);
      setLiveChartData(weekly.length ? weekly : Array.from({
        length: 7
      }).map((_, i) => ({
        day: i18n.t("auto.p1", {
              val: i + 1
        }),
        users: 0,
        matches: 0,
        revenue: 0
      })));
      setDashboardError("");
    } catch (e: any) {
      console.error("AdminDashboard load error:", e);
      setDashboardError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const handleCreateAnnouncement = async () => {
    if (!annTitle || !annContent) return;
    setSavingAnn(true);
    const newAnn = await createAnnouncement(annTitle, annContent, annType);
    if (newAnn) setAnnouncements(prev => [newAnn, ...prev]);
    setAnnTitle("");
    setAnnContent("");
    setShowAnnounce(false);
    setSavingAnn(false);
  };
  const handleDeleteAnnouncement = async (id: string) => {
    const ok = await deleteAnnouncement(id);
    if (ok) setAnnouncements(prev => prev.filter(a => a.id !== id));
  };
  const typeColors: Record<AnnouncementType, string> = {
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    update: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  };
  const typeIcons: Record<AnnouncementType, string> = {
    info: "ℹ️",
    warning: "⚠️",
    update: "🆕"
  };
  const statsCards = [{
    label: t("auto.g_1076", "총유저"),
    value: stats.users.toLocaleString(),
    icon: Users,
    color: "from-violet-500 to-purple-600"
  }, {
    label: t("auto.g_1077", "활성그룹8"),
    value: stats.groups.toLocaleString(),
    icon: Plane,
    color: "from-blue-500 to-cyan-500"
  }, {
    label: t("auto.g_1078", "총게시글8"),
    value: stats.posts.toLocaleString(),
    icon: FileText,
    color: "from-orange-500 to-amber-500"
  }, {
    label: t("auto.g_1079", "대기중신고"),
    value: stats.reports.toLocaleString(),
    icon: Flag,
    color: "from-red-500 to-rose-600"
  }, {
    label: t("auto.g_1080", "게재중광고"),
    value: t("auto.t5001", {
          v0: stats.activeAds
    }),
    icon: TrendingUp,
    color: "from-emerald-500 to-green-500"
  }, {
    label: t("auto.g_1081", "공지사항8"),
    value: t("auto.t5002", {
          v0: announcements.length
    }),
    icon: Megaphone,
    color: "from-pink-500 to-rose-500"
  }];
  return <div className="truncate">
      {dashboardError && (
        <div className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/30 font-mono text-xs whitespace-pre-wrap break-all shadow-sm">
          <strong className="block mb-1 text-red-600">{t("admin.dashboardLoadError")}</strong>
          URL: {import.meta.env.VITE_SUPABASE_URL}<br/>
          Error: {dashboardError}
        </div>
      )}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground truncate">{t("auto.g_1082", "대시보드8")}</h1>
          <p className="text-sm text-muted-foreground truncate">{t("auto.g_1083", "Migo앱")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAnnounce(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors">
            <Megaphone size={14} />{t("auto.g_1084", "공지발행8")}</button>
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted text-muted-foreground text-sm hover:text-foreground transition-colors">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{t("auto.g_1085", "새로고침8")}</button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-6 truncate">
        {statsCards.map(s => <div key={s.label} className="bg-card rounded-2xl p-3 border border-border shadow-card flex flex-col items-start gap-2">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0`}>
              <s.icon size={14} className="text-white" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-foreground leading-tight">{loading ? "—" : s.value}</p>
              <p className="text-[10px] text-muted-foreground leading-tight break-keep">{s.label}</p>
            </div>
          </div>)}
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-extrabold text-muted-foreground uppercase tracking-wide mb-3 truncate">{t("admin.todayStatus")}</h2>
        <div className="grid grid-cols-2 gap-3 truncate">
          {([
            { label: t("admin.todayNewUsers"), value: todayStats.newUsers, icon: Users, color: "from-violet-500 to-purple-600", urgent: false },
            { label: t("admin.sosActiveCheckins"), value: todayStats.sosCheckins, icon: Bell, color: "from-red-500 to-rose-600", urgent: todayStats.sosCheckins > 0 },
            { label: t("admin.activeChatRooms"), value: todayStats.activeChats, icon: Heart, color: "from-blue-500 to-cyan-500", urgent: false },
            { label: t("admin.todayReports"), value: todayStats.newReports, icon: Flag, color: "from-orange-500 to-amber-500", urgent: todayStats.newReports > 0 },
          ] as const).map((s: any) => (
            <div key={s.label} className={`bg-card rounded-2xl p-4 border flex items-center gap-3 ${s.urgent ? "border-red-500/40 shadow-[0_0_16px_rgba(239,68,68,0.1)]" : "border-border"}`}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0`}>
                <s.icon size={16} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-2xl font-extrabold leading-tight ${s.urgent && s.value > 0 ? "text-red-400" : "text-foreground"}`}>{loading ? "—" : s.value}</p>
                <p className="text-[11px] text-muted-foreground leading-snug break-keep">{s.label}</p>
              </div>
              {s.urgent && s.value > 0 && <span className="text-[10px] font-bold text-red-400 animate-pulse shrink-0">●</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        <div className="col-span-2 bg-card rounded-2xl p-5 border border-border">
          <p className="font-extrabold text-foreground text-sm mb-1 truncate">{t("auto.g_1086", "주간유저추")}</p>
          <p className="text-[10px] text-emerald-400 font-bold mb-4 flex items-center gap-1.5 truncate"><TrendingUp size={11} />{t("auto.g_1087", "실시간라이")}</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={liveChartData}>
              <defs>
                <linearGradient id="ug" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} /><stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} /></linearGradient>
                <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#EC4899" stopOpacity={0.3} /><stop offset="100%" stopColor="#EC4899" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{
              fontSize: 11,
              fill: "#888"
            }} axisLine={false} tickLine={false} />
              <YAxis tick={{
              fontSize: 11,
              fill: "#888"
            }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="users" name={t("auto.x4002")} stroke="#8B5CF6" fill="url(#ug)" strokeWidth={2} />
              <Area type="monotone" dataKey="matches" name={t("auto.x4003")} stroke="#EC4899" fill="url(#mg)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Reports */}
        <div className="bg-card rounded-2xl p-5 border border-border overflow-y-auto">
          <p className="text-xs font-extrabold text-muted-foreground mb-3 flex items-center gap-1.5 truncate">
            <Flag size={12} className="text-red-400" />{t("auto.g_1088", "대기중신고")}</p>
          <div className="space-y-2 truncate">
            {recentReports.length === 0 ? <p className="text-xs text-muted-foreground truncate">{t("auto.g_1089", "대기신고가")}</p> : recentReports.map((r: any) => <div key={r.id} className="flex items-start gap-2 p-2 bg-muted/40 rounded-xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-foreground truncate font-semibold">{r.reason}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{t("auto.g_1090", "신고자")}{r.reporterName || t("auto.g_1091", "알수없음8")}</p>
                  </div>
                </div>)}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-5">
        {/* Recent Users */}
        <div className="bg-card rounded-2xl p-5 border border-border">
          <p className="text-xs font-extrabold text-muted-foreground mb-3 flex items-center gap-1.5 truncate">
            <Users size={12} />{t("auto.g_1092", "최근가입유")}</p>
          <div className="space-y-2 truncate">
            {recentUsers.length === 0 ? <p className="text-xs text-muted-foreground truncate">{t("auto.g_1093", "유저가없습")}</p> : recentUsers.map((u: any) => <div key={u.id} className="flex items-center gap-3 py-1.5 border-b border-border/30 last:border-0">
                  {u.photo_url ? <img src={u.photo_url} className="w-7 h-7 rounded-lg object-cover shrink-0" /> : <div className="w-7 h-7 bg-muted rounded-lg shrink-0 flex items-center justify-center text-xs font-bold">{u.name?.[0]?.toUpperCase() || "?"}</div>}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground font-semibold truncate">{u.name || t("auto.g_1094", "이름없음8")}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(u.created_at).toLocaleDateString("ko-KR")}</p>
                  </div>
                  {u.verified ? <Check size={11} className="text-emerald-400 shrink-0" /> : <Clock size={11} className="text-amber-400 shrink-0" />}
                </div>)}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-card rounded-2xl p-5 border border-border">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-extrabold text-muted-foreground flex items-center gap-1.5 truncate">
              <Bell size={12} />{t("auto.g_1095", "앱공지사항")}</p>
            <button onClick={() => setShowAnnounce(true)} className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Plus size={12} />
            </button>
          </div>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {announcements.length === 0 ? <p className="text-xs text-muted-foreground truncate">{t("auto.g_1096", "발행된공지")}</p> : announcements.map((a: any) => <div key={a.id} className={`p-3 rounded-xl border text-xs transition-all ${typeColors[a.type as AnnouncementType] || "bg-muted border-border"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold truncate">{typeIcons[a.type as AnnouncementType] || "📢"} {a.title}</p>
                      <p className="text-[10px] opacity-70 mt-0.5 line-clamp-1">{a.content}</p>
                    </div>
                    <button onClick={() => handleDeleteAnnouncement(a.id)} className="opacity-60 hover:opacity-100 shrink-0 mt-0.5">
                      <X size={11} />
                    </button>
                  </div>
                </div>)}
          </div>
        </div>
      </div>

      {/* Announcement Modal */}
      {showAnnounce && <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowAnnounce(false)} />
          <div className="relative z-10 w-full max-w-lg bg-card rounded-3xl p-6 shadow-float border border-border">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-foreground flex items-center gap-2 truncate"><Megaphone size={16} />{t("auto.g_1097", "공지사항발")}</h3>
              <button onClick={() => setShowAnnounce(false)} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center"><X size={14} /></button>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2 truncate">
                {(["info", "warning", "update"] as AnnouncementType[]).map(t => <button key={t} onClick={() => setAnnType(t)} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${annType === t ? typeColors[t] : "bg-muted border-border text-muted-foreground"}`}>
                    {typeIcons[t]} {t === "info" ? t("auto.g_1098", "일반") : t === "warning" ? t("auto.g_1099", "경고") : t("auto.g_1100", "업데이트9")}
                  </button>)}
              </div>
              <input value={annTitle} onChange={e => setAnnTitle(e.target.value)} placeholder={t("auto.g_1101", "공지제목9")} className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary transition-colors" />
              <textarea value={annContent} onChange={e => setAnnContent(e.target.value)} rows={3} placeholder={t("auto.g_1102", "공지내용9")} className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary transition-colors resize-none" />
              <button onClick={handleCreateAnnouncement} disabled={savingAnn || !annTitle || !annContent} className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-extrabold text-sm disabled:opacity-40 transition-opacity">
                {savingAnn ? t("auto.g_1103", "발행중") : t("auto.g_1104", "공지발행하")}
              </button>
            </div>
          </div>
        </div>}
    </div>;
};