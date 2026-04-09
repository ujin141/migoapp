import i18n from "@/i18n";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Lock, AlertCircle, Tag, Crown, ChevronRight, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/context/SubscriptionContext";
import { getLocalizedPrice, GroupPriceTier, GROUP_TIER_CONFIGS, getTierConfig, getJoinFeeAfterDiscount, inferGroupTier } from "@/lib/pricing";
import { TIER_LOCALES } from "@/i18n/tierLocales";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupTitle: string;
  groupId: string;
  groupTags?: string[];
  isPremiumGroup?: boolean;
  priceTier?: GroupPriceTier;
  onPaymentSuccess: () => void;
}
const TIER_COLORS: Record<GroupPriceTier, {
  bg: string;
  border: string;
  text: string;
  badge: string;
}> = {
  travel: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-600",
    badge: "bg-emerald-500"
  },
  party: {
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    text: "text-pink-600",
    badge: "bg-pink-500"
  },
  premium: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-600",
    badge: "bg-amber-500"
  }
};
const PAYMENT_METHODS = [{
  id: "kakao",
  label: i18n.t("auto.z_\uCE74\uCE74\uC624\uD398_2c3691", "\uCE74\uCE74\uC624\uD398"),
  emoji: "💛",
  color: "bg-yellow-400/10 border-yellow-400/30 text-yellow-600"
}, {
  id: "toss",
  label: i18n.t("auto.z_\uD1A0\uC2A4\uD398\uC774_4dd8bf", "\uD1A0\uC2A4\uD398\uC774"),
  emoji: "🔵",
  color: "bg-blue-500/10 border-blue-500/30 text-blue-600"
}, {
  id: "card",
  label: i18n.t("auto.z_\uC2E0\uC6A9\uCE74\uB4DC_9499b9", "\uC2E0\uC6A9\uCE74\uB4DC"),
  emoji: "💳",
  color: "bg-muted border-border text-foreground"
}];

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────
const PaymentModal = ({
  isOpen,
  onClose,
  groupTitle,
  groupId,
  groupTags = [],
  isPremiumGroup = false,
  priceTier,
  onPaymentSuccess
}: PaymentModalProps) => {
  const {
    i18n
  } = useTranslation();
  const {
    user
  } = useAuth();
  const {
    isPlus
  } = useSubscription();
  const resolvedTier: GroupPriceTier = priceTier ?? inferGroupTier(groupTags, groupTitle, isPremiumGroup);
  const tierCfg = getTierConfig(resolvedTier);
  const colors = TIER_COLORS[resolvedTier];
  const originalKrw = tierCfg.krw;
  const discountedKrw = getJoinFeeAfterDiscount(originalKrw, isPlus);
  const hasDiscount = isPlus && discountedKrw < originalKrw;
  const [method, setMethod] = useState<string>("kakao");
  const [step, setStep] = useState<"info" | "select" | "confirm" | "done">("info");
  const [loading, setLoading] = useState(false);
  const handlePay = async () => {
    if (!user) {
      toast({
        title: i18n.t("auto.z_\uB85C\uADF8\uC778\uC774_c49092", "\uB85C\uADF8\uC778\uC774"),
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const {
        error
      } = await supabase.from("payments").insert({
        user_id: user.id,
        group_id: groupId,
        amount: discountedKrw,
        original_amount: originalKrw,
        method,
        price_tier: resolvedTier,
        is_plus_discount: hasDiscount,
        status: "pending",
        created_at: new Date().toISOString()
      });
      if (error) throw error;
      setStep("done");
      setTimeout(() => {
        onPaymentSuccess();
        onClose();
        setStep("info");
      }, 1800);
    } catch {
      toast({
        title: i18n.t("auto.z_\uACB0\uC81C\uC5D0\uC2E4_21683e", "\uACB0\uC81C\uC5D0\uC2E4"),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const reset = () => {
    setStep("info");
    onClose();
  };

  // ── Shared: sticky header inside each step panel ──
  const ModalHeader = () => <>
      <div className="flex justify-center pt-3 pb-1 shrink-0">
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
      </div>
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/30 shrink-0">
        <div>
          <h2 className="text-base font-extrabold text-foreground truncate">{i18n.t("auto.z_\uADF8\uB8F9\uCC38\uC5EC_a22379", "\uADF8\uB8F9\uCC38\uC5EC")}</h2>
          <p className="text-xs text-muted-foreground truncate max-w-[220px] mt-0.5">{groupTitle}</p>
        </div>
        <button onClick={reset} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
          <X size={16} className="text-muted-foreground" />
        </button>
      </div>
    </>;
  return <AnimatePresence>
      {isOpen && <motion.div className="fixed inset-0 z-[90] flex items-end justify-center px-safe pb-safe pt-safe" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }}>
          <div className="absolute inset-0 bg-foreground/60 backdrop-blur-md" onClick={reset} />

          <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl shadow-float flex flex-col mb-2 sm:mb-6" style={{
        maxHeight: "85dvh"
      }} initial={{
        y: "100%"
      }} animate={{
        y: 0
      }} exit={{
        y: "100%"
      }} transition={{
        type: "spring",
        damping: 28,
        stiffness: 300
      }}>
            <ModalHeader />

            {/* ── DONE ── */}
            {step === "done" && <motion.div className="flex flex-col items-center py-12 gap-4 px-5" initial={{
          scale: 0.8,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }}>
                <motion.div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center" animate={{
            scale: [1, 1.1, 1]
          }} transition={{
            duration: 0.5
          }}>
                  <Check size={40} className="text-emerald-500" strokeWidth={3} />
                </motion.div>
                <div className="text-center">
                  <p className="text-xl font-extrabold text-foreground truncate">{i18n.t("auto.z_\uACB0\uC81C\uC644\uB8CC_0f4cb5", "\uACB0\uC81C\uC644\uB8CC")}</p>
                  <p className="text-sm text-muted-foreground mt-1 truncate">{groupTitle}{i18n.t("auto.z_\uC5D0\uCC38\uC5EC\uC911_55fe95", "\uC5D0\uCC38\uC5EC\uC911")}</p>
                </div>
              </motion.div>}

            {/* ── INFO ── */}
            {step === "info" && <>
                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
                  {/* Tier badge */}
                  <div className={`flex items-center gap-3 p-4 rounded-2xl border ${colors.bg} ${colors.border}`}>
                    <div className={`w-11 h-11 rounded-xl ${colors.badge} flex items-center justify-center shadow-sm`}>
                      <span className="text-xl">{tierCfg.emoji}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-extrabold ${colors.text}`}>
                          {TIER_LOCALES[i18n.language.split("-")[0] || "en"]?.tier?.[tierCfg.tier]?.label || tierCfg.label}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium truncate">
                          {TIER_LOCALES[i18n.language.split("-")[0] || "en"]?.tier?.[tierCfg.tier]?.sublabel || tierCfg.sublabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 italic truncate">
                        "{TIER_LOCALES[i18n.language.split("-")[0] || "en"]?.tier?.[tierCfg.tier]?.tagline || tierCfg.tagline}"
                      </p>
                    </div>
                  </div>

                  {/* Price display */}
                  <div className="rounded-2xl overflow-hidden border border-border truncate">
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/40">
                      <span className="text-sm text-muted-foreground truncate">{i18n.t("auto.z_\uCC38\uC5EC\uBE44\uC6A9_b4522d", "\uCC38\uC5EC\uBE44\uC6A9")}</span>
                      <span className={`text-lg font-extrabold ${hasDiscount ? "line-through text-muted-foreground" : colors.text}`}>
                        {getLocalizedPrice(originalKrw, i18n.language)}
                      </span>
                    </div>
                    {hasDiscount && <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border-t border-primary/20">
                        <div className="flex items-center gap-2">
                          <Crown size={13} className="text-amber-500" />
                          <span className="text-xs font-bold text-primary truncate">{i18n.t("auto.z_Migo_79a69f", "Migo")}</span>
                        </div>
                        <span className="text-xl font-extrabold text-primary">
                          {getLocalizedPrice(discountedKrw, i18n.language)}
                        </span>
                      </div>}
                    {!isPlus && <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/5 border-t border-amber-500/20">
                        <Sparkles size={12} className="text-amber-500 shrink-0" />
                        <p className="text-[11px] text-amber-600 truncate">
                          <span className="font-bold">Migo Plus</span>{i18n.t("auto.z_구독시_45d511", {defaultValue:" - "})}
                          <span className="font-extrabold">{getLocalizedPrice(Math.round(originalKrw * 0.5 / 100) * 100, i18n.language)}</span> {i18n.t("auto.z_으로_78818a", {defaultValue:"(50% OFF)"})}
                        </p>
                      </div>}
                  </div>

                  {/* All tier preview */}
                  <div className="space-y-2 truncate">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1 truncate">{i18n.t("auto.z_\uCC38\uC5EC\uBE44\uC6A9_9565c9", "\uCC38\uC5EC\uBE44\uC6A9")}</p>
                    {GROUP_TIER_CONFIGS.map(tc => {
                const tc_colors = TIER_COLORS[tc.tier];
                const isCurrent = tc.tier === resolvedTier;
                return <div key={tc.tier} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${isCurrent ? `${tc_colors.bg} ${tc_colors.border}` : "bg-muted/30 border-border"}`}>
                          <span className="text-lg">{tc.emoji}</span>
                          <div className="flex-1">
                            <div className={`text-xs font-bold ${isCurrent ? tc_colors.text : "text-muted-foreground"}`}>
                              {TIER_LOCALES[i18n.language.split("-")[0] || "en"]?.tier?.[tc.tier]?.label || tc.label}
                              {isCurrent && <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-full bg-primary text-white truncate">{i18n.t("auto.z_현재_e7755c", {defaultValue: "Current"})}</span>}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate">{TIER_LOCALES[i18n.language.split("-")[0] || "en"]?.tier?.[tc.tier]?.tagline || tc.tagline}</div>
                          </div>
                          <div className="text-right truncate">
                            <div className={`text-sm font-extrabold ${isCurrent ? tc_colors.text : "text-muted-foreground"}`}>
                              {getLocalizedPrice(tc.krw, i18n.language)}
                            </div>
                            {isPlus && <div className="text-[10px] text-primary font-bold truncate">
                                → {getLocalizedPrice(getJoinFeeAfterDiscount(tc.krw, true), i18n.language)}
                              </div>}
                          </div>
                        </div>;
              })}
                  </div>

                  {/* No-show warning */}
                  <div className="flex gap-2 p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
                    <AlertCircle size={13} className="text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-rose-500/80 leading-relaxed truncate">{i18n.t("auto.z_\uCC38\uC5EC\uBE44\uC6A9_8a392c", "\uCC38\uC5EC\uBE44\uC6A9")}<strong>{i18n.t("auto.z_\uB178\uC1FC\uBC29\uC9C0_00e7a3", "\uB178\uC1FC\uBC29\uC9C0")}</strong>{i18n.t("auto.z_\uB97C\uC704\uD55C\uBCF4_42f050", "\uB97C\uC704\uD55C\uBCF4")}</p>
                  </div>
                </div>

                {/* Sticky CTA */}
                <div className="px-5 py-4 border-t border-border/30 bg-card shrink-0">
                  <motion.button whileTap={{
              scale: 0.97
            }} onClick={() => setStep("select")} className="w-full py-4 rounded-2xl gradient-primary text-white font-extrabold flex items-center justify-center gap-2 shadow-float relative overflow-hidden">
                    <motion.div className="absolute inset-0 bg-white/10" animate={{
                x: ["-100%", "100%"]
              }} transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "linear"
              }} style={{
                skewX: -20
              }} />
                    <span className="relative z-10 flex items-center gap-2 truncate">
                      <Lock size={14} />
                      {i18n.t("auto.z_결제하기_61cb91", {defaultValue: "Make payment: "})}{getLocalizedPrice(discountedKrw, i18n.language)}{hasDiscount && <Tag size={12} />}
                    </span>
                  </motion.button>
                </div>
              </>}

            {/* ── SELECT METHOD ── */}
            {step === "select" && <>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
                  <div className={`flex items-center justify-between p-3.5 rounded-2xl ${colors.bg} border ${colors.border}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{tierCfg.emoji}</span>
                      <span className="text-sm font-bold text-foreground truncate">
                        {TIER_LOCALES[i18n.language.split("-")[0] || "en"]?.tier?.[tierCfg.tier]?.label || tierCfg.label}
                      </span>
                    </div>
                    <div className="text-right">
                      {hasDiscount && <div className="text-xs line-through text-muted-foreground">{getLocalizedPrice(originalKrw, i18n.language)}</div>}
                      <span className={`text-lg font-extrabold ${colors.text}`}>
                        {getLocalizedPrice(discountedKrw, i18n.language)}
                        {hasDiscount && <Crown size={11} className="inline ml-1 text-amber-500" />}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-muted-foreground truncate">{i18n.t("auto.z_\uACB0\uC81C\uC218\uB2E8_4963ee", "\uACB0\uC81C\uC218\uB2E8")}</p>
                  <div className="space-y-2 truncate">
                    {PAYMENT_METHODS.map(m => <button key={m.id} onClick={() => setMethod(m.id)} className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${method === m.id ? m.color + " ring-1 ring-primary/30" : "bg-muted border-border text-muted-foreground"}`}>
                        <span className="text-lg">{m.emoji}</span>
                        <span className="text-sm font-bold flex-1 text-left">{m.label}</span>
                        {method === m.id && <Check size={14} className="text-primary" />}
                      </button>)}
                  </div>
                </div>

                <div className="px-5 py-4 border-t border-border/30 bg-card shrink-0 flex gap-3">
                  <button onClick={() => setStep("info")} className="flex-1 py-3.5 rounded-2xl bg-muted text-foreground font-bold text-sm">{i18n.t("auto.z_\uC774\uC804_cb1dc9", "\uC774\uC804")}</button>
                  <motion.button whileTap={{
              scale: 0.97
            }} onClick={() => setStep("confirm")} className="flex-1 py-3.5 rounded-2xl gradient-primary text-white font-extrabold text-sm flex items-center justify-center gap-1.5">{i18n.t("auto.z_\uD655\uC778_3ce813", "\uD655\uC778")}<ChevronRight size={14} />
                  </motion.button>
                </div>
              </>}

            {/* ── CONFIRM ── */}
            {step === "confirm" && <>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1 min-h-0 truncate">
                  {[[i18n.t("auto.g_0190", "그룹"), groupTitle], [i18n.t("auto.g_0191", "티어"), `${tierCfg.emoji} ${tierCfg.label}`], [i18n.t("auto.g_0192", "결제 수단"), PAYMENT_METHODS.find(m => m.id === method)?.label ?? method], [i18n.t("auto.g_0193", "원래 가격"), getLocalizedPrice(originalKrw, i18n.language)], ...(hasDiscount ? [[i18n.t("auto.g_0194", "Plus 할인 (-50%)"), `- ${getLocalizedPrice(originalKrw - discountedKrw, i18n.language)}`]] : []), [i18n.t("auto.g_0195", "최종 결제금액"), getLocalizedPrice(discountedKrw, i18n.language)]].map(([label, value], i, arr) => <div key={i} className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? "border-b border-border/40" : ""}`}>
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className={i18n.t("auto.t_0009", `text-xs font-bold ${label === i18n.t("auto.g_0196", "최종 결제금액") ? colors.text + " text-base" : "text-foreground"}`)}>{value}</span>
                    </div>)}
                </div>

                <div className="px-5 py-4 border-t border-border/30 bg-card shrink-0 flex gap-3">
                  <button onClick={() => setStep("select")} className="flex-1 py-3.5 rounded-2xl bg-muted text-foreground font-bold text-sm">{i18n.t("auto.z_\uC774\uC804_cb1dc9", "\uC774\uC804")}</button>
                  <motion.button whileTap={{
              scale: 0.97
            }} disabled={loading} onClick={handlePay} className="flex-1 py-3.5 rounded-2xl gradient-primary text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-float disabled:opacity-60">
                    {loading ? <><div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />{i18n.t("auto.z_\uACB0\uC81C\uC911_ce536a", "\uACB0\uC81C\uC911")}</> : <><Check size={14} strokeWidth={3} />{getLocalizedPrice(discountedKrw, i18n.language)}{i18n.t("auto.z_\uACB0\uC81C_a4ba01", "\uACB0\uC81C")}</>}
                  </motion.button>
                </div>
              </>}
          </motion.div>
        </motion.div>}
    </AnimatePresence>;
};
export default PaymentModal;