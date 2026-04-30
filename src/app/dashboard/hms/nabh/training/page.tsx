"use client";

import { useState } from "react";
import Link from "next/link";

var mandatoryTrainings = [
  { code: "NABH-ORI", name: "NABH Standards Orientation", audience: "All Staff", frequency: "At joining + Annual", duration: "2 hrs", chapter: "HRM" },
  { code: "PT-SAFETY", name: "Patient Safety", audience: "All Clinical", frequency: "Annual", duration: "1 hr", chapter: "CQI" },
  { code: "INF-CTRL", name: "Infection Control & Hand Hygiene", audience: "All Staff", frequency: "Annual", duration: "1 hr", chapter: "HIC" },
  { code: "BLS", name: "Basic Life Support (BLS)", audience: "All Clinical", frequency: "Biennial", duration: "4 hrs", chapter: "COP" },
  { code: "FIRE-SAFE", name: "Fire Safety", audience: "All Staff", frequency: "Annual", duration: "1 hr", chapter: "FMS" },
  { code: "MED-SAFE", name: "Medication Safety", audience: "Nursing + Pharmacy", frequency: "Annual", duration: "1 hr", chapter: "MOM" },
  { code: "PT-RIGHTS", name: "Patient Rights & Responsibilities", audience: "All Staff", frequency: "Annual", duration: "30 min", chapter: "PRE" },
  { code: "DPDPA", name: "Data Privacy (DPDPA 2023)", audience: "All Staff", frequency: "Annual", duration: "1 hr", chapter: "IMS" },
  { code: "BMW", name: "Biomedical Waste Management", audience: "All + Housekeeping", frequency: "Annual", duration: "30 min", chapter: "HIC" },
];

var credentialTypes = [
  { name: "NMC / State Council Registration", roles: "Doctors" },
  { name: "INC / State Nursing Registration", roles: "Nurses" },
  { name: "State Pharmacy Council Registration", roles: "Pharmacists" },
  { name: "DMLT / BMLT + Registration", roles: "Lab Technicians" },
  { name: "Diploma in Radiography", roles: "Radiographers" },
  { name: "BPT / MPT Degree", roles: "Physiotherapists" },
];

export default function TrainingPage() {
  var [activeTab, setActiveTab] = useState<"training" | "credentials">("training");
  var [showAdd, setShowAdd] = useState(false);

  return (
    <div className="px-8 py-6">
      <nav className="mb-2 flex items-center gap-1.5 text-xs text-text-muted">
        <Link href="/dashboard" className="hover:text-coral">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/hms" className="hover:text-coral">HMS</Link>
        <span>/</span>
        <Link href="/dashboard/hms/nabh" className="hover:text-coral">NABH</Link>
        <span>/</span>
        <span className="text-ink">Staff Training</span>
      </nav>

      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-ink">Staff Training & Credentials</h1>
          <p className="mt-0.5 text-sm text-text-muted">Training calendar, attendance tracking, credential expiry alerts</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-deep">
          + Add Record
        </button>
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-4 gap-3">
        {[
          { label: "Staff Registered", value: "0", sub: "Add staff members first", accent: "border-t-blue-400" },
          { label: "Training Completion", value: "—", sub: "NABH mandatory trainings", accent: "border-t-emerald-400" },
          { label: "Credentials Expiring", value: "0", sub: "Within 30 days", accent: "border-t-amber-400" },
          { label: "Expired Credentials", value: "0", sub: "Immediate action required", accent: "border-t-red-400" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm border-t-2 ${s.accent}`}>
            <div className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{s.label}</div>
            <div className="mt-1 text-3xl font-semibold tracking-tight text-ink">{s.value}</div>
            <div className="mt-1 text-[11px] text-text-muted">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
        {(["training", "credentials"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-all ${activeTab === tab ? "bg-white shadow-sm text-ink" : "text-text-muted hover:text-ink"}`}>
            {tab === "training" ? "Training Records" : "Credentials"}
          </button>
        ))}
      </div>

      {activeTab === "training" ? (
        <div>
          {/* Mandatory training catalog */}
          <div className="mb-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-ink">Mandatory NABH Training Catalog</h2>
              <span className="text-xs text-text-muted">{mandatoryTrainings.length} required trainings</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {mandatoryTrainings.map((t) => (
                <div key={t.code} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-ink">{t.chapter}</span>
                    <span className="text-[10px] text-text-muted">{t.duration}</span>
                  </div>
                  <div className="text-[13px] font-medium text-ink">{t.name}</div>
                  <div className="mt-0.5 text-[11px] text-text-muted">{t.audience} · {t.frequency}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-text-muted">0 / 0 staff trained</span>
                    <button onClick={() => setShowAdd(true)} className="text-[11px] text-coral hover:underline">+ Log</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Training records table — empty */}
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3.5 text-sm font-medium text-ink">Training Records</div>
            <div className="py-12 text-center">
              <div className="text-sm text-text-muted">No training records yet</div>
              <button onClick={() => setShowAdd(true)} className="mt-3 rounded-lg bg-coral px-4 py-2 text-xs font-medium text-white hover:bg-coral-deep">Add first training record</button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-5 rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink">Staff Credentials Register</span>
                <button onClick={() => setShowAdd(true)} className="rounded-lg bg-coral px-3 py-1.5 text-xs font-medium text-white hover:bg-coral-deep">+ Add Credential</button>
              </div>
            </div>
            <div className="py-12 text-center">
              <div className="text-sm text-text-muted">No credentials registered yet</div>
              <div className="mt-1 text-xs text-text-muted">Add staff and upload their NMC, nursing council, and other registration certificates</div>
              <button onClick={() => setShowAdd(true)} className="mt-3 rounded-lg bg-coral px-4 py-2 text-xs font-medium text-white hover:bg-coral-deep">Register first credential</button>
            </div>
          </div>

          {/* Credential types reference */}
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3.5 text-sm font-medium text-ink">Required Credentials by Role (NABH HRM)</div>
            <div className="divide-y divide-gray-50">
              {credentialTypes.map((c) => (
                <div key={c.name} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-ink">{c.name}</span>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-text-muted">{c.roles}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-ink">{activeTab === "training" ? "Add Training Record" : "Add Credential"}</h2>
              <button onClick={() => setShowAdd(false)} className="text-text-muted hover:text-ink">&times;</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-text-muted">Staff Member</label>
                <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" placeholder="Name or staff ID" />
              </div>
              {activeTab === "training" ? (
                <>
                  <div>
                    <label className="mb-1 block text-xs text-text-muted">Training</label>
                    <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none">
                      {mandatoryTrainings.map((t) => <option key={t.code}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-text-muted">Date Completed</label>
                      <input type="date" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-text-muted">Next Due Date</label>
                      <input type="date" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-1 block text-xs text-text-muted">Credential Type</label>
                    <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none">
                      {credentialTypes.map((c) => <option key={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-text-muted">Registration Number</label>
                      <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" placeholder="e.g. MH-12345" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-text-muted">Expiry Date</label>
                      <input type="date" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-ink hover:border-gray-300">Cancel</button>
              <button onClick={() => setShowAdd(false)} className="flex-1 rounded-lg bg-coral py-2.5 text-sm font-medium text-white hover:bg-coral-deep">Save Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
