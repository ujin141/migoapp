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

  // t()가 필요하므로 컴포넌트 내부에 정의
  const PURPOSE_ICONS: Record<string, React.ReactNode> = {
    [t("auto.x4047")]: <Coffee size={12} />,
    [t("auto.x4048")]: <Camera size={12} />,
    [t("auto.x4049")]: <Plane size={12} />,
    [t("auto.x4050")]: <Users size={12} />
  };
  const MOCK_NEARBY: NearbyProfile[] = [{
    id: "n1",
    name: "Alex",
    age: 28,
    photo: "https://randomuser.me/api/portraits/men/32.jpg",
    location: t("auto.x4051"),
    travelPurpose: t("auto.x4052"),
    tags: [t("auto.x4053"), t("auto.x4054"), t("auto.x4055")],
    distance_km: 0.3,
    bio: t("auto.x4056"),
    nationality: "🇺🇸",
    trust_score: 92,
    verified: true,
    user_type: "traveler"
  }, {
    id: "n2",
    name: t("auto.x4057"),
    age: 25,
    photo: "https://randomuser.me/api/portraits/women/44.jpg",
    location: t("auto.x4058"),
    travelPurpose: t("auto.x4059"),
    tags: [t("auto.x4060"), t("auto.x4061")],
    distance_km: 0.8,
    bio: t("auto.x4062"),
    nationality: "🇰🇷",
    trust_score: 88,
    verified: false,
    user_type: "traveler"
  }, {
    id: "n3",
    name: "Marco",
    age: 31,
    photo: "https://randomuser.me/api/portraits/men/75.jpg",
    location: t("auto.x4063"),
    travelPurpose: t("auto.x4064"),
    tags: ["IT", t("auto.x4065")],
    distance_km: 1.2,
    bio: t("auto.x4066"),
    nationality: "🇮🇹",
    trust_score: 95,
    verified: true,
    user_type: "traveler"
  }, {
    id: "n4",
    name: t("auto.x4067"),
    age: 23,
    photo: "https://randomuser.me/api/portraits/women/68.jpg",
    location: t("auto.x4068"),
    travelPurpose: t("auto.x4069"),
    tags: [t("auto.x4070"), t("auto.x4071")],
    distance_km: 0.5,
    bio: t("auto.x4072"),
    nationality: "🇯🇵",
    trust_score: 99,
    verified: true,
    user_type: "local"
  }, {
    id: "n5",
    name: "Sofia",
    age: 29,
    photo: "https://randomuser.me/api/portraits/women/26.jpg",
    location: t("auto.x4073"),
    travelPurpose: t("auto.x4074"),
    tags: [t("auto.x4075"), t("auto.x4076")],
    distance_km: 1.9,
    bio: t("auto.x4077"),
    nationality: "🇪🇸",
    trust_score: 85,
    verified: false,
    user_type: "traveler"
  }, {
    id: "n6",
    name: "Jin",
    age: 26,
    photo: "https://randomuser.me/api/portraits/men/11.jpg",
    location: t("auto.x4078"),
    travelPurpose: t("auto.x4079"),
    tags: [t("auto.x4080"), t("auto.x4081")],
    distance_km: 2.4,
    bio: t("auto.x4082"),
    nationality: "🇸🇬",
    trust_score: 78,
    verified: false,
    user_type: "traveler"
  }];
  const [profiles, setProfiles] = useState<NearbyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<NearbyProfile | null>(null);
  const [filterPurpose, setFilterPurpose] = useState<string>("all");
  const [myCity] = useState(t("auto.x4083"));
  const PURPOSES = ["all", t("auto.x4084"), t("auto.x4085"), t("auto.x4086"), t("auto.x4087")];

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
        } = await supabase.rpc("get_nearby_travelers", {
          p_lat: myPos.lat,
          p_lng: myPos.lng,
          p_radius_km: 50,
          p_limit: 50
        });
        if (!error && data && data.length > 0) {
          const mapped: NearbyProfile[] = data.map((r: any) => ({
            id: r.id,
            name: r.name,
            age: r.age,
            photo: r.photo_url,
            location: r.location,
            travelPurpose: r.user_type === "local" ? t("auto.x4088") : t("auto.x4089"),
            tags: r.tags ?? [],
            distance_km: r.distance_km,
            bio: r.bio,
            nationality: r.nationality,
            trust_score: r.trust_score,
            verified: r.verified,
            user_type: r.user_type,
            online_at: r.last_seen
          }));
          setProfiles(mapped);
        } else {
          setProfiles(MOCK_NEARBY);
        }
      } else {
        setProfiles(MOCK_NEARBY);
      }
    } catch {
      setProfiles(MOCK_NEARBY);
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
  return <div className="flex flex-col min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 pt-3 pb-2">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <Navigation size={14} className="text-primary" />
              <h1 className="text-base font-extrabold">{t("auto.x4040")}</h1>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground">{t("auto.p31", {
              city: myCity
            })}</p>
          </div>
          <button onClick={() => loadNearby(true)} className={`ml-auto w-9 h-9 rounded-full bg-muted flex items-center justify-center ${refreshing ? "animate-spin" : ""}`}>
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Purpose Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {PURPOSES.map(p => <button key={p} onClick={() => setFilterPurpose(p)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${filterPurpose === p ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"}`}>
              {p === "all" ? t("auto.x4090") : p}
            </button>)}
        </div>
      </header>

      {/* Live Count Banner */}
      <div className="mx-4 mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Users size={18} className="text-emerald-500" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-foreground">{t("auto.z_\uC9C0\uAE08_135")}{myCity}{t("auto.z_\uC5D0_136")}<span className="text-emerald-500">{profiles.length}{t("auto.z_\uBA85_137")}</span>{t("auto.x4041")}
          </p>
          <p className="text-xs text-muted-foreground">{t("auto.x4042")}</p>
        </div>
        <Zap size={18} className="text-emerald-500 ml-auto" />
      </div>

      {/* Grid */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        <AnimatePresence>
          {loading ? Array.from({
          length: 4
        }).map((_, i) => <div key={i} className="h-56 rounded-2xl bg-muted animate-pulse" />) : filtered.map((p, i) => <motion.div key={p.id} initial={{
          opacity: 0,
          scale: 0.9
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          delay: i * 0.05
        }} whileTap={{
          scale: 0.96
        }} onClick={() => setSelectedProfile(p)} className="relative rounded-2xl overflow-hidden bg-card border border-border shadow-sm cursor-pointer">
                {/* Photo */}
                <div className="relative h-40">
                  {p.photo ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full gradient-primary flex items-center justify-center">
                      <span className="text-3xl font-black text-white">{p.name[0]}</span>
                    </div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                  {/* Local badge */}
                  {p.user_type === "local" && <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                      {t("auto.x4043")}
                    </div>}

                  {/* Online indicator */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/40 backdrop-blur rounded-full px-1.5 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] text-white font-bold">{t("auto.x4044")}</span>
                  </div>

                  {/* Name + distance */}
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white font-extrabold text-sm">{p.name} <span className="font-normal text-xs text-white/70">{p.nationality}</span></p>
                    <div className="flex items-center gap-1 text-white/70 text-[10px]">
                      <MapPin size={9} />
                      <span>{formatDistance(p.distance_km)}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Info */}
                <div className="p-2.5">
                  {p.travelPurpose && <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground mb-1.5">
                      {PURPOSE_ICONS[p.travelPurpose]}
                      <span>{p.travelPurpose}</span>
                    </div>}
                  <div className="flex flex-wrap gap-1">
                    {(p.tags ?? []).slice(0, 2).map(tag => <span key={tag} className="px-1.5 py-0.5 rounded bg-muted text-[9px] font-bold text-muted-foreground">
                        {tag}
                      </span>)}
                  </div>
                </div>
              </motion.div>)}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {!loading && filtered.length === 0 && <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <MapPin size={48} className="text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-semibold">{t("auto.x4045")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("auto.x4046")}</p>
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
    </div>;
};
export default NearbyPage;