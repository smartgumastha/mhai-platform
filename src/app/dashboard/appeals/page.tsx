'use client'
// /dashboard/appeals — Appeal Builder · L1/L2/L3 state machine

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/app/providers/auth-context'
import { useCurrency } from '@/app/hooks/useCurrency'
import { getToken } from '@/lib/api'

interface Appeal {
  id: string
  denial_id: string
  patient_name: string
  payer_name: string
  denied_amount: number
  level: 'L1' | 'L2' | 'L3'
  status: 'DRAFT' | 'FILED' | 'UNDER_REVIEW' | 'APPROVED' | 'DENIED' | 'ESCALATED'
  carc_code: string
  specialty: string
  country_code: string
  human_review_required: boolean
  template_name: string
  template_body: string
  filing_deadline: string
  next_recommended_level?: string
  created_at: string
}

var LEVEL_DEADLINES = {
  L1: { label: 'Redetermination', days: 60, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  L2: { label: 'QIC Reconsideration', days: 180, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  L3: { label: 'ALJ Hearing', days: 90, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
}

function AppealsContent() {
  var { user } = useAuth()
  var { format: fmt } = useCurrency()
  var router = useRouter()
  var searchParams = useSearchParams()
  var denialId = searchParams.get('denial')
  var hospitalId = user?.hospital_id

  var [appeals, setAppeals] = useState<Appeal[]>([])
  var [loading, setLoading] = useState(true)
  var [selected, setSelected] = useState<Appeal | null>(null)
  var [editingTemplate, setEditingTemplate] = useState('')
  var [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!hospitalId) return
    var token = getToken()
    fetch(`/api/hospitals/${hospitalId}/rcm/appeals?limit=50`, {
      headers: token ? { Authorization: 'Bearer ' + token } : {}
    })
      .then(r => r.json())
      .then(d => {
        var list: Appeal[] = d.appeals || []
        setAppeals(list)
        if (denialId) {
          var match = list.find(a => a.denial_id === denialId)
          if (match) { setSelected(match); setEditingTemplate(match.template_body || '') }
        } else if (list.length > 0) {
          setSelected(list[0])
          setEditingTemplate(list[0].template_body || '')
        }
      })
      .catch(() => setAppeals([]))
      .finally(() => setLoading(false))
  }, [hospitalId, denialId])

  async function fileAppeal(appealId: string) {
    setSaving(true)
    try {
      var token = getToken()
      var res = await fetch(`/api/hospitals/${hospitalId}/rcm/appeals/${appealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
        body: JSON.stringify({ status: 'FILED', template_body: editingTemplate }),
      })
      if (res.ok) {
        setAppeals(prev => prev.map(a => a.id === appealId ? { ...a, status: 'FILED' } : a))
        setSelected(prev => prev ? { ...prev, status: 'FILED' } : prev)
      }
    } finally { setSaving(false) }
  }

  async function recordDecision(appealId: string, decision: string) {
    var token = getToken()
    var newStatus = decision === 'ESCALATE' ? 'ESCALATED' : decision.toUpperCase()
    await fetch(`/api/hospitals/${hospitalId}/rcm/appeals/${appealId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: JSON.stringify({ status: newStatus }),
    })
    setAppeals(prev => prev.map(a => a.id === appealId ? { ...a, status: newStatus as Appeal['status'] } : a))
    setSelected(prev => prev && prev.id === appealId ? { ...prev, status: newStatus as Appeal['status'] } : prev)
  }

  var stats = {
    total: appeals.length,
    won: appeals.filter(a => a.status === 'APPROVED').length,
    deadlineSoon: appeals.filter(a => {
      if (!a.filing_deadline) return false
      var diff = (new Date(a.filing_deadline).getTime() - Date.now()) / 86400000
      return diff > 0 && diff < 14
    }).length,
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-fraunces text-3xl font-light">Appeal <em className="italic text-coral-deep">Builder</em></h1>
            <p className="text-sm text-text-dim mt-1">L1 / L2 / L3 state machine · Auto-selected templates · Filing deadline tracker</p>
          </div>
          <button onClick={() => router.push('/dashboard/denials')}
            className="flex items-center gap-2 px-4 py-2 bg-coral text-white text-sm font-semibold rounded-xl">
            + New Appeal
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { l: 'Total Appeals', v: stats.total, s: 'This quarter', ok: false, warn: false },
            { l: 'Won', v: stats.won, s: `${stats.total > 0 ? Math.round(stats.won / stats.total * 100) : 0}% win rate`, ok: true, warn: false },
            { l: 'Filing Soon', v: stats.deadlineSoon, s: '< 14 days', ok: false, warn: true },
            { l: 'Recovered', v: '—', s: 'From won appeals', ok: false, warn: false },
          ].map(s => (
            <div key={s.l} className="bg-white border border-line rounded-xl p-4">
              <div className="text-xs font-mono uppercase tracking-wider text-text-muted mb-1">{s.l}</div>
              <div className={`font-fraunces text-2xl font-medium ${s.ok ? 'text-emerald-700' : s.warn ? 'text-amber-600' : ''}`}>{s.v}</div>
              <div className="text-xs text-text-dim mt-1">{s.s}</div>
            </div>
          ))}
        </div>

        {/* Two-panel layout */}
        <div className="grid grid-cols-5 gap-5">

          {/* Left: appeal list */}
          <div className="col-span-2">
            {loading ? (
              <div className="text-center py-8 text-text-muted">Loading…</div>
            ) : appeals.length === 0 ? (
              <div className="bg-white border border-line rounded-2xl p-8 text-center">
                <div className="font-fraunces text-lg font-light text-text-dim mb-2">No appeals yet</div>
                <p className="text-sm text-text-muted">Create appeals from the Denial Inbox.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appeals.map(a => {
                  var lvl = LEVEL_DEADLINES[a.level]
                  var daysLeft = a.filing_deadline
                    ? Math.ceil((new Date(a.filing_deadline).getTime() - Date.now()) / 86400000)
                    : null
                  var deadlineColor = !daysLeft || daysLeft <= 0 ? 'text-text-muted' : daysLeft < 14 ? 'text-rose-600' : daysLeft < 30 ? 'text-amber-600' : 'text-emerald-700'

                  return (
                    <div key={a.id}
                      onClick={() => { setSelected(a); setEditingTemplate(a.template_body || '') }}
                      className={`bg-white border rounded-2xl overflow-hidden cursor-pointer transition-all ${selected?.id === a.id ? 'border-coral shadow-sm' : 'border-line hover:border-coral/50'}`}>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="text-xs font-mono text-text-muted">{a.id.substring(0, 14)}</div>
                            <div className="text-sm font-semibold">{a.patient_name}</div>
                            <div className="text-xs text-text-dim">{a.payer_name}</div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${lvl.bg} ${lvl.color}`}>{a.level}</span>
                            <span className="text-xs font-mono text-text-muted capitalize">{a.status.toLowerCase().replace('_', ' ')}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-wrap mb-2">
                          {a.human_review_required && <span className="text-xs font-mono px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded">Physician Review</span>}
                          <span className="text-xs font-mono px-1.5 py-0.5 bg-paper-soft text-text-dim rounded">{a.template_name?.substring(0, 25)}</span>
                        </div>
                        {daysLeft !== null && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-text-muted">Deadline:</span>
                            <div className="flex-1 h-1 bg-line rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${daysLeft < 14 ? 'bg-rose-400' : daysLeft < 30 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.max(4, Math.min(100, (daysLeft / 60) * 100))}%` }} />
                            </div>
                            <span className={`text-xs font-mono font-bold ${deadlineColor}`}>
                              {daysLeft <= 0 ? a.filing_deadline || '—' : `${daysLeft}d`}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 px-4 py-2 border-t border-line-soft bg-paper-soft">
                        <button onClick={e => { e.stopPropagation(); setSelected(a); setEditingTemplate(a.template_body || '') }}
                          className="flex-1 py-1.5 bg-coral text-white rounded-lg text-xs font-bold">Edit Letter</button>
                        {a.status === 'DENIED' && a.next_recommended_level && (
                          <button onClick={e => { e.stopPropagation(); recordDecision(a.id, 'ESCALATE') }}
                            className="flex-1 py-1.5 bg-pink-50 border border-pink-200 text-pink-700 rounded-lg text-xs font-semibold">
                            ↑ {a.next_recommended_level}
                          </button>
                        )}
                        {(a.status === 'FILED' || a.status === 'UNDER_REVIEW') && (
                          <button onClick={e => { e.stopPropagation(); setSelected(a) }}
                            className="flex-1 py-1.5 bg-white border border-line rounded-lg text-xs text-text-dim">Record Decision</button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right: builder panel */}
          <div className="col-span-3">
            <div className="bg-white border border-line rounded-2xl overflow-hidden sticky top-20">
              <div className="px-5 py-4 border-b border-line-soft bg-paper-soft">
                <h2 className="font-fraunces text-xl font-light">Appeal <em className="italic text-coral-deep">Builder</em></h2>
                <p className="text-sm text-text-dim mt-1">{selected ? `${selected.id.substring(0, 16)} · ${selected.patient_name} · ${selected.level}` : 'Select an appeal from the list'}</p>
              </div>

              {!selected ? (
                <div className="p-12 text-center text-text-muted font-fraunces text-lg font-light">
                  Select an appeal to edit or create from Denial Inbox
                </div>
              ) : (
                <div className="p-5 max-h-[calc(100vh-280px)] overflow-y-auto">

                  {/* Level selector */}
                  <div className="mb-4">
                    <p className="text-xs font-mono uppercase tracking-wider text-text-muted mb-2">Appeal Level</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(['L1', 'L2', 'L3'] as const).map(l => {
                        var lv = LEVEL_DEADLINES[l]
                        return (
                          <div key={l} className={`p-3 border-2 rounded-xl text-center ${selected!.level === l ? `border-current ${lv.bg} ${lv.color}` : 'border-line text-text-muted'}`}>
                            <div className={`text-lg font-mono font-bold ${selected!.level === l ? lv.color : ''}`}>{l}</div>
                            <div className="text-xs font-semibold mt-0.5">{lv.label}</div>
                            <div className="text-xs text-text-muted">{lv.days}d filing</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Human review banner */}
                  {selected.human_review_required && (
                    <div className="flex gap-3 p-3 bg-purple-50 border border-purple-200 rounded-xl mb-4">
                      <span className="text-xl">👨‍⚕️</span>
                      <div>
                        <p className="text-sm font-bold text-purple-700">Physician Review Required Before Filing</p>
                        <p className="text-xs text-text-dim">
                          {selected.specialty === 'ED_FACILITY'
                            ? 'ED Facility claims require attending physician validation of MDM documentation.'
                            : 'Psychotherapy appeals require treating clinician review. Do not send without physician sign-off.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Template info */}
                  <div className="bg-paper-soft border border-line rounded-xl p-3 mb-4">
                    <div className="text-xs font-mono text-text-muted">Auto-selected template</div>
                    <div className="text-sm font-bold mt-0.5">{selected.template_name}</div>
                    <div className="text-xs text-text-dim">{selected.carc_code} · {selected.specialty} · {selected.country_code}</div>
                  </div>

                  {/* Filing deadline */}
                  {selected.filing_deadline && (() => {
                    var daysLeft = Math.ceil((new Date(selected.filing_deadline).getTime() - Date.now()) / 86400000)
                    return daysLeft > 0 ? (
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-4">
                        <span className="text-xl">📅</span>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-emerald-700">Filing Deadline: {selected.filing_deadline}</p>
                          <p className="text-xs text-text-dim">Late filing forfeits the right to appeal.</p>
                        </div>
                        <div className="font-fraunces text-2xl font-medium text-emerald-700">{daysLeft}d</div>
                      </div>
                    ) : null
                  })()}

                  {/* Template editor */}
                  <div className="mb-4">
                    <p className="text-xs font-mono uppercase tracking-wider text-text-muted mb-1">
                      Appeal Letter — Fill <span className="bg-coral-soft px-1 rounded font-bold text-coral-deep font-mono">[PLACEHOLDERS]</span>
                    </p>
                    <textarea
                      value={editingTemplate}
                      onChange={e => setEditingTemplate(e.target.value)}
                      className="w-full bg-paper-soft border border-line rounded-xl p-4 text-xs font-mono leading-relaxed resize-none focus:border-coral focus:outline-none"
                      rows={12}
                    />
                  </div>

                  {/* Decision block for filed/under review */}
                  {(selected.status === 'FILED' || selected.status === 'UNDER_REVIEW') && (
                    <div className="mb-4">
                      <p className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">Record Decision</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { d: 'APPROVED', icon: '✅', label: 'Approved', sub: 'Claim paid in full' },
                          { d: 'DENIED', icon: '❌', label: 'Denied', sub: 'Level denied again' },
                          { d: 'PARTIAL', icon: '⚡', label: 'Partial', sub: 'Partial payment' },
                          { d: 'ESCALATE', icon: '↑', label: 'Escalate', sub: `→ ${selected!.level === 'L1' ? 'L2' : 'L3'}` },
                        ].map(opt => (
                          <button key={opt.d} onClick={() => recordDecision(selected!.id, opt.d)}
                            className="p-3 border border-line rounded-xl text-center hover:border-coral transition-colors">
                            <div className="text-xl">{opt.icon}</div>
                            <div className="text-sm font-bold">{opt.label}</div>
                            <div className="text-xs text-text-muted">{opt.sub}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {/* save draft — stub until backend PATCH /status=DRAFT */ }}
                      className="flex-1 py-2.5 bg-paper-soft border border-line rounded-xl text-sm text-text-dim">
                      Save Draft
                    </button>
                    <button onClick={() => fileAppeal(selected!.id)} disabled={saving}
                      className="flex-1 py-2.5 bg-coral text-white rounded-xl text-sm font-bold disabled:opacity-60">
                      {saving ? 'Filing…' : selected.status === 'DRAFT' ? 'File Appeal →' : 'Update & Refile →'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AppealsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper flex items-center justify-center text-text-muted">Loading…</div>}>
      <AppealsContent />
    </Suspense>
  )
}
