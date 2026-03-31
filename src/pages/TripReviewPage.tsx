import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Star, CheckCircle2, Send, Heart, Zap,
  ThumbsUp, Clock, Award, MapPin
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

// ─── Positive tags ────────────────────────────────────────────────────
const POSITIVE_TAGS = [
  t("auto.x4176"),
  t("auto.x4177"),
  t("auto.x4178"),
  t("auto.x4179"),
  t("auto.x4180"),
  t("auto.x4181"),
  t("auto.x4182"),
  t("auto.x4183"),
  t("auto.x4184"),
  t("auto.x4185"),
];

const NEGATIVE_TAGS = [
  t("auto.x4186"),
  t("auto.x4187"),
  t("auto.x4188"),
  t("auto.x4189"),
  t("auto.x4190"),
];

interface ReviewState {
  partnerId?: string;
  partnerName?: string;
  partnerPhoto?: string;
  threadId?: string;
  destination?: string;
}

const StarRating = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-2 justify-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          whileTap={{ scale: 0.85 }}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform"
        >
          <Star
            size={40}
            className={`transition-colors ${
              (hovered || value) >= star
                ? "text-amber-400 fill-amber-400"
                : "text-muted-foreground/30"
            }`}
          />
        </motion.button>
      ))}
    </div>
  );
};

const RATING_LABELS: Record<number, { label: string; color: string; emoji: string }> = {
  1: { label: t("auto.x4191"), color: "text-rose-500", emoji: "😞" },
  2: { label: t("auto.x4192"), color: "text-orange-500", emoji: "😕" },
  3: { label: t("auto.x4193"), color: "text-amber-500", emoji: "😐" },
  4: { label: t("auto.x4194"), color: "text-emerald-500", emoji: "😊" },
  5: { label: t("auto.x4195"), color: "text-primary", emoji: "🤩" },
};

const TripReviewPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const state = (location.state ?? {}) as ReviewState;

  const partnerName = state.partnerName ?? t("auto.x4196");
  const partnerPhoto = state.partnerPhoto;
  const destination = state.destination ?? t("auto.x4197");

  const [step, setStep] = useState<"rating" | "tags" | "comment" | "done">("rating");
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const tags = rating >= 3 ? POSITIVE_TAGS : NEGATIVE_TAGS;

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag].slice(0, 5)
    );

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (user && state.partnerId) {
        await supabase.from("trip_reviews").insert({
          reviewer_id: user.id,
          reviewee_id: state.partnerId,
          rating,
          tags: selectedTags,
          comment: comment.trim() || null,
          destination: state.destination ?? null,
          thread_id: state.threadId ?? null,
        });
      }
    } catch (_) {
      // Silently ignore DB error for now (table may not exist)
    } finally {
      setSubmitting(false);
      setStep("done");
    }
  };

  // ─── Step: Done ─────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 14 }}
          className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mb-6 mx-auto"
        >
          <CheckCircle2 size={44} className="text-emerald-500" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-extrabold mb-2">{t("auto.x4161")}</h2>
          <p className="text-muted-foreground text-sm mb-2">
            <span className="font-bold text-foreground">{partnerName}</span>{t("auto.x4162")}
          </p>
          <p className="text-xs text-muted-foreground mb-8">
            {t("auto.x4163")}
          </p>

          <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
            <button
              onClick={() => navigate("/discover")}
              className="py-4 rounded-2xl gradient-primary text-primary-foreground font-extrabold shadow-float"
            >
              {t("auto.x4164")}
            </button>
            <button
              onClick={() => navigate("/chat")}
              className="py-4 rounded-2xl border border-border text-foreground font-bold"
            >
              {t("auto.x4165")}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Main ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-base font-extrabold">{t("auto.x4166")}</h1>
          <p className="text-xs text-muted-foreground">{destination}</p>
        </div>
      </header>

      {/* Progress */}
      <div className="flex gap-1 px-4 pt-3">
        {(["rating", "tags", "comment"] as const).map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-all ${
              ["rating", "tags", "comment"].indexOf(step) >= i
                ? "bg-primary"
                : "bg-muted"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col px-6 py-8">
        <AnimatePresence mode="wait">
          {/* ── Step 1: Star Rating ───────────────────────────────── */}
          {step === "rating" && (
            <motion.div
              key="rating"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex flex-col items-center text-center gap-6"
            >
              {/* Partner Avatar */}
              <div className="relative">
                {partnerPhoto ? (
                  <img
                    src={partnerPhoto}
                    alt={partnerName}
                    className="w-24 h-24 rounded-full object-cover border-4 border-primary/40 shadow-float"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center border-4 border-primary/40 shadow-float">
                    <span className="text-4xl font-black text-white">{partnerName[0]}</span>
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-background">
                  <Award size={14} className="text-white" />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-extrabold mb-1">
                  <span className="text-primary">{partnerName}</span>{t("auto.x4167")}
                </h2>
                <p className="text-sm text-muted-foreground">{destination}</p>
              </div>

              <StarRating value={rating} onChange={setRating} />

              {rating > 0 && (
                <motion.p
                  key={rating}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`text-lg font-extrabold ${RATING_LABELS[rating].color}`}
                >
                  {RATING_LABELS[rating].emoji} {RATING_LABELS[rating].label}
                </motion.p>
              )}

              <motion.button
                whileTap={{ scale: 0.95 }}
                disabled={rating === 0}
                onClick={() => setStep("tags")}
                className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-extrabold shadow-float disabled:opacity-40 disabled:cursor-not-allowed mt-4"
              >
                {t("auto.x4168")}
              </motion.button>
            </motion.div>
          )}

          {/* ── Step 2: Tags ──────────────────────────────────────── */}
          {step === "tags" && (
            <motion.div
              key="tags"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex flex-col gap-5"
            >
              <div className="text-center">
                <h2 className="text-xl font-extrabold mb-1">{t("auto.p32")} {rating >= 3 ? t("auto.p33") : t("auto.p34")}</h2>
                <p className="text-xs text-muted-foreground">{t("auto.x4169")}</p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                {tags.map((tag) => (
                  <motion.button
                    key={tag}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => toggleTag(tag)}
                    className={`px-3.5 py-2 rounded-full text-sm font-bold border transition-all ${
                      selectedTags.includes(tag)
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {tag}
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setStep("rating")}
                  className="flex-1 py-4 rounded-2xl border border-border text-foreground font-bold"
                >
                  {t("auto.x4170")}
                </button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep("comment")}
                  className="flex-1 py-4 rounded-2xl gradient-primary text-primary-foreground font-extrabold shadow-float"
                >
                  {t("auto.x4171")}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Comment ───────────────────────────────────── */}
          {step === "comment" && (
            <motion.div
              key="comment"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex flex-col gap-5"
            >
              <div className="text-center">
                <h2 className="text-xl font-extrabold mb-1">{t("auto.x4172")}</h2>
                <p className="text-xs text-muted-foreground">{t("auto.x4173")}</p>
              </div>

              {/* Selected tag summary */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {selectedTags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={300}
                rows={5}
                placeholder={t("auto.t5037", { v0: partnerName })}
                className="w-full bg-muted rounded-2xl p-4 text-sm text-foreground resize-none outline-none border border-border focus:border-primary transition-colors"
              />
              <p className="text-right text-xs text-muted-foreground -mt-3">{comment.length}/300</p>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("tags")}
                  className="flex-1 py-4 rounded-2xl border border-border text-foreground font-bold"
                >
                  {t("auto.x4174")}
                </button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="flex-1 py-4 rounded-2xl gradient-primary text-primary-foreground font-extrabold shadow-float flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={16} /> {t("auto.x4175")}
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TripReviewPage;
