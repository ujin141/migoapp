import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Users, FileText, Plane, Flag, Lock, Eye, EyeOff, Shield, Megaphone, Store, MessageSquare } from "lucide-react";
import siteLogo from "@/assets/site-logo.png";
import { supabase } from "@/lib/supabaseClient";
// Admin PIN auth is removed in favor of Supabase Role Checks
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
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
type Section = "dashboard" | "users" | "posts" | "groups" | "reports" | "marketing" | "verifications" | "marketplace" | "safety" | "chat";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30분

const AdminPage = () => {
  const {
    t
  } = useTranslation();
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState(false);
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
    if (!user) {
      setAuthed(false);
      return;
    }
    // DB에서 role 또는 is_admin 검증
    supabase.from("profiles").select("is_admin, role").eq("id", user.id).maybeSingle().then(({ data }) => {
      // is_admin 컬럼이 없어서 에러가 나면 처리하기 어렵지만, 보안상 admin 권한 체크는 반드시 서버사이드(DB) 값을 봐야 함
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
      const {
        count: uCount
      } = await supabase.from("profiles").select("*", {
        count: "exact",
        head: true
      }).eq("verified", false);
      const {
        count: rCount
      } = await supabase.from("reports").select("*", {
        count: "exact",
        head: true
      }).eq("status", "pending");
      const {
        count: vCount
      } = await supabase.from("id_verifications").select("*", {
        count: "exact",
        head: true
      }).eq("status", "pending");
      setBadges({
        unverified: uCount || 0,
        reportsPending: rCount || 0,
        flaggedPosts: 0,
        pendingVerif: vCount || 0
      });
    }
    load();
  }, [authed]);

  // ── PIN gate ──────────────────────────────────────────
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Authenticating...</div>;
  }

  if (!authed) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div className="w-full max-w-sm bg-card rounded-3xl p-8 shadow-float border border-border text-center" initial={{
        opacity: 0,
        y: 24
      }} animate={{
        opacity: 1,
        y: 0
      }}>
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-3">
            <Lock size={24} className="text-red-500" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground mb-2 truncate">{t("auto.g_0565", "접근 권한 없음")}</h1>
          <p className="text-sm text-muted-foreground mb-6 truncate">{t("auto.g_0566", "관리자 권한이 있는 계정으로 로그인해야 접근 가능합니다.")}</p>
          <Button className="w-full py-6 rounded-2xl truncate" onClick={() => navigate('/login')}>
            {t("auto.g_0567", "로그인 하러 가기")}
          </Button>
        </motion.div>
      </div>;
  }

  // ── Nav items ─────────────────────────────────────────
  const {
    unverified,
    reportsPending,
    flaggedPosts,
    pendingVerif
  } = badges;
  const navItems: {
    id: Section;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }[] = [{
    id: "dashboard",
    label: t("auto.g_0568", "대시보드5"),
    icon: LayoutDashboard
  }, {
    id: "users",
    label: t("auto.g_0569", "유저관리5"),
    icon: Users,
    badge: unverified
  }, {
    id: "posts",
    label: t("auto.g_0570", "게시글관리"),
    icon: FileText,
    badge: flaggedPosts
  }, {
    id: "groups",
    label: t("auto.g_0571", "여행그룹5"),
    icon: Plane
  }, {
    id: "reports",
    label: t("auto.g_0572", "신고센터5"),
    icon: Flag,
    badge: reportsPending
  }, {
    id: "marketplace",
    label: t("auto.g_0573", "마켓상품5"),
    icon: Store
  }, {
    id: "marketing",
    label: t("auto.g_0574", "마케팅"),
    icon: Megaphone
  }, {
    id: "verifications",
    label: t("auto.g_0575", "신분증심사"),
    icon: Shield,
    badge: badges.pendingVerif
  }, {
    id: "safety" as Section,
    label: t("admin.safetyCheckins"),
    icon: Shield
  }, {
    id: "chat" as Section,
    label: t("admin.chatMonitoring"),
    icon: MessageSquare
  }];
  return <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="w-full md:w-60 shrink-0 bg-card border-b md:border-b-0 md:border-r border-border flex flex-col md:sticky top-0 md:h-screen overflow-x-auto md:overflow-y-auto">
        <div className="px-5 py-5 border-b border-border flex justify-between items-center md:block min-w-max">
          <div>
            <img src={siteLogo} alt="Migo" className="h-9 object-contain mb-1" />
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest md:flex-1">Admin Console</p>
          </div>
          <div className="md:hidden">
            <button onClick={() => setAuthed(false)} className="px-3 py-2 rounded-xl text-xs text-muted-foreground hover:bg-muted transition-colors flex items-center gap-2">
              <Lock size={12} /> Logout
            </button>
          </div>
        </div>
        <nav className="flex md:flex-col px-3 py-2 md:py-4 gap-1 md:gap-0.5 overflow-x-auto overflow-y-hidden md:overflow-visible">
          {navItems.map(item => <button key={item.id} onClick={() => setSection(item.id)} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap shrink-0 md:w-full
                ${section === item.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              <item.icon size={16} />
              <span className="md:flex-1 text-left">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                  {item.badge}
                </span>}
            </button>)}
        </nav>
        <div className="hidden md:flex flex-col px-3 py-4 border-t border-border mt-auto">
          <button onClick={() => setAuthed(false)} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted transition-colors">
            <Lock size={14} />{t("auto.g_0576", "로그아웃5")}</button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto p-4 md:p-8 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div key={section} initial={{
          opacity: 0,
          x: 10
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0
        }} transition={{
          duration: 0.15
        }}>
            {section === "dashboard" && <AdminDashboard />}
            {section === "users" && <AdminUsers />}
            {section === "posts" && <AdminPosts />}
            {section === "groups" && <AdminGroups />}
            {section === "reports" && <AdminReports />}
            {section === "marketplace" && <AdminMarketplace />}
            {section === "marketing" && <AdminMarketing />}
            {section === "verifications" && <AdminVerifications />}
            {section === "safety" && <AdminSafetyCheckins />}
            {section === "chat" && <AdminChat />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>;
};
export default AdminPage;