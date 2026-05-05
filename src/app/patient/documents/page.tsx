"use client";

import { useState, useEffect, useRef } from "react";
import { patientApi } from "../providers/patient-auth-context";
import { useLocale } from "@/app/providers/locale-context";

// ── Locale helpers ──────────────────────────────────────────
function fmtDate(d: string | null | undefined, cc: string): string {
  if (!d) return "—";
  try {
    var date = new Date(d);
    if (isNaN(date.getTime())) return String(d);
    var locale = cc === "US" ? "en-US" : cc === "AE" ? "ar-AE" : "en-GB";
    return date.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
  } catch { return String(d); }
}

function fmtBytes(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// ── Doc type config ─────────────────────────────────────────
var DOC_TYPES = [
  { value: "lab_report",   label: "Lab Report",       icon: "⚗", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "prescription", label: "Prescription",     icon: "℞", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "discharge",    label: "Discharge Summary", icon: "🏥", color: "bg-green-50 text-green-700 border-green-200" },
  { value: "imaging",      label: "Imaging / Scan",   icon: "🔬", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "insurance",    label: "Insurance",        icon: "🛡", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { value: "other",        label: "Other",            icon: "📄", color: "bg-gray-50 text-gray-600 border-gray-200" },
];

function typeConfig(val: string) {
  return DOC_TYPES.find(function (t) { return t.value === val; }) || DOC_TYPES[DOC_TYPES.length - 1];
}

// ── Upload Modal ────────────────────────────────────────────
function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  var [title, setTitle] = useState("");
  var [docType, setDocType] = useState("lab_report");
  var [docDate, setDocDate] = useState("");
  var [providerName, setProviderName] = useState("");
  var [notes, setNotes] = useState("");
  var [file, setFile] = useState<File | null>(null);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState("");
  var fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    var f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 3 * 1024 * 1024) { setError("File too large. Maximum 3 MB."); return; }
    setFile(f);
    setError("");
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Please select a file."); return; }
    if (!title.trim()) { setError("Title is required."); return; }
    setLoading(true);
    setError("");
    try {
      var base64 = await new Promise<string>(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () {
          var result = reader.result as string;
          // Strip the data:...;base64, prefix, keep raw base64
          resolve(result.split(",")[1] || result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file!);
      });

      var res: any = await patientApi("/api/patient/documents", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          doc_type: docType,
          file_name: file.name,
          mime_type: file.type,
          file_data: base64,
          doc_date: docDate || null,
          provider_name: providerName.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      if (res.success) { onUploaded(); onClose(); }
      else setError(res.message || "Upload failed. Please try again.");
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Upload Document</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        </div>

        <form onSubmit={handleUpload} className="space-y-4 p-6">
          {/* File picker */}
          <div
            onClick={function () { fileRef.current?.click(); }}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-6 transition-colors hover:border-[#1ba3d6] hover:bg-[#1ba3d6]/5"
          >
            <div className="mb-1 text-2xl">{file ? "✓" : "📎"}</div>
            <div className="text-sm font-semibold text-gray-700">
              {file ? file.name : "Click to select file"}
            </div>
            <div className="mt-0.5 text-xs text-gray-400">
              {file ? fmtBytes(file.size) : "PDF, JPG, PNG · Max 3 MB"}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Title *</label>
            <input
              type="text"
              value={title}
              onChange={function (e) { setTitle(e.target.value); }}
              placeholder="e.g. CBC Blood Report"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#1ba3d6] focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Document Type</label>
              <select
                value={docType}
                onChange={function (e) { setDocType(e.target.value); }}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#1ba3d6] focus:outline-none"
              >
                {DOC_TYPES.map(function (t) {
                  return <option key={t.value} value={t.value}>{t.icon} {t.label}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Report Date</label>
              <input
                type="date"
                value={docDate}
                onChange={function (e) { setDocDate(e.target.value); }}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#1ba3d6] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Hospital / Lab / Clinic</label>
            <input
              type="text"
              value={providerName}
              onChange={function (e) { setProviderName(e.target.value); }}
              placeholder="Where was this issued?"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#1ba3d6] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={function (e) { setNotes(e.target.value); }}
              placeholder="Any context about this document"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#1ba3d6] focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !file}
            className="w-full rounded-xl bg-[#1ba3d6] py-3 text-sm font-bold text-white transition-colors hover:bg-[#0e7ba8] disabled:opacity-50"
          >
            {loading ? "Uploading…" : "Upload Document"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Document Viewer ─────────────────────────────────────────
function viewDocument(doc: any) {
  if (!doc.file_data && !doc.file_url) return;
  var mime = doc.mime_type || "application/octet-stream";
  var src  = doc.file_url || ("data:" + mime + ";base64," + doc.file_data);
  var w    = window.open("", "_blank", "width=900,height=700,scrollbars=yes");
  if (!w) return;
  if (mime.startsWith("image/")) {
    w.document.write('<html><body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh">' +
      '<img src="' + src + '" style="max-width:100%;max-height:100vh;object-fit:contain"/></body></html>');
  } else {
    w.document.write('<html><body style="margin:0;height:100vh">' +
      '<iframe src="' + src + '" style="width:100%;height:100%;border:none"></iframe></body></html>');
  }
  w.document.close();
}

// ── Main Page ───────────────────────────────────────────────
export default function PatientDocumentsPage() {
  var { localeV2 } = useLocale();
  var cc = localeV2?.country_code || "IN";

  var [documents, setDocuments] = useState<any[]>([]);
  var [loading, setLoading] = useState(true);
  var [filter, setFilter] = useState("all");
  var [search, setSearch] = useState("");
  var [showUpload, setShowUpload] = useState(false);
  var [viewingId, setViewingId] = useState<string | null>(null);
  var [viewLoading, setViewLoading] = useState(false);

  async function loadDocs() {
    setLoading(true);
    try {
      var res: any = await patientApi("/api/patient/documents");
      if (res.success) setDocuments(res.documents || []);
    } catch {} finally { setLoading(false); }
  }

  useEffect(function () { loadDocs(); }, []);

  async function handleView(docId: string) {
    var cached = documents.find(function (d) { return d.doc_id === docId && d.file_data; });
    if (cached) { viewDocument(cached); return; }
    setViewLoading(true);
    try {
      var res: any = await patientApi("/api/patient/documents/" + docId);
      if (res.success && res.document) viewDocument(res.document);
    } catch {} finally { setViewLoading(false); }
  }

  async function handleDelete(docId: string) {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    try {
      var res: any = await patientApi("/api/patient/documents/" + docId, { method: "DELETE" });
      if (res.success) setDocuments(function (prev) { return prev.filter(function (d) { return d.doc_id !== docId; }); });
    } catch {}
  }

  var filtered = documents.filter(function (d) {
    var matchType = filter === "all" || d.doc_type === filter;
    var q = search.toLowerCase();
    var matchSearch = !q ||
      d.title.toLowerCase().includes(q) ||
      (d.provider_name || "").toLowerCase().includes(q) ||
      (d.notes || "").toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  // Group by month
  var groups: Record<string, any[]> = {};
  filtered.forEach(function (d) {
    var dt   = d.doc_date ? new Date(d.doc_date) : new Date(Number(d.created_at));
    var key  = isNaN(dt.getTime()) ? "Other" : dt.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(d);
  });

  var counts: Record<string, number> = { all: documents.length };
  DOC_TYPES.forEach(function (t) {
    counts[t.value] = documents.filter(function (d) { return d.doc_type === t.value; }).length;
  });

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="mb-0.5 text-2xl font-bold text-gray-900">Health Documents</h1>
          <p className="text-sm text-gray-400">
            Your personal health folder — lab reports, prescriptions, discharge summaries &amp; more
          </p>
        </div>
        <button
          onClick={function () { setShowUpload(true); }}
          className="flex items-center gap-2 rounded-xl bg-[#1ba3d6] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#0e7ba8]"
        >
          + Upload
        </button>
      </div>

      {/* Filter chips */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={function () { setFilter("all"); }}
          className={"rounded-full px-3 py-1.5 text-xs font-semibold transition-colors " +
            (filter === "all" ? "bg-[#1ba3d6] text-white" : "bg-white text-gray-500 ring-1 ring-gray-200 hover:ring-[#1ba3d6]")}
        >
          All · {counts.all}
        </button>
        {DOC_TYPES.map(function (t) {
          return (
            <button
              key={t.value}
              onClick={function () { setFilter(t.value); }}
              className={"whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors " +
                (filter === t.value ? "bg-[#1ba3d6] text-white" : "bg-white text-gray-500 ring-1 ring-gray-200 hover:ring-[#1ba3d6]")}
            >
              {t.icon} {t.label} {counts[t.value] ? "· " + counts[t.value] : ""}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          value={search}
          onChange={function (e) { setSearch(e.target.value); }}
          placeholder="Search by title, hospital or notes…"
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-[#1ba3d6] focus:outline-none focus:ring-2 focus:ring-[#1ba3d6]/20"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(function (i) {
            return <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />;
          })}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
          <div className="mb-3 text-5xl">📂</div>
          <div className="text-base font-semibold text-gray-600">No documents yet</div>
          <div className="mx-auto mt-2 max-w-xs text-xs text-gray-400">
            Upload your lab reports, prescriptions, discharge summaries — all in one secure place
          </div>
          <button
            onClick={function () { setShowUpload(true); }}
            className="mt-5 inline-flex items-center gap-1 rounded-xl bg-[#1ba3d6] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0e7ba8]"
          >
            + Upload your first document
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(function ([month, docs]) {
            return (
              <div key={month}>
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">{month}</div>
                <div className="space-y-2">
                  {docs.map(function (doc) {
                    var tc = typeConfig(doc.doc_type);
                    return (
                      <div
                        key={doc.doc_id}
                        className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm"
                      >
                        {/* Type icon */}
                        <div className={"flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border text-lg " + tc.color}>
                          {tc.icon}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-gray-900">{doc.title}</div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400">
                            <span className={"rounded-full border px-2 py-0.5 font-medium " + tc.color}>{tc.label}</span>
                            {doc.provider_name && <span>{doc.provider_name}</span>}
                            {doc.doc_date && <span>{fmtDate(doc.doc_date, cc)}</span>}
                            {doc.file_size && <span>{fmtBytes(doc.file_size)}</span>}
                          </div>
                          {doc.notes && (
                            <div className="mt-1 truncate text-xs text-gray-400">{doc.notes}</div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-shrink-0 items-center gap-2">
                          <button
                            onClick={function () { handleView(doc.doc_id); }}
                            disabled={viewLoading}
                            className="rounded-lg bg-[#1ba3d6]/10 px-3 py-1.5 text-xs font-semibold text-[#1ba3d6] transition-colors hover:bg-[#1ba3d6]/20 disabled:opacity-50"
                          >
                            View
                          </button>
                          <button
                            onClick={function () { handleDelete(doc.doc_id); }}
                            className="rounded-lg px-2 py-1.5 text-xs text-gray-300 transition-colors hover:bg-red-50 hover:text-red-400"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showUpload && (
        <UploadModal
          onClose={function () { setShowUpload(false); }}
          onUploaded={loadDocs}
        />
      )}
    </div>
  );
}
