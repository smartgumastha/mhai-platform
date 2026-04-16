"use client";

import { useState, useEffect } from "react";
import { getScripts, deleteScript, generateScript } from "@/lib/api";
import { useNotification } from "@/app/providers/NotificationProvider";
import { useDashboard } from "@/app/dashboard/contexts/DashboardContext";
import ScriptGenerateModal from "../_components/ScriptGenerateModal";

var SPECIALTIES = ["All", "dental", "dermatology", "cardiology", "orthopedics", "pediatrics", "general", "ophthalmology", "ent", "gynecology"];
var LANGUAGES = ["All", "en", "hi", "te", "ta", "mr", "kn", "bn", "gu", "es", "fr", "ar"];
var GOALS = ["All", "book_consultation", "follow_up", "health_camp", "reactivation", "review_collection"];

var LANG_NAMES: Record<string, string> = {
  en: "English", hi: "Hindi", te: "Telugu", ta: "Tamil", mr: "Marathi",
  kn: "Kannada", bn: "Bengali", gu: "Gujarati", es: "Spanish", fr: "French", ar: "Arabic",
};

var DEFAULT_SPECIALTIES = ["dental", "dermatology", "general"];

export default function ScriptsPage() {
  var notify = useNotification();
  var { hospital } = useDashboard();

  var [scripts, setScripts] = useState<any[]>([]);
  var [loading, setLoading] = useState(true);
  var [showGenerate, setShowGenerate] = useState(false);
  var [detailScript, setDetailScript] = useState<any>(null);
  var [editMode, setEditMode] = useState(false);

  // Filters
  var [specFilter, setSpecFilter] = useState("All");
  var [langFilter, setLangFilter] = useState("All");
  var [goalFilter, setGoalFilter] = useState("All");
  var [search, setSearch] = useState("");

  // Delete confirm
  var [deleteId, setDeleteId] = useState<string | null>(null);
  var [deleting, setDeleting] = useState(false);

  function fetchScripts() {
    setLoading(true);
    var filters: any = {};
    if (specFilter !== "All") filters.specialty = specFilter;
    if (langFilter !== "All") filters.language = langFilter;
    getScripts(filters).then(function (res) {
      if (res.success && res.data) setScripts(res.data);
    }).finally(function () { setLoading(false); });
  }

  useEffect(function () { fetchScripts(); }, [specFilter, langFilter]);

  // Auto-generate defaults if < 3 scripts
  useEffect(function () {
    if (!loading && scripts.length < 3) {
      var missing = DEFAULT_SPECIALTIES.filter(function (sp) {
        return !scripts.some(function (s) { return s.specialty === sp; });
      });
      if (missing.length > 0) {
        // Generate first missing one (don't generate all at once to save API credits)
        generateScript({
          specialty: missing[0],
          language: "en",
          goal: "book_consultation",
          clinic_name: hospital.business_name || undefined,
        }).then(function (res) {
          if (res.success) fetchScripts();
        });
      }
    }
  }, [loading, scripts.length]);

  var filtered = scripts.filter(function (s) {
    if (goalFilter !== "All" && s.name && !s.name.includes(goalFilter)) return true; // loose filter
    if (search && !(s.name || "").toLowerCase().includes(search.toLowerCase()) && !(s.specialty || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function handleDelete(id: string) {
    setDeleting(true);
    var res = await deleteScript(id);
    setDeleting(false);
    if (res.success) {
      notify.success("Script deleted");
      setDeleteId(null);
      setDetailScript(null);
      fetchScripts();
    } else {
      notify.error("Failed", res.error || "");
    }
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <p className="text-xs text-gray-400 mb-1">Telecaller CRM / Scripts</p>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Call scripts library</h1>
        <button
          onClick={function () { setShowGenerate(true); }}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          + Generate new
        </button>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-2">
        <select value={specFilter} onChange={function (e) { setSpecFilter(e.target.value); }} className="rounded-md border px-3 py-1.5 text-xs text-gray-600">
          {SPECIALTIES.map(function (s) { return <option key={s} value={s}>{s === "All" ? "All specialties" : s.charAt(0).toUpperCase() + s.slice(1)}</option>; })}
        </select>
        <select value={langFilter} onChange={function (e) { setLangFilter(e.target.value); }} className="rounded-md border px-3 py-1.5 text-xs text-gray-600">
          {LANGUAGES.map(function (l) { return <option key={l} value={l}>{l === "All" ? "All languages" : LANG_NAMES[l] || l}</option>; })}
        </select>
        <select value={goalFilter} onChange={function (e) { setGoalFilter(e.target.value); }} className="rounded-md border px-3 py-1.5 text-xs text-gray-600">
          {GOALS.map(function (g) { return <option key={g} value={g}>{g === "All" ? "All goals" : g.replace(/_/g, " ")}</option>; })}
        </select>
        <input
          value={search}
          onChange={function (e) { setSearch(e.target.value); }}
          placeholder="Search scripts..."
          className="rounded-md border px-3 py-1.5 text-xs w-40 focus:border-emerald-400 focus:outline-none"
        />
      </div>

      {/* Scripts grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(function (i) { return <div key={i} className="h-36 animate-pulse rounded-xl bg-gray-100" />; })}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-white py-16 text-center">
          <div className="text-3xl mb-3">{"\uD83D\uDCDD"}</div>
          <h3 className="text-lg font-semibold text-gray-800">No scripts found</h3>
          <p className="text-sm text-gray-400 mt-1">Generate your first script with Clara AI.</p>
          <button
            onClick={function () { setShowGenerate(true); }}
            className="mt-4 rounded-md bg-purple-600 px-5 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            Generate script
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map(function (s) {
            return (
              <div
                key={s.id}
                onClick={function () { setDetailScript(s); setEditMode(false); }}
                className="cursor-pointer rounded-xl border bg-white p-5 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-800">{s.name || "Untitled"}</p>
                    <span className="text-xs text-gray-400">{s.specialty || "General"}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">{LANG_NAMES[s.language] || s.language}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{s.opening || ""}</p>
                <div className="mt-3 flex items-center gap-3 text-[10px] text-gray-400">
                  <span>{(s.qualifying_questions || []).length} questions</span>
                  <span>{(s.value_props || []).length} value props</span>
                  <span>{Object.keys(s.objection_handlers || {}).length} objection handlers</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Starter scripts section */}
      {scripts.length < 6 && scripts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Starter scripts by Clara</h2>
          <p className="text-xs text-gray-400 mb-3">Auto-generated for common specialties. Click to view and customize.</p>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_SPECIALTIES.filter(function (sp) {
              return !scripts.some(function (s) { return s.specialty === sp; });
            }).map(function (sp) {
              return (
                <button
                  key={sp}
                  onClick={function () {
                    setShowGenerate(true);
                  }}
                  className="rounded-md border border-dashed border-purple-300 bg-purple-50 px-4 py-2 text-xs text-purple-600 hover:bg-purple-100"
                >
                  Generate {sp} script
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Script detail modal */}
      {detailScript && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-8 pb-8" onClick={function () { setDetailScript(null); }}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl bg-white shadow-2xl" onClick={function (e) { e.stopPropagation(); }}>
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{detailScript.name}</h3>
                <div className="flex gap-2 mt-1">
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600">{LANG_NAMES[detailScript.language] || detailScript.language}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">{detailScript.specialty}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={function () { setEditMode(!editMode); }} className="rounded-md border px-3 py-1 text-xs text-gray-600 hover:bg-gray-50">
                  {editMode ? "Read only" : "Edit"}
                </button>
                <button onClick={function () { setDetailScript(null); }} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 5l8 8M13 5l-8 8" /></svg>
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Opening */}
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-1">Opening</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{detailScript.opening}</p>
              </div>

              {/* Qualifying questions */}
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-1">Qualifying questions</p>
                <ol className="list-decimal pl-5 text-sm text-gray-600 space-y-1">
                  {(detailScript.qualifying_questions || []).map(function (q: string, i: number) {
                    return <li key={i}>{q}</li>;
                  })}
                </ol>
              </div>

              {/* Value props */}
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-1">Value propositions</p>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                  {(detailScript.value_props || []).map(function (v: string, i: number) {
                    return <li key={i}>{v}</li>;
                  })}
                </ul>
              </div>

              {/* Objection handlers */}
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-1">Objection handlers</p>
                <div className="space-y-2">
                  {Object.entries(detailScript.objection_handlers || {}).map(function ([obj, resp]) {
                    return (
                      <details key={obj} className="group rounded-lg border">
                        <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                          {obj}
                        </summary>
                        <p className="px-3 pb-3 text-sm text-gray-500">{resp as string}</p>
                      </details>
                    );
                  })}
                </div>
              </div>

              {/* Closing */}
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-1">Closing</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{detailScript.closing}</p>
              </div>

              {/* AI disclosure */}
              {detailScript.ai_disclosure && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1">AI disclosure</p>
                  <p className="text-sm text-amber-800">{detailScript.ai_disclosure}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between border-t px-5 py-3">
              <button
                onClick={function () { setDeleteId(detailScript.id); }}
                className="rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
              <div className="flex gap-2">
                <button
                  onClick={function () { setDetailScript(null); setShowGenerate(true); }}
                  className="rounded-md border px-3 py-1.5 text-xs text-purple-600 hover:bg-purple-50"
                >
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={function () { setDeleteId(null); }}>
          <div className="rounded-xl bg-white p-6 shadow-2xl max-w-sm" onClick={function (e) { e.stopPropagation(); }}>
            <h3 className="font-semibold text-gray-900 mb-2">Delete script?</h3>
            <p className="text-sm text-gray-500 mb-4">This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={function () { setDeleteId(null); }} className="rounded-md px-4 py-2 text-sm text-gray-500 hover:bg-gray-100">Cancel</button>
              <button onClick={function () { handleDelete(deleteId!); }} disabled={deleting} className="rounded-md bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600 disabled:opacity-50">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate modal */}
      {showGenerate && (
        <ScriptGenerateModal
          onClose={function () { setShowGenerate(false); }}
          onGenerated={function () { fetchScripts(); }}
        />
      )}
    </div>
  );
}
