import i18n from "@/i18n";
import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Heart, Star, SlidersHorizontal, Check, Bell, Zap, Crown, Lock, Navigation, ShoppingBag, MapPin } from "lucide-react";
import SwipeCard from "@/components/SwipeCard";
import MatchModal from "@/components/MatchModal";
import MigoPlusModal from "@/components/MigoPlusModal";
import InAppNotifBanner, { InAppNotifData } from "@/components/InAppNotifBanner";
import siteLogo from "@/assets/site-logo.png";
import { toast } from "@/hooks/use-toast";
import { useChatContext } from "@/context/ChatContext";
import { useNotifications } from "@/context/NotificationContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { fetchActiveAdsForScreen, recordAdImpression, recordAdClick } from "@/lib/adService";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import ReportBlockActionSheet from "@/components/ReportBlockActionSheet";
import CheckInModal from "@/components/CheckInModal";
import { getMyCheckIn, CheckIn } from "@/lib/checkInService";
import TodayContent from "@/components/TodayContent";
import MatchResultCard from "@/components/MatchResultCard";
import { recordSwipe, personalize } from "@/lib/personalizeService";
import { requestNotificationPermission, notifyMatch } from "@/lib/notificationService";
import { MoreHorizontal } from "lucide-react";
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
    superLikesLeft,
    boostActive,
    boostSecondsLeft,
    startBoost,
    useSuperLike,
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
  const [checkInCityTravelers, setCheckInCityTravelers] = useState<any[]>([]);
  useEffect(() => {
    if (user) {
      getMyCheckIn(user.id).then(ci => {
        if (ci) setActiveCheckIn(ci);
      });
      // 알림 권한 요청 (처음 방문 시)
      requestNotificationPermission();
    }
  }, [user]);
  // ―― 필터 모달 ――
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterAge, setFilterAge] = useState<[number, number]>([18, 45]);
  const [filterDistance, setFilterDistance] = useState(10); // 기본값: 10km
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');
  const [filterMbti, setFilterMbti] = useState<string[]>([]);
  const [filterLanguages, setFilterLanguages] = useState<string[]>([]);
  const [filterTravelStyle, setFilterTravelStyle] = useState<string[]>([]);
  const travelStyleOptions = [t("auto.z_autoz\uCE74\uD398106_157"), t("auto.z_autoz\uD2B8\uB808\uD0B910_158"), t("auto.z_autoz\uC11C\uD551108_159"), t("auto.z_autoz\uC57C\uC2DC\uC7A510_160"), t("auto.z_autoz\uC0AC\uC9C4110_161"), t("auto.z_autoz\uC74C\uC2DD111_162"), t("auto.z_autoz\uAC74\uCD95112_163"), t("auto.z_autoz\uC790\uC5F0113_164"), t("auto.z_autoz\uB7ED\uC154\uB9AC11_165"), t("auto.z_autoz\uBC30\uB0AD115_166")];
  const languageOptions = [t("auto.z_autoz\uD55C\uAD6D\uC5B497_167"), "English", "日本語", "中文", "Español", "Français", "Deutsch", "عربي", "Русский", "Português", "हिन्दी", "Tiếng Việt", "ภาษาไทย", "Bahasa Indonesia", "Italiano", "Türkçe", "Nederlands", "Polski", "Bahasa Melayu", "Svenska"];
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
  const [dailyLikesUsed, setDailyLikesUsed] = useState(0); // 오늘 보낸 라이크 수 (free: max 10)
  const FREE_DAILY_LIKE_LIMIT = 10;
  useEffect(() => {
    fetchActiveAdsForScreen("MatchPage").then(setAds);
    const fetchProfiles = async () => {
      if (!user) return;

      // meet_reviews fetch (avgRating 계산용)
      const {
        data: reviewsData
      } = await supabase.from('meet_reviews').select('*');
      const ratingsMap: Record<string, {
        sum: number;
        count: number;
      }> = {};
      if (reviewsData) {
        for (const rv of reviewsData) {
          if (!ratingsMap[rv.to_user]) ratingsMap[rv.to_user] = {
            sum: 0,
            count: 0
          };
          ratingsMap[rv.to_user].sum += rv.rating || 0;
          ratingsMap[rv.to_user].count += 1;
        }
      }

      // 내 프로필 정보 (matchScore 계산 기준)
      const {
        data: me
      } = await supabase.from('profiles').select('id,name,photo_url,photo_urls,age,bio,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,is_plus,travel_dates').eq('id', user.id).single();

      // 이미 스와이프한 상대 ID 수집
      const {
        data: swipedData
      } = await supabase.from('likes').select('to_user').eq('from_user', user.id);
      const swipedIds = new Set((swipedData || []).map((r: any) => r.to_user));

      // 자신을 DB 레벨에서 확실히 제외
      const {
        data,
        error
      } = await supabase.from('profiles').select('id,name,photo_url,photo_urls,age,bio,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,is_plus,travel_dates,boost_expires_at,travel_mission,visited_countries,user_type').neq('id', user.id).limit(50); // ← egress 절감: 최대 50명만

      if (!error && data) {
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
            name: p.name || i18n.t("auto.z_autoz\uC54C\uC218\uC5C6\uC74C9_168"),
            age: p.age || 25,
            nationality: p.nationality || '',
            gender: p.gender || '',
            location: p.location || t("match.noLocation"),
            distanceKm: distKm ?? 999,
            distance: distKm !== null ? `${distKm.toFixed(1)}km` : t("map.distanceUnknown"),
            bio: p.bio || i18n.t("auto.z_autoz\uC548\uB155\uD558\uC138\uC694_169"),
            photo: p.photo_url || "",
            photoUrls: p.photo_urls && p.photo_urls.length > 0 ? p.photo_urls : p.photo_url ? [p.photo_url] : [],
            destination: p.location || i18n.t("auto.z_autoz\uC5B4\uB518\uAC0010_170"),
            dates: p.travel_dates || i18n.t("auto.z_autoz\uBBF8\uC815101_171"),
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
        // DB가 비어있으면 (로컬 환경 필드 테스트용) 목업 사용
        if (mapped.length === 0) {
          const fallback = [{
            id: 'mock-elena',
            name: 'Elena',
            photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1',
            photoUrls: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'],
            age: 24,
            bio: t("auto.x4030"),
            gender: 'female',
            distanceKm: 8,
            nationality: 'KR',
            mbti: 'ENFP',
            isPlus: true,
            isPremium: true,
            isAd: false,
            travelMission: t("auto.x4031"),
            visitedCountries: ['🇯🇵', '🇹🇼', '🇺🇸', '🇻🇳'],
            budgetRange: 'mid',
            avgRating: 4.8,
            reviewCount: 12,
            tags: [t("auto.x4032"), t("auto.x4033"), t("auto.x4034")],
            matchScore: 88,
            verified: true,
            verifyLevel: 'gold' as const,
            travelStyle: [t("auto.x4035"), t("auto.x4036"), t("auto.x4037")],
            languages: [t("auto.x4038"), 'English']
          }];
          setProfiles(fallback);
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
          const mappedLikers = likerProfiles.map(p => ({
            id: p.id,
            name: p.name || i18n.t("auto.z_autoz\uC54C\uC218\uC5C6\uC74C1_172"),
            age: p.age || 25,
            nationality: p.nationality || '',
            gender: p.gender || '',
            location: p.location || t("match.noLocation"),
            distanceKm: 999,
            distance: t("map.distanceUnknown"),
            bio: p.bio || i18n.t("auto.z_autoz\uC548\uB155\uD558\uC138\uC694_173"),
            photo: p.photo_url || '',
            photoUrls: p.photo_urls && p.photo_urls.length > 0 ? p.photo_urls : p.photo_url ? [p.photo_url] : [],
            destination: p.location || i18n.t("auto.z_autoz\uC5B4\uB518\uAC0010_174"),
            dates: p.travel_dates || i18n.t("auto.z_autoz\uBBF8\uC815105_175"),
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
      }).limit(1);
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
  const [showFilter, setShowFilter] = useState(false);
  const [superLikedId, setSuperLikedId] = useState<string | null>(null);
  const [showSuperLikeModal, setShowSuperLikeModal] = useState(false);
  const [pendingSuperProfile, setPendingSuperProfile] = useState<any | null>(null);
  const [superMsg, setSuperMsg] = useState("");

  // Like popup
  const [showLikePopup, setShowLikePopup] = useState(false);
  const [likePopupProfile, setLikePopupProfile] = useState<any | null>(null);

  // Filter states
  const [maxDistance, setMaxDistance] = useState(10); // 기본: 10km
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [genderFilter, setGenderFilter] = useState(t('filter.genderAll'));
  const tagOptions = [t("auto.z_autoz\uCE74\uD398106_176"), t("auto.z_autoz\uD2B8\uB808\uD0B910_177"), t("auto.z_autoz\uC11C\uD551108_178"), t("auto.z_autoz\uC57C\uC2DC\uC7A510_179"), t("auto.z_autoz\uC0AC\uC9C4110_180"), t("auto.z_autoz\uC74C\uC2DD111_181"), t("auto.z_autoz\uAC74\uCD95112_182"), t("auto.z_autoz\uC790\uC5F0113_183"), t("auto.z_autoz\uB7ED\uC154\uB9AC11_184"), t("auto.z_autoz\uBC30\uB0AD115_185")];

  // Filter + keep sorted by matchScore (showFilter 모달 + showFilterModal 모달 통합 적용)
  const filteredTravelers = profiles.filter(p => {
    // 거리: 좌표 없는 유저(distanceKm=999)는 거리 제한 설정 시 엄격하게 제외됨
    const distLimit = filterDistance < 9999 ? filterDistance : maxDistance < 9999 ? maxDistance : 9999;
    const distOk = distLimit >= 9999 ? true : p.distanceKm !== null && p.distanceKm <= distLimit;

    // 태그 필터
    const tagOk = selectedTags.length === 0 || selectedTags.some(t => p.travelStyle.includes(t));

    // 성별 필터 (두 모달 통합: genderFilter={t("auto.p523")}이면 filterGender 사용)
    const gStr = genderFilter !== i18n.t("auto.z_autoz\uC804\uCCB4116_186") ? genderFilter : filterGender === 'male' ? i18n.t("auto.z_autoz\uB0A8\uC131117_187") : filterGender === 'female' ? i18n.t("auto.z_autoz\uC5EC\uC131118_188") : i18n.t("auto.z_autoz\uC804\uCCB4119_189");
    const genderOk = gStr === i18n.t("auto.z_autoz\uC804\uCCB4120_190") || p.gender === gStr;

    // 나이 필터 (Migo Plus 전용)
    const ageOk = !isPlus || !p.age || p.age >= filterAge[0] && p.age <= filterAge[1];

    // 언어 필터 (Migo Plus 전용)
    const langOk = !isPlus || filterLanguages.length === 0 || filterLanguages.some(l => p.languages.includes(l));

    // MBTI 필터
    const mbtiOk = filterMbti.length === 0 || p.mbti && filterMbti.includes(p.mbti);

    // 여행 스타일 필터 연동
    const styleOk = filterTravelStyle.length === 0 || filterTravelStyle.some(t => p.travelStyle.includes(t));
    return distOk && tagOk && genderOk && ageOk && langOk && mbtiOk && styleOk;
  });
  const withAds: any[] = [];
  let adIdx = 0;
  let likerIdx = 0;
  for (let i = 0; i < filteredTravelers.length; i++) {
    withAds.push(filteredTravelers[i]);
    if ((i + 1) % 3 === 0) {
      // 3개마다: 라이커가 있으면 라이커 우선 삽입
      if (likerIdx < pendingLikers.length) {
        withAds.push(pendingLikers[likerIdx]);
        likerIdx++;
      } else if (!isPlus && ads.length > 0) {
        // 라이커 소진 후 광고 삽입
        const ad = ads[adIdx % ads.length];
        withAds.push({
          id: `ad-${ad.id}-${i}`,
          name: ad.advertiser || t("auto.z_autoz\uC2A4\uD3F0\uC11C12_191"),
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
  // 남은 라이커 맨 뒤에 추가
  while (likerIdx < pendingLikers.length) {
    withAds.push(pendingLikers[likerIdx++]);
  }
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
          content: i18n.t("auto.z_tmpl_122", {
            defaultValue: t("auto.t5025", {
              v0: user.name
            })
          })
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
      title: kind === 'superlike' ? i18n.t("auto.z_autoz\uC0C8\uB85C\uC6B4\uC288\uD37C_192") : i18n.t("auto.z_autoz\uC0C8\uB85C\uC6B4\uBC18\uAC00_193"),
      content: kind === 'superlike' ? i18n.t("auto.z_tmpl_125", {
        defaultValue: t("auto.t5026", {
          v0: user.name
        })
      }) : i18n.t("auto.z_tmpl_126", {
        defaultValue: t("auto.t5027")
      })
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

    // Free 유저 일일 라이크 제한 체크 (라이커 카드는 제외)
    if (!isPlus && !profile.isLiker && dailyLikesUsed >= FREE_DAILY_LIKE_LIMIT) {
      toast({
        title: t("auto.p525"),
        description: i18n.t("auto.z_tmpl_127", {
          defaultValue: t("auto.t5028", {
            v0: FREE_DAILY_LIKE_LIMIT
          })
        }),
        variant: "destructive"
      });
      setShowPlusModal(true);
      return;
    }

    // Show Like popup
    setLikePopupProfile(profile);
    setShowLikePopup(true);
    setTimeout(() => setShowLikePopup(false), 2200);
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
        setTimeout(() => {
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
    useSuperLike();

    // DB 저장
    saveLikeAndCheckMatch(profile.id, 'superlike', superMsg || undefined).then(isMatch => {
      setTimeout(() => {
        setSuperLikedId(null);
        setCurrentIndex(i => i + 1);
        setTimeout(() => {
          setMatchProfile(profile);
          setIsSuperLikeMatch(true);
          setShowMatch(!!isMatch);
          if (isMatch) {
            if (typeof isMatch === 'string') setMatchedThreadId(isMatch);
            addUnread(profile.id);
            setInAppNotif({
              type: "superlike",
              actorName: profile.name,
              actorPhoto: profile.photo,
              message: superMsg || undefined
            });
          }
        }, 300);
      }, 700);
    });
    toast({
      title: i18n.t("auto.z_tmpl_128", {
        defaultValue: t("auto.t5029", {
          v0: profile.name
        })
      }),
      description: superMsg ? `"${superMsg}"` : i18n.t("auto.z_autoz\uC0C1\uB300\uBC29\uC5D0\uAC8C_194")
    });
  }, [pendingSuperProfile, superMsg, addUnread, saveLikeAndCheckMatch]);
  const handleChatFromMatch = () => {
    setShowMatch(false);
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
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };
  const remaining = withAds.slice(currentIndex, currentIndex + 2).reverse();
  const topProfile = withAds[currentIndex];

  // Ad impression tracking
  useEffect(() => {
    if (topProfile?.isAd) {
      recordAdImpression(topProfile.originalAd.id, null);
    }
  }, [topProfile]);
  return <div className="flex flex-col h-screen bg-background safe-bottom">
      {/* ─── In-app notification banner (Like / SuperLike received) ─── */}
      <InAppNotifBanner notif={inAppNotif} onClose={() => setInAppNotif(null)} />

      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-3 pb-2">
        <div className="flex items-center">
          <img src={siteLogo} alt="Migo" className="h-12 object-contain" loading="lazy" />
        </div>
        <div className="flex items-center gap-2">
          {/* GPS 체크인 버튼 */}
          <button onClick={() => setShowCheckInModal(true)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform active:scale-90 relative border ${activeCheckIn ? 'bg-emerald-500/15 border-emerald-500/40' : 'bg-muted border-transparent'}`}>
            <MapPin size={16} className={activeCheckIn ? 'text-emerald-500' : 'text-muted-foreground'} />
            {activeCheckIn && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background" />}
          </button>
          <button onClick={() => navigate("/nearby")} className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center transition-transform active:scale-90">
            <Navigation size={16} className="text-emerald-500" />
          </button>
          <button onClick={() => navigate("/notifications")} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center relative transition-transform active:scale-90">
            <Bell size={18} className="text-muted-foreground" />
            {unreadCount > 0 && <motion.span key={unreadCount} initial={{
            scale: 0
          }} animate={{
            scale: 1
          }} className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 flex items-center justify-center text-[9px] font-extrabold text-white shadow-lg">
                {unreadCount > 99 ? "99+" : unreadCount}
              </motion.span>}
          </button>
          <button onClick={() => navigate("/shop")} className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center transition-transform active:scale-90">
            <ShoppingBag size={16} className="text-primary" />
          </button>
          <button onClick={() => setShowFilter(true)} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center relative transition-transform active:scale-90">
            <SlidersHorizontal size={18} className="text-muted-foreground" />
            {selectedTags.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full gradient-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground">
                {selectedTags.length}
              </span>}
          </button>
        </div>
      </header>

      {/* 체크인 활성 배너 */}
      {activeCheckIn && <motion.div initial={{
      opacity: 0,
      y: -10
    }} animate={{
      opacity: 1,
      y: 0
    }} className="mx-4 mb-1 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin size={13} className="text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              {activeCheckIn.city}{t("auto.z_\uC5EC\uD589\uC790\uC6B0\uC120\uB9E4\uCE6D\uC911_195")}</span>
          </div>
          <span className="text-emerald-500/70 text-[10px]">
            {checkInCityTravelers.length > 0 ? t("auto.z_tmpl_196", {
          defaultValue: `${checkInCityTravelers.length} online`
        }) : t("auto.z_\uD65C\uC131_197")}
          </span>
        </motion.div>}

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
            <span className="text-white text-xs font-bold">{t("auto.j500")}</span>
          </div>
          <span className="text-white/80 text-xs font-mono">
            {String(Math.floor(boostSecondsLeft / 60)).padStart(2, "0")}:{String(boostSecondsLeft % 60).padStart(2, "0")}
          </span>
        </motion.div>}

      {/* Match score + super like indicator */}
      {topProfile && <div className="flex items-center justify-center gap-2 pb-1 relative">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Zap size={12} className="text-primary" />
            <span className="text-xs font-bold text-primary">{t("auto.z_autoz\uB9E4\uCE6D\uC810\uC2181_198")}{topProfile.matchScore}{t("auto.z_autoz\uC810131_199")}</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-muted">
            {isPlus ? <Crown size={11} className="text-amber-500" /> : Array.from({
          length: 3
        }).map((_, i) => <Star key={i} size={10} className={i < superLikesLeft ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"} />)}
            <span className="text-[10px] font-semibold text-muted-foreground ml-0.5">
              {isPlus ? t("auto.z_autoz\uC288\uD37C\uB77C\uC774\uD06C_200") : t("auto.z_tmpl_133", {
            defaultValue: t("auto.t5030", {
              v0: superLikesLeft
            })
          })}
            </span>
          </div>
          {/* Report/Block menu button */}
          <button onClick={() => setActionSheetProfile(topProfile)} className="absolute right-5 w-7 h-7 flex items-center justify-center bg-card shadow-card rounded-full border border-border">
            <MoreHorizontal size={14} className="text-muted-foreground" />
          </button>
        </div>}

      {/* [Free] 남은 라이크 수 배지 */}
      {!isPlus && <div className="flex justify-center mb-1 px-4">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm border transition-all
            ${dailyLikesUsed >= FREE_DAILY_LIKE_LIMIT ? 'bg-destructive/15 border-destructive/30 text-destructive' : dailyLikesUsed >= FREE_DAILY_LIKE_LIMIT - 3 ? 'bg-amber-500/15 border-amber-500/30 text-amber-500' : 'bg-muted border-border text-muted-foreground'}`}>
            {dailyLikesUsed >= FREE_DAILY_LIKE_LIMIT ? <><Lock size={11} /><span>{t("auto.j501")}</span></> : <><Heart size={11} fill="currentColor" /><span>{t("auto.z_autoz\uC624\uB298\uBC18\uAC00\uC6CC_201")}{FREE_DAILY_LIKE_LIMIT - dailyLikesUsed}{t("auto.z_autoz\uAC1C\uB0A8\uC74C13_202")}</span></>}
          </div>
        </div>}

      {/* Card Stack */}
      <div className="flex-1 relative w-[calc(100%-1.5rem)] max-w-[420px] mx-auto my-2" style={{
      minHeight: "65vh",
      maxHeight: "80vh"
    }}>
        {remaining.length > 0 ? <AnimatePresence>
            {remaining.map((profile, i) => <SwipeCard key={profile.id} profile={profile} onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight} isTop={i === remaining.length - 1} isSuperLiked={superLikedId === profile.id} onProfileView={sendProfileViewNotif} myProfile={user} />)}
          </AnimatePresence> : <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4 animate-float">
              <span className="text-3xl">🌏</span>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">{t("auto.j502")}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t("auto.j503")}</p>
            <button onClick={() => setShowFilterModal(true)} className="px-6 py-3 rounded-2xl gradient-primary text-primary-foreground text-sm font-semibold shadow-card transition-transform active:scale-95">
              {t("auto.j504")}
            </button>
          </div>}
      </div>

      {/* Action Buttons */}
      {remaining.length > 0 && <div className="space-y-2 pb-24 px-2">
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
              description: i18n.t("auto.z_tmpl_136", {
                defaultValue: i18n.t("auto.z_tmpl_203", {
                  defaultValue: `${String(Math.floor(boostSecondsLeft / 60)).padStart(2, "0")}:${String(boostSecondsLeft % 60).padStart(2, "0")} remaining`
                })
              })
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
                {boostActive ? t("auto.z_tmpl_137", {
            defaultValue: t("auto.z_tmpl_204", {
              defaultValue: `Boosting ${String(Math.floor(boostSecondsLeft / 60)).padStart(2, "0")}:${String(boostSecondsLeft % 60).padStart(2, "0")}`
            })
          }) : isPlus ? t("auto.z_autoz\uBD80\uC2A4\uD2B8\uC0AC\uC6A9_205") : t("auto.z_autoz\uBD80\uC2A4\uD2B8Pl_206")}
             </motion.button>
          </div>

          {/* Core swipe buttons */}
          <div className="flex items-center justify-center gap-6 px-4 pt-2">
            {/* Dislike (X) */}
            <motion.button whileTap={{
          scale: 0.9,
          rotate: -5
        }} onClick={handleSwipeLeft} className="w-16 h-16 rounded-full bg-card shadow-float border border-border flex items-center justify-center text-rose-500">
              <X size={32} strokeWidth={3} />
            </motion.button>

            {/* Super like */}
            <motion.button whileTap={{
          scale: 0.9
        }} onClick={openSuperLikeModal} className={`w-12 h-12 rounded-full shadow-float border flex items-center justify-center transition-all ${superLikesLeft > 0 ? "bg-card border-blue-400 text-blue-500" : "bg-muted border-border opacity-50 text-muted-foreground"}`}>
              <Star size={24} className={superLikesLeft > 0 ? "fill-blue-500" : ""} />
            </motion.button>

            {/* Like (Heart) */}
            <motion.button whileTap={{
          scale: 0.9,
          rotate: 5
        }} onClick={handleSwipeRight} className="w-16 h-16 rounded-full bg-card shadow-float border border-border flex items-center justify-center text-emerald-500">
              <Heart size={32} strokeWidth={2.5} className="fill-emerald-500" />
            </motion.button>
          </div>
      </div>}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* ❤️  LIKE POPUP — warm pink heart burst, auto-dismiss        */}
      {/* ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showLikePopup && likePopupProfile && <motion.div className="fixed inset-0 z-[65] flex items-center justify-center pointer-events-none" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} transition={{
        duration: 0.3
      }}>
            {/* Soft vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-rose-500/20 via-transparent to-rose-500/10" />

            {/* Floating hearts — scattered */}
            {[{
          x: -80,
          y: -120,
          size: 28,
          delay: 0,
          rotate: -15
        }, {
          x: 90,
          y: -150,
          size: 20,
          delay: 0.1,
          rotate: 20
        }, {
          x: -50,
          y: -60,
          size: 14,
          delay: 0.15,
          rotate: -30
        }, {
          x: 120,
          y: -80,
          size: 24,
          delay: 0.05,
          rotate: 10
        }, {
          x: -120,
          y: 30,
          size: 16,
          delay: 0.2,
          rotate: -20
        }, {
          x: 100,
          y: 40,
          size: 18,
          delay: 0.25,
          rotate: 25
        }, {
          x: 30,
          y: -180,
          size: 12,
          delay: 0.3,
          rotate: -5
        }, {
          x: -30,
          y: 100,
          size: 22,
          delay: 0.12,
          rotate: 15
        }].map((h, i) => <motion.div key={i} className="absolute" initial={{
          x: 0,
          y: 0,
          scale: 0,
          opacity: 0,
          rotate: 0
        }} animate={{
          x: h.x,
          y: h.y,
          scale: 1.2,
          opacity: [0, 1, 1, 0],
          rotate: h.rotate
        }} transition={{
          duration: 1.6,
          delay: h.delay,
          ease: "easeOut"
        }}>
                <Heart size={h.size} className="text-rose-400" fill="currentColor" />
              </motion.div>)}

            {/* Main card */}
            <motion.div className="relative bg-card/95 backdrop-blur-xl rounded-3xl px-8 py-6 shadow-float border border-rose-500/20 text-center max-w-xs w-full mx-6" initial={{
          scale: 0.5,
          y: 60,
          opacity: 0
        }} animate={{
          scale: 1,
          y: 0,
          opacity: 1
        }} exit={{
          scale: 0.9,
          y: -20,
          opacity: 0
        }} transition={{
          type: "spring",
          damping: 18,
          stiffness: 300,
          delay: 0.05
        }}>
              {/* Big animated heart */}
              <motion.div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center mx-auto mb-3 shadow-lg" initial={{
            scale: 0,
            rotate: -30
          }} animate={{
            scale: [0, 1.25, 1],
            rotate: [-30, 10, 0]
          }} transition={{
            duration: 0.5,
            delay: 0.1,
            type: "spring"
          }}>
                <Heart size={36} className="text-white" fill="currentColor" />
              </motion.div>

              {/* Profile snapshot */}
              <div className="flex items-center justify-center gap-2 mb-3">
                {likePopupProfile.photo ? <img src={likePopupProfile.photo} alt="" className="w-8 h-8 rounded-xl object-cover border-2 border-rose-400" loading="lazy" onError={e => {
              {
                (e.target as HTMLImageElement).style.display = 'none';
              }
            }} /> : <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                    {likePopupProfile.name?.[0] ?? "?"}
                  </div>}
                <p className="text-base font-extrabold text-foreground">{likePopupProfile.name}{t("auto.z_autoz\uB2D8\uAED8\uC88B\uC544\uC694_207")}</p>
              </div>

              <p className="text-sm text-muted-foreground mb-3">{t("auto.j505")}</p>

              {/* Match probability pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30">
                <Zap size={11} className="text-rose-400" />
                <span className="text-xs font-bold text-rose-400">{t("auto.z_autoz\uB9E4\uCE6D\uD655\uB9601_208")}{Math.round(Math.max(0.3, (likePopupProfile.matchScore ?? 50) / 100) * 100)}%
                </span>
              </div>

              {/* Auto-close progress bar */}
              <motion.div className="absolute bottom-0 left-0 h-1 rounded-b-3xl bg-gradient-to-r from-rose-400 to-pink-600" initial={{
            width: "100%"
          }} animate={{
            width: "0%"
          }} transition={{
            duration: 2.0,
            ease: "linear"
          }} />
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* ⭐  SUPER LIKE MODAL — deep blue star energy, bottom sheet  */}
      {/* ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSuperLikeModal && pendingSuperProfile && <motion.div className="fixed inset-0 z-[60] flex items-end" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }}>
            {/* Deep cosmic backdrop */}
            <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 50% 80%, rgba(99,102,241,0.25) 0%, rgba(0,0,0,0.7) 100%)"
        }} onClick={() => setShowSuperLikeModal(false)} />

            {/* Floating star particles in backdrop */}
            {[...Array(12)].map((_, i) => <motion.div key={i} className="absolute" style={{
          left: `${10 + i * 7.5 % 85}%`,
          top: `${5 + i * 11 % 55}%`
        }} animate={{
          y: [-5, 5, -5],
          opacity: [0.3, 1, 0.3],
          scale: [0.8, 1.3, 0.8]
        }} transition={{
          duration: 2 + i % 3,
          repeat: Infinity,
          delay: i * 0.18,
          ease: "easeInOut"
        }}>
                <Star size={i % 3 === 0 ? 10 : 6} className="text-blue-300" fill="currentColor" />
              </motion.div>)}

            <motion.div className="relative z-10 w-full max-w-lg mx-auto rounded-t-[32px] overflow-hidden pb-12 shadow-float" style={{
          background: "linear-gradient(180deg, #0f1729 0%, #111827 100%)",
          border: "1px solid rgba(99,102,241,0.3)",
          borderBottom: "none"
        }} initial={{
          y: "100%"
        }} animate={{
          y: 0
        }} exit={{
          y: "100%"
        }} transition={{
          type: "spring",
          damping: 28,
          stiffness: 300
        }}>
              {/* Top glow stripe */}
              <div className="h-1 w-full" style={{
            background: "linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6, #6366f1, #3b82f6)"
          }} />

              <div className="px-6 pt-5 pb-4">
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

                {/* SUPER LIKE header */}
                <div className="text-center mb-5">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    {[0, 1, 2].map(i => <motion.div key={i} animate={{
                  scale: [1, 1.4, 1],
                  rotate: [0, 15, 0]
                }} transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2
                }}>
                        <Star size={i === 1 ? 22 : 14} className="text-blue-400" fill="currentColor" />
                      </motion.div>)}
                  </div>
                  <p className="text-xs font-extrabold tracking-[0.2em] text-blue-400 uppercase">Super Like</p>
                </div>

                {/* Profile with energy ring */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="relative shrink-0">
                    {/* Pulsing energy rings */}
                    {[1, 2].map(ring => <motion.div key={ring} className="absolute inset-0 rounded-2xl border border-blue-500/50" animate={{
                  scale: [1, 1 + ring * 0.12],
                  opacity: [0.8, 0]
                }} transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: ring * 0.4
                }} />)}
                    <img src={pendingSuperProfile.photo} alt="" className="w-16 h-16 rounded-2xl object-cover" style={{
                  boxShadow: "0 0 20px rgba(99,102,241,0.5)"
                }} loading="lazy" />
                    <motion.div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg" style={{
                  background: "linear-gradient(135deg, #3b82f6, #6366f1)"
                }} animate={{
                  rotate: [0, 10, -10, 0]
                }} transition={{
                  duration: 2,
                  repeat: Infinity
                }}>
                      <Star size={14} className="text-white" fill="white" />
                    </motion.div>
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-white">{pendingSuperProfile.name}{t("auto.z_autoz\uB2D8\uAED8142_209")}</h3>
                    <p className="text-sm font-bold" style={{
                  background: "linear-gradient(90deg, #60a5fa, #a78bfa)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent"
                }}>{t("auto.j506")}</p>
                    <p className="text-xs text-white/40 mt-0.5">{pendingSuperProfile.destination} · {pendingSuperProfile.dates}</p>
                  </div>
                </div>

                {/* Remaining count visual */}
                <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-2xl" style={{
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.25)"
            }}>
                  <div className="flex gap-1">
                    {isPlus ? <Crown size={14} className="text-blue-400" /> : Array.from({
                  length: 3
                }).map((_, i) => <Star key={i} size={13} className={i < superLikesLeft ? "text-blue-400 fill-blue-400" : "text-white/20 fill-white/10"} />)}
                  </div>
                  <span className="text-xs font-bold text-blue-300">
                    {isPlus ? t("auto.z_autoz\uC288\uD37C\uB77C\uC774\uD06C_210") : t("auto.z_tmpl_144", {
                  defaultValue: t("auto.t5031", {
                    v0: superLikesLeft
                  })
                })}
                  </span>
                </div>

                {/* Message input */}
                <div className="mb-3">
                  <label className="text-xs font-bold text-white/60 mb-2 block">{t("auto.j507")}<span className="text-white/30 font-normal">{t("auto.j508")}</span></label>
                  <div className="relative">
                    <textarea value={superMsg} onChange={e => setSuperMsg(e.target.value)} maxLength={80} rows={2} placeholder={t("auto.z_tmpl_145", {
                  defaultValue: `t("auto.x4039")`
                })} className="w-full px-4 py-3 pr-12 rounded-2xl text-white text-sm placeholder:text-white/30 outline-none resize-none transition-all" style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1.5px solid rgba(99,102,241,0.3)",
                  caretColor: "#60a5fa"
                }} onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.8)"} onBlur={e => e.target.style.borderColor = "rgba(99,102,241,0.3)"} />
                    <span className="absolute bottom-2.5 right-3 text-[10px] text-white/30">{superMsg.length}/80</span>
                  </div>
                </div>

                {/* Quick message chips */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {[t("auto.z_tmpl_146", {
                defaultValue: t("auto.t5032", {
                  v0: pendingSuperProfile.destination
                })
              }), t("auto.z_autoz\uAC19\uC774\uC5EC\uD589\uD574_211"), t("auto.z_autoz\uAD00\uC2EC\uC0AC\uAC00\uBE44_212"), t("auto.z_autoz\uB9DB\uC9D1\uAC19\uC774\uD0D0_213")].map(q => <button key={q} onClick={() => setSuperMsg(q)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${superMsg === q ? "text-white" : "text-white/50"}`} style={{
                background: superMsg === q ? "linear-gradient(135deg,#3b82f6,#6366f1)" : "rgba(255,255,255,0.06)",
                border: "1px solid rgba(99,102,241,0.25)"
              }}>{q}</button>)}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button onClick={() => setShowSuperLikeModal(false)} className="flex-1 py-3.5 rounded-2xl text-white/60 font-semibold text-sm" style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)"
              }}>
                    {t("auto.j509")}
                  </button>
                  <motion.button whileTap={{
                scale: 0.96
              }} onClick={confirmSuperLike} className="flex-1 py-3.5 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2" style={{
                background: "linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6)",
                boxShadow: "0 8px 24px rgba(99,102,241,0.5)"
              }}>
                    <Star size={16} fill="white" className="text-white" />
                    {t("auto.j510")}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      <MatchModal isOpen={showMatch} profile={matchProfile} onClose={() => setShowMatch(false)} onChat={handleChatFromMatch} isSuperLike={isSuperLikeMatch} superLikeMessage={isSuperLikeMatch ? superLikeMessage : ""} />

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
              <h3 className="text-lg font-extrabold text-foreground mb-5">{t("auto.j511")}</h3>

              {/* Distance */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-bold text-foreground">{t("auto.j512")}</label>
                  <span className="text-sm font-bold text-primary">{maxDistance}km</span>
                </div>
                <input type="range" min={1} max={50} value={maxDistance} onChange={e => setMaxDistance(Number(e.target.value))} className="w-full accent-primary" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>1km</span><span>50km</span>
                </div>
              </div>

              {/* Gender */}
              <div className="mb-6">
                <label className="text-sm font-bold text-foreground mb-3 block">{t("match.filterGender")}</label>
                <div className="flex gap-2">
                  {[t('filter.genderAll'), t('filter.genderF'), t('filter.genderM')].map(g => <button key={g} onClick={() => setGenderFilter(g)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${genderFilter === g ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {g}
                    </button>)}
                </div>
              </div>

              <div className="mb-6">
                <label className="text-sm font-bold text-foreground mb-3 block">{t("auto.j513")}</label>
                <div className="flex flex-wrap gap-2">
                  {travelStyleOptions.map(tag => <button key={tag} onClick={() => setFilterTravelStyle(prev => prev.includes(tag) ? prev.filter(x => x !== tag) : [...prev, tag])} className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${filterTravelStyle.includes(tag) ? "gradient-primary text-primary-foreground shadow-card" : "bg-muted text-muted-foreground"}`}>
                      {tag}
                    </button>)}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => {
              setSelectedTags([]);
              setMaxDistance(10);
              setGenderFilter(t('filter.genderAll'));
              setFilterAge([18, 60]);
              setFilterDistance(10);
              setFilterGender('all');
              setFilterMbti([]);
            }} className="flex-1 py-3 rounded-2xl border border-border text-foreground font-semibold text-sm transition-colors hover:bg-muted">
                  {t("auto.j514")}
                </button>
                <button onClick={() => {
              setShowFilter(false);
              toast({
                title: t("auto.p527"),
                description: i18n.t("auto.z_tmpl_150", {
                  defaultValue: i18n.t("auto.z_tmpl_214", {
                    defaultValue: `Within ${maxDistance}km${selectedTags.length > 0 ? ` · ${selectedTags.join(", ")}` : ""}`
                  })
                })
              });
            }} className="flex-1 py-3 rounded-2xl gradient-primary text-primary-foreground font-semibold text-sm shadow-card flex items-center justify-center gap-2">
                  <Check size={16} /> {t("auto.j515")}
                </button>
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      {/* Migo Plus Modal */}
      <MigoPlusModal isOpen={showPlusModal} onClose={() => setShowPlusModal(false)} />

      {/* ─── Login Gate Modal ─── */}
      <AnimatePresence>
        {showLoginGate && <motion.div className="fixed inset-0 z-[80] flex items-end" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }}>
            <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={() => setShowLoginGate(false)} />
            <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-t-3xl p-6 pb-10 shadow-float" initial={{
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
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />
              {/* Icon */}
              <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Heart size={28} className="text-primary" fill="currentColor" />
              </div>
              <h2 className="text-xl font-extrabold text-foreground text-center mb-2">
                {t("auto.j516")}
              </h2>
              <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
                {t("auto.j517")}<br />{t("auto.j518")}
              </p>
              <div className="space-y-3">
                <motion.button whileTap={{
              scale: 0.97
            }} onClick={() => {
              setShowLoginGate(false);
              navigate("/login");
            }} className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-sm shadow-card">
                  {t("auto.j519")}
                </motion.button>
                <motion.button whileTap={{
              scale: 0.97
            }} onClick={() => {
              setShowLoginGate(false);
              navigate("/onboarding");
            }} className="w-full py-4 rounded-2xl border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors">
                  {t("auto.j520")}
                </motion.button>
                <button onClick={() => setShowLoginGate(false)} className="w-full py-2 text-xs text-muted-foreground">
                  {t("auto.j521")}
                </button>
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      {/* ⋯ Report / Block action sheet */}
      <ReportBlockActionSheet isOpen={!!actionSheetProfile} onClose={() => setActionSheetProfile(null)} targetType="user" targetId={actionSheetProfile?.id ?? ""} targetName={actionSheetProfile?.name ?? ""} authorId={actionSheetProfile?.id} />

      {/* ─── 필터 모달 ─── */}
      <AnimatePresence>
        {showFilterModal && <motion.div className="fixed inset-0 z-[80] flex items-end" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }}>
            <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={() => setShowFilterModal(false)} />
            <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-t-3xl shadow-float max-h-[85vh] overflow-y-auto" initial={{
          y: "100%"
        }} animate={{
          y: 0
        }} exit={{
          y: "100%"
        }} transition={{
          type: "spring",
          damping: 28,
          stiffness: 300
        }}>
              <div className="px-5 pt-4 pb-8 space-y-5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="w-10 h-1 bg-border rounded-full mx-auto mb-3" />
                    <h3 className="text-lg font-extrabold text-foreground">{t("match.filterTitle")}</h3>
                    <p className="text-xs text-muted-foreground">{t("match.filterDesc")}</p>
                  </div>
                  <button onClick={() => {
                setFilterAge([18, 45]);
                setFilterDistance(10);
                setFilterGender('all');
                setFilterMbti([]);
              }} className="text-xs text-primary font-bold">{t("match.filterReset")}</button>
                </div>

                {/* 성별 */}
                <div>
                  <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide mb-2">{t("match.filterGender")}</p>
                  <div className="flex gap-2">
                    {(['all', 'male', 'female'] as const).map(g => <button key={g} onClick={() => setFilterGender(g)} className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all ${filterGender === g ? 'gradient-primary text-primary-foreground shadow-card' : 'bg-muted text-muted-foreground'}`}>
                        {g === 'all' ? t('general.all') : g === 'male' ? t('general.male') : t('general.female')}
                      </button>)}
                  </div>
                </div>

                {/* 연령대 (Migo Plus) */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide">
                      {t("match.filterAge")} <span className="text-primary font-bold">{filterAge[0]}~{filterAge[1]}{t("auto.z_autoz\uC138151_215")}</span>
                    </p>
                    {!isPlus && <Crown size={14} className="text-amber-500 fill-amber-500" />}
                  </div>
                  <div className={`flex gap-2 flex-wrap ${!isPlus ? "opacity-30 blur-[1px] pointer-events-none" : ""}`}>
                    {[[18, 25], [20, 30], [25, 35], [30, 40], [35, 50], [18, 60]].map(([s, e]) => <button key={`${s}-${e}`} onClick={() => setFilterAge([s, e])} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${filterAge[0] === s && filterAge[1] === e ? 'gradient-primary text-primary-foreground shadow-card' : 'bg-muted text-muted-foreground'}`}>
                        {s}~{e}{i18n.t("auto.z_autoz\uC138152_216")}</button>)}
                  </div>
                  {!isPlus && <div className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer" onClick={() => setShowPlusModal(true)}>
                      <div className="bg-background/90 px-4 py-2 rounded-full shadow-md flex items-center gap-2 border border-border">
                        <Lock size={14} className="text-foreground" />
                        <span className="text-xs font-bold text-foreground">{t("match.filterAgePlus")}</span>
                      </div>
                    </div>}
                </div>

                {/* 사용 언어 (Migo Plus) */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide">
                      {t("match.filterLang")} <span className="text-muted-foreground font-normal">({t("general.multiSelect")})</span>
                    </p>
                    {!isPlus && <Crown size={14} className="text-amber-500 fill-amber-500" />}
                  </div>
                  <div className={`flex gap-2 flex-wrap ${!isPlus ? "opacity-30 blur-[1px] pointer-events-none" : ""}`}>
                    {languageOptions.map(l => <button key={l} onClick={() => setFilterLanguages(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])} className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${filterLanguages.includes(l) ? 'gradient-primary text-primary-foreground shadow-card' : 'bg-muted text-muted-foreground'}`}>
                        {l}
                      </button>)}
                  </div>
                  {!isPlus && <div className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer" onClick={() => setShowPlusModal(true)}>
                      <div className="bg-background/90 px-4 py-2 rounded-full shadow-md flex items-center gap-2 border border-border">
                        <Lock size={14} className="text-foreground" />
                        <span className="text-xs font-bold text-foreground">{t("match.filterLangPlus")}</span>
                      </div>
                    </div>}
                </div>

                {/* 거리 */}
                <div className="relative">
                  <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide mb-2 flex justify-between items-center">
                    <span>{t("match.filterDist")} <span className="text-primary font-bold">{filterDistance === 9999 ? t('general.unlimited') : `${filterDistance}km`}</span></span>
                    {!canGlobalMatch && <Crown size={14} className="text-amber-500 fill-amber-500" />}
                  </p>
                  <div className="flex gap-2">
                    {[10, 30, 50, 100, 9999].map(d => <button key={d} onClick={() => {
                  if (d === 9999 && !canGlobalMatch) {
                    setShowPlusModal(true);
                  } else {
                    setFilterDistance(d);
                  }
                }} className={`relative flex-1 py-2.5 rounded-2xl text-[11px] font-bold transition-all ${filterDistance === d ? 'gradient-primary text-primary-foreground shadow-card' : 'bg-muted text-muted-foreground'} ${d === 9999 && !canGlobalMatch ? 'opacity-50' : ''}`}>
                        {d === 9999 ? t('general.unlimited') : `${d}km`}
                        {d === 9999 && !canGlobalMatch && <Lock size={10} className="absolute top-1 right-1 opacity-50" />}
                      </button>)}
                  </div>
                </div>

                {/* MBTI */}
                <div>
                  <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide mb-2">
                    {t("match.filterMBTI")} <span className="text-muted-foreground font-normal">({t("general.multiSelect")})</span>
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {['ENFP', 'ENFJ', 'ENTP', 'ENTJ', 'ESFP', 'ESFJ', 'ESTP', 'ESTJ', 'INFP', 'INFJ', 'INTP', 'INTJ', 'ISFP', 'ISFJ', 'ISTP', 'ISTJ'].map(m => <button key={m} onClick={() => setFilterMbti(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])} className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${filterMbti.includes(m) ? 'gradient-primary text-primary-foreground shadow-card' : 'bg-muted text-muted-foreground'}`}>
                        {m}
                      </button>)}
                  </div>
                </div>

                {/* 확인 버튼 */}
                <motion.button whileTap={{
              scale: 0.97
            }} onClick={() => {
              setShowFilterModal(false);
              setCurrentIndex(0);
            }} className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-sm shadow-float">
                  {t("auto.j522")}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      {/* GPS 체크인 모달 */}
      <CheckInModal open={showCheckInModal} onClose={() => setShowCheckInModal(false)} onCheckInSuccess={(ci, travelers) => {
      setActiveCheckIn(ci);
      setCheckInCityTravelers(travelers);
      setShowCheckInModal(false);
    }} />
    </div>;
};
export default MatchPage;