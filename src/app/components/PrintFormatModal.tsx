"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import type { Bill, PrintPrefs, PaperSize, CountryCode } from "@/app/components/print/lib";

type FormatKey = "standard" | "b2b" | "einvoice" | "scheme" | "receipt";

type FormatDef = {
  key: FormatKey;
  label: string;
  desc: string;
  star?: boolean;
  warn?: string;
};

var FORMATS_BY_COUNTRY: Record<CountryCode, FormatDef[]> = {
  IN: [
    { key: "standard", label: "Standard tax invoice", desc: "B2C \u00B7 CGST+SGST \u00B7 QR", star: true },
    { key: "b2b", label: "B2B tax invoice", desc: "Buyer GSTIN \u00B7 ITC eligible", warn: "Requires buyer GSTIN" },
    { key: "einvoice", label: "E-invoice (IRN + signed QR)", desc: "GSTN-issued \u00B7 > \u20B95Cr turnover", warn: "Requires GSTN registration" },
    { key: "scheme", label: "Scheme invoice", desc: "PM-JAY \u00B7 CGHS \u00B7 ESI \u00B7 Ayushman" },
    { key: "receipt", label: "Payment receipt", desc: "Post-payment \u00B7 PAID stamp" },
  ],
  US: [
    { key: "standard", label: "Standard invoice", desc: "Self-pay \u00B7 Sales Tax \u00B7 CPT codes", star: true },
    { key: "b2b", label: "Insurance claim invoice", desc: "NPI + CPT codes" },
    { key: "receipt", label: "Payment receipt", desc: "Post-payment acknowledgment" },
  ],
  GB: [
    { key: "standard", label: "VAT invoice", desc: "Private patient \u00B7 VAT 20%", star: true },
    { key: "b2b", label: "Business invoice", desc: "Buyer VAT No \u00B7 insurer" },
    { key: "receipt", label: "Payment receipt", desc: "Post-payment acknowledgment" },
  ],
  AE: [
    { key: "standard", label: "Tax invoice \u00B7 \u0641\u0627\u062A\u0648\u0631\u0629 \u0636\u0631\u064A\u0628\u064A\u0629", desc: "VAT 5% \u00B7 bilingual", star: true },
    { key: "b2b", label: "Business tax invoice", desc: "Buyer TRN \u00B7 insurer" },
    { key: "receipt", label: "Payment receipt", desc: "Post-payment acknowledgment" },
  ],
};

var PrintStandardInvoice = lazy(function () { return import("@/app/components/print/PrintStandardInvoice"); });
var PrintB2BInvoice = lazy(function () { return import("@/app/components/print/PrintB2BInvoice"); });
var PrintEInvoiceIRN = lazy(function () { return import("@/app/components/print/PrintEInvoiceIRN"); });
var PrintSchemeInvoice = lazy(function () { return import("@/app/components/print/PrintSchemeInvoice"); });
var PrintReceipt = lazy(function () { return import("@/app/components/print/PrintReceipt"); });

type Props = {
  open: boolean;
  onClose: () => void;
  bill: Bill;
  prefs?: PrintPrefs | null;
  countryCode: CountryCode;
  onSetDefault?: (format: FormatKey, size: PaperSize) => void;
};

export default function PrintFormatModal({ open, onClose, bill, prefs, countryCode, onSetDefault }: Props) {
  var [mode, setMode] = useState<FormatKey>("standard");
  var [size, setSize] = useState<PaperSize>("a4");
  var [setAsDefault, setSetAsDefault] = useState(false);

  useEffect(function () {
    if (!open || !prefs) return;
    var format =
      (prefs.user_preferences && prefs.user_preferences.default_print_format) ||
      (prefs.clinic_preferences && (prefs.clinic_preferences as any).clinic_default_print_format) ||
      "standard";
    var paperMap: Record<string, string> =
      (prefs.clinic_preferences && (prefs.clinic_preferences as any).paper_size_per_format) || {};
    var paper =
      (prefs.user_preferences && prefs.user_preferences.default_paper_size) ||
      paperMap[format] ||
      "a4";
    setMode(format as FormatKey);
    setSize(paper as PaperSize);
  }, [open, prefs]);

  if (!open) return null;

  var formats = FORMATS_BY_COUNTRY[countryCode] || FORMATS_BY_COUNTRY.IN;
  var currentDefault =
    (prefs && prefs.user_preferences && prefs.user_preferences.default_print_format) ||
    (prefs && prefs.clinic_preferences && (prefs.clinic_preferences as any).clinic_default_print_format) ||
    "standard";

  var PrintComponent: any = null;
  if (mode === "standard") PrintComponent = PrintStandardInvoice;
  else if (mode === "b2b") PrintComponent = PrintB2BInvoice;
  else if (mode === "einvoice") PrintComponent = PrintEInvoiceIRN;
  else if (mode === "scheme") PrintComponent = PrintSchemeInvoice;
  else if (mode === "receipt") PrintComponent = PrintReceipt;

  var activeFormat = formats.find(function (f) { return f.key === mode; });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/55 p-5 backdrop-blur-sm">
      <div className="grid max-h-[94vh] w-full max-w-[1180px] grid-cols-1 overflow-hidden rounded-[20px] bg-white shadow-2xl md:grid-cols-[300px_1fr]">
        {/* Left rail */}
        <div className="overflow-y-auto border-r border-line bg-paper-soft px-5 py-6">
          <h3 className="mb-1 font-fraunces text-xl text-ink">
            Print <em className="italic text-coral-deep">format</em>
          </h3>
          <p className="mb-4 text-xs leading-relaxed text-text-dim">
            Pick once, set as default, never touch again.
          </p>

          <div className="mb-5 rounded-xl border border-dashed border-coral bg-gradient-to-br from-coral/10 to-pink-500/5 p-3">
            <div className="mb-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-coral-deep">
              {"\u2605 Current default"}
            </div>
            <div className="mb-1.5 text-xs font-medium text-ink">
              {currentDefault} {"\u00B7 "} {size.toUpperCase()}
            </div>
          </div>

          <div className="mb-2 font-mono text-[9px] font-semibold uppercase tracking-wider text-text-muted">
            Format
          </div>
          {formats.map(function (f) {
            var selected = mode === f.key;
            return (
              <button
                key={f.key}
                onClick={function () { setMode(f.key); }}
                className={
                  "mb-1 block w-full rounded-lg border px-3 py-2.5 text-left " +
                  (selected ? "border-2 border-coral bg-coral/5" : "border-line bg-white hover:border-coral")
                }
              >
                <div className="mb-0.5 flex items-center gap-1.5 text-xs font-semibold text-ink">
                  {f.label}
                  {f.star && f.key === currentDefault && (
                    <span className="rounded-full bg-coral px-1.5 py-0.5 font-mono text-[9px] text-white">
                      {"\u2605 DEFAULT"}
                    </span>
                  )}
                </div>
                <div className="text-[11px] leading-tight text-text-muted">{f.desc}</div>
                {f.warn && (
                  <div className="mt-1 font-mono text-[9px] uppercase text-amber-600">
                    {"\u26A0 " + f.warn}
                  </div>
                )}
              </button>
            );
          })}

          <div className="mb-2 mt-4 font-mono text-[9px] font-semibold uppercase tracking-wider text-text-muted">
            Paper size
          </div>
          <div className="flex gap-0.5 rounded-lg border border-line bg-paper-warm p-0.5">
            {(["a4", "a5", "thermal"] as PaperSize[]).map(function (s) {
              var selected = size === s;
              return (
                <button
                  key={s}
                  onClick={function () { setSize(s); }}
                  className={
                    "flex-1 rounded py-1.5 font-mono text-[10px] font-medium " +
                    (selected ? "bg-ink text-white" : "bg-transparent text-text-muted")
                  }
                >
                  {s.toUpperCase()}
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-[11px] leading-relaxed text-text-muted">
            <strong>A4</strong> for tax invoices {"\u00B7"} <strong>A5</strong> compact {"\u00B7"} <strong>Thermal 80mm</strong> for receipt printers
          </div>
        </div>

        {/* Right preview */}
        <div className="flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-line-soft px-5 py-4">
            <div>
              <div className="font-fraunces text-base font-medium text-ink">
                {activeFormat ? activeFormat.label : ""}
              </div>
              <div className="font-mono text-[10px] tracking-wider text-text-muted">
                {size.toUpperCase()} {"\u00B7"} {countryCode}
              </div>
            </div>
            <button onClick={onClose} className="text-2xl text-text-muted hover:text-ink">
              ×
            </button>
          </div>

          <div className="flex flex-1 items-start justify-center overflow-y-auto bg-[#e8e4d6] p-5">
            <Suspense fallback={<div className="py-10 text-text-muted">Loading preview...</div>}>
              {PrintComponent ? (
                <PrintComponent bill={bill} prefs={prefs} countryCode={countryCode} size={size} />
              ) : (
                <div className="rounded-lg border border-line bg-white p-10 text-text-muted">
                  Component unavailable.
                </div>
              )}
            </Suspense>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft bg-white px-5 py-3.5">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-paper-soft px-2.5 py-1.5 hover:border-coral">
              <input
                type="checkbox"
                checked={setAsDefault}
                onChange={function (e) { setSetAsDefault(e.target.checked); }}
                className="h-4 w-4 accent-coral"
              />
              <span className="text-xs text-text-dim">
                Set <strong className="text-coral-deep">{mode} {"\u00B7"} {size.toUpperCase()}</strong> as my default
              </span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="rounded-lg border border-line bg-white px-4 py-2.5 text-xs text-ink"
              >
                Cancel
              </button>
              <button
                onClick={function () {
                  if (setAsDefault && typeof onSetDefault === "function") onSetDefault(mode, size);
                  if (typeof window !== "undefined") window.print();
                }}
                className="rounded-lg bg-coral px-5 py-2.5 text-xs font-medium text-white hover:bg-coral-deep"
              >
                {"\uD83D\uDDA8 Print this"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
