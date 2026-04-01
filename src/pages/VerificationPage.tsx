import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shield, Check, ChevronDown, Phone, Mail, CreditCard, Instagram, Star, Clock, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import traveler1 from "@/assets/traveler-1.jpg";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { useSubscription } from "@/context/SubscriptionContext";
import { Crown } from "lucide-react";

// ─── Country codes ───
const getCountryCodes = (t: any) => [{
  flag: "🇰🇷",
  name: "South Korea",
  code: "+82"
}, {
  flag: "🇺🇸",
  name: "United States",
  code: "+1"
}, {
  flag: "🇯🇵",
  name: "Japan",
  code: "+81"
}, {
  flag: "🇨🇳",
  name: "China",
  code: "+86"
}, {
  flag: "🇬🇧",
  name: "United Kingdom",
  code: "+44"
}, {
  flag: "🇦🇺",
  name: "Australia",
  code: "+61"
}, {
  flag: "🇨🇦",
  name: "Canada",
  code: "+1"
}, {
  flag: "🇩🇪",
  name: "Germany",
  code: "+49"
}, {
  flag: "🇫🇷",
  name: "France",
  code: "+33"
}, {
  flag: "🇸🇬",
  name: t("login.nat65"),
  code: "+65"
}, {
  flag: "🇹🇭",
  name: t("login.nat66"),
  code: "+66"
}, {
  flag: "🇻🇳",
  name: t("login.nat84"),
  code: "+84"
}, {
  flag: "🇮🇩",
  name: t("login.nat62"),
  code: "+62"
}, {
  flag: "🇲🇾",
  name: t("login.nat60"),
  code: "+60"
}, {
  flag: "🇵🇭",
  name: t("login.nat63"),
  code: "+63"
}, {
  flag: "🇧🇷",
  name: t("login.nat55"),
  code: "+55"
}, {
  flag: "🇲🇽",
  name: t("login.nat52"),
  code: "+52"
}, {
  flag: "🇪🇸",
  name: t("login.nat34"),
  code: "+34"
}, {
  flag: "🇮🇹",
  name: t("login.nat39"),
  code: "+39"
}, {
  flag: "🇮🇳",
  name: "India",
  code: "+91"
}];

// ─── Types ───
type VerifStatus = "none" | "pending" | "done";
interface VerifItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
  badge: string;
  points: number; // trust score added
  color: string;
  bgColor: string;
}

// ─── Verification items ───
const getVerifItems = (t: any): VerifItem[] => [{
  id: "phone",
  icon: <Phone size={20} />,
  label: "Phone Verification",
  desc: t("verif.phoneDesc"),
  badge: t("verif.phoneBadge"),
  points: 15,
  color: "text-emerald-400",
  bgColor: "bg-emerald-500/10 border-emerald-500/30"
}, {
  id: "email",
  icon: <Mail size={20} />,
  label: t("verif.emailLabel"),
  desc: t("verif.emailDesc"),
  badge: t("verif.emailBadge"),
  points: 10,
  color: "text-sky-400",
  bgColor: "bg-sky-500/10 border-sky-500/30"
}, {
  id: "id",
  icon: <CreditCard size={20} />,
  label: t("verif.idLabel"),
  desc: t("verif.idDesc"),
  badge: t("verif.idBadge"),
  points: 40,
  color: "text-violet-400",
  bgColor: "bg-violet-500/10 border-violet-500/30"
}, {
  id: "sns",
  icon: <Instagram size={20} />,
  label: t("verif.snsLabel"),
  desc: t("verif.snsDesc"),
  badge: t("verif.snsBadge"),
  points: 15,
  color: "text-pink-400",
  bgColor: "bg-pink-500/10 border-pink-500/30"
}, {
  id: "review",
  icon: <Star size={20} />,
  label: t("verif.reviewLabel"),
  desc: t("verif.reviewDesc"),
  badge: t("verif.reviewBadge"),
  points: 20,
  color: "text-amber-400",
  bgColor: "bg-amber-500/10 border-amber-500/30"
}];

// Trust level labels
const getTrustLevel = (score: number, t: any) => {
  if (score >= 90) return {
    label: t("verif.scoreHighest"),
    emoji: "🏆",
    color: "text-amber-400"
  };
  if (score >= 70) return {
    label: t("verif.scoreHigh"),
    emoji: "🛡️",
    color: "text-violet-400"
  };
  if (score >= 40) return {
    label: t("verif.scoreVerified"),
    emoji: "✅",
    color: "text-emerald-400"
  };
  if (score >= 15) return {
    label: t("verif.scoreBasic"),
    emoji: "📱",
    color: "text-sky-400"
  };
  return {
    label: t("verif.scoreNone"),
    emoji: "❓",
    color: "text-muted-foreground"
  };
};

// ─── ID Upload Modal ───
const IdUploadModal = ({
  onClose,
  onDone,
  userId
}: {
  onClose: () => void;
  onDone: () => void;
  userId: string;
}) => {
  const {
    t
  } = useTranslation();
  const {
    canPriorityPassport
  } = useSubscription();
  const [step, setStep] = useState<"guide" | "upload" | "pending">("guide");
  const [idType, setIdType] = useState("");
  const idTypes = [t('verif.id.type1', t("auto.z_autoz\uC8FC\uBBFC\uB4F1\uB85D\uC99D_1")), t('verif.id.type2', t("auto.z_autoz\uC6B4\uC804\uBA74\uD5C8\uC99D_2")), t('verif.id.type3', t("auto.z_autoz\uC5EC\uAD8C3_3"))];
  const idTips = [t('verif.id.tip1', t("auto.z_autoz\uBE5B\uBC18\uC0AC\uAC00\uC5C6_4")), t('verif.id.tip2', t("auto.z_autoz\uC5B4\uB450\uC6B4\uBC30\uACBD_5")), t('verif.id.tip3', t("auto.z_autoz\uC8FC\uBBFC\uB4F1\uB85D\uBC88_6"))];
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const pickFile = (side: "front" | "back") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      if (side === "front") {
        setFrontFile(file);
        setFrontPreview(url);
      } else {
        setBackFile(file);
        setBackPreview(url);
      }
    };
    input.click();
  };
  const handleSubmit = async () => {
    if (!frontFile) {
      toast({
        title: t('verif.id.needFront'),
        variant: "destructive"
      });
      return;
    }
    setUploading(true);
    try {
      // 앞면 업로드
      const frontExt = frontFile.name.split(".").pop();
      const frontPath = `id-docs/${userId}_front_${Date.now()}.${frontExt}`;
      const {
        error: frontErr
      } = await supabase.storage.from("avatars").upload(frontPath, frontFile, {
        upsert: true,
        contentType: frontFile.type
      });
      if (frontErr) throw frontErr;
      const {
        data: frontUrlData
      } = supabase.storage.from("avatars").getPublicUrl(frontPath);

      // 뒷면 업로드(선택)
      let backUrl: string | null = null;
      if (backFile) {
        const backExt = backFile.name.split(".").pop();
        const backPath = `id-docs/${userId}_back_${Date.now()}.${backExt}`;
        const {
          error: backErr
        } = await supabase.storage.from("avatars").upload(backPath, backFile, {
          upsert: true,
          contentType: backFile.type
        });
        if (!backErr) {
          const {
            data: backUrlData
          } = supabase.storage.from("avatars").getPublicUrl(backPath);
          backUrl = backUrlData.publicUrl;
        }
      }

      // id_verifications 테이블 INSERT
      const {
        error: insertErr
      } = await supabase.from("id_verifications").insert({
        user_id: userId,
        id_type: idType,
        front_url: frontUrlData.publicUrl,
        back_url: backUrl,
        status: "pending"
      });
      if (insertErr) throw insertErr;
      setStep("pending");
      setTimeout(() => {
        onDone();
      }, 2000);
    } catch (e: any) {
      toast({
        title: t('verif.id.uploadFail'),
        description: e.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  return <motion.div className="fixed inset-0 z-[80] flex items-end justify-center px-safe pb-safe pt-safe" initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} exit={{
    opacity: 0
  }}>
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-md" onClick={onClose} />
      <motion.div className="relative z-10 w-full bg-card rounded-3xl mb-4 sm:mb-8 p-6 max-h-[85vh] overflow-y-auto" initial={{
      y: "100%"
    }} animate={{
      y: 0
    }} exit={{
      y: "100%"
    }} transition={{
      type: "spring",
      damping: 25
    }}>
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-5" />

        {step === "guide" && <>
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4 mx-auto">
            <CreditCard size={26} className="text-violet-400" />
          </div>
          <h3 className="text-lg font-extrabold text-foreground text-center mb-1">{t('verif.id.title')}</h3>
          <p className="text-sm text-muted-foreground text-center mb-5">{t('verif.id.desc')}</p>

          <div className="space-y-2 mb-5">
            {idTypes.map(typeItem => <button key={typeItem} onClick={() => setIdType(typeItem)} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${idType === typeItem ? "border-primary bg-primary/5" : "border-border bg-muted/30"}`}>
                <span className="text-sm font-bold text-foreground">{typeItem}</span>
                {idType === typeItem && <Check size={16} className="text-primary" />}
              </button>)}
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-3 mb-5">
            <ul className="space-y-1.5">
              {idTips.map(tip => <li key={tip} className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Check size={10} className="text-amber-500 shrink-0" /> {tip}
                </li>)}
            </ul>
          </div>

          <motion.button whileTap={{
          scale: 0.97
        }} onClick={() => idType ? setStep("upload") : toast({
          title: t('verif.id.selectType'),
          variant: "destructive"
        })} className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-extrabold">
            {t("verif.next")}
          </motion.button>
        </>}

        {step === "upload" && <>
          <h3 className="text-lg font-extrabold text-foreground text-center mb-1">{t('verif.id.upload', {
            type: idType
          })}</h3>
          <p className="text-sm text-muted-foreground text-center mb-5">{t('verif.id.uploadDesc')}</p>

          {/* Front */}
          <div className="mb-4">
            <p className="text-xs font-bold text-muted-foreground mb-2">{t('verif.id.front')} <span className="text-destructive">{t('verif.id.frontRequired')}</span></p>
            <button onClick={() => pickFile("front")} className={`w-full aspect-video rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${frontPreview ? "border-primary/40" : "border-border bg-muted"}`}>
              {frontPreview ? <img src={frontPreview} alt="front" className="w-full h-full object-cover" /> : <div className="text-center"><CreditCard size={32} className="text-muted-foreground mx-auto mb-2" /><p className="text-xs text-muted-foreground">{t('verif.id.tapFront')}</p></div>}
            </button>
          </div>

          {/* Back */}
          <div className="mb-5">
            <p className="text-xs font-bold text-muted-foreground mb-2">{t('verif.id.back')} <span className="text-muted-foreground/60">{t('verif.id.backOptional')}</span></p>
            <button onClick={() => pickFile("back")} className={`w-full h-28 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${backPreview ? "border-primary/40" : "border-border bg-muted"}`}>
              {backPreview ? <img src={backPreview} alt="back" className="w-full h-full object-cover" /> : <p className="text-xs text-muted-foreground">{t('verif.id.tapBack')}</p>}
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep("guide")} className="flex-1 py-3 rounded-2xl border border-border text-foreground font-semibold text-sm">{t('verif.id.prev')}</button>
            <motion.button whileTap={{
            scale: 0.97
          }} disabled={uploading || !frontFile} onClick={handleSubmit} className="flex-1 py-3 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-sm disabled:opacity-60">
              {uploading ? t('verif.id.uploading') : t('verif.id.submit')}
            </motion.button>
          </div>
        </>}

        {step === "pending" && <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Clock size={32} className="text-amber-500" />
            </div>
            <p className="text-base font-bold text-foreground">{t('verif.id.pendingTitle')}</p>
            <p className="text-sm text-muted-foreground text-center">{t('verif.id.pendingDesc')}</p>
          </div>}
      </motion.div>
    </motion.div>;
};

// ─── Main Page ───
const VerificationPage = () => {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const getArr = (k: string, fb: string[]) => {
    const v = t(k, {
      returnObjects: true
    });
    return Array.isArray(v) && v.length ? v : fb;
  };
  const idTypes = getArr('verif.id.idTypes', [t("auto.z_autoz주민등록증_7"), t("auto.z_autoz운전면허증_8"), t("auto.z_autoz여권3_9")]);
  const idTips = getArr('verif.id.tips', [t("auto.z_autoz만료되지않_10"), t("auto.z_autoz사진이선명_11"), t("auto.z_autoz개인정보는_12"), t("auto.z_autoz인증후원본_13")]);
  const {
    user,
    session
  } = useAuth();
  const supaUser = session?.user;
  const [statuses, setStatuses] = useState<Record<string, VerifStatus>>({
    phone: "none",
    email: "none",
    id: "none",
    sns: "none",
    review: "none"
  });
  const [dbTrustScore, setDbTrustScore] = useState(0);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // DB에서 실제 인증 현황 로드
  React.useEffect(() => {
    const fetchVerifStatus = async () => {
      if (!user) return;
      const {
        data
      } = await supabase.from('profiles').select('phone_verified, email_verified, id_verified, sns_connected, review_verified, trust_score, photo_url, photo_urls').eq('id', user.id).single();
      if (data) {
        setDbTrustScore(data.trust_score ?? 0);
        const bestPhoto = (data.photo_urls && data.photo_urls.length > 0) ? data.photo_urls[0] : data.photo_url;
        if (bestPhoto) setProfilePhoto(bestPhoto);
        
        const newStatuses: Record<string, VerifStatus> = {
          phone: data.phone_verified ? 'done' : supaUser?.phone ? 'done' : 'none',
          email: data.email_verified ? 'done' : supaUser?.email_confirmed_at ? 'done' : 'none',
          id: data.id_verified ? 'done' : 'none',
          sns: data.sns_connected ? 'done' : 'none',
          review: data.review_verified ? 'done' : 'none'
        };
        setStatuses(newStatuses);
      }
      // 여행 후기 자동 체크: meet_reviews >= 3
      const {
        count
      } = await supabase.from('meet_reviews').select('id', {
        count: 'exact',
        head: true
      }).eq('target_id', user.id);
      if ((count ?? 0) >= 3) {
        await supabase.from('profiles').update({
          review_verified: true
        }).eq('id', user.id);
        await recalcTrustScore(user.id);
        setStatuses(s => ({
          ...s,
          review: 'done'
        }));
      }
    };
    fetchVerifStatus();
  }, [user]);

  // trust_score DB 업데이트 풨퍼 함수
  const recalcTrustScore = async (userId: string) => {
    const {
      data
    } = await supabase.from('profiles').select('phone_verified, email_verified, id_verified, sns_connected, review_verified').eq('id', userId).single();
    if (!data) return;
    const score = (data.phone_verified ? 15 : 0) + (data.email_verified ? 10 : 0) + (data.id_verified ? 40 : 0) + (data.sns_connected ? 15 : 0) + (data.review_verified ? 20 : 0);
    await supabase.from('profiles').update({
      trust_score: score
    }).eq('id', userId);
    setDbTrustScore(score);
  };
  const [showIdModal, setShowIdModal] = useState(false);
  const [emailStep, setEmailStep] = useState<"idle" | "sent" | "done">("idle");
  const [emailCode, setEmailCode] = useState("");

  // ─ Phone verification state ─
  const [phoneStep, setPhoneStep] = useState<"idle" | "input" | "sent" | "done">("idle");
  const COUNTRY_CODES = getCountryCodes(t);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const VERIF_ITEMS = getVerifItems(t);
  const trustScore = VERIF_ITEMS.reduce((sum, item) => {
    return sum + (statuses[item.id] === "done" ? item.points : 0);
  }, 0);
  const maxScore = VERIF_ITEMS.reduce((sum, item) => sum + item.points, 0);
  const trustLevel = getTrustLevel(trustScore, t);

  // 무해한 Lock 탈취 에러 발생 시 자동으로 최대 3번까지 재시도하는 래퍼 함수
  const withRetry = async <T,>(fn: () => Promise<{
    data?: T;
    error?: any;
  }>): Promise<{
    data: T | null;
    error: any;
  }> => {
    let lastError: any = null;
    for (let i = 0; i < 3; i++) {
      try {
        const {
          data,
          error
        } = await fn();
        if (error && error.message && error.message.toLowerCase().includes("lock") && error.message.toLowerCase().includes("stole it")) {
          lastError = error;
          await new Promise(res => setTimeout(res, 400));
          continue;
        }
        return {
          data: data ?? null,
          error
        };
      } catch (err: any) {
        if (err.message && err.message.toLowerCase().includes("lock") && err.message.toLowerCase().includes("stole it")) {
          lastError = err;
          await new Promise(res => setTimeout(res, 400));
          continue;
        }
        return {
          data: null,
          error: err
        };
      }
    }
    return {
      data: null,
      error: lastError
    };
  };

  // ─ SMS 발송 (Supabase Phone Auth) ─
  const sendPhoneOtp = async () => {
    const digits = phoneNumber.replace(/\D/g, "").replace(/^0/, ""); // 010 → 10
    if (digits.length < 7) {
      toast({
        title: t('login.needPhone'),
        variant: "destructive"
      });
      return;
    }
    const fullPhone = `${selectedCountry.code}${digits}`;
    setPhoneLoading(true);
    try {
      const {
        error: upErr
      } = await Promise.race([withRetry(() => supabase.auth.updateUser({
        phone: fullPhone
      })), new Promise<{
        error: any;
      }>(res => setTimeout(() => res({
        error: {
          message: "TIMEOUT"
        }
      }), 8000))]);
      if (upErr && upErr.message !== "TIMEOUT") {
        throw upErr;
      }
      setPhoneStep("sent");
      toast({
        title: t('login.otpSent'),
        description: t('login.otpSentDesc', {
          phone: fullPhone
        })
      });
    } catch (e: unknown) {
      let msg = e instanceof Error ? e.message : t('verif.phone.failSend');
      if (msg.includes("already been registered")) msg = t('verif.phone.alreadyLinked');
      if (msg.toLowerCase().includes("lock") && msg.toLowerCase().includes("stole it")) {
        toast({
          title: t('verif.phone.delay'),
          description: t('verif.phone.delayDesc'),
          variant: "destructive"
        });
      } else {
        toast({
          title: t('verif.phone.failSend'),
          description: msg,
          variant: "destructive"
        });
      }
    } finally {
      setPhoneLoading(false);
    }
  };

  // ─ OTP 검증 (Supabase Phone Auth) ─
  const verifyPhoneOtp = async () => {
    if (phoneOtp.length !== 6) {
      toast({
        title: t('login.needOtp'),
        variant: "destructive"
      });
      return;
    }
    const fullPhone = `${selectedCountry.code}${phoneNumber.replace(/\D/g, "").replace(/^0/, "")}`;
    setPhoneLoading(true);
    try {
      const {
        error: verErr
      } = await Promise.race([withRetry(() => supabase.auth.verifyOtp({
        phone: fullPhone,
        token: phoneOtp,
        type: "phone_change"
      })), new Promise<{
        error: any;
      }>(res => setTimeout(() => res({
        error: {
          message: t("verif.timeoutError")
        }
      }), 8000))]);
      if (verErr) throw verErr;
      // 프로필 phone 업데이트
      if (user) {
        await supabase.from('profiles').update({
          phone: fullPhone,
          phone_verified: true
        }).eq('id', user.id);
        await recalcTrustScore(user.id);
      }
      setPhoneStep("done");
      setStatuses(s => ({
        ...s,
        phone: "done"
      }));
      toast({
        title: t('verif.phone.done')
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("verif.otpError");
      if (msg.toLowerCase().includes("lock") && msg.toLowerCase().includes("stole it")) {
        toast({
          title: t('verif.phone.delay'),
          description: t('verif.phone.delayDesc'),
          variant: "destructive"
        });
      } else {
        toast({
          title: t('login.otpFail'),
          description: msg,
          variant: "destructive"
        });
      }
    } finally {
      setPhoneLoading(false);
    }
  };
  const handleVerify = async (id: string) => {
    if (statuses[id] === "done") return;
    if (id === "phone") {
      setPhoneStep("input");
      return;
    }
    if (id === "id") {
      setShowIdModal(true);
      return;
    }
    if (id === "email") {
      if (!user?.email) {
        toast({
          title: t('verif.email.noEmail'),
          description: t('verif.email.noEmailDesc'),
          variant: "destructive"
        });
        return;
      }
      if (emailStep === "idle") {
        const {
          error
        } = await supabase.auth.signInWithOtp({
          email: user.email
        });
        if (error) {
          toast({
            title: t('verif.email.mailFail'),
            description: error.message,
            variant: "destructive"
          });
          return;
        }
        setEmailStep("sent");
        toast({
          title: t('verif.email.mailSent'),
          description: t('verif.email.mailSentDesc')
        });
      }
      return;
    }
    if (id === "sns") {
      const handle = window.prompt('verif.sns.prompt');
      if (!handle?.trim()) return;
      if (!user) return;
      await supabase.from('profiles').update({
        sns_handle: handle.trim(),
        sns_connected: true
      }).eq('id', user.id);
      await recalcTrustScore(user.id);
      setStatuses(s => ({
        ...s,
        sns: 'done'
      }));
      toast({
        title: t('verif.sns.done'),
        description: t('verif.sns.doneDesc', {
          handle: handle.trim()
        })
      });
      return;
    }
    if (id === "review") {
      if (!user) return;
      const {
        count
      } = await supabase.from('meet_reviews').select('id', {
        count: 'exact',
        head: true
      }).eq('target_id', user.id);
      if ((count ?? 0) >= 3) {
        await supabase.from('profiles').update({
          review_verified: true
        }).eq('id', user.id);
        await recalcTrustScore(user.id);
        setStatuses(s => ({
          ...s,
          review: 'done'
        }));
        toast({
          title: t('verif.review.done')
        });
      } else {
        toast({
          title: t('verif.review.progress', {
            count: count ?? 0
          })
        });
      }
      return;
    }
  };
  const verifyEmail = async () => {
    if (emailCode.length !== 6) {
      toast({
        title: t('login.needOtp'),
        variant: "destructive"
      });
      return;
    }
    if (!user?.email) return;
    const {
      error
    } = await supabase.auth.verifyOtp({
      email: user.email,
      token: emailCode,
      type: 'email'
    });
    if (error) {
      toast({
        title: t('verif.email.codeFail'),
        description: t('verif.email.codeFailDesc'),
        variant: "destructive"
      });
      return;
    }
    setEmailStep("done");
    setStatuses(s => ({
      ...s,
      email: "done"
    }));
    // email_verified DB 업데이트 + trust_score 재계산
    if (user) {
      await supabase.from('profiles').update({
        email_verified: true
      }).eq('id', user.id);
      await recalcTrustScore(user.id);
    }
    toast({
      title: t('verif.email.done')
    });
  };
  return <div className="min-h-screen bg-background safe-bottom">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft size={16} className="text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-foreground">{t('verif.title')}</h1>
          <p className="text-xs text-muted-foreground">{t('verif.subtitle')}</p>
        </div>
      </div>

      {/* Trust Score Card */}
      <div className="mx-5 mb-5">
        <div className="bg-card rounded-3xl p-5 shadow-card">
          <div className="flex items-center gap-4 mb-4">
            {/* Profile */}
            <div className="relative">
              <img src={profilePhoto || user?.photoUrl || traveler1} alt="" className="w-16 h-16 rounded-2xl object-cover" />
              {trustScore >= 40 && <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full gradient-primary flex items-center justify-center border-2 border-card">
                  <Shield size={12} className="text-primary-foreground" />
                </div>}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-extrabold text-foreground">{t('verif.myScore')}</p>
                <span className={`text-sm font-extrabold ${trustLevel.color}`}>{trustLevel.emoji} {trustLevel.label}</span>
              </div>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-3xl font-extrabold text-foreground">{trustScore}</span>
                <span className="text-sm text-muted-foreground mb-1">/ {maxScore}</span>
              </div>
              {/* Progress bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full gradient-primary" initial={{
                width: 0
              }} animate={{
                width: `${trustScore / maxScore * 100}%`
              }} transition={{
                type: "spring",
                damping: 20
              }} />
              </div>
            </div>
          </div>

          {/* Completed badges */}
          <div className="flex flex-wrap gap-2">
            {getVerifItems(t).filter(item => statuses[item.id] === "done").map(item => <span key={item.id} className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-extrabold ${item.bgColor} ${item.color}`}>
                <Check size={9} /> {t(`verif.items.${item.id}.badge`)}
              </span>)}
            {getVerifItems(t).filter(item => statuses[item.id] === "done").length === 0 && <span className="text-xs text-muted-foreground">{t('verif.noVerif')}</span>}
          </div>
        </div>
      </div>

      {/* Verification items */}
      <div className="px-5 space-y-2 pb-24">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">{t('verif.section')}</p>
        {getVerifItems(t).map(item => {
        const status = statuses[item.id];
        return <motion.div key={item.id} whileTap={{
          scale: status !== "done" ? 0.98 : 1
        }} className="bg-card rounded-2xl shadow-card overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                {/* Icon */}
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${item.bgColor} ${item.color}`}>
                  {item.icon}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">{t(`verif.items.${item.id}.label`)}</p>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${item.bgColor} border ${item.color}`}>+{item.points}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(`verif.items.${item.id}.desc`)}</p>
                </div>
                {/* Status */}
                {status === "done" ? <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <Check size={16} className="text-white" />
                  </div> : status === "pending" ? <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Clock size={14} className="text-amber-500" />
                  </div> : <button onClick={() => handleVerify(item.id)} className="shrink-0 px-3 py-1.5 rounded-xl gradient-primary text-primary-foreground text-xs font-bold shadow-card">
                    {t("auto.j543")}
                  </button>}
              </div>

              {/* Phone sub-input */}
              {item.id === "phone" && (phoneStep === "input" || phoneStep === "sent") && statuses.phone !== "done" && <motion.div initial={{
            height: 0
          }} animate={{
            height: "auto"
          }} className="border-t border-border px-4 pb-4 pt-3 overflow-hidden">
                  {phoneStep === "input" && <>
                      <p className="text-xs text-muted-foreground mb-2">{t('verif.phone.guide')}</p>
                      <div className="flex gap-2 mb-2">
                        {/* Country code picker */}
                        <button onClick={() => setShowCountryPicker(v => !v)} className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-bold text-foreground shrink-0">
                          <span>{selectedCountry.flag}</span>
                          <span>{selectedCountry.code}</span>
                          <ChevronDown size={12} className="text-muted-foreground" />
                        </button>
                        <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/[^\d]/g, ""))} placeholder="010-0000-0000" className="flex-1 bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground font-mono outline-none" />
                      </div>
                      {/* Country picker dropdown */}
                      {showCountryPicker && <div className="max-h-44 overflow-y-auto mb-2 rounded-xl border border-border bg-card shadow-card">
                          {getCountryCodes(t).map(c => <button key={`${c.code}-${c.name}`} onClick={() => {
                  setSelectedCountry(c);
                  setShowCountryPicker(false);
                }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-sm text-foreground">
                              <span>{c.flag}</span>
                              <span className="font-semibold">{c.name}</span>
                              <span className="text-muted-foreground ml-auto">{c.code}</span>
                            </button>)}
                        </div>}
                      <button onClick={sendPhoneOtp} disabled={phoneLoading} className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground text-xs font-bold disabled:opacity-60">
                        {phoneLoading ? t('verif.phone.sending') : t('verif.phone.send')}
                      </button>
                    </>}
                  {phoneStep === "sent" && <>
                      <p className="text-xs text-muted-foreground mb-2">
                        <span className="font-bold text-foreground">{selectedCountry.code} {phoneNumber}</span> {t('verif.phone.sent', {
                  phone: ``
                })}
                      </p>
                      <div className="flex gap-2 mb-2">
                        <input type="text" inputMode="numeric" value={phoneOtp} onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6} className="flex-1 bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground text-center tracking-[0.3em] font-mono outline-none" />
                        <button onClick={verifyPhoneOtp} disabled={phoneLoading} className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold disabled:opacity-60">
                          {phoneLoading ? t('verif.phone.verifying') : t('verif.phone.verify')}
                        </button>
                      </div>
                      <button onClick={() => setPhoneStep("input")} className="text-xs text-muted-foreground underline">
                        {t("auto.j544")}
                      </button>
                    </>}
                </motion.div>}

              {/* Email sub-input */}
              {item.id === "email" && emailStep === "sent" && statuses.email !== "done" && <motion.div initial={{
            height: 0
          }} animate={{
            height: "auto"
          }} className="border-t border-border px-4 pb-4 pt-3">
                  <p className="text-xs text-muted-foreground mb-2">{t('verif.email.sent')}</p>
                  <div className="flex gap-2">
                    <input type="text" value={emailCode} onChange={e => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6} className="flex-1 bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground text-center tracking-widest font-mono outline-none" />
                    <button onClick={verifyEmail} className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold">{t('verif.email.verify')}</button>
                  </div>
                </motion.div>}
            </motion.div>;
      })}

        {/* Privacy note */}
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-primary/5 border border-primary/20 mt-2">
          <Lock size={13} className="text-primary shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {t('verif.privacyNote')}
          </p>
        </div>
      </div>

      {/* ID Modal */}
      <AnimatePresence>
        {showIdModal && <IdUploadModal onClose={() => setShowIdModal(false)} userId={user?.id ?? ""} onDone={async () => {
        setShowIdModal(false);
        setStatuses(s => ({
          ...s,
          id: 'pending' as any
        }));
        toast({
          title: t('verif.reviewDone'),
          description: t('verif.reviewDoneDesc')
        });
      }} />}
      </AnimatePresence>
    </div>;
};
export default VerificationPage;