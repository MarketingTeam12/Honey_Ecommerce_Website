const jwt = require("jsonwebtoken");
const userService = require("../services/userService");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set. Set it in backend/.env before starting the server.");
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      issuer: "honey-translations-api",
    },
  );
}

function authResponse(user) {
  const token = signToken(user);
  const safeUser = userService.publicUser(user);

  return {
    success: true,
    token,
    accessToken: token,
    session: {
      access_token: token,
      token_type: "bearer",
      expires_in: 7 * 24 * 60 * 60,
      user: safeUser,
    },
    user: safeUser,
    userId: safeUser.id,
  };
}

module.exports = {
  signToken,
  authResponse,
};
