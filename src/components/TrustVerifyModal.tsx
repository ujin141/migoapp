import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, CheckCircle, Trophy, Phone, Fingerprint, Camera, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
interface TrustVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel?: "none" | "basic" | "id" | "top";
  phoneVerified?: boolean;
  ticketVerified?: boolean;
}
const levelOrder = {
  none: 0,
  basic: 1,
  id: 2,
  top: 3
};
const TrustVerifyModal = ({
  isOpen,
  onClose,
  currentLevel = "none",
  phoneVerified = false,
  ticketVerified = false
}: TrustVerifyModalProps) => {
  const {
    t
  } = useTranslation();
  // LEVELS must be inside component so i18n.t() is properly scoped
  const getArr = (k: string, fb: any[]) => {
    const v = i18n.t(k, {
      returnObjects: true
    });
    return Array.isArray(v) && v.length ? v : fb;
  };
  const levelTexts = getArr("trustModal.levels", [{
    label: i18n.t("auto.g_0286", "Lv1 베이직"),
    sub: i18n.t("auto.g_0287", "본인 인증"),
    desc: i18n.t("auto.g_0288", "가입 시 휴대폰 번호로 자동 부여됩니다."),
    how: i18n.t("auto.g_0289", "휴대폰 번호 인증")
  }, {
    label: i18n.t("auto.g_0290", "Lv2 프라임"),
    sub: i18n.t("auto.g_0291", "신분증 인증"),
    desc: i18n.t("auto.g_0292", "정부 발급 신분증으로 본인 확인"),
    how: i18n.t("auto.g_0293", "앱 내 신분증 사진 제출")
  }, {
    label: i18n.t("auto.g_0294", "Lv3 골드"),
    sub: i18n.t("auto.g_0295", "심층 인증"),
    desc: i18n.t("auto.g_0296", "재직증명서·학위증·소득증빙 등 심층 서류"),
    how: i18n.t("auto.g_0297", "증빙 서류 제출")
  }]);
  const LEVELS = [{
    key: "basic",
    badge: "✅",
    bgClass: "bg-sky-500/20 border-sky-500/30",
    textClass: "text-sky-500",
    icon: <Phone size={20} className="text-sky-500" />,
    label: levelTexts[0]?.label ?? i18n.t("auto.g_0298", "기본 인증"),
    sublabel: levelTexts[0]?.sub ?? i18n.t("auto.g_0299", "전화번호 인증"),
    desc: levelTexts[0]?.desc ?? "",
    how: levelTexts[0]?.how ?? ""
  }, {
    key: "id",
    badge: "🪪",
    bgClass: "bg-violet-500/20 border-violet-500/30",
    textClass: "text-violet-500",
    icon: <Camera size={20} className="text-violet-500" />,
    label: levelTexts[1]?.label ?? i18n.t("auto.g_0300", "본인 확인"),
    sublabel: levelTexts[1]?.sub ?? i18n.t("auto.g_0301", "신분증 인증"),
    desc: levelTexts[1]?.desc ?? "",
    how: levelTexts[1]?.how ?? ""
  }, {
    key: "top",
    badge: "🏆",
    bgClass: "bg-amber-500/20 border-amber-500/30",
    textClass: "text-amber-400",
    icon: <Trophy size={20} className="text-amber-400" />,
    label: levelTexts[2]?.label ?? i18n.t("auto.g_0302", "최고 신뢰"),
    sublabel: levelTexts[2]?.sub ?? i18n.t("auto.g_0303", "전체 인증 완료"),
    desc: levelTexts[2]?.desc ?? "",
    how: levelTexts[2]?.how ?? ""
  }];
  const {
    user
  } = useAuth();
  const [submitting, setSubmitting] = useState<string | null>(null);
  const handleRequest = async (levelKey: string) => {
    if (!user) {
      toast({
        title: i18n.t("alert.t9Title"),
        variant: "destructive"
      });
      return;
    }

    // basic은 전화번호 인증으로 자동 부여
    if (levelKey === "basic") {
      toast({
        title: i18n.t("auto.g_0007", "기본 인증은 자동 부여됩니다"),
        description: i18n.t("auto.g_0008", "전화번호 인증 완료 시 자동으로 뱃지가 부여됩니다.")
      });
      return;
    }
    setSubmitting(levelKey);
    try {
      const {
        error
      } = await supabase.from("reports").insert({
        type: "user",
        target_id: user.id,
        reported_id: user.id,
        reporter_id: user.id,
        reason: i18n.t("auto.t_0015", `[인증 요청] ${levelKey}`),
        status: "pending"
      });
      if (error) throw error;
      toast({
        title: levelKey === "id" ? i18n.t("auto.g_0009", "🪪 신분증 인증 신청 완료!") : i18n.t("auto.g_0010", "🏆 최고 신뢰 인증 신청 완료!"),
        description: i18n.t("auto.g_0011", "운영자가 검토 후 1-3일 내 결과를 알려드립니다.")
      });
    } catch (err: any) {
      console.error("ID Verify Request Error:", err);
      toast({
        title: i18n.t("alert.t10Title"),
        variant: "destructive"
      });
    } finally {
      setSubmitting(null);
    }
  };
  const currentOrder = levelOrder[currentLevel];
  return <AnimatePresence>
      {isOpen && <motion.div className="fixed inset-0 z-[80] flex items-end justify-center px-safe pb-safe pt-safe" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }}>
          <div className="absolute inset-0 bg-foreground/60 backdrop-blur-md" onClick={onClose} />
          <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 shadow-float max-h-[88vh] flex flex-col" initial={{
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
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b border-border/30">
              <div>
                <h2 className="text-base font-extrabold text-foreground truncate">{i18n.t("auto.g_0304", "신뢰 인증 관리")}</h2>
                <p className="text-xs text-muted-foreground truncate">{i18n.t("auto.g_0305", "인증 단계가 높을수록 매칭 우선순위가 올라가요")}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3 truncate">
              {/* Current status */}
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-muted mb-4">
                <Shield size={15} className="text-primary shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground truncate">{i18n.t("auto.g_0306", "현재 인증 상태")}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {currentLevel === "none" ? i18n.t("auto.g_0307", "미인증 — 인증을 시작하세요") : currentLevel === "basic" ? i18n.t("auto.g_0308", "기본 인증 완료 ✅") : currentLevel === "id" ? i18n.t("auto.g_0309", "본인 확인 완료 🪪") : i18n.t("auto.g_0310", "최고 신뢰 인증 완료 🏆")}
                  </p>
                </div>
              </div>

              {LEVELS.map((level, idx) => {
            const isCompleted = levelOrder[level.key] <= currentOrder && currentLevel !== "none";
            const isNext = levelOrder[level.key] === currentOrder + 1;
            const isLocked = levelOrder[level.key] > currentOrder + 1;
            return <motion.div key={level.key} className={`p-4 rounded-2xl border ${level.bgClass} ${isLocked ? "opacity-50" : ""}`} initial={{
              opacity: 0,
              y: 10
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: idx * 0.05
            }}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${level.bgClass} flex items-center justify-center shrink-0`}>
                        {isCompleted ? <CheckCircle size={20} className={level.textClass} /> : level.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-sm font-bold text-foreground">{level.badge} {level.label}</span>
                          {isCompleted && <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${level.bgClass} ${level.textClass}`}>{i18n.t("auto.g_0311", "완료")}</span>}
                          {isNext && <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary truncate">{i18n.t("auto.g_0312", "다음 단계")}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{level.sublabel}</p>
                        <p className="text-[11px] text-foreground/70 mt-1.5 leading-relaxed">{level.desc}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">📋 {level.how}</p>
                      </div>
                    </div>
                    {!isCompleted && !isLocked && <motion.button whileTap={{
                scale: 0.97
              }} onClick={() => handleRequest(level.key)} disabled={!!submitting} className={`mt-3 w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${level.key === "basic" ? "bg-muted text-muted-foreground" : `gradient-primary text-primary-foreground shadow-card`} disabled:opacity-60`}>
                        {submitting === level.key ? <span className="truncate">{i18n.t("auto.g_0313", "처리 중...")}</span> : level.key === "basic" ? <><Phone size={12} />{i18n.t("auto.g_0314", "전화번호 인증 (자동 부여)")}</> : level.key === "id" ? <><Camera size={12} />{i18n.t("auto.g_0315", "신분증 인증 신청")}<ChevronRight size={12} /></> : <><Camera size={12} />{i18n.t("auto.g_0316", "얼굴 인증 요청")}<ChevronRight size={12} /></>}
                      </motion.button>}
                  </motion.div>;
          })}

              {/* Ticket Verification (Real Traveler) */}
              <motion.div className={`p-4 rounded-2xl border bg-emerald-500/10 border-emerald-500/30 mt-4`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0`}>
                    {ticketVerified ? <CheckCircle size={20} className="text-emerald-500" /> : <span className="text-2xl">✈️</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm font-bold text-foreground truncate">{i18n.t("auto.g_0279", "✈️ 리얼 트래블러 (Real Traveler)")}</span>
                      {ticketVerified ? (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 truncate">{i18n.t("auto.g_0280", "인증완료")}</span>
                      ) : (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary truncate">{i18n.t("auto.g_0281", "추가인증")}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{i18n.t("auto.g_0282", "실제 여행자임을 증명하고 매칭률 300% 상승!")}</p>
                    <p className="text-[11px] text-foreground/70 mt-1.5 leading-relaxed truncate">{i18n.t("auto.g_0283", "E-티켓 또는 예약 내역을 캡처하여 업로드하면 홀로그램 인증 배지를 부여해 드립니다.")}</p>
                  </div>
                </div>
                {!ticketVerified && (
                  <motion.button 
                    whileTap={{ scale: 0.97 }} 
                    onClick={() => handleRequest("ticket")} 
                    disabled={!!submitting} 
                    className="mt-3 w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all gradient-primary text-primary-foreground shadow-card disabled:opacity-60"
                  >
                    {submitting === "ticket" ? <span className="truncate">{i18n.t("auto.g_0284", "처리 중...")}</span> : <><Camera size={12} /> {i18n.t("auto.g_0285", "E-티켓 업로드하기")}<ChevronRight size={12} /></>}
                  </motion.button>
                )}
              </motion.div>

              <p className="text-[10px] text-center text-muted-foreground pb-4 pt-2 truncate">{i18n.t("auto.g_0317", "제출된 정보는 인증 목적으로만 활용되며 안전하게 보호됩니다.")}</p>
            </div>
          </motion.div>
        </motion.div>}
    </AnimatePresence>;
};
export default TrustVerifyModal;