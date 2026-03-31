import i18n from "@/i18n";
import { supabase } from "./supabaseClient";
export interface CheckIn {
  id: string;
  user_id: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  checked_in_at: string;
  expires_at: string; // 24시간 자동 만료
  profile?: any;
}

// ── 역지오코딩 (lat/lng → city/country) ────────────────────────
export async function reverseGeocode(lat: number, lng: number): Promise<{
  city: string;
  country: string;
}> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ko`, {
      headers: {
        "User-Agent": "MigoApp/1.0"
      }
    });
    const data = await res.json();
    const addr = data.address || {};
    const city = addr.city || addr.town || addr.village || addr.county || addr.state || i18n.t("auto.z_\uC54C\uC218\uC5C6\uB294\uB3C4\uC2DC_1078");
    const country = addr.country || i18n.t("auto.z_\uC54C\uC218\uC5C6\uB294\uAD6D\uAC00_1079");
    return {
      city,
      country
    };
  } catch {
    return {
      city: i18n.t("auto.z_\uC54C\uC218\uC5C6\uB294\uB3C4\uC2DC_1080"),
      country: i18n.t("auto.z_\uC54C\uC218\uC5C6\uB294\uAD6D\uAC00_1081")
    };
  }
}

// ── 체크인 ────────────────────────────────────────────────────
export async function checkIn(userId: string, lat: number, lng: number): Promise<{
  data: CheckIn | null;
  error: any;
}> {
  const geo = await reverseGeocode(lat, lng);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

  // upsert: 이미 체크인 있으면 갱신
  const {
    data,
    error
  } = await supabase.from("travel_check_ins").upsert({
    user_id: userId,
    city: geo.city,
    country: geo.country,
    lat,
    lng,
    checked_in_at: new Date().toISOString(),
    expires_at: expiresAt
  }, {
    onConflict: "user_id"
  }).select().single();
  return {
    data,
    error
  };
}

// ── 현재 체크인 조회 ──────────────────────────────────────────
export async function getMyCheckIn(userId: string): Promise<CheckIn | null> {
  const {
    data
  } = await supabase.from("travel_check_ins").select("*").eq("user_id", userId).gt("expires_at", new Date().toISOString()).maybeSingle();
  return data;
}

// ── 같은 도시 여행자 목록 ─────────────────────────────────────
export async function fetchCityTravelers(city: string, myUserId: string): Promise<CheckIn[]> {
  const {
    data
  } = await supabase.from("travel_check_ins").select("*, profile:profiles(*)").ilike("city", `%${city}%`).gt("expires_at", new Date().toISOString()).neq("user_id", myUserId);
  return data || [];
}

// ── 체크아웃 ──────────────────────────────────────────────────
export async function checkOut(userId: string): Promise<void> {
  await supabase.from("travel_check_ins").delete().eq("user_id", userId);
}