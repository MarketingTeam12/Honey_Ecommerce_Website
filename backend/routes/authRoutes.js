const express = require("express");
const passport = require("passport");
const userService = require("../services/userService");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { authResponse, signToken } = require("../utils/tokens");
const configurePassport = require("../config/passport");

const router = express.Router();
const { isGoogleOauthConfigured } = configurePassport;

const DEFAULT_FRONTEND_CALLBACK =
  process.env.FRONTEND_OAUTH_CALLBACK_URL ||
  process.env.FRONTEND_URL ||
  "http://localhost:5173/auth/callback";

function resolveRedirectTarget(value) {
  if (!value) return DEFAULT_FRONTEND_CALLBACK;

  const raw = String(value).trim();
  if (!raw) return DEFAULT_FRONTEND_CALLBACK;

  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) {
    const base = DEFAULT_FRONTEND_CALLBACK.replace(/\/auth\/callback.*/, "");
    return `${base}${raw}`;
  }

  return DEFAULT_FRONTEND_CALLBACK;
}

router.post("/auth/signup", async (req, res, next) => {
  try {
    const { email, password, name, phone, source, role } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await userService.createUser({
      email,
      password,
      name,
      phone,
      role: role || "customer",
      source: source || "Signup",
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

router.put("/auth/profile", requireAuth, async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user.id, req.body || {});
    return res.json({
      success: true,
      user: userService.publicUser(user),
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

  const redirectTo = resolveRedirectTarget(req.query.redirectTo);
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
        const target = resolveRedirectTarget(req.query.state);
        const message = encodeURIComponent(info?.message || "Google sign-in failed");
        return res.redirect(`${target}?error=${message}`);
      }

      await userService.touchLastLogin(user.id);
      const refreshedUser = await userService.findById(user.id);
      const token = signToken(refreshedUser || user);
      const target = resolveRedirectTarget(req.query.state);
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
    const { email, name, phone, avatar, source } = req.body || {};
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
      });
    }

    return res.json(authResponse(user));
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
