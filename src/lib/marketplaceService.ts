import i18n from "@/i18n";
import { supabase } from "./supabaseClient";
export interface Package {
  id: string;
  title: string;
  host: string;
  hostAvatar: string;
  destination: string;
  category: "tour" | "stay" | "activity" | "food" | string;
  price: number;
  duration: string;
  maxPeople: number;
  currentPeople: number;
  rating: number;
  reviewCount: number;
  image: string;
  tags: string[];
  description: string;
  featured?: boolean;
}

// Helper to standardise fetched data
const mapToPackage = (d: any): Package => ({
  id: d.id,
  title: d.title || i18n.t("auto.z_autoz무제915_1253"),
  host: d.profiles?.name || d.host || i18n.t("auto.z_autoz익명호스트_1254"),
  hostAvatar: d.profiles?.photo_url || d.host_avatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&q=80",
  destination: d.destination || i18n.t("auto.z_autoz미등록91_1255"),
  category: d.category || 'tour',
  price: d.price || 0,
  duration: d.duration || i18n.t("auto.z_autoz상세보기9_1256"),
  maxPeople: d.max_people || 10,
  currentPeople: d.current_people || 0,
  rating: d.rating || 0,
  reviewCount: d.review_count || 0,
  image: d.image_url || "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80",
  tags: d.tags || [],
  description: d.description || '',
  featured: d.featured || false
});

/** 상품 목록 조회 — 항상 실제 DB */
export async function fetchMarketplaceItems(): Promise<Package[]> {
  const {
    data,
    error
  } = await supabase.from('marketplace_items').select('*, profiles (name, photo_url)').order("created_at", {
    ascending: false
  });
  if (error) {
    console.warn("fetchMarketplaceItems error:", error.message);
    return [];
  }
  return (data || []).map(mapToPackage);
}

/** 상품 등록 — 항상 실제 DB */
export async function createMarketplaceItem(item: Omit<Package, "id" | "host" | "hostAvatar" | "rating" | "reviewCount">) {
  // 현재 로그인한 유저의 ID를 host_id로 사용
  const {
    data: {
      user
    }
  } = await supabase.auth.getUser();
  const payload = {
    host_id: user?.id ?? null,
    title: item.title,
    destination: item.destination,
    category: item.category,
    price: item.price,
    duration: item.duration,
    max_people: item.maxPeople,
    current_people: item.currentPeople,
    image_url: item.image,
    tags: item.tags,
    description: item.description,
    featured: item.featured ?? false
  };
  const {
    error
  } = await supabase.from("marketplace_items").insert(payload);
  if (error) {
    console.error("createMarketplaceItem error:", error.message);
    return false;
  }
  return true;
}

/** 상품 수정 — 항상 실제 DB */
export async function updateMarketplaceItem(id: string, updates: Partial<Package>) {
  const payload: any = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.price !== undefined) payload.price = updates.price;
  if (updates.image !== undefined) payload.image_url = updates.image;
  if (updates.featured !== undefined) payload.featured = updates.featured;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.destination !== undefined) payload.destination = updates.destination;
  if (updates.duration !== undefined) payload.duration = updates.duration;
  if (updates.maxPeople !== undefined) payload.max_people = updates.maxPeople;
  if (updates.tags !== undefined) payload.tags = updates.tags;
  const {
    error
  } = await supabase.from("marketplace_items").update(payload).eq("id", id);
  if (error) {
    console.error("updateMarketplaceItem error:", error.message);
    return false;
  }
  return true;
}

/** 상품 삭제 — 항상 실제 DB */
export async function deleteMarketplaceItem(id: string) {
  const {
    error
  } = await supabase.from("marketplace_items").delete().eq("id", id);
  if (error) {
    console.error("deleteMarketplaceItem error:", error.message);
    return false;
  }
  return true;
}