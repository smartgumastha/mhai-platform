"use client";

import { useState, useEffect } from "react";
import { getPatients } from "@/lib/api";
import { useNotification } from "@/app/providers/NotificationProvider";

type Patient = {
  id: string;
  patient_name: string;
  patient_phone: string;
  last_visit: string;
  total_visits: number;
  visits?: Visit[];
};

type Visit = {
  id: string;
  slot_date: string;
  slot_time: string;
  status: string;
  source?: string;
  notes?: string;
};

var VISIT_STATUS: Record<string, { label: string; cls: string }> = {
  confirmed: { label: "Confirmed", cls: "bg-blue-50 text-blue-600" },
  completed: { label: "Completed", cls: "bg-emerald-50 text-emerald-600" },
  cancelled: { label: "Cancelled", cls: "bg-red-50 text-red-600" },
  no_show: { label: "No-show", cls: "bg-amber-50 text-amber-600" },
  pending: { label: "Pending", cls: "bg-gray-100 text-gray-600" },
};

export default function PatientsPage() {
  var notify = useNotification();
  var [patients, setPatients] = useState<Patient[]>([]);
  var [loading, setLoading] = useState(true);
  var [search, setSearch] = useState("");
  var [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    getPatients()
      .then((res) => {
        if (res.success && res.patients) {
          setPatients(res.patients);
        }
      })
      .catch(() => {
        notify.error("Failed to load", "Could not fetch patient records.");
      })
      .finally(() => setLoading(false));
  }, []);

  var filtered = search.trim()
    ? patients.filter((p) => {
        var q = search.toLowerCase();
        return p.patient_name.toLowerCase().includes(q) || p.patient_phone.includes(q);
      })
    : patients;

  var inputClass =
    "w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

  return (
    <div className="px-8 py-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Patients</h1>
        <p className="mt-1 text-sm text-gray-500">Patient records created automatically from appointments</p>
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <input
            className={inputClass + " pl-9"}
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <span className="text-[11px] text-gray-400">{filtered.length} patient{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="text-sm text-gray-400">Loading patients...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-center">
          <div className="mb-2 text-sm font-medium text-gray-700">
            {search.trim() ? "No patients match your search" : "No patients yet"}
          </div>
          <p className="max-w-sm text-xs text-gray-500">
            {search.trim()
              ? "Try a different name or phone number."
              : "Patient records are created automatically when appointments are completed."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Patient</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Phone</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Last visit</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Total visits</th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((patient) => {
                var isExpanded = expandedId === patient.id;
                return (
                  <tr key={patient.id} className="group">
                    <td colSpan={5} className="p-0">
                      {/* Main row */}
                      <div
                        onClick={() => setExpandedId(isExpanded ? null : patient.id)}
                        className="flex cursor-pointer items-center border-b border-gray-50 transition-colors hover:bg-gray-50/50"
                      >
                        <div className="flex-1 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-medium text-emerald-600">
                              {patient.patient_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-[13px] font-medium text-gray-900">{patient.patient_name}</span>
                          </div>
                        </div>
                        <div className="w-40 px-4 py-3 text-[13px] text-gray-600">{patient.patient_phone}</div>
                        <div className="w-32 px-4 py-3 text-[13px] text-gray-600">{patient.last_visit || "—"}</div>
                        <div className="w-28 px-4 py-3">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-600">
                            {patient.total_visits} visit{patient.total_visits !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="w-10 px-4 py-3 text-gray-400">
                          <svg className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </div>
                      </div>

                      {/* Expanded visit history */}
                      {isExpanded && (
                        <div className="border-b border-gray-100 bg-gray-50/30 px-4 py-3">
                          <div className="mb-2 text-[11px] font-medium text-gray-500">Visit history</div>
                          {patient.visits && patient.visits.length > 0 ? (
                            <div className="space-y-1.5">
                              {patient.visits.map((visit) => {
                                var vBadge = VISIT_STATUS[visit.status] || VISIT_STATUS.pending;
                                return (
                                  <div key={visit.id} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 shadow-sm">
                                    <span className="text-[12px] text-gray-700">{visit.slot_date}</span>
                                    <span className="text-[12px] text-gray-500">{visit.slot_time}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${vBadge.cls}`}>{vBadge.label}</span>
                                    {visit.source && <span className="text-[10px] text-gray-400">{visit.source}</span>}
                                    {visit.notes && <span className="text-[10px] text-gray-400 italic">{visit.notes}</span>}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-[11px] text-gray-400">No detailed visit records available.</div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
