"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/app/providers/locale-context";
import { patientApi } from "../providers/patient-auth-context";

function fmtDate(d?: string, cc?: string) {
  if (!d) return "—";
  try {
    var locale = cc === "US" ? "en-US" : cc === "GB" ? "en-GB" : "en-IN";
    return new Date(d).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
  } catch { return d; }
}

function Section({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</div>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

export default function PatientEhrPage() {
  var { localeV2 } = useLocale();
  var cc = localeV2?.country_code || "IN";

  var [visits, setVisits] = useState<any[]>([]);
  var [loading, setLoading] = useState(true);
  var [expanded, setExpanded] = useState<string | null>(null);

  useEffect(function () {
    patientApi("/api/patient/visits")
      .then(function (d: any) { setVisits(d.visits || d.data || []); })
      .catch(function () {})
      .finally(function () { setLoading(false); });
  }, []);

  return (
    <div className="px-8 py-6">
      <h1 className="mb-0.5 text-2xl font-bold text-gray-900">EHR Records</h1>
      <p className="mb-6 text-sm text-gray-400">Your complete consultation history</p>

      {loading ? (
        [1, 2, 3].map(function (i) {
          return <div key={i} className="mb-3 h-16 animate-pulse rounded-2xl bg-gray-100" />;
        })
      ) : visits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-20 text-center">
          <div className="mb-2 text-3xl font-bold text-gray-200">≡</div>
          <p className="text-sm font-medium text-gray-500">No EHR records yet</p>
          <p className="mt-1 text-xs text-gray-400">Consultation records will appear here after each visit</p>
        </div>
      ) : (
        visits.map(function (v: any, idx: number) {
          var vid = v.visit_record_id || v.id || String(idx);
          var isOpen = expanded === vid;
          var rx: any[] = v.prescription || v.medications || [];
          return (
            <div key={vid} className="mb-3 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {/* Row */}
              <button
                type="button"
                onClick={function () { setExpanded(isOpen ? null : vid); }}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50/50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#1ba3d6]/10 font-bold text-[#1ba3d6]">
                    {String(visits.length - idx).padStart(2, "0")}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">
                      {fmtDate(v.visit_date || v.created_at, cc)}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      {v.doctor_name && (
                        <span className="text-xs text-gray-400">{v.doctor_name}</span>
                      )}
                      {v.diagnosis && (
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-blue-700">
                          {v.diagnosis.split(" ")[0]}
                        </span>
                      )}
                      {rx.length > 0 && (
                        <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] text-green-700">
                          ℞ {rx.length} med{rx.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <svg
                  width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
                  className={"flex-shrink-0 text-gray-400 transition-transform " + (isOpen ? "rotate-180" : "")}
                >
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="space-y-4 border-t border-gray-100 px-5 py-5">
                  {v.diagnosis && (
                    <div>
                      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Diagnosis</div>
                      <p className="text-sm font-semibold text-gray-900">{v.diagnosis}</p>
                    </div>
                  )}
                  <Section label="Chief Complaint" value={v.subjective} />
                  <Section label="Examination / Objective" value={v.objective} />
                  <Section label="Assessment" value={v.assessment} />
                  <Section label="Plan / Advice" value={v.plan} />
                  <Section label="Notes" value={v.notes} />

                  {/* Vitals */}
                  {v.vitals && (
                    <div>
                      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Vitals</div>
                      <div className="flex flex-wrap gap-2">
                        {v.vitals.bp_systolic && v.vitals.bp_diastolic && (
                          <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs">
                            <span className="font-bold text-gray-900">{v.vitals.bp_systolic}/{v.vitals.bp_diastolic}</span>
                            <span className="ml-1 text-gray-400">mmHg</span>
                          </span>
                        )}
                        {v.vitals.pulse_rate && (
                          <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs">
                            <span className="font-bold text-gray-900">{v.vitals.pulse_rate}</span>
                            <span className="ml-1 text-gray-400">/min</span>
                          </span>
                        )}
                        {v.vitals.temperature && (
                          <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs">
                            <span className="font-bold text-gray-900">{v.vitals.temperature}</span>
                            <span className="ml-1 text-gray-400">°F</span>
                          </span>
                        )}
                        {v.vitals.spo2 && (
                          <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs">
                            <span className="font-bold text-gray-900">{v.vitals.spo2}%</span>
                            <span className="ml-1 text-gray-400">SpO₂</span>
                          </span>
                        )}
                        {v.vitals.weight_kg && (
                          <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs">
                            <span className="font-bold text-gray-900">{v.vitals.weight_kg}</span>
                            <span className="ml-1 text-gray-400">kg</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Prescription mini-table */}
                  {rx.length > 0 && (
                    <div>
                      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Prescription ({rx.length})
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-gray-100">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50">
                              {["Drug", "Dose", "Freq.", "Duration"].map(function (h) {
                                return <th key={h} className="px-3 py-2 text-left font-semibold text-gray-400">{h}</th>;
                              })}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {rx.map(function (m: any, mi: number) {
                              return (
                                <tr key={mi}>
                                  <td className="px-3 py-2 font-semibold text-gray-900">
                                    {m.drug || m.drug_generic || "—"}
                                  </td>
                                  <td className="px-3 py-2 text-gray-600">{m.dose || m.strength || "—"}</td>
                                  <td className="px-3 py-2 text-gray-600">{m.frequency || "—"}</td>
                                  <td className="px-3 py-2 text-gray-600">{m.duration || "—"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {v.follow_up && (
                    <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                      Follow-up date: <strong>{fmtDate(v.follow_up, cc)}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
