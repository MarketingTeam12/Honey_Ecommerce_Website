/**
 * GST-aware credit notes for processed refunds.
 *
 * PDFs are written to backend/credit-notes/, which is NOT served statically
 * (unlike /api/invoices) — they're only downloadable through the authenticated
 * GET /api/orders/:id/credit-note endpoint.
 */
const fs = require("fs");
const path = require("path");
const { splitGst } = require("./cancellationPolicy");
const { renderCreditNotePdf } = require("./pdfDocuments");

const CREDIT_NOTES_DIR = path.join(__dirname, "..", "credit-notes");

const formatDate = (value) =>
  new Date(value || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

function parseJson(value) {
  if (!value || typeof value === "object") return value || {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function buildCreditNoteData({ order, refund, number }) {
  const { taxable, gst, total } = splitGst(refund.amount);
  const metadata = parseJson(order.metadata);
  const customerGstin = order.gst_number || metadata.gst_number || metadata.gstNumber || "";
  const companyGstin = process.env.COMPANY_GSTIN || "";
  const refundReference = refund.razorpayRefundId || (refund.manualRefundNote ? `Manual: ${refund.manualRefundNote}` : refund.id);

  const values = {
    credit_note_number: number,
    credit_note_date: formatDate(refund.refundedAt),
    invoice_number: order.invoice_number || order.order_number || order.id,
    order_number: order.order_number || order.id,
    order_date: formatDate(order.created_at),
    customer_name: order.customer_name || "Customer",
    customer_email: order.customer_email || "",
    customer_gstin: customerGstin,
    company_gstin: companyGstin,
    refund_description: `${refund.refundType === "PARTIAL" ? "Partial refund" : "Refund"} on cancellation of order ${order.order_number || order.id}`,
    taxable_amount: taxable,
    gst_amount: gst,
    total_amount: total,
    order_total: order.total_amount,
    refund_reference: refundReference,
  };

  return values;
}

function createCreditNoteService({ store }) {
  async function nextNumber(order) {
    const refunds = await store.listRefundsForOrder(order.id);
    const issued = refunds.filter((refund) => refund.creditNoteNumber).length;
    return `CN-${order.order_number || order.id}-${issued + 1}`;
  }

  return {
    async generate({ order, refund }) {
      const number = await nextNumber(order);
      const pdf = await renderCreditNotePdf(buildCreditNoteData({ order, refund, number }));

      fs.mkdirSync(CREDIT_NOTES_DIR, { recursive: true });
      const fileName = `${number.replace(/[^A-Za-z0-9_-]/g, "_")}.pdf`;
      fs.writeFileSync(path.join(CREDIT_NOTES_DIR, fileName), pdf);
      return { number, path: fileName };
    },
  };
}

/** Absolute path for a stored credit note file name (guards against path traversal). */
function resolveCreditNotePath(fileName) {
  const safeName = path.basename(String(fileName || ""));
  return path.join(CREDIT_NOTES_DIR, safeName);
}

module.exports = { createCreditNoteService, buildCreditNoteData, resolveCreditNotePath, CREDIT_NOTES_DIR };
