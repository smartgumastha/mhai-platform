'use client'
// /dashboard/billing/opd — Billing Suite P2
// All fields from Apollo Hospital bills + DHA eClaimLink provider manual.
// Standard Tailwind only. No custom design tokens.

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/auth-context'
import { useLocale } from '@/app/providers/locale-context'
import { useCurrency } from '@/app/hooks/useCurrency'
import { useNotification } from '@/app/providers/NotificationProvider'
import { getToken } from '@/lib/api'
import ApprovalWorkflow, { type BillStatus as WorkflowBillStatus } from '@/app/components/billing/ApprovalWorkflow'
import {
  getDocType, getDocTypeLabel, getHsnSac, calcBillSummary,
  validateBillForm, getCurrency, apiBillType, apiBillCategory, getLengthOfStay
} from '@/lib/billing/billingHelpers'
import type {
  BillType, BillStatus, BillCategory, BillDiscountType,
  PaymentMode, SupplyType, LineItem, OPDBillForm, PayerOption
} from '@/lib/billing/billingTypes'

// ── Style constants ────────────────────────────────────────────────────────────
var I = 'w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2.5 text-sm font-medium focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/20'
var L = 'block text-xs font-bold uppercase tracking-wide text-gray-600 mb-1.5'
var C = 'bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4'

// ── Defaults ───────────────────────────────────────────────────────────────────
var TODAY_DATE = new Date().toISOString().split('T')[0]
var TODAY_DT   = new Date().toISOString().slice(0, 16)

var DEFAULT_IPD = {
  roomRentPerDay: 0, nursingCharges: 0, icuCharges: 0, otCharges: 0,
  consultationCharges: 0, pharmacyCharges: 0, equipmentImplants: 0,
  consumables: 0, investigationLab: 0, radiologyCharges: 0,
  dietFoodCharges: 0, miscellaneous: 0
}

var DEFAULT_LINE_ITEM: LineItem = {
  id: '1', description: 'OPD Consultation', hsnSac: 'SAC 9993',
  serviceDate: TODAY_DATE, quantity: 1, unitPrice: 0, discount: 0, taxRate: 0, amount: 0
}

var DEFAULT_FORM: OPDBillForm = {
  billDate: TODAY_DT, serviceDate: TODAY_DATE,
  admissionDate: '', dischargeDate: '', wardCategory: 'General',
  billType: 'OPD', billStatus: 'DRAFT', billCategory: 'CONSULTATION', supplyType: 'B2C',
  patientId: '', uhid: '', patientName: '', patientPhone: '', patientAddress: '',
  patientAge: '', patientGender: '', abhaNumber: '', emiratesId: '',
  nationalityCode: '', passportNumber: '', referringDoctor: '',
  attendingDoctor: '', doctorSpecialty: '', visitType: 'WALK_IN',
  icd10Primary: '', cptCode: '', presentingComplaint: '',
  payerId: '', memberCardNumber: '', policyNumber: '', cardExpiryDate: '',
  cashlessOrReimbursement: 'CASHLESS', insuranceApprovedAmount: 0, patientCopay: 0, preAuthNumber: '',
  ipdCharges: { ...DEFAULT_IPD },
  lineItems: [{ ...DEFAULT_LINE_ITEM }],
  discountType: 'AMOUNT', discountValue: 0, discountReason: '', approvedBy: '', approvalStatus: '',
  advanceAmount: 0, advanceDate: '', advanceRef: '', advanceType: 'Refundable',
  paymentMode: 'CASH', amountPaid: 0, notes: ''
}

var BILL_TYPES: { key: BillType; label: string }[] = [
  { key: 'OPD', label: 'OPD' },
  { key: 'IPD', label: 'IPD' },
  { key: 'LAB', label: 'Lab' },
  { key: 'PHARMACY', label: 'Pharmacy' },
  { key: 'PACKAGE', label: 'Package' },
]

var BILL_CATEGORIES: BillCategory[] = [
  'CONSULTATION', 'DIAGNOSTIC_LAB', 'PHARMACY', 'PROCEDURE',
  'PACKAGE', 'PHYSIOTHERAPY', 'DENTAL', 'DIET'
]

var DISCOUNT_REASONS = [
  'Staff Discount', 'CGHS / Government', 'Financial Hardship', 'Charitable',
  'Corporate / Empanelled', 'VIP / Donor', 'Loyalty'
]

var IPD_CHARGE_ROWS = [
  { key: 'roomRentPerDay',      label: 'Room Rent / Day' },
  { key: 'nursingCharges',      label: 'Nursing Charges' },
  { key: 'icuCharges',          label: 'ICU Charges' },
  { key: 'otCharges',           label: 'OT / Procedure' },
  { key: 'consultationCharges', label: 'Consultation (all doctors)' },
  { key: 'pharmacyCharges',     label: 'Pharmacy' },
  { key: 'equipmentImplants',   label: 'Equipment / Implants' },
  { key: 'consumables',         label: 'Consumables / Sundries' },
  { key: 'investigationLab',    label: 'Investigation & Lab' },
  { key: 'radiologyCharges',    label: 'Radiology / Imaging' },
  { key: 'dietFoodCharges',     label: 'Diet & Food (5% GST)' },
  { key: 'miscellaneous',       label: 'Miscellaneous' },
] as const

// ── Component ──────────────────────────────────────────────────────────────────
export default function OPDBillingPage() {
  var { user }       = useAuth()
  var { localeV2 }   = useLocale()
  var { format: fmt } = useCurrency()
  var notify          = useNotification()
  var router          = useRouter()
  var cc              = localeV2?.country_code || 'IN'
  var hospitalId      = user?.hospital_id

  var [form, setForm]           = useState<OPDBillForm>(DEFAULT_FORM)
  var [billNumber, setBillNumber] = useState<string>('')
  var [payers, setPayers]       = useState<PayerOption[]>([])
  var [saving, setSaving]       = useState(false)
  var [errors, setErrors]       = useState<Record<string, string>>({})
  var [patientSearch, setPatientSearch] = useState('')
  var [searchResults, setSearchResults] = useState<any[]>([])
  var [searching, setSearching] = useState(false)
  var [savedBillId, setSavedBillId]     = useState('')
  var [savedBillStatus, setSavedBillStatus] = useState<WorkflowBillStatus>('DRAFT')

  var docType      = getDocType(form.billCategory, cc)
  var docTypeLabel = getDocTypeLabel(docType, cc)
  var los          = getLengthOfStay(form.admissionDate, form.dischargeDate)
  var summary      = calcBillSummary(form)

  // Fetch bill number on mount
  useEffect(() => {
    if (!hospitalId) return
    var token = getToken()
    fetch(`/api/hospitals/${hospitalId}/rcm/billing/next-bill-number`, {
      headers: token ? { Authorization: 'Bearer ' + token } : {}
    })
      .then(r => r.json())
      .then(d => { if (d.next_bill_number) setBillNumber(d.next_bill_number) })
      .catch(() => {})
  }, [hospitalId])

  // Fetch payers when country changes
  useEffect(() => {
    if (!hospitalId) return
    var token = getToken()
    fetch(`/api/hospitals/${hospitalId}/rcm/payers?country_code=${cc}`, {
      headers: token ? { Authorization: 'Bearer ' + token } : {}
    })
      .then(r => r.json())
      .then(d => setPayers(d.payers || []))
      .catch(() => {})
  }, [cc, hospitalId])

  function updateField<K extends keyof OPDBillForm>(key: K, val: OPDBillForm[K]) {
    setForm(f => ({ ...f, [key]: val }))
    if (errors[key]) setErrors(e => { var n = { ...e }; delete n[key]; return n })
  }

  function updateIpd(key: keyof typeof DEFAULT_IPD, val: number) {
    setForm(f => ({ ...f, ipdCharges: { ...f.ipdCharges, [key]: val } }))
  }

  function updateLineItem(idx: number, key: keyof LineItem, val: any) {
    setForm(f => {
      var items = [...f.lineItems]
      items[idx] = { ...items[idx], [key]: val }
      var li = items[idx]
      li.amount = li.quantity * li.unitPrice - li.discount
      if (key === 'description') items[idx].hsnSac = getHsnSac(f.billCategory)
      return { ...f, lineItems: items }
    })
    if (errors.lineItems) setErrors(e => { var n = { ...e }; delete n.lineItems; return n })
  }

  function addLineItem() {
    setForm(f => ({
      ...f,
      lineItems: [...f.lineItems, {
        id: String(Date.now()), description: '', hsnSac: getHsnSac(f.billCategory),
        serviceDate: TODAY_DATE, quantity: 1, unitPrice: 0, discount: 0, taxRate: 0, amount: 0
      }]
    }))
  }

  function removeLineItem(idx: number) {
    setForm(f => ({ ...f, lineItems: f.lineItems.filter((_, i) => i !== idx) }))
  }

  var searchPatients = useCallback(async (q: string) => {
    if (!q.trim() || !hospitalId) { setSearchResults([]); return }
    setSearching(true)
    try {
      var token = getToken()
      var r = await fetch(`/api/hospitals/${hospitalId}/patients?q=${encodeURIComponent(q)}&limit=5`, {
        headers: token ? { Authorization: 'Bearer ' + token } : {}
      })
      var d = await r.json()
      setSearchResults(d.patients || d.data || [])
    } catch { setSearchResults([]) }
    finally { setSearching(false) }
  }, [hospitalId])

  function selectPatient(p: any) {
    setForm(f => ({
      ...f,
      patientId: String(p.patient_id || p.id || ''),
      uhid: p.uhid || p.patient_uhid || '',
      patientName: p.name || p.patient_name || '',
      patientPhone: p.phone || p.mobile || p.patient_phone || '',
      patientAge: p.age || '',
      patientGender: (p.gender === 'M' ? 'MALE' : p.gender === 'F' ? 'FEMALE' : p.gender) || '',
      abhaNumber: p.abha_number || '',
      emiratesId: p.emirates_id || '',
    }))
    setPatientSearch(p.name || p.patient_name || '')
    setSearchResults([])
  }

  async function handleUpiPayment() {
    if (summary.netAmount <= 0) { notify.error('Enter bill amount first'); return }
    try {
      var res = await fetch('/api/create-payment-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(summary.netAmount * 100), currency: getCurrency(cc), notes: { patient: form.patientName, type: 'OPD' } })
      })
      var data = await res.json()
      if (data.id) { updateField('paymentMode', 'UPI'); updateField('amountPaid', summary.netAmount); notify.success('UPI QR generated') }
    } catch { notify.error('Payment gateway error') }
  }

  async function handleWhatsAppLink() {
    if (summary.netAmount <= 0) { notify.error('Enter bill amount first'); return }
    if (!form.patientPhone) { notify.error('Enter patient phone first'); return }
    try {
      await fetch('/api/create-payment-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(summary.netAmount * 100), currency: getCurrency(cc), notes: { patient: form.patientName }, send_whatsapp: true, phone: form.patientPhone })
      })
      notify.success(`Payment link sent to ${form.patientPhone}`)
    } catch { notify.error('WhatsApp link error') }
  }

  async function saveBill(e: React.FormEvent) {
    e.preventDefault()
    var { valid, errors: errs } = validateBillForm(form, cc)
    if (!valid) { setErrors(errs); notify.error('Please fix the highlighted fields'); return }
    if (!hospitalId) { notify.error('Not signed in'); return }
    setSaving(true)
    try {
      var token = getToken()
      var payload = {
        bill_number: billNumber || ('DRAFT-' + Date.now()),
        bill_date: form.billDate || new Date().toISOString(),
        service_date: form.serviceDate,
        admission_date: form.admissionDate || null,
        discharge_date: form.dischargeDate || null,
        ward_category: form.wardCategory || null,
        patient_id: form.patientId || null,
        patient_name: form.patientName,
        patient_phone: form.patientPhone || null,
        patient_address: form.patientAddress || null,
        patient_age: form.patientAge || null,
        patient_gender: form.patientGender || null,
        patient_uhid: form.uhid || null,
        abha_number: form.abhaNumber || null,
        emirates_id: form.emiratesId || null,
        nationality_code: form.nationalityCode || null,
        passport_number: form.passportNumber || null,
        attending_doctor: form.attendingDoctor || null,
        doctor_specialty: form.doctorSpecialty || null,
        referring_doctor: form.referringDoctor || null,
        visit_type: form.visitType,
        icd10_primary: form.icd10Primary || null,
        cpt_code: form.cptCode || null,
        presenting_complaint: form.presentingComplaint || null,
        bill_type: apiBillType(form.billType),
        bill_category: apiBillCategory(form.supplyType),
        doc_type: docType,
        encounter_type: form.billType,
        supply_type: form.supplyType,
        currency: getCurrency(cc),
        subtotal_amount: summary.subtotal,
        tax_amount: summary.taxAmount,
        discount_amount: summary.discountAmount,
        total_amount: summary.netAmount,
        paid_amount: form.amountPaid,
        balance_amount: summary.balanceDue,
        bill_discount_type: form.discountType,
        bill_discount_value: form.discountValue,
        bill_discount_reason: form.discountReason || null,
        advance_amount: form.advanceAmount,
        advance_date: form.advanceDate || null,
        advance_ref: form.advanceRef || null,
        payer_id: form.payerId || null,
        member_card_number: form.memberCardNumber || null,
        policy_number: form.policyNumber || null,
        card_expiry_date: form.cardExpiryDate || null,
        cashless_or_reimbursement: form.cashlessOrReimbursement,
        insurance_approved_amount: form.insuranceApprovedAmount || null,
        patient_copay: form.patientCopay || null,
        preauth_number: form.preAuthNumber || null,
        payment_mode: form.paymentMode,
        line_items: form.billType !== 'IPD' ? form.lineItems.map(li => ({
          description: li.description, hsn_sac: li.hsnSac, service_date: li.serviceDate,
          quantity: li.quantity, unit_price: li.unitPrice, discount: li.discount,
          tax_rate: li.taxRate, amount: li.amount
        })) : null,
        ipd_charges: form.billType === 'IPD' ? form.ipdCharges : null,
        notes: form.notes || null,
        supp: {
          doc_type: docType, supply_type: form.supplyType,
          icd10_primary: form.icd10Primary || null, cpt_code: form.cptCode || null,
          payer_id: form.payerId || null, preauth_number: form.preAuthNumber || null
        }
      }

      var res = await fetch(`/api/hospitals/${hospitalId}/rcm/billing/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        var err = await res.json()
        if (err.fields && typeof err.fields === 'object') {
          setErrors(err.fields)
          notify.error('Please fix the highlighted fields')
          return
        }
        throw new Error(err.error || err.message || 'Save failed')
      }
      var saved = await res.json()
      var newBillId = String(saved.bill_id || saved.bill?.id || saved.id || '')
      setSavedBillId(newBillId)
      setSavedBillStatus('DRAFT')
      notify.success('Bill saved — ' + (billNumber || 'DRAFT'))
    } catch (err: any) {
      notify.error(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  // ── Status banner ──────────────────────────────────────────────────────────
  var statusBanner = {
    DRAFT:            { bg: 'bg-amber-50 border-amber-200',  text: 'text-amber-800', msg: 'Draft — editable, not sent to patient' },
    PENDING_APPROVAL: { bg: 'bg-blue-50 border-blue-200',    text: 'text-blue-800',  msg: 'Pending approval — awaiting supervisor' },
    FINAL:            { bg: 'bg-green-50 border-green-200',  text: 'text-green-800', msg: 'Final — locked, sent to patient' },
    VOID:             { bg: 'bg-red-50 border-red-200',      text: 'text-red-800',   msg: 'Void — cancelled' },
    CANCELLED:        { bg: 'bg-gray-50 border-gray-200',    text: 'text-gray-700',  msg: 'Cancelled' },
  }[form.billStatus]

  // ── Discount approval level ────────────────────────────────────────────────
  var discPct = form.discountType === 'PERCENT' ? form.discountValue : (summary.subtotal > 0 ? form.discountValue / summary.subtotal * 100 : 0)
  var discLevel = discPct < 10 ? { label: 'Self-approve', color: 'text-green-600' } : discPct < 25 ? { label: 'Supervisor required', color: 'text-amber-600' } : { label: 'Doctor / HOD required', color: 'text-red-600' }

  var E = (k: string) => errors[k] ? <p className="text-xs text-red-600 mt-1">{errors[k]}</p> : null

  return (
    <div className="min-h-screen bg-gray-50">
      <form onSubmit={saveBill} noValidate>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm px-6 py-3">
          <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">BILLING / {form.billType}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-sm font-black text-orange-600">
                    {billNumber || 'DRAFT'}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusBanner.bg} ${statusBanner.text} border`}>
                    {form.billStatus}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`hidden sm:inline text-xs font-bold px-2 py-1 rounded border ${docType === 'BILL_OF_SUPPLY' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {docTypeLabel}
              </span>
              <button type="button" onClick={() => router.back()}
                className="px-4 py-2 text-sm font-semibold border border-gray-300 rounded-lg text-gray-600 bg-white hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="px-5 py-2 text-sm font-bold bg-orange-600 text-white rounded-lg disabled:opacity-60 hover:bg-orange-700">
                {saving ? 'Saving…' : 'Save Bill'}
              </button>
            </div>
          </div>
        </div>

        {/* ── BILL TYPE TABS ──────────────────────────────────────────────── */}
        <div className="bg-white border-b border-gray-200 px-6">
          <div className="max-w-6xl mx-auto flex gap-0">
            {BILL_TYPES.map(({ key, label }) => (
              <button key={key} type="button"
                onClick={() => updateField('billType', key)}
                className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${form.billType === key ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
        <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-3 gap-6">
          <div className="col-span-2">

            {/* §3 STATUS BANNER */}
            <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border mb-4 ${statusBanner.bg}`}>
              <span className={`text-xs font-bold ${statusBanner.text}`}>{statusBanner.msg}</span>
            </div>

            {/* §1 BILL IDENTITY */}
            <div className={C}>
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Bill Identity</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={L}>Bill Date *</label>
                  <input type="datetime-local" value={form.billDate} onChange={e => updateField('billDate', e.target.value)}
                    className={I + (errors.billDate ? ' border-red-400' : '')} required />
                  {E('billDate')}
                </div>
                <div>
                  <label className={L}>Service Date *</label>
                  <input type="date" value={form.serviceDate} onChange={e => updateField('serviceDate', e.target.value)}
                    className={I + (errors.serviceDate ? ' border-red-400' : '')} required />
                  {E('serviceDate')}
                </div>
                {form.billType === 'IPD' && (
                  <>
                    <div>
                      <label className={L}>Admission Date *</label>
                      <input type="datetime-local" value={form.admissionDate} onChange={e => updateField('admissionDate', e.target.value)}
                        className={I + (errors.admissionDate ? ' border-red-400' : '')} />
                      {E('admissionDate')}
                    </div>
                    <div>
                      <label className={L}>Discharge Date *</label>
                      <input type="datetime-local" value={form.dischargeDate} onChange={e => updateField('dischargeDate', e.target.value)}
                        className={I + (errors.dischargeDate ? ' border-red-400' : '')} />
                      {E('dischargeDate')}
                    </div>
                    <div>
                      <label className={L}>Length of Stay</label>
                      <input readOnly value={los > 0 ? los + ' day' + (los !== 1 ? 's' : '') : '—'}
                        className={I + ' bg-gray-50 text-gray-500 cursor-default'} />
                    </div>
                    <div>
                      <label className={L}>Ward Category</label>
                      <select value={form.wardCategory} onChange={e => updateField('wardCategory', e.target.value)} className={I}>
                        <option>General</option>
                        <option>Semi-Private</option>
                        <option>Private</option>
                        <option>ICU</option>
                        <option>NICU</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* §4 PATIENT DETAILS */}
            <div className={C}>
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Patient Details</h2>

              {/* Patient search */}
              <div className="mb-4 relative">
                <label className={L}>Search Patient (UHID / Phone / Name)</label>
                <div className="relative">
                  <input value={patientSearch}
                    onChange={e => { setPatientSearch(e.target.value); searchPatients(e.target.value) }}
                    className={I + ' pr-10'} placeholder="Type UHID, phone, or name to search…" />
                  <span className="absolute right-3 top-3 text-gray-400 text-sm">{searching ? '⟳' : '🔍'}</span>
                </div>
                {searchResults.length > 0 && (
                  <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {searchResults.map((p: any) => (
                      <button key={p.patient_id || p.id} type="button" onClick={() => selectPatient(p)}
                        className="w-full text-left px-4 py-2.5 hover:bg-orange-50 text-sm border-b border-gray-100 last:border-0">
                        <span className="font-semibold text-gray-900">{p.name || p.patient_name}</span>
                        <span className="ml-2 text-gray-500 text-xs">{p.uhid || p.patient_uhid} · {p.phone || p.mobile}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={L}>Patient Name *</label>
                  <input value={form.patientName} onChange={e => updateField('patientName', e.target.value)}
                    className={I + (errors.patientName ? ' border-red-400' : '')} placeholder="Full name" />
                  {E('patientName')}
                </div>
                <div>
                  <label className={L}>Phone</label>
                  <input value={form.patientPhone} onChange={e => updateField('patientPhone', e.target.value)}
                    className={I} placeholder={cc === 'AE' ? '+971 XX XXX XXXX' : '+91 XXXXX XXXXX'} />
                </div>
                <div>
                  <label className={L}>UHID</label>
                  <input value={form.uhid} onChange={e => updateField('uhid', e.target.value)}
                    className={I} placeholder="Auto-assigned if blank" />
                </div>
                <div>
                  <label className={L}>Age</label>
                  <input value={form.patientAge} onChange={e => updateField('patientAge', e.target.value)}
                    className={I} placeholder="e.g. 35Y / 6M" />
                </div>
                <div>
                  <label className={L}>Gender *</label>
                  <select value={form.patientGender} onChange={e => updateField('patientGender', e.target.value as any)}
                    className={I + (errors.patientGender ? ' border-red-400' : '')}>
                    <option value="">Select gender…</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {E('patientGender')}
                </div>
                <div>
                  <label className={L}>Address</label>
                  <input value={form.patientAddress} onChange={e => updateField('patientAddress', e.target.value)}
                    className={I} placeholder="Patient address" />
                </div>
                <div>
                  <label className={L}>Referring Doctor</label>
                  <input value={form.referringDoctor} onChange={e => updateField('referringDoctor', e.target.value)}
                    className={I} placeholder="Referred by" />
                </div>
                {cc === 'IN' && (
                  <div>
                    <label className={L}>ABHA Number</label>
                    <input value={form.abhaNumber} onChange={e => updateField('abhaNumber', e.target.value)}
                      className={I} placeholder="14-digit ABHA (optional)" />
                  </div>
                )}
                {cc === 'AE' && (
                  <>
                    <div>
                      <label className={L}>Emirates ID{form.supplyType === 'B2B' && <span className="ml-1 text-red-500 normal-case font-normal"> *</span>}</label>
                      <input value={form.emiratesId} onChange={e => updateField('emiratesId', e.target.value)}
                        className={I + (errors.emiratesId ? ' border-red-400' : '')} placeholder="784-XXXX-XXXXXXX-X" />
                      {E('emiratesId')}
                    </div>
                    <div>
                      <label className={L}>Passport Number</label>
                      <input value={form.passportNumber} onChange={e => updateField('passportNumber', e.target.value)}
                        className={I} placeholder="Passport no. (if no Emirates ID)" />
                    </div>
                    <div>
                      <label className={L}>Nationality (ISO 3-char)</label>
                      <input value={form.nationalityCode} maxLength={3}
                        onChange={e => updateField('nationalityCode', e.target.value.toUpperCase())}
                        className={I + ' font-mono uppercase tracking-widest'} placeholder="ARE / IND / GBR" />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* §5 VISIT & CLINICAL */}
            <div className={C}>
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Visit & Clinical</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={L}>Attending Doctor</label>
                  <input value={form.attendingDoctor} onChange={e => updateField('attendingDoctor', e.target.value)}
                    className={I} placeholder="Dr. Name (printed on bill)" />
                </div>
                <div>
                  <label className={L}>Specialty</label>
                  <input value={form.doctorSpecialty} onChange={e => updateField('doctorSpecialty', e.target.value)}
                    className={I} placeholder="e.g. Cardiology" />
                </div>
                <div>
                  <label className={L}>Visit Type</label>
                  <select value={form.visitType} onChange={e => updateField('visitType', e.target.value)} className={I}>
                    <option value="WALK_IN">Walk-In</option>
                    <option value="APPOINTMENT">Appointment</option>
                    <option value="FOLLOW_UP">Follow-Up</option>
                    <option value="EMERGENCY">Emergency</option>
                    <option value="TELECONSULT">Teleconsult</option>
                  </select>
                </div>
                <div>
                  <label className={L}>ICD-10-CM Diagnosis{cc === 'AE' && form.supplyType === 'B2B' && <span className="ml-1 text-red-500 normal-case font-normal"> *</span>}</label>
                  <input value={form.icd10Primary} onChange={e => updateField('icd10Primary', e.target.value.toUpperCase())}
                    className={I + ' font-mono' + (errors.icd10Primary ? ' border-red-400' : '')}
                    placeholder={cc === 'AE' ? 'e.g. J00 (mandatory)' : 'e.g. K21.0'} />
                  {E('icd10Primary')}
                </div>
                {cc === 'AE' && (
                  <>
                    <div>
                      <label className={L}>CPT / Activity Code</label>
                      <input value={form.cptCode} onChange={e => updateField('cptCode', e.target.value.toUpperCase())}
                        className={I + ' font-mono'} placeholder="e.g. 99213" />
                    </div>
                    <div>
                      <label className={L}>Presenting Complaint</label>
                      <input value={form.presentingComplaint} onChange={e => updateField('presentingComplaint', e.target.value)}
                        className={I} placeholder="Chief complaint" />
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <label className={L}>Bill Category</label>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {BILL_CATEGORIES.map(cat => (
                      <button key={cat} type="button" onClick={() => updateField('billCategory', cat)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${form.billCategory === cat ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:border-orange-500 hover:text-orange-600'}`}>
                        {cat.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    {docTypeLabel} · {form.billCategory.replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className={L}>Payment Type</label>
                  <div className="flex gap-3 mt-1">
                    {(['B2C', 'B2B'] as SupplyType[]).map(s => (
                      <button key={s} type="button"
                        onClick={() => updateField('supplyType', s)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-all ${form.supplyType === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:border-orange-500'}`}>
                        {s === 'B2C' ? 'B2C — Patient pays' : 'B2B — Insurance / TPA'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* §6 INSURANCE (B2B only) */}
            {form.supplyType === 'B2B' && (
              <div className={C}>
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Insurance Details</h2>
                {cc === 'AE' && (
                  <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                    <span className="text-amber-600 text-xs font-bold">⚠ DHA mandate: Pre-auth within 1 hour of physician order (PD-05-2025)</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={L}>{cc === 'IN' ? 'TPA / Insurer' : 'Insurance Company'} *</label>
                    <select value={form.payerId} onChange={e => updateField('payerId', e.target.value)} className={I}>
                      <option value="">Select payer…</option>
                      {payers.length === 0 && cc === 'IN' && (
                        <>
                          <option value="star-health">Star Health Insurance</option>
                          <option value="niva-bupa">Niva Bupa (Max Bupa)</option>
                          <option value="care-health">Care Health Insurance</option>
                          <option value="hdfc-ergo">HDFC ERGO Health</option>
                          <option value="icici-lombard">ICICI Lombard</option>
                        </>
                      )}
                      {payers.map(p => (
                        <option key={p.id} value={p.id}>{p.payer_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={L}>Member Card No. *</label>
                    <input value={form.memberCardNumber} onChange={e => updateField('memberCardNumber', e.target.value)}
                      className={I} placeholder="From insurance card" />
                  </div>
                  <div>
                    <label className={L}>Policy Number</label>
                    <input value={form.policyNumber} onChange={e => updateField('policyNumber', e.target.value)}
                      className={I} placeholder="Policy number" />
                  </div>
                  {cc === 'AE' && (
                    <div>
                      <label className={L}>Card Expiry Date</label>
                      <input type="date" value={form.cardExpiryDate} onChange={e => updateField('cardExpiryDate', e.target.value)}
                        className={I + (errors.cardExpiryDate ? ' border-red-400' : '')} />
                      {form.cardExpiryDate && new Date(form.cardExpiryDate) < new Date() && (
                        <p className="text-xs text-red-600 mt-1 font-bold">⚠ Card expired — DHA will reject claim</p>
                      )}
                      {E('cardExpiryDate')}
                    </div>
                  )}
                  <div>
                    <label className={L}>Cashless / Reimbursement</label>
                    <select value={form.cashlessOrReimbursement} onChange={e => updateField('cashlessOrReimbursement', e.target.value)} className={I}>
                      <option value="CASHLESS">Cashless — Direct to insurer</option>
                      <option value="REIMBURSEMENT">Reimbursement — Patient pays first</option>
                    </select>
                  </div>
                  <div>
                    <label className={L}>Pre-Auth Number</label>
                    <input value={form.preAuthNumber} onChange={e => updateField('preAuthNumber', e.target.value)}
                      className={I + ' font-mono'} placeholder="Pre-authorization ref" />
                  </div>
                  <div>
                    <label className={L}>Insurance Approved Amount</label>
                    <input type="number" min="0" value={form.insuranceApprovedAmount || ''}
                      onChange={e => updateField('insuranceApprovedAmount', parseFloat(e.target.value) || 0)}
                      className={I} placeholder="0.00" />
                  </div>
                  <div>
                    <label className={L}>Patient Co-pay</label>
                    <input type="number" min="0" value={form.patientCopay || ''}
                      onChange={e => updateField('patientCopay', parseFloat(e.target.value) || 0)}
                      className={I} placeholder="0.00" />
                  </div>
                </div>
              </div>
            )}

            {/* §7 IPD CHARGES */}
            {form.billType === 'IPD' && (
              <div className={C}>
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">
                  IPD Charges — {los > 0 ? los + ' day' + (los !== 1 ? 's' : '') : 'enter dates above'}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {IPD_CHARGE_ROWS.map(({ key, label }) => (
                    <div key={key}>
                      <label className={L}>{label}</label>
                      <input type="number" min="0"
                        value={(form.ipdCharges as any)[key] || ''}
                        onChange={e => updateIpd(key, parseFloat(e.target.value) || 0)}
                        className={I} placeholder="0.00" />
                    </div>
                  ))}
                </div>
                {los > 0 && (form.ipdCharges as any).roomRentPerDay > 0 && (
                  <p className="mt-3 text-xs text-gray-500">
                    Room rent: {fmt((form.ipdCharges as any).roomRentPerDay)} × {los} day{los !== 1 ? 's' : ''} = <strong>{fmt((form.ipdCharges as any).roomRentPerDay * los)}</strong>
                  </p>
                )}
              </div>
            )}

            {/* §8 LINE ITEMS (non-IPD) */}
            {form.billType !== 'IPD' && (
              <div className={C}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">Line Items</h2>
                  <button type="button" onClick={addLineItem}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700">+ Add row</button>
                </div>
                {errors.lineItems && <p className="text-xs text-red-600 mb-3">{errors.lineItems}</p>}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead>
                      <tr className="text-xs font-bold uppercase tracking-wide text-gray-500 border-b border-gray-200">
                        <th className="pb-2 text-left font-bold">Description</th>
                        {cc === 'IN' && <th className="pb-2 text-left w-20 font-bold">HSN/SAC</th>}
                        <th className="pb-2 text-left w-24 font-bold">Svc Date</th>
                        <th className="pb-2 text-right w-14 font-bold">Qty</th>
                        <th className="pb-2 text-right w-20 font-bold">Rate</th>
                        <th className="pb-2 text-right w-20 font-bold">Discount</th>
                        {docType === 'TAX_INVOICE' && <th className="pb-2 text-right w-14 font-bold">Tax%</th>}
                        <th className="pb-2 text-right w-20 font-bold">Amount</th>
                        <th className="pb-2 w-6"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.lineItems.map((li, idx) => (
                        <tr key={li.id} className="border-b border-gray-100">
                          <td className="py-1.5 pr-2">
                            <input value={li.description} onChange={e => updateLineItem(idx, 'description', e.target.value)}
                              className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-orange-500"
                              placeholder="Service description" />
                          </td>
                          {cc === 'IN' && (
                            <td className="py-1.5 pr-2">
                              <input value={li.hsnSac} onChange={e => updateLineItem(idx, 'hsnSac', e.target.value)}
                                className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-orange-500" />
                            </td>
                          )}
                          <td className="py-1.5 pr-2">
                            <input type="date" value={li.serviceDate} onChange={e => updateLineItem(idx, 'serviceDate', e.target.value)}
                              className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-orange-500" />
                          </td>
                          <td className="py-1.5 pr-2">
                            <input type="number" min="1" value={li.quantity} onChange={e => updateLineItem(idx, 'quantity', parseFloat(e.target.value) || 1)}
                              className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-2 py-1.5 text-sm text-right focus:outline-none focus:border-orange-500" />
                          </td>
                          <td className="py-1.5 pr-2">
                            <input type="number" min="0" value={li.unitPrice || ''} onChange={e => updateLineItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-2 py-1.5 text-sm text-right focus:outline-none focus:border-orange-500" />
                          </td>
                          <td className="py-1.5 pr-2">
                            <input type="number" min="0" value={li.discount || ''} onChange={e => updateLineItem(idx, 'discount', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-2 py-1.5 text-sm text-right focus:outline-none focus:border-orange-500" />
                          </td>
                          {docType === 'TAX_INVOICE' && (
                            <td className="py-1.5 pr-2">
                              <select value={li.taxRate} onChange={e => updateLineItem(idx, 'taxRate', parseFloat(e.target.value))}
                                className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-1 py-1.5 text-xs focus:outline-none focus:border-orange-500">
                                <option value={0}>0%</option>
                                <option value={5}>5%</option>
                                <option value={12}>12%</option>
                                <option value={18}>18%</option>
                              </select>
                            </td>
                          )}
                          <td className="py-1.5 pr-2 text-right font-mono font-semibold text-gray-900 text-sm">
                            {fmt(li.amount)}
                          </td>
                          <td className="py-1.5 text-center">
                            {form.lineItems.length > 1 && (
                              <button type="button" onClick={() => removeLineItem(idx)}
                                className="text-gray-300 hover:text-red-500 text-lg leading-none">×</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* §9 DISCOUNT */}
            <div className={C}>
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Discount</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={L}>Discount Type</label>
                  <div className="flex mt-1">
                    {(['PERCENT', 'AMOUNT'] as BillDiscountType[]).map(d => (
                      <button key={d} type="button" onClick={() => updateField('discountType', d)}
                        className={`flex-1 py-2.5 text-sm font-bold border transition-all first:rounded-l-lg last:rounded-r-lg ${form.discountType === d ? 'bg-gray-900 text-white border-gray-900 z-10' : 'bg-white text-gray-600 border-gray-300'}`}>
                        {d === 'PERCENT' ? '% Percent' : '₹ Amount'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={L}>Discount {form.discountType === 'PERCENT' ? '(%)' : '(Amount)'}</label>
                  <input type="number" min="0" max={form.discountType === 'PERCENT' ? 100 : undefined}
                    value={form.discountValue || ''}
                    onChange={e => updateField('discountValue', parseFloat(e.target.value) || 0)}
                    className={I} placeholder="0" />
                </div>
                <div>
                  <label className={L}>Discount Calculated</label>
                  <input readOnly value={fmt(summary.discountAmount)}
                    className={I + ' bg-gray-50 text-gray-500 cursor-default'} />
                </div>
                <div>
                  <label className={L}>Discount Reason</label>
                  <select value={form.discountReason} onChange={e => updateField('discountReason', e.target.value)} className={I}>
                    <option value="">Select reason…</option>
                    {DISCOUNT_REASONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                {form.discountValue > 0 && (
                  <div className="col-span-2 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                    <span className="text-xs text-gray-500">Approval level:</span>
                    <span className={`text-xs font-bold ${discLevel.color}`}>{discLevel.label}</span>
                    <span className="text-xs text-gray-400">({discPct.toFixed(1)}%)</span>
                  </div>
                )}
                {form.approvedBy && (
                  <div>
                    <label className={L}>Approved By</label>
                    <input readOnly value={form.approvedBy} className={I + ' bg-gray-50 cursor-default'} />
                  </div>
                )}
              </div>
            </div>

            {/* §10 ADVANCE / DEPOSIT */}
            <div className={C}>
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Advance / Deposit</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={L}>Advance Amount</label>
                  <input type="number" min="0" value={form.advanceAmount || ''}
                    onChange={e => updateField('advanceAmount', parseFloat(e.target.value) || 0)}
                    className={I} placeholder="0.00" />
                </div>
                <div>
                  <label className={L}>Advance Date</label>
                  <input type="date" value={form.advanceDate} onChange={e => updateField('advanceDate', e.target.value)}
                    className={I} />
                </div>
                <div>
                  <label className={L}>Receipt Reference</label>
                  <input value={form.advanceRef} onChange={e => updateField('advanceRef', e.target.value)}
                    className={I + ' font-mono'} placeholder="Receipt no." />
                </div>
                <div>
                  <label className={L}>Advance Type</label>
                  <select value={form.advanceType} onChange={e => updateField('advanceType', e.target.value)} className={I}>
                    <option>Refundable</option>
                    <option>Non-refundable</option>
                  </select>
                </div>
              </div>
            </div>

          </div>{/* end col-span-2 */}

          {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
          <div>
            <div className="sticky top-20 space-y-4">

              {/* BILL SUMMARY */}
              <div className="bg-gray-900 text-white rounded-xl p-5">
                <div className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Bill Summary</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Subtotal</span>
                    <span className="font-mono">{fmt(summary.subtotal)}</span>
                  </div>
                  {summary.discountAmount > 0 && (
                    <div className="flex justify-between text-orange-400">
                      <span>Discount{form.discountType === 'PERCENT' ? ` (${form.discountValue}%)` : ''}</span>
                      <span className="font-mono">− {fmt(summary.discountAmount)}</span>
                    </div>
                  )}
                  {summary.taxAmount > 0 && (
                    <div className="flex justify-between text-gray-300">
                      <span>{cc === 'IN' ? 'Tax' : cc === 'AE' ? 'VAT (5%)' : 'Tax'}</span>
                      <span className="font-mono">{fmt(summary.taxAmount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-700 pt-2 flex justify-between font-black text-lg">
                    <span>Total</span>
                    <span className="font-mono">{fmt(summary.netAmount)}</span>
                  </div>
                  {summary.advancePaid > 0 && (
                    <div className="flex justify-between text-emerald-400 font-semibold text-sm">
                      <span>Advance Paid</span>
                      <span className="font-mono">− {fmt(summary.advancePaid)}</span>
                    </div>
                  )}
                  {summary.balanceDue > 0 && (
                    <div className="flex justify-between text-red-400 font-black text-base">
                      <span>Balance Due</span>
                      <span className="font-mono">{fmt(summary.balanceDue)}</span>
                    </div>
                  )}
                  {summary.balanceDue === 0 && summary.netAmount > 0 && (
                    <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm pt-1">
                      <span>✓ Fully paid</span>
                    </div>
                  )}
                </div>
              </div>

              {/* APPROVAL WORKFLOW — shows after bill is saved */}
              {savedBillId && hospitalId && (
                <ApprovalWorkflow
                  billId={savedBillId}
                  hospitalId={String(hospitalId)}
                  currentStatus={savedBillStatus}
                  discountPct={discPct}
                  discountThreshold={10}
                  onStatusChange={function (newStatus, billNum) {
                    setSavedBillStatus(newStatus)
                    if (newStatus === 'FINAL') {
                      notify.success('Bill finalized — ' + (billNum || billNumber))
                      router.push('/dashboard/bills/' + savedBillId)
                    } else if (newStatus === 'VOID') {
                      notify.error('Bill voided')
                      router.push('/dashboard/bills/' + savedBillId)
                    }
                  }}
                />
              )}

              {/* PAYMENT COLLECTION */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="text-xs font-black uppercase tracking-wide text-gray-600 mb-3">Collect Payment</div>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { mode: 'CASH' as PaymentMode,        label: 'Cash',     active: 'bg-emerald-50 border-emerald-500 text-emerald-700',   onClick: () => { updateField('paymentMode', 'CASH'); updateField('amountPaid', summary.netAmount) } },
                    { mode: 'UPI' as PaymentMode,         label: 'UPI / QR', active: 'bg-blue-50 border-blue-500 text-blue-700',            onClick: handleUpiPayment },
                    { mode: 'CARD' as PaymentMode,        label: 'Card',     active: 'bg-purple-50 border-purple-500 text-purple-700',      onClick: () => { updateField('paymentMode', 'CARD'); updateField('amountPaid', summary.netAmount) } },
                    { mode: 'ONLINE_LINK' as PaymentMode, label: 'WA Link',  active: 'bg-green-50 border-green-500 text-green-700',         onClick: handleWhatsAppLink },
                  ]).map(({ mode, label, active, onClick }) => (
                    <button key={mode} type="button" onClick={onClick}
                      className={`py-2.5 rounded-lg text-xs font-bold border transition-all ${form.paymentMode === mode ? active : 'bg-white border-gray-300 text-gray-600 hover:border-orange-500 hover:text-orange-600'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                {form.supplyType === 'B2B' && (
                  <button type="button" onClick={() => updateField('paymentMode', 'TPA')}
                    className={`w-full mt-2 py-2.5 rounded-lg text-xs font-bold border transition-all ${form.paymentMode === 'TPA' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white border-gray-300 text-gray-600 hover:border-orange-500'}`}>
                    TPA / Insurance pays
                  </button>
                )}
                <div className="mt-3">
                  <label className={L}>Notes to Patient</label>
                  <textarea value={form.notes} onChange={e => updateField('notes', e.target.value)}
                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 text-sm focus:border-orange-500 focus:outline-none resize-none" rows={2}
                    placeholder="Discharge instructions, follow-up notes…" />
                </div>
              </div>

              {/* CTA */}
              {form.supplyType === 'B2B' && form.payerId ? (
                <div>
                  <p className="text-xs text-gray-500 font-mono mb-2 text-center">
                    {cc === 'IN' ? 'Pre-auth SLA: 1 hr (IRDAI)' : 'Pre-auth SLA: 1 hr (DHA PD-05-2025)'}
                  </p>
                  <button type="submit" disabled={saving}
                    className="w-full py-3 bg-orange-600 text-white rounded-xl text-sm font-black tracking-wide disabled:opacity-60 hover:bg-orange-700">
                    {saving ? 'Saving…' : 'Save & Submit Claim'}
                  </button>
                </div>
              ) : (
                <button type="submit" disabled={saving}
                  className="w-full py-3 bg-orange-600 text-white rounded-xl text-sm font-black tracking-wide disabled:opacity-60 hover:bg-orange-700">
                  {saving ? 'Saving…' : 'Save & Print Bill'}
                </button>
              )}

            </div>
          </div>

        </div>
      </form>
    </div>
  )
}
