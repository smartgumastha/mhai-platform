"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/providers/auth-context";
import { useLocale } from "@/app/providers/locale-context";
import { useNotification } from "@/app/providers/NotificationProvider";
import { createPatient, getPatients } from "@/lib/api";

var TODAY = new Date().toISOString().split("T")[0];
var I = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/20";
var L = "block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5";
var CARD = "bg-white rounded-xl border border-gray-200 p-6 mb-4";

function ageFromDob(dob: string): number {
  if (!dob) return 0;
  var d = new Date(dob);
  var today = new Date();
  var age = today.getFullYear() - d.getFullYear();
  if (today < new Date(today.getFullYear(), d.getMonth(), d.getDate())) age--;
  return age >= 0 ? age : 0;
}

export default function NewPatientPage() {
  var { user }     = useAuth();
  var { localeV2 } = useLocale();
  var notify       = useNotification();
  var router       = useRouter();
  var hospitalId   = user?.hospital_id || "";
  var cc           = localeV2?.country_code || "IN";

  var [saving, setSaving] = useState(false);
  var [dupWarning, setDupWarning] = useState("");
  var [dupLink, setDupLink] = useState("");
  var [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form fields
  var [name, setName] = useState("");
  var [dob, setDob]   = useState("");
  var [age, setAge]   = useState("");
  var [gender, setGender] = useState("");
  var [bloodGroup, setBloodGroup] = useState("");
  var [nationality, setNationality] = useState("");
  var [fatherHusbandName, setFatherHusbandName] = useState("");
  var [occupation, setOccupation] = useState("");
  var [religion, setReligion] = useState("");
  var [maritalStatus, setMaritalStatus] = useState("");
  // Contact
  var [phone, setPhone] = useState("");
  var [email, setEmail] = useState("");
  var [address1, setAddress1] = useState("");
  var [address2, setAddress2] = useState("");
  var [city, setCity] = useState("");
  var [state, setState] = useState("");
  var [pincode, setPincode] = useState("");
  // Emergency
  var [ecName, setEcName] = useState("");
  var [ecPhone, setEcPhone] = useState("");
  var [ecRelation, setEcRelation] = useState("");
  // IDs
  var [abhaId, setAbhaId] = useState("");
  var [abhaError, setAbhaError] = useState("");
  var [abhaAddress, setAbhaAddress] = useState("");
  var [emiratesId, setEmiratesId] = useState("");
  var [emiratesError, setEmiratesError] = useState("");
  var [nationalityCode, setNationalityCode] = useState("");
  var [passportNumber, setPassportNumber] = useState("");
  var [nhsNumber, setNhsNumber] = useState("");
  var [nhsError, setNhsError] = useState("");
  var [ssnLast4, setSsnLast4] = useState("");
  // Insurance
  var [paymentType, setPaymentType] = useState("SELF");
  var [insuranceCompany, setInsuranceCompany] = useState("");
  var [insuranceCard, setInsuranceCard] = useState("");
  var [insuranceExpiry, setInsuranceExpiry] = useState("");
  var [tpaName, setTpaName] = useState("");
  var [pmjayCard, setPmjayCard] = useState("");
  // Registration
  var [regSource, setRegSource] = useState("Walk-In");
  var [referralSource, setReferralSource] = useState("");
  var [notes, setNotes] = useState("");
  // Consents
  var [consentTreatment, setConsentTreatment] = useState(false);
  var [consentData, setConsentData] = useState(false);
  var [consentAbha, setConsentAbha] = useState(false);
  var [consentNhs, setConsentNhs] = useState(false);
  var [consentHipaa, setConsentHipaa] = useState(false);
  var [consentMarketing, setConsentMarketing] = useState(false);

  var phoneDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-calc age from DOB
  useEffect(function() {
    if (dob) setAge(String(ageFromDob(dob)));
  }, [dob]);

  // Duplicate phone check on blur
  function onPhoneBlur() {
    if (!phone.trim() || !hospitalId) return;
    if (phoneDebounce.current) clearTimeout(phoneDebounce.current);
    phoneDebounce.current = setTimeout(async function() {
      try {
        var res = await getPatients(hospitalId, { q: phone.trim(), limit: 3 });
        if (res.patients && res.patients.length > 0) {
          var match = res.patients.find(function(p: any) {
            return (p.phone || "").replace(/[^0-9]/g, "").slice(-10) ===
                   phone.replace(/[^0-9]/g, "").slice(-10);
          });
          if (match) {
            setDupWarning("Patient with this phone already registered.");
            setDupLink("/dashboard/patients/" + match.id);
          } else { setDupWarning(""); setDupLink(""); }
        } else { setDupWarning(""); setDupLink(""); }
      } catch { /* ignore */ }
    }, 400);
  }

  function validateAbha(v: string) {
    if (!v) { setAbhaError(""); return; }
    var digits = v.replace(/-/g, "");
    setAbhaError(/^\d{14}$/.test(digits) ? "" : "ABHA must be 14 digits");
  }

  function validateEmiratesId(v: string) {
    if (!v) { setEmiratesError(""); return; }
    setEmiratesError(/^784-\d{4}-\d{7}-\d$/.test(v) ? "" : "Format: 784-XXXX-XXXXXXX-X");
  }

  function validateNhs(v: string) {
    if (!v) { setNhsError(""); return; }
    setNhsError(/^\d{10}$/.test(v) ? "" : "NHS number must be 10 digits");
  }

  // Completeness checklist
  var checks = [
    { label: "Basic Info",       done: Boolean(name && dob && gender) },
    { label: "Contact",          done: Boolean(phone) },
    { label: "Emergency Contact", done: Boolean(ecName && ecPhone && ecRelation) },
    { label: "Payment Type",     done: Boolean(paymentType) },
    { label: "Consents",         done: consentTreatment && consentData },
    { label: cc === "AE" ? "Emirates ID" : cc === "GB" ? "NHS Number" : "Govt ID",
      done: cc === "AE" ? Boolean(emiratesId) : cc === "GB" ? Boolean(nhsNumber) : Boolean(abhaId) },
  ];

  var canSubmit = consentTreatment && consentData;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) { notify.error("Please check required consents"); return; }
    setSaving(true);
    setFieldErrors({});
    try {
      var body: Record<string, any> = {
        name, date_of_birth: dob || undefined, age: age ? parseInt(age) : undefined,
        gender: gender || undefined, blood_group: bloodGroup || undefined,
        nationality: nationality || undefined,
        phone: phone || undefined, email: email || undefined,
        address_line1: address1 || undefined, address_line2: address2 || undefined,
        city: city || undefined, state: state || undefined, pincode: pincode || undefined,
        emergency_contact_name: ecName || undefined,
        emergency_contact_phone: ecPhone || undefined,
        emergency_contact_relation: ecRelation || undefined,
        abha_id: abhaId || undefined, abha_address: abhaAddress || undefined,
        emirates_id: emiratesId || undefined,
        nationality_code: nationalityCode || undefined,
        passport_number: passportNumber || undefined,
        insurance_card_number: insuranceCard || undefined,
        insurance_card_expiry: insuranceExpiry || undefined,
        insurance_status: paymentType || undefined,
        pm_jay_id: pmjayCard || undefined,
        referred_by: referralSource || undefined,
        registration_mode: regSource || undefined,
        notes: notes || undefined,
        consent_treatment: consentTreatment,
        consent_data_processing: consentData,
        consent_abha_sharing: consentAbha,
        consent_nhs_scr: consentNhs,
        consent_hipaa_npp: consentHipaa,
        consent_marketing: consentMarketing,
      };

      // IN extra fields
      if (cc === "IN") {
        Object.assign(body, {
          father_husband_name: fatherHusbandName || undefined,
          occupation: occupation || undefined,
          religion: religion || undefined,
          marital_status: maritalStatus || undefined,
        });
      }

      var res = await createPatient(hospitalId, body);
      if (res.success && res.patient) {
        notify.success("Registered. UHID: " + res.patient.uhid);
        router.push("/dashboard/patients/" + res.patient.id);
      } else if ((res as any).error === "duplicate_phone") {
        setDupWarning("Patient with this phone already registered.");
        setDupLink("/dashboard/patients/" + (res as any).existing_id);
        notify.error("Duplicate phone number");
      } else if ((res as any).fields) {
        setFieldErrors((res as any).fields || {});
        notify.error("Please fix validation errors");
      } else {
        notify.error(res.error || res.message || "Registration failed");
      }
    } catch { notify.error("Network error"); }
    finally { setSaving(false); }
  }

  var dataConsentLabel = cc === "AE"
    ? "I consent to processing of my health data under PDPL UAE"
    : cc === "GB" ? "I consent to processing of my health data under UK-GDPR"
    : cc === "US" ? "I consent to processing of my health data under HIPAA"
    : "I consent to processing of my health data under DPDPA 2023";

  function CheckItem({ label, done }: { label: string; done: boolean }) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {done
          ? <span className="text-green-600">✓</span>
          : <span className="h-4 w-4 rounded-full border-2 border-gray-300 inline-block" />}
        <span className={done ? "text-gray-700" : "text-gray-400"}>{label}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/dashboard/patients" className="hover:text-orange-600">Patients</Link>
          <span>/</span>
          <span className="font-semibold text-gray-900">Register New Patient</span>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/patients" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </Link>
          <button
            type="submit"
            form="reg-form"
            disabled={!canSubmit || saving}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Registering…" : "Register Patient"}
          </button>
        </div>
      </div>

      <form id="reg-form" onSubmit={handleSubmit}>
        <div className="mx-auto grid max-w-7xl grid-cols-3 gap-6 px-8 py-6">
          {/* Main content (2/3) */}
          <div className="col-span-2 space-y-0">

            {/* Section 1: Basic Identity */}
            <div className={CARD}>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-700">Basic Identity</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={L}>Full Name *</label>
                  <input className={I + (fieldErrors.name ? " border-red-400" : "")} value={name} onChange={function(e) { setName(e.target.value); }} required />
                  {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
                </div>
                <div>
                  <label className={L}>Date of Birth *</label>
                  <input type="date" className={I} max={TODAY} value={dob} onChange={function(e) { setDob(e.target.value); }} />
                </div>
                <div>
                  <label className={L}>Age (auto-calc from DOB)</label>
                  <input type="number" className={I + " bg-gray-50"} value={age} readOnly placeholder="Auto-calculated from DOB" />
                </div>
                <div>
                  <label className={L}>Gender *</label>
                  <select className={I} value={gender} onChange={function(e) { setGender(e.target.value); }} required>
                    <option value="">Select…</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className={L}>Blood Group</label>
                  <select className={I} value={bloodGroup} onChange={function(e) { setBloodGroup(e.target.value); }}>
                    <option value="">Unknown</option>
                    {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(function(g) {
                      return <option key={g} value={g}>{g}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className={L}>Nationality</label>
                  <input className={I} value={nationality} onChange={function(e) { setNationality(e.target.value); }} placeholder="e.g. Indian" />
                </div>
                {cc === "IN" && (
                  <>
                    <div>
                      <label className={L}>Father / Husband Name</label>
                      <input className={I} value={fatherHusbandName} onChange={function(e) { setFatherHusbandName(e.target.value); }} />
                    </div>
                    <div>
                      <label className={L}>Occupation</label>
                      <input className={I} value={occupation} onChange={function(e) { setOccupation(e.target.value); }} />
                    </div>
                    <div>
                      <label className={L}>Religion</label>
                      <input className={I} value={religion} onChange={function(e) { setReligion(e.target.value); }} />
                    </div>
                    <div>
                      <label className={L}>Marital Status</label>
                      <select className={I} value={maritalStatus} onChange={function(e) { setMaritalStatus(e.target.value); }}>
                        <option value="">Select…</option>
                        <option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Section 2: Contact */}
            <div className={CARD}>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-700">Contact</h2>
              {dupWarning && (
                <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
                  {dupWarning}{dupLink && <> <Link href={dupLink} className="font-semibold underline">View existing patient →</Link></>}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={L}>Phone *</label>
                  <input type="tel" className={I + (fieldErrors.phone ? " border-red-400" : "")}
                    value={phone} onChange={function(e) { setPhone(e.target.value); }}
                    onBlur={onPhoneBlur} required />
                  {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
                </div>
                <div>
                  <label className={L}>Email</label>
                  <input type="email" className={I} value={email} onChange={function(e) { setEmail(e.target.value); }} />
                </div>
                <div className="col-span-2">
                  <label className={L}>Address Line 1</label>
                  <input className={I} value={address1} onChange={function(e) { setAddress1(e.target.value); }} />
                </div>
                <div className="col-span-2">
                  <label className={L}>Address Line 2</label>
                  <input className={I} value={address2} onChange={function(e) { setAddress2(e.target.value); }} />
                </div>
                <div>
                  <label className={L}>City</label>
                  <input className={I} value={city} onChange={function(e) { setCity(e.target.value); }} />
                </div>
                <div>
                  <label className={L}>State / Province</label>
                  <input className={I} value={state} onChange={function(e) { setState(e.target.value); }} />
                </div>
                <div>
                  <label className={L}>{cc === "IN" ? "Pincode" : "Postal Code"}</label>
                  <input className={I} value={pincode} onChange={function(e) { setPincode(e.target.value); }} />
                </div>
              </div>
            </div>

            {/* Section 3: Emergency Contact */}
            <div className={CARD}>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-700">Emergency Contact</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={L}>Name *</label>
                  <input className={I} value={ecName} onChange={function(e) { setEcName(e.target.value); }} />
                </div>
                <div>
                  <label className={L}>Phone *</label>
                  <input type="tel" className={I} value={ecPhone} onChange={function(e) { setEcPhone(e.target.value); }} />
                </div>
                <div>
                  <label className={L}>Relationship *</label>
                  <select className={I} value={ecRelation} onChange={function(e) { setEcRelation(e.target.value); }}>
                    <option value="">Select…</option>
                    {["Spouse","Parent","Child","Sibling","Friend","Guardian","Other"].map(function(r) {
                      return <option key={r}>{r}</option>;
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 4: Identity Documents */}
            <div className={CARD}>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-700">Identity Documents</h2>
              {cc === "IN" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={L}>ABHA Number</label>
                    <input className={I + (abhaError ? " border-red-400" : "")}
                      placeholder="14-digit ABDM number"
                      value={abhaId}
                      onChange={function(e) { setAbhaId(e.target.value); validateAbha(e.target.value); }} />
                    {abhaError && <p className="mt-1 text-xs text-red-600">{abhaError}</p>}
                    <p className="mt-1 text-xs text-gray-400">14-digit Ayushman Bharat Health Account number</p>
                    <a href="https://abha.abdm.gov.in" target="_blank" rel="noreferrer" className="mt-0.5 inline-block text-xs text-orange-600 hover:underline">
                      Don&apos;t have one? Create at abha.abdm.gov.in →
                    </a>
                  </div>
                  <div>
                    <label className={L}>ABHA Address</label>
                    <input className={I} placeholder="yourname@abdm" value={abhaAddress} onChange={function(e) { setAbhaAddress(e.target.value); }} />
                  </div>
                </div>
              )}
              {cc === "AE" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={L}>Emirates ID</label>
                    <input className={I + (emiratesError ? " border-red-400" : "")}
                      placeholder="784-XXXX-XXXXXXX-X"
                      value={emiratesId}
                      onChange={function(e) { setEmiratesId(e.target.value); }}
                      onBlur={function() { validateEmiratesId(emiratesId); }} />
                    {emiratesError && <p className="mt-1 text-xs text-red-600">{emiratesError}</p>}
                  </div>
                  <div>
                    <label className={L}>Nationality Code</label>
                    <select className={I} value={nationalityCode} onChange={function(e) { setNationalityCode(e.target.value); }}>
                      <option value="">Select…</option>
                      {["ARE","IND","GBR","USA","PAK","BGD","EGY","PHL","NPL","LKA"].map(function(c) {
                        return <option key={c} value={c}>{c}</option>;
                      })}
                      <option value="OTH">Other</option>
                    </select>
                  </div>
                  {!emiratesId && (
                    <div>
                      <label className={L}>Passport Number</label>
                      <input className={I} value={passportNumber} onChange={function(e) { setPassportNumber(e.target.value); }} />
                    </div>
                  )}
                </div>
              )}
              {cc === "GB" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={L}>NHS Number</label>
                    <input className={I + (nhsError ? " border-red-400" : "")}
                      placeholder="10 digits"
                      maxLength={10}
                      value={nhsNumber}
                      onChange={function(e) { setNhsNumber(e.target.value); }}
                      onBlur={function() { validateNhs(nhsNumber); }} />
                    {nhsError && <p className="mt-1 text-xs text-red-600">{nhsError}</p>}
                    <p className="mt-1 text-xs text-gray-400">Find yours on NHS App, medical letters, or by calling your GP</p>
                  </div>
                </div>
              )}
              {cc === "US" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={L}>SSN — last 4 digits only</label>
                    <input className={I} maxLength={4} placeholder="XXXX" value={ssnLast4} onChange={function(e) { setSsnLast4(e.target.value); }} />
                  </div>
                </div>
              )}
            </div>

            {/* Section 5: Payment & Insurance */}
            <div className={CARD}>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-700">Payment & Insurance</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={L}>Payment Type *</label>
                  <select className={I} value={paymentType} onChange={function(e) { setPaymentType(e.target.value); }}>
                    <option value="SELF">Self-pay</option>
                    <option value="TPA">TPA + Insurance</option>
                    <option value="CASHLESS">Cashless Insurance</option>
                    <option value="PMJAY">PM-JAY</option>
                    <option value="CORPORATE">Corporate</option>
                    {cc === "GB" && <option value="NHS">NHS</option>}
                  </select>
                </div>
                {(paymentType === "TPA" || paymentType === "CASHLESS") && (
                  <>
                    <div>
                      <label className={L}>Insurance Company</label>
                      <input className={I} value={insuranceCompany} onChange={function(e) { setInsuranceCompany(e.target.value); }} />
                    </div>
                    <div>
                      <label className={L}>TPA Name</label>
                      <input className={I} value={tpaName} onChange={function(e) { setTpaName(e.target.value); }} />
                    </div>
                    <div>
                      <label className={L}>Card Number</label>
                      <input className={I} value={insuranceCard} onChange={function(e) { setInsuranceCard(e.target.value); }} />
                    </div>
                    <div>
                      <label className={L}>Card Expiry</label>
                      <input type="date" className={I} value={insuranceExpiry} onChange={function(e) { setInsuranceExpiry(e.target.value); }} />
                    </div>
                  </>
                )}
                {paymentType === "PMJAY" && (
                  <div>
                    <label className={L}>PM-JAY Card Number</label>
                    <input className={I} value={pmjayCard} onChange={function(e) { setPmjayCard(e.target.value); }} />
                  </div>
                )}
              </div>
            </div>

            {/* Section 6: Registration Details */}
            <div className={CARD}>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-700">Registration Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={L}>Registration Source *</label>
                  <select className={I} value={regSource} onChange={function(e) { setRegSource(e.target.value); }}>
                    {["Walk-In","Online","Referral","Emergency","Transfer"].map(function(s) {
                      return <option key={s}>{s}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className={L}>Referred by</label>
                  <input className={I} placeholder="e.g. Dr. Sharma, Google, Word of mouth" value={referralSource} onChange={function(e) { setReferralSource(e.target.value); }} />
                </div>
                <div className="col-span-2">
                  <label className={L}>Internal Notes</label>
                  <textarea className={I} rows={2} placeholder="Internal notes — not visible to patient" value={notes} onChange={function(e) { setNotes(e.target.value); }} />
                </div>
              </div>
            </div>

            {/* Section 7: Consents */}
            <div className="rounded-xl border-2 border-orange-100 bg-white p-6 mb-4">
              <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-gray-700">Patient Consents</h2>
              <p className="mb-4 text-xs text-gray-500">Required before registration</p>
              <div className="space-y-3">
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" className="mt-0.5" checked={consentTreatment} onChange={function(e) { setConsentTreatment(e.target.checked); }} />
                  <span className="text-sm font-semibold text-gray-800">I consent to receive medical examination and treatment at this clinic</span>
                </label>
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" className="mt-0.5" checked={consentData} onChange={function(e) { setConsentData(e.target.checked); }} />
                  <span className="text-sm font-semibold text-gray-800">{dataConsentLabel}</span>
                </label>
                {cc === "IN" && (
                  <label className="flex cursor-pointer items-start gap-3">
                    <input type="checkbox" className="mt-0.5" checked={consentAbha} onChange={function(e) { setConsentAbha(e.target.checked); }} />
                    <span className="text-sm text-gray-700">Share my health records via the ABDM network</span>
                  </label>
                )}
                {cc === "GB" && (
                  <label className="flex cursor-pointer items-start gap-3">
                    <input type="checkbox" className="mt-0.5" checked={consentNhs} onChange={function(e) { setConsentNhs(e.target.checked); }} />
                    <span className="text-sm text-gray-700">Allow NHS staff to access my Summary Care Record</span>
                  </label>
                )}
                {cc === "US" && (
                  <label className="flex cursor-pointer items-start gap-3">
                    <input type="checkbox" className="mt-0.5" checked={consentHipaa} onChange={function(e) { setConsentHipaa(e.target.checked); }} />
                    <span className="text-sm text-gray-700">I have received the HIPAA Notice of Privacy Practices</span>
                  </label>
                )}
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" className="mt-0.5" checked={consentMarketing} onChange={function(e) { setConsentMarketing(e.target.checked); }} />
                  <span className="text-sm text-gray-700">Receive appointment reminders and health tips</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sidebar (1/3) */}
          <div className="sticky top-24 h-fit">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-bold text-gray-800">Registration Summary</h3>
              <div className="mb-3 rounded-lg bg-gray-50 px-3 py-2">
                <div className="text-xs text-gray-400">UHID</div>
                <div className="text-sm italic text-gray-400">Will be assigned on save</div>
              </div>
              {localeV2 && (
                <div className="mb-4 flex items-center gap-2">
                  <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">{cc}</span>
                  <span className="text-xs text-gray-500">{localeV2.country_name || cc}</span>
                </div>
              )}
              <div className="mb-4 space-y-2">
                {checks.map(function(c) {
                  return <CheckItem key={c.label} label={c.label} done={c.done} />;
                })}
              </div>
              <button
                type="submit"
                form="reg-form"
                disabled={!canSubmit || saving}
                className="w-full rounded-xl bg-orange-600 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Registering…" : "Register Patient"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
