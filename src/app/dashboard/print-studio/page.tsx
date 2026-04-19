import RoadmapPlaceholder from "@/app/components/RoadmapPlaceholder";

export default function PrintStudioPage() {
  return (
    <RoadmapPlaceholder
      featureName="Brand Print Studio"
      tagline="Business cards, prescription pads, pamphlets — all auto-designed in your clinic's brand, printed by our local partners, delivered to your door."
      eta="Launching July 2026"
      breadcrumbLabel="Print Studio"
      waitlistSource="print-studio"
      waitlistSubtext="Be first to print branded materials when Print Studio opens."
      buildStage="design"
      stageLabel="Design complete"
      previewBullets={[
        "One-click business cards using your clinic's brand DNA",
        "Prescription pads, appointment cards, patient pamphlets",
        "Local print + delivery partners in India, US, UK",
      ]}
      icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="6" y="3" width="12" height="6" rx="1" />
          <path d="M6 17h12v4H6z" />
          <path d="M18 9H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h0" />
          <path d="M18 17a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2" />
          <circle cx="17" cy="13" r="0.5" fill="currentColor" />
        </svg>
      }
    />
  );
}
