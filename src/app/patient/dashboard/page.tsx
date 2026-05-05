"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/app/providers/locale-context";
import { usePatientAuth, patientApi } from "../providers/patient-auth-context";

function fmtDate(d?: string, cc?: string) {
  if (!d) return "—";
  try {
    var locale = cc === "US" ? "en-US" : cc === "GB" ? "en-GB" : "en-IN";
    return new Date(d).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
  } catch { return d; }
}

var QUICK = [
  { label: "Metrics",        href: "/patient/metrics",        icon: "📊", color: "border-cyan-200 bg-cyan-50",     text: "text-cyan-700",   desc: "BP, glucose, weight & more" },
  { label: "Documents",      href: "/patient/documents",      icon: "📂", color: "border-teal-200 bg-teal-50",     text: "text-teal-700",   desc: "Health folder & reports" },
  { label: "Prescriptions",  href: "/patient/prescriptions",  icon: "℞",  color: "border-green-200 bg-green-50",   text: "text-green-700",  desc: "Medications prescribed" },
  { label: "EHR Records",    href: "/patient/ehr",            icon: "≡",  color: "border-blue-200 bg-blue-50",     text: "text-blue-700",   desc: "Consultation notes" },
  { label: "Bills",          href: "/patient/bills",          icon: "₿",  color: "border-amber-200 bg-amber-50",   text: "text-amber-700",  desc: "Billing & payments" },
  { label: "Appointments",   href: "/patient/appointments",   icon: "⊙",  color: "border-purple-200 bg-purple-50",  text: "text-purple-700",  desc: "Book & track visits" },
  { label: "Find Providers", href: "/patient/providers",      icon: "🔍", color: "border-indigo-200 bg-indigo-50", text: "text-indigo-700",  desc: "Labs, physios, gyms & more" },
  { label: "AI Analysis",    href: "/patient/ai",             icon: "✦",  color: "border-rose-200 bg-rose-50",     text: "text-rose-700",    desc: "AI health insights" },
];

export default function PatientDashboardPage() {
  var { patient } = usePatientAuth();
  var { localeV2 } = useLocale();
  var cc = localeV2?.country_code || "IN";

  var [summary, setSummary] = useState<any>(null);

  useEffect(function () {
    patientApi("/api/patient/summary")
      .then(function (d: any) { if (d.success) setSummary(d.summary || d.data); })
      .catch(function () {});
  }, []);

  var allergies = patient?.allergies
    ? patient.allergies.split(",").map(function (a) { return a.trim(); }).filter(Boolean)
    : [];

  var firstName = patient?.name?.split(" ")[0] || "there";

  return (
    <div className="px-8 py-6">

      {/* Welcome header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Good day, {firstName}
        </h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {patient?.uhid && (
            <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-500">
              UHID: {patient.uhid}
            </span>
          )}
          {patient?.blood_group && (
            <span className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">
              {patient.blood_group}
            </span>
          )}
          {patient?.gender && (
            <span className="text-xs text-gray-400">{patient.gender}</span>
          )}
          {patient?.date_of_birth && (
            <span className="text-xs text-gray-400">
              DOB: {fmtDate(patient.date_of_birth, cc)}
            </span>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Visits",      value: summary?.total_visits ?? patient?.total_visits ?? "—",        border: "border-blue-100",   bg: "bg-blue-50/60" },
          { label: "Active Rx",         value: summary?.active_prescriptions ?? "—",                          border: "border-green-100",  bg: "bg-green-50/60" },
          { label: "Pending Bills",     value: summary?.pending_bills ?? "—",                                  border: "border-amber-100",  bg: "bg-amber-50/60" },
          { label: "Upcoming Appts",    value: summary?.upcoming_appointments ?? "—",                          border: "border-purple-100", bg: "bg-purple-50/60" },
        ].map(function (s) {
          return (
            <div key={s.label} className={"rounded-2xl border p-4 " + s.border + " " + s.bg}>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{s.label}</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">{String(s.value)}</div>
            </div>
          );
        })}
      </div>

      {/* Allergy alert */}
      {allergies.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <span className="mt-0.5 text-lg leading-none text-red-500">⚠</span>
          <div>
            <div className="text-sm font-bold text-red-700">Allergy Alert</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {allergies.map(function (a, i) {
                return (
                  <span key={i} className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    {a}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Last visit */}
      {patient?.last_visit_at && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
          <span className="text-xl">🏥</span>
          <div className="text-sm text-gray-600">
            Last visit: <strong className="text-gray-900">{fmtDate(patient.last_visit_at, cc)}</strong>
          </div>
          <Link href="/patient/ehr" className="ml-auto text-xs font-semibold text-[#1ba3d6] hover:underline">
            View records →
          </Link>
        </div>
      )}

      {/* Quick-access tiles */}
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Health Records</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {QUICK.map(function (item) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className={"group flex flex-col rounded-2xl border p-5 transition-all hover:shadow-sm " + item.color}
            >
              <span className={"mb-3 text-2xl font-bold " + item.text}>{item.icon}</span>
              <div className={"text-sm font-bold " + item.text}>{item.label}</div>
              <div className="mt-0.5 text-xs text-gray-500">{item.desc}</div>
            </Link>
          );
        })}
      </div>

    </div>
  );
}
