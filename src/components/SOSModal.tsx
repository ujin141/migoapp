import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Phone, AlertTriangle, Shield, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { getCurrentLocation } from "@/lib/locationService";
interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}
const EMERGENCY_CONTACTS = [{
  name: i18n.t("auto.z_autoz경찰청10_1379"),
  number: "112",
  icon: "🚔"
}, {
  name: i18n.t("auto.z_autoz소방서구급_1380"),
  number: "119",
  icon: "🚑"
}, {
  name: i18n.t("auto.z_autoz여행자보험_1381"),
  number: "1588-0099",
  icon: "🏥"
}];
const SOSModal = ({
  isOpen,
  onClose
}: SOSModalProps) => {
  const {
    t
  } = useTranslation();
  const {
    user
  } = useAuth();
  const [phase, setPhase] = useState<"warning" | "sending" | "sent">("warning");
  const [countdown, setCountdown] = useState(3);
  const [locSent, setLocSent] = useState(false);
  const [coords, setCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [address, setAddress] = useState(t("sos.locationChecking"));

  // Reset on open + get location
  useEffect(() => {
    if (!isOpen) return;
    setPhase("warning");
    setCountdown(3);
    setLocSent(false);
    getCurrentLocation(false).then(pos => {
      if (pos) {
        setCoords(pos);
        setAddress(`Lat ${pos.lat.toFixed(4)} / Lon ${pos.lng.toFixed(4)}`);
      } else {
        setAddress(i18n.t("auto.z_autoz위치접근거_1382", { defaultValue: "위치 정보를 가져올 수 없습니다." }));
      }
    });
  }, [isOpen]);

  // Countdown + DB 저장
  useEffect(() => {
    if (phase !== "sending") return;
    if (countdown <= 0) {
      setPhase("sent");
      setLocSent(true);
      saveSOS();
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);
  const saveSOS = async () => {
    if (!user) return;
    try {
      await supabase.from("sos_alerts").insert({
        user_id: user.id,
        lat: coords?.lat,
        lng: coords?.lng,
        address,
        message: "Emergency SOS",
        status: "active"
      });
      toast({
        title: t("alert.t7Title"),
        description: t("alert.t7Desc")
      });
    } catch {
      toast({
        title: t("alert.t8Title"),
        description: t("alert.t8Desc")
      });
    }
  };
  return <AnimatePresence>
      {isOpen && <motion.div className="fixed inset-0 z-[80] flex items-center justify-center px-6" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }}>
          <motion.div className="absolute inset-0" style={{
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)"
      }} onClick={phase === "warning" ? onClose : undefined} />

          <motion.div className="relative z-10 w-full max-w-sm" initial={{
        scale: 0.85,
        y: 20
      }} animate={{
        scale: 1,
        y: 0
      }} exit={{
        scale: 0.85,
        y: 20
      }} transition={{
        type: "spring",
        damping: 22,
        stiffness: 300
      }}>

            {phase === "warning" && <div className="bg-[#1a0505] rounded-3xl overflow-hidden border border-red-500/40 shadow-2xl">
                <div className="h-1.5 w-full" style={{
            background: "linear-gradient(90deg, #ef4444, #dc2626, #b91c1c)"
          }} />
                <div className="p-6">
                  <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <X size={14} className="text-white" />
                  </button>
                  <motion.div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{
              background: "linear-gradient(135deg, #ef4444, #b91c1c)"
            }} animate={{
              boxShadow: ["0 0 0 0 rgba(239,68,68,0.5)", "0 0 0 20px rgba(239,68,68,0)", "0 0 0 0 rgba(239,68,68,0)"]
            }} transition={{
              duration: 1.5,
              repeat: Infinity
            }}>
                    <AlertTriangle size={36} className="text-white" />
                  </motion.div>
                  <h2 className="text-xl font-extrabold text-white text-center mb-1">{t("auto.z_autoz긴급SOS_1383")}</h2>
                  <p className="text-xs text-red-300/80 text-center mb-5">{t("auto.z_autoz등록된긴급_1384")}</p>
                  <div className="flex items-center gap-2 bg-white/5 rounded-2xl px-4 py-3 mb-4 border border-white/10">
                    <MapPin size={14} className="text-red-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white">{t("auto.z_autoz현재위치1_1385")}</p>
                      <p className="text-[10px] text-white/50">{address}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-5">
                    {EMERGENCY_CONTACTS.map(c => <div key={c.name} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5 border border-white/10">
                        <div className="flex items-center gap-2">
                          <span>{c.icon}</span>
                          <span className="text-xs font-bold text-white">{c.name}</span>
                        </div>
                        <a href={`tel:${c.number}`} className="flex items-center gap-1 text-red-400 text-xs font-bold">
                          <Phone size={11} /> {c.number}
                        </a>
                      </div>)}
                  </div>
                  <motion.button whileTap={{
              scale: 0.95
            }} onClick={() => setPhase("sending")} className="w-full py-4 rounded-2xl text-white font-extrabold text-base flex items-center justify-center gap-2" style={{
              background: "linear-gradient(135deg, #ef4444, #b91c1c)",
              boxShadow: "0 8px 32px rgba(239,68,68,0.5)"
            }}>{t("auto.z_autoz지금위치전_1386")}</motion.button>
                  <button onClick={onClose} className="w-full mt-2 py-2 text-xs text-white/40 font-medium">{t("general.cancel")}</button>
                </div>
              </div>}

            {phase === "sending" && <div className="bg-[#1a0505] rounded-3xl p-8 text-center border border-red-500/40">
                <motion.div className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center" style={{
            background: "linear-gradient(135deg, #ef4444, #b91c1c)"
          }} animate={{
            scale: [1, 1.05, 1]
          }} transition={{
            duration: 0.8,
            repeat: Infinity
          }}>
                  <span className="text-5xl font-extrabold text-white">{countdown}</span>
                </motion.div>
                <p className="text-white font-extrabold text-lg mb-1">{countdown}{t("auto.z_autoz초후전송1_1387")}</p>
                <p className="text-white/40 text-xs mb-5">{t("auto.z_autoz취소하려면_1388")}</p>
                <button onClick={() => {
            setPhase("warning");
            setCountdown(3);
          }} className="px-6 py-3 rounded-2xl bg-white/10 text-white text-sm font-bold border border-white/20">{t("auto.z_autoz취소101_1389")}</button>
              </div>}

            {phase === "sent" && locSent && <motion.div className="bg-[#021a0a] rounded-3xl p-8 text-center border border-emerald-500/40" initial={{
          scale: 0.9
        }} animate={{
          scale: 1
        }}>
                <div className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center" style={{
            background: "linear-gradient(135deg, #10b981, #059669)",
            boxShadow: "0 0 32px rgba(16,185,129,0.4)"
          }}>
                  <Check size={44} className="text-white" strokeWidth={2.5} />
                </div>
                <p className="text-white font-extrabold text-lg mb-1">{t("auto.z_autoz위치가전송_1390")}</p>
                <p className="text-white/50 text-xs mb-5">{t("auto.z_autoz등록된연락_1391")}</p>
                <div className="flex items-center gap-2 bg-emerald-500/10 rounded-2xl px-4 py-3 mb-5 border border-emerald-500/20">
                  <Shield size={14} className="text-emerald-400" />
                  <p className="text-xs text-emerald-300">{t("auto.z_autozMigo가_1392")}</p>
                </div>
                <button onClick={onClose} className="w-full py-3.5 rounded-2xl bg-white/10 text-white text-sm font-bold border border-white/20">{t("auto.z_autoz닫기102_1393")}</button>
              </motion.div>}
          </motion.div>
        </motion.div>}
    </AnimatePresence>;
};
export default SOSModal;