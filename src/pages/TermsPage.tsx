import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Users, ShieldAlert, CreditCard, AlertTriangle, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function TermsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const Section = ({ num, title, children }: { num: string; title: string; children: React.ReactNode }) => (
    <section className="mb-8">
      <h2 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100 truncate">
        {t("auto.g_0975", "제")}{num}{t("auto.g_0976", "조")}{title}
      </h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-2">{children}</div>
    </section>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-white shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 truncate">{t("auto.g_0977", "이용약관")}</h1>
      </header>

      <main className="max-w-2xl mx-auto bg-white px-6 py-8">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-1 truncate">{t("auto.g_0978", "Migo 서비스 이용약관")}</h2>
          <p className="text-xs text-gray-400">Terms of Service — Effective: April 2, 2026</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-8 text-xs text-amber-800 truncate">
          {t("auto.g_0979", "본 약관은 Lunatics Group Inc.(이하 '회사')가 제공하는 Migo 앱(이하 '서비스') 이용에 관한 조건을 정합니다. 서비스를 이용하면 본 약관에 동의한 것으로 간주합니다. 반드시 끝까지 읽어주세요.")}</div>

        <Section num="1" title={t("auto.g_1034", "목적")}>
          <p className="truncate">{t("auto.g_0980", "본 약관은 Migo 서비스의 이용 조건 및 절차, 회사와 이용자 간의 권리·의무를 규정함을 목적으로 합니다.")}</p>
        </Section>

        <Section num="2" title={t("auto.g_1035", "이용자 자격 및 연령 제한")}>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="font-bold text-red-700 truncate">{t("auto.g_0981", "⚠️ 연령 제한: 만 18세 이상만 이용 가능합니다.")}</p>
          </div>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>{t("auto.g_0982", "만 18세 미만의 청소년은 법정대리인의 동의 없이 서비스를 이용할 수 없습니다.")}</li>
            <li>{t("auto.g_0983", "회사는 이용자의 연령 확인을 위해 본인 인증을 요청할 수 있습니다.")}</li>
            <li>{t("auto.g_0984", "미성년자로 확인될 경우, 사전 통지 없이 계정을 즉시 삭제할 수 있습니다.")}</li>
          </ul>
        </Section>

        <Section num="3" title={t("auto.g_1036", "계정 등록 및 관리")}>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t("auto.g_0985", "이용자는 실명 및 실제 정보로 가입해야 합니다. 허위 정보 제공 시 계정 삭제 및 법적 책임이 부과될 수 있습니다.")}</li>
            <li>{t("auto.g_0986", "계정 내 모든 활동에 대한 책임은 이용자 본인에게 있습니다.")}</li>
            <li>{t("auto.g_0987", "비밀번호는 적절히 관리해야 하며, 타인과 공유할 수 없습니다.")}</li>
            <li>{t("auto.g_0988", "계정 도용 또는 비인가 접근을 발견한 즉시 회사에 신고해야 합니다.")}</li>
          </ul>
        </Section>

        <Section num="4" title={t("auto.g_1037", "서비스 내용")}>
          <p className="mb-2 truncate">{t("auto.g_0989", "회사는 다음 서비스를 제공합니다:")}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t("auto.g_0990", "위치 기반 여행자 매칭 서비스 (스와이크, 라이크, 슈퍼라이크)")}</li>
            <li>{t("auto.g_0991", "실시간 채팅 및 1:1 메시지")}</li>
            <li>{t("auto.g_0992", "여행 그룹 생성 및 참여")}</li>
            <li>{t("auto.g_0993", "여행 커뮤니티 (게시판, 댓글)")}</li>
            <li>{t("auto.g_0994", "주변 여행자 탐색 (Nearby)")}</li>
            <li>{t("auto.g_0995", "여행 일정 및 캘린더")}</li>
            <li>{t("auto.g_0996", "Migo Plus / Premium 구독 서비스")}</li>
          </ul>
        </Section>

        <Section num="5" title={t("auto.g_1038", "금지 행위")}>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="font-semibold text-red-700 mb-2 truncate">{t("auto.g_0997", "다음 행위는 엄격히 금지됩니다:")}</p>
            <ul className="list-disc pl-5 space-y-1 text-red-800 text-xs">
              <li>{t("auto.g_0998", "스팸, 허위 정보, 사기 행위")}</li>
              <li>{t("auto.g_0999", "타인 괴롭힘, 혐오 발언, 위협, 스토킹")}</li>
              <li>{t("auto.g_1000", "불법 콘텐츠 게시 (아동 성 착취물 등)")}</li>
              <li>{t("auto.g_1001", "성적 수치심을 주는 콘텐츠 게시")}</li>
              <li>{t("auto.g_1002", "사기 목적의 금전 요구")}</li>
              <li>{t("auto.g_1003", "미성년자 접촉 시도")}</li>
              <li>{t("auto.g_1004", "서비스 시스템 해킹 또는 접근 시도")}</li>
              <li>{t("auto.g_1005", "타인의 개인정보 무단 수집 및 공유")}</li>
              <li>{t("auto.g_1006", "상업적 광고 목적의 무단 이용")}</li>
              <li>{t("auto.g_1007", "타인 계정 도용 또는 허위 신원 사용")}</li>
            </ul>
          </div>
          <p className="mt-2 text-xs text-gray-500 truncate">{t("auto.g_1008", "위반 시 사전 경고 없이 영구 계정 정지 및 법적 조치를 취할 수 있습니다.")}</p>
        </Section>

        <Section num="6" title={t("auto.g_1039", "콘텐츠 및 지식재산권")}>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t("auto.g_1009", "이용자가 업로드한 사진, 글 등 콘텐츠의 저작권은 이용자에게 있습니다.")}</li>
            <li>{t("auto.g_1010", "단, 이용자는 서비스 운영에 필요한 범위 내에서 회사가 해당 콘텐츠를 이용할 수 있도록 비독점적 라이선스를 부여합니다.")}</li>
            <li>{t("auto.g_1011", "Migo 앱, 로고, 디자인, 코드 등의 지식재산권은 회사에 귀속됩니다.")}</li>
          </ul>
        </Section>

        <Section num="7" title={t("auto.g_1040", "유료 서비스 및 환불 정책")}>
          <div className="space-y-3">
            <div className="bg-purple-50 rounded-xl p-3">
              <p className="font-semibold text-purple-800 mb-2 truncate">{t("auto.g_1012", "구독 요금제:")}</p>
              <ul className="text-xs text-purple-700 space-y-1">
                <li>{t("auto.g_1013", "• Migo Plus: 월 ₩9,900 / 연 ₩79,200")}</li>
                <li>{t("auto.g_1014", "• Migo Premium: 월 ₩19,900 / 연 ₩159,200")}</li>
              </ul>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>{t("auto.g_1015", "모든 결제는 Apple 인앱결제(IAP)를 통해 처리됩니다.")}</li>
              <li>{t("auto.g_1016", "구독은 갱신일 24시간 전까지 취소하지 않으면 자동 갱신됩니다.")}</li>
              <li><strong>{t("auto.g_1017", "환불 정책:")}</strong> {t("auto.g_1018", "Apple App Store 환불 정책을 따릅니다. 환불은")}<a href="https://reportaproblem.apple.com" className="text-purple-600 underline" target="_blank" rel="noreferrer">reportaproblem.apple.com</a>{t("auto.g_1019", "을 통해 신청하시기 바랍니다.")}</li>
              <li>{t("auto.g_1020", "구독 취소: iOS 설정 &gt; Apple ID &gt; 구독에서 가능합니다.")}</li>
              <li>{t("auto.g_1021", "디지털 콘텐츠(부스트, 슈퍼라이크 등 소모성 상품) 특성상 사용된 아이템은 환불이 어려울 수 있습니다.")}</li>
            </ul>
          </div>
        </Section>

        <Section num="8" title={t("auto.g_1041", "서비스 변경 및 중단")}>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t("auto.g_1022", "회사는 서비스 내용을 변경하거나 중단할 수 있으며, 30일 전 앱 내 공지 또는 이메일로 안내합니다.")}</li>
            <li>{t("auto.g_1023", "긴급 보안 패치 등 불가피한 경우 사전 통지 없이 일시 중단할 수 있습니다.")}</li>
          </ul>
        </Section>

        <Section num="9" title={t("auto.g_1042", "면책 조항")}>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t("auto.g_1024", "Migo는 여행자 간 연결 플랫폼으로, 이용자 간 발생하는 분쟁, 사고, 금전 거래에 대해 직접적인 책임을 지지 않습니다.")}</li>
            <li>{t("auto.g_1025", "오프라인 만남 전 공개 장소 선택, 지인에게 일정 공유 등 개인 안전에 유의해주세요.")}</li>
            <li>{t("auto.g_1026", "회사는 서비스 이용 중 발생한 데이터 손실, 비즈니스 손실에 대해 법령이 허용하는 범위 내에서 책임을 제한합니다.")}</li>
          </ul>
        </Section>

        <Section num="10" title={t("auto.g_1043", "분쟁 해결 및 준거법")}>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t("auto.g_1027", "본 약관은 대한민국 법령에 따라 해석됩니다.")}</li>
            <li>{t("auto.g_1028", "서비스 이용과 관련한 분쟁은 서울중앙지방법원을 관할 법원으로 합니다.")}</li>
            <li>{t("auto.g_1029", "해외 이용자의 경우, 현지 법률이 우선 적용될 수 있습니다.")}</li>
          </ul>
        </Section>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-start gap-3 text-sm text-gray-600 bg-gray-50 rounded-xl p-4">
            <Phone className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-800 truncate">{t("auto.g_1030", "문의")}</p>
              <p className="truncate">{t("auto.g_1031", "이용약관 관련 문의:")}<a href="mailto:support@lunaticsgroup.com" className="text-blue-500 underline">support@lunaticsgroup.com</a></p>
              <p className="text-xs text-gray-400 mt-1 truncate">{t("auto.g_1032", "Lunatics Group Inc. | 대표: 송우진")}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400 truncate">
            {t("auto.g_1033", "본 약관은 2026년 4월 2일부터 적용됩니다.")}<br />
            © 2026 Lunatics Group Inc. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}