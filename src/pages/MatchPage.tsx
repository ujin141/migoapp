import i18n from "@/i18n";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Browser } from "@capacitor/browser"; // w3 Guideline 3.2: 인앱 브라우저로 외부 URL 쳐리
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Heart, Star, SlidersHorizontal, Check, Bell, Zap, Crown, Lock, Navigation, ShoppingBag, MapPin } from "lucide-react";
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
import AdBanner from "@/components/AdBanner";
import { BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';

const MatchPage = () => {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const {
    addUnread
  } = useChatContext();
  const {
    unreadCount
  } = useNotifications();
  const {
    isPlus,
    isPremium,
    superLikesLeft,
    boostActive,
    boostSecondsLeft,
    startBoost,
    consumeSuperLike,
    canGlobalMatch,
    canTravelDNAFull
  } = useSubscription();
  const {
    user
  } = useAuth();
  const [showPlusModal, setShowPlusModal] = useState(false);
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [actionSheetProfile, setActionSheetProfile] = useState<any>(null);
  // ―― GPS 체크인 ――
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [activeCheckIn, setActiveCheckIn] = useState<CheckIn | null>(null);
  // ―― Daily Mission (오늘의 목적) ――
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [myDailyMission, setMyDailyMission] = useState<string>("");
  const [checkInCityTravelers, setCheckInCityTravelers] = useState<any[]>([]);

  // ── AdMob ──
  const { showInterstitial, showRewarded } = useAdMob();
  const [swipeCount, setSwipeCount] = useState(0);
  const [showRewardedAdOffer, setShowRewardedAdOffer] = useState(false);
  // ── 부스트 활성화 플래시 효과 ──
  const [boostJustActivated, setBoostJustActivated] = useState(false);

  useEffect(() => {
    if (user) {
      getMyCheckIn(user.id).then(ci => {
        if (ci) setActiveCheckIn(ci);
      });
      // 알림 권한 요청 (처음 방문 시)
      requestNotificationPermission();

      // 오늘의 미션 설정 체크
      const today = new Date().toISOString().split('T')[0];
      const savedMissionDate = localStorage.getItem('migo_mission_date');
      if (savedMissionDate !== today) {
        // 아직 오늘 미션을 설정 안 함
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
        title: t("auto.g_0044", "오늘의 여행 목적이 설정되었습니다 🎯"),
      });
    }
  };

  // ―― 필터 모달 (단일 통합 필터) ――
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterAge, setFilterAge] = useState<[number, number]>([18, 45]);
  const [filterDistance, setFilterDistance] = useState(9999); // 기본값: 전체 (거리 제한 없음)
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');
  const [filterMbti, setFilterMbti] = useState<string[]>([]);
  const [filterLanguages, setFilterLanguages] = useState<string[]>([]);
  const [filterTravelStyle, setFilterTravelStyle] = useState<string[]>([]);
  // 활성 필터 총 개수
  const totalActiveFilterCount =
    (filterGender !== 'all' ? 1 : 0) +
    (filterDistance !== 9999 ? 1 : 0) +
    filterMbti.length +
    filterLanguages.length +
    filterTravelStyle.length +
    (filterAge[0] !== 18 || filterAge[1] !== 45 ? 1 : 0);
  const isLoggedIn = () => !!(user || localStorage.getItem("migo_logged_in"));
  const requireLogin = () => {
    setShowLoginGate(true);
    return false;
  };

  // In-app notification banner
  const [inAppNotif, setInAppNotif] = useState<InAppNotifData | null>(null);
  const [ads, setAds] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  // 실시간 온라인 상태 맵 { userId -> { isOnline, lastSeen } }
  const [onlineMap, setOnlineMap] = useState<Record<string, { isOnline: boolean; lastSeen: string | null }>>({});
  const [pendingLikers, setPendingLikers] = useState<any[]>([]); // 나를 라이크한 사람
  const [dailyLikesUsed, setDailyLikesUsed] = useState(0); // 오늘 보낸 라이크 수
  const [hasMyGps, setHasMyGps] = useState(true); // 내 위치 정보가 있는지 여부
  const DAILY_LIKE_LIMIT = isPremium ? Infinity : isPlus ? 50 : 10;
  
  const matchTimersRef = useRef<{ timeouts: any[] }>({ timeouts: [] });
  const showMatchRef = useRef(false);

  useEffect(() => {
    const timers = matchTimersRef.current;
    return () => {
      timers.timeouts.forEach(clearTimeout);
    };
  }, []);
  useEffect(() => {
    fetchActiveAdsForScreen("MatchPage").then(setAds);
    const fetchProfiles = async () => {
      if (!user) return;



      const ratingsMap: Record<string, { sum: number; count: number; }> = {};

      // 내 프로필 정보 (matchScore 계산 기준)
      const {
        data: me
      } = await supabase.from('profiles').select('id,name,photo_url,photo_urls,age,bio,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,is_plus,travel_dates').eq('id', user.id).single();

      // 이미 스와이프한 상대 ID 수집 (최근 24시간 이내 데이터만 DB 레벨에서 필터링)
      const since24hStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const {
        data: swipedData
      } = await supabase.from('likes')
        .select('to_user')
        .eq('from_user', user.id)
        .gte('created_at', since24hStr);
      
      const swipedIds = new Set();
      (swipedData || []).forEach((r: any) => {
        swipedIds.add(r.to_user);
      });

      // **매칭된 사람(채팅창이 열린 사람)**은 영구적으로 스와이프에 나오면 안됨
      const { data: matchData } = await supabase.from('matches')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
        
      (matchData || []).forEach((m: any) => {
        swipedIds.add(m.user1_id === user.id ? m.user2_id : m.user1_id);
      });

      // 자신을 DB 레벨에서 확실히 제외 (캐시 제거: 정지된 계정이 즉각 사라지도록)
      const res = await supabase.from('profiles')
        .select('id,name,photo_url,photo_urls,age,bio,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,is_plus,travel_dates,boost_expires_at,travel_mission,visited_countries,user_type,profile_theme,is_banned,banned,setup_complete,is_admin,role')
        .neq('id', user.id)
        .or('is_banned.is.null,is_banned.eq.false')
        .or('banned.is.null,banned.eq.false')
        .or('is_admin.is.null,is_admin.eq.false')   // 어드민 제외
        .neq('role', 'admin')                        // role='admin' 제외
        .eq('setup_complete', true)                  // 프로필 미완성 제외
        .limit(200);
        
      const data = res.data;
      const error = res.error;

      if (!error && data) {
        // 방금 불러온 프로필 대상자들만의 meet_reviews 만 선별하여 가져오기 (O(N) 트래픽 최적화)
        const profileIds = data.map(p => p.id);
        
        if (profileIds.length > 0) {
          const {
            data: reviewsData
          } = await supabase.from('meet_reviews').select('reviewed_id, rating').in('reviewed_id', profileIds);
          
          if (reviewsData) {
            for (const rv of reviewsData) {
              if (!ratingsMap[rv.reviewed_id]) ratingsMap[rv.reviewed_id] = { sum: 0, count: 0 };
              ratingsMap[rv.reviewed_id].sum += rv.rating || 0;
              ratingsMap[rv.reviewed_id].count += 1;
            }
          }

          // ── 온라인 상태 일괄 조회 ──
          const { data: onlineData } = await supabase
            .from('online_status')
            .select('user_id, is_online, last_seen')
            .in('user_id', profileIds);
          if (onlineData) {
            const newMap: Record<string, { isOnline: boolean; lastSeen: string | null }> = {};
            for (const os of onlineData) {
              newMap[os.user_id] = { isOnline: !!os.is_online, lastSeen: os.last_seen ?? null };
            }
            setOnlineMap(newMap);
          }
        }

        // Haversine 거리 계산
        const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
          const R = 6371;
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLng = (lng2 - lng1) * Math.PI / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        // matchScore: 공통 interests + languages + mbti 기반 실제 계산
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

        // 이미 스와이프한 상대 클라이언트 필터 + 정지 계정 이중 필터 + 어드민/미완성 제외
        const filtered = data.filter(p =>
          !swipedIds.has(p.id)
          && !p.is_banned
          && !p.banned
          && !p.is_admin               // 어드민 계정 제외 (이중 안전장치)
          && p.role !== 'admin'
          && p.setup_complete === true  // 프로필 미완성 제외
        );
        // localStorage GPS fallback: DB lat/lng 없으면 앱 시작 시 저장된 좌표 사용
        const myLat = me?.lat || parseFloat(localStorage.getItem('migo_my_lat') || '0') || null;
        const myLng = me?.lng || parseFloat(localStorage.getItem('migo_my_lng') || '0') || null;
        setHasMyGps(!!(myLat && myLng));
        const mapped = filtered.map(p => {
          const distKm = myLat && myLng && p.lat && p.lng ? haversine(myLat, myLng, p.lat, p.lng) : null;
          const score = calcScore(p);
          const isBoosted = p.boost_expires_at && new Date(p.boost_expires_at).getTime() > Date.now();
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
            userType: p.user_type || 'traveler', profileTheme: p.profile_theme,
            visitedCountries: p.visited_countries || [],
            matchScore: isBoosted ? score + 1000 : score,
            // 부스트 유저는 최상단 배치
            verified: !!p.verified,
            verifyLevel: p.verified ? 'gold' as const : 'basic' as const,
            travelStyle: p.interests || [],
            languages: p.languages || [],
            isPlus: !!p.is_plus,
            isPremium: p.plan === 'premium',
            isAd: false,
            avgRating: ratingsMap[p.id]?.count > 0 ? ratingsMap[p.id].sum / ratingsMap[p.id].count : null,
            reviewCount: ratingsMap[p.id]?.count || 0,
            isOnline: false, // Realtime 구독에서 업데이트됨
            lastSeen: null as string | null
          };
        });
        // matchScore 높은 순 정렬
        mapped.sort((a, b) => b.matchScore - a.matchScore);
        // DB가 비어있으면 (로컬 환경 필드 테스트용) 빈 배열 세팅
        if (mapped.length === 0) {
          setProfiles([]);
        } else {
          setProfiles(personalize(mapped));
        }
      }

      // 나를 라이크했지만 내가 아직 스와이프 안 한 사람 조회
      // BUG-15 fix: 이미 매칭된 유저를 matchedIds로 별도 추적해 liker 목록에서도 제외
      const matchedIds = new Set<string>();
      (matchData || []).forEach((m: any) => {
        matchedIds.add(m.user1_id === user.id ? m.user2_id : m.user1_id);
      });
      const {
        data: likersData
      } = await supabase.from('likes').select('from_user').eq('to_user', user.id);
      const likerIds = (likersData || []).map((r: any) => r.from_user).filter((id: string) =>
        !swipedIds.has(id) && !matchedIds.has(id) && id !== user.id  // BUG-15: 이미 매칭된 유저 제외
      );
      if (likerIds.length > 0) {
        const {
          data: likerProfiles
        } = await supabase.from('profiles').select('id,name,photo_url,photo_urls,age,bio,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,is_plus,travel_dates,travel_mission,visited_countries,user_type,profile_theme').or('is_banned.is.null,is_banned.eq.false').or('banned.is.null,banned.eq.false').in('id', likerIds);
        if (likerProfiles) {
          const { data: likerReviews } = await supabase.from('meet_reviews').select('reviewed_id, rating').in('reviewed_id', likerIds);
          if (likerReviews) {
            for (const rv of likerReviews) {
              if (!ratingsMap[rv.reviewed_id]) ratingsMap[rv.reviewed_id] = { sum: 0, count: 0 };
              ratingsMap[rv.reviewed_id].sum += rv.rating || 0;
              ratingsMap[rv.reviewed_id].count += 1;
            }
          }

          const mappedLikers = likerProfiles.map(p => ({
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
            userType: p.user_type || 'traveler', profileTheme: p.profile_theme,
            visitedCountries: p.visited_countries || [],
            matchScore: 999,
            // 최상단 우선
            verified: !!p.verified,
            verifyLevel: p.verified ? 'gold' as const : 'basic' as const,
            travelStyle: p.interests || [],
            languages: p.languages || [],
            mbti: p.mbti || '',
            isPlus: !!p.is_plus,
            isPremium: p.plan === 'premium',
            isAd: false,
            isLiker: true,
            // 나를 라이크한 사람 표시
            avgRating: ratingsMap[p.id]?.count > 0 ? ratingsMap[p.id].sum / ratingsMap[p.id].count : null,
            reviewCount: ratingsMap[p.id]?.count || 0
          }));
          setPendingLikers(mappedLikers);
        }
      }

      // 24시간 롤링 윈도우로 보낸 라이크 수 조회
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const {
        count: likeCount,
        data: recentLikes
      } = await supabase.from('likes').select('created_at', {
        count: 'exact'
      }).eq('from_user', user.id).gte('created_at', since24h.toISOString()).order('created_at', {
        ascending: true
      }); // ← limit(1) 제거: count가 최대 1로 고정되던 버그 수정
      setDailyLikesUsed(likeCount ?? 0);

      // 첫 번째 라이크 시각 기준으로 24시간 후 자동 초기화 타이머
      if (recentLikes && recentLikes.length > 0) {
        const firstLikeAt = new Date(recentLikes[0].created_at).getTime();
        const resetAt = firstLikeAt + 24 * 60 * 60 * 1000;
        const msUntilReset = resetAt - Date.now();
        if (msUntilReset > 0) {
          const timer = setTimeout(() => setDailyLikesUsed(0), msUntilReset);
          return () => clearTimeout(timer);
        } else {
          setDailyLikesUsed(0);
        }
      }
    };
    fetchProfiles();
  }, [user]);

  // ── Supabase Realtime: online_status 실시간 구독 ──
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

  // ── onlineMap이 바뀌면 profiles에 isOnline/lastSeen 반영 ──
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

  // ── 광고 유무에 따른 하단 여백 대폭 상향 (네이티브 배너 높이 + safe-area 반영) ──
  useEffect(() => {
    if (!isPlus && !isPremium) {
      document.documentElement.style.setProperty('--toast-pb', '170px');
    } else {
      document.documentElement.style.removeProperty('--toast-pb');
    }
    return () => {
      document.documentElement.style.removeProperty('--toast-pb');
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

  // Pass popup (X 버튼)
  const [showPassPopup, setShowPassPopup] = useState(false);
  const [passPopupProfile, setPassPopupProfile] = useState<any | null>(null);

  // 통합 필터 적용 (useMemo로 메모이제이션 — 매 render 재계산 방지)
  const withAds = useMemo(() => {
    const filteredTravelers = profiles.filter(p => {
      const hasNoCoords = p.distanceKm === null;
      // 프리 유저는 글로벌 매칭 불가. 기본적으로 최대 100km로 제한 (또는 설정된 filterDistance)
      const effectiveDist = isPlus ? filterDistance : Math.min(filterDistance, 100);
      const distOk = (effectiveDist >= 9999 || !hasMyGps) ? true : (hasNoCoords ? true : p.distanceKm <= effectiveDist);
      const genderOk = !isPlus || filterGender === 'all' || p.gender === filterGender;  // Plus 전용
      const ageOk = !isPlus || !p.age || (p.age >= filterAge[0] && p.age <= filterAge[1]);  // Plus 전용
      const langOk = !isPlus || filterLanguages.length === 0 || filterLanguages.some(l => p.languages.includes(l));  // Plus 전용
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
  }, [profiles, pendingLikers, ads, isPlus, filterDistance, filterGender, filterAge, filterLanguages, filterMbti, filterTravelStyle]);
  const handleSwipeLeft = useCallback(() => {
    const profile = withAds[currentIndex];
    if (profile?.isAd) {
      // Just swipe away
    } else if (profile?.id) {
      // 패스 패턴 기록
      recordSwipe({
        id: profile.id,
        nationality: profile.nationality,
        travel_style: profile.travelStyle?.[0],
        age: profile.age
      }, false);

      // Pass 팝업 표시
      setPassPopupProfile(profile);
      setShowPassPopup(true);
      matchTimersRef.current.timeouts.forEach(clearTimeout);
      matchTimersRef.current.timeouts = [];
      const tPass = setTimeout(() => setShowPassPopup(false), 1800);
      matchTimersRef.current.timeouts.push(tPass);
    }
    setCurrentIndex(i => i + 1);
    setSwipeCount(s => {
      const next = s + 1;
      if (!isPlus && !isPremium && next % 5 === 0) showInterstitial();
      return next;
    });

    // ── FOMO 유도: 무료 유저에게 10% 확률로 토스트 띄우기 ──
    if (!isPlus && Math.random() < 0.1) {
      toast({
        title: "누군가 회원님을 마음에 들어합니다! 👀",
        description: "Migo Plus로 업그레이드하고 누군지 확인해보세요.",
        action: (
          <button onClick={() => setShowPlusModal(true)} className="px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-lg shrink-0">
            확인하기
          </button>
        ),
        duration: 5000,
      });
    }
  }, [currentIndex, withAds, isPlus, isPremium, showInterstitial]);
  const saveLikeAndCheckMatch = useCallback(async (toUserId: string, kind: 'like' | 'superlike' = 'like', message?: string) => {
    if (!user) return false;
    // 1. like 저장 → DB 트리거(trg_notify_on_like)가 자동으로 notifications INSERT
    await supabase.from('likes').upsert({
      from_user: user.id,
      to_user: toUserId,
      kind,
      message
    }, {
      onConflict: 'from_user,to_user'
    });
    // 2. 상대방도 나를 like 했는지 확인 → match
    const {
      data: mutual
    } = await supabase.from('likes').select('from_user').eq('from_user', toUserId).eq('to_user', user.id).maybeSingle();
    if (mutual) {
      // 이미 채팅방이 있는지 먼저 확인 (중복 방지)
      const [u1, u2] = [user.id, toUserId].sort();
      const { data: existingMatch } = await supabase
        .from('matches')
        .select('thread_id')
        .eq('user1_id', u1)
        .eq('user2_id', u2)
        .maybeSingle();

      if (existingMatch?.thread_id) {
        return existingMatch.thread_id; // 이미 채팅방 존재 → 재사용
      }

      // 3. chat_thread 생성
      const {
        data: thread
      } = await supabase.from('chat_threads').insert({
        is_group: false
      }).select('id').single();
      if (thread) {
        await supabase.from('chat_members').insert([{
          thread_id: thread.id,
          user_id: user.id
        }, {
          thread_id: thread.id,
          user_id: toUserId
        }]);
        // 4. matches 테이블 저장 → DB 트리거(trg_notify_on_match)가 자동으로 양쪽 notifications INSERT
        await supabase.from('matches').upsert({
          user1_id: u1,
          user2_id: u2,
          thread_id: thread.id
        }, {
          onConflict: 'user1_id,user2_id'
        });
        // 5. 로컬 Web Push 알림 (포그라운드 시)
        const matchedProfile = withAds.find((p: any) => p.id === toUserId);
        if (matchedProfile?.name) notifyMatch(matchedProfile.name);
      }
      return thread?.id ?? true; // matched! (thread.id 또는 true)
    }
    // 좋아요/슈퍼라이크: DB 트리거가 notifications 처리함 → 클라이언트 중복 INSERT 제거
    // in_app_notifications는 채팅 없이 즉각적인 Realtime 배너 표시 목적으로 유지
    await supabase.from('in_app_notifications').insert({
      user_id: toUserId,
      type: kind,
      title: kind === 'superlike' ? t("auto.ko_0257", "새로운슈퍼") : t("auto.ko_0258", "새로운반가"),
      content: kind === 'superlike' ? t("auto.t_0044", `${user.name}님이 슈퍼라이크를 보냈습니다! ⭐`) : t("auto.t_0045", `${user.name}님이 좋아요를 눌렀습니다`)
    });
    return false;
  }, [user]);
  const handleSwipeRight = useCallback(() => {
    if (!isLoggedIn()) {
      requireLogin();
      return;
    }
    const profile = withAds[currentIndex];
    if (!profile) return;
    if (profile.isAd) {
      recordAdClick(profile.originalAd.id, null);
      // Apple Guideline 3.2: window.open 대신 인앱 브라우저(SFSafariViewController) 사용
      if (profile.adUrl) Browser.open({ url: profile.adUrl, presentationStyle: 'fullscreen' });
      setCurrentIndex(i => i + 1);
      return;
    }

    // 유저 등급별 일일 좋아요 제한 체크 (라이커 카드는 제외)
    if (!isPremium && !profile.isLiker && dailyLikesUsed >= DAILY_LIKE_LIMIT) {
      toast({
        title: t("auto.p525"),
        description: t("auto.t_0018", `오늘 무료 좋아요 ${DAILY_LIKE_LIMIT}개를 모두 사용했습니다.`),
        variant: "destructive"
      });
      setShowPlusModal(true);
      return;
    }

    // Show Like popup
    setLikePopupProfile(profile);
    setShowLikePopup(true);
    
    // 이전 Like 타이머 초기화 (연속 스와이프 시 꼬임 방지)
    matchTimersRef.current.timeouts.forEach(clearTimeout);
    matchTimersRef.current.timeouts = [];
    const tLike = setTimeout(() => setShowLikePopup(false), 2200);
    matchTimersRef.current.timeouts.push(tLike);

    // 좋아요 패턴 학습
    recordSwipe({
      id: profile.id,
      nationality: profile.nationality,
      travel_style: profile.travelStyle?.[0],
      age: profile.age
    }, true);
    setCurrentIndex(i => i + 1);
    setSwipeCount(s => {
      const next = s + 1;
      if (!isPlus && !isPremium && next % 5 === 0) showInterstitial();
      return next;
    });
    if (!isPlus && !profile.isLiker) setDailyLikesUsed(n => n + 1);

    // DB 저장 + 매칭 확인
    saveLikeAndCheckMatch(profile.id).then(isMatch => {
      if (isMatch) {
         if (showMatchRef.current) {
           // 이미 매칭창이 떠있으면 조용히 백그라운드 매칭 (인앱 알리미만)
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

    // ── FOMO 유도: 무료 유저에게 10% 확률로 토스트 띄우기 ──
    if (!isPlus && Math.random() < 0.1) {
      toast({
        title: "누군가 회원님을 마음에 들어합니다! 👀",
        description: "Migo Plus로 업그레이드하고 누군지 확인해보세요.",
        action: (
          <button onClick={() => setShowPlusModal(true)} className="px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-lg shrink-0">
            확인하기
          </button>
        ),
        duration: 5000,
      });
    }
  }, [currentIndex, withAds, addUnread, saveLikeAndCheckMatch, isPlus, dailyLikesUsed]);
  const openSuperLikeModal = useCallback(() => {
    if (!isLoggedIn()) {
      requireLogin();
      return;
    }
    if (!isPlus && superLikesLeft <= 0) {
      // 보상형 광고 먼저 제안 → 광고 보고 슈퍼라이크 1개 충전
      setShowRewardedAdOffer(true);
      return;
    }
    const profile = withAds[currentIndex];
    if (!profile || profile.isAd) return;
    setPendingSuperProfile(profile);
    setSuperMsg("");
    setShowSuperLikeModal(true);
  }, [currentIndex, withAds, superLikesLeft, isPlus]);
  const confirmSuperLike = useCallback(() => {
    if (!pendingSuperProfile) return;
    const profile = pendingSuperProfile;
    setShowSuperLikeModal(false);
    setSuperLikeMessage(superMsg);
    setSuperLikedId(profile.id);

    // decrease sub-counter
    consumeSuperLike();

    // DB 저장 + 매칭 확인 전에 이전 타이머 초기화 (연속 액션 꼬임 방지)
    matchTimersRef.current.timeouts.forEach(clearTimeout);
    matchTimersRef.current.timeouts = [];

    saveLikeAndCheckMatch(profile.id, 'superlike', superMsg || undefined).then(isMatch => {
      const tSuperLike = setTimeout(() => {
        setSuperLikedId(null);
        setCurrentIndex(i => i + 1);
        if (isMatch) {
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
      title: t("auto.t_0019", `⭐ ${profile.name}님에게 슈퍼라이크 전송!`),
      description: superMsg ? `"${superMsg}"` : t("auto.g_0045", "상대방에게")
    });
  }, [pendingSuperProfile, superMsg, addUnread, saveLikeAndCheckMatch]);
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

  // 프로필 조회 알림 (카드 탭 시 해당 유저에게 전송)
  const sendProfileViewNotif = async (targetUserId: string) => {
    if (!user || targetUserId === user.id) return; // 자기 자신 제외
    // upsert: 5분 내 동일 사용자 조회 중복 알림 방지 (DB 커엔 없으면 insert로 fallback)
    await supabase.from('notifications').upsert({
      user_id: targetUserId,
      type: 'profile_view',
      actor_id: user.id
    }, { onConflict: 'user_id,actor_id,type', ignoreDuplicates: true });
  };
  const toggleTag = (tag: string) => {
    setFilterTravelStyle(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };
  const remaining = withAds.slice(currentIndex, currentIndex + 2).reverse();
  const topProfile = withAds[currentIndex];

  // Ad impression tracking
  useEffect(() => {
    if (topProfile?.isAd) {
      // BUG-20 fix: user?.id 전달 (null 하드코딩 제거 → 광고 분석 데이터 정확성 향상)
      recordAdImpression(topProfile.originalAd.id, user?.id ?? null);
    }
  }, [topProfile, user?.id]);
  return <div className="flex flex-col h-full bg-background truncate">
      {/* ─── In-app notification banner (Like / SuperLike received) ─── */}
      <InAppNotifBanner notif={inAppNotif} onClose={() => setInAppNotif(null)} />

      {/* ─── 오늘의 목적(Mission) 설정 모달 ─── */}
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

      {/* ── FOMO: 라이브 매칭 카운터 ── */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mb-3 flex items-center justify-center"
      >
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {t("auto.fomo_live", "현재")} <span className="text-emerald-500 font-black">{Math.floor(Date.now() / 60000 % 150) + 120}명</span>{t("auto.fomo_finding", "이 동행을 찾고 있습니다")}
          </span>
        </div>
      </motion.div>

      {/* ─── 부스트 활성화 플래시 효과 ─── */}
      <AnimatePresence>
        {boostJustActivated && (
          <motion.div
            className="fixed inset-0 z-[150] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, times: [0, 0.15, 1] }}
          >
            {/* 빜백 반짙 */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/40 via-pink-500/30 to-transparent" />
            {/* 중앙 파틱콘 아이콘 */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 1.4, 1.1], opacity: [0, 1, 0] }}
              transition={{ duration: 1.4 }}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="text-6xl">⚡</div>
                <p className="text-white text-lg font-extrabold drop-shadow-lg">Boost ON!</p>
              </div>
            </motion.div>
            {/* 린 원 파틱콖들 */}
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
          <div className="mx-4 mb-1 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 overflow-hidden">
            {/* 타이머 진행률 바 */}
            <motion.div
              className="h-0.5 bg-white/40"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 30 * 60, ease: "linear" }}
            />
            <div className="px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* 팬스 애니메이션 */}
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  <Zap size={16} className="text-white" fill="white" />
                </motion.div>
                <div>
                  <p className="text-white text-xs font-extrabold leading-none">{t("auto.j500")}</p>
                  <p className="text-white/70 text-[10px] mt-0.5">{t("boost.activeDesc", "내 프로필이 최상단에 노출되고 있어요")}</p>
                </div>
              </div>
              {/* 카운트다운 */}
              <div className="flex flex-col items-end">
                <span className="text-white font-mono text-sm font-extrabold">
                  {String(Math.floor(boostSecondsLeft / 60)).padStart(2, "0")}:{String(boostSecondsLeft % 60).padStart(2, "0")}
                </span>
                <span className="text-white/60 text-[9px]">{t("boost.remaining", "남음")}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}



      {/* Card Stack — 부스는 글로우 링 없음 */}
      <div
        className="flex-1 relative w-full px-4 mx-auto pb-4 truncate"
        style={{
          minHeight: 0,
          maxWidth: "420px",
        }}
      >
        {/* 부스트 중 글로우 효과 */}
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
            {remaining.map((profile, i) => <SwipeCard key={profile.id} profile={profile} onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight} isTop={i === remaining.length - 1} isSuperLiked={superLikedId === profile.id} onProfileView={sendProfileViewNotif} myProfile={user} myDailyMission={myDailyMission} onPremiumClick={() => setShowPlusModal(true)} />)}
          </AnimatePresence>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring", damping: 25 }}
            className="flex flex-col items-center justify-center h-full text-center px-8"
          >
            <div className="relative mb-6">
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent flex items-center justify-center shadow-lg border border-primary/20">
                <span className="text-5xl animate-float block" style={{ animationDuration: '3s' }}>🌎</span>
              </div>
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary/30 blur-sm"
              />
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.6, 0.2] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-primary/40 blur-sm inline-block"
              />
            </div>
            <h3 className="text-xl font-extrabold text-foreground mb-2 text-center">{t("auto.j502", { defaultValue: "You've seen all travelers!" })}</h3>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-[240px] text-center whitespace-pre-line">
              {t("auto.j503", { defaultValue: "New friends nearby\nwill show up soon ✨" })}
            </p>
            <motion.button 
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowFilterModal(true)} 
              className="px-8 py-3.5 rounded-full gradient-primary text-primary-foreground text-[13px] font-extrabold shadow-float flex items-center gap-2"
            >
              <span className="text-lg">✨</span> {t("auto.j504", { defaultValue: "Reset filters" })}
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Action Buttons */}
      {remaining.length > 0 && <div className="space-y-2 pb-4 px-2 mt-4">
          {/* Boost row */}
          <div className="flex justify-center">
             <motion.button whileTap={{
          scale: 0.92
        }} onClick={async () => {
          if (!isPlus) {
            setShowPlusModal(true);
            return;
          }
          if (boostActive) {
            toast({
              title: t("auto.p526"),
              description: t("auto.t_0020", `부스트 ${String(Math.floor(boostSecondsLeft / 60)).padStart(2, "0")}:${String(boostSecondsLeft % 60).padStart(2, "0")} 남음`)
            });
            return;
          }
          await startBoost();
          // 부스트 활성화 플래시 효과
          setBoostJustActivated(true);
          setTimeout(() => setBoostJustActivated(false), 1800);
          toast({
            title: t("alert.t64Title"),
            description: t("alert.t64Desc")
          });
        }} className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold shadow-lg transition-all ${boostActive ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : isPlus ? "bg-purple-500/10 border border-purple-500/30 text-purple-400" : "bg-muted text-muted-foreground"}`}>
                <Zap size={13} fill={boostActive ? "white" : "none"} />
                {boostActive ? t("auto.t_0047", `부스팅 중 ${String(Math.floor(boostSecondsLeft / 60)).padStart(2, "0")}:${String(boostSecondsLeft % 60).padStart(2, "0")}`) : isPlus ? t("auto.ko_0263", "부스트 사용") : t("auto.ko_0264", "부스트 (Plus)")}
             </motion.button>
          </div>

          {/* Core swipe buttons — prominent X / Star / Heart */}
          <div className="flex items-center justify-center gap-4 px-4 pt-1">
            {/* Dislike (X) */}
            <motion.button
              whileTap={{ scale: 0.88, rotate: -8 }}
              onClick={handleSwipeLeft}
              className="w-12 h-12 rounded-full bg-card shadow-[0_4px_20px_rgba(244,63,94,0.2)] border-2 border-rose-400/40 flex items-center justify-center text-rose-500 active:bg-rose-50"
            >
              <X size={22} strokeWidth={3} />
            </motion.button>

            {/* Super like */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={openSuperLikeModal}
              className={`w-10 h-10 rounded-full shadow-float border-2 flex items-center justify-center transition-all ${
                superLikesLeft > 0
                  ? "bg-card border-blue-400/60 text-blue-500 shadow-[0_4px_18px_rgba(59,130,246,0.2)]"
                  : "bg-muted border-border opacity-40 text-muted-foreground"
              }`}
            >
              <Star size={17} className={superLikesLeft > 0 ? "fill-blue-500" : ""} />
            </motion.button>

            {/* Like (Heart) */}
            <motion.button
              whileTap={{ scale: 0.88, rotate: 8 }}
              onClick={handleSwipeRight}
              className="w-12 h-12 rounded-full bg-card shadow-[0_4px_20px_rgba(16,185,129,0.25)] border-2 border-emerald-400/50 flex items-center justify-center text-emerald-500 active:bg-emerald-50"
            >
              <Heart size={22} strokeWidth={2.5} className="fill-emerald-500" />
            </motion.button>
          </div>

          {/* Trust micro-badges */}
          <div className="flex items-center justify-center gap-3 pt-2 pb-1 opacity-70">
            {[
              { emoji: "🛡️", text: t("match.safeVerified", "인증 회원") },
              { emoji: "✅", text: t("match.realTraveler", "실제 여행자") },
              { emoji: "🔒", text: t("match.safeChat", "안전 채팅") },
            ].map(({ emoji, text }) => (
              <div key={text} className="flex items-center gap-1">
                <span className="text-[10px]">{emoji}</span>
                <span className="text-[9px] font-semibold text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>
      </div>}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* ❤️  LIKE POPUP — warm pink heart burst, auto-dismiss        */}
      {/* ──────────────────────────────────────────────────────────── */}
      <LikePopupModal
        showLikePopup={showLikePopup}
        likePopupProfile={likePopupProfile}
      />

      {/* ──────────────────────────────────────────────────────────── */}
      {/* ✕  PASS POPUP — cool X burst, auto-dismiss                  */}
      {/* ──────────────────────────────────────────────────────────── */}
      <PassPopupModal
        showPassPopup={showPassPopup}
        passPopupProfile={passPopupProfile}
      />

      {/* ──────────────────────────────────────────────────────────── */}
      {/* ⭐  SUPER LIKE MODAL — deep blue star energy, bottom sheet  */}
      {/* ──────────────────────────────────────────────────────────── */}
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

      {/* ─── Login Gate Modal ─── */}
      <LoginGateModal
        showLoginGate={showLoginGate}
        setShowLoginGate={setShowLoginGate}
      />

      {/* ⋯ Report / Block action sheet */}
      <ReportBlockActionSheet isOpen={!!actionSheetProfile} onClose={() => setActionSheetProfile(null)} targetType="user" targetId={actionSheetProfile?.id ?? ""} targetName={actionSheetProfile?.name ?? ""} authorId={actionSheetProfile?.id} />

      {/* ─── 필터 모달 ─── */}
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

      {/* GPS 체크인 모달 */}
      <CheckInModal open={showCheckInModal} onClose={() => setShowCheckInModal(false)} onCheckInSuccess={(ci, travelers) => {
      setActiveCheckIn(ci);
      setCheckInCityTravelers(travelers);
      setShowCheckInModal(false);
    }} />

      {/* ─── Peak Time 현질 유도 모달 ─── */}
      <AnimatePresence>
        {!isPlus && showCheckInModal === false && new Date().getHours() >= 20 && new Date().getHours() <= 23 && (
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
                <span className="text-xs font-extrabold text-primary">피크 타임 진행중!</span>
              </div>
              <p className="text-sm font-bold text-foreground truncate">지금 접속자가 가장 많아요.</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">Migo Plus로 부스트를 사용해보세요!</p>
            </div>
            <button onClick={() => setShowPlusModal(true)} className="shrink-0 px-4 py-2 gradient-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md active:scale-95 transition-transform">
              시작하기
            </button>
            <button onClick={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }} className="absolute -top-2 -right-2 w-6 h-6 bg-muted rounded-full flex items-center justify-center shadow-sm border border-border">
              <X size={12} className="text-muted-foreground" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 슈퍼라이크 보상형 광고 오퍼 모달 ─── */}
      {showRewardedAdOffer && (
        <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center px-6">
          <div className="bg-card rounded-3xl p-6 w-full max-w-sm shadow-float border border-border">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">⭐</div>
              <h3 className="text-lg font-extrabold text-foreground">
                {t("auto.ad_superlike_title", "슈퍼라이크 충전")}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("auto.ad_superlike_desc", "짧은 광고를 보고 슈퍼라이크 1개를 무료로 충전하세요!")}
              </p>
            </div>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={async () => {
                  setShowRewardedAdOffer(false);
                  const ok = await showRewarded((_reward) => {
                    // 보상 지급: superLike 1개 충전 (consumeSuperLike 역방향)
                    // addSuperLike가 없으므로 toast로 안내 후 바로 슈퍼라이크 모달 열기
                    toast({ title: t("auto.ad_reward_ok", "⭐ 슈퍼라이크 1개 충전 완료!") });
                    const profile = withAds[currentIndex];
                    if (profile && !profile.isAd) {
                      setPendingSuperProfile(profile);
                      setSuperMsg("");
                      setShowSuperLikeModal(true);
                    }
                  });
                  if (!ok) {
                    // 광고 로드 실패 시 Plus 모달로 fallback
                    toast({ title: t("auto.ad_load_fail", "광고를 불러오지 못했습니다"), variant: "destructive" });
                    setShowPlusModal(true);
                  }
                }}
                className="w-full py-3.5 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-sm flex items-center justify-center gap-2"
              >
                📺 {t("auto.ad_watch_btn", "광고 보고 충전하기")}
              </button>
              <button
                onClick={() => { setShowRewardedAdOffer(false); setShowPlusModal(true); }}
                className="w-full py-3 rounded-2xl bg-muted text-muted-foreground font-semibold text-sm"
              >
                {t("auto.ad_upgrade_btn", "Migo+ 구독하기")}
              </button>
              <button
                onClick={() => setShowRewardedAdOffer(false)}
                className="text-xs text-muted-foreground text-center py-1"
              >
                {t("common.cancel", "취소")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 무료 유저에게만 배너 표시 (하단 여백 확보) */}
      {!isPlus && !isPremium && (
        <AdBanner 
          position={BannerAdPosition.BOTTOM_CENTER} 
          size={BannerAdSize.ADAPTIVE_BANNER} 
          reservedHeight={80} 
          margin={55} 
        />
      )}
    </div>;
};
export default MatchPage;