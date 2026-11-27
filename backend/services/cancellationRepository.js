/**
 * MySQL data access for the cancellation & refund workflow.
 *
 * Every method runs on `executor` (the pool, or a transaction connection), so
 * the same repository works inside and outside transactions. The service layer
 * only talks to this interface, which lets tests swap in an in-memory fake.
 */
const crypto = require("crypto");

const nowSql = () => new Date().toISOString().slice(0, 19).replace("T", " ");
const makeId = (prefix) => `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

function parseJson(value) {
  if (value == null) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

const num = (v) => (v == null ? null : Number(v));

function mapRequest(row) {
  if (!row) return null;
  return {
    id: row.id,
    orderId: row.order_id,
    customerId: row.customer_id,
    reason: row.reason,
    comments: row.comments,
    policyAccepted: Boolean(row.policy_accepted),
    status: row.status,
    orderStatusAtRequest: row.order_status_at_request,
    suggestedRefundAmount: num(row.suggested_refund_amount),
    approvedRefundAmount: num(row.approved_refund_amount),
    refundType: row.refund_type,
    adminId: row.admin_id,
    adminDecisionReason: row.admin_decision_reason,
    decidedAt: row.decided_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRefund(row) {
  if (!row) return null;
  return {
    id: row.id,
    orderId: row.order_id,
    cancellationRequestId: row.cancellation_request_id,
    razorpayPaymentId: row.razorpay_payment_id,
    amount: num(row.amount),
    refundType: row.refund_type,
    status: row.status,
    razorpayRefundId: row.razorpay_refund_id,
    idempotencyKey: row.idempotency_key,
    attempts: Number(row.attempts || 0),
    refundedAt: row.refunded_at,
    failureReason: row.failure_reason,
    manualRefundNote: row.manual_refund_note,
    creditNoteNumber: row.credit_note_number,
    creditNotePath: row.credit_note_path,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// camelCase patch keys -> column names (whitelist: nothing else can be written).
const REQUEST_COLUMNS = {
  status: "status",
  approvedRefundAmount: "approved_refund_amount",
  refundType: "refund_type",
  adminId: "admin_id",
  adminDecisionReason: "admin_decision_reason",
  decidedAt: "decided_at",
};
const REFUND_COLUMNS = {
  status: "status",
  razorpayRefundId: "razorpay_refund_id",
  attempts: "attempts",
  refundedAt: "refunded_at",
  failureReason: "failure_reason",
  manualRefundNote: "manual_refund_note",
  creditNoteNumber: "credit_note_number",
  creditNotePath: "credit_note_path",
};
const ORDER_COLUMNS = {
  status: "status",
  paymentStatus: "payment_status",
  cancellationStatus: "cancellation_status",
  refundStatus: "refund_status",
  refundAmount: "refund_amount",
  refundedAt: "refunded_at",
  trackingNumber: "tracking_number",
  shippingCarrier: "shipping_carrier",
};

function buildUpdate(table, columns, id, patch, extraSql = "") {
  const sets = [];
  const params = { id };
  for (const [key, value] of Object.entries(patch || {})) {
    const column = columns[key];
    if (!column || value === undefined) continue;
    sets.push(`${column} = :${key}`);
    params[key] = value;
  }
  if (extraSql) sets.push(extraSql);
  if (!sets.length) return null;
  return { sql: `UPDATE ${table} SET ${sets.join(", ")}, updated_at = NOW() WHERE id = :id`, params };
}

function createRepository(executor) {
  const forUpdate = (opts) => (opts && opts.forUpdate ? " FOR UPDATE" : "");

  return {
    async getOrder(orderId, opts) {
      const [rows] = await executor.query(`SELECT * FROM orders WHERE id = :orderId LIMIT 1${forUpdate(opts)}`, { orderId });
      return rows[0] || null;
    },

    async updateOrder(orderId, patch) {
      const extra = patch && patch.status !== undefined ? "status_updated_at = NOW()" : "";
      const update = buildUpdate("orders", ORDER_COLUMNS, orderId, patch, extra);
      if (update) await executor.query(update.sql, update.params);
    },

    async getActiveRequestForOrder(orderId, opts) {
      const [rows] = await executor.query(
        `SELECT * FROM cancellation_requests WHERE order_id = :orderId AND status = 'REQUESTED' LIMIT 1${forUpdate(opts)}`,
        { orderId },
      );
      return mapRequest(rows[0]);
    },

    async getLatestRequestForOrder(orderId) {
      const [rows] = await executor.query(
        "SELECT * FROM cancellation_requests WHERE order_id = :orderId ORDER BY created_at DESC, id DESC LIMIT 1",
        { orderId },
      );
      return mapRequest(rows[0]);
    },

    async getRequest(requestId, opts) {
      const [rows] = await executor.query(`SELECT * FROM cancellation_requests WHERE id = :requestId LIMIT 1${forUpdate(opts)}`, {
        requestId,
      });
      return mapRequest(rows[0]);
    },

    async insertRequest(data) {
      const id = data.id || makeId("cxl");
      await executor.query(
        `INSERT INTO cancellation_requests (
           id, order_id, customer_id, reason, comments, policy_accepted, status, order_status_at_request,
           suggested_refund_amount, approved_refund_amount, refund_type, admin_id, admin_decision_reason, decided_at
         ) VALUES (
           :id, :orderId, :customerId, :reason, :comments, :policyAccepted, :status, :orderStatusAtRequest,
           :suggestedRefundAmount, :approvedRefundAmount, :refundType, :adminId, :adminDecisionReason, :decidedAt
         )`,
        {
          id,
          orderId: data.orderId,
          customerId: data.customerId || null,
          reason: data.reason,
          comments: data.comments || null,
          policyAccepted: data.policyAccepted ? 1 : 0,
          status: data.status || "REQUESTED",
          orderStatusAtRequest: data.orderStatusAtRequest || null,
          suggestedRefundAmount: data.suggestedRefundAmount || 0,
          approvedRefundAmount: data.approvedRefundAmount ?? null,
          refundType: data.refundType || null,
          adminId: data.adminId || null,
          adminDecisionReason: data.adminDecisionReason || null,
          decidedAt: data.decidedAt || null,
        },
      );
      return this.getRequest(id);
    },

    async updateRequest(requestId, patch) {
      const update = buildUpdate("cancellation_requests", REQUEST_COLUMNS, requestId, patch);
      if (update) await executor.query(update.sql, update.params);
      return this.getRequest(requestId);
    },

    async listRequests({ status } = {}) {
      const params = {};
      let where = "";
      if (status) {
        where = "WHERE cr.status = :status";
        params.status = status;
      }
      const [rows] = await executor.query(
        `SELECT cr.*, o.order_number, o.customer_name, o.customer_email, o.total_amount,
                o.status AS order_status, o.payment_status, o.transaction_id, o.refund_status, o.refund_amount
         FROM cancellation_requests cr
         JOIN orders o ON o.id = cr.order_id
         ${where}
         ORDER BY cr.created_at DESC`,
        params,
      );
      return rows.map((row) => ({
        ...mapRequest(row),
        order: {
          id: row.order_id,
          orderNumber: row.order_number,
          customerName: row.customer_name,
          customerEmail: row.customer_email,
          totalAmount: num(row.total_amount),
          status: row.order_status,
          paymentStatus: row.payment_status,
          transactionId: row.transaction_id,
          refundStatus: row.refund_status,
          refundAmount: num(row.refund_amount),
        },
      }));
    },

    async countRequests(status) {
      const [rows] = await executor.query("SELECT COUNT(*) AS total FROM cancellation_requests WHERE status = :status", { status });
      return Number(rows[0]?.total || 0);
    },

    async insertRefund(data) {
      const id = data.id || makeId("rfnd");
      await executor.query(
        `INSERT INTO refunds (
           id, order_id, cancellation_request_id, razorpay_payment_id, amount, refund_type, status,
           idempotency_key, failure_reason, created_by
         ) VALUES (
           :id, :orderId, :cancellationRequestId, :razorpayPaymentId, :amount, :refundType, :status,
           :idempotencyKey, :failureReason, :createdBy
         )`,
        {
          id,
          orderId: data.orderId,
          cancellationRequestId: data.cancellationRequestId || null,
          razorpayPaymentId: data.razorpayPaymentId || null,
          amount: data.amount,
          refundType: data.refundType,
          status: data.status || "INITIATED",
          idempotencyKey: data.idempotencyKey || id,
          failureReason: data.failureReason || null,
          createdBy: data.createdBy || null,
        },
      );
      return this.getRefund(id);
    },

    async getRefund(refundId, opts) {
      const [rows] = await executor.query(`SELECT * FROM refunds WHERE id = :refundId LIMIT 1${forUpdate(opts)}`, { refundId });
      return mapRefund(rows[0]);
    },

    async getRefundByRazorpayId(razorpayRefundId, opts) {
      const [rows] = await executor.query(
        `SELECT * FROM refunds WHERE razorpay_refund_id = :razorpayRefundId LIMIT 1${forUpdate(opts)}`,
        { razorpayRefundId },
      );
      return mapRefund(rows[0]);
    },

    async listRefundsForOrder(orderId) {
      const [rows] = await executor.query("SELECT * FROM refunds WHERE order_id = :orderId ORDER BY created_at DESC", { orderId });
      return rows.map(mapRefund);
    },

    async updateRefund(refundId, patch) {
      const update = buildUpdate("refunds", REFUND_COLUMNS, refundId, patch);
      if (update) await executor.query(update.sql, update.params);
      return this.getRefund(refundId);
    },

    async insertEvent({ orderId, actorType, actorId, action, details }) {
      await executor.query(
        `INSERT INTO order_events (order_id, actor_type, actor_id, action, details)
         VALUES (:orderId, :actorType, :actorId, :action, :details)`,
        {
          orderId,
          actorType,
          actorId: actorId || null,
          action,
          details: details ? JSON.stringify(details) : null,
        },
      );
    },

    async listEvents(orderId) {
      const [rows] = await executor.query("SELECT * FROM order_events WHERE order_id = :orderId ORDER BY created_at ASC, id ASC", {
        orderId,
      });
      return rows.map((row) => ({
        id: row.id,
        orderId: row.order_id,
        actorType: row.actor_type,
        actorId: row.actor_id,
        action: row.action,
        details: parseJson(row.details),
        createdAt: row.created_at,
      }));
    },

    async hasWebhookEvent(eventId) {
      const [rows] = await executor.query("SELECT event_id FROM webhook_events WHERE event_id = :eventId LIMIT 1", { eventId });
      return rows.length > 0;
    },

    async recordWebhookEvent(eventId, eventName) {
      await executor.query("INSERT IGNORE INTO webhook_events (event_id, event_name) VALUES (:eventId, :eventName)", {
        eventId,
        eventName: eventName || null,
      });
    },

    async getCancellationStats({ from, to } = {}) {
      const params = {};
      const conds = [];
      if (from) {
        conds.push("created_at >= :from");
        params.from = from;
      }
      if (to) {
        conds.push("created_at <= :to");
        params.to = to;
      }
      const where = conds.length ? `AND ${conds.join(" AND ")}` : "";
      const [[cancelRows], [refundRows], [reasonRows], [pendingRows]] = await Promise.all([
        executor.query(`SELECT COUNT(*) AS total FROM cancellation_requests WHERE status = 'APPROVED' ${where}`, params),
        executor.query(
          `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM refunds WHERE status = 'PROCESSED' ${where}`,
          params,
        ),
        executor.query(
          `SELECT reason, COUNT(*) AS count FROM cancellation_requests WHERE 1=1 ${where}
           GROUP BY reason ORDER BY count DESC LIMIT 5`,
          params,
        ),
        executor.query("SELECT COUNT(*) AS total FROM cancellation_requests WHERE status = 'REQUESTED'"),
      ]);
      return {
        cancellations: Number(cancelRows[0]?.total || 0),
        totalRefunded: Number(refundRows[0]?.total || 0),
        refundsProcessed: Number(refundRows[0]?.count || 0),
        pendingRequests: Number(pendingRows[0]?.total || 0),
        topReasons: reasonRows.map((row) => ({ reason: row.reason, count: Number(row.count) })),
      };
    },
  };
}

/**
 * Runs `fn(repo)` inside a MySQL transaction; commits on success, rolls back on error.
 */
function createMysqlStore(pool) {
  const base = createRepository(pool);
  return {
    ...base,
    async withTransaction(fn) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const result = await fn(createRepository(connection));
        await connection.commit();
        return result;
      } catch (error) {
        await connection.rollback().catch(() => {});
        throw error;
      } finally {
        connection.release();
      }
    },
  };
}

module.exports = {
  createRepository,
  createMysqlStore,
  nowSql,
};
