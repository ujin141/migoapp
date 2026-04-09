import i18n from "@/i18n";
import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
export type NotifType = "profile_view" | "like" | "superlike" | "comment" | "match" | string;
export interface Notif {
  id: string;
  type: NotifType;
  actorId: string;
  actor: string;
  actorPhoto: string;
  target?: string;
  time: string;
  read: boolean;
}
interface NotificationContextType {
  notifs: Notif[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  addNotif: (n: Omit<Notif, "id" | "time" | "read">) => void;
}
const NotificationContext = createContext<NotificationContextType>({
  notifs: [],
  unreadCount: 0,
  markRead: () => {},
  markAllRead: () => {},
  addNotif: () => {}
});
export const useNotifications = () => useContext(NotificationContext);
export const NotificationProvider = ({
  children
}: {
  children: ReactNode;
}) => {
  const {
    user
  } = useAuth();
  // 로컬 스토리지에 저장된 "이미 읽은 알림 ID 목록"을 가져와서 DB 업데이트 실패 시에도 캐싱 유지
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('readNotifs');
      return new Set<string>(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set<string>();
    }
  });
  // stale closure 방지용 ref
  const readIdsRef = useRef(readIds);
  useEffect(() => { readIdsRef.current = readIds; }, [readIds]);

  const [notifs, setNotifs] = useState<Notif[]>([]);
  const unreadCount = notifs.filter(n => !n.read && !readIds.has(n.id)).length;
  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      const {
        data,
        error
      } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', {
        ascending: false
      }).limit(50);
      if (!error && data && data.length > 0) {
        // profiles 별도 조회 (actor_id FK가 auth.users 참조라 직접 join 불가)
        const actorIds = [...new Set(data.map((n: any) => n.actor_id).filter(Boolean))];
        const {
          data: actorProfiles
        } = await supabase.from('profiles').select('id, name, photo_url').in('id', actorIds);
        const profileMap: Record<string, any> = {};
        for (const p of actorProfiles || []) profileMap[p.id] = p;
        setNotifs(data.map((n: any) => ({
          id: n.id,
          type: n.type,
          actorId: n.actor_id,
          actor: profileMap[n.actor_id]?.name || i18n.t("auto.g_0321", "익명"),
          actorPhoto: profileMap[n.actor_id]?.photo_url || '',
          target: n.target_text || undefined,
          time: new Intl.DateTimeFormat('ko-KR', {
            hour: 'numeric',
            minute: 'numeric'
          }).format(new Date(n.created_at)),
          read: (n.is_read ?? false) || readIdsRef.current.has(n.id)
        })));
      }
    };
    fetchNotifs();
    // ── 2개 채널 → 단일 채널로 병합 (WebSocket 소비 절반) ─────────
    const notifChannel = supabase.channel(`notifs_all:${user.id}`)
      // notifications 테이블 (좋아요/매칭 등)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, async payload => {
        const newNotif = payload.new;
        const {
          data: actorProfile
        } = await supabase.from('profiles').select('name, photo_url').eq('id', newNotif.actor_id).single();
        setNotifs(prev => [{
          id: newNotif.id,
          type: newNotif.type,
          actorId: newNotif.actor_id,
          actor: actorProfile?.name || i18n.t("auto.g_0322", "익명"),
          actorPhoto: actorProfile?.photo_url || "",
          target: newNotif.target_text || undefined,
          time: new Intl.DateTimeFormat('ko-KR', {
            hour: 'numeric',
            minute: 'numeric'
          }).format(new Date(newNotif.created_at)),
          read: (newNotif.is_read ?? false) || readIdsRef.current.has(newNotif.id)
        }, ...prev]);
      })
      // in_app_notifications 테이블 (피드 좋아요/댓글)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'in_app_notifications',
        filter: `user_id=eq.${user.id}`
      }, async (payload) => {
        const n = payload.new as any;
        setNotifs(prev => [{
          id: n.id,
          type: n.type || 'comment',
          actorId: '',
          actor: '',
          actorPhoto: '',
          target: n.message || undefined,
          time: new Intl.DateTimeFormat('ko-KR', {
            hour: 'numeric',
            minute: 'numeric'
          }).format(new Date(n.created_at || Date.now())),
          read: false
        }, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
    };
  }, [user?.id]);
  const markRead = useCallback(async (id: string) => {
    // 로컬 스토리지 업데이트
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem('readNotifs', JSON.stringify([...next]));
      return next;
    });

    setNotifs(prev => prev.map(n => n.id === id ? {
      ...n,
      read: true
    } : n));
    await supabase.from('notifications').update({
      is_read: true
    }).eq('id', id);
  }, []);
  
  const markAllRead = useCallback(async () => {
    if (!user) return;
    
    // notifs 상태를 함수형 updater로 참조하여 stale closure 방지
    setNotifs(prev => {
      const allIds = prev.map(n => n.id);
      setReadIds(prevIds => {
        const next = new Set(prevIds);
        allIds.forEach(id => next.add(id));
        localStorage.setItem('readNotifs', JSON.stringify([...next]));
        return next;
      });
      return prev.map(n => ({ ...n, read: true }));
    });

    await supabase.from('notifications').update({
      is_read: true
    }).eq('user_id', user.id);
  }, [user?.id]);
  const addNotif = useCallback(async (template: Omit<Notif, "id" | "time" | "read">) => {
    // Usually added via triggers or other backend actions, but UI can do it directly for itself too.
    if (!user) return;
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: template.type,
      actor_id: user.id,
      // For demo this simulates actor=me. In real app, actor_id comes from real actor.
      target_text: template.target
    });
  }, [user]);
  return <NotificationContext.Provider value={{
    notifs,
    unreadCount,
    markRead,
    markAllRead,
    addNotif
  }}>
      {children}
    </NotificationContext.Provider>;
};