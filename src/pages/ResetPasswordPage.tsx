import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

const getPasswordStrength = (pw: string) => {
  if (pw.length === 0) return { level: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 1, label: "pwStrength1", color: "bg-red-500" };
  if (score === 2) return { level: 2, label: "pwStrength2", color: "bg-orange-400" };
  if (score === 3) return { level: 3, label: "pwStrength3", color: "bg-yellow-400" };
  return { level: 4, label: "pwStrength4", color: "bg-emerald-500" };
};

const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  
  const pwStrength = getPasswordStrength(password);

  useEffect(() => {
    // URL 해시에 access_token이 제대로 들어와서 Supabase 세션이 연결되었는지 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // 비밀번호 변경용 세션이 없다면 로그아웃된 일반 상태이므로 진입 불가
        toast({ title: t("resetPassword.invalidLink"), variant: "destructive" });
        navigate("/login", { replace: true });
      }
    });
  }, [navigate]);

  const handleSubmit = async () => {
    if (password.length < 8) {
      toast({ title: t("login.passMin8"), variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: t("login.passNoMatch"), variant: "destructive" });
      return;
    }
    if (pwStrength.level < 2) {
      toast({ title: t("alert.t55Title"), variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      setDone(true);
      toast({ title: t("resetPassword.changeSuccess") });
      
      // 변경 완료 후 로그인 페이지로
      setTimeout(() => {
        supabase.auth.signOut().then(() => {
          navigate("/login");
        });
      }, 1500);

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error updating password";
      toast({ title: t("resetPassword.changeFail"), description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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

      <motion.div
        className="px-6 pt-24 pb-6 z-10 relative shrink-0 flex flex-col justify-center max-w-lg mx-auto w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", damping: 20 }}
      >
        {!done ? (
          <>
            <p className="text-2xl font-bold text-foreground mb-2 truncate">{t("resetPassword.setNew")}</p>
            <p className="text-sm text-muted-foreground mb-8 truncate">{t("resetPassword.descNew")}</p>

            <div className="space-y-4">
              <div className="truncate">
                <label className="text-xs font-bold text-foreground mb-1.5 block">{t("resetPassword.newPw")}</label>
                <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3 mb-2">
                  <Lock size={16} className="text-muted-foreground shrink-0" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("auto.g_0969", "8자이상영")}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  />
                  <button onClick={() => setShowPass(!showPass)} className="shrink-0">
                    {showPass ? <EyeOff size={16} className="text-muted-foreground" /> : <Eye size={16} className="text-muted-foreground" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= pwStrength.level ? pwStrength.color : "bg-muted"}`} />
                      ))}
                    </div>
                    <p className={`text-[10px] font-semibold ${pwStrength.level >= 3 ? "text-emerald-500" : "text-amber-500"}`}>
                      {t("login." + pwStrength.label)}
                    </p>
                  </div>
                )}
              </div>

              <div className="truncate">
                <label className="text-xs font-bold text-foreground mb-1.5 block">{t("resetPassword.confirmPw")}</label>
                <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${confirmPassword && password !== confirmPassword ? "bg-red-500/10 border border-red-500/30" : "bg-muted"}`}>
                  <Lock size={16} className="text-muted-foreground shrink-0" />
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("login.passwordConfirmPlaceholder")}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  />
                  <button onClick={() => setShowConfirmPass(!showConfirmPass)} className="shrink-0">
                    {showConfirmPass ? <EyeOff size={16} className="text-muted-foreground" /> : <Eye size={16} className="text-muted-foreground" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[10px] text-red-500 mt-1 font-semibold truncate">{t("auto.g_0970", "비밀번호가")}</p>
                )}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={loading || password.length < 8 || password !== confirmPassword}
              className="w-full py-4 mt-8 rounded-2xl gradient-primary text-primary-foreground font-bold text-base shadow-card disabled:opacity-60 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                t("resetPassword.btnChange")
              )}
            </motion.button>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center mt-12 text-center"
          >
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
              <Check size={40} className="text-emerald-500" />
            </div>
            <p className="text-xl font-bold text-foreground mb-2 truncate">{t("resetPassword.doneTitle")}</p>
            <p className="text-sm text-muted-foreground truncate">{t("resetPassword.descDone")}</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
