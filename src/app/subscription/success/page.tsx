"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/auth-context";

/**
 * Subscription success page — user lands here after a successful
 * Razorpay / Stripe checkout. We don't do any verification client-side —
 * the backend webhook handles the actual state flip. This page just
 * confirms the handoff and sends the user back to /dashboard.
 */
export default function SubscriptionSuccessPage() {
  var router = useRouter();
  var { isAuthenticated, isLoading } = useAuth();

  useEffect(function () {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf6ed] px-6">
      <div className="w-full max-w-md rounded-2xl border border-[#e5dec9] bg-white px-8 py-10 text-center shadow-[0_12px_40px_-16px_rgba(20,16,12,0.12)]">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <svg
            className="h-7 w-7 text-emerald-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mb-3 font-serif text-3xl italic text-[#14100c]">
          You're in.
        </h1>
        <p className="mb-8 text-[15px] leading-relaxed text-[#5c5248]">
          Your subscription is being activated. It takes a few seconds for
          everything to sync — your dashboard will reflect the new plan shortly.
        </p>
        <Link
          href="/dashboard"
          className="inline-block rounded-lg bg-[#ff6b4a] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_12px_-3px_rgba(255,107,74,0.5)] transition-all hover:-translate-y-px hover:bg-[#e04527]"
        >
          Back to dashboard
        </Link>
        <p className="mt-6 text-xs text-[#8a7f72]">
          Receipt emailed to you. Questions? Reply to that email or contact support.
        </p>
      </div>
    </div>
  );
}
