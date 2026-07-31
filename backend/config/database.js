const mysql = require("mysql2/promise");

const {
  MYSQL_HOST = "localhost",
  MYSQL_PORT = "3306",
  MYSQL_USER = "root",
  MYSQL_PASSWORD = "",
  MYSQL_DATABASE = "honey_translations",
  MYSQL_CONNECTION_LIMIT = "10",
} = process.env;

const pool = mysql.createPool({
  host: MYSQL_HOST,
  port: Number(MYSQL_PORT),
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: Number(MYSQL_CONNECTION_LIMIT),
  namedPlaceholders: true,
  charset: "utf8mb4",
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 20000,
  // Hostinger's remote MySQL closes idle connections server-side after its
  // own wait_timeout, which TCP keep-alive can't prevent. Proactively close
  // and remove connections that have been idle for a while so the pool
  // doesn't keep handing out ones the server has already dropped, and keep
  // few idle connections open at all (shared hosting connection caps are tight).
  idleTimeout: 30000,
  maxIdle: 2,
});

pool.on("connection", (connection) => {
  connection.on("error", () => {
    // Hostinger's remote MySQL drops idle connections server-side; this is
    // expected and already handled transparently by the retry wrapper below
    // (queries succeed on the automatic retry), so it's intentionally silent.
  });
});

// mysql2 pools can hand out a connection that the server/network already
// closed while idle (ECONNRESET / PROTOCOL_CONNECTION_LOST). Wrap pool.query
// so a single retry with a fresh connection happens automatically instead of
// bubbling up as a request-crashing error.
const rawQuery = pool.query.bind(pool);
const TRANSIENT_CODES = new Set([
  "ECONNRESET",
  "PROTOCOL_CONNECTION_LOST",
  "ETIMEDOUT",
  "ECONNREFUSED",
]);

pool.query = async function retryingQuery(...args) {
  try {
    return await rawQuery(...args);
  } catch (error) {
    if (TRANSIENT_CODES.has(error?.code)) {
      console.warn(`MySQL query failed with ${error.code}, retrying once...`);
      return await rawQuery(...args);
    }
    throw error;
  }
};

async function ensureDatabaseExists() {
  const rootConnection = await mysql.createConnection({
    host: MYSQL_HOST,
    port: Number(MYSQL_PORT),
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
  });

  try {
    await rootConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await rootConnection.end();
  }
}

async function initializeDatabase() {
  await ensureDatabaseExists();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_kv (
      \`key\` VARCHAR(255) PRIMARY KEY,
      value JSON NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_app_kv_key (\`key\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) DEFAULT 'N/A',
      role VARCHAR(50) NOT NULL DEFAULT 'customer',
      avatar TEXT NULL,
      source VARCHAR(100) DEFAULT 'Direct',
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      last_login_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_users_role (role),
      INDEX idx_users_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(50) DEFAULT 'N/A',
      source VARCHAR(100) DEFAULT 'Direct',
      signup_date DATETIME NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      total_orders INT NOT NULL DEFAULT 0,
      total_spent DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_customers_email (email),
      INDEX idx_customers_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      description TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_categories_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      category VARCHAR(100) NOT NULL,
      price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      old_price DECIMAL(12,2) NULL,
      stock INT NOT NULL DEFAULT 0,
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      image_url TEXT NULL,
      images JSON NULL,
      description TEXT NULL,
      metadata JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_products_category (category),
      INDEX idx_products_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    SELECT COUNT(*) AS column_count
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'products'
      AND column_name = 'images'
  `).then(async ([rows]) => {
    if (Number(rows?.[0]?.column_count || 0) === 0) {
      await pool.query(`ALTER TABLE products ADD COLUMN images JSON NULL AFTER image_url`);
    }
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_configs (
      product_id VARCHAR(64) PRIMARY KEY,
      config JSON NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_product_configs_product_id (product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS languages (
      id VARCHAR(64) PRIMARY KEY,
      type ENUM('source', 'target') NOT NULL,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NULL,
      metadata JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_languages_type (type),
      INDEX idx_languages_code (code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS document_types (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NULL,
      metadata JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_document_types_category (category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id VARCHAR(64) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      subscribed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_subscribers_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS customer_queries (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NULL,
      subject VARCHAR(255) NULL,
      message TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'new',
      metadata JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_customer_queries_email (email),
      INDEX idx_customer_queries_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS coupons (
      id VARCHAR(64) PRIMARY KEY,
      code VARCHAR(100) NOT NULL UNIQUE,
      discount_type VARCHAR(50) NOT NULL,
      discount_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      min_order_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      max_discount DECIMAL(12,2) NULL,
      usage_limit INT NULL,
      used_count INT NOT NULL DEFAULT 0,
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      start_date DATETIME NULL,
      end_date DATETIME NULL,
      metadata JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_coupons_code (code),
      INDEX idx_coupons_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(64) PRIMARY KEY,
      order_number VARCHAR(100) NOT NULL UNIQUE,
      user_id VARCHAR(64) NULL,
      customer_id VARCHAR(64) NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50) NULL,
      items JSON NOT NULL,
      subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      tax DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      coupon_code VARCHAR(100) NULL,
      coupon_discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      processing_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
      payment_method VARCHAR(50) NOT NULL DEFAULT 'cod',
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      shipping_address JSON NULL,
      tracking_number VARCHAR(100) NULL,
      shipping_carrier VARCHAR(100) NULL,
      transaction_id VARCHAR(255) NULL,
      admin_notes TEXT NULL,
      completed_file_url TEXT NULL,
      completed_file_name VARCHAR(255) NULL,
      completed_at DATETIME NULL,
      status_updated_at DATETIME NULL,
      metadata JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_orders_user_id (user_id),
      INDEX idx_orders_customer_email (customer_email),
      INDEX idx_orders_status (status),
      INDEX idx_orders_payment_status (payment_status),
      INDEX idx_orders_order_number (order_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      order_id VARCHAR(64) NOT NULL,
      product_id VARCHAR(64) NULL,
      name VARCHAR(255) NULL,
      quantity INT NOT NULL DEFAULT 1,
      pages VARCHAR(50) NULL,
      rate DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      source_language VARCHAR(255) NULL,
      target_language VARCHAR(255) NULL,
      document_type VARCHAR(255) NULL,
      certificate_type VARCHAR(255) NULL,
      metadata JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_order_items_order_id (order_id),
      INDEX idx_order_items_product_id (product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tracking (
      order_id VARCHAR(64) PRIMARY KEY,
      stage VARCHAR(100) NULL,
      translator VARCHAR(255) NULL,
      notes TEXT NULL,
      metadata JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_tracking_stage (stage)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NULL,
      customer_email VARCHAR(255) NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      read_at DATETIME NULL,
      metadata JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_notifications_user_id (user_id),
      INDEX idx_notifications_customer_email (customer_email),
      INDEX idx_notifications_is_read (is_read)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS work_samples (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NULL,
      image_url TEXT NULL,
      file_url TEXT NULL,
      category VARCHAR(100) NULL,
      metadata JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_work_samples_category (category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id VARCHAR(64) PRIMARY KEY,
      product_id VARCHAR(64) NOT NULL,
      user_id VARCHAR(64) NULL,
      rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
      title VARCHAR(255) NULL,
      comment TEXT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      votes INT NOT NULL DEFAULT 0,
      metadata JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_reviews_product_id (product_id),
      INDEX idx_reviews_user_id (user_id),
      INDEX idx_reviews_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      key_name VARCHAR(100) NOT NULL UNIQUE,
      key_value JSON NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_api_keys_key_name (key_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(64) PRIMARY KEY,
      order_id VARCHAR(64) NULL,
      payment_id VARCHAR(255) NOT NULL UNIQUE,
      gateway VARCHAR(50) NOT NULL DEFAULT 'razorpay',
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      method VARCHAR(50) NULL,
      gateway_response JSON NULL,
      metadata JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_payments_order_id (order_id),
      INDEX idx_payments_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id VARCHAR(64) PRIMARY KEY,
      order_id VARCHAR(64) NULL,
      invoice_number VARCHAR(100) NOT NULL UNIQUE,
      file_path TEXT NOT NULL,
      file_url TEXT NULL,
      metadata JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_invoices_order_id (order_id),
      INDEX idx_invoices_invoice_number (invoice_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      product_id VARCHAR(64) NOT NULL,
      item_data JSON NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_cart_items_user_product (user_id, product_id),
      INDEX idx_cart_items_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cart_coupons (
      user_id VARCHAR(64) PRIMARY KEY,
      code VARCHAR(100) NOT NULL,
      discount_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      discount_type VARCHAR(20) NOT NULL DEFAULT 'fixed',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wishlist_items (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      product_id VARCHAR(64) NOT NULL,
      item_data JSON NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_wishlist_items_user_product (user_id, product_id),
      INDEX idx_wishlist_items_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Migration: add email delivery tracking columns to orders if they don't exist yet
  // (safe to run every startup — checks information_schema first, MySQL-version agnostic)
  const [emailCols] = await pool.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'email_status'`
  );
  if (emailCols.length === 0) {
    await pool.query(`
      ALTER TABLE orders
        ADD COLUMN email_status VARCHAR(50) NOT NULL DEFAULT 'not_sent' AFTER status_updated_at,
        ADD COLUMN email_error TEXT NULL AFTER email_status,
        ADD COLUMN email_sent_at DATETIME NULL AFTER email_error
    `);
  }

  // Migration: add tracking_number / shipping_carrier columns to orders if
  // they don't exist yet (older DBs never had them, which is why admin
  // panel + customer order tracking always showed "Not assigned").
  const [trackingCols] = await pool.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'tracking_number'`
  );
  if (trackingCols.length === 0) {
    await pool.query(`
      ALTER TABLE orders
        ADD COLUMN tracking_number VARCHAR(100) NULL AFTER shipping_address,
        ADD COLUMN shipping_carrier VARCHAR(100) NULL AFTER tracking_number
    `);
  }
}

module.exports = {
  pool,
  initializeDatabase,
};