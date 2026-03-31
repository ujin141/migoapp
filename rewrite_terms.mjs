import fs from 'fs';

const cleanContent = `import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsPage = () => {
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
        <h1 className="text-base font-bold text-foreground">{t("이용약관")}</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 text-sm text-muted-foreground leading-relaxed space-y-6">
        <p className="text-xs text-muted-foreground">{t("legalPages.lastUpdated")}</p>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">{t("제1조 (목적)")}</h2>
          <p>{t("본 약관은 Migo(이하 '서비스')가 제공하는 여행자 매칭 및 커뮤니티 서비스의 이용에 관한 조건과 절차를 규정함을 목적으로 합니다.")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">{t("제2조 (서비스 이용)")}</h2>
          <p>{t("서비스는 만 18세 이상의 사용자에게 제공됩니다. 허위 정보 등록, 타인 사칭, 불법적 목적의 이용은 금지됩니다. 사용자는 관련 법령 및 본 약관을 준수하여 서비스를 이용해야 합니다.")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">{t("제3조 (계정 관리)")}</h2>
          <p>{t("사용자는 계정 보안에 대한 책임을 집니다. 타인에게 계정을 양도하거나 공유할 수 없습니다. 계정 도용이 의심될 경우 즉시 Migo에 신고하여야 합니다.")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">{t("제4조 (콘텐츠)")}</h2>
          <p>{t("사용자가 게시한 콘텐츠의 저작권은 사용자에게 있으나, Migo는 서비스 운영을 위해 해당 콘텐츠를 사용할 수 있는 비독점적 라이선스를 갖습니다. 타인의 권리를 침해하는 콘텐츠는 사전 통보 없이 삭제될 수 있습니다.")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">{t("제5조 (금지 행위)")}</h2>
          <p>{t("다음 행위는 엄격히 금지됩니다:")}</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>{t("스팸 및 허위 정보 유포")}</li>
            <li>{t("타인 괴롭힘 및 혐오 발언")}</li>
            <li>{t("불법 콘텐츠 게시")}</li>
            <li>{t("서비스 시스템 접근 시도")}</li>
            <li>{t("상업적 목적의 무단 이용")}</li>
          </ul>
          <p>{t("위반 시 사전 경고 없이 계정이 즉시 정지 또는 삭제될 수 있습니다.")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">{t("제6조 (서비스 변경 및 중단)")}</h2>
          <p>{t("Migo는 서비스를 언제든지 변경하거나 종료할 수 있으며, 중요한 변경 사항은 최소 7일 전에 공지합니다. 서비스 중단으로 인한 손해에 대해 Migo는 책임을 지지 않습니다.")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">{t("제7조 (면책 조항)")}</h2>
          <p>{t("Migo는 사용자 간 발생하는 분쟁에 대해 직접적인 책임을 지지 않습니다. 서비스 이용으로 인한 여행 중 사고, 대인 관계 문제 등에 대해 Migo는 법적 책임이 없습니다.")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">{t("제8조 (준거법 및 관할)")}</h2>
          <p>{t("본 약관은 대한민국 법률에 따라 해석되며, 분쟁 발생 시 서울중앙지방법원을 제1심 관할 법원으로 합니다.")}</p>
        </section>

        <div className="border-t border-border pt-4">
          <p className="text-xs">{t("문의:")} <a href="mailto:support@migo-go.com" className="text-primary underline">support@migo-go.com</a></p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
`;

fs.writeFileSync('src/pages/TermsPage.tsx', cleanContent, 'utf8');
console.log('TermsPage rewritten');
