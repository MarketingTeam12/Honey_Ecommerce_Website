const passport = require("passport");
const { Strategy: LocalStrategy } = require("passport-local");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const userService = require("../services/userService");

let GoogleStrategy = null;
try {
  ({ Strategy: GoogleStrategy } = require("passport-google-oauth20"));
} catch (error) {
  GoogleStrategy = null;
}

function resolveGoogleCallbackUrl() {
  if (process.env.GOOGLE_CALLBACK_URL && !process.env.GOOGLE_CALLBACK_URL.includes("localhost")) {
    return process.env.GOOGLE_CALLBACK_URL;
  }
  const urls = (
    process.env.BACKEND_PUBLIC_URL ||
    process.env.FRONTEND_URL ||
    ""
  )
    .split(",")
    .map((u) => u.trim().replace(/\/$/, ""))
    .filter(Boolean);

  const prodBase = urls.find((u) => !u.includes("localhost") && !u.includes("127.0.0.1"));
  if (prodBase) {
    return `${prodBase}/api/auth/google/callback`;
  }
  if (process.env.GOOGLE_CALLBACK_URL) {
    return process.env.GOOGLE_CALLBACK_URL;
  }
  return "https://honeyuniversal.com/api/auth/google/callback";
}

function configurePassport() {
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
        session: false,
      },
      async (email, password, done) => {
        try {
          const user = await userService.findByEmail(email);

          if (!user || user.status !== "active") {
            return done(null, false, { message: "Invalid email or password" });
          }

          const passwordMatches = await userService.validatePassword(user, password);
          if (!passwordMatches) {
            return done(null, false, { message: "Invalid email or password" });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      },
    ),
  );

  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET,
      },
      async (payload, done) => {
        try {
          const user = await userService.findById(payload.sub);
          if (!user || user.status !== "active") {
            return done(null, false);
          }

          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      },
    ),
  );

  if (GoogleStrategy && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: resolveGoogleCallbackUrl(),
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(null, false, { message: "Google account email was not provided." });
            }

            const name =
              profile.displayName ||
              profile.name?.givenName ||
              email.split("@")[0];
            const avatar = profile.photos?.[0]?.value || null;

            let user = await userService.findByEmail(email);
            if (!user) {
              user = await userService.createUser({
                email,
                password: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                name,
                phone: "N/A",
                avatar,
                source: "Google OAuth",
              });
            } else {
              user = await userService.updateProfile(user.id, {
                name: user.name || name,
                avatar: user.avatar || avatar,
                source: user.source || "Google OAuth",
              });
            }

            return done(null, user);
          } catch (error) {
            return done(error);
          }
        },
      ),
    );
  }

  return passport;
}

function isGoogleOauthConfigured() {
  return Boolean(GoogleStrategy && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

module.exports = configurePassport;
module.exports.isGoogleOauthConfigured = isGoogleOauthConfigured;
