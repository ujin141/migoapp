import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ShieldCheck, Trash2, Database, Key } from "lucide-react";
import i18n from "@/i18n";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white shadow-sm sticky top-0 z-10 w-full max-w-[480px] mx-auto">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">
            {i18n.t("auto.z_autoz개인정보처_1269") || "개인정보 처리방침"}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[480px] mx-auto bg-white p-6 overflow-y-auto">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-8 h-8" />
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mb-8 text-center">
          {i18n.t("auto.z_autoz최종업데이트_1270") || "최종 업데이트: 2026년 4월 2일"}
        </p>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            1. 위치 정보 수집 및 이용
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
            Migo는 원활한 위치 기반 매칭 서비를 제공하기 위해 사용자의 현재 위치(위도, 경도)를 수집합니다. 
            수집된 위치 정보는 매칭 및 커뮤니티 기능 이외의 목적으로는 절대 사용되지 않습니다.
            <br/><br/>
            <strong>파기 원칙:</strong> 서비스 안정성을 위해 수집된 모든 일회성 위치 데이터는 로그아웃 직후 즉시 비식별화 처리되며, 서버 내 접속 정보가 24시간을 경과할 경우 자동 스케줄러(Cron)에 의해 영구 삭제(NULL) 처리됩니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            2. 탈퇴 시 개인정보 영구 파기 정책
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
            사용자가 서비스를 탈퇴할 경우, "연쇄 파기 보안 원칙(CASCADE DELETE)"이 활성화되어 다음의 데이터가 즉시 하드 삭제(Hard Delete) 복구 불가능 상태로 파기됩니다.
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>사용자 프로필 정보 (이름, 인증사진 등)</li>
              <li>위치 및 매칭 히스토리</li>
              <li>생성된 1:1, 그룹 채팅방 및 채팅 내역</li>
              <li>결제 및 구독 정보</li>
            </ul>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Key className="w-5 h-5 text-yellow-500" />
            3. 데이터 암호화 및 보안 장치
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
            모든 통신은 안전한 SSL/TLS 포트로 암호화되어 전송됩니다. 
            또한 인증(JWT Token) 및 민감 개인정보는 중앙 컨트롤러에서 1차적인 Log 마스킹(Sanitization)을 거쳐 데이터 유출을 원천적으로 차단하고 있습니다. 불필요한 제3자 제공은 원칙적으로 엄격히 통제합니다.
          </p>
        </section>

        <div className="mt-10 py-6 border-t border-gray-100 flex flex-col items-center">
          <p className="text-xs text-center text-gray-400">
            Migo Privacy Protection Engine.<br/>
            © 2026 Migo Inc. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
