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

var STATUS_STYLE: Record<string, string> = {
  completed:  "bg-green-100 text-green-700",
  confirmed:  "bg-blue-100 text-blue-700",
  pending:    "bg-amber-100 text-amber-700",
  cancelled:  "bg-red-100 text-red-700",
  no_show:    "bg-gray-100 text-gray-500",
};

function ApptCard({ appt, cc }: { appt: any; cc: string }) {
  var sc = STATUS_STYLE[appt.status] || "bg-gray-100 text-gray-600";
  return (
    <div className="flex items-start justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#1ba3d6]/10 text-[#1ba3d6] text-lg font-bold">
          ⊙
        </div>
        <div>
          <div className="text-sm font-bold text-gray-900">
            {fmtDate(appt.slot_date, cc)}
            {appt.slot_time && <span className="ml-2 font-mono text-xs text-gray-400">{appt.slot_time}</span>}
          </div>
          <div className="mt-0.5 text-xs text-gray-500">
            {appt.appointment_type || "Consultation"}
            {appt.consultation_mode && <span className="ml-1.5">· {appt.consultation_mode}</span>}
            {appt.reason && <span className="ml-1.5">· {appt.reason}</span>}
          </div>
          {appt.doctor_name && (
            <div className="mt-1 text-xs text-gray-400">{appt.doctor_name}</div>
          )}
          {appt.notes && (
            <div className="mt-1 max-w-sm text-xs italic text-gray-400">{appt.notes}</div>
          )}
        </div>
      </div>
      <span className={"ml-4 flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize " + sc}>
        {appt.status}
      </span>
    </div>
  );
}

export default function PatientAppointmentsPage() {
  var { localeV2 } = useLocale();
  var cc = localeV2?.country_code || "IN";

  var [appts, setAppts] = useState<any[]>([]);
  var [loading, setLoading] = useState(true);

  useEffect(function () {
    patientApi("/api/patient/appointments")
      .then(function (d: any) { setAppts(d.appointments || d.data || []); })
      .catch(function () {})
      .finally(function () { setLoading(false); });
  }, []);

  var upcoming = appts.filter(function (a) { return a.status === "confirmed" || a.status === "pending"; });
  var past     = appts.filter(function (a) { return a.status !== "confirmed" && a.status !== "pending"; });

  return (
    <div className="px-8 py-6">
      <h1 className="mb-0.5 text-2xl font-bold text-gray-900">Appointments</h1>
      <p className="mb-6 text-sm text-gray-400">Your visit history and upcoming bookings</p>

      {loading ? (
        [1, 2, 3].map(function (i) {
          return <div key={i} className="mb-3 h-16 animate-pulse rounded-2xl bg-gray-100" />;
        })
      ) : appts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-20 text-center">
          <div className="mb-2 text-3xl font-bold text-gray-200">⊙</div>
          <p className="text-sm font-medium text-gray-500">No appointments yet</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="mb-6">
              <div className="mb-3 text-xs font-bold uppercase tracking-wider text-[#1ba3d6]">
                Upcoming ({upcoming.length})
              </div>
              <div className="space-y-2">
                {upcoming.map(function (a: any) {
                  return <ApptCard key={a.id} appt={a} cc={cc} />;
                })}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <div className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                Past ({past.length})
              </div>
              <div className="space-y-2">
                {past.map(function (a: any) {
                  return <ApptCard key={a.id} appt={a} cc={cc} />;
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
