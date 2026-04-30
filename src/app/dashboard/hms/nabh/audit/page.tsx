"use client";

import { useState } from "react";
import Link from "next/link";

var chapterAudits = [
  { code: "AAC", name: "Access, Assessment & Continuity of Care", questions: 25 },
  { code: "COP", name: "Care of Patients", questions: 40 },
  { code: "MOM", name: "Management of Medication", questions: 30 },
  { code: "PRE", name: "Patient Rights & Education", questions: 20 },
  { code: "HIC", name: "Hospital Infection Control", questions: 35 },
  { code: "CQI", name: "Continuous Quality Improvement", questions: 25 },
  { code: "ROM", name: "Responsibilities of Management", questions: 20 },
  { code: "FMS", name: "Facility Management & Safety", questions: 30 },
  { code: "HRM", name: "Human Resource Management", questions: 25 },
  { code: "IMS", name: "Information Management System", questions: 25 },
];

var auditTypes = ["Internal NABH Audit", "Department Audit", "Clinical Audit", "Medication Audit", "Infection Control Audit", "Document Compliance Audit"];

export default function AuditPage() {
  var [showNew, setShowNew] = useState(false);
  var [selectedChapter, setSelectedChapter] = useState("HIC");

  return (
    <div className="px-8 py-6">
      <nav className="mb-2 flex items-center gap-1.5 text-xs text-text-muted">
        <Link href="/dashboard" className="hover:text-coral">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/hms" className="hover:text-coral">HMS</Link>
        <span>/</span>
        <Link href="/dashboard/hms/nabh" className="hover:text-coral">NABH</Link>
        <span>/</span>
        <span className="text-ink">Internal Audit</span>
      </nav>

      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-ink">Internal Audit</h1>
          <p className="mt-0.5 text-sm text-text-muted">Chapter-wise audits with 275 pre-built questions — auto-scores compliance</p>
        </div>
        <button onClick={() => setShowNew(true)} className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-deep">
          + Start Audit
        </button>
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-4 gap-3">
        {[
          { label: "Audits This Month", value: "0", accent: "border-t-blue-400" },
          { label: "Non-Compliances Found", value: "0", accent: "border-t-red-400" },
          { label: "Open CAPAs from Audits", value: "0", accent: "border-t-amber-400" },
          { label: "Avg Compliance Score", value: "—", accent: "border-t-emerald-400" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm border-t-2 ${s.accent}`}>
            <div className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{s.label}</div>
            <div className="mt-1 text-3xl font-semibold tracking-tight text-ink">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[240px_1fr] gap-5">
        {/* Chapter list */}
        <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
          <div className="mb-2 px-2 text-[10px] font-medium uppercase tracking-wider text-text-muted">Select Chapter</div>
          {chapterAudits.map((ch) => (
            <button
              key={ch.code}
              onClick={() => setSelectedChapter(ch.code)}
              className={`mb-1 w-full rounded-lg px-3 py-2.5 text-left text-xs transition-all ${selectedChapter === ch.code ? "bg-coral/10 font-medium text-coral" : "text-text-muted hover:bg-gray-50 hover:text-ink"}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-medium">{ch.code}</span>
                <span className="text-[10px] opacity-70">{ch.questions} questions</span>
              </div>
              <div className="mt-0.5 truncate">{ch.name}</div>
            </button>
          ))}
        </div>

        {/* Audit panel */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-medium text-text-muted">{selectedChapter}</span>
                <h2 className="text-sm font-medium text-ink">{chapterAudits.find((c) => c.code === selectedChapter)?.name}</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowNew(true)} className="rounded-lg bg-coral px-4 py-2 text-xs font-medium text-white hover:bg-coral-deep">
                  Start {selectedChapter} Audit
                </button>
              </div>
            </div>
          </div>

          {/* Audit history — empty */}
          <div className="py-14 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-6 w-6 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <div className="text-sm font-medium text-ink">No {selectedChapter} audits conducted yet</div>
            <div className="mt-1 text-xs text-text-muted">
              {chapterAudits.find((c) => c.code === selectedChapter)?.questions} pre-built questions ready — takes ~30 minutes per chapter
            </div>
            <button onClick={() => setShowNew(true)} className="mt-4 rounded-lg bg-coral px-4 py-2 text-xs font-medium text-white hover:bg-coral-deep">
              Run first {selectedChapter} audit
            </button>
          </div>

          {/* Audit frequency note */}
          <div className="border-t border-gray-100 px-5 py-3">
            <div className="text-[11px] text-text-muted">
              <strong className="text-ink">NABH CQI.7:</strong> Internal audits must be conducted at minimum quarterly for all chapters. Department-specific audits recommended monthly.
            </div>
          </div>
        </div>
      </div>

      {/* New audit modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-ink">Start New Audit</h2>
              <button onClick={() => setShowNew(false)} className="text-text-muted hover:text-ink">&times;</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-text-muted">Audit Type</label>
                <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none">
                  {auditTypes.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">Chapter</label>
                <select defaultValue={selectedChapter} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none">
                  {chapterAudits.map((ch) => <option key={ch.code} value={ch.code}>{ch.code} — {ch.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">Department (optional)</label>
                <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" placeholder="e.g. ICU, OPD, All departments" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">Scheduled Date</label>
                <input type="date" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setShowNew(false)} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-ink hover:border-gray-300">Cancel</button>
              <button onClick={() => setShowNew(false)} className="flex-1 rounded-lg bg-coral py-2.5 text-sm font-medium text-white hover:bg-coral-deep">Start Audit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
