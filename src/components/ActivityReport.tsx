import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { getLikedCount } from "@/lib/personalizeService";
import { loadStreak } from "@/lib/streakService";
import { motion } from "framer-motion";
interface Stats {
  likes: number;
  matches: number;
  groups: number;
  checkins: number;
  streak?: number;
  currentStreak?: number;
  totalDays?: number;
}
export default function ActivityReport() {
  const {
    t
  } = useTranslation();
  const {
    user
  } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const streak = loadStreak();
  useEffect(() => {
    if (!user) return;
    async function load() {
      const [matchRes, groupRes, checkinRes] = await Promise.all([supabase.from("matches").select("id", {
        count: "exact",
        head: true
      }).or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`), supabase.from("trip_group_members").select("id", {
        count: "exact",
        head: true
      }).eq("user_id", user!.id), supabase.from("travel_check_ins").select("id", {
        count: "exact",
        head: true
      }).eq("user_id", user!.id)]);
      setStats({
        likes: getLikedCount(),
        matches: matchRes.count || 0,
        groups: groupRes.count || 0,
        checkins: checkinRes.count || 0
      });
    }
    load();
  }, [user]);
  const items = [{
    emoji: "❤️",
    label: t("auto.z_\uC88B\uC544\uC694_1469", "\uC88B\uC544\uC694"),
    value: stats?.likes ?? "—"
  }, {
    emoji: "💫",
    label: t("auto.z_\uB9E4\uCE6D_1470", "\uB9E4\uCE6D"),
    value: stats?.matches ?? "—"
  }, {
    emoji: "👥",
    label: t("auto.z_\uADF8\uB8F9_1471", "\uADF8\uB8F9"),
    value: stats?.groups ?? "—"
  }, {
    emoji: "📍",
    label: t("auto.z_\uCCB4\uD06C\uC778_1472", "\uCCB4\uD06C\uC778"),
    value: stats?.checkins ?? "—"
  }, {
    emoji: "🔥",
    label: t("auto.z_\uC2A4\uD2B8\uB9AD_1473", "\uC2A4\uD2B8\uB9AD"),
    value: t("stats.days", { count: stats?.streak || stats?.currentStreak || streak?.currentStreak || 0, defaultValue: "{{count}}일" })
  }, {
    emoji: "📅",
    label: t("auto.z_\uCD1D\uBC29\uBB38_1475", "\uCD1D\uBC29\uBB38"),
    value: t("stats.times", { count: stats?.totalDays || streak?.totalDays || 0, defaultValue: "{{count}}회" })
  }];
  return <div className="px-4 pb-2">
      {/* 한 줄 가로 스크롤 — 여백 없음 */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 truncate">
        {items.map((item, i) => <motion.div key={item.label} className="shrink-0 flex flex-col items-center justify-center gap-0.5 bg-card border border-border/40 rounded-xl px-2 py-2 min-w-[68px]" initial={{
        opacity: 0,
        scale: 0.85
      }} animate={{
        opacity: 1,
        scale: 1
      }} transition={{
        delay: i * 0.04,
        duration: 0.2
      }}>
            <span className="text-[16px] leading-none">{item.emoji}</span>
            <span className="text-sm font-black text-foreground leading-tight">{item.value}</span>
            <span className="text-[9px] text-muted-foreground whitespace-nowrap max-w-[60px] overflow-hidden text-ellipsis text-center block">{item.label}</span>
          </motion.div>)}
      </div>
    </div>;
}