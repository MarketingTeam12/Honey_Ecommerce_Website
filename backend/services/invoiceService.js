const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

// Launching a full Chromium process on every single invoice request is slow
// (multiple seconds). Reuse one browser instance across requests instead,
// launching it lazily on first use and keeping it warm.
let browserPromise = null;
async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  try {
    const browser = await browserPromise;
    if (!browser.isConnected()) {
      browserPromise = null;
      return getBrowser();
    }
    return browser;
  } catch (err) {
    browserPromise = null;
    throw err;
  }
}

const escapeHtml = (text) => {
  if (text === undefined || text === null) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `₹${amount.toFixed(2)}`;
};

const buildInvoiceRows = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return `<tr>
      <td class="desc-col">Service</td>
      <td class="qty-col">1</td>
      <td class="pages-col">1</td>
      <td class="rate-col">${formatCurrency(0)}</td>
      <td class="amount-col right">${formatCurrency(0)}</td>
    </tr>`;
  }

  return items
    .map((item) => {
      const description = escapeHtml(item.description || item.name || item.service_name || "Item");
      const quantity = item.quantity || item.uploadedDocuments?.length || 1;
      const pagesValue = Array.isArray(item.pages)
        ? item.pages.join(', ')
        : item.pages ?? item.pageCount ?? '';
      const pages = escapeHtml(pagesValue);
      const rate = formatCurrency(item.rate ?? item.basePrice ?? item.amount ?? 0);
      const amount = formatCurrency(item.amount ?? item.totalPrice ?? item.rate ?? item.basePrice ?? 0);

      const details = [];
      if (item.sourceLanguage) details.push(`Source: ${escapeHtml(item.sourceLanguage)}`);
      if (item.targetLanguage) details.push(`Target: ${escapeHtml(item.targetLanguage)}`);
      if (item.documentType) details.push(`Type: ${escapeHtml(item.documentType)}`);
      if (item.certificateType) details.push(`Certificate: ${escapeHtml(item.certificateType)}`);
      if (Array.isArray(item.files) && item.files.length > 0) {
        details.push(`Files: ${escapeHtml(item.files.join(', '))}`);
      }

      return `<tr>
        <td class="desc-col">${description}</td>
        <td class="qty-col">${quantity}</td>
        <td class="pages-col">${pages}</td>
        <td class="rate-col">${rate}</td>
        <td class="amount-col right">${amount}</td>
      </tr>${details.length > 0 ? `\n<tr><td colspan="5" class="item-details">${details.join(' • ')}</td></tr>` : ''}`;
    })
    .join('\n');
};

const generateInvoice = async (invoiceData) => {
  try {
    let html = fs.readFileSync(
      path.join(__dirname, "../templates/invoiceTemplate.html"),
      "utf8"
    );

    const money = (value) => Number(value || 0).toFixed(2);
    const addressLines = (invoiceData.customer_address_lines || [
      invoiceData.customer_city,
      invoiceData.customer_country,
    ])
      .filter(Boolean)
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join("\n");

    // Discount / coupon / fee rows only appear when they actually apply.
    const adjustmentRows = [];
    if (Number(invoiceData.discount) > 0) {
      adjustmentRows.push(`<div class="totals-row discount"><span>Discount</span><span>- ₹${money(invoiceData.discount)}</span></div>`);
    }
    if (Number(invoiceData.coupon_discount) > 0) {
      const code = invoiceData.coupon_code ? ` (${escapeHtml(invoiceData.coupon_code)})` : "";
      adjustmentRows.push(`<div class="totals-row coupon"><span>Coupon Applied${code}</span><span>- ₹${money(invoiceData.coupon_discount)}</span></div>`);
    }
    if (Number(invoiceData.processing_fee) > 0) {
      adjustmentRows.push(`<div class="totals-row"><span>Processing Fee</span><span>₹${money(invoiceData.processing_fee)}</span></div>`);
    }

    const companyGstin = invoiceData.company_gstin ?? process.env.COMPANY_GSTIN ?? "";
    const values = {
      customer_name: escapeHtml(invoiceData.customer_name || "Customer"),
      customer_email: escapeHtml(invoiceData.customer_email || ""),
      customer_address_lines: addressLines,
      customer_gstin_line: invoiceData.customer_gstin
        ? `<p>GSTIN: ${escapeHtml(invoiceData.customer_gstin)}</p>`
        : "",
      company_gstin_line: companyGstin ? `<p>GSTIN: ${escapeHtml(companyGstin)}</p>` : "",
      invoice_number: escapeHtml(invoiceData.invoice_number),
      invoice_date: escapeHtml(invoiceData.invoice_date),
      payment_id: escapeHtml(invoiceData.payment_id || "N/A"),
      payment_method: escapeHtml(invoiceData.payment_method || "Razorpay"),
      payment_status: escapeHtml(invoiceData.payment_status || "PAID"),
      service_name: escapeHtml(invoiceData.service_name),
      amount: money(invoiceData.amount),
      tax: money(invoiceData.tax),
      total: money(invoiceData.total),
      adjustment_rows: adjustmentRows.join("\n"),
    };
    html = html.replace(/{{(\w+)}}/g, (match, key) => (key in values ? values[key] : match));

    const invoiceRows = buildInvoiceRows(
      Array.isArray(invoiceData.items)
        ? invoiceData.items
        : [{
            description: invoiceData.service_name,
            quantity: invoiceData.quantity ?? 1,
            pages: invoiceData.pages ?? invoiceData.pageCount ?? '',
            rate: invoiceData.rate ?? invoiceData.amount ?? 0,
            amount: invoiceData.amount ?? 0,
            sourceLanguage: invoiceData.sourceLanguage,
            targetLanguage: invoiceData.targetLanguage,
            documentType: invoiceData.documentType,
            certificateType: invoiceData.certificateType,
            files: invoiceData.files || [],
          }]
    );

    html = html.replace(/{{invoice_rows}}/g, invoiceRows);

    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(html, {
        waitUntil: "domcontentloaded",
      });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
      });

      return pdfBuffer;
    } finally {
      await page.close();
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
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
  getBrowser,
};