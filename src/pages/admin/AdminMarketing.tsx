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
const statusLabel = (s: AdStatus) => s === "active" ? i18n.t("auto.g_1106", "게재중") : s === "draft" ? i18n.t("auto.g_1107", "초안") : s === "paused" ? i18n.t("auto.g_1108", "일시정지7") : i18n.t("auto.g_1109", "완료");

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
          <p className="text-xs text-muted-foreground truncate">{i18n.t("auto.g_1110", "업로드중7")}</p>
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
            <Upload size={10} />{i18n.t("auto.g_1111", "교체")}</button>
        </> : <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <ImageIcon size={28} />
          <p className="text-xs font-semibold truncate">{i18n.t("auto.g_1112", "이미지를드")}</p>
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
    cta_text: i18n.t("auto.g_1113", "자세히보기"),
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
  const steps = [i18n.t("auto.g_1114", "광고슬롯선"), i18n.t("auto.g_1115", "광고소재7"), i18n.t("auto.g_1116", "타겟팅예산")];
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
            <h2 className="font-extrabold text-foreground truncate">{i18n.t("auto.g_1117", "새광고만들")}</h2>
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
              <p className="text-sm font-bold text-foreground mb-4 truncate">{i18n.t("auto.g_1118", "광고를어디")}</p>
              <div className="grid grid-cols-2 gap-3 truncate">
                {slots.filter(s => s.enabled).map(s => <button key={s.id} onClick={() => setForm(f => ({
              ...f,
              slot_id: s.id
            }))} className={`text-left p-4 rounded-2xl border-2 transition-all ${form.slot_id === s.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${formatColor(s.format)}`}>
                        {s.format === "card" ? i18n.t("auto.g_1119", "카드") : s.format === "banner" ? i18n.t("auto.g_1120", "배너") : s.format === "native" ? i18n.t("auto.g_1121", "네이티브7") : i18n.t("auto.g_1122", "전면")}
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
          {step === 1 && <div className="space-y-4 truncate">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{i18n.t("auto.g_1123", "광고제목7")}</label>
                  <input value={form.title} onChange={e => setForm(f => ({
                ...f,
                title: e.target.value
              }))} placeholder={i18n.t("auto.g_1124", "예에어아시")} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{i18n.t("auto.g_1125", "광고주")}</label>
                  <input value={form.advertiser} onChange={e => setForm(f => ({
                ...f,
                advertiser: e.target.value
              }))} placeholder={i18n.t("auto.g_1126", "예AirA")} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{i18n.t("auto.g_1127", "광고이미지")}</label>
                <ImageUpload value={imageUrl} onChange={setImageUrl} />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{i18n.t("auto.g_1128", "헤드라인7")}</label>
                <input value={form.headline} onChange={e => setForm(f => ({
              ...f,
              headline: e.target.value
            }))} placeholder={i18n.t("auto.g_1129", "예서울방콕")} maxLength={60} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{i18n.t("auto.g_1130", "광고문구7")}</label>
                <textarea value={form.body_text} onChange={e => setForm(f => ({
              ...f,
              body_text: e.target.value
            }))} rows={2} placeholder={i18n.t("auto.g_1131", "예봄시즌특")} maxLength={120} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary transition-colors resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{i18n.t("auto.g_1132", "CTA링크")}</label>
                  <input value={form.cta_url} onChange={e => setForm(f => ({
                ...f,
                cta_url: e.target.value
              }))} placeholder="https://..." className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{i18n.t("auto.g_1133", "버튼텍스트")}</label>
                  <input value={form.cta_text} onChange={e => setForm(f => ({
                ...f,
                cta_text: e.target.value
              }))} placeholder={i18n.t("auto.g_1134", "자세히보기")} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary transition-colors" />
                </div>
              </div>

              {/* Ad Preview */}
              {(form.headline || imageUrl) && selectedSlot && <div className="bg-muted/50 rounded-2xl p-4 border border-border truncate">
                  <p className="text-[10px] font-bold text-muted-foreground mb-3 uppercase tracking-wide truncate">{i18n.t("auto.g_1135", "미리보기7")}{selectedSlot.format})</p>
                  {selectedSlot.format === "banner" ? <div className="w-full h-14 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-border flex items-center px-3 gap-3 overflow-hidden">
                      {imageUrl && <img src={imageUrl} className="h-10 w-10 rounded-lg object-cover shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{form.headline || i18n.t("auto.g_1136", "헤드라인7")}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{form.advertiser}</p>
                      </div>
                      <span className="text-[10px] font-bold text-primary whitespace-nowrap shrink-0">{form.cta_text}</span>
                    </div> : selectedSlot.format === "card" ? <div className="w-48 mx-auto rounded-2xl overflow-hidden border border-border bg-card shadow-card">
                      {imageUrl ? <img src={imageUrl} className="w-full h-32 object-cover" /> : <div className="w-full h-32 bg-muted flex items-center justify-center"><ImageIcon size={20} className="text-muted-foreground" /></div>}
                      <div className="p-3">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase truncate">{i18n.t("auto.g_1137", "광고")}</span>
                        <p className="text-xs font-bold text-foreground mt-0.5 truncate">{form.headline || i18n.t("auto.g_1138", "헤드라인7")}</p>
                        <button className="mt-2 w-full py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold">{form.cta_text}</button>
                      </div>
                    </div> : <div className="flex gap-3 items-start">
                      {imageUrl && <img src={imageUrl} className="w-20 h-16 rounded-xl object-cover shrink-0" />}
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase truncate">{i18n.t("auto.g_1139", "광고")}</span>
                        <p className="text-sm font-bold text-foreground truncate">{form.headline || i18n.t("auto.g_1140", "헤드라인7")}</p>
                        <p className="text-xs text-muted-foreground">{form.body_text}</p>
                        <span className="text-xs text-primary font-bold mt-1 block">{form.cta_text} →</span>
                      </div>
                    </div>}
                </div>}
            </div>}

          {/* Step 2: Targeting + Budget */}
          {step === 2 && <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-2 block">{i18n.t("auto.g_1141", "타겟성별7")}</label>
                <div className="flex gap-2 truncate">
                  {[["all", i18n.t("auto.g_1142", "전체")], ["male", i18n.t("auto.g_1143", "남성")], ["female", i18n.t("auto.g_1144", "여성")]].map(([val, label]) => <button key={val} onClick={() => setForm(f => ({
                ...f,
                target_gender: val
              }))} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all border ${form.target_gender === val ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                      {label}
                    </button>)}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-2 block">{i18n.t("auto.g_1145", "타겟연령7")}{form.target_age_min}{i18n.t("auto.g_1146", "세")}{form.target_age_max}{i18n.t("auto.g_1147", "세")}</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1 truncate">{i18n.t("auto.g_1148", "최소연령7")}</p>
                    <input type="range" min={18} max={60} value={form.target_age_min} onChange={e => setForm(f => ({
                  ...f,
                  target_age_min: Number(e.target.value)
                }))} className="w-full accent-violet-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1 truncate">{i18n.t("auto.g_1149", "최대연령7")}</p>
                    <input type="range" min={20} max={65} value={form.target_age_max} onChange={e => setForm(f => ({
                  ...f,
                  target_age_max: Number(e.target.value)
                }))} className="w-full accent-violet-500" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{i18n.t("auto.g_1150", "시작일")}</label>
                  <input type="date" value={form.start_date} onChange={e => setForm(f => ({
                ...f,
                start_date: e.target.value
              }))} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{i18n.t("auto.g_1151", "종료일")}</label>
                  <input type="date" value={form.end_date} onChange={e => setForm(f => ({
                ...f,
                end_date: e.target.value
              }))} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{i18n.t("auto.g_1152", "총예산")}</label>
                <input type="number" value={form.budget} step={100000} onChange={e => setForm(f => ({
              ...f,
              budget: Number(e.target.value)
            }))} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary" />
                <p className="text-[10px] text-muted-foreground mt-1 truncate">{i18n.t("auto.g_1153", "일예산")}{Math.round(form.budget / Math.max(1, Math.ceil((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / 86400000))).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{i18n.t("auto.g_1154", "게재상태7")}</label>
                <select value={form.status} onChange={e => setForm(f => ({
              ...f,
              status: e.target.value as AdStatus
            }))} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary">
                  <option value="draft">{i18n.t("auto.g_1155", "초안으로저")}</option>
                  <option value="active">{i18n.t("auto.g_1156", "즉시게재7")}</option>
                </select>
              </div>
            </div>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between truncate">
          <button onClick={() => step > 0 ? setStep(s => s - 1) : onClose()} className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
            {step === 0 ? i18n.t("auto.g_1157", "취소") : i18n.t("auto.g_1158", "이전")}
          </button>
          {step < 2 ? <motion.button whileTap={{
          scale: 0.97
        }} onClick={() => setStep(s => s + 1)} disabled={step === 1 && (!form.title || !form.advertiser)} className="px-5 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-extrabold disabled:opacity-40">{i18n.t("auto.g_1159", "다음")}</motion.button> : <motion.button whileTap={{
          scale: 0.97
        }} onClick={handleCreate} disabled={saving || !form.cta_url} className="px-5 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-extrabold disabled:opacity-40 flex items-center gap-2">
              {saving ? <><div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />{i18n.t("auto.g_1160", "저장중")}</> : i18n.t("auto.g_1161", "광고만들기")}
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
  const [pushTarget, setPushTarget] = useState(t("auto.g_1162", "전체유저7"));
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
    label: t("auto.g_1163", "광고게재위")
  }, {
    id: "ads",
    label: t("auto.t5003", { v0: ads.length
    })
  }, {
    id: "campaigns",
    label: t("auto.g_1164", "캠페인분석")
  }, {
    id: "promo",
    label: t("auto.g_1165", "프로모코드")
  }, {
    id: "push",
    label: t("auto.g_1166", "푸시알림7")
  }];
  return <div className="truncate">
      <div className="flex items-center justify-between mb-6 truncate">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground truncate">{t("auto.g_1167", "마케팅")}</h1>
          <p className="text-sm text-muted-foreground truncate">{t("auto.g_1168", "광고게재위")}</p>
        </div>
        {tab === "ads" && <motion.button whileTap={{
        scale: 0.97
      }} onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-bold">
            <Plus size={14} />{t("auto.g_1169", "새광고만들")}</motion.button>}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4 mb-6 truncate">
        {[{
        label: t("auto.g_1170", "게재중광고"),
        value: ads.filter(a => a.status === "active").length,
        icon: Megaphone,
        color: "from-violet-500 to-purple-600"
      }, {
        label: t("auto.g_1171", "총노출수7"),
        value: ads.reduce((a, c) => a + c.impressions, 0).toLocaleString(),
        icon: Users,
        color: "from-blue-500 to-cyan-500"
      }, {
        label: t("auto.g_1172", "총클릭수8"),
        value: ads.reduce((a, c) => a + c.clicks, 0).toLocaleString(),
        icon: MousePointer,
        color: "from-pink-500 to-rose-500"
      }, {
        label: t("auto.g_1173", "광고수익8"),
        value: t("auto.p2", { val: (ads.reduce((a, c) => a + c.budget_spent, 0) / 10000).toFixed(0)
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
          <p className="text-sm font-bold text-foreground mb-4 truncate">{t("auto.g_1174", "앱내광고게")}</p>
          <div className="grid grid-cols-2 gap-4 truncate">
            {slots.map(s => <motion.div key={s.id} layout className={`bg-card rounded-2xl p-5 border-2 transition-all ${s.enabled ? "border-primary/30" : "border-border opacity-60"}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${formatColor(s.format)}`}>
                        {s.format === "card" ? t("auto.g_1175", "카드") : s.format === "banner" ? t("auto.g_1176", "배너") : s.format === "native" ? t("auto.g_1177", "네이티브8") : t("auto.g_1178", "전면광고8")}
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
                  <span className="ml-auto text-[10px] font-bold text-primary truncate">{t("auto.g_1179", "최대")}{s.max_active}{t("auto.g_1180", "개동시게재")}</span>
                </div>
                {/* Visual slot preview */}
                <div className={`mt-3 rounded-xl border border-dashed border-border/50 flex items-center justify-center text-[10px] text-muted-foreground font-semibold
                  ${s.format === "card" ? "h-24" : s.format === "interstitial" ? "h-32" : "h-10"}`}>
                  {s.enabled ? <span className="text-primary truncate">{t("auto.g_1181", "광고게재중")}</span> : t("auto.g_1182", "광고없음8")}
                </div>
              </motion.div>)}
          </div>
        </div>}

      {/* ── ADS LIST ── */}
      {tab === "ads" && <div>
          <div className="flex gap-2 mb-4 truncate">
            {(["all", "active", "draft", "paused", "completed"] as const).map(f => <button key={f} onClick={() => setAdFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${adFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {f === "all" ? t("auto.g_1183", "전체") : f === "active" ? t("auto.g_1184", "게재중") : f === "draft" ? t("auto.g_1185", "초안") : f === "paused" ? t("auto.g_1186", "일시정지8") : t("auto.g_1187", "완료")}
              </button>)}
          </div>
          <div className="space-y-3 truncate">
            {filteredAds.map(a => {
          const ctr = a.impressions > 0 ? (a.clicks / a.impressions * 100).toFixed(1) : "0.0";
          const slot = slots.find(s => s.id === a.slot_id);
          return <motion.div key={a.id} layout className="bg-card rounded-2xl p-5 border border-border">
                  <div className="flex gap-4">
                    {a.image_url && <img src={a.image_url} className="w-20 h-16 rounded-xl object-cover shrink-0" />}
                    <div className="flex-1 min-w-0 truncate">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(a.status)}`}>{statusLabel(a.status)}</span>
                        {slot && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${formatColor(slot.format)}`}>{slot.name}</span>}
                      </div>
                      <p className="font-bold text-foreground">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.advertiser} · {a.start_date} ~ {a.end_date}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="truncate">{t("auto.g_1188", "노출")}<b className="text-foreground">{a.impressions.toLocaleString()}</b></span>
                        <span className="truncate">{t("auto.g_1189", "클릭")}<b className="text-foreground">{a.clicks.toLocaleString()}</b></span>
                        <span>CTR: <b className={parseFloat(ctr) > 5 ? "text-emerald-400" : "text-foreground"}>{ctr}%</b></span>
                        <span className="truncate">{t("auto.g_1190", "예산")}<b className="text-foreground">₩{a.budget.toLocaleString()}</b></span>
                      </div>
                      {a.impressions > 0 && <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1 bg-muted rounded-full">
                            <div className="h-1 rounded-full bg-primary" style={{
                      width: `${Math.min(a.budget_spent / a.budget * 100, 100)}%`
                    }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground truncate">{t("auto.g_1191", "예산")}{Math.round(a.budget_spent / a.budget * 100)}{t("auto.g_1192", "소진")}</span>
                        </div>}
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0 truncate">
                      {a.status === "active" && <motion.button whileTap={{
                  scale: 0.9
                }} onClick={() => handleStatusChange(a.id, "paused")} className="p-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors" title={t("auto.g_1193", "일시정지8")}>
                          <Pause size={12} />
                        </motion.button>}
                      {a.status === "paused" && <motion.button whileTap={{
                  scale: 0.9
                }} onClick={() => handleStatusChange(a.id, "active")} className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title={t("auto.g_1194", "재게재")}>
                          <Play size={12} />
                        </motion.button>}
                      {a.status === "draft" && <motion.button whileTap={{
                  scale: 0.9
                }} onClick={() => handleStatusChange(a.id, "active")} className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors" title={t("auto.g_1195", "게재시작8")}>
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
            {filteredAds.length === 0 && <div className="py-16 text-center text-sm text-muted-foreground truncate">{t("auto.g_1196", "광고가없습")}<button onClick={() => setShowCreate(true)} className="text-primary font-bold">{t("auto.g_1197", "새광고만들")}</button></div>}
          </div>
        </div>}

      {tab === "campaigns" && <div className="space-y-3 truncate">
          {ads.map(a => {
        const ctr = a.impressions > 0 ? (a.clicks / a.impressions * 100).toFixed(1) : "0.0";
        const convRate = a.clicks > 0 ? "5.4" : "0.0";
        return <div key={a.id} className="bg-card rounded-2xl p-5 border border-border truncate">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.advertiser}{t("auto.g_1198", "시작일")}{a.start_date}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${a.status === "active" ? "bg-emerald-500/10 text-emerald-400" : a.status === "draft" ? "bg-muted text-muted-foreground" : "bg-blue-500/10 text-blue-400"}`}>
                    {a.status === "active" ? t("auto.g_1199", "활성") : a.status === "draft" ? t("auto.g_1200", "초안") : t("auto.g_1201", "종료")}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-3 truncate">
                  {[{
              label: t("auto.g_1202", "도달노출8"),
              value: a.impressions.toLocaleString()
            }, {
              label: t("auto.g_1203", "클릭"),
              value: a.clicks.toLocaleString()
            }, {
              label: "CTR",
              value: `${ctr}%`
            }, {
              label: t("auto.g_1204", "예측전환율"),
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
          {ads.length === 0 && <div className="py-16 text-center text-sm text-muted-foreground truncate">{t("auto.g_1205", "집계된캠페")}</div>}
        </div>}

      {/* ── PROMO CODES ── */}
      {tab === "promo" && <div>
          <motion.button whileTap={{
        scale: 0.97
      }} onClick={async () => {
        const code = prompt(t("auto.g_1206", "프로모코드"));
        const disc = prompt(t("auto.g_1207", "할인내용을"));
        if (code && disc) {
          const newCode = await createPromoCode(code, disc, 100);
          if (newCode) setPromos(p => [newCode, ...p]);
        }
      }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-bold mb-4">
            <Plus size={14} />{t("auto.g_1208", "프로모코드")}</motion.button>
          <div className="space-y-3 truncate">
            {promos.map(p => <motion.div key={p.id} layout className={`bg-card rounded-2xl p-4 border transition-all ${p.is_active ? "border-border" : "border-border/40 opacity-60"}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Tag size={16} className="text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-extrabold text-foreground">{p.code}</code>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"}`}>{p.is_active ? t("auto.g_1209", "활성") : t("auto.g_1210", "비활성")}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.discount}{t("auto.g_1211", "만료")}{new Date(p.expires_at).toLocaleDateString()}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-muted rounded-full"><div className="h-1 rounded-full bg-primary" style={{
                    width: `${(p.used_count || 0) / p.max_limit * 100}%`
                  }} /></div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap truncate">{p.used_count || 0}/{p.max_limit}{t("auto.g_1212", "회")}</span>
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
                if (confirm(t("auto.g_1213", "삭제하겠습"))) {
                  const success = await deletePromoCode(p.id);
                  if (success) setPromos(prev => prev.filter(x => x.id !== p.id));
                }
              }} className="p-1.5 rounded-lg bg-red-500/10 text-red-400"><Trash2 size={12} /></motion.button>
                  </div>
                </div>
              </motion.div>)}
            {promos.length === 0 && <div className="py-16 text-center text-sm text-muted-foreground truncate">{t("auto.g_1214", "프로모코드")}</div>}
          </div>
        </div>}

      {/* ── PUSH ── */}
      {tab === "push" && <div className="max-w-xl">
          <div className="bg-card rounded-2xl p-6 border border-border truncate">
            <p className="font-extrabold text-foreground mb-5 flex items-center gap-2 truncate"><Bell size={16} />{t("auto.g_1215", "푸시알림발")}</p>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t("auto.g_1216", "대상")}</label>
                <select value={pushTarget} onChange={e => setPushTarget(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary">
                  <option>{t("auto.g_1217", "전체유저8")}</option><option>{t("auto.g_1218", "무료유저8")}</option><option>{t("auto.g_1219", "Plus유")}</option>
                  <option>{t("auto.g_1220", "비활성유저")}</option><option>{t("auto.g_1221", "신규가입7")}</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t("auto.g_1222", "제목")}</label>
                <input value={pushTitle} onChange={e => setPushTitle(e.target.value)} placeholder={t("auto.g_1223", "예봄여행시")} maxLength={50} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary" />
                <p className="text-right text-[10px] text-muted-foreground mt-1">{pushTitle.length}/50</p>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t("auto.g_1224", "내용")}</label>
                <textarea value={pushBody} onChange={e => setPushBody(e.target.value)} rows={3} placeholder={t("auto.g_1225", "예지금Mi")} maxLength={150} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary resize-none" />
                <p className="text-right text-[10px] text-muted-foreground mt-1">{pushBody.length}/150</p>
              </div>
            </div>
            {(pushTitle || pushBody) && <div className="bg-muted/50 rounded-2xl p-4 mb-4 border border-border">
                <p className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-wide truncate">{t("auto.g_1226", "미리보기8")}</p>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0"><Bell size={14} className="text-white" /></div>
                  <div><p className="text-sm font-bold text-foreground truncate">{pushTitle || t("auto.g_1227", "제목")}</p><p className="text-xs text-muted-foreground mt-0.5 truncate">{pushBody || t("auto.g_1228", "내용")}</p></div>
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
                  <Check size={16} />{t("auto.g_1229", "발송완료8")}{pushTarget}{t("auto.g_1230", "에게전송됨")}</motion.div> : <motion.button whileTap={{
            scale: 0.97
          }} onClick={sendPush} disabled={!pushTitle || !pushBody} className="w-full py-3 rounded-2xl gradient-primary text-primary-foreground text-sm font-extrabold disabled:opacity-40 flex items-center justify-center gap-2">
                  <Send size={14} />{t("auto.g_1231", "푸시알림발")}</motion.button>}
            </AnimatePresence>
          </div>
        </div>}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && <CreateAdModal slots={slots.filter(s => s.enabled)} onClose={() => setShowCreate(false)} onCreate={ad => setAds(prev => [ad, ...prev])} />}
      </AnimatePresence>
    </div>;
};