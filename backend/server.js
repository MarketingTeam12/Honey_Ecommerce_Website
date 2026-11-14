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

const configuredOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URLS,
]
  .filter(Boolean)
  .flatMap((value) => String(value).split(","))
  .map((value) => value.trim().replace(/\/$/, ""))
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set([
    ...configuredOrigins,
    "http://localhost:5173",
    "http://localhost:4173",
    "http://localhost:3000",
  ])
);

app.use(
  cors({
    origin(origin, callback) {
      // Allow Postman, curl, mobile apps, etc.
      if (!origin) {
        return callback(null, true);
      }

      // Allow localhost and configured FRONTEND_URL(s)
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow all ngrok URLs (for demo purposes)
      if (
        origin.includes("ngrok-free.app") ||
        origin.includes("ngrok-free.dev")
      ) {
        return callback(null, true);
      }

      const corsError = new Error(`CORS blocked for origin: ${origin}`);
      corsError.status = 403;
      return callback(corsError);
    },

    credentials: true,
  })
);

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
// HELMET SECURITY
// ======================================================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
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

app.use("/make-server-a67f0635", authRoutes, appDataRoutes);

app.use("/api", authRoutes, appDataRoutes);
app.use("/api", paymentRoutes);
app.use("/api", documentRoute);

app.use("/make-server-a67f0635/api/s3", s3Routes);
app.use("/api/s3", s3Routes);

// ======================================================
// HEALTH CHECK & TEST ROUTE
// ======================================================

app.get(["/health", "/api/health"], (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
    storage: "mysql",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.send("Backend Running");
});

// ======================================================
// RAZORPAY ORDER API
// ======================================================

app.post("/create-order", async (req, res) => {
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
// API 404 & GLOBAL ERROR HANDLER (always return JSON)
// ======================================================

app.use(["/make-server-a67f0635", "/api"], (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    error: `Not found: ${req.method} ${req.originalUrl}`,
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