"use client";

import { useState } from "react";
import { generateScript } from "@/lib/api";
import { useNotification } from "@/app/providers/NotificationProvider";
import { useDashboard } from "@/app/dashboard/contexts/DashboardContext";

var SPECIALTIES = [
  "general", "dental", "orthopedics", "dermatology", "cardiology",
  "ophthalmology", "ent", "gynecology", "pediatrics", "neurology",
  "gastroenterology", "urology", "psychiatry", "physiotherapy", "ayurveda",
];

var LANGUAGES = [
  { code: "en", name: "English" }, { code: "hi", name: "Hindi" },
  { code: "mr", name: "Marathi" }, { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" }, { code: "kn", name: "Kannada" },
  { code: "bn", name: "Bengali" }, { code: "gu", name: "Gujarati" },
  { code: "ml", name: "Malayalam" }, { code: "pa", name: "Punjabi" },
  { code: "ar", name: "Arabic" }, { code: "ur", name: "Urdu" },
  { code: "zh", name: "Chinese" }, { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" }, { code: "fr", name: "French" },
  { code: "de", name: "German" }, { code: "es", name: "Spanish" },
  { code: "pt", name: "Portuguese" }, { code: "ru", name: "Russian" },
];

var GOALS = [
  { id: "book_consultation", label: "Book consultation" },
  { id: "follow_up", label: "Follow up" },
  { id: "health_camp", label: "Health camp invite" },
  { id: "treatment_plan", label: "Treatment plan" },
  { id: "review_collection", label: "Collect review" },
  { id: "reactivation", label: "Reactivate patient" },
];

type Props = {
  onClose: () => void;
  onGenerated: (script: any) => void;
  defaultSpecialty?: string;
  defaultLanguage?: string;
};

export default function ScriptGenerateModal({ onClose, onGenerated, defaultSpecialty, defaultLanguage }: Props) {
  var notify = useNotification();
  var { hospital } = useDashboard();
  var [specialty, setSpecialty] = useState(defaultSpecialty || "general");
  var [language, setLanguage] = useState(defaultLanguage || "en");
  var [goal, setGoal] = useState("book_consultation");
  var [generating, setGenerating] = useState(false);
  var [preview, setPreview] = useState<any>(null);

  async function handleGenerate() {
    setGenerating(true);
    setPreview(null);
    var res = await generateScript({
      specialty,
      language,
      goal,
      clinic_name: hospital.business_name || undefined,
    });
    setGenerating(false);

    if (res.success && res.data) {
      setPreview(res.data);
    } else {
      notify.error("Generation failed", res.error || "");
    }
  }

  function handleSave() {
    if (preview) {
      onGenerated(preview);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl bg-white shadow-2xl" onClick={function (e) { e.stopPropagation(); }}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="text-base font-semibold text-gray-900">Generate Script with Clara</h3>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 5l8 8M13 5l-8 8" /></svg>
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="text-xs font-medium text-gray-500">Specialty</label>
            <select value={specialty} onChange={function (e) { setSpecialty(e.target.value); }} className="mt-1 w-full rounded-md border px-3 py-2 text-sm">
              {SPECIALTIES.map(function (s) { return <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>; })}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Language</label>
            <select value={language} onChange={function (e) { setLanguage(e.target.value); }} className="mt-1 w-full rounded-md border px-3 py-2 text-sm">
              {LANGUAGES.map(function (l) { return <option key={l.code} value={l.code}>{l.name}</option>; })}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Goal</label>
            <select value={goal} onChange={function (e) { setGoal(e.target.value); }} className="mt-1 w-full rounded-md border px-3 py-2 text-sm">
              {GOALS.map(function (g) { return <option key={g.id} value={g.id}>{g.label}</option>; })}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full rounded-md bg-purple-600 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {generating ? "Clara is writing your script..." : "Generate script"}
          </button>

          {generating && (
            <div className="flex items-center justify-center py-4">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
              <span className="ml-3 text-sm text-gray-500">Clara is writing your script...</span>
            </div>
          )}

          {preview && preview.script && (
            <div className="space-y-3 rounded-lg border p-4">
              <div>
                <p className="text-xs font-medium text-gray-400">Opening</p>
                <p className="text-sm text-gray-700">{preview.script.opening}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">Qualifying Questions</p>
                <ul className="list-disc pl-5 text-sm text-gray-600">
                  {(preview.script.qualifying_questions || []).map(function (q: string, i: number) {
                    return <li key={i}>{q}</li>;
                  })}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">Value Propositions</p>
                <ul className="list-disc pl-5 text-sm text-gray-600">
                  {(preview.script.value_props || []).map(function (v: string, i: number) {
                    return <li key={i}>{v}</li>;
                  })}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">Objection Handlers</p>
                {Object.entries(preview.script.objection_handlers || {}).map(function ([obj, resp]) {
                  return (
                    <div key={obj} className="mt-1">
                      <p className="text-xs font-semibold text-gray-600">{obj}</p>
                      <p className="text-xs text-gray-500">{resp as string}</p>
                    </div>
                  );
                })}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">Closing</p>
                <p className="text-sm text-gray-700">{preview.script.closing}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">AI Disclosure</p>
                <p className="text-sm text-amber-700">{preview.script.ai_disclosure}</p>
              </div>
              <p className="text-xs text-gray-400">Generated in {preview.latency_ms}ms using {preview.model}</p>
            </div>
          )}
        </div>

        {preview && (
          <div className="flex justify-end gap-2 border-t px-5 py-3">
            <button onClick={onClose} className="rounded-md px-4 py-2 text-sm text-gray-500 hover:bg-gray-100">Cancel</button>
            <button onClick={handleSave} className="rounded-md bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600">
              Save script
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
