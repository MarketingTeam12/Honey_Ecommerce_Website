/**
 * Order cancellation & refund workflow.
 *
 * All dependencies are injected so the workflow can be unit-tested without
 * MySQL or Razorpay:
 *   store      – repository + withTransaction (see cancellationRepository.js)
 *   gateway    – { fetchPayment, createRefund, listRefunds } (Razorpay)
 *   emails     – customer/admin email senders (see cancellationEmails.js)
 *   notifier   – { notifyAdmin({ title, message, metadata }) } (admin bell)
 *   creditNotes – { generate({ order, refund }) } -> { number, path } (optional)
 */
const policy = require("./cancellationPolicy");
const { nowSql } = require("./cancellationRepository");

const ADMIN_ACTIONS_REFUND_TYPES = new Set(["FULL", "PARTIAL"]);

function httpError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  if (code) error.code = code;
  return error;
}

function isOrderOwner(order, user) {
  if (!order || !user) return false;
  const userEmail = String(user.email || "").trim().toLowerCase();
  const orderEmail = String(order.customer_email || "").trim().toLowerCase();
  return Boolean(
    (user.id && order.user_id && String(user.id) === String(order.user_id)) ||
      (userEmail && orderEmail && userEmail === orderEmail),
  );
}

function orderSummary(order) {
  return {
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    totalAmount: Number(order.total_amount || 0),
    status: order.status,
    paymentStatus: order.payment_status,
    transactionId: order.transaction_id || null,
  };
}

// Events customers may see on their timeline (internal admin notes stay hidden).
const CUSTOMER_VISIBLE_EVENTS = new Set([
  "cancellation_requested",
  "cancellation_withdrawn",
  "cancellation_declined",
  "cancellation_approved",
  "order_cancelled_unpaid",
  "refund_initiated",
  "refund_processed",
  "refund_failed",
  "refund_marked_manual",
]);

function createCancellationService({ store, gateway, emails = {}, notifier = {}, creditNotes = null, logger = console }) {
  const safe = (label, promise) =>
    Promise.resolve(promise).catch((error) => logger.error(`[cancellation] ${label} failed:`, error?.message || error));
  const email = (name, payload) => (typeof emails[name] === "function" ? safe(`email:${name}`, emails[name](payload)) : null);
  const notifyAdmin = (payload) =>
    typeof notifier.notifyAdmin === "function" ? safe("admin notification", notifier.notifyAdmin(payload)) : null;

  // ---------------------------------------------------------------- reads

  async function getCustomerView(orderId, user) {
    const order = await store.getOrder(orderId);
    if (!order) throw httpError(404, "Order not found");
    if (!isOrderOwner(order, user)) throw httpError(403, "You can only view your own orders");

    const [request, refunds, events] = await Promise.all([
      store.getLatestRequestForOrder(orderId),
      store.listRefundsForOrder(orderId),
      store.listEvents(orderId),
    ]);
    const eligibility = policy.evaluateCancellation(order, {
      activeRequest: request && request.status === "REQUESTED" ? request : null,
    });

    return {
      orderId,
      eligibility,
      request: request ? { ...request, adminId: undefined } : null,
      refunds: refunds.map((refund) => ({
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
        razorpayRefundId: refund.razorpayRefundId,
        refundedAt: refund.refundedAt,
        creditNoteNumber: refund.creditNoteNumber || null,
        creditNoteAvailable: Boolean(refund.creditNotePath),
        createdAt: refund.createdAt,
      })),
      timeline: events
        .filter((event) => CUSTOMER_VISIBLE_EVENTS.has(event.action))
        .map(({ action, actorType, createdAt, details }) => ({
          action,
          actorType,
          createdAt,
          details: details && { amount: details.amount, reason: details.publicReason },
        })),
    };
  }

  async function getAdminView(orderId) {
    const order = await store.getOrder(orderId);
    if (!order) throw httpError(404, "Order not found");
    const [request, refunds, events] = await Promise.all([
      store.getLatestRequestForOrder(orderId),
      store.listRefundsForOrder(orderId),
      store.listEvents(orderId),
    ]);
    const eligibility = policy.evaluateCancellation(order, {
      activeRequest: request && request.status === "REQUESTED" ? request : null,
    });
    // For a pending request, show the suggestion as it was computed at request time.
    return {
      order: orderSummary(order),
      eligibility,
      request,
      refunds,
      timeline: events,
    };
  }

  async function listRequests({ status } = {}) {
    const normalized = status ? String(status).toUpperCase() : undefined;
    const [requests, pendingCount] = await Promise.all([
      store.listRequests({ status: normalized }),
      store.countRequests("REQUESTED"),
    ]);
    return { requests, pendingCount };
  }

  // ------------------------------------------------------------- customer

  async function requestCancellation(orderId, user, input = {}) {
    const reason = String(input.reason || "").trim();
    const comments = String(input.comments || "").trim();
    if (!policy.CANCELLATION_REASONS[reason]) throw httpError(400, "Please choose a valid cancellation reason");
    if (reason === "other" && !comments) throw httpError(400, "Please tell us why you want to cancel");
    if (comments.length > 2000) throw httpError(400, "Comments must be 2000 characters or fewer");
    if (input.policyAccepted !== true) throw httpError(400, "Please accept the cancellation & refund policy");

    let result;
    try {
      result = await store.withTransaction(async (tx) => {
        const order = await tx.getOrder(orderId, { forUpdate: true });
        if (!order) throw httpError(404, "Order not found");
        if (!isOrderOwner(order, user)) throw httpError(403, "You can only cancel your own orders");

        const activeRequest = await tx.getActiveRequestForOrder(orderId, { forUpdate: true });
        if (activeRequest) throw httpError(409, "A cancellation request is already under review for this order");

        const eligibility = policy.evaluateCancellation(order);
        if (!eligibility.eligible) throw httpError(409, eligibility.reason || "This order is not eligible for cancellation");

        if (eligibility.immediateCancel) {
          // Unpaid: cancel straight away — no admin approval, nothing to refund.
          const request = await tx.insertRequest({
            orderId,
            customerId: user.id,
            reason,
            comments,
            policyAccepted: true,
            status: "APPROVED",
            orderStatusAtRequest: order.status,
            suggestedRefundAmount: 0,
            approvedRefundAmount: 0,
            refundType: "NONE",
            adminDecisionReason: "Automatically cancelled: order was not paid",
            decidedAt: nowSql(),
          });
          await tx.updateOrder(orderId, { status: "cancelled", cancellationStatus: "APPROVED", refundStatus: "NONE" });
          await tx.insertEvent({
            orderId,
            actorType: "customer",
            actorId: user.id,
            action: "order_cancelled_unpaid",
            details: { reason, comments, previousStatus: order.status },
          });
          return { order, request, immediate: true };
        }

        const request = await tx.insertRequest({
          orderId,
          customerId: user.id,
          reason,
          comments,
          policyAccepted: true,
          status: "REQUESTED",
          orderStatusAtRequest: order.status,
          suggestedRefundAmount: eligibility.suggestedRefundAmount,
        });
        await tx.updateOrder(orderId, { cancellationStatus: "REQUESTED" });
        await tx.insertEvent({
          orderId,
          actorType: "customer",
          actorId: user.id,
          action: "cancellation_requested",
          details: { reason, comments, orderStatus: order.status, suggestedRefundAmount: eligibility.suggestedRefundAmount },
        });
        return { order, request, immediate: false };
      });
    } catch (error) {
      // The UNIQUE(active_order_id) key backs up the check above against races.
      if (error && (error.code === "ER_DUP_ENTRY" || error.errno === 1062)) {
        throw httpError(409, "A cancellation request is already under review for this order");
      }
      throw error;
    }

    const { order, request, immediate } = result;
    if (immediate) {
      email("customerCancelledUnpaid", { order, request });
    } else {
      email("customerRequestReceived", { order, request });
      email("adminNewRequest", { order, request });
      notifyAdmin({
        title: "New cancellation request",
        message: `${order.customer_name || "A customer"} requested cancellation of order #${order.order_number}`,
        metadata: { type: "cancellation_request", orderId, orderNumber: order.order_number, requestId: request.id },
      });
    }
    return { request, immediateCancel: immediate };
  }

  async function withdrawRequest(orderId, user) {
    const result = await store.withTransaction(async (tx) => {
      const order = await tx.getOrder(orderId, { forUpdate: true });
      if (!order) throw httpError(404, "Order not found");
      if (!isOrderOwner(order, user)) throw httpError(403, "You can only manage your own orders");

      const request = await tx.getActiveRequestForOrder(orderId, { forUpdate: true });
      if (!request) throw httpError(409, "There is no pending cancellation request to withdraw");

      const updated = await tx.updateRequest(request.id, { status: "WITHDRAWN", decidedAt: nowSql() });
      await tx.updateOrder(orderId, { cancellationStatus: "WITHDRAWN" });
      await tx.insertEvent({ orderId, actorType: "customer", actorId: user.id, action: "cancellation_withdrawn" });
      return { order, request: updated };
    });

    email("customerRequestWithdrawn", result);
    return { request: result.request };
  }

  // ---------------------------------------------------------------- admin

  /** Remaining refundable amount on the Razorpay payment (₹), or null if unknown. */
  async function fetchRefundableFromGateway(paymentId) {
    if (!paymentId || typeof gateway?.fetchPayment !== "function") return null;
    try {
      const payment = await gateway.fetchPayment(paymentId);
      const capturedPaise = Number(payment?.amount || 0);
      const refundedPaise = Number(payment?.amount_refunded || 0);
      return Math.max(0, capturedPaise - refundedPaise) / 100;
    } catch (error) {
      throw httpError(502, `Could not verify the payment with Razorpay: ${error?.error?.description || error.message}`);
    }
  }

  async function approveRequest(requestId, admin, input = {}) {
    const refundType = String(input.refundType || "").toUpperCase();
    if (!ADMIN_ACTIONS_REFUND_TYPES.has(refundType)) throw httpError(400, "refundType must be FULL or PARTIAL");
    const decisionReason = String(input.reason || "").trim();
    if (refundType === "PARTIAL" && !decisionReason) throw httpError(400, "A reason is required for a partial refund");
    if (refundType === "PARTIAL" && (input.amount === undefined || input.amount === null || input.amount === "")) {
      throw httpError(400, "A refund amount is required for a partial refund");
    }

    // Read outside the transaction so the slow Razorpay call doesn't hold row locks.
    const preRequest = await store.getRequest(requestId);
    if (!preRequest) throw httpError(404, "Cancellation request not found");
    const preOrder = await store.getOrder(preRequest.orderId);
    if (!preOrder) throw httpError(404, "Order not found");
    const paymentId = preOrder.transaction_id || null;
    const gatewayRefundable = await fetchRefundableFromGateway(paymentId);

    const decision = await store.withTransaction(async (tx) => {
      const request = await tx.getRequest(requestId, { forUpdate: true });
      if (!request) throw httpError(404, "Cancellation request not found");
      if (request.status !== "REQUESTED") {
        throw httpError(409, `This request has already been ${String(request.status).toLowerCase()}`);
      }
      const order = await tx.getOrder(request.orderId, { forUpdate: true });
      if (!order) throw httpError(404, "Order not found");

      const orderTotal = Number(order.total_amount || 0);
      const maxRefund = gatewayRefundable == null ? orderTotal : Math.min(orderTotal, gatewayRefundable);
      const amount =
        refundType === "FULL" ? policy.toRupees(policy.toPaise(maxRefund)) : policy.validateRefundAmount(input.amount, maxRefund);
      const effectiveType = amount === 0 ? "NONE" : refundType;

      const updatedRequest = await tx.updateRequest(request.id, {
        status: "APPROVED",
        approvedRefundAmount: amount,
        refundType: effectiveType,
        adminId: admin.id,
        adminDecisionReason: decisionReason || (refundType === "FULL" ? "Approved with full refund" : null),
        decidedAt: nowSql(),
      });

      const orderPatch = { status: "cancelled", cancellationStatus: "APPROVED" };
      if (order.tracking_number) {
        // No courier API integration exists — detach the shipment and log it.
        orderPatch.trackingNumber = null;
        orderPatch.shippingCarrier = null;
        await tx.insertEvent({
          orderId: order.id,
          actorType: "admin",
          actorId: admin.id,
          action: "shipment_cancelled",
          details: { trackingNumber: order.tracking_number, carrier: order.shipping_carrier },
        });
      }

      let refund = null;
      if (amount > 0) {
        refund = await tx.insertRefund({
          orderId: order.id,
          cancellationRequestId: request.id,
          razorpayPaymentId: paymentId,
          amount,
          refundType: effectiveType,
          status: paymentId ? "INITIATED" : "FAILED",
          failureReason: paymentId ? null : "No Razorpay payment ID is recorded on this order — refund it manually.",
          createdBy: admin.id,
        });
        orderPatch.refundStatus = refund.status;
        orderPatch.refundAmount = amount;
      } else {
        orderPatch.refundStatus = "NONE";
        orderPatch.refundAmount = 0;
      }
      await tx.updateOrder(order.id, orderPatch);
      await tx.insertEvent({
        orderId: order.id,
        actorType: "admin",
        actorId: admin.id,
        action: "cancellation_approved",
        details: { refundType: effectiveType, amount, reason: decisionReason || null, previousStatus: order.status },
      });
      return { order: { ...order, status: "cancelled" }, request: updatedRequest, refund };
    });

    let { refund } = decision;
    email("customerApproved", { order: decision.order, request: decision.request, refund });
    if (refund && refund.status === "INITIATED") {
      refund = await submitRefundToGateway(refund, decision.order, admin);
    } else if (refund && refund.status === "FAILED") {
      flagRefundFailure(decision.order, refund);
    }
    return { request: decision.request, refund };
  }

  async function declineRequest(requestId, admin, input = {}) {
    const decisionReason = String(input.reason || "").trim();
    if (!decisionReason) throw httpError(400, "A reason is required to decline a cancellation request");

    const result = await store.withTransaction(async (tx) => {
      const request = await tx.getRequest(requestId, { forUpdate: true });
      if (!request) throw httpError(404, "Cancellation request not found");
      if (request.status !== "REQUESTED") {
        throw httpError(409, `This request has already been ${String(request.status).toLowerCase()}`);
      }
      const order = await tx.getOrder(request.orderId, { forUpdate: true });
      if (!order) throw httpError(404, "Order not found");

      const updated = await tx.updateRequest(request.id, {
        status: "DECLINED",
        adminId: admin.id,
        adminDecisionReason: decisionReason,
        decidedAt: nowSql(),
      });
      // Work resumes where it was when the customer asked to cancel.
      const restoreStatus = request.orderStatusAtRequest || order.status;
      await tx.updateOrder(order.id, { status: restoreStatus, cancellationStatus: "DECLINED" });
      await tx.insertEvent({
        orderId: order.id,
        actorType: "admin",
        actorId: admin.id,
        action: "cancellation_declined",
        details: { reason: decisionReason, publicReason: decisionReason, restoredStatus: restoreStatus },
      });
      return { order: { ...order, status: restoreStatus }, request: updated };
    });

    email("customerDeclined", result);
    return { request: result.request };
  }

  // --------------------------------------------------------------- refunds

  function flagRefundFailure(order, refund) {
    email("customerRefundFailed", { order, refund });
    notifyAdmin({
      title: "Refund failed",
      message: `Refund of ₹${Number(refund.amount).toFixed(2)} for order #${order.order_number} failed: ${refund.failureReason || "unknown error"}`,
      metadata: { type: "refund_failed", orderId: order.id, orderNumber: order.order_number, refundId: refund.id },
    });
  }

  /**
   * Calls Razorpay for an INITIATED refund row. Guards against double refunds:
   * the refund row's idempotency key is sent as `receipt`, and any refund already
   * on the payment carrying that key is adopted instead of creating another.
   */
  async function submitRefundToGateway(refund, order, actor) {
    let gatewayRefund = null;
    let failure = null;
    try {
      if (typeof gateway?.listRefunds === "function") {
        const existing = await gateway.listRefunds(refund.razorpayPaymentId);
        gatewayRefund =
          (existing?.items || []).find(
            (item) => item?.receipt === refund.idempotencyKey || item?.notes?.refund_id === refund.idempotencyKey,
          ) || null;
      }
      if (!gatewayRefund) {
        gatewayRefund = await gateway.createRefund(refund.razorpayPaymentId, {
          amount: policy.toPaise(refund.amount),
          speed: "normal",
          receipt: refund.idempotencyKey,
          notes: { refund_id: refund.idempotencyKey, order_id: order.id, order_number: order.order_number },
        });
      }
    } catch (error) {
      failure = error?.error?.description || error?.message || "Razorpay refund request failed";
    }

    if (failure || !gatewayRefund?.id) {
      const failed = await store.withTransaction(async (tx) => {
        const updated = await tx.updateRefund(refund.id, {
          status: "FAILED",
          failureReason: failure || "Razorpay did not return a refund ID",
          attempts: refund.attempts + 1,
        });
        await tx.updateOrder(order.id, { refundStatus: "FAILED" });
        await tx.insertEvent({
          orderId: order.id,
          actorType: "system",
          action: "refund_failed",
          details: { refundId: refund.id, amount: refund.amount, error: updated.failureReason },
        });
        return updated;
      });
      flagRefundFailure(order, failed);
      return failed;
    }

    const initiated = await store.withTransaction(async (tx) => {
      const updated = await tx.updateRefund(refund.id, {
        status: "INITIATED",
        razorpayRefundId: gatewayRefund.id,
        failureReason: null,
        attempts: refund.attempts + 1,
      });
      await tx.updateOrder(order.id, { refundStatus: "INITIATED" });
      await tx.insertEvent({
        orderId: order.id,
        actorType: actor?.id ? "admin" : "system",
        actorId: actor?.id || null,
        action: "refund_initiated",
        details: { refundId: refund.id, amount: refund.amount, razorpayRefundId: gatewayRefund.id },
      });
      return updated;
    });

    // Test-mode refunds are often processed instantly; the webhook will also arrive and be ignored.
    if (String(gatewayRefund.status || "").toLowerCase() === "processed") {
      return markRefundProcessed(initiated, { source: "gateway_response" });
    }
    return initiated;
  }

  async function retryRefund(refundId, admin) {
    const claimed = await store.withTransaction(async (tx) => {
      const refund = await tx.getRefund(refundId, { forUpdate: true });
      if (!refund) throw httpError(404, "Refund not found");
      if (refund.status !== "FAILED") throw httpError(409, "Only failed refunds can be retried");
      if (!refund.razorpayPaymentId) {
        throw httpError(409, "This order has no Razorpay payment ID — use “Mark refunded manually” instead");
      }
      const order = await tx.getOrder(refund.orderId, { forUpdate: true });
      // Claim the row so two admins can't retry at once.
      const updated = await tx.updateRefund(refund.id, { status: "INITIATED" });
      await tx.updateOrder(refund.orderId, { refundStatus: "INITIATED" });
      await tx.insertEvent({
        orderId: refund.orderId,
        actorType: "admin",
        actorId: admin.id,
        action: "refund_retry",
        details: { refundId: refund.id },
      });
      return { refund: updated, order };
    });
    return submitRefundToGateway(claimed.refund, claimed.order, admin);
  }

  async function markRefundedManually(refundId, admin, input = {}) {
    const note = String(input.note || "").trim();
    if (!note) throw httpError(400, "A note is required when marking a refund as manually processed");

    const result = await store.withTransaction(async (tx) => {
      const refund = await tx.getRefund(refundId, { forUpdate: true });
      if (!refund) throw httpError(404, "Refund not found");
      if (refund.status !== "FAILED") throw httpError(409, "Only failed refunds can be marked as refunded manually");
      const order = await tx.getOrder(refund.orderId, { forUpdate: true });
      const refundedAt = nowSql();
      const updated = await tx.updateRefund(refund.id, { status: "PROCESSED", manualRefundNote: note, refundedAt });
      await tx.updateOrder(order.id, {
        refundStatus: "PROCESSED",
        refundedAt,
        paymentStatus: paymentStatusAfterRefund(order, refund.amount),
      });
      await tx.insertEvent({
        orderId: order.id,
        actorType: "admin",
        actorId: admin.id,
        action: "refund_marked_manual",
        details: { refundId: refund.id, amount: refund.amount, note },
      });
      return { order, refund: updated };
    });

    afterRefundProcessed(result.order, result.refund);
    return { refund: result.refund };
  }

  function paymentStatusAfterRefund(order, refundAmount) {
    const total = policy.toPaise(order.total_amount);
    return policy.toPaise(refundAmount) >= total ? "refunded" : "partially_refunded";
  }

  async function markRefundProcessed(refund, { source, razorpayRefundId } = {}) {
    const result = await store.withTransaction(async (tx) => {
      const locked = await tx.getRefund(refund.id, { forUpdate: true });
      if (!locked || locked.status === "PROCESSED") return null; // idempotent
      const order = await tx.getOrder(locked.orderId, { forUpdate: true });
      const refundedAt = nowSql();
      const updated = await tx.updateRefund(locked.id, {
        status: "PROCESSED",
        refundedAt,
        failureReason: null,
        razorpayRefundId: razorpayRefundId || locked.razorpayRefundId || undefined,
      });
      await tx.updateOrder(order.id, {
        refundStatus: "PROCESSED",
        refundedAt,
        paymentStatus: paymentStatusAfterRefund(order, locked.amount),
      });
      await tx.insertEvent({
        orderId: order.id,
        actorType: source === "webhook" ? "razorpay" : "system",
        action: "refund_processed",
        details: { refundId: locked.id, amount: locked.amount, razorpayRefundId: updated.razorpayRefundId },
      });
      return { order, refund: updated };
    });
    if (!result) return store.getRefund(refund.id);
    afterRefundProcessed(result.order, result.refund);
    return result.refund;
  }

  function afterRefundProcessed(order, refund) {
    const run = async () => {
      let finalRefund = refund;
      if (creditNotes && typeof creditNotes.generate === "function") {
        try {
          const note = await creditNotes.generate({ order, refund });
          if (note?.path) {
            finalRefund = await store.updateRefund(refund.id, { creditNoteNumber: note.number, creditNotePath: note.path });
          }
        } catch (error) {
          logger.error("[cancellation] credit note generation failed:", error?.message || error);
        }
      }
      await email("customerRefundCompleted", { order, refund: finalRefund });
    };
    return safe("post-refund tasks", run());
  }

  // --------------------------------------------------------------- webhook

  /**
   * Handles refund.processed / refund.failed. Returns { handled, duplicate }.
   * Idempotent on the Razorpay event id and on the refund's own status.
   */
  async function handleRefundWebhook({ eventId, event, refundEntity }) {
    if (!refundEntity?.id) return { handled: false };
    if (eventId && (await store.hasWebhookEvent(eventId))) return { handled: false, duplicate: true };

    let refund = await store.getRefundByRazorpayId(refundEntity.id);
    const key = refundEntity.receipt || refundEntity.notes?.refund_id;
    if (!refund && key) {
      const byKey = await store.getRefund(key);
      if (byKey && (!byKey.razorpayRefundId || byKey.razorpayRefundId === refundEntity.id)) refund = byKey;
    }
    if (!refund) {
      if (eventId) await store.recordWebhookEvent(eventId, event);
      return { handled: false, unknownRefund: true };
    }

    if (event === "refund.processed") {
      await markRefundProcessed(refund, { source: "webhook", razorpayRefundId: refundEntity.id });
    } else if (event === "refund.failed") {
      const result = await store.withTransaction(async (tx) => {
        const locked = await tx.getRefund(refund.id, { forUpdate: true });
        if (!locked || locked.status === "PROCESSED" || locked.status === "FAILED") return null;
        const order = await tx.getOrder(locked.orderId, { forUpdate: true });
        const reason =
          refundEntity.error_description || refundEntity.notes?.failure_reason || "Razorpay reported the refund as failed";
        const updated = await tx.updateRefund(locked.id, {
          status: "FAILED",
          failureReason: reason,
          razorpayRefundId: locked.razorpayRefundId || refundEntity.id,
        });
        await tx.updateOrder(order.id, { refundStatus: "FAILED" });
        await tx.insertEvent({
          orderId: order.id,
          actorType: "razorpay",
          action: "refund_failed",
          details: { refundId: locked.id, amount: locked.amount, error: reason },
        });
        return { order, refund: updated };
      });
      if (result) flagRefundFailure(result.order, result.refund);
    } else {
      return { handled: false };
    }

    if (eventId) await store.recordWebhookEvent(eventId, event);
    return { handled: true };
  }

  async function getStats(range) {
    const stats = await store.getCancellationStats(range);
    return {
      ...stats,
      topReasons: stats.topReasons.map((item) => ({
        ...item,
        label: policy.CANCELLATION_REASONS[item.reason] || item.reason,
      })),
    };
  }

  async function getCreditNoteForUser(orderId, user, { isManager }) {
    const order = await store.getOrder(orderId);
    if (!order) throw httpError(404, "Order not found");
    if (!isManager && !isOrderOwner(order, user)) throw httpError(403, "Forbidden");
    const refunds = await store.listRefundsForOrder(orderId);
    const withNote = refunds.find((refund) => refund.creditNotePath);
    if (!withNote) throw httpError(404, "No credit note is available for this order yet");
    return withNote;
  }

  return {
    getCustomerView,
    getAdminView,
    listRequests,
    requestCancellation,
    withdrawRequest,
    approveRequest,
    declineRequest,
    retryRefund,
    markRefundedManually,
    handleRefundWebhook,
    getStats,
    getCreditNoteForUser,
  };
}

module.exports = { createCancellationService, isOrderOwner };
