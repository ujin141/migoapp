import { useEffect, useRef, useMemo } from "react";
import { useToast } from "./use-toast";
import { useTranslation } from "react-i18next";

export const useFomoActivity = (enabled: boolean = true) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const timerRef = useRef<NodeJS.Timeout>();

  const NAMES = useMemo(() => ["Sarah", "David", "Emma", "James", "Yuki", "Jin", "Clara", "Leo", "Mia", "Oliver", "Sophia", "Lucas"], []);
  const FLAGS = useMemo(() => ["🇺🇸", "🇬🇧", "🇦🇺", "🇨🇦", "🇯🇵", "🇰🇷", "🇪🇸", "🇫🇷", "🇮🇹", "🇩🇪"], []);
  const LOCATIONS = useMemo(() => ["파리", "런던", "도쿄", "제주도", "오사카", "뉴욕", "로마", "방콕", "바르셀로나", "발리"], []);

  useEffect(() => {
    if (!enabled) return;

    const showRandomToast = () => {
      const name = NAMES[Math.floor(Math.random() * NAMES.length)];
      const flag = FLAGS[Math.floor(Math.random() * FLAGS.length)];
      const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      const count1 = Math.floor(Math.random() * 20) + 5; 
      const count2 = Math.floor(Math.random() * 30) + 10;

      const dynamicMessages = [
        t("fomo.msg1_dyn", "{{flag}} {{name}}님이 방금 {{loc}} 동행을 찾기 시작했어요!", { flag, name, loc }),
        t("fomo.msg2_dyn", "🔥 현재 {{count}}명이 {{loc}} 일정을 보고 있습니다.", { count: count1, loc }),
        t("fomo.msg3_dyn", "✨ 방금 {{loc}}에서 새로운 매칭이 성사되었습니다!", { loc }),
        t("fomo.msg4_dyn", "{{flag}} {{name}}님이 방금 앱에 접속했습니다.", { flag, name }),
        t("fomo.msg5", "👀 누군가 회원님의 프로필을 방금 조회했습니다."),
        t("fomo.msg6_dyn", "✈️ {{count}}명이 다가오는 주말에 {{loc}} 여행을 계획 중입니다.", { count: count2, loc }),
        t("fomo.msg7_dyn", "💡 이번 달 가장 인기 있는 여행지는 {{loc}}입니다.", { loc })
      ];

      const randomMsg = dynamicMessages[Math.floor(Math.random() * dynamicMessages.length)];
      
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
  }, [enabled, toast, t, NAMES, FLAGS, LOCATIONS]);
};
