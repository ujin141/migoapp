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

        <section className="space-y-2 bg-primary/5 p-4 rounded-xl border border-primary/10">
          <h2 className="text-sm font-bold text-primary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            Data Destruction Guarantee
          </h2>
          <p className="text-xs text-foreground/80 leading-relaxed font-medium">
            1. <strong>위치 정보 자동 파기:</strong> 서비스 안정성을 위해 수집된 모든 일회성 위치 데이터(GPS)는 마지막 접속 후 24시간이 경과하면 백엔드 자동화 스케줄러(Cron)에 의해 영구 비식별화(NULL) 처리됩니다.
            <br/><br/>
            2. <strong>탈퇴 시 연쇄 영구 파기(CASCADE):</strong> 회원이 탈퇴할 경우 최상위 계정 기록이 제거됨과 동시에, 프로필, 매칭 내역, 채팅방 메시지, 결제 이력 등 모든 파생 데이터가 <strong>"하드 삭제(Hard Delete)"</strong> 방식으로 물리적 디스크에서 영구히 지워집니다.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">{t("privacy.h8")}</h2>
          <div className="bg-muted rounded-2xl p-4 text-xs space-y-1">
            <p><span className="font-semibold text-foreground">{t("privacy.managerLabel")}</span> {t("privacy.managerName")}</p>
            <p><span className="font-semibold text-foreground">{t("privacy.emailLabel")}</span> <a href="mailto:privacy@lunaticsgroup.com" className="text-primary underline">privacy@lunaticsgroup.com</a></p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
