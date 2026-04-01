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
  phoneVerified = false
}: TrustVerifyModalProps) => {
  const {
    t
  } = useTranslation();
  // LEVELS must be inside component so t() is properly scoped
  const getArr = (k: string, fb: any[]) => {
    const v = t(k, {
      returnObjects: true
    });
    return Array.isArray(v) && v.length ? v : fb;
  };
  const levelTexts = getArr("trustModal.levels", [{
    label: t("auto.z_autozLv1베이_1298"),
    sub: t("auto.z_autoz본인인증9_1299"),
    desc: t("auto.z_autoz가입시휴대_1300"),
    how: t("auto.z_autoz휴대폰번호_1301")
  }, {
    label: t("auto.z_autozLv2프라_1302"),
    sub: t("auto.z_autoz신분증인증_1303"),
    desc: t("auto.z_autoz정부발급신_1304"),
    how: t("auto.z_autoz앱내신분증_1305")
  }, {
    label: t("auto.z_autozLv3골드_1306"),
    sub: t("auto.z_autoz심층인증9_1307"),
    desc: t("auto.z_autoz재직학위소_1308"),
    how: t("auto.z_autoz증빙서류제_1309")
  }]);
  const LEVELS = [{
    key: "basic",
    badge: "✅",
    bgClass: "bg-sky-500/20 border-sky-500/30",
    textClass: "text-sky-500",
    icon: <Phone size={20} className="text-sky-500" />,
    label: levelTexts[0]?.label ?? t("auto.z_autoz기본인증9_1310"),
    sublabel: levelTexts[0]?.sub ?? t("auto.z_autoz전화번호인_1311"),
    desc: levelTexts[0]?.desc ?? "",
    how: levelTexts[0]?.how ?? ""
  }, {
    key: "id",
    badge: "🪪",
    bgClass: "bg-violet-500/20 border-violet-500/30",
    textClass: "text-violet-500",
    icon: <Camera size={20} className="text-violet-500" />,
    label: levelTexts[1]?.label ?? t("auto.z_autoz본인확인9_1312"),
    sublabel: levelTexts[1]?.sub ?? t("auto.z_autoz신분증인증_1313"),
    desc: levelTexts[1]?.desc ?? "",
    how: levelTexts[1]?.how ?? ""
  }, {
    key: "top",
    badge: "🏆",
    bgClass: "bg-amber-500/20 border-amber-500/30",
    textClass: "text-amber-400",
    icon: <Trophy size={20} className="text-amber-400" />,
    label: levelTexts[2]?.label ?? t("auto.z_autoz최고신뢰9_1314"),
    sublabel: levelTexts[2]?.sub ?? t("auto.z_autoz전체인증완_1315"),
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
        title: t("alert.t9Title"),
        variant: "destructive"
      });
      return;
    }

    // basic은 전화번호 인증으로 자동 부여
    if (levelKey === "basic") {
      toast({
        title: i18n.t("auto.z_autoz기본인증안_1316"),
        description: i18n.t("auto.z_autoz전화번호인_1317")
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
        reason: i18n.t("auto.z_tmpl_987", {
          defaultValue: i18n.t("auto.z_tmpl_1318", {
            defaultValue: i18n.t("auto.z_tmpl_1142", {
              defaultValue: `[Verification Request] ${levelKey}`
            })
          })
        }),
        status: "pending"
      });
      if (error) throw error;
      toast({
        title: i18n.t("auto.z_tmpl_988", {
          defaultValue: i18n.t("auto.z_tmpl_1319", {
            defaultValue: i18n.t("auto.z_tmpl_1143", {
              defaultValue: `${levelKey === "id" ? "🪪 ID Verification" : "🏆 Top Trust"} request submitted!`
            })
          })
        }),
        description: i18n.t("auto.z_autoz운영자가2_1320")
      });
    } catch (err: any) {
      console.error("ID Verify Request Error:", err);
      toast({
        title: t("alert.t10Title"),
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
                <h2 className="text-base font-extrabold text-foreground">{t("auto.z_autoz신뢰인증관_1321")}</h2>
                <p className="text-xs text-muted-foreground">{t("auto.z_autoz인증단계가_1322")}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
              {/* Current status */}
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-muted mb-4">
                <Shield size={15} className="text-primary shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">{t("auto.z_autoz현재인증상_1323")}</p>
                  <p className="text-xs text-muted-foreground">
                    {currentLevel === "none" ? t("auto.z_autoz미인증인증_1324") : currentLevel === "basic" ? t("auto.z_autoz기본인증완_1325") : currentLevel === "id" ? t("auto.z_autoz본인확인완_1326") : t("auto.z_autoz최고신뢰완_1327")}
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
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">{level.badge} {level.label}</span>
                          {isCompleted && <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${level.bgClass} ${level.textClass}`}>{i18n.t("auto.z_autoz완료997_1328")}</span>}
                          {isNext && <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{i18n.t("auto.z_autoz다음단계9_1329")}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{level.sublabel}</p>
                        <p className="text-[11px] text-foreground/70 mt-1.5 leading-relaxed">{level.desc}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">📋 {level.how}</p>
                      </div>
                    </div>
                    {!isCompleted && !isLocked && <motion.button whileTap={{
                scale: 0.97
              }} onClick={() => handleRequest(level.key)} disabled={!!submitting} className={`mt-3 w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${level.key === "basic" ? "bg-muted text-muted-foreground" : `gradient-primary text-primary-foreground shadow-card`} disabled:opacity-60`}>
                        {submitting === level.key ? <span>{i18n.t("auto.z_autoz처리중99_1330")}</span> : level.key === "basic" ? <><Phone size={12} />{i18n.t("auto.z_autoz전화번호인_1331")}</> : level.key === "id" ? <><Camera size={12} />{i18n.t("auto.z_autoz신분증인증_1332")}<ChevronRight size={12} /></> : <><Camera size={12} />{i18n.t("auto.z_autoz얼굴인증요_1333")}<ChevronRight size={12} /></>}
                      </motion.button>}
                  </motion.div>;
          })}

              <p className="text-[10px] text-center text-muted-foreground pb-4 pt-2">{t("auto.z_autoz제출된정보_1334")}</p>
            </div>
          </motion.div>
        </motion.div>}
    </AnimatePresence>;
};
export default TrustVerifyModal;