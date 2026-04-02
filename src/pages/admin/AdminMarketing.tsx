import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Trash2, Eye, Pause, Play, Upload, Image as ImageIcon, Monitor, Smartphone, Tag, Bell, Send, TrendingUp, Check, ChevronDown, DollarSign, Users, MousePointer, Megaphone } from "lucide-react";
import { Ad, AdSlot, AdStatus, fetchAds, fetchAdSlots, createAd, deleteAd, updateAdStatus, uploadAdImage, toggleAdSlot, MOCK_ADS, MOCK_AD_SLOTS } from "@/lib/adService";
import { fetchPromoCodes, createPromoCode, updatePromoCodeStatus, deletePromoCode, sendMarketingPush } from "@/lib/adminService";
export type Campaign = {
  id: string;
  title: string;
  type: "push" | "email" | "banner";
  target: string;
  status: "draft" | "active" | "completed";
  reach: number;
  clicks: number;
  createdAt: string;
};
type MarketingTab = "slots" | "ads" | "campaigns" | "promo" | "push";

// ─── Slot format badge ─────────────────────────────────────
const formatColor = (f: string) => f === "card" ? "bg-violet-500/10 text-violet-400" : f === "banner" ? "bg-blue-500/10 text-blue-400" : f === "native" ? "bg-orange-500/10 text-orange-400" : "bg-red-500/10 text-red-400";

// ─── Ad status badge ───────────────────────────────────────
const statusBadge = (s: AdStatus) => s === "active" ? "bg-emerald-500/10 text-emerald-400" : s === "draft" ? "bg-muted text-muted-foreground" : s === "paused" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400";
const statusLabel = (s: AdStatus) => s === "active" ? "게재중73" : s === "draft" ? "초안733" : s === "paused" ? "일시정지7" : "완료735";

// ─── Image Upload Component ────────────────────────────────
const ImageUpload = ({
  value,
  onChange
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) => {
  const {
    t
  } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    const url = await uploadAdImage(file);
    setUploading(false);
    if (url) onChange(url);
  }, [onChange]);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);
  return <div onClick={() => !value && inputRef.current?.click()} onDragOver={e => {
    e.preventDefault();
    setDragOver(true);
  }} onDragLeave={() => setDragOver(false)} onDrop={onDrop} className={`relative w-full h-40 rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden
        ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}
        ${value ? "border-solid border-border/50" : ""}`}>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
    }} />

      {uploading ? <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">{"업로드중7"}</p>
        </div> : value ? <>
          <img src={value} alt="ad" className="w-full h-full object-cover" />
          <button onClick={e => {
        e.stopPropagation();
        onChange(null);
      }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center">
            <X size={12} />
          </button>
          <button onClick={e => {
        e.stopPropagation();
        inputRef.current?.click();
      }} className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-background/80 text-xs font-semibold">
            <Upload size={10} />{"교체737"}</button>
        </> : <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <ImageIcon size={28} />
          <p className="text-xs font-semibold">{"이미지를드"}</p>
          <p className="text-[10px]">{"JPGPN"}</p>
        </div>}
    </div>;
};

// ─── Ad Create Modal ───────────────────────────────────────
const CreateAdModal = ({
  slots,
  onClose,
  onCreate
}: {
  slots: AdSlot[];
  onClose: () => void;
  onCreate: (ad: Ad) => void;
}) => {
  const {
    t
  } = useTranslation();
  const [form, setForm] = useState({
    title: "",
    advertiser: "",
    slot_id: slots[0]?.id ?? "",
    headline: "",
    body_text: "",
    cta_url: "",
    cta_text: "자세히보기",
    target_gender: "all",
    target_age_min: 18,
    target_age_max: 65,
    budget: 1000000,
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    status: "draft" as AdStatus
  });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const selectedSlot = slots.find(s => s.id === form.slot_id);
  const handleCreate = async () => {
    setSaving(true);
    const ad = await createAd({
      ...form,
      image_url: imageUrl,
      target_countries: null
    });
    setSaving(false);
    if (ad) {
      onCreate(ad);
      onClose();
    }
  };
  const steps = ["광고슬롯선", "광고소재7", "타겟팅예산"];
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div className="relative z-10 w-full max-w-2xl bg-card rounded-3xl shadow-float border border-border overflow-hidden" initial={{
      opacity: 0,
      y: 24
    }} animate={{
      opacity: 1,
      y: 0
    }}>
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-foreground">{"새광고만들"}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              {steps.map((s, i) => <div key={i} className="flex items-center gap-1.5">
                  <div className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center
                    ${i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-primary/20 text-primary border border-primary" : "bg-muted text-muted-foreground"}`}>
                    {i < step ? <Check size={10} /> : i + 1}
                  </div>
                  <span className={`text-[10px] font-semibold ${i === step ? "text-primary" : "text-muted-foreground"}`}>{s}</span>
                  {i < steps.length - 1 && <div className="w-6 h-px bg-border mx-1" />}
                </div>)}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Step 0: Slot selection */}
          {step === 0 && <div>
              <p className="text-sm font-bold text-foreground mb-4">{"광고를어디"}</p>
              <div className="grid grid-cols-2 gap-3">
                {slots.filter(s => s.enabled).map(s => <button key={s.id} onClick={() => setForm(f => ({
              ...f,
              slot_id: s.id
            }))} className={`text-left p-4 rounded-2xl border-2 transition-all ${form.slot_id === s.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${formatColor(s.format)}`}>
                        {s.format === "card" ? "카드746" : s.format === "banner" ? "배너747" : s.format === "native" ? "네이티브7" : "전면749"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{s.dimensions}</span>
                    </div>
                    <p className="font-bold text-foreground text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                    <p className="text-[10px] text-primary mt-2 font-semibold">📱 {s.app_screen}</p>
                  </button>)}
              </div>
            </div>}

          {/* Step 1: Creative */}
          {step === 1 && <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{"광고제목7"}</label>
                  <input value={form.title} onChange={e => setForm(f => ({
                ...f,
                title: e.target.value
              }))} placeholder={"예에어아시"} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{"광고주75"}</label>
                  <input value={form.advertiser} onChange={e => setForm(f => ({
                ...f,
                advertiser: e.target.value
              }))} placeholder={"예AirA"} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{"광고이미지"}</label>
                <ImageUpload value={imageUrl} onChange={setImageUrl} />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{"헤드라인7"}</label>
                <input value={form.headline} onChange={e => setForm(f => ({
              ...f,
              headline: e.target.value
            }))} placeholder={"예서울방콕"} maxLength={60} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{"광고문구7"}</label>
                <textarea value={form.body_text} onChange={e => setForm(f => ({
              ...f,
              body_text: e.target.value
            }))} rows={2} placeholder={"예봄시즌특"} maxLength={120} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary transition-colors resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{"CTA링크"}</label>
                  <input value={form.cta_url} onChange={e => setForm(f => ({
                ...f,
                cta_url: e.target.value
              }))} placeholder="https://..." className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{"버튼텍스트"}</label>
                  <input value={form.cta_text} onChange={e => setForm(f => ({
                ...f,
                cta_text: e.target.value
              }))} placeholder={"자세히보기"} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary transition-colors" />
                </div>
              </div>

              {/* Ad Preview */}
              {(form.headline || imageUrl) && selectedSlot && <div className="bg-muted/50 rounded-2xl p-4 border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground mb-3 uppercase tracking-wide">{"미리보기7"}{selectedSlot.format})</p>
                  {selectedSlot.format === "banner" ? <div className="w-full h-14 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-border flex items-center px-3 gap-3 overflow-hidden">
                      {imageUrl && <img src={imageUrl} className="h-10 w-10 rounded-lg object-cover shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{form.headline || "헤드라인7"}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{form.advertiser}</p>
                      </div>
                      <span className="text-[10px] font-bold text-primary whitespace-nowrap shrink-0">{form.cta_text}</span>
                    </div> : selectedSlot.format === "card" ? <div className="w-48 mx-auto rounded-2xl overflow-hidden border border-border bg-card shadow-card">
                      {imageUrl ? <img src={imageUrl} className="w-full h-32 object-cover" /> : <div className="w-full h-32 bg-muted flex items-center justify-center"><ImageIcon size={20} className="text-muted-foreground" /></div>}
                      <div className="p-3">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{"광고764"}</span>
                        <p className="text-xs font-bold text-foreground mt-0.5">{form.headline || "헤드라인7"}</p>
                        <button className="mt-2 w-full py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold">{form.cta_text}</button>
                      </div>
                    </div> : <div className="flex gap-3 items-start">
                      {imageUrl && <img src={imageUrl} className="w-20 h-16 rounded-xl object-cover shrink-0" />}
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{"광고766"}</span>
                        <p className="text-sm font-bold text-foreground">{form.headline || "헤드라인7"}</p>
                        <p className="text-xs text-muted-foreground">{form.body_text}</p>
                        <span className="text-xs text-primary font-bold mt-1 block">{form.cta_text} →</span>
                      </div>
                    </div>}
                </div>}
            </div>}

          {/* Step 2: Targeting + Budget */}
          {step === 2 && <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-2 block">{"타겟성별7"}</label>
                <div className="flex gap-2">
                  {[["all", "전체769"], ["male", "남성770"], ["female", "여성771"]].map(([val, label]) => <button key={val} onClick={() => setForm(f => ({
                ...f,
                target_gender: val
              }))} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all border ${form.target_gender === val ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                      {label}
                    </button>)}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-2 block">{"타겟연령7"}{form.target_age_min}{"세773"}{form.target_age_max}{"세774"}</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">{"최소연령7"}</p>
                    <input type="range" min={18} max={60} value={form.target_age_min} onChange={e => setForm(f => ({
                  ...f,
                  target_age_min: Number(e.target.value)
                }))} className="w-full accent-violet-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">{"최대연령7"}</p>
                    <input type="range" min={20} max={65} value={form.target_age_max} onChange={e => setForm(f => ({
                  ...f,
                  target_age_max: Number(e.target.value)
                }))} className="w-full accent-violet-500" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{"시작일77"}</label>
                  <input type="date" value={form.start_date} onChange={e => setForm(f => ({
                ...f,
                start_date: e.target.value
              }))} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{"종료일77"}</label>
                  <input type="date" value={form.end_date} onChange={e => setForm(f => ({
                ...f,
                end_date: e.target.value
              }))} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{"총예산77"}</label>
                <input type="number" value={form.budget} step={100000} onChange={e => setForm(f => ({
              ...f,
              budget: Number(e.target.value)
            }))} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary" />
                <p className="text-[10px] text-muted-foreground mt-1">{"일예산78"}{Math.round(form.budget / Math.max(1, Math.ceil((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / 86400000))).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{"게재상태7"}</label>
                <select value={form.status} onChange={e => setForm(f => ({
              ...f,
              status: e.target.value as AdStatus
            }))} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary">
                  <option value="draft">{"초안으로저"}</option>
                  <option value="active">{"즉시게재7"}</option>
                </select>
              </div>
            </div>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <button onClick={() => step > 0 ? setStep(s => s - 1) : onClose()} className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
            {step === 0 ? "취소784" : "이전785"}
          </button>
          {step < 2 ? <motion.button whileTap={{
          scale: 0.97
        }} onClick={() => setStep(s => s + 1)} disabled={step === 1 && (!form.title || !form.advertiser)} className="px-5 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-extrabold disabled:opacity-40">{"다음786"}</motion.button> : <motion.button whileTap={{
          scale: 0.97
        }} onClick={handleCreate} disabled={saving || !form.cta_url} className="px-5 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-extrabold disabled:opacity-40 flex items-center gap-2">
              {saving ? <><div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />{"저장중78"}</> : "광고만들기"}
            </motion.button>}
        </div>
      </motion.div>
    </div>;
};

// ─── Main Component ────────────────────────────────────────
export const AdminMarketing = () => {
  const {
    t
  } = useTranslation();
  const [tab, setTab] = useState<MarketingTab>("slots");
  const [ads, setAds] = useState<Ad[]>([]);
  const [slots, setSlots] = useState<AdSlot[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [adFilter, setAdFilter] = useState<"all" | AdStatus>("all");

  // Push state
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [pushTarget, setPushTarget] = useState("전체유저7");
  const [pushSent, setPushSent] = useState(false);
  useEffect(() => {
    fetchAds().then(setAds);
    fetchAdSlots().then(setSlots);
    fetchPromoCodes().then(setPromos);
  }, []);
  const filteredAds = adFilter === "all" ? ads : ads.filter(a => a.status === adFilter);
  const handleToggleSlot = async (id: string, enabled: boolean) => {
    await toggleAdSlot(id, !enabled);
    setSlots(prev => prev.map(s => s.id === id ? {
      ...s,
      enabled: !enabled
    } : s));
  };
  const handleDeleteAd = async (id: string) => {
    await deleteAd(id);
    setAds(prev => prev.filter(a => a.id !== id));
  };
  const handleStatusChange = async (id: string, status: AdStatus) => {
    await updateAdStatus(id, status);
    setAds(prev => prev.map(a => a.id === id ? {
      ...a,
      status
    } : a));
  };
  const sendPush = async () => {
    if (!pushTitle || !pushBody) return;
    const ok = await sendMarketingPush(pushTitle, pushBody, pushTarget);
    if (ok) {
      setPushSent(true);
      setTimeout(() => {
        setPushSent(false);
        setPushTitle("");
        setPushBody("");
      }, 3000);
    }
  };
  const tabs: {
    id: MarketingTab;
    label: string;
  }[] = [{
    id: "slots",
    label: "광고게재위"
  }, {
    id: "ads",
    label: t("auto.z_tmpl_791", {
      defaultValue: t("auto.z_tmpl_1147", {
        defaultValue: t("auto.t5003", { v0: ads.length })
      })
    })
  }, {
    id: "campaigns",
    label: "캠페인분석"
  }, {
    id: "promo",
    label: "프로모코드"
  }, {
    id: "push",
    label: "푸시알림7"
  }];
  return <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">{"마케팅79"}</h1>
          <p className="text-sm text-muted-foreground">{"광고게재위"}</p>
        </div>
        {tab === "ads" && <motion.button whileTap={{
        scale: 0.97
      }} onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-bold">
            <Plus size={14} />{"새광고만들"}</motion.button>}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[{
        label: "게재중광고",
        value: ads.filter(a => a.status === "active").length,
        icon: Megaphone,
        color: "from-violet-500 to-purple-600"
      }, {
        label: "총노출수7",
        value: ads.reduce((a, c) => a + c.impressions, 0).toLocaleString(),
        icon: Users,
        color: "from-blue-500 to-cyan-500"
      }, {
        label: "총클릭수8",
        value: ads.reduce((a, c) => a + c.clicks, 0).toLocaleString(),
        icon: MousePointer,
        color: "from-pink-500 to-rose-500"
      }, {
        label: "광고수익8",
        value: t("auto.z_tmpl_802", {
          defaultValue: t("auto.z_tmpl_1158", {
            defaultValue: t("auto.p2", { val: (ads.reduce((a, c) => a + c.budget_spent, 0) / 10000).toFixed(0) })
          })
        }),
        icon: DollarSign,
        color: "from-emerald-500 to-green-500"
      }].map(s => <div key={s.label} className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
              <s.icon size={16} className="text-white" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>)}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all
              ${tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {t.label}
          </button>)}
      </div>

      {/* ── SLOT MAP ── */}
      {tab === "slots" && <div>
          <p className="text-sm font-bold text-foreground mb-4">{"앱내광고게"}</p>
          <div className="grid grid-cols-2 gap-4">
            {slots.map(s => <motion.div key={s.id} layout className={`bg-card rounded-2xl p-5 border-2 transition-all ${s.enabled ? "border-primary/30" : "border-border opacity-60"}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${formatColor(s.format)}`}>
                        {s.format === "card" ? "카드804" : s.format === "banner" ? "배너805" : s.format === "native" ? "네이티브8" : "전면광고8"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{s.dimensions}</span>
                    </div>
                    <p className="font-extrabold text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                  </div>
                  <button onClick={() => handleToggleSlot(s.id, s.enabled)} className={`relative w-10 h-5 rounded-full transition-all shrink-0 ${s.enabled ? "bg-primary" : "bg-muted"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${s.enabled ? "right-0.5" : "left-0.5"}`} />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Smartphone size={11} className="text-muted-foreground" />
                  <span className="text-muted-foreground">{s.app_screen}</span>
                  <span className="ml-auto text-[10px] font-bold text-primary">{"최대808"}{s.max_active}{"개동시게재"}</span>
                </div>
                {/* Visual slot preview */}
                <div className={`mt-3 rounded-xl border border-dashed border-border/50 flex items-center justify-center text-[10px] text-muted-foreground font-semibold
                  ${s.format === "card" ? "h-24" : s.format === "interstitial" ? "h-32" : "h-10"}`}>
                  {s.enabled ? <span className="text-primary">{"광고게재중"}</span> : "광고없음8"}
                </div>
              </motion.div>)}
          </div>
        </div>}

      {/* ── ADS LIST ── */}
      {tab === "ads" && <div>
          <div className="flex gap-2 mb-4">
            {(["all", "active", "draft", "paused", "completed"] as const).map(f => <button key={f} onClick={() => setAdFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${adFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {f === "all" ? "전체812" : f === "active" ? "게재중81" : f === "draft" ? "초안814" : f === "paused" ? "일시정지8" : "완료816"}
              </button>)}
          </div>
          <div className="space-y-3">
            {filteredAds.map(a => {
          const ctr = a.impressions > 0 ? (a.clicks / a.impressions * 100).toFixed(1) : "0.0";
          const slot = slots.find(s => s.id === a.slot_id);
          return <motion.div key={a.id} layout className="bg-card rounded-2xl p-5 border border-border">
                  <div className="flex gap-4">
                    {a.image_url && <img src={a.image_url} className="w-20 h-16 rounded-xl object-cover shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(a.status)}`}>{statusLabel(a.status)}</span>
                        {slot && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${formatColor(slot.format)}`}>{slot.name}</span>}
                      </div>
                      <p className="font-bold text-foreground">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.advertiser} · {a.start_date} ~ {a.end_date}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{"노출817"}<b className="text-foreground">{a.impressions.toLocaleString()}</b></span>
                        <span>{"클릭818"}<b className="text-foreground">{a.clicks.toLocaleString()}</b></span>
                        <span>CTR: <b className={parseFloat(ctr) > 5 ? "text-emerald-400" : "text-foreground"}>{ctr}%</b></span>
                        <span>{"예산819"}<b className="text-foreground">₩{a.budget.toLocaleString()}</b></span>
                      </div>
                      {a.impressions > 0 && <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1 bg-muted rounded-full">
                            <div className="h-1 rounded-full bg-primary" style={{
                      width: `${Math.min(a.budget_spent / a.budget * 100, 100)}%`
                    }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{"예산820"}{Math.round(a.budget_spent / a.budget * 100)}{"소진821"}</span>
                        </div>}
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {a.status === "active" && <motion.button whileTap={{
                  scale: 0.9
                }} onClick={() => handleStatusChange(a.id, "paused")} className="p-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors" title={"일시정지8"}>
                          <Pause size={12} />
                        </motion.button>}
                      {a.status === "paused" && <motion.button whileTap={{
                  scale: 0.9
                }} onClick={() => handleStatusChange(a.id, "active")} className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title={"재게재82"}>
                          <Play size={12} />
                        </motion.button>}
                      {a.status === "draft" && <motion.button whileTap={{
                  scale: 0.9
                }} onClick={() => handleStatusChange(a.id, "active")} className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors" title={"게재시작8"}>
                          <Play size={12} />
                        </motion.button>}
                      <motion.button whileTap={{
                  scale: 0.9
                }} onClick={() => handleDeleteAd(a.id)} className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                        <Trash2 size={12} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>;
        })}
            {filteredAds.length === 0 && <div className="py-16 text-center text-sm text-muted-foreground">{"광고가없습"}<button onClick={() => setShowCreate(true)} className="text-primary font-bold">{"새광고만들"}</button></div>}
          </div>
        </div>}

      {tab === "campaigns" && <div className="space-y-3">
          {ads.map(a => {
        const ctr = a.impressions > 0 ? (a.clicks / a.impressions * 100).toFixed(1) : "0.0";
        const convRate = a.clicks > 0 ? "5.4" : "0.0";
        return <div key={a.id} className="bg-card rounded-2xl p-5 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.advertiser}{"시작일82"}{a.start_date}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${a.status === "active" ? "bg-emerald-500/10 text-emerald-400" : a.status === "draft" ? "bg-muted text-muted-foreground" : "bg-blue-500/10 text-blue-400"}`}>
                    {a.status === "active" ? "활성828" : a.status === "draft" ? "초안829" : "종료830"}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[{
              label: "도달노출8",
              value: a.impressions.toLocaleString()
            }, {
              label: "클릭832",
              value: a.clicks.toLocaleString()
            }, {
              label: "CTR",
              value: `${ctr}%`
            }, {
              label: "예측전환율",
              value: `${convRate}%`
            }].map(m => <div key={m.label} className="text-center bg-muted/50 rounded-xl py-2.5">
                      <p className="text-base font-extrabold text-foreground">{m.value}</p>
                      <p className="text-[10px] text-muted-foreground">{m.label}</p>
                    </div>)}
                </div>
                {a.impressions > 0 && <div className="mt-3 w-full bg-muted rounded-full h-1">
                    <div className="h-1 rounded-full bg-primary" style={{
              width: `${Math.min(parseFloat(ctr) * 10, 100)}%`
            }} />
                  </div>}
              </div>;
      })}
          {ads.length === 0 && <div className="py-16 text-center text-sm text-muted-foreground">{"집계된캠페"}</div>}
        </div>}

      {/* ── PROMO CODES ── */}
      {tab === "promo" && <div>
          <motion.button whileTap={{
        scale: 0.97
      }} onClick={async () => {
        const code = prompt("프로모코드");
        const disc = prompt("할인내용을");
        if (code && disc) {
          const newCode = await createPromoCode(code, disc, 100);
          if (newCode) setPromos(p => [newCode, ...p]);
        }
      }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-bold mb-4">
            <Plus size={14} />{"프로모코드"}</motion.button>
          <div className="space-y-3">
            {promos.map(p => <motion.div key={p.id} layout className={`bg-card rounded-2xl p-4 border transition-all ${p.is_active ? "border-border" : "border-border/40 opacity-60"}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Tag size={16} className="text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-extrabold text-foreground">{p.code}</code>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"}`}>{p.is_active ? "활성838" : "비활성83"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.discount}{"만료840"}{new Date(p.expires_at).toLocaleDateString()}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-muted rounded-full"><div className="h-1 rounded-full bg-primary" style={{
                    width: `${(p.used_count || 0) / p.max_limit * 100}%`
                  }} /></div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{p.used_count || 0}/{p.max_limit}{"회841"}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <motion.button whileTap={{
                scale: 0.9
              }} onClick={async () => {
                const success = await updatePromoCodeStatus(p.id, !p.is_active);
                if (success) setPromos(prev => prev.map(x => x.id === p.id ? {
                  ...x,
                  is_active: !x.is_active
                } : x));
              }} className={`p-1.5 rounded-lg ${p.is_active ? "bg-muted text-muted-foreground" : "bg-emerald-500/10 text-emerald-400"}`}><Check size={12} /></motion.button>
                    <motion.button whileTap={{
                scale: 0.9
              }} onClick={async () => {
                if (confirm("삭제하겠습")) {
                  const success = await deletePromoCode(p.id);
                  if (success) setPromos(prev => prev.filter(x => x.id !== p.id));
                }
              }} className="p-1.5 rounded-lg bg-red-500/10 text-red-400"><Trash2 size={12} /></motion.button>
                  </div>
                </div>
              </motion.div>)}
            {promos.length === 0 && <div className="py-16 text-center text-sm text-muted-foreground">{"프로모코드"}</div>}
          </div>
        </div>}

      {/* ── PUSH ── */}
      {tab === "push" && <div className="max-w-xl">
          <div className="bg-card rounded-2xl p-6 border border-border">
            <p className="font-extrabold text-foreground mb-5 flex items-center gap-2"><Bell size={16} />{"푸시알림발"}</p>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{"대상845"}</label>
                <select value={pushTarget} onChange={e => setPushTarget(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary">
                  <option>{"전체유저8"}</option><option>{"무료유저8"}</option><option>{"Plus유"}</option>
                  <option>{"비활성유저"}</option><option>{"신규가입7"}</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{"제목851"}</label>
                <input value={pushTitle} onChange={e => setPushTitle(e.target.value)} placeholder={"예봄여행시"} maxLength={50} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary" />
                <p className="text-right text-[10px] text-muted-foreground mt-1">{pushTitle.length}/50</p>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{"내용853"}</label>
                <textarea value={pushBody} onChange={e => setPushBody(e.target.value)} rows={3} placeholder={"예지금Mi"} maxLength={150} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary resize-none" />
                <p className="text-right text-[10px] text-muted-foreground mt-1">{pushBody.length}/150</p>
              </div>
            </div>
            {(pushTitle || pushBody) && <div className="bg-muted/50 rounded-2xl p-4 mb-4 border border-border">
                <p className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-wide">{"미리보기8"}</p>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0"><Bell size={14} className="text-white" /></div>
                  <div><p className="text-sm font-bold text-foreground">{pushTitle || "제목856"}</p><p className="text-xs text-muted-foreground mt-0.5">{pushBody || "내용857"}</p></div>
                </div>
              </div>}
            <AnimatePresence>
              {pushSent ? <motion.div initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} exit={{
            opacity: 0
          }} className="w-full py-3 rounded-2xl bg-emerald-500/10 text-emerald-400 text-sm font-bold text-center flex items-center justify-center gap-2">
                  <Check size={16} />{"발송완료8"}{pushTarget}{"에게전송됨"}</motion.div> : <motion.button whileTap={{
            scale: 0.97
          }} onClick={sendPush} disabled={!pushTitle || !pushBody} className="w-full py-3 rounded-2xl gradient-primary text-primary-foreground text-sm font-extrabold disabled:opacity-40 flex items-center justify-center gap-2">
                  <Send size={14} />{"푸시알림발"}</motion.button>}
            </AnimatePresence>
          </div>
        </div>}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && <CreateAdModal slots={slots.filter(s => s.enabled)} onClose={() => setShowCreate(false)} onCreate={ad => setAds(prev => [ad, ...prev])} />}
      </AnimatePresence>
    </div>;
};