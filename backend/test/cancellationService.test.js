const test = require("node:test");
const assert = require("node:assert/strict");
const { createCancellationService } = require("../services/cancellationService");
const { createFakeStore, createFakeGateway } = require("./helpers/fakeStore");

const customer = { id: "user_1", email: "cust@example.com", role: "customer" };
const otherCustomer = { id: "user_2", email: "other@example.com", role: "customer" };
const admin = { id: "admin_1", email: "admin@example.com", role: "admin" };

function makeOrder(overrides = {}) {
  return {
    id: "order_1",
    order_number: "HT100",
    user_id: customer.id,
    customer_email: customer.email,
    customer_name: "Cust",
    status: "confirmed",
    payment_status: "paid",
    total_amount: 472,
    transaction_id: "pay_123",
    tracking_number: null,
    ...overrides,
  };
}

function setup({ order = makeOrder(), gatewayOptions } = {}) {
  const store = createFakeStore({ orders: [order] });
  const gateway = createFakeGateway(gatewayOptions);
  const sent = [];
  const emails = new Proxy({}, { get: (_t, name) => async (payload) => sent.push({ name, payload }) });
  const adminNotifications = [];
  const creditNotes = { generate: async ({ refund }) => ({ number: `CN-HT100-1`, path: `${refund.id}.pdf` }) };
  const logger = { error: () => {} };
  const service = createCancellationService({
    store,
    gateway,
    emails,
    notifier: { notifyAdmin: async (n) => adminNotifications.push(n) },
    creditNotes,
    logger,
  });
  const flush = () => new Promise((resolve) => setImmediate(resolve));
  return { store, gateway, service, sent, adminNotifications, flush };
}

const validInput = { reason: "placed_by_mistake", comments: "", policyAccepted: true };

// ------------------------------------------------------------ customer side

test("customer can request cancellation of an eligible paid order", async () => {
  const { service, store, sent, adminNotifications, flush } = setup();
  const { request, immediateCancel } = await service.requestCancellation("order_1", customer, validInput);
  await flush();

  assert.equal(immediateCancel, false);
  assert.equal(request.status, "REQUESTED");
  assert.equal(request.orderStatusAtRequest, "confirmed");
  assert.equal(request.suggestedRefundAmount, 472);
  const order = store._state().orders.order_1;
  assert.equal(order.cancellation_status, "REQUESTED");
  assert.equal(order.status, "confirmed", "main order status is untouched while under review");
  assert.ok(sent.some((e) => e.name === "customerRequestReceived"));
  assert.ok(sent.some((e) => e.name === "adminNewRequest"));
  assert.equal(adminNotifications.length, 1);
  assert.ok(store._state().events.some((e) => e.action === "cancellation_requested"));
});

test("validation: reason, policy checkbox and comments for 'other'", async () => {
  const { service } = setup();
  await assert.rejects(service.requestCancellation("order_1", customer, { ...validInput, reason: "bogus" }), { status: 400 });
  await assert.rejects(service.requestCancellation("order_1", customer, { ...validInput, policyAccepted: false }), { status: 400 });
  await assert.rejects(service.requestCancellation("order_1", customer, { ...validInput, reason: "other" }), { status: 400 });
});

test("customer cannot cancel someone else's order", async () => {
  const { service } = setup();
  await assert.rejects(service.requestCancellation("order_1", otherCustomer, validInput), { status: 403 });
  await assert.rejects(service.getCustomerView("order_1", otherCustomer), { status: 403 });
});

test("duplicate active request is rejected", async () => {
  const { service } = setup();
  await service.requestCancellation("order_1", customer, validInput);
  await assert.rejects(service.requestCancellation("order_1", customer, validInput), { status: 409 });
});

test("ineligible statuses are rejected server-side", async () => {
  const { service } = setup({ order: makeOrder({ status: "shipped" }) });
  await assert.rejects(service.requestCancellation("order_1", customer, validInput), { status: 409 });
});

test("unpaid order is cancelled immediately with no refund or admin approval", async () => {
  const { service, store, gateway, adminNotifications, flush } = setup({
    order: makeOrder({ payment_status: "pending", transaction_id: null }),
  });
  const { request, immediateCancel } = await service.requestCancellation("order_1", customer, validInput);
  await flush();
  assert.equal(immediateCancel, true);
  assert.equal(request.status, "APPROVED");
  assert.equal(request.refundType, "NONE");
  assert.equal(store._state().orders.order_1.status, "cancelled");
  assert.equal(Object.keys(store._state().refunds).length, 0);
  assert.equal(gateway.calls.createRefund.length, 0);
  assert.equal(adminNotifications.length, 0);
});

test("customer can withdraw a pending request, then request again", async () => {
  const { service, store } = setup();
  await service.requestCancellation("order_1", customer, validInput);
  const { request } = await service.withdrawRequest("order_1", customer);
  assert.equal(request.status, "WITHDRAWN");
  assert.equal(store._state().orders.order_1.cancellation_status, "WITHDRAWN");
  await assert.rejects(service.withdrawRequest("order_1", customer), { status: 409 });
  const again = await service.requestCancellation("order_1", customer, validInput);
  assert.equal(again.request.status, "REQUESTED");
});

test("another customer cannot withdraw the request", async () => {
  const { service } = setup();
  await service.requestCancellation("order_1", customer, validInput);
  await assert.rejects(service.withdrawRequest("order_1", otherCustomer), { status: 403 });
});

// ---------------------------------------------------------------- admin side

test("approve with full refund: cancels order and refunds the amount paid via Razorpay", async () => {
  const { service, store, gateway, sent, flush } = setup();
  const { request } = await service.requestCancellation("order_1", customer, validInput);
  const result = await service.approveRequest(request.id, admin, { refundType: "FULL" });
  await flush();

  assert.equal(result.request.status, "APPROVED");
  assert.equal(result.request.approvedRefundAmount, 472);
  assert.equal(result.refund.status, "INITIATED");
  assert.equal(result.refund.razorpayRefundId, "rfnd_rzp_1");
  assert.equal(gateway.calls.createRefund.length, 1);
  assert.equal(gateway.calls.createRefund[0].paymentId, "pay_123");
  assert.equal(gateway.calls.createRefund[0].params.amount, 47200, "amount is sent in paise");
  assert.equal(gateway.calls.createRefund[0].params.receipt, result.refund.idempotencyKey);
  const order = store._state().orders.order_1;
  assert.equal(order.status, "cancelled");
  assert.equal(order.cancellation_status, "APPROVED");
  assert.equal(order.refund_status, "INITIATED");
  assert.equal(order.refund_amount, 472);
  assert.ok(sent.some((e) => e.name === "customerApproved"));
});

test("approve with partial refund requires amount and reason, and caps at amount paid", async () => {
  const { service, gateway } = setup();
  const { request } = await service.requestCancellation("order_1", customer, validInput);
  await assert.rejects(service.approveRequest(request.id, admin, { refundType: "PARTIAL", amount: 100 }), { status: 400 });
  await assert.rejects(service.approveRequest(request.id, admin, { refundType: "PARTIAL", reason: "work done" }), { status: 400 });
  await assert.rejects(
    service.approveRequest(request.id, admin, { refundType: "PARTIAL", amount: 500, reason: "too much" }),
    { status: 400 },
  );
  const result = await service.approveRequest(request.id, admin, { refundType: "PARTIAL", amount: 236, reason: "Half done" });
  assert.equal(result.refund.amount, 236);
  assert.equal(result.refund.refundType, "PARTIAL");
  assert.equal(gateway.calls.createRefund[0].params.amount, 23600);
});

test("refund is capped by what Razorpay says is still refundable", async () => {
  const { service } = setup({ gatewayOptions: { amountPaise: 47200, amountRefundedPaise: 7200 } });
  const { request } = await service.requestCancellation("order_1", customer, validInput);
  const result = await service.approveRequest(request.id, admin, { refundType: "FULL" });
  assert.equal(result.refund.amount, 400);
});

test("a request cannot be approved twice (no double refund)", async () => {
  const { service, gateway } = setup();
  const { request } = await service.requestCancellation("order_1", customer, validInput);
  await service.approveRequest(request.id, admin, { refundType: "FULL" });
  await assert.rejects(service.approveRequest(request.id, admin, { refundType: "FULL" }), { status: 409 });
  await assert.rejects(service.declineRequest(request.id, admin, { reason: "late" }), { status: 409 });
  assert.equal(gateway.calls.createRefund.length, 1);
});

test("decline requires a reason and restores the order status at request time", async () => {
  const { service, store, sent, flush } = setup({ order: makeOrder({ status: "translator-working" }) });
  const { request } = await service.requestCancellation("order_1", customer, validInput);
  // Simulate the order being put on hold while the request was reviewed.
  store._state().orders.order_1.status = "on-hold";

  await assert.rejects(service.declineRequest(request.id, admin, {}), { status: 400 });
  const result = await service.declineRequest(request.id, admin, { reason: "Translation already delivered as draft" });
  await flush();
  assert.equal(result.request.status, "DECLINED");
  assert.equal(result.request.adminDecisionReason, "Translation already delivered as draft");
  const order = store._state().orders.order_1;
  assert.equal(order.status, "translator-working");
  assert.equal(order.cancellation_status, "DECLINED");
  assert.ok(sent.some((e) => e.name === "customerDeclined"));
});

test("approving a request detaches an existing shipment", async () => {
  const { service, store } = setup({ order: makeOrder({ tracking_number: "TRK1", shipping_carrier: "BlueDart" }) });
  const { request } = await service.requestCancellation("order_1", customer, validInput);
  await service.approveRequest(request.id, admin, { refundType: "FULL" });
  assert.equal(store._state().orders.order_1.tracking_number, null);
  assert.ok(store._state().events.some((e) => e.action === "shipment_cancelled"));
});

test("partial approval of ₹0 cancels without calling Razorpay", async () => {
  const { service, gateway, store } = setup({ order: makeOrder({ status: "draft" }) });
  const { request } = await service.requestCancellation("order_1", customer, validInput);
  const result = await service.approveRequest(request.id, admin, { refundType: "PARTIAL", amount: 0, reason: "Draft delivered" });
  assert.equal(result.refund, null);
  assert.equal(result.request.refundType, "NONE");
  assert.equal(gateway.calls.createRefund.length, 0);
  assert.equal(store._state().orders.order_1.status, "cancelled");
});

// ------------------------------------------------------------------ refunds

test("Razorpay failure marks the refund FAILED and alerts admin; retry succeeds", async () => {
  const { service, store, gateway, adminNotifications, sent, flush } = setup({
    gatewayOptions: { failRefund: "Insufficient balance" },
  });
  const { request } = await service.requestCancellation("order_1", customer, validInput);
  const { refund } = await service.approveRequest(request.id, admin, { refundType: "FULL" });
  await flush();

  assert.equal(refund.status, "FAILED");
  assert.match(refund.failureReason, /Insufficient balance/);
  assert.equal(store._state().orders.order_1.refund_status, "FAILED");
  assert.ok(adminNotifications.some((n) => n.metadata.type === "refund_failed"));
  assert.ok(sent.some((e) => e.name === "customerRefundFailed"));

  const retried = await service.retryRefund(refund.id, admin);
  assert.equal(retried.status, "INITIATED");
  assert.equal(gateway.calls.createRefund.length, 2);
  assert.equal(gateway.refunds.length, 1);
});

test("retry adopts a refund Razorpay already created instead of refunding twice", async () => {
  const { service, store, gateway } = setup();
  const { request } = await service.requestCancellation("order_1", customer, validInput);
  const { refund } = await service.approveRequest(request.id, admin, { refundType: "FULL" });
  // Simulate: Razorpay created the refund but our side recorded a failure (e.g. timeout).
  Object.assign(store._state().refunds[refund.id], { status: "FAILED", razorpayRefundId: null });

  const retried = await service.retryRefund(refund.id, admin);
  assert.equal(retried.status, "INITIATED");
  assert.equal(retried.razorpayRefundId, "rfnd_rzp_1");
  assert.equal(gateway.calls.createRefund.length, 1, "no second refund was created");
});

test("only FAILED refunds can be retried or marked manually", async () => {
  const { service } = setup();
  const { request } = await service.requestCancellation("order_1", customer, validInput);
  const { refund } = await service.approveRequest(request.id, admin, { refundType: "FULL" });
  await assert.rejects(service.retryRefund(refund.id, admin), { status: 409 });
  await assert.rejects(service.markRefundedManually(refund.id, admin, { note: "paid by NEFT" }), { status: 409 });
});

test("mark refunded manually requires a note and completes the refund", async () => {
  const { service, store, flush } = setup({ gatewayOptions: { failRefund: "Gateway down" } });
  const { request } = await service.requestCancellation("order_1", customer, validInput);
  const { refund } = await service.approveRequest(request.id, admin, { refundType: "FULL" });
  await assert.rejects(service.markRefundedManually(refund.id, admin, { note: "" }), { status: 400 });
  const result = await service.markRefundedManually(refund.id, admin, { note: "Paid by bank transfer UTR123" });
  await flush();
  assert.equal(result.refund.status, "PROCESSED");
  assert.equal(result.refund.manualRefundNote, "Paid by bank transfer UTR123");
  assert.equal(store._state().orders.order_1.payment_status, "refunded");
});

// ------------------------------------------------------------------ webhook

async function approvedRefund(options) {
  const ctx = setup(options);
  const { request } = await ctx.service.requestCancellation("order_1", customer, validInput);
  const { refund } = await ctx.service.approveRequest(request.id, admin, options?.approve || { refundType: "FULL" });
  return { ...ctx, refund };
}

test("webhook refund.processed marks refund and payment as refunded, with credit note", async () => {
  const { service, store, sent, flush, refund } = await approvedRefund();
  const result = await service.handleRefundWebhook({
    eventId: "evt_1",
    event: "refund.processed",
    refundEntity: { id: "rfnd_rzp_1", receipt: refund.idempotencyKey, status: "processed" },
  });
  await flush();
  await flush();
  assert.equal(result.handled, true);
  const stored = store._state().refunds[refund.id];
  assert.equal(stored.status, "PROCESSED");
  assert.ok(stored.refundedAt);
  assert.equal(stored.creditNoteNumber, "CN-HT100-1");
  const order = store._state().orders.order_1;
  assert.equal(order.refund_status, "PROCESSED");
  assert.equal(order.payment_status, "refunded");
  assert.ok(order.refunded_at);
  assert.ok(sent.some((e) => e.name === "customerRefundCompleted"));
});

test("webhook marks partial refunds as partially_refunded", async () => {
  const { service, store, refund } = await approvedRefund({
    approve: { refundType: "PARTIAL", amount: 100, reason: "Work started" },
  });
  await service.handleRefundWebhook({ eventId: "evt_p", event: "refund.processed", refundEntity: { id: refund.razorpayRefundId } });
  assert.equal(store._state().orders.order_1.payment_status, "partially_refunded");
});

test("webhook is idempotent: duplicate event ids and repeated events are ignored", async () => {
  const { service, store, sent, flush, refund } = await approvedRefund();
  const payload = { eventId: "evt_dup", event: "refund.processed", refundEntity: { id: refund.razorpayRefundId } };
  await service.handleRefundWebhook(payload);
  await flush();
  const completedEmails = () => sent.filter((e) => e.name === "customerRefundCompleted").length;
  const before = completedEmails();
  const second = await service.handleRefundWebhook(payload);
  assert.equal(second.duplicate, true);
  // Same refund, different event id (Razorpay redelivery with a new id) — still a no-op.
  await service.handleRefundWebhook({ ...payload, eventId: "evt_dup_2" });
  await flush();
  assert.equal(completedEmails(), before);
  assert.equal(store._state().events.filter((e) => e.action === "refund_processed").length, 1);
});

test("webhook refund.failed flags the refund for admin", async () => {
  const { service, store, adminNotifications, refund } = await approvedRefund();
  await service.handleRefundWebhook({
    eventId: "evt_f",
    event: "refund.failed",
    refundEntity: { id: refund.razorpayRefundId, error_description: "Bank account closed" },
  });
  const stored = store._state().refunds[refund.id];
  assert.equal(stored.status, "FAILED");
  assert.equal(stored.failureReason, "Bank account closed");
  assert.equal(store._state().orders.order_1.refund_status, "FAILED");
  assert.ok(adminNotifications.some((n) => n.metadata.type === "refund_failed"));
});

test("refund.failed after refund.processed does not downgrade the refund", async () => {
  const { service, store, refund } = await approvedRefund();
  await service.handleRefundWebhook({ eventId: "e1", event: "refund.processed", refundEntity: { id: refund.razorpayRefundId } });
  await service.handleRefundWebhook({ eventId: "e2", event: "refund.failed", refundEntity: { id: refund.razorpayRefundId } });
  assert.equal(store._state().refunds[refund.id].status, "PROCESSED");
});

test("webhook for an unknown refund is acknowledged without changes", async () => {
  const { service } = setup();
  const result = await service.handleRefundWebhook({ eventId: "e9", event: "refund.processed", refundEntity: { id: "rfnd_other" } });
  assert.equal(result.handled, false);
  assert.equal(result.unknownRefund, true);
});

test("instantly processed refunds (test mode) complete without waiting for the webhook", async () => {
  const { store, refund } = await approvedRefund({ gatewayOptions: { refundStatus: "processed" } });
  assert.equal(refund.status, "PROCESSED");
  assert.equal(store._state().orders.order_1.payment_status, "refunded");
});

// ------------------------------------------------------------------ views

test("customer view hides admin id and internal events; admin view shows everything", async () => {
  const { service } = setup();
  const { request } = await service.requestCancellation("order_1", customer, validInput);
  await service.declineRequest(request.id, admin, { reason: "Already in progress" });
  const view = await service.getCustomerView("order_1", customer);
  assert.equal(view.request.adminId, undefined);
  assert.equal(view.request.adminDecisionReason, "Already in progress");
  assert.ok(view.timeline.every((e) => e.action !== "refund_retry"));
  const adminView = await service.getAdminView("order_1");
  assert.equal(adminView.request.adminId, admin.id);
});

test("stats report cancellations, refunds and top reasons", async () => {
  const { service, refund } = await approvedRefund();
  await service.handleRefundWebhook({ eventId: "s1", event: "refund.processed", refundEntity: { id: refund.razorpayRefundId } });
  const stats = await service.getStats({});
  assert.equal(stats.cancellations, 1);
  assert.equal(stats.totalRefunded, 472);
  assert.equal(stats.topReasons[0].label, "Placed by mistake");
});
