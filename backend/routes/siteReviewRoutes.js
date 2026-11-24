const express = require("express");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const { pool } = require("../config/database");
const { optionalAuth, requireAuth, requireAdmin } = require("../middleware/auth");
const siteData = require("../services/siteDataService");

const router = express.Router();

// Helper to strip control characters
function stripControlChars(val) {
  if (typeof val !== "string") return "";
  return val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

// Rate limiter for POST /site-reviews: max 5 per hour per IP
const postReviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many reviews submitted from this IP, please try again later." },
});

// GET /site-reviews?limit&offset (public): approved reviews only
router.get("/site-reviews", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const [summaryRows] = await pool.query(`
      SELECT 
        COUNT(*) AS totalCount,
        COALESCE(AVG(rating), 0) AS avgRating,
        COALESCE(SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END), 0) AS verifiedCount
      FROM site_reviews
      WHERE status = 'approved'
    `);

    const [rows] = await pool.query(
      `SELECT id, name, rating, title, comment, is_verified AS isVerified, created_at AS createdAt
       FROM site_reviews
       WHERE status = 'approved'
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const summaryRow = summaryRows?.[0] || {};
    const count = Number(summaryRow.totalCount || 0);
    const rawAvg = Number(summaryRow.avgRating || 0);
    const average = Math.round(rawAvg * 10) / 10;
    const verifiedCount = Number(summaryRow.verifiedCount || 0);

    res.json({
      reviews: (rows || []).map((r) => ({
        id: r.id,
        name: r.name,
        rating: Number(r.rating),
        title: r.title,
        comment: r.comment,
        isVerified: Boolean(r.isVerified),
        createdAt: r.createdAt,
      })),
      summary: {
        count,
        average,
        verifiedCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /site-reviews (public, optionalAuth)
router.post("/site-reviews", postReviewLimiter, optionalAuth, async (req, res, next) => {
  try {
    // Honeypot check: if website is filled, return 201 success and save nothing
    const website = stripControlChars(req.body?.website || "");
    if (website) {
      return res.status(201).json({
        success: true,
        message: "Your review will appear after it has been approved",
      });
    }

    const name = stripControlChars(req.body?.name || "").slice(0, 80);
    if (!name) {
      return res.status(400).json({ error: "Name is required (up to 80 characters)." });
    }

    const email = String(req.body?.email || "").trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: "A valid email address is required." });
    }

    const rating = parseInt(req.body?.rating, 10);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be an integer between 1 and 5." });
    }

    const title = req.body?.title ? stripControlChars(req.body.title).slice(0, 120) : null;

    const comment = stripControlChars(req.body?.comment || "");
    if (comment.length < 10 || comment.length > 1000) {
      return res.status(400).json({ error: "Comment must be between 10 and 1000 characters." });
    }

    const orderNumber = req.body?.orderNumber ? stripControlChars(req.body.orderNumber) : null;

    // Max 3 reviews per email per 24 hours
    const [recentRows] = await pool.query(
      "SELECT COUNT(*) AS count FROM site_reviews WHERE LOWER(email) = ? AND created_at >= NOW() - INTERVAL 24 HOUR",
      [email]
    );
    if (Number(recentRows?.[0]?.count || 0) >= 3) {
      return res.status(429).json({ error: "Maximum 3 reviews per email per 24 hours allowed." });
    }

    // IP hash
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 64);

    let isVerified = 0;
    let orderId = null;

    if (orderNumber) {
      const [orderRows] = await pool.query(
        "SELECT id, order_number, customer_email, payment_status, status FROM orders WHERE LOWER(order_number) = ? LIMIT 1",
        [orderNumber.toLowerCase()]
      );
      const order = orderRows?.[0];
      const emailMatches = order && String(order.customer_email || "").trim().toLowerCase() === email;

      // Generic error so order numbers cannot be probed
      if (!order || !emailMatches) {
        return res.status(400).json({ error: "Could not match order number with the provided email address." });
      }

      const pStatus = String(order.payment_status || "").trim().toLowerCase();
      const oStatus = String(order.status || "").trim().toLowerCase();
      const isPaidOrCompleted = pStatus === "paid" || ["delivered", "completed"].includes(oStatus);

      if (!isPaidOrCompleted) {
        return res.status(400).json({ error: "Could not match order number with the provided email address." });
      }

      isVerified = 1;
      orderId = order.id;
    }

    const reviewId = "srev_" + crypto.randomBytes(16).toString("hex");

    try {
      await pool.query(
        `INSERT INTO site_reviews (id, name, email, rating, title, comment, is_verified, order_id, status, ip_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
        [reviewId, name, email, rating, title, comment, isVerified, orderId, ipHash]
      );
    } catch (insertError) {
      if (insertError.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "A review has already been submitted for this order." });
      }
      throw insertError;
    }

    // Create admin notification
    siteData
      .saveNotification({
        title: "New Website Review",
        message: `${name} left a ${rating}★ website review${isVerified ? " (Verified Customer)" : ""}`,
        type: "site_review",
        metadata: { type: "site_review", reviewId, isVerified, email, orderNumber },
      })
      .catch((err) => {
        console.warn("Failed to create admin notification for site review:", err.message);
      });

    return res.status(201).json({
      success: true,
      message: "Your review will appear after it has been approved",
      id: reviewId,
    });
  } catch (error) {
    next(error);
  }
});

// Admin Endpoints (requireAuth + requireAdmin)
// GET /admin/site-reviews?status=pending|approved|rejected
router.get("/admin/site-reviews", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const filterStatus = String(req.query.status || "").trim().toLowerCase();
    let query = `
      SELECT sr.id, sr.name, sr.email, sr.rating, sr.title, sr.comment,
             sr.is_verified AS isVerified, sr.status, sr.order_id AS orderId,
             sr.moderated_at AS moderatedAt, sr.created_at AS createdAt, sr.updated_at AS updatedAt,
             o.order_number AS orderNumber
      FROM site_reviews sr
      LEFT JOIN orders o ON sr.order_id = o.id
    `;
    const params = [];
    if (["pending", "approved", "rejected"].includes(filterStatus)) {
      query += " WHERE sr.status = ?";
      params.push(filterStatus);
    }
    query += " ORDER BY sr.created_at DESC";

    const [rows] = await pool.query(query, params);
    res.json({
      reviews: (rows || []).map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        rating: Number(r.rating),
        title: r.title,
        comment: r.comment,
        isVerified: Boolean(r.isVerified),
        status: r.status,
        orderId: r.orderId,
        orderNumber: r.orderNumber || null,
        moderatedAt: r.moderatedAt,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /admin/site-reviews/:id {status}
router.patch("/admin/site-reviews/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const status = String(req.body?.status || "").trim().toLowerCase();
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be pending, approved, or rejected." });
    }

    const [result] = await pool.query(
      "UPDATE site_reviews SET status = ?, moderated_at = NOW() WHERE id = ?",
      [status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json({ success: true, message: `Review status updated to ${status}` });
  } catch (error) {
    next(error);
  }
});

// DELETE /admin/site-reviews/:id
router.delete("/admin/site-reviews/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const [result] = await pool.query("DELETE FROM site_reviews WHERE id = ?", [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
