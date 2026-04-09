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
  opponentId?: string;
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
      const thread = m.chat_threads;
      if (!thread) return null;
      const members = membersByThread[thread.id] || [];
      const others = members.filter((mb: any) => mb.user_id !== user.id);
      const lastMsg = lastMsgMap[thread.id] || null;
      let name = thread.is_group ? "Group Chat" : "";
      let photo = "";
      let memberPhotos: string[] = [];
      if (!thread.is_group) {
        const p = others[0]?.profiles;
        if (p) {
          name = p.name || i18n.i18n.t("chat.unknownUser") || i18n.t("auto.g_0318", "알 수 없음");
          photo = p.photo_url || "";
        } else {
          name = i18n.i18n.t("chat.unknownUser") || i18n.t("auto.g_0319", "알 수 없음");
        }
      } else {
        memberPhotos = members.map((mb: any) => mb.profiles?.photo_url).filter(Boolean);
        name = i18n.t("chat.groupChat") || "Group Chat";
      }
      return {
        id: thread.id,
        name,
        photo,
        lastMessage: lastMsg?.text ?? "New conversation",
        time: lastMsg ? new Intl.DateTimeFormat('ko-KR', {
          hour: 'numeric',
          minute: 'numeric'
        }).format(new Date(lastMsg.created_at)) : "",
        unread: localUnreadMap[thread.id] || 0,
        online: true,
        isGroup: thread.is_group,
        memberCount: members.length || 2,
        memberPhotos,
        opponentId: !thread.is_group ? others[0]?.user_id : undefined
      } as GroupThread;
    }).filter(Boolean) as GroupThread[];
    setThreads(mapped);
  }, [user]);
  useEffect(() => {
    if (!user) return;
    fetchThreads();

    // ── 3개 채널 → 단일 채널로 병합 (WebSocket 연결 1/3로 절감) ──
    const chatChannel = supabase.channel(`chat_ctx:${user.id}`)
      // 새 메시지 → lastMessage 실시간 업데이트
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, payload => {
        const newMsg = payload.new as any;
        setThreads(prev => prev.map(th => {
          if (th.id !== newMsg.thread_id) return th;
          return {
            ...th,
            lastMessage: newMsg.text,
            time: new Intl.DateTimeFormat('ko-KR', {
              hour: 'numeric',
              minute: 'numeric'
            }).format(new Date(newMsg.created_at)),
            unread: newMsg.sender_id !== user.id && newMsg.thread_id !== openThreadRef.current ? th.unread + 1 : th.unread
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
      })
      // 새 매칭 → thread 목록 리로드 (debounce: 연속 INSERT 시 1회만)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'matches'
      }, () => {
        fetchThreads();
      })
      // 스레드 삭제 → 실시간 UI 반영
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'chat_threads'
      }, (payload) => {
        setThreads(prev => prev.filter(th => th.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [user, fetchThreads]);
  const markRead = useCallback((chatId: string) => {
    setUnreadMap(prev => {
      const next = { ...prev, [chatId]: 0 };
      try { localStorage.setItem('migo_unread_map', JSON.stringify(next)); } catch {}
      return next;
    });
    setThreads(prev => prev.map(th => th.id === chatId ? {
      ...th,
      unread: 0
    } : th));
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
        name: group.title || i18n.t("auto.g_0320", "그룹 채팅"),
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