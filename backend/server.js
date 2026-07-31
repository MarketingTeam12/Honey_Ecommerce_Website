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

// ======================================================
// CORS CONFIGURATION
// ======================================================

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow Postman, curl, mobile apps, etc.
      if (!origin) {
        return callback(null, true);
      }

      // Allow localhost and FRONTEND_URL
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

      return callback(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },

    credentials: true,
  })
);

// ======================================================
// BODY PARSER
// ======================================================

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

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
    "/make-server-a67f0635/auth/login",
    "/make-server-a67f0635/auth/signup",
  ],
  authLimiter
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
// TEST ROUTE
// ======================================================

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
// GLOBAL ERROR HANDLER
// ======================================================

app.use((error, req, res, next) => {
  console.error("Backend error:", error);

  res.status(error.status || 500).json({
    success: false,
    message:
      error.message || "Internal server error",
    error:
      error.message || "Internal server error",
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