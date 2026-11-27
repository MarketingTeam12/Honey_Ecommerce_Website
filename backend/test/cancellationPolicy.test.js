const test = require("node:test");
const assert = require("node:assert/strict");
const {
  evaluateCancellation,
  normalizeOrderStatus,
  validateRefundAmount,
  splitGst,
} = require("../services/cancellationPolicy");

const paidOrder = (status, total = 472) => ({ status, payment_status: "paid", total_amount: total });

test.beforeEach(() => {
  delete process.env.CANCEL_DOC_ANALYSIS_FEE;
  delete process.env.CANCEL_IN_PROGRESS_PCT;
  delete process.env.CANCEL_DRAFT_PCT;
});

test("normalizes every status spelling to one canonical id", () => {
  assert.equal(normalizeOrderStatus("document-analysis"), "document-analysis");
  assert.equal(normalizeOrderStatus("document_analysis"), "document-analysis");
  assert.equal(normalizeOrderStatus("Document Analysis"), "document-analysis");
  assert.equal(normalizeOrderStatus("payment_received"), "payment-received");
  assert.equal(normalizeOrderStatus("pending"), "received");
  assert.equal(normalizeOrderStatus("processing"), "translator-working");
  assert.equal(normalizeOrderStatus("soft_copy_ready"), "soft");
  assert.equal(normalizeOrderStatus("draft_ready"), "draft");
});

for (const status of ["received", "payment-received", "confirmed", "pending"]) {
  test(`${status}: eligible with a 100% refund suggestion`, () => {
    const result = evaluateCancellation(paidOrder(status));
    assert.equal(result.eligible, true);
    assert.equal(result.requiresApproval, true);
    assert.equal(result.suggestedRefundPct, 100);
    assert.equal(result.suggestedRefundAmount, 472);
  });
}

test("document analysis: 100% minus the configurable processing fee", () => {
  assert.equal(evaluateCancellation(paidOrder("document-analysis")).suggestedRefundAmount, 372);
  process.env.CANCEL_DOC_ANALYSIS_FEE = "50";
  assert.equal(evaluateCancellation(paidOrder("document_analysis")).suggestedRefundAmount, 422);
});

test("document analysis fee never produces a negative refund", () => {
  process.env.CANCEL_DOC_ANALYSIS_FEE = "1000";
  assert.equal(evaluateCancellation(paidOrder("document-analysis", 300)).suggestedRefundAmount, 0);
});

for (const status of ["translator-working", "formatting", "proof-checking", "processing"]) {
  test(`${status}: partial refund using the configurable default`, () => {
    const result = evaluateCancellation(paidOrder(status));
    assert.equal(result.eligible, true);
    assert.equal(result.suggestedRefundPct, 50);
    assert.equal(result.suggestedRefundAmount, 236);
  });
}

test("in-progress percentage is configurable", () => {
  process.env.CANCEL_IN_PROGRESS_PCT = "40";
  assert.equal(evaluateCancellation(paidOrder("formatting", 1000)).suggestedRefundAmount, 400);
});

for (const status of ["draft", "soft"]) {
  test(`${status}: eligible with a 25% default suggestion`, () => {
    const result = evaluateCancellation(paidOrder(status, 1000));
    assert.equal(result.eligible, true);
    assert.equal(result.suggestedRefundAmount, 250);
  });
}

for (const status of ["courier", "shipped", "delivered", "cancelled"]) {
  test(`${status}: not eligible`, () => {
    const result = evaluateCancellation(paidOrder(status));
    assert.equal(result.eligible, false);
    assert.ok(result.reason);
  });
}

test("unpaid orders cancel immediately with no refund and no approval", () => {
  const result = evaluateCancellation({ status: "received", payment_status: "pending", total_amount: 472 });
  assert.equal(result.eligible, true);
  assert.equal(result.immediateCancel, true);
  assert.equal(result.requiresApproval, false);
  assert.equal(result.suggestedRefundAmount, 0);
});

test("unpaid but already shipped is still not eligible", () => {
  assert.equal(evaluateCancellation({ status: "shipped", payment_status: "unpaid" }).eligible, false);
});

test("not eligible while a request is active or after a refund", () => {
  assert.equal(evaluateCancellation({ ...paidOrder("confirmed"), cancellation_status: "REQUESTED" }).eligible, false);
  assert.equal(evaluateCancellation(paidOrder("confirmed"), { activeRequest: { id: "x" } }).eligible, false);
  assert.equal(evaluateCancellation({ ...paidOrder("confirmed"), payment_status: "refunded" }).eligible, false);
  assert.equal(evaluateCancellation({ ...paidOrder("confirmed"), cancellation_status: "APPROVED" }).eligible, false);
});

test("eligible again after a withdrawn or declined request", () => {
  assert.equal(evaluateCancellation({ ...paidOrder("confirmed"), cancellation_status: "WITHDRAWN" }).eligible, true);
  assert.equal(evaluateCancellation({ ...paidOrder("confirmed"), cancellation_status: "DECLINED" }).eligible, true);
});

test("suggestion never exceeds the amount actually paid", () => {
  const result = evaluateCancellation(paidOrder("confirmed", 472), { amountPaid: 400 });
  assert.equal(result.suggestedRefundAmount, 400);
  assert.equal(result.maxRefundAmount, 400);
});

test("validateRefundAmount rejects amounts above the paid total (incl. GST) and negatives", () => {
  assert.equal(validateRefundAmount(472, 472), 472);
  assert.equal(validateRefundAmount("100.555", 472), 100.56);
  assert.throws(() => validateRefundAmount(472.01, 472), /cannot exceed/);
  assert.throws(() => validateRefundAmount(-1, 472), /0 or more/);
  assert.throws(() => validateRefundAmount("abc", 472), /0 or more/);
});

test("splitGst splits a GST-inclusive amount at 18%", () => {
  assert.deepEqual(splitGst(472), { total: 472, taxable: 400, gst: 72 });
  const odd = splitGst(100);
  assert.equal(Math.round((odd.taxable + odd.gst) * 100), 10000);
});
