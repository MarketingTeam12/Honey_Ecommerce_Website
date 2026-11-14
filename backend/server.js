const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const documentRoute = require("./routes/documentRoute");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const passport = require("passport");
const configurePassport = require("./config/passport");
const { initializeDatabase } = require("./config/database");
const paymentRoutes = require("./routes/paymentRoutes");
const testResendRoute = require("./routes/testResend");
const authRoutes = require("./routes/authRoutes");
const appDataRoutes = require("./routes/appDataRoutes");
const razorpayService = require("./services/razorpayService");
const s3Routes = require("./routes/s3Routes");

const app = express();
// Trust first reverse proxy (Cloudflare / Nginx) so req.ip & rate-limiting use real visitor IP
app.set("trust proxy", 1);

// ======================================================
// CORS CONFIGURATION
// ======================================================

const staticAllowedOrigins = new Set([
  "https://honeyuniversal.com",
  "https://www.honeyuniversal.com",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:4173",
]);

function getCorsOptions(req, callback) {
  const origin = req.get("Origin");

  // Allow requests without Origin header (same-origin browser navigation, curl, Postman, mobile apps)
  if (!origin) {
    return callback(null, { origin: true, credentials: true });
  }

  const normalized = origin.trim().replace(/\/$/, "");

  // Read FRONTEND_URL and FRONTEND_URLS environment variables (comma-separated)
  const envOrigins = [process.env.FRONTEND_URL, process.env.FRONTEND_URLS]
    .filter(Boolean)
    .flatMap((val) => String(val).split(","))
    .map((val) => val.trim().replace(/\/$/, ""))
    .filter(Boolean);

  const allowedOriginsSet = new Set([...staticAllowedOrigins, ...envOrigins]);
  if (allowedOriginsSet.has(normalized)) {
    return callback(null, { origin: true, credentials: true });
  }

  // Same-origin requests: Origin equal to the site's own host (e.g. req.headers.host)
  try {
    const originUrl = new URL(normalized);
    const hostHeader = req.get("host"); // Takes X-Forwarded-Host into account via trust proxy
    if (hostHeader && originUrl.host.toLowerCase() === hostHeader.toLowerCase()) {
      return callback(null, { origin: true, credentials: true });
    }
  } catch (err) {
    // Malformed Origin header
  }

  const corsError = new Error(`CORS blocked for origin: ${origin}`);
  corsError.status = 403;
  return callback(corsError);
}

app.use(cors(getCorsOptions));

// ======================================================
// BODY PARSER
// ======================================================

app.use(
  express.json({
    limit: "55mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "55mb" }));

// ======================================================
// HELMET SECURITY (HSTS, SAMEORIGIN, nosniff, CSP Report-Only)
// ======================================================

const CSP_REPORT_ONLY_DIRECTIVES = {
  defaultSrc: ["'self'"],
  scriptSrc: [
    "'self'",
    "'report-sample'",
    "https://checkout.razorpay.com",
    "https://api.razorpay.com",
    "https://cdn.razorpay.com",
    "https://salesiq.zohopublic.in",
    "https://salesiq.zohopublic.com",
    "https://static.zohocdn.com",
    "https://js.zohocdn.com",
    "https://cdn.trustindex.io",
    "https://static.cloudflareinsights.com",
    "https://accounts.google.com",
    "https://apis.google.com",
    "https://www.youtube.com",
    "https://www.youtube-nocookie.com",
  ],
  styleSrc: [
    "'self'",
    "'unsafe-inline'",
    "https://static.zohocdn.com",
    "https://css.zohocdn.com",
    "https://cdn.trustindex.io",
  ],
  imgSrc: [
    "'self'",
    "data:",
    "blob:",
    "https://flagcdn.com",
    "https://images.unsplash.com",
    "https://cdn.trustindex.io",
    "https://i.ytimg.com",
    "https://lh3.googleusercontent.com",
    "https://static.zohocdn.com",
    "https://salesiq.zohopublic.in",
    "https://checkout.razorpay.com",
    "https://cdn.razorpay.com",
    "https://*.amazonaws.com",
    "https://honeyuniversal.com",
    "https://api.honeyuniversal.com",
  ],
  fontSrc: [
    "'self'",
    "data:",
    "https://static.zohocdn.com",
    "https://cdn.trustindex.io",
    "https://fonts.gstatic.com",
  ],
  connectSrc: [
    "'self'",
    "https://api.honeyuniversal.com",
    "https://honeyuniversal.com",
    "https://*.supabase.co",
    "https://api.razorpay.com",
    "https://lumberjack.razorpay.com",
    "https://checkout.razorpay.com",
    "https://salesiq.zohopublic.in",
    "https://salesiq.zohopublic.com",
    "wss://*.zohopublic.in",
    "wss://*.zohopublic.com",
    "https://cdn.trustindex.io",
    "https://static.cloudflareinsights.com",
    "https://cloudflareinsights.com",
    "https://accounts.google.com",
    "https://www.googleapis.com",
    "https://*.amazonaws.com",
  ],
  frameSrc: [
    "'self'",
    "https://checkout.razorpay.com",
    "https://api.razorpay.com",
    "https://www.youtube.com",
    "https://www.youtube-nocookie.com",
    "https://accounts.google.com",
    "https://payments.zoho.in",
    "https://salesiq.zohopublic.in",
    "https://salesiq.zohopublic.com",
  ],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: [
    "'self'",
    "https://payments.zoho.in",
    "https://checkout.razorpay.com",
    "https://accounts.google.com",
  ],
  frameAncestors: ["'self'"],
  upgradeInsecureRequests: null,
};

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: CSP_REPORT_ONLY_DIRECTIVES,
      reportOnly: true,
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: false,
    },
    frameguard: { action: "sameorigin" },
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ======================================================
// RATE LIMITER
// ======================================================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts, please try again later.",
  },
});

app.use(
  [
    "/api/auth/login",
    "/api/auth/signup",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    "/make-server-a67f0635/auth/login",
    "/make-server-a67f0635/auth/signup",
    "/make-server-a67f0635/auth/forgot-password",
    "/make-server-a67f0635/auth/reset-password",
  ],
  authLimiter
);

const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many submissions. Please wait a few minutes before trying again.",
  },
});

app.use(
  [
    "/api/customer-queries",
    "/api/subscribe-email",
    "/make-server-a67f0635/customer-queries",
    "/make-server-a67f0635/subscribe-email",
  ],
  publicFormLimiter
);

// ======================================================
// PASSPORT
// ======================================================

configurePassport();
app.use(passport.initialize());

// ======================================================
// ROUTES
// ======================================================

app.use("/", testResendRoute);

app.use(
  "/api/invoices",
  express.static(path.join(__dirname, "invoices"))
);

app.use(["/make-server-a67f0635", "/api"], authRoutes, appDataRoutes);
app.use(["/make-server-a67f0635", "/api"], paymentRoutes);
app.use(["/make-server-a67f0635", "/api"], documentRoute);

app.use(
  [
    "/api/s3",
    "/api/api/s3",
    "/make-server-a67f0635/api/s3",
    "/api/make-server-a67f0635/api/s3",
  ],
  s3Routes
);

// ======================================================
// HEALTH CHECK
// ======================================================

app.get(["/health", "/api/health"], (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
    storage: "mysql",
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// RAZORPAY ORDER API
// ======================================================

app.post(["/create-order", "/api/create-order"], async (req, res) => {
  try {
    const order = await razorpayService.createOrder(
      req.body || {}
    );

    res.json(order);
  } catch (error) {
    console.error(
      "Razorpay order creation failed:",
      error
    );

    res.status(500).json({
      message: "Order creation failed",
      error: error?.message || "Unknown error",
    });
  }
});

// ======================================================
// API 404 HANDLER (Unknown /api routes ALWAYS return JSON 404)
// ======================================================

app.use(
  [
    "/api",
    "/make-server-a67f0635",
  ],
  (req, res) => {
    res.status(404).json({
      success: false,
      message: "API endpoint not found",
      error: `Not found: ${req.method} ${req.originalUrl}`,
    });
  }
);

// ======================================================
// SERVE BUILT FRONTEND (SPA)
// ======================================================

const frontendDistPath = path.resolve(__dirname, "../frontend/dist");

// 1. Long-term immutable caching for hashed /assets/*
app.use(
  "/assets",
  express.static(path.join(frontendDistPath, "assets"), {
    maxAge: "1y",
    immutable: true,
    index: false,
  })
);

// 2. Static root assets (favicon, og-image, robots.txt, sitemap.xml)
app.use(
  express.static(frontendDistPath, {
    index: false,
    setHeaders(res, filePath) {
      if (filePath.endsWith("index.html") || filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    },
  })
);

// 3. SPA Fallback: All other GET/HEAD requests serve index.html with no-cache
app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return next();
  }

  const indexPath = path.join(frontendDistPath, "index.html");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.sendFile(indexPath, (err) => {
    if (err) {
      next(err);
    }
  });
});

app.use((error, req, res, next) => {
  console.error("Backend error:", error);

  if (error?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "File exceeds the 50 MB maximum upload limit.",
      error: "File exceeds the 50 MB maximum upload limit.",
    });
  }

  if (error?.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: error.message || "Invalid file upload.",
      error: error.message || "Invalid file upload.",
    });
  }

  const statusCode = Number(error?.status || error?.statusCode) || 500;
  res.status(statusCode).json({
    success: false,
    message: error?.message || "Internal server error",
    error: error?.message || "Internal server error",
  });
});

// ======================================================
// START SERVER
// ======================================================

initializeDatabase()
  .then(() => {
    const port = Number(process.env.PORT || 3000);

    app.listen(port, () => {
      console.log(
        `Server running on port ${port}`
      );

      console.log(
        "Authentication : Passport.js"
      );

      console.log(
        "Database : MySQL"
      );

      console.log(
        "CORS : Enabled"
      );
    });
  })
  .catch((error) => {
    console.error(
      "Failed to initialize MySQL database:",
      error
    );

    process.exit(1);
  });