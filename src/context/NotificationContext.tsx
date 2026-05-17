import i18n from "@/i18n";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

export type NotifType =
  | "profile_view"
  | "like"
  | "superlike"
  | "comment"
  | "match"
  | "group_join"
  | "group_approved"
  | "group_rejected"
  | "message"
  | string;

export interface Notif {
  id: string;
  type: NotifType;
  actorId: string;
  actor: string;
  actorPhoto: string;
  target?: string;
  title?: string;
  content?: string;
  time: string;
  read: boolean;
}

/** 새 메시지 인앱 배너용 */
export interface MessageBanner {
  threadId: string;
  senderName: string;
  senderPhoto: string;
  preview: string;
}

interface NotificationContextType {
  notifs: Notif[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  addNotif: (n: Omit<Notif, "id" | "time" | "read">) => void;
  /** 채팅 메시지 수신 배너 (null = 숨김) */
  messageBanner: MessageBanner | null;
  clearMessageBanner: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifs: [],
  unreadCount: 0,
  markRead: () => {},
  markAllRead: () => {},
  addNotif: () => {},
  messageBanner: null,
  clearMessageBanner: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

/** 상대적 timestamp (방금 전, 5분 전, …) */
function formatTime(isoStr: string): string {
  const diffSec = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (diffSec < 60) return i18n.t("notif.justNow", "방금 전");
  if (diffSec < 3600) return i18n.t("notif.minutesAgo", { count: Math.floor(diffSec / 60), defaultValue: `${Math.floor(diffSec / 60)}분 전` });
  return new Intl.DateTimeFormat(i18n.language || "en", {
    hour: "numeric",
    minute: "numeric",
  }).format(new Date(isoStr));
}

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, sessionReady } = useAuth();

  // ── 로컬 읽음 캐시 (DB 실패 시에도 UI 반영 유지) ──
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("readNotifs");
      return new Set<string>(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set<string>();
    }
  });
  const readIdsRef = useRef(readIds);
  useEffect(() => { readIdsRef.current = readIds; }, [readIds]);

  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [messageBanner, setMessageBanner] = useState<MessageBanner | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unreadCount = notifs.filter((n) => !n.read && !readIds.has(n.id)).length;

  // ── 알림 목록 fetch ──
  useEffect(() => {
    if (!user || !sessionReady) return;

    const fetchNotifs = async () => {
      const [notifsRes, inAppRes] = await Promise.all([
        supabase
          .from("notifications")
          .select("id, type, actor_id, target_text, is_read, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("in_app_notifications")
          .select("id, type, title, content, is_read, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50)
      ]);

      let combined: Notif[] = [];

      if (notifsRes.data && notifsRes.data.length > 0) {
        const actorIds = [
          ...new Set(notifsRes.data.map((n: any) => n.actor_id).filter(Boolean)),
        ];
        const { data: actorProfiles } = await supabase
          .from("profiles")
          .select("id, name, photo_url")
          .in("id", actorIds);

        const profileMap: Record<string, any> = {};
        for (const p of actorProfiles || []) profileMap[p.id] = p;

        combined.push(
          ...notifsRes.data.map((n: any) => ({
            id: n.id,
            type: n.type,
            actorId: n.actor_id,
            actor: profileMap[n.actor_id]?.name || i18n.t("auto.g_0321", "Anonymous"),
            actorPhoto: profileMap[n.actor_id]?.photo_url || "",
            target: n.target_text || undefined,
            time: formatTime(n.created_at),
            read: (n.is_read ?? false) || readIdsRef.current.has(n.id),
            _createdAt: new Date(n.created_at).getTime()
          } as Notif & { _createdAt: number }))
        );
      }

      if (inAppRes.data && inAppRes.data.length > 0) {
        combined.push(
          ...inAppRes.data.map((n: any) => ({
            id: n.id,
            type: n.type || "admin",
            actorId: "",
            actor: "System",
            actorPhoto: "",
            title: n.title,
            content: n.content,
            target: n.content || undefined,
            time: formatTime(n.created_at),
            read: (n.is_read ?? false) || readIdsRef.current.has(n.id),
            _createdAt: new Date(n.created_at).getTime()
          } as Notif & { _createdAt: number }))
        );
      }

      combined.sort((a: any, b: any) => b._createdAt - a._createdAt);
      setNotifs(combined.slice(0, 50));
    };

    fetchNotifs();

    // ── 단일 채널: notifications + in_app_notifications + messages ──
    const channel = supabase
      .channel(`notifs_all:${user.id}`)

      // 1) notifications 테이블 (좋아요 / 매칭 / 댓글 / 그룹)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const n = payload.new as any;
          const { data: actorProfile } = await supabase
            .from("profiles")
            .select("name, photo_url")
            .eq("id", n.actor_id)
            .single();

          setNotifs((prev) => [
            {
              id: n.id,
              type: n.type,
              actorId: n.actor_id,
              actor:
                actorProfile?.name || i18n.t("auto.g_0322", "Anonymous"),
              actorPhoto: actorProfile?.photo_url || "",
              target: n.target_text || undefined,
              time: formatTime(n.created_at),
              read:
                (n.is_read ?? false) || readIdsRef.current.has(n.id),
            },
            ...prev,
          ]);
        }
      )

      // 2) in_app_notifications (관리자 발송 / 시스템)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "in_app_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as any;
          setNotifs((prev) => [
            {
              id: n.id,
              type: n.type || "admin",
              actorId: "",
              actor: "System",
              actorPhoto: "",
              title: n.title,
              content: n.content,
              target: n.message || n.content || undefined,
              time: formatTime(n.created_at || new Date().toISOString()),
              read: false,
            },
            ...prev,
          ]);
        }
      )

      // 3) messages (새 채팅 메시지 → 인앱 배너)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const msg = payload.new as any;
          if (!msg.sender_id || msg.sender_id === user.id) return;

          // 내가 속한 채팅방인지 확인
          const { data: memberCheck } = await supabase
            .from("chat_members")
            .select("id")
            .eq("thread_id", msg.thread_id)
            .eq("user_id", user.id)
            .maybeSingle();

          if (!memberCheck) return;

          // 발신자 정보 조회
          const { data: sender } = await supabase
            .from("profiles")
            .select("name, photo_url")
            .eq("id", msg.sender_id)
            .single();

          const rawText = msg.text || msg.content || "";
          const preview =
            rawText.length > 50
              ? rawText.slice(0, 50) + "…"
              : rawText || i18n.t("notif.newMessage", "새 메시지");

          setMessageBanner({
            threadId: msg.thread_id,
            senderName: sender?.name || i18n.t("auto.g_0321", "Anonymous"),
            senderPhoto: sender?.photo_url || "",
            preview,
          });

          // 4초 후 자동 닫기 (이전 타이머 취소 후 재설정)
          if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
          bannerTimerRef.current = setTimeout(() => setMessageBanner(null), 4000);
        }
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      // 컴포넌트 언마운트 시 pending 배너 타이머 정리
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
        bannerTimerRef.current = null;
      }
    };
  }, [user?.id, sessionReady]);

  // ── 읽음 처리 (notifications + in_app_notifications 모두) ──
  const markRead = useCallback(
    async (id: string) => {
      setReadIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        localStorage.setItem("readNotifs", JSON.stringify([...next]));
        return next;
      });
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      // 두 테이블 모두 업데이트 (어느 쪽 테이블 레코드인지 모르므로 양쪽 시도)
      await Promise.allSettled([
        supabase.from("notifications").update({ is_read: true }).eq("id", id),
        supabase
          .from("in_app_notifications")
          .update({ is_read: true })
          .eq("id", id),
      ]);
    },
    []
  );

  // ── 전체 읽음 처리 ──
  const markAllRead = useCallback(
    async () => {
      if (!user) return;

      setNotifs((prev) => {
        const allIds = prev.map((n) => n.id);
        setReadIds((prevIds) => {
          const next = new Set(prevIds);
          allIds.forEach((id) => next.add(id));
          localStorage.setItem("readNotifs", JSON.stringify([...next]));
          return next;
        });
        return prev.map((n) => ({ ...n, read: true }));
      });

      await Promise.allSettled([
        supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("user_id", user.id),
        supabase
          .from("in_app_notifications")
          .update({ is_read: true })
          .eq("user_id", user.id),
      ]);
    },
    [user?.id]
  );

  // ── 직접 알림 추가 (UI 레벨에서 필요한 경우) ──
  const addNotif = useCallback(
    async (template: Omit<Notif, "id" | "time" | "read">) => {
      if (!user) return;
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: template.type,
        actor_id: user.id,
        target_text: template.target,
      });
    },
    [user]
  );

  const clearMessageBanner = useCallback(() => setMessageBanner(null), []);

  return (
    <NotificationContext.Provider
      value={{
        notifs,
        unreadCount,
        markRead,
        markAllRead,
        addNotif,
        messageBanner,
        clearMessageBanner,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};