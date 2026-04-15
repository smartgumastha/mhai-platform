"use client";

import { useState, useEffect } from "react";
import { getBrandSettings, saveBrandSettings } from "@/lib/api";

var colorOptions = [
  { hex: "#10b981", name: "emerald" },
  { hex: "#3b82f6", name: "blue" },
  { hex: "#8b5cf6", name: "violet" },
  { hex: "#ef4444", name: "red" },
  { hex: "#f59e0b", name: "amber" },
  { hex: "#ec4899", name: "pink" },
  { hex: "#06b6d4", name: "cyan" },
  { hex: "#1e293b", name: "slate" },
];

var toneOptions = [
  "Warm + professional",
  "Formal + clinical",
  "Friendly + casual",
  "Authoritative + expert",
];

var specialtyOptions = [
  "Physiotherapy",
  "Orthopedics",
  "General Medicine",
  "Dentistry",
  "Diagnostics",
  "Dermatology",
  "Pediatrics",
  "Cardiology",
  "Ophthalmology",
];

var allServices = [
  "Sports rehab",
  "Back pain",
  "Knee rehab",
  "Post-surgery",
  "Neck pain",
  "Neuro rehab",
  "Pediatric",
  "Geriatric",
  "Women's health",
];

var defaultOnServices = [
  "Sports rehab",
  "Back pain",
  "Knee rehab",
  "Post-surgery",
  "Neck pain",
];

var allLanguages = [
  "English",
  "Hindi",
  "Telugu",
  "Tamil",
  "Kannada",
  "Marathi",
  "Arabic",
  "Swahili",
  "French",
  "German",
];

var defaultOnLanguages = ["English", "Hindi", "Telugu"];

var allAccreditations = ["NABH", "NABL", "JCI", "HIPAA", "HCPC", "ISO 27001"];
var defaultOnAccreditations = ["NABH"];

var allInsurance = [
  "Star Health",
  "ICICI Lombard",
  "CGHS",
  "BUPA",
  "Aetna",
  "NHIF",
];
var defaultOnInsurance = ["Star Health", "ICICI Lombard", "CGHS"];

var complianceOptions = [
  "India — NMC guidelines",
  "US — HIPAA + FTC",
  "UK — HCPC + ASA",
  "UAE — DHA",
  "Kenya — KMPDC",
];

type BrandDNA = {
  clinicName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  primaryColor: string;
  tone: string;
  voiceNotes: string;
  specialty: string;
  services: string[];
  languages: string[];
  accreditations: string[];
  compliance: string;
  insurance: string[];
};

var defaults: BrandDNA = {
  clinicName: "Kamakya Physiotherapy Clinic",
  tagline: "Move better. Live better.",
  phone: "+91 95530 53446",
  email: "kamakya@clinic.com",
  address: "3rd Floor, Banjara Hills Road No. 12, Hyderabad 500034",
  primaryColor: "#10b981",
  tone: "Warm + professional",
  voiceNotes:
    "Always mention evidence-based physiotherapy. Use patient-first language. Sign off as 'Team Kamakya'.",
  specialty: "Physiotherapy",
  services: [...defaultOnServices],
  languages: [...defaultOnLanguages],
  accreditations: [...defaultOnAccreditations],
  compliance: "India — NMC guidelines",
  insurance: [...defaultOnInsurance],
};

function darken(hex: string): string {
  var r = parseInt(hex.slice(1, 3), 16);
  var g = parseInt(hex.slice(3, 5), 16);
  var b = parseInt(hex.slice(5, 7), 16);
  r = Math.round(r * 0.35);
  g = Math.round(g * 0.35);
  b = Math.round(b * 0.35);
  return (
    "#" +
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    b.toString(16).padStart(2, "0")
  );
}

function lighten(hex: string): string {
  var r = parseInt(hex.slice(1, 3), 16);
  var g = parseInt(hex.slice(3, 5), 16);
  var b = parseInt(hex.slice(5, 7), 16);
  r = Math.round(r + (255 - r) * 0.85);
  g = Math.round(g + (255 - g) * 0.85);
  b = Math.round(b + (255 - b) * 0.85);
  return (
    "#" +
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    b.toString(16).padStart(2, "0")
  );
}

function PillSelector({
  items,
  selected,
  onToggle,
  addLabel,
}: {
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  addLabel?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        var on = selected.includes(item);
        return (
          <button
            key={item}
            onClick={() => onToggle(item)}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs transition-all duration-200 ${
              on
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {item}
          </button>
        );
      })}
      {addLabel && (
        <button className="cursor-pointer rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-500 transition-all duration-200 hover:border-gray-400 hover:text-gray-600">
          {addLabel}
        </button>
      )}
    </div>
  );
}

export default function BrandDNAPage() {
  var [data, setData] = useState<BrandDNA>(defaults);
  var [loaded, setLoaded] = useState(false);
  var [saving, setSaving] = useState(false);
  var [completeness, setCompleteness] = useState(0);

  useEffect(() => {
    getBrandSettings()
      .then((res) => {
        if (res.success && res.data) {
          setData({ ...defaults, ...res.data });
          if (res.completeness != null) setCompleteness(res.completeness);
          localStorage.setItem("mhai_brand_dna", JSON.stringify(res.data));
        } else {
          // API returned no data — fall back to localStorage cache
          try {
            var stored = localStorage.getItem("mhai_brand_dna");
            if (stored) setData({ ...defaults, ...JSON.parse(stored) });
          } catch {}
        }
      })
      .catch(() => {
        // Network error — fall back to localStorage cache
        try {
          var stored = localStorage.getItem("mhai_brand_dna");
          if (stored) setData({ ...defaults, ...JSON.parse(stored) });
        } catch {}
      })
      .finally(() => setLoaded(true));
  }, []);

  function update<K extends keyof BrandDNA>(key: K, value: BrandDNA[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function toggleList(
    key: "services" | "languages" | "accreditations" | "insurance",
    item: string
  ) {
    setData((prev) => {
      var list = prev[key];
      return {
        ...prev,
        [key]: list.includes(item)
          ? list.filter((x) => x !== item)
          : [...list, item],
      };
    });
  }

  async function save() {
    setSaving(true);
    try {
      var res = await saveBrandSettings(data);
      if (res.success) {
        localStorage.setItem("mhai_brand_dna", JSON.stringify(data));
        if (res.completeness != null) setCompleteness(res.completeness);
        alert("Brand DNA saved!");
      } else {
        alert(res.error || res.message || "Failed to save. Please try again.");
      }
    } catch {
      // Network failed — save to localStorage so data isn't lost
      localStorage.setItem("mhai_brand_dna", JSON.stringify(data));
      alert("Saved locally — will sync when connection is restored.");
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return null;

  var inputClass =
    "w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

  return (
    <div className="px-8 py-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-gray-900">
            Brand DNA
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Teach your AI engine who you are — it uses this for every piece of
            content it creates
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="cursor-pointer rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      {/* Completeness banner */}
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-3 shadow-sm">
        <div>
          <div className="text-xs font-medium text-emerald-800">
            Brand DNA completeness: {completeness}%
          </div>
          <div className="text-[11px] text-emerald-700">
            Complete all sections to unlock full AI personalization
          </div>
        </div>
        <div className="h-2 w-28 rounded-full bg-emerald-100">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: completeness + "%" }} />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-4">
          {/* Card 1: Clinic identity */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="mb-1 text-sm font-medium tracking-tight text-gray-900">
              Clinic identity
            </div>
            <div className="mb-3 text-[11px] text-gray-500">
              Core info used across all channels
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-500">
                Clinic name
              </label>
              <input
                className={inputClass}
                value={data.clinicName}
                onChange={(e) => update("clinicName", e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-500">
                Tagline
              </label>
              <input
                className={inputClass}
                placeholder="e.g. Where healing begins"
                value={data.tagline}
                onChange={(e) => update("tagline", e.target.value)}
              />
            </div>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Phone
                </label>
                <input
                  className={inputClass}
                  value={data.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Email
                </label>
                <input
                  className={inputClass}
                  value={data.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-500">
                Address
              </label>
              <textarea
                className={inputClass + " resize-none"}
                rows={2}
                value={data.address}
                onChange={(e) => update("address", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Logo</label>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-[11px] text-gray-400">
                  KP
                </div>
                <button className="cursor-pointer rounded border border-gray-300 px-3 py-1 text-[11px] text-gray-700 transition-all duration-200 hover:bg-gray-50">
                  Upload logo
                </button>
                <span className="text-[11px] text-gray-400">or</span>
                <button className="cursor-pointer rounded border border-emerald-500 bg-emerald-50 px-3 py-1 text-[11px] text-emerald-700 transition-all duration-200 hover:bg-emerald-100">
                  AI generate logo
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Brand colors */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="mb-1 text-sm font-medium tracking-tight text-gray-900">
              Brand colors
            </div>
            <div className="mb-3 text-[11px] text-gray-500">
              Used in website, social posts, and print materials
            </div>

            <label className="mb-1 block text-xs text-gray-500">
              Primary color
            </label>
            <div className="flex items-center gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => update("primaryColor", c.hex)}
                  className={`h-8 w-8 cursor-pointer rounded-lg transition-transform duration-200 hover:scale-110 ${
                    data.primaryColor === c.hex
                      ? "ring-2 ring-gray-900 ring-offset-2"
                      : ""
                  }`}
                  style={{ background: c.hex }}
                />
              ))}
              <button className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-400 transition-all duration-200 hover:border-gray-400">
                +
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <div
                className="flex h-9 flex-1 items-center justify-center rounded-lg text-[11px] font-medium text-white"
                style={{ background: data.primaryColor }}
              >
                Primary
              </div>
              <div
                className="flex h-9 flex-1 items-center justify-center rounded-lg text-[11px] font-medium text-white"
                style={{ background: darken(data.primaryColor) }}
              >
                Dark
              </div>
              <div
                className="flex h-9 flex-1 items-center justify-center rounded-lg text-[11px] font-medium"
                style={{
                  background: lighten(data.primaryColor),
                  color: darken(data.primaryColor),
                }}
              >
                Light
              </div>
            </div>
          </div>

          {/* Card 3: Tone of voice */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="mb-1 text-sm font-medium tracking-tight text-gray-900">
              Tone of voice
            </div>
            <div className="mb-3 text-[11px] text-gray-500">
              How your AI sounds when it writes for you
            </div>

            <div className="flex flex-wrap gap-2">
              {toneOptions.map((t) => (
                <button
                  key={t}
                  onClick={() => update("tone", t)}
                  className={`cursor-pointer rounded-md px-3 py-1.5 text-xs transition-all duration-200 ${
                    data.tone === t
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-xs text-gray-500">
                Custom voice notes
              </label>
              <textarea
                className={inputClass + " resize-none"}
                rows={2}
                placeholder="e.g. Always mention evidence-based treatment..."
                value={data.voiceNotes}
                onChange={(e) => update("voiceNotes", e.target.value)}
              />
            </div>

            <div className="mt-3 rounded-lg border-l-2 border-emerald-500 bg-gray-50 p-3">
              <div className="mb-1 text-[11px] text-gray-500">
                AI preview — Google review reply in your voice:
              </div>
              <div className="text-xs leading-relaxed text-gray-900">
                &ldquo;Thank you for trusting Kamakya Physiotherapy, Priya!
                We&apos;re glad the evidence-based approach helped with your
                recovery. Looking forward to your next milestone. — Team
                Kamakya&rdquo;
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-4">
          {/* Card 4: Specialties + services */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="mb-1 text-sm font-medium tracking-tight text-gray-900">
              Specialties + services
            </div>
            <div className="mb-3 text-[11px] text-gray-500">
              Used for SEO, ad targeting, and content generation
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-500">
                Primary specialty
              </label>
              <select
                className={inputClass}
                value={data.specialty}
                onChange={(e) => update("specialty", e.target.value)}
              >
                {specialtyOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <label className="mb-1 block text-xs text-gray-500">
              Services
            </label>
            <PillSelector
              items={allServices}
              selected={data.services}
              onToggle={(s) => toggleList("services", s)}
              addLabel="＋ Add custom"
            />

            <div className="mt-3 rounded-lg bg-gray-50 p-2">
              <div className="text-[11px] text-gray-500">
                AI-generated SEO keywords (auto-updated)
              </div>
              <div className="mt-1 text-[11px] leading-relaxed text-gray-500">
                physiotherapy Hyderabad | sports physio Banjara Hills | back pain
                specialist near me | knee rehab Hyderabad | post surgery
                physiotherapy | best physio clinic Hyderabad
              </div>
            </div>
          </div>

          {/* Card 5: Doctor profiles */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="mb-1 text-sm font-medium tracking-tight text-gray-900">
              Doctor profiles
            </div>
            <div className="mb-3 text-[11px] text-gray-500">
              Featured in website, social posts, and Google profile
            </div>

            <div className="mb-2 flex items-center gap-3 rounded-lg bg-gray-50 p-2.5 transition-all duration-200 hover:shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-sm font-medium text-white shadow-sm">
                SK
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  Dr. Sai Kumar
                </div>
                <div className="text-[11px] text-gray-500">
                  BPT, MPT Ortho | 8 years exp.
                </div>
              </div>
              <button className="cursor-pointer rounded border border-gray-300 px-2.5 py-1 text-[11px] text-gray-700 transition-all duration-200 hover:bg-gray-100">
                Edit
              </button>
            </div>
            <button className="w-full cursor-pointer rounded-md border border-dashed border-gray-300 py-2 text-xs text-gray-500 transition-all duration-200 hover:border-gray-400 hover:text-gray-600">
              ＋ Add doctor profile
            </button>
          </div>

          {/* Card 6: Languages */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="mb-1 text-sm font-medium tracking-tight text-gray-900">
              Languages
            </div>
            <div className="mb-3 text-[11px] text-gray-500">
              AI generates content in these languages
            </div>
            <PillSelector
              items={allLanguages}
              selected={data.languages}
              onToggle={(l) => toggleList("languages", l)}
            />
          </div>

          {/* Card 7: Compliance + accreditations */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm font-medium tracking-tight text-gray-900">
                Compliance + accreditations
              </span>
              <span className="rounded bg-purple-600 px-2 py-0.5 text-[9px] font-medium text-white">
                Intelligence
              </span>
            </div>
            <div className="mb-3 text-[11px] text-gray-500">
              AI avoids prohibited claims and adds required disclaimers
            </div>

            <label className="mb-1 block text-xs text-gray-500">
              Accreditations
            </label>
            <div className="flex flex-wrap gap-2">
              {allAccreditations.map((a) => {
                var on = data.accreditations.includes(a);
                return (
                  <button
                    key={a}
                    onClick={() => toggleList("accreditations", a)}
                    className={`cursor-pointer rounded-md border px-3 py-1.5 text-xs transition-all duration-200 ${
                      on
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                        : "border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-xs text-gray-500">
                Ad compliance ruleset
              </label>
              <select
                className={inputClass}
                value={data.compliance}
                onChange={(e) => update("compliance", e.target.value)}
              >
                {complianceOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Card 8: Insurance panels */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm font-medium tracking-tight text-gray-900">
                Insurance panels
              </span>
              <span className="rounded bg-blue-600 px-2 py-0.5 text-[9px] font-medium text-white">
                HMS
              </span>
            </div>
            <div className="mb-3 text-[11px] text-gray-500">
              Displayed on website and used in patient communications
            </div>
            <PillSelector
              items={allInsurance}
              selected={data.insurance}
              onToggle={(i) => toggleList("insurance", i)}
              addLabel="＋ Add TPA / insurer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
