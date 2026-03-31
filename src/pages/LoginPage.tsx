import i18n from "@/i18n";
import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowLeft, Check, Camera, ChevronRight, Phone, Shield, AlertCircle, Lock, User, Mail, X, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import siteLogo from "@/assets/site-logo.png";
import { supabase } from "@/lib/supabaseClient";

// ─── Constants ───
const TRAVEL_STYLES: string[] = []; // loaded inside component
const LANGUAGES = [i18n.t("auto.z_autoz한국어22_361"), "English", "日本語", "中文", "Español", "Français", "Deutsch", "عربي", "Русский", "Português", "हिन्दी", "Tiếng Việt", "ภาษาไทย", "Bahasa Indonesia", "Italiano", "Türkçe", "Nederlands", "Polski", "Bahasa Melayu", "Svenska"];
const REGIONS: string[] = []; // loaded inside component
const MAX_PHOTOS = 6;
const NATIONALITIES: string[] = []; // loaded inside component via t()

const GLOBAL_DIAL_CODES = ["+82 🇰🇷", "+1 🇺🇸", "+1 🇨🇦", "+44 🇬🇧", "+61 🇦🇺", "+81 🇯🇵", "+86 🇨🇳", "+49 🇩🇪", "+33 🇫🇷", "+39 🇮🇹", "+34 🇪🇸", "+7 🇷🇺", "+55 🇧🇷", "+52 🇲🇽", "+91 🇮🇳", "+62 🇮🇩", "+90 🇹🇷", "+27 🇿🇦", "+54 🇦🇷", "+56 🇨🇱", "+57 🇨🇴", "+51 🇵🇪", "+66 🇹🇭", "+84 🇻🇳", "+60 🇲🇾", "+63 🇵🇭", "+65 🇸🇬", "+886 🇹🇼", "+852 🇭🇰", "+853 🇲🇴", "+971 🇦🇪", "+966 🇸🇦", "+972 🇮🇱", "+20 🇪🇬", "+212 🇲🇦", "+234 🇳🇬", "+254 🇰🇪", "+46 🇸🇪", "+47 🇳🇴", "+45 🇩🇰", "+358 🇫🇮", "+31 🇳🇱", "+32 🇧🇪", "+41 🇨🇭", "+43 🇦🇹", "+48 🇵🇱", "+420 🇨🇿", "+36 🇭🇺", "+30 🇬🇷", "+351 🇵🇹", "+353 🇮🇪", "+64 🇳🇿", "+53 🇨🇺", "+593 🇪🇨", "+598 🇺🇾", "+58 🇻🇪", "+506 🇨🇷"];
const PURPOSE_OPTIONS_STATIC = [{
  id: "companion",
  emoji: "✈️",
  titleKey: "login.purpose.companion",
  descKey: "login.purpose.companionDesc",
  fbTitle: i18n.t("auto.z_autoz여행동행찾_362"),
  fbDesc: i18n.t("auto.z_autoz같이다닐여_363"),
  gradient: "from-violet-500 to-indigo-500"
}, {
  id: "post",
  emoji: "📝",
  titleKey: "login.purpose.post",
  descKey: "login.purpose.postDesc",
  fbTitle: i18n.t("auto.z_autoz게시글공유_364"),
  fbDesc: i18n.t("auto.z_autoz여행꿀팁이_365"),
  gradient: "from-rose-500 to-orange-400"
}, {
  id: "both",
  emoji: "🌍",
  titleKey: "login.purpose.both",
  descKey: "login.purpose.bothDesc",
  fbTitle: i18n.t("auto.z_autoz둘다할래요_366"),
  fbDesc: i18n.t("auto.z_autoz동행도찾고_367"),
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
  const TRAVEL_STYLES = getArr("travelStyles", [t("auto.z_autoz배낭여행2_368"), t("auto.z_autoz럭셔리23_369"), t("auto.z_autoz자연트레킹_370"), t("auto.z_autoz맛집탐방2_371"), t("auto.z_autoz문화역사2_372"), t("auto.z_autoz휴양호캉스_373"), t("auto.z_autoz사진촬영2_374"), t("auto.z_autoz나이트라이_375"), t("auto.z_autoz쇼핑242_376"), t("auto.z_autoz요가힐링2_377"), t("auto.z_autoz현지체험2_378"), t("auto.z_autoz로드트립2_379")]);
  const REGIONS = getArr("regions", [t("auto.z_autoz동남아24_380"), t("auto.z_autoz유럽247_381"), t("auto.z_autoz일본248_382"), t("auto.z_autoz미주캐나다_383"), t("auto.z_autoz중남미25_384"), t("auto.z_autoz중동아프리_385"), t("auto.z_autoz대양주25_386"), t("auto.z_autoz국내253_387"), t("auto.z_autoz중화권25_388"), t("auto.z_autoz인도권25_389")]);
  const STEP_LABELS_I18N = getArr("login.stepLabels", [t("auto.z_autoz가입정보2_390"), t("auto.z_autoz계정257_391"), t("auto.z_autoz프로필설정_392"), t("auto.z_autoz휴대폰인증_393"), t("auto.z_autoz약관동의2_394"), t("auto.z_autoz완료261_395")]);
  const NATIONALITIES = getArr("login.nationalities", [t("auto.z_autoz대한민국2_396"), t("auto.z_autoz미국263_397"), t("auto.z_autoz일본264_398"), t("auto.z_autoz중국265_399"), t("auto.z_autoz영국266_400"), t("auto.z_autoz호주267_401"), t("auto.z_autoz캐나다26_402")]);
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
  const [selectedLangs, setSelectedLangs] = useState<string[]>([t("lang.ko") || t("auto.z_autoz한국어26_403")]);
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
        title: i18n.t("auto.z_autoz인증번호를_404"),
        description: i18n.t("auto.z_tmpl_271", {
          defaultValue: i18n.t("auto.z_tmpl_405", {
            defaultValue: t("auto.t5016", {
              v0: fullPhone
            })
          })
        })
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
      if (msg.includes("Max check attempts reached")) msg = i18n.t("auto.z_autoz인증시도횟_406");
      if (msg.includes("Too many requests") || msg.includes("rate limit")) msg = i18n.t("auto.z_autoz잠시후다시_407");
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
      if (msg.includes("expired") || msg.includes("invalid") || msg.includes(i18n.t("auto.z_autoz올바르지않_408"))) {
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
          if (loginErr) throw new Error(i18n.t("auto.z_\uC774\uBBF8\uB2E4\uB978\uBC29\uC2DD\uB610\uB294\uC18C\uC15C_328"));
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
        if (!userId) throw new Error(i18n.t("auto.z_autoz계정을생성_409"));

        // 프로필 사진 업로드 (최대 6장)
        const photoUrls: string[] = [];
        for (const {
          file
        } of profilePhotos) {
          const ext = file.name.split(".").pop();
          const path = `${userId}_${Date.now()}_${photoUrls.length}.${ext}`;
          const {
            error: upErr
          } = await supabase.storage.from("avatars").upload(path, file, {
            upsert: true,
            contentType: file.type
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
      let msg = e instanceof Error ? e.message : i18n.t("auto.z_autoz오류가발생_410");
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
      <div className="flex items-center gap-3 px-5 pt-12 pb-2 z-10 relative shrink-0">
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
            <p className="text-xl font-bold text-foreground">
              {mode === "login" ? t("auto.z_autoz다시만나서_411") : signupStep === 0 ? t("auto.z_autozMigo에_412") : signupStep === 1 ? t("auto.z_autoz계정정보입_413") : signupStep === 2 ? t("auto.z_autoz전화번호인_414") : signupStep === 3 ? t("auto.z_autoz안전약관동_415") : t("auto.z_autoz여행프로필_416")}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {mode === "login" ? t("auto.z_autoz로그인하고_417") : signupStep === 0 ? t("auto.z_autoz어떤걸주로_418") : signupStep === 1 ? t("auto.z_autoz강력한비밀_419") : signupStep === 2 ? t("auto.z_autoz실명인증으_420") : signupStep === 3 ? t("auto.z_autoz약관에동의_421") : t("auto.z_autoz나만의여행_422")}
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Form */}
      <div className="flex-1 relative z-10">
        <AnimatePresence mode="wait">

          {/* ─── STEP 0: PURPOSE ─── */}
          {isSignup && signupStep === 0 && <motion.div key="step0" className="px-6 pt-4 pb-4 space-y-3" initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} transition={{
          duration: 0.25
        }}>
              {PURPOSE_OPTIONS.map(opt => <motion.button key={opt.id} onClick={() => setSignupPurpose(opt.id)} whileTap={{
            scale: 0.97
          }} className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${signupPurpose === opt.id ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${opt.gradient} flex items-center justify-center text-xl shrink-0`}>{opt.emoji}</div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{opt.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                  </div>
                  {signupPurpose === opt.id && <Check size={18} className="text-primary ml-auto shrink-0" />}
                </motion.button>)}
            </motion.div>}

          {/* ─── STEP 1: ACCOUNT ─── */}
          {isSignup && signupStep === 1 && <motion.div key="step1" className="px-6 pt-2 pb-6 space-y-4" initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} transition={{
          duration: 0.25
        }}>
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">{t("auto.z_autoz이름실명2_423")}</label>
                <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3">
                  <User size={16} className="text-muted-foreground shrink-0" />
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t("auto.z_autoz홍길동29_424")} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">{t("auto.z_autoz이메일29_425")}</label>
                <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3">
                  <Mail size={16} className="text-muted-foreground shrink-0" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hello@migo-go.com" className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground mb-1.5 block">{t("auto.z_autoz나이292_426")}</label>
                  <input type="number" value={age} onChange={e => setAge(e.target.value)} min={18} max={99} placeholder="25" className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground mb-1.5 block">{t("auto.z_autoz성별293_427")}</label>
                  <div className="flex gap-1.5">
                    {[t("auto.z_autoz남성294_428"), t("auto.z_autoz여성295_429"), t("auto.z_autoz기타296_430")].map(g => <button key={g} onClick={() => setGender(g)} className={`flex-1 py-3 rounded-2xl text-xs font-bold transition-all ${gender === g ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{g}</button>)}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">{t("auto.z_autoz국적표시용_431")}</label>
                <select value={nationality} onChange={e => setNationality(e.target.value)} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 appearance-none bg-none">
                  {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">{t("auto.z_autoz비밀번호2_432")}</label>
                <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3 mb-2">
                  <Lock size={16} className="text-muted-foreground shrink-0" />
                  <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder={t("auto.z_autoz8자이상영_433")} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                  <button onClick={() => setShowPass(!showPass)} className="shrink-0">{showPass ? <EyeOff size={16} className="text-muted-foreground" /> : <Eye size={16} className="text-muted-foreground" />}</button>
                </div>
                {password.length > 0 && <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= pwStrength.level ? pwStrength.color : "bg-muted"}`} />)}
                    </div>
                    <p className={`text-[10px] font-semibold ${pwStrength.level >= 3 ? "text-emerald-500" : "text-amber-500"}`}>{t("login." + pwStrength.label)}</p>
                  </div>}
              </div>
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">{t("login.passwordConfirm")}</label>
                <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${confirmPassword && password !== confirmPassword ? "bg-red-500/10 border border-red-500/30" : "bg-muted"}`}>
                  <Lock size={16} className="text-muted-foreground shrink-0" />
                  <input type={showConfirmPass ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder={t("login.passwordConfirmPlaceholder")} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                  <button onClick={() => setShowConfirmPass(!showConfirmPass)} className="shrink-0">{showConfirmPass ? <EyeOff size={16} className="text-muted-foreground" /> : <Eye size={16} className="text-muted-foreground" />}</button>
                </div>
                {confirmPassword && password !== confirmPassword && <p className="text-[10px] text-red-500 mt-1 font-semibold">{t("auto.z_autoz비밀번호가_434")}</p>}
              </div>
              <div className="flex items-start gap-2 p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                <AlertCircle size={14} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">{t("auto.z_autoz영문대문자_435")}</p>
              </div>
            </motion.div>}

          {/* ─── STEP 2: PHONE OTP (실제 Twilio) ─── */}
          {isSignup && signupStep === 2 && <motion.div key="step2" className="px-6 pt-2 pb-6 space-y-4" initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} transition={{
          duration: 0.25
        }}>
              <div className="flex items-center justify-center mb-2">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Phone size={28} className="text-primary" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">{t("auto.z_autoz휴대폰번호_436")}</label>
                <div className="flex gap-2">
                  <select value={phoneCountry} onChange={e => setPhoneCountry(e.target.value)} disabled={otpVerified} className="bg-muted rounded-2xl px-3 py-3 text-sm font-bold text-foreground outline-none shrink-0">
                    {GLOBAL_DIAL_CODES.map(c => {
                  const code = c.split(" ")[0];
                  return <option key={code} value={code}>{c}</option>;
                })}
                  </select>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-0000-0000" disabled={otpVerified} className="flex-1 bg-muted rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60" />
                </div>
              </div>

              {!otpVerified && <motion.button whileTap={{
            scale: 0.97
          }} onClick={sendOtp} disabled={otpLoading} className="w-full py-3 rounded-2xl gradient-primary text-primary-foreground font-bold text-sm shadow-card disabled:opacity-60 flex items-center justify-center gap-2">
                  {otpLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                  {otpSent ? t('login.resendOtp') : t('login.sendOtp')}
                </motion.button>}

              {otpSent && !otpVerified && <motion.div initial={{
            opacity: 0,
            y: 10
          }} animate={{
            opacity: 1,
            y: 0
          }} className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-foreground">{t("auto.z_autoz인증번호6_437")}</label>
                      <span className={`text-xs font-mono font-bold ${otpTimeout < 30 ? "text-red-500" : "text-muted-foreground"}`}>
                        {String(Math.floor(otpTimeout / 60)).padStart(2, "0")}:{String(otpTimeout % 60).padStart(2, "0")}
                      </span>
                    </div>
                    <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 text-center tracking-[0.3em] font-mono text-base" />
                  </div>
                  <motion.button whileTap={{
              scale: 0.97
            }} onClick={verifyOtp} disabled={otpLoading} className="w-full py-3 rounded-2xl bg-emerald-500 text-white font-bold text-sm shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
                    {otpLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                    {t("verif.checkDone")}
                  </motion.button>
                </motion.div>}

              {otpVerified && <motion.div initial={{
            scale: 0.9,
            opacity: 0
          }} animate={{
            scale: 1,
            opacity: 1
          }} className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <Check size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{t("auto.z_autoz전화번호인_438")}</p>
                    <p className="text-xs text-muted-foreground">{phoneCountry} {phone}{t("auto.z_autoz인증됨30_439")}</p>
                  </div>
                </motion.div>}

              <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                <Shield size={13} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">{t("login.phoneNotice")}</p>
              </div>


            </motion.div>}

          {/* ─── STEP 3: SAFETY AGREEMENTS ─── */}
          {isSignup && signupStep === 3 && <motion.div key="step3" className="px-6 pt-2 pb-6 space-y-3" initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} transition={{
          duration: 0.25
        }}>
              <div className="flex items-center justify-center mb-1">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Shield size={28} className="text-primary" />
                </div>
              </div>
              <button onClick={() => setAllAgree(!allAgree)} className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${allAgree ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${allAgree ? "gradient-primary" : "border-2 border-border"}`}>
                  {allAgree && <Check size={14} className="text-primary-foreground" />}
                </div>
                <span className="font-extrabold text-sm text-foreground">{t("auto.z_autoz전체동의3_440")}</span>
              </button>
              <div className="w-full h-px bg-border" />
              {[{
            key: "terms",
            value: agreeTerms,
            set: setAgreeTerms,
            label: t("auto.z_autoz필수이용약_441"),
            sub: t("auto.z_autoz서비스이용_442"),
            required: true
          }, {
            key: "privacy",
            value: agreePrivacy,
            set: setAgreePrivacy,
            label: t("auto.z_autoz필수개인정_443"),
            sub: t("auto.z_autoz회원가입서_444"),
            required: true
          }, {
            key: "age",
            value: agreeAge,
            set: setAgreeAge,
            label: t("auto.z_autoz필수만18_445"),
            sub: t("auto.z_autozMigo는_446"),
            required: true
          }, {
            key: "safety",
            value: agreeSafety,
            set: setAgreeSafety,
            label: t("auto.z_autoz필수안전가_447"),
            sub: t("auto.z_autoz욕설사기허_448"),
            required: true
          }, {
            key: "marketing",
            value: agreeMarketing,
            set: setAgreeMarketing,
            label: t("auto.z_autoz선택마케팅_449"),
            sub: t("auto.z_autoz여행특가및_450"),
            required: false
          }].map(({
            key,
            value,
            set,
            label,
            sub,
            required
          }) => <button key={key} onClick={() => set(!value)} className="w-full flex items-center gap-3 py-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 ${value ? "gradient-primary" : "border-2 border-border"}`}>
                    {value && <Check size={11} className="text-primary-foreground" />}
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-semibold ${required ? "text-foreground" : "text-muted-foreground"}`}>{label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                </button>)}
              <div className="flex items-start gap-2 p-3 rounded-2xl bg-primary/5 border border-primary/20">
                <Shield size={13} className="text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">{t("auto.z_autozMigo는_451")}<span className="font-bold text-primary">{t("auto.z_autoz신원인증된_452")}</span>{t("auto.z_autoz만이용할수_453")}</p>
              </div>
            </motion.div>}

          {/* ─── STEP 4: TRAVEL PROFILE (사진 최대 6장) ─── */}
          {isSignup && signupStep === 4 && <motion.div key="step4" className="px-6 pt-2 pb-6 space-y-5" initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} transition={{
          duration: 0.25
        }}>

              {/* 프로필 사진 최대 6장 */}
              <div>
                <label className="text-xs font-bold text-foreground mb-2 block">{t("auto.z_autoz프로필사진_454")}{" "}
                  <span className="text-red-500 font-bold text-[10px] bg-red-500/10 px-1.5 py-0.5 rounded-full">{t("auto.z_autoz필수321_455")}</span>{" "}
                  <span className="text-muted-foreground font-normal">({profilePhotos.length}/{MAX_PHOTOS}{t("auto.z_autoz장322_456")}</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {profilePhotos.map((photo, idx) => <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-border">
                      <img src={photo.url} alt="" className="w-full h-full object-cover" />
                      {idx === 0 && <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">{i18n.t("auto.z_autoz대표323_457")}</div>}
                      <button onClick={() => removePhoto(idx)} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                        <X size={10} className="text-white" />
                      </button>
                    </div>)}
                  {profilePhotos.length < MAX_PHOTOS && <button onClick={() => fileRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 bg-muted transition-colors hover:bg-muted/70">
                      <Plus size={20} className="text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{t("auto.z_autoz사진추가3_458")}</span>
                    </button>}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoAdd} />
                <p className="text-[10px] text-muted-foreground mt-2">{t("auto.z_autoz첫번째사진_459")}</p>
              </div>

              {/* Bio */}
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">{t("auto.z_autoz한줄소개3_460")}</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={100} rows={2} placeholder={t("auto.z_autoz여행에서어_461")} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:ring-2 focus:ring-primary/30" />
              </div>

              {/* Travel styles */}
              <div>
                <label className="text-xs font-bold text-foreground mb-2 block">{t("auto.z_autoz여행스타일_462")}<span className="text-muted-foreground font-normal">{t("auto.z_autoz복수선택3_463")}</span></label>
                <div className="flex flex-wrap gap-2">
                  {TRAVEL_STYLES.map(s => <button key={s} onClick={() => toggleItem(s, selectedStyles, setSelectedStyles)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedStyles.includes(s) ? "gradient-primary text-primary-foreground shadow-card" : "bg-muted text-muted-foreground"}`}>{s}</button>)}
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="text-xs font-bold text-foreground mb-2 block">{t("auto.z_autoz사용언어3_464")}</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(l => <button key={l} onClick={() => toggleItem(l, selectedLangs, setSelectedLangs)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedLangs.includes(l) ? "gradient-primary text-primary-foreground shadow-card" : "bg-muted text-muted-foreground"}`}>{l}</button>)}
                </div>
              </div>

              {/* Regions */}
              <div>
                <label className="text-xs font-bold text-foreground mb-2 block">{t("auto.z_autoz관심여행지_465")}</label>
                <div className="flex flex-wrap gap-2">
                  {REGIONS.map(r => <button key={r} onClick={() => toggleItem(r, selectedRegions, setSelectedRegions)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedRegions.includes(r) ? "gradient-primary text-primary-foreground shadow-card" : "bg-muted text-muted-foreground"}`}>{r}</button>)}
                </div>
              </div>
            </motion.div>}

          {/* ─── LOGIN ─── */}
          {mode === "login" && <motion.div key="login" className="px-6 pt-2 pb-6 space-y-4" initial={{
          opacity: 0,
          x: -20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: 20
        }} transition={{
          duration: 0.25
        }}>
              <div>
                <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3 mb-3">
                  <Mail size={16} className="text-muted-foreground shrink-0" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('login.email')} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                </div>
                <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3">
                  <Lock size={16} className="text-muted-foreground shrink-0" />
                  <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder={t('login.password')} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                  <button onClick={() => setShowPass(!showPass)}>{showPass ? <EyeOff size={16} className="text-muted-foreground" /> : <Eye size={16} className="text-muted-foreground" />}</button>
                </div>
              </div>
              <button className="text-xs text-primary font-semibold text-right w-full">{t('login.forgotPass')}</button>
              <div className="space-y-2 pt-2">
                <p className="text-[10px] text-center text-muted-foreground">{t('login.orSocial')}</p>

                {/* Google OAuth */}
                <motion.button whileTap={{
              scale: 0.97
            }} onClick={async () => {
              const {
                error
              } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: `${window.location.origin}/auth/callback`
                }
              });
              if (error) toast({
                title: i18n.t("auto.z_\uC18C\uC15C\uB85C\uADF8\uC778\uC5D0\uB7EC_386"),
                description: error.message,
                variant: "destructive"
              });
            }} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold shadow-sm transition-transform bg-card border border-border text-foreground">
                  <span>🔵</span> {t("login.google")}
                </motion.button>

                {/* 카카오 */}
                <motion.button whileTap={{
              scale: 0.97
            }} onClick={() => toast({
              title: `${t("login.kakao")} — ${t('login.comingSoon')}`
            })} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold shadow-sm transition-transform bg-[#FEE500] text-[#3C1E1E]">
                  <span>💬</span> {t("login.kakao")}
                </motion.button>

                {/* 애플 */}
                <motion.button whileTap={{
              scale: 0.97
            }} onClick={() => toast({
              title: `${t("login.apple")} — ${t('login.comingSoon')}`
            })} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold shadow-sm transition-transform bg-foreground text-background">
                  <span>🍎</span> {t("login.apple")}
                </motion.button>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-primary/5 border border-primary/20 mt-4">
                <Shield size={13} className="text-primary shrink-0" />
                <p className="text-[10px] text-muted-foreground">{t('login.sslNote')}</p>
              </div>
            </motion.div>}

        </AnimatePresence>
      </div>

      {/* Bottom button */}
      <div className="sticky bottom-0 px-6 pb-8 pt-3 z-20 bg-background/90 backdrop-blur-sm border-t border-border/30 space-y-3">
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

        {mode === "login" ? <p className="text-xs text-center text-muted-foreground">
            {t('login.noAccount')}{" "}
            <button onClick={() => {
          setMode("signup");
          setSignupStep(0);
        }} className="text-primary font-bold">
              {t('login.signupLink')}
            </button>
          </p> : <p className="text-xs text-center text-muted-foreground">
            {t('login.hasAccount')}{" "}
            <button onClick={() => setMode("login")} className="text-primary font-bold">
              {t('login.login')}
            </button>
          </p>}
      </div>

      {/* 이용약관 / 개인정보 링크 (Store Crawler 호환용 a 태그) */}
      <div className="text-[10px] text-center text-muted-foreground pb-6 pt-1 flex justify-center gap-1.5">
        <a href="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">{t('login.terms')}</a>
        <span>·</span>
        <a href="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">{t('login.privacy')}</a>
        <span>·</span>
        <button onClick={() => setShowRefundPolicyModal(true)} className="underline underline-offset-2 hover:text-foreground transition-colors">{t('login.refundPolicy')}</button>
      </div>

      {/* ─── 환불 정책 및 상품 가격 안내 Modal ─── */}
      <AnimatePresence>
        {showRefundPolicyModal && <motion.div className="fixed inset-0 z-[80] bg-background flex flex-col" initial={{
        x: "100%"
      }} animate={{
        x: 0
      }} exit={{
        x: "100%"
      }} transition={{
        type: "spring",
        damping: 28,
        stiffness: 300
      }}>
            <div className="flex items-center gap-3 px-5 pt-10 pb-4 border-b border-border shrink-0">
              <button onClick={() => setShowRefundPolicyModal(false)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"><X size={18} /></button>
              <h2 className="text-lg font-extrabold text-foreground">{t("auto.z_autoz환불정책및_467")}</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 text-sm text-foreground leading-relaxed pb-20">
              <p className="text-[13px] text-muted-foreground leading-relaxed">{t("auto.z_autozMigo는_468")}</p>

              <div>
                <h3 className="font-extrabold text-foreground mb-1.5">{t("auto.z_autoz1유료상품_469")}</h3>
                <div className="bg-muted p-4 rounded-2xl mb-2">
                  <p className="text-sm font-bold text-foreground mb-1">{t("auto.z_autoz1개월이용_470")}</p>
                  <p className="text-sm font-bold text-foreground mb-1">{t("auto.z_autoz3개월이용_471")}</p>
                  <p className="text-sm font-bold text-foreground">{t("auto.z_autoz12개월이_472")}</p>
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{t("auto.z_autoz최초결제시_473")}<br />{t("auto.z_autoz모든가격은_474")}</p>
              </div>

              {[{
            title: t("auto.z_autoz2청약철회_475"),
            content: t("auto.z_autoz유료결제후_476")
          }, {
            title: t("auto.z_autoz3청약철회_477"),
            content: t("auto.z_autoz디지털콘텐_478")
          }, {
            title: t("auto.z_autoz4자동갱신_479"),
            content: t("auto.z_autozMigoP_480")
          }, {
            title: t("auto.z_autoz5미성년자_481"),
            content: t("auto.z_autoz미성년자만_482")
          }].map((s, i) => <div key={i}>
                  <h3 className="font-extrabold text-foreground mb-1.5">{s.title}</h3>
                  <p className="text-muted-foreground text-[13px] leading-relaxed whitespace-pre-line">{s.content}</p>
                </div>)}

              <div className="mt-6 p-4 bg-muted rounded-2xl">
                <p className="text-xs text-muted-foreground"><span className="font-bold text-foreground">{t("auto.z_autoz환불신청및_483")}</span><br />{t("auto.z_autoz요청양식이_484")}<br />{t("auto.z_autoz이메일su_485")}</p>
              </div>
            </div>
          </motion.div>}
      </AnimatePresence>
    </div>;
};
export default LoginPage;