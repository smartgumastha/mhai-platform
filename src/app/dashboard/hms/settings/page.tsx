"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/app/providers/auth-context";
import { getToken } from "@/lib/api";

var STORAGE_KEY = "mhai_hms_print_prefs";

type HmsPrintPrefs = {
  rx_paper_size: "A4" | "A5";
  doctor_qualification: string;
  custom_footer: string;
  show_vitals: boolean;
  show_subjective: boolean;
  show_diagnosis: boolean;
  show_objective: boolean;
  show_plan: boolean;
  show_allergies: boolean;
  show_followup: boolean;
};

var DEFAULTS: HmsPrintPrefs = {
  rx_paper_size: "A4",
  doctor_qualification: "",
  custom_footer: "",
  show_vitals: true,
  show_subjective: true,
  show_diagnosis: true,
  show_objective: true,
  show_plan: true,
  show_allergies: true,
  show_followup: true,
};

function ToggleRow({
  label,
  sub,
  checked,
  onChange,
}: {
  label: string;
  sub?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-paper-soft/50 px-4 py-3 hover:bg-paper-soft">
      <div className="relative mt-0.5 flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={function (e) { onChange(e.target.checked); }}
          className="sr-only"
        />
        <div className={"h-5 w-9 rounded-full transition-colors " + (checked ? "bg-coral" : "bg-line")}>
          <div className={"absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform " + (checked ? "translate-x-4" : "translate-x-0.5")} />
        </div>
      </div>
      <div>
        <div className="text-sm font-medium text-ink">{label}</div>
        {sub && <div className="mt-0.5 text-xs text-text-muted">{sub}</div>}
      </div>
    </label>
  );
}

export default function HmsSettingsPage() {
  var { user } = useAuth();
  var hospitalId = user?.hospital_id || "";
  var [prefs, setPrefs] = useState<HmsPrintPrefs>({ ...DEFAULTS });
  var [clinicPrefs, setClinicPrefs] = useState<any>(null);
  var [saved, setSaved] = useState(false);
  var [loadingClinic, setLoadingClinic] = useState(true);

  // Load saved prefs from localStorage
  useEffect(function () {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setPrefs(Object.assign({}, DEFAULTS, JSON.parse(raw)));
      }
    } catch {}
  }, []);

  // Load clinic branding from billing-preferences
  useEffect(function () {
    if (!hospitalId) return;
    var tok = getToken();
    if (!tok) { setLoadingClinic(false); return; }
    fetch("/api/presence/partners/" + hospitalId + "/billing-preferences", {
      headers: { Authorization: "Bearer " + tok },
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.success) setClinicPrefs(d.clinic_preferences || {});
      })
      .catch(function () {})
      .finally(function () { setLoadingClinic(false); });
  }, [hospitalId]);

  function update<K extends keyof HmsPrintPrefs>(key: K, val: HmsPrintPrefs[K]) {
    setPrefs(function (p) { return { ...p, [key]: val }; });
    setSaved(false);
  }

  function handleSave() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      setSaved(true);
      setTimeout(function () { setSaved(false); }, 2500);
    } catch {}
  }

  function handleReset() {
    setPrefs({ ...DEFAULTS });
    setSaved(false);
  }

  var clinic = clinicPrefs || {};
  var hasBranding = !!(clinic.logo_url || clinic.letterhead_url || clinic.default_signature_url);

  return (
    <div className="px-8 py-6">
      {/* Breadcrumb */}
      <nav className="mb-3 flex items-center gap-1.5 text-xs text-text-muted">
        <Link href="/dashboard" className="hover:text-coral-deep">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/hms" className="hover:text-coral-deep">HMS</Link>
        <span>/</span>
        <span className="text-ink">Settings</span>
      </nav>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-fraunces text-3xl font-light tracking-tight text-ink">
            HMS <em className="italic text-coral-deep">settings.</em>
          </h1>
          <p className="mt-1 max-w-xl text-sm text-text-muted">
            Configure prescription layout, sections to print, and doctor details. Settings are saved to this browser.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="rounded-lg border border-line px-4 py-2.5 text-sm text-text-dim hover:bg-paper-soft"
          >
            Reset defaults
          </button>
          <button
            onClick={handleSave}
            className={"rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors " + (saved ? "bg-emerald-600" : "bg-coral hover:bg-coral-deep")}
          >
            {saved ? "Saved ✓" : "Save settings"}
          </button>
        </div>
      </div>

      <div className="space-y-5">

        {/* ── Clinic Branding ── */}
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line-soft px-6 py-5">
            <div>
              <div className="font-fraunces text-lg text-ink">
                Clinic <em className="italic text-coral-deep">branding</em>
              </div>
              <div className="mt-0.5 text-xs text-text-muted">
                Logo, letterhead image, and doctor signature printed on every Rx, sick note, and referral.
              </div>
            </div>
            <Link
              href="/dashboard/settings/billing-preferences"
              className="rounded-lg border border-coral/30 bg-coral/5 px-4 py-2 text-sm font-medium text-coral-deep hover:bg-coral/10"
            >
              Manage branding →
            </Link>
          </div>
          {loadingClinic ? (
            <div className="px-6 py-4 text-sm text-text-muted">Loading…</div>
          ) : (
            <div className="px-6 py-5">
              {hasBranding ? (
                <div className="grid grid-cols-3 gap-4">
                  {clinic.logo_url && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">Logo</div>
                      <img src={clinic.logo_url} alt="" className="h-10 max-w-full object-contain" />
                    </div>
                  )}
                  {clinic.letterhead_url && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">Letterhead</div>
                      <img src={clinic.letterhead_url} alt="" className="h-10 max-w-full object-contain" />
                    </div>
                  )}
                  {clinic.default_signature_url && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">Signature</div>
                      <img src={clinic.default_signature_url} alt="" className="h-10 max-w-full object-contain" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-line bg-paper-soft py-8 text-center">
                  <div className="mb-1 text-sm font-medium text-ink">No branding uploaded yet</div>
                  <div className="mb-3 text-xs text-text-muted">Upload your logo, clinic letterhead, and doctor signature to appear on prescriptions.</div>
                  <Link
                    href="/dashboard/settings/billing-preferences"
                    className="inline-flex items-center rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-deep"
                  >
                    Upload branding →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Prescription Layout ── */}
        <div className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line-soft px-6 py-5">
            <div className="font-fraunces text-lg text-ink">
              Prescription <em className="italic text-coral-deep">layout</em>
            </div>
            <div className="mt-0.5 text-xs text-text-muted">Paper size and doctor details on every printed prescription.</div>
          </div>
          <div className="px-6 py-5 space-y-5">
            {/* Paper size */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-muted">Prescription paper size</label>
              <div className="flex gap-3">
                {(["A4", "A5"] as const).map(function (sz) {
                  var active = prefs.rx_paper_size === sz;
                  return (
                    <button
                      key={sz}
                      onClick={function () { update("rx_paper_size", sz); }}
                      className={"flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition-colors " +
                        (active ? "border-coral bg-coral/10 text-coral-deep" : "border-line bg-paper-soft text-ink hover:border-coral/50")}
                    >
                      <span className={"h-2 w-2 rounded-full " + (active ? "bg-coral" : "bg-line")} />
                      {sz}
                      <span className="text-xs text-text-muted font-normal">
                        {sz === "A4" ? "210×297mm" : "148×210mm"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Doctor qualification */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                Doctor qualification / degree
              </label>
              <input
                type="text"
                value={prefs.doctor_qualification}
                onChange={function (e) { update("doctor_qualification", e.target.value); }}
                placeholder="e.g. MBBS, MD (General Medicine)"
                className="w-full max-w-md rounded-lg border border-line px-3.5 py-2.5 text-sm text-ink focus:border-coral focus:outline-none"
              />
              <div className="mt-1 text-xs text-text-muted">Printed below the doctor name on the prescription header.</div>
            </div>

            {/* Custom footer */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                Custom disclaimer / footer text
              </label>
              <textarea
                rows={2}
                value={prefs.custom_footer}
                onChange={function (e) { update("custom_footer", e.target.value); }}
                placeholder="e.g. This prescription is valid for 30 days. Not valid without doctor signature."
                className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-ink focus:border-coral focus:outline-none"
              />
              <div className="mt-1 text-xs text-text-muted">Appears in the footer of every prescription alongside the compliance badge.</div>
            </div>
          </div>
        </div>

        {/* ── Sections to print ── */}
        <div className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line-soft px-6 py-5">
            <div className="font-fraunces text-lg text-ink">
              Sections to <em className="italic text-coral-deep">print</em>
            </div>
            <div className="mt-0.5 text-xs text-text-muted">Choose which clinical sections appear on printed prescriptions. Rx and patient header are always included.</div>
          </div>
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <ToggleRow
                label="Vitals"
                sub="BP, pulse, temperature, SpO₂, weight"
                checked={prefs.show_vitals}
                onChange={function (v) { update("show_vitals", v); }}
              />
              <ToggleRow
                label="Chief Complaint"
                sub="Subjective complaint from patient"
                checked={prefs.show_subjective}
                onChange={function (v) { update("show_subjective", v); }}
              />
              <ToggleRow
                label="Diagnosis"
                sub="ICD-10 / SNOMED code and description"
                checked={prefs.show_diagnosis}
                onChange={function (v) { update("show_diagnosis", v); }}
              />
              <ToggleRow
                label="Examination / Objective"
                sub="Clinical examination findings"
                checked={prefs.show_objective}
                onChange={function (v) { update("show_objective", v); }}
              />
              <ToggleRow
                label="Advice / Plan"
                sub="Doctor's plan and patient instructions"
                checked={prefs.show_plan}
                onChange={function (v) { update("show_plan", v); }}
              />
              <ToggleRow
                label="Allergies"
                sub="Recorded allergens with reactions"
                checked={prefs.show_allergies}
                onChange={function (v) { update("show_allergies", v); }}
              />
              <ToggleRow
                label="Follow-up date"
                sub="Next appointment date and notes"
                checked={prefs.show_followup}
                onChange={function (v) { update("show_followup", v); }}
              />
            </div>
          </div>
        </div>

        {/* ── Save bar ── */}
        <div className="flex items-center justify-between rounded-2xl border border-line bg-white px-6 py-4">
          <div className="text-sm text-text-muted">Settings are saved to this browser and apply to all prescriptions printed from here.</div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="rounded-lg border border-line px-4 py-2 text-sm text-text-dim hover:bg-paper-soft">
              Reset
            </button>
            <button
              onClick={handleSave}
              className={"rounded-lg px-6 py-2 text-sm font-medium text-white transition-colors " + (saved ? "bg-emerald-600" : "bg-coral hover:bg-coral-deep")}
            >
              {saved ? "Saved ✓" : "Save settings"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
