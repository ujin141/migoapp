import i18n from "@/i18n";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Settings, ChevronLeft, ChevronRight, MapPin, Calendar, Globe, Camera, LogOut, Shield, Bell, HelpCircle, X, Check, Edit2, Plus, Heart, MessageCircle, Star, Users, Plane, Handshake, Crown, AlertTriangle, ShoppingBag, FileText, Eye, Zap, Navigation, Lock, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import SOSModal from "@/components/SOSModal";
import { useSubscription } from "@/context/SubscriptionContext";
import MigoPlusModal from "@/components/MigoPlusModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import TutorialOverlay, { useTutorial } from "@/components/TutorialOverlay";
import TrustVerifyModal from "@/components/TrustVerifyModal";
import { compressImage } from "@/lib/imageCompression";
import ProfileViewsModal from "@/components/ProfileViewsModal";
import { EditProfileModal } from "./profile/EditProfileModal";
import { MatchDetailModal, TripDetailModal, MeetingDetailModal } from "./profile/ProfileDetailModals";
import { HelpModal, TermsModal, PrivacyPolicyModal, LicenseModal } from "./profile/ProfileLegalModals";
import { SettingsModal, NotificationModal, PrivacyModal, LogoutConfirmModal, DeleteAccountConfirmModal } from "./profile/ProfileSettingsModals";
import StreakBadge from "@/components/StreakBadge";
import ActivityReport from "@/components/ActivityReport";
import { checkInStreak } from "@/lib/streakService";
import { getCurrentLocation } from "@/lib/locationService";
import StoryViewer from "@/components/StoryViewer";
const ProfilePage = () => {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const {
    isPlus,
    boostsCount,
    startBoost,
    boostActive,
    boostSecondsLeft,
    canDedicatedSupport,
    canViewLikers,
  } = useSubscription();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showMatchDetail, setShowMatchDetail] = useState(false);
  const [showTripDetail, setShowTripDetail] = useState(false);
  const [showMeetingDetail, setShowMeetingDetail] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPlusModal, setShowPlusModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyPolicyModal, setShowPrivacyPolicyModal] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showProfileViews, setShowProfileViews] = useState(false);
  const [showRefundPolicyModal, setShowRefundPolicyModal] = useState(false);
  const [boostJustActivated, setBoostJustActivated] = useState(false);

  // ─── 실시간 DB 데이터 state ───
  const [matchedUsers, setMatchedUsers] = useState<any[]>([]);
  const [myTrips, setMyTrips] = useState<any[]>([]);
  const [myMeetings, setMyMeetings] = useState<any[]>([]);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [likers, setLikers] = useState<any[]>([]); // 나를 좋아한 사람들
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [selectedLiker, setSelectedLiker] = useState<any | null>(null);
  const [selectedLikerIdx, setSelectedLikerIdx] = useState<number>(0);

  // 풀스크린 뷰어 열릴 때 바텀 nav 숨기기 (stacking context 우회)
  useLayoutEffect(() => {
    const nav = document.getElementById('migo-bottom-nav');
    if (!nav) return;
    nav.style.display = selectedLiker ? 'none' : '';
    return () => { nav.style.display = ''; };
  }, [selectedLiker]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
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
  const [startingChat, setStartingChat] = useState(false);
  // 스트릭
  const [streakData, setStreakData] = useState(() => checkInStreak().data);
  const {
    user,
    loading: authLoading,
    refreshPhotoUrl,
    signOut
  } = useAuth();

  // 인증 확인 완료 후 user 없으면 로그인 페이지로
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, user, navigate]);
  const {
    show: tutorialVisible,
    complete: completeTutorial,
    restart: restartTutorial
  } = useTutorial();
  const [showTutorialLocal, setShowTutorialLocal] = useState(false);
  const [name, setName] = useState(() => user?.name || user?.email?.split('@')[0] || "User");
  const [location, setLocation] = useState("");
  const [travelDates, setTravelDates] = useState("");
  const [bio, setBio] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string>(() => user?.photoUrl || "");
  const [travelMission, setTravelMission] = useState("");
  const [visitedCountries, setVisitedCountries] = useState<string[]>([]);
  const [profilePhotos, setProfilePhotos] = useState<Array<{
    file?: File;
    url: string;
  }>>([]);
  const MAX_PROFILE_PHOTOS = 6;
  // 라이트박스 (사진 확대 뷰어)
  const [galleryOpen, setGalleryOpen] = useState<{ photos: string[]; startIdx: number } | null>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [userType, setUserType] = useState<string>("traveler");
  const [profileTheme, setProfileTheme] = useState<string>("default");
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);

  // ─ 테마 스타일 맵 ─
  const THEME_STYLES: Record<string, {
    cardBg: string;
    decorBg: string;
    avatarRing: string;
    accentText: string;
    badgeBg: string;
  }> = {
    default: {
      cardBg: 'bg-card border-border/50',
      decorBg: 'from-primary/12 via-primary/5',
      avatarRing: 'border-border/40',
      accentText: 'text-primary',
      badgeBg: 'bg-primary/10',
    },
    aurora: {
      cardBg: 'bg-gradient-to-br from-emerald-500/8 via-purple-500/5 to-card border-purple-400/30',
      decorBg: 'from-purple-500/20 via-emerald-500/10',
      avatarRing: 'border-purple-400/60',
      accentText: 'text-purple-600',
      badgeBg: 'bg-purple-500/10',
    },
    sunset: {
      cardBg: 'bg-gradient-to-br from-orange-500/8 via-pink-500/5 to-card border-pink-400/30',
      decorBg: 'from-orange-500/20 via-pink-500/10',
      avatarRing: 'border-pink-400/60',
      accentText: 'text-pink-600',
      badgeBg: 'bg-pink-500/10',
    },
    neon: {
      cardBg: 'bg-gradient-to-br from-blue-500/8 via-cyan-500/5 to-card border-cyan-400/30',
      decorBg: 'from-blue-500/20 via-cyan-500/10',
      avatarRing: 'border-cyan-400/60',
      accentText: 'text-cyan-600',
      badgeBg: 'bg-cyan-500/10',
    },
    midnight: {
      cardBg: 'bg-gradient-to-br from-slate-800/80 via-slate-700/40 to-card border-slate-600/40',
      decorBg: 'from-slate-700/30 via-slate-600/15',
      avatarRing: 'border-slate-500/60',
      accentText: 'text-slate-300',
      badgeBg: 'bg-slate-700/40',
    },
  };
  const theme = THEME_STYLES[profileTheme] ?? THEME_STYLES.default;

  // 최대 5초 후 profileLoading 강제 해제 (무한 스켈레톤 방지)
  useEffect(() => {
    const timeout = setTimeout(() => setProfileLoading(false), 5000);
    return () => clearTimeout(timeout);
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileRef2 = useRef<HTMLInputElement>(null); // Edit modal multi-photo

  // ─ 라이커와 1:1 채팅 시작 (Plus 전용) ─
  const startChatWithLiker = async (likerId: string) => {
    if (!user) return;
    setStartingChat(true);
    try {
      // 1. 내 thread 목록 조회
      const { data: myThreads } = await supabase
        .from('chat_members')
        .select('thread_id')
        .eq('user_id', user.id);
      const myThreadIds = (myThreads || []).map((m: any) => m.thread_id);

      let threadId: string | null = null;

      // 2. 상대방과 공통 1:1 thread 있는지 확인
      if (myThreadIds.length > 0) {
        const { data: likerThreads } = await supabase
          .from('chat_members')
          .select('thread_id')
          .eq('user_id', likerId)
          .in('thread_id', myThreadIds);
        if (likerThreads && likerThreads.length > 0) {
          const ids = likerThreads.map((t: any) => t.thread_id);
          const { data: thread } = await supabase
            .from('chat_threads')
            .select('id, is_group')
            .in('id', ids)
            .eq('is_group', false)
            .maybeSingle();
          if (thread) threadId = thread.id;
        }
      }

      // 3. 없으면 새 1:1 thread 생성
      if (!threadId) {
        const { data: newThread } = await supabase
          .from('chat_threads')
          .insert({ is_group: false })
          .select('id')
          .single();
        if (newThread) {
          await supabase.from('chat_members').insert([
            { thread_id: newThread.id, user_id: user.id },
            { thread_id: newThread.id, user_id: likerId },
          ]);
          threadId = newThread.id;
        }
      }

      if (threadId) {
        setSelectedLiker(null);
        navigate('/chat', { state: { threadId } });
      }
    } catch (e) {
      console.error(t("auto.g_0896", "채팅 시작 실패:"), e);
      toast({ title: t("auto.g_0046", "채팅 시작 실패"), description: t("auto.g_0047", "잠시 후 다시 시도해주세요."), variant: 'destructive' });
    } finally {
      setStartingChat(false);
    }
  };

  // ─ Supabase Storage 이미지 업로드 ─
  const uploadPhoto = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const compressedFile = await compressImage(file);
      const ext = compressedFile.name.split(".").pop();
      const filePath = `${user.id}.${ext}`;
      const {
        error: upErr
      } = await supabase.storage.from("avatars").upload(filePath, compressedFile, {
        upsert: true,
        contentType: compressedFile.type
      });
      if (upErr) throw upErr;
      const {
        data
      } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const cleanUrl = data.publicUrl.replace(/[?&]t=\d+/, ""); // 클린 URL
      const displayUrl = `${cleanUrl}?t=${Date.now()}`; // 표시용
      setPhotoUrl(displayUrl);
      // DB에는 캐시 버스팅 없는 클린 URL 저장
      await supabase.from("profiles").update({
        photo_url: cleanUrl
      }).eq("id", user.id);
      // 전 앱에서 즉시 동기화
      if (refreshPhotoUrl) await refreshPhotoUrl();
      toast({
        title: t("profilePage.photoChanged")
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("profilePage.uploadFail");
      toast({
        title: t("profilePage.uploadFail"),
        description: msg,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // ─ 프로필 저장 ─
  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // 새로 추가된 사진만 업로드
      const uploadedUrls: string[] = profilePhotos.filter(p => !p.file) // 기존 URL 유지
      .map(p => p.url);
      for (const p of profilePhotos.filter(ph => !!ph.file)) {
        const file = p.file!;
        const compressedFile = await compressImage(file);
        const ext = compressedFile.name.split(".").pop();
        const path = `${user.id}_${Date.now()}_${uploadedUrls.length}.${ext}`;
        const {
          error: upErr
        } = await supabase.storage.from("avatars").upload(path, compressedFile, {
          upsert: true,
          contentType: compressedFile.type
        });
        if (!upErr) {
          const {
            data
          } = supabase.storage.from("avatars").getPublicUrl(path);
          // BUG-11 fix: DB에는 클린 URL 저장 (timestamp 제거 → CDN 캐시 히트율 향상)
          uploadedUrls.push(data.publicUrl);
        } else {
          console.error(t("auto.g_0897", "사진업로드"), upErr);
        }
      }
      const mainPhoto = uploadedUrls[0] || photoUrl;
      const updatePayload = {
        name,
        location,
        bio,
        interests: tags,
        travel_dates: travelDates,
        photo_url: mainPhoto,
        photo_urls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
        travel_mission: travelMission,
        visited_countries: visitedCountries,
        profile_theme: profileTheme,
        // BUG-19 fix: updated_at은 DB 트리거가 자동 설정 (클라이언트 시계 불일치 방지)
      };
      const {
        error,
        data: saved
      } = await supabase.from("profiles").update(updatePayload).eq("id", user.id).select().single();
      if (error) {
        console.error(t("auto.g_0898", "프로필저장"), error);
        throw error;
      }

      // 성공 시 로컬 상태 즉시 업데이트
      if (uploadedUrls[0]) setPhotoUrl(uploadedUrls[0]);
      setShowEditModal(false);
      toast({
        title: t("profilePage.saved")
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Save failed";
      toast({
        title: "Save failed",
        description: msg,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Fetch real profile
  useEffect(() => {
    if (!user) {
      setProfileLoading(false);
      return;
    }
    let isMounted = true;
    setProfileLoading(true);
    const fetchProfile = async (retryCount = 0) => {
      try {
        let {
          data,
          error
        } = await supabase.from('profiles').select(
          'id, name, location, bio, interests, photo_url, photo_urls, travel_dates, travel_mission, visited_countries, user_type, profile_theme, notif_match, notif_chat, notif_group, plan, is_plus, earned_badges'
        ).eq('id', user.id).single();

        // DB에 이 유저 레코드가 없다면 (예: 트리거 실패, 레거시 계정) 빈 레코드 자동 생성으로 복구!
        if (error && error.code === 'PGRST116') {
          const fbName = user.name || user.email?.split('@')[0] || "User";
          await supabase.from('profiles').upsert([{
            id: user.id,
            name: fbName,
            email: user.email
          }]);
          const retry = await supabase.from('profiles').select(
            'id, name, location, bio, interests, photo_url, photo_urls, travel_dates, travel_mission, visited_countries, user_type, profile_theme, notif_match, notif_chat, notif_group, plan, is_plus, earned_badges'
          ).eq('id', user.id).single();
          data = retry.data;
          error = retry.error;
        }

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          if (!isMounted) return;
          setName(data.name || user?.name || user?.email?.split('@')[0] || "User");
          setLocation(data.location || "");
          setBio(data.bio || "");
          setTags(data.interests || []);
          if (data.photo_url) {
            // 캐시 버스팅
            const bustedUrl = data.photo_url.includes('?') ? data.photo_url.replace(/[?&]t=\d+/, `?t=${Date.now()}`) : `${data.photo_url}?t=${Date.now()}`;
            setPhotoUrl(bustedUrl);
          } else if (user.photoUrl) {
            setPhotoUrl(user.photoUrl);
          }
          setTravelMission(data.travel_mission || "");
          setTravelDates(data.travel_dates || "");
          setVisitedCountries(data.visited_countries || []);
          const urls: string[] = data.photo_urls || (data.photo_url ? [data.photo_url] : user.photoUrl ? [user.photoUrl] : []);
          setProfilePhotos(urls.map(url => ({
            url
          })));
          if (data.notif_match !== undefined) setNotifMatch(data.notif_match);
          if (data.notif_chat !== undefined) setNotifChat(data.notif_chat);
          if (data.notif_group !== undefined) setNotifGroup(data.notif_group);
          setUserType(data.user_type || "traveler");
          setProfileTheme(data.profile_theme || "default");
          setEarnedBadges(data.earned_badges || []);
        } else {
          if (!isMounted) return;
          setName(user?.name || user?.email?.split('@')[0] || "User");
          if (user?.photoUrl) setPhotoUrl(user.photoUrl);
        }
        if (isMounted) setProfileLoading(false);

        // ── GPS 역지오코딩 ── (보존된 location이 없거나 비어있으면 자동 실행)
        getCurrentLocation(false).then(async pos => {
          if (!pos) {
            if (!data?.location) setLocation(t("map.locationUnknown", "Location unknown"));
            return;
          }
          const { lat, lng } = pos;
          // 로컨스토리지에 GPS 좌표 저장 (매칭용 — DB 자동 업데이트는 하지 않음, Apple 5.1.2)
          localStorage.setItem('migo_my_lat', String(lat));
          localStorage.setItem('migo_my_lng', String(lng));
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=${i18n.language}`, {
                headers: {
                  'User-Agent': 'MigoApp/1.0'
                }
              });
              const geo = await res.json();
              const city = geo.address?.city || geo.address?.town || geo.address?.village || geo.address?.county || geo.address?.state || "";
              const country = geo.address?.country || "";
              const locationStr = city ? `${city}, ${country}` : country;
              if (locationStr) {
                setLocation(locationStr);
                // ❌ Apple Guideline 5.1.2: 자동 위치 DB 업데이트 제거 (수동 체크인만 허용)
                // await supabase.from('profiles').update({ location: locationStr, lat, lng }).eq('id', user.id);
              } else if (!data?.location) {
                setLocation(t("map.locationUnknown", "Location unknown"));
              }
            } catch {
              if (!data?.location) setLocation(t("map.locationUnknown", "Location unknown"));
            }
        });

        // ─── 매칭 목록: matches 테이블에서 양방향 ───
        try {
          const {
            data: matchData,
            error: matchErr
          } = await supabase.from('matches').select('user1_id, user2_id').or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`).limit(50);
          
          if (matchData) {
        const partnerIds = matchData.map((m: any) => m.user1_id === user.id ? m.user2_id : m.user1_id);
        if (partnerIds.length > 0) {
          const {
            data: partners
          } = await supabase.from('profiles').select('id, name, photo_url, location, interests, created_at').in('id', partnerIds);
          if (partners) {
            setMatchedUsers(partners.map((p: any) => ({
              id: p.id,
              name: p.name || "Unknown",
              photo: p.photo_url || "",
              location: p.location || '',
              date: new Intl.DateTimeFormat(i18n.language, {
                month: 'long',
                day: 'numeric'
              }).format(new Date(p.created_at)),
              tags: (p.interests || []).slice(0, 2),
              matched: true
            })));
          }
        }
        }
        } catch (e) {
          console.error("Match fetch err:", e);
        }

      // ─── 내 여행: trips 테이블 ───
      try {
      const {
        data: tripData
      } = await supabase.from('trips').select('id, destination, start_date, end_date, emoji').eq('user_id', user.id).order('start_date', {
        ascending: false
      }).limit(20);
      if (tripData) {
        const today = new Date().toISOString().split('T')[0];
        setMyTrips(tripData.map((tripItem: any) => {
          const status = tripItem.end_date < today
            ? t('profile.tripStatus.completed', 'Completed')
            : tripItem.start_date <= today && tripItem.end_date >= today
              ? t('profile.tripStatus.active', 'Active')
              : t('profile.tripStatus.upcoming', 'Upcoming');
          return {
            id: tripItem.id,
            title: `${tripItem.emoji || '✈️'} ${tripItem.destination}`,
            destination: tripItem.destination,
            dates: `${tripItem.start_date?.slice(5).replace('-', '/')} ~ ${tripItem.end_date?.slice(5).replace('-', '/')}`,
            members: 1,
            photo: "",
            status
          };
        }));
      }
      } catch(e) { console.error(e); }

      // ─── 만남 기록: meet_reviews 테이블 (내가 남긴 후기) ───
      try {
      const {
        data: meetData
      } = await supabase.from('meet_reviews').select('id, created_at, rating, tags, profiles!reviewed_id (name, photo_url)').eq('reviewer_id', user.id).order('created_at', {
        ascending: false
      }).limit(20);
      if (meetData) {
        setMyMeetings(meetData.map((m: any) => ({
          id: m.id,
          name: m.profiles?.name || "Unknown",
          photo: m.profiles?.photo_url || "",
          place: (m.tags || []).join(', ') || "–",
          date: new Intl.DateTimeFormat(i18n.language, {
            month: 'long',
            day: 'numeric',
            hour: 'numeric'
          }).format(new Date(m.created_at)),
          type: (m.tags || ['meeting'])[0],
          rating: m.rating || 5
        })));
      }
      } catch(e) { console.error(e); }

      // ─── 나를 좋아한 사람들: likes 테이블 ───
      try {
        const { data: likerData } = await supabase
          .from('likes')
          .select('from_user')
          .eq('to_user', user.id)
          .eq('kind', 'like')
          .order('created_at', { ascending: false })
          .limit(20);
        if (likerData && likerData.length > 0) {
          const likerIds = likerData.map((r: any) => r.from_user);
          const { data: likerProfiles } = await supabase
            .from('profiles')
            .select('id, name, photo_url, location, age, bio, languages, interests, mbti, nationality')
            .in('id', likerIds);
          if (likerProfiles) {
            const uniqueLikers = Array.from(new Map(likerProfiles.map((p: any) => [p.id, p])).values());
            setLikers(uniqueLikers.map((p: any) => ({
              id: p.id,
              name: p.name || t("match.traveler", "Traveler"),
              photo: p.photo_url || '',
              location: p.location || '',
              age: p.age || '',
              bio: p.bio || '',
              languages: p.languages || [],
              interests: p.interests || [],
              mbti: p.mbti || '',
              nationality: p.nationality || '',
            })));
          }
        }
      } catch(e) { console.error(e); }

      // ─── 내 게시글: posts 테이블 ───
      try {
      const {
        data: postData
      } = await supabase.from('posts').select('id, content, image_urls, image_url, created_at, post_likes(count), comments(id)').eq('author_id', user.id).order('created_at', {
        ascending: false
      }).limit(30);
        if (postData) {
          setMyPosts(postData.map((p: any) => ({
            id: p.id,
            author: data?.name || user?.name || t("profilePage.me", "Me"),
            authorId: user.id,
            photo: data?.photo_url || user?.photoUrl || "",
            content: p.content || '',
            images: p.image_urls || (p.image_url ? [p.image_url] : []),
            time: new Intl.DateTimeFormat(i18n.language, {
              month: 'long',
              day: 'numeric'
            }).format(new Date(p.created_at)),
            likes: p.post_likes?.[0]?.count || 0,
            comments: p.comments?.length || 0
          })));
        }
      } catch(e) { console.error(e); }
      } catch (err: any) {
        console.error("Profile Fetch Error:", err);
        if (retryCount < 3) {
          setTimeout(() => fetchProfile(retryCount + 1), 1000);
        } else {
          toast({
            title: t("auto.g_0048", "데이터 연동 지연"),
            description: t("auto.g_0049", "화면을 나갔다 다시 들어오시거나 조금 뒤에 다시 시도해주세요."),
            variant: "destructive"
          });
        }
      }
    };
    fetchProfile(0);
    return () => { isMounted = false; };
  }, [user?.id]);

  // Settings state
  const [notifMatch, setNotifMatch] = useState(true);
  const [notifChat, setNotifChat] = useState(true);
  const [notifGroup, setNotifGroup] = useState(true);
  const [profileVisible, setProfileVisible] = useState<"everyone" | "matched" | "none">("everyone");
  const [locationShare, setLocationShare] = useState(true);
  const [showSOS, setShowSOS] = useState(false);
  const menuItems = [{
    icon: Globe,
    label: t("profilePage.features.trips.label"),
    desc: t("profilePage.features.trips.desc"),
    action: () => navigate("/create-trip")
  }, {
    icon: Calendar,
    label: t("profilePage.features.calendar.label"),
    desc: t("profilePage.features.calendar.desc"),
    action: () => navigate("/trip-calendar")
  }, {
    icon: FileText,
    label: t("profilePage.features.diary.label"),
    desc: t("profilePage.features.diary.desc"),
    action: () => navigate("/meet-review")
  }, {
    icon: ShoppingBag,
    label: t("profilePage.features.market.label"),
    desc: t("profilePage.features.market.desc"),
    action: () => navigate("/marketplace")
  }, {
    icon: Shield,
    label: t("profilePage.features.trust.label"),
    desc: t("profilePage.features.trust.desc"),
    action: () => navigate("/verification"),
    highlight: true
  }, {
    icon: Bell,
    label: t('settings.notification'),
    desc: t("profilePage.settings.notif.desc"),
    action: () => setShowNotifModal(true)
  }, {
    icon: AlertTriangle,
    label: t("profilePage.features.sos.label"),
    desc: t("profilePage.features.sos.desc"),
    action: () => setShowSOS(true),
    danger: true
  }, {
    icon: HelpCircle,
    label: t('settings.guide'),
    desc: t("profilePage.menu.helpDesc", "View Migo feature guide again"),
    action: () => setShowTutorialLocal(true)
  }, {
    icon: HelpCircle,
    label: t("profilePage.faq.title"),
    desc: t("profilePage.settings.faqDesc", "Frequently asked questions"),
    action: () => setShowHelpModal(true)
  }, {
    icon: Shield,
    label: t("legalPages.privacyTitle", "Privacy Policy"),
    desc: t("privacy.menuDesc", "Data destruction and privacy terms"),
    action: () => navigate("/privacy")
  }, {
    icon: Crown,
    label: t("profilePage.features.premiumSupport.label", "MIGO Premium Support"),
    desc: t("profilePage.features.premiumSupport.desc", "Priority access to dedicated support"),
    action: () => {
      if (canDedicatedSupport) {
        toast({
          title: t("profilePage.features.premiumSupport.label", "Premium Support"),
          description: t("profilePage.features.premiumSupport.connectedDesc", "Connecting you to a dedicated support agent")
        });
      } else {
        setShowPlusModal(true);
      }
    },
    highlight: true
  }];

  if (userType === 'admin') {
    menuItems.unshift({
      icon: Shield,
      label: t("auto.admin_console", "어드민 콘솔 (Admin)"),
      desc: t("auto.admin_console_desc", "유저 관리, 신고 처리 및 앱 설정"),
      action: () => navigate("/admin"),
      highlight: true
    } as any);
  }

  // [Feature 1] 동행 안전 시스템 - 메뉴 아이템으로 추가 (렌더링 시 별도 버튼으로 표시)
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 8) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="h-full bg-background overflow-y-auto">
        {/* Skeleton: header */}
        <div className="flex items-center justify-between px-5 pt-safe pb-2">
          <div className="h-7 w-20 bg-muted rounded-xl animate-pulse" />
          <div className="flex gap-2">
            <div className="h-7 w-24 bg-muted rounded-full animate-pulse" />
            <div className="h-9 w-9 bg-muted rounded-xl animate-pulse" />
          </div>
        </div>
        {/* Skeleton: hero card */}
        <div className="mx-4 mt-3 bg-card rounded-3xl p-5 shadow-card animate-pulse">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-muted rounded-xl w-32" />
              <div className="h-3 bg-muted rounded-xl w-24" />
              <div className="h-3 bg-muted rounded-xl w-20" />
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full w-full mt-3" />
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[0,1,2].map(i => <div key={i} className="h-16 bg-muted rounded-2xl" />)}
          </div>
        </div>
        {/* Skeleton: stats */}
        <div className="grid grid-cols-4 gap-2 mx-4 mt-3">
          {[0,1,2,3].map(i => <div key={i} className="h-16 bg-card rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  // ─── 프로필 완성도 계산 ───
  const calculateCompletion = () => {
    let score = 0;
    if (photoUrl) score += 25;
    if (name && name !== "User" && !name.includes("@")) score += 15;
    if (bio && bio.length > 0) score += 20;
    if (tags && tags.length > 0) score += 20;
    if (location && !location.includes("unknown") && !location.includes("알수없음")) score += 10;
    if (travelMission || travelDates || visitedCountries.length > 0) score += 10;
    return Math.min(100, score);
  };
  const profileScore = calculateCompletion();

  return <div className="h-full bg-background relative overflow-y-auto">
      {/* ── 사진 라이트박스 ── */}
      <AnimatePresence>
        {galleryOpen && (() => {
          const photos = galleryOpen.photos;
          const idx = galleryIdx < photos.length ? galleryIdx : 0;
          return (
            <motion.div
              className="fixed inset-0 z-[200] flex flex-col bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* 닫기 + 카운터 */}
              <div className="flex items-center justify-between px-4 pt-safe pb-3">
                <button
                  onClick={() => { setGalleryOpen(null); setGalleryIdx(0); }}
                  className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center"
                >
                  <X size={18} className="text-white" />
                </button>
                <span className="text-white font-extrabold text-sm">{idx + 1} / {photos.length}</span>
                <div className="w-9" />
              </div>

              {/* 메인 이미지 — 터치 스와이프 지원 */}
              <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                <motion.div
                  className="w-full h-full flex items-center justify-center"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -60 && idx < photos.length - 1) setGalleryIdx(i => i + 1);
                    if (info.offset.x > 60 && idx > 0) setGalleryIdx(i => i - 1);
                  }}
                >
                  <motion.img
                    key={idx}
                    src={photos[idx]}
                    alt={`photo ${idx + 1}`}
                    className="max-w-full max-h-full object-contain pointer-events-none select-none"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15 }}
                  />
                </motion.div>
                {/* 좌우 버튼 */}
                {idx > 0 && (
                  <button
                    onClick={() => setGalleryIdx(i => Math.max(0, i - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
                  >
                    <ChevronLeft size={22} className="text-white" />
                  </button>
                )}
                {idx < photos.length - 1 && (
                  <button
                    onClick={() => setGalleryIdx(i => Math.min(photos.length - 1, i + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
                  >
                    <ChevronRight size={22} className="text-white" />
                  </button>
                )}
              </div>

              {/* 하단 썸네일 */}
              {photos.length > 1 && (
                <div className="px-4 pt-3 pb-6">
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar justify-center">
                    {photos.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setGalleryIdx(i)}
                        className={`relative shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                          i === idx ? 'border-white' : 'border-white/20 opacity-50'
                        }`}
                      >
                        <img src={url} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })()}
      </AnimatePresence>
      {/* ── Decorative background (테마 반영) ── */}
      <div className={`absolute top-0 left-0 w-full h-[280px] bg-gradient-to-b ${theme.decorBg} to-transparent z-0 pointer-events-none transition-all duration-500`} />
      
      {/* ─── 부스트 활성화 플래시 효과 ─── */}
      <AnimatePresence>
        {boostJustActivated && (
          <motion.div
            className="fixed inset-0 z-[500] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, times: [0, 0.15, 1] }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/40 via-pink-500/30 to-transparent" />
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

      <div className="relative z-10">

      {/* ── Top Bar ── */}
      <header className="flex items-center justify-between px-4 pt-safe pb-2">
        <h1 className="text-xl font-black text-foreground tracking-tight">{t('profile.title')}</h1>
        <div className="flex items-center gap-1.5">
          {isPlus && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
              <Crown size={11} className="text-amber-500" />
              <span className="text-[10px] font-extrabold text-amber-500">Plus</span>
            </div>
          )}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="w-9 h-9 rounded-xl bg-muted/80 flex items-center justify-center transition-transform active:scale-90"
          >
            <Settings size={17} className="text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* ── Hero Profile Card — Instagram-style centered layout ── */}
      <div className="mx-4 mt-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className={`rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] border overflow-hidden transition-all duration-500 ${theme.cardBg}`}
        >
          {/* 상단: 프로필 사진 + 통계 한 줄 */}
          <div className="flex items-center gap-5 px-5 pt-5 pb-3">
            {/* Avatar — 크게 */}
            <div className="relative shrink-0">
              <div
                className={`w-[84px] h-[84px] rounded-full overflow-hidden border-[3px] shadow-lg transition-all duration-500 ${theme.avatarRing}`}
                onClick={() => {
                  const allPhotos = profilePhotos.map(p => p.url).filter(Boolean);
                  if (allPhotos.length > 0) { setGalleryOpen({ photos: allPhotos, startIdx: 0 }); setGalleryIdx(0); }
                }}
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Profile"
                    className="w-full h-full object-cover cursor-pointer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full gradient-primary flex items-center justify-center text-primary-foreground text-3xl font-black">
                    {name.charAt(0) || 'M'}
                  </div>
                )}
              </div>
              {/* Camera edit */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md border-2 border-card active:scale-90 transition-transform"
              >
                {uploading
                  ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Camera size={12} className="text-white" />
                }
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                const file = e.target.files?.[0];
                if (file) uploadPhoto(file);
                e.target.value = '';
              }} />
            </div>

            {/* Stats — 3열 인라인 */}
            <div className="flex-1 grid grid-cols-3 gap-1">
              {[
                { value: myPosts.length, label: t('profilePage.stats.posts', 'Posts'), action: () => setShowMyPosts(true) },
                { value: matchedUsers.length, label: t('profilePage.stats.matched', 'Matched'), action: () => setShowMatchDetail(true) },
                { value: myTrips.length, label: t('profilePage.stats.trips', 'Trips'), action: () => setShowTripDetail(true) },
              ].map((stat) => (
                <button
                  key={stat.label}
                  onClick={stat.action}
                  className="flex flex-col items-center py-1 active:opacity-60 transition-opacity"
                >
                  <span className="text-[18px] font-black text-foreground leading-none">{stat.value}</span>
                  <span className="text-[10px] text-muted-foreground font-semibold mt-1 truncate">{stat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 이름 + 뱃지 + 위치 + 바이오 */}
          <div className="px-5 pb-3">
            {/* Name row */}
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[18px] font-black text-foreground leading-tight">{name}</h2>
              {userType === 'local' && (
                <span className="bg-emerald-500 text-white text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full">Local</span>
              )}
              {/* 인라인 뱃지 */}
              <button
                onClick={() => setShowVerifyModal(true)}
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/10 active:scale-95 transition-transform"
              >
                <Shield size={9} className="text-emerald-500" />
                <span className="text-[8px] font-extrabold text-emerald-600">{t('profilePage.verified', 'Verified')}</span>
              </button>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1 text-[12px] text-muted-foreground mt-1">
              <MapPin size={11} className="shrink-0" />
              <span className="truncate">{location || t('auto.z_위치감지중_126', '위치감지중')}</span>
              <button
                onClick={async () => {
                  if (!user) return;
                  const pos = await getCurrentLocation(true);
                  if (!pos) return;
                  const { lat, lng } = pos;
                  localStorage.setItem('migo_my_lat', String(lat));
                  localStorage.setItem('migo_my_lng', String(lng));
                  try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ko`, { headers: { 'User-Agent': 'MigoApp/1.0' } });
                    const geo = await res.json();
                    const city = geo.address?.city || geo.address?.town || geo.address?.village || geo.address?.county || geo.address?.state || '';
                    const country = geo.address?.country || '';
                    const loc = city ? `${city}, ${country}` : country;
                    if (loc) {
                      setLocation(loc);
                      await supabase.from('profiles').update({ location: loc, lat, lng }).eq('id', user.id);
                      // Phase 3-3: 근처 매칭 실시간 알림 트리거
                      try { await supabase.rpc('trigger_nearby_alert', { p_user_id: user.id, p_lat: lat, p_lng: lng }); } catch {/* ignore */}
                    }
                  } catch {/* ignore */}
                }}
                className="text-primary/50 hover:text-primary transition-colors shrink-0"
              >
                <Navigation size={10} />
              </button>
            </div>

            {/* Bio */}
            {bio && <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{bio}</p>}
          </div>

          {/* ─── Profile Completion Progress Bar ─── */}
          {profileScore < 100 && (
            <div className="px-5 pb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                  <Star size={10} className="text-amber-500" fill="currentColor" /> {t("profile.completion", "프로필 완성도")}
                </span>
                <span className="text-[10px] font-black text-primary">{profileScore}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${profileScore}%` }} 
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  className="h-full gradient-primary rounded-full"
                />
              </div>
              <p className="text-[9px] text-muted-foreground mt-1.5">
                {profileScore < 50 
                  ? t("profile.completionLow", "프로필을 완성하고 매칭률을 3배 높여보세요! 🔥") 
                  : t("profile.completionHigh", "조금만 더 채우면 완벽한 프로필이 돼요! ✨")}
              </p>
            </div>
          )}

          {/* Quick Action Buttons — 카드 안에 통합 */}
          <div className="flex gap-2 px-4 pb-4">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowEditModal(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-muted/80 font-bold text-[12px] text-foreground active:opacity-80 transition-all"
            >
              <Edit2 size={13} className="text-muted-foreground shrink-0" />
              {t('profile.editProfileBtn', '프로필 편집')}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={async () => {
                if (boostActive) return;
                await startBoost();
                setBoostJustActivated(true);
                setTimeout(() => setBoostJustActivated(false), 1800);
                toast({
                  title: t("alert.t64Title", "프로필 부스트가 활성화되었습니다!"),
                  description: t("alert.t64Desc", "30분 동안 매칭 화면 최상단에 노출됩니다.")
                });
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-[12px] transition-all ${
                boostActive
                  ? 'bg-purple-500 text-white'
                  : boostsCount > 0 || isPlus
                  ? 'gradient-primary text-white'
                  : 'bg-muted/80 text-muted-foreground'
              }`}
            >
              <Zap size={13} className={`shrink-0 ${boostActive ? 'animate-pulse' : ''}`} />
              <span className="truncate">
                {boostActive
                  ? `${Math.floor(boostSecondsLeft / 60)}:${(boostSecondsLeft % 60).toString().padStart(2, '0')}`
                  : `Boost (${boostsCount})`}
              </span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/verification')}
              className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-emerald-500/10 font-bold text-[12px] text-emerald-700 active:opacity-80 transition-all"
            >
              <Shield size={13} className="text-emerald-500 shrink-0" />
              {t('verif.title', '인증')}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* ── Plus Upgrade Banner (non-Plus only) ── */}
      {!isPlus && (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowPlusModal(true)}
          className="mx-4 mt-3 w-[calc(100%-32px)] flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500/12 to-orange-500/8 border border-amber-500/25 active:opacity-80"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
            <Crown size={15} className="text-amber-500" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-[13px] font-extrabold text-foreground truncate">{t('profilePage.upgradeTitle', 'Migo Plus 업그레이드')}</p>
            <p className="text-[10px] text-muted-foreground truncate">{t('auto.g_0887', '더 많은 매칭, 부스트, 나를 좋아한 사람 확인')}</p>
          </div>
          <ChevronRight size={16} className="text-amber-500 shrink-0" />
        </motion.button>
      )}

      {/* ── Tags & Mission ── */}
      {(travelMission || visitedCountries.length > 0 || tags.length > 0) && (
        <div className="mx-4 mt-3 space-y-2">
          {travelMission && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-primary/5 border border-primary/10">
              <span className="text-sm shrink-0">🎯</span>
              <p className="text-[12px] font-bold text-foreground truncate">{travelMission}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {visitedCountries.slice(0, 5).map((flag: string) => (
              <span key={flag} className="px-2 py-1 rounded-full bg-card border border-border/50 text-sm shadow-sm">{flag}</span>
            ))}
            {visitedCountries.length > 5 && (
              <span className="px-2 py-1 rounded-full bg-muted/60 text-[10px] font-bold text-muted-foreground">+{visitedCountries.length - 5}</span>
            )}
            {tags.slice(0, 4).map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full bg-card border border-border/50 text-[11px] font-semibold text-muted-foreground shadow-sm">#{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* ─── 나를 좋아한 사람들 섹션 ─── */}
      {likers.length > 0 && (
        <div className="mx-5 mt-6">
          {/* 헤더 배너 */}
        <motion.div
            id="likers-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl overflow-hidden mb-3 cursor-pointer active:opacity-90"
            style={{ background: 'linear-gradient(135deg, #ff2d55 0%, #ff6b35 50%, #ff9500 100%)' }}
            onClick={() => {
              if (canViewLikers) {
                document.getElementById('likers-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              } else {
                setShowPlusModal(true);
              }
            }}
          >
            {/* 배경 펄스 원 */}
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10 animate-pulse" />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/10 animate-pulse" style={{ animationDelay: '0.5s' }} />

            <div className="relative z-10 px-5 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <motion.div
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Heart size={18} className="text-white" fill="white" />
                  </motion.div>
                  <span className="text-white font-black text-[15px] drop-shadow-sm">
                    {t("auto.g_0888", "나를 좋아한 사람")}
                  </span>
                </div>
                <p className="text-white/80 text-[11px] font-semibold">
                  {canViewLikers
                    ? t("auto.g_0888_sub", { count: likers.length, defaultValue: `${likers.length}명이 당신을 좋아해요 💘` })
                    : t("auto.g_0888_sub_lock", "누군가 당신에게 빠졌어요 👀")}
                </p>
              </div>

              {/* 겹치는 아바타 스택 */}
              <div className="flex items-center">
                {likers.slice(0, 4).map((liker, i) => (
                  <div
                    key={liker.id}
                    className="relative w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-lg"
                    style={{
                      marginLeft: i === 0 ? 0 : '-10px',
                      zIndex: 10 - i,
                      filter: !canViewLikers ? 'blur(5px)' : 'none',
                    }}
                  >
                    {liker.photo
                      ? <img src={liker.photo} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-white/30 flex items-center justify-center text-white font-black text-sm">{liker.name[0]}</div>
                    }
                  </div>
                ))}
                {likers.length > 4 && (
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-black/40 backdrop-blur-sm flex items-center justify-center -ml-2.5 z-0 shadow-lg">
                    <span className="text-white text-[10px] font-black">+{likers.length - 4}</span>
                  </div>
                )}
                {!canViewLikers && (
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-black/50 backdrop-blur-sm flex items-center justify-center -ml-2.5 z-10 shadow-lg">
                    <Lock size={14} className="text-white" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* 카드 그리드 */}
          <div id="likers-grid" className="grid grid-cols-3 gap-2">
            {likers.slice(0, canViewLikers ? 20 : 6).map((liker, idx) => (
              <motion.div
                key={liker.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (!canViewLikers) { setShowPlusModal(true); }
                  else { setSelectedLiker(liker); setSelectedLikerIdx(idx); }
                }}
                className="relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer shadow-lg"
              >
                {/* Photo */}
                {liker.photo ? (
                  <img
                    src={liker.photo}
                    alt={liker.name}
                    className="w-full h-full object-cover"
                    style={!canViewLikers ? { filter: 'blur(12px)', transform: 'scale(1.15)' } : {}}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      background: `hsl(${(idx * 47) % 360}, 60%, 55%)`,
                      filter: !canViewLikers ? 'blur(12px)' : 'none',
                    }}
                  >
                    <span className="text-white text-3xl font-black opacity-60">{liker.name[0]}</span>
                  </div>
                )}

                {/* Bottom gradient */}
                <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

                {/* Heart badge */}
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center shadow-md">
                  <Heart size={11} className="text-white" fill="white" />
                </div>

                {/* Info */}
                {canViewLikers && (
                  <div className="absolute bottom-2 left-2 right-2 z-10">
                    <p className="text-white font-extrabold text-[12px] leading-tight truncate drop-shadow-md">
                      {liker.name}{liker.age && <span className="font-normal opacity-80 ml-1 text-[10px]">{liker.age}</span>}
                    </p>
                    {liker.location && (
                      <div className="flex items-center gap-0.5 text-emerald-300 text-[9px] font-bold mt-0.5 truncate">
                        <MapPin size={7} className="shrink-0" />
                        <span className="truncate">{liker.location}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Lock overlay */}
                {!canViewLikers && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/20 backdrop-blur-[2px] z-20">
                    {idx === 0 && (
                      <div className="bg-rose-500/90 rounded-xl px-2 py-1">
                        <Lock size={14} className="text-white mx-auto" />
                        <span className="text-white text-[8px] font-black block text-center mt-0.5">PLUS</span>
                      </div>
                    )}
                    {idx > 0 && <Lock size={13} className="text-white/70" />}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Plus CTA - 비구독자 */}
          {!canViewLikers && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowPlusModal(true)}
              className="mt-3 w-full py-4 rounded-2xl flex items-center justify-center gap-2.5 font-black text-white relative overflow-hidden shadow-xl active:opacity-90"
              style={{ background: 'linear-gradient(135deg, #ff2d55, #ff6b35)' }}
            >
              <div className="absolute inset-0 opacity-20"
                style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)' }}
              />
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                <Heart size={18} fill="white" className="text-white" />
              </motion.div>
              <span className="text-[14px] relative z-10">{t("auto.g_0891", "지금 확인하기 — Migo Plus")}</span>
              <Crown size={16} className="text-yellow-300 relative z-10" />
            </motion.button>
          )}
        </div>
      )}

      {/* ── My Badges Section ── */}
      <div className="mx-5 mt-6 mb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Crown size={18} className="text-amber-500" />
            <h3 className="text-[16px] font-black text-foreground">{t("profile.myBadges", "내 뱃지")}</h3>
          </div>
          <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {earnedBadges.length}
          </span>
        </div>

        {earnedBadges.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
            {earnedBadges.map((b) => (
              <div key={b} className="flex flex-col items-center justify-center w-[72px] h-[80px] bg-card border border-border/50 rounded-2xl shrink-0 shadow-sm">
                <div className="text-2xl mb-1">
                  {b === "early_bird" ? "🌅" : b === "social_king" ? "👑" : b === "travel_holic" ? "✈️" : "✨"}
                </div>
                <span className="text-[9px] font-bold text-foreground text-center px-1 truncate w-full">
                  {b}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
              <Star size={18} className="text-muted-foreground/50" />
            </div>
            <p className="text-[12px] font-bold text-foreground">{t("profile.noBadges", "아직 획득한 뱃지가 없어요")}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{t("profile.earnBadgesDesc", "앱에서 활동하며 멋진 뱃지를 수집해보세요!")}</p>
          </div>
        )}
      </div>

      {/* My Posts Section */}
      <AnimatePresence>
        {showMyPosts && <motion.div initial={{
        opacity: 0,
        height: 0
      }} animate={{
        opacity: 1,
        height: "auto"
      }} exit={{
        opacity: 0,
        height: 0
      }} className="mx-5 mt-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                <h3 className="text-sm font-extrabold text-foreground truncate">{t("profilePage.myPosts")}</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {myPosts.length}
                </span>
              </div>
              <button onClick={() => setShowMyPosts(false)} className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                <X size={14} className="text-muted-foreground" />
              </button>
            </div>

            {myPosts.length === 0 ? <div className="text-center py-10 bg-card rounded-2xl">
                <FileText size={24} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground truncate">{t("profilePage.noPosts")}</p>
                <button onClick={() => navigate("/discover")} className="mt-3 text-xs text-primary font-semibold">
                  {t("profilePage.goPost")}
                </button>
              </div> : <div className="space-y-3">
                {myPosts.map((post, index) => {
                  const isRead = readStories.has(post.id);
                  return (
                    <motion.div key={post.id} initial={{
                      opacity: 0,
                      y: 8
                    }} animate={{
                      opacity: 1,
                      y: 0
                    }} className={`rounded-[20px] p-[2px] cursor-pointer ${!isRead ? 'bg-gradient-to-tr from-amber-400 via-orange-500 to-pink-500' : 'bg-transparent'}`} onClick={() => handleStoryClick(index, post.id)}>
                      <div className="bg-card rounded-[18px] p-4 shadow-card h-full">
                        {/* 이미지가 있으면 섬네일 */}
                        {post.images && post.images.length > 0 && <img src={post.images[0]} alt="" className="w-full h-36 rounded-xl object-cover mb-3" onError={e => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }} />}
                        <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[11px] text-muted-foreground">{post.time}</span>
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Heart size={10} /> {post.likes}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <MessageCircle size={10} /> {post.comments}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>}
          </motion.div>}
      </AnimatePresence>

      {/* Story Viewer Overlay */}
      {activeStoryIndex !== null && (
        <StoryViewer
          posts={myPosts}
          initialIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
          onAuthorClick={() => setActiveStoryIndex(null)}
          onComment={() => {
            toast({ title: t("profilePage.commentNotSupported", { defaultValue: "Comments can be managed in the feed." }) });
          }}
          onLike={() => {
             toast({ title: t("profilePage.likeNotSupported", { defaultValue: "This is your own post." }) });
          }}
        />
      )}

      {/* ─── 라이커 풀스크린 포토 뷰어 ─── */}
      <AnimatePresence>
        {selectedLiker && (
          <motion.div
            className="fixed inset-0 z-[200] bg-black"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {/* 풀스크린 사진 */}
            {selectedLiker.photo ? (
              <img
                src={selectedLiker.photo}
                alt={selectedLiker.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: `hsl(${(selectedLiker.name?.charCodeAt(0) ?? 0) * 23 % 360}, 55%, 45%)` }}
              >
                <span className="text-white text-[120px] font-black opacity-30">{selectedLiker.name?.[0]}</span>
              </div>
            )}

            {/* 상단 그라디언트 + 닫기 */}
            <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
            <div className="absolute top-0 inset-x-0 flex items-center justify-between px-5 pt-safe">
              {/* 좌우 탐색 인디케이터 */}
              <div className="flex gap-1">
                {canViewLikers && likers.slice(0, 20).map((_, i) => (
                  <div
                    key={i}
                    className={`h-0.5 rounded-full transition-all ${
                      i === selectedLikerIdx ? 'bg-white w-6' : 'bg-white/40 w-3'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => setSelectedLiker(null)}
                className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center ml-auto"
              >
                <X size={18} className="text-white" />
              </button>
            </div>

            {/* 좌우 탐색 화살표 */}
            {canViewLikers && likers.length > 1 && (
              <>
                {selectedLikerIdx > 0 && (
                  <button
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center z-10"
                    onClick={() => {
                      const newIdx = selectedLikerIdx - 1;
                      setSelectedLikerIdx(newIdx);
                      setSelectedLiker(likers[newIdx]);
                    }}
                  >
                    <ChevronLeft size={20} className="text-white" />
                  </button>
                )}
                {selectedLikerIdx < Math.min(likers.length, 20) - 1 && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center z-10"
                    onClick={() => {
                      const newIdx = selectedLikerIdx + 1;
                      setSelectedLikerIdx(newIdx);
                      setSelectedLiker(likers[newIdx]);
                    }}
                  >
                    <ChevronRight size={20} className="text-white" />
                  </button>
                )}
              </>
            )}

            {/* 하단 그라디언트 — 스크롤 영역 위에 */}
            <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/95 via-black/70 to-transparent pointer-events-none" />
            {/* 스크롤 가능한 정보 영역 */}
            <div
              className="absolute inset-x-0 bottom-0 overflow-y-auto px-6"
              style={{ maxHeight: '65vh', paddingBottom: 'max(32px, env(safe-area-inset-bottom, 20px))' }}
            >
              {/* 나를 좋아해요 뱃지 */}
              <div className="flex items-center gap-1.5 mb-3">
                <motion.div
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Heart size={16} className="text-rose-400" fill="#fb7185" />
                </motion.div>
                <span className="text-rose-300 text-xs font-bold">{t("auto.g_0892", "나를 좋아해요")}</span>
              </div>

              {/* 이름/나이 */}
              <h2 className="text-white text-3xl font-black leading-tight drop-shadow-lg">
                {selectedLiker.name}
                {selectedLiker.age && (
                  <span className="text-white/70 text-xl font-semibold ml-2">{selectedLiker.age}</span>
                )}
              </h2>

              {/* 위치 */}
              {selectedLiker.location && (
                <div className="flex items-center gap-1 mt-1.5">
                  <MapPin size={13} className="text-emerald-400 shrink-0" />
                  <span className="text-emerald-300 text-sm font-semibold">{selectedLiker.location}</span>
                </div>
              )}

              {/* 태그 행 (MBTI + 국적) */}
              {(selectedLiker.mbti || selectedLiker.nationality) && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedLiker.mbti && (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-violet-500/30 text-violet-200 border border-violet-400/30">
                      {selectedLiker.mbti}
                    </span>
                  )}
                  {selectedLiker.nationality && (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/15 text-white border border-white/20">
                      {selectedLiker.nationality}
                    </span>
                  )}
                </div>
              )}

              {/* 자기소개 */}
              {selectedLiker.bio && (
                <p className="text-white/80 text-[13px] leading-relaxed mt-3 line-clamp-3">
                  "{selectedLiker.bio}"
                </p>
              )}

              {/* 언어 */}
              {selectedLiker.languages?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <Globe size={12} className="text-sky-300 shrink-0 mt-0.5" />
                  {selectedLiker.languages.slice(0, 4).map((lang: string, i: number) => (
                    <span key={i} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/20">
                      {lang}
                    </span>
                  ))}
                </div>
              )}

              {/* 관심사 */}
              {selectedLiker.interests?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedLiker.interests.slice(0, 5).map((tag: string, i: number) => (
                    <span key={i} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white/80 border border-white/15">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 채팅 버튼 */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => startChatWithLiker(selectedLiker.id)}
                disabled={startingChat}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2.5 font-extrabold text-[15px] shadow-xl mt-4 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                {startingChat
                  ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Send size={18} className="text-white" />
                }
                <span className="text-white">{startingChat ? t("auto.g_0904", "채팅방 연결 중...") : t("auto.g_0905", "채팅 보내기")}</span>
              </motion.button>
              <p className="text-center text-white/50 text-xs mt-2">
                {t("auto.g_0893", "채팅방이 열리면 먼저 인사해보세요 👋")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 활동 리포트 */}
      <div className="mt-5">
        <ActivityReport />
      </div>

      
      {/* Dashboard Menu Groups */}
      <div className="mx-4 mt-5 pb-6 space-y-4">

        {/* Safety CTA */}
        <button onClick={() => navigate('/safety')} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 active:scale-95 transition-transform shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
            <span className="text-lg">🛡️</span>
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-[13px] font-extrabold text-emerald-700 truncate">{t("auto.g_0894", "안전 시스템")}</p>
            <p className="text-[10px] text-emerald-600/70 font-semibold mt-0.5 truncate">{t("auto.g_0895", "만남 전 체크리스트 확인")}</p>
          </div>
          <span className="text-[9px] font-black text-white px-2 py-0.5 rounded-full bg-emerald-500 shrink-0">NEW</span>
        </button>

        {/* Group 1: Explore & Organize */}
        <div>
          <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-2 pl-1">{t("profilePage.menu.exploreTitle", "Explore")}</h4>
          <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
            {menuItems.slice(0, 4).map((item, i) => {
              const Icon = item.icon;
              return (
                <button key={item.label} onClick={item.action} className={`w-full flex items-center gap-3 px-4 py-3.5 bg-card active:bg-muted/50 transition-colors ${i !== 3 ? 'border-b border-border/30' : ''}`}>
                  <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-sm">
                    <Icon size={14} className="text-white" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{item.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground/40 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Group 2: Account & Settings */}
        <div>
          <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-2 pl-1">{t("profilePage.menu.accountTitle", "Account")}</h4>
          <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
            {menuItems.slice(4).map((item, i, arr) => {
              const Icon = item.icon;
              return (
                <button key={item.label} onClick={item.action} className={`w-full flex items-center gap-3 px-4 py-3.5 bg-card active:bg-muted/50 transition-colors ${i !== arr.length - 1 ? 'border-b border-border/30' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${item.highlight ? 'bg-amber-500/15' : 'bg-muted/60'}`}>
                    <Icon size={14} className={item.highlight ? 'text-amber-500' : 'text-muted-foreground'} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className={`text-[13px] font-semibold truncate ${item.highlight ? 'text-amber-600' : 'text-foreground'}`}>{item.label}</p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground/40 shrink-0" />
                </button>
              );
            })}
            <button onClick={() => setShowLogoutConfirm(true)} className="w-full flex items-center gap-3 px-4 py-3.5 bg-card active:bg-destructive/10 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <LogOut size={14} className="text-destructive" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <span className="text-[13px] font-semibold text-destructive truncate">{t('settings.logout')}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Trust footer */}
        <div className="pb-2 text-center">
          <p className="text-[10px] text-muted-foreground/50">🔒 {t('profilePage.trustFooter', '모든 데이터는 암호화되어 안전하게 보호됩니다')}</p>
        </div>
      </div>

      {/* ─── Edit Profile Modal ─── */}
      <EditProfileModal
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        MAX_PROFILE_PHOTOS={MAX_PROFILE_PHOTOS}
        profilePhotos={profilePhotos}
        setProfilePhotos={setProfilePhotos}
        fileRef2={fileRef2}
        name={name}
        setName={setName}
        location={location}
        setLocation={setLocation}
        travelDates={travelDates}
        setTravelDates={setTravelDates}
        bio={bio}
        setBio={setBio}
        travelMission={travelMission}
        setTravelMission={setTravelMission}
        visitedCountries={visitedCountries}
        setVisitedCountries={setVisitedCountries}
        tags={tags}
        setTags={setTags}
        newTag={newTag}
        setNewTag={setNewTag}
        addTag={addTag}
        profileTheme={profileTheme}
        setProfileTheme={setProfileTheme}
        saveProfile={saveProfile}
        saving={saving}
      />

      {/* ─── Settings Modal ─── */}
      <SettingsModal
        showSettingsModal={showSettingsModal}
        setShowSettingsModal={setShowSettingsModal}
        user={user}
        setShowDeleteConfirm={setShowDeleteConfirm}
        setShowTermsModal={setShowTermsModal}
        setShowPrivacyPolicyModal={setShowPrivacyPolicyModal}
        setShowRefundPolicyModal={setShowRefundPolicyModal}
        setShowLicenseModal={setShowLicenseModal}
      />

      {/* ─── Notification Modal ─── */}
      <NotificationModal
        showNotifModal={showNotifModal}
        setShowNotifModal={setShowNotifModal}
        notifMatch={notifMatch} setNotifMatch={setNotifMatch}
        notifChat={notifChat} setNotifChat={setNotifChat}
        notifGroup={notifGroup} setNotifGroup={setNotifGroup}
        user={user}
      />

      {/* ─── Privacy Modal ─── */}
      <PrivacyModal
        showPrivacyModal={showPrivacyModal}
        setShowPrivacyModal={setShowPrivacyModal}
        profileVisible={profileVisible} setProfileVisible={setProfileVisible}
        locationShare={locationShare} setLocationShare={setLocationShare}
        user={user}
      />

      {/* ─── Help Modal ─── */}
      <HelpModal showHelpModal={showHelpModal} setShowHelpModal={setShowHelpModal} />

      {/* ─── Logout Confirm ─── */}
      <LogoutConfirmModal
        showLogoutConfirm={showLogoutConfirm}
        setShowLogoutConfirm={setShowLogoutConfirm}
        signOut={signOut}
      />
      {/* ─── Stat Helper: Bottom Sheet Wrapper ─── */}
      {/* ─── Match Detail Modal ─── */}
      <MatchDetailModal
        showMatchDetail={showMatchDetail}
        setShowMatchDetail={setShowMatchDetail}
        matchedUsers={matchedUsers}
      />

      {/* ─── Trip Detail Modal ─── */}
      <TripDetailModal
        showTripDetail={showTripDetail}
        setShowTripDetail={setShowTripDetail}
        myTrips={myTrips}
      />

      {/* ─── Meeting Detail Modal ─── */}
      <MeetingDetailModal
        showMeetingDetail={showMeetingDetail}
        setShowMeetingDetail={setShowMeetingDetail}
        myMeetings={myMeetings}
      />

      {/* ─── Delete Account Confirm Modal ─── */}
      <DeleteAccountConfirmModal
        showDeleteConfirm={showDeleteConfirm}
        setShowDeleteConfirm={setShowDeleteConfirm}
        user={user}
        signOut={signOut}
      />

      <MigoPlusModal isOpen={showPlusModal} onClose={() => setShowPlusModal(false)} />
      <SOSModal isOpen={showSOS} onClose={() => setShowSOS(false)} />

      {/* Tutorial (re-run from profile) */}
      <AnimatePresence>
        {showTutorialLocal && <TutorialOverlay onComplete={() => setShowTutorialLocal(false)} />}
      </AnimatePresence>

      {/* ─── 이용약관 Modal ─── */}
      <TermsModal showTermsModal={showTermsModal} setShowTermsModal={setShowTermsModal} />

      {/* ─── 개인정보처리방침 Modal ─── */}
      <PrivacyPolicyModal showPrivacyPolicyModal={showPrivacyPolicyModal} setShowPrivacyPolicyModal={setShowPrivacyPolicyModal} />

      {/* ─── 오픈소스 라이선스 Modal ─── */}
      <LicenseModal showLicenseModal={showLicenseModal} setShowLicenseModal={setShowLicenseModal} />

      {/* 신뢰 인증 모달 */}
      <TrustVerifyModal isOpen={showVerifyModal} onClose={() => setShowVerifyModal(false)} currentLevel="basic" phoneVerified={true} ticketVerified={true} />
      </div>
    </div>;
};
export default ProfilePage;