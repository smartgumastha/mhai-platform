"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Papa from "papaparse";
import { importLeads, getImportStatus, getCampaigns } from "@/lib/api";
import { useNotification } from "@/app/providers/NotificationProvider";
import { useDashboard } from "@/app/dashboard/contexts/DashboardContext";
import { useRouter } from "next/navigation";

var STEPS = ["Upload", "Map fields", "Compliance scrub", "Confirm"];

var SOURCE_OPTIONS = [
  { id: "csv_import", label: "CSV / spreadsheet" },
  { id: "website", label: "Website leads" },
  { id: "health_camp", label: "Health camp" },
  { id: "referral", label: "Referral list" },
  { id: "whatsapp", label: "WhatsApp opt-ins" },
];

var CONSENT_OPTIONS = [
  { id: "explicit", label: "Explicit consent (form/checkbox)" },
  { id: "inferred", label: "Inferred (existing patients)" },
  { id: "none", label: "No prior consent" },
];

var MHAI_FIELDS = [
  { id: "name", label: "Name", required: true },
  { id: "phone", label: "Phone", required: true },
  { id: "email", label: "Email" },
  { id: "specialty", label: "Specialty" },
  { id: "inquiry", label: "Inquiry" },
  { id: "consent_type", label: "Consent proof URL" },
  { id: "source_tag", label: "Source tag" },
  { id: "_ignore", label: "Ignore this column" },
];

var AUTO_MAP: Record<string, string> = {
  name: "name", "full name": "name", "patient name": "name", "first name": "name",
  phone: "phone", mobile: "phone", contact: "phone", number: "phone", "phone number": "phone", "mobile number": "phone",
  email: "email", mail: "email", "email address": "email",
  speciality: "specialty", specialty: "specialty", department: "specialty",
  inquiry: "inquiry", enquiry: "inquiry", reason: "inquiry", note: "inquiry", notes: "inquiry",
};

export default function ImportPage() {
  var notify = useNotification();
  var router = useRouter();
  var { hospital } = useDashboard();

  var [step, setStep] = useState(0);

  // Step 1 state
  var [csvData, setCsvData] = useState<any[]>([]);
  var [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  var [fileName, setFileName] = useState("");
  var [sourceTag, setSourceTag] = useState("");
  var [source, setSource] = useState("csv_import");
  var [consentType, setConsentType] = useState("none");
  var [dragOver, setDragOver] = useState(false);
  var fileRef = useRef<HTMLInputElement>(null);

  // Step 2 state
  var [mapping, setMapping] = useState<Record<string, string>>({});

  // Step 3 state
  var [importId, setImportId] = useState("");
  var [scrubbing, setScrubbing] = useState(false);
  var [scrubResult, setScrubResult] = useState<any>(null);

  // Step 4 state
  var [campaigns, setCampaigns] = useState<any[]>([]);
  var [selectedCampaign, setSelectedCampaign] = useState("");
  var [autoScore, setAutoScore] = useState(true);
  var [importing, setImporting] = useState(false);

  useEffect(function () {
    getCampaigns().then(function (r) { if (r.success && r.data) setCampaigns(r.data); });
  }, []);

  // File parsing
  function handleFile(file: File) {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      notify.error("File too large", "Maximum 50MB allowed.");
      return;
    }
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        if (results.data.length > 100000) {
          notify.error("Too many rows", "Maximum 100,000 rows allowed.");
          return;
        }
        setCsvData(results.data as any[]);
        var headers = results.meta.fields || [];
        setCsvHeaders(headers);
        // Auto-map
        var autoMapping: Record<string, string> = {};
        headers.forEach(function (h) {
          var lower = h.toLowerCase().trim();
          if (AUTO_MAP[lower]) autoMapping[h] = AUTO_MAP[lower];
        });
        setMapping(autoMapping);
        notify.success("File parsed", results.data.length + " rows found.");
      },
      error: function () { notify.error("Parse error", "Could not read CSV file."); },
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    var files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    var files = e.target.files;
    if (files && files.length > 0) handleFile(files[0]);
  }

  // Step 2 validation
  var mappedFields = Object.values(mapping);
  var hasName = mappedFields.includes("name");
  var hasPhone = mappedFields.includes("phone");
  var step2Valid = hasName && hasPhone;

  // Step 2 → Step 3: submit import
  async function handleScrub() {
    setScrubbing(true);
    // Build rows from mapping
    var rows = csvData.map(function (row) {
      var mapped: any = {};
      Object.entries(mapping).forEach(function ([csvCol, mhaiField]) {
        if (mhaiField !== "_ignore" && row[csvCol]) {
          mapped[mhaiField] = row[csvCol];
        }
      });
      mapped.consent_type = consentType;
      return mapped;
    });

    var res = await importLeads(rows, {
      source_tag: sourceTag || fileName,
      file_name: fileName,
    });

    if (res.success && res.data) {
      setImportId(res.data.import_id);
      // Poll for completion
      var pollCount = 0;
      var pollInterval = setInterval(async function () {
        pollCount++;
        var status = await getImportStatus(res.data!.import_id);
        if (status.success && status.data) {
          if (status.data.status === "completed" || status.data.status === "failed" || pollCount > 60) {
            clearInterval(pollInterval);
            setScrubResult(status.data);
            setScrubbing(false);
            setStep(3);
          }
        }
      }, 2000);
    } else {
      setScrubbing(false);
      notify.error("Import failed", res.error || "");
    }
  }

  // Step 4: confirm
  async function handleConfirm() {
    setImporting(true);
    notify.success("Import complete!", (scrubResult?.valid_rows || 0) + " leads imported.");
    setImporting(false);
    router.push("/dashboard/telecaller");
  }

  return (
    <div className="min-h-screen p-6">
      {/* Breadcrumb */}
      <p className="text-xs text-gray-400 mb-1">Telecaller CRM / Import contacts</p>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Import your contact list</h1>

      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-1">
        {STEPS.map(function (label, i) {
          var isActive = i === step;
          var isDone = i < step;
          return (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={"flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition " +
                  (isDone ? "bg-emerald-500 text-white" : isActive ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500")}>
                  {isDone ? "\u2713" : i + 1}
                </div>
                <span className={"mt-1 text-[10px] " + (isActive ? "font-medium text-emerald-700" : "text-gray-400")}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={"mx-2 h-0.5 w-12 " + (i < step ? "bg-emerald-400" : "bg-gray-200")} />}
            </div>
          );
        })}
      </div>

      {/* STEP 1 */}
      {step === 0 && (
        <div className="mx-auto max-w-2xl space-y-5">
          {/* Drag & drop zone */}
          <div
            onDragOver={function (e) { e.preventDefault(); setDragOver(true); }}
            onDragLeave={function () { setDragOver(false); }}
            onDrop={handleDrop}
            onClick={function () { fileRef.current?.click(); }}
            className={"cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition " +
              (dragOver ? "border-emerald-400 bg-emerald-50" : fileName ? "border-emerald-300 bg-emerald-50/50" : "border-gray-300 hover:border-gray-400")}
          >
            <input ref={fileRef} type="file" accept=".csv,.tsv,.xlsx" onChange={handleFileInput} className="hidden" />
            {fileName ? (
              <>
                <div className="text-3xl mb-2">{"\uD83D\uDCC4"}</div>
                <p className="text-sm font-medium text-gray-700">{fileName}</p>
                <p className="text-xs text-gray-400">{csvData.length} rows detected</p>
              </>
            ) : (
              <>
                <div className="text-3xl mb-2">{"\u2B06\uFE0F"}</div>
                <p className="text-sm font-medium text-gray-600">Drag and drop your file here</p>
                <p className="text-xs text-gray-400">CSV, TSV, or XLSX. Max 50MB, 100,000 rows.</p>
              </>
            )}
          </div>

          {/* Source + consent */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Lead source</label>
              <select value={source} onChange={function (e) { setSource(e.target.value); }} className="mt-1 w-full rounded-md border px-3 py-2 text-sm">
                {SOURCE_OPTIONS.map(function (s) { return <option key={s.id} value={s.id}>{s.label}</option>; })}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Source tag</label>
              <input
                value={sourceTag}
                onChange={function (e) { setSourceTag(e.target.value); }}
                placeholder="e.g. health_camp_march_2026"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Consent status for this file</label>
            <div className="mt-1 space-y-2">
              {CONSENT_OPTIONS.map(function (c) {
                return (
                  <label key={c.id} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="radio" name="consent" value={c.id} checked={consentType === c.id} onChange={function () { setConsentType(c.id); }} className="accent-emerald-500" />
                    {c.label}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Compliance notice */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-bold text-amber-800 mb-1">Global compliance notice</p>
            <p className="text-xs text-amber-700">
              All contacts will be scrubbed against DND registries in their respective countries. Calls outside 9 AM to 9 PM local time are automatically blocked.
              Penalties for violation vary by country and can reach {"\u20B9"}10 lakh per incident in India, $1,500 per call in US, and significant fines under GDPR.
            </p>
          </div>

          <button
            onClick={function () { setStep(1); }}
            disabled={!fileName || csvData.length === 0}
            className="w-full rounded-md bg-emerald-500 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-40"
          >
            Continue to field mapping
          </button>
        </div>
      )}

      {/* STEP 2 */}
      {step === 1 && (
        <div className="mx-auto max-w-3xl space-y-5">
          {!step2Valid && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
              Please map at least <strong>Name</strong> and <strong>Phone</strong> columns.
            </div>
          )}
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-gray-400">
                  <th className="px-4 py-3 font-medium">Your column</th>
                  <th className="px-4 py-3 font-medium">Sample</th>
                  <th className="px-4 py-3 font-medium">MHAI field</th>
                </tr>
              </thead>
              <tbody>
                {csvHeaders.map(function (header) {
                  var sample = csvData.length > 0 ? csvData[0][header] || "" : "";
                  return (
                    <tr key={header} className="border-b last:border-0">
                      <td className="px-4 py-2.5 font-medium text-gray-700">{header}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-400 truncate max-w-[200px]">{String(sample)}</td>
                      <td className="px-4 py-2.5">
                        <select
                          value={mapping[header] || "_ignore"}
                          onChange={function (e) {
                            var newMap = { ...mapping };
                            if (e.target.value === "_ignore") { delete newMap[header]; } else { newMap[header] = e.target.value; }
                            setMapping(newMap);
                          }}
                          className={"rounded-md border px-2 py-1 text-xs " + (mapping[header] && mapping[header] !== "_ignore" ? "border-emerald-300 bg-emerald-50" : "")}
                        >
                          {MHAI_FIELDS.map(function (f) {
                            return <option key={f.id} value={f.id}>{f.label}{f.required ? " *" : ""}</option>;
                          })}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between">
            <button onClick={function () { setStep(0); }} className="rounded-md border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Back</button>
            <button
              onClick={function () { handleScrub(); setStep(2); }}
              disabled={!step2Valid}
              className="rounded-md bg-emerald-500 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-40"
            >
              Continue to compliance scrub
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 2 && (
        <div className="mx-auto max-w-2xl space-y-5">
          {scrubbing ? (
            <div className="flex flex-col items-center py-16">
              <span className="h-10 w-10 animate-spin rounded-full border-3 border-emerald-500 border-t-transparent" />
              <p className="mt-4 text-sm text-gray-600">Scrubbing against global DND registries...</p>
              <p className="text-xs text-gray-400">This may take 30 seconds for large files.</p>
            </div>
          ) : scrubResult ? (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl border bg-white px-4 py-3">
                  <p className="text-xs text-gray-400">Total uploaded</p>
                  <p className="text-xl font-bold text-gray-800">{scrubResult.total_rows || 0}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-xs text-emerald-600">Valid numbers</p>
                  <p className="text-xl font-bold text-emerald-700">{scrubResult.valid_rows || 0}</p>
                </div>
                <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
                  <p className="text-xs text-orange-600">DND blocked</p>
                  <p className="text-xl font-bold text-orange-700">{scrubResult.dnd_scrubbed || 0}</p>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                  <p className="text-xs text-blue-600">Callable now</p>
                  <p className="text-xl font-bold text-blue-700">{(scrubResult.valid_rows || 0) - (scrubResult.dnd_scrubbed || 0)}</p>
                </div>
              </div>

              {/* Breakdown */}
              <div className="rounded-xl border bg-white p-4">
                <p className="text-xs font-medium text-gray-400 mb-3">Detailed breakdown</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Duplicates removed</span><span className="font-medium text-gray-800">{scrubResult.duplicate_rows || 0}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Invalid phone format</span><span className="font-medium text-gray-800">{(scrubResult.total_rows || 0) - (scrubResult.valid_rows || 0) - (scrubResult.duplicate_rows || 0)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">On DND registry</span><span className="font-medium text-orange-600">{scrubResult.dnd_scrubbed || 0}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Consented contacts</span><span className="font-medium text-emerald-600">{scrubResult.consented_rows || 0}</span></div>
                </div>
              </div>

              {(scrubResult.dnd_scrubbed || 0) > 0 && (
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                  <p className="text-sm font-medium text-purple-800">{scrubResult.dnd_scrubbed} contacts cannot be directly called.</p>
                  <p className="mt-1 text-xs text-purple-600">Move them to a consent-collection WhatsApp campaign to ask for permission before calling.</p>
                  <button className="mt-2 rounded-md bg-purple-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-purple-700">
                    Create consent campaign for blocked leads
                  </button>
                </div>
              )}

              {scrubResult.error_log && scrubResult.error_log.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-medium text-red-700 mb-2">Errors ({scrubResult.error_log.length})</p>
                  <div className="max-h-32 overflow-y-auto text-xs text-red-600">
                    {scrubResult.error_log.slice(0, 10).map(function (err: any, i: number) {
                      return <p key={i}>Row {err.row}: {err.error}</p>;
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <button onClick={function () { setStep(1); }} className="rounded-md border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Back</button>
                <button onClick={function () { setStep(3); }} className="rounded-md bg-emerald-500 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-600">
                  Continue to confirm
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">Waiting for scrub results...</div>
          )}
        </div>
      )}

      {/* STEP 4 */}
      {step === 3 && (
        <div className="mx-auto max-w-lg space-y-5">
          <div className="rounded-xl border bg-white p-6 text-center">
            <div className="text-3xl mb-3">{"\u2705"}</div>
            <h2 className="text-lg font-bold text-gray-900">
              Ready to import {(scrubResult?.valid_rows || 0) - (scrubResult?.dnd_scrubbed || 0)} callable leads
            </h2>
            <p className="text-sm text-gray-400 mt-1">From {fileName}</p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Assign to campaign (optional)</label>
            <select value={selectedCampaign} onChange={function (e) { setSelectedCampaign(e.target.value); }} className="mt-1 w-full rounded-md border px-3 py-2 text-sm">
              <option value="">No campaign</option>
              {campaigns.map(function (c: any) { return <option key={c.id} value={c.id}>{c.name}</option>; })}
              <option value="_new">Create new campaign after import</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={autoScore} onChange={function (e) { setAutoScore(e.target.checked); }} className="accent-emerald-500" />
            Auto-score with Clara AI
          </label>

          <div className="flex justify-between">
            <button onClick={function () { setStep(2); }} className="rounded-md border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Back</button>
            <button
              onClick={handleConfirm}
              disabled={importing}
              className="rounded-md bg-emerald-500 px-8 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {importing ? "Importing..." : "Import now"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
