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
  title: i18n.t("auto.g_0645", "APK 다운로드"),
  desc: i18n.t("auto.g_0646", "아래 버튼을 눌러 설치 파일을 받아주세요.")
}, {
  num: "02",
  title: i18n.t("auto.g_0647", "알수 없는 앱 햨용"),
  desc: i18n.t("auto.g_0648", "설정 > 보안 > 알수 없는 측에서 다운로드 허용을 켜주세요.")
}, {
  num: "03",
  title: i18n.t("auto.g_0649", "APK 파일 열기"),
  desc: i18n.t("auto.g_0650", "다운로드된 migoapp.apk 파일을 틭하세요.")
}, {
  num: "04",
  title: i18n.t("auto.g_0651", "설치 시작"),
  desc: i18n.t("auto.g_0652", "설치 버튼을 눌러 앱 설치를 완료해 주세요.")
}];
const faqs = [{
  q: i18n.t("auto.g_0653", "구글 플레이에 없나요?"),
  a: i18n.t("auto.g_0654", "현재 내부 테스터 단계로 APK 직접 다운로드로 제공합니다. 정식 출시 시 플레이스토어를 지원할 예정입니다.")
}, {
  q: i18n.t("auto.g_0655", "플레이스토어 외에서 다운로드해도 안전한가요?"),
  a: i18n.t("auto.z_PlayStore외_497", "PlayStore외")
}, {
  q: i18n.t("auto.g_0656", "최소 안드로이드 버전은?"),
  a: i18n.t("auto.z_Android80O_499", "Android80O")
}, {
  q: i18n.t("auto.g_0657", "업데이트는 어떻게 하나요?"),
  a: i18n.t("auto.g_0658", "새 버전이 출시되면 앱내 알림으로 안내해 드릴 예정입니다.")
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
      title: t("auto.g_0029", "링크가 복사되었습니다! 📋")
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
          <h1 className="text-3xl font-extrabold mb-1 truncate">{t("auto.g_0659", "Migo 베타")}</h1>
          <p className="text-muted-foreground text-sm mb-2">v{APP_VERSION} · Android · {APP_SIZE}</p>
          <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-6 truncate">
            <Shield size={12} />{t("auto.g_0660", "내부 테스터 버전")}</div>

          {/* Download Button */}
          <motion.button whileTap={{
          scale: 0.96
        }} onClick={handleDownload} className="w-full max-w-xs mx-auto flex items-center justify-center gap-3 py-4 rounded-2xl text-base font-extrabold shadow-lg text-primary-foreground" style={{
          background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.8) 100%)"
        }}>
            <Download size={20} />{t("auto.g_0661", "APK 다운로드")}</motion.button>

          {/* Share link */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">{pageUrl}</span>
            <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-primary font-semibold">
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? t("auto.g_0662", "복사됨") : t("auto.g_0663", "복사")}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Steps */}
      <div className="px-6 pb-8">
        <h2 className="text-base font-bold mb-4 truncate">{t("auto.g_0664", "설치 방법")}</h2>
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
            <p className="text-sm font-bold mb-1 truncate">{t("auto.g_0665", "시스템 요구 사항")}</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              <li>{t("auto.z_Android80O_512", "Android80O")}</li>
              <li>{t("auto.g_0666", "저장 공간 50MB 이상")}</li>
              <li>{t("auto.g_0667", "인터넷 연결 필요")}</li>
            </ul>
          </div>
        </div>

        {/* FAQ */}
        <h2 className="text-base font-bold mt-8 mb-4 truncate">{t("auto.g_0668", "자주 묻는 질문")}</h2>
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
        <p className="text-center text-xs text-muted-foreground mt-8 truncate">{t("auto.g_0669", "이 페이지는 내부 테스터 전용입니다.")}<br />{t("auto.g_0670", "피드백은 운영팀 메일로 보내주세요.")}</p>
      </div>
    </div>;
}