// src/lib/locale-config.ts
//
// Single source of truth for per-country widget rendering contract.
// Driven by hospital.country_code (fetched from GET /api/public/book-appointment/clinic/:hospitalId).
//
// DB enum values are identical globally — only display strings and consent
// pattern vary per market.

import type { LocaleConfig, CountryCode, LocaleBundle, LocaleLabels } from './types/LocaleConfig';
import bookingStrings from './i18n/booking.json';

export const LOCALE_CONFIG: Record<CountryCode, LocaleConfig> = {
  IN: {
    country_code: 'IN',
    phone_prefix: '+91',
    phone_placeholder: '+91 98765 43210',
    currency: 'INR',
    currency_symbol: '₹',
    date_format: 'DD/MM/YYYY',
    text_direction: 'ltr',
    default_language: 'en-IN',
    supported_languages: ['en-IN', 'hi-IN', 'te-IN', 'ta-IN', 'bn-IN', 'mr-IN'],
    consent_pattern: 'itemized',
    consent_jurisdiction: 'DPDPA_2023_IN',
    consent_version: 'v1_2026_04',
    marketing_in_widget: true,
    urgency_style: 'standard',
    footer_compliance: 'DPDPA 2023 compliant',
    regulator_name: 'Data Protection Board of India',
    grievance_required: true,
    payment_gateway: 'razorpay',
  },
  AE: {
    country_code: 'AE',
    phone_prefix: '+971',
    phone_placeholder: '+971 50 123 4567',
    currency: 'AED',
    currency_symbol: 'د.إ',
    date_format: 'DD/MM/YYYY',
    text_direction: 'rtl',
    default_language: 'ar-AE',
    supported_languages: ['ar-AE', 'en-AE'],
    consent_pattern: 'itemized',
    consent_jurisdiction: 'PDPL_2021_AE',
    consent_version: 'v1_2026_04',
    marketing_in_widget: true,
    urgency_style: 'standard',
    footer_compliance: 'PDPL 2021 compliant',
    regulator_name: 'UAE Data Office',
    grievance_required: true,
    payment_gateway: 'telr',
  },
  GB: {
    country_code: 'GB',
    phone_prefix: '+44',
    phone_placeholder: '+44 7700 900123',
    currency: 'GBP',
    currency_symbol: '£',
    date_format: 'DD/MM/YYYY',
    text_direction: 'ltr',
    default_language: 'en-GB',
    supported_languages: ['en-GB'],
    consent_pattern: 'itemized',
    consent_jurisdiction: 'UKGDPR_AE17_2018',
    consent_version: 'v1_2026_04',
    marketing_in_widget: true,
    urgency_style: 'nhs_colours',
    emergency_call_disclaimer: 'For medical emergencies, call 999 or attend A&E.',
    footer_compliance: 'UK GDPR compliant',
    regulator_name: "Information Commissioner's Office (ICO)",
    grievance_required: true,
    payment_gateway: 'stripe',
  },
  US: {
    country_code: 'US',
    phone_prefix: '+1',
    phone_placeholder: '(555) 123-4567',
    currency: 'USD',
    currency_symbol: '$',
    date_format: 'MM/DD/YYYY',
    text_direction: 'ltr',
    default_language: 'en-US',
    supported_languages: ['en-US', 'es-US'],
    consent_pattern: 'npp_acknowledgment',
    consent_jurisdiction: 'HIPAA_PrivacyRule_2003',
    consent_version: 'v1_2026_04',
    marketing_in_widget: false, // HIPAA §164.508 — separate written auth required
    urgency_style: 'standard',
    emergency_call_disclaimer: 'For medical emergencies, call 911.',
    footer_compliance: 'HIPAA compliant',
    regulator_name: 'HHS Office for Civil Rights',
    grievance_required: false,
    payment_gateway: 'stripe',
  },
};

/**
 * Resolve the locale bundle for a given country + optional language preference.
 * Falls back to defaults at each level.
 */
export function resolveLocale(countryCode: string | undefined, preferredLang?: string): LocaleBundle {
  const cc = (countryCode as CountryCode) || 'IN';
  const config = LOCALE_CONFIG[cc] || LOCALE_CONFIG.IN;

  // Pick language: preferred if supported, else default
  let lang = config.default_language;
  if (preferredLang && config.supported_languages.includes(preferredLang)) {
    lang = preferredLang;
  }

  // Load strings with fallback chain:
  //   1. Requested lang
  //   2. Default lang for country
  //   3. en-IN (global fallback)
  const strings = bookingStrings as Record<string, Partial<LocaleLabels> & { TODO_TRANSLATION?: string }>;
  const requestedBundle = strings[lang] || {};
  const defaultBundle = strings[config.default_language] || {};
  const fallbackBundle = strings['en-IN'] || {};

  // Merge in priority order (later overrides earlier)
  const labels = { ...fallbackBundle, ...defaultBundle, ...requestedBundle } as LocaleLabels;

  return { config, labels, lang_code: lang };
}

/**
 * Dev/preview helper — allow ?locale=IN|AE|GB|US query override.
 * ONLY active when NODE_ENV !== 'production' or VERCEL_ENV === 'preview'.
 */
export function getDevLocaleOverride(): CountryCode | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const override = params.get('locale');
  if (!override) return null;

  // Hard-gate: only works outside of prod
  const isDev =
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview';
  if (!isDev) return null;

  if (['IN', 'AE', 'GB', 'US'].includes(override.toUpperCase())) {
    return override.toUpperCase() as CountryCode;
  }
  return null;
}
