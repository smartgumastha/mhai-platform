"use client";

import { useState } from "react";
import Link from "next/link";

var incidentTypes = ["Medication Error", "Patient Fall", "Hospital Acquired Infection", "Adverse Drug Reaction", "Blood Transfusion Reaction", "Pressure Ulcer", "Near Miss", "Sentinel Event", "Equipment Failure", "Security Incident", "Other"];
var severityLevels = ["Sentinel", "Serious", "Moderate", "Minor", "Near Miss"];
var severityColors: Record<string, string> = {
  Sentinel: "bg-red-100 text-red-700",
  Serious: "bg-red-50 text-red-600",
  Moderate: "bg-amber-50 text-amber-700",
  Minor: "bg-yellow-50 text-yellow-700",
  "Near Miss": "bg-blue-50 text-blue-600",
};

export default function IncidentsPage() {
  var [showForm, setShowForm] = useState(false);
  var [form, setForm] = useState({ type: "", severity: "", date: "", description: "", department: "", patient: "" });

  return (
    <div className="px-8 py-6">
      <nav className="mb-2 flex items-center gap-1.5 text-xs text-text-muted">
        <Link href="/dashboard" className="hover:text-coral">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/hms" className="hover:text-coral">HMS</Link>
        <span>/</span>
        <Link href="/dashboard/hms/nabh" className="hover:text-coral">NABH</Link>
        <span>/</span>
        <span className="text-ink">Incident Reporting</span>
      </nav>

      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-ink">Incident Reporting</h1>
          <p className="mt-0.5 text-sm text-text-muted">Log incidents, near-misses, adverse events — auto-generates CAPA workflow</p>
        </div>
        <button onClick={() => setShowForm(true)} className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-deep">
          + Report Incident
        </button>
      </div>

      {/* Summary cards */}
      <div className="mb-5 grid grid-cols-5 gap-3">
        {[
          { label: "Total (MTD)", value: "0", accent: "border-t-gray-300" },
          { label: "Sentinel Events", value: "0", accent: "border-t-red-500" },
          { label: "Open CAPAs", value: "0", accent: "border-t-amber-400" },
          { label: "Near Misses", value: "0", accent: "border-t-blue-400" },
          { label: "Closed This Month", value: "0", accent: "border-t-emerald-400" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm border-t-2 ${s.accent}`}>
            <div className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{s.label}</div>
            <div className="mt-1 text-3xl font-semibold tracking-tight text-ink">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Incident table / empty state */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-3.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink">Incident Register</span>
            <div className="flex gap-2">
              {severityLevels.map((s) => (
                <button key={s} className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${severityColors[s]}`}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Date</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Type</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Severity</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Department</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">CAPA Status</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="py-14 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <svg className="h-6 w-6 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-ink">No incidents reported</div>
                <div className="mt-1 text-xs text-text-muted">All staff can report incidents — including near-misses anonymously</div>
                <button onClick={() => setShowForm(true)} className="mt-4 rounded-lg bg-coral px-4 py-2 text-xs font-medium text-white hover:bg-coral-deep">
                  Report first incident
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* NABH note */}
      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/40 px-4 py-3 text-xs text-text-muted">
        <strong className="text-ink">NABH CQI.5 requirement:</strong> All incidents must be reported, investigated, and CAPA implemented. Sentinel events require Root Cause Analysis within 45 days. Monthly incident rate is a mandatory quality indicator.
      </div>

      {/* Report incident modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-ink">Report Incident</h2>
              <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-ink">&times;</button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Incident Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none">
                    <option value="">Select type</option>
                    {incidentTypes.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Severity</label>
                  <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none">
                    <option value="">Select severity</option>
                    {severityLevels.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Date of Incident</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Department</label>
                  <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" placeholder="e.g. ICU, OPD, Pharmacy" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">Patient (optional — leave blank for anonymous)</label>
                <input value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" placeholder="Patient name or ID" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" placeholder="What happened? Include timeline, contributing factors..." />
              </div>
            </div>

            {form.severity === "Sentinel" && (
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                Sentinel Event — Root Cause Analysis (RCA) will be automatically assigned. Must be completed within 45 days per NABH CQI standards.
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-ink hover:border-gray-300">Cancel</button>
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-lg bg-coral py-2.5 text-sm font-medium text-white hover:bg-coral-deep">Submit Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
