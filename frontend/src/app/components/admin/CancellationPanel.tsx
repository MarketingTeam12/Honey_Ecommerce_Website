import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Clock, Loader2, RefreshCw, RotateCcw, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  type AdminCancellationView,
  CANCELLATION_REASON_LABELS,
  REFUND_STATUS_LABELS,
  type RefundRecord,
  approveCancellation,
  declineCancellation,
  downloadCreditNote,
  formatDate,
  formatInr,
  getAdminOrderCancellation,
  markRefundManual,
  retryRefund,
} from '@/app/services/cancellationApi';

type PendingAction =
  | { kind: 'full' }
  | { kind: 'partial'; amount: number; reason: string }
  | { kind: 'decline'; reason: string }
  | { kind: 'retry'; refund: RefundRecord }
  | { kind: 'manual'; refund: RefundRecord; note: string };

const ACTION_LABELS: Record<string, string> = {
  cancellation_requested: 'Cancellation requested',
  cancellation_withdrawn: 'Request withdrawn by customer',
  cancellation_declined: 'Request declined',
  cancellation_approved: 'Request approved – order cancelled',
  order_cancelled_unpaid: 'Unpaid order cancelled by customer',
  shipment_cancelled: 'Shipment detached',
  refund_initiated: 'Refund initiated with Razorpay',
  refund_processed: 'Refund processed',
  refund_failed: 'Refund failed',
  refund_retry: 'Refund retry requested',
  refund_marked_manual: 'Refund marked as processed manually',
};

const STATUS_STYLES: Record<string, string> = {
  REQUESTED: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  DECLINED: 'bg-gray-200 text-gray-800',
  WITHDRAWN: 'bg-gray-100 text-gray-600',
};

const REFUND_STYLES: Record<string, string> = {
  INITIATED: 'bg-blue-100 text-blue-800',
  PROCESSED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  NONE: 'bg-gray-100 text-gray-700',
};

/**
 * Admin cancellation panel for the order detail page: request details,
 * approve (full / partial) or decline with confirmation, refund status with
 * retry / mark-manual for failed refunds, and the audit timeline.
 */
export function CancellationPanel({ orderId, onChanged }: { orderId: string; onChanged?: () => void }) {
  const [view, setView] = useState<AdminCancellationView | null>(null);
  const [partialAmount, setPartialAmount] = useState('');
  const [partialReason, setPartialReason] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [manualNotes, setManualNotes] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getAdminOrderCancellation(orderId);
      setView(data);
      if (data.request) setPartialAmount(String(data.request.suggestedRefundAmount ?? ''));
    } catch {
      setView(null);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!view || (!view.request && view.refunds.length === 0)) return null;

  const { request, refunds, order, eligibility, timeline } = view;
  const isRequested = request?.status === 'REQUESTED';
  const amountPaid = eligibility.amountPaid || order.totalAmount;

  const confirmMessage = (action: PendingAction): string => {
    switch (action.kind) {
      case 'full':
        return `Approve the cancellation and refund the full amount paid (up to ${formatInr(amountPaid)}) to the customer via Razorpay?`;
      case 'partial':
        return action.amount > 0
          ? `Approve the cancellation and refund ${formatInr(action.amount)} via Razorpay?`
          : 'Approve the cancellation with no refund?';
      case 'decline':
        return 'Decline this cancellation request? Work on the order resumes at its previous status.';
      case 'retry':
        return `Retry the Razorpay refund of ${formatInr(action.refund.amount)}?`;
      case 'manual':
        return `Mark the refund of ${formatInr(action.refund.amount)} as already paid outside Razorpay?`;
      default:
        return '';
    }
  };

  const runPending = async () => {
    if (!pending) return;
    setSubmitting(true);
    try {
      if (pending.kind === 'full' && request) {
        const result = await approveCancellation(request.id, { refundType: 'FULL' });
        toast.success(result.refund?.status === 'FAILED' ? 'Order cancelled, but the refund failed' : 'Cancellation approved, refund initiated');
      } else if (pending.kind === 'partial' && request) {
        const result = await approveCancellation(request.id, { refundType: 'PARTIAL', amount: pending.amount, reason: pending.reason });
        toast.success(result.refund?.status === 'FAILED' ? 'Order cancelled, but the refund failed' : 'Cancellation approved');
      } else if (pending.kind === 'decline' && request) {
        await declineCancellation(request.id, pending.reason);
        toast.success('Cancellation request declined');
      } else if (pending.kind === 'retry') {
        const result = await retryRefund(pending.refund.id);
        toast[result.refund.status === 'FAILED' ? 'error' : 'success'](
          result.refund.status === 'FAILED' ? `Refund failed again: ${result.refund.failureReason}` : 'Refund resubmitted to Razorpay',
        );
      } else if (pending.kind === 'manual') {
        await markRefundManual(pending.refund.id, pending.note);
        toast.success('Refund marked as processed');
      }
      setPending(null);
      await load();
      onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const startPartial = () => {
    const amount = Number(partialAmount);
    if (!Number.isFinite(amount) || amount < 0) return toast.error('Enter a valid refund amount');
    if (amount > amountPaid) return toast.error(`Refund cannot exceed the amount paid (${formatInr(amountPaid)})`);
    if (!partialReason.trim()) return toast.error('A reason is required for a partial refund');
    setPending({ kind: 'partial', amount, reason: partialReason.trim() });
  };

  const startDecline = () => {
    if (!declineReason.trim()) return toast.error('A reason is required to decline');
    setPending({ kind: 'decline', reason: declineReason.trim() });
  };

  return (
    <div className="bg-white rounded-lg border-2 border-amber-200 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Cancellation & Refund</h2>
        {request && (
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[request.status] || 'bg-gray-100'}`}>
            {request.status}
          </span>
        )}
      </div>

      {request && (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Field label="Reason" value={CANCELLATION_REASON_LABELS[request.reason] || request.reason} />
          <Field label="Requested on" value={formatDate(request.createdAt)} />
          <Field label="Order status at request" value={request.orderStatusAtRequest || '—'} />
          <Field label="Current order status" value={order.status} />
          <Field label="Amount paid (incl. GST)" value={formatInr(amountPaid)} />
          <Field label="Razorpay payment ID" value={order.transactionId || 'Not recorded'} mono />
          <Field label="Suggested refund" value={formatInr(request.suggestedRefundAmount)} />
          {request.approvedRefundAmount != null && <Field label="Approved refund" value={formatInr(request.approvedRefundAmount)} />}
          {request.comments && (
            <div className="sm:col-span-2">
              <dt className="text-gray-500">Customer comments</dt>
              <dd className="mt-0.5 whitespace-pre-line text-gray-900">{request.comments}</dd>
            </div>
          )}
          {request.adminDecisionReason && (
            <div className="sm:col-span-2">
              <dt className="text-gray-500">Decision reason</dt>
              <dd className="mt-0.5 text-gray-900">{request.adminDecisionReason}</dd>
            </div>
          )}
        </dl>
      )}

      {isRequested && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setPending({ kind: 'full' })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve – Full refund ({formatInr(amountPaid)})
            </button>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-900">Approve – Partial refund</p>
            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3">
              <label className="text-sm text-gray-700">
                Amount (₹)
                <input
                  type="number"
                  min={0}
                  max={amountPaid}
                  step="0.01"
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="text-sm text-gray-700">
                Reason (shown to customer) <span className="text-red-600">*</span>
                <input
                  type="text"
                  value={partialReason}
                  onChange={(e) => setPartialReason(e.target.value)}
                  placeholder="e.g. Translation 50% complete"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={startPartial}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve – Partial refund
            </button>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-900">Decline</p>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={2}
              placeholder="Reason (shown to customer)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={startDecline}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-red-700 text-sm font-medium hover:bg-red-50"
            >
              <XCircle className="w-4 h-4" />
              Decline request
            </button>
          </div>
        </div>
      )}

      {refunds.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Refunds</h3>
          <div className="space-y-3">
            {refunds.map((refund) => (
              <div key={refund.id} className="rounded-lg border border-gray-200 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-gray-900">{formatInr(refund.amount)}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${REFUND_STYLES[refund.status] || ''}`}>
                    {REFUND_STATUS_LABELS[refund.status] || refund.status}
                  </span>
                </div>
                <div className="mt-1 space-y-0.5 text-gray-600">
                  {refund.razorpayRefundId && <p>Razorpay refund ID: <span className="font-mono">{refund.razorpayRefundId}</span></p>}
                  {refund.refundedAt && <p>Refunded on {formatDate(refund.refundedAt)}</p>}
                  {refund.creditNoteNumber && (
                    <p>
                      Credit note:{' '}
                      <button
                        type="button"
                        className="font-mono text-blue-700 underline hover:text-blue-900"
                        onClick={() =>
                          downloadCreditNote(orderId, `${refund.creditNoteNumber}.pdf`).catch((error) =>
                            toast.error(error instanceof Error ? error.message : 'Credit note is not available yet'),
                          )
                        }
                      >
                        {refund.creditNoteNumber}
                      </button>{' '}
                      <span className="text-gray-500">(adjusts the original invoice)</span>
                    </p>
                  )}
                  {refund.manualRefundNote && <p>Manual note: {refund.manualRefundNote}</p>}
                  {refund.status === 'FAILED' && refund.failureReason && (
                    <p className="flex items-start gap-1 text-red-700">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      {refund.failureReason}
                    </p>
                  )}
                </div>
                {refund.status === 'FAILED' && (
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    {refund.razorpayPaymentId && (
                      <button
                        type="button"
                        onClick={() => setPending({ kind: 'retry', refund })}
                        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Retry refund
                      </button>
                    )}
                    <input
                      type="text"
                      value={manualNotes[refund.id] || ''}
                      onChange={(e) => setManualNotes((prev) => ({ ...prev, [refund.id]: e.target.value }))}
                      placeholder="Note (e.g. NEFT UTR number)"
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const note = (manualNotes[refund.id] || '').trim();
                        if (!note) return toast.error('A note is required');
                        setPending({ kind: 'manual', refund, note });
                      }}
                      className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-800 text-xs font-medium hover:bg-gray-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Mark refunded manually
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {timeline.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Timeline</h3>
          <ol className="space-y-2 text-sm">
            {timeline.map((event, index) => (
              <li key={`${event.action}-${index}`} className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-gray-900">{ACTION_LABELS[event.action] || event.action}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(String(event.createdAt).replace(' ', 'T')).toLocaleString('en-IN')} · {event.actorType}
                    {event.actorId ? ` (${event.actorId})` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {pending && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="alertdialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">Please confirm</h3>
            <p className="mt-2 text-sm text-gray-700">{confirmMessage(pending)}</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPending(null)}
                disabled={submitting}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={runPending}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#1a1f5c] text-white text-sm font-medium hover:bg-[#13174a] disabled:opacity-60"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className={`mt-0.5 text-gray-900 break-words ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}

export default CancellationPanel;
