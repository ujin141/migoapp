import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X, Loader2, CheckCircle2, LogOut, Users, Plane } from "lucide-react";
import { checkIn, checkOut, getMyCheckIn, fetchCityTravelers, CheckIn } from "@/lib/checkInService";
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
        }
      });
    }
  }, [open, user]);
  const handleLocate = () => {
    setError("");
    setStep("locating");
    navigator.geolocation.getCurrentPosition(async pos => {
      const {
        latitude,
        longitude
      } = pos.coords;
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
        const detectedCity = addr.city || addr.town || addr.village || addr.county || addr.state || i18n.t("auto.z_\uC54C\uC218\uC5C6\uB294\uB3C4\uC2DC_1450");
        const detectedCountry = addr.country || i18n.t("auto.z_\uC54C\uC218\uC5C6\uB294\uAD6D\uAC00_1451");
        setCity(detectedCity);
        setCountry(detectedCountry);
        setStep("confirming");
      } catch {
        setError(i18n.t("auto.z_\uC704\uCE58\uC815\uBCF4\uB97C\uAC00\uC838\uC624\uB294\uB370_1452"));
        setStep("idle");
      }
    }, () => {
      setError(i18n.t("auto.z_\uC704\uCE58\uAD8C\uD55C\uC774\uD544\uC694\uD569\uB2C8\uB2E4_1453"));
      setStep("idle");
    }, {
      timeout: 10000
    });
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
      const msg = err?.message ? i18n.t("auto.z_tmpl_1454", {
        defaultValue: `Error: ${err.message}`
      }) : i18n.t("auto.z_\uCCB4\uD06C\uC778\uC911\uC624\uB958\uAC00\uBC1C\uC0DD\uD588_1455");
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
          <motion.div className="w-full max-w-md bg-card rounded-t-3xl shadow-2xl overflow-hidden" style={{
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
                <h2 className="font-bold text-lg">{t("auto.z_GPS\uB3C4\uCC29\uCCB4\uD06C\uC778_1456")}</h2>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            {/* Step: idle */}
            {step === "idle" && <div className="space-y-4">
                <div className="bg-primary/5 rounded-2xl p-4 text-sm text-muted-foreground leading-relaxed">{t("auto.z_\uD604\uC7AC\uC704\uCE58\uD55C\uB3C4\uC2DC\uC5D0\uCCB4\uD06C_1457")}<span className="text-primary font-bold">{t("auto.z_\uAC19\uC740\uB3C4\uC2DC\uC758\uC5EC\uD589\uC790_1458")}</span>{t("auto.z_\uB4E4\uACFC\uC6B0\uC120\uB9E4\uCE6D\uB429\uB2C8\uB2E42_1459")}</div>
                {error && <p className="text-xs text-red-500 text-center">{error}</p>}
                <button onClick={handleLocate} className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                  <MapPin size={20} />{t("auto.z_\uB0B4\uC704\uCE58\uAC10\uC9C0\uD558\uAE30_1460")}</button>
              </div>}

            {/* Step: locating */}
            {step === "locating" && <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="text-primary animate-spin" size={40} />
                <p className="text-sm text-muted-foreground">{t("auto.z_\uD604\uC7AC\uC704\uCE58\uB97C\uD655\uC778\uC911\uC785\uB2C8_1461")}</p>
              </div>}

            {/* Step: confirming */}
            {step === "confirming" && <div className="space-y-5">
                <div className="bg-muted rounded-2xl p-5 flex flex-col items-center gap-2 text-center">
                  <MapPin className="text-primary" size={32} />
                  <p className="text-2xl font-extrabold">{city}</p>
                  <p className="text-sm text-muted-foreground">{country}</p>
                </div>
                <p className="text-sm text-muted-foreground text-center">{t("auto.z_\uC774\uC704\uCE58\uB85C\uCCB4\uD06C\uC778\uD560\uAE4C\uC694_1462")}</p>
                <div className="flex gap-3">
                  <button onClick={() => setStep("idle")} className="flex-1 py-3 rounded-2xl border border-border font-semibold text-sm text-muted-foreground">{t("auto.z_\uCDE8\uC18C_1463")}</button>
                  <button onClick={handleConfirm} className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm">{t("auto.z_\uCCB4\uD06C\uC778_1464")}</button>
                </div>
              </div>}

            {/* Step: done */}
            {step === "done" && <div className="space-y-5">
                {/* 체크인 완료 뱃지 */}
                <div className="bg-gradient-to-br from-primary/20 to-purple-500/10 rounded-2xl p-5 flex flex-col items-center gap-2 text-center">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-primary" size={28} />
                    <span className="font-extrabold text-lg text-primary">{t("auto.z_\uCCB4\uD06C\uC778\uC644\uB8CC_1465")}</span>
                  </div>
                  <p className="text-3xl font-extrabold mt-1">{city}</p>
                  <p className="text-sm text-muted-foreground">{country}</p>
                  <div className="flex items-center gap-1 mt-2 bg-primary/10 rounded-full px-3 py-1">
                    <Users size={12} className="text-primary" />
                    <span className="text-xs font-bold text-primary">{nearbyCount}{t("auto.z_\uBA85\uC774\uC774\uB3C4\uC2DC\uC5D0\uC788\uC5B4\uC694_1466")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{expiresHours}{t("auto.z_\uC2DC\uAC04\uD6C4\uC790\uB3D9\uB9CC\uB8CC_1467")}</p>
                </div>
                <button onClick={handleCheckOut} className="w-full py-3 rounded-2xl border border-red-300/50 text-red-500 font-semibold text-sm flex items-center justify-center gap-2">
                  <LogOut size={16} />{t("auto.z_\uCCB4\uD06C\uC544\uC6C3_1468")}</button>
              </div>}
            </div>{/* end scrollable content */}
          </motion.div>
        </motion.div>}
    </AnimatePresence>;
}