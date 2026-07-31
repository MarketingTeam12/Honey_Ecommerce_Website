const { pool } = require("../config/database");

function parseValue(value) {
  if (value == null) return null;
  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

async function set(key, value) {
  await pool.query(
    `
      INSERT INTO app_kv (\`key\`, value)
      VALUES (:key, :value)
      ON DUPLICATE KEY UPDATE value = VALUES(value)
    `,
    { key, value: JSON.stringify(value) },
  );
}

async function get(key) {
  const [rows] = await pool.query(
    "SELECT value FROM app_kv WHERE `key` = :key LIMIT 1",
    { key },
  );

  return rows.length ? parseValue(rows[0].value) : null;
}

async function del(key) {
  await pool.query("DELETE FROM app_kv WHERE `key` = :key", { key });
}

async function mset(keys, values) {
  if (!keys.length) return;

  const params = keys.map((key, index) => [key, JSON.stringify(values[index])]);
  await pool.query(
    `
      INSERT INTO app_kv (\`key\`, value)
      VALUES ?
      ON DUPLICATE KEY UPDATE value = VALUES(value)
    `,
    [params],
  );
}

async function mget(keys) {
  if (!keys.length) return [];

  const [rows] = await pool.query(
    "SELECT value FROM app_kv WHERE `key` IN (?)",
    [keys],
  );

  return rows.map((row) => parseValue(row.value));
}

async function mdel(keys) {
  if (!keys.length) return;
  await pool.query("DELETE FROM app_kv WHERE `key` IN (?)", [keys]);
}

async function getByPrefix(prefix) {
  const [rows] = await pool.query(
    "SELECT value FROM app_kv WHERE `key` LIKE :prefix ORDER BY updated_at DESC",
    { prefix: `${prefix}%` },
  );

  return rows.map((row) => parseValue(row.value));
}

async function listEntriesByPrefix(prefix) {
  const [rows] = await pool.query(
    "SELECT `key`, value FROM app_kv WHERE `key` LIKE :prefix ORDER BY updated_at DESC",
    { prefix: `${prefix}%` },
  );

  return rows.map((row) => ({
    key: row.key,
    value: parseValue(row.value),
  }));
}

async function deleteByPrefix(prefix) {
  await pool.query("DELETE FROM app_kv WHERE `key` LIKE :prefix", { prefix: `${prefix}%` });
}

module.exports = {
  set,
  get,
  del,
  mset,
  mget,
  mdel,
  getByPrefix,
  listEntriesByPrefix,
  deleteByPrefix,
};
