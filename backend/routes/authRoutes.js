const express = require("express");
const passport = require("passport");
const userService = require("../services/userService");
const resend = require("../utils/resend");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { authResponse, signToken } = require("../utils/tokens");
const configurePassport = require("../config/passport");

const router = express.Router();
const { isGoogleOauthConfigured } = configurePassport;

const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include at least one letter and one number.";

function isPasswordPolicyValid(password) {
  const value = String(password || "");
  return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
}

function getFrontendOrigin(req) {
  const envOrigin = (
    process.env.FRONTEND_URL ||
    process.env.FRONTEND_OAUTH_CALLBACK_URL ||
    process.env.BACKEND_PUBLIC_URL ||
    ""
  )
    .split(",")[0]
    .trim()
    .replace(/\/auth\/callback.*/, "")
    .replace(/\/$/, "");

  if (envOrigin) return envOrigin;
  if (req && req.get("host")) {
    const proto = req.protocol || "http";
    return `${proto}://${req.get("host")}`.replace(/\/$/, "");
  }
  return "https://honeyuniversal.com";
}

function getDefaultFrontendCallback(req) {
  if (process.env.FRONTEND_OAUTH_CALLBACK_URL) {
    return process.env.FRONTEND_OAUTH_CALLBACK_URL;
  }
  const origin = getFrontendOrigin(req);
  return `${origin}/auth/callback`;
}

function resolveRedirectTarget(value, req) {
  const fallback = getDefaultFrontendCallback(req);
  if (!value) return fallback;

  const raw = String(value).trim();
  if (!raw) return fallback;

  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) {
    const base = getFrontendOrigin(req);
    return `${base}${raw}`;
  }

  return fallback;
}

router.post("/auth/signup", async (req, res, next) => {
  try {
    const { email, password, name, phone, source, role, termsAccepted, termsAcceptedAt } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    if (!isPasswordPolicyValid(password)) {
      return res.status(400).json({ success: false, message: PASSWORD_POLICY_MESSAGE });
    }

    const resolvedConsentAt = termsAcceptedAt || (termsAccepted ? new Date().toISOString() : null);

    const user = await userService.createUser({
      email,
      password,
      name,
      phone,
      role: role || "customer",
      source: source || "Signup",
      termsAcceptedAt: resolvedConsentAt,
    });

    return res.status(201).json({
      ...authResponse(user),
      message: "Account created successfully",
    });
  } catch (error) {
    if (error.code === "USER_EXISTS") {
      return res.status(409).json({ success: false, message: error.message, error: error.message });
    }
    return next(error);
  }
});

router.post("/auth/forgot-password", async (req, res) => {
  const genericResponse = {
    success: true,
    message: "If an account exists, we've sent a reset link.",
  };

  try {
    const normalizedEmail = String(req.body?.email || "").trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    const user = await userService.findByEmail(normalizedEmail);
    if (!user) {
      return res.json(genericResponse);
    }

    const token = await userService.createPasswordResetToken(user.id, 30);
    const frontendOrigin = getFrontendOrigin(req);
    const resetUrl = `${frontendOrigin}/reset-password?token=${encodeURIComponent(token)}`;

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        to: user.email,
        subject: "Reset your Honey Translation Services password",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
            <h2 style="color:#1a1f5c">Password Reset Request</h2>
            <p>We received a request to reset the password for your Honey Translation Services account.</p>
            <p style="margin:24px 0">
              <a href="${resetUrl}" style="background:#1a1f5c;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
                Reset Password
              </a>
            </p>
            <p style="font-size:13px;color:#4b5563">This link can be used once and expires in 30 minutes. If you did not request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    } else {
      console.warn("[auth/forgot-password] RESEND_API_KEY is not configured; reset email was not sent.");
    }

    return res.json(genericResponse);
  } catch (error) {
    console.error("[auth/forgot-password] Error handling reset request:", error);
    return res.json(genericResponse);
  }
});

router.post("/auth/reset-password", async (req, res, next) => {
  try {
    const { token, password } = req.body || {};
    if (!token) {
      return res.status(400).json({ success: false, message: "Reset token is required." });
    }
    if (!isPasswordPolicyValid(password)) {
      return res.status(400).json({ success: false, message: PASSWORD_POLICY_MESSAGE });
    }

    await userService.consumePasswordResetToken(token, password);
    return res.json({
      success: true,
      message: "Your password has been updated. You can now sign in.",
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return next(error);
  }
});

router.post("/auth/login", (req, res, next) => {
  passport.authenticate("local", { session: false }, async (error, user, info) => {
    try {
      if (error) return next(error);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: info?.message || "Invalid email or password",
        });
      }

      await userService.touchLastLogin(user.id);
      const refreshedUser = await userService.findById(user.id);
      return res.json(authResponse(refreshedUser || user));
    } catch (err) {
      return next(err);
    }
  })(req, res, next);
});

router.post("/auth/test", requireAuth, (req, res) => {
  res.json({
    success: true,
    user: userService.publicUser(req.user),
  });
});

router.get("/auth/me", requireAuth, (req, res) => {
  res.json({
    success: true,
    user: userService.publicUser(req.user),
  });
});

function normalizeIndianPhone(phone) {
  const raw = String(phone || "").trim();
  if (!raw || raw.toUpperCase() === "N/A") return { valid: true, value: "N/A" };
  const digits = raw.replace(/\D/g, "");
  const tenDigits = digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;
  if (!/^[6-9]\d{9}$/.test(tenDigits)) {
    return { valid: false, value: raw };
  }
  return { valid: true, value: `+91${tenDigits}` };
}

router.put("/auth/profile", requireAuth, async (req, res, next) => {
  try {
    const payload = { ...(req.body || {}) };
    if (typeof payload.name === "string" && !payload.name.trim()) {
      return res.status(400).json({ success: false, error: "Full name is required." });
    }
    if (payload.phone !== undefined) {
      const checkedPhone = normalizeIndianPhone(payload.phone);
      if (!checkedPhone.valid) {
        return res.status(400).json({
          success: false,
          error: "Please enter a valid 10-digit Indian mobile number (with +91).",
        });
      }
      payload.phone = checkedPhone.value;
    }

    const user = await userService.updateProfile(req.user.id, payload);
    return res.json({
      success: true,
      user: userService.publicUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/auth/change-password", requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }
    if (!isPasswordPolicyValid(newPassword)) {
      return res.status(400).json({
        success: false,
        message: PASSWORD_POLICY_MESSAGE,
      });
    }

    await userService.changePassword(req.user.id, currentPassword, newPassword);
    return res.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    return next(error);
  }
});

router.post("/auth/request-deletion", requireAuth, async (req, res, next) => {
  try {
    const record = await userService.requestAccountDeletion(req.user, req.body?.reason);
    const adminRecipient = process.env.ADMIN_EMAIL || process.env.SALES_EMAIL || "";
    if (!adminRecipient) {
      console.warn("ADMIN_EMAIL is not configured; skipping account deletion email notification.");
    }

    let emailSent = false;
    if (process.env.RESEND_API_KEY && adminRecipient) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "Honey Translations <onboarding@resend.dev>",
          to: [adminRecipient],
          subject: `Account Deletion Request – ${req.user.email}`,
          html: `
            <h2>Account Deletion Request</h2>
            <p>A customer has requested manual deletion of their account under DPDP guidelines.</p>
            <ul>
              <li><strong>Request ID:</strong> ${record.id}</li>
              <li><strong>User ID:</strong> ${req.user.id}</li>
              <li><strong>Name:</strong> ${req.user.name || "N/A"}</li>
              <li><strong>Email:</strong> ${req.user.email}</li>
              <li><strong>Reason:</strong> ${record.reason || "Not provided"}</li>
              <li><strong>Requested At:</strong> ${record.requested_at}</li>
            </ul>
            <p>No data has been deleted automatically. Please review and process manually.</p>
          `,
        });
        emailSent = true;
      } catch (emailErr) {
        console.warn("Account deletion email notification failed:", emailErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      request: record,
      emailSent,
      message:
        "Your account deletion request has been logged for review by our team. No data has been deleted automatically.",
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/auth/google", (req, res, next) => {
  if (!isGoogleOauthConfigured()) {
    return res.status(501).json({
      success: false,
      message: "Google OAuth is not configured yet. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and install passport-google-oauth20.",
    });
  }

  const redirectTo = resolveRedirectTarget(req.query.redirectTo, req);
  return passport.authenticate("google", {
    session: false,
    scope: ["profile", "email"],
    state: redirectTo,
    accessType: req.query.access_type || "offline",
    prompt: req.query.prompt || "select_account",
    includeGrantedScopes: true,
  })(req, res, next);
});

router.get("/auth/google/callback", (req, res, next) => {
  if (!isGoogleOauthConfigured()) {
    return res.status(501).json({
      success: false,
      message: "Google OAuth is not configured yet.",
    });
  }

  passport.authenticate("google", { session: false }, async (error, user, info) => {
    try {
      if (error) return next(error);
      if (!user) {
        const target = resolveRedirectTarget(req.query.state, req);
        const message = encodeURIComponent(info?.message || "Google sign-in failed");
        return res.redirect(`${target}?error=${message}`);
      }

      await userService.touchLastLogin(user.id);
      const refreshedUser = await userService.findById(user.id);
      const token = signToken(refreshedUser || user);
      const target = resolveRedirectTarget(req.query.state, req);
      const redirectUrl = new URL(target);
      redirectUrl.searchParams.set("code", token);
      redirectUrl.searchParams.set("provider", "google");

      return res.redirect(redirectUrl.toString());
    } catch (err) {
      return next(err);
    }
  })(req, res, next);
});

router.post("/auth/google-signup", async (req, res, next) => {
  try {
    const { email, name, phone, avatar, source, termsAcceptedAt } = req.body || {};
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    let user = await userService.findByEmail(email);
    if (!user) {
      user = await userService.createUser({
        email,
        password: `${Math.random().toString(36).slice(2)}${Date.now()}`,
        name: name || String(email).split("@")[0],
        phone: phone || "N/A",
        avatar,
        source: source || "Google OAuth",
        termsAcceptedAt: termsAcceptedAt || null,
      });
    } else if (termsAcceptedAt && !user.terms_accepted_at) {
      user = await userService.recordTermsConsent(user.id, termsAcceptedAt);
    }

    return res.json(authResponse(user));
  } catch (error) {
    return next(error);
  }
});

router.post("/auth/consent", requireAuth, async (req, res, next) => {
  try {
    const updatedUser = await userService.recordTermsConsent(
      req.user.id,
      req.body?.termsAcceptedAt || new Date().toISOString(),
    );
    return res.json({
      success: true,
      user: userService.publicUser(updatedUser),
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/demo-token", async (req, res, next) => {
  try {
    let user = await userService.findByEmail("admin@honeytranslations.com");
    if (!user) {
      user = await userService.createUser({
        email: "admin@honeytranslations.com",
        password: "admin123",
        name: "Admin User",
        phone: "+919999999999",
        role: "admin",
        source: "Demo Login",
      });
    }

    return res.json({
      success: true,
      token: signToken(user),
      type: "jwt",
      user: userService.publicUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/init-demo-users", async (req, res, next) => {
  try {
    const demoUsers = [
      {
        email: "admin@honeytranslations.com",
        password: "admin123",
        name: "Admin User",
        phone: "+919999999999",
        role: "admin",
      },
      {
        email: "customer@example.com",
        password: "customer123",
        name: "Demo Customer",
        phone: "+918888888888",
        role: "customer",
      },
    ];

    const results = [];

    for (const demoUser of demoUsers) {
      const existing = await userService.findByEmail(demoUser.email);
      if (existing) {
        results.push({ email: demoUser.email, status: "already_exists", role: existing.role });
      } else {
        const created = await userService.createUser({ ...demoUser, source: "Demo Account" });
        results.push({ email: created.email, status: "created", role: created.role });
      }
    }

    return res.json({
      success: true,
      message: "Demo users initialization complete",
      results,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/admin/users", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    res.json({ success: true, users: await userService.listUsers() });
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/users/:id/role", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const targetRole = req.body?.role || "customer";
    const isSelf =
      req.params.id === req.user.id ||
      (req.body?.email && String(req.body.email).trim().toLowerCase() === req.user.email);

    if (isSelf && targetRole !== "admin") {
      return res.status(400).json({
        success: false,
        message: "You cannot remove your own admin access. Ask another admin to change this role.",
      });
    }

    const user = await userService.setRole(req.params.id, targetRole, req.body?.email);
    res.json({ success: true, user: userService.publicUser(user) });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
});

module.exports = router;
