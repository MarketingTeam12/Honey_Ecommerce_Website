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
const { escapeHtml } = require("./cancellationEmails");

const CREDIT_NOTES_DIR = path.join(__dirname, "..", "credit-notes");
const TEMPLATE_PATH = path.join(__dirname, "..", "templates", "creditNoteTemplate.html");

const money = (value) => `₹${Number(value || 0).toFixed(2)}`;
const formatDate = (value) =>
  new Date(value || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

function parseJson(value) {
  if (!value || typeof value === "object") return value || {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function renderCreditNoteHtml({ order, refund, number }) {
  const { taxable, gst, total } = splitGst(refund.amount);
  const metadata = parseJson(order.metadata);
  const customerGstin = order.gst_number || metadata.gst_number || metadata.gstNumber || "";
  const companyGstin = process.env.COMPANY_GSTIN || "";
  const refundReference = refund.razorpayRefundId || (refund.manualRefundNote ? `Manual: ${refund.manualRefundNote}` : refund.id);

  const values = {
    credit_note_number: escapeHtml(number),
    credit_note_date: escapeHtml(formatDate(refund.refundedAt)),
    order_number: escapeHtml(order.order_number || order.id),
    order_date: escapeHtml(formatDate(order.created_at)),
    customer_name: escapeHtml(order.customer_name || "Customer"),
    customer_email: escapeHtml(order.customer_email || ""),
    customer_gstin_line: customerGstin ? `<p><span class="label">GSTIN:</span> ${escapeHtml(customerGstin)}</p>` : "",
    company_gstin_line: companyGstin ? `<p>GSTIN: ${escapeHtml(companyGstin)}</p>` : "",
    refund_description: escapeHtml(
      `${refund.refundType === "PARTIAL" ? "Partial refund" : "Refund"} on cancellation of order ${order.order_number || order.id}`,
    ),
    taxable_amount: money(taxable),
    gst_amount: money(gst),
    total_amount: money(total),
    order_total: money(order.total_amount),
    refund_reference: escapeHtml(refundReference),
  };

  const template = fs.readFileSync(TEMPLATE_PATH, "utf8");
  return template.replace(/{{(\w+)}}/g, (match, key) => (key in values ? values[key] : ""));
}

function createCreditNoteService({ store, getBrowser }) {
  async function nextNumber(order) {
    const refunds = await store.listRefundsForOrder(order.id);
    const issued = refunds.filter((refund) => refund.creditNoteNumber).length;
    return `CN-${order.order_number || order.id}-${issued + 1}`;
  }

  return {
    async generate({ order, refund }) {
      const number = await nextNumber(order);
      const html = renderCreditNoteHtml({ order, refund, number });

      const browser = await getBrowser();
      const page = await browser.newPage();
      let pdf;
      try {
        await page.setContent(html, { waitUntil: "domcontentloaded" });
        pdf = await page.pdf({ format: "A4", printBackground: true });
      } finally {
        await page.close();
      }

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

module.exports = { createCreditNoteService, renderCreditNoteHtml, resolveCreditNotePath, CREDIT_NOTES_DIR };
