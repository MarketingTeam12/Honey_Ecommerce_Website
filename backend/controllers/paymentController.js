const crypto = require("crypto");

const { generateInvoice } = require("../services/invoiceService");
const siteData = require("../services/siteDataService");
const { uploadBuffer, buildFileUrl } = require("../services/s3Service");
const { notifyAdminNewOrder, notifyCustomerOrderConfirmed } = require("../services/whatsappService");

const verifyPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customer
    } = req.body;

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      await siteData.savePayment({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        gateway: "razorpay",
        status: "verified",
        amount: Number(customer.amount || 0),
        currency: "INR",
        method: customer.paymentMethod || "razorpay",
        gatewayResponse: {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        },
        metadata: customer,
      });

      // Update our own order record (created earlier in /payment/create-order)
      // so the admin panel reflects the confirmed payment and the tracking
      // page shows the order has moved past "order received".
      if (orderId) {
        await siteData
          .updateOrderPaymentStatus(orderId, "paid")
          .catch((err) => console.error("Failed to update order payment status:", err.message));
        await siteData
          .updateOrderStatus(orderId, "confirmed")
          .catch((err) => console.error("Failed to update order status:", err.message));
        await siteData
          .saveTracking(orderId, { stage: "payment_confirmed" })
          .catch((err) => console.error("Failed to update tracking stage:", err.message));
      } else {
        console.warn("⚠️ Payment verified but no internal orderId was sent — order/tracking records were not updated.");
      }

      const invoiceNumber = `INV-${Date.now()}`;
      const invoiceBuffer = await generateInvoice({
        customer_name: customer.name,
        customer_email: customer.email,
        customer_city: "Chennai",
        customer_country: "India",
        invoice_number: invoiceNumber,
        invoice_date: new Date().toLocaleDateString(),
        payment_id: razorpay_payment_id,
        service_name: `${customer.sourceLanguage} to ${customer.targetLanguage} Translation`,
        amount: customer.amount,
        tax: 0,
        discount: 200,
        coupon_code: "WELCOME200",
        coupon_discount: 200,
        processing_fee: 0,
        total: customer.amount,
        items: Array.isArray(customer.items)
          ? customer.items
          : [{
              description: `${customer.sourceLanguage} to ${customer.targetLanguage} Translation`,
              quantity: 1,
              pages: customer.pageCount || '',
              rate: customer.amount,
              amount: customer.amount,
              sourceLanguage: customer.sourceLanguage,
              targetLanguage: customer.targetLanguage,
            }],
      });

      const uploaded = await uploadBuffer({
        buffer: invoiceBuffer,
        originalName: `${invoiceNumber}.pdf`,
        mimeType: "application/pdf",
        folder: "invoices",
      });

      const invoicePath = buildFileUrl(req, uploaded.key);

      // Notify admin + customer on WhatsApp about the new paid order. This
      // runs "fire and forget" style — if WhatsApp fails for any reason it's
      // just logged, the customer's payment/invoice flow is unaffected.
      const orderNotifyPayload = {
        orderId: razorpay_order_id,
        customerName: customer.name,
        customerPhone: customer.phone,
        amount: customer.amount,
        service: `${customer.sourceLanguage} to ${customer.targetLanguage} Translation`,
      };
      notifyAdminNewOrder(orderNotifyPayload).catch((err) =>
        console.error("WhatsApp admin notify error:", err)
      );
      notifyCustomerOrderConfirmed(orderNotifyPayload).catch((err) =>
        console.error("WhatsApp customer notify error:", err)
      );

      return res.json({
        success: true,
        message: "Payment Verified",
        invoicePath,
        invoiceKey: uploaded.key,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid Signature"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const generateInvoiceFromOrder = async (req, res) => {
  try {
    const { order } = req.body || {};

    if (!order || !order.order_number) {
      return res.status(400).json({
        success: false,
        message: "Order data is required",
      });
    }

    const items = Array.isArray(order.items)
      ? order.items.map((item) => ({
          description: item.name || "Service",
          quantity: item.quantity || item.pageCount || 1,
          pages: item.pages ?? item.pageCount ?? "",
          rate: item.rate ?? item.basePrice ?? item.totalPrice ?? 0,
          amount: item.amount ?? item.totalPrice ?? item.basePrice ?? 0,
          sourceLanguage: item.sourceLanguage,
          targetLanguage: item.targetLanguage,
          documentType: item.documentType,
          certificateType: item.certificateType,
          files: Array.isArray(item.uploadedFiles)
            ? item.uploadedFiles.map((file) => file.name).filter(Boolean)
            : [],
        }))
      : [];

    const invoiceNumber = order.order_number || `INV-${Date.now()}`;
    const invoiceBuffer = await generateInvoice({
      customer_name: order.customer_name || "Customer",
      customer_email: order.customer_email || "",
      customer_city: order.shipping_address?.city || "Chennai",
      customer_country: order.shipping_address?.country || "India",
      invoice_number: invoiceNumber,
      invoice_date: new Date(order.created_at || Date.now()).toLocaleDateString(),
      payment_id: order.transaction_id || order.id || "N/A",
      service_name: items[0]?.description || "Translation Service",
      amount: Number(order.subtotal ?? order.total_amount ?? 0).toFixed(2),
      tax: Number(order.tax ?? 0).toFixed(2),
      discount: Number(order.discount ?? 0).toFixed(2),
      coupon_code: order.coupon_code || "N/A",
      coupon_discount: Number(order.coupon_discount ?? 0).toFixed(2),
      processing_fee: Number(order.processing_fee ?? 0).toFixed(2),
      total: Number(order.total_amount ?? 0).toFixed(2),
      items,
    });

    const uploaded = await uploadBuffer({
      buffer: invoiceBuffer,
      originalName: `${invoiceNumber}.pdf`,
      mimeType: "application/pdf",
      folder: "invoices",
    });

    const invoicePath = buildFileUrl(req, uploaded.key);

    return res.json({
      success: true,
      invoicePath,
      invoiceKey: uploaded.key,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate invoice",
    });
  }
};

module.exports = {
  verifyPayment,
  generateInvoiceFromOrder,
};