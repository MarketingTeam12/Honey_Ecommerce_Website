/**
 * In-memory implementation of the cancellation repository interface
 * (services/cancellationRepository.js) for tests. It mirrors the MySQL
 * behaviour that matters: the one-active-request UNIQUE key and
 * transaction rollback on error.
 */
let seq = 0;
const nextId = (prefix) => `${prefix}_${++seq}`;
const now = () => new Date(Date.now() + seq).toISOString().slice(0, 19).replace("T", " ");

const ORDER_KEY_MAP = {
  status: "status",
  paymentStatus: "payment_status",
  cancellationStatus: "cancellation_status",
  refundStatus: "refund_status",
  refundAmount: "refund_amount",
  refundedAt: "refunded_at",
  trackingNumber: "tracking_number",
  shippingCarrier: "shipping_carrier",
};

function createFakeStore(initial = {}) {
  let state = {
    orders: {},
    requests: {},
    refunds: {},
    events: [],
    webhookEvents: new Set(),
  };
  for (const order of initial.orders || []) {
    state.orders[order.id] = { refund_status: "NONE", refund_amount: 0, cancellation_status: null, ...order };
  }

  const clone = (value) => (value == null ? value : structuredClone(value));
  const strip = (patch) => Object.fromEntries(Object.entries(patch || {}).filter(([, v]) => v !== undefined));

  const repo = {
    async getOrder(id) {
      return clone(state.orders[id] || null);
    },
    async updateOrder(id, patch) {
      const order = state.orders[id];
      for (const [key, value] of Object.entries(strip(patch))) order[ORDER_KEY_MAP[key]] = value;
    },
    async getActiveRequestForOrder(orderId) {
      return clone(Object.values(state.requests).find((r) => r.orderId === orderId && r.status === "REQUESTED") || null);
    },
    async getLatestRequestForOrder(orderId) {
      const list = Object.values(state.requests).filter((r) => r.orderId === orderId);
      return clone(list[list.length - 1] || null);
    },
    async getRequest(id) {
      return clone(state.requests[id] || null);
    },
    async insertRequest(data) {
      const status = data.status || "REQUESTED";
      if (status === "REQUESTED" && Object.values(state.requests).some((r) => r.orderId === data.orderId && r.status === "REQUESTED")) {
        const error = new Error("Duplicate entry for key uniq_cancellation_active_order");
        error.code = "ER_DUP_ENTRY";
        error.errno = 1062;
        throw error;
      }
      const id = data.id || nextId("cxl");
      state.requests[id] = {
        id,
        approvedRefundAmount: null,
        refundType: null,
        adminId: null,
        adminDecisionReason: null,
        decidedAt: null,
        ...data,
        status,
        createdAt: now(),
      };
      return clone(state.requests[id]);
    },
    async updateRequest(id, patch) {
      Object.assign(state.requests[id], strip(patch));
      return clone(state.requests[id]);
    },
    async listRequests({ status } = {}) {
      return clone(
        Object.values(state.requests)
          .filter((r) => !status || r.status === status)
          .map((r) => ({ ...r, order: { id: r.orderId, orderNumber: state.orders[r.orderId]?.order_number } })),
      );
    },
    async countRequests(status) {
      return Object.values(state.requests).filter((r) => r.status === status).length;
    },
    async insertRefund(data) {
      const id = data.id || nextId("rfnd");
      state.refunds[id] = {
        id,
        razorpayRefundId: null,
        attempts: 0,
        refundedAt: null,
        failureReason: null,
        manualRefundNote: null,
        creditNoteNumber: null,
        creditNotePath: null,
        ...data,
        status: data.status || "INITIATED",
        idempotencyKey: data.idempotencyKey || id,
        createdAt: now(),
      };
      return clone(state.refunds[id]);
    },
    async getRefund(id) {
      return clone(state.refunds[id] || null);
    },
    async getRefundByRazorpayId(razorpayRefundId) {
      return clone(Object.values(state.refunds).find((r) => r.razorpayRefundId === razorpayRefundId) || null);
    },
    async listRefundsForOrder(orderId) {
      return clone(Object.values(state.refunds).filter((r) => r.orderId === orderId));
    },
    async updateRefund(id, patch) {
      Object.assign(state.refunds[id], strip(patch));
      return clone(state.refunds[id]);
    },
    async insertEvent(event) {
      state.events.push({ id: state.events.length + 1, createdAt: now(), ...clone(event) });
    },
    async listEvents(orderId) {
      return clone(state.events.filter((e) => e.orderId === orderId));
    },
    async hasWebhookEvent(eventId) {
      return state.webhookEvents.has(eventId);
    },
    async recordWebhookEvent(eventId) {
      state.webhookEvents.add(eventId);
    },
    async getCancellationStats() {
      const requests = Object.values(state.requests);
      const processed = Object.values(state.refunds).filter((r) => r.status === "PROCESSED");
      const counts = {};
      for (const r of requests) counts[r.reason] = (counts[r.reason] || 0) + 1;
      return {
        cancellations: requests.filter((r) => r.status === "APPROVED").length,
        totalRefunded: processed.reduce((sum, r) => sum + Number(r.amount), 0),
        refundsProcessed: processed.length,
        pendingRequests: requests.filter((r) => r.status === "REQUESTED").length,
        topReasons: Object.entries(counts)
          .map(([reason, count]) => ({ reason, count }))
          .sort((a, b) => b.count - a.count),
      };
    },
  };

  return {
    ...repo,
    // Snapshot + restore gives real rollback semantics.
    async withTransaction(fn) {
      const snapshot = {
        ...structuredClone({ orders: state.orders, requests: state.requests, refunds: state.refunds, events: state.events }),
        webhookEvents: new Set(state.webhookEvents),
      };
      try {
        return await fn(repo);
      } catch (error) {
        state = snapshot;
        throw error;
      }
    },
    /** Test-only: raw state access. */
    _state: () => state,
  };
}

/** Fake Razorpay gateway recording every call. */
function createFakeGateway({ amountPaise = 47200, amountRefundedPaise = 0, refundStatus = "pending", failRefund = null } = {}) {
  const calls = { fetchPayment: [], createRefund: [], listRefunds: [] };
  const refunds = [];
  let failNext = failRefund;
  return {
    calls,
    refunds,
    setFailNext(message) {
      failNext = message;
    },
    async fetchPayment(paymentId) {
      calls.fetchPayment.push(paymentId);
      return { id: paymentId, amount: amountPaise, amount_refunded: amountRefundedPaise, status: "captured" };
    },
    async listRefunds(paymentId) {
      calls.listRefunds.push(paymentId);
      return { items: refunds.filter((r) => r.payment_id === paymentId) };
    },
    async createRefund(paymentId, params) {
      calls.createRefund.push({ paymentId, params });
      if (failNext) {
        const message = failNext;
        failNext = null;
        const error = new Error(message);
        error.error = { description: message };
        throw error;
      }
      const refund = {
        id: `rfnd_rzp_${refunds.length + 1}`,
        payment_id: paymentId,
        amount: params.amount,
        receipt: params.receipt,
        notes: params.notes,
        status: refundStatus,
      };
      refunds.push(refund);
      return refund;
    },
  };
}

module.exports = { createFakeStore, createFakeGateway };
