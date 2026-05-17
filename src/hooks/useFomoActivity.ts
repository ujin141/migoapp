import { useEffect, useRef, useMemo } from "react";
import { useToast } from "./use-toast";
import { useTranslation } from "react-i18next";

export const useFomoActivity = (enabled: boolean = true) => {
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const timerRef = useRef<NodeJS.Timeout>();

  const NAMES = useMemo(() => ["Sarah", "David", "Emma", "James", "Yuki", "Jin", "Clara", "Leo", "Mia", "Oliver", "Sophia", "Lucas"], []);
  const FLAGS = useMemo(() => ["🇺🇸", "🇬🇧", "🇦🇺", "🇨🇦", "🇯🇵", "🇰🇷", "🇪🇸", "🇫🇷", "🇮🇹", "🇩🇪"], []);

  // locale별 장소 목록
  const LOCATIONS_BY_LANG: Record<string, string[]> = useMemo(() => ({
    ko: ["파리", "런던", "도쿄", "제주도", "오사카", "뉴욕", "로마", "방콕", "바르셀로나", "발리"],
    en: ["Paris", "London", "Tokyo", "Jeju", "Osaka", "New York", "Rome", "Bangkok", "Barcelona", "Bali"],
    ja: ["パリ", "ロンドン", "東京", "済州島", "大阪", "ニューヨーク", "ローマ", "バンコク", "バルセロナ", "バリ"],
    zh: ["巴黎", "伦敦", "东京", "济州岛", "大阪", "纽约", "罗马", "曼谷", "巴塞罗那", "巴厘岛"],
    fr: ["Paris", "Londres", "Tokyo", "Jeju", "Osaka", "New York", "Rome", "Bangkok", "Barcelone", "Bali"],
    de: ["Paris", "London", "Tokio", "Jeju", "Osaka", "New York", "Rom", "Bangkok", "Barcelona", "Bali"],
    es: ["París", "Londres", "Tokio", "Jeju", "Osaka", "Nueva York", "Roma", "Bangkok", "Barcelona", "Bali"],
  }), []);

  // locale별 메시지 템플릿
  const MSG_TEMPLATES: Record<string, Array<(p: { flag: string; name: string; loc: string; count1: number; count2: number }) => string>> = useMemo(() => ({
    ko: [
      ({ flag, name, loc }) => `${flag} ${name}님이 방금 ${loc} 동행을 찾기 시작했어요!`,
      ({ count1, loc }) => `🔥 현재 ${count1}명이 ${loc} 일정을 보고 있습니다.`,
      ({ loc }) => `✨ 방금 ${loc}에서 새로운 매칭이 성사되었습니다!`,
      ({ flag, name }) => `${flag} ${name}님이 방금 앱에 접속했습니다.`,
      () => `👀 누군가 회원님의 프로필을 방금 조회했습니다.`,
      ({ count2, loc }) => `✈️ ${count2}명이 다가오는 주말에 ${loc} 여행을 계획 중입니다.`,
      ({ loc }) => `💡 이번 달 가장 인기 있는 여행지는 ${loc}입니다.`,
    ],
    en: [
      ({ flag, name, loc }) => `${flag} ${name} just started looking for a travel buddy to ${loc}!`,
      ({ count1, loc }) => `🔥 ${count1} people are currently viewing ${loc} trips.`,
      ({ loc }) => `✨ A new match was just made for ${loc}!`,
      ({ flag, name }) => `${flag} ${name} just joined the app.`,
      () => `👀 Someone just viewed your profile.`,
      ({ count2, loc }) => `✈️ ${count2} people are planning a trip to ${loc} this weekend.`,
      ({ loc }) => `💡 ${loc} is the most popular destination this month.`,
    ],
    ja: [
      ({ flag, name, loc }) => `${flag} ${name}さんが${loc}への旅友探しを始めました！`,
      ({ count1, loc }) => `🔥 現在${count1}人が${loc}の旅程を見ています。`,
      ({ loc }) => `✨ ${loc}で新しいマッチングが成立しました！`,
      ({ flag, name }) => `${flag} ${name}さんがアプリに接続しました。`,
      () => `👀 誰かがあなたのプロフィールを閲覧しました。`,
      ({ count2, loc }) => `✈️ ${count2}人が今週末${loc}旅行を計画中です。`,
      ({ loc }) => `💡 今月最も人気の旅行先は${loc}です。`,
    ],
    zh: [
      ({ flag, name, loc }) => `${flag} ${name}刚开始寻找${loc}的旅伴！`,
      ({ count1, loc }) => `🔥 当前有${count1}人正在查看${loc}的行程。`,
      ({ loc }) => `✨ 刚刚在${loc}达成了新的匹配！`,
      ({ flag, name }) => `${flag} ${name}刚刚登录了应用。`,
      () => `👀 有人刚刚查看了您的个人资料。`,
      ({ count2, loc }) => `✈️ 有${count2}人正在计划本周末去${loc}旅行。`,
      ({ loc }) => `💡 本月最受欢迎的旅行地是${loc}。`,
    ],
  }), []);

  useEffect(() => {
    if (!enabled) return;

    const showRandomToast = () => {
      const lang = i18n.language?.split("-")[0] || "en";
      const locs = LOCATIONS_BY_LANG[lang] || LOCATIONS_BY_LANG["en"];
      const templates = MSG_TEMPLATES[lang] || MSG_TEMPLATES["en"];

      const name = NAMES[Math.floor(Math.random() * NAMES.length)];
      const flag = FLAGS[Math.floor(Math.random() * FLAGS.length)];
      const loc = locs[Math.floor(Math.random() * locs.length)];
      const count1 = Math.floor(Math.random() * 20) + 5;
      const count2 = Math.floor(Math.random() * 30) + 10;

      const template = templates[Math.floor(Math.random() * templates.length)];
      const message = template({ flag, name, loc, count1, count2 });

      const titleMap: Record<string, string> = {
        ko: "⚡ 실시간 활동",
        en: "⚡ Live Activity",
        ja: "⚡ リアルタイム",
        zh: "⚡ 实时动态",
        fr: "⚡ Activité en direct",
        de: "⚡ Live-Aktivität",
        es: "⚡ Actividad en vivo",
      };

      toast({
        title: titleMap[lang] || "⚡ Live Activity",
        description: message,
        duration: 4000,
      });

      // 다음 토스트는 15초 ~ 45초 사이 랜덤
      const nextDelay = Math.floor(Math.random() * 30000) + 15000;
      timerRef.current = setTimeout(showRandomToast, nextDelay);
    };

    // 처음엔 5초 후에 시작
    timerRef.current = setTimeout(showRandomToast, 5000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, toast, i18n.language, NAMES, FLAGS, LOCATIONS_BY_LANG, MSG_TEMPLATES]);
};
