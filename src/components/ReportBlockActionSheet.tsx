import i18n from "@/i18n";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { X, ShieldAlert, UserMinus, ChevronRight, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetType: "user" | "post" | "comment" | "group";
  targetId: string;
  targetName: string;
  authorId?: string; // 타겟의 작성자 ID (차단용)
}
const REPORT_REASONS = [] as string[]; // loaded via t()

const ReportBlockActionSheet: React.FC<Props> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName,
  authorId
}) => {
  const {
    t
  } = useTranslation();
  const {
    user
  } = useAuth();
  const [mode, setMode] = useState<"menu" | "report">("menu");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset mode when opened
  React.useEffect(() => {
    if (isOpen) setMode("menu");
  }, [isOpen]);
  const handleBlock = async () => {
    if (!user) {
      toast({
        title: t("reportBlock.loginRequired"),
        variant: "destructive"
      });
      return;
    }
    if (!authorId) return;
    if (!window.confirm(`${targetName}님을 차단하시겠습니까?\n서로의 게시물과 프로필이 보이지 않게 됩니다.`)) {
      return;
    }
    setIsSubmitting(true);
    // Ignore error if already blocked (unique constraint)
    await supabase.from("user_blocks").insert({
      blocker_id: user.id,
      blocked_id: authorId
    });
    setIsSubmitting(false);
    toast({
      title: t("alert.t4Title"),
      description: t("alert.t4Desc")
    });
    onClose();
  };
  const handleReport = async (reason: string) => {
    if (!user) {
      toast({
        title: t("reportBlock.loginRequired"),
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    const {
      error
    } = await supabase.from("reports").insert({
      type: targetType,
      target_id: targetId,
      reporter_id: user.id,
      reason: reason,
      status: "pending"
    });
    setIsSubmitting(false);
    if (error) {
      toast({
        title: t("alert.t5Title"),
        variant: "destructive"
      });
    } else {
      toast({
        title: t("alert.t6Title"),
        description: t("alert.t6Desc")
      });
      onClose();
    }
  };
  return <AnimatePresence>
      {isOpen && <motion.div className="fixed inset-0 z-[100] flex items-end justify-center px-safe pb-safe pt-safe" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }}>
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={onClose} />
          
          <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 pb-10 shadow-float" initial={{
        y: "100%"
      }} animate={{
        y: 0
      }} exit={{
        y: "100%"
      }} transition={{
        type: "spring",
        damping: 25,
        stiffness: 300
      }}>
            <div className="px-5 pt-4">
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
              
              <div className="flex items-center justify-between mb-4">
                {mode === "report" ? <button onClick={() => setMode("menu")} className="flex items-center gap-1 text-muted-foreground text-sm font-bold">
                    <ChevronRight size={18} className="rotate-180" />{"뒤로"}</button> : <h3 className="text-lg font-extrabold text-foreground">
                    {targetType === "user" ? `${targetName} 관리` : "게시물 관리"}
                  </h3>}
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-muted rounded-full">
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>

              {/* MENU MODE */}
              {mode === "menu" && <div className="space-y-3">
                  <button onClick={() => setMode("report")} className="w-full flex items-center justify-between p-4 rounded-2xl bg-muted hover:bg-border transition-colors text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                        <ShieldAlert size={20} className="text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{"신고하기1"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{"부적절한콘"}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-muted-foreground" />
                  </button>

                  {(targetType === "user" || authorId) && <button onClick={handleBlock} disabled={isSubmitting} className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 transition-colors text-left group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 group-hover:bg-red-500 transition-colors">
                          <UserMinus size={20} className="text-red-500 group-hover:text-white transition-colors" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-red-500">{"차단하기1"}</p>
                          <p className="text-xs text-red-500/70 mt-0.5">{"서로의활동"}</p>
                        </div>
                      </div>
                    </button>}
                </div>}

              {/* REPORT MODE */}
              {mode === "report" && <div className="space-y-3 mt-2">
                  <p className="text-sm font-bold text-foreground mb-4">{"어떤문제가"}</p>
                  <div className="space-y-2">
                    {(REPORT_REASONS.length > 0 ? REPORT_REASONS : ["스팸", "음란/불건전한 콘텐츠", "혐오성 언어", "개인정보 침해", "거짓 정보", "기타"]).map(reason => <button key={reason} onClick={() => handleReport(reason)} disabled={isSubmitting} className="w-full text-left px-4 py-3.5 rounded-xl bg-muted hover:bg-border active:scale-[0.98] transition-all flex items-center gap-3 text-sm font-medium text-foreground">
                        <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                        {reason}
                      </button>)}
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center mt-6">{"허위신고시"}</p>
                </div>}
            </div>
          </motion.div>
        </motion.div>}
    </AnimatePresence>;
};
export default ReportBlockActionSheet;