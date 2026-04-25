"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/app/providers/auth-context";
import { useLocale } from "@/app/providers/locale-context";
import { getPatients } from "@/lib/api";
import type { Patient } from "@/lib/types/Patient";

function ageFromDob(dob: string | undefined): string {
  if (!dob) return "—";
  var d = new Date(dob);
  var today = new Date();
  var age = today.getFullYear() - d.getFullYear();
  if (today < new Date(today.getFullYear(), d.getMonth(), d.getDate())) age--;
  return age >= 0 ? String(age) + "Y" : "—";
}

var PAYMENT_CHIP: Record<string, string> = {
  SELF:      "bg-green-50 text-green-700",
  TPA:       "bg-blue-50 text-blue-700",
  CASHLESS:  "bg-blue-50 text-blue-700",
  PMJAY:     "bg-purple-50 text-purple-700",
  CORPORATE: "bg-orange-50 text-orange-700",
  NHS:       "bg-teal-50 text-teal-700",
};

function PaymentChip({ v }: { v?: string }) {
  if (!v) return null;
  var cls = PAYMENT_CHIP[v] || "bg-gray-100 text-gray-600";
  return <span className={"rounded px-2 py-0.5 text-[10px] font-semibold " + cls}>{v}</span>;
}

function BloodPill({ v }: { v?: string }) {
  if (!v) return <span className="text-gray-300">—</span>;
  return <span className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">{v}</span>;
}

function SkeletonRow() {
  return (
    <tr>
      {[1,2,3,4,5,6].map(function(i) {
        return (
          <td key={i} className="px-4 py-3">
            <div className="h-4 animate-pulse rounded bg-gray-100" />
          </td>
        );
      })}
    </tr>
  );
}

export default function PatientsPage() {
  var { user }     = useAuth();
  var { localeV2 } = useLocale();
  var hospitalId   = user?.hospital_id || "";
  var cc           = localeV2?.country_code || "IN";

  var [patients, setPatients] = useState<Patient[]>([]);
  var [loading,  setLoading]  = useState(true);
  var [error,    setError]    = useState("");
  var [search,   setSearch]   = useState("");

  var debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  var load = useCallback(async function(q?: string) {
    if (!hospitalId) return;
    setLoading(true);
    setError("");
    try {
      var res = await getPatients(hospitalId, { q: q || undefined, limit: 50 });
      if (res.success) setPatients(res.patients || []);
      else setError("Could not load patients");
    } catch { setError("Could not load patients"); }
    finally { setLoading(false); }
  }, [hospitalId]);

  useEffect(function() { load(); }, [load]);

  function onSearchChange(v: string) {
    setSearch(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(function() { load(v.trim() || undefined); }, 300);
  }

  // Stats computed client-side
  var today = new Date().toDateString();
  var thisMonth = new Date().toISOString().slice(0, 7);
  var statsToday = patients.filter(function(p) {
    return p.created_at && new Date(Number(p.created_at)).toDateString() === today;
  }).length;
  var statsMonth = patients.filter(function(p) {
    return p.created_at && new Date(Number(p.created_at)).toISOString().slice(0, 7) === thisMonth;
  }).length;
  var statsId = cc === "AE"
    ? patients.filter(function(p) { return p.emirates_id; }).length
    : patients.filter(function(p) { return p.abha_id; }).length;
  var idLabel = cc === "AE" ? "EID on file" : cc === "GB" ? "NHS linked" : "ABHA linked";

  // Locale-aware ID column
  function idValue(p: Patient): string {
    if (cc === "AE") return p.emirates_id ? "784-****-" + p.emirates_id.slice(-5) : "—";
    if (cc === "GB") return "—";
    return p.abha_id ? p.abha_id.slice(0, 4) + "..." : "—";
  }
  var idColHeader = cc === "AE" ? "Emirates ID" : cc === "GB" ? "NHS No." : "ABHA";

  var I = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/20";

  return (
    <div className="px-8 py-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Patients
            {patients.length > 0 && (
              <span className="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-600">
                {patients.length}
              </span>
            )}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">Registered patient database</p>
        </div>
        <Link
          href="/dashboard/patients/new"
          className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        >
          + Register New Patient
        </Link>
      </div>

      {/* Stats strip */}
      <div className="mb-5 grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: patients.length },
          { label: "Today", value: statsToday },
          { label: "This Month", value: statsMonth },
          { label: idLabel, value: statsId },
        ].map(function(s) {
          return (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          className={I}
          placeholder="Search by name, phone, UHID, ABHA..."
          value={search}
          onChange={function(e) { onSearchChange(e.target.value); }}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <span className="text-sm text-red-700">{error}</span>
          <button onClick={function() { load(search.trim() || undefined); }} className="text-sm font-medium text-red-700 underline">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {["UHID", "Name", "Age / Gender", "Phone", "Blood", "Payment", idColHeader, "Actions"].map(function(h) {
                return (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    {h}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [1,2,3,4,5].map(function(i) { return <SkeletonRow key={i} />; })
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="text-sm font-medium text-gray-700">
                    {search.trim() ? "No patients match your search" : "No patients yet"}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {search.trim() ? "Try a different name, phone or UHID." : "Register your first patient to get started."}
                  </p>
                  {!search.trim() && (
                    <Link href="/dashboard/patients/new" className="mt-3 inline-block rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">
                      Register New Patient
                    </Link>
                  )}
                </td>
              </tr>
            ) : (
              patients.map(function(p) {
                var genderInitial = p.gender === "MALE" ? "M" : p.gender === "FEMALE" ? "F" : p.gender ? "O" : "—";
                var hasLegacyBadData = (p.emergency_contact_phone && /\D/.test(p.emergency_contact_phone.replace(/[\s\-\+]/g, ""))) ||
                  (p.emergency_contact_name && /\d/.test(p.emergency_contact_name));
                return (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold text-orange-600">
                        {p.uhid || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{p.name}</span>
                        {hasLegacyBadData && (
                          <Link href={"/dashboard/patients/" + p.id} className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200 hover:bg-amber-100">
                            Data incomplete
                          </Link>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {ageFromDob(p.date_of_birth)} {genderInitial !== "—" && <span className="text-gray-400">{genderInitial}</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.phone || "—"}</td>
                    <td className="px-4 py-3"><BloodPill v={p.blood_group} /></td>
                    <td className="px-4 py-3"><PaymentChip v={p.payment_type} /></td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{idValue(p)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <Link href={"/dashboard/patients/" + p.id} className="text-sm text-orange-600 hover:underline">
                          View
                        </Link>
                        <Link href={"/dashboard/billing/opd?patientId=" + p.id} className="text-sm text-blue-600 hover:underline">
                          New Bill
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
