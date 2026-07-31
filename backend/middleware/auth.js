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

module.exports = {
  requireAuth,
  optionalAuth,
  requireAdmin,
};
