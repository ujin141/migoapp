import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.9.1/mod.ts";

/**
 * push-notify Edge Function (FCM HTTP v1 API)
 *
 * Supabase Secrets 필요:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   FIREBASE_SERVICE_ACCOUNT  ← Firebase Admin SDK JSON 전체를 문자열로 저장
 */

const supabaseUrl        = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const serviceAccountRaw  = Deno.env.get("FIREBASE_SERVICE_ACCOUNT") ?? "{}";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ── Service Account 파싱 ─────────────────────────────────────────
let serviceAccount: any = {};
try {
  serviceAccount = JSON.parse(serviceAccountRaw);
} catch {
  console.error("[push-notify] FIREBASE_SERVICE_ACCOUNT 파싱 실패");
}

const PROJECT_ID = serviceAccount.project_id ?? "migo-894d2";
const FCM_URL = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

// ── OAuth2 Access Token 발급 (Service Account → JWT → Bearer) ────
async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  // PEM 형식 private key → CryptoKey 로드
  const pemBody = (serviceAccount.private_key as string)
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\n/g, "");
  const der = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    der.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  // JWT 생성
  const jwt = await create(
    { alg: "RS256", typ: "JWT" },
    {
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: getNumericDate(0),
      exp: getNumericDate(60 * 60), // 1시간
    },
    key,
  );

  // Access Token 교환
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  return data.access_token as string;
}

// ── FCM v1 메시지 전송 ───────────────────────────────────────────
async function sendFcmV1(
  fcmToken: string,
  title: string,
  body: string,
  data: Record<string, string>,
): Promise<boolean> {
  try {
    const accessToken = await getAccessToken();
    const res = await fetch(FCM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          token: fcmToken,
          notification: { title, body },
          data,
          apns: {
            payload: {
              aps: { alert: { title, body }, sound: "default", badge: 1 },
            },
          },
          android: {
            priority: "high",
            notification: { sound: "default" },
          },
        },
      }),
    });
    const result = await res.json();
    if (!res.ok) {
      console.warn("[push-notify] FCM v1 error:", JSON.stringify(result));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[push-notify] sendFcmV1 예외:", err);
    return false;
  }
}

// ── 알림 타입 → 제목/본문 ────────────────────────────────────────
function buildMessage(
  table: string,
  record: any,
  actorName: string,
): { title: string; body: string; data: Record<string, string> } {
  if (table === "messages") {
    const preview = record.content
      ? record.content.length > 60 ? record.content.slice(0, 60) + "…" : record.content
      : "새 메시지";
    return {
      title: `💬 ${actorName}`,
      body: preview,
      data: { type: "message", thread_id: record.thread_id ?? "" },
    };
  }

  if (table === "in_app_notifications") {
    return {
      title: record.title ?? "Migo 알림",
      body: record.content ?? "앱에서 확인하세요.",
      data: { type: record.type ?? "system" },
    };
  }

  // notifications 테이블
  switch (record.type) {
    case "like":
      return {
        title: "❤️ 좋아요",
        body: `${actorName}님이 좋아요를 눌렀습니다`,
        data: { type: "like", actor_id: record.actor_id ?? "" },
      };
    case "superlike":
      return {
        title: "⭐ 슈퍼라이크",
        body: `${actorName}님이 슈퍼라이크를 보냈습니다!`,
        data: { type: "superlike", actor_id: record.actor_id ?? "" },
      };
    case "match":
      return {
        title: "🎉 매칭 성사!",
        body: `${actorName}님과 매칭됐습니다. 지금 채팅해보세요!`,
        data: { type: "match", thread_id: record.target_id ?? "" },
      };
    case "comment":
      return {
        title: "💬 새 댓글",
        body: `${actorName}: ${record.target_text ?? "게시글에 댓글이 달렸습니다"}`,
        data: { type: "comment", post_id: record.target_id ?? "" },
      };
    case "group_join":
      return {
        title: "👥 그룹 새 멤버",
        body: `${actorName}님이 '${record.target_text ?? "그룹"}'에 참여했습니다`,
        data: { type: "group_join", group_id: record.target_id ?? "" },
      };
    case "profile_view":
      return {
        title: "👀 프로필 조회",
        body: "누군가 회원님의 프로필을 봤습니다",
        data: { type: "profile_view" },
      };
    default:
      return {
        title: "Migo",
        body: "새로운 알림이 있습니다",
        data: { type: record.type ?? "unknown" },
      };
  }
}

// ── 사용자 언어 기반 번역 ─────────────────────────────────────────
async function translateText(text: string, targetLang: string): Promise<string> {
  try {
    if (targetLang === "ko") return text;
    const gcpLang = targetLang === "he" ? "iw" : targetLang;
    const r = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=${gcpLang}&dt=t&q=${encodeURIComponent(text)}`
    );
    const d = await r.json();
    return d[0].map((x: any) => x[0]).join("");
  } catch {
    return text;
  }
}

async function getUserLang(userId: string): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
    return user?.user_metadata?.locale ?? "ko";
  } catch {
    return "ko";
  }
}

// ── notification_prefs 키 매핑 ───────────────────────────────────
// record.type → notification_prefs 컬럼 키
function toPrefKey(notifType: string): string | null {
  switch (notifType) {
    case "like":        return "like";
    case "superlike":   return "superlike";
    case "match":       return "match";
    case "comment":     return "comment";
    case "group_join":  return "group";
    case "system":      return "system";
    // 채팅 메시지는 별도 pref 없음 → 항상 발송
    case "message":     return null;
    default:            return "system"; // 그 외는 system으로 처리
  }
}

// ── FCM 토큰 조회 + notification_prefs 확인 후 전송 ───────────────
async function pushToUser(
  userId: string,
  title: string,
  body: string,
  data: Record<string, string>,
  notifType?: string,   // 알림 타입 (notification_prefs 필터링용)
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("fcm_token, notification_prefs")
    .eq("id", userId)
    .single();

  if (!profile?.fcm_token) return;

  // ── notification_prefs 필터 ──
  if (notifType) {
    const prefKey = toPrefKey(notifType);
    if (prefKey !== null) {
      const prefs = profile.notification_prefs as Record<string, boolean> | null;
      // prefs가 존재하고 해당 키가 명시적으로 false면 발송 생략
      if (prefs && prefs[prefKey] === false) {
        console.log(`[push-notify] skip: user=${userId} pref '${prefKey}' is OFF`);
        return;
      }
    }
  }

  // 언어 번역
  const lang = await getUserLang(userId);
  const tTitle = await translateText(title, lang);
  const tBody  = await translateText(body, lang);

  await sendFcmV1(profile.fcm_token, tTitle, tBody, data);
}

// ── 메인 핸들러 ──────────────────────────────────────────────────
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  // Service Role Key 또는 Anon Key 모두 허용 (어드민 패널에서 직접 호출 지원)
  const isAuthorized = token === supabaseServiceKey || token === SUPABASE_ANON_KEY;
  if (!isAuthorized) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const payload = await req.json();
    const table: string = payload.table;
    const record: any   = payload.record;

    if (!record) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    if (table === "messages") {
      // 채팅방 다른 멤버들에게 전송 (채팅은 별도 pref 없음 → 항상 발송)
      const { data: members } = await supabase
        .from("chat_members")
        .select("user_id")
        .eq("thread_id", record.thread_id)
        .neq("user_id", record.sender_id);

      if (!members?.length) {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      const { data: sender } = await supabase
        .from("profiles").select("name").eq("id", record.sender_id).single();
      const actorName = sender?.name ?? "누군가";
      const msg = buildMessage(table, record, actorName);

      await Promise.allSettled(
        members.map((m) => pushToUser(m.user_id, msg.title, msg.body, msg.data, "message"))
      );
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    if (table === "in_app_notifications" || table === "notifications") {
      // profile_view는 푸시 생략
      if (record.type === "profile_view") {
        return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200 });
      }

      const targetUserId = record.user_id;
      let actorName = "누군가";
      if (record.actor_id) {
        const { data: actor } = await supabase
          .from("profiles").select("name").eq("id", record.actor_id).single();
        actorName = actor?.name ?? "누군가";
      }

      const msg = buildMessage(table, record, actorName);
      // notification_prefs 필터 적용 (record.type 기준)
      await pushToUser(targetUserId, msg.title, msg.body, msg.data, record.type);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });

  } catch (err) {
    console.error("[push-notify] error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
});
