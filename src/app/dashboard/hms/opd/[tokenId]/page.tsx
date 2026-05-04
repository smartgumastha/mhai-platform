"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/providers/auth-context";
import { useLocale } from "@/app/providers/locale-context";
import { useNotification } from "@/app/providers/NotificationProvider";
import { getTokens, getVitals, saveVisitRecord, updateTokenStatus, searchIcd10 } from "@/lib/api";
import { getEmrConfig } from "@/lib/emr/emr-config";
import type { RxRow, AllergyRow, SoapNote, SickNoteData, ReferralData, DrugSchedule } from "@/lib/emr/emr-types";

// ─── Small helpers ────────────────────────────────────────────────────────────

function newRxRow(): RxRow {
  return { id: String(Date.now() + Math.random()), drug_generic: "", drug_brand: "", strength: "", form: "Tablet", route: "Oral", frequency: "OD", duration: "", quantity: "", instructions: "", schedule: "none", is_controlled: false };
}

function newAllergyRow(): AllergyRow {
  return { id: String(Date.now() + Math.random()), allergen: "", reaction: "", reaction_type: "unknown", severity: "unknown" };
}

var DRUG_FORMS = ["Tablet", "Capsule", "Syrup", "Suspension", "Injection", "Cream", "Ointment", "Gel", "Eye drops", "Ear drops", "Nasal spray", "Inhaler", "Patch", "Suppository", "Drops"];
var ROUTES = ["Oral", "IV", "IM", "SC", "Topical", "Inhaled", "Sublingual", "Eye", "Ear", "Nasal", "PR", "PV"];
var FREQS_IN = ["OD", "BD", "TDS", "QDS", "SOS", "HS", "AC", "PC", "Stat", "Alternate days", "Weekly"];
var FREQS_US_GB = ["Once daily", "Twice daily", "Three times daily", "Four times daily", "Every 8h", "Every 6h", "PRN", "At bedtime", "Before meals", "After meals", "Stat", "Weekly"];
var SEVERITIES = ["mild", "moderate", "severe", "unknown"];

var SNOMED_FALLBACK = [
  { code: "386661006", description: "Fever (finding)" },
  { code: "49727002",  description: "Cough (finding)" },
  { code: "25064002",  description: "Headache (finding)" },
  { code: "21522001",  description: "Abdominal pain (finding)" },
  { code: "73430006",  description: "Sleep disorder (disorder)" },
  { code: "230145002", description: "Difficulty breathing (finding)" },
  { code: "57676002",  description: "Joint pain (finding)" },
  { code: "267102003", description: "Sore throat (disorder)" },
];

var ICD10_FALLBACK = [
  { code: "R50.9",  description: "Fever, unspecified" },
  { code: "R05",    description: "Cough" },
  { code: "R51",    description: "Headache" },
  { code: "R10.9",  description: "Unspecified abdominal pain" },
  { code: "J00",    description: "Acute nasopharyngitis (Common cold)" },
  { code: "J06.9",  description: "Acute upper respiratory infection, unspecified" },
  { code: "K59.00", description: "Constipation, unspecified" },
  { code: "R11.2",  description: "Nausea with vomiting, unspecified" },
];

// ─── Vital chip component ─────────────────────────────────────────────────────

function VitalChip({ label, value, unit }: { label: string; value?: number | null; unit?: string }) {
  if (!value) return null;
  return (
    <div className="rounded-xl border border-line bg-paper-soft px-3 py-2 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{label}</div>
      <div className="font-mono text-base font-bold text-ink">{value}<span className="ml-0.5 text-xs font-normal text-text-dim">{unit}</span></div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ConsultPage() {
  var router   = useRouter();
  var params   = useParams();
  var tokenId  = params?.tokenId as string;
  var { user } = useAuth();
  var { localeV2 } = useLocale();
  var notify   = useNotification();
  var hospitalId = user?.hospital_id || "";

  var cc     = localeV2?.country_code || "IN";
  var emr    = getEmrConfig(cc);
  var freqs  = (cc === "US" || cc === "GB") ? FREQS_US_GB : FREQS_IN;

  // ── Data ──────────────────────────────────────────────────────────────────
  var [token,   setToken]   = useState<any>(null);
  var [vitals,  setVitals]  = useState<any>(null);
  var [loading, setLoading] = useState(true);

  // ── SOAP ──────────────────────────────────────────────────────────────────
  var [soap, setSoap] = useState<SoapNote>({ subjective: "", objective: "", assessment: "", plan: "", follow_up_date: "", follow_up_notes: "" });

  // ── Diagnosis ─────────────────────────────────────────────────────────────
  var [diagQuery,    setDiagQuery]    = useState("");
  var [diagOptions,  setDiagOptions]  = useState<{ code: string; description: string }[]>([]);
  var [diagSelected, setDiagSelected] = useState<{ code: string; description: string } | null>(null);
  var [diagSearching,setDiagSearching]= useState(false);
  var diagRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Procedure code (AE/US) ────────────────────────────────────────────────
  var [cptCode,  setCptCode]  = useState("");
  var [cptDesc,  setCptDesc]  = useState("");

  // ── Allergies ─────────────────────────────────────────────────────────────
  var [allergies, setAllergies] = useState<AllergyRow[]>([]);

  // ── Prescription ──────────────────────────────────────────────────────────
  var [rxRows, setRxRows] = useState<RxRow[]>([newRxRow()]);

  // ── Provider IDs ─────────────────────────────────────────────────────────
  var [providerIds, setProviderIds] = useState<Record<string, string>>({
    nmc_reg_no: user?.nmc_reg_no || "",
    dha_license_no: user?.dha_license_no || "",
    gmc_number: user?.gmc_number || "",
    npi: user?.npi || "",
    dea_number: user?.dea_number || "",
  });

  // ── Sick note ─────────────────────────────────────────────────────────────
  var [showSickNote,  setShowSickNote]  = useState(false);
  var [sickNote, setSickNote] = useState<SickNoteData>({ duration_days: 1, general_reason: "", fit_for_work: "not_fit" });

  // ── Referral ──────────────────────────────────────────────────────────────
  var [showReferral,  setShowReferral]  = useState(false);
  var [referral, setReferral] = useState<ReferralData>({ referred_to_specialty: "", referred_to_facility: "", reason: "", urgency: "routine", summary: "" });

  // ── Save state ────────────────────────────────────────────────────────────
  var [saving,  setSaving]  = useState(false);
  var [saved,   setSaved]   = useState(false);
  var [activeTab, setActiveTab] = useState<"notes" | "rx" | "labs" | "docs">("notes");

  // ── Load token + vitals ───────────────────────────────────────────────────
  var loadData = useCallback(function () {
    if (!hospitalId || !tokenId) return;
    var today = new Date().toISOString().slice(0, 10);
    Promise.all([getTokens(hospitalId, { date: today }), getVitals(hospitalId, tokenId)])
      .then(function ([tokRes, vitRes]) {
        if (tokRes.success && tokRes.data) {
          var found = tokRes.data.tokens.find(function (t: any) { return String(t.token_id) === String(tokenId); });
          if (!found) {
            getTokens(hospitalId).then(function (all) {
              if (all.success && all.data) setToken(all.data.tokens.find(function (t: any) { return String(t.token_id) === String(tokenId); }) || null);
            }).catch(function () {});
          } else { setToken(found); }
        }
        if (vitRes.success && vitRes.data?.vitals) {
          var vit = vitRes.data.vitals;
          setVitals(vit);
          if (vit.chief_complaint) setSoap(function (p) { return { ...p, subjective: p.subjective || vit.chief_complaint }; });
        }
      })
      .catch(function () {})
      .finally(function () { setLoading(false); });
  }, [hospitalId, tokenId]);

  useEffect(function () { loadData(); }, [loadData]);

  // ── Diagnosis search ──────────────────────────────────────────────────────
  function handleDiagSearch(q: string) {
    setDiagQuery(q);
    setDiagSelected(null);
    if (diagRef.current) clearTimeout(diagRef.current);
    if (!q.trim()) { setDiagOptions([]); return; }
    diagRef.current = setTimeout(async function () {
      setDiagSearching(true);
      try {
        var r = await searchIcd10(q, 8);
        if (r.success && r.data?.codes?.length) {
          setDiagOptions(r.data.codes.map(function (c) { return { code: c.code, description: c.description }; }));
          setDiagSearching(false);
          return;
        }
      } catch {}
      // Fallback list
      var ql = q.toLowerCase();
      var fb = emr.diagnosis_system === "SNOMED-CT" ? SNOMED_FALLBACK : ICD10_FALLBACK;
      setDiagOptions(fb.filter(function (x) { return x.code.toLowerCase().includes(ql) || x.description.toLowerCase().includes(ql); }));
      setDiagSearching(false);
    }, 350);
  }

  function selectDiag(item: { code: string; description: string }) {
    setDiagSelected(item);
    setDiagQuery(item.code + " — " + item.description);
    setDiagOptions([]);
    setSoap(function (p) { return { ...p, assessment: p.assessment || item.description }; });
  }

  // ── Rx ────────────────────────────────────────────────────────────────────
  function updateRx(id: string, field: keyof RxRow, val: any) {
    setRxRows(function (prev) {
      return prev.map(function (r) {
        if (r.id !== id) return r;
        var updated = { ...r, [field]: val };
        if (field === "schedule") updated.is_controlled = val !== "none";
        return updated;
      });
    });
  }

  // ── Allergies ─────────────────────────────────────────────────────────────
  function updateAllergy(id: string, field: keyof AllergyRow, val: any) {
    setAllergies(function (prev) { return prev.map(function (a) { return a.id === id ? { ...a, [field]: val } : a; }); });
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave(andComplete: boolean) {
    if (!token) return;
    setSaving(true);
    try {
      var validRx = rxRows.filter(function (r) { return r.drug_generic.trim() || r.drug_brand.trim(); });
      var r = await saveVisitRecord(hospitalId, tokenId, {
        patient_id:  token.patient_id,
        doctor_id:   user?.user_id || token.doctor_id,
        subjective:  soap.subjective || undefined,
        diagnosis:   diagSelected ? diagSelected.code + " " + diagSelected.description : (soap.assessment || undefined),
        notes:       [soap.objective, soap.plan, soap.follow_up_notes].filter(Boolean).join("\n\n") || undefined,
        prescription: validRx.length > 0 ? validRx.map(function (row) {
          return {
            drug:         row.drug_generic || row.drug_brand,
            drug_brand:   row.drug_brand || undefined,
            dose:         row.strength,
            form:         row.form,
            route:        row.route,
            frequency:    row.frequency,
            duration:     row.duration,
            quantity:     row.quantity || undefined,
            instructions: row.instructions || undefined,
            schedule:     row.schedule !== "none" ? row.schedule : undefined,
          };
        }) : undefined,
        cpt_code:    (emr.show_procedure_code && cptCode) ? cptCode : undefined,
        follow_up:   soap.follow_up_date || undefined,
        allergies:   allergies.filter(function (a) { return a.allergen.trim(); }).map(function (a) { return ({ allergen: a.allergen, reaction: a.reaction, severity: a.severity }); }),
      });
      if (!r.success) { notify.error("Failed", r.message || r.error || "Could not save."); return; }
      if (andComplete) {
        await updateTokenStatus(hospitalId, tokenId, "completed");
        notify.success("Consultation complete", token.token_number + " — saved.");
        setSaved(true);
      } else {
        notify.success("Saved", "Draft saved.");
        setSaved(true);
      }
    } catch { notify.error("Error", "Network error. Try again."); }
    finally { setSaving(false); }
  }

  // ── Print helpers ─────────────────────────────────────────────────────────
  function openPrintWindow(title: string, bodyHtml: string) {
    var css =
      "body{font-family:Arial,sans-serif;font-size:12px;color:#111;margin:0;padding:20px;}" +
      "h1{font-size:16px;margin:0 0 3px;}h2{font-size:13px;margin:10px 0 4px;}" +
      "hr{border:none;border-top:1.5px solid #333;margin:8px 0;}" +
      ".rx-item{margin:3px 0;}" +
      ".allergy-box{background:#fee2e2;border:1px solid #fca5a5;border-radius:4px;padding:5px 10px;margin:6px 0;font-size:11px;}" +
      ".meta{font-size:11px;color:#555;}" +
      ".footer{margin-top:24px;font-size:10px;color:#999;border-top:1px solid #eee;padding-top:6px;}" +
      "@page{margin:15mm;}" +
      "@media print{body{margin:0;padding:8mm;}}";
    var win = window.open("", "_blank", "width=820,height=950");
    if (!win) { alert("Allow pop-ups to print."); return; }
    win.document.write("<!DOCTYPE html><html><head><title>" + title + "</title><style>" + css + "</style></head><body>" + bodyHtml + "</body></html>");
    win.document.close();
    win.focus();
    var ref = win;
    setTimeout(function () { ref.print(); }, 600);
  }

  function handlePrintRx() {
    if (!token) return;
    var pName = ((token.first_name || "") + " " + (token.last_name || "")).trim() || "Unknown";
    var pAge  = token.dob ? Math.floor((Date.now() - new Date(token.dob).getTime()) / (365.25 * 24 * 3600000)) : null;
    var docName   = "Dr. " + ((user?.first_name || "") + " " + (user?.last_name || "")).trim();
    var clinicN   = (user as any)?.clinic_name || "";
    var dateStr   = new Date().toLocaleDateString(cc === "US" ? "en-US" : "en-IN");
    var idLabels: Record<string, string> = { nmc_reg_no: "NMC Reg", dha_license_no: "DHA License", gmc_number: "GMC", npi: "NPI", dea_number: "DEA" };
    var headerIds = emr.rx_header_fields.map(function (f) {
      return providerIds[f] ? "<div class='meta'>" + idLabels[f] + ": " + providerIds[f] + "</div>" : "";
    }).join("");
    var allergyHtml = allergies.filter(function (a) { return a.allergen; }).length > 0
      ? "<div class='allergy-box'><strong>⚠ Allergies:</strong> " +
        allergies.filter(function (a) { return a.allergen; }).map(function (a) {
          return a.allergen + (a.reaction ? " (" + a.reaction + ")" : "");
        }).join("; ") + "</div>"
      : "";
    var diagHtml = diagSelected
      ? "<div style='margin:6px 0'><strong>Dx:</strong> " + diagSelected.code + " — " + diagSelected.description + "</div>"
      : "";
    var validRx = rxRows.filter(function (r) { return r.drug_generic || r.drug_brand; });
    var rxHtml = validRx.length > 0
      ? "<h2>&#8478; Prescription</h2>" + validRx.map(function (r, i) {
          var name = r.drug_generic ? r.drug_generic + (r.drug_brand ? " [" + r.drug_brand + "]" : "") : r.drug_brand;
          var line = (i + 1) + ". <strong>" + name + "</strong>";
          if (r.strength) line += " " + r.strength;
          if (r.form)     line += " " + r.form;
          line += " — " + r.route + " " + r.frequency;
          if (r.duration)     line += " &times; " + r.duration;
          if (r.quantity)     line += " (Qty: " + r.quantity + ")";
          if (r.instructions) line += " &middot; <em>" + r.instructions + "</em>";
          if (r.is_controlled) line += " <strong style='color:#dc2626'>[" + r.schedule + "]</strong>";
          return "<div class='rx-item'>" + line + "</div>";
        }).join("")
      : "<div class='meta'>(No medications prescribed)</div>";
    var followHtml = soap.follow_up_date
      ? "<div style='margin-top:8px'><strong>Follow-up:</strong> " + soap.follow_up_date + (soap.follow_up_notes ? " — " + soap.follow_up_notes : "") + "</div>"
      : "";
    var patIdHtml = emr.patient_id_fields.filter(function (f: any) { return token[f.key]; })
      .map(function (f: any) { return "<div class='meta'>" + f.label + ": " + token[f.key] + "</div>"; }).join("");
    var html =
      "<h1>" + docName + "</h1>" + headerIds +
      (clinicN ? "<div class='meta'>" + clinicN + "</div>" : "") +
      "<div class='meta'>" + dateStr + "</div>" +
      "<hr>" +
      "<div><strong>" + pName + "</strong></div>" +
      "<div class='meta'>" + (pAge != null ? pAge + "y" : "") + (token.gender ? " &middot; " + token.gender : "") + " &middot; Token: " + token.token_number + "</div>" +
      patIdHtml +
      "<hr>" +
      allergyHtml + diagHtml + rxHtml + followHtml +
      "<div class='footer'>" + emr.compliance_badge + " &middot; " + emr.compliance_note + "</div>";
    openPrintWindow("Prescription — " + pName, html);
  }

  function handlePrintSickNote() {
    if (!token) return;
    var pName   = ((token.first_name || "") + " " + (token.last_name || "")).trim() || "Unknown";
    var docName = "Dr. " + ((user?.first_name || "") + " " + (user?.last_name || "")).trim();
    var dateStr = new Date().toLocaleDateString(cc === "US" ? "en-US" : "en-IN");
    var fromDate = dateStr;
    var reason   = cc === "AE" ? (sickNote.diagnosis_for_ae || "") : sickNote.general_reason;
    var html =
      "<h1>" + emr.sick_note_label + "</h1>" +
      "<div class='meta'>Issued by " + docName + " &middot; " + dateStr + "</div><hr>" +
      "<div><strong>Patient:</strong> " + pName + "</div>" +
      "<div><strong>Token:</strong> " + token.token_number + "</div><hr>" +
      "<div>This is to certify that the above-named patient is medically advised to rest for <strong>" + sickNote.duration_days + " day(s)</strong> from " + fromDate + ".</div>" +
      (reason ? "<div style='margin-top:6px'><strong>Reason:</strong> " + reason + "</div>" : "") +
      (cc === "GB" && sickNote.fit_for_work === "may_be_fit" ? "<div style='margin-top:6px'><strong>Note:</strong> May be fit for work with adjustments: " + (sickNote.restrictions || "") + "</div>" : "") +
      "<div style='margin-top:24px'>Signature: _______________________</div>" +
      "<div class='footer'>" + emr.compliance_badge + " &middot; " + emr.compliance_note + "</div>";
    openPrintWindow(emr.sick_note_label + " — " + pName, html);
  }

  function handlePrintReferral() {
    if (!token) return;
    var pName   = ((token.first_name || "") + " " + (token.last_name || "")).trim() || "Unknown";
    var docName = "Dr. " + ((user?.first_name || "") + " " + (user?.last_name || "")).trim();
    var dateStr = new Date().toLocaleDateString(cc === "US" ? "en-US" : "en-IN");
    var html =
      "<h1>Referral Letter</h1>" +
      "<div class='meta'>" + docName + (((user as any)?.clinic_name) ? " &middot; " + (user as any).clinic_name : "") + " &middot; " + dateStr + "</div><hr>" +
      "<div><strong>Patient:</strong> " + pName + (token.token_number ? " (Token: " + token.token_number + ")" : "") + "</div>" +
      "<div><strong>Referred to:</strong> " + (referral.referred_to_specialty || "—") + (referral.referred_to_facility ? " at " + referral.referred_to_facility : "") + "</div>" +
      "<div><strong>Urgency:</strong> " + referral.urgency + "</div>" +
      (referral.reason ? "<div><strong>Reason:</strong> " + referral.reason + "</div>" : "") +
      (referral.summary ? "<div style='margin-top:8px'><strong>Clinical Summary:</strong><br>" + referral.summary.replace(/\n/g, "<br>") + "</div>" : "") +
      "<div style='margin-top:24px'>Referring clinician: _______________________</div>" +
      "<div class='footer'>" + emr.compliance_badge + " &middot; " + emr.compliance_note + "</div>";
    openPrintWindow("Referral — " + pName, html);
  }

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-9 py-8">
        <div className="mb-5 h-7 w-40 animate-pulse rounded-lg bg-line" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="h-48 animate-pulse rounded-2xl bg-line" />
          <div className="h-48 animate-pulse rounded-2xl bg-line lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="px-9 py-8">
        <Link href="/dashboard/hms/opd" className="mb-4 flex items-center gap-1.5 text-sm text-coral-deep hover:underline">← Back to OPD Queue</Link>
        <div className="rounded-2xl border border-line bg-white p-10 text-center text-text-dim">Token not found.</div>
      </div>
    );
  }

  var patientName = ((token.first_name || "") + " " + (token.last_name || "")).trim() || "Unknown";
  var doctorName  = ((token.doctor_first_name || "") + " " + (token.doctor_last_name || "")).trim();
  var age = token.dob ? Math.floor((Date.now() - new Date(token.dob).getTime()) / (365.25 * 24 * 3600000)) : null;
  var isCompleted = token.status === "completed" || token.status === "exited";

  return (
    <div className="px-9 py-8 print:px-4 print:py-4">
      {/* Breadcrumb */}
      <nav className="mb-1 flex items-center gap-1.5 text-xs text-text-muted print:hidden">
        <Link href="/dashboard/hms" className="hover:text-coral">HMS</Link>
        <span>/</span>
        <Link href="/dashboard/hms/opd" className="hover:text-coral">OPD Queue</Link>
        <span>/</span>
        <span className="text-ink">{token.token_number}</span>
      </nav>

      {/* Header */}
      <div className="mb-5 flex items-center justify-between print:hidden">
        <div>
          <div className="font-fraunces text-2xl font-light text-ink">
            Consultation <em className="italic text-coral-deep">Console</em>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="rounded-full border border-line bg-paper-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              {emr.compliance_badge}
            </span>
            <span className="text-xs text-text-dim">{emr.compliance_note}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrintRx} className="rounded-lg border border-line px-3 py-2 text-sm text-text-dim hover:bg-paper-soft">Print Rx</button>
          <Link href="/dashboard/hms/opd" className="rounded-lg border border-line px-3 py-2 text-sm text-text-dim hover:bg-paper-soft">← Queue</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* ── Left panel: patient + vitals + allergies ── */}
        <div className="space-y-4">

          {/* Patient card */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-coral/10 text-lg font-bold text-coral-deep">
                {(token.first_name?.[0] || "?").toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-ink">{patientName}</div>
                <div className="text-xs text-text-dim">
                  {age != null ? age + "y" : ""}
                  {token.gender ? " · " + token.gender : ""}
                  {token.blood_group ? " · " + token.blood_group : ""}
                </div>
              </div>
            </div>

            {/* Locale-specific patient IDs */}
            <div className="space-y-1 text-xs text-text-dim">
              {emr.patient_id_fields.map(function (f) {
                var val = token[f.key] || (f.key === "insurance_member" ? token.insurance_member_id : null);
                if (!val && !f.required) return null;
                return (
                  <div key={f.key}>
                    <span className="font-medium text-ink">{f.label}:</span>{" "}
                    {val || <span className="italic text-text-muted">not recorded</span>}
                  </div>
                );
              })}
              {token.phone && <div><span className="font-medium text-ink">Phone:</span> {token.phone}</div>}
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-lg border border-line-soft bg-paper-soft px-3 py-2">
              <span className="font-mono text-sm font-bold text-ink">{token.token_number}</span>
              <span className="text-text-dim">·</span>
              <span className="text-sm text-text-dim">Dr. {doctorName}</span>
            </div>

            {token.chief_complaint && (
              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">Chief Complaint</div>
                <div className="mt-0.5 text-sm text-ink">{token.chief_complaint}</div>
              </div>
            )}
          </div>

          {/* Vitals */}
          {vitals ? (
            <div className="rounded-2xl border border-line bg-white p-5">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Vitals</div>
              <div className="grid grid-cols-2 gap-2">
                {vitals.bp_systolic && vitals.bp_diastolic ? (
                  <div className="col-span-2 rounded-xl border border-line bg-paper-soft px-3 py-2 text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Blood Pressure</div>
                    <div className="font-mono text-base font-bold text-ink">{vitals.bp_systolic}/{vitals.bp_diastolic} <span className="text-xs font-normal text-text-dim">mmHg</span></div>
                  </div>
                ) : null}
                <VitalChip label="Pulse" value={vitals.pulse_rate} unit="bpm" />
                <VitalChip label={emr.temp_unit === "°C" ? "Temp" : "Temp"} value={vitals.temperature} unit={emr.temp_unit} />
                <VitalChip label="SpO2" value={vitals.spo2} unit="%" />
                <VitalChip label="Weight" value={vitals.weight_kg} unit="kg" />
                {vitals.bmi ? (
                  <div className="col-span-2 rounded-xl border border-line bg-paper-soft px-3 py-2 text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">BMI</div>
                    <div className="font-mono text-base font-bold text-ink">{vitals.bmi}</div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-line bg-paper-soft p-4 text-center">
              <div className="text-xs text-text-muted">Vitals not recorded.</div>
              <button onClick={function () { router.push("/dashboard/hms/opd"); }} className="mt-1 text-xs text-coral-deep hover:underline">Take vitals in queue →</button>
            </div>
          )}

          {/* Allergies */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Allergies</div>
              {!isCompleted && (
                <button onClick={function () { setAllergies(function (p) { return [...p, newAllergyRow()]; }); }} className="text-[11px] font-medium text-coral-deep hover:underline">+ Add</button>
              )}
            </div>
            {allergies.length === 0 && <div className="text-xs italic text-text-muted">No known drug allergies</div>}
            {allergies.map(function (a) {
              return (
                <div key={a.id} className="mb-2 rounded-lg border border-rose-100 bg-rose-50/50 p-2.5 text-xs">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <input
                      value={a.allergen} placeholder="Allergen / drug"
                      disabled={isCompleted}
                      onChange={function (e) { updateAllergy(a.id, "allergen", e.target.value); }}
                      className="flex-1 rounded border border-line bg-white px-2 py-1 text-xs focus:border-rose-400 focus:outline-none"
                    />
                    {!isCompleted && (
                      <button onClick={function () { setAllergies(function (p) { return p.filter(function (x) { return x.id !== a.id; }); }); }} className="text-rose-400 hover:text-rose-600">✕</button>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      value={a.reaction} placeholder="Reaction (e.g. rash)"
                      disabled={isCompleted}
                      onChange={function (e) { updateAllergy(a.id, "reaction", e.target.value); }}
                      className="flex-1 rounded border border-line bg-white px-2 py-1 text-xs focus:border-rose-400 focus:outline-none"
                    />
                    <select
                      value={a.severity} disabled={isCompleted}
                      onChange={function (e) { updateAllergy(a.id, "severity", e.target.value); }}
                      className="rounded border border-line bg-white px-1.5 py-1 text-xs focus:outline-none"
                    >
                      {SEVERITIES.map(function (s) { return <option key={s} value={s}>{s}</option>; })}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Provider ID fields (locale-specific, shown in left panel) */}
          {!isCompleted && emr.rx_header_fields.length > 0 && (
            <div className="rounded-2xl border border-line bg-white p-5">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Your Credentials (for Rx)</div>
              {emr.rx_header_fields.map(function (field) {
                var labels: Record<string, string> = { nmc_reg_no: "NMC/MCI Reg No.", dha_license_no: "DHA License No.", gmc_number: "GMC Number", npi: "NPI", dea_number: "DEA Number" };
                return (
                  <div key={field} className="mb-2">
                    <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">{labels[field]}</label>
                    <input
                      value={providerIds[field] || ""}
                      onChange={function (e) { setProviderIds(function (p) { return { ...p, [field]: e.target.value }; }); }}
                      className="w-full rounded-lg border border-line px-2.5 py-1.5 font-mono text-xs focus:border-coral focus:outline-none"
                      placeholder={labels[field]}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right panel: tabs ── */}
        <div className="space-y-4 lg:col-span-2">

          {/* Tab bar */}
          <div className="flex gap-1 rounded-xl border border-line bg-white p-1 w-fit print:hidden">
            {(["notes", "rx", "docs"] as const).map(function (t) {
              var labels = { notes: "SOAP Notes", rx: "Prescription", docs: "Documents" };
              return (
                <button
                  key={t}
                  onClick={function () { setActiveTab(t); }}
                  className={"rounded-lg px-4 py-1.5 text-sm font-medium transition-all " + (activeTab === t ? "bg-coral text-white" : "text-text-dim hover:bg-paper-soft")}
                >
                  {labels[t]}
                </button>
              );
            })}
          </div>

          {/* ── SOAP tab ── */}
          {activeTab === "notes" && (
            <div className="space-y-4">
              {/* Diagnosis search */}
              <div className="rounded-2xl border border-line bg-white p-5">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">{emr.diagnosis_label}</div>
                <div className="relative">
                  {diagSelected ? (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm">
                      <span className="font-mono font-bold text-emerald-700">{diagSelected.code}</span>
                      <span className="text-ink">— {diagSelected.description}</span>
                      {!isCompleted && (
                        <button onClick={function () { setDiagSelected(null); setDiagQuery(""); setSoap(function (p) { return { ...p, assessment: "" }; }); }} className="ml-auto text-xs text-text-dim hover:text-rose-500">✕</button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <input
                          value={diagQuery}
                          onChange={function (e) { handleDiagSearch(e.target.value); }}
                          disabled={isCompleted}
                          placeholder={"Search " + emr.diagnosis_system_label + " code or keyword…"}
                          className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none"
                        />
                        {diagSearching && <span className="text-xs text-text-muted">⟳</span>}
                      </div>
                      {diagOptions.length > 0 && (
                        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-line bg-white shadow-md">
                          {diagOptions.map(function (opt) {
                            return (
                              <button key={opt.code} onClick={function () { selectDiag(opt); }}
                                className="flex w-full items-center gap-2 border-b border-line-soft px-4 py-2.5 text-left text-sm last:border-0 hover:bg-paper-soft"
                              >
                                <span className="font-mono font-bold text-coral-deep">{opt.code}</span>
                                <span className="text-text-dim">{opt.description}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
                {/* Procedure code for AE/US */}
                {emr.show_procedure_code && (
                  <div className="mt-3 flex gap-2">
                    <div className="flex-1">
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">CPT Code</label>
                      <input value={cptCode} onChange={function (e) { setCptCode(e.target.value); }} disabled={isCompleted}
                        placeholder="e.g. 99213" className="w-full rounded-lg border border-line px-2.5 py-1.5 font-mono text-sm focus:border-coral focus:outline-none" />
                    </div>
                    <div className="flex-[2]">
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">CPT Description</label>
                      <input value={cptDesc} onChange={function (e) { setCptDesc(e.target.value); }} disabled={isCompleted}
                        placeholder="e.g. Office visit, established patient" className="w-full rounded-lg border border-line px-2.5 py-1.5 text-sm focus:border-coral focus:outline-none" />
                    </div>
                  </div>
                )}
              </div>

              {/* SOAP textareas */}
              <div className="rounded-2xl border border-line bg-white p-5">
                <div className="mb-4 font-fraunces text-lg text-ink">Clinical <em className="italic text-coral-deep">notes</em></div>
                <div className="space-y-3">
                  {(["subjective", "objective", "assessment", "plan"] as const).map(function (field) {
                    var labelMap = {
                      subjective: emr.subjective_label,
                      objective:  emr.objective_label,
                      assessment: emr.diagnosis_label + " / Assessment",
                      plan:       emr.plan_label,
                    };
                    return (
                      <div key={field}>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">{labelMap[field]}</label>
                        <textarea
                          rows={field === "plan" ? 3 : 2}
                          value={soap[field]}
                          disabled={isCompleted}
                          onChange={function (e) { setSoap(function (p) { return { ...p, [field]: e.target.value }; }); }}
                          className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none"
                          placeholder={{ subjective: "Patient reports…", objective: "On examination…", assessment: "Clinical impression…", plan: "Treatment plan, investigations, referrals…" }[field]}
                        />
                      </div>
                    );
                  })}
                  {/* Follow-up */}
                  <div className="flex gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Follow-up Date</label>
                      <input type="date" value={soap.follow_up_date || ""} disabled={isCompleted}
                        onChange={function (e) { setSoap(function (p) { return { ...p, follow_up_date: e.target.value }; }); }}
                        className="rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none" />
                    </div>
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Follow-up Instructions</label>
                      <input value={soap.follow_up_notes || ""} disabled={isCompleted}
                        onChange={function (e) { setSoap(function (p) { return { ...p, follow_up_notes: e.target.value }; }); }}
                        placeholder="e.g. Review BP in 1 week"
                        className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Prescription tab ── */}
          {activeTab === "rx" && (
            <div className="rounded-2xl border border-line bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="font-fraunces text-lg text-ink">Prescription <em className="italic text-coral-deep">builder</em></div>
                {!isCompleted && (
                  <button onClick={function () { setRxRows(function (p) { return [...p, newRxRow()]; }); }}
                    className="rounded-lg bg-coral/10 px-3 py-1.5 text-xs font-semibold text-coral-deep hover:bg-coral/20">
                    + Add drug
                  </button>
                )}
              </div>

              {/* Drug name style hint */}
              <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] text-blue-700">
                {cc === "IN" && "NMC mandate: write generic name first. Brand name optional in brackets."}
                {cc === "AE" && "DHA requirement: both generic (INN) and brand name required."}
                {cc === "GB" && "Generic prescribing preferred. Brand only if clinically necessary."}
                {cc === "US" && "Add DAW (Dispense As Written) note if brand is required over generic."}
              </div>

              {rxRows.map(function (row, idx) {
                var isControlled = row.schedule !== "none";
                return (
                  <div key={row.id} className={"mb-4 rounded-xl border p-4 " + (isControlled ? "border-amber-300 bg-amber-50/50" : "border-line-soft bg-paper-soft/40")}>
                    <div className="mb-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-muted">Rx {idx + 1}</span>
                        {isControlled && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">{row.schedule}</span>
                        )}
                      </div>
                      {!isCompleted && rxRows.length > 1 && (
                        <button onClick={function () { setRxRows(function (p) { return p.filter(function (r) { return r.id !== row.id; }); }); }} className="text-xs text-rose-500 hover:underline">Remove</button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {/* Generic name */}
                      <div className={emr.show_drug_brand ? "col-span-1 sm:col-span-" + (emr.drug_name_style === "both_required" ? "1" : "2") : "col-span-2 sm:col-span-3"}>
                        <label className="mb-0.5 block text-[10px] font-semibold text-text-muted">
                          {emr.drug_name_style === "generic_first" ? "Generic Name *" : emr.drug_name_style === "both_required" ? "Generic (INN) *" : "Drug Name"}
                        </label>
                        <input value={row.drug_generic} disabled={isCompleted}
                          onChange={function (e) { updateRx(row.id, "drug_generic", e.target.value); }}
                          placeholder={emr.drug_name_hint}
                          className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-sm focus:border-coral focus:outline-none disabled:bg-paper-soft"
                        />
                      </div>

                      {/* Brand name */}
                      {emr.show_drug_brand && (
                        <div>
                          <label className="mb-0.5 block text-[10px] font-semibold text-text-muted">
                            {emr.drug_name_style === "both_required" ? "Brand Name *" : "Brand (optional)"}
                          </label>
                          <input value={row.drug_brand} disabled={isCompleted}
                            onChange={function (e) { updateRx(row.id, "drug_brand", e.target.value); }}
                            placeholder="Brand name"
                            className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-sm focus:border-coral focus:outline-none disabled:bg-paper-soft"
                          />
                        </div>
                      )}

                      {/* Strength */}
                      <div>
                        <label className="mb-0.5 block text-[10px] font-semibold text-text-muted">Strength / Dose</label>
                        <input value={row.strength} disabled={isCompleted}
                          onChange={function (e) { updateRx(row.id, "strength", e.target.value); }}
                          placeholder="e.g. 500mg"
                          className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-sm focus:border-coral focus:outline-none disabled:bg-paper-soft"
                        />
                      </div>

                      {/* Form */}
                      {emr.show_drug_form && (
                        <div>
                          <label className="mb-0.5 block text-[10px] font-semibold text-text-muted">Form</label>
                          <select value={row.form} disabled={isCompleted}
                            onChange={function (e) { updateRx(row.id, "form", e.target.value); }}
                            className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-sm focus:border-coral focus:outline-none disabled:bg-paper-soft"
                          >
                            {DRUG_FORMS.map(function (f) { return <option key={f}>{f}</option>; })}
                          </select>
                        </div>
                      )}

                      {/* Route */}
                      <div>
                        <label className="mb-0.5 block text-[10px] font-semibold text-text-muted">Route</label>
                        <select value={row.route} disabled={isCompleted}
                          onChange={function (e) { updateRx(row.id, "route", e.target.value); }}
                          className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-sm focus:border-coral focus:outline-none disabled:bg-paper-soft"
                        >
                          {ROUTES.map(function (r) { return <option key={r}>{r}</option>; })}
                        </select>
                      </div>

                      {/* Frequency */}
                      <div>
                        <label className="mb-0.5 block text-[10px] font-semibold text-text-muted">Frequency</label>
                        <select value={row.frequency} disabled={isCompleted}
                          onChange={function (e) { updateRx(row.id, "frequency", e.target.value); }}
                          className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-sm focus:border-coral focus:outline-none disabled:bg-paper-soft"
                        >
                          {freqs.map(function (f) { return <option key={f}>{f}</option>; })}
                        </select>
                      </div>

                      {/* Duration */}
                      <div>
                        <label className="mb-0.5 block text-[10px] font-semibold text-text-muted">Duration</label>
                        <input value={row.duration} disabled={isCompleted}
                          onChange={function (e) { updateRx(row.id, "duration", e.target.value); }}
                          placeholder="e.g. 5 days"
                          className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-sm focus:border-coral focus:outline-none disabled:bg-paper-soft"
                        />
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="mb-0.5 block text-[10px] font-semibold text-text-muted">Qty to dispense</label>
                        <input value={row.quantity} disabled={isCompleted}
                          onChange={function (e) { updateRx(row.id, "quantity", e.target.value); }}
                          placeholder="e.g. 10 tabs"
                          className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-sm focus:border-coral focus:outline-none disabled:bg-paper-soft"
                        />
                      </div>

                      {/* Instructions */}
                      <div className="col-span-2">
                        <label className="mb-0.5 block text-[10px] font-semibold text-text-muted">Instructions</label>
                        <input value={row.instructions} disabled={isCompleted}
                          onChange={function (e) { updateRx(row.id, "instructions", e.target.value); }}
                          placeholder="e.g. after food, with water"
                          className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-sm focus:border-coral focus:outline-none disabled:bg-paper-soft"
                        />
                      </div>

                      {/* Drug schedule */}
                      {emr.show_drug_schedule && (
                        <div>
                          <label className="mb-0.5 block text-[10px] font-semibold text-text-muted">Drug Schedule</label>
                          <select value={row.schedule} disabled={isCompleted}
                            onChange={function (e) { updateRx(row.id, "schedule", e.target.value as DrugSchedule); }}
                            className={"w-full rounded-md border px-2.5 py-1.5 text-sm focus:border-coral focus:outline-none disabled:bg-paper-soft " + (isControlled ? "border-amber-300 bg-amber-50" : "border-line bg-white")}
                          >
                            {emr.drug_schedules.map(function (s) { return <option key={s.value} value={s.value}>{s.label}</option>; })}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Controlled drug warning */}
                    {isControlled && emr.controlled_drug_warning && (
                      <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                        ⚠ {emr.controlled_drug_warning}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Documents tab ── */}
          {activeTab === "docs" && (
            <div className="space-y-4">
              {/* Sick note / Medical certificate */}
              {emr.has_sick_note && (
                <div className="rounded-2xl border border-line bg-white p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="font-fraunces text-base text-ink">{emr.sick_note_label}</div>
                    <button
                      onClick={function () { setShowSickNote(!showSickNote); }}
                      className={"rounded-lg px-3 py-1.5 text-xs font-medium " + (showSickNote ? "bg-line text-ink" : "bg-coral/10 text-coral-deep hover:bg-coral/20")}
                    >
                      {showSickNote ? "Collapse" : "Generate"}
                    </button>
                  </div>
                  {showSickNote && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Duration (days)</label>
                          <input type="number" min="1" max={emr.sick_note_max_days}
                            value={sickNote.duration_days}
                            onChange={function (e) { setSickNote(function (p) { return { ...p, duration_days: Number(e.target.value) }; }); }}
                            className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none"
                          />
                        </div>
                        {cc === "GB" && (
                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Fit for Work?</label>
                            <select value={sickNote.fit_for_work}
                              onChange={function (e) { setSickNote(function (p) { return { ...p, fit_for_work: e.target.value as any }; }); }}
                              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none"
                            >
                              <option value="not_fit">Not fit for work</option>
                              <option value="may_be_fit">May be fit for work with adjustments</option>
                            </select>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                          {cc === "AE" ? "Diagnosis (required for DHA sick leave)" : "Reason (general description)"}
                        </label>
                        <input
                          value={cc === "AE" ? (sickNote.diagnosis_for_ae || "") : sickNote.general_reason}
                          onChange={function (e) {
                            if (cc === "AE") setSickNote(function (p) { return { ...p, diagnosis_for_ae: e.target.value }; });
                            else setSickNote(function (p) { return { ...p, general_reason: e.target.value }; });
                          }}
                          placeholder={cc === "AE" ? "e.g. Acute upper respiratory infection (ICD: J06.9)" : "e.g. fever and illness (no specific diagnosis needed)"}
                          className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none"
                        />
                      </div>
                      {cc === "GB" && sickNote.fit_for_work === "may_be_fit" && (
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Work Restrictions / Adjustments</label>
                          <textarea rows={2}
                            value={sickNote.restrictions || ""}
                            onChange={function (e) { setSickNote(function (p) { return { ...p, restrictions: e.target.value }; }); }}
                            placeholder="e.g. amended duties, altered hours, workplace adaptations"
                            className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none"
                          />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={handlePrintSickNote} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                          Print {emr.sick_note_label}
                        </button>
                        {cc === "AE" && (
                          <span className="flex items-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                            Upload to DHA SHERYAN portal after printing.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Referral letter */}
              {emr.has_referral_letter && (
                <div className="rounded-2xl border border-line bg-white p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="font-fraunces text-base text-ink">Referral Letter</div>
                    <button
                      onClick={function () { setShowReferral(!showReferral); }}
                      className={"rounded-lg px-3 py-1.5 text-xs font-medium " + (showReferral ? "bg-line text-ink" : "bg-coral/10 text-coral-deep hover:bg-coral/20")}
                    >
                      {showReferral ? "Collapse" : "Generate"}
                    </button>
                  </div>
                  {showReferral && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Referred to (Specialty)</label>
                          <input value={referral.referred_to_specialty}
                            onChange={function (e) { setReferral(function (p) { return { ...p, referred_to_specialty: e.target.value }; }); }}
                            placeholder="e.g. Cardiology"
                            className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Referred to (Facility)</label>
                          <input value={referral.referred_to_facility || ""}
                            onChange={function (e) { setReferral(function (p) { return { ...p, referred_to_facility: e.target.value }; }); }}
                            placeholder="Hospital / clinic name"
                            className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Urgency</label>
                          <select value={referral.urgency}
                            onChange={function (e) { setReferral(function (p) { return { ...p, urgency: e.target.value as any }; }); }}
                            className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none"
                          >
                            <option value="routine">Routine</option>
                            <option value="urgent">Urgent (within 48h)</option>
                            <option value="emergency">Emergency</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Reason for Referral</label>
                          <input value={referral.reason}
                            onChange={function (e) { setReferral(function (p) { return { ...p, reason: e.target.value }; }); }}
                            placeholder="e.g. Abnormal ECG — further evaluation needed"
                            className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Clinical Summary</label>
                        <textarea rows={3}
                          value={referral.summary}
                          onChange={function (e) { setReferral(function (p) { return { ...p, summary: e.target.value }; }); }}
                          placeholder="Brief clinical summary: presenting complaint, examination findings, current medications, relevant investigations…"
                          className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none"
                        />
                      </div>
                      <button onClick={handlePrintReferral} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                        Print Referral Letter
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Action buttons ── */}
          {!isCompleted && (
            <div className="flex flex-wrap gap-2 print:hidden">
              <button onClick={function () { handleSave(true); }} disabled={saving}
                className="flex-1 rounded-lg bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {saving ? "Saving…" : "Complete consultation & save"}
              </button>
              <button onClick={function () { handleSave(false); }} disabled={saving}
                className="rounded-lg border border-line px-5 py-3 text-sm text-text-dim hover:bg-paper-soft disabled:opacity-50">
                Save draft
              </button>
            </div>
          )}

          {saved && (
            <div className="flex flex-wrap gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 print:hidden">
              <div className="flex-1">
                <div className="text-sm font-semibold text-emerald-700">Consultation saved ✓</div>
                <div className="text-xs text-emerald-600">Record and prescription stored.</div>
              </div>
              <button onClick={function () { router.push("/dashboard/bills/new?patient_id=" + token.patient_id); }}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                Create bill →
              </button>
              <button onClick={function () { router.push("/dashboard/hms/opd"); }}
                className="rounded-lg border border-emerald-300 px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-100">
                Back to queue
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
