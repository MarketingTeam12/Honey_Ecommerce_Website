const axios = require("axios");
const fs = require("fs");

const sendBrevoEmail = async (payload) => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is not configured");
  }

  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      payload,
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("MAIL SUCCESS");
    console.log(response.data);
    return response.data;
  } catch (error) {
    const brevoPayload = error.response?.data;
    const brevoMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Brevo email request failed";

    console.error("MAIL FAILED", brevoPayload || error.message);

    const wrappedError = new Error(getFriendlyBrevoErrorMessage(brevoMessage));
    wrappedError.statusCode = getBrevoStatusCode(error, brevoMessage);
    wrappedError.providerMessage = brevoMessage;
    throw wrappedError;
  }
};

const getFriendlyBrevoErrorMessage = (message) => {
  const normalizedMessage = String(message || "").toLowerCase();

  if (
    normalizedMessage.includes("unrecognised ip") ||
    normalizedMessage.includes("unauthorised ip") ||
    normalizedMessage.includes("authorized_ips") ||
    normalizedMessage.includes("authorised_ips")
  ) {
    return (
      "Brevo blocked this email because the backend server IP is not authorised. " +
      "Add this server IP in Brevo: Security > Authorised IPs, then submit again."
    );
  }

  return message || "Brevo email request failed";
};

const getBrevoStatusCode = (error, message) => {
  const normalizedMessage = String(message || "").toLowerCase();

  if (
    error.response?.status === 401 ||
    error.response?.status === 403 ||
    normalizedMessage.includes("unrecognised ip") ||
    normalizedMessage.includes("unauthorised ip")
  ) {
    return 403;
  }

  return error.response?.status || 500;
};

const getSenderEmail = (options = {}) => {
  const senderEmail = options.senderEmail || process.env.BREVO_SENDER_EMAIL;

  if (!senderEmail) {
    throw new Error(
      "BREVO_SENDER_EMAIL is not configured. Add a verified Brevo sender email in backend/.env"
    );
  }
  return senderEmail;
};

const sendMail = async (
  toEmail,
  filePath,
  fileName,
  options = {}
) => {

  const fileContent = fs
    .readFileSync(filePath)
    .toString("base64");

  return sendMailWithAttachments(
    toEmail,
    [
      {
        content: fileContent,
        name: fileName
      }
    ],
    options
  );
};

const sendMailWithAttachments = async (
  toEmail,
  attachments,
  options = {}
) => {
  if (!toEmail) {
    throw new Error("Recipient email is required");
  }

  if (!Array.isArray(attachments) || attachments.length === 0) {
    throw new Error("At least one attachment is required");
  }

  const normalizedAttachments = attachments.map((attachment) => {
    const content = String(attachment.content || "").includes(",")
      ? String(attachment.content).split(",").pop()
      : attachment.content;

    if (!content || !attachment.name) {
      throw new Error("Attachment content and name are required");
    }

    return {
      content,
      name: attachment.name
    };
  });

  return sendBrevoEmail({
    sender: {
      name: options.senderName || "Honey Translation Services",
      email: getSenderEmail(options)
    },

    to: [
      {
        email: toEmail
      },
    ],

    subject: options.subject || "Your completed translated document",

    htmlContent: options.htmlContent || `
      <h2>Hello</h2>
      <p>Your completed translated document is attached.</p>
    `,

    attachment: normalizedAttachments
  });
};

sendMail.sendMailWithAttachments = sendMailWithAttachments;

module.exports = sendMail;
