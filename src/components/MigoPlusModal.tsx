import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Zap, Eye, Filter, Crown, Check, Sparkles, Users, Globe, MessageCircle, Shield, Dna, Clock, MapPin, Heart, Lock } from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";
import { toast } from "@/hooks/use-toast";
import PaymentModal from "@/components/PaymentModal";
import { useAuth } from "@/hooks/useAuth";
interface MigoPlusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

import { getMigoPlusPricing } from "@/lib/pricing";




import { MIGO_PLUS_TRANSLATIONS } from "../i18n/migoPlusLocales";

const MigoPlusModal = ({ isOpen, onClose }: MigoPlusModalProps) => {
  const { isPlus, upgradePlus } = useSubscription();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState("quarterly");
  const [showPayment, setShowPayment] = useState(false);
  const [tab, setTab] = useState<"features" | "compare">("features");

  const lang = i18n.language?.split('-')[0] || 'en';
  const L = MIGO_PLUS_TRANSLATIONS[lang] || MIGO_PLUS_TRANSLATIONS.en;

  const FEATURE_COMPARISON = [
    { icon: Heart, label: L.dailyLikes, free: L.free10, plus: L.unlimited },
    { icon: Star, label: L.superLikes, free: L.free3, plus: L.unlimited },
    { icon: Eye, label: L.whoLikedMe, free: L.hidden, plus: L.allPublic },
    { icon: Zap, label: L.profileBoost, free: "❌", plus: L.onePerMonth },
    { icon: Filter, label: L.advFilter, free: L.basicOnly, plus: L.mbtiEtc },
    { icon: Globe, label: L.globalMatch, free: L.localOnly, plus: L.worldwide },
    { icon: Dna, label: L.travelDNA, free: "❌", plus: L.dnaFull },
    { icon: Clock, label: L.imHere, free: L.standard, plus: L.pinned },
    { icon: MessageCircle, label: L.readReceipt, free: "❌", plus: L.readCheck },
    { icon: MapPin, label: L.hideLocation, free: "❌", plus: L.approxLoc },
    { icon: Shield, label: L.advSafety, free: L.basic, plus: L.emergency },
    { icon: Users, label: L.premiumGroups, free: "❌", plus: L.unlimited },
    { icon: Crown, label: L.plusBadge, free: "❌", plus: L.profileDisplay },
    { icon: Sparkles, label: L.removeAds, free: L.hasAds, plus: L.noAds }
  ];

  const HIGHLIGHT_FEATURES = [
    { emoji: "🧬", title: L.travelDNA, desc: L.dnaDesc, color: "from-violet-600 to-purple-600" },
    { emoji: "🔴", title: L.imHere, desc: L.imHereDesc, color: "from-emerald-500 to-teal-600" },
    { emoji: "👁️", title: L.likedMeTitle, desc: L.likedDesc, color: "from-pink-500 to-rose-600" },
    { emoji: "🌍", title: L.globalMatch, desc: L.globalDesc, color: "from-blue-500 to-cyan-600" }
  ];

  const pricing = getMigoPlusPricing();
  const annualSavePct = Math.round((1 - pricing.month12 / (pricing.month1 * 12)) * 100);
  const quarterlySavePct = Math.round((1 - pricing.month3 / (pricing.month1 * 3)) * 100);

  const PLANS = [{
    id: "monthly", label: L.month1, price: pricing.format(pricing.month1).replace(pricing.currency, ""),
    per: L.perMonth, priceNum: pricing.month1, badge: null, total: null
  }, {
    id: "quarterly", label: L.month3, price: pricing.format(Number((pricing.month3 / 3).toFixed(2))).replace(pricing.currency, ""),
    per: L.perMonth, priceNum: pricing.month3, badge: quarterlySavePct > 0 ? `${quarterlySavePct}% OFF` : L.popular, total: pricing.format(pricing.month3)
  }, {
    id: "yearly", label: L.month12, price: pricing.format(Number((pricing.month12 / 12).toFixed(2))).replace(pricing.currency, ""),
    per: L.perMonth, priceNum: pricing.month12, badge: annualSavePct > 0 ? `${annualSavePct}% OFF` : L.bestValue, total: pricing.format(pricing.month12)
  }];

  const selectedPlanObj = PLANS.find(p => p.id === selectedPlan)!;

  const handleStartPayment = () => {
    if (!user) {
      toast({ title: L.loginNeeded, variant: "destructive" });
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentSuccess = async () => {
    await upgradePlus();
    setShowPayment(false);
    toast({ title: L.plusActive, description: L.plusActiveDesc });
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div className="fixed inset-0 z-[80] flex items-end justify-center px-safe pb-safe pt-safe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-foreground/70 backdrop-blur-md" onClick={onClose} />
            <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 overflow-hidden shadow-float flex flex-col" 
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} 
                        transition={{ type: "spring", damping: 28, stiffness: 300 }} 
                        style={{ maxHeight: "92vh" }}>
              {/* ── 헤더 ── */}
              <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-pink-500 px-6 pt-8 pb-5 text-center shrink-0">
                <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <X size={16} className="text-white" />
                </button>
                <motion.div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-2" 
                            animate={{ rotate: [0, -5, 5, 0] }} 
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                  <Crown size={32} className="text-white" />
                </motion.div>
                <h2 className="text-2xl font-extrabold text-white">Migo Plus</h2>
                <p className="text-white/80 text-sm mt-1">{L.unlimitedCompanions}</p>
                <div className="inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                  <Sparkles size={12} className="text-yellow-300" />
                  <span className="text-white text-xs font-bold">{L.freeTrial}</span>
                </div>
              </div>

              {/* ── 탭 ── */}
              <div className="flex border-b border-border shrink-0">
                {[{ key: "features", label: L.newFeatures }, { key: "compare", label: L.compare }].map(t => (
                  <button key={t.key} onClick={() => setTab(t.key as any)} 
                          className={`flex-1 py-3 text-sm font-bold transition-colors ${tab === t.key ? "text-amber-500 border-b-2 border-amber-500" : "text-muted-foreground"}`}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ── 스크롤 가능한 콘텐츠 ── min-h-0 prevents flex blowout */}
              <div className="overflow-y-auto flex-1 min-h-0">
                {tab === "features" ? (
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {HIGHLIGHT_FEATURES.map((f, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} 
                                  className={`rounded-2xl p-4 bg-gradient-to-br ${f.color} text-white`}>
                        <span className="text-2xl mb-2 block">{f.emoji}</span>
                        <p className="text-xs font-extrabold leading-snug mb-1">{f.title}</p>
                        <p className="text-[10px] text-white/70 leading-tight">{f.desc}</p>
                      </motion.div>
                    ))}

                    <div className="col-span-2 space-y-2 pt-2">
                      {FEATURE_COMPARISON.slice(0, 6).map((f, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                            <f.icon size={14} className="text-amber-500" />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-bold text-foreground">{f.label}</span>
                            <span className="text-xs text-muted-foreground ml-2">→ {f.plus}</span>
                          </div>
                          <Check size={14} className="text-emerald-500 shrink-0" />
                        </div>
                      ))}
                      <p className="text-[10px] text-muted-foreground text-center pt-1">+ {FEATURE_COMPARISON.length - 6}{L.moreFeatures}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="rounded-2xl overflow-hidden border border-border">
                      <div className="grid grid-cols-3 bg-muted">
                        <div className="p-2.5 text-[10px] font-bold text-muted-foreground">{L.featuresTitle}</div>
                        <div className="p-2.5 text-[10px] font-bold text-muted-foreground text-center border-l border-border">{L.freeTitle}</div>
                        <div className="p-2.5 text-[10px] font-extrabold text-amber-500 text-center border-l border-border flex items-center justify-center gap-1">
                          <Crown size={10} />Plus
                        </div>
                      </div>
                      {FEATURE_COMPARISON.map((f, i) => (
                        <div key={i} className={`grid grid-cols-3 border-t border-border ${i % 2 === 0 ? "" : "bg-muted/30"}`}>
                          <div className="p-2.5 flex items-center gap-1.5">
                            <f.icon size={11} className="text-muted-foreground shrink-0" />
                            <span className="text-[10px] text-foreground font-medium leading-tight">{f.label}</span>
                          </div>
                          <div className="p-2.5 text-[10px] text-muted-foreground text-center border-l border-border flex items-center justify-center">
                            {f.free}
                          </div>
                          <div className="p-2.5 text-[10px] font-bold text-amber-500 text-center border-l border-border flex items-center justify-center">
                            {f.plus}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── 플랜 선택 ── */}
              <div className="px-4 py-3 flex gap-2 shrink-0 border-t border-border bg-card">
                {PLANS.map(p => (
                  <button key={p.id} onClick={() => setSelectedPlan(p.id)} 
                          className={`flex-1 relative rounded-2xl border-2 p-2.5 text-center transition-all ${selectedPlan === p.id ? "border-amber-500 bg-amber-500/10" : "border-border"}`}>
                    {p.badge && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                        {p.badge}
                      </span>
                    )}
                    <p className="text-[10px] text-muted-foreground font-medium">{p.label}</p>
                    <p className="flex justify-center items-baseline mt-0.5">
                      <span className="text-base font-extrabold text-foreground">{pricing.currency}{p.price.split('.')[0]}</span>
                      {p.price.includes('.') && <span className="text-[9px] font-bold text-muted-foreground/80 ml-0.5">.{p.price.split('.')[1]}</span>}
                    </p>
                    <p className="text-[9px] text-muted-foreground">/{p.per}</p>
                    {p.total && (
                      <p className="flex justify-center items-baseline text-[9px] text-amber-500 font-semibold mt-0.5">
                        {L.total}{p.total.split('.')[0]}
                        {p.total.includes('.') && <span className="text-[7px] ml-[1px]">.{p.total.split('.')[1]}</span>}
                      </p>
                    )}
                  </button>
                ))}
              </div>

              {/* ── CTA ── */}
              <div className="px-4 pb-8 shrink-0 bg-card">
                {isPlus ? (
                  <div className="w-full py-4 rounded-2xl bg-emerald-500/10 text-center">
                    <p className="text-emerald-500 font-bold flex items-center justify-center gap-2">
                      <Crown size={16} />{L.currentlyPlus}
                    </p>
                  </div>
                ) : (
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleStartPayment} 
                                 className="w-full py-4 rounded-2xl text-white font-extrabold text-base shadow-lg flex items-center justify-center gap-2" 
                                 style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)", boxShadow: "0 8px 24px rgba(245,158,11,0.4)" }}>
                    <Crown size={18} />{L.try7Days}{selectedPlanObj.label}{L.start}
                  </motion.button>
                )}
                <p className="text-center text-[10px] text-muted-foreground mt-2">{L.cancelAnytime}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 결제 모달 */}
      <PaymentModal isOpen={showPayment} onClose={() => setShowPayment(false)} groupTitle={`Migo Plus (${selectedPlanObj.label})`} groupId="plus_subscription" entryFee={selectedPlanObj.priceNum} onPaymentSuccess={handlePaymentSuccess} />
    </>
  );
};
export default MigoPlusModal;