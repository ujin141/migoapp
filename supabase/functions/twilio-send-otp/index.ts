// supabase/functions/twilio-send-otp/index.ts
// Twilio Verify API를 사용해 SMS OTP를 발송하는 Edge Function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  "https://migo.app",
  "https://www.migo.app",
  "capacitor://localhost",
  "http://localhost:5173", // dev only
];

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": (origin && ALLOWED_ORIGINS.some(o => origin.startsWith(o))) ? origin : ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  // CORS preflight — OPTIONS는 항상 200으로 응답 (시크릿 로드 전)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 핸들러 안에서 env var 로드 (preflight 이후에만 실행됨)
  const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
  const TWILIO_AUTH_TOKEN   = Deno.env.get("TWILIO_AUTH_TOKEN");
  const TWILIO_VERIFY_SID   = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SID) {
    console.warn("[twilio-send-otp] Missing required Twilio vars");
    return new Response(
      JSON.stringify({ error: "서버 설정 오류: Twilio 환경변수가 누락되었습니다." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { phone } = await req.json();

    if (!phone) {
      return new Response(JSON.stringify({ error: "phone is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 전화번호 정규화: 숫자와 + 만 허용
    const normalizedPhone = phone.replace(/[^\d+]/g, "");
    
    // 전화번호 최소/최대 자릿수 검증 (+ 제외 7~15자리)
    const digits = normalizedPhone.replace(/[^\d]/g, "");
    if (digits.length < 7 || digits.length > 15) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Twilio Verify - OTP 발송
    const url = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SID}/Verifications`;
    const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: normalizedPhone,
        Channel: "sms",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.warn("[twilio-send-otp] Twilio error status:", response.status);
      return new Response(
        JSON.stringify({ error: data.message || "SMS 발송 실패" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, status: data.status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.warn("[twilio-send-otp] Unhandled function error");
    return new Response(
      JSON.stringify({ error: "서버 내부 오류" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
