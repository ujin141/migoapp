import i18n from "@/i18n";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Calendar, Users, Lock, Check, AlertCircle, CreditCard } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import PaymentModal from "@/components/PaymentModal";
interface GroupCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (group: any) => void;
}

import { getGroupCreationFeeOptions } from "@/lib/pricing";
const GroupCreateModal = ({
  isOpen,
  onClose,
  onCreated
}: GroupCreateModalProps) => {
  const {
    t
  } = useTranslation();
  const {
    user
  } = useAuth();

  // 폼 상태
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [dates, setDates] = useState("");
  const [description, setDescription] = useState("");
  const [maxMembers, setMaxMembers] = useState(6);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // 개설비 (호스트 결제)
  const pricingOptions = getGroupCreationFeeOptions();
  const CREATION_FEE_OPTIONS = pricingOptions.options.map(val => ({
    label: pricingOptions.format(val),
    value: val
  }));
  const [creationFee, setCreationFee] = useState(pricingOptions.options[0]);

  // 개설비 결제 모달
  const [showPayForCreation, setShowPayForCreation] = useState(false);
  const [pendingGroupData, setPendingGroupData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const reset = () => {
    setTitle("");
    setDestination("");
    setDates("");
    setDescription("");
    setMaxMembers(6);
    setTags([]);
    setTagInput("");
    setCreationFee(pricingOptions.options[0]);
    setPendingGroupData(null);
  };
  const handleClose = () => {
    reset();
    onClose();
  };
  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, "");
    if (t && !tags.includes(t) && tags.length < 5) setTags(prev => [...prev, t]);
    setTagInput("");
  };
  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: t("alert.t1Title"),
        variant: "destructive"
      });
      return;
    }
    if (!title.trim() || !destination.trim() || !dates.trim()) {
      toast({
        title: t("alert.t2Title"),
        variant: "destructive"
      });
      return;
    }
    setSaving(true);
    const groupData = {
      title: title.trim(),
      destination: destination.trim(),
      dates: dates.trim(),
      description: description.trim(),
      max_members: maxMembers,
      tags,
      entry_fee: 0,
      creation_fee: creationFee,
      host_id: user.id,
      status: "draft",
      created_at: new Date().toISOString()
    };
    try {
      const {
        data,
        error
      } = await supabase.from("trip_groups").insert(groupData).select().single();
      if (error) throw error;
      if (creationFee > 0) {
        setPendingGroupData(data);
        setSaving(false);
        setShowPayForCreation(true);
      } else {
        toast({
          title: i18n.t("auto.z_autoz그룹이개설_1539"),
          description: i18n.t("auto.z_tmpl_1048", {
            defaultValue: i18n.t("auto.z_tmpl_1540", {
              defaultValue: i18n.t("auto.z_tmpl_1424", {
                defaultValue: `${title} is now public.`
              })
            })
          })
        });
        onCreated(data);
        reset();
        onClose();
        setSaving(false);
      }
    } catch (e: any) {
      toast({
        title: t("alert.t3Title")
      });
      setSaving(false);
    }
  };
  const handleCreationPaymentSuccess = async () => {
    if (!pendingGroupData) return;
    await supabase.from("trip_groups").update({
      status: "active"
    }).eq("id", pendingGroupData.id);
    toast({
      title: i18n.t("auto.z_autoz그룹이공개_1541"),
      description: i18n.t("auto.z_tmpl_1050", {
        defaultValue: i18n.t("auto.z_tmpl_1542", {
          defaultValue: i18n.t("auto.z_tmpl_1426", {
            defaultValue: `Creation fee ${pricingOptions.format(creationFee)} paid`
          })
        })
      })
    });
    onCreated(pendingGroupData);
    reset();
    onClose();
  };
  return <>
      <AnimatePresence>
        {isOpen && <motion.div className="fixed inset-0 z-[80] flex items-end justify-center px-safe pb-safe pt-safe" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }}>
            <div className="absolute inset-0 bg-foreground/70 backdrop-blur-md" onClick={handleClose} />
            <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 shadow-float max-h-[92vh] flex flex-col" initial={{
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
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/30 shrink-0">
                <div>
                  <h2 className="text-base font-extrabold text-foreground">{t("auto.z_autoz새여행그룹_1543")}</h2>
                  <p className="text-xs text-muted-foreground">{t("auto.z_autoz함께여행할_1544")}</p>
                </div>
                <button onClick={handleClose} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>

              {/* Form */}
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

                {/* 기본 정보 */}
                <div className="space-y-3">
                  <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide">{t("auto.z_autoz기본정보1_1545")}</p>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder={t("auto.z_autoz그룹명예방_1546")} className="w-full px-4 py-3 rounded-2xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50" />
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 flex-1 px-4 py-3 rounded-2xl bg-muted border border-border">
                      <MapPin size={14} className="text-muted-foreground shrink-0" />
                      <input value={destination} onChange={e => setDestination(e.target.value)} placeholder={t("auto.z_autoz목적지10_1547")} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                    </div>
                    <div className="flex items-center gap-2 flex-1 px-4 py-3 rounded-2xl bg-muted border border-border">
                      <Calendar size={14} className="text-muted-foreground shrink-0" />
                      <input value={dates} onChange={e => setDates(e.target.value)} placeholder={t("auto.z_autoz날짜예41_1548")} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                    </div>
                  </div>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t("auto.z_autoz그룹소개및_1549")} rows={3} className="w-full px-4 py-3 rounded-2xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50 resize-none" />
                </div>

                {/* 인원 */}
                <div>
                  <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide mb-2">{t("auto.z_autoz최대인원1_1550")}</p>
                  <div className="flex items-center gap-3">
                    <Users size={14} className="text-muted-foreground" />
                    {[2, 4, 6, 8, 10, 20].map(n => <button key={n} onClick={() => setMaxMembers(n)} className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${maxMembers === n ? "gradient-primary text-primary-foreground shadow-card" : "bg-muted text-muted-foreground"}`}>
                        {n}
                      </button>)}
                  </div>
                </div>

                {/* 태그 */}
                <div>
                  <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide mb-2">{t("auto.z_autoz태그최대5_1551")}</p>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {tags.map(t => <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                        #{t}
                        <button onClick={() => setTags(prev => prev.filter(x => x !== t))} className="text-primary/50 hover:text-primary">×</button>
                      </span>)}
                  </div>
                  <div className="flex gap-2">
                    <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }} placeholder={t("auto.z_autoz카페트레킹_1552")} className="flex-1 px-4 py-2.5 rounded-2xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                    <button onClick={addTag} className="px-4 py-2.5 rounded-2xl bg-primary/10 text-primary text-xs font-bold">{t("auto.z_autoz추가106_1553")}</button>
                  </div>
                </div>

                {/* 개설비 */}
                <div className="space-y-3">
                  <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide">{t("auto.z_autoz결제설정1_1554")}</p>
                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard size={14} className="text-amber-500" />
                      <p className="text-sm font-bold text-foreground">{t("auto.z_autoz개설비10_1555")}<span className="text-[10px] text-muted-foreground font-normal">{t("auto.z_autoz호스트결제_1556")}</span></p>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-3">{t("auto.z_autoz스팸방지및_1557")}</p>
                    <div className="flex gap-2 flex-wrap">
                      {pricingOptions.options.map(opt => <button key={opt} onClick={() => setCreationFee(opt)} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${creationFee === opt ? "bg-amber-500 text-white shadow-card" : "bg-muted text-muted-foreground"}`}>
                          {pricingOptions.format(opt)}
                        </button>)}
                    </div>
                    {creationFee > 0 && <p className="text-[10px] text-amber-600/80 mt-2 flex items-center gap-1">
                        <AlertCircle size={10} />{t("auto.z_autoz그룹저장후_1558")}{pricingOptions.format(creationFee)}{t("auto.z_autoz결제가진행_1559")}</p>}
                  </div>
                </div>

                {/* 개설비 요약 */}
                {creationFee > 0 && <div className="p-3 rounded-2xl bg-muted space-y-1">
                    <p className="text-[10px] font-extrabold text-muted-foreground mb-1">{t("auto.z_autoz결제요약1_1564")}</p>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{t("auto.z_autoz호스트개설_1565")}</span>
                      <span className="font-bold text-amber-500">{pricingOptions.format(creationFee)}</span>
                    </div>
                  </div>}
              </div>

              {/* Submit */}
              <div className="px-5 py-4 border-t border-border/30 shrink-0">
                <motion.button whileTap={{
              scale: 0.97
            }} disabled={saving} onClick={handleSubmit} className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-extrabold flex items-center justify-center gap-2 shadow-float disabled:opacity-60">
                  {saving ? t("auto.z_autoz저장중10_1568") : creationFee > 0 ? <><Lock size={14} /> {pricingOptions.format(creationFee)}{t("auto.z_autoz결제후공개_1569")}</> : <><Check size={14} />{t("auto.z_autoz무료로그룹_1570")}</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      {/* 개설비 결제 모달 */}
      <PaymentModal isOpen={showPayForCreation} onClose={() => {
      setShowPayForCreation(false);
      setPendingGroupData(null);
    }} groupTitle={t("auto.z_tmpl_1079", {
      defaultValue: t("auto.z_tmpl_1571", {
        defaultValue: t("auto.z_tmpl_1449", {
          defaultValue: `[Creation Fee] ${title}`
        })
      })
    })} groupId={pendingGroupData?.id ?? "creation"} entryFee={creationFee} onPaymentSuccess={handleCreationPaymentSuccess} />
    </>;
};
export default GroupCreateModal;