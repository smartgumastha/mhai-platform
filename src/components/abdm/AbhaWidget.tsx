'use client'
// ABHA Widget — ABDM M1 (Create) + M2 (Link/Verify) flows
// OTP state machine: idle → mode_select → otp_sent → verified → linked

import { useState } from 'react'
import { getToken } from '@/lib/api'

export interface AbhaProfile {
  abhaNumber: string       // 14-digit XX-XXXX-XXXX-XXXX
  abhaAddress: string      // name@abdm
  name: string
  dateOfBirth: string      // YYYY-MM-DD
  gender: 'M' | 'F' | 'O'
  mobile: string
  email?: string
  address?: string
  state?: string
  district?: string
  pincode?: string
  photo?: string           // base64 profile pic
}

interface Props {
  countryCode: string
  onLinked: (profile: AbhaProfile) => void
  onSkip?: () => void
  existingAbhaId?: string
}

type Step =
  | { t: 'idle' }
  | { t: 'mode' }
  | { t: 'aadhaar_input' }
  | { t: 'mobile_input'; forCreate?: boolean }
  | { t: 'otp'; mode: 'aadhaar' | 'mobile_create' | 'link'; txnId: string; maskedMobile?: string }
  | { t: 'mobile_otp'; txnId: string; maskedMobile: string }
  | { t: 'linked'; profile: AbhaProfile }
  | { t: 'error'; msg: string }

async function post(url: string, body: object) {
  var token = getToken()
  var res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

export default function AbhaWidget({ countryCode, onLinked, onSkip, existingAbhaId }: Props) {
  var [step, setStep] = useState<Step>({ t: 'idle' })
  var [aadhaar, setAadhaar] = useState('')
  var [mobile, setMobile] = useState('')
  var [abhaNum, setAbhaNum] = useState(existingAbhaId || '')
  var [otp, setOtp] = useState('')
  var [busy, setBusy] = useState(false)
  var [err, setErr] = useState('')

  if (countryCode !== 'IN') return null

  function reset() { setStep({ t: 'idle' }); setErr(''); setOtp(''); setAadhaar(''); setMobile('') }

  // ── AADHAAR OTP ──────────────────────────────────────────
  async function sendAadhaarOtp() {
    if (!/^\d{12}$/.test(aadhaar)) { setErr('Enter valid 12-digit Aadhaar number'); return }
    setBusy(true); setErr('')
    try {
      var d = await post('/api/abdm/abha/aadhaar/generate-otp', { aadhaar })
      if (d.txnId) {
        setStep({ t: 'otp', mode: 'aadhaar', txnId: d.txnId, maskedMobile: d.mobileNumber })
      } else {
        setErr(d.error || d.message || 'Failed to send OTP')
      }
    } catch { setErr('Network error — please retry') }
    setBusy(false)
  }

  // ── AADHAAR OTP VERIFY → then create ABHA ────────────────
  async function verifyAadhaarOtp(txnId: string) {
    if (!otp || otp.length !== 6) { setErr('Enter 6-digit OTP'); return }
    setBusy(true); setErr('')
    try {
      var d = await post('/api/abdm/abha/aadhaar/verify-otp', { otp, txnId })
      if (d.txnId) {
        if (d.mobileNumber) {
          // Mobile OTP required next
          setStep({ t: 'mobile_otp', txnId: d.txnId, maskedMobile: d.mobileNumber })
        } else {
          await createAbhaAadhaar(d.txnId)
        }
      } else {
        setErr(d.error || d.message || 'OTP verification failed')
      }
    } catch { setErr('Network error — please retry') }
    setOtp(''); setBusy(false)
  }

  // ── MOBILE OTP (during aadhaar create flow) ──────────────
  async function verifyMobileOtp(txnId: string) {
    if (!otp || otp.length !== 6) { setErr('Enter 6-digit OTP'); return }
    setBusy(true); setErr('')
    try {
      var d = await post('/api/abdm/abha/aadhaar/verify-mobile-otp', { otp, txnId })
      if (d.txnId) {
        await createAbhaAadhaar(d.txnId)
      } else {
        setErr(d.error || d.message || 'Mobile OTP failed')
      }
    } catch { setErr('Network error — please retry') }
    setOtp(''); setBusy(false)
  }

  async function createAbhaAadhaar(txnId: string) {
    var d = await post('/api/abdm/abha/aadhaar/create', { txnId, consent: true })
    if (d.healthIdNumber) {
      var profile: AbhaProfile = {
        abhaNumber: d.healthIdNumber,
        abhaAddress: d.healthId || '',
        name: d.name || '',
        dateOfBirth: d.dayOfBirth && d.monthOfBirth && d.yearOfBirth
          ? `${d.yearOfBirth}-${String(d.monthOfBirth).padStart(2,'0')}-${String(d.dayOfBirth).padStart(2,'0')}`
          : '',
        gender: d.gender || 'M',
        mobile: d.mobile || '',
        email: d.email || '',
        address: d.address || '',
        state: d.stateName || '',
        district: d.districtName || '',
        pincode: d.pincode || '',
        photo: d.profilePhoto || '',
      }
      setStep({ t: 'linked', profile })
    } else {
      setErr(d.error || d.message || 'ABHA creation failed')
    }
    setBusy(false)
  }

  // ── MOBILE-ONLY CREATE ────────────────────────────────────
  async function sendMobileOtpCreate() {
    if (!/^[6-9]\d{9}$/.test(mobile)) { setErr('Enter valid 10-digit mobile number'); return }
    setBusy(true); setErr('')
    try {
      var d = await post('/api/abdm/abha/mobile/generate-otp', { mobile })
      if (d.txnId) {
        setStep({ t: 'otp', mode: 'mobile_create', txnId: d.txnId, maskedMobile: mobile.replace(/(\d{2})\d{6}(\d{2})/, '$1xxxxxx$2') })
      } else {
        setErr(d.error || d.message || 'Failed to send OTP')
      }
    } catch { setErr('Network error') }
    setBusy(false)
  }

  async function verifyMobileOtpCreate(txnId: string) {
    if (!otp || otp.length !== 6) { setErr('Enter 6-digit OTP'); return }
    setBusy(true); setErr('')
    try {
      var d = await post('/api/abdm/abha/mobile/verify-otp', { otp, txnId })
      if (d.healthIdNumber) {
        var profile: AbhaProfile = {
          abhaNumber: d.healthIdNumber,
          abhaAddress: d.healthId || '',
          name: d.name || '',
          dateOfBirth: '',
          gender: 'M',
          mobile: mobile,
        }
        setStep({ t: 'linked', profile })
      } else {
        setErr(d.error || d.message || 'OTP verification failed')
      }
    } catch { setErr('Network error') }
    setOtp(''); setBusy(false)
  }

  // ── LINK EXISTING ABHA ────────────────────────────────────
  async function initLinkExisting() {
    var digits = abhaNum.replace(/-/g, '')
    if (!/^\d{14}$/.test(digits)) { setErr('Enter valid 14-digit ABHA number'); return }
    setBusy(true); setErr('')
    try {
      var d = await post('/api/abdm/abha/link/init', { abhaNumber: digits })
      if (d.txnId) {
        setStep({ t: 'otp', mode: 'link', txnId: d.txnId, maskedMobile: d.mobileNumber })
      } else {
        setErr(d.error || d.message || 'ABHA not found')
      }
    } catch { setErr('Network error') }
    setBusy(false)
  }

  async function confirmLink(txnId: string) {
    if (!otp || otp.length !== 6) { setErr('Enter 6-digit OTP'); return }
    setBusy(true); setErr('')
    try {
      var d = await post('/api/abdm/abha/link/confirm', { otp, txnId })
      if (d.healthIdNumber) {
        var profile: AbhaProfile = {
          abhaNumber: d.healthIdNumber,
          abhaAddress: d.healthId || '',
          name: d.name || '',
          dateOfBirth: d.dateOfBirth || '',
          gender: d.gender || 'M',
          mobile: d.mobile || '',
          email: d.email || '',
          address: d.address || '',
          state: d.stateName || '',
          district: d.districtName || '',
          pincode: d.pincode || '',
          photo: d.profilePhoto || '',
        }
        setStep({ t: 'linked', profile })
      } else {
        setErr(d.error || d.message || 'OTP verification failed')
      }
    } catch { setErr('Network error') }
    setOtp(''); setBusy(false)
  }

  // ── UI ────────────────────────────────────────────────────
  var inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/20 font-mono tracking-widest'
  var btnPrimary = 'w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50 transition-colors'
  var btnSecondary = 'w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors'

  // ── IDLE ──
  if (step.t === 'idle') {
    return (
      <div className="rounded-xl border border-[#e2d9f3] bg-[#faf7ff] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7c3aed]/10">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-800">ABDM / ABHA Integration</p>
            <p className="mt-0.5 text-xs text-gray-500">Link patient to Ayushman Bharat Health Account for digital health record sharing</p>
            <div className="mt-3 flex flex-col gap-2">
              <button onClick={() => setStep({ t: 'mode' })}
                className="flex items-center gap-2 rounded-lg border border-[#7c3aed]/30 bg-white px-3 py-2 text-sm font-semibold text-[#7c3aed] hover:bg-[#7c3aed]/5 transition-colors">
                <span className="text-base">🔗</span> Create / Link ABHA
              </button>
              {onSkip && (
                <button onClick={onSkip} className="text-xs text-gray-400 hover:text-gray-600 text-left px-1">
                  Skip for now (ABHA can be linked later from patient profile)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── MODE SELECT ──
  if (step.t === 'mode') {
    return (
      <div className="rounded-xl border border-[#e2d9f3] bg-[#faf7ff] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-800">How would you like to proceed?</p>
          <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600">✕ Cancel</button>
        </div>
        <button onClick={() => setStep({ t: 'aadhaar_input' })}
          className="w-full flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left hover:border-[#7c3aed]/40 hover:bg-[#7c3aed]/5 transition-colors">
          <span className="mt-0.5 text-xl">🪪</span>
          <div>
            <p className="text-sm font-bold text-gray-800">Create new ABHA via Aadhaar OTP</p>
            <p className="text-xs text-gray-500">Patient gets OTP on Aadhaar-linked mobile · Recommended</p>
          </div>
        </button>
        <button onClick={() => setStep({ t: 'mobile_input', forCreate: true })}
          className="w-full flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left hover:border-[#7c3aed]/40 hover:bg-[#7c3aed]/5 transition-colors">
          <span className="mt-0.5 text-xl">📱</span>
          <div>
            <p className="text-sm font-bold text-gray-800">Create new ABHA via Mobile OTP</p>
            <p className="text-xs text-gray-500">For patients without Aadhaar linkage</p>
          </div>
        </button>
        <button onClick={() => { setAbhaNum(existingAbhaId || ''); setStep({ t: 'idle' }); setTimeout(() => setStep({ t: 'otp', mode: 'link', txnId: '' }), 0) }}
          className="w-full flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left hover:border-[#7c3aed]/40 hover:bg-[#7c3aed]/5 transition-colors"
          onClick={() => setStep({ t: 'mobile_input', forCreate: false })}>
          <span className="mt-0.5 text-xl">✅</span>
          <div>
            <p className="text-sm font-bold text-gray-800">Verify existing ABHA number</p>
            <p className="text-xs text-gray-500">Patient already has ABHA — verify ownership via OTP</p>
          </div>
        </button>
        <p className="text-[10px] text-gray-400 text-center">
          Powered by ABDM · NHA, Government of India · {' '}
          <a href="https://abha.abdm.gov.in" target="_blank" rel="noreferrer" className="underline">abha.abdm.gov.in</a>
        </p>
      </div>
    )
  }

  // ── AADHAAR INPUT ──
  if (step.t === 'aadhaar_input') {
    return (
      <div className="rounded-xl border border-[#e2d9f3] bg-[#faf7ff] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-800">🪪 Enter Aadhaar Number</p>
          <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <p className="text-xs text-gray-500">Patient will receive OTP on their Aadhaar-linked mobile number</p>
        <input
          type="text"
          inputMode="numeric"
          maxLength={12}
          placeholder="XXXX XXXX XXXX"
          value={aadhaar}
          onChange={e => { setAadhaar(e.target.value.replace(/\D/g, '')); setErr('') }}
          className={inputCls}
        />
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          🔒 Aadhaar number is encrypted end-to-end and never stored on our servers. Only used to generate OTP via ABDM.
        </div>
        {err && <p className="text-xs text-red-600">{err}</p>}
        <button onClick={sendAadhaarOtp} disabled={busy || aadhaar.length !== 12} className={btnPrimary}>
          {busy ? 'Sending OTP…' : 'Send OTP to Aadhaar-linked Mobile →'}
        </button>
        <button onClick={() => setStep({ t: 'mode' })} className={btnSecondary}>← Back</button>
      </div>
    )
  }

  // ── MOBILE INPUT (create or link) ──
  if (step.t === 'mobile_input') {
    var isLinkMode = !step.forCreate
    return (
      <div className="rounded-xl border border-[#e2d9f3] bg-[#faf7ff] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-800">
            {isLinkMode ? '✅ Enter ABHA Number to Verify' : '📱 Enter Mobile Number'}
          </p>
          <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
        </div>
        {isLinkMode ? (
          <>
            <p className="text-xs text-gray-500">Enter the patient&apos;s 14-digit ABHA number to verify ownership</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={14}
              placeholder="XX-XXXX-XXXX-XXXX"
              value={abhaNum}
              onChange={e => { setAbhaNum(e.target.value.replace(/\D/g, '')); setErr('') }}
              className={inputCls}
            />
            {err && <p className="text-xs text-red-600">{err}</p>}
            <button onClick={initLinkExisting} disabled={busy} className={btnPrimary}>
              {busy ? 'Looking up ABHA…' : 'Send OTP to ABHA-linked Mobile →'}
            </button>
          </>
        ) : (
          <>
            <p className="text-xs text-gray-500">Patient will receive OTP on this mobile to create their ABHA</p>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit mobile"
              value={mobile}
              onChange={e => { setMobile(e.target.value.replace(/\D/g, '')); setErr('') }}
              className={inputCls}
            />
            {err && <p className="text-xs text-red-600">{err}</p>}
            <button onClick={sendMobileOtpCreate} disabled={busy} className={btnPrimary}>
              {busy ? 'Sending OTP…' : 'Send OTP →'}
            </button>
          </>
        )}
        <button onClick={() => setStep({ t: 'mode' })} className={btnSecondary}>← Back</button>
      </div>
    )
  }

  // ── OTP ENTRY ──
  if (step.t === 'otp') {
    var modeLabel = step.mode === 'aadhaar' ? 'Aadhaar-linked mobile' : step.mode === 'link' ? 'ABHA-linked mobile' : 'mobile'
    return (
      <div className="rounded-xl border border-[#e2d9f3] bg-[#faf7ff] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-800">📲 Enter OTP</p>
          <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <p className="text-xs text-gray-500">
          OTP sent to {step.maskedMobile ? <strong>{step.maskedMobile}</strong> : modeLabel} · Valid for 10 minutes
        </p>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="6-digit OTP"
          value={otp}
          onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setErr('') }}
          className={inputCls + ' text-center text-lg letter-spacing-widest'}
          autoFocus
        />
        {err && <p className="text-xs text-red-600">{err}</p>}
        <button
          onClick={() => {
            if (step.mode === 'aadhaar') verifyAadhaarOtp(step.txnId)
            else if (step.mode === 'mobile_create') verifyMobileOtpCreate(step.txnId)
            else confirmLink(step.txnId)
          }}
          disabled={busy || otp.length !== 6}
          className={btnPrimary}
        >
          {busy ? 'Verifying…' : step.mode === 'link' ? 'Verify & Link ABHA' : 'Verify & Create ABHA →'}
        </button>
      </div>
    )
  }

  // ── MOBILE OTP (secondary, during aadhaar create) ──
  if (step.t === 'mobile_otp') {
    return (
      <div className="rounded-xl border border-[#e2d9f3] bg-[#faf7ff] p-4 space-y-3">
        <p className="text-sm font-bold text-gray-800">📱 Verify Mobile Number</p>
        <p className="text-xs text-gray-500">
          OTP sent to <strong>{step.maskedMobile}</strong> · Needed to complete ABHA creation
        </p>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="6-digit OTP"
          value={otp}
          onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setErr('') }}
          className={inputCls + ' text-center text-lg'}
          autoFocus
        />
        {err && <p className="text-xs text-red-600">{err}</p>}
        <button onClick={() => verifyMobileOtp(step.txnId)} disabled={busy || otp.length !== 6} className={btnPrimary}>
          {busy ? 'Creating ABHA…' : 'Verify & Create ABHA →'}
        </button>
      </div>
    )
  }

  // ── LINKED / SUCCESS ──
  if (step.t === 'linked') {
    var p = step.profile
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-start gap-3">
          {p.photo && (
            <img src={`data:image/jpeg;base64,${p.photo}`} alt="ABHA photo"
              className="h-12 w-12 rounded-full border-2 border-emerald-300 object-cover" />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-base">✅</span>
              <p className="text-sm font-bold text-emerald-800">ABHA Linked Successfully</p>
            </div>
            <p className="mt-0.5 font-mono text-xs text-emerald-700">{p.abhaNumber}</p>
            {p.abhaAddress && <p className="text-xs text-emerald-600">{p.abhaAddress}</p>}
            {p.name && <p className="text-xs text-gray-600 mt-1">{p.name}{p.dateOfBirth ? ` · DOB: ${p.dateOfBirth}` : ''}</p>}
            <p className="text-xs text-gray-500 mt-0.5">Patient demographics auto-filled from ABHA profile</p>
          </div>
        </div>
        <button
          onClick={() => onLinked(p)}
          className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
        >
          Confirm &amp; Auto-fill Patient Details
        </button>
      </div>
    )
  }

  return null
}
