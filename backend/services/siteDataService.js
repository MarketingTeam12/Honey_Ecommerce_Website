const crypto = require("crypto");
const { pool } = require("../config/database");
const { deleteObjectByKey, extractKeyFromUrl } = require("./s3Service");

function now() {
  // MySQL DATETIME columns expect "YYYY-MM-DD HH:MM:SS" — a plain
  // new Date().toISOString() ("...T...Z") isn't a format MySQL parses
  // correctly, which was silently producing invalid/garbled dates
  // (e.g. subscribers.subscribed_at) that showed as "Invalid Date" in
  // the admin panel. This formats it the way MySQL actually expects.
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}

function toJson(value) {
  if (value == null) return null;
  return typeof value === "string" ? value : JSON.stringify(value);
}

function parseJson(value) {
  if (value == null) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeProduct(row) {
  if (!row) return null;
  const metadata = parseJson(row.metadata);
  const rowImages = parseJson(row.images);
  const metadataImages = metadata && typeof metadata === "object" ? metadata.images : null;
  const normalizedImages = Array.isArray(rowImages)
    ? rowImages
    : Array.isArray(metadataImages)
      ? metadataImages
      : row.image_url
        ? [row.image_url]
        : [];
  return {
    ...row,
    oldPrice: row.old_price,
    // The frontend (admin form, product pages, listing pages) reads this
    // field as `compareAtPrice`, not `oldPrice` — without this alias the
    // saved compare price was never actually visible to the UI.
    compareAtPrice: row.old_price !== null && row.old_price !== undefined ? Number(row.old_price) : null,
    imageUrl: row.image_url,
    images: normalizedImages,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata,
  };
}

function normalizeCategory(row) {
  if (!row) return null;
  return {
    ...row,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeCustomer(row) {
  if (!row) return null;
  return {
    ...row,
    totalOrders: row.total_orders,
    totalSpent: row.total_spent,
    signup_date: row.signup_date,
    signupDate: row.signup_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeQuery(row) {
  if (!row) return null;
  return {
    ...row,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // The admin panel's Customer Queries page reads `submittedAt` — alias it
    // here so it isn't left undefined (which was rendering as "Invalid Date").
    submittedAt: row.created_at,
    metadata: parseJson(row.metadata),
  };
}

function normalizeReview(row) {
  if (!row) return null;
  const metadata = parseJson(row.metadata) || {};
  const voters = Array.isArray(metadata.voters) ? metadata.voters : [];
  return {
    ...row,
    productId: row.product_id,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata,
    productName: metadata.productName || metadata.product_name || row.product_id,
    customerName: metadata.customerName || metadata.customer_name || metadata.name || "Anonymous",
    reviewText: row.comment || metadata.reviewText || metadata.review_text || "",
    verifiedBuyer: metadata.verifiedBuyer ?? false,
    helpfulVotes: Number(metadata.helpfulVotes || 0),
    notHelpfulVotes: Number(metadata.notHelpfulVotes || 0),
    voters,
    edited: metadata.edited ?? false,
  };
}

function normalizeCoupon(row) {
  if (!row) return null;
  return {
    ...row,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    minOrderValue: row.min_order_value,
    maxDiscount: row.max_discount,
    usageLimit: row.usage_limit,
    usedCount: row.used_count,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata: parseJson(row.metadata),
  };
}

function normalizeSubscriber(row) {
  if (!row) return null;
  return {
    ...row,
    subscribedAt: row.subscribed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeWorkSample(row) {
  if (!row) return null;
  return {
    ...row,
    imageUrl: row.image_url,
    fileUrl: row.file_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata: parseJson(row.metadata),
  };
}

function normalizeNotification(row) {
  if (!row) return null;
  const metadata = parseJson(row.metadata);
  return {
    ...row,
    userId: row.user_id,
    customerEmail: row.customer_email,
    isRead: Boolean(row.is_read),
    read: Boolean(row.is_read),
    readAt: row.read_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    type: metadata?.type || row.type || "general",
    metadata,
  };
}

function normalizeLanguage(row) {
  if (!row) return null;
  return {
    ...row,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata: parseJson(row.metadata),
  };
}

function normalizeDocumentType(row) {
  if (!row) return null;
  return {
    ...row,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata: parseJson(row.metadata),
  };
}

function normalizeProductConfig(row) {
  if (!row) return null;
  return {
    ...row,
    productId: row.product_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    config: parseJson(row.config),
  };
}

function normalizeApiKey(row) {
  if (!row) return null;
  return {
    ...row,
    keyName: row.key_name,
    keyValue: parseJson(row.key_value),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizePayment(row) {
  if (!row) return null;
  return {
    ...row,
    orderId: row.order_id,
    paymentId: row.payment_id,
    gatewayResponse: parseJson(row.gateway_response),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata: parseJson(row.metadata),
  };
}

function normalizeOrder(row) {
  if (!row) return null;
  const metadata = parseJson(row.metadata) || {};
  return {
    ...row,
    userId: row.user_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    orderNumber: row.order_number,
    subtotal: Number(row.subtotal || 0),
    tax: Number(row.tax || 0),
    discount: Number(row.discount || 0),
    couponDiscount: Number(row.coupon_discount || 0),
    processingFee: Number(row.processing_fee || 0),
    totalAmount: Number(row.total_amount || 0),
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    statusUpdatedAt: row.status_updated_at,
    emailStatus: row.email_status,
    emailError: row.email_error,
    emailSentAt: row.email_sent_at,
    completedFileUrl: row.completed_file_url,
    completedFileName: row.completed_file_name,
    completedAt: row.completed_at,
    shippingAddress: parseJson(row.shipping_address),
    // shipping_details / shipping_method are saved inside metadata (there's
    // no dedicated column for them) - surface them at the top level too so
    // the admin/customer UI can read order.shipping_details and
    // order.shipping_method directly instead of digging into metadata.
    shipping_details: metadata.shippingDetails || null,
    shipping_method: metadata.shippingMethod || null,
    items: parseJson(row.items) || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata,
  };
}

async function listProducts() {
  const [rows] = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
  return rows.map(normalizeProduct);
}

async function listCategories() {
  const [rows] = await pool.query("SELECT * FROM categories ORDER BY created_at DESC");
  return rows.map(normalizeCategory);
}

async function getProduct(id) {
  const [rows] = await pool.query("SELECT * FROM products WHERE id = :id LIMIT 1", { id });
  return normalizeProduct(rows[0] || null);
}

async function saveProduct(data, existingId) {
  const id = existingId || data.id || makeId("product");
  const previousProduct = existingId ? await getProduct(existingId) : null;
  const normalizedImages = Array.isArray(data.images)
    ? data.images.filter(Boolean)
    : typeof data.images === "string"
      ? parseJson(data.images)
      : [];
  const imageUrl = data.image_url || data.imageUrl || normalizedImages[0] || null;
  const price = Number(data.price || 0);

  // Accept old_price / oldPrice / compareAtPrice (the frontend actually
  // sends compareAtPrice). An empty string or missing value means "no
  // compare price" and must clear any previously stored value, not leave
  // the old DB value in place. A compare price that isn't strictly higher
  // than the current price is meaningless for a strikethrough/discount
  // display, so it's dropped rather than stored.
  const rawOldPrice = data.old_price ?? data.oldPrice ?? data.compareAtPrice;
  let oldPrice = null;
  if (rawOldPrice !== null && rawOldPrice !== undefined && rawOldPrice !== "") {
    const parsed = Number(rawOldPrice);
    if (Number.isFinite(parsed) && parsed > price) {
      oldPrice = parsed;
    }
  }

  const payload = {
    id,
    name: data.name || "Untitled Product",
    slug: data.slug || String(data.name || "product").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    category: data.category || "general",
    price,
    old_price: oldPrice,
    stock: Number(data.stock || 0),
    status: data.status || "active",
    image_url: imageUrl,
    images: toJson(normalizedImages.length > 0 ? normalizedImages : null),
    description: data.description || null,
    metadata: toJson(data.metadata || data),
  };

  await pool.query(
    `
      INSERT INTO products (
        id, name, slug, category, price, old_price, stock, status, image_url, images, description, metadata
      )
      VALUES (
        :id, :name, :slug, :category, :price, :old_price, :stock, :status, :image_url, :images, :description, :metadata
      )
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        slug = VALUES(slug),
        category = VALUES(category),
        price = VALUES(price),
        old_price = VALUES(old_price),
        stock = VALUES(stock),
        status = VALUES(status),
        image_url = VALUES(image_url),
        images = VALUES(images),
        description = VALUES(description),
        metadata = VALUES(metadata),
        updated_at = NOW()
    `,
    payload,
  );

  if (previousProduct) {
    const previousImages = Array.isArray(previousProduct.images)
      ? previousProduct.images
      : previousProduct.imageUrl
        ? [previousProduct.imageUrl]
        : [];
    const nextImages = normalizedImages.length > 0 ? normalizedImages : (imageUrl ? [imageUrl] : []);
    const removedImages = previousImages.filter((url) => !nextImages.includes(url));

    await Promise.all(
      removedImages.map(async (url) => {
        const key = extractKeyFromUrl(url);
        if (!key) return;
        try {
          await deleteObjectByKey(key);
        } catch (error) {
          console.warn("Failed to delete removed product image from S3:", url, error?.message || error);
        }
      }),
    );
  }

  return getProduct(id);
}

async function deleteProduct(id) {
  await pool.query("DELETE FROM products WHERE id = :id", { id });
}

async function listCustomers() {
  const [rows] = await pool.query("SELECT * FROM customers ORDER BY updated_at DESC");
  return rows.map(normalizeCustomer);
}

async function getCustomer(id, executor = pool) {
  const [rows] = await executor.query("SELECT * FROM customers WHERE id = :id LIMIT 1", { id });
  return normalizeCustomer(rows[0] || null);
}

async function upsertCustomer(data, existingId, executor = pool) {
  const id = existingId || data.id || makeId("customer");
  const payload = {
    id,
    name: data.name || "Customer",
    email: String(data.email || "").trim().toLowerCase(),
    phone: data.phone || "N/A",
    source: data.source || "Direct",
    signup_date: data.signup_date || data.signupDate || null,
    status: data.status || "active",
    total_orders: Number(data.totalOrders ?? data.total_orders ?? 0),
    total_spent: Number(data.totalSpent ?? data.total_spent ?? 0),
  };

  await executor.query(
    `
      INSERT INTO customers (
        id, name, email, phone, source, signup_date, status, total_orders, total_spent
      )
      VALUES (
        :id, :name, :email, :phone, :source, :signup_date, :status, :total_orders, :total_spent
      )
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        email = VALUES(email),
        phone = VALUES(phone),
        source = VALUES(source),
        signup_date = VALUES(signup_date),
        status = VALUES(status),
        total_orders = VALUES(total_orders),
        total_spent = VALUES(total_spent),
        updated_at = NOW()
    `,
    payload,
  );

  return getCustomer(id, executor);
}

async function deleteCustomer(id) {
  await pool.query("DELETE FROM customers WHERE id = :id", { id });
}

async function listQueries() {
  const [rows] = await pool.query("SELECT * FROM customer_queries ORDER BY created_at DESC");
  return rows.map(normalizeQuery);
}

async function saveQuery(data, existingId) {
  const id = existingId || data.id || makeId("query");
  const payload = {
    id,
    name: data.name || "Anonymous",
    email: String(data.email || "").trim().toLowerCase(),
    phone: data.phone || null,
    subject: data.subject || null,
    message: data.message || "",
    status: data.status || "new",
    metadata: toJson(data.metadata || data),
  };

  await pool.query(
    `
      INSERT INTO customer_queries (
        id, name, email, phone, subject, message, status, metadata
      )
      VALUES (
        :id, :name, :email, :phone, :subject, :message, :status, :metadata
      )
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        email = VALUES(email),
        phone = VALUES(phone),
        subject = VALUES(subject),
        message = VALUES(message),
        status = VALUES(status),
        metadata = VALUES(metadata),
        updated_at = NOW()
    `,
    payload,
  );

  return getQuery(id);
}

async function getQuery(id) {
  const [rows] = await pool.query("SELECT * FROM customer_queries WHERE id = :id LIMIT 1", { id });
  return normalizeQuery(rows[0] || null);
}

async function updateQueryStatus(id, status) {
  await pool.query(
    "UPDATE customer_queries SET status = :status, updated_at = NOW() WHERE id = :id",
    { id, status },
  );
  return getQuery(id);
}

async function deleteQuery(id) {
  await pool.query("DELETE FROM customer_queries WHERE id = :id", { id });
}

async function listReviews(productId) {
  const params = productId ? { productId } : {};
  const sql = productId
    ? "SELECT * FROM reviews WHERE product_id = :productId ORDER BY created_at DESC"
    : "SELECT * FROM reviews ORDER BY created_at DESC";
  const [rows] = await pool.query(sql, params);
  return rows.map(normalizeReview);
}

async function getReview(id) {
  const [rows] = await pool.query("SELECT * FROM reviews WHERE id = :id LIMIT 1", { id });
  return normalizeReview(rows[0] || null);
}

async function saveReview(data, existingId) {
  const id = existingId || data.id || makeId("review");
  const existing = existingId ? await getReview(existingId) : null;

  // Distinguish a genuine customer content edit (rating/reviewText change via
  // the customer "Edit Review" flow) from an admin-only status change (e.g.
  // approve/hide), which must NOT be flagged as "edited" on the review.
  const isContentEdit =
    Boolean(existing) &&
    (data.reviewText !== undefined || data.review_text !== undefined) &&
    data.status === undefined;

  const mergedMetadata = {
    ...(existing?.metadata || {}),
    ...(data.metadata || data),
    // Never let a raw spread of `data` clobber vote tallies/voters that
    // aren't part of this update.
    helpfulVotes: existing?.helpfulVotes ?? 0,
    notHelpfulVotes: existing?.notHelpfulVotes ?? 0,
    voters: existing?.voters ?? [],
    edited: isContentEdit ? true : existing?.edited ?? false,
  };

  const payload = {
    id,
    product_id: data.productId || data.product_id || existing?.productId || "",
    user_id: data.userId || data.user_id || existing?.userId || null,
    rating: data.rating !== undefined ? Number(data.rating) : Number(existing?.rating || 0),
    title: data.title !== undefined ? data.title : existing?.title || null,
    comment: data.reviewText || data.review_text || data.comment || existing?.reviewText || null,
    status: data.status || existing?.status || "pending",
    votes: data.votes !== undefined ? Number(data.votes) : Number(existing?.votes || 0),
    metadata: toJson(mergedMetadata),
  };

  await pool.query(
    `
      INSERT INTO reviews (
        id, product_id, user_id, rating, title, comment, status, votes, metadata
      )
      VALUES (
        :id, :product_id, :user_id, :rating, :title, :comment, :status, :votes, :metadata
      )
      ON DUPLICATE KEY UPDATE
        product_id = VALUES(product_id),
        user_id = VALUES(user_id),
        rating = VALUES(rating),
        title = VALUES(title),
        comment = VALUES(comment),
        status = VALUES(status),
        votes = VALUES(votes),
        metadata = VALUES(metadata),
        updated_at = NOW()
    `,
    payload,
  );

  return getReview(id);
}

async function voteReview(id, voteType, userId) {
  const review = await getReview(id);
  if (!review) return null;

  const type = voteType === "notHelpful" ? "notHelpful" : "helpful";
  const voters = Array.isArray(review.voters) ? [...review.voters] : [];
  let helpfulVotes = Number(review.helpfulVotes || 0);
  let notHelpfulVotes = Number(review.notHelpfulVotes || 0);

  if (userId) {
    const existingIndex = voters.findIndex((v) => v.userId === userId);
    if (existingIndex !== -1) {
      const oldType = voters[existingIndex].voteType;
      if (oldType === type) {
        // Already voted this way — no-op, return current state.
        return review;
      }
      if (oldType === "helpful") helpfulVotes = Math.max(0, helpfulVotes - 1);
      else notHelpfulVotes = Math.max(0, notHelpfulVotes - 1);
      voters[existingIndex] = { userId, voteType: type, votedAt: new Date().toISOString() };
    } else {
      voters.push({ userId, voteType: type, votedAt: new Date().toISOString() });
    }
  }

  if (type === "helpful") helpfulVotes += 1;
  else notHelpfulVotes += 1;

  const metadata = {
    ...(review.metadata || {}),
    helpfulVotes,
    notHelpfulVotes,
    voters,
  };

  await pool.query(
    "UPDATE reviews SET votes = votes + 1, metadata = :metadata, updated_at = NOW() WHERE id = :id",
    { id, metadata: toJson(metadata) },
  );
  return getReview(id);
}

async function deleteReview(id) {
  await pool.query("DELETE FROM reviews WHERE id = :id", { id });
}

async function listOrders() {
  const [rows] = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
  return rows.map(normalizeOrder);
}

async function getOrder(id, executor = pool) {
  const [rows] = await executor.query("SELECT * FROM orders WHERE id = :id LIMIT 1", { id });
  return normalizeOrder(rows[0] || null);
}

async function deleteOrder(id) {
  await pool.query("DELETE FROM orders WHERE id = :id", { id });
}

async function saveOrder(data, existingId, executor = pool) {
  const id = existingId || data.id || makeId("order");
  const orderNumber = data.order_number || data.orderNumber || `HT${Date.now()}`;
  const payload = {
    id,
    order_number: orderNumber,
    user_id: data.user_id || data.userId || null,
    customer_id: data.customer_id || data.customerId || null,
    customer_name: data.customer_name || data.customerName || "Customer",
    customer_email: String(data.customer_email || data.customerEmail || data.email || "").trim().toLowerCase(),
    customer_phone: data.customer_phone || data.customerPhone || null,
    items: toJson(data.items || []),
    subtotal: Number(data.subtotal ?? data.subTotal ?? 0),
    tax: Number(data.tax || 0),
    discount: Number(data.discount || 0),
    coupon_code: data.coupon_code || data.couponCode || null,
    coupon_discount: Number(data.coupon_discount ?? data.couponDiscount ?? 0),
    processing_fee: Number(data.processing_fee ?? data.processingFee ?? 0),
    total_amount: Number(data.total_amount ?? data.totalAmount ?? data.total ?? 0),
    payment_status: data.payment_status || data.paymentStatus || "pending",
    payment_method: data.payment_method || data.paymentMethod || "cod",
    status: data.status || "pending",
    shipping_address: toJson(data.shipping_address || data.shippingAddress || null),
    tracking_number: data.tracking_number || data.trackingNumber || null,
    shipping_carrier: data.shipping_carrier || data.shippingCarrier || null,
    transaction_id: data.transaction_id || data.transactionId || null,
    admin_notes: data.admin_notes || data.adminNotes || null,
    completed_file_url: data.completed_file_url || data.completedFileUrl || null,
    completed_file_name: data.completed_file_name || data.completedFileName || null,
    completed_at: data.completed_at || data.completedAt || null,
    status_updated_at: data.status_updated_at || data.statusUpdatedAt || null,
    metadata: toJson(data.metadata || data),
  };

  await executor.query(
    `
      INSERT INTO orders (
        id, order_number, user_id, customer_id, customer_name, customer_email, customer_phone,
        items, subtotal, tax, discount, coupon_code, coupon_discount, processing_fee, total_amount,
        payment_status, payment_method, status, shipping_address, tracking_number, shipping_carrier,
        transaction_id, admin_notes,
        completed_file_url, completed_file_name, completed_at, status_updated_at, metadata
      )
      VALUES (
        :id, :order_number, :user_id, :customer_id, :customer_name, :customer_email, :customer_phone,
        :items, :subtotal, :tax, :discount, :coupon_code, :coupon_discount, :processing_fee, :total_amount,
        :payment_status, :payment_method, :status, :shipping_address, :tracking_number, :shipping_carrier,
        :transaction_id, :admin_notes,
        :completed_file_url, :completed_file_name, :completed_at, :status_updated_at, :metadata
      )
      ON DUPLICATE KEY UPDATE
        order_number = VALUES(order_number),
        user_id = VALUES(user_id),
        customer_id = VALUES(customer_id),
        customer_name = VALUES(customer_name),
        customer_email = VALUES(customer_email),
        customer_phone = VALUES(customer_phone),
        items = VALUES(items),
        subtotal = VALUES(subtotal),
        tax = VALUES(tax),
        discount = VALUES(discount),
        coupon_code = VALUES(coupon_code),
        coupon_discount = VALUES(coupon_discount),
        processing_fee = VALUES(processing_fee),
        total_amount = VALUES(total_amount),
        payment_status = VALUES(payment_status),
        payment_method = VALUES(payment_method),
        status = VALUES(status),
        shipping_address = VALUES(shipping_address),
        tracking_number = VALUES(tracking_number),
        shipping_carrier = VALUES(shipping_carrier),
        transaction_id = VALUES(transaction_id),
        admin_notes = VALUES(admin_notes),
        completed_file_url = VALUES(completed_file_url),
        completed_file_name = VALUES(completed_file_name),
        completed_at = VALUES(completed_at),
        status_updated_at = VALUES(status_updated_at),
        metadata = VALUES(metadata),
        updated_at = NOW()
    `,
    payload,
  );

  return getOrder(id, executor);
}

// Creates an order and upserts the matching customer record in a single
// MySQL transaction. These used to be two independent pool.query() calls
// (see the old /orders route) — if the process crashed, the DB connection
// dropped, or the customer upsert threw, the order would already be
// committed with no matching customer stats update (or vice versa on a
// retry), silently corrupting total_orders/total_spent. Wrapping both
// writes in one transaction means either both succeed or neither does.
async function createOrderWithCustomer(orderData) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const order = await saveOrder(orderData, undefined, connection);

    const customerEmail = order.customer_email || order.customerEmail || order.email;
    if (customerEmail) {
      const customerId =
        order.customer_id ||
        orderData.user_id ||
        crypto.createHash("sha1").update(customerEmail).digest("hex");

      // SELECT ... FOR UPDATE locks the customer row for the rest of this
      // transaction so two orders placed back-to-back by the same customer
      // can't both read the same total_orders/total_spent and overwrite
      // each other's increment (lost update).
      const [existingRows] = await connection.query(
        "SELECT * FROM customers WHERE id = :id LIMIT 1 FOR UPDATE",
        { id: customerId },
      );
      const existingCustomer = normalizeCustomer(existingRows[0] || null);

      await upsertCustomer(
        {
          ...existingCustomer,
          id: customerId,
          name: order.customer_name || order.customerName || existingCustomer?.name || "Customer",
          email: customerEmail,
          phone: order.customer_phone || order.phone || existingCustomer?.phone || "N/A",
          source: existingCustomer?.source || "Order",
          signup_date: existingCustomer?.signup_date || now(),
          status: "active",
          totalOrders: Number(existingCustomer?.totalOrders || 0) + 1,
          totalSpent:
            Number(existingCustomer?.totalSpent || 0) +
            Number(order.total_amount || order.totalAmount || order.total || 0),
        },
        customerId,
        connection,
      );
    }

    await connection.commit();
    return getOrder(order.id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateOrderStatus(id, status, extra = {}) {
  const { tracking_number, shipping_carrier } = extra;
  const hasTrackingNumber = tracking_number !== undefined;
  const hasShippingCarrier = shipping_carrier !== undefined;

  await pool.query(
    `UPDATE orders SET
       status = :status,
       status_updated_at = NOW(),
       ${hasTrackingNumber ? "tracking_number = :tracking_number," : ""}
       ${hasShippingCarrier ? "shipping_carrier = :shipping_carrier," : ""}
       updated_at = NOW()
     WHERE id = :id`,
    { id, status, tracking_number, shipping_carrier },
  );
  return getOrder(id);
}

async function updateOrderEmailStatus(id, { status, error } = {}) {
  const allowed = ["not_sent", "sent", "failed"];
  const normalized = allowed.includes(status) ? status : "failed";
  await pool.query(
    `UPDATE orders
     SET email_status = :email_status,
         email_error = :email_error,
         email_sent_at = ${normalized === "sent" ? "NOW()" : "email_sent_at"},
         updated_at = NOW()
     WHERE id = :id`,
    { id, email_status: normalized, email_error: error ? String(error).slice(0, 2000) : null },
  );
  return getOrder(id);
}

async function updateOrderPaymentStatus(id, paymentStatus) {
  const allowed = ["paid", "unpaid", "pending", "failed", "refunded"];
  const normalized = String(paymentStatus || "").toLowerCase();
  if (!allowed.includes(normalized)) {
    const error = new Error(`Invalid payment_status. Allowed: ${allowed.join(", ")}`);
    error.status = 400;
    throw error;
  }
  await pool.query(
    "UPDATE orders SET payment_status = :payment_status, updated_at = NOW() WHERE id = :id",
    { id, payment_status: normalized },
  );
  return getOrder(id);
}

async function updateOrderNotes(id, notes) {
  await pool.query(
    "UPDATE orders SET admin_notes = :notes, updated_at = NOW() WHERE id = :id",
    { id, notes },
  );
  return getOrder(id);
}

async function updateOrderCompletedFile(id, data) {
  await pool.query(
    `
      UPDATE orders
      SET completed_file_url = :completed_file_url,
          completed_file_name = :completed_file_name,
          completed_at = NOW(),
          updated_at = NOW()
      WHERE id = :id
    `,
    {
      id,
      completed_file_url: data.completed_file_url || null,
      completed_file_name: data.completed_file_name || null,
    },
  );
  return getOrder(id);
}

async function getTracking(orderId) {
  const [rows] = await pool.query("SELECT * FROM tracking WHERE order_id = :orderId LIMIT 1", { orderId });
  const row = rows[0];
  if (!row) return { orderId };
  return {
    ...row,
    orderId: row.order_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata: parseJson(row.metadata),
  };
}

async function saveTracking(orderId, data) {
  const payload = {
    order_id: orderId,
    stage: data.stage || null,
    translator: data.translator || null,
    notes: data.notes || null,
    metadata: toJson(data.metadata || data),
  };

  await pool.query(
    `
      INSERT INTO tracking (order_id, stage, translator, notes, metadata)
      VALUES (:order_id, :stage, :translator, :notes, :metadata)
      ON DUPLICATE KEY UPDATE
        stage = VALUES(stage),
        translator = VALUES(translator),
        notes = VALUES(notes),
        metadata = VALUES(metadata),
        updated_at = NOW()
    `,
    payload,
  );

  return getTracking(orderId);
}

async function listCoupons() {
  const [rows] = await pool.query("SELECT * FROM coupons ORDER BY created_at DESC");
  return rows.map(normalizeCoupon);
}

async function getCoupon(id) {
  const [rows] = await pool.query("SELECT * FROM coupons WHERE id = :id LIMIT 1", { id });
  return normalizeCoupon(rows[0] || null);
}

async function saveCoupon(data, existingId) {
  const id = existingId || data.id || makeId("coupon");
  const payload = {
    id,
    code: String(data.code || "").toUpperCase(),
    discount_type: data.discountType || data.discount_type || "fixed",
    discount_value: Number(data.discountValue ?? data.discount_value ?? 0),
    min_order_value: Number(data.minOrderValue ?? data.min_order_value ?? 0),
    max_discount: data.maxDiscount ?? data.max_discount ?? null,
    usage_limit: data.usageLimit ?? data.usage_limit ?? null,
    used_count: Number(data.usedCount ?? data.used_count ?? 0),
    status: data.status || "active",
    start_date: data.startDate || data.start_date || null,
    end_date: data.endDate || data.end_date || null,
    metadata: toJson(data.metadata || data),
  };

  await pool.query(
    `
      INSERT INTO coupons (
        id, code, discount_type, discount_value, min_order_value, max_discount, usage_limit, used_count,
        status, start_date, end_date, metadata
      )
      VALUES (
        :id, :code, :discount_type, :discount_value, :min_order_value, :max_discount, :usage_limit, :used_count,
        :status, :start_date, :end_date, :metadata
      )
      ON DUPLICATE KEY UPDATE
        code = VALUES(code),
        discount_type = VALUES(discount_type),
        discount_value = VALUES(discount_value),
        min_order_value = VALUES(min_order_value),
        max_discount = VALUES(max_discount),
        usage_limit = VALUES(usage_limit),
        used_count = VALUES(used_count),
        status = VALUES(status),
        start_date = VALUES(start_date),
        end_date = VALUES(end_date),
        metadata = VALUES(metadata),
        updated_at = NOW()
    `,
    payload,
  );

  return getCoupon(id);
}

async function deleteCoupon(id) {
  await pool.query("DELETE FROM coupons WHERE id = :id", { id });
}

async function listSubscribers() {
  const [rows] = await pool.query("SELECT * FROM subscribers ORDER BY created_at DESC");
  return rows.map(normalizeSubscriber);
}

async function saveSubscriber(email, data = {}) {
  const id = data.id || makeId("subscriber");
  const payload = {
    id,
    email: String(email || data.email || "").trim().toLowerCase(),
    subscribed_at: data.subscribedAt || data.subscribed_at || now(),
    status: data.status || "active",
  };

  await pool.query(
    `
      INSERT INTO subscribers (id, email, subscribed_at, status)
      VALUES (:id, :email, :subscribed_at, :status)
      ON DUPLICATE KEY UPDATE
        subscribed_at = VALUES(subscribed_at),
        status = VALUES(status),
        updated_at = NOW()
    `,
    payload,
  );

  const [rows] = await pool.query("SELECT * FROM subscribers WHERE email = :email LIMIT 1", { email: payload.email });
  return normalizeSubscriber(rows[0] || null);
}

async function deleteSubscriber(id) {
  await pool.query("DELETE FROM subscribers WHERE id = :id", { id });
}

async function listWorkSamples() {
  const [rows] = await pool.query("SELECT * FROM work_samples ORDER BY created_at DESC");
  return rows.map(normalizeWorkSample);
}

async function getWorkSample(id) {
  const [rows] = await pool.query("SELECT * FROM work_samples WHERE id = :id LIMIT 1", { id });
  return normalizeWorkSample(rows[0] || null);
}

async function saveWorkSample(data, existingId) {
  const id = existingId || data.id || makeId("work_sample");
  const payload = {
    id,
    title: data.title || "Work Sample",
    description: data.description || null,
    image_url: data.image_url || data.imageUrl || null,
    file_url: data.file_url || data.fileUrl || null,
    category: data.category || null,
    metadata: toJson(data.metadata || data),
  };

  await pool.query(
    `
      INSERT INTO work_samples (id, title, description, image_url, file_url, category, metadata)
      VALUES (:id, :title, :description, :image_url, :file_url, :category, :metadata)
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        description = VALUES(description),
        image_url = VALUES(image_url),
        file_url = VALUES(file_url),
        category = VALUES(category),
        metadata = VALUES(metadata),
        updated_at = NOW()
    `,
    payload,
  );

  return getWorkSample(id);
}

async function deleteWorkSample(id) {
  await pool.query("DELETE FROM work_samples WHERE id = :id", { id });
}

async function listNotifications() {
  const [rows] = await pool.query("SELECT * FROM notifications ORDER BY created_at DESC");
  return rows.map(normalizeNotification);
}

async function saveNotification(data, existingId) {
  const id = existingId || data.id || makeId("notification");
  const payload = {
    id,
    user_id: data.userId || data.user_id || null,
    customer_email: data.customerEmail || data.customer_email || null,
    title: data.title || "Notification",
    message: data.message || "",
    is_read: data.read || data.isRead ? 1 : 0,
    read_at: data.readAt || data.read_at || null,
    metadata: toJson(data.metadata || data),
  };

  await pool.query(
    `
      INSERT INTO notifications (
        id, user_id, customer_email, title, message, is_read, read_at, metadata
      )
      VALUES (
        :id, :user_id, :customer_email, :title, :message, :is_read, :read_at, :metadata
      )
      ON DUPLICATE KEY UPDATE
        user_id = VALUES(user_id),
        customer_email = VALUES(customer_email),
        title = VALUES(title),
        message = VALUES(message),
        is_read = VALUES(is_read),
        read_at = VALUES(read_at),
        metadata = VALUES(metadata),
        updated_at = NOW()
    `,
    payload,
  );

  const [rows] = await pool.query("SELECT * FROM notifications WHERE id = :id LIMIT 1", { id });
  return normalizeNotification(rows[0] || null);
}

async function markNotificationRead(id) {
  await pool.query("UPDATE notifications SET is_read = 1, read_at = NOW(), updated_at = NOW() WHERE id = :id", { id });
  const [rows] = await pool.query("SELECT * FROM notifications WHERE id = :id LIMIT 1", { id });
  return normalizeNotification(rows[0] || null);
}

async function markAllNotificationsRead() {
  await pool.query("UPDATE notifications SET is_read = 1, read_at = NOW(), updated_at = NOW() WHERE is_read = 0");
}

async function deleteNotification(id) {
  await pool.query("DELETE FROM notifications WHERE id = :id", { id });
}

async function listLanguages(type) {
  const params = type ? { type } : {};
  const sql = type
    ? "SELECT * FROM languages WHERE type = :type ORDER BY created_at DESC"
    : "SELECT * FROM languages ORDER BY created_at DESC";
  const [rows] = await pool.query(sql, params);
  return rows.map(normalizeLanguage);
}

async function saveLanguage(data, existingId) {
  const id = existingId || data.id || makeId("lang");
  const payload = {
    id,
    type: data.type === "target" ? "target" : "source",
    name: data.name || "Language",
    code: data.code || null,
    metadata: toJson(data.metadata || data),
  };

  await pool.query(
    `
      INSERT INTO languages (id, type, name, code, metadata)
      VALUES (:id, :type, :name, :code, :metadata)
      ON DUPLICATE KEY UPDATE
        type = VALUES(type),
        name = VALUES(name),
        code = VALUES(code),
        metadata = VALUES(metadata),
        updated_at = NOW()
    `,
    payload,
  );

  const [rows] = await pool.query("SELECT * FROM languages WHERE id = :id LIMIT 1", { id });
  return normalizeLanguage(rows[0] || null);
}

async function deleteLanguage(id) {
  await pool.query("DELETE FROM languages WHERE id = :id", { id });
}

async function listDocumentTypes() {
  const [rows] = await pool.query("SELECT * FROM document_types ORDER BY created_at DESC");
  return rows.map(normalizeDocumentType);
}

async function saveDocumentType(data, existingId) {
  const id = existingId || data.id || makeId("doctype");
  const payload = {
    id,
    name: data.name || "Document Type",
    category: data.category || null,
    metadata: toJson(data.metadata || data),
  };

  await pool.query(
    `
      INSERT INTO document_types (id, name, category, metadata)
      VALUES (:id, :name, :category, :metadata)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        category = VALUES(category),
        metadata = VALUES(metadata),
        updated_at = NOW()
    `,
    payload,
  );

  const [rows] = await pool.query("SELECT * FROM document_types WHERE id = :id LIMIT 1", { id });
  return normalizeDocumentType(rows[0] || null);
}

async function deleteDocumentType(id) {
  await pool.query("DELETE FROM document_types WHERE id = :id", { id });
}

async function getProductConfig(productId) {
  const [rows] = await pool.query("SELECT * FROM product_configs WHERE product_id = :productId LIMIT 1", { productId });
  return normalizeProductConfig(rows[0] || null);
}

async function saveProductConfig(productId, config) {
  await pool.query(
    `
      INSERT INTO product_configs (product_id, config)
      VALUES (:productId, :config)
      ON DUPLICATE KEY UPDATE
        config = VALUES(config),
        updated_at = NOW()
    `,
    { productId, config: toJson(config || {}) },
  );

  return getProductConfig(productId);
}

async function listProductConfigs() {
  const [rows] = await pool.query("SELECT * FROM product_configs ORDER BY updated_at DESC");
  return rows.map(normalizeProductConfig);
}

async function getApiKeys() {
  const [rows] = await pool.query("SELECT * FROM api_keys ORDER BY created_at DESC");
  const apiKeys = {};
  rows.map(normalizeApiKey).forEach((row) => {
    apiKeys[row.keyName] = row.keyValue;
  });
  return apiKeys;
}

async function saveApiKeys(data) {
  const entries = Object.entries(data || {});
  for (const [keyName, keyValue] of entries) {
    await pool.query(
      `
        INSERT INTO api_keys (key_name, key_value)
        VALUES (:keyName, :keyValue)
        ON DUPLICATE KEY UPDATE
          key_value = VALUES(key_value),
          updated_at = NOW()
      `,
      { keyName, keyValue: toJson(keyValue) },
    );
  }

  return getApiKeys();
}

async function getPayment(paymentId) {
  const [rows] = await pool.query("SELECT * FROM payments WHERE payment_id = :paymentId LIMIT 1", { paymentId });
  return normalizePayment(rows[0] || null);
}

async function savePayment(data, existingId) {
  const id = existingId || data.id || makeId("payment");
  const payload = {
    id,
    order_id: data.orderId || data.order_id || null,
    payment_id: data.paymentId || data.payment_id || "",
    gateway: data.gateway || "razorpay",
    status: data.status || "pending",
    amount: Number(data.amount || 0),
    currency: data.currency || "INR",
    method: data.method || null,
    gateway_response: toJson(data.gatewayResponse || data.gateway_response || data.response || {}),
    metadata: toJson(data.metadata || data),
  };

  await pool.query(
    `
      INSERT INTO payments (
        id, order_id, payment_id, gateway, status, amount, currency, method, gateway_response, metadata
      )
      VALUES (
        :id, :order_id, :payment_id, :gateway, :status, :amount, :currency, :method, :gateway_response, :metadata
      )
      ON DUPLICATE KEY UPDATE
        order_id = VALUES(order_id),
        gateway = VALUES(gateway),
        status = VALUES(status),
        amount = VALUES(amount),
        currency = VALUES(currency),
        method = VALUES(method),
        gateway_response = VALUES(gateway_response),
        metadata = VALUES(metadata),
        updated_at = NOW()
    `,
    payload,
  );

  return getPayment(payload.payment_id);
}

async function dashboardStats() {
  const [ordersCountRows, customersCountRows, queriesCountRows, revenueRows] = await Promise.all([
    pool.query("SELECT COUNT(*) AS total FROM orders"),
    pool.query("SELECT COUNT(*) AS total FROM customers"),
    pool.query("SELECT COUNT(*) AS total FROM customer_queries"),
    pool.query("SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders"),
  ]);

  return {
    totalOrders: Number(ordersCountRows[0]?.total || 0),
    totalCustomers: Number(customersCountRows[0]?.total || 0),
    totalQueries: Number(queriesCountRows[0]?.total || 0),
    totalRevenue: Number(revenueRows[0]?.total || 0),
  };
}

async function clearCoreData() {
  await Promise.all([
    pool.query("DELETE FROM payments"),
    pool.query("DELETE FROM invoices"),
    pool.query("DELETE FROM api_keys"),
    pool.query("DELETE FROM product_configs"),
    pool.query("DELETE FROM languages"),
    pool.query("DELETE FROM document_types"),
    pool.query("DELETE FROM categories"),
    pool.query("DELETE FROM products"),
    pool.query("DELETE FROM order_items"),
    pool.query("DELETE FROM tracking"),
    pool.query("DELETE FROM orders"),
    pool.query("DELETE FROM customers"),
    pool.query("DELETE FROM customer_queries"),
    pool.query("DELETE FROM coupons"),
    pool.query("DELETE FROM reviews"),
    pool.query("DELETE FROM work_samples"),
    pool.query("DELETE FROM notifications"),
    pool.query("DELETE FROM subscribers"),
  ]);
}

// ---------------------------------------------------------------------------
// Cart & wishlist (backend-persisted, per user_id — replaces localStorage-only
// storage). item_data stores the same serializable shape the frontend already
// builds for localStorage (File objects stripped out before it gets here);
// product_id is the frontend item's `id` and is what the UNIQUE key dedupes
// on, so "add to cart" for an item already in the cart is just an update.
// ---------------------------------------------------------------------------

function normalizeCartItem(row) {
  if (!row) return null;
  const itemData = parseJson(row.item_data) || {};
  return {
    ...itemData,
    id: row.product_id,
  };
}

async function listCartItems(userId) {
  const [rows] = await pool.query(
    "SELECT * FROM cart_items WHERE user_id = :userId ORDER BY created_at ASC",
    { userId },
  );
  return rows.map(normalizeCartItem);
}

async function upsertCartItem(userId, item) {
  const productId = String(item?.id || "");
  if (!productId) {
    const error = new Error("Cart item requires an id");
    error.status = 400;
    throw error;
  }
  await pool.query(
    `
      INSERT INTO cart_items (user_id, product_id, item_data)
      VALUES (:userId, :productId, :itemData)
      ON DUPLICATE KEY UPDATE
        item_data = VALUES(item_data),
        updated_at = NOW()
    `,
    { userId, productId, itemData: toJson(item) },
  );
  return listCartItems(userId);
}

async function removeCartItem(userId, productId) {
  await pool.query(
    "DELETE FROM cart_items WHERE user_id = :userId AND product_id = :productId",
    { userId, productId },
  );
  return listCartItems(userId);
}

async function clearCartItems(userId) {
  await pool.query("DELETE FROM cart_items WHERE user_id = :userId", { userId });
  await pool.query("DELETE FROM cart_coupons WHERE user_id = :userId", { userId });
}

function normalizeCartCoupon(row) {
  if (!row) return null;
  return {
    code: row.code,
    discountValue: Number(row.discount_value),
    discountType: row.discount_type,
  };
}

async function getCartCoupon(userId) {
  const [rows] = await pool.query(
    "SELECT * FROM cart_coupons WHERE user_id = :userId LIMIT 1",
    { userId },
  );
  return normalizeCartCoupon(rows[0] || null);
}

async function setCartCoupon(userId, { code, discountValue, discountType }) {
  await pool.query(
    `
      INSERT INTO cart_coupons (user_id, code, discount_value, discount_type)
      VALUES (:userId, :code, :discountValue, :discountType)
      ON DUPLICATE KEY UPDATE
        code = VALUES(code),
        discount_value = VALUES(discount_value),
        discount_type = VALUES(discount_type),
        updated_at = NOW()
    `,
    { userId, code, discountValue: Number(discountValue || 0), discountType: discountType || "fixed" },
  );
  return getCartCoupon(userId);
}

async function removeCartCoupon(userId) {
  await pool.query("DELETE FROM cart_coupons WHERE user_id = :userId", { userId });
}

function normalizeWishlistItem(row) {
  if (!row) return null;
  const itemData = parseJson(row.item_data) || {};
  return {
    ...itemData,
    id: row.product_id,
  };
}

async function listWishlistItems(userId) {
  const [rows] = await pool.query(
    "SELECT * FROM wishlist_items WHERE user_id = :userId ORDER BY created_at ASC",
    { userId },
  );
  return rows.map(normalizeWishlistItem);
}

async function addWishlistItem(userId, item) {
  const productId = String(item?.id || "");
  if (!productId) {
    const error = new Error("Wishlist item requires an id");
    error.status = 400;
    throw error;
  }
  // ON DUPLICATE KEY here is a no-op update rather than an error, matching
  // the frontend's existing "already in wishlist? do nothing" behavior.
  await pool.query(
    `
      INSERT INTO wishlist_items (user_id, product_id, item_data)
      VALUES (:userId, :productId, :itemData)
      ON DUPLICATE KEY UPDATE item_data = item_data
    `,
    { userId, productId, itemData: toJson(item) },
  );
  return listWishlistItems(userId);
}

async function removeWishlistItem(userId, productId) {
  await pool.query(
    "DELETE FROM wishlist_items WHERE user_id = :userId AND product_id = :productId",
    { userId, productId },
  );
  return listWishlistItems(userId);
}

module.exports = {
  now,
  makeId,
  listProducts,
  listCategories,
  getProduct,
  saveProduct,
  deleteProduct,
  listCustomers,
  getCustomer,
  upsertCustomer,
  deleteCustomer,
  listQueries,
  saveQuery,
  getQuery,
  updateQueryStatus,
  deleteQuery,
  listReviews,
  getReview,
  saveReview,
  voteReview,
  deleteReview,
  listOrders,
  getOrder,
  saveOrder,
  createOrderWithCustomer,
  listCartItems,
  upsertCartItem,
  removeCartItem,
  clearCartItems,
  getCartCoupon,
  setCartCoupon,
  removeCartCoupon,
  listWishlistItems,
  addWishlistItem,
  removeWishlistItem,
  deleteOrder,
  updateOrderStatus,
  updateOrderEmailStatus,
  updateOrderPaymentStatus,
  updateOrderNotes,
  updateOrderCompletedFile,
  getTracking,
  saveTracking,
  listCoupons,
  getCoupon,
  saveCoupon,
  deleteCoupon,
  listSubscribers,
  saveSubscriber,
  deleteSubscriber,
  listWorkSamples,
  getWorkSample,
  saveWorkSample,
  deleteWorkSample,
  listNotifications,
  saveNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  listLanguages,
  saveLanguage,
  deleteLanguage,
  listDocumentTypes,
  saveDocumentType,
  deleteDocumentType,
  getProductConfig,
  saveProductConfig,
  listProductConfigs,
  getApiKeys,
  saveApiKeys,
  getPayment,
  savePayment,
  dashboardStats,
  clearCoreData,
};