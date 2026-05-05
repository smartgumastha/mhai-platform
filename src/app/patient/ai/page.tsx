"use client";

import { useState, useEffect } from "react";
import { patientApi } from "../providers/patient-auth-context";
import { usePatientAuth } from "../providers/patient-auth-context";

export default function PatientAiPage() {
  var { patient } = usePatientAuth();
  var [loading, setLoading] = useState(false);
  var [analysis, setAnalysis] = useState<any>(null);
  var [error, setError] = useState("");

  async function handleAnalyze() {
    setLoading(true);
    setError("");
    try {
      var res: any = await patientApi("/api/patient/ai-analysis", { method: "POST" });
      if (res.success) setAnalysis(res.analysis || res.data);
      else setError(res.message || "AI analysis not available yet.");
    } catch { setError("Network error. Try again."); }
    finally { setLoading(false); }
  }

  var hasChronic = !!(patient?.chronic_conditions);
  var hasMeds    = !!(patient?.current_medications);

  return (
    <div className="px-8 py-6">
      <h1 className="mb-0.5 text-2xl font-bold text-gray-900">AI Health Analysis</h1>
      <p className="mb-6 text-sm text-gray-400">
        AI-powered insights from your EHR records, prescriptions, and health history
      </p>

      {/* Feature overview cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: "📋", label: "EHR Summary", desc: "Plain-language summary of your consultation history" },
          { icon: "💊", label: "Medication Review", desc: "Check for interactions and adherence patterns" },
          { icon: "📈", label: "Health Trends", desc: "Track vitals and conditions over time" },
        ].map(function (f) {
          return (
            <div key={f.label} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="mb-2 text-2xl">{f.icon}</div>
              <div className="text-sm font-semibold text-gray-900">{f.label}</div>
              <div className="mt-0.5 text-xs text-gray-400">{f.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Patient context */}
      {(hasChronic || hasMeds) && (
        <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-600">Health Context on File</div>
          <div className="space-y-2 text-sm">
            {hasChronic && (
              <div>
                <span className="font-semibold text-gray-700">Chronic conditions: </span>
                <span className="text-gray-600">{patient?.chronic_conditions}</span>
              </div>
            )}
            {hasMeds && (
              <div>
                <span className="font-semibold text-gray-700">Current medications: </span>
                <span className="text-gray-600">{patient?.current_medications}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      {!analysis && (
        <div className="rounded-2xl border border-dashed border-[#1ba3d6]/40 bg-[#1ba3d6]/5 py-16 text-center">
          <div className="mb-3 text-5xl">✦</div>
          <div className="mb-2 text-base font-semibold text-gray-700">
            Generate Your AI Health Summary
          </div>
          <div className="mx-auto mb-6 max-w-xs text-xs text-gray-400">
            Our AI will analyze your visit records, prescriptions, and health history to generate a personalized health summary
          </div>
          {error && (
            <div className="mx-auto mb-4 max-w-sm rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1ba3d6] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0e7ba8] disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Analyzing…
              </>
            ) : (
              "✦ Analyze my health records"
            )}
          </button>
        </div>
      )}

      {/* Analysis result */}
      {analysis && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-700">AI Health Summary</div>
            <button
              onClick={function () { setAnalysis(null); }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          </div>

          {typeof analysis === "string" ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm leading-relaxed text-gray-700">
              {analysis}
            </div>
          ) : (
            Object.entries(analysis).map(function ([key, val]) {
              return (
                <div key={key} className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                    {key.replace(/_/g, " ")}
                  </div>
                  <p className="text-sm leading-relaxed text-gray-700">{String(val)}</p>
                </div>
              );
            })
          )}

          <div className="text-center text-xs text-gray-300">
            AI-generated summary · Not a substitute for medical advice
          </div>
        </div>
      )}
    </div>
  );
}
