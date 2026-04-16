"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getLead, getScripts, logCall, analyzeCall, withdrawConsent } from "@/lib/api";
import { useNotification } from "@/app/providers/NotificationProvider";
import { useCurrency } from "@/app/hooks/useCurrency";
import { useCompliance } from "@/app/hooks/useCompliance";

var SCRIPT_STEPS = [
  { id: 1, label: "Greeting + disclosure" },
  { id: 2, label: "Confirm interest" },
  { id: 3, label: "Explain offer" },
  { id: 4, label: "Handle objections" },
  { id: 5, label: "Close with booking" },
];

function getInitials(name: string) {
  if (!name) return "?";
  var parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
}

function getCountry(phone: string): string {
  if (!phone) return "IN";
  if (phone.startsWith("+1")) return "US";
  if (phone.startsWith("+44")) return "UK";
  if (phone.startsWith("+971")) return "AE";
  if (phone.startsWith("+65")) return "SG";
  return "IN";
}

export default function ActiveCallPage() {
  var params = useParams();
  var router = useRouter();
  var notify = useNotification();
  var currency = useCurrency();
  var compliance = useCompliance();
  var leadId = params.leadId as string;

  var [lead, setLead] = useState<any>(null);
  var [calls, setCalls] = useState<any[]>([]);
  var [script, setScript] = useState<any>(null);
  var [loading, setLoading] = useState(true);

  // Timer
  var [elapsed, setElapsed] = useState(0);
  var [callStarted, setCallStarted] = useState(false);
  var startTimeRef = useRef<number>(0);
  var intervalRef = useRef<any>(null);

  // Script stepper
  var [currentStep, setCurrentStep] = useState(1);

  // Transcript / coaching
  var [transcript, setTranscript] = useState<string[]>([]);
  var [newMessage, setNewMessage] = useState("");
  var [claraSuggestion, setClaraSuggestion] = useState("");
  var [sentiment, setSentiment] = useState(0.5);
  var [objectionDetected, setObjectionDetected] = useState("");

  // Disposition
  var [submitting, setSubmitting] = useState(false);

  var transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(function () {
    setLoading(true);
    getLead(leadId).then(function (res) {
      if (res.success && res.data) {
        setLead(res.data.lead);
        setCalls(res.data.calls || []);
        // Fetch script for specialty
        if (res.data.lead.specialty) {
          getScripts({ specialty: res.data.lead.specialty }).then(function (sr) {
            if (sr.success && sr.data && sr.data.length > 0) setScript(sr.data[0]);
          });
        }
      } else {
        notify.error("Lead not found");
        router.push("/dashboard/telecaller");
      }
    }).finally(function () { setLoading(false); });
  }, [leadId]);

  function startCall() {
    startTimeRef.current = Date.now();
    setCallStarted(true);
    intervalRef.current = setInterval(function () {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }

  function endCall() {
    setCallStarted(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  function formatTimer(s: number) {
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
  }

  function addMessage(role: string) {
    if (!newMessage.trim()) return;
    var msg = (role === "you" ? "You: " : "Patient: ") + newMessage;
    setTranscript(function (prev) { return [...prev, msg]; });
    setNewMessage("");

    // Auto-scroll
    setTimeout(function () {
      if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }, 50);

    // Simulate objection detection for keywords
    var lower = newMessage.toLowerCase();
    if (lower.includes("expensive") || lower.includes("costly") || lower.includes("price")) {
      setObjectionDetected("cost_concern");
      setClaraSuggestion("I understand cost is important. We offer flexible EMI options starting from just \u20B9500/month. Early treatment saves money by preventing larger procedures later.");
      setSentiment(0.3);
    } else if (lower.includes("think about") || lower.includes("later") || lower.includes("not now")) {
      setObjectionDetected("defer");
      setClaraSuggestion("Absolutely, take your time. However, we have a limited complimentary consultation offer this week worth \u20B9500. Shall I reserve a spot with no obligation?");
      setSentiment(0.4);
    } else if (lower.includes("interested") || lower.includes("yes") || lower.includes("book")) {
      setObjectionDetected("");
      setClaraSuggestion("");
      setSentiment(0.8);
    }

    // Auto-advance script steps based on time
    if (elapsed > 30 && currentStep === 1) setCurrentStep(2);
  }

  async function handleDisposition(disposition: string) {
    setSubmitting(true);
    endCall();

    var res = await logCall({
      lead_id: leadId,
      call_type: "outbound",
      started_at: startTimeRef.current || Date.now(),
      ended_at: Date.now(),
      duration_seconds: elapsed,
      disposition: disposition,
      disposition_notes: transcript.join("\n"),
      ai_disclosed: true,
      consent_verified: lead?.consent_type === "explicit",
    });

    setSubmitting(false);
    if (res.success) {
      notify.success("Call logged", "Disposition: " + disposition);
      router.push("/dashboard/telecaller");
    } else {
      notify.error("Failed to log call", res.error || res.message || "");
    }
  }

  async function handleDND() {
    if (!lead?.phone) return;
    await withdrawConsent(lead.phone);
    notify.success("Added to DND");
    handleDisposition("dnd_requested");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!lead) return null;

  var fullPhone = lead.phone?.startsWith("+") ? lead.phone : "+91" + lead.phone;
  var country = getCountry(fullPhone);
  var callingStatus = compliance.getCallingStatus();
  var score = lead.lead_score || 0;
  var scoreClass = score >= 70 ? "bg-emerald-100 text-emerald-700" : score >= 40 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600";

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Top compliance ribbon */}
      <div className="flex items-center justify-between bg-emerald-600 px-6 py-2.5 text-white">
        <div className="flex items-center gap-3">
          <span className={"h-2.5 w-2.5 rounded-full " + (callStarted ? "bg-white animate-pulse" : "bg-emerald-300")} />
          <span className="text-sm font-medium">{callStarted ? "Call in progress" : "Ready to call"}</span>
          <span className="font-mono text-lg font-bold">{formatTimer(elapsed)}</span>
        </div>
        <div className="flex items-center gap-2">
          {callingStatus.allowed && <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">Within {country} calling hours</span>}
          {lead.consent_type === "explicit" && <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">Consent verified</span>}
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">Recording ON</span>
          {callStarted ? (
            <button onClick={endCall} className="ml-2 rounded-md bg-red-500 px-4 py-1.5 text-xs font-medium hover:bg-red-600">End call</button>
          ) : (
            <a href={"tel:" + fullPhone} onClick={startCall} className="ml-2 rounded-md bg-white px-4 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50">
              Start call
            </a>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Patient context + script */}
        <div className="w-1/2 overflow-y-auto border-r p-5 space-y-4">
          {/* Patient card */}
          <div className="flex items-center gap-3 rounded-xl border bg-white p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">
              {getInitials(lead.name || "")}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{lead.name || "Unknown"}</p>
              <p className="text-sm text-gray-500">{fullPhone}</p>
              <p className="text-xs text-gray-400">{country}</p>
            </div>
            <span className={"ml-auto rounded-full px-3 py-1 text-xs font-bold " + scoreClass}>{score}</span>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-2 rounded-xl border bg-white p-4 text-sm">
            <div><span className="text-xs text-gray-400">Source</span><p className="text-gray-700">{lead.source}</p></div>
            <div><span className="text-xs text-gray-400">Inquiry</span><p className="text-gray-700">{lead.inquiry || "\u2014"}</p></div>
            <div><span className="text-xs text-gray-400">Language</span><p className="text-gray-700">{lead.language_pref || "en"}</p></div>
            <div><span className="text-xs text-gray-400">Past calls</span><p className="text-gray-700">{lead.call_count || 0}</p></div>
          </div>

          {/* Mandatory opening script */}
          <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-2">Mandatory opening</p>
            <p className="text-sm text-amber-800 leading-relaxed">
              {script?.opening || "Namaste! I'm calling from " + (lead.metadata?.clinic_name || "our clinic") + ". This call may be recorded for quality purposes. Is this a good time to talk about your " + (lead.inquiry || "healthcare needs") + "?"}
            </p>
          </div>

          {/* Script flow stepper */}
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs font-medium text-gray-400 mb-3">Script flow</p>
            <div className="space-y-2">
              {SCRIPT_STEPS.map(function (s) {
                var isDone = s.id < currentStep;
                var isCurrent = s.id === currentStep;
                return (
                  <button
                    key={s.id}
                    onClick={function () { setCurrentStep(s.id); }}
                    className={"flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition " +
                      (isCurrent ? "bg-blue-50 text-blue-700 font-medium" : isDone ? "text-emerald-600" : "text-gray-400")}
                  >
                    <span className={"flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold " +
                      (isDone ? "bg-emerald-500 text-white" : isCurrent ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500")}>
                      {isDone ? "\u2713" : s.id}
                    </span>
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* Script content for current step */}
            {script && currentStep === 4 && script.objection_handlers && (
              <div className="mt-3 rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Objection handlers</p>
                {Object.entries(script.objection_handlers).slice(0, 3).map(function ([obj, resp]) {
                  return (
                    <div key={obj} className="mt-1.5">
                      <p className="text-xs font-semibold text-gray-600">{obj}</p>
                      <p className="text-xs text-gray-500">{resp as string}</p>
                    </div>
                  );
                })}
              </div>
            )}
            {script && currentStep === 5 && (
              <div className="mt-3 rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Closing</p>
                <p className="text-sm text-gray-700">{script.closing}</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Clara live coaching */}
        <div className="w-1/2 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Clara live coaching</h3>
            <span className={"rounded-full px-2 py-0.5 text-[10px] font-medium " + (callStarted ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500")}>
              {callStarted ? "Listening..." : "Waiting"}
            </span>
          </div>

          {/* Transcript */}
          <div ref={transcriptRef} className="max-h-[300px] overflow-y-auto rounded-xl border bg-white p-4 space-y-2">
            {transcript.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">Transcript will appear here during the call</p>
            ) : (
              transcript.map(function (msg, i) {
                var isYou = msg.startsWith("You:");
                return (
                  <div key={i} className={"rounded-lg px-3 py-2 text-sm " + (isYou ? "bg-blue-50 text-blue-800" : "bg-gray-50 text-gray-700")}>
                    <span className="text-[10px] text-gray-400">{new Date().toLocaleTimeString()}</span>
                    <p>{msg}</p>
                  </div>
                );
              })
            )}
          </div>

          {/* Message input */}
          <div className="flex gap-2">
            <input
              value={newMessage}
              onChange={function (e) { setNewMessage(e.target.value); }}
              onKeyDown={function (e) { if (e.key === "Enter") addMessage("you"); }}
              placeholder="Type what was said..."
              className="flex-1 rounded-md border px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
            />
            <button onClick={function () { addMessage("you"); }} className="rounded-md bg-blue-500 px-3 py-2 text-xs text-white hover:bg-blue-600">You</button>
            <button onClick={function () { addMessage("patient"); }} className="rounded-md bg-gray-200 px-3 py-2 text-xs text-gray-700 hover:bg-gray-300">Patient</button>
          </div>

          {/* Clara suggestion */}
          {claraSuggestion && (
            <div className="rounded-xl border-2 border-purple-300 bg-purple-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-purple-700">Clara suggests</span>
                {objectionDetected && <span className="rounded-full bg-purple-200 px-2 py-0.5 text-[10px] font-medium text-purple-800">Objection detected</span>}
              </div>
              <p className="text-sm text-purple-800">{claraSuggestion}</p>
            </div>
          )}

          {/* Sentiment meter */}
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs font-medium text-gray-400 mb-2">Sentiment</p>
            <div className="h-3 rounded-full bg-gradient-to-r from-red-400 via-amber-300 to-emerald-400 relative">
              <div
                className="absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 border-white bg-gray-800 shadow transition-all"
                style={{ left: (sentiment * 100) + "%" }}
              />
            </div>
            <p className={"text-xs mt-1 font-medium " + (sentiment > 0.6 ? "text-emerald-600" : sentiment > 0.4 ? "text-amber-600" : "text-red-500")}>
              {sentiment > 0.6 ? "Positive" : sentiment > 0.4 ? "Neutral" : "Negative"}
            </p>
          </div>

          {/* Disposition buttons */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-400">Call outcome</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={function () { handleDisposition("converted"); }} disabled={submitting} className="rounded-md bg-emerald-500 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
                Book now
              </button>
              <button onClick={function () { handleDisposition("callback"); }} disabled={submitting} className="rounded-md border py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                Schedule callback
              </button>
              <button onClick={function () { handleDisposition("not_interested"); }} disabled={submitting} className="rounded-md border py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                Not interested
              </button>
              <button onClick={function () { handleDisposition("wrong_number"); }} disabled={submitting} className="rounded-md border py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                Wrong number
              </button>
            </div>
            <button onClick={handleDND} disabled={submitting} className="w-full rounded-md border border-red-200 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50">
              Add to DND &mdash; &ldquo;Stop calling me&rdquo;
            </button>
          </div>
        </div>
      </div>

      {/* Bottom audit bar */}
      <div className="flex items-center justify-between bg-gray-200 px-6 py-2 text-xs text-gray-500">
        <span>Compliance audit ID: call_{leadId.substring(0, 8)}</span>
        <div className="flex items-center gap-3">
          <button className="rounded px-2 py-1 hover:bg-gray-300">Mute</button>
          <button onClick={function () { endCall(); router.push("/dashboard/telecaller"); }} className="rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600">
            End call
          </button>
        </div>
      </div>
    </div>
  );
}
