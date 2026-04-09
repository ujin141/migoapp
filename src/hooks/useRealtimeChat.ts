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
      .subscribe();

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
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .limit(50);
    return (data ?? []) as RealtimeMessage[];
  }, [threadId]);

  return { sendMessage, fetchMessages };
};
