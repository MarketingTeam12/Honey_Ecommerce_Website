/**
 * Invoice endpoints (mounted under /api). The invoice is always built from the
 * order stored in the database – never from amounts sent by the browser – and
 * only the order's owner or an admin/manager can get it.
 *
 *   GET  /orders/:id/invoice   PDF download (id or order number)
 *   POST /generate-invoice     { order: { id | order_number } } -> { invoicePath }
 *                              (kept for older pages; uploads the PDF and
 *                              returns its storage URL)
 */
const express = require("express");

function createInvoiceRouter({ orders, renderInvoicePdf, uploadInvoice, auth, isOrderOwner }) {
  const { requireAuth, isOrderManager } = auth;
  const router = express.Router();

  async function loadAuthorizedOrder(idOrNumber, user) {
    if (!idOrNumber) {
      const error = new Error("Order id is required");
      error.status = 400;
      throw error;
    }
    const order = await orders.findOrder(String(idOrNumber));
    if (!order) {
      const error = new Error("Order not found");
      error.status = 404;
      throw error;
    }
    if (!isOrderOwner(order, user) && !(await isOrderManager(user))) {
      const error = new Error("You can only download invoices for your own orders");
      error.status = 403;
      throw error;
    }
    return orders.assignInvoiceNumber(order);
  }

  const handle = (fn) => async (req, res, next) => {
    try {
      await fn(req, res);
    } catch (error) {
      if (error && error.status && error.status < 500) {
        return res.status(error.status).json({ success: false, error: error.message, message: error.message });
      }
      return next(error);
    }
  };

  router.get(
    "/orders/:id/invoice",
    requireAuth,
    handle(async (req, res) => {
      const order = await loadAuthorizedOrder(req.params.id, req.user);
      const pdf = await renderInvoicePdf(order);
      const fileName = `Invoice-${String(order.invoice_number || order.order_number).replace(/[^\w.-]/g, "_")}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("Cache-Control", "private, no-store");
      res.send(Buffer.from(pdf));
    }),
  );

  router.post(
    "/generate-invoice",
    requireAuth,
    handle(async (req, res) => {
      const requested = req.body?.order || req.body || {};
      const order = await loadAuthorizedOrder(requested.id || requested.order_number || requested.orderId, req.user);
      const pdf = await renderInvoicePdf(order);
      const invoicePath = await uploadInvoice(order, pdf, req);
      res.json({ success: true, invoicePath, invoiceNumber: order.invoice_number });
    }),
  );

  return router;
}

module.exports = { createInvoiceRouter };
