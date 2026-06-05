import i18n from 'i18next';
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

/** 프로필 조회 인앱 배너용 */
export interface ProfileViewBanner {
  actorName: string;
  actorPhoto: string;
}

/** 좋아요/슈퍼라이크 수신 배너용 */
export interface LikeBanner {
  type: 'like' | 'superlike';
  actorName: string;
  actorPhoto: string;
  message?: string;
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
  /** 프로필 조회 배너 (null = 숨김) */
  profileViewBanner: ProfileViewBanner | null;
  clearProfileViewBanner: () => void;
  /** 좋아요/슈퍼라이크 수신 배너 (null = 숨김) */
  likeBanner: LikeBanner | null;
  clearLikeBanner: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifs: [],
  unreadCount: 0,
  markRead: () => {},
  markAllRead: () => {},
  addNotif: () => {},
  messageBanner: null,
  clearMessageBanner: () => {},
  profileViewBanner: null,
  clearProfileViewBanner: () => {},
  likeBanner: null,
  clearLikeBanner: () => {},
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
  const userId = user?.id;

  const myThreadIdsRef = useRef<Set<string>>(new Set());
  const senderProfileCache = useRef<Record<string, { name: string; photo_url: string }>>({});
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
  const [profileViewBanner, setProfileViewBanner] = useState<ProfileViewBanner | null>(null);
  const [likeBanner, setLikeBanner] = useState<LikeBanner | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unreadCount = notifs.filter((n) => !n.read && !readIds.has(n.id)).length;

  useEffect(() => {
    if (!userId || !sessionReady) return;

    const fetchNotifs = async () => {
      try {
        const [notifsRes, inAppRes] = await Promise.all([
          supabase
            .from("notifications")
            .select("id, type, actor_id, target_text, is_read, created_at, profiles!notifications_actor_id_fkey(name, photo_url)")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(25)
            .then(r => r.error ? { data: [], error: r.error } : r),
          supabase
            .from("in_app_notifications")
            .select("id, type, title, content, is_read, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(20)
            .then(r => r.error ? { data: [], error: r.error } : r)
        ]);

        if (!isMountedRef.current) return;

        let combined: Notif[] = [];

        if (notifsRes.data && notifsRes.data.length > 0) {
          // profiles join으로 통합 — actor_id 별도 쿼리 제거
          combined.push(
            ...notifsRes.data.map((n: any) => ({
              id: n.id,
              type: n.type,
              actorId: n.actor_id,
              actor: n.profiles?.name || i18n.t("auto.g_0321", "Anonymous"),
              actorPhoto: n.profiles?.photo_url || "",
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

        if (!isMountedRef.current) return;
        combined.sort((a: any, b: any) => b._createdAt - a._createdAt);
        setNotifs(combined.slice(0, 50));
      } catch (err) {
        console.warn("fetchNotifs error:", err);
      }
    };

    fetchNotifs();

    // ── 단일 채널: notifications + in_app_notifications + messages ──
    const channel = supabase
      .channel(`notifs_all:${userId}`)

      // 1) notifications 테이블 (좋아요 / 매칭 / 댓글 / 그룹)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          if (!isMountedRef.current) return;
          const n = payload.new as any;
          const { data: actorProfile } = await supabase
            .from("profiles")
            .select("name, photo_url")
            .eq("id", n.actor_id)
            .single();

          if (!isMountedRef.current) return;

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

          // 👀 profile_view → 프로필 조회 배너 표시
          if (n.type === "profile_view" && actorProfile) {
            setProfileViewBanner({
              actorName: actorProfile.name || i18n.t("auto.g_0322", "Anonymous"),
              actorPhoto: actorProfile.photo_url || "",
            });
          }

          // ❤️ like / ⭐ superlike → 좋아요 수신 배너 표시
          if ((n.type === "like" || n.type === "superlike") && actorProfile) {
            setLikeBanner({
              type: n.type as 'like' | 'superlike',
              actorName: actorProfile.name || i18n.t("auto.g_0322", "Anonymous"),
              actorPhoto: actorProfile.photo_url || "",
              message: n.target_text || undefined,
            });
          }
        }
      )

      // 2) in_app_notifications (관리자 발송 / 시스템)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "in_app_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (!isMountedRef.current) return;
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
      // CRIT-3 fix: 전체 messages 구독 대신 ref 캐시로 멤버십 확인 (불필요한 DB 조회 제거)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          // 주의: Supabase Realtime은 IN 필터를 지원하지 않으므로 filter 없이 전체 구독
          // 대신 myThreadIdsRef로 클라이언트에서 필터링
        },
        async (payload) => {
          if (!isMountedRef.current) return;
          const msg = payload.new as any;
          if (!msg.sender_id || msg.sender_id === userId) return;

          // CRIT-3 fix: DB 조회 없이 ref 캐시로 멤버십 확인 (O(1))
          if (!myThreadIdsRef.current.has(msg.thread_id)) return;

          // 발신자 프로필 캐시 활용 (중복 DB 조회 방지)
          let senderProfile = senderProfileCache.current[msg.sender_id];
          if (!senderProfile) {
            const { data: sender } = await supabase
              .from("profiles")
              .select("name, photo_url")
              .eq("id", msg.sender_id)
              .single();
            
            if (!isMountedRef.current) return;
            if (sender) {
              senderProfileCache.current[msg.sender_id] = sender;
              senderProfile = sender;
            }
          }

          if (!isMountedRef.current) return;

          const rawText = msg.text || msg.content || "";
          const preview =
            rawText.length > 50
              ? rawText.slice(0, 50) + "…"
              : rawText || i18n.t("notif.newMessage", "새 메시지");

          setMessageBanner({
            threadId: msg.thread_id,
            senderName: senderProfile?.name || i18n.t("auto.g_0321", "Anonymous"),
            senderPhoto: senderProfile?.photo_url || "",
            preview,
          });

          // 4초 후 자동 닫기 (이전 타이머 취소 후 재설정)
          if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
          bannerTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) setMessageBanner(null);
          }, 4000);
        }
      )

      .subscribe();

    // CRIT-3 fix: 내 채팅방 목록 로드 (ref 캐시 초기화)
    supabase
      .from("chat_members")
      .select("thread_id")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (!isMountedRef.current) return;
        if (data) {
          myThreadIdsRef.current = new Set(data.map((m: any) => m.thread_id));
        }
      });

    // 매치 INSERT 시 ref 업데이트 (chat_members 실시간 구독 없이 매치 후 갱신)
    const matchChannel = supabase
      .channel(`notif_match_refresh:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_members',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        if (!isMountedRef.current) return;
        const newThreadId = (payload.new as any)?.thread_id;
        if (newThreadId) myThreadIdsRef.current.add(newThreadId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(matchChannel);
      // 컨포넌트 언마운트 시 pending 배너 타이머 정리
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
        bannerTimerRef.current = null;
      }
    };
  }, [userId, sessionReady]);

  // ── 읽음 처리 (notifications + in_app_notifications 모두) ──
  const markRead = useCallback(
    async (id: string) => {
      setReadIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        // ARCH-2 fix: readNotifs 최대 100개 제한 (localStorage 무제한 성장 방지)
        const arr = [...next];
        const trimmed = arr.length > 100 ? arr.slice(arr.length - 100) : arr;
        localStorage.setItem("readNotifs", JSON.stringify(trimmed));
        return new Set(trimmed);
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
      if (!userId) return;

      setNotifs((prev) => {
        const allIds = prev.map((n) => n.id);
        setReadIds((prevIds) => {
          const next = new Set(prevIds);
          allIds.forEach((id) => next.add(id));
          // readNotifs 최대 100개 제한 (localStorage 무제한 성장 방지)
          const arr = [...next];
          const trimmed = arr.length > 100 ? arr.slice(arr.length - 100) : arr;
          localStorage.setItem("readNotifs", JSON.stringify(trimmed));
          return new Set(trimmed);
        });
        return prev.map((n) => ({ ...n, read: true }));
      });

      await Promise.allSettled([
        supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("user_id", userId),
        supabase
          .from("in_app_notifications")
          .update({ is_read: true })
          .eq("user_id", userId),
      ]);
    },
    [userId]
  );

  // ── 직접 알림 추가 (UI 레벨에서 필요한 경우) ──
  const addNotif = useCallback(
    async (template: Omit<Notif, "id" | "time" | "read">) => {
      if (!userId) return;
      const { error: notifErr } = await supabase.from("notifications").insert({
        user_id: userId,
        type: template.type,
        actor_id: userId,
        target_text: template.target,
      });
      if (notifErr && notifErr.code !== '23505') console.warn("addNotif:", notifErr.message);
    },
    [userId]
  );

  const clearMessageBanner = useCallback(() => setMessageBanner(null), []);
  const clearProfileViewBanner = useCallback(() => setProfileViewBanner(null), []);
  const clearLikeBanner = useCallback(() => setLikeBanner(null), []);

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
        profileViewBanner,
        clearProfileViewBanner,
        likeBanner,
        clearLikeBanner,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
