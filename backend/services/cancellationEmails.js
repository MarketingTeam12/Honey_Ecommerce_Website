/**
 * Cancellation & refund emails, sent through the same Resend client and
 * styling as the existing order emails. Every function resolves quietly when
 * email isn't configured; the caller logs failures without blocking the workflow.
 */
const { CANCELLATION_REASONS } = require("./cancellationPolicy");

const SITE_URL = process.env.PUBLIC_SITE_URL || "https://honeyuniversal.com";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const money = (value) => `₹${Number(value || 0).toFixed(2)}`;

function layout(bodyHtml) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; color: #1f2937;">
      <h2 style="color: #1a1f5c;">Honey Universal Services</h2>
      ${bodyHtml}
      <p>You can view your order anytime at <a href="${SITE_URL}/my-orders" style="color: #2563eb;">My Orders</a>.</p>
      <br/>
      <p style="color: #666; font-size: 13px;">Honey Universal Digital Private Limited<br/>Support: salesteam@honeytranslations.com | +91 72990 05577</p>
    </div>
  `;
}

function createCancellationEmails({ resend, from, adminEmail }) {
  const sender = from || process.env.RESEND_FROM_EMAIL || "Honey Universal <salesteam@honeytranslations.com>";
  const adminRecipient = adminEmail || process.env.ADMIN_NOTIFICATION_EMAIL || "salesteam@honeytranslations.com";

  async function send(to, subject, bodyHtml) {
    if (!to || !resend || !process.env.RESEND_API_KEY) return;
    await resend.emails.send({ from: sender, to: [to], subject, html: layout(bodyHtml) });
  }

  const orderRef = (order) => escapeHtml(order.order_number || order.id);
  const greet = (order) => `<p>Dear ${escapeHtml(order.customer_name || "Customer")},</p>`;
  const reasonLabel = (reason) => escapeHtml(CANCELLATION_REASONS[reason] || reason);

  return {
    customerRequestReceived: ({ order, request }) =>
      send(
        order.customer_email,
        `Cancellation request received – Order #${order.order_number}`,
        `${greet(order)}
         <p>We've received your request to cancel order <strong>#${orderRef(order)}</strong>.</p>
         <p><strong>Reason:</strong> ${reasonLabel(request.reason)}</p>
         <p>Our team will review it and get back to you shortly. You can withdraw the request from My Orders while it's under review.</p>`,
      ),

    customerRequestWithdrawn: ({ order }) =>
      send(
        order.customer_email,
        `Cancellation request withdrawn – Order #${order.order_number}`,
        `${greet(order)}
         <p>Your cancellation request for order <strong>#${orderRef(order)}</strong> has been withdrawn. We'll continue working on your order.</p>`,
      ),

    customerDeclined: ({ order, request }) =>
      send(
        order.customer_email,
        `Update on your cancellation request – Order #${order.order_number}`,
        `${greet(order)}
         <p>We're unable to cancel order <strong>#${orderRef(order)}</strong>.</p>
         <p><strong>Reason:</strong> ${escapeHtml(request.adminDecisionReason)}</p>
         <p>Work on your order continues. Please reply to this email if you have any questions.</p>`,
      ),

    customerApproved: ({ order, request, refund }) =>
      send(
        order.customer_email,
        `Order #${order.order_number} cancelled`,
        `${greet(order)}
         <p>Your cancellation request for order <strong>#${orderRef(order)}</strong> has been approved and the order is cancelled.</p>
         ${
           refund
             ? `<p><strong>Refund amount:</strong> ${money(refund.amount)}</p>
                <p>The refund has been initiated to your original payment method and usually reaches your account in <strong>5–7 working days</strong>.</p>`
             : `<p>No refund applies to this cancellation${request.adminDecisionReason ? `: ${escapeHtml(request.adminDecisionReason)}` : "."}</p>`
         }`,
      ),

    customerCancelledUnpaid: ({ order }) =>
      send(
        order.customer_email,
        `Order #${order.order_number} cancelled`,
        `${greet(order)}
         <p>Your order <strong>#${orderRef(order)}</strong> has been cancelled. No payment was taken, so there is nothing to refund.</p>`,
      ),

    customerRefundCompleted: ({ order, refund }) =>
      send(
        order.customer_email,
        `Refund completed – Order #${order.order_number}`,
        `${greet(order)}
         <p>Your refund of <strong>${money(refund.amount)}</strong> for order <strong>#${orderRef(order)}</strong> has been processed.</p>
         ${refund.razorpayRefundId ? `<p><strong>Refund reference:</strong> ${escapeHtml(refund.razorpayRefundId)}</p>` : ""}
         ${refund.creditNoteNumber ? `<p><strong>Credit note:</strong> ${escapeHtml(refund.creditNoteNumber)} (download it from My Orders)</p>` : ""}
         <p>Depending on your bank it may take a few days to appear on your statement.</p>`,
      ),

    customerRefundFailed: ({ order, refund }) =>
      send(
        order.customer_email,
        `Refund update – Order #${order.order_number}`,
        `${greet(order)}
         <p>We hit a problem while processing your refund of <strong>${money(refund.amount)}</strong> for order <strong>#${orderRef(order)}</strong>.</p>
         <p>Our team has been alerted and is looking into it. You don't need to do anything — we'll email you once it's resolved.</p>`,
      ),

    adminNewRequest: ({ order, request }) =>
      send(
        adminRecipient,
        `New cancellation request – Order #${order.order_number}`,
        `<p><strong>${escapeHtml(order.customer_name || "A customer")}</strong> (${escapeHtml(order.customer_email)}) requested cancellation of order <strong>#${orderRef(order)}</strong>.</p>
         <p><strong>Reason:</strong> ${reasonLabel(request.reason)}</p>
         ${request.comments ? `<p><strong>Comments:</strong> ${escapeHtml(request.comments)}</p>` : ""}
         <p><strong>Order status at request:</strong> ${escapeHtml(request.orderStatusAtRequest)}</p>
         <p><strong>Suggested refund:</strong> ${money(request.suggestedRefundAmount)}</p>
         <p><a href="${SITE_URL}/admin/sales/orders/${encodeURIComponent(order.id)}" style="color: #2563eb;">Review the request</a></p>`,
      ),
  };
}

module.exports = { createCancellationEmails, escapeHtml };
