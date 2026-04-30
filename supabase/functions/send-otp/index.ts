// Supabase Edge Function: send-otp
// Twilio Verify API를 사용해 SMS OTP를 전송합니다.
// auth.users에 phone 계정을 생성하지 않습니다.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const VERIFY_SID = Deno.env.get("TWILIO_VERIFY_SERVICE_SID")!;

const ALLOWED_ORIGINS = [
  "https://migo.app",
  "https://www.migo.app",
  "http://localhost:8100",
  "http://localhost:5173",
  "capacitor://localhost",
  "http://localhost"
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || origin.endsWith("migo.app");
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "https://migo.app",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { phone } = await req.json();
    if (!phone) return new Response(JSON.stringify({ error: "phone is required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

    const res = await fetch(
      `https://verify.twilio.com/v2/Services/${VERIFY_SID}/Verifications`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: phone, Channel: "sms" }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      console.error("[Twilio Error]:", data.message || res.statusText);
      throw new Error("전송에 실패했습니다. 번호를 다시 확인해주세요.");
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e: any) {
      console.error("[Twilio Send OTP Exception]:", e);
      return new Response(JSON.stringify({ error: "메시지 전송 중 서버 오류가 발생했습니다." }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
