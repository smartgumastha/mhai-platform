"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLeads, logCall, updateLead } from "@/lib/api";
import { useNotification } from "@/app/providers/NotificationProvider";

type Lead = {
  id: string;
  name: string;
  phone: string;
  status: string;
  source?: string;
  follow_up_at?: string;
  notes?: string;
  inquiry?: string;
};

var DISPOSITIONS = [
  { value: "answered_booked", label: "✅ Answered — Booked" },
  { value: "answered_callback", label: "📅 Answered — Callback later" },
  { value: "answered_not_interested", label: "❌ Not interested" },
  { value: "no_answer", label: "📵 No answer" },
  { value: "voicemail", label: "💬 Left voicemail" },
  { value: "wrong_number", label: "❓ Wrong number" },
];

function PhoneIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 3.12 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export default function CallerPage() {
  var router = useRouter();
  var notify = useNotification();

  var [leads, setLeads] = useState<Lead[]>([]);
  var [loading, setLoading] = useState(true);
  var [activeLead, setActiveLead] = useState<Lead | null>(null);
  var [callStart, setCallStart] = useState<number | null>(null);
  var [disposition, setDisposition] = useState("");
  var [dispNotes, setDispNotes] = useState("");
  var [followUpDate, setFollowUpDate] = useState("");
  var [logging, setLogging] = useState(false);
  var [filter, setFilter] = useState<"follow_up" | "new">("follow_up");

  function loadLeads(f: string) {
    setLoading(true);
    getLeads({ status: f, limit: 50 })
      .then(function (r) { if (r.success && r.data) setLeads(r.data as Lead[]); else setLeads([]); })
      .catch(function () { setLeads([]); })
      .finally(function () { setLoading(false); });
  }

  useEffect(function () { loadLeads(filter); }, [filter]);

  function handleDial(lead: Lead) {
    setActiveLead(lead);
    setCallStart(Date.now());
    setDisposition("");
    setDispNotes("");
    setFollowUpDate("");
    window.location.href = "tel:" + lead.phone;
  }

  async function handleLogCall() {
    if (!activeLead || !disposition) {
      notify.warning("Required", "Select a call outcome before logging.");
      return;
    }
    setLogging(true);
    try {
      var now = Date.now();
      var durationSec = callStart ? Math.round((now - callStart) / 1000) : 0;
      var followUpTs = followUpDate ? new Date(followUpDate).getTime() : undefined;

      await logCall({
        lead_id: activeLead.id,
        call_type: "outbound",
        started_at: callStart || now,
        ended_at: now,
        duration_seconds: durationSec,
        disposition: disposition,
        disposition_notes: dispNotes || undefined,
        follow_up_at: followUpTs,
        ai_disclosed: false,
        consent_verified: false,
      });

      var newStatus = disposition === "answered_booked" ? "converted"
        : disposition === "answered_callback" || disposition === "voicemail" ? "follow_up"
        : disposition === "answered_not_interested" || disposition === "wrong_number" ? "lost"
        : "contacted";

      await updateLead(activeLead.id, {
        status: newStatus,
        follow_up_at: followUpTs || undefined,
        notes: dispNotes || undefined,
      });

      notify.success("Call logged", (activeLead?.name || "") + " — " + disposition.replace(/_/g, " "));
      var doneId = activeLead!.id;
      setLeads(function (prev) { return prev.filter(function (l) { return l.id !== doneId; }); });
      setActiveLead(null);
      setCallStart(null);
    } catch {
      notify.error("Error", "Could not log call. Try again.");
    } finally {
      setLogging(false);
    }
  }

  return (
    <div className="px-9 py-8">
      <div className="mb-1 font-fraunces text-2xl font-light text-ink">
        MHAI <em className="italic text-coral-deep">Caller</em>
      </div>
      <p className="mb-6 text-sm text-text-dim">Quick-dial follow-up leads. Click a number to dial, then log the outcome.</p>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-line bg-white p-1 w-fit">
        {(["follow_up", "new"] as const).map(function (f) {
          return (
            <button
              key={f}
              onClick={function () { setFilter(f); }}
              className={"rounded-lg px-4 py-2 text-sm font-medium transition-all " + (filter === f ? "bg-coral text-white" : "text-text-dim hover:bg-paper-soft")}
            >
              {f === "follow_up" ? "Follow-ups" : "New leads"}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Lead queue */}
        <div className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line-soft px-6 py-4">
            <div className="font-fraunces text-lg text-ink">
              Call <em className="italic text-coral-deep">queue</em>
              <span className="ml-2 text-sm font-normal text-text-muted">({leads.length})</span>
            </div>
          </div>
          {loading ? (
            <div className="divide-y divide-line-soft">
              {[1, 2, 3, 4, 5].map(function (i) {
                return (
                  <div key={i} className="flex items-center gap-3 px-6 py-4">
                    <div className="h-9 w-9 animate-pulse rounded-full bg-line" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-28 animate-pulse rounded bg-line" />
                      <div className="h-3 w-36 animate-pulse rounded bg-line" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-text-dim">
              <div className="mb-2 text-3xl">🎉</div>
              <div className="text-sm font-medium">Queue empty</div>
              <div className="mt-1 text-xs">All {filter === "follow_up" ? "follow-ups" : "new leads"} have been called.</div>
              <button
                onClick={function () { router.push("/dashboard/telecaller"); }}
                className="mt-3 text-xs text-coral-deep hover:underline"
              >
                Manage leads in Telecaller →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-line-soft">
              {leads.map(function (lead) {
                var isActive = activeLead?.id === lead.id;
                return (
                  <div
                    key={lead.id}
                    className={"flex items-center gap-3 px-6 py-4 transition-all " + (isActive ? "bg-coral/5" : "hover:bg-paper-soft")}
                  >
                    <div className={"flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold " + (isActive ? "bg-coral text-white" : "bg-coral/10 text-coral-deep")}>
                      {(lead.name?.[0] || "?").toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink">{lead.name}</div>
                      <div className="font-mono text-xs text-text-dim">{lead.phone}</div>
                      {lead.inquiry && <div className="mt-0.5 truncate text-xs text-text-muted">{lead.inquiry}</div>}
                    </div>
                    <button
                      onClick={function () { handleDial(lead); }}
                      className={"flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all " + (isActive ? "bg-coral text-white" : "bg-coral/10 text-coral-deep hover:bg-coral hover:text-white")}
                    >
                      <PhoneIcon />
                      {isActive ? "Calling…" : "Dial"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Call log panel */}
        <div className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line-soft px-6 py-4">
            <div className="font-fraunces text-lg text-ink">
              Log <em className="italic text-coral-deep">outcome</em>
            </div>
          </div>
          {!activeLead ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-dim">
              <div className="mb-2 text-3xl">📞</div>
              <div className="text-sm">Click &quot;Dial&quot; on a lead to start calling.</div>
              <div className="mt-1 text-xs">Log the outcome here after each call.</div>
            </div>
          ) : (
            <div className="px-6 py-5">
              <div className="mb-5 rounded-xl border border-coral/20 bg-coral/5 px-4 py-3">
                <div className="text-sm font-semibold text-ink">{activeLead.name}</div>
                <div className="font-mono text-xs text-text-dim">{activeLead.phone}</div>
                {activeLead.inquiry && <div className="mt-1 text-xs text-text-muted">{activeLead.inquiry}</div>}
              </div>

              <div className="mb-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-muted">Call outcome *</label>
                <div className="grid grid-cols-1 gap-2">
                  {DISPOSITIONS.map(function (d) {
                    return (
                      <button
                        key={d.value}
                        onClick={function () { setDisposition(d.value); }}
                        className={"rounded-lg border px-3 py-2.5 text-left text-sm transition-all " + (disposition === d.value ? "border-coral bg-coral/10 font-semibold text-coral-deep" : "border-line text-ink hover:border-coral/40 hover:bg-paper-soft")}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {(disposition === "answered_callback" || disposition === "voicemail") && (
                <div className="mb-4">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Follow-up date</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={function (e) { setFollowUpDate(e.target.value); }}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none"
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Notes</label>
                <textarea
                  value={dispNotes}
                  onChange={function (e) { setDispNotes(e.target.value); }}
                  rows={2}
                  placeholder="What was discussed…"
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleLogCall}
                  disabled={!disposition || logging}
                  className="flex-1 rounded-lg bg-coral py-2.5 text-sm font-medium text-white hover:bg-coral-deep disabled:opacity-50"
                >
                  {logging ? "Logging…" : "Log & next"}
                </button>
                <button
                  onClick={function () { setActiveLead(null); setCallStart(null); }}
                  className="rounded-lg border border-line px-4 py-2.5 text-sm text-text-dim hover:bg-paper-soft"
                >
                  Skip
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
