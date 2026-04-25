'use client'
// /dashboard/claims — Insurance Claims Dashboard with SLA tracking
// Locale-aware: IN (NHCX FHIR R4) | AE (eClaimLink XML + HIE routing)
// Sources: MHAI Definitive Billing Field Master v1.0, DHA PD-05-2025, IRDAI mandate

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/auth-context'
import { useLocale } from '@/app/providers/locale-context'
import { useCurrency } from '@/app/hooks/useCurrency'
import { getToken } from '@/lib/api'

type ClaimStatus = 'DRAFT' | 'SUBMITTED' | 'PENDING' | 'APPROVED' | 'DENIED' | 'ESCALATED'

interface Claim {
  id: string
  bill_id: string
  patient_name: string
  patient_pid: string
  payer_name: string
  claimed_amount: number
  status: ClaimStatus
  hie_target?: string
  nhcx_request_id?: string
  nhcx_correlation_id?: string
  nhcx_stub?: boolean
  eclaim_type?: string
  preauth_breached?: boolean
  discharge_breached?: boolean
  diagnosis: string
  country_code: string
  created_at: string
}

var SLA = {
  IN: { preauth_label: 'Pre-auth (1hr IRDAI)', discharge_label: 'Discharge (3hr)', payment_label: 'Payment (30d)' },
  AE: { preauth_label: 'Pre-auth (1hr DHA)', discharge_label: 'OP Auth (6hr)', payment_label: 'Settlement (45d)' },
  GB: { preauth_label: 'Pre-auth (48hr)', discharge_label: 'Auth (48hr)', payment_label: 'Payment (30d)' },
  US: { preauth_label: 'Pre-auth (72hr)', discharge_label: 'Auth (72hr)', payment_label: 'Payment (30d)' },
}

function StatusBadge({ status }: { status: ClaimStatus }) {
  var colors: Record<ClaimStatus, string> = {
    DRAFT: 'bg-purple-50 text-purple-700 border border-purple-200',
    SUBMITTED: 'bg-blue-50 text-blue-700 border border-blue-200',
    PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    DENIED: 'bg-rose-50 text-rose-700 border border-rose-200',
    ESCALATED: 'bg-pink-50 text-pink-700 border border-pink-200',
  }
  var labels: Record<ClaimStatus, string> = {
    DRAFT: 'Draft', SUBMITTED: '→ Submitted', PENDING: '⏳ Pending',
    APPROVED: '✓ Approved', DENIED: '✕ Denied', ESCALATED: '↑ Escalated',
  }
  return (
    <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${colors[status]}`}>
      {labels[status]}
    </span>
  )
}

function HIEBadge({ claim }: { claim: Claim }) {
  if (claim.country_code !== 'AE') {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">NHCX</span>
        {claim.nhcx_stub && <span className="text-xs font-mono px-1 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">stub</span>}
      </span>
    )
  }
  var hieColor: Record<string, string> = {
    NABIDH: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Malaffi: 'bg-purple-50 text-purple-700 border border-purple-200',
    Riayati: 'bg-pink-50 text-pink-700 border border-pink-200',
    NPHIES: 'bg-blue-50 text-blue-700 border border-blue-200',
  }
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">eClaimLink</span>
      {claim.hie_target && (
        <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${hieColor[claim.hie_target] || 'bg-paper-soft text-text-dim border border-line'}`}>
          {claim.hie_target}
        </span>
      )}
    </span>
  )
}

function SLABar({ label, pct, breached }: { label: string; pct: number; breached?: boolean }) {
  var color = breached ? 'bg-rose-500' : pct < 20 ? 'bg-rose-400' : pct < 50 ? 'bg-amber-400' : 'bg-emerald-500'
  var textColor = breached ? 'text-rose-600' : pct < 20 ? 'text-rose-500' : pct < 50 ? 'text-amber-600' : 'text-emerald-700'
  return (
    <div className="flex items-center gap-2 min-w-[200px]">
      <span className="text-xs text-text-muted w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-line rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(4, pct)}%` }} />
      </div>
      <span className={`text-xs font-mono font-bold w-16 text-right ${textColor}`}>
        {breached ? 'BREACHED' : `${pct}%`}
      </span>
    </div>
  )
}

export default function ClaimsDashboardPage() {
  var { user } = useAuth()
  var { localeV2 } = useLocale()
  var { format: fmt } = useCurrency()
  var router = useRouter()
  var cc = (localeV2?.country_code || 'IN') as keyof typeof SLA
  var sla = SLA[cc] || SLA.IN
  var hospitalId = user?.hospital_id

  var [claims, setClaims] = useState<Claim[]>([])
  var [loading, setLoading] = useState(true)
  var [filter, setFilter] = useState<'ALL' | ClaimStatus | 'BREACHED'>('ALL')
  var [selected, setSelected] = useState<Claim | null>(null)
  var [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, breached: 0, incentive: 0 })

  var loadClaims = useCallback(async () => {
    if (!hospitalId) return
    setLoading(true)
    try {
      var token = getToken()
      var res = await fetch(`/api/hospitals/${hospitalId}/rcm/billing/claims?limit=50`, {
        headers: token ? { Authorization: 'Bearer ' + token } : {}
      })
      var data = await res.json()
      var list: Claim[] = data.claims || []
      setClaims(list)
      setStats({
        total: list.length,
        approved: list.filter(c => c.status === 'APPROVED').length,
        pending: list.filter(c => c.status === 'PENDING').length,
        breached: list.filter(c => c.preauth_breached || c.discharge_breached).length,
        incentive: cc === 'IN' ? list.length * 500 : 0,
      })
    } catch { setClaims([]) } finally { setLoading(false) }
  }, [hospitalId, cc])

  useEffect(() => { loadClaims() }, [loadClaims])

  var shown = filter === 'ALL' ? claims
    : filter === 'BREACHED' ? claims.filter(c => c.preauth_breached || c.discharge_breached)
    : claims.filter(c => c.status === filter)

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* SLA breach banner */}
        {stats.breached > 0 && (
          <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl mb-5">
            <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center text-base flex-shrink-0">⚠</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-rose-700">{stats.breached} claim{stats.breached > 1 ? 's have' : ' has'} breached SLA — immediate action required</p>
              <p className="text-xs text-text-dim">
                {cc === 'IN' ? 'IRDAI mandates cashless processing within 3 hours of discharge. Penalty: insurer owes 0.5% extra per day of delay.'
                  : cc === 'AE' ? 'DHA PD-05-2025: 0.03% delay fee per day on net claimed amount. Pre-auth must be submitted within 1 hour of physician order.'
                  : 'SLA breached — check payer agreement for penalty terms.'}
              </p>
            </div>
            <button onClick={() => setFilter('BREACHED')} className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold">View</button>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-fraunces text-3xl font-light">Insurance <em className="italic text-coral-deep">Claims</em></h1>
            <p className="text-sm text-text-dim mt-1">
              {cc === 'IN' ? 'NHCX FHIR R4 · 47 insurers + TPAs live · ₹500 DHIS incentive per claim'
                : cc === 'AE' ? 'DHA PD-05-2025 · Pre-auth within 1hr · Delay fee: 0.03%/day'
                : 'Insurance claims dashboard'}
            </p>
          </div>
          <button onClick={() => router.push('/dashboard/billing/opd')}
            className="flex items-center gap-2 px-4 py-2 bg-coral text-white text-sm font-semibold rounded-xl">
            + New Claim
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-5">
          {[
            { label: 'Total Claims', value: stats.total, sub: 'This month', variant: '' },
            { label: 'Approved', value: stats.approved, sub: 'Settled', variant: 'ok' },
            { label: 'SLA Breached', value: stats.breached, sub: 'Action needed', variant: 'alert' },
            { label: 'Pending', value: stats.pending, sub: 'Awaiting insurer', variant: 'warn' },
            {
              label: cc === 'IN' ? 'DHIS Incentive' : 'DHA SLA Score',
              value: cc === 'IN' ? `₹${(stats.incentive / 1000).toFixed(1)}K` : '—',
              sub: cc === 'IN' ? `${stats.total} × ₹500` : 'Track via eClaimLink',
              variant: '',
            },
          ].map(s => (
            <div key={s.label} className={`bg-white border rounded-xl p-4 ${s.variant === 'ok' ? 'border-emerald-200' : 'border-line'}`}>
              <div className="text-xs font-mono uppercase tracking-wider text-text-muted mb-1">{s.label}</div>
              <div className={`font-fraunces text-2xl font-medium ${s.variant === 'ok' ? 'text-emerald-700' : s.variant === 'alert' ? 'text-rose-600' : s.variant === 'warn' ? 'text-amber-600' : ''}`}>
                {s.value}
              </div>
              <div className="text-xs text-text-dim mt-1">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-4">
          {(['ALL', 'PENDING', 'APPROVED', 'DENIED', 'BREACHED'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filter === f ? 'bg-ink text-white border-ink' : 'bg-white text-text-dim border-line hover:border-coral'}`}>
              {f === 'BREACHED' ? '🔴 SLA Breached' : f.charAt(0) + f.slice(1).toLowerCase()}
              {f === 'PENDING' && stats.pending > 0 && ` (${stats.pending})`}
              {f === 'BREACHED' && stats.breached > 0 && ` (${stats.breached})`}
            </button>
          ))}
        </div>

        {/* Claims table */}
        <div className="bg-white border border-line rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-text-muted font-fraunces text-xl font-light">Loading claims…</div>
          ) : shown.length === 0 ? (
            <div className="p-12 text-center">
              <div className="font-fraunces text-xl font-light text-text-dim mb-2">No claims found</div>
              <p className="text-sm text-text-muted">Insurance claims will appear here when you create bills for insured patients.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-paper-soft border-b border-line">
                <tr>
                  {['Claim ID', 'Patient', 'Payer', 'Format', 'Claimed Amount', 'SLA', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider text-text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map(claim => (
                  <tr key={claim.id} className="border-b border-line-soft hover:bg-paper-soft cursor-pointer transition-colors"
                    onClick={() => setSelected(selected?.id === claim.id ? null : claim)}>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs font-semibold">{claim.id.substring(0, 16)}</div>
                      {(claim.preauth_breached || claim.discharge_breached) && (
                        <span className="text-rose-600 text-xs font-bold">⚠ SLA</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-sm">{claim.patient_name}</div>
                      <div className="text-xs font-mono text-text-muted">{claim.patient_pid}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{claim.payer_name}</td>
                    <td className="px-4 py-3"><HIEBadge claim={claim} /></td>
                    <td className="px-4 py-3">
                      <div className="font-mono font-semibold text-sm">{fmt(claim.claimed_amount)}</div>
                      <div className="text-xs text-text-muted">{claim.diagnosis?.substring(0, 25)}</div>
                    </td>
                    <td className="px-4 py-3 min-w-[220px]">
                      <div className="space-y-1">
                        <SLABar label={sla.preauth_label} pct={claim.preauth_breached ? 0 : 75} breached={claim.preauth_breached} />
                        <SLABar label={sla.discharge_label} pct={claim.discharge_breached ? 0 : 60} breached={claim.discharge_breached} />
                        <SLABar label={sla.payment_label} pct={30} />
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={claim.status} /></td>
                    <td className="px-4 py-3">
                      <button className="text-xs px-2 py-1 bg-paper-soft border border-line rounded-lg text-text-dim">View →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Slide-over detail */}
        {selected && (
          <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-ink/30" onClick={() => setSelected(null)} />
            <div className="w-[480px] bg-white shadow-xl overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-line-soft px-6 py-4 flex justify-between items-center">
                <h2 className="font-fraunces text-xl font-light">Claim <em className="italic text-coral-deep">Detail</em></h2>
                <button onClick={() => setSelected(null)} className="w-8 h-8 bg-paper-soft rounded-lg text-text-dim flex items-center justify-center">✕</button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">Overview</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['Claim ID', selected.id.substring(0, 20) + '…'],
                      ['Status', ''],
                      ['Patient', selected.patient_name],
                      ['Payer', selected.payer_name],
                      ['Amount', fmt(selected.claimed_amount)],
                      ['Diagnosis', selected.diagnosis],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div className="text-xs font-mono text-text-muted">{k}</div>
                        {k === 'Status' ? <StatusBadge status={selected!.status} /> : <div className="text-sm font-semibold">{v}</div>}
                      </div>
                    ))}
                  </div>
                </div>
                {selected.country_code === 'IN' && (
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">NHCX Identifiers</p>
                    <div className="bg-paper-soft rounded-xl p-3 space-y-2">
                      <div className="text-xs"><span className="text-text-muted">Request ID: </span><span className="font-mono">{selected.nhcx_request_id || '—'}</span></div>
                      <div className="text-xs"><span className="text-text-muted">Correlation ID: </span><span className="font-mono">{selected.nhcx_correlation_id || '—'}</span></div>
                      {selected.nhcx_stub && <div className="text-xs font-mono text-amber-600 bg-amber-50 px-2 py-1 rounded">NHCX stub mode — M1 certification pending</div>}
                    </div>
                  </div>
                )}
                {selected.country_code === 'AE' && (
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">eClaimLink Details</p>
                    <div className="bg-paper-soft rounded-xl p-3 space-y-2">
                      <div className="text-xs"><span className="text-text-muted">HIE Target: </span><span className="font-mono font-bold">{selected.hie_target}</span></div>
                      <div className="text-xs"><span className="text-text-muted">Claim Type: </span><span className="font-mono">{selected.eclaim_type === 'I' ? 'I — Initial' : selected.eclaim_type === 'R' ? 'R — Resubmission' : 'L — Late'}</span></div>
                      <div className="text-xs font-mono text-text-muted">Format: eClaimLink XML DHA 2.0</div>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  {selected.status === 'DENIED' && (
                    <button onClick={() => router.push('/dashboard/denials')}
                      className="flex-1 py-2 bg-coral text-white rounded-xl text-sm font-bold">
                      → View Denial
                    </button>
                  )}
                  <button onClick={() => router.push('/dashboard/bills/' + selected!.bill_id)}
                    className="flex-1 py-2 bg-paper-soft border border-line rounded-xl text-sm text-text-dim">
                    View Bill
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
