"use client";

// Phone normalization helper — centralizes the "add country prefix
// if missing" logic that was previously duplicated across 6 files
// with hardcoded "+91". Reads prefix from localeV2.phone.country_code
// at call sites.

// Pure function — caller passes current country code prefix.
// Returns a normalized phone with country prefix always present.
export function normalizePhone(
  phone: string | null | undefined,
  defaultCountryPrefix: string
): string {
  if (!phone) return defaultCountryPrefix;

  var trimmed = String(phone).trim();

  // Already has + prefix — use as-is
  if (trimmed.startsWith("+")) {
    return trimmed;
  }

  // 10-digit Indian-format number without prefix — prepend default
  if (trimmed.length === 10 && /^\d{10}$/.test(trimmed)) {
    return defaultCountryPrefix + trimmed;
  }

  // Longer number without + — assume it already has country digits
  if (trimmed.length > 10 && /^\d+$/.test(trimmed)) {
    return "+" + trimmed;
  }

  // Fallback: prepend default prefix
  return defaultCountryPrefix + trimmed;
}

// Country detection from phone prefix — replaces the 5 copies of
// startsWith("+91")/("+1")/("+44")/("+971")/("+65") logic across telecaller.
// Returns 2-letter country code.
export function countryFromPhone(phone: string | null | undefined): string {
  if (!phone) return "IN";
  var p = String(phone).trim();
  if (p.startsWith("+1")) return "US";
  if (p.startsWith("+44")) return "UK";
  if (p.startsWith("+971")) return "AE";
  if (p.startsWith("+65")) return "SG";
  if (p.startsWith("+61")) return "AU";
  if (p.startsWith("+49") || p.startsWith("+33") || p.startsWith("+39")) return "EU";
  if (p.startsWith("+91")) return "IN";
  // Length-based fallback for Indian numbers without prefix
  if (p.length === 10 && /^\d{10}$/.test(p)) return "IN";
  return "IN";
}
