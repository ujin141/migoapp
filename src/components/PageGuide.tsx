import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, HelpCircle, ChevronRight } from "lucide-react";

// ─── Per-page guide definitions ─────────────────────────────────────────────
export type PageId = "match" | "discover" | "map" | "chat" | "profile";

interface GuideItem {
  icon: string;         // emoji or unicode icon representation
  label: string;        // short label shown below icon
  desc: string;         // tooltip / description
}

interface PageGuideData {
  title: string;
  subtitle: string;
  items: GuideItem[];
}

function buildGuides(): Record<PageId, PageGuideData> {
  const t = i18n.t.bind(i18n);
  return {
    match: {
      title: t("guide.match.title", "💜 매칭 화면 사용법"),
      subtitle: t("guide.match.subtitle", "카드를 스와이프해서 마음에 드는 여행자를 찾아보세요!"),
      items: [
        {
          icon: "👈",
          label: t("guide.match.pass.label", "패스"),
          desc: t("guide.match.pass.desc", "카드를 왼쪽으로 스와이프하거나 ✕ 버튼을 누르면 패스합니다."),
        },
        {
          icon: "❤️",
          label: t("guide.match.like.label", "좋아요"),
          desc: t("guide.match.like.desc", "카드를 오른쪽으로 스와이프하거나 ♥ 버튼을 누르면 좋아요를 보냅니다. 상대방도 좋아요를 누르면 매칭!"),
        },
        {
          icon: "⭐",
          label: t("guide.match.superlike.label", "슈퍼라이크"),
          desc: t("guide.match.superlike.desc", "별 버튼으로 특별한 메시지와 함께 슈퍼라이크를 보낼 수 있어요. 상대방에게 더 강하게 어필됩니다."),
        },
        {
          icon: "⚡",
          label: t("guide.match.boost.label", "부스트"),
          desc: t("guide.match.boost.desc", "부스트를 사용하면 30분간 내 프로필이 최상단에 노출됩니다."),
        },
        {
          icon: "📍",
          label: t("guide.match.checkin.label", "GPS 체크인"),
          desc: t("guide.match.checkin.desc", "현재 여행 중인 도시를 체크인하면 같은 도시의 여행자들이 우선 표시됩니다."),
        },
        {
          icon: "🎯",
          label: t("guide.match.mission.label", "오늘의 목적"),
          desc: t("guide.match.mission.desc", "오늘의 여행 목적(맛집 탐방, 관광, 파티 등)을 설정하면 비슷한 목적의 여행자와 더 잘 연결됩니다."),
        },
        {
          icon: "🔔",
          label: t("guide.match.notif.label", "알림"),
          desc: t("guide.match.notif.desc", "상단 벨 아이콘을 눌러 좋아요, 매칭, 메시지 알림을 확인하세요."),
        },
        {
          icon: "🎛️",
          label: t("guide.match.filter.label", "필터"),
          desc: t("guide.match.filter.desc", "상단 필터 아이콘으로 나이, 성별, 거리, MBTI, 여행 스타일 등을 필터링할 수 있습니다."),
        },
      ],
    },
    discover: {
      title: t("guide.discover.title", "🧭 탐색 화면 사용법"),
      subtitle: t("guide.discover.subtitle", "여행 그룹, 커뮤니티 피드, 실시간 벙개 모임을 탐색하세요!"),
      items: [
        {
          icon: "👥",
          label: t("guide.discover.groups.label", "여행 그룹"),
          desc: t("guide.discover.groups.desc", "목적지, 날짜, 스타일이 맞는 여행 그룹을 찾고 신청해보세요."),
        },
        {
          icon: "📸",
          label: t("guide.discover.feed.label", "피드"),
          desc: t("guide.discover.feed.desc", "다른 여행자들의 실시간 여행 사진과 후기를 스크롤하며 즐겨보세요."),
        },
        {
          icon: "⚡",
          label: t("guide.discover.lightning.label", "번개 모임"),
          desc: t("guide.discover.lightning.desc", "지금 당장 근처에서 열리는 즉석 모임에 바로 참여할 수 있습니다."),
        },
        {
          icon: "➕",
          label: t("guide.discover.create.label", "그룹 만들기"),
          desc: t("guide.discover.create.desc", "오른쪽 하단 + 버튼으로 나만의 여행 그룹을 직접 만들어보세요."),
        },
        {
          icon: "❤️",
          label: t("guide.discover.like.label", "피드 좋아요"),
          desc: t("guide.discover.like.desc", "마음에 드는 게시물에 하트를 눌러 좋아요를 보낼 수 있습니다."),
        },
        {
          icon: "💬",
          label: t("guide.discover.comment.label", "댓글"),
          desc: t("guide.discover.comment.desc", "게시물에 댓글을 달아 여행자와 소통해보세요."),
        },
      ],
    },
    map: {
      title: t("guide.map.title", "📍 지도 화면 사용법"),
      subtitle: t("guide.map.subtitle", "실시간으로 주변 여행자, 핫플, 모임을 지도에서 확인하세요!"),
      items: [
        {
          icon: "🧑‍🤝‍🧑",
          label: t("guide.map.travelers.label", "주변 여행자"),
          desc: t("guide.map.travelers.desc", "하단 '여행자' 탭에서 현재 근처에 있는 여행자들을 지도 위에서 볼 수 있습니다."),
        },
        {
          icon: "🔥",
          label: t("guide.map.hotplace.label", "핫플 탐색"),
          desc: t("guide.map.hotplace.desc", "'핫플' 탭에서 클럽, 명소, 맛집 등 카테고리별로 주변 인기 장소를 탐색하세요."),
        },
        {
          icon: "🍻",
          label: t("guide.map.groups.label", "주변 모임"),
          desc: t("guide.map.groups.desc", "'모임' 탭에서 지금 근처에서 진행 중인 벙개 모임을 지도에서 확인하고 참여하세요."),
        },
        {
          icon: "📷",
          label: t("guide.map.community.label", "현지 피드"),
          desc: t("guide.map.community.desc", "'사진' 탭에서 근처 여행자들이 방금 올린 사진을 실시간으로 볼 수 있습니다."),
        },
        {
          icon: "🍽️",
          label: t("guide.map.restaurants.label", "주변 맛집"),
          desc: t("guide.map.restaurants.desc", "'맛집' 탭에서 지금 위치 기준으로 근처 맛집을 찾아볼 수 있습니다."),
        },
        {
          icon: "📡",
          label: t("guide.map.realtime.label", "실시간 알림"),
          desc: t("guide.map.realtime.desc", "새로운 여행자가 근처에 나타나거나 모임이 생기면 자동으로 팝업 알림이 뜹니다."),
        },
      ],
    },
    chat: {
      title: t("guide.chat.title", "💬 채팅 화면 사용법"),
      subtitle: t("guide.chat.subtitle", "매칭된 여행자와 채팅하고 만남을 약속해보세요!"),
      items: [
        {
          icon: "💬",
          label: t("guide.chat.threads.label", "채팅 목록"),
          desc: t("guide.chat.threads.desc", "매칭된 여행자들과의 대화 목록이 여기에 표시됩니다. 탭하면 대화창으로 이동합니다."),
        },
        {
          icon: "📅",
          label: t("guide.chat.schedule.label", "일정 공유"),
          desc: t("guide.chat.schedule.desc", "채팅창 하단 + 버튼에서 날짜와 장소를 포함한 일정 카드를 공유할 수 있습니다."),
        },
        {
          icon: "🤝",
          label: t("guide.chat.meet.label", "만남 제안"),
          desc: t("guide.chat.meet.desc", "만남 제안 버튼으로 실제 만남 날짜와 장소를 정식으로 제안하세요."),
        },
        {
          icon: "🔒",
          label: t("guide.chat.safe.label", "안전 만남"),
          desc: t("guide.chat.safe.desc", "만남 전 체크리스트와 안전 시스템을 통해 안심하고 만날 수 있습니다."),
        },
        {
          icon: "⭐",
          label: t("guide.chat.review.label", "만남 후기"),
          desc: t("guide.chat.review.desc", "만남 후 상대방에 대한 후기를 남기면 신뢰 점수가 올라갑니다."),
        },
      ],
    },
    profile: {
      title: t("guide.profile.title", "✨ 프로필 화면 사용법"),
      subtitle: t("guide.profile.subtitle", "내 프로필을 완성하고 설정을 관리하세요!"),
      items: [
        {
          icon: "📝",
          label: t("guide.profile.edit.label", "프로필 편집"),
          desc: t("guide.profile.edit.desc", "프로필 카드를 탭하면 사진, 이름, 자기소개, 여행 스타일 등을 편집할 수 있습니다."),
        },
        {
          icon: "🛡️",
          label: t("guide.profile.safety.label", "안전 시스템"),
          desc: t("guide.profile.safety.desc", "안전 CTA 버튼으로 만남 전 체크리스트를 확인하고 안전하게 만남을 준비하세요."),
        },
        {
          icon: "🗓️",
          label: t("guide.profile.trips.label", "내 여행 일정"),
          desc: t("guide.profile.trips.desc", "나의 여행 계획을 등록하면 같은 날짜, 같은 목적지의 사람들과 자동으로 연결됩니다."),
        },
        {
          icon: "👥",
          label: t("guide.profile.matches.label", "매칭 현황"),
          desc: t("guide.profile.matches.desc", "지금까지 매칭된 사람들을 한눈에 볼 수 있습니다."),
        },
        {
          icon: "🌏",
          label: t("guide.profile.language.label", "언어 설정"),
          desc: t("guide.profile.language.desc", "설정 > 언어에서 앱 언어를 49개국 중 원하는 언어로 변경할 수 있습니다."),
        },
        {
          icon: "💎",
          label: t("guide.profile.plus.label", "Migo Plus"),
          desc: t("guide.profile.plus.desc", "Migo Plus로 업그레이드하면 무제한 좋아요, 슈퍼라이크, 고급 필터 등을 사용할 수 있습니다."),
        },
        {
          icon: "🔔",
          label: t("guide.profile.notif.label", "알림 설정"),
          desc: t("guide.profile.notif.desc", "매칭, 채팅, 그룹 알림을 개별적으로 켜고 끌 수 있습니다."),
        },
      ],
    },
  };
}

// ─── Component ───────────────────────────────────────────────────────────────
interface PageGuideProps {
  page: PageId;
  /** If true, shows as a small floating ? button. Otherwise renders inline trigger. */
  floating?: boolean;
}

export default function PageGuide({ page, floating = true }: PageGuideProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const guides = buildGuides();
  const guide = guides[page];
  const [activeItem, setActiveItem] = useState<number | null>(null);

  // Auto-show guide on first visit to this page (only after the main tutorial is done)
  useEffect(() => {
    const TUTORIAL_KEY = "migo_tutorial_done";
    const GUIDE_KEY = `migo_guide_${page}_done`;

    const tutorialDone = !!localStorage.getItem(TUTORIAL_KEY);
    const guideDone = !!localStorage.getItem(GUIDE_KEY);

    if (tutorialDone && !guideDone) {
      // Small delay so the page animation settles first
      const timer = setTimeout(() => {
        setOpen(true);
        localStorage.setItem(GUIDE_KEY, "1");
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [page]);

  return (
    <>
      {/* ── Trigger button ── */}
      {floating ? (
        <motion.button
          onClick={() => setOpen(true)}
          whileTap={{ scale: 0.9 }}
          className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm"
          aria-label={t("guide.openButton", "도움말")}
        >
          <HelpCircle size={15} className="text-primary" />
        </motion.button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <HelpCircle size={12} />
          <span className="truncate">{t("guide.openButton", "도움말")}</span>
        </button>
      )}

      {/* ── Bottom Sheet ── */}
      <AnimatePresence>
        {open && createPortal(
          <motion.div
            className="fixed inset-0 z-[300] flex flex-col items-center justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => { setOpen(false); setActiveItem(null); }}
            />

            {/* Sheet — positioned above bottom nav bar (~68px) */}
            <motion.div
              className="relative w-full max-w-lg bg-card rounded-t-3xl shadow-2xl overflow-hidden max-h-[calc(85vh-68px)] flex flex-col mb-[68px]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
            >
              {/* Gradient bar */}
              <div className="h-1 w-full shrink-0" style={{ background: "linear-gradient(90deg, #8b5cf6, #ec4899, #f97316)" }} />

              {/* Header */}
              <div className="flex items-start justify-between px-6 pt-5 pb-3 shrink-0">
                <div className="flex-1 min-w-0 pr-2">
                  <h2 className="text-lg font-extrabold text-foreground leading-tight truncate">{guide.title}</h2>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{guide.subtitle}</p>
                </div>
                <button
                  onClick={() => { setOpen(false); setActiveItem(null); }}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0"
                >
                  <X size={15} className="text-muted-foreground" />
                </button>
              </div>

              {/* Items list — extra bottom padding so last item clears the sheet corners */}
              <div className="overflow-y-auto flex-1 px-4 pb-6 space-y-2 truncate">
                {guide.items.map((item, i) => (
                  <motion.button
                    key={i}
                    onClick={() => setActiveItem(activeItem === i ? null : i)}
                    className="w-full text-left"
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${activeItem === i ? "bg-primary/8 border-primary/30" : "bg-muted/50 border-transparent"}`}>
                      {/* Icon bubble */}
                      <div className="w-10 h-10 rounded-xl bg-card border border-border/50 flex items-center justify-center text-xl shrink-0 shadow-sm">
                        {item.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${activeItem === i ? "text-primary" : "text-foreground"}`}>
                          {item.label}
                        </p>
                        <AnimatePresence>
                          {activeItem === i && (
                            <motion.p
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="text-xs text-muted-foreground leading-relaxed mt-1 break-words overflow-hidden"
                            >
                              {item.desc}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      <motion.div
                        animate={{ rotate: activeItem === i ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="shrink-0"
                      >
                        <ChevronRight size={16} className="text-muted-foreground" />
                      </motion.div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>, document.body
        )}
      </AnimatePresence>
    </>
  );
}
