import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Star, Zap, Shield, Crown, Heart, MapPin, Gift, CheckCircle2, Sparkles, Package, ChevronRight, X } from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";
import { getLocalizedPrice, getShopItemPricing, getMigoPlusPricing } from "@/lib/pricing";
import { toast } from "@/hooks/use-toast";

// ─── Types ───────────────────────────────────────────────────────────
interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  features: string[];
}
interface ShopItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  icon: React.ReactNode;
  color: string;
  quantity?: string;
  popular?: boolean;
}


// ─── Purchase Confirm Modal ───────────────────────────────────────────
import i18n from "@/i18n";
const PurchaseModal = ({
  item,
  onClose,
  onConfirm
}: {
  item: ShopItem | Plan | null;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  const {
    t
  } = useTranslation();
  if (!item) return null;
  const name = item.name;
  const isPlan = 'period' in item;
  const formattedPrice = item.price === 0 ? getLocalizedPrice(0, i18n.language) : (isPlan ? getMigoPlusPricing().format(item.price) : getShopItemPricing().format(item.price));
  return <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} exit={{
    opacity: 0
  }} onClick={onClose}>
      <motion.div className="w-full max-w-lg bg-card rounded-3xl mb-4 sm:mb-8 p-6 pb-safe-bottom" initial={{
      y: "100%"
    }} animate={{
      y: 0
    }} exit={{
      y: "100%"
    }} transition={{
      type: "spring",
      damping: 25
    }} onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-5" />
        <h3 className="text-xl font-extrabold text-center mb-1">{name}</h3>
        <p className="text-3xl font-black text-primary text-center mb-6">{formattedPrice}</p>
        <p className="text-sm text-muted-foreground text-center mb-8">{t("auto.z_\uC774\uAD6C\uB9E4\uB294\uD14C\uC2A4\uD2B8\uC6A9\uC774\uBA70_77")}<br />{t("auto.z_\uC2E4\uC11C\uBE44\uC2A4\uCD9C\uC2DC\uC2DC\uACB0\uC81C\uC5F0_78")}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl border border-border text-muted-foreground font-bold text-sm">{t("auto.z_\uCDE8\uC18C_79")}</button>
          <button onClick={onConfirm} className="flex-1 py-4 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-sm shadow-float">{t("auto.z_\uAD6C\uB9E4\uD558\uAE30_80")}</button>
        </div>
      </motion.div>
    </motion.div>;
};

// ─── Main Page ────────────────────────────────────────────────────────
const ShopPage = () => {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const {
    isPlus,
    isPremium,
    upgradePlus,
    addBoosts
  } = useSubscription();
  const [tab, setTab] = useState<"plans" | "items">("plans");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  // ── Dynamic Pricing ──────────────────────────────────────────────────
  const subPricing = getMigoPlusPricing();
  const itemPricing = getShopItemPricing();

  const PLANS: Plan[] = [{
    id: "free",
    name: "Free",
    price: 0,
    period: i18n.language.startsWith('ko') ? "영구 무료" : "Free Forever",
    icon: <Heart size={22} className="text-muted-foreground" />,
    color: "border-border",
    gradient: "from-muted/40 to-muted/20",
    features: [i18n.t("auto.z_\uB9E4\uC77C\uC88B\uC544\uC69410\uD68C_34"), i18n.t("auto.z_\uAE30\uBCF8\uD504\uB85C\uD544\uC870\uD68C_35"), i18n.t("auto.z_\uC5EC\uD589DNA\uAD81\uD569\uD655\uC778_36"), i18n.t("auto.z_\uADF8\uB8F9\uD2B8\uB9BD\uD0D0\uC0C9_37")]
  }, {
    id: "plus",
    name: "MIGO Plus",
    price: subPricing.month1,
    period: i18n.language.startsWith('ko') ? "1개월" : "1 month",
    badge: i18n.t("auto.z_\uC778\uAE30_39"),
    badgeColor: "bg-primary text-primary-foreground",
    icon: <Star size={22} className="text-yellow-400 fill-yellow-400" />,
    color: "border-primary",
    gradient: "from-primary/20 to-primary/5",
    features: [i18n.t("auto.z_\uBB34\uC81C\uD55C\uC88B\uC544\uC694_40"), i18n.t("auto.z_\uC288\uD37C\uB77C\uC774\uD06C5\uD68C\uC6D4_41"), i18n.t("auto.z_\uBD80\uC2A4\uD2B81\uD68C\uC6D4_42"), i18n.t("auto.z_\uB098\uB97C\uC88B\uC544\uC694\uD55C\uC0AC\uB78C\uBCF4\uAE30_43"), i18n.t("auto.z_\uC804\uC138\uACC4\uD544\uD130_44"), i18n.t("auto.z_\uAD11\uACE0\uC5C6\uC74C_45")]
  }, {
    id: "premium",
    name: "MIGO Premium",
    price: subPricing.month12,
    period: i18n.language.startsWith('ko') ? "12개월" : "12 months",
    badge: i18n.t("auto.z_\uCD5C\uACE0\uD61C\uD0DD_47"),
    badgeColor: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
    icon: <Crown size={22} className="text-amber-400 fill-amber-400" />,
    color: "border-amber-400",
    gradient: "from-amber-500/20 to-orange-500/10",
    features: [i18n.t("auto.z_Plus\uBAA8\uB4E0\uD61C\uD0DD\uD3EC\uD568_48"), i18n.t("auto.z_\uC288\uD37C\uB77C\uC774\uD06C\uBB34\uC81C\uD55C_49"), i18n.t("auto.z_\uBD80\uC2A4\uD2B85\uD68C\uC6D4_50"), i18n.t("auto.z_\uC5EC\uAD8C\uC778\uC99D\uC790\uB3D9\uCC98\uB9AC\uC6B0\uC120_51"), i18n.t("auto.z_AI\uC5EC\uD589\uC77C\uC815\uC0DD\uC131\uBB34\uC81C_52"), i18n.t("auto.z_\uB3D9\uD589\uC644\uB8CC\uB9AC\uBDF0\uBC43\uC9C0\uAC15\uC870_53"), i18n.t("auto.z_\uD504\uB9AC\uBBF8\uC5C4\uD504\uB85C\uD544\uD14C\uB9C8_54"), i18n.t("auto.z_\uC804\uB2F4\uACE0\uAC1D\uC9C0\uC6D0_55")]
  }];

  const ITEMS: ShopItem[] = [{
    id: "superlike_5",
    name: i18n.t("auto.z_\uC288\uD37C\uB77C\uC774\uD06C5\uAC1C_56"),
    desc: i18n.t("auto.z_\uC0C1\uB300\uC5D0\uAC8C\uD2B9\uBCC4\uC54C\uB9BC\uACFC\uD568_57"),
    price: (itemPricing as any).superlike_5,
    quantity: i18n.t("auto.z_5\uAC1C_58"),
    icon: <Star size={24} className="text-blue-400 fill-blue-400" />,
    color: "bg-blue-500/10 border-blue-400/30",
    popular: true
  }, {
    id: "superlike_15",
    name: i18n.t("auto.z_\uC288\uD37C\uB77C\uC774\uD06C15\uAC1C_59"),
    desc: i18n.t("auto.z_\uB354\uB9CE\uC740\uD2B9\uBCC4\uC5F0\uACB0\uAE30\uD68C_60"),
    price: (itemPricing as any).superlike_15,
    quantity: i18n.t("auto.z_15\uAC1C_61"),
    icon: <Star size={24} className="text-blue-500 fill-blue-500" />,
    color: "bg-blue-500/10 border-blue-400/30"
  }, {
    id: "boost_1",
    name: i18n.t("auto.z_\uBD80\uC2A4\uD2B81\uD68C_62"),
    desc: i18n.t("auto.z_30\uBD84\uAC04\uB0B4\uD504\uB85C\uD544\uCD5C\uC0C1_63"),
    price: (itemPricing as any).boost_1,
    quantity: i18n.t("auto.z_30\uBD84_64"),
    icon: <Zap size={24} className="text-purple-400 fill-purple-400" />,
    color: "bg-purple-500/10 border-purple-400/30",
    popular: true
  }, {
    id: "boost_5",
    name: i18n.t("auto.z_\uBD80\uC2A4\uD2B85\uD68C_65"),
    desc: i18n.t("auto.z_\uCD5C\uACE0\uC758\uB178\uCD9C\uD6A8\uACFC\uB97C\uACBD\uD5D8_66"),
    price: (itemPricing as any).boost_5,
    quantity: i18n.t("auto.z_5\uD68C_67"),
    icon: <Zap size={24} className="text-purple-500 fill-purple-500" />,
    color: "bg-purple-500/10 border-purple-400/30"
  }, {
    id: "verified_badge",
    name: i18n.t("auto.z_\uC5EC\uD589\uC790\uC778\uC99D\uBC43\uC9C0_68"),
    desc: i18n.t("auto.z_\uC2E0\uB8B0\uB3C4UP\uB208\uC5D0\uB744\uB294\uC778_69"),
    price: (itemPricing as any).verified_badge,
    icon: <Shield size={24} className="text-emerald-400" />,
    color: "bg-emerald-500/10 border-emerald-400/30"
  }, {
    id: "profile_theme",
    name: i18n.t("auto.z_\uD504\uB9AC\uBBF8\uC5C4\uD504\uB85C\uD544\uD14C\uB9C8_70"),
    desc: i18n.t("auto.z_\uD2B9\uBCC4\uD55C\uD504\uB85C\uD544\uBC30\uACBD\uC73C\uB85C_71"),
    price: (itemPricing as any).profile_theme,
    icon: <Sparkles size={24} className="text-pink-400" />,
    color: "bg-pink-500/10 border-pink-400/30"
  }, {
    id: "travel_pack",
    name: i18n.t("auto.z_\uC5EC\uD589\uC790\uC2A4\uD0C0\uD130\uD329_72"),
    desc: i18n.t("auto.z_\uC288\uD37C\uB77C\uC774\uD06C10\uAC1C\uBD80\uC2A4_73"),
    price: (itemPricing as any).travel_pack,
    icon: <Gift size={24} className="text-rose-400" />,
    color: "bg-rose-500/10 border-rose-400/30",
    popular: true
  }, {
    id: "nearby_unlock",
    name: i18n.t("auto.z_\uADFC\uCC98\uC5EC\uD589\uC790\uBCF4\uAE307\uC77C_74"),
    desc: i18n.t("auto.z_\uC9C0\uAE08\uAC19\uC740\uB3C4\uC2DC\uC5D0\uC788\uB294\uC5EC_75"),
    price: (itemPricing as any).nearby_unlock,
    quantity: i18n.t("auto.z_7\uC77C_76"),
    icon: <MapPin size={24} className="text-orange-400" />,
    color: "bg-orange-500/10 border-orange-400/30"
  }];
  const handlePurchase = () => {
    const name = selectedPlan?.name ?? selectedItem?.name ?? "";
    setPurchaseSuccess(name);
    if (selectedPlan?.id === "plus") {
      upgradePlus("plus");
    } else if (selectedPlan?.id === "premium") {
      upgradePlus("premium");
    } else if (selectedItem?.id === "boost_1") {
      addBoosts(1);
    } else if (selectedItem?.id === "boost_5") {
      addBoosts(5);
    }
    setSelectedPlan(null);
    setSelectedItem(null);
    toast({
      title: `✅ ${name} 구매 완료!`,
      description: i18n.t("auto.z_\uC2E4\uC81C\uACC4\uC815\uC774\uC5C5\uADF8\uB808\uC774\uB4DC_82")
    });
    setTimeout(() => setPurchaseSuccess(null), 3000);
  };
  return <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg font-extrabold leading-tight">MIGO Shop</h1>
          <p className="text-xs text-muted-foreground">{t("auto.z_\uAD6C\uB3C5\uD50C\uB79C\uC544\uC774\uD15C\uAD6C\uB9E4_83")}</p>
        </div>
        <div className="ml-auto">
          <Package size={24} className="text-primary" />
        </div>
      </header>

      {/* Hero Banner */}
      <div className="mx-4 mt-4 rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-blue-600 p-6 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-tr-full" />
        <p className="text-xs font-extrabold text-white/70 uppercase tracking-widest mb-1">{t("auto.z_\uC5EC\uD589\uB3D9\uD589\uC758\uD488\uACA9_84")}</p>
        <h2 className="text-2xl font-black text-white leading-tight mb-2">{t("auto.z_\uB354\uB9CE\uC740\uC5F0\uACB0_85")}<br />{t("auto.z_\uB354\uB098\uC740\uC5EC\uD589_86")}</h2>
        <p className="text-sm text-white/80">{t("auto.z_\uD504\uB9AC\uBBF8\uC5C4\uC73C\uB85C\uC5C5\uADF8\uB808\uC774_87")}<br />{t("auto.z_\uCD5C\uACE0\uC758\uC5EC\uD589\uD30C\uD2B8\uB108\uB97C\uB9CC_88")}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mx-4 mt-5 p-1 bg-muted rounded-2xl">
        {(["plans", "items"] as const).map(t => <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold transition-all ${tab === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}>
            {t === "plans" ? i18n.t("auto.z_\uAD6C\uB3C5\uD50C\uB79C_89") : i18n.t("auto.z_\uC544\uC774\uD15C\uAD6C\uB9E4_90")}
          </button>)}
      </div>

      {/* Content */}
      <div className="px-4 mt-5 flex flex-col gap-4">
        <AnimatePresence mode="wait">
          {tab === "plans" ? <motion.div key="plans" initial={{
          opacity: 0,
          x: -20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: 20
        }} className="flex flex-col gap-4">
              {PLANS.map(plan => {
            let currentStatus = "";
            if (plan.id === "plus" && isPlus && !isPremium) currentStatus = i18n.t("auto.z_\uD604\uC7AC\uC774\uC6A9\uC911\uC778\uD50C\uB79C_91");
            if (plan.id === "premium" && isPremium) currentStatus = i18n.t("auto.z_\uD604\uC7AC\uC774\uC6A9\uC911\uC778\uD50C\uB79C_92");
            return <motion.div key={plan.id} whileTap={{
              scale: 0.98
            }} onClick={() => {
              if (plan.id === "free") return;
              if (plan.id === "plus" && isPlus) return;
              if (plan.id === "premium" && isPremium) return;
              setSelectedPlan(plan);
            }} className={`relative rounded-3xl border-2 bg-gradient-to-br ${plan.gradient} ${currentStatus ? "border-emerald-500/50" : plan.color} p-5 overflow-hidden cursor-pointer`}>
                  {plan.badge && !currentStatus && <span className={`absolute top-4 right-4 text-[10px] font-black px-2.5 py-1 rounded-full ${plan.badgeColor}`}>
                      {plan.badge}
                    </span>}
                  {currentStatus && <span className="absolute top-4 right-4 text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                      {currentStatus}
                    </span>}
                  <div className="flex items-center gap-3 mb-4 mt-2">
                    <div className="w-10 h-10 rounded-2xl bg-background/50 backdrop-blur flex items-center justify-center">
                      {plan.icon}
                    </div>
                    <div>
                      <p className="font-extrabold text-foreground text-base">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">{plan.period}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-2xl font-black text-foreground">{plan.price === 0 ? getLocalizedPrice(0, i18n.language) : subPricing.format(plan.price)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 relative z-10">
                    {plan.features.map((f, i) => <div key={i} className="flex items-center gap-2 text-sm text-foreground/80 font-medium">
                        <CheckCircle2 size={15} className={plan.id === "premium" ? "text-amber-500 shrink-0" : "text-emerald-500 shrink-0"} />
                        {f}
                      </div>)}
                  </div>
                  {plan.id !== "free" && !currentStatus && <div className={`mt-5 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-extrabold shadow-sm transition-all ${plan.id === "premium" ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-orange-500/20" : "bg-primary text-primary-foreground shadow-primary/20"}`}>
                      {plan.id === "plus" ? i18n.t("auto.z_Plus\uB85C\uC5C5\uADF8\uB808\uC774\uB4DC_93") : i18n.t("auto.z_Premium\uC73C\uB85C\uC5C5_94")}
                      <ChevronRight size={16} />
                    </div>}
                  {currentStatus && <div className="mt-5 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-muted/50 text-muted-foreground text-sm font-bold">
                      <CheckCircle2 size={16} className="text-emerald-500" />{i18n.t("auto.z_\uAD6C\uB3C5\uC911_95")}</div>}
                </motion.div>;
          })}
            </motion.div> : <motion.div key="items" initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} className="grid grid-cols-2 gap-3">
              {ITEMS.map(item => <motion.div key={item.id} whileTap={{
            scale: 0.95
          }} onClick={() => setSelectedItem(item)} className={`relative rounded-2xl border bg-card ${item.color} p-4 flex flex-col gap-2 cursor-pointer`}>
                  {item.popular && <span className="absolute top-3 right-3 text-[9px] font-black bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">{i18n.t("auto.z_\uC778\uAE30_96")}</span>}
                  <div className="w-10 h-10 rounded-xl bg-background/60 flex items-center justify-center mb-1">
                    {item.icon}
                  </div>
                  <p className="font-extrabold text-foreground text-sm leading-tight">{item.name}</p>
                  {item.quantity && <span className="text-[10px] text-muted-foreground font-bold">{item.quantity}</span>}
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.desc}</p>
                  <p className="text-base font-black text-primary mt-auto">{itemPricing.format(item.price)}</p>
                </motion.div>)}
            </motion.div>}
        </AnimatePresence>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {purchaseSuccess && <motion.div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold text-sm" initial={{
        opacity: 0,
        y: -30
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: -30
      }}>
            <CheckCircle2 size={16} /> {purchaseSuccess}{t("auto.z_\uAD6C\uB9E4\uC644\uB8CC_97")}</motion.div>}
      </AnimatePresence>

      {/* Purchase Modal */}
      <AnimatePresence>
        {(selectedPlan || selectedItem) && <PurchaseModal item={selectedPlan ?? selectedItem} onClose={() => {
        setSelectedPlan(null);
        setSelectedItem(null);
      }} onConfirm={handlePurchase} />}
      </AnimatePresence>
    </div>;
};
export default ShopPage;