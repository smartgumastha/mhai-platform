"use client";

import { useState, useEffect, useRef } from "react";
import { useCurrency } from "@/app/hooks/useCurrency";
import { usePaymentGateway } from "@/app/hooks/usePaymentGateway";
import { useNotification } from "@/app/providers/NotificationProvider";
import { getOrCaptureAttribution } from "@/lib/attribution";

var BACKEND = "https://smartgumastha-backend-production.up.railway.app";

var SERVICES = [
  { id: "consultation", label: "Consultation", icon: "\u2695", color: "bg-emerald-50 text-emerald-600" },
  { id: "followup", label: "Follow-up", icon: "\u21BB", color: "bg-blue-50 text-blue-600" },
  { id: "procedure", label: "Procedure", icon: "\u2726", color: "bg-purple-50 text-purple-600" },
  { id: "therapy", label: "Therapy", icon: "\u2661", color: "bg-pink-50 text-pink-600" },
];

var TABS = [
  { id: "visit", label: "Visit Clinic" },
  { id: "teleconsult", label: "Teleconsult" },
  { id: "second-opinion", label: "Second Opinion" },
];

var TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30",
];

function formatTime(t: string) {
  var h = parseInt(t.split(":")[0]);
  var m = t.split(":")[1];
  var ampm = h >= 12 ? "PM" : "AM";
  var h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return h12 + ":" + m + " " + ampm;
}

function getNextDays(count: number) {
  var days = [];
  var now = new Date();
  for (var i = 0; i < count; i++) {
    var d = new Date(now);
    d.setDate(d.getDate() + i);
    var yyyy = d.getFullYear();
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var dd = String(d.getDate()).padStart(2, "0");
    var dayName = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en", { weekday: "short" });
    var dateNum = d.getDate();
    var monthStr = d.toLocaleDateString("en", { month: "short" });
    // Simulated slot counts
    var slots = Math.floor(Math.random() * 6) + 2;
    days.push({ date: yyyy + "-" + mm + "-" + dd, dayName: dayName, dateNum: dateNum, month: monthStr, slots: slots });
  }
  return days;
}

var SPECIALISTS = [
  { name: "Dr. Meera Sharma", specialty: "Sports Medicine", exp: "12 years", hospital: "Apollo Hospital", rating: 4.8, fee: 1200 },
  { name: "Dr. Rajiv Patel", specialty: "Orthopedic Surgery", exp: "15 years", hospital: "Fortis Healthcare", rating: 4.9, fee: 1500 },
  { name: "Dr. Anita Rao", specialty: "Neurology", exp: "10 years", hospital: "KIMS Hospital", rating: 4.7, fee: 1000 },
];

type Props = {
  hospitalId: string;
  clinicName?: string;
  clinicAddress?: string;
};

export default function BookingWidget({ hospitalId, clinicName, clinicAddress }: Props) {
  var currency = useCurrency();
  var payment = usePaymentGateway();
  var notify = useNotification();

  var [tab, setTab] = useState("visit");

  /* ── attribution capture (invisible; runs once on mount) ── */
  var attributionRef = useRef<ReturnType<typeof getOrCaptureAttribution>>(null);
  useEffect(function () {
    attributionRef.current = getOrCaptureAttribution();
  }, []);

  /* ── shared state ── */
  var [name, setName] = useState("");
  var [phone, setPhone] = useState("");
  var [service, setService] = useState("consultation");
  var [selectedDate, setSelectedDate] = useState("");
  var [selectedTime, setSelectedTime] = useState("");
  var [submitting, setSubmitting] = useState(false);
  var [booked, setBooked] = useState<any>(null);

  var days = getNextDays(5);
  var inputClass = "w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

  if (!selectedDate && days.length > 0) {
    selectedDate = days[0].date;
  }

  /* ── book appointment (public, no auth) ── */
  async function bookAppointment(source: string) {
    if (!name.trim()) { notify.warning("Missing field", "Patient name is required."); return; }
    if (!phone.trim()) { notify.warning("Missing field", "Phone number is required."); return; }
    if (!selectedDate) { notify.warning("Missing field", "Please select a date."); return; }
    if (!selectedTime) { notify.warning("Missing field", "Please select a time slot."); return; }

    setSubmitting(true);
    try {
      var res = await fetch(BACKEND + "/api/public/book-appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospital_id: hospitalId,
          patient_name: name.trim(),
          patient_phone: phone.trim(),
          slot_date: selectedDate,
          slot_time: selectedTime,
          service: SERVICES.find(function (s) { return s.id === service; })?.label || service,
          source: source,
          attribution: attributionRef.current || null,
        }),
      });
      var data = await res.json();
      if (data.success) {
        setBooked(data.appointment);
        notify.success("Booking confirmed", "Your appointment has been confirmed.");
      } else {
        notify.error("Booking failed", data.error || "Please try again.");
      }
    } catch {
      notify.error("Network error", "Could not connect to the server.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetBooking() {
    setBooked(null);
    setName("");
    setPhone("");
    setService("consultation");
    setSelectedDate(days[0]?.date || "");
    setSelectedTime("");
  }

  /* ── teleconsult with payment ── */
  function handleTeleconsultBook() {
    if (!name.trim()) { notify.warning("Missing field", "Patient name is required."); return; }
    if (!phone.trim()) { notify.warning("Missing field", "Phone number is required."); return; }
    if (!selectedDate) { notify.warning("Missing field", "Please select a date."); return; }
    if (!selectedTime) { notify.warning("Missing field", "Please select a time slot."); return; }

    payment.openCheckout({
      amount: 500,
      currency: currency.code,
      purpose: "Teleconsult - Video call",
      customerName: name.trim(),
      customerPhone: phone.trim(),
      onSuccess: function () {
        bookAppointment("phone");
      },
      onFailure: function (err) {
        if (err !== "Payment cancelled") notify.error("Payment failed", err);
      },
    });
  }

  /* ── second opinion with payment ── */
  function handleSecondOpinionBook(specialist: typeof SPECIALISTS[0]) {
    payment.openCheckout({
      amount: specialist.fee,
      currency: currency.code,
      purpose: "Second Opinion - " + specialist.name,
      customerName: name.trim() || undefined,
      customerPhone: phone.trim() || undefined,
      onSuccess: function () {
        notify.success("Booking confirmed", "Second opinion with " + specialist.name + " has been booked. You will receive a call within 24 hours.");
      },
      onFailure: function (err) {
        if (err !== "Payment cancelled") notify.error("Payment failed", err);
      },
    });
  }

  /* ═══════════════════════════════════════════
     BOOKING CONFIRMED
     ═══════════════════════════════════════════ */
  if (booked) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-md">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Booking confirmed</h3>
          <p className="mt-1 text-sm text-gray-500">
            {booked.patient_name} {"\u00B7"} {booked.slot_date} at {formatTime(booked.slot_time)}
          </p>
          {booked.service && <p className="mt-0.5 text-xs text-emerald-600">{booked.service}</p>}
          {clinicName && <p className="mt-2 text-xs text-gray-400">{clinicName}{clinicAddress ? " \u00B7 " + clinicAddress : ""}</p>}
        </div>
        <button
          onClick={resetBooking}
          className="mt-5 w-full cursor-pointer rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-emerald-500 hover:text-emerald-600"
        >
          Book another appointment
        </button>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     MAIN WIDGET
     ═══════════════════════════════════════════ */
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="text-[15px] font-semibold text-gray-900">Book appointment</div>
        {clinicName && <div className="text-[11px] text-gray-500">{clinicName}{clinicAddress ? " \u00B7 " + clinicAddress : ""}</div>}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {TABS.map(function (t) {
          return (
            <button
              key={t.id}
              onClick={function () { setTab(t.id); }}
              className={"flex-1 cursor-pointer py-2.5 text-center text-[12px] font-medium transition-all duration-200 " + (tab === t.id ? "border-b-2 border-emerald-500 text-emerald-600" : "text-gray-400 hover:text-gray-600")}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="p-5">

        {/* ═══════ TAB 1: Visit Clinic ═══════ */}
        {tab === "visit" && (
          <>
            {/* Service grid */}
            <div className="mb-4">
              <div className="mb-2 text-xs font-medium text-gray-500">Service</div>
              <div className="grid grid-cols-4 gap-2">
                {SERVICES.map(function (s) {
                  var active = service === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={function () { setService(s.id); }}
                      className={"cursor-pointer rounded-xl border p-2.5 text-center transition-all duration-200 " + (active ? "border-emerald-500 bg-emerald-50 shadow-sm" : "border-gray-100 hover:border-gray-200")}
                    >
                      <div className={"mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg text-sm " + s.color}>{s.icon}</div>
                      <div className={"text-[10px] font-medium " + (active ? "text-emerald-700" : "text-gray-700")}>{s.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date scroll */}
            <div className="mb-4">
              <div className="mb-2 text-xs font-medium text-gray-500">Date</div>
              <div className="flex gap-2 overflow-x-auto">
                {days.map(function (d) {
                  var active = selectedDate === d.date;
                  return (
                    <button
                      key={d.date}
                      onClick={function () { setSelectedDate(d.date); }}
                      className={"flex-shrink-0 cursor-pointer rounded-xl border px-4 py-2.5 text-center transition-all duration-200 " + (active ? "border-emerald-500 bg-emerald-50 shadow-sm" : "border-gray-100 hover:border-gray-200")}
                      style={{ minWidth: 72 }}
                    >
                      <div className={"text-[10px] " + (active ? "text-emerald-600" : "text-gray-400")}>{d.dayName}</div>
                      <div className={"text-[15px] font-semibold " + (active ? "text-emerald-700" : "text-gray-900")}>{d.dateNum}</div>
                      <div className={"text-[9px] " + (active ? "text-emerald-500" : "text-gray-400")}>{d.slots} slots</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time grid */}
            <div className="mb-4">
              <div className="mb-2 text-xs font-medium text-gray-500">Time</div>
              <div className="grid grid-cols-4 gap-1.5">
                {TIME_SLOTS.map(function (t) {
                  var active = selectedTime === t;
                  return (
                    <button
                      key={t}
                      onClick={function () { setSelectedTime(t); }}
                      className={"cursor-pointer rounded-lg border py-2 text-[11px] font-medium transition-all duration-200 " + (active ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm" : "border-gray-100 text-gray-600 hover:border-gray-200")}
                    >
                      {formatTime(t)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Patient fields */}
            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-500">Your name</label>
              <input className={inputClass} placeholder="Full name" value={name} onChange={function (e) { setName(e.target.value); }} />
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-xs text-gray-500">Phone number</label>
              <input className={inputClass} placeholder="Phone number" value={phone} onChange={function (e) { setPhone(e.target.value); }} />
            </div>

            {/* Confirm */}
            <button
              onClick={function () { bookAppointment("website"); }}
              disabled={submitting}
              className="w-full cursor-pointer rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Booking..." : "Confirm booking"}
            </button>
          </>
        )}

        {/* ═══════ TAB 2: Teleconsult ═══════ */}
        {tab === "teleconsult" && (
          <>
            {/* Info card */}
            <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <div className="mb-2 text-sm font-semibold text-blue-900">Video consultation</div>
              <div className="flex flex-wrap gap-3 text-[11px] text-blue-700">
                <span className="flex items-center gap-1"><span className="text-blue-500">{"\u25B6"}</span> 15-min video call</span>
                <span className="flex items-center gap-1"><span className="text-blue-500">{"\u270E"}</span> E-prescription</span>
                <span className="flex items-center gap-1"><span className="text-blue-500">{"\u2709"}</span> Chat follow-up</span>
              </div>
              <div className="mt-2 text-lg font-bold text-blue-900">{currency.format(500)}</div>
            </div>

            {/* Date scroll */}
            <div className="mb-4">
              <div className="mb-2 text-xs font-medium text-gray-500">Date</div>
              <div className="flex gap-2 overflow-x-auto">
                {days.map(function (d) {
                  var active = selectedDate === d.date;
                  return (
                    <button
                      key={d.date}
                      onClick={function () { setSelectedDate(d.date); }}
                      className={"flex-shrink-0 cursor-pointer rounded-xl border px-4 py-2.5 text-center transition-all duration-200 " + (active ? "border-blue-500 bg-blue-50 shadow-sm" : "border-gray-100 hover:border-gray-200")}
                      style={{ minWidth: 72 }}
                    >
                      <div className={"text-[10px] " + (active ? "text-blue-600" : "text-gray-400")}>{d.dayName}</div>
                      <div className={"text-[15px] font-semibold " + (active ? "text-blue-700" : "text-gray-900")}>{d.dateNum}</div>
                      <div className={"text-[9px] " + (active ? "text-blue-500" : "text-gray-400")}>{d.slots} slots</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time grid */}
            <div className="mb-4">
              <div className="mb-2 text-xs font-medium text-gray-500">Time</div>
              <div className="grid grid-cols-4 gap-1.5">
                {TIME_SLOTS.slice(0, 8).map(function (t) {
                  var active = selectedTime === t;
                  return (
                    <button
                      key={t}
                      onClick={function () { setSelectedTime(t); }}
                      className={"cursor-pointer rounded-lg border py-2 text-[11px] font-medium transition-all duration-200 " + (active ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm" : "border-gray-100 text-gray-600 hover:border-gray-200")}
                    >
                      {formatTime(t)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upload reports */}
            <div className="mb-4 rounded-xl border border-dashed border-gray-300 p-4 text-center">
              <div className="text-[11px] text-gray-500">Upload reports (optional)</div>
              <div className="mt-1 text-[10px] text-gray-400">PDF, JPG, PNG up to 10MB</div>
            </div>

            {/* Patient fields */}
            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-500">Your name</label>
              <input className={inputClass} placeholder="Full name" value={name} onChange={function (e) { setName(e.target.value); }} />
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-xs text-gray-500">Phone number</label>
              <input className={inputClass} placeholder="Phone number" value={phone} onChange={function (e) { setPhone(e.target.value); }} />
            </div>

            {/* Pay and book */}
            <button
              onClick={handleTeleconsultBook}
              className="w-full cursor-pointer rounded-xl bg-blue-600 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md"
            >
              Pay {currency.format(500)} and book
            </button>
          </>
        )}

        {/* ═══════ TAB 3: Second Opinion ═══════ */}
        {tab === "second-opinion" && (
          <>
            {/* Clara AI suggestion */}
            <div className="mb-4 rounded-xl border border-purple-100 bg-purple-50/50 p-4">
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-[8px] font-bold text-white">AI</div>
                <span className="text-[12px] font-semibold text-purple-900">Clara AI suggests</span>
              </div>
              <p className="text-[11px] leading-relaxed text-purple-800">
                Based on your case, a second opinion from a specialist could help confirm the diagnosis and explore alternative treatment options. All consultations include a detailed written report.
              </p>
            </div>

            {/* Specialist cards */}
            <div className="mb-4 space-y-2.5">
              {SPECIALISTS.map(function (sp) {
                return (
                  <div key={sp.name} className="rounded-xl border border-gray-100 p-4 transition-all duration-200 hover:border-gray-200 hover:shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-500 text-sm font-medium text-white shadow-sm">
                        {sp.name.split(" ").map(function (w) { return w[0]; }).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold text-gray-900">{sp.name}</div>
                        <div className="text-[11px] text-gray-500">{sp.specialty} {"\u00B7"} {sp.exp}</div>
                        <div className="text-[11px] text-gray-400">{sp.hospital}</div>
                        <div className="mt-1 flex items-center gap-3">
                          <span className="text-[10px] text-amber-500">{"\u2605"} {sp.rating}</span>
                          <span className="text-[12px] font-bold text-gray-900">{currency.format(sp.fee)}</span>
                        </div>
                      </div>
                      <button
                        onClick={function () { handleSecondOpinionBook(sp); }}
                        className="flex-shrink-0 cursor-pointer rounded-lg bg-purple-500 px-3 py-2 text-[10px] font-medium text-white shadow-sm transition-all duration-200 hover:bg-purple-600"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Upload reports */}
            <div className="mb-4 rounded-xl border border-dashed border-gray-300 p-4 text-center">
              <div className="text-[11px] text-gray-500">Upload reports for specialist review (optional)</div>
              <div className="mt-1 text-[10px] text-gray-400">PDF, JPG, PNG up to 10MB</div>
            </div>

            {/* Patient fields for context */}
            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-500">Your name</label>
              <input className={inputClass} placeholder="Full name" value={name} onChange={function (e) { setName(e.target.value); }} />
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-xs text-gray-500">Phone number</label>
              <input className={inputClass} placeholder="Phone number" value={phone} onChange={function (e) { setPhone(e.target.value); }} />
            </div>
          </>
        )}

      </div>
    </div>
  );
}
