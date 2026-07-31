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

    html = html.replace(/{{customer_name}}/g, invoiceData.customer_name);
    html = html.replace(/{{customer_email}}/g, invoiceData.customer_email);
    html = html.replace(/{{customer_city}}/g, invoiceData.customer_city);
    html = html.replace(/{{customer_country}}/g, invoiceData.customer_country);
    html = html.replace(/{{invoice_number}}/g, invoiceData.invoice_number);
    html = html.replace(/{{invoice_date}}/g, invoiceData.invoice_date);
    html = html.replace(/{{payment_id}}/g, invoiceData.payment_id);
    html = html.replace(/{{service_name}}/g, invoiceData.service_name);
    html = html.replace(/{{amount}}/g, invoiceData.amount);
    html = html.replace(/{{tax}}/g, invoiceData.tax);
    html = html.replace(/{{total}}/g, invoiceData.total);
    html = html.replace(/{{discount}}/g, invoiceData.discount);
    html = html.replace(/{{coupon_code}}/g, invoiceData.coupon_code);
    html = html.replace(/{{coupon_discount}}/g, invoiceData.coupon_discount);
    html = html.replace(/{{processing_fee}}/g, invoiceData.processing_fee);

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

module.exports = {
  generateInvoice
};