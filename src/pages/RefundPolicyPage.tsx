import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, RefreshCw, Apple, HelpCircle, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function RefundPolicyPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-white shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 truncate">{t("auto.g_0929", "환불 및 구독 취소 정책")}</h1>
      </header>

      <main className="max-w-2xl mx-auto bg-white px-6 py-8">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-1 truncate">{t("auto.g_0930", "환불 및 취소 정책")}</h2>
          <p className="text-xs text-gray-400">Refund & Cancellation Policy — Updated: April 2, 2026</p>
        </div>

        {/* Subscription Plans */}
        <section className="mb-8">
          <h2 className="font-bold text-base text-gray-900 mb-4 flex items-center gap-2 truncate">
            <CreditCard className="w-4 h-4 text-purple-500" />
            {t("auto.g_0931", "구독 요금제")}</h2>
          <div className="space-y-3">
            <div className="border-2 border-purple-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-purple-700">✨ Migo Plus</span>
                <span className="text-sm font-bold text-gray-700 truncate">{t("auto.g_0932", "₩9,900 / 월")}</span>
              </div>
              <p className="text-xs text-gray-500 truncate">{t("auto.g_0933", "일일 좋아요 50개, 슈퍼라이크 5개/일, 고급 필터, 광고 제외")}</p>
            </div>
            <div className="border-2 border-amber-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-amber-700">👑 Migo Premium</span>
                <span className="text-sm font-bold text-gray-700 truncate">{t("auto.g_0934", "₩19,900 / 월")}</span>
              </div>
              <p className="text-xs text-gray-500 truncate">{t("auto.g_0935", "좋아요/슈퍼라이크 무제한, 프리미엄 그룹, VIP 테마, AI 여행 플래닝")}</p>
            </div>
          </div>
        </section>

        {/* Auto-renewal */}
        <section className="mb-8">
          <h2 className="font-bold text-base text-gray-900 mb-3 flex items-center gap-2 truncate">
            <RefreshCw className="w-4 h-4 text-blue-500" />
            {t("auto.g_0936", "자동 갱신 안내")}</h2>
          <div className="bg-blue-50 rounded-2xl p-4 text-sm text-blue-800 space-y-2">
            <p className="truncate">{t("auto.g_0937", "구독은")}<strong>{t("auto.g_0938", "갱신 24시간 전까지 취소하지 않으면 자동으로 갱신")}</strong>{t("auto.g_0939", "됩니다.")}</p>
            <p className="truncate">{t("auto.g_0940", "자동 갱신 금액은 현재 구독 요금과 동일하게 Apple 계정으로 청구됩니다.")}</p>
          </div>
        </section>

        {/* Cancellation */}
        <section className="mb-8">
          <h2 className="font-bold text-base text-gray-900 mb-3 flex items-center gap-2 truncate">
            <Clock className="w-4 h-4 text-orange-500" />
            {t("auto.g_0941", "구독 취소 방법")}</h2>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="font-semibold text-gray-800 mb-2 truncate">{t("auto.g_0942", "📱 iOS에서 취소")}</p>
              <ol className="list-decimal pl-5 text-sm text-gray-600 space-y-1">
                <li>{t("auto.g_0943", "iPhone 설정 앱 열기")}</li>
                <li>{t("auto.g_0944", "상단 Apple ID 탭")}</li>
                <li>{t("auto.g_0945", "'구독' 선택")}</li>
                <li>{t("auto.g_0946", "Migo 구독 선택 → '구독 취소'")}</li>
              </ol>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="font-semibold text-gray-800 mb-2 truncate">{t("auto.g_0947", "💻 데스크탑에서 취소")}</p>
              <p className="text-sm text-gray-600 truncate">{t("auto.g_0948", "iTunes 또는")}<a href="https://appleid.apple.com" className="text-blue-500 underline" target="_blank" rel="noreferrer">appleid.apple.com</a> {t("auto.g_0949", "→ 구독 관리에서 취소")}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2 truncate">{t("auto.g_0950", "취소 후에도 현재 구독 기간이 끝날 때까지 프리미엄 기능을 계속 이용할 수 있습니다.")}</p>
        </section>

        {/* Refund */}
        <section className="mb-8">
          <h2 className="font-bold text-base text-gray-900 mb-3 flex items-center gap-2 truncate">
            <Apple className="w-4 h-4 text-gray-700" />
            {t("auto.g_0951", "환불 요청")}</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
            <p className="text-sm text-amber-800 truncate">
              <strong>{t("auto.g_0952", "중요:")}</strong> {t("auto.g_0953", "Migo의 모든 결제는 Apple 인앱결제를 통해 이루어지며,")}<strong>{t("auto.g_0954", "환불은 Apple의 정책에 따라 처리됩니다.")}</strong> {t("auto.g_0955", "회사는 Apple을 통하지 않고 직접 환불할 수 없습니다.")}</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="font-semibold text-gray-800 mb-2 truncate">{t("auto.g_0956", "환불 신청 방법:")}</p>
            <ol className="list-decimal pl-5 text-sm text-gray-600 space-y-2">
              <li>
                <a href="https://reportaproblem.apple.com" className="text-blue-500 underline font-semibold" target="_blank" rel="noreferrer">reportaproblem.apple.com</a> {t("auto.g_0957", "접속")}</li>
              <li>{t("auto.g_0958", "Apple ID로 로그인")}</li>
              <li>{t("auto.g_0959", "환불할 항목 선택 → '문제 신고'")}</li>
              <li>{t("auto.g_0960", "'구입이 실수였습니다' 또는 해당 사유 선택")}</li>
            </ol>
          </div>
          <div className="mt-3 space-y-2 text-sm text-gray-600">
            <p className="font-semibold text-gray-800 truncate">{t("auto.g_0961", "환불 가능 여부 기준 (Apple 정책):")}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t("auto.g_0962", "구매 후 14일 이내 미사용 구독: 환불 가능")}</li>
              <li>{t("auto.g_0963", "이미 사용된 구독 기간: 부분 환불 검토 (Apple 재량)")}</li>
              <li>{t("auto.g_0964", "소모성 아이템 (부스트, 슈퍼라이크 등): 사용 후 환불 불가")}</li>
            </ul>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-8">
          <h2 className="font-bold text-base text-gray-900 mb-3 flex items-center gap-2 truncate">
            <HelpCircle className="w-4 h-4 text-blue-500" />
            {t("auto.g_0965", "추가 문의")}</h2>
          <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-700 space-y-1">
            <p className="truncate">{t("auto.g_0966", "환불 또는 결제 관련 추가 문의사항이 있으시면 아래로 연락주세요.")}</p>
            <p>📧 <a href="mailto:support@lunaticsgroup.com" className="text-blue-500 underline">support@lunaticsgroup.com</a></p>
            <p className="text-xs text-gray-400 mt-2 truncate">{t("auto.g_0967", "응답 시간: 영업일 기준 1~3일 이내")}</p>
          </div>
        </section>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 truncate">
            © 2026 Lunatics Group Inc. All rights reserved.<br />
            {t("auto.g_0968", "최종 업데이트: 2026년 4월 2일")}</p>
        </div>
      </main>
    </div>
  );
}
