import i18n from "@/i18n";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
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
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const unreadCount = notifs.filter(n => !n.read).length;
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
          actor: profileMap[n.actor_id]?.name || i18n.t("auto.z_autoz익명946_1295"),
          actorPhoto: profileMap[n.actor_id]?.photo_url || '',
          target: n.target_text || undefined,
          time: new Intl.DateTimeFormat('ko-KR', {
            hour: 'numeric',
            minute: 'numeric'
          }).format(new Date(n.created_at)),
          read: n.read ?? false
        })));
      }
    };
    fetchNotifs();
    const channel = supabase.channel(`notifs:${user.id}`).on('postgres_changes', {
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
        actor: actorProfile?.name || i18n.t("auto.z_autoz익명947_1296"),
        actorPhoto: actorProfile?.photo_url || "",
        target: newNotif.target_text || undefined,
        time: new Intl.DateTimeFormat('ko-KR', {
          hour: 'numeric',
          minute: 'numeric'
        }).format(new Date(newNotif.created_at)),
        read: newNotif.read ?? false
      }, ...prev]);
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
  const markRead = useCallback(async (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? {
      ...n,
      read: true
    } : n));
    await supabase.from('notifications').update({
      read: true
    }).eq('id', id);
  }, []);
  const markAllRead = useCallback(async () => {
    if (!user) return;
    setNotifs(prev => prev.map(n => ({
      ...n,
      read: true
    })));
    await supabase.from('notifications').update({
      read: true
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