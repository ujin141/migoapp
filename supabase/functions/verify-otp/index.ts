// Supabase Edge Function: verify-otp
// Twilio Verify API를 사용해 OTP 코드를 검증합니다.
// auth.users에 phone 계정을 생성하지 않습니다.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const VERIFY_SID = Deno.env.get("TWILIO_VERIFY_SERVICE_SID")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { phone, code } = await req.json();
    if (!phone || !code) return new Response(JSON.stringify({ error: "phone and code are required" }), { status: 400, headers: cors });

    const res = await fetch(
      `https://verify.twilio.com/v2/Services/${VERIFY_SID}/VerificationCheck`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: phone, Code: code }),
      }
    );
    const data = await res.json();
    if (!res.ok || data.status !== "approved") {
      throw new Error(data.message || "인증 코드가 올바르지 않거나 만료되었습니다.");
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
