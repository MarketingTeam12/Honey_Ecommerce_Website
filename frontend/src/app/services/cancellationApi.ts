import { API_URL } from '@/app/utils/api';
import { buildHeaders } from '@/app/utils/buildHeaders';

export type CancellationReason =
  | 'placed_by_mistake'
  | 'wrong_language_or_document'
  | 'delay'
  | 'found_another_provider'
  | 'other';

export const CANCELLATION_REASON_LABELS: Record<CancellationReason, string> = {
  placed_by_mistake: 'Placed by mistake',
  wrong_language_or_document: 'Wrong language or document',
  delay: 'Delay in delivery',
  found_another_provider: 'Found another provider',
  other: 'Other',
};

export type CancellationStatus = 'REQUESTED' | 'APPROVED' | 'DECLINED' | 'WITHDRAWN';
export type RefundStatus = 'NONE' | 'INITIATED' | 'PROCESSED' | 'FAILED';

export interface CancellationEligibility {
  status: string;
  paid: boolean;
  amountPaid: number;
  maxRefundAmount: number;
  eligible: boolean;
  requiresApproval: boolean;
  immediateCancel: boolean;
  suggestedRefundPct: number;
  suggestedRefundAmount: number;
  reason: string | null;
}

export interface CancellationRequest {
  id: string;
  orderId: string;
  reason: CancellationReason;
  comments: string | null;
  status: CancellationStatus;
  orderStatusAtRequest: string | null;
  suggestedRefundAmount: number;
  approvedRefundAmount: number | null;
  refundType: 'FULL' | 'PARTIAL' | 'NONE' | null;
  adminId?: string | null;
  adminDecisionReason: string | null;
  decidedAt: string | null;
  createdAt: string;
  order?: {
    id: string;
    orderNumber: string;
    customerName?: string;
    customerEmail?: string;
    totalAmount?: number;
    status?: string;
    paymentStatus?: string;
    refundStatus?: RefundStatus;
    refundAmount?: number;
  };
}

export interface RefundRecord {
  id: string;
  amount: number;
  status: RefundStatus;
  refundType?: string;
  razorpayRefundId: string | null;
  razorpayPaymentId?: string | null;
  refundedAt: string | null;
  failureReason?: string | null;
  manualRefundNote?: string | null;
  creditNoteNumber?: string | null;
  creditNoteAvailable?: boolean;
  creditNotePath?: string | null;
  attempts?: number;
  createdAt: string;
}

export interface TimelineEvent {
  action: string;
  actorType: string;
  actorId?: string | null;
  createdAt: string;
  details?: Record<string, unknown> | null;
}

export interface CustomerCancellationView {
  eligibility: CancellationEligibility;
  request: CancellationRequest | null;
  refunds: RefundRecord[];
  timeline: TimelineEvent[];
}

export interface AdminCancellationView {
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    transactionId: string | null;
  };
  eligibility: CancellationEligibility;
  request: CancellationRequest | null;
  refunds: RefundRecord[];
  timeline: TimelineEvent[];
}

export interface CancellationStats {
  cancellations: number;
  totalRefunded: number;
  refundsProcessed: number;
  pendingRequests: number;
  topReasons: { reason: string; label: string; count: number }[];
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...buildHeaders(), ...(init.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || data?.message || `Request failed (${response.status})`);
  }
  return data as T;
}

const post = <T>(path: string, body?: unknown) =>
  call<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });

// ---------------------------------------------------------------- customer

export const getOrderCancellation = (orderId: string) =>
  call<CustomerCancellationView>(`/orders/${encodeURIComponent(orderId)}/cancellation`);

export const requestCancellation = (
  orderId: string,
  input: { reason: CancellationReason; comments: string; policyAccepted: boolean },
) => post<{ request: CancellationRequest; immediateCancel: boolean }>(`/orders/${encodeURIComponent(orderId)}/cancellation-request`, input);

export const withdrawCancellation = (orderId: string) =>
  post<{ request: CancellationRequest }>(`/orders/${encodeURIComponent(orderId)}/cancellation-request/withdraw`);

export async function downloadCreditNote(orderId: string, fileName = 'credit-note.pdf') {
  const response = await fetch(`${API_URL}/orders/${encodeURIComponent(orderId)}/credit-note`, { headers: buildHeaders() });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || 'Credit note is not available yet');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// ------------------------------------------------------------------- admin

export const listCancellationRequests = (status?: CancellationStatus) =>
  call<{ requests: CancellationRequest[]; pendingCount: number }>(
    `/admin/cancellation-requests${status ? `?status=${status}` : ''}`,
  );

export const getAdminOrderCancellation = (orderId: string) =>
  call<AdminCancellationView>(`/admin/orders/${encodeURIComponent(orderId)}/cancellation`);

export const approveCancellation = (
  requestId: string,
  input: { refundType: 'FULL' | 'PARTIAL'; amount?: number; reason?: string },
) => post<{ request: CancellationRequest; refund: RefundRecord | null }>(`/admin/cancellation-requests/${encodeURIComponent(requestId)}/approve`, input);

export const declineCancellation = (requestId: string, reason: string) =>
  post<{ request: CancellationRequest }>(`/admin/cancellation-requests/${encodeURIComponent(requestId)}/decline`, { reason });

export const retryRefund = (refundId: string) =>
  post<{ refund: RefundRecord }>(`/admin/refunds/${encodeURIComponent(refundId)}/retry`);

export const markRefundManual = (refundId: string, note: string) =>
  post<{ refund: RefundRecord }>(`/admin/refunds/${encodeURIComponent(refundId)}/mark-manual`, { note });

export const getCancellationStats = (range: { from?: string; to?: string } = {}) => {
  const params = new URLSearchParams();
  if (range.from) params.set('from', range.from);
  if (range.to) params.set('to', range.to);
  const query = params.toString();
  return call<{ stats: CancellationStats }>(`/admin/reports/cancellations${query ? `?${query}` : ''}`);
};

// ----------------------------------------------------------------- display

export const formatInr = (value: number | null | undefined) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const REFUND_STATUS_LABELS: Record<RefundStatus, string> = {
  NONE: 'No refund',
  INITIATED: 'Refund initiated',
  PROCESSED: 'Refunded',
  FAILED: 'Refund failed',
};

export const formatDate = (value?: string | null) =>
  value
    ? new Date(String(value).replace(' ', 'T')).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
