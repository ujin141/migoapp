import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabaseClient";
import { useGlobalFilter } from "@/context/GlobalFilterContext";
import useGeoDistance from "@/hooks/useGeoDistance";
import { getChosung } from "@/lib/chosungUtils";
import { Post, TripGroup } from "@/types";

type User = { id: string; email?: string; name?: string; photoUrl?: string } | null;

export function useDiscoverData(user: User) {
  const { i18n, t } = useTranslation();
  const { distanceTo } = useGeoDistance();
  const { filters: globalFilters } = useGlobalFilter();

  const fetchPostsCounter = useRef(0);
  const fetchGroupsCounter = useRef(0);

  // ── Posts state ─────────────────────────────────
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // ── Groups state ─────────────────────────────────
  const [tripGroups, setTripGroups] = useState<TripGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // ── Fetch posts ─────────────────────────────────
  const fetchPosts = useCallback(async () => {
    const reqId = ++fetchPostsCounter.current;
    setLoadingPosts(true);
    try {
      const postsQuery = supabase
        .from("posts")
        .select(`
          id, content, title, image_url, image_urls, tags, created_at, author_id,
          profiles!posts_author_id_fkey(name, photo_url),
          post_likes(count)
        `)
        .eq("hidden", false)
        .order("created_at", { ascending: false })
        .limit(20);

      const [{ data, error }, { data: myLikes }] = await Promise.all([
        postsQuery,
        user
          ? supabase.from("post_likes").select("post_id").eq("user_id", user.id).limit(200)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (reqId !== fetchPostsCounter.current) return;
      if (error) throw error;

      const likedSet = new Set<string>((myLikes || []).map((l: any) => l.post_id));

      const mapped: Post[] = (data || []).map((p: any) => {
        let locationTag;
        if (p.tags && Array.isArray(p.tags)) {
          const locStr = p.tags.find((tag: string) => tag.startsWith("_loc_:"));
          if (locStr) {
            const parts = locStr.split(":");
            if (parts.length >= 4) {
              locationTag = {
                lat: parseFloat(parts[1]),
                lng: parseFloat(parts[2]),
                name: parts.slice(3).join(":"),
              };
            }
          }
        }
        return {
          id: p.id,
          author: p.profiles?.name || t("auto.ko_0022", "알수없음"),
          photo: p.profiles?.photo_url || "",
          content: p.content || "",
          time: new Date(p.created_at).toLocaleDateString(i18n.language || "en"),
          likes: p.post_likes?.[0]?.count || 0,
          comments: 0,
          liked: likedSet.has(p.id),
          commentList: [],
          imageUrl: p.image_url,
          images: p.image_urls || [],
          authorId: p.author_id,
          locationTag,
        };
      });
      setPosts(mapped);

      // view_count 추적 — fire-and-forget
      if (data && data.length > 0) {
        supabase.rpc("increment_post_views", { p_ids: data.map((d: any) => d.id) })
          .then(({ error: rpcErr }) => { if (rpcErr) console.warn('[increment_post_views] error:', rpcErr.message); })
          .catch(e => console.error('[increment_post_views] catch:', e));
      }
    } catch (err: any) {
      if (reqId !== fetchPostsCounter.current) return;
      const msg = err?.message || "";
      if (!msg.includes("lock") && !msg.includes("stole")) {
        console.error("fetchPosts error:", err);
      }
    } finally {
      if (reqId === fetchPostsCounter.current) {
        setLoadingPosts(false);
      }
    }
  }, [user, i18n.language, t]);

  // ── Fetch groups ─────────────────────────────────
  const fetchGroups = useCallback(async () => {
    const reqId = ++fetchGroupsCounter.current;
    setLoadingGroups(true);
    try {
      let query = supabase
        .from("trip_groups")
        .select(`
          id, title, destination, departure, dates, max_members, tags, description,
          entry_fee, is_premium, host_id,
          profiles:host_id(name, photo_url, bio, lat, lng),
          trip_group_members(user_id, profiles(name, photo_url))
        `)
        .in("status", ["recruiting", "almost_full", "active"])
        .order("created_at", { ascending: false })
        .limit(50);

      if (globalFilters.destination) {
        const dest = globalFilters.destination;
        const cho = getChosung(dest);
        query = query.or(
          `destination.ilike.%${dest}%,title.ilike.%${dest}%,destination_chosung.ilike.%${cho}%,title_chosung.ilike.%${cho}%`
        );
      }
      if (globalFilters.groupSize !== null) {
        query = query.gte("max_members", globalFilters.groupSize);
      }

      const { data, error } = await query;
      if (reqId !== fetchGroupsCounter.current) return;
      if (error) throw error;

      const mapped: TripGroup[] = (data || []).map((g: any) => {
        const members = g.trip_group_members || [];
        const joined = members.some((m: any) => m.user_id === user?.id);
        return {
          id: g.id,
          title: g.title || "",
          destination: g.destination || "",
          departure: g.departure || g.origin || "",
          dates: g.dates || t("auto.ko_0024", "미정"),
          currentMembers: members.length,
          maxMembers: g.max_members || 4,
          tags: g.tags || [],
          hostId: g.host_id || "",
          hostPhoto: g.profiles?.photo_url || "",
          hostName: g.profiles?.name || t("auto.ko_0025", "알수없음"),
          hostBio: g.profiles?.bio || "",
          daysLeft: (() => {
            try {
              const dates = g.dates || "";
              const rawEnd = dates.includes("~")
                ? dates.split("~")[1]?.trim()
                : dates.split("-")[1]?.trim();
              if (!rawEnd) return 14;
              const kor = rawEnd.match(/(\d+)월\s*(\d+)일/);
              if (kor) {
                const dt = new Date(new Date().getFullYear(), parseInt(kor[1]) - 1, parseInt(kor[2]));
                return Math.max(0, Math.ceil((dt.getTime() - Date.now()) / 86400000));
              }
              const parts = rawEnd.split("/");
              if (parts.length >= 2) {
                const m = parseInt(parts[parts.length - 2]),
                  d = parseInt(parts[parts.length - 1]);
                const dt = new Date(new Date().getFullYear(), m - 1, d);
                return Math.max(0, Math.ceil((dt.getTime() - Date.now()) / 86400000));
              }
              const parsed = new Date(rawEnd.replace(/\./g, "-"));
              if (isNaN(parsed.getTime())) return 14;
              return Math.max(0, Math.ceil((parsed.getTime() - Date.now()) / 86400000));
            } catch {
              return 14;
            }
          })(),
          joined,
          description: g.description || "",
          schedule: g.schedule || [],
          memberPhotos: members
            .map((m: any) => m.profiles?.photo_url || "")
            .filter(Boolean),
          memberNames: members.map(
            (m: any) => m.profiles?.name || t("auto.ko_0026", "알수없음")
          ),
          entryFee: g.entry_fee || 0,
          isPremiumGroup: g.is_premium || false,
          coverImage: "",
          hostCompletedGroups: 0,
          recentMessages: [],
          distanceKm:
            typeof g.profiles?.lat === "number" && typeof g.profiles?.lng === "number"
              ? (distanceTo({ lat: g.profiles.lat, lng: g.profiles.lng }) ?? 99999)
              : 99999,
        };
      });

      // 호스트 완주 횟수 + 최근 메시지 병렬 조회
      const hostIds = Array.from(new Set(mapped.map((g) => g.hostId).filter(Boolean)));
      const groupIds = mapped.map((g) => g.id).filter(Boolean);

      let reviewCounts: Record<string, number> = {};
      let groupMessages: Record<string, any[]> = {};

      if (hostIds.length > 0 || groupIds.length > 0) {
        const results = await Promise.allSettled([
          hostIds.length > 0
            ? supabase.from("meet_reviews").select("reviewed_id").in("reviewed_id", hostIds)
            : Promise.resolve({ data: [], error: null }),
          groupIds.length > 0
            ? supabase
                .from("messages")
                .select("thread_id, text, created_at, profiles!messages_sender_id_fkey(name)")
                .in("thread_id", groupIds)
                .order("created_at", { ascending: false })
                .limit(groupIds.length * 2)
            : Promise.resolve({ data: [], error: null }),
        ]);
        if (reqId !== fetchGroupsCounter.current) return;

        const revRes = results[0].status === 'fulfilled' ? results[0].value : { data: [], error: null };
        const msgRes = results[1].status === 'fulfilled' ? results[1].value : { data: [], error: null };

        if (revRes.data) {
          revRes.data.forEach((r: any) => {
            reviewCounts[r.reviewed_id] = (reviewCounts[r.reviewed_id] || 0) + 1;
          });
        }
        if (msgRes.data) {
          msgRes.data.forEach((m: any) => {
            if (!groupMessages[m.thread_id]) groupMessages[m.thread_id] = [];
            if (groupMessages[m.thread_id].length < 2) {
              const d = new Date(m.created_at);
              const isToday = d.toDateString() === new Date().toDateString();
              const timeStr = isToday
                ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : `${d.getMonth() + 1}/${d.getDate()}`;
              groupMessages[m.thread_id].push({
                author: m.profiles?.name?.split(" ")?.[0] || t("auto.ko_0027", "멤버"),
                text: m.text,
                time: timeStr,
              });
            }
          });
        }
      }

      const uniqueKeys = new Set<string>();
      const uniqueMapped = mapped
        .map((g) => ({
          ...g,
          hostCompletedGroups: Math.max(1, reviewCounts[g.hostId] || 0),
          recentMessages: groupMessages[g.id] || [],
        }))
        .filter((g) => {
          const key = g.title + "|" + g.destination;
          if (uniqueKeys.has(key)) return false;
          uniqueKeys.add(key);
          return true;
        });

      uniqueMapped.sort((a, b) => (a.distanceKm || 99999) - (b.distanceKm || 99999));
      setTripGroups(uniqueMapped);
    } catch (err: any) {
      if (reqId !== fetchGroupsCounter.current) return;
      const msg = err?.message || "";
      if (!msg.includes("lock") && !msg.includes("stole")) {
        console.error("fetchGroups error:", err);
      }
      setTripGroups([]);
    } finally {
      if (reqId === fetchGroupsCounter.current) {
        setLoadingGroups(false);
      }
    }
  }, [user, globalFilters, distanceTo, t]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    posts,
    setPosts,
    loadingPosts,
    tripGroups,
    setTripGroups,
    loadingGroups,
    refetchPosts: fetchPosts,
    refetchGroups: fetchGroups,
  };
}
