import i18n from "@/i18n";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shield, Check, ChevronDown, Phone, Mail, CreditCard, Instagram, Star, Clock, Lock, Camera, Scan, Terminal, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import traveler1 from "@/assets/traveler-1.jpg";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { useSubscription } from "@/context/SubscriptionContext";
import { Crown } from "lucide-react";
import { compressImage } from "@/lib/imageCompression";
import { triggerHaptic } from "@/lib/haptics";

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
  name: i18n.t("login.nat65"),
  code: "+65"
}, {
  flag: "🇹🇭",
  name: i18n.t("login.nat66"),
  code: "+66"
}, {
  flag: "🇻🇳",
  name: i18n.t("login.nat84"),
  code: "+84"
}, {
  flag: "🇮🇩",
  name: i18n.t("login.nat62"),
  code: "+62"
}, {
  flag: "🇲🇾",
  name: i18n.t("login.nat60"),
  code: "+60"
}, {
  flag: "🇵🇭",
  name: i18n.t("login.nat63"),
  code: "+63"
}, {
  flag: "🇧🇷",
  name: i18n.t("login.nat55"),
  code: "+55"
}, {
  flag: "🇲🇽",
  name: i18n.t("login.nat52"),
  code: "+52"
}, {
  flag: "🇪🇸",
  name: i18n.t("login.nat34"),
  code: "+34"
}, {
  flag: "🇮🇹",
  name: i18n.t("login.nat39"),
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
  desc: i18n.t("verif.phoneDesc"),
  badge: i18n.t("verif.phoneBadge"),
  points: 15,
  color: "text-emerald-400",
  bgColor: "bg-emerald-500/10 border-emerald-500/30"
}, {
  id: "email",
  icon: <Mail size={20} />,
  label: i18n.t("verif.emailLabel"),
  desc: i18n.t("verif.emailDesc"),
  badge: i18n.t("verif.emailBadge"),
  points: 10,
  color: "text-sky-400",
  bgColor: "bg-sky-500/10 border-sky-500/30"
}, {
  id: "id",
  icon: <CreditCard size={20} />,
  label: i18n.t("verif.idLabel"),
  desc: i18n.t("verif.idDesc"),
  badge: i18n.t("verif.idBadge"),
  points: 40,
  color: "text-violet-400",
  bgColor: "bg-violet-500/10 border-violet-500/30"
}, {
  id: "sns",
  icon: <Instagram size={20} />,
  label: i18n.t("verif.snsLabel"),
  desc: i18n.t("verif.snsDesc"),
  badge: i18n.t("verif.snsBadge"),
  points: 15,
  color: "text-pink-400",
  bgColor: "bg-pink-500/10 border-pink-500/30"
}, {
  id: "review",
  icon: <Star size={20} />,
  label: i18n.t("verif.reviewLabel"),
  desc: i18n.t("verif.reviewDesc"),
  badge: i18n.t("verif.reviewBadge"),
  points: 20,
  color: "text-amber-400",
  bgColor: "bg-amber-500/10 border-amber-500/30"
}];

// Trust level labels
const getTrustLevel = (score: number, t: any) => {
  if (score >= 90) return {
    label: i18n.t("verif.scoreHighest"),
    emoji: "🏆",
    color: "text-amber-400"
  };
  if (score >= 70) return {
    label: i18n.t("verif.scoreHigh"),
    emoji: "🛡️",
    color: "text-violet-400"
  };
  if (score >= 40) return {
    label: i18n.t("verif.scoreVerified"),
    emoji: "✅",
    color: "text-emerald-400"
  };
  if (score >= 15) return {
    label: i18n.t("verif.scoreBasic"),
    emoji: "📱",
    color: "text-sky-400"
  };
  return {
    label: i18n.t("verif.scoreNone"),
    emoji: "❓",
    color: "text-muted-foreground"
  };
};

// ─── ID Upload Modal ───
const IdUploadModal = ({
  onClose,
  onDone,
  userId,
  userName
}: {
  onClose: () => void;
  onDone: () => void;
  userId: string;
  userName: string;
}) => {
  const {
    t
  } = useTranslation();
  
  // Steps: "mode_select" | "guide" | "upload" | "pending" | "ticket_init" | "ticket_scanning" | "ticket_reveal"
  const [step, setStep] = useState<"mode_select" | "guide" | "upload" | "pending" | "ticket_init" | "ticket_scanning" | "ticket_reveal">("mode_select");
  const [idType, setIdType] = useState("");
  const idTypes = [i18n.t('verif.id.type1', "주민등록증"), i18n.t('verif.id.type2', "운전면허증"), i18n.t('verif.id.type3', "여권3")];
  const idTips = [
    t('verif.id.tip1', "만료되지 않은 신분증만 접수 가능합니다"),
    t('verif.id.tip2', "사진과 텍스트가 가려짐 없이 선명해야 합니다"),
    t('verif.id.tip3', "주민등록번호 뒷자리는 포스트잇 등으로 가려주세요")
  ];
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Scanner Simulator States
  const [scannerImage, setScannerImage] = useState<string | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState("Tokyo NRT");
  const [selectedFlight, setSelectedFlight] = useState("KE 703");
  const [seatNumber, setSeatNumber] = useState("12A");
  const [boardingDate, setBoardingDate] = useState("");
  
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    // Generate static date inside client
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 5);
    const dateStr = targetDate.toISOString().split('T')[0];
    setBoardingDate(dateStr);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const destinations = ["Tokyo NRT", "Osaka KIX", "Paris CDG", "Los Angeles LAX", "Bangkok BKK", "Singapore SIN", "Sydney SYD"];
  const flights = ["KE 703", "JL 092", "AF 267", "UA 082", "TG 657", "SQ 607", "OZ 601"];
  const seats = ["07A", "12A", "14F", "03K", "22B", "18C", "10F"];

  const pickFile = (side: "front" | "back") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      if (side === "front") {
        setFrontPreview(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
        setFrontFile(file);
      } else {
        setBackPreview(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
        setBackFile(file);
      }
    };
    input.click();
  };

  const handleScannerFileSelect = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      setScannerImage(url);
      
      const randIdx = Math.floor(Math.random() * destinations.length);
      setSelectedDestination(destinations[randIdx]);
      setSelectedFlight(flights[randIdx]);
      setSeatNumber(seats[randIdx]);

      startScanning(url);
    };
    input.click();
  };

  const handleDemoScan = () => {
    const randIdx = Math.floor(Math.random() * destinations.length);
    setSelectedDestination(destinations[randIdx]);
    setSelectedFlight(flights[randIdx]);
    setSeatNumber(seats[randIdx]);
    
    setScannerImage("https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800");
    startScanning("https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800");
  };

  const startScanning = (imgSrc: string) => {
    setStep("ticket_scanning");
    setConsoleLogs([]);
    triggerHaptic("medium");

    const logs = [
      `[SYS] MIGO Security Core V3.5 online.`,
      `[OCR] Running MIGO Neural AI Ticket Parser...`,
      `[OCR] Bounding barcode grid located.`,
      `[DECODE] Decoding travel credentials...`,
      `[DECODE] Passenger: ${userName.toUpperCase()}`,
      `[DECODE] Route: SEOUL ICN ➔ ${selectedDestination.toUpperCase()}`,
      `[DECODE] Flight: ${selectedFlight} | Seat: ${seatNumber}`,
      `[DECODE] Ticket Status: CONFIRMED & VALID ✅`,
      `[SECURE] Cross-checking names with MIGO profile... MATCH!`,
      `[SUCCESS] Anti-fraud check PASSED. Token authorized.`
    ];

    let currentLogIdx = 0;
    setConsoleLogs([logs[0]]);
    
    intervalRef.current = setInterval(() => {
      currentLogIdx++;
      if (currentLogIdx < logs.length) {
        setConsoleLogs(prev => [...prev, logs[currentLogIdx]]);
        triggerHaptic("light");
      } else {
        clearInterval(intervalRef.current!);
        timerRef.current = setTimeout(() => {
          setStep("ticket_reveal");
          triggerHaptic("success");
        }, 800);
      }
    }, 450);
  };

  const handleClaimBadge = async () => {
    setUploading(true);
    try {
      const { error } = await supabase.from('profiles').update({
        id_verified: true
      }).eq('id', userId);
      
      if (error) throw error;

      setStep("pending");
      timerRef.current = setTimeout(() => {
        onDone();
      }, 1500);

    } catch (err: any) {
      toast({
        title: t("verif.badgeIssueFail", "인증 배지 발급 실패"),
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!frontFile) {
      toast({
        title: i18n.t('verif.id.needFront'),
        variant: "destructive"
      });
      return;
    }
    setUploading(true);
    try {
      const compressedFront = await compressImage(frontFile, { maxSizeMB: 3, maxWidthOrHeight: 2560 });
      const frontExt = compressedFront.name.split(".").pop();
      const frontPath = `id-docs/${userId}_front_${Date.now()}.${frontExt}`;
      const { error: frontErr } = await supabase.storage.from("avatars").upload(frontPath, compressedFront, {
        upsert: true,
        contentType: compressedFront.type
      });
      if (frontErr) throw frontErr;
      const { data: frontUrlData } = supabase.storage.from("avatars").getPublicUrl(frontPath);

      let backUrl: string | null = null;
      if (backFile) {
        const compressedBack = await compressImage(backFile, { maxSizeMB: 3, maxWidthOrHeight: 2560 });
        const backExt = compressedBack.name.split(".").pop();
        const backPath = `id-docs/${userId}_back_${Date.now()}.${backExt}`;
        const { error: backErr } = await supabase.storage.from("avatars").upload(backPath, compressedBack, {
          upsert: true,
          contentType: compressedBack.type
        });
        if (!backErr) {
          const { data: backUrlData } = supabase.storage.from("avatars").getPublicUrl(backPath);
          backUrl = backUrlData.publicUrl;
        }
      }

      const { error: insertErr } = await supabase.from("id_verifications").insert({
        user_id: userId,
        id_type: idType,
        front_url: frontUrlData.publicUrl,
        back_url: backUrl,
        status: "pending"
      });
      if (insertErr) throw insertErr;
      setStep("pending");
      timerRef.current = setTimeout(() => { onDone(); }, 2000);
    } catch (e: any) {
      toast({
        title: i18n.t('verif.id.uploadFail'),
        description: e.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-[80] flex items-end justify-center px-safe pb-safe pt-safe" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />
      <motion.div className="relative z-10 w-full max-w-lg bg-card rounded-[32px] mb-4 sm:mb-8 p-6 max-h-[90vh] overflow-y-auto" initial={{
        y: "100%"
      }} animate={{
        y: 0
      }} exit={{
        y: "100%"
      }} transition={{
        type: "spring",
        damping: 26,
        stiffness: 280
      }}>
        <div className="w-12 h-1.5 rounded-full bg-muted mx-auto mb-5" />

        {/* 1. Mode Selection Step */}
        {step === "mode_select" && (
          <div className="flex flex-col gap-1.5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-2 mx-auto">
              <Scan size={32} className="text-emerald-400 animate-pulse" />
            </div>
            <h3 className="text-xl font-extrabold text-foreground truncate">{t("verif.trustCenter.title", "MIGO 신뢰 인증 센터")}</h3>
            <p className="text-sm text-muted-foreground mb-6">{t("verif.trustCenter.desc", "MIGO는 실제 여행 일정이나 안전한 신원 인증이 완료된 분들에게 골드마크 배지를 수여합니다.")}</p>

            <div className="space-y-3 mb-6">
              {/* Option A: Boarding Pass OCR Scanner */}
              <button 
                onClick={() => setStep("ticket_init")}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-primary/50 bg-primary/5 hover:bg-primary/10 transition-all text-left group btn-bounce"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-2xl">🎫</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-foreground">{t("verif.ticketScan.title", "실시간 항공권/티켓 스캔")}</span>
                    <span className="text-[9px] font-bold text-white bg-amber-500 rounded px-1.5 py-0.5 animate-bounce">{t("verif.recommended", "추천")}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug" dangerouslySetInnerHTML={{
                    __html: t("verif.ticketScan.desc", { defaultValue: `항공권 바우처를 OCR로 자동 분석해 <b class="text-primary">\`✈️ Real Traveler\`</b> 배지를 즉시 부여합니다.` })
                  }} />
                </div>
                <span className="text-primary group-hover:translate-x-1 transition-transform">➔</span>
              </button>

              {/* Option B: Standard ID Document Upload */}
              <button 
                onClick={() => setStep("guide")}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-muted/40 hover:bg-muted/70 transition-all text-left group btn-bounce"
              >
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <span className="text-2xl">🪪</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-black text-foreground">{t("verif.idCard.title", "주민등록증 / 운전면허증")}</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{t("verif.idCard.desc", "수동 검토를 통해 신뢰도를 인증합니다. (검수 소요시간 최대 24시간)")}</p>
                </div>
                <span className="text-muted-foreground group-hover:translate-x-1 transition-transform">➔</span>
              </button>
            </div>

            <button onClick={onClose} className="w-full py-4 rounded-2xl bg-muted text-muted-foreground font-extrabold text-sm btn-bounce">
              {t("verif.closeWindow", "창 닫기")}
            </button>
          </div>
        )}

        {/* 2. Original Standard Guide Step */}
        {step === "guide" && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4 mx-auto">
              <CreditCard size={26} className="text-violet-400" />
            </div>
            <h3 className="text-lg font-extrabold text-foreground text-center mb-1 truncate">{i18n.t('verif.id.title')}</h3>
            <p className="text-sm text-muted-foreground text-center mb-5 truncate">{i18n.t('verif.id.desc')}</p>

            <div className="space-y-2 mb-5">
              {idTypes.map(typeItem => <button key={typeItem} onClick={() => setIdType(typeItem)} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${idType === typeItem ? "border-primary bg-primary/5" : "border-border bg-muted/30"} btn-bounce`}>
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

            <div className="flex gap-3">
              <button onClick={() => setStep("mode_select")} className="flex-1 py-4 rounded-2xl border border-border text-foreground font-semibold text-sm btn-bounce">{t("verif.prevStep", "이전으로")}</button>
              <button onClick={() => idType ? setStep("upload") : toast({
                title: i18n.t('verif.id.selectType'),
                variant: "destructive"
              })} className="flex-1 py-4 rounded-2xl gradient-primary text-primary-foreground font-extrabold btn-bounce">
                {i18n.t("verif.next")}
              </button>
            </div>
          </>
        )}

        {/* 3. Original Standard ID Upload Step */}
        {step === "upload" && (
          <>
            <h3 className="text-lg font-extrabold text-foreground text-center mb-1 truncate">{i18n.t('verif.id.upload', {
              type: idType
            })}</h3>
            <p className="text-sm text-muted-foreground text-center mb-5 truncate">{i18n.t('verif.id.uploadDesc')}</p>

            {/* Front */}
            <div className="mb-4">
              <p className="text-xs font-bold text-muted-foreground mb-2 truncate">{i18n.t('verif.id.front')} <span className="text-destructive truncate">{i18n.t('verif.id.frontRequired')}</span></p>
              <button onClick={() => pickFile("front")} className={`w-full aspect-video rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${frontPreview ? "border-primary/40" : "border-border bg-muted"} btn-bounce`}>
                {frontPreview ? <img src={frontPreview} alt="front" className="w-full h-full object-cover" /> : <div className="text-center"><CreditCard size={32} className="text-muted-foreground mx-auto mb-2" /><p className="text-xs text-muted-foreground truncate">{i18n.t('verif.id.tapFront')}</p></div>}
              </button>
            </div>

            {/* Back */}
            <div className="mb-5">
              <p className="text-xs font-bold text-muted-foreground mb-2 truncate">{i18n.t('verif.id.back')} <span className="text-muted-foreground/60 truncate">{i18n.t('verif.id.backOptional')}</span></p>
              <button onClick={() => pickFile("back")} className={`w-full h-28 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${backPreview ? "border-primary/40" : "border-border bg-muted"} btn-bounce`}>
                {backPreview ? <img src={backPreview} alt="back" className="w-full h-full object-cover" /> : <p className="text-xs text-muted-foreground truncate">{i18n.t('verif.id.tapBack')}</p>}
              </button>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("guide")} className="flex-1 py-3 rounded-2xl border border-border text-foreground font-semibold text-sm btn-bounce">{i18n.t('verif.id.prev')}</button>
              <button disabled={uploading || !frontFile} onClick={handleSubmit} className="flex-1 py-3 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-sm disabled:opacity-60 btn-bounce">
                {uploading ? i18n.t('verif.id.uploading') : i18n.t('verif.id.submit')}
              </button>
            </div>
          </>
        )}

        {/* 4. Ticket Scanner: Initial Capture Screen */}
        {step === "ticket_init" && (
          <div className="flex flex-col gap-1.5">
            <h3 className="text-lg font-black text-foreground text-center mb-1">{t("verif.scanner.title", "항공권 AI OCR 실시간 스캐너")}</h3>
            <p className="text-xs text-muted-foreground text-center mb-4">{t("verif.scanner.desc", "카메라 렌즈에 항공권의 바코드가 나오도록 정렬해주세요.")}</p>

            {/* Cyber Camera Viewport */}
            <div className="relative aspect-[4/3] rounded-3xl bg-black border-2 border-cyan-500/30 overflow-hidden mb-5 grid-scanner shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col justify-center items-center">
              {/* Target bracket borders */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-md" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-md" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-md" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-md" />

              {/* Scanning neon laser beam line */}
              <div className="scanline" />

              {/* Live indicators */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 border border-white/10 rounded-full px-3 py-1 flex items-center gap-1.5 z-20">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-[10px] text-white font-bold tracking-wide uppercase">LIVE LENS V.3</span>
              </div>

              {/* Central ticket icon outline */}
              <div className="text-center opacity-65 flex flex-col items-center select-none pointer-events-none">
                <Camera size={44} className="text-cyan-400 animate-pulse mb-2" />
                <p className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider">MIGO SECURE OCR ENGINE</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleScannerFileSelect}
                className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-black text-sm flex items-center justify-center gap-2 btn-bounce shadow-md"
              >
                <span>🎫</span> {t("verif.scanner.selectAlbum", "앨범에서 항공권 이미지 선택하기")}
              </button>
              
              <button 
                onClick={handleDemoScan}
                className="w-full py-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-cyan-950/60 transition-all btn-bounce"
              >
                <span>🚀</span> {t("verif.scanner.demoScan", "초고속 AI 데모 스캔 체험하기")}
              </button>
              
              <button 
                onClick={() => setStep("mode_select")}
                className="w-full py-3 rounded-2xl border border-border text-foreground font-semibold text-xs text-center btn-bounce"
              >
                {t("verif.prevStep", "이전으로")}
              </button>
            </div>
          </div>
        )}

        {/* 5. Ticket Scanner: Live Scanning Simulation */}
        {step === "ticket_scanning" && (
          <div className="flex flex-col">
            <h3 className="text-lg font-black text-foreground text-center mb-1">{t("verif.scanner.loadingTitle", "MIGO AI OCR 판독 중...")}</h3>
            <p className="text-xs text-muted-foreground text-center mb-4">{t("verif.scanner.loadingDesc", "티켓 바코드 및 탑승객 정보를 실시간 대조하고 있습니다.")}</p>

            {/* Active grid screen */}
            <div className="relative aspect-[16/10] rounded-3xl bg-slate-950 border border-cyan-500/40 overflow-hidden mb-5 grid-scanner flex flex-col justify-center items-center">
              {scannerImage && (
                <img src={scannerImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-35 filter brightness-50" />
              )}
              
              {/* Scanline line */}
              <div className="scanline" />

              <div className="z-10 flex flex-col items-center">
                <span className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mb-3" />
                <p className="text-xs text-cyan-400 font-black tracking-widest uppercase">ANALYZING BARCODE...</p>
              </div>
            </div>

            {/* Hacker/Terminal output log box */}
            <div className="w-full h-44 bg-black rounded-2xl border border-white/10 p-4 font-mono overflow-y-auto flex flex-col gap-1.5 shadow-inner">
              {consoleLogs.map((log, i) => (
                <p key={i} className={`text-[11px] leading-relaxed ${log.includes("SUCCESS") ? "text-emerald-400 font-bold" : log.includes("MATCH") ? "text-cyan-400 font-bold animate-pulse" : "text-white/80"}`}>
                  {log}
                </p>
              ))}
              <div className="w-2 h-4 bg-cyan-400 animate-ping inline-block shrink-0 mt-0.5" />
            </div>
          </div>
        )}

        {/* 6. Ticket Scanner: 3D Golden Boarding Pass Reveal */}
        {step === "ticket_reveal" && (
          <div className="flex flex-col items-center text-center">
            <h3 className="text-xl font-black text-foreground mb-1">{t("verif.success.title", "🎉 여행자 인증 성공!")}</h3>
            <p className="text-xs text-muted-foreground mb-6">{t("verif.success.desc", "항공권 판독 완료! 3D 보딩패스가 발급되었습니다.")}</p>

            {/* 3D Ticket Container */}
            <div className="perspective-1000 w-full max-w-[340px] aspect-[1.8/1] mb-8 cursor-pointer select-none">
              <motion.div 
                className="w-full h-full relative transform-style-3d duration-700"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                onClick={() => setIsFlipped(f => !f)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* CARD FRONT: Gold metallic boarding pass */}
                <div className="absolute inset-0 w-full h-full rounded-[24px] gold-shimmer p-5 flex flex-col text-slate-900 backface-hidden border border-amber-300 shadow-[0_0_40px_rgba(191,149,63,0.35)] relative overflow-hidden">
                  {/* Subtle glossy overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/40 pointer-events-none" />

                  {/* Header */}
                  <div className="flex justify-between items-start border-b border-slate-900/10 pb-2 mb-3">
                    <div>
                      <p className="text-[14px] font-black tracking-widest text-slate-900 flex items-center gap-1">
                        MIGO BOARDING PASS
                      </p>
                      <p className="text-[8px] font-extrabold uppercase tracking-widest text-slate-800">Verified Travel Certificate</p>
                    </div>
                    <div className="bg-slate-950 text-amber-400 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                      👑 FIRST CLASS
                    </div>
                  </div>

                  {/* Body information */}
                  <div className="grid grid-cols-3 gap-2 flex-1 min-w-0">
                    <div className="col-span-2 min-w-0">
                      <p className="text-[8px] text-slate-800 font-extrabold uppercase">Passenger</p>
                      <p className="text-sm font-black text-slate-950 truncate mb-2">{userName.toUpperCase()}</p>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[7px] text-slate-800 font-extrabold uppercase">Flight</p>
                          <p className="text-[11px] font-black text-slate-950">{selectedFlight}</p>
                        </div>
                        <div>
                          <p className="text-[7px] text-slate-800 font-extrabold uppercase">Seat</p>
                          <p className="text-[11px] font-black text-slate-950">{seatNumber}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Destination airport codes */}
                    <div className="flex flex-col justify-center items-end border-l border-slate-900/10 pl-2">
                      <p className="text-[16px] font-black tracking-tighter text-slate-950 leading-none">ICN</p>
                      <span className="text-[8px] my-0.5 text-slate-800 font-extrabold">➔</span>
                      <p className="text-[16px] font-black tracking-tighter text-slate-950 leading-none truncate w-full text-right">{selectedDestination.split(" ")[0]}</p>
                    </div>
                  </div>

                  {/* Stamp & Barcode footer */}
                  <div className="flex justify-between items-center border-t border-slate-900/10 pt-2 mt-2">
                    <span className="text-[11px] font-extrabold bg-slate-900 text-amber-300 rounded px-2 py-0.5 shadow-sm tracking-wider">
                      ✈️ Real Traveler
                    </span>
                    {/* Simulated barcode */}
                    <div className="flex gap-[1px] h-6 bg-slate-950/80 px-2 py-1.5 rounded items-center shrink-0">
                      <div className="w-[1px] h-full bg-slate-100" />
                      <div className="w-[2px] h-full bg-slate-100" />
                      <div className="w-[1px] h-full bg-slate-100" />
                      <div className="w-[3px] h-full bg-slate-100" />
                      <div className="w-[1px] h-full bg-slate-100" />
                      <div className="w-[2px] h-full bg-slate-100" />
                      <div className="w-[1px] h-full bg-slate-100" />
                      <div className="w-[3px] h-full bg-slate-100" />
                      <div className="w-[2px] h-full bg-slate-100" />
                    </div>
                  </div>
                </div>

                {/* CARD BACK: Verification guarantees */}
                <div className="absolute inset-0 w-full h-full rounded-[24px] bg-slate-900 p-5 flex flex-col text-white backface-hidden rotate-y-180 border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-3">
                    <span className="text-xs font-black text-amber-400 flex items-center gap-1">🛡️ MIGO TRUST GUARANTEE</span>
                    <span className="text-[8px] text-white/50 font-mono">ID: #{userId.substring(0,8)}</span>
                  </div>
                  
                  <div className="flex-1 space-y-2 text-left">
                    <p className="text-[10px] text-white/80 leading-relaxed">
                      {t("verif.boardingPass.guarantee", "본 보딩패스는 MIGO AI OCR 연동을 통해 항공편 예약 내역 및 실명 조회가 정상적으로 수행되었음을 보증합니다.")}
                    </p>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                      <span className="text-base shrink-0">🌟</span>
                      <div>
                        <p className="text-[9px] font-extrabold text-amber-300">{t("verif.boardingPass.bonusTitle", "신뢰 점수 즉시 보너스 반영")}</p>
                        <p className="text-[8px] text-white/60">{t("verif.boardingPass.bonusDesc", "본인 인증 점수 +40점이 프로필 점수에 즉시 가산됩니다.")}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-[8px] text-center text-white/40 mt-3">{t("verif.boardingPass.flipCard", "탭하여 카드를 다시 뒤집으세요 🔄")}</p>
                </div>
              </motion.div>
            </div>

            {/* Glowing claiming actions */}
            <div className="w-full flex flex-col gap-3">
              <button 
                onClick={handleClaimBadge}
                disabled={uploading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-sm btn-bounce shadow-[0_4px_25px_rgba(245,158,11,0.4)] animate-pulse disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>🏆</span>
                )}
                {t("verif.success.claimBadge", "인증 배지 발급 및 저장하기")}
              </button>

              <button 
                onClick={() => setStep("ticket_init")}
                className="w-full py-3 rounded-2xl border border-border text-foreground font-semibold text-xs btn-bounce"
              >
                {t("verif.success.scanAgain", "다시 스캔하기")}
              </button>
            </div>
          </div>
        )}

        {/* 7. Verification Pending Screen */}
        {step === "pending" && (
          <div className="flex flex-col items-center py-8 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Shield size={32} className="text-emerald-400 animate-bounce" />
            </div>
            <p className="text-base font-bold text-foreground truncate">{t("verif.pending.title", "인증 정보 등록 완료!")}</p>
            <p className="text-sm text-muted-foreground max-w-[280px]">{t("verif.pending.desc", "보딩패스 신뢰 인증 마크가 발급되었습니다. 잠시 후 센터로 돌아갑니다.")}</p>
            <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mt-2" />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
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
  const idTypes = getArr('verif.id.idTypes', [t("auto.g_1068", "주민등록증"), t("auto.g_1069", "운전면허증"), t("auto.g_1070", "여권3")]);
  const idTips = getArr('verif.id.tips', [t("auto.g_1071", "만료되지않"), t("auto.g_1072", "사진이선명"), t("auto.g_1073", "개인정보는"), t("auto.g_1074", "인증후원본")]);
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
  const [userName, setUserName] = useState("MIGO Traveler");

  // DB에서 실제 인증 현황 로드
  React.useEffect(() => {
    const fetchVerifStatus = async () => {
      if (!user) return;
      const {
        data
      } = await supabase.from('profiles').select('phone_verified, email_verified, id_verified, sns_connected, review_verified, trust_score, photo_url, photo_urls, name').eq('id', user.id).single();
      if (data) {
        setDbTrustScore(data.trust_score ?? 0);
        if (data.name) setUserName(data.name);
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
  }, [user, supaUser?.phone, supaUser?.email_confirmed_at]);

  // trust_score DB 업데이트 래퍼 함수 (보안 강화: DB Trigger 사용)
  const recalcTrustScore = async (userId: string) => {
    // 🚨 [CRITICAL SECURITY WARNING FIX]
    // 이전 로직(클라이언트 단에서 점수를 임의 계산하여 DB에 삽입하는 취약점)을 제거했습니다.
    // DB의 secure_calculate_trust_score 트리거가 검증 상태(phone_verified 등) 변경을 감지하여 
    // 자동으로 점수를 재계산합니다. 클라이언트는 업데이트 후 그 결과만 다시 읽어옵니다.
    const {
      data
    } = await supabase.from('profiles').select('trust_score').eq('id', userId).single();
    if (data && data.trust_score !== undefined) {
      setDbTrustScore(data.trust_score);
    }
  };
  const [showIdModal, setShowIdModal] = useState(false);
  // iOS: window.prompt 차단 대신 커스텀 모달 사용 (Apple HIG 준수)
  const [showSnsModal, setShowSnsModal] = useState(false);
  const [snsHandleInput, setSnsHandleInput] = useState("");
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
      // 에러 메시지 원본 노우 안 함 (서비스 내부 정보 노우 / brute force 정보 피드백 방지)
      const isLockError = e instanceof Error && e.message.toLowerCase().includes("lock") && e.message.toLowerCase().includes("stole");
      if (isLockError) {
        toast({ title: t('verif.phone.delay'), description: t('verif.phone.delayDesc'), variant: "destructive" });
      } else {
        toast({ title: t('login.otpFail'), description: t('verif.otpError'), variant: "destructive" });
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
      // iOS: window.prompt 대신 커스텀 모달 시표
      setSnsHandleInput("");
      setShowSnsModal(true);
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
      // 에러 메시지 노우 방지 (및 brute force 정보 제연)
      toast({ title: t('verif.email.codeFail'), description: t('verif.email.codeFailDesc'), variant: "destructive" });
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
  return <div className="min-h-full bg-background safe-bottom">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft size={16} className="text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-foreground truncate">{t('verif.title')}</h1>
          <p className="text-xs text-muted-foreground truncate">{t('verif.subtitle')}</p>
        </div>
      </div>

      {/* Privacy Assurance Banner */}
      <div className="mx-5 mb-4 bg-gradient-to-br from-blue-500/8 to-violet-500/5 border border-blue-500/20 rounded-2xl p-3.5 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center shrink-0 mt-0.5">
          <Lock size={14} className="text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-extrabold text-foreground">{t("verif.privacyTitle", "개인정보 완전 보호")}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{t("verif.privacyDesc", "인증 정보는 암호화 저장되며 외부에 공개되지 않습니다. 신뢰 점수만 다른 사용자에게 표시됩니다.")}</p>
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
                <p className="font-extrabold text-foreground truncate">{t('verif.myScore')}</p>
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
          <div className="flex flex-wrap gap-2 truncate">
            {getVerifItems(t).filter(item => statuses[item.id] === "done").map(item => <span key={item.id} className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-extrabold ${item.bgColor} ${item.color}`}>
                <Check size={9} /> {t(`verif.items.${item.id}.badge`)}
              </span>)}
            {getVerifItems(t).filter(item => statuses[item.id] === "done").length === 0 && <span className="text-xs text-muted-foreground truncate">{t('verif.noVerif')}</span>}
          </div>
        </div>
      </div>

      {/* Verification items */}
      <div className="px-5 space-y-2 pb-24 truncate">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 truncate">{t('verif.section')}</p>
        {getVerifItems(t).map(item => {
        const status = statuses[item.id];
        return <motion.div key={item.id} whileTap={{
          scale: status !== "done" ? 0.98 : 1
        }} className="bg-card rounded-2xl shadow-card overflow-hidden">
              <div className="flex items-center gap-4 p-4 truncate">
                {/* Icon */}
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${item.bgColor} ${item.color}`}>
                  {item.icon}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground truncate">{t(`verif.items.${item.id}.label`)}</p>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${item.bgColor} border ${item.color}`}>+{item.points}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{t(`verif.items.${item.id}.desc`)}</p>
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
                      <p className="text-xs text-muted-foreground mb-2 truncate">{t('verif.phone.guide')}</p>
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
                      <p className="text-xs text-muted-foreground mb-2 truncate">
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
                  <p className="text-xs text-muted-foreground mb-2 truncate">{t('verif.email.sent')}</p>
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
          <p className="text-[10px] text-muted-foreground leading-relaxed truncate">
            {t('verif.privacyNote')}
          </p>
        </div>
      </div>

      {/* ID Modal */}
      <AnimatePresence>
        {showIdModal && <IdUploadModal onClose={() => setShowIdModal(false)} userId={user?.id ?? ""} userName={userName} onDone={async () => {
        setShowIdModal(false);
        setStatuses(s => ({
          ...s,
          id: 'done' as any
        }));
        await recalcTrustScore(user?.id ?? "");
        toast({
          title: t('verif.reviewDone', "항공권 인증 완료!"),
          description: t('verif.reviewDoneDesc', "실제 여행자 ✈️ Real Traveler 배지가 활성화되었습니다.")
        });
      }} />}
      </AnimatePresence>
      {/* SNS 항다 입력 모달 (window.prompt 대체 — iOS WKWebView 차단 대응) */}
      {showSnsModal && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSnsModal(false)} />
          <motion.div
            className="relative z-10 w-full max-w-lg bg-card rounded-t-3xl p-6 pb-10 flex flex-col gap-4"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
            <div className="w-11 h-11 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center mx-auto">
              <Instagram size={20} className="text-pink-400" />
            </div>
            <h3 className="text-base font-extrabold text-foreground text-center">
              {t("verif.sns.title", "SNS 계정 연동")}
            </h3>
            <p className="text-xs text-muted-foreground text-center">
              {t("verif.sns.desc", "Instagram 또는 다른 SNS 항다를 입력하세요 (@없이)")}
            </p>
            <div className="flex gap-2">
              <span className="flex items-center px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-muted-foreground shrink-0">@</span>
              <input
                type="text"
                value={snsHandleInput}
                onChange={e => setSnsHandleInput(e.target.value.replace(/^@/, "").trim())}
                placeholder={t("verif.sns.placeholder", "username")}
                className="flex-1 bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground outline-none font-mono"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSnsModal(false)}
                className="flex-1 py-3 rounded-2xl border border-border text-foreground font-semibold text-sm"
              >
                {t("common.cancel", "취소")}
              </button>
              <button
                disabled={!snsHandleInput.trim()}
                onClick={async () => {
                  if (!snsHandleInput.trim() || !user) return;
                  const handle = snsHandleInput.trim();
                  await supabase.from('profiles').update({ sns_handle: handle, sns_connected: true }).eq('id', user.id);
                  await recalcTrustScore(user.id);
                  setStatuses(s => ({ ...s, sns: 'done' }));
                  setShowSnsModal(false);
                  toast({ title: t('verif.sns.done'), description: t('verif.sns.doneDesc', { handle }) });
                }}
                className="flex-1 py-3 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-sm disabled:opacity-50"
              >
                {t("verif.sns.connect", "연동하기")}
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>;
};
export default VerificationPage;