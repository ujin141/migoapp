import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
const TermsPage = () => {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  return <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 border-b border-border shrink-0 sticky top-0 bg-background/90 backdrop-blur-sm z-10">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center transition-transform active:scale-90">
          <ArrowLeft size={16} className="text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">{t("auto.z_\uC774\uC6A9\uC57D\uAD00_27")}</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 text-sm text-muted-foreground leading-relaxed space-y-6">
        <p className="text-xs text-muted-foreground">{t("legalPages.lastUpdated")}</p>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">{t("auto.z_\uC81C1\uC870\uBAA9\uC801_28")}</h2>
          <p>{t("auto.z_\uBCF8\uC57D\uAD00\uC740Migo\uC774\uD558_29")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">{t("auto.z_\uC81C2\uC870\uC11C\uBE44\uC2A4\uC774\uC6A9_30")}</h2>
          <p>{t("auto.z_\uC11C\uBE44\uC2A4\uB294\uB9CC18\uC138\uC774\uC0C1_31")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">{t("auto.z_\uC81C3\uC870\uACC4\uC815\uAD00\uB9AC_32")}</h2>
          <p>{t("auto.z_\uC0AC\uC6A9\uC790\uB294\uACC4\uC815\uBCF4\uC548\uC5D0\uB300_33")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">{t("auto.z_\uC81C4\uC870\uCF58\uD150\uCE20_34")}</h2>
          <p>{t("auto.z_\uC0AC\uC6A9\uC790\uAC00\uAC8C\uC2DC\uD55C\uCF58\uD150\uCE20_35")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">{t("auto.z_\uC81C5\uC870\uAE08\uC9C0\uD589\uC704_36")}</h2>
          <p>{t("auto.z_\uB2E4\uC74C\uD589\uC704\uB294\uC5C4\uACA9\uD788\uAE08\uC9C0_37")}</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>{t("auto.z_\uC2A4\uD338\uBC0F\uD5C8\uC704\uC815\uBCF4\uC720\uD3EC_38")}</li>
            <li>{t("auto.z_\uD0C0\uC778\uAD34\uB86D\uD798\uBC0F\uD610\uC624\uBC1C\uC5B8_39")}</li>
            <li>{t("auto.z_\uBD88\uBC95\uCF58\uD150\uCE20\uAC8C\uC2DC_40")}</li>
            <li>{t("auto.z_\uC11C\uBE44\uC2A4\uC2DC\uC2A4\uD15C\uC811\uADFC\uC2DC\uB3C4_41")}</li>
            <li>{t("auto.z_\uC0C1\uC5C5\uC801\uBAA9\uC801\uC758\uBB34\uB2E8\uC774\uC6A9_42")}</li>
          </ul>
          <p>{t("auto.z_\uC704\uBC18\uC2DC\uC0AC\uC804\uACBD\uACE0\uC5C6\uC774\uACC4_43")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">{t("auto.z_\uC81C6\uC870\uC11C\uBE44\uC2A4\uBCC0\uACBD\uBC0F\uC911_44")}</h2>
          <p>{t("auto.z_Migo\uB294\uC11C\uBE44\uC2A4\uB97C\uC5B8_45")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">{t("auto.z_\uC81C7\uC870\uBA74\uCC45\uC870\uD56D_46")}</h2>
          <p>{t("auto.z_Migo\uB294\uC0AC\uC6A9\uC790\uAC04\uBC1C_47")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">{t("auto.z_\uC81C8\uC870\uC900\uAC70\uBC95\uBC0F\uAD00\uD560_48")}</h2>
          <p>{t("auto.z_\uBCF8\uC57D\uAD00\uC740\uB300\uD55C\uBBFC\uAD6D\uBC95\uB960_49")}</p>
        </section>

        <div className="border-t border-border pt-4">
          <p className="text-xs">{t("auto.z_\uBB38\uC758_50")} <a href="mailto:support@migo-go.com" className="text-primary underline">support@migo-go.com</a></p>
        </div>
      </div>
    </div>;
};
export default TermsPage;