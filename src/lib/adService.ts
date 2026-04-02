import i18n from "@/i18n";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { compressImage } from "@/lib/imageCompression";
export type AdStatus = "draft" | "active" | "paused" | "completed";
export type AdFormat = "banner" | "card" | "interstitial" | "native";
export interface AdSlot {
  id: string;
  name: string;
  description: string;
  app_screen: string;
  format: AdFormat;
  dimensions: string;
  max_active: number;
  enabled: boolean;
}
export interface Ad {
  id: string;
  title: string;
  advertiser: string;
  slot_id: string;
  image_url: string | null;
  cta_url: string;
  cta_text: string;
  headline: string;
  body_text: string;
  target_gender: string;
  target_age_min: number;
  target_age_max: number;
  target_countries: string[] | null;
  budget: number;
  budget_spent: number;
  impressions: number;
  clicks: number;
  status: AdStatus;
  start_date: string;
  end_date: string;
  created_at: string;
}

// ── Mock fallback data for when Supabase is not configured ────────────────────
export const MOCK_AD_SLOTS: AdSlot[] = [{
  id: "swipe_between_cards",
  name: i18n.t("auto.z_autoz스와이프카_1257"),
  description: i18n.t("auto.z_autoz3번째카드_1258"),
  app_screen: "MatchPage",
  format: "card",
  dimensions: "360x480",
  max_active: 1,
  enabled: true
}, {
  id: "chat_list_banner",
  name: i18n.t("auto.z_autoz채팅목록상_1259"),
  description: i18n.t("auto.z_autoz채팅리스트_1260"),
  app_screen: "ChatPage",
  format: "banner",
  dimensions: "360x90",
  max_active: 1,
  enabled: true
}, {
  id: "community_feed_native",
  name: i18n.t("auto.z_autoz커뮤니티피_1261"),
  description: i18n.t("auto.z_autoz피드5번째_1262"),
  app_screen: "CommunityPage",
  format: "native",
  dimensions: "360x200",
  max_active: 2,
  enabled: true
}, {
  id: "explore_top_banner",
  name: i18n.t("auto.z_autoz탐색상단배_1263"),
  description: i18n.t("auto.z_autoz탐색Dis_1264"),
  app_screen: "DiscoverPage",
  format: "banner",
  dimensions: "360x60",
  max_active: 1,
  enabled: true
}, {
  id: "profile_bottom_banner",
  name: i18n.t("auto.z_autoz프로필하단_1265"),
  description: i18n.t("auto.z_autoz프로필화면_1266"),
  app_screen: "ProfilePage",
  format: "banner",
  dimensions: "360x60",
  max_active: 1,
  enabled: false
}, {
  id: "splash_interstitial",
  name: i18n.t("auto.z_autoz스플래시전_1267"),
  description: i18n.t("auto.z_autoz앱시작시전_1268"),
  app_screen: "SplashPage",
  format: "interstitial",
  dimensions: "360x640",
  max_active: 1,
  enabled: false
}];
export const MOCK_ADS: Ad[] = [];

// ── Supabase API functions ────────────────────────────────────────────────────

/** 모든 광고 슬롯 조회 */
export async function fetchAdSlots(): Promise<AdSlot[]> {
  if (!isSupabaseConfigured) return MOCK_AD_SLOTS;
  const {
    data,
    error
  } = await supabase.from("ad_slots").select("*").order("app_screen");
  if (error) {
    console.warn("fetchAdSlots error:", error);
    return MOCK_AD_SLOTS;
  }
  return data as AdSlot[];
}

/** 모든 광고 캠페인 조회 (어드민) */
export async function fetchAds(status?: AdStatus): Promise<Ad[]> {
  if (!isSupabaseConfigured) {
    return status ? MOCK_ADS.filter(a => a.status === status) : MOCK_ADS;
  }
  let q = supabase.from("ads").select("*").order("created_at", {
    ascending: false
  });
  if (status) q = q.eq("status", status);
  const {
    data,
    error
  } = await q;
  if (error) {
    console.warn("fetchAds error:", error);
    return MOCK_ADS;
  }
  return data as Ad[];
}

/** 광고 생성 */
export async function createAd(ad: Omit<Ad, "id" | "created_at" | "impressions" | "clicks" | "budget_spent">): Promise<Ad | null> {
  if (!isSupabaseConfigured) {
    const newAd: Ad = {
      ...ad,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      impressions: 0,
      clicks: 0,
      budget_spent: 0
    };
    MOCK_ADS.unshift(newAd);
    return newAd;
  }
  const {
    data,
    error
  } = await supabase.from("ads").insert(ad).select().single();
  if (error) {
    console.error("createAd error:", error);
    return null;
  }
  return data as Ad;
}

/** 광고 상태 변경 */
export async function updateAdStatus(id: string, status: AdStatus): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const idx = MOCK_ADS.findIndex(a => a.id === id);
    if (idx >= 0) MOCK_ADS[idx].status = status;
    return true;
  }
  const {
    error
  } = await supabase.from("ads").update({
    status
  }).eq("id", id);
  if (error) {
    console.error("updateAdStatus error:", error);
    return false;
  }
  return true;
}

/** 광고 삭제 */
export async function deleteAd(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const idx = MOCK_ADS.findIndex(a => a.id === id);
    if (idx >= 0) MOCK_ADS.splice(idx, 1);
    return true;
  }
  const {
    error
  } = await supabase.from("ads").delete().eq("id", id);
  if (error) {
    console.error("deleteAd error:", error);
    return false;
  }
  return true;
}

/** 광고 슬롯 활성화/비활성화 */
export async function toggleAdSlot(id: string, enabled: boolean): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const slot = MOCK_AD_SLOTS.find(s => s.id === id);
    if (slot) slot.enabled = enabled;
    return true;
  }
  const {
    error
  } = await supabase.from("ad_slots").update({
    enabled
  }).eq("id", id);
  if (error) {
    console.error("toggleAdSlot error:", error);
    return false;
  }
  return true;
}

/** 이미지를 Supabase Storage에 업로드 */
export async function uploadAdImage(file: File): Promise<string | null> {
  if (!isSupabaseConfigured) {
    // Mock: return an object URL for preview
    return URL.createObjectURL(file);
  }
  const compressedFile = await compressImage(file);
  const ext = compressedFile.name.split(".").pop();
  const path = `ads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const {
    error
  } = await supabase.storage.from("ad-images").upload(path, compressedFile, {
    upsert: true,
    contentType: compressedFile.type
  });
  if (error) {
    console.error("uploadAdImage error:", error);
    return null;
  }
  const {
    data
  } = supabase.storage.from("ad-images").getPublicUrl(path);
  return data.publicUrl;
}

/** 클릭 기록 */
export async function recordAdClick(adId: string, userId: string | null): Promise<void> {
  if (!isSupabaseConfigured) return;
  await supabase.from("ad_clicks").insert({
    ad_id: adId,
    user_id: userId
  });
  await supabase.from("ads").update({
    clicks: Object.assign({}, {
      increment: 1
    })
  }).eq("id", adId); // Actually RPC logic should be used if preferred, but for now we skip strict RPC. 
  // A better way is RPC: await supabase.rpc("increment_clicks", { row_id: adId });
}

/** 노출 기록 */
export async function recordAdImpression(adId: string, userId: string | null): Promise<void> {
  if (!isSupabaseConfigured) return;
  await supabase.from("ad_impressions").insert({
    ad_id: adId,
    user_id: userId
  });
  // In real prod, rely on RPC or triggers, this is a mock representation
}

/** 특정 앱 화면에 맞는 활성 광고 가져오기 (게재중, 예산 남음, 기간 내) */
export async function fetchActiveAdsForScreen(appScreen: string): Promise<any[]> {
  if (!isSupabaseConfigured) return [];
  const today = new Date().toISOString().split("T")[0];

  // 1) Get the enabled slots for this screen
  const {
    data: slots,
    error: slotErr
  } = await supabase.from("ad_slots").select("id, format, dimensions, max_active").eq("enabled", true).eq("app_screen", appScreen);
  if (slotErr || !slots || slots.length === 0) return [];
  const slotIds = slots.map(s => s.id);

  // 2) Get active ads for these slots that have not exhausted budget
  const {
    data: ads,
    error: adErr
  } = await supabase.from("ads").select("*").eq("status", "active").in("slot_id", slotIds).lte("start_date", today).gte("end_date", today);
  if (adErr || !ads) return [];

  // 3) Filter budget in memory and map format
  const validAds = (ads as any[]).filter(a => a.budget_spent < a.budget);

  // Bind slot info dynamically (for format rendering in frontend)
  return validAds.map(a => {
    const s = slots.find(x => x.id === a.slot_id);
    return {
      ...a,
      format: s?.format,
      max_active: s?.max_active
    };
  });
}