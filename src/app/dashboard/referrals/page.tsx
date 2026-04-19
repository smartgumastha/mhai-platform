import RoadmapPlaceholder from "@/app/components/RoadmapPlaceholder";

export default function ReferralsPage() {
  return (
    <RoadmapPlaceholder
      featureName="Referral Program"
      tagline="Turn your happy patients into your best marketing channel. Referral links, reward tracking, and automatic credits — fully automated."
      eta="Launching August 2026"
      breadcrumbLabel="Referrals"
      waitlistSource="referrals"
      waitlistSubtext="Join the waitlist — early clinics get 3 months free referral tracking."
      buildStage="planning"
      stageLabel="In planning"
      previewBullets={[
        "Unique referral links for every patient and staff member",
        "Automatic reward tracking (credits, discounts, gift cards)",
        "Doctor-to-doctor professional referrals with audit trail",
      ]}
      icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.59 13.51 6.83 3.98" />
          <path d="m15.41 6.51-6.82 3.98" />
        </svg>
      }
    />
  );
}
