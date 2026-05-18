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
    const lang = i18n.language?.split('-')[0] || 'en';
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=${lang}`);
    const data = await res.json();
    const city = data.city || data.locality || i18n.t("auto.z_\uC54C\uC218\uC5C6\uB294\uB3C4\uC2DC_1078", "\uC54C\uC218\uC5C6\uB294\uB3C4\uC2DC");
    const country = data.countryName || i18n.t("auto.z_\uC54C\uC218\uC5C6\uB294\uAD6D\uAC00_1079", "\uC54C\uC218\uC5C6\uB294\uAD6D\uAC00");
    return {
      city,
      country
    };
  } catch {
    return {
      city: i18n.t("auto.z_\uC54C\uC218\uC5C6\uB294\uB3C4\uC2DC_1080", "\uC54C\uC218\uC5C6\uB294\uB3C4\uC2DC"),
      country: i18n.t("auto.z_\uC54C\uC218\uC5C6\uB294\uAD6D\uAC00_1081", "\uC54C\uC218\uC5C6\uB294\uAD6D\uAC00")
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
  } = await supabase.from("travel_check_ins")
    .select("id, user_id, city, country, lat, lng, checked_in_at, expires_at")
    .eq("user_id", userId).gt("expires_at", new Date().toISOString()).maybeSingle();
  
  // 현재 언어에 맞게 실시간 역지오코딩 처리 (UI 일관성 유지)
  if (data) {
    const geo = await reverseGeocode(data.lat, data.lng);
    data.city = geo.city;
    data.country = geo.country;
  }
  return data;
}

// ── 주변 여행자 목록 (Bounding Box) ─────────────────────────────────────
export async function fetchCityTravelers(lat: number, lng: number, myUserId: string): Promise<CheckIn[]> {
  const latDelta = 0.5; // 약 50km
  const lngDelta = 0.5;
  const { data } = await supabase.from("travel_check_ins")
    .select("id, user_id, city, country, lat, lng, checked_in_at, expires_at, profile:profiles(id, name, photo_url, age, nationality)")
    .gte('lat', lat - latDelta)
    .lte('lat', lat + latDelta)
    .gte('lng', lng - lngDelta)
    .lte('lng', lng + lngDelta)
    .gt("expires_at", new Date().toISOString())
    .neq("user_id", myUserId)
    .limit(50); // 트래픽 최적화
  return data || [];
}

// ── 체크아웃 ──────────────────────────────────────────────────
export async function checkOut(userId: string): Promise<void> {
  await supabase.from("travel_check_ins").delete().eq("user_id", userId);
}