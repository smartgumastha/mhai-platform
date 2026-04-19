"use client";

import { useState, type ReactNode, type FormEvent } from "react";
import Link from "next/link";

export type BuildStage = "planning" | "design" | "backend" | "frontend" | "pilot";

export interface RoadmapPlaceholderProps {
  featureName: string;
  tagline: string;
  eta: string;
  icon: ReactNode;
  previewBullets: string[];
  buildStage: BuildStage;
  stageLabel: string;
  breadcrumbLabel: string;
  waitlistSubtext?: string;
  waitlistEndpoint?: string;
  waitlistSource: string;
}

var STAGE_FILL: Record<BuildStage, number> = {
  planning: 0,
  design: 1,
  backend: 2,
  frontend: 3,
  pilot: 4,
};

var STAGE_LABELS = ["Design", "Backend", "Frontend", "Pilot"];

export default function RoadmapPlaceholder(props: RoadmapPlaceholderProps) {
  var [email, setEmail] = useState("");
  var [submitted, setSubmitted] = useState(false);
  var [submitting, setSubmitting] = useState(false);

  var endpoint = props.waitlistEndpoint || "/api/waitlist";
  var filledCount = STAGE_FILL[props.buildStage];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || submitting) return;
    setSubmitting(true);

    var payload = {
      email: email,
      source: props.waitlistSource,
      feature: props.featureName,
      timestamp: Date.now(),
    };

    try {
      var response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.log("[waitlist] endpoint unavailable, payload:", payload);
      }
    } catch (err) {
      console.log("[waitlist] network error, payload:", payload);
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/10 bg-[#0f1512] px-9 py-10 shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-[300px] w-[300px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%)",
        }}
      />

      <nav className="relative z-10 mb-7 flex items-center gap-1.5 font-mono text-[13px] text-[#6b7a74]">
        <Link href="/dashboard" className="transition-colors hover:text-emerald-400">
          Dashboard
        </Link>
        <span className="text-[#4a5751]">/</span>
        <span className="text-[#9ca9a4]">{props.breadcrumbLabel}</span>
      </nav>

      <div className="relative z-10 mb-9">
        <div
          className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-[14px] border border-emerald-500/30 bg-gradient-to-br from-emerald-700 to-emerald-800"
          style={{ boxShadow: "0 0 0 4px rgba(16, 185, 129, 0.04)" }}
        >
          <div className="h-7 w-7 text-emerald-200">{props.icon}</div>
        </div>

        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/15 bg-emerald-500/[0.08] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-emerald-300">
          <span
            className="h-1.5 w-1.5 rounded-full bg-emerald-400"
            style={{ boxShadow: "0 0 8px rgba(52, 211, 153, 0.6)" }}
          />
          {props.eta}
        </div>

        <h1
          className="mb-2.5 text-[32px] font-medium leading-[1.15] tracking-[-0.02em] text-[#e8f0ec]"
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          {props.featureName}
        </h1>
        <p className="max-w-[520px] text-[15px] leading-[1.6] text-[#9ca9a4]">
          {props.tagline}
        </p>
      </div>

      <div className="relative z-10 mb-6 rounded-xl border border-emerald-500/10 bg-[#131a17] px-5 py-5">
        <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.08em] text-emerald-400">
          What you&apos;ll get
        </div>
        <ul className="flex flex-col gap-2.5">
          {props.previewBullets.map((bullet, i) => (
            <li
              key={i}
              className="relative pl-[22px] text-[14px] leading-[1.5] text-[#e8f0ec]"
            >
              <span
                aria-hidden="true"
                className="absolute left-0 top-2 h-0.5 w-3 rounded-sm bg-emerald-500"
              />
              {bullet}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 mb-8">
        <div className="mb-2.5 flex items-baseline justify-between">
          <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-[#9ca9a4]">
            Build Status
          </span>
          <span className="text-[12px] font-medium text-emerald-300">
            {props.stageLabel}
          </span>
        </div>
        <div className="grid h-1 grid-cols-4 gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={
                i < filledCount
                  ? "rounded-sm bg-emerald-500"
                  : "rounded-sm bg-emerald-500/[0.08]"
              }
              style={
                i < filledCount
                  ? { boxShadow: "0 0 6px rgba(16, 185, 129, 0.4)" }
                  : undefined
              }
            />
          ))}
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1">
          {STAGE_LABELS.map((label, i) => (
            <span
              key={label}
              className={
                i < filledCount
                  ? "font-mono text-[10px] uppercase tracking-[0.05em] text-emerald-400"
                  : "font-mono text-[10px] uppercase tracking-[0.05em] text-[#4a5751]"
              }
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div
        className="relative z-10 rounded-xl border border-emerald-500/15 px-[22px] py-[22px]"
        style={{
          background: "linear-gradient(180deg, #131a17 0%, #0f1512 100%)",
        }}
      >
        <div className="mb-1 text-[15px] font-medium text-[#e8f0ec]">
          Get early access
        </div>
        <div className="mb-4 text-[13px] text-[#6b7a74]">
          {props.waitlistSubtext ||
            "We'll email you the moment this opens. No spam, one email."}
        </div>

        {submitted ? (
          <div className="flex items-center gap-2.5 rounded-[10px] border border-emerald-500/15 bg-emerald-500/[0.08] px-3.5 py-[11px] text-[14px] text-emerald-300">
            <svg
              className="h-4 w-4 flex-shrink-0 text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            You&apos;re on the list. We&apos;ll be in touch.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2.5">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@clinic.com"
              disabled={submitting}
              className="flex-1 rounded-[10px] border border-emerald-500/10 bg-[#0a0f0d] px-3.5 py-[11px] text-[14px] text-[#e8f0ec] placeholder:text-[#4a5751] transition-colors focus:border-emerald-500 focus:bg-[#1a2420] focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-[10px] bg-emerald-600 px-5 py-[11px] text-[14px] font-medium text-white transition-colors hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Notify me"}
              {!submitting && (
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
