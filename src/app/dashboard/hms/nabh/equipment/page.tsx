"use client";

import { useState } from "react";
import Link from "next/link";

var departments = ["All", "ICU", "OT", "OPD", "Emergency", "Radiology", "Laboratory", "Pharmacy", "Ward"];
var pmFrequencies = ["Monthly", "Quarterly", "Half-Yearly", "Annual"];
var statusColors: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700",
  "Under Repair": "bg-amber-50 text-amber-700",
  Condemned: "bg-red-50 text-red-600",
};

export default function EquipmentPage() {
  var [showAdd, setShowAdd] = useState(false);
  var [showLog, setShowLog] = useState(false);
  var [selectedDept, setSelectedDept] = useState("All");

  return (
    <div className="px-8 py-6">
      <nav className="mb-2 flex items-center gap-1.5 text-xs text-text-muted">
        <Link href="/dashboard" className="hover:text-coral">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/hms" className="hover:text-coral">HMS</Link>
        <span>/</span>
        <Link href="/dashboard/hms/nabh" className="hover:text-coral">NABH</Link>
        <span>/</span>
        <span className="text-ink">Equipment Maintenance</span>
      </nav>

      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-ink">Equipment Maintenance</h1>
          <p className="mt-0.5 text-sm text-text-muted">Preventive maintenance schedules, calibration tracking, and service logs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowLog(true)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-ink hover:border-gray-300">
            + Log Maintenance
          </button>
          <button onClick={() => setShowAdd(true)} className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-deep">
            + Add Equipment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-4 gap-3">
        {[
          { label: "Total Equipment", value: "0", sub: "Registered", accent: "border-t-blue-400" },
          { label: "PM Overdue", value: "0", sub: "Needs immediate action", accent: "border-t-red-400" },
          { label: "PM Due This Month", value: "0", sub: "Upcoming maintenance", accent: "border-t-amber-400" },
          { label: "Calibration Expiring", value: "0", sub: "Within 30 days", accent: "border-t-purple-400" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm border-t-2 ${s.accent}`}>
            <div className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{s.label}</div>
            <div className="mt-1 text-3xl font-semibold tracking-tight text-ink">{s.value}</div>
            <div className="mt-1 text-[11px] text-text-muted">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Department filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {departments.map((d) => (
          <button key={d} onClick={() => setSelectedDept(d)} className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${selectedDept === d ? "bg-coral text-white" : "border border-gray-200 text-text-muted hover:border-gray-300"}`}>
            {d}
          </button>
        ))}
      </div>

      {/* Equipment table */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Equipment</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Department</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Last PM</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Next PM Due</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Calibration</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={7} className="py-14 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <svg className="h-6 w-6 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-ink">No equipment registered</div>
                <div className="mt-1 text-xs text-text-muted">Add your medical equipment to track preventive maintenance and calibration schedules</div>
                <button onClick={() => setShowAdd(true)} className="mt-4 rounded-lg bg-coral px-4 py-2 text-xs font-medium text-white hover:bg-coral-deep">
                  Register first equipment
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/40 px-4 py-3 text-xs text-text-muted">
        <strong className="text-ink">NABH FMS.4 requirement:</strong> All medical equipment must have scheduled preventive maintenance. Calibration certificates required for measuring equipment. Equipment compliance report is a mandatory KPI.
      </div>

      {/* Add Equipment modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-ink">Add Equipment</h2>
              <button onClick={() => setShowAdd(false)} className="text-text-muted hover:text-ink">&times;</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-text-muted">Equipment Name</label>
                <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" placeholder="e.g. Patient Monitor, Ventilator, Autoclave" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Make / Brand</label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" placeholder="e.g. Philips, GE" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Model</label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" placeholder="e.g. IntelliVue MX40" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Serial Number</label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" placeholder="From equipment tag" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Department</label>
                  <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none">
                    {departments.filter((d) => d !== "All").map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-text-muted">PM Frequency</label>
                  <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none">
                    {pmFrequencies.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Installation Date</label>
                  <input type="date" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" />
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-ink hover:border-gray-300">Cancel</button>
              <button onClick={() => setShowAdd(false)} className="flex-1 rounded-lg bg-coral py-2.5 text-sm font-medium text-white hover:bg-coral-deep">Add Equipment</button>
            </div>
          </div>
        </div>
      )}

      {/* Log Maintenance modal */}
      {showLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-ink">Log Maintenance</h2>
              <button onClick={() => setShowLog(false)} className="text-text-muted hover:text-ink">&times;</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-text-muted">Equipment</label>
                <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" placeholder="Search equipment..." />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">Type</label>
                <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none">
                  <option>Preventive Maintenance (PM)</option>
                  <option>Calibration</option>
                  <option>Repair</option>
                  <option>Inspection</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">Date Performed</label>
                <input type="date" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">Findings & Action</label>
                <textarea rows={2} className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" placeholder="Describe what was done..." />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">Next Due Date</label>
                <input type="date" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setShowLog(false)} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-ink hover:border-gray-300">Cancel</button>
              <button onClick={() => setShowLog(false)} className="flex-1 rounded-lg bg-coral py-2.5 text-sm font-medium text-white hover:bg-coral-deep">Save Log</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
