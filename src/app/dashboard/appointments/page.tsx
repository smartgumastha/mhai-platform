"use client";

import { useState, useEffect } from "react";
import { getAppointments, createAppointment, updateAppointment } from "@/lib/api";
import type { MhaiAppointment, AppointmentStatus } from "@/lib/types/MhaiAppointment";
import { useNotification } from "@/app/providers/NotificationProvider";

var STATUS_BADGES: Record<string, { label: string; cls: string }> = {
  confirmed: { label: "Confirmed", cls: "bg-blue-50 text-blue-600" },
  completed: { label: "Completed", cls: "bg-emerald-50 text-emerald-600" },
  cancelled: { label: "Cancelled", cls: "bg-red-50 text-red-600" },
  no_show: { label: "No-show", cls: "bg-amber-50 text-amber-600" },
  pending: { label: "Pending", cls: "bg-gray-100 text-gray-600" },
};

var FILTER_TABS = [
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "all", label: "All" },
];

// ARetrofit-1 Step 5c-frontend: use canonical MhaiAppointment type
type Appointment = MhaiAppointment;

export default function AppointmentsPage() {
  var notify = useNotification();
  var [appointments, setAppointments] = useState<Appointment[]>([]);
  var [loading, setLoading] = useState(true);
  var [filter, setFilter] = useState("today");

  /* create modal state */
  var [showCreate, setShowCreate] = useState(false);
  var [newName, setNewName] = useState("");
  var [newPhone, setNewPhone] = useState("");
  var [newDate, setNewDate] = useState("");
  var [newTime, setNewTime] = useState("09:00");
  var [newNotes, setNewNotes] = useState("");
  var [creating, setCreating] = useState(false);

  var [updatingId, setUpdatingId] = useState<string | null>(null);

  function fetchAppointments(f: string) {
    setLoading(true);
    getAppointments(f)
      .then((res) => {
        if (res.success && res.appointments) {
          setAppointments(res.appointments);
        } else {
          setAppointments([]);
        }
      })
      .catch(() => { setAppointments([]); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchAppointments(filter); }, [filter]);

  /* ── filter client-side as fallback ── */
  function getFiltered(): Appointment[] {
    var today = new Date().toISOString().slice(0, 10);
    if (filter === "today") return appointments.filter((a) => a.slot_date === today);
    if (filter === "upcoming") return appointments.filter((a) => a.slot_date >= today);
    return appointments;
  }

  var filtered = getFiltered();

  /* ── create ── */
  async function handleCreate() {
    if (!newName.trim() || !newPhone.trim() || !newDate) {
      notify.warning("Missing fields", "Please fill in patient name, phone, and date.");
      return;
    }
    setCreating(true);
    try {
      var res = await createAppointment({
        patient_name: newName.trim(),
        patient_phone: newPhone.trim(),
        slot_date: newDate,
        slot_time: newTime,
        source: "manual",
        notes: newNotes.trim() || undefined,
      });
      if (res.success) {
        notify.success("Appointment created", newName.trim() + " on " + newDate + " at " + newTime);
        setShowCreate(false);
        setNewName("");
        setNewPhone("");
        setNewDate("");
        setNewTime("09:00");
        setNewNotes("");
        fetchAppointments(filter);
      } else {
        notify.error("Failed", res.error || res.message || "Could not create appointment.");
      }
    } catch {
      notify.error("Network error", "Please try again.");
    } finally {
      setCreating(false);
    }
  }

  /* ── update status ── */
  async function handleStatusChange(id: string, newStatus: AppointmentStatus) {
    setUpdatingId(id);
    try {
      var res = await updateAppointment(id, { status: newStatus });
      if (res.success) {
        notify.success("Updated", "Appointment marked as " + newStatus + ".");
        setAppointments((prev) =>
          prev.map((a) => a.id === id ? { ...a, status: newStatus } : a)
        );
      } else {
        notify.error("Failed", res.error || res.message || "Could not update.");
      }
    } catch {
      notify.error("Network error", "Please try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  var inputClass =
    "w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

  return (
    <div className="px-8 py-6">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Appointments</h1>
          <p className="mt-1 text-sm text-gray-500">Manage bookings from your website, walk-ins, and manual entries</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setNewDate(new Date().toISOString().slice(0, 10)); }}
          className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-medium text-white shadow-md transition-all duration-200 hover:bg-emerald-600"
        >
          + Add appointment
        </button>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-0 border-b border-gray-100">
        {FILTER_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`cursor-pointer pb-2 pr-5 text-sm transition-all duration-200 ${
              filter === t.id
                ? "border-b-2 border-emerald-500 font-medium text-gray-900"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="ml-auto pb-2 text-[11px] text-gray-400">{filtered.length} appointment{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="text-sm text-gray-400">Loading appointments...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-center">
          <div className="mb-2 text-sm font-medium text-gray-700">No appointments yet</div>
          <p className="mb-3 max-w-sm text-xs text-gray-500">
            Appointments will appear here when patients book through your website or when you add them manually.
          </p>
          <button
            onClick={() => { setShowCreate(true); setNewDate(new Date().toISOString().slice(0, 10)); }}
            className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600"
          >
            + Add first appointment
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Date</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Time</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Patient</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Phone</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((appt) => {
                var badge = STATUS_BADGES[appt.status] || STATUS_BADGES.pending;
                var isUpdating = updatingId === appt.id;
                return (
                  <tr key={appt.id} className="border-b border-gray-50 transition-colors hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-[13px] text-gray-900">{appt.slot_date}</td>
                    <td className="px-4 py-3 text-[13px] text-gray-700">{appt.slot_time}</td>
                    <td className="px-4 py-3">
                      <div className="text-[13px] font-medium text-gray-900">{appt.patient_name}</div>
                      {appt.source && <div className="text-[10px] text-gray-400">{appt.source}</div>}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-600">{appt.patient_phone}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {appt.status !== "completed" && (
                          <button
                            onClick={() => handleStatusChange(appt.id, "completed")}
                            disabled={isUpdating}
                            className="cursor-pointer rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10px] font-medium text-emerald-600 transition-all duration-200 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isUpdating ? "..." : "Done"}
                          </button>
                        )}
                        {appt.status !== "cancelled" && appt.status !== "completed" && (
                          <button
                            onClick={() => handleStatusChange(appt.id, "no_show")}
                            disabled={isUpdating}
                            className="cursor-pointer rounded-lg bg-amber-50 px-2.5 py-1.5 text-[10px] font-medium text-amber-600 transition-all duration-200 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            No-show
                          </button>
                        )}
                        {appt.status !== "cancelled" && appt.status !== "completed" && (
                          <button
                            onClick={() => handleStatusChange(appt.id, "cancelled")}
                            disabled={isUpdating}
                            className="cursor-pointer rounded-lg bg-red-50 px-2.5 py-1.5 text-[10px] font-medium text-red-600 transition-all duration-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Add appointment</h2>
              <button onClick={() => setShowCreate(false)} className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600">&times;</button>
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-500">Patient name</label>
              <input className={inputClass} placeholder="Full name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-500">Phone number</label>
              <input className={inputClass} placeholder="+91 98765 43210" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
            </div>

            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Date</label>
                <input type="date" className={inputClass} value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Time</label>
                <input type="time" className={inputClass} value={newTime} onChange={(e) => setNewTime(e.target.value)} />
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-xs text-gray-500">Notes (optional)</label>
              <textarea className={inputClass + " resize-none"} rows={2} placeholder="Any special notes..." value={newNotes} onChange={(e) => setNewNotes(e.target.value)} />
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs text-gray-700 transition-all duration-200 hover:border-gray-400">Cancel</button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? "Creating..." : "Add appointment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
