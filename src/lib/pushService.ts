import { supabase } from './supabaseClient';

export interface PushNotificationPayload {
  table: 'messages' | 'in_app_notifications' | 'notifications';
  record: any;
}

/**
 * push-notify Edge Function 호출 유틸리티
 */
export async function sendPushNotification(payload: PushNotificationPayload): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('push-notify', {
      body: payload,
    });
    if (error) {
      console.warn('[pushService] Edge Function 호출 실패:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[pushService] 알림 발송 중 예외 발생:', err);
    return false;
  }
}

/**
 * 매칭 성사 시 상대방에게 푸시 발송
 */
export async function sendMatchPush(
  matchedUserId: string,
  currentUserId: string,
  threadId: string
): Promise<void> {
  sendPushNotification({
    table: 'notifications',
    record: {
      user_id: matchedUserId,
      actor_id: currentUserId,
      type: 'match',
      target_id: threadId,
    },
  });
}

/**
 * 좋아요/슈퍼라이크 전송 시 푸시 발송
 */
export async function sendLikePush(
  toUserId: string,
  currentUserId: string,
  likeType: 'like' | 'superlike'
): Promise<void> {
  sendPushNotification({
    table: 'notifications',
    record: {
      user_id: toUserId,
      actor_id: currentUserId,
      type: likeType,
    },
  });
}

/**
 * 메시지 전송 시 상대방에게 푸시 발송
 */
export async function sendMessagePush(
  threadId: string,
  senderId: string,
  content: string
): Promise<void> {
  sendPushNotification({
    table: 'messages',
    record: {
      thread_id: threadId,
      sender_id: senderId,
      content: content,
    },
  });
}

/**
 * 운명 알림 발생 시 상대방에게 푸시 발송
 */
export async function sendDestinyPush(
  toUserId: string,
  currentUserId: string,
  distance: number,
  hint: string
): Promise<void> {
  sendPushNotification({
    table: 'notifications',
    record: {
      user_id: toUserId,
      actor_id: currentUserId,
      type: 'destiny_nearby',
      target_text: `약 ${distance}m 이내에 운명의 상대가 감지되었습니다: "${hint}"`,
    },
  });
}
