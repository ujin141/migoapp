import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, MapPin, Calendar, Users, Plus, ChevronRight, X, Check, ArrowLeft, Share2, Heart, MessageCircle, Clock, Star, Compass, Pencil, ThumbsUp, Bell, Image as ImageIcon, Send, Trash2, Crown, Ticket, Megaphone, ExternalLink, Languages, ChevronDown, Zap, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/context/SubscriptionContext";
import { useChatContext } from "@/context/ChatContext";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { translateText } from "@/lib/translateService";
import ProfileDetailSheet from "@/components/ProfileDetailSheet";
import useGeoDistance, { distanceLabel, travelTimeLabel, distanceColor } from "@/hooks/useGeoDistance";
import { useLoadScript } from "@react-google-maps/api";
import { getCurrentLocation } from "@/lib/locationService";
import StoryViewer from "@/components/StoryViewer";
import ReportBlockActionSheet from "@/components/ReportBlockActionSheet";
import { useDiscoverData } from "@/hooks/useDiscoverData";
import { useGroupActions } from "@/hooks/useGroupActions";

import { Loader2, Beer } from "lucide-react";
const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];
import { getLocalizedPrice, inferGroupTier, getTierConfig } from "@/lib/pricing";
import GlobalFilter from "@/components/GlobalFilter";
import { useAdMob } from "@/hooks/useAdMob";
import { HOTPLACES } from "@/lib/placeRecommendations";
import { useGlobalFilter } from "@/context/GlobalFilterContext";
import { getChosung } from "@/lib/chosungUtils";
import GroupDetailFilter, { GroupDetailFilterState, DEFAULT_GROUP_DETAIL_FILTER, countGroupDetailFilters } from "@/components/GroupDetailFilter";
import GroupCreateModal from "@/components/GroupCreateModal";
import { getMyCheckIn } from "@/lib/checkInService";
import PaymentModal from "@/components/PaymentModal";
import CheckInModal from "@/components/CheckInModal";
import { LightningModals } from "./discover/LightningModals";
import { GroupDetailModal } from "./discover/GroupDetailModal";
import { PostDetailModal } from "./discover/PostDetailModal";
import { WritePostModal } from "./discover/WritePostModal";
import { DiscoverPosts } from "./discover/DiscoverPosts";
import { compressImage } from "@/lib/imageCompression";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
import { Post, TripGroup, PostComment } from "@/types";
import TodayContent from "@/components/TodayContent";
import DailyPicksCard from "@/components/DailyPicksCard";


interface JoinPopupState {
  group: TripGroup;
  newCount: number;
  genders: ('male' | 'female' | 'unknown')[];
  deadlineMs: number;
}
interface CountdownAlert {
  type: '1hour' | '30min' | 'expired';
  groupTitle: string;
}
const FILTER_LIST = ["all", "recruiting", "almostFull", "hot"] as const;

// ──────────────────────────────────────────────
// DiscoverPage Component
// ──────────────────────────────────────────────
const DiscoverPage = () => {
  const { i18n, t } = useTranslation();
  const { showInterstitial } = useAdMob();
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    isPlus,
    isPremium,
    canJoinPremiumGroups
  } = useSubscription();
  const {
    createGroupThread
  } = useChatContext();
  const {
    toast
  } = useToast();

  // Tab state
  const [activeTab, setActiveTab] = useState<"groups" | "community">("groups");
  const [activeFilter, setActiveFilter] = useState("all");
  const [distanceFilter, setDistanceFilter] = useState<number | null>(null); // null = 전체, 숫자 = 반경 km
  const [activeCommunityFilter, setActiveCommunityFilter] = useState<"latest" | "popular">("latest");
  const [searchQuery, setSearchQuery] = useState("");

  // Global filter
  const [showGlobalFilter, setShowGlobalFilter] = useState(false);
  const {
    filters: globalFilters,
    activeCount: globalFilterCount,
    setDestination: clearGlobalDest,
    setDateRange: clearGlobalDate,
    setGroupSize: clearGlobalGroup
  } = useGlobalFilter();

  // Group detail filter
  const [showGroupDetailFilter, setShowGroupDetailFilter] = useState(false);
  const [groupDetailFilter, setGroupDetailFilter] = useState<GroupDetailFilterState>(DEFAULT_GROUP_DETAIL_FILTER);
  const groupDetailFilterCount = countGroupDetailFilters(groupDetailFilter);

  // Check-in city for group filtering
  const [checkInCity, setCheckInCity] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    getMyCheckIn(user.id).then(ci => {
      if (ci) setCheckInCity(ci.city);
    });
  }, [user]);
  const {
    myPos,
    distanceTo
  } = useGeoDistance();

  // ── 팝업 타이머 방어는 useGroupActions 훅에서 관리 ──
  // (timersRef / clearAllTimers / closeJoinPopup → useGroupActions 반환값 사용)


  // (attachedImages blob URL revoke → WritePostModal 내부 처리)
  // (debounce cleanup → handleLocationInputChange 내부 처리)


  // ── 광고 유무에 따른 Toast 기본 여백 조정 ──
  useEffect(() => {
    if (!isPlus) {
      document.documentElement.style.setProperty('--toast-pb', '170px');
    } else {
      document.documentElement.style.removeProperty('--toast-pb');
    }
    return () => {
      document.documentElement.style.removeProperty('--toast-pb');
    };
  }, [isPlus]);

  // ── 데이터 fetch (QUAL-10: useDiscoverData 훅으로 분리) ──
  const [showPlusModal, setShowPlusModal] = useState(false);
  const {
    posts, setPosts, loadingPosts,
    tripGroups, setTripGroups, loadingGroups,
  } = useDiscoverData(user);

  // ── 그룹 액션 (QUAL-10: useGroupActions 훅으로 분리) ──
  const {
    handleJoin, joinPopup, setJoinPopup, closeJoinPopup,
    countdown, setCountdown, timersRef, clearAllTimers,
    confirmDialog, setConfirmDialog,
    applyGroup, setApplyGroup, applyMessage, setApplyMessage, applySubmitting, appliedGroups, handleApply,
    showApplicants, setShowApplicants, applicantsList,
    handleViewApplicants, handleApproveApplicant, handleRejectApplicant,
    deleteGroup: deleteGroupAction,
  } = useGroupActions(user, setTripGroups, setShowPlusModal);

  // Group data
  const [detailGroup, setDetailGroup] = useState<TripGroup | null>(null);
  const [countdownAlert, setCountdownAlert] = useState<CountdownAlert | null>(null);

  // Community data
  const [detailPost, setDetailPost] = useState<Post | null>(null);

  // Write post modal
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeContent, setWriteContent] = useState("");
  const [writeTitle, setWriteTitle] = useState("");
  const [writeLocationName, setWriteLocationName] = useState("");
  const [selectedLocationObj, setSelectedLocationObj] = useState<{lat: number, lng: number, name: string} | null>(null);
  const [locationFocus, setLocationFocus] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<{ description: string; placeId: string }[]>([]);
  
  const geocoder = useRef<google.maps.Geocoder | null>(null);
  // NOTE: AutocompleteService deprecated Mar 2025 → use AutocompleteSuggestion
  //       PlacesService deprecated Mar 2025 → use Place.fetchFields

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
    language: i18n.language?.split('-')[0] || 'en'
  });

  useEffect(() => {
    if (isLoaded && window.google) {
       geocoder.current = new window.google.maps.Geocoder();
    }
  }, [isLoaded]);
  const [attachedImages, setAttachedImages] = useState<Array<{
    file: File;
    url: string;
    id: string;
  }>>([]);
  const MAX_POST_PHOTOS = 4;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [readStories, setReadStories] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("migo_read_stories") || "[]"));
    } catch {
      return new Set();
    }
  });

  const handleStoryClick = (index: number, id: string) => {
    setActiveStoryIndex(index);
    setReadStories(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev).add(id);
      localStorage.setItem("migo_read_stories", JSON.stringify([...next]));
      return next;
    });
  };

  // Comment
  const [commentText, setCommentText] = useState("");
  const [commentPost, setCommentPost] = useState<Post | null>(null);

  // ── ⚡ Tonight Lightning Match ─────────────────────────────────
  const [showLightningLoading, setShowLightningLoading] = useState(false);
  const [lightningResult, setLightningResult] = useState<{ barName: string; members: { photo: string, name: string }[] } | null>(null);

  // 프리미엄 전용 V.I.P 상태
  const [showVipLightningFilter, setShowVipLightningFilter] = useState(false);
  const [vipFilter, setVipFilter] = useState({ age: "20s", language: "ko", vibe: "party" });
  // iOS에서 window.confirm/window.prompt 차단 → confirmDialog는 useGroupActions 훅에서 관리
  const [lightningMultiResult, setLightningMultiResult] = useState<Array<{
    id: string; title: string; barName: string; members: { photo: string, name: string }[]; vibeIcon: string;
  }> | null>(null);

  const startLightningMatch = () => {
    if (!user) return toast({ title: i18n.t("auto.p407") });
    if (!isPlus) {
      // 무료 유저는 번개매칭 사용 불가 → Plus 모달
      setShowPlusModal(true);
      return;
    }
    setShowVipLightningFilter(true);
  };

  const executeLightningMatch = (isVipMode: boolean) => {
    setShowVipLightningFilter(false);
    setShowLightningLoading(true);

    setTimeout(() => {
      setShowLightningLoading(false);
      const me = { name: user?.name || user?.email?.split('@')[0] || t("auto.ko_0018", "나"), photo: user?.photoUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150" };
      
      if (isVipMode) {
        setLightningMultiResult([
          { 
            id: "v1", title: i18n.t("auto.v2_bar1_title", "🔥 미친 텐션 파티룸"), barName: checkInCity ? t("auto.t_0022", `${checkInCity} ${i18n.t("auto.v2_bar1_1", "클럽 라운지")}`) : i18n.t("auto.v2_bar1_2", "프라이빗 라운지"), vibeIcon: "🎉",
            members: [me, { name: "Jimin", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150" }, { name: "Alex", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" }, { name: "Yuri", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" }]
          },
          { 
            id: "v2", title: i18n.t("auto.v2_bar2_title", "🍷 조용한 와인 딥톡"), barName: checkInCity ? t("auto.t_0023", `${checkInCity} ${i18n.t("auto.v2_bar2_1", "고급 와인바")}`) : i18n.t("auto.v2_bar2_2", "시크릿 와인바"), vibeIcon: "🥂",
            members: [me, { name: "Suji", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" }, { name: "Tom", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" }]
          },
          { 
            id: "v3", title: i18n.t("auto.v2_bar3_title", "🍜 감성 로컬 맛집"), barName: checkInCity ? t("auto.t_0024", `${checkInCity} ${i18n.t("auto.v2_bar3_1", "현지인 맛집")}`) : i18n.t("auto.v2_bar3_2", "숨겨진 이자카야"), vibeIcon: "🍣",
            members: [me, { name: "Leo", photo: "https://images.unsplash.com/photo-1552058544-e223a7261a3f?w=150" }, { name: "Mia", photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150" }, { name: "Ken", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150" }]
          }
        ]);
      } else {
        setLightningResult({
          barName: checkInCity ? t("auto.t_0025", `${checkInCity} ${i18n.t("auto.v2_vibe_food", "로컬 감성")}`) : i18n.t("auto.v2_bar1_2", '근처 핫플 펍'),
          members: [me, { name: "Jimin", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150" }, { name: "Alex", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" }, { name: "Yuki", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" }]
        });
      }
    }, 2800);
  };

  const confirmLightningMatch = async (vipSelection?: any) => {
    if (!user) return;
    
    let bName = "";
    let threadMembers = [];

    if (vipSelection && !vipSelection.nativeEvent) { // Ignore React Event Object
      bName = vipSelection.barName;
      threadMembers = vipSelection.members;
      setLightningMultiResult(null);
    } else if (lightningResult) {
      bName = lightningResult.barName;
      threadMembers = lightningResult.members;
      setLightningResult(null);
    } else {
      return;
    }

    try {
      const gName = (vipSelection && !vipSelection.nativeEvent) ? vipSelection.title : t("auto.t_0026", `🔥 ${i18n.t("auto.v2_tonight_vip", "오늘 저녁 벙개")} (${bName})`);

      // 1. 단일 그룹 생성 (DB 트리거가 알아서 채팅방 개설 + 호스트 멤버 추가 처리)
      const { data: grp } = await supabase.from('trip_groups').insert({
        title: gName,
        destination: bName,
        dates: i18n.t("auto.v2_tonight_vip", "오늘 저녁"),
        description: i18n.t("auto.v2_tonight_desc", "번개 자동 매칭으로 개설된 그룹입니다."),
        host_id: user.id,
        max_members: threadMembers.length,
        tags: [i18n.t("auto.v2_tonight_vip", "오늘 저녁")],
        status: 'recruiting',
        cover_image: threadMembers[1]?.photo
      }).select().single();

      if (grp?.thread_id) {
        toast({ title: i18n.t("auto.v2_created", "방이 개설되었습니다! 즐거운 모임 되세요 🍻") });
        navigate('/chat', { state: { threadId: grp.thread_id } });
      } else {
        throw new Error("Trigger failed to provision thread_id.");
      }
    } catch {
      toast({ title: i18n.t("auto.v2_error", "오류가 발생했습니다."), variant: "destructive" });
    }
  };

  // Group create
  const [showGroupCreate, setShowGroupCreate] = useState(false);

  // [Feature 2] 동행 크루 지원 시스템 (상태는 useGroupActions에서 관리)
  const [interestedGroups, setInterestedGroups] = useState<Set<string>>(new Set());
  const [interestedSnapshot, setInterestedSnapshot] = useState<Record<string, number>>({}); // groupId → memberCount at interest time
  const [myTravelDates, setMyTravelDates] = useState<string>(''); // 내 여행 날짜

  // BUG-08 fix: Web Push Notification API는 iOS WKWebView 미지원
  // Push 알림은 Capacitor PushNotifications 플러그인으로 처리


  // [Feature 1] 30초마다 관심 그룹 자리 변화 감지 → 인앱 toast 알림
  useEffect(() => {
    if (interestedGroups.size === 0) return;
    const interval = setInterval(() => {
      tripGroups.forEach(g => {
        if (!interestedGroups.has(g.id)) return;
        const prev = interestedSnapshot[g.id];
        if (prev === undefined) return;
        const left = g.maxMembers - g.currentMembers;
        if (left === 1 && g.currentMembers > prev) {
          // BUG-08 fix: Notification API 제거 (iOS WKWebView 미지원)
          // 인앱 toast만 사용
          toast({
            title: t("auto.t_0001", `⚠️ '${g.title}' 정원 1자리 남음!`),
            description: t("auto.g_0015", "지금지원하")
          });
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [interestedGroups, interestedSnapshot, tripGroups, t, toast]);

  // [Feature 4] 내 여행 날짜 fetch
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('travel_dates').eq('id', user.id).single().then(({
      data
    }) => {
      if (data?.travel_dates) setMyTravelDates(data.travel_dates);
    });
  }, [user]);
  const handleInterest = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const group = tripGroups.find(g => g.id === groupId);
    setInterestedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
        toast({
          title: t("auto.g_0016", "관심 취소됨")
        });
      } else {
        next.add(groupId);
        // 현재 멤버 수 스냅샷 저장
        if (group) setInterestedSnapshot(s => ({
          ...s,
          [groupId]: group.currentMembers
        }));
        toast({
          title: t("auto.g_0017", "관심 목록에 추가됨 🔔"),
          description: t("auto.g_0018", "자리가 줄어들면 알림을 보내드릴게요!")
        });
        // 브라우저 알림 권한 재확인
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }
      return next;
    });
  };
  // showApplicants / applicantsList → useGroupActions 훅으로 이동
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [actionSheetTarget, setActionSheetTarget] = useState<any | null>(null);

  // handleViewApplicants / handleApproveApplicant / handleRejectApplicant → useGroupActions 훅으로 이동

  // Payment modal
  const [paymentGroup, setPaymentGroup] = useState<TripGroup | null>(null);

  // Translate
  const targetLangAuto = i18n.language.split('-')[0] || 'en';
  const [translateMap, setTranslateMap] = useState<Record<string, string>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const targetLang = targetLangAuto as any;
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [notifCount] = useState(0);

  // ── 스크롤 방향 감지: 아래 → 헤더 숨김, 위 → 헤더 표시 ──
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scrollEl = pageRef.current?.closest('.overflow-y-auto') as HTMLElement | null;
    const target = scrollEl || window;
    const onScroll = () => {
      const current = scrollEl ? scrollEl.scrollTop : window.scrollY;
      if (current < 60) {
        setHeaderVisible(true);
      } // 최상단은 항상 표시
      else if (current > lastScrollY.current) {
        setHeaderVisible(false);
      } // 아래로
      else {
        setHeaderVisible(true);
      } // 위로
      lastScrollY.current = current;
    };
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, []);

  // Profile Click & Like Tracking
  const [viewProfileData, setViewProfileData] = useState<any>(null);
  const [likesPostId, setLikesPostId] = useState<string | null>(null);
  const [likesList, setLikesList] = useState<any[]>([]);

  // ── Handlers ──────────────────────────────────
  const handleProfileClick = async (e: React.MouseEvent, authorId: string) => {
    e.stopPropagation();
    if (!authorId) return;
    const {
      data
    } = await supabase.from('profiles').select(
      'id, name, photo_url, photo_urls, age, bio, gender, nationality, location, languages, interests, mbti, verified, plan, is_plus, travel_dates, user_type, profile_theme'
    ).eq('id', authorId).single();
    if (data) setViewProfileData(data);
  };
  const handleLikeListClick = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    setLikesPostId(postId);
    const {
      data
    } = await supabase.from('post_likes').select('profiles(name, photo_url)').eq('post_id', postId);
    setLikesList(data?.map((d: any) => d.profiles) || []);
  };
  const handleBoostPost = async (postId: string) => {
    if (!user) return;
    // SEC fix: 작성자 본인 확인 — 타인 포스트를 임의로 밀어올리는 것 방지
    const post = posts.find(p => p.id === postId);
    if (!post || post.authorId !== user.id) {
      toast({ title: t("auto.g_0029", "자신의 글만 부스트할 수 있습니다"), variant: "destructive" });
      return;
    }
    const {
      error
    } = await supabase.from('posts').update({
      created_at: new Date().toISOString()
    }).eq('id', postId).eq('author_id', user.id); // RLS 이중 방어
    if (!error) {
      toast({
        title: t("alert.t35Title")
      });
      setPosts(prev => {
        const target = prev.find(p => p.id === postId);
        if (!target) return prev;
        return [{
          ...target,
          time: t("auto.ko_0019", "방금전")
        }, ...prev.filter(p => p.id !== postId)];
      });
      if (detailPost?.id === postId) setDetailPost(prev => prev ? {
        ...prev,
        time: t("auto.ko_0020", "방금전")
      } : prev);
    } else {
      toast({
        title: t("alert.t36Title")
      });
    }
  };

  // ── Handlers ──────────────────────────────────
  const handleLikePost = async (post: Post) => {
    if (!user) return toast({ title: t("alert.loginRequired") ?? t("auto.g_0027", "로그인이 필요합니다") });
    const isLiked = post.liked;
    // 로컬 상태 즉시 업데이트 (optimistic)
    const updatePost = (p: Post) => p.id === post.id
      ? { ...p, liked: !isLiked, likes: isLiked ? p.likes - 1 : p.likes + 1 }
      : p;
    setPosts(prev => prev.map(updatePost));
    if (detailPost?.id === post.id) setDetailPost(prev => prev ? updatePost(prev) : prev);
    // DB 반영
    if (isLiked) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      await supabase.from('post_likes').upsert({ post_id: post.id, user_id: user.id }, { onConflict: 'post_id,user_id' });
      
      // 알림 전송 (자신의 글이 아닐 때만)
      if (post.authorId && post.authorId !== user.id) {
        const { data: userData } = await supabase.from("profiles").select("name").eq("id", user.id).single();
        await supabase.from('in_app_notifications').insert({
          user_id: post.authorId,
          type: 'post_like',
          message: t("auto.t_0028", `${userData?.name || t("auto.ko_0021", "누군가")}님이 회원님의 여행 피드를 좋아합니다.`),
          source_id: post.id
        });
      }
    }
  };

  const handleTranslate = useCallback(async (text: string, key: string) => {
    if (translateMap[key]) {
      setTranslateMap(prev => {
        const n = {
          ...prev
        };
        delete n[key];
        return n;
      });
      return;
    }
    setLoadingMap(prev => ({
      ...prev,
      [key]: true
    }));
    try {
      const result = await translateText({
        text,
        targetLang
      });
      setTranslateMap(prev => ({
        ...prev,
        [key]: result
      }));
    } catch {} finally {
      setLoadingMap(prev => {
        const n = {
          ...prev
        };
        delete n[key];
        return n;
      });
    }
  }, [targetLang, translateMap]);

  // ── fetchPosts / fetchGroups → useDiscoverData 훅으로 이동 ──


  // ── File select ────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_POST_PHOTOS - attachedImages.length;
    const toAdd = files.slice(0, remaining).map(file => ({
      file,
      url: URL.createObjectURL(file),
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())
    }));
    if (toAdd.length === 0) {
      toast({
        title: t("auto.t_0002", `사진은 최대 ${MAX_POST_PHOTOS}장까지 쳊부 가능합니다`),
        variant: "destructive"
      });
      return;
    }
    setAttachedImages(prev => [...prev, ...toAdd]);
    e.target.value = "";
  };

  // 이미지 제거 시 blob URL revoke (메모리 누수 방지)
  const handleRemoveAttachedImage = (id: string) => {
    setAttachedImages(prev => {
      const target = prev.find(img => img.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter(img => img.id !== id);
    });
  };

  // ── Share ──────────────────────────────────────
  const handleShare = async (group: TripGroup) => {
    const shareUrl = `${window.location.origin}/groups/${group.id}`;
    const shareTitle = group.title;
    const shareText = [
      `🌏 ${group.title}`,
      `📍 ${group.departure ? `${group.departure} → ` : ""}${group.destination}`,
      `📅 ${group.dates}`,
      `👥 ${group.currentMembers}/${group.maxMembers}${t("share.members", "명")}`,
      group.tags?.length ? group.tags.map(tag => `#${tag}`).join(" ") : "",
      "",
      t("share.joinMigo", "Migo에서 동행을 찾아보세요!"),
      shareUrl,
    ].filter(Boolean).join("\n");

    // 1순위: Web Share API (모바일 Chrome/Safari 네이티브 공유 시트)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") return; // 사용자가 취소 → 조용히 무시
      }
    }

    // 2순위: 클립보드 복사 fallback (데스크톱 / 미지원 환경)
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: t("share.copied", "링크가 복사됐어요! 🔗"),
        description: shareUrl,
      });
    } catch {
      toast({
        title: t("share.manualCopy", "아래 링크를 직접 복사해주세요"),
        description: shareUrl,
        variant: "destructive",
      });
    }
  };


  // ── Address Autocomplete & GPS ─────────────────
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleLocationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setWriteLocationName(val);
    setSelectedLocationObj(null); // Reset coords if manual typing
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (!val.trim()) {
      setAddressSuggestions([]);
      return;
    }
    
    debounceRef.current = setTimeout(async () => {
      try {
        // AutocompleteSuggestion (2025 새 API)
        const { suggestions } = await (window.google.maps.places as any).AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: val,
        });
        const preds = (suggestions || []).map((s: any) => ({
          description: s.placePrediction?.text?.text || s.placePrediction?.structuredFormat?.mainText?.text || val,
          placeId: s.placePrediction?.placeId || '',
        })).filter((p: any) => p.placeId);
        setAddressSuggestions(preds);
      } catch {
        // fallback: 빈 배열
        setAddressSuggestions([]);
      }
    }, 400);
  };

  const handleSelectSuggestion = async (prediction: { description: string; placeId: string }) => {
     setWriteLocationName(prediction.description);
     setAddressSuggestions([]);
     setLocationFocus(false);
     
     if (prediction.placeId) {
        try {
          // Place.fetchFields (2025 새 API)
          const place = new (window.google.maps.places as any).Place({ id: prediction.placeId });
          await place.fetchFields({ fields: ['location'] });
          if (place.location) {
            const lat = typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat;
            const lng = typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng;
            setSelectedLocationObj({ lat, lng, name: prediction.description });
          }
        } catch {
          // Place API 실패 시 Geocoder fallback
          geocoder.current?.geocode({ address: prediction.description }, (results, status) => {
            if (status === 'OK' && results?.[0]?.geometry?.location) {
              const loc = results[0].geometry.location;
              setSelectedLocationObj({
                lat: typeof loc.lat === 'function' ? loc.lat() : (loc as any).lat,
                lng: typeof loc.lng === 'function' ? loc.lng() : (loc as any).lng,
                name: prediction.description,
              });
            }
          });
        }
     }
  };

  const handleCurrentLocationClick = async () => {
      const loc = await getCurrentLocation(true);
      if (loc && geocoder.current) {
          geocoder.current.geocode({ location: { lat: loc.lat, lng: loc.lng } }, (results, status) => {
              if (status === 'OK' && results && results[0]) {
                  const address = results[0].formatted_address.replace(t("auto.ko_0028", "대한민국 "), "");
                  setWriteLocationName(address);
                  setSelectedLocationObj({
                      lat: loc.lat,
                      lng: loc.lng,
                      name: address
                  });
              } else {
                  toast({ title: t("auto.g_0028", "주소를 변환할 수 없습니다.") });
              }
          });
      }
  };

  // ── Submit post ────────────────────────────────
  const handleSubmitPost = async () => {
    if (!writeContent.trim() && attachedImages.length === 0) {
      toast({
        title: t("alert.t40Title"),
        variant: "destructive"
      });
      return;
    }
    if (!user) {
      toast({
        title: t("alert.t41Title"),
        variant: "destructive"
      });
      return;
    }
    const {
      data: userData
    } = await supabase.from("profiles").select("name, photo_url").eq("id", user.id).single();
    const uploadedUrls: string[] = [];
    for (const {
      file
    } of attachedImages) {
      const compressedFile = await compressImage(file);
      const ext = compressedFile.name.split(".").pop();
      const path = `posts/${user.id}_${Date.now()}_${uploadedUrls.length}.${ext}`;
      const {
        error: upErr
      } = await supabase.storage.from("avatars").upload(path, compressedFile, {
        upsert: true,
        contentType: compressedFile.type
      });
      if (!upErr) {
        const {
          data: urlData
        } = supabase.storage.from("avatars").getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }
    }
    // Attaching location tag
    const myLat = selectedLocationObj ? String(selectedLocationObj.lat) : (localStorage.getItem('migo_my_lat') || "37.5665");
    const myLng = selectedLocationObj ? String(selectedLocationObj.lng) : (localStorage.getItem('migo_my_lng') || "126.9780");
    const myLoc = selectedLocationObj?.name || writeLocationName.trim() || localStorage.getItem('migo_my_loc') || t("auto.ko_0029", "현재 위치");
    const targetTags = [];
    if (writeLocationName.trim() || (localStorage.getItem('migo_my_lat') && localStorage.getItem('migo_my_lng'))) {
      targetTags.push(`_loc_:${myLat}:${myLng}:${myLoc}`);
    }

    const {
      data,
      error
    } = await supabase.from("posts").insert({
      author_id: user.id,
      title: writeContent.slice(0, 20) || "Story",
      content: writeContent,
      image_url: uploadedUrls[0] || null,
      image_urls: uploadedUrls,
      tags: targetTags.length > 0 ? targetTags : null
    }).select().single();
    if (error) {
      toast({
        title: t("alert.t42Title")
      });
      return;
    }
    const newPost: Post = {
      id: data.id,
      author: userData?.name || t("auto.ko_0030", "나"),
      photo: userData?.photo_url || "",
      content: writeContent,
      time: t("auto.ko_0031", "방금전"),
      likes: 0,
      comments: 0,
      liked: false,
      commentList: [],
      imageUrl: uploadedUrls[0],
      images: uploadedUrls,
      authorId: user.id,
      locationTag: (myLat && myLng) ? { lat: parseFloat(myLat), lng: parseFloat(myLng), name: myLoc } : undefined
    };
    setPosts(prev => [newPost, ...prev]);
    setWriteContent("");
    setWriteTitle("");
    setWriteLocationName("");
    // 업로드 완료 후 blob URL revoke (메모리 누수 방지)
    attachedImages.forEach(img => URL.revokeObjectURL(img.url));
    setAttachedImages([]);
    setShowWriteModal(false);
    toast({
      title: t("alert.t43Title")
    });
  };

  // ── Submit comment ─────────────────────────────
  const handleSubmitComment = async () => {
    if (!commentText.trim() || !commentPost || !user) return;
    const {
      data: userData
    } = await supabase.from("profiles").select("name, photo_url").eq("id", user.id).single();
    const {
      data,
      error
    } = await supabase.from("comments").insert({
      post_id: commentPost.id,
      author_id: user.id,
      text: commentText
    }).select().single();
    if (error) return;
    const newComment: PostComment = {
      id: data.id,
      author: userData?.name || t("auto.ko_0032", "나"),
      photo: userData?.photo_url || "",
      text: commentText,
      time: t("auto.ko_0033", "방금전")
    };
    setPosts(prev => prev.map(p => p.id === commentPost.id ? {
      ...p,
      commentList: [...p.commentList, newComment],
      comments: p.comments + 1
    } : p));
    if (detailPost?.id === commentPost.id) {
      setDetailPost(prev => prev ? {
        ...prev,
        commentList: [...prev.commentList, newComment],
        comments: prev.comments + 1
      } : prev);
    }

    // 알림 전송 (자신의 글이 아닐 때만)
    if (commentPost.authorId && commentPost.authorId !== user.id) {
      const shortText = commentText.length > 15 ? commentText.substring(0, 15) + "..." : commentText;
      await supabase.from('in_app_notifications').insert({
        user_id: commentPost.authorId,
        type: 'post_comment',
        message: t("auto.t_0029", `${userData?.name || t("auto.ko_0034", "누군가")}님이 댓글을 남겼습니다: "${shortText}"`),
        source_id: commentPost.id
      });
    }

    setCommentText("");
    setCommentPost(null);
  };

  // ── 카운트다운 실시간 업데이트 ──────────────────────────
  useEffect(() => {
    if (!joinPopup) { setCountdown(''); return; }
    const tick = () => {
      const remaining = joinPopup.deadlineMs - Date.now();
      if (remaining <= 0) { setCountdown(t('groupPopup.expiredCountdown')); return; }
      const totalSec = Math.floor(remaining / 1000);
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;
      if (days > 0) {
        setCountdown(`${t('groupPopup.daysStr', { days })}${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`);
      } else {
        setCountdown(`${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`);
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [joinPopup, t]);

  // ── Join group: handleJoin / joinGroup → useGroupActions 훅으로 이동 ──

  // ── 삭제 (posts) ──────────────────────────────────────
  const deletePost = async (postId: string) => {
    if (!user) return;
    // iOS: window.confirm 대신 커스텀 모달 사용 (Apple HIG / WKWebView 차단 대응)
    setConfirmDialog({
      title: t("alert.c53Confirm"),
      desc: t("alert.c53Desc", "이 게시글을 삭제하면 복구할 수 없습니다."),
      onConfirm: async () => {
        const { error } = await supabase.from("posts").delete().eq("id", postId).eq("author_id", user.id);
        if (error) {
          toast({ title: t("alert.t49Title") });
          return;
        }
        setPosts(prev => prev.filter(p => p.id !== postId));
        if (detailPost?.id === postId) setDetailPost(null);
        toast({ title: t("alert.t50Title") });
      },
    });
  };
  // deleteGroup → deleteGroupAction (useGroupActions 훅)

  // ── Filter + Smart Sort ──────────────────────
  // [Feature 4] 내 여행 날짜와 매칭되는 그룹인지 확인
  const isDateMatch = (groupDates: string): boolean => {
    if (!myTravelDates || !groupDates) return false;
    try {
      const parseDate = (s: string) => {
        if (!s) return null;
        // Korean format t("auto.x4014") → Date
        const korMatch = s.match(/(\d+)월\s*(\d+)일/);
        if (korMatch) {
          const now = new Date();
          return new Date(now.getFullYear(), parseInt(korMatch[1]) - 1, parseInt(korMatch[2]));
        }
        const cleaned = s.replace(/[.]/g, '-').trim();
        const d = new Date(cleaned);
        return isNaN(d.getTime()) ? null : d;
      };
      const [myStart, myEnd] = myTravelDates.split('~').map(s => parseDate(s.trim()));
      const [gStart, gEnd] = groupDates.split('~').map(s => parseDate(s.trim()));
      if (!myStart || !myEnd || !gStart || !gEnd || isNaN(myStart.getTime()) || isNaN(gStart.getTime())) return false;
      return myStart <= gEnd && myEnd >= gStart; // 날짜 겹침 여부
    } catch {
      return false;
    }
  };

  // 활성도 점수: 충원율 + 마감임박 + 인기도 + [Feature 4] 날짜매칭
  const calcActivityScore = (g: TripGroup): number => {
    const fillRatio = g.currentMembers / Math.max(g.maxMembers, 1);
    const urgencyBonus = g.daysLeft <= 3 ? 30 : g.daysLeft <= 7 ? 15 : 0;
    const popularityBonus = fillRatio >= 0.75 ? 20 : fillRatio >= 0.5 ? 10 : 0;
    const premiumBonus = g.isPremiumGroup ? 15 : 0;
    const freshBonus = g.daysLeft > 14 ? 5 : 0;
    const dateMatchBonus = isDateMatch(g.dates) ? 50 : 0; // 내 날짜 매칭 최고 우선순위
    return fillRatio * 40 + urgencyBonus + popularityBonus + premiumBonus + freshBonus + dateMatchBonus;
  };
  // 목적지명 → 대략적인 좌표 (거리 필터용 fallback lookup)
  const DEST_COORDS: Record<string, {
    lat: number;
    lng: number;
  }> = {
    [t("auto.x4015")]: {
      lat: 35.6762,
      lng: 139.6503
    },
    "tokyo": {
      lat: 35.6762,
      lng: 139.6503
    },
    [t("auto.x4016")]: {
      lat: 34.6937,
      lng: 135.5023
    },
    "osaka": {
      lat: 34.6937,
      lng: 135.5023
    },
    [t("auto.x4017")]: {
      lat: 35.0116,
      lng: 135.7681
    },
    [t("auto.x4018")]: {
      lat: -8.3405,
      lng: 115.0920
    },
    "bali": {
      lat: -8.3405,
      lng: 115.0920
    },
    [t("auto.x4019")]: {
      lat: 48.8566,
      lng: 2.3522
    },
    "paris": {
      lat: 48.8566,
      lng: 2.3522
    },
    [t("auto.x4020")]: {
      lat: 40.7128,
      lng: -74.0060
    },
    "new york": {
      lat: 40.7128,
      lng: -74.0060
    },
    [t("auto.x4021")]: {
      lat: 13.7563,
      lng: 100.5018
    },
    "bangkok": {
      lat: 13.7563,
      lng: 100.5018
    },
    [t("auto.x4022")]: {
      lat: 18.7061,
      lng: 98.9817
    },
    [t("auto.x4023")]: {
      lat: 16.0544,
      lng: 108.2022
    },
    "da nang": {
      lat: 16.0544,
      lng: 108.2022
    },
    [t("auto.x4024")]: {
      lat: 46.5198,
      lng: 9.9367
    },
    [t("auto.x4025")]: {
      lat: 37.5665,
      lng: 126.9780
    },
    "seoul": {
      lat: 37.5665,
      lng: 126.9780
    },
    [t("auto.x4026")]: {
      lat: 36.1699,
      lng: -115.1398
    },
    [t("auto.x4027")]: {
      lat: 33.4996,
      lng: 126.5312
    }
  };
  const getDestCoords = (dest: string) => {
    const lower = dest.toLowerCase();
    for (const [key, coords] of Object.entries(DEST_COORDS)) {
      if (lower.includes(key)) return coords;
    }
    return null;
  };
  const STYLE_KEYWORDS: Record<string, string[]> = {
    "관광":        [t("auto.ko_0035", "투어"), t("auto.ko_0036", "관광"), "tour", t("auto.ko_0037", "명소"), t("auto.ko_0038", "문화"), t("auto.ko_0039", "역사")],
    "맛집":        [t("auto.ko_0040", "맛집"), t("auto.ko_0041", "음식"), "food", t("auto.ko_0042", "레스토랑"), "restaurant", t("auto.ko_0043", "미식"), t("auto.ko_0044", "먹방")],
    "자연":        [t("auto.ko_0045", "자연"), t("auto.ko_0046", "하이킹"), t("auto.ko_0047", "등산"), t("auto.ko_0048", "트레킹"), t("auto.ko_0049", "서핑"), t("auto.ko_0050", "액티비티"), t("auto.ko_0051", "아웃도어")],
    "휴양":        [t("auto.ko_0052", "휴양"), t("auto.ko_0053", "힐링"), t("auto.ko_0054", "리조트"), t("auto.ko_0055", "스파"), t("auto.ko_0056", "해변"), t("auto.ko_0057", "바다")],
    "나이트라이프": [t("auto.ko_0058", "클럽"), t("auto.ko_0059", "나이트"), "night", t("auto.ko_0060", "파티"), "bar", t("auto.ko_0061", "바"), t("auto.ko_0062", "펍")]
  };
  const filtered = tripGroups.filter(g => {
    const matchesFilter = activeFilter === "all" ? true : activeFilter === "recruiting" ? g.currentMembers < g.maxMembers : activeFilter === "almostFull" ? g.daysLeft <= 3 : activeFilter === "hot" ? g.daysLeft <= 5 && g.currentMembers < g.maxMembers : true;
    const q = searchQuery.toLowerCase();
    const choQ = getChosung(q);
    const matchesSearch = q === "" || g.title.toLowerCase().includes(q) || g.destination.toLowerCase().includes(q) || (g.departure || "").toLowerCase().includes(q) || g.tags.some(tag => tag.toLowerCase().includes(q)) || getChosung(g.title).includes(choQ) || getChosung(g.destination).includes(choQ);

    // ── 출발지 / 목적지 키워드 필터 ──────────────────────────
    const depKw = groupDetailFilter.departureKeyword.trim().toLowerCase();
    const destKw = groupDetailFilter.destinationKeyword.trim().toLowerCase();
    const matchesDeparture = !depKw || (g.departure || "").toLowerCase().includes(depKw);
    const matchesDestination = !destKw || g.destination.toLowerCase().includes(destKw);

    // ── 여행 스타일 필터 ──────────────────────────────────────
    let matchesStyle = true;
    if (groupDetailFilter.travelStyle) {
      const keywords = STYLE_KEYWORDS[groupDetailFilter.travelStyle] || [];
      const allText = [...g.tags, g.title, g.description || ""].join(" ").toLowerCase();
      matchesStyle = keywords.some(kw => allText.includes(kw));
    }

    // ── 여행 기간 필터 ────────────────────────────────────────
    let matchesDuration = true;
    if (groupDetailFilter.duration) {
      // dates 필드에서 기간을 파싱 (예: "5월 1일~7일" → 6박7일)
      const parseNights = (dates: string): number | null => {
        try {
          const m = dates.match(/(\d+)월\s*(\d+)일[~\-](\d+)일/);
          if (m) return parseInt(m[3]) - parseInt(m[2]);
          const m2 = dates.match(/(\d+)월\s*(\d+)일[~\-](\d+)월\s*(\d+)일/);
          if (m2) {
            const s = new Date(new Date().getFullYear(), parseInt(m2[1])-1, parseInt(m2[2]));
            const e = new Date(new Date().getFullYear(), parseInt(m2[3])-1, parseInt(m2[4]));
            return Math.ceil((e.getTime()-s.getTime())/86400000);
          }
          return null;
        } catch { return null; }
      };
      const nights = parseNights(g.dates);
      if (nights !== null) {
        if (groupDetailFilter.duration === t("auto.ko_0063", "1-3일"))  matchesDuration = nights >= 0 && nights <= 2;
        else if (groupDetailFilter.duration === t("auto.ko_0064", "4-7일")) matchesDuration = nights >= 3 && nights <= 6;
        else if (groupDetailFilter.duration === t("auto.ko_0065", "1-2주")) matchesDuration = nights >= 7 && nights <= 13;
        else if (groupDetailFilter.duration === t("auto.ko_0066", "2주+"))  matchesDuration = nights >= 14;
      }
    }

    // ── 성비 필터 ─────────────────────────────────────────────
    let matchesGender = true;
    if (groupDetailFilter.genderPref !== "any") {
      const allText = [...g.tags, g.title].join(" ").toLowerCase();
      const gMap: Record<string, string[]> = {
        "male-only":   [t("auto.ko_0067", "남성만"), t("auto.ko_0068", "남자만"), "all-male"],
        "female-only": [t("auto.ko_0069", "여성만"), t("auto.ko_0070", "여자만"), "all-female"],
        "mixed":       [t("auto.ko_0071", "혼성"), t("auto.ko_0072", "남녀"), "mixed"]
      };
      const kws = gMap[groupDetailFilter.genderPref] || [];
      const hasKeyword = kws.some(kw => allText.includes(kw));
      // 키워드 없으면 통과 (데이터 부족)
      matchesGender = !hasKeyword || hasKeyword;
    }

    return matchesFilter && matchesSearch && matchesDeparture && matchesDestination && matchesStyle && matchesDuration && matchesGender;
  }).sort((a, b) => {
    // 체크인 도시 그룹 최상단 우선 배치
    if (checkInCity) {
      const aInCity = a.destination.toLowerCase().includes(checkInCity.toLowerCase()) ? 0 : 1;
      const bInCity = b.destination.toLowerCase().includes(checkInCity.toLowerCase()) ? 0 : 1;
      if (aInCity !== bInCity) return aInCity - bInCity;
    }
    if (distanceFilter !== null && myPos) {
      const ca = getDestCoords(a.destination);
      const cb = getDestCoords(b.destination);
      const da = ca ? distanceTo(ca) ?? 99999 : 99999;
      const db = cb ? distanceTo(cb) ?? 99999 : 99999;
      return da - db;
    }
    return calcActivityScore(b) - calcActivityScore(a);
  });
  const currentDetail = detailGroup;
  const maxEngagement = posts.length > 0 ? Math.max(...posts.map(p => p.likes + p.comments)) : 0;
  const popularPostId = maxEngagement > 0 ? posts.find(p => p.likes + p.comments === maxEngagement)?.id : null;
  const sortedPosts = [...posts].sort((a, b) => {
    if (activeCommunityFilter === "popular") {
      return b.likes + b.comments - (a.likes + a.comments);
    }
    return 0;
  });

  // ── JSX ───────────────────────────────────────
  // 남녀 비율 계산 헬퍼
  const calcGenderRatio = (genders: ('male' | 'female' | 'unknown')[]) => {
    const total = genders.length;
    if (total === 0) return { male: 0, female: 0, unknown: 0, maleCount: 0, femaleCount: 0 };
    const maleCount = genders.filter(g => g === 'male').length;
    const femaleCount = genders.filter(g => g === 'female').length;
    return { male: Math.round((maleCount / total) * 100), female: Math.round((femaleCount / total) * 100), unknown: Math.round(((total - maleCount - femaleCount) / total) * 100), maleCount, femaleCount };
  };

  return <div ref={pageRef} className="min-h-full bg-background">
      {/* ── 카운트다운 알림 팝업 (1시간 전 / 30분 전 / 마감) ── */}
      <AnimatePresence>
        {countdownAlert && (() => {
          const cfg = countdownAlert.type === 'expired'
            ? { emoji: '⏰', bg: 'bg-red-500', title: t('groupPopup.expiredTitle'), desc: t('groupPopup.expiredDesc', { title: countdownAlert.groupTitle }) }
            : countdownAlert.type === '30min'
            ? { emoji: '⚡', bg: 'bg-orange-500', title: t('groupPopup.min30Title'), desc: t('groupPopup.min30Desc', { title: countdownAlert.groupTitle }) }
            : { emoji: '🔔', bg: 'bg-amber-500', title: t('groupPopup.hour1Title'), desc: t('groupPopup.hour1Desc', { title: countdownAlert.groupTitle }) };
          return (
            <motion.div
              key="countdown-alert"
              initial={{ opacity: 0, y: -80, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -60, scale: 0.92 }}
              transition={{ type: 'spring', damping: 20, stiffness: 260 }}
              className="fixed top-16 left-4 right-4 z-[60] max-w-sm mx-auto"
            >
              <div className={`${cfg.bg} rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-float`}>
                <motion.span
                  animate={{ rotate: countdownAlert.type === 'expired' ? [0, -15, 15, -10, 10, 0] : [0] }}
                  transition={{ duration: 0.5, repeat: countdownAlert.type !== 'expired' ? 0 : 2 }}
                  className="text-2xl shrink-0"
                >{cfg.emoji}</motion.span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-extrabold text-sm">{cfg.title}</p>
                  <p className="text-white/80 text-[11px] truncate">{cfg.desc}</p>
                </div>
                <button onClick={() => setCountdownAlert(null)} className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <X size={11} className="text-white" />
                </button>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── 그룹 참여 실시간 팝업 ── */}
      <AnimatePresence>
        {joinPopup && (() => {
          const ratio = calcGenderRatio(joinPopup.genders);
          const { group } = joinPopup;
          const isUrgent = joinPopup.deadlineMs - Date.now() < 60 * 60 * 1000; // 1시간 미만
          const isVeryUrgent = joinPopup.deadlineMs - Date.now() < 30 * 60 * 1000; // 30분 미만
          return (
            <motion.div
              key="join-popup"
              initial={{ opacity: 0, y: 80, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.92 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
              className="fixed left-4 right-4 z-50 max-w-sm mx-auto"
              style={{ bottom: (!isPlus && !isPremium) ? '185px' : '100px' }}
            >
              <div className="bg-card border border-border rounded-3xl shadow-float overflow-hidden">
                {/* 상단 헤더 */}
                <div className="px-5 pt-4 pb-3 gradient-primary flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <motion.span
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      className="text-lg"
                    >🎉</motion.span>
                    <div>
                      <p className="text-primary-foreground font-extrabold text-sm truncate">{t("alert.t48Title")}</p>
                      <p className="text-primary-foreground/70 text-[11px] truncate max-w-[180px]">{group.title}</p>
                    </div>
                  </div>
                  <button onClick={closeJoinPopup} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                    <X size={13} className="text-white" />
                  </button>
                </div>

                <div className="px-5 py-4 space-y-3">
                  {/* ⏱ 카운트다운 타이머 */}
                  <div className={`flex items-center justify-between rounded-2xl px-4 py-2.5 ${isVeryUrgent ? 'bg-red-500/10 border border-red-500/30' : isUrgent ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-muted'}`}>
                    <div className="flex items-center gap-1.5">
                      <motion.span
                        animate={isVeryUrgent ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="text-base"
                      >{isVeryUrgent ? '🔴' : isUrgent ? '🟠' : '⏱'}</motion.span>
                      <span className={`text-xs font-bold ${isVeryUrgent ? 'text-red-500' : isUrgent ? 'text-orange-500' : 'text-muted-foreground'}`}>
                        {t('groupPopup.untilDeadline')}
                      </span>
                    </div>
                    <motion.span
                      key={countdown}
                      initial={{ scale: isVeryUrgent ? 1.15 : 1 }}
                      animate={{ scale: 1 }}
                      className={`font-extrabold text-base tabular-nums ${isVeryUrgent ? 'text-red-500' : isUrgent ? 'text-orange-500' : 'text-foreground'}`}
                    >{countdown}</motion.span>
                  </div>

                  {/* 실시간 인원 카운터 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users size={15} className="text-primary" />
                      <span className="text-sm font-bold text-foreground truncate">{t('groupPopup.currentMembers')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <motion.span
                        key={joinPopup.newCount}
                        initial={{ scale: 1.4, color: "#22c55e" }}
                        animate={{ scale: 1, color: "var(--foreground)" }}
                        className="text-lg font-extrabold text-foreground"
                      >{joinPopup.newCount}</motion.span>
                      <span className="text-sm text-muted-foreground truncate">/ {group.maxMembers}{t("auto.ko_0000", "명")}</span>
                    </div>
                  </div>

                  {/* 인원 프로그레스 바 */}
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full gradient-primary rounded-full"
                      initial={{ width: `${((joinPopup.newCount - 1) / group.maxMembers) * 100}%` }}
                      animate={{ width: `${(joinPopup.newCount / group.maxMembers) * 100}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>

                  {/* 남녀 비율 */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-muted-foreground truncate">{t('groupPopup.ratioPrefix')}</span>
                      <div className="flex items-center gap-3 text-xs font-bold truncate">
                        <span className="text-blue-500 truncate">{t('groupPopup.maleCount', { count: ratio.maleCount })}</span>
                        <span className="text-pink-500 truncate">{t('groupPopup.femaleCount', { count: ratio.femaleCount })}</span>
                        {joinPopup.genders.filter(g => g === 'unknown').length > 0 &&
                          <span className="text-muted-foreground truncate">{t('groupPopup.unknownCount', { count: joinPopup.genders.filter(g => g === 'unknown').length })}</span>}
                      </div>
                    </div>
                    <div className="flex h-3 rounded-full overflow-hidden">
                      {ratio.maleCount > 0 && (
                        <motion.div initial={{ flex: 0 }} animate={{ flex: ratio.maleCount }} transition={{ duration: 0.5 }} className="bg-blue-500" />
                      )}
                      {ratio.femaleCount > 0 && (
                        <motion.div initial={{ flex: 0 }} animate={{ flex: ratio.femaleCount }} transition={{ duration: 0.5 }} className="bg-pink-500" />
                      )}
                      {joinPopup.genders.filter(g => g === 'unknown').length > 0 && (
                        <motion.div initial={{ flex: 0 }} animate={{ flex: joinPopup.genders.filter(g => g === 'unknown').length }} transition={{ duration: 0.5 }} className="bg-muted-foreground/30" />
                      )}
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span className="truncate">{t('groupPopup.malePct', { pct: ratio.male })}</span>
                      <span className="truncate">{t('groupPopup.femalePct', { pct: ratio.female })}</span>
                    </div>
                  </div>

                  {/* 실시간 상태 */}
                  <motion.div
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-3 py-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                      {group.maxMembers - joinPopup.newCount > 0
                        ? t('groupPopup.seatsLeft', { count: group.maxMembers - joinPopup.newCount })
                        : t('groupPopup.full')}
                    </span>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/40 pt-safe transition-transform duration-300" style={{ transform: headerVisible ? "translateY(0)" : "translateY(-100%)" }}>
        {/* Row 1: 타이틀 + 액션 버튼 */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center shadow-sm">
              <Compass size={15} className="text-white" />
            </div>
            <div>
              <h1 className="text-[18px] font-black text-foreground tracking-tight leading-tight">{t("auto.ko_0001", "동행 찾기")}</h1>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] text-emerald-600 font-bold">{t("auto.ko_0002", "여행자 모집 중")}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => navigate("/notifications")} className="relative w-8 h-8 rounded-xl bg-card border border-border/60 flex items-center justify-center shadow-sm active:scale-95 transition-all">
              <Bell size={15} className="text-foreground" />
              {notifCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[8px] font-bold text-white flex items-center justify-center shadow-sm">{notifCount}</span>}
            </button>
            <button onClick={() => setShowGlobalFilter(true)} className={`relative w-8 h-8 rounded-xl border flex items-center justify-center shadow-sm transition-all active:scale-95 ${globalFilterCount > 0 ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/60 text-foreground"}`}>
              <SlidersHorizontal size={15} />
              {globalFilterCount > 0 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-orange-500 flex items-center justify-center text-[8px] font-extrabold text-white shadow-sm border border-orange-400">{globalFilterCount}</motion.span>}
            </button>
          </div>
        </div>

        {/* Trust stat bar — groups tab */}
        {activeTab === "groups" && (
          <div className="flex items-center gap-0 px-4 pb-2 pt-1">
            {[
              { emoji: "✅", label: t("discover.trustHost", "인증 호스트"), value: `${Math.min(filtered.length, 50)}+` },
              { emoji: "🛡️", label: t("discover.trustSafe", "신고 즉시 처리"), value: "24h" },
              { emoji: "⭐", label: t("discover.trustReview", "후기 검증"), value: "100%" },
            ].map(({ emoji, label, value }, i, arr) => (
              <div key={label} className={`flex-1 flex flex-col items-center py-1.5 ${i < arr.length - 1 ? 'border-r border-border/30' : ''}`}>
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[11px]">{emoji}</span>
                  <span className="text-[11px] font-black text-foreground">{value}</span>
                </div>
                <span className="text-[8px] text-muted-foreground font-semibold">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Row 2: 탭 스위처 */}
        <div className="px-4 pb-3 pt-1">
          <div className="flex bg-muted/60 p-1 rounded-[1.25rem] w-full border border-border/50">
            <button onClick={() => setActiveTab("groups")} className={`flex-1 py-2 rounded-[1rem] text-[12px] font-extrabold transition-all flex items-center justify-center gap-1.5 ${activeTab === "groups" ? "bg-white dark:bg-zinc-800 text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.05)]" : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"}`}>
              {t("auto.ko_0003", "✈️ 동행 구하기")}{filtered.length > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === "groups" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>{filtered.length}</span>}
            </button>
            <button onClick={() => setActiveTab("community")} className={`flex-1 py-2 rounded-[1rem] text-[12px] font-extrabold transition-all flex items-center justify-center gap-1.5 ${activeTab === "community" ? "bg-white dark:bg-zinc-800 text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.05)]" : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"}`}>
              <ImageIcon size={14} /> {t("auto.ko_0004", "여행 피드")}{posts.length > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === "community" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>{posts.length}</span>}
            </button>
          </div>
        </div>
      </div>

      {/* TodayContent & DailyPicksCard */}
      {activeTab === "groups" && (
        <div className="flex flex-col pt-2">
          <TodayContent />
          <DailyPicksCard onProfileClick={(id) => handleProfileClick({ stopPropagation: () => {} } as any, id)} />
        </div>
      )}

      {/* Search + Filter Row */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-card border border-border/60 rounded-2xl px-3.5 py-2.5 shadow-sm focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_rgba(var(--primary)/0.08)] transition-all">
          <Search size={15} className="text-primary/60 shrink-0" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={activeTab === "groups" ? t("auto.ko_0073", "🌍 목적지 검색") : t("auto.ko_0074", "피드 검색")}
            className="flex-1 bg-transparent text-[13px] font-semibold text-foreground placeholder:text-muted-foreground/50 outline-none"
          />
          {searchQuery && <button onClick={() => setSearchQuery("")} className="w-5 h-5 rounded-full bg-muted flex items-center justify-center"><X size={11} className="text-muted-foreground" /></button>}
        </div>
        {activeTab === "groups" && (
          <button
            onClick={() => setShowGroupDetailFilter(true)}
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center shadow-sm transition-all active:scale-95 shrink-0 ${
              groupDetailFilterCount > 0 ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border/60 text-muted-foreground'
            }`}
          >
            <SlidersHorizontal size={15} />
          </button>
        )}
        {activeTab === "community" && user && (
          <button onClick={() => setShowWriteModal(true)} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-400 to-blue-500 text-white font-extrabold shadow-sm active:scale-95 transition-all text-[12px] shrink-0">
            <Pencil size={13} className="text-white" /> {t("auto.ko_0005", "여행글 쓰기")}
          </button>
        )}
      </div>

      {/* Global filter active chips */}
      <AnimatePresence>
        {globalFilterCount > 0 && <motion.div initial={{
        height: 0,
        opacity: 0
      }} animate={{
        height: "auto",
        opacity: 1
      }} exit={{
        height: 0,
        opacity: 0
      }} transition={{
        duration: 0.2
      }} className="overflow-hidden">
            <div className="flex gap-2 px-5 py-2 overflow-x-auto scrollbar-hide">
              {globalFilters.destination && <motion.button initial={{
            scale: 0.8,
            opacity: 0
          }} animate={{
            scale: 1,
            opacity: 1
          }} onClick={() => clearGlobalDest(null)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-xs font-semibold text-primary whitespace-nowrap shrink-0">
                  🌍 {globalFilters.destination === "tokyo" ? t("auto.ko_0075", "도쿄") : globalFilters.destination === "seoul" ? t("auto.ko_0076", "서울") : t("auto.ko_0077", "방콕")}
                  <X size={10} strokeWidth={3} />
                </motion.button>}
              {(globalFilters.dateRange.start || globalFilters.dateRange.end) && <motion.button initial={{
            scale: 0.8,
            opacity: 0
          }} animate={{
            scale: 1,
            opacity: 1
          }} onClick={() => clearGlobalDate({
            start: null,
            end: null
          })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-xs font-semibold text-blue-600 whitespace-nowrap shrink-0">
                  📅 {globalFilters.dateRange.start ? t("auto.t_0030", `${parseInt(globalFilters.dateRange.start.split("-")[1])}월 ${parseInt(globalFilters.dateRange.start.split("-")[2])}일`) : ""}{globalFilters.dateRange.end ? t("auto.t_0031", ` ~ ${parseInt(globalFilters.dateRange.end.split("-")[1])}월 ${parseInt(globalFilters.dateRange.end.split("-")[2])}일`) : ""}
                  <X size={10} strokeWidth={3} />
                </motion.button>}
              {globalFilters.groupSize !== null && <motion.button initial={{
            scale: 0.8,
            opacity: 0
          }} animate={{
            scale: 1,
            opacity: 1
          }} onClick={() => clearGlobalGroup(null)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-xs font-semibold text-purple-600 whitespace-nowrap shrink-0">
                  👥 {globalFilters.groupSize === 6 ? t("auto.ko_0078", "6명 이상") : t("auto.t_0032", `${globalFilters.groupSize}명`)}
                  <X size={10} strokeWidth={3} />
                </motion.button>}
            </div>
          </motion.div>}
      </AnimatePresence>

      {/* Filters (Groups only) */}
      {activeTab === "groups" && (
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {FILTER_LIST.map(f => {
              const label = f === "all" ? t("auto.ko_0014", "전체") : f === "recruiting" ? t("auto.ko_0015", "모집 중") : f === "almostFull" ? t("auto.ko_0016", "마감 임박") : t("auto.ko_0017", "인기 동행");
              return (
                <button key={f} onClick={() => setActiveFilter(f)} className={`px-3.5 py-1.5 rounded-full text-[11px] font-extrabold whitespace-nowrap transition-all border shadow-sm ${activeFilter === f ? "bg-gradient-to-r from-teal-400 to-blue-500 text-white border-transparent" : "bg-card text-muted-foreground border-border/50 hover:bg-muted"}`}>
                  {label}
                </button>
              );
            })}

          </div>
        </div>
      )}

      {/* Sort tabs (Community / 여행 피드) */}
      {activeTab === "community" && (
        <div className="px-4 pb-2 flex items-center gap-1">
          <button onClick={() => setActiveCommunityFilter("latest")} className={`px-3.5 py-1.5 rounded-full text-[11px] font-extrabold border transition-all ${activeCommunityFilter === "latest" ? "bg-gradient-to-r from-teal-400 to-blue-500 text-white border-transparent" : "bg-card text-muted-foreground border-border/50"}`}>{t("auto.ko_0006", "최신")}</button>
          <button onClick={() => setActiveCommunityFilter("popular")} className={`px-3.5 py-1.5 rounded-full text-[11px] font-extrabold border transition-all ${activeCommunityFilter === "popular" ? "bg-gradient-to-r from-teal-400 to-blue-500 text-white border-transparent" : "bg-card text-muted-foreground border-border/50"}`}>{t("auto.ko_0007", "인기")}</button>
        </div>
      )}

      {/* Group detail active chips */}
      <AnimatePresence>
        {activeTab === "groups" && groupDetailFilterCount > 0 && <motion.div initial={{
        height: 0,
        opacity: 0
      }} animate={{
        height: "auto",
        opacity: 1
      }} exit={{
        height: 0,
        opacity: 0
      }} className="overflow-hidden">
          <div className="flex gap-2 px-5 pb-2 overflow-x-auto scrollbar-hide">
              {groupDetailFilter.departureKeyword.trim() && <motion.button initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                onClick={() => setGroupDetailFilter(p => ({ ...p, departureKeyword: "" }))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-xs font-semibold text-sky-600 shrink-0">
                  {t("auto.ko_0008", "📍 출발:")}{groupDetailFilter.departureKeyword} <X size={10} strokeWidth={3} />
              </motion.button>}
              {groupDetailFilter.destinationKeyword.trim() && <motion.button initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                onClick={() => setGroupDetailFilter(p => ({ ...p, destinationKeyword: "" }))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-xs font-semibold text-teal-600 shrink-0">
                  {t("auto.ko_0009", "✈️ 목적지:")}{groupDetailFilter.destinationKeyword} <X size={10} strokeWidth={3} />
              </motion.button>}
              {groupDetailFilter.travelStyle && <motion.button initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                onClick={() => setGroupDetailFilter(p => ({ ...p, travelStyle: null }))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-xs font-semibold text-orange-600 shrink-0">
                  {groupDetailFilter.travelStyle === t("auto.ko_0079", "관광") ? "🗺️" : groupDetailFilter.travelStyle === t("auto.ko_0080", "맛집") ? "🍜" : groupDetailFilter.travelStyle === t("auto.ko_0081", "자연") ? "🏔️" : groupDetailFilter.travelStyle === t("auto.ko_0082", "휴양") ? "🏖️" : "🎉"} {groupDetailFilter.travelStyle} <X size={10} strokeWidth={3} />
              </motion.button>}
              {groupDetailFilter.duration && <motion.button initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                onClick={() => setGroupDetailFilter(p => ({ ...p, duration: null }))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-xs font-semibold text-blue-600 shrink-0">
                  📅 {groupDetailFilter.duration} <X size={10} strokeWidth={3} />
              </motion.button>}
              {groupDetailFilter.genderPref !== "any" && <motion.button initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                onClick={() => setGroupDetailFilter(p => ({ ...p, genderPref: "any" }))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-xs font-semibold text-pink-600 shrink-0">
                  👥 {groupDetailFilter.genderPref === "female-only" ? t("auto.ko_0083", "여성만") : groupDetailFilter.genderPref === "male-only" ? t("auto.ko_0084", "남성만") : t("auto.ko_0085", "혼성")} <X size={10} strokeWidth={3} />
              </motion.button>}
            </div>
          </motion.div>}
      </AnimatePresence>

      {/* GlobalFilter bottom sheet */}
      <GlobalFilter open={showGlobalFilter} onClose={() => setShowGlobalFilter(false)} />

      {/* GroupDetailFilter bottom sheet */}
      <GroupDetailFilter open={showGroupDetailFilter} onClose={() => setShowGroupDetailFilter(false)} value={groupDetailFilter} onChange={setGroupDetailFilter} checkInCity={checkInCity} />

      {/* Join Payment Modal */}
      {paymentGroup && <PaymentModal isOpen={!!paymentGroup} onClose={() => setPaymentGroup(null)} groupTitle={paymentGroup.title} groupId={paymentGroup.id} groupTags={paymentGroup.tags} isPremiumGroup={paymentGroup.isPremiumGroup} onPaymentSuccess={() => {
      setAppliedGroups(prev => new Set([...prev, paymentGroup.id]));
      setPaymentGroup(null);
    }} />}

      {/* Groups list */}
      <AnimatePresence mode="wait">
        {activeTab === "groups" && <motion.div
          key="groups"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="px-4 space-y-3 pt-2 pb-6"
        >
          {loadingGroups ? (
            <div className="space-y-3">
              {[0,1,2].map(i => (
                <div key={i} className="bg-card rounded-2xl border border-border/40 overflow-hidden animate-pulse">
                  <div className="h-1 bg-muted" />
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-4 bg-muted rounded-lg w-3/4" />
                        <div className="h-3 bg-muted rounded-lg w-1/2" />
                      </div>
                      <div className="h-5 w-10 bg-muted rounded-full" />
                    </div>
                    <div className="h-8 bg-muted rounded-xl" />
                    <div className="h-2 bg-muted rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-400/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4 border border-teal-400/20"
              >
                <span className="text-4xl">✈️</span>
              </motion.div>
              <p className="text-base font-extrabold text-foreground mb-1">{t("auto.ko_0010", "아직 동행 모집이 없어요")}</p>
              <p className="text-sm text-muted-foreground mb-5">{t("auto.ko_0011", "첫 번째로 여행 동행을 구해보세요!")}</p>
              <button
                onClick={() => setShowGroupCreate(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl gradient-primary text-white font-extrabold text-sm shadow-md active:scale-95 transition-transform"
              >
                <Plus size={16} />
                {t("discover.createFirst", "동행 모집 만들기")}
              </button>
            </div>
          ) : filtered.map((g, gIdx) => {
            const tier = inferGroupTier(g.tags, g.title, g.isPremiumGroup ?? false);
            const cfg = getTierConfig(tier);
            const fillRatio = g.currentMembers / Math.max(g.maxMembers, 1);
            const isAlmostFull = fillRatio >= 0.75;
            const isUrgent = g.daysLeft <= 3;
            const isFull = g.currentMembers >= g.maxMembers;
            const seatsLeft = g.maxMembers - g.currentMembers;
            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gIdx * 0.04, duration: 0.2 }}
                className="bg-card rounded-2xl shadow-sm overflow-hidden cursor-pointer border border-border/50 active:scale-[0.985] transition-transform"
                onClick={() => setDetailGroup(g)}
              >
                {/* Tier accent bar */}
                <div className={`h-[3px] w-full bg-gradient-to-r ${cfg.gradient}`} />
                <div className="p-4">
                  {/* Row 1: host avatar + title + D-day badge */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative shrink-0">
                      {g.hostPhoto
                        ? <img src={g.hostPhoto} alt="" className="w-10 h-10 rounded-xl object-cover shadow-sm" loading="lazy" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        : <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400/30 to-blue-500/30 flex items-center justify-center text-primary font-extrabold text-sm">{g.hostName?.[0] || 'M'}</div>
                      }
                      {/* Host verified badge */}
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center">
                        <Check size={8} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-extrabold text-foreground leading-tight line-clamp-1 mb-0.5">{g.title}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">{g.hostName}</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                        <span className="text-[10px] text-emerald-600 font-semibold">✅ {t("discover.verified", "인증 호스트")}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {isUrgent
                        ? <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 whitespace-nowrap">🔥 D-{g.daysLeft}</span>
                        : <span className="text-[10px] text-muted-foreground font-semibold whitespace-nowrap">D-{g.daysLeft}</span>
                      }
                      {tier === 'premium' && (
                        <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/20">VIP</span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: 출발 → 목적지 + 날짜 */}
                  <div className="flex items-center gap-1.5 mb-3 bg-gradient-to-r from-muted/60 to-muted/30 rounded-xl px-3 py-2">
                    <MapPin size={10} className="text-muted-foreground shrink-0" />
                    <span className="text-[11px] font-semibold text-foreground truncate">{g.departure || t("auto.ko_0086", "미정")}</span>
                    <span className="text-primary font-black text-[11px] px-1">→</span>
                    <span className="text-[12px] font-extrabold text-primary flex-1 truncate">{g.destination}</span>
                    <span className="w-px h-3 bg-border/50" />
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground shrink-0 ml-1">
                      <Calendar size={9} />
                      <span className="truncate max-w-[72px]">{g.dates}</span>
                    </span>
                  </div>

                  {/* Row 3: 인원 progress + seat info */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-1">
                          {g.memberPhotos.slice(0, 4).map((p, i) => (
                            <img key={i} src={p} className="w-5 h-5 rounded-full border border-background object-cover" />
                          ))}
                          {g.memberPhotos.length === 0 && (
                            <div className="w-5 h-5 rounded-full border border-background bg-muted flex items-center justify-center">
                              <Users size={8} className="text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <span className={`text-[11px] font-bold ${
                          isFull ? 'text-red-500' : isAlmostFull ? 'text-orange-500' : 'text-foreground'
                        }`}>
                          {g.currentMembers}/{g.maxMembers}{t("auto.ko_0012", "명")}
                        </span>
                      </div>
                      <span className={`text-[10px] font-extrabold ${
                        isFull ? 'text-red-500' : isAlmostFull ? 'text-orange-500' : 'text-emerald-600'
                      }`}>
                        {isFull ? t("discover.full", "마감🔴") : isAlmostFull ? t("discover.almostFull", `잔여 ${seatsLeft}석`) : t("discover.seatsLeft", `${seatsLeft}자리 남음`)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          isFull ? 'bg-red-500' : isAlmostFull ? 'bg-orange-400' : 'bg-gradient-to-r from-teal-400 to-blue-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(fillRatio * 100, 100)}%` }}
                        transition={{ duration: 0.6, delay: gIdx * 0.05 }}
                      />
                    </div>
                  </div>

                  {/* Row 4: tags */}
                  {g.tags.filter(tg => !tg.startsWith('_')).length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {g.tags.filter(tg => !tg.startsWith('_')).slice(0, 4).map(tag => (
                        <span key={tag} className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-primary/8 text-primary border border-primary/15">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>}
      </AnimatePresence>

      {/* ✈️ 동행 구하기 FAB — 동행 탭일 때만 표시 */}
      <AnimatePresence>
        {activeTab === "groups" && (
          <motion.button
            key="fab-create"
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 20 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setShowGroupCreate(true)}
            className="fixed right-5 z-40 flex items-center gap-2 px-5 py-3.5 rounded-2xl gradient-primary text-white font-extrabold text-sm shadow-float"
            style={{ bottom: (!isPlus && !isPremium) ? "calc(128px + env(safe-area-inset-bottom, 0px))" : "calc(68px + env(safe-area-inset-bottom, 0px))" }}
          >
            <span className="text-base leading-none">✈️</span>
            {t("auto.ko_0013", "동행 구하기")}</motion.button>
        )}
      </AnimatePresence>

      {/* GroupCreateModal */}
      <GroupCreateModal
        isOpen={showGroupCreate}
        onClose={() => setShowGroupCreate(false)}
        onCreated={(newGroup) => {
          setShowGroupCreate(false);
          // 목록 새로고침
          setTripGroups(prev => [{
            id: newGroup.id,
            title: newGroup.title || "",
            destination: newGroup.destination || "",
            departure: newGroup.departure || "",
            dates: newGroup.dates || t("auto.ko_0087", "미정"),
            currentMembers: 1,
            maxMembers: newGroup.max_members || 6,
            hostId: user?.id || "",
            hostName: user?.name || t("auto.ko_0088", "나"),
            hostPhoto: user?.photoUrl || "",
            hostBio: "",
            memberPhotos: [],
            memberNames: [user?.name || t("auto.ko_0089", "나")],
            tags: newGroup.tags || [],
            description: newGroup.description || "",
            daysLeft: 30,
            distanceKm: undefined,
            isPremiumGroup: false,
            hostCompletedGroups: 0,
            joined: true,
          } as TripGroup, ...prev]);
        }}
      />

      {/* Community posts */}
      <DiscoverPosts
        activeTab={activeTab}
        loadingPosts={loadingPosts}
        sortedPosts={sortedPosts}
        readStories={readStories}
        handleStoryClick={handleStoryClick}
        deletePost={deletePost}
        user={user}
      />

      {/* Story Viewer Overlay */}
      {activeStoryIndex !== null && (
        <StoryViewer
          posts={sortedPosts}
          initialIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
          onAuthorClick={(id) => {
            setActiveStoryIndex(null);
            handleProfileClick({ stopPropagation: () => {} } as any, id);
          }}
          onComment={(post) => {
            setActiveStoryIndex(null);
            setDetailPost(post);
          }}
          onLike={(postId) => {
            const p = sortedPosts.find((x: any) => x.id === postId);
            if (p) handleLikePost(p);
          }}
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

      {/* ── Group Detail Modal ── */}
      <GroupDetailModal
        currentDetail={currentDetail}
        setDetailGroup={setDetailGroup}
        t={t}
        handleShare={handleShare}
        translateMap={translateMap}
        loadingMap={loadingMap}
        handleTranslate={handleTranslate}
        handleJoin={handleJoin}
      />

      {/* ── Post Detail Modal ── */}
      <PostDetailModal
        detailPost={detailPost}
        setDetailPost={setDetailPost}
        t={t}
        handleProfileClick={handleProfileClick}
        handleTranslate={handleTranslate}
        translateMap={translateMap}
        loadingMap={loadingMap}
        user={user}
        commentText={commentText}
        setCommentText={setCommentText}
        setCommentPost={setCommentPost}
        handleSubmitComment={handleSubmitComment}
      />

      {/* ── Write Post Modal ── */}
      <WritePostModal
        showWriteModal={showWriteModal}
        setShowWriteModal={setShowWriteModal}
        attachedImages={attachedImages}
        setAttachedImages={setAttachedImages}
        writeContent={writeContent}
        setWriteContent={setWriteContent}
        handleSubmitPost={handleSubmitPost}
        writeLocationName={writeLocationName}
        handleLocationInputChange={handleLocationInputChange}
        locationFocus={locationFocus}
        setLocationFocus={setLocationFocus}
        addressSuggestions={addressSuggestions}
        handleSelectSuggestion={handleSelectSuggestion}
        handleCurrentLocationClick={handleCurrentLocationClick}
        fileInputRef={fileInputRef}
        handleFileSelect={handleFileSelect}
      />

      {/* ── Post Detail Modal ── */}
      <AnimatePresence>
        {detailPost && <motion.div initial={{
        y: "100%"
      }} animate={{
        y: 0
      }} exit={{
        y: "100%"
      }} className="fixed inset-0 z-50 bg-background overflow-y-auto">
            <div className="px-5 pt-12 pb-32">
              <button onClick={() => setDetailPost(null)} className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <ArrowLeft size={16} />{t("discover.backToList", { defaultValue: "Back to list" })}</button>
              
              <div className="bg-card rounded-2xl p-4 shadow-card mb-4 border border-border">
                <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={e => handleProfileClick(e, detailPost.authorId)}>
                  <img src={detailPost.photo} alt="" className="w-10 h-10 rounded-full object-cover" loading="lazy" />
                  <div>
                    <p className="text-sm font-bold text-foreground hover:underline">{detailPost.author}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    {detailPost.time}
                    {detailPost.locationTag && (
                      <span className="flex items-center gap-0.5 text-primary">
                        <span className="w-1 h-1 rounded-full bg-muted-foreground mx-1" />
                        <MapPin size={10} />
                        {detailPost.locationTag.name}
                      </span>
                    )}
                  </p>
                  </div>
                </div>

                <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap mb-4">{detailPost.content}</p>

                {detailPost.images && detailPost.images.length > 0 ? <div className="grid gap-2 mb-4">
                    {detailPost.images.map((img, idx) => <img key={idx} src={img} className="w-full rounded-xl object-cover bg-black/5" onError={e => e.currentTarget.style.display = 'none'} />)}
                  </div> : detailPost.imageUrl ? <img src={detailPost.imageUrl} className="w-full rounded-xl object-cover mb-4 bg-black/5" onError={e => e.currentTarget.style.display = 'none'} /> : null}

                <div className="flex items-center gap-4 pt-4 border-t border-border truncate">
                  <button onClick={() => handleLikePost(detailPost)} className={`flex items-center gap-1.5 text-sm font-bold ${detailPost.liked ? "text-red-500" : "text-muted-foreground"}`}>
                    <Heart size={16} className={detailPost.liked ? "fill-red-500" : ""} />
                    <span onClick={e => {
                  e.stopPropagation();
                  handleLikeListClick(e, detailPost.id);
                }} className="hover:underline">{detailPost.likes}</span>
                  </button>
                  <span className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground mr-auto">
                    <MessageCircle size={16} /> {detailPost.comments}
                  </span>
                  {user && detailPost.authorId === user.id && <button onClick={() => handleBoostPost(detailPost.id)} className="flex items-center gap-1.5 text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1.5 rounded-lg ml-auto hover:bg-amber-500/20 transition-all">
                      <Zap size={14} className="fill-amber-500" />{t("auto.ko_0090", "끌어올리기")}</button>}
                </div>
              </div>

              {/* Comments List */}
              <h3 className="text-sm font-extrabold text-foreground mb-4 truncate">{t("auto.ko_0091", "댓글")}{detailPost.comments}</h3>
              <div className="space-y-4">
                {detailPost.commentList.map(c => <div key={c.id} className="flex items-start gap-3">
                    <img src={c.photo} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" loading="lazy" />
                    <div className="flex-1 bg-muted rounded-2xl rounded-tl-sm p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-black text-foreground">{c.author}</span>
                        <span className="text-[9px] text-muted-foreground">{c.time}</span>
                      </div>
                      <p className="text-xs text-foreground leading-relaxed">{c.text}</p>
                    </div>
                  </div>)}
              </div>
            </div>

            {/* Comment Input Sticky Bottom */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border p-4 safe-bottom">
              <div className="flex items-center gap-2 max-w-md mx-auto relative">
                <input value={commentText} onChange={e => {
              setCommentText(e.target.value);
              setCommentPost(detailPost);
            }} placeholder={t("auto.ko_0092", "따뜻한댓글")} className="flex-1 bg-muted rounded-full pl-4 pr-12 py-3 text-sm text-foreground outline-none" onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSubmitComment()} />
                <button onClick={handleSubmitComment} disabled={!commentText.trim()} className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full gradient-primary flex items-center justify-center disabled:opacity-40">
                  <Send size={14} className="text-primary-foreground" />
                </button>
              </div>
            </div>
          </motion.div>}
      </AnimatePresence>

      {/* ── Plus Modal ── */}
      <AnimatePresence>
        {showPlusModal && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center px-safe pb-safe pt-safe" onClick={() => setShowPlusModal(false)}>
            <motion.div initial={{
          y: "100%"
        }} animate={{
          y: 0
        }} exit={{
          y: "100%"
        }} onClick={e => e.stopPropagation()} className="w-full bg-card rounded-3xl mb-20 sm:mb-24 px-5 pt-6 pb-8">
              <div className="text-center mb-6">
                <Crown size={40} className="text-yellow-400 mx-auto mb-3" />
                <h2 className="text-xl font-black text-foreground mb-2">Migo Plus</h2>
                <p className="text-sm text-muted-foreground truncate">{t("auto.ko_0093", "프리미엄그")}</p>
              </div>
              <button onClick={() => {
            setShowPlusModal(false);
            navigate("/profile");
          }} className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground text-sm font-black">{t("auto.ko_0094", "Plus시")}</button>
            </motion.div>
          </motion.div>}
      </AnimatePresence>



          <AnimatePresence>
        {viewProfileData && <ProfileDetailSheet profile={viewProfileData} onClose={() => setViewProfileData(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {likesPostId && <motion.div initial={{
        y: "100%"
      }} animate={{
        y: 0
      }} exit={{
        y: "100%"
      }} className="fixed inset-x-0 bottom-0 z-[70] bg-card rounded-3xl mb-4 sm:mb-8 shadow-float p-6 pb-12 max-h-[70vh] flex flex-col">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-black text-foreground truncate">{t("auto.ko_0100", "좋아요한사")}</h3>
               <button onClick={() => setLikesPostId(null)} className="p-2 bg-muted rounded-full text-foreground"><X size={16} /></button>
             </div>
             <div className="overflow-y-auto flex-1 space-y-3">
               {likesList.length === 0 ? <p className="text-center text-sm text-muted-foreground py-8 truncate">{t("auto.ko_0101", "아직좋아요")}</p> : likesList.map((usr, i) => <div key={i} className="flex items-center gap-3">
                   <img src={usr?.photo_url || "https://api.dicebear.com/9.x/notionists/svg?seed=" + i} alt="" className="w-10 h-10 rounded-full object-cover bg-muted" loading="lazy" />
                   <span className="text-sm font-bold text-foreground truncate">{usr?.name || t("auto.ko_0102", "알수없음4")}</span>
                 </div>)}
             </div>
          </motion.div>}
      </AnimatePresence>
    
      {/* ── [Feature 2] 동행 크루 지원서 모달 ── */}
      {applyGroup && <div className="fixed inset-0 z-50 flex items-end justify-center px-safe pb-safe pt-safe" onClick={() => setApplyGroup(null)}>
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 p-6 pb-12 shadow-float" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
            <div className="flex items-center gap-3 mb-4">
              {applyGroup.hostPhoto ? <img src={applyGroup.hostPhoto} alt="" className="w-12 h-12 rounded-2xl object-cover" /> : <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {applyGroup.hostName?.[0]}
                </div>}
              <div>
                <h3 className="font-extrabold text-foreground">{applyGroup.title}</h3>
                <p className="text-xs text-muted-foreground">{applyGroup.destination} · {applyGroup.dates}</p>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
              <p className="text-xs font-bold text-blue-400 truncate">{t("auto.ko_0103", "동행지원방")}</p>
              <p className="text-[11px] text-muted-foreground mt-1 truncate">{t("auto.ko_0104", "호스트가지")}</p>
            </div>
            <label className="text-xs font-bold text-foreground mb-2 block">{t("auto.ko_0105", "나를어필하")}</label>
            <textarea value={applyMessage} onChange={e => setApplyMessage(e.target.value)} maxLength={200} rows={4} placeholder={t("auto.t_0033", `간단한 자기소개와 함께 ${applyGroup?.destination || t("auto.ko_0106", "여행지")}에 가는 이유, 여행 스타일 등을 어필해보세요!`)} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:ring-2 focus:ring-primary/30 mb-1" />
            <p className="text-[10px] text-muted-foreground text-right mb-4">{applyMessage.length}/200</p>
            <div className="flex gap-3">
              <button onClick={() => setApplyGroup(null)} className="flex-1 py-3 rounded-2xl bg-muted text-muted-foreground font-semibold text-sm">{t("auto.ko_0107", "취소")}</button>
              <button onClick={handleApply} disabled={applySubmitting} className="flex-1 py-3 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-sm flex items-center justify-center gap-2" style={{
            opacity: applySubmitting ? 0.7 : 1
          }}>
                {applySubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '✈️'}{t("auto.ko_0108", "지원하기8")}</button>
            </div>
          </div>
        </div>}

      {/* ── [Feature 2] 지원자 심사 모달 (호스트용) ── */}
      {showApplicants && <div className="fixed inset-0 z-50 flex items-end justify-center px-safe pb-safe pt-safe" onClick={() => setShowApplicants(null)}>
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 p-6 pb-12 max-h-[80vh] overflow-y-auto shadow-float" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
            <h3 className="font-extrabold text-foreground mb-1 truncate">{t("auto.ko_0109", "동행지원자")}</h3>
            <p className="text-xs text-muted-foreground mb-4 truncate">{t("auto.ko_0110", "지원자프로")}</p>
            {applicantsList.length === 0 ? <div className="text-center py-10 text-muted-foreground text-sm truncate">{t("auto.ko_0111", "아직지원자")}</div> : <div className="space-y-3 truncate">
                {applicantsList.map((app: any) => <div key={app.id} className="p-4 rounded-2xl bg-muted/50 border border-border truncate">
                    <div className="flex items-start gap-3 mb-3">
                      {app.profiles?.photo_url ? <img src={app.profiles.photo_url} alt="" className="w-10 h-10 rounded-xl object-cover" /> : <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {app.profiles?.name?.[0]}
                        </div>}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">{app.profiles?.name} {app.profiles?.age && t("auto.t_0034", `(${app.profiles.age}세)`)}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{app.profiles?.bio}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${app.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400' : app.status === 'rejected' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
                        {app.status === 'approved' ? t("auto.ko_0112", "승인") : app.status === 'rejected' ? t("auto.ko_0113", "거절") : t("auto.ko_0114", "검토중")}
                      </span>
                    </div>
                    <div className="bg-card rounded-xl p-3 mb-3">
                      <p className="text-xs font-bold text-muted-foreground mb-1 truncate">{t("auto.ko_0115", "지원메시지")}</p>
                      <p className="text-sm text-foreground">{app.message}</p>
                    </div>
                    {app.status === 'pending' && <div className="flex gap-2">
                        <button onClick={() => handleRejectApplicant(app.id)} className="flex-1 py-2 rounded-xl bg-red-500/10 text-red-400 font-bold text-xs border border-red-500/20">{t("auto.ko_0116", "거절")}</button>
                        <button onClick={() => handleApproveApplicant(app.id, app.applicant_id, showApplicants)} className="flex-1 py-2 rounded-xl gradient-primary text-primary-foreground font-bold text-xs">{t("auto.ko_0117", "동행승인8")}</button>
                      </div>}
                  </div>)}
              </div>}
          </div>
        </div>
      }

      {/* ── ⚡ Lightning Match Modals ── */}
      <LightningModals
        showLightningLoading={showLightningLoading}
        lightningResult={lightningResult}
        setLightningResult={setLightningResult}
        showVipLightningFilter={showVipLightningFilter}
        setShowVipLightningFilter={setShowVipLightningFilter}
        vipFilter={vipFilter}
        setVipFilter={setVipFilter}
        executeLightningMatch={executeLightningMatch}
        lightningMultiResult={lightningMultiResult}
        setLightningMultiResult={setLightningMultiResult}
        confirmLightningMatch={confirmLightningMatch}
      />

      {/* ── 커스텀 확인 모달 (window.confirm 대체 — iOS WKWebView 차단 대응) ── */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDialog(null)} />
          <div className="relative z-10 w-full max-w-sm bg-card rounded-3xl p-6 shadow-float border border-border/50">
            <h3 className="text-base font-extrabold text-foreground mb-2 text-center">{confirmDialog.title}</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">{confirmDialog.desc}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-3 rounded-2xl border border-border text-foreground font-semibold text-sm active:scale-95 transition-transform"
              >
                {t("common.cancel", "취소")}
              </button>
              <button
                onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
                className="flex-1 py-3 rounded-2xl bg-destructive text-destructive-foreground font-extrabold text-sm active:scale-95 transition-transform"
              >
                {t("common.delete", "삭제")}
              </button>
            </div>
          </div>
        </div>
      )}



    </div>;
};
export default DiscoverPage;