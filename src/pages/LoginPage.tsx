import { Capacitor } from "@capacitor/core";

import i18n from "@/i18n";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowLeft, Check, Camera, ChevronRight, Phone, Shield, AlertCircle, Lock, User, Mail, X, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import siteLogo from "@/assets/site-logo.png";
import { supabase } from "@/lib/supabaseClient";
import { compressImage } from "@/lib/imageCompression";
import { RefundPolicyModal } from "./login/LoginModals";
import { SignupStep0, SignupStep1, SignupStep2, SignupStep3, SignupStep4, LoginForm } from "./login/LoginForms";

// ─── Constants ───
const TRAVEL_STYLES: string[] = []; // loaded inside component
const LANGUAGES = [i18n.t("auto.g_0673", "한국어"), "English", "日本語", "中文", "Español", "Français", "Deutsch", "عربي", "Русский", "Português", "हिन्दी", "Tiếng Việt", "ภาษาไทย", "Bahasa Indonesia", "Italiano", "Türkçe", "Nederlands", "Polski", "Bahasa Melayu", "Svenska"];
const REGIONS: string[] = []; // loaded inside component
const MAX_PHOTOS = 6;
const NATIONALITIES: string[] = []; // loaded inside component via i18n.t()

const GLOBAL_DIAL_CODES = ["+82 🇰🇷", "+1 🇺🇸", "+1 🇨🇦", "+44 🇬🇧", "+61 🇦🇺", "+81 🇯🇵", "+86 🇨🇳", "+49 🇩🇪", "+33 🇫🇷", "+39 🇮🇹", "+34 🇪🇸", "+7 🇷🇺", "+55 🇧🇷", "+52 🇲🇽", "+91 🇮🇳", "+62 🇮🇩", "+90 🇹🇷", "+27 🇿🇦", "+54 🇦🇷", "+56 🇨🇱", "+57 🇨🇴", "+51 🇵🇪", "+66 🇹🇭", "+84 🇻🇳", "+60 🇲🇾", "+63 🇵🇭", "+65 🇸🇬", "+886 🇹🇼", "+852 🇭🇰", "+853 🇲🇴", "+971 🇦🇪", "+966 🇸🇦", "+972 🇮🇱", "+20 🇪🇬", "+212 🇲🇦", "+234 🇳🇬", "+254 🇰🇪", "+46 🇸🇪", "+47 🇳🇴", "+45 🇩🇰", "+358 🇫🇮", "+31 🇳🇱", "+32 🇧🇪", "+41 🇨🇭", "+43 🇦🇹", "+48 🇵🇱", "+420 🇨🇿", "+36 🇭🇺", "+30 🇬🇷", "+351 🇵🇹", "+353 🇮🇪", "+64 🇳🇿", "+53 🇨🇺", "+593 🇪🇨", "+598 🇺🇾", "+58 🇻🇪", "+506 🇨🇷"];
const PURPOSE_OPTIONS_STATIC = [{
  id: "companion",
  emoji: "✈️",
  titleKey: "login.purpose.companion",
  descKey: "login.purpose.companionDesc",
  fbTitle: i18n.t("auto.g_0674", "여행 동행 찾기"),
  fbDesc: i18n.t("auto.g_0675", "같이 다닐 여행 메이트를 찾고 싶어요"),
  gradient: "from-violet-500 to-indigo-500"
}, {
  id: "post",
  emoji: "📝",
  titleKey: "login.purpose.post",
  descKey: "login.purpose.postDesc",
  fbTitle: i18n.t("auto.g_0676", "게시글 공유하기"),
  fbDesc: i18n.t("auto.g_0677", "여행 꿀팁이나 일상을 공유하고 싶어요"),
  gradient: "from-rose-500 to-orange-400"
}, {
  id: "both",
  emoji: "🌍",
  titleKey: "login.purpose.both",
  descKey: "login.purpose.bothDesc",
  fbTitle: i18n.t("auto.g_0678", "둘 다 할래요"),
  fbDesc: i18n.t("auto.g_0679", "동행도 찾고 즐겁게 소통할래요"),
  gradient: "from-emerald-500 to-teal-400"
}];
const getPasswordStrength = (pw: string): {
  level: number;
  label: string;
  color: string;
} => {
  if (pw.length === 0) return {
    level: 0,
    label: "",
    color: ""
  };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return {
    level: 1,
    label: "pwStrength1",
    color: "bg-red-500"
  };
  if (score === 2) return {
    level: 2,
    label: "pwStrength2",
    color: "bg-orange-400"
  };
  if (score === 3) return {
    level: 3,
    label: "pwStrength3",
    color: "bg-yellow-400"
  };
  return {
    level: 4,
    label: "pwStrength4",
    color: "bg-emerald-500"
  };
};
const STEP_LABELS: string[] = []; // loaded inside component

const LoginPage = () => {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  // Locale-driven arrays (must be inside component so t() is available)
  const getArr = (key: string, fb: string[]) => {
    const v = t(key, {
      returnObjects: true
    });
    return Array.isArray(v) && v.length ? v : fb;
  };
  const TRAVEL_STYLES = getArr("travelStyles", [t("auto.g_0680", "배낭여행"), t("auto.g_0681", "럭셔리"), t("auto.g_0682", "자연트레킹"), t("auto.g_0683", "맛집탐방"), t("auto.g_0684", "문화역사"), t("auto.g_0685", "휴양/호캉스"), t("auto.g_0686", "사진촬영"), t("auto.g_0687", "나이트라이프"), t("auto.g_0688", "쇼핑"), t("auto.g_0689", "요가/힐링"), t("auto.g_0690", "현지체험"), t("auto.g_0691", "로드트립")]);
  const REGIONS = getArr("regions", [t("auto.g_0692", "동남아"), t("auto.g_0693", "유럽"), t("auto.g_0694", "일본"), t("auto.g_0695", "미주/캐나다"), t("auto.g_0696", "중남미"), t("auto.g_0697", "중동/아프리카"), t("auto.g_0698", "대양주"), t("auto.g_0699", "국내"), t("auto.g_0700", "중화권"), t("auto.g_0701", "인도권")]);
  const STEP_LABELS_I18N = getArr("login.stepLabels", [t("auto.g_0702", "가입 정보"), t("auto.g_0703", "계정"), t("auto.g_0704", "프로필설정"), t("auto.g_0705", "휴대폰인증"), t("auto.g_0706", "약관 동의"), t("auto.g_0707", "완료")]);
  const NATIONALITIES = getArr("login.nationalities", [t("auto.g_0708", "대한민국"), t("auto.g_0709", "미국"), t("auto.g_0710", "일본"), t("auto.g_0711", "중국"), t("auto.g_0712", "영국"), t("auto.g_0713", "호주"), t("auto.g_0714", "캐나다")]);
  const PURPOSE_OPTIONS = PURPOSE_OPTIONS_STATIC.map(p => {
    const title = t(p.titleKey);
    const desc = t(p.descKey);
    return {
      ...p,
      title: title === p.titleKey ? p.fbTitle : title,
      desc: desc === p.descKey ? p.fbDesc : desc
    };
  });
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [signupStep, setSignupStep] = useState(0);
  const [signupPurpose, setSignupPurpose] = useState("");

  // Step 1 — Account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [nationality, setNationality] = useState(t("login.nationalities.0") || "South Korea 🇰🇷");

  // Step 2 — Phone verification (real Twilio)
  const [phone, setPhone] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("+82");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpTimeout, setOtpTimeout] = useState(180);
  const [otpTimer, setOtpTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);

  // Step 3 — Safety agreements
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreeSafety, setAgreeSafety] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  // Step 4 — Travel profile (최대 6장 사진)
  const [profilePhotos, setProfilePhotos] = useState<Array<{
    file: File;
    url: string;
  }>>([]);
  const [bio, setBio] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([t("lang.ko") || t("auto.g_0715", "한국어")]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showRefundPolicyModal, setShowRefundPolicyModal] = useState(false);
  const pwStrength = getPasswordStrength(password);
  const toggleItem = (item: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  // ─── 사진 추가/제거 ───
  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_PHOTOS - profilePhotos.length;
    const toAdd = files.slice(0, remaining).map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));
    setProfilePhotos(prev => [...prev, ...toAdd]);
    e.target.value = "";
  };
  const removePhoto = (idx: number) => {
    setProfilePhotos(prev => {
      URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // ─── Supabase Phone Auth — OTP 발송 ───
  // 무해한 Lock 탈취 에러 발생 시 자동으로 최대 3번까지 재시도하는 래퍼 함수
  const withRetry = async <T,>(fn: () => Promise<{
    data?: T;
    error?: any;
  }>): Promise<{
    data: T | null;
    error: any;
  }> => {
    let lastError: any = null;
    for (let i = 0; i < 3; i++) {
      try {
        const {
          data,
          error
        } = await fn();
        if (error && error.message && error.message.toLowerCase().includes("lock") && error.message.toLowerCase().includes("stole it")) {
          lastError = error;
          await new Promise(res => setTimeout(res, 400)); // 0.4초 대기 후 재시도
          continue;
        }
        return {
          data: data ?? null,
          error
        };
      } catch (err: any) {
        if (err.message && err.message.toLowerCase().includes("lock") && err.message.toLowerCase().includes("stole it")) {
          lastError = err;
          await new Promise(res => setTimeout(res, 400));
          continue;
        }
        return {
          data: null,
          error: err
        };
      }
    }
    return {
      data: null,
      error: lastError
    };
  };
  const sendOtp = async () => {
    const digits = phone.replace(/[^0-9]/g, "").replace(/^0/, ""); // 앞의 0 제거 (010→10)
    if (digits.length < 7) {
      toast({
        title: t('login.needPhone'),
        variant: 'destructive'
      });
      return;
    }
    const fullPhone = `${phoneCountry}${digits}`;
    setOtpLoading(true);
    try {
      // 🚨 Twilio Verify Edge Function 호출 — auth.users에 phone 계정을 일절 생성하지 않습니다.
      const res = await Promise.race([supabase.functions.invoke('twilio-send-otp', {
        body: {
          phone: fullPhone
        }
      }), new Promise<any>((_, rej) => setTimeout(() => rej(new Error("Server timeout")), 10000))]);
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);
      setOtpSent(true);
      setOtpTimeout(180);
      toast({
        title: t("auto.g_0030", "인증번호를 발송했습니다 📱"),
        description: t("auto.t_0003", `${fullPhone}로 인증번호를 발송했습니다.`)
      });
      if (otpTimer) clearInterval(otpTimer);
      const timerId = setInterval(() => {
        setOtpTimeout(n => {
          if (n <= 1) {
            clearInterval(timerId);
            return 0;
          }
          return n - 1;
        });
      }, 1000);
      setOtpTimer(timerId);
    } catch (e: unknown) {
      let msg = e instanceof Error ? e.message : "SMS sending error";
      if (msg.includes("Max check attempts reached")) msg = t("auto.g_0716", "인증번호 발송 제한 횟수를 초과했습니다.");
      if (msg.includes("Too many requests") || msg.includes("rate limit")) msg = t("auto.g_0717", "잠시 후 다시 시도해주시길 바랍니다.");
      toast({
        title: t('login.otpFail'),
        description: msg,
        variant: 'destructive'
      });
    } finally {
      setOtpLoading(false);
    }
  };

  // ─── Supabase Phone Auth — OTP 인증 ───
  const verifyOtp = async () => {
    const code = otp.replace(/\s/g, "");
    if (code.length !== 6) {
      toast({
        title: t('login.needOtp'),
        variant: 'destructive'
      });
      return;
    }
    const digits = phone.replace(/[^0-9]/g, "").replace(/^0/, "");
    const fullPhone = `${phoneCountry}${digits}`;
    setOtpLoading(true);
    try {
      // 🚨 Twilio Verify Edge Function 호출 — auth.users에 phone 계정이 전혀 생성되지 않습니다.
      const res = await Promise.race([supabase.functions.invoke('twilio-verify-otp', {
        body: {
          phone: fullPhone,
          code
        }
      }), new Promise<any>((_, rej) => setTimeout(() => rej(new Error("Server timeout. Please try again.")), 10000))]);
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);
      setOtpVerified(true);
      if (otpTimer) clearInterval(otpTimer);
      toast({
        title: t('login.otpDone')
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Verification code is incorrect";
      if (msg.includes("expired") || msg.includes("invalid") || msg.includes(t("auto.g_0718", "올바르지않"))) {
        toast({
          title: t('login.otpError'),
          description: t('login.otpErrorDesc'),
          variant: 'destructive'
        });
      } else {
        toast({
          title: t('login.otpFail'),
          description: msg,
          variant: 'destructive'
        });
      }
    } finally {
      setOtpLoading(false);
    }
  };
  const handleNextStep = async () => {
    if (signupStep === 0) {
      if (!signupPurpose) {
        toast({
          title: t('login.needPurpose'),
          variant: 'destructive'
        });
        return;
      }
      setSignupStep(1);
      return;
    }
    if (signupStep === 1) {
      if (!name.trim() || !email.trim() || !password.trim()) {
        toast({
          title: t('login.needAll'),
          variant: "destructive"
        });
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast({
          title: t('login.emailInvalid'),
          variant: 'destructive'
        });
        return;
      }
      if (password.length < 8) {
        toast({
          title: t('login.passMin8'),
          variant: 'destructive'
        });
        return;
      }
      if (password !== confirmPassword) {
        toast({
          title: t('login.passNoMatch'),
          variant: 'destructive'
        });
        return;
      }
      if (pwStrength.level < 2) {
        toast({
          title: t("alert.t55Title")
        });
        return;
      }

      // Step 1: 유효성 검사만 하고 다음 단계로 진행 (계정 생성은 마지막 단계에서)
      setSignupStep(2);
      return;
    }
    if (signupStep === 2) {
      if (!otpVerified) {
        toast({
          title: t('login.needPhoneVerify'),
          variant: 'destructive'
        });
        return;
      }
      setSignupStep(3);
      return;
    }
    if (signupStep === 3) {
      if (!agreeTerms || !agreePrivacy || !agreeAge || !agreeSafety) {
        toast({
          title: t("alert.t56Title"),
          variant: "destructive"
        });
        return;
      }
      setSignupStep(4);
      return;
    }
  };

  // ─── 실제 Supabase 회원가입 ───
  const handleSubmit = async () => {
    if (mode === "signup" && signupStep < 4) {
      handleNextStep();
      return;
    }
    if (mode === "signup" && signupStep === 4 && profilePhotos.length === 0) {
      toast({
        title: t("alert.t57Title"),
        description: t("alert.t57Desc"),
        variant: "destructive"
      });
      return;
    }
    if (mode === "signup" && signupStep === 4 && selectedStyles.length === 0) {
      toast({
        title: t("login.styleRequired"),
        variant: "destructive"
      });
      return;
    }
    if (!email || !password) {
      toast({
        title: t("login.fillRequired"),
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        // ─ 로그인 (10초 타임아웃 적용 — lock 대기 무한루프 방지)
        const loginTimeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error(t("login.loginTimeout"))), 25000));
        const {
          error
        } = await Promise.race([supabase.auth.signInWithPassword({
          email,
          password
        }), loginTimeout]);
        if (error) throw error;
        setDone(true);
        setTimeout(() => navigate("/"), 800);
      } else {
        // 회원가입 마무리 프로세스: 주미 시점에 auth.users 계정 생성
        // OTP를 통해 생성된 임시 세션(sms 인증용) 정리
        await supabase.auth.signOut();

        // 이메일/비밀번호로 실제 계정 생성
        let userId = "";
        const {
          data: signUpData,
          error: signupErr
        } = await withRetry(() => supabase.auth.signUp({
          email,
          password
        }));
        if (signupErr && (signupErr.message.includes("already") || signupErr.message.includes("exists"))) {
          const {
            data: loginData,
            error: loginErr
          } = await withRetry(() => supabase.auth.signInWithPassword({
            email,
            password
          }));
          if (loginErr) throw new Error(i18n.t("auto.z_\uC774\uBBF8\uB2E4\uB978\uBC29\uC2DD\uB610\uB294\uC18C\uC15C_328", "\uC774\uBBF8\uB2E4\uB978\uBC29\uC2DD\uB610\uB294\uC18C\uC15C"));
          userId = loginData?.user?.id ?? "";
        } else if (signupErr) {
          throw signupErr;
        } else {
          if (!signUpData?.session) {
            const {
              data: loginData2,
              error: extraAuthErr
            } = await withRetry(() => supabase.auth.signInWithPassword({
              email,
              password
            }));
            if (extraAuthErr) throw extraAuthErr;
            userId = loginData2?.user?.id ?? "";
          } else {
            userId = signUpData.session.user.id;
          }
        }
        if (!userId) throw new Error(t("auto.g_0719", "계정을 정상적으로 생성하지 못했습니다."));

        // 프로필 사진 업로드 (최대 6장)
        const photoUrls: string[] = [];
        for (const {
          file
        } of profilePhotos) {
          const compressedFile = await compressImage(file);
          const ext = compressedFile.name.split(".").pop();
          const path = `${userId}_${Date.now()}_${photoUrls.length}.${ext}`;
          const {
            error: upErr
          } = await supabase.storage.from("avatars").upload(path, compressedFile, {
            upsert: true,
            contentType: compressedFile.type
          });
          if (!upErr) {
            const {
              data
            } = supabase.storage.from("avatars").getPublicUrl(path);
            photoUrls.push(data.publicUrl);
          }
        }

        // profiles 테이블에 저장 (세션 있을 때만 성공)
        const {
          error: profileErr
        } = await supabase.from("profiles").upsert({
          id: userId,
          name,
          email,
          age: age ? parseInt(age) : null,
          gender,
          nationality,
          bio,
          phone: `${phoneCountry}${phone.replace(/[^0-9]/g, "").replace(/^0/, "")}`,
          phone_verified: otpVerified,
          travel_style: selectedStyles,
          languages: selectedLangs,
          preferred_regions: selectedRegions,
          purpose: signupPurpose,
          photo_url: photoUrls[0] || null,
          photo_urls: photoUrls,
          interests: selectedStyles,
          agree_marketing: agreeMarketing,
          created_at: new Date().toISOString(),
          // GPS 위치 (앱 시작 시 허용한 경우 즉시 저장)
          lat: parseFloat(localStorage.getItem('migo_my_lat') || '0') || null,
          lng: parseFloat(localStorage.getItem('migo_my_lng') || '0') || null
        });
        if (profileErr) console.warn("Profile upsert warning:", profileErr.message);
        setDone(true);
        toast({
          title: t('login.signupDone')
        });
        setTimeout(() => navigate("/"), 800);
      }
    } catch (e: unknown) {
      let msg = e instanceof Error ? e.message : t("auto.g_0720", "알 수 없는 오류가 발생했습니다.");
      if (msg.includes("Invalid login credentials")) msg = "Email or password is incorrect.";
      if (msg.includes("Email not confirmed")) msg = "Email not confirmed. Please verify your email.";

      // 무해한 Lock 탈취 에러 방어
      if (msg.toLowerCase().includes("lock") && msg.toLowerCase().includes("stole it")) {
        toast({
          title: t("alert.t58Title"),
          description: t("alert.t58Desc"),
          variant: "destructive"
        });
      } else {
        toast({
          title: mode === 'login' ? t('login.loginFail') : t('login.signupFail'),
          description: msg,
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };
  const allAgree = agreeTerms && agreePrivacy && agreeAge && agreeSafety && agreeMarketing;
  const setAllAgree = (v: boolean) => {
    setAgreeTerms(v);
    setAgreePrivacy(v);
    setAgreeAge(v);
    setAgreeSafety(v);
    setAgreeMarketing(v);
  };
  const totalSteps = 5;
  const isSignup = mode === "signup";

  // OTP 타이머 cleanup — 페이지 언마운트 시 메모리 누수 방지
  useEffect(() => {
    return () => {
      if (otpTimer) clearInterval(otpTimer);
    };
  }, [otpTimer]);
  return <div className="min-h-screen flex flex-col bg-background">
      {/* Background blobs (fixed so they don't scroll) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div className="absolute w-80 h-80 rounded-full bg-primary/15 blur-3xl" animate={{
        scale: [1, 1.1, 1],
        y: [0, -20, 0]
      }} transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }} style={{
        top: "-20%",
        left: "-20%"
      }} />
        <motion.div className="absolute w-64 h-64 rounded-full bg-accent/15 blur-3xl" animate={{
        scale: [1, 1.15, 1],
        y: [0, 15, 0]
      }} transition={{
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 1
      }} style={{
        bottom: "10%",
        right: "-15%"
      }} />
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-safe pb-2 z-10 relative shrink-0 truncate">
        <button onClick={async () => {
        if (isSignup && signupStep > 0) {
          if (signupStep === 2 && !otpVerified) {
            // 이메일만 가입되고 번호 인증 안 된 가계정은 뒤로가기 시 무조건 광역 삭제 처리
            await supabase.rpc('delete_user');
            await supabase.auth.signOut();
          }
          setSignupStep(signupStep - 1);
        } else {
          navigate("/onboarding");
        }
      }} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center transition-transform active:scale-90">
          <ArrowLeft size={16} className="text-foreground" />
        </button>
        {isSignup && <div className="flex-1 space-y-1">
            <div className="flex items-center gap-1.5">
              {STEP_LABELS_I18N.map((label, s) => <div key={s} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className={`h-1 rounded-full transition-all ${signupStep >= s ? "gradient-primary" : "bg-muted"}`} />
                </div>)}
            </div>
            <p className="text-[10px] text-muted-foreground text-right">
              {signupStep + 1}/{totalSteps} — {STEP_LABELS_I18N[signupStep]}
            </p>
          </div>}
      </div>

      {/* Logo + Title */}
      <motion.div className="px-6 pb-4 z-10 relative shrink-0" initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: 0.1,
      type: "spring",
      damping: 20
    }}>
        <div className="mb-1">
          <img src={siteLogo} alt="Migo" className="h-20 object-contain" />
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={`${mode}-${signupStep}`} initial={{
          opacity: 0,
          x: 10
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -10
        }} transition={{
          duration: 0.2
        }}>
            <p className="text-xl font-bold text-foreground truncate">
              {mode === "login" ? t("auto.g_0721", "다시 만나서 반가워요!") : signupStep === 0 ? t("auto.g_0722", "Migo에 오신 것을 환영해요") : signupStep === 1 ? t("auto.g_0723", "계정 정보 입력") : signupStep === 2 ? t("auto.g_0724", "전화번호 인증") : signupStep === 3 ? t("auto.g_0725", "안전 약관 동의") : t("auto.g_0726", "여행 프로필 구축")}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {mode === "login" ? t("auto.g_0727", "로그인하고 새로운 여행을 시작해보세요") : signupStep === 0 ? t("auto.g_0728", "어떤 목적으로 사용하실 건가요?") : signupStep === 1 ? t("auto.g_0729", "신뢰할 수 있고 안전한 비밀번호를 설정해주세요") : signupStep === 2 ? t("auto.g_0730", "안전한 만남을 위해 실명 인증이 필요해요") : signupStep === 3 ? t("auto.g_0731", "안전한 커뮤니티를 위해 약관에 동의해주세요") : t("auto.g_0732", "나를 잘 나타낼 수 있는 프로필을 완성해주세요")}
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Form */}
      <div className="flex-1 relative z-10">
        <AnimatePresence mode="wait">

          {/* ─── STEP 0: PURPOSE ─── */}
          {isSignup && signupStep === 0 && (
            <SignupStep0
              signupPurpose={signupPurpose}
              setSignupPurpose={setSignupPurpose}
              PURPOSE_OPTIONS={PURPOSE_OPTIONS}
            />
          )}

          {/* ─── STEP 1: ACCOUNT ─── */}
          {isSignup && signupStep === 1 && (
            <SignupStep1
              props={{ name, setName, email, setEmail, age, setAge, gender, setGender, nationality, setNationality, NATIONALITIES, password, setPassword, showPass, setShowPass, pwStrength, confirmPassword, setConfirmPassword, showConfirmPass, setShowConfirmPass, t }}
            />
          )}

          {/* ─── STEP 2: PHONE OTP (실제 Twilio) ─── */}
          {isSignup && signupStep === 2 && (
            <SignupStep2
              props={{ phoneCountry, setPhoneCountry, phone, setPhone, otpVerified, sendOtp, otpLoading, otpSent, otpTimeout, otp, setOtp, verifyOtp, t }}
            />
          )}

          {/* ─── STEP 3: SAFETY AGREEMENTS ─── */}
          {isSignup && signupStep === 3 && (
            <SignupStep3
              props={{
                allAgree, setAllAgree, agreements: [
                  { key: "terms", value: agreeTerms, set: setAgreeTerms, label: t("auto.g_0733", "서비스 이용약관 동의 (필수)"), sub: t("auto.g_0734", "Migo 서비스의 기본 정책을 확인합니다."), required: true },
                  { key: "privacy", value: agreePrivacy, set: setAgreePrivacy, label: t("auto.g_0735", "개인정보 이용 동의 (필수)"), sub: t("auto.g_0736", "서비스 제공을 위해 꼭 필요한 정보만 수집합니다."), required: true },
                  { key: "age", value: agreeAge, set: setAgreeAge, label: t("auto.g_0737", "만 18세 이상 확인 (필수)"), sub: t("auto.g_0738", "만 18세 미만의 미성년자는 가입이 불가능합니다."), required: true },
                  { key: "safety", value: agreeSafety, set: setAgreeSafety, label: t("auto.g_0739", "커뮤니티 안전가이드 동의 (필수)"), sub: t("auto.g_0740", "욕설 및 허위 사실 조장 시 계정이 삭제될 수 있습니다."), required: true },
                  { key: "marketing", value: agreeMarketing, set: setAgreeMarketing, label: t("auto.g_0741", "이벤트 및 혜택 알림 수신 (선택)"), sub: t("auto.g_0742", "다양한 특가와 프로모션 소식을 보내드려요."), required: false }
                ]
              }}
            />
          )}

          {/* ─── STEP 4: TRAVEL PROFILE (사진 최대 6장) ─── */}
          {isSignup && signupStep === 4 && (
            <SignupStep4
              props={{ profilePhotos, MAX_PHOTOS, removePhoto, fileRef, handlePhotoAdd, bio, setBio, TRAVEL_STYLES, selectedStyles, toggleItem, setSelectedStyles, LANGUAGES, selectedLangs, setSelectedLangs, REGIONS, selectedRegions, setSelectedRegions }}
            />
          )}

          {/* ─── LOGIN ─── */}
          {mode === "login" && (
            <LoginForm
              props={{ email, setEmail, password, setPassword, showPass, setShowPass, navigate, t }}
            />
          )}

        </AnimatePresence>
      </div>

      {/* Bottom button */}
      <div className="sticky bottom-0 px-6 pb-safe-or pt-3 z-20 bg-background/90 backdrop-blur-sm border-t border-border/30 space-y-3 truncate">
        <motion.button onClick={handleSubmit} disabled={loading || done} whileTap={{
        scale: 0.97
      }} className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-base shadow-float transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {done ? <motion.div initial={{
          scale: 0
        }} animate={{
          scale: 1
        }}>
              <Check size={22} className="text-primary-foreground" />
            </motion.div> : loading ? <motion.div animate={{
          rotate: 360
        }} transition={{
          repeat: Infinity,
          duration: 0.8,
          ease: "linear"
        }}>
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
            </motion.div> : mode === "login" ? t("login.loginBtn") : signupStep < 4 ? t("login.nextStep") : t("login.signupDone")}
        </motion.button>

        {mode === "login" ? (
          <p className="text-xs text-center text-muted-foreground truncate">
            {t('login.noAccount')}{" "}
            <button onClick={() => {
              setMode("signup");
              setSignupStep(0);
            }} className="text-primary font-bold">
              {t('login.signupLink')}
            </button>
          </p>
        ) : (
          <p className="text-xs text-center text-muted-foreground truncate">
            {t('login.hasAccount')}{" "}
            <button onClick={() => setMode("login")} className="text-primary font-bold">
              {t('login.login')}
            </button>
          </p>
        )}
      </div>

      {/* 이용약관 / 개인정보 링크 (Store Crawler 호환용 a 태그) */}
      <div className="text-[10px] text-center text-muted-foreground pb-6 pt-1 flex justify-center gap-1.5">
        <a href="#/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">{t('login.terms')}</a>
        <span>·</span>
        <a href="/privacy#/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">{t('login.privacy')}</a>
        <span>·</span>
        <button onClick={() => setShowRefundPolicyModal(true)} className="underline underline-offset-2 hover:text-foreground transition-colors">{t('login.refundPolicy')}</button>
      </div>

      {/* ─── 환불 정책 및 상품 가격 안내 Modal ─── */}
      <RefundPolicyModal
        showRefundPolicyModal={showRefundPolicyModal}
        setShowRefundPolicyModal={setShowRefundPolicyModal}
      />
    </div>;
};
export default LoginPage;