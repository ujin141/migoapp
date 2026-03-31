import i18n from "@/i18n";
import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { MapPin, Navigation, Filter, X, Check, Heart, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { GoogleMap, useLoadScript, OverlayView } from "@react-google-maps/api";
const MAP_LIBRARIES: ("places")[] = ["places"];
const mapStyles = [{
  featureType: "poi",
  stylers: [{
    visibility: "off"
  }]
}, {
  featureType: "transit",
  stylers: [{
    visibility: "off"
  }]
}, {
  featureType: "road",
  elementType: "geometry",
  stylers: [{
    color: "#ffffff"
  }]
}, {
  featureType: "road",
  elementType: "labels.text.fill",
  stylers: [{
    color: "#9ca3af"
  }]
}, {
  featureType: "water",
  stylers: [{
    color: "#dbeafe"
  }]
}, {
  featureType: "landscape",
  stylers: [{
    color: "#f9fafb"
  }]
}, {
  featureType: "administrative",
  elementType: "geometry.stroke",
  stylers: [{
    color: "#e5e7eb"
  }]
}];
const MapPage = () => {
  const {
    t
  } = useTranslation();
  // 지도 페이지에서 바디 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, []);
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    isLoaded
  } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "",
    libraries: MAP_LIBRARIES
  });
  const mapRef = useRef<google.maps.Map | null>(null);
  const [myLatLng, setMyLatLng] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedTraveler, setSelectedTraveler] = useState<any | null>(null);
  const [profileDetail, setProfileDetail] = useState<any | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState(10);
  const [centerAnim, setCenterAnim] = useState(false);
  const [liked, setLiked] = useState<string[]>([]);
  const [travelers, setTravelers] = useState<any[]>([]);
  const [currentLocationName, setCurrentLocationName] = useState(t("mapPage.locating"));
  const [locationSharing, setLocationSharing] = useState(true);
  const [showMyProfile, setShowMyProfile] = useState(false);
  const [myProfilePhoto, setMyProfilePhoto] = useState<string>("");
  useEffect(() => {
    const fetchTravelers = async () => {
      if (!user) return;
      const {
        data: me
      } = await supabase.from('profiles').select('lat, lng').eq('id', user.id).single();
      const {
        data,
        error
      } = await supabase.from('profiles').select('id,name,photo_url,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,bio').neq('id', user?.id ?? '').limit(30);
      if (!error && data) {
        const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
          const R = 6371;
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLng = (lng2 - lng1) * Math.PI / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };
        setTravelers(data.filter(p => p.id !== user?.id).map(p => {
          const distKm = me?.lat && me?.lng && p.lat && p.lng ? haversine(me.lat, me.lng, p.lat, p.lng) : null;
          return {
            id: p.id,
            name: p.name || i18n.t("auto.z_autoz유저182_316"),
            age: p.age || 25,
            photo: p.photo_url || "",
            lat: p.lat ?? null,
            lng: p.lng ?? null,
            distanceKm: distKm,
            distance: distKm != null ? `${distKm.toFixed(1)}km` : t("mapPage.noDistance"),
            bio: p.bio || i18n.t("auto.z_autoz자기소개가_317"),
            destination: p.location || i18n.t("auto.z_autoz여행지18_318"),
            dates: i18n.t("auto.z_autoz일정미정1_319"),
            tags: p.interests?.slice(0, 3) || [],
            travelStyle: p.interests || [],
            languages: p.languages || [i18n.t("auto.z_autoz한국어18_320")],
            gender: p.gender || i18n.t("auto.z_autoz알수없음1_321"),
            location: p.location || i18n.t("auto.z_autoz서울188_322"),
            verified: p.verified || false,
            verifyLevel: p.verified ? 'gold' : 'none',
            matchScore: 80 + Math.floor(Math.random() * 20)
          };
        }));
        // fetch my profile photo
        const mine = data.find(p => p.id === user?.id);
        if (mine?.photo_url) setMyProfilePhoto(mine.photo_url);
      }
    };
    fetchTravelers();

    // 내 위치를 DB에 저장 및 역지오코딩 (30초 주기)
    const saveLocation = () => {
      if (!user || !locationSharing) return;
      navigator.geolocation?.getCurrentPosition(async pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMyLatLng({
          lat,
          lng
        });
        if (mapRef.current) mapRef.current.panTo({
          lat,
          lng
        });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ko`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.borough || data.address?.suburb || data.address?.village || data.address?.county || "";
          const country = data.address?.country || "";
          const locationName = city ? `${city}, ${country}` : country || i18n.t("auto.z_autoz위치알수없_323");
          setCurrentLocationName(locationName);
          supabase.from("profiles").update({
            lat,
            lng,
            location: locationName
          }).eq("id", user.id);
        } catch (e) {
          console.error("Geocoding error", e);
          setCurrentLocationName(i18n.t("auto.z_autoz위치알수없_324"));
        }
      }, () => {
        setCurrentLocationName(i18n.t("auto.z_autoz위치권한없_325"));
      });
    };
    saveLocation();
    const interval = setInterval(saveLocation, 30_000);
    return () => clearInterval(interval);
  }, [user]);
  const tagOptions = [t("auto.z_autoz카페192_326"), t("auto.z_autoz트레킹19_327"), t("auto.z_autoz서핑194_328"), t("auto.z_autoz야시장19_329"), t("auto.z_autoz사진196_330"), t("auto.z_autoz음식197_331"), t("auto.z_autoz건축198_332"), t("auto.z_autoz자연199_333")];
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };
  const handleReCenter = () => {
    setCenterAnim(true);
    toast({
      title: t("alert.t59Title")
    });
    setTimeout(() => setCenterAnim(false), 800);
  };
  const handleLike = async (id: string, name: string) => {
    if (!user) return;
    setLiked(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
    const isLiking = !liked.includes(id);
    if (isLiking) {
      // 1. 내 좋아요 저장
      await supabase.from('likes').upsert({
        from_user: user.id,
        to_user: id,
        kind: 'like'
      }, {
        onConflict: 'from_user,to_user'
      });

      // 2. 상대방도 나를 좋아요 했는지 확인 (상호 매칭)
      const {
        data: mutual
      } = await supabase.from('likes').select('id').eq('from_user', id).eq('to_user', user.id).eq('kind', 'like').maybeSingle();
      if (mutual) {
        toast({
          title: i18n.t("auto.z_tmpl_200", {
            defaultValue: i18n.t("auto.z_tmpl_334", {
              defaultValue: t("auto.t5017", {
                v0: name
              })
            })
          }),
          description: i18n.t("auto.z_autoz채팅탭에서_335")
        });

        // 매칭 성사 시 채팅방(trip_groups) 생성
        const {
          data: group
        } = await supabase.from('trip_groups').insert({
          name: i18n.t("auto.z_tmpl_202", {
            defaultValue: i18n.t("auto.z_tmpl_336", {
              defaultValue: t("auto.t5018", {
                v0: user.name,
                v1: name
              })
            })
          }),
          created_by: user.id
        }).select().single();
        if (group) {
          await supabase.from('trip_group_members').insert([{
            group_id: group.id,
            user_id: user.id
          }, {
            group_id: group.id,
            user_id: id
          }]);
        }
        await supabase.from('in_app_notifications').insert({
          user_id: id,
          type: 'match',
          title: i18n.t("auto.z_autoz매칭성공2_337"),
          content: i18n.t("auto.z_tmpl_204", {
            defaultValue: i18n.t("auto.z_tmpl_338", {
              defaultValue: t("auto.t5019", {
                v0: user.name
              })
            })
          })
        });

        // 약간의 딜레이 후 채팅으로 이동
        setTimeout(() => navigate('/chat'), 1500);
      } else {
        toast({
          title: i18n.t("auto.z_tmpl_205", {
            defaultValue: i18n.t("auto.z_tmpl_339", {
              defaultValue: t("auto.t5020", {
                v0: name
              })
            })
          })
        });
        await supabase.from('in_app_notifications').insert({
          user_id: id,
          type: 'like',
          title: i18n.t("auto.z_autoz새로운반가_340"),
          content: i18n.t("auto.z_tmpl_207", {
            defaultValue: i18n.t("auto.z_tmpl_341", {
              defaultValue: t("auto.t5021")
            })
          })
        });
      }
    } else {
      await supabase.from('likes').delete().eq('from_user', user.id).eq('to_user', id);
    }
  };
  return <div className="min-h-screen bg-background safe-bottom relative">
      {/* Real Google Map */}
      <div className="relative w-full h-screen overflow-hidden">
        {!isLoaded ? <div className="w-full h-full flex items-center justify-center bg-muted">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div> : <GoogleMap mapContainerStyle={{
        width: "100%",
        height: "100%"
      }} center={myLatLng ?? {
        lat: 37.5665,
        lng: 126.9780
      }} zoom={14} onLoad={onMapLoad} options={{
        styles: mapStyles,
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      }}>
            {/* Traveler markers */}
            {travelers.filter(t => t.distanceKm == null || t.distanceKm <= maxDistance).filter(t => t.lat && t.lng).map(t => {
          const isSelected = selectedTraveler?.id === t.id;
          return <OverlayView key={t.id} position={{
            lat: t.lat,
            lng: t.lng
          }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                    <div className="flex flex-col items-center cursor-pointer group -translate-x-1/2 -translate-y-1/2" onClick={() => setSelectedTraveler(isSelected ? null : t)}>
                      <div className={`absolute w-12 h-12 rounded-full ${isSelected ? "bg-primary/40" : "bg-primary/20"} animate-pulse`} />
                      <div className="relative">
                        {t.photo ? <img src={t.photo} alt={t.name} className={`w-11 h-11 rounded-full object-cover border-2 shadow-lg transition-transform ${isSelected ? "border-primary scale-110" : "border-white"}`} /> : <div className={`w-11 h-11 rounded-full border-2 shadow-lg flex items-center justify-center gradient-primary ${isSelected ? "border-primary scale-110" : "border-white"}`}>
                            <span className="text-white font-extrabold text-sm">{t.name?.[0] ?? "?"}</span>
                          </div>}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
                      </div>
                      {isSelected && <div className="mt-1 bg-white/90 backdrop-blur-sm rounded-xl px-2 py-0.5 shadow-md whitespace-nowrap">
                          <span className="text-[10px] font-bold text-gray-800">{t.name}</span>
                          <span className="text-[10px] text-gray-500 ml-1">{t.distance}</span>
                        </div>}
                    </div>
                  </OverlayView>;
        })}

            {/* My location marker */}
            {myLatLng && <OverlayView position={myLatLng} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                <div className={`flex flex-col items-center cursor-pointer group -translate-x-1/2 -translate-y-1/2 transition-transform ${centerAnim ? "scale-150" : "scale-100"}`} style={{
            transitionDuration: "300ms"
          }} onClick={() => setShowMyProfile(true)}>
                  <div className="absolute w-12 h-12 rounded-full bg-primary/30 animate-pulse" />
                  <div className="relative">
                    {myProfilePhoto || user?.photoUrl ? <img src={myProfilePhoto || user?.photoUrl} alt={t("auto.x4028")} className="w-11 h-11 rounded-full object-cover border-2 border-primary shadow-lg scale-110" /> : <div className="w-11 h-11 rounded-full border-2 border-primary shadow-lg flex items-center justify-center gradient-primary scale-110">
                        <span className="text-white font-extrabold text-sm">{user?.name?.[0] ?? t("auto.z_autoz나208_342")}</span>
                      </div>}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-white" />
                  </div>
                </div>
              </OverlayView>}
          </GoogleMap>}

        {/* Header overlay */}
        <div className="absolute top-0 left-0 right-0 p-5 flex items-center justify-between z-30">
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl px-4 py-2.5 shadow-card flex items-center gap-2">
            <MapPin size={16} className="text-primary" />
            <span className="text-sm font-bold text-foreground">{currentLocationName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => {
            const next = !locationSharing;
            setLocationSharing(next);
            if (!next) setCurrentLocationName(i18n.t("auto.z_autoz위치공유꺼_343"));
          }} className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl shadow-card backdrop-blur-sm text-xs font-bold transition-all active:scale-90 ${locationSharing ? 'bg-primary text-primary-foreground' : 'bg-card/90 text-muted-foreground'}`}>
              <MapPin size={14} />
              {locationSharing ? 'GPS ON' : 'GPS OFF'}
            </button>
            <button onClick={() => setShowFilter(true)} className="bg-card/90 backdrop-blur-sm rounded-xl p-2.5 shadow-card relative transition-transform active:scale-90">
              <Filter size={18} className="text-muted-foreground" />
              {selectedTags.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full gradient-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground">
                  {selectedTags.length}
                </span>}
            </button>
          </div>
        </div>

        {/* Selected Traveler Card */}
        <AnimatePresence>
          {selectedTraveler && <motion.div className="absolute bottom-28 left-4 right-4 z-30" initial={{
          y: 40,
          opacity: 0
        }} animate={{
          y: 0,
          opacity: 1
        }} exit={{
          y: 40,
          opacity: 0
        }} transition={{
          type: "spring",
          damping: 25,
          stiffness: 300
        }}>
              <div className="bg-card rounded-2xl p-4 shadow-float flex items-center gap-3">
                {selectedTraveler.photo ? <img src={selectedTraveler.photo} alt="" className="w-12 h-12 rounded-xl object-cover cursor-pointer" onClick={() => setProfileDetail(selectedTraveler)} onError={e => {
              (e.target as HTMLImageElement).style.display = 'none';
            }} /> : <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center cursor-pointer text-white font-bold text-lg" onClick={() => setProfileDetail(selectedTraveler)}>
                    {selectedTraveler.name?.[0] ?? "?"}
                  </div>}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-foreground">{selectedTraveler.name}, {selectedTraveler.age}</h4>
                  <p className="text-xs text-muted-foreground truncate">{selectedTraveler.bio}</p>
                  <p className="text-[10px] text-primary font-medium mt-0.5">📍 {selectedTraveler.distance}</p>
                </div>
                <button onClick={() => setProfileDetail(selectedTraveler)} className="px-3 py-1.5 rounded-xl gradient-primary text-primary-foreground text-xs font-semibold shadow-card transition-transform active:scale-95">{t("auto.z_autoz프로필21_344")}</button>
              </div>
            </motion.div>}
        </AnimatePresence>

        {/* Default bottom card if none selected */}
        {!selectedTraveler && travelers.length > 0 && <div className="absolute bottom-28 left-4 right-4 z-30">
            <div className="bg-card rounded-2xl p-4 shadow-float flex items-center gap-3">
              {travelers[0].photo ? <img src={travelers[0].photo} alt="" className="w-12 h-12 rounded-xl object-cover cursor-pointer" onClick={() => setProfileDetail(travelers[0])} onError={e => {
            (e.target as HTMLImageElement).style.display = 'none';
          }} /> : <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center cursor-pointer text-white font-bold text-lg" onClick={() => setProfileDetail(travelers[0])}>
                  {travelers[0].name?.[0] ?? "?"}
                </div>}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-foreground">{travelers[0].name}</h4>
                <p className="text-xs text-muted-foreground truncate">{travelers[0].bio}</p>
              </div>
              <button onClick={() => setProfileDetail(travelers[0])} className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-xs font-semibold shadow-card transition-transform active:scale-95">{t("auto.z_autoz프로필21_345")}</button>
            </div>
          </div>}

        {/* Re-center button */}
        <button onClick={handleReCenter} className="absolute bottom-56 right-4 z-30 bg-card rounded-xl p-3 shadow-card transition-transform active:scale-90">
          <Navigation size={18} className={`text-primary ${centerAnim ? "animate-pulse" : ""}`} />
        </button>
      </div>

      {/* ─── Profile Detail Bottom Sheet ─── */}
      <AnimatePresence>
        {profileDetail && <motion.div className="fixed inset-0 z-[60] flex items-end" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }}>
            <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setProfileDetail(null)} />
            <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-t-3xl shadow-float overflow-hidden" initial={{
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
                <button onClick={() => setProfileDetail(null)} className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-card/80 backdrop-blur-sm flex items-center justify-center shadow-card">
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

              {/* Content */}
              <div className="px-5 pt-4 pb-8 space-y-4">
                {/* Bio */}
                <p className="text-sm text-muted-foreground leading-relaxed">{profileDetail.bio}</p>

                {/* Travel info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted rounded-2xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MapPin size={13} className="text-primary" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{t("auto.z_autoz여행지21_346")}</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">{profileDetail.destination}</p>
                  </div>
                  <div className="bg-muted rounded-2xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Calendar size={13} className="text-primary" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{t("auto.z_autoz일정213_347")}</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">{profileDetail.dates}</p>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-2">{t("auto.z_autoz여행스타일_348")}</p>
                  <div className="flex flex-wrap gap-2">
                    {profileDetail.tags.map(tag => <span key={tag} className="px-3 py-1.5 rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {tag}
                      </span>)}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-1">
                  <button onClick={() => handleLike(profileDetail.id, profileDetail.name)} className={`flex-1 py-3.5 rounded-2xl border-2 flex items-center justify-center gap-2 text-sm font-bold shadow-card transition-all ${liked.includes(profileDetail.id) ? "gradient-primary text-primary-foreground border-transparent" : "bg-card border-border text-foreground hover:border-primary/50"}`}>
                    <Heart size={18} fill={liked.includes(profileDetail.id) ? "currentColor" : "none"} className={liked.includes(profileDetail.id) ? "text-white" : "text-primary"} />
                    {liked.includes(profileDetail.id) ? t("auto.z_autoz반가워요보_349") : t("auto.z_autoz반가워요2_350")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      {/* Filter Drawer */}
      <AnimatePresence>
        {showFilter && <motion.div className="fixed inset-0 z-50 flex items-end" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }}>
            <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowFilter(false)} />
            <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-t-3xl p-6 pb-20 shadow-float" initial={{
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
                <h3 className="text-lg font-extrabold text-foreground">{t("auto.z_autoz지도필터2_351")}</h3>
                <button onClick={() => setShowFilter(false)}><X size={20} className="text-muted-foreground" /></button>
              </div>

              {/* Distance */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-bold text-foreground">{t("auto.z_autoz거리반경2_352")}</label>
                  <span className="text-sm font-bold text-primary">{maxDistance}km</span>
                </div>
                <input type="range" min={1} max={50} value={maxDistance} onChange={e => setMaxDistance(Number(e.target.value))} className="w-full accent-primary" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>1km</span><span>50km</span>
                </div>
              </div>

              {/* Travel Style Tags */}
              <div className="mb-6">
                <label className="text-sm font-bold text-foreground mb-3 block">{t("auto.z_autoz여행스타일_353")}</label>
                <div className="flex flex-wrap gap-2">
                  {tagOptions.map(tag => <button key={tag} onClick={() => toggleTag(tag)} className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${selectedTags.includes(tag) ? "gradient-primary text-primary-foreground shadow-card" : "bg-muted text-muted-foreground"}`}>
                      {tag}
                    </button>)}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => {
              setSelectedTags([]);
              setMaxDistance(10);
            }} className="flex-1 py-3 rounded-2xl border border-border text-foreground font-semibold text-sm">{t("auto.z_autoz초기화22_354")}</button>
                <button onClick={() => {
              setShowFilter(false);
              toast({
                title: i18n.t("auto.z_autoz필터가적용_355"),
                description: i18n.t("auto.z_tmpl_222", {
                  defaultValue: i18n.t("auto.z_tmpl_356", {
                    defaultValue: t("auto.t5022", {
                      v0: maxDistance
                    })
                  })
                })
              });
            }} className="flex-1 py-3 rounded-2xl gradient-primary text-primary-foreground font-semibold text-sm shadow-card flex items-center justify-center gap-2">
                  <Check size={16} />{t("auto.z_autoz적용하기2_357")}</button>
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      {/* My Profile Sheet */}
      <AnimatePresence>
        {showMyProfile && <motion.div className="fixed inset-0 z-[60] flex items-end" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }}>
            <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowMyProfile(false)} />
            <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-t-3xl shadow-float overflow-hidden" initial={{
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
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="flex items-center gap-4 px-5 py-4">
                {myProfilePhoto || user?.photoUrl ? <img src={myProfilePhoto || user?.photoUrl} alt={t("auto.x4029")} className="w-16 h-16 rounded-2xl object-cover border-2 border-primary shadow-card" /> : <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white font-extrabold text-2xl">
                    {user?.name?.[0] ?? t("auto.z_autoz나224_358")}
                  </div>}
                <div className="flex-1">
                  <p className="font-extrabold text-foreground text-base">{user?.name ?? t("auto.z_autoz나225_359")}</p>
                  <p className="text-xs text-muted-foreground">{currentLocationName}</p>
                </div>
              </div>
              <div className="px-5 pb-8 flex gap-3">
                <button onClick={() => {
              setShowMyProfile(false);
              navigate("/profile");
            }} className="flex-1 py-3 rounded-2xl gradient-primary text-primary-foreground font-bold text-sm shadow-card transition-transform active:scale-95">{t("auto.z_autoz프로필보기_360")}</button>
                <button onClick={() => setShowMyProfile(false)} className="w-12 py-3 rounded-2xl bg-muted flex items-center justify-center">
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>
    </div>;
};
export default MapPage;