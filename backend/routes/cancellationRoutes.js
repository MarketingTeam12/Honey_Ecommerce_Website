/**
 * Order cancellation & refund endpoints (mounted under /api).
 *
 * Customer:
 *   GET  /orders/:id/cancellation                    eligibility, request, refunds, timeline
 *   POST /orders/:id/cancellation-request            { reason, comments, policyAccepted }
 *   POST /orders/:id/cancellation-request/withdraw
 *   GET  /orders/:id/credit-note                     PDF (owner or admin/manager)
 * Admin / manager:
 *   GET  /admin/cancellation-requests?status=REQUESTED
 *   GET  /admin/orders/:id/cancellation
 *   POST /admin/cancellation-requests/:id/approve    { refundType: FULL|PARTIAL, amount?, reason? }
 *   POST /admin/cancellation-requests/:id/decline    { reason }
 *   POST /admin/refunds/:id/retry
 *   POST /admin/refunds/:id/mark-manual              { note }
 *   GET  /admin/reports/cancellations?from=&to=
 */
const express = require("express");
const fs = require("fs");

function createCancellationRouter({ service, auth, resolveCreditNotePath }) {
  const { requireAuth, requireOrderManager, isOrderManager } = auth;
  const router = express.Router();

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

  // ------------------------------------------------------------ customer

  router.get(
    "/orders/:id/cancellation",
    requireAuth,
    handle(async (req, res) => {
      const view = await service.getCustomerView(req.params.id, req.user);
      res.json({ success: true, ...view });
    }),
  );

  router.post(
    "/orders/:id/cancellation-request",
    requireAuth,
    handle(async (req, res) => {
      const body = req.body || {};
      const result = await service.requestCancellation(req.params.id, req.user, {
        reason: body.reason,
        comments: body.comments,
        policyAccepted: body.policyAccepted === true || body.policyAccepted === "true",
      });
      res.status(201).json({ success: true, ...result });
    }),
  );

  router.post(
    "/orders/:id/cancellation-request/withdraw",
    requireAuth,
    handle(async (req, res) => {
      const result = await service.withdrawRequest(req.params.id, req.user);
      res.json({ success: true, ...result });
    }),
  );

  router.get(
    "/orders/:id/credit-note",
    requireAuth,
    handle(async (req, res) => {
      const refund = await service.getCreditNoteForUser(req.params.id, req.user, {
        isManager: await isOrderManager(req.user),
      });
      const filePath = resolveCreditNotePath(refund.creditNotePath);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, error: "Credit note file is not available" });
      }
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${refund.creditNoteNumber || "credit-note"}.pdf"`);
      return res.sendFile(filePath);
    }),
  );

  // --------------------------------------------------------------- admin

  router.get(
    "/admin/cancellation-requests",
    requireAuth,
    requireOrderManager,
    handle(async (req, res) => {
      const result = await service.listRequests({ status: req.query.status });
      res.json({ success: true, ...result });
    }),
  );

  router.get(
    "/admin/orders/:id/cancellation",
    requireAuth,
    requireOrderManager,
    handle(async (req, res) => {
      const view = await service.getAdminView(req.params.id);
      res.json({ success: true, ...view });
    }),
  );

  router.post(
    "/admin/cancellation-requests/:id/approve",
    requireAuth,
    requireOrderManager,
    handle(async (req, res) => {
      const body = req.body || {};
      const result = await service.approveRequest(req.params.id, req.user, {
        refundType: body.refundType,
        amount: body.amount,
        reason: body.reason,
      });
      res.json({ success: true, ...result });
    }),
  );

  router.post(
    "/admin/cancellation-requests/:id/decline",
    requireAuth,
    requireOrderManager,
    handle(async (req, res) => {
      const result = await service.declineRequest(req.params.id, req.user, { reason: (req.body || {}).reason });
      res.json({ success: true, ...result });
    }),
  );

  router.post(
    "/admin/refunds/:id/retry",
    requireAuth,
    requireOrderManager,
    handle(async (req, res) => {
      const refund = await service.retryRefund(req.params.id, req.user);
      res.json({ success: true, refund });
    }),
  );

  router.post(
    "/admin/refunds/:id/mark-manual",
    requireAuth,
    requireOrderManager,
    handle(async (req, res) => {
      const result = await service.markRefundedManually(req.params.id, req.user, { note: (req.body || {}).note });
      res.json({ success: true, ...result });
    }),
  );

  router.get(
    "/admin/reports/cancellations",
    requireAuth,
    requireOrderManager,
    handle(async (req, res) => {
      const stats = await service.getStats({ from: req.query.from || null, to: req.query.to || null });
      res.json({ success: true, stats });
    }),
  );

  return router;
}

module.exports = { createCancellationRouter };
