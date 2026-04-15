"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

// ── Types ──
export type LocaleData = {
  country_code: string;
  currency_code: string;
  currency_symbol: string;
  phone_prefix: string;
  phone_digits: number;
  phone_placeholder: string;
  date_format: string;
  cities: string[];
  languages: string[];
  compliance_badges: string[];
  terminology: {
    clinic: string;
    optimize: string;
    specialty: string;
    practice: string;
  };
  domain_tld: string;
  extra_specialties: { id: string; label: string; sub: string; icon: string }[];
};

type LocaleCtx = {
  locale: LocaleData;
  isLocaleLoading: boolean;
  country: string;
  setCountryFromCity: (cityName: string) => boolean;
  switchedFromCity: string | null;
  didAutoSwitch: boolean;
};

// ── Fallback locale data (instant, no network) ──
export var FALLBACK_LOCALES: Record<string, LocaleData> = {
  IN: {
    country_code: "IN",
    currency_code: "INR",
    currency_symbol: "\u20B9",
    phone_prefix: "+91",
    phone_digits: 10,
    phone_placeholder: "98765 43210",
    date_format: "DD/MM/YYYY",
    cities: ["Hyderabad", "Mumbai", "Delhi", "Bangalore", "Chennai", "Pune"],
    languages: ["English", "Hindi"],
    compliance_badges: ["ABDM ready", "NMC compliant"],
    terminology: { clinic: "clinic", optimize: "optimize", specialty: "specialty", practice: "clinic" },
    domain_tld: ".in",
    extra_specialties: [
      { id: "ayurveda", label: "Ayurveda", sub: "Traditional Indian medicine, Panchakarma", icon: "A" },
      { id: "homeopathy", label: "Homeopathy", sub: "Alternative medicine, holistic care", icon: "H" },
      { id: "unani", label: "Unani", sub: "Greco-Arabic traditional medicine", icon: "U" },
      { id: "physiotherapy", label: "Physiotherapy", sub: "Rehabilitation, sports physio, neuro", icon: "P" },
    ],
  },
  AE: {
    country_code: "AE",
    currency_code: "AED",
    currency_symbol: "AED",
    phone_prefix: "+971",
    phone_digits: 9,
    phone_placeholder: "5X XXX XXXX",
    date_format: "DD/MM/YYYY",
    cities: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "RAK", "Al Ain"],
    languages: ["English", "Arabic"],
    compliance_badges: ["DHA licensed", "MOHAP ready"],
    terminology: { clinic: "clinic", optimize: "optimize", specialty: "specialty", practice: "clinic" },
    domain_tld: ".ae",
    extra_specialties: [
      { id: "aesthetic", label: "Aesthetic medicine", sub: "Cosmetic procedures, fillers, Botox", icon: "A" },
    ],
  },
  GB: {
    country_code: "GB",
    currency_code: "GBP",
    currency_symbol: "\u00A3",
    phone_prefix: "+44",
    phone_digits: 11,
    phone_placeholder: "7XXX XXXXXX",
    date_format: "DD/MM/YYYY",
    cities: ["London", "Manchester", "Birmingham", "Leeds", "Bristol", "Edinburgh"],
    languages: ["British English"],
    compliance_badges: ["CQC ready", "GDPR compliant"],
    terminology: { clinic: "practice", optimize: "optimise", specialty: "speciality", practice: "practice" },
    domain_tld: ".co.uk",
    extra_specialties: [
      { id: "nhs_dental", label: "NHS dentistry", sub: "NHS contracts, mixed practice", icon: "N" },
    ],
  },
  US: {
    country_code: "US",
    currency_code: "USD",
    currency_symbol: "$",
    phone_prefix: "+1",
    phone_digits: 10,
    phone_placeholder: "(XXX) XXX-XXXX",
    date_format: "MM/DD/YYYY",
    cities: ["Houston", "Los Angeles", "New York", "Chicago", "Phoenix", "Dallas"],
    languages: ["American English"],
    compliance_badges: ["HIPAA compliant", "ADA ready"],
    terminology: { clinic: "practice", optimize: "optimize", specialty: "specialty", practice: "practice" },
    domain_tld: ".com",
    extra_specialties: [],
  },
  KE: {
    country_code: "KE",
    currency_code: "KES",
    currency_symbol: "KES",
    phone_prefix: "+254",
    phone_digits: 9,
    phone_placeholder: "7XX XXX XXX",
    date_format: "DD/MM/YYYY",
    cities: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika"],
    languages: ["English", "Swahili"],
    compliance_badges: ["KMPDC ready", "NHIF ready"],
    terminology: { clinic: "clinic", optimize: "optimize", specialty: "specialty", practice: "clinic" },
    domain_tld: ".co.ke",
    extra_specialties: [
      { id: "traditional", label: "Traditional medicine", sub: "Herbal, traditional healing", icon: "T" },
    ],
  },
  SG: {
    country_code: "SG",
    currency_code: "SGD",
    currency_symbol: "S$",
    phone_prefix: "+65",
    phone_digits: 8,
    phone_placeholder: "XXXX XXXX",
    date_format: "DD/MM/YYYY",
    cities: ["Singapore"],
    languages: ["English", "Mandarin"],
    compliance_badges: ["MOH licensed", "PDPA compliant"],
    terminology: { clinic: "clinic", optimize: "optimize", specialty: "specialty", practice: "clinic" },
    domain_tld: ".sg",
    extra_specialties: [],
  },
  DE: {
    country_code: "DE",
    currency_code: "EUR",
    currency_symbol: "\u20AC",
    phone_prefix: "+49",
    phone_digits: 11,
    phone_placeholder: "XXX XXXXXXX",
    date_format: "DD.MM.YYYY",
    cities: ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne", "Stuttgart"],
    languages: ["Deutsch"],
    compliance_badges: ["KBV certified", "DSGVO compliant"],
    terminology: { clinic: "clinic", optimize: "optimize", specialty: "specialty", practice: "Praxis" },
    domain_tld: ".de",
    extra_specialties: [],
  },
};

// ── City → country mapping ──
var CITY_TO_COUNTRY: Record<string, string> = {
  london: "GB", manchester: "GB", birmingham: "GB", leeds: "GB", bristol: "GB", edinburgh: "GB",
  dubai: "AE", "abu dhabi": "AE", sharjah: "AE", ajman: "AE",
  "new york": "US", houston: "US", "los angeles": "US", chicago: "US", dallas: "US", phoenix: "US",
  nairobi: "KE", mombasa: "KE", kisumu: "KE",
  singapore: "SG",
  berlin: "DE", munich: "DE", hamburg: "DE", frankfurt: "DE",
  hyderabad: "IN", mumbai: "IN", delhi: "IN", bangalore: "IN", chennai: "IN", pune: "IN",
  kolkata: "IN", ahmedabad: "IN", jaipur: "IN", lucknow: "IN",
  sydney: "AU", melbourne: "AU", perth: "AU",
  toronto: "CA", vancouver: "CA",
  lagos: "NG", abuja: "NG",
};

// Countries without full locale fallback map to IN as base
function getLocaleForCountry(code: string): LocaleData {
  return FALLBACK_LOCALES[code] || FALLBACK_LOCALES["IN"];
}

var LocaleContext = createContext<LocaleCtx>({
  locale: FALLBACK_LOCALES["IN"],
  isLocaleLoading: true,
  country: "IN",
  setCountryFromCity: () => false,
  switchedFromCity: null,
  didAutoSwitch: false,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  var [country, setCountry] = useState("IN");
  var [locale, setLocale] = useState<LocaleData>(FALLBACK_LOCALES["IN"]);
  var [isLocaleLoading, setIsLocaleLoading] = useState(true);
  var [switchedFromCity, setSwitchedFromCity] = useState<string | null>(null);
  var [didAutoSwitch, setDidAutoSwitch] = useState(false);

  useEffect(() => {
    // Check cookie first for instant render
    var cookieMatch = document.cookie.match(/mhai_locale_country=([A-Z]{2})/);
    if (cookieMatch) {
      var cached = cookieMatch[1];
      setCountry(cached);
      setLocale(getLocaleForCountry(cached));
    }

    fetch("https://smartgumastha-backend-production.up.railway.app/api/mhai/locale/detect")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.detected && data.detected.country_code) {
          var code = data.detected.country_code as string;
          setCountry(code);
          setLocale(getLocaleForCountry(code));
          document.cookie = "mhai_locale_country=" + code + ";path=/;max-age=2592000";
        }
      })
      .catch(() => {})
      .finally(() => setIsLocaleLoading(false));
  }, []);

  var setCountryFromCity = useCallback(
    (cityName: string): boolean => {
      var key = cityName.toLowerCase().trim();
      var mapped = CITY_TO_COUNTRY[key];
      if (mapped && mapped !== country) {
        setCountry(mapped);
        setLocale(getLocaleForCountry(mapped));
        setSwitchedFromCity(cityName);
        setDidAutoSwitch(true);
        document.cookie = "mhai_locale_country=" + mapped + ";path=/;max-age=2592000";
        return true;
      }
      return false;
    },
    [country]
  );

  return (
    <LocaleContext.Provider
      value={{ locale, isLocaleLoading, country, setCountryFromCity, switchedFromCity, didAutoSwitch }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

// Country name helper
export var COUNTRY_NAMES: Record<string, string> = {
  IN: "India", AE: "UAE", GB: "United Kingdom", US: "United States",
  KE: "Kenya", SG: "Singapore", DE: "Germany", AU: "Australia",
  CA: "Canada", NG: "Nigeria",
};
