import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, FileText, Plane, Flag, Lock,
  Shield, Megaphone, Store, MessageSquare, DollarSign,
  BarChart3, Bell, Settings, ClipboardList
} from "lucide-react";
import siteLogo from "@/assets/site-logo.png";
import { supabase } from "@/lib/supabaseClient";
import { fetchAdminStats } from "@/lib/adminService";
import { AdminDashboard } from "./admin/AdminDashboard";
import { AdminUsers } from "./admin/AdminUsers";
import { AdminPosts } from "./admin/AdminPosts";
import { AdminGroups } from "./admin/AdminGroups";
import { AdminReports } from "./admin/AdminReports";
import { AdminMarketing } from "./admin/AdminMarketing";
import AdminVerifications from "./admin/AdminVerifications";
import AdminMarketplace from "./admin/AdminMarketplace";
import { AdminSafetyCheckins } from "./admin/AdminSafetyCheckins";
import { AdminChat } from "./admin/AdminChat";
import { AdminRevenue } from "./admin/AdminRevenue";
import { AdminAnalytics } from "./admin/AdminAnalytics";
import { AdminNotifications } from "./admin/AdminNotifications";
import { AdminAppSettings } from "./admin/AdminAppSettings";
import { AdminActivityLog } from "./admin/AdminActivityLog";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type Section =
  | "dashboard" | "users" | "posts" | "groups" | "reports"
  | "marketing" | "verifications" | "marketplace" | "safety" | "chat"
  | "revenue" | "analytics" | "notifications" | "settings" | "activitylog";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30분

const AdminPage = () => {
  const { t } = useTranslation();
  const [authed, setAuthed] = useState(false);
  const [section, setSection] = useState<Section>("dashboard");
  const [badges, setBadges] = useState({
    unverified: 0,
    reportsPending: 0,
    flaggedPosts: 0,
    pendingVerif: 0
  });
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const sessionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetSessionTimer = useCallback(() => {
    if (sessionTimer.current) clearTimeout(sessionTimer.current);
    sessionTimer.current = setTimeout(() => {
      setAuthed(false);
    }, SESSION_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setAuthed(false); return; }
    supabase.from("profiles").select("is_admin, role").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data?.is_admin || data?.role === 'admin') {
        setAuthed(true);
        resetSessionTimer();
      } else {
        setAuthed(false);
      }
    });
  }, [user, authLoading, resetSessionTimer]);

  useEffect(() => {
    if (!authed) return;
    const events = ['click', 'keydown', 'mousemove', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetSessionTimer));
    return () => {
      if (sessionTimer.current) clearTimeout(sessionTimer.current);
      events.forEach(e => window.removeEventListener(e, resetSessionTimer));
    };
  }, [authed, resetSessionTimer]);

  useEffect(() => {
    if (!authed) return;
    async function load() {
      // adminService의 fetchAdminStats 활용 (adminSupabase client로 RLS 우회)
      const stats = await fetchAdminStats();
      const { count: vCount } = await supabase
        .from("id_verifications")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      setBadges({
        unverified: 0,            // verified 컬럼 없을 수 있으므로 0으로 유지
        reportsPending: stats.reports || 0,
        flaggedPosts: 0,
        pendingVerif: vCount || 0
      });
    }
    load();
    
    window.addEventListener("adminStatsNeedRefresh", load);
    // 폴링으로 30초마다 자동 갱신
    const interval = setInterval(load, 30000);
    
    return () => {
      window.removeEventListener("adminStatsNeedRefresh", load);
      clearInterval(interval);
    };
  }, [authed]);

  // ── Auth gate ────────────────────────────────────────────
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Authenticating...</div>;
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          className="w-full max-w-sm bg-card rounded-3xl p-8 shadow-float border border-border text-center"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-3">
            <Lock size={24} className="text-red-500" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground mb-2">{t("auto.g_0565", "접근 권한 없음")}</h1>
          <p className="text-sm text-muted-foreground mb-6">{t("auto.g_0566", "관리자 권한이 있는 계정으로 로그인해야 접근 가능합니다.")}</p>
          <Button className="w-full py-6 rounded-2xl" onClick={() => navigate('/login')}>
            {t("auto.g_0567", "로그인 하러 가기")}
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Nav groups ────────────────────────────────────────────
  const { unverified, reportsPending, flaggedPosts, pendingVerif } = badges;

  type NavItem = { id: Section; label: string; icon: React.ElementType; badge?: number; };
  type NavGroup = { label: string; items: NavItem[]; };

  const navGroups: NavGroup[] = [
    {
      label: "개요",
      items: [
        { id: "dashboard", label: "대시보드", icon: LayoutDashboard },
        { id: "analytics", label: "분석", icon: BarChart3 },
        { id: "revenue", label: "수익 관리", icon: DollarSign },
      ]
    },
    {
      label: "유저 관리",
      items: [
        { id: "users", label: "유저 관리", icon: Users, badge: unverified },
        { id: "reports", label: "신고 센터", icon: Flag, badge: reportsPending },
        { id: "verifications", label: "신분증 심사", icon: Shield, badge: pendingVerif },
        { id: "safety", label: "안전 체크인", icon: Shield },
      ]
    },
    {
      label: "콘텐츠",
      items: [
        { id: "posts", label: "게시글 관리", icon: FileText, badge: flaggedPosts },
        { id: "groups", label: "여행 그룹", icon: Plane },
        { id: "chat", label: "채팅 모니터링", icon: MessageSquare },
        { id: "marketplace", label: "마켓 상품", icon: Store },
      ]
    },
    {
      label: "마케팅 & 알림",
      items: [
        { id: "marketing", label: "마케팅", icon: Megaphone },
        { id: "notifications", label: "알림 발송", icon: Bell },
      ]
    },
    {
      label: "시스템",
      items: [
        { id: "settings", label: "앱 설정", icon: Settings },
        { id: "activitylog", label: "활동 로그", icon: ClipboardList },
      ]
    },
  ];

  return (
    <div className="bg-background flex">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="hidden md:flex fixed top-0 left-0 w-60 h-screen flex-col bg-card border-r border-border z-40">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border shrink-0">
          <img src={siteLogo} alt="Migo" className="h-9 object-contain mb-1" />
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Admin Console</p>
        </div>

        {/* Nav Groups — 스크롤 가능 */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navGroups.map(group => (
            <div key={group.label} className="mb-2">
              <p className="text-[9px] font-extrabold text-muted-foreground/50 uppercase tracking-widest px-3 py-1.5">
                {group.label}
              </p>
              {group.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
                    ${section === item.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  <item.icon size={15} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-border shrink-0">
          <button
            onClick={() => setAuthed(false)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <Lock size={14} /> {t("auto.g_0576", "로그아웃")}
          </button>
        </div>
      </aside>

      {/* ── Mobile top nav ──────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center gap-2 overflow-x-auto">
        <img src={siteLogo} alt="Migo" className="h-7 object-contain shrink-0 mr-1" />
        {navGroups.flatMap(g => g.items).map(item => (
          <button
            key={item.id}
            onClick={() => setSection(item.id)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all
              ${section === item.id ? "bg-primary/10 text-primary" : "text-muted-foreground bg-muted"}`}
          >
            <item.icon size={11} />{item.label}
            {item.badge !== undefined && item.badge > 0 && (
              <span className="min-w-[14px] h-[14px] px-0.5 rounded-full bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="md:ml-60 flex-1 h-screen overflow-y-auto pt-14 md:pt-0 p-4 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {section === "dashboard"    && <AdminDashboard />}
            {section === "users"        && <AdminUsers />}
            {section === "posts"        && <AdminPosts />}
            {section === "groups"       && <AdminGroups />}
            {section === "reports"      && <AdminReports />}
            {section === "marketplace"  && <AdminMarketplace />}
            {section === "marketing"    && <AdminMarketing />}
            {section === "verifications"&& <AdminVerifications />}
            {section === "safety"       && <AdminSafetyCheckins />}
            {section === "chat"         && <AdminChat />}
            {section === "revenue"      && <AdminRevenue />}
            {section === "analytics"    && <AdminAnalytics />}
            {section === "notifications"&& <AdminNotifications />}
            {section === "settings"     && <AdminAppSettings />}
            {section === "activitylog"  && <AdminActivityLog />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminPage;