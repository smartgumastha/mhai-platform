"use client";

import RoadmapPlaceholder from "@/app/components/RoadmapPlaceholder";

export default function PaidAdsPage() {
  return (
    <RoadmapPlaceholder
      featureName="Paid Ads Manager"
      tagline="Google Search, Meta, and local healthcare directory ads — all managed from one dashboard with AI-optimised copy and automatic ROI tracking."
      eta="Q3 2026"
      breadcrumbLabel="Paid Ads"
      waitlistSource="paid-ads"
      waitlistSubtext="Get early access when Paid Ads launches — including a ₹2000 ad credit for early adopters."
      buildStage="planning"
      stageLabel="In planning"
      previewBullets={[
        "Google Search ads targeting 'doctor near me' and specialty keywords",
        "Meta (Facebook/Instagram) retargeting for patients who visited your website",
        "Auto-pause underperforming ads, boost best-performers — AI-managed",
      ]}
      icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 3h18v4H3z" />
          <path d="M7 3v18" />
          <path d="M3 13h4" />
          <path d="M3 17h4" />
          <path d="M3 21h4" />
          <path d="M13 7h8v14h-8z" />
        </svg>
      }
    />
  );
}
