import { useEffect, useRef, useMemo } from "react";
import { useToast } from "./use-toast";
import { useTranslation } from "react-i18next";

export const useFomoActivity = (enabled: boolean = true) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const timerRef = useRef<NodeJS.Timeout>();

  const FOMO_MESSAGES = useMemo(() => [
    t("fomo.msg1", "🇺🇸 Sarah님이 방금 파리 동행을 찾기 시작했어요!"),
    t("fomo.msg2", "🔥 현재 12명이 런던 일정을 보고 있습니다."),
    t("fomo.msg3", "✨ 방금 도쿄에서 새로운 매칭이 성사되었습니다!"),
    t("fomo.msg4", "🇬🇧 David님이 방금 앱에 접속했습니다."),
    t("fomo.msg5", "👀 누군가 회원님의 프로필을 방금 조회했습니다."),
    t("fomo.msg6", "✈️ 28명이 다가오는 주말에 방콕 여행을 계획 중입니다."),
    t("fomo.msg7", "💡 이번 달 가장 인기 있는 여행지는 오사카입니다.")
  ], [t]);

  useEffect(() => {
    if (!enabled) return;

    const showRandomToast = () => {
      const randomMsg = FOMO_MESSAGES[Math.floor(Math.random() * FOMO_MESSAGES.length)];
      toast({
        title: t("fomo.title", "⚡ 실시간 활동"),
        description: randomMsg,
        duration: 4000,
      });

      // 다음 토스트는 15초 ~ 45초 사이 랜덤 발생
      const nextDelay = Math.floor(Math.random() * 30000) + 15000;
      timerRef.current = setTimeout(showRandomToast, nextDelay);
    };

    // 처음엔 5초 후에 시작
    timerRef.current = setTimeout(showRandomToast, 5000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, toast, t, FOMO_MESSAGES]);
};
