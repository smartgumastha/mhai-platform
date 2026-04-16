"use client";

import { useState } from "react";

type CallEntry = {
  id: string;
  lead_id: string;
  started_at: number;
  duration_seconds: number;
  disposition: string;
  sentiment_score: number | null;
  ai_summary: string | null;
  transcript: string | null;
  recording_url: string | null;
  disposition_notes: string | null;
};

type Props = {
  telecallerName: string;
  calls: CallEntry[];
  onClose: () => void;
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDuration(s: number) {
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}

export default function TranscriptViewerModal({ telecallerName, calls, onClose }: Props) {
  var [selectedIdx, setSelectedIdx] = useState(0);
  var [coachingNote, setCoachingNote] = useState("");
  var selected = calls[selectedIdx] || null;

  return (
    <div className="fixed inset-0 z-50 flex bg-black/50" onClick={onClose}>
      <div className="m-4 flex flex-1 overflow-hidden rounded-xl bg-white shadow-2xl" onClick={function (e) { e.stopPropagation(); }}>
        {/* Left panel: call list */}
        <div className="w-72 overflow-y-auto border-r bg-gray-50">
          <div className="border-b px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-800">{telecallerName}</h3>
            <p className="text-xs text-gray-400">{calls.length} calls this week</p>
          </div>
          {calls.map(function (c, i) {
            var isActive = i === selectedIdx;
            var sentColor = (c.sentiment_score || 0) > 0.5 ? "bg-emerald-100 text-emerald-700" : (c.sentiment_score || 0) > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600";
            return (
              <button
                key={c.id}
                onClick={function () { setSelectedIdx(i); }}
                className={"w-full border-b px-4 py-3 text-left transition " + (isActive ? "bg-white" : "hover:bg-gray-100")}
              >
                <p className="text-sm font-medium text-gray-700">Call #{i + 1}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  <span>{formatDate(c.started_at)}</span>
                  <span>{formatDuration(c.duration_seconds || 0)}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={"rounded-full px-1.5 py-0.5 text-[10px] font-medium " + sentColor}>
                    {c.sentiment_score != null ? Number(c.sentiment_score).toFixed(1) : "N/A"}
                  </span>
                  <span className="text-[10px] text-gray-400">{c.disposition || "N/A"}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right panel: transcript */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                Call #{selectedIdx + 1} {selected?.disposition ? " \u2014 " + selected.disposition : ""}
              </h3>
              {selected && <p className="text-xs text-gray-400">{formatDate(selected.started_at)} \u00B7 {formatDuration(selected.duration_seconds || 0)}</p>}
            </div>
            <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l8 8M14 6l-8 8" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Clara's analysis */}
            {selected?.ai_summary && (
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <p className="text-[10px] font-bold uppercase text-purple-600 mb-1">Clara's analysis</p>
                <p className="text-sm text-purple-800">{selected.ai_summary}</p>
                {selected.sentiment_score != null && (
                  <p className={"text-xs mt-2 font-medium " + (selected.sentiment_score > 0.5 ? "text-emerald-600" : selected.sentiment_score > 0 ? "text-amber-600" : "text-red-500")}>
                    Sentiment: {Number(selected.sentiment_score).toFixed(2)}
                  </p>
                )}
              </div>
            )}

            {/* Transcript */}
            {selected?.transcript ? (
              <div className="space-y-2">
                {selected.transcript.split("\n").filter(Boolean).map(function (line, i) {
                  var isYou = line.toLowerCase().startsWith("you:");
                  return (
                    <div key={i} className={"rounded-lg px-3 py-2 text-sm " + (isYou ? "bg-blue-50 text-blue-800" : "bg-gray-50 text-gray-700")}>
                      {line}
                    </div>
                  );
                })}
              </div>
            ) : selected?.disposition_notes ? (
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">{selected.disposition_notes}</div>
            ) : (
              <p className="text-center py-8 text-sm text-gray-400">No transcript available for this call</p>
            )}

            {/* Recording */}
            {selected?.recording_url && (
              <a href={selected.recording_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                Download recording
              </a>
            )}

            {/* Coaching note */}
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1">Coaching note</p>
              <textarea
                value={coachingNote}
                onChange={function (e) { setCoachingNote(e.target.value); }}
                rows={3}
                placeholder="Leave feedback on this call..."
                className="w-full rounded-md border px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
