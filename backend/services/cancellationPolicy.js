/**
 * Order cancellation & refund rules — the single place to change them.
 *
 * Amounts are handled in paise (integers) internally to avoid floating-point
 * drift, and returned in rupees rounded to 2 decimals.
 */

const CANCELLATION_REASONS = Object.freeze({
  placed_by_mistake: "Placed by mistake",
  wrong_language_or_document: "Wrong language or document",
  delay: "Delay in delivery",
  found_another_provider: "Found another provider",
  other: "Other",
});

function envNumber(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

/** Read at call time so env changes (and tests) take effect without a restart. */
function getPolicyConfig() {
  return {
    // Flat fee (₹, GST-inclusive) deducted when work is at Document Analysis.
    documentAnalysisFee: envNumber("CANCEL_DOC_ANALYSIS_FEE", 100),
    // Default suggestion for translator-working / formatting / proof-checking.
    inProgressRefundPct: Math.min(100, envNumber("CANCEL_IN_PROGRESS_PCT", 50)),
    // Default suggestion for draft / soft copy (spec range 0–25%).
    draftRefundPct: Math.min(100, envNumber("CANCEL_DRAFT_PCT", 25)),
  };
}

/**
 * Status values in the DB are inconsistent: admin pages save "document-analysis",
 * the customer tracker uses "document_analysis", older orders use "pending"/
 * "processing". Everything is mapped to one canonical hyphenated id.
 */
const STATUS_ALIASES = Object.freeze({
  received: "received",
  pending: "received", // legacy
  "payment-received": "payment-received",
  "payment-confirmed": "payment-received",
  confirmed: "confirmed",
  "document-analysis": "document-analysis",
  "translator-assigned": "translator-working",
  "translator-working": "translator-working",
  processing: "translator-working", // legacy
  formatting: "formatting",
  "proof-checking": "proof-checking",
  draft: "draft",
  "draft-ready": "draft",
  soft: "soft",
  "soft-copy": "soft",
  "soft-copy-ready": "soft",
  courier: "courier",
  shipped: "shipped",
  delivered: "delivered",
  completed: "delivered",
  cancelled: "cancelled",
  canceled: "cancelled",
});

function normalizeOrderStatus(status) {
  const key = String(status || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
  return STATUS_ALIASES[key] || key || "received";
}

// tier -> how the suggestion is computed
const STATUS_TIERS = Object.freeze({
  received: "full",
  "payment-received": "full",
  confirmed: "full",
  "document-analysis": "full_minus_fee",
  "translator-working": "in_progress",
  formatting: "in_progress",
  "proof-checking": "in_progress",
  draft: "draft",
  soft: "draft",
  courier: "ineligible",
  shipped: "ineligible",
  delivered: "ineligible",
  cancelled: "ineligible",
});

const PAID_STATUSES = new Set(["paid", "completed", "success", "successful", "captured"]);
const REFUNDED_STATUSES = new Set(["refunded", "partially_refunded", "partially-refunded"]);

function isPaid(paymentStatus) {
  return PAID_STATUSES.has(String(paymentStatus || "").trim().toLowerCase());
}

const toPaise = (rupees) => Math.max(0, Math.round(Number(rupees || 0) * 100));
const toRupees = (paise) => Math.round(paise) / 100;

/**
 * @param {object} order  orders row (snake_case or camelCase)
 * @param {object} [opts]
 * @param {number} [opts.amountPaid]   GST-inclusive amount actually paid (defaults to order total)
 * @param {object} [opts.activeRequest] current REQUESTED request, if any
 */
function evaluateCancellation(order, opts = {}) {
  const config = getPolicyConfig();
  const status = normalizeOrderStatus(order?.status);
  const paymentStatus = String(order?.payment_status ?? order?.paymentStatus ?? "").toLowerCase();
  const paid = isPaid(paymentStatus);
  const totalAmount = Number(order?.total_amount ?? order?.totalAmount ?? 0);
  const amountPaidPaise = toPaise(opts.amountPaid ?? (paid ? totalAmount : 0));
  const cancellationStatus = String(order?.cancellation_status ?? order?.cancellationStatus ?? "").toUpperCase();

  const base = {
    status,
    paid,
    amountPaid: toRupees(amountPaidPaise),
    maxRefundAmount: toRupees(amountPaidPaise),
    eligible: false,
    requiresApproval: true,
    immediateCancel: false,
    tier: STATUS_TIERS[status] || "ineligible",
    suggestedRefundPct: 0,
    suggestedRefundAmount: 0,
    reason: null,
  };

  if (!order) return { ...base, reason: "Order not found" };
  if (opts.activeRequest || cancellationStatus === "REQUESTED") {
    return { ...base, reason: "A cancellation request is already under review" };
  }
  if (cancellationStatus === "APPROVED") {
    return { ...base, reason: "This order has already been cancelled" };
  }
  if (REFUNDED_STATUSES.has(paymentStatus)) {
    return { ...base, reason: "This order has already been refunded" };
  }
  if (base.tier === "ineligible") {
    return {
      ...base,
      reason:
        status === "cancelled"
          ? "This order has already been cancelled"
          : "This order can no longer be cancelled because it has been dispatched or delivered",
    };
  }

  // Unpaid orders are cancelled straight away — nothing to refund.
  if (!paid) {
    return { ...base, eligible: true, requiresApproval: false, immediateCancel: true };
  }

  let suggestedPaise = 0;
  let pct = 0;
  switch (base.tier) {
    case "full":
      pct = 100;
      suggestedPaise = amountPaidPaise;
      break;
    case "full_minus_fee":
      suggestedPaise = Math.max(0, amountPaidPaise - toPaise(config.documentAnalysisFee));
      pct = amountPaidPaise ? Math.round((suggestedPaise / amountPaidPaise) * 100) : 0;
      break;
    case "in_progress":
      pct = config.inProgressRefundPct;
      suggestedPaise = Math.round((amountPaidPaise * pct) / 100);
      break;
    case "draft":
      pct = config.draftRefundPct;
      suggestedPaise = Math.round((amountPaidPaise * pct) / 100);
      break;
    default:
      break;
  }

  // Never suggest more than was paid.
  suggestedPaise = Math.min(suggestedPaise, amountPaidPaise);

  return {
    ...base,
    eligible: true,
    suggestedRefundPct: pct,
    suggestedRefundAmount: toRupees(suggestedPaise),
  };
}

/** Clamp/validate an admin-entered refund amount. Returns rupees or throws. */
function validateRefundAmount(amount, maxRefundAmount) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value < 0) {
    const error = new Error("Refund amount must be a number of 0 or more");
    error.status = 400;
    throw error;
  }
  if (toPaise(value) > toPaise(maxRefundAmount)) {
    const error = new Error(`Refund amount cannot exceed the amount paid (₹${Number(maxRefundAmount).toFixed(2)})`);
    error.status = 400;
    throw error;
  }
  return toRupees(toPaise(value));
}

/** GST-inclusive split for credit notes (18% GST). */
function splitGst(amountInclusive, gstRate = 0.18) {
  const totalPaise = toPaise(amountInclusive);
  const taxablePaise = Math.round(totalPaise / (1 + gstRate));
  return {
    total: toRupees(totalPaise),
    taxable: toRupees(taxablePaise),
    gst: toRupees(totalPaise - taxablePaise),
  };
}

module.exports = {
  CANCELLATION_REASONS,
  getPolicyConfig,
  normalizeOrderStatus,
  evaluateCancellation,
  validateRefundAmount,
  splitGst,
  isPaid,
  toPaise,
  toRupees,
};
