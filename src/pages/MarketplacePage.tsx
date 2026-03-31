import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getLocalizedPrice } from "@/lib/pricing";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Star, MapPin, Clock, Users, Tag, X, ChevronRight, Sparkles, Heart, Award, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import PaymentModal from "@/components/PaymentModal";
import { fetchMarketplaceItems, Package } from "@/lib/marketplaceService";

// ─── Categories ────────────────────────────────────
const CATEGORIES = [
  { id: "all", labelKey: "marketplace.all", emoji: "🌏" },
  { id: "tour", label: "Tour", emoji: "🗺️" },
  { id: "activity", labelKey: "marketplace.activity", emoji: "🏄" },
  { id: "food", labelKey: "marketplace.food", emoji: "🍜" },
  { id: "stay", labelKey: "marketplace.stay", emoji: "🏡" },
];

const CATEGORY_COLORS: Record<string, string> = {
  tour: "bg-blue-500/10 text-blue-500",
  activity: "bg-emerald-500/10 text-emerald-500",
  food: "bg-orange-500/10 text-orange-500",
  stay: "bg-purple-500/10 text-purple-500",
};

// ─── Host Registration Modal ─────────────────────────────────
const HostRegistrationModal = ({
  onClose,
  userId,
}: {
  onClose: () => void;
  userId: string;
}) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ category: "tour", intro: "", phone: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.intro || !form.phone) return;
    setSaving(true);
    const catItem = CATEGORIES.find(c => c.id === form.category);
    const catLabel = catItem?.labelKey ? t(catItem.labelKey) : (catItem?.label ?? form.category);
    await supabase.from("reports").insert({
      reporter_id: userId,
      target_id: userId,
      target_type: "other",
      reason: i18n.t("auto.z_tmpl_153", {
        defaultValue: i18n.t("auto.z_tmpl_287", {
          defaultValue: t("auto.p24", {
            cat: catLabel,
            phone: form.phone,
            intro: form.intro,
          }),
        }),
      }),
    });
    setSaving(false);
    toast({
      title: i18n.t("auto.z_autoz호스트신청_288"),
      description: t("marketplace.hostSubmittedDesc"),
    });
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-sm bg-card rounded-3xl p-6 shadow-float overflow-hidden"
        initial={{ y: 20, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
            <Award className="text-primary" size={18} />{t("auto.z_autoz호스트지원_289")}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">{t("auto.z_autoz운영카테고_290")}</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.filter(c => c.id !== "all").map(c => (
                <button
                  key={c.id}
                  onClick={() => setForm(f => ({ ...f, category: c.id }))}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    form.category === c.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {c.emoji} {c.labelKey ? t(c.labelKey) : c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">{t("auto.z_autoz전문분야및_291")}</label>
            <textarea
              value={form.intro}
              onChange={e => setForm(f => ({ ...f, intro: e.target.value }))}
              rows={3}
              placeholder={t("auto.z_autoz어떤투어나_292")}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">{t("auto.z_autoz연락처15_293")}</label>
            <input
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="010-0000-0000"
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={saving || !form.intro || !form.phone}
          className="w-full mt-6 py-3.5 rounded-xl gradient-primary text-primary-foreground font-extrabold flex items-center justify-center gap-2 shadow-float disabled:opacity-50"
        >
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : t("auto.z_autoz신청서제출_294")}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

// ─── BookingModal ─────────────────────────────────
interface BookingModalProps {
  pkg: Package;
  onClose: () => void;
  userId?: string;
}

const BookingModal = ({ pkg, onClose, userId }: BookingModalProps) => {
  const { t } = useTranslation();
  const [count, setCount] = useState(1);
  const [showPayment, setShowPayment] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleBook = () => setShowPayment(true);

  const handlePaymentSuccess = async () => {
    if (userId) {
      const { error } = await supabase.from("reports").insert({
        reporter_id: userId,
        target_id: pkg.id,
        target_type: "other",
        reason: i18n.t("auto.z_tmpl_161", {
          defaultValue: i18n.t("auto.z_tmpl_295", {
            defaultValue: t("auto.p25", {
              title: pkg.title,
              count,
              price: getLocalizedPrice(pkg.price * count, i18n.language),
            }),
          }),
        }),
      });
      if (error) {
        toast({ title: t("alert.t60Title") });
        return;
      }
    }
    setShowPayment(false);
    setConfirmed(true);
    setTimeout(() => {
      onClose();
      toast({
        title: i18n.t("auto.z_tmpl_162", {
          defaultValue: i18n.t("auto.z_tmpl_296", {
            defaultValue: t("auto.t5023", { v0: pkg.title }),
          }),
        }),
      });
    }, 1800);
  };

  if (confirmed) {
    return (
      <motion.div
        className="fixed inset-0 z-[70] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="bg-card rounded-3xl p-8 flex flex-col items-center gap-4 shadow-float">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Check size={32} className="text-emerald-500" />
          </div>
          <p className="text-lg font-extrabold text-foreground">{t("auto.z_autoz예약완료_305")}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-md" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-t-3xl shadow-float overflow-hidden"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
      >
        {/* Image strip */}
        <div className="h-36 overflow-hidden relative">
          <img src={pkg.image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-lg font-extrabold text-foreground">{pkg.title}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin size={12} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{pkg.destination}</span>
                <span className="text-muted-foreground/40 mx-1">·</span>
                <Clock size={12} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{pkg.duration}</span>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <X size={16} />
            </button>
          </div>

          {/* People selector */}
          <div className="flex items-center justify-between bg-muted rounded-2xl px-4 py-3 mb-4">
            <span className="text-sm font-bold text-foreground">{t("auto.z_autoz인원선택_301")}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCount(c => Math.max(1, c - 1))}
                disabled={count <= 1}
                className="w-8 h-8 rounded-xl bg-card flex items-center justify-center font-bold text-foreground disabled:opacity-30"
              >
                −
              </button>
              <span className="text-base font-extrabold text-foreground w-5 text-center">{count}</span>
              <button
                onClick={() => setCount(c => Math.min(pkg.maxPeople - pkg.currentPeople, c + 1))}
                disabled={count >= pkg.maxPeople - pkg.currentPeople}
                className="w-8 h-8 rounded-xl bg-card flex items-center justify-center font-bold text-foreground disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-sm text-muted-foreground">{t("auto.z_autoz총금액1_302")}</span>
            <span className="text-xl font-extrabold text-foreground">{getLocalizedPrice(pkg.price * count, i18n.language)}</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleBook}
            className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-base shadow-float flex items-center justify-center gap-2"
          >
            {t("auto.z_autoz예약하기_303")}<ChevronRight size={18} />
          </motion.button>
        </div>

        <AnimatePresence>
          {showPayment && (
            <PaymentModal
              isOpen={showPayment}
              onClose={() => setShowPayment(false)}
              groupTitle={pkg.title}
              groupId={pkg.id}
              entryFee={pkg.price * count}
              onPaymentSuccess={handlePaymentSuccess}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

// ─── Package Card ─────────────────────────────────
function PackageCard({
  pkg,
  onBook,
  onLike,
  liked,
}: {
  pkg: Package;
  onBook: () => void;
  onLike: () => void;
  liked: boolean;
}) {
  const { t } = useTranslation();
  const cat = CATEGORIES.find(c => c.id === pkg.category);

  return (
    <motion.div layout className="bg-card rounded-3xl overflow-hidden shadow-card">
      <div className="relative">
        <img src={pkg.image} alt={pkg.title} className="w-full h-44 object-cover" draggable={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Featured badge */}
        {pkg.featured && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold shadow-lg">
            <Sparkles size={9} />{t("auto.z_autoz인기패키지_306")}
          </div>
        )}

        {/* Category badge */}
        {cat && (
          <div className={`absolute top-3 right-12 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm ${CATEGORY_COLORS[pkg.category] ?? ""}`}>
            {cat.emoji} {cat.labelKey ? t(cat.labelKey) : cat.label}
          </div>
        )}

        {/* Like button */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={onLike}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
        >
          <Heart size={14} className={liked ? "text-rose-400 fill-rose-400" : "text-white"} />
        </motion.button>

        {/* Price on image */}
        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm">
          <span className="text-white text-sm font-extrabold">{getLocalizedPrice(pkg.price, i18n.language)}</span>
          <span className="text-white/70 text-[10px]">/{pkg.duration}</span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-extrabold text-foreground text-sm mb-1">{pkg.title}</h3>
        <div className="flex items-center gap-1.5 mb-2">
          <MapPin size={11} className="text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">{pkg.destination}</span>
          <span className="text-muted-foreground/50 mx-0.5">·</span>
          <Star size={11} className="text-amber-400 fill-amber-400" />
          <span className="text-[11px] font-bold text-foreground">{pkg.rating}</span>
          <span className="text-[10px] text-muted-foreground">({pkg.reviewCount})</span>
        </div>

        <p className="text-[11px] text-muted-foreground mb-3 line-clamp-2">{pkg.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {pkg.tags.slice(0, 3).map(tag => (
            <span key={tag} className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-muted text-[9px] font-bold text-muted-foreground">
              <Tag size={7} /> {tag}
            </span>
          ))}
        </div>

        {/* Host + CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={pkg.hostAvatar} alt={pkg.host} className="w-6 h-6 rounded-full object-cover" />
            <span className="text-[11px] text-muted-foreground">{pkg.host}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">
              <Users size={10} className="inline mr-0.5" />
              {pkg.maxPeople - pkg.currentPeople}{t("auto.z_autoz자리남음1_308")}
            </span>
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={onBook}
              className="px-3 py-2 rounded-xl gradient-primary text-primary-foreground text-[11px] font-extrabold shadow-card flex items-center gap-1"
            >
              {t("auto.z_autoz예약175_309")}<ChevronRight size={11} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────
const MarketplacePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("all");
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [booking, setBooking] = useState<Package | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [showHostModal, setShowHostModal] = useState(false);

  useEffect(() => {
    const loadPackages = async () => {
      const data = await fetchMarketplaceItems();
      setPackages(data);
    };
    loadPackages();

    if (user) {
      supabase
        .from("marketplace_likes")
        .select("item_id")
        .eq("user_id", user.id)
        .then(({ data }) => {
          if (data) setLikedIds(data.map((r: any) => r.item_id));
        });
    }
  }, [user]);

  const filtered = activeCategory === "all" ? packages : packages.filter(p => p.category === activeCategory);

  const toggleLike = async (id: string) => {
    if (!user) {
      toast({ title: t("alert.t61Title"), variant: "destructive" });
      return;
    }
    const isLiked = likedIds.includes(id);
    if (isLiked) {
      setLikedIds(prev => prev.filter(i => i !== id));
      await supabase.from("marketplace_likes").delete().eq("user_id", user.id).eq("item_id", id);
    } else {
      setLikedIds(prev => [...prev, id]);
      await supabase.from("marketplace_likes").insert({ user_id: user.id, item_id: id });
    }
  };

  return (
    <div className="min-h-screen bg-background safe-bottom pb-24">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-12 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center active:scale-90"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-foreground">{t("auto.z_autoz여행마켓1_310")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t("auto.z_autoz투어액티비_311")}</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            if (user) setShowHostModal(true);
            else toast({ title: t("alert.t62Title") });
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-xs font-bold text-foreground"
        >
          <Award size={13} />{t("auto.z_autoz호스트등록_312")}
        </motion.button>
      </header>

      {/* Hero banner */}
      <div
        className="mx-5 mt-3 mb-4 rounded-3xl overflow-hidden relative h-28"
        style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #f43f5e 100%)" }}
      >
        <div className="absolute inset-0 flex flex-col justify-center px-5">
          <p className="text-white/80 text-xs font-semibold">{t("auto.z_autozMigo마_313")}</p>
          <p className="text-white text-lg font-extrabold mt-0.5">{t("auto.z_autoz여행경험을_314")}</p>
          <p className="text-white/70 text-[11px] mt-0.5">{t("auto.z_autoz예약시Mi_315")}</p>
        </div>
        <Sparkles size={60} className="absolute right-4 top-4 text-white/10" />
      </div>

      {/* Categories */}
      <div className="flex gap-2 px-5 mb-4 overflow-x-auto scrollbar-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? "gradient-primary text-primary-foreground shadow-card"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {cat.emoji} {cat.labelKey ? t(cat.labelKey) : cat.label}
          </button>
        ))}
      </div>

      {/* Package list */}
      <div className="px-5 space-y-4">
        <AnimatePresence mode="popLayout">
          {filtered.map(pkg => (
            <motion.div
              key={pkg.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <PackageCard
                pkg={pkg}
                liked={likedIds.includes(pkg.id)}
                onLike={() => toggleLike(pkg.id)}
                onBook={() => setBooking(pkg)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Booking modal */}
      <AnimatePresence>
        {booking && (
          <BookingModal pkg={booking} userId={user?.id} onClose={() => setBooking(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHostModal && user && (
          <HostRegistrationModal userId={user.id} onClose={() => setShowHostModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MarketplacePage;