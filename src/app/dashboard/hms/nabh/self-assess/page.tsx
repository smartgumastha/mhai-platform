"use client";

import { useState } from "react";
import Link from "next/link";

var chapters = [
  { code: "AAC", name: "Access, Assessment & Continuity of Care", standards: 7, oes: 28 },
  { code: "COP", name: "Care of Patients", standards: 8, oes: 35 },
  { code: "MOM", name: "Management of Medication", standards: 7, oes: 25 },
  { code: "PRE", name: "Patient Rights & Education", standards: 7, oes: 22 },
  { code: "HIC", name: "Hospital Infection Control", standards: 8, oes: 30 },
  { code: "CQI", name: "Continuous Quality Improvement", standards: 7, oes: 28 },
  { code: "ROM", name: "Responsibilities of Management", standards: 6, oes: 20 },
  { code: "FMS", name: "Facility Management & Safety", standards: 6, oes: 25 },
  { code: "HRM", name: "Human Resource Management", standards: 6, oes: 22 },
  { code: "IMS", name: "Information Management System", standards: 6, oes: 20 },
];

var sampleOEs: Record<string, { code: string; text: string; category: "Core" | "Commitment" | "Achievement" }[]> = {
  AAC: [
    { code: "AAC.1.1", text: "The scope of services provided is defined and communicated to patients", category: "Core" },
    { code: "AAC.1.2", text: "Services are provided as per the defined scope", category: "Core" },
    { code: "AAC.2.1", text: "All patients are assessed at the time of entry", category: "Core" },
    { code: "AAC.2.2", text: "The initial assessment is completed within the defined time frame", category: "Core" },
    { code: "AAC.3.1", text: "Patients are reassessed at defined intervals", category: "Commitment" },
    { code: "AAC.4.1", text: "Discharge planning begins at the time of admission", category: "Commitment" },
    { code: "AAC.5.1", text: "Continuity of care is maintained during handoffs", category: "Achievement" },
  ],
};

var scoreLabels: Record<number, string> = { 0: "Non-compliant", 5: "Partial", 10: "Compliant" };
var scoreColors: Record<number, string> = {
  0: "border-red-200 bg-red-50 text-red-600",
  5: "border-amber-200 bg-amber-50 text-amber-600",
  10: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export default function SelfAssessPage() {
  var [activeChapter, setActiveChapter] = useState<string | null>(null);
  var [scores, setScores] = useState<Record<string, number>>({});
  var [started, setStarted] = useState(false);

  var totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  var maxScore = Object.keys(scores).length * 10;
  var pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  function setScore(oeCode: string, val: number) {
    setScores((prev) => ({ ...prev, [oeCode]: val }));
  }

  var activeOEs = activeChapter ? (sampleOEs[activeChapter] ?? []) : [];

  return (
    <div className="px-8 py-6">
      <nav className="mb-2 flex items-center gap-1.5 text-xs text-text-muted">
        <Link href="/dashboard" className="hover:text-coral">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/hms" className="hover:text-coral">HMS</Link>
        <span>/</span>
        <Link href="/dashboard/hms/nabh" className="hover:text-coral">NABH</Link>
        <span>/</span>
        <span className="text-ink">Self Assessment</span>
      </nav>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-ink">Self Assessment</h1>
          <p className="mt-0.5 text-sm text-text-muted">Score all 10 NABH chapters to baseline your accreditation readiness</p>
        </div>
        {started && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-muted">Overall: <strong className="text-ink">{pct}%</strong></span>
            <button className="rounded-lg border border-gray-200 px-4 py-2 text-xs text-ink hover:border-gray-300">Export PDF</button>
          </div>
        )}
      </div>

      {!started ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-coral/10">
            <svg className="h-7 w-7 text-coral" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-ink">Start your NABH Self Assessment</h2>
          <p className="mt-2 text-sm text-text-muted">Score each objective element across all 10 chapters. Takes 60–90 minutes for the full assessment.</p>
          <div className="mt-4 flex justify-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />10 — Compliant</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />5 — Partial</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400" />0 — Non-compliant</span>
          </div>
          <button onClick={() => { setStarted(true); setActiveChapter("AAC"); }} className="mt-6 rounded-lg bg-coral px-6 py-2.5 text-sm font-medium text-white hover:bg-coral-deep">
            Begin Assessment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-[220px_1fr] gap-5">
          {/* Chapter list */}
          <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
            <div className="mb-2 px-2 text-[10px] font-medium uppercase tracking-wider text-text-muted">Chapters</div>
            {chapters.map((ch) => {
              var chOEs = sampleOEs[ch.code] ?? [];
              var chScored = chOEs.filter((oe) => scores[oe.code] !== undefined).length;
              var isActive = activeChapter === ch.code;
              return (
                <button
                  key={ch.code}
                  onClick={() => setActiveChapter(ch.code)}
                  className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-xs transition-all ${isActive ? "bg-coral/10 font-medium text-coral" : "text-text-muted hover:bg-gray-50 hover:text-ink"}`}
                >
                  <div className="font-mono">{ch.code}</div>
                  <div className="mt-0.5 truncate">{ch.name.split("&")[0].trim()}</div>
                  <div className="mt-1 text-[10px] opacity-70">{chScored}/{chOEs.length} scored</div>
                </button>
              );
            })}
          </div>

          {/* OE scoring panel */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            {activeChapter && (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-medium text-text-muted">{activeChapter}</span>
                    <h2 className="text-base font-medium text-ink">{chapters.find((c) => c.code === activeChapter)?.name}</h2>
                  </div>
                  <span className="text-xs text-text-muted">{activeOEs.length} objective elements</span>
                </div>

                {activeOEs.length === 0 ? (
                  <div className="py-10 text-center text-sm text-text-muted">
                    Full objective elements for this chapter will be loaded from NABH standards database.
                    <br />
                    <span className="mt-2 inline-block text-xs">Contact support to enable full assessment.</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeOEs.map((oe) => {
                      var cur = scores[oe.code];
                      return (
                        <div key={oe.code} className="rounded-lg border border-gray-100 p-4">
                          <div className="mb-2 flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <span className={`mr-2 rounded px-1.5 py-0.5 text-[10px] font-medium ${oe.category === "Core" ? "bg-red-50 text-red-600" : oe.category === "Commitment" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>{oe.category}</span>
                              <span className="font-mono text-xs text-text-muted">{oe.code}</span>
                              <p className="mt-1 text-sm text-ink">{oe.text}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {[0, 5, 10].map((val) => (
                              <button
                                key={val}
                                onClick={() => setScore(oe.code, val)}
                                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${cur === val ? scoreColors[val] : "border-gray-200 text-text-muted hover:border-gray-300"}`}
                              >
                                {val} — {scoreLabels[val]}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
