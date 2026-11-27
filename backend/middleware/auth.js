const passport = require("passport");
const userService = require("../services/userService");

function requireAuth(req, res, next) {
  passport.authenticate("jwt", { session: false }, (error, user, info) => {
    if (error) return next(error);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: info?.message || "Unauthorized",
      });
    }

    req.user = user;
    return next();
  })(req, res, next);
}

function optionalAuth(req, res, next) {
  passport.authenticate("jwt", { session: false }, (error, user) => {
    if (error) return next(error);
    if (user) req.user = user;
    return next();
  })(req, res, next);
}

async function requireAdmin(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    if (!(await userService.isAdmin(req.user))) {
      return res.status(403).json({ success: false, error: "Forbidden - Admin access required" });
    }

    return next();
  } catch (error) {
    return next(error);
  }
}

/** Admins, plus any role whose name contains "manager" (e.g. sales_manager). */
async function isOrderManager(user) {
  if (!user) return false;
  if (await userService.isAdmin(user)) return true;
  return /manager/i.test(String(user.role || ""));
}

async function requireOrderManager(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    if (!(await isOrderManager(req.user))) {
      return res.status(403).json({ success: false, error: "Forbidden - admin or manager access required" });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  requireAuth,
  optionalAuth,
  requireAdmin,
  requireOrderManager,
  isOrderManager,
};
