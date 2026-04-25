'use client'
// /dashboard/billing/opd — OPD Quick Billing
// Locale-aware: IN (Bill of Supply / Tax Invoice) | AE (Tax Invoice + Emirates ID) | GB (VAT Invoice) | US (Superbill)
// Sources: NABH OPD.3/OPD.9, GST SAC 9993, DHA PD-05-2025, MHAI Definitive Billing Field Master v1.0

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/auth-context'
import { useLocale } from '@/app/providers/locale-context'
import { useCurrency } from '@/app/hooks/useCurrency'
import { useNotification } from '@/app/providers/NotificationProvider'
import { getToken } from '@/lib/api'
import { getDocType, getDocTypeLabel, HSN_SAC_MAP } from '@/lib/billingHelper'
import type { BillCategory } from '@/lib/billingHelper'

type SupplyType = 'B2C' | 'B2B'
type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'ONLINE_LINK' | 'CREDIT' | 'TPA'

interface LineItem {
  id: string
  description: string
  hsnSac: string
  quantity: number
  unitPrice: number
  discount: number
  taxRate: number
  amount: number
}

interface OPDBillForm {
  patientName: string
  patientPhone: string
  patientAge: string
  patientGender: string
  uhid: string
  abhaNumber: string
  emiratesId: string
  passportNumber: string
  nationalityCode: string
  doctorName: string
  specialty: string
  visitType: string
  referredBy: string
  billCategory: BillCategory
  supplyType: SupplyType
  payerId: string
  memberCardNumber: string
  policyNumber: string
  cardExpiryDate: string
  networkId: string
  icd10Primary: string
  icd10Secondary: string
  presentingComplaint: string
  encounterType: string
  cashlessOrReimbursement: string
  preAuthNumber: string
  lineItems: LineItem[]
  paymentMode: PaymentMode
  amountPaid: number
  notes: string
}

var DEFAULT_FORM: OPDBillForm = {
  patientName: '', patientPhone: '', patientAge: '', patientGender: 'M', uhid: '',
  abhaNumber: '', emiratesId: '', passportNumber: '', nationalityCode: '',
  doctorName: '', specialty: '', visitType: 'WALK_IN', referredBy: '',
  billCategory: 'CONSULTATION',
  supplyType: 'B2C',
  payerId: '', memberCardNumber: '', policyNumber: '', cardExpiryDate: '',
  networkId: '', icd10Primary: '', icd10Secondary: '', presentingComplaint: '',
  encounterType: '1', cashlessOrReimbursement: 'CASHLESS', preAuthNumber: '',
  lineItems: [{ id: '1', description: 'OPD Consultation', hsnSac: 'SAC 9993', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0, amount: 0 }],
  paymentMode: 'CASH', amountPaid: 0, notes: ''
}

var INPUT = 'w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 text-sm focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral/20'
var LABEL = 'block text-xs font-bold uppercase tracking-wide text-gray-600 mb-1.5'
var CARD  = 'bg-white rounded-2xl border border-gray-200 p-5 shadow-sm'

export default function OPDBillingPage() {
  var { user } = useAuth()
  var { localeV2 } = useLocale()
  var { format: fmtCurrency } = useCurrency()
  var notify = useNotification()
  var router = useRouter()
  var cc = localeV2?.country_code || 'IN'
  var hospitalId = user?.hospital_id

  var [form, setForm] = useState<OPDBillForm>(DEFAULT_FORM)
  var [payers, setPayers] = useState<any[]>([])
  var [saving, setSaving] = useState(false)
  var [showInsurance, setShowInsurance] = useState(false)

  var docType = getDocType(form.billCategory, cc)
  var docTypeLabel = getDocTypeLabel(docType, cc)

  var subtotal = form.lineItems.reduce((s, li) => s + (li.quantity * li.unitPrice - li.discount), 0)
  var totalTax = form.lineItems.reduce((s, li) => {
    var base = li.quantity * li.unitPrice - li.discount
    return s + (base * li.taxRate / 100)
  }, 0)
  var total = subtotal + totalTax
  var balance = total - form.amountPaid

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

  function updateField(key: keyof OPDBillForm, val: any) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function updateLineItem(idx: number, key: keyof LineItem, val: any) {
    setForm(f => {
      var items = [...f.lineItems]
      items[idx] = { ...items[idx], [key]: val }
      var li = items[idx]
      li.amount = li.quantity * li.unitPrice - li.discount
      if (key === 'description') {
        items[idx].hsnSac = HSN_SAC_MAP[f.billCategory] || 'SAC 9993'
      }
      return { ...f, lineItems: items }
    })
  }

  function addLineItem() {
    setForm(f => ({
      ...f,
      lineItems: [...f.lineItems, {
        id: String(Date.now()),
        description: '', hsnSac: HSN_SAC_MAP[f.billCategory] || 'SAC 9993',
        quantity: 1, unitPrice: 0, discount: 0, taxRate: 0, amount: 0
      }]
    }))
  }

  function removeLineItem(idx: number) {
    setForm(f => ({ ...f, lineItems: f.lineItems.filter((_, i) => i !== idx) }))
  }

  async function handleUpiPayment() {
    if (total <= 0) { notify.error('Enter bill amount first'); return }
    try {
      var res = await fetch('/api/create-payment-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(total * 100), currency: 'INR', notes: { patient: form.patientName, type: 'OPD' } })
      })
      var data = await res.json()
      if (data.id) {
        updateField('paymentMode', 'UPI')
        updateField('amountPaid', total)
        notify.success('UPI QR generated — show to patient')
      }
    } catch (e) {
      notify.error('Payment gateway error')
    }
  }

  async function handleWhatsAppLink() {
    if (total <= 0) { notify.error('Enter bill amount first'); return }
    if (!form.patientPhone) { notify.error('Enter patient phone first'); return }
    try {
      await fetch('/api/create-payment-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(total * 100), currency: 'INR',
          notes: { patient: form.patientName, type: 'OPD_LINK' },
          send_whatsapp: true, phone: form.patientPhone
        })
      })
      notify.success(`Payment link sent to ${form.patientPhone} via WhatsApp`)
    } catch (e) {
      notify.error('WhatsApp link error')
    }
  }

  async function saveBill(e: React.FormEvent) {
    e.preventDefault()
    if (!form.patientName) { notify.error('Patient name required'); return }
    if (form.lineItems.every(li => !li.description)) { notify.error('Add at least one service'); return }
    if (!hospitalId) { notify.error('Not signed in'); return }

    if (cc === 'AE' && form.supplyType === 'B2B') {
      if (!form.emiratesId && !form.passportNumber) {
        notify.error('Emirates ID or Passport Number required for insured patients (DHA mandate)')
        return
      }
      if (!form.icd10Primary) {
        notify.error('Diagnosis code (ICD-10-CM) required for AE insurance claims')
        return
      }
      if (form.cardExpiryDate && new Date(form.cardExpiryDate) < new Date()) {
        notify.error('Insurance card is expired — DHA will reject this claim')
        return
      }
    }

    setSaving(true)
    try {
      var token = getToken()
      var payload = {
        patient_name: form.patientName,
        patient_phone: form.patientPhone,
        patient_age: form.patientAge,
        patient_gender: form.patientGender,
        uhid: form.uhid,
        abha_number: form.abhaNumber || null,
        emirates_id: form.emiratesId || null,
        passport_number: form.passportNumber || null,
        nationality_code: form.nationalityCode || null,
        doctor_name: form.doctorName,
        specialty: form.specialty,
        visit_type: form.visitType,
        referred_by: form.referredBy || null,
        bill_category: form.billCategory,
        doc_type: docType,
        encounter_type: 'OPD',
        supply_type: form.supplyType,
        payer_id: form.payerId || null,
        member_card_number: form.memberCardNumber || null,
        policy_number: form.policyNumber || null,
        card_expiry_date: form.cardExpiryDate || null,
        network_id: form.networkId || null,
        icd10_primary: form.icd10Primary || null,
        icd10_secondary: form.icd10Secondary ? [form.icd10Secondary] : null,
        presenting_complaint: form.presentingComplaint || null,
        cashless_or_reimbursement: form.cashlessOrReimbursement,
        preauth_number: form.preAuthNumber || null,
        line_items: form.lineItems.map(li => ({
          description: li.description,
          hsn_sac: li.hsnSac,
          quantity: li.quantity,
          unit_price: li.unitPrice,
          discount: li.discount,
          tax_rate: li.taxRate,
          amount: li.amount
        })),
        payment_mode: form.paymentMode,
        amount_paid: form.amountPaid,
        total_amount: total,
        tax_amount: totalTax,
        notes: form.notes
      }

      var res = await fetch(`/api/hospitals/${hospitalId}/rcm/billing/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        var err = await res.json()
        throw new Error(err.error || 'Save failed')
      }

      var saved = await res.json()
      notify.success('Bill saved successfully')
      router.push(`/dashboard/bills/${saved.bill?.id || saved.id}`)
    } catch (err: any) {
      notify.error(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <form onSubmit={saveBill}>
        {/* HEADER */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm px-6 py-3 flex justify-between items-center">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-gray-500">BILLING / OPD</div>
            <h1 className="font-display text-2xl font-semibold mt-0.5 tracking-tight">
              Quick <em className="italic text-coral-deep">OPD Bill</em>
            </h1>
          </div>
          <div className="flex gap-3 items-center">
            <span className={`text-xs font-bold px-2 py-1 rounded-md ${docType === 'BILL_OF_SUPPLY' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              {docTypeLabel}
            </span>
            <button type="button" onClick={() => router.back()}
              className="px-4 py-2 text-sm font-semibold border border-gray-300 rounded-lg text-gray-600 bg-white hover:border-gray-400 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 text-sm font-bold bg-coral text-white rounded-lg disabled:opacity-60 hover:opacity-90 transition-opacity">
              {saving ? 'Saving…' : 'Save & Print'}
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-3 gap-6">

          {/* LEFT: Patient + Service */}
          <div className="col-span-2 space-y-5">

            {/* PATIENT */}
            <div className={CARD}>
              <h2 className="font-display text-lg font-semibold mb-4">Patient <em className="italic text-coral-deep">details</em></h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Patient Name *</label>
                  <input value={form.patientName} onChange={e => updateField('patientName', e.target.value)}
                    className={INPUT} placeholder="Full name" required />
                </div>
                <div>
                  <label className={LABEL}>Phone</label>
                  <input value={form.patientPhone} onChange={e => updateField('patientPhone', e.target.value)}
                    className={INPUT}
                    placeholder={cc === 'IN' ? '+91 XXXXX XXXXX' : cc === 'AE' ? '+971 XX XXX XXXX' : 'Phone'} />
                </div>
                <div>
                  <label className={LABEL}>Age</label>
                  <input value={form.patientAge} onChange={e => updateField('patientAge', e.target.value)}
                    className={INPUT} placeholder="e.g. 35Y" />
                </div>
                <div>
                  <label className={LABEL}>Gender</label>
                  <select value={form.patientGender} onChange={e => updateField('patientGender', e.target.value)}
                    className={INPUT}>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL}>UHID</label>
                  <input value={form.uhid} onChange={e => updateField('uhid', e.target.value)}
                    className={INPUT} placeholder="Auto-assigned if blank" />
                </div>
                {cc === 'IN' && (
                  <div>
                    <label className={LABEL}>ABHA Number</label>
                    <input value={form.abhaNumber} onChange={e => updateField('abhaNumber', e.target.value)}
                      className={INPUT} placeholder="14-digit ABHA (optional)" />
                  </div>
                )}
                {cc === 'AE' && (
                  <>
                    <div>
                      <label className={LABEL}>
                        Emirates ID{form.supplyType === 'B2B' && <span className="ml-1 text-rose-500 normal-case font-normal">(Required for insured)</span>}
                      </label>
                      <input value={form.emiratesId} onChange={e => updateField('emiratesId', e.target.value)}
                        className={INPUT} placeholder="784-XXXX-XXXXXXX-X" />
                    </div>
                    <div>
                      <label className={LABEL}>Nationality (ISO)</label>
                      <input value={form.nationalityCode} onChange={e => updateField('nationalityCode', e.target.value.toUpperCase())}
                        className={INPUT + ' font-mono uppercase tracking-widest'} placeholder="ARE / IND / GBR / USA" maxLength={3} />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* VISIT + BILL TYPE */}
            <div className={CARD}>
              <h2 className="font-display text-lg font-semibold mb-4">Visit <em className="italic text-coral-deep">details</em></h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Attending Doctor</label>
                  <input value={form.doctorName} onChange={e => updateField('doctorName', e.target.value)}
                    className={INPUT} placeholder="Dr. Name" />
                </div>
                <div>
                  <label className={LABEL}>Visit Type</label>
                  <select value={form.visitType} onChange={e => updateField('visitType', e.target.value)}
                    className={INPUT}>
                    <option value="WALK_IN">Walk-In</option>
                    <option value="APPOINTMENT">Appointment</option>
                    <option value="FOLLOW_UP">Follow-Up</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={LABEL}>Bill Category</label>
                  <div className="flex gap-2 flex-wrap mt-0.5">
                    {(['CONSULTATION','DIAGNOSTIC_LAB','PHARMACY','PROCEDURE','PACKAGE'] as BillCategory[]).map(cat => (
                      <button key={cat} type="button"
                        onClick={() => updateField('billCategory', cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${form.billCategory === cat ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:border-coral hover:text-coral'}`}>
                        {cat.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Document type: <span className={`font-bold ${docType === 'BILL_OF_SUPPLY' ? 'text-emerald-700' : 'text-amber-600'}`}>{docTypeLabel}</span>
                    {cc === 'IN' && <span className="ml-2 font-mono text-gray-500">{HSN_SAC_MAP[form.billCategory]}</span>}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className={LABEL}>Payment Type</label>
                  <div className="flex gap-3 mt-0.5">
                    <button type="button" onClick={() => { updateField('supplyType', 'B2C'); setShowInsurance(false) }}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold border transition-all ${form.supplyType === 'B2C' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:border-coral'}`}>
                      B2C — Patient pays
                    </button>
                    <button type="button" onClick={() => { updateField('supplyType', 'B2B'); setShowInsurance(true) }}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold border transition-all ${form.supplyType === 'B2B' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:border-coral'}`}>
                      B2B — Insurance / TPA
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* INSURANCE — shown when B2B */}
            {showInsurance && (
              <div className={CARD}>
                <h2 className="font-display text-lg font-semibold mb-1">Insurance <em className="italic text-coral-deep">details</em></h2>
                {cc === 'AE' && (
                  <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2 mb-4">
                    DHA mandate: Pre-auth within 1 hour of physician order (PD-05-2025)
                  </p>
                )}
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="col-span-2">
                    <label className={LABEL}>
                      {cc === 'IN' ? 'TPA / Insurer' : 'Insurance Company'} *
                    </label>
                    <select value={form.payerId} onChange={e => updateField('payerId', e.target.value)}
                      className={INPUT}>
                      <option value="">Select payer…</option>
                      {payers.map(p => <option key={p.id} value={p.id}>{p.payer_name || p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Member Card No. *</label>
                    <input value={form.memberCardNumber} onChange={e => updateField('memberCardNumber', e.target.value)}
                      className={INPUT} placeholder="From insurance card" />
                  </div>
                  <div>
                    <label className={LABEL}>Policy Number</label>
                    <input value={form.policyNumber} onChange={e => updateField('policyNumber', e.target.value)}
                      className={INPUT} placeholder="Policy number" />
                  </div>
                  {cc === 'AE' && (
                    <div>
                      <label className={LABEL}>
                        Card Expiry Date <span className="text-rose-500 normal-case font-normal">(DHA rejects expired instantly)</span>
                      </label>
                      <input type="date" value={form.cardExpiryDate} onChange={e => updateField('cardExpiryDate', e.target.value)}
                        className={INPUT} />
                    </div>
                  )}
                  <div>
                    <label className={LABEL}>
                      {cc === 'AE' ? 'Diagnosis (ICD-10-CM) *' : 'Diagnosis Code (ICD-10-CM)'}
                    </label>
                    <input value={form.icd10Primary} onChange={e => updateField('icd10Primary', e.target.value.toUpperCase())}
                      className={INPUT + ' font-mono'}
                      placeholder={cc === 'AE' ? 'e.g. J00 — mandatory for eClaimLink' : 'e.g. K21.0'} />
                    {cc === 'AE' && <p className="text-xs text-gray-500 mt-1">ICD-10-CM only — NOT ICD-10-AM (DHA mandate)</p>}
                  </div>
                  {cc === 'AE' && (
                    <div>
                      <label className={LABEL}>Presenting Complaint <span className="text-amber-600 normal-case font-normal">(required for consult codes)</span></label>
                      <input value={form.presentingComplaint} onChange={e => updateField('presentingComplaint', e.target.value)}
                        className={INPUT} placeholder="Chief complaint in plain language" />
                    </div>
                  )}
                  <div>
                    <label className={LABEL}>Cashless / Reimbursement</label>
                    <select value={form.cashlessOrReimbursement} onChange={e => updateField('cashlessOrReimbursement', e.target.value)}
                      className={INPUT}>
                      <option value="CASHLESS">Cashless — Direct billing to insurer</option>
                      <option value="REIMBURSEMENT">Reimbursement — Patient pays, insurer refunds</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Pre-Auth Number (if obtained)</label>
                    <input value={form.preAuthNumber} onChange={e => updateField('preAuthNumber', e.target.value)}
                      className={INPUT + ' font-mono'} placeholder="Pre-authorization reference" />
                  </div>
                </div>
              </div>
            )}

            {/* LINE ITEMS */}
            <div className={CARD}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-display text-lg font-semibold">Line <em className="italic text-coral-deep">items</em></h2>
                <button type="button" onClick={addLineItem} className="text-sm text-coral font-bold">+ Add item</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs font-bold uppercase tracking-wide text-gray-500 border-b border-gray-200">
                      <th className="pb-2 text-left font-bold">Description</th>
                      {cc === 'IN' && <th className="pb-2 text-left w-24 font-bold">HSN/SAC</th>}
                      <th className="pb-2 text-right w-16 font-bold">Qty</th>
                      <th className="pb-2 text-right w-24 font-bold">Rate</th>
                      <th className="pb-2 text-right w-20 font-bold">Discount</th>
                      {docType === 'TAX_INVOICE' && <th className="pb-2 text-right w-16 font-bold">Tax%</th>}
                      <th className="pb-2 text-right w-24 font-bold">Amount</th>
                      <th className="pb-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.lineItems.map((li, idx) => (
                      <tr key={li.id} className="border-b border-gray-100">
                        <td className="py-2 pr-2">
                          <input value={li.description} onChange={e => updateLineItem(idx, 'description', e.target.value)}
                            className="w-full border border-gray-300 bg-white text-gray-900 rounded px-2 py-1 text-sm focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral/20" placeholder="Service description" />
                        </td>
                        {cc === 'IN' && (
                          <td className="py-2 pr-2">
                            <input value={li.hsnSac} onChange={e => updateLineItem(idx, 'hsnSac', e.target.value)}
                              className="w-full border border-gray-300 bg-white text-gray-900 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-coral" />
                          </td>
                        )}
                        <td className="py-2 pr-2">
                          <input type="number" min="1" value={li.quantity} onChange={e => updateLineItem(idx, 'quantity', parseFloat(e.target.value) || 1)}
                            className="w-full border border-gray-300 bg-white text-gray-900 rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-coral" />
                        </td>
                        <td className="py-2 pr-2">
                          <input type="number" min="0" value={li.unitPrice} onChange={e => updateLineItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full border border-gray-300 bg-white text-gray-900 rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-coral" />
                        </td>
                        <td className="py-2 pr-2">
                          <input type="number" min="0" value={li.discount} onChange={e => updateLineItem(idx, 'discount', parseFloat(e.target.value) || 0)}
                            className="w-full border border-gray-300 bg-white text-gray-900 rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-coral" />
                        </td>
                        {docType === 'TAX_INVOICE' && (
                          <td className="py-2 pr-2">
                            <select value={li.taxRate} onChange={e => updateLineItem(idx, 'taxRate', parseFloat(e.target.value))}
                              className="w-full border border-gray-300 bg-white text-gray-900 rounded px-1 py-1 text-xs focus:outline-none focus:border-coral">
                              <option value={0}>0%</option>
                              <option value={5}>5%</option>
                              <option value={12}>12%</option>
                              <option value={18}>18%</option>
                            </select>
                          </td>
                        )}
                        <td className="py-2 pr-2 text-right font-mono font-semibold text-gray-900">
                          {fmtCurrency(li.amount)}
                        </td>
                        <td>
                          {form.lineItems.length > 1 && (
                            <button type="button" onClick={() => removeLineItem(idx)} className="text-gray-400 hover:text-rose-500 text-lg leading-none">×</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* RIGHT: Summary + Payment */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sticky top-20">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Bill Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-mono text-gray-900">{fmtCurrency(subtotal)}</span>
                </div>
                {totalTax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{cc === 'IN' ? 'CGST + SGST' : cc === 'AE' ? 'VAT (5%)' : 'Tax'}</span>
                    <span className="font-mono text-gray-900">{fmtCurrency(totalTax)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-base">
                  <span className="text-gray-900">Total</span>
                  <span className="font-mono text-2xl text-gray-900">{fmtCurrency(total)}</span>
                </div>
                {form.amountPaid > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Paid</span>
                    <span className="font-mono">{fmtCurrency(form.amountPaid)}</span>
                  </div>
                )}
                {balance > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Balance Due</span>
                    <span className="font-mono">{fmtCurrency(balance)}</span>
                  </div>
                )}
              </div>

              {/* PAYMENT COLLECTION */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-3">Collect Payment</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => { updateField('paymentMode', 'CASH'); updateField('amountPaid', total) }}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${form.paymentMode === 'CASH' ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-white border-gray-300 text-gray-600 hover:border-coral hover:text-coral'}`}>
                    Cash
                  </button>
                  <button type="button" onClick={handleUpiPayment}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${form.paymentMode === 'UPI' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-gray-300 text-gray-600 hover:border-coral hover:text-coral'}`}>
                    UPI / QR
                  </button>
                  <button type="button" onClick={() => { updateField('paymentMode', 'CARD'); updateField('amountPaid', total) }}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${form.paymentMode === 'CARD' ? 'bg-purple-50 border-purple-400 text-purple-700' : 'bg-white border-gray-300 text-gray-600 hover:border-coral hover:text-coral'}`}>
                    Card
                  </button>
                  <button type="button" onClick={handleWhatsAppLink}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${form.paymentMode === 'ONLINE_LINK' ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-white border-gray-300 text-gray-600 hover:border-coral hover:text-coral'}`}>
                    WA Link
                  </button>
                </div>
                {form.supplyType === 'B2B' && (
                  <button type="button" onClick={() => updateField('paymentMode', 'TPA')}
                    className={`w-full mt-2 py-2 rounded-lg text-xs font-bold border transition-all ${form.paymentMode === 'TPA' ? 'bg-amber-50 border-amber-400 text-amber-700' : 'bg-white border-gray-300 text-gray-600 hover:border-coral hover:text-coral'}`}>
                    TPA / Insurance pays
                  </button>
                )}
              </div>

              {form.supplyType === 'B2B' && form.payerId && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 font-mono mb-2">
                    {cc === 'IN' ? 'Pre-auth SLA: 1 hour (IRDAI)' : 'Pre-auth SLA: 1 hour (DHA PD-05-2025)'}
                  </p>
                  <button type="submit" className="w-full py-2.5 bg-coral text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
                    Save Bill + Submit Claim
                  </button>
                </div>
              )}

              {form.supplyType === 'B2C' && (
                <div className="mt-4">
                  <button type="submit" className="w-full py-2.5 bg-coral text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
                    Save & Print Bill
                  </button>
                </div>
              )}

              <div className="mt-4">
                <label className={LABEL}>Notes to Patient</label>
                <textarea value={form.notes} onChange={e => updateField('notes', e.target.value)}
                  className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 text-sm focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral/20 resize-none" rows={2} />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
