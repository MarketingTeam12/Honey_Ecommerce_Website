const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { pool } = require("../config/database");
const kv = require("./kvStore");
const siteData = require("./siteDataService");

const ADMIN_EMAILS = new Set(["admin@honeytranslations.com", "swetha@gmail.com", "YOUR_LOGIN_EMAIL_HERE"]);

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function toMysqlDatetime(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function publicUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    source: user.source,
    status: user.status,
    terms_accepted_at: user.terms_accepted_at || null,
    created_at: user.created_at,
    updated_at: user.updated_at,
    last_login_at: user.last_login_at,
  };
}

async function findByEmail(email) {
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE email = :email LIMIT 1",
    { email: normalizeEmail(email) },
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = :id LIMIT 1", { id });
  return rows[0] || null;
}

async function createUser({ email, password, name, phone = "N/A", role = "customer", source = "Direct", avatar = null, termsAcceptedAt = null }) {
  const normalizedEmail = normalizeEmail(email);
  const existing = await findByEmail(normalizedEmail);

  if (existing) {
    const error = new Error("An account with this email already exists. Please sign in.");
    error.code = "USER_EXISTS";
    throw error;
  }

  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 12);
  const resolvedRole = ADMIN_EMAILS.has(normalizedEmail) ? "admin" : role;
  const consentDate = toMysqlDatetime(termsAcceptedAt);

  await pool.query(
    `
      INSERT INTO users (id, email, password_hash, name, phone, role, avatar, source, status, terms_accepted_at)
      VALUES (:id, :email, :passwordHash, :name, :phone, :role, :avatar, :source, 'active', :termsAcceptedAt)
    `,
    {
      id,
      email: normalizedEmail,
      passwordHash,
      name: name || normalizedEmail.split("@")[0],
      phone,
      role: resolvedRole,
      avatar,
      source,
      termsAcceptedAt: consentDate,
    },
  );

  const user = await findById(id);
  await syncUserRecords(user);
  return user;
}

async function recordTermsConsent(userId, termsAcceptedAt) {
  const consentDate = toMysqlDatetime(termsAcceptedAt) || toMysqlDatetime(new Date());
  await pool.query(
    "UPDATE users SET terms_accepted_at = COALESCE(terms_accepted_at, :consentDate) WHERE id = :userId",
    { consentDate, userId },
  );
  return findById(userId);
}

async function createPasswordResetToken(userId, ttlMinutes = 30) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const id = crypto.randomUUID();

  // Invalidate any older unused reset tokens for this user before issuing a new one.
  await pool.query(
    "UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = :userId AND used_at IS NULL",
    { userId },
  );

  await pool.query(
    `
      INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
      VALUES (:id, :userId, :tokenHash, DATE_ADD(NOW(), INTERVAL :ttlMinutes MINUTE))
    `,
    {
      id,
      userId,
      tokenHash,
      ttlMinutes: Number(ttlMinutes) || 30,
    },
  );

  return rawToken;
}

async function consumePasswordResetToken(rawToken, newPassword) {
  const tokenHash = crypto.createHash("sha256").update(String(rawToken || "")).digest("hex");
  const [rows] = await pool.query(
    `
      SELECT id, user_id
      FROM password_reset_tokens
      WHERE token_hash = :tokenHash AND used_at IS NULL AND expires_at > NOW()
      LIMIT 1
    `,
    { tokenHash },
  );

  const tokenRow = rows[0];
  if (!tokenRow) {
    const error = new Error("Reset link is invalid or has expired. Please request a new one.");
    error.status = 400;
    throw error;
  }

  const [consumeResult] = await pool.query(
    `
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE id = :id AND used_at IS NULL AND expires_at > NOW()
    `,
    { id: tokenRow.id },
  );

  if (!consumeResult || consumeResult.affectedRows === 0) {
    const error = new Error("Reset link has already been used or expired.");
    error.status = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await pool.query("UPDATE users SET password_hash = :passwordHash WHERE id = :userId", {
    passwordHash,
    userId: tokenRow.user_id,
  });

  return findById(tokenRow.user_id);
}

async function validatePassword(user, password) {
  return bcrypt.compare(password, user.password_hash);
}

function validatePasswordPolicy(password) {
  const value = String(password || "");
  if (value.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  if (!/[A-Za-z]/.test(value)) {
    return "Password must contain at least one letter.";
  }
  if (!/\d/.test(value)) {
    return "Password must contain at least one number.";
  }
  return null;
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await findById(userId);
  if (!user) {
    const error = new Error("Account not found.");
    error.status = 404;
    throw error;
  }

  if (!user.password_hash) {
    const error = new Error("Password change is unavailable for social-only accounts. Use Forgot Password to set a password.");
    error.status = 400;
    throw error;
  }

  const matches = await bcrypt.compare(String(currentPassword || ""), user.password_hash);
  if (!matches) {
    const error = new Error("Current password is incorrect.");
    error.status = 400;
    throw error;
  }

  const policyError = validatePasswordPolicy(newPassword);
  if (policyError) {
    const error = new Error(policyError);
    error.status = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(String(newPassword), 12);
  await pool.query("UPDATE users SET password_hash = :passwordHash WHERE id = :userId", {
    passwordHash,
    userId,
  });

  return findById(userId);
}

async function requestAccountDeletion(user, reason = "") {
  const id = crypto.randomUUID();
  const cleanReason = String(reason || "").trim().slice(0, 1000);
  await pool.query(
    `
      INSERT INTO account_deletion_requests (id, user_id, email, name, reason, status)
      VALUES (:id, :userId, :email, :name, :reason, 'pending')
    `,
    {
      id,
      userId: user.id,
      email: user.email,
      name: user.name || "",
      reason: cleanReason || null,
    },
  );

  if (typeof siteData.saveNotification === "function") {
    try {
      await siteData.saveNotification({
        type: "account_deletion_request",
        title: "Account Deletion Request",
        message: `${user.name || user.email} (${user.email}) requested account deletion.`,
        metadata: { type: "account_deletion_request", requestId: id, userId: user.id, email: user.email },
      });
    } catch (notifyErr) {
      console.warn("Failed to create admin notification for deletion request:", notifyErr.message);
    }
  }

  return {
    id,
    user_id: user.id,
    email: user.email,
    status: "pending",
    reason: cleanReason,
    requested_at: new Date().toISOString(),
  };
}

async function touchLastLogin(userId) {
  await pool.query("UPDATE users SET last_login_at = NOW() WHERE id = :userId", { userId });
}

async function updateProfile(userId, updates) {
  const allowed = ["name", "phone", "avatar", "source", "status"];
  const entries = Object.entries(updates || {}).filter(([key]) => allowed.includes(key));

  if (entries.length) {
    const assignments = entries.map(([key]) => `${key} = :${key}`).join(", ");
    await pool.query(`UPDATE users SET ${assignments} WHERE id = :userId`, {
      ...Object.fromEntries(entries),
      userId,
    });
  }

  const user = await findById(userId);
  await syncUserRecords(user);
  return user;
}

async function setRole(userId, role, fallbackEmail) {
  const [result] = await pool.query("UPDATE users SET role = :role WHERE id = :userId", { role, userId });

  // The admin UI can pass a locally-generated id (e.g. for users that only
  // exist in browser storage, not yet synced to the DB). If the id didn't
  // match any row, fall back to matching by email so the role change still
  // lands on the correct account instead of silently doing nothing.
  if ((!result || result.affectedRows === 0) && fallbackEmail) {
    await pool.query("UPDATE users SET role = :role WHERE email = :email", {
      role,
      email: String(fallbackEmail).trim().toLowerCase(),
    });
  }

  const user = fallbackEmail
    ? (await findById(userId)) || (await findByEmail(String(fallbackEmail).trim().toLowerCase()))
    : await findById(userId);

  if (!user) {
    const error = new Error("User not found for role update");
    error.status = 404;
    throw error;
  }

  await syncUserRecords(user);
  return user;
}

async function listUsers() {
  const [rows] = await pool.query("SELECT * FROM users ORDER BY created_at DESC");
  return rows.map(publicUser);
}

async function isAdmin(user) {
  if (!user) return false;
  return user.role === "admin";
}

async function syncUserRecords(user) {
  if (!user) return;

  const safeUser = publicUser(user);
  await kv.set(`user:${user.id}`, safeUser);
  await siteData.upsertCustomer({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    source: user.source || "Direct",
    signup_date: user.created_at || new Date().toISOString(),
    status: user.status || "active",
    totalOrders: 0,
    totalSpent: 0,
  });

  if (safeUser.role === "customer") {
    const existingCustomer = (await kv.get(`customer:${user.id}`)) || {};
    await kv.set(`customer:${user.id}`, {
      ...existingCustomer,
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      source: user.source || existingCustomer.source || "Direct",
      signup_date: existingCustomer.signup_date || user.created_at || new Date().toISOString(),
      status: user.status || "active",
      totalOrders: existingCustomer.totalOrders || 0,
      totalSpent: existingCustomer.totalSpent || 0,
    });
  }
}

module.exports = {
  publicUser,
  findByEmail,
  findById,
  createUser,
  recordTermsConsent,
  createPasswordResetToken,
  consumePasswordResetToken,
  validatePassword,
  validatePasswordPolicy,
  changePassword,
  requestAccountDeletion,
  touchLastLogin,
  updateProfile,
  setRole,
  listUsers,
  isAdmin,
};