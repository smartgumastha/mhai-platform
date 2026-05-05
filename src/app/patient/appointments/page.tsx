"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/app/providers/locale-context";
import { patientApi } from "../providers/patient-auth-context";

type CC = "IN" | "AE" | "GB" | "US";

function fmtDate(d: string | undefined, cc: CC): string {
  if (!d) return "—";
  try {
    var locale = cc === "US" ? "en-US" : cc === "GB" ? "en-GB" : "en-IN";
    return new Date(d).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
  } catch { return d; }
}

function fmtSlotTime(t: string | undefined, cc: CC): string {
  if (!t) return "";
  if (cc === "US") {
    var [h, m] = t.split(":").map(Number);
    var ap = h >= 12 ? "PM" : "AM";
    var h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return " · " + h12 + ":" + (m === 0 ? "00" : m) + " " + ap;
  }
  return " · " + t;
}

var STATUS_STYLE: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  confirmed: "bg-blue-100 text-blue-700",
  pending:   "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
  no_show:   "bg-gray-100 text-gray-500",
};

// ── Unified appointment card — works for both MHAI + HB bookings ──
function ApptCard({ appt, cc, onCancel }: { appt: any; cc: CC; onCancel?: () => void }) {
  var sc       = STATUS_STYLE[appt.status] || "bg-gray-100 text-gray-600";
  var isHB     = appt._source === "hb";
  var isActive = appt.status === "confirmed" || appt.status === "pending";

  return (
    <div className={"flex items-start justify-between rounded-2xl border bg-white px-5 py-4 shadow-sm " +
      (isHB ? "border-[#1ba3d6]/30" : "border-gray-100")}>
      <div className="flex items-start gap-4">
        <div className={"flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg font-bold " +
          (isHB ? "bg-[#1ba3d6]/10 text-[#1ba3d6]" : "bg-gray-50 text-gray-400")}>
          {isHB ? "🔍" : "⊙"}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-bold text-gray-900">
              {fmtDate(appt.slot_date, cc)}
              <span className="font-mono font-normal text-xs text-gray-400">
                {fmtSlotTime(appt.slot_time, cc)}
              </span>
            </div>
            {isHB && (
              <span className="rounded-full bg-[#1ba3d6]/10 px-2 py-0.5 text-[10px] font-bold text-[#1ba3d6]">
                Health Bank
              </span>
            )}
          </div>

          <div className="mt-0.5 text-xs text-gray-600 font-semibold">
            {appt.provider_name || appt.doctor_name || ""}
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-400">
            {(appt.appointment_type || appt.consultation_mode) && (
              <span>{appt.appointment_type || appt.consultation_mode}</span>
            )}
            {appt.reason && <span>· {appt.reason}</span>}
            {appt.service_name && <span>· {appt.service_name}</span>}
            {appt.provider_city && <span>· {appt.provider_city}</span>}
          </div>
        </div>
      </div>

      <div className="ml-4 flex flex-shrink-0 flex-col items-end gap-2">
        <span className={"rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize " + sc}>
          {appt.status}
        </span>
        {isHB && isActive && onCancel && (
          <button onClick={onCancel}
            className="text-[10px] text-red-400 hover:text-red-600 hover:underline">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default function PatientAppointmentsPage() {
  var { localeV2 } = useLocale();
  var cc = (localeV2?.country_code || "IN") as CC;

  var [mhaiAppts, setMhaiAppts]   = useState<any[]>([]);
  var [hbBookings, setHbBookings] = useState<any[]>([]);
  var [loading, setLoading]       = useState(true);

  async function load() {
    setLoading(true);
    try {
      var [mhaiRes, hbRes]: any[] = await Promise.all([
        patientApi("/api/patient/appointments"),
        patientApi("/api/patient/bookings"),
      ]);
      setMhaiAppts((mhaiRes.appointments || []).map(function (a: any) { return { ...a, _source: "mhai" }; }));
      setHbBookings((hbRes.bookings   || []).map(function (b: any) { return { ...b, _source: "hb" }; }));
    } catch {} finally { setLoading(false); }
  }

  useEffect(function () { load(); }, []);

  async function cancelBooking(bookingId: string) {
    if (!confirm("Cancel this appointment?")) return;
    try {
      var res: any = await patientApi("/api/patient/bookings/" + bookingId + "/cancel", { method: "PATCH" });
      if (res.success) load();
    } catch {}
  }

  // Merge + sort by slot_date desc
  var all = [...mhaiAppts, ...hbBookings].sort(function (a, b) {
    var da = a.slot_date || "0000";
    var db = b.slot_date || "0000";
    return db.localeCompare(da);
  });

  var upcoming = all.filter(function (a) { return a.status === "confirmed" || a.status === "pending"; });
  var past     = all.filter(function (a) { return a.status !== "confirmed" && a.status !== "pending"; });

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="mb-0.5 text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-400">Clinic visits and Health Bank bookings in one view</p>
        </div>
        <Link href="/patient/providers"
          className="flex items-center gap-1.5 rounded-xl bg-[#1ba3d6] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#0e7ba8]">
          + Book New
        </Link>
      </div>

      {/* Legend */}
      <div className="mb-4 flex items-center gap-4 text-[11px] text-gray-400">
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-gray-200" /> MHAI Clinic</div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#1ba3d6]/60" /> Health Bank</div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(function (i) { return <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />; })}
        </div>
      ) : all.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
          <div className="mb-3 text-5xl">📅</div>
          <div className="text-base font-semibold text-gray-600">No appointments yet</div>
          <div className="mx-auto mt-2 max-w-xs text-xs text-gray-400">
            Book with any clinic, lab, physio or specialist through the Health Bank provider directory
          </div>
          <Link href="/patient/providers"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1ba3d6] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0e7ba8]">
            Browse Providers →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#1ba3d6]">
                Upcoming · {upcoming.length}
              </div>
              <div className="space-y-2">
                {upcoming.map(function (a: any) {
                  return (
                    <ApptCard
                      key={a.id || a.booking_id}
                      appt={a}
                      cc={cc}
                      onCancel={a._source === "hb" ? function () { cancelBooking(a.booking_id); } : undefined}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Past · {past.length}
              </div>
              <div className="space-y-2">
                {past.map(function (a: any) {
                  return <ApptCard key={a.id || a.booking_id} appt={a} cc={cc} />;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
