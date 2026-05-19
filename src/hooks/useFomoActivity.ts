import { useEffect, useRef, useMemo, useCallback } from "react";
import { useToast } from "./use-toast";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabaseClient";

const PROFILE_VIEW_TEMPLATE_IDX = 4;

export const useFomoActivity = (enabled: boolean = true, userId?: string) => {
  const { toast } = useToast();
  const { i18n, t } = useTranslation();
  const timerRef = useRef<NodeJS.Timeout>();

  const NAMES = useMemo(() => ["Sarah", "David", "Emma", "James", "Yuki", "Jin", "Clara", "Leo", "Mia", "Oliver", "Sophia", "Lucas"], []);
  const FLAGS = useMemo(() => ["🇺🇸", "🇬🇧", "🇦🇺", "🇨🇦", "🇯🇵", "🇰🇷", "🇪🇸", "🇫🇷", "🇮🇹", "🇩🇪"], []);

  const LOCATIONS_BY_LANG: Record<string, string[]> = useMemo(() => ({
    ko: ["파리", "런던", "도쿄", "제주도", "오사카", "뉴욕", "로마", "방콕", "바르셀로나", "발리"],
    en: ["Paris", "London", "Tokyo", "Jeju", "Osaka", "New York", "Rome", "Bangkok", "Barcelona", "Bali"],
    ja: ["パリ", "ロンドン", "東京", "済州島", "大阪", "ニューヨーク", "ローマ", "バンコク", "バルセロナ", "バリ"],
    zh: ["巴黎", "伦敦", "东京", "济州岛", "大阪", "纽约", "罗马", "曼谷", "巴塞罗那", "巴厘岛"],
    fr: ["Paris", "Londres", "Tokyo", "Jeju", "Osaka", "New York", "Rome", "Bangkok", "Barcelone", "Bali"],
    de: ["Paris", "London", "Tokio", "Jeju", "Osaka", "New York", "Rom", "Bangkok", "Barcelona", "Bali"],
    es: ["París", "Londres", "Tokio", "Jeju", "Osaka", "Nueva York", "Roma", "Bangkok", "Barcelona", "Bali"],
    pt: ["Paris", "Londres", "Tóquio", "Jeju", "Osaka", "Nova York", "Roma", "Bangkok", "Barcelona", "Bali"],
    id: ["Paris", "London", "Tokyo", "Jeju", "Osaka", "New York", "Roma", "Bangkok", "Barcelona", "Bali"],
    vi: ["Paris", "London", "Tokyo", "Đảo Jeju", "Osaka", "New York", "Rome", "Bangkok", "Barcelona", "Bali"],
    th: ["ปารีส", "ลอนดอน", "โตเกียว", "เกาะเจจู", "โอซาก้า", "นิวยอร์ก", "โรม", "กรุงเทพ", "บาร์เซโลนา", "บาหลี"],
    ru: ["Париж", "Лондон", "Токио", "Чеджу", "Осака", "Нью-Йорк", "Рим", "Бангкок", "Барселона", "Бали"],
    ar: ["باريس", "لندن", "طوكيو", "جيجو", "أوساكا", "نيويورك", "روما", "بانكوك", "برشلونة", "بالي"],
    hi: ["पेरिस", "लंदन", "टोक्यो", "जेजू", "ओसाका", "न्यूयॉर्क", "रोम", "बैंकॉक", "बार्सिलोना", "बाली"],
    tr: ["Paris", "Londra", "Tokyo", "Jeju", "Osaka", "New York", "Roma", "Bangkok", "Barselona", "Bali"],
    it: ["Parigi", "Londra", "Tokyo", "Jeju", "Osaka", "New York", "Roma", "Bangkok", "Barcellona", "Bali"],
    nl: ["Parijs", "Londen", "Tokio", "Jeju", "Osaka", "New York", "Rome", "Bangkok", "Barcelona", "Bali"],
    pl: ["Paryż", "Londyn", "Tokio", "Jeju", "Osaka", "Nowy Jork", "Rzym", "Bangkok", "Barcelona", "Bali"],
    sv: ["Paris", "London", "Tokyo", "Jeju", "Osaka", "New York", "Rom", "Bangkok", "Barcelona", "Bali"],
    uk: ["Париж", "Лондон", "Токіо", "Чеджу", "Осака", "Нью-Йорк", "Рим", "Бангкок", "Барселона", "Балі"],
    el: ["Παρίσι", "Λονδίνο", "Τόκιο", "Τζετζού", "Όσακα", "Νέα Υόρκη", "Ρώμη", "Μπανγκόκ", "Βαρκελώνη", "Μπαλί"],
    hu: ["Párizs", "London", "Tokió", "Jeju", "Oszaka", "New York", "Róma", "Bangkok", "Barcelona", "Bali"],
    ro: ["Paris", "Londra", "Tokyo", "Jeju", "Osaka", "New York", "Roma", "Bangkok", "Barcelona", "Bali"],
    cs: ["Paříž", "Londýn", "Tokio", "Jeju", "Osaka", "New York", "Řím", "Bangkok", "Barcelona", "Bali"],
    fi: ["Pariisi", "Lontoo", "Tokio", "Jeju", "Osaka", "New York", "Rooma", "Bangkok", "Barcelona", "Bali"],
    da: ["Paris", "London", "Tokyo", "Jeju", "Osaka", "New York", "Rom", "Bangkok", "Barcelona", "Bali"],
    no: ["Paris", "London", "Tokyo", "Jeju", "Osaka", "New York", "Roma", "Bangkok", "Barcelona", "Bali"],
    sv: ["Paris", "London", "Tokyo", "Jeju", "Osaka", "New York", "Rom", "Bangkok", "Barcelona", "Bali"],
  }), []);

  type TplFn = (p: { flag: string; name: string; loc: string; count1: number; count2: number }) => string;
  const MSG_TEMPLATES: Record<string, TplFn[]> = useMemo(() => ({
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
    fr: [
      ({ flag, name, loc }) => `${flag} ${name} vient de chercher un compagnon de voyage pour ${loc} !`,
      ({ count1, loc }) => `🔥 ${count1} personnes consultent des voyages à ${loc}.`,
      ({ loc }) => `✨ Un nouveau match vient d'être créé pour ${loc} !`,
      ({ flag, name }) => `${flag} ${name} vient de rejoindre l'app.`,
      () => `👀 Quelqu'un vient de consulter votre profil.`,
      ({ count2, loc }) => `✈️ ${count2} personnes planifient un voyage à ${loc} ce week-end.`,
      ({ loc }) => `💡 ${loc} est la destination la plus populaire ce mois.`,
    ],
    de: [
      ({ flag, name, loc }) => `${flag} ${name} sucht gerade einen Reisebegleiter nach ${loc}!`,
      ({ count1, loc }) => `🔥 ${count1} Personen sehen sich gerade ${loc}-Reisen an.`,
      ({ loc }) => `✨ Gerade wurde ein neues Match für ${loc} gefunden!`,
      ({ flag, name }) => `${flag} ${name} ist gerade der App beigetreten.`,
      () => `👀 Jemand hat gerade dein Profil angesehen.`,
      ({ count2, loc }) => `✈️ ${count2} Personen planen eine Reise nach ${loc} dieses Wochenende.`,
      ({ loc }) => `💡 ${loc} ist das beliebteste Reiseziel diesen Monat.`,
    ],
    es: [
      ({ flag, name, loc }) => `${flag} ${name} acaba de buscar compañero de viaje a ${loc}!`,
      ({ count1, loc }) => `🔥 ${count1} personas están viendo viajes a ${loc}.`,
      ({ loc }) => `✨ ¡Acaba de producirse un nuevo match para ${loc}!`,
      ({ flag, name }) => `${flag} ${name} acaba de unirse a la app.`,
      () => `👀 Alguien acaba de ver tu perfil.`,
      ({ count2, loc }) => `✈️ ${count2} personas planean un viaje a ${loc} este fin de semana.`,
      ({ loc }) => `💡 ${loc} es el destino más popular este mes.`,
    ],
    pt: [
      ({ flag, name, loc }) => `${flag} ${name} começou a procurar companheiro de viagem para ${loc}!`,
      ({ count1, loc }) => `🔥 ${count1} pessoas estão a ver viagens para ${loc}.`,
      ({ loc }) => `✨ Um novo match foi feito para ${loc}!`,
      ({ flag, name }) => `${flag} ${name} acabou de entrar na app.`,
      () => `👀 Alguém acabou de ver o seu perfil.`,
      ({ count2, loc }) => `✈️ ${count2} pessoas estão a planear uma viagem a ${loc} este fim de semana.`,
      ({ loc }) => `💡 ${loc} é o destino mais popular este mês.`,
    ],
    id: [
      ({ flag, name, loc }) => `${flag} ${name} baru saja mencari teman perjalanan ke ${loc}!`,
      ({ count1, loc }) => `🔥 ${count1} orang sedang melihat perjalanan ke ${loc}.`,
      ({ loc }) => `✨ Pasangan baru saja terbentuk untuk ${loc}!`,
      ({ flag, name }) => `${flag} ${name} baru saja bergabung dengan aplikasi.`,
      () => `👀 Seseorang baru saja melihat profil Anda.`,
      ({ count2, loc }) => `✈️ ${count2} orang berencana pergi ke ${loc} akhir pekan ini.`,
      ({ loc }) => `💡 ${loc} adalah tujuan paling populer bulan ini.`,
    ],
    vi: [
      ({ flag, name, loc }) => `${flag} ${name} vừa tìm bạn đồng hành đến ${loc}!`,
      ({ count1, loc }) => `🔥 ${count1} người đang xem chuyến đi ${loc}.`,
      ({ loc }) => `✨ Vừa có cặp đôi mới cho ${loc}!`,
      ({ flag, name }) => `${flag} ${name} vừa tham gia ứng dụng.`,
      () => `👀 Ai đó vừa xem hồ sơ của bạn.`,
      ({ count2, loc }) => `✈️ ${count2} người đang lên kế hoạch đến ${loc} cuối tuần này.`,
      ({ loc }) => `💡 ${loc} là điểm đến phổ biến nhất tháng này.`,
    ],
    th: [
      ({ flag, name, loc }) => `${flag} ${name} เพิ่งเริ่มหาเพื่อนเดินทางไป${loc}!`,
      ({ count1, loc }) => `🔥 ${count1} คนกำลังดูทริปไป${loc}อยู่`,
      ({ loc }) => `✨ เพิ่งมีการจับคู่ใหม่สำหรับ${loc}!`,
      ({ flag, name }) => `${flag} ${name} เพิ่งเข้าแอปใหม่`,
      () => `👀 มีคนเพิ่งดูโปรไฟล์คุณ`,
      ({ count2, loc }) => `✈️ ${count2} คนวางแผนเดินทางไป${loc}สุดสัปดาห์นี้`,
      ({ loc }) => `💡 ${loc} คือจุดหมายที่ได้รับความนิยมสูงสุดเดือนนี้`,
    ],
    ru: [
      ({ flag, name, loc }) => `${flag} ${name} только что начал искать попутчика в ${loc}!`,
      ({ count1, loc }) => `🔥 ${count1} человек просматривают поездки в ${loc}.`,
      ({ loc }) => `✨ Только что образовалась новая пара для ${loc}!`,
      ({ flag, name }) => `${flag} ${name} только что зашёл в приложение.`,
      () => `👀 Кто-то только что просмотрел ваш профиль.`,
      ({ count2, loc }) => `✈️ ${count2} человек планируют поездку в ${loc} в эти выходные.`,
      ({ loc }) => `💡 ${loc} — самое популярное направление в этом месяце.`,
    ],
    ar: [
      ({ flag, name, loc }) => `${flag} ${name} بدأ للتو البحث عن رفيق سفر إلى ${loc}!`,
      ({ count1, loc }) => `🔥 ${count1} شخص يشاهد رحلات إلى ${loc} الآن.`,
      ({ loc }) => `✨ تم إنشاء مطابقة جديدة للتو لـ ${loc}!`,
      ({ flag, name }) => `${flag} ${name} انضم للتطبيق للتو.`,
      () => `👀 شخص ما شاهد ملفك الشخصي للتو.`,
      ({ count2, loc }) => `✈️ ${count2} شخص يخططون لرحلة إلى ${loc} هذا الأسبوع.`,
      ({ loc }) => `💡 ${loc} هي الوجهة الأكثر شعبية هذا الشهر.`,
    ],
    hi: [
      ({ flag, name, loc }) => `${flag} ${name} ने अभी ${loc} के लिए यात्रा साथी की खोज शुरू की!`,
      ({ count1, loc }) => `🔥 अभी ${count1} लोग ${loc} की यात्रा देख रहे हैं।`,
      ({ loc }) => `✨ ${loc} के लिए अभी एक नया मैच बना!`,
      ({ flag, name }) => `${flag} ${name} अभी ऐप में शामिल हुए।`,
      () => `👀 किसी ने अभी आपकी प्रोफाइल देखी।`,
      ({ count2, loc }) => `✈️ ${count2} लोग इस सप्ताहांत ${loc} की यात्रा की योजना बना रहे हैं।`,
      ({ loc }) => `💡 ${loc} इस महीने सबसे लोकप्रिय गंतव्य है।`,
    ],
    tr: [
      ({ flag, name, loc }) => `${flag} ${name} az önce ${loc} için seyahat arkadaşı aramaya başladı!`,
      ({ count1, loc }) => `🔥 Şu an ${count1} kişi ${loc} gezilerini inceliyor.`,
      ({ loc }) => `✨ ${loc} için yeni bir eşleşme oluştu!`,
      ({ flag, name }) => `${flag} ${name} uygulamaya katıldı.`,
      () => `👀 Biri az önce profilinizi gördü.`,
      ({ count2, loc }) => `✈️ ${count2} kişi bu hafta sonu ${loc} seyahati planlıyor.`,
      ({ loc }) => `💡 ${loc} bu ayın en popüler destinasyonu.`,
    ],
    it: [
      ({ flag, name, loc }) => `${flag} ${name} ha appena cercato un compagno di viaggio per ${loc}!`,
      ({ count1, loc }) => `🔥 ${count1} persone stanno guardando viaggi a ${loc}.`,
      ({ loc }) => `✨ Un nuovo match è appena avvenuto per ${loc}!`,
      ({ flag, name }) => `${flag} ${name} si è appena unito all'app.`,
      () => `👀 Qualcuno ha appena visto il tuo profilo.`,
      ({ count2, loc }) => `✈️ ${count2} persone stanno pianificando un viaggio a ${loc} questo weekend.`,
      ({ loc }) => `💡 ${loc} è la destinazione più popolare questo mese.`,
    ],
    nl: [
      ({ flag, name, loc }) => `${flag} ${name} zoekt net een reisgenoot naar ${loc}!`,
      ({ count1, loc }) => `🔥 ${count1} mensen bekijken reizen naar ${loc}.`,
      ({ loc }) => `✨ Er is net een nieuwe match gemaakt voor ${loc}!`,
      ({ flag, name }) => `${flag} ${name} is net lid geworden van de app.`,
      () => `👀 Iemand heeft zojuist je profiel bekeken.`,
      ({ count2, loc }) => `✈️ ${count2} mensen plannen een reis naar ${loc} dit weekend.`,
      ({ loc }) => `💡 ${loc} is de populairste bestemming deze maand.`,
    ],
    pl: [
      ({ flag, name, loc }) => `${flag} ${name} właśnie zaczął szukać towarzysza podróży do ${loc}!`,
      ({ count1, loc }) => `🔥 ${count1} osób ogląda teraz wyjazdy do ${loc}.`,
      ({ loc }) => `✨ Właśnie utworzono nową parę dla ${loc}!`,
      ({ flag, name }) => `${flag} ${name} właśnie dołączył do aplikacji.`,
      () => `👀 Ktoś właśnie wyświetlił Twój profil.`,
      ({ count2, loc }) => `✈️ ${count2} osób planuje wyjazd do ${loc} w ten weekend.`,
      ({ loc }) => `💡 ${loc} to najpopularniejszy kierunek w tym miesiącu.`,
    ],
    uk: [
      ({ flag, name, loc }) => `${flag} ${name} щойно почав шукати попутника до ${loc}!`,
      ({ count1, loc }) => `🔥 ${count1} людей переглядають поїздки до ${loc}.`,
      ({ loc }) => `✨ Щойно утворилася нова пара для ${loc}!`,
      ({ flag, name }) => `${flag} ${name} щойно приєднався до застосунку.`,
      () => `👀 Хтось щойно переглянув ваш профіль.`,
      ({ count2, loc }) => `✈️ ${count2} людей планують поїздку до ${loc} цих вихідних.`,
      ({ loc }) => `💡 ${loc} — найпопулярніший напрямок цього місяця.`,
    ],
    el: [
      ({ flag, name, loc }) => `${flag} ${name} μόλις ξεκίνησε να ψάχνει ταξιδιωτικό σύντροφο για ${loc}!`,
      ({ count1, loc }) => `🔥 ${count1} άτομα βλέπουν ταξίδια για ${loc}.`,
      ({ loc }) => `✨ Μόλις δημιουργήθηκε νέο ζευγάρι για ${loc}!`,
      ({ flag, name }) => `${flag} ${name} μόλις εντάχθηκε στην εφαρμογή.`,
      () => `👀 Κάποιος μόλις είδε το προφίλ σας.`,
      ({ count2, loc }) => `✈️ ${count2} άτομα σχεδιάζουν ταξίδι στο ${loc} το Σαββατοκύριακο.`,
      ({ loc }) => `💡 Το ${loc} είναι ο πιο δημοφιλής προορισμός αυτό το μήνα.`,
    ],
    hu: [
      ({ flag, name, loc }) => `${flag} ${name} most kezdett útitársat keresni ${loc}ba!`,
      ({ count1, loc }) => `🔥 ${count1} ember nézi a ${loc}-i utazásokat.`,
      ({ loc }) => `✨ Éppen most jött létre egy új párosítás ${loc}ra!`,
      ({ flag, name }) => `${flag} ${name} éppen csatlakozott az apphoz.`,
      () => `👀 Valaki most nézte meg a profilodat.`,
      ({ count2, loc }) => `✈️ ${count2} ember tervez utazást ${loc}ba ezen a hétvégén.`,
      ({ loc }) => `💡 ${loc} a legnépszerűbb úti cél ebben a hónapban.`,
    ],
    ro: [
      ({ flag, name, loc }) => `${flag} ${name} tocmai a căutat un companion de călătorie spre ${loc}!`,
      ({ count1, loc }) => `🔥 ${count1} persoane vizualizează călătorii spre ${loc}.`,
      ({ loc }) => `✨ Tocmai s-a format un nou cuplu pentru ${loc}!`,
      ({ flag, name }) => `${flag} ${name} tocmai s-a alăturat aplicației.`,
      () => `👀 Cineva tocmai ți-a vizualizat profilul.`,
      ({ count2, loc }) => `✈️ ${count2} persoane planifică o călătorie la ${loc} în weekendul acesta.`,
      ({ loc }) => `💡 ${loc} este destinația cea mai populară luna aceasta.`,
    ],
  }), []);

  const recordFakeProfileView = useCallback(async (targetUserId: string) => {
    let viewerId: string | null = null;
    try {
      const { data: viewers } = await supabase
        .from("profiles")
        .select("id")
        .neq("id", targetUserId)
        .limit(50);
      if (!viewers || viewers.length === 0) return;
      viewerId = viewers[Math.floor(Math.random() * viewers.length)].id;
    } catch { return; }
    if (!viewerId) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase
        .from("profile_views").select("id")
        .eq("viewer_id", viewerId).eq("viewed_id", targetUserId)
        .gte("created_at", `${today}T00:00:00`).maybeSingle();
      if (!existing) {
        await supabase.from("profile_views").insert({ viewer_id: viewerId, viewed_id: targetUserId });
      }
    } catch {}
    try {
      await supabase.from("notifications").insert({
        user_id: targetUserId, actor_id: viewerId,
        type: "profile_view", target_text: null, is_read: false,
      });
    } catch {}
  }, []);

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

      const templateIdx = Math.floor(Math.random() * templates.length);
      const message = templates[templateIdx]({ flag, name, loc, count1, count2 });

      if (templateIdx === PROFILE_VIEW_TEMPLATE_IDX && userId) {
        recordFakeProfileView(userId);
      }

      toast({
        title: t("fomo.live_activity", "⚡ Live Activity"),
        description: message,
        duration: 4000,
      });

      const nextDelay = Math.floor(Math.random() * 30000) + 15000;
      timerRef.current = setTimeout(showRandomToast, nextDelay);
    };

    timerRef.current = setTimeout(showRandomToast, 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [enabled, userId, toast, i18n.language, NAMES, FLAGS, LOCATIONS_BY_LANG, MSG_TEMPLATES, recordFakeProfileView, t]);
};
