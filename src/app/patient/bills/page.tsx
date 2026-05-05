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

function currSym(cc: string) {
  if (cc === "AE") return "AED ";
  if (cc === "GB") return "£";
  if (cc === "US") return "$";
  return "₹";
}

function fmtAmt(amount: number | null | undefined, cc: string) {
  if (amount == null) return "—";
  var locale = cc === "IN" ? "en-IN" : cc === "AE" ? "en-AE" : cc === "GB" ? "en-GB" : "en-US";
  return currSym(cc) + Number(amount).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PatientBillsPage() {
  var { localeV2 } = useLocale();
  var cc = localeV2?.country_code || "IN";

  var [bills, setBills] = useState<any[]>([]);
  var [loading, setLoading] = useState(true);

  useEffect(function () {
    patientApi("/api/patient/bills")
      .then(function (d: any) { setBills(d.bills || d.data || []); })
      .catch(function () {})
      .finally(function () { setLoading(false); });
  }, []);

  var totalPaid = bills.reduce(function (s, b) {
    return (b.bill_status === "FINAL" || b.bill_status === "PAID")
      ? s + Number(b.amount_paid || b.total_amount || 0)
      : s;
  }, 0);

  var totalDue = bills.reduce(function (s, b) {
    return b.balance_due ? s + Number(b.balance_due) : s;
  }, 0);

  return (
    <div className="px-8 py-6">
      <h1 className="mb-0.5 text-2xl font-bold text-gray-900">Bills & Payments</h1>
      <p className="mb-6 text-sm text-gray-400">Your complete billing history</p>

      {/* Summary */}
      {!loading && bills.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-green-600">Total Paid</div>
            <div className="mt-1 text-2xl font-bold text-green-700">{fmtAmt(totalPaid, cc)}</div>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">Balance Due</div>
            <div className="mt-1 text-2xl font-bold text-amber-700">{fmtAmt(totalDue, cc)}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Total Bills</div>
            <div className="mt-1 text-2xl font-bold text-gray-700">{bills.length}</div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {["Bill No.", "Date", "Type", "Doctor", "Amount", "Status"].map(function (h) {
                return (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {h}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
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
                <td colSpan={6} className="py-16 text-center">
                  <div className="mb-2 text-3xl font-bold text-gray-200">₿</div>
                  <p className="text-sm text-gray-500">No bills yet</p>
                </td>
              </tr>
            ) : (
              bills.map(function (b: any) {
                var sc = b.bill_status === "FINAL" || b.bill_status === "PAID"
                  ? "bg-green-100 text-green-700"
                  : b.bill_status === "VOID" || b.bill_status === "CANCELLED"
                    ? "bg-red-100 text-red-700"
                    : b.bill_status === "PENDING"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-600";
                return (
                  <tr key={b.id || b.bill_id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-[#1ba3d6]">
                      {b.bill_number || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(b.bill_date, cc)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{b.bill_type || b.encounter_type || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{b.attending_doctor || "—"}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{fmtAmt(b.total_amount, cc)}</td>
                    <td className="px-4 py-3">
                      <span className={"rounded-full px-2 py-0.5 text-[10px] font-semibold " + sc}>
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
  );
}
