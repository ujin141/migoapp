import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Database, Trash2, Key, Globe, Bell, CreditCard, Mail, Users } from "lucide-react";

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <section className="mb-8">
      <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">
        <span className="text-blue-500">{icon}</span>
        {title}
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
        <h1 className="text-lg font-bold text-gray-900">개인정보 처리방침</h1>
      </header>

      <main className="max-w-2xl mx-auto bg-white px-6 py-8">
        {/* Hero */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-1">Migo 개인정보 처리방침</h2>
          <p className="text-xs text-gray-400">Privacy Policy — Last Updated: April 2, 2026</p>
          <p className="text-xs text-gray-500 mt-2 bg-blue-50 rounded-xl px-4 py-2">
            Migo(이하 "회사")는 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」, EU GDPR 및 Apple App Store 개인정보 보호 지침을 준수합니다.
          </p>
        </div>

        <Section icon={<Database className="w-4 h-4" />} title="1. 수집하는 개인정보 항목">
          <p className="font-semibold text-gray-800">서비스 이용 시 다음 정보를 수집합니다:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>필수 항목:</strong> 이메일 주소, 비밀번호(암호화 저장), 닉네임, 생년월일(연령 확인용), 성별</li>
            <li><strong>선택 항목:</strong> 프로필 사진, 자기소개, 여행 목적지, 국적, MBTI, 여행 태그</li>
            <li><strong>위치 정보:</strong> 앱 사용 중 위치(GPS 좌표) — 주변 여행자 표시 전용, 로그아웃 시 즉시 삭제</li>
            <li><strong>소셜 로그인:</strong> Google/Apple 계정 연동 시 이메일, 이름 (비밀번호는 수집 안 함)</li>
            <li><strong>인증 정보:</strong> 신분증 사진 (인증 완료 후 즉시 삭제), 전화번호</li>
            <li><strong>기기 정보:</strong> 기기 ID, OS 버전, 앱 버전, 푸시 토큰</li>
            <li><strong>이용 기록:</strong> 서비스 이용 시간, 매칭 이력, 채팅 메시지</li>
          </ul>
        </Section>

        <Section icon={<Globe className="w-4 h-4" />} title="2. 개인정보의 수집 목적 및 이용">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">이용 목적</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">수집 항목</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">보유 기간</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr><td className="px-3 py-2">회원 가입 및 관리</td><td className="px-3 py-2">이메일, 비밀번호, 닉네임</td><td className="px-3 py-2">탈퇴 시까지</td></tr>
                <tr><td className="px-3 py-2">위치 기반 매칭</td><td className="px-3 py-2">GPS 위치</td><td className="px-3 py-2">로그아웃 후 24시간</td></tr>
                <tr><td className="px-3 py-2">채팅 서비스</td><td className="px-3 py-2">메시지, 미디어</td><td className="px-3 py-2">탈퇴 시까지</td></tr>
                <tr><td className="px-3 py-2">결제 및 구독</td><td className="px-3 py-2">결제 기록 (카드번호 미저장)</td><td className="px-3 py-2">5년 (전자상거래법)</td></tr>
                <tr><td className="px-3 py-2">본인 인증</td><td className="px-3 py-2">신분증 사진</td><td className="px-3 py-2">인증 완료 즉시 삭제</td></tr>
                <tr><td className="px-3 py-2">푸시 알림</td><td className="px-3 py-2">기기 ID, 푸시 토큰</td><td className="px-3 py-2">알림 비활성화 시까지</td></tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section icon={<Users className="w-4 h-4" />} title="3. 개인정보의 제3자 제공">
          <p>회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 단, 다음의 경우는 예외입니다:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>이용자가 사전에 명시적 동의를 한 경우</li>
            <li>법령 규정에 의한 경우 (수사기관의 적법한 영장 등)</li>
          </ul>
          <div className="mt-3 bg-gray-50 rounded-lg p-3">
            <p className="font-semibold text-gray-800 text-xs mb-2">업무 위탁 및 제3자 서비스:</p>
            <ul className="text-xs space-y-1">
              <li>• <strong>Supabase (미국)</strong> — 데이터베이스/인증 서버</li>
              <li>• <strong>Apple Push Notifications (미국)</strong> — 푸시 알림</li>
              <li>• <strong>Google (미국)</strong> — 소셜 로그인, 지도 API</li>
              <li>• <strong>OpenAI (미국)</strong> — AI 여행 일정 기능</li>
            </ul>
          </div>
          <p className="mt-2 text-xs text-gray-500">위 수탁자들은 서비스 제공 목적에 한해 최소한의 데이터에만 접근합니다.</p>
        </Section>

        <Section icon={<Bell className="w-4 h-4" />} title="4. 광고 추적 (앱 추적 투명성 — ATT)">
          <p>Apple의 앱 추적 투명성(ATT) 정책에 따라, 앱 설치 후 최초 실행 시 광고 추적(IDFA) 동의를 별도로 요청할 수 있습니다.</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>동의하지 않아도 앱의 모든 핵심 기능을 이용할 수 있습니다.</li>
            <li>동의 철회: iOS 설정 → 개인정보 보호 및 보안 → 추적에서 언제든지 변경 가능합니다.</li>
          </ul>
        </Section>

        <Section icon={<CreditCard className="w-4 h-4" />} title="5. 인앱결제 및 구독 관련 개인정보">
          <p>Migo Plus / Premium 구독 결제는 Apple의 인앱결제(IAP) 시스템을 통해 처리됩니다. 회사는 신용카드 번호를 직접 저장하지 않으며, 결제 관련 분쟁은 App Store 정책을 따릅니다.</p>
          <p className="mt-2">구독 취소: iOS 설정 → Apple ID → 구독에서 가능합니다.</p>
        </Section>

        <Section icon={<Key className="w-4 h-4" />} title="6. 개인정보 보호 조치">
          <ul className="list-disc pl-5 space-y-1">
            <li>모든 통신: SSL/TLS 암호화</li>
            <li>비밀번호: bcrypt 해시 저장 (원문 미저장)</li>
            <li>JWT 토큰 기반 인증, 만료 시 자동 폐기</li>
            <li>데이터베이스 Row Level Security (RLS) 적용</li>
            <li>불필요한 개인정보 접근을 최소화하는 최소 권한 원칙적용</li>
          </ul>
        </Section>

        <Section icon={<Trash2 className="w-4 h-4" />} title="7. 개인정보 파기 절차 및 방법">
          <p className="font-semibold text-gray-800">회원 탈퇴 시:</p>
          <p>CASCADE DELETE 정책에 따라 아래 데이터가 즉시 영구 삭제(복구 불가)됩니다:</p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>프로필 정보 (이름, 사진, 생년월일 등)</li>
            <li>위치 정보 및 매칭 이력</li>
            <li>채팅방 및 모든 메시지</li>
            <li>구독 및 결제 정보 (법령 보존 기간 제외)</li>
          </ul>
          <p className="mt-2">단, 전자상거래법에 따라 결제 기록은 5년간 보관 후 파기합니다.</p>
        </Section>

        <section className="mb-8">
          <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">
            <span className="text-blue-500"><Globe className="w-4 h-4 inline" /></span>
            8. 아동 개인정보 보호 (COPPA)
          </h2>
          <div className="text-sm text-gray-600 leading-relaxed">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="font-bold text-red-700">⚠️ Migo는 만 18세 미만의 이용자를 대상으로 하지 않습니다.</p>
              <p className="mt-1 text-red-600 text-xs">회원가입 시 연령을 확인하며, 미성년자로 확인될 경우 즉시 계정을 삭제합니다. 만 13세 미만 아동의 개인정보를 의도적으로 수집하지 않습니다 (COPPA 준수).</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">
            <span className="text-blue-500"><Globe className="w-4 h-4 inline" /></span>
            9. EU/EEA 이용자 권리 (GDPR)
          </h2>
          <div className="text-sm text-gray-600 leading-relaxed">
            <p>유럽 경제 지역(EEA) 거주 이용자는 GDPR에 따라 다음 권리를 보유합니다:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>개인정보 처리 동의 철회권</li>
              <li>정보 접근권 (보유 중인 개인정보 열람 요청)</li>
              <li>정정권 (부정확한 정보 수정 요청)</li>
              <li>삭제권(잊힐 권리)</li>
              <li>처리 제한권</li>
              <li>데이터 이동권</li>
            </ul>
            <p className="mt-2">권리 행사: <a href="mailto:privacy@lunaticsgroup.com" className="text-blue-500 underline">privacy@lunaticsgroup.com</a>으로 요청하시면 30일 이내 처리합니다.</p>
          </div>
        </section>

        <Section icon={<Mail className="w-4 h-4" />} title="10. 개인정보 보호책임자 및 문의">
          <div className="bg-gray-50 rounded-xl p-4 space-y-1">
            <p><strong>회사명:</strong> Lunatics Group Inc.</p>
            <p><strong>개인정보 보호책임자:</strong> 송우진 (CEO)</p>
            <p><strong>이메일:</strong> <a href="mailto:privacy@lunaticsgroup.com" className="text-blue-500 underline">privacy@lunaticsgroup.com</a></p>
            <p><strong>고객지원:</strong> <a href="mailto:support@lunaticsgroup.com" className="text-blue-500 underline">support@lunaticsgroup.com</a></p>
            <p className="text-xs text-gray-400 mt-2">개인정보 관련 민원은 위 이메일로 접수해주세요. 정당한 이의를 제기하실 경우 신속히 처리하겠습니다.</p>
          </div>
        </Section>

        <div className="mt-8 py-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            본 방침은 2026년 4월 2일부터 적용됩니다.<br />
            변경 시 앱 내 공지 또는 이메일로 7일 전 고지합니다.<br /><br />
            © 2026 Lunatics Group Inc. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
