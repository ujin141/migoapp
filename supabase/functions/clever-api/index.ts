// supabase/functions/clever-api/index.ts
// Migo 통합 Edge Function — OTP 발송/인증 + 기타 기능을 하나의 엔드포인트로 처리

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const TWILIO_AUTH_TOKEN   = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const TWILIO_VERIFY_SID   = Deno.env.get("TWILIO_VERIFY_SERVICE_SID")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

serve(async (req) => {
  // ── CORS preflight ──
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: cors });
  }

  try {
    const body = await req.json();
    const { action } = body;

    // ── OTP 발송 ──────────────────────────────────────────────────
    if (action === "send-otp") {
      const phone = (body.phone as string)?.replace(/[^\d+]/g, "");
      if (!phone) return json({ error: "phone is required" }, 400);

      if (!TWILIO_VERIFY_SID || !TWILIO_ACCOUNT_SID) {
        return json({ error: "Twilio secrets not configured" }, 500);
      }

      const url = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SID}/Verifications`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: phone, Channel: "sms" }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Twilio send error:", data);
        return json({ error: data.message || "SMS 발송 실패" }, 400);
      }
      return json({ success: true, status: data.status });
    }

    // ── OTP 인증 ──────────────────────────────────────────────────
    if (action === "verify-otp") {
      const phone = (body.phone as string)?.replace(/[^\d+]/g, "");
      const code  = (body.code as string)?.replace(/\s/g, "");
      if (!phone || !code) return json({ error: "phone and code are required" }, 400);

      const url = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SID}/VerificationChecks`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: phone, Code: code }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== "approved") {
        console.error("Twilio verify error:", data);
        return json({ error: data.message || "인증 코드가 올바르지 않습니다" }, 400);
      }
      return json({ success: true, status: data.status });
    }

    // ── 알 수 없는 action ────────────────────────────────────────
    return json({ error: `Unknown action: ${action}` }, 400);

  } catch (err) {
    console.error("clever-api error:", err);
    return json({ error: "서버 내부 오류" }, 500);
  }
});
