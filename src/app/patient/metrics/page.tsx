"use client";

import { useState, useEffect } from "react";
import { patientApi } from "../providers/patient-auth-context";
import { useLocale } from "@/app/providers/locale-context";

// ── Locale unit config ──────────────────────────────────────
// Each metric has a preferred unit per locale group
type CountryCode = "IN" | "AE" | "GB" | "US";

var GLUCOSE_UNIT = function (cc: CountryCode) { return cc === "US" ? "mg/dL" : "mmol/L"; };
var WEIGHT_UNIT  = function (cc: CountryCode) { return cc === "US" ? "lb" : "kg"; };
var HEIGHT_UNIT  = function (cc: CountryCode) { return cc === "US" ? "in" : "cm"; };
var TEMP_UNIT    = function (cc: CountryCode) { return cc === "US" ? "°F" : "°C"; };
var CHOL_UNIT    = function (cc: CountryCode) { return cc === "US" ? "mg/dL" : "mmol/L"; };

function fmtDate(epoch: number | string, cc: CountryCode): string {
  try {
    var d = typeof epoch === "number" ? new Date(epoch) : new Date(epoch);
    if (isNaN(d.getTime())) return String(epoch);
    var locale = cc === "US" ? "en-US" : cc === "AE" ? "ar-AE" : "en-GB";
    return d.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
  } catch { return String(epoch); }
}

function fmtTime(epoch: number | string): string {
  try {
    var d = typeof epoch === "number" ? new Date(epoch) : new Date(epoch);
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

// ── Metric type config ──────────────────────────────────────
type MetricKey = "bp" | "glucose" | "weight" | "height" | "spo2" | "heart_rate" | "temperature" | "hba1c" | "cholesterol";

type MetricConfig = {
  label: string;
  icon: string;
  inputType: "single" | "dual";
  unit: (cc: CountryCode) => string;
  unit2?: string;
  placeholder: string;
  placeholder2?: string;
  normal?: string;
  color: string;
  bgColor: string;
  borderColor: string;
  chartColor: string;
  min: number;
  max: number;
};

var METRICS: Record<MetricKey, MetricConfig> = {
  bp: {
    label: "Blood Pressure", icon: "❤️", inputType: "dual",
    unit: function () { return "mmHg"; }, unit2: "mmHg",
    placeholder: "Systolic (e.g. 120)", placeholder2: "Diastolic (e.g. 80)",
    normal: "90–120 / 60–80 mmHg",
    color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200", chartColor: "#ef4444",
    min: 60, max: 180,
  },
  glucose: {
    label: "Blood Glucose", icon: "🩸", inputType: "single",
    unit: GLUCOSE_UNIT,
    placeholder: "e.g. 5.5 mmol/L or 99 mg/dL",
    normal: "4.0–7.8 mmol/L  ·  72–140 mg/dL",
    color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-200", chartColor: "#f97316",
    min: 2, max: 20,
  },
  weight: {
    label: "Weight", icon: "⚖️", inputType: "single",
    unit: WEIGHT_UNIT,
    placeholder: "e.g. 70",
    color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200", chartColor: "#3b82f6",
    min: 10, max: 300,
  },
  height: {
    label: "Height", icon: "📏", inputType: "single",
    unit: HEIGHT_UNIT,
    placeholder: "e.g. 170",
    color: "text-indigo-600", bgColor: "bg-indigo-50", borderColor: "border-indigo-200", chartColor: "#6366f1",
    min: 50, max: 250,
  },
  spo2: {
    label: "SpO₂ (Oxygen)", icon: "💨", inputType: "single",
    unit: function () { return "%"; },
    placeholder: "e.g. 98",
    normal: "95–100%",
    color: "text-teal-600", bgColor: "bg-teal-50", borderColor: "border-teal-200", chartColor: "#14b8a6",
    min: 80, max: 100,
  },
  heart_rate: {
    label: "Heart Rate", icon: "🫀", inputType: "single",
    unit: function () { return "bpm"; },
    placeholder: "e.g. 72",
    normal: "60–100 bpm",
    color: "text-pink-600", bgColor: "bg-pink-50", borderColor: "border-pink-200", chartColor: "#ec4899",
    min: 30, max: 220,
  },
  temperature: {
    label: "Temperature", icon: "🌡️", inputType: "single",
    unit: TEMP_UNIT,
    placeholder: "e.g. 36.8",
    normal: "36.1–37.2 °C  ·  97–99 °F",
    color: "text-yellow-600", bgColor: "bg-yellow-50", borderColor: "border-yellow-200", chartColor: "#eab308",
    min: 30, max: 45,
  },
  hba1c: {
    label: "HbA1c", icon: "🔬", inputType: "single",
    unit: function () { return "%"; },
    placeholder: "e.g. 5.8",
    normal: "< 5.7% normal  ·  5.7–6.4% pre-diabetes",
    color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-200", chartColor: "#a855f7",
    min: 3, max: 15,
  },
  cholesterol: {
    label: "Cholesterol", icon: "💉", inputType: "single",
    unit: CHOL_UNIT,
    placeholder: "Total cholesterol",
    normal: "< 5.2 mmol/L  ·  < 200 mg/dL",
    color: "text-gray-600", bgColor: "bg-gray-50", borderColor: "border-gray-200", chartColor: "#6b7280",
    min: 1, max: 15,
  },
};

var METRIC_KEYS = Object.keys(METRICS) as MetricKey[];

// ── SVG Sparkline ───────────────────────────────────────────
function Sparkline({ values, color, w = 160, h = 40 }: { values: number[]; color: string; w?: number; h?: number }) {
  if (values.length < 2) return <div style={{ width: w, height: h }} />;
  var min = Math.min(...values);
  var max = Math.max(...values);
  var range = max - min || 1;
  var pad = 3;
  var pts = values.map(function (v, i) {
    var x = pad + (i / (values.length - 1)) * (w - pad * 2);
    var y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return [x, y];
  });
  var d = pts.map(function (p, i) { return (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
  var areaD = d + " L" + pts[pts.length - 1][0].toFixed(1) + " " + (h - pad) + " L" + pts[0][0].toFixed(1) + " " + (h - pad) + " Z";
  return (
    <svg width={w} height={h} viewBox={"0 0 " + w + " " + h} className="overflow-visible">
      <defs>
        <linearGradient id={"sg-" + color.replace("#", "")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={"url(#sg-" + color.replace("#", "") + ")"} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts[pts.length - 1] && (
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={color} />
      )}
    </svg>
  );
}

// ── Log Modal ───────────────────────────────────────────────
function LogModal({ cc, defaultType, onClose, onSaved }: { cc: CountryCode; defaultType: MetricKey; onClose: () => void; onSaved: () => void }) {
  var [type, setType] = useState<MetricKey>(defaultType);
  var [val1, setVal1] = useState("");
  var [val2, setVal2] = useState("");
  var [measuredAt, setMeasuredAt] = useState(
    new Date().toISOString().slice(0, 16) // "YYYY-MM-DDTHH:MM"
  );
  var [notes, setNotes] = useState("");
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState("");

  var cfg = METRICS[type];
  var unit = cfg.unit(cc);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    var n1 = parseFloat(val1);
    if (isNaN(n1)) { setError("Enter a valid number."); return; }
    if (cfg.inputType === "dual" && !val2) { setError("Enter diastolic value."); return; }
    var n2 = cfg.inputType === "dual" ? parseFloat(val2) : undefined;
    if (cfg.inputType === "dual" && isNaN(n2!)) { setError("Enter a valid diastolic number."); return; }

    var label = cfg.inputType === "dual"
      ? n1 + "/" + n2 + " " + unit
      : n1 + " " + unit;

    setLoading(true);
    setError("");
    try {
      var res: any = await patientApi("/api/patient/metrics", {
        method: "POST",
        body: JSON.stringify({
          metric_type: type,
          value_num: n1,
          value_num2: n2 ?? null,
          value_unit: unit,
          value_label: label,
          notes: notes.trim() || null,
          measured_at: new Date(measuredAt).getTime(),
        }),
      });
      if (res.success) { onSaved(); onClose(); }
      else setError(res.message || "Failed to save.");
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Log Reading</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSave} className="space-y-4 p-6">
          {/* Type selector */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Metric</label>
            <select
              value={type}
              onChange={function (e) { setType(e.target.value as MetricKey); setVal1(""); setVal2(""); setError(""); }}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#1ba3d6] focus:outline-none"
            >
              {METRIC_KEYS.map(function (k) {
                return <option key={k} value={k}>{METRICS[k].icon} {METRICS[k].label}</option>;
              })}
            </select>
          </div>

          {/* Value inputs */}
          {cfg.inputType === "dual" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">Systolic ({unit})</label>
                <input type="number" value={val1} onChange={function (e) { setVal1(e.target.value); }}
                  placeholder="120" step="any"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#1ba3d6] focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">Diastolic ({unit})</label>
                <input type="number" value={val2} onChange={function (e) { setVal2(e.target.value); }}
                  placeholder="80" step="any"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#1ba3d6] focus:outline-none" />
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Value ({unit})</label>
              <input type="number" value={val1} onChange={function (e) { setVal1(e.target.value); }}
                placeholder={cfg.placeholder} step="any"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#1ba3d6] focus:outline-none" required />
              {cfg.normal && <p className="mt-1 text-[11px] text-gray-400">Normal: {cfg.normal}</p>}
            </div>
          )}

          {/* Date & time */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Measured at</label>
            <input type="datetime-local" value={measuredAt} onChange={function (e) { setMeasuredAt(e.target.value); }}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#1ba3d6] focus:outline-none" />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Notes (optional)</label>
            <input type="text" value={notes} onChange={function (e) { setNotes(e.target.value); }}
              placeholder="e.g. fasting, after exercise…"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#1ba3d6] focus:outline-none" />
          </div>

          {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-[#1ba3d6] py-3 text-sm font-bold text-white transition-colors hover:bg-[#0e7ba8] disabled:opacity-50">
            {loading ? "Saving…" : "Save Reading"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────
export default function PatientMetricsPage() {
  var { localeV2 } = useLocale();
  var cc = (localeV2?.country_code || "IN") as CountryCode;

  var [allMetrics, setAllMetrics] = useState<any[]>([]);
  var [latest, setLatest] = useState<Record<string, any>>({});
  var [selected, setSelected] = useState<MetricKey>("bp");
  var [showLog, setShowLog] = useState(false);
  var [logType, setLogType] = useState<MetricKey>("bp");
  var [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      var res: any = await patientApi("/api/patient/metrics");
      if (res.success) {
        setAllMetrics(res.metrics || []);
        setLatest(res.latest || {});
      }
    } catch {} finally { setLoading(false); }
  }

  useEffect(function () { load(); }, []);

  async function handleDelete(metricId: string) {
    if (!confirm("Delete this reading?")) return;
    try {
      var res: any = await patientApi("/api/patient/metrics/" + metricId, { method: "DELETE" });
      if (res.success) load();
    } catch {}
  }

  // Readings for selected type (ascending for chart, descending for list)
  var typeReadings = allMetrics.filter(function (m) { return m.metric_type === selected; });
  var chartVals = typeReadings.slice(0, 30).reverse().map(function (m) { return Number(m.value_num); });
  var cfg = METRICS[selected];

  function openLog(k: MetricKey) {
    setLogType(k);
    setShowLog(true);
  }

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="mb-0.5 text-2xl font-bold text-gray-900">Health Metrics</h1>
          <p className="text-sm text-gray-400">Track your vitals over time — locale units auto-applied ({cc})</p>
        </div>
        <button
          onClick={function () { openLog(selected); }}
          className="flex items-center gap-2 rounded-xl bg-[#1ba3d6] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#0e7ba8]"
        >
          + Log Reading
        </button>
      </div>

      {/* Summary cards — one per metric type */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {METRIC_KEYS.map(function (k) {
          var c   = METRICS[k];
          var lat = latest[k];
          var isSelected = selected === k;
          return (
            <button
              key={k}
              onClick={function () { setSelected(k); }}
              className={"rounded-2xl border p-4 text-left transition-all " +
                (isSelected
                  ? c.bgColor + " " + c.borderColor + " ring-2 ring-offset-1 " + c.borderColor.replace("border-", "ring-")
                  : "border-gray-100 bg-white hover:border-gray-200")}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xl">{c.icon}</span>
                {lat && (
                  <button
                    onClick={function (e) { e.stopPropagation(); openLog(k); }}
                    className="rounded-lg p-1 text-[10px] text-gray-400 hover:bg-gray-100"
                    title="Log new reading"
                  >＋</button>
                )}
              </div>
              <div className={"text-[11px] font-semibold uppercase tracking-wider " + (isSelected ? c.color : "text-gray-400")}>
                {c.label}
              </div>
              {lat ? (
                <>
                  <div className={"mt-1 text-lg font-bold " + (isSelected ? c.color : "text-gray-700")}>
                    {lat.value_label || lat.value_num + " " + lat.value_unit}
                  </div>
                  <div className="mt-0.5 text-[10px] text-gray-400">{fmtDate(Number(lat.measured_at), cc)}</div>
                </>
              ) : (
                <div className="mt-1 text-sm text-gray-300">No data</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Chart + history for selected metric */}
      <div className="rounded-2xl border border-gray-100 bg-white">
        {/* Chart header */}
        <div className={"rounded-t-2xl border-b px-6 py-4 " + cfg.bgColor + " " + cfg.borderColor.replace("border-", "border-b-")}>
          <div className="flex items-center justify-between">
            <div>
              <div className={"text-sm font-bold " + cfg.color}>{cfg.icon} {cfg.label}</div>
              {cfg.normal && <div className="mt-0.5 text-[11px] text-gray-500">Normal: {cfg.normal}</div>}
            </div>
            <div className="text-right">
              {chartVals.length > 0 ? (
                <Sparkline values={chartVals} color={cfg.chartColor} w={160} h={48} />
              ) : (
                <div className="flex h-12 w-40 items-center justify-center rounded-xl border border-dashed border-gray-200 text-xs text-gray-300">
                  No data yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* History list */}
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-300">Loading…</div>
          ) : typeReadings.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mb-2 text-4xl">{cfg.icon}</div>
              <div className="text-sm font-semibold text-gray-500">No {cfg.label} readings yet</div>
              <div className="mt-1 text-xs text-gray-400">Log your first reading to start tracking</div>
              <button
                onClick={function () { openLog(selected); }}
                className={"mt-4 inline-flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-bold text-white " + cfg.bgColor.replace("bg-", "bg-").replace("50", "500") + " hover:opacity-90"}
                style={{ backgroundColor: cfg.chartColor }}
              >
                + Log {cfg.label}
              </button>
            </div>
          ) : (
            typeReadings.slice(0, 50).map(function (m) {
              return (
                <div key={m.metric_id} className="flex items-center justify-between px-6 py-3.5">
                  <div className="flex items-center gap-4">
                    <div className={"flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-lg " + cfg.bgColor}>
                      {cfg.icon}
                    </div>
                    <div>
                      <div className={"text-sm font-bold " + cfg.color}>{m.value_label || m.value_num + " " + m.value_unit}</div>
                      <div className="text-[11px] text-gray-400">
                        {fmtDate(Number(m.measured_at), cc)} · {fmtTime(Number(m.measured_at))}
                        {m.notes && <span className="ml-2 text-gray-300">· {m.notes}</span>}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={function () { handleDelete(m.metric_id); }}
                    className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              );
            })
          )}
        </div>

        {typeReadings.length > 0 && (
          <div className="rounded-b-2xl border-t border-gray-50 px-6 py-3 text-[11px] text-gray-300">
            {typeReadings.length} reading{typeReadings.length !== 1 ? "s" : ""} · showing latest 50
          </div>
        )}
      </div>

      {showLog && (
        <LogModal
          cc={cc}
          defaultType={logType}
          onClose={function () { setShowLog(false); }}
          onSaved={load}
        />
      )}
    </div>
  );
}
