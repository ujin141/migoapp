
import { useTranslation } from "react-i18next";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Star, Zap, Shield, Crown, Heart, MapPin, Gift, CheckCircle2, Sparkles, Package, Lock, RefreshCw, BadgeCheck, ShieldCheck, FileText, AlertCircle } from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";
import { getLocalizedPrice, getShopItemPricing, getMigoPlusPricing } from "@/lib/pricing";
import { toast } from "@/hooks/use-toast";
import { isNativePlatform, isNativeIOS, PLUS_BILLING_CYCLE_MAP, IAP_PRODUCT_IDS } from "@/lib/iapService";

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
  const [purchasingId, setPurchasingId] = useState<string | null>(null); // iPad 로딩 피드백용
  const [purchaseError, setPurchaseError] = useState<string | null>(null);   // inline error on card
  const purchaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // stuck-guard

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
    features: [i18n.t("auto.z_매일좋아요10회_34", "매일 좋아요 10회"), i18n.t("auto.z_기본프로필조회_35", "기본 프로필 조회"), i18n.t("auto.z_여행DNA궁합확인_36", "여행DNA 궁합확인"), i18n.t("auto.z_그룹트립탐색_37", "그룹 트립 탐색")]
  }, {
    id: "plus",
    name: "MIGO Plus",
    price: subPricing.month1,
    period: "1 month",
    badge: i18n.t("auto.z_인기_39", "인기"),
    badgeColor: "bg-primary text-primary-foreground",
    icon: <Star size={22} className="text-yellow-400 fill-yellow-400" />,
    color: "border-primary",
    gradient: "from-primary/20 to-primary/5",
    features: [i18n.t("auto.z_무제한좋아요_40", "무제한 좋아요"), i18n.t("auto.z_슈퍼라이크5회월_41", "슈퍼라이크 5회/월"), i18n.t("auto.z_부스트1회월_42", "부스트 1회/월"), i18n.t("auto.z_나를좋아요한사람보기_43", "나를 좋아요한 사람 보기"), i18n.t("auto.z_전세계필터_44", "전세계 필터"), i18n.t("auto.z_광고없음_45", "광고 없음")]
  }, {
    id: "premium",
    name: "MIGO Premium",
    price: subPricing.month12,
    period: "12 months",
    badge: i18n.t("auto.z_최고혜택_47", "최고 혜택"),
    badgeColor: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
    icon: <Crown size={22} className="text-amber-400 fill-amber-400" />,
    color: "border-amber-400",
    gradient: "from-amber-500/20 to-orange-500/10",
    features: [i18n.t("auto.z_Plus모든혜택포함_48", "Plus 모든 혜택 포함"), i18n.t("auto.z_슈퍼라이크무제한_49", "슈퍼라이크 무제한"), i18n.t("auto.z_부스트5회월_50", "부스트 5회/월"), i18n.t("auto.z_여권인증자동처리우선_51", "여권 인증 자동 처리 우선"), i18n.t("auto.z_AI여행일정생성무제_52", "AI 여행 일정 생성 무제"), i18n.t("auto.z_동행완료리뷰뱃지강조_53", "동행 완료 리뷰 뱃지 강조"), i18n.t("auto.z_프리미엄프로필테마_54", "프리미엄 프로필 테마"), i18n.t("auto.z_전세고객지원_55", "전세 고객 지원")]
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
    name: i18n.t("auto.z_부스트1회_62", "부스트 1회"),
    desc: i18n.t("auto.z_30분간내프로필최상_63", "30분간 내 프로필 최상"),
    price: (itemPricing as any).boost_1,
    quantity: i18n.t("auto.z_30분_64", "30분"),
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
    name: i18n.t("auto.z_여행자인증뱃지_68", "여행자 인증 뱃지"),
    desc: i18n.t("auto.z_신뢰도UP눈에띄는인_69", "신뢰도 UP 눈에 띄는 인"),
    price: (itemPricing as any).verified_badge,
    icon: <Shield size={24} className="text-emerald-400" />,
    color: "bg-emerald-500/10 border-emerald-400/30"
  }, {
    id: "profile_theme",
    name: i18n.t("auto.z_프리미엄프로필테마_70", "프리미엄 프로필 테마"),
    desc: i18n.t("auto.z_특별한프로필배경으로_71", "특별한 프로필 배경으로"),
    price: (itemPricing as any).profile_theme,
    icon: <Sparkles size={24} className="text-pink-400" />,
    color: "bg-pink-500/10 border-pink-400/30"
  }, {
    id: "travel_pack",
    name: i18n.t("auto.z_여행자스타터팩_72", "여행자 스타터 팩"),
    desc: i18n.t("auto.z_슈퍼라이크10개부스_73", "슈퍼라이크 10개 부스"),
    price: (itemPricing as any).travel_pack,
    icon: <Gift size={24} className="text-rose-400" />,
    color: "bg-rose-500/10 border-rose-400/30",
    popular: true
  }, {
    id: "nearby_unlock",
    name: i18n.t("auto.z_근처여행자보기7일_74", "근처 여행자 보기 7일"),
    desc: i18n.t("auto.z_지금같은도시에있는여_75", "지금 같은 도시에 있는 여"),
    price: (itemPricing as any).nearby_unlock,
    quantity: i18n.t("auto.z_7일_76", "7일"),
    icon: <MapPin size={24} className="text-orange-400" />,
    color: "bg-orange-500/10 border-orange-400/30"
  }];
  // ────────────────────────────────────────────────────────────────
  // Apple Guideline 3.1.1: StoreKit IAP 구매 핸들러
  // ────────────────────────────────────────────────────────────────
  const handlePurchase = async (plan: Plan | null, item: ShopItem | null) => {
    // 네이티브 iOS/Android에서만 IAP 결제 가능
    if (!isNativePlatform()) {
      toast({
        title: i18n.t('shop.nativeOnly.title', 'App Purchase Only'),
        description: i18n.t('shop.nativeOnly.desc', 'Please subscribe via the Migo app from the App Store.'),
      });
      return;
    }

    const purchaseKey = plan?.id ?? item?.id ?? 'unknown';

    // 이미 구매 진행 중이면 중복 방지
    if (purchasingId) return;

    // 이전 에러 초기화
    setPurchaseError(null);

    // ── 즉각적인 로딩 피드백 (iPad 심사 대응) ──
    setPurchasingId(purchaseKey);

    // ── 30초 stuck-guard: StoreKit이 응답 없으면 자동 해제 ──
    if (purchaseTimeoutRef.current) clearTimeout(purchaseTimeoutRef.current);
    purchaseTimeoutRef.current = setTimeout(() => {
      setPurchasingId(null);
      setPurchaseError(i18n.t('shop.purchaseTimeout', 'Request timed out. Please try again.'));
    }, 30_000);

    try {
      if (plan) {
        // 구독 플랜 IAP
        let productId: string;
        if (plan.id === 'premium') {
          productId = IAP_PRODUCT_IDS.PREMIUM_MONTHLY;
        } else if (plan.id === 'plus') {
          productId = PLUS_BILLING_CYCLE_MAP.monthly;
        } else {
          return;
        }
        const result = await purchaseSubscriptionIAP(productId as any);
        if (result.success) {
          setPurchaseSuccess(plan.name);
          setTimeout(() => setPurchaseSuccess(null), 3000);
        } else if (!result.cancelled) {
          // product_not_found: 특별 메시지 (Paid Apps Agreement 미체결 or 상품 미승인)
          const errMsg = result.error === 'product_not_found'
            ? i18n.t('shop.productNotFound', 'Product not available. Please ensure the Paid Apps Agreement is active in App Store Connect.')
            : (result.error ?? i18n.t('shop.purchaseFail.title', 'Payment failed'));
          setPurchaseError(errMsg);
          toast({ title: i18n.t('shop.purchaseFail.title', 'Payment failed'), description: errMsg, variant: 'destructive' });
        }
      } else if (item) {
        // 개별 아이템 IAP
        const result = await purchaseItemIAP(item.id);
        if (result.success) {
          setPurchaseSuccess(item.name);
          setTimeout(() => setPurchaseSuccess(null), 3000);
        } else if (!result.cancelled) {
          const errMsg = result.error === 'product_not_found'
            ? i18n.t('shop.productNotFound', 'Product not available. Please ensure the Paid Apps Agreement is active in App Store Connect.')
            : (result.error ?? i18n.t('shop.purchaseFail.title', 'Payment failed'));
          toast({ title: i18n.t('shop.purchaseFail.title', 'Payment failed'), description: errMsg, variant: 'destructive' });
        }
      }
    } finally {
      if (purchaseTimeoutRef.current) {
        clearTimeout(purchaseTimeoutRef.current);
        purchaseTimeoutRef.current = null;
      }
      setPurchasingId(null);
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
  return <div className="flex flex-col min-h-full bg-background safe-bottom">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border flex items-center gap-3 px-4 pt-safe pb-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg font-extrabold leading-tight">MIGO Shop</h1>
          <p className="text-xs text-muted-foreground truncate">{t("auto.z_구독플랜아이템구매_83", "Subscription & Items")}</p>
        </div>
        <div className="ml-auto">
          <Package size={24} className="text-primary" />
        </div>
      </header>

      {/* Trust Badges Strip */}
      <div className="mx-4 mt-4 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
          <span className="text-[10px] font-bold text-emerald-600">Apple IAP 보안결제</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
          <Lock size={12} className="text-blue-500 shrink-0" />
          <span className="text-[10px] font-bold text-blue-600">256-bit 암호화</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
          <RefreshCw size={12} className="text-amber-500 shrink-0" />
          <span className="text-[10px] font-bold text-amber-600">언제든 취소</span>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="mx-4 mt-3 rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-blue-600 p-6 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-tr-full" />
        <p className="text-xs font-extrabold text-white/70 uppercase tracking-widest mb-1 truncate">{t("auto.z_여행동행의품격_84", "Travel Quality")}</p>
        <h2 className="text-2xl font-black text-white leading-tight mb-2 truncate">{t("auto.z_더많은연결_85", "More Connections")}<br />{t("auto.z_더나은여행_86", "Better Travels")}</h2>
        <p className="text-sm text-white/80 truncate">{t("auto.z_프리미엄으로업그레이_87", "Upgrade to Premium")}<br />{t("auto.z_최고의여행파트너를만_88", "Meet your perfect partner")}</p>
        {/* Social proof */}
        <div className="mt-4 flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {["🧑‍🤝‍🧑", "✈️", "🌍"].map((e, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px]">{e}</div>
            ))}
          </div>
          <span className="text-white/80 text-[11px] font-semibold">전 세계 <span className="text-white font-black">50,000+</span> 여행자가 함께합니다</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mx-4 mt-5 p-1 bg-muted rounded-2xl">
        {(["plans", "items"] as const).map(tabKey => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold transition-all ${
              tab === tabKey ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            {tabKey === "plans" ? i18n.t("auto.z_구독플랜_89", "Plans") : i18n.t("auto.z_아이템구매_90", "Items")}
          </button>
        ))}
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
            if (plan.id === "plus" && isPlus && !isPremium) currentStatus = i18n.t("auto.z_현재이용중인플랜_91", "Active Plan");
            if (plan.id === "plus" && isPremium) currentStatus = i18n.t("auto.z_프리미엄혜택적용중", "Premium Active");
            if (plan.id === "premium" && isPremium) currentStatus = i18n.t("auto.z_현재이용중인플랜_92", "Active Plan");
            const isDisabled = plan.id === "free" || (plan.id === "plus" && isPlus) || (plan.id === "premium" && isPremium);
            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl border-2 bg-gradient-to-br ${plan.gradient} ${
                  currentStatus ? "border-emerald-500/50" : plan.color
                } p-5 overflow-hidden`}
              >
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
                    <p className="text-2xl font-black text-foreground">
                      {plan.price === 0
                        ? getLocalizedPrice(0, i18n.language)
                        : subPricing.format(plan.price)}
                    </p>
                    {plan.id !== "free" && (
                      <p className="text-[10px] text-muted-foreground">{t("shop.perMonth", "/ month")}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 relative z-10">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-foreground/80 font-medium">
                      <CheckCircle2 size={15} className={plan.id === "premium" ? "text-amber-500 shrink-0" : "text-emerald-500 shrink-0"} />
                      {f}
                    </div>
                  ))}
                </div>

                {/* — Purchase / Status button (Guideline 2.1b: must respond on iPad) — */}
                {plan.id !== "free" && !currentStatus && (
                  <>
                    {/* Guideline 3.1.2(c): Subscription disclosure — price, period, auto-renew */}
                    <div className="mt-4 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5">
                      <p className="text-xs text-foreground/70 text-center leading-relaxed font-medium">
                        {plan.name} &middot; {plan.period} &middot; {subPricing.format(plan.price)}
                      </p>
                      <p className="text-[11px] text-muted-foreground text-center leading-relaxed mt-0.5">
                        {i18n.t("shop.autoRenewNote", "Auto-renews unless cancelled 24h before renewal")}
                      </p>
                      {/* Guideline 3.1.2(c): Functional EULA & Privacy Policy — must be unmissable */}
                      <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-border/40">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate('/terms'); }}
                          className="flex items-center gap-1 text-xs text-primary underline underline-offset-2 font-semibold active:opacity-60"
                        >
                          <FileText size={11} />
                          {i18n.t("shop.termsOfUse", "Terms of Use (EULA)")}
                        </button>
                        <span className="text-xs text-muted-foreground">&middot;</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate('/privacy'); }}
                          className="flex items-center gap-1 text-xs text-primary underline underline-offset-2 font-semibold active:opacity-60"
                        >
                          <ShieldCheck size={11} />
                          {i18n.t("shop.privacyPolicy", "Privacy Policy")}
                        </button>
                      </div>
                    </div>

                    {/* Inline error banner — visible when StoreKit rejects the purchase */}
                    {purchaseError && purchasingId === null && (
                      <div className="mt-2 flex items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2">
                        <AlertCircle size={14} className="text-destructive shrink-0 mt-0.5" />
                        <p className="text-[11px] text-destructive leading-snug font-medium">{purchaseError}</p>
                      </div>
                    )}

                    <button
                      disabled={!!purchasingId}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePurchase(plan, null);
                      }}
                      className={`mt-2 w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-primary to-blue-500 text-white text-sm font-extrabold shadow-md shadow-primary/20 transition-opacity ${
                        purchasingId === plan.id ? 'opacity-70' : 'opacity-100'
                      } active:opacity-80`}
                    >
                      {purchasingId === plan.id ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          {i18n.t("shop.processing", "Processing...")}
                        </>
                      ) : (
                        <>{plan.id === "premium" ? "👑" : "✨"} {i18n.t("auto.z_구독하기_iap", "Subscribe")}</>
                      )}
                    </button>
                  </>
                )}
                {currentStatus && (
                  <div className="mt-5 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 text-sm font-extrabold border border-emerald-500/20">
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> {currentStatus}
                  </div>
                )}
              </div>
            );
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
          }} onClick={() => handlePurchase(null, item)} className={`relative rounded-2xl border bg-card ${item.color} p-4 flex flex-col gap-2 cursor-pointer ${purchasingId === item.id ? 'opacity-70' : 'opacity-100'} transition-opacity`}>
                  {item.popular && <span className="absolute top-3 right-3 text-[9px] font-black bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full truncate">{i18n.t("auto.z_인기_96", "Popular")}</span>}
                  <div className="w-10 h-10 rounded-xl bg-background/60 flex items-center justify-center mb-1">
                    {purchasingId === item.id
                      ? <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      : item.icon}
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

      {/* Security & Trust Footer */}
      <div className="mx-4 mt-6 mb-2 bg-muted/40 rounded-2xl p-4 border border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
          <span className="text-xs font-extrabold text-foreground">안전한 결제 보장</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Lock, text: "Apple IAP 공식 결제", color: "text-blue-500" },
            { icon: RefreshCw, text: "언제든 구독 취소", color: "text-emerald-500" },
            { icon: ShieldCheck, text: "개인정보 완전 보호", color: "text-violet-500" },
            { icon: BadgeCheck, text: "앱스토어 심사 인증", color: "text-amber-500" },
          ].map(({ icon: Icon, text, color }) => (
            <div key={text} className="flex items-center gap-1.5">
              <Icon size={12} className={`${color} shrink-0`} />
              <span className="text-[10px] text-muted-foreground font-medium">{text}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-2.5 border-t border-border/40">
          <p className="text-[10px] text-muted-foreground leading-relaxed text-center">
            {i18n.t("shop.billingNote", "Subscriptions are billed through your Apple ID. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.")}
          </p>
          {/* Guideline 3.1.2(c): EULA & Privacy Policy must be functional links in the app */}
          <div className="flex items-center justify-center gap-4 mt-3">
            <button
              onClick={() => navigate('/terms')}
              className="flex items-center gap-1 text-[10px] text-primary underline underline-offset-2 font-semibold active:opacity-60"
            >
              <FileText size={10} />
              {i18n.t("shop.termsOfUse", "Terms of Use (EULA)")}
            </button>
            <span className="text-[10px] text-muted-foreground">·</span>
            <button
              onClick={() => navigate('/privacy')}
              className="flex items-center gap-1 text-[10px] text-primary underline underline-offset-2 font-semibold active:opacity-60"
            >
              <ShieldCheck size={10} />
              {i18n.t("shop.privacyPolicy", "Privacy Policy")}
            </button>
          </div>
        </div>
      </div>

      {/* Restore Purchases — Apple Guideline 3.1.1 필수 (iOS + iPad 모두 표시) */}
      {isNativePlatform() && (
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