import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin, Users, Zap, RefreshCw, Navigation, Plane, Coffee, Camera } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import ProfileDetailSheet from "@/components/ProfileDetailSheet";
import { toast } from "@/hooks/use-toast";
import useGeoDistance from "@/hooks/useGeoDistance";
import { useSubscription } from "@/context/SubscriptionContext";
import MigoPlusModal from "@/components/MigoPlusModal";
import { Lock } from "lucide-react";
interface NearbyProfile {
  id: string;
  name: string;
  age?: number;
  photo?: string;
  location?: string;
  travelPurpose?: string;
  tags?: string[];
  distance_km?: number;
  online_at?: string;
  bio?: string;
  nationality?: string;
  trust_score?: number;
  verified?: boolean;
  user_type?: string;
}
const NearbyPage = () => {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    myPos
  } = useGeoDistance();
  const { isPlus } = useSubscription();
  const [showPlusModal, setShowPlusModal] = useState(false);

  // t()가 필요하므로 컴포넌트 내부에 정의
  const PURPOSE_ICONS: Record<string, React.ReactNode> = {
    [i18n.t("auto.x4047")]: <Coffee size={12} />,
    [i18n.t("auto.x4048")]: <Camera size={12} />,
    [i18n.t("auto.x4049")]: <Plane size={12} />,
    [i18n.t("auto.x4050")]: <Users size={12} />
  };

  const [profiles, setProfiles] = useState<NearbyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<NearbyProfile | null>(null);
  const [filterPurpose, setFilterPurpose] = useState<string>("all");
  const [myCity] = useState(i18n.t("auto.x4083"));
  const PURPOSES = ["all", i18n.t("auto.x4084"), i18n.t("auto.x4085"), i18n.t("auto.x4086"), i18n.t("auto.x4087")];

  // Update online_status heartbeat
  useEffect(() => {
    if (!user || !myPos) return;
    const upsertOnline = async () => {
      await supabase.from("online_status").upsert({
        user_id: user.id,
        is_online: true,
        last_seen: new Date().toISOString(),
        lat: myPos.lat,
        lng: myPos.lng
      }, {
        onConflict: "user_id"
      });
    };
    upsertOnline();
    const heartbeat = setInterval(upsertOnline, 60000);
    return () => {
      clearInterval(heartbeat);
      supabase.from("online_status").update({
        is_online: false
      }).eq("user_id", user.id);
    };
  }, [user, myPos]);
  const loadNearby = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);else setLoading(true);
    try {
      if (myPos) {
        const {
          data,
          error
        } = await supabase.from("profiles").select("id,name,age,photo_url,location,user_type,interests,bio,nationality,trust_score,verified,lat,lng").neq("id", user?.id ?? "").limit(200);
        
        if (!error && data) {
          const { data: onlineData } = await supabase.from("online_status").select("user_id, is_online, last_seen");
          const onlineMap = new Map(onlineData?.map(o => [o.user_id, o]) || []);

          const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
            const R = 6371;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLng = (lng2 - lng1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          };

          const nearbyUsers = data
            .map((p: any) => {
              const dist = p.lat && p.lng ? haversine(myPos.lat, myPos.lng, p.lat, p.lng) : null;
              return { ...p, distance_km: dist };
            })
            .filter((p: any) => p.distance_km !== null && p.distance_km <= 5)
            .sort((a, b) => a.distance_km! - b.distance_km!);

          const uniqueUsers = Array.from(new Map(nearbyUsers.map((p: any) => [p.id, p])).values());

          if (uniqueUsers.length > 0) {
            const mapped: NearbyProfile[] = uniqueUsers.map((r: any) => {
              const os = onlineMap.get(r.id);
              return {
                id: r.id,
                name: r.name,
                age: r.age,
                photo: r.photo_url,
                location: r.location,
                travelPurpose: r.user_type === "local" ? t("auto.x4088") : t("auto.x4089"),
                tags: r.interests ?? [],
                distance_km: r.distance_km,
                bio: r.bio,
                nationality: r.nationality,
                trust_score: r.trust_score,
                verified: r.verified,
                user_type: r.user_type,
                online_at: (os as any)?.last_seen
              };
            });
            setProfiles(mapped);
          } else {
            setProfiles([]);
          }
          localStorage.setItem('migo_nearby_seen', '1');
        } else {
          setProfiles([]);
          localStorage.setItem('migo_nearby_seen', '1');
        }
      } else {
        setProfiles([]);
      }
    } catch (e) {
      console.error(e);
      setProfiles([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    loadNearby();
  }, [myPos]);
  const filtered = filterPurpose === "all" ? profiles : profiles.filter(p => p.travelPurpose === filterPurpose);
  const formatDistance = (km?: number) => {
    if (!km) return "";
    if (km < 1) return t("auto.p30", {
      dist: Math.round(km * 1000)
    });
    return `${km.toFixed(1)}km`;
  };
  return <div className="flex flex-col min-h-screen bg-background safe-bottom truncate">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 pt-safe pb-2">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <Navigation size={14} className="text-primary" />
              <h1 className="text-base font-extrabold truncate">{t("auto.x4040")}</h1>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground truncate">{t("auto.p31", {
              city: myCity
            })}</p>
          </div>
          <button onClick={() => loadNearby(true)} className={`ml-auto w-9 h-9 rounded-full bg-muted flex items-center justify-center ${refreshing ? "animate-spin" : ""}`}>
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Purpose Filter */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 px-1 mt-1 no-scrollbar truncate">
          {PURPOSES.map(p => <button key={p} onClick={() => setFilterPurpose(p)} className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-extrabold transition-all shadow-sm ${filterPurpose === p ? "gradient-primary text-white shadow-md scale-105" : "bg-white dark:bg-card text-muted-foreground border border-border hover:bg-muted"}`}>
              {p === "all" ? t("auto.x4090") : p}
            </button>)}
        </div>
      </header>

      {/* Live Count Banner */}
      <div className="mx-4 mt-5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-[1.25rem] px-4 py-3.5 flex items-center gap-3.5 shadow-sm backdrop-blur-sm relative overflow-hidden">
        {/* Highlight splash background effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
        
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md">
          <Users size={20} className="text-white" />
        </div>
        <div className="z-10">
          <p className="text-[15px] font-extrabold text-foreground tracking-tight truncate">{t("auto.z_\uC9C0\uAE08_135", "\uC9C0\uAE08")}{myCity}{t("auto.z_\uC5D0_136", "\uC5D0")}<span className="text-emerald-500 font-black ml-1 truncate">{profiles.length}{t("auto.z_\uBA85_137", "\uBA85")}</span>{t("auto.x4041")}
          </p>
          <p className="text-[12px] font-medium text-muted-foreground flex items-center gap-1 mt-0.5 truncate"><span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" /> {t("auto.x4042")}</p>
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        <AnimatePresence>
          {loading ? Array.from({
          length: 4
        }).map((_, i) => <div key={i} className="aspect-[3/4] rounded-3xl bg-muted animate-pulse" />) : filtered.map((p, i) => <motion.div key={p.id} initial={{
          opacity: 0,
          scale: 0.95
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          delay: i * 0.05,
          duration: 0.3
        }} onClick={() => {
              if (!isPlus) setShowPlusModal(true);else setSelectedProfile(p);
            }} whileTap={{
          scale: 0.96
        }} className="relative rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-black/5 dark:border-white/10 cursor-pointer aspect-[3/4] bg-card">
              
              {/* Photo */}
              {p.photo ? <img src={p.photo} alt={p.name} className={`w-full h-full object-cover transition-all duration-500 hover:scale-105 ${!isPlus ? "blur-xl scale-125 opacity-80" : ""}`} /> : <div className={`w-full h-full bg-gradient-to-br from-primary/80 to-secondary/80 flex items-center justify-center transition-all ${!isPlus ? "blur-xl opacity-80" : ""}`}>
                  <span className="text-6xl font-black text-white/30">{p.name[0]}</span>
                </div>}
              
              {/* Gradient Overlays */}
              <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

              {/* Lock overlay for non-plus */}
              {!isPlus && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md text-white gap-2 z-10">
                   <Lock size={32} className="opacity-90 drop-shadow-lg" />
                   <span className="text-[11px] font-extrabold bg-primary text-primary-foreground px-3.5 py-1.5 rounded-full shadow-lg tracking-wide truncate">
                     {t("auto.g_0781", "Plus 전용")}</span>
                </div>}

              {/* Local badge */}
              {p.user_type === "local" && <div className="absolute top-3 left-3 bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-extrabold px-2 py-1 rounded-full shadow-sm z-10 truncate">
                  {t("auto.x4043")}
                </div>}

              {/* Online indicator */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-2 py-1 shadow-md border border-white/10 z-10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse border border-emerald-200/50" />
                <span className="text-[9px] text-white font-bold tracking-wider truncate">{t("auto.x4044")}</span>
              </div>

              {/* Info Overlay */}
              <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-1.5 z-10">
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-white font-extrabold text-[17px] leading-tight drop-shadow-md truncate">
                    {!isPlus ? t("map.genderUnknown") : p.name}
                    <span className="font-semibold text-[13px] text-white/80 ml-1.5">
                      {!isPlus ? "??" : p.nationality}
                    </span>
                  </h3>
                  <div className="flex items-center gap-1 text-emerald-300 font-bold text-[11px] drop-shadow-md mt-0.5">
                    <MapPin size={10} />
                    <span className="truncate">{!isPlus ? t("auto.g_0782", "? km 내외") : formatDistance(p.distance_km)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                  {p.travelPurpose && <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-white/20 backdrop-blur-md text-[10px] font-bold text-white border border-white/20 shadow-sm">
                      {PURPOSE_ICONS[p.travelPurpose]}
                      <span>{p.travelPurpose}</span>
                    </div>}
                  {(p.tags ?? []).slice(0, 1).map(tag => <span key={tag} className="px-1.5 py-0.5 rounded-lg bg-black/40 backdrop-blur-md text-[10px] font-bold text-white/90 border border-white/10 shadow-sm">
                      #{tag}
                    </span>)}
                </div>
              </div>
            </motion.div>)}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {!loading && filtered.length === 0 && <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <MapPin size={48} className="text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-semibold truncate">{t("auto.x4045")}</p>
          <p className="text-xs text-muted-foreground mt-1 truncate">{t("auto.x4046")}</p>
        </div>}

      {/* Profile Detail */}
      {selectedProfile && <ProfileDetailSheet profile={selectedProfile as any} onClose={() => setSelectedProfile(null)} showActions={true} onLike={() => {
      toast({
        title: t("auto.x4091"),
        description: t("auto.t5034", {
          v0: selectedProfile.name
        })
      });
      setSelectedProfile(null);
    }} />}
      
      <MigoPlusModal isOpen={showPlusModal} onClose={() => setShowPlusModal(false)} />
    </div>;
};
export default NearbyPage;