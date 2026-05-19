/**
 * useReturnReward
 * 7일 이상 미접속 후 복귀 시 슈퍼라이크 3개 자동 지급 + 다국어 환영 토스트
 */
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import i18n from "@/i18n";

export function useReturnReward(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    const key = "migo_return_reward_checked";
    const todayStr = new Date().toISOString().split("T")[0];

    // 오늘 이미 체크한 경우 스킵
    if (sessionStorage.getItem(key) === todayStr) return;
    sessionStorage.setItem(key, todayStr);

    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("last_active_at, super_likes_left")
          .eq("id", userId)
          .maybeSingle();

        if (!data?.last_active_at) return;

        const lastActive = new Date(data.last_active_at);
        const daysSince = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSince >= 7) {
          const newCount = (data.super_likes_left ?? 0) + 3;

          const { error } = await supabase
            .from("profiles")
            .update({
              super_likes_left: newCount,
              last_active_at: new Date().toISOString(),
            })
            .eq("id", userId);

          if (!error) {
            // 복귀 보상 알림 DB 기록
            await supabase.from("notifications").insert({
              user_id: userId,
              type: "system",
              target_text: i18n.t(
                "retention.return_reward.toast_desc",
                "You've been away for {{days}} days! We've gifted you 3 Super Likes ⭐⭐⭐",
                { days: daysSince }
              ),
              is_read: false,
            }).then(({ error }) => {
              if (error && error.code !== '23505') console.warn("return reward notif:", error.message);
            });

            toast({
              title: i18n.t("retention.return_reward.toast_title", "🎉 Welcome back!"),
              description: i18n.t(
                "retention.return_reward.toast_desc",
                "You've been away for {{days}} days! We've gifted you 3 Super Likes ⭐⭐⭐",
                { days: daysSince }
              ),
              duration: 6000,
            });
          }
        } else {
          // 접속 시간 갱신
          await supabase
            .from("profiles")
            .update({ last_active_at: new Date().toISOString() })
            .eq("id", userId)
            .catch(() => {});
        }
      } catch {
        // 네트워크 오류 등 무시
      }
    })();
  }, [userId]);
}
