import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Heart, Shield, AlertTriangle, Flag, CheckCircle, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function CommunityGuidelinesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-white shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 truncate">{t("auto.g_0579", "커뮤니티 가이드라인")}</h1>
      </header>

      <main className="max-w-2xl mx-auto bg-white px-6 py-8">
        {/* Hero */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2 truncate">{t("auto.g_0580", "Migo 커뮤니티 가이드라인")}</h2>
          <p className="text-sm text-gray-500 truncate">
            {t("auto.g_0581", "Migo는 전 세계 여행자들이")}<strong>{t("auto.g_0582", "안전하고 즐겁게")}</strong> {t("auto.g_0583", "연결될 수 있는 공간입니다.")}<br />
            {t("auto.g_0584", "아래 가이드라인은 모든 이용자에게 동등하게 적용됩니다.")}</p>
        </div>

        {/* Core Values */}
        <div className="grid grid-cols-3 gap-3 mb-8 truncate">
          {[
            { icon: <Heart className="w-5 h-5" />, label: t("auto.g_0601", "존중"), color: "bg-red-50 text-red-500" },
            { icon: <Shield className="w-5 h-5" />, label: t("auto.g_0602", "안전"), color: "bg-blue-50 text-blue-500" },
            { icon: <CheckCircle className="w-5 h-5" />, label: t("auto.g_0603", "진실성"), color: "bg-emerald-50 text-emerald-500" },
          ].map(({ icon, label, color }) => (
            <div key={label} className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-gray-50">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>{icon}</div>
              <span className="text-xs font-bold text-gray-700">{label}</span>
            </div>
          ))}
        </div>

        {/* DO */}
        <section className="mb-6">
          <h2 className="flex items-center gap-2 font-bold text-base text-gray-900 mb-3 truncate">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            {t("auto.g_0585", "이렇게 해주세요 ✅")}</h2>
          <div className="space-y-2 truncate">
            {[
              t("auto.g_0604", "상대방을 존중하고 친절하게 대해주세요."),
              t("auto.g_0605", "실제 자신의 사진과 정보로 프로필을 만들어주세요."),
              t("auto.g_0606", "오프라인 만남 전 공개 장소를 선택하고 지인에게 일정을 알려주세요."),
              t("auto.g_0607", "불쾌한 이용자는 즉시 신고 및 차단해주세요."),
              t("auto.g_0608", "채팅과 게시물에서 여행 관련 건전한 내용만 공유해주세요."),
              t("auto.g_0609", "그룹 활동 시 사전에 규칙을 정하고 서로 소통해주세요."),
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-700 bg-emerald-50 rounded-xl px-4 py-2.5">
                <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                {text}
              </div>
            ))}
          </div>
        </section>

        {/* DON'T */}
        <section className="mb-8">
          <h2 className="flex items-center gap-2 font-bold text-base text-gray-900 mb-3 truncate">
            <XCircle className="w-5 h-5 text-red-500" />
            {t("auto.g_0586", "이런 행동은 금지됩니다 🚫")}</h2>
          <div className="space-y-2 truncate">
            {[
              { text: t("auto.g_0610", "괴롭힘, 혐오 발언, 위협, 스토킹"), severity: "high" },
              { text: t("auto.g_0611", "성적으로 노골적인 사진 또는 콘텐츠 공유"), severity: "high" },
              { text: t("auto.g_0612", "미성년자(18세 미만)에게 접근하거나 부적절한 대화 시도"), severity: "high" },
              { text: t("auto.g_0613", "사기, 금전 요구, 허위 이벤트 홍보"), severity: "high" },
              { text: t("auto.g_0614", "타인 계정 도용 또는 허위 신원 사용"), severity: "high" },
              { text: t("auto.g_0615", "개인 연락처, 주소, 민감 정보 무단 공유"), severity: "medium" },
              { text: t("auto.g_0616", "스팸 메시지 발송 또는 무분별한 광고"), severity: "medium" },
              { text: t("auto.g_0617", "상업적 목적의 불법 영업 행위"), severity: "medium" },
              { text: t("auto.g_0618", "서비스 해킹, 봇 사용, 자동화 악용"), severity: "high" },
            ].map(({ text, severity }, i) => (
              <div key={i} className={`flex items-start gap-2 text-sm rounded-xl px-4 py-2.5 ${severity === "high" ? "bg-red-50 text-red-800" : "bg-orange-50 text-orange-800"}`}>
                <span className="font-bold mt-0.5">✗</span>
                {text}
              </div>
            ))}
          </div>
        </section>

        {/* Special: Protection from Minors */}
        <section className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-5">
          <h2 className="flex items-center gap-2 font-extrabold text-red-700 mb-3 truncate">
            <AlertTriangle className="w-5 h-5" />
            {t("auto.g_0587", "아동 및 청소년 보호 정책")}</h2>
          <p className="text-sm text-red-700 leading-relaxed truncate">
            {t("auto.g_0588", "Migo는 아동 및 청소년 보호를 최우선으로 합니다. 미성년자를 겨냥한 어떠한 성적, 착취적 행위도 용납하지 않으며, 이는 즉각적인 영구 계정 정지 및 관련 기관(경찰, Apple App Store)에 신고 조치됩니다.")}</p>
          <p className="text-xs text-red-600 mt-2 truncate">{t("auto.g_0589", "의심스러운 활동을 목격하면 즉시 신고하거나")}<a href="mailto:safety@lunaticsgroup.com" className="underline">safety@lunaticsgroup.com</a>{t("auto.g_0590", "으로 연락주세요.")}</p>
        </section>

        {/* Reporting */}
        <section className="mb-8">
          <h2 className="flex items-center gap-2 font-bold text-base text-gray-900 mb-3 truncate">
            <Flag className="w-5 h-5 text-orange-500" />
            {t("auto.g_0591", "신고 방법")}</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="font-semibold truncate">{t("auto.g_0592", "🔴 프로필/사용자 신고")}</p>
              <p className="text-xs text-gray-500 truncate">{t("auto.g_0593", "프로필 상세 화면 → 우측 상단 ⋯ 메뉴 → '신고하기'")}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="font-semibold truncate">{t("auto.g_0594", "🔴 채팅 내 신고")}</p>
              <p className="text-xs text-gray-500 truncate">{t("auto.g_0595", "채팅방 우측 상단 ⋯ → '신고 및 차단'")}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="font-semibold truncate">{t("auto.g_0596", "📧 이메일 신고")}</p>
              <p className="text-xs text-gray-500"><a href="mailto:safety@lunaticsgroup.com" className="text-blue-500 underline">safety@lunaticsgroup.com</a></p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 truncate">{t("auto.g_0597", "모든 신고는 24시간 이내 검토하며, 심각한 경우 즉시 조치합니다.")}</p>
        </section>

        {/* Consequences */}
        <section className="mb-8">
          <h2 className="font-bold text-base text-gray-900 mb-3 truncate">{t("auto.g_0598", "가이드라인 위반 시 조치")}</h2>
          <div className="space-y-2 truncate">
            {[
              { step: t("auto.g_0619", "1단계"), action: t("auto.g_0620", "경고 및 해당 콘텐츠 삭제"), color: "bg-yellow-50 border-yellow-200" },
              { step: t("auto.g_0621", "2단계"), action: t("auto.g_0622", "기능 일시 제한 (7~30일)"), color: "bg-orange-50 border-orange-200" },
              { step: t("auto.g_0623", "3단계"), action: t("auto.g_0624", "영구 계정 정지"), color: "bg-red-50 border-red-200" },
              { step: t("auto.g_0625", "즉시"), action: t("auto.g_0626", "아동 성 착취물, 심각한 위협 → 즉각 신고 및 영구 정지"), color: "bg-red-100 border-red-300" },
            ].map(({ step, action, color }) => (
              <div key={step} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${color}`}>
                <span className="text-xs font-extrabold text-gray-500 shrink-0 w-12">{step}</span>
                <span className="text-sm text-gray-700">{action}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 truncate">
            {t("auto.g_0599", "커뮤니티 가이드라인은 모든 이용자를 위해 지속적으로 업데이트됩니다.")}<br />
            {t("auto.g_0600", "최종 업데이트: 2026년 4월 2일")}<br /><br />
            © 2026 Lunatics Group Inc.
          </p>
        </div>
      </main>
    </div>
  );
}
