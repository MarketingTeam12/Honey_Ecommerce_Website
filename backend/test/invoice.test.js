const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");
const { createInvoiceRouter } = require("../routes/invoiceRoutes");
const { buildInvoiceDataFromOrder, formatInvoiceDate } = require("../services/invoiceService");
const { isOrderOwner } = require("../services/cancellationService");

const users = {
  customer: { id: "user_1", email: "cust@example.com", role: "customer" },
  other: { id: "user_2", email: "other@example.com", role: "customer" },
  admin: { id: "admin_1", email: "admin@example.com", role: "admin" },
  manager: { id: "mgr_1", email: "mgr@example.com", role: "sales_manager" },
};
const isOrderManager = async (user) => Boolean(user) && (user.role === "admin" || /manager/i.test(user.role || ""));
const auth = {
  requireAuth: (req, res, next) => {
    const user = users[req.get("x-test-user")];
    if (!user) return res.status(401).json({ success: false, error: "Unauthorized" });
    req.user = user;
    return next();
  },
  isOrderManager,
};

function buildApp() {
  const rows = new Map([
    [
      "order_1",
      {
        id: "order_1",
        order_number: "HT100",
        user_id: "user_1",
        customer_email: "cust@example.com",
        total_amount: 472,
        invoice_number: null,
      },
    ],
  ]);
  const rendered = [];
  const orders = {
    async findOrder(value) {
      return [...rows.values()].find((row) => row.id === value || row.order_number === value) || null;
    },
    async assignInvoiceNumber(order) {
      if (!order.invoice_number) order.invoice_number = order.order_number;
      return order;
    },
  };
  const app = express();
  app.use(express.json());
  app.use(
    "/api",
    createInvoiceRouter({
      orders,
      renderInvoicePdf: async (order) => {
        rendered.push(order);
        return Buffer.from("%PDF-fake");
      },
      uploadInvoice: async (order) => `/api/s3/files/invoices%2F${order.invoice_number}.pdf`,
      auth,
      isOrderOwner,
    }),
  );
  return { app, rows, rendered };
}

test("invoice download requires login", async () => {
  const { app } = buildApp();
  await request(app).get("/api/orders/order_1/invoice").expect(401);
  await request(app).post("/api/generate-invoice").send({ order: { id: "order_1" } }).expect(401);
});

test("owner downloads a PDF and the invoice number is fixed to the order", async () => {
  const { app, rows } = buildApp();
  const res = await request(app).get("/api/orders/order_1/invoice").set("x-test-user", "customer").expect(200);
  assert.equal(res.headers["content-type"], "application/pdf");
  assert.match(res.headers["content-disposition"], /Invoice-HT100\.pdf/);
  assert.equal(rows.get("order_1").invoice_number, "HT100");
});

test("order can be looked up by order number", async () => {
  const { app } = buildApp();
  await request(app).get("/api/orders/HT100/invoice").set("x-test-user", "customer").expect(200);
});

test("other customers cannot get someone else's invoice", async () => {
  const { app } = buildApp();
  await request(app).get("/api/orders/order_1/invoice").set("x-test-user", "other").expect(403);
  await request(app).post("/api/generate-invoice").set("x-test-user", "other").send({ order: { id: "order_1" } }).expect(403);
});

test("admins and managers can download any invoice", async () => {
  const { app } = buildApp();
  await request(app).get("/api/orders/order_1/invoice").set("x-test-user", "admin").expect(200);
  await request(app).get("/api/orders/order_1/invoice").set("x-test-user", "manager").expect(200);
});

test("unknown order returns 404", async () => {
  const { app } = buildApp();
  await request(app).get("/api/orders/nope/invoice").set("x-test-user", "admin").expect(404);
});

test("generate-invoice ignores amounts sent by the browser", async () => {
  const { app, rendered } = buildApp();
  const res = await request(app)
    .post("/api/generate-invoice")
    .set("x-test-user", "customer")
    .send({ order: { id: "order_1", total_amount: 1, subtotal: 1 } })
    .expect(200);
  assert.equal(res.body.invoiceNumber, "HT100");
  assert.equal(rendered[0].total_amount, 472);
});

test("buildInvoiceDataFromOrder uses the stored address, status and amounts", () => {
  const data = buildInvoiceDataFromOrder({
    order_number: "HT100",
    invoice_number: "HT100",
    customer_name: "Account Name",
    customer_email: "cust@example.com",
    created_at: "2026-11-20T20:30:00Z",
    payment_status: "refunded",
    payment_method: "razorpay",
    transaction_id: "pay_1",
    subtotal: "400.00",
    tax: "72.00",
    total_amount: "472.00",
    shipping_address: JSON.stringify({
      name: "Priya",
      addressLine1: "12 Main Road",
      city: "Madurai",
      state: "Tamil Nadu",
      pincode: "625001",
      country: "India",
    }),
    metadata: JSON.stringify({ gstNumber: "33ABCDE1234F1Z5" }),
    items: JSON.stringify([{ name: "Birth certificate", totalPrice: 400, pageCount: 1 }]),
  });
  assert.equal(data.customer_name, "Priya");
  assert.deepEqual(data.customer_address_lines, ["12 Main Road", "Madurai, Tamil Nadu - 625001", "India"]);
  assert.equal(data.customer_gstin, "33ABCDE1234F1Z5");
  // A later refund doesn't rewrite the invoice – that's what the credit note is for.
  assert.equal(data.payment_status, "PAID");
  assert.equal(data.payment_method, "Razorpay");
  // 20:30 UTC is the next day in India.
  assert.equal(data.invoice_date, "21/11/2026");
  assert.equal(data.total, "472.00");
  assert.equal(data.items[0].description, "Birth certificate");
});

test("unpaid orders are not marked PAID", () => {
  const data = buildInvoiceDataFromOrder({ order_number: "HT1", payment_status: "pending", items: "[]" });
  assert.equal(data.payment_status, "UNPAID");
});

test("formatInvoiceDate is DD/MM/YYYY", () => {
  assert.equal(formatInvoiceDate("2026-03-05T06:00:00Z"), "05/03/2026");
});
