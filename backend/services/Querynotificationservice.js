const resend = require("../utils/resend");

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Honey Translations <onboarding@resend.dev>";
const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "admin@honeytranslations.com";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Sends the "new query" alert to the admin inbox.
 */
async function notifyAdminOfNewQuery(query) {
  try {
    const safeName = escapeHtml(query.name || "Anonymous");
    const safeEmail = escapeHtml(query.email || "-");
    const safePhone = escapeHtml(query.phone || "-");
    const safeSubject = escapeHtml(query.subject || "-");
    const safeMessage = escapeHtml(query.message || "").replace(/\n/g, "<br/>");

    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_NOTIFICATION_EMAIL,
      subject: `New Customer Query: ${query.subject || "General Inquiry"}`,
      html: `
        <h2>New Customer Query Received</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Phone:</strong> ${safePhone}</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <p><strong>Message:</strong></p>
        <p>${safeMessage}</p>
      `,
      text: [
        "New Customer Query Received",
        `Name: ${query.name || "Anonymous"}`,
        `Email: ${query.email || "-"}`,
        `Phone: ${query.phone || "-"}`,
        `Subject: ${query.subject || "-"}`,
        "Message:",
        query.message || "",
      ].join("\n"),
    });

    if (data?.error) {
      console.error("Resend rejected admin query notification:", data.error);
    }

    return data;
  } catch (error) {
    // Notification failures must never block the customer's query from being saved.
    console.error("Failed to send admin query notification email:", error.message);
    return null;
  }
}

/**
 * Sends the "we received your query" confirmation to the customer.
 */
async function notifyCustomerOfQueryReceived(query) {
  if (!query.email) {
    return null;
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: query.email,
      subject: "We've received your query - Honey Translations",
      html: `
        <h2>Thank you for reaching out, ${query.name || "there"}!</h2>
        <p>We've received your query and our team will get back to you shortly.</p>
        <p><strong>Your message:</strong></p>
        <p>${(query.message || "").replace(/\n/g, "<br/>")}</p>
        <p>If this is urgent, feel free to reply directly to this email.</p>
      `,
      text: [
        `Thank you for reaching out, ${query.name || "there"}!`,
        "We've received your query and our team will get back to you shortly.",
        "Your message:",
        query.message || "",
        "If this is urgent, feel free to reply directly to this email.",
      ].join("\n"),
    });

    if (data?.error) {
      console.error("Resend rejected customer query confirmation:", data.error);
    }

    return data;
  } catch (error) {
    console.error("Failed to send customer query confirmation email:", error.message);
    return null;
  }
}

/**
 * Fires both notifications at the same time. Neither failure blocks the other,
 * and neither ever throws - the query is already saved in the DB by this point.
 */
async function sendQueryNotifications(query) {
  const [adminResult, customerResult] = await Promise.allSettled([
    notifyAdminOfNewQuery(query),
    notifyCustomerOfQueryReceived(query),
  ]);

  return { adminResult, customerResult };
}

module.exports = {
  notifyAdminOfNewQuery,
  notifyCustomerOfQueryReceived,
  sendQueryNotifications,
};