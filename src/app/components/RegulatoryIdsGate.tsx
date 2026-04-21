"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/providers/auth-context";
import { getToken } from "@/lib/api";

type ProfileStatus = {
  success?: boolean;
  onboarding_profile_completed?: boolean;
  country_code?: string;
  required_fields?: string[];
  missing_fields?: string[];
  regulatory_ids?: Record<string, string>;
};

type FieldOption = { value: string; label: string };
type FieldConfig = {
  label: string;
  placeholder?: string;
  hint?: string;
  maxLength?: number;
  select?: boolean;
  options?: FieldOption[];
};

var FIELD_CONFIG: Record<string, FieldConfig> = {
  GSTIN: { label: "GSTIN", placeholder: "36AAAAA1234Z5", hint: "15-character GST number", maxLength: 15 },
  STATE_CODE: {
    label: "State (place of supply)",
    hint: "Drives CGST+SGST vs IGST.",
    select: true,
    options: [
      { value: "36", label: "36 — Telangana" },
      { value: "27", label: "27 — Maharashtra" },
      { value: "29", label: "29 — Karnataka" },
      { value: "33", label: "33 — Tamil Nadu" },
      { value: "07", label: "07 — Delhi" },
      { value: "09", label: "09 — Uttar Pradesh" },
      { value: "24", label: "24 — Gujarat" },
      { value: "06", label: "06 — Haryana" },
    ],
  },
  TRN: { label: "TRN", placeholder: "100123456700003", hint: "15-digit FTA Tax Registration", maxLength: 15 },
  DHA_LICENSE: { label: "DHA / MOHAP License", placeholder: "DHA-F-1234567", hint: "Your health authority license." },
  EMIRATE: {
    label: "Emirate",
    hint: "Governing regulator.",
    select: true,
    options: [
      { value: "Dubai", label: "Dubai" },
      { value: "Abu Dhabi", label: "Abu Dhabi" },
      { value: "Sharjah", label: "Sharjah" },
      { value: "Ajman", label: "Ajman" },
      { value: "Ras Al Khaimah", label: "Ras Al Khaimah" },
      { value: "Fujairah", label: "Fujairah" },
      { value: "Umm Al Quwain", label: "Umm Al Quwain" },
    ],
  },
  VAT_NUMBER: { label: "VAT Number", placeholder: "GB 123 4567 89", hint: "9-digit HMRC VAT number." },
  COMPANY_NUMBER: { label: "Company Number", placeholder: "09876543", hint: "Companies House 8-digit.", maxLength: 8 },
  GMC: { label: "GMC / HCPC Registration", placeholder: "GMC 7012345", hint: "Medical Council registration." },
  NPI: { label: "NPI", placeholder: "1234567890", hint: "10-digit National Provider Identifier.", maxLength: 10 },
  EIN: { label: "EIN", placeholder: "12-3456789", hint: "9-digit Employer Identification Number." },
  STATE_LICENSE: { label: "State Medical Board License", placeholder: "CA · PT-29845", hint: "License from your state." },
};

var COUNTRY_LABELS: Record<string, { flag: string; name: string }> = {
  IN: { flag: "🇮🇳", name: "India" },
  AE: { flag: "🇦🇪", name: "UAE" },
  GB: { flag: "🇬🇧", name: "UK" },
  US: { flag: "🇺🇸", name: "US" },
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: (partner: any) => void;
  initialStatus?: ProfileStatus | null;
  mode?: "soft" | "hard";
};

export default function RegulatoryIdsGate({ open, onClose, onSaved, initialStatus, mode = "soft" }: Props) {
  var { user } = useAuth();
  var [status, setStatus] = useState<ProfileStatus | null>(initialStatus || null);
  var [values, setValues] = useState<Record<string, string>>({});
  var [saving, setSaving] = useState(false);
  var [error, setError] = useState<string | null>(null);

  useEffect(function () {
    if (!open) return;
    if (initialStatus) {
      setStatus(initialStatus);
      setValues(initialStatus.regulatory_ids || {});
      return;
    }
    async function load() {
      try {
        var token = getToken();
        if (!token) return;
        var resp = await fetch("/api/presence/partners/me/profile-status", {
          headers: { Authorization: "Bearer " + token },
        });
        if (!resp.ok) return;
        var data = await resp.json();
        if (data && data.success) {
          setStatus(data);
          setValues(data.regulatory_ids || {});
        }
      } catch (e) { /* silent */ }
    }
    load();
  }, [open, initialStatus]);

  if (!open || !status) return null;

  var cc = status.country_code || "IN";
  var labels = COUNTRY_LABELS[cc] || COUNTRY_LABELS.IN;
  var fieldsToShow = status.required_fields || [];

  function setVal(k: string, v: string) {
    setValues(function (prev) {
      var next = Object.assign({}, prev);
      if (v) next[k] = v;
      else delete next[k];
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      var token = getToken();
      var hospitalId = user?.hospital_id;
      if (!token || !hospitalId) {
        setError("Session expired — please log in again");
        setSaving(false);
        return;
      }
      var resp = await fetch("/api/presence/partners/" + hospitalId + "/regulatory-ids", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ regulatory_ids: values }),
      });
      var data = await resp.json();
      if (!data.success) {
        setError(data.error || "Save failed");
        setSaving(false);
        return;
      }
      setSaving(false);
      if (typeof onSaved === "function") onSaved(data.partner);
      if (typeof onClose === "function") onClose();
    } catch (e: any) {
      setError(e?.message || "Network error");
      setSaving(false);
    }
  }

  function renderField(key: string) {
    var cfg = FIELD_CONFIG[key];
    if (!cfg) return null;
    var val = values[key] || "";
    return (
      <div key={key} className="mb-4">
        <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-wider text-coral-deep">
          {cfg.label} <span className="text-rose-500">*</span>
        </label>
        {cfg.select ? (
          <select
            value={val}
            onChange={function (e) { setVal(key, e.target.value); }}
            className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-ink focus:border-coral focus:bg-white focus:outline-none"
          >
            <option value="">— Select —</option>
            {(cfg.options || []).map(function (o) {
              return <option key={o.value} value={o.value}>{o.label}</option>;
            })}
          </select>
        ) : (
          <input
            type="text"
            value={val}
            maxLength={cfg.maxLength}
            placeholder={cfg.placeholder}
            onChange={function (e) { setVal(key, e.target.value); }}
            className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-ink placeholder:text-text-muted focus:border-coral focus:bg-white focus:outline-none"
          />
        )}
        {cfg.hint && <div className="mt-1.5 text-xs text-text-muted">{cfg.hint}</div>}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/55 p-5 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-[620px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="relative border-b border-line-soft px-7 pb-4 pt-6">
          <button onClick={onClose} className="absolute right-5 top-4 text-2xl text-text-muted hover:text-ink">×</button>
          <div className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-coral-deep">
            {mode === "hard" ? "Required before your first bill" : "Complete your profile"}
          </div>
          <h2 className="font-fraunces text-2xl font-light leading-tight tracking-tight text-ink">
            {mode === "hard" ? (
              <span>Add <em className="italic font-normal text-coral-deep">your tax ID</em> to continue.</span>
            ) : (
              <span>Add your <em className="italic font-normal text-coral-deep">business registration</em>.</span>
            )}
          </h2>
          <div className="mt-2 text-xs text-text-dim">
            {mode === "hard"
              ? "Mandatory for this country's tax authority. Every future bill auto-fills after this."
              : "Required for tax-compliant bills. You can skip and come back — we'll remind you."}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-5">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-soft px-3 py-1.5 text-xs text-text-dim">
            {labels.flag} Country: <strong className="font-semibold text-coral-deep">{labels.name}</strong> · fields from country_billing_config.required_clinic_fields
          </div>

          {fieldsToShow.map(renderField)}

          {error && (
            <div className="mt-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-500">
              {error}
            </div>
          )}

          <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs leading-relaxed text-text-dim">
            <strong className="font-mono text-[10px] uppercase tracking-wider text-emerald-600">After save</strong><br />
            Your IDs are verified live against the government portal. If valid, billing unlocks immediately.
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line-soft bg-paper-soft px-7 py-4">
          {mode === "hard" ? (
            <button onClick={onClose} className="px-3 py-2.5 text-xs text-text-muted">Save draft, finish later</button>
          ) : (
            <button onClick={onClose} className="px-3 py-2.5 text-xs text-text-muted">Skip for now</button>
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-line bg-white px-4 py-2.5 text-xs text-ink">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-coral px-5 py-2.5 text-xs font-medium text-white hover:bg-coral-deep disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save & verify"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
