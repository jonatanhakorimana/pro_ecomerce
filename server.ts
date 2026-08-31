import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./server/database.ts";
import { Product, Category, Order, OrderStatus, PaymentStatus } from "./src/types";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper for simple JWT-like auth token decoding & verification
  const parseAuthUser = (req: express.Request) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.split(" ")[1];
    try {
      // Tokens are base64-encoded JSON or demo strings
      if (token.startsWith("demo_user_")) {
        const userId = parseInt(token.replace("demo_user_", ""), 10);
        return db.users.find((u) => u.id === userId) || null;
      }
      if (token.startsWith("demo_admin_")) {
        return { id: 1, name: "Admin", email: "admin@shopeazy.com", role: "admin" as const };
      }
      const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
      if (decoded.role === "admin") {
        return { id: decoded.id || 1, name: decoded.name || "Admin", email: decoded.email, role: "admin" as const };
      }
      return db.users.find((u) => u.id === decoded.id) || null;
    } catch {
      return null;
    }
  };

  // ==========================================
  // 1. AUTHENTICATION REST API (/api/auth)
  // ==========================================

  // POST /api/auth/register
  app.post("/api/auth/register", (req, res) => {
    const { name, email, password, phone, address, city, zipCode } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ status: "error", message: "Name, email, and password are required." });
      return;
    }

    const existingUser = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      res.status(400).json({ status: "error", message: "Email is already registered. Please login." });
      return;
    }

    const newUser = {
      id: db.users.length + 1,
      name,
      email: email.toLowerCase(),
      role: "customer" as const,
      phone: phone || "",
      address: address || "",
      city: city || "",
      zipCode: zipCode || "",
      country: "United States",
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);

    const token = Buffer.from(JSON.stringify({ id: newUser.id, email: newUser.email, role: newUser.role })).toString("base64");
    res.json({
      status: "success",
      message: "Registration successful! Welcome to Shop Eazy.",
      token,
      user: newUser
    });
  });

  // POST /api/auth/login
  app.post("/api/auth/login", (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password) {
      res.status(400).json({ status: "error", message: "Email and password are required." });
      return;
    }

    // Check if logging in as Admin
    if (role === "admin" || email.toLowerCase() === "admin@shopeazy.com") {
      if (password === "admin123" || password === "password") {
        const adminUser = {
          id: 1,
          name: "Shop Eazy Administrator",
          email: "admin@shopeazy.com",
          role: "admin" as const,
          createdAt: "2026-01-01T00:00:00Z"
        };
        const token = Buffer.from(JSON.stringify({ id: 1, email: adminUser.email, role: "admin" })).toString("base64");
        res.json({
          status: "success",
          message: "Admin authentication verified.",
          token,
          user: adminUser
        });
        return;
      } else {
        res.status(401).json({ status: "error", message: "Invalid admin credentials (Default password is 'admin123')." });
        return;
      }
    }

    // Customer Login
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      res.status(401).json({ status: "error", message: "No account found with this email. Please register." });
      return;
    }

    const token = Buffer.from(JSON.stringify({ id: user.id, email: user.email, role: user.role })).toString("base64");
    res.json({
      status: "success",
      message: "Welcome back!",
      token,
      user
    });
  });

  // GET /api/auth/me
  app.get("/api/auth/me", (req, res) => {
    const user = parseAuthUser(req);
    if (!user) {
      res.status(401).json({ status: "error", message: "Unauthenticated session." });
      return;
    }
    res.json({ status: "success", user });
  });

  // PUT /api/auth/profile
  app.put("/api/auth/profile", (req, res) => {
    const user = parseAuthUser(req);
    if (!user) {
      res.status(401).json({ status: "error", message: "Unauthenticated session." });
      return;
    }

    const { name, phone, address, city, zipCode, country } = req.body;
    const target = db.users.find((u) => u.id === user.id);
    if (target) {
      if (name) target.name = name;
      if (phone !== undefined) target.phone = phone;
      if (address !== undefined) target.address = address;
      if (city !== undefined) target.city = city;
      if (zipCode !== undefined) target.zipCode = zipCode;
      if (country !== undefined) target.country = country;
      res.json({ status: "success", message: "Profile updated successfully.", user: target });
    } else {
      res.status(404).json({ status: "error", message: "User not found." });
    }
  });

  // ==========================================
  // 2. CATEGORIES REST API (/api/categories)
  // ==========================================

  // GET /api/categories
  app.get("/api/categories", (_req, res) => {
    const categoriesWithCount = db.categories.map((cat) => ({
      ...cat,
      itemCount: db.products.filter((p) => p.categoryId === cat.id && p.isActive).length
    }));
    res.json({ status: "success", data: categoriesWithCount });
  });

  // ==========================================
  // 3. PRODUCTS REST API (/api/products)
  // ==========================================

  // GET /api/products
  app.get("/api/products", (req, res) => {
    let result = db.products.filter((p) => p.isActive);

    const { search, category, minPrice, maxPrice, sort, featured, inStock } = req.query;

    if (category) {
      const catId = parseInt(category as string, 10);
      if (!isNaN(catId)) {
        result = result.filter((p) => p.categoryId === catId);
      } else {
        const cat = db.categories.find((c) => c.slug === category);
        if (cat) {
          result = result.filter((p) => p.categoryId === cat.id);
        }
      }
    }

    if (search) {
      const q = (search as string).toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.sku.toLowerCase().includes(q)
      );
    }

    if (minPrice) {
      const min = parseFloat(minPrice as string);
      if (!isNaN(min)) {
        result = result.filter((p) => (p.discountPrice || p.price) >= min);
      }
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice as string);
      if (!isNaN(max)) {
        result = result.filter((p) => (p.discountPrice || p.price) <= max);
      }
    }

    if (inStock === "true") {
      result = result.filter((p) => p.stockQuantity > 0);
    }

    if (featured === "true") {
      result = result.filter((p) => p.isFeatured);
    }

    if (sort) {
      switch (sort) {
        case "price_asc":
          result.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
          break;
        case "price_desc":
          result.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
          break;
        case "rating":
          result.sort((a, b) => b.rating - a.rating);
          break;
        case "popular":
          result.sort((a, b) => b.reviewCount - a.reviewCount);
          break;
        case "newest":
        default:
          result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
      }
    }

    res.json({
      status: "success",
      total: result.length,
      data: result
    });
  });

  // GET /api/products/:id
  app.get("/api/products/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const product = db.products.find((p) => p.id === id);
    if (!product) {
      res.status(404).json({ status: "error", message: "Product not found." });
      return;
    }

    const reviews = db.reviews.filter((r) => r.productId === id);
    const related = db.products.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4);

    res.json({
      status: "success",
      data: {
        ...product,
        reviews,
        relatedProducts: related
      }
    });
  });

  // POST /api/products/:id/reviews
  app.post("/api/products/:id/reviews", (req, res) => {
    const productId = parseInt(req.params.id, 10);
    const product = db.products.find((p) => p.id === productId);
    if (!product) {
      res.status(404).json({ status: "error", message: "Product not found." });
      return;
    }

    const { userName, rating, comment } = req.body;
    if (!userName || !rating || !comment) {
      res.status(400).json({ status: "error", message: "Name, rating (1-5), and review comment are required." });
      return;
    }

    const newReview = {
      id: db.reviews.length + 1,
      productId,
      userId: 1,
      userName,
      rating: Math.min(5, Math.max(1, parseInt(rating, 10))),
      comment,
      createdAt: new Date().toISOString()
    };

    db.reviews.unshift(newReview);

    // Update product rating average
    const productReviews = db.reviews.filter((r) => r.productId === productId);
    const avg = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
    product.rating = Math.round(avg * 10) / 10;
    product.reviewCount = productReviews.length;

    res.json({
      status: "success",
      message: "Review submitted successfully!",
      data: newReview,
      productRating: product.rating,
      productReviewCount: product.reviewCount
    });
  });

  // ==========================================
  // 4. SHOPPING CART REST API (/api/cart)
  // ==========================================

  const calculateCart = (items: typeof db.carts extends Map<string, infer I> ? I : never, couponCode?: string) => {
    let subtotal = 0;
    for (const item of items) {
      const prod = db.products.find((p) => p.id === item.productId);
      const unitPrice = prod ? (prod.discountPrice || prod.price) : item.price;
      subtotal += unitPrice * item.quantity;
    }

    let discount = 0;
    if (couponCode) {
      const coupon = db.coupons.find((c) => c.code.toUpperCase() === couponCode.toUpperCase() && c.isActive);
      if (coupon && subtotal >= coupon.minSpend) {
        if (coupon.discountType === "percentage") {
          discount = (subtotal * coupon.discountValue) / 100;
        } else {
          discount = Math.min(subtotal, coupon.discountValue);
        }
      }
    }

    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Math.round(taxableAmount * 0.08 * 100) / 100;
    const shippingFee = subtotal > 100 || couponCode === "FREESHIP" ? 0 : items.length > 0 ? 9.99 : 0;
    const total = Math.max(0, Math.round((subtotal - discount + tax + shippingFee) * 100) / 100);

    return {
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      tax,
      shippingFee,
      total,
      appliedCoupon: couponCode
    };
  };

  // GET /api/cart
  app.get("/api/cart", (req, res) => {
    const user = parseAuthUser(req);
    const sessionId = (req.query.sessionId as string) || "guest_session";
    const cartKey = user ? user.id.toString() : sessionId;
    const items = db.carts.get(cartKey) || [];
    const couponCode = req.query.coupon as string | undefined;

    res.json({
      status: "success",
      data: calculateCart(items, couponCode)
    });
  });

  // POST /api/cart/items
  app.post("/api/cart/items", (req, res) => {
    const user = parseAuthUser(req);
    const { productId, quantity, sessionId } = req.body;
    const cartKey = user ? user.id.toString() : sessionId || "guest_session";

    const product = db.products.find((p) => p.id === parseInt(productId, 10));
    if (!product) {
      res.status(404).json({ status: "error", message: "Product not found." });
      return;
    }

    const qtyToAdd = Math.max(1, parseInt(quantity || 1, 10));
    const items = db.carts.get(cartKey) || [];
    const existingIndex = items.findIndex((i) => i.productId === product.id);

    if (existingIndex > -1) {
      const newQty = items[existingIndex].quantity + qtyToAdd;
      if (newQty > product.stockQuantity) {
        res.status(400).json({ status: "error", message: `Only ${product.stockQuantity} items in stock.` });
        return;
      }
      items[existingIndex].quantity = newQty;
    } else {
      if (qtyToAdd > product.stockQuantity) {
        res.status(400).json({ status: "error", message: `Only ${product.stockQuantity} items in stock.` });
        return;
      }
      items.push({
        id: items.length + 1,
        productId: product.id,
        product,
        quantity: qtyToAdd,
        price: product.discountPrice || product.price
      });
    }

    db.carts.set(cartKey, items);
    res.json({
      status: "success",
      message: `Added ${product.name} to cart.`,
      data: calculateCart(items)
    });
  });

  // PUT /api/cart/items/:id
  app.put("/api/cart/items/:id", (req, res) => {
    const user = parseAuthUser(req);
    const { quantity, sessionId } = req.body;
    const itemId = parseInt(req.params.id, 10);
    const cartKey = user ? user.id.toString() : sessionId || "guest_session";

    const items = db.carts.get(cartKey) || [];
    const item = items.find((i) => i.id === itemId || i.productId === itemId);
    if (!item) {
      res.status(404).json({ status: "error", message: "Item not found in cart." });
      return;
    }

    const qty = parseInt(quantity, 10);
    if (qty <= 0) {
      const filtered = items.filter((i) => i.id !== item.id);
      db.carts.set(cartKey, filtered);
      res.json({ status: "success", data: calculateCart(filtered) });
      return;
    }

    const product = db.products.find((p) => p.id === item.productId);
    if (product && qty > product.stockQuantity) {
      res.status(400).json({ status: "error", message: `Only ${product.stockQuantity} items available in stock.` });
      return;
    }

    item.quantity = qty;
    db.carts.set(cartKey, items);
    res.json({
      status: "success",
      data: calculateCart(items)
    });
  });

  // DELETE /api/cart/items/:id
  app.delete("/api/cart/items/:id", (req, res) => {
    const user = parseAuthUser(req);
    const itemId = parseInt(req.params.id, 10);
    const sessionId = (req.query.sessionId as string) || "guest_session";
    const cartKey = user ? user.id.toString() : sessionId;

    let items = db.carts.get(cartKey) || [];
    items = items.filter((i) => i.id !== itemId && i.productId !== itemId);
    db.carts.set(cartKey, items);

    res.json({
      status: "success",
      message: "Item removed from cart.",
      data: calculateCart(items)
    });
  });

  // DELETE /api/cart/clear
  app.delete("/api/cart/clear", (req, res) => {
    const user = parseAuthUser(req);
    const sessionId = (req.query.sessionId as string) || "guest_session";
    const cartKey = user ? user.id.toString() : sessionId;
    db.carts.set(cartKey, []);
    res.json({
      status: "success",
      message: "Cart cleared.",
      data: calculateCart([])
    });
  });

  // POST /api/coupons/validate
  app.post("/api/coupons/validate", (req, res) => {
    const { code, subtotal } = req.body;
    if (!code) {
      res.status(400).json({ status: "error", message: "Please provide a coupon code." });
      return;
    }

    const coupon = db.coupons.find((c) => c.code.toUpperCase() === code.toUpperCase() && c.isActive);
    if (!coupon) {
      res.status(404).json({ status: "error", message: "Invalid coupon code." });
      return;
    }

    const total = parseFloat(subtotal || "0");
    if (total < coupon.minSpend) {
      res.status(400).json({
        status: "error",
        message: `Minimum spend of $${coupon.minSpend.toFixed(2)} required for code ${coupon.code}.`
      });
      return;
    }

    res.json({
      status: "success",
      message: `Coupon applied: ${coupon.description}`,
      data: coupon
    });
  });

  // ==========================================
  // 5. ORDERS REST API (/api/orders)
  // ==========================================

  // POST /api/orders (Checkout)
  app.post("/api/orders", (req, res) => {
    const user = parseAuthUser(req);
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      shippingMethod,
      paymentMethod,
      items,
      couponCode,
      notes,
      sessionId
    } = req.body;

    if (!customerName || !customerEmail || !shippingAddress || !items || items.length === 0) {
      res.status(400).json({ status: "error", message: "Customer name, email, shipping address, and items are required." });
      return;
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const prod = db.products.find((p) => p.id === item.productId);
      const price = prod ? (prod.discountPrice || prod.price) : item.price;
      const qty = item.quantity;
      subtotal += price * qty;

      if (prod) {
        // Decrease stock
        prod.stockQuantity = Math.max(0, prod.stockQuantity - qty);
      }

      orderItems.push({
        id: orderItems.length + 1,
        orderId: 0, // will set below
        productId: item.productId,
        productName: prod ? prod.name : item.productName || "Product",
        productImage: prod ? prod.image : item.productImage || "",
        price,
        quantity: qty,
        total: Math.round(price * qty * 100) / 100
      });
    }

    let discount = 0;
    if (couponCode) {
      const coupon = db.coupons.find((c) => c.code.toUpperCase() === couponCode.toUpperCase());
      if (coupon && subtotal >= coupon.minSpend) {
        discount = coupon.discountType === "percentage" ? (subtotal * coupon.discountValue) / 100 : coupon.discountValue;
      }
    }

    const shippingFee = shippingMethod?.includes("Express") ? 15 : subtotal > 100 || couponCode === "FREESHIP" ? 0 : 9.99;
    const tax = Math.round(Math.max(0, subtotal - discount) * 0.08 * 100) / 100;
    const totalAmount = Math.round((subtotal - discount + tax + shippingFee) * 100) / 100;

    const orderId = db.orders.length + 101;
    const trackingNumber = `TRK-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: user ? user.id : 1,
      customerName,
      customerEmail,
      customerPhone: customerPhone || "+1 (555) 000-0000",
      shippingAddress: {
        street: shippingAddress.street || "",
        city: shippingAddress.city || "",
        state: shippingAddress.state || "",
        zipCode: shippingAddress.zipCode || "",
        country: shippingAddress.country || "United States"
      },
      shippingMethod: shippingMethod || "Standard Ground (3-5 business days)",
      paymentMethod: paymentMethod || "Credit Card",
      paymentStatus: "paid",
      shippingStatus: "processing",
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      tax,
      shippingFee,
      totalAmount,
      trackingNumber,
      notes: notes || "",
      items: orderItems.map((oi) => ({ ...oi, orderId })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.orders.unshift(newOrder);

    // Clear cart
    const cartKey = user ? user.id.toString() : sessionId || "guest_session";
    db.carts.set(cartKey, []);

    res.json({
      status: "success",
      message: "Order placed successfully! Thank you for shopping with Shop Eazy.",
      order: newOrder
    });
  });

  // GET /api/orders (Customer's order list)
  app.get("/api/orders", (req, res) => {
    const user = parseAuthUser(req);
    const email = req.query.email as string;

    let userOrders: Order[] = [];
    if (user) {
      userOrders = db.orders.filter((o) => o.userId === user.id || o.customerEmail.toLowerCase() === user.email.toLowerCase());
    } else if (email) {
      userOrders = db.orders.filter((o) => o.customerEmail.toLowerCase() === email.toLowerCase());
    } else {
      userOrders = db.orders.slice(0, 5);
    }

    res.json({
      status: "success",
      total: userOrders.length,
      data: userOrders
    });
  });

  // GET /api/orders/:id
  app.get("/api/orders/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const order = db.orders.find((o) => o.id === id || o.orderNumber === req.params.id);
    if (!order) {
      res.status(404).json({ status: "error", message: "Order not found." });
      return;
    }
    res.json({ status: "success", data: order });
  });

  // GET /api/orders/track/:trackingNumber
  app.get("/api/orders/track/:trackingNumber", (req, res) => {
    const num = req.params.trackingNumber.trim().toUpperCase();
    const order = db.orders.find((o) => o.trackingNumber?.toUpperCase() === num || o.orderNumber.toUpperCase() === num);
    if (!order) {
      res.status(404).json({ status: "error", message: "No active shipment found with this tracking number or Order ID." });
      return;
    }

    res.json({
      status: "success",
      data: {
        order,
        trackingEvents: [
          { status: "Order Placed", date: order.createdAt, location: "Online Store Server", completed: true },
          { status: "Payment Confirmed", date: order.createdAt, location: "Payment Gateway", completed: true },
          {
            status: "Processing & Packaging",
            date: order.createdAt,
            location: "Shop Eazy Fulfillment Hub (Seattle, WA)",
            completed: ["processing", "shipped", "delivered"].includes(order.shippingStatus)
          },
          {
            status: "Shipped & In Transit",
            date: order.updatedAt,
            location: "Carrier Logistics Center",
            completed: ["shipped", "delivered"].includes(order.shippingStatus)
          },
          {
            status: "Out for Delivery",
            date: order.updatedAt,
            location: `${order.shippingAddress.city}, ${order.shippingAddress.state}`,
            completed: order.shippingStatus === "delivered"
          },
          {
            status: "Delivered",
            date: order.updatedAt,
            location: `${order.shippingAddress.street}`,
            completed: order.shippingStatus === "delivered"
          }
        ]
      }
    });
  });

  // ==========================================
  // 6. ADMIN DASHBOARD & MANAGEMENT REST API (/api/admin)
  // ==========================================

  // GET /api/admin/dashboard
  app.get("/api/admin/dashboard", (_req, res) => {
    const totalRevenue = db.orders.filter((o) => o.paymentStatus === "paid").reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = db.orders.length;
    const totalCustomers = db.users.length;
    const lowStockCount = db.products.filter((p) => p.stockQuantity < 10).length;
    const pendingOrdersCount = db.orders.filter((o) => o.shippingStatus === "pending" || o.shippingStatus === "processing").length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Top products by sales
    const productSalesMap: Record<number, { unitsSold: number; revenue: number }> = {};
    for (const order of db.orders) {
      for (const item of order.items) {
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = { unitsSold: 0, revenue: 0 };
        }
        productSalesMap[item.productId].unitsSold += item.quantity;
        productSalesMap[item.productId].revenue += item.total;
      }
    }

    const topProducts = Object.entries(productSalesMap)
      .map(([prodId, stats]) => {
        const p = db.products.find((prod) => prod.id === parseInt(prodId, 10));
        return {
          id: parseInt(prodId, 10),
          name: p ? p.name : "Product",
          categoryName: p ? p.categoryName || "General" : "General",
          price: p ? p.price : 0,
          image: p ? p.image : "",
          unitsSold: stats.unitsSold,
          revenue: Math.round(stats.revenue * 100) / 100
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Sales by Category
    const categorySalesMap: Record<string, number> = {};
    let totalCatRevenue = 0;
    for (const order of db.orders) {
      for (const item of order.items) {
        const p = db.products.find((prod) => prod.id === item.productId);
        const catName = p?.categoryName || "Other";
        categorySalesMap[catName] = (categorySalesMap[catName] || 0) + item.total;
        totalCatRevenue += item.total;
      }
    }

    const salesByCategory = Object.entries(categorySalesMap).map(([category, revenue]) => ({
      category,
      revenue: Math.round(revenue * 100) / 100,
      percentage: totalCatRevenue > 0 ? Math.round((revenue / totalCatRevenue) * 100) : 0
    }));

    // Monthly sales breakdown
    const monthlySales = [
      { month: "Nov", revenue: 2450.0, orders: 18 },
      { month: "Dec", revenue: 5890.0, orders: 42 },
      { month: "Jan", revenue: 4120.0, orders: 29 },
      { month: "Feb (MTD)", revenue: Math.round(totalRevenue * 100) / 100, orders: totalOrders }
    ];

    const stats = {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      revenueGrowth: 24.8,
      totalOrders,
      ordersGrowth: 18.2,
      totalCustomers,
      customersGrowth: 12.5,
      averageOrderValue: Math.round(avgOrderValue * 100) / 100,
      lowStockCount,
      pendingOrdersCount,
      recentOrders: db.orders.slice(0, 6),
      topProducts,
      salesByCategory,
      monthlySales
    };

    res.json({ status: "success", data: stats });
  });

  // GET /api/admin/products
  app.get("/api/admin/products", (_req, res) => {
    res.json({ status: "success", total: db.products.length, data: db.products });
  });

  // POST /api/admin/products (Create)
  app.post("/api/admin/products", (req, res) => {
    const { name, categoryId, description, shortDescription, price, discountPrice, stockQuantity, sku, image, gallery, tags, isFeatured } = req.body;

    if (!name || !categoryId || !price) {
      res.status(400).json({ status: "error", message: "Name, category, and price are required." });
      return;
    }

    const cat = db.categories.find((c) => c.id === parseInt(categoryId, 10));
    const newProduct: Product = {
      id: db.products.length + 1,
      categoryId: parseInt(categoryId, 10),
      categoryName: cat ? cat.name : "General",
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: description || name,
      shortDescription: shortDescription || description?.slice(0, 100) || name,
      price: parseFloat(price),
      discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
      stockQuantity: parseInt(stockQuantity || "0", 10),
      sku: sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      rating: 5.0,
      reviewCount: 0,
      image: image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
      gallery: gallery || [image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80"],
      tags: Array.isArray(tags) ? tags : ["New Arrival"],
      isFeatured: !!isFeatured,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    db.products.unshift(newProduct);
    res.json({ status: "success", message: "Product created successfully.", data: newProduct });
  });

  // PUT /api/admin/products/:id (Update)
  app.put("/api/admin/products/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const product = db.products.find((p) => p.id === id);
    if (!product) {
      res.status(404).json({ status: "error", message: "Product not found." });
      return;
    }

    const { name, categoryId, description, shortDescription, price, discountPrice, stockQuantity, sku, image, tags, isFeatured, isActive } = req.body;

    if (name) product.name = name;
    if (categoryId) {
      product.categoryId = parseInt(categoryId, 10);
      const cat = db.categories.find((c) => c.id === product.categoryId);
      if (cat) product.categoryName = cat.name;
    }
    if (description !== undefined) product.description = description;
    if (shortDescription !== undefined) product.shortDescription = shortDescription;
    if (price !== undefined) product.price = parseFloat(price);
    if (discountPrice !== undefined) product.discountPrice = discountPrice ? parseFloat(discountPrice) : undefined;
    if (stockQuantity !== undefined) product.stockQuantity = parseInt(stockQuantity, 10);
    if (sku) product.sku = sku;
    if (image) {
      product.image = image;
      if (!product.gallery.includes(image)) {
        product.gallery.unshift(image);
      }
    }
    if (tags) product.tags = Array.isArray(tags) ? tags : tags.split(",").map((t: string) => t.trim());
    if (isFeatured !== undefined) product.isFeatured = !!isFeatured;
    if (isActive !== undefined) product.isActive = !!isActive;

    res.json({ status: "success", message: "Product updated successfully.", data: product });
  });

  // DELETE /api/admin/products/:id
  app.delete("/api/admin/products/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = db.products.findIndex((p) => p.id === id);
    if (index === -1) {
      res.status(404).json({ status: "error", message: "Product not found." });
      return;
    }
    db.products.splice(index, 1);
    res.json({ status: "success", message: "Product deleted permanently." });
  });

  // GET /api/admin/categories
  app.get("/api/admin/categories", (_req, res) => {
    const cats = db.categories.map((c) => ({
      ...c,
      itemCount: db.products.filter((p) => p.categoryId === c.id).length
    }));
    res.json({ status: "success", data: cats });
  });

  // POST /api/admin/categories
  app.post("/api/admin/categories", (req, res) => {
    const { name, description, image, icon } = req.body;
    if (!name) {
      res.status(400).json({ status: "error", message: "Category name is required." });
      return;
    }

    const newCategory: Category = {
      id: db.categories.length + 1,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: description || "",
      image: image || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80",
      icon: icon || "Folder",
      isActive: true,
      createdAt: new Date().toISOString()
    };

    db.categories.push(newCategory);
    res.json({ status: "success", message: "Category created.", data: newCategory });
  });

  // PUT /api/admin/categories/:id
  app.put("/api/admin/categories/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const cat = db.categories.find((c) => c.id === id);
    if (!cat) {
      res.status(404).json({ status: "error", message: "Category not found." });
      return;
    }

    const { name, description, image, icon, isActive } = req.body;
    if (name) {
      cat.name = name;
      cat.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    }
    if (description !== undefined) cat.description = description;
    if (image) cat.image = image;
    if (icon) cat.icon = icon;
    if (isActive !== undefined) cat.isActive = !!isActive;

    res.json({ status: "success", message: "Category updated.", data: cat });
  });

  // DELETE /api/admin/categories/:id
  app.delete("/api/admin/categories/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = db.categories.findIndex((c) => c.id === id);
    if (index === -1) {
      res.status(404).json({ status: "error", message: "Category not found." });
      return;
    }
    db.categories.splice(index, 1);
    res.json({ status: "success", message: "Category deleted." });
  });

  // GET /api/admin/orders
  app.get("/api/admin/orders", (req, res) => {
    const { status, search } = req.query;
    let list = [...db.orders];

    if (status && status !== "all") {
      list = list.filter((o) => o.shippingStatus === status);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q) ||
          (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q))
      );
    }

    res.json({ status: "success", total: list.length, data: list });
  });

  // PUT /api/admin/orders/:id/status
  app.put("/api/admin/orders/:id/status", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const order = db.orders.find((o) => o.id === id || o.orderNumber === req.params.id);
    if (!order) {
      res.status(404).json({ status: "error", message: "Order not found." });
      return;
    }

    const { shippingStatus, paymentStatus, trackingNumber, notes } = req.body;
    if (shippingStatus) order.shippingStatus = shippingStatus as OrderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus as PaymentStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (notes !== undefined) order.notes = notes;
    order.updatedAt = new Date().toISOString();

    res.json({ status: "success", message: "Order status updated successfully.", data: order });
  });

  // GET /api/admin/users
  app.get("/api/admin/users", (_req, res) => {
    const usersWithStats = db.users.map((u) => {
      const userOrders = db.orders.filter((o) => o.userId === u.id || o.customerEmail.toLowerCase() === u.email.toLowerCase());
      const totalSpent = userOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      return {
        ...u,
        orderCount: userOrders.length,
        totalSpent: Math.round(totalSpent * 100) / 100,
        lastOrderDate: userOrders.length > 0 ? userOrders[0].createdAt : null
      };
    });
    res.json({ status: "success", total: usersWithStats.length, data: usersWithStats });
  });

  // GET /api/system/schema-docs
  app.get("/api/system/schema-docs", (_req, res) => {
    res.json({
      status: "success",
      tables: [
        "users",
        "admins",
        "categories",
        "products",
        "cart",
        "cart_items",
        "orders",
        "order_items",
        "reviews",
        "coupons"
      ],
      mysqlSchema: db.getMysqlSchemaSql(),
      phpPdoCode: db.getPhpPdoSnippet(),
      restEndpoints: [
        { method: "POST", path: "/api/auth/register", description: "Customer registration" },
        { method: "POST", path: "/api/auth/login", description: "Customer & Admin JWT authentication" },
        { method: "GET", path: "/api/auth/me", description: "Fetch authenticated profile" },
        { method: "GET", path: "/api/products", description: "Search, filter, paginate products" },
        { method: "GET", path: "/api/products/:id", description: "Get product details & reviews" },
        { method: "GET", path: "/api/categories", description: "List all product categories" },
        { method: "GET", path: "/api/cart", description: "Retrieve active cart calculation" },
        { method: "POST", path: "/api/cart/items", description: "Add item to cart" },
        { method: "POST", path: "/api/orders", description: "Checkout & order placement" },
        { method: "GET", path: "/api/orders", description: "Customer order history" },
        { method: "GET", path: "/api/orders/track/:tracking", description: "Real-time shipment tracker" },
        { method: "GET", path: "/api/admin/dashboard", description: "KPI analytics & revenue stats" },
        { method: "GET", path: "/api/admin/products", description: "Full admin catalog manager" },
        { method: "GET", path: "/api/admin/orders", description: "Order processing & status updates" }
      ]
    });
  });

  // ==========================================
  // Vite Middleware & Static Server
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Shop Eazy] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
