import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
/**
 * NowMoments - "지금 여기있어요" Stories형 아바타 스트립
 * 인스타그램 스토리처럼 작은 원형 아바타 + 이름 + 거리
 * 탭하면 상세 바텀시트 표시
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, X, Zap, Plus, Navigation, ExternalLink, Map } from "lucide-react";
import useGeoDistance, { distanceLabel, travelTimeLabel, distanceColor, meetabilityLabel, getMidpoint, googleMapsUrl, naverMidpointUrl } from "@/hooks/useGeoDistance";
interface NowCard {
  id: string;
  userId: string;
  name: string;
  photo: string;
  age?: number;
  location: string;
  activity: string;
  expiresAt: number;
  emoji: string;
  lat?: number;
  lng?: number;
}
interface NowMomentsProps {
  onCardClick: (card: NowCard) => void;
  currentUserId?: string;
}
const DEMO_NOW_CARDS: NowCard[] = [{
  id: "now1",
  userId: "u1",
  name: "Sarah",
  photo: "",
  age: 26,
  location: "시부야",
  activity: "라멘같이먹",
  expiresAt: Date.now() + 5400000,
  emoji: "🍜",
  lat: 35.6580,
  lng: 139.7017
}, {
  id: "now2",
  userId: "u2",
  name: "현준",
  photo: "",
  age: 29,
  location: "도톤보리1",
  activity: "야경사진같",
  expiresAt: Date.now() + 2700000,
  emoji: "📸",
  lat: 34.6687,
  lng: 135.5023
}, {
  id: "now3",
  userId: "u3",
  name: "Emma",
  photo: "",
  age: 24,
  location: "홍대",
  activity: "카페아는곳",
  expiresAt: Date.now() + 7200000,
  emoji: "☕",
  lat: 37.5563,
  lng: 126.9234
}, {
  id: "now4",
  userId: "u4",
  name: "はる",
  photo: "",
  age: 27,
  location: "강남",
  activity: "맛집같이가",
  expiresAt: Date.now() + 1200000,
  emoji: "🍣",
  lat: 37.4979,
  lng: 127.0276
}, {
  id: "now5",
  userId: "u5",
  name: "Alex",
  photo: "",
  age: 31,
  location: "이태원",
  activity: "치맥같이해",
  expiresAt: Date.now() + 10800000,
  emoji: "🍺",
  lat: 37.5344,
  lng: 126.9943
}];
function useCountdown(expiresAt: number) {
  const {
    t
  } = useTranslation();
  const [remaining, setRemaining] = useState(Math.max(0, expiresAt - Date.now()));
  useEffect(() => {
    const iv = setInterval(() => setRemaining(Math.max(0, expiresAt - Date.now())), 15000);
    return () => clearInterval(iv);
  }, [expiresAt]);
  const totalMs = 7200000;
  const pct = Math.round(remaining / totalMs * 100);
  const m = Math.floor(remaining / 60000);
  const label = remaining <= 0 ? "만료" : m > 60 ? `${Math.floor(m / 60)}h` : `${m}m`;
  return {
    label,
    pct,
    expired: remaining <= 0
  };
}

// Stories형 원형 아바타 버튼
const StoryAvatar = ({
  card,
  distKm,
  isMe,
  onClick
}: {
  card: NowCard;
  distKm: number | null;
  isMe?: boolean;
  onClick: () => void;
}) => {
  const {
    t
  } = useTranslation();
  const {
    label: timeLabel,
    pct,
    expired
  } = useCountdown(card.expiresAt);
  if (expired && !isMe) return null;
  const nearColor = distKm !== null ? distanceColor(distKm) : "#6366f1";
  const urgency = pct < 25;

  // 타이머 링 SVG
  const r = 28,
    circum = 2 * Math.PI * r;
  const dash = pct / 100 * circum;
  return <motion.button onClick={onClick} whileTap={{
    scale: 0.93
  }} className="flex flex-col items-center gap-1 shrink-0 w-16">
      {/* 원형 아바타 + 타이머 링 */}
      <div className="relative w-[60px] h-[60px]">
        {/* 타이머 링 */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
          <circle cx="32" cy="32" r={r} fill="none" stroke={urgency ? "#ef4444" : nearColor} strokeWidth="2.5" strokeDasharray={`${dash} ${circum}`} strokeLinecap="round" />
        </svg>

        {/* 아바타 */}
        {card.photo ? <img src={card.photo} alt={card.name} className="absolute inset-[4px] rounded-full object-cover border-2 border-card" /> : <div className="absolute inset-[4px] rounded-full flex items-center justify-center text-xl border-2 border-card" style={{
        background: isMe ? "rgba(99,102,241,0.25)" : `${nearColor}22`
      }}>
            {isMe ? "+" : card.emoji}
          </div>}

        {/* LIVE dot */}
        <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card flex items-center justify-center" style={{
        background: urgency ? "#ef4444" : isMe ? "#6366f1" : "#10b981"
      }}>
          {!isMe && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
        </span>
      </div>

      {/* 이름 */}
      <p className="text-[10px] font-bold text-foreground truncate w-full text-center">{isMe ? "올리기" : card.name}</p>

      {/* 거리 or 타이머 */}
      {!isMe && <p className="text-[9px] font-semibold truncate w-full text-center" style={{
      color: distKm !== null ? distanceColor(distKm) : "#9ca3af"
    }}>
          {distKm !== null ? distanceLabel(distKm) : timeLabel}
        </p>}
    </motion.button>;
};

// 상세 바텀시트
const NowDetailSheet = ({
  card,
  distKm,
  myPos,
  onClose,
  onMeet
}: {
  card: NowCard;
  distKm: number | null;
  myPos: {
    lat: number;
    lng: number;
  } | null;
  onClose: () => void;
  onMeet: () => void;
}) => {
  const {
    t
  } = useTranslation();
  const nearColor = distKm !== null ? distanceColor(distKm) : "#10b981";
  const midpoint = myPos && card.lat && card.lng ? getMidpoint(myPos, {
    lat: card.lat,
    lng: card.lng
  }) : null;
  const mapsUrl = myPos && card.lat && card.lng ? googleMapsUrl(myPos, {
    lat: card.lat,
    lng: card.lng
  }) : null;
  const naverUrl = midpoint ? naverMidpointUrl(midpoint) : null;
  return <motion.div className="fixed inset-0 z-[90] flex items-end justify-center px-safe pb-safe pt-safe" initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} exit={{
    opacity: 0
  }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div className="relative z-10 w-full max-w-sm mx-auto bg-card rounded-3xl mb-4 sm:mb-8 p-5" initial={{
      y: "100%"
    }} animate={{
      y: 0
    }} exit={{
      y: "100%"
    }} transition={{
      type: "spring",
      damping: 28,
      stiffness: 300
    }}>
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />

        {/* 헤더 */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{
          background: `${nearColor}20`
        }}>
            {card.emoji}
          </div>
          <div className="flex-1">
            <p className="font-extrabold text-foreground">{card.name}{card.age ? `, ${card.age}` : ""}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={11} className="text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">{card.location}</span>
            </div>
          </div>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>

        {/* 활동 */}
        <p className="text-sm text-foreground mb-3 leading-relaxed bg-muted rounded-2xl p-3">"{card.activity}"</p>

        {/* 거리 정보 */}
        {distKm !== null && <div className="rounded-2xl p-3 mb-3 border" style={{
        background: `${nearColor}10`,
        borderColor: `${nearColor}35`
      }}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Navigation size={14} style={{
              color: nearColor
            }} />
                <span className="font-extrabold text-sm" style={{
              color: nearColor
            }}>
                  {distanceLabel(distKm)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{travelTimeLabel(distKm)}</span>
            </div>
            <p className="text-xs font-medium" style={{
          color: nearColor
        }}>
              {meetabilityLabel(distKm)}
            </p>
            {/* 거리 바 */}
            <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{
            background: nearColor,
            width: `${Math.max(4, 100 - Math.min(100, distKm / 20 * 100))}%`
          }} />
            </div>
          </div>}

        {/* 지도 버튼 */}
        {(mapsUrl || naverUrl) && <div className="grid grid-cols-2 gap-2 mb-3">
            {mapsUrl && <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-muted border border-border text-xs font-bold text-foreground">
                <ExternalLink size={12} />{"길찾기"}</a>}
            {naverUrl && <a href={naverUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-muted border border-border text-xs font-bold text-foreground">
                <Map size={12} />{"중간지점1"}</a>}
          </div>}

        {/* CTA */}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-border text-sm font-semibold text-foreground">{"닫기"}</button>
          <motion.button whileTap={{
          scale: 0.97
        }} onClick={onMeet} className="flex-1 py-3 rounded-2xl text-white text-sm font-extrabold flex items-center justify-center gap-2" style={{
          background: `linear-gradient(135deg, ${nearColor}, #6366f1)`
        }}>
            <Zap size={14} />{"지금만나기"}</motion.button>
        </div>
      </motion.div>
    </motion.div>;
};

// 내 NOW 포스팅 바텀시트
const PostNowSheet = ({
  onClose,
  onPost
}: {
  onClose: () => void;
  onPost: (data: {
    location: string;
    activity: string;
    emoji: string;
  }) => void;
}) => {
  const {
    t
  } = useTranslation();
  const [location, setLocation] = useState("");
  const [activity, setActivity] = useState("");
  const EMOJIS = ["🍜", "☕", "📸", "🌅", "🍺", "🛍️", "🏖️", "🍣", "🥂", "🎵", "🎮", "🏔️"];
  const [emoji, setEmoji] = useState("☕");
  return <motion.div className="fixed inset-0 z-[90] flex items-end justify-center px-safe pb-safe pt-safe" initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} exit={{
    opacity: 0
  }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div className="relative z-10 w-full max-w-sm mx-auto bg-card rounded-3xl mb-4 sm:mb-8 p-5" initial={{
      y: "100%"
    }} animate={{
      y: 0
    }} exit={{
      y: "100%"
    }} transition={{
      type: "spring",
      damping: 28,
      stiffness: 300
    }}>
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-extrabold text-foreground">{"지금여기있"}</h3>
            <p className="text-xs text-muted-foreground">{"2시간동안"}</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {EMOJIS.map(e => <button key={e} onClick={() => setEmoji(e)} className={`w-9 h-9 rounded-2xl text-lg flex items-center justify-center transition-all ${emoji === e ? "bg-primary/20 ring-2 ring-primary scale-110" : "bg-muted"}`}>
              {e}
            </button>)}
        </div>
        <div className="space-y-3 mb-4">
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder={"현재위치예"} className="w-full rounded-2xl bg-muted border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50" />
          <input value={activity} onChange={e => setActivity(e.target.value)} placeholder={"뭐하고싶어"} className="w-full rounded-2xl bg-muted border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <motion.button onClick={() => {
        if (!location || !activity) return;
        onPost({
          location,
          activity,
          emoji
        });
        onClose();
      }} whileTap={{
        scale: 0.97
      }} disabled={!location || !activity} className="w-full py-3.5 rounded-2xl font-extrabold text-sm text-white disabled:opacity-40" style={{
        background: "linear-gradient(135deg, #10b981, #6366f1)"
      }}>{"지금올리기"}</motion.button>
      </motion.div>
    </motion.div>;
};

// ── 메인 ──────────────────────────────────────────────
const NowMoments = ({
  onCardClick,
  currentUserId
}: NowMomentsProps) => {
  const {
    t
  } = useTranslation();
  const {
    myPos,
    distanceTo
  } = useGeoDistance();
  const [cards] = useState<NowCard[]>(DEMO_NOW_CARDS);
  const [myCard, setMyCard] = useState<NowCard | null>(null);
  const [showPostSheet, setShowPostSheet] = useState(false);
  const [expanded, setExpanded] = useState<NowCard | null>(null);

  // 거리 기준 정렬
  const allCards = myCard ? [myCard, ...cards] : cards;
  const sortedCards = [...allCards].sort((a, b) => {
    const da = a.lat && a.lng ? distanceTo({
      lat: a.lat,
      lng: a.lng
    }) ?? 999 : 999;
    const db = b.lat && b.lng ? distanceTo({
      lat: b.lat,
      lng: b.lng
    }) ?? 999 : 999;
    return da - db;
  });
  const handlePost = (data: {
    location: string;
    activity: string;
    emoji: string;
  }) => {
    setMyCard({
      id: `now_me_${Date.now()}`,
      userId: currentUserId || "me",
      name: "나4",
      photo: "",
      location: data.location,
      activity: data.activity,
      expiresAt: Date.now() + 7200000,
      emoji: data.emoji,
      lat: myPos?.lat,
      lng: myPos?.lng
    });
  };
  return <>
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between px-4 pt-1 pb-1">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-extrabold text-foreground">{"지금여기있"}</span>
          <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 ml-0.5">
            {sortedCards.length}{"명6"}</span>
        </div>
        <span className="text-[9px] text-muted-foreground">{"가까운순1"}</span>
      </div>

      {/* Stories 아바타 스트립 */}
      <div className="flex gap-4 px-4 overflow-x-auto py-1" style={{
      scrollbarWidth: "none",
      msOverflowStyle: "none"
    }}>
        {/* 내 올리기 버튼 */}
        <StoryAvatar isMe card={{
        id: "me",
        userId: "me",
        name: "올리기",
        photo: "",
        location: "",
        activity: "",
        expiresAt: Date.now() + 1,
        emoji: "+"
      }} distKm={null} onClick={() => setShowPostSheet(true)} />
        {/* 정렬된 카드들 */}
        {sortedCards.map(card => {
        const distKm = card.lat && card.lng ? distanceTo({
          lat: card.lat,
          lng: card.lng
        }) : null;
        return <StoryAvatar key={card.id} card={card} distKm={distKm} onClick={() => setExpanded(card)} />;
      })}
      </div>

      {/* 모달 */}
      <AnimatePresence>
        {showPostSheet && <PostNowSheet onClose={() => setShowPostSheet(false)} onPost={handlePost} />}
      </AnimatePresence>
      <AnimatePresence>
        {expanded && (() => {
        const distKm = expanded.lat && expanded.lng ? distanceTo({
          lat: expanded.lat,
          lng: expanded.lng
        }) : null;
        return <NowDetailSheet card={expanded} distKm={distKm} myPos={myPos} onClose={() => setExpanded(null)} onMeet={() => {
          onCardClick(expanded);
          setExpanded(null);
        }} />;
      })()}
      </AnimatePresence>
    </>;
};
export default NowMoments;
export type { NowCard };