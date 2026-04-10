import i18n from "@/i18n";
import { AnimatePresence, motion } from "framer-motion";
import { X, MapPin, Calendar, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TravelerSheetProps {
  profileDetail: any | null;
  setProfileDetail: (profile: any | null) => void;
  translatedBio: string | null;
  setTranslatedBio: (bio: string | null) => void;
  handleTranslateBio: (e: any) => void;
  isTranslating: boolean;
  liked: string[];
  handleLike: (id: string, name: string) => void;
}

export const TravelerSheet = ({
  profileDetail,
  setProfileDetail,
  translatedBio,
  setTranslatedBio,
  handleTranslateBio,
  isTranslating,
  liked,
  handleLike
}: TravelerSheetProps) => {
  const { t, i18n } = useTranslation();

  return (
    <AnimatePresence>
      {profileDetail && <motion.div className="fixed inset-0 z-[60] flex items-end justify-center px-safe pb-safe pt-safe" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }}>
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => {
            setTranslatedBio(null);
            setProfileDetail(null);
          }} />
          <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl shadow-float overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 80px)', marginBottom: '80px' }} initial={{
        y: "100%"
      }} animate={{
        y: 0
      }} exit={{
        y: "100%"
      }} transition={{
        type: "spring",
        damping: 26,
        stiffness: 300
      }}>
            {/* Hero photo */}
            <div className="relative h-52 w-full">
            {profileDetail.photo ? <img src={profileDetail.photo} alt={profileDetail.name} className="w-full h-full object-cover" onError={e => {
            (e.target as HTMLImageElement).style.display = 'none';
          }} /> : <div className="w-full h-full gradient-primary flex items-center justify-center">
                <span className="text-white text-5xl font-black">{profileDetail.name?.[0] ?? "?"}</span>
              </div>}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
              <button onClick={() => {
                setTranslatedBio(null);
                setProfileDetail(null);
              }} className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-card/80 backdrop-blur-sm flex items-center justify-center shadow-card">
                <X size={16} className="text-foreground" />
              </button>
              {/* Name overlay */}
              <div className="absolute bottom-4 left-5">
                <h2 className="text-xl font-extrabold text-foreground">
                  {profileDetail.name}, {profileDetail.age}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <MapPin size={12} className="text-primary" />
                  <span className="text-xs text-muted-foreground">{profileDetail.location}</span>
                  <span className="text-xs text-muted-foreground ml-1">· {profileDetail.distance}</span>
                </div>
              </div>
            </div>

            {/* Content - scrollable */}
            <div className="px-5 pt-4 pb-8 space-y-4 overflow-y-auto flex-1">
              {/* Bio */}
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                <p className="text-sm text-muted-foreground leading-relaxed break-words whitespace-pre-wrap break-all md:break-normal">{translatedBio || profileDetail.bio}</p>
                
                {profileDetail.bio && (
                  <button 
                    onClick={handleTranslateBio}
                    className={`mt-2 flex items-center gap-1.5 text-xs font-bold transition-colors ${translatedBio ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <span className={isTranslating ? "animate-pulse" : ""}>
                       🌍 {isTranslating ? i18n.t("auto.z_번역중_000", { defaultValue: "번역 중..." }) : translatedBio ? i18n.t("auto.z_원문보기_001", { defaultValue: "원문 보기" }) : i18n.t("auto.z_번역보기_002", { defaultValue: "번역 보기" })}
                    </span>
                  </button>
                )}
              </div>

              {/* Travel info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-2xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MapPin size={13} className="text-primary" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide truncate">{i18n.t("map.destination")}</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{profileDetail.destination}</p>
                </div>
                <div className="bg-muted rounded-2xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar size={13} className="text-primary" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide truncate">{i18n.t("map.schedule")}</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{profileDetail.dates}</p>
                </div>
              </div>

              {/* Tags */}
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-2 truncate">{i18n.t("map.travelStyle")}</p>
                <div className="flex flex-wrap gap-2">
                  {profileDetail.tags.map((tag: string) => <span key={tag} className="px-3 py-1.5 rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {tag}
                    </span>)}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-1">
                <button onClick={() => handleLike(profileDetail.id, profileDetail.name)} className={`flex-1 py-3.5 rounded-2xl border-2 flex items-center justify-center gap-2 text-sm font-bold shadow-card transition-all ${liked.includes(profileDetail.id) ? "gradient-primary text-primary-foreground border-transparent" : "bg-card border-border text-foreground hover:border-primary/50"}`}>
                  <Heart size={18} fill={liked.includes(profileDetail.id) ? "currentColor" : "none"} className={liked.includes(profileDetail.id) ? "text-white" : "text-primary"} />
                  {liked.includes(profileDetail.id) ? i18n.t("map.cancelLike") : i18n.t("map.like")}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>}
    </AnimatePresence>
  );
};
