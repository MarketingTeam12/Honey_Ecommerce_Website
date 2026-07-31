const axios = require("axios");

/**
 * WhatsApp notification service using Interakt's Public API — plain
 * text / session messages (no approved template required).
 *
 * NOTE: Interakt only allows plain text messages within the 24-hour
 * "session window" — i.e. after the recipient has messaged your WhatsApp
 * business number within the last 24 hours. If a recipient hasn't messaged
 * you recently, Interakt will reject the send and you'll need an approved
 * template instead (ask your senior for the template name once it's ready,
 * and this file can be extended to support that too).
 *
 * Docs: https://developers.interakt.ai/
 * Endpoint: POST https://api.interakt.ai/v1/public/message/
 * Auth: Authorization: Basic <API Key>  (paste the key from Interakt exactly
 *       as given — do NOT re-encode it, Interakt already gives it base64-ready.)
 *
 * Configure these in backend/.env:
 *   INTERAKT_API_KEY       - the API key from Interakt
 *   WHATSAPP_ADMIN_NUMBER  - admin's WhatsApp number, digits only with
 *                            country code, e.g. 91XXXXXXXXXX (no + or spaces)
 *   WHATSAPP_ORDER_TEMPLATE - name of your APPROVED order-confirmation
 *                            template (Interakt > Templates). Once set,
 *                            customer messages always go out reliably,
 *                            like Flipkart/Amazon — no 24h session needed.
 *   WHATSAPP_TEMPLATE_LANG - template language code, defaults to "en"
 */

const INTERAKT_API_URL = "https://api.interakt.ai/v1/public/message/";

const isConfigured = () => Boolean(process.env.INTERAKT_API_KEY);

const buildHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Basic ${process.env.INTERAKT_API_KEY}`,
});

// Splits a number like "91XXXXXXXXXX" into countryCode + phoneNumber the
// way Interakt's API expects them. Assumes a 2-digit country code (91 for
// India) — adjust the slice below if you ever send to other countries.
const splitPhoneNumber = (fullNumber) => {
  const digitsOnly = String(fullNumber || "").replace(/\D/g, "");
  const countryCode = `+${digitsOnly.slice(0, 2)}`;
  const phoneNumber = digitsOnly.slice(2);
  return { countryCode, phoneNumber };
};

const sendWhatsAppMessage = async (to, message) => {
  if (!isConfigured()) {
    console.warn(
      "⚠️ WhatsApp not configured (INTERAKT_API_KEY missing in .env) — skipping WhatsApp notification"
    );
    return { skipped: true };
  }

  if (!to) {
    console.warn("⚠️ WhatsApp send skipped — no recipient number provided");
    return { skipped: true };
  }

  const { countryCode, phoneNumber } = splitPhoneNumber(to);

  const payload = {
    countryCode,
    phoneNumber,
    type: "Text",
    data: {
      message,
    },
  };

  try {
    const response = await axios.post(INTERAKT_API_URL, payload, {
      headers: buildHeaders(),
    });

    console.log("✅ WhatsApp (Interakt) notification sent to", to);
    return response.data;
  } catch (error) {
    // Never let a WhatsApp failure break the order/payment flow that
    // triggered it — just log it so the order still completes normally.
    const details = error.response?.data || error.message;
    console.error("❌ WhatsApp (Interakt) send failed:", details);

    // Common failure: recipient hasn't messaged in the last 24h, so a plain
    // text message isn't allowed — Interakt requires an approved template
    // for that case.
    if (
      JSON.stringify(details || "").toLowerCase().includes("template") ||
      JSON.stringify(details || "").toLowerCase().includes("session")
    ) {
      console.warn(
        "⚠️ This likely failed because the 24-hour session window is closed. " +
        "An approved WhatsApp template is required to message outside that window."
      );
    }

    return { error: true, details };
  }
};

// Sends an approved WhatsApp TEMPLATE message. Use this for the customer,
// since a plain text ("session") message only works if the customer has
// messaged your WhatsApp number in the last 24 hours — a template works
// ANY time, no session window needed (this is how Flipkart/Amazon etc.
// always manage to message you after checkout).
//
// `templateName` must exactly match an APPROVED template name in your
// Interakt/Meta WhatsApp Business account (check Interakt > Templates).
// `bodyValues` must be an array of strings, in the same order as the
// {{1}}, {{2}}, {{3}}... variables inside that template's body.
const sendWhatsAppTemplate = async (to, templateName, bodyValues = []) => {
  if (!isConfigured()) {
    console.warn(
      "⚠️ WhatsApp not configured (INTERAKT_API_KEY missing in .env) — skipping WhatsApp template"
    );
    return { skipped: true };
  }

  if (!to) {
    console.warn("⚠️ WhatsApp template send skipped — no recipient number provided");
    return { skipped: true };
  }

  if (!templateName) {
    console.warn("⚠️ WhatsApp template send skipped — no template name provided");
    return { skipped: true };
  }

  const { countryCode, phoneNumber } = splitPhoneNumber(to);

  const payload = {
    countryCode,
    phoneNumber,
    callbackData: "order_confirmation",
    type: "Template",
    template: {
      name: templateName,
      languageCode: process.env.WHATSAPP_TEMPLATE_LANG || "en",
      bodyValues,
    },
  };

  try {
    const response = await axios.post(INTERAKT_API_URL, payload, {
      headers: buildHeaders(),
    });

    console.log(`✅ WhatsApp template "${templateName}" sent to`, to);
    return response.data;
  } catch (error) {
    const details = error.response?.data || error.message;
    console.error(`❌ WhatsApp template "${templateName}" send failed:`, details);
    return { error: true, details };
  }
};

// Sends the "new order" alert to the admin's WhatsApp number (WHATSAPP_ADMIN_NUMBER).
const notifyAdminNewOrder = async (order) => {
  const adminNumber = process.env.WHATSAPP_ADMIN_NUMBER;
  if (!adminNumber) {
    console.warn(
      "⚠️ WHATSAPP_ADMIN_NUMBER not set in .env — skipping admin WhatsApp notification"
    );
    return { skipped: true };
  }

  const message = [
    "🛒 *New Order Received!*",
    `Order ID: ${order.orderId || order.order_number || "N/A"}`,
    `Customer: ${order.customerName || "N/A"}`,
    order.customerPhone ? `Phone: ${order.customerPhone}` : null,
    `Amount: ₹${order.amount || "0"}`,
    order.service ? `Service: ${order.service}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return sendWhatsAppMessage(adminNumber, message);
};

// Sends an order-confirmation message to the customer's own WhatsApp number.
// Prefers the approved WHATSAPP_ORDER_TEMPLATE (works anytime, no session
// window needed — this is the Flipkart-style reliable path). Falls back to
// a plain text session message only if no template name is configured.
const notifyCustomerOrderConfirmed = async (order) => {
  if (!order.customerPhone) {
    console.warn(
      "⚠️ No customer phone number provided — skipping customer WhatsApp notification"
    );
    return { skipped: true };
  }

  const templateName = process.env.WHATSAPP_ORDER_TEMPLATE;

  if (templateName) {
    // bodyValues order MUST match the {{1}}, {{2}}, {{3}}... variables
    // exactly as they appear in your approved template's body text.
    const bodyValues = [
      order.customerName || "there",
      order.orderId || order.order_number || "N/A",
      `₹${order.amount || "0"}`,
    ];
    return sendWhatsAppTemplate(order.customerPhone, templateName, bodyValues);
  }

  console.warn(
    "⚠️ WHATSAPP_ORDER_TEMPLATE not set in .env — falling back to plain text " +
    "(this will only work if the customer messaged you in the last 24h)"
  );

  const message = [
    `Hi ${order.customerName || "there"}! 👋`,
    "Your order with Honey Translations has been *confirmed* ✅",
    `Order ID: ${order.orderId || order.order_number || "N/A"}`,
    `Amount Paid: ₹${order.amount || "0"}`,
    order.service ? `Service: ${order.service}` : null,
    "",
    "We'll keep you updated on the progress. Thank you for choosing us!",
  ]
    .filter(Boolean)
    .join("\n");

  return sendWhatsAppMessage(order.customerPhone, message);
};

module.exports = {
  sendWhatsAppMessage,
  sendWhatsAppTemplate,
  notifyAdminNewOrder,
  notifyCustomerOrderConfirmed,
};