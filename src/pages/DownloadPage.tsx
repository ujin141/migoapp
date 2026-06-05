import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Smartphone, ChevronDown, ChevronUp, Copy, Check, Star, Download, Apple, Play } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import siteLogo from "@/assets/site-logo.png";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.migo.app&pcampaignid=web_share";
const APP_STORE_URL = "https://apps.apple.com/kr/app/migo-meet-travelers/id6761537006";

const APP_VERSION = "1.0.8";
const APP_SIZE = "35 MB";

export default function DownloadPage() {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [deviceType, setDeviceType] = useState<"ios" | "android" | "desktop">("desktop");
  const pageUrl = window.location.origin + window.location.pathname + "#/download";

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/ipad|iphone|ipod/.test(ua)) {
      setDeviceType("ios");
    } else if (/android/.test(ua)) {
      setDeviceType("android");
    } else {
      setDeviceType("desktop");
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: t("auto.g_0029", "링크가 복사되었습니다! 📋"),
    });
  };

  const handleDownload = (platform: "ios" | "android") => {
    if (platform === "ios") {
      window.location.href = APP_STORE_URL;
    } else {
      window.location.href = PLAY_STORE_URL;
    }
  };

  const faqs = [
    {
      q: t("auto.g_0653", "구글 플레이에 없나요?"),
      a: t("auto.g_0654", "Migo는 구글 플레이스토어 및 애플 앱스토어에 정식 출시되어 안전하게 설치하여 이용하실 수 있습니다.")
    },
    {
      q: t("auto.g_0655", "안전한 앱인가요?"),
      a: t("download.certifiedDesc") + " — 구글 플레이 프로텍트(Play Protect) 및 애플 앱스토어 심사를 정식 통과하여 스팸, 맬웨어 걱정 없이 완전한 보안이 보장됩니다."
    },
    {
      q: t("auto.g_0656", "최소 권장 사양은 어떻게 되나요?"),
      a: "Android 8.0 이상 / iOS 14.0 이상 버전이 탑재된 기기에서 원활하게 지원됩니다."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0d0f14] text-white font-sans flex flex-col justify-between">
      {/* Background Neon Gradients */}
      <div className="absolute top-[-20%] left-[-15%] w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[90px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[450px] h-[450px] rounded-full bg-sky-500/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md mx-auto px-6 py-12 flex-1 flex flex-col justify-center z-10">
        {/* App Splash / Hero */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl blur-xl opacity-30 scale-110" />
              <img src={siteLogo} alt="Migo" className="w-24 h-24 rounded-3xl mx-auto shadow-2xl relative border border-white/10" />
            </div>
            
            <h1 className="text-3xl font-black tracking-tight mb-1 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
              MIGO
            </h1>
            <p className="text-violet-400 text-xs font-bold uppercase tracking-wider mb-2">
              {t("download.officialRelease")}
            </p>
            <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed mb-6">
              {t("download.tagline")}
            </p>

            <div className="flex justify-center items-center gap-6 mb-8 bg-slate-900/40 border border-slate-800 rounded-2xl py-3 px-4">
              <div className="text-center">
                <p className="text-xs text-slate-500 font-semibold mb-0.5">Rating</p>
                <p className="text-sm font-extrabold text-amber-400 flex items-center justify-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400" /> 4.8
                </p>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div className="text-center">
                <p className="text-xs text-slate-500 font-semibold mb-0.5">Size</p>
                <p className="text-sm font-extrabold text-slate-200">{APP_SIZE}</p>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div className="text-center">
                <p className="text-xs text-slate-500 font-semibold mb-0.5">Version</p>
                <p className="text-sm font-extrabold text-slate-200">v{APP_VERSION}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CTA Store Buttons Container */}
        <div className="space-y-4 mb-8">
          {/* iOS Button - Primary if on iOS, or shown for desktop */}
          {(deviceType === "ios" || deviceType === "desktop") && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleDownload("ios")}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-base font-extrabold shadow-xl text-white bg-slate-900 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-950 transition-all shadow-violet-600/5"
            >
              <Apple className="w-6 h-6 fill-white" />
              <div className="text-left">
                <p className="text-[10px] font-semibold text-slate-400 leading-none mb-1">Download on the</p>
                <p className="text-sm font-black leading-none">{t("download.appStoreTitle")}</p>
              </div>
            </motion.button>
          )}

          {/* Android Button - Primary if on Android, or shown for desktop */}
          {(deviceType === "android" || deviceType === "desktop") && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleDownload("android")}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-base font-extrabold shadow-xl text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow-indigo-600/20"
            >
              <Play className="w-5 h-5 fill-white text-white" />
              <div className="text-left">
                <p className="text-[10px] font-semibold text-indigo-200 leading-none mb-1">Get it on</p>
                <p className="text-sm font-black leading-none">{t("download.playStoreTitle")}</p>
              </div>
            </motion.button>
          )}

          {/* Device specific help text */}
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-500/20">
              <Shield className="w-3.5 h-3.5" />
              {t("download.certifiedDesc")}
            </span>
          </div>
        </div>

        {/* Share Section */}
        <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-4 text-center mb-8">
          <p className="text-xs text-slate-400 font-semibold mb-2">{t("download.desktopScan")}</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-slate-500 truncate max-w-[200px]">{pageUrl}</span>
            <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-bold">
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? t("auto.g_0662", "복사됨") : t("auto.g_0663", "복사")}
            </button>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-2.5">
          <h2 className="text-sm font-bold text-slate-400 mb-3 px-1 uppercase tracking-wider">{t("auto.g_0668", "자주 묻는 질문")}</h2>
          {faqs.map((faq, i) => (
            <div key={i} className="bg-slate-900/40 border border-slate-800/60 rounded-2xl overflow-hidden transition-all">
              <button
                className="w-full flex items-center justify-between px-4 py-3.5 text-left text-sm font-bold text-slate-200 hover:text-white"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span>{faq.q}</span>
                {openFaq === i ? <ChevronUp size={15} className="text-violet-400" /> : <ChevronDown size={15} className="text-slate-500" />}
              </button>
              {openFaq === i && (
                <p className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/40 pt-3">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center text-xs text-slate-600 py-6 border-t border-slate-900/80 mt-8">
        <p>© 2026 Migo. All rights reserved.</p>
      </footer>
    </div>
  );
}