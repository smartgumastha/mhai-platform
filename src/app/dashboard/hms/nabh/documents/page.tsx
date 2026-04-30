"use client";

import { useState } from "react";
import Link from "next/link";

var chapters = ["All", "AAC", "COP", "MOM", "PRE", "HIC", "CQI", "ROM", "FMS", "HRM", "IMS"];
var docTypes = ["SOP", "Policy", "Manual", "Form", "Register", "Procedure", "Guideline"];

var templateLibrary = [
  { name: "Hand Hygiene SOP", type: "SOP", chapter: "HIC", description: "WHO 5-moment hand hygiene procedure for all clinical staff" },
  { name: "Medication Administration SOP", type: "SOP", chapter: "MOM", description: "5-rights verification procedure for safe medication administration" },
  { name: "Infection Control Policy", type: "Policy", chapter: "HIC", description: "Hospital-wide infection prevention and control policy" },
  { name: "Patient Rights & Responsibilities Policy", type: "Policy", chapter: "PRE", description: "Patient rights charter and responsibility statement" },
  { name: "Quality Policy", type: "Policy", chapter: "ROM", description: "Organizational commitment to quality and patient safety" },
  { name: "Informed Consent Policy", type: "Policy", chapter: "PRE", description: "Process for obtaining valid informed consent" },
  { name: "Incident Reporting Procedure", type: "Procedure", chapter: "CQI", description: "Step-by-step guide for reporting and managing incidents" },
  { name: "Equipment Maintenance SOP", type: "SOP", chapter: "FMS", description: "Preventive maintenance schedule and procedure for medical equipment" },
  { name: "Biomedical Waste Management SOP", type: "SOP", chapter: "HIC", description: "Segregation, storage, and disposal per BMW Rules 2016" },
  { name: "Medical Records Management Policy", type: "Policy", chapter: "IMS", description: "Creation, maintenance, retention, and security of medical records" },
  { name: "Staff Orientation Manual", type: "Manual", chapter: "HRM", description: "Induction manual covering NABH standards and hospital policies" },
  { name: "Fire Safety Procedure", type: "Procedure", chapter: "FMS", description: "Fire prevention, detection, evacuation, and drill procedures" },
];

export default function DocumentsPage() {
  var [selectedChapter, setSelectedChapter] = useState("All");
  var [showGenerate, setShowGenerate] = useState(false);
  var [genPrompt, setGenPrompt] = useState("");
  var [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  var filtered = selectedChapter === "All" ? templateLibrary : templateLibrary.filter((d) => d.chapter === selectedChapter);

  return (
    <div className="px-8 py-6">
      <nav className="mb-2 flex items-center gap-1.5 text-xs text-text-muted">
        <Link href="/dashboard" className="hover:text-coral">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/hms" className="hover:text-coral">HMS</Link>
        <span>/</span>
        <Link href="/dashboard/hms/nabh" className="hover:text-coral">NABH</Link>
        <span>/</span>
        <span className="text-ink">Document Manager</span>
      </nav>

      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-ink">Document Manager</h1>
          <p className="mt-0.5 text-sm text-text-muted">SOPs, policies, manuals — version controlled with AI-assisted drafting</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowGenerate(true)} className="flex items-center gap-2 rounded-lg border border-coral/30 bg-coral/5 px-4 py-2 text-sm font-medium text-coral hover:bg-coral/10">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 12 2.1 9.1"/></svg>
            Generate with AI
          </button>
          <button className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-deep">
            + Upload Document
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-4 gap-3">
        {[
          { label: "Total Documents", value: "0", sub: "In library", accent: "border-t-blue-400" },
          { label: "Approved", value: "0", sub: "Active SOPs", accent: "border-t-emerald-400" },
          { label: "Due for Review", value: "0", sub: "Within 30 days", accent: "border-t-amber-400" },
          { label: "Drafts Pending", value: "0", sub: "Awaiting approval", accent: "border-t-purple-400" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm border-t-2 ${s.accent}`}>
            <div className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{s.label}</div>
            <div className="mt-1 text-3xl font-semibold tracking-tight text-ink">{s.value}</div>
            <div className="mt-1 text-[11px] text-text-muted">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Chapter filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {chapters.map((ch) => (
          <button key={ch} onClick={() => setSelectedChapter(ch)} className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${selectedChapter === ch ? "bg-coral text-white" : "border border-gray-200 text-text-muted hover:border-gray-300"}`}>
            {ch}
          </button>
        ))}
      </div>

      {/* Two sections: My Documents (empty) + Template Library */}
      <div className="mb-5 rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-3.5 text-sm font-medium text-ink">My Documents</div>
        <div className="py-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-6 w-6 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div className="text-sm font-medium text-ink">No documents yet</div>
          <div className="mt-1 text-xs text-text-muted">Upload an SOP or generate one with AI — takes 2 minutes</div>
          <button onClick={() => setShowGenerate(true)} className="mt-4 rounded-lg bg-coral px-4 py-2 text-xs font-medium text-white hover:bg-coral-deep">
            Generate first SOP with AI
          </button>
        </div>
      </div>

      {/* Template Library */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink">Template Library — {filtered.length} templates</h2>
          <span className="text-xs text-text-muted">Click any template to generate a customised version for your hospital</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {filtered.map((tpl) => (
            <button
              key={tpl.name}
              onClick={() => { setSelectedTemplate(tpl.name); setGenPrompt(`Generate a "${tpl.name}" for our hospital. Chapter: ${tpl.chapter}.`); setShowGenerate(true); }}
              className="rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-all hover:border-coral/30 hover:shadow-md"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-ink">{tpl.chapter}</span>
                <span className="rounded-full border border-gray-200 px-2 py-0.5 text-[10px] text-text-muted">{tpl.type}</span>
              </div>
              <div className="text-[13px] font-medium text-ink">{tpl.name}</div>
              <div className="mt-0.5 text-[11px] leading-relaxed text-text-muted">{tpl.description}</div>
              <div className="mt-3 text-[11px] font-medium text-coral">Generate with AI →</div>
            </button>
          ))}
        </div>
      </div>

      {/* Generate modal */}
      {showGenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-ink">Generate Document with AI</h2>
              <button onClick={() => { setShowGenerate(false); setSelectedTemplate(null); }} className="text-text-muted hover:text-ink">&times;</button>
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-xs text-text-muted">Document type</label>
              <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none">
                {docTypes.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-xs text-text-muted">Chapter</label>
              <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none">
                {chapters.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-xs text-text-muted">Describe what you need</label>
              <textarea rows={3} value={genPrompt} onChange={(e) => setGenPrompt(e.target.value)} className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" placeholder="e.g. Hand hygiene SOP for a 30-bed nursing home in India..." />
            </div>
            <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              AI will generate a first draft based on NABH standards. Review and approve before publishing. Connect NABH Coach for full generation.
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowGenerate(false); setSelectedTemplate(null); }} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-ink hover:border-gray-300">Cancel</button>
              <button onClick={() => { setShowGenerate(false); setSelectedTemplate(null); }} className="flex-1 rounded-lg bg-coral py-2.5 text-sm font-medium text-white hover:bg-coral-deep">Generate Draft</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
