// supabase/functions/twilio-verify-otp/index.ts
// Twilio Verify API로 OTP를 검증하고 phone_verified를 업데이트하는 Edge Function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  const TWILIO_ACCOUNT_SID  = Deno.env.get("TWILIO_ACCOUNT_SID");
  const TWILIO_AUTH_TOKEN    = Deno.env.get("TWILIO_AUTH_TOKEN");
  const TWILIO_VERIFY_SID    = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");
  const SUPABASE_URL         = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SID || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn("[twilio-verify-otp] Missing required vars");
    return new Response(
      JSON.stringify({ error: "서버 설정 오류: 환경변수가 누락되었습니다." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { phone, code } = await req.json(); // userId 더이상 클라이언트에서 받지 않음 (권한 상승 취약점 방지)

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ error: "phone과 code가 필요합니다" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // OTP 코드 유효성: 4~8자리 숫자만 허용
    const cleanCode = code.replace(/\s/g, "");
    if (!/^\d{4,8}$/.test(cleanCode)) {
      return new Response(
        JSON.stringify({ error: "\uc798못된 OTP 코드 형식" }),
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
        Code: cleanCode, // 정제된 코드 사용
      }),
    });

    const data = await response.json();

    if (!response.ok || data.status !== "approved") {
      return new Response(
        JSON.stringify({ error: "인증 코드가 올바르지 않습니다" }), // twilioStatus 등 내부 상태 정보 노우 방지
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // OTP 인증 성공 → JWT에서 userId를 서버 측에서 추출 (no user-supplied userId)
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const supabaseClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
        const { data: { user } } = await createClient(
          SUPABASE_URL!,
          Deno.env.get("SUPABASE_ANON_KEY") ?? "",
          { global: { headers: { Authorization: authHeader } } }
        ).auth.getUser();
        
        if (user?.id) {
          await supabaseClient
            .from("profiles")
            .update({ phone_verified: true, phone: normalizedPhone })
            .eq("id", user.id); // JWT에서 서버가 직접 추출
        }
      } catch {
        // 세션없이 OTP만 검증하는 확인용; 프로필 업데이트는 화면 진행 후 낙8관적 수행 가능
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.warn("[twilio-verify-otp] Unhandled function error");
    return new Response(
      JSON.stringify({ error: "서버 내부 오류" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
