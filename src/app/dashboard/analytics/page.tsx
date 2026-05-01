"use client";

import { useState, useEffect, useCallback } from "react";
import { getDashboardStats, getPayments } from "@/lib/api";
import { useCurrency } from "@/app/hooks/useCurrency";

type Stats = {
  today_appointments?: number;
  total_reviews?: number;
  avg_rating?: number;
  pending_replies?: number;
  total_posts?: number;
  revenue_mtd?: number;
  appointments_list?: any[];
};

type Payment = {
  id: string;
  patient_name: string;
  amount: number;
  purpose: string;
  status: string;
  short_url: string;
  created_at: number;
};

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className={"mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl " + color}>
        <div className="h-2 w-2 rounded-full bg-current opacity-70" />
      </div>
      <div className="font-fraunces text-2xl font-light text-ink">{value}</div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</div>
      {sub && <div className="mt-1 text-xs text-text-dim">{sub}</div>}
    </div>
  );
}

function fmtDate(ts: number) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function AnalyticsPage() {
  var currency = useCurrency();
  var [stats, setStats] = useState<Stats | null>(null);
  var [payments, setPayments] = useState<Payment[]>([]);
  var [loading, setLoading] = useState(true);

  var fmt = useCallback(function (n: number) {
    if (!currency) return "₹" + n.toLocaleString("en-IN");
    return currency.symbol + n.toLocaleString("en-IN");
  }, [currency]);

  useEffect(function () {
    var done = 0;
    function finish() { done++; if (done === 2) setLoading(false); }
    getDashboardStats()
      .then(function (r) { if (r.success) setStats(r); })
      .catch(function () {})
      .finally(finish);
    getPayments()
      .then(function (r) { if (r.success && r.payments) setPayments(r.payments as Payment[]); })
      .catch(function () {})
      .finally(finish);
  }, []);

  var paidPayments = payments.filter(function (p) { return p.status === "paid"; });
  var pendingPayments = payments.filter(function (p) { return p.status !== "paid"; });
  var totalCollected = paidPayments.reduce(function (s, p) { return s + (Number(p.amount) || 0); }, 0);
  var totalPending = pendingPayments.reduce(function (s, p) { return s + (Number(p.amount) || 0); }, 0);
  var collectionRate = payments.length > 0 ? Math.round((paidPayments.length / payments.length) * 100) : 0;

  var now = new Date();
  var monthLabel = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  if (loading) {
    return (
      <div className="px-9 py-8">
        <div className="mb-6 h-7 w-40 animate-pulse rounded-lg bg-line" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map(function (i) {
            return <div key={i} className="h-28 animate-pulse rounded-2xl bg-line" />;
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="px-9 py-8">
      <div className="mb-1 font-fraunces text-2xl font-light text-ink">
        Analytics <em className="italic text-coral-deep">& ROI</em>
      </div>
      <p className="mb-7 text-sm text-text-dim">{monthLabel} · live data</p>

      {/* ── KPI row ── */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Revenue MTD"
          value={fmt(Number(stats?.revenue_mtd || 0))}
          sub="Billing + payment links"
          color="bg-emerald-100 text-emerald-600"
        />
        <KpiCard
          label="Today's appointments"
          value={String(stats?.today_appointments || 0)}
          sub="Scheduled for today"
          color="bg-blue-100 text-blue-600"
        />
        <KpiCard
          label="Avg rating"
          value={stats?.avg_rating ? stats.avg_rating.toFixed(1) + " ★" : "—"}
          sub={(stats?.total_reviews || 0) + " reviews · " + (stats?.pending_replies || 0) + " pending"}
          color="bg-amber-100 text-amber-600"
        />
        <KpiCard
          label="Collection rate"
          value={collectionRate + "%"}
          sub={paidPayments.length + " of " + payments.length + " links paid"}
          color="bg-coral/10 text-coral-deep"
        />
      </div>

      {/* ── Two-column section ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Payment links summary */}
        <div className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line-soft px-6 py-5">
            <div className="font-fraunces text-lg text-ink">
              Payment <em className="italic text-coral-deep">links</em>
            </div>
          </div>
          <div className="divide-y divide-line-soft px-6">
            <div className="flex justify-between py-4 text-sm">
              <span className="text-text-dim">Total sent</span>
              <strong>{payments.length}</strong>
            </div>
            <div className="flex justify-between py-4 text-sm">
              <span className="text-text-dim">Total collected</span>
              <strong className="text-emerald-600">{fmt(totalCollected)}</strong>
            </div>
            <div className="flex justify-between py-4 text-sm">
              <span className="text-text-dim">Pending collection</span>
              <strong className="text-amber-600">{fmt(totalPending)}</strong>
            </div>
            <div className="flex justify-between py-4 text-sm">
              <span className="text-text-dim">Collection rate</span>
              <strong>{collectionRate}%</strong>
            </div>
          </div>

          {/* Recent paid payments */}
          {paidPayments.length > 0 && (
            <div className="border-t border-line-soft px-6 pb-5 pt-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Recent collections</div>
              <div className="space-y-2">
                {paidPayments.slice(0, 5).map(function (p) {
                  return (
                    <div key={p.id} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-ink">{p.patient_name}</div>
                        <div className="text-xs text-text-dim">{p.purpose} · {fmtDate(p.created_at)}</div>
                      </div>
                      <span className="text-sm font-semibold text-emerald-600">{fmt(Number(p.amount))}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Today's appointments */}
        <div className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line-soft px-6 py-5">
            <div className="font-fraunces text-lg text-ink">
              Today&apos;s <em className="italic text-coral-deep">appointments</em>
            </div>
          </div>
          {(stats?.appointments_list || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-dim">
              <div className="mb-2 text-3xl">📅</div>
              <div className="text-sm">No appointments scheduled today</div>
            </div>
          ) : (
            <div className="divide-y divide-line-soft">
              {(stats?.appointments_list || []).map(function (a: any) {
                var statusCls: Record<string, string> = {
                  completed: "bg-emerald-100 text-emerald-700",
                  confirmed: "bg-blue-100 text-blue-700",
                  pending: "bg-amber-100 text-amber-700",
                  cancelled: "bg-rose-100 text-rose-700",
                };
                var sc = statusCls[a.status] || "bg-gray-100 text-gray-600";
                return (
                  <div key={a.id} className="flex items-center justify-between px-6 py-3.5">
                    <div>
                      <div className="text-sm font-medium text-ink">{a.patient_name || "Patient"}</div>
                      <div className="text-xs text-text-dim">{a.slot_time} · {a.reason || "Consultation"}</div>
                    </div>
                    <span className={"rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize " + sc}>
                      {a.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Social / reviews row */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">Social posts</div>
          <div className="font-fraunces text-2xl font-light text-ink">{stats?.total_posts || 0}</div>
          <div className="mt-1 text-xs text-text-dim">Published total</div>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">Reviews</div>
          <div className="font-fraunces text-2xl font-light text-ink">{stats?.total_reviews || 0}</div>
          <div className="mt-1 text-xs text-text-dim">{stats?.avg_rating ? stats.avg_rating.toFixed(1) + " avg · " : ""}{stats?.pending_replies || 0} awaiting reply</div>
        </div>
        <div className="col-span-2 rounded-2xl border border-dashed border-line bg-paper-soft p-5 text-center sm:col-span-1">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">Revenue chart</div>
          <div className="text-xs text-text-dim">30-day trend · coming in next sprint</div>
        </div>
      </div>
    </div>
  );
}
