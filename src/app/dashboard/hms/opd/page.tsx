"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/providers/auth-context";
import { useNotification } from "@/app/providers/NotificationProvider";
import { getTokens, createToken, updateTokenStatus, saveVitals, getPatients, getStaff } from "@/lib/api";

type Token = {
  token_id: string;
  token_number: string;
  token_type: string;
  visit_type: string;
  status: string;
  priority: number;
  chief_complaint?: string;
  registered_at: number;
  triaged_at?: number;
  called_at?: number;
  consultation_start_at?: number;
  consultation_end_at?: number;
  wait_minutes?: number;
  patient_id: string;
  first_name?: string;
  last_name?: string;
  uhid?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  blood_group?: string;
  doctor_id: string;
  doctor_first_name?: string;
  doctor_last_name?: string;
  bp_systolic?: number;
  bp_diastolic?: number;
  pulse_rate?: number;
  temperature?: number;
  spo2?: number;
  weight_kg?: number;
  vitals_at?: number;
  vitals_id?: string;
};

var STATUS_LABELS: Record<string, string> = {
  registered: "Registered",
  triaged: "Triaged",
  called: "Called",
  consulting: "Consulting",
  completed: "Completed",
  no_show: "No-show",
  exited: "Exited",
  cancelled: "Cancelled",
};

var STATUS_COLORS: Record<string, string> = {
  registered: "bg-blue-100 text-blue-700",
  triaged: "bg-purple-100 text-purple-700",
  called: "bg-amber-100 text-amber-700",
  consulting: "bg-orange-100 text-orange-700",
  completed: "bg-emerald-100 text-emerald-700",
  no_show: "bg-gray-100 text-gray-500",
  exited: "bg-gray-100 text-gray-500",
  cancelled: "bg-rose-100 text-rose-600",
};

var emptyVitals = {
  bp_systolic: "", bp_diastolic: "", pulse_rate: "", temperature: "",
  spo2: "", weight_kg: "", height_cm: "", chief_complaint: "", nurse_notes: "",
};

var emptyWalkin = { phone: "", name: "", doctor_id: "", chief_complaint: "" };

export default function OpdQueuePage() {
  var router = useRouter();
  var { user } = useAuth();
  var notify = useNotification();
  var hospitalId = user?.hospital_id || "";

  var today = new Date().toISOString().slice(0, 10);
  var [date, setDate] = useState(today);
  var [tokens, setTokens] = useState<Token[]>([]);
  var [loading, setLoading] = useState(true);
  var [filterStatus, setFilterStatus] = useState("active");

  // Walk-in registration
  var [showWalkin, setShowWalkin] = useState(false);
  var [walkin, setWalkin] = useState({ ...emptyWalkin });
  var [patientResults, setPatientResults] = useState<any[]>([]);
  var [selectedPatient, setSelectedPatient] = useState<any>(null);
  var [doctors, setDoctors] = useState<any[]>([]);
  var [searchLoading, setSearchLoading] = useState(false);
  var [registering, setRegistering] = useState(false);

  // Vitals modal
  var [vitalsToken, setVitalsToken] = useState<Token | null>(null);
  var [vitalsForm, setVitalsForm] = useState({ ...emptyVitals });
  var [savingVitals, setSavingVitals] = useState(false);

  // Status update loading
  var [updatingId, setUpdatingId] = useState<string | null>(null);

  var searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  var loadQueue = useCallback(function () {
    if (!hospitalId) return;
    getTokens(hospitalId, { date })
      .then(function (r) {
        if (r.success && r.data) setTokens(r.data.tokens);
        else setTokens([]);
      })
      .catch(function () { setTokens([]); })
      .finally(function () { setLoading(false); });
  }, [hospitalId, date]);

  useEffect(function () {
    setLoading(true);
    loadQueue();
  }, [loadQueue]);

  // Auto-refresh every 30s
  useEffect(function () {
    var iv = setInterval(loadQueue, 30000);
    return function () { clearInterval(iv); };
  }, [loadQueue]);

  // Load doctors — called on mount and each time the walk-in modal opens.
  // Backend already excludes role_master_id 1 (superadmin) and 2 (hospital admin),
  // so everything returned is valid assignable clinical staff.
  var loadDoctors = useCallback(function () {
    if (!hospitalId) return;
    getStaff(hospitalId).then(function (r) {
      if (r.success && Array.isArray(r.data) && r.data.length > 0) {
        setDoctors(r.data);
      } else if (r.success && r.data) {
        setDoctors(r.data);
      }
    }).catch(function () {});
  }, [hospitalId]);

  useEffect(function () { loadDoctors(); }, [loadDoctors]);

  function handlePhoneSearch(val: string) {
    setWalkin(function (p) { return { ...p, phone: val }; });
    setSelectedPatient(null);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (val.length < 5) { setPatientResults([]); return; }
    searchDebounce.current = setTimeout(function () {
      setSearchLoading(true);
      getPatients(hospitalId, { q: val, limit: 5 })
        .then(function (r) { setPatientResults(r.patients || []); })
        .catch(function () {})
        .finally(function () { setSearchLoading(false); });
    }, 350);
  }

  async function handleRegisterWalkin() {
    if (!selectedPatient) {
      notify.warning("Select patient", "Search and select a patient before registering.");
      return;
    }
    if (!walkin.doctor_id) {
      notify.warning("Select doctor", "Assign a doctor for this token.");
      return;
    }
    setRegistering(true);
    try {
      var r = await createToken(hospitalId, {
        patient_id: selectedPatient.id,
        doctor_id: walkin.doctor_id,
        token_type: "walkin",
        visit_type: "new",
        chief_complaint: walkin.chief_complaint || undefined,
      });
      if (r.success) {
        notify.success("Token created", (r.data?.token?.token_number || "") + " — " + (selectedPatient.name || "Patient") + " registered.");
        setShowWalkin(false);
        setWalkin({ ...emptyWalkin });
        setSelectedPatient(null);
        setPatientResults([]);
        loadQueue();
      } else {
        notify.error("Failed", r.message || r.error || "Could not create token.");
      }
    } catch {
      notify.error("Error", "Network error. Try again.");
    } finally {
      setRegistering(false);
    }
  }

  async function handleStatusChange(token: Token, newStatus: string) {
    setUpdatingId(token.token_id);
    try {
      var r = await updateTokenStatus(hospitalId, token.token_id, newStatus);
      if (r.success) {
        setTokens(function (prev) {
          return prev.map(function (t) {
            return t.token_id === token.token_id ? { ...t, status: newStatus } : t;
          });
        });
        notify.success("Updated", token.token_number + " → " + STATUS_LABELS[newStatus]);
      } else {
        notify.error("Failed", r.message || r.error || "Could not update status.");
      }
    } catch {
      notify.error("Error", "Network error. Try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleSaveVitals() {
    if (!vitalsToken) return;
    if (!vitalsForm.bp_systolic && !vitalsForm.pulse_rate && !vitalsForm.temperature && !vitalsForm.spo2) {
      notify.warning("Empty vitals", "Enter at least one vital sign before saving.");
      return;
    }
    setSavingVitals(true);
    try {
      var payload: any = {
        token_id: vitalsToken.token_id,
        patient_id: vitalsToken.patient_id,
        chief_complaint: vitalsForm.chief_complaint || undefined,
        nurse_notes: vitalsForm.nurse_notes || undefined,
      };
      if (vitalsForm.bp_systolic) payload.bp_systolic = Number(vitalsForm.bp_systolic);
      if (vitalsForm.bp_diastolic) payload.bp_diastolic = Number(vitalsForm.bp_diastolic);
      if (vitalsForm.pulse_rate) payload.pulse_rate = Number(vitalsForm.pulse_rate);
      if (vitalsForm.temperature) payload.temperature = Number(vitalsForm.temperature);
      if (vitalsForm.spo2) payload.spo2 = Number(vitalsForm.spo2);
      if (vitalsForm.weight_kg) payload.weight_kg = Number(vitalsForm.weight_kg);
      if (vitalsForm.height_cm) payload.height_cm = Number(vitalsForm.height_cm);

      var r = await saveVitals(hospitalId, payload);
      if (r.success) {
        notify.success("Vitals saved", vitalsToken.token_number + " — status updated to triaged.");
        setVitalsToken(null);
        setVitalsForm({ ...emptyVitals });
        loadQueue();
      } else {
        notify.error("Failed", r.message || r.error || "Could not save vitals.");
      }
    } catch {
      notify.error("Error", "Network error. Try again.");
    } finally {
      setSavingVitals(false);
    }
  }

  var activeStatuses = ["registered", "triaged", "called", "consulting"];
  var closedStatuses = ["completed", "exited", "no_show", "cancelled"];
  var displayed = filterStatus === "active"
    ? tokens.filter(function (t) { return activeStatuses.includes(t.status); })
    : filterStatus === "completed"
    ? tokens.filter(function (t) { return closedStatuses.includes(t.status); })
    : tokens;

  function waitMins(token: Token) {
    if (token.wait_minutes != null) return token.wait_minutes + "m";
    if (!token.registered_at) return "—";
    var end = token.consultation_start_at || Date.now();
    return Math.round((end - token.registered_at) / 60000) + "m";
  }

  return (
    <div className="px-9 py-8">
      {/* Breadcrumb */}
      <nav className="mb-1 flex items-center gap-1.5 text-xs text-text-muted">
        <Link href="/dashboard/hms" className="hover:text-coral">HMS</Link>
        <span>/</span>
        <span className="text-ink">OPD Queue</span>
      </nav>

      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="font-fraunces text-2xl font-light text-ink">
            OPD <em className="italic text-coral-deep">Queue</em>
          </div>
          <p className="mt-0.5 text-sm text-text-dim">Today&apos;s patient flow — register, triage, call, consult.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={function (e) { setDate(e.target.value); }}
            className="rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none"
          />
          <button
            onClick={function () { loadDoctors(); setShowWalkin(true); }}
            className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-deep"
          >
            + Walk-in
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-5 flex flex-wrap gap-3">
        {[
          { label: "Total", count: tokens.length, cls: "text-ink" },
          { label: "Waiting", count: tokens.filter(function (t) { return t.status === "registered" || t.status === "triaged"; }).length, cls: "text-blue-600" },
          { label: "Called", count: tokens.filter(function (t) { return t.status === "called"; }).length, cls: "text-amber-600" },
          { label: "Consulting", count: tokens.filter(function (t) { return t.status === "consulting"; }).length, cls: "text-orange-600" },
          { label: "Done", count: tokens.filter(function (t) { return t.status === "completed"; }).length, cls: "text-emerald-600" },
        ].map(function (s) {
          return (
            <div key={s.label} className="rounded-xl border border-line bg-white px-4 py-2.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{s.label}</div>
              <div className={"font-fraunces text-xl font-light " + s.cls}>{s.count}</div>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-1 rounded-xl border border-line bg-white p-1 w-fit">
        {(["active", "completed", "all"] as const).map(function (f) {
          return (
            <button
              key={f}
              onClick={function () { setFilterStatus(f); }}
              className={"rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-all " + (filterStatus === f ? "bg-coral text-white" : "text-text-dim hover:bg-paper-soft")}
            >
              {f === "active" ? "Active" : f === "completed" ? "Closed" : "All"}
            </button>
          );
        })}
      </div>

      {/* Queue table */}
      <div className="rounded-2xl border border-line bg-white">
        {loading ? (
          <div className="divide-y divide-line-soft">
            {[1, 2, 3, 4, 5].map(function (i) {
              return (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="h-8 w-12 animate-pulse rounded bg-line" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-line" />
                    <div className="h-3 w-24 animate-pulse rounded bg-line" />
                  </div>
                  <div className="h-6 w-20 animate-pulse rounded-full bg-line" />
                  <div className="h-8 w-28 animate-pulse rounded-lg bg-line" />
                </div>
              );
            })}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-dim">
            <div className="mb-2 text-3xl">🏥</div>
            <div className="text-sm font-medium">
              {filterStatus === "active" ? "No active patients in queue" : "No patients found for this date"}
            </div>
            <div className="mt-1 text-xs">Click &quot;+ Walk-in&quot; to register a patient.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line-soft text-left">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Token</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Patient</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Doctor</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Vitals</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Status</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Wait</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {displayed.map(function (token) {
                  var patientName = ((token.first_name || "") + " " + (token.last_name || "")).trim() || "Unknown";
                  var doctorName = ((token.doctor_first_name || "") + " " + (token.doctor_last_name || "")).trim() || "—";
                  var hasVitals = !!token.vitals_id;
                  var isUpdating = updatingId === token.token_id;
                  return (
                    <tr key={token.token_id} className="hover:bg-paper-soft/50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-bold text-ink">{token.token_number}</span>
                        {token.priority > 0 && (
                          <span className="ml-1 rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-600">PRIORITY</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink">{patientName}</div>
                        <div className="font-mono text-[11px] text-text-dim">{token.phone || token.uhid || "—"}</div>
                        {token.chief_complaint && (
                          <div className="mt-0.5 max-w-[180px] truncate text-[11px] italic text-text-muted">{token.chief_complaint}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-dim">Dr. {doctorName}</td>
                      <td className="px-4 py-3">
                        {hasVitals ? (
                          <div className="text-[11px] text-text-dim">
                            {token.bp_systolic ? token.bp_systolic + "/" + token.bp_diastolic + " " : ""}
                            {token.pulse_rate ? token.pulse_rate + " bpm " : ""}
                            {token.spo2 ? token.spo2 + "% " : ""}
                            {token.temperature ? token.temperature + "°" : ""}
                          </div>
                        ) : (
                          <button
                            onClick={function () { setVitalsToken(token); setVitalsForm({ ...emptyVitals, chief_complaint: token.chief_complaint || "" }); }}
                            className="rounded-md border border-purple-200 bg-purple-50 px-2 py-1 text-[11px] font-medium text-purple-700 hover:bg-purple-100"
                          >
                            Take vitals
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={"rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize " + (STATUS_COLORS[token.status] || "bg-gray-100 text-gray-600")}>
                          {STATUS_LABELS[token.status] || token.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-dim">{waitMins(token)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">

                          {/* registered / triaged → Call */}
                          {(token.status === "registered" || token.status === "triaged") && (
                            <button
                              onClick={function () { handleStatusChange(token, "called"); }}
                              disabled={isUpdating}
                              title={token.status === "registered" && !hasVitals ? "Vitals not taken yet" : undefined}
                              className={"rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-white disabled:opacity-40 " + (token.status === "registered" && !hasVitals ? "bg-amber-400 hover:bg-amber-500" : "bg-amber-500 hover:bg-amber-600")}
                            >
                              {token.status === "registered" && !hasVitals ? "Call ⚠" : "Call"}
                            </button>
                          )}

                          {/* called → Consult (auto-advances to consulting + opens console) */}
                          {token.status === "called" && (
                            <button
                              onClick={async function () {
                                await handleStatusChange(token, "consulting");
                                router.push("/dashboard/hms/opd/" + token.token_id);
                              }}
                              disabled={isUpdating}
                              className="rounded-md bg-coral px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-coral-deep disabled:opacity-40"
                            >
                              Consult →
                            </button>
                          )}

                          {/* consulting → open console */}
                          {token.status === "consulting" && (
                            <button
                              onClick={function () { router.push("/dashboard/hms/opd/" + token.token_id); }}
                              className="rounded-md bg-coral px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-coral-deep"
                            >
                              Consult →
                            </button>
                          )}

                          {/* consulting → Complete shortcut (without opening console) */}
                          {token.status === "consulting" && (
                            <button
                              onClick={function () { handleStatusChange(token, "completed"); }}
                              disabled={isUpdating}
                              className="rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-40"
                            >
                              Done
                            </button>
                          )}

                          {/* completed / exited → View */}
                          {(token.status === "completed" || token.status === "exited") && (
                            <button
                              onClick={function () { router.push("/dashboard/hms/opd/" + token.token_id); }}
                              className="rounded-md border border-line px-2.5 py-1.5 text-[11px] text-text-dim hover:bg-paper-soft"
                            >
                              View
                            </button>
                          )}

                          {/* No-show — only for pre-consulting statuses */}
                          {(token.status === "registered" || token.status === "triaged" || token.status === "called") && (
                            <button
                              onClick={function () { handleStatusChange(token, "no_show"); }}
                              disabled={isUpdating}
                              className="rounded-md border border-rose-200 px-2 py-1.5 text-[11px] text-rose-500 hover:bg-rose-50 disabled:opacity-40"
                            >
                              No-show
                            </button>
                          )}

                          {/* Cancel — for any active non-consulting token */}
                          {(token.status === "registered" || token.status === "triaged" || token.status === "called") && (
                            <button
                              onClick={function () {
                                if (window.confirm("Cancel token " + token.token_number + "?")) {
                                  handleStatusChange(token, "cancelled");
                                }
                              }}
                              disabled={isUpdating}
                              className="rounded-md border border-gray-200 px-2 py-1.5 text-[11px] text-gray-400 hover:bg-gray-50 disabled:opacity-40"
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
      </div>

      {/* Walk-in Modal */}
      {showWalkin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="font-fraunces text-lg text-ink">Register Walk-in Patient</div>
              <button onClick={function () { setShowWalkin(false); setWalkin({ ...emptyWalkin }); setSelectedPatient(null); setPatientResults([]); }} className="text-text-dim hover:text-ink">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Search by phone / name</label>
                <input
                  value={walkin.phone}
                  onChange={function (e) { handlePhoneSearch(e.target.value); }}
                  placeholder="Enter phone number or patient name"
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-coral focus:outline-none"
                />
                {searchLoading && <div className="mt-1 text-xs text-text-muted">Searching…</div>}
                {patientResults.length > 0 && !selectedPatient && (
                  <div className="mt-1 overflow-hidden rounded-lg border border-line bg-white shadow-md">
                    {patientResults.map(function (p) {
                      return (
                        <button
                          key={p.id}
                          onClick={function () { setSelectedPatient(p); setPatientResults([]); setWalkin(function (w) { return { ...w, phone: p.phone || w.phone }; }); }}
                          className="flex w-full items-center gap-3 border-b border-line-soft px-4 py-2.5 text-left text-sm last:border-0 hover:bg-paper-soft"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral/10 text-xs font-bold text-coral-deep">
                            {(p.name?.[0] || "?").toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-ink">{p.name}</div>
                            <div className="text-xs text-text-dim">{p.phone} {p.uhid ? "· UHID: " + p.uhid : ""}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                {selectedPatient && (
                  <div className="mt-1 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <span className="text-sm font-medium text-emerald-700">✓ {selectedPatient.name}</span>
                    <span className="text-xs text-emerald-600">{selectedPatient.phone}</span>
                    <button onClick={function () { setSelectedPatient(null); }} className="ml-auto text-xs text-emerald-600 hover:underline">Change</button>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Assign Staff *</label>
                <select
                  value={walkin.doctor_id}
                  onChange={function (e) { setWalkin(function (w) { return { ...w, doctor_id: e.target.value }; }); }}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-coral focus:outline-none"
                >
                  <option value="">Select…</option>
                  {doctors.map(function (d) {
                    var name = ((d.first_name || "") + " " + (d.last_name || "")).trim();
                    var role = d.role_name ? " (" + d.role_name + ")" : "";
                    return <option key={d.user_id || d.email} value={d.user_id}>{name}{role}</option>;
                  })}
                </select>
                {doctors.length === 0 && (
                  <div className="mt-1 text-xs text-text-muted">No staff found. <Link href="/dashboard/team" className="text-coral-deep hover:underline">Add staff</Link> first.</div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Chief Complaint</label>
                <input
                  value={walkin.chief_complaint}
                  onChange={function (e) { setWalkin(function (w) { return { ...w, chief_complaint: e.target.value }; }); }}
                  placeholder="e.g. Fever, cough for 3 days"
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-coral focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={handleRegisterWalkin}
                disabled={registering || !selectedPatient || !walkin.doctor_id}
                className="flex-1 rounded-lg bg-coral py-2.5 text-sm font-medium text-white hover:bg-coral-deep disabled:opacity-40"
              >
                {registering ? "Registering…" : "Register & issue token"}
              </button>
              <button
                onClick={function () { setShowWalkin(false); setWalkin({ ...emptyWalkin }); setSelectedPatient(null); setPatientResults([]); }}
                className="rounded-lg border border-line px-4 py-2.5 text-sm text-text-dim hover:bg-paper-soft"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vitals Modal */}
      {vitalsToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="font-fraunces text-lg text-ink">Take Vitals</div>
                <div className="text-xs text-text-dim">{((vitalsToken.first_name || "") + " " + (vitalsToken.last_name || "")).trim()} · {vitalsToken.token_number}</div>
              </div>
              <button onClick={function () { setVitalsToken(null); }} className="text-text-dim hover:text-ink">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">BP Systolic</label>
                <input type="number" placeholder="120" value={vitalsForm.bp_systolic}
                  onChange={function (e) { setVitalsForm(function (p) { return { ...p, bp_systolic: e.target.value }; }); }}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">BP Diastolic</label>
                <input type="number" placeholder="80" value={vitalsForm.bp_diastolic}
                  onChange={function (e) { setVitalsForm(function (p) { return { ...p, bp_diastolic: e.target.value }; }); }}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Pulse (bpm)</label>
                <input type="number" placeholder="72" value={vitalsForm.pulse_rate}
                  onChange={function (e) { setVitalsForm(function (p) { return { ...p, pulse_rate: e.target.value }; }); }}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Temperature (°F)</label>
                <input type="number" step="0.1" placeholder="98.6" value={vitalsForm.temperature}
                  onChange={function (e) { setVitalsForm(function (p) { return { ...p, temperature: e.target.value }; }); }}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">SpO2 (%)</label>
                <input type="number" placeholder="98" value={vitalsForm.spo2}
                  onChange={function (e) { setVitalsForm(function (p) { return { ...p, spo2: e.target.value }; }); }}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Weight (kg)</label>
                <input type="number" step="0.1" placeholder="65" value={vitalsForm.weight_kg}
                  onChange={function (e) { setVitalsForm(function (p) { return { ...p, weight_kg: e.target.value }; }); }}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none" />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Height (cm)</label>
                <input type="number" placeholder="170" value={vitalsForm.height_cm}
                  onChange={function (e) { setVitalsForm(function (p) { return { ...p, height_cm: e.target.value }; }); }}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none" />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Chief Complaint</label>
                <input placeholder="What brings the patient today?" value={vitalsForm.chief_complaint}
                  onChange={function (e) { setVitalsForm(function (p) { return { ...p, chief_complaint: e.target.value }; }); }}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none" />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Nurse Notes</label>
                <textarea rows={2} placeholder="Any nurse observations…" value={vitalsForm.nurse_notes}
                  onChange={function (e) { setVitalsForm(function (p) { return { ...p, nurse_notes: e.target.value }; }); }}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none" />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleSaveVitals}
                disabled={savingVitals}
                className="flex-1 rounded-lg bg-purple-600 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {savingVitals ? "Saving…" : "Save vitals & triage"}
              </button>
              <button
                onClick={function () { setVitalsToken(null); }}
                className="rounded-lg border border-line px-4 py-2.5 text-sm text-text-dim hover:bg-paper-soft"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
