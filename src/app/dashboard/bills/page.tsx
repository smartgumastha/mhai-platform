"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/auth-context";
import { useCurrency } from "@/app/hooks/useCurrency";
import { useLocale } from "@/app/providers/locale-context";
import { useNotification } from "@/app/providers/NotificationProvider";
import { getToken } from "@/lib/api";

type BillRow = {
  id: string;
  bill_number: string;
  patient_name?: string;
  patient_display_name?: string;
  patient_phone?: string;
  total?: number;
  total_amount?: number;
  paid_amount?: number;
  payment_status?: string;
  status?: string;
  created_at: number;
  due_at?: number | null;
  doctor_name?: string | null;
  supply_type?: string | null;
};

type FilterKey = "all" | "draft" | "sent" | "paid" | "partial" | "overdue" | "refunded";

var PAGE_SIZE = 25;

export default function BillsListPage() {
  var router = useRouter();
  var { user } = useAuth();
  var currency = useCurrency();
  var { localeV2 } = useLocale();
  var notify = useNotification();

  var [bills, setBills] = useState<BillRow[]>([]);
  var [loading, setLoading] = useState(true);
  var [filter, setFilter] = useState<FilterKey>("all");
  var [search, setSearch] = useState("");
  var [page, setPage] = useState(1);
  var [activeTab, setActiveTab] = useState<"all" | "insurance" | "pending">("all");

  useEffect(function () {
    if (!user?.hospital_id) return;
    loadBills();
  }, [user?.hospital_id, filter]);

  async function loadBills() {
    var hospitalId = user?.hospital_id;
    if (!hospitalId) return;
    setLoading(true);
    try {
      var token = getToken();
      var qs = new URLSearchParams();
      if (filter !== "all") qs.set("status", filter);
      var url = "/api/hospitals/" + hospitalId + "/bills" + (qs.toString() ? "?" + qs.toString() : "");
      var res = await fetch(url, {
        headers: token ? { Authorization: "Bearer " + token } : {},
      });
      var data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        setBills(data.data as BillRow[]);
      } else if (data && data.success && Array.isArray(data.bills)) {
        setBills(data.bills as BillRow[]);
      } else {
        setBills([]);
      }
    } catch (e) {
      notify.error("Could not load bills", "Try refreshing the page.");
    } finally {
      setLoading(false);
    }
  }

  function statusOf(b: BillRow): string {
    return (b.payment_status || b.status || "draft").toLowerCase();
  }

  function totalOf(b: BillRow): number {
    return Number(b.total_amount ?? b.total ?? 0);
  }

  function patientOf(b: BillRow): string {
    return b.patient_display_name || b.patient_name || "Walk-in";
  }

  var filtered = useMemo(function () {
    var q = search.trim().toLowerCase();
    var base = bills.filter(function (b) {
      if (activeTab === "insurance") return b.supply_type === "B2B";
      if (activeTab === "pending") {
        var s = statusOf(b);
        return s === "sent" || s === "partial" || s === "overdue";
      }
      return true;
    });
    if (!q) return base;
    return base.filter(function (b) {
      var p = patientOf(b).toLowerCase();
      var ph = (b.patient_phone || "").toLowerCase();
      var bn = (b.bill_number || "").toLowerCase();
      return p.includes(q) || ph.includes(q) || bn.includes(q);
    });
  }, [bills, search, activeTab]);

  var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  var pageStart = (page - 1) * PAGE_SIZE;
  var pageBills = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(function () {
    if (page > totalPages) setPage(1);
  }, [filtered.length, totalPages, page]);

  function statusPillClass(s: string) {
    if (s === "paid") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "overdue") return "bg-rose-50 text-rose-700 border-rose-200";
    if (s === "refunded") return "bg-slate-100 text-slate-700 border-slate-200";
    if (s === "draft") return "bg-amber-50 text-amber-700 border-amber-200";
    if (s === "partial") return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-coral/10 text-coral-deep border-coral/30";
  }

  var statsCollected = bills
    .filter(function (b) { return statusOf(b) === "paid"; })
    .reduce(function (s, b) { return s + Number(b.paid_amount || totalOf(b) || 0); }, 0);
  var statsOutstanding = bills
    .filter(function (b) {
      var s = statusOf(b);
      return s === "sent" || s === "overdue" || s === "partial";
    })
    .reduce(function (s, b) { return s + Math.max(0, totalOf(b) - Number(b.paid_amount || 0)); }, 0);
  var statsOverdue = bills.filter(function (b) { return statusOf(b) === "overdue"; }).length;

  var dateLocale = localeV2?.currency?.format_locale || "en-IN";

  return (
    <div className="min-h-screen bg-paper">
      <div className="sticky top-0 z-10 border-b border-line-soft bg-paper/90 px-8 py-6 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-text-muted">
              Billing
            </div>
            <h1 className="font-fraunces text-3xl font-light leading-none tracking-tight text-ink">
              Patient <em className="italic font-normal text-coral-deep">bills</em>.
            </h1>
            <p className="mt-2 max-w-xl text-sm text-text-dim">
              Every bill issued to a patient, across all payment states. Search by patient name, phone, or bill number.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard/settings/billing-preferences"
              className="rounded-lg border border-line px-4 py-2.5 text-sm text-ink hover:border-coral hover:text-coral-deep"
            >
              Preferences
            </Link>
            <button
              onClick={function () { router.push("/dashboard/bills/new"); }}
              className="rounded-lg bg-coral px-5 py-2.5 text-sm font-medium text-white hover:bg-coral-deep"
            >
              + New bill
            </button>
          </div>
        </div>
      </div>

      {/* Stage 5: 3-tab navigation */}
      <div className="px-8 pt-5 pb-0">
        <div className="flex gap-1 bg-paper-soft border border-line rounded-xl p-1 w-fit">
          {([ ["all", "All Bills"], ["insurance", "Insurance Claims"], ["pending", "Pending Payment"] ] as const).map(([tab, label]) => (
            <button key={tab} onClick={function () { setActiveTab(tab); setPage(1); }}
              className={"px-4 py-2 rounded-lg text-sm font-medium transition-all " + (activeTab === tab ? "bg-white text-ink shadow-sm font-semibold" : "text-text-dim hover:text-ink")}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-b border-line-soft bg-paper-soft px-8 py-5">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={function (e) { setSearch(e.target.value); setPage(1); }}
            placeholder="Search patient, phone, or bill number..."
            className="min-w-[280px] flex-1 rounded-lg border border-line bg-white px-4 py-2.5 text-sm focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
          />
          <div className="flex flex-wrap gap-1.5">
            {[
              { k: "all", l: "All" },
              { k: "paid", l: "Paid" },
              { k: "sent", l: "Sent" },
              { k: "partial", l: "Partial" },
              { k: "overdue", l: "Overdue" },
              { k: "draft", l: "Draft" },
              { k: "refunded", l: "Refunded" },
            ].map(function (f) {
              var selected = filter === f.k;
              return (
                <button
                  key={f.k}
                  onClick={function () { setFilter(f.k as FilterKey); setPage(1); }}
                  className={
                    "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors " +
                    (selected
                      ? "bg-ink text-white"
                      : "border border-line bg-white text-text-dim hover:border-coral hover:text-coral-deep")
                  }
                >
                  {f.l}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 px-8 py-5">
        <Stat label="Total bills" value={String(bills.length)} />
        <Stat label="Collected" value={currency.format(statsCollected)} />
        <Stat label="Outstanding" value={currency.format(statsOutstanding)} />
        <Stat label="Overdue" value={String(statsOverdue)} accent="text-coral-deep" />
      </div>

      <div className="px-8 pb-10">
        {loading ? (
          <div className="rounded-xl border border-line bg-white p-12 text-center text-text-muted">
            Loading bills...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-line bg-white p-12 text-center">
            <div className="mb-2 font-fraunces text-xl text-ink">
              No bills <em className="italic text-coral-deep">yet</em>.
            </div>
            <p className="mx-auto mb-6 max-w-md text-sm text-text-dim">
              {filter === "all" && !search
                ? "You haven't issued any patient bills. Click + New bill to create your first."
                : "No bills match this filter."}
            </p>
            {filter === "all" && !search && (
              <button
                onClick={function () { router.push("/dashboard/bills/new"); }}
                className="rounded-lg bg-coral px-5 py-2.5 text-sm font-medium text-white hover:bg-coral-deep"
              >
                + Create first bill
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-line bg-paper-soft">
                  <Th align="left">Bill #</Th>
                  <Th align="left">Patient</Th>
                  <Th align="left">Doctor</Th>
                  <Th align="right">Amount</Th>
                  <Th align="left">Status</Th>
                  <Th align="left">Date</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {pageBills.map(function (b) {
                  var s = statusOf(b);
                  var amt = totalOf(b);
                  var paid = Number(b.paid_amount || 0);
                  return (
                    <tr key={String(b.id)} className="border-b border-line-soft transition-colors hover:bg-paper-soft/50">
                      <td className="px-5 py-4">
                        <Link
                          href={"/dashboard/bills/" + b.id}
                          className="font-mono text-xs text-ink underline-offset-2 hover:text-coral-deep hover:underline"
                        >
                          {b.bill_number}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-ink">{patientOf(b)}</div>
                        <div className="font-mono text-xs text-text-muted">{b.patient_phone || "—"}</div>
                      </td>
                      <td className="px-5 py-4 text-sm text-text-dim">{b.doctor_name || "—"}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="font-mono text-sm text-ink">{currency.format(amt)}</div>
                        {paid > 0 && paid < amt && (
                          <div className="font-mono text-[11px] text-emerald-700">
                            Paid {currency.format(paid)}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={
                            "inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider " +
                            statusPillClass(s)
                          }
                        >
                          {s}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-text-muted">
                        {new Date(Number(b.created_at)).toLocaleDateString(dateLocale, {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={"/dashboard/bills/" + b.id}
                          className="text-xs text-coral-deep hover:underline"
                        >
                          {"View \u2192"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="font-mono text-xs text-text-muted">
              Page {page} of {totalPages} {"\u00B7"} {filtered.length} bills
            </div>
            <div className="flex gap-2">
              <button
                onClick={function () { setPage(Math.max(1, page - 1)); }}
                disabled={page === 1}
                className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink hover:border-coral disabled:opacity-40"
              >
                {"\u2190 Prev"}
              </button>
              <button
                onClick={function () { setPage(Math.min(totalPages, page + 1)); }}
                disabled={page === totalPages}
                className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink hover:border-coral disabled:opacity-40"
              >
                {"Next \u2192"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-line bg-white px-5 py-4">
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-text-muted">{label}</div>
      <div className={"font-fraunces text-2xl font-normal " + (accent || "text-ink")}>{value}</div>
    </div>
  );
}

function Th({ align, children }: { align: "left" | "right"; children: React.ReactNode }) {
  return (
    <th
      className={
        "px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-text-muted " +
        (align === "right" ? "text-right" : "text-left")
      }
    >
      {children}
    </th>
  );
}
