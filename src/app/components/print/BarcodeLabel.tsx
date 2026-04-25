'use client'
import dynamic from 'next/dynamic'

var Barcode = dynamic<{
  value: string; format?: string; width?: number; height?: number;
  displayValue?: boolean; margin?: number; background?: string; lineColor?: string;
}>(() => import('react-barcode') as any, { ssr: false, loading: () => <div style={{ height: 36, background: '#f3f4f6' }} /> })

export type LabelSize = '1x0.5' | '2x1' | '2.5x1' | '3x1' | '1x1' | '4x6' | 'infant' | 'custom'

export type LabelPatient = {
  uhid: string
  name: string
  age?: string
  gender?: string
  doctor?: string
  ward?: string
  hospitalName?: string
}

export var LABEL_SIZES: Record<LabelSize, { wMm: number; hMm: number; label: string; desc: string; default?: boolean }> = {
  '1x0.5':  { wMm: 25,  hMm: 13,  label: '1×0.5"',  desc: 'Specimen / Blood tube' },
  '2x1':    { wMm: 50,  hMm: 25,  label: '2×1"',     desc: 'Standard chart label', default: true },
  '2.5x1':  { wMm: 63,  hMm: 25,  label: '2.5×1"',   desc: 'Epic / Cerner standard' },
  '3x1':    { wMm: 76,  hMm: 25,  label: '3×1"',      desc: 'Patient wristband IPD' },
  '1x1':    { wMm: 25,  hMm: 25,  label: '1×1"',      desc: 'Pharmacy bottle' },
  '4x6':    { wMm: 101, hMm: 152, label: '4×6"',      desc: 'Admission form' },
  'infant': { wMm: 11,  hMm: 280, label: 'Infant',    desc: 'NICU wristband' },
  'custom': { wMm: 50,  hMm: 25,  label: 'Custom',    desc: 'Enter dimensions' },
}

var PX_PER_MM = 3.78

type Props = {
  patient: LabelPatient
  size: LabelSize
  customW?: number
  customH?: number
  scale?: number
}

export default function BarcodeLabel({ patient, size, customW, customH, scale = 1 }: Props) {
  var dims = LABEL_SIZES[size]
  var wMm = size === 'custom' ? (customW || 50) : dims.wMm
  var hMm = size === 'custom' ? (customH || 25) : dims.hMm
  var wPx = Math.round(wMm * PX_PER_MM * scale)
  var hPx = Math.round(hMm * PX_PER_MM * scale)
  var isSmall = hMm <= 13
  var isTall = hMm > 50
  var isNarrow = wMm < 20
  var barH = Math.max(10, (hMm - (isSmall ? 2 : isTall ? 60 : 8)) * PX_PER_MM * scale)
  var fs = Math.max(5, Math.round(scale * (isSmall ? 5 : 7)))

  return (
    <div
      style={{
        width: wPx, height: hPx,
        border: '1px solid #d1d5db', background: '#fff',
        display: 'flex',
        flexDirection: isTall || isNarrow ? 'column' : 'row',
        alignItems: isTall ? 'center' : 'center',
        justifyContent: isTall ? 'flex-start' : 'center',
        padding: Math.max(1, Math.round(scale * 2)),
        gap: Math.max(1, Math.round(scale)),
        overflow: 'hidden', boxSizing: 'border-box',
      }}
    >
      <div style={{ flexShrink: 0, lineHeight: 0 }}>
        <Barcode
          value={patient.uhid || 'UHID0000001'}
          format="CODE128"
          width={Math.max(0.6, scale * 0.8)}
          height={barH}
          displayValue={false}
          margin={0}
          background="#ffffff"
          lineColor="#111111"
        />
      </div>
      {!isSmall && !isNarrow && (
        <div style={{ flex: 1, minWidth: 0, fontFamily: 'monospace' }}>
          <div style={{ fontWeight: 700, fontSize: fs + 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {patient.name || 'PATIENT NAME'}
          </div>
          <div style={{ color: '#555', fontSize: fs, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {patient.uhid}
            {(patient.age || patient.gender) ? (' · ' + [patient.age, patient.gender].filter(Boolean).join('/')) : ''}
          </div>
          {(patient.ward || patient.doctor) && (
            <div style={{ color: '#777', fontSize: fs, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {[patient.ward, patient.doctor].filter(Boolean).join(' · ')}
            </div>
          )}
          {isTall && patient.hospitalName && (
            <div style={{ color: '#999', fontSize: fs, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {patient.hospitalName}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
