/**
 * useGroupActions — QUAL-10 리팩토링
 * DiscoverPage의 그룹 관련 액션 로직 (join, delete, apply, approve/reject)을 분리한 커스텀 훅
 */
import React, { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/context/SubscriptionContext";
import { useAdMob } from "@/hooks/useAdMob";
import { TripGroup } from "@/types";

type User = { id: string; email?: string; name?: string; photoUrl?: string } | null;

interface JoinPopupState {
  group: TripGroup;
  newCount: number;
  genders: ("male" | "female" | "unknown")[];
  deadlineMs: number;
}

interface ConfirmDialog {
  title: string;
  desc: string;
  onConfirm: () => void;
}

export function useGroupActions(
  user: User,
  setTripGroups: React.Dispatch<React.SetStateAction<TripGroup[]>>,
  setShowPlusModal: (v: boolean) => void
) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isPlus, isPremium, canJoinPremiumGroups } = useSubscription();
  const { showInterstitial } = useAdMob();

  // ── Join popup state ─────────────────────────────
  const [joinPopup, setJoinPopup] = useState<JoinPopupState | null>(null);
  const [countdown, setCountdown] = useState<string>("");
  const timersRef = useRef<{ timeouts: any[]; intervals: any[] }>({ timeouts: [], intervals: [] });

  const clearAllTimers = useCallback(() => {
    timersRef.current.timeouts.forEach(clearTimeout);
    timersRef.current.intervals.forEach(clearInterval);
    timersRef.current = { timeouts: [], intervals: [] };
  }, []);

  // 훅 사용 컴포넌트 언마운트 시 자동 cleanup
  React.useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const closeJoinPopup = useCallback(() => {
    setJoinPopup(null);
    clearAllTimers();
  }, [clearAllTimers]);

  // ── Confirm dialog ────────────────────────────────
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);

  // ── Apply state ──────────────────────────────────
  const [applyGroup, setApplyGroup] = useState<TripGroup | null>(null);
  const [applyMessage, setApplyMessage] = useState("");
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [appliedGroups, setAppliedGroups] = useState<Set<string>>(new Set());

  // ── Applicants state ─────────────────────────────
  const [showApplicants, setShowApplicants] = useState<string | null>(null);
  const [applicantsList, setApplicantsList] = useState<any[]>([]);

  // ── Join group ────────────────────────────────────
  const joiningRef = useRef(false);

  const joinGroup = useCallback(async (group: TripGroup) => {
    if (!user) return;

    const isMock = group.id.startsWith("00000000") || group.id.startsWith("seed");
    if (!isMock) {
      const { error } = await supabase.from("trip_group_members").insert({
        group_id: group.id,
        user_id: user.id,
      });
      if (error && error.code !== "23505") {
        toast({ title: t("alert.t47Title"), variant: "destructive" });
        return;
      }

      const { data: memberRows } = await supabase
        .from("trip_group_members")
        .select("user_id, profiles(gender)")
        .eq("group_id", group.id);

      const realCount = memberRows?.length ?? group.currentMembers + 1;
      const realGenders: ("male" | "female" | "unknown")[] = (memberRows || []).map((m: any) => {
        const g = m.profiles?.gender?.toLowerCase();
        return g === "male" ? "male" : g === "female" ? "female" : "unknown";
      });

      setTripGroups((prev) =>
        prev.map((g) =>
          g.id === group.id
            ? { ...g, joined: true, currentMembers: realCount, memberGenders: realGenders }
            : g
        )
      );

      try {
        const threadName = `${group.title.substring(0, 25)}...`;
        const { data: existingThread } = await supabase
          .from("chat_threads")
          .select("id")
          .eq("group_id", group.id)
          .maybeSingle();

        let threadId: string | null = existingThread?.id || null;

        if (!threadId) {
          const { data: newThread } = await supabase
            .from("chat_threads")
            .insert({
              name: threadName,
              photo: group.hostPhoto || null,
              group_id: group.id,
              last_message: t("groupPopup.chatCreated", "그룹 채팅방이 개설되었습니다 🎉"),
            })
            .select("id")
            .single();
          threadId = newThread?.id || null;

          if (threadId) {
            await supabase.from("chat_members").upsert(
              [
                { thread_id: threadId, user_id: group.hostId },
                { thread_id: threadId, user_id: user.id },
              ],
              { onConflict: "thread_id,user_id" }
            );
          }
        } else {
          await supabase
            .from("chat_members")
            .upsert({ thread_id: threadId, user_id: user.id }, { onConflict: "thread_id,user_id" });
        }

        if (!isPlus && !isPremium) {
          setTimeout(() => showInterstitial(), 800);
        }
      } catch (err) {
        console.error("Chat creation error:", err);
      }

      const validDaysLeft =
        typeof group.daysLeft === "number" && !isNaN(group.daysLeft) ? group.daysLeft : 1;
      const deadlineMs = Date.now() + validDaysLeft * 24 * 60 * 60 * 1000;
      clearAllTimers();
      setJoinPopup({
        group: { ...group, currentMembers: realCount, memberGenders: realGenders },
        newCount: realCount,
        genders: realGenders,
        deadlineMs,
      });

      let extras = 0;
      const intervalId = setInterval(() => {
        if (extras >= 2 || realCount + extras >= group.maxMembers - 1) {
          clearInterval(intervalId);
          return;
        }
        extras++;
        const randGender: "male" | "female" = Math.random() > 0.5 ? "male" : "female";
        setJoinPopup((prev) => {
          if (!prev) return null;
          return { ...prev, newCount: prev.newCount + 1, genders: [...prev.genders, randGender] };
        });
      }, 3500);
      timersRef.current.intervals.push(intervalId);

      const msTo1h = deadlineMs - Date.now() - 60 * 60 * 1000;
      if (msTo1h > 0) {
        const t1 = setTimeout(() => {
          // countdownAlert은 DiscoverPage에서 처리
        }, msTo1h);
        timersRef.current.timeouts.push(t1);
      }
      timersRef.current.timeouts.push(setTimeout(() => clearInterval(intervalId), 15000));
      return;
    }

    // 목업 그룹 fallback
    const newCount = group.currentMembers + 1;
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("gender")
      .eq("id", user.id)
      .single();
    const myGender: "male" | "female" | "unknown" =
      myProfile?.gender === "male"
        ? "male"
        : myProfile?.gender === "female"
        ? "female"
        : "unknown";
    const existingGenders: ("male" | "female" | "unknown")[] =
      group.memberGenders ?? Array(group.currentMembers).fill("unknown");
    const allGenders = [...existingGenders, myGender];
    setTripGroups((prev) =>
      prev.map((g) =>
        g.id === group.id ? { ...g, joined: true, currentMembers: newCount, memberGenders: allGenders } : g
      )
    );
    const validDaysLeft =
      typeof group.daysLeft === "number" && !isNaN(group.daysLeft) ? group.daysLeft : 1;
    const deadlineMs = Date.now() + validDaysLeft * 24 * 60 * 60 * 1000;
    clearAllTimers();
    setJoinPopup({ group: { ...group, currentMembers: newCount, memberGenders: allGenders }, newCount, genders: allGenders, deadlineMs });
    const tClose = setTimeout(() => setJoinPopup(null), 15000);
    timersRef.current.timeouts.push(tClose);
  }, [user, isPlus, isPremium, clearAllTimers, setTripGroups, showInterstitial, t, toast]);

  const handleJoin = useCallback(
    async (group: TripGroup) => {
      if (group.joined) {
        toast({ title: t("alert.t44Title"), description: t("alert.t44Desc") });
        return;
      }
      if (group.currentMembers >= group.maxMembers) {
        toast({ title: t("alert.t45Title"), description: t("alert.t45Desc"), variant: "destructive" });
        return;
      }
      if (group.isPremiumGroup && !canJoinPremiumGroups) {
        toast({ title: t("alert.t46Title"), description: t("alert.t46Desc") });
        setShowPlusModal(true);
        return;
      }
      if (joiningRef.current) return;
      joiningRef.current = true;
      try {
        await joinGroup(group);
      } finally {
        joiningRef.current = false;
      }
    },
    [canJoinPremiumGroups, joinGroup, setShowPlusModal, t, toast]
  );

  // ── Delete group ──────────────────────────────────
  const deleteGroup = useCallback(
    (groupId: string, detailGroup: TripGroup | null, setDetailGroup: (v: TripGroup | null) => void, setTripGroupsCb: React.Dispatch<React.SetStateAction<TripGroup[]>>) => {
      if (!user) return;
      setConfirmDialog({
        title: t("alert.c54Confirm"),
        desc: t("alert.c54Desc", "그룹을 삭제하면 모든 멤버가 내보내집니다."),
        onConfirm: async () => {
          const { error } = await supabase
            .from("trip_groups")
            .delete()
            .eq("id", groupId)
            .eq("host_id", user.id);
          if (error) {
            toast({ title: t("alert.t51Title") });
            return;
          }
          setTripGroupsCb((prev) => prev.filter((g) => g.id !== groupId));
          if (detailGroup?.id === groupId) setDetailGroup(null);
          toast({ title: t("alert.t52Title") });
        },
      });
    },
    [user, t, toast]
  );

  // ── Apply to group ────────────────────────────────
  const handleApply = useCallback(async () => {
    if (!user || !applyGroup) return;
    if (!applyMessage.trim()) {
      toast({ title: t("auto.g_0019", "지원 메시지를 입력해 주세요"), variant: "destructive" });
      return;
    }
    setApplySubmitting(true);
    try {
      const { error } = await supabase.from("trip_applications").insert({
        group_id: applyGroup.id,
        applicant_id: user.id,
        message: applyMessage,
        status: "pending",
      });
      if (error) throw error;
      setAppliedGroups((prev) => new Set([...prev, applyGroup.id]));
      setApplyGroup(null);
      setApplyMessage("");
      toast({
        title: t("auto.g_0020", "지원 완료! 🎉"),
        description: t("auto.g_0021", "호스트가 프로필을 확인한 후 연락드릴 거예요."),
      });
      if (!isPlus && !isPremium) {
        setTimeout(() => showInterstitial(), 500);
      }
    } catch (e: any) {
      if (e?.code === "23505") {
        toast({ title: t("auto.g_0022", "이미 지원한 동행입니다"), variant: "destructive" });
      } else {
        toast({ title: t("auto.g_0023", "지원 실패"), variant: "destructive" });
      }
    } finally {
      setApplySubmitting(false);
    }
  }, [user, applyGroup, applyMessage, isPlus, isPremium, showInterstitial, t, toast]);

  // ── View applicants ───────────────────────────────
  const handleViewApplicants = useCallback(async (groupId: string) => {
    setShowApplicants(groupId);
    const { data } = await supabase
      .from("trip_applications")
      .select("*, profiles:applicant_id(id, name, photo_url, bio, age)")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });
    setApplicantsList(data || []);
  }, []);

  const handleApproveApplicant = useCallback(
    async (appId: string) => {
      await supabase.from("trip_applications").update({ status: "approved" }).eq("id", appId);
      setApplicantsList((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: "approved" } : a))
      );
      toast({
        title: t("auto.g_0024", "동행 승인 완료! ✅"),
        description: t("auto.g_0025", "그룹 채팅이 자동으로 생성됩니다."),
      });
    },
    [t, toast]
  );

  const handleRejectApplicant = useCallback(
    async (appId: string) => {
      await supabase.from("trip_applications").update({ status: "rejected" }).eq("id", appId);
      setApplicantsList((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: "rejected" } : a))
      );
      toast({ title: t("auto.g_0026", "거절 완료") });
    },
    [t, toast]
  );

  return {
    // Join
    handleJoin,
    joinPopup,
    setJoinPopup,
    closeJoinPopup,
    countdown,
    setCountdown,
    timersRef,
    clearAllTimers,
    // Confirm dialog
    confirmDialog,
    setConfirmDialog,
    // Apply
    applyGroup,
    setApplyGroup,
    applyMessage,
    setApplyMessage,
    applySubmitting,
    appliedGroups,
    handleApply,
    // Applicants
    showApplicants,
    setShowApplicants,
    applicantsList,
    handleViewApplicants,
    handleApproveApplicant,
    handleRejectApplicant,
    // Delete
    deleteGroup,
  };
}
