import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import React from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
export interface GroupThread {
  id: string;
  name: string;
  photo: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  isGroup?: boolean;
  memberCount?: number;
  memberPhotos?: string[];
  groupWelcome?: string;
}
interface ChatContextType {
  totalUnread: number;
  threads: GroupThread[];
  markRead: (chatId: string) => void;
  addUnread: (chatId: string, count?: number) => void;
  resetAll: () => void;
  setOpenThread: (chatId: string | null) => void;
  createGroupThread: (group: {
    id: string;
    title: string;
    hostPhoto: string;
    memberPhotos: string[];
    currentMembers: number;
    destination: string;
  }) => string;
}
const ChatContext = createContext<ChatContextType>({
  totalUnread: 0,
  threads: [],
  markRead: () => {},
  addUnread: () => {},
  resetAll: () => {},
  setOpenThread: () => {},
  createGroupThread: () => ""
});
export const useChatContext = () => useContext(ChatContext);
export const ChatProvider = ({
  children
}: {
  children: ReactNode;
}) => {
  const { t } = useTranslation();
  const {
    user
  } = useAuth();
  const [threads, setThreads] = useState<GroupThread[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('migo_unread_map');
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });
  const [openThread, setOpenThread] = useState<string | null>(null);
  const openThreadRef = React.useRef<string | null>(null);

  const handleSetOpenThread = useCallback((chatId: string | null) => {
    setOpenThread(chatId);
    openThreadRef.current = chatId;
  }, []);
  const totalUnread = Object.values(unreadMap).reduce((s, n) => s + n, 0);
  const fetchThreads = useCallback(async () => {
    if (!user) return;

    // [1] 내가 속한 스레드 목록 (single query)
    const {
      data,
      error
    } = await supabase.from('chat_members').select('thread_id, chat_threads ( id, is_group, created_at )').eq('user_id', user.id);
    if (error || !data) return;
    const threadIds = data.map((m: any) => m.chat_threads?.id).filter(Boolean);
    if (threadIds.length === 0) {
      setThreads([]);
      return;
    }

    // [2] N+1 제거: 모든 멤버+프로필 + 마지막 메시지를 병렬 배치 처리
    const [membersRes, msgsRes] = await Promise.all([supabase.from('chat_members').select('thread_id, user_id, profiles ( name, photo_url )').in('thread_id', threadIds), supabase.from('messages').select('thread_id, text, created_at').in('thread_id', threadIds).order('created_at', {
      ascending: false
    })]);

    // 스레드별 마지막 메시지 맵 (이미 created_at DESC 정렬됨)
    const lastMsgMap: Record<string, any> = {};
    for (const msg of msgsRes.data || []) {
      if (!lastMsgMap[msg.thread_id]) lastMsgMap[msg.thread_id] = msg;
    }

    // 스레드별 멤버 맵
    const membersByThread: Record<string, any[]> = {};
    for (const m of membersRes.data || []) {
      (membersByThread[m.thread_id] ||= []).push(m);
    }

    let localUnreadMap: Record<string, number> = {};
    try { localUnreadMap = JSON.parse(localStorage.getItem('migo_unread_map') || '{}'); } catch {}

    const mapped: GroupThread[] = data.map((m: any) => {
      const t = m.chat_threads;
      if (!t) return null;
      const members = membersByThread[t.id] || [];
      const others = members.filter((mb: any) => mb.user_id !== user.id);
      const lastMsg = lastMsgMap[t.id] || null;
      let name = t.is_group ? "Group Chat" : "";
      let photo = "";
      let memberPhotos: string[] = [];
      if (!t.is_group) {
        const p = others[0]?.profiles;
        if (p) {
          name = p.name || "";
          photo = p.photo_url || "";
        }
      } else {
        memberPhotos = members.map((mb: any) => mb.profiles?.photo_url).filter(Boolean);
      }
      return {
        id: t.id,
        name,
        photo,
        lastMessage: lastMsg?.text ?? "New conversation",
        time: lastMsg ? new Intl.DateTimeFormat('ko-KR', {
          hour: 'numeric',
          minute: 'numeric'
        }).format(new Date(lastMsg.created_at)) : "",
        unread: localUnreadMap[t.id] || 0,
        online: true,
        isGroup: t.is_group,
        memberCount: members.length || 2,
        memberPhotos
      } as GroupThread;
    }).filter(Boolean) as GroupThread[];
    setThreads(mapped);
  }, [user]);
  useEffect(() => {
    if (!user) return;
    fetchThreads();

    // 새 메시지 → lastMessage 실시간 업데이트
    const msgChannel = supabase.channel('chat_messages_ctx').on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages'
    }, payload => {
      const newMsg = payload.new as any;
      setThreads(prev => prev.map(t => {
        if (t.id !== newMsg.thread_id) return t;
        return {
          ...t,
          lastMessage: newMsg.text,
          time: new Intl.DateTimeFormat('ko-KR', {
            hour: 'numeric',
            minute: 'numeric'
          }).format(new Date(newMsg.created_at)),
          unread: newMsg.sender_id !== user.id && newMsg.thread_id !== openThreadRef.current ? t.unread + 1 : t.unread
        };
      }));
      if (newMsg.sender_id !== user.id && newMsg.thread_id !== openThreadRef.current) {
        setUnreadMap(prev => {
          const next = {
            ...prev,
            [newMsg.thread_id]: (prev[newMsg.thread_id] || 0) + 1
          };
          try { localStorage.setItem('migo_unread_map', JSON.stringify(next)); } catch {}
          return next;
        });
      }
    }).subscribe();

    // 새 매칭 → thread 목록 리로드
    const matchChannel = supabase.channel('new_matches_ctx').on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'matches'
    }, () => {
      fetchThreads();
    }).subscribe();

    // 스레드 파기(삭제) 시 실시간 UI 반영
    const threadDeleteChannel = supabase.channel('thread_del_ctx').on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'chat_threads'
    }, (payload) => {
      setThreads(prev => prev.filter(t => t.id !== payload.old.id));
    }).subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(matchChannel);
      supabase.removeChannel(threadDeleteChannel);
    };
  }, [user, fetchThreads]);
  const markRead = useCallback((chatId: string) => {
    setUnreadMap(prev => {
      const next = { ...prev, [chatId]: 0 };
      try { localStorage.setItem('migo_unread_map', JSON.stringify(next)); } catch {}
      return next;
    });
    setThreads(prev => prev.map(t => t.id === chatId ? {
      ...t,
      unread: 0
    } : t));
  }, []);
  const addUnread = useCallback((chatId: string, count = 1) => {
    setUnreadMap(prev => {
      const next = { ...prev, [chatId]: (prev[chatId] ?? 0) + count };
      try { localStorage.setItem('migo_unread_map', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);
  const resetAll = useCallback(() => {
    setUnreadMap({});
    try { localStorage.setItem('migo_unread_map', '{}'); } catch {}
  }, []);
  const createGroupThread = useCallback((group: {
    id: string;
    title: string;
    hostPhoto: string;
    memberPhotos: string[];
    currentMembers: number;
    destination: string;
  }): string => {
    // 비동기로 DB에 그룹 chat_thread 생성
    (async () => {
      const {
        data: thread
      } = await supabase.from('chat_threads').insert({
        name: i18n.t("auto.z_tmpl_948", {
          defaultValue: i18n.t("auto.z_tmpl_1297", {
            defaultValue: t("auto.t5000", { v0: group.title })
          })
        }),
        is_group: true,
        photo_url: group.hostPhoto
      }).select('id').single();
      if (thread) fetchThreads();
    })();
    return group.id;
  }, [fetchThreads]);
  return <ChatContext.Provider value={{
    totalUnread,
    threads,
    markRead,
    addUnread,
    resetAll,
    setOpenThread: handleSetOpenThread,
    createGroupThread
  }}>
      {children}
    </ChatContext.Provider>;
};