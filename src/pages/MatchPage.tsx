import i18n from "@/i18n";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
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
import TodayContent from "@/components/TodayContent";
import MatchResultCard from "@/components/MatchResultCard";
import { recordSwipe, personalize } from "@/lib/personalizeService";
import { requestNotificationPermission, notifyMatch } from "@/lib/notificationService";
import { MoreHorizontal } from "lucide-react";
import { MissionModal, LikePopupModal, SuperLikeModal, LoginGateModal, FilterModal } from "./match/MatchModals";
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
  const [filterDistance, setFilterDistance] = useState(10); // 기본값: 10km
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');
  const [filterMbti, setFilterMbti] = useState<string[]>([]);
  const [filterLanguages, setFilterLanguages] = useState<string[]>([]);
  const [filterTravelStyle, setFilterTravelStyle] = useState<string[]>([]);
  // 활성 필터 총 개수
  const totalActiveFilterCount =
    (filterGender !== 'all' ? 1 : 0) +
    (filterDistance !== 10 ? 1 : 0) +
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
  const [pendingLikers, setPendingLikers] = useState<any[]>([]); // 나를 라이크한 사람
  const [dailyLikesUsed, setDailyLikesUsed] = useState(0); // 오늘 보낸 라이크 수
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

      // 이미 스와이프한 상대 ID 수집 (최근 24시간 이내 데이터만)
      const {
        data: swipedData
      } = await supabase.from('likes').select('to_user, created_at').eq('from_user', user.id);
      
      const swipedIds = new Set();
      const now = Date.now();
      const H24 = 24 * 60 * 60 * 1000;
      (swipedData || []).forEach((r: any) => {
        if (now - new Date(r.created_at).getTime() < H24) {
          swipedIds.add(r.to_user);
        }
      });

      // **매칭된 사람(채팅창이 열린 사람)**은 영구적으로 스와이프에 나오면 안됨
      const { data: matchData } = await supabase.from('matches')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
        
      (matchData || []).forEach((m: any) => {
        swipedIds.add(m.user1_id === user.id ? m.user2_id : m.user1_id);
      });

      // 자신을 DB 레벨에서 확실히 제외 + 2분 캐시 적용
      const CACHE_KEY = `match:profiles:${user.id}`;
      let data = getCached<any[]>(CACHE_KEY);
      let error = null;

      if (!data) {
        const res = await supabase.from('profiles')
          .select('id,name,photo_url,photo_urls,age,bio,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,is_plus,travel_dates,boost_expires_at,travel_mission,visited_countries,user_type')
          .neq('id', user.id).limit(50);
        data = res.data;
        error = res.error;
        if (data) setCache(CACHE_KEY, data, 2 * 60 * 1000); // 2 min
      }

      if (!error && data) {
        // 방금 불러온 프로필 대상자들만의 meet_reviews 만 선별하여 가져오기 (O(N) 트래픽 최적화)
        const profileIds = data.map(p => p.id);
        
        if (profileIds.length > 0) {
          const {
            data: reviewsData
          } = await supabase.from('meet_reviews').select('target_id, rating').in('target_id', profileIds);
          
          if (reviewsData) {
            for (const rv of reviewsData) {
              if (!ratingsMap[rv.target_id]) ratingsMap[rv.target_id] = { sum: 0, count: 0 };
              ratingsMap[rv.target_id].sum += rv.rating || 0;
              ratingsMap[rv.target_id].count += 1;
            }
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

        // 이미 스와이프한 상대 클라이언트 필터
        const filtered = data.filter(p => !swipedIds.has(p.id));
        // localStorage GPS fallback: DB lat/lng 없으면 앱 시작 시 저장된 좌표 사용
        const myLat = me?.lat || parseFloat(localStorage.getItem('migo_my_lat') || '0') || null;
        const myLng = me?.lng || parseFloat(localStorage.getItem('migo_my_lng') || '0') || null;
        const mapped = filtered.map(p => {
          const distKm = myLat && myLng && p.lat && p.lng ? haversine(myLat, myLng, p.lat, p.lng) : null;
          const score = calcScore(p);
          const isBoosted = p.boost_expires_at && new Date(p.boost_expires_at).getTime() > Date.now();
          return {
            id: p.id,
            name: p.name || t("auto.ko_0246", "알수없음9"),
            age: p.age || 25,
            nationality: p.nationality || '',
            gender: p.gender || '',
            location: p.location || t("match.noLocation"),
            distanceKm: distKm ?? 999,
            distance: distKm !== null ? `${distKm.toFixed(1)}km` : t("map.distanceUnknown"),
            bio: p.bio || t("auto.ko_0247", "안녕하세요"),
            photo: p.photo_url || "",
            photoUrls: p.photo_urls && p.photo_urls.length > 0 ? p.photo_urls : p.photo_url ? [p.photo_url] : [],
            destination: p.location || t("auto.ko_0248", "어딘가"),
            dates: p.travel_dates || t("auto.ko_0249", "미정"),
            tags: p.interests || [],
            travelMission: p.travel_mission || undefined,
            userType: p.user_type || 'traveler',
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
            reviewCount: ratingsMap[p.id]?.count || 0
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
      const {
        data: likersData
      } = await supabase.from('likes').select('from_user').eq('to_user', user.id);
      const likerIds = (likersData || []).map((r: any) => r.from_user).filter((id: string) => !swipedIds.has(id) && id !== user.id);
      if (likerIds.length > 0) {
        const {
          data: likerProfiles
        } = await supabase.from('profiles').select('id,name,photo_url,photo_urls,age,bio,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,is_plus,travel_dates,travel_mission,visited_countries,user_type').in('id', likerIds);
        if (likerProfiles) {
          const { data: likerReviews } = await supabase.from('meet_reviews').select('target_id, rating').in('target_id', likerIds);
          if (likerReviews) {
            for (const rv of likerReviews) {
              if (!ratingsMap[rv.target_id]) ratingsMap[rv.target_id] = { sum: 0, count: 0 };
              ratingsMap[rv.target_id].sum += rv.rating || 0;
              ratingsMap[rv.target_id].count += 1;
            }
          }

          const mappedLikers = likerProfiles.map(p => ({
            id: p.id,
            name: p.name || t("auto.ko_0250", "알수없음"),
            age: p.age || 25,
            nationality: p.nationality || '',
            gender: p.gender || '',
            location: p.location || t("match.noLocation"),
            distanceKm: 999,
            distance: t("map.distanceUnknown"),
            bio: p.bio || t("auto.ko_0251", "안녕하세요"),
            photo: p.photo_url || '',
            photoUrls: p.photo_urls && p.photo_urls.length > 0 ? p.photo_urls : p.photo_url ? [p.photo_url] : [],
            destination: p.location || t("auto.ko_0252", "어딘가"),
            dates: p.travel_dates || t("auto.ko_0253", "미정"),
            tags: p.interests || [],
            travelMission: p.travel_mission || undefined,
            userType: p.user_type || 'traveler',
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

  // 통합 필터 적용 (useMemo로 메모이제이션 — 매 render 재계산 방지)
  const withAds = useMemo(() => {
    const filteredTravelers = profiles.filter(p => {
      const hasNoCoords = p.distanceKm === null || p.distanceKm >= 999;
      const distOk = filterDistance >= 9999 ? true : hasNoCoords ? true : p.distanceKm <= filterDistance;
      const genderOk = filterGender === 'all' || p.gender === (filterGender === 'male' ? t("auto.ko_0254", "남성") : t("auto.ko_0255", "여성")) || p.gender === filterGender;
      const ageOk = !isPlus || !p.age || (p.age >= filterAge[0] && p.age <= filterAge[1]);
      const langOk = !isPlus || filterLanguages.length === 0 || filterLanguages.some(l => p.languages.includes(l));
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
        } else if (!isPlus && ads.length > 0) {
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
    }
    setCurrentIndex(i => i + 1);
  }, [currentIndex, withAds]);
  const saveLikeAndCheckMatch = useCallback(async (toUserId: string, kind: 'like' | 'superlike' = 'like', message?: string) => {
    if (!user) return false;
    // 1. like 저장
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
        // 4. matches 테이블 저장
        const [u1, u2] = [user.id, toUserId].sort();
        await supabase.from('matches').upsert({
          user1_id: u1,
          user2_id: u2,
          thread_id: thread.id
        }, {
          onConflict: 'user1_id,user2_id'
        });
        // 5. 알림 (앱 내 + 웹 푸시)
        const matchedProfile = withAds.find((p: any) => p.id === toUserId);
        if (matchedProfile?.name) notifyMatch(matchedProfile.name);
        await supabase.from('notifications').insert({
          user_id: toUserId,
          type: 'match',
          actor_id: user.id
        });
        await supabase.from('in_app_notifications').insert({
          user_id: toUserId,
          type: 'match',
          title: t("auto.p524"),
          content: t("auto.t_0043", `${user.name}님과 매칭되었습니다!`)
        });
      }
      return thread?.id ?? true; // matched! (thread.id 또는 true)
    }
    // 상대방도 liked 알림
    await supabase.from('notifications').insert({
      user_id: toUserId,
      type: kind === 'superlike' ? 'superlike' : 'like',
      actor_id: user.id,
      target_text: message
    });
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
      if (profile.adUrl) window.open(profile.adUrl, "_blank");
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
  }, [currentIndex, withAds, addUnread, saveLikeAndCheckMatch, isPlus, dailyLikesUsed]);
  const openSuperLikeModal = useCallback(() => {
    if (!isLoggedIn()) {
      requireLogin();
      return;
    }
    if (!isPlus && superLikesLeft <= 0) {
      toast({
        title: t("alert.t63Title"),
        description: t("alert.t63Desc"),
        variant: "destructive"
      });
      setShowPlusModal(true);
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

    // DB 저장
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
    await supabase.from('notifications').insert({
      user_id: targetUserId,
      // 알림 받는 사람 (카드 주인)
      type: 'profile_view',
      actor_id: user.id // 조회한 사람 (나)
    });
  };
  const toggleTag = (tag: string) => {
    setFilterTravelStyle(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };
  const remaining = withAds.slice(currentIndex, currentIndex + 2).reverse();
  const topProfile = withAds[currentIndex];

  // Ad impression tracking
  useEffect(() => {
    if (topProfile?.isAd) {
      recordAdImpression(topProfile.originalAd.id, null);
    }
  }, [topProfile]);
  return <div className="flex flex-col h-screen bg-background safe-bottom truncate">
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
        onFilterClick={() => setShowFilterModal(true)}
        showNearby
        showShop
      />



      {/* 오늘의 콘텐츠 */}
      <TodayContent />

      {/* Boost active banner */}
      {boostActive && <motion.div initial={{
      opacity: 0,
      y: -10
    }} animate={{
      opacity: 1,
      y: 0
    }} className="mx-4 mb-1 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-white" fill="white" />
            <span className="text-white text-xs font-bold truncate">{t("auto.j500")}</span>
          </div>
          <span className="text-white/80 text-xs font-mono truncate">
            {String(Math.floor(boostSecondsLeft / 60)).padStart(2, "0")}:{String(boostSecondsLeft % 60).padStart(2, "0")}
          </span>
        </motion.div>}



      {/* Card Stack */}
      <div className="flex-1 relative w-full px-4 mx-auto pb-4 truncate" style={{
      minHeight: 0, maxWidth: "420px"
    }}>
        {remaining.length > 0 ? (
          <AnimatePresence>
            {remaining.map((profile, i) => <SwipeCard key={profile.id} profile={profile} onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight} isTop={i === remaining.length - 1} isSuperLiked={superLikedId === profile.id} onProfileView={sendProfileViewNotif} myProfile={user} myDailyMission={myDailyMission} />)}
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
            <h3 className="text-xl font-extrabold text-foreground mb-2 truncate">{t("auto.j502", { defaultValue: "모든 여행자를 확인했어요!" })}</h3>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-[240px] truncate">
              {t("auto.j503", { defaultValue: "주변의 새로운 친구들이\n곧 찾아올 거예요 ✨" })}
            </p>
            <motion.button 
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowFilterModal(true)} 
              className="px-8 py-3.5 rounded-full gradient-primary text-primary-foreground text-[13px] font-extrabold shadow-float flex items-center gap-2"
            >
              <span className="text-lg">✨</span> {t("auto.j504", { defaultValue: "필터 다시 설정하기" })}
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
      </div>}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* ❤️  LIKE POPUP — warm pink heart burst, auto-dismiss        */}
      {/* ──────────────────────────────────────────────────────────── */}
      <LikePopupModal
        showLikePopup={showLikePopup}
        likePopupProfile={likePopupProfile}
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
    </div>;
};
export default MatchPage;