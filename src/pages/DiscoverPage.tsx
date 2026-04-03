import i18n from "@/i18n";
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
import { Loader2, Beer } from "lucide-react";
import { getLocalizedPrice, inferGroupTier, GROUP_TIER_CONFIGS } from "@/lib/pricing";
import GlobalFilter from "@/components/GlobalFilter";
import { useGlobalFilter } from "@/context/GlobalFilterContext";
import { getChosung } from "@/lib/chosungUtils";
import GroupDetailFilter, { GroupDetailFilterState, DEFAULT_GROUP_DETAIL_FILTER, countGroupDetailFilters } from "@/components/GroupDetailFilter";
import { getMyCheckIn } from "@/lib/checkInService";
import PaymentModal from "@/components/PaymentModal";
import { compressImage } from "@/lib/imageCompression";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
interface Comment {
  id: string;
  author: string;
  photo: string;
  text: string;
  time: string;
  liked?: boolean;
  likes?: number;
}
interface Post {
  id: string;
  author: string;
  photo: string;
  content: string;
  time: string;
  likes: number;
  comments: number;
  liked: boolean;
  commentList: Comment[];
  imageUrl?: string;
  images?: string[];
  authorId: string;
}
interface TripGroup {
  id: string;
  title: string;
  destination: string;
  dates: string;
  currentMembers: number;
  maxMembers: number;
  tags: string[];
  hostId: string;
  hostPhoto: string;
  hostName: string;
  hostBio?: string;
  daysLeft: number;
  joined: boolean;
  description?: string;
  memberPhotos: string[];
  memberNames: string[];
  memberGenders?: ('male' | 'female' | 'unknown')[]; // 남녀 성비
  schedule?: string[];
  requirements?: string[];
  entryFee?: number;
  isPremiumGroup?: boolean;
  coverImage?: string;
  hostCompletedGroups?: number;
  distanceKm?: number;
  recentMessages?: {
    author: string;
    text: string;
    time: string;
  }[];
}
interface JoinPopupState {
  group: TripGroup;
  newCount: number;
  genders: ('male' | 'female' | 'unknown')[];
  deadlineMs: number; // 마감까지 남은 ms
}
interface CountdownAlert {
  type: '1hour' | '30min' | 'expired';
  groupTitle: string;
}
const FILTER_LIST = ["all", "recruiting", "almostFull", "hot"] as const;
const FILTER_LABELS: Record<string, string> = {
  all: "All",
  recruiting: "Recruiting",
  almostFull: "마감임박3",
  hot: "인기급상승"
};

// ──────────────────────────────────────────────
// DiscoverPage Component
// ──────────────────────────────────────────────
const DiscoverPage = () => {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    isPlus,
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

  // ── 팝업 タイマー 방어 (메모리 누수/다중실행 방지) ──
  const timersRef = useRef<{ timeouts: any[], intervals: any[] }>({ timeouts: [], intervals: [] });

  const clearAllTimers = useCallback(() => {
    timersRef.current.timeouts.forEach(clearTimeout);
    timersRef.current.intervals.forEach(clearInterval);
    timersRef.current = { timeouts: [], intervals: [] };
  }, []);

  const closeJoinPopup = useCallback(() => {
    setJoinPopup(null);
    clearAllTimers();
  }, [clearAllTimers]);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  // Group data
  const [tripGroups, setTripGroups] = useState<TripGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [detailGroup, setDetailGroup] = useState<TripGroup | null>(null);
  const [joinPopup, setJoinPopup] = useState<JoinPopupState | null>(null);
  const [countdown, setCountdown] = useState<string>(''); // "HH:MM:SS"
  const [countdownAlert, setCountdownAlert] = useState<CountdownAlert | null>(null);

  // Community data
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [detailPost, setDetailPost] = useState<Post | null>(null);

  // Write post modal
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeContent, setWriteContent] = useState("");
  const [writeTitle, setWriteTitle] = useState("");
  const [attachedImages, setAttachedImages] = useState<Array<{
    file: File;
    url: string;
  }>>([]);
  const MAX_POST_PHOTOS = 6;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Comment
  const [commentText, setCommentText] = useState("");
  const [commentPost, setCommentPost] = useState<Post | null>(null);

  // ── ⚡ Tonight Lightning Match ─────────────────────────────────
  const [showLightningLoading, setShowLightningLoading] = useState(false);
  const [lightningResult, setLightningResult] = useState<{ barName: string; members: { photo: string, name: string }[] } | null>(null);

  // 프리미엄 전용 V.I.P 상태
  const [showVipLightningFilter, setShowVipLightningFilter] = useState(false);
  const [vipFilter, setVipFilter] = useState({ age: "20s", language: "ko", vibe: "party" });
  const [lightningMultiResult, setLightningMultiResult] = useState<Array<{
    id: string; title: string; barName: string; members: { photo: string, name: string }[]; vibeIcon: string;
  }> | null>(null);

  const startLightningMatch = () => {
    if (!user) return toast({ title: i18n.t("auto.p407") });
    if (isPlus) {
      setShowVipLightningFilter(true);
    } else {
      executeLightningMatch(false);
    }
  };

  const executeLightningMatch = (isVipMode: boolean) => {
    setShowVipLightningFilter(false);
    setShowLightningLoading(true);

    setTimeout(() => {
      setShowLightningLoading(false);
      const me = { name: user.name || "나", photo: user.photoUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150" };
      
      if (isVipMode) {
        setLightningMultiResult([
          { 
            id: "v1", title: i18n.t("auto.v2_bar1_title", "🔥 미친 텐션 파티룸"), barName: checkInCity ? `${checkInCity} ${i18n.t("auto.v2_bar1_1", "클럽 라운지")}` : i18n.t("auto.v2_bar1_2", "프라이빗 라운지"), vibeIcon: "🎉",
            members: [me, { name: "Jimin", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150" }, { name: "Alex", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" }, { name: "Yuri", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" }]
          },
          { 
            id: "v2", title: i18n.t("auto.v2_bar2_title", "🍷 조용한 와인 딥톡"), barName: checkInCity ? `${checkInCity} ${i18n.t("auto.v2_bar2_1", "고급 와인바")}` : i18n.t("auto.v2_bar2_2", "시크릿 와인바"), vibeIcon: "🥂",
            members: [me, { name: "Suji", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" }, { name: "Tom", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" }]
          },
          { 
            id: "v3", title: i18n.t("auto.v2_bar3_title", "🍜 감성 로컬 맛집"), barName: checkInCity ? `${checkInCity} ${i18n.t("auto.v2_bar3_1", "현지인 맛집")}` : i18n.t("auto.v2_bar3_2", "숨겨진 이자카야"), vibeIcon: "🍣",
            members: [me, { name: "Leo", photo: "https://images.unsplash.com/photo-1552058544-e223a7261a3f?w=150" }, { name: "Mia", photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150" }, { name: "Ken", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150" }]
          }
        ]);
      } else {
        setLightningResult({
          barName: checkInCity ? `${checkInCity} ${i18n.t("auto.v2_vibe_food", "로컬 감성")}` : i18n.t("auto.v2_bar1_2", '근처 핫플 펍'),
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
      const gName = (vipSelection && !vipSelection.nativeEvent) ? vipSelection.title : `🔥 ${i18n.t("auto.v2_tonight_vip", "오늘 저녁 벙개")} (${bName})`;

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

  // Plus modal
  const [showPlusModal, setShowPlusModal] = useState(false);

  // [Feature 2] 동행 크루 지원 시스템
  const [applyGroup, setApplyGroup] = useState<TripGroup | null>(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [appliedGroups, setAppliedGroups] = useState<Set<string>>(new Set());
  const [interestedGroups, setInterestedGroups] = useState<Set<string>>(new Set());
  const [interestedSnapshot, setInterestedSnapshot] = useState<Record<string, number>>({}); // groupId → memberCount at interest time
  const [myTravelDates, setMyTravelDates] = useState<string>(''); // 내 여행 날짜

  // [Feature 1] 브라우저 푸시 알림 권한 요청
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // [Feature 1] 30초마다 관심 그룹 자리 변화 감지 → 푸시 알림
  useEffect(() => {
    if (interestedGroups.size === 0) return;
    const interval = setInterval(() => {
      tripGroups.forEach(g => {
        if (!interestedGroups.has(g.id)) return;
        const prev = interestedSnapshot[g.id];
        if (prev === undefined) return;
        const left = g.maxMembers - g.currentMembers;
        if (left === 1 && g.currentMembers > prev) {
          // 자리 줄었고 1개 남음
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Migo ✈️', {
              body: i18n.t("auto.z_tmpl_520", {
                defaultValue: t("auto.t5009", {
                  v0: g.title
                })
              }),
              icon: '/favicon.ico'
            });
          }
          toast({
            title: i18n.t("auto.z_tmpl_521", {
              defaultValue: t("auto.t5010", {
                v0: g.title
              })
            }),
            description: "지금지원하"
          });
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [interestedGroups, interestedSnapshot, tripGroups]);

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
          title: "관심취소5"
        });
      } else {
        next.add(groupId);
        // 현재 멤버 수 스냅샷 저장
        if (group) setInterestedSnapshot(s => ({
          ...s,
          [groupId]: group.currentMembers
        }));
        toast({
          title: "관심목록에",
          description: "자리가줄어"
        });
        // 브라우저 알림 권한 재확인
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }
      return next;
    });
  };
  const [showApplicants, setShowApplicants] = useState<string | null>(null);
  const [applicantsList, setApplicantsList] = useState<any[]>([]);
  const handleApply = async () => {
    if (!user || !applyGroup) return;
    if (!applyMessage.trim()) {
      toast({
        title: "지원메시지",
        variant: 'destructive'
      });
      return;
    }
    setApplySubmitting(true);
    try {
      const {
        error
      } = await supabase.from('trip_applications').insert({
        group_id: applyGroup.id,
        applicant_id: user.id,
        message: applyMessage,
        status: 'pending'
      });
      if (error) throw error;
      setAppliedGroups(prev => new Set([...prev, applyGroup.id]));
      setApplyGroup(null);
      setApplyMessage('');
      toast({
        title: "지원완료5",
        description: "호스트가프"
      });
    } catch (e: any) {
      if (e?.code === '23505') {
        toast({
          title: "이미지원하",
          variant: 'destructive'
        });
      } else {
        toast({
          title: "지원실패5",
          variant: 'destructive'
        });
      }
    } finally {
      setApplySubmitting(false);
    }
  };
  const handleViewApplicants = async (groupId: string) => {
    setShowApplicants(groupId);
    const {
      data
    } = await supabase.from('trip_applications').select('*, profiles:applicant_id(id, name, photo_url, bio, age)').eq('group_id', groupId).order('created_at', {
      ascending: false
    });
    setApplicantsList(data || []);
  };
  const handleApproveApplicant = async (appId: string, applicantId: string, groupId: string) => {
    await supabase.from('trip_applications').update({
      status: 'approved'
    }).eq('id', appId);
    await supabase.from('trip_group_members').insert({
      group_id: groupId,
      user_id: applicantId
    }).then(() => {});
    setApplicantsList(prev => prev.map(a => a.id === appId ? {
      ...a,
      status: 'approved'
    } : a));
    toast({
      title: "동행승인완",
      description: "그룹채팅이"
    });
  };
  const handleRejectApplicant = async (appId: string) => {
    await supabase.from('trip_applications').update({
      status: 'rejected'
    }).eq('id', appId);
    setApplicantsList(prev => prev.map(a => a.id === appId ? {
      ...a,
      status: 'rejected'
    } : a));
    toast({
      title: "거절완료5"
    });
  };

  // Payment modal
  const [paymentGroup, setPaymentGroup] = useState<TripGroup | null>(null);

  // Translate
  const {
    i18n
  } = useTranslation();
  const targetLangAuto = i18n.language.split('-')[0] || 'en';
  const [translateMap, setTranslateMap] = useState<Record<string, string>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const targetLang = targetLangAuto as any;
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [notifCount] = useState(0);

  // ── 스크롤 방향 감지: 아래 → 헤더 숨김, 위 → 헤더 표시 ──
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
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
    window.addEventListener("scroll", onScroll, {
      passive: true
    });
    return () => window.removeEventListener("scroll", onScroll);
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
    } = await supabase.from('profiles').select('*').eq('id', authorId).single();
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
    const {
      error
    } = await supabase.from('posts').update({
      created_at: new Date().toISOString()
    }).eq('id', postId);
    if (!error) {
      toast({
        title: t("alert.t35Title")
      });
      setPosts(prev => {
        const target = prev.find(p => p.id === postId);
        if (!target) return prev;
        return [{
          ...target,
          time: "방금전"
        }, ...prev.filter(p => p.id !== postId)];
      });
      if (detailPost?.id === postId) setDetailPost(prev => prev ? {
        ...prev,
        time: "방금전"
      } : prev);
    } else {
      toast({
        title: t("alert.t36Title")
      });
    }
  };

  // ── Handlers ──────────────────────────────────
  const handleLikePost = async (post: Post) => {
    if (!user) return toast({ title: t("alert.loginRequired") ?? "로그인이 필요합니다" });
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

  // ── Fetch posts ────────────────────────────────
  useEffect(() => {
    const fetchPosts = async () => {
      setLoadingPosts(true);
      try {
        const {
          data,
          error
        } = await supabase.from("posts").select(`
            id, content, title, image_url, image_urls, created_at, author_id,
            profiles!posts_author_id_fkey(name, photo_url),
            post_likes(count),
            comments(id, text, created_at, author_id, profiles!comments_author_id_fkey(name, photo_url))
          `).eq("hidden", false).order("created_at", {
          ascending: false
        }).limit(30);
        if (error) throw error;
        const mapped: Post[] = (data || []).map((p: any) => ({
          id: p.id,
          author: p.profiles?.name || "알수없음3",
          photo: p.profiles?.photo_url || "",
          content: p.content || "",
          time: new Date(p.created_at).toLocaleDateString("ko-KR"),
          likes: p.post_likes?.[0]?.count || 0,
          comments: p.comments?.length || 0,
          liked: false,
          commentList: (p.comments || []).map((c: any) => ({
            id: c.id,
            author: c.profiles?.name || "알수없음3",
            photo: c.profiles?.photo_url || "",
            text: c.text,
            time: new Date(c.created_at).toLocaleDateString("ko-KR")
          })),
          imageUrl: p.image_url,
          images: p.image_urls || [],
          authorId: p.author_id
        }));
        setPosts(mapped);
      } catch (err: any) {
        const msg = err?.message || "";
        // Lock steal 에러는 무시 (Supabase 내부 일시적 경쟁 현상)
        if (!msg.includes("lock") && !msg.includes("stole")) {
          console.error("fetchPosts error:", err);
        }
      } finally {
        setLoadingPosts(false);
      }
    };
    fetchPosts();
  }, []);

  // ── Fetch groups — reacts to GlobalFilter ─────
  useEffect(() => {
    const fetchGroups = async () => {
      setLoadingGroups(true);
      try {
        let query = supabase.from("trip_groups").select(`
            id, title, destination, dates, max_members, tags, description,
            entry_fee, is_premium, host_id,
            profiles!trip_groups_host_id_fkey(name, photo_url, bio, lat, lng),
            trip_group_members(user_id, profiles(name, photo_url))
          `).order("created_at", {
          ascending: false
        }).limit(50);

        // ── GlobalFilter 조건 적용 ───────────────────
        if (globalFilters.destination) {
          const dest = globalFilters.destination;
          const cho = getChosung(dest);
          query = query.or(`destination.ilike.%${dest}%,title.ilike.%${dest}%,destination_chosung.ilike.%${cho}%,title_chosung.ilike.%${cho}%`);
        }
        if (globalFilters.groupSize !== null) {
          // max_members >= 선택된 groupSize (해당 인원 이상 수용 가능)
          query = query.gte("max_members", globalFilters.groupSize);
        }
        const {
          data,
          error
        } = await query;
        if (error) throw error;
        const mapped: TripGroup[] = (data || []).map((g: any) => {
          const members = g.trip_group_members || [];
          const joined = members.some((m: any) => m.user_id === user?.id);
          return {
            id: g.id,
            title: g.title || "",
            destination: g.destination || "",
            dates: g.dates || "미정",
            currentMembers: members.length,
            maxMembers: g.max_members || 4,
            tags: g.tags || [],
            hostId: g.host_id || "",
            hostPhoto: g.profiles?.photo_url || "",
            hostName: g.profiles?.name || "알수없음3",
            hostBio: g.profiles?.bio || "",
            daysLeft: (() => {
              try {
                const dates = g.dates || '';
                const rawEnd = dates.includes('~') ? dates.split('~')[1]?.trim() : dates.split('-')[1]?.trim();
                if (!rawEnd) return 14;
                // Korean: t("auto.x4012") or t("auto.x4013")
                const kor = rawEnd.match(/(\d+)월\s*(\d+)일/);
                if (kor) {
                  const t = new Date(new Date().getFullYear(), parseInt(kor[1]) - 1, parseInt(kor[2]));
                  return Math.max(0, Math.ceil((t.getTime() - Date.now()) / 86400000));
                }
                // Slash: "4/25" or "2026/4/25"
                const parts = rawEnd.split('/');
                if (parts.length >= 2) {
                  const m = parseInt(parts[parts.length - 2]),
                    d = parseInt(parts[parts.length - 1]);
                  const t = new Date(new Date().getFullYear(), m - 1, d);
                  return Math.max(0, Math.ceil((t.getTime() - Date.now()) / 86400000));
                }
                const parsed = new Date(rawEnd.replace(/\./g, '-'));
                if (isNaN(parsed.getTime())) return 14;
                return Math.max(0, Math.ceil((parsed.getTime() - Date.now()) / 86400000));
              } catch {
                return 14;
              }
            })(),
            joined,
            description: g.description || "",
            schedule: g.schedule || [],
            memberPhotos: members.map((m: any) => m.profiles?.photo_url || "").filter(Boolean),
            memberNames: members.map((m: any) => m.profiles?.name || "알수없음3"),
            entryFee: g.entry_fee || 0,
            isPremiumGroup: g.is_premium || false,
            coverImage: "",
            // [Feature 3] 호스트 완주 횟수 (실제 테이블 없으므로 host_id 기반 가짜 값)
            hostCompletedGroups: (g.host_id?.charCodeAt(0) || 50) % 8 + 1,
            distanceKm: typeof g.profiles?.lat === 'number' && typeof g.profiles?.lng === 'number' 
              ? (distanceTo({ lat: g.profiles.lat, lng: g.profiles.lng }) ?? 99999) 
              : 99999,
            // [Feature 2] 채팅 미리보기 (실제 messages 없으므로 mock)
            recentMessages: [{
              author: g.profiles?.name?.split(' ')?.[0] || "호스트",
              text: "일정확정됐",
              time: "방금전"
            }, {
              author: "멤버",
              text: "완전기대됩",
              time: "5분전"
            }]
          };
        });
        
        // 중복 제거 및 거리순 정렬
        const uniqueKeys = new Set();
        const uniqueMapped = mapped.filter((g) => {
          const key = g.title + '|' + g.destination;
          if (uniqueKeys.has(key)) return false;
          uniqueKeys.add(key);
          return true;
        });
        uniqueMapped.sort((a, b) => (a.distanceKm || 99999) - (b.distanceKm || 99999));
        
        setTripGroups(uniqueMapped);
      } catch (err: any) {
        const msg = err?.message || "";
        // Lock steal 에러는 무시 (Supabase 내부 일시적 경쟁 현상)
        if (!msg.includes("lock") && !msg.includes("stole")) {
          console.error("fetchGroups error:", err);
        }
        // DB 오류 발생해도 시드 데이터 표시 (앱이 비어보이지 않게)
        setTripGroups([]);
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchGroups();
  }, [user, globalFilters]);

  // ── File select ────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_POST_PHOTOS - attachedImages.length;
    const toAdd = files.slice(0, remaining).map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));
    if (toAdd.length === 0) {
      toast({
        title: i18n.t("auto.z_tmpl_360", {
          defaultValue: i18n.t("auto.z_tmpl_725", {
            defaultValue: t("auto.t5011", {
              v0: MAX_POST_PHOTOS
            })
          })
        }),
        variant: "destructive"
      });
      return;
    }
    setAttachedImages(prev => [...prev, ...toAdd]);
    e.target.value = "";
  };

  // ── Share ──────────────────────────────────────
  const handleShare = async (group: TripGroup) => {
    try {
      const shareUrl = `${window.location.origin}/groups/${group.id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: t("alert.t38Title")
      });
    } catch {
      toast({
        title: t("alert.t39Title"),
        variant: "destructive"
      });
    }
  };

  // ── Submit post ────────────────────────────────
  const handleSubmitPost = async () => {
    if (!writeTitle.trim() || !writeContent.trim()) {
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
    const {
      data,
      error
    } = await supabase.from("posts").insert({
      author_id: user.id,
      title: writeTitle,
      content: writeContent,
      image_url: uploadedUrls[0] || null,
      image_urls: uploadedUrls
    }).select().single();
    if (error) {
      toast({
        title: t("alert.t42Title")
      });
      return;
    }
    const newPost: Post = {
      id: data.id,
      author: userData?.name || "나",
      photo: userData?.photo_url || "",
      content: writeContent,
      time: "방금전",
      likes: 0,
      comments: 0,
      liked: false,
      commentList: [],
      imageUrl: uploadedUrls[0],
      images: uploadedUrls,
      authorId: user.id
    };
    setPosts(prev => [newPost, ...prev]);
    setWriteContent("");
    setWriteTitle("");
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
    const newComment: Comment = {
      id: data.id,
      author: userData?.name || "나",
      photo: userData?.photo_url || "",
      text: commentText,
      time: "방금전"
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

  // ── Join group ────────────────────────────────
  const joiningRef = useRef(false);
  const handleJoin = async (group: TripGroup) => {
    if (group.joined) {
      toast({
        title: t("alert.t44Title"),
        description: t("alert.t44Desc")
      });
      return;
    }
    if (group.currentMembers >= group.maxMembers) {
      toast({
        title: t("alert.t45Title"),
        description: t("alert.t45Desc"),
        variant: "destructive"
      });
      return;
    }
    if (group.isPremiumGroup && !canJoinPremiumGroups) {
      toast({
        title: t("alert.t46Title"),
        description: t("alert.t46Desc")
      });
      setShowPlusModal(true);
      return;
    }
    
    if (joiningRef.current) return;
    joiningRef.current = true;
    try {
      setDetailGroup(null);
      await joinGroup(group);
    } finally {
      joiningRef.current = false;
    }
  };
  const joinGroup = async (group: TripGroup) => {
    if (!user) return;

    // 목업 그룹 (DB에 없음) → DB insert 없이 로컬 상태만 업데이트
    const isMock = group.id.startsWith("00000000") || group.id.startsWith("seed");
    if (!isMock) {
      const { error } = await supabase.from("trip_group_members").insert({
        group_id: group.id,
        user_id: user.id
      });
      if (error) {
        toast({ title: t("alert.t47Title") });
        return;
      }
    }

    // 로컬 상태 업데이트 (단톡방 X)
    const newCount = group.currentMembers + 1;
    // 내 성별 추가
    const { data: myProfile } = await supabase.from('profiles').select('gender').eq('id', user.id).single();
    const myGender: 'male' | 'female' | 'unknown' =
      myProfile?.gender === 'male' ? 'male' :
      myProfile?.gender === 'female' ? 'female' : 'unknown';

    // 기존 멤버 성별 추정 (이름 기반 fallback: 실제로는 DB에서 가져와야 함)
    const existingGenders: ('male' | 'female' | 'unknown')[] =
      group.memberGenders ?? Array(group.currentMembers).fill('unknown');
    const allGenders = [...existingGenders, myGender];

    setTripGroups(prev => prev.map(g => g.id === group.id ? {
      ...g,
      joined: true,
      currentMembers: newCount,
      memberGenders: allGenders
    } : g));

    // 마감 시간 계산 (daysLeft 예외 방어코드 추가. 비정상 값이면 1일로 간주)
    const validDaysLeft = typeof group.daysLeft === 'number' && !isNaN(group.daysLeft) ? group.daysLeft : 1;
    const deadlineMs = Date.now() + validDaysLeft * 24 * 60 * 60 * 1000;

    // 팝업 새로 띄울 때 기존 타이머 모두 초기화 (레이스 컨디션 차단)
    clearAllTimers();

    // 실시간 팝업 표시 (단톡방 생성 X)
    setJoinPopup({ group: { ...group, currentMembers: newCount, memberGenders: allGenders }, newCount, genders: allGenders, deadlineMs });

    // 실시간으로 인원 늘어나는 효과 (3초마다 랜덤하게 1명 추가 시뮬레이션, 최대 2회)
    let extras = 0;
    const intervalId = setInterval(() => {
      if (extras >= 2 || newCount + extras >= group.maxMembers - 1) {
        clearInterval(intervalId);
        return;
      }
      extras++;
      const randGender: 'male' | 'female' = Math.random() > 0.5 ? 'male' : 'female';
      setJoinPopup(prev => {
        if (!prev) return null;
        const updatedGenders = [...prev.genders, randGender];
        const updatedCount = prev.newCount + 1;
        setTripGroups(pg => pg.map(g => g.id === group.id ? {
          ...g,
          currentMembers: updatedCount,
          memberGenders: updatedGenders
        } : g));
        return { ...prev, newCount: updatedCount, genders: updatedGenders };
      });
    }, 3500);
    timersRef.current.intervals.push(intervalId);

    // ─── 1시간 전 알림 ───────────────────────────────────
    const msTo1h = deadlineMs - Date.now() - 60 * 60 * 1000;
    if (msTo1h > 0) {
      const t1 = setTimeout(() => {
        setCountdownAlert({ type: '1hour', groupTitle: group.title });
        timersRef.current.timeouts.push(setTimeout(() => setCountdownAlert(null), 8000));
      }, msTo1h);
      timersRef.current.timeouts.push(t1);
    }

    // ─── 30분 전 알림 ────────────────────────────────────
    const msTo30min = deadlineMs - Date.now() - 30 * 60 * 1000;
    if (msTo30min > 0) {
      const t2 = setTimeout(() => {
        setCountdownAlert({ type: '30min', groupTitle: group.title });
        timersRef.current.timeouts.push(setTimeout(() => setCountdownAlert(null), 8000));
      }, msTo30min);
      timersRef.current.timeouts.push(t2);
    }

    // ─── 마감 알림 ────────────────────────────────────────
    const msToExpiry = deadlineMs - Date.now();
    if (msToExpiry > 0) {
      const t3 = setTimeout(() => {
        clearInterval(intervalId);
        setJoinPopup(null);
        setCountdownAlert({ type: 'expired', groupTitle: group.title });
        timersRef.current.timeouts.push(setTimeout(() => setCountdownAlert(null), 10000));
      }, msToExpiry);
      timersRef.current.timeouts.push(t3);
    }

    // 팝업 인원 애니메이션 종료 방어막
    const tClose = setTimeout(() => clearInterval(intervalId), 15000);
    timersRef.current.timeouts.push(tClose);
  };

  // ── 삭제 ──────────────────────────────────────
  const deletePost = async (postId: string) => {
    if (!user) return;
    if (!window.confirm(t("alert.c53Confirm"))) return;
    const {
      error
    } = await supabase.from("posts").delete().eq("id", postId).eq("author_id", user.id);
    if (error) {
      toast({
        title: t("alert.t49Title")
      });
      return;
    }
    setPosts(prev => prev.filter(p => p.id !== postId));
    if (detailPost?.id === postId) setDetailPost(null);
    toast({
      title: t("alert.t50Title")
    });
  };
  const deleteGroup = async (groupId: string) => {
    if (!user) return;
    if (!window.confirm(t("alert.c54Confirm"))) return;
    const {
      error
    } = await supabase.from("trip_groups").delete().eq("id", groupId).eq("host_id", user.id);
    if (error) {
      toast({
        title: t("alert.t51Title")
      });
      return;
    }
    setTripGroups(prev => prev.filter(g => g.id !== groupId));
    if (detailGroup?.id === groupId) setDetailGroup(null);
    toast({
      title: t("alert.t52Title")
    });
  };

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
  // ── Activity keyword mapping for tag-based filtering ──────────
  const ACTIVITY_KEYWORDS: Record<string, string[]> = {
    "투어": ["투어", "tour", "관광", "명소", "사원", "문화"],
    "맛집": ["맛집", "음식", "food", "레스토랑", "restaurant", "미식", "먹방"],
    "카페": ["카페", "cafe", "coffee", "커피", "브런치", "디저트"],
    "클럽": ["클럽", "club", "나이트", "night", "파티", "bar", "바"]
  };
  const VIBE_KEYWORDS: Record<string, string[]> = {
    "편한": ["편한", "캐주얼", "자유", "힐링", "relaxed"],
    "파티": ["파티", "party", "클럽", "신나", "fun", "신남"],
    "진지": ["진지", "목적", "계획", "배움", "스터디", "serious"]
  };
  const filtered = tripGroups.filter(g => {
    const matchesFilter = activeFilter === "all" ? true : activeFilter === "recruiting" ? g.currentMembers < g.maxMembers : activeFilter === "almostFull" ? g.daysLeft <= 3 : activeFilter === "hot" ? g.daysLeft <= 5 && g.currentMembers < g.maxMembers : true;
    const q = searchQuery.toLowerCase();
    const choQ = getChosung(q);
    const matchesSearch = q === "" || g.title.toLowerCase().includes(q) || g.destination.toLowerCase().includes(q) || g.tags.some(tag => tag.toLowerCase().includes(q)) || getChosung(g.title).includes(choQ) || getChosung(g.destination).includes(choQ) || g.tags.some(tag => getChosung(tag).includes(choQ));
    // 거리 필터
    let matchesDistance = true;
    if (distanceFilter !== null && myPos) {
      const coords = getDestCoords(g.destination);
      if (coords) {
        const dist = distanceTo(coords) ?? null;
        matchesDistance = dist === null || dist <= distanceFilter;
      }
    }

    // ── Group detail filters ──────────────────────────────────
    // 체크인 도시 필터
    let matchesCheckIn = true;
    if (groupDetailFilter.checkInOnly && checkInCity) {
      matchesCheckIn = g.destination.toLowerCase().includes(checkInCity.toLowerCase());
    }

    // 활동 종류 필터 (tags 기반 키워드 매칭)
    let matchesActivity = true;
    if (groupDetailFilter.activity) {
      const keywords = ACTIVITY_KEYWORDS[groupDetailFilter.activity] || [];
      const allText = [...g.tags, g.title, g.description || ""].join(" ").toLowerCase();
      matchesActivity = keywords.some(kw => allText.includes(kw));
    }

    // 분위기 필터 (tags + title 키워드 매칭)
    let matchesVibe = true;
    if (groupDetailFilter.vibe !== "any") {
      const keywords = VIBE_KEYWORDS[groupDetailFilter.vibe] || [];
      const allText = [...g.tags, g.title, g.description || ""].join(" ").toLowerCase();
      matchesVibe = keywords.some(kw => allText.includes(kw));
      // 키워드가 없으면 vibe 필터는 통과 (태그 없는 그룹 배제 방지)
      if (!matchesVibe && g.tags.length === 0) matchesVibe = true;
    }

    // 언어 / 국적 필터 (호스트 이름 + 태그 기반 간단 추정)
    let matchesLanguage = true;
    if (groupDetailFilter.language !== "any") {
      const koreanPattern = /[가-힣]/;
      const hostIsKorean = koreanPattern.test(g.hostName);
      const tagsHaveKorean = g.tags.some(t => koreanPattern.test(t));
      const isKorean = hostIsKorean || tagsHaveKorean;
      if (groupDetailFilter.language === "korean") matchesLanguage = isKorean;else if (groupDetailFilter.language === "foreign") matchesLanguage = !isKorean;else if (groupDetailFilter.language === "mixed") matchesLanguage = true; // 혼합은 전체 통과
    }

    // 성비 필터 (태그/제목 기반 키워드 — 실제 데이터 없으므로 best-effort)
    let matchesGender = true;
    if (groupDetailFilter.genderRatio !== "any") {
      const allText = [...g.tags, g.title].join(" ").toLowerCase();
      const gMap: Record<string, string[]> = {
        "all-male": ["남성만", "남자만", "all-male", "남성"],
        "all-female": ["여성만", "여자만", "all-female", "여성"],
        "2남2여": ["2남2여", "혼성", "남녀"],
        "3남1여": ["3남1여"],
        "1남3여": ["1남3여"]
      };
      const kws = gMap[groupDetailFilter.genderRatio] || [];
      // 매칭 안 되면 통과 (필드 없는 그룹 제외 방지)
      const hasKeyword = kws.some(kw => allText.includes(kw));
      matchesGender = kws.length === 0 || hasKeyword || true; // 데이터 부족으로 통과 처리
    }
    return matchesFilter && matchesSearch && matchesDistance && matchesCheckIn && matchesActivity && matchesVibe && matchesLanguage && matchesGender;
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

  return <div className="min-h-screen bg-background pb-24">
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
              className="fixed bottom-24 left-4 right-4 z-50 max-w-sm mx-auto"
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
                      <p className="text-primary-foreground font-extrabold text-sm">{t("alert.t48Title")}</p>
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
                      <span className="text-sm font-bold text-foreground">{t('groupPopup.currentMembers')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <motion.span
                        key={joinPopup.newCount}
                        initial={{ scale: 1.4, color: "#22c55e" }}
                        animate={{ scale: 1, color: "var(--foreground)" }}
                        className="text-lg font-extrabold text-foreground"
                      >{joinPopup.newCount}</motion.span>
                      <span className="text-sm text-muted-foreground">/ {group.maxMembers}명</span>
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
                      <span className="text-xs font-bold text-muted-foreground">{t('groupPopup.ratioPrefix')}</span>
                      <div className="flex items-center gap-3 text-xs font-bold">
                        <span className="text-blue-500">{t('groupPopup.maleCount', { count: ratio.maleCount })}</span>
                        <span className="text-pink-500">{t('groupPopup.femaleCount', { count: ratio.femaleCount })}</span>
                        {joinPopup.genders.filter(g => g === 'unknown').length > 0 &&
                          <span className="text-muted-foreground">{t('groupPopup.unknownCount', { count: joinPopup.genders.filter(g => g === 'unknown').length })}</span>}
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
                      <span>{t('groupPopup.malePct', { pct: ratio.male })}</span>
                      <span>{t('groupPopup.femalePct', { pct: ratio.female })}</span>
                    </div>
                  </div>

                  {/* 실시간 상태 */}
                  <motion.div
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-3 py-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
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
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30 px-5 pt-12 pb-0 transition-transform duration-300" style={{
      transform: headerVisible ? "translateY(0)" : "translateY(-100%)"
    }}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black text-foreground">{"여행탐색3"}</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/notifications")} className="relative w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Bell size={18} className="text-foreground" />
              {notifCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full gradient-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
                  {notifCount}
                </span>}
            </button>
            {/* Global filter button */}
            <button onClick={() => setShowGlobalFilter(true)} className="relative w-10 h-10 rounded-xl bg-muted flex items-center justify-center transition-all active:scale-90">
              <SlidersHorizontal size={18} className={globalFilterCount > 0 ? "text-primary" : "text-foreground"} />
              {globalFilterCount > 0 && <motion.span initial={{
              scale: 0
            }} animate={{
              scale: 1
            }} className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full gradient-primary flex items-center justify-center text-[9px] font-extrabold text-white shadow-sm">
                  {globalFilterCount}
                </motion.span>}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3 mb-4">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={"목적지여행"} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
          {searchQuery && <button onClick={() => setSearchQuery("")}>
              <X size={14} className="text-muted-foreground" />
            </button>}
        </div>

        {/* Tabs */}
        <div className="flex bg-muted rounded-2xl p-1 gap-1">
          {[{
          key: "groups" as const,
          label: t('discover.groups'),
          icon: Compass
        }, {
          key: "community" as const,
          label: t('discover.community'),
          icon: Users
        }].map(({
          key,
          label,
          icon: Icon
        }) => <button key={key} onClick={() => setActiveTab(key)} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === key ? "bg-card text-foreground shadow-card" : "text-muted-foreground"}`}>
              <Icon size={14} />
              {label}
              {key === "community" && notifCount > 0 && <span className="w-4 h-4 rounded-full gradient-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
                  {notifCount}
                </span>}
            </button>)}
        </div>

        {/* Write / Pencil button */}
        <div className="flex items-center justify-between py-3">
          <span className="text-xs text-muted-foreground font-medium">
            {activeTab === "groups" ? t("auto.z_tmpl_367", {
            defaultValue: t("auto.z_tmpl_732", {
              defaultValue: t("auto.t5012", {
                v0: filtered.length
              })
            })
          }) : t("auto.z_tmpl_368", {
            defaultValue: t("auto.z_tmpl_733", {
              defaultValue: t("auto.t5013", {
                v0: posts.length
              })
            })
          })}
          </span>
          {user && <button onClick={() => activeTab === "groups" ? navigate("/create-trip") : setShowWriteModal(true)} className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-card" title={activeTab === "groups" ? "여행그룹만" : "게시글쓰기"}>
              {activeTab === "groups" ? <Plus size={18} className="text-primary-foreground" /> : <Pencil size={18} className="text-primary-foreground" />}
            </button>}
        </div>
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
                  🌍 {globalFilters.destination === "tokyo" ? "도쿄" : globalFilters.destination === "seoul" ? "서울" : "방콕"}
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
                  📅 {globalFilters.dateRange.start ? `${parseInt(globalFilters.dateRange.start.split("-")[1])}월 ${parseInt(globalFilters.dateRange.start.split("-")[2])}일` : ""}{globalFilters.dateRange.end ? ` ~ ${parseInt(globalFilters.dateRange.end.split("-")[1])}월 ${parseInt(globalFilters.dateRange.end.split("-")[2])}일` : ""}
                  <X size={10} strokeWidth={3} />
                </motion.button>}
              {globalFilters.groupSize !== null && <motion.button initial={{
            scale: 0.8,
            opacity: 0
          }} animate={{
            scale: 1,
            opacity: 1
          }} onClick={() => clearGlobalGroup(null)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-xs font-semibold text-purple-600 whitespace-nowrap shrink-0">
                  👥 {globalFilters.groupSize === 6 ? "6명 이상" : `${globalFilters.groupSize}명`}
                  <X size={10} strokeWidth={3} />
                </motion.button>}
            </div>
          </motion.div>}
      </AnimatePresence>

      {/* Filters (Groups only) */}
      {activeTab === "groups" && <div className="flex gap-2 px-5 py-3 overflow-x-auto scrollbar-hide">
          {FILTER_LIST.map(f => <button key={f} onClick={() => setActiveFilter(f)} className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeFilter === f ? "gradient-primary text-primary-foreground shadow-card" : "bg-muted text-muted-foreground"}`}>
              {t(`discover.${f}`)}
            </button>)}
          {/* 세부 필터 버튼 */}
          <button onClick={() => setShowGroupDetailFilter(true)} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${groupDetailFilterCount > 0 ? "bg-primary/15 border-primary/40 text-primary" : "bg-muted border-transparent text-muted-foreground"}`}>
            <SlidersHorizontal size={11} />{i18n.t("auto.z_\uC138\uBD80\uD544\uD130_f50ba2")}{groupDetailFilterCount > 0 && <span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] font-extrabold flex items-center justify-center ml-0.5">
                {groupDetailFilterCount}
              </span>}
          </button>
        </div>}

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
              {groupDetailFilter.checkInOnly && checkInCity && <motion.button initial={{
            scale: 0.8
          }} animate={{
            scale: 1
          }} onClick={() => setGroupDetailFilter(p => ({
            ...p,
            checkInOnly: false
          }))} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-600 shrink-0">
                  📍 {checkInCity} <X size={10} strokeWidth={3} />
                </motion.button>}
              {groupDetailFilter.activity && <motion.button initial={{
            scale: 0.8
          }} animate={{
            scale: 1
          }} onClick={() => setGroupDetailFilter(p => ({
            ...p,
            activity: null
          }))} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-xs font-semibold text-orange-600 shrink-0">
                  {groupDetailFilter.activity === "투어" ? "🗺️" : groupDetailFilter.activity === "맛집" ? "🍜" : groupDetailFilter.activity === "카페" ? "☕" : "🎶"} {groupDetailFilter.activity} <X size={10} strokeWidth={3} />
                </motion.button>}
              {groupDetailFilter.language !== "any" && <motion.button initial={{
            scale: 0.8
          }} animate={{
            scale: 1
          }} onClick={() => setGroupDetailFilter(p => ({
            ...p,
            language: "any"
          }))} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-xs font-semibold text-blue-600 shrink-0">
                  🌐 {groupDetailFilter.language === "korean" ? "한국인" : groupDetailFilter.language === "foreign" ? "외국인" : "혼합"} <X size={10} strokeWidth={3} />
                </motion.button>}
              {groupDetailFilter.vibe !== "any" && <motion.button initial={{
            scale: 0.8
          }} animate={{
            scale: 1
          }} onClick={() => setGroupDetailFilter(p => ({
            ...p,
            vibe: "any"
          }))} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-xs font-semibold text-violet-600 shrink-0">
                  {groupDetailFilter.vibe === "편한" ? "😊" : groupDetailFilter.vibe === "파티" ? "🎉" : "🎯"} {groupDetailFilter.vibe} <X size={10} strokeWidth={3} />
                </motion.button>}
              {groupDetailFilter.genderRatio !== "any" && <motion.button initial={{
            scale: 0.8
          }} animate={{
            scale: 1
          }} onClick={() => setGroupDetailFilter(p => ({
            ...p,
            genderRatio: "any"
          }))} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-xs font-semibold text-pink-600 shrink-0">
                  👥 {groupDetailFilter.genderRatio === "all-male" ? "남성만" : groupDetailFilter.genderRatio === "all-female" ? "여성만" : groupDetailFilter.genderRatio} <X size={10} strokeWidth={3} />
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

      {/* ── Groups Tab ── */}
      {activeTab === "groups" && <div className="px-5 space-y-3 pb-24">
          {/* ⚡ 오늘 저녁 번개 CTA */}
          <motion.button 
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/trip-match', { state: { initialMode: 'instant' } })}
            className="w-full relative overflow-hidden rounded-2xl p-4 text-left shadow-lg border border-amber-500/30"
            style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)" }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-3xl rounded-full pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
              <div className="text-left text-white">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold tracking-tight text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>{i18n.t("auto.v2_tonight_vip", "🔥 오늘 저녁 술 모임 자동 매칭")}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white text-orange-600">HOT</span>
                </div>
                <p className="text-[11px] font-medium text-white/90">{i18n.t("auto.v2_tonight_desc", "버튼 한 번으로 근처 3~4명 랜덤 펍 번개")}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-lg shrink-0">
                <Beer size={16} className="text-orange-500" fill="currentColor" />
              </div>
            </div>
          </motion.button>
          {/* 스마트 매칭 진입 배너 */}
          <motion.button initial={{
        opacity: 0,
        y: 8
      }} animate={{
        opacity: 1,
        y: 0
      }} onClick={() => navigate("/trip-match")} className="w-full relative overflow-hidden rounded-2xl p-4 text-left" style={{
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)"
      }}>
            <motion.div className="absolute inset-0 bg-white/10" animate={{
          x: ["-100%", "100%"]
        }} transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear"
        }} style={{
          skewX: -20
        }} />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-extrabold text-sm">{i18n.t("auto.z_\uC2A4\uB9C8\uD2B8\uADF8_e879f7")}</span>
                  <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">NEW</span>
                </div>
                <p className="text-white/80 text-[11px]">{i18n.t("auto.z_\uC131\uBE44\uD6C4\uAE30_669abf")}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] bg-white/15 text-white rounded-full px-2 py-0.5">{i18n.t("auto.z_\uC778\uC99D\uC720\uC800_a303f4")}</span>
                  <span className="text-[10px] bg-white/15 text-white rounded-full px-2 py-0.5">{i18n.t("auto.z_\uC131\uBE44\uC870\uC808_5a1e1d")}</span>
                  <span className="text-[10px] bg-white/15 text-white rounded-full px-2 py-0.5">{i18n.t("auto.z_\uC5EC\uC131\uBB34\uB8CC_8c89f9")}</span>
                </div>
              </div>
              <div className="text-2xl">→</div>
            </div>
          </motion.button>

          {loadingGroups ? <div className="flex items-center justify-center py-16">
              <motion.div className="w-8 h-8 rounded-full gradient-primary" animate={{
          scale: [1, 1.2, 1]
        }} transition={{
          repeat: Infinity,
          duration: 1
        }} />
            </div> : filtered.length === 0 ? <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Compass size={24} className="text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">{"검색결과가"}</p>
            </div> : filtered.map(group => <motion.div key={group.id} initial={{
        opacity: 0,
        y: 12
      }} animate={{
        opacity: 1,
        y: 0
      }} className="bg-card rounded-2xl shadow-card cursor-pointer overflow-hidden" onClick={() => setDetailGroup(group)}>
              {/* Cover image */}
              {group.coverImage && <div className="relative w-full h-28 overflow-hidden">
                  <img src={group.coverImage} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                  <div className="absolute bottom-2 left-3 right-3">
                    <h3 className="text-sm font-extrabold text-white truncate">{group.title}</h3>
                    <p className="text-[10px] text-white/70">{group.destination}</p>
                  </div>
                </div>}
              <div className="p-4">
              {/* 활성도 배지 행 (🔥인기, ⚡마감, 👁️보는중) */}
              {(() => {
            const fillRatio = group.currentMembers / Math.max(group.maxMembers, 1);
            const viewers = Math.floor(Math.random() * 8) + 2; // 2~9명 실시간 시뮬레이션
            return <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    {fillRatio >= 0.75 && <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white" style={{
                background: 'linear-gradient(90deg, #f59e0b, #ef4444)'
              }}>{"인기"}</span>}
                    {group.daysLeft <= 3 && <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                        ⚡ D-{group.daysLeft}{"마감임박7"}</span>}
                    {group.isPremiumGroup && <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-400 border border-amber-500/20">{"검증된호스"}</span>}
                    {/* [Feature 4] 내 여행 날짜 매칭 배지 */}
                    {myTravelDates && isDateMatch(group.dates) && <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border animate-pulse" style={{
                background: 'rgba(99,102,241,0.15)',
                borderColor: 'rgba(99,102,241,0.4)',
                color: '#818cf8'
              }}>{"내일정과딱"}</span>}
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      👁 {viewers}{"명보는중7"}</span>
                  </div>;
          })()}
              {/* Group card header */}
              <div className="flex items-start gap-3 mb-3">
                {group.hostPhoto ? <img src={group.hostPhoto} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" loading="lazy" onError={e => {
              (e.target as HTMLImageElement).style.display = "none";
            }} /> : <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 text-primary font-bold text-sm">{group.hostName?.[0] || "M"}</div>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-extrabold text-foreground truncate">{group.title}</h3>
                    {group.isPremiumGroup && <Crown size={12} className="text-yellow-400 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground">{group.hostName}</p>
                    <span className="text-[9px] text-emerald-400 font-semibold">{"1시간내답"}</span>
                    {/* [Feature 3] 호스트 완주 횟수 배지 */}
                    {(group as any).hostCompletedGroups > 0 && <span className="text-[9px] font-extrabold text-amber-400">🏆 {(group as any).hostCompletedGroups}{"번완주"}</span>}
                  </div>
                </div>
                {/* 남은 자리 뱃지 */}
                {(() => {
              const left = group.maxMembers - group.currentMembers;
              if (left <= 0) return <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-gray-500/15 text-gray-400 shrink-0">{"마감"}</span>;
              if (left === 1) return <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 shrink-0 animate-pulse">{"1자리남음"}</span>;
              if (left <= 2) return <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20 shrink-0">{left}{"자리남음7"}</span>;
              return null;
            })()}
                
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin size={10} /> {group.destination}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Calendar size={10} /> {group.dates}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Users size={10} /> {group.currentMembers}/{group.maxMembers}{"명"}</span>
                <span className="flex items-center gap-1 text-[11px] text-orange-500">
                  <Clock size={10} /> D-{group.daysLeft}
                </span>
                {/* 🔑 거리 배지 (destLat/destLng가 있을 때) */}
                {(() => {
              const g = group as any;
              if (!g.destLat || !g.destLng) return null;
              const km = distanceTo({
                lat: g.destLat,
                lng: g.destLng
              });
              if (km === null) return null;
              const col = distanceColor(km);
              return <span className="flex items-center gap-1 text-[11px] font-bold rounded-full px-1.5 py-0.5" style={{
                color: col,
                background: `${col}18`
              }}>
                      📍 {distanceLabel(km)} · {travelTimeLabel(km)}
                    </span>;
            })()}
              </div>

              {/* Tags + Price tier badge */}
              <div className="flex flex-wrap gap-1 mb-3 items-center">
                {group.tags.map(tag => <span key={tag} className="text-[10px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">#{tag}</span>)}
                {/* Tier badge */}
                {(() => {
              const tier = inferGroupTier(group.tags, group.title, group.isPremiumGroup);
              const cfg = GROUP_TIER_CONFIGS.find(c => c.tier === tier)!;
              const tierColors = {
                travel: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
                party: "bg-pink-500/15 text-pink-600 border-pink-500/30",
                premium: "bg-amber-500/15 text-amber-600 border-amber-500/30"
              };
              return <span className={`ml-auto flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${tierColors[tier]}`}>
                      {cfg.emoji} {getLocalizedPrice(cfg.krw, i18n.language)}
                    </span>;
            })()}
              </div>

              {/* [Feature 2] 그룹 채팅 미리보기 */}
              {(group as any).recentMessages && (group as any).recentMessages.length > 0 && <div className="mb-3 rounded-xl p-2.5" style={{
            background: 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.15)'
          }}>
                  <p className="text-[9px] font-bold text-muted-foreground mb-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />{"그룹채팅미"}</p>
                  {(group as any).recentMessages.slice(0, 2).map((msg: any, i: number) => <div key={i} className="flex items-start gap-1.5 mb-1">
                      <span className="text-[9px] font-bold shrink-0" style={{
                color: i === 0 ? '#818cf8' : '#34d399'
              }}>{msg.author}</span>
                      <span className="text-[9px] text-foreground/80 flex-1 leading-tight">{msg.text}</span>
                      <span className="text-[9px] text-muted-foreground shrink-0">{msg.time}</span>
                    </div>)}
                </div>}
              {/* 충원율 프로그레스 바 */}
              {(() => {
            const fill = group.currentMembers / Math.max(group.maxMembers, 1);
            const recentActions = ["방금누군가", "1분전새멤", "3분전호스", "7분전지원"];
            const randomAction = recentActions[group.id.charCodeAt(7) % recentActions.length];
            return <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground">{randomAction}</span>
                      <span className="text-[10px] font-bold" style={{
                  color: fill >= 0.75 ? '#f59e0b' : fill >= 0.5 ? '#6366f1' : '#10b981'
                }}>
                        {Math.round(fill * 100)}{"충원"}</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{
                  width: `${fill * 100}%`,
                  background: fill >= 0.75 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : fill >= 0.5 ? 'linear-gradient(90deg, #6366f1, #8b5cf6)' : 'linear-gradient(90deg, #10b981, #34d399)'
                }} />
                    </div>
                  </div>;
          })()}
              {/* Member photos + Join/Delete button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {group.memberPhotos.slice(0, 4).map((photo, idx) => <img key={idx} src={photo} alt="" className="w-7 h-7 rounded-full border-2 border-card object-cover" loading="lazy" />)}
                  </div>
                  {user && group.hostId === user.id && <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">{"내가만든그"}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {user && group.hostId === user.id ?
              // 내가 만든 그룹: 삭제 버튼만
              <button onClick={e => {
                e.stopPropagation();
                deleteGroup(group.id);
              }} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 transition-all hover:bg-red-500/20">{"삭제"}</button> :
              // 다른 사람 그룹: 지원하기 버튼 (크루 지원 시스템)
              <div className="flex flex-col gap-1.5">
              {user && group.hostId !== user.id && <>
                  {appliedGroups.has(group.id) ? <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-center">{"지원완료7"}</span> : <button onClick={e => {
                    e.stopPropagation();
                    if (!user) {
                      toast({
                        title: "로그인이필",
                        variant: 'destructive'
                      });
                      return;
                    }
                    // Show payment modal instead of direct apply
                    setPaymentGroup(group);
                  }} className="text-xs font-bold px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground shadow-card">{"동행지원하"}</button>}
                  <button onClick={e => handleInterest(group.id, e)} className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition-all ${interestedGroups.has(group.id) ? 'bg-amber-400/15 text-amber-400 border-amber-400/30' : 'bg-muted text-muted-foreground border-border hover:border-amber-400/30 hover:text-amber-400'}`}>
                    {interestedGroups.has(group.id) ? "관심중" : "관심있어요"}
                  </button>
                </>}
              {user && group.hostId === user.id && <button onClick={e => {
                  e.stopPropagation();
                  handleViewApplicants(group.id);
                }} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">{"지원자보기"}</button>}
            </div>}
                </div>
              </div>
              </div>
            </motion.div>)}
        </div>}

      {/* ── Community Tab ── */}
      {activeTab === "community" && <div className="px-5 space-y-3 pt-3 pb-24">
          <div className="flex gap-4 border-b border-border/50 pb-2 mb-4">
            <button onClick={() => setActiveCommunityFilter("latest")} className={`font-bold pb-2 border-b-2 px-1 transition-all ${activeCommunityFilter === "latest" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>{"최신글"}</button>
            <button onClick={() => setActiveCommunityFilter("popular")} className={`font-bold pb-2 border-b-2 px-1 transition-all ${activeCommunityFilter === "popular" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>{"인기글"}</button>
          </div>
          {loadingPosts ? <div className="flex items-center justify-center py-16">
              <motion.div className="w-8 h-8 rounded-full gradient-primary" animate={{
          scale: [1, 1.2, 1]
        }} transition={{
          repeat: Infinity,
          duration: 1
        }} />
            </div> : sortedPosts.length === 0 ? <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={24} className="text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">{"첫게시글을"}</p>
            </div> : sortedPosts.map((post: any) => <motion.div key={post.id} initial={{
        opacity: 0,
        y: 12
      }} animate={{
        opacity: 1,
        y: 0
      }} className="bg-card rounded-2xl p-4 shadow-card cursor-pointer" onClick={() => setDetailPost(post)}>
              <div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={e => handleProfileClick(e, post.authorId)}>
                <img src={post.photo} alt="" className="w-9 h-9 rounded-full object-cover" loading="lazy" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground hover:underline">{post.author}</p>
                  <p className="text-[11px] text-muted-foreground">{post.time}</p>
                </div>
                {user && post.authorId === user.id && <button onClick={e => {
            e.stopPropagation();
            deletePost(post.id);
          }} className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors shrink-0" title={"게시글삭제"}>
                    <Trash2 size={14} className="text-red-500" />
                  </button>}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-3 line-clamp-3">{post.content}</p>

              {/* Images */}
              {post.images && post.images.length > 0 ? post.images.length === 1 ? <img src={post.images[0]} className="w-full h-52 rounded-xl object-cover mb-3 bg-black/5" onError={e => e.currentTarget.style.display = 'none'} /> : <div className={`grid gap-1 mb-3 ${post.images.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                    {post.images.slice(0, 6).map((img, idx) => <div key={idx} className="relative">
                        <img src={img} className="w-full h-28 rounded-xl object-cover bg-black/5" onError={e => e.currentTarget.style.display = 'none'} />
                        {idx === 5 && post.images && post.images.length > 6 && <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center text-white text-sm font-bold pointer-events-none">
                            +{post.images.length - 6}
                          </div>}
                      </div>)}
                  </div> : post.imageUrl ? <img src={post.imageUrl} className="w-full h-52 rounded-xl object-cover mb-3 bg-black/5" onError={e => e.currentTarget.style.display = 'none'} /> : null}

              <div className="flex items-center gap-4">
                <button onClick={e => {
            e.stopPropagation(); /* like */
          }} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ThumbsUp size={13} />
                  {post.likes}
                </button>
                <button onClick={e => {
            e.stopPropagation();
            setCommentPost(post);
          }} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MessageCircle size={13} />
                  {post.comments}
                </button>
              </div>
            </motion.div>)}
        </div>}

      {/* ── Group Detail Modal ── */}
      <AnimatePresence>
        {currentDetail && <motion.div initial={{
        y: "100%"
      }} animate={{
        y: 0
      }} exit={{
        y: "100%"
      }} className="fixed inset-0 z-50 bg-background overflow-y-auto">
            <div className="px-5 pt-12 pb-32">
              {/* Back */}
              <button onClick={() => setDetailGroup(null)} className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <ArrowLeft size={16} />{"목록으로3"}</button>

              {/* Host */}
              <div className="bg-card rounded-2xl p-4 shadow-card mb-4">
                <div className="flex items-center gap-3 mb-3">
                  {currentDetail.hostPhoto ? <img src={currentDetail.hostPhoto} alt="" className="w-12 h-12 rounded-xl object-cover" loading="lazy" onError={e => {
                (e.target as HTMLImageElement).style.display = "none";
              }} /> : <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">{currentDetail.hostName?.[0] || "M"}</div>}
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-extrabold text-foreground break-words whitespace-pre-wrap">{translateMap[`groupTitle_${currentDetail.id}`] || currentDetail.title}</p>
                    <p className="text-xs text-muted-foreground">{currentDetail.hostName}</p>
                  </div>
                  <button onClick={() => handleShare(currentDetail)} className="ml-auto w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Share2 size={14} className="text-foreground" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed break-words whitespace-pre-wrap">{translateMap[`groupDesc_${currentDetail.id}`] || currentDetail.description}</p>
                
                {/* Translate Toggle */}
                {currentDetail.description && (
                  <div className="mt-3 pt-3 border-t border-border/40">
                    <button 
                      onClick={() => {
                        handleTranslate(currentDetail.title, `groupTitle_${currentDetail.id}`);
                        handleTranslate(currentDetail.description || "", `groupDesc_${currentDetail.id}`);
                        handleTranslate(currentDetail.destination || "", `groupDest_${currentDetail.id}`);
                      }} 
                      className={`text-[11px] font-bold flex items-center gap-1.5 transition-colors px-2 py-1 -ml-2 rounded-lg ${
                        translateMap[`groupDesc_${currentDetail.id}`] 
                          ? "text-primary bg-primary/10" 
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Languages size={12} className={loadingMap[`groupDesc_${currentDetail.id}`] ? "animate-pulse" : ""} />
                      {loadingMap[`groupDesc_${currentDetail.id}`] 
                        ? i18n.t("auto.z_번역중_000", { defaultValue: "번역 중..." }) 
                        : translateMap[`groupDesc_${currentDetail.id}`] 
                          ? i18n.t("auto.z_원문보기_001", { defaultValue: "원문 보기" }) 
                          : i18n.t("auto.z_번역보기_002", { defaultValue: "번역 보기" })
                      }
                    </button>
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="bg-card rounded-2xl p-4 shadow-card mb-4">
                <div className="grid grid-cols-2 gap-3">
                  {[{
                label: "목적지",
                value: translateMap[`groupDest_${currentDetail.id}`] || currentDetail.destination,
                icon: MapPin
              }, {
                label: "날짜",
                value: currentDetail.dates,
                icon: Calendar
              }, {
                label: "인원",
                value: t("auto.z_tmpl_386", {
                  defaultValue: t("auto.z_tmpl_770", {
                    defaultValue: t("auto.t5014", {
                      v0: currentDetail.currentMembers,
                      v1: currentDetail.maxMembers
                    })
                  })
                }),
                icon: Users
              }, {
                label: "마감",
                value: `D-${currentDetail.daysLeft}`,
                icon: Clock
              }].map(({
                label,
                value,
                icon: Icon
              }) => <div key={label} className="flex items-center gap-2">
                      <Icon size={14} className="text-primary shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">{label}</p>
                        <p className="text-xs font-bold text-foreground">{value}</p>
                      </div>
                    </div>)}
                </div>

              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {currentDetail.tags.map(tag => <span key={tag} className="text-xs bg-primary/10 text-primary font-semibold px-3 py-1 rounded-full">
                    #{tag}
                  </span>)}
              </div>

              {/* Schedule */}
              {currentDetail.schedule && currentDetail.schedule.length > 0 && <div className="bg-card rounded-2xl p-4 shadow-card mb-4">
                  <h3 className="text-sm font-extrabold text-foreground mb-3">{"상세일정3"}</h3>
                  <div className="space-y-3 relative before:absolute before:inset-0 before:ml-3 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                    {currentDetail.schedule.map((item, idx) => <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-background bg-primary text-primary-foreground font-bold text-[10px] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow md:mx-auto">
                          {idx + 1}
                        </div>
                        <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-xl bg-muted border border-border/50 shadow-sm">
                          <p className="text-xs font-semibold text-foreground">{item}</p>
                        </div>
                      </div>)}
                  </div>
                </div>}

              {/* Members */}
              <div className="bg-card rounded-2xl p-4 shadow-card mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-extrabold text-foreground">{"참여멤버3"}</h3>
                  <span className="text-xs font-bold text-primary">{currentDetail.currentMembers}/{currentDetail.maxMembers}{"명"}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-muted rounded-full mb-4">
                  <div className="h-2 rounded-full gradient-primary transition-all" style={{
                width: `${currentDetail.currentMembers / currentDetail.maxMembers * 100}%`
              }} />
                </div>
                <div className="space-y-2.5">
                  {currentDetail.memberPhotos.map((photo, idx) => <div key={idx} className="flex items-center gap-3">
                      <img src={photo} alt="" className="w-9 h-9 rounded-full object-cover" loading="lazy" />
                      <span className="text-sm font-semibold text-foreground">{currentDetail.memberNames[idx] || "멤버"}</span>
                    </div>)}
                </div>
              </div>

              {/* Join button */}
              <button onClick={() => handleJoin(currentDetail)} className={`w-full py-4 rounded-2xl text-sm font-black transition-all ${currentDetail.joined ? "bg-muted text-muted-foreground" : "gradient-primary text-primary-foreground shadow-card"}`}>
                {currentDetail.joined ? "이미참여중" : "그룹참여하"}
              </button>
            </div>
          </motion.div>}
      </AnimatePresence>

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
                <ArrowLeft size={16} />{"목록으로3"}</button>

              <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={e => handleProfileClick(e, detailPost.authorId)}>
                  <img src={detailPost.photo} alt="" className="w-10 h-10 rounded-full object-cover" loading="lazy" />
                <div>
                  <p className="text-sm font-bold text-foreground hover:underline">{detailPost.author}</p>
                  <p className="text-[11px] text-muted-foreground">{detailPost.time}</p>
                </div>
              </div>

              <p className="text-sm text-foreground leading-relaxed mb-4">{detailPost.content}</p>

              {/* Images */}
              {detailPost.images && detailPost.images.length > 0 ? <div className={`grid gap-2 mb-4 ${detailPost.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                  {detailPost.images.map((img, idx) => <img key={idx} src={img} alt="" className="w-full rounded-xl object-cover" style={{
              maxHeight: 320
            }} loading="lazy" />)}
                </div> : detailPost.imageUrl ? <img src={detailPost.imageUrl} alt="" className="w-full rounded-xl object-cover mb-4" style={{
            maxHeight: 320
          }} loading="lazy" /> : null}

              {/* Translate */}
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => handleTranslate(detailPost.content, `detail_${detailPost.id}`)} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${translateMap[`detail_${detailPost.id}`] ? "bg-indigo-500/20 text-indigo-500" : "bg-muted text-muted-foreground"}`}>
                  {loadingMap[`detail_${detailPost.id}`] ? <motion.div className="w-3 h-3 rounded-full bg-current" animate={{
                scale: [1, 1.3, 1]
              }} transition={{
                repeat: Infinity,
                duration: 0.7
              }} /> : <Languages size={12} />}
                  {translateMap[`detail_${detailPost.id}`] ? "원문보기3" : "번역하기3"}
                </button>
              </div>
              {translateMap[`detail_${detailPost.id}`] && <p className="text-sm text-indigo-400 leading-relaxed bg-indigo-500/5 rounded-xl p-3 mb-4">
                  {translateMap[`detail_${detailPost.id}`]}
                </p>}

              {/* Comments */}
              <h3 className="text-sm font-extrabold text-foreground mb-3">{"댓글"}{detailPost.commentList.length}{"개"}</h3>
              <div className="space-y-3 mb-4">
                {detailPost.commentList.map(c => <div key={c.id} className="flex items-start gap-2.5">
                    <img src={c.photo} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" loading="lazy" />
                    <div className="bg-muted rounded-2xl px-3 py-2 flex-1">
                      <p className="text-xs font-bold text-foreground mb-0.5">{c.author}</p>
                      <p className="text-xs text-foreground/80">{c.text}</p>
                    </div>
                  </div>)}
              </div>

              {/* Comment input */}
              {user && <div className="flex items-center gap-2">
                  <input value={commentText} onChange={e => setCommentText(e.target.value)} onFocus={() => setCommentPost(detailPost)} placeholder={"댓글을입력"} className="flex-1 bg-muted rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                  <button onClick={handleSubmitComment} disabled={!commentText.trim()} className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center disabled:opacity-40">
                    <Send size={14} className="text-primary-foreground" />
                  </button>
                </div>}
            </div>
          </motion.div>}
      </AnimatePresence>

      {/* ── Write Post Modal ── */}
      <AnimatePresence>
        {showWriteModal && <motion.div initial={{
        y: "100%"
      }} animate={{
        y: 0
      }} exit={{
        y: "100%"
      }} className="fixed inset-0 z-50 bg-background">
            <div className="px-5 pt-12 pb-32 overflow-y-auto min-h-full">
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => setShowWriteModal(false)}>
                  <X size={20} className="text-foreground" />
                </button>
                <h2 className="text-base font-black text-foreground">{"글작성"}</h2>
                <button onClick={handleSubmitPost} className="text-sm font-bold text-primary">{"올리기"}</button>
              </div>

              <input value={writeTitle} onChange={e => setWriteTitle(e.target.value)} placeholder={"제목을입력"} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none mb-3" />
              <textarea value={writeContent} onChange={e => setWriteContent(e.target.value)} placeholder={"여행이야기"} rows={8} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none mb-4" />

              {/* Image previews */}
              {attachedImages.length > 0 && <div className="grid grid-cols-3 gap-2 mb-4">
                  {attachedImages.map((img, idx) => <div key={idx} className="relative">
                      <img src={img.url} alt="" className="w-full h-24 rounded-xl object-cover" loading="lazy" />
                      <button onClick={() => setAttachedImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                        <X size={10} className="text-white" />
                      </button>
                    </div>)}
                </div>}

              <button onClick={() => fileInputRef.current?.click()} disabled={attachedImages.length >= MAX_POST_PHOTOS} className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-4 py-2.5 rounded-xl disabled:opacity-40">
                <ImageIcon size={14} />{"사진추가4"}{attachedImages.length}/{MAX_POST_PHOTOS})
              </button>
              <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileSelect} />
            </div>
          </motion.div>}
      </AnimatePresence>

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
                <ArrowLeft size={16} />{"목록으로4"}</button>
              
              <div className="bg-card rounded-2xl p-4 shadow-card mb-4 border border-border">
                <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={e => handleProfileClick(e, detailPost.authorId)}>
                  <img src={detailPost.photo} alt="" className="w-10 h-10 rounded-full object-cover" loading="lazy" />
                  <div>
                    <p className="text-sm font-bold text-foreground hover:underline">{detailPost.author}</p>
                    <p className="text-[11px] text-muted-foreground">{detailPost.time}</p>
                  </div>
                </div>

                <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap mb-4">{detailPost.content}</p>

                {detailPost.images && detailPost.images.length > 0 ? <div className="grid gap-2 mb-4">
                    {detailPost.images.map((img, idx) => <img key={idx} src={img} className="w-full rounded-xl object-cover bg-black/5" onError={e => e.currentTarget.style.display = 'none'} />)}
                  </div> : detailPost.imageUrl ? <img src={detailPost.imageUrl} className="w-full rounded-xl object-cover mb-4 bg-black/5" onError={e => e.currentTarget.style.display = 'none'} /> : null}

                <div className="flex items-center gap-4 pt-4 border-t border-border">
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
                      <Zap size={14} className="fill-amber-500" />{"끌어올리기"}</button>}
                </div>
              </div>

              {/* Comments List */}
              <h3 className="text-sm font-extrabold text-foreground mb-4">{"댓글"}{detailPost.comments}</h3>
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
            }} placeholder={"따뜻한댓글"} className="flex-1 bg-muted rounded-full pl-4 pr-12 py-3 text-sm text-foreground outline-none" onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSubmitComment()} />
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
                <p className="text-sm text-muted-foreground">{"프리미엄그"}</p>
              </div>
              <button onClick={() => {
            setShowPlusModal(false);
            navigate("/profile");
          }} className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground text-sm font-black">{"Plus시"}</button>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      {/* ── Payment Modal ── */}
      <AnimatePresence>
        {paymentGroup && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center px-safe pb-safe pt-safe" onClick={() => setPaymentGroup(null)}>
            <motion.div initial={{
          y: "100%"
        }} animate={{
          y: 0
        }} exit={{
          y: "100%"
        }} onClick={e => e.stopPropagation()} className="w-full bg-card rounded-3xl mb-20 sm:mb-24 px-5 pt-6 pb-8">
              <div className="text-center mb-6">
                <Ticket size={36} className="text-primary mx-auto mb-3" />
                <h2 className="text-lg font-black text-foreground mb-2">{"참가비결제"}</h2>
                <p className="text-2xl font-black text-primary">{getLocalizedPrice(paymentGroup.entryFee ?? 0, i18n.language)}</p>
                <p className="text-sm text-muted-foreground mt-1">{paymentGroup.title}</p>
              </div>
              <div className="space-y-3">
                {["카카오페이", "토스페이4", "신용카드4"].map(method => <button key={method} onClick={() => {
              joinGroup(paymentGroup);
              setPaymentGroup(null);
            }} className="w-full py-3.5 rounded-2xl bg-muted text-foreground text-sm font-bold">
                    {method}{"로결제"}</button>)}
              </div>
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
               <h3 className="text-lg font-black text-foreground">{"좋아요한사"}</h3>
               <button onClick={() => setLikesPostId(null)} className="p-2 bg-muted rounded-full text-foreground"><X size={16} /></button>
             </div>
             <div className="overflow-y-auto flex-1 space-y-3">
               {likesList.length === 0 ? <p className="text-center text-sm text-muted-foreground py-8">{"아직좋아요"}</p> : likesList.map((usr, i) => <div key={i} className="flex items-center gap-3">
                   <img src={usr?.photo_url || "https://api.dicebear.com/9.x/notionists/svg?seed=" + i} alt="" className="w-10 h-10 rounded-full object-cover bg-muted" loading="lazy" />
                   <span className="text-sm font-bold text-foreground">{usr?.name || "알수없음4"}</span>
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
              <p className="text-xs font-bold text-blue-400">{"동행지원방"}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{"호스트가지"}</p>
            </div>
            <label className="text-xs font-bold text-foreground mb-2 block">{"나를어필하"}</label>
            <textarea value={applyMessage} onChange={e => setApplyMessage(e.target.value)} maxLength={200} rows={4} placeholder={t("auto.z_tmpl_809", {
          defaultValue: t("auto.p19", {
            dest: applyGroup.destination
          })
        })} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:ring-2 focus:ring-primary/30 mb-1" />
            <p className="text-[10px] text-muted-foreground text-right mb-4">{applyMessage.length}/200</p>
            <div className="flex gap-3">
              <button onClick={() => setApplyGroup(null)} className="flex-1 py-3 rounded-2xl bg-muted text-muted-foreground font-semibold text-sm">{"취소"}</button>
              <button onClick={handleApply} disabled={applySubmitting} className="flex-1 py-3 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-sm flex items-center justify-center gap-2" style={{
            opacity: applySubmitting ? 0.7 : 1
          }}>
                {applySubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '✈️'}{"지원하기8"}</button>
            </div>
          </div>
        </div>}

      {/* ── [Feature 2] 지원자 심사 모달 (호스트용) ── */}
      {showApplicants && <div className="fixed inset-0 z-50 flex items-end justify-center px-safe pb-safe pt-safe" onClick={() => setShowApplicants(null)}>
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 p-6 pb-12 max-h-[80vh] overflow-y-auto shadow-float" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
            <h3 className="font-extrabold text-foreground mb-1">{"동행지원자"}</h3>
            <p className="text-xs text-muted-foreground mb-4">{"지원자프로"}</p>
            {applicantsList.length === 0 ? <div className="text-center py-10 text-muted-foreground text-sm">{"아직지원자"}</div> : <div className="space-y-3">
                {applicantsList.map((app: any) => <div key={app.id} className="p-4 rounded-2xl bg-muted/50 border border-border">
                    <div className="flex items-start gap-3 mb-3">
                      {app.profiles?.photo_url ? <img src={app.profiles.photo_url} alt="" className="w-10 h-10 rounded-xl object-cover" /> : <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {app.profiles?.name?.[0]}
                        </div>}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground">{app.profiles?.name} {app.profiles?.age && i18n.t("auto.z_tmpl_815", {
                    defaultValue: t("auto.t5015", {
                      v0: app.profiles.age
                    })
                  })}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{app.profiles?.bio}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${app.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400' : app.status === 'rejected' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
                        {app.status === 'approved' ? "승인" : app.status === 'rejected' ? "거절" : "검토중"}
                      </span>
                    </div>
                    <div className="bg-card rounded-xl p-3 mb-3">
                      <p className="text-xs font-bold text-muted-foreground mb-1">{"지원메시지"}</p>
                      <p className="text-sm text-foreground">{app.message}</p>
                    </div>
                    {app.status === 'pending' && <div className="flex gap-2">
                        <button onClick={() => handleRejectApplicant(app.id)} className="flex-1 py-2 rounded-xl bg-red-500/10 text-red-400 font-bold text-xs border border-red-500/20">{"거절"}</button>
                        <button onClick={() => handleApproveApplicant(app.id, app.applicant_id, showApplicants)} className="flex-1 py-2 rounded-xl gradient-primary text-primary-foreground font-bold text-xs">{"동행승인8"}</button>
                      </div>}
                  </div>)}
              </div>}
          </div>
        </div>
      }

      {/* ── ⚡ Basic Lightning Loading / Radar Screen ── */}
      <AnimatePresence>
        {showLightningLoading && (
          <motion.div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="relative w-64 h-64 flex items-center justify-center mb-8">
              <motion.div className="absolute inset-0 rounded-full border border-orange-500/30" animate={{ scale: [1, 2], opacity: [0.8, 0] }} transition={{ repeat: Infinity, duration: 2 }} />
              <motion.div className="absolute inset-4 rounded-full border border-orange-500/20" animate={{ scale: [1, 2], opacity: [0.6, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} />
              <motion.div className="absolute inset-8 rounded-full border border-orange-500/10" animate={{ scale: [1, 2], opacity: [0.4, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 1 }} />
              <motion.div className="w-24 h-24 rounded-full bg-orange-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.5)] border border-orange-500/50 relative z-10"
                animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                <Beer size={40} className="text-orange-400" fill="currentColor" />
              </motion.div>
            </div>
            <motion.h3 animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-xl font-black text-white mb-2 text-center">
              {i18n.t("auto.v2_scan_msg", "내 주변 매칭 탐색 중...")}
            </motion.h3>
            <p className="text-sm text-white/50">{i18n.t("auto.v2_scan_sub", "반경 3km 내의 핫플을 확인합니다")}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ⚡ Basic Lightning Result Modal (For Basic Users) ── */}
      <AnimatePresence>
        {lightningResult && (
          <motion.div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-full max-w-sm bg-card rounded-[2rem] p-8 shadow-2xl relative overflow-hidden"
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}>
              
              <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-orange-500 to-amber-500 opacity-20" />
              
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 text-white flex items-center justify-center mx-auto mb-5 shadow-lg shadow-orange-500/30">
                  <Beer size={32} fill="currentColor" />
                </div>
                
                <h3 className="text-2xl font-black text-foreground mb-1 leading-tight tracking-tight">
                  {i18n.t("auto.v2_basic_done", "매칭 완료!")}
                </h3>
                <p className="text-sm font-medium text-amber-600 mb-6 flex items-center justify-center gap-1">
                  <MapPin size={12} /> {lightningResult.barName}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                  {lightningResult.members.map((m, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <img src={m.photo} className="w-14 h-14 rounded-full object-cover border-4 border-background shadow-md" />
                      <span className="text-[10px] font-bold text-muted-foreground">{m.name}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  <button onClick={() => confirmLightningMatch()} className="w-full py-4 rounded-2xl text-white font-extrabold shadow-lg" style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)" }}>
                    {i18n.t("auto.v2_vip_enter", "여기로 입장")}
                  </button>
                  <button onClick={() => setLightningResult(null)} className="w-full py-4 rounded-2xl bg-muted text-muted-foreground font-bold hover:bg-muted/80 transition-hidden">
                    {i18n.t("auto.v2_cancel", "다음에 할게요")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ⚡ VIP Lightning Filter Modal ── */}
      <AnimatePresence>
        {showVipLightningFilter && (
          <motion.div className="fixed inset-0 z-[110] flex items-center justify-center px-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowVipLightningFilter(false)} />
            <motion.div className="relative w-full max-w-sm bg-card rounded-3xl p-6 shadow-2xl overflow-hidden"
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}>
              
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                    <Crown size={20} className="text-amber-500" /> {i18n.t("auto.v2_vip_title", "VIP 맞춤 번개")}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">{i18n.t("auto.v2_vip_desc", "플러스 회원 전용 상세 매칭 필터")}</p>
                </div>
                <button onClick={() => setShowVipLightningFilter(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-foreground mb-2 block">{i18n.t("auto.v2_vip_age", "나이대 선호")}</label>
                  <div className="flex gap-2">
                    {["20s", "late20s", "30s"].map(a => (
                      <button key={a} onClick={() => setVipFilter({ ...vipFilter, age: a })} className={`flex-1 py-1.5 px-1 md:py-2 md:px-2 rounded-xl text-xs font-bold border transition-colors ${vipFilter.age === a ? 'bg-amber-500/15 border-amber-500/50 text-amber-500' : 'bg-muted/50 border-transparent text-muted-foreground'}`}>
                        {a === "20s" ? i18n.t("auto.v2_age_20", "20대 초중반") : a === "late20s" ? i18n.t("auto.v2_age_late20", "20대 후반") : i18n.t("auto.v2_age_30", "30대 이상")}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground mb-2 block">{i18n.t("auto.v2_vip_lang", "사용 언어/국적")}</label>
                  <div className="flex gap-2">
                    {["ko", "global"].map(l => (
                      <button key={l} onClick={() => setVipFilter({ ...vipFilter, language: l })} className={`flex-1 flex flex-col items-center py-3 rounded-xl border transition-colors ${vipFilter.language === l ? 'bg-blue-500/15 border-blue-500/50 text-blue-500' : 'bg-muted/50 border-transparent text-muted-foreground'}`}>
                        <span className="text-lg mb-1">{l === "ko" ? "🇰🇷" : "🌍"}</span>
                        <span className="text-xs font-bold">{l === "ko" ? i18n.t("auto.v2_lang_ko", "한국어 위주") : i18n.t("auto.v2_lang_global", "글로벌 믹스")}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground mb-2 block">{i18n.t("auto.v2_vip_vibe", "원하는 분위기 (Vibe)")}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["party", "chill", "food"].map(v => (
                      <button key={v} onClick={() => setVipFilter({ ...vipFilter, vibe: v })} className={`py-3 rounded-xl flex flex-col items-center gap-1 border transition-colors ${vipFilter.vibe === v ? 'bg-pink-500/15 border-pink-500/50 text-pink-500' : 'bg-muted/50 border-transparent text-muted-foreground'}`}>
                        <span>{v === "party" ? "🎉" : v === "chill" ? "🥂" : "🍜"}</span>
                        <span className="text-[10px] font-bold">{v === "party" ? i18n.t("auto.v2_vibe_party", "파티/텐션업") : v === "chill" ? i18n.t("auto.v2_vibe_chill", "잔잔한 딥톡") : i18n.t("auto.v2_vibe_food", "로컬 감성")}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={() => executeLightningMatch(true)} className="w-full mt-8 py-4 rounded-2xl text-white font-extrabold shadow-lg" style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)" }}>
                {i18n.t("auto.v2_vip_scan", "맞춤형 스캔 시작")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ⚡ VIP Lightning Multi-Result Modal ── */}
      <AnimatePresence>
        {lightningMultiResult && (
          <motion.div className="fixed inset-0 z-[120] flex flex-col justify-end bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-card rounded-t-3xl pt-6 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] w-full max-w-lg mx-auto shadow-float"
              initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ type: "spring", damping: 25, stiffness: 200 }}>
              <div className="px-6 mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                    {i18n.t("auto.v2_vip_preview", "미리 보고 선택하기")} <Crown size={16} className="text-amber-500" />
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">{i18n.t("auto.v2_vip_select", "원하는 컨셉의 모임을 하나 선택하세요.")}</p>
                </div>
                <button onClick={() => setLightningMultiResult(null)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>

              {/* Horizontal List of Options */}
              <div className="flex gap-4 px-6 overflow-x-auto scrollbar-hide pb-4 snap-x">
                {lightningMultiResult.map(res => (
                  <div key={res.id} className="snap-center shrink-0 w-[240px] bg-muted/40 rounded-3xl p-5 border border-border relative">
                    <div className="absolute top-4 right-4 text-2xl opacity-40">{res.vibeIcon}</div>
                    <div className="mb-4">
                      <span className="inline-block px-2 py-1 bg-amber-500/15 text-amber-600 rounded-md text-[10px] font-extrabold mb-2">{i18n.t("auto.v2_vip_premium", "PREMIUM")}</span>
                      <h4 className="text-lg font-black text-foreground leading-tight mb-1">{res.title}</h4>
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><MapPin size={10} /> {res.barName}</p>
                    </div>
                    
                    <div className="flex items-center -space-x-2 mb-6">
                      {res.members.map((m, i) => (
                        <img key={i} src={m.photo} className="w-10 h-10 rounded-full border-2 border-background object-cover" />
                      ))}
                      <div className="w-10 h-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground">+{res.members.length}</div>
                    </div>

                    <button 
                      onClick={() => confirmLightningMatch(res)}
                      className="w-full py-2.5 rounded-xl border-2 border-amber-500 text-amber-600 font-bold text-sm bg-transparent hover:bg-amber-500 hover:text-white transition-colors"
                    >
                      {i18n.t("auto.v2_vip_enter", "여기로 입장")}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>;
};
export default DiscoverPage;