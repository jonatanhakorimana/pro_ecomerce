import express from "express";
import { randomUUID } from "node:crypto";
import { getPool, query } from "./db.js";
import {
  initializeFlutterwavePayment,
  normalizeRwandaMobileMoneyPhone,
  initializeRwandaMobileMoneyPayment,
  verifyFlutterwaveTransaction,
  verifyWebhookSignature
} from "./payments/flutterwave.js";
import {
  createToken,
  hashPassword,
  isLegacyPasswordHash,
  optionalAuth,
  requireAdmin,
  requireAuth,
  verifyPassword
} from "./security.js";

const taxRate = 0.08;
const standardShipping = 8.99;
const expressShipping = 15;
const freeShippingThreshold = 100;

function route(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function parseJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || `item-${Date.now()}`;
}

function mapUser(row) {
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone || "",
    address: row.address || "",
    city: row.city || "",
    zipCode: row.zipCode || "",
    country: row.country || "",
    createdAt: row.createdAt
  };
}

function mapCategory(row) {
  return {
    id: Number(row.id),
    name: row.name,
    slug: row.slug,
    description: row.description || "",
    image: row.image || "",
    icon: row.icon || "Package",
    itemCount: Number(row.itemCount || 0),
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt
  };
}

function mapProduct(row) {
  return {
    id: Number(row.id),
    categoryId: Number(row.categoryId),
    categoryName: row.categoryName || "",
    name: row.name,
    slug: row.slug,
    description: row.description || "",
    shortDescription: row.shortDescription || "",
    price: Number(row.price),
    ...(row.discountPrice == null ? {} : { discountPrice: Number(row.discountPrice) }),
    stockQuantity: Number(row.stockQuantity),
    sku: row.sku,
    rating: Number(row.rating || 0),
    reviewCount: Number(row.reviewCount || 0),
    image: row.image || "",
    gallery: parseJson(row.gallery, []),
    tags: parseJson(row.tags, []),
    isFeatured: Boolean(row.isFeatured),
    isActive: Boolean(row.isActive),
    ...(row.specifications == null ? {} : { specifications: parseJson(row.specifications, {}) }),
    createdAt: row.createdAt
  };
}

const productSelect = `
  SELECT p.id, p.category_id AS categoryId, c.name AS categoryName, p.name, p.slug,
    p.description, p.short_description AS shortDescription, p.price,
    p.discount_price AS discountPrice, p.stock_quantity AS stockQuantity, p.sku,
    COALESCE(AVG(r.rating), 0) AS rating, COUNT(r.id) AS reviewCount,
    p.image, p.gallery, p.tags, p.specifications, p.is_featured AS isFeatured,
    p.is_active AS isActive, p.created_at AS createdAt
  FROM products p
  JOIN categories c ON c.id = p.category_id
  LEFT JOIN reviews r ON r.product_id = p.id`;

async function getProduct(id, includeInactive = false) {
  const [row] = await query(
    `${productSelect} WHERE p.id = ? ${includeInactive ? "" : "AND p.is_active = 1"} GROUP BY p.id`,
    [id]
  );
  return row ? mapProduct(row) : null;
}

async function getOrder(id, connection = getPool()) {
  const [rows] = await connection.execute(
    `SELECT id, order_number AS orderNumber, tracking_number AS trackingNumber,
      user_id AS userId, customer_name AS customerName, customer_email AS customerEmail,
      customer_phone AS customerPhone, shipping_address AS shippingAddress,
      shipping_method AS shippingMethod, payment_method AS paymentMethod,
      payment_status AS paymentStatus, shipping_status AS shippingStatus,
      subtotal, discount, tax, shipping_fee AS shippingFee,
      total_amount AS totalAmount, notes, created_at AS createdAt, updated_at AS updatedAt
     FROM orders WHERE id = ?`,
    [id]
  );
  if (!rows[0]) return null;
  const row = rows[0];
  const [items] = await connection.execute(
    `SELECT id, order_id AS orderId, product_id AS productId, product_name AS productName,
      product_image AS productImage, price, quantity, total
     FROM order_items WHERE order_id = ? ORDER BY id`,
    [id]
  );
  return {
    ...row,
    id: Number(row.id),
    userId: row.userId == null ? 0 : Number(row.userId),
    shippingAddress: parseJson(row.shippingAddress, {}),
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    tax: Number(row.tax),
    shippingFee: Number(row.shippingFee),
    totalAmount: Number(row.totalAmount),
    items: items.map((item) => ({
      ...item,
      id: Number(item.id),
      orderId: Number(item.orderId),
      productId: item.productId == null ? 0 : Number(item.productId),
      price: Number(item.price),
      quantity: Number(item.quantity),
      total: Number(item.total)
    }))
  };
}

async function findCoupon(code, subtotal) {
  if (!code) return null;
  const [coupon] = await query(
    `SELECT code, discount_type AS discountType, discount_value AS discountValue,
      min_spend AS minSpend, description, is_active AS isActive
     FROM coupons WHERE code = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > NOW())`,
    [String(code).trim().toUpperCase()]
  );
  if (!coupon || subtotal < Number(coupon.minSpend)) return null;
  return {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: Number(coupon.discountValue),
    minSpend: Number(coupon.minSpend),
    description: coupon.description,
    isActive: Boolean(coupon.isActive)
  };
}

function calculateTotals(subtotal, coupon, shippingMethod = "Standard Ground") {
  const discount = coupon
    ? Math.min(subtotal, coupon.discountType === "percentage"
      ? subtotal * Number(coupon.discountValue) / 100
      : Number(coupon.discountValue))
    : 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = taxableAmount * taxRate;
  const shippingFee = shippingMethod.startsWith("Express")
    ? expressShipping
    : subtotal >= freeShippingThreshold ? 0 : standardShipping;
  return {
    subtotal: roundMoney(subtotal),
    discount: roundMoney(discount),
    tax: roundMoney(tax),
    shippingFee,
    total: roundMoney(taxableAmount + tax + shippingFee)
  };
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function getPublicAppUrl(req) {
  return (process.env.APP_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
}

function getSessionId(req) {
  const sessionId = req.body?.sessionId || req.query.sessionId;
  if (typeof sessionId !== "string" || !/^guest_[a-zA-Z0-9_-]{8,100}$/.test(sessionId)) {
    throw httpError(400, "A valid guest session ID is required.");
  }
  return sessionId;
}

async function ensureCart(req, connection = getPool()) {
  if (req.user) {
    await connection.execute("INSERT IGNORE INTO carts (user_id) VALUES (?)", [req.user.id]);
    const [rows] = await connection.execute("SELECT id FROM carts WHERE user_id = ?", [req.user.id]);
    return Number(rows[0].id);
  }
  const sessionId = getSessionId(req);
  await connection.execute("INSERT IGNORE INTO carts (session_id) VALUES (?)", [sessionId]);
  const [rows] = await connection.execute("SELECT id FROM carts WHERE session_id = ?", [sessionId]);
  return Number(rows[0].id);
}

async function getCartResponse(req, couponCode) {
  const cartId = await ensureCart(req);
  const rows = await query(
    `SELECT ci.id, ci.product_id AS productId, ci.quantity,
      p.price AS basePrice, p.discount_price AS discountPrice,
      p.id AS pId, p.category_id AS categoryId, c.name AS categoryName, p.name, p.slug,
      p.description, p.short_description AS shortDescription, p.stock_quantity AS stockQuantity,
      p.sku, COALESCE(AVG(r.rating), 0) AS rating, COUNT(r.id) AS reviewCount,
      p.image, p.gallery, p.tags, p.specifications, p.is_featured AS isFeatured,
      p.is_active AS isActive, p.created_at AS createdAt
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     JOIN categories c ON c.id = p.category_id
     LEFT JOIN reviews r ON r.product_id = p.id
     WHERE ci.cart_id = ? AND p.is_active = 1
     GROUP BY ci.id, p.id ORDER BY ci.id`,
    [cartId]
  );
  const items = rows.map((row) => {
    const product = mapProduct({ ...row, id: row.pId, price: row.basePrice });
    const price = Number(row.discountPrice ?? row.basePrice);
    return { id: Number(row.id), productId: Number(row.productId), product, quantity: Number(row.quantity), price };
  });
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const coupon = await findCoupon(couponCode, subtotal);
  const totals = calculateTotals(subtotal, coupon);
  return {
    id: cartId,
    ...(req.user ? { userId: Number(req.user.id) } : {}),
    items,
    ...totals,
    ...(coupon ? { appliedCoupon: coupon.code } : {})
  };
}

async function transaction(callback) {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function orderTrackingEvents(order) {
  const statuses = ["pending", "processing", "shipped", "delivered"];
  const currentIndex = statuses.indexOf(order.shippingStatus);
  return statuses.map((status, index) => ({
    status,
    date: index === currentIndex ? order.updatedAt : order.createdAt,
    location: index < 2 ? "Shop Eazy Fulfillment Center" : "In transit",
    completed: currentIndex >= 0 && index <= currentIndex
  }));
}

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  app.use((req, res, next) => {
    const origin = req.get("origin");
    const allowedOrigins = (process.env.CORS_ORIGIN || "").split(",").map((value) => value.trim()).filter(Boolean);
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    }
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
  app.use(optionalAuth);

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.get("/api/payments/flutterwave/callback", route(async (req, res) => {
    const orderNumber = String(req.query.tx_ref || "");
    const transactionId = String(req.query.transaction_id || "");
    const [order] = await query(
      `SELECT id, order_number AS orderNumber, total_amount AS totalAmount, payment_method AS paymentMethod
       FROM orders WHERE order_number = ?`,
      [orderNumber]
    );
    let paymentSucceeded = false;
    if (order && req.query.status === "successful" && order.paymentMethod === "Flutterwave") {
      paymentSucceeded = await verifyFlutterwaveTransaction({
        transactionId,
        orderNumber: order.orderNumber,
        amount: Number(order.totalAmount),
        currency: "USD",
        secretKey: process.env.FLW_SECRET_KEY
      });
    }
    if (order) {
      await query("UPDATE orders SET payment_status = ? WHERE id = ? AND payment_status = 'pending'", [
        paymentSucceeded ? "paid" : "failed",
        order.id
      ]);
    }
    res.redirect(`${getPublicAppUrl(req)}/?payment=${paymentSucceeded ? "success" : "failed"}`);
  }));

  app.post("/api/payments/flutterwave/webhook", route(async (req, res) => {
    if (!verifyWebhookSignature(req.get("verif-hash"), process.env.FLW_WEBHOOK_SECRET_HASH)) {
      throw httpError(401, "Invalid payment webhook signature.");
    }
    const transactionData = req.body?.data;
    if (req.body?.event !== "charge.completed" || !transactionData?.id || !transactionData?.tx_ref) {
      return res.sendStatus(200);
    }
    const [order] = await query(
      `SELECT id, order_number AS orderNumber, total_amount AS totalAmount, payment_method AS paymentMethod
       FROM orders WHERE order_number = ?`,
      [String(transactionData.tx_ref)]
    );
    const rate = Number(process.env.USD_TO_RWF_RATE);
    if (!order || !["MTN Rwanda", "Airtel Rwanda"].includes(order.paymentMethod) || !Number.isFinite(rate) || rate <= 0) {
      return res.sendStatus(200);
    }
    const paymentSucceeded = await verifyFlutterwaveTransaction({
      transactionId: transactionData.id,
      orderNumber: order.orderNumber,
      amount: Math.round(Number(order.totalAmount) * rate),
      currency: "RWF",
      secretKey: process.env.FLW_SECRET_KEY
    });
    if (paymentSucceeded) {
      await query("UPDATE orders SET payment_status = 'paid' WHERE id = ? AND payment_status = 'pending'", [order.id]);
    }
    res.sendStatus(200);
  }));

  app.post("/api/auth/register", route(async (req, res) => {
    const { name, email, password, phone, address, city, zipCode } = req.body || {};
    if (!String(name || "").trim() || !/^\S+@\S+\.\S+$/.test(String(email || "")) || String(password || "").length < 8) {
      throw httpError(400, "Provide a name, valid email, and password of at least 8 characters.");
    }
    const passwordHash = await hashPassword(password);
    const normalizedEmail = email.trim().toLowerCase();
    const result = await getPool().execute(
      `INSERT INTO users (name, email, password_hash, phone, address, city, zip_code)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), normalizedEmail, passwordHash, phone || "", address || "", city || "", zipCode || ""]
    ).catch((error) => {
      if (error.code === "ER_DUP_ENTRY") throw httpError(409, "An account with this email already exists.");
      throw error;
    });
    const [rows] = await getPool().execute(
      `SELECT id, name, email, 'customer' AS role, phone, address, city, zip_code AS zipCode,
        country, created_at AS createdAt FROM users WHERE id = ?`,
      [result[0].insertId]
    );
    const user = mapUser(rows[0]);
    res.status(201).json({ status: "success", message: "Account created successfully.", token: createToken(user), user });
  }));

  app.post("/api/auth/login", route(async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const isAdminLogin = req.body?.role === "admin";
    const table = isAdminLogin ? "admins" : "users";
    const role = isAdminLogin ? "admin" : "customer";
    const [rows] = await getPool().execute(
      `SELECT id, name, email, '${role}' AS role, password_hash AS passwordHash, phone, address,
        city, zip_code AS zipCode, country, created_at AS createdAt FROM ${table} WHERE email = ?`,
      [email]
    );
    const row = rows[0];
    if (!row || !(await verifyPassword(password, row.passwordHash))) {
      throw httpError(401, "Email or password is incorrect.");
    }
    if (isLegacyPasswordHash(row.passwordHash)) {
      const upgradedHash = await hashPassword(password);
      await getPool().execute(
        `UPDATE ${table} SET password_hash = ? WHERE id = ? AND password_hash = ?`,
        [upgradedHash, row.id, row.passwordHash]
      );
    }
    const user = mapUser(row);
    res.json({ status: "success", message: "Logged in successfully.", token: createToken(user), user });
  }));

  app.get("/api/auth/me", requireAuth, (req, res) => res.json({ status: "success", user: mapUser(req.user) }));

  app.put("/api/auth/profile", requireAuth, route(async (req, res) => {
    const fields = { name: "name", phone: "phone", address: "address", city: "city", zipCode: "zip_code", country: "country" };
    const updates = Object.entries(fields).filter(([key]) => req.body?.[key] !== undefined);
    const table = req.user.role === "admin" ? "admins" : "users";
    if (updates.length) {
      const assignments = updates.map(([, column]) => `\`${column}\` = ?`).join(", ");
      await getPool().execute(
        `UPDATE ${table} SET ${assignments} WHERE id = ?`,
        [...updates.map(([key]) => req.body[key]), req.user.id]
      );
    }
    const [rows] = await getPool().execute(
      `SELECT id, name, email, '${req.user.role}' AS role, phone, address, city, zip_code AS zipCode,
        country, created_at AS createdAt FROM ${table} WHERE id = ?`,
      [req.user.id]
    );
    res.json({ status: "success", message: "Profile updated.", user: mapUser(rows[0]) });
  }));

  app.get("/api/categories", route(async (_req, res) => {
    const rows = await query(
      `SELECT c.id, c.name, c.slug, c.description, c.image, c.icon, c.is_active AS isActive,
        c.created_at AS createdAt, COUNT(p.id) AS itemCount
       FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
       WHERE c.is_active = 1 GROUP BY c.id ORDER BY c.name`
    );
    res.json({ status: "success", data: rows.map(mapCategory) });
  }));

  app.get("/api/products", route(async (req, res) => {
    const conditions = ["p.is_active = 1", "c.is_active = 1"];
    const values = [];
    const search = String(req.query.search || "").trim();
    if (search) {
      const pattern = `%${search}%`;
      conditions.push("(p.name LIKE ? OR p.description LIKE ? OR p.tags LIKE ? OR p.sku LIKE ?)");
      values.push(pattern, pattern, pattern, pattern);
    }
    if (req.query.category && req.query.category !== "all") {
      const category = String(req.query.category);
      conditions.push("(CAST(c.id AS CHAR) = ? OR c.slug = ?)");
      values.push(category, category);
    }
    if (req.query.minPrice !== undefined) {
      conditions.push("COALESCE(p.discount_price, p.price) >= ?");
      values.push(Number(req.query.minPrice) || 0);
    }
    if (req.query.maxPrice !== undefined) {
      conditions.push("COALESCE(p.discount_price, p.price) <= ?");
      values.push(Number(req.query.maxPrice) || 0);
    }
    if (req.query.inStock === "true") conditions.push("p.stock_quantity > 0");
    if (req.query.featured === "true") conditions.push("p.is_featured = 1");
    const sort = {
      "price-asc": "COALESCE(p.discount_price, p.price) ASC",
      "price-desc": "COALESCE(p.discount_price, p.price) DESC",
      rating: "rating DESC",
      newest: "p.created_at DESC"
    }[req.query.sort] || "p.is_featured DESC, p.created_at DESC";
    const rows = await query(
      `${productSelect} WHERE ${conditions.join(" AND ")} GROUP BY p.id ORDER BY ${sort}`,
      values
    );
    res.json({ status: "success", total: rows.length, data: rows.map(mapProduct) });
  }));

  app.get("/api/products/:id", route(async (req, res) => {
    const product = await getProduct(Number(req.params.id));
    if (!product) throw httpError(404, "Product not found.");
    const reviews = await query(
      `SELECT r.id, r.product_id AS productId, r.user_id AS userId, u.name AS userName,
        r.rating, r.comment, r.created_at AS createdAt
       FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.product_id = ? ORDER BY r.created_at DESC`,
      [product.id]
    );
    const relatedRows = await query(
      `${productSelect} WHERE p.category_id = ? AND p.id <> ? AND p.is_active = 1 GROUP BY p.id ORDER BY p.is_featured DESC LIMIT 4`,
      [product.categoryId, product.id]
    );
    res.json({ status: "success", data: { ...product, reviews: reviews.map((review) => ({ ...review, id: Number(review.id), productId: Number(review.productId), userId: Number(review.userId), rating: Number(review.rating) })), relatedProducts: relatedRows.map(mapProduct) } });
  }));

  app.post("/api/products/:id/reviews", requireAuth, route(async (req, res) => {
    const productId = Number(req.params.id);
    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment || "").trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment) throw httpError(400, "Provide a rating from 1 to 5 and a review comment.");
    await getPool().execute(
      `INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)`,
      [productId, req.user.id, rating, comment]
    );
    const product = await getProduct(productId);
    if (!product) throw httpError(404, "Product not found.");
    const [review] = await query(
      `SELECT r.id, r.product_id AS productId, r.user_id AS userId, u.name AS userName,
        r.rating, r.comment, r.created_at AS createdAt FROM reviews r JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ? AND r.user_id = ?`,
      [productId, req.user.id]
    );
    res.status(201).json({ status: "success", message: "Review saved.", data: review, productRating: product.rating, productReviewCount: product.reviewCount });
  }));

  app.get("/api/cart", route(async (req, res) => {
    res.json({ status: "success", data: await getCartResponse(req, req.query.coupon) });
  }));

  app.post("/api/cart/items", route(async (req, res) => {
    const productId = Number(req.body?.productId);
    const quantity = Number(req.body?.quantity ?? 1);
    if (!Number.isInteger(productId) || productId < 1 || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw httpError(400, "Product and quantity are invalid.");
    }
    const cartId = await ensureCart(req);
    await transaction(async (connection) => {
      const [products] = await connection.execute("SELECT stock_quantity AS stockQuantity FROM products WHERE id = ? AND is_active = 1 FOR UPDATE", [productId]);
      if (!products[0]) throw httpError(404, "Product not found.");
      const [existing] = await connection.execute("SELECT quantity FROM cart_items WHERE cart_id = ? AND product_id = ?", [cartId, productId]);
      if (Number(existing[0]?.quantity || 0) + quantity > Number(products[0].stockQuantity)) throw httpError(409, "There is not enough stock for that quantity.");
      await connection.execute(
        `INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
        [cartId, productId, quantity]
      );
    });
    res.status(201).json({ status: "success", message: "Item added to cart.", data: await getCartResponse(req) });
  }));

  app.put("/api/cart/items/:id", route(async (req, res) => {
    const quantity = Number(req.body?.quantity);
    const cartId = await ensureCart(req);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw httpError(400, "Quantity must be between 1 and 99.");
    const [items] = await query(
      `SELECT ci.product_id AS productId, p.stock_quantity AS stockQuantity
       FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.id = ? AND ci.cart_id = ?`,
      [req.params.id, cartId]
    );
    if (!items[0]) throw httpError(404, "Cart item not found.");
    if (quantity > Number(items[0].stockQuantity)) throw httpError(409, "There is not enough stock for that quantity.");
    await query("UPDATE cart_items SET quantity = ? WHERE id = ?", [quantity, req.params.id]);
    res.json({ status: "success", data: await getCartResponse(req) });
  }));

  app.delete("/api/cart/items/:id", route(async (req, res) => {
    const cartId = await ensureCart(req);
    await query("DELETE FROM cart_items WHERE id = ? AND cart_id = ?", [req.params.id, cartId]);
    res.json({ status: "success", message: "Item removed.", data: await getCartResponse(req) });
  }));

  app.delete("/api/cart/clear", route(async (req, res) => {
    const cartId = await ensureCart(req);
    await query("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);
    res.json({ status: "success", message: "Cart cleared.", data: await getCartResponse(req) });
  }));

  app.post("/api/coupons/validate", route(async (req, res) => {
    const subtotal = Number(req.body?.subtotal);
    if (!Number.isFinite(subtotal) || subtotal < 0) throw httpError(400, "A valid subtotal is required.");
    const coupon = await findCoupon(req.body?.code, subtotal);
    if (!coupon) throw httpError(400, "Coupon is invalid, expired, or does not meet the minimum spend.");
    res.json({ status: "success", message: "Coupon applied.", data: coupon });
  }));

  app.post("/api/orders", route(async (req, res) => {
    const body = req.body || {};
    const email = String(body.customerEmail || "").trim().toLowerCase();
    const address = body.shippingAddress || {};
    const requestedItems = Array.isArray(body.items) ? body.items : [];
    const paymentMethod = String(body.paymentMethod || "Cash on Delivery");
    const mobileMoneyMethods = ["MTN Rwanda", "Airtel Rwanda"];
    if (!String(body.customerName || "").trim() || !/^\S+@\S+\.\S+$/.test(email) || !address.street || !address.city || !address.zipCode || !requestedItems.length) {
      throw httpError(400, "Order contact, shipping address, and at least one item are required.");
    }
    if (!["Flutterwave", "Cash on Delivery", ...mobileMoneyMethods].includes(paymentMethod)) {
      throw httpError(400, "The selected payment method is not supported.");
    }
    const isMobileMoney = mobileMoneyMethods.includes(paymentMethod);
    const mobileMoneyPhone = isMobileMoney ? normalizeRwandaMobileMoneyPhone(body.customerPhone) : null;
    if (isMobileMoney && !mobileMoneyPhone) {
      throw httpError(400, `Enter a valid ${paymentMethod === "MTN Rwanda" ? "MTN" : "Airtel"} Rwanda phone number.`);
    }
    const usdToRwfRate = Number(process.env.USD_TO_RWF_RATE);
    if (isMobileMoney && (!Number.isFinite(usdToRwfRate) || usdToRwfRate <= 0)) {
      throw httpError(503, "Rwanda Mobile Money is not configured. Set USD_TO_RWF_RATE on the server.");
    }
    const orderResult = await transaction(async (connection) => {
      const items = [];
      let subtotal = 0;
      for (const requested of requestedItems) {
        const productId = Number(requested.productId);
        const quantity = Number(requested.quantity);
        if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw httpError(400, "An order item is invalid.");
        const [products] = await connection.execute(
          `SELECT id, name, image, price, discount_price AS discountPrice, stock_quantity AS stockQuantity
           FROM products WHERE id = ? AND is_active = 1 FOR UPDATE`,
          [productId]
        );
        const product = products[0];
        if (!product) throw httpError(404, "A product in this order is no longer available.");
        if (quantity > Number(product.stockQuantity)) throw httpError(409, `Not enough stock for ${product.name}.`);
        const price = Number(product.discountPrice ?? product.price);
        const total = roundMoney(price * quantity);
        subtotal += total;
        items.push({ productId, productName: product.name, productImage: product.image || "", price, quantity, total });
        await connection.execute("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?", [quantity, productId]);
      }
      subtotal = roundMoney(subtotal);
      const coupon = await findCoupon(body.couponCode, subtotal);
      const totals = calculateTotals(subtotal, coupon);
      const orderNumber = `SE-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;
      const trackingNumber = `TRK-${randomUUID().replaceAll("-", "").slice(0, 14).toUpperCase()}`;
      const [result] = await connection.execute(
        `INSERT INTO orders (order_number, tracking_number, user_id, customer_name, customer_email,
          customer_phone, shipping_address, shipping_method, payment_method, subtotal, discount,
          tax, shipping_fee, total_amount, coupon_code, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderNumber, trackingNumber, req.user?.id || null, body.customerName.trim(), email,
          body.customerPhone || "", JSON.stringify(address), body.shippingMethod || "Standard Ground",
          paymentMethod, totals.subtotal, totals.discount, totals.tax,
          totals.shippingFee, totals.total, coupon?.code || null, body.notes || null]
      );
      await connection.execute(
        `INSERT INTO order_status_history (order_id, shipping_status, tracking_number, location, note)
         VALUES (?, 'pending', ?, 'Shop Eazy fulfillment center', 'Order received')`,
        [result.insertId, trackingNumber]
      );
      for (const item of items) {
        await connection.execute(
          `INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity, total)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [result.insertId, item.productId, item.productName, item.productImage, item.price, item.quantity, item.total]
        );
      }
      const order = await getOrder(result.insertId, connection);
      let paymentUrl;
      if (paymentMethod === "Flutterwave") {
        paymentUrl = await initializeFlutterwavePayment({
          order: { ...order, total: order.totalAmount },
          customer: { name: order.customerName, email: order.customerEmail, phone: order.customerPhone },
          callbackUrl: `${getPublicAppUrl(req)}/api/payments/flutterwave/callback`,
          secretKey: process.env.FLW_SECRET_KEY
        });
      } else if (isMobileMoney) {
        paymentUrl = await initializeRwandaMobileMoneyPayment({
          order,
          customer: { name: order.customerName, email: order.customerEmail },
          phoneNumber: mobileMoneyPhone,
          provider: paymentMethod,
          amountRwf: Math.round(order.totalAmount * usdToRwfRate),
          secretKey: process.env.FLW_SECRET_KEY
        });
      }
      const [carts] = await connection.execute(
        req.user ? "SELECT id FROM carts WHERE user_id = ?" : "SELECT id FROM carts WHERE session_id = ?",
        [req.user ? req.user.id : getSessionId(req)]
      );
      if (carts[0]) await connection.execute("DELETE FROM cart_items WHERE cart_id = ?", [carts[0].id]);
      return { order, paymentUrl };
    });
    res.status(201).json({
      status: "success",
      message: "Order placed successfully.",
      order: orderResult.order,
      ...(orderResult.paymentUrl ? { paymentUrl: orderResult.paymentUrl } : {})
    });
  }));

  app.get("/api/orders", route(async (req, res) => {
    const email = req.user?.role === "admin"
      ? String(req.query.email || "").trim().toLowerCase()
      : req.user?.email;
    if (!email) throw httpError(401, "Sign in to view your orders.");
    const rows = await query("SELECT id FROM orders WHERE customer_email = ? ORDER BY created_at DESC", [email]);
    const orders = await Promise.all(rows.map((row) => getOrder(row.id)));
    res.json({ status: "success", total: orders.length, data: orders });
  }));

  app.get("/api/orders/track/:trackingNumber", route(async (req, res) => {
    const [rows] = await query("SELECT id FROM orders WHERE tracking_number = ?", [req.params.trackingNumber]);
    if (!rows) throw httpError(404, "Tracking number not found.");
    const order = await getOrder(rows.id);
    const events = await query(
      `SELECT shipping_status AS shippingStatus, location, note, created_at AS createdAt
       FROM order_status_history WHERE order_id = ? ORDER BY created_at, id`,
      [rows.id]
    );
    res.json({
      status: "success",
      data: {
        order,
        trackingEvents: events.map((event) => ({
          status: event.shippingStatus,
          date: event.createdAt,
          location: event.location,
          note: event.note || "",
          completed: true
        }))
      }
    });
  }));

  app.get("/api/orders/:id", requireAuth, route(async (req, res) => {
    const order = await getOrder(Number(req.params.id));
    if (!order) throw httpError(404, "Order not found.");
    if (req.user.role !== "admin" && order.customerEmail !== req.user.email) throw httpError(403, "You cannot view this order.");
    res.json({ status: "success", data: order });
  }));

  app.get("/api/admin/dashboard", requireAdmin, route(async (_req, res) => {
    const [[summary]] = await getPool().query(
      `SELECT COALESCE(SUM(total_amount), 0) AS totalRevenue, COUNT(*) AS totalOrders,
        COUNT(DISTINCT user_id) AS totalCustomers, COALESCE(AVG(total_amount), 0) AS averageOrderValue,
        SUM(shipping_status = 'pending') AS pendingOrdersCount FROM orders WHERE shipping_status <> 'cancelled'`
    );
    const [[inventory]] = await getPool().query("SELECT SUM(stock_quantity <= 10 AND is_active = 1) AS lowStockCount FROM products");
    const recentRows = await query("SELECT id FROM orders ORDER BY created_at DESC LIMIT 6");
    const recentOrders = await Promise.all(recentRows.map((row) => getOrder(row.id)));
    const topProducts = await query(
      `SELECT p.id, p.name, c.name AS categoryName, p.price, SUM(oi.quantity) AS unitsSold,
        SUM(oi.total) AS revenue, p.image FROM order_items oi JOIN products p ON p.id = oi.product_id
        JOIN categories c ON c.id = p.category_id GROUP BY p.id ORDER BY unitsSold DESC LIMIT 5`
    );
    const salesByCategory = await query(
      `SELECT c.name AS category, COALESCE(SUM(oi.total), 0) AS revenue FROM categories c
        LEFT JOIN products p ON p.category_id = c.id LEFT JOIN order_items oi ON oi.product_id = p.id
        GROUP BY c.id ORDER BY revenue DESC`
    );
    const monthlySales = await query(
      `SELECT DATE_FORMAT(created_at, '%b') AS month, SUM(total_amount) AS revenue, COUNT(*) AS orders
        FROM orders WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 5 MONTH)
          AND shipping_status <> 'cancelled' GROUP BY YEAR(created_at), MONTH(created_at), DATE_FORMAT(created_at, '%b')
        ORDER BY YEAR(created_at), MONTH(created_at)`
    );
    const totalRevenue = Number(summary.totalRevenue);
    const totalOrders = Number(summary.totalOrders);
    const totalCustomers = Number(summary.totalCustomers);
    res.json({ status: "success", data: {
      totalRevenue,
      revenueGrowth: 0,
      totalOrders,
      ordersGrowth: 0,
      totalCustomers,
      customersGrowth: 0,
      averageOrderValue: Number(summary.averageOrderValue),
      lowStockCount: Number(inventory.lowStockCount || 0),
      pendingOrdersCount: Number(summary.pendingOrdersCount || 0),
      recentOrders,
      topProducts: topProducts.map((row) => ({ ...row, id: Number(row.id), price: Number(row.price), unitsSold: Number(row.unitsSold), revenue: Number(row.revenue) })),
      salesByCategory: salesByCategory.map((row) => {
        const revenue = Number(row.revenue);
        return { category: row.category, revenue, percentage: totalRevenue ? roundMoney(revenue / totalRevenue * 100) : 0 };
      }),
      monthlySales: monthlySales.map((row) => ({ month: row.month, revenue: Number(row.revenue), orders: Number(row.orders) }))
    } });
  }));

  app.get("/api/admin/products", requireAdmin, route(async (_req, res) => {
    const rows = await query(`${productSelect} GROUP BY p.id ORDER BY p.created_at DESC`);
    res.json({ status: "success", total: rows.length, data: rows.map(mapProduct) });
  }));

  app.post("/api/admin/products", requireAdmin, route(async (req, res) => {
    const body = req.body || {};
    const name = String(body.name || "").trim();
    const categoryId = Number(body.categoryId);
    const price = Number(body.price);
    if (!name || !Number.isInteger(categoryId) || !Number.isFinite(price) || price < 0) throw httpError(400, "Product name, category, and a valid price are required.");
    const sku = String(body.sku || `SKU-${randomUUID().slice(0, 8)}`).trim();
    const slug = `${slugify(body.slug || name)}-${randomUUID().slice(0, 6)}`;
    const [result] = await getPool().execute(
      `INSERT INTO products (category_id, name, slug, description, short_description, price,
        discount_price, stock_quantity, sku, image, gallery, tags, specifications, is_featured, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [categoryId, name, slug, body.description || name, body.shortDescription || "",
        price, body.discountPrice == null ? null : Number(body.discountPrice), Math.max(0, Number(body.stockQuantity) || 0),
        sku, body.image || "", JSON.stringify(body.gallery || []), JSON.stringify(body.tags || []),
        body.specifications ? JSON.stringify(body.specifications) : null, Boolean(body.isFeatured), body.isActive === false ? 0 : 1]
    );
    res.status(201).json({ status: "success", message: "Product created.", data: await getProduct(result.insertId, true) });
  }));

  app.put("/api/admin/products/:id", requireAdmin, route(async (req, res) => {
    const current = await getProduct(Number(req.params.id), true);
    if (!current) throw httpError(404, "Product not found.");
    const body = req.body || {};
    const fields = {
      categoryId: ["category_id", Number], name: ["name", String], description: ["description", String],
      shortDescription: ["short_description", String], price: ["price", Number],
      discountPrice: ["discount_price", (value) => value == null || value === "" ? null : Number(value)],
      stockQuantity: ["stock_quantity", (value) => Math.max(0, Number(value) || 0)], sku: ["sku", String],
      image: ["image", String], gallery: ["gallery", JSON.stringify], tags: ["tags", JSON.stringify],
      specifications: ["specifications", (value) => value == null ? null : JSON.stringify(value)],
      isFeatured: ["is_featured", (value) => value ? 1 : 0], isActive: ["is_active", (value) => value ? 1 : 0]
    };
    const updates = Object.entries(fields).filter(([key]) => body[key] !== undefined);
    if (updates.length) {
      const assignments = updates.map(([, [column]]) => `\`${column}\` = ?`).join(", ");
      await getPool().execute(
        `UPDATE products SET ${assignments} WHERE id = ?`,
        [...updates.map(([key, [, convert]]) => convert(body[key])), req.params.id]
      );
    }
    res.json({ status: "success", message: "Product updated.", data: await getProduct(Number(req.params.id), true) });
  }));

  app.delete("/api/admin/products/:id", requireAdmin, route(async (req, res) => {
    const [result] = await getPool().execute("DELETE FROM products WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) throw httpError(404, "Product not found.");
    res.json({ status: "success", message: "Product deleted." });
  }));

  app.get("/api/admin/categories", requireAdmin, route(async (_req, res) => {
    const rows = await query(
      `SELECT c.id, c.name, c.slug, c.description, c.image, c.icon, c.is_active AS isActive,
        c.created_at AS createdAt, COUNT(p.id) AS itemCount FROM categories c
       LEFT JOIN products p ON p.category_id = c.id GROUP BY c.id ORDER BY c.name`
    );
    res.json({ status: "success", data: rows.map(mapCategory) });
  }));

  app.post("/api/admin/categories", requireAdmin, route(async (req, res) => {
    const body = req.body || {};
    const name = String(body.name || "").trim();
    if (!name) throw httpError(400, "Category name is required.");
    const [result] = await getPool().execute(
      `INSERT INTO categories (name, slug, description, image, icon, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, `${slugify(body.slug || name)}-${randomUUID().slice(0, 6)}`, body.description || "", body.image || "", body.icon || "Package", body.isActive === false ? 0 : 1]
    );
    const [rows] = await getPool().execute(
      `SELECT id, name, slug, description, image, icon, is_active AS isActive, created_at AS createdAt FROM categories WHERE id = ?`,
      [result.insertId]
    );
    res.status(201).json({ status: "success", message: "Category created.", data: mapCategory(rows[0]) });
  }));

  app.put("/api/admin/categories/:id", requireAdmin, route(async (req, res) => {
    const fields = { name: "name", description: "description", image: "image", icon: "icon", isActive: "is_active" };
    const updates = Object.entries(fields).filter(([key]) => req.body?.[key] !== undefined);
    if (!updates.length) throw httpError(400, "No category fields were provided.");
    const assignments = updates.map(([, column]) => `\`${column}\` = ?`).join(", ");
    const values = updates.map(([key]) => key === "isActive" ? (req.body[key] ? 1 : 0) : req.body[key]);
    const [result] = await getPool().execute(`UPDATE categories SET ${assignments} WHERE id = ?`, [...values, req.params.id]);
    if (!result.affectedRows) throw httpError(404, "Category not found.");
    const [rows] = await getPool().execute(
      `SELECT c.id, c.name, c.slug, c.description, c.image, c.icon, c.is_active AS isActive,
        c.created_at AS createdAt, COUNT(p.id) AS itemCount FROM categories c LEFT JOIN products p ON p.category_id = c.id
       WHERE c.id = ? GROUP BY c.id`,
      [req.params.id]
    );
    res.json({ status: "success", message: "Category updated.", data: mapCategory(rows[0]) });
  }));

  app.delete("/api/admin/categories/:id", requireAdmin, route(async (req, res) => {
    const [result] = await getPool().execute("DELETE FROM categories WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) throw httpError(404, "Category not found.");
    res.json({ status: "success", message: "Category deleted." });
  }));

  app.get("/api/admin/orders", requireAdmin, route(async (req, res) => {
    const conditions = [];
    const values = [];
    if (req.query.status && req.query.status !== "all") {
      conditions.push("shipping_status = ?");
      values.push(req.query.status);
    }
    if (req.query.search) {
      const pattern = `%${String(req.query.search).trim()}%`;
      conditions.push("(order_number LIKE ? OR tracking_number LIKE ? OR customer_name LIKE ? OR customer_email LIKE ?)");
      values.push(pattern, pattern, pattern, pattern);
    }
    const rows = await query(
      `SELECT id FROM orders ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""} ORDER BY created_at DESC`,
      values
    );
    const orders = await Promise.all(rows.map((row) => getOrder(row.id)));
    res.json({ status: "success", total: orders.length, data: orders });
  }));

  app.put("/api/admin/orders/:id/status", requireAdmin, route(async (req, res) => {
    const body = typeof req.body?.shippingStatus === "string"
      ? req.body
      : { shippingStatus: req.body?.status, trackingNumber: req.body?.trackingNumber };
    const allowedShipping = ["pending", "processing", "shipped", "delivered", "cancelled"];
    const allowedPayment = ["pending", "paid", "failed", "refunded"];
    const updates = [];
    const values = [];
    if (body.shippingStatus !== undefined) {
      if (!allowedShipping.includes(body.shippingStatus)) throw httpError(400, "Invalid shipping status.");
      updates.push("shipping_status = ?");
      values.push(body.shippingStatus);
    }
    if (body.paymentStatus !== undefined) {
      if (!allowedPayment.includes(body.paymentStatus)) throw httpError(400, "Invalid payment status.");
      updates.push("payment_status = ?");
      values.push(body.paymentStatus);
    }
    if (body.trackingNumber !== undefined) {
      if (typeof body.trackingNumber !== "string" || !body.trackingNumber.trim() || body.trackingNumber.trim().length > 60) {
        throw httpError(400, "A valid tracking number is required.");
      }
      updates.push("tracking_number = ?");
      values.push(body.trackingNumber.trim());
    }
    if (!updates.length) throw httpError(400, "No order status fields were provided.");
    const order = await transaction(async (connection) => {
      const [currentRows] = await connection.execute(
        "SELECT shipping_status AS shippingStatus, tracking_number AS trackingNumber FROM orders WHERE id = ? FOR UPDATE",
        [req.params.id]
      );
      const current = currentRows[0];
      if (!current) throw httpError(404, "Order not found.");
      await connection.execute(`UPDATE orders SET ${updates.join(", ")} WHERE id = ?`, [...values, req.params.id]);
      const nextStatus = body.shippingStatus ?? current.shippingStatus;
      const nextTracking = body.trackingNumber?.trim() ?? current.trackingNumber;
      if (nextStatus !== current.shippingStatus || nextTracking !== current.trackingNumber) {
        const location = String(body.location || (nextStatus === "shipped" ? "Handed to carrier" : "Shop Eazy fulfillment center")).trim().slice(0, 160);
        const note = String(body.statusNote || "").trim().slice(0, 255) || null;
        await connection.execute(
          `INSERT INTO order_status_history (order_id, shipping_status, tracking_number, location, note)
           VALUES (?, ?, ?, ?, ?)`,
          [req.params.id, nextStatus, nextTracking, location, note]
        );
      }
      return getOrder(Number(req.params.id), connection);
    });
    res.json({ status: "success", message: "Order updated.", data: order });
  }));

  app.get("/api/admin/users", requireAdmin, route(async (_req, res) => {
    const rows = await query(
      `SELECT id, name, email, 'customer' AS role, phone, address, city, zip_code AS zipCode,
        country, created_at AS createdAt FROM users ORDER BY created_at DESC`
    );
    res.json({ status: "success", total: rows.length, data: rows.map(mapUser) });
  }));

  app.get("/api/system/schema-docs", (_req, res) => {
    res.json({ status: "success", tables: ["users", "admins", "categories", "products", "carts", "cart_items", "coupons", "orders", "order_items", "reviews"], mysqlSchema: "backend/schema.sql", phpPdoCode: "This project uses the Node.js Express backend in backend/app.js.", restEndpoints: [
      { method: "POST", path: "/api/auth/register", description: "Create a customer account" },
      { method: "POST", path: "/api/auth/login", description: "Sign in and receive a bearer token" },
      { method: "GET", path: "/api/products", description: "List and filter active products" },
      { method: "GET", path: "/api/categories", description: "List active categories" },
      { method: "GET", path: "/api/cart", description: "Get the current customer or guest cart" },
      { method: "POST", path: "/api/orders", description: "Place an order with transactional stock checks" },
      { method: "GET", path: "/api/orders/track/:trackingNumber", description: "Track an order" },
      { method: "GET", path: "/api/admin/dashboard", description: "Read admin dashboard metrics" }
    ] });
  });

  app.use((error, _req, res, _next) => {
    const isDatabaseError = error.code?.startsWith("ER_") || [
      "ECONNREFUSED",
      "ETIMEDOUT",
      "PROTOCOL_CONNECTION_LOST",
      "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR"
    ].includes(error.code);
    const status = error.status || (error.code === "ER_DUP_ENTRY" ? 409 : isDatabaseError ? 503 : 500);
    if (status >= 500) console.error("[Shop Eazy API]", error);
    res.status(status).json({
      status: "error",
      message: status === 500
        ? "An unexpected server error occurred."
        : isDatabaseError && !error.status
          ? "The database is unavailable or rejected the request."
          : error.message
    });
  });

  return app;
}