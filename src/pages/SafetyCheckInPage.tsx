import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shield, MapPin, Clock, Phone, AlertTriangle, CheckCircle2, Share2, Bell, User, Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
const SafetyCheckInPage = () => {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [step, setStep] = useState<'home' | 'create' | 'active' | 'done'>('home');
  const [meetingPlace, setMeetingPlace] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [checkinId, setCheckinId] = useState('');
  const [saving, setSaving] = useState(false);
  const handleCreate = async () => {
    if (!user) return;
    if (!meetingPlace.trim() || !meetingTime.trim()) {
      toast({
        title: i18n.t("auto.z_\uB9CC\uB0A8\uC7A5\uC18C\uC640\uC2DC\uAC04\uC744\uC785\uB825_33"),
        variant: "destructive"
      });
      return;
    }
    setSaving(true);
    try {
      // Save emergency contact to profile
      if (emergencyName && emergencyContact) {
        await supabase.from('profiles').update({
          emergency_contact: emergencyContact,
          emergency_contact_name: emergencyName
        }).eq('id', user.id);
      }
      // Create safety checkin
      const {
        data,
        error
      } = await supabase.from('safety_checkins').insert({
        user_id: user.id,
        meeting_place: meetingPlace,
        meeting_time: new Date(meetingTime).toISOString(),
        status: 'scheduled'
      }).select().single();
      if (error) throw error;
      setCheckinId(data.id);
      const link = `${window.location.origin}/safety/${data.share_token}`;
      setShareLink(link);
      setStep('active');
      toast({
        title: i18n.t("auto.z_\uC548\uC804\uCCB4\uD06C\uC778\uB4F1\uB85D\uC644\uB8CC_34"),
        description: i18n.t("auto.z_\uBE44\uC0C1\uC5F0\uB77D\uCC98\uC5D0\uB9C1\uD06C\uB97C\uACF5_35")
      });
    } catch (e) {
      toast({
        title: i18n.t("auto.z_\uB4F1\uB85D\uC2E4\uD328_36"),
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  const handleComplete = async () => {
    if (!checkinId) return;
    await supabase.from('safety_checkins').update({
      status: 'completed'
    }).eq('id', checkinId);
    setStep('done');
    toast({
      title: i18n.t("auto.z_\uBB34\uC0AC\uD788\uB9CC\uB098\uC168\uAD70\uC694_37"),
      description: i18n.t("auto.z_\uB3D9\uD589\uD6C4\uAE30\uB97C\uB0A8\uACA8\uBCF4\uC138\uC694_38")
    });
  };
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: i18n.t("auto.z_Migo\uC548\uC804\uCCB4\uD06C\uC778_39"),
        text: "Migo 동행 안전 체크인이 등록되었습니다. 비상시 이 링크를 확인해주세요.",
        url: shareLink
      });
    } else {
      await navigator.clipboard.writeText(shareLink);
      toast({
        title: i18n.t("auto.z_\uB9C1\uD06C\uBCF5\uC0AC\uB428_41"),
        description: i18n.t("auto.z_\uBE44\uC0C1\uC5F0\uB77D\uCC98\uC5D0\uBD99\uC5EC\uB123\uC5B4_42")
      });
    }
  };
  return <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={() => step === 'home' ? navigate(-1) : setStep('home')} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-muted">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-extrabold text-foreground flex items-center gap-2">
            <Shield size={20} className="text-emerald-500" />{t("auto.z_\uB3D9\uD589\uC548\uC804\uC2DC\uC2A4\uD15C_43")}</h1>
          <p className="text-xs text-muted-foreground">{t("auto.z_Migo\uB9CC\uC758\uC5EC\uD589\uC790\uC548_44")}</p>
        </div>
      </header>

      <div className="flex-1 px-5 pb-10 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* ─── HOME ─── */}
          {step === 'home' && <motion.div key="home" initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} exit={{
          opacity: 0,
          y: -20
        }}>
              {/* Hero */}
              <div className="relative rounded-3xl overflow-hidden mb-6 p-6" style={{
            background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)'
          }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                <Shield size={40} className="text-white mb-3" />
                <h2 className="text-2xl font-black text-white mb-1">{t("auto.z_\uC5EC\uD589\uC790\uB97C\uC9C0\uD0A4\uB294_45")}<br />{t("auto.z_\uC2A4\uB9C8\uD2B8\uC548\uC804\uB9DD_46")}</h2>
                <p className="text-white/80 text-sm">{t("auto.z_\uD2F4\uB354\uBBF8\uD504\uC5D0\uB294\uC5C6\uB294Mi_47")}<br />{t("auto.z_\uB3D9\uD589\uC548\uC804\uC2DC\uC2A4\uD15C\uC785\uB2C8\uB2E4_48")}</p>
              </div>

              {/* Features */}
              {[{
            icon: MapPin,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10',
            title: t("auto.z_\uB9CC\uB0A8\uC7A5\uC18C\uC2DC\uAC04\uB4F1\uB85D_49"),
            desc: t("auto.z_\uB3D9\uD589\uBBF8\uD305\uC815\uBCF4\uB97C\uC571\uC5D0\uBBF8_50")
          }, {
            icon: Share2,
            color: 'text-purple-400',
            bg: 'bg-purple-400/10',
            title: t("auto.z_\uBE44\uC0C1\uC5F0\uB77D\uCC98\uC5D0\uC790\uB3D9\uACF5\uC720_51"),
            desc: t("auto.z_\uB9C1\uD06C\uD558\uB098\uB85C\uC704\uCE58\uC815\uBCF4\uC989_52")
          }, {
            icon: CheckCircle2,
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10',
            title: t("auto.z_\uADC0\uAC00\uC644\uB8CC\uCCB4\uD06C\uC778_53"),
            desc: t("auto.z_\uBB34\uC0AC\uD788\uADC0\uAC00\uD588\uB2E4\uACE0\uC54C\uB824_54")
          }, {
            icon: AlertTriangle,
            color: 'text-red-400',
            bg: 'bg-red-400/10',
            title: t("auto.z_SOS\uAE34\uAE09\uC54C\uB9BC_55"),
            desc: t("auto.z_\uC704\uD5D8\uC2DC\uBE44\uC0C1\uC5F0\uB77D\uCC98\uC5D0\uC989_56")
          }].map((f, i) => <motion.div key={i} initial={{
            opacity: 0,
            x: -20
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            delay: i * 0.08
          }} className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm mb-3">
                  <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center shrink-0`}>
                    <f.icon size={18} className={f.color} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{f.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                  </div>
                </motion.div>)}

              <motion.button whileTap={{
            scale: 0.97
          }} onClick={() => setStep('create')} className="w-full mt-4 py-4 rounded-2xl font-extrabold text-white flex items-center justify-center gap-2" style={{
            background: 'linear-gradient(135deg, #059669, #10b981)'
          }}>
                <Shield size={18} />{t("auto.z_\uC548\uC804\uCCB4\uD06C\uC778\uB4F1\uB85D\uD558\uAE30_57")}</motion.button>
            </motion.div>}

          {/* ─── CREATE ─── */}
          {step === 'create' && <motion.div key="create" initial={{
          opacity: 0,
          x: 30
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -30
        }} className="space-y-5">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-sm font-bold text-emerald-400">{t("auto.z_\uB9CC\uB0A8\uC815\uBCF4\uB4F1\uB85D_58")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("auto.z_\uBBF8\uD305\uC804\uC5D0\uC544\uB798\uC815\uBCF4\uB97C\uB4F1_59")}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground mb-2 block">{t("auto.z_\uB9CC\uB0A8\uC7A5\uC18C_60")}</label>
                <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3">
                  <MapPin size={16} className="text-primary shrink-0" />
                  <input value={meetingPlace} onChange={e => setMeetingPlace(e.target.value)} placeholder={t("auto.z_\uC608\uD64D\uB300\uC785\uAD6C\uC5ED2\uBC88\uCD9C\uAD6C_61")} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground mb-2 block">{t("auto.z_\uB9CC\uB0A8\uC2DC\uAC04_62")}</label>
                <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3">
                  <Clock size={16} className="text-primary shrink-0" />
                  <input type="datetime-local" value={meetingTime} onChange={e => setMeetingTime(e.target.value)} className="flex-1 bg-transparent text-sm text-foreground outline-none" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border">
                <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
                  <Phone size={14} className="text-red-400" />{t("auto.z_\uBE44\uC0C1\uC5F0\uB77D\uCC98\uB4F1\uB85D_63")}<span className="text-muted-foreground font-normal">{t("auto.z_\uC120\uD0DD_64")}</span>
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3">
                    <User size={16} className="text-muted-foreground shrink-0" />
                    <input value={emergencyName} onChange={e => setEmergencyName(e.target.value)} placeholder={t("auto.z_\uC5F0\uB77D\uCC98\uC774\uB984\uC608\uC5C4\uB9C8_65")} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                  </div>
                  <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3">
                    <Phone size={16} className="text-muted-foreground shrink-0" />
                    <input value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} placeholder={t("auto.z_\uC804\uD654\uBC88\uD638\uB610\uB294\uCE74\uCE74\uC624\uD1A1_66")} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                  </div>
                </div>
              </div>

              <motion.button whileTap={{
            scale: 0.97
          }} onClick={handleCreate} disabled={saving} className="w-full py-4 rounded-2xl font-extrabold text-white flex items-center justify-center gap-2" style={{
            background: 'linear-gradient(135deg, #059669, #10b981)',
            opacity: saving ? 0.7 : 1
          }}>
                {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Shield size={18} />}{t("auto.z_\uC548\uC804\uCCB4\uD06C\uC778\uB4F1\uB85D_67")}</motion.button>
            </motion.div>}

          {/* ─── ACTIVE ─── */}
          {step === 'active' && <motion.div key="active" initial={{
          opacity: 0,
          scale: 0.95
        }} animate={{
          opacity: 1,
          scale: 1
        }} exit={{
          opacity: 0
        }} className="space-y-4">
              <div className="text-center py-6">
                <motion.div animate={{
              scale: [1, 1.05, 1]
            }} transition={{
              duration: 2,
              repeat: Infinity
            }} className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mx-auto mb-4">
                  <Shield size={36} className="text-emerald-500" />
                </motion.div>
                <h2 className="text-xl font-black text-foreground">{t("auto.z_\uC548\uC804\uBAA8\uB4DC\uD65C\uC131\uD654\uC911_68")}</h2>
                <p className="text-sm text-muted-foreground mt-1">{t("auto.z_\uBE44\uC0C1\uC5F0\uB77D\uCC98\uC5D0\uB9C1\uD06C\uB97C\uACF5_69")}</p>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
                <p className="text-xs font-bold text-muted-foreground mb-2">{t("auto.z_\uB4F1\uB85D\uB41C\uB9CC\uB0A8\uC815\uBCF4_70")}</p>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={14} className="text-primary" />
                  <p className="text-sm font-semibold text-foreground">{meetingPlace}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-primary" />
                  <p className="text-sm font-semibold text-foreground">{new Date(meetingTime).toLocaleString('ko-KR')}</p>
                </div>
              </div>

              <motion.button whileTap={{
            scale: 0.97
          }} onClick={handleShare} className="w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2" style={{
            background: 'linear-gradient(135deg, #7c3aed, #6366f1)'
          }}>
                <Share2 size={16} />{t("auto.z_\uBE44\uC0C1\uC5F0\uB77D\uCC98\uC5D0\uACF5\uC720\uD558\uAE30_71")}</motion.button>

              <motion.button whileTap={{
            scale: 0.97
          }} onClick={handleComplete} className="w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2" style={{
            background: 'linear-gradient(135deg, #059669, #10b981)'
          }}>
                <CheckCircle2 size={16} />{t("auto.z_\uBB34\uC0AC\uD788\uADC0\uAC00\uC644\uB8CC_72")}</motion.button>

              <button onClick={async () => {
            await supabase.from('safety_checkins').update({
              status: 'emergency'
            }).eq('id', checkinId);
            toast({
              title: i18n.t("auto.z_SOS\uBC1C\uC1A1\uB428_73"),
              description: i18n.t("auto.z_\uBE44\uC0C1\uC5F0\uB77D\uCC98\uC5D0\uAE34\uAE09\uC54C\uB9BC_74"),
              variant: "destructive"
            });
          }} className="w-full py-3.5 rounded-2xl font-bold text-red-400 border border-red-400/30 bg-red-500/10 flex items-center justify-center gap-2">
                <AlertTriangle size={16} />{t("auto.z_SOS\uAE34\uAE09\uC54C\uB9BC\uBC1C\uC1A1_75")}</button>
            </motion.div>}

          {/* ─── DONE ─── */}
          {step === 'done' && <motion.div key="done" initial={{
          opacity: 0,
          scale: 0.9
        }} animate={{
          opacity: 1,
          scale: 1
        }} className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <motion.div animate={{
            scale: [1, 1.1, 1]
          }} transition={{
            duration: 0.6
          }} className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
                <Heart size={44} className="text-emerald-500 fill-emerald-500" />
              </motion.div>
              <h2 className="text-2xl font-black text-foreground mb-2">{t("auto.z_\uBB34\uC0AC\uD788\uB3CC\uC544\uC624\uC168\uAD70\uC694_76")}</h2>
              <p className="text-muted-foreground text-sm mb-8">{t("auto.z_\uC88B\uC740\uB3D9\uD589\uB418\uC168\uB098\uC694_77")}<br />{t("auto.z_\uD6C4\uAE30\uB97C\uB0A8\uACA8\uC8FC\uC2DC\uBA74\uB2E4\uB978_78")}</p>
              <motion.button whileTap={{
            scale: 0.97
          }} onClick={() => navigate('/meet-review')} className="px-8 py-4 rounded-2xl font-extrabold text-white mb-3" style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)'
          }}>{t("auto.z_\uB3D9\uD589\uD6C4\uAE30\uC791\uC131\uD558\uAE30_79")}</motion.button>
              <button onClick={() => navigate('/')} className="text-sm text-muted-foreground underline">{t("auto.z_\uD648\uC73C\uB85C\uB3CC\uC544\uAC00\uAE30_80")}</button>
            </motion.div>}
        </AnimatePresence>
      </div>
    </div>;
};
export default SafetyCheckInPage;