import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Star, Check, Send, ThumbsUp, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";

// ─── Types ───────────────────────────────────────
interface Review {
  id: string;
  reviewerName: string;
  reviewerPhoto: string;
  rating: number;
  tags: string[];
  text: string;
  date: string;
  verified: boolean;
}
interface MetUser {
  id: string;
  name: string;
  photo: string;
  destination: string;
  meetDate: string;
  reviewed: boolean;
}

// Mock data removed

const POSITIVE_TAGS = ["Punctual", "Great conversation", "배려깊음7", "여행정보풍", "안전한느낌", "Would meet again", "현지맛집잘", "사진잘찍어"];
const CAUTION_TAGS = ["약속시간불", "대화가불편", "배려부족8"];

// ─── StarRating ───────────────────────────────────
const StarRating = ({
  value,
  onChange
}: {
  value: number;
  onChange: (v: number) => void;
}) => <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(s => <motion.button key={s} whileTap={{
    scale: 0.85
  }} onClick={() => onChange(s)}>
        <Star size={28} className={s <= value ? "text-amber-400 fill-amber-400" : "text-muted-foreground"} />
      </motion.button>)}
  </div>;

// ─── WriteReview modal ────────────────────────────
interface WriteReviewProps {
  user: MetUser;
  onClose: () => void;
  onSubmit: (userId: string) => void;
}
const WriteReview = ({
  user,
  onClose,
  onSubmit
}: WriteReviewProps) => {
  const {
    t
  } = useTranslation();
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [step, setStep] = useState<"rate" | "tags" | "text">("rate");
  const {
    user: me
  } = useAuth();
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };
  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: t("meetReview.noRating"),
        variant: "destructive"
      });
      return;
    }
    if (!me) {
      toast({
        title: t("alert.t65Title")
      });
      return;
    }
    await supabase.from('meet_reviews').insert({
      reviewer_id: me.id,
      target_id: user.id,
      rating,
      tags: selectedTags,
      text,
      meet_date: user.meetDate,
      destination: user.destination
    });
    onSubmit(user.id);
    toast({
      title: `${user.name}님 후기 작성 완료!`
    });
    onClose();
  };
  return <motion.div className="fixed inset-0 z-[70] flex items-end justify-center px-safe pb-safe pt-safe" initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} exit={{
    opacity: 0
  }}>
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-md" onClick={onClose} />
      <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 p-6 pb-12 shadow-float" initial={{
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
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

        {/* User preview */}
        <div className="flex items-center gap-3 mb-5">
          <img src={user.photo} alt={user.name} className="w-12 h-12 rounded-2xl object-cover" />
          <div>
            <p className="font-extrabold text-foreground">{user.name}{"님후기작성"}</p>
            <p className="text-xs text-muted-foreground">{user.destination} · {user.meetDate}</p>
          </div>
        </div>

        {/* Step: Rate */}
        <AnimatePresence mode="wait">
          {step === "rate" && <motion.div key="rate" initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }}>
              <p className="text-sm font-bold text-foreground mb-3">{t("meetReview.overallRate")}</p>
              <div className="flex justify-center mb-3">
                <StarRating value={rating} onChange={setRating} />
              </div>
              <p className="text-center text-sm text-muted-foreground mb-5">
                {rating === 0 ? t("meetReview.noRating") : rating === 5 ? t('meetReview.rate5') : rating === 4 ? t('meetReview.rate4') : rating === 3 ? t('meetReview.rate3') : rating === 2 ? t('meetReview.rate2') : t('meetReview.rate1')}
              </p>
              <motion.button whileTap={{
            scale: 0.97
          }} onClick={() => rating > 0 && setStep("tags")} className={`w-full py-3.5 rounded-2xl font-extrabold text-sm transition-all ${rating > 0 ? "gradient-primary text-primary-foreground shadow-float" : "bg-muted text-muted-foreground"}`}>
                {t("auto.j528")}
              </motion.button>
            </motion.div>}

          {step === "tags" && <motion.div key="tags" initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }}>
              <p className="text-sm font-bold text-foreground mb-3">{t("meetReview.whatGood")} <span className="text-muted-foreground font-normal">({t("general.multiSelect")})</span></p>
              <div className="flex flex-wrap gap-2 mb-3">
                {POSITIVE_TAGS.map(tag => <button key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${selectedTags.includes(tag) ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {tag}
                  </button>)}
              </div>
              {rating <= 2 && <>
                  <p className="text-xs font-bold text-destructive mb-2 flex items-center gap-1"><AlertTriangle size={11} /> {t("meetReview.anyDiscomfort")}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {CAUTION_TAGS.map(tag => <button key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${selectedTags.includes(tag) ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground"}`}>
                        {tag}
                      </button>)}
                  </div>
                </>}
              <div className="flex gap-2">
                <button onClick={() => setStep("rate")} className="flex-1 py-3 rounded-2xl border border-border text-foreground text-sm font-semibold">← {t("general.prev")}</button>
                <motion.button whileTap={{
              scale: 0.97
            }} onClick={() => setStep("text")} className="flex-1 py-3 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-sm">{t("general.next")} →</motion.button>
              </div>
            </motion.div>}

          {step === "text" && <motion.div key="text" initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }}>
              <p className="text-sm font-bold text-foreground mb-3">{t("meetReview.detailReview")} <span className="text-muted-foreground font-normal">({t("general.optional")})</span></p>
              <textarea value={text} onChange={e => setText(e.target.value)} maxLength={200} rows={4} placeholder={t("meetReview.placeholder")} className="w-full px-4 py-3 rounded-2xl bg-muted text-foreground text-sm placeholder:text-muted-foreground outline-none resize-none border-2 border-transparent focus:border-primary transition-colors mb-1" />
              <p className="text-[10px] text-muted-foreground text-right mb-4">{text.length}/200</p>
              <div className="flex gap-2">
                <button onClick={() => setStep("tags")} className="flex-1 py-3 rounded-2xl border border-border text-foreground text-sm font-semibold">← {t("general.prev")}</button>
                <motion.button whileTap={{
              scale: 0.97
            }} onClick={handleSubmit} className="flex-1 py-3 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-sm flex items-center justify-center gap-2">
                  <Send size={14} /> {t("meetReview.submitBtn")}
                </motion.button>
              </div>
            </motion.div>}
        </AnimatePresence>
      </motion.div>
    </motion.div>;
};

// ─── Main Page ────────────────────────────────────
const MeetReviewPage = () => {
  const {
    t
  } = useTranslation();
  const getArr = (k: string, fb: string[]) => {
    const v = t(k, {
      returnObjects: true
    });
    return Array.isArray(v) && v.length ? v : fb;
  };
  const CAUTION_TAGS = getArr("meetReview.cautionTags", ["연락두절8", "약속불이행", "불쾌한언행", "금전요구9", "과도한음주", "불건전목적", "프로필과다"]);
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [tab, setTab] = useState<"write" | "received">("write");
  const [users, setUsers] = useState<MetUser[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [writing, setWriting] = useState<MetUser | null>(null);
  useEffect(() => {
    if (!user) return;
    const fetchReviewsAndUsers = async () => {
      // 내가 받은 후기
      const {
        data: revData
      } = await supabase.from('meet_reviews').select('*, profiles!reviewer_id (name, photo_url)').eq('target_id', user.id);
      if (revData) {
        setReviews(revData.map(r => ({
          id: r.id,
          reviewerName: r.profiles?.name || "익명",
          reviewerPhoto: r.profiles?.photo_url || "",
          rating: r.rating,
          tags: r.tags || [],
          text: r.text || "",
          date: new Intl.DateTimeFormat('ko-KR').format(new Date(r.created_at)),
          verified: true
        })));
      }

      // 실제 매칭된 상대 (matches 테이블에서 양방향 매치 조회)
      const {
        data: matchData
      } = await supabase.from('matches').select('user1_id, user2_id').or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`).limit(20);
      if (matchData && matchData.length > 0) {
        const partnerIds = matchData.map((m: any) => m.user1_id === user.id ? m.user2_id : m.user1_id);
        const {
          data: partnerProfiles
        } = await supabase.from('profiles').select('id, name, photo_url, location, created_at').in('id', partnerIds);
        if (partnerProfiles) {
          setUsers(partnerProfiles.map((p: any) => ({
            id: p.id,
            name: p.name || "알수없음9",
            photo: p.photo_url || "",
            destination: p.location || "여행지",
            meetDate: new Intl.DateTimeFormat('ko-KR').format(new Date(p.created_at)),
            reviewed: false
          })));
        }
      } else {
        // 매칭 기록 없음 → 빈 배열
        setUsers([]);
      }
    };
    fetchReviewsAndUsers();
  }, [user]);
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const markReviewed = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? {
      ...u,
      reviewed: true
    } : u));
  };
  return <div className="min-h-screen bg-background safe-bottom pb-24">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center active:scale-90">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-foreground">{t("meetReview.title")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t("meetReview.subtitle")}</p>
        </div>
      </header>

      {/* Stats banner */}
      <div className="mx-5 mb-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl p-4 border border-amber-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{t("review.avgScore")}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Star size={18} className="text-amber-400 fill-amber-400" />
              <span className="text-xl font-extrabold text-foreground">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">/ 5.0</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{t("review.receivedReviews")}</p>
            <p className="text-xl font-extrabold text-foreground mt-0.5">{t("review.count", {
              count: reviews.length
            })}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{t("review.pendingReviews")}</p>
            <p className="text-xl font-extrabold text-primary mt-0.5">{t("review.count", {
              count: users.filter(u => !u.reviewed).length
            })}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mx-5 mb-4 bg-muted rounded-2xl p-1">
        {(["write", "received"] as const).map(tabItem => <button key={tabItem} onClick={() => setTab(tabItem)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${tab === tabItem ? "bg-card text-foreground shadow-card" : "text-muted-foreground"}`}>
            {tabItem === "write" ? t("review.tabWrite") : t("review.tabReceived")}
          </button>)}
      </div>

      <div className="px-5 space-y-3">
        {/* Write tab */}
        {tab === "write" && users.length === 0 && <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">{t("review.noMatches")}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{t("review.noMatchesDesc")}</p>
          </div>}
        {tab === "write" && users.map(user => <motion.div key={user.id} layout className="bg-card rounded-2xl p-4 flex items-center gap-3 shadow-card">
            {user.photo ? <img src={user.photo} alt={user.name} className="w-14 h-14 rounded-2xl object-cover shrink-0" /> : <div className="w-14 h-14 rounded-2xl shrink-0 gradient-primary flex items-center justify-center">
                <span className="text-white font-extrabold text-xl">{user.name?.[0] ?? "?"}</span>
              </div>}
            <div className="flex-1">
              <p className="font-bold text-sm text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.destination} · {user.meetDate}</p>
              {user.reviewed && <div className="flex items-center gap-1 mt-1">
                  <Check size={11} className="text-emerald-500" />
                  <span className="text-[10px] text-emerald-500 font-bold">{t("review.doneBadge")}</span>
                </div>}
            </div>
            {!user.reviewed ? <motion.button whileTap={{
          scale: 0.9
        }} onClick={() => setWriting(user)} className="px-3 py-2 rounded-xl gradient-primary text-primary-foreground text-xs font-extrabold shadow-card">
                {t("meetReview.writeReviewBtn")}
              </motion.button> : <ThumbsUp size={18} className="text-emerald-500 shrink-0" />}
          </motion.div>)}

        {/* Received tab */}
        {tab === "received" && reviews.map(review => <motion.div key={review.id} layout className="bg-card rounded-2xl p-4 shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <img src={review.reviewerPhoto} alt={review.reviewerName} className="w-10 h-10 rounded-xl object-cover" />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-foreground">{review.reviewerName}</p>
                  {review.verified && <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check size={8} className="text-white" strokeWidth={3} />
                    </div>}
                </div>
                <p className="text-[10px] text-muted-foreground">{review.date}</p>
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({
              length: 5
            }).map((_, i) => <Star key={i} size={12} className={i < review.rating ? "text-amber-400 fill-amber-400" : "text-muted"} />)}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {review.tags.map(tag => <span key={tag} className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary">{tag}</span>)}
            </div>
            {review.text && <p className="text-xs text-muted-foreground leading-relaxed">"{review.text}"</p>}
          </motion.div>)}
      </div>

      {/* Write Review Modal */}
      <AnimatePresence>
        {writing && <WriteReview user={writing} onClose={() => setWriting(null)} onSubmit={markReviewed} />}
      </AnimatePresence>
    </div>;
};
export default MeetReviewPage;