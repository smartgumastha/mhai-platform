"use client";

import { useState } from "react";
import Link from "next/link";

var programmes = [
  { key: "shco", label: "SHCO", sublabel: "≤50 beds · 4 yr validity", oes: 408, coreOes: 100 },
  { key: "el", label: "Entry Level", sublabel: "51+ beds · 3 yr validity", oes: 189, coreOes: 50 },
  { key: "full", label: "Full NABH", sublabel: "All sizes · 3 yr validity", oes: 182, coreOes: 17 },
];

var chapters = [
  { code: "AAC", name: "Access, Assessment & Continuity of Care", score: 0, description: "Triage, assessment, discharge, handoffs" },
  { code: "COP", name: "Care of Patients", score: 0, description: "Clinical care, nursing, surgical, transfusion" },
  { code: "MOM", name: "Management of Medication", score: 0, description: "Prescription, storage, dispensing, errors" },
  { code: "PRE", name: "Patient Rights & Education", score: 0, description: "Consent, privacy, grievances, education" },
  { code: "HIC", name: "Hospital Infection Control", score: 0, description: "HAI surveillance, hand hygiene, sterilization" },
  { code: "CQI", name: "Continuous Quality Improvement", score: 0, description: "KPIs, incidents, CAPA, quality committees" },
  { code: "ROM", name: "Responsibilities of Management", score: 0, description: "Governance, policies, regulatory compliance" },
  { code: "FMS", name: "Facility Management & Safety", score: 0, description: "Equipment, infrastructure, fire + waste" },
  { code: "HRM", name: "Human Resource Management", score: 0, description: "Credentials, training, competency validation" },
  { code: "IMS", name: "Information Management System", score: 0, description: "Medical records, data security, audit trails" },
];

var subModules = [
  {
    name: "Self Assessment",
    description: "Score all 10 chapters. Get your baseline + gap report.",
    href: "/dashboard/hms/nabh/self-assess",
    accent: "border-coral/30 hover:border-coral/50",
    badge: "Start here",
    badgeColor: "bg-coral/10 text-coral",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    name: "NABH Coach",
    description: "AI assistant — draft SOPs, get compliance answers, prepare for audit.",
    href: "/dashboard/hms/nabh/coach",
    accent: "border-emerald-200 hover:border-emerald-300",
    badge: "AI powered",
    badgeColor: "bg-emerald-50 text-emerald-700",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    name: "Quality KPIs",
    description: "Track 30+ quality indicators monthly. Auto-generates committee reports.",
    href: "/dashboard/hms/nabh/kpi",
    accent: "border-gray-200 hover:border-gray-300",
    badge: "Setup required",
    badgeColor: "bg-gray-100 text-text-muted",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    name: "Incident Reporting",
    description: "Log incidents, near-misses, adverse events. Auto-generates CAPA.",
    href: "/dashboard/hms/nabh/incidents",
    accent: "border-gray-200 hover:border-gray-300",
    badge: "Setup required",
    badgeColor: "bg-gray-100 text-text-muted",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    name: "Document Manager",
    description: "SOP library with 50+ templates. AI generates first draft in 2 minutes.",
    href: "/dashboard/hms/nabh/documents",
    accent: "border-gray-200 hover:border-gray-300",
    badge: "Setup required",
    badgeColor: "bg-gray-100 text-text-muted",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    name: "Internal Audit",
    description: "Chapter-wise audits with 275 pre-built questions. Auto-scores compliance.",
    href: "/dashboard/hms/nabh/audit",
    accent: "border-gray-200 hover:border-gray-300",
    badge: "Setup required",
    badgeColor: "bg-gray-100 text-text-muted",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    name: "Staff Training",
    description: "Training calendar, attendance tracking, credential expiry alerts.",
    href: "/dashboard/hms/nabh/training",
    accent: "border-gray-200 hover:border-gray-300",
    badge: "Setup required",
    badgeColor: "bg-gray-100 text-text-muted",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
  {
    name: "Equipment Maintenance",
    description: "Preventive maintenance schedule. Calibration certificate tracking.",
    href: "/dashboard/hms/nabh/equipment",
    accent: "border-gray-200 hover:border-gray-300",
    badge: "Setup required",
    badgeColor: "bg-gray-100 text-text-muted",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
      </svg>
    ),
  },
  {
    name: "Infection Surveillance",
    description: "HAI tracking, device day counters, hand hygiene rounds, HICC reports.",
    href: "/dashboard/hms/nabh/infection",
    accent: "border-gray-200 hover:border-gray-300",
    badge: "Setup required",
    badgeColor: "bg-gray-100 text-text-muted",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

function ChapterStatus({ score }: { score: number }) {
  if (score >= 70) return <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{score}%</span>;
  if (score >= 50) return <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{score}%</span>;
  return <span className="flex items-center gap-1 text-[10px] font-medium text-text-muted"><span className="h-1.5 w-1.5 rounded-full bg-gray-300" />Not started</span>;
}

export default function NabhPage() {
  var [activeProgramme, setActiveProgramme] = useState("shco");
  var overallScore = 0;

  return (
    <div className="px-8 py-6">

      {/* Breadcrumb + header */}
      <div className="mb-6">
        <nav className="mb-2 flex items-center gap-1.5 text-xs text-text-muted">
          <Link href="/dashboard" className="hover:text-coral">Dashboard</Link>
          <span>/</span>
          <Link href="/dashboard/hms" className="hover:text-coral">HMS</Link>
          <span>/</span>
          <span className="text-ink">NABH Compliance</span>
        </nav>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-ink">NABH Compliance</h1>
            <p className="mt-0.5 text-sm text-text-muted">
              Accreditation readiness across all 10 NABH chapters — track, automate, and get AI guidance
            </p>
          </div>
          <button className="rounded-lg bg-coral px-4 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-coral-deep">
            Download report
          </button>
        </div>
      </div>

      {/* Programme selector */}
      <div className="mb-5 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-text-muted">Select NABH Programme</div>
        <div className="flex gap-3">
          {programmes.map((p) => (
            <button
              key={p.key}
              onClick={() => setActiveProgramme(p.key)}
              className={`flex-1 rounded-lg border px-4 py-2.5 text-left text-xs transition-all ${
                activeProgramme === p.key
                  ? "border-coral bg-coral/5 shadow-sm"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`font-medium ${activeProgramme === p.key ? "text-coral" : "text-ink"}`}>{p.label}</div>
              <div className="mt-0.5 text-[11px] text-text-muted">{p.sublabel}</div>
              <div className="mt-1.5 text-[10px] text-text-muted">{p.oes} OEs · {p.coreOes} Core</div>
            </button>
          ))}
        </div>
      </div>

      {/* Score row */}
      <div className="mb-5 grid grid-cols-[260px_1fr] gap-4">

        {/* Overall score */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="text-[11px] font-medium uppercase tracking-wider text-text-muted">Overall Readiness</div>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-5xl font-semibold tracking-tight text-ink">{overallScore}%</span>
            <span className="mb-1.5 text-xs text-text-muted">of 70% target</span>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-gray-100">
            <div
              className="h-1.5 rounded-full bg-coral transition-all duration-500"
              style={{ width: `${overallScore}%` }}
            />
          </div>
          <div className="mt-2 text-[11px] text-text-muted">
            0 of 10 chapters at target (≥70%)
          </div>
          <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2">
            <div className="text-[11px] font-medium text-amber-700">Action needed</div>
            <div className="mt-0.5 text-[11px] text-amber-600">Run a Self Assessment to get your baseline score</div>
          </div>
        </div>

        {/* Quick stat cards */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Documents", value: "0", sub: "SOPs & policies", accent: "border-t-blue-400" },
            { label: "Open Incidents", value: "0", sub: "Pending CAPA", accent: "border-t-amber-400" },
            { label: "KPIs Tracked", value: "0 / 30", sub: "This month", accent: "border-t-emerald-400" },
            { label: "Staff Trained", value: "0%", sub: "NABH orientation", accent: "border-t-purple-400" },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm border-t-2 ${s.accent}`}>
              <div className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{s.label}</div>
              <div className="mt-1 text-3xl font-semibold tracking-tight text-ink">{s.value}</div>
              <div className="mt-1 text-[11px] text-text-muted">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 10 Chapters */}
      <div className="mb-5">
        <h2 className="mb-3 text-sm font-medium tracking-tight text-ink">10 NABH Chapters</h2>
        <div className="grid grid-cols-5 gap-2.5">
          {chapters.map((ch) => (
            <div
              key={ch.code}
              className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all hover:border-gray-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-ink">{ch.code}</span>
                <ChapterStatus score={ch.score} />
              </div>
              <div className="mt-2 text-[12px] font-medium leading-tight text-ink">{ch.name}</div>
              <div className="mt-1 text-[11px] leading-snug text-text-muted">{ch.description}</div>
              <div className="mt-2.5 h-1 rounded-full bg-gray-100">
                <div
                  className="h-1 rounded-full bg-coral/50 transition-all"
                  style={{ width: `${ch.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-module cards */}
      <div>
        <h2 className="mb-3 text-sm font-medium tracking-tight text-ink">Compliance Modules</h2>
        <div className="grid grid-cols-3 gap-3">
          {subModules.map((mod) => (
            <Link
              key={mod.name}
              href={mod.href}
              className={`group rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${mod.accent}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-ink transition-colors group-hover:bg-coral/10 group-hover:text-coral">
                  <div className="h-4 w-4">{mod.icon}</div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${mod.badgeColor}`}>
                  {mod.badge}
                </span>
              </div>
              <div className="mt-3 text-[13px] font-medium text-ink transition-colors group-hover:text-coral">{mod.name}</div>
              <div className="mt-0.5 text-[12px] leading-relaxed text-text-muted">{mod.description}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Info strip */}
      <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/40 px-5 py-3.5">
        <div className="flex items-center gap-6 text-[12px] text-text-muted">
          <span><strong className="text-ink">NABH 6th Edition</strong> — effective Jan 1, 2025</span>
          <span><strong className="text-ink">SHCO 3rd Edition</strong> — effective July 2025 · 4 yr validity</span>
          <span><strong className="text-ink">Accreditation prep time</strong> — 6 months with MHAI vs 12–18 months manually</span>
          <a href="https://nabh.co" target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-coral hover:underline">
            nabh.co
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" strokeLinecap="round" strokeLinejoin="round" /><polyline points="15 3 21 3 21 9" strokeLinecap="round" strokeLinejoin="round" /><line x1="10" y1="14" x2="21" y2="3" strokeLinecap="round" /></svg>
          </a>
        </div>
      </div>

    </div>
  );
}
