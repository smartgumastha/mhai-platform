import RoadmapPlaceholder from "@/app/components/RoadmapPlaceholder";

export default function HmsPage() {
  return (
    <RoadmapPlaceholder
      featureName="Hospital Management System"
      tagline="Full clinical + admin suite — appointments, billing, pharmacy, lab, IPD. We're building this with input from 50+ pilot clinics, not rushing a skeleton out the door."
      eta="Launching June 2026"
      breadcrumbLabel="Hospital Management"
      waitlistSource="hms"
      waitlistSubtext="We'll email you the moment HMS opens to pilot clinics. No spam, one email."
      buildStage="backend"
      stageLabel="Backend in progress"
      previewBullets={[
        "OPD workflow with queue management and doctor assignment",
        "IPD admissions, ward mapping, and discharge summaries",
        "Integrated pharmacy, lab orders, and NABH-aligned records",
      ]}
      icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 21V9a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v12" />
          <path d="M9 21v-6h6v6" />
          <path d="M8 8V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3" />
          <path d="M12 12v1" />
        </svg>
      }
    />
  );
}
