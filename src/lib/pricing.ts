import i18n from "@/i18n";

export type CountryTier = 1 | 2 | 3;

const TIER_1_COUNTRIES = [
  "KR", "US", "JP", "GB", "AU", "CA", "NZ", "CH", "SG", "TW", "HK", "AE", "SA", "QA",
  "DE", "FR", "IT", "ES", "NL", "SE", "NO", "FI", "DK", "IE", "AT", "BE", "LU"
];
const TIER_2_COUNTRIES = [
  "BR", "MX", "AR", "CO", "CL", "PE", "TR", "RU", "PL", "CZ", "HU", "RO", "GR", "PT",
  "ZA", "EG", "MA"
];
// Default everything else to Tier 3

const COUNTRY_CURRENCIES: Record<string, string> = {
  KR: "KRW",
  JP: "JPY",
  GB: "GBP",
  EU: "EUR", // Fallback for Eurozone
  DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR", AT: "EUR", IE: "EUR", BE: "EUR", FI: "EUR", LU: "EUR",
  AU: "AUD",
  CA: "CAD",
  SG: "SGD",
  CH: "CHF"
};

const getCountryCode = (): string => {
  // Try to extract from currently selected language (e.g. ko-KR -> KR, en-US -> US)
  // Or fallback to checking browser timezone or navigator language
  const navLang = navigator.language || i18n.language || "en-US";
  const parts = navLang.split('-');
  return parts.length > 1 ? parts[1].toUpperCase() : "US"; // Default to US
};

const getTier = (countryCode: string): CountryTier => {
  if (TIER_1_COUNTRIES.includes(countryCode)) return 1;
  if (TIER_2_COUNTRIES.includes(countryCode)) return 2;
  return 3;
};

// Premium Subscription Pricing
export const getMigoPlusPricing = () => {
  const country = getCountryCode();
  const tier = getTier(country);
  const currency = COUNTRY_CURRENCIES[country] || "USD";

  /**
 * ══════════════════════════════════════════════════════
 * MIGO 수익 모델 (순이익 공식 반영 가격)
 * ══════════════════════════════════════════════════════
 * 순이익 = 결제금액 - 앱스토어수수료(15%) - 운영비 - UAC상각
 *
 * 비용 상수:
 *  앱스토어: 15% (Apple/Google 소규모 사업자)
 *  광고 예산: Phase1 ₩500,000/월 → Phase2 ₩1,000,000 → Phase3 ₩2,000,000
 *  예상 CPI: ₩1,884 (Meta 50% + TikTok 30% + Google UAC 20%)
 *  월 신규 설치: 265건 (Phase1)
 *  유료 전환율: 8% → 21명/월
 *  블렌디드 CAC: ₩15,748 (유기 설치 포함)
 *  UAC 상각: ₩15,748 ÷ 8개월 = ₩2,000/월  [이전 ₩5,000 → 수정]
 *  운영비 Plus: ₩1,813/월 (Maps ₩1,200 + AI ₩80 + Infra ₩533)
 *  운영비 Premium: ₩2,813/월
 *
 * 플랜별 검증 (수정된 UAC 반영):
 *  Plus 월간  ₩14,900 → 순이익 ₩8,852  (59.4%) ✅✅
 *  Plus 3개월 ₩34,900 → 순이익 ₩18,226 (52.2%) ✅✅
 *  Plus 연간  ₩99,900 → 순이익 ₩47,411 (47.5%) ✅✅
 *
 * BEP: Phase1 광고비 기준 Month 5 달성 (유료 유저 78명)
 */
  if (currency === "KRW") {
    return {
      currency: "₩",
      month1: 14900,
      month3: 34900,   // ₩28,900 → ₩34,900 (UAC+운영비 반영)
      month12: 99900,  // ₩79,900 → ₩99,900 (연간 UAC 총비용 반영)
      format: (val: number) => `₩${val.toLocaleString()}`
    };
  }

  // USD prices by tier (net margin validated)
  const pricesUSD = {
    1: { month1: 11.99, month3: 26.99, month12: 74.99 },
    2: { month1: 7.99,  month3: 17.99, month12: 49.99 },
    3: { month1: 4.99,  month3: 10.99, month12: 29.99 }
  };

  const p = pricesUSD[tier];

  return {
    currency: "$",
    month1: p.month1,
    month3: p.month3,
    month12: p.month12,
    format: (val: number) => `$${val.toFixed(2)}`
  };
};

// Group Creation Fee
export const getGroupCreationFeeOptions = () => {
  const country = getCountryCode();
  const tier = getTier(country);
  const currency = COUNTRY_CURRENCIES[country] || "USD";

  if (currency === "KRW") {
    return {
      options: [3000, 5000, 10000],
      currency: "₩",
      format: (val: number) => `₩${val.toLocaleString()}`
    };
  }

  const optionsUSD = {
    1: [2.99, 4.99, 9.99],
    2: [1.99, 3.99, 7.99],
    3: [0.99, 1.99, 4.99]
  };

  return {
    options: optionsUSD[tier],
    currency: "$",
    format: (val: number) => `$${val.toFixed(2)}`
  };
};

/**
 * Item Shop Pricing (full net profit formula applied)
 *
 * 아이템 비용 분석 — 기존 유저 upsell이므로 UAC 없음
 * ┌──────────────┬──────────┬───────────┬────────┬─────────┐
 * │ 아이템       │ 가격(KRW)│ 스토어15% │ API비용│ 순마진  │
 * ├──────────────┼──────────┼───────────┼────────┼─────────┤
 * │ SuperLike x5 │  ₩4,900  │   ₩735    │   ₩7   │  84.9%  │
 * │ SuperLike x15│ ₩12,900  │  ₩1,935   │  ₩20   │  84.8%  │
 * │ Boost x1     │  ₩3,900  │   ₩585    │  ₩13   │  84.7%  │
 * │ Boost x5     │ ₩15,900  │  ₩2,385   │  ₩67   │  84.6%  │
 * │ 인증뱃지     │  ₩9,900  │  ₩1,485   │ ₩667   │  78.3%  │
 * │ 프로필테마   │  ₩5,900  │   ₩885    │   ₩0   │  85.0%  │
 * │ 트래블팩     │ ₩14,900  │  ₩2,235   │  ₩87   │  84.4%  │
 * │ 근처언락 7일 │  ₩5,900  │   ₩885    │ ₩1,182 │  64.8%  │ ← Maps비용
 * └──────────────┴──────────┴───────────┴────────┴─────────┘
 * Maps API 비용(7일): 21 calls × ₩42.7 + 5 Places × ₩56.9 = ₩1,182
 */
export const getShopItemPricing = () => {
  const country = getCountryCode();
  const tier = getTier(country);
  const currency = COUNTRY_CURRENCIES[country] || "USD";

  // KRW (전체 비용 모델 반영 완료)
  if (currency === "KRW") {
    return {
      currency: "₩",
      format: (val: number) => `₩${val.toLocaleString()}`,
      superlike_5: 4900,
      superlike_15: 12900,
      boost_1: 3900,
      boost_5: 15900,
      verified_badge: 9900,
      profile_theme: 5900,
      travel_pack: 14900,
      nearby_unlock: 5900,  // ₩4,900 → ₩5,900 (Maps API ₩1,182 반영)
    };
  }

  // USD prices by tier (margin optimized, net of app store 15%)
  const pricesUSD: Record<string, [number, number, number]> = {
    // id: [tier1, tier2, tier3]
    superlike_5:     [3.99,  2.49, 1.49],
    superlike_15:    [9.99,  6.99, 3.99],
    boost_1:         [2.99,  1.99, 0.99],
    boost_5:         [12.99, 8.99, 4.99],
    verified_badge:  [7.99,  4.99, 2.99],
    profile_theme:   [4.99,  2.99, 1.49],
    travel_pack:     [11.99, 7.99, 4.99],
    nearby_unlock:   [4.99,  2.99, 1.99],  // raised: maps cost
  };

  const idx = tier - 1;
  const p: Record<string, number> = {};
  for (const [id, vals] of Object.entries(pricesUSD)) {
    p[id] = vals[idx];
  }

  return {
    currency: "$",
    format: (val: number) => `$${val.toFixed(2)}`,
    ...p,
  } as { currency: string; format: (v: number) => string } & typeof p;
};

/**
 * Converts base KRW prices into localized currency formats.
 * Applies approximate exchange rates and psychological pricing rules (e.g. .99).
 */

const RATES = {
  USD: 0.00075,
  EUR: 0.00069,
  JPY: 0.11,
  CNY: 0.0053,
  GBP: 0.00059,
  INR: 0.0625,    // Indian Rupee
  IDR: 11.8,      // Indonesian Rupiah
  BRL: 0.0038,    // Brazilian Real
  THB: 0.027,     // Thai Baht
  VND: 18.8,      // Vietnamese Dong
  TRY: 0.024,     // Turkish Lira
  MXN: 0.0130,    // Mexican Peso
  AUD: 0.00115,   // Australian Dollar
  CAD: 0.00103,   // Canadian Dollar
  SGD: 0.00101,   // Singapore Dollar
  CHF: 0.00068,   // Swiss Franc
};

const EUR_LANGS = ['fr', 'de', 'it', 'es', 'nl', 'el', 'fi', 'sv', 'da', 'sk', 'sl', 'ro', 'hr', 'lt', 'lv', 'et'];
const GBP_LANGS = ['en-GB'];

export function getLocalizedPrice(krwAmount: number, lang: string = 'ko'): string {
  if (krwAmount === 0) {
    return new Intl.NumberFormat(lang, {
      style: 'currency',
      currency: lang === 'ko' ? 'KRW' : 'USD',
      maximumFractionDigits: 0,
    }).format(0);
  }

  let currency = 'USD';
  let rate = RATES.USD;
  let fractionDigits = 2;

  const baseLang = lang.split('-')[0];

  if (lang === 'ko') {
    currency = 'KRW'; rate = 1; fractionDigits = 0;
  } else if (lang === 'ja') {
    currency = 'JPY'; rate = RATES.JPY; fractionDigits = 0;
  } else if (lang === 'zh') {
    currency = 'CNY'; rate = RATES.CNY; fractionDigits = 1;
  } else if (lang === 'hi' || baseLang === 'hi' || lang === 'bn' || lang === 'gu' || lang === 'mr') {
    currency = 'INR'; rate = RATES.INR; fractionDigits = 0;
  } else if (lang === 'id') {
    currency = 'IDR'; rate = RATES.IDR; fractionDigits = 0;
  } else if (lang === 'th') {
    currency = 'THB'; rate = RATES.THB; fractionDigits = 0;
  } else if (lang === 'vi') {
    currency = 'VND'; rate = RATES.VND; fractionDigits = 0;
  } else if (lang === 'tr') {
    currency = 'TRY'; rate = RATES.TRY; fractionDigits = 2;
  } else if (lang === 'pt-BR' || lang === 'pt') {
    currency = 'BRL'; rate = RATES.BRL; fractionDigits = 2;
  } else if (lang === 'en-AU' || lang === 'en-NZ') {
    currency = 'AUD'; rate = RATES.AUD; fractionDigits = 2;
  } else if (lang === 'en-CA' || lang === 'fr-CA') {
    currency = 'CAD'; rate = RATES.CAD; fractionDigits = 2;
  } else if (lang === 'en-SG' || lang === 'ms') {
    currency = 'SGD'; rate = RATES.SGD; fractionDigits = 2;
  } else if (lang === 'de-CH' || lang === 'fr-CH') {
    currency = 'CHF'; rate = RATES.CHF; fractionDigits = 2;
  } else if (GBP_LANGS.includes(lang)) {
    currency = 'GBP'; rate = RATES.GBP;
  } else if (EUR_LANGS.includes(baseLang) || EUR_LANGS.includes(lang)) {
    currency = 'EUR'; rate = RATES.EUR;
  }

  let raw = krwAmount * rate;

  if (currency === 'KRW' || currency === 'JPY' || currency === 'IDR' || currency === 'VND') {
    raw = Math.round(raw / 100) * 100 || Math.round(raw);
  } else if (currency === 'CNY' || currency === 'THB' || currency === 'INR') {
    raw = Math.floor(raw) + 0.9;
  } else {
    raw = Math.floor(raw) + 0.99;
  }

  return new Intl.NumberFormat(lang, {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(raw);
}
