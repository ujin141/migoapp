import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, MessageCircle, Video, VideoOff } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

const VoiceCallPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const contactId = (location.state as { contactId?: string } | null)?.contactId;
  const [contact, setContact] = useState({ name: t("voice.connecting"), photo: "" });

  useEffect(() => {
    if (!contactId) {
      setContact({ name: t("voiceCall.unknownUser"), photo: "" });
      return;
    }
    const fetchContact = async () => {
      const { data } = await supabase.from('profiles').select('name, photo_url').eq('id', contactId).single();
      if (data) {
        setContact({ name: data.name || t('voiceCall.user'), photo: data.photo_url || "" });
      } else {
        setContact({ name: t('voiceCall.unknownUser'), photo: "" });
      }
    };
    fetchContact();
  }, [contactId, t]);

  const [callState, setCallState] = useState<"ringing" | "connected" | "ended">("ringing");
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [videoOn, setVideoOn] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-connect after 2 seconds
  useEffect(() => {
    const t = setTimeout(() => setCallState("connected"), 2000);
    return () => clearTimeout(t);
  }, []);

  // Start timer when connected
  useEffect(() => {
    if (callState === "connected") {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleEndCall = async () => {
    setCallState("ended");
    // 통화 기록 저장
    if (user) {
      await supabase.from("call_logs").insert({
        caller_id: user.id,
        callee_id: contactId || null,
        duration_seconds: seconds,
        status: "completed",
      });
    }
    setTimeout(() => navigate(-1), 1500);
  };

  // Wave bars animation values
  const BARS = 8;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-between pt-safe"
      style={{
        background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 40%, #0f172a 100%)",
        paddingBottom: "max(4rem, calc(1.5rem + env(safe-area-inset-bottom, 0px)))"
      }}>

      {/* Ambient glow behind avatar */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div className="w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity }} />
      </div>

      {/* Top area & Exit button */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-safe flex justify-end z-50">
        <button onClick={() => {
          if (callState !== "ended") {
            handleEndCall();
          } else {
            navigate(-1);
          }
        }} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="flex flex-col items-center pt-24 z-10 w-full px-8 truncate">
        {/* Status */}
        <motion.p className="text-indigo-300 text-xs font-semibold tracking-widest uppercase mb-8"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {callState === "ringing" ? t("voice.connecting") : callState === "connected" ? t("voice.connected") : t("voice.ended")}
        </motion.p>

        {/* Avatar with pulsing rings */}
        <div className="relative mb-6 flex items-center justify-center">
          {callState === "ringing" && [1, 2, 3].map((ring) => (
            <motion.div key={ring}
              className="absolute rounded-full border border-indigo-400/30"
              style={{ width: 80 + ring * 36, height: 80 + ring * 36 }}
              animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: ring * 0.3 }}
            />
          ))}
          {callState === "connected" && [1, 2].map((ring) => (
            <motion.div key={ring}
              className="absolute rounded-full border border-indigo-400/20"
              style={{ width: 100 + ring * 24, height: 100 + ring * 24 }}
              animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, delay: ring * 0.4 }}
            />
          ))}

          <motion.div
            className="w-28 h-28 rounded-full overflow-hidden border-4 border-indigo-400/50 shadow-2xl"
            animate={callState === "ringing" ? { scale: [1, 1.03, 1] } : {}}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            <img src={contact.photo} alt={contact.name} className="w-full h-full object-cover" />
          </motion.div>
        </div>

        <h2 className="text-2xl font-extrabold text-white mb-1 text-center">{contact.name}</h2>

        {/* Timer */}
        {callState === "connected" && (
          <motion.p className="text-indigo-300 text-sm font-mono" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {formatTime(seconds)}
          </motion.p>
        )}
        {callState === "ended" && (
          <motion.p className="text-red-400 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {t('voiceCall.callEnded')}
          </motion.p>
        )}

        {/* Sound wave (connected only) */}
        {callState === "connected" && (
          <div className="flex items-center justify-center gap-1 mt-5 h-8 w-full truncate">
            {Array.from({ length: BARS }).map((_, i) => (
              <motion.div key={i}
                className="w-1 rounded-full"
                style={{ backgroundColor: "#818cf8" }}
                animate={{ height: muted ? "4px" : ["4px", `${8 + Math.sin(i) * 12 + 4}px`, "4px"] }}
                transition={{ duration: 0.6 + i * 0.07, repeat: Infinity, ease: "easeInOut", delay: i * 0.08 }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="z-10 w-full px-8">
        {/* Secondary controls */}
        <div className="flex justify-around mb-8 truncate">
          {[
            { icon: muted ? MicOff : Mic, label: muted ? t('voiceCall.unmute') : t('voiceCall.mute'), active: muted, onPress: () => setMuted(m => !m) },
            { icon: speakerOn ? Volume2 : VolumeX, label: t('voiceCall.speaker'), active: !speakerOn, onPress: () => setSpeakerOn(s => !s) },
            { icon: videoOn ? Video : VideoOff, label: t("voiceCall.video"), active: videoOn, onPress: () => setVideoOn(v => !v) },
            { icon: MessageCircle, label: t("voiceCall.message"), active: false, onPress: () => navigate("/chat") },
          ].map(({ icon: Icon, label, active, onPress }) => (
            <motion.button key={label} whileTap={{ scale: 0.88 }} onClick={onPress}
              className="flex flex-col items-center gap-2">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                active ? "bg-white/20 border border-white/30" : "bg-white/8 border border-white/10"
              }`} style={{ backdropFilter: "blur(12px)" }}>
                <Icon size={22} className="text-white" />
              </div>
              <span className="text-[10px] text-white/60 font-medium tracking-tight truncate w-16 text-center">{label}</span>
            </motion.button>
          ))}
        </div>

        {/* End call / Leave room */}
        <AnimatePresence mode="wait">
          {callState === "connected" && (
            <motion.div key="call" className="flex justify-center" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={handleEndCall}
                className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
                animate={{ boxShadow: ["0 0 0 0 rgba(239,68,68,0.4)", "0 0 0 16px rgba(239,68,68,0)", "0 0 0 0 rgba(239,68,68,0)"] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <PhoneOff size={28} className="text-white" />
              </motion.button>
            </motion.div>
          )}
          
          {callState === "ended" && (
            <motion.div key="exit" className="flex justify-center" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => navigate(-1)}
                className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl bg-white/20 backdrop-blur-md"
              >
                <span className="text-white font-bold text-sm truncate">{t("auto.g_1075", "나가기")}</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Incoming call overlay (ringing state) */}
      <AnimatePresence>
        {callState === "ringing" && (
          <motion.div className="absolute inset-0 flex flex-col items-center justify-end pb-24 z-20"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex gap-10">
              <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate(-1)}
                className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-xl">
                  <PhoneOff size={24} className="text-white" />
                </div>
                <span className="text-xs text-white/70 truncate">{t("voiceCall.reject")}</span>
              </motion.button>
              <motion.button whileTap={{ scale: 0.88 }} onClick={() => setCallState("connected")}
                className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl">
                  <Phone size={24} className="text-white" />
                </div>
                <span className="text-xs text-white/70 truncate">{t('voiceCall.accept')}</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceCallPage;
