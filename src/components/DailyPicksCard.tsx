import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { Heart, Star, MapPin, Clock, ChevronRight, Sparkles } from "lucide-react";

interface DailyPick {
  id: string;
  name: string;
  age: number;
  photo_url: string;
  nationality: string;
  location: string;
  bio: string;
  interests: string[];
  verified: boolean;
  like_count: number;
}

export default function DailyPicksCard({ onProfileClick }: { onProfileClick?: (id: string) => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [picks, setPicks] = useState<DailyPick[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!user) return;
    loadDailyPicks();
  }, [user]);

  // 자정까지 남은 시간 카운트다운
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadDailyPicks = async () => {
    if (!user) return;

    // 날짜 기반 시드로 일관된 추천 (같은 날 같은 3명)
    const today = new Date().toISOString().split("T")[0];
    const cached = sessionStorage.getItem(`migo_daily_picks_${today}`);
    if (cached) {
      setPicks(JSON.parse(cached));
      return;
    }

    // 내 정보
    const { data: me } = await supabase
      .from("profiles")
      .select("interests, languages")
      .eq("id", user.id)
      .single();

    // 프로필 가져오기 (모의 유저 포함, 사진 있는 사람만)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, age, photo_url, nationality, location, bio, interests, verified")
      .neq("id", user.id)
      .not("photo_url", "is", null)
      .limit(30);

    if (!profiles || profiles.length === 0) return;

    // 공통 관심사 기반 점수 매기기
    const myInterests = me?.interests || [];
    const scored = profiles.map((p) => {
      const common = (p.interests || []).filter((i: string) => myInterests.includes(i)).length;
      return { ...p, score: common * 10 + (p.verified ? 5 : 0) + Math.random() * 3 };
    });
    scored.sort((a, b) => b.score - a.score);

    // 상위 3명 + 좋아요 수 가져오기
    const top3 = scored.slice(0, 3);
    const pickResults: DailyPick[] = [];

    for (const p of top3) {
      const { count } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("to_user", p.id);

      pickResults.push({
        id: p.id,
        name: p.name,
        age: p.age || 25,
        photo_url: p.photo_url,
        nationality: p.nationality || "",
        location: p.location || "",
        bio: p.bio || "",
        interests: p.interests || [],
        verified: p.verified,
        like_count: count || 0,
      });
    }

    setPicks(pickResults);
    sessionStorage.setItem(`migo_daily_picks_${today}`, JSON.stringify(pickResults));
  };

  if (picks.length === 0) return null;

  const pick = picks[currentIdx];

  return (
    <div className="px-4 pb-2">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-500" />
            <span className="text-[11px] font-extrabold text-foreground">
              {t("daily.title", "오늘의 추천 매치")}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
              💫 {t("daily.best", "Best")}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <Clock size={10} />
            <span>{timeLeft}</span>
          </div>
        </div>

        {/* Profile cards row */}
        <div className="flex gap-2 px-3 pb-3 pt-1 overflow-x-auto scrollbar-none">
          {picks.map((p, i) => (
            <motion.button
              key={p.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setCurrentIdx(i);
                onProfileClick?.(p.id);
              }}
              className={`relative shrink-0 w-[110px] rounded-xl overflow-hidden border-2 transition-all ${
                i === currentIdx ? "border-primary shadow-lg" : "border-transparent"
              }`}
            >
              {/* Photo */}
              <div className="h-[130px] relative">
                <img
                  src={p.photo_url}
                  alt={p.name}
                  className="w-full h-full object-cover pointer-events-auto"
                  loading="lazy"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                
                {/* Verified badge */}
                {p.verified && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <Star size={8} className="text-white" fill="white" />
                  </div>
                )}

                {/* Like count */}
                <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-500/80 backdrop-blur-sm">
                  <Heart size={8} className="text-white" fill="white" />
                  <span className="text-[8px] font-bold text-white">{p.like_count}</span>
                </div>

                {/* Name & info */}
                <div className="absolute bottom-1.5 left-1.5 right-1.5">
                  <p className="text-white text-[11px] font-extrabold truncate">
                    {p.name}, {p.age}
                  </p>
                  <div className="flex items-center gap-0.5">
                    <MapPin size={8} className="text-white/70" />
                    <p className="text-white/80 text-[8px] truncate">{p.location || p.nationality}</p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="px-1.5 py-1.5 bg-card">
                <div className="flex flex-wrap gap-0.5">
                  {(p.interests || []).slice(0, 2).map((tag) => (
                    <span key={tag} className="text-[7px] px-1 py-0.5 rounded bg-muted text-muted-foreground font-medium truncate">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1 pb-2">
          {picks.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === currentIdx ? "bg-primary w-4" : "bg-border"
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
