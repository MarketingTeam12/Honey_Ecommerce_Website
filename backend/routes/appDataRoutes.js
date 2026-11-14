const express = require("express");
const crypto = require("crypto");
const kv = require("../services/kvStore");
const resend = require("../utils/resend");
const userService = require("../services/userService");
const razorpayService = require("../services/razorpayService");
const whatsappService = require("../services/whatsappService");
const siteData = require("../services/siteDataService");
const { sendQueryNotifications } = require("../services/Querynotificationservice");
const { optionalAuth, requireAuth, requireAdmin } = require("../middleware/auth");
const { getBucketName, isS3Configured } = require("../config/s3");
const {
  deleteObjectByKey,
  extractKeyFromUrl,
  getRedirectUrl,
  uploadFileFromRequest,
} = require("../services/s3Service");
const upload = require("../middleware/upload");

const router = express.Router();
const STORAGE_COOKIE_NAME = "honey_client_id";
const STORAGE_KEY_PREFIX = "browser_storage";

const defaultCategories = [
  { id: "1", name: "Translation", slug: "translation", description: "Translation services" },
  { id: "2", name: "Attestation", slug: "attestation", description: "Document attestation services" },
  { id: "3", name: "Apostille", slug: "apostille", description: "Apostille services" },
  { id: "4", name: "Startup Packages", slug: "startup", description: "Startup package services" },
];

const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");
const id = (prefix) => `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
const keyFor = (prefix, entityId) => `${prefix}${entityId}`;
const recordList = async (prefix) => (await kv.getByPrefix(prefix)).filter(Boolean);

function parseMaybeJson(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function parseCookies(header = "") {
  return header.split(";").reduce((acc, chunk) => {
    const [rawKey, ...rawValueParts] = String(chunk || "").split("=");
    const key = rawKey ? rawKey.trim() : "";
    if (!key) return acc;
    const rawValue = rawValueParts.join("=");
    try {
      acc[key] = decodeURIComponent(rawValue.trim());
    } catch {
      acc[key] = rawValue.trim();
    }
    return acc;
  }, {});
}

function ensureStorageClientId(req, res) {
  const cookies = parseCookies(req.headers.cookie || "");
  let clientId = cookies[STORAGE_COOKIE_NAME];

  if (!clientId) {
    clientId = crypto.randomUUID();
    res.setHeader(
      "Set-Cookie",
      `${STORAGE_COOKIE_NAME}=${encodeURIComponent(clientId)}; Path=/; Max-Age=31536000; SameSite=Lax`,
    );
  }

  return clientId;
}

function storagePrefix(clientId, scope) {
  return `${STORAGE_KEY_PREFIX}:${clientId}:${scope}:`;
}

function extractStorageKey(fullKey, clientId, scope) {
  const prefix = storagePrefix(clientId, scope);
  return fullKey.startsWith(prefix) ? fullKey.slice(prefix.length) : fullKey;
}

async function upsertRecord(prefix, data, existingId) {
  const entityId = existingId || data.id || id(prefix.replace(/[_:]$/, "") || "item");
  const existing = existingId ? await kv.get(keyFor(prefix, entityId)) : null;
  const record = {
    ...(existing || {}),
    ...data,
    id: entityId,
    createdAt: existing?.createdAt || data.createdAt || now(),
    updatedAt: now(),
  };
  await kv.set(keyFor(prefix, entityId), record);
  return record;
}

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Honey Translations API Server",
    storage: "mysql",
    auth: "passport",
    timestamp: now(),
  });
});

router.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running", storage: "mysql" });
});

router.get("/storage/bootstrap", (req, res) => {
  const clientId = ensureStorageClientId(req, res);
  res.json({
    success: true,
    clientId,
    scopes: ["local", "session"],
  });
});

router.get("/storage/:scope", async (req, res, next) => {
  try {
    const clientId = ensureStorageClientId(req, res);
    const scope = String(req.params.scope || "").toLowerCase();
    if (!["local", "session"].includes(scope)) {
      return res.status(400).json({ success: false, message: "Invalid storage scope" });
    }

    const entries = await kv.listEntriesByPrefix(storagePrefix(clientId, scope));
    res.json({
      success: true,
      scope,
      entries: Object.fromEntries(
        entries.map((entry) => [extractStorageKey(entry.key, clientId, scope), entry.value]),
      ),
    });
  } catch (error) {
    next(error);
  }
});

router.put("/storage/:scope/:key", async (req, res, next) => {
  try {
    const clientId = ensureStorageClientId(req, res);
    const scope = String(req.params.scope || "").toLowerCase();
    if (!["local", "session"].includes(scope)) {
      return res.status(400).json({ success: false, message: "Invalid storage scope" });
    }

    const storageKey = `${storagePrefix(clientId, scope)}${decodeURIComponent(req.params.key)}`;
    const value = typeof req.body?.value === "string" ? req.body.value : String(req.body?.value ?? "");
    await kv.set(storageKey, value);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/storage/:scope", async (req, res, next) => {
  try {
    const clientId = ensureStorageClientId(req, res);
    const scope = String(req.params.scope || "").toLowerCase();
    if (!["local", "session"].includes(scope)) {
      return res.status(400).json({ success: false, message: "Invalid storage scope" });
    }

    const entries = req.body?.entries && typeof req.body.entries === "object" ? req.body.entries : {};
    const pairs = Object.entries(entries).map(([key, value]) => ({
      key: `${storagePrefix(clientId, scope)}${key}`,
      value: typeof value === "string" ? value : String(value ?? ""),
    }));

    if (pairs.length > 0) {
      await kv.mset(
        pairs.map((item) => item.key),
        pairs.map((item) => item.value),
      );
    }

    res.json({ success: true, stored: pairs.length });
  } catch (error) {
    next(error);
  }
});

router.delete("/storage/:scope/:key", async (req, res, next) => {
  try {
    const clientId = ensureStorageClientId(req, res);
    const scope = String(req.params.scope || "").toLowerCase();
    if (!["local", "session"].includes(scope)) {
      return res.status(400).json({ success: false, message: "Invalid storage scope" });
    }

    const storageKey = `${storagePrefix(clientId, scope)}${decodeURIComponent(req.params.key)}`;
    await kv.del(storageKey);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.delete("/storage/:scope", async (req, res, next) => {
  try {
    const clientId = ensureStorageClientId(req, res);
    const scope = String(req.params.scope || "").toLowerCase();
    if (!["local", "session"].includes(scope)) {
      return res.status(400).json({ success: false, message: "Invalid storage scope" });
    }

    await kv.deleteByPrefix(storagePrefix(clientId, scope));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get("/diagnostics", async (req, res, next) => {
  try {
    await kv.set("_diagnostics", { ok: true, timestamp: now() });
    await kv.del("_diagnostics");
    res.json({
      success: true,
      diagnostics: {
        timestamp: now(),
        database: { connection: "success", engine: "mysql" },
        auth: { provider: "passport" },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post(["/setup-database", "/setup/database"], async (req, res) => {
  res.json({ success: true, message: "MySQL database tables are initialized on server startup." });
});

router.get("/setup/status", async (req, res, next) => {
  try {
    await kv.set("_status_test", { timestamp: now() });
    await kv.del("_status_test");
    res.json({ tableExists: true, accessible: true, kvWorks: true, needsSetup: false });
  } catch (error) {
    next(error);
  }
});

router.get("/storage/check-buckets", (req, res) => {
  const configured = isS3Configured();
  res.json({
    success: true,
    allReady: configured,
    message: configured
      ? "AWS S3 file storage is configured."
      : "AWS S3 credentials are missing or incomplete.",
    buckets: configured
      ? [{ name: getBucketName(), exists: true, isPublic: false, status: "Ready" }]
      : [],
  });
});

router.post("/admin/initialize-storage", requireAuth, requireAdmin, (req, res) => {
  if (!isS3Configured()) {
    return res.status(500).json({
      success: false,
      message: "AWS S3 is not configured on the server.",
    });
  }

  res.json({ success: true, message: "AWS S3 upload storage is ready." });
});

router.post("/admin/upload-image", requireAuth, requireAdmin, upload.any(), async (req, res, next) => {
  try {
    const uploadedFile = Array.isArray(req.files) ? req.files[0] : req.file;
    if (!uploadedFile) {
      const imageUrl = req.body?.imageUrl || req.body?.image || "";
      return res.json({ success: true, imageUrl, url: imageUrl });
    }

    const uploaded = await uploadFileFromRequest(req, uploadedFile, "admin/images");
    res.json({
      success: true,
      key: uploaded.key,
      imageUrl: uploaded.url,
      url: uploaded.url,
      objectUrl: uploaded.url,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/upload-work-sample", requireAuth, requireAdmin, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      const fileUrl = req.body?.fileUrl || "";
      return res.json({ success: true, fileUrl, url: fileUrl });
    }

    const uploaded = await uploadFileFromRequest(req, req.file, "work-samples");
    res.json({
      success: true,
      key: uploaded.key,
      fileUrl: uploaded.url,
      url: uploaded.url,
      objectUrl: uploaded.url,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/customers", optionalAuth, async (req, res, next) => {
  try {
    const customers = await siteData.listCustomers();
    res.json({ customers, data: customers });
  } catch (error) {
    next(error);
  }
});

router.get("/customers/:id", optionalAuth, async (req, res, next) => {
  try {
    const customer = await siteData.getCustomer(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json({ customer });
  } catch (error) {
    next(error);
  }
});

router.patch("/customers/:id/status", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const status = String(req.body?.status || "").toLowerCase();
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'active' or 'inactive'" });
    }

    const existing = await siteData.getCustomer(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: "Customer not found" });

    const customer = await siteData.upsertCustomer({ ...existing, status }, req.params.id);
    res.json({ success: true, customer });
  } catch (error) {
    next(error);
  }
});

router.post("/customers/backfill-from-orders", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const orders = await siteData.listOrders();
    let created = 0;
    for (const order of orders) {
      const email = order.customer_email || order.customerEmail || order.email;
      if (!email) continue;
      const customerId = order.customer_id || crypto.createHash("sha1").update(email).digest("hex");
      const existing = await siteData.getCustomer(customerId);
      await siteData.upsertCustomer({
        ...existing,
        id: customerId,
        name: existing?.name || order.customer_name || order.customerName || "Customer",
        email,
        phone: existing?.phone || order.customer_phone || order.phone || "N/A",
        source: existing?.source || "Order Backfill",
        signup_date: existing?.signup_date || order.created_at || now(),
        status: "active",
        totalOrders: Number(existing?.totalOrders || 0) + 1,
        totalSpent: Number(existing?.totalSpent || 0) + Number(order.total_amount || order.totalAmount || 0),
      });
      created += existing ? 0 : 1;
    }
    res.json({ success: true, created, scanned: orders.length });
  } catch (error) {
    next(error);
  }
});

router.get(["/categories", "/categories-list"], async (req, res, next) => {
  try {
    const saved = await siteData.listCategories();
    const categories = saved.length ? saved : defaultCategories.map((cat) => ({ ...cat, createdAt: now() }));
    res.json({ categories });
  } catch (error) {
    next(error);
  }
});

router.get("/products", async (req, res, next) => {
  try {
    const products = await siteData.listProducts();
    res.json({ products });
  } catch (error) {
    next(error);
  }
});

router.get("/products/:id", async (req, res, next) => {
  try {
    const product = await siteData.getProduct(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ product });
  } catch (error) {
    next(error);
  }
});

router.get("/products/:id/images", async (req, res, next) => {
  try {
    const product = await siteData.getProduct(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    res.json({
      success: true,
      id: product.id,
      title: product.name,
      imageUrl: product.imageUrl || null,
      images: Array.isArray(product.images) ? product.images : [],
      updatedAt: product.updatedAt || null,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/products", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const product = await siteData.saveProduct(req.body || {});
    res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
});

router.put("/products/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const product = await siteData.saveProduct(req.body || {}, req.params.id);
    res.json({ product });
  } catch (error) {
    next(error);
  }
});

router.delete("/products/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await siteData.deleteProduct(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/initialize-default-products", async (req, res) => {
  res.json({ success: true, count: 0, message: "No bundled default products were migrated." });
});

router.post("/admin/initialize-products", requireAuth, requireAdmin, async (req, res) => {
  res.json({ success: true, count: 0 });
});

router.get("/admin/languages", async (req, res, next) => {
  try {
    res.json({
      sourceLanguages: await siteData.listLanguages("source"),
      targetLanguages: await siteData.listLanguages("target"),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/languages", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const language = await siteData.saveLanguage(req.body || {});
    res.status(201).json({ language });
  } catch (error) {
    next(error);
  }
});

router.delete("/admin/languages/:id/:type", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await siteData.deleteLanguage(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/document-types", async (req, res, next) => {
  try {
    res.json({ documentTypes: await siteData.listDocumentTypes() });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/document-types", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const documentType = await siteData.saveDocumentType(req.body || {});
    res.status(201).json({ documentType });
  } catch (error) {
    next(error);
  }
});

router.delete("/admin/document-types/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await siteData.deleteDocumentType(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get(["/admin/product-config/:productId", "/product-config/:productId"], async (req, res, next) => {
  try {
    const config = (await siteData.getProductConfig(req.params.productId))?.config || null;
    res.json({ config, productConfig: config });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/product-config/:productId", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const saved = await siteData.saveProductConfig(req.params.productId, req.body || {});
    const config = saved?.config || req.body || {};
    res.json({ config, productConfig: config });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/product-configs", async (req, res, next) => {
  try {
    const configs = await siteData.listProductConfigs();
    res.json({ configs, productConfigs: configs });
  } catch (error) {
    next(error);
  }
});

function makeUnsubscribeToken(email) {
  const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET || "honey-newsletter-unsub";
  return crypto.createHmac("sha256", secret).update(String(email).trim().toLowerCase()).digest("hex");
}

router.post("/subscribe-email", async (req, res, next) => {
  try {
    // Honeypot check: bots filling hidden fields get a silent 200
    if (req.body?.website || req.body?.company_url) {
      return res.status(200).json({ success: true });
    }

    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    const existingList = await siteData.listSubscribers();
    const existing = Array.isArray(existingList)
      ? existingList.find((item) => String(item.email || "").trim().toLowerCase() === email && item.status !== "unsubscribed")
      : null;

    if (existing) {
      return res.status(200).json({
        success: true,
        alreadySubscribed: true,
        message: "You are already subscribed to our newsletter.",
        subscriber: existing,
      });
    }

    const subscriber = await siteData.saveSubscriber(email, { subscribedAt: now(), status: "active" });

    if (process.env.RESEND_API_KEY) {
      const envApiBase = (process.env.BACKEND_PUBLIC_URL || process.env.FRONTEND_URL || "")
        .split(",")[0]
        .trim()
        .replace(/\/$/, "");
      const apiBase =
        envApiBase ||
        (req.get("host")
          ? `${req.protocol || "https"}://${req.get("host")}`
          : "https://honeyuniversal.com");
      const unsubToken = makeUnsubscribeToken(email);
      const unsubscribeUrl = `${apiBase}/api/unsubscribe-email?email=${encodeURIComponent(email)}&token=${unsubToken}`;
      resend.emails
        .send({
          from: process.env.RESEND_FROM_EMAIL || "Honey Translations <onboarding@resend.dev>",
          to: [email],
          subject: "Subscription Confirmed – Honey Translations",
          html: `
            <h2>Thank you for subscribing!</h2>
            <p>You are now subscribed to updates from Honey Translations.</p>
            <p style="font-size:12px;color:#666;">
              No longer want these emails? <a href="${unsubscribeUrl}">Unsubscribe here</a>.
            </p>
          `,
        })
        .catch((err) => console.warn("Newsletter confirmation email failed:", err.message));
    }

    res.status(201).json({
      success: true,
      alreadySubscribed: false,
      message: "Successfully subscribed to our newsletter!",
      subscriber,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/unsubscribe-email", async (req, res, next) => {
  try {
    const email = String(req.query?.email || "").trim().toLowerCase();
    const token = String(req.query?.token || "").trim();
    if (!email || !token) {
      return res.status(400).send("Invalid unsubscribe link.");
    }

    const expected = makeUnsubscribeToken(email);
    const matches =
      token.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
    if (!matches) {
      return res.status(403).send("Invalid or expired unsubscribe token.");
    }

    await siteData.saveSubscriber(email, { subscribedAt: now(), status: "unsubscribed" });
    return res
      .status(200)
      .send("<html><body style='font-family:sans-serif;padding:24px;'><h2>Unsubscribed</h2><p>You have been unsubscribed from Honey Translations newsletter emails.</p></body></html>");
  } catch (error) {
    next(error);
  }
});

router.get("/admin/subscriber-emails", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const subscribers = await siteData.listSubscribers();
    res.json({ subscribers, emails: subscribers });
  } catch (error) {
    next(error);
  }
});

router.delete("/admin/subscriber-emails/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await siteData.deleteSubscriber(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/customer-queries", async (req, res, next) => {
  try {
    if (req.body?.website || req.body?.company_url) {
      return res.status(200).json({ success: true });
    }

    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim();
    const message = String(req.body?.message || "").trim();
    if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid name, email address, and message (at least 10 characters).",
      });
    }

    const query = await siteData.saveQuery({ ...req.body, name, email, message, status: "new" });

    // Fire-and-forget: don't block the response on email delivery, and never
    // let a notification failure affect the already-saved query.
    sendQueryNotifications(query).catch((error) => {
      console.error("Unexpected error sending query notifications:", error.message);
    });

    // Create the admin bell notification so new queries show up in the admin panel.
    siteData
      .saveNotification({
        title: "New Customer Query",
        message: `${query.name || "A customer"} sent a query: "${(query.message || "").slice(0, 120)}"`,
        type: "customer_query",
        metadata: { type: "customer_query", queryId: query.id, customerEmail: query.email },
      })
      .catch((error) => {
        console.error("Failed to create admin notification for new query:", error.message);
      });

    // Create the customer's own bell notification confirming receipt (shown in their account bell).
    if (query.email) {
      siteData
        .saveNotification({
          customerEmail: query.email,
          title: "We've received your query",
          message: "Our team will get back to you shortly regarding your query.",
          type: "customer_query_received",
          metadata: { type: "customer_query_received", queryId: query.id },
        })
        .catch((error) => {
          console.error("Failed to create customer notification for new query:", error.message);
        });
    }

    res.status(201).json({ success: true, query });
  } catch (error) {
    next(error);
  }
});

router.get(["/admin/customer-queries", "/debug/customer-queries"], requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const queries = await siteData.listQueries();
    res.json({ queries, customerQueries: queries });
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/customer-queries/:id/status", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const query = await siteData.updateQueryStatus(req.params.id, req.body?.status || "new");
    res.json({ success: true, query });
  } catch (error) {
    next(error);
  }
});

router.delete("/admin/customer-queries/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await siteData.deleteQuery(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get(["/notifications", "/notifications/customer"], optionalAuth, async (req, res, next) => {
  try {
    let notifications = await siteData.listNotifications();
    if (req.user && req.path.endsWith("/customer")) {
      notifications = notifications.filter((item) => item.userId === req.user.id || item.customerEmail === req.user.email);
    }
    res.json({ notifications });
  } catch (error) {
    next(error);
  }
});

router.post("/notifications/create", requireAuth, async (req, res, next) => {
  try {
    const notification = await siteData.saveNotification({ ...req.body, read: false });
    res.status(201).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
});

router.patch(["/notifications/:id/read", "/notifications/mark-all-read"], optionalAuth, async (req, res, next) => {
  try {
    if (req.params.id) {
      const notification = await siteData.markNotificationRead(req.params.id);
      return res.json({ success: true, notification });
    }

    await siteData.markAllNotificationsRead();
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

router.delete("/notifications/delete-selected", requireAuth, async (req, res, next) => {
  try {
    const ids = req.body?.ids || [];
    await Promise.all(ids.map((notificationId) => siteData.deleteNotification(notificationId)));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.delete("/notifications/:id", requireAuth, async (req, res, next) => {
  try {
    await siteData.deleteNotification(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/dashboard-stats", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const [orders, customers, queries, notifications, stats] = await Promise.all([
      siteData.listOrders(),
      siteData.listCustomers(),
      siteData.listQueries(),
      siteData.listNotifications(),
      siteData.dashboardStats(),
    ]);
    res.json({
      stats: {
        totalOrders: stats.totalOrders || orders.length,
        totalCustomers: stats.totalCustomers || customers.length,
        totalQueries: stats.totalQueries || queries.length,
        unreadNotifications: notifications.filter((item) => !item.read).length,
        totalRevenue: stats.totalRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/api-keys", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    res.json({ apiKeys: await siteData.getApiKeys() });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/api-keys", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const apiKeys = await siteData.saveApiKeys(req.body || {});
    res.json({ success: true, apiKeys });
  } catch (error) {
    next(error);
  }
});

router.get("/work-samples", async (req, res, next) => {
  try {
    const samples = await siteData.listWorkSamples();
    res.json({ samples, workSamples: samples });
  } catch (error) {
    next(error);
  }
});

router.get("/work-samples/:id", async (req, res, next) => {
  try {
    const sample = await siteData.getWorkSample(req.params.id);
    if (!sample) return res.status(404).json({ error: "Work sample not found" });
    res.json({ sample, workSample: sample });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/work-samples", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const sample = await siteData.saveWorkSample(req.body || {});
    res.status(201).json({ sample, workSample: sample });
  } catch (error) {
    next(error);
  }
});

router.put("/admin/work-samples/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const sample = await siteData.saveWorkSample(req.body || {}, req.params.id);
    res.json({ sample, workSample: sample });
  } catch (error) {
    next(error);
  }
});

router.delete("/admin/work-samples/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await siteData.deleteWorkSample(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/init-work-samples-inline", requireAuth, requireAdmin, (req, res) => {
  res.json({ success: true, count: 0 });
});

router.get("/reviews/:productId", async (req, res, next) => {
  try {
    const reviews = (await siteData.listReviews(req.params.productId)).filter(
      (review) => review.status === "approved"
    );
    res.json({ reviews });
  } catch (error) {
    next(error);
  }
});

router.post("/reviews", optionalAuth, async (req, res, next) => {
  try {
    const review = await siteData.saveReview({
      ...req.body,
      userId: req.user?.id || req.body?.userId,
      customerName: req.body?.customerName || req.user?.name || req.user?.email || "Anonymous",
      status: req.body?.status || "pending",
      votes: req.body?.votes || 0,
    });

    // Create the admin bell notification so new reviews show up in the admin panel.
    siteData
      .saveNotification({
        title: "New Item Review",
        message: `${review.customerName || "A customer"} left a ${review.rating || "?"}★ review on ${review.productName || "a product"}`,
        type: "item_review",
        metadata: { type: "item_review", reviewId: review.id, productId: review.productId },
      })
      .catch((error) => {
        console.error("Failed to create admin notification for new review:", error.message);
      });

    res.status(201).json({ success: true, review });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/reviews", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const reviews = await siteData.listReviews();
    res.json({ reviews });
  } catch (error) {
    next(error);
  }
});

router.put("/admin/reviews/:reviewId", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const reviewId = req.params.reviewId;
    const review = await siteData.saveReview(req.body || {}, reviewId);
    res.json({ success: true, review });
  } catch (error) {
    next(error);
  }
});

router.put("/reviews/:reviewId", optionalAuth, async (req, res, next) => {
  try {
    const reviewId = req.params.reviewId;
    const review = await siteData.saveReview(req.body || {}, reviewId);
    res.json({ success: true, review });
  } catch (error) {
    next(error);
  }
});

router.post("/reviews/:reviewId/vote", optionalAuth, async (req, res, next) => {
  try {
    const review = await siteData.voteReview(
      req.params.reviewId,
      req.body?.voteType,
      req.user?.id || req.body?.userId,
    );
    if (!review) return res.status(404).json({ success: false, error: "Review not found" });
    res.json({ success: true, review });
  } catch (error) {
    next(error);
  }
});

router.delete("/admin/reviews/:reviewId", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await siteData.deleteReview(req.params.reviewId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get(["/orders", "/debug/orders"], optionalAuth, async (req, res, next) => {
  try {
    const orders = await siteData.listOrders();
    res.json({ orders, data: orders });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/orders", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const orders = await siteData.listOrders();
    res.json({ orders, data: orders });
  } catch (error) {
    next(error);
  }
});

router.get("/orders/my-orders", requireAuth, async (req, res, next) => {
  try {
    const orders = (await siteData.listOrders()).filter((order) =>
      order.user_id === req.user.id ||
      order.userId === req.user.id ||
      order.customer_email === req.user.email ||
      order.customerEmail === req.user.email
    );
    res.json({ orders });
  } catch (error) {
    next(error);
  }
});

router.post("/orders", optionalAuth, async (req, res, next) => {
  try {
    const orderNumber = req.body?.order_number || req.body?.orderNumber || `HT${Date.now()}`;
    // order insert + customer upsert now happen in one DB transaction
    // (see createOrderWithCustomer) so a mid-write failure can't leave an
    // order committed with stale/missing customer stats.
    const order = await siteData.createOrderWithCustomer({
      ...req.body,
      order_number: orderNumber,
      user_id: req.user?.id || req.body?.user_id,
      status: req.body?.status || "pending",
    });

    // Create the admin bell notification so new orders show up in the admin panel.
    siteData
      .saveNotification({
        title: "New Order Placed",
        message: `${order.customer_name || order.customerName || "A customer"} placed order #${order.order_number || orderNumber}`,
        type: "new_order",
        metadata: { type: "new_order", orderId: order.id, orderNumber: order.order_number || orderNumber },
      })
      .catch((error) => {
        console.error("Failed to create admin notification for new order:", error.message);
      });

    res.status(201).json({ success: true, order });
  } catch (error) {
    next(error);
  }
});

router.get("/orders/:id", optionalAuth, async (req, res, next) => {
  try {
    const order = await siteData.getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ order });
  } catch (error) {
    next(error);
  }
});

router.patch(["/orders/:id/status", "/orders/:id/notes"], requireAuth, async (req, res, next) => {
  try {
    const order = req.path.endsWith("/status")
      ? await siteData.updateOrderStatus(req.params.id, req.body?.status, {
          tracking_number: req.body?.tracking_number,
          shipping_carrier: req.body?.shipping_carrier,
        })
      : await siteData.updateOrderNotes(req.params.id, req.body?.notes || req.body?.admin_notes);
    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
});

router.patch("/orders/:id/payment-status", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const order = await siteData.updateOrderPaymentStatus(req.params.id, req.body?.payment_status);
    res.json({ success: true, order });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
});

router.patch("/orders/:orderId/tracking/stage", requireAuth, async (req, res, next) => {
  try {
    const tracking = await siteData.saveTracking(req.params.orderId, { ...req.body, orderId: req.params.orderId });
    res.json({ success: true, tracking });
  } catch (error) {
    next(error);
  }
});

router.patch("/orders/:orderId/tracking/translator", requireAuth, async (req, res, next) => {
  try {
    const tracking = await siteData.saveTracking(req.params.orderId, { translator: req.body?.translator, orderId: req.params.orderId });
    res.json({ success: true, tracking });
  } catch (error) {
    next(error);
  }
});

router.get("/orders/:orderId/tracking", optionalAuth, async (req, res, next) => {
  try {
    const tracking = await siteData.getTracking(req.params.orderId);
    res.json({ tracking });
  } catch (error) {
    next(error);
  }
});

router.post("/orders/track", async (req, res, next) => {
  try {
    const orderNumber = String(req.body?.orderNumber || req.body?.order_number || "").trim().toLowerCase();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const trackingNumber = String(req.body?.trackingNumber || req.body?.tracking_number || "").trim().toLowerCase();
    const orders = await siteData.listOrders();
    const order = orders.find((item) => {
      if (trackingNumber) {
        return String(item.tracking_number || "").toLowerCase() === trackingNumber;
      }
      return (
        (!orderNumber ||
          String(item.order_number || "").toLowerCase() === orderNumber ||
          String(item.orderNumber || "").toLowerCase() === orderNumber) &&
        (!email ||
          String(item.customer_email || "").toLowerCase() === email ||
          String(item.customerEmail || "").toLowerCase() === email ||
          String(item.email || "").toLowerCase() === email)
      );
    });
    if (!order) return res.status(404).json({ success: false, error: "Order not found" });
    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
});

router.patch("/orders/:id/completed-file", requireAuth, requireAdmin, upload.single("file"), async (req, res, next) => {
  try {
    const existingOrder = await siteData.getOrder(req.params.id);
    const fileUrl = req.file
      ? (await uploadFileFromRequest(req, req.file, "orders/completed")).url
      : req.body?.completed_file_url;

    if (req.file && existingOrder?.completed_file_url) {
      const previousKey = extractKeyFromUrl(existingOrder.completed_file_url);
      if (previousKey) {
        await deleteObjectByKey(previousKey);
      }
    }

    const order = await siteData.updateOrderCompletedFile(req.params.id, {
      completed_file_url: fileUrl,
      completed_file_name: req.file?.originalname || req.body?.completed_file_name,
    });
    res.json({ success: true, order, fileUrl });
  } catch (error) {
    next(error);
  }
});

router.get("/orders/:id/download-completed-file", requireAuth, async (req, res, next) => {
  try {
    const order = await siteData.getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const reqEmail = String(req.user?.email || "").trim().toLowerCase();
    const orderEmail = String(order.customer_email || order.customerEmail || "").trim().toLowerCase();
    const isOwner =
      (order.user_id && order.user_id === req.user.id) ||
      (order.userId && order.userId === req.user.id) ||
      (orderEmail && reqEmail && orderEmail === reqEmail) ||
      req.user.role === "admin";

    if (!isOwner) {
      return res.status(403).json({
        error: "Access denied. You do not have permission to download this file.",
      });
    }

    if (!order.completed_file_url) {
      return res.status(404).json({ error: "Completed file not found" });
    }

    let downloadUrl = order.completed_file_url;
    const key = extractKeyFromUrl(order.completed_file_url);
    if (key) {
      downloadUrl = await getRedirectUrl(key, 300);
    }

    if (req.query.redirect === "1") {
      return res.redirect(downloadUrl);
    }

    return res.json({
      success: true,
      downloadUrl,
      expiresInSeconds: 300,
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/orders/:id", requireAuth, async (req, res, next) => {
  try {
    await siteData.deleteOrder(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/orders/cleanup-guests", requireAuth, requireAdmin, (req, res) => {
  res.json({ success: true, deleted: 0 });
});

router.get("/coupons", async (req, res, next) => {
  try {
    const coupons = await siteData.listCoupons();
    res.json({ coupons });
  } catch (error) {
    next(error);
  }
});

router.post("/coupons/validate", async (req, res, next) => {
  try {
    const code = String(req.body?.code || "").toUpperCase();
    const orderValue = Number(req.body?.orderValue || req.body?.orderTotal || 0);
    const coupons = await siteData.listCoupons();
    const coupon = coupons.find((item) => String(item.code || "").toUpperCase() === code);

    if (!coupon) return res.status(400).json({ valid: false, error: "Invalid coupon code" });
    if (coupon.status === "inactive" || coupon.isActive === false) return res.status(400).json({ valid: false, error: "This coupon is not active" });
    if (coupon.minOrderValue && orderValue < Number(coupon.minOrderValue)) return res.status(400).json({ valid: false, error: `Minimum order value is ${coupon.minOrderValue}` });
    if (coupon.usageLimit && Number(coupon.usedCount || 0) >= Number(coupon.usageLimit)) return res.status(400).json({ valid: false, error: "Coupon usage limit reached" });

    let discountAmount = coupon.discountType === "percentage"
      ? (orderValue * Number(coupon.discountValue || 0)) / 100
      : Number(coupon.discountValue || 0);
    if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));

    res.json({ valid: true, coupon, discountAmount });
  } catch (error) {
    next(error);
  }
});

router.post("/coupons", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const coupon = await siteData.saveCoupon({
      ...req.body,
      code: String(req.body?.code || "").toUpperCase(),
      usedCount: req.body?.usedCount || 0,
      status: req.body?.status || "active",
    });
    res.status(201).json({ coupon });
  } catch (error) {
    next(error);
  }
});

router.put("/coupons/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const coupon = await siteData.saveCoupon({
      ...req.body,
      code: req.body?.code ? String(req.body.code).toUpperCase() : undefined,
    }, req.params.id);
    res.json({ coupon });
  } catch (error) {
    next(error);
  }
});

router.delete("/coupons/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await siteData.deleteCoupon(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/clear-all-data", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const prefixes = ["order_", "notification_", "customer:", "query_", "coupon_", "review_"];
    const deleted = {};
    await siteData.clearCoreData();
    for (const prefix of prefixes) {
      const records = await recordList(prefix);
      await kv.mdel(records.map((item) => keyFor(prefix, item.id)));
      deleted[prefix] = records.length;
    }
    res.json({ success: true, message: "Application data cleared successfully", deleted });
  } catch (error) {
    next(error);
  }
});

router.post("/payment/create-order", async (req, res, next) => {
  try {
    const {
      orderId,
      orderNumber,
      trackingNumber,
      userId,
      userEmail,
      userName,
      amount,
      paymentMethod,
      items,
      subtotal,
      discount,
      tax,
      shippingAddress,
      shippingDetails,
      notes,
      tip,
      shippingMethod,
      customerType,
      gstNumber,
    } = req.body || {};

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: "Valid payment amount is required" });
    }

    const existingOrder = orderId ? await siteData.getOrder(orderId) : null;
    if (existingOrder?.payment_status === "paid") {
      return res.status(409).json({
        success: false,
        message: "This order has already been paid.",
      });
    }

    const isPhysicalDelivery = shippingMethod === "physical";
    const resolvedAmountPaise = Math.round(numericAmount * 100);
    const existingRazorpayOrder = existingOrder?.metadata?.razorpayOrder;
    const canReuseRazorpayOrder =
      existingRazorpayOrder?.id &&
      Number(existingRazorpayOrder.amount) === resolvedAmountPaise &&
      String(existingRazorpayOrder.currency || "INR").toUpperCase() === "INR";

    const razorpayOrder = canReuseRazorpayOrder
      ? existingRazorpayOrder
      : await razorpayService.createOrder({
          amount: numericAmount,
          currency: "INR",
          receipt: existingOrder?.order_number || orderNumber,
        });

    // Persist/update the order (status: pending) with its Razorpay order ID for idempotent retries
    const savedOrder = await siteData.saveOrder(
      {
        order_number: existingOrder?.order_number || orderNumber,
        user_id: userId,
        customer_name: userName,
        customer_email: userEmail,
        items,
        subtotal,
        discount,
        tax,
        total_amount: numericAmount,
        currency: "INR",
        payment_method: paymentMethod || "razorpay",
        payment_status: "pending",
        tracking_number: isPhysicalDelivery ? trackingNumber : null,
        shipping_carrier: isPhysicalDelivery ? "BlueDart" : null,
        status: "pending",
        shipping_address: shippingAddress,
        metadata: {
          ...(existingOrder?.metadata || {}),
          trackingNumber: isPhysicalDelivery ? trackingNumber : null,
          shippingDetails,
          notes,
          tip,
          shippingMethod,
          customerType,
          gstNumber,
          razorpayOrder,
        },
      },
      orderId,
    );

    await siteData.saveTracking(savedOrder.id, { stage: "order_received" });

    res.json({
      success: true,
      orderId: savedOrder.id,
      amount: numericAmount,
      currency: "INR",
      razorpayOrder,
      order: savedOrder,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/payment/verify", async (req, res, next) => {
  try {
    const body = parseMaybeJson(req.body) || {};
    const {
      orderId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      customer,
    } = body;

    const isValidSignature = razorpayService.verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValidSignature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    const existingOrder = orderId ? await siteData.getOrder(orderId) : null;
    if (existingOrder?.payment_status === "paid" && existingOrder?.transaction_id === razorpay_payment_id) {
      return res.json({ success: true, alreadyVerified: true, order: existingOrder });
    }

    await siteData.savePayment({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      gateway: "razorpay",
      status: "verified",
      amount: Number(customer?.amount || existingOrder?.total_amount || 0),
      currency: "INR",
      method: "razorpay",
      gatewayResponse: {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      },
      metadata: {
        internalOrderId: orderId || existingOrder?.id || null,
        ...(customer || {}),
      },
    });

    const order = await siteData.saveOrder(
      {
        ...existingOrder,
        payment_status: "paid",
        status: "confirmed",
        transaction_id: razorpay_payment_id,
      },
      orderId,
    );

    await siteData
      .saveTracking(order.id, { stage: "payment_confirmed" })
      .catch((err) => console.error("Tracking stage update failed:", err));

    const recipientEmail = String(order.customer_email || customer?.email || "").trim();
    if (process.env.RESEND_API_KEY && recipientEmail) {
      resend.emails
        .send({
          from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
          to: recipientEmail,
          subject: `Order Confirmed – ${order.order_number || order.id}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
              <h2 style="color:#1a1f5c">Thank you for your order</h2>
              <p>Your payment has been verified.</p>
              <p><strong>Order Number:</strong> ${order.order_number || order.id}</p>
              <p><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
              <p><strong>Amount Paid:</strong> INR ${Number(order.total_amount || customer?.amount || 0).toFixed(2)}</p>
            </div>
          `,
        })
        .catch((err) => console.error("Order confirmation email failed:", err));
    }

    whatsappService
      .notifyCustomerOrderConfirmed({
        orderId: order.order_number || order.id,
        order_number: order.order_number,
        customerName: customer?.name || order.customer_name,
        customerPhone: customer?.phone,
        amount: customer?.amount || order.total_amount,
        service: customer?.sourceLanguage && customer?.targetLanguage
          ? `${customer.sourceLanguage} to ${customer.targetLanguage}`
          : undefined,
      })
      .catch((err) => console.error("WhatsApp customer notification failed:", err));

    whatsappService
      .notifyAdminNewOrder({
        orderId: order.order_number || order.id,
        order_number: order.order_number,
        customerName: customer?.name || order.customer_name,
        customerPhone: customer?.phone,
        amount: customer?.amount || order.total_amount,
      })
      .catch((err) => console.error("WhatsApp admin notification failed:", err));

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
});

router.post("/payment/webhook", async (req, res, next) => {
  try {
    const signature = req.get("X-Razorpay-Signature");
    const rawPayload = req.rawBody || JSON.stringify(req.body || {});
    const isValid = razorpayService.verifyWebhookSignature(rawPayload, signature);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid Razorpay webhook signature" });
    }

    const eventPayload = parseMaybeJson(req.body) || {};
    const eventName = String(eventPayload.event || "");
    const paymentEntity = eventPayload?.payload?.payment?.entity || {};
    const internalOrderId = paymentEntity?.notes?.orderId || null;

    if (eventName === "payment.captured" || eventName === "order.paid") {
      if (paymentEntity.id) {
        await siteData.savePayment({
          orderId: paymentEntity.order_id || internalOrderId,
          paymentId: paymentEntity.id,
          gateway: "razorpay",
          status: "verified",
          amount: Number(paymentEntity.amount || 0) / 100,
          currency: String(paymentEntity.currency || "INR").toUpperCase(),
          method: paymentEntity.method || "razorpay",
          gatewayResponse: eventPayload,
        });
      }

      if (internalOrderId) {
        const existingOrder = await siteData.getOrder(internalOrderId);
        if (existingOrder && existingOrder.payment_status !== "paid") {
          await siteData.saveOrder(
            {
              ...existingOrder,
              payment_status: "paid",
              status: "confirmed",
              transaction_id: paymentEntity.id || existingOrder.transaction_id,
            },
            internalOrderId,
          );
          await siteData
            .saveTracking(internalOrderId, { stage: "payment_confirmed" })
            .catch(() => {});
        }
      }
    } else if (eventName === "payment.failed" && paymentEntity.id) {
      await siteData.savePayment({
        orderId: paymentEntity.order_id || internalOrderId,
        paymentId: paymentEntity.id,
        gateway: "razorpay",
        status: "failed",
        amount: Number(paymentEntity.amount || 0) / 100,
        currency: String(paymentEntity.currency || "INR").toUpperCase(),
        method: paymentEntity.method || "razorpay",
        gatewayResponse: eventPayload,
      });
    }

    return res.json({ success: true, event: eventName });
  } catch (error) {
    return next(error);
  }
});

router.get("/payment/:paymentId", async (req, res, next) => {
  try {
    const payment = await siteData.getPayment(req.params.paymentId);
    res.json({ payment });
  } catch (error) {
    next(error);
  }
});

router.post("/payment/razorpay/create-order", async (req, res, next) => {
  try {
    const order = await razorpayService.createOrder(req.body || {});
    res.json(order);
  } catch (error) {
    next(error);
  }
});

router.post([
  "/payment/zoho/create-order",
  "/payment/zoho/create",
  "/payment/zoho/verify",
  "/payment/zoho/webhook",
  "/payment/zoho/refund",
  "/zoho-books/invoice-pdf",
], async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Zoho payment workflows are not configured in this MySQL backend yet.",
  });
});

router.get(["/payment/zoho/transactions", "/zoho/invoice/:invoiceId/download", "/payment/callback"], (req, res) => {
  res.status(501).json({ success: false, message: "Zoho payment workflow is not configured." });
});

// ---------------------------------------------------------------------------
// Cart & wishlist — backend-persisted per logged-in user (req.user.id).
// The frontend already gates addToCart/addToWishlist behind sign-in, so
// there's no guest/anonymous case to handle here.
// ---------------------------------------------------------------------------

router.get("/cart", requireAuth, async (req, res, next) => {
  try {
    const [items, coupon] = await Promise.all([
      siteData.listCartItems(req.user.id),
      siteData.getCartCoupon(req.user.id),
    ]);
    res.json({ items, coupon });
  } catch (error) {
    next(error);
  }
});

router.post("/cart/items", requireAuth, async (req, res, next) => {
  try {
    const items = await siteData.upsertCartItem(req.user.id, req.body);
    res.json({ success: true, items });
  } catch (error) {
    next(error);
  }
});

router.delete("/cart/items/:productId", requireAuth, async (req, res, next) => {
  try {
    const items = await siteData.removeCartItem(req.user.id, req.params.productId);
    res.json({ success: true, items });
  } catch (error) {
    next(error);
  }
});

router.delete("/cart", requireAuth, async (req, res, next) => {
  try {
    await siteData.clearCartItems(req.user.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.put("/cart/coupon", requireAuth, async (req, res, next) => {
  try {
    const { code, discountValue, discountType } = req.body || {};
    if (!code) {
      return res.status(400).json({ success: false, error: "Coupon code is required" });
    }
    const coupon = await siteData.setCartCoupon(req.user.id, { code, discountValue, discountType });
    res.json({ success: true, coupon });
  } catch (error) {
    next(error);
  }
});

router.delete("/cart/coupon", requireAuth, async (req, res, next) => {
  try {
    await siteData.removeCartCoupon(req.user.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get("/wishlist", requireAuth, async (req, res, next) => {
  try {
    const items = await siteData.listWishlistItems(req.user.id);
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.post("/wishlist/items", requireAuth, async (req, res, next) => {
  try {
    const items = await siteData.addWishlistItem(req.user.id, req.body);
    res.json({ success: true, items });
  } catch (error) {
    next(error);
  }
});

router.delete("/wishlist/items/:productId", requireAuth, async (req, res, next) => {
  try {
    const items = await siteData.removeWishlistItem(req.user.id, req.params.productId);
    res.json({ success: true, items });
  } catch (error) {
    next(error);
  }
});

module.exports = router;