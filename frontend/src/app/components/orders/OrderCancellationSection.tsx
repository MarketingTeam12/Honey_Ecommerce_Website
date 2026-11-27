import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Download, Loader2, RotateCcw, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/app/components/ui/button';
import {
  CANCELLATION_REASON_LABELS,
  type CancellationReason,
  type CustomerCancellationView,
  downloadCreditNote,
  formatDate,
  formatInr,
  getOrderCancellation,
  requestCancellation,
  withdrawCancellation,
} from '@/app/services/cancellationApi';

interface Props {
  orderId: string;
  orderNumber: string;
  /** Called after a change so the parent can refresh the order list (status may change to Cancelled). */
  onChanged?: () => void;
}

const REFUND_POLICY_POINTS = [
  'Orders not yet in progress (Received, Payment Received, Confirmed) are refunded in full.',
  'Once document analysis has started, a processing fee is deducted.',
  'If translation work is under way (translating, formatting, proof checking, draft or soft copy), a partial refund is decided by our team based on the work completed.',
  'Orders already dispatched or delivered cannot be cancelled.',
  'Approved refunds go back to the original payment method within 5–7 working days. Refunds never exceed the amount paid (incl. 18% GST).',
];

/**
 * Cancellation controls for one order on My Orders: eligibility-driven
 * "Request Cancellation" button, request modal, under-review banner with
 * withdraw, and the outcome (declined / approved + refund status).
 */
export function OrderCancellationSection({ orderId, orderNumber, onChanged }: Props) {
  const [view, setView] = useState<CustomerCancellationView | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const load = useCallback(async () => {
    try {
      setView(await getOrderCancellation(orderId));
    } catch {
      // Not critical: without data the section simply stays hidden.
      setView(null);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!view) return null;

  const { eligibility, request, refunds } = view;
  const latestRefund = refunds[0];
  const canRequest = eligibility.eligible && (!request || request.status !== 'REQUESTED');

  const handleWithdraw = async () => {
    if (!window.confirm('Withdraw your cancellation request? We will continue working on your order.')) return;
    setWithdrawing(true);
    try {
      await withdrawCancellation(orderId);
      toast.success('Cancellation request withdrawn');
      await load();
      onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not withdraw the request');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleCreditNote = async () => {
    try {
      await downloadCreditNote(orderId, `credit-note-${orderNumber}.pdf`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Credit note is not available yet');
    }
  };

  let banner: JSX.Element | null = null;
  if (request?.status === 'REQUESTED') {
    banner = (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <div className="flex items-start gap-2 text-amber-900">
          <Clock className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Cancellation requested on {formatDate(request.createdAt)} – under review</p>
            <p className="text-sm">Reason: {CANCELLATION_REASON_LABELS[request.reason] || request.reason}</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleWithdraw} disabled={withdrawing} className="shrink-0">
          {withdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
          Withdraw request
        </Button>
      </div>
    );
  } else if (request?.status === 'DECLINED') {
    banner = (
      <div className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800">
        <XCircle className="w-5 h-5 mt-0.5 shrink-0 text-gray-500" />
        <div>
          <p className="font-semibold">Cancellation request declined{request.decidedAt ? ` on ${formatDate(request.decidedAt)}` : ''}</p>
          {request.adminDecisionReason && <p className="text-sm">Reason: {request.adminDecisionReason}</p>}
          <p className="text-sm text-gray-600">Work on your order continues.</p>
        </div>
      </div>
    );
  } else if (request?.status === 'APPROVED') {
    const failed = latestRefund?.status === 'FAILED';
    banner = (
      <div
        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border px-4 py-3 ${
          failed ? 'border-red-200 bg-red-50 text-red-900' : 'border-green-200 bg-green-50 text-green-900'
        }`}
      >
        <div className="flex items-start gap-2">
          {failed ? <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />}
          <div className="text-sm">
            <p className="font-semibold text-base">Order cancelled{request.decidedAt ? ` on ${formatDate(request.decidedAt)}` : ''}</p>
            {!latestRefund && <p>No refund applies to this cancellation.</p>}
            {latestRefund && (
              <>
                <p>Refund amount: <strong>{formatInr(latestRefund.amount)}</strong></p>
                {latestRefund.status === 'INITIATED' && <p>Refund initiated – usually credited within 5–7 working days.</p>}
                {latestRefund.status === 'PROCESSED' && (
                  <p>
                    Refunded{latestRefund.refundedAt ? ` on ${formatDate(latestRefund.refundedAt)}` : ''}
                    {latestRefund.razorpayRefundId ? ` · Reference: ${latestRefund.razorpayRefundId}` : ''}
                  </p>
                )}
                {failed && <p>We hit a problem processing your refund. Our team is looking into it – no action is needed from you.</p>}
              </>
            )}
          </div>
        </div>
        {latestRefund?.creditNoteAvailable && (
          <Button variant="outline" onClick={handleCreditNote} className="shrink-0">
            <Download className="w-4 h-4" />
            Credit note
          </Button>
        )}
      </div>
    );
  }

  if (!banner && !canRequest) return null;

  return (
    <div className="px-6 py-4 border-t border-gray-200 space-y-3">
      {banner}
      {canRequest && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setModalOpen(true)}
            className="text-red-700 border-red-200 hover:bg-red-50"
          >
            <XCircle className="w-4 h-4" />
            Request Cancellation
          </Button>
          {eligibility.immediateCancel && (
            <span className="text-sm text-gray-500">This order hasn't been paid, so it will be cancelled immediately.</span>
          )}
        </div>
      )}

      {modalOpen && (
        <CancellationRequestModal
          orderNumber={orderNumber}
          immediateCancel={eligibility.immediateCancel}
          onClose={() => setModalOpen(false)}
          onSubmit={async (input) => {
            const result = await requestCancellation(orderId, input);
            toast.success(result.immediateCancel ? 'Your order has been cancelled' : 'Cancellation request submitted');
            setModalOpen(false);
            await load();
            onChanged?.();
          }}
        />
      )}
    </div>
  );
}

function CancellationRequestModal({
  orderNumber,
  immediateCancel,
  onClose,
  onSubmit,
}: {
  orderNumber: string;
  immediateCancel: boolean;
  onClose: () => void;
  onSubmit: (input: { reason: CancellationReason; comments: string; policyAccepted: boolean }) => Promise<void>;
}) {
  const [reason, setReason] = useState<CancellationReason | ''>('');
  const [comments, setComments] = useState('');
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!reason) return setError('Please choose a reason');
    if (reason === 'other' && !comments.trim()) return setError('Please tell us why you want to cancel');
    if (!policyAccepted) return setError('Please accept the cancellation & refund policy');
    setSubmitting(true);
    try {
      await onSubmit({ reason, comments: comments.trim(), policyAccepted });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit the request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-order-title"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h2 id="cancel-order-title" className="text-xl font-bold text-gray-900">
          Cancel order #{orderNumber}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {immediateCancel
            ? "This order hasn't been paid, so it will be cancelled straight away."
            : 'Our team will review your request and email you the outcome.'}
        </p>

        <label className="mt-5 block text-sm font-medium text-gray-700" htmlFor="cancel-reason">
          Reason for cancellation <span className="text-red-600">*</span>
        </label>
        <select
          id="cancel-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value as CancellationReason)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a reason</option>
          {(Object.keys(CANCELLATION_REASON_LABELS) as CancellationReason[]).map((key) => (
            <option key={key} value={key}>
              {CANCELLATION_REASON_LABELS[key]}
            </option>
          ))}
        </select>

        <label className="mt-4 block text-sm font-medium text-gray-700" htmlFor="cancel-comments">
          Comments {reason === 'other' && <span className="text-red-600">*</span>}
        </label>
        <textarea
          id="cancel-comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Anything we should know?"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {!immediateCancel && (
          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            <p className="font-semibold text-gray-900">Cancellation & refund policy</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {REFUND_POLICY_POINTS.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        )}

        <label className="mt-4 flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={policyAccepted}
            onChange={(e) => setPolicyAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            I have read and accept the cancellation & refund policy <span className="text-red-600">*</span>
          </span>
        </label>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Keep my order
          </Button>
          <Button type="submit" disabled={submitting} className="bg-red-600 text-white hover:bg-red-700">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {immediateCancel ? 'Cancel order' : 'Submit request'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default OrderCancellationSection;
