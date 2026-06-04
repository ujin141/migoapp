import i18n from "@/i18n";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Browser } from "@capacitor/browser"; // w3 Guideline 3.2: ?몄빋 釉뚮씪?곗?濡??몃? URL 爾먮━
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Heart, Star, SlidersHorizontal, Check, Bell, Zap, Crown, Lock, Navigation, ShoppingBag, MapPin, Globe } from "lucide-react";
import SwipeCard from "@/components/SwipeCard";
import MatchModal from "@/components/MatchModal";
import MigoPlusModal from "@/components/MigoPlusModal";
import InAppNotifBanner, { InAppNotifData } from "@/components/InAppNotifBanner";
import siteLogo from "@/assets/site-logo.png";
import PageGuide from "@/components/PageGuide";
import TopHeader from "@/components/TopHeader";
import { toast } from "@/hooks/use-toast";
import { useChatContext } from "@/context/ChatContext";
import { useNotifications } from "@/context/NotificationContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { fetchActiveAdsForScreen, recordAdImpression, recordAdClick } from "@/lib/adService";
import { supabase, getCached, setCache } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import ReportBlockActionSheet from "@/components/ReportBlockActionSheet";
import CheckInModal from "@/components/CheckInModal";
import { getMyCheckIn, CheckIn } from "@/lib/checkInService";
import MatchResultCard from "@/components/MatchResultCard";
import { recordSwipe, personalize } from "@/lib/personalizeService";
import { requestNotificationPermission, notifyMatch } from "@/lib/notificationService";
import { MoreHorizontal } from "lucide-react";
import { MissionModal, LikePopupModal, PassPopupModal, SuperLikeModal, LoginGateModal, FilterModal } from "./match/MatchModals";
import { useAdMob } from "@/hooks/useAdMob";
import { triggerHaptic } from "@/lib/haptics";
import { sendMatchPush, sendLikePush } from "@/lib/pushService";

const hasProfilePhoto = (profile: any) =>
  !!profile?.photo_url || (Array.isArray(profile?.photo_urls) && profile.photo_urls.length > 0);

const MatchPage = () => {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const {
    addUnread
  } = useChatContext();
  const {
    unreadCount,
    profileViewBanner,
    clearProfileViewBanner,
    likeBanner,
    clearLikeBanner,
  } = useNotifications();
  const {
    isPlus,
    isPremium,
    superLikesLeft,
    boostActive,
    boostSecondsLeft,
    startBoost,
    consumeSuperLike,
    addSuperLikes,
    canGlobalMatch,
    canTravelDNAFull,
    dailyLikeLimit,
  } = useSubscription();
  const {
    user
  } = useAuth();
  const [showPlusModal, setShowPlusModal] = useState(false);
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [actionSheetProfile, setActionSheetProfile] = useState<any>(null);
  // ?뺚?GPS 泥댄겕???뺚?
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [activeCheckIn, setActiveCheckIn] = useState<CheckIn | null>(null);
  // ?뺚?Daily Mission (?ㅻ뒛??紐⑹쟻) ?뺚?
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [myDailyMission, setMyDailyMission] = useState<string>("");
  const [checkInCityTravelers, setCheckInCityTravelers] = useState<any[]>([]);

  // ?? AdMob ??
  const { showInterstitial, showRewarded } = useAdMob();
  // QUAL-8 fix: ?뱀씪 ?좎쭨 湲곗? sessionStorage??swipeCount ?좎?
  // ???ъ떆?????ㅼ닔濡?3?뚮쭏???꾨㈃愿묎퀬 ?쒖떆?섎뒗 AdMob ?뺤쑀 ?꾨컲 諛⑹?
  const [swipeCount, setSwipeCount] = useState(() => {
    try {
      const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
      const stored = sessionStorage.getItem('migo_swipe_count');
      if (!stored) return 0;
      const parsed = JSON.parse(stored);
      return parsed.date === today ? (parsed.count || 0) : 0;
    } catch {
      return 0;
    }
  });
  const [showRewardedAdOffer, setShowRewardedAdOffer] = useState(false);
  const [showBoostAdOffer, setShowBoostAdOffer] = useState(false);
  // ?? 遺?ㅽ듃 ?쒖꽦???뚮옒???④낵 ??
  const [boostJustActivated, setBoostJustActivated] = useState(false);
  const [showPeakBanner, setShowPeakBanner] = useState(true);

  // QUAL-8 fix: swipeCount 蹂寃???sessionStorage???뱀씪 ?좎쭨? ?④퍡 ???
  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      sessionStorage.setItem('migo_swipe_count', JSON.stringify({ date: today, count: swipeCount }));
    } catch { /* sessionStorage ?⑸웾 珥덇낵 ??臾댁떆 */ }
  }, [swipeCount]);

  useEffect(() => {
    if (user) {
      getMyCheckIn(user.id).then(ci => {
        if (ci) setActiveCheckIn(ci);
      });
      // ?뚮┝ 沅뚰븳 ?붿껌 (泥섏쓬 諛⑸Ц ??
      requestNotificationPermission();

      // ?ㅻ뒛??誘몄뀡 ?ㅼ젙 泥댄겕
      const today = new Date().toISOString().split('T')[0];
      const savedMissionDate = localStorage.getItem('migo_mission_date');
      if (savedMissionDate !== today) {
        // ?꾩쭅 ?ㅻ뒛 誘몄뀡???ㅼ젙 ????
        setShowMissionModal(true);
      } else {
        setMyDailyMission(localStorage.getItem('migo_today_mission') || "");
      }
    }
  }, [user]);

  const selectDailyMission = async (mission: string) => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('migo_mission_date', today);
    localStorage.setItem('migo_today_mission', mission);
    setMyDailyMission(mission);
    setShowMissionModal(false);
    
    if (user) {
      await supabase.from('profiles').update({ travel_mission: mission }).eq('id', user.id);
      toast({
        title: t("auto.g_0044", "?ㅻ뒛???ы뻾 紐⑹쟻???ㅼ젙?섏뿀?듬땲???렞"),
      });
    }
  };

  // ?뺚??꾪꽣 紐⑤떖 (?⑥씪 ?듯빀 ?꾪꽣) ?뺚?
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterAge, setFilterAge] = useState<[number, number]>([18, 45]);
  const [filterDistance, setFilterDistance] = useState(9999); // 湲곕낯媛? ?꾩껜 (嫄곕━ ?쒗븳 ?놁쓬)
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');
  const [filterMbti, setFilterMbti] = useState<string[]>([]);
  const [filterLanguages, setFilterLanguages] = useState<string[]>([]);
  const [filterTravelStyle, setFilterTravelStyle] = useState<string[]>([]);
  // ?쒖꽦 ?꾪꽣 珥?媛쒖닔
  const totalActiveFilterCount =
    (filterGender !== 'all' ? 1 : 0) +
    (filterDistance !== 9999 ? 1 : 0) +
    filterMbti.length +
    filterLanguages.length +
    filterTravelStyle.length +
    (filterAge[0] !== 18 || filterAge[1] !== 45 ? 1 : 0);
  // SEC-2 fix: localStorage 議곗옉?쇰줈 ?몄쬆 ?고쉶 遺덇? ??Supabase ?몄뀡留??좊ː
  const isLoggedIn = useCallback(() => !!user, [user]);
  const requireLogin = useCallback(() => {
    setShowLoginGate(true);
    return false;
  }, []);

  // In-app notification banner
  const [inAppNotif, setInAppNotif] = useState<InAppNotifData | null>(null);
  const [ads, setAds] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  // ?ㅼ떆媛??⑤씪???곹깭 留?{ userId -> { isOnline, lastSeen } }
  const [onlineMap, setOnlineMap] = useState<Record<string, { isOnline: boolean; lastSeen: string | null }>>({});
  const [pendingLikers, setPendingLikers] = useState<any[]>([]); // ?섎? ?쇱씠?ы븳 ?щ엺
  const [dailyLikesUsed, setDailyLikesUsed] = useState(0); // ?ㅻ뒛 蹂대궦 ?쇱씠????
  const [hasMyGps, setHasMyGps] = useState(true); // ???꾩튂 ?뺣낫媛 ?덈뒗吏 ?щ?
  const DAILY_LIKE_LIMIT = dailyLikeLimit; // SubscriptionContext 湲곗?: free=10, plus=?? premium=??
  
  const matchTimersRef = useRef<{ timeouts: any[] }>({ timeouts: [] });
  const showMatchRef = useRef(false);
  // MatchPage-TIMER fix: fetchProfiles ??likeReset ??대㉧瑜?ref濡?愿由?(async ?⑥닔 ??return cleanup 遺덇?)
  const likeResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runAfterSwipe = useCallback((task: () => void) => {
    window.setTimeout(() => {
      const requestIdle = (window as any).requestIdleCallback;
      if (typeof requestIdle === "function") {
        requestIdle(task, { timeout: 800 });
      } else {
        task();
      }
    }, 0);
  }, []);
  const showInterstitialAfterSwipe = useCallback(() => {
    window.setTimeout(() => showInterstitial(), 420);
  }, [showInterstitial]);

  useEffect(() => {
    const timers = matchTimersRef.current;
    return () => {
      timers.timeouts.forEach(clearTimeout);
    };
  }, []);
  useEffect(() => {
    fetchActiveAdsForScreen("MatchPage").then(setAds);
    let isMounted = true;
    const fetchProfiles = async () => {
      if (!user) return;



      if (!isMounted) return;
      const ratingsMap: Record<string, { sum: number; count: number; }> = {};

      // ???꾨줈???뺣낫 (matchScore 怨꾩궛 湲곗?)
      const {
        data: me
      } = await supabase.from('profiles').select('id,name,photo_url,photo_urls,age,bio,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,is_plus,travel_dates,saju_completed,saju_profile,saju_day_master,saju_element').eq('id', user.id).single();

      // ?대? ?ㅼ??댄봽???곷? ID ?섏쭛 (理쒓렐 24?쒓컙 ?대궡 ?곗씠?곕쭔 DB ?덈꺼?먯꽌 ?꾪꽣留?
      if (!isMounted) return;
      const since24hStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const {
        data: swipedData
      } = await supabase.from('likes')
        .select('to_user')
        .eq('from_user', user.id)
        .gte('created_at', since24hStr);
      
      if (!isMounted) return;
      const swipedIds = new Set();
      (swipedData || []).forEach((r: any) => {
        swipedIds.add(r.to_user);
      });

      // **留ㅼ묶???щ엺(梨꾪똿李쎌씠 ?대┛ ?щ엺)**? ?곴뎄?곸쑝濡??ㅼ??댄봽???섏삤硫??덈맖
      const { data: matchData } = await supabase.from('matches')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
        
      if (!isMounted) return;
      (matchData || []).forEach((m: any) => {
        swipedIds.add(m.user1_id === user.id ? m.user2_id : m.user1_id);
      });

      // ?먯떊??DB ?덈꺼?먯꽌 ?뺤떎???쒖쇅 (罹먯떆 ?쒓굅: ?뺤???怨꾩젙??利됯컖 ?щ씪吏?꾨줉)
      const res = await supabase.from('profiles')
        .select('id,name,photo_url,photo_urls,age,bio,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,is_plus,travel_dates,boost_expires_at,new_user_boost_expires_at,travel_mission,visited_countries,user_type,profile_theme,is_banned,banned,setup_complete,is_admin,role,id_verified,trust_score,saju_completed,saju_profile,saju_day_master,saju_element')
        .neq('id', user.id)
        .or('is_banned.is.null,is_banned.eq.false')
        .or('banned.is.null,banned.eq.false')
        .or('is_admin.is.null,is_admin.eq.false')   // ?대뱶誘??쒖쇅
        .neq('role', 'admin')                        // role='admin' ?쒖쇅
        .eq('setup_complete', true)                  // ?꾨줈??誘몄셿???쒖쇅
        .limit(200);
        
      if (!isMounted) return;
      const data = res.data;
      const error = res.error;

      if (!error && data) {
        // 諛⑷툑 遺덈윭???꾨줈????곸옄?ㅻ쭔??meet_reviews 留??좊퀎?섏뿬 媛?몄삤湲?(O(N) ?몃옒??理쒖쟻??
        const profileIds = data.map(p => p.id);
        
        if (profileIds.length > 0) {
          const {
            data: reviewsData
          } = await supabase.from('meet_reviews').select('reviewed_id, rating').in('reviewed_id', profileIds);
          
          if (!isMounted) return;
          if (reviewsData) {
            for (const rv of reviewsData) {
              if (!ratingsMap[rv.reviewed_id]) ratingsMap[rv.reviewed_id] = { sum: 0, count: 0 };
              ratingsMap[rv.reviewed_id].sum += rv.rating || 0;
              ratingsMap[rv.reviewed_id].count += 1;
            }
          }

          // ?? ?⑤씪???곹깭 ?쇨큵 議고쉶 ??
          const { data: onlineData } = await supabase
            .from('online_status')
            .select('user_id, is_online, last_seen')
            .in('user_id', profileIds);
          if (!isMounted) return;
          if (onlineData) {
            const newMap: Record<string, { isOnline: boolean; lastSeen: string | null }> = {};
            for (const os of onlineData) {
              newMap[os.user_id] = { isOnline: !!os.is_online, lastSeen: os.last_seen ?? null };
            }
            if (isMounted) setOnlineMap(newMap);
          }
        }

        // Haversine 嫄곕━ 怨꾩궛
        const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
          const R = 6371;
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLng = (lng2 - lng1) * Math.PI / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        // matchScore: 怨듯넻 interests + languages + mbti 湲곕컲 ?ㅼ젣 怨꾩궛
        const calcScore = (p: any) => {
          if (!me) return 70;
          const myInterests: string[] = me.interests || [];
          const myLangs: string[] = me.languages || [];
          const pInterests: string[] = p.interests || [];
          const pLangs: string[] = p.languages || [];
          const commonInterests = myInterests.filter(i => pInterests.includes(i)).length;
          const commonLangs = myLangs.filter(l => pLangs.includes(l)).length;
          const mbtiBonus = me.mbti && p.mbti && me.mbti === p.mbti ? 5 : 0;
          const commonStyle = myInterests.filter(i => pInterests.includes(i)).length; // Travel style
          const base = 50;
          const score = Math.min(99, base + commonInterests * 8 + commonLangs * 6 + commonStyle * 6 + mbtiBonus);
          return score;
        };

        // ?대? ?ㅼ??댄봽???곷? ?대씪?댁뼵???꾪꽣 + ?뺤? 怨꾩젙 ?댁쨷 ?꾪꽣 + ?대뱶誘?誘몄셿???쒖쇅
        const filtered = data.filter(p =>
          !swipedIds.has(p.id)
          && !p.is_banned
          && !p.banned
          && !p.is_admin               // ?대뱶誘?怨꾩젙 ?쒖쇅 (?댁쨷 ?덉쟾?μ튂)
          && p.role !== 'admin'
          && p.setup_complete === true  // ?꾨줈??誘몄셿???쒖쇅
          && hasProfilePhoto(p)
        );
        // localStorage GPS fallback: DB lat/lng ?놁쑝硫????쒖옉 ????λ맂 醫뚰몴 ?ъ슜
        const myLat = me?.lat || parseFloat(localStorage.getItem('migo_my_lat') || '0') || null;
        const myLng = me?.lng || parseFloat(localStorage.getItem('migo_my_lng') || '0') || null;
        setHasMyGps(!!(myLat && myLng));
        const mapped = filtered.map(p => {
          const distKm = myLat && myLng && p.lat && p.lng ? haversine(myLat, myLng, p.lat, p.lng) : null;
          const score = calcScore(p);
          const isBoosted = p.boost_expires_at && new Date(p.boost_expires_at).getTime() > Date.now();
          const isNewUserBoosted = p.new_user_boost_expires_at && new Date(p.new_user_boost_expires_at).getTime() > Date.now();
          return {
            id: p.id,
            name: p.name || t("match.unknownUser", "Migo User"),
            age: p.age || 25,
            nationality: p.nationality || '',
            gender: p.gender || '',
            location: p.location || t("match.noLocation"),
            distanceKm: distKm,
            distance: distKm !== null ? `${distKm.toFixed(1)}km` : t("map.distanceUnknown"),
            bio: p.bio || t("auto.ko_0247", "안녕하세요"),
            photo: p.photo_url || "",
            photoUrls: p.photo_urls && p.photo_urls.length > 0 ? p.photo_urls : p.photo_url ? [p.photo_url] : [],
            destination: p.location || t("auto.ko_0248", "어딘가"),
            dates: p.travel_dates || t("auto.ko_0249", "미정"),
            tags: p.interests || [],
            travelMission: p.travel_mission || undefined,
            sajuCompleted: !!p.saju_completed,
            sajuProfile: p.saju_profile || null,
            sajuDayMaster: p.saju_day_master || null,
            sajuElement: p.saju_element || null,
            userType: p.user_type || 'traveler', profileTheme: p.profile_theme,
            visitedCountries: p.visited_countries || [],
            matchScore: isBoosted ? score + 1000 : isNewUserBoosted ? score + 500 : score,
            // 遺?ㅽ듃 ?좎? 理쒖긽?????좉퇋 ?좎? 2?쒖쐞 ???쇰컲 留ㅼ묶?먯닔 ??
            verified: !!p.verified || !!p.id_verified,
            verifyLevel: p.verified ? 'gold' as const : p.id_verified ? 'id' as const : 'basic' as const,
            ticketVerified: !!p.id_verified,
            trustScore: p.trust_score ?? 0,
            travelStyle: p.interests || [],
            languages: p.languages || [],
            isPlus: !!p.is_plus,
            isPremium: p.plan === 'premium',
            isAd: false,
            avgRating: ratingsMap[p.id]?.count > 0 ? ratingsMap[p.id].sum / ratingsMap[p.id].count : null,
            reviewCount: ratingsMap[p.id]?.count || 0,
            isOnline: false, // Realtime 援щ룆?먯꽌 ?낅뜲?댄듃??
            lastSeen: null as string | null
          };
        });
        // matchScore ?믪? ???뺣젹
        mapped.sort((a, b) => {
          if (a.sajuCompleted !== b.sajuCompleted) return a.sajuCompleted ? -1 : 1;
          return b.matchScore - a.matchScore;
        });
        // DB媛 鍮꾩뼱?덉쑝硫?(濡쒖뺄 ?섍꼍 ?꾨뱶 ?뚯뒪?몄슜) 鍮?諛곗뿴 ?명똿
        if (mapped.length === 0) {
          setProfiles([]);
        } else {
          setProfiles(personalize(mapped));
        }
        setCurrentIndex(0);
      }

      // ?섎? ?쇱씠?ы뻽吏留??닿? ?꾩쭅 ?ㅼ??댄봽 ?????щ엺 議고쉶
      // BUG-15 fix: ?대? 留ㅼ묶???좎?瑜?matchedIds濡?蹂꾨룄 異붿쟻??liker 紐⑸줉?먯꽌???쒖쇅
      const matchedIds = new Set<string>();
      (matchData || []).forEach((m: any) => {
        matchedIds.add(m.user1_id === user.id ? m.user2_id : m.user1_id);
      });
      const {
        data: likersData
      } = await supabase.from('likes').select('from_user').eq('to_user', user.id).in('kind', ['like', 'superlike']);
      const likerIds = (likersData || []).map((r: any) => r.from_user).filter((id: string) =>
        !swipedIds.has(id) && !matchedIds.has(id) && id !== user.id  // BUG-15: ?대? 留ㅼ묶???좎? ?쒖쇅
      );
      if (likerIds.length > 0) {
        const {
          data: likerProfiles
        } = await supabase.from('profiles').select('id,name,photo_url,photo_urls,age,bio,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,is_plus,travel_dates,travel_mission,visited_countries,user_type,profile_theme,id_verified,trust_score,saju_completed,saju_profile,saju_day_master,saju_element,setup_complete').eq('setup_complete', true).or('is_banned.is.null,is_banned.eq.false').or('banned.is.null,banned.eq.false').in('id', likerIds);
        if (likerProfiles) {
          const { data: likerReviews } = await supabase.from('meet_reviews').select('reviewed_id, rating').in('reviewed_id', likerIds);
          if (likerReviews) {
            for (const rv of likerReviews) {
              if (!ratingsMap[rv.reviewed_id]) ratingsMap[rv.reviewed_id] = { sum: 0, count: 0 };
              ratingsMap[rv.reviewed_id].sum += rv.rating || 0;
              ratingsMap[rv.reviewed_id].count += 1;
            }
          }

          const mappedLikers = likerProfiles.filter((p: any) => p.setup_complete === true && hasProfilePhoto(p)).map(p => ({
            id: p.id,
            name: p.name || t("match.unknownUser", "Migo User"),
            age: p.age || 25,
            nationality: p.nationality || '',
            gender: p.gender || '',
            location: p.location || t("match.noLocation"),
            distanceKm: null,
            distance: t("map.distanceUnknown"),
            bio: p.bio || t("auto.ko_0251", "안녕하세요"),
            photo: p.photo_url || '',
            photoUrls: p.photo_urls && p.photo_urls.length > 0 ? p.photo_urls : p.photo_url ? [p.photo_url] : [],
            destination: p.location || t("auto.ko_0252", "어딘가"),
            dates: p.travel_dates || t("auto.ko_0253", "미정"),
            tags: p.interests || [],
            travelMission: p.travel_mission || undefined,
            sajuCompleted: !!p.saju_completed,
            sajuProfile: p.saju_profile || null,
            sajuDayMaster: p.saju_day_master || null,
            sajuElement: p.saju_element || null,
            userType: p.user_type || 'traveler', profileTheme: p.profile_theme,
            visitedCountries: p.visited_countries || [],
            matchScore: 999,
            // 理쒖긽???곗꽑
            verified: !!p.verified || !!p.id_verified,
            verifyLevel: p.verified ? 'gold' as const : p.id_verified ? 'id' as const : 'basic' as const,
            ticketVerified: !!p.id_verified,
            trustScore: p.trust_score ?? 0,
            travelStyle: p.interests || [],
            languages: p.languages || [],
            mbti: p.mbti || '',
            isPlus: !!p.is_plus,
            isPremium: p.plan === 'premium',
            isAd: false,
            isLiker: true,
            // ?섎? ?쇱씠?ы븳 ?щ엺 ?쒖떆
            avgRating: ratingsMap[p.id]?.count > 0 ? ratingsMap[p.id].sum / ratingsMap[p.id].count : null,
            reviewCount: ratingsMap[p.id]?.count || 0
          }));
          if (isMounted) setPendingLikers(mappedLikers);
        }
      }

      // 24?쒓컙 濡ㅻ쭅 ?덈룄?곕줈 蹂대궦 ?쇱씠????議고쉶
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const {
        count: likeCount,
        data: recentLikes
      } = await supabase.from('likes').select('created_at', {
        count: 'exact'
      }).eq('from_user', user.id).gte('created_at', since24h.toISOString()).order('created_at', {
        ascending: true
      }); // ??limit(1) ?쒓굅: count媛 理쒕? 1濡?怨좎젙?섎뜕 踰꾧렇 ?섏젙
      if (isMounted) setDailyLikesUsed(likeCount ?? 0);

      // MatchPage-TIMER fix: async ?대? return? useEffect cleanup 遺덇? ??ref ?ъ슜
      if (recentLikes && recentLikes.length > 0) {
        const firstLikeAt = new Date(recentLikes[0].created_at).getTime();
        const resetAt = firstLikeAt + 24 * 60 * 60 * 1000;
        const msUntilReset = resetAt - Date.now();
        if (msUntilReset > 0) {
          if (likeResetTimerRef.current) clearTimeout(likeResetTimerRef.current);
          likeResetTimerRef.current = setTimeout(() => { if (isMounted) setDailyLikesUsed(0); }, msUntilReset);
        } else {
          setDailyLikesUsed(0);
        }
      }
    };
    fetchProfiles().catch(err => console.error('[MatchPage] fetchProfiles failed:', err));
    return () => {
      isMounted = false; if (likeResetTimerRef.current) clearTimeout(likeResetTimerRef.current);
    };
  }, [t, user]);

  // ?? Supabase Realtime: online_status ?ㅼ떆媛?援щ룆 ??
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('online-status-match')
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'online_status' },
        (payload: any) => {
          const updated = payload.new || payload.old;
          if (!updated?.user_id) return;
          setOnlineMap(prev => ({
            ...prev,
            [updated.user_id]: {
              isOnline: !!updated.is_online,
              lastSeen: updated.last_seen ?? null
            }
          }));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // ?? onlineMap??諛붾뚮㈃ profiles??isOnline/lastSeen 諛섏쁺 ??
  useEffect(() => {
    if (Object.keys(onlineMap).length === 0) return;
    setProfiles(prev =>
      prev.map(p =>
        onlineMap[p.id]
          ? { ...p, isOnline: onlineMap[p.id].isOnline, lastSeen: onlineMap[p.id].lastSeen }
          : p
      )
    );
  }, [onlineMap]);

  // ?? 愿묎퀬 ?좊Т???곕Ⅸ ?섎떒 ?щ갚 ????곹뼢 (?ㅼ씠?곕툕 諛곕꼫 ?믪씠 + safe-area 諛섏쁺) ??
  useEffect(() => {
    if (!isPlus && !isPremium) {
      document.documentElement.style.setProperty('--toast-pb', 'var(--app-floating-bottom)');
    } else {
      document.documentElement.style.setProperty('--toast-pb', 'var(--app-floating-bottom)');
    }
    return () => {
      document.documentElement.style.setProperty('--toast-pb', 'var(--app-floating-bottom)');
    };
  }, [isPlus, isPremium]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchProfile, setMatchProfile] = useState<any | null>(null);
  const [showMatch, setShowMatch] = useState(false);
  const [isSuperLikeMatch, setIsSuperLikeMatch] = useState(false);
  const [matchedThreadId, setMatchedThreadId] = useState<string | null>(null);
  const [superLikeMessage, setSuperLikeMessage] = useState<string>("");
  const [superLikedId, setSuperLikedId] = useState<string | null>(null);
  const [showSuperLikeModal, setShowSuperLikeModal] = useState(false);
  const [pendingSuperProfile, setPendingSuperProfile] = useState<any | null>(null);
  const [superMsg, setSuperMsg] = useState("");

  // Like popup
  const [showLikePopup, setShowLikePopup] = useState(false);
  const [likePopupProfile, setLikePopupProfile] = useState<any | null>(null);

  // Pass popup (X 踰꾪듉)
  const [showPassPopup, setShowPassPopup] = useState(false);
  const [passPopupProfile, setPassPopupProfile] = useState<any | null>(null);

  // ?듯빀 ?꾪꽣 ?곸슜 (useMemo濡?硫붾え?댁젣?댁뀡 ??留?render ?ш퀎??諛⑹?)
  const withAds = useMemo(() => {
    const filteredTravelers = profiles.filter(p => {
      const hasNoCoords = p.distanceKm === null;
      // ?꾨━ ?좎???湲濡쒕쾶 留ㅼ묶 遺덇?. 湲곕낯?곸쑝濡?理쒕? 100km濡??쒗븳 (?먮뒗 ?ㅼ젙??filterDistance)
      const effectiveDist = isPlus ? filterDistance : Math.min(filterDistance, 100);
      const distOk = (effectiveDist >= 9999 || !hasMyGps) ? true : (hasNoCoords ? true : p.distanceKm <= effectiveDist);
      const genderOk = !isPlus || filterGender === 'all' || p.gender === filterGender;  // Plus ?꾩슜
      const ageOk = !isPlus || !p.age || (p.age >= filterAge[0] && p.age <= filterAge[1]);  // Plus ?꾩슜
      const langOk = !isPlus || filterLanguages.length === 0 || filterLanguages.some(l => p.languages.includes(l));  // Plus ?꾩슜
      const mbtiOk = filterMbti.length === 0 || (p.mbti && filterMbti.includes(p.mbti));
      const styleOk = filterTravelStyle.length === 0 || filterTravelStyle.some(tag => p.travelStyle.includes(tag));
      return distOk && genderOk && ageOk && langOk && mbtiOk && styleOk;
    });
    const result: any[] = [];
    let adIdx = 0;
    let likerIdx = 0;
    for (let i = 0; i < filteredTravelers.length; i++) {
      result.push(filteredTravelers[i]);
      if ((i + 1) % 3 === 0) {
        if (likerIdx < pendingLikers.length) {
          result.push(pendingLikers[likerIdx++]);
        } else if (!isPlus && !isPremium && ads.length > 0) {
          const ad = ads[adIdx % ads.length];
          result.push({
            id: `ad-${ad.id}-${i}`,
            name: ad.advertiser || t("auto.ko_0256", "스폰서"),
            age: 0,
            gender: "none",
            location: "Sponsored",
            distance: "",
            bio: `${ad.headline}\n${ad.body_text}`,
            photo: ad.image_url || siteLogo,
            destination: ad.cta_text,
            dates: "AD",
            tags: ["Ad", "Sponsor"],
            matchScore: 99,
            verified: true,
            verifyLevel: undefined,
            travelStyle: [],
            mbti: "",
            isAd: true,
            adUrl: ad.cta_url,
            originalAd: ad
          } as any);
          adIdx++;
        }
      }
    }
    while (likerIdx < pendingLikers.length) {
      result.push(pendingLikers[likerIdx++]);
    }
    return result;
  }, [profiles, pendingLikers, ads, isPlus, isPremium, hasMyGps, filterDistance, filterGender, filterAge, filterLanguages, filterMbti, filterTravelStyle, t]);
  const handleSwipeLeft = useCallback(() => {
    triggerHaptic("light");
    const profile = withAds[currentIndex];
    if (profile?.isAd) {
      // Just swipe away
    } else if (profile?.id) {
      // 패스 패턴 기록
      runAfterSwipe(async () => {
        recordSwipe({
          id: profile.id,
          nationality: profile.nationality,
          travel_style: profile.travelStyle?.[0],
          age: profile.age
        }, false);

        // 서버 DB에 Pass 내역 저장 (24시간 동안 매칭 발견 노출 제외용)
        if (user?.id) {
          await supabase.from('likes').upsert({
            from_user: user.id,
            to_user: profile.id,
            kind: 'pass',
            created_at: new Date().toISOString()
          }, {
            onConflict: 'from_user,to_user'
          });
        }
      });

      // Pass ?앹뾽 ?쒖떆
      setPassPopupProfile(profile);
      setShowPassPopup(true);
      matchTimersRef.current.timeouts.forEach(clearTimeout);
      matchTimersRef.current.timeouts = [];
      const tPass = setTimeout(() => setShowPassPopup(false), 1800);
      matchTimersRef.current.timeouts.push(tPass);
    }
    setCurrentIndex(i => i + 1);
    if (!profile?.isAd) {
      setSwipeCount(s => {
        const next = s + 1;
        if (!isPlus && !isPremium && next % 3 === 0) showInterstitialAfterSwipe();
        return next;
      });
    }

    // 실시간 FOMO 유도: 무료 유저에게 10% 확률로 토스트 띄우기
    if (!isPlus && Math.random() < 0.1) {
      toast({
        title: t("retention.fomo.toast.title", "누군가 회원님을 마음에 들어합니다 💕"),
        description: t("retention.fomo.toast.desc", "Migo Plus로 업그레이드하고 누구인지 확인해보세요."),
        action: (
          <button onClick={() => setShowPlusModal(true)} className="px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-lg shrink-0">
            {t("retention.fomo.toast.action", "확인하기")}
          </button>
        ),
        duration: 5000,
      });
    }
  }, [currentIndex, withAds, isPlus, isPremium, showInterstitialAfterSwipe, runAfterSwipe, t]);
  const saveLikeAndCheckMatch = useCallback(async (toUserId: string, kind: 'like' | 'superlike' = 'like', message?: string) => {
    if (!user) return false;
    try {
    // BUG-5 fix: superlike + toUserId ?덉쓣 ?뚮뒗 consumeSuperLike?먯꽌 ?대? RPC濡?likes INSERT??
    // ??以묐났 INSERT 諛⑹?瑜??꾪빐 superlike 耳€?댁뒪??upsert瑜?嫄대那我€
    const shouldSkipLikesInsert = kind === 'superlike';
    if (!shouldSkipLikesInsert) {
      await supabase.from('likes').upsert({
        from_user: user.id,
        to_user: toUserId,
        kind,
        message,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'from_user,to_user'
      });
    } else {
      // superlike: in_app_notifications만 INSERT (RPC가 이미 likes 처리)
      await supabase.from('in_app_notifications').insert({
        user_id: toUserId,
        type: kind,
        title: t("auto.ko_0257", "새 슈퍼라이크"),
        content: t("auto.t_0044", `${user.name}님이 슈퍼라이크를 보냈습니다.`)
      });
      sendLikePush(toUserId, user.id, 'superlike');
    }
    // 2. ?곷?諛⑸룄 ?섎? like ?덈뒗吏€ ?뺤씤 ??match
    const {
      data: mutual
    } = await supabase.from('likes').select('from_user').eq('from_user', toUserId).eq('to_user', user.id).maybeSingle();
    if (mutual) {
      // RPC 호출로 트랜잭션 안전하게 매치 대화방 가져오거나 생성
      const { data: threadId, error: rpcError } = await supabase.rpc('get_or_create_match_thread', {
        p_user_a: user.id,
        p_user_b: toUserId
      });

      if (rpcError || !threadId) {
        console.error('[Match] get_or_create_match_thread rpc failed:', rpcError);
        return false;
      }

      // 매칭 푸시 알림 발송 (상대방에게)
      sendMatchPush(toUserId, user.id, threadId);

      // 5. 로컬 Web Push 알림 (포그라운드인 경우)
      const matchedProfile = withAds.find((p: any) => p.id === toUserId);
      if (matchedProfile?.name) notifyMatch(matchedProfile.name);
      return threadId; // matched!
    }
    // 좋아요 DB 트리거가 notifications 처리하지만 클라이언트에서도 in_app_notifications 등록
    if (kind !== 'superlike') {
      await supabase.from('in_app_notifications').insert({
        user_id: toUserId,
        type: kind,
        title: t("auto.ko_0258", "새 좋아요"),
        content: t("auto.t_0045", `${user.name}님이 좋아요를 보냈습니다.`)
      });
      sendLikePush(toUserId, user.id, 'like');
    }
    return false;
    } catch (error) {
      console.error('[MatchPage] saveLikeAndCheckMatch failed:', error);
      toast({
        title: t("match.swipeErrorTitle", "오류 발생"),
        description: t("match.swipeErrorDesc", "좋아요를 처리하는 중 오류가 발생했습니다. 다시 시도해주세요."),
        variant: "destructive"
      });
      return false;
    }
  }, [t, user, withAds]); // ISSUE-1 fix: withAds??stale closure 諛⑹?
  const handleSwipeRight = useCallback(() => {
    if (!isLoggedIn()) {
      requireLogin();
      return;
    }
    triggerHaptic("medium");
    const profile = withAds[currentIndex];
    if (!profile) return;
    if (profile.isAd) {
      recordAdClick(profile.originalAd.id, null);
      // Apple Guideline 3.2: window.open ?€???몄빋 釉뚮씪?곗?(SFSafariViewController) ?ъ슜
      if (profile.adUrl) Browser.open({ url: profile.adUrl, presentationStyle: 'fullscreen' });
      setCurrentIndex(i => i + 1);
      return;
    }

    // ?좎? ?깃툒蹂??쇱씪 醫뗭븘???쒗븳 泥댄겕 (?쇱씠而?移대뱶???쒖쇅)
    if (!isPremium && !profile.isLiker && dailyLikesUsed >= DAILY_LIKE_LIMIT) {
      toast({
        title: t("auto.p525"),
        description: t("auto.t_0018", `?ㅻ뒛 臾대즺 醫뗭븘??${DAILY_LIKE_LIMIT}媛쒕? 紐⑤몢 ?ъ슜?덉뒿?덈떎.`),
        variant: "destructive"
      });
      setShowPlusModal(true);
      return;
    }

    // Show Like popup
    setLikePopupProfile(profile);
    setShowLikePopup(true);
    
    // ?댁쟾 Like ?€?대㉧ 珥덇린??(?곗냽 ?ㅼ??댄봽 ??瑗ъ엫 諛⑹?)
    matchTimersRef.current.timeouts.forEach(clearTimeout);
    matchTimersRef.current.timeouts = [];
    const tLike = setTimeout(() => setShowLikePopup(false), 2200);
    matchTimersRef.current.timeouts.push(tLike);

    // 醫뗭븘???⑦꽩 ?숈뒿
    runAfterSwipe(() => {
      recordSwipe({
        id: profile.id,
        nationality: profile.nationality,
        travel_style: profile.travelStyle?.[0],
        age: profile.age
      }, true);
    });
    setCurrentIndex(i => i + 1);
    setSwipeCount(s => {
      const next = s + 1;
      if (!isPlus && !isPremium && next % 3 === 0) showInterstitialAfterSwipe();
      return next;
    });
    if (!isPlus && !profile.isLiker) setDailyLikesUsed(n => n + 1);

    // DB ?€??+ 留ㅼ묶 ?뺤씤
    saveLikeAndCheckMatch(profile.id).then(isMatch => {
      if (isMatch) {
         triggerHaptic("success");
         if (showMatchRef.current) {
           // ?대? 留ㅼ묶李쎌씠 ?좎엳?쇰㈃ 議곗슜??諛깃렇?쇱슫??留ㅼ묶 (?몄빋 ?뚮━誘몃쭔)
           addUnread(profile.id);
           setInAppNotif({ type: "like", actorName: profile.name, actorPhoto: profile.photo });
         } else {
           showMatchRef.current = true;
           const tMatch = setTimeout(() => {
             setMatchProfile(profile);
             setIsSuperLikeMatch(false);
             setShowMatch(true);
             if (typeof isMatch === 'string') setMatchedThreadId(isMatch);
             addUnread(profile.id);
             setInAppNotif({
               type: "like",
               actorName: profile.name,
               actorPhoto: profile.photo
             });
           }, 300);
           matchTimersRef.current.timeouts.push(tMatch);
          }
        }
    });

    // 실시간 FOMO 유도: 무료 유저에게 10% 확률로 토스트 띄우기
    if (!isPlus && Math.random() < 0.1) {
      toast({
        title: t("retention.fomo.toast.title", "누군가 회원님을 마음에 들어합니다 💕"),
        description: t("retention.fomo.toast.desc", "Migo Plus로 업그레이드하고 누구인지 확인해보세요."),
        action: (
          <button onClick={() => setShowPlusModal(true)} className="px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-lg shrink-0">
            {t("retention.fomo.toast.action", "확인하기")}
          </button>
        ),
        duration: 5000,
      });
    }
  }, [currentIndex, withAds, addUnread, saveLikeAndCheckMatch, isPlus, isPremium, dailyLikesUsed, showInterstitialAfterSwipe, runAfterSwipe, t, DAILY_LIKE_LIMIT, isLoggedIn, requireLogin]);
  const openSuperLikeModal = useCallback(() => {
    if (!isLoggedIn()) {
      requireLogin();
      return;
    }
    if (!isPlus && superLikesLeft <= 0) {
      // 蹂댁긽??愿묎퀬 癒쇱? ?쒖븞 ??愿묎퀬 蹂닿퀬 ?덊띁?쇱씠??1媛?異⑹쟾
      setShowRewardedAdOffer(true);
      return;
    }
    const profile = withAds[currentIndex];
    if (!profile || profile.isAd) return;
    setPendingSuperProfile(profile);
    setSuperMsg("");
    setShowSuperLikeModal(true);
  }, [currentIndex, withAds, superLikesLeft, isPlus, isLoggedIn, requireLogin]);
  const confirmSuperLike = useCallback(() => {
    if (!pendingSuperProfile) return;
    triggerHaptic("heavy");
    const profile = pendingSuperProfile;
    setShowSuperLikeModal(false);
    setSuperLikeMessage(superMsg);
    setSuperLikedId(profile.id);

    // BUG-1 fix: toUserId ?꾨떖 ??DB RPC record_superlike ?먯옄??李④컧+insert
    consumeSuperLike(profile.id);

    // DB ?€??+ 留ㅼ묶 ?뺤씤 ?꾩뿉 ?댁쟾 ?€?대㉧ 珥덇린??(?곗냽 ?≪뀡 瑗ъ엫 諛⑹?)
    matchTimersRef.current.timeouts.forEach(clearTimeout);
    matchTimersRef.current.timeouts = [];

    saveLikeAndCheckMatch(profile.id, 'superlike', superMsg || undefined).then(isMatch => {
      const tSuperLike = setTimeout(() => {
        setSuperLikedId(null);
        setCurrentIndex(i => i + 1);
        if (isMatch) {
          triggerHaptic("success");
          if (showMatchRef.current) {
            addUnread(profile.id);
            setInAppNotif({ type: "superlike", actorName: profile.name, actorPhoto: profile.photo, message: superMsg || undefined });
          } else {
            showMatchRef.current = true;
            const tMatch = setTimeout(() => {
              setMatchProfile(profile);
              setIsSuperLikeMatch(true);
              setShowMatch(true);
              if (typeof isMatch === 'string') setMatchedThreadId(isMatch);
              addUnread(profile.id);
              setInAppNotif({
                type: "superlike",
                actorName: profile.name,
                actorPhoto: profile.photo,
                message: superMsg || undefined
              });
            }, 300);
            matchTimersRef.current.timeouts.push(tMatch);
          }
        }
      }, 700);
      matchTimersRef.current.timeouts.push(tSuperLike);
    });
    toast({
      title: t("auto.t_0019", `${profile.name}님에게 슈퍼라이크 전송!`),
      description: superMsg ? `"${superMsg}"` : t("auto.g_0045", "상대방에게 특별한 신호를 보냈어요.")
    });
  }, [pendingSuperProfile, superMsg, addUnread, saveLikeAndCheckMatch, consumeSuperLike, t]);
  const handleChatFromMatch = () => {
    setShowMatch(false);
    showMatchRef.current = false;
    if (matchedThreadId) {
      navigate('/chat', {
        state: {
          threadId: matchedThreadId
        }
      });
    } else {
      navigate('/chat');
    }
    setMatchedThreadId(null);
  };

  // ?꾨줈??移대뱶?먯꽌 吏곸젒 ?ㅼ씠?됲듃 梨꾪똿 嫄멸린
  const handleDirectChat = useCallback(async (targetProfile: any) => {
    if (!user || !targetProfile) return;
    try {
      const [u1, u2] = [user.id, targetProfile.id].sort();
      // ?대? 梨꾪똿諛⑹씠 ?덈뒗吏€ ?뺤씤
      const { data: existingMatch } = await supabase
        .from('matches')
        .select('thread_id')
        .eq('user1_id', u1)
        .eq('user2_id', u2)
        .maybeSingle();

      let threadId = existingMatch?.thread_id;

      if (!threadId) {
        const { data: thread } = await supabase.from('chat_threads').insert({ is_group: false }).select('id').single();
        if (thread) {
          threadId = thread.id;
          await supabase.from('chat_members').insert([
            { thread_id: thread.id, user_id: user.id }, 
            { thread_id: thread.id, user_id: targetProfile.id }
          ]);
          await supabase.from('matches').upsert({
            user1_id: u1,
            user2_id: u2,
            thread_id: thread.id
          }, { onConflict: 'user1_id,user2_id' });
        }
      }

      if (threadId) {
        navigate('/chat', { state: { threadId } });
      } else {
        navigate('/chat');
      }
    } catch (err) {
      console.error(err);
    }
  }, [user, navigate]);

  // ?꾨줈??議고쉶 ?뚮┝ (移대뱶 ?????대떦 ?좎??먭쾶 ?꾩넚)
  const sendProfileViewNotif = async (targetUserId: string) => {
    if (!user || targetUserId === user.id) return; // ?먭린 ?먯떊 ?쒖쇅
    // profile_view ?뚮┝: INSERT, 以묐났(23505) 議곗슜??臾댁떆
    const { error: notifErr } = await supabase.from('notifications').insert({
      user_id: targetUserId,
      type: 'profile_view',
      actor_id: user.id
    });
    if (notifErr && notifErr.code !== '23505') {
      // 23505 = unique_violation (以묐났 酉? ???뺤긽, 洹????먮윭留?濡쒓렇
      console.warn('[sendProfileViewNotif]', notifErr.message);
    }
  };
  const toggleTag = (tag: string) => {
    setFilterTravelStyle(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };
  const remaining = withAds.slice(currentIndex, currentIndex + 3).reverse();
  const topProfile = withAds[currentIndex];

  useEffect(() => {
    withAds.slice(currentIndex, currentIndex + 5).forEach((profile: any) => {
      const src = profile?.photoUrls?.[0] || profile?.photo || profile?.photo_url || profile?.photo_urls?.[0];
      if (!src) return;
      const img = new Image();
      img.decoding = "async";
      img.src = src;
    });
  }, [withAds, currentIndex]);

  // Ad impression tracking
  useEffect(() => {
    if (topProfile?.isAd) {
      // BUG-20 fix: user?.id ?꾨떖 (null ?섎뱶肄붾뵫 ?쒓굅 ??愿묎퀬 遺꾩꽍 ?곗씠???뺥솗???μ긽)
      recordAdImpression(topProfile.originalAd.id, user?.id ?? null);
    }
  }, [topProfile, user?.id]);
  return <div className="flex flex-col h-full bg-background truncate">

      {/* ??? In-app notification banner (Like / SuperLike received) ??? */}
      <InAppNotifBanner notif={inAppNotif} onClose={() => setInAppNotif(null)} />

      {/* ??? 醫뗭븘???덊띁?쇱씠???섏떊 諛곕꼫 (Realtime ?ㅼ떆媛? ??? */}
      {!inAppNotif && (
        <InAppNotifBanner
          notif={likeBanner ? {
            type: likeBanner.type,
            actorName: likeBanner.actorName,
            actorPhoto: likeBanner.actorPhoto,
            message: likeBanner.message,
            isBlurred: !isPlus,
          } : null}
          onClose={clearLikeBanner}
        />
      )}

      {/* ??? ?꾨줈??議고쉶 諛곕꼫 (?꾨줈?꾨낫湲고뻽?댁슂) ??? */}
      {!inAppNotif && !likeBanner && (
        <InAppNotifBanner
          notif={profileViewBanner ? {
            type: "profile_view",
            actorName: profileViewBanner.actorName,
            actorPhoto: profileViewBanner.actorPhoto,
            isBlurred: !isPlus,
          } : null}
          onClose={clearProfileViewBanner}
        />
      )}

      {/* ??? ?ㅻ뒛??紐⑹쟻(Mission) ?ㅼ젙 紐⑤떖 ??? */}
      <MissionModal
        showMissionModal={showMissionModal}
        setShowMissionModal={setShowMissionModal}
        selectDailyMission={selectDailyMission}
      />

      {/* Header */}
      <TopHeader
        activeCheckIn={activeCheckIn}
        onCheckInClick={() => setShowCheckInModal(true)}
        filterCount={totalActiveFilterCount}
        onFilterClick={() => {
          if (!isPlus) { setShowPlusModal(true); return; }
          setShowFilterModal(true);
        }}
        showNearby
        showShop
      />

      {/* ?? FOMO: ?쇱씠釉?留ㅼ묶 移댁슫???? */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mb-3 flex items-center justify-center"
      >
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {(() => {
              const cnt = Math.floor(Date.now() / 60000 % 150) + 120;
              const text = t("hotplace.seekerCount", "吏湲?{{count}}紐낆씠 ?숇컲?먮? 李얘퀬 ?덉뼱??", { count: cnt });
              const parts = text.split(cnt.toString());
              return (
                <>
                  {parts[0]}
                  <span className="text-emerald-500 font-black">{cnt}</span>
                  {parts[1]}
                </>
              );
            })()}
          </span>
        </div>
      </motion.div>

      {/* ??? 遺?ㅽ듃 ?쒖꽦???뚮옒???④낵 ??? */}
      <AnimatePresence>
        {boostJustActivated && (
          <motion.div
            className="fixed inset-0 z-[150] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, times: [0, 0.15, 1] }}
          >
            {/* 鍮쒕갚 諛섏쭥 */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/40 via-pink-500/30 to-transparent" />
            {/* 以묒븰 ?뚰떛肄??꾩씠肄?*/}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 1.4, 1.1], opacity: [0, 1, 0] }}
              transition={{ duration: 1.4 }}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="text-6xl">BOOST</div>
                <p className="text-white text-lg font-extrabold drop-shadow-lg">Boost ON!</p>
              </div>
            </motion.div>
            {/* 由????뚰떛肄뽯뱾 */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full bg-purple-400/70"
                initial={{ x: "50vw", y: "50vh", scale: 0, opacity: 1 }}
                animate={{
                  x: `${50 + Math.cos((i / 8) * Math.PI * 2) * 45}vw`,
                  y: `${50 + Math.sin((i / 8) * Math.PI * 2) * 45}vh`,
                  scale: [0, 1.5, 0],
                  opacity: [1, 0.8, 0],
                }}
                transition={{ duration: 1.2, delay: i * 0.05 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Boost active banner */}
      {boostActive && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="mx-4 mb-1 rounded-xl bg-purple-600 overflow-hidden">
            {/* ??대㉧ 吏꾪뻾瑜?諛?*/}
            <motion.div
              className="h-0.5 bg-white/40"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 30 * 60, ease: "linear" }}
            />
            <div className="px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* ?ъ뒪 ?좊땲硫붿씠??*/}
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  <Zap size={16} className="text-white" fill="white" />
                </motion.div>
                <div>
                  <p className="text-white text-xs font-extrabold leading-none">{t("auto.j500")}</p>
                  <p className="text-white/70 text-[10px] mt-0.5">{t("boost.activeDesc", "내 프로필이 상단에 노출되고 있어요.")}</p>
                </div>
              </div>
              {/* 移댁슫?몃떎??*/}
              <div className="flex flex-col items-end">
                <span className="text-white font-mono text-sm font-extrabold">
                  {String(Math.floor(boostSecondsLeft / 60)).padStart(2, "0")}:{String(boostSecondsLeft % 60).padStart(2, "0")}
                </span>
                <span className="text-white/60 text-[9px]">{t("boost.remaining", "?⑥쓬")}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}



      {/* Card Stack ??遺?ㅻ뒗 湲濡쒖슦 留??놁쓬 */}
      <div
        className="flex-1 relative w-full px-3 mx-auto pb-2 truncate"
        style={{
          minHeight: 0,
          maxWidth: "420px",
        }}
      >
        {/* 遺?ㅽ듃 以?湲濡쒖슦 ?④낵 */}
        {boostActive && (
          <motion.div
            className="absolute inset-0 rounded-3xl pointer-events-none z-0"
            animate={{
              boxShadow: [
                "0 0 0px 0px rgba(168,85,247,0)",
                "0 0 30px 8px rgba(168,85,247,0.35)",
                "0 0 20px 4px rgba(236,72,153,0.25)",
                "0 0 30px 8px rgba(168,85,247,0.35)",
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        {remaining.length > 0 ? (
          <AnimatePresence>
            {remaining.map((profile, i) => <SwipeCard key={profile.id} profile={profile} onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight} onChat={() => handleDirectChat(profile)} isTop={i === remaining.length - 1} isSuperLiked={superLikedId === profile.id} onProfileView={sendProfileViewNotif} myProfile={user} myDailyMission={myDailyMission} onPremiumClick={() => setShowPlusModal(true)} />)}
          </AnimatePresence>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring", damping: 25 }}
            className="flex flex-col items-center justify-center h-full text-center px-8"
          >
            <div className="relative mb-5">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <Globe size={40} strokeWidth={1.8} className="text-primary" />
              </div>
              {false && <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary/30 blur-sm"
              />}
              {false && <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.6, 0.2] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-primary/40 blur-sm inline-block"
              />}
            </div>
            <h3 className="text-xl font-extrabold text-foreground mb-2 text-center">{t("auto.j502", { defaultValue: "You've seen all travelers!" })}</h3>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-[240px] text-center whitespace-pre-line">
                {t("auto.j503", { defaultValue: "New friends nearby\nwill show up soon." })}
            </p>
            <motion.button 
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowFilterModal(true)} 
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-[13px] font-extrabold flex items-center gap-2"
            >
                <span className="text-lg">Reset</span> {t("auto.j504", { defaultValue: "Reset filters" })}
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Action Buttons - inline below card */}
      {remaining.length > 0 && <div className="relative z-50 pointer-events-auto flex flex-col items-center gap-2 px-4 pt-1 pb-4 shrink-0">
          {/* Boost row */}
          {false && <div className="flex justify-center">
             <motion.button whileTap={{
          scale: 0.92
        }} onClick={async () => {
          if (!isPlus) {
            // Migo Plus媛 ?꾨땶 寃쎌슦: 愿묎퀬 蹂닿퀬 遺?ㅽ듃 諛쏄린 紐⑤떖 ?쒖떆
            setShowBoostAdOffer(true);
            return;
          }
          if (boostActive) {
            toast({
              title: t("auto.p526"),
              description: t("auto.t_0020", `遺?ㅽ듃 ${String(Math.floor(boostSecondsLeft / 60)).padStart(2, "0")}:${String(boostSecondsLeft % 60).padStart(2, "0")} ?⑥쓬`)
            });
            return;
          }
          await startBoost();
          setBoostJustActivated(true);
          setTimeout(() => setBoostJustActivated(false), 1800);
          toast({
            title: t("alert.t64Title"),
            description: t("alert.t64Desc")
          });
        }} className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold shadow-lg transition-all ${boostActive ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : isPlus ? "bg-purple-500/10 border border-purple-500/30 text-purple-400" : "bg-muted text-muted-foreground"}`}>
                <Zap size={13} fill={boostActive ? "white" : "none"} />
                {boostActive ? t("auto.t_0047", `遺?ㅽ똿 以?${String(Math.floor(boostSecondsLeft / 60)).padStart(2, "0")}:${String(boostSecondsLeft % 60).padStart(2, "0")}`) : isPlus ? t("auto.ko_0263", "遺?ㅽ듃 ?ъ슜") : t("auto.ko_0264", "遺?ㅽ듃 (Plus)")}
             </motion.button>
          </div>}

          {/* Core swipe buttons ??prominent X / Star / Heart */}
          <div className="flex items-center justify-center gap-3">
            <motion.button
              whileTap={{ scale: 0.88, rotate: -8 }}
              onClick={handleSwipeLeft}
              className="w-12 h-12 rounded-full bg-card shadow-sm border border-rose-400/40 flex items-center justify-center text-rose-500 active:bg-rose-50"
            >
              <X size={22} strokeWidth={3} />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={openSuperLikeModal}
              className={`w-10 h-10 rounded-full shadow-sm border flex items-center justify-center transition-all ${
                superLikesLeft > 0
                  ? "bg-card border-blue-400/60 text-blue-500 shadow-[0_4px_18px_rgba(59,130,246,0.2)]"
                  : "bg-muted border-border opacity-40 text-muted-foreground"
              }`}
            >
              <Star size={17} className={superLikesLeft > 0 ? "fill-blue-500" : ""} />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.88, rotate: 8 }}
              onClick={handleSwipeRight}
              className="w-12 h-12 rounded-full bg-card shadow-sm border border-emerald-400/50 flex items-center justify-center text-emerald-500 active:bg-emerald-50"
            >
              <Heart size={22} strokeWidth={2.5} className="fill-emerald-500" />
            </motion.button>
          </div>
      </div>}



      {/* ???????????????????????????????????????????????????????????? */}
      {/* ?ㅿ툘  LIKE POPUP ??warm pink heart burst, auto-dismiss        */}
      {/* ???????????????????????????????????????????????????????????? */}
      <LikePopupModal
        showLikePopup={showLikePopup}
        likePopupProfile={likePopupProfile}
        onUpgrade={() => setShowPlusModal(true)}
      />

      {/* ???????????????????????????????????????????????????????????? */}
      {/* ?? PASS POPUP ??cool X burst, auto-dismiss                  */}
      {/* ???????????????????????????????????????????????????????????? */}
      <PassPopupModal
        showPassPopup={showPassPopup}
        passPopupProfile={passPopupProfile}
      />

      {/* ???????????????????????????????????????????????????????????? */}
      {/* 狩? SUPER LIKE MODAL ??deep blue star energy, bottom sheet  */}
      {/* ???????????????????????????????????????????????????????????? */}
      <SuperLikeModal
        showSuperLikeModal={showSuperLikeModal}
        setShowSuperLikeModal={setShowSuperLikeModal}
        pendingSuperProfile={pendingSuperProfile}
        superMsg={superMsg}
        setSuperMsg={setSuperMsg}
        superLikesLeft={superLikesLeft}
        isPlus={isPlus}
        confirmSuperLike={confirmSuperLike}
      />

      <MatchModal isOpen={showMatch} profile={matchProfile} onClose={() => { setShowMatch(false); showMatchRef.current = false; }} onChat={handleChatFromMatch} isSuperLike={isSuperLikeMatch} superLikeMessage={isSuperLikeMatch ? superLikeMessage : ""} />

      {/* Migo Plus Modal */}
      <MigoPlusModal isOpen={showPlusModal} onClose={() => setShowPlusModal(false)} />

      {/* ??? Login Gate Modal ??? */}
      <LoginGateModal
        showLoginGate={showLoginGate}
        setShowLoginGate={setShowLoginGate}
      />

      {/* ??Report / Block action sheet */}
      <ReportBlockActionSheet isOpen={!!actionSheetProfile} onClose={() => setActionSheetProfile(null)} targetType="user" targetId={actionSheetProfile?.id ?? ""} targetName={actionSheetProfile?.name ?? ""} authorId={actionSheetProfile?.id} />

      {/* ??? ?꾪꽣 紐⑤떖 ??? */}
      <FilterModal
        showFilterModal={showFilterModal}
        setShowFilterModal={setShowFilterModal}
        filterAge={filterAge}
        setFilterAge={setFilterAge}
        filterDistance={filterDistance}
        setFilterDistance={setFilterDistance}
        filterGender={filterGender}
        setFilterGender={setFilterGender}
        filterMbti={filterMbti}
        setFilterMbti={setFilterMbti}
        filterLanguages={filterLanguages}
        setFilterLanguages={setFilterLanguages}
        filterTravelStyle={filterTravelStyle}
        setFilterTravelStyle={setFilterTravelStyle}
        totalActiveFilterCount={totalActiveFilterCount}
        isPlus={isPlus}
        canGlobalMatch={canGlobalMatch}
        setCurrentIndex={setCurrentIndex}
        setShowPlusModal={setShowPlusModal}
      />

      {/* GPS 泥댄겕??紐⑤떖 */}
      <CheckInModal open={showCheckInModal} onClose={() => setShowCheckInModal(false)} onCheckInSuccess={(ci, travelers) => {
      setActiveCheckIn(ci);
      setCheckInCityTravelers(travelers);
      setShowCheckInModal(false);
    }} />

      {/* ??? Peak Time ?꾩쭏 ?좊룄 紐⑤떖 ??? */}
      <AnimatePresence>
        {!isPlus && showPeakBanner && showCheckInModal === false && new Date().getHours() >= 20 && new Date().getHours() <= 23 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed left-4 right-4 z-40 bg-card rounded-2xl p-4 shadow-float border border-primary/20 flex items-center justify-between gap-4"
            style={{ bottom: 'var(--toast-pb, 6rem)' }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap size={14} className="text-primary fill-primary" />
                <span className="text-xs font-extrabold text-primary">{t("retention.fomo.peakTime.label", "⚡ Peak Time!")}</span>
              </div>
              <p className="text-sm font-bold text-foreground truncate">{t("retention.fomo.peakTime.desc", "Most users are online right now.")}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{t("retention.fomo.peakTime.boostCta", "Use a Boost with Migo Plus!")}</p>
            </div>
            <button onClick={() => setShowPlusModal(true)} className="shrink-0 px-4 py-2 gradient-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md active:scale-95 transition-transform">
              {t("retention.fomo.peakTime.startBtn", "Start")}
            </button>
            <button onClick={(e) => { e.stopPropagation(); setShowPeakBanner(false); }} className="absolute -top-2 -right-2 w-6 h-6 bg-muted rounded-full flex items-center justify-center shadow-sm border border-border">
              <X size={12} className="text-muted-foreground" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ??? ?덊띁?쇱씠??蹂댁긽??愿묎퀬 ?ㅽ띁 紐⑤떖 ??? */}
      {showRewardedAdOffer && (
        <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center px-6">
          <div className="bg-card rounded-3xl p-6 w-full max-w-sm shadow-float border border-border">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">SUPER</div>
              <h3 className="text-lg font-extrabold text-foreground">
                {t("auto.ad_superlike_title", "슈퍼라이크 충전")}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("auto.ad_superlike_desc", "짧은 광고를 보고 슈퍼라이크 1개를 무료로 충전하세요.")}
              </p>
            </div>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={async () => {
                  setShowRewardedAdOffer(false);
                   const ok = await showRewarded((_reward) => {
                    // 蹂댁긽 吏湲? addSuperLikes(1)濡??ㅼ젣 DB???덊띁?쇱씠??1媛?吏湲?
                    addSuperLikes(1).then(() => {
                      toast({ title: t("auto.ad_reward_ok", "슈퍼라이크 1개 충전 완료!") });
                      const profile = withAds[currentIndex];
                      if (profile && !profile.isAd) {
                        setPendingSuperProfile(profile);
                        setSuperMsg("");
                        setShowSuperLikeModal(true);
                      }
                    });
                  });
                  if (!ok) {
                    // 愿묎퀬 濡쒕뱶 ?ㅽ뙣 ??Plus 紐⑤떖濡?fallback
                    toast({ title: t("auto.ad_load_fail", "광고를 불러오지 못했습니다."), variant: "destructive" });
                    setShowPlusModal(true);
                  }
                }}
                className="w-full py-3.5 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-sm flex items-center justify-center gap-2"
              >
                AD {t("auto.ad_watch_btn", "광고 보고 충전하기")}
              </button>
              <button
                onClick={() => { setShowRewardedAdOffer(false); setShowPlusModal(true); }}
                className="w-full py-3 rounded-2xl bg-muted text-muted-foreground font-semibold text-sm"
              >
                {t("auto.ad_upgrade_btn", "Migo+ 援щ룆?섍린")}
              </button>
              <button
                onClick={() => setShowRewardedAdOffer(false)}
                className="text-xs text-muted-foreground text-center py-1"
              >
                {t("common.cancel", "痍⑥냼")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ??? 遺?ㅽ듃 蹂댁긽??愿묎퀬 ?ㅽ띁 紐⑤떖 (window.confirm ?泥? ??? */}
      {showBoostAdOffer && (
        <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center px-6">
          <div className="bg-card rounded-3xl p-6 w-full max-w-sm shadow-float border border-border">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">BOOST</div>
              <h3 className="text-lg font-extrabold text-foreground">
                {t("auto.ad_boost_title", "무료 부스트 받기")}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("auto.ad_boost_desc", "짧은 광고를 보고 5분간 내 프로필을 상단에 노출하세요.")}
              </p>
            </div>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={async () => {
                  setShowBoostAdOffer(false);
                  const ok = await showRewarded((_reward) => {
                    startBoost();
                    setBoostJustActivated(true);
                    setTimeout(() => setBoostJustActivated(false), 1800);
                    toast({
                      title: t("auto.ad_reward_ok", "부스트 활성화 완료!"),
                      description: t("boost.activeDesc", "내 프로필이 상단에 노출되고 있어요."),
                    });
                  });
                  if (!ok) {
                    toast({ title: t("auto.ad_load_fail", "광고를 불러오지 못했습니다."), variant: "destructive" });
                    setShowPlusModal(true);
                  }
                }}
                className="w-full py-3.5 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-sm flex items-center justify-center gap-2"
              >
                AD {t("auto.ad_watch_btn", "광고 보고 부스트 받기")}
              </button>
              <button
                onClick={() => { setShowBoostAdOffer(false); setShowPlusModal(true); }}
                className="w-full py-3 rounded-2xl bg-muted text-muted-foreground font-semibold text-sm"
              >
                {t("auto.ad_upgrade_btn", "Migo+ 援щ룆?섍린")}
              </button>
              <button
                onClick={() => setShowBoostAdOffer(false)}
                className="text-xs text-muted-foreground text-center py-1"
              >
                {t("common.cancel", "痍⑥냼")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>;
};
export default MatchPage;
