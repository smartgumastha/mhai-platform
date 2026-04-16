"use client";

import { useDashboard } from "@/app/dashboard/contexts/DashboardContext";

type CallingStatus = {
  allowed: boolean;
  reason: string;
  nextOpenIn: string;
};

export function useCompliance() {
  var { locale } = useDashboard();

  function getCallingStatus(): CallingStatus {
    var now = new Date();
    var hours = now.getHours();

    if (hours >= 9 && hours < 21) {
      return { allowed: true, reason: "", nextOpenIn: "" };
    }

    var hoursUntil = hours < 9 ? 9 - hours : 24 - hours + 9;
    var country = locale.country || "IN";
    return {
      allowed: false,
      reason: "Calls can only be made between 9 AM and 9 PM in " + country + ".",
      nextOpenIn: hoursUntil + " hours",
    };
  }

  function canCallLead(lead: { dnd_status?: string; consent_type?: string }): { allowed: boolean; reason: string } {
    var timeCheck = getCallingStatus();
    if (!timeCheck.allowed) {
      return { allowed: false, reason: timeCheck.reason };
    }
    if (lead.dnd_status === "blocked" || lead.dnd_status === "opted_out") {
      return { allowed: false, reason: "This lead is on the Do Not Disturb list." };
    }
    return { allowed: true, reason: "" };
  }

  function getComplianceBadges(countries: string[]): string[] {
    var badges: Record<string, string> = {
      IN: "IN TRAI", US: "US TCPA", UK: "UK PECR", EU: "EU GDPR",
      AE: "AE TDRA", SG: "SG PDPA", AU: "AU Spam Act", CA: "CA CRTC",
    };
    return countries.map(function (c) { return badges[c] || c; }).filter(Boolean);
  }

  return { getCallingStatus, canCallLead, getComplianceBadges };
}
