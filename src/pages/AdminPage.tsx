import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Users, FileText, Plane, Flag, Lock, Eye, EyeOff, Shield, Megaphone, Store, MessageSquare } from "lucide-react";
import siteLogo from "@/assets/site-logo.png";
import { supabase } from "@/lib/supabaseClient";
// ⚠️ VITE_ADMIN_PIN이 설정되지 않으면 빈 문자열로 fallback — 기본 PIN 없음
const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || "";
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
type Section = "dashboard" | "users" | "posts" | "groups" | "reports" | "marketing" | "verifications" | "marketplace" | "safety" | "chat";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30분
const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 30 * 1000; // 30초

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
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockSecsLeft, setLockSecsLeft] = useState(0);
  const sessionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 30분 비활동 세션 타임아웃
  const resetSessionTimer = useCallback(() => {
    if (sessionTimer.current) clearTimeout(sessionTimer.current);
    sessionTimer.current = setTimeout(() => {
      setAuthed(false);
    }, SESSION_TIMEOUT_MS);
  }, []);
  useEffect(() => {
    if (!authed) return;
    resetSessionTimer();
    const events = ['click', 'keydown', 'mousemove', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetSessionTimer));
    return () => {
      if (sessionTimer.current) clearTimeout(sessionTimer.current);
      events.forEach(e => window.removeEventListener(e, resetSessionTimer));
    };
  }, [authed, resetSessionTimer]);

  // 잠금 카운트다운
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        clearInterval(tick);
      } else setLockSecsLeft(remaining);
    }, 500);
    return () => clearInterval(tick);
  }, [lockedUntil]);
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
  if (!authed) {
    const isLocked = !!lockedUntil && Date.now() < lockedUntil;
    const tryLogin = () => {
      if (isLocked) return;
      if (!ADMIN_PIN) {
        setPinError(true);
        setPin("");
        return;
      }
      if (pin === ADMIN_PIN) {
        setAuthed(true);
        setPinError(false);
        setAttempts(0);
      } else {
        const next = attempts + 1;
        setAttempts(next);
        setPinError(true);
        setPin("");
        if (next >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCKOUT_MS);
          setLockSecsLeft(Math.ceil(LOCKOUT_MS / 1000));
        }
      }
    };
    return <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div className="w-full max-w-sm bg-card rounded-3xl p-8 shadow-float border border-border" initial={{
        opacity: 0,
        y: 24
      }} animate={{
        opacity: 1,
        y: 0
      }}>
          <div className="text-center mb-8">
            <img src={siteLogo} alt="Migo" className="h-12 mx-auto mb-4 object-contain" />
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Shield size={24} className="text-primary" />
            </div>
            <h1 className="text-xl font-extrabold text-foreground">{"어드민대시"}</h1>
            <p className="text-sm text-muted-foreground mt-1">{"관리자PI"}</p>
          </div>
          <div className="relative mb-4">
            <input type={showPin ? "text" : "password"} value={pin} onChange={e => {
            setPin(e.target.value);
            setPinError(false);
          }} onKeyDown={e => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) tryLogin();
          }} placeholder={"PIN입력"} className={`w-full px-4 py-3.5 rounded-2xl bg-muted border text-foreground text-sm outline-none transition-all
                ${pinError ? "border-red-500" : "border-border focus:border-primary"}`} />
            <button onClick={() => setShowPin(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {pinError && !lockedUntil && <p className="text-xs text-red-400 mb-3 text-center">{"PIN이올"}{MAX_ATTEMPTS - attempts < 0 ? 0 : MAX_ATTEMPTS - Math.min(attempts, MAX_ATTEMPTS)}{"회남음54"}</p>}
          {lockedUntil && <p className="text-xs text-red-400 mb-3 text-center">⏳ {lockSecsLeft}{"초후재시도"}</p>}
          <motion.button whileTap={{
          scale: 0.97
        }} onClick={tryLogin} disabled={!!lockedUntil} className="w-full py-3.5 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Lock size={14} />{"입장하기5"}</motion.button>

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
    label: "대시보드5",
    icon: LayoutDashboard
  }, {
    id: "users",
    label: "유저관리5",
    icon: Users,
    badge: unverified
  }, {
    id: "posts",
    label: "게시글관리",
    icon: FileText,
    badge: flaggedPosts
  }, {
    id: "groups",
    label: "여행그룹5",
    icon: Plane
  }, {
    id: "reports",
    label: "신고센터5",
    icon: Flag,
    badge: reportsPending
  }, {
    id: "marketplace",
    label: "마켓상품5",
    icon: Store
  }, {
    id: "marketing",
    label: "마케팅55",
    icon: Megaphone
  }, {
    id: "verifications",
    label: "신분증심사",
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
            <Lock size={14} />{"로그아웃5"}</button>
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