import i18n, { LANGUAGES } from "@/i18n";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Settings, ChevronRight, MapPin, Calendar, Globe, Camera, LogOut, Shield, Bell, HelpCircle, X, Check, Edit2, Plus, Heart, MessageCircle, Star, Users, Plane, Handshake, Crown, AlertTriangle, ShoppingBag, FileText, Eye, Zap, Navigation } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import SOSModal from "@/components/SOSModal";
import { useSubscription } from "@/context/SubscriptionContext";
import MigoPlusModal from "@/components/MigoPlusModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import TutorialOverlay, { useTutorial } from "@/components/TutorialOverlay";
import TrustVerifyModal from "@/components/TrustVerifyModal";
import ProfileViewsModal from "@/components/ProfileViewsModal";
import StreakBadge from "@/components/StreakBadge";
import ActivityReport from "@/components/ActivityReport";
import { checkInStreak } from "@/lib/streakService";
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
    canDedicatedSupport
  } = useSubscription();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES.find(l => l.code === 'en') || LANGUAGES[0];
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

  // ─── 실시간 DB 데이터 state ───
  const [matchedUsers, setMatchedUsers] = useState<any[]>([]);
  const [myTrips, setMyTrips] = useState<any[]>([]);
  const [myMeetings, setMyMeetings] = useState<any[]>([]);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [showMyPosts, setShowMyPosts] = useState(false);
  // 스트릭
  const [streakData, setStreakData] = useState(() => checkInStreak().data);
  const {
    user,
    refreshPhotoUrl
  } = useAuth();
  const {
    show: tutorialVisible,
    complete: completeTutorial,
    restart: restartTutorial
  } = useTutorial();
  const [showTutorialLocal, setShowTutorialLocal] = useState(false);
  const [name, setName] = useState("Me");
  const [location, setLocation] = useState("");
  const [travelDates, setTravelDates] = useState("");
  const [bio, setBio] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [travelMission, setTravelMission] = useState("");
  const [visitedCountries, setVisitedCountries] = useState<string[]>([]);
  const [profilePhotos, setProfilePhotos] = useState<Array<{
    file?: File;
    url: string;
  }>>([]);
  const MAX_PROFILE_PHOTOS = 6;
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileRef2 = useRef<HTMLInputElement>(null); // Edit modal multi-photo

  // ─ Supabase Storage 이미지 업로드 ─
  const uploadPhoto = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}.${ext}`;
      const {
        error: upErr
      } = await supabase.storage.from("avatars").upload(filePath, file, {
        upsert: true,
        contentType: file.type
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
        const ext = file.name.split(".").pop();
        const path = `${user.id}_${Date.now()}_${uploadedUrls.length}.${ext}`;
        const {
          error: upErr
        } = await supabase.storage.from("avatars").upload(path, file, {
          upsert: true,
          contentType: file.type
        });
        if (!upErr) {
          const {
            data
          } = supabase.storage.from("avatars").getPublicUrl(path);
          uploadedUrls.push(`${data.publicUrl}?t=${Date.now()}`);
        } else {
          console.error(i18n.t("auto.z_autoz사진업로드_105"), upErr);
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
        updated_at: new Date().toISOString()
      };
      const {
        error,
        data: saved
      } = await supabase.from("profiles").update(updatePayload).eq("id", user.id).select().single();
      if (error) {
        console.error(i18n.t("auto.z_autoz프로필저장_106"), error);
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
    if (!user) return;
    const fetchProfile = async () => {
      let {
        data,
        error
      } = await supabase.from('profiles').select('*').eq('id', user.id).single();

      // DB에 이 유저 레코드가 없다면 (예: 트리거 실패, 레거시 계정) 빈 레코드 자동 생성으로 복구!
      if (error && error.code === 'PGRST116') {
        const fbName = user.name || user.email?.split('@')[0] || "User";
        await supabase.from('profiles').upsert([{
          id: user.id,
          name: fbName,
          email: user.email
        }]);
        const retry = await supabase.from('profiles').select('*').eq('id', user.id).single();
        data = retry.data;
      }
      if (data) {
        setName(data.name || user.name || user.email?.split('@')[0] || "Unknown");
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
        setVisitedCountries(data.visited_countries || []);
        const urls: string[] = data.photo_urls || (data.photo_url ? [data.photo_url] : user.photoUrl ? [user.photoUrl] : []);
        setProfilePhotos(urls.map(url => ({
          url
        })));
        if (data.notif_match !== undefined) setNotifMatch(data.notif_match);
        if (data.notif_chat !== undefined) setNotifChat(data.notif_chat);
        if (data.notif_group !== undefined) setNotifGroup(data.notif_group);
      } else {
        setName(user.name || user.email?.split('@')[0] || "User");
        if (user.photoUrl) setPhotoUrl(user.photoUrl);
      }

      // ── GPS 역지오코딩 ── (보존된 location이 없거나 비어있으면 자동 실행)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async pos => {
          const {
            latitude: lat,
            longitude: lng
          } = pos.coords;
          // 로컨스토리지에 GPS 좌표 저장 (매칭용)
          localStorage.setItem('migo_my_lat', String(lat));
          localStorage.setItem('migo_my_lng', String(lng));
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ko`, {
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
              // DB에도 저장 (lat/lng 포함)
              if (user) {
                await supabase.from('profiles').update({
                  location: locationStr,
                  lat,
                  lng
                }).eq('id', user.id);
              }
            }
          } catch {/* 네트워크 오류 시 조용히 무시 */}
        }, () => {/* 권한 거부 시 무시 */}, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      }

      // ─── 매칭 목록: matches 테이블에서 양방향 ───
      const {
        data: matchData
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
              date: new Intl.DateTimeFormat('ko-KR', {
                month: 'long',
                day: 'numeric'
              }).format(new Date(p.created_at)),
              tags: (p.interests || []).slice(0, 2),
              matched: true
            })));
          }
        }
      }

      // ─── 내 여행: trips 테이블 ───
      const {
        data: tripData
      } = await supabase.from('trips').select('id, destination, start_date, end_date, emoji').eq('user_id', user.id).order('start_date', {
        ascending: false
      }).limit(20);
      if (tripData) {
        const today = new Date().toISOString().split('T')[0];
        setMyTrips(tripData.map((t: any) => {
          const status = t.end_date < today ? "Completed" : t.start_date <= today && t.end_date >= today ? t('profilePage.tripStatus.active') : t('profilePage.tripStatus.upcoming');
          return {
            id: t.id,
            title: `${t.emoji || '✈️'} ${t.destination}`,
            destination: t.destination,
            dates: `${t.start_date?.slice(5).replace('-', '/')} ~ ${t.end_date?.slice(5).replace('-', '/')}`,
            members: 1,
            photo: "",
            status
          };
        }));
      }

      // ─── 만남 기록: meet_reviews 테이블 (내가 남긴 후기) ───
      const {
        data: meetData
      } = await supabase.from('meet_reviews').select('id, created_at, rating, tags, profiles!target_id (name, photo_url)').eq('reviewer_id', user.id).order('created_at', {
        ascending: false
      }).limit(20);
      if (meetData) {
        setMyMeetings(meetData.map((m: any) => ({
          id: m.id,
          name: m.profiles?.name || "Unknown",
          photo: m.profiles?.photo_url || "",
          place: (m.tags || []).join(', ') || "–",
          date: new Intl.DateTimeFormat('ko-KR', {
            month: 'long',
            day: 'numeric',
            hour: 'numeric'
          }).format(new Date(m.created_at)),
          type: (m.tags || ['meeting'])[0],
          rating: m.rating || 5
        })));
      }

      // ─── 내 게시글: posts 테이블 ───
      const {
        data: postData
      } = await supabase.from('posts').select('id, content, image_urls, image_url, created_at, post_likes(count), comments(id)').eq('author_id', user.id).order('created_at', {
        ascending: false
      }).limit(30);
      if (postData) {
        setMyPosts(postData.map((p: any) => ({
          id: p.id,
          content: p.content || '',
          images: p.image_urls || (p.image_url ? [p.image_url] : []),
          time: new Intl.DateTimeFormat('ko-KR', {
            month: 'long',
            day: 'numeric'
          }).format(new Date(p.created_at)),
          likes: p.post_likes?.[0]?.count || 0,
          comments: p.comments?.length || 0
        })));
      }
    };
    fetchProfile();
  }, [user]);

  // Settings state
  const [notifMatch, setNotifMatch] = useState(true);
  const [notifChat, setNotifChat] = useState(true);
  const [notifGroup, setNotifGroup] = useState(false);
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
    icon: Crown,
    label: "MIGO Premium Support",
    desc: t("auto.z_\uC804\uB2F4\uACE0\uAC1D\uC13C\uD13011\uC6B0\uC120_124"),
    action: () => {
      if (canDedicatedSupport) {
        toast({
          title: "Premium Support",
          description: i18n.t("auto.z_\uC804\uB2F4\uC0C1\uB2F4\uC0AC\uC5D0\uAC8C\uC5F0\uACB0\uB429_125")
        });
      } else {
        setShowPlusModal(true);
      }
    },
    highlight: true
  }];

  // [Feature 1] 동행 안전 시스템 - 메뉴 아이템으로 추가 (렌더링 시 별도 버튼으로 표시)
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 8) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };
  return <div className="min-h-screen bg-background safe-bottom">
      <header className="flex items-center justify-between px-5 pt-4 pb-2">
        <h1 className="text-2xl font-extrabold text-foreground">{t('profile.title')}</h1>
        <div className="flex items-center gap-2">
          {isPlus && <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
              <Crown size={11} className="text-amber-500" />
              <span className="text-[10px] font-extrabold text-amber-500">Plus</span>
            </div>}
          {/* Trust badge — always visible, click → verification page */}
          <button onClick={() => setShowVerifyModal(true)} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 active:scale-95 transition-transform">
            <Shield size={11} className="text-emerald-500" />
            <span className="text-[10px] font-extrabold text-emerald-500">{t("profilePage.verified")}</span>
          </button>
          <button onClick={() => setShowSettingsModal(true)} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center transition-transform active:scale-90">
            <Settings size={18} className="text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Plus upgrade banner (free users only) */}
      {!isPlus && <motion.button whileTap={{
      scale: 0.98
    }} onClick={() => setShowPlusModal(true)} className="mx-5 mt-2 mb-1 w-[calc(100%-40px)] flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Crown size={16} className="text-amber-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-foreground">{t("profilePage.upgradeTitle")}</p>
              <p className="text-[10px] text-muted-foreground">{t("profile.subDesc")}</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-amber-500" />
        </motion.button>}

      {/* Profile Card */}
      <div className="mx-5 mt-3 bg-card rounded-3xl p-5 shadow-card">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {photoUrl ? <img src={photoUrl} alt="" className="w-20 h-20 rounded-2xl object-cover" onError={e => {
            // 로드 실패 시 숨기지 말고 gradient 배경+이름 첫 글자 fallback
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement?.querySelector('.photo-fallback')?.setAttribute('style', 'display:flex');
          }} /> : null}
            <div className="photo-fallback w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-black" style={{
            display: photoUrl ? 'none' : 'flex'
          }}>
              {name.charAt(0) || "M"}
            </div>
            {/* hidden file input */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
            const file = e.target.files?.[0];
            if (file) uploadPhoto(file);
            e.target.value = ""; // reset so same file can be reselected
          }} />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full gradient-primary flex items-center justify-center shadow-card transition-transform active:scale-90 disabled:opacity-60">
              {uploading ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera size={12} className="text-primary-foreground" />}
            </button>
          </div>
          <div className="flex-1 min-w-0 pr-1 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold text-foreground truncate">{name}</h2>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={12} className="text-primary shrink-0" />
              <span className="text-xs text-muted-foreground">{location || t("auto.z_\uC704\uCE58\uAC10\uC9C0\uC911_126")}</span>
              <button onClick={() => {
              if (!navigator.geolocation || !user) return;
              navigator.geolocation.getCurrentPosition(async pos => {
                const {
                  latitude: lat,
                  longitude: lng
                } = pos.coords;
                localStorage.setItem('migo_my_lat', String(lat));
                localStorage.setItem('migo_my_lng', String(lng));
                try {
                  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ko`, {
                    headers: {
                      'User-Agent': 'MigoApp/1.0'
                    }
                  });
                  const geo = await res.json();
                  const city = geo.address?.city || geo.address?.town || geo.address?.village || geo.address?.county || geo.address?.state || "";
                  const country = geo.address?.country || "";
                  const loc = city ? `${city}, ${country}` : country;
                  if (loc) {
                    setLocation(loc);
                    await supabase.from('profiles').update({
                      location: loc,
                      lat,
                      lng
                    }).eq('id', user.id);
                  }
                } catch {/* ignore */}
              }, () => {}, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
              });
            }} className="ml-0.5 text-primary/50 hover:text-primary transition-colors" title={t("auto.z_\uD604\uC7AC\uC704\uCE58\uB85C\uC5C5\uB370\uC774\uD2B8_127")}>
                <Navigation size={10} />
              </button>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Calendar size={12} className="text-primary shrink-0" />
              <span className="text-xs text-muted-foreground truncate">{travelDates}</span>
            </div>
            </div>
            <div className="shrink-0 -mt-1 whitespace-nowrap">
              <StreakBadge data={streakData} className="scale-[0.85] origin-top-right" />
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{bio}</p>

        {/* Display Mission & Passport */}
        {travelMission && <div className="mt-4 p-3.5 rounded-2xl backdrop-blur-md border border-primary/20 bg-primary/5">
            <div className="flex items-start gap-2">
              <span className="text-xl shrink-0">🎯</span>
              <div>
                <p className="text-[10px] font-extrabold text-primary uppercase tracking-wider mb-0.5">{i18n.t(t("auto.z_autoz\uC9C0\uAE08\uD558\uACE0\uC2F6_128"), {
                defaultValue: t("auto.x4092")
              })}</p>
                <p className="text-sm font-extrabold text-foreground leading-snug">{travelMission}</p>
              </div>
            </div>
          </div>}
        
        {visitedCountries.length > 0 && <div className="mt-3 flex items-center gap-2 p-3 rounded-2xl bg-muted/50 border border-border">
            <span className="text-lg">🛂</span>
            <div className="flex-1 flex flex-wrap gap-1">
              {visitedCountries.map((flag: string) => <span key={flag} className="text-lg">{flag}</span>)}
            </div>
          </div>}

        <div className="flex flex-wrap gap-2 mt-3">
          {tags.map(tag => <span key={tag} className="px-3 py-1 rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {tag}
            </span>)}
        </div>

        <div className="flex gap-4 mt-6">
            <button className="flex-1 py-3.5 bg-primary/10 text-primary rounded-2xl font-bold flex items-center justify-center gap-2" onClick={() => setShowEditModal(true)}>
              {t("profile.editProfileBtn")}
            </button>
            <button className={`flex-1 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 ${boostActive ? "bg-purple-500/10 text-purple-500" : boostsCount > 0 || isPlus ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md shadow-purple-500/20" : "bg-muted text-muted-foreground"}`} onClick={() => {
          if (boostActive) return;
          startBoost();
        }}>
              <Zap size={18} className={boostActive ? "animate-pulse" : ""} />
              {boostActive ? `${Math.floor(boostSecondsLeft / 60)}:${(boostSecondsLeft % 60).toString().padStart(2, '0')} ${"Boosting ⚡"}` : isPlus ? t("profilePage.boostFree", {
            n: boostsCount
          }) : boostsCount > 0 ? t("profilePage.boostOn", {
            n: boostsCount
          }) : t("profilePage.boostNone")}
            </button>
          </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mx-5 mt-4">
        {[{
        value: String(matchedUsers.length),
        label: t("profilePage.stats.matched"),
        icon: Heart,
        action: () => setShowMatchDetail(true)
      }, {
        value: String(myTrips.length),
        label: t("profilePage.stats.trips"),
        icon: Plane,
        action: () => setShowTripDetail(true)
      }, {
        value: String(myMeetings.length),
        label: t("profilePage.stats.meetings"),
        icon: Handshake,
        action: () => setShowMeetingDetail(true)
      }, {
        value: String(myPosts.length),
        label: t("profilePage.stats.posts"),
        icon: FileText,
        action: () => setShowMyPosts(true)
      }].map(stat => {
        const Icon = stat.icon;
        return <button key={stat.label} onClick={stat.action} className="bg-card rounded-2xl p-3 text-center shadow-card transition-all active:scale-95 hover:shadow-card-hover">
              <Icon size={16} className="text-primary mx-auto mb-1" />
              <span className="text-xl font-extrabold gradient-text">{stat.value}</span>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5 truncate">{stat.label}</p>
            </button>;
      })}
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
                <h3 className="text-sm font-extrabold text-foreground">{t("profilePage.myPosts")}</h3>
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
                <p className="text-sm text-muted-foreground">{t("profilePage.noPosts")}</p>
                <button onClick={() => navigate("/discover")} className="mt-3 text-xs text-primary font-semibold">
                  {t("profilePage.goPost")}
                </button>
              </div> : <div className="space-y-3">
                {myPosts.map(post => <motion.div key={post.id} initial={{
            opacity: 0,
            y: 8
          }} animate={{
            opacity: 1,
            y: 0
          }} className="bg-card rounded-2xl p-4 shadow-card">
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
                  </motion.div>)}
              </div>}
          </motion.div>}
      </AnimatePresence>

      {/* 활동 리포트 */}
      <ActivityReport />

      
      {/* Menu */}
      <div className="mx-5 mt-4 space-y-1.5 pb-24">
        {/* [Feature 1] 동행 안전 시스템 CTA */}
        <button onClick={() => navigate('/safety')} className="w-full flex items-center justify-between p-4 rounded-2xl mb-1" style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))',
        border: '1px solid rgba(16,185,129,0.3)'
      }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
            background: 'rgba(16,185,129,0.2)'
          }}>
              <span className="text-xl">🛡️</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-extrabold" style={{
              color: '#10b981'
            }}>{t("auto.z_autoz\uB3D9\uD589\uC548\uC804\uC2DC_129")}</p>
              <p className="text-[11px] text-muted-foreground">{t("auto.z_autoz\uB9CC\uB0A8\uC804\uCCB4\uD06C_130")}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{
          background: '#10b981'
        }}>NEW</span>
        </button>
        {menuItems.map(item => {
        const Icon = item.icon;
        return <button key={item.label} onClick={item.action} className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-card shadow-card transition-colors hover:bg-muted">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Icon size={18} className="text-primary" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <h4 className="text-sm font-semibold text-foreground truncate">{item.label}</h4>
                <p className="text-[10px] text-muted-foreground truncate">{item.desc}</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>;
      })}

        <button onClick={() => setShowLogoutConfirm(true)} className="w-full flex items-center gap-3 p-3.5 rounded-2xl transition-colors hover:bg-destructive/5">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <LogOut size={18} className="text-destructive" />
          </div>
          <span className="text-sm font-semibold text-destructive">{t('settings.logout')}</span>
        </button>
      </div>

      {/* ─── Edit Profile Modal ─── */}
      <AnimatePresence>
        {showEditModal && <motion.div className="fixed inset-0 z-50 flex items-end justify-center px-safe pb-safe pt-safe" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }}>
            <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
            <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 p-6 pb-20 shadow-float max-h-[85vh] overflow-y-auto" initial={{
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
                <h3 className="text-lg font-extrabold text-foreground">{t("profilePage.profileEdit")}</h3>
                <button onClick={() => setShowEditModal(false)}><X size={20} className="text-muted-foreground" /></button>
              </div>
              <div className="space-y-4">
                {/* 프로필 사진 최대 6장 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-foreground">{t("profilePage.profilePhoto")}</label>
                    <span className="text-[10px] text-muted-foreground">{profilePhotos.length}/{MAX_PROFILE_PHOTOS}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {profilePhotos.map((photo, idx) => <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-border">
                        <img src={photo.url} alt="" className="w-full h-full object-cover" />
                        {idx === 0 && <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">{"Main"}</div>}
                        <button onClick={() => setProfilePhotos(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                          <X size={10} className="text-white" />
                        </button>
                      </div>)}
                    {profilePhotos.length < MAX_PROFILE_PHOTOS && <button onClick={() => fileRef2.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 bg-muted">
                        <Camera size={18} className="text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{"Add Photo"}</span>
                      </button>}
                  </div>
                  <input ref={fileRef2} type="file" accept="image/*" multiple className="hidden" onChange={e => {
                const files = Array.from(e.target.files || []);
                const remaining = MAX_PROFILE_PHOTOS - profilePhotos.length;
                const toAdd = files.slice(0, remaining).map(f => ({
                  file: f,
                  url: URL.createObjectURL(f)
                }));
                setProfilePhotos(prev => [...prev, ...toAdd]);
                e.target.value = "";
              }} />
                  <p className="text-[10px] text-muted-foreground">{t("profilePage.photoHint")}</p>
                </div>
                <div>
                  <label className="text-sm font-bold text-foreground mb-2 block">{t("profilePage.labelName")}</label>
                  <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-sm font-bold text-foreground mb-2 block">{t("profilePage.labelLocation")}</label>
                  <input value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-sm font-bold text-foreground mb-2 block">{t("profilePage.labelDates")}</label>
                  <input value={travelDates} onChange={e => setTravelDates(e.target.value)} placeholder={t("profile.datePlaceholder")} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-sm font-bold text-foreground mb-2 block">{t("profilePage.labelBio")}</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm outline-none resize-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-sm font-bold text-foreground mb-2 flex items-center gap-1">
                    🎯 {i18n.t(t("auto.z_autoz\uC5EC\uD589\uBBF8\uC1581_131"), {
                  defaultValue: t("auto.x4093")
                })}
                  </label>
                  <input value={travelMission} onChange={e => setTravelMission(e.target.value)} placeholder={i18n.t(t("auto.z_autoz\uBBF8\uC158\uD50C\uB808\uC774_132"), {
                defaultValue: t("auto.x4094")
              })} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-sm font-bold text-foreground mb-2 flex items-center gap-1">
                    🛂 {i18n.t(t("auto.z_autoz\uC5EC\uAD8C120_133"), {
                  defaultValue: t("auto.x4095")
                })}
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {visitedCountries.map((flag: string) => <span key={flag} className="flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {flag}
                        <button onClick={() => setVisitedCountries(visitedCountries.filter(f => f !== flag))}><X size={10} /></button>
                      </span>)}
                  </div>
                  {visitedCountries.length < 20 && <select value="" onChange={e => {
                const flag = e.target.value;
                if (flag && !visitedCountries.includes(flag)) {
                  setVisitedCountries([...visitedCountries, flag]);
                }
              }} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="">+ {i18n.t(t("auto.z_autoz\uAD6D\uAC00\uC120\uD0DD1_134"), {
                    defaultValue: t("auto.x4096")
                  })}</option>
                      {['🇰🇷', '🇯🇵', '🇺🇸', '🇨🇳', '🇹🇼', '🇹🇭', '🇻🇳', '🇫🇷', '🇬🇧', '🇮🇹', '🇪🇸', '🇩🇪', '🇦🇺', '🇨🇦', '🇵🇭', '🇲🇾', '🇮🇩', '🇸🇬', '🇨🇭', '🇳🇿', '🇮🇳', '🇷🇺', '🇧🇷', '🇲🇽', '🇹🇷'].map(f => <option key={f} value={f}>{f}</option>)}
                    </select>}
                </div>
                <div>
                  <label className="text-sm font-bold text-foreground mb-2 block">{"Travel Style Tags"}</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map(tag => <span key={tag} className="flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {tag}
                        <button onClick={() => setTags(tags.filter(t => t !== tag))}><X size={10} /></button>
                      </span>)}
                  </div>
                  {tags.length < 8 && <div className="flex gap-2">
                      <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === "Enter" && addTag()} placeholder={t("profilePage.tagPlaceholder")} className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm outline-none" />
                      <button onClick={addTag} className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
                        <Plus size={14} className="text-primary-foreground" />
                      </button>
                    </div>}
                </div>
                <button onClick={saveProfile} disabled={saving} className="w-full py-3.5 rounded-2xl gradient-primary text-primary-foreground font-semibold text-sm shadow-card flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Check size={16} /> {"Save"}</>}
                </button>
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      {/* ─── Settings Modal ─── */}
      <AnimatePresence>
        {showSettingsModal && <motion.div className="fixed inset-0 z-50 flex items-end justify-center px-safe pb-safe pt-safe" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }}>
            <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowSettingsModal(false)} />
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
                <h3 className="text-lg font-extrabold text-foreground">{t('settings.title')}</h3>
                <button onClick={() => setShowSettingsModal(false)}><X size={20} className="text-muted-foreground" /></button>
              </div>

              {/* ── Language Picker ── */}
              <div className="mb-4">
                <button onClick={() => setShowLangPicker(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-primary/10 border border-primary/20 transition-colors hover:bg-primary/15">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{currentLang.flag}</span>
                    <div className="text-left">
                      <p className="text-xs font-bold text-primary">{t('settings.language')}</p>
                      <p className="text-sm font-semibold text-foreground">{currentLang.label}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className={`text-primary transition-transform ${showLangPicker ? 'rotate-90' : ''}`} />
                </button>
                {showLangPicker && (
                  <div className="mt-2 bg-muted rounded-2xl p-2 max-h-52 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-1">
                      {LANGUAGES.map(lang => (
                        <button key={lang.code}
                          onClick={() => {
                            i18n.changeLanguage(lang.code);
                            localStorage.setItem('migo-lang', lang.code);
                            setShowLangPicker(false);
                          }}
                          className={`w-full min-w-0 overflow-hidden flex items-center gap-1.5 px-2 py-2 rounded-xl text-xs transition-colors ${
                            lang.code === i18n.language
                              ? 'bg-primary text-primary-foreground font-bold'
                              : 'hover:bg-border text-foreground'
                          }`}>
                          <span className="shrink-0">{lang.flag}</span>
                          <span className="truncate">{lang.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {[{
              label: t("profilePage.version"),
              desc: "v1.0.0"
            }, {
              label: t('settings.terms'),
              desc: t("settings.terms")
            }, {
              label: t('settings.privacy'),
              desc: t("settings.privacy")
            }, {
              label: t("profilePage.refundPolicy"),
              desc: ""
            }, {
              label: t("profilePage.licenseTitle"),
              desc: ""
            }, {
              label: t('settings.deleteAccount'),
              desc: "All data will be deleted",
              danger: true
            }].map(item => <button key={item.label} onClick={() => {
              if (item.label === t('settings.deleteAccount')) {
                setShowSettingsModal(false);
                setShowDeleteConfirm(true);
              } else if (item.label === t('settings.terms')) {
                setShowTermsModal(true);
              } else if (item.label === t('settings.privacy')) {
                setShowPrivacyPolicyModal(true);
              } else if (item.label === t("profilePage.refundPolicy")) {
                setShowRefundPolicyModal(true);
              } else if (item.label === t("profilePage.licenseTitle")) {
                setShowLicenseModal(true);
              } else {
                toast({
                  title: item.label
                });
              }
            }} className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-muted transition-colors hover:bg-border ${item.danger ? "text-red-500" : ""}`}>
                    <span className="text-sm font-semibold">{item.label}</span>
                    <span className="text-xs opacity-60">{item.desc}</span>
                  </button>)}
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      {/* ─── Notification Modal ─── */}
      <AnimatePresence>
        {showNotifModal && <motion.div className="fixed inset-0 z-50 flex items-end justify-center px-safe pb-safe pt-safe" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }}>
            <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowNotifModal(false)} />
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
                <h3 className="text-lg font-extrabold text-foreground">{"Notifications"}</h3>
                <button onClick={() => setShowNotifModal(false)}><X size={20} className="text-muted-foreground" /></button>
              </div>
              <div className="space-y-4">
                {[{
              label: t("profilePage.settings.notif.label"),
              desc: t("profilePage.settings.notif.desc"),
              value: notifMatch,
              setter: setNotifMatch
            }, {
              label: t("profilePage.settings.chat.label"),
              desc: t("profilePage.settings.chat.desc"),
              value: notifChat,
              setter: setNotifChat
            }, {
              label: t("profilePage.settings.group.label"),
              desc: t("profilePage.settings.group.desc"),
              value: notifGroup,
              setter: setNotifGroup
            }].map(item => <div key={item.label} className="flex items-center justify-between p-4 rounded-2xl bg-muted">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                    <button onClick={() => {
                item.setter(!item.value);
                toast({
                  title: `${item.label} ${!item.value ? "On" : "Off"}`
                });
              }} className={`w-12 h-6 rounded-full transition-colors ${item.value ? "gradient-primary" : "bg-border"} relative`}>
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${item.value ? "translate-x-6" : "translate-x-0.5"}`} />
                    </button>
                  </div>)}
                <button onClick={async () => {
              if (user) {
                await supabase.from("profiles").update({
                  notif_match: notifMatch,
                  notif_chat: notifChat,
                  notif_group: notifGroup
                }).eq("id", user.id);
              }
              setShowNotifModal(false);
              toast({
                title: t("profile.notifSaved")
              });
            }} className="w-full py-3.5 rounded-2xl gradient-primary text-primary-foreground font-semibold text-sm shadow-card">
                  {t("auto.j530")}
                </button>
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      {/* ─── Privacy Modal ─── */}
      <AnimatePresence>
        {showPrivacyModal && <motion.div className="fixed inset-0 z-50 flex items-end justify-center px-safe pb-safe pt-safe" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }}>
            <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowPrivacyModal(false)} />
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
                <h3 className="text-lg font-extrabold text-foreground">{t("profilePage.settings.privacy")}</h3>
                <button onClick={() => setShowPrivacyModal(false)}><X size={20} className="text-muted-foreground" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-bold text-foreground mb-3">{t("profilePage.settings.visibility")}</p>
                  {[{
                value: "everyone",
                label: t("profile.everyone"),
                desc: t("profile.everyoneDesc")
              }, {
                value: "matched",
                label: t("profilePage.settings.visOptions.matched.label"),
                desc: t("profilePage.settings.visOptions.matched.desc")
              }, {
                value: "none",
                label: t("profilePage.settings.visOptions.none.label"),
                desc: t("profilePage.settings.visOptions.none.desc")
              }].map(opt => <button key={opt.value} onClick={() => setProfileVisible(opt.value as typeof profileVisible)} className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 mb-2 transition-all ${profileVisible === opt.value ? "border-primary bg-primary/5" : "border-border bg-muted"}`}>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                        <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                      </div>
                      {profileVisible === opt.value && <Check size={16} className="text-primary" />}
                    </button>)}
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-muted">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t("profilePage.settings.locationShare")}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{t("profilePage.settings.locationShareDesc")}</p>
                  </div>
                  <button onClick={() => setLocationShare(!locationShare)} className={`w-12 h-6 rounded-full transition-colors ${locationShare ? "gradient-primary" : "bg-border"} relative`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${locationShare ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                </div>
                <button onClick={async () => {
              if (user) {
                await supabase.from("profiles").update({
                  privacy_mode: profileVisible,
                  // Use matching columns or standard names
                  location_share: locationShare
                }).eq("id", user.id);
              }
              setShowPrivacyModal(false);
              toast({
                title: t("profile.privacySaved")
              });
            }} className="w-full py-3.5 rounded-2xl gradient-primary text-primary-foreground font-semibold text-sm shadow-card">
                  {t("auto.j531")}
                </button>
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      {/* ─── Help Modal ─── */}
      <AnimatePresence>
        {showHelpModal && <motion.div className="fixed inset-0 z-50 flex items-end justify-center px-safe pb-safe pt-safe" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }}>
            <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowHelpModal(false)} />
            <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 p-6 pb-20 shadow-float max-h-[80vh] overflow-y-auto" initial={{
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
                <h3 className="text-lg font-extrabold text-foreground">{t("profilePage.faq.title")}</h3>
                <button onClick={() => setShowHelpModal(false)}><X size={20} className="text-muted-foreground" /></button>
              </div>
              <div className="space-y-3">
                {[{
              q: t("profile.faq1q"),
              a: t("profile.faq1a")
            }, {
              q: t("profile.faq2q"),
              a: t("profile.faq2a")
            }, {
              q: t("profile.faq3q"),
              a: t("profile.faq3a")
            }, {
              q: t("profile.faq4q"),
              a: t("profile.faq4a")
            }, {
              q: t("profile.faq5q"),
              a: t("profile.faq5a")
            }].map((faq, i) => <div key={i} className="bg-muted rounded-2xl p-4">
                    <p className="text-sm font-bold text-foreground mb-1.5">Q. {faq.q}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">A. {faq.a}</p>
                  </div>)}
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      {/* ─── Logout Confirm ─── */}
      <AnimatePresence>
        {showLogoutConfirm && <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-6" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }}>
            <div className="absolute inset-0 bg-foreground/60 backdrop-blur-md" onClick={() => setShowLogoutConfirm(false)} />
            <motion.div className="relative z-10 w-full max-w-sm bg-card rounded-3xl p-6 shadow-float text-center" initial={{
          scale: 0.8,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} exit={{
          scale: 0.8,
          opacity: 0
        }} transition={{
          type: "spring",
          damping: 20,
          stiffness: 300
        }}>
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <LogOut size={28} className="text-destructive" />
              </div>
              <h3 className="text-lg font-extrabold text-foreground mb-2">{t("profilePage.logout.confirm")}</h3>
              <p className="text-sm text-muted-foreground mb-6">{t("profile.logoutDesc")}</p>
              <div className="flex gap-3">
                <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 rounded-2xl border border-border text-foreground font-semibold text-sm">
                  {t("profile.cancel")}
                </button>
                <button onClick={() => {
              // 데드락 방지를 위해 await 없이 백그라운드로 던지고 바로 다음 로컬 초기화를 수행
              supabase.auth.signOut().catch(() => { /* ignore */ });
              
              // 완전한 로컬 스토리지 및 캐패시터 프로퍼런스 클리어 (데드락 방지)
              import('@capacitor/preferences').then(({ Preferences }) => {
                Preferences.clear();
              }).catch(() => {});

              for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && (key.includes('migo') || key.includes('supabase'))) {
                  localStorage.removeItem(key);
                }
              }
              setShowLogoutConfirm(false);
              // 앱 메모리 상태(캐시 포함)를 완벽하게 날리기 위해 강제 리로드 이동
              window.location.href = "/";
            }} className="flex-1 py-3 rounded-2xl bg-destructive text-white font-semibold text-sm">
                  {t("auto.j532")}
                </button>
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>
      {/* ─── Stat Helper: Bottom Sheet Wrapper ─── */}
      {/* ─── Match Detail Modal ─── */}
      <AnimatePresence>
        {showMatchDetail && <motion.div className="fixed inset-0 z-[60] flex items-end justify-center px-safe pb-safe pt-safe" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }}>
            <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowMatchDetail(false)} />
            <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 shadow-float max-h-[80vh] overflow-y-auto" initial={{
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
              <div className="px-5 pt-4 pb-20">
                <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Heart size={18} className="text-primary" />
                    <h3 className="text-lg font-extrabold text-foreground">{t("profile.matchList")}</h3>
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">{t("profile.userCount", {
                  count: matchedUsers.length
                })}</span>
                </div>
                <div className="space-y-3">
                  {matchedUsers.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">{t("profile.noMatches")}</p>}
                  {matchedUsers.map(u => <div key={u.id} className="flex items-center gap-3 p-3 rounded-2xl bg-muted">
                      <div className="relative">
                        {u.photo ? <img src={u.photo} alt="" className="w-12 h-12 rounded-2xl object-cover" /> : <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
                            <span className="text-white font-extrabold text-lg">{u.name?.[0] ?? '?'}</span>
                          </div>}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${u.matched ? "bg-primary" : "bg-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-foreground">{u.name}</p>
                          {u.matched && <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-[9px] font-bold text-primary">{t("profile.matchBadge")}</span>}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{u.location}</p>
                        <div className="flex gap-1 mt-1">
                          {u.tags.map((tag: string) => <span key={tag} className="px-2 py-0.5 rounded-full bg-card text-[9px] font-semibold text-muted-foreground">{tag}</span>)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[10px] text-muted-foreground">{u.date}</span>
                        <button onClick={() => {
                    setShowMatchDetail(false);
                    navigate("/chat", {
                      state: {
                        chatId: u.id
                      }
                    });
                  }} className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center active:scale-90 transition-transform">
                          <MessageCircle size={14} className="text-primary-foreground" />
                        </button>
                      </div>
                    </div>)}
                </div>
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      {/* ─── Trip Detail Modal ─── */}
      <AnimatePresence>
        {showTripDetail && <motion.div className="fixed inset-0 z-[60] flex items-end justify-center px-safe pb-safe pt-safe" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }}>
            <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowTripDetail(false)} />
            <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 shadow-float max-h-[80vh] overflow-y-auto" initial={{
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
              <div className="px-5 pt-4 pb-20">
                <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Plane size={18} className="text-primary" />
                    <h3 className="text-lg font-extrabold text-foreground">{t("profile.myTrips")}</h3>
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">{t("profile.tripCount", {
                  count: myTrips.length
                })}</span>
                </div>
                <div className="space-y-3">
                  {myTrips.map(trip => <div key={trip.id} className="flex items-center gap-3 p-3 rounded-2xl bg-muted">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                        {trip.title.split(' ')[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{trip.title}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin size={10} className="text-primary" />
                          <p className="text-[11px] text-muted-foreground">{trip.destination}</p>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Calendar size={10} className="text-primary" />
                          <p className="text-[11px] text-muted-foreground">{trip.dates}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${trip.status === t("profile.statusOngoing") ? "bg-primary/10 text-primary" : trip.status === t("profile.statusUpcoming") ? "bg-accent/20 text-accent-foreground" : "bg-muted-foreground/10 text-muted-foreground"}`}>{trip.status}</span>
                        <div className="flex items-center gap-1">
                          <Users size={10} className="text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">{t("profile.memberCount", {
                        count: trip.members
                      })}</span>
                        </div>
                      </div>
                    </div>)}
                </div>
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      {/* ─── Meeting Detail Modal ─── */}
      <AnimatePresence>
        {showMeetingDetail && <motion.div className="fixed inset-0 z-[60] flex items-end justify-center px-safe pb-safe pt-safe" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }}>
            <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowMeetingDetail(false)} />
            <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 shadow-float max-h-[80vh] overflow-y-auto" initial={{
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
              <div className="px-5 pt-4 pb-20">
                <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Handshake size={18} className="text-primary" />
                    <h3 className="text-lg font-extrabold text-foreground">{t("profilePage.meetingsTitle")}</h3>
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">{t("profile.meetingCount", {
                  count: myMeetings.length
                })}</span>
                </div>
                <div className="space-y-3">
                  {myMeetings.map(meet => <div key={meet.id} className="flex items-center gap-3 p-3 rounded-2xl bg-muted">
                      {meet.photo ? <img src={meet.photo} alt="" className="w-12 h-12 rounded-2xl object-cover" /> : <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
                          <span className="text-white font-extrabold text-lg">{meet.name?.[0] ?? '?'}</span>
                        </div>}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-foreground">{meet.name}</p>
                          <span className="px-1.5 py-0.5 rounded-full bg-card text-[9px] font-semibold text-muted-foreground">{meet.type}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin size={10} className="text-primary" />
                          <p className="text-[11px] text-muted-foreground truncate">{meet.place}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{meet.date}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex">
                          {Array.from({
                      length: 5
                    }).map((_, i) => <Star key={i} size={10} className={i < meet.rating ? "text-accent" : "text-border"} fill={i < meet.rating ? "currentColor" : "none"} />)}
                        </div>
                        <span className="text-[9px] text-muted-foreground">{meet.rating}.0 / 5.0</span>
                      </div>
                    </div>)}
                </div>
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      {/* ─── Delete Account Confirm Modal ─── */}
      <AnimatePresence>
        {showDeleteConfirm && <motion.div className="fixed inset-0 z-[70] flex items-center justify-center p-6" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }}>
            <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
            <motion.div className="relative z-10 w-full max-w-sm bg-card rounded-3xl p-6 shadow-float text-center" initial={{
          scale: 0.9,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} exit={{
          scale: 0.9,
          opacity: 0
        }}>
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <h3 className="text-xl font-extrabold text-foreground mb-2">{t("profile.withdrawConfirmTitle")}</h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                {t("profile.withdrawConfirmDesc1")}<br />{t("profile.withdrawConfirmDesc2")}
              </p>
              <div className="flex flex-col gap-2">
                <button onClick={async () => {
              if (user) {
                // 삭제(탈퇴) RPC 호출: auth.users에서 삭제되면 전체 CASCADE가 트리거되어 모든 데이터가 삭제됩니다.
                await supabase.rpc('delete_user');
                await supabase.auth.signOut();
              }
              localStorage.removeItem("migo_logged_in");
              setShowDeleteConfirm(false);
              toast({
                title: t("profilePage.delete.success")
              });
              navigate("/onboarding", {
                replace: true
              });
            }} className="w-full py-3.5 rounded-2xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors">
                  {t("profile.withdrawConfirm")}
                </button>
                <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-3.5 rounded-2xl bg-muted text-foreground font-semibold text-sm hover:bg-muted/80 transition-colors">
                  {t("auto.j533")}
                </button>
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      <MigoPlusModal isOpen={showPlusModal} onClose={() => setShowPlusModal(false)} />
      <SOSModal isOpen={showSOS} onClose={() => setShowSOS(false)} />

      {/* Tutorial (re-run from profile) */}
      <AnimatePresence>
        {showTutorialLocal && <TutorialOverlay onComplete={() => setShowTutorialLocal(false)} />}
      </AnimatePresence>

      {/* ─── 이용약관 Modal ─── */}
      <AnimatePresence>
        {showTermsModal && <motion.div className="fixed inset-0 z-[80] bg-background flex flex-col" initial={{
        x: "100%"
      }} animate={{
        x: 0
      }} exit={{
        x: "100%"
      }} transition={{
        type: "spring",
        damping: 28,
        stiffness: 300
      }}>
            <div className="flex items-center gap-3 px-5 pt-10 pb-4 border-b border-border shrink-0">
              <button onClick={() => setShowTermsModal(false)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"><X size={18} /></button>
              <h2 className="text-lg font-extrabold text-foreground">{t("profile.termsTitle")}</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 text-sm text-foreground leading-relaxed pb-20">
              <p className="text-xs text-muted-foreground">{t("profile.termsEffective")}</p>

              {[{
            title: t("profile.terms1Title"),
            content: t("profile.terms1Content")
          }, {
            title: t("profile.terms2Title"),
            content: t("profile.terms2Content")
          }, {
            title: t("profile.terms3Title"),
            content: t("profile.terms3Content")
          }, {
            title: t("profile.terms4Title"),
            content: t("profile.terms4Content")
          }, {
            title: t("profile.terms5Title"),
            content: t("profile.terms5Content")
          }, {
            title: t("profile.terms6Title"),
            content: t("profile.terms6Content")
          }, {
            title: t("profile.terms7Title"),
            content: t("profile.terms7Content")
          }, {
            title: t("profile.terms8Title"),
            content: t("profile.terms8Content")
          }, {
            title: t("profile.terms9Title"),
            content: t("profile.terms9Content")
          }, {
            title: t("profile.terms10Title"),
            content: t("profile.terms10Content")
          }].map((s, i) => <div key={i}>
                  <h3 className="font-extrabold text-foreground mb-1.5">{s.title}</h3>
                  <p className="text-muted-foreground text-[13px] leading-relaxed">{s.content}</p>
                </div>)}

              <div className="mt-6 p-4 bg-muted rounded-2xl">
                <p className="text-xs text-muted-foreground"><span className="font-bold text-foreground">{t("profile.companyInfo")}</span><br />{t("profile.companyName")}: Lunatics Group Inc<br />{t("profile.ceo")}: {t("profile.managerName")}<br />{t("profile.email")}: support@lunaticsgroup.com</p>
              </div>
            </div>
          </motion.div>}
      </AnimatePresence>

      {/* ─── 개인정보처리방침 Modal ─── */}
      <AnimatePresence>
        {showPrivacyPolicyModal && <motion.div className="fixed inset-0 z-[80] bg-background flex flex-col" initial={{
        x: "100%"
      }} animate={{
        x: 0
      }} exit={{
        x: "100%"
      }} transition={{
        type: "spring",
        damping: 28,
        stiffness: 300
      }}>
            <div className="flex items-center gap-3 px-5 pt-10 pb-4 border-b border-border shrink-0">
              <button onClick={() => setShowPrivacyPolicyModal(false)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"><X size={18} /></button>
              <h2 className="text-lg font-extrabold text-foreground">{t("profilePage.privacyTitle")}</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 text-sm text-foreground leading-relaxed pb-20">
              <p className="text-xs text-muted-foreground">{t("profile.privacyEffective")}</p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{t("profile.privacyIntro")}</p>

              {[{
            title: t("profile.privacy1Title"),
            content: t("profile.privacy1Content")
          }, {
            title: t("profile.privacy2Title"),
            content: t("profile.privacy2Content")
          }, {
            title: t("profile.privacy3Title"),
            content: t("profile.privacy3Content")
          }, {
            title: t("profile.privacy4Title"),
            content: t("profile.privacy4Content")
          }, {
            title: t("profile.privacy5Title"),
            content: t("profile.privacy5Content")
          }, {
            title: t("profile.privacy6Title"),
            content: t("profile.privacy6Content")
          }, {
            title: t("profile.privacy7Title"),
            content: t("profile.privacy7Content")
          }, {
            title: t("profile.privacy8Title"),
            content: t("profile.privacy8Content")
          }].map((s, i) => <div key={i}>
                  <h3 className="font-extrabold text-foreground mb-1.5">{s.title}</h3>
                  <p className="text-muted-foreground text-[13px] leading-relaxed whitespace-pre-line">{s.content}</p>
                </div>)}

              <div className="mt-6 p-4 bg-muted rounded-2xl">
                <p className="text-xs text-muted-foreground"><span className="font-bold text-foreground">{t("profile.privacyManager")}</span><br />Lunatics Group Inc · {t("profile.managerName")}<br />privacy@lunaticsgroup.com</p>
              </div>
            </div>
          </motion.div>}
      </AnimatePresence>


      {/* ─── 오픈소스 라이선스 Modal ─── */}
      <AnimatePresence>
        {showLicenseModal && <motion.div className="fixed inset-0 z-[80] bg-background flex flex-col" initial={{
        x: "100%"
      }} animate={{
        x: 0
      }} exit={{
        x: "100%"
      }} transition={{
        type: "spring",
        damping: 28,
        stiffness: 300
      }}>
            <div className="flex items-center gap-3 px-5 pt-10 pb-4 border-b border-border shrink-0">
              <button onClick={() => setShowLicenseModal(false)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"><X size={18} /></button>
              <h2 className="text-lg font-extrabold text-foreground">{t("profilePage.licenseTitle")}</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5 pb-20">
              <p className="text-[13px] text-muted-foreground mb-5 leading-relaxed">{t("profile.ossIntro")}</p>
              <div className="space-y-3">
                {[{
              name: "React",
              version: "18.x",
              license: "MIT",
              author: "Meta Platforms, Inc."
            }, {
              name: "Vite",
              version: "5.x",
              license: "MIT",
              author: "Evan You"
            }, {
              name: "TypeScript",
              version: "5.x",
              license: "Apache-2.0",
              author: "Microsoft Corporation"
            }, {
              name: "Framer Motion",
              version: "11.x",
              license: "MIT",
              author: "Framer B.V."
            }, {
              name: "Tailwind CSS",
              version: "3.x",
              license: "MIT",
              author: "Tailwind Labs, Inc."
            }, {
              name: "Supabase JS",
              version: "2.x",
              license: "MIT",
              author: "Supabase, Inc."
            }, {
              name: "Lucide React",
              version: "0.x",
              license: "ISC",
              author: "Lucide Contributors"
            }, {
              name: "React Router",
              version: "6.x",
              license: "MIT",
              author: "Remix Software"
            }, {
              name: "Capacitor",
              version: "6.x",
              license: "MIT",
              author: "Ionic"
            }, {
              name: "Radix UI",
              version: "1.x",
              license: "MIT",
              author: "WorkOS"
            }, {
              name: "TanStack Query",
              version: "5.x",
              license: "MIT",
              author: "Tanner Linsley"
            }, {
              name: "class-variance-authority",
              version: "0.x",
              license: "Apache-2.0",
              author: "Joe Bell"
            }, {
              name: "clsx",
              version: "2.x",
              license: "MIT",
              author: "Luke Edwards"
            }, {
              name: "date-fns",
              version: "3.x",
              license: "MIT",
              author: "date-fns contributors"
            }, {
              name: "Sonner",
              version: "1.x",
              license: "MIT",
              author: "Emil Kowalski"
            }, {
              name: "OpenAI JS",
              version: "4.x",
              license: "Apache-2.0",
              author: "OpenAI"
            }].map(lib => <div key={lib.name} className="flex items-center justify-between p-3.5 bg-muted rounded-2xl">
                    <div>
                      <p className="text-sm font-bold text-foreground">{lib.name} <span className="text-[10px] font-normal text-muted-foreground">{lib.version}</span></p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{lib.author}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-primary/10 text-[10px] font-bold text-primary">{lib.license}</span>
                  </div>)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-5 leading-relaxed">{t("profile.ossOutro")}</p>
            </div>
          </motion.div>}
      </AnimatePresence>

      {/* 신뢰 인증 모달 */}
      <TrustVerifyModal isOpen={showVerifyModal} onClose={() => setShowVerifyModal(false)} currentLevel="basic" phoneVerified={true} />
    </div>;
};
export default ProfilePage;