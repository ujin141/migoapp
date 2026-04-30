import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ClipboardList, RefreshCw, User, Search, Filter, Shield, Ban, Check, Trash2, Eye } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useTranslation } from "react-i18next";

type LogEntry = {
  id: string;
  admin_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: any;
  created_at: string;
  profiles?: { name: string; photo_url: string | null } | null;
};

const actionIcon = (action: string) => {
  if (action.includes("ban")) return <Ban size={12} className="text-red-400" />;
  if (action.includes("approve") || action.includes("verify")) return <Check size={12} className="text-emerald-400" />;
  if (action.includes("delete")) return <Trash2 size={12} className="text-orange-400" />;
  if (action.includes("view")) return <Eye size={12} className="text-blue-400" />;
  return <Shield size={12} className="text-violet-400" />;
};

const actionColor = (action: string) => {
  if (action.includes("ban")) return "bg-red-500/10 text-red-400 border-red-500/20";
  if (action.includes("approve") || action.includes("verify")) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (action.includes("delete")) return "bg-orange-500/10 text-orange-400 border-orange-500/20";
  if (action.includes("resolve")) return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  return "bg-violet-500/10 text-violet-400 border-violet-500/20";
};

export const AdminActivityLog = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 30;

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_activity_log")
      .select("*, profiles:admin_id(name, photo_url)")
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (!error) setLogs(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [page]);

  const actionTypes = Array.from(new Set(logs.map(l => l.action)));

  const filtered = logs.filter(log => {
    const q = search.toLowerCase();
    const matchQ = !q || log.action.includes(q) ||
      (log.target_type || "").includes(q) ||
      (log.target_id || "").includes(q) ||
      ((log.profiles as any)?.name || "").toLowerCase().includes(q);
    const matchAction = actionFilter === "all" || log.action === actionFilter;
    return matchQ && matchAction;
  });

  const stats = {
    total: logs.length,
    today: logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length,
    bans: logs.filter(l => l.action.includes("ban")).length,
    approvals: logs.filter(l => l.action.includes("approve") || l.action.includes("verify")).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <ClipboardList size={24} className="text-primary" /> 어드민 활동 로그
          </h1>
          <p className="text-sm text-muted-foreground mt-1">관리자 작업 내역을 실시간으로 추적합니다</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted text-muted-foreground text-sm hover:text-foreground transition-colors">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> 새로고침
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "전체 로그", value: stats.total, color: "from-violet-500 to-purple-600" },
          { label: "오늘 작업", value: stats.today, color: "from-blue-500 to-cyan-500" },
          { label: "정지 처리", value: stats.bans, color: "from-red-500 to-rose-600" },
          { label: "승인 처리", value: stats.approvals, color: "from-emerald-500 to-green-500" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0`}>
              <ClipboardList size={16} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="액션, 대상ID, 어드민 이름 검색..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActionFilter("all")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${actionFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            전체
          </button>
          {actionTypes.slice(0, 5).map(a => (
            <button
              key={a}
              onClick={() => setActionFilter(a)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${actionFilter === a ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-sm text-muted-foreground">
            <ClipboardList size={32} className="mx-auto mb-3 text-muted-foreground/40" />
            활동 로그가 없습니다
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((log, i) => {
              const admin = log.profiles as any;
              const timeStr = new Date(log.created_at).toLocaleString("ko-KR", {
                month: "2-digit", day: "2-digit",
                hour: "2-digit", minute: "2-digit"
              });
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.01 }}
                  className="px-5 py-3.5 flex items-center gap-4 hover:bg-muted/20 transition-colors"
                >
                  {/* Admin avatar */}
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {admin?.photo_url ? (
                      <img src={admin.photo_url} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <User size={14} className="text-primary" />
                    )}
                  </div>

                  {/* Action badge */}
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-extrabold border shrink-0 ${actionColor(log.action)}`}>
                    {actionIcon(log.action)}
                    {log.action}
                  </span>

                  {/* Target */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {log.target_type && (
                        <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-lg">
                          {log.target_type}
                        </span>
                      )}
                      {log.target_id && (
                        <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[120px]">
                          {log.target_id.slice(0, 16)}...
                        </span>
                      )}
                    </div>
                    {log.details && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        {typeof log.details === "object"
                          ? JSON.stringify(log.details).slice(0, 60)
                          : String(log.details)}
                      </p>
                    )}
                  </div>

                  {/* Admin name */}
                  <span className="text-xs text-muted-foreground shrink-0">
                    {admin?.name || "시스템"}
                  </span>

                  {/* Time */}
                  <span className="text-[10px] text-muted-foreground shrink-0 font-mono whitespace-nowrap">
                    {timeStr}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-3">
        <button
          disabled={page === 0}
          onClick={() => setPage(p => Math.max(0, p - 1))}
          className="px-4 py-2 rounded-xl bg-muted text-sm text-muted-foreground disabled:opacity-40 hover:text-foreground transition-colors"
        >
          ← 이전
        </button>
        <span className="text-sm text-muted-foreground">페이지 {page + 1}</span>
        <button
          disabled={logs.length < PAGE_SIZE}
          onClick={() => setPage(p => p + 1)}
          className="px-4 py-2 rounded-xl bg-muted text-sm text-muted-foreground disabled:opacity-40 hover:text-foreground transition-colors"
        >
          다음 →
        </button>
      </div>
    </div>
  );
};

export default AdminActivityLog;
