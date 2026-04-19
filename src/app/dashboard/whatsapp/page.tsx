import RoadmapPlaceholder from "@/app/components/RoadmapPlaceholder";

export default function WhatsAppPage() {
  return (
    <RoadmapPlaceholder
      featureName="WhatsApp Business Bot"
      tagline="Automated appointment booking, reminders, prescription sharing — all inside WhatsApp. We're working through Meta's verification process now."
      eta="Pending Meta approval"
      breadcrumbLabel="WhatsApp Bot"
      waitlistSource="whatsapp"
      waitlistSubtext="The moment our Meta Business Account goes live, you'll be the first to know."
      buildStage="frontend"
      stageLabel="Awaiting Meta approval"
      previewBullets={[
        "Patients book appointments by texting your clinic number",
        "Auto-reminders, prescription delivery, feedback loops",
        "Multi-language support (10 languages, including Urdu/Arabic RTL)",
      ]}
      icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          <path d="M8 10.5h.01" />
          <path d="M12 10.5h.01" />
          <path d="M16 10.5h.01" />
        </svg>
      }
    />
  );
}
