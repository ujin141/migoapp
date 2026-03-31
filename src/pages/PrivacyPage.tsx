import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 border-b border-border shrink-0 sticky top-0 bg-background/90 backdrop-blur-sm z-10">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center transition-transform active:scale-90"
        >
          <ArrowLeft size={16} className="text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">{t("legalPages.privacyTitle")}</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 text-sm text-muted-foreground leading-relaxed space-y-6">
        <p className="text-xs text-muted-foreground">{t("legalPages.lastUpdated")}</p>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">{t("auto.j545")}</h2>
          <div className="bg-muted rounded-2xl p-4 space-y-2 text-xs">
            <p><span className="font-semibold text-foreground">{t("auto.j546")}</span> {t("auto.j547")}</p>
            <p><span className="font-semibold text-foreground">{t("auto.j548")}</span> {t("auto.j549")}</p>
            <p><span className="font-semibold text-foreground">{t("auto.j550")}</span> {t("auto.j551")}</p>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">{t("auto.j552")}</h2>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>{t("auto.j553")}</li>
            <li>{t("auto.j554")}</li>
            <li>{t("auto.j555")}</li>
            <li>{t("auto.j556")}</li>
            <li>{t("auto.j557")}</li>
            <li>{t("auto.j558")}</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">{t("auto.j559")}</h2>
          <p>{t("auto.j560")}</p>
          <p>{t("auto.j561")}</p>
          <div className="bg-muted rounded-2xl p-4 space-y-1 text-xs">
            <p>{t("auto.j562")}</p>
            <p>{t("auto.j563")}</p>
            <p>{t("auto.j564")}</p>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">{t("auto.j565")}</h2>
          <p>{t("auto.j566")}</p>
          <p>{t("auto.j567")}</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>{t("auto.j568")}</li>
            <li>{t("privacy.bullet1")}</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">{t("privacy.h5")}</h2>
          <div className="bg-muted rounded-2xl p-4 space-y-3 text-xs">
            <div>
              <p className="font-semibold text-foreground">{t("privacy.twilio")}</p>
              <p>{t("privacy.twilioDesc")}</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">{t("privacy.supabase")}</p>
              <p>{t("privacy.supabaseDesc")}</p>
            </div>
          </div>
          <p className="text-xs">{t("privacy.notice")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">{t("privacy.h6")}</h2>
          <p>{t("privacy.rightsIntro")}</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>{t("privacy.right1")}</li>
            <li>{t("privacy.right2")}</li>
            <li>{t("privacy.right3")}</li>
            <li>{t("privacy.right4")}</li>
            <li>{t("privacy.right5")}</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">{t("privacy.h7")}</h2>
          <p>{t("privacy.secIntro")}</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>{t("privacy.sec1")}</li>
            <li>{t("privacy.sec2")}</li>
            <li>{t("privacy.sec3")}</li>
            <li>{t("privacy.sec4")}</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">{t("privacy.h8")}</h2>
          <div className="bg-muted rounded-2xl p-4 text-xs space-y-1">
            <p><span className="font-semibold text-foreground">{t("privacy.managerLabel")}</span> {t("privacy.managerName")}</p>
            <p><span className="font-semibold text-foreground">{t("privacy.emailLabel")}</span> <a href="mailto:privacy@migo-go.com" className="text-primary underline">privacy@migo-go.com</a></p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
