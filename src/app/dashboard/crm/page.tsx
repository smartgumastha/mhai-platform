"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLeads, getPayments, getAppointments } from "@/lib/api";
import { useCurrency } from "@/app/hooks/useCurrency";

type Lead = { id: string; name: string; phone: string; status: string; source?: string; follow_up_at?: string; notes?: string };
type Payment = { id: string; patient_name: string; patient_phone: string; amount: number; purpose: string; short_url: string; created_at: number };
type Appt = { id: string; patient_name: string; patient_phone: string; slot_date: string; slot_time: string; status: string; appointment_type?: string };

function fmtDate(ts: number | string) {
  if (!ts) return "";
  var d = typeof ts === "number" ? new Date(ts) : new Date(ts);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function SectionHeader({ title, sub, count }: { title: string; sub: string; count: number }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <div className="font-fraunces text-lg text-ink">{title}</div>
        <div className="text-xs text-text-dim">{sub}</div>
      </div>
      <span className="rounded-full bg-coral/10 px-2.5 py-1 text-xs font-bold text-coral-deep">{count}</span>
    </div>
  );
}

export default function CrmPage() {
  var router = useRouter();
  var currency = useCurrency();

  var [leads, setLeads] = useState<Lead[]>([]);
  var [payments, setPayments] = useState<Payment[]>([]);
  var [appts, setAppts] = useState<Appt[]>([]);
  var [loading, setLoading] = useState(true);

  var fmt = function (n: number) {
    return (currency?.symbol || "₹") + Number(n).toLocaleString("en-IN");
  };

  useEffect(function () {
    var done = 0;
    function finish() { done++; if (done === 3) setLoading(false); }

    getLeads({ status: "follow_up", limit: 20 })
      .then(function (r) { if (r.success && r.data) setLeads(r.data as Lead[]); })
      .catch(function () {})
      .finally(finish);

    getPayments("pending")
      .then(function (r) { if (r.success && r.payments) setPayments(r.payments as Payment[]); })
      .catch(function () {})
      .finally(finish);

    var today = new Date().toISOString().slice(0, 10);
    getAppointments("today")
      .then(function (r) {
        if (r.success && r.appointments) {
          setAppts((r.appointments as Appt[]).filter(function (a) {
            return a.status === "confirmed" || a.status === "pending";
          }));
        }
      })
      .catch(function () {})
      .finally(finish);
  }, []);

  var totalPending = payments.reduce(function (s, p) { return s + (Number(p.amount) || 0); }, 0);

  if (loading) {
    return (
      <div className="px-9 py-8">
        <div className="mb-6 h-7 w-44 animate-pulse rounded-lg bg-line" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {[1, 2, 3].map(function (i) {
            return <div key={i} className="h-48 animate-pulse rounded-2xl bg-line" />;
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="px-9 py-8">
      <div className="mb-1 font-fraunces text-2xl font-light text-ink">
        Patient <em className="italic text-coral-deep">CRM</em>
      </div>
      <p className="mb-7 text-sm text-text-dim">Follow-up hub — leads needing callbacks, unpaid links, and today&apos;s schedule.</p>

      {/* Summary pills */}
      <div className="mb-7 flex flex-wrap gap-3">
        <div className="rounded-xl border border-line bg-white px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Follow-ups</div>
          <div className="font-fraunces text-xl text-ink">{leads.length}</div>
        </div>
        <div className="rounded-xl border border-line bg-white px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Pending collection</div>
          <div className="font-fraunces text-xl text-amber-600">{fmt(totalPending)}</div>
        </div>
        <div className="rounded-xl border border-line bg-white px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Today&apos;s appointments</div>
          <div className="font-fraunces text-xl text-blue-600">{appts.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Follow-up leads */}
        <div className="rounded-2xl border border-line bg-white p-5">
          <SectionHeader title="Follow-up leads" sub="Require a callback" count={leads.length} />
          {leads.length === 0 ? (
            <div className="py-8 text-center text-sm text-text-dim">No pending follow-ups</div>
          ) : (
            <div className="space-y-3">
              {leads.slice(0, 8).map(function (lead) {
                return (
                  <div key={lead.id} className="rounded-xl border border-line-soft p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-ink">{lead.name}</div>
                        <div className="font-mono text-xs text-text-dim">{lead.phone}</div>
                      </div>
                      {lead.follow_up_at && (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          {fmtDate(lead.follow_up_at)}
                        </span>
                      )}
                    </div>
                    {lead.notes && (
                      <div className="mt-1.5 truncate text-xs text-text-dim">{lead.notes}</div>
                    )}
                    <button
                      onClick={function () { router.push("/dashboard/telecaller?lead=" + lead.id); }}
                      className="mt-2.5 w-full rounded-lg bg-coral/10 py-1.5 text-xs font-semibold text-coral-deep hover:bg-coral/20"
                    >
                      Open in Telecaller →
                    </button>
                  </div>
                );
              })}
              {leads.length > 8 && (
                <button
                  onClick={function () { router.push("/dashboard/telecaller"); }}
                  className="w-full rounded-lg border border-line py-2 text-xs text-text-dim hover:bg-paper-soft"
                >
                  View all {leads.length} follow-ups →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Unpaid payment links */}
        <div className="rounded-2xl border border-line bg-white p-5">
          <SectionHeader title="Pending payments" sub="Links sent, not yet paid" count={payments.length} />
          {payments.length === 0 ? (
            <div className="py-8 text-center text-sm text-text-dim">All payment links collected</div>
          ) : (
            <div className="space-y-3">
              {payments.slice(0, 8).map(function (pmt) {
                return (
                  <div key={pmt.id} className="rounded-xl border border-line-soft p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-ink">{pmt.patient_name}</div>
                        <div className="text-xs text-text-dim">{pmt.purpose} · {fmtDate(pmt.created_at)}</div>
                      </div>
                      <span className="shrink-0 font-mono text-sm font-bold text-amber-600">{fmt(pmt.amount)}</span>
                    </div>
                    <div className="mt-2.5 flex gap-2">
                      <a
                        href={pmt.short_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 rounded-lg bg-emerald-50 py-1.5 text-center text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        Open link →
                      </a>
                      <button
                        onClick={function () { navigator.clipboard.writeText(pmt.short_url); }}
                        className="rounded-lg border border-line px-3 py-1.5 text-xs text-text-dim hover:bg-paper-soft"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                );
              })}
              {payments.length > 8 && (
                <button
                  onClick={function () { router.push("/dashboard/mhai-pay"); }}
                  className="w-full rounded-lg border border-line py-2 text-xs text-text-dim hover:bg-paper-soft"
                >
                  View all {payments.length} pending →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Today's schedule */}
        <div className="rounded-2xl border border-line bg-white p-5">
          <SectionHeader title="Today&apos;s schedule" sub="Confirmed & pending" count={appts.length} />
          {appts.length === 0 ? (
            <div className="py-8 text-center text-sm text-text-dim">No appointments today</div>
          ) : (
            <div className="space-y-3">
              {appts.slice(0, 10).map(function (appt) {
                var statusCls = appt.status === "confirmed" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700";
                return (
                  <div key={appt.id} className="flex items-center gap-3 rounded-xl border border-line-soft p-3">
                    <div className="shrink-0 text-center">
                      <div className="font-mono text-sm font-bold text-ink">{appt.slot_time || "—"}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink">{appt.patient_name}</div>
                      <div className="text-xs text-text-dim">{appt.appointment_type || "Consultation"}</div>
                    </div>
                    <span className={"shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize " + statusCls}>
                      {appt.status}
                    </span>
                  </div>
                );
              })}
              {appts.length > 10 && (
                <button
                  onClick={function () { router.push("/dashboard/appointments"); }}
                  className="w-full rounded-lg border border-line py-2 text-xs text-text-dim hover:bg-paper-soft"
                >
                  View full schedule →
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
