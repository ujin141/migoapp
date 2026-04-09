import i18n from "@/i18n";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

export const RefundPolicyModal = ({
  showRefundPolicyModal,
  setShowRefundPolicyModal,
}: {
  showRefundPolicyModal: boolean;
  setShowRefundPolicyModal: (v: boolean) => void;
}) => {
  return (
    <AnimatePresence>
      {showRefundPolicyModal && (
        <motion.div
          className="fixed inset-0 z-[80] bg-background flex flex-col"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
        >
          <div className="flex items-center gap-3 px-5 pt-10 pb-4 border-b border-border shrink-0">
            <button onClick={() => setShowRefundPolicyModal(false)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"><X size={18} /></button>
            <h2 className="text-lg font-extrabold text-foreground truncate">{i18n.t("auto.g_1446", "환불 정책 및 유료서비스 이용 안내")}</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 text-sm text-foreground leading-relaxed pb-20 truncate">
            <p className="text-[13px] text-muted-foreground leading-relaxed truncate">{i18n.t("auto.g_1447", "만 18세 미만의 미성년자는 가입이 불가능합니다.")}</p>

            <div>
              <h3 className="font-extrabold text-foreground mb-1.5 truncate">{i18n.t("auto.g_1448", "1. 프리미엄 이용권 안내")}</h3>
              <div className="bg-muted p-4 rounded-2xl mb-2">
                <p className="text-sm font-bold text-foreground mb-1 truncate">{i18n.t("auto.g_1449", "1개월 베이직 플랜: ₩35,000 / 월")}</p>
                <p className="text-sm font-bold text-foreground mb-1 truncate">{i18n.t("auto.g_1450", "3개월 스탠다드 플랜: ₩89,000")}</p>
                <p className="text-sm font-bold text-foreground truncate">{i18n.t("auto.g_1451", "12개월 연간 플랜: ₩250,000")}</p>
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed truncate">
                {i18n.t("auto.g_1452", "구독 결제 시, 설정된 기간 단위로 자동 결제 청구됩니다.")}<br />
                {i18n.t("auto.g_1453", "위 가격은 부가가치세(VAT) 포함 액수입니다.")}
              </p>
            </div>

            {[
              {
                title: i18n.t("auto.g_1454", "2. 환불 및 취소 원칙 (사용 전)"),
                content: i18n.t("auto.g_1455", "결제 후 단 한 번도 혜택 매칭이나 유료 재화를 소진하지 않으셨다면 결제일로부터 7일 내 전액 환불이 가능합니다.")
              },
              {
                title: i18n.t("auto.g_1456", "3. 환불 불가 규정 (사용 후)"),
                content: i18n.t("auto.g_1457", "결제 후 프리미엄 스와이프 기능 등을 이미 사용했거나 7일 이상 경과된 경우 환불이 거절될 수 있습니다.")
              },
              {
                title: i18n.t("auto.g_1458", "4. 구독 상태 및 자동 결제"),
                content: i18n.t("auto.g_1459", "자동 결제를 해지하시더라도 현재 결제된 회차까지는 정상 구독 유지 처리됩니다.")
              },
              {
                title: i18n.t("auto.g_1460", "5. 미성년자 법정대리인 규정"),
                content: i18n.t("auto.g_1461", "부모 등 법정대리인의 동의 없는 미성년자 결제는 확인 즉시 전액 환불 조치해 드립니다.")
              }
            ].map((s, i) => (
              <div key={i}>
                <h3 className="font-extrabold text-foreground mb-1.5">{s.title}</h3>
                <p className="text-muted-foreground text-[13px] leading-relaxed whitespace-pre-line">{s.content}</p>
              </div>
            ))}

            <div className="mt-6 p-4 bg-muted rounded-2xl">
              <p className="text-xs text-muted-foreground truncate">
                <span className="font-bold text-foreground truncate">{i18n.t("auto.g_1462", "환불 요청 및 각종 문의는")}</span><br />
                {i18n.t("auto.g_1463", "앱 내부 [고객센터] 메뉴 혹은")}<br />
                {i18n.t("auto.g_1464", "support@lunaticsgroup.com 으로 문의 바랍니다.")}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
