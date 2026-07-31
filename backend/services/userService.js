const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { pool } = require("../config/database");
const kv = require("./kvStore");
const siteData = require("./siteDataService");

const ADMIN_EMAILS = new Set(["admin@honeytranslations.com", "swetha@gmail.com", "YOUR_LOGIN_EMAIL_HERE"]);

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
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

async function createUser({ email, password, name, phone = "N/A", role = "customer", source = "Direct", avatar = null }) {
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

  await pool.query(
    `
      INSERT INTO users (id, email, password_hash, name, phone, role, avatar, source, status)
      VALUES (:id, :email, :passwordHash, :name, :phone, :role, :avatar, :source, 'active')
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
    },
  );

  const user = await findById(id);
  await syncUserRecords(user);
  return user;
}

async function validatePassword(user, password) {
  return bcrypt.compare(password, user.password_hash);
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
  validatePassword,
  touchLastLogin,
  updateProfile,
  setRole,
  listUsers,
  isAdmin,
};