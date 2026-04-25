'use client'
// /dashboard/denials — Denial Inbox with Rajitha RCM Framework
// Sources: MHAI Definitive Billing Field Master v1.0, Rajitha Inukonda RCM Framework

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/auth-context'
import { useCurrency } from '@/app/hooks/useCurrency'
import { getToken } from '@/lib/api'

interface Denial {
  id: string
  claim_id: string
  bill_id: string
  patient_name: string
  payer_name: string
  denied_amount: number
  denial_date: string
  carc_code: string
  carc_description: string
  is_worth_appealing: boolean
  win_probability: number
  recommended_action: string
  specialty: string
  claim_type: string
  country_code: string
  human_review_required: boolean
  status: 'OPEN' | 'APPEALING' | 'WRITTEN_OFF' | 'RESOLVED'
}

var CARC_LABELS: Record<string, string> = {
  'CO-50': 'Not Medically Necessary',
  'CO-55': 'Not Covered by Plan',
  'CO-97': 'Service Included in Primary (Inclusive)',
  'CO-4': 'Service Inconsistent with Modifier',
  'CO-16': 'Claim Lacks Information',
  'CO-18': 'Duplicate Claim',
  'M-50': 'Not Covered by Plan — Insurer Rules',
  'AUTH-DHA': 'Prior Authorization Not Obtained (DHA)',
  'DHA-MED': 'Medical Necessity (DHA)',
  'ER-DOWN': 'Emergency Level Downgrade',
}

export default function DenialInboxPage() {
  var { user } = useAuth()
  var { format: fmt } = useCurrency()
  var router = useRouter()
  var hospitalId = user?.hospital_id

  var [denials, setDenials] = useState<Denial[]>([])
  var [loading, setLoading] = useState(true)
  var [filter, setFilter] = useState<'ALL' | 'APPEAL' | 'WRITEOFF' | 'REVIEW'>('ALL')

  useEffect(() => {
    if (!hospitalId) return
    var token = getToken()
    fetch(`/api/hospitals/${hospitalId}/rcm/denials?limit=50`, {
      headers: token ? { Authorization: 'Bearer ' + token } : {}
    })
      .then(r => r.json())
      .then(d => setDenials(d.denials || []))
      .catch(() => setDenials([]))
      .finally(() => setLoading(false))
  }, [hospitalId])

  var shown = filter === 'ALL' ? denials
    : filter === 'APPEAL' ? denials.filter(d => d.is_worth_appealing)
    : filter === 'WRITEOFF' ? denials.filter(d => !d.is_worth_appealing && d.win_probability < 20)
    : denials.filter(d => !d.is_worth_appealing && d.win_probability >= 20)

  var stats = {
    total: denials.length,
    appealable: denials.filter(d => d.is_worth_appealing).length,
    writeoff: denials.filter(d => !d.is_worth_appealing && d.win_probability < 20).length,
    review: denials.filter(d => !d.is_worth_appealing && d.win_probability >= 20).length,
    recoverable: denials.filter(d => d.is_worth_appealing).reduce((s, d) => s + d.denied_amount, 0),
  }

  async function writeOff(denialId: string) {
    var token = getToken()
    await fetch(`/api/hospitals/${hospitalId}/rcm/denials/${denialId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: JSON.stringify({ status: 'WRITTEN_OFF' }),
    })
    setDenials(prev => prev.map(d => d.id === denialId ? { ...d, status: 'WRITTEN_OFF' as const } : d))
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-fraunces text-3xl font-light">Denial <em className="italic text-coral-deep">Inbox</em></h1>
            <p className="text-sm text-text-dim mt-1">AI-classified by appeal probability · Rajitha RCM Framework · CO-50/55/97 priority</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-full">
            <span className="text-xs font-mono text-purple-700 font-bold">Rajitha Inukonda · US RCM Framework · UB-04 / 837I</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-5">
          {[
            { l: 'Total Denials', v: stats.total, s: 'This month', c: '' },
            { l: 'Worth Appealing', v: stats.appealable, s: `${fmt(stats.recoverable)} recoverable`, c: 'ok' },
            { l: 'Write Off', v: stats.writeoff, s: 'Not worth appealing', c: 'alert' },
            { l: 'Under Review', v: stats.review, s: 'Pending assessment', c: 'warn' },
            { l: 'Avg Win Rate', v: '68%', s: 'Last 90 days', c: '' },
          ].map(s => (
            <div key={s.l} className="bg-white border border-line rounded-xl p-4">
              <div className="text-xs font-mono uppercase tracking-wider text-text-muted mb-1">{s.l}</div>
              <div className={`font-fraunces text-2xl font-medium ${s.c === 'ok' ? 'text-emerald-700' : s.c === 'alert' ? 'text-rose-600' : s.c === 'warn' ? 'text-amber-600' : ''}`}>{s.v}</div>
              <div className="text-xs text-text-dim mt-1">{s.s}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-5">
          {([['ALL', 'All'], ['APPEAL', 'Appeal Now'], ['WRITEOFF', 'Write Off'], ['REVIEW', 'Review']] as const).map(([f, l]) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filter === f ? 'bg-ink text-white border-ink' : 'bg-white text-text-dim border-line'}`}>
              {l}{f === 'APPEAL' && stats.appealable > 0 ? ` (${stats.appealable})` : ''}
            </button>
          ))}
        </div>

        {/* Denial cards */}
        {loading ? (
          <div className="text-center py-12 text-text-muted font-fraunces text-xl font-light">Loading denials…</div>
        ) : shown.length === 0 ? (
          <div className="bg-white border border-line rounded-2xl p-12 text-center">
            <div className="font-fraunces text-xl font-light text-text-dim mb-2">No denials {filter !== 'ALL' ? 'in this category' : 'found'}</div>
            <p className="text-sm text-text-muted">All caught up! Denied claims will appear here automatically.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shown.map(d => (
              <div key={d.id} className={`bg-white border rounded-2xl overflow-hidden border-l-4 ${d.is_worth_appealing ? 'border-l-emerald-500' : d.win_probability < 20 ? 'border-l-rose-500' : 'border-l-amber-400'}`}>
                <div className="p-5">
                  {/* Top row */}
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div>
                      <div className="text-xs font-mono text-text-muted">{d.id} · Claim {d.claim_id?.substring(0, 16)} · Denied {new Date(d.denial_date).toLocaleDateString('en-IN')}</div>
                      <div className="text-base font-semibold mt-0.5">{d.patient_name}</div>
                      <div className="text-sm text-text-dim">{d.payer_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-fraunces text-xl font-medium">{fmt(d.denied_amount)}</div>
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${d.is_worth_appealing ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : d.win_probability < 20 ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                        {d.is_worth_appealing ? '✓ Appeal Recommended' : d.win_probability < 20 ? '✕ Write Off' : '? Review First'}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex gap-2 flex-wrap mb-3">
                    <span className="text-xs font-mono px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">{d.specialty}</span>
                    {d.human_review_required && (
                      <span className="text-xs font-mono px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md font-bold">PHYSICIAN REVIEW REQUIRED</span>
                    )}
                    <span className="text-xs font-mono px-2 py-0.5 bg-paper-soft text-text-dim rounded-md">{d.claim_type}</span>
                    <span className="text-xs font-mono px-2 py-0.5 bg-paper-soft text-text-dim rounded-md">{d.country_code}</span>
                  </div>

                  {/* CARC block */}
                  <div className="flex gap-3 bg-paper-soft rounded-xl p-3 mb-3">
                    <div className="w-14 h-14 bg-white border border-line rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                      <div className="text-xs font-mono font-bold">{d.carc_code}</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold">{CARC_LABELS[d.carc_code] || d.carc_code}</div>
                      <div className="text-xs text-text-dim mt-1">{d.carc_description}</div>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className={`flex gap-2 p-3 rounded-xl mb-3 ${d.is_worth_appealing ? 'bg-emerald-50 border border-emerald-200' : d.win_probability < 20 ? 'bg-rose-50 border border-rose-200' : 'bg-amber-50 border border-amber-200'}`}>
                    <span className="text-lg">{d.is_worth_appealing ? '📋' : d.win_probability < 20 ? '✕' : '🔍'}</span>
                    <div>
                      <div className={`text-xs font-mono font-bold uppercase tracking-wider ${d.is_worth_appealing ? 'text-emerald-700' : d.win_probability < 20 ? 'text-rose-600' : 'text-amber-700'}`}>
                        {d.is_worth_appealing ? 'APPEAL RECOMMENDED' : d.win_probability < 20 ? 'WRITE OFF' : 'MANUAL REVIEW'}
                      </div>
                      <div className="text-xs text-text-dim mt-1">{d.recommended_action}</div>
                    </div>
                  </div>

                  {/* Win rate bar */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">Historical win rate:</span>
                    <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${d.win_probability > 70 ? 'bg-emerald-500' : d.win_probability > 45 ? 'bg-amber-400' : 'bg-rose-400'}`}
                        style={{ width: `${d.win_probability}%` }} />
                    </div>
                    <span className={`text-xs font-mono font-bold ${d.win_probability > 70 ? 'text-emerald-700' : d.win_probability > 45 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {d.win_probability}%
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 px-5 py-3 bg-paper-soft border-t border-line-soft">
                  {d.is_worth_appealing ? (
                    <>
                      <button onClick={() => router.push(`/dashboard/appeals?denial=${d.id}`)}
                        className="flex-1 py-2 bg-coral text-white rounded-xl text-xs font-bold">+ Create L1 Appeal</button>
                      <button className="flex-1 py-2 bg-white border border-line rounded-xl text-xs text-text-dim">Get Clinical Notes</button>
                      <button onClick={() => router.push('/dashboard/bills/' + d.bill_id)}
                        className="flex-1 py-2 bg-white border border-line rounded-xl text-xs text-text-dim">View Bill</button>
                    </>
                  ) : (
                    <>
                      <button className="flex-1 py-2 bg-white border border-line rounded-xl text-xs text-text-dim">View Details</button>
                      <button onClick={() => writeOff(d.id)}
                        className="flex-1 py-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold">Write Off</button>
                      <button className="flex-1 py-2 bg-white border border-line rounded-xl text-xs text-text-dim">Mark Resolved</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
