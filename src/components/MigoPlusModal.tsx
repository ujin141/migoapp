import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Star, Zap, Eye, Filter, Crown, Check, Sparkles,
  Users, Globe, MessageCircle, Shield, Dna, Clock,
  MapPin, Heart, Lock, ChevronRight, Bot, Headphones,
  Palette, Award, Infinity as InfinityIcon
} from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getMigoPlusPricing, getLocalizedPrice } from "@/lib/pricing";
import { supabase } from "@/lib/supabaseClient";

interface MigoPlusModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlan?: "plus" | "premium";
}

// ── 결제 수단 ──────────────────────────────────────────────
const PAYMENT_METHODS = [
  { id: "kakao",  emoji: "💛", label: i18n.t("auto.g_0109", "카카오페이"),  color: "bg-yellow-400/10 border-yellow-400/30 text-yellow-600" },
  { id: "toss",   emoji: "🔵", label: i18n.t("auto.g_0110", "토스페이"),    color: "bg-blue-500/10 border-blue-500/30 text-blue-600" },
  { id: "card",   emoji: "💳", label: i18n.t("auto.g_0111", "신용/체크카드"), color: "bg-muted border-border text-foreground" },
];

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
  const { isPlus, isPremium, upgradePlus } = useSubscription();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  // 탭: plus | premium
  const [activePlan, setActivePlan] = useState<"plus" | "premium">(defaultPlan);
  // 기간 선택 (Plus만 해당)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "quarterly" | "yearly">("quarterly");
  // 결제 단계: plan → method → confirm → done
  const [step, setStep] = useState<"plan" | "method" | "confirm" | "done">("plan");
  const [method, setMethod] = useState("kakao");
  const [loading, setLoading] = useState(false);

  const pricing = getMigoPlusPricing();

  // ── 선택한 플랜의 금액 계산 ──────────────────────────────
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

  // ── 결제 처리 ────────────────────────────────────────────
  const handlePay = async () => {
    if (!user) {
      toast({ title: t("auto.g_0002", "로그인이 필요합니다"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const monthsMap = { monthly: 1, quarterly: 3, yearly: 12 };
      const months = activePlan === "premium" ? 1 : monthsMap[billingCycle];
      const expiresAt = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString();

      await Promise.all([
        supabase.from("payments").insert({
          user_id: user.id,
          group_id: `subscription_${activePlan}`,
          amount: selectedKrw,
          method,
          status: "pending",
          created_at: new Date().toISOString(),
        }),
        supabase.from("profiles").update({
          is_plus: true,
          plan: activePlan,
          plus_expires_at: expiresAt,
        }).eq("id", user.id),
        supabase.from("subscriptions").insert({
          user_id: user.id,
          plan: activePlan,
          status: "active",
          expires_at: expiresAt,
          price_krw: selectedKrw,
        }),
      ]);

      await upgradePlus(activePlan);
      setStep("done");
      setTimeout(() => {
        onClose();
        setStep("plan");
        toast({
          title: activePlan === "premium" ? t("auto.g_0003", "🎉 Premium 활성화!") : t("auto.g_0004", "✨ Plus 활성화!"),
          description: t("auto.g_0005", "모든 혜택을 지금 바로 누려보세요!"),
        });
      }, 1800);
    } catch {
      toast({ title: t("auto.g_0006", "결제 중 오류가 발생했습니다"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("plan");
    onClose();
  };

  // ── 현재 이미 구독 중인지 ────────────────────────────────
  const alreadySubscribed =
    (activePlan === "plus" && isPlus && !isPremium) ||
    (activePlan === "premium" && isPremium);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={handleClose} />

          <motion.div
            className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-t-3xl shadow-float flex flex-col"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            style={{ maxHeight: "92vh" }}
          >
            {/* ── 드래그 핸들 + 닫기 ── */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10"
            >
              <X size={15} className="text-muted-foreground" />
            </button>

            {/* ── DONE 화면 ── */}
            {step === "done" && (
              <motion.div
                className="flex flex-col items-center justify-center py-16 gap-4 px-5"
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              >
                <motion.div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: activePlan === "premium" ? "linear-gradient(135deg,#f59e0b,#ef4444)" : "linear-gradient(135deg,#34D399,#3B82F6)" }}
                  animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5 }}
                >
                  <Check size={40} className="text-white" strokeWidth={3} />
                </motion.div>
                <p className="text-xl font-extrabold text-foreground truncate">
                  {activePlan === "premium" ? t("auto.g_0157", "Premium 시작!") : t("auto.g_0158", "Plus 시작!")}
                </p>
                <p className="text-sm text-muted-foreground truncate">{t("auto.g_0086", "모든 혜택이 활성화되었습니다 🎉")}</p>
              </motion.div>
            )}

            {/* ── PLAN 선택 화면 ── */}
            {step === "plan" && (
              <>
                {/* 플랜 탭 */}
                <div className="px-5 pt-2 pb-3 shrink-0">
                  <div className="flex gap-2 p-1 bg-muted rounded-2xl">
                    <button
                      onClick={() => setActivePlan("plus")}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold transition-all ${
                        activePlan === "plus"
                          ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md"
                          : "text-muted-foreground"
                      }`}
                    >
                      ✨ Plus
                    </button>
                    <button
                      onClick={() => setActivePlan("premium")}
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
                <div className="flex-1 overflow-y-auto min-h-0 px-5 space-y-4 pb-4 truncate">

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
                        <div className="flex gap-2 truncate">
                          {(["monthly", "quarterly", "yearly"] as const).map((cycle) => {
                            const p = plusPrices[cycle];
                            return (
                              <button
                                key={cycle}
                                onClick={() => setBillingCycle(cycle)}
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
                                  {getLocalizedPrice(p.krw, i18n.language)}
                                </p>
                                {cycle !== "monthly" && (
                                  <p className="text-[9px] text-muted-foreground mt-0.5 truncate">
                                    {t("auto.g_0089", "월")}{getLocalizedPrice(Math.round(p.krw / (cycle === "quarterly" ? 3 : 12)), i18n.language)}
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
                        <div className="rounded-2xl border border-border overflow-hidden truncate">
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
                          <span className="text-2xl font-extrabold">₩99,900</span>
                          <span className="text-white/70 text-xs ml-1 truncate">{t("auto.g_0093", "/ 월")}</span>
                        </div>
                      </div>

                      {/* Plus 포함 안내 */}
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <Check size={14} className="text-emerald-500 shrink-0" />
                        <p className="text-xs font-bold text-emerald-600 truncate">{t("auto.g_0094", "Plus의 모든 기능 포함 + Premium 전용 혜택")}</p>
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
                                <p className="text-[10px] text-muted-foreground mt-0.5">{f.desc}</p>
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
                <div className="px-5 py-4 border-t border-border bg-card shrink-0 truncate">
                  {alreadySubscribed ? (
                    <div className="w-full py-4 rounded-2xl bg-emerald-500/10 text-center">
                      <p className="text-emerald-600 font-bold flex items-center justify-center gap-2 truncate">
                        <Crown size={16} />
                        {t("auto.g_0098", "현재")}{activePlan === "premium" ? "Premium" : "Plus"} {t("auto.g_0099", "구독 중")}</p>
                    </div>
                  ) : (
                    <>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setStep("method")}
                        className="w-full py-4 rounded-2xl text-white font-extrabold text-base shadow-lg flex items-center justify-center gap-2"
                        style={{
                          background: activePlan === "premium"
                            ? "linear-gradient(135deg,#f59e0b,#ef4444)"
                            : "linear-gradient(135deg,#34D399,#3B82F6)",
                          boxShadow: activePlan === "premium"
                            ? "0 8px 24px rgba(245,158,11,0.4)"
                            : "0 8px 24px rgba(52,211,153,0.4)",
                        }}
                      >
                        {activePlan === "premium" ? <Crown size={18} /> : <Sparkles size={18} />}
                        {getLocalizedPrice(selectedKrw, i18n.language)} · {selectedLabel} {t("auto.g_0100", "시작하기")}<ChevronRight size={16} />
                      </motion.button>
                      <p className="text-center text-[10px] text-muted-foreground mt-2 truncate">
                        {t("auto.g_0101", "언제든지 취소 가능 · 자동 갱신")}</p>
                    </>
                  )}
                </div>
              </>
            )}

            {/* ── METHOD 선택 ── */}
            {step === "method" && (
              <>
                <div className="px-5 py-4 border-b border-border shrink-0">
                  <h2 className="text-base font-extrabold text-foreground truncate">{t("auto.g_0102", "결제 수단 선택")}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activePlan === "premium" ? "👑 Migo Premium" : "✨ Migo Plus"} · {selectedLabel} ·{" "}
                    {getLocalizedPrice(selectedKrw, i18n.language)}
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-2 truncate">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                        method === m.id ? m.color + " ring-1 ring-primary/30" : "bg-muted border-border text-muted-foreground"
                      }`}
                    >
                      <span className="text-xl">{m.emoji}</span>
                      <span className="text-sm font-bold flex-1 text-left">{m.label}</span>
                      {method === m.id && <Check size={14} className="text-primary" />}
                    </button>
                  ))}
                </div>
                <div className="px-5 py-4 border-t border-border bg-card shrink-0 flex gap-3">
                  <button
                    onClick={() => setStep("plan")}
                    className="flex-1 py-3.5 rounded-2xl bg-muted text-foreground font-bold text-sm"
                  >
                    {t("auto.g_0103", "이전")}</button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setStep("confirm")}
                    className="flex-1 py-3.5 rounded-2xl gradient-primary text-white font-extrabold text-sm flex items-center justify-center gap-1.5"
                  >
                    {t("auto.g_0104", "확인")}<ChevronRight size={14} />
                  </motion.button>
                </div>
              </>
            )}

            {/* ── CONFIRM ── */}
            {step === "confirm" && (
              <>
                <div className="px-5 py-4 border-b border-border shrink-0">
                  <h2 className="text-base font-extrabold text-foreground truncate">{t("auto.g_0105", "결제 확인")}</h2>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-0 truncate">
                  {[
                    [t("auto.g_0159", "플랜"), activePlan === "premium" ? "👑 Migo Premium" : "✨ Migo Plus"],
                    [t("auto.g_0160", "구독 기간"), selectedLabel],
                    [t("auto.g_0161", "결제 수단"), PAYMENT_METHODS.find((m) => m.id === method)?.label ?? method],
                    [t("auto.g_0162", "결제 금액"), getLocalizedPrice(selectedKrw, i18n.language)],
                  ].map(([label, value], i, arr) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between py-3.5 ${i < arr.length - 1 ? "border-b border-border/40" : ""}`}
                    >
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className={`text-sm font-bold ${i === arr.length - 1 ? "text-base text-primary" : "text-foreground"}`}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-4 border-t border-border bg-card shrink-0 flex gap-3">
                  <button
                    onClick={() => setStep("method")}
                    className="flex-1 py-3.5 rounded-2xl bg-muted text-foreground font-bold text-sm"
                  >
                    {t("auto.g_0106", "이전")}</button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    disabled={loading}
                    onClick={handlePay}
                    className="flex-1 py-3.5 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{
                      background: activePlan === "premium"
                        ? "linear-gradient(135deg,#f59e0b,#ef4444)"
                        : "linear-gradient(135deg,#34D399,#3B82F6)",
                    }}
                  >
                    {loading
                      ? <><div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />{t("auto.g_0107", "결제 중")}</>
                      : <><Lock size={14} />{getLocalizedPrice(selectedKrw, i18n.language)} {t("auto.g_0108", "결제")}</>
                    }
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MigoPlusModal;