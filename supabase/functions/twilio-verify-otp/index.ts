// supabase/functions/twilio-verify-otp/index.ts
// Twilio Verify API로 OTP를 검증하고 phone_verified를 업데이트하는 Edge Function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS preflight — OPTIONS는 항상 200으로 응답 (시크릿 로드 전)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const TWILIO_ACCOUNT_SID  = Deno.env.get("TWILIO_ACCOUNT_SID");
  const TWILIO_AUTH_TOKEN    = Deno.env.get("TWILIO_AUTH_TOKEN");
  const TWILIO_VERIFY_SID    = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");
  const SUPABASE_URL         = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SID || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing required environment variables");
    return new Response(
      JSON.stringify({ error: "서버 설정 오류: 환경변수가 누락되었습니다." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { phone, code, userId } = await req.json();

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ error: "phone과 code가 필요합니다" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedPhone = phone.replace(/[^\d+]/g, "");

    // Twilio Verify - OTP 검증
    const url = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SID}/VerificationCheck`;
    const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: normalizedPhone,
        Code: code,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.status !== "approved") {
      return new Response(
        JSON.stringify({ error: "인증 코드가 올바르지 않습니다", twilioStatus: data.status }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // OTP 인증 성공 → Supabase profiles 업데이트
    if (userId) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      await supabase
        .from("profiles")
        .update({ phone_verified: true, phone: normalizedPhone })
        .eq("id", userId);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Edge Function error:", err);
    return new Response(
      JSON.stringify({ error: "서버 내부 오류" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
