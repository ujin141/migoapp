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

// 기능 비교 테이블 데이터
const FEATURE_COMPARISON = [{
  icon: Heart,
  label: i18n.t("auto.z_autoz\uD558\uB8E8\uB77C\uC774\uD06C_1315"),
  free: i18n.t("auto.z_autoz10\uAC1C14_1316"),
  plus: i18n.t("auto.z_autoz\uBB34\uC81C\uD55C14_1317")
}, {
  icon: Star,
  label: i18n.t("auto.z_autoz\uC288\uD37C\uB77C\uC774\uD06C_1318"),
  free: i18n.t("auto.z_autoz3\uD68C\uC8FC14_1319"),
  plus: i18n.t("auto.z_autoz\uBB34\uC81C\uD55C14_1320")
}, {
  icon: Eye,
  label: i18n.t("auto.z_autoz\uB098\uB97C\uC88B\uC544\uD55C_1321"),
  free: i18n.t("auto.z_autoz\uC228\uAE40145_1322"),
  plus: i18n.t("auto.z_autoz\uC804\uCCB4\uACF5\uAC1C1_1323")
}, {
  icon: Zap,
  label: i18n.t("auto.z_autoz\uD504\uB85C\uD544\uBD80\uC2A4_1324"),
  free: "❌",
  plus: i18n.t("auto.z_autoz1\uD68C\uC6D4\uC81C\uACF5_1325")
}, {
  icon: Filter,
  label: i18n.t("auto.z_autoz\uC0C1\uC138\uD544\uD1301_1326"),
  free: i18n.t("auto.z_autoz\uAE30\uBCF8\uB9CC14_1327"),
  plus: i18n.t("auto.z_autozMBTI\uC608_1328")
}, {
  icon: Globe,
  label: i18n.t("auto.z_autoz\uAE00\uB85C\uBC8C\uB9E4\uCE6D_1329"),
  free: i18n.t("auto.z_autoz\uD604\uC9C0\uB9CC14_1330"),
  plus: i18n.t("auto.z_autoz\uC804\uC138\uACC4\uC5EC\uD589_1331")
}, {
  icon: Dna,
  label: i18n.t("auto.z_autoz\uC5EC\uD589DNA_1332"),
  free: "❌",
  plus: i18n.t("auto.z_autoz5\uCC28\uC6D0\uD480\uBD84_1333")
}, {
  icon: Clock,
  label: i18n.t("auto.z_autoz\uC9C0\uAE08\uC5EC\uAE30\uC788_1334"),
  free: i18n.t("auto.z_autoz\uC77C\uBC18\uB178\uCD9C1_1335"),
  plus: i18n.t("auto.z_autoz\uCD5C\uC0C1\uB2E8\uACE0\uC815_1336")
}, {
  icon: MessageCircle,
  label: i18n.t("auto.z_autoz\uCC44\uD305\uC77D\uC74C\uD655_1337"),
  free: "❌",
  plus: i18n.t("auto.z_autoz\uC77D\uC74C\uCCB4\uD06C1_1338")
}, {
  icon: MapPin,
  label: i18n.t("auto.z_autoz\uC704\uCE58\uC228\uAE30\uAE30_1339"),
  free: "❌",
  plus: i18n.t("auto.z_autoz\uB300\uB7B5\uC704\uCE58\uB9CC_1340")
}, {
  icon: Shield,
  label: i18n.t("auto.z_autoz\uACE0\uAE09\uC548\uC804\uCCB4_1341"),
  free: i18n.t("auto.z_autoz\uAE30\uBCF8147_1342"),
  plus: i18n.t("auto.z_autoz\uBE44\uC0C1\uC5F0\uB77D\uCC98_1343")
}, {
  icon: Users,
  label: i18n.t("auto.z_autoz\uD504\uB9AC\uBBF8\uC5C4\uADF8_1344"),
  free: "❌",
  plus: i18n.t("auto.z_autoz\uBB34\uC81C\uD55C14_1345")
}, {
  icon: Crown,
  label: i18n.t("auto.z_autozPlus\uBC43_1346"),
  free: "❌",
  plus: i18n.t("auto.z_autoz\uD504\uB85C\uD544\uD45C\uC2DC_1347")
}, {
  icon: Sparkles,
  label: i18n.t("auto.z_autoz\uAD11\uACE0\uC81C\uAC701_1348"),
  free: i18n.t("auto.z_autoz\uAD11\uACE0\uC788\uC74C1_1349"),
  plus: i18n.t("auto.z_autoz\uAD11\uACE0\uC5C6\uC74C1_1350")
}];

// 하이라이트 기능 (탭 상단 카드)
const HIGHLIGHT_FEATURES = [{
  emoji: "🧬",
  title: i18n.t("auto.z_autoz\uC5EC\uD589DNA_1351"),
  desc: i18n.t("auto.z_autoz5\uCC28\uC6D0\uC131\uD5A5_1352"),
  color: "from-violet-600 to-purple-600"
}, {
  emoji: "🔴",
  title: i18n.t("auto.z_autoz\uC9C0\uAE08\uC5EC\uAE30\uC788_1334"),
  desc: i18n.t("auto.z_autoz\uC9C0\uAE08\uC5EC\uAE30\uC788_1353"),
  color: "from-emerald-500 to-teal-600"
}, {
  emoji: "👁️",
  title: i18n.t("auto.z_autoz\uB0B4\uAC00\uC88B\uC544\uC694_1354"),
  desc: i18n.t("auto.z_autoz\uBA3C\uC800\uB77C\uC774\uD06C_1355"),
  color: "from-pink-500 to-rose-600"
}, {
  emoji: "🌍",
  title: i18n.t("auto.z_autoz\uAE00\uB85C\uBC8C\uB9E4\uCE6D_1356"),
  desc: i18n.t("auto.z_autoz\uC804\uC138\uACC4\uC5B4\uB514_1357"),
  color: "from-blue-500 to-cyan-600"
}];
const MigoPlusModal = ({
  isOpen,
  onClose
}: MigoPlusModalProps) => {
  const {
    t
  } = useTranslation();
  const {
    isPlus,
    upgradePlus
  } = useSubscription();
  const {
    user
  } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState("quarterly");
  const [showPayment, setShowPayment] = useState(false);
  const [tab, setTab] = useState<"features" | "compare">("features");
  
  const pricing = getMigoPlusPricing();
  const annualSavePct = Math.round((1 - pricing.month12 / (pricing.month1 * 12)) * 100);
  const quarterlySavePct = Math.round((1 - pricing.month3 / (pricing.month1 * 3)) * 100);
  const PLANS = [{
    id: "monthly",
    label: t("auto.z_autoz1\uAC1C\uC6D414_1307"),
    price: pricing.format(pricing.month1).replace(pricing.currency, ""),
    per: t("auto.z_autoz\uC6D41440_1308"),
    priceNum: pricing.month1,
    badge: null,
    total: null
  }, {
    id: "quarterly",
    label: t("auto.z_autoz3\uAC1C\uC6D414_1309"),
    price: pricing.format(Number((pricing.month3 / 3).toFixed(2))).replace(pricing.currency, ""),
    per: t("auto.z_autoz\uC6D41442_1310"),
    priceNum: pricing.month3,
    badge: quarterlySavePct > 0 ? `${quarterlySavePct}% OFF` : t("auto.z_autoz\uC778\uAE30144_1311"),
    total: pricing.format(pricing.month3)
  }, {
    id: "yearly",
    label: t("auto.z_autoz12\uAC1C\uC6D41_1312"),
    price: pricing.format(Number((pricing.month12 / 12).toFixed(2))).replace(pricing.currency, ""),
    per: t("auto.z_autoz\uC6D41445_1313"),
    priceNum: pricing.month12,
    badge: annualSavePct > 0 ? `${annualSavePct}% OFF` : t("auto.z_autoz55\uD560\uC7781_1314"),
    total: pricing.format(pricing.month12)
  }];

  const selectedPlanObj = PLANS.find(p => p.id === selectedPlan)!;
  const handleStartPayment = () => {
    if (!user) {
      toast({
        title: i18n.t("auto.z_autoz\uB85C\uADF8\uC778\uC774\uD544_1358"),
        variant: "destructive"
      });
      return;
    }
    setShowPayment(true);
  };
  const handlePaymentSuccess = async () => {
    await upgradePlus();
    setShowPayment(false);
    toast({
      title: i18n.t("auto.z_MigoPlus활성_1491"),
      description: i18n.t("auto.z_autoz\uBAA8\uB4E0\uD504\uB9AC\uBBF8_1360")
    });
    onClose();
  };
  return <>
      <AnimatePresence>
        {isOpen && <motion.div className="fixed inset-0 z-[80] flex items-end" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }}>
            <div className="absolute inset-0 bg-foreground/70 backdrop-blur-md" onClick={onClose} />
            <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-t-3xl overflow-hidden shadow-float" initial={{
          y: "100%"
        }} animate={{
          y: 0
        }} exit={{
          y: "100%"
        }} transition={{
          type: "spring",
          damping: 28,
          stiffness: 300
        }} style={{
          maxHeight: "92vh"
        }}>
              {/* ── 헤더 ── */}
              <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-pink-500 px-6 pt-8 pb-5 text-center shrink-0">
                <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <X size={16} className="text-white" />
                </button>
                <motion.div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-2" animate={{
              rotate: [0, -5, 5, 0]
            }} transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}>
                  <Crown size={32} className="text-white" />
                </motion.div>
                <h2 className="text-2xl font-extrabold text-white">Migo Plus</h2>
                <p className="text-white/80 text-sm mt-1">{t("auto.z_autoz\uC5EC\uD589\uB3D9\uD589\uC758_1361")}</p>
                <div className="inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                  <Sparkles size={12} className="text-yellow-300" />
                  <span className="text-white text-xs font-bold">{t("auto.z_autoz7\uC77C\uBB34\uB8CC\uCCB4_1362")}</span>
                </div>
              </div>

              {/* ── 탭 ── */}
              <div className="flex border-b border-border shrink-0">
                {[{
              key: "features",
              label: t("auto.z_autoz\uC0C8\uAE30\uB2A514_1363")
            }, {
              key: "compare",
              label: t("auto.z_autoz\uBB34\uB8CCvsP_1364")
            }].map(t => <button key={t.key} onClick={() => setTab(t.key as any)} className={`flex-1 py-3 text-sm font-bold transition-colors ${tab === t.key ? "text-amber-500 border-b-2 border-amber-500" : "text-muted-foreground"}`}>
                    {t.label}
                  </button>)}
              </div>

              {/* ── 스크롤 가능한 콘텐츠 ── */}
              <div className="overflow-y-auto" style={{
            maxHeight: "40vh"
          }}>
                {tab === "features" ? (/* 하이라이트 기능 카드 4개 */
            <div className="p-4 grid grid-cols-2 gap-3">
                    {HIGHLIGHT_FEATURES.map((f, i) => <motion.div key={i} initial={{
                opacity: 0,
                y: 12
              }} animate={{
                opacity: 1,
                y: 0
              }} transition={{
                delay: i * 0.07
              }} className={`rounded-2xl p-4 bg-gradient-to-br ${f.color} text-white`}>
                        <span className="text-2xl mb-2 block">{f.emoji}</span>
                        <p className="text-xs font-extrabold leading-snug mb-1">{f.title}</p>
                        <p className="text-[10px] text-white/70 leading-tight">{f.desc}</p>
                      </motion.div>)}

                    {/* 전체 기능 요약 리스트 */}
                    <div className="col-span-2 space-y-2 pt-2">
                      {FEATURE_COMPARISON.slice(0, 6).map((f, i) => <div key={i} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                            <f.icon size={14} className="text-amber-500" />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-bold text-foreground">{f.label}</span>
                            <span className="text-xs text-muted-foreground ml-2">→ {f.plus}</span>
                          </div>
                          <Check size={14} className="text-emerald-500 shrink-0" />
                        </div>)}
                      <p className="text-[10px] text-muted-foreground text-center pt-1">+ {FEATURE_COMPARISON.length - 6}{t("auto.z_autoz\uAC1C\uB354\uBB34\uB8CCv_1365")}</p>
                    </div>
                  </div>) : (/* 비교 테이블 */
            <div className="p-4">
                    <div className="rounded-2xl overflow-hidden border border-border">
                      {/* 헤더 */}
                      <div className="grid grid-cols-3 bg-muted">
                        <div className="p-2.5 text-[10px] font-bold text-muted-foreground">{t("auto.z_autoz\uAE30\uB2A5149_1366")}</div>
                        <div className="p-2.5 text-[10px] font-bold text-muted-foreground text-center border-l border-border">{t("auto.z_autoz\uBB34\uB8CC149_1367")}</div>
                        <div className="p-2.5 text-[10px] font-extrabold text-amber-500 text-center border-l border-border flex items-center justify-center gap-1">
                          <Crown size={10} />Plus
                        </div>
                      </div>
                      {/* 행 */}
                      {FEATURE_COMPARISON.map((f, i) => <div key={i} className={`grid grid-cols-3 border-t border-border ${i % 2 === 0 ? "" : "bg-muted/30"}`}>
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
                        </div>)}
                    </div>
                  </div>)}
              </div>

              {/* ── 플랜 선택 ── */}
              <div className="px-4 py-3 flex gap-2 shrink-0 border-t border-border">
                {PLANS.map(p => <button key={p.id} onClick={() => setSelectedPlan(p.id)} className={`flex-1 relative rounded-2xl border-2 p-2.5 text-center transition-all ${selectedPlan === p.id ? "border-amber-500 bg-amber-500/10" : "border-border"}`}>
                    {p.badge && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                        {p.badge}
                      </span>}
                    <p className="text-[10px] text-muted-foreground font-medium">{p.label}</p>
                    <p className="text-base font-extrabold text-foreground mt-0.5">{pricing.currency}{p.price}</p>
                    <p className="text-[9px] text-muted-foreground">/{p.per}</p>
                    {p.total && <p className="text-[9px] text-amber-500 font-semibold mt-0.5">{i18n.t("auto.z_autoz\uCD1D1500_1368")}{p.total}</p>}
                  </button>)}
              </div>

              {/* ── CTA ── */}
              <div className="px-4 pb-10 shrink-0">
                {isPlus ? <div className="w-full py-4 rounded-2xl bg-emerald-500/10 text-center">
                    <p className="text-emerald-500 font-bold flex items-center justify-center gap-2">
                      <Crown size={16} />{t("auto.z_autoz\uD604\uC7ACPlu_1369")}</p>
                  </div> : <motion.button whileTap={{
              scale: 0.97
            }} onClick={handleStartPayment} className="w-full py-4 rounded-2xl text-white font-extrabold text-base shadow-lg flex items-center justify-center gap-2" style={{
              background: "linear-gradient(135deg, #f59e0b, #ef4444)",
              boxShadow: "0 8px 24px rgba(245,158,11,0.4)"
            }}>
                    <Crown size={18} />{t("auto.z_autoz7\uC77C\uBB34\uB8CC\uD6C4_1370")}{selectedPlanObj.label}{t("auto.z_autoz\uC2DC\uC791150_1371")}</motion.button>}
                <p className="text-center text-[10px] text-muted-foreground mt-2">{t("auto.z_autoz\uC5B8\uC81C\uB4E0\uC9C0\uCDE8_1372")}</p>
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      {/* 결제 모달 */}
      <PaymentModal isOpen={showPayment} onClose={() => setShowPayment(false)} groupTitle={`Migo Plus (${selectedPlanObj.label})`} groupId="plus_subscription" entryFee={selectedPlanObj.priceNum} onPaymentSuccess={handlePaymentSuccess} />
    </>;
};
export default MigoPlusModal;