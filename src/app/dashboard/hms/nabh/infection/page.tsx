"use client";

import { useState } from "react";
import Link from "next/link";

var haiKpis = [
  { code: "HAI", name: "Overall HAI Rate", unit: "/1000 patient days", target: "<2", value: null },
  { code: "CAUTI", name: "CAUTI Rate", unit: "/1000 catheter days", target: "<1", value: null },
  { code: "CLABSI", name: "CLABSI Rate", unit: "/1000 central line days", target: "<1", value: null },
  { code: "VAP", name: "VAP Rate", unit: "/1000 ventilator days", target: "<2", value: null },
  { code: "SSI", name: "SSI Rate", unit: "%", target: "<1.5%", value: null },
  { code: "HHC", name: "Hand Hygiene Compliance", unit: "%", target: ">80%", value: null },
];

var deviceTypes = [
  { key: "URINARY_CATHETER", label: "Urinary Catheter", kpi: "CAUTI" },
  { key: "CENTRAL_LINE", label: "Central Line", kpi: "CLABSI" },
  { key: "VENTILATOR", label: "Mechanical Ventilator", kpi: "VAP" },
];

export default function InfectionPage() {
  var [activeTab, setActiveTab] = useState<"overview" | "devices" | "events" | "handhygiene">("overview");
  var [showDeviceForm, setShowDeviceForm] = useState(false);
  var [showEventForm, setShowEventForm] = useState(false);
  var [showHHForm, setShowHHForm] = useState(false);

  return (
    <div className="px-8 py-6">
      <nav className="mb-2 flex items-center gap-1.5 text-xs text-text-muted">
        <Link href="/dashboard" className="hover:text-coral">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/hms" className="hover:text-coral">HMS</Link>
        <span>/</span>
        <Link href="/dashboard/hms/nabh" className="hover:text-coral">NABH</Link>
        <span>/</span>
        <span className="text-ink">Infection Surveillance</span>
      </nav>

      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-ink">Infection Surveillance</h1>
          <p className="mt-0.5 text-sm text-text-muted">HAI tracking, device days, hand hygiene rounds — NABH HIC chapter</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowHHForm(true)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-ink hover:border-gray-300">Log Hand Hygiene Round</button>
          <button onClick={() => setShowEventForm(true)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-ink hover:border-gray-300">Report Infection</button>
          <button onClick={() => setShowDeviceForm(true)} className="rounded-lg bg-coral px-4 py-2 text-xs font-medium text-white hover:bg-coral-deep">+ Device Day</button>
        </div>
      </div>

      {/* HAI KPI cards */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {haiKpis.map((kpi) => (
          <div key={kpi.code} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{kpi.name}</div>
                <div className="mt-1 text-3xl font-semibold tracking-tight text-ink">{kpi.value ?? "—"}</div>
                <div className="mt-0.5 text-[11px] text-text-muted">{kpi.unit}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-text-muted">Target</div>
                <div className="text-xs font-medium text-ink">{kpi.target}</div>
              </div>
            </div>
            <div className="mt-3">
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-text-muted">No data this month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
        {([
          { key: "overview", label: "Overview" },
          { key: "devices", label: "Device Days" },
          { key: "events", label: "Infection Events" },
          { key: "handhygiene", label: "Hand Hygiene" },
        ] as const).map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${activeTab === tab.key ? "bg-white shadow-sm text-ink" : "text-text-muted hover:text-ink"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-medium text-ink">Monthly HAI Trend</h3>
            <div className="flex items-end justify-center gap-2 h-32">
              {["Jan", "Feb", "Mar", "Apr", "May"].map((m) => (
                <div key={m} className="flex flex-col items-center gap-1">
                  <div className="w-8 rounded-t bg-gray-100" style={{ height: "20px" }} />
                  <span className="text-[10px] text-text-muted">{m}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-center text-xs text-text-muted">Log HAI events to see trend data</div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-medium text-ink">Prevention Bundles Status</h3>
            {[
              { name: "CAUTI Bundle", elements: 5, compliance: null },
              { name: "CLABSI Bundle", elements: 5, compliance: null },
              { name: "VAP Bundle", elements: 4, compliance: null },
            ].map((b) => (
              <div key={b.name} className="mb-3 rounded-lg border border-gray-100 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">{b.name}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-text-muted">Not monitored</span>
                </div>
                <div className="mt-2 text-[11px] text-text-muted">{b.elements} bundle elements</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "devices" && (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-3.5 flex items-center justify-between">
            <span className="text-sm font-medium text-ink">Active Device Tracking</span>
            <button onClick={() => setShowDeviceForm(true)} className="rounded-lg bg-coral px-3 py-1.5 text-xs font-medium text-white hover:bg-coral-deep">+ Add Device</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Patient</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Device Type</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Inserted</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Device Days</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={5} className="py-12 text-center text-sm text-text-muted">
                No active devices — add a device day to start tracking
              </td></tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "events" && (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-3.5 flex items-center justify-between">
            <span className="text-sm font-medium text-ink">Infection Events</span>
            <button onClick={() => setShowEventForm(true)} className="rounded-lg bg-coral px-3 py-1.5 text-xs font-medium text-white hover:bg-coral-deep">+ Report Infection</button>
          </div>
          <div className="py-12 text-center text-sm text-text-muted">No infection events reported this month</div>
        </div>
      )}

      {activeTab === "handhygiene" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-ink">Hand Hygiene Compliance Rounds</h2>
            <button onClick={() => setShowHHForm(true)} className="rounded-lg bg-coral px-3 py-1.5 text-xs font-medium text-white hover:bg-coral-deep">+ Log Round</button>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Date</th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Ward</th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Opportunities</th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Compliant</th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Compliance %</th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={6} className="py-12 text-center text-sm text-text-muted">
                  No rounds logged — target is &gt;80% compliance per ward per month
                </td></tr>
              </tbody>
            </table>
          </div>
          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/40 px-4 py-3 text-xs text-text-muted">
            <strong className="text-ink">NABH HIC.3:</strong> Hand hygiene compliance must be monitored monthly per ward using WHO 5-moment methodology. Minimum 80% compliance is the target. Non-compliance triggers corrective action.
          </div>
        </div>
      )}

      {/* Device Day Modal */}
      {showDeviceForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-ink">Add Device Day</h2>
              <button onClick={() => setShowDeviceForm(false)} className="text-text-muted hover:text-ink">&times;</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-text-muted">Patient</label>
                <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" placeholder="Patient name or ID" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">Device Type</label>
                <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none">
                  {deviceTypes.map((d) => <option key={d.key}>{d.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Insertion Date</label>
                  <input type="date" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Insertion Site</label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" placeholder="e.g. Right subclavian" />
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setShowDeviceForm(false)} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-ink">Cancel</button>
              <button onClick={() => setShowDeviceForm(false)} className="flex-1 rounded-lg bg-coral py-2.5 text-sm font-medium text-white hover:bg-coral-deep">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Infection event modal */}
      {showEventForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-ink">Report Infection Event</h2>
              <button onClick={() => setShowEventForm(false)} className="text-text-muted hover:text-ink">&times;</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-text-muted">Infection Type</label>
                <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none">
                  <option>CAUTI</option><option>CLABSI</option><option>VAP</option><option>SSI</option><option>HAI - Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">Patient</label>
                <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" placeholder="Patient name or ID" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Onset Date</label>
                  <input type="date" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Causative Organism</label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" placeholder="From culture report" />
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setShowEventForm(false)} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-ink">Cancel</button>
              <button onClick={() => setShowEventForm(false)} className="flex-1 rounded-lg bg-coral py-2.5 text-sm font-medium text-white hover:bg-coral-deep">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Hand hygiene modal */}
      {showHHForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-ink">Log Hand Hygiene Round</h2>
              <button onClick={() => setShowHHForm(false)} className="text-text-muted hover:text-ink">&times;</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Ward / Area</label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" placeholder="e.g. ICU, Ward 3" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Date</label>
                  <input type="date" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Total Opportunities</label>
                  <input type="number" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" placeholder="e.g. 50" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Compliant Moments</label>
                  <input type="number" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-coral focus:outline-none" placeholder="e.g. 42" />
                </div>
              </div>
              <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                Compliance % will be auto-calculated. WHO 5-moment methodology: before patient contact, before aseptic task, after body fluid, after patient contact, after environment contact.
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setShowHHForm(false)} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-ink">Cancel</button>
              <button onClick={() => setShowHHForm(false)} className="flex-1 rounded-lg bg-coral py-2.5 text-sm font-medium text-white hover:bg-coral-deep">Save Round</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
