import i18n from "@/i18n";
import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { MapPin, Navigation, Filter, X, Check, Heart, Calendar, Plane, Globe, Users, Plus, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { AnimatePresence, motion } from "framer-motion";
import { supabase, getCached, setCache } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { translateText } from "@/lib/translateService";
import { TravelerSheet } from "./map/TravelerSheet";
import { GroupSheet } from "./map/GroupSheet";
import { SmoothTravelerMarker, HotplaceMarker, RestaurantMarker } from "./map/MapMarkers";
import { useLocationTracker } from "@/hooks/useLocationTracker";
import { getCurrentLocation } from "@/lib/locationService";
import StoryViewer from "@/components/StoryViewer";
import ReportBlockActionSheet from "@/components/ReportBlockActionSheet";
import { GoogleMap, useLoadScript, OverlayView } from "@react-google-maps/api";
import { HOTPLACES, Hotplace, getRecommendationsForHotplace, PlaceRecommendation } from "@/lib/placeRecommendations";
import CreateTripPage from "./CreateTripPage";
import GroupDetailFilter, { GroupDetailFilterState, DEFAULT_GROUP_DETAIL_FILTER, countGroupDetailFilters } from "@/components/GroupDetailFilter";
import { getMyCheckIn } from "@/lib/checkInService";
import { SlidersHorizontal } from "lucide-react";
import PageGuide from "@/components/PageGuide";
import TopHeader from "@/components/TopHeader";
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
    // PlacesService는 실제 DOM div가 필요함
    const div = document.createElement('div');
    placesServiceRef.current = new google.maps.places.PlacesService(map);
  }, []);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedTraveler, setSelectedTraveler] = useState<any | null>(null);
  const [isTravelerCycleActive, setIsTravelerCycleActive] = useState(true);
  const autoCycleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoCycleIndexRef = useRef<number>(0);
  const [profileDetail, setProfileDetail] = useState<any | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState(10);
  const [ageFilter, setAgeFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [centerAnim, setCenterAnim] = useState(false);
  const [liked, setLiked] = useState<string[]>([]);
  const [travelers, setTravelers] = useState<any[]>([]);
  const [currentLocationName, setCurrentLocationName] = useState(t("mapPage.locating"));
  const [locationSharing, setLocationSharing] = useState(true);
  const [showMyProfile, setShowMyProfile] = useState(false);
  const [myProfilePhoto, setMyProfilePhoto] = useState<string>("");

  const [showRightNowModal, setShowRightNowModal] = useState(false);
  const [isMatchingLoading, setIsMatchingLoading] = useState(false);

  // ―― 글로벌 핫플레이스 & 커뮤니티 & 모임 ――
  const [displayMode, setDisplayMode] = useState<"travelers" | "hotplaces" | "community" | "groups" | "restaurants">("travelers");
  const [hotplaceCategory, setHotplaceCategory] = useState<'all' | 'city' | 'nature' | 'attraction' | 'club'>('all');
  // ―― 구글 실제 맛집/카페/바 ――
  const [restaurantPlaces, setRestaurantPlaces] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any | null>(null);
  const [restaurantLoading, setRestaurantLoading] = useState(false);
  const [restaurantFilter, setRestaurantFilter] = useState<'all' | 'restaurant' | 'bar' | 'cafe' | 'bank' | 'currency_exchange' | 'pharmacy' | 'convenience_store' | 'hospital' | 'subway_station' | 'supermarket' | 'lodging'>('all');
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const [selectedHotplace, setSelectedHotplace] = useState<Hotplace | null>(null);
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [actionSheetTarget, setActionSheetTarget] = useState<any | null>(null);
  const [commentPostMap, setCommentPostMap] = useState<any | null>(null); // map의 댓글 모달
  const [mapCommentText, setMapCommentText] = useState("");
  const [tripGroups, setTripGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [showGroupCreate, setShowGroupCreate] = useState(false);

  // Group detail filter
  const [showGroupDetailFilter, setShowGroupDetailFilter] = useState(false);
  const [groupDetailFilter, setGroupDetailFilter] = useState<GroupDetailFilterState>(DEFAULT_GROUP_DETAIL_FILTER);
  const groupDetailFilterCount = countGroupDetailFilters(groupDetailFilter);

  // Check-in city for group filtering
  const [checkInCity, setCheckInCity] = useState<string | null>(null);
  
  // Flight Trends Feature
  const [showFlightTrends, setShowFlightTrends] = useState(false);
  const [showLodgingTrends, setShowLodgingTrends] = useState(false);

  
  useEffect(() => {
    if (!user) return;
    getMyCheckIn(user.id).then(ci => {
      if (ci) setCheckInCity(ci.city);
    });
  }, [user]);

  // 최신 위치 레퍼런스 유지 (useEffect 재생성 방지용)
  const myLatLngRef = useRef<any>(null);

  // 실시간 내 위치 추적 & Broadcast 발송
  const realTimePos = useLocationTracker(user?.id, locationSharing);

  useEffect(() => {
    if (realTimePos) {
      setMyLatLng(realTimePos);
      myLatLngRef.current = realTimePos;
    }
  }, [realTimePos, user?.id]);

  const handleLightningMatch = async (hotplace: Hotplace) => {
    setShowRightNowModal(false);
    setIsMatchingLoading(true);

    if (mapRef.current) {
      mapRef.current.panTo({ lat: hotplace.lat, lng: hotplace.lng });
      mapRef.current.setZoom(13);
    }
    setDisplayMode("groups");

    setTimeout(async () => {
      try {
        const groupSize = Math.floor(Math.random() * 3) + 3; 
        const allTravelers = [...travelers].sort(() => 0.5 - Math.random());
        const matchedMembers = allTravelers.slice(0, groupSize);

        const newTitle = t("auto.t_0035", `[당장번개⚡] ${hotplace.name} 모일 사람!`);
        const { data: supabaseGroupData, error } = await supabase.from('trip_groups').insert({
          title: newTitle,
          destination: `${hotplace.name}, ${hotplace.country}`,
          dates: t("map.today"),
          description: t("auto.ko_0171", "⚡ 당장 모드 원터치 자동 4~6인 생성 그룹입니다."),
          host_id: user?.id,
          max_members: groupSize + 1,
          status: "active",
          tags: [t("auto.ko_0172", "파티"), t("auto.ko_0173", "맛집"), `_loc_:${hotplace.lat}:${hotplace.lng}`]
        }).select().single();

        let grp: any = null;
        if (error) {
           console.error("Supabase group insert failed:", error);
           throw error;
        } else {
           grp = supabaseGroupData;
        }

        if (grp) {
          const memsToInsert = [{ group_id: grp.id, user_id: user?.id }];
          matchedMembers.forEach(m => {
            memsToInsert.push({ group_id: grp.id, user_id: m.id });
          });
          
          if (!error) {
            const { error: membersErr } = await supabase.from('trip_group_members').insert(memsToInsert);
            if (membersErr) console.error("Members insert error:", membersErr);
          }

          toast({
            title: t("auto.g_0031", "🎉 랜덤 번개 그룹 매칭 성공!"),
            description: t("auto.t_0007", `${hotplace.name}에서 ${matchedMembers.length}명의 친구들이 참여했습니다.`)
          });
          
          const localGroup = {
             ...grp,
             hostName: user?.name,
             hostPhoto: user?.photoUrl,
             members: memsToInsert,
             currentMembers: memsToInsert.length,
          };
          setTripGroups(prev => {
            // Remove previous mock group if exists to prevent duplicates if tested rapidly
            return [...prev, localGroup];
          });
          setSelectedGroup(localGroup);
        }
      } catch (err) {
        console.error("Matching catch error:", err);
        toast({ title: t("map.matchFail"), variant: "destructive" });
      } finally {
        setIsMatchingLoading(false);
      }
    }, 2500);
  };

  const [translatedBio, setTranslatedBio] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const targetLang = (i18n.language.split("-")[0] || "en") as any;

  const handleTranslateBio = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (translatedBio) {
      setTranslatedBio(null);
      return;
    }
    if (!profileDetail?.bio) return;

    setIsTranslating(true);
    try {
      const res = await translateText({ text: profileDetail.bio, targetLang });
      setTranslatedBio(res);
    } finally {
      setIsTranslating(false);
    }
  };
  useEffect(() => {
    const fetchTravelers = async () => {
      if (!user) return;
      const CACHE_KEY = `map:travelers:${user.id}`;
      const cached = getCached<any[]>(CACHE_KEY);
      if (cached) {
        setTravelers(cached);
        return;
      }

      const {
        data: me
      } = await supabase.from('profiles').select('lat, lng').eq('id', user.id).single();
      const {
        data,
        error
      } = await supabase.from('profiles').select('id,name,photo_url,age,gender,nationality,location,lat,lng,languages,interests,mbti,verified,bio').neq('id', user?.id ?? '').order('id').limit(30);
      if (!error && data) {
        const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
          const R = 6371;
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLng = (lng2 - lng1) * Math.PI / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };
        const parsedData = data.filter(p => p.id !== user?.id).map(p => {
          const distKm = me?.lat && me?.lng && p.lat && p.lng ? haversine(me.lat, me.lng, p.lat, p.lng) : null;
          return {
            id: p.id,
            name: p.name || t("map.user"),
            age: p.age || 25,
            photo: p.photo_url || "",
            lat: p.lat ?? null,
            lng: p.lng ?? null,
            distanceKm: distKm,
            distance: distKm != null ? `${distKm.toFixed(1)}km` : t("mapPage.noDistance"),
            bio: p.bio || t("map.bioPlaceholder"),
            destination: p.location || t("map.destPlaceholder"),
            dates: t("map.datesUnknown"),
            tags: p.interests?.slice(0, 3) || [],
            travelStyle: p.interests || [],
            languages: p.languages || [t("map.korean")],
            gender: p.gender || t("map.genderUnknown"),
            location: p.location || t("map.seoul"),
            verified: p.verified || false,
            verifyLevel: p.verified ? 'gold' : 'none',
            matchScore: 80 + (p.id.charCodeAt(0) % 20)
          };
        });
        setCache(CACHE_KEY, parsedData, 2 * 60 * 1000); // 2분 캐시
        setTravelers(parsedData);
        
        const mine = data.find(p => p.id === user?.id);
        if (mine?.photo_url) setMyProfilePhoto(mine.photo_url);
      }
    };
    fetchTravelers();

    const fetchCommunityPosts = async () => {
      const CACHE_KEY = 'map:communityPosts';
      const cached = getCached<any[]>(CACHE_KEY);
      if (cached) { setCommunityPosts(cached); return; }

      const { data, error } = await supabase.from('posts').select(`
        id, content, image_url, image_urls, tags, author_id, created_at,
        profiles!posts_author_id_fkey(name, photo_url),
        post_likes(count),
        comments(id)
      `).eq('hidden', false).order('created_at', { ascending: false }).limit(50);
      
      // 내가 좋아요한 게시물 ID
      let likedSet = new Set<string>();
      if (user) {
        const { data: myLikes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id);
        likedSet = new Set((myLikes || []).map((l: any) => l.post_id));
      }

      if (!error && data) {
        const postsWithLocation = data.filter((p: any) => {
          if (!p.tags || !Array.isArray(p.tags)) return false;
          if (!p.image_url && (!p.image_urls || p.image_urls.length === 0)) return false;
          return p.tags.some((t: string) => t.startsWith("_loc_:"));
        }).map((p: any) => {
          const locStr = p.tags.find((t: string) => t.startsWith("_loc_:"));
          const parts = locStr.split(":");
          return {
            id: p.id,
            author: p.profiles?.name || t("map.user"),
            authorId: p.author_id,
            photo: p.profiles?.photo_url || "",
            content: p.content,
            imageUrl: p.image_url || (p.image_urls ? p.image_urls[0] : ""),
            images: p.image_urls || [],
            lat: parseFloat(parts[1]),
            lng: parseFloat(parts[2]),
            locationName: parts.slice(3).join(":"),
            locationTag: { name: parts.slice(3).join(":") },
            time: new Date(p.created_at).toLocaleDateString("ko-KR"),
            likes: p.post_likes?.[0]?.count || 0,
            comments: p.comments?.length || 0,
            liked: likedSet.has(p.id),
          };
        });
        setCache(CACHE_KEY, postsWithLocation, 5 * 60 * 1000); // 5분 캐시
        setCommunityPosts(postsWithLocation);
      }
    };
    fetchCommunityPosts();

    const fetchTripGroups = async () => {
      const CACHE_KEY = 'map:tripGroups';
      const cached = getCached<any[]>(CACHE_KEY);
      if (cached) { setTripGroups(cached); return; }

      let query = supabase.from("trip_groups").select(`
        id, title, destination, dates, max_members, tags, status, entry_fee, is_premium, description,
        host_id, profiles:host_id(name, photo_url, bio),
        trip_group_members(user_id, profiles(name, photo_url, gender))
      `).in("status", ["recruiting", "almost_full"]).order("created_at", { ascending: false });
      
      const { data, error } = await query;
      if (!error && data) {
        const groupsWithLocation = data.map((g: any) => {
          let lat: number | null = null;
          let lng: number | null = null;
          
          if (g.tags && Array.isArray(g.tags)) {
            const locTag = g.tags.find((t: string) => t.startsWith("_loc_:"));
            if (locTag) {
              const parts = locTag.split(":");
              lat = parseFloat(parts[1]);
              lng = parseFloat(parts[2]);
            }
          }
          
          return {
            id: g.id,
            title: g.title,
            destination: g.destination,
            dates: g.dates,
            currentMembers: g.trip_group_members?.length || 1,
            maxMembers: g.max_members,
            tags: g.tags || [],
            status: g.status,
            entryFee: g.entry_fee,
            isPremiumGroup: g.is_premium,
            description: g.description,
            coverImage: "",
            hostId: g.host_id,
            hostName: g.profiles?.name || t("map.host"),
            hostPhoto: g.profiles?.photo_url || "",
            hostBio: g.profiles?.bio || "",
            lat,
            lng,
            members: g.trip_group_members || []
          };
        }).filter((g: any) => g.lat != null && g.lng != null);
        setCache(CACHE_KEY, groupsWithLocation, 3 * 60 * 1000); // 3분 캐시
        setTripGroups(groupsWithLocation);
      }
    };
    fetchTripGroups();

    // Broadcast Listener 역방향 (상대방 움직임 캐치)
    const channel = supabase.channel("public-map");
    channel.on("broadcast", { event: "location_update" }, (payload) => {
      const { user_id, lat, lng, rightNowMessage } = payload.payload;
      if (user_id === user?.id) return; // 내 위치는 무시 (이미 프론트엔드에서 처리)
      
      setTravelers(prev => prev.map(t => {
        if (t.id === user_id) {
          // Haversine 거리 실시간 재계산 (비용절감 핵심 부분: DB를 치지 않고 계산만 수정)
          const R = 6371;
          const me = myLatLngRef.current;
          let distStr = t.distance;
          let distKm = t.distanceKm;
          
          if (me) {
            const dLat = (lat - me.lat) * Math.PI / 180;
            const dLng = (lng - me.lng) * Math.PI / 180;
            const a = Math.sin(dLat/2)**2 + Math.cos(me.lat*Math.PI/180) * Math.cos(lat*Math.PI/180) * Math.sin(dLng/2)**2;
            distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            distStr = `${distKm.toFixed(1)}km`;
          }
          
          return { ...t, lat, lng, distanceKm: distKm, distance: distStr, rightNowMessage };
        }
        return t;
      }));
    }).subscribe();

    let isMounted = true;
    // 내 위치를 DB에 영구 저장 (백업/크론 용도) - 1분 간격 (비용 대폭 절감)
    const saveLocationToDB = async () => {
      if (!isMounted || !user || !locationSharing) return;
      
      let pos = await getCurrentLocation(false);
      if (!isMounted) return;
      
      // 만약 1회성 GPS 조회가 타임아웃/오류로 실패하더라도, 
      // 실시간 트래킹(useLocationTracker) 좌표가 있다면 그걸로 위치를 렌더링합니다.
      if (!pos && myLatLngRef.current) {
        pos = myLatLngRef.current;
      }

      if (!pos) {
        setCurrentLocationName(t("auto.ko_0174", "위치 응답 대기 중..."));
        return;
      }
      const { lat, lng } = pos;
      setMyLatLng({ lat, lng });
      if (mapRef.current) mapRef.current.panTo({ lat, lng });

      try {
        const lang = i18n.language.split("-")[0] || "en";
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=${lang}`);
        const data = await res.json();
        const city = data.address?.city || data.address?.town || data.address?.borough || data.address?.suburb || data.address?.village || data.address?.county || "";
        const country = data.address?.country || "";
        const locationName = city ? `${city}, ${country}` : country || t("map.locationUnknown");
        setCurrentLocationName(locationName);
        await supabase.from("profiles").update({ lat, lng, location: locationName }).eq("id", user.id);
      } catch (e) {
        console.error("Geocoding error", e);
        setCurrentLocationName(t("map.locationUnknown"));
      }
    };
    saveLocationToDB();
    const interval = setInterval(saveLocationToDB, 60_000);
    return () => {
      isMounted = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user, locationSharing, t]);

  // ─── 구글 Places Nearby Search ───
  const searchNearbyRestaurants = useCallback((type: 'all' | 'restaurant' | 'bar' | 'cafe' | 'bank' | 'currency_exchange' | 'pharmacy' | 'convenience_store' | 'hospital' | 'subway_station' | 'supermarket' | 'lodging' = 'all', useMapCenter: boolean = false) => {
    if (!placesServiceRef.current || !mapRef.current) return;
    
    // 만약 "이 지역 재검색" 버튼을 누르지 않았다면(useMapCenter===false) 내 위치를 기준으로 가장 가까운 곳을 찾습니다.
    let center: google.maps.LatLng | undefined;
    if (!useMapCenter && myLatLngRef.current && type !== 'all') {
      center = new google.maps.LatLng(myLatLngRef.current.lat, myLatLngRef.current.lng);
    } else {
      center = mapRef.current.getCenter();
    }
    if (!center) return;

    setRestaurantLoading(true);
    setRestaurantPlaces([]);
    setSelectedRestaurant(null);

    // 키워드 기반 검색이 필요한 타입 목록
    const KEYWORD_TYPES: Record<string, string> = {
      currency_exchange: t("auto.ko_0175", "환전소 currency exchange money changer"),
      subway_station: t("auto.ko_0176", "지하철역 metro subway station"),
      supermarket: t("auto.ko_0177", "마트 대형마트 supermarket grocery"),
    };

    const types = type === 'all' ? ['restaurant', 'bar', 'cafe'] : [type];
    let allResults: any[] = [];
    let remaining = types.length;

    types.forEach(placeType => {
      const req: google.maps.places.PlaceSearchRequest = {
        location: center,
        radius: 1500,
      };

      if (KEYWORD_TYPES[placeType]) {
        req.keyword = KEYWORD_TYPES[placeType];
      } else {
        req.type = placeType as any;
      }

      placesServiceRef.current!.nearbySearch(req, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          allResults = [...allResults, ...results.filter(r => r.geometry?.location)];
        }
        remaining--;
        if (remaining === 0) {
          // 중복 제거 + 평점 순 정렬, 최대 30개
          const unique = Array.from(new Map(allResults.map(r => [r.place_id, r])).values())
            .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
            .slice(0, 30);
          setRestaurantPlaces(unique);
          setRestaurantLoading(false);

          // 가장 가까운 장소 자동 선택
          if (unique.length > 0 && myLatLngRef.current && (type !== 'all')) {
            let nearest = unique[0];
            let minDist = 9999;
            unique.forEach((p: any) => {
               if (p.geometry?.location) {
                 const lat = typeof p.geometry.location.lat === 'function' ? p.geometry.location.lat() : p.geometry.location.lat;
                 const lng = typeof p.geometry.location.lng === 'function' ? p.geometry.location.lng() : p.geometry.location.lng;
                 const d = calcDist(myLatLngRef.current!.lat, myLatLngRef.current!.lng, lat, lng);
                 if (d < minDist) { minDist = d; nearest = p; }
               }
            });
            if (minDist < 9999) {
              setSelectedRestaurant(nearest);
              if (mapRef.current && nearest.geometry?.location) {
                const lat = typeof nearest.geometry.location.lat === 'function' ? nearest.geometry.location.lat() : nearest.geometry.location.lat;
                const lng = typeof nearest.geometry.location.lng === 'function' ? nearest.geometry.location.lng() : nearest.geometry.location.lng;
                mapRef.current.setZoom(16);
                mapRef.current.panTo({ lat, lng });
              }
            }
          }
        }
      });
    });
  }, []);

  // ―― Nearest Traveler Auto-Select (딱 한 번만) ――
  useEffect(() => {
    if (displayMode === "travelers" && travelers.length > 0 && isTravelerCycleActive) {
      const validTravelers = travelers.filter(t => t.distanceKm != null && t.distanceKm <= maxDistance && t.lat && t.lng);
      if (validTravelers.length === 0) return;
      const sorted = [...validTravelers].sort((a,b) => (a.distanceKm || 0) - (b.distanceKm || 0));
      
      if (!selectedTraveler) {
         setSelectedTraveler(sorted[0]);
         if (mapRef.current && sorted[0].lat && sorted[0].lng) {
            mapRef.current.setZoom(16);
            mapRef.current.panTo({ lat: sorted[0].lat, lng: sorted[0].lng });
         }

      }
      setIsTravelerCycleActive(false); // 딱 한 번만 실행되도록 락
    }
  }, [displayMode, travelers, isTravelerCycleActive, maxDistance, selectedTraveler]);

  // 맛집 모드 진입 시 자동 검색 + 줌 복귀
  useEffect(() => {
    if (displayMode === 'restaurants' && isLoaded && mapRef.current) {
      // 핫플레이스 탭에서 전역 뷰(zoom 2)로 빠져나온 경우 적절한 레벨로 복귀
      const currentZoom = mapRef.current.getZoom() ?? 14;
      if (currentZoom < 12) {
        mapRef.current.setZoom(14);
      }
      searchNearbyRestaurants(restaurantFilter);
    }
  }, [displayMode, isLoaded, restaurantFilter]);

  // 맛집 선택 시 상세 정보 로드 (사진 포함)
  const loadPlaceDetail = useCallback((place: any) => {
    if (!placesServiceRef.current || !place.place_id) {
      setSelectedRestaurant(place);
      return;
    }
    placesServiceRef.current.getDetails({
      placeId: place.place_id,
      fields: ['name', 'rating', 'user_ratings_total', 'formatted_address', 'photos', 'types', 'opening_hours', 'price_level', 'url', 'geometry', 'website'],
    }, (result, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && result) {
        setSelectedRestaurant(result);
      } else {
        setSelectedRestaurant(place);
      }
    });
  }, []);

  const tagOptions = [t("auto.ko_0178", "카페"), t("auto.ko_0179", "트레킹"), t("auto.ko_0180", "서핑"), t("auto.ko_0181", "야시장"), t("auto.ko_0182", "사진"), t("auto.ko_0183", "음식"), t("auto.ko_0184", "건축"), t("auto.ko_0185", "자연")];
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };
  const handleReCenter = () => {
    if (mapRef.current && myLatLngRef.current) {
      mapRef.current.panTo({ lat: myLatLngRef.current.lat, lng: myLatLngRef.current.lng });
      mapRef.current.setZoom(16);
    }
    setCenterAnim(true);
    toast({
      title: t("auto.g_0032", "📍 현재 위치로 지도를 이동했습니다.")
    });
    setTimeout(() => setCenterAnim(false), 800);
  };

  const handleFlyToHotplace = async (h: Hotplace) => {
    localStorage.setItem('migo_my_lat', String(h.lat));
    localStorage.setItem('migo_my_lng', String(h.lng));
    
    setLocationSharing(false);
    setCurrentLocationName(t("auto.t_0036", `[가상] ${h.name.split(' (')[0]}`));
    setMyLatLng({ lat: h.lat, lng: h.lng });
    if (myLatLngRef) myLatLngRef.current = { lat: h.lat, lng: h.lng };
    
    if (user) {
      await supabase.from('profiles').update({
        lat: h.lat,
        lng: h.lng,
        location: `${h.cities[0]}, ${h.country}`
      }).eq('id', user.id);
    }
    
    toast({
      title: t("auto.g_0033", "✈️ 가상 위치 이동 완료!"),
      description: t("auto.t_0009", `${h.name} 지역의 여행자들을 탐색합니다.`)
    });
    
    setTimeout(() => {
      setSelectedHotplace(null);
      setDisplayMode("travelers");
      if (mapRef.current) {
        mapRef.current.panTo({ lat: h.lat, lng: h.lng });
        mapRef.current.setZoom(13);
      }
    }, 500);
  };
  const likingRef = useRef(new Set<string>());
  const handleLike = async (id: string, name: string) => {
    if (!user) return;
    if (likingRef.current.has(id)) return;
    likingRef.current.add(id);
    try {
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
          title: t("auto.t_0010", `🎉 ${name}님과 매칭성공!`)
        });

        // 매칭 성사 시 채팅방(trip_groups) 생성
        const {
          data: group
        } = await supabase.from('trip_groups').insert({
          name: `${user.name} & ${name}`,
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
          title: t("map.matchSuccess"),
          content: t("auto.t_0037", `${user.name}님이 회원님에게 매칭 신청을 보냈습니다`)
        });

        // 약간의 딜레이 후 채팅으로 이동
        setTimeout(() => navigate('/chat'), 1500);
      } else {
        toast({
          title: t("auto.t_0011", `❤️ ${name}님에게 충심 전달!`)
        });
        await supabase.from('in_app_notifications').insert({
          user_id: id,
          type: 'like',
          title: t("map.newVibe"),
          content: t("auto.t_0038", `${user.name}님이 회원님의 프로필에 충심행습니다`)
        });
      }
    } else {
      await supabase.from('likes').delete().eq('from_user', user.id).eq('to_user', id);
    }
    } finally {
      likingRef.current.delete(id);
    }
  };

  const filteredTripGroups = tripGroups.filter(group => {
    // 목적지 키워드 필터
    if (groupDetailFilter.destinationKeyword.trim()) {
      const kw = groupDetailFilter.destinationKeyword.trim().toLowerCase();
      if (!group.destination?.toLowerCase().includes(kw) && !group.title?.toLowerCase().includes(kw)) return false;
    }
    // 출발지 키워드 필터
    if (groupDetailFilter.departureKeyword.trim()) {
      const kw = groupDetailFilter.departureKeyword.trim().toLowerCase();
      if (!group.tags?.some((t: string) => t.toLowerCase().includes(kw))) return false;
    }
    // 여행 스타일 필터
    if (groupDetailFilter.travelStyle) {
      const styleMap: Record<string, string[]> = {
        "관광": [t("auto.ko_0186", "관광"), t("auto.ko_0187", "투어")], "맛집": [t("auto.ko_0188", "맛집"), t("auto.ko_0189", "음식")], "자연": [t("auto.ko_0190", "자연"), t("auto.ko_0191", "액티비티")],
        "휴양": [t("auto.ko_0192", "휴양"), t("auto.ko_0193", "힐링")], "나이트라이프": [t("auto.ko_0194", "나이트"), t("auto.ko_0195", "파티"), t("auto.ko_0196", "클럽")]
      };
      const keywords = styleMap[groupDetailFilter.travelStyle] || [groupDetailFilter.travelStyle];
      if (!group.tags?.some((t: string) => keywords.some(k => t.includes(k)))) return false;
    }
    // 여행 기간 필터
    if (groupDetailFilter.duration) {
      if (!group.dates?.includes(groupDetailFilter.duration) && !group.tags?.some((tagStr: string) => tagStr.includes(groupDetailFilter.duration!))) return false;
    }
    // 성비 필터
    if (groupDetailFilter.genderPref !== "any") {
      if (groupDetailFilter.genderPref === "female-only") {
        if (!group.tags?.some((tagStr: string) => tagStr.includes(t("auto.ko_0197", "여성")))) return false;
      } else if (groupDetailFilter.genderPref === "male-only") {
        if (!group.tags?.some((tagStr: string) => tagStr.includes(t("auto.ko_0198", "남성")))) return false;
      }
    }
    return true;
  });

  function calcDist(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  function distLabel(d: number) {
    return d < 1 ? Math.round(d * 1000) + "m" : d.toFixed(1) + "km";
  }

  // ── 사진 피드 좋아요 (DiscoverPage와 동일 DB 동기화) ──────────────
  const handleLikePost = async (postId: string) => {
    if (!user) return;
    const post = communityPosts.find(p => p.id === postId);
    if (!post) return;

    const newLiked = !post.liked;
    // 낙관적 UI 업데이트
    setCommunityPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, liked: newLiked, likes: newLiked ? p.likes + 1 : Math.max(0, p.likes - 1) }
        : p
    ));
    setSelectedPost((prev: any) =>
      prev?.id === postId ? { ...prev, liked: newLiked, likes: newLiked ? prev.likes + 1 : Math.max(0, prev.likes - 1) } : prev
    );

    if (newLiked) {
      await supabase.from('post_likes').upsert({ user_id: user.id, post_id: postId }, { onConflict: 'user_id,post_id' });
      // 게시물 주인에게 알림 (본인 제외)
      if (post.authorId && post.authorId !== user.id) {
        await supabase.from('in_app_notifications').insert({
          user_id: post.authorId,
          type: 'like',
          message: t("auto.t_0039", `${user.name || t("auto.ko_0199", "누군가")}님이 사진 게시물에 좋아요를 눌렀어요 ❤️`),
          post_id: postId,
        }).select().maybeSingle();
      }
    } else {
      await supabase.from('post_likes').delete().eq('user_id', user.id).eq('post_id', postId);
    }
  };

  // ── 사진 피드 댓글 전송 (DiscoverPage와 동일 DB 동기화) ─────────
  const handleCommentPost = async (postId: string, text: string) => {
    if (!user || !text.trim()) return;
    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      author_id: user.id,
      text: text.trim(),
    });
    if (!error) {
      setCommunityPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, comments: p.comments + 1 } : p
      ));
      setSelectedPost((prev: any) =>
        prev?.id === postId ? { ...prev, comments: prev.comments + 1 } : prev
      );
      // 게시물 주인에게 댓글 알림
      const post = communityPosts.find(p => p.id === postId);
      if (post?.authorId && post.authorId !== user.id) {
        await supabase.from('in_app_notifications').insert({
          user_id: post.authorId,
          type: 'comment',
          message: t("auto.t_0040", `${user.name || t("auto.ko_0200", "누군가")}님이 댓글을 남겼어요: "${text.trim().slice(0, 30)}"`),
          post_id: postId,
        }).select().maybeSingle();
      }
    }
  };

  // When hotplaceCategory changes, trigger toast for nearest
  useEffect(() => {
    if (displayMode === "hotplaces" && hotplaceCategory !== 'all' && myLatLngRef.current && typeof HOTPLACES !== 'undefined') {
       const filtered = HOTPLACES.filter(h => h.category === hotplaceCategory);
       if (filtered.length === 0) return;
       let nearest = filtered[0];
       let minDist = 9999;
       filtered.forEach(h => {
         const d = calcDist(myLatLngRef.current.lat, myLatLngRef.current.lng, h.lat, h.lng);
         if (d < minDist) { minDist = d; nearest = h; }
       });
       if (minDist < 9999) {
          setSelectedHotplace(nearest);
          if (mapRef.current) { mapRef.current.setZoom(16); mapRef.current.panTo({ lat: nearest.lat, lng: nearest.lng }); }

       }
    }
  }, [hotplaceCategory, displayMode]);

  // 모임찾기 진입 시 자동 선택 + 알림
  useEffect(() => {
    if (displayMode === "groups" && tripGroups.length > 0 && myLatLngRef.current && !selectedGroup) {
      let nearest = tripGroups[0];
      let minDist = 9999;
      tripGroups.forEach(g => {
         const d = calcDist(myLatLngRef.current!.lat, myLatLngRef.current!.lng, g.lat, g.lng);
         if (d < minDist) { minDist = d; nearest = g; }
      });
      if (minDist < 9999) {
        setSelectedGroup(nearest);
        if (mapRef.current) {
          mapRef.current.setZoom(16);
          mapRef.current.panTo({ lat: nearest.lat, lng: nearest.lng });
        }

      }
    }
  }, [displayMode, tripGroups]);

  // 사진피드 진입 시 자동 선택 + 알림
  useEffect(() => {
    if (displayMode === "community" && communityPosts.length > 0 && myLatLngRef.current && !selectedPost) {
      let nearest = communityPosts[0];
      let minDist = 9999;
      communityPosts.forEach(p => {
         const lat = p.location?.lat || p.lat;
         const lng = p.location?.lng || p.lng;
         if (lat && lng) {
           const d = calcDist(myLatLngRef.current!.lat, myLatLngRef.current!.lng, lat, lng);
           if (d < minDist) { minDist = d; nearest = p; }
         }
      });
      if (nearest && minDist < 9999) {
        setSelectedPost(nearest);
        if (mapRef.current) {
          const lat = nearest.location?.lat || nearest.lat;
          const lng = nearest.location?.lng || nearest.lng;
          mapRef.current.setZoom(16);
          mapRef.current.panTo({ lat, lng });
        }

      }
    }
  }, [displayMode, communityPosts]);

  const handleModeChange = (mode: "travelers" | "hotplaces" | "community" | "groups" | "restaurants") => {
    setDisplayMode(mode);
    setIsTravelerCycleActive(true);
    setSelectedTraveler(null);
    setSelectedHotplace(null);
    setSelectedPost(null);
    setSelectedGroup(null);
    setSelectedRestaurant(null);
  };

  return <div className="h-screen flex flex-col bg-background safe-bottom relative overflow-hidden text-foreground">
      <TopHeader
        filterCount={displayMode === "groups" ? groupDetailFilterCount : selectedTags.length}
        onFilterClick={() => {
          if (displayMode === "groups") {
            setShowGroupDetailFilter(true);
          } else {
            setShowFilter(true);
          }
        }}
      />
      
      {/* Map Mode Toggle & Location (Moved below the header for Map specifically) */}
      <div className="z-30 w-full px-4 pt-3 pb-3 pointer-events-auto bg-gradient-to-b from-background via-background/95 to-transparent flex flex-col gap-3 shadow-sm border-b border-border/20">
        
        {/* Left: Location Sharing Pill */}
        <button 
          onClick={() => {
            const next = !locationSharing;
            setLocationSharing(next);
            if (!next) setCurrentLocationName(t("map.locationShareOff"));
          }}
          className={`self-start bg-card/95 backdrop-blur-md border rounded-full px-3 py-1.5 shadow-sm flex items-center gap-1.5 max-w-full transition-all active:scale-95 ${locationSharing ? 'border-primary/40' : 'border-border/50 opacity-90'}`}
        >
          <div className="relative shrink-0 flex items-center justify-center">
            <MapPin size={14} className={locationSharing ? "text-primary" : "text-muted-foreground"} />
            {!locationSharing && <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-destructive border-2 border-card" />}
          </div>
          <span className="text-[12px] font-extrabold text-foreground truncate">{currentLocationName}</span>
        </button>

        {/* Warning if GPS OFF */}
        {!locationSharing && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="self-start text-[10px] font-bold bg-destructive/10 text-destructive px-3 py-1.5 rounded-xl border border-destructive/20 shadow-md">
            {t("auto.ko_0119", "위치가 공유되지 않아 지도에 표시되지 않습니다")}
          </motion.div>
        )}

        {/* Right: Map Type Toggles */}
        <div className="w-full bg-card/90 backdrop-blur-md rounded-full border border-border/50 p-1 flex shadow-sm overflow-x-auto hide-scrollbar">
           <button onClick={() => handleModeChange("travelers")} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${displayMode === "travelers" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-muted"}`}>{t("auto.ko_0120", "👥 여행자")}</button>
           <button onClick={() => handleModeChange("groups")} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${displayMode === "groups" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-muted"}`}>{t("auto.ko_0121", "🍻 모임")}</button>
           <button onClick={() => handleModeChange("community")} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${displayMode === "community" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-muted"}`}>{t("auto.ko_0122", "📸 피드")}</button>
           <button onClick={() => handleModeChange("hotplaces")} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${displayMode === "hotplaces" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-muted"}`}>{t("auto.ko_0123", "🌍 핫플")}</button>
           <button onClick={() => handleModeChange("restaurants")} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${displayMode === "restaurants" ? "bg-orange-500 text-white shadow" : "text-muted-foreground hover:bg-muted"}`}>{t("auto.ko_0124", "📍 맛집")}</button>
        </div>
      </div>

      {/* Real Google Map */}
      <div className="relative flex-1 w-full overflow-hidden truncate z-10">
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
            {displayMode === "travelers" && travelers.filter(t => t.distanceKm == null || t.distanceKm <= maxDistance).filter(t => t.lat && t.lng).map(t => {
              const isSelected = selectedTraveler?.id === t.id;
              return <SmoothTravelerMarker key={t.id} t={t} isSelected={isSelected} onClick={() => {
                 setSelectedTraveler(isSelected ? null : t);
                 setIsTravelerCycleActive(false);
              }} />;
            })}

            {/* Hotplace markers */}
            {displayMode === "hotplaces" && HOTPLACES.filter(h => hotplaceCategory === 'all' || h.category === hotplaceCategory).map(h => {
              const isSelected = selectedHotplace?.id === h.id;
              return <HotplaceMarker key={h.id} h={h} isSelected={isSelected} onClick={() => {
                setSelectedHotplace(h);
                if (mapRef.current) {
                  mapRef.current.panTo({ lat: h.lat, lng: h.lng });
                  const currentZoom = mapRef.current.getZoom() ?? 14;
                  if (currentZoom < 14) mapRef.current.setZoom(14);
                }
              }} />;
            })}

            {/* Community Post markers */}
            {displayMode === "community" && communityPosts.map((post, index) => {
              const pos = { lat: post.lat, lng: post.lng };
              const isSelected = selectedPost?.id === post.id;
              return (
                <OverlayView key={`post_${post.id}`} position={pos} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                  <div className={`cursor-pointer transition-transform ${isSelected ? 'scale-125 z-50' : 'scale-100 z-10 hover:scale-110'} -translate-x-1/2 -translate-y-[100%]`} 
                    onClick={() => setSelectedPost(isSelected ? null : post)}
                    onDoubleClick={(e) => { e.stopPropagation(); setActiveStoryIndex(index); }}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl border-2 border-white shadow-xl overflow-hidden bg-muted">
                        {post.imageUrl ? (
                          <img src={post.imageUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary text-xs font-bold">Image</div>
                        )}
                      </div>
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 transform origin-center border-b-2 border-r-2 border-transparent shadow-sm" />
                      {isSelected && (
                         <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center border border-white shadow-sm">
                           <span className="w-1.5 h-1.5 bg-white rounded-full 2-spin" />
                         </div>
                      )}
                    </div>
                  </div>
                </OverlayView>
              );
            })}

            {/* Trip Group markers */}
            {displayMode === "groups" && filteredTripGroups.map(group => {
              const pos = { lat: group.lat, lng: group.lng };
              const isSelected = selectedGroup?.id === group.id;
              
              // Host check or member logic
              const isHost = user?.id === group.hostId;
              const isMember = group.members.some((m: any) => m.user_id === user?.id);
              
               return (
                <OverlayView key={`group_${group.id}`} position={pos} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                  <div className={`cursor-pointer transition-transform ${isSelected ? 'scale-125 z-50' : 'scale-100 z-10 hover:scale-110'} -translate-x-1/2 -translate-y-[100%]`} onClick={() => setSelectedGroup(isSelected ? null : group)}>
                    <div className="relative truncate">
                      <div className={`w-12 h-12 rounded-full border-2 ${isHost || isMember ? 'border-emerald-500' : 'border-amber-500'} bg-card shadow-xl overflow-hidden flex items-center justify-center`}>
                         <div className="text-xl">🍻</div>
                      </div>
                      <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-card rotate-45 transform origin-center border-b-2 border-r-2 ${isHost || isMember ? 'border-emerald-500' : 'border-amber-500'} shadow-sm`} />
                      
                      {group.status === "almost_full" && !isSelected && (
                        <div className="absolute -top-2 -right-2 bg-destructive text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse border border-white truncate">
                          {t("auto.ko_0118", "마감임박")}</div>
                      )}
                      
                      {isSelected && (
                         <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center border border-white shadow-sm">
                           <span className="w-1.5 h-1.5 bg-white rounded-full 2-spin" />
                         </div>
                      )}
                    </div>
                  </div>
                </OverlayView>
              );
            })}

            {/* Restaurant markers - Real Google Places */}
            {displayMode === "restaurants" && restaurantPlaces.map(place => {
              const isSelected = selectedRestaurant?.place_id === place.place_id;
              return (
                <RestaurantMarker
                  key={place.place_id}
                  place={place}
                  isSelected={isSelected}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedRestaurant(null);
                    } else {
                      if (mapRef.current) mapRef.current.panTo({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
                      loadPlaceDetail(place);
                    }
                  }}
                />
              );
            })}


            {/* My location marker */}
            {myLatLng && <OverlayView position={myLatLng} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                <div className={`flex flex-col items-center cursor-pointer group -translate-x-1/2 -translate-y-1/2 transition-transform ${centerAnim ? "scale-150" : "scale-100"}`} style={{
            transitionDuration: "300ms"
          }} onClick={() => setShowMyProfile(true)}>
                  <div className="absolute w-12 h-12 rounded-full bg-primary/30 animate-pulse" />
                  <div className="relative truncate">
                    {myProfilePhoto || user?.photoUrl ? <img src={myProfilePhoto || user?.photoUrl} alt={t("auto.x4028")} className="w-11 h-11 rounded-full object-cover border-2 border-primary shadow-lg scale-110" /> : <div className="w-11 h-11 rounded-full border-2 border-primary shadow-lg flex items-center justify-center gradient-primary scale-110">
                        <span className="text-white font-extrabold text-sm truncate">{user?.name?.[0] ?? t("map.me")}</span>
                      </div>}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-white" />
                  </div>
                </div>
              </OverlayView>}
          </GoogleMap>}

        {/* Floating action icons for Map Features */}
        <div className={`absolute right-4 z-30 pointer-events-none transition-all duration-300 ${displayMode === 'restaurants' || displayMode === 'hotplaces' ? 'top-[100px]' : 'top-4'}`}>
          <div className="flex flex-col gap-2 pointer-events-auto">
            {/* Lodging Trends */}
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowLodgingTrends(true)} className="w-10 h-10 bg-gradient-to-tr from-rose-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/20 text-white relative">
              <span className="text-lg leading-none">🛏️</span>
              <div className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-white animate-pulse shadow-sm" />
            </motion.button>

            {/* Flight Trends */}
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowFlightTrends(true)} className="w-10 h-10 bg-gradient-to-tr from-sky-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-sky-500/20 text-white relative">
              <Plane size={18} />
            </motion.button>
            
            {/* Lightning Match */}
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowRightNowModal(true)} className="w-10 h-10 bg-amber-500 border border-amber-400 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 text-white animate-pulse">
              <Zap size={18} fill="currentColor" />
            </motion.button>
          </div>
        </div>

        {/* Restore structure for Sub-Filters and FAB */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full pointer-events-none flex flex-col">
          {/* Sub-Filters for hotplaces */}
            <AnimatePresence>
              {displayMode === "hotplaces" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex justify-center mt-2 overflow-hidden pointer-events-auto">
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar px-1 w-full max-w-full">
                    {[
                      { id: 'all', label: t("auto.ko_0201", "모두"), emoji: '🌟' },
                      { id: 'city', label: t("auto.ko_0202", "도심/시내"), emoji: '🏙️' },
                      { id: 'nature', label: t("auto.ko_0203", "바다/자연"), emoji: '🌊' },
                      { id: 'attraction', label: t("auto.ko_0204", "테마파크/명소"), emoji: '🎡' },
                      { id: 'club', label: t("auto.ko_0205", "클럽/라운지"), emoji: '🪩' }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setHotplaceCategory(cat.id as any)}
                        className={`shrink-0 px-3 py-1 text-[10px] font-bold rounded-full whitespace-nowrap transition-colors flex items-center gap-1 shadow-sm border ${hotplaceCategory === cat.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border/50 hover:bg-muted'}`}
                      >
                        <span className="text-[12px]">{cat.emoji}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sub-Filters for 편의시설/맛집 */}
            <AnimatePresence>
              {displayMode === 'restaurants' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col gap-1.5 mt-2 overflow-hidden pointer-events-auto px-1"
                >
                  {/* Row 1: 다이닝 & 숙박 */}
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar px-1 w-full max-w-full">
                    {([
                      { id: 'all', label: t("auto.ko_0206", "전체"), emoji: '🔥' },
                      { id: 'restaurant', label: t("auto.ko_0207", "음식점"), emoji: '🍽️' },
                      { id: 'cafe', label: t("auto.ko_0208", "카페"), emoji: '☕' },
                      { id: 'bar', label: t("auto.ko_0209", "바/펍"), emoji: '🍺' },
                      { id: 'lodging', label: t("auto.ko_0210", "호텔/숙소"), emoji: '🛏️' },
                    ] as const).map(f => (
                      <button
                        key={f.id}
                        onClick={() => setRestaurantFilter(f.id as any)}
                        className={`shrink-0 px-3 py-1 text-[10px] font-bold rounded-full whitespace-nowrap transition-colors flex items-center gap-1 shadow-sm border ${
                          restaurantFilter === f.id
                            ? 'bg-orange-500 text-white border-orange-400'
                            : 'bg-card text-muted-foreground border-border/50 hover:bg-muted'
                        }`}
                      >
                        <span className="text-[12px]">{f.emoji}</span>
                        {f.label}
                      </button>
                    ))}
                  </div>
                  {/* Row 2: 여행 편의시설 */}
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar px-1 w-full max-w-full">
                    {([
                      { id: 'supermarket', label: t("auto.ko_0211", "마트/슈퍼"), emoji: '🛒' },
                      { id: 'convenience_store', label: t("auto.ko_0212", "편의점"), emoji: '🏪' },
                      { id: 'currency_exchange', label: t("auto.ko_0213", "환전소"), emoji: '💵' },
                      { id: 'bank', label: 'ATM', emoji: '🏧' },
                      { id: 'pharmacy', label: t("auto.ko_0214", "약국"), emoji: '💊' },
                      { id: 'hospital', label: t("auto.ko_0215", "병원"), emoji: '🏥' },
                      { id: 'subway_station', label: t("auto.ko_0216", "지하철역"), emoji: '🚇' },
                    ] as const).map(f => (
                      <button
                        key={f.id}
                        onClick={() => setRestaurantFilter(f.id as any)}
                        className={`shrink-0 px-3 py-1 text-[10px] font-bold rounded-full whitespace-nowrap transition-colors flex items-center gap-1 shadow-sm border ${
                          restaurantFilter === f.id
                            ? 'bg-orange-500 text-white border-orange-400'
                            : 'bg-card text-muted-foreground border-border/50 hover:bg-muted'
                        }`}
                      >
                        <span className="text-[12px]">{f.emoji}</span>
                        {f.label}
                      </button>
                    ))}
                  </div>
                  {/* 이 지역 재검색 */}
                  {!restaurantLoading && restaurantPlaces.length > 0 && (
                    <div className="flex justify-center">
                      <button
                        onClick={() => searchNearbyRestaurants(restaurantFilter, true)}
                        className="px-4 py-1 bg-card/95 backdrop-blur-md border border-border/50 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1.5 active:scale-95 transition-transform"
                      >
                        {t("auto.ko_0125", "🔄 이 지역 재검색 (")}{restaurantPlaces.length}{t("auto.ko_0126", "곳)")}</button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Selected Traveler Card */}
        <AnimatePresence>
          {selectedTraveler && <motion.div className="absolute left-4 right-4 z-30" style={{ bottom: "calc(95px + env(safe-area-inset-bottom, 0px))" }} initial={{
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
              <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-2xl rounded-3xl p-4 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] border border-white/60 dark:border-white/10 flex items-center gap-4 transition-transform">
                <div className="relative shrink-0">
                  {selectedTraveler.photo ? <img src={selectedTraveler.photo} alt="" className="w-14 h-14 rounded-full object-cover shadow-sm ring-2 ring-white dark:ring-zinc-800 cursor-pointer" onClick={() => setProfileDetail(selectedTraveler)} onError={e => {
                (e.target as HTMLImageElement).style.display = 'none';
              }} /> : <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center cursor-pointer text-white font-bold text-xl shadow-sm ring-2 ring-white dark:ring-zinc-800" onClick={() => setProfileDetail(selectedTraveler)}>
                      {selectedTraveler.name?.[0] ?? "?"}
                    </div>}
                  <div className="absolute right-0 bottom-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-zinc-800 shadow-sm animate-pulse"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-[15px] text-foreground">{selectedTraveler.name}, {selectedTraveler.age}</h4>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{selectedTraveler.bio}</p>
                  <p className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1.5">📍 {selectedTraveler.distance}</p>
                </div>
                <button onClick={() => setProfileDetail(selectedTraveler)} className="px-4 py-2 rounded-2xl bg-foreground text-background text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all">{t("map.profile")}</button>
              </div>
            </motion.div>}
        </AnimatePresence>

        {/* Restaurant Loading Indicator */}
        <AnimatePresence>
          {displayMode === 'restaurants' && restaurantLoading && (
            <motion.div
              className="absolute left-1/2 top-1/2 z-30"
              initial={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }}
              animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
              exit={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }}
            >
              <div className="bg-card/95 backdrop-blur-md rounded-2xl px-6 py-4 shadow-float flex flex-col items-center gap-3 border border-border/50">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-bold text-foreground truncate">{t("map.searchingPlaces")}</p>
                <p className="text-xs text-muted-foreground truncate">{t("map.connectingPlaces")}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>



        {/* Selected Restaurant Card */}
        <AnimatePresence>
          {selectedRestaurant && displayMode === 'restaurants' && (
            <motion.div
              className="absolute left-4 right-4 z-30"
              style={{ bottom: 'calc(95px + env(safe-area-inset-bottom, 0px))' }}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_-12px_rgba(249,115,22,0.25)] border border-white/60 dark:border-white/10 overflow-hidden truncate">
                {/* Photo strip */}
                {selectedRestaurant.photos && selectedRestaurant.photos.length > 0 ? (
                  <div className="relative h-36 w-full overflow-hidden bg-muted truncate">
                    <img
                      src={selectedRestaurant.photos[0].getUrl({ maxWidth: 600, maxHeight: 300 })}
                      alt={selectedRestaurant.name}
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    {/* Multiple photos row */}
                    {selectedRestaurant.photos.length > 1 && (
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        {selectedRestaurant.photos.slice(1, 4).map((p: any, i: number) => (
                          <img
                            key={i}
                            src={p.getUrl({ maxWidth: 80, maxHeight: 80 })}
                            className="w-8 h-8 rounded-md object-cover border-2 border-white shadow-sm"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ))}
                        {selectedRestaurant.photos.length > 4 && (
                          <div className="w-8 h-8 rounded-md bg-black/60 flex items-center justify-center border-2 border-white">
                            <span className="text-white text-[9px] font-bold">+{selectedRestaurant.photos.length - 4}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Close button */}
                    <button
                      onClick={() => setSelectedRestaurant(null)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
                    >
                      <X size={14} className="text-white" />
                    </button>
                    {/* Open/Closed badge */}
                    {(() => {
                      const oh = selectedRestaurant.opening_hours;
                      if (!oh) return null;
                      
                      let isOpen = null;
                      if (typeof oh.isOpen === 'function') {
                        try { isOpen = oh.isOpen(); } catch(e) {}
                      }
                      
                      if (isOpen === null) return null;
                      
                      return (
                        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm ${isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                          {isOpen ? t("auto.ko_0217", "영업 중") : t("auto.ko_0218", "영업 종료")}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="relative h-20 bg-gradient-to-r from-orange-500/20 to-amber-500/20 flex items-center justify-center">
                    <span className="text-4xl">
                      {selectedRestaurant.types?.includes('restaurant') ? '🍽️'
                        : selectedRestaurant.types?.includes('bar') ? '🍺'
                        : selectedRestaurant.types?.includes('cafe') ? '☕' : '📍'}
                    </span>
                    <button onClick={() => setSelectedRestaurant(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-md flex items-center justify-center hover:scale-105 transition-transform">
                      <X size={14} className="text-muted-foreground" />
                    </button>
                  </div>
                )}

                {/* Info section */}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-1 truncate">
                    <h4 className="font-extrabold text-sm text-foreground leading-snug flex-1">{selectedRestaurant.name}</h4>
                    {selectedRestaurant.price_level != null && (
                      <span className="text-[10px] text-muted-foreground font-bold shrink-0 truncate">
                        {'₩'.repeat(selectedRestaurant.price_level) || t("auto.ko_0219", "가격 미정")}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-1 truncate">
                    {(() => {
                      if (!myLatLngRef.current || !selectedRestaurant.geometry?.location) return null;
                      const lat = typeof selectedRestaurant.geometry.location.lat === 'function' ? selectedRestaurant.geometry.location.lat() : selectedRestaurant.geometry.location.lat;
                      const lng = typeof selectedRestaurant.geometry.location.lng === 'function' ? selectedRestaurant.geometry.location.lng() : selectedRestaurant.geometry.location.lng;
                      const d = calcDist(myLatLngRef.current.lat, myLatLngRef.current.lng, lat, lng);
                      const walkTime = Math.max(1, Math.ceil((d * 1000) / 75));
                      return (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary">
                          <span>📍 {distLabel(d)}</span>
                          <span>·</span>
                          <span className="truncate">{t("auto.ko_0127", "🚶 도보 약")}{walkTime}{t("auto.ko_0128", "분")}</span>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-2 mb-2 truncate">
                    {selectedRestaurant.rating && (
                      <span className="flex items-center gap-1 text-[11px] font-extrabold text-amber-500 truncate">
                        ⭐ {selectedRestaurant.rating}
                        {selectedRestaurant.user_ratings_total && (
                          <span className="text-[10px] text-muted-foreground font-normal truncate">({selectedRestaurant.user_ratings_total.toLocaleString()}{t("auto.ko_0129", "개 리뷰)")}</span>
                        )}
                      </span>
                    )}
                    {/* Type badges */}
                    <div className="flex gap-1 flex-wrap truncate">
                      {(selectedRestaurant.types || []).slice(0, 2).map((type: string) => {
                        const labels: Record<string, string> = { restaurant: t("auto.ko_0220", "음식점"), bar: t("auto.ko_0221", "바"), cafe: t("auto.ko_0222", "카페"), food: t("auto.ko_0223", "푸드"), bakery: t("auto.ko_0224", "베이커리"), meal_takeaway: t("auto.ko_0225", "테이크아웃"), night_club: t("auto.ko_0226", "나이트클럽") };
                        return labels[type] ? (
                          <span key={type} className="text-[9px] font-bold bg-orange-500/10 text-orange-600 px-1.5 py-0.5 rounded-full">{labels[type]}</span>
                        ) : null;
                      })}
                    </div>
                  </div>

                  {(selectedRestaurant.vicinity || selectedRestaurant.formatted_address) && (
                    <p className="text-[10px] text-muted-foreground mb-2 flex items-start gap-1 line-clamp-2">
                       <MapPin size={10} className="text-primary shrink-0 mt-0.5" />
                       {selectedRestaurant.vicinity || selectedRestaurant.formatted_address}
                    </p>
                  )}

                  {/* Google Maps 열기 버튼 */}
                  <a
                    href={selectedRestaurant.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedRestaurant.name || '')}&query_place_id=${selectedRestaurant.place_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl bg-orange-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm"
                  >
                    {t("auto.ko_0130", "구글 지도에서 보기")}</a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Hotplace Card */}
        <AnimatePresence>
          {selectedHotplace && <motion.div className="absolute left-4 right-4 z-30" style={{ bottom: "calc(95px + env(safe-area-inset-bottom, 0px))" }} initial={{
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
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-black/5 dark:border-white/5 flex flex-col gap-3 transition-transform">
                {/* Info Area */}
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="w-[56px] h-[56px] rounded-full gradient-primary flex items-center justify-center text-white font-bold text-2xl shadow-sm cursor-pointer border-2 border-white dark:border-zinc-800" onClick={() => setSelectedHotplace(null)}>
                      {selectedHotplace.emoji}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 truncate" onClick={() => setSelectedHotplace(null)}>
                    <h4 className="font-extrabold text-[15px] text-foreground leading-tight truncate">{selectedHotplace.name}</h4>
                    <p className="text-[13px] text-muted-foreground truncate mt-0.5">{selectedHotplace.country} · {selectedHotplace.cities.join(", ")}</p>
                    {(() => {
                      if (!myLatLngRef.current) return null;
                      const d = calcDist(myLatLngRef.current.lat, myLatLngRef.current.lng, selectedHotplace.lat, selectedHotplace.lng);
                      const walkTime = Math.max(1, Math.ceil((d * 1000) / 75));
                      return (
                        <div className="flex items-center gap-1.5 text-[12px] font-bold text-teal-500 mt-1">
                          <span>📍 {distLabel(d)}</span>
                          <span className="truncate">{t("auto.ko_0131", "· 🚶 도보 약")}{walkTime}{t("auto.ko_0132", "분")}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Buttoons Area */}
                <div className="flex gap-2.5 truncate">
                  <button onClick={() => handleFlyToHotplace(selectedHotplace)} className="flex-[3] py-2.5 rounded-2xl bg-gradient-to-r from-teal-400 to-blue-500 text-white text-[13px] font-extrabold shadow-sm active:scale-95 transition-transform flex items-center justify-center">
                    {t("auto.ko_0133", "가상 투입")}</button>
                  {selectedHotplace.category === 'attraction' && (
                    <a
                      href={`https://www.klook.com/ko/search/result/?query=${encodeURIComponent(selectedHotplace.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-[2] py-2.5 rounded-2xl bg-purple-500 text-white text-[13px] font-extrabold shadow-sm flex items-center justify-center active:scale-95 transition-transform gap-1"
                    >
                      {t("auto.ko_0134", "🎫 예매")}</a>
                  )}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedHotplace.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-[2] py-2.5 rounded-2xl bg-orange-500 text-white text-[13px] font-extrabold shadow-sm flex items-center justify-center active:scale-95 transition-transform gap-1"
                  >
                    {t("auto.ko_0135", "🗺️ 지도")}</a>
                </div>
              </div>
            </motion.div>}
        </AnimatePresence>

        {/* Selected Community Post Card */}
        <AnimatePresence>
          {selectedPost && <motion.div className="absolute left-4 right-4 z-30" style={{ bottom: "calc(95px + env(safe-area-inset-bottom, 0px))" }} initial={{
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
              <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-3 shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-black/5 dark:border-white/5 flex items-center gap-3 transition-transform">
                <div className="relative shrink-0 truncate">
                  {selectedPost.imageUrl ? (
                    <img src={selectedPost.imageUrl} className="w-[60px] h-[60px] rounded-full object-cover shadow-sm cursor-pointer" onClick={() => setSelectedPost(null)} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-[60px] h-[60px] rounded-full bg-green-100 flex items-center justify-center text-2xl shadow-sm border-2 border-white dark:border-zinc-800 cursor-pointer" onClick={() => setSelectedPost(null)}>📸</div>
                  )}
                </div>
                <div className="flex-1 min-w-0 px-1 truncate" onClick={() => setSelectedPost(null)}>
                  <p className="text-[13px] font-bold text-foreground line-clamp-1 leading-tight mb-0.5">{selectedPost.content}</p>
                  <p className="text-[12px] text-muted-foreground truncate flex items-center gap-1">
                    <img src={selectedPost.photo} className="w-3.5 h-3.5 rounded-full object-cover inline-block" />
                    {selectedPost.author} · {selectedPost.locationName}
                  </p>
                  {/* 좋아요 / 댓글 수 */}
                  <div className="flex items-center gap-3 mt-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleLikePost(selectedPost.id); }}
                      className={`flex items-center gap-1 text-[11px] font-bold transition-colors ${selectedPost.liked ? 'text-rose-500' : 'text-muted-foreground'}`}
                    >
                      <Heart size={12} className={selectedPost.liked ? 'fill-rose-500' : ''} />
                      {selectedPost.likes ?? 0}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setCommentPostMap(selectedPost); }}
                      className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground"
                    >
                      💬 {selectedPost.comments ?? 0}
                    </button>
                  </div>
                  {(() => {
                    const lat = selectedPost.location?.lat || selectedPost.lat;
                    const lng = selectedPost.location?.lng || selectedPost.lng;
                    if (!myLatLngRef.current || !lat || !lng) return null;
                    const d = calcDist(myLatLngRef.current.lat, myLatLngRef.current.lng, lat, lng);
                    const walkTime = Math.max(1, Math.ceil((d * 1000) / 75));
                    return (
                      <div className="flex items-center gap-1.5 text-[12px] font-bold text-teal-500 mt-1">
                        <span>📍 {distLabel(d)}</span>
                        <span className="truncate">{t("auto.ko_0136", "· 🚶 도보 약")}{walkTime}{t("auto.ko_0137", "분")}</span>
                      </div>
                    );
                  })()}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0 truncate">
                  <button onClick={() => {
                      const idx = communityPosts.findIndex(p => p.id === selectedPost.id);
                      if (idx !== -1) setActiveStoryIndex(idx);
                    }} className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 text-white text-[11px] font-extrabold shadow-[0_2px_10px_rgba(45,212,191,0.3)] whitespace-nowrap active:scale-95 transition-all w-full">
                    {t("auto.ko_0138", "자세히")}</button>
                  {((selectedPost.location?.lat && selectedPost.location?.lng) || (selectedPost.lat && selectedPost.lng)) && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPost.locationTag?.name || selectedPost.locationName || `${selectedPost.location?.lat || selectedPost.lat},${selectedPost.location?.lng || selectedPost.lng}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-1.5 rounded-xl bg-orange-500 text-white text-[11px] font-extrabold shadow-[0_2px_10px_rgba(249,115,22,0.3)] flex items-center justify-center gap-1 active:scale-95 transition-transform w-full"
                    >
                      {t("auto.ko_0139", "구글 지도")}</a>
                  )}
                </div>
              </div>
            </motion.div>}
        </AnimatePresence>



        {/* Selected Trip Group Card */}
        <GroupSheet
          selectedGroup={selectedGroup}
          setSelectedGroup={setSelectedGroup}
          myLatLngRef={myLatLngRef}
          calcDist={calcDist}
          distLabel={distLabel}
        />

        {/* Default bottom card if none selected */}
        {displayMode === "travelers" && !selectedTraveler && travelers.length > 0 && <div className="absolute left-4 right-4 z-30" style={{ bottom: "calc(95px + env(safe-area-inset-bottom, 0px))" }}>
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
              <button onClick={() => setProfileDetail(travelers[0])} className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-xs font-semibold shadow-card transition-transform active:scale-95">{t("map.profile")}</button>
            </div>
          </div>}

        {/* FAB Container */}
        <div 
          className="absolute right-4 z-30 flex flex-col gap-3 items-end transition-all duration-300 pointer-events-none"
          style={{ 
            bottom: (selectedTraveler || selectedHotplace || selectedPost || selectedGroup || selectedRestaurant) 
              ? "calc(250px + env(safe-area-inset-bottom, 0px))" 
              : ((displayMode === "travelers" && travelers.length > 0) ? "calc(180px + env(safe-area-inset-bottom, 0px))" : "calc(85px + env(safe-area-inset-bottom, 0px))") 
          }}
        >
          {/* Create Group FAB - absolute right bottom right above re-center */}
          <AnimatePresence>
            {displayMode === "groups" && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => setShowGroupCreate(true)}
                className="bg-amber-500 rounded-full p-3.5 shadow-float border-2 border-white transition-transform active:scale-90 pointer-events-auto"
              >
                <Plus size={24} className="text-white" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Re-center FAB - right bottom fixed */}
          <button
            onClick={handleReCenter}
            className="bg-card rounded-2xl p-3 shadow-float border border-border transition-transform active:scale-90 pointer-events-auto"
          >
            <Navigation size={18} className={`text-primary ${centerAnim ? 'animate-pulse' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Profile Detail Bottom Sheet ─── */}
      <TravelerSheet
        profileDetail={profileDetail}
        setProfileDetail={setProfileDetail}
        translatedBio={translatedBio}
        setTranslatedBio={setTranslatedBio}
        handleTranslateBio={handleTranslateBio}
        isTranslating={isTranslating}
        liked={liked}
        handleLike={handleLike}
      />

      {/* Filter Drawer */}
      <AnimatePresence>
        {showFilter && <motion.div className="fixed inset-0 z-50 flex items-end justify-center px-safe pb-safe pt-safe" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }}>
            <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowFilter(false)} />
            <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 p-6 pb-20 shadow-float" initial={{
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
                <h3 className="text-lg font-extrabold text-foreground truncate">{t("map.mapFilter")}</h3>
                <button onClick={() => setShowFilter(false)}><X size={20} className="text-muted-foreground" /></button>
              </div>

              {/* Distance */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-bold text-foreground">{t("map.distanceRadius")}</label>
                  <span className="text-sm font-bold text-primary">{maxDistance}km</span>
                </div>
                <input type="range" min={1} max={50} value={maxDistance} onChange={e => setMaxDistance(Number(e.target.value))} className="w-full accent-primary" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>1km</span><span>50km</span>
                </div>
              </div>

              {/* Travel Style Tags */}
              <div className="mb-6">
                <label className="text-sm font-bold text-foreground mb-3 block">{t("map.travelStyle")}</label>
                <div className="flex flex-wrap gap-2">
                  {tagOptions.map(tag => <button key={tag} onClick={() => toggleTag(tag)} className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${selectedTags.includes(tag) ? "gradient-primary text-primary-foreground shadow-card" : "bg-muted text-muted-foreground"}`}>
                      {tag}
                    </button>)}
                </div>
              </div>

              {/* User Demographics */}
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-foreground mb-3 block">{t("auto.ko_0140", "성별 선호 (Gender)")}</label>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => setGenderFilter("all")} className={`py-2 rounded-2xl text-xs font-semibold transition-all ${genderFilter === "all" ? "gradient-primary text-primary-foreground shadow-card border-none" : "bg-muted text-muted-foreground border border-border/50"}`}>{t("auto.ko_0141", "모든 성별")}</button>
                    <button onClick={() => setGenderFilter("same")} className={`py-2 rounded-2xl text-xs font-semibold transition-all ${genderFilter === "same" ? "gradient-primary text-primary-foreground shadow-card border-none" : "bg-muted text-muted-foreground border border-border/50"}`}>{t("auto.ko_0142", "동성만 보기")}</button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-foreground mb-3 block">{t("auto.ko_0143", "연령대 (Age)")}</label>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => setAgeFilter("all")} className={`py-2 rounded-2xl text-xs font-semibold transition-all ${ageFilter === "all" ? "gradient-primary text-primary-foreground shadow-card border-none" : "bg-muted text-muted-foreground border border-border/50"}`}>{t("auto.ko_0144", "연령 무관")}</button>
                    <button onClick={() => setAgeFilter("2030")} className={`py-2 rounded-2xl text-xs font-semibold transition-all ${ageFilter === "2030" ? "gradient-primary text-primary-foreground shadow-card border-none" : "bg-muted text-muted-foreground border border-border/50"}`}>{t("auto.ko_0145", "20~30대만")}</button>
                  </div>
                </div>
              </div>

              {/* Ghost Mode (Location Sharing) */}
              <div className="mb-6 flex items-center justify-between bg-muted/30 p-4 rounded-2xl border border-border/50">
                <div>
                  <label className="text-sm font-bold text-foreground block">{t("auto.ko_0146", "고스트 모드 (위치 숨기기)")}</label>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{t("auto.ko_0147", "내 위치를 지도에 표시하지 않습니다")}</p>
                </div>
                <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${!locationSharing ? 'bg-primary' : 'bg-muted-foreground/30'}`} onClick={() => setLocationSharing(!locationSharing)}>
                  <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-sm" animate={{ x: !locationSharing ? 24 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => {
              setSelectedTags([]);
              setMaxDistance(10);
              setAgeFilter("all");
              setGenderFilter("all");
            }} className="flex-1 py-3 rounded-2xl border border-border text-foreground font-semibold text-sm">{t("map.reset")}</button>
                <button onClick={() => {
              setShowFilter(false);
              toast({
                title: t("map.filterApplied"),
                description: t("auto.t_0016", `${maxDistance}km 반경 필터 적용됨`)
              });
            }} className="flex-1 py-3 rounded-2xl gradient-primary text-primary-foreground font-semibold text-sm shadow-card flex items-center justify-center gap-2">
                  <Check size={16} />{t("map.apply")}</button>
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      {/* Right Now Modal */}
      {/* Lightning Match Modal */}
      <AnimatePresence>
        {showRightNowModal && <motion.div className="fixed inset-0 z-[70] flex items-end justify-center px-4 pb-safe pt-safe pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={() => setShowRightNowModal(false)} />
            <motion.div className="relative z-10 w-full max-w-md mx-auto bg-card rounded-3xl shadow-float overflow-hidden flex flex-col mb-24 sm:mb-28 pointer-events-auto" style={{ maxHeight: '75dvh' }} initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", damping: 26, stiffness: 300 }}>
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>
              <div className="px-5 py-3 flex-shrink-0 flex items-center justify-between border-b border-border/50">
                <div>
                  <h3 className="text-xl font-extrabold text-foreground flex items-center gap-2 truncate">
                    <Zap className="text-amber-500 fill-amber-500" size={20} />
                    {t("auto.ko_0148", "당장 핫플 번개 ⚡")}</h3>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{t("map.lightningMatchDesc")}</p>
                </div>
                <button onClick={() => setShowRightNowModal(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>
              <div className="overflow-y-auto px-5 py-4 pb-12 space-y-3 truncate">
                 {HOTPLACES.map(h => (
                   <button key={`h_sel_${h.id}`} onClick={() => handleLightningMatch(h)} className="w-full bg-muted/30 border border-border/50 hover:bg-amber-500/10 hover:border-amber-500/30 p-4 rounded-2xl flex items-center gap-4 transition-all text-left">
                     <span className="text-3xl">{h.emoji}</span>
                     <div>
                       <h4 className="font-bold text-foreground text-base tracking-tight">{h.name}</h4>
                       <p className="text-xs text-muted-foreground mt-0.5">{h.country} · {h.cities.join(', ')}</p>
                     </div>
                   </button>
                 ))}
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      <AnimatePresence>
        {isMatchingLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(245,158,11,0.5)] mb-6">
               <Zap className="text-white fill-white" size={40} />
            </div>
            <h2 className="text-2xl font-extrabold text-foreground mb-2 truncate">{t("map.lightningMatchTitle")}</h2>
            <p className="text-sm font-semibold text-muted-foreground animate-pulse truncate">{t("map.lightningMatchProgress1")}<br/>{t("map.lightningMatchProgress2")}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Profile Sheet */}
      <AnimatePresence>
        {showMyProfile && <motion.div className="fixed inset-0 z-[60] flex items-end justify-center px-safe pb-safe pt-safe" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }}>
            <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowMyProfile(false)} />
            <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 shadow-float overflow-hidden" initial={{
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
              <div className="flex items-center gap-4 px-5 py-4 truncate">
                {myProfilePhoto || user?.photoUrl ? <img src={myProfilePhoto || user?.photoUrl} alt={t("auto.x4029")} className="w-16 h-16 rounded-2xl object-cover border-2 border-primary shadow-card" /> : <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white font-extrabold text-2xl truncate">
                    {user?.name?.[0] ?? t("map.me")}
                  </div>}
                <div className="flex-1">
                  <p className="font-extrabold text-foreground text-base truncate">{user?.name ?? t("map.me")}</p>
                  <p className="text-xs text-muted-foreground">{currentLocationName}</p>
                </div>
              </div>
              <div className="px-5 pb-8 flex gap-3">
                <button onClick={() => {
              setShowMyProfile(false);
              navigate("/profile");
            }} className="flex-1 py-3 rounded-2xl gradient-primary text-primary-foreground font-bold text-sm shadow-card transition-transform active:scale-95">{t("map.viewProfile")}</button>
                <button onClick={() => setShowMyProfile(false)} className="w-12 py-3 rounded-2xl bg-muted flex items-center justify-center">
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      <AnimatePresence>
        {showGroupCreate && (
          <motion.div className="fixed inset-0 z-[110] bg-background" initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}>
             <CreateTripPage onClose={() => setShowGroupCreate(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <GroupDetailFilter 
        open={showGroupDetailFilter} 
        onClose={() => setShowGroupDetailFilter(false)} 
        value={groupDetailFilter} 
        onChange={setGroupDetailFilter} 
        checkInCity={checkInCity} 
      />

      {activeStoryIndex !== null && (
        <StoryViewer
          posts={communityPosts}
          initialIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
          onLike={(postId) => handleLikePost(postId)}
          onComment={(post) => setCommentPostMap(post)}
          onAuthorClick={() => setActiveStoryIndex(null)}
          onMoreClick={(post) => setActionSheetTarget(post)}
        />
      )}

      {/* Action Sheet for Story/Community Posts */}
      {actionSheetTarget && (
        <ReportBlockActionSheet
          isOpen={true}
          onClose={() => setActionSheetTarget(null)}
          targetType="post"
          targetId={actionSheetTarget.id}
          targetName={actionSheetTarget.author}
          authorId={actionSheetTarget.authorId}
        />
      )}

      {/* Comment Modal for Map Photo Feed */}
      {commentPostMap && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center" onClick={() => { setCommentPostMap(null); setMapCommentText(""); }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg mx-auto bg-card rounded-t-3xl px-5 pt-4 pb-8 shadow-float"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm font-bold text-foreground mb-3 line-clamp-1">{t("auto.ko_0149", "💬 댓글 달기 —")}{commentPostMap.content}</p>
            <div className="flex gap-2">
              <input
                autoFocus
                value={mapCommentText}
                onChange={e => setMapCommentText(e.target.value)}
                onKeyDown={async e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    await handleCommentPost(commentPostMap.id, mapCommentText);
                    setCommentPostMap(null);
                    setMapCommentText("");
                  }
                }}
                placeholder={t("auto.ko_0227", "댓글을 입력하세요...")}
                className="flex-1 px-4 py-3 rounded-2xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary"
              />
              <button
                onClick={async () => {
                  await handleCommentPost(commentPostMap.id, mapCommentText);
                  setCommentPostMap(null);
                  setMapCommentText("");
                }}
                disabled={!mapCommentText.trim()}
                className="px-4 py-3 rounded-2xl gradient-primary text-primary-foreground text-sm font-bold disabled:opacity-40 transition-all active:scale-95"
              >
                {t("auto.ko_0150", "전송")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Flight Trends Drawer */}
      <AnimatePresence>
        {showFlightTrends && (
          <motion.div className="fixed inset-0 z-[110] flex items-end justify-center px-0 pb-0 pt-safe font-sans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFlightTrends(false)} />
            <motion.div className="relative w-full max-w-lg mx-auto bg-card rounded-t-[32px] overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col" style={{ maxHeight: '85vh' }} initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}>
              
              {/* Drawer Header */}
              <div className="flex justify-center pt-3 pb-2 flex-shrink-0 bg-card z-10 w-full relative">
                <div className="absolute top-4 left-5 flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                </div>
                <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
                <button onClick={() => setShowFlightTrends(false)} className="absolute top-2.5 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-muted">
                   <X size={14} className="text-muted-foreground" />
                </button>
              </div>

              {/* Title Area */}
              <div className="px-6 py-4 flex-shrink-0">
                 <h2 className="text-2xl font-black text-foreground tracking-tight leading-tight truncate">
                   {t("auto.ko_0151", "이번 달 가장 저렴한")}<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600 truncate">{t("auto.ko_0152", "항공권 핫딜 & 트렌드 ✈️")}</span>
                 </h2>
                 <p className="text-sm font-semibold text-muted-foreground mt-2 truncate">{t("auto.ko_0153", "여행 떠나기 좋은 최적의 시기를 확인하세요.")}</p>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 pb-safe pt-2 space-y-8">
                
                {/* Chart Section */}
                <div className="bg-muted/30 p-5 rounded-3xl border border-border/50">
                   <div className="flex justify-between items-end mb-6">
                     <div>
                       <p className="text-[11px] font-black text-indigo-500 mb-1 tracking-widest uppercase">Price Trend</p>
                       <h3 className="text-lg font-bold text-foreground truncate">{t("auto.ko_0154", "서울 ➔ 일본 (왕복)")}</h3>
                     </div>
                     <div className="text-right">
                       <p className="text-[10px] font-bold text-muted-foreground mb-0.5 truncate">{t("auto.ko_0155", "평균 예상가")}</p>
                       <p className="text-xl font-black text-foreground">₩210,000</p>
                     </div>
                   </div>

                   {/* Mock Bar Chart */}
                   <div className="h-32 flex items-end justify-between gap-2 px-1 relative truncate">
                     {/* Horizontal Dashed Lines */}
                     <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none opacity-20">
                       <div className="border-t-2 border-dashed border-border w-full"></div>
                       <div className="border-t-2 border-dashed border-border w-full"></div>
                       <div className="border-t-2 border-dashed border-border w-full"></div>
                     </div>
                     
                     {/* Bars */}
                     {[
                       { month: t("auto.ko_0228", "1월"), p: 80 }, { month: t("auto.ko_0229", "2월"), p: 90 }, { month: t("auto.ko_0230", "3월"), p: 40, isLow: true },
                       { month: t("auto.ko_0231", "4월"), p: 60 }, { month: t("auto.ko_0232", "5월"), p: 85 }, { month: t("auto.ko_0233", "6월"), p: 55 }
                     ].map((item, i) => (
                       <div key={i} className="flex flex-col items-center gap-2 z-10 flex-1 group">
                         <div className="w-full bg-border rounded-t-lg overflow-hidden relative flex items-end" style={{ height: '90px' }}>
                           <motion.div 
                             initial={{ height: 0 }} 
                             animate={{ height: `${item.p}%` }} 
                             transition={{ duration: 0.5, delay: i * 0.05 }}
                             className={`w-full rounded-t-md transition-all ${item.isLow ? 'bg-gradient-to-t from-sky-400 to-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-muted-foreground/30 group-hover:bg-muted-foreground/50'}`} 
                           />
                         </div>
                         <span className={`text-[10px] font-bold ${item.isLow ? 'text-indigo-500' : 'text-muted-foreground'}`}>{item.month}</span>
                       </div>
                     ))}
                   </div>
                   
                   <div className="mt-4 pt-4 border-t border-border/50 text-center">
                     <p className="text-[13px] font-bold text-foreground truncate">💡 <span className="text-indigo-500 truncate">{t("auto.ko_0156", "3월")}</span>{t("auto.ko_0157", "에 떠나는 것이 가장 저렴해요!")}</p>
                   </div>
                </div>

                {/* Deals Sliding Row */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-extrabold text-foreground truncate">{t("auto.ko_0158", "🔥 지금 뜨는 특가")}</h3>
                    <button className="text-[11px] font-bold text-indigo-500">{t("auto.ko_0159", "모두 보기")}</button>
                  </div>
                  
                  <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-6 px-6 pb-4 truncate">
                    {[
                      { dest: t("auto.ko_0234", "도쿄, 일본"), price: '₩185,000', img: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=400', date: '3.12 - 3.15' },
                      { dest: t("auto.ko_0235", "다낭, 베트남"), price: '₩210,000', img: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&q=80&w=400', date: '4.01 - 4.05' },
                      { dest: t("auto.ko_0236", "타이베이, 대만"), price: '₩235,000', img: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&q=80&w=400', date: '3.20 - 3.24' },
                    ].map((deal, i) => (
                      <motion.div key={i} whileHover={{ scale: 1.02 }} className="w-36 shrink-0 relative rounded-2xl overflow-hidden shadow-sm border border-border/50 bg-card group">
                        <img src={deal.img} className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                           <p className="text-[10px] font-bold text-white/80 mb-0.5">{deal.date}</p>
                           <p className="text-xs font-black text-white truncate">{deal.dest}</p>
                           <p className="text-[14px] font-extrabold text-sky-300 mt-0.5">{deal.price}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="pb-10 pt-2">
                   <button onClick={() => toast({ title: t("auto.g_0038", "안내"), description: t("auto.g_0039", "스카이스캐너 연동 준비 중입니다.") })} className="w-full py-4 rounded-2xl bg-foreground text-background font-black text-[15px] shadow-lg shadow-foreground/20 active:scale-95 transition-transform flex justify-center items-center gap-2">
                     <Plane size={18} /> {t("auto.ko_0160", "항공권 최저가 검색하기")}</button>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lodging Trends Drawer */}
      <AnimatePresence>
        {showLodgingTrends && (
          <motion.div className="fixed inset-0 z-[110] flex items-end justify-center px-0 pb-0 pt-safe font-sans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLodgingTrends(false)} />
            <motion.div className="relative w-full max-w-lg mx-auto bg-card rounded-t-[32px] overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col" style={{ maxHeight: '85vh' }} initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}>
              
              {/* Drawer Header */}
              <div className="flex justify-center pt-3 pb-2 flex-shrink-0 bg-card z-10 w-full relative">
                <div className="absolute top-4 left-5 flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-pink-400"></div>
                </div>
                <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
                <button onClick={() => setShowLodgingTrends(false)} className="absolute top-2.5 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-muted">
                   <X size={14} className="text-muted-foreground" />
                </button>
              </div>

              {/* Title Area */}
              <div className="px-6 py-4 flex-shrink-0">
                 <h2 className="text-2xl font-black text-foreground tracking-tight leading-tight truncate">
                   {t("auto.ko_0161", "머물기 좋은 요즘 뜨는")}<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-600 truncate">{t("auto.ko_0162", "숙소 & 에어비앤비 특가 🛏️")}</span>
                 </h2>
                 <p className="text-sm font-semibold text-muted-foreground mt-2 truncate">{t("auto.ko_0163", "다른 예약 앱보다 저렴한 Migo 전용 특가를 만나보세요.")}</p>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 pb-safe pt-2 space-y-8">
                
                {/* Highlight Section */}
                <div className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 p-5 rounded-3xl border border-rose-500/20 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                     <span className="text-6xl text-rose-500">🏨</span>
                   </div>
                   <div className="relative z-10">
                     <p className="text-[11px] font-black text-rose-500 mb-1 tracking-widest uppercase">Migo Exclusives</p>
                     <h3 className="text-lg font-bold text-foreground truncate">{t("auto.ko_0164", "인기 숙소 20% 추가 할인")}</h3>
                     <p className="text-xs text-muted-foreground mt-1 mb-4 truncate">{t("auto.ko_0165", "현재 위치 주변의 숙소를 Migo 코드로 예약하면")}<br/>{t("auto.ko_0166", "즉시 현장 할인이 적용됩니다.")}</p>
                     
                     <div className="flex items-center gap-3">
                       <div className="bg-card w-full rounded-xl px-4 py-3 flex items-center justify-between shadow-sm border border-border/50">
                         <span className="text-sm font-bold tracking-widest text-foreground">MIGO20SALE</span>
                         <button onClick={() => toast({ title: t("auto.g_0040", "클립보드에 복사되었습니다.") })} className="text-[11px] font-black text-rose-500 bg-rose-500/10 px-3 py-1.5 rounded-lg active:scale-95 transition-transform">{t("auto.ko_0167", "복사")}</button>
                       </div>
                     </div>
                   </div>
                </div>

                {/* Hot Airbnb / Hotels Rolling */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-extrabold text-foreground truncate">{t("auto.ko_0168", "🔥 Migo가 찜한 추천 숙소")}</h3>
                    <button className="text-[11px] font-bold text-rose-500">{t("auto.ko_0169", "더 보기")}</button>
                  </div>
                  
                  <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-6 px-6 pb-4 truncate">
                    {[
                      { type: t("auto.ko_0237", "에어비앤비"), name: t("auto.ko_0238", "자양동 루프탑 게스트하우스"), price: t("auto.ko_0239", "₩55,000 / 박"), img: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=400', rating: 4.8 },
                      { type: t("auto.ko_0240", "부티크 호텔"), name: t("auto.ko_0241", "스테이 Migo 오리지널스"), price: t("auto.ko_0242", "₩120,000 / 박"), img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400', rating: 4.9 },
                      { type: t("auto.ko_0243", "리조트/팬션"), name: t("auto.ko_0244", "프라이빗 풀빌라 & 스파"), price: t("auto.ko_0245", "₩215,000 / 박"), img: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&q=80&w=400', rating: 4.7 },
                    ].map((deal, i) => (
                      <motion.div key={i} whileHover={{ scale: 1.02 }} className="w-48 shrink-0 relative flex flex-col gap-2 group cursor-pointer">
                        <div className="w-full h-32 rounded-2xl overflow-hidden shadow-sm border border-border/50 relative">
                          <img src={deal.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-white">⭐ {deal.rating}</div>
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold text-rose-500 mb-0.5">{deal.type}</p>
                          <p className="text-sm font-bold text-foreground line-clamp-1">{deal.name}</p>
                          <p className="text-xs font-black text-muted-foreground mt-0.5">{deal.price}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="pb-10 pt-2">
                   <button onClick={() => toast({ title: t("auto.g_0041", "안내"), description: t("auto.g_0042", "아고다 및 에어비앤비 제휴 연동 준비 중입니다.") })} className="w-full py-4 rounded-2xl border-2 border-foreground text-foreground font-black text-[15px] hover:bg-foreground hover:text-background active:scale-95 transition-all flex justify-center items-center gap-2">
                     {t("auto.ko_0170", "숙소 특가 검색하기")}</button>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>;
};
export default MapPage;