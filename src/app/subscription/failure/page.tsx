"use client";

import Link from "next/link";

/**
 * Subscription failure page — user lands here after a failed or cancelled
 * Razorpay / Stripe checkout. Non-destructive copy, clear next actions,
 * no blame on the user. Trial continues uninterrupted.
 */
export default function SubscriptionFailurePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf6ed] px-6">
      <div className="w-full max-w-md rounded-2xl border border-[#e5dec9] bg-white px-8 py-10 text-center shadow-[0_12px_40px_-16px_rgba(20,16,12,0.12)]">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <svg
            className="h-7 w-7 text-amber-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M4.93 19h14.14a2 2 0 001.74-3L13.74 4a2 2 0 00-3.48 0L3.19 16a2 2 0 001.74 3z" />
          </svg>
        </div>
        <h1 className="mb-3 font-serif text-3xl italic text-[#14100c]">
          Payment didn't go through.
        </h1>
        <p className="mb-8 text-[15px] leading-relaxed text-[#5c5248]">
          Don't worry — your trial and your data are untouched. Most payment
          failures are temporary (card declined, bank timeout). Try again, or
          switch to a different method.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/pricing"
            className="inline-block rounded-lg bg-[#ff6b4a] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_12px_-3px_rgba(255,107,74,0.5)] transition-all hover:-translate-y-px hover:bg-[#e04527]"
          >
            Try again
          </Link>
          <Link
            href="/dashboard"
            className="inline-block rounded-lg border border-[#e5dec9] bg-white px-6 py-3 text-sm font-semibold text-[#14100c] transition-all hover:bg-[#f5efe0]"
          >
            Back to dashboard
          </Link>
        </div>
        <p className="mt-6 text-xs text-[#8a7f72]">
          Need help? Reply to any MHAI email and we'll sort it out.
        </p>
      </div>
    </div>
  );
}
