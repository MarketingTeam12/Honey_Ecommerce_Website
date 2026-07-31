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

  return getRazorpay().orders.create({
    amount: Math.round(numericAmount * 100),
    currency,
    receipt: resolvedReceipt,
  });
}

// Verifies the HMAC-SHA256 signature Razorpay returns after checkout, using
// razorpay_order_id + razorpay_payment_id + key secret, per Razorpay docs.
function verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return false;
  if (!process.env.RAZORPAY_KEY_SECRET) return false;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  return expectedSignature === razorpay_signature;
}

module.exports = {
  createOrder,
  verifyPaymentSignature,
};
