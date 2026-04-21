"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/providers/auth-context";
import { getToken } from "@/lib/api";

type ClinicPrefs = {
  logo_url?: string | null;
  letterhead_url?: string | null;
  default_signature_url?: string | null;
  clinic_default_print_format?: string;
  clinic_default_paper_size?: string;
  paper_size_per_format?: Record<string, string>;
  invoice_number_template?: string;
};

type UserPrefs = {
  default_print_format?: string | null;
  default_paper_size?: string | null;
};

var PRINT_FORMATS = [
  { key: "standard", label: "Standard tax invoice" },
  { key: "b2b", label: "B2B tax invoice" },
  { key: "einvoice", label: "E-invoice with IRN (India-only)" },
  { key: "scheme", label: "Scheme invoice (PM-JAY/CGHS)" },
  { key: "receipt", label: "Payment receipt" },
];

var PAPER_SIZES = [
  { key: "a4", label: "A4 \u00B7 210mm \u00D7 297mm" },
  { key: "a5", label: "A5 \u00B7 148mm \u00D7 210mm" },
  { key: "thermal", label: "Thermal 80mm \u00B7 receipt printer" },
];

export default function BillingPreferencesPage() {
  var { user } = useAuth();
  var [loading, setLoading] = useState(true);
  var [saving, setSaving] = useState(false);
  var [clinicPrefs, setClinicPrefs] = useState<ClinicPrefs>({});
  var [userPrefs, setUserPrefs] = useState<UserPrefs>({});
  var [error, setError] = useState<string | null>(null);
  var [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(function () {
    async function load() {
      try {
        var token = getToken();
        var hospitalId = user?.hospital_id;
        if (!token || !hospitalId) {
          setLoading(false);
          return;
        }
        var resp = await fetch("/api/presence/partners/" + hospitalId + "/billing-preferences", {
          headers: { Authorization: "Bearer " + token },
        });
        var data = await resp.json();
        if (data && data.success) {
          setClinicPrefs(data.clinic_preferences || {});
          setUserPrefs(data.user_preferences || {});
        } else if (data && data.error) {
          setError(data.error);
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load preferences");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.hospital_id]);

  function updateClinicField(k: keyof ClinicPrefs, v: any) {
    setClinicPrefs(function (p) {
      var n = Object.assign({}, p) as ClinicPrefs;
      (n as any)[k] = v;
      return n;
    });
  }
  function updateUserField(k: keyof UserPrefs, v: any) {
    setUserPrefs(function (p) {
      var n = Object.assign({}, p) as UserPrefs;
      (n as any)[k] = v;
      return n;
    });
  }
  function updatePaperSizePerFormat(format: string, size: string) {
    setClinicPrefs(function (p) {
      var psf = Object.assign({}, p.paper_size_per_format || {});
      psf[format] = size;
      var n = Object.assign({}, p, { paper_size_per_format: psf }) as ClinicPrefs;
      return n;
    });
  }

  async function uploadAsset(assetType: string, file: File): Promise<string> {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = async function () {
        var token = getToken();
        if (!token) return reject(new Error("not signed in"));
        try {
          var resp = await fetch("/api/presence/uploads/branding", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
            body: JSON.stringify({
              asset_type: assetType,
              data_url: reader.result,
              filename: file.name,
            }),
          });
          var data = await resp.json();
          if (data && data.success) resolve(data.url);
          else reject(new Error((data && data.error) || "upload failed"));
        } catch (e: any) {
          reject(e);
        }
      };
      reader.onerror = function () { reject(new Error("read failed")); };
      reader.readAsDataURL(file);
    });
  }

  async function handleFileUpload(assetType: string, e: React.ChangeEvent<HTMLInputElement>) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      setError("File too large (max 500KB)");
      return;
    }
    setError(null);
    try {
      var url = await uploadAsset(assetType, file);
      if (assetType === "logo") updateClinicField("logo_url", url);
      else if (assetType === "letterhead") updateClinicField("letterhead_url", url);
      else if (assetType === "signature") updateClinicField("default_signature_url", url);
    } catch (err: any) {
      setError("Upload failed: " + (err?.message || "unknown"));
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    try {
      var token = getToken();
      var hospitalId = user?.hospital_id;
      if (!token || !hospitalId) {
        setError("Not signed in");
        setSaving(false);
        return;
      }
      var body = {
        logo_url: clinicPrefs.logo_url || null,
        letterhead_url: clinicPrefs.letterhead_url || null,
        default_signature_url: clinicPrefs.default_signature_url || null,
        clinic_default_print_format: clinicPrefs.clinic_default_print_format || "standard",
        clinic_default_paper_size: clinicPrefs.clinic_default_paper_size || "a4",
        paper_size_per_format:
          clinicPrefs.paper_size_per_format ||
          { standard: "a4", b2b: "a4", einvoice: "a4", scheme: "a4", receipt: "thermal" },
        invoice_number_template: clinicPrefs.invoice_number_template || "INV/{YY}-{YY2}/{SEQ:6}",
        default_print_format: userPrefs.default_print_format || null,
        default_paper_size: userPrefs.default_paper_size || null,
      };
      var resp = await fetch("/api/presence/partners/" + hospitalId + "/billing-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify(body),
      });
      var data = await resp.json();
      if (data && data.success) setSavedMsg("Preferences saved.");
      else setError((data && data.error) || "Save failed");
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-10 text-text-muted">Loading preferences...</div>;

  return (
    <div>
      <div className="border-b border-line-soft px-9 py-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
              <Link href="/dashboard" className="hover:text-coral-deep">Dashboard</Link>
              <span className="mx-1.5 text-line">/</span>
              Settings
              <span className="mx-1.5 text-line">/</span>
              Billing preferences
            </div>
            <h1 className="font-fraunces text-3xl font-light tracking-tight text-ink">
              Billing <em className="italic font-normal text-coral-deep">preferences.</em>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-text-dim">
              Set your default print format, upload branding, and configure doctor signatures.
              Clinic-wide settings unless a user overrides.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm"
            >
              {"\u2190 Back"}
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-coral px-6 py-2.5 text-sm font-medium text-white hover:bg-coral-deep disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save all changes"}
            </button>
          </div>
        </div>
        {savedMsg && <div className="mt-3 text-xs font-medium text-emerald-600">{savedMsg}</div>}
        {error && <div className="mt-3 text-xs text-rose-500">{error}</div>}
      </div>

      <div className="px-9 py-7">
        {/* Section 1 + 2: Print defaults + paper size per format */}
        <div className="mb-5 rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line-soft px-6 py-5">
            <div className="font-fraunces text-lg text-ink">
              Print <em className="italic text-coral-deep">defaults</em>
            </div>
            <span className="rounded-full bg-paper-soft px-2 py-0.5 font-mono text-[10px] text-text-muted">
              Clinic-wide
            </span>
          </div>
          <div className="px-6 py-5">
            <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-wider text-coral-deep">
                  My default format (this user)
                </label>
                <select
                  value={userPrefs.default_print_format || ""}
                  onChange={function (e) {
                    updateUserField("default_print_format", e.target.value || null);
                  }}
                  className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-ink focus:border-coral focus:outline-none"
                >
                  <option value="">Follows clinic default</option>
                  {PRINT_FORMATS.map(function (f) {
                    return (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    );
                  })}
                </select>
                <div className="mt-1.5 text-xs text-text-muted">
                  Your personal default. Clinic admin sets a fallback.
                </div>
              </div>
              <div>
                <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-wider text-coral-deep">
                  Clinic default (admin only)
                </label>
                <select
                  value={clinicPrefs.clinic_default_print_format || "standard"}
                  onChange={function (e) {
                    updateClinicField("clinic_default_print_format", e.target.value);
                  }}
                  className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-ink focus:border-coral focus:outline-none"
                >
                  {PRINT_FORMATS.map(function (f) {
                    return (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    );
                  })}
                </select>
                <div className="mt-1.5 text-xs text-text-muted">
                  Applies to users without their own default.
                </div>
              </div>
            </div>

            <h4 className="mb-1.5 font-fraunces text-base text-ink">
              Paper size <em className="italic text-coral-deep">per format</em>
            </h4>
            <p className="mb-3 text-xs text-text-dim">Override any at print time.</p>

            <div>
              {PRINT_FORMATS.map(function (f) {
                var currentSize = (clinicPrefs.paper_size_per_format || {})[f.key] || "a4";
                return (
                  <div
                    key={f.key}
                    className="flex items-center justify-between border-b border-line-soft py-2.5 last:border-b-0"
                  >
                    <span className="text-sm font-medium text-ink">{f.label}</span>
                    <select
                      value={currentSize}
                      onChange={function (e) { updatePaperSizePerFormat(f.key, e.target.value); }}
                      className="rounded border border-line bg-paper-soft px-2.5 py-1 font-mono text-xs text-text-dim"
                    >
                      {PAPER_SIZES.map(function (s) {
                        return (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 3: Branding uploads — 4 cards in 2x2 grid */}
        <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <UploadCard
            title="Clinic"
            italic="logo"
            description="On every invoice top-left. Square PNG, 200x200 min."
            currentUrl={clinicPrefs.logo_url || null}
            onUpload={function (e) { handleFileUpload("logo", e); }}
            onRemove={function () { updateClinicField("logo_url", null); }}
          />
          <UploadCard
            title="Clinic"
            italic="letterhead"
            description="Optional. Full-width header on A4/A5 (not thermal). 1600x400 recommended."
            currentUrl={clinicPrefs.letterhead_url || null}
            onUpload={function (e) { handleFileUpload("letterhead", e); }}
            onRemove={function () { updateClinicField("letterhead_url", null); }}
          />
          <UploadCard
            title="Default"
            italic="signature"
            description="Used when attending doctor has no personal signature uploaded."
            currentUrl={clinicPrefs.default_signature_url || null}
            onUpload={function (e) { handleFileUpload("signature", e); }}
            onRemove={function () { updateClinicField("default_signature_url", null); }}
          />
          <div className="rounded-2xl border border-line bg-white p-6">
            <h3 className="mb-1 font-fraunces text-base text-ink">
              Per-doctor <em className="italic text-coral-deep">signatures</em>
            </h3>
            <p className="mb-4 text-xs text-text-dim">
              Each doctor&apos;s individual signature overrides the clinic default on bills they attend.
            </p>
            <div className="rounded-lg border border-dashed border-line bg-paper-soft py-6 text-center text-xs text-text-muted">
              Per-doctor signature management coming in V2.
              <br />
              Clinic default signature applies to all doctors for now.
            </div>
          </div>
        </div>

        {/* Section 4: Invoice numbering */}
        <div className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line-soft px-6 py-5">
            <div className="font-fraunces text-lg text-ink">
              Invoice <em className="italic text-coral-deep">numbering</em>
            </div>
          </div>
          <div className="px-6 py-5">
            <div>
              <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-wider text-coral-deep">
                Invoice number format
              </label>
              <select
                value={clinicPrefs.invoice_number_template || "INV/{YY}-{YY2}/{SEQ:6}"}
                onChange={function (e) { updateClinicField("invoice_number_template", e.target.value); }}
                className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-ink focus:border-coral focus:outline-none"
              >
                <option value="INV/{YY}-{YY2}/{SEQ:6}">INV/26-27/000053 (India FY)</option>
                <option value="INV-{YYYY}-{SEQ:5}">INV-2026-00053 (calendar)</option>
                <option value="INV-{YYYY}/{SEQ:3}">INV-2026/053 (UK style)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadCard({
  title,
  italic,
  description,
  currentUrl,
  onUpload,
  onRemove,
}: {
  title: string;
  italic: string;
  description: string;
  currentUrl: string | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <h3 className="mb-1 font-fraunces text-base text-ink">
        {title} <em className="italic text-coral-deep">{italic}</em>
      </h3>
      <p className="mb-4 text-xs text-text-dim">{description}</p>
      {currentUrl ? (
        <div className="flex items-center gap-3 rounded-xl border border-coral bg-white p-3">
          <img
            src={currentUrl}
            alt=""
            className="h-14 w-14 rounded border border-line bg-paper-warm object-contain"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-ink">Uploaded</div>
            <div className="mt-0.5 font-mono text-[10px] text-text-muted">Click replace to change</div>
          </div>
          <label className="cursor-pointer rounded border border-line bg-white px-3 py-1.5 text-xs text-text-dim hover:border-coral">
            Replace
            <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
          </label>
          <button
            onClick={onRemove}
            className="rounded border border-line bg-white px-3 py-1.5 text-xs text-text-dim hover:border-rose-500 hover:text-rose-500"
          >
            Remove
          </button>
        </div>
      ) : (
        <label className="block cursor-pointer rounded-xl border-2 border-dashed border-line bg-paper-soft py-5 text-center hover:border-coral hover:bg-coral/5">
          <div className="mb-1.5 text-2xl text-coral">{"\u2191"}</div>
          <div className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-coral-deep">
            Upload
          </div>
          <div className="text-xs text-text-muted">PNG or JPG {"\u00B7"} max 500KB</div>
          <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
        </label>
      )}
    </div>
  );
}
