import i18n from "@/i18n";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Phone, User, Mail, Check, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

const GLOBAL_DIAL_CODES = [
  "+82 🇰🇷", "+1 🇺🇸", "+1 🇨🇦", "+44 🇬🇧", "+61 🇦🇺", "+81 🇯🇵", 
  "+86 🇨🇳", "+49 🇩🇪", "+33 🇫🇷", "+39 🇮🇹", "+34 🇪🇸", "+7 🇷🇺", 
  "+55 🇧🇷", "+52 🇲🇽", "+91 🇮🇳", "+62 🇮🇩", "+90 🇹🇷", "+27 🇿🇦", 
  "+54 🇦🇷", "+56 🇨🇱", "+57 🇨🇴", "+51 🇵🇪", "+66 🇹🇭", "+84 🇻🇳", 
  "+60 🇲🇾", "+63 🇵🇭", "+65 🇸🇬", "+886 🇹🇼", "+852 🇭🇰", "+853 🇲🇴"
];

const FindAccountPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<"id" | "password">(location.state?.tab || "id");

  // --- ID Find States ---
  const [name, setName] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("+82");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpTimeout, setOtpTimeout] = useState(180);
  const [otpTimer, setOtpTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  
  const [foundEmail, setFoundEmail] = useState<string | null>(null);

  // --- Password Reset States ---
  const [email, setEmail] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  // ─── Twilio OTP 발송 ───
  const sendOtp = async () => {
    if (!name.trim()) {
      toast({ title: t("findAccount.noName"), variant: "destructive" });
      return;
    }
    const digits = phone.replace(/[^0-9]/g, "").replace(/^0/, "");
    if (digits.length < 7) {
      toast({ title: t("login.needPhone"), variant: "destructive" });
      return;
    }
    const fullPhone = `${phoneCountry}${digits}`;
    setOtpLoading(true);

    try {
      const res = await Promise.race([
        supabase.functions.invoke("twilio-send-otp", { body: { phone: fullPhone } }),
        new Promise<any>((_, rej) => setTimeout(() => rej(new Error("Server timeout")), 10000))
      ]);
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);

      setOtpSent(true);
      setOtpTimeout(180);
      toast({ title: t("findAccount.otpSent") });

      if (otpTimer) clearInterval(otpTimer);
      const timerId = setInterval(() => {
        setOtpTimeout((n) => {
          if (n <= 1) {
            clearInterval(timerId);
            return 0;
          }
          return n - 1;
        });
      }, 1000);
      setOtpTimer(timerId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "SMS sending error";
      toast({ title: t("login.otpFail"), description: msg, variant: "destructive" });
    } finally {
      setOtpLoading(false);
    }
  };

  // ─── Twilio OTP 인증 및 이메일 조회 ───
  const verifyOtpAndFindId = async () => {
    const code = otp.replace(/\s/g, "");
    if (code.length !== 6) {
      toast({ title: t("login.needOtp"), variant: "destructive" });
      return;
    }
    const digits = phone.replace(/[^0-9]/g, "").replace(/^0/, "");
    const fullPhone = `${phoneCountry}${digits}`;
    setOtpLoading(true);

    try {
      // 1. 휴대폰 인증 검증
      const res = await Promise.race([
        supabase.functions.invoke("twilio-verify-otp", { body: { phone: fullPhone, code } }),
        new Promise<any>((_, rej) => setTimeout(() => rej(new Error("Server timeout")), 10000))
      ]);
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);

      setOtpVerified(true);
      if (otpTimer) clearInterval(otpTimer);

      // 2. 일치하는 이메일 찾기 (RPC 호출)
      const { data: maskEmail, error: rpcError } = await supabase.rpc("find_email_by_phone", {
        p_name: name.trim(),
        p_phone: fullPhone
      });

      if (rpcError) throw rpcError;

      if (!maskEmail) {
        toast({ title: t("findAccount.noMatch"), variant: "destructive" });
      } else {
        setFoundEmail(maskEmail);
        toast({ title: t("findAccount.success") });
      }

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Verification error";
      toast({ title: t("findAccount.otpFail"), description: msg, variant: "destructive" });
    } finally {
      setOtpLoading(false);
    }
  };

  // ─── 비밀번호 재설정 이메일 발송 ───
  const handlePasswordReset = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast({ title: t("findAccount.badEmail"), variant: "destructive" });
      return;
    }
    setLoadingReset(true);
    try {
      const resetUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: resetUrl,
      });
      if (error) throw error;
      
      setResetEmailSent(true);
      toast({ title: t("findAccount.resetMailSent") });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error sending reset email";
      toast({ title: t("findAccount.resetMailFail"), description: msg, variant: "destructive" });
    } finally {
      setLoadingReset(false);
    }
  };

  // OTP 타이머 cleanup — 언마운트 시 메모리 누수 방지
  useEffect(() => {
    return () => {
      if (otpTimer) clearInterval(otpTimer);
    };
  }, [otpTimer]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          className="absolute w-80 h-80 rounded-full bg-primary/10 blur-3xl"
          animate={{ scale: [1, 1.1, 1], y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: "-20%", left: "-20%" }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-2 z-10 relative shrink-0">
        <button
          onClick={() => navigate("/login")}
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center transition-transform active:scale-90"
        >
          <ArrowLeft size={16} className="text-foreground" />
        </button>
      </div>

      <motion.div
        className="px-6 pb-6 z-10 relative shrink-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", damping: 20 }}
      >
        <p className="text-2xl font-bold text-foreground mb-6 truncate">{t("findAccount.title")}</p>

        {/* Tab Segments */}
        <div className="flex bg-muted p-1 rounded-2xl mb-8">
          <button
            onClick={() => setActiveTab("id")}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
              activeTab === "id" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t("findAccount.tabId", {defaultValue: "Find ID"})}
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
              activeTab === "password" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t("findAccount.tabPassword", {defaultValue: "Find Password"})}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "id" ? (
            <motion.div
              key="find-id"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-start gap-2 p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20 mb-4">
                <AlertCircle size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed truncate">
                  {t("auto.g_0671", "가입 시 등록한 **이름**과 **휴대폰 번호(+인증)**가 일치해야 조회가 가능합니다.")}</p>
              </div>

              {!foundEmail ? (
                <>
                  <div>
                    <label className="text-xs font-bold text-foreground mb-1.5 block">{t("findAccount.inputName")}</label>
                    <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3">
                      <User size={16} className="text-muted-foreground shrink-0" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("findAccount.inputNamePh")}
                        disabled={otpVerified}
                        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground mb-1.5 block">{t("findAccount.inputPhone")}</label>
                    <div className="flex gap-2">
                      <select
                        value={phoneCountry}
                        onChange={(e) => setPhoneCountry(e.target.value)}
                        disabled={otpVerified}
                        className="bg-muted rounded-2xl px-3 py-3 text-sm font-bold text-foreground outline-none shrink-0"
                      >
                        {GLOBAL_DIAL_CODES.map((c) => {
                          const code = c.split(" ")[0];
                          return <option key={code} value={code}>{c}</option>;
                        })}
                      </select>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="010-0000-0000"
                        disabled={otpVerified}
                        className="flex-1 bg-muted rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  {!otpVerified && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={sendOtp}
                      disabled={otpLoading}
                      className="w-full py-3.5 mt-2 rounded-2xl gradient-primary text-primary-foreground font-bold text-sm shadow-card disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {otpLoading ? (
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : otpSent ? (
                        t("findAccount.btnOtpResend")
                      ) : (
                        t("findAccount.btnOtpSend")
                      )}
                    </motion.button>
                  )}

                  {otpSent && !otpVerified && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4 mt-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground truncate">{t("findAccount.otpLabel")}</span>
                        <span className="text-xs font-bold text-primary truncate">
                          {Math.floor(otpTimeout / 60)}:{(otpTimeout % 60).toString().padStart(2, "0")}
                        </span>
                      </div>
                      <input
                        type="number"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder={t("findAccount.otpPh")}
                        className="w-full bg-white dark:bg-black rounded-xl px-4 py-3 text-sm font-bold tracking-widest text-center outline-none border-2 border-transparent focus:border-primary/40 transition-all"
                      />
                      <motion.button
                        whileTap={{ scale: otpTimeout > 0 && otp.length === 6 ? 0.97 : 1 }}
                        onClick={verifyOtpAndFindId}
                        disabled={otpTimeout <= 0 || otp.length !== 6 || otpLoading}
                        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50"
                      >
                        {otpLoading ? t("findAccount.btnOtpWait") : t("findAccount.btnVerifyOtp")}
                      </motion.button>
                    </motion.div>
                  )}
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-500/10 border-2 border-emerald-500/20 p-6 rounded-3xl flex flex-col items-center justify-center"
                >
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                    <Check size={32} className="text-emerald-500" />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground mb-1 truncate">{t("findAccount.foundIdLabel")}</p>
                  <p className="text-2xl font-extrabold text-foreground tracking-tight">{foundEmail}</p>

                  <button
                    onClick={() => navigate("/login")}
                    className="mt-6 px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-md"
                  >
                    {t("findAccount.loginWithThis", {defaultValue: "Login with this account"})}
                  </button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="find-password"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {!resetEmailSent ? (
                <>
                  <div className="flex items-start gap-2 p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20 mb-4">
                    <AlertCircle size={14} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed truncate">
                      {t("auto.g_0672", "가입 시 등록하신 이메일 주소를 입력해 주시면 **비밀번호 재설정 링크**가 포함된 메일을 발송해 드립니다.")}</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground mb-1.5 block">{t("findAccount.inputEmail")}</label>
                    <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3">
                      <Mail size={16} className="text-muted-foreground shrink-0" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t("findAccount.inputEmailPh")}
                        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handlePasswordReset}
                    disabled={loadingReset}
                    className="w-full py-4 mt-2 rounded-2xl gradient-primary text-primary-foreground font-bold text-base shadow-card disabled:opacity-60 flex items-center justify-center"
                  >
                    {loadingReset ? (
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      t("findAccount.btnResetSend")
                    )}
                  </motion.button>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-blue-500/10 border-2 border-blue-500/20 p-6 rounded-3xl flex flex-col items-center justify-center text-center"
                >
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                    <Mail size={32} className="text-blue-500" />
                  </div>
                  <p className="text-lg font-bold text-foreground mb-2 truncate">{t("findAccount.resetDoneTitle")}</p>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed truncate">
                    <strong className="text-foreground">{email}</strong> {t("findAccount.resetDoneDesc1")}<br />{t("findAccount.resetDoneDesc2")}
                  </p>

                  <button
                    onClick={() => navigate("/login")}
                    className="px-6 py-3 bg-muted text-muted-foreground font-semibold rounded-xl text-sm"
                  >
                    {t("findAccount.backToLogin", {defaultValue: "Back to Login"})}
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default FindAccountPage;
