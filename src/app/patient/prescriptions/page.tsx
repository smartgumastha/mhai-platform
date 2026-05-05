"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/app/providers/locale-context";
import { usePatientAuth, patientApi } from "../providers/patient-auth-context";

function fmtDate(d?: string, cc?: string) {
  if (!d) return "—";
  try {
    var locale = cc === "US" ? "en-US" : cc === "GB" ? "en-GB" : "en-IN";
    return new Date(d).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
  } catch { return d; }
}

var PRINT_CSS =
  "body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#111;margin:0;padding:20px;}" +
  "table{border-collapse:collapse;width:100%;}" +
  "th{background:#0a2d3d;color:#fff;text-align:left;font-size:10px;padding:5px 7px;}" +
  "td{font-size:11px;padding:4px 7px;vertical-align:top;border-bottom:1px solid #f0f0f0;}" +
  ".title{font-size:18px;font-weight:700;margin-bottom:4px;}" +
  ".meta{font-size:11px;color:#555;margin-bottom:6px;}" +
  ".diag{background:#eff6ff;border-left:3px solid #1ba3d6;padding:6px 10px;margin:8px 0;font-size:11px;}" +
  ".footer{margin-top:16px;font-size:9px;color:#999;border-top:1px solid #eee;padding-top:8px;}" +
  "@page{margin:12mm;size:A4 portrait;}";

function printRx(visit: any, patientName: string, uhid: string, cc: string) {
  var rx: any[] = visit.prescription || visit.medications || [];
  var rows = rx.map(function (m: any) {
    return "<tr><td><strong>" + (m.drug || m.drug_generic || "—") + "</strong>" +
      (m.drug_brand ? "<br><small style='color:#666'>" + m.drug_brand + "</small>" : "") + "</td>" +
      "<td>" + (m.dose || m.strength || "—") + "</td>" +
      "<td>" + (m.form || "—") + "</td>" +
      "<td>" + (m.frequency || "—") + "</td>" +
      "<td>" + (m.duration || "—") + "</td>" +
      "<td>" + (m.instructions || "—") + "</td></tr>";
  }).join("");
  var html =
    "<div class='title'>Prescription (℞)</div>" +
    "<div class='meta'>Patient: <strong>" + patientName + "</strong> &nbsp;|&nbsp; UHID: " + (uhid || "—") + " &nbsp;|&nbsp; Visit: " + fmtDate(visit.visit_date || visit.created_at, cc) + "</div>" +
    (visit.doctor_name ? "<div class='meta'>Doctor: " + visit.doctor_name + "</div>" : "") +
    (visit.diagnosis ? "<div class='diag'>Diagnosis: " + visit.diagnosis + "</div>" : "") +
    "<table><thead><tr><th>Drug</th><th>Dose</th><th>Form</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead><tbody>" + rows + "</tbody></table>" +
    (visit.follow_up ? "<p style='margin-top:12px;font-size:11px;color:#555'>Follow-up date: " + fmtDate(visit.follow_up, cc) + "</p>" : "") +
    "<div class='footer'>Generated from MHAI Health Bank · " + new Date().toLocaleDateString() + "</div>";
  var win = window.open("", "_blank", "width=860,height=950");
  if (!win) { alert("Allow pop-ups to print."); return; }
  win.document.write("<!DOCTYPE html><html><head><meta charset='utf-8'><title>Prescription</title><style>" + PRINT_CSS + "</style></head><body>" + html + "</body></html>");
  win.document.close();
  win.focus();
  var ref = win;
  setTimeout(function () { ref.print(); }, 600);
}

export default function PatientPrescriptionsPage() {
  var { patient } = usePatientAuth();
  var { localeV2 } = useLocale();
  var cc = localeV2?.country_code || "IN";

  var [visits, setVisits] = useState<any[]>([]);
  var [loading, setLoading] = useState(true);
  var [search, setSearch] = useState("");

  useEffect(function () {
    patientApi("/api/patient/visits")
      .then(function (d: any) { setVisits(d.visits || d.data || []); })
      .catch(function () {})
      .finally(function () { setLoading(false); });
  }, []);

  var withRx = visits
    .filter(function (v: any) { return (v.prescription || v.medications || []).length > 0; })
    .filter(function (v: any) {
      if (!search.trim()) return true;
      var q = search.toLowerCase();
      var rx: any[] = v.prescription || v.medications || [];
      return (
        fmtDate(v.visit_date || v.created_at, cc).toLowerCase().includes(q) ||
        (v.doctor_name || "").toLowerCase().includes(q) ||
        (v.diagnosis || "").toLowerCase().includes(q) ||
        rx.some(function (m) { return (m.drug || m.drug_generic || "").toLowerCase().includes(q); })
      );
    });

  return (
    <div className="px-8 py-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
          <p className="mt-0.5 text-sm text-gray-400">All medications prescribed during your consultations</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search by drug, date, or doctor…"
          value={search}
          onChange={function (e) { setSearch(e.target.value); }}
          className="w-full max-w-md rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-[#1ba3d6] focus:outline-none focus:ring-2 focus:ring-[#1ba3d6]/20"
        />
      </div>

      {loading ? (
        [1, 2, 3].map(function (i) {
          return <div key={i} className="mb-3 h-24 animate-pulse rounded-2xl bg-gray-100" />;
        })
      ) : withRx.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-20 text-center">
          <div className="mb-2 text-3xl font-bold text-gray-200">℞</div>
          <p className="text-sm font-medium text-gray-500">
            {search ? "No prescriptions match your search" : "No prescriptions yet"}
          </p>
          <p className="mt-1 text-xs text-gray-400">Prescriptions saved after each consultation will appear here</p>
        </div>
      ) : (
        withRx.map(function (v: any, idx: number) {
          var rx: any[] = v.prescription || v.medications || [];
          var vid = v.visit_record_id || v.id || String(idx);
          return (
            <div key={vid} className="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-5 py-3">
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    Visit — {fmtDate(v.visit_date || v.created_at, cc)}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    {v.doctor_name && <span>{v.doctor_name}</span>}
                    <span>{rx.length} medication{rx.length !== 1 ? "s" : ""}</span>
                    {v.diagnosis && (
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] text-blue-700">
                        {v.diagnosis.split(" ")[0]}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={function () { printRx(v, patient?.name || "", patient?.uhid || "", cc); }}
                  className="rounded-lg bg-[#1ba3d6] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#0e7ba8]"
                >
                  Print Rx
                </button>
              </div>

              {/* Rx table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Drug", "Brand", "Dose", "Form", "Frequency", "Duration", "Instructions"].map(function (h) {
                        return (
                          <th key={h} className="px-4 py-2 text-left font-semibold text-gray-400">
                            {h}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rx.map(function (m: any, mi: number) {
                      return (
                        <tr key={mi} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2 font-semibold text-gray-900">
                            {m.drug || m.drug_generic || "—"}
                          </td>
                          <td className="px-4 py-2 text-gray-500">{m.drug_brand || "—"}</td>
                          <td className="px-4 py-2 text-gray-600">{m.dose || m.strength || "—"}</td>
                          <td className="px-4 py-2 text-gray-600">{m.form || "—"}</td>
                          <td className="px-4 py-2 font-medium text-gray-700">{m.frequency || "—"}</td>
                          <td className="px-4 py-2 text-gray-600">{m.duration || "—"}</td>
                          <td className="px-4 py-2 text-gray-500">{m.instructions || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Follow-up */}
              {v.follow_up && (
                <div className="border-t border-blue-100 bg-blue-50/50 px-5 py-2 text-xs text-blue-700">
                  Follow-up: {fmtDate(v.follow_up, cc)}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
