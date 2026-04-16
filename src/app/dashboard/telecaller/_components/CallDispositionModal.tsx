"use client";

import { useState, useEffect, useRef } from "react";
import { logCall, getScripts } from "@/lib/api";
import { useNotification } from "@/app/providers/NotificationProvider";

var DISPOSITIONS = [
  { id: "interested", label: "Book now", color: "bg-emerald-500 text-white hover:bg-emerald-600" },
  { id: "callback", label: "Schedule callback", color: "bg-amber-500 text-white hover:bg-amber-600" },
  { id: "not_interested", label: "Not interested", color: "bg-gray-200 text-gray-700 hover:bg-gray-300" },
  { id: "wrong_number", label: "Wrong number", color: "bg-gray-200 text-gray-700 hover:bg-gray-300" },
  { id: "no_answer", label: "No answer", color: "bg-gray-200 text-gray-700 hover:bg-gray-300" },
  { id: "busy", label: "Busy", color: "bg-gray-200 text-gray-700 hover:bg-gray-300" },
  { id: "dnd_requested", label: "DND requested", color: "bg-red-100 text-red-700 hover:bg-red-200" },
];

type Props = {
  lead: any;
  campaignId?: string;
  onClose: () => void;
  onSubmitted: () => void;
};

export default function CallDispositionModal({ lead, campaignId, onClose, onSubmitted }: Props) {
  var notify = useNotification();
  var [disposition, setDisposition] = useState("");
  var [notes, setNotes] = useState("");
  var [followUpDate, setFollowUpDate] = useState("");
  var [followUpTime, setFollowUpTime] = useState("10:00");
  var [submitting, setSubmitting] = useState(false);
  var [scriptOpening, setScriptOpening] = useState("");

  // Timer
  var [timerRunning, setTimerRunning] = useState(false);
  var [elapsed, setElapsed] = useState(0);
  var startTimeRef = useRef<number>(0);
  var intervalRef = useRef<any>(null);

  // Fetch script opening for this specialty
  useEffect(function () {
    if (lead?.specialty) {
      getScripts({ specialty: lead.specialty, language: lead.language_pref || "en" }).then(function (res) {
        if (res.success && res.data && res.data.length > 0) {
          setScriptOpening(res.data[0].opening || "");
        }
      });
    }
  }, [lead]);

  function startTimer() {
    startTimeRef.current = Date.now();
    setTimerRunning(true);
    intervalRef.current = setInterval(function () {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }

  function stopTimer() {
    setTimerRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  function formatTimer(secs: number) {
    var m = Math.floor(secs / 60);
    var s = secs % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  async function handleSubmit() {
    if (!disposition) {
      notify.warning("Select disposition", "Please select a call outcome.");
      return;
    }

    setSubmitting(true);
    stopTimer();

    var callData: any = {
      lead_id: lead.id,
      call_type: "outbound",
      started_at: startTimeRef.current || Date.now(),
      ended_at: Date.now(),
      duration_seconds: elapsed || 0,
      disposition: disposition,
      disposition_notes: notes || undefined,
      ai_disclosed: false,
      consent_verified: lead.consent_type === "explicit",
    };

    if (campaignId) callData.campaign_id = campaignId;

    if (disposition === "callback" && followUpDate) {
      var dt = new Date(followUpDate + "T" + followUpTime);
      callData.follow_up_at = dt.getTime();
    }

    var res = await logCall(callData);
    setSubmitting(false);

    if (res.success) {
      notify.success("Call logged", "Disposition: " + disposition);
      onSubmitted();
    } else {
      if (res.error === "TRAI_TIME_VIOLATION") {
        notify.error("Outside calling hours", res.message || "Calls can only be made between 9 AM and 9 PM.");
      } else if (res.error === "DND_BLOCKED") {
        notify.error("DND blocked", "This lead is on the Do Not Disturb list.");
      } else {
        notify.error("Failed to log call", res.error || "");
      }
    }
  }

  var fullPhone = lead?.phone?.startsWith("+") ? lead.phone : "+91" + (lead?.phone || "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl" onClick={function (e) { e.stopPropagation(); }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{lead?.name || "Lead"}</h3>
            <p className="text-sm text-gray-500">{fullPhone}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 5l8 8M13 5l-8 8" /></svg>
          </button>
        </div>

        {/* Script opening */}
        {scriptOpening && (
          <div className="mx-5 mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-medium text-amber-700 mb-1">Script Opening</p>
            <p className="text-sm text-amber-800">{scriptOpening}</p>
          </div>
        )}

        {/* Timer */}
        <div className="flex items-center justify-center gap-4 py-4">
          <span className="font-mono text-3xl font-bold text-gray-800">{formatTimer(elapsed)}</span>
          {!timerRunning ? (
            <button onClick={startTimer} className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-600">
              Start
            </button>
          ) : (
            <button onClick={stopTimer} className="rounded-full bg-red-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-600">
              Stop
            </button>
          )}
        </div>

        {/* Disposition buttons */}
        <div className="px-5 pb-3">
          <p className="text-xs font-medium text-gray-400 mb-2">Outcome</p>
          <div className="flex flex-wrap gap-2">
            {DISPOSITIONS.map(function (d) {
              var isSelected = disposition === d.id;
              return (
                <button
                  key={d.id}
                  onClick={function () { setDisposition(d.id); }}
                  className={"rounded-full px-3 py-1.5 text-xs font-medium transition " + (isSelected ? "ring-2 ring-emerald-500 ring-offset-1 " : "") + d.color}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Callback date picker */}
        {disposition === "callback" && (
          <div className="flex gap-2 px-5 pb-3">
            <input
              type="date"
              value={followUpDate}
              onChange={function (e) { setFollowUpDate(e.target.value); }}
              className="rounded-md border px-3 py-1.5 text-sm"
              min={new Date().toISOString().split("T")[0]}
            />
            <input
              type="time"
              value={followUpTime}
              onChange={function (e) { setFollowUpTime(e.target.value); }}
              className="rounded-md border px-3 py-1.5 text-sm"
            />
          </div>
        )}

        {/* Notes */}
        <div className="px-5 pb-4">
          <textarea
            value={notes}
            onChange={function (e) { setNotes(e.target.value); }}
            placeholder="Call notes..."
            rows={2}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm text-gray-500 hover:bg-gray-100">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !disposition}
            className="rounded-md bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {submitting ? "Logging..." : "Log call"}
          </button>
        </div>
      </div>
    </div>
  );
}
