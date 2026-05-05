"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useAuth } from "@/app/providers/auth-context";
import { useLocale } from "@/app/providers/locale-context";
import { getPatient, updatePatient, getPatientDeposits, createPatientDeposit, getPatientVisits, getToken } from "@/lib/api";
import type { Patient } from "@/lib/types/Patient";

var BarcodeComp = dynamic(() => import("react-barcode"), { ssr: false });

function ageFromDob(dob?: string): string {
  if (!dob) return "—";
  var years = Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000);
  return years >= 0 ? String(years) + "Y" : "—";
}

function fmtDate(d?: string | number): string {
  if (!d) return "—";
  try {
    var dt = typeof d === "number" ? new Date(d) : new Date(d);
    return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return String(d); }
}

function BloodPill({ v }: { v?: string }) {
  if (!v) return <span className="text-gray-300">—</span>;
  return (
    <span className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">
      {v}
    </span>
  );
}

var PAYMENT_COLOR: Record<string, string> = {
  SELF: "bg-green-50 text-green-700",
  TPA: "bg-blue-50 text-blue-700",
  CASHLESS: "bg-blue-50 text-blue-700",
  PMJAY: "bg-purple-50 text-purple-700",
  CORPORATE: "bg-orange-50 text-orange-700",
  NHS: "bg-teal-50 text-teal-700",
};

function PaymentChip({ v }: { v?: string }) {
  if (!v) return <span className="text-gray-400">—</span>;
  var cls = PAYMENT_COLOR[v] || "bg-gray-100 text-gray-600";
  return (
    <span className={"rounded px-2 py-0.5 text-xs font-semibold " + cls}>{v}</span>
  );
}

var TABS = ["Overview", "Medical History", "Billing History", "Appointments", "Deposits", "Consents", "EHR Records", "Prescriptions"];

function currencySymbol(cc: string): string {
  if (cc === "AE") return "AED ";
  if (cc === "GB") return "£";
  if (cc === "US") return "$";
  return "₹";
}

function fmtCurrency(amount: number | null | undefined, cc: string): string {
  if (amount == null) return "—";
  var sym = currencySymbol(cc);
  var locale = cc === "IN" ? "en-IN" : cc === "AE" ? "en-AE" : cc === "GB" ? "en-GB" : "en-US";
  return sym + Number(amount).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtLocaleDate(d?: string | number, cc?: string): string {
  if (!d) return "—";
  try {
    var dt = typeof d === "number" ? new Date(d) : new Date(d);
    var locale = cc === "US" ? "en-US" : cc === "GB" ? "en-GB" : "en-IN";
    return dt.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
  } catch { return String(d); }
}

var FIELD_LABELS: Record<string, string> = {
  allergies: "Allergies",
  current_medications: "Current Medications",
  chronic_conditions: "Chronic Conditions",
  past_surgical_history: "Surgical History",
};

var FIELD_PLACEHOLDERS: Record<string, string> = {
  allergies: "e.g. Penicillin, Sulfa drugs — or write None",
  current_medications: "List current medications",
  chronic_conditions: "e.g. Type 2 Diabetes, Hypertension",
  past_surgical_history: "Past surgeries or procedures",
};

export default function PatientProfilePage() {
  var params = useParams<{ id: string }>();
  var id = params.id;
  var { user } = useAuth();
  var { localeV2 } = useLocale();
  var router = useRouter();
  var hospitalId = user?.hospital_id || "";
  var cc = localeV2?.country_code || "IN";

  var [patient, setPatient] = useState<Patient | null>(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState("");
  var [tab, setTab] = useState(0);

  var [editField, setEditField] = useState<string | null>(null);
  var [editValue, setEditValue] = useState("");
  var [savingEdit, setSavingEdit] = useState(false);

  var [bills, setBills] = useState<any[]>([]);
  var [billsLoading, setBillsLoading] = useState(false);

  var [appts, setAppts] = useState<any[]>([]);
  var [apptsLoading, setApptsLoading] = useState(false);

  var [deposits, setDeposits] = useState<any[]>([]);
  var [depositsLoading, setDepositsLoading] = useState(false);
  var [showAddDeposit, setShowAddDeposit] = useState(false);
  var [newDep, setNewDep] = useState({ amount: "", deposit_date: "", receipt_ref: "", deposit_type: "Refundable" });
  var [savingDep, setSavingDep] = useState(false);

  var [visits, setVisits] = useState<any[]>([]);
  var [visitsLoading, setVisitsLoading] = useState(false);
  var [expandedVisit, setExpandedVisit] = useState<string | null>(null);

  useEffect(function () {
    if (!hospitalId || !id) return;
    setLoading(true);
    getPatient(hospitalId, id)
      .then(function (res: any) {
        if (res.success || res.patient) setPatient(res.patient);
        else setError("Could not load patient");
      })
      .catch(function () { setError("Could not load patient"); })
      .finally(function () { setLoading(false); });
  }, [hospitalId, id]);

  useEffect(function () {
    if (tab !== 2 || !patient?.uhid || !hospitalId) return;
    setBillsLoading(true);
    var token = getToken();
    fetch("/api/hospitals/" + hospitalId + "/rcm/billing/bills?patient_uhid=" + encodeURIComponent(patient.uhid), {
      headers: token ? { Authorization: "Bearer " + token } : {},
    })
      .then(function (r) { return r.json(); })
      .then(function (d) { setBills(d.bills || d.data || []); })
      .catch(function () { setBills([]); })
      .finally(function () { setBillsLoading(false); });
  }, [tab, patient?.uhid, hospitalId]);

  useEffect(function () {
    if (tab !== 3 || !patient?.phone || !hospitalId) return;
    setApptsLoading(true);
    var token = getToken();
    fetch("/api/mhai/appointments?patient_phone=" + encodeURIComponent(patient.phone), {
      headers: token ? { Authorization: "Bearer " + token } : {},
    })
      .then(function (r) { return r.json(); })
      .then(function (d) { setAppts(d.appointments || []); })
      .catch(function () { setAppts([]); })
      .finally(function () { setApptsLoading(false); });
  }, [tab, patient?.phone, hospitalId]);

  useEffect(function () {
    if (tab !== 4 || !hospitalId || !id) return;
    setDepositsLoading(true);
    getPatientDeposits(hospitalId, id)
      .then(function (res: any) { setDeposits(res.deposits || []); })
      .catch(function () { setDeposits([]); })
      .finally(function () { setDepositsLoading(false); });
  }, [tab, hospitalId, id]);

  useEffect(function () {
    if ((tab !== 6 && tab !== 7) || !hospitalId || !id) return;
    if (visits.length > 0) return; // already loaded
    setVisitsLoading(true);
    getPatientVisits(hospitalId, id)
      .then(function (res: any) { setVisits(res.visits || res.data || []); })
      .catch(function () { setVisits([]); })
      .finally(function () { setVisitsLoading(false); });
  }, [tab, hospitalId, id]);

  async function saveEdit() {
    if (!editField || !hospitalId) return;
    setSavingEdit(true);
    try {
      var body: Record<string, any> = {};
      body[editField] = editValue;
      var res: any = await updatePatient(hospitalId, id, body);
      if (res.success || res.patient) {
        var field = editField;
        setPatient(function (p) { return p ? { ...p, [field]: editValue } : p; });
        setEditField(null);
      }
    } catch {} finally { setSavingEdit(false); }
  }

  async function addDeposit() {
    if (!newDep.amount || !newDep.deposit_date) return;
    setSavingDep(true);
    try {
      var res: any = await createPatientDeposit(hospitalId, id, {
        amount: parseFloat(newDep.amount),
        deposit_date: newDep.deposit_date,
        receipt_ref: newDep.receipt_ref || undefined,
        deposit_type: newDep.deposit_type,
      });
      if (res.success || res.deposit) {
        var fetched: any = await getPatientDeposits(hospitalId, id);
        setDeposits(fetched.deposits || []);
        setShowAddDeposit(false);
        setNewDep({ amount: "", deposit_date: "", receipt_ref: "", deposit_type: "Refundable" });
      }
    } catch {} finally { setSavingDep(false); }
  }

  var I = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/20";
  var L = "block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1";

  var PRINT_CSS =
    "body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#111;margin:0;padding:0;}" +
    "table{border-collapse:collapse;width:100%;}" +
    "th,td{font-size:11px;vertical-align:top;padding:3px 6px;}" +
    "th{background:#1a1a1a;color:#fff;text-align:left;font-size:10px;padding:4px 6px;}" +
    "tr:nth-child(even) td{background:#f8f8f8;}" +
    ".wrap{max-width:800px;margin:0 auto;padding:16px;}" +
    ".rule2{border:none;border-top:2px solid #1a1a1a;margin:10px 0;}" +
    ".rule1{border:none;border-top:1px solid #ccc;margin:8px 0;}" +
    ".label{font-size:10px;color:#666;font-weight:600;text-transform:uppercase;letter-spacing:.04em;}" +
    ".section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#555;margin:10px 0 4px;}" +
    ".note-box{font-size:11px;line-height:1.5;border-left:3px solid #ddd;padding-left:8px;margin:4px 0;color:#333;}" +
    ".footer-bar{margin-top:20px;padding-top:8px;border-top:1px solid #ddd;display:flex;justify-content:space-between;}" +
    "@page{margin:12mm;size:A4 portrait;}" +
    "@media print{body{padding:0;}}";

  function openPrint(title: string, bodyHtml: string) {
    var win = window.open("", "_blank", "width=860,height=1000");
    if (!win) { alert("Allow pop-ups to print."); return; }
    win.document.write("<!DOCTYPE html><html><head><meta charset='utf-8'><title>" + title + "</title><style>" + PRINT_CSS + "</style></head><body><div class='wrap'>" + bodyHtml + "</div></body></html>");
    win.document.close();
    win.focus();
    var ref = win;
    setTimeout(function () { ref.print(); }, 700);
  }

  function getClinicBranding(): any {
    try { return JSON.parse(localStorage.getItem("mhai_brand_dna") || "{}"); } catch { return {}; }
  }

  function printBill(bill: any) {
    var brand = getClinicBranding();
    var clinicName = brand.clinic_name || "MediHost Clinic";
    var sym = currencySymbol(cc);
    var dateStr = bill.bill_date ? fmtLocaleDate(bill.bill_date, cc) : "—";
    var items: any[] = bill.items || bill.line_items || [];
    var itemRows = items.length > 0
      ? items.map(function (it: any) {
          return "<tr><td>" + (it.description || it.item_name || "—") + "</td><td>" + (it.quantity || 1) + "</td><td style='text-align:right'>" + sym + Number(it.unit_price || it.amount || 0).toFixed(2) + "</td><td style='text-align:right'>" + sym + Number(it.total || it.amount || 0).toFixed(2) + "</td></tr>";
        }).join("")
      : "<tr><td colspan='4' style='text-align:center;color:#999'>No line items</td></tr>";
    var html =
      "<div style='font-size:17px;font-weight:700;margin-bottom:4px'>" + clinicName + "</div>" +
      "<hr class='rule2'>" +
      "<table style='font-size:11px;margin:6px 0'><tr>" +
      "<td style='width:50%'><span class='label'>Patient</span><br><strong>" + (patient?.name || "—") + "</strong></td>" +
      "<td><span class='label'>UHID</span><br>" + (patient?.uhid || "—") + "</td>" +
      "<td style='text-align:right'><span class='label'>Bill No.</span><br><strong>" + (bill.bill_number || "—") + "</strong><br><span class='label'>Date: " + dateStr + "</span></td>" +
      "</tr></table><hr class='rule1'>" +
      "<div class='section-title'>Bill Items</div>" +
      "<table><thead><tr><th>Description</th><th>Qty</th><th style='text-align:right'>Unit</th><th style='text-align:right'>Total</th></tr></thead><tbody>" + itemRows + "</tbody></table>" +
      "<hr class='rule1'>" +
      "<table style='font-size:12px;margin-top:4px'><tr>" +
      "<td style='width:60%'></td>" +
      "<td><strong>Subtotal</strong></td><td style='text-align:right'><strong>" + sym + Number(bill.subtotal || bill.total_amount || 0).toFixed(2) + "</strong></td>" +
      "</tr>" +
      (bill.discount_amount ? "<tr><td></td><td>Discount</td><td style='text-align:right'>-" + sym + Number(bill.discount_amount).toFixed(2) + "</td></tr>" : "") +
      (bill.tax_amount ? "<tr><td></td><td>Tax</td><td style='text-align:right'>" + sym + Number(bill.tax_amount).toFixed(2) + "</td></tr>" : "") +
      "<tr><td></td><td><strong>Total</strong></td><td style='text-align:right'><strong style='font-size:14px'>" + sym + Number(bill.total_amount || 0).toFixed(2) + "</strong></td></tr>" +
      (bill.amount_paid != null ? "<tr><td></td><td>Paid</td><td style='text-align:right;color:green'>" + sym + Number(bill.amount_paid).toFixed(2) + "</td></tr>" : "") +
      (bill.balance_due != null ? "<tr><td></td><td>Balance Due</td><td style='text-align:right;color:red'>" + sym + Number(bill.balance_due).toFixed(2) + "</td></tr>" : "") +
      "</table>" +
      "<div class='footer-bar'><span style='font-size:9px;color:#999'>Generated by MHAI Platform</span><span style='font-size:9px;color:#999'>" + bill.bill_status + "</span></div>";
    openPrint("Bill — " + (bill.bill_number || ""), html);
  }

  function printPrescription(visit: any) {
    var brand = getClinicBranding();
    var clinicName = brand.clinic_name || "MediHost Clinic";
    var visitDate = fmtLocaleDate(visit.visit_date || visit.created_at, cc);
    var rx: any[] = visit.prescription || visit.medications || [];
    var rxRows = rx.length > 0
      ? rx.map(function (m: any) {
          return "<tr><td>" + (m.drug || m.drug_generic || "—") + (m.drug_brand ? "<br><small style='color:#666'>" + m.drug_brand + "</small>" : "") + "</td>" +
            "<td>" + (m.dose || m.strength || "—") + "</td>" +
            "<td>" + (m.form || "—") + "</td>" +
            "<td>" + (m.frequency || "—") + "</td>" +
            "<td>" + (m.duration || "—") + "</td>" +
            "<td>" + (m.instructions || "—") + "</td></tr>";
        }).join("")
      : "<tr><td colspan='6' style='text-align:center;color:#999'>No medications</td></tr>";
    var html =
      "<div style='font-size:17px;font-weight:700;margin-bottom:2px'>" + clinicName + "</div>" +
      "<hr class='rule2'>" +
      "<table style='font-size:11px;margin:4px 0'><tr>" +
      "<td style='width:50%'><span class='label'>Patient</span><br><strong>" + (patient?.name || "—") + "</strong></td>" +
      "<td><span class='label'>UHID</span><br>" + (patient?.uhid || "—") + "</td>" +
      "<td style='text-align:right'><span class='label'>Visit Date</span><br>" + visitDate + "</td>" +
      "</tr></table>" +
      (visit.diagnosis ? "<div class='section-title'>Diagnosis</div><div class='note-box'>" + visit.diagnosis + "</div>" : "") +
      (visit.subjective ? "<div class='section-title'>Chief Complaint</div><div class='note-box'>" + visit.subjective + "</div>" : "") +
      "<div class='section-title'>Prescription (℞)</div>" +
      "<table><thead><tr><th>Drug</th><th>Dose</th><th>Form</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead><tbody>" + rxRows + "</tbody></table>" +
      (visit.notes ? "<div class='section-title'>Doctor Notes / Plan</div><div class='note-box'>" + visit.notes + "</div>" : "") +
      (visit.follow_up ? "<div class='section-title'>Follow-up</div><div class='note-box'>Date: " + fmtLocaleDate(visit.follow_up, cc) + "</div>" : "") +
      "<div class='footer-bar'><span style='font-size:9px;color:#999'>Printed from MHAI Platform — " + new Date().toLocaleDateString() + "</span></div>";
    openPrint("Prescription — " + (patient?.name || ""), html);
  }

  function printPatientCard(p: Patient) {
    var brand: any = {};
    try { brand = JSON.parse(localStorage.getItem('mhai_brand_dna') || '{}'); } catch (e) {}
    var clinicName = brand.clinic_name || 'MediHost Clinic';
    var barcodeSvgEl = document.querySelector('#patient-barcode-area svg');
    var barcodeHtml = barcodeSvgEl ? (barcodeSvgEl as Element).outerHTML : '';
    var regDate = p.created_at ? new Date(Number(p.created_at)).toLocaleDateString('en-IN') : '—';
    var html = '<!DOCTYPE html><html><head><title>Patient Card - ' + p.name + '</title>' +
      '<style>body{font-family:Arial,sans-serif;padding:20px;font-size:12px;}' +
      '.card{border:2px solid #333;border-radius:8px;padding:16px;max-width:400px;}' +
      '.clinic{font-size:14px;font-weight:bold;margin-bottom:8px;}' +
      '.uhid{font-family:monospace;font-size:14px;font-weight:bold;color:#e8421a;margin:8px 0;}' +
      '.barcode{margin:10px 0;text-align:center;}' +
      '.row{display:flex;justify-content:space-between;margin:4px 0;}' +
      '.lbl{color:#666;}@media print{body{margin:0;}}</style>' +
      '</head><body><div class="card">' +
      '<div class="clinic">' + clinicName + '</div>' +
      '<div class="barcode">' + barcodeHtml + '</div>' +
      '<div class="uhid">' + (p.uhid || '—') + '</div>' +
      '<div class="row"><span class="lbl">Name:</span><span>' + p.name + '</span></div>' +
      '<div class="row"><span class="lbl">DOB:</span><span>' + (p.date_of_birth || '—') + '</span></div>' +
      '<div class="row"><span class="lbl">Gender:</span><span>' + (p.gender || '—') + '</span></div>' +
      '<div class="row"><span class="lbl">Blood Group:</span><span>' + (p.blood_group || '—') + '</span></div>' +
      '<div class="row"><span class="lbl">Phone:</span><span>' + (p.phone || '—') + '</span></div>' +
      '<div class="row"><span class="lbl">Registered:</span><span>' + regDate + '</span></div>' +
      '</div></body></html>';
    var win = window.open('', '_blank', 'width=500,height=700');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    var winRef = win;
    setTimeout(function () { winRef.print(); winRef.close(); }, 500);
  }

  if (loading) {
    return (
      <div className="px-8 py-10 text-center">
        <div className="mx-auto h-8 w-48 animate-pulse rounded bg-gray-100" />
        <p className="mt-3 text-sm text-gray-400">Loading patient…</p>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="px-8 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error || "Patient not found"}
        </div>
        <button onClick={function () { router.back(); }}
          className="mt-3 text-sm text-orange-600 hover:underline">
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="px-8 py-6">

      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm">
            <button onClick={function () { router.back(); }} className="text-gray-500 hover:text-orange-600">← Patients</button>
            <span className="text-gray-300">/</span>
            <span className="font-semibold text-gray-900">{patient.name}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-orange-600">{patient.uhid}</span>
            {patient.is_active === false && (
              <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Inactive</span>
            )}
          </div>
        </div>
        <Link
          href={"/dashboard/billing/opd?patientId=" + patient.id}
          className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        >
          New Bill
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-5 overflow-x-auto">
        <div className="flex min-w-max border-b border-gray-200">
          {TABS.map(function (t, i) {
            return (
              <button key={t} type="button" onClick={function () { setTab(i); }}
                className={"whitespace-nowrap px-5 py-3 text-sm font-bold border-b-2 transition-colors " +
                  (tab === i ? "border-orange-600 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700")}>
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TAB 1: Overview ── */}
      {tab === 0 && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-4">

            {/* Barcode card */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div id="patient-barcode-area">
                    <BarcodeComp value={patient.uhid || "NONE"} width={1.5} height={50} fontSize={12} />
                  </div>
                  <div className="mt-1 font-mono text-sm font-bold text-orange-600">{patient.uhid}</div>
                </div>
                <div className="flex gap-2">
                  <Link href={"/dashboard/billing/print?patientId=" + patient.id}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    Print Labels
                  </Link>
                  <button type="button" onClick={function () { if (patient) printPatientCard(patient); }}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    Print Card
                  </button>
                </div>
              </div>
            </div>

            {/* Identity */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-500">Identity</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className={L}>Full Name</div>
                  <div className="text-sm font-semibold text-gray-900">{patient.name}</div>
                </div>
                <div>
                  <div className={L}>Date of Birth</div>
                  <div className="text-sm text-gray-900">
                    {fmtDate(patient.date_of_birth)}
                    {patient.date_of_birth && <span className="ml-1.5 text-gray-400 text-xs">({ageFromDob(patient.date_of_birth)})</span>}
                  </div>
                </div>
                <div>
                  <div className={L}>Gender</div>
                  <div className="text-sm text-gray-900">{patient.gender || "—"}</div>
                </div>
                <div>
                  <div className={L}>Blood Group</div>
                  <BloodPill v={patient.blood_group} />
                </div>
              </div>
            </div>

            {/* Government IDs */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-500">Government ID</h3>
              {cc === "IN" && (
                <div className="space-y-3">
                  <div>
                    <div className={L}>ABHA ID</div>
                    {patient.abha_id ? (
                      <div className="font-mono text-sm font-semibold text-gray-900">{patient.abha_id}</div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          No ABHA on record
                        </span>
                        <a href="https://abha.abdm.gov.in" target="_blank" rel="noreferrer"
                          className="text-xs text-orange-600 hover:underline">
                          Help create ABHA →
                        </a>
                      </div>
                    )}
                  </div>
                  {patient.abha_address && (
                    <div>
                      <div className={L}>ABHA Address</div>
                      <div className="font-mono text-sm text-gray-700">{patient.abha_address}</div>
                    </div>
                  )}
                </div>
              )}
              {cc === "AE" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className={L}>Emirates ID</div>
                    <div className="font-mono text-sm font-semibold text-gray-900">{patient.emirates_id || "—"}</div>
                  </div>
                  <div>
                    <div className={L}>Nationality</div>
                    <div className="font-mono text-sm text-gray-900">{patient.nationality_code || "—"}</div>
                  </div>
                  <div>
                    <div className={L}>Passport No.</div>
                    <div className="font-mono text-sm text-gray-900">{patient.passport_number || "—"}</div>
                  </div>
                </div>
              )}
              {cc !== "IN" && cc !== "AE" && (
                <p className="text-sm text-gray-400">No government ID linked</p>
              )}
            </div>

            {/* Contact */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-500">Contact</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className={L}>Phone</div>
                  <div className="text-sm font-medium text-gray-900">{patient.phone || "—"}</div>
                </div>
                <div>
                  <div className={L}>Email</div>
                  <div className="text-sm font-medium text-gray-900">{patient.email || "—"}</div>
                </div>
                {(patient.address_line1 || patient.city) && (
                  <div className="col-span-2">
                    <div className={L}>Address</div>
                    <div className="text-sm text-gray-900">
                      {[patient.address_line1, patient.address_line2, patient.city, patient.state, patient.pincode]
                        .filter(Boolean).join(", ")}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Emergency */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-500">Emergency Contact</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className={L}>Name</div>
                  <div className="text-sm font-medium text-gray-900">{patient.emergency_contact_name || "—"}</div>
                </div>
                <div>
                  <div className={L}>Phone</div>
                  <div className="text-sm font-medium text-gray-900">{patient.emergency_contact_phone || "—"}</div>
                </div>
                <div>
                  <div className={L}>Relationship</div>
                  <div className="text-sm font-medium text-gray-900">{patient.emergency_contact_relation || "—"}</div>
                </div>
              </div>
            </div>

            {/* Insurance */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-500">Insurance / Payment</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className={L}>Payment Type</div>
                  <div className="mt-0.5"><PaymentChip v={patient.payment_type} /></div>
                </div>
                {patient.insurance_card_number && (
                  <div>
                    <div className={L}>Card Number</div>
                    <div className="font-mono text-sm text-gray-900">
                      {"****-" + patient.insurance_card_number.slice(-4)}
                    </div>
                  </div>
                )}
                {patient.insurance_card_expiry && (
                  <div>
                    <div className={L}>Card Expiry</div>
                    <div className={"font-mono text-sm font-semibold " +
                      (new Date(patient.insurance_card_expiry) < new Date() ? "text-red-600" : "text-gray-900")}>
                      {fmtDate(patient.insurance_card_expiry)}
                      {new Date(patient.insurance_card_expiry) < new Date() && " — EXPIRED"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Registration */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-500">Registration</h3>
              <div className="grid grid-cols-2 gap-4">
                {patient.registration_mode && (
                  <div>
                    <div className={L}>Source</div>
                    <div className="text-sm font-medium text-gray-900">{patient.registration_mode}</div>
                  </div>
                )}
                {patient.referred_by && (
                  <div>
                    <div className={L}>Referred By</div>
                    <div className="text-sm font-medium text-gray-900">{patient.referred_by}</div>
                  </div>
                )}
                {patient.first_visit_at && (
                  <div>
                    <div className={L}>First Visit</div>
                    <div className="text-sm text-gray-900">{fmtDate(patient.first_visit_at)}</div>
                  </div>
                )}
                {patient.created_at && (
                  <div>
                    <div className={L}>Registered</div>
                    <div className="text-sm text-gray-900">
                      {fmtDate(new Date(Number(patient.created_at)).toISOString())}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>{/* col-span-2 */}

          {/* Sidebar */}
          <div>
            <div className="sticky top-20 space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-gray-500">Quick Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Visits</span>
                    <span className="font-bold text-gray-900">
                      {patient.total_visits ?? patient.visit_count ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Visit</span>
                    <span className="text-gray-900">
                      {fmtDate(patient.last_visit_at || patient.last_visit_date || undefined)}
                    </span>
                  </div>
                </div>
              </div>
              {patient.notes && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="mb-1 text-xs font-bold uppercase tracking-wide text-amber-700">Notes</div>
                  <p className="text-xs text-amber-800">{patient.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Medical History ── */}
      {tab === 1 && (
        <div className="grid grid-cols-2 gap-5">
          {(["allergies", "current_medications", "chronic_conditions", "past_surgical_history"] as const).map(function (field) {
            var val: string = (patient as any)[field] || "";
            return (
              <div key={field} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
                    {FIELD_LABELS[field]}
                  </h3>
                  {editField !== field && (
                    <button type="button"
                      onClick={function () { setEditField(field); setEditValue(val); }}
                      className="text-xs font-semibold text-orange-600 hover:underline">
                      Edit
                    </button>
                  )}
                </div>
                {editField === field ? (
                  <div>
                    <textarea
                      value={editValue}
                      onChange={function (e) { setEditValue(e.target.value); }}
                      rows={4}
                      className={I + " resize-none"}
                      placeholder={FIELD_PLACEHOLDERS[field]}
                    />
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={saveEdit} disabled={savingEdit}
                        className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-60">
                        {savingEdit ? "Saving…" : "Save"}
                      </button>
                      <button type="button" onClick={function () { setEditField(null); }}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className={val ? "text-sm text-gray-900 whitespace-pre-wrap" : "text-sm text-gray-400"}>
                    {val || "None recorded"}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB 3: Billing History ── */}
      {tab === 2 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Billing History</h3>
            <Link href={"/dashboard/billing/opd?patientId=" + patient.id}
              className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">
              New Bill
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {["Bill No.", "Date", "Type", "Doctor", "Amount", "Status", ""].map(function (h) {
                    return (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        {h}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {billsLoading ? (
                  [1, 2, 3].map(function (i) {
                    return (
                      <tr key={i}>
                        {[1, 2, 3, 4, 5, 6, 7].map(function (j) {
                          return (
                            <td key={j} className="px-4 py-3">
                              <div className="h-4 animate-pulse rounded bg-gray-100" />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                ) : bills.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <p className="text-sm font-medium text-gray-700">No bills yet</p>
                      <Link href={"/dashboard/billing/opd?patientId=" + patient.id}
                        className="mt-2 inline-block text-sm text-orange-600 hover:underline">
                        Create first bill →
                      </Link>
                    </td>
                  </tr>
                ) : (
                  bills.map(function (b: any) {
                    var statusCls = b.bill_status === "FINAL"
                      ? "bg-green-100 text-green-700"
                      : b.bill_status === "VOID" || b.bill_status === "CANCELLED"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-600";
                    return (
                      <tr key={b.id || b.bill_id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-mono text-sm font-semibold text-orange-600">
                          {b.bill_number || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {fmtLocaleDate(b.bill_date, cc)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {b.bill_type || b.encounter_type || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {b.attending_doctor || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          {fmtCurrency(b.total_amount, cc)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={"rounded px-2 py-0.5 text-xs font-semibold " + statusCls}>
                            {b.bill_status || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={function () { printBill(b); }}
                            className="rounded border border-gray-300 px-2 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-50"
                          >
                            Print
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: Appointments ── */}
      {tab === 3 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Appointment history</h3>
            <button
              type="button"
              onClick={function () { router.push("/dashboard/appointments?name=" + encodeURIComponent(patient?.name || "")); }}
              className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700"
            >
              + Book appointment
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {["Date", "Time", "Type", "Mode", "Reason / Notes", "Status"].map(function (h) {
                    return (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        {h}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {apptsLoading ? (
                  [1, 2, 3].map(function (i) {
                    return (
                      <tr key={i}>
                        {[1, 2, 3, 4, 5, 6].map(function (j) {
                          return (
                            <td key={j} className="px-4 py-3">
                              <div className="h-4 animate-pulse rounded bg-gray-100" />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                ) : appts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="mx-auto mb-2 text-2xl">📅</div>
                      <p className="text-sm font-medium text-gray-700">No appointments yet</p>
                    </td>
                  </tr>
                ) : (
                  appts.map(function (a: any) {
                    var statusColors: Record<string, string> = {
                      completed: "bg-green-100 text-green-700",
                      confirmed: "bg-blue-100 text-blue-700",
                      pending: "bg-amber-100 text-amber-700",
                      cancelled: "bg-red-100 text-red-700",
                      no_show: "bg-gray-100 text-gray-600",
                    };
                    var sc = statusColors[a.status] || "bg-gray-100 text-gray-600";
                    return (
                      <tr key={a.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {a.slot_date ? new Date(a.slot_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{a.slot_time || "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{a.appointment_type || "Consultation"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{a.consultation_mode || "In-person"}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{a.reason || a.notes || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={"rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize " + sc}>
                            {a.status || "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: Deposits ── */}
      {tab === 4 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Deposits</h3>
            <button type="button" onClick={function () { setShowAddDeposit(true); }}
              className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">
              Add Deposit
            </button>
          </div>

          {showAddDeposit && (
            <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5">
              <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-500">New Deposit</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={L}>Amount *</label>
                  <input type="number" min="0" value={newDep.amount}
                    onChange={function (e) { setNewDep(function (d) { return { ...d, amount: e.target.value }; }); }}
                    className={I} placeholder="0.00" />
                </div>
                <div>
                  <label className={L}>Deposit Date *</label>
                  <input type="date" value={newDep.deposit_date}
                    onChange={function (e) { setNewDep(function (d) { return { ...d, deposit_date: e.target.value }; }); }}
                    className={I} />
                </div>
                <div>
                  <label className={L}>Receipt Ref</label>
                  <input value={newDep.receipt_ref}
                    onChange={function (e) { setNewDep(function (d) { return { ...d, receipt_ref: e.target.value }; }); }}
                    className={I + " font-mono"} placeholder="RCP-001" />
                </div>
                <div>
                  <label className={L}>Deposit Type</label>
                  <select value={newDep.deposit_type}
                    onChange={function (e) { setNewDep(function (d) { return { ...d, deposit_type: e.target.value }; }); }}
                    className={I}>
                    <option>Refundable</option>
                    <option>Non-refundable</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={addDeposit} disabled={savingDep}
                  className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-60">
                  {savingDep ? "Saving…" : "Save Deposit"}
                </button>
                <button type="button" onClick={function () { setShowAddDeposit(false); }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {["Date", "Amount", "Receipt Ref", "Type", "Status"].map(function (h) {
                    return (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        {h}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {depositsLoading ? (
                  [1, 2].map(function (i) {
                    return (
                      <tr key={i}>
                        {[1, 2, 3, 4, 5].map(function (j) {
                          return (
                            <td key={j} className="px-4 py-3">
                              <div className="h-4 animate-pulse rounded bg-gray-100" />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                ) : deposits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-gray-500">
                      No deposits recorded
                    </td>
                  </tr>
                ) : (
                  deposits.map(function (dep: any, i: number) {
                    return (
                      <tr key={dep.id || i} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {dep.deposit_date ? new Date(dep.deposit_date).toLocaleDateString("en-IN") : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          {fmtCurrency(dep.amount || 0, cc)}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">
                          {dep.receipt_ref || dep.ref || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {dep.deposit_type || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={dep.status === "ADJUSTED"
                            ? "rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600"
                            : "rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700"}>
                            {dep.status === "ADJUSTED" ? "Adjusted" : "Available"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: Consents ── */}
      {tab === 5 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["Consent", "Status", "Notes"].map(function (h) {
                  return (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      {h}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { field: "consent_treatment",      label: "Treatment Consent",  note: "Consent to receive medical treatment" },
                { field: "consent_data_processing", label: "Data Processing",    note: cc === "IN" ? "DPDPA 2023" : cc === "AE" ? "PDPL UAE" : cc === "GB" ? "UK-GDPR" : "HIPAA" },
                { field: "consent_abha_sharing",    label: "ABHA Data Sharing",  note: "ABDM network sharing (India)" },
                { field: "consent_nhs_scr",         label: "NHS SCR",            note: "NHS Summary Care Record access (UK)" },
                { field: "consent_hipaa_npp",       label: "HIPAA NPP",          note: "HIPAA Notice of Privacy Practices (US)" },
                { field: "consent_marketing",       label: "Marketing",          note: "Appointment reminders and health tips" },
              ].map(function (row) {
                var val = (patient as any)[row.field];
                return (
                  <tr key={row.field} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{row.label}</td>
                    <td className="px-4 py-3">
                      {val === true ? (
                        <span className="flex items-center gap-1 text-sm font-semibold text-green-700">
                          <span className="text-base leading-none">✓</span> Granted
                        </span>
                      ) : val === false ? (
                        <span className="flex items-center gap-1 text-sm font-semibold text-red-600">
                          <span className="text-base leading-none">✕</span> Declined
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Not recorded</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{row.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB 6: EHR Records ── */}
      {tab === 6 && (
        <div className="space-y-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">EHR Records</h3>
              <p className="mt-0.5 text-xs text-gray-500">All consultation records saved during OPD visits</p>
            </div>
            <Link
              href={"/dashboard/hms/opd"}
              className="rounded-xl border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100"
            >
              OPD Queue →
            </Link>
          </div>

          {visitsLoading ? (
            [1, 2, 3].map(function (i) {
              return (
                <div key={i} className="h-20 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
              );
            })
          ) : visits.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center">
              <p className="text-sm font-medium text-gray-700">No EHR records yet</p>
              <p className="mt-1 text-xs text-gray-400">Records are saved after each OPD consultation</p>
            </div>
          ) : (
            visits.map(function (v: any, idx: number) {
              var vid = v.visit_record_id || v.id || String(idx);
              var isOpen = expandedVisit === vid;
              var visitDate = fmtLocaleDate(v.visit_date || v.created_at, cc);
              var hasRx = (v.prescription || v.medications || []).length > 0;
              return (
                <div key={vid} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <button
                    type="button"
                    onClick={function () { setExpandedVisit(isOpen ? null : vid); }}
                    className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600 text-sm font-bold">
                        {String(visits.length - idx).padStart(2, "0")}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{visitDate}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                          {v.doctor_name && <span>{v.doctor_name}</span>}
                          {v.diagnosis && <span className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-blue-700">{v.diagnosis.split(" ")[0]}</span>}
                          {hasRx && <span className="rounded bg-green-50 px-1.5 py-0.5 text-green-700">℞ Rx</span>}
                        </div>
                      </div>
                    </div>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
                      className={"transition-transform text-gray-400 " + (isOpen ? "rotate-180" : "")}>
                      <path d="M4 6l4 4 4-4" />
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 px-5 py-4 space-y-4">
                      {v.diagnosis && (
                        <div>
                          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Diagnosis</div>
                          <p className="text-sm text-gray-900">{v.diagnosis}</p>
                        </div>
                      )}
                      {v.subjective && (
                        <div>
                          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Chief Complaint (S)</div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{v.subjective}</p>
                        </div>
                      )}
                      {v.objective && (
                        <div>
                          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Examination (O)</div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{v.objective}</p>
                        </div>
                      )}
                      {v.assessment && (
                        <div>
                          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Assessment (A)</div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{v.assessment}</p>
                        </div>
                      )}
                      {v.plan && (
                        <div>
                          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Plan (P)</div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{v.plan}</p>
                        </div>
                      )}
                      {v.notes && (
                        <div>
                          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Notes</div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{v.notes}</p>
                        </div>
                      )}
                      {v.follow_up && (
                        <div>
                          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Follow-up Date</div>
                          <p className="text-sm text-gray-900">{fmtLocaleDate(v.follow_up, cc)}</p>
                        </div>
                      )}
                      {hasRx && (
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Prescription</div>
                            <button
                              type="button"
                              onClick={function () { printPrescription(v); }}
                              className="rounded border border-orange-300 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-100"
                            >
                              Print Rx
                            </button>
                          </div>
                          <div className="overflow-x-auto rounded-lg border border-gray-100">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-gray-50">
                                  {["Drug", "Dose", "Form", "Freq.", "Duration", "Instructions"].map(function (h) {
                                    return <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500">{h}</th>;
                                  })}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {(v.prescription || v.medications || []).map(function (m: any, mi: number) {
                                  return (
                                    <tr key={mi} className="hover:bg-gray-50/50">
                                      <td className="px-3 py-2 font-medium text-gray-900">
                                        {m.drug || m.drug_generic || "—"}
                                        {m.drug_brand && <div className="text-[10px] text-gray-400">{m.drug_brand}</div>}
                                      </td>
                                      <td className="px-3 py-2 text-gray-600">{m.dose || m.strength || "—"}</td>
                                      <td className="px-3 py-2 text-gray-600">{m.form || "—"}</td>
                                      <td className="px-3 py-2 text-gray-600">{m.frequency || "—"}</td>
                                      <td className="px-3 py-2 text-gray-600">{m.duration || "—"}</td>
                                      <td className="px-3 py-2 text-gray-500">{m.instructions || "—"}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── TAB 7: Prescriptions ── */}
      {tab === 7 && (
        <div className="space-y-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Prescriptions</h3>
            <p className="mt-0.5 text-xs text-gray-500">All Rx saved during consultations — click Print to open a printable copy</p>
          </div>

          {visitsLoading ? (
            [1, 2].map(function (i) {
              return (
                <div key={i} className="h-32 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
              );
            })
          ) : visits.filter(function (v: any) { return (v.prescription || v.medications || []).length > 0; }).length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center">
              <p className="text-sm font-medium text-gray-700">No prescriptions yet</p>
              <p className="mt-1 text-xs text-gray-400">Prescriptions are saved after each OPD consultation where medications are added</p>
            </div>
          ) : (
            visits
              .filter(function (v: any) { return (v.prescription || v.medications || []).length > 0; })
              .map(function (v: any, idx: number) {
                var vid = v.visit_record_id || v.id || String(idx);
                var visitDate = fmtLocaleDate(v.visit_date || v.created_at, cc);
                var rx: any[] = v.prescription || v.medications || [];
                return (
                  <div key={vid} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Visit — {visitDate}</div>
                        <div className="mt-0.5 text-xs text-gray-400">
                          {v.doctor_name && <span>{v.doctor_name} · </span>}
                          {rx.length} medication{rx.length !== 1 ? "s" : ""}
                          {v.diagnosis && <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] text-blue-700">{v.diagnosis.split(" ")[0]}</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={function () { printPrescription(v); }}
                        className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700"
                      >
                        Print Rx
                      </button>
                    </div>
                    <div className="overflow-x-auto px-5 py-4">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-100">
                            {["Drug", "Brand", "Dose", "Form", "Route", "Frequency", "Duration", "Instructions"].map(function (h) {
                              return <th key={h} className="pb-2 pr-4 text-left font-semibold text-gray-400">{h}</th>;
                            })}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {rx.map(function (m: any, mi: number) {
                            return (
                              <tr key={mi} className="hover:bg-gray-50/50">
                                <td className="py-2 pr-4 font-semibold text-gray-900">{m.drug || m.drug_generic || "—"}</td>
                                <td className="py-2 pr-4 text-gray-500">{m.drug_brand || "—"}</td>
                                <td className="py-2 pr-4 text-gray-600">{m.dose || m.strength || "—"}</td>
                                <td className="py-2 pr-4 text-gray-600">{m.form || "—"}</td>
                                <td className="py-2 pr-4 text-gray-600">{m.route || "—"}</td>
                                <td className="py-2 pr-4 font-medium text-gray-700">{m.frequency || "—"}</td>
                                <td className="py-2 pr-4 text-gray-600">{m.duration || "—"}</td>
                                <td className="py-2 text-gray-500">{m.instructions || "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {v.follow_up && (
                      <div className="border-t border-gray-100 bg-blue-50/50 px-5 py-2 text-xs text-blue-700">
                        Follow-up: {fmtLocaleDate(v.follow_up, cc)}
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      )}

    </div>
  );
}
