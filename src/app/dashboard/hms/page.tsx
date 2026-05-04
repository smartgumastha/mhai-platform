import Link from "next/link";

var hmsSettings = {
  name: "HMS Settings",
  description: "Prescription layout, paper size, sections to print, doctor qualification, custom footer. Clinic branding (logo/letterhead/signature) is in Billing → Billing Prefs.",
  href: "/dashboard/hms/settings",
};

var hmsStaff = {
  name: "Team & Staff",
  description: "Add doctors, nurses, receptionists and other clinical staff. Staff appear in the OPD doctor dropdown.",
  href: "/dashboard/team",
};

var hmsModules = [
  {
    name: "NABH Compliance",
    description: "Track accreditation readiness across all 10 chapters. Quality KPIs, incidents, documents, audit management.",
    href: "/dashboard/hms/nabh",
    status: "live",
    statusLabel: "Live now",
  },
  {
    name: "OPD Workflow",
    description: "Queue management, doctor assignment, consultation notes, prescription generation.",
    href: "/dashboard/hms/opd",
    status: "live",
    statusLabel: "Live now",
  },
  {
    name: "IPD Management",
    description: "Admissions, ward mapping, bed allocation, discharge summaries.",
    href: "#",
    status: "building",
    statusLabel: "June 2026",
  },
  {
    name: "Pharmacy",
    description: "Drug inventory, prescription fulfilment, expiry tracking, drug interactions.",
    href: "#",
    status: "planned",
    statusLabel: "Q3 2026",
  },
  {
    name: "Lab Orders (LIS)",
    description: "Test orders, sample tracking, results, NABL-aligned reports.",
    href: "#",
    status: "planned",
    statusLabel: "Q3 2026",
  },
  {
    name: "Radiology (RIS)",
    description: "Imaging orders, DICOM viewer integration, radiologist reporting.",
    href: "#",
    status: "planned",
    statusLabel: "Q4 2026",
  },
];

var statusStyles: Record<string, string> = {
  live: "bg-emerald-50 text-emerald-700 border-emerald-200",
  building: "bg-amber-50 text-amber-700 border-amber-200",
  planned: "bg-gray-100 text-text-muted border-gray-200",
};

export default function HmsPage() {
  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <nav className="mb-2 flex items-center gap-1.5 text-xs text-text-muted">
          <Link href="/dashboard" className="hover:text-coral">Dashboard</Link>
          <span>/</span>
          <span className="text-ink">Hospital Management</span>
        </nav>
        <h1 className="text-2xl font-medium tracking-tight text-ink">Hospital Management System</h1>
        <p className="mt-0.5 text-sm text-text-muted">
          Full clinical + admin suite — appointments, billing, pharmacy, lab, IPD. NABH compliance is live now.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {hmsModules.map((mod) => (
          mod.status === "live" ? (
            <Link
              key={mod.name}
              href={mod.href}
              className="group rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusStyles[mod.status]}`}>
                  {mod.statusLabel}
                </span>
                <svg className="h-4 w-4 text-emerald-500 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-[15px] font-medium text-ink group-hover:text-emerald-700">{mod.name}</div>
              <div className="mt-1 text-[13px] leading-relaxed text-text-muted">{mod.description}</div>
            </Link>
          ) : (
            <div
              key={mod.name}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm opacity-70"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusStyles[mod.status]}`}>
                  {mod.statusLabel}
                </span>
              </div>
              <div className="text-[15px] font-medium text-ink">{mod.name}</div>
              <div className="mt-1 text-[13px] leading-relaxed text-text-muted">{mod.description}</div>
            </div>
          )
        ))}
      </div>

      {/* Staff + Settings quick links */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {[hmsStaff, hmsSettings].map(function (card) {
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group flex items-center justify-between rounded-2xl border border-line bg-white px-5 py-4 shadow-sm transition-all hover:border-coral/40 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-paper-soft text-lg">
                  {card === hmsStaff ? "👥" : "⚙"}
                </div>
                <div>
                  <div className="text-[14px] font-medium text-ink group-hover:text-coral-deep">{card.name}</div>
                  <div className="mt-0.5 text-[11px] leading-snug text-text-muted">{card.description}</div>
                </div>
              </div>
              <svg className="ml-2 h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-coral-deep" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 px-5 py-4">
        <div className="text-sm font-medium text-ink">Building with 50+ pilot clinics</div>
        <div className="mt-0.5 text-xs text-text-muted">
          OPD, IPD, pharmacy and lab modules are being built with direct input from live clinics. NABH Compliance is the first module available — start there to prepare your accreditation.
        </div>
      </div>
    </div>
  );
}
