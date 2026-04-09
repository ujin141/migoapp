import i18n from "@/i18n";
import { AnimatePresence, motion } from "framer-motion";
import { X, Camera, Plus, Check } from "lucide-react";
import { RefObject } from "react";
import { useTranslation } from "react-i18next";

interface EditProfileModalProps {
  showEditModal: boolean;
  setShowEditModal: (val: boolean) => void;
  MAX_PROFILE_PHOTOS: number;
  profilePhotos: { file?: File; url: string }[];
  setProfilePhotos: React.Dispatch<React.SetStateAction<{ file?: File; url: string }[]>>;
  fileRef2: RefObject<HTMLInputElement>;
  name: string;
  setName: (val: string) => void;
  location: string;
  setLocation: (val: string) => void;
  travelDates: string;
  setTravelDates: (val: string) => void;
  bio: string;
  setBio: (val: string) => void;
  travelMission: string;
  setTravelMission: (val: string) => void;
  visitedCountries: string[];
  setVisitedCountries: (val: string[]) => void;
  tags: string[];
  setTags: (val: string[]) => void;
  newTag: string;
  setNewTag: (val: string) => void;
  addTag: () => void;
  saveProfile: () => Promise<void>;
  saving: boolean;
}

export const EditProfileModal = ({
  showEditModal,
  setShowEditModal,
  MAX_PROFILE_PHOTOS,
  profilePhotos,
  setProfilePhotos,
  fileRef2,
  name,
  setName,
  location,
  setLocation,
  travelDates,
  setTravelDates,
  bio,
  setBio,
  travelMission,
  setTravelMission,
  visitedCountries,
  setVisitedCountries,
  tags,
  setTags,
  newTag,
  setNewTag,
  addTag,
  saveProfile,
  saving
}: EditProfileModalProps) => {
  const { t, i18n } = useTranslation();

  return (
    <AnimatePresence>
      {showEditModal && <motion.div className="fixed inset-0 z-50 flex items-end justify-center px-safe pb-safe pt-safe" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }}>
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 p-6 pb-20 shadow-float max-h-[85vh] overflow-y-auto" initial={{
        y: "100%"
      }} animate={{
        y: 0
      }} exit={{
        y: "100%"
      }} transition={{
        type: "spring",
        damping: 25,
        stiffness: 300
      }}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-foreground truncate">{i18n.t("profilePage.profileEdit")}</h3>
              <button onClick={() => setShowEditModal(false)}><X size={20} className="text-muted-foreground" /></button>
            </div>
            <div className="space-y-4">
              {/* 프로필 사진 최대 6장 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-foreground">{i18n.t("profilePage.profilePhoto")}</label>
                  <span className="text-[10px] text-muted-foreground">{profilePhotos.length}/{MAX_PROFILE_PHOTOS}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {profilePhotos.map((photo, idx) => <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-border">
                      <img src={photo.url} alt="" className="w-full h-full object-cover" />
                      {idx === 0 && <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">{"Main"}</div>}
                      <button onClick={() => setProfilePhotos(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                        <X size={10} className="text-white" />
                      </button>
                    </div>)}
                  {profilePhotos.length < MAX_PROFILE_PHOTOS && <button onClick={() => fileRef2.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 bg-muted">
                      <Camera size={18} className="text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{"Add Photo"}</span>
                    </button>}
                </div>
                <input ref={fileRef2} type="file" accept="image/*" multiple className="hidden" onChange={e => {
              const files = Array.from(e.target.files || []);
              const remaining = MAX_PROFILE_PHOTOS - profilePhotos.length;
              const toAdd = files.slice(0, remaining).map(f => ({
                file: f,
                url: URL.createObjectURL(f)
              }));
              setProfilePhotos(prev => [...prev, ...toAdd]);
              e.target.value = "";
            }} />
                <p className="text-[10px] text-muted-foreground truncate">{i18n.t("profilePage.photoHint")}</p>
              </div>
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">{i18n.t("profilePage.labelName")}</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">{i18n.t("profilePage.labelLocation")}</label>
                <input value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">{i18n.t("profilePage.labelDates")}</label>
                <input value={travelDates} onChange={e => setTravelDates(e.target.value)} placeholder={i18n.t("profile.datePlaceholder")} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">{i18n.t("profilePage.labelBio")}</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm outline-none resize-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-bold text-foreground mb-2 flex items-center gap-1">
                  🎯 {i18n.t("여행미션", {
                defaultValue: i18n.t("auto.x4093")
              })}
                </label>
                <input value={travelMission} onChange={e => setTravelMission(e.target.value)} placeholder={i18n.t("미션플레이", {
              defaultValue: i18n.t("auto.x4094")
            })} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="truncate">
                <label className="text-sm font-bold text-foreground mb-2 flex items-center gap-1">
                  🛂 {i18n.t("여권", {
                defaultValue: i18n.t("auto.x4095")
              })}
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {visitedCountries.map((flag: string) => <span key={flag} className="flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {flag}
                      <button onClick={() => setVisitedCountries(visitedCountries.filter(f => f !== flag))}><X size={10} /></button>
                    </span>)}
                </div>
                {visitedCountries.length < 20 && <select value="" onChange={e => {
              const flag = e.target.value;
              if (flag && !visitedCountries.includes(flag)) {
                setVisitedCountries([...visitedCountries, flag]);
              }
            }} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">+ {i18n.t("국가선택", {
                  defaultValue: i18n.t("auto.x4096")
                })}</option>
                    {['🇰🇷', '🇯🇵', '🇺🇸', '🇨🇳', '🇹🇼', '🇹🇭', '🇻🇳', '🇫🇷', '🇬🇧', '🇮🇹', '🇪🇸', '🇩🇪', '🇦🇺', '🇨🇦', '🇵🇭', '🇲🇾', '🇮🇩', '🇸🇬', '🇨🇭', '🇳🇿', '🇮🇳', '🇷🇺', '🇧🇷', '🇲🇽', '🇹🇷'].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>}
              </div>
              <div className="truncate">
                <label className="text-sm font-bold text-foreground mb-2 block">{"Travel Style Tags"}</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(tag => <span key={tag} className="flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {tag}
                      <button onClick={() => setTags(tags.filter(t => t !== tag))}><X size={10} /></button>
                    </span>)}
                </div>
                {tags.length < 8 && <div className="flex gap-2">
                    <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) addTag(); }} placeholder={i18n.t("profilePage.tagPlaceholder")} className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm outline-none" />
                    <button onClick={addTag} className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
                      <Plus size={14} className="text-primary-foreground" />
                    </button>
                  </div>}
              </div>
              <button onClick={saveProfile} disabled={saving} className="w-full py-3.5 rounded-2xl gradient-primary text-primary-foreground font-semibold text-sm shadow-card flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Check size={16} /> {"Save"}</>}
              </button>
            </div>
          </motion.div>
        </motion.div>}
    </AnimatePresence>
  );
};
