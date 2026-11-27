const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const express = require("express");
const request = require("supertest");
const { createCancellationRouter } = require("../routes/cancellationRoutes");
const { createCancellationService } = require("../services/cancellationService");
const { createFakeStore, createFakeGateway } = require("./helpers/fakeStore");
const { verifyWebhookSignature } = require("../services/razorpayService");

const users = {
  customer: { id: "user_1", email: "cust@example.com", role: "customer" },
  other: { id: "user_2", email: "other@example.com", role: "customer" },
  admin: { id: "admin_1", email: "admin@example.com", role: "admin" },
  manager: { id: "mgr_1", email: "mgr@example.com", role: "sales_manager" },
  translator: { id: "tr_1", email: "tr@example.com", role: "translator" },
};

// Real middleware semantics, with the JWT lookup replaced by an x-test-user header.
const isOrderManager = async (user) => Boolean(user) && (user.role === "admin" || /manager/i.test(user.role || ""));
const auth = {
  requireAuth: (req, res, next) => {
    const user = users[req.get("x-test-user")];
    if (!user) return res.status(401).json({ success: false, error: "Unauthorized" });
    req.user = user;
    return next();
  },
  requireOrderManager: async (req, res, next) =>
    (await isOrderManager(req.user)) ? next() : res.status(403).json({ success: false, error: "Forbidden" }),
  isOrderManager,
};

function buildApp() {
  const store = createFakeStore({
    orders: [
      {
        id: "order_1",
        order_number: "HT100",
        user_id: "user_1",
        customer_email: "cust@example.com",
        status: "confirmed",
        payment_status: "paid",
        total_amount: 472,
        transaction_id: "pay_1",
      },
    ],
  });
  const service = createCancellationService({ store, gateway: createFakeGateway(), logger: { error: () => {} } });
  const app = express();
  app.use(express.json());
  app.use("/api", createCancellationRouter({ service, auth, resolveCreditNotePath: (p) => p }));
  return { app, store };
}

const body = { reason: "delay", comments: "Too slow", policyAccepted: true };

test("customer endpoints require login", async () => {
  const { app } = buildApp();
  await request(app).get("/api/orders/order_1/cancellation").expect(401);
  await request(app).post("/api/orders/order_1/cancellation-request").send(body).expect(401);
});

test("customer can view eligibility, request and withdraw on their own order", async () => {
  const { app } = buildApp();
  const view = await request(app).get("/api/orders/order_1/cancellation").set("x-test-user", "customer").expect(200);
  assert.equal(view.body.eligibility.eligible, true);
  const created = await request(app)
    .post("/api/orders/order_1/cancellation-request")
    .set("x-test-user", "customer")
    .send(body)
    .expect(201);
  assert.equal(created.body.request.status, "REQUESTED");
  await request(app).post("/api/orders/order_1/cancellation-request").set("x-test-user", "customer").send(body).expect(409);
  await request(app).post("/api/orders/order_1/cancellation-request/withdraw").set("x-test-user", "customer").expect(200);
});

test("policy checkbox must be ticked", async () => {
  const { app } = buildApp();
  const res = await request(app)
    .post("/api/orders/order_1/cancellation-request")
    .set("x-test-user", "customer")
    .send({ ...body, policyAccepted: false })
    .expect(400);
  assert.match(res.body.error, /policy/i);
});

test("a customer cannot touch another customer's order", async () => {
  const { app } = buildApp();
  await request(app).get("/api/orders/order_1/cancellation").set("x-test-user", "other").expect(403);
  await request(app).post("/api/orders/order_1/cancellation-request").set("x-test-user", "other").send(body).expect(403);
});

test("admin endpoints are forbidden to customers and non-manager staff", async () => {
  const { app } = buildApp();
  const created = await request(app).post("/api/orders/order_1/cancellation-request").set("x-test-user", "customer").send(body);
  const requestId = created.body.request.id;
  for (const who of ["customer", "translator"]) {
    await request(app).get("/api/admin/cancellation-requests").set("x-test-user", who).expect(403);
    await request(app)
      .post(`/api/admin/cancellation-requests/${requestId}/approve`)
      .set("x-test-user", who)
      .send({ refundType: "FULL" })
      .expect(403);
    await request(app)
      .post(`/api/admin/cancellation-requests/${requestId}/decline`)
      .set("x-test-user", who)
      .send({ reason: "x" })
      .expect(403);
    await request(app).post("/api/admin/refunds/rfnd_1/retry").set("x-test-user", who).expect(403);
    await request(app).post("/api/admin/refunds/rfnd_1/mark-manual").set("x-test-user", who).send({ note: "x" }).expect(403);
    await request(app).get("/api/admin/reports/cancellations").set("x-test-user", who).expect(403);
  }
});

test("managers and admins can list and decide requests", async () => {
  const { app, store } = buildApp();
  const created = await request(app).post("/api/orders/order_1/cancellation-request").set("x-test-user", "customer").send(body);
  const list = await request(app).get("/api/admin/cancellation-requests?status=REQUESTED").set("x-test-user", "manager").expect(200);
  assert.equal(list.body.pendingCount, 1);
  assert.equal(list.body.requests.length, 1);

  const approved = await request(app)
    .post(`/api/admin/cancellation-requests/${created.body.request.id}/approve`)
    .set("x-test-user", "admin")
    .send({ refundType: "FULL" })
    .expect(200);
  assert.equal(approved.body.refund.amount, 472);
  assert.equal(store._state().orders.order_1.status, "cancelled");

  // Second approval is rejected — no double refund.
  await request(app)
    .post(`/api/admin/cancellation-requests/${created.body.request.id}/approve`)
    .set("x-test-user", "manager")
    .send({ refundType: "FULL" })
    .expect(409);
});

// --------------------------------------------------- webhook signature checks

test("webhook signature: valid HMAC accepted, tampered body or wrong secret rejected", () => {
  process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_test";
  const raw = Buffer.from(JSON.stringify({ event: "refund.processed", payload: { refund: { entity: { id: "rfnd_1" } } } }));
  const signature = crypto.createHmac("sha256", "whsec_test").update(raw).digest("hex");
  assert.equal(verifyWebhookSignature(raw, signature), true);
  assert.equal(verifyWebhookSignature(Buffer.from(raw.toString().replace("rfnd_1", "rfnd_2")), signature), false);
  assert.equal(verifyWebhookSignature(raw, crypto.createHmac("sha256", "other").update(raw).digest("hex")), false);
  assert.equal(verifyWebhookSignature(raw, ""), false);
});

test("webhook signature check fails closed when the secret is not configured", () => {
  delete process.env.RAZORPAY_WEBHOOK_SECRET;
  assert.throws(() => verifyWebhookSignature(Buffer.from("{}"), "abc"), /RAZORPAY_WEBHOOK_SECRET/);
});
