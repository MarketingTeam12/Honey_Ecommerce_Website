const Razorpay = require("razorpay");
const crypto = require("crypto");

let razorpayInstance;

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Missing Razorpay credentials. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env");
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  return razorpayInstance;
}

function timingSafeHexCompare(expectedHex, actualHex) {
  if (!expectedHex || !actualHex || typeof expectedHex !== "string" || typeof actualHex !== "string") {
    return false;
  }
  const a = Buffer.from(expectedHex, "utf8");
  const b = Buffer.from(actualHex, "utf8");
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

/**
 * Creates a Razorpay order strictly in INR paise.
 */
async function createOrder({ amount, currency = "INR", receipt }) {
  const numericAmount = Number(amount);
  const resolvedReceipt = typeof receipt === "string" && receipt.trim()
    ? receipt.trim()
    : `receipt_${Date.now()}`;

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    const error = new Error("Valid amount is required");
    error.status = 400;
    throw error;
  }

  // Catalog prices, taxes, and discounts are stored in INR; always charge in INR paise.
  const normalizedCurrency = String(currency || "INR").trim().toUpperCase();
  if (normalizedCurrency !== "INR") {
    const error = new Error("Razorpay checkout currency must be INR");
    error.status = 400;
    throw error;
  }

  const amountPaise = Math.round(numericAmount * 100);
  if (amountPaise <= 0) {
    const error = new Error("Order amount in paise must be greater than zero");
    error.status = 400;
    throw error;
  }

  return getRazorpay().orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: resolvedReceipt,
  });
}

/**
 * Verifies the HMAC-SHA256 signature Razorpay returns after checkout.
 */
function verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return false;
  if (!process.env.RAZORPAY_KEY_SECRET) return false;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  return timingSafeHexCompare(expectedSignature, String(razorpay_signature).trim());
}

/**
 * Verifies the HMAC-SHA256 webhook signature from X-Razorpay-Signature against the raw request body.
 */
function verifyWebhookSignature(rawBody, signatureHeader) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    const error = new Error("RAZORPAY_WEBHOOK_SECRET is not configured on the server");
    error.status = 503;
    throw error;
  }
  if (!signatureHeader || !rawBody) {
    return false;
  }
  const payloadBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody), "utf8");
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(payloadBuffer)
    .digest("hex");

  return timingSafeHexCompare(expectedSignature, String(signatureHeader).trim());
}

module.exports = {
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
};
