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
  country: "일본422",
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
  name: "치앙마이4",
  country: "Thailand",
  emoji: "🇹🇭"
}];
const travelStyles = ["카페424", "야시장42", "트레킹42", "서핑427", "사진428", "음식429", "건축430", "자연431", "예술432", "쇼핑433", "역사434", "모험435"];
const CreateTripPage = () => {
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
        title: t("createTrip.requiredFields"),
        description: t("createTrip.requiredDesc"),
        variant: "destructive"
      });
      return;
    }
    if (!user) {
      toast({
        title: t("alert.t31Title"),
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
        status: visibility === "public" ? "active" : "invite",
        cover_image: coverImageUrl,
        is_premium: isPremiumGroup
      });
      if (error) {
        toast({
          title: t("alert.t32Title")
        });
        return;
      }
      toast({
        title: t("alert.t33Title"),
        description: t("alert.t33Desc")
      });
      navigate("/discover");
    } catch (err) {
      toast({
        title: t("alert.t34Title")
      });
    } finally {
      setLoading(false);
    }
  };
  const isValid = title.trim() && destination.trim() && startDate && endDate;
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-base font-bold text-foreground">{"여행만들기"}</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Free & Plus can see it, Premium can toggle Premium Feature */}
          <div className="px-5 py-5 space-y-6 pb-32">
            {/* Cover Image */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">{"배경사진8"}<span className="text-muted-foreground font-normal text-xs">{"선택842"}</span></label>
              <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-muted flex items-center justify-center cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 transition-colors" onClick={() => coverInputRef.current?.click()}>
                {coverPreview ? <>
                    <img src={coverPreview} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Image size={24} className="text-white" />
                    </div>
                  </> : <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Image size={28} />
                    <span className="text-xs font-medium">{"사진추가8"}</span>
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
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">{"여행제목4"}</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={"예치앙마이"} maxLength={50} className="w-full bg-muted rounded-2xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-shadow" />
              <span className="text-[10px] text-muted-foreground">{title.length}/50</span>
            </div>

            {/* Destination */}
            <div className="space-y-2 relative">
              <label className="text-sm font-bold text-foreground">{"여행지역4"}</label>
              <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3.5 cursor-text" onClick={() => setShowDestinations(true)}>
                <MapPin size={16} className="text-primary shrink-0" />
                <input type="text" value={destination} onChange={e => {
              setDestination(e.target.value);
              setShowDestinations(true);
            }} onFocus={() => setShowDestinations(true)} placeholder={"도시또는지"} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                {destination && <button onClick={e => {
              e.stopPropagation();
              setDestination("");
            }}>
                    <X size={14} className="text-muted-foreground" />
                  </button>}
              </div>

              {showDestinations && !destination && <div className="bg-card rounded-2xl shadow-float border border-border p-3 space-y-1 animate-slide-up">
                  <p className="text-[10px] font-semibold text-muted-foreground px-2 pb-1">{"인기여행지"}</p>
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
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">{"여행날짜4"}</label>
              <div className="grid grid-cols-2 gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn("flex items-center gap-2 bg-muted rounded-2xl px-4 py-3.5 text-sm transition-shadow focus:ring-2 focus:ring-primary/30", !startDate && "text-muted-foreground")}>
                      <Calendar size={14} className="text-primary shrink-0" />
                      {startDate ? format(startDate, "M월d일4", {
                    locale: ko
                  }) : "출발일44"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} disabled={date => date < new Date()} className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn("flex items-center gap-2 bg-muted rounded-2xl px-4 py-3.5 text-sm transition-shadow focus:ring-2 focus:ring-primary/30", !endDate && "text-muted-foreground")}>
                      <Calendar size={14} className="text-primary shrink-0" />
                      {endDate ? format(endDate, "M월d일4", {
                    locale: ko
                  }) : "도착일45"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent mode="single" selected={endDate} onSelect={setEndDate} disabled={date => date < (startDate || new Date())} className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">{"설명451"}</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={"어떤여행인"} maxLength={300} rows={4} className="w-full bg-muted rounded-2xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:ring-2 focus:ring-primary/30 transition-shadow leading-relaxed" />
              <span className="text-[10px] text-muted-foreground">{description.length}/300</span>
            </div>

            {/* Travel Style Tags */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">{"여행스타일"}<span className="text-muted-foreground font-normal text-xs">{"최대5개4"}</span></label>
              <div className="flex flex-wrap gap-2">
                {travelStyles.map(tag => <button key={tag} onClick={() => toggleTag(tag)} className={cn("px-3.5 py-2 rounded-full text-xs font-semibold transition-all", selectedTags.includes(tag) ? "gradient-primary text-primary-foreground shadow-card" : "bg-muted text-muted-foreground hover:bg-border")}>
                    {tag}
                  </button>)}
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">{"상세일정4"}<span className="text-muted-foreground font-normal text-xs">{"선택최대1"}</span></label>
              <div className="space-y-3">
                {schedule.map((item, index) => <div key={`schedule-${index}-${item.substring(0, 8)}`} className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-muted-foreground">{index + 1}</span>
                    </div>
                    <input type="text" value={item} onChange={e => {
                const newSchedule = [...schedule];
                newSchedule[index] = e.target.value;
                setSchedule(newSchedule);
              }} placeholder={i18n.t("auto.z_tmpl_457", {
                defaultValue: i18n.t("auto.z_tmpl_860", {
                  defaultValue: t("auto.p14", {
                    day: index + 1
                  })
                })
              })} className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-shadow" />
                    <button onClick={() => setSchedule(schedule.filter((_, i) => i !== index))} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors shrink-0">
                      <X size={16} />
                    </button>
                  </div>)}
                {schedule.length < 10 && <button onClick={() => setSchedule([...schedule, ""])} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-primary/20 bg-primary/5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
                    <Plus size={16} />
                    {schedule.length === 0 ? "첫번째일정" : "일정추가4"}
                  </button>}
                
                {/* AI 자동 생성 (Premium 전용) */}
                <button onClick={() => {
              if (!canUnlimitedAITrip) {
                setShowPlusModal(true);
              } else {
                toast({
                  title: i18n.t("auto.z_AI\uC77C\uC815\uC0DD\uC131\uC911_763"),
                  description: i18n.t("auto.z_AI\uAC00\uCD5C\uC801\uC758\uC5EC\uD589\uCF54\uC2A4_764")
                });
                setTimeout(() => setSchedule([i18n.t("auto.z_\uB3C4\uCC29\uBC0F\uCCB4\uD06C\uC778_765"), i18n.t("auto.z_\uD604\uC9C0\uB9DB\uC9D1\uD0D0\uBC29_766"), i18n.t("auto.z_\uC57C\uACBD\uAC10\uC0C1_767")]), 1500);
              }
            }} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-sm font-extrabold text-amber-600 hover:bg-amber-500/20 transition-colors shadow-sm mt-2">
                  <Zap size={16} className="fill-amber-500" />{t("auto.z_AI\uC5EC\uD589\uC77C\uC815\uC790\uB3D9\uC0DD\uC131_768")}{!canUnlimitedAITrip && <Crown size={12} className="ml-1 opacity-70" />}
                </button>
              </div>
            </div>

            {/* Max Members & N-Pay */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">{"최대인원4"}</label>
              <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3">
                <Users size={16} className="text-primary" />
                <div className="flex items-center gap-4 flex-1">
                  {[2, 3, 4, 5, 6, 8].map(n => <button key={n} onClick={() => setMaxMembers(n)} className={cn("w-9 h-9 rounded-xl text-sm font-bold transition-all", maxMembers === n ? "gradient-primary text-primary-foreground shadow-card" : "text-muted-foreground hover:bg-border")}>
                      {n}
                    </button>)}
                </div>
                <span className="text-xs text-muted-foreground">{"명461"}</span>
              </div>
            </div>

            {/* Estimated Total Cost (N-Pay Calculator) */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">{t("auto.x4008")}<span className="text-xs font-normal text-muted-foreground">{t("auto.x4009")}</span></label>
              <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3 border border-transparent focus-within:border-primary/50 transition-colors">
                <span className="text-muted-foreground font-bold">₩</span>
                <input type="number" min={0} value={estimatedCost || ''} onChange={e => setEstimatedCost(Number(e.target.value))} placeholder={t("auto.x4011")} className="flex-1 bg-transparent text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground placeholder:font-normal" />
              </div>
              {estimatedCost > 0 && <div className="mt-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-rose-500 uppercase tracking-widest"><Zap size={10} className="inline mr-1" />{t("auto.x4010")}</span>
                  <span className="text-sm font-black text-rose-600">{getLocalizedPrice(Math.round(estimatedCost / maxMembers), i18n.language)}</span>
                </div>}
            </div>

            {/* Visibility */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">{"공개방식4"}</label>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setVisibility("public")} className={cn("flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all", visibility === "public" ? "border-primary bg-primary/5 shadow-card" : "border-border bg-card hover:border-muted-foreground/30")}>
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", visibility === "public" ? "gradient-primary" : "bg-muted")}>
                    <Globe size={20} className={visibility === "public" ? "text-primary-foreground" : "text-muted-foreground"} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-foreground">{"공개463"}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{"누구나참여"}</p>
                  </div>
                </button>

                <button onClick={() => setVisibility("invite")} className={cn("flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all", visibility === "invite" ? "border-primary bg-primary/5 shadow-card" : "border-border bg-card hover:border-muted-foreground/30")}>
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", visibility === "invite" ? "gradient-primary" : "bg-muted")}>
                    <Lock size={20} className={visibility === "invite" ? "text-primary-foreground" : "text-muted-foreground"} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-foreground">{"초대전용4"}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{"승인후참여"}</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Premium Group Toggle */}
            <div className="mt-4 p-4 rounded-2xl border-2 border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-orange-500/5 flex items-center justify-between">
              <div>
                <p className="text-sm font-extrabold flex items-center gap-1.5 text-foreground">
                  <Crown size={16} className="text-amber-500" />
                  프리미엄 그룹 설정
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  최상단 노출 및 Premium 회원 전용 모집
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
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-card/80 backdrop-blur-xl border-t border-border">
            <div className="max-w-lg mx-auto px-5 py-4">
              <button onClick={handleSubmit} disabled={!isValid || loading} className={cn("w-full py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2", isValid && !loading ? "gradient-primary text-primary-foreground shadow-float active:scale-[0.98]" : "bg-muted text-muted-foreground cursor-not-allowed")}>
                {loading ? <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />{"생성중46"}</> : "여행그룹만"}
              </button>
            </div>
            <div className="h-[env(safe-area-inset-bottom)]" />
          </div>
          <MigoPlusModal isOpen={showPlusModal} onClose={() => setShowPlusModal(false)} defaultPlan="premium" />
    </div>;
};
export default CreateTripPage;