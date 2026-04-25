'use client'
import { useState, useRef, lazy, Suspense } from 'react'
import dynamic from 'next/dynamic'
import BarcodeLabel, { LABEL_SIZES, type LabelSize, type LabelPatient } from '@/app/components/print/BarcodeLabel'
import { type CountryCode, type Bill, type PrintPrefs } from '@/app/components/print/lib'
import { useAuth } from '@/app/providers/auth-context'

var Barcode = dynamic<{
  value: string; format?: string; width?: number; height?: number;
  displayValue?: boolean; margin?: number; background?: string; lineColor?: string;
}>(() => import('react-barcode') as any, { ssr: false })

var PrintStandardInvoice = lazy(() => import('@/app/components/print/PrintStandardInvoice'))
var PrintB2BInvoice      = lazy(() => import('@/app/components/print/PrintB2BInvoice'))
var PrintEInvoiceIRN     = lazy(() => import('@/app/components/print/PrintEInvoiceIRN'))
var PrintSchemeInvoice   = lazy(() => import('@/app/components/print/PrintSchemeInvoice'))
var PrintReceipt         = lazy(() => import('@/app/components/print/PrintReceipt'))

// ── Constants ─────────────────────────────────────────────────────────────────

var LAYOUTS = [1, 2, 4, 6, 12, 28]
var DEFAULT_LAYOUT = 12

var BILL_FORMATS = [
  { key: 'standard',   label: 'Standard Invoice',       desc: 'All countries · tax invoice',       countries: ['IN','US','GB','AE'] },
  { key: 'detailed',   label: 'Detailed Itemised',       desc: 'Full line-item breakdown · IN/AE',  countries: ['IN','AE'] },
  { key: 'b2b',        label: 'Insurance / TPA',         desc: 'B2B · insurer copy · IN/AE',        countries: ['IN','AE'] },
  { key: 'receipt',    label: 'Receipt Only',             desc: 'Post-payment · all countries',      countries: ['IN','US','GB','AE'] },
  { key: 'thermal',    label: 'Thermal 80mm POS',        desc: 'OPD counter printer · all',         countries: ['IN','US','GB','AE'] },
  { key: 'discharge',  label: 'Discharge Summary',       desc: 'IPD discharge · IN/AE/GB',          countries: ['IN','AE','GB'] },
  { key: 'einvoice',   label: 'e-Invoice IRN',            desc: 'GSTN-signed · > ₹5 Cr · IN only',  countries: ['IN'], warn: 'Requires GSTN registration' },
  { key: 'scheme',     label: 'PMJAY / Govt Scheme',     desc: 'PM-JAY · CGHS · ESI · IN only',    countries: ['IN'] },
  { key: 'superbill',  label: 'Superbill',                desc: 'CPT + ICD-10 · US only',           countries: ['US'] },
]

var PAPER_SIZES = [
  { key: 'a4',      label: 'A4',          w: 210, h: 297 },
  { key: 'a5',      label: 'A5',          w: 148, h: 210 },
  { key: 'thermal', label: 'Thermal 80mm', w: 80,  h: 200 },
  { key: 'letter',  label: 'US Letter',   w: 216, h: 279 },
  { key: 'half',    label: 'Half Letter', w: 140, h: 216 },
]

var PDF_CONTENT_ITEMS = [
  { id: 'header',     label: 'Clinic header (logo + address + GSTIN/TRN)',  default: true },
  { id: 'barcode',    label: 'UHID barcode on header',                       default: true },
  { id: 'patient',    label: 'Patient details section',                      default: true },
  { id: 'items',      label: 'Service / line items table',                   default: true },
  { id: 'summary',    label: 'Financial summary',                            default: true },
  { id: 'words',      label: 'Amount in words',                              default: true },
  { id: 'qr',         label: 'QR code (final bills only)',                   default: true },
  { id: 'insurance',  label: 'Insurance details (B2B only)',                 default: false },
  { id: 'signature',  label: 'Doctor signature area',                        default: false },
  { id: 'gstfooter',  label: 'GST compliance footer',                        default: false },
  { id: 'watermark',  label: 'DRAFT watermark (draft bills)',                default: false },
  { id: 'pagenum',    label: 'Page number + print timestamp',                default: true },
]

var WATERMARKS = ['None', 'DRAFT', 'DUPLICATE', 'FOR INSURANCE ONLY']
var PASSWORD_OPTS = ['None', 'UHID number', 'Last 4 digits of phone']
var FONT_SIZES = ['Small (8pt)', 'Normal (10pt)', 'Large (12pt)']

// ── Demo data ──────────────────────────────────────────────────────────────────

var DEMO_PATIENT: LabelPatient = {
  uhid:         'UHID2026001234',
  name:         'Rajesh Kumar',
  age:          '45',
  gender:       'M',
  doctor:       'Dr. Priya Sharma',
  ward:         'General Ward-B',
  hospitalName: 'MediHost Clinic',
}

var DEMO_BILL: Bill = {
  bill_number:    'MHAI/2026-27/00042',
  patient_name:   'Rajesh Kumar',
  patient_phone:  '+91 98765 43210',
  supply_type:    'B2C',
  taxable_amount: 1500,
  cgst_amount:    135,
  sgst_amount:    135,
  tax_amount:     270,
  total_amount:   1770,
  paid_amount:    1770,
  payment_method: 'UPI',
  items: [
    { description: 'Consultation — General OPD', quantity: 1, rate: 800, amount: 800,  hsn_sac: 'SAC 9993', tax_rate: 18 },
    { description: 'CBC + LFT Blood Panel',      quantity: 1, rate: 450, amount: 450,  hsn_sac: 'SAC 9987', tax_rate: 18 },
    { description: 'Dolo 650mg × 10 tabs',       quantity: 2, rate: 125, amount: 250,  hsn_sac: 'HSN 3004', tax_rate: 12 },
  ],
} as Bill

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PrintManagementPage() {
  var { user } = useAuth()
  var cc = ((user as any)?.country_code || 'IN') as CountryCode
  var [tab, setTab] = useState<'labels' | 'formats' | 'pdf'>('labels')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-8 py-5">
        <h1 className="text-xl font-bold text-gray-900">Print Manager</h1>
        <p className="mt-0.5 text-sm text-gray-500">Barcode labels · Bill formats · PDF export</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white px-8">
        <div className="flex gap-0">
          {[
            { key: 'labels',  label: '🏷 Barcode Labels' },
            { key: 'formats', label: '🧾 Bill Formats' },
            { key: 'pdf',     label: '⬇ PDF Export' },
          ].map(function (t) {
            var active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={function () { setTab(t.key as 'labels' | 'formats' | 'pdf') }}
                className={
                  'border-b-2 px-5 py-3 text-sm font-medium transition-colors ' +
                  (active
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800')
                }
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-8 py-6">
        {tab === 'labels'  && <BarcodeLabelsTab cc={cc} />}
        {tab === 'formats' && <BillFormatsTab   cc={cc} />}
        {tab === 'pdf'     && <PdfExportTab     cc={cc} />}
      </div>
    </div>
  )
}

// ── Tab 1: Barcode Labels — Fix 10: patient-search-first ─────────────────────

function BarcodeLabelsTab({ cc }: { cc: CountryCode }) {
  var { user } = useAuth()
  var hospitalId = (user as any)?.hospital_id

  // Fix 10: patient search state
  var [patientQuery, setPatientQuery]   = useState('')
  var [patientResults, setPatientResults] = useState<any[]>([])
  var [patientSearching, setPatientSearching] = useState(false)
  var [selectedPatient, setSelectedPatient]   = useState<LabelPatient | null>(null)

  var [selectedSize, setSelectedSize] = useState<LabelSize>('2x1')
  var [customW, setCustomW]   = useState(50)
  var [customH, setCustomH]   = useState(25)
  var [perSheet, setPerSheet] = useState(DEFAULT_LAYOUT)
  var [quantity, setQuantity] = useState(10)
  var previewRef = useRef<HTMLDivElement>(null)

  var sheets = Math.ceil(quantity / perSheet)

  async function searchPatients(q: string) {
    setPatientQuery(q)
    if (!q.trim() || !hospitalId) { setPatientResults([]); return }
    setPatientSearching(true)
    try {
      var { getToken } = await import('@/lib/api')
      var token = getToken()
      var r = await fetch(`/api/hospitals/${hospitalId}/patients?q=${encodeURIComponent(q)}&limit=6`, {
        headers: token ? { Authorization: 'Bearer ' + token } : {}
      })
      var d = await r.json()
      setPatientResults(d.patients || d.data || [])
    } catch { setPatientResults([]) }
    finally { setPatientSearching(false) }
  }

  function pickPatient(p: any) {
    setSelectedPatient({
      uhid:         p.uhid || p.patient_uhid || 'UHID-UNKNOWN',
      name:         p.name || p.patient_name || '',
      age:          p.age || undefined,
      gender:       p.gender || undefined,
      doctor:       p.attending_doctor || undefined,
      ward:         p.ward || undefined,
      hospitalName: (user as any)?.clinic_name || 'MediHost Clinic',
    })
    setPatientQuery(p.name || p.patient_name || '')
    setPatientResults([])
  }

  function clearPatient() {
    setSelectedPatient(null)
    setPatientQuery('')
    setPatientResults([])
  }

  function handlePrint() {
    if (!previewRef.current) return
    var inner = previewRef.current.innerHTML
    var styles = Array.from(document.styleSheets).map(function(ss) {
      try { return Array.from(ss.cssRules).map(function(r) { return r.cssText; }).join('') }
      catch { return ss.href ? '' : '' }
    }).join('')
    var win = window.open('', '_blank', 'width=800,height=1000')
    if (!win) return
    win.document.write('<!DOCTYPE html><html><head><title>Barcode Labels</title><style>' + styles + '@page{margin:10mm;}@media print{body{margin:0;}}</style></head><body>' + inner + '</body></html>')
    win.document.close()
    win.focus()
    var winRef = win
    setTimeout(function() { winRef.print(); winRef.close(); }, 800)
  }

  async function handlePdfDownload() {
    if (!previewRef.current) return
    try {
      var html2canvas = (await import('html2canvas')).default
      var jsPDF = (await import('jspdf')).default
      var canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true })
      var img = canvas.toDataURL('image/png')
      var pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      var pW = pdf.internal.pageSize.getWidth()
      var pH = pdf.internal.pageSize.getHeight()
      pdf.addImage(img, 'PNG', 0, 0, pW, pH)
      pdf.save('barcode-labels-' + (selectedPatient?.uhid || 'patient') + '.pdf')
    } catch (e) {
      alert('PDF download error: ' + e)
    }
  }

  var labelKeys = Object.keys(LABEL_SIZES) as LabelSize[]

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
        <div className="text-sm font-bold text-blue-900">Print UHID Barcode Labels for a Registered Patient</div>
        <div className="mt-0.5 text-xs text-blue-700">
          Barcodes are generated at patient registration. Search a patient below to print their labels.
        </div>
      </div>

      {/* Patient search */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Search Patient</div>
        {selectedPatient ? (
          <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div>
              <div className="font-semibold text-emerald-900">{selectedPatient.name}</div>
              <div className="mt-0.5 font-mono text-xs text-emerald-700">
                {selectedPatient.uhid}
                {selectedPatient.age && <span className="ml-2">{selectedPatient.age}</span>}
                {selectedPatient.gender && <span className="ml-1">{selectedPatient.gender}</span>}
              </div>
            </div>
            <button
              onClick={clearPatient}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-600 hover:border-red-400 hover:text-red-500"
            >
              Clear ×
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              value={patientQuery}
              onChange={function (e) { searchPatients(e.target.value) }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-8 text-sm focus:border-orange-500 focus:outline-none"
              placeholder="Type UHID, name, or phone number to search…"
            />
            <span className="absolute right-3 top-3 text-gray-400 text-sm">{patientSearching ? '⟳' : '🔍'}</span>
            {patientResults.length > 0 && (
              <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                {patientResults.map(function (p: any) {
                  return (
                    <button
                      key={p.patient_id || p.id}
                      onClick={function () { pickPatient(p) }}
                      className="block w-full border-b border-gray-100 px-4 py-2.5 text-left text-sm last:border-0 hover:bg-orange-50"
                    >
                      <span className="font-semibold text-gray-900">{p.name || p.patient_name}</span>
                      <span className="ml-2 text-xs text-gray-500">{p.uhid || p.patient_uhid}</span>
                      {(p.phone || p.mobile) && <span className="ml-2 text-xs text-gray-400">{p.phone || p.mobile}</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty state — no patient selected */}
      {!selectedPatient && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <div className="mb-2 text-3xl">🏷</div>
          <div className="text-sm font-semibold text-gray-600">Search a patient to print their UHID barcode labels</div>
          <div className="mt-1 text-xs text-gray-400">UHID barcodes are assigned at patient registration</div>
        </div>
      )}

      {/* Label options + preview — only when patient selected */}
      {selectedPatient && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
          {/* Settings */}
          <div className="space-y-5">
            {/* Size selector */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Label size</div>
              <div className="grid grid-cols-2 gap-2">
                {labelKeys.map(function (k) {
                  var d = LABEL_SIZES[k]
                  var active = selectedSize === k
                  return (
                    <button
                      key={k}
                      onClick={function () { setSelectedSize(k) }}
                      className={
                        'rounded-lg border p-2.5 text-left transition-colors ' +
                        (active ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-orange-300')
                      }
                    >
                      <div className={'text-xs font-bold ' + (active ? 'text-orange-700' : 'text-gray-800')}>
                        {d.label}
                        {d.default && <span className="ml-1 text-[9px] font-normal text-orange-500">★ default</span>}
                      </div>
                      <div className="text-[10px] text-gray-500">{d.wMm}×{d.hMm}mm</div>
                      <div className="text-[10px] text-gray-400">{d.desc}</div>
                    </button>
                  )
                })}
              </div>
              {selectedSize === 'custom' && (
                <div className="mt-3 flex gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">Width (mm)</label>
                    <input type="number" value={customW} onChange={function (e) { setCustomW(Number(e.target.value)) }}
                      min={10} max={200} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" />
                  </div>
                  <div className="flex-1">
                    <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">Height (mm)</label>
                    <input type="number" value={customH} onChange={function (e) { setCustomH(Number(e.target.value)) }}
                      min={10} max={300} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" />
                  </div>
                </div>
              )}
            </div>

            {/* Layout */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Labels per A4 sheet</div>
              <div className="flex flex-wrap gap-2">
                {LAYOUTS.map(function (n) {
                  var active = perSheet === n
                  return (
                    <button key={n} onClick={function () { setPerSheet(n) }}
                      className={'rounded-lg border px-3 py-1.5 text-sm font-semibold ' + (active ? 'border-orange-500 bg-orange-500 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-orange-400')}>
                      {n}{n === DEFAULT_LAYOUT ? '★' : ''}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quantity */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Quantity</div>
              <input type="number" value={quantity}
                onChange={function (e) { setQuantity(Math.max(1, Number(e.target.value))) }}
                min={1} max={1000} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" />
              <div className="mt-2 flex justify-between text-xs text-gray-500">
                <span>{quantity} labels</span>
                <span className="font-semibold text-gray-800">{sheets} sheet{sheets !== 1 ? 's' : ''} needed</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={handlePrint}
                className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white hover:bg-orange-600">
                🖨 Print labels
              </button>
              <button onClick={handlePdfDownload}
                className="flex-1 rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-700 hover:border-gray-400">
                ⬇ Download PDF
              </button>
            </div>
          </div>

          {/* Sheet preview */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Sheet preview — {selectedPatient.name}</span>
              <span className="text-xs text-gray-400">{perSheet} per sheet · {sheets} sheet{sheets !== 1 ? 's' : ''}</span>
            </div>
            <div ref={previewRef} className="overflow-auto rounded-xl border border-gray-200 bg-gray-100 p-4" style={{ maxHeight: '70vh' }}>
              {Array.from({ length: sheets }).map(function (_, sheetIdx) {
                return (
                  <div key={sheetIdx} className="mb-4 bg-white shadow">
                    <div style={{ aspectRatio: '210 / 297', padding: '8px', display: 'grid', gap: '4px',
                      gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(perSheet))}, 1fr)` }}>
                      {Array.from({ length: perSheet }).map(function (_, cellIdx) {
                        var labelNum = sheetIdx * perSheet + cellIdx + 1
                        var isUsed = labelNum <= quantity
                        return (
                          <div key={cellIdx} className={'flex items-center justify-center ' + (isUsed ? '' : 'opacity-20')}>
                            {selectedPatient && <BarcodeLabel patient={selectedPatient} size={selectedSize} customW={customW} customH={customH} scale={0.45} />}
                          </div>
                        )
                      })}
                    </div>
                    <div className="border-t border-gray-100 px-3 py-1.5 text-[10px] text-gray-400">
                      Sheet {sheetIdx + 1} of {sheets} · {selectedPatient?.uhid}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab 2: Bill Print Formats ─────────────────────────────────────────────────

function BillFormatsTab({ cc }: { cc: CountryCode }) {
  var [selectedFormat, setSelectedFormat] = useState('standard')
  var [paperSize, setPaperSize]           = useState('a4')
  var [copies, setCopies]                 = useState(2)
  var billPreviewRef = useRef<HTMLDivElement>(null)

  function printBill() {
    if (!billPreviewRef.current) return
    var inner = billPreviewRef.current.innerHTML
    var styles = Array.from(document.styleSheets).map(function(ss) {
      try { return Array.from(ss.cssRules).map(function(r) { return r.cssText; }).join('') }
      catch { return '' }
    }).join('')
    var win = window.open('', '_blank', 'width=900,height=1200')
    if (!win) return
    win.document.write('<!DOCTYPE html><html><head><title>Bill</title><style>' + styles + '@page{margin:10mm;}@media print{body{margin:0;}}</style></head><body>' + inner + '</body></html>')
    win.document.close()
    win.focus()
    var winRef = win
    setTimeout(function() { winRef.print(); winRef.close(); }, 1000)
  }

  async function downloadBillPdf() {
    if (!billPreviewRef.current) return
    try {
      var html2canvas = (await import('html2canvas')).default
      var jsPDF = (await import('jspdf')).default
      var canvas = await html2canvas(billPreviewRef.current, { scale: 2, useCORS: true })
      var img = canvas.toDataURL('image/png')
      var pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      var pW = pdf.internal.pageSize.getWidth()
      var pH = pdf.internal.pageSize.getHeight()
      ;(pdf as any).addImage(img, 'PNG', 0, 0, pW, pH)
      pdf.save('bill.pdf')
    } catch (e) {
      printBill()
      alert('Tip: In the print dialog, choose "Save as PDF" to download.')
    }
  }

  var componentMap: Record<string, any> = {
    standard:  PrintStandardInvoice,
    detailed:  PrintStandardInvoice,
    b2b:       PrintB2BInvoice,
    receipt:   PrintReceipt,
    thermal:   PrintReceipt,
    discharge: null,
    einvoice:  PrintEInvoiceIRN,
    scheme:    PrintSchemeInvoice,
    superbill: PrintStandardInvoice,
  }

  var PrintComponent = componentMap[selectedFormat]
  var visibleFormats = BILL_FORMATS.filter(function (f) { return f.countries.includes(cc) })

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
      {/* Settings */}
      <div className="space-y-5">
        {/* Format cards */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Format</div>
          <div className="space-y-1.5">
            {visibleFormats.map(function (f) {
              var active = selectedFormat === f.key
              return (
                <button
                  key={f.key}
                  onClick={function () { setSelectedFormat(f.key) }}
                  className={
                    'block w-full rounded-lg border px-3 py-2.5 text-left transition-colors ' +
                    (active ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-orange-300')
                  }
                >
                  <div className={'text-xs font-semibold ' + (active ? 'text-orange-700' : 'text-gray-800')}>
                    {f.label}
                  </div>
                  <div className="text-[10px] text-gray-500">{f.desc}</div>
                  {f.warn && <div className="mt-0.5 text-[10px] text-amber-600">⚠ {f.warn}</div>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Paper size */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Paper size</div>
          <div className="flex flex-wrap gap-2">
            {PAPER_SIZES.map(function (p) {
              var active = paperSize === p.key
              return (
                <button
                  key={p.key}
                  onClick={function () { setPaperSize(p.key) }}
                  className={
                    'rounded-lg border px-3 py-1.5 text-xs font-medium ' +
                    (active ? 'border-orange-500 bg-orange-500 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-orange-400')
                  }
                >
                  {p.label}
                </button>
              )
            })}
          </div>
          <div className="mt-2 text-[11px] text-gray-400">
            A4 for tax invoices · A5 compact · 80mm for receipt printers
          </div>
        </div>

        {/* Copies */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-500">Copies</div>
          <input
            type="number"
            value={copies}
            onChange={function (e) { setCopies(Math.max(1, Number(e.target.value))) }}
            min={1} max={10}
            className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          />
          <div className="mt-1.5 text-[11px] text-gray-400">Default: 2 (patient copy + hospital file)</div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={printBill}
            className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white hover:bg-orange-600"
          >
            🖨 Print {copies} cop{copies !== 1 ? 'ies' : 'y'}
          </button>
          <button
            onClick={downloadBillPdf}
            className="flex-1 rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-700 hover:border-gray-400"
          >
            ⬇ PDF
          </button>
        </div>
      </div>

      {/* Live preview */}
      <div>
        <div className="mb-3 flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Preview</span>
          <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] text-orange-600">
            {paperSize.toUpperCase()} · {cc}
          </span>
        </div>
        <div ref={billPreviewRef} id="bill-print-preview-area" className="overflow-auto rounded-xl border border-gray-200 bg-gray-200 p-5" style={{ maxHeight: '70vh' }}>
          <Suspense fallback={<div className="py-16 text-center text-sm text-gray-400">Loading preview…</div>}>
            {PrintComponent ? (
              <PrintComponent
                bill={DEMO_BILL}
                prefs={null}
                countryCode={cc}
                size={paperSize === 'letter' || paperSize === 'half' ? 'a4' : paperSize as 'a4' | 'a5' | 'thermal'}
              />
            ) : (
              <div className="rounded-xl bg-white p-12 text-center">
                <div className="mb-2 text-2xl">🚧</div>
                <div className="text-sm font-medium text-gray-600">Preview coming soon</div>
                <div className="mt-1 text-xs text-gray-400">
                  {visibleFormats.find(function (f) { return f.key === selectedFormat })?.label} format
                </div>
              </div>
            )}
          </Suspense>
        </div>
      </div>
    </div>
  )
}

// ── Tab 3: PDF Export ─────────────────────────────────────────────────────────

function PdfExportTab({ cc }: { cc: CountryCode }) {
  var [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(function () {
    var init: Record<string, boolean> = {}
    PDF_CONTENT_ITEMS.forEach(function (item) { init[item.id] = item.default })
    return init
  })
  var [pageSize, setPageSize]           = useState('a4')
  var [orientation, setOrientation]     = useState<'portrait' | 'landscape'>('portrait')
  var [watermark, setWatermark]         = useState('None')
  var [password, setPassword]           = useState('None')
  var [fontSize, setFontSize]           = useState('Normal (10pt)')
  var [generating, setGenerating]       = useState(false)

  function toggleItem(id: string) {
    setCheckedItems(function (prev) {
      return Object.assign({}, prev, { [id]: !prev[id] })
    })
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      var jsPDF = (await import('jspdf')).default
      var selectedPaper = PAPER_SIZES.find(function (p) { return p.key === pageSize }) || PAPER_SIZES[0]
      var pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: [selectedPaper.w, selectedPaper.h],
      })
      pdf.setFontSize(10)
      pdf.text('MediHost Clinic', 15, 20)
      pdf.text('Bill PDF Export', 15, 28)
      pdf.text('Generated: ' + new Date().toLocaleString(), 15, 36)
      var yPos = 50
      PDF_CONTENT_ITEMS.forEach(function (item) {
        if (checkedItems[item.id]) {
          pdf.text('✓ ' + item.label, 15, yPos)
          yPos += 7
        }
      })
      if (watermark !== 'None') {
        pdf.setFontSize(40)
        pdf.setTextColor(200, 200, 200)
        pdf.text(watermark, 50, 150, { angle: 45 })
      }
      pdf.save('bill-export.pdf')
    } catch (e) {
      alert('PDF generation error: ' + e)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Content selector */}
      <div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Content to include</div>
          <div className="space-y-2.5">
            {PDF_CONTENT_ITEMS.map(function (item) {
              var checked = checkedItems[item.id]
              return (
                <label key={item.id} className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={function () { toggleItem(item.id) }}
                    className="mt-0.5 h-4 w-4 accent-orange-500"
                  />
                  <span className={'text-sm ' + (checked ? 'text-gray-900' : 'text-gray-400')}>
                    {item.label}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      </div>

      {/* Settings + Delivery */}
      <div className="space-y-5">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Settings</div>
          <div className="space-y-4">
            {/* Page size */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Page size</label>
              <select
                value={pageSize}
                onChange={function (e) { setPageSize(e.target.value) }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                {PAPER_SIZES.map(function (p) {
                  return <option key={p.key} value={p.key}>{p.label}</option>
                })}
              </select>
            </div>

            {/* Orientation */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Orientation</label>
              <div className="flex gap-2">
                {(['portrait', 'landscape'] as const).map(function (o) {
                  return (
                    <button
                      key={o}
                      onClick={function () { setOrientation(o) }}
                      className={
                        'flex-1 rounded-lg border py-2 text-sm capitalize ' +
                        (orientation === o ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400')
                      }
                    >
                      {o}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Watermark */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Watermark</label>
              <select
                value={watermark}
                onChange={function (e) { setWatermark(e.target.value) }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                {WATERMARKS.map(function (w) { return <option key={w}>{w}</option> })}
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Password protect</label>
              <select
                value={password}
                onChange={function (e) { setPassword(e.target.value) }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                {PASSWORD_OPTS.map(function (p) { return <option key={p}>{p}</option> })}
              </select>
            </div>

            {/* Font size */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Font size</label>
              <select
                value={fontSize}
                onChange={function (e) { setFontSize(e.target.value) }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                {FONT_SIZES.map(function (f) { return <option key={f}>{f}</option> })}
              </select>
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Delivery</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '⬇', label: 'Download', primary: true },
              { icon: '💬', label: 'WhatsApp', primary: false },
              { icon: '✉️', label: 'Email',    primary: false },
              { icon: '🗂',  label: 'Save to patient record', primary: false },
            ].map(function (d) {
              return (
                <button
                  key={d.label}
                  onClick={d.primary ? handleGenerate : undefined}
                  disabled={generating && d.primary}
                  className={
                    'rounded-lg border py-2.5 text-sm font-medium ' +
                    (d.primary
                      ? 'border-orange-500 bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400')
                  }
                >
                  {d.icon} {generating && d.primary ? 'Generating…' : d.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full rounded-xl bg-gray-900 py-3.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {generating ? '⏳ Generating PDF…' : '⬇ Generate PDF'}
        </button>
      </div>
    </div>
  )
}
