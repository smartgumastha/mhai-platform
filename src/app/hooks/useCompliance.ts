"use client";

import { useMemo } from "react";
import { useLocale } from "@/app/providers/locale-context";

/**
 * useCompliance — canonical compliance + timing hook.
 * Reads compliance + ruleset + country from LocaleProvider's v2 locale.
 * Returns the set of compliance badges, active ruleset, outbound-message
 * safe hours, and next allowed send window for the current country.
 */
export function useCompliance() {
  var ctx = useLocale();
  var v2 = ctx.localeV2;

  var country = (v2 && v2.country_code) || "IN";
  var badges = (v2 && v2.compliance && v2.compliance.display_badges) || [];
  var frameworks = (v2 && v2.compliance && v2.compliance.frameworks) || [];
  var rulesetId = (v2 && v2.compliance && v2.compliance.ruleset_id) || null;
  var safetyRules = (v2 && v2.ai_content && v2.ai_content.content_safety_rules) || [];
  var timezone = (v2 && v2.datetime && v2.datetime.timezone) || "Asia/Kolkata";

  // Outbound-send safe window (9am-9pm local in the locale's timezone)
  var windowInfo = useMemo(function () {
    var now = new Date();
    var hours;
    try {
      // Get current hour in the locale's timezone
      var fmt = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        hour12: false,
        timeZone: timezone,
      });
      hours = parseInt(fmt.format(now), 10);
      if (isNaN(hours)) hours = now.getHours();
    } catch {
      hours = now.getHours();
    }

    var inWindow = hours >= 9 && hours < 21;
    var hoursUntil = hours < 9 ? 9 - hours : 24 - hours + 9;

    return {
      in_send_window: inWindow,
      hours_until_next_window: inWindow ? 0 : hoursUntil,
      current_hour_local: hours,
      timezone: timezone,
    };
  }, [timezone]);

  // ── Legacy API compatibility (T1.2.4b-phase1 hotfix) ──
  // These functions preserve the pre-T1.2.4b useCompliance surface for
  // the single consumer at telecaller/call/[leadId]/page.tsx:180. Field
  // shape + behavior match the original exactly (allowed/reason/nextOpenIn
  // for getCallingStatus; DND check for canCallLead; country→badge static
  // map for getComplianceBadges). Phase 3 migrates the consumer onto the
  // flat fields above and removes these wrappers.

  function getCallingStatus(): { allowed: boolean; reason: string; nextOpenIn: string } {
    if (windowInfo.in_send_window) {
      return { allowed: true, reason: "", nextOpenIn: "" };
    }
    return {
      allowed: false,
      reason: "Calls can only be made between 9 AM and 9 PM in " + country + ".",
      nextOpenIn: windowInfo.hours_until_next_window + " hours",
    };
  }

  function canCallLead(lead: { dnd_status?: string; consent_type?: string }): { allowed: boolean; reason: string } {
    var timeCheck = getCallingStatus();
    if (!timeCheck.allowed) {
      return { allowed: false, reason: timeCheck.reason };
    }
    if (lead && (lead.dnd_status === "blocked" || lead.dnd_status === "opted_out")) {
      return { allowed: false, reason: "This lead is on the Do Not Disturb list." };
    }
    return { allowed: true, reason: "" };
  }

  function getComplianceBadges(countries: string[]): string[] {
    var legacyBadges: Record<string, string> = {
      IN: "IN TRAI", US: "US TCPA", UK: "UK PECR", EU: "EU GDPR",
      AE: "AE TDRA", SG: "SG PDPA", AU: "AU Spam Act", CA: "CA CRTC",
    };
    return countries.map(function (c) { return legacyBadges[c] || c; }).filter(Boolean);
  }

  return {
    country: country,
    badges: badges,
    frameworks: frameworks,
    ruleset_id: rulesetId,
    safety_rules: safetyRules,
    timezone: timezone,
    in_send_window: windowInfo.in_send_window,
    hours_until_next_window: windowInfo.hours_until_next_window,
    current_hour_local: windowInfo.current_hour_local,
    // Legacy compatibility (phase 3 removes):
    getCallingStatus: getCallingStatus,
    canCallLead: canCallLead,
    getComplianceBadges: getComplianceBadges,
  };
}
