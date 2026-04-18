"use client";

import { useLocale } from "@/app/providers/locale-context";

/**
 * useSocialProof — canonical social-proof hook.
 * Returns the locale's clinic count + regulatory authority for display on
 * landing, pricing, and signup pages.
 */
export function useSocialProof() {
  var ctx = useLocale();
  var sp = ctx.localeV2?.social_proof;

  var clinicCount = sp?.clinic_count || 0;
  var clinicCountText = sp?.clinic_count_text || "";
  var authorityName = sp?.regulatory_authority_name || "";
  var badgeUrl = sp?.featured_badge_url || null;

  return {
    clinicCount: clinicCount,
    clinicCountText: clinicCountText,
    authorityName: authorityName,
    badgeUrl: badgeUrl,
  };
}
