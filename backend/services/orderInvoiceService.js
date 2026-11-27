/**
 * Loads orders for invoicing and fixes each order's invoice number the first
 * time an invoice is issued, so every copy (and any credit note) carries the
 * same number.
 */
const { pool } = require("../config/database");
const { generateInvoice, buildInvoiceDataFromOrder } = require("./invoiceService");
const { uploadBuffer, buildFileUrl } = require("./s3Service");

async function findOrder(idOrNumber) {
  const [rows] = await pool.query(
    "SELECT * FROM orders WHERE id = :value OR order_number = :value LIMIT 1",
    { value: idOrNumber },
  );
  return rows[0] || null;
}

async function assignInvoiceNumber(order) {
  if (order.invoice_number) return order;
  // The order number is unique and already printed on earlier invoices.
  const invoiceNumber = String(order.order_number || order.id).slice(0, 32);
  try {
    await pool.query(
      `UPDATE orders
          SET invoice_number = COALESCE(invoice_number, :invoiceNumber),
              invoice_date = COALESCE(invoice_date, created_at)
        WHERE id = :id`,
      { invoiceNumber, id: order.id },
    );
    return (await findOrder(order.id)) || { ...order, invoice_number: invoiceNumber };
  } catch (error) {
    // Columns missing (migration didn't run) – still issue the invoice.
    console.error("Could not store invoice number:", error.message);
    return { ...order, invoice_number: invoiceNumber, invoice_date: order.created_at };
  }
}

function renderInvoicePdf(order) {
  return generateInvoice(buildInvoiceDataFromOrder(order));
}

async function uploadInvoice(order, pdf, req) {
  const uploaded = await uploadBuffer({
    buffer: pdf,
    originalName: `${order.invoice_number || order.order_number}.pdf`,
    mimeType: "application/pdf",
    folder: "invoices",
  });
  return buildFileUrl(req, uploaded.key);
}

module.exports = {
  orders: { findOrder, assignInvoiceNumber },
  renderInvoicePdf,
  uploadInvoice,
};
