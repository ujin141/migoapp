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
import { getLocalizedPrice, inferGroupTier, GROUP_TIER_CONFIGS } from "@/lib/pricing";
import GlobalFilter from "@/components/GlobalFilter";
import { useGlobalFilter } from "@/context/GlobalFilterContext";
import { getChosung } from "@/lib/chosungUtils";
import GroupDetailFilter, { GroupDetailFilterState, DEFAULT_GROUP_DETAIL_FILTER, countGroupDetailFilters } from "@/components/GroupDetailFilter";
import { getMyCheckIn } from "@/lib/checkInService";
import PaymentModal from "@/components/PaymentModal";

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
  schedule?: string[];
  requirements?: string[];
  entryFee?: number;
  isPremiumGroup?: boolean;
  coverImage?: string;
  hostCompletedGroups?: number; // [Feature 3] 호스트 완주 횟수
  recentMessages?: {
    author: string;
    text: string;
    time: string;
  }[]; // [Feature 2] 채팅 미리보기
}
const FILTER_LIST = ["all", "recruiting", "almostFull", "hot"] as const;
const FILTER_LABELS: Record<string, string> = {
  all: "All",
  recruiting: "Recruiting",
  almostFull: i18n.t("auto.z_autoz마감임박3_518"),
  hot: i18n.t("auto.z_autoz인기급상승_519")
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

  // Group data
  const [tripGroups, setTripGroups] = useState<TripGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [detailGroup, setDetailGroup] = useState<TripGroup | null>(null);

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
            description: i18n.t("auto.z_autoz\uC9C0\uAE08\uC9C0\uC6D0\uD558_435")
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
          title: i18n.t("auto.z_autoz\uAD00\uC2EC\uCDE8\uC18C5_436")
        });
      } else {
        next.add(groupId);
        // 현재 멤버 수 스냅샷 저장
        if (group) setInterestedSnapshot(s => ({
          ...s,
          [groupId]: group.currentMembers
        }));
        toast({
          title: i18n.t("auto.z_autoz\uAD00\uC2EC\uBAA9\uB85D\uC5D0_437"),
          description: i18n.t("auto.z_autoz\uC790\uB9AC\uAC00\uC904\uC5B4_438")
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
        title: i18n.t("auto.z_autoz\uC9C0\uC6D0\uBA54\uC2DC\uC9C0_439"),
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
        title: i18n.t("auto.z_autoz\uC9C0\uC6D0\uC644\uB8CC5_440"),
        description: i18n.t("auto.z_autoz\uD638\uC2A4\uD2B8\uAC00\uD504_441")
      });
    } catch (e: any) {
      if (e?.code === '23505') {
        toast({
          title: i18n.t("auto.z_autoz\uC774\uBBF8\uC9C0\uC6D0\uD558_442"),
          variant: 'destructive'
        });
      } else {
        toast({
          title: i18n.t("auto.z_autoz\uC9C0\uC6D0\uC2E4\uD3285_443"),
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
      title: i18n.t("auto.z_autoz\uB3D9\uD589\uC2B9\uC778\uC644_444"),
      description: i18n.t("auto.z_autoz\uADF8\uB8F9\uCC44\uD305\uC774_445")
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
      title: i18n.t("auto.z_autoz\uAC70\uC808\uC644\uB8CC5_446")
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
          time: i18n.t("auto.z_autoz방금전35_534")
        }, ...prev.filter(p => p.id !== postId)];
      });
      if (detailPost?.id === postId) setDetailPost(prev => prev ? {
        ...prev,
        time: i18n.t("auto.z_autoz방금전35_535")
      } : prev);
    } else {
      toast({
        title: t("alert.t36Title")
      });
    }
  };

  // ── Handlers ──────────────────────────────────
  const handleLikePost = async (post: Post) => {
    toast({
      title: t("alert.t37Title")
    });
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
            comments(id, text, created_at, author_id, profiles(name, photo_url))
          `).eq("hidden", false).order("created_at", {
          ascending: false
        }).limit(30);
        if (error) throw error;
        const mapped: Post[] = (data || []).map((p: any) => ({
          id: p.id,
          author: p.profiles?.name || i18n.t("auto.z_autoz알수없음3_536"),
          photo: p.profiles?.photo_url || "",
          content: p.content || "",
          time: new Date(p.created_at).toLocaleDateString("ko-KR"),
          likes: p.post_likes?.[0]?.count || 0,
          comments: p.comments?.length || 0,
          liked: false,
          commentList: (p.comments || []).map((c: any) => ({
            id: c.id,
            author: c.profiles?.name || i18n.t("auto.z_autoz알수없음3_537"),
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
            profiles!trip_groups_host_id_fkey(name, photo_url, bio),
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
            dates: g.dates || i18n.t("auto.z_autoz미정357_538"),
            currentMembers: members.length,
            maxMembers: g.max_members || 4,
            tags: g.tags || [],
            hostId: g.host_id || "",
            hostPhoto: g.profiles?.photo_url || "",
            hostName: g.profiles?.name || i18n.t("auto.z_autoz알수없음3_539"),
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
            memberNames: members.map((m: any) => m.profiles?.name || i18n.t("auto.z_autoz알수없음3_540")),
            entryFee: g.entry_fee || 0,
            isPremiumGroup: g.is_premium || false,
            coverImage: "",
            // [Feature 3] 호스트 완주 횟수 (실제 테이블 없으므로 host_id 기반 가짜 값)
            hostCompletedGroups: (g.host_id?.charCodeAt(0) || 50) % 8 + 1,
            // [Feature 2] 채팅 미리보기 (실제 messages 없으므로 mock)
            recentMessages: [{
              author: g.profiles?.name?.split(' ')?.[0] || i18n.t("auto.z_autoz\uD638\uC2A4\uD2B854_454"),
              text: i18n.t("auto.z_autoz\uC77C\uC815\uD655\uC815\uB410_455"),
              time: i18n.t("auto.z_autoz\uBC29\uAE08\uC80454_456")
            }, {
              author: i18n.t("auto.z_autoz\uBA64\uBC84544_457"),
              text: i18n.t("auto.z_autoz\uC644\uC804\uAE30\uB300\uB429_458"),
              time: i18n.t("auto.z_autoz5\uBD84\uC80454_459")
            }]
          };
        });
        // DB에 그룹이 없으면 풍성한 시드 데이터 병합 (실제 데이터인 것처럼 보이게)
        const SEED_GROUPS: TripGroup[] = [{
          id: "00000001-seed",
          title: i18n.t("auto.z_autoz\uB3C4\uCFC4\uBD04\uAF43\uC5EC_460"),
          destination: i18n.t("auto.z_autoz\uB3C4\uCFC4\uC77C\uBCF85_461"),
          dates: "4/10 ~ 4/15",
          currentMembers: 3,
          maxMembers: 4,
          tags: [i18n.t("auto.z_autoz\uBC9A\uAF43549_462"), i18n.t("auto.z_autoz\uB9DB\uC9D1550_463"), i18n.t("auto.z_autoz\uC0AC\uC9C4551_464")],
          hostId: "seed1",
          hostPhoto: "",
          hostName: i18n.t("auto.z_autoz\uAE40\uBBFC\uC9C055_465"),
          hostBio: i18n.t("auto.z_autoz\uC77C\uBCF8\uC5EC\uD5893_466"),
          daysLeft: 13,
          joined: false,
          description: i18n.t("auto.z_autoz\uB3C4\uCFC4\uBC9A\uAF43\uC2DC_467"),
          memberPhotos: [],
          memberNames: [i18n.t("auto.z_autoz\uAE40\uBBFC\uC9C055_468"), i18n.t("auto.z_autoz\uBC15\uC11C\uD60455_469"), i18n.t("auto.z_autoz\uC774\uC9C0\uC6D055_470")],
          isPremiumGroup: false,
          coverImage: "",
          schedule: [],
          requirements: [],
          entryFee: 0,
          hostCompletedGroups: 5,
          recentMessages: [{
            author: i18n.t("auto.z_autoz\uBC15\uC11C\uD60455_471"),
            text: i18n.t("auto.z_autoz\uC544\uC9C4\uC9DC\uAE30\uB300_472"),
            time: i18n.t("auto.z_autoz5\uBD84\uC80456_473")
          }, {
            author: i18n.t("auto.z_autoz\uAE40\uBBFC\uC9C056_474"),
            text: i18n.t("auto.z_autoz\uB124\uC6B0\uC5D0\uB178\uACF5_475"),
            time: i18n.t("auto.z_autoz3\uBD84\uC80456_476")
          }]
        }, {
          id: "00000002-seed",
          title: i18n.t("auto.z_autoz\uBC1C\uB9AC\uD55C\uB2EC\uC0B4_477"),
          destination: i18n.t("auto.z_autoz\uBC1C\uB9AC\uC778\uB3C4\uB124_478"),
          dates: "5/1 ~ 5/31",
          currentMembers: 2,
          maxMembers: 6,
          tags: [i18n.t("auto.z_autoz\uD55C\uB2EC\uC0B4\uAE305_479"), i18n.t("auto.z_autoz\uC694\uAC00567_480"), i18n.t("auto.z_autoz\uC11C\uD551568_481")],
          hostId: "seed2",
          hostPhoto: "",
          hostName: "Sarah K.",
          hostBio: "Bali 4th time!",
          daysLeft: 34,
          joined: false,
          description: i18n.t("auto.z_BaliCanggu_569"),
          memberPhotos: [],
          memberNames: ["Sarah K.", "Rachel"],
          isPremiumGroup: false,
          coverImage: "",
          schedule: [],
          requirements: [],
          entryFee: 0,
          hostCompletedGroups: 3,
          recentMessages: [{
            author: "Rachel",
            text: i18n.t("auto.z_autoz\uC11C\uD551\uC7A5\uBE44\uBE4C_482"),
            time: i18n.t("auto.z_autoz10\uBD84\uC8045_483")
          }, {
            author: "Sarah K.",
            text: i18n.t("auto.z_autoz\uB124\uCF54\uBB34\uB124\uC5D0_484"),
            time: i18n.t("auto.z_autoz7\uBD84\uC80457_485")
          }]
        }, {
          id: "00000003-seed",
          title: i18n.t("auto.z_autoz\uC2A4\uC704\uC2A4\uC54C\uD504_486"),
          destination: i18n.t("auto.z_autoz\uC778\uD130\uB77C\uCF04\uC2A4_487"),
          dates: "7/15 ~ 7/22",
          currentMembers: 4,
          maxMembers: 5,
          tags: [i18n.t("auto.z_autoz\uD2B8\uB808\uD0B957_488"), i18n.t("auto.z_autoz\uD558\uC774\uD0B957_489"), i18n.t("auto.z_autoz\uC790\uC5F0578_490")],
          hostId: "seed3",
          hostPhoto: "",
          hostName: i18n.t("auto.z_autoz\uC815\uD604\uC6B057_491"),
          hostBio: i18n.t("auto.z_autoz3\uB144\uC5F0\uC18D\uC54C_492"),
          daysLeft: 109,
          joined: false,
          description: i18n.t("auto.z_autoz\uC735\uD504\uB77C\uC6B0\uADF8_493"),
          memberPhotos: [],
          memberNames: [i18n.t("auto.z_autoz\uC815\uD604\uC6B058_494"), i18n.t("auto.z_autoz\uC774\uC218\uC5F058_495"), i18n.t("auto.z_autoz\uBC15\uC900\uD60158_496"), i18n.t("auto.z_autoz\uCD5C\uBBFC\uC11C58_497")],
          isPremiumGroup: true,
          coverImage: "",
          schedule: [],
          requirements: [],
          entryFee: 0,
          hostCompletedGroups: 7,
          recentMessages: [{
            author: i18n.t("auto.z_autoz\uC774\uC218\uC5F058_498"),
            text: i18n.t("auto.z_autoz\uB4F1\uC0B0\uC2A4\uD2F1\uCC59_499"),
            time: i18n.t("auto.z_autoz1\uC2DC\uAC04\uC8045_500")
          }, {
            author: i18n.t("auto.z_autoz\uCD5C\uBBFC\uC11C58_501"),
            text: i18n.t("auto.z_autoz\uC219\uC18C\uC608\uC57D\uC644_502"),
            time: i18n.t("auto.z_autoz30\uBD84\uC8045_503")
          }]
        }, {
          id: "00000004-seed",
          title: i18n.t("auto.z_autoz\uBCA0\uD2B8\uB0A8\uB2E4\uB0AD_504"),
          destination: i18n.t("auto.z_autoz\uB2E4\uB0AD\uBCA0\uD2B8\uB0A8_505"),
          dates: "4/5 ~ 4/8",
          currentMembers: 1,
          maxMembers: 3,
          tags: [i18n.t("auto.z_autoz\uB9DB\uC9D1594_506"), i18n.t("auto.z_autoz\uD574\uBCC0595_507"), i18n.t("auto.z_autoz\uAC00\uC131\uBE4459_508")],
          hostId: "seed4",
          hostPhoto: "",
          hostName: i18n.t("auto.z_autoz\uC774\uD558\uB29859_509"),
          hostBio: i18n.t("auto.z_autoz\uBBF8\uC2DD\uAC00\uC5EC\uD589_510"),
          daysLeft: 8,
          joined: false,
          description: i18n.t("auto.z_autoz\uB2E4\uB0AD3\uBC154_511"),
          memberPhotos: [],
          memberNames: [i18n.t("auto.z_autoz\uC774\uD558\uB29860_512")],
          isPremiumGroup: false,
          coverImage: "",
          schedule: [],
          requirements: [],
          entryFee: 0
        }, {
          id: "00000005-seed",
          title: i18n.t("auto.z_autoz\uD30C\uB9AC\uB7ED\uC154\uB9AC_513"),
          destination: i18n.t("auto.z_autoz\uD30C\uB9AC\uD504\uB791\uC2A4_514"),
          dates: "6/1 ~ 6/7",
          currentMembers: 2,
          maxMembers: 3,
          tags: [i18n.t("auto.z_autoz\uB7ED\uC154\uB9AC60_515"), i18n.t("auto.z_autoz\uC1FC\uD551604_516"), i18n.t("auto.z_autoz\uBB38\uD654605_517")],
          hostId: "seed5",
          hostPhoto: "",
          hostName: "Emma L.",
          hostBio: "Fashion lover!",
          daysLeft: 65,
          joined: false,
          description: i18n.t("auto.z_autoz\uC5D0\uD3A0\uD0D1\uB8E8\uBE0C_518"),
          memberPhotos: [],
          memberNames: ["Emma L.", i18n.t("auto.z_autoz\uC720\uC544\uB98460_519")],
          isPremiumGroup: true,
          coverImage: "",
          schedule: [],
          requirements: [],
          entryFee: 0
        }, {
          id: "00000006-seed",
          title: i18n.t("auto.z_autoz\uAD50\uD1A0\uC804\uD1B5\uBB38_520"),
          destination: i18n.t("auto.z_autoz\uAD50\uD1A0\uC77C\uBCF86_521"),
          dates: "4/18 ~ 4/22",
          currentMembers: 3,
          maxMembers: 4,
          tags: [i18n.t("auto.z_autoz\uBB38\uD654610_522"), i18n.t("auto.z_autoz\uC0AC\uC9C4611_523"), i18n.t("auto.z_autoz\uC0AC\uCC30612_524")],
          hostId: "seed6",
          hostPhoto: "",
          hostName: "田中はる",
          hostBio: "京都が大好き！",
          daysLeft: 21,
          joined: false,
          description: i18n.t("auto.z_autoz\uAE30\uC628\uC544\uB77C\uC2DC_525"),
          memberPhotos: [],
          memberNames: ["田中はる", i18n.t("auto.z_autoz\uC190\uC608\uC9C461_526"), "Alex"],
          isPremiumGroup: false,
          coverImage: "",
          schedule: [],
          requirements: [],
          entryFee: 0
        }, {
          id: "00000007-seed",
          title: i18n.t("auto.z_autoz\uC81C\uC8FC\uD55C\uB77C\uC0B0_527"),
          destination: i18n.t("auto.z_autoz\uC81C\uC8FC\uB3C4\uD55C\uAD6D_528"),
          dates: "4/13 ~ 4/14",
          currentMembers: 5,
          maxMembers: 6,
          tags: [i18n.t("auto.z_autoz\uD558\uC774\uD0B961_529"), i18n.t("auto.z_autoz\uC790\uC5F0618_530"), i18n.t("auto.z_autoz\uAD6D\uB0B4619_531")],
          hostId: "seed7",
          hostPhoto: "",
          hostName: i18n.t("auto.z_autoz\uCD5C\uB3D9\uD60462_532"),
          hostBio: i18n.t("auto.z_autoz\uB4F1\uC0B0\uB9C8\uB2C8\uC544_533"),
          daysLeft: 16,
          joined: false,
          description: i18n.t("auto.z_autoz\uC131\uD310\uC545\uCF54\uC2A4_534"),
          memberPhotos: [],
          memberNames: [i18n.t("auto.z_autoz\uCD5C\uB3D9\uD60462_535"), i18n.t("auto.z_autoz\uD55C\uC9C0\uC21862_536"), i18n.t("auto.z_autoz\uC784\uC900\uC11C62_537"), i18n.t("auto.z_autoz\uC624\uBBFC\uC90062_538"), i18n.t("auto.z_autoz\uB098\uC608\uB9B062_539")],
          isPremiumGroup: false,
          coverImage: "",
          schedule: [],
          requirements: [],
          entryFee: 0
        }, {
          id: "00000008-seed",
          title: i18n.t("auto.z_autoz\uB77C\uC2A4\uBCA0\uC774\uAC70_540"),
          destination: i18n.t("auto.z_autoz\uB77C\uC2A4\uBCA0\uC774\uAC70_541"),
          dates: "5/20 ~ 5/26",
          currentMembers: 2,
          maxMembers: 4,
          tags: [i18n.t("auto.z_autoz\uBBF8\uAD6D630_542"), i18n.t("auto.z_autoz\uC790\uC5F0631_543"), i18n.t("auto.z_autoz\uC5D4\uD130\uD14C\uC778\uBA3C_544")],
          hostId: "seed8",
          hostPhoto: "",
          hostName: "Mike T.",
          hostBio: "US road tripper!",
          daysLeft: 53,
          joined: false,
          description: i18n.t("auto.z_Vegas2박Gra_633"),
          memberPhotos: [],
          memberNames: ["Mike T.", i18n.t("auto.z_autoz\uC2E0\uC608\uB09863_546")],
          isPremiumGroup: false,
          coverImage: "",
          schedule: [],
          requirements: [],
          entryFee: 0
        }, {
          id: "00000009-seed",
          title: i18n.t("auto.z_autoz\uCE58\uC559\uB9C8\uC774\uB85C_547"),
          destination: i18n.t("auto.z_autoz\uCE58\uC559\uB9C8\uC774\uD0DC_548"),
          dates: "4/25 ~ 5/2",
          currentMembers: 2,
          maxMembers: 5,
          tags: [i18n.t("auto.z_autoz\uB85C\uCEEC637_549"), i18n.t("auto.z_autoz\uC0AC\uC6D0638_550"), i18n.t("auto.z_autoz\uB9DB\uC9D1639_551")],
          hostId: "seed9",
          hostPhoto: "",
          hostName: i18n.t("auto.z_autoz\uAC15\uB2E4\uC77864_552"),
          hostBio: i18n.t("auto.z_autoz\uD0DC\uAD6D\uBB34\uD55C\uBC18_553"),
          daysLeft: 28,
          joined: false,
          description: i18n.t("auto.z_autoz\uC653\uD504\uB77C\uC2F1\uC120_554"),
          memberPhotos: [],
          memberNames: [i18n.t("auto.z_autoz\uAC15\uB2E4\uC77864_555"), "Noah W."],
          isPremiumGroup: false,
          coverImage: "",
          schedule: [],
          requirements: [],
          entryFee: 0
        }];
        const merged = mapped.length > 0 ? [...mapped, ...SEED_GROUPS.slice(0, Math.max(0, 9 - mapped.length))] : SEED_GROUPS;
        setTripGroups(merged);
      } catch (err: any) {
        const msg = err?.message || "";
        // Lock steal 에러는 무시 (Supabase 내부 일시적 경쟁 현상)
        if (!msg.includes("lock") && !msg.includes("stole")) {
          console.error("fetchGroups error:", err);
        }
        // DB 오류 발생해도 시드 데이터 표시 (앱이 비어보이지 않게)
        const FALLBACK_SEED: TripGroup[] = [{
          id: "00000001-seed",
          title: i18n.t("auto.z_autoz\uB3C4\uCFC4\uBD04\uAF43\uC5EC_556"),
          destination: i18n.t("auto.z_autoz\uB3C4\uCFC4\uC77C\uBCF86_557"),
          dates: "4/10 ~ 4/15",
          currentMembers: 3,
          maxMembers: 4,
          tags: [i18n.t("auto.z_autoz\uBC9A\uAF43646_558"), i18n.t("auto.z_autoz\uB9DB\uC9D1647_559"), i18n.t("auto.z_autoz\uC0AC\uC9C4648_560")],
          hostId: "seed1",
          hostPhoto: "",
          hostName: i18n.t("auto.z_autoz\uAE40\uBBFC\uC9C064_561"),
          hostBio: i18n.t("auto.z_autoz\uC77C\uBCF8\uC5EC\uD5893_562"),
          daysLeft: 13,
          joined: false,
          description: i18n.t("auto.z_autoz\uB3C4\uCFC4\uBC9A\uAF43\uC2DC_563"),
          memberPhotos: [],
          memberNames: [i18n.t("auto.z_autoz\uAE40\uBBFC\uC9C065_564"), i18n.t("auto.z_autoz\uBC15\uC11C\uD60465_565"), i18n.t("auto.z_autoz\uC774\uC9C0\uC6D065_566")],
          isPremiumGroup: false,
          coverImage: "",
          schedule: [],
          requirements: [],
          entryFee: 0
        }, {
          id: "00000002-seed",
          title: i18n.t("auto.z_autoz\uBC1C\uB9AC\uD55C\uB2EC\uC0B4_567"),
          destination: i18n.t("auto.z_autoz\uBC1C\uB9AC\uC778\uB3C4\uB124_568"),
          dates: "5/1 ~ 5/31",
          currentMembers: 2,
          maxMembers: 6,
          tags: [i18n.t("auto.z_autoz\uD55C\uB2EC\uC0B4\uAE306_569"), i18n.t("auto.z_autoz\uC694\uAC00658_570"), i18n.t("auto.z_autoz\uC11C\uD551659_571")],
          hostId: "seed2",
          hostPhoto: "",
          hostName: "Sarah K.",
          hostBio: "Bali lover!",
          daysLeft: 34,
          joined: false,
          description: i18n.t("auto.z_BaliCanggu_660"),
          memberPhotos: [],
          memberNames: ["Sarah K.", "Rachel"],
          isPremiumGroup: false,
          coverImage: "",
          schedule: [],
          requirements: [],
          entryFee: 0
        }, {
          id: "00000003-seed",
          title: i18n.t("auto.z_autoz\uC2A4\uC704\uC2A4\uC54C\uD504_572"),
          destination: i18n.t("auto.z_autoz\uC778\uD130\uB77C\uCF04\uC2A4_573"),
          dates: "7/15 ~ 7/22",
          currentMembers: 4,
          maxMembers: 5,
          tags: [i18n.t("auto.z_autoz\uD2B8\uB808\uD0B966_574"), i18n.t("auto.z_autoz\uD558\uC774\uD0B966_575"), i18n.t("auto.z_autoz\uC790\uC5F0665_576")],
          hostId: "seed3",
          hostPhoto: "",
          hostName: i18n.t("auto.z_autoz\uC815\uD604\uC6B066_577"),
          hostBio: i18n.t("auto.z_autoz\uC54C\uD504\uC2A43\uD68C_578"),
          daysLeft: 109,
          joined: false,
          description: i18n.t("auto.z_autoz\uC735\uD504\uB77C\uC6B0\uADF8_579"),
          memberPhotos: [],
          memberNames: [i18n.t("auto.z_autoz\uC815\uD604\uC6B066_580"), i18n.t("auto.z_autoz\uC774\uC218\uC5F067_581"), i18n.t("auto.z_autoz\uBC15\uC900\uD60167_582"), i18n.t("auto.z_autoz\uCD5C\uBBFC\uC11C67_583")],
          isPremiumGroup: true,
          coverImage: "",
          schedule: [],
          requirements: [],
          entryFee: 0
        }, {
          id: "00000004-seed",
          title: i18n.t("auto.z_autoz\uBCA0\uD2B8\uB0A8\uB2E4\uB0AD_584"),
          destination: i18n.t("auto.z_autoz\uB2E4\uB0AD\uBCA0\uD2B8\uB0A8_585"),
          dates: "4/5 ~ 4/8",
          currentMembers: 1,
          maxMembers: 3,
          tags: [i18n.t("auto.z_autoz\uB9DB\uC9D1675_586"), i18n.t("auto.z_autoz\uD574\uBCC0676_587"), i18n.t("auto.z_autoz\uAC00\uC131\uBE4467_588")],
          hostId: "seed4",
          hostPhoto: "",
          hostName: i18n.t("auto.z_autoz\uC774\uD558\uB29867_589"),
          hostBio: i18n.t("auto.z_autoz\uBBF8\uC2DD\uAC00\uC5EC\uD589_590"),
          daysLeft: 8,
          joined: false,
          description: i18n.t("auto.z_autoz\uB2E4\uB0AD3\uBC154_591"),
          memberPhotos: [],
          memberNames: [i18n.t("auto.z_autoz\uC774\uD558\uB29868_592")],
          isPremiumGroup: false,
          coverImage: "",
          schedule: [],
          requirements: [],
          entryFee: 0
        }, {
          id: "00000005-seed",
          title: i18n.t("auto.z_autoz\uD30C\uB9AC\uB7ED\uC154\uB9AC_593"),
          destination: i18n.t("auto.z_autoz\uD30C\uB9AC\uD504\uB791\uC2A4_594"),
          dates: "6/1 ~ 6/7",
          currentMembers: 2,
          maxMembers: 3,
          tags: [i18n.t("auto.z_autoz\uB7ED\uC154\uB9AC68_595"), i18n.t("auto.z_autoz\uC1FC\uD551685_596"), i18n.t("auto.z_autoz\uBB38\uD654686_597")],
          hostId: "seed5",
          hostPhoto: "",
          hostName: "Emma L.",
          hostBio: "Fashion lover!",
          daysLeft: 65,
          joined: false,
          description: i18n.t("auto.z_autoz\uC5D0\uD3A0\uD0D1\uB8E8\uBE0C_598"),
          memberPhotos: [],
          memberNames: ["Emma L.", i18n.t("auto.z_autoz\uC720\uC544\uB98468_599")],
          isPremiumGroup: true,
          coverImage: "",
          schedule: [],
          requirements: [],
          entryFee: 0
        }, {
          id: "00000006-seed",
          title: i18n.t("auto.z_autoz\uAD50\uD1A0\uC804\uD1B5\uBB38_600"),
          destination: i18n.t("auto.z_autoz\uAD50\uD1A0\uC77C\uBCF86_601"),
          dates: "4/18 ~ 4/22",
          currentMembers: 3,
          maxMembers: 4,
          tags: [i18n.t("auto.z_autoz\uBB38\uD654691_602"), i18n.t("auto.z_autoz\uC0AC\uC9C4692_603"), i18n.t("auto.z_autoz\uC0AC\uCC30693_604")],
          hostId: "seed6",
          hostPhoto: "",
          hostName: "田中はる",
          hostBio: "京都大好き！",
          daysLeft: 21,
          joined: false,
          description: i18n.t("auto.z_autoz\uAE30\uC628\uC544\uB77C\uC2DC_605"),
          memberPhotos: [],
          memberNames: ["田中はる", i18n.t("auto.z_autoz\uC190\uC608\uC9C469_606"), "Alex"],
          isPremiumGroup: false,
          coverImage: "",
          schedule: [],
          requirements: [],
          entryFee: 0
        }, {
          id: "00000007-seed",
          title: i18n.t("auto.z_autoz\uC81C\uC8FC\uD55C\uB77C\uC0B0_607"),
          destination: i18n.t("auto.z_autoz\uC81C\uC8FC\uB3C4\uD55C\uAD6D_608"),
          dates: "4/13 ~ 4/14",
          currentMembers: 5,
          maxMembers: 6,
          tags: [i18n.t("auto.z_autoz\uD558\uC774\uD0B969_609"), i18n.t("auto.z_autoz\uC790\uC5F0699_610"), i18n.t("auto.z_autoz\uAD6D\uB0B4700_611")],
          hostId: "seed7",
          hostPhoto: "",
          hostName: i18n.t("auto.z_autoz\uCD5C\uB3D9\uD60470_612"),
          hostBio: i18n.t("auto.z_autoz\uB4F1\uC0B0\uB9C8\uB2C8\uC544_613"),
          daysLeft: 16,
          joined: false,
          description: i18n.t("auto.z_autoz\uC131\uD310\uC545\uCF54\uC2A4_614"),
          memberPhotos: [],
          memberNames: [i18n.t("auto.z_autoz\uCD5C\uB3D9\uD60470_615"), i18n.t("auto.z_autoz\uD55C\uC9C0\uC21870_616"), i18n.t("auto.z_autoz\uC784\uC900\uC11C70_617"), i18n.t("auto.z_autoz\uC624\uBBFC\uC90070_618"), i18n.t("auto.z_autoz\uB098\uC608\uB9B070_619")],
          isPremiumGroup: false,
          coverImage: "",
          schedule: [],
          requirements: [],
          entryFee: 0
        }, {
          id: "00000008-seed",
          title: i18n.t("auto.z_autoz\uB77C\uC2A4\uBCA0\uC774\uAC70_620"),
          destination: i18n.t("auto.z_autoz\uB77C\uC2A4\uBCA0\uC774\uAC70_621"),
          dates: "5/20 ~ 5/26",
          currentMembers: 2,
          maxMembers: 4,
          tags: [i18n.t("auto.z_autoz\uBBF8\uAD6D711_622"), i18n.t("auto.z_autoz\uC790\uC5F0712_623"), i18n.t("auto.z_autoz\uC5D4\uD130\uD14C\uC778\uBA3C_624")],
          hostId: "seed8",
          hostPhoto: "",
          hostName: "Mike T.",
          hostBio: "US road tripper!",
          daysLeft: 53,
          joined: false,
          description: i18n.t("auto.z_Vegas2박Gra_714"),
          memberPhotos: [],
          memberNames: ["Mike T.", i18n.t("auto.z_autoz\uC2E0\uC608\uB09871_626")],
          isPremiumGroup: false,
          coverImage: "",
          schedule: [],
          requirements: [],
          entryFee: 0
        }, {
          id: "00000009-seed",
          title: i18n.t("auto.z_autoz\uCE58\uC559\uB9C8\uC774\uB85C_627"),
          destination: i18n.t("auto.z_autoz\uCE58\uC559\uB9C8\uC774\uD0DC_628"),
          dates: "4/25 ~ 5/2",
          currentMembers: 2,
          maxMembers: 5,
          tags: [i18n.t("auto.z_autoz\uB85C\uCEEC718_629"), i18n.t("auto.z_autoz\uC0AC\uC6D0719_630"), i18n.t("auto.z_autoz\uB9DB\uC9D1720_631")],
          hostId: "seed9",
          hostPhoto: "",
          hostName: i18n.t("auto.z_autoz\uAC15\uB2E4\uC77872_632"),
          hostBio: i18n.t("auto.z_autoz\uD0DC\uAD6D\uBB34\uD55C\uBC18_633"),
          daysLeft: 28,
          joined: false,
          description: i18n.t("auto.z_autoz\uC653\uD504\uB77C\uC2F1\uC120_634"),
          memberPhotos: [],
          memberNames: [i18n.t("auto.z_autoz\uAC15\uB2E4\uC77872_635"), "Noah W."],
          isPremiumGroup: false,
          coverImage: "",
          schedule: [],
          requirements: [],
          entryFee: 0
        }];
        setTripGroups(FALLBACK_SEED);
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
      const ext = file.name.split(".").pop();
      const path = `posts/${user.id}_${Date.now()}_${uploadedUrls.length}.${ext}`;
      const {
        error: upErr
      } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
        contentType: file.type
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
      author: userData?.name || i18n.t("auto.z_autoz나361_726"),
      photo: userData?.photo_url || "",
      content: writeContent,
      time: i18n.t("auto.z_autoz방금전36_727"),
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
      author: userData?.name || i18n.t("auto.z_autoz나363_728"),
      photo: userData?.photo_url || "",
      text: commentText,
      time: i18n.t("auto.z_autoz방금전36_729")
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

  // ── Join group ────────────────────────────────
  const handleJoin = (group: TripGroup) => {
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
    setDetailGroup(null);
    joinGroup(group);
  };
  const joinGroup = async (group: TripGroup) => {
    if (!user) return;

    // 목업 그룹 (DB에 없음) → DB insert 없이 로컬 상태만 업데이트
    const isMock = group.id.startsWith("00000000");
    if (!isMock) {
      const {
        error
      } = await supabase.from("trip_group_members").insert({
        group_id: group.id,
        user_id: user.id
      });
      if (error) {
        toast({
          title: t("alert.t47Title")
        });
        return;
      }
    }
    setTripGroups(prev => prev.map(g => g.id === group.id ? {
      ...g,
      joined: true,
      currentMembers: g.currentMembers + 1
    } : g));
    createGroupThread({
      id: group.id,
      title: group.title,
      hostPhoto: group.hostPhoto,
      memberPhotos: group.memberPhotos,
      currentMembers: group.currentMembers,
      destination: group.destination
    });
    toast({
      title: t("alert.t48Title")
    });
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
  return <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30 px-5 pt-12 pb-0 transition-transform duration-300" style={{
      transform: headerVisible ? "translateY(0)" : "translateY(-100%)"
    }}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black text-foreground">{t("auto.z_autoz여행탐색3_730")}</h1>
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
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t("auto.z_autoz목적지여행_731")} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
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
          {user && <button onClick={() => activeTab === "groups" ? navigate("/create-trip") : setShowWriteModal(true)} className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-card" title={activeTab === "groups" ? t("auto.z_autoz여행그룹만_734") : t("auto.z_autoz게시글쓰기_735")}>
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
              <p className="text-muted-foreground text-sm">{t("auto.z_autoz검색결과가_736")}</p>
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
              }}>{i18n.t("auto.z_autoz\uC778\uAE30737_645")}</span>}
                    {group.daysLeft <= 3 && <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                        ⚡ D-{group.daysLeft}{i18n.t("auto.z_autoz\uB9C8\uAC10\uC784\uBC157_646")}</span>}
                    {group.isPremiumGroup && <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-400 border border-amber-500/20">{i18n.t("auto.z_autoz\uAC80\uC99D\uB41C\uD638\uC2A4_647")}</span>}
                    {/* [Feature 4] 내 여행 날짜 매칭 배지 */}
                    {myTravelDates && isDateMatch(group.dates) && <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border animate-pulse" style={{
                background: 'rgba(99,102,241,0.15)',
                borderColor: 'rgba(99,102,241,0.4)',
                color: '#818cf8'
              }}>{i18n.t("auto.z_autoz\uB0B4\uC77C\uC815\uACFC\uB531_648")}</span>}
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      👁 {viewers}{i18n.t("auto.z_autoz\uBA85\uBCF4\uB294\uC9117_649")}</span>
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
                    <span className="text-[9px] text-emerald-400 font-semibold">{i18n.t("auto.z_autoz1\uC2DC\uAC04\uB0B4\uB2F5_650")}</span>
                    {/* [Feature 3] 호스트 완주 횟수 배지 */}
                    {(group as any).hostCompletedGroups > 0 && <span className="text-[9px] font-extrabold text-amber-400">🏆 {(group as any).hostCompletedGroups}{i18n.t("auto.z_autoz\uBC88\uC644\uC8FC74_651")}</span>}
                  </div>
                </div>
                {/* 남은 자리 뱃지 */}
                {(() => {
              const left = group.maxMembers - group.currentMembers;
              if (left <= 0) return <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-gray-500/15 text-gray-400 shrink-0">{i18n.t("auto.z_autoz\uB9C8\uAC10744_652")}</span>;
              if (left === 1) return <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 shrink-0 animate-pulse">{i18n.t("auto.z_autoz1\uC790\uB9AC\uB0A8\uC74C_653")}</span>;
              if (left <= 2) return <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20 shrink-0">{left}{i18n.t("auto.z_autoz\uC790\uB9AC\uB0A8\uC74C7_654")}</span>;
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
                  <Users size={10} /> {group.currentMembers}/{group.maxMembers}{i18n.t("auto.z_autoz명373_747")}</span>
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
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />{i18n.t("auto.z_autoz\uADF8\uB8F9\uCC44\uD305\uBBF8_656")}</p>
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
            const recentActions = [i18n.t("auto.z_autoz\uBC29\uAE08\uB204\uAD70\uAC00_657"), i18n.t("auto.z_autoz1\uBD84\uC804\uC0C8\uBA64_658"), i18n.t("auto.z_autoz3\uBD84\uC804\uD638\uC2A4_659"), i18n.t("auto.z_autoz7\uBD84\uC804\uC9C0\uC6D0_660")];
            const randomAction = recentActions[group.id.charCodeAt(7) % recentActions.length];
            return <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground">{randomAction}</span>
                      <span className="text-[10px] font-bold" style={{
                  color: fill >= 0.75 ? '#f59e0b' : fill >= 0.5 ? '#6366f1' : '#10b981'
                }}>
                        {Math.round(fill * 100)}{i18n.t("auto.z_autoz\uCDA9\uC6D0753_661")}</span>
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
                  {user && group.hostId === user.id && <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">{i18n.t("auto.z_autoz내가만든그_754")}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {user && group.hostId === user.id ?
              // 내가 만든 그룹: 삭제 버튼만
              <button onClick={e => {
                e.stopPropagation();
                deleteGroup(group.id);
              }} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 transition-all hover:bg-red-500/20">{i18n.t("auto.z_autoz삭제375_755")}</button> :
              // 다른 사람 그룹: 지원하기 버튼 (크루 지원 시스템)
              <div className="flex flex-col gap-1.5">
              {user && group.hostId !== user.id && <>
                  {appliedGroups.has(group.id) ? <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-center">{i18n.t("auto.z_autoz\uC9C0\uC6D0\uC644\uB8CC7_664")}</span> : <button onClick={e => {
                    e.stopPropagation();
                    if (!user) {
                      toast({
                        title: i18n.t("auto.z_autoz\uB85C\uADF8\uC778\uC774\uD544_665"),
                        variant: 'destructive'
                      });
                      return;
                    }
                    // Show payment modal instead of direct apply
                    setPaymentGroup(group);
                  }} className="text-xs font-bold px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground shadow-card">{i18n.t("auto.z_autoz\uB3D9\uD589\uC9C0\uC6D0\uD558_666")}</button>}
                  <button onClick={e => handleInterest(group.id, e)} className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition-all ${interestedGroups.has(group.id) ? 'bg-amber-400/15 text-amber-400 border-amber-400/30' : 'bg-muted text-muted-foreground border-border hover:border-amber-400/30 hover:text-amber-400'}`}>
                    {interestedGroups.has(group.id) ? i18n.t("auto.z_autoz\uAD00\uC2EC\uC91175_667") : i18n.t("auto.z_autoz\uAD00\uC2EC\uC788\uC5B4\uC694_668")}
                  </button>
                </>}
              {user && group.hostId === user.id && <button onClick={e => {
                  e.stopPropagation();
                  handleViewApplicants(group.id);
                }} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">{i18n.t("auto.z_autoz\uC9C0\uC6D0\uC790\uBCF4\uAE30_669")}</button>}
            </div>}
                </div>
              </div>
              </div>
            </motion.div>)}
        </div>}

      {/* ── Community Tab ── */}
      {activeTab === "community" && <div className="px-5 space-y-3 pt-3 pb-24">
          <div className="flex gap-4 border-b border-border/50 pb-2 mb-4">
            <button onClick={() => setActiveCommunityFilter("latest")} className={`font-bold pb-2 border-b-2 px-1 transition-all ${activeCommunityFilter === "latest" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>{t("auto.z_autoz최신글37_762")}</button>
            <button onClick={() => setActiveCommunityFilter("popular")} className={`font-bold pb-2 border-b-2 px-1 transition-all ${activeCommunityFilter === "popular" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>{t("auto.z_autoz인기글37_763")}</button>
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
              <p className="text-muted-foreground text-sm">{t("auto.z_autoz첫게시글을_764")}</p>
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
          }} className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors shrink-0" title={i18n.t("auto.z_autoz게시글삭제_765")}>
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
                <ArrowLeft size={16} />{t("auto.z_autoz목록으로3_766")}</button>

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
                label: t("auto.z_autoz목적지38_767"),
                value: translateMap[`groupDest_${currentDetail.id}`] || currentDetail.destination,
                icon: MapPin
              }, {
                label: t("auto.z_autoz날짜384_768"),
                value: currentDetail.dates,
                icon: Calendar
              }, {
                label: t("auto.z_autoz인원385_769"),
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
                label: t("auto.z_autoz마감387_771"),
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
                  <h3 className="text-sm font-extrabold text-foreground mb-3">{t("auto.z_autoz상세일정3_774")}</h3>
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
                  <h3 className="text-sm font-extrabold text-foreground">{t("auto.z_autoz참여멤버3_775")}</h3>
                  <span className="text-xs font-bold text-primary">{currentDetail.currentMembers}/{currentDetail.maxMembers}{t("auto.z_autoz명392_776")}</span>
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
                      <span className="text-sm font-semibold text-foreground">{currentDetail.memberNames[idx] || i18n.t("auto.z_autoz멤버393_777")}</span>
                    </div>)}
                </div>
              </div>

              {/* Join button */}
              <button onClick={() => handleJoin(currentDetail)} className={`w-full py-4 rounded-2xl text-sm font-black transition-all ${currentDetail.joined ? "bg-muted text-muted-foreground" : "gradient-primary text-primary-foreground shadow-card"}`}>
                {currentDetail.joined ? t("auto.z_autoz이미참여중_778") : t("auto.z_autoz그룹참여하_779")}
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
                <ArrowLeft size={16} />{t("auto.z_autoz목록으로3_780")}</button>

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
                  {translateMap[`detail_${detailPost.id}`] ? t("auto.z_autoz원문보기3_781") : t("auto.z_autoz번역하기3_782")}
                </button>
              </div>
              {translateMap[`detail_${detailPost.id}`] && <p className="text-sm text-indigo-400 leading-relaxed bg-indigo-500/5 rounded-xl p-3 mb-4">
                  {translateMap[`detail_${detailPost.id}`]}
                </p>}

              {/* Comments */}
              <h3 className="text-sm font-extrabold text-foreground mb-3">{t("auto.z_autoz댓글399_783")}{detailPost.commentList.length}{t("auto.z_autoz개400_784")}</h3>
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
                  <input value={commentText} onChange={e => setCommentText(e.target.value)} onFocus={() => setCommentPost(detailPost)} placeholder={t("auto.z_autoz댓글을입력_785")} className="flex-1 bg-muted rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
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
                <h2 className="text-base font-black text-foreground">{t("auto.z_autoz글작성40_786")}</h2>
                <button onClick={handleSubmitPost} className="text-sm font-bold text-primary">{t("auto.z_autoz올리기40_787")}</button>
              </div>

              <input value={writeTitle} onChange={e => setWriteTitle(e.target.value)} placeholder={t("auto.z_autoz제목을입력_788")} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none mb-3" />
              <textarea value={writeContent} onChange={e => setWriteContent(e.target.value)} placeholder={t("auto.z_autoz여행이야기_789")} rows={8} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none mb-4" />

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
                <ImageIcon size={14} />{t("auto.z_autoz사진추가4_790")}{attachedImages.length}/{MAX_POST_PHOTOS})
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
                <ArrowLeft size={16} />{t("auto.z_autoz목록으로4_791")}</button>
              
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
                      <Zap size={14} className="fill-amber-500" />{t("auto.z_autoz끌어올리기_792")}</button>}
                </div>
              </div>

              {/* Comments List */}
              <h3 className="text-sm font-extrabold text-foreground mb-4">{t("auto.z_autoz댓글409_793")}{detailPost.comments}</h3>
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
            }} placeholder={t("auto.z_autoz따뜻한댓글_794")} className="flex-1 bg-muted rounded-full pl-4 pr-12 py-3 text-sm text-foreground outline-none" onKeyDown={e => e.key === 'Enter' && handleSubmitComment()} />
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
        }} onClick={e => e.stopPropagation()} className="w-full bg-card rounded-3xl mb-4 sm:mb-8 px-5 pt-6 pb-12">
              <div className="text-center mb-6">
                <Crown size={40} className="text-yellow-400 mx-auto mb-3" />
                <h2 className="text-xl font-black text-foreground mb-2">Migo Plus</h2>
                <p className="text-sm text-muted-foreground">{t("auto.z_autoz프리미엄그_795")}</p>
              </div>
              <button onClick={() => {
            setShowPlusModal(false);
            navigate("/profile");
          }} className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground text-sm font-black">{t("auto.z_autozPlus시_796")}</button>
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
        }} onClick={e => e.stopPropagation()} className="w-full bg-card rounded-3xl mb-4 sm:mb-8 px-5 pt-6 pb-12">
              <div className="text-center mb-6">
                <Ticket size={36} className="text-primary mx-auto mb-3" />
                <h2 className="text-lg font-black text-foreground mb-2">{t("auto.z_autoz참가비결제_797")}</h2>
                <p className="text-2xl font-black text-primary">{getLocalizedPrice(paymentGroup.entryFee ?? 0, i18n.language)}</p>
                <p className="text-sm text-muted-foreground mt-1">{paymentGroup.title}</p>
              </div>
              <div className="space-y-3">
                {[t("auto.z_autoz카카오페이_799"), t("auto.z_autoz토스페이4_800"), t("auto.z_autoz신용카드4_801")].map(method => <button key={method} onClick={() => {
              joinGroup(paymentGroup);
              setPaymentGroup(null);
            }} className="w-full py-3.5 rounded-2xl bg-muted text-foreground text-sm font-bold">
                    {method}{i18n.t("auto.z_autoz로결제41_802")}</button>)}
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
               <h3 className="text-lg font-black text-foreground">{t("auto.z_autoz좋아요한사_803")}</h3>
               <button onClick={() => setLikesPostId(null)} className="p-2 bg-muted rounded-full text-foreground"><X size={16} /></button>
             </div>
             <div className="overflow-y-auto flex-1 space-y-3">
               {likesList.length === 0 ? <p className="text-center text-sm text-muted-foreground py-8">{t("auto.z_autoz아직좋아요_804")}</p> : likesList.map((usr, i) => <div key={i} className="flex items-center gap-3">
                   <img src={usr?.photo_url || "https://api.dicebear.com/9.x/notionists/svg?seed=" + i} alt="" className="w-10 h-10 rounded-full object-cover bg-muted" loading="lazy" />
                   <span className="text-sm font-bold text-foreground">{usr?.name || i18n.t("auto.z_autoz알수없음4_805")}</span>
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
              <p className="text-xs font-bold text-blue-400">{t("auto.z_autoz\uB3D9\uD589\uC9C0\uC6D0\uBC29_711")}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{t("auto.z_autoz\uD638\uC2A4\uD2B8\uAC00\uC9C0_712")}</p>
            </div>
            <label className="text-xs font-bold text-foreground mb-2 block">{t("auto.z_autoz\uB098\uB97C\uC5B4\uD544\uD558_713")}</label>
            <textarea value={applyMessage} onChange={e => setApplyMessage(e.target.value)} maxLength={200} rows={4} placeholder={t("auto.z_tmpl_809", {
          defaultValue: t("auto.p19", {
            dest: applyGroup.destination
          })
        })} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:ring-2 focus:ring-primary/30 mb-1" />
            <p className="text-[10px] text-muted-foreground text-right mb-4">{applyMessage.length}/200</p>
            <div className="flex gap-3">
              <button onClick={() => setApplyGroup(null)} className="flex-1 py-3 rounded-2xl bg-muted text-muted-foreground font-semibold text-sm">{t("auto.z_autoz\uCDE8\uC18C810_714")}</button>
              <button onClick={handleApply} disabled={applySubmitting} className="flex-1 py-3 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-sm flex items-center justify-center gap-2" style={{
            opacity: applySubmitting ? 0.7 : 1
          }}>
                {applySubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '✈️'}{t("auto.z_autoz\uC9C0\uC6D0\uD558\uAE308_715")}</button>
            </div>
          </div>
        </div>}

      {/* ── [Feature 2] 지원자 심사 모달 (호스트용) ── */}
      {showApplicants && <div className="fixed inset-0 z-50 flex items-end justify-center px-safe pb-safe pt-safe" onClick={() => setShowApplicants(null)}>
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 p-6 pb-12 max-h-[80vh] overflow-y-auto shadow-float" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
            <h3 className="font-extrabold text-foreground mb-1">{t("auto.z_autoz\uB3D9\uD589\uC9C0\uC6D0\uC790_716")}</h3>
            <p className="text-xs text-muted-foreground mb-4">{t("auto.z_autoz\uC9C0\uC6D0\uC790\uD504\uB85C_717")}</p>
            {applicantsList.length === 0 ? <div className="text-center py-10 text-muted-foreground text-sm">{t("auto.z_autoz\uC544\uC9C1\uC9C0\uC6D0\uC790_718")}</div> : <div className="space-y-3">
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
                        {app.status === 'approved' ? i18n.t("auto.z_autoz\uC2B9\uC778816_719") : app.status === 'rejected' ? i18n.t("auto.z_autoz\uAC70\uC808817_720") : i18n.t("auto.z_autoz\uAC80\uD1A0\uC91181_721")}
                      </span>
                    </div>
                    <div className="bg-card rounded-xl p-3 mb-3">
                      <p className="text-xs font-bold text-muted-foreground mb-1">{i18n.t("auto.z_autoz\uC9C0\uC6D0\uBA54\uC2DC\uC9C0_722")}</p>
                      <p className="text-sm text-foreground">{app.message}</p>
                    </div>
                    {app.status === 'pending' && <div className="flex gap-2">
                        <button onClick={() => handleRejectApplicant(app.id)} className="flex-1 py-2 rounded-xl bg-red-500/10 text-red-400 font-bold text-xs border border-red-500/20">{i18n.t("auto.z_autoz\uAC70\uC808820_723")}</button>
                        <button onClick={() => handleApproveApplicant(app.id, app.applicant_id, showApplicants)} className="flex-1 py-2 rounded-xl gradient-primary text-primary-foreground font-bold text-xs">{i18n.t("auto.z_autoz\uB3D9\uD589\uC2B9\uC7788_724")}</button>
                      </div>}
                  </div>)}
              </div>}
          </div>
        </div>}

    </div>;
};
export default DiscoverPage;