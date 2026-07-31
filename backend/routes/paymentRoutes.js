const express = require("express");

const router = express.Router();

const {
  verifyPayment,
  generateInvoiceFromOrder
} = require("../controllers/paymentController");

router.post("/verify-payment", verifyPayment);
router.post("/generate-invoice", generateInvoiceFromOrder);

module.exports = router;
