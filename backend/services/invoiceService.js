const { renderInvoicePdf } = require("./pdfDocuments");

const toItem = (item) => {
  const pages = Array.isArray(item.pages) ? item.pages.join(", ") : item.pages ?? item.pageCount ?? "";
  const details = [];
  if (item.sourceLanguage) details.push(`Source: ${item.sourceLanguage}`);
  if (item.targetLanguage) details.push(`Target: ${item.targetLanguage}`);
  if (item.documentType) details.push(`Type: ${item.documentType}`);
  if (item.certificateType && item.certificateType !== item.documentType) details.push(`Certificate: ${item.certificateType}`);
  if (Array.isArray(item.files) && item.files.length > 0) details.push(`Files: ${item.files.join(", ")}`);
  return {
    description: item.description || item.name || item.service_name || "Item",
    quantity: item.quantity || item.uploadedDocuments?.length || 1,
    pages,
    rate: item.rate ?? item.basePrice ?? item.amount ?? 0,
    amount: item.amount ?? item.totalPrice ?? item.rate ?? item.basePrice ?? 0,
    details,
  };
};

/** Renders an invoice PDF (Buffer). Discount / coupon / fee lines only appear when they apply. */
const generateInvoice = async (invoiceData) => {
  const adjustments = [];
  if (Number(invoiceData.discount) > 0) {
    adjustments.push({ label: "Discount", amount: invoiceData.discount, deduct: true });
  }
  if (Number(invoiceData.coupon_discount) > 0) {
    const code = invoiceData.coupon_code ? ` (${invoiceData.coupon_code})` : "";
    adjustments.push({ label: `Coupon Applied${code}`, amount: invoiceData.coupon_discount, deduct: true });
  }
  if (Number(invoiceData.processing_fee) > 0) {
    adjustments.push({ label: "Processing Fee", amount: invoiceData.processing_fee, deduct: false });
  }

  const items = Array.isArray(invoiceData.items) && invoiceData.items.length > 0
    ? invoiceData.items
    : [{ description: invoiceData.service_name || "Service", quantity: 1, amount: invoiceData.amount ?? 0 }];

  return renderInvoicePdf({
    customer_name: invoiceData.customer_name || "Customer",
    customer_email: invoiceData.customer_email || "",
    customer_address_lines: (invoiceData.customer_address_lines || [invoiceData.customer_city, invoiceData.customer_country]).filter(Boolean),
    customer_gstin: invoiceData.customer_gstin || "",
    company_gstin: invoiceData.company_gstin ?? process.env.COMPANY_GSTIN ?? "",
    invoice_number: invoiceData.invoice_number,
    invoice_date: invoiceData.invoice_date,
    payment_method: invoiceData.payment_method || "Razorpay",
    payment_status: invoiceData.payment_status || "PAID",
    payment_id: invoiceData.payment_id || "N/A",
    items: items.map(toItem),
    subtotal: invoiceData.amount,
    tax: invoiceData.tax,
    adjustments,
    total: invoiceData.total,
  });
};

/** DD/MM/YYYY in India time, whatever the server's locale/timezone is. */
const formatInvoiceDate = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" });
};

const parseJsonValue = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const PAID_STATUSES = new Set(["paid", "completed", "success", "captured", "refunded", "partially_refunded"]);

/**
 * Builds invoice data from an order row as stored in the database (snake_case
 * columns). Amounts always come from the database, never from the browser.
 */
const buildInvoiceDataFromOrder = (order) => {
  const address = parseJsonValue(order.shipping_address) || {};
  const metadata = parseJsonValue(order.metadata) || {};
  const items = (parseJsonValue(order.items) || []).map((item) => ({
    description: item.name || item.description || "Service",
    quantity: item.quantity || item.uploadedFiles?.length || 1,
    pages: item.pages ?? item.pageCount ?? "",
    rate: item.rate ?? item.basePrice ?? item.totalPrice ?? 0,
    amount: item.amount ?? item.totalPrice ?? item.basePrice ?? 0,
    sourceLanguage: item.sourceLanguage,
    targetLanguage: item.targetLanguage,
    documentType: item.documentType,
    certificateType: item.certificateType,
    files: Array.isArray(item.uploadedFiles)
      ? item.uploadedFiles.map((file) => file?.name).filter(Boolean)
      : [],
  }));

  const cityLine = [address.city, address.state].filter(Boolean).join(", ");
  const pinLine = [cityLine, address.pincode || address.postalCode || address.zipCode || address.zip]
    .filter(Boolean)
    .join(" - ");
  const paymentStatus = String(order.payment_status || "").toLowerCase();

  return {
    customer_name: address.name || order.customer_name,
    customer_email: order.customer_email,
    customer_address_lines: [
      address.addressLine1 || address.address || address.street || address.line1,
      address.addressLine2 || address.line2,
      pinLine,
      address.country,
    ].filter(Boolean),
    customer_gstin: order.gst_number || metadata.gst_number || metadata.gstNumber || "",
    invoice_number: order.invoice_number || order.order_number,
    invoice_date: formatInvoiceDate(order.invoice_date || order.created_at),
    payment_id: order.transaction_id || "N/A",
    payment_method: order.payment_method === "razorpay" || !order.payment_method ? "Razorpay" : order.payment_method,
    // The status at the time of sale – a later refund is shown on the credit
    // note, not by changing the invoice.
    payment_status: PAID_STATUSES.has(paymentStatus) ? "PAID" : "UNPAID",
    service_name: items[0]?.description || "Translation Service",
    amount: order.subtotal ?? order.total_amount,
    tax: order.tax,
    discount: order.discount,
    coupon_code: order.coupon_code,
    coupon_discount: order.coupon_discount,
    processing_fee: order.processing_fee,
    total: order.total_amount,
    items,
  };
};

module.exports = {
  generateInvoice,
  buildInvoiceDataFromOrder,
  formatInvoiceDate,
};