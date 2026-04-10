import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { getLocalizedPrice } from "@/lib/pricing";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Users, Globe, Lock, Plus, X, ChevronDown, Image, Crown, Zap } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { useSubscription } from "@/context/SubscriptionContext";
import MigoPlusModal from "@/components/MigoPlusModal";
import { compressImage } from "@/lib/imageCompression";
const popularDestinations = [{
  name: "Bangkok",
  country: "Thailand",
  emoji: "🇹🇭"
}, {
  name: "Bali",
  country: "Indonesia",
  emoji: "🇮🇩"
}, {
  name: "Tokyo",
  country: i18n.t("auto.g_0630", "일본"),
  emoji: "🇯🇵"
}, {
  name: "Barcelona",
  country: "Spain",
  emoji: "🇪🇸"
}, {
  name: "Hanoi",
  country: "Vietnam",
  emoji: "🇻🇳"
}, {
  name: i18n.t("auto.g_0631", "치앙마이4"),
  country: "Thailand",
  emoji: "🇹🇭"
}];
const TRAVEL_STYLES = [
  { id: i18n.t("auto.x4000", "카페"), i18nKey: "auto.g_0632" },
  { id: i18n.t("auto.x4001", "야시장"), i18nKey: "auto.g_0633" },
  { id: i18n.t("auto.x4002", "트레킹"), i18nKey: "auto.g_0634" },
  { id: i18n.t("auto.x4003", "서핑"), i18nKey: "auto.g_0635" },
  { id: i18n.t("auto.x4004", "사진"), i18nKey: "auto.g_0636" },
  { id: i18n.t("auto.x4005", "음식"), i18nKey: "auto.g_0637" },
  { id: i18n.t("auto.x4006", "건축"), i18nKey: "auto.g_0638" },
  { id: i18n.t("auto.x4007", "자연"), i18nKey: "auto.g_0639" },
  { id: i18n.t("auto.x4008", "예술"), i18nKey: "auto.g_0640" },
  { id: i18n.t("auto.x4009", "쇼핑"), i18nKey: "auto.g_0641" },
  { id: i18n.t("auto.x4010", "역사"), i18nKey: "auto.g_0642" },
  { id: i18n.t("auto.x4011", "모험"), i18nKey: "auto.g_0643" }
];

interface CreateTripPageProps {
  onClose?: () => void;
}

const CreateTripPage = ({ onClose }: CreateTripPageProps) => {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    isPlus,
    isPremium,
    canUnlimitedAITrip
  } = useSubscription();
  const [isPremiumGroup, setIsPremiumGroup] = useState(false);
  const [showPlusModal, setShowPlusModal] = useState(false);
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [showDestinations, setShowDestinations] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [description, setDescription] = useState("");
  const [maxMembers, setMaxMembers] = useState(4);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [visibility, setVisibility] = useState<"public" | "invite">("public");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : prev.length < 5 ? [...prev, tag] : prev);
  };
  const handleSubmit = async () => {
    if (!title.trim() || !destination.trim() || !startDate || !endDate) {
      toast({
        title: i18n.t("createTrip.requiredFields"),
        description: i18n.t("createTrip.requiredDesc"),
        variant: "destructive"
      });
      return;
    }
    if (!user) {
      toast({
        title: i18n.t("alert.t31Title"),
        variant: "destructive"
      });
      return;
    }
    if (loading) return; // 중복 제출 방지
    setLoading(true);
    try {
      // 커버 이미지 업로드
      let coverImageUrl: string | null = null;
      if (coverImage) {
        const compressedFile = await compressImage(coverImage);
        const ext = compressedFile.name.split(".").pop() || "jpg";
        const filePath = `trip_covers/${user.id}_${Date.now()}.${ext}`;
        const {
          error: upErr
        } = await supabase.storage.from("avatars").upload(filePath, compressedFile, {
          upsert: true,
          contentType: compressedFile.type
        });
        if (!upErr) {
          const {
            data: urlData
          } = supabase.storage.from("avatars").getPublicUrl(filePath);
          coverImageUrl = urlData.publicUrl;
        }
      }
      const {
        error
      } = await supabase.from('trip_groups').insert({
        title: title.trim(),
        destination: destination.trim(),
        dates: `${format(startDate, "yyyy-MM-dd")} ~ ${format(endDate, "yyyy-MM-dd")}`,
        description: description.trim() || null,
        host_id: user.id,
        max_members: maxMembers,
        entry_fee: estimatedCost,
        tags: selectedTags.length > 0 ? selectedTags : null,
        schedule: schedule.filter(s => s.trim().length > 0),
        status: visibility === "public" ? "recruiting" : "invite",
        cover_image: coverImageUrl,
        is_premium: isPremiumGroup
      });
      if (error) {
        toast({
          title: i18n.t("alert.t32Title")
        });
        return;
      }
      toast({
        title: i18n.t("alert.t33Title"),
        description: i18n.t("alert.t33Desc")
      });
      if (onClose) onClose();
      else navigate(-1);
    } catch (err) {
      toast({
        title: i18n.t("alert.t34Title")
      });
    } finally {
      setLoading(false);
    }
  };
  const isValid = title.trim() && destination.trim() && startDate && endDate;
  return <div className="h-[100dvh] w-full bg-background flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="shrink-0 z-20 bg-card/95 backdrop-blur-xl border-b border-border/40">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => onClose ? onClose() : navigate(-1)} className="w-10 h-10 rounded-full hover:bg-muted focus:bg-muted flex items-center justify-center transition-colors">
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] text-primary font-extrabold uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full truncate">{t("auto.g_0627", "여행 모집")}</span>
            </div>
            <h1 className="text-lg font-black text-foreground truncate">{t("createTrip.title")}</h1>
          </div>
          <div className="w-10" />
        </div>
      </header>

      {/* Free & Plus can see it, Premium can toggle Premium Feature */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 pb-32">
            {/* Cover Image */}
            <div className="space-y-3">
              <label className="text-[13px] font-extrabold text-foreground ml-1 flex items-center gap-2">
                📸 {t("createTrip.coverImage")}
                <span className="text-muted-foreground font-medium text-[11px] bg-muted px-1.5 py-0.5 rounded-md truncate">{t("createTrip.optional")}</span>
              </label>
              <div className="relative w-full h-48 rounded-[24px] overflow-hidden bg-muted/50 flex items-center justify-center cursor-pointer border-2 border-dashed border-border hover:border-primary/40 transition-colors truncate" onClick={() => coverInputRef.current?.click()}>
                {coverPreview ? <>
                    <img src={coverPreview} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Image size={28} className="text-white mb-2" />
                      <span className="text-white text-xs font-bold truncate">{t("auto.g_0628", "이미지 변경")}</span>
                    </div>
                  </> : <div className="flex flex-col items-center gap-3 text-muted-foreground/60">
                    <div className="w-14 h-14 rounded-full bg-card shadow-sm flex items-center justify-center border border-border/50">
                      <Image size={24} className="text-muted-foreground" />
                    </div>
                    <span className="text-[13px] font-bold text-muted-foreground truncate">{t("auto.g_0629", "터치하여 배경 사진 추가")}</span>
                  </div>}
              </div>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
            const file = e.target.files?.[0];
            if (file) {
              setCoverImage(file);
              setCoverPreview(URL.createObjectURL(file));
            }
            e.target.value = "";
          }} />
            </div>

            {/* Title */}
            <div className="space-y-3">
              <label className="text-[13px] font-extrabold text-foreground ml-1">✏️ {t("createTrip.tripTitle")}</label>
              <div className="relative">
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t("createTrip.titlePlaceholder")} maxLength={50} className="w-full bg-muted/40 rounded-2xl px-5 py-4 text-[15px] font-bold text-foreground placeholder:text-muted-foreground/50 border border-transparent focus:bg-card focus:border-primary/30 outline-none focus:ring-4 focus:ring-primary/5 transition-all" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted-foreground/50">{title.length}/50</span>
              </div>
            </div>

            {/* Destination */}
            <div className="space-y-3 relative truncate">
              <label className="text-[13px] font-extrabold text-foreground ml-1">📍 {t("createTrip.destination")}</label>
              <div className="flex items-center gap-3 bg-muted/40 border border-transparent focus-within:bg-card focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/5 rounded-2xl px-5 py-4 cursor-text transition-all" onClick={() => setShowDestinations(true)}>
                <MapPin size={20} className="text-primary shrink-0" />
                <input type="text" value={destination} onChange={e => {
              setDestination(e.target.value);
              setShowDestinations(true);
            }} onFocus={() => setShowDestinations(true)} placeholder={t("createTrip.destPlaceholder")} className="flex-1 bg-transparent text-[15px] font-bold text-foreground placeholder:text-muted-foreground/50 outline-none" />
                {destination && <button onClick={e => {
              e.stopPropagation();
              setDestination("");
            }} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20">
                    <X size={12} className="text-muted-foreground" />
                  </button>}
              </div>

              {showDestinations && !destination && <div className="bg-card rounded-2xl shadow-float border border-border p-3 space-y-1 animate-slide-up truncate">
                  <p className="text-[10px] font-semibold text-muted-foreground px-2 pb-1 truncate">{t("createTrip.popularDest")}</p>
                  {popularDestinations.map(d => <button key={d.name} onClick={() => {
              setDestination(`${d.name}, ${d.country}`);
              setShowDestinations(false);
            }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-muted">
                      <span className="text-lg">{d.emoji}</span>
                      <div className="text-left">
                        <span className="text-sm font-semibold text-foreground">{d.name}</span>
                        <span className="text-xs text-muted-foreground ml-1.5">{d.country}</span>
                      </div>
                    </button>)}
                </div>}
            </div>

            {/* Dates */}
            <div className="space-y-3">
              <label className="text-[13px] font-extrabold text-foreground ml-1">📅 {t("createTrip.dates")}</label>
              <div className="grid grid-cols-2 gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn("flex items-center justify-center gap-2 bg-muted/40 rounded-2xl px-4 py-4 text-[14px] font-bold transition-all border border-transparent focus:ring-4 focus:ring-primary/5 focus:border-primary/30", !startDate ? "text-muted-foreground/50" : "text-foreground bg-primary/5 border-primary/20")}>
                      <Calendar size={18} className={startDate ? "text-primary" : "text-muted-foreground/50"} />
                      {startDate ? format(startDate, "M/d") : t("createTrip.startDate")}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} disabled={date => date < new Date()} className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn("flex items-center justify-center gap-2 bg-muted/40 rounded-2xl px-4 py-4 text-[14px] font-bold transition-all border border-transparent focus:ring-4 focus:ring-primary/5 focus:border-primary/30", !endDate ? "text-muted-foreground/50" : "text-foreground bg-primary/5 border-primary/20")}>
                      <Calendar size={18} className={endDate ? "text-primary" : "text-muted-foreground/50"} />
                      {endDate ? format(endDate, "M/d") : t("createTrip.endDate")}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent mode="single" selected={endDate} onSelect={setEndDate} disabled={date => date < (startDate || new Date())} className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label className="text-[13px] font-extrabold text-foreground ml-1">📝 {t("createTrip.description")}</label>
              <div className="relative">
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t("createTrip.descPlaceholder")} maxLength={300} rows={5} className="w-full bg-muted/40 rounded-3xl px-6 py-5 text-[14px] font-medium text-foreground placeholder:text-muted-foreground/50 outline-none resize-none border border-transparent focus:bg-card focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all leading-relaxed" />
                <span className="absolute right-5 bottom-4 text-[11px] font-bold text-muted-foreground/50">{description.length}/300</span>
              </div>
            </div>

            {/* Travel Style Tags */}
            <div className="space-y-3">
              <label className="text-[13px] font-extrabold text-foreground ml-1 flex items-center gap-2">
                ✨ {t("createTrip.travelStyle")}
                <span className="text-muted-foreground font-medium text-[11px] bg-muted px-1.5 py-0.5 rounded-md truncate">{t("createTrip.max5")}</span>
              </label>
              <div className="flex flex-wrap gap-2.5 truncate">
                {TRAVEL_STYLES.map(tag => <button key={tag.i18nKey} onClick={() => toggleTag(tag.id)} className={cn("px-4 py-2.5 rounded-2xl text-[13px] font-extrabold transition-all border", selectedTags.includes(tag.id) ? "gradient-primary border-transparent text-primary-foreground shadow-[0_4px_12px_rgba(45,212,191,0.25)] scale-105" : "bg-card border-border/60 text-muted-foreground hover:bg-muted hover:border-primary/30 hover:text-foreground")}>
                    #{t(tag.i18nKey, tag.id)}
                  </button>)}
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-3">
              <label className="text-[13px] font-extrabold text-foreground ml-1 flex items-center gap-2">
                📋 {t("createTrip.schedule")}
                <span className="text-muted-foreground font-medium text-[11px] bg-muted px-1.5 py-0.5 rounded-md truncate">{t("createTrip.optionalMax10")}</span>
              </label>
              <div className="space-y-3 truncate">
                {schedule.map((item, index) => <div key={`schedule-${index}-${item.substring(0, 8)}`} className="flex items-center gap-3 group">
                    <div className="w-8 h-8 rounded-full gradient-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
                      <span className="text-[12px] font-black">{index + 1}</span>
                    </div>
                    <input type="text" value={item} onChange={e => {
                const newSchedule = [...schedule];
                newSchedule[index] = e.target.value;
                setSchedule(newSchedule);
              }} placeholder={t("createTrip.scheduleDayPlaceholder", { day: index + 1 })} className="flex-1 bg-muted/40 border border-transparent focus:bg-card focus:border-primary/30 rounded-2xl px-5 py-4 text-[14px] font-bold text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-4 focus:ring-primary/5 transition-all" />
                    <button onClick={() => setSchedule(schedule.filter((_, i) => i !== index))} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:bg-rose-500 hover:text-white rounded-full transition-colors shrink-0">
                      <X size={16} />
                    </button>
                  </div>)}
                {schedule.length < 10 && <button onClick={() => setSchedule([...schedule, ""])} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 text-[14px] font-extrabold text-primary hover:bg-primary/10 hover:border-primary/40 transition-all">
                    <Plus size={18} />
                    {schedule.length === 0 ? t("createTrip.firstSchedule") : t("createTrip.addSchedule")}
                  </button>}
                
                <button onClick={() => {
              if (!canUnlimitedAITrip) {
                setShowPlusModal(true);
              } else {
                toast({
                  title: i18n.t("auto.z_AI\uC77C\uC815\uC0DD\uC131\uC911_763", "AI\uC77C\uC815\uC0DD\uC131\uC911"),
                  description: i18n.t("auto.z_AI\uAC00\uCD5C\uC801\uC758\uC5EC\uD589\uCF54\uC2A4_764", "AI\uAC00\uCD5C\uC801\uC758\uC5EC\uD589\uCF54\uC2A4")
                });
                setTimeout(() => setSchedule([i18n.t("auto.z_\uB3C4\uCC29\uBC0F\uCCB4\uD06C\uC778_765", "\uB3C4\uCC29\uBC0F\uCCB4\uD06C\uC778"), i18n.t("auto.z_\uD604\uC9C0\uB9DB\uC9D1\uD0D0\uBC29_766", "\uD604\uC9C0\uB9DB\uC9D1\uD0D0\uBC29"), i18n.t("auto.z_\uC57C\uACBD\uAC10\uC0C1_767", "\uC57C\uACBD\uAC10\uC0C1")]), 1500);
              }
            }} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-2 border-amber-500/20 text-[14px] font-black text-amber-600 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all shadow-sm mt-3">
                  <Zap size={18} className="fill-amber-500" />{t("auto.z_AI\uC5EC\uD589\uC77C\uC815\uC790\uB3D9\uC0DD\uC131_768", "AI\uC5EC\uD589\uC77C\uC815\uC790\uB3D9\uC0DD\uC131")}{!canUnlimitedAITrip && <Crown size={14} className="ml-1 opacity-70" />}
                </button>
              </div>
            </div>

            {/* Max Members & N-Pay */}
            <div className="space-y-3">
              <label className="text-[13px] font-extrabold text-foreground ml-1">👥 {t("createTrip.maxMembers")}</label>
              <div className="flex items-center gap-3 bg-muted/40 border border-transparent rounded-2xl px-5 py-4">
                <Users size={18} className="text-primary" />
                <div className="flex items-center gap-3 flex-1 flex-wrap">
                  {[2, 3, 4, 5, 6, 8].map(n => <button key={n} onClick={() => setMaxMembers(n)} className={cn("w-10 h-10 rounded-[14px] text-[14px] font-black transition-all", maxMembers === n ? "gradient-primary text-primary-foreground shadow-[0_4px_12px_rgba(45,212,191,0.25)] scale-110" : "bg-card border border-border/60 text-muted-foreground hover:border-primary/30")}>
                      {n}
                    </button>)}
                </div>
                <span className="text-xs text-muted-foreground truncate">{t("createTrip.peopleCount")}</span>
              </div>
            </div>

            {/* Estimated Total Cost (N-Pay Calculator) */}
            <div className="space-y-2 truncate">
              <label className="text-sm font-bold text-foreground">{t("auto.x4008")}<span className="text-xs font-normal text-muted-foreground truncate">{t("auto.x4009")}</span></label>
              <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3 border border-transparent focus-within:border-primary/50 transition-colors">
                <span className="text-muted-foreground font-bold">₩</span>
                <input type="number" min={0} value={estimatedCost || ''} onChange={e => setEstimatedCost(Number(e.target.value))} placeholder={t("auto.x4011")} className="flex-1 bg-transparent text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground placeholder:font-normal" />
              </div>
              {estimatedCost > 0 && <div className="mt-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-rose-500 uppercase tracking-widest truncate"><Zap size={10} className="inline mr-1" />{t("auto.x4010")}</span>
                  <span className="text-sm font-black text-rose-600">{getLocalizedPrice(Math.round(estimatedCost / maxMembers), i18n.language)}</span>
                </div>}
            </div>

            {/* Visibility */}
            <div className="space-y-3">
              <label className="text-[13px] font-extrabold text-foreground ml-1">🔒 {t("createTrip.visibility")}</label>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setVisibility("public")} className={cn("flex flex-col items-center gap-3 p-5 rounded-[24px] border-2 transition-all", visibility === "public" ? "border-primary bg-primary/5 shadow-[0_4px_12px_rgba(45,212,191,0.1)]" : "border-border/60 bg-card hover:border-primary/30")}>
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", visibility === "public" ? "gradient-primary shadow-sm" : "bg-muted text-muted-foreground")}>
                    <Globe size={22} className={visibility === "public" ? "text-primary-foreground" : ""} />
                  </div>
                  <div className="text-center">
                    <p className="text-[15px] font-black text-foreground truncate">{t("createTrip.public")}</p>
                    <p className="text-[11px] font-medium text-muted-foreground/80 mt-1 truncate">{t("createTrip.anyoneCanJoin")}</p>
                  </div>
                </button>

                <button onClick={() => setVisibility("invite")} className={cn("flex flex-col items-center gap-3 p-5 rounded-[24px] border-2 transition-all", visibility === "invite" ? "border-primary bg-primary/5 shadow-[0_4px_12px_rgba(45,212,191,0.1)]" : "border-border/60 bg-card hover:border-primary/30")}>
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", visibility === "invite" ? "gradient-primary shadow-sm" : "bg-muted text-muted-foreground")}>
                    <Lock size={22} className={visibility === "invite" ? "text-primary-foreground" : ""} />
                  </div>
                  <div className="text-center">
                    <p className="text-[15px] font-black text-foreground truncate">{t("createTrip.inviteOnly")}</p>
                    <p className="text-[11px] font-medium text-muted-foreground/80 mt-1 truncate">{t("createTrip.joinAfterApproval")}</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Premium Group Toggle */}
            <div className="mt-6 p-5 rounded-[24px] border-2 border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-orange-500/5 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-sm font-extrabold flex items-center gap-1.5 text-foreground truncate">
                  <Crown size={16} className="text-amber-500" />
                  {t("createTrip.premiumGroupTitle")}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  {t("createTrip.premiumGroupDesc")}
                </p>
              </div>
              <button
                onClick={() => {
                  if (!isPremium) {
                    setShowPlusModal(true);
                  } else {
                    setIsPremiumGroup(p => !p);
                  }
                }}
                className={cn("relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2", isPremiumGroup ? "bg-amber-500" : "bg-muted")}
              >
                <span className={cn("pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out", isPremiumGroup ? "translate-x-5" : "translate-x-0")} />
              </button>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="absolute bottom-0 left-0 right-0 z-30 bg-card/90 backdrop-blur-xl border-t border-border/40 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
            <div className="max-w-lg mx-auto px-5 py-4">
              <button 
                onClick={handleSubmit} 
                disabled={!isValid || loading} 
                className={cn("w-full py-4 rounded-2xl text-[15px] font-extrabold transition-all flex items-center justify-center gap-2", 
                  isValid && !loading 
                    ? "gradient-primary text-primary-foreground shadow-[0_8px_20px_rgba(45,212,191,0.25)] active:scale-95" 
                    : "bg-muted text-muted-foreground/50 border border-border/60 cursor-not-allowed")}
              >
                {loading ? <>
                    <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />{t("createTrip.creating")}</> : t("auto.g_0644", "여행 글 등록하기")}
              </button>
            </div>
            <div className="h-[env(safe-area-inset-bottom)]" />
          </div>
          <MigoPlusModal isOpen={showPlusModal} onClose={() => setShowPlusModal(false)} defaultPlan="premium" />
    </div>;
};
export default CreateTripPage;