const crypto = require("crypto");

const siteData = require("../services/siteDataService");
const razorpayService = require("../services/razorpayService");
const { notifyAdminNewOrder, notifyCustomerOrderConfirmed } = require("../services/whatsappService");

const verifyPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customer = {}
    } = req.body || {};

    if (!razorpayService.verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature })) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    if (true) {
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

      // The invoice is no longer generated here: it used hardcoded values
      // (city, coupon, tax). Customers download it from the stored order via
      // GET /api/orders/:id/invoice instead.

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
        invoicePath: null,
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

module.exports = {
  verifyPayment,
};
