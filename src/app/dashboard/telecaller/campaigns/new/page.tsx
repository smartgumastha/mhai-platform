"use client";

import { useState, useEffect, useRef } from "react";
import { createCampaign, startCampaign, getScripts, getLeads } from "@/lib/api";
import { useNotification } from "@/app/providers/NotificationProvider";
import { useLocale } from "@/app/providers/locale-context";
import { useRouter } from "next/navigation";
import ScriptGenerateModal from "../../_components/ScriptGenerateModal";

var GOALS = [
  { id: "book_consultation", label: "Book consultation" },
  { id: "reactivation", label: "Reactivate patient" },
  { id: "feedback", label: "Collect feedback" },
  { id: "appointment_reminder", label: "Appointment reminder" },
  { id: "consent_collection", label: "Consent collection" },
];

var STATUS_OPTIONS = ["new", "contacted", "follow_up"];

export default function NewCampaignPage() {
  var notify = useNotification();
  var router = useRouter();
  var ctx = useLocale();

  // Form state
  var [name, setName] = useState("");
  var [goal, setGoal] = useState("book_consultation");
  var [description, setDescription] = useState("");

  // Target segment
  var [sourceTag, setSourceTag] = useState("");
  var [specialty, setSpecialty] = useState("");
  var [scoreMin, setScoreMin] = useState(0);
  var [scoreMax, setScoreMax] = useState(100);
  var [statusFilters, setStatusFilters] = useState<string[]>(["new"]);
  var [segmentPreview, setSegmentPreview] = useState<number | null>(null);

  // Script
  var [scripts, setScripts] = useState<any[]>([]);
  var [selectedScript, setSelectedScript] = useState("");
  var [showGenerate, setShowGenerate] = useState(false);

  // Assignment
  var [assignMode, setAssignMode] = useState<"ai_first" | "human" | "ai_only">("ai_first");

  // Retry
  var [maxAttempts, setMaxAttempts] = useState(3);
  var [retryHours, setRetryHours] = useState(24);

  var [saving, setSaving] = useState(false);
  var debounceRef = useRef<any>(null);

  useEffect(function () {
    getScripts().then(function (r) { if (r.success && r.data) setScripts(r.data); });
  }, []);

  // Debounced segment preview
  useEffect(function () {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(function () {
      var filters: any = { limit: 1 };
      if (statusFilters.length > 0) filters.status = statusFilters[0];
      getLeads(filters).then(function (r) {
        if (r.success) setSegmentPreview(r.total || 0);
      });
    }, 500);
  }, [sourceTag, specialty, scoreMin, scoreMax, statusFilters]);

  function toggleStatus(s: string) {
    setStatusFilters(function (prev) {
      return prev.includes(s) ? prev.filter(function (x) { return x !== s; }) : [...prev, s];
    });
  }

  async function handleSave(launch: boolean) {
    if (!name.trim()) { notify.warning("Name required"); return; }
    setSaving(true);

    var targetSegment: any = {};
    if (sourceTag) targetSegment.source_tag = sourceTag;
    if (specialty) targetSegment.specialty = specialty;
    if (scoreMin > 0) targetSegment.score_min = scoreMin;
    if (scoreMax < 100) targetSegment.score_max = scoreMax;
    if (statusFilters.length > 0) targetSegment.status = statusFilters[0];

    var res = await createCampaign({
      name,
      description: description || undefined,
      target_segment: Object.keys(targetSegment).length > 0 ? targetSegment : undefined,
      script_id: selectedScript || undefined,
      timezone: ctx.localeV2?.country_code === "US" ? "America/New_York" : "Asia/Kolkata",
      use_ai_voice: assignMode === "ai_only",
      max_attempts: maxAttempts,
    });

    if (res.success && res.data) {
      if (launch) {
        await startCampaign(res.data.id);
        notify.success("Campaign launched!");
      } else {
        notify.success("Campaign saved as draft");
      }
      router.push("/dashboard/telecaller/campaigns");
    } else {
      notify.error("Failed", res.error || "");
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen p-6">
      <p className="text-xs text-gray-400 mb-1">Telecaller CRM / Campaigns / New</p>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Create campaign</h1>

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Section 1: Details */}
        <div className="rounded-xl border bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">Campaign details</h2>
          <div>
            <label className="text-xs font-medium text-gray-500">Name *</label>
            <input value={name} onChange={function (e) { setName(e.target.value); }} placeholder="e.g. March health camp follow-up" className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Goal</label>
            <select value={goal} onChange={function (e) { setGoal(e.target.value); }} className="mt-1 w-full rounded-md border px-3 py-2 text-sm">
              {GOALS.map(function (g) { return <option key={g.id} value={g.id}>{g.label}</option>; })}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Description (optional)</label>
            <textarea value={description} onChange={function (e) { setDescription(e.target.value); }} rows={2} className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none" />
          </div>
        </div>

        {/* Section 2: Target segment */}
        <div className="rounded-xl border bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">Target segment</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Source tag</label>
              <input value={sourceTag} onChange={function (e) { setSourceTag(e.target.value); }} placeholder="e.g. health_camp_march" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Specialty</label>
              <input value={specialty} onChange={function (e) { setSpecialty(e.target.value); }} placeholder="e.g. dental" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">AI lead score range: {scoreMin} - {scoreMax}</label>
            <div className="flex gap-3 mt-1">
              <input type="range" min="0" max="100" value={scoreMin} onChange={function (e) { setScoreMin(Number(e.target.value)); }} className="flex-1 accent-emerald-500" />
              <input type="range" min="0" max="100" value={scoreMax} onChange={function (e) { setScoreMax(Number(e.target.value)); }} className="flex-1 accent-emerald-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Lead status</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(function (s) {
                var selected = statusFilters.includes(s);
                return (
                  <button key={s} onClick={function () { toggleStatus(s); }} className={"rounded-full px-3 py-1 text-xs font-medium transition " + (selected ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                    {s.replace("_", " ")}
                  </button>
                );
              })}
            </div>
          </div>
          {segmentPreview !== null && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {segmentPreview} leads match your segment
            </div>
          )}
        </div>

        {/* Section 3: Consent gate */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
          <h2 className="text-sm font-semibold text-emerald-800 mb-2">Consent gate</h2>
          <p className="text-xs text-emerald-600">Only consented and DND-safe leads will be dialled. Blocked leads are automatically excluded from the campaign.</p>
        </div>

        {/* Section 4: Script */}
        <div className="rounded-xl border bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">Script</h2>
          <select value={selectedScript} onChange={function (e) { setSelectedScript(e.target.value); }} className="w-full rounded-md border px-3 py-2 text-sm">
            <option value="">No script selected</option>
            {scripts.map(function (s: any) { return <option key={s.id} value={s.id}>{s.name} ({s.language})</option>; })}
          </select>
          <button
            onClick={function () { setShowGenerate(true); }}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            + Generate new with Clara
          </button>
        </div>

        {/* Section 5: Time window */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 space-y-2">
          <h2 className="text-sm font-semibold text-amber-800">TRAI / TCPA time window</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-amber-600">Start time</label>
              <input value="09:00" disabled className="mt-1 w-full rounded-md border bg-amber-50 px-3 py-2 text-sm text-amber-700 cursor-not-allowed" />
            </div>
            <div>
              <label className="text-xs text-amber-600">End time</label>
              <input value="21:00" disabled className="mt-1 w-full rounded-md border bg-amber-50 px-3 py-2 text-sm text-amber-700 cursor-not-allowed" />
            </div>
          </div>
          <p className="text-xs text-amber-600">Times are locked by global compliance law. System auto-pauses campaign outside these hours and resumes next day.</p>
        </div>

        {/* Section 6: Assignment */}
        <div className="rounded-xl border bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">Assign to</h2>
          {[
            { id: "ai_first" as const, label: "Clara AI first, humans for warm leads", badge: true },
            { id: "human" as const, label: "Human telecallers only" },
            { id: "ai_only" as const, label: "Clara AI only (fully automated)" },
          ].map(function (opt) {
            return (
              <label key={opt.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="radio" name="assign" checked={assignMode === opt.id} onChange={function () { setAssignMode(opt.id); }} className="accent-emerald-500" />
                {opt.label}
                {opt.badge && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Recommended</span>}
              </label>
            );
          })}
        </div>

        {/* Section 7: Retry rules */}
        <div className="rounded-xl border bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">Retry rules</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Max attempts per lead</label>
              <select value={maxAttempts} onChange={function (e) { setMaxAttempts(Number(e.target.value)); }} className="mt-1 w-full rounded-md border px-3 py-2 text-sm">
                {[1, 2, 3, 4, 5].map(function (n) { return <option key={n} value={n}>{n}</option>; })}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Wait between attempts</label>
              <select value={retryHours} onChange={function (e) { setRetryHours(Number(e.target.value)); }} className="mt-1 w-full rounded-md border px-3 py-2 text-sm">
                <option value={4}>4 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours</option>
                <option value={48}>48 hours</option>
                <option value={168}>1 week</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between pt-2 pb-8">
          <button onClick={function () { handleSave(false); }} disabled={saving} className="rounded-md border px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            {saving ? "Saving..." : "Save as draft"}
          </button>
          <button onClick={function () { handleSave(true); }} disabled={saving} className="rounded-md bg-emerald-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
            {saving ? "Launching..." : "Launch campaign"}
          </button>
        </div>
      </div>

      {showGenerate && (
        <ScriptGenerateModal
          onClose={function () { setShowGenerate(false); }}
          onGenerated={function (data) {
            if (data?.id) {
              setSelectedScript(data.id);
              // Refresh scripts
              getScripts().then(function (r) { if (r.success && r.data) setScripts(r.data); });
            }
          }}
          defaultSpecialty={specialty}
        />
      )}
    </div>
  );
}
