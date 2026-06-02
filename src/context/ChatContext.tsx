import i18n from 'i18next';
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
  createdAt?: string;
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
  const { user, sessionReady } = useAuth();
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
    if (!user || !sessionReady) return; // sessionReady: auth lockAcquired 완료 후 실행

    // [1] 내가 속한 스레드 목록 (single query)
    const {
      data,
      error
    } = await supabase.from('chat_members')
      // BUG-11 fix: chat_threads에서 last_message + updated_at 포함
      .select('thread_id, chat_threads ( id, is_group, created_at, last_message, updated_at )')
      .eq('user_id', user.id);
    if (error || !data) return;
    const threadIds = data.map((m: any) => m.chat_threads?.id).filter(Boolean);
    if (threadIds.length === 0) {
      setThreads([]);
      setUnreadMap({});
      try { localStorage.removeItem('migo_unread_map'); } catch {}
      return;
    }

    // [2] 멤버+프로필, 최신 메시지 병렬 배치 조회 (N+1 완전 제거)
    const [membersRes, latestMsgsRes] = await Promise.all([
      supabase
        .from('chat_members')
        .select('thread_id, user_id, profiles ( name, photo_url )')
        .in('thread_id', threadIds),
      supabase
        .from('messages')
        .select('thread_id, text, created_at')
        .in('thread_id', threadIds)
        .order('created_at', { ascending: false })
    ]);

    // 스레드별 멤버 맵
    const membersByThread: Record<string, any[]> = {};
    for (const m of membersRes.data || []) {
      (membersByThread[m.thread_id] ||= []).push(m);
    }

    // thread_id별 최신 메시지 1개만 추출
    const lastMsgByThread: Record<string, { text: string; created_at: string }> = {};
    for (const msg of latestMsgsRes.data || []) {
      if (!lastMsgByThread[msg.thread_id]) {
        lastMsgByThread[msg.thread_id] = { text: msg.text, created_at: msg.created_at };
      }
    }

    // unread 로컬 캐시 로드 + stale 데이터 정리
    let localUnreadMap: Record<string, number> = {};
    try { localUnreadMap = JSON.parse(localStorage.getItem('migo_unread_map') || '{}'); } catch {}
    const validUnreadMap: Record<string, number> = {};
    let isStale = false;
    for (const tid of Object.keys(localUnreadMap)) {
      if (threadIds.includes(tid)) { validUnreadMap[tid] = localUnreadMap[tid]; }
      else { isStale = true; }
    }
    if (isStale) {
      setUnreadMap(validUnreadMap);
      try { localStorage.setItem('migo_unread_map', JSON.stringify(validUnreadMap)); } catch {}
    }
    localUnreadMap = validUnreadMap;

    // ─── 중복 제거: chat_members가 같은 thread_id를 여러 행 반환할 수 있음
    const seenIds = new Set<string>();
    const dedupedData = data.filter((m: any) => {
      const tid = m.chat_threads?.id;
      if (!tid || seenIds.has(tid)) return false;
      seenIds.add(tid);
      return true;
    });

    const mapped: GroupThread[] = dedupedData.map((m: any) => {
      const thread = m.chat_threads;
      if (!thread) return null;
      const members = membersByThread[thread.id] || [];
      const others = members.filter((mb: any) => mb.user_id !== user.id);
      let name = thread.is_group ? i18n.t("chat.groupChat", "Group Chat") : "";
      let photo = "";
      let memberPhotos: string[] = [];
      if (!thread.is_group) {
        const p = others[0]?.profiles;
        if (p) {
          name = p.name || i18n.t("chat.unknownUser", "Unknown User");
          photo = p.photo_url || "";
        } else {
          name = i18n.t("chat.unknownUser", "Unknown User");
        }
      } else {
        memberPhotos = members.map((mb: any) => mb.profiles?.photo_url).filter(Boolean);
        const otherNames = others.map((mb: any) => mb.profiles?.name).filter(Boolean);
        name = otherNames.length > 0 ? otherNames.join(', ') : i18n.t("chat.groupChat") || "Group Chat";
        photo = others[0]?.profiles?.photo_url || "";
      }

      const latestMsg = lastMsgByThread[thread.id];
      const lastMessageText = latestMsg?.text || thread.last_message || "";
      const lastMessageTime = latestMsg?.created_at || thread.updated_at;

      return {
        id: thread.id,
        name,
        photo,
        lastMessage: lastMessageText,
        time: lastMessageTime ? new Intl.DateTimeFormat(i18n.language || 'en', {
          hour: 'numeric',
          minute: 'numeric'
        }).format(new Date(lastMessageTime)) : "",
        unread: localUnreadMap[thread.id] || 0,
        online: false,
        isGroup: thread.is_group,
        memberCount: members.length || 2,
        memberPhotos,
        opponentId: !thread.is_group ? others[0]?.user_id : undefined,
        createdAt: thread.created_at
      } as GroupThread;
    }).filter(Boolean) as GroupThread[];

    // ── 1:1 채팅 중복 제거: 같은 상대방과 여러 thread가 있으면 가장 최신 것만 표시 ──
    // 최신 메시지(lastMessage) 시각 기준 내림차순 정렬 후 중복 제거
    const opponentSeen = new Set<string>();
    const getThreadTime = (th: GroupThread) => {
      const latestMsg = lastMsgByThread[th.id];
      return latestMsg?.created_at ? new Date(latestMsg.created_at).getTime()
        : th.createdAt ? new Date(th.createdAt).getTime() : 0;
    };
    const deduped = mapped
      .slice()
      .sort((a, b) => getThreadTime(b) - getThreadTime(a))
      .filter(th => {
        if (th.isGroup) return true;
        if (!th.opponentId) return true;
        if (opponentSeen.has(th.opponentId)) return false;
        opponentSeen.add(th.opponentId);
        return true;
      });

    setThreads(deduped);
  }, [user, sessionReady]);

  useEffect(() => {
    if (!user || !sessionReady) return; // sessionReady: auth lockAcquired 완료 후 실행
    fetchThreads();

    // ── 3개 채널 → 단일 채널로 병합 (WebSocket 연결 1/3로 절감) ──
    // matches INSERT debounce: 연속 매치 시 rerender 폭탄 방지
    let matchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    const chatChannel = supabase.channel(`chat_ctx:${user.id}`)
      // 새 메시지 → lastMessage 실시간 업데이트
      // 주의: Supabase 동적 filter(IN)는 지원되지 않으상 thread_id 컴마 리스트 불가 
      // 따라서 내가 속한 thread인지 setThreads에서 확인 (기존 구조 유지)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, payload => {
        const newMsg = payload.new as any;
        const isFromMe = newMsg.sender_id === user.id;
        const isOpenThread = newMsg.thread_id === openThreadRef.current;
        const timeStr = new Intl.DateTimeFormat(i18n.language || 'en', {
          hour: 'numeric', minute: 'numeric'
        }).format(new Date(newMsg.created_at));

        setThreads(prev => {
          const exists = prev.some(th => th.id === newMsg.thread_id);
          if (!exists) {
            // 스레드 목록에 없는 새 채팅방 메시지 → 목록 전체 갱신
            fetchThreads();
            return prev;
          }
          return prev
            .map(th => {
              if (th.id !== newMsg.thread_id) return th;
              return {
                ...th,
                lastMessage: newMsg.text,
                time: timeStr,
                unread: !isFromMe && !isOpenThread ? th.unread + 1 : th.unread
              };
            })
            // 최신 메시지 받은 스레드를 맨 위로
            .sort((a, b) => {
              if (a.id === newMsg.thread_id) return -1;
              if (b.id === newMsg.thread_id) return 1;
              return 0;
            });
        });
        if (!isFromMe && !isOpenThread) {
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
      // 새 매칭 → thread 목록 리로드 (debounce 500ms: 연속 INSERT 시 1회만)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'matches'
      }, () => {
        if (matchDebounceTimer) clearTimeout(matchDebounceTimer);
        matchDebounceTimer = setTimeout(() => {
          fetchThreads();
          matchDebounceTimer = null;
        }, 500);
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
      if (matchDebounceTimer) clearTimeout(matchDebounceTimer);
      supabase.removeChannel(chatChannel);
    };
  }, [user, fetchThreads, sessionReady]);
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
    // 비동기로 DB에 그룹 chat_thread 생성 + 자신을 멤버로 추가
    (async () => {
      if (!user) return;
      const { data: thread } = await supabase.from('chat_threads').insert({
        name: group.title || i18n.t("auto.g_0320", "Group Chat"),
        is_group: true,
        photo_url: group.hostPhoto
      }).select('id').single();
      if (thread) {
        // 🚨 [CRITICAL SECURITY WARNING] 채팅방 하이재킹(Chat Hijacking) 취약점 구간
        // 클라이언트에서 직접 'chat_members' 테이블에 자신의 user_id를 Insert하고 있습니다.
        // 현재 DB RLS 정책이 단순히 "자기 자신(auth.uid = user_id)은 인서트 가능"으로 되어 있다면, 
        // 악의적 사용자가 타인의 비밀 thread_id만 알아내어 이 API를 호출함으로써 원격으로 
        // 1:1 채팅방에 몰래 잠입(Join)하여 모든 대화 내용을 엿볼 수 있는 심각한 위험이 존재합니다.
        // TODO: 채팅방 생성 및 멤버 초대는 반드시 서버(Edge Function/RPC)를 거쳐서
        // 권한이 있는 자만 추가되도록 DB 구조를 리팩토링해야 합니다.
        await supabase.from('chat_members').upsert(
          { thread_id: thread.id, user_id: user.id },
          { onConflict: 'thread_id,user_id' }
        );
        fetchThreads();
      }
    })();
    return group.id;
  }, [fetchThreads, user]);
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