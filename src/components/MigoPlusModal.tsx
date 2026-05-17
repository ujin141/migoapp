import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Star, Zap, Eye, Filter, Crown, Check, Sparkles,
  Users, Globe, MessageCircle, Shield, Dna, Clock,
  Heart, ChevronRight, Bot,
  Palette, Award, Infinity as InfinityIcon, Bell, RefreshCw
} from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";
import { useAuth } from "@/hooks/useAuth";
import { getMigoPlusPricing } from "@/lib/pricing";
import { supabase } from "@/lib/supabaseClient";
import { PLUS_BILLING_CYCLE_MAP, IAP_PRODUCT_IDS, isNativePlatform } from "@/lib/iapService";
import { toast } from "@/hooks/use-toast";
import CancelRetentionModal from "./CancelRetentionModal";
import CancelGuardModal from "@/components/CancelGuardModal";

interface MigoPlusModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlan?: "plus" | "premium";
}

// ── 플랜 기능 정의 ──────────────────────────────────────────
const PLUS_FEATURES = [
  { icon: Heart,          label: i18n.t("auto.g_0112", "일일 좋아요"),        free: i18n.t("auto.g_0113", "10개/일"),    plus: i18n.t("auto.g_0114", "50개/일") },
  { icon: Star,           label: i18n.t("auto.g_0115", "슈퍼라이크"),          free: i18n.t("auto.g_0116", "1개/일"),     plus: i18n.t("auto.g_0117", "5개/일") },
  { icon: Eye,            label: i18n.t("auto.g_0118", "나를 좋아한 사람"),    free: i18n.t("auto.g_0119", "숨김"),       plus: i18n.t("auto.g_0120", "전체 공개") },
  { icon: Zap,            label: i18n.t("auto.g_0121", "프로필 부스트"),       free: "❌",         plus: i18n.t("auto.g_0122", "월 1회 무료") },
  { icon: Filter,         label: i18n.t("auto.g_0123", "고급 필터"),           free: i18n.t("auto.g_0124", "기본만"),     plus: i18n.t("auto.g_0125", "MBTI·언어·나이") },
  { icon: Globe,          label: i18n.t("auto.g_0126", "글로벌 매칭"),         free: i18n.t("auto.g_0127", "근처만"),     plus: i18n.t("auto.g_0128", "전세계") },
  { icon: Dna,            label: i18n.t("auto.g_0129", "여행 DNA 리포트"),     free: "❌",         plus: i18n.t("auto.g_0130", "전체 공개") },
  { icon: Clock,          label: i18n.t("auto.g_0131", "지금여기있어요"),       free: i18n.t("auto.g_0132", "일반"),       plus: i18n.t("auto.g_0133", "최상단 고정") },
  { icon: MessageCircle,  label: i18n.t("auto.g_0134", "읽음 확인"),           free: "❌",         plus: "✅" },
  { icon: Shield,         label: i18n.t("auto.g_0135", "안전 기능"),           free: i18n.t("auto.g_0136", "기본"),       plus: i18n.t("auto.g_0137", "긴급 연락 우선") },
  { icon: Sparkles,       label: i18n.t("auto.g_0138", "광고 제거"),           free: i18n.t("auto.g_0139", "광고 있음"),  plus: i18n.t("auto.g_0140", "광고 없음") },
];

const PREMIUM_ONLY_FEATURES = [
  { icon: InfinityIcon, label: i18n.t("auto.g_0141", "좋아요/슈퍼라이크 무제한"), desc: i18n.t("auto.g_0142", "매칭 제한 해제 및 상한 없이 무제한 사용") },
  { icon: Crown,        label: i18n.t("auto.g_0143", "프리미엄 그룹 무제한"),    desc: i18n.t("auto.g_0144", "검증된 고급 프리미엄 럭셔리 모임 무제한 입장") },
  { icon: Users,        label: i18n.t("auto.g_0145", "프리미엄 전용 모임 개설"), desc: i18n.t("auto.g_0146", "엄선된 프리미엄 회원을 위한 프라이빗 모임 개설권") },
  { icon: Award,        label: i18n.t("auto.g_0147", "동행 완료 리뷰 뱃지"),     desc: i18n.t("auto.g_0148", "프로필 강조 왕관 뱃지 표시 + 신뢰도 극대화") },
  { icon: Palette,      label: i18n.t("auto.g_0149", "프리미엄 전용 프로필"),    desc: i18n.t("auto.g_0150", "VIP만을 위한 독점 테마·아이콘 자동 적용") },
  { icon: Bot,          label: i18n.t("auto.g_0151", "AI 맞춤 일정 생성"),       desc: i18n.t("auto.g_0152", "GPT를 활용한 AI 여행 일정 큐레이션 제공") },
];

// ── 메인 컴포넌트 ───────────────────────────────────────────
const MigoPlusModal = ({ isOpen, onClose, defaultPlan = "plus" }: MigoPlusModalProps) => {
  const { isPlus, isPremium, purchaseSubscriptionIAP, restorePurchasesIAP } = useSubscription();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  // 탭: plus | premium
  const [activePlan, setActivePlan] = useState<"plus" | "premium">(defaultPlan);
  // 기간 선택 (Plus만 해당) — App Store Connect 등록: monthly, quarterly, yearly
  const [billingCycle, setBillingCycle] = useState<"monthly" | "quarterly" | "yearly">("quarterly");
  // step은 더 이상 iapNotice 없이 plan만
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  // ── 해지 이탈 방지 팝업 ──────────────────────────────────────
  const [showRetention, setShowRetention] = useState(false);
  const [showCancelGuard, setShowCancelGuard] = useState(false);

  const pricing = getMigoPlusPricing();

  // ── 선택한 플랜의 금액 계산  // App Store Connect 등록 상품 기준
  const plusPrices = {
    monthly:   { krw: pricing.month1,  label: i18n.t("auto.g_0153", "1개월"),  badge: null },
    quarterly: { krw: pricing.month3,  label: i18n.t("auto.g_0154", "3개월"),  badge: `${Math.round((1 - pricing.month3 / (pricing.month1 * 3)) * 100)}% OFF` },
    yearly:    { krw: pricing.month12, label: i18n.t("auto.g_0155", "12개월"), badge: `${Math.round((1 - pricing.month12 / (pricing.month1 * 12)) * 100)}% OFF` },
  };
  const PREMIUM_KRW = 99900;

  const selectedKrw = activePlan === "premium"
    ? PREMIUM_KRW
    : plusPrices[billingCycle].krw;

  const selectedLabel = activePlan === "premium"
    ? t("auto.g_0156", "1개월")
    : plusPrices[billingCycle].label;

  // ── Apple Guideline 3.1.1: StoreKit IAP 구매 ──────────────────────────
  const handleActivate = async () => {
    if (!user) return;

    // 네이티브 환경(iOS/Android)에서만 실제 IAP 호출
    if (isNativePlatform()) {
      setLoading(true);
      try {
        let productId: string;
        if (activePlan === 'premium') {
          productId = IAP_PRODUCT_IDS.PREMIUM_MONTHLY;
        } else {
          productId = PLUS_BILLING_CYCLE_MAP[billingCycle];
        }
        const result = await purchaseSubscriptionIAP(productId as any);
        if (result.success) {
          toast({ title: t('iap.purchase_success', '구독이 완료됐어요! 🎉') });
          onClose();
        } else if (!result.cancelled) {
          toast({
            title: t('iap.purchase_failed', '결제 실패'),
            description: result.error,
            variant: 'destructive',
          });
        }
        // cancelled면 아무 것도 안 함 (조용히 닫기)
      } catch (e) {
        toast({ title: t('iap.purchase_failed', '결제 실패'), variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    } else {
      // 웹/시뮬레이터: 안내 화면 표시 (심사 통과용)
      toast({
        title: 'App subscription only',
        description: 'Please subscribe through the Migo app downloaded from the App Store.',
      });
    }
  };

  // 구매 복원
  const handleRestore = async () => {
    if (!isNativePlatform()) return;
    setRestoring(true);
    try {
      const result = await restorePurchasesIAP();
      if (result.restored && result.restoredPlan) {
        toast({ title: t('iap.restore_success', `${result.restoredPlan === 'premium' ? 'Premium' : 'Plus'} 구독이 복원됐어요! ✅`) });
        onClose();
      } else {
        toast({ title: t('iap.restore_none', '복원할 구독 정보를 찾을 수 없습니다') });
      }
    } finally {
      setRestoring(false);
    }
  };

  const handleClose = () => {
    // 미구독 유저가 닫으려 할 때만 retention 팝업 표시
    if (!alreadySubscribed) {
      setShowRetention(true);
    } else {
      onClose();
    }
  };

  // ── 현재 이미 구독 중인지 ────────────────────────────────
  const alreadySubscribed =
    (activePlan === "plus" && isPlus) ||
    (activePlan === "premium" && isPremium);

  return createPortal(
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-end justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={handleClose} />

            <motion.div
              className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-t-3xl shadow-float flex flex-col"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={{ maxHeight: "92vh" }}
              onClick={(e) => e.stopPropagation()}
            >
            {/* ── 닫기 버튼 & 드래그 핸들 ── */}
            <div className="flex items-center justify-between px-5 pt-4 pb-1 shrink-0">
              <div className="w-8" /> {/* 밸런스용 빈 공간 */}
              <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <X size={15} className="text-muted-foreground" />
              </button>
            </div>

            {/* ── PLAN 선택 화면 ── */}
            {(
              <>
                {/* 플랜 탭 */}
                <div className="px-5 pt-2 pb-3 shrink-0">
                  <div className="flex gap-2 p-1 bg-muted rounded-2xl">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setActivePlan("plus"); }}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold transition-all ${
                        activePlan === "plus"
                          ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md"
                          : "text-muted-foreground"
                      }`}
                    >
                      ✨ Plus
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setActivePlan("premium"); }}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold transition-all ${
                        activePlan === "premium"
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
                          : "text-muted-foreground"
                      }`}
                    >
                      👑 Premium
                    </button>
                  </div>
                </div>

                {/* 스크롤 영역 */}
                <div className="flex-1 overflow-y-auto min-h-0 px-5 space-y-4 pb-4">

                  {/* ═══ PLUS 플랜 ═══ */}
                  {activePlan === "plus" && (
                    <>
                      {/* 헤더 */}
                      <div className="rounded-2xl p-4 bg-gradient-to-br from-emerald-500 to-blue-500 text-white text-center">
                        <Crown size={28} className="mx-auto mb-1" />
                        <h2 className="text-xl font-extrabold">Migo Plus</h2>
                        <p className="text-white/80 text-xs mt-0.5 truncate">{t("auto.g_0087", "매칭의 모든 제한을 해제하세요")}</p>
                      </div>

                      {/* 기간 선택 */}
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest truncate">{t("auto.g_0088", "구독 기간")}</p>
                        <div className="flex gap-2">
                          {(["monthly", "quarterly", "yearly"] as const).map((cycle) => {
                            const p = plusPrices[cycle];
                            return (
                              <button
                                key={cycle}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setBillingCycle(cycle); }}
                                className={`relative flex-1 rounded-2xl border-2 p-3 text-center transition-all ${
                                  billingCycle === cycle
                                    ? "border-emerald-500 bg-emerald-500/10"
                                    : "border-border"
                                }`}
                              >
                                {p.badge && (
                                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                                    {p.badge}
                                  </span>
                                )}
                                <p className="text-[10px] text-muted-foreground">{p.label}</p>
                                <p className="text-sm font-extrabold text-foreground mt-0.5">
                                  {pricing.format(p.krw)}
                                </p>
                                {cycle !== "monthly" && (
                                  <p className="text-[9px] text-muted-foreground mt-0.5 truncate">
                                    {t("auto.g_0089", "/ month")}{pricing.format(Math.round(p.krw / (cycle === "quarterly" ? 3 : 12)))}
                                  </p>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 기능 목록 */}
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest truncate">{t("auto.g_0090", "Plus 혜택")}</p>
                        <div className="rounded-2xl border border-border overflow-hidden">
                          {/* 헤더 행 */}
                          <div className="grid grid-cols-3 bg-muted px-3 py-2">
                            <span className="text-[10px] font-bold text-muted-foreground truncate">{t("auto.g_0091", "기능")}</span>
                            <span className="text-[10px] font-bold text-muted-foreground text-center">Free</span>
                            <span className="text-[10px] font-extrabold text-emerald-500 text-center">Plus ✨</span>
                          </div>
                          {PLUS_FEATURES.map((f, i) => (
                            <div key={i} className={`grid grid-cols-3 border-t border-border px-3 py-2 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                              <div className="flex items-center gap-1.5">
                                <f.icon size={11} className="text-emerald-500 shrink-0" />
                                <span className="text-[10px] text-foreground font-medium leading-tight">{f.label}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground text-center self-center">{f.free}</span>
                              <span className="text-[10px] font-bold text-emerald-600 text-center self-center">{f.plus}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* ═══ PREMIUM 플랜 ═══ */}
                  {activePlan === "premium" && (
                    <>
                      {/* 헤더 */}
                      <div className="rounded-2xl p-4 bg-gradient-to-br from-amber-500 to-orange-500 text-white text-center relative overflow-hidden">
                        <motion.div
                          className="absolute inset-0 bg-white/10"
                          animate={{ x: ["-100%", "150%"] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          style={{ skewX: -20 }}
                        />
                        <Crown size={28} className="mx-auto mb-1 relative z-10" />
                        <h2 className="text-xl font-extrabold relative z-10">Migo Premium</h2>
                        <p className="text-white/80 text-xs mt-0.5 relative z-10 truncate">{t("auto.g_0092", "최고급 여행 메이트 경험")}</p>
                        <div className="mt-2 relative z-10">
                          <span className="text-2xl font-extrabold">{pricing.format(PREMIUM_KRW)}</span>
                          <span className="text-white/70 text-xs ml-1 truncate">{t("auto.g_0093", "/ 월")}</span>
                        </div>
                      </div>

                      {/* Plus 포함 안내 */}
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <Check size={14} className="text-emerald-500 shrink-0" />
                        <p className="text-xs font-bold text-emerald-600 whitespace-normal leading-relaxed">{t("auto.g_0094", "Plus의 모든 기능 포함 + Premium 전용 혜택")}</p>
                      </div>

                      {/* Premium 전용 기능 */}
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest truncate">{t("auto.g_0095", "Premium 전용 혜택")}</p>
                        <div className="space-y-2">
                          {PREMIUM_ONLY_FEATURES.map((f, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                                <f.icon size={16} className="text-amber-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground">{f.label}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 whitespace-normal leading-relaxed">{f.desc}</p>
                              </div>
                              <Crown size={12} className="text-amber-500 shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Plus 기능도 포함됨 안내 */}
                      <div className="rounded-2xl border border-border overflow-hidden">
                        <div className="bg-muted px-3 py-2">
                          <p className="text-[10px] font-bold text-muted-foreground truncate">{t("auto.g_0096", "Plus 기능도 전부 포함")}</p>
                        </div>
                        {PLUS_FEATURES.slice(0, 6).map((f, i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-2 border-t border-border">
                            <f.icon size={11} className="text-emerald-500 shrink-0" />
                            <span className="text-[10px] text-foreground font-medium flex-1">{f.label}</span>
                            <span className="text-[10px] font-bold text-emerald-600">{f.plus}</span>
                          </div>
                        ))}
                        <div className="px-3 py-2 border-t border-border bg-muted/30">
                          <p className="text-[9px] text-muted-foreground text-center truncate">+ {PLUS_FEATURES.length - 6}{t("auto.g_0097", "개 추가 혜택")}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* ── 하단 CTA ── */}
                <div className="px-5 py-4 border-t border-border bg-card pb-safe-min shrink-0">
                  {alreadySubscribed ? (
                    <div className="w-full py-4 rounded-2xl bg-emerald-500/10 text-center">
                      <p className="text-emerald-600 font-bold flex items-center justify-center gap-2">
                        <Crown size={16} />
                        {activePlan === "plus" && isPremium 
                          ? i18n.t("auto.z_\uD504\uB9AC\uBBF8\uC5C4\uD61C\uD0DD\uC801\uC6A9\uC911", "Premium 혜택 적용 중") 
                          : `${t("auto.g_0098", "현재")} ${activePlan === "premium" ? "Premium" : "Plus"} ${t("auto.g_0099", "구독 중")}`
                        }
                      </p>
                    </div>
                  ) : (
                    <>
                      <motion.button
                        id="migo-plus-subscribe-btn"
                        whileTap={{ scale: 0.97 }}
                        disabled={loading}
                        onClick={handleActivate}
                        className={`w-full py-4 rounded-2xl text-white font-extrabold text-base shadow-float flex items-center justify-center gap-2 disabled:opacity-60 ${
                          activePlan === "premium"
                            ? "bg-gradient-to-r from-amber-500 to-orange-500"
                            : "bg-gradient-to-r from-emerald-500 to-blue-500"
                        }`}
                      >
                        {loading
                          ? <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                          : <>{activePlan === "premium" ? <Crown size={18} /> : <Sparkles size={18} />}
                            {i18n.language?.startsWith('ko') ? '구독하기' : 'Subscribe'}
                          </>
                        }
                      </motion.button>
                      {/* 구매 복원 버튼 (Apple 가이드라인 요구사항) */}
                      <button
                        onClick={handleRestore}
                        disabled={restoring}
                        className="w-full py-2 mt-1 text-center text-[11px] text-muted-foreground font-medium flex items-center justify-center gap-1.5 disabled:opacity-60"
                      >
                        {restoring
                          ? <div className="w-3 h-3 rounded-full border border-muted-foreground/40 border-t-muted-foreground animate-spin" />
                          : <RefreshCw size={11} />}
                        {t('iap.restore', 'Restore Purchase')}
                      </button>
                      {/* Apple Guideline 3.1.1: 구독 관리 링크 (필수) — 구독 중이면 이탈 방지 팝업 거침 */}
                      {(isPlus || isPremium) ? (
                        <button
                          onClick={() => setShowCancelGuard(true)}
                          className="block w-full text-center text-[10px] text-primary underline mt-1"
                        >
                          {t("auto.g_0101", "구독 관리 · App Store에서 취소하기")}
                        </button>
                      ) : (
                        <a
                          href="https://apps.apple.com/account/subscriptions"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-center text-[10px] text-primary underline mt-1"
                        >
                          {t("auto.g_0101", "구독 관리 · App Store에서 취소하기")}
                        </a>
                      )}
                    </>
                  )}
                </div>
              </>
            )}


          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    <CancelGuardModal
      isOpen={showCancelGuard}
      onClose={() => setShowCancelGuard(false)}
      onProceed={() => {
        setShowCancelGuard(false);
        window.open("https://apps.apple.com/account/subscriptions", "_blank", "noopener");
      }}
      onKeep={() => setShowCancelGuard(false)}
    />
    </>,
    document.body
  );

  return (
    <>
      {portal}
      {/* ── 해지 이탈 방지 팝업 ── */}
      <CancelRetentionModal
        isOpen={showRetention}
        onKeep={() => setShowRetention(false)}
        onConfirmClose={() => { setShowRetention(false); onClose(); }}
        plan={activePlan}
      />
    </>
  );
};

export default MigoPlusModal;