"use client";

import { useState, useEffect } from "react";
import { getLead, updateLead, withdrawConsent, checkConsent } from "@/lib/api";
import { useNotification } from "@/app/providers/NotificationProvider";
import { useCurrency } from "@/app/hooks/useCurrency";

var STATUS_COLORS: Record<string, string> = {
  new: "bg-teal-50 text-teal-700",
  contacted: "bg-amber-50 text-amber-700",
  follow_up: "bg-orange-50 text-orange-700",
  converted: "bg-emerald-50 text-emerald-700",
  lost: "bg-gray-100 text-gray-500",
  dnd: "bg-red-50 text-red-600",
};

var SCORE_COLOR = function (s: number) {
  if (s >= 70) return "text-emerald-600 bg-emerald-50";
  if (s >= 40) return "text-amber-600 bg-amber-50";
  return "text-gray-500 bg-gray-100";
};

type Props = {
  leadId: string;
  onClose: () => void;
  onCallClick: (lead: any) => void;
  onUpdated: () => void;
};

export default function LeadDetailModal({ leadId, onClose, onCallClick, onUpdated }: Props) {
  var notify = useNotification();
  var currency = useCurrency();
  var [lead, setLead] = useState<any>(null);
  var [calls, setCalls] = useState<any[]>([]);
  var [consent, setConsent] = useState<any[]>([]);
  var [loading, setLoading] = useState(true);
  var [notes, setNotes] = useState("");
  var [savingNotes, setSavingNotes] = useState(false);

  useEffect(function () {
    setLoading(true);
    getLead(leadId).then(function (res) {
      if (res.success && res.data) {
        setLead(res.data.lead);
        setCalls(res.data.calls || []);
        setNotes(res.data.lead.notes || "");
        // Check consent
        if (res.data.lead.phone) {
          checkConsent(res.data.lead.phone).then(function (cr) {
            if (cr.success && cr.data) setConsent(cr.data);
          });
        }
      } else {
        notify.error("Failed to load lead");
        onClose();
      }
    }).finally(function () { setLoading(false); });
  }, [leadId]);

  function handleSaveNotes() {
    setSavingNotes(true);
    updateLead(leadId, { notes: notes }).then(function (res) {
      if (res.success) {
        notify.success("Notes saved");
        onUpdated();
      } else {
        notify.error("Failed to save", res.error || "");
      }
    }).finally(function () { setSavingNotes(false); });
  }

  function handleDND() {
    if (!lead?.phone) return;
    withdrawConsent(lead.phone).then(function (res) {
      if (res.success) {
        notify.success("Added to DND");
        onUpdated();
        onClose();
      } else {
        notify.error("Failed", res.error || "");
      }
    });
  }

  function handleMarkConverted() {
    updateLead(leadId, { status: "converted" }).then(function (res) {
      if (res.success) {
        notify.success("Lead marked as converted");
        onUpdated();
        onClose();
      }
    });
  }

  function getCountryActions(phone: string) {
    if (phone.startsWith("+91") || phone.startsWith("91") || phone.length === 10) return "IN";
    if (phone.startsWith("+971")) return "AE";
    if (phone.startsWith("+65")) return "SG";
    if (phone.startsWith("+1")) return "US";
    if (phone.startsWith("+44")) return "UK";
    if (phone.startsWith("+61")) return "AU";
    return "IN";
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
        <div className="rounded-xl bg-white p-8 shadow-2xl">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent inline-block" />
        </div>
      </div>
    );
  }

  if (!lead) return null;

  var region = getCountryActions(lead.phone || "");
  var fullPhone = lead.phone?.startsWith("+") ? lead.phone : "+91" + lead.phone;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-10 pb-10" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl" onClick={function (e) { e.stopPropagation(); }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{lead.name || "Unknown"}</h2>
            <p className="text-sm text-gray-500">{fullPhone} {lead.email ? " \u00B7 " + lead.email : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={"rounded-full px-3 py-1 text-xs font-medium " + (STATUS_COLORS[lead.status] || "bg-gray-100 text-gray-600")}>
              {lead.status}
            </span>
            <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l8 8M14 6l-8 8" /></svg>
            </button>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-4 border-b px-6 py-4">
          <div>
            <p className="text-xs text-gray-400">Source</p>
            <p className="text-sm font-medium text-gray-700">{lead.source} {lead.source_tag ? " \u00B7 " + lead.source_tag : ""}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Specialty</p>
            <p className="text-sm font-medium text-gray-700">{lead.specialty || "\u2014"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">AI Score</p>
            <span className={"inline-block rounded-full px-2 py-0.5 text-xs font-semibold " + SCORE_COLOR(lead.lead_score || 0)}>
              {lead.lead_score || 0}/100
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-400">LTV Estimate</p>
            <p className="text-sm font-medium text-gray-700">{lead.ltv_estimate ? currency.format(lead.ltv_estimate) : "\u2014"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Language</p>
            <p className="text-sm font-medium text-gray-700">{lead.language_pref || "en"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">DND Status</p>
            <p className={"text-sm font-medium " + (lead.dnd_status === "blocked" || lead.dnd_status === "opted_out" ? "text-red-600" : "text-gray-700")}>
              {lead.dnd_status || "unknown"}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-400">Inquiry</p>
            <p className="text-sm text-gray-700">{lead.inquiry || "\u2014"}</p>
          </div>
        </div>

        {/* Consent status */}
        {consent.length > 0 && (
          <div className="border-b px-6 py-3">
            <p className="text-xs font-medium text-gray-400 mb-1">Consent Records</p>
            {consent.map(function (c: any, i: number) {
              return (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className={c.withdrawn_at ? "text-red-500" : "text-emerald-500"}>{c.withdrawn_at ? "\u2718" : "\u2714"}</span>
                  <span>{c.consent_type}</span>
                  <span className="text-gray-400">{c.consent_source || ""}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Call history */}
        <div className="border-b px-6 py-4">
          <p className="text-xs font-medium text-gray-400 mb-2">Call History ({calls.length})</p>
          {calls.length === 0 ? (
            <p className="text-sm text-gray-400">No calls yet</p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2">
              {calls.map(function (c: any) {
                var date = c.started_at ? new Date(Number(c.started_at)).toLocaleString() : "\u2014";
                return (
                  <div key={c.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{date}</span>
                      <span className="font-medium text-gray-700">{c.disposition || "N/A"}</span>
                    </div>
                    {c.duration_seconds != null && (
                      <p className="text-xs text-gray-400">{Math.floor(c.duration_seconds / 60)}m {c.duration_seconds % 60}s</p>
                    )}
                    {c.ai_summary && <p className="mt-1 text-xs text-gray-600">{c.ai_summary}</p>}
                    {c.sentiment_score != null && (
                      <p className={"text-xs mt-1 " + (c.sentiment_score > 0 ? "text-emerald-600" : c.sentiment_score < 0 ? "text-red-500" : "text-gray-400")}>
                        Sentiment: {Number(c.sentiment_score).toFixed(2)}
                      </p>
                    )}
                    {c.recording_url && (
                      <a href={c.recording_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Recording</a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="border-b px-6 py-4">
          <p className="text-xs font-medium text-gray-400 mb-1">Notes</p>
          <textarea
            value={notes}
            onChange={function (e) { setNotes(e.target.value); }}
            rows={3}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none"
            placeholder="Add notes..."
          />
          <button
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="mt-1 rounded-md bg-gray-100 px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-50"
          >
            {savingNotes ? "Saving..." : "Save notes"}
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 px-6 py-4">
          <a
            href={"tel:" + fullPhone}
            onClick={function () { setTimeout(function () { onCallClick(lead); }, 500); }}
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
          >
            Call
          </a>
          {(region === "IN" || region === "AE" || region === "SG") && (
            <a
              href={"https://wa.me/" + fullPhone.replace("+", "") + "?text=" + encodeURIComponent("Hi " + (lead.name || "") + ", reaching out from our clinic.")}
              target="_blank" rel="noopener noreferrer"
              className="rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
            >
              WhatsApp
            </a>
          )}
          {(region === "US" || region === "CA") && (
            <a href={"sms:" + fullPhone} className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">SMS</a>
          )}
          {(region === "UK" || region === "AU") && (
            <a href={"mailto:" + (lead.email || "")} className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">Email</a>
          )}
          <button onClick={handleMarkConverted} className="rounded-md bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100">
            Mark converted
          </button>
          <button onClick={handleDND} className="rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100">
            Add to DND
          </button>
        </div>
      </div>
    </div>
  );
}
