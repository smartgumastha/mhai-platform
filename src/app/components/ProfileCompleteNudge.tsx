"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";

type ProfileStatus = {
  success: boolean;
  onboarding_profile_completed: boolean;
  country_code?: string;
  required_fields?: string[];
  missing_fields?: string[];
  regulatory_ids?: Record<string, string>;
};

type CountryLabel = {
  flag: string;
  name: string;
  taxidName: string;
  ctaText: string;
  regulator: string;
};

var COUNTRY_LABELS: Record<string, CountryLabel> = {
  IN: { flag: "🇮🇳", name: "India", taxidName: "GSTIN", ctaText: "+ Add GSTIN · 30 sec", regulator: "GST" },
  AE: { flag: "🇦🇪", name: "UAE", taxidName: "TRN + DHA", ctaText: "+ Add TRN + DHA · 60 sec", regulator: "FTA VAT" },
  GB: { flag: "🇬🇧", name: "UK", taxidName: "VAT + GMC", ctaText: "+ Add VAT + GMC · 60 sec", regulator: "HMRC + GMC" },
  US: { flag: "🇺🇸", name: "US", taxidName: "NPI + EIN", ctaText: "+ Add NPI + EIN · 60 sec", regulator: "HIPAA + State" },
};

type Props = {
  onOpenModal?: (status: ProfileStatus) => void;
};

export default function ProfileCompleteNudge({ onOpenModal }: Props) {
  var [status, setStatus] = useState<ProfileStatus | null>(null);
  var [dismissed, setDismissed] = useState(false);
  var router = useRouter();

  useEffect(function () {
    try {
      var until = typeof window !== "undefined" ? localStorage.getItem("mhai_nudge_dismissed_until") : null;
      if (until && Number(until) > Date.now()) {
        setDismissed(true);
        return;
      }
    } catch (e) { /* noop */ }

    async function load() {
      try {
        var token = getToken();
        if (!token) return;
        var resp = await fetch("/api/presence/partners/me/profile-status", {
          headers: { Authorization: "Bearer " + token },
        });
        if (!resp.ok) return;
        var data = await resp.json();
        if (data && data.success) setStatus(data);
      } catch (e) {
        // silent — nudge is non-critical
      }
    }
    load();
  }, []);

  if (!status) return null;
  if (status.onboarding_profile_completed) return null;
  if (!status.missing_fields || status.missing_fields.length === 0) return null;
  if (dismissed) return null;

  var cc = status.country_code || "IN";
  var labels = COUNTRY_LABELS[cc] || COUNTRY_LABELS.IN;

  var totalReq = (status.required_fields || []).length || 5;
  var filledReq = totalReq - (status.missing_fields || []).length;
  var pct = totalReq > 0 ? Math.round((filledReq / totalReq) * 100) : 0;

  function handleDismiss() {
    setDismissed(true);
    try {
      localStorage.setItem("mhai_nudge_dismissed_until", String(Date.now() + 24 * 60 * 60 * 1000));
    } catch (e) { /* noop */ }
  }

  function handleAdd() {
    if (typeof onOpenModal === "function" && status) onOpenModal(status);
    else router.push("/dashboard/settings/business-profile");
  }

  return (
    <div className="mb-6 flex items-start gap-4 rounded-2xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/8 to-pink-500/5 p-4">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-xl text-white">
        📋
      </div>
      <div className="flex-1">
        <div className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-purple-600">
          {labels.flag} {labels.name} · finish setup to unlock billing
        </div>
        <div className="mb-1 font-fraunces text-lg font-medium leading-tight text-ink">
          Add your <em className="italic text-coral-deep">{labels.taxidName}</em> to start billing patients.
        </div>
        <div className="text-xs leading-relaxed text-text-dim">
          Your AI marketing team is live — Clara is replying to patient enquiries. To issue
          <strong> {labels.regulator}-compliant bills</strong>, we need {(status.missing_fields || []).join(", ")}. Takes 30-60 seconds.
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(status.missing_fields || []).map(function (f) {
            return (
              <span
                key={f}
                className="rounded-full bg-rose-500/8 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-rose-600"
              >
                Missing: {f}
              </span>
            );
          })}
        </div>
        <div className="mt-2 flex items-center gap-2 font-mono text-xs text-text-muted">
          <span>Clinic profile {pct}% complete</span>
          <span className="relative h-1.5 w-20 overflow-hidden rounded-full bg-line">
            <span
              className="absolute inset-0 bg-gradient-to-r from-coral to-purple-500"
              style={{ width: pct + "%" }}
            />
          </span>
          <span>{filledReq} of {totalReq} steps</span>
        </div>
      </div>
      <div className="flex flex-shrink-0 flex-col gap-2">
        <button
          onClick={handleAdd}
          className="whitespace-nowrap rounded-lg bg-coral px-4 py-2 text-xs font-medium text-white hover:bg-coral-deep"
        >
          {labels.ctaText}
        </button>
        <button
          onClick={handleDismiss}
          className="px-4 py-2 text-xs text-text-muted hover:text-ink"
        >
          Later
        </button>
      </div>
    </div>
  );
}
