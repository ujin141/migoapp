import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X, Loader2, CheckCircle2, LogOut, Users, Plane } from "lucide-react";
import { checkIn, checkOut, getMyCheckIn, fetchCityTravelers, CheckIn } from "@/lib/checkInService";
import { getCurrentLocation } from "@/lib/locationService";
import { useAuth } from "@/hooks/useAuth";
interface Props {
  open: boolean;
  onClose: () => void;
  onCheckInSuccess: (checkInData: CheckIn, travelers: any[]) => void;
}
export default function CheckInModal({
  open,
  onClose,
  onCheckInSuccess
}: Props) {
  const {
    t
  } = useTranslation();
  const {
    user
  } = useAuth();
  const [step, setStep] = useState<"idle" | "locating" | "confirming" | "done">("idle");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [error, setError] = useState("");
  const [nearbyCount, setNearbyCount] = useState(0);
  const [currentCheckIn, setCurrentCheckIn] = useState<CheckIn | null>(null);
  useEffect(() => {
    if (open && user) {
      getMyCheckIn(user.id).then(ci => {
        if (ci) {
          setCurrentCheckIn(ci);
          setCity(ci.city);
          setCountry(ci.country);
          fetchCityTravelers(ci.city, user.id).then(t => setNearbyCount(t.length));
          setStep("done");
        } else {
          // 재오픈 시 이전 상태 초기화
          setCurrentCheckIn(null);
          setStep("idle");
          setCity("");
          setCountry("");
          setError("");
          setNearbyCount(0);
        }
      });
    }
  }, [open, user]);
  const handleLocate = async () => {
    setError("");
    setStep("locating");
    const pos = await getCurrentLocation(false);
    if (!pos) {
      setError(i18n.t("checkin.perm_req", { defaultValue: "위치 권한이 필요합니다." }));
      setStep("idle");
      return;
    }
    const { lat: latitude, lng: longitude } = pos;
    setLat(latitude);
    setLng(longitude);
    // 역지오코딩
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ko`, {
        headers: {
          "User-Agent": "MigoApp/1.0"
        }
      });
      const data = await res.json();
      const addr = data.address || {};
      const detectedCity = addr.city || addr.town || addr.village || addr.county || addr.state || i18n.t("checkin.unknown_city");
      const detectedCountry = addr.country || i18n.t("checkin.unknown_country");
      setCity(detectedCity);
      setCountry(detectedCountry);
      setStep("confirming");
    } catch {
      setError(i18n.t("checkin.fetch_failed"));
      setStep("idle");
    }
  };
  const handleConfirm = async () => {
    if (!user) return;
    setStep("locating");
    const {
      data,
      error: err
    } = await checkIn(user.id, lat, lng);
    if (err || !data) {
      console.error("[CheckIn Error]", err);
      const msg = err?.message ? `Error: ${err.message}` : i18n.t("checkin.error_occurred");
      setError(msg);
      setStep("idle");
      return;
    }
    const travelers = await fetchCityTravelers(data.city, user.id);
    setNearbyCount(travelers.length);
    setCurrentCheckIn(data);
    setStep("done");
    onCheckInSuccess(data, travelers);
  };
  const handleCheckOut = async () => {
    if (!user) return;
    await checkOut(user.id);
    setCurrentCheckIn(null);
    setStep("idle");
    setCity("");
    setCountry("");
    setNearbyCount(0);
  };
  const expiresHours = currentCheckIn ? Math.max(0, Math.round((new Date(currentCheckIn.expires_at).getTime() - Date.now()) / 3600000)) : 0;
  return <AnimatePresence>
      {open && <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }} onClick={e => {
      if (e.target === e.currentTarget) onClose();
    }}>
          <motion.div className="w-full max-w-md bg-card rounded-3xl mb-4 sm:mb-8 shadow-2xl overflow-hidden" style={{
        paddingBottom: "max(env(safe-area-inset-bottom), 80px)"
      }} initial={{
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
            <div className="max-h-[75vh] overflow-y-auto px-6 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plane className="text-primary" size={16} />
                </div>
                <h2 className="font-bold text-lg truncate">{t("checkin.title")}</h2>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            {/* Step: idle */}
            {step === "idle" && <div className="space-y-4">
                <div className="bg-primary/5 rounded-2xl p-4 text-sm text-muted-foreground leading-relaxed truncate">{t("checkin.desc1")}<span className="text-primary font-bold truncate">{t("checkin.desc2")}</span>{t("checkin.desc3")}</div>
                {error && <p className="text-xs text-red-500 text-center">{error}</p>}
                <button onClick={handleLocate} className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                  <MapPin size={20} />{t("checkin.detect_btn")}</button>
              </div>}

            {/* Step: locating */}
            {step === "locating" && <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="text-primary animate-spin" size={40} />
                <p className="text-sm text-muted-foreground truncate">{t("checkin.locating")}</p>
              </div>}

            {/* Step: confirming */}
            {step === "confirming" && <div className="space-y-5">
                <div className="bg-muted rounded-2xl p-5 flex flex-col items-center gap-2 text-center">
                  <MapPin className="text-primary" size={32} />
                  <p className="text-2xl font-extrabold">{city}</p>
                  <p className="text-sm text-muted-foreground">{country}</p>
                </div>
                <p className="text-sm text-muted-foreground text-center truncate">{t("checkin.confirm_desc")}</p>
                <div className="flex gap-3">
                  <button onClick={() => setStep("idle")} className="flex-1 py-3 rounded-2xl border border-border font-semibold text-sm text-muted-foreground">{t("checkin.cancel")}</button>
                  <button onClick={handleConfirm} className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm">{t("checkin.checkin_btn")}</button>
                </div>
              </div>}

            {/* Step: done */}
            {step === "done" && <div className="space-y-5">
                {/* 체크인 완료 뱃지 */}
                <div className="bg-gradient-to-br from-primary/20 to-purple-500/10 rounded-2xl p-5 flex flex-col items-center gap-2 text-center">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-primary" size={28} />
                    <span className="font-extrabold text-lg text-primary truncate">{t("checkin.done_badge")}</span>
                  </div>
                  <p className="text-3xl font-extrabold mt-1">{city}</p>
                  <p className="text-sm text-muted-foreground">{country}</p>
                  <div className="flex items-center gap-1 mt-2 bg-primary/10 rounded-full px-3 py-1">
                    <Users size={12} className="text-primary" />
                    <span className="text-xs font-bold text-primary truncate">{nearbyCount}{t("checkin.people_here")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{expiresHours}{t("checkin.expires")}</p>
                </div>
                <button onClick={handleCheckOut} className="w-full py-3 rounded-2xl border border-red-300/50 text-red-500 font-semibold text-sm flex items-center justify-center gap-2">
                  <LogOut size={16} />{t("checkin.checkout_btn")}</button>
              </div>}
            </div>{/* end scrollable content */}
          </motion.div>
        </motion.div>}
    </AnimatePresence>;
}