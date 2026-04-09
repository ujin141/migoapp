import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Firebase/FCM requires a Google Service Account to generate OAuth 2.0 tokens for HTTP v1 API.
// Since edge functions don't easily do complete RSA signing, many use OneSignal or Firebase FCM API.
// For simplicity in this Edge Function, we assume we use Supabase's direct push integrations or a standard Firebase REST proxy.
// Actually, calling FCM standard HTTP API from Edge Function requires `google-auth-library`.
// Because we are in Deno, we use a lightweight approach:

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// Firebase Cloud Messaging Server Key (Legacy) or HTTP v1 auth
const fcmServerKey = Deno.env.get("FCM_SERVER_KEY")!; 

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log("Webhook received:", payload);
    
    // Webhook from "messages" or "in_app_notifications"
    const table = payload.table;
    const record = payload.record;

    let targetUserId = "";
    let title = "Migo";
    let body = "";

    if (table === "messages") {
      // Find the users in the chat_members
      const { data: members, error } = await supabase
        .from("chat_members")
        .select("user_id")
        .eq("thread_id", record.thread_id)
        .neq("user_id", record.sender_id);
      
      if (!error && members && members.length > 0) {
        // Send push to all members
        for (const member of members) {
          targetUserId = member.user_id;
          title = "새 메시지가 도착했습니다";
          body = record.content;
          
          const translated = await translateForUser(targetUserId, title, body);
          await sendPushToUser(targetUserId, translated.title, translated.body);
        }
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
      
    } else if (table === "in_app_notifications") {
      targetUserId = record.user_id;
      title = record.title || "새로운 알림";
      body = record.content || "앱에서 새로운 알림을 확인하세요.";
      
      const translated = await translateForUser(targetUserId, title, body);
      await sendPushToUser(targetUserId, translated.title, translated.body);
      
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ success: true, message: "Ignored" }), { status: 200 });

  } catch (err) {
    console.error("Error sending push:", err);
    return new Response(JSON.stringify({ error: (err as any).message }), { status: 500 });
  }
});

async function translateForUser(userId: string, title: string, body: string) {
  try {
    const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);
    let lang = "en"; // fallback
    if (!error && user && user.user_metadata && user.user_metadata.locale) {
      lang = user.user_metadata.locale;
    }
    
    // Map internal locales to Google translate locales if necessary
    if (lang === "he") lang = "iw";
    // If the sender sent it in Korean or any other language, we just rely on auto-detection
    if (lang === "ko") return { title, body }; // Skip translation if receiver is already Korean and original is mostly Korean (optimization)
    
    const translateText = async (text: string) => {
      if (!text) return text;
       try {
         const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`);
         const data = await res.json();
         return data[0].map((x: any) => x[0]).join('');
       } catch (e) {
         console.error("Translation fail:", e);
         return text;
       }
    };

    const tTitle = await translateText(title);
    const tBody = await translateText(body);
    return { title: tTitle, body: tBody };

  } catch (err) {
    console.error("User locale fetch error:", err);
    return { title, body };
  }
}

async function sendPushToUser(userId: string, title: string, body: string) {
  // Get FCM Token
  const { data: profile } = await supabase
    .from("profiles")
    .select("fcm_token")
    .eq("id", userId)
    .single();

  if (!profile || !profile.fcm_token) {
    console.log(`No FCM token for user ${userId}`);
    return;
  }

  // Send to Firebase Cloud Messaging (Using Legacy API for simplicity in Deno, or HTTP v1 if configured token)
  const fcmUrl = "https://fcm.googleapis.com/fcm/send";
  const fcmPayload = {
    to: profile.fcm_token,
    notification: {
      title,
      body,
      sound: "default"
    },
    data: {
      action: "open_app"
    }
  };

  const response = await fetch(fcmUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `key=${fcmServerKey}`
    },
    body: JSON.stringify(fcmPayload)
  });

  const result = await response.json();
  console.log("FCM Response:", result);
}
