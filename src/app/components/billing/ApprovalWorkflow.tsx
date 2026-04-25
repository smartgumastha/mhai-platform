'use client'
import { useState } from 'react'
import { getToken } from '@/lib/api'

export type BillStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'FINAL' | 'VOID' | 'CANCELLED'

type Props = {
  billId: string
  hospitalId: string
  currentStatus: BillStatus
  discountPct: number
  discountThreshold?: number
  createdBy?: string
  createdAt?: number
  approvedBy?: string
  onStatusChange: (newStatus: BillStatus, billNumber?: string) => void
  onEdit?: () => void
}

type StepState = 'done' | 'active' | 'waiting' | 'skipped'

type Step = {
  label: string
  sublabel: string
  state: StepState
}

async function patchStatus(hospitalId: string, billId: string, status: BillStatus, extra?: Record<string, string>) {
  var token = getToken()
  var res = await fetch(`/api/hospitals/${hospitalId}/rcm/billing/bills/${billId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ status, ...extra }),
  })
  var data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Status update failed')
  return data
}

export default function ApprovalWorkflow({
  billId, hospitalId, currentStatus, discountPct,
  discountThreshold = 10, createdBy, createdAt, approvedBy,
  onStatusChange, onEdit,
}: Props) {
  var [loading, setLoading]       = useState(false)
  var [voidOpen, setVoidOpen]     = useState(false)
  var [voidReason, setVoidReason] = useState('')
  var [error, setError]           = useState('')

  var needsApproval = discountPct >= discountThreshold
  var approvalLabel = discountPct < discountThreshold
    ? 'No approval needed'
    : discountPct < 25
    ? 'Supervisor required (' + discountPct.toFixed(0) + '%)'
    : 'HOD / Doctor required (' + discountPct.toFixed(0) + '%)'

  function computeSteps(): Step[] {
    var s = currentStatus
    return [
      {
        label: 'Bill created',
        sublabel: createdBy ? 'by ' + createdBy : (createdAt ? new Date(createdAt).toLocaleString() : 'Draft saved'),
        state: 'done',
      },
      {
        label: needsApproval ? 'Discount approval' : 'No approval needed',
        sublabel: s === 'PENDING_APPROVAL' ? 'Awaiting supervisor…'
          : s === 'FINAL' || s === 'VOID' ? (approvedBy ? 'Approved by ' + approvedBy : 'Approved')
          : needsApproval ? approvalLabel : 'Self-approve threshold not reached',
        state: !needsApproval ? 'skipped'
          : s === 'PENDING_APPROVAL' ? 'active'
          : s === 'FINAL' || s === 'VOID' ? 'done'
          : 'waiting',
      },
      {
        label: 'Final bill lock',
        sublabel: s === 'FINAL' ? 'Bill number assigned'
          : s === 'VOID' ? 'Was finalised, now void'
          : s === 'CANCELLED' ? 'Cancelled before final'
          : 'Pending — bill still editable',
        state: s === 'FINAL' || s === 'VOID' ? 'done' : s === 'PENDING_APPROVAL' ? 'active' : 'waiting',
      },
      {
        label: 'Print & collect',
        sublabel: s === 'FINAL' ? 'Ready — send to patient'
          : s === 'VOID' ? 'Voided — do not collect'
          : 'Waiting for final lock',
        state: s === 'FINAL' ? 'done' : s === 'VOID' ? 'skipped' : 'waiting',
      },
    ]
  }

  async function sendForApproval() {
    setError('')
    setLoading(true)
    try {
      var data = await patchStatus(hospitalId, billId, 'PENDING_APPROVAL')
      onStatusChange('PENDING_APPROVAL', data.bill_number)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function finalize() {
    setError('')
    setLoading(true)
    try {
      var data = await patchStatus(hospitalId, billId, 'FINAL')
      onStatusChange('FINAL', data.bill_number)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function rejectToDraft() {
    setError('')
    setLoading(true)
    try {
      var data = await patchStatus(hospitalId, billId, 'DRAFT')
      onStatusChange('DRAFT', data.bill_number)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function confirmVoid() {
    if (!voidReason.trim()) { setError('Void reason is required'); return }
    setError('')
    setLoading(true)
    try {
      var data = await patchStatus(hospitalId, billId, 'VOID', { reason: voidReason.trim() })
      onStatusChange('VOID', data.bill_number)
      setVoidOpen(false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  var steps = computeSteps()
  var isDone = currentStatus === 'FINAL' || currentStatus === 'VOID' || currentStatus === 'CANCELLED'

  var stepColor: Record<StepState, { ring: string; bg: string; text: string; line: string }> = {
    done:    { ring: 'ring-green-500',  bg: 'bg-green-500',  text: 'text-green-700',  line: 'bg-green-400' },
    active:  { ring: 'ring-blue-500',   bg: 'bg-blue-500',   text: 'text-blue-700',   line: 'bg-gray-200' },
    waiting: { ring: 'ring-gray-300',   bg: 'bg-gray-200',   text: 'text-gray-400',   line: 'bg-gray-200' },
    skipped: { ring: 'ring-gray-300',   bg: 'bg-gray-100',   text: 'text-gray-400',   line: 'bg-gray-200' },
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Approval workflow</span>
        {currentStatus === 'FINAL' && (
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-bold text-green-700">FINAL</span>
        )}
        {currentStatus === 'VOID' && (
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-700">VOID</span>
        )}
        {currentStatus === 'PENDING_APPROVAL' && (
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">PENDING</span>
        )}
        {(currentStatus === 'DRAFT') && (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">DRAFT</span>
        )}
      </div>

      {/* Step tracker */}
      <div className="mb-5 space-y-0">
        {steps.map(function (step, i) {
          var c = stepColor[step.state]
          var isLast = i === steps.length - 1
          return (
            <div key={i} className="flex gap-3">
              {/* Left: dot + line */}
              <div className="flex flex-col items-center">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full ring-2 ${c.ring} ${c.bg} text-white text-xs font-bold`}>
                  {step.state === 'done' ? '✓' : step.state === 'skipped' ? '–' : String(i + 1)}
                </div>
                {!isLast && <div className={`w-0.5 flex-1 ${c.line} my-0.5`} style={{ minHeight: 16 }} />}
              </div>
              {/* Right: text */}
              <div className={'pb-4 ' + (isLast ? '' : '')}>
                <div className={'text-sm font-semibold ' + (step.state === 'waiting' || step.state === 'skipped' ? 'text-gray-400' : 'text-gray-900')}>
                  {step.label}
                </div>
                <div className={'text-[11px] ' + c.text}>{step.sublabel}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      )}

      {/* Action buttons */}
      {!isDone && (
        <div className="space-y-2">
          {currentStatus === 'DRAFT' && needsApproval && (
            <button
              onClick={sendForApproval}
              disabled={loading || !billId}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Sending…' : '📤 Send for approval'}
            </button>
          )}
          {currentStatus === 'DRAFT' && !needsApproval && (
            <button
              onClick={finalize}
              disabled={loading || !billId}
              className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Finalising…' : '🔒 Finalize bill'}
            </button>
          )}
          {currentStatus === 'PENDING_APPROVAL' && (
            <>
              <button
                onClick={finalize}
                disabled={loading}
                className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Finalising…' : '✅ Approve & finalize'}
              </button>
              <button
                onClick={rejectToDraft}
                disabled={loading}
                className="w-full rounded-lg border border-amber-300 bg-amber-50 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
              >
                ↩ Reject — back to draft
              </button>
            </>
          )}
          {onEdit && currentStatus === 'DRAFT' && (
            <button
              onClick={onEdit}
              className="w-full rounded-lg border border-gray-200 py-2 text-xs text-gray-600 hover:border-gray-400"
            >
              Edit bill
            </button>
          )}
        </div>
      )}

      {/* Void — only on FINAL */}
      {currentStatus === 'FINAL' && !voidOpen && (
        <button
          onClick={function () { setVoidOpen(true) }}
          className="mt-2 w-full rounded-lg border border-red-200 bg-red-50 py-2 text-xs font-medium text-red-600 hover:bg-red-100"
        >
          Void this bill…
        </button>
      )}

      {/* Void reason panel */}
      {voidOpen && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="mb-2 text-xs font-semibold text-red-800">Void reason (required)</div>
          <textarea
            value={voidReason}
            onChange={function (e) { setVoidReason(e.target.value) }}
            rows={2}
            placeholder="Enter reason for voiding…"
            className="mb-2 w-full rounded border border-red-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={confirmVoid}
              disabled={loading}
              className="flex-1 rounded bg-red-600 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Voiding…' : 'Confirm void'}
            </button>
            <button
              onClick={function () { setVoidOpen(false); setVoidReason(''); setError('') }}
              className="flex-1 rounded border border-gray-300 bg-white py-1.5 text-xs text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
