import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ShieldCheck, Database, Trash2, Key,
  Globe, Bell, CreditCard, Mail, Users, Lock,
  Eye, ChevronDown, ChevronUp, AlertTriangle, MapPin, Heart
} from "lucide-react";
import { useTranslation } from "react-i18next";

// ─── Collapsible section ─────────────────────────────────────────────────────
const Section = ({
  icon, title, children, highlight
}: {
  icon: React.ReactNode; title: string; children: React.ReactNode; highlight?: boolean;
}) => {
  const [open, setOpen] = useState(true);
  return (
    <section className="mb-6 border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${highlight ? "bg-blue-50" : "bg-white"}`}
      >
        <span className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <span className="text-blue-500">{icon}</span>
          {title}
        </span>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 text-sm text-gray-600 leading-relaxed space-y-2 bg-white">
          {children}
        </div>
      )}
    </section>
  );
};

// ─── Badge component ──────────────────────────────────────────────────────────
const Badge = ({ color, children }: { color: string; children: React.ReactNode }) => (
  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mr-1 ${color}`}>
    {children}
  </span>
);

// ─── Data table row ───────────────────────────────────────────────────────────
const DRow = ({ purpose, data, retention, linked }: {
  purpose: string; data: string; retention: string; linked: boolean;
}) => (
  <tr className="border-t border-gray-100">
    <td className="px-3 py-2 text-xs">{purpose}</td>
    <td className="px-3 py-2 text-xs">{data}</td>
    <td className="px-3 py-2 text-xs">{retention}</td>
    <td className="px-3 py-2 text-xs text-center">
      {linked
        ? <span className="text-orange-500 font-bold">●</span>
        : <span className="text-green-500 font-bold">○</span>}
    </td>
  </tr>
);

// ─── Main component ───────────────────────────────────────────────────────────
export default function PrivacyPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-gray-900 truncate">{t("privacy.title", "개인정보 처리방침")}</h1>
        <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">v3.0 · 2026-04-07</span>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-2">

        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl px-6 py-7 text-white text-center mb-6 shadow-lg">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-extrabold mb-1 truncate">{t("privacy.hero_title", "Migo 개인정보 처리방침")}</h2>
          <p className="text-blue-100 text-xs leading-relaxed truncate">
            {t("privacy.hero.desc", "Migo(미고)는 개인정보 보호법, GDPR, COPPA, Apple App Store 가이드라인(5.1.2) 및 미국 CCPA를 완전히 준수합니다.")}
          </p>
          <p className="text-white/60 text-[10px] mt-3 truncate">{t("privacy.effective_date", "시행일: 2026년 4월 7일 · Lunatics Group Inc.")}</p>
        </div>

        {/* ── 1. Data collected + Apple Nutrition Labels ── */}
        <Section icon={<Database className="w-4 h-4" />} title={t("privacy.s1.title", "1. 수집하는 데이터 및 Apple 개인정보 라벨")}>
          <p className="font-semibold text-gray-800 text-xs mb-3 truncate">
            {t("privacy.s1.intro", "아래 표는 Apple App Store 개인정보 영양 라벨의 정확한 기재 내용과 동일합니다.")}
            <Badge color="bg-orange-100 text-orange-700" className="truncate">{t("auto.x4012", "● 사용자 연결")}</Badge>
            <Badge color="bg-green-100 text-green-700" className="truncate">{t("auto.x4013", "○ 비연결")}</Badge>
          </p>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">{t("auto.x4014", "목적")}</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">{t("auto.x4015", "수집 항목")}</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">{t("auto.x4016", "보유 기간")}</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">{t("auto.x4017", "사용자 연결")}</th>
                </tr>
              </thead>
              <tbody>
                <DRow purpose={t("auto.x4019", "계정 생성·관리")} data={t("auto.x4020", "이메일, 닉네임, 생년월일, 성별")} retention={t("auto.x4021", "탈퇴 시까지")} linked={true} />
                <DRow purpose={t("auto.x4022", "프로필 매칭")} data={t("auto.x4023", "사진, 자기소개, 국적, 여행 스타일, MBTI")} retention={t("auto.x4024", "탈퇴 시까지")} linked={true} />
                <DRow purpose={t("auto.x4025", "위치 기반 매칭·지도")} data={t("auto.x4026", "정밀 GPS 좌표")} retention={t("auto.x4027", "세션 종료 후 24시간")} linked={true} />
                <DRow purpose={t("auto.x4028", "채팅")} data={t("auto.x4029", "메시지 본문, 미디어")} retention={t("auto.x4030", "탈퇴 시까지")} linked={true} />
                <DRow purpose={t("auto.x4031", "푸시 알림")} data={t("auto.x4032", "FCM 토큰, 기기 OS")} retention={t("auto.x4033", "알림 해제 시까지")} linked={true} />
                <DRow purpose={t("auto.x4034", "인앱결제")} data={t("auto.x4035", "구독 이력 (카드번호 미저장)")} retention={t("auto.x4036", "5년(전자상거래법)")} linked={true} />
                <DRow purpose={t("auto.x4037", "본인 인증")} data={t("auto.x4038", "신분증 이미지")} retention={t("auto.x4039", "인증 완료 즉시 삭제")} linked={false} />
                <DRow purpose={t("auto.x4040", "앱 분석·개선")} data={t("auto.x4041", "앱 충돌 로그, 사용 패턴(익명)")} retention={t("auto.x4042", "90일")} linked={false} />
                <DRow purpose={t("auto.x4043", "광고 (선택 동의)")} data={t("auto.x4044", "IDFA(광고 식별자)")} retention={t("auto.x4045", "동의 철회 시까지")} linked={false} />
              </tbody>
            </table>
          </div>

          <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2">
            <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 truncate">
              {t("privacy.sensitive.note", "Migo는 연애·교류 앱 특성상 이용자가 자발적으로 입력한 성적 지향, 종교, 정치적 견해 등 민감 정보를 수집할 수 있습니다. 이는 오직 매칭 알고리즘 개선 목적에만 사용되며, 제3자에게 절대 판매·공유되지 않습니다.")}
            </p>
          </div>
        </Section>

        {/* ── 2. Purpose & Legal Basis ── */}
        <Section icon={<Eye className="w-4 h-4" />} title={t("privacy.s2.title", "2. 개인정보 수집 목적 및 처리 근거")}>
          <ul className="space-y-2">
            {[
              ["📍", t("privacy.s2.location", "위치 정보"), t("privacy.s2.location.desc", "앱 내 지도·주변 여행자 표시에만 사용. 백그라운드에서는 수집하지 않습니다. 정밀 위치는 미정의 상태 없이 항상 명시적 허용 후 수집합니다.")],
              ["📷", t("privacy.s2.photo", "카메라·사진"), t("privacy.s2.photo.desc", "프로필 사진 업로드, 게시물 작성에만 사용됩니다. 사진 분석·Face Recognition을 수행하지 않습니다.")],
              ["🔔", t("privacy.s2.notif", "푸시 알림"), t("privacy.s2.notif.desc", "매칭, 새 메시지, 그룹 업데이트를 알리기 위해 사용. 설정에서 언제든 해제할 수 있습니다.")],
              ["💬", t("privacy.s2.chat", "채팅 메시지"), t("privacy.s2.chat.desc", "양 당사자 간 커뮤니케이션 목적으로만 저장. 마케팅 목적으로 분석하지 않습니다.")],
              ["💳", t("privacy.s2.pay", "결제 정보"), t("privacy.s2.pay.desc", "Migo Plus/Premium 구독 처리에만 사용. 카드 번호는 Apple IAP가 처리하며 당사 서버에 저장되지 않습니다.")],
            ].map(([emoji, label, desc]) => (
              <li key={String(label)} className="flex gap-2.5">
                <span className="text-base shrink-0">{emoji}</span>
                <div>
                  <p className="font-semibold text-gray-800 text-xs">{label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        {/* ── 3. Third-party sharing ── */}
        <Section icon={<Users className="w-4 h-4" />} title={t("privacy.s3.title", "3. 제3자 제공 및 처리 위탁")}>
          <p className="text-xs text-gray-600 mb-3 truncate">
            {t("privacy.s3.intro", "회사는 서비스 운영을 위해 아래 수탁사에 최소한의 데이터를 위탁합니다. 수탁사들은 위탁 목적 외에 데이터를 사용하거나 타 제3자에게 재판매할 수 없습니다.")}
          </p>
          <div className="space-y-2 truncate">
            {[
              { name: "Supabase, Inc. (USA)", badge: t("privacy.db_badge", "데이터베이스"), purpose: t("privacy.s3.supabase", "사용자 데이터베이스, 인증, 실시간 채팅 서버"), data: t("privacy.s3.supabase.data", "프로필, 메시지, 위치(24h 후 삭제)"), link: "https://supabase.com/privacy" },
              { name: "Google LLC (USA)", badge: t("privacy.google_badge", "지도 / 인증 / 번역 / 푸시 알림"), purpose: t("privacy.s3.google", "지도 표시, Google 소셜 로그인, 언어 번역, 푸시 알림 발송"), data: t("privacy.s3.google.data", "GPS 좌표(지도), 이메일(로그인), 메시지 텍스트(번역), FCM 토큰"), link: "https://policies.google.com/privacy" },
              { name: "Apple, Inc. (USA)", badge: t("privacy.apple_badge", "푸시 알림 / 인앱 결제"), purpose: t("privacy.s3.apple", "iOS 푸시 알림(APNs), 인앱결제(IAP) 처리"), data: t("privacy.s3.apple.data", "APNs 토큰, 구독 영수증"), link: "https://www.apple.com/legal/privacy" },
            ].map(item => (
              <div key={item.name} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-xs text-gray-900">{item.name}</p>
                    <Badge color="bg-blue-100 text-blue-700">{item.badge}</Badge>
                  </div>
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 underline shrink-0">{t("privacy.ext_link", "원문 보기")}</a>
                </div>
                <p className="text-xs text-gray-600 mt-1.5"><strong>{t("privacy.s3.purpose", "목적")}:</strong> {item.purpose}</p>
                <p className="text-xs text-gray-500 mt-0.5"><strong>{t("privacy.s3.data", "전달 데이터")}:</strong> {item.data}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2 truncate">
            {t("privacy.s3.nosell", "⚠️ 회사는 사용자 데이터를 광고 네트워크, 데이터 브로커, 또는 제3자에게 판매하지 않습니다.")}
          </p>
        </Section>

        {/* ── 4. Location specifics ── */}
        <Section icon={<MapPin className="w-4 h-4" />} title={t("privacy.s4.title", "4. 위치 정보 상세 처리 방식")}>
          <ul className="list-disc pl-4 space-y-1.5 text-xs">
            <li>{t("privacy.s4.foreground", "위치 수집은 앱이 포어그라운드 상태일 때만 수행됩니다.")}</li>
            <li>{t("privacy.s4.purpose_only", "주변 여행자 표시, 더 가까운 매칭 제안, 지도 기능 이외의 목적으로 위치 데이터를 사용하지 않습니다.")}</li>
            <li>{t("privacy.s4.retention", "GPS 좌표는 세션 종료 후 24시간 이내 자동 삭제됩니다.")}</li>
            <li>{t("privacy.s4.revoke", "iOS 설정 → 개인정보 보호 및 보안 → 위치 서비스 → Migo에서 언제든지 위치 권한을 철회할 수 있습니다.")}</li>
            <li>{t("privacy.s4.background", "백그라운드 위치 추적 및 Always-On 위치 권한은 요청하지 않습니다.")}</li>
          </ul>
        </Section>

        {/* ── 5. ATT ── */}
        <Section icon={<Bell className="w-4 h-4" />} title={t("privacy.s5.title", "5. 앱 추적 투명성 (ATT — iOS 14.5+)")}>
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 mb-3">
            <p className="text-xs font-bold text-blue-800 truncate">{t("privacy.s5.att_notice", "Migo는 Apple의 ATT(앱 추적 투명성) 프레임워크를 준수합니다.")}</p>
          </div>
          <ul className="list-disc pl-4 space-y-1.5 text-xs">
            <li>{t("privacy.s5.idfa", "첫 실행 시 IDFA(광고 식별자) 사용에 대한 동의를 요청할 수 있습니다.")}</li>
            <li>{t("privacy.s5.no_track", "동의하지 않아도 앱의 모든 핵심 기능(매칭, 채팅, 지도 등)을 동일하게 이용할 수 있습니다.")}</li>
            <li>{t("privacy.s5.revoke", "동의 철회: iOS 설정 → 개인정보 보호 및 보안 → 추적 → Migo 추적 허용 끔")}</li>
            <li>{t("privacy.s5.no_fingerprint", "기기 지문(Device Fingerprinting)을 통한 추적은 사용하지 않습니다.")}</li>
          </ul>
        </Section>

        {/* ── 6. IAP ── */}
        <Section icon={<CreditCard className="w-4 h-4" />} title={t("privacy.s6.title", "6. 인앱결제 및 구독")}>
          <p className="text-xs truncate">{t("privacy.s6.iap", "Migo Plus / Premium 구독은 Apple 인앱결제(IAP)로만 처리됩니다. 회사는 신용카드 번호, CVC 등 카드 정보를 저장하지 않습니다.")}</p>
          <ul className="list-disc pl-4 space-y-1.5 text-xs mt-2">
            <li>{t("privacy.s6.receipt", "Apple 영수증 검증을 통해 구독 상태를 확인합니다.")}</li>
            <li>{t("privacy.s6.cancel", "구독 취소: iOS 설정 → Apple ID → 구독 → Migo")}</li>
            <li>{t("privacy.s6.refund", "환불 정책: App Store 환불 정책을 따릅니다.")}</li>
          </ul>
        </Section>

        {/* ── 7. Security ── */}
        <Section icon={<Key className="w-4 h-4" />} title={t("privacy.s7.title", "7. 보안 조치")}>
          <ul className="list-disc pl-4 space-y-1.5 text-xs">
            <li>{t("privacy.s7.ssl", "모든 데이터 전송: TLS 1.3 암호화")}</li>
            <li>{t("privacy.s7.pw", "비밀번호: bcrypt 해시 저장 (평문 미저장)")}</li>
            <li>{t("privacy.s7.jwt", "JWT 세션 토큰, 만료 시 자동 폐기")}</li>
            <li>{t("privacy.s7.rls", "Supabase Row Level Security(RLS) — 본인 데이터에만 접근 가능")}</li>
            <li>{t("privacy.s7.min", "최소 권한 원칙: 서비스 제공에 필요한 데이터만 접근")}</li>
          </ul>
        </Section>

        {/* ── 8. Deletion ── */}
        <Section icon={<Trash2 className="w-4 h-4" />} title={t("privacy.s8.title", "8. 개인정보 삭제·파기")}>
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-3">
            <p className="font-bold text-red-700 text-xs truncate">{t("privacy.s8.delete_on_withdraw", "탈퇴 즉시 CASCADE DELETE로 영구 삭제:")}</p>
            <ul className="text-xs text-red-600 list-disc pl-4 mt-1 space-y-0.5">
              <li>{t("privacy.s8.d1", "프로필(이름, 사진, 생년월일, 성별)")}</li>
              <li>{t("privacy.s8.d2", "모든 메시지 및 채팅방")}</li>
              <li>{t("privacy.s8.d3", "좋아요·매칭 이력")}</li>
              <li>{t("privacy.s8.d4", "위치 데이터")}</li>
            </ul>
          </div>
          <p className="text-xs truncate">{t("privacy.s8.legal_retention", "단, 전자상거래법에 따라 결제 기록은 5년간 별도 보관 후 파기합니다.")}</p>
          <p className="text-xs mt-1 truncate">{t("privacy.s8.request", "계정 삭제: 앱 내 프로필 → 설정 → 회원 탈퇴 또는 privacy@lunaticsgroup.com 이메일 요청")}</p>
        </Section>

        {/* ── 9. Children ── */}
        <Section icon={<Heart className="w-4 h-4" />} title={t("privacy.s9.title", "9. 아동 개인정보 보호 (COPPA)")}>
          <div className="bg-red-50 border border-red-100 rounded-xl p-3">
            <p className="font-bold text-red-700 text-xs truncate">{t("privacy.s9.age", "⛔ Migo는 만 18세 미만의 이용자를 대상으로 하지 않습니다.")}</p>
            <p className="text-xs text-red-600 mt-1 truncate">{t("privacy.s9.coppa", "만 13세 미만 아동의 개인정보를 의도적으로 수집하지 않습니다. 아동임이 확인될 경우 즉시 계정과 관련 데이터를 삭제합니다.")}</p>
          </div>
        </Section>

        {/* ── 10. GDPR ── */}
        <Section icon={<Globe className="w-4 h-4" />} title={t("privacy.s10.title", "10. EU/EEA 이용자 권리 (GDPR)")}>
          <p className="text-xs mb-2 truncate">{t("privacy.s10.intro", "EEA 거주 이용자는 다음 권리를 보유합니다:")}</p>
          <ul className="list-disc pl-4 space-y-1 text-xs">
            <li>{t("privacy.s10.access", "열람권 — 보유 데이터 조회 요청")}</li>
            <li>{t("privacy.s10.rectify", "정정권 — 부정확한 정보 수정 요청")}</li>
            <li>{t("privacy.s10.erase", "삭제권(잊힐 권리)")}</li>
            <li>{t("privacy.s10.port", "이동권 — 구조화된 형식으로 데이터 수령")}</li>
            <li>{t("privacy.s10.object", "처리 반대권 및 제한권")}</li>
            <li>{t("privacy.s10.withdraw", "동의 철회권 — 철회해도 기존 처리의 적법성은 유지")}</li>
          </ul>
          <p className="text-xs mt-2 truncate">{t("privacy.s10.contact", "권리 행사: privacy@lunaticsgroup.com — 30일 이내 처리")}</p>
        </Section>

        {/* ── 11. CCPA ── */}
        <Section icon={<Lock className="w-4 h-4" />} title={t("privacy.s11.title", "11. 캘리포니아 거주자 권리 (CCPA)")}>
          <ul className="list-disc pl-4 space-y-1 text-xs">
            <li>{t("privacy.s11.know", "수집·공유되는 개인정보의 종류 및 목적 알 권리")}</li>
            <li>{t("privacy.s11.delete", "개인정보 삭제 요청권")}</li>
            <li>{t("privacy.s11.nosell", "개인정보 판매 거부권 (Migo는 데이터를 판매하지 않습니다)")}</li>
            <li>{t("privacy.s11.nondiscrim", "권리 행사에 따른 차별 금지")}</li>
          </ul>
        </Section>

        {/* ── 12. Contact ── */}
        <Section icon={<Mail className="w-4 h-4" />} title={t("privacy.s12.title", "12. 개인정보 보호책임자 및 문의")}>
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-xs">
            <p><strong>{t("privacy.s12.company", "회사")}</strong>: Lunatics Group Inc.</p>
            <p className="truncate"><strong>{t("privacy.s12.dpo", "개인정보 보호책임자")}</strong>{t("auto.x4018", ": 송우진 (CEO)")}</p>
            <p><strong>{t("privacy.s12.privacy_email", "개인정보 문의")}</strong>: <a href="mailto:privacy@lunaticsgroup.com" className="text-blue-500 underline">privacy@lunaticsgroup.com</a></p>
            <p><strong>{t("privacy.s12.support_email", "고객지원")}</strong>: <a href="mailto:support@lunaticsgroup.com" className="text-blue-500 underline">support@lunaticsgroup.com</a></p>
            <p className="text-gray-400 mt-2 truncate">{t("privacy.s12.response", "문의 접수 후 영업일 기준 7일 이내 회신합니다.")}</p>
          </div>
        </Section>

        {/* Footer */}
        <div className="py-6 text-center text-xs text-gray-400 space-y-1">
          <p className="truncate">{t("privacy.footer.effective", "본 방침은 2026년 4월 7일부터 적용됩니다.")}</p>
          <p className="truncate">{t("privacy.footer.notice", "중요 변경 시 앱 내 공지 또는 이메일로 7일 전 사전 고지합니다.")}</p>
          <p className="mt-2 font-medium truncate">{t("privacy.copyright_notice", "© 2026 Lunatics Group Inc. 모든 권리 보유.")}</p>
        </div>
      </main>
    </div>
  );
}
