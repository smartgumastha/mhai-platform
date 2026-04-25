"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useAuth } from "@/app/providers/auth-context";
import { useLocale } from "@/app/providers/locale-context";
import { getPatient, updatePatient, getPatientDeposits, createPatientDeposit, getToken } from "@/lib/api";
import type { Patient } from "@/lib/types/Patient";

var Barcode = dynamic(() => import("react-barcode"), { ssr: false });

function ageFromDob(dob?: string): string {
  if (!dob) return "—";
  var years = Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000);
  return years >= 0 ? String(years) + "Y" : "—";
}

function fmtDate(d?: string | number): string {
  if (!d) return "—";
  try {
    var dt = typeof d === "number" ? new Date(d) : new Date(d);
    return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return String(d); }
}

function BloodPill({ v }: { v?: string }) {
  if (!v) return <span className="text-gray-300">—</span>;
  return (
    <span className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">
      {v}
    </span>
  );
}

var PAYMENT_COLOR: Record<string, string> = {
  SELF: "bg-green-50 text-green-700",
  TPA: "bg-blue-50 text-blue-700",
  CASHLESS: "bg-blue-50 text-blue-700",
  PMJAY: "bg-purple-50 text-purple-700",
  CORPORATE: "bg-orange-50 text-orange-700",
  NHS: "bg-teal-50 text-teal-700",
};

function PaymentChip({ v }: { v?: string }) {
  if (!v) return <span className="text-gray-400">—</span>;
  var cls = PAYMENT_COLOR[v] || "bg-gray-100 text-gray-600";
  return (
    <span className={"rounded px-2 py-0.5 text-xs font-semibold " + cls}>{v}</span>
  );
}

var TABS = ["Overview", "Medical History", "Billing History", "Deposits", "Consents"];

var FIELD_LABELS: Record<string, string> = {
  allergies: "Allergies",
  current_medications: "Current Medications",
  chronic_conditions: "Chronic Conditions",
  past_surgical_history: "Surgical History",
};

var FIELD_PLACEHOLDERS: Record<string, string> = {
  allergies: "e.g. Penicillin, Sulfa drugs — or write None",
  current_medications: "List current medications",
  chronic_conditions: "e.g. Type 2 Diabetes, Hypertension",
  past_surgical_history: "Past surgeries or procedures",
};

export default function PatientProfilePage() {
  var params = useParams<{ id: string }>();
  var id = params.id;
  var { user } = useAuth();
  var { localeV2 } = useLocale();
  var router = useRouter();
  var hospitalId = user?.hospital_id || "";
  var cc = localeV2?.country_code || "IN";

  var [patient, setPatient] = useState<Patient | null>(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState("");
  var [tab, setTab] = useState(0);

  var [editField, setEditField] = useState<string | null>(null);
  var [editValue, setEditValue] = useState("");
  var [savingEdit, setSavingEdit] = useState(false);

  var [bills, setBills] = useState<any[]>([]);
  var [billsLoading, setBillsLoading] = useState(false);

  var [deposits, setDeposits] = useState<any[]>([]);
  var [depositsLoading, setDepositsLoading] = useState(false);
  var [showAddDeposit, setShowAddDeposit] = useState(false);
  var [newDep, setNewDep] = useState({ amount: "", deposit_date: "", receipt_ref: "", deposit_type: "Refundable" });
  var [savingDep, setSavingDep] = useState(false);

  useEffect(function () {
    if (!hospitalId || !id) return;
    setLoading(true);
    getPatient(hospitalId, id)
      .then(function (res: any) {
        if (res.success || res.patient) setPatient(res.patient);
        else setError("Could not load patient");
      })
      .catch(function () { setError("Could not load patient"); })
      .finally(function () { setLoading(false); });
  }, [hospitalId, id]);

  useEffect(function () {
    if (tab !== 2 || !patient?.uhid || !hospitalId) return;
    setBillsLoading(true);
    var token = getToken();
    fetch("/api/hospitals/" + hospitalId + "/rcm/billing/bills?patient_uhid=" + encodeURIComponent(patient.uhid), {
      headers: token ? { Authorization: "Bearer " + token } : {},
    })
      .then(function (r) { return r.json(); })
      .then(function (d) { setBills(d.bills || d.data || []); })
      .catch(function () { setBills([]); })
      .finally(function () { setBillsLoading(false); });
  }, [tab, patient?.uhid, hospitalId]);

  useEffect(function () {
    if (tab !== 3 || !hospitalId || !id) return;
    setDepositsLoading(true);
    getPatientDeposits(hospitalId, id)
      .then(function (res: any) { setDeposits(res.deposits || []); })
      .catch(function () { setDeposits([]); })
      .finally(function () { setDepositsLoading(false); });
  }, [tab, hospitalId, id]);

  async function saveEdit() {
    if (!editField || !hospitalId) return;
    setSavingEdit(true);
    try {
      var body: Record<string, any> = {};
      body[editField] = editValue;
      var res: any = await updatePatient(hospitalId, id, body);
      if (res.success || res.patient) {
        var field = editField;
        setPatient(function (p) { return p ? { ...p, [field]: editValue } : p; });
        setEditField(null);
      }
    } catch {} finally { setSavingEdit(false); }
  }

  async function addDeposit() {
    if (!newDep.amount || !newDep.deposit_date) return;
    setSavingDep(true);
    try {
      var res: any = await createPatientDeposit(hospitalId, id, {
        amount: parseFloat(newDep.amount),
        deposit_date: newDep.deposit_date,
        receipt_ref: newDep.receipt_ref || undefined,
        deposit_type: newDep.deposit_type,
      });
      if (res.success || res.deposit) {
        var fetched: any = await getPatientDeposits(hospitalId, id);
        setDeposits(fetched.deposits || []);
        setShowAddDeposit(false);
        setNewDep({ amount: "", deposit_date: "", receipt_ref: "", deposit_type: "Refundable" });
      }
    } catch {} finally { setSavingDep(false); }
  }

  var I = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/20";
  var L = "block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1";

  if (loading) {
    return (
      <div className="px-8 py-10 text-center">
        <div className="mx-auto h-8 w-48 animate-pulse rounded bg-gray-100" />
        <p className="mt-3 text-sm text-gray-400">Loading patient…</p>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="px-8 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error || "Patient not found"}
        </div>
        <button onClick={function () { router.back(); }}
          className="mt-3 text-sm text-orange-600 hover:underline">
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="px-8 py-6">

      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm">
            <button onClick={function () { router.back(); }} className="text-gray-500 hover:text-orange-600">← Patients</button>
            <span className="text-gray-300">/</span>
            <span className="font-semibold text-gray-900">{patient.name}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-orange-600">{patient.uhid}</span>
            {patient.is_active === false && (
              <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Inactive</span>
            )}
          </div>
        </div>
        <Link
          href={"/dashboard/billing/opd?patientId=" + patient.id}
          className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        >
          New Bill
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex border-b border-gray-200">
        {TABS.map(function (t, i) {
          return (
            <button key={t} type="button" onClick={function () { setTab(i); }}
              className={"px-5 py-3 text-sm font-bold border-b-2 transition-colors " +
                (tab === i ? "border-orange-600 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700")}>
              {t}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: Overview ── */}
      {tab === 0 && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-4">

            {/* Barcode card */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <Barcode value={patient.uhid || "NONE"} width={1.5} height={50} fontSize={12} />
                  <div className="mt-1 font-mono text-sm font-bold text-orange-600">{patient.uhid}</div>
                </div>
                <div className="flex gap-2">
                  <Link href={"/dashboard/billing/print?patientId=" + patient.id}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    Print Labels
                  </Link>
                  <button type="button" onClick={function () { window.print(); }}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    Print Card
                  </button>
                </div>
              </div>
            </div>

            {/* Identity */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-500">Identity</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className={L}>Full Name</div>
                  <div className="text-sm font-semibold text-gray-900">{patient.name}</div>
                </div>
                <div>
                  <div className={L}>Date of Birth</div>
                  <div className="text-sm text-gray-900">
                    {fmtDate(patient.date_of_birth)}
                    {patient.date_of_birth && <span className="ml-1.5 text-gray-400 text-xs">({ageFromDob(patient.date_of_birth)})</span>}
                  </div>
                </div>
                <div>
                  <div className={L}>Gender</div>
                  <div className="text-sm text-gray-900">{patient.gender || "—"}</div>
                </div>
                <div>
                  <div className={L}>Blood Group</div>
                  <BloodPill v={patient.blood_group} />
                </div>
              </div>
            </div>

            {/* Government IDs */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-500">Government ID</h3>
              {cc === "IN" && (
                <div className="space-y-3">
                  <div>
                    <div className={L}>ABHA ID</div>
                    {patient.abha_id ? (
                      <div className="font-mono text-sm font-semibold text-gray-900">{patient.abha_id}</div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          No ABHA on record
                        </span>
                        <a href="https://abha.abdm.gov.in" target="_blank" rel="noreferrer"
                          className="text-xs text-orange-600 hover:underline">
                          Help create ABHA →
                        </a>
                      </div>
                    )}
                  </div>
                  {patient.abha_address && (
                    <div>
                      <div className={L}>ABHA Address</div>
                      <div className="font-mono text-sm text-gray-700">{patient.abha_address}</div>
                    </div>
                  )}
                </div>
              )}
              {cc === "AE" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className={L}>Emirates ID</div>
                    <div className="font-mono text-sm font-semibold text-gray-900">{patient.emirates_id || "—"}</div>
                  </div>
                  <div>
                    <div className={L}>Nationality</div>
                    <div className="font-mono text-sm text-gray-900">{patient.nationality_code || "—"}</div>
                  </div>
                  <div>
                    <div className={L}>Passport No.</div>
                    <div className="font-mono text-sm text-gray-900">{patient.passport_number || "—"}</div>
                  </div>
                </div>
              )}
              {cc !== "IN" && cc !== "AE" && (
                <p className="text-sm text-gray-400">No government ID linked</p>
              )}
            </div>

            {/* Contact */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-500">Contact</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className={L}>Phone</div>
                  <div className="text-sm font-medium text-gray-900">{patient.phone || "—"}</div>
                </div>
                <div>
                  <div className={L}>Email</div>
                  <div className="text-sm font-medium text-gray-900">{patient.email || "—"}</div>
                </div>
                {(patient.address_line1 || patient.city) && (
                  <div className="col-span-2">
                    <div className={L}>Address</div>
                    <div className="text-sm text-gray-900">
                      {[patient.address_line1, patient.address_line2, patient.city, patient.state, patient.pincode]
                        .filter(Boolean).join(", ")}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Emergency */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-500">Emergency Contact</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className={L}>Name</div>
                  <div className="text-sm font-medium text-gray-900">{patient.emergency_contact_name || "—"}</div>
                </div>
                <div>
                  <div className={L}>Phone</div>
                  <div className="text-sm font-medium text-gray-900">{patient.emergency_contact_phone || "—"}</div>
                </div>
                <div>
                  <div className={L}>Relationship</div>
                  <div className="text-sm font-medium text-gray-900">{patient.emergency_contact_relation || "—"}</div>
                </div>
              </div>
            </div>

            {/* Insurance */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-500">Insurance / Payment</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className={L}>Payment Type</div>
                  <div className="mt-0.5"><PaymentChip v={patient.payment_type} /></div>
                </div>
                {patient.insurance_card_number && (
                  <div>
                    <div className={L}>Card Number</div>
                    <div className="font-mono text-sm text-gray-900">
                      {"****-" + patient.insurance_card_number.slice(-4)}
                    </div>
                  </div>
                )}
                {patient.insurance_card_expiry && (
                  <div>
                    <div className={L}>Card Expiry</div>
                    <div className={"font-mono text-sm font-semibold " +
                      (new Date(patient.insurance_card_expiry) < new Date() ? "text-red-600" : "text-gray-900")}>
                      {fmtDate(patient.insurance_card_expiry)}
                      {new Date(patient.insurance_card_expiry) < new Date() && " — EXPIRED"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Registration */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-500">Registration</h3>
              <div className="grid grid-cols-2 gap-4">
                {patient.registration_mode && (
                  <div>
                    <div className={L}>Source</div>
                    <div className="text-sm font-medium text-gray-900">{patient.registration_mode}</div>
                  </div>
                )}
                {patient.referred_by && (
                  <div>
                    <div className={L}>Referred By</div>
                    <div className="text-sm font-medium text-gray-900">{patient.referred_by}</div>
                  </div>
                )}
                {patient.first_visit_at && (
                  <div>
                    <div className={L}>First Visit</div>
                    <div className="text-sm text-gray-900">{fmtDate(patient.first_visit_at)}</div>
                  </div>
                )}
                {patient.created_at && (
                  <div>
                    <div className={L}>Registered</div>
                    <div className="text-sm text-gray-900">
                      {fmtDate(new Date(Number(patient.created_at)).toISOString())}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>{/* col-span-2 */}

          {/* Sidebar */}
          <div>
            <div className="sticky top-20 space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-gray-500">Quick Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Visits</span>
                    <span className="font-bold text-gray-900">
                      {patient.total_visits ?? patient.visit_count ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Visit</span>
                    <span className="text-gray-900">
                      {fmtDate(patient.last_visit_at || patient.last_visit_date || undefined)}
                    </span>
                  </div>
                </div>
              </div>
              {patient.notes && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="mb-1 text-xs font-bold uppercase tracking-wide text-amber-700">Notes</div>
                  <p className="text-xs text-amber-800">{patient.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Medical History ── */}
      {tab === 1 && (
        <div className="grid grid-cols-2 gap-5">
          {(["allergies", "current_medications", "chronic_conditions", "past_surgical_history"] as const).map(function (field) {
            var val: string = (patient as any)[field] || "";
            return (
              <div key={field} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
                    {FIELD_LABELS[field]}
                  </h3>
                  {editField !== field && (
                    <button type="button"
                      onClick={function () { setEditField(field); setEditValue(val); }}
                      className="text-xs font-semibold text-orange-600 hover:underline">
                      Edit
                    </button>
                  )}
                </div>
                {editField === field ? (
                  <div>
                    <textarea
                      value={editValue}
                      onChange={function (e) { setEditValue(e.target.value); }}
                      rows={4}
                      className={I + " resize-none"}
                      placeholder={FIELD_PLACEHOLDERS[field]}
                    />
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={saveEdit} disabled={savingEdit}
                        className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-60">
                        {savingEdit ? "Saving…" : "Save"}
                      </button>
                      <button type="button" onClick={function () { setEditField(null); }}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className={val ? "text-sm text-gray-900 whitespace-pre-wrap" : "text-sm text-gray-400"}>
                    {val || "None recorded"}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB 3: Billing History ── */}
      {tab === 2 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Billing History</h3>
            <Link href={"/dashboard/billing/opd?patientId=" + patient.id}
              className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">
              New Bill
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {["Bill No.", "Date", "Type", "Doctor", "Amount", "Status"].map(function (h) {
                    return (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        {h}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {billsLoading ? (
                  [1, 2, 3].map(function (i) {
                    return (
                      <tr key={i}>
                        {[1, 2, 3, 4, 5, 6].map(function (j) {
                          return (
                            <td key={j} className="px-4 py-3">
                              <div className="h-4 animate-pulse rounded bg-gray-100" />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                ) : bills.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <p className="text-sm font-medium text-gray-700">No bills yet</p>
                      <Link href={"/dashboard/billing/opd?patientId=" + patient.id}
                        className="mt-2 inline-block text-sm text-orange-600 hover:underline">
                        Create first bill →
                      </Link>
                    </td>
                  </tr>
                ) : (
                  bills.map(function (b: any) {
                    var statusCls = b.bill_status === "FINAL"
                      ? "bg-green-100 text-green-700"
                      : b.bill_status === "VOID" || b.bill_status === "CANCELLED"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-600";
                    return (
                      <tr key={b.id || b.bill_id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-mono text-sm font-semibold text-orange-600">
                          {b.bill_number || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {b.bill_date ? new Date(b.bill_date).toLocaleDateString("en-IN") : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {b.bill_type || b.encounter_type || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {b.attending_doctor || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          {b.total_amount != null ? "₹" + Number(b.total_amount).toLocaleString("en-IN") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={"rounded px-2 py-0.5 text-xs font-semibold " + statusCls}>
                            {b.bill_status || "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: Deposits ── */}
      {tab === 3 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Deposits</h3>
            <button type="button" onClick={function () { setShowAddDeposit(true); }}
              className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">
              Add Deposit
            </button>
          </div>

          {showAddDeposit && (
            <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5">
              <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-500">New Deposit</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={L}>Amount *</label>
                  <input type="number" min="0" value={newDep.amount}
                    onChange={function (e) { setNewDep(function (d) { return { ...d, amount: e.target.value }; }); }}
                    className={I} placeholder="0.00" />
                </div>
                <div>
                  <label className={L}>Deposit Date *</label>
                  <input type="date" value={newDep.deposit_date}
                    onChange={function (e) { setNewDep(function (d) { return { ...d, deposit_date: e.target.value }; }); }}
                    className={I} />
                </div>
                <div>
                  <label className={L}>Receipt Ref</label>
                  <input value={newDep.receipt_ref}
                    onChange={function (e) { setNewDep(function (d) { return { ...d, receipt_ref: e.target.value }; }); }}
                    className={I + " font-mono"} placeholder="RCP-001" />
                </div>
                <div>
                  <label className={L}>Deposit Type</label>
                  <select value={newDep.deposit_type}
                    onChange={function (e) { setNewDep(function (d) { return { ...d, deposit_type: e.target.value }; }); }}
                    className={I}>
                    <option>Refundable</option>
                    <option>Non-refundable</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={addDeposit} disabled={savingDep}
                  className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-60">
                  {savingDep ? "Saving…" : "Save Deposit"}
                </button>
                <button type="button" onClick={function () { setShowAddDeposit(false); }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {["Date", "Amount", "Receipt Ref", "Type", "Status"].map(function (h) {
                    return (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        {h}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {depositsLoading ? (
                  [1, 2].map(function (i) {
                    return (
                      <tr key={i}>
                        {[1, 2, 3, 4, 5].map(function (j) {
                          return (
                            <td key={j} className="px-4 py-3">
                              <div className="h-4 animate-pulse rounded bg-gray-100" />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                ) : deposits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-gray-500">
                      No deposits recorded
                    </td>
                  </tr>
                ) : (
                  deposits.map(function (dep: any, i: number) {
                    return (
                      <tr key={dep.id || i} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {dep.deposit_date ? new Date(dep.deposit_date).toLocaleDateString("en-IN") : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          ₹{Number(dep.amount || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">
                          {dep.receipt_ref || dep.ref || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {dep.deposit_type || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={dep.status === "ADJUSTED"
                            ? "rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600"
                            : "rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700"}>
                            {dep.status === "ADJUSTED" ? "Adjusted" : "Available"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: Consents ── */}
      {tab === 4 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["Consent", "Status", "Notes"].map(function (h) {
                  return (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      {h}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { field: "consent_treatment",      label: "Treatment Consent",  note: "Consent to receive medical treatment" },
                { field: "consent_data_processing", label: "Data Processing",    note: cc === "IN" ? "DPDPA 2023" : cc === "AE" ? "PDPL UAE" : cc === "GB" ? "UK-GDPR" : "HIPAA" },
                { field: "consent_abha_sharing",    label: "ABHA Data Sharing",  note: "ABDM network sharing (India)" },
                { field: "consent_nhs_scr",         label: "NHS SCR",            note: "NHS Summary Care Record access (UK)" },
                { field: "consent_hipaa_npp",       label: "HIPAA NPP",          note: "HIPAA Notice of Privacy Practices (US)" },
                { field: "consent_marketing",       label: "Marketing",          note: "Appointment reminders and health tips" },
              ].map(function (row) {
                var val = (patient as any)[row.field];
                return (
                  <tr key={row.field} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{row.label}</td>
                    <td className="px-4 py-3">
                      {val === true ? (
                        <span className="flex items-center gap-1 text-sm font-semibold text-green-700">
                          <span className="text-base leading-none">✓</span> Granted
                        </span>
                      ) : val === false ? (
                        <span className="flex items-center gap-1 text-sm font-semibold text-red-600">
                          <span className="text-base leading-none">✕</span> Declined
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Not recorded</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{row.note}</td>
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
