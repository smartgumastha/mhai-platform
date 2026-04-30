"use client";

import { useState } from "react";
import Link from "next/link";

var kpiList = [
  { code: "HAI", name: "Hospital Acquired Infection Rate", unit: "/1000 patient days", target: "<2", chapter: "HIC", category: "Infection Control" },
  { code: "CAUTI", name: "CAUTI Rate", unit: "/1000 catheter days", target: "<1", chapter: "HIC", category: "Infection Control" },
  { code: "CLABSI", name: "CLABSI Rate", unit: "/1000 central line days", target: "<1", chapter: "HIC", category: "Infection Control" },
  { code: "VAP", name: "VAP Rate", unit: "/1000 ventilator days", target: "<2", chapter: "HIC", category: "Infection Control" },
  { code: "SSI", name: "Surgical Site Infection Rate", unit: "%", target: "<1.5", chapter: "HIC", category: "Infection Control" },
  { code: "HHC", name: "Hand Hygiene Compliance", unit: "%", target: ">80", chapter: "HIC", category: "Infection Control" },
  { code: "MER", name: "Medication Error Rate", unit: "/1000 administrations", target: "<1", chapter: "MOM", category: "Medication Safety" },
  { code: "ADR", name: "Adverse Drug Reaction Rate", unit: "/1000 admissions", target: "<5", chapter: "MOM", category: "Medication Safety" },
  { code: "ALOS", name: "Average Length of Stay", unit: "days", target: "Specialty-specific", chapter: "AAC", category: "Clinical Outcome" },
  { code: "RAR", name: "30-Day Readmission Rate", unit: "%", target: "<5", chapter: "AAC", category: "Clinical Outcome" },
  { code: "CMR", name: "Crude Mortality Rate", unit: "%", target: "Specialty-specific", chapter: "COP", category: "Clinical Outcome" },
  { code: "DAMA", name: "Discharge Against Medical Advice Rate", unit: "%", target: "<3", chapter: "AAC", category: "Clinical Outcome" },
  { code: "FIR", name: "Fall Incident Rate", unit: "/1000 patient days", target: "<1", chapter: "COP", category: "Patient Safety" },
  { code: "CSAT", name: "Patient Satisfaction Score", unit: "/10", target: ">8", chapter: "PRE", category: "Patient Safety" },
  { code: "GTR", name: "Grievance Resolution TAT", unit: "days", target: "<7", chapter: "PRE", category: "Patient Safety" },
  { code: "BOR", name: "Bed Occupancy Rate", unit: "%", target: "70-85", chapter: "ROM", category: "Operations" },
  { code: "OTU", name: "OT Utilisation Rate", unit: "%", target: ">80", chapter: "COP", category: "Operations" },
  { code: "EWT", name: "Emergency Waiting Time", unit: "minutes", target: "<30", chapter: "AAC", category: "Operations" },
  { code: "LTTAT", name: "Lab TAT Compliance", unit: "%", target: ">90", chapter: "IMS", category: "Operations" },
  { code: "ITTAT", name: "Imaging TAT Compliance", unit: "%", target: ">90", chapter: "IMS", category: "Operations" },
  { code: "STC", name: "Staff Training Completion", unit: "%", target: ">95", chapter: "HRM", category: "HR" },
  { code: "CVC", name: "Credential Verification Compliance", unit: "%", target: "100", chapter: "HRM", category: "HR" },
  { code: "STR", name: "Staff Turnover Rate", unit: "%/month", target: "<3", chapter: "HRM", category: "HR" },
  { code: "PRC", name: "Policy Review Compliance", unit: "%", target: "100", chapter: "ROM", category: "Governance" },
  { code: "CAPC", name: "CAPA Closure Rate (within deadline)", unit: "%", target: ">90", chapter: "CQI", category: "Governance" },
  { code: "AIR", name: "Audit Implementation Rate", unit: "%", target: ">90", chapter: "CQI", category: "Governance" },
  { code: "PMC", name: "Preventive Maintenance Compliance", unit: "%", target: "100", chapter: "FMS", category: "Facility" },
  { code: "CALIC", name: "Calibration Compliance", unit: "%", target: "100", chapter: "FMS", category: "Facility" },
  { code: "BMW", name: "Biomedical Waste Segregation Compliance", unit: "%", target: "100", chapter: "HIC", category: "Infection Control" },
  { code: "INC", name: "Incident Reporting Rate", unit: "/100 admissions", target: ">2", chapter: "CQI", category: "Governance" },
];

var categories = ["All", "Infection Control", "Medication Safety", "Clinical Outcome", "Patient Safety", "Operations", "HR", "Governance", "Facility"];
var months = ["January 2026", "February 2026", "March 2026", "April 2026", "May 2026"];

export default function KpiPage() {
  var [selectedMonth, setSelectedMonth] = useState("May 2026");
  var [selectedCategory, setSelectedCategory] = useState("All");
  var [showForm, setShowForm] = useState(false);

  var filtered = selectedCategory === "All" ? kpiList : kpiList.filter((k) => k.category === selectedCategory);

  return (
    <div className="px-8 py-6">
      <nav className="mb-2 flex items-center gap-1.5 text-xs text-text-muted">
        <Link href="/dashboard" className="hover:text-coral">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/hms" className="hover:text-coral">HMS</Link>
        <span>/</span>
        <Link href="/dashboard/hms/nabh" className="hover:text-coral">NABH</Link>
        <span>/</span>
        <span className="text-ink">Quality KPIs</span>
      </nav>

      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-ink">Quality KPIs</h1>
          <p className="mt-0.5 text-sm text-text-muted">Track 30 NABH-required quality indicators monthly</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink focus:border-coral focus:outline-none"
          >
            {months.map((m) => <option key={m}>{m}</option>)}
          </select>
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-deep"
          >
            + Log KPIs
          </button>
        </div>
      </div>

      {/* Summary row */}
      <div className="mb-5 grid grid-cols-4 gap-3">
        {[
          { label: "KPIs Logged", value: "0 / 30", sub: selectedMonth, accent: "border-t-blue-400" },
          { label: "At Target", value: "0", sub: "Green status", accent: "border-t-emerald-400" },
          { label: "Near Threshold", value: "0", sub: "Amber warning", accent: "border-t-amber-400" },
          { label: "Breached", value: "0", sub: "Needs action", accent: "border-t-red-400" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm border-t-2 ${s.accent}`}>
            <div className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{s.label}</div>
            <div className="mt-1 text-3xl font-semibold tracking-tight text-ink">{s.value}</div>
            <div className="mt-1 text-[11px] text-text-muted">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${selectedCategory === cat ? "bg-coral text-white" : "border border-gray-200 text-text-muted hover:border-gray-300"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* KPI table */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">KPI</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Chapter</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Target</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">This Month</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Status</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((kpi, i) => (
              <tr key={kpi.code} className={`border-b border-gray-50 transition-colors hover:bg-gray-50/50 ${i % 2 === 0 ? "" : "bg-gray-50/20"}`}>
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">{kpi.name}</div>
                  <div className="text-[11px] text-text-muted">{kpi.code} · {kpi.unit}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-ink">{kpi.chapter}</span>
                </td>
                <td className="px-4 py-3 text-sm text-ink">{kpi.target}</td>
                <td className="px-4 py-3 text-sm text-text-muted">—</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-text-muted">Not logged</span>
                </td>
                <td className="px-4 py-3">
                  <button className="text-[11px] text-coral hover:underline" onClick={() => setShowForm(true)}>Log</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Log KPI modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-ink">Log KPI — {selectedMonth}</h2>
              <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-ink">&times;</button>
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-xs text-text-muted">KPI</label>
              <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none">
                {kpiList.map((k) => <option key={k.code} value={k.code}>{k.name}</option>)}
              </select>
            </div>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-text-muted">Numerator</label>
                <input type="number" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" placeholder="e.g. 2" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">Denominator</label>
                <input type="number" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" placeholder="e.g. 1500" />
              </div>
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-xs text-text-muted">Notes (optional)</label>
              <textarea rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none resize-none" placeholder="Any context or explanation..." />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-ink hover:border-gray-300">Cancel</button>
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-lg bg-coral py-2 text-sm font-medium text-white hover:bg-coral-deep">Save KPI</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
