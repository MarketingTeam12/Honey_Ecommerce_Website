const express = require("express");
const multer = require("multer");
const axios = require("axios");
const resend = require("../utils/resend");
const { uploadFileFromRequest } = require("../services/s3Service");
const siteData = require("../services/siteDataService");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

const getAttachmentContent = (content) => {
  if (!content || typeof content !== "string") {
    return content;
  }

  return content.includes(",") ? content.split(",")[1] : content;
};

const getUploadedFiles = (req) => {
  if (req.file) {
    return [req.file];
  }

  if (!req.files) {
    return [];
  }

  if (Array.isArray(req.files)) {
    return req.files;
  }

  return Object.values(req.files).flat();
};

const buildEmailAttachments = (req) => {
  const uploadedFiles = getUploadedFiles(req);

  if (uploadedFiles.length > 0) {
    return uploadedFiles.map((file) => ({
      filename: file.originalname,
      content: file.buffer,
      contentType: file.mimetype,
    }));
  }

  if (!Array.isArray(req.body.attachments)) {
    return [];
  }

  return req.body.attachments
    .filter((attachment) => attachment?.content || attachment?.data)
    .map((attachment, index) => ({
      filename: attachment.filename || attachment.name || `document-${index + 1}`,
      content: Buffer.from(getAttachmentContent(attachment.content || attachment.data), "base64"),
      contentType: attachment.contentType || attachment.type || attachment.content_type,
    }));
};

const getAttachmentNames = (attachments) =>
  attachments
    .map((attachment) => attachment.filename)
    .filter(Boolean);

router.post('/send-document', upload.fields([
  { name: 'document', maxCount: 1 },
  { name: 'documents', maxCount: 20 }
]), async (req, res) => {
  try {
    const email = req.body.email || req.body.customerEmail;
    const orderNumber = req.body.orderNumber;
    const orderId = req.body.orderId || req.body.order_id;
    const attachments = buildEmailAttachments(req);
    const uploadedFiles = getUploadedFiles(req);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Delivery email is required"
      });
    }

    if (attachments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Document file is required"
      });
    }

    const uploadedToS3 = await Promise.all(
      uploadedFiles.map((file) => uploadFileFromRequest(req, file, "documents/outgoing")),
    );

    const attachmentNames = getAttachmentNames(attachments);

    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Documents <onboarding@resend.dev>",
      to: email,
      subject: orderNumber
        ? `Completed document for order ${orderNumber}`
        : "Your completed translated document",
      html: `
        <h2>Your document is ready</h2>
        <p>Please download the completed document attached to this email.</p>
        ${orderNumber ? `<p>Order number: ${orderNumber}</p>` : ""}
        ${attachmentNames.length > 0
          ? `<p>Attached file${attachmentNames.length > 1 ? "s" : ""}: ${attachmentNames.join(", ")}</p>`
          : ""}
        ${uploadedToS3.length > 0
          ? `<p>Stored in S3: ${uploadedToS3.map((item) => item.url).join(", ")}</p>`
          : ""}
      `,
      text: [
        "Your document is ready.",
        "Please download the completed document attached to this email.",
        orderNumber ? `Order number: ${orderNumber}` : "",
        attachmentNames.length > 0 ? `Attached files: ${attachmentNames.join(", ")}` : "",
        uploadedToS3.length > 0 ? `S3 files: ${uploadedToS3.map((item) => item.url).join(", ")}` : "",
      ].filter(Boolean).join("\n"),
      attachments
    });

    if (data?.error) {
      console.error("Resend rejected document email:", data.error);
      if (orderId) {
        await siteData.updateOrderEmailStatus(orderId, {
          status: "failed",
          error: data.error.message || "Email provider rejected the document email",
        }).catch(() => {});
      }
      return res.status(502).json({
        success: false,
        message: data.error.message || "Email provider rejected the document email",
        providerMessage: data.error.message,
        providerError: data.error
      });
    }

    if (orderId) {
      await siteData.updateOrderEmailStatus(orderId, { status: "sent" }).catch(() => {});
    }

    res.json({
      success: true,
      message: "Document Sent Successfully",
      emailId: data?.data?.id || data?.id,
      to: email,
      attachments: attachmentNames,
      uploadedFiles: uploadedToS3,
    });

  } catch (error) {
    console.error("Failed to send document:", error);

    const orderId = req.body.orderId || req.body.order_id;
    if (orderId) {
      await siteData.updateOrderEmailStatus(orderId, {
        status: "failed",
        error: error?.response?.data?.message || error?.message || "Failed to send document",
      }).catch(() => {});
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to send document",
      providerMessage: error?.response?.data?.message || error?.message
    });
  }
});

router.post('/orders/:id/resend-email', requireAuth, async (req, res) => {
  try {
    const order = await siteData.getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const fileUrl = order.completed_file_url || order.completedFileUrl;
    const email = order.customer_email || order.customerEmail;

    if (!fileUrl) {
      return res.status(400).json({ success: false, message: "No completed file on this order to resend" });
    }
    if (!email) {
      return res.status(400).json({ success: false, message: "Order has no customer email on file" });
    }

    const fileResponse = await axios.get(fileUrl, { responseType: "arraybuffer" });
    const fileName = order.completed_file_name || order.completedFileName || "completed-document";

    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Documents <onboarding@resend.dev>",
      to: email,
      subject: order.order_number
        ? `Completed document for order ${order.order_number}`
        : "Your completed translated document",
      html: `
        <h2>Your document is ready</h2>
        <p>Please download the completed document attached to this email.</p>
        ${order.order_number ? `<p>Order number: ${order.order_number}</p>` : ""}
      `,
      text: `Your document is ready. Order number: ${order.order_number || ""}`,
      attachments: [
        {
          filename: fileName,
          content: Buffer.from(fileResponse.data),
        },
      ],
    });

    if (data?.error) {
      await siteData.updateOrderEmailStatus(req.params.id, {
        status: "failed",
        error: data.error.message || "Email provider rejected the document email",
      });
      return res.status(502).json({ success: false, message: data.error.message });
    }

    const updatedOrder = await siteData.updateOrderEmailStatus(req.params.id, { status: "sent" });
    res.json({ success: true, message: "Email resent successfully", order: updatedOrder });
  } catch (error) {
    console.error("Failed to resend document email:", error);
    await siteData.updateOrderEmailStatus(req.params.id, {
      status: "failed",
      error: error?.response?.data?.message || error?.message || "Failed to resend email",
    }).catch(() => {});
    res.status(500).json({
      success: false,
      message: error?.response?.data?.message || error?.message || "Failed to resend email",
    });
  }
});

module.exports = router;
