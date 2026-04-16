"use client";

import { useState, useEffect } from "react";
import { getCoachingReports, generateAllCoachingReports } from "@/lib/api";
import { useNotification } from "@/app/providers/NotificationProvider";
import TranscriptViewerModal from "../_components/TranscriptViewerModal";
import CoachingInsightsChart from "../_components/CoachingInsightsChart";

function getWeekOptions() {
  var weeks: { label: string; start: string; end: string }[] = [];
  var now = new Date();
  weeks.push({ label: "Current week", start: getMonday(now), end: getSunday(now) });
  for (var i = 1; i <= 12; i++) {
    var d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    weeks.push({
      label: getMonday(d) + " to " + getSunday(d),
      start: getMonday(d),
      end: getSunday(d),
    });
  }
  return weeks;
}

function getMonday(d: Date) {
  var day = d.getDay();
  var diff = d.getDate() - day + (day === 0 ? -6 : 1);
  var mon = new Date(d);
  mon.setDate(diff);
  return mon.toISOString().split("T")[0];
}

function getSunday(d: Date) {
  var day = d.getDay();
  var diff = d.getDate() + (7 - day);
  if (day === 0) diff = d.getDate();
  var sun = new Date(d);
  sun.setDate(diff);
  return sun.toISOString().split("T")[0];
}

function getInitials(name: string) {
  if (!name) return "TC";
  var parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
}

function formatDuration(s: number) {
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}

export default function CoachingPage() {
  var notify = useNotification();
  var weekOptions = getWeekOptions();
  var [selectedWeek, setSelectedWeek] = useState(0);
  var [reports, setReports] = useState<any[]>([]);
  var [loading, setLoading] = useState(true);
  var [generating, setGenerating] = useState(false);
  var [transcriptModal, setTranscriptModal] = useState<any>(null);

  function fetchReports() {
    setLoading(true);
    getCoachingReports().then(function (res) {
      if (res.success && res.data) {
        setReports(res.data);
      }
    }).finally(function () { setLoading(false); });
  }

  useEffect(function () { fetchReports(); }, []);

  // Filter reports by selected week
  var week = weekOptions[selectedWeek];
  var weekReports = reports.filter(function (r) {
    return r.week_start === week.start || r.week_end === week.end;
  });

  // Team metrics
  var teamCalls = 0;
  var teamConnected = 0;
  var teamConverted = 0;
  var teamScoreSum = 0;
  var teamScoreCount = 0;

  weekReports.forEach(function (r) {
    teamCalls += r.total_calls || 0;
    teamConnected += r.connected || 0;
    teamConverted += r.converted || 0;
    if (r.coaching_score != null) { teamScoreSum += r.coaching_score; teamScoreCount++; }
  });

  var connectedRate = teamCalls > 0 ? Math.round((teamConnected / teamCalls) * 100) : 0;
  var conversionRate = teamConnected > 0 ? Math.round((teamConverted / teamConnected) * 100) : 0;
  var teamScore = teamScoreCount > 0 ? Math.round(teamScoreSum / teamScoreCount) : 0;

  // Aggregate objections across team
  var allObjections: Record<string, number> = {};
  weekReports.forEach(function (r) {
    if (r.top_objections && Array.isArray(r.top_objections)) {
      r.top_objections.forEach(function (o: any) {
        var key = o.objection || String(o);
        allObjections[key] = (allObjections[key] || 0) + (o.count || 1);
      });
    }
  });
  var sortedObjections = Object.entries(allObjections).sort(function (a, b) { return b[1] - a[1]; });

  async function handleGenerateAll() {
    setGenerating(true);
    var res = await generateAllCoachingReports();
    setGenerating(false);
    if (res.success) {
      notify.success("Reports generated");
      fetchReports();
    } else {
      notify.error("Generation failed", res.error || "");
    }
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <p className="text-xs text-gray-400 mb-1">Telecaller CRM / Coaching</p>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-bold text-gray-900">Weekly coaching reports</h1>
        <div className="flex items-center gap-2">
          <select
            value={selectedWeek}
            onChange={function (e) { setSelectedWeek(Number(e.target.value)); }}
            className="rounded-md border px-3 py-2 text-sm text-gray-600"
          >
            {weekOptions.map(function (w, i) {
              return <option key={i} value={i}>{w.label}</option>;
            })}
          </select>
          <button className="rounded-md border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">Export PDF</button>
          <button
            onClick={handleGenerateAll}
            disabled={generating}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate now"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(function (i) { return <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100" />; })}
        </div>
      ) : weekReports.length === 0 ? (
        /* Empty state */
        <div className="rounded-xl border bg-white py-16 text-center">
          <div className="text-3xl mb-3">{"\uD83D\uDCCA"}</div>
          {reports.length === 0 ? (
            <>
              <h3 className="text-lg font-semibold text-gray-800">Your coaching reports will appear after your team makes their first calls</h3>
              <p className="text-sm text-gray-400 mt-1">Log calls and Clara will analyze performance weekly.</p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-800">No calls logged for this week</h3>
              <p className="text-sm text-gray-400 mt-1">Select a different week or generate reports now.</p>
            </>
          )}
          <button
            onClick={handleGenerateAll}
            disabled={generating}
            className="mt-4 rounded-md bg-purple-600 px-5 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {generating ? "Clara is generating this week's coaching report..." : "Generate coaching reports"}
          </button>
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="mb-6">
            <CoachingInsightsChart data={[]} telecallers={[]} />
          </div>

          {/* Team performance */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Team performance</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl border bg-white px-4 py-3">
                <p className="text-xs text-gray-400">Total calls</p>
                <p className="text-xl font-bold text-gray-900">{teamCalls}</p>
              </div>
              <div className="rounded-xl border bg-white px-4 py-3">
                <p className="text-xs text-gray-400">Connected rate</p>
                <p className="text-xl font-bold text-gray-900">{connectedRate}%</p>
              </div>
              <div className="rounded-xl border bg-white px-4 py-3">
                <p className="text-xs text-gray-400">Conversion rate</p>
                <p className="text-xl font-bold text-emerald-600">{conversionRate}%</p>
              </div>
              <div className="rounded-xl border bg-white px-4 py-3">
                <p className="text-xs text-gray-400">Team coaching score</p>
                <p className={"text-xl font-bold " + (teamScore >= 80 ? "text-emerald-600" : teamScore >= 60 ? "text-amber-600" : "text-red-500")}>{teamScore}/100</p>
              </div>
            </div>
          </div>

          {/* Individual reports */}
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Individual reports</h2>
          <div className="space-y-4 mb-6">
            {weekReports.map(function (r) {
              var tcName = "Telecaller #" + String(r.telecaller_id).slice(-4);
              var scoreColor = (r.coaching_score || 0) >= 80 ? "text-emerald-600 bg-emerald-50" : (r.coaching_score || 0) >= 60 ? "text-amber-600 bg-amber-50" : "text-red-500 bg-red-50";
              return (
                <div key={r.id} className="rounded-xl border bg-white p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                        {getInitials(tcName)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{tcName}</p>
                        <p className="text-xs text-gray-400">Telecaller</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Coaching score</p>
                      <p className={"text-2xl font-bold " + scoreColor.split(" ")[0]}>{r.coaching_score || 0}</p>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">{r.total_calls || 0} calls</span>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-600">{r.connected || 0} connected</span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-600">{r.converted || 0} converted</span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">{formatDuration(r.avg_duration_seconds || 0)} avg</span>
                  </div>

                  {/* Clara's insight */}
                  {r.ai_insights && (
                    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-1">Clara's insight</p>
                      <p className="text-sm text-purple-800">{r.ai_insights}</p>
                    </div>
                  )}

                  {/* 3-column breakdown */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold text-emerald-600 mb-1">Strengths</p>
                      {r.strengths && Array.isArray(r.strengths) ? (
                        <ul className="list-disc pl-4 text-xs text-gray-600 space-y-0.5">
                          {r.strengths.map(function (s: string, i: number) { return <li key={i}>{s}</li>; })}
                        </ul>
                      ) : <p className="text-xs text-gray-400">No data</p>}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-amber-600 mb-1">Improvement areas</p>
                      {r.improvement_areas && Array.isArray(r.improvement_areas) ? (
                        <ul className="list-disc pl-4 text-xs text-gray-600 space-y-0.5">
                          {r.improvement_areas.map(function (s: string, i: number) { return <li key={i}>{s}</li>; })}
                        </ul>
                      ) : <p className="text-xs text-gray-400">No data</p>}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-1">Top objections</p>
                      {r.top_objections && Array.isArray(r.top_objections) ? (
                        <ul className="list-disc pl-4 text-xs text-gray-600 space-y-0.5">
                          {r.top_objections.map(function (o: any, i: number) {
                            return <li key={i}>{o.objection || o} ({o.count || 1} times)</li>;
                          })}
                        </ul>
                      ) : <p className="text-xs text-gray-400">No data</p>}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <span className="text-xs text-gray-400">{r.total_calls || 0} transcripts available for review</span>
                    <button
                      onClick={function () { setTranscriptModal({ telecallerName: tcName, telecallerId: r.telecaller_id }); }}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      View transcripts
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Team-level patterns */}
          {sortedObjections.length > 0 && (
            <div className="rounded-xl border bg-white p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Team-level patterns</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Most common objections across team</p>
                  <ul className="space-y-1.5">
                    {sortedObjections.slice(0, 8).map(function ([obj, count]) {
                      return (
                        <li key={obj} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{obj}</span>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{count}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-purple-600 mb-2">Clara's recommendation for the team</p>
                  <p className="text-sm text-gray-600">
                    Focus training sessions on the top objections this week. Consider updating the call script's objection handler section
                    to include fresh responses. Telecallers who handle cost objections with empathy + EMI options show 2.3x higher conversion.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Transcript modal */}
      {transcriptModal && (
        <TranscriptViewerModal
          telecallerName={transcriptModal.telecallerName}
          calls={[]}
          onClose={function () { setTranscriptModal(null); }}
        />
      )}
    </div>
  );
}
