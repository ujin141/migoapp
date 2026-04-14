
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Star, Zap, Shield, Crown, Heart, MapPin, Gift, CheckCircle2, Sparkles, Package, ChevronRight, X } from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";
import { getLocalizedPrice, getShopItemPricing, getMigoPlusPricing } from "@/lib/pricing";
import { toast } from "@/hooks/use-toast";
import { isNativeIOS, PLUS_BILLING_CYCLE_MAP, IAP_PRODUCT_IDS } from "@/lib/iapService";

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




// ─── Main Page ────────────────────────────────────────────────────────
import i18n from "@/i18n";

const ShopPage = () => {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const {
    isPlus,
    isPremium,
    upgradePlus,
    addBoosts,
    addSuperLikes,
    purchaseVerifiedBadge,
    purchaseProfileTheme,
    purchaseNearbyUnlock,
    purchaseTravelPack,
    purchaseSubscriptionIAP,
    purchaseItemIAP,
    restorePurchasesIAP,
  } = useSubscription();
  const [tab, setTab] = useState<"plans" | "items">("plans");
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  // ── Dynamic Pricing ──────────────────────────────────────────────────
  const subPricing = getMigoPlusPricing();
  const itemPricing = getShopItemPricing();

  const PLANS: Plan[] = [{
    id: "free",
    name: "Free",
    price: 0,
    period: "Free Forever",
    icon: <Heart size={22} className="text-muted-foreground" />,
    color: "border-border",
    gradient: "from-muted/40 to-muted/20",
    features: [i18n.t("auto.z_\uB9E4\uC77C\uC88B\uC544\uC69410\uD68C_34", "\uB9E4\uC77C\uC88B\uC544\uC69410\uD68C"), i18n.t("auto.z_\uAE30\uBCF8\uD504\uB85C\uD544\uC870\uD68C_35", "\uAE30\uBCF8\uD504\uB85C\uD544\uC870\uD68C"), i18n.t("auto.z_\uC5EC\uD589DNA\uAD81\uD569\uD655\uC778_36", "\uC5EC\uD589DNA\uAD81\uD569\uD655\uC778"), i18n.t("auto.z_\uADF8\uB8F9\uD2B8\uB9BD\uD0D0\uC0C9_37", "\uADF8\uB8F9\uD2B8\uB9BD\uD0D0\uC0C9")]
  }, {
    id: "plus",
    name: "MIGO Plus",
    price: subPricing.month1,
    period: "1 month",
    badge: i18n.t("auto.z_\uC778\uAE30_39", "\uC778\uAE30"),
    badgeColor: "bg-primary text-primary-foreground",
    icon: <Star size={22} className="text-yellow-400 fill-yellow-400" />,
    color: "border-primary",
    gradient: "from-primary/20 to-primary/5",
    features: [i18n.t("auto.z_\uBB34\uC81C\uD55C\uC88B\uC544\uC694_40", "\uBB34\uC81C\uD55C\uC88B\uC544\uC694"), i18n.t("auto.z_\uC288\uD37C\uB77C\uC774\uD06C5\uD68C\uC6D4_41", "\uC288\uD37C\uB77C\uC774\uD06C5\uD68C\uC6D4"), i18n.t("auto.z_\uBD80\uC2A4\uD2B81\uD68C\uC6D4_42", "\uBD80\uC2A4\uD2B81\uD68C\uC6D4"), i18n.t("auto.z_\uB098\uB97C\uC88B\uC544\uC694\uD55C\uC0AC\uB78C\uBCF4\uAE30_43", "\uB098\uB97C\uC88B\uC544\uC694\uD55C\uC0AC\uB78C\uBCF4\uAE30"), i18n.t("auto.z_\uC804\uC138\uACC4\uD544\uD130_44", "\uC804\uC138\uACC4\uD544\uD130"), i18n.t("auto.z_\uAD11\uACE0\uC5C6\uC74C_45", "\uAD11\uACE0\uC5C6\uC74C")]
  }, {
    id: "premium",
    name: "MIGO Premium",
    price: subPricing.month12,
    period: "12 months",
    badge: i18n.t("auto.z_\uCD5C\uACE0\uD61C\uD0DD_47", "\uCD5C\uACE0\uD61C\uD0DD"),
    badgeColor: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
    icon: <Crown size={22} className="text-amber-400 fill-amber-400" />,
    color: "border-amber-400",
    gradient: "from-amber-500/20 to-orange-500/10",
    features: [i18n.t("auto.z_Plus\uBAA8\uB4E0\uD61C\uD0DD\uD3EC\uD568_48", "Plus\uBAA8\uB4E0\uD61C\uD0DD\uD3EC\uD568"), i18n.t("auto.z_\uC288\uD37C\uB77C\uC774\uD06C\uBB34\uC81C\uD55C_49", "\uC288\uD37C\uB77C\uC774\uD06C\uBB34\uC81C\uD55C"), i18n.t("auto.z_\uBD80\uC2A4\uD2B85\uD68C\uC6D4_50", "\uBD80\uC2A4\uD2B85\uD68C\uC6D4"), i18n.t("auto.z_\uC5EC\uAD8C\uC778\uC99D\uC790\uB3D9\uCC98\uB9AC\uC6B0\uC120_51", "\uC5EC\uAD8C\uC778\uC99D\uC790\uB3D9\uCC98\uB9AC\uC6B0\uC120"), i18n.t("auto.z_AI\uC5EC\uD589\uC77C\uC815\uC0DD\uC131\uBB34\uC81C_52", "AI\uC5EC\uD589\uC77C\uC815\uC0DD\uC131\uBB34\uC81C"), i18n.t("auto.z_\uB3D9\uD589\uC644\uB8CC\uB9AC\uBDF0\uBC43\uC9C0\uAC15\uC870_53", "\uB3D9\uD589\uC644\uB8CC\uB9AC\uBDF0\uBC43\uC9C0\uAC15\uC870"), i18n.t("auto.z_\uD504\uB9AC\uBBF8\uC5C4\uD504\uB85C\uD544\uD14C\uB9C8_54", "\uD504\uB9AC\uBBF8\uC5C4\uD504\uB85C\uD544\uD14C\uB9C8"), i18n.t("auto.z_\uC804\uC138\uACE0\uAC1D\uC9C0\uC6D0_55", "\uC804\uC138\uACE0\uAC1D\uC9C0\uC6D0")]
  }];

  const ITEMS: ShopItem[] = [{
    id: "superlike_3",
    name: i18n.t("auto.z_슈퍼라이크3개", "Super Like x3"),
    desc: i18n.t("auto.z_특별한연결기회", "Special connection opportunities"),
    price: (itemPricing as any).superlike_3,
    quantity: i18n.t("auto.z_3개", "x3"),
    icon: <Star size={24} className="text-blue-400 fill-blue-400" />,
    color: "bg-blue-500/10 border-blue-400/30",
  }, {
    id: "superlike_10",
    name: i18n.t("auto.z_슈퍼라이크10개_59", "Super Like x10"),
    desc: i18n.t("auto.z_더많은특별연결기회_60", "Even more special connection opportunities"),
    price: (itemPricing as any).superlike_10,
    quantity: i18n.t("auto.z_10개_61", "x10"),
    icon: <Star size={24} className="text-blue-500 fill-blue-500" />,
    color: "bg-blue-500/10 border-blue-400/30",
    popular: true
  }, {
    id: "superlike_30",
    name: i18n.t("auto.z_슈퍼라이크30개", "Super Like x30"),
    desc: i18n.t("auto.z_무제한가까운연결", "Near-unlimited connections"),
    price: (itemPricing as any).superlike_30,
    quantity: i18n.t("auto.z_30개", "x30"),
    icon: <Star size={24} className="text-blue-600 fill-blue-600" />,
    color: "bg-blue-500/10 border-blue-400/30"
  }, {
    id: "boost_1",
    name: i18n.t("auto.z_\uBD80\uC2A4\uD2B81\uD68C_62", "\uBD80\uC2A4\uD2B81\uD68C"),
    desc: i18n.t("auto.z_30\uBD84\uAC04\uB0B4\uD504\uB85C\uD544\uCD5C\uC0C1_63", "30\uBD84\uAC04\uB0B4\uD504\uB85C\uD544\uCD5C\uC0C1"),
    price: (itemPricing as any).boost_1,
    quantity: i18n.t("auto.z_30\uBD84_64", "30\uBD84"),
    icon: <Zap size={24} className="text-purple-400 fill-purple-400" />,
    color: "bg-purple-500/10 border-purple-400/30",
    popular: true
  }, {
    id: "boost_5",
    name: i18n.t("auto.z_부스트5회_65", "Boost 5회"),
    desc: i18n.t("auto.z_최고의노출효과를경험_66", "최고의 노출 효과를 경험"),
    price: (itemPricing as any).boost_5,
    quantity: i18n.t("auto.z_5회_67", "5회"),
    icon: <Zap size={24} className="text-purple-500 fill-purple-500" />,
    color: "bg-purple-500/10 border-purple-400/30",
    popular: true
  }, {
    id: "boost_15",
    name: i18n.t("auto.z_부스트15회", "Boost 15회"),
    desc: i18n.t("auto.z_멈추지않는인기", "멈추지 않는 인기 상승"),
    price: (itemPricing as any).boost_15,
    quantity: i18n.t("auto.z_15회", "15회"),
    icon: <Zap size={24} className="text-purple-600 fill-purple-600" />,
    color: "bg-purple-500/10 border-purple-400/30"
  }, {
    id: "verified_badge",
    name: i18n.t("auto.z_\uC5EC\uD589\uC790\uC778\uC99D\uBC43\uC9C0_68", "\uC5EC\uD589\uC790\uC778\uC99D\uBC43\uC9C0"),
    desc: i18n.t("auto.z_\uC2E0\uB8B0\uB3C4UP\uB208\uC5D0\uB744\uB294\uC778_69", "\uC2E0\uB8B0\uB3C4UP\uB208\uC5D0\uB744\uB294\uC778"),
    price: (itemPricing as any).verified_badge,
    icon: <Shield size={24} className="text-emerald-400" />,
    color: "bg-emerald-500/10 border-emerald-400/30"
  }, {
    id: "profile_theme",
    name: i18n.t("auto.z_\uD504\uB9AC\uBBF8\uC5C4\uD504\uB85C\uD544\uD14C\uB9C8_70", "\uD504\uB9AC\uBBF8\uC5C4\uD504\uB85C\uD544\uD14C\uB9C8"),
    desc: i18n.t("auto.z_\uD2B9\uBCC4\uD55C\uD504\uB85C\uD544\uBC30\uACBD\uC73C\uB85C_71", "\uD2B9\uBCC4\uD55C\uD504\uB85C\uD544\uBC30\uACBD\uC73C\uB85C"),
    price: (itemPricing as any).profile_theme,
    icon: <Sparkles size={24} className="text-pink-400" />,
    color: "bg-pink-500/10 border-pink-400/30"
  }, {
    id: "travel_pack",
    name: i18n.t("auto.z_\uC5EC\uD589\uC790\uC2A4\uD0C0\uD130\uD329_72", "\uC5EC\uD589\uC790\uC2A4\uD0C0\uD130\uD329"),
    desc: i18n.t("auto.z_\uC288\uD37C\uB77C\uC774\uD06C10\uAC1C\uBD80\uC2A4_73", "\uC288\uD37C\uB77C\uC774\uD06C10\uAC1C\uBD80\uC2A4"),
    price: (itemPricing as any).travel_pack,
    icon: <Gift size={24} className="text-rose-400" />,
    color: "bg-rose-500/10 border-rose-400/30",
    popular: true
  }, {
    id: "nearby_unlock",
    name: i18n.t("auto.z_\uADFC\uCC98\uC5EC\uD589\uC790\uBCF4\uAE307\uC77C_74", "\uADFC\uCC98\uC5EC\uD589\uC790\uBCF4\uAE307\uC77C"),
    desc: i18n.t("auto.z_\uC9C0\uAE08\uAC19\uC740\uB3C4\uC2DC\uC5D0\uC788\uB294\uC5EC_75", "\uC9C0\uAE08\uAC19\uC740\uB3C4\uC2DC\uC5D0\uC788\uB294\uC5EC"),
    price: (itemPricing as any).nearby_unlock,
    quantity: i18n.t("auto.z_7\uC77C_76", "7\uC77C"),
    icon: <MapPin size={24} className="text-orange-400" />,
    color: "bg-orange-500/10 border-orange-400/30"
  }];
  // ────────────────────────────────────────────────────────────────
  // Apple Guideline 3.1.1: StoreKit IAP 구매 핸들러
  // ────────────────────────────────────────────────────────────────
  const handlePurchase = async (plan: Plan | null, item: ShopItem | null) => {
    if (!isNativeIOS()) {
      toast({
        title: i18n.t('shop.nativeOnly.title', 'App Purchase Only'),
        description: i18n.t('shop.nativeOnly.desc', 'Please subscribe via the Migo app from the App Store.'),
      });
      return;
    }

    if (plan) {
      // 구독 플랜 IAP
      let productId: string;
      if (plan.id === 'premium') {
        productId = IAP_PRODUCT_IDS.PREMIUM_MONTHLY;
      } else if (plan.id === 'plus') {
        productId = PLUS_BILLING_CYCLE_MAP.monthly; // ShopPage는 monthly만 노출
      } else {
        return;
      }
      const result = await purchaseSubscriptionIAP(productId as any);
      if (result.success) {
        setPurchaseSuccess(plan.name);
        setTimeout(() => setPurchaseSuccess(null), 2000);
      } else if (!result.cancelled && result.error) {
        toast({ title: i18n.t('shop.purchaseFail.title', 'Payment failed'), description: result.error, variant: 'destructive' });
      }
    } else if (item) {
      // 개별 아이템 IAP
      const result = await purchaseItemIAP(item.id);
      if (result.success) {
        setPurchaseSuccess(item.name);
        setTimeout(() => setPurchaseSuccess(null), 2000);
      } else if (!result.cancelled && result.error) {
        toast({ title: i18n.t('shop.purchaseFail.title', 'Payment failed'), description: result.error, variant: 'destructive' });
      }
    }
  };

  // 구매 복원
  const handleRestore = async () => {
    if (!isNativeIOS()) return;
    const result = await restorePurchasesIAP();
    if (result.restored && result.restoredPlan) {
      toast({ title: `${result.restoredPlan === 'premium' ? 'Premium' : 'Plus'} subscription restored! ✅` });
    } else {
      toast({ title: i18n.t('shop.restoreNone', 'No subscription found to restore') });
    }
  };
  return <div className="flex flex-col min-h-screen bg-background safe-bottom">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border flex items-center gap-3 px-4 pt-safe pb-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg font-extrabold leading-tight">MIGO Shop</h1>
          <p className="text-xs text-muted-foreground truncate">{t("auto.z_\uAD6C\uB3C5\uD50C\uB79C\uC544\uC774\uD15C\uAD6C\uB9E4_83", "Subscription & Items")}</p>
        </div>
        <div className="ml-auto">
          <Package size={24} className="text-primary" />
        </div>
      </header>

      {/* Hero Banner */}
      <div className="mx-4 mt-4 rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-blue-600 p-6 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-tr-full" />
        <p className="text-xs font-extrabold text-white/70 uppercase tracking-widest mb-1 truncate">{t("auto.z_\uC5EC\uD589\uB3D9\uD589\uC758\uD488\uACA9_84", "Travel Quality")}</p>
        <h2 className="text-2xl font-black text-white leading-tight mb-2 truncate">{t("auto.z_\uB354\uB9CE\uC740\uC5F0\uACB0_85", "More Connections")}<br />{t("auto.z_\uB354\uB098\uC740\uC5EC\uD589_86", "Better Travels")}</h2>
        <p className="text-sm text-white/80 truncate">{t("auto.z_\uD504\uB9AC\uBBF8\uC5C4\uC73C\uB85C\uC5C5\uADF8\uB808\uC774_87", "Upgrade to Premium")}<br />{t("auto.z_\uCD5C\uACE0\uC758\uC5EC\uD589\uD30C\uD2B8\uB108\uB97C\uB9CC_88", "Meet your perfect partner")}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mx-4 mt-5 p-1 bg-muted rounded-2xl truncate">
        {(["plans", "items"] as const).map(t => <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold transition-all ${tab === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}>
            {t === "plans" ? i18n.t("auto.z_\uAD6C\uB3C5\uD50C\uB79C_89", "Plans") : i18n.t("auto.z_\uC544\uC774\uD15C\uAD6C\uB9E4_90", "Items")}
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
            if (plan.id === "plus" && isPlus && !isPremium) currentStatus = i18n.t("auto.z_\uD604\uC7AC\uC774\uC6A9\uC911\uC778\uD50C\uB79C_91", "Active Plan");
            if (plan.id === "plus" && isPremium) currentStatus = i18n.t("auto.z_\uD504\uB9AC\uBBF8\uC5C4\uD61C\uD0DD\uC801\uC6A9\uC911", "Premium Active");
            if (plan.id === "premium" && isPremium) currentStatus = i18n.t("auto.z_\uD604\uC7AC\uC774\uC6A9\uC911\uC778\uD50C\uB79C_92", "Active Plan");
            return <motion.div key={plan.id} whileTap={{
              scale: 0.98
            }} onClick={() => {
              if (plan.id === "free") return;
              if (plan.id === "plus" && isPlus) return;
              if (plan.id === "premium" && isPremium) return;
              handlePurchase(plan, null);
            }} className={`relative rounded-3xl border-2 bg-gradient-to-br ${plan.gradient} ${currentStatus ? "border-emerald-500/50" : plan.color} p-5 overflow-hidden cursor-pointer`}>
                  <div className="flex items-start gap-3 mb-3 mt-2 pr-2">
                    <div className="w-10 h-10 rounded-2xl bg-background/50 backdrop-blur flex items-center justify-center shrink-0">
                      {plan.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-extrabold text-foreground text-base">{plan.name}</p>
                        {plan.badge && !currentStatus && (
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${plan.badgeColor}`}>
                            {plan.badge}
                          </span>
                        )}
                        {currentStatus && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                            {currentStatus}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{plan.period}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-black text-foreground">{plan.price === 0 ? getLocalizedPrice(0, i18n.language) : subPricing.format(plan.price)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 relative z-10">
                    {plan.features.map((f, i) => <div key={i} className="flex items-center gap-2 text-sm text-foreground/80 font-medium">
                        <CheckCircle2 size={15} className={plan.id === "premium" ? "text-amber-500 shrink-0" : "text-emerald-500 shrink-0"} />
                        {f}
                      </div>)}
                  </div>
                  {/* IAP 구매 버튼 */}
                  {plan.id !== "free" && !currentStatus && (
                    <div className="mt-5 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-blue-500 text-white text-sm font-extrabold shadow-md shadow-primary/20">
                      {plan.id === "premium" ? "👑" : "✨"} {i18n.t("auto.z_구독하기_iap", "Subscribe")}
                    </div>
                  )}
                  {currentStatus && (
                    <div className="mt-5 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 text-sm font-extrabold border border-emerald-500/20 truncate">
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> {currentStatus}
                    </div>
                  )}
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
          }} onClick={() => handlePurchase(null, item)} className={`relative rounded-2xl border bg-card ${item.color} p-4 flex flex-col gap-2 cursor-pointer`}>
                  {item.popular && <span className="absolute top-3 right-3 text-[9px] font-black bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full truncate">{i18n.t("auto.z_\uC778\uAE30_96", "Popular")}</span>}
                  <div className="w-10 h-10 rounded-xl bg-background/60 flex items-center justify-center mb-1">
                    {item.icon}
                  </div>
                  <p className="font-extrabold text-foreground text-sm leading-tight">{item.name}</p>
                  {item.quantity && <span className="text-[10px] text-muted-foreground font-bold">{item.quantity}</span>}
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.desc}</p>
                  <p className="text-base font-black text-primary mt-auto truncate">{itemPricing.format(item.price)}</p>
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
            <CheckCircle2 size={16} /> {purchaseSuccess} {t("auto.z_구매완료_97", "purchased! ✅")}</motion.div>}
      </AnimatePresence>

      {/* Restore Purchases — Apple Guideline 3.1.1 필수 */}
      {isNativeIOS() && (
        <div className="flex justify-center pb-8 pt-2">
          <button
            onClick={handleRestore}
            className="text-xs text-muted-foreground underline underline-offset-4 font-semibold active:opacity-60 transition-opacity"
          >
            {i18n.t("shop.restorePurchases", "Restore Purchases")}
          </button>
        </div>
      )}

      {/* Purchase Modal Removed - StoreKit directly presents the payment sheet */}
    </div>;
};
export default ShopPage;