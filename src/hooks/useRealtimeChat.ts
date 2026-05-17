import { useEffect, useRef, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

export interface RealtimeMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

interface UseRealtimeChatOptions {
  threadId: string | null;
  onMessage: (msg: RealtimeMessage) => void;
}

/**
 * Supabase Realtime 채널로 실시간 메시지를 수신합니다.
 * Supabase 미설정 시 구독하지 않습니다.
 */
export const useRealtimeChat = ({ threadId, onMessage }: UseRealtimeChatOptions) => {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!isSupabaseConfigured || !threadId) return;

    const channel = supabase
      .channel(`chat:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          onMessageRef.current(payload.new as RealtimeMessage);
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[RealtimeChat] channel error:', status, err);
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  /** 메시지 전송 (Supabase insert) */
  const sendMessage = useCallback(async (text: string, senderId: string) => {
    if (!isSupabaseConfigured || !threadId) return { error: null };
    const { error } = await supabase.from("messages").insert({
      thread_id: threadId,
      sender_id: senderId,
      text: text,
    });
    return { error };
  }, [threadId]);

  /** 기존 메시지 불러오기 */
  const fetchMessages = useCallback(async () => {
    if (!isSupabaseConfigured || !threadId) return [];
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("id, thread_id, sender_id, text, created_at")
        .eq("thread_id", threadId)
        // 🚨 [버그 수정] 최근 메시지부터 100개를 불러온 뒤, 프론트에서 시간순(오름차순)으로 역순 정렬해야 최신 대화가 보임
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        console.warn('[RealtimeChat] fetchMessages error:', error.message);
        return [];
      }
      return ((data ?? []).reverse()) as RealtimeMessage[];
    } catch (err) {
      console.error('[RealtimeChat] fetchMessages unexpected error:', err);
      return [];
    }
  }, [threadId]);

  return { sendMessage, fetchMessages };
};
