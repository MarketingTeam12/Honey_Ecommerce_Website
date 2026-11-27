/**
 * Invoice and credit note PDFs drawn with pdfkit (pure JavaScript – no Chrome
 * needed, so it works on shared hosting). DejaVu Sans is embedded because the
 * built-in PDF fonts have no ₹ glyph.
 */
const path = require("path");
const PDFDocument = require("pdfkit");

const FONT_DIR = path.join(__dirname, "..", "assets", "fonts");
const FONT = path.join(FONT_DIR, "DejaVuSans.ttf");
const FONT_BOLD = path.join(FONT_DIR, "DejaVuSans-Bold.ttf");

const COMPANY = {
  name: "HONEY UNIVERSAL DIGITAL PRIVATE LIMITED",
  contact: "Email: salesteam@honeytranslations.com | Phone: +91 72990 05577",
  email: "salesteam@honeytranslations.com",
};

const NAVY = "#242664";
const TEXT = "#333333";
const MUTED = "#6B7280";
const BORDER = "#E3E6EF";
const PANEL = "#F7F8FC";
const GREEN = "#15803D";

const PAGE_MARGIN = 40;
const BOTTOM_LIMIT = 780;

const rupees = (value) => `₹${Number(value || 0).toFixed(2)}`;

function createDoc(title) {
  const doc = new PDFDocument({ size: "A4", margin: PAGE_MARGIN, info: { Title: title, Author: COMPANY.name } });
  doc.registerFont("regular", FONT);
  doc.registerFont("bold", FONT_BOLD);
  return doc;
}

function toBuffer(doc, draw) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    try {
      draw(doc);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

const contentWidth = (doc) => doc.page.width - PAGE_MARGIN * 2;

function ensureSpace(doc, y, needed) {
  if (y + needed <= BOTTOM_LIMIT) return y;
  doc.addPage();
  return PAGE_MARGIN;
}

function drawCompanyHeader(doc, companyGstin) {
  const width = contentWidth(doc);
  let y = PAGE_MARGIN;
  doc.font("bold").fontSize(18).fillColor(NAVY).text(COMPANY.name, PAGE_MARGIN, y, { width, align: "center" });
  y = doc.y + 4;
  doc.font("regular").fontSize(9.5).fillColor(MUTED).text(COMPANY.contact, PAGE_MARGIN, y, { width, align: "center" });
  y = doc.y;
  if (companyGstin) {
    doc.text(`GSTIN: ${companyGstin}`, PAGE_MARGIN, y + 2, { width, align: "center" });
    y = doc.y;
  }
  y += 12;
  doc.moveTo(PAGE_MARGIN, y).lineTo(PAGE_MARGIN + width, y).lineWidth(2).strokeColor(NAVY).stroke();
  return y + 20;
}

/** Measures then draws a rounded panel with `draw(x, y, width)` content. */
function drawPanel(doc, x, y, width, height) {
  doc.roundedRect(x, y, width, height, 6).lineWidth(1).fillAndStroke(PANEL, BORDER);
}

function drawLabelValueRows(doc, rows, x, y, width) {
  let cursor = y;
  for (const [label, value] of rows) {
    doc.font("bold").fontSize(9.5).fillColor(TEXT).text(label, x, cursor, { width: width * 0.48 });
    const labelBottom = doc.y;
    doc.font("regular").fontSize(9.5).fillColor(TEXT).text(String(value ?? ""), x + width * 0.48, cursor, {
      width: width * 0.52,
      align: "right",
    });
    cursor = Math.max(labelBottom, doc.y) + 5;
  }
  return cursor;
}

function drawFooter(doc, y, lines) {
  const width = contentWidth(doc);
  y = ensureSpace(doc, y + 10, 70);
  doc.moveTo(PAGE_MARGIN, y).lineTo(PAGE_MARGIN + width, y).lineWidth(1).strokeColor(BORDER).stroke();
  y += 14;
  doc.font("bold").fontSize(11).fillColor(TEXT).text(lines[0], PAGE_MARGIN, y, { width, align: "center" });
  doc.font("regular").fontSize(9).fillColor(MUTED);
  for (const line of lines.slice(1)) {
    doc.text(line, PAGE_MARGIN, doc.y + 4, { width, align: "center" });
  }
}

// ---------------------------------------------------------------- invoice

const INVOICE_COLUMNS = [
  { key: "description", label: "ITEM DESCRIPTION", width: 225, align: "left" },
  { key: "quantity", label: "QTY", width: 50, align: "center" },
  { key: "pages", label: "PAGES", width: 60, align: "center" },
  { key: "rate", label: "RATE", width: 85, align: "right" },
  { key: "amount", label: "AMOUNT", width: 95, align: "right" },
];

function drawTableHeader(doc, y) {
  const width = contentWidth(doc);
  doc.rect(PAGE_MARGIN, y, width, 26).fill(NAVY);
  let x = PAGE_MARGIN;
  doc.font("bold").fontSize(9).fillColor("#FFFFFF");
  for (const column of INVOICE_COLUMNS) {
    doc.text(column.label, x + 8, y + 8, { width: column.width - 16, align: column.align });
    x += column.width;
  }
  return y + 26;
}

/**
 * data: { customer_name, customer_email, customer_address_lines[], customer_gstin,
 *         company_gstin, invoice_number, invoice_date, payment_method, payment_status,
 *         payment_id, items[{description, quantity, pages, rate, amount, details[]}],
 *         subtotal, tax, adjustments[{label, amount, deduct}], total }
 */
function renderInvoicePdf(data) {
  const doc = createDoc(`Invoice ${data.invoice_number}`);
  return toBuffer(doc, () => {
    const width = contentWidth(doc);
    let y = drawCompanyHeader(doc, data.company_gstin);

    // Bill-to and invoice-details panels, sized to the taller of the two.
    const gap = 24;
    const panelWidth = (width - gap) / 2;
    const leftX = PAGE_MARGIN;
    const rightX = PAGE_MARGIN + panelWidth + gap;
    const pad = 14;
    const inner = panelWidth - pad * 2;

    const billLines = [
      ...(data.customer_address_lines || []),
      ...(data.customer_gstin ? [`GSTIN: ${data.customer_gstin}`] : []),
    ];
    const detailRows = [
      ["Invoice #:", data.invoice_number],
      ["Date:", data.invoice_date],
      ["Payment Method:", data.payment_method],
      ["Payment Status:", data.payment_status],
      ["Payment ID:", data.payment_id],
    ];

    const measureBill = () => {
      doc.font("bold").fontSize(11);
      let h = doc.heightOfString("BILL TO:", { width: inner }) + 8;
      doc.font("bold").fontSize(10);
      h += doc.heightOfString(data.customer_name || " ", { width: inner }) + 4;
      doc.font("regular").fontSize(9.5);
      for (const line of [data.customer_email, ...billLines].filter(Boolean)) {
        h += doc.heightOfString(line, { width: inner }) + 4;
      }
      return h;
    };
    const measureDetails = () => {
      doc.font("bold").fontSize(16);
      let h = doc.heightOfString("INVOICE") + 10;
      doc.fontSize(9.5);
      for (const [, value] of detailRows) {
        h += Math.max(doc.heightOfString(String(value ?? ""), { width: inner * 0.52 }), 12) + 5;
      }
      return h;
    };
    const panelHeight = Math.max(measureBill(), measureDetails()) + pad * 2;

    drawPanel(doc, leftX, y, panelWidth, panelHeight);
    drawPanel(doc, rightX, y, panelWidth, panelHeight);

    let ly = y + pad;
    doc.font("bold").fontSize(11).fillColor(NAVY).text("BILL TO:", leftX + pad, ly, { width: inner });
    ly = doc.y + 8;
    doc.font("bold").fontSize(10).fillColor(TEXT).text(data.customer_name || "Customer", leftX + pad, ly, { width: inner });
    ly = doc.y + 4;
    doc.font("regular").fontSize(9.5).fillColor(TEXT);
    for (const line of [data.customer_email, ...billLines].filter(Boolean)) {
      doc.text(line, leftX + pad, ly, { width: inner });
      ly = doc.y + 4;
    }

    let ry = y + pad;
    doc.font("bold").fontSize(16).fillColor(NAVY).text("INVOICE", rightX + pad, ry, { width: inner, align: "right" });
    ry = doc.y + 10;
    drawLabelValueRows(doc, detailRows, rightX + pad, ry, inner);

    y += panelHeight + 26;

    // Items table
    doc.font("bold").fontSize(12).fillColor(NAVY).text("ORDER DETAILS:", PAGE_MARGIN, y);
    y = drawTableHeader(doc, doc.y + 8);

    for (const item of data.items || []) {
      const cells = {
        description: item.description,
        quantity: String(item.quantity ?? ""),
        pages: String(item.pages ?? ""),
        rate: rupees(item.rate),
        amount: rupees(item.amount),
      };
      doc.font("regular").fontSize(9.5);
      const rowHeight = Math.max(doc.heightOfString(cells.description || " ", { width: INVOICE_COLUMNS[0].width - 16 }), 12) + 16;
      const detailText = (item.details || []).join(" • ");
      doc.fontSize(8.5);
      const detailHeight = detailText ? doc.heightOfString(detailText, { width: width - 16 }) + 12 : 0;

      if (y + rowHeight + detailHeight > BOTTOM_LIMIT) {
        doc.addPage();
        y = drawTableHeader(doc, PAGE_MARGIN);
      }

      let x = PAGE_MARGIN;
      doc.font("regular").fontSize(9.5).fillColor(TEXT);
      for (const column of INVOICE_COLUMNS) {
        doc.text(cells[column.key], x + 8, y + 8, { width: column.width - 16, align: column.align });
        x += column.width;
      }
      y += rowHeight;
      doc.moveTo(PAGE_MARGIN, y).lineTo(PAGE_MARGIN + width, y).lineWidth(0.75).strokeColor("#D1D5DB").stroke();

      if (detailText) {
        doc.font("regular").fontSize(8.5).fillColor(MUTED).text(detailText, PAGE_MARGIN + 8, y + 6, { width: width - 16 });
        y += detailHeight;
        doc.moveTo(PAGE_MARGIN, y).lineTo(PAGE_MARGIN + width, y).lineWidth(0.75).strokeColor("#D1D5DB").stroke();
      }
    }

    // Totals
    const rows = [
      { label: "Subtotal:", value: rupees(data.subtotal) },
      { label: "GST (18%)", value: rupees(data.tax) },
      ...(data.adjustments || []).map((adj) => ({
        label: adj.label,
        value: `${adj.deduct ? "- " : ""}${rupees(adj.amount)}`,
        color: adj.deduct ? GREEN : TEXT,
        bold: Boolean(adj.deduct),
      })),
    ];
    const totalsWidth = 240;
    const totalsX = PAGE_MARGIN + width - totalsWidth;
    y = ensureSpace(doc, y + 20, rows.length * 20 + 50);
    for (const row of rows) {
      doc.font("regular").fontSize(10).fillColor(TEXT).text(row.label, totalsX, y, { width: totalsWidth * 0.65 });
      doc.font(row.bold ? "bold" : "regular").fillColor(row.color || TEXT).text(row.value, totalsX + totalsWidth * 0.5, y, {
        width: totalsWidth * 0.5,
        align: "right",
      });
      y += 20;
    }
    y += 2;
    doc.moveTo(totalsX, y).lineTo(totalsX + totalsWidth, y).lineWidth(2).strokeColor(NAVY).stroke();
    y += 10;
    doc.font("bold").fontSize(14).fillColor(NAVY).text("GRAND TOTAL", totalsX, y, { width: totalsWidth * 0.6 });
    doc.text(rupees(data.total), totalsX + totalsWidth * 0.4, y, { width: totalsWidth * 0.6, align: "right" });
    y += 40;

    drawFooter(doc, y, [
      "Thank you for your business!",
      `For any queries, please contact us at ${COMPANY.email}`,
      "This is a computer-generated invoice and does not require a signature.",
    ]);
  });
}

// ------------------------------------------------------------ credit note

/**
 * data: { credit_note_number, credit_note_date, invoice_number, order_number, order_date,
 *         customer_name, customer_email, customer_gstin, company_gstin, refund_description,
 *         taxable_amount, gst_amount, total_amount, order_total, refund_reference }
 */
function renderCreditNotePdf(data) {
  const doc = createDoc(`Credit Note ${data.credit_note_number}`);
  return toBuffer(doc, () => {
    const width = contentWidth(doc);
    let y = drawCompanyHeader(doc, data.company_gstin);

    doc.font("bold").fontSize(16).fillColor(NAVY).text("CREDIT NOTE", PAGE_MARGIN, y, { width, align: "center" });
    y = doc.y + 18;

    const colWidth = (width - 24) / 2;
    const left = [
      ["Credit note no:", data.credit_note_number],
      ["Date:", data.credit_note_date],
      ["Against invoice:", data.invoice_number],
      ["Order:", data.order_number],
      ["Original order date:", data.order_date],
    ];
    const leftEnd = drawLabelValueRows(doc, left, PAGE_MARGIN, y, colWidth);

    const rightX = PAGE_MARGIN + colWidth + 24;
    doc.font("bold").fontSize(9.5).fillColor(MUTED).text("Issued to:", rightX, y, { width: colWidth });
    doc.font("bold").fontSize(10).fillColor(TEXT).text(data.customer_name || "Customer", rightX, doc.y + 3, { width: colWidth });
    doc.font("regular").fontSize(9.5);
    if (data.customer_email) doc.text(data.customer_email, rightX, doc.y + 3, { width: colWidth });
    if (data.customer_gstin) doc.text(`GSTIN: ${data.customer_gstin}`, rightX, doc.y + 3, { width: colWidth });
    y = Math.max(leftEnd, doc.y) + 20;

    // Table
    const amountWidth = 140;
    doc.rect(PAGE_MARGIN, y, width, 26).fill(NAVY);
    doc.font("bold").fontSize(9.5).fillColor("#FFFFFF");
    doc.text("DESCRIPTION", PAGE_MARGIN + 10, y + 8, { width: width - amountWidth - 20 });
    doc.text("AMOUNT", PAGE_MARGIN + width - amountWidth, y + 8, { width: amountWidth - 10, align: "right" });
    y += 26;

    const tableRows = [
      [data.refund_description, data.taxable_amount, false],
      ["GST @ 18%", data.gst_amount, false],
      ["Total credited (incl. GST)", data.total_amount, true],
    ];
    for (const [label, amount, bold] of tableRows) {
      doc.font(bold ? "bold" : "regular").fontSize(10);
      const h = Math.max(doc.heightOfString(label, { width: width - amountWidth - 20 }), 12) + 16;
      if (bold) doc.rect(PAGE_MARGIN, y, width, h).fill(PANEL);
      doc.fillColor(bold ? NAVY : TEXT).font(bold ? "bold" : "regular").fontSize(10);
      doc.text(label, PAGE_MARGIN + 10, y + 8, { width: width - amountWidth - 20 });
      doc.text(rupees(amount), PAGE_MARGIN + width - amountWidth, y + 8, { width: amountWidth - 10, align: "right" });
      y += h;
      doc.moveTo(PAGE_MARGIN, y).lineTo(PAGE_MARGIN + width, y).lineWidth(0.75).strokeColor("#D1D5DB").stroke();
    }

    y += 18;
    y = drawLabelValueRows(
      doc,
      [
        ["Original order value (incl. GST):", rupees(data.order_total)],
        ["Refund reference:", data.refund_reference],
      ],
      PAGE_MARGIN,
      y,
      width,
    );
    doc.font("regular").fontSize(9).fillColor(MUTED).text(
      "This credit note reduces the value of the original invoice above by the amount credited.",
      PAGE_MARGIN,
      y + 6,
      { width },
    );

    drawFooter(doc, doc.y + 30, [
      "Thank you for your business!",
      `For any queries, please contact us at ${COMPANY.email}`,
      "This is a computer-generated credit note and does not require a signature.",
    ]);
  });
}

module.exports = { renderInvoicePdf, renderCreditNotePdf };
