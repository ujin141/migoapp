import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, Lock, Zap } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/context/SubscriptionContext";
interface Viewer {
  id: string;
  name: string;
  photo_url: string;
  created_at: string;
}
export default function ProfileViewsModal({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    t
  } = useTranslation();
  const {
    user
  } = useAuth();
  const {
    isPlus,
    upgradePlus
  } = useSubscription();
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!isOpen || !user) return;
    const fetchViewers = async () => {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from("profile_views").select(`
          created_at,
          profiles!viewer_id (id, name, photo_url)
        `).eq("viewed_id", user.id).order("created_at", {
        ascending: false
      }).limit(20);
      if (!error && data) {
        setViewers(data.map((item: any) => ({
          id: item.profiles.id,
          name: item.profiles.name,
          photo_url: item.profiles.photo_url,
          created_at: item.created_at
        })));
      }
      setLoading(false);
    };
    fetchViewers();
  }, [isOpen, user]);
  if (!isOpen) return null;
  return <AnimatePresence>
      <motion.div className="fixed inset-0 z-[60] flex items-end justify-center px-safe pb-safe pt-safe" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }}>
        <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 shadow-float max-h-[80vh] overflow-y-auto" initial={{
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
          <div className="px-5 pt-4 pb-20">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-primary" />
                <h3 className="text-lg font-extrabold text-foreground">{"나를확인한"}</h3>
              </div>
              <button onClick={onClose}>
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              {loading ? <p className="text-center text-muted-foreground py-10">{"불러오는중"}</p> : viewers.length === 0 ? <div className="text-center py-10 text-muted-foreground">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-3">
                    <Eye size={24} className="opacity-50" />
                  </div>
                  <p className="font-semibold">{t("profileViews.empty")}</p>
                </div> : <div className="grid grid-cols-2 gap-3 relative">
                  {viewers.map((v, i) => <div key={i} className="relative rounded-2xl overflow-hidden aspect-w-3 aspect-h-4 shadow-sm">
                      <img src={v.photo_url || ""} alt="" className={`w-full h-full object-cover transition-all ${!isPlus ? "blur-xl scale-110 grayscale" : ""}`} onError={e => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=" + (v.name ? v.name[0] : "?");
                }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-3">
                        {isPlus ? <>
                            <p className="text-white font-bold text-sm">{v.name || "비공개프로"}</p>
                            <p className="text-white/70 text-xs text-nowrap">
                              {new Intl.DateTimeFormat("ko-KR", {
                        month: "short",
                        day: "numeric"
                      }).format(new Date(v.created_at))}{" "}{"방문103"}</p>
                          </> : <div className="flex items-center gap-1 justify-center mb-1">
                            <Lock size={14} className="text-white" />
                            <span className="text-white font-bold text-xs">{"누군가날봤"}</span>
                          </div>}
                      </div>
                    </div>)}

                  {/* 미구독자 Migo Plus 결제 유도 오버레이 */}
                  {!isPlus && <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                        <Zap size={28} className="text-primary fill-primary" />
                      </div>
                      <h3 className="text-xl font-extrabold text-foreground mb-2">{"MigoP"}</h3>
                      <p className="text-sm text-muted-foreground mb-6">{"누가나를클"}</p>
                      <button onClick={upgradePlus} className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-2xl shadow-primaryButton">{"1일무료체"}</button>
                    </div>}
                </div>}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>;
}