"use client";

/**
 * TrialBanner — Day 5, mockup 11-trial-banner.html
 *
 * States (derived from user.subscription_status + user.trial_ends_at):
 *   - 'neutral'  → days_left >= 3, cream tone, coral accent
 *   - 'amber'    → days_left in (0, 2], amber tone (Day 2 and Day 1)
 *   - 'expired'  → days_left <= 0 AND subscription_status in ('trial','trialing')
 *                  OR subscription_status === 'expired'
 *   - 'hidden'   → paid/active OR no trial_ends_at OR status unknown
 *
 * Copy: "X days left — upgrade anytime" (neutral)
 *       "X day{s} left … to keep your clinic running smoothly" (amber)
 *       "Trial ended — your data is safe. Upgrade to resume…" (expired)
 *
 * CTA: primary "Upgrade now" → routes to /pricing (in-page Razorpay modal
 * wiring is deferred to /dashboard/billing Day 3 backlog — intentionally not
 * part of Day 5 scope per mockup 11 "Out of scope for T2").
 *
 * Source of truth: user.trial_ends_at (bigint epoch ms). No timezone math.
 */

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useAuth } from "@/app/providers/auth-context";

type BannerVariant = "neutral" | "amber" | "expired" | "hidden";

function computeVariant(
  subscriptionStatus: string | null | undefined,
  trialEndsAt: number | null | undefined,
): { variant: BannerVariant; daysLeft: number } {
  // Paid / active — hide.
  if (subscriptionStatus === "active" || subscriptionStatus === "paid") {
    return { variant: "hidden", daysLeft: 0 };
  }

  // Unknown status OR missing trial end — hide (fail-safe).
  if (
    !subscriptionStatus ||
    (subscriptionStatus !== "trial" &&
      subscriptionStatus !== "trialing" &&
      subscriptionStatus !== "expired")
  ) {
    return { variant: "hidden", daysLeft: 0 };
  }

  // Expired status from server — banner shows regardless of trial_ends_at.
  if (subscriptionStatus === "expired") {
    return { variant: "expired", daysLeft: 0 };
  }

  // In trial — compute days left.
  if (trialEndsAt == null || Number.isNaN(Number(trialEndsAt))) {
    return { variant: "hidden", daysLeft: 0 };
  }

  var nowMs = Date.now();
  var endMs = Number(trialEndsAt);
  var msLeft = endMs - nowMs;
  var daysLeft = Math.ceil(msLeft / 86400000);

  if (daysLeft <= 0) return { variant: "expired", daysLeft: 0 };
  if (daysLeft <= 2) return { variant: "amber", daysLeft: daysLeft };
  return { variant: "neutral", daysLeft: daysLeft };
}

export default function TrialBanner() {
  var router = useRouter();
  var { user, isLoading } = useAuth();

  var state = useMemo(() => {
    if (isLoading || !user) return { variant: "hidden" as BannerVariant, daysLeft: 0 };
    return computeVariant(user.subscription_status, user.trial_ends_at);
  }, [user, isLoading]);

  if (state.variant === "hidden") return null;

  var daysLeft = state.daysLeft;
  var handleUpgrade = function () {
    router.push("/pricing");
  };

  // ──────── copy per state ────────
  var copy: { strong: string; rest: string };
  if (state.variant === "neutral") {
    copy = {
      strong: daysLeft === 1 ? "1 day left" : daysLeft + " days left",
      rest: " in your MHAI trial — upgrade anytime.",
    };
  } else if (state.variant === "amber") {
    copy = {
      strong: daysLeft === 1 ? "1 day left" : daysLeft + " days left",
      rest: " — upgrade to keep your clinic running smoothly.",
    };
  } else {
    copy = {
      strong: "Trial ended",
      rest: " — your data is safe. Upgrade to resume full access.",
    };
  }

  // ──────── variant → Tailwind classes ────────
  var bannerClass: string;
  var dotClass: string;
  var strongClass: string;
  var ctaClass: string;

  if (state.variant === "neutral") {
    bannerClass =
      "bg-gradient-to-r from-[#f2ebdc] to-[#f5efe0] border-b border-[#f0e9d8]";
    dotClass = "bg-[#ff6b4a] ring-4 ring-[#ff6b4a]/15";
    strongClass = "font-serif italic font-semibold text-[#e04527]";
    ctaClass =
      "bg-[#ff6b4a] text-white shadow-[0_4px_12px_-3px_rgba(255,107,74,0.5)] hover:bg-[#e04527] hover:-translate-y-px hover:shadow-[0_6px_16px_-3px_rgba(255,107,74,0.5)]";
  } else if (state.variant === "amber") {
    bannerClass =
      "bg-gradient-to-r from-amber-500/10 to-amber-500/5 border-b border-amber-500/20";
    dotClass = "bg-amber-500 ring-4 ring-amber-500/20";
    strongClass = "font-serif italic font-semibold text-amber-700";
    ctaClass =
      "bg-amber-500 text-white shadow-[0_4px_12px_-3px_rgba(245,158,11,0.4)] hover:bg-amber-600 hover:-translate-y-px";
  } else {
    bannerClass =
      "bg-gradient-to-r from-rose-500/10 to-[#ff6b4a]/6 border-b border-rose-500/25";
    dotClass = "bg-rose-500 ring-4 ring-rose-500/20";
    strongClass = "font-serif italic font-semibold text-rose-700";
    ctaClass =
      "bg-[#ff6b4a] text-white shadow-[0_4px_12px_-3px_rgba(255,107,74,0.5)] hover:bg-[#e04527] hover:-translate-y-px";
  }

  return (
    <div
      role="status"
      aria-live="polite"
      data-trial-variant={state.variant}
      className={
        "flex w-full items-center gap-4 px-7 py-[14px] text-sm transition-colors " +
        bannerClass
      }
    >
      <span className={"h-[10px] w-[10px] flex-shrink-0 rounded-full transition-all " + dotClass} />
      <span className="flex-1 text-[14px] leading-[1.4] text-[#5c5248]">
        <span className={strongClass}>{copy.strong}</span>
        {copy.rest}
      </span>
      <button
        type="button"
        onClick={handleUpgrade}
        className={
          "whitespace-nowrap rounded-lg border-0 px-[22px] py-[9px] text-[13px] font-semibold transition-all " +
          ctaClass
        }
      >
        Upgrade now
      </button>
    </div>
  );
}
