import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Shield, Smartphone, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import siteLogo from "@/assets/site-logo.png";

// APK 파일 URL — Supabase Storage 또는 GitHub Releases에 업로드 후 변경
const APK_URL = "https://play.google.com/apps/internaltest/4701704404129716915";
const APP_VERSION = "1.0.0";
const APP_SIZE = "32 MB";
const steps = [{
  num: "01",
  title: "APK다운",
  desc: "아래버튼을"
}, {
  num: "02",
  title: "알수없는앱",
  desc: "설정보안알"
}, {
  num: "03",
  title: "APK파일",
  desc: "다운로드된"
}, {
  num: "04",
  title: "설치완료실",
  desc: "설치버튼을"
}];
const faqs = [{
  q: "구글플레이",
  a: "현재내부테"
}, {
  q: "알수없는앱",
  a: i18n.t("auto.z_PlayStore외_497")
}, {
  q: "최소안드로",
  a: i18n.t("auto.z_Android80O_499")
}, {
  q: "업데이트는",
  a: "새버전이출"
}];
export default function DownloadPage() {
  const {
    t
  } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const pageUrl = window.location.href;
  const handleCopy = () => {
    navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "링크가복사"
    });
  };
  const handleDownload = () => {
    window.location.href = APK_URL;
  };
  return <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <div className="relative overflow-hidden px-6 pt-16 pb-12 text-center" style={{
      background: "linear-gradient(135deg, hsl(var(--primary)/0.15) 0%, transparent 60%)"
    }}>
        <motion.div initial={{
        opacity: 0,
        y: 24
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.5
      }}>
          <img src={siteLogo} alt="Migo" className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-lg" />
          <h1 className="text-3xl font-extrabold mb-1">{"Migo베"}</h1>
          <p className="text-muted-foreground text-sm mb-2">v{APP_VERSION} · Android · {APP_SIZE}</p>
          <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-6">
            <Shield size={12} />{"내부테스터"}</div>

          {/* Download Button */}
          <motion.button whileTap={{
          scale: 0.96
        }} onClick={handleDownload} className="w-full max-w-xs mx-auto flex items-center justify-center gap-3 py-4 rounded-2xl text-base font-extrabold shadow-lg text-primary-foreground" style={{
          background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.8) 100%)"
        }}>
            <Download size={20} />{"APK다운"}</motion.button>

          {/* Share link */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">{pageUrl}</span>
            <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-primary font-semibold">
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "복사됨" : "복사"}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Steps */}
      <div className="px-6 pb-8">
        <h2 className="text-base font-bold mb-4">{"설치방법5"}</h2>
        <div className="space-y-3">
          {steps.map((step, i) => <motion.div key={step.num} initial={{
          opacity: 0,
          x: -16
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          delay: i * 0.08
        }} className="flex gap-4 bg-muted/60 rounded-2xl p-4">
              <span className="text-2xl font-black text-primary/30 shrink-0 leading-none">{step.num}</span>
              <div>
                <p className="text-sm font-bold mb-0.5">{step.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>)}
        </div>

        {/* Requirements */}
        <div className="mt-6 bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-3">
          <Smartphone size={18} className="text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold mb-1">{"시스템요구"}</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              <li>{t("auto.z_Android80O_512")}</li>
              <li>{"저장공간1"}</li>
              <li>{"인터넷연결"}</li>
            </ul>
          </div>
        </div>

        {/* FAQ */}
        <h2 className="text-base font-bold mt-8 mb-4">{"자주묻는질"}</h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => <div key={i} className="bg-muted/60 rounded-2xl overflow-hidden">
              <button className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {faq.q}
                {openFaq === i ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
              </button>
              {openFaq === i && <p className="px-4 pb-3 text-xs text-muted-foreground leading-relaxed">{faq.a}</p>}
            </div>)}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground mt-8">{"이페이지는"}<br />{"피드백은운"}</p>
      </div>
    </div>;
}