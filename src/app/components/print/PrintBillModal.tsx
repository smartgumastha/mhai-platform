'use client'
import { useState, useEffect, lazy, Suspense } from 'react'
import dynamic from 'next/dynamic'
import type { Bill, PrintPrefs, PaperSize, CountryCode } from '@/app/components/print/lib'

var Barcode = dynamic<{
  value: string; format?: string; width?: number; height?: number;
  displayValue?: boolean; margin?: number; background?: string; lineColor?: string;
}>(() => import('react-barcode') as any, { ssr: false })

type FormatKey = 'standard' | 'b2b' | 'einvoice' | 'scheme' | 'receipt'

type FormatDef = { key: FormatKey; label: string; desc: string; countries: string[]; star?: boolean; warn?: string }

var ALL_FORMATS: FormatDef[] = [
  { key: 'standard', label: 'Standard Invoice',    desc: 'All countries · tax invoice',         countries: ['IN','US','GB','AE'], star: true },
  { key: 'b2b',      label: 'Insurance / TPA',      desc: 'B2B · insurer · IN/AE',               countries: ['IN','AE'] },
  { key: 'receipt',  label: 'Receipt Only',          desc: 'Post-payment · all countries',        countries: ['IN','US','GB','AE'] },
  { key: 'scheme',   label: 'PMJAY / Govt Scheme',   desc: 'PM-JAY · CGHS · ESI · IN only',       countries: ['IN'] },
  { key: 'einvoice', label: 'e-Invoice IRN',          desc: 'GSTN-signed · > ₹5 Cr · IN only',    countries: ['IN'], warn: 'Requires GSTN registration' },
]

var PAPER_SIZES: { key: PaperSize; label: string }[] = [
  { key: 'a4',      label: 'A4' },
  { key: 'a5',      label: 'A5' },
  { key: 'thermal', label: '80mm Thermal' },
]

var PrintStandardInvoice = lazy(() => import('@/app/components/print/PrintStandardInvoice'))
var PrintB2BInvoice      = lazy(() => import('@/app/components/print/PrintB2BInvoice'))
var PrintEInvoiceIRN     = lazy(() => import('@/app/components/print/PrintEInvoiceIRN'))
var PrintSchemeInvoice   = lazy(() => import('@/app/components/print/PrintSchemeInvoice'))
var PrintReceipt         = lazy(() => import('@/app/components/print/PrintReceipt'))

type Props = {
  open: boolean
  onClose: () => void
  bill: Bill
  prefs?: PrintPrefs | null
  countryCode: CountryCode
  onSetDefault?: (format: FormatKey, size: PaperSize) => void
}

export default function PrintBillModal({ open, onClose, bill, prefs, countryCode, onSetDefault }: Props) {
  var [format, setFormat] = useState<FormatKey>('standard')
  var [size, setSize]     = useState<PaperSize>('a4')
  var [setDefault, setSetDefault] = useState(false)

  useEffect(function () {
    if (!open || !prefs) return
    var f = (prefs.user_preferences?.default_print_format ||
      (prefs.clinic_preferences as any)?.clinic_default_print_format || 'standard') as FormatKey
    var s = (prefs.user_preferences?.default_paper_size ||
      (prefs.clinic_preferences as any)?.paper_size_per_format?.[f] || 'a4') as PaperSize
    setFormat(f)
    setSize(s)
  }, [open, prefs])

  if (!open) return null

  var uhid = (bill as any).uhid || (bill as any).patient_uhid || bill.bill_number || 'UHID0000001'
  var isFinal = (bill as any).bill_status === 'FINAL' || (bill as any).payment_status === 'paid'
  var formats = ALL_FORMATS.filter(function (f) { return f.countries.includes(countryCode) })

  var componentMap: Record<FormatKey, any> = {
    standard: PrintStandardInvoice,
    b2b:      PrintB2BInvoice,
    einvoice: PrintEInvoiceIRN,
    scheme:   PrintSchemeInvoice,
    receipt:  PrintReceipt,
  }
  var PrintComponent = componentMap[format]
  var activeFormat = formats.find(function (f) { return f.key === format })

  function handlePrint() {
    if (setDefault && typeof onSetDefault === 'function') onSetDefault(format, size)
    if (typeof window !== 'undefined') window.print()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="grid max-h-[92vh] w-full max-w-[1160px] grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-2xl md:grid-cols-[300px_1fr]">

        {/* Left rail */}
        <div className="overflow-y-auto border-r border-gray-200 bg-gray-50 px-5 py-6">
          <h3 className="mb-1 text-base font-semibold text-gray-900">Print format</h3>
          <p className="mb-4 text-xs text-gray-500">Pick a format and paper size, then print.</p>

          <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Format</div>
          <div className="mb-4 space-y-1">
            {formats.map(function (f) {
              var active = format === f.key
              return (
                <button
                  key={f.key}
                  onClick={function () { setFormat(f.key) }}
                  className={
                    'block w-full rounded-lg border px-3 py-2.5 text-left transition-colors ' +
                    (active
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 bg-white hover:border-orange-400')
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span className={'text-xs font-semibold ' + (active ? 'text-orange-700' : 'text-gray-800')}>
                      {f.label}
                    </span>
                    {f.star && <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white">DEFAULT</span>}
                  </div>
                  <div className="mt-0.5 text-[11px] text-gray-500">{f.desc}</div>
                  {f.warn && (
                    <div className="mt-1 text-[10px] font-medium text-amber-600">⚠ {f.warn}</div>
                  )}
                </button>
              )
            })}
          </div>

          <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Paper size</div>
          <div className="mb-4 flex overflow-hidden rounded-lg border border-gray-200 bg-white">
            {PAPER_SIZES.map(function (p) {
              var active = size === p.key
              return (
                <button
                  key={p.key}
                  onClick={function () { setSize(p.key) }}
                  className={
                    'flex-1 py-2 text-xs font-medium transition-colors ' +
                    (active ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50')
                  }
                >
                  {p.label}
                </button>
              )
            })}
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 hover:border-orange-400">
            <input
              type="checkbox"
              checked={setDefault}
              onChange={function (e) { setSetDefault(e.target.checked) }}
              className="h-4 w-4 accent-orange-500"
            />
            <span className="text-xs text-gray-600">
              Set <strong className="text-orange-600">{format} · {size.toUpperCase()}</strong> as default
            </span>
          </label>
        </div>

        {/* Right preview */}
        <div className="flex flex-col overflow-hidden">
          {/* Preview header */}
          <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {activeFormat ? activeFormat.label : format}
              </div>
              <div className="text-[11px] text-gray-500">
                {size.toUpperCase()} · {countryCode} · {isFinal ? 'FINAL' : 'DRAFT'}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 hover:border-gray-400"
            >
              ✕ Close
            </button>
          </div>

          {/* UHID barcode strip */}
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 bg-gray-50 px-5 py-2.5">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">UHID Barcode</span>
            <Barcode
              value={uhid}
              format="CODE128"
              width={1}
              height={28}
              displayValue={true}
              margin={0}
              background="#f9fafb"
              lineColor="#111"
            />
          </div>

          {/* Bill preview */}
          <div className="flex flex-1 items-start justify-center overflow-y-auto bg-gray-200 p-5">
            <Suspense fallback={<div className="py-10 text-sm text-gray-500">Loading preview…</div>}>
              {PrintComponent ? (
                <PrintComponent bill={bill} prefs={prefs} countryCode={countryCode} size={size} />
              ) : (
                <div className="rounded-lg border border-gray-200 bg-white p-10 text-sm text-gray-400">
                  Preview not available.
                </div>
              )}
            </Suspense>
          </div>

          {/* QR notice for non-final bills */}
          {!isFinal && (
            <div className="border-t border-amber-100 bg-amber-50 px-5 py-2 text-[11px] text-amber-700">
              QR verification code appears on FINAL bills only.
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-white px-5 py-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 hover:border-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="rounded-lg bg-orange-500 px-5 py-2 text-xs font-semibold text-white hover:bg-orange-600"
            >
              🖨 Print this
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
