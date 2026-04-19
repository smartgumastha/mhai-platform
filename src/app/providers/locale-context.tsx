"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { detectLocaleV2, cityLookupV2, V2Locale } from "@/lib/api";

// ════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════

// LocaleData type deleted T1.2.4b-phase3 — all consumers now read localeV2 directly.

type LocaleCtx = {
  localeV2: V2Locale | null;                          // new nested shape (T1.2.4b consumers)
  isLocaleLoading: boolean;
  country: string;
  cascadePending: boolean;                            // NEW — set true during async city-lookup
  setCountryFromCity: (cityName: string) => Promise<boolean>;  // NOW ASYNC
  switchedFromCity: string | null;
  didAutoSwitch: boolean;
};

// ════════════════════════════════════════════════════
// Thin cookie — 5 fields for instant repeat-visitor hydration
// ════════════════════════════════════════════════════

type ThinCookie = {
  cc: string;     // country_code
  sym: string;    // currency.symbol
  gw: string;     // payment.primary_gateway
  tld: string;    // domain.primary_tld
  lang: string;   // ai_content.primary_language
};

var COOKIE_NAME = "mhai_locale_v2";
var COOKIE_LEGACY_NAME = "mhai_locale_country";  // we keep writing this for backward-compat
var COOKIE_MAX_AGE = 2592000; // 30 days

function readThinCookie(): ThinCookie | null {
  if (typeof document === "undefined") return null;
  var match = document.cookie.match(new RegExp("(?:^|; )" + COOKIE_NAME + "=([^;]*)"));
  if (!match) return null;
  try {
    var decoded = decodeURIComponent(match[1]);
    var parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.cc === "string") return parsed as ThinCookie;
  } catch {}
  return null;
}

function writeThinCookie(v2: V2Locale) {
  if (typeof document === "undefined") return;
  var thin: ThinCookie = {
    cc: v2.country_code,
    sym: v2.currency.symbol,
    gw: v2.payment.primary_gateway || "",
    tld: v2.domain.primary_tld || "",
    lang: v2.ai_content.primary_language || "en",
  };
  var payload = encodeURIComponent(JSON.stringify(thin));
  document.cookie = COOKIE_NAME + "=" + payload + ";path=/;max-age=" + COOKIE_MAX_AGE + ";SameSite=Lax";
  document.cookie = COOKIE_LEGACY_NAME + "=" + v2.country_code + ";path=/;max-age=" + COOKIE_MAX_AGE + ";SameSite=Lax";
}

// ════════════════════════════════════════════════════
// Default V2Locale — minimal IN-based fallback used when backend
// is unreachable AND no thin cookie is present. This is a safety
// net, NOT a source of truth. Matches the v2 contract shape exactly.
// ════════════════════════════════════════════════════

var DEFAULT_V2_IN: V2Locale = {
  country_code: "IN",
  country_name: "India",
  is_supported: true,
  is_active: true,
  currency: { code: "INR", symbol: "\u20B9", decimal_places: 2, format_locale: "en-IN" },
  compliance: {
    frameworks: ["DPDP_2023", "ABDM", "NABL_112A"],
    display_badges: ["ABDM", "NMC", "DPDP"],
    ruleset_id: "IN_NMC",
    medical_advertising_rules_url: "/compliance/in-nmc.html",
  },
  payment: {
    primary_gateway: "razorpay",
    fallback_gateway: null,
    methods: ["upi", "card", "netbanking", "wallet"],
    tax_rate: 18,
    tax_label: "GST",
  },
  phone: {
    country_code: "+91",
    regex: "^[6-9]\\d{9}$",
    display_format: "+91 XXXXX XXXXX",
    digit_count: 10,
    placeholder: "+91 98765 43210",
  },
  domain: { primary_tld: ".in", alternate_tlds: [".co.in", ".com"], recommendation_note: null },
  ai_content: {
    primary_language: "en-IN",
    language_options: ["en", "hi"],
    cultural_tone: null,
    terminology_style: { clinic_word: "clinic", optimize: "optimize", specialty: "specialty" },
    content_safety_rules: [],
  },
  datetime: { date_format: "DD/MM/YYYY", time_format: "HH:mm", timezone: "Asia/Kolkata", clock_style: "24h" },
  social_proof: {
    clinic_count: 2400,
    clinic_count_text: "2,400+ clinics across India",
    regulatory_authority_name: "NMC-compliant",
    featured_badge_url: null,
  },
  cascade: { detected_via: "fallback", switched_from_country: null, switched_from_city: null },
};

// unwrapV2 deleted T1.2.4b-phase3 — consumers read localeV2 directly.
// partialFromThinCookie deleted T1.2.4b-phase3 — thin cookie only drives setCountry now.

// ════════════════════════════════════════════════════
// Context
// ════════════════════════════════════════════════════

var LocaleContext = createContext<LocaleCtx>({
  localeV2: DEFAULT_V2_IN,
  isLocaleLoading: true,
  country: "IN",
  cascadePending: false,
  setCountryFromCity: async function () { return false; },
  switchedFromCity: null,
  didAutoSwitch: false,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  var [localeV2, setLocaleV2] = useState<V2Locale>(DEFAULT_V2_IN);
  var [country, setCountry] = useState<string>("IN");
  var [isLocaleLoading, setIsLocaleLoading] = useState<boolean>(true);
  var [cascadePending, setCascadePending] = useState<boolean>(false);
  var [switchedFromCity, setSwitchedFromCity] = useState<string | null>(null);
  var [didAutoSwitch, setDidAutoSwitch] = useState<boolean>(false);

  var mountedRef = useRef<boolean>(false);

  // ── Apply a new v2 locale to all state + cookie ──
  var applyV2 = useCallback(function (v2: V2Locale, cascadeMeta?: { fromCity?: string }) {
    setLocaleV2(v2);
    setCountry(v2.country_code);
    writeThinCookie(v2);
    if (cascadeMeta && cascadeMeta.fromCity) {
      setSwitchedFromCity(cascadeMeta.fromCity);
      setDidAutoSwitch(true);
    }
  }, []);

  // ── Page-mount detection ──
  useEffect(function () {
    if (mountedRef.current) return;
    mountedRef.current = true;

    // Step 1 — thin cookie hydration for instant partial render
    var thin = readThinCookie();
    if (thin) {
      setCountry(thin.cc);
      // localeV2 stays at DEFAULT_V2_IN — consumers of localeV2 will see a
      // partial shape for ~150ms until fetch completes. This is acceptable.
    }

    // Step 2 — Full v2 fetch with 3s timeout
    var ctl = new AbortController();
    var timer = setTimeout(function () { ctl.abort(); }, 3000);

    detectLocaleV2(ctl.signal)
      .then(function (res) {
        clearTimeout(timer);
        if (res && res.success && res.locale) {
          applyV2(res.locale);
        }
      })
      .catch(function (err) {
        clearTimeout(timer);
        console.warn("[LocaleProvider] v2/detect failed, using fallback:", err && err.message);
        // If thin cookie was present we already hydrated partially.
        // Otherwise stay on DEFAULT_V2_IN.
      })
      .finally(function () {
        setIsLocaleLoading(false);
      });

    return function () {
      clearTimeout(timer);
      ctl.abort();
    };
  }, [applyV2]);

  // ── Async cascade via backend /city-lookup ──
  var setCountryFromCity = useCallback(
    async function (cityName: string): Promise<boolean> {
      var trimmed = (cityName || "").trim();
      if (!trimmed) return false;

      setCascadePending(true);
      var ctl = new AbortController();
      var timer = setTimeout(function () { ctl.abort(); }, 3000);

      try {
        var res = await cityLookupV2(trimmed, ctl.signal);
        clearTimeout(timer);

        if (res && res.success && res.matched && res.locale) {
          var matchedCc = res.locale.country_code;
          if (matchedCc !== country) {
            applyV2(res.locale, { fromCity: (res.city && res.city.display) || trimmed });
            return true;
          }
          return false;  // matched but same country — no-op
        }
        return false;
      } catch (err) {
        clearTimeout(timer);
        console.warn("[LocaleProvider] city-lookup failed:", err && (err as Error).message);
        return false;
      } finally {
        setCascadePending(false);
      }
    },
    [country, applyV2]
  );

  return (
    <LocaleContext.Provider
      value={{
        localeV2: localeV2,
        isLocaleLoading: isLocaleLoading,
        country: country,
        cascadePending: cascadePending,
        setCountryFromCity: setCountryFromCity,
        switchedFromCity: switchedFromCity,
        didAutoSwitch: didAutoSwitch,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

// ════════════════════════════════════════════════════
// COUNTRY_NAMES — preserved export (consumed by onboarding page)
// ════════════════════════════════════════════════════
export var COUNTRY_NAMES: Record<string, string> = {
  IN: "India", AE: "UAE", GB: "United Kingdom", US: "United States",
  KE: "Kenya", SG: "Singapore", DE: "Germany", AU: "Australia",
  CA: "Canada", NG: "Nigeria",
};
