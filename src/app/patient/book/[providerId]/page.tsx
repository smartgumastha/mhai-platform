"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { patientApi } from "../../providers/patient-auth-context";
import { useLocale } from "@/app/providers/locale-context";

type CC = "IN" | "AE" | "GB" | "US";

// ── Locale helpers ──────────────────────────────────────────
var TZ_BY_CC: Record<CC, string> = {
  IN: "Asia/Kolkata",
  AE: "Asia/Dubai",
  GB: "Europe/London",
  US: "America/New_York",
};

var CURRENCY_BY_CC: Record<CC, string> = { IN: "INR", AE: "AED", GB: "GBP", US: "USD" };
var SYMBOL_BY_CC:   Record<CC, string> = { IN: "₹",   AE: "AED ", GB: "£",  US: "$"   };

function fmtSlotTime(t: string, cc: CC): string {
  var [h, m] = t.split(":").map(Number);
  if (cc === "US") {
    var ap = h >= 12 ? "PM" : "AM";
    var h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return h12 + ":" + (m === 0 ? "00" : m) + " " + ap;
  }
  return t;
}

function fmtDate(dateStr: string, cc: CC): string {
  try {
    var locale = cc === "US" ? "en-US" : cc === "AE" ? "ar-AE" : "en-GB";
    return new Date(dateStr + "T12:00:00Z").toLocaleDateString(locale, {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
    });
  } catch { return dateStr; }
}

function fmtPrice(price: number | null, currency: string | null, cc: CC): string {
  if (!price) return "Free / Contact";
  var sym = SYMBOL_BY_CC[cc] || "₹";
  return sym + price.toLocaleString();
}

// ── Provider type icons ─────────────────────────────────────
var TYPE_ICONS: Record<string, string> = {
  clinic: "🏥", diagnostic: "⚗️", physiotherapy: "🦵", dietitian: "🥗",
  pharmacy: "💊", fitness: "💪", wellness: "🧘", dental: "🦷",
  optical: "👁️", mental_health: "🧠",
};

// ── Generate next-14-day selectable dates ──────────────────
function getNextDates(n: number): { dateStr: string; label: string; dayName: string; isSunday: boolean }[] {
  var dates = [];
  var today = new Date();
  for (var i = 0; i < n; i++) {
    var d = new Date(today);
    d.setDate(today.getDate() + i);
    var dateStr = d.toISOString().slice(0, 10);
    var dayName = d.toLocaleDateString("en-GB", { weekday: "short" });
    var dayNum  = d.toLocaleDateString("en-GB", { day: "numeric" });
    var mon     = d.toLocaleDateString("en-GB", { month: "short" });
    dates.push({ dateStr, label: dayNum + " " + mon, dayName, isSunday: d.getDay() === 0 });
  }
  return dates;
}

// ── Step indicator ──────────────────────────────────────────
function StepBar({ step }: { step: number }) {
  var steps = ["Date", "Time", "Details", "Confirm"];
  return (
    <div className="mb-6 flex items-center justify-center gap-0">
      {steps.map(function (s, i) {
        var done    = i + 1 < step;
        var active  = i + 1 === step;
        return (
          <div key={s} className="flex items-center">
            <div className={"flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors " +
              (done ? "bg-[#1ba3d6] text-white" : active ? "bg-[#0a2d3d] text-white" : "bg-gray-100 text-gray-400")}>
              {done ? "✓" : i + 1}
            </div>
            <span className={"ml-1.5 text-[11px] font-semibold " + (active ? "text-[#0a2d3d]" : "text-gray-400")}>
              {s}
            </span>
            {i < steps.length - 1 && <div className="mx-3 h-px w-8 bg-gray-200" />}
          </div>
        );
      })}
    </div>
  );
}

// ── Main booking page ───────────────────────────────────────
export default function BookingPage() {
  var params   = useParams();
  var router   = useRouter();
  var { localeV2 } = useLocale();
  var cc = (localeV2?.country_code || "IN") as CC;
  var tz = TZ_BY_CC[cc];

  var providerId = params.providerId as string;

  var [provider, setProvider] = useState<any>(null);
  var [services, setServices]  = useState<any[]>([]);
  var [loadingProv, setLoadingProv] = useState(true);

  // Booking state
  var [step, setStep]            = useState(1);
  var [selectedDate, setSelectedDate] = useState("");
  var [slots, setSlots]          = useState<string[]>([]);
  var [loadingSlots, setLoadingSlots] = useState(false);
  var [selectedSlot, setSelectedSlot] = useState("");
  var [serviceId, setServiceId]  = useState<string>("");
  var [serviceName, setServiceName] = useState("");
  var [servicePrice, setServicePrice] = useState<number | null>(null);
  var [mode, setMode]            = useState("in-person");
  var [reason, setReason]        = useState("");
  var [notes, setNotes]          = useState("");
  var [submitting, setSubmitting] = useState(false);
  var [error, setError]          = useState("");
  var [bookingId, setBookingId]  = useState("");

  var dates = getNextDates(14);

  // Load provider
  useEffect(function () {
    if (!providerId) return;
    patientApi<any>("/api/patient/providers/" + providerId).then(function (res) {
      if (res.success) { setProvider(res.provider); setServices(res.services || []); }
      setLoadingProv(false);
    });
  }, [providerId]);

  // Load slots when date changes
  useEffect(function () {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot("");
    patientApi<any>("/api/patient/providers/" + providerId + "/slots?date=" + selectedDate).then(function (res) {
      if (res.success) setSlots(res.slots || []);
      setLoadingSlots(false);
    });
  }, [selectedDate, providerId]);

  async function handleBook() {
    setSubmitting(true);
    setError("");
    try {
      var res: any = await patientApi("/api/patient/bookings", {
        method: "POST",
        body: JSON.stringify({
          provider_id: providerId,
          slot_date: selectedDate,
          slot_time: selectedSlot,
          slot_timezone: tz,
          consultation_mode: mode,
          service_id: serviceId || null,
          service_name: serviceName || null,
          reason: reason || null,
          notes: notes || null,
          duration_mins: 30,
        }),
      });
      if (res.success) { setBookingId(res.booking_id); setStep(5); }
      else setError(res.message || "Booking failed. Please try again.");
    } catch { setError("Network error. Please try again."); }
    finally { setSubmitting(false); }
  }

  if (loadingProv) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1ba3d6] border-t-transparent" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="px-6 py-12 text-center">
        <div className="text-4xl mb-3">🔍</div>
        <div className="text-gray-600 font-semibold">Provider not found</div>
        <button onClick={function () { router.push("/patient/providers"); }}
          className="mt-4 text-sm text-[#1ba3d6] hover:underline">← Back to directory</button>
      </div>
    );
  }

  // ── Step 5: Success ─────────────────────────────────────────
  if (step === 5) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="mb-4 flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-green-100">
            <span className="text-4xl">✓</span>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Booking Confirmed!</h2>
          <p className="mb-1 text-gray-600">Your appointment with</p>
          <p className="mb-4 text-lg font-bold text-[#0a2d3d]">{provider.name}</p>
          <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Date</span>
              <span className="font-semibold text-gray-800">{fmtDate(selectedDate, cc)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Time</span>
              <span className="font-semibold text-gray-800">{fmtSlotTime(selectedSlot, cc)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Mode</span>
              <span className="font-semibold text-gray-800 capitalize">{mode.replace("-", " ")}</span>
            </div>
            {serviceName && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Service</span>
                <span className="font-semibold text-gray-800">{serviceName}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Booking ID</span>
              <span className="font-mono text-xs text-gray-500">{bookingId.slice(-8)}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={function () { router.push("/patient/appointments"); }}
              className="flex-1 rounded-xl bg-[#1ba3d6] py-3 text-sm font-bold text-white hover:bg-[#0e7ba8]">
              View My Appointments
            </button>
            <button onClick={function () { router.push("/patient/providers"); }}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Browse More
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      {/* Back link */}
      <button onClick={function () { step > 1 ? setStep(step - 1) : router.back(); }}
        className="mb-5 flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
        ← {step > 1 ? "Back" : "Back to directory"}
      </button>

      {/* Provider banner */}
      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#1ba3d6]/10 text-2xl">
          {TYPE_ICONS[provider.provider_type] || "🏢"}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-bold text-gray-900">{provider.name}</span>
            {provider.is_mhai_partner && (
              <span className="rounded-full bg-[#1ba3d6]/10 px-2 py-0.5 text-[10px] font-bold text-[#1ba3d6]">MHAI Partner</span>
            )}
          </div>
          <div className="text-xs text-gray-400">{[provider.city, provider.country_code].filter(Boolean).join(" · ")}</div>
        </div>
      </div>

      <StepBar step={step} />

      {/* ── Step 1: Select date ─────────────────────────────── */}
      {step === 1 && (
        <div>
          <h2 className="mb-4 text-base font-bold text-gray-900">Select a date</h2>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {dates.map(function (d) {
              var isSelected = selectedDate === d.dateStr;
              return (
                <button
                  key={d.dateStr}
                  disabled={d.isSunday}
                  onClick={function () { setSelectedDate(d.dateStr); }}
                  className={"flex flex-col items-center rounded-xl border py-3 text-center transition-all " +
                    (d.isSunday
                      ? "border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed"
                      : isSelected
                        ? "border-[#1ba3d6] bg-[#1ba3d6] text-white shadow-md"
                        : "border-gray-100 bg-white hover:border-[#1ba3d6] hover:shadow-sm")}
                >
                  <span className={"text-[10px] font-semibold uppercase " + (isSelected ? "text-white/80" : "text-gray-400")}>
                    {d.dayName}
                  </span>
                  <span className={"text-base font-bold " + (isSelected ? "text-white" : "text-gray-800")}>
                    {d.label.split(" ")[0]}
                  </span>
                  <span className={"text-[10px] " + (isSelected ? "text-white/70" : "text-gray-400")}>
                    {d.label.split(" ")[1]}
                  </span>
                  {d.isSunday && <span className="mt-0.5 text-[9px] text-gray-400">Closed</span>}
                </button>
              );
            })}
          </div>
          <button
            disabled={!selectedDate}
            onClick={function () { setStep(2); }}
            className="mt-6 w-full rounded-xl bg-[#1ba3d6] py-3 text-sm font-bold text-white transition-colors hover:bg-[#0e7ba8] disabled:opacity-40"
          >
            Continue →
          </button>
        </div>
      )}

      {/* ── Step 2: Select time slot ────────────────────────── */}
      {step === 2 && (
        <div>
          <h2 className="mb-1 text-base font-bold text-gray-900">Select a time</h2>
          <p className="mb-4 text-xs text-gray-400">{fmtDate(selectedDate, cc)} · Timezone: {tz}</p>
          {loadingSlots ? (
            <div className="py-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#1ba3d6] border-t-transparent" />
              <p className="mt-2 text-xs text-gray-400">Loading available slots…</p>
            </div>
          ) : slots.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-dashed border-gray-200">
              <div className="text-4xl mb-2">📅</div>
              <div className="text-sm font-semibold text-gray-600">No slots available on this day</div>
              <button onClick={function () { setStep(1); setSelectedDate(""); }}
                className="mt-3 text-sm text-[#1ba3d6] hover:underline">Choose another date</button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
              {slots.map(function (slot) {
                var isSel = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    onClick={function () { setSelectedSlot(slot); }}
                    className={"rounded-xl border py-2.5 text-sm font-semibold transition-all " +
                      (isSel
                        ? "border-[#1ba3d6] bg-[#1ba3d6] text-white shadow-md"
                        : "border-gray-100 bg-white text-gray-700 hover:border-[#1ba3d6] hover:shadow-sm")}
                  >
                    {fmtSlotTime(slot, cc)}
                  </button>
                );
              })}
            </div>
          )}
          <button
            disabled={!selectedSlot}
            onClick={function () { setStep(3); }}
            className="mt-6 w-full rounded-xl bg-[#1ba3d6] py-3 text-sm font-bold text-white transition-colors hover:bg-[#0e7ba8] disabled:opacity-40"
          >
            Continue →
          </button>
        </div>
      )}

      {/* ── Step 3: Details ─────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-900">Appointment details</h2>

          {/* Service selector */}
          {services.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Service</label>
              <div className="space-y-2">
                <div
                  onClick={function () { setServiceId(""); setServiceName(""); setServicePrice(null); }}
                  className={"cursor-pointer rounded-xl border p-3 text-sm transition-all " +
                    (!serviceId ? "border-[#1ba3d6] bg-[#1ba3d6]/5" : "border-gray-100 hover:border-gray-200")}
                >
                  <span className="font-semibold text-gray-700">General Consultation</span>
                </div>
                {services.map(function (s) {
                  var isSel = serviceId === s.service_id;
                  return (
                    <div
                      key={s.service_id}
                      onClick={function () { setServiceId(s.service_id); setServiceName(s.name); setServicePrice(s.price); }}
                      className={"cursor-pointer rounded-xl border p-3 transition-all " +
                        (isSel ? "border-[#1ba3d6] bg-[#1ba3d6]/5" : "border-gray-100 hover:border-gray-200")}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-gray-800">{s.name}</div>
                          {s.description && <div className="text-xs text-gray-400">{s.description}</div>}
                          {s.duration_mins && <div className="text-xs text-gray-400">{s.duration_mins} min</div>}
                        </div>
                        {s.price && (
                          <div className="text-sm font-bold text-gray-700">{fmtPrice(s.price, s.currency, cc)}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Consultation mode */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Consultation Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "in-person", label: "In Person", icon: "🏥" },
                { value: "video",     label: "Video Call", icon: "📹" },
                { value: "home-visit", label: "Home Visit", icon: "🏠" },
              ].map(function (m) {
                return (
                  <button
                    key={m.value}
                    onClick={function () { setMode(m.value); }}
                    className={"rounded-xl border py-3 text-xs font-semibold transition-all " +
                      (mode === m.value ? "border-[#1ba3d6] bg-[#1ba3d6]/5 text-[#1ba3d6]" : "border-gray-100 text-gray-600 hover:border-gray-200")}
                  >
                    <div className="text-xl mb-1">{m.icon}</div>
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Reason for visit</label>
            <input
              type="text" value={reason} onChange={function (e) { setReason(e.target.value); }}
              placeholder="e.g. Follow-up, new complaint, test review…"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#1ba3d6] focus:outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Additional notes (optional)</label>
            <input
              type="text" value={notes} onChange={function (e) { setNotes(e.target.value); }}
              placeholder="Anything the provider should know beforehand"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#1ba3d6] focus:outline-none"
            />
          </div>

          <button onClick={function () { setStep(4); }}
            className="w-full rounded-xl bg-[#1ba3d6] py-3 text-sm font-bold text-white transition-colors hover:bg-[#0e7ba8]">
            Review Booking →
          </button>
        </div>
      )}

      {/* ── Step 4: Confirm ──────────────────────────────────── */}
      {step === 4 && (
        <div>
          <h2 className="mb-4 text-base font-bold text-gray-900">Confirm your booking</h2>
          <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-3 border-b border-gray-50 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1ba3d6]/10 text-xl">
                {TYPE_ICONS[provider.provider_type] || "🏢"}
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">{provider.name}</div>
                <div className="text-xs text-gray-400">{provider.city}</div>
              </div>
            </div>
            {[
              ["Date",     fmtDate(selectedDate, cc)],
              ["Time",     fmtSlotTime(selectedSlot, cc)],
              ["Mode",     mode.replace("-", " ")],
              ...(serviceName ? [["Service", serviceName]] : []),
              ...(servicePrice ? [["Price", fmtPrice(servicePrice, CURRENCY_BY_CC[cc], cc)]] : []),
              ...(reason ? [["Reason", reason]] : []),
            ].map(function ([label, value]) {
              return (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-400 capitalize">{label}</span>
                  <span className="font-semibold text-gray-800 text-right max-w-[60%]">{String(value)}</span>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>
          )}

          <button
            onClick={handleBook}
            disabled={submitting}
            className="w-full rounded-xl bg-[#0a2d3d] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#0e3d52] disabled:opacity-50"
          >
            {submitting ? "Confirming…" : "Confirm Booking"}
          </button>
          <p className="mt-3 text-center text-[11px] text-gray-300">
            Free cancellation up to 2 hours before your appointment
          </p>
        </div>
      )}
    </div>
  );
}
