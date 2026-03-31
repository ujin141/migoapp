import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Check, Lock, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { getLocalizedPrice } from "@/lib/pricing";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupTitle: string;
  groupId: string;
  entryFee: number;
  onPaymentSuccess: () => void;
}

const PaymentModal = ({ isOpen, onClose, groupTitle, groupId, entryFee, onPaymentSuccess }: PaymentModalProps) => {
  const { t, i18n } = useTranslation();
  // PAYMENT_METHODS must be inside component so t() is scoped correctly
  const PAYMENT_METHODS = [
    { id: "kakao", label: t("payment.methods.0.label"), emoji: "💛", color: "bg-yellow-400/10 border-yellow-400/30 text-yellow-500" },
    { id: "toss",  label: t("payment.methods.1.label"), emoji: "🔵", color: "bg-blue-500/10 border-blue-500/30 text-blue-500" },
    { id: "card",  label: t("payment.methods.2.label"), emoji: "💳", color: "bg-muted border-border text-foreground" },
  ];

  const { user } = useAuth();
  const [method, setMethod] = useState<string>("kakao");
  const [step, setStep] = useState<"select" | "confirm" | "done">("select");
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!user) {
      toast({ title: t("payment.loginRequired"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("payments").insert({
        user_id: user.id,
        group_id: groupId,
        amount: entryFee,
        method,
        status: "pending",
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      setStep("done");
      setTimeout(() => {
        onPaymentSuccess();
        onClose();
        setStep("select");
      }, 1800);
    } catch {
      toast({ title: t("payment.fail"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setStep("select"); onClose(); };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-foreground/70 backdrop-blur-md" onClick={reset} />
          <motion.div
            className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-t-3xl shadow-float"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
              <div>
                <h2 className="text-base font-extrabold text-foreground">{t("payment.title")}</h2>
                <p className="text-xs text-muted-foreground truncate max-w-[220px]">{groupTitle}</p>
              </div>
              <button onClick={reset} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>

            <div className="px-5 py-4 pb-10">
              {/* DONE */}
              {step === "done" && (
                <motion.div
                  className="flex flex-col items-center py-8 gap-3"
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Check size={32} className="text-emerald-500" />
                  </div>
                  <p className="text-lg font-extrabold text-foreground">{t("payment.success")}</p>
                  <p className="text-xs text-muted-foreground text-center">{groupTitle}</p>
                </motion.div>
              )}

              {/* SELECT */}
              {step === "select" && (
                <>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/20 mb-4">
                    <span className="text-sm font-bold text-foreground">{t("payment.entryFee")}</span>
                    <span className="text-xl font-extrabold text-primary">{getLocalizedPrice(entryFee, i18n.language)}</span>
                  </div>

                  <p className="text-xs font-bold text-muted-foreground mb-3">{t("payment.selectMethod")}</p>
                  <div className="space-y-2 mb-5">
                    {PAYMENT_METHODS.map((m) => (
                      <button key={m.id} onClick={() => setMethod(m.id)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                          method === m.id ? m.color + " ring-1 ring-primary/30" : "bg-muted border-border text-muted-foreground"
                        }`}>
                        <span className="text-lg">{m.emoji}</span>
                        <span className="text-sm font-bold flex-1 text-left">{m.label}</span>
                        {method === m.id && <Check size={14} className="text-primary" />}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 mb-5">
                    <AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-600/80 leading-relaxed">
                      {t("payment.testMode")}
                    </p>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setStep("confirm")}
                    className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-extrabold flex items-center justify-center gap-2 shadow-float"
                  >
                    <Lock size={14} /> {getLocalizedPrice(entryFee, i18n.language)} {t("payment.pay")}
                  </motion.button>
                </>
              )}

              {/* CONFIRM */}
              {step === "confirm" && (
                <>
                  <div className="space-y-3 mb-5">
                    {[
                      [t("payment.group"), groupTitle],
                      [t("payment.selectMethod"), PAYMENT_METHODS.find(m => m.id === method)?.label ?? method],
                      [t("payment.entryFee"), getLocalizedPrice(entryFee, i18n.language)],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between py-2 border-b border-border/40">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className="text-xs font-bold text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep("select")}
                      className="flex-1 py-3.5 rounded-2xl bg-muted text-foreground font-bold text-sm">
                      {t("payment.back")}
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      disabled={loading}
                      onClick={handlePay}
                      className="flex-1 py-3.5 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-sm flex items-center justify-center gap-2 shadow-float disabled:opacity-60"
                    >
                      {loading ? t("payment.paying") : <><Check size={14} /> {t("payment.pay")}</>}
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
