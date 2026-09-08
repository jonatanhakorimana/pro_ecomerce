import { Router } from "express";
import { db } from "../database.ts";
import { parseAuthUser } from "../middleware/auth.middleware.ts";
import { Order } from "../../src/types.ts";

export const ordersRouter = Router();

// POST /api/orders (Checkout)
ordersRouter.post("/", (req, res) => {
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
      prod.stockQuantity = Math.max(0, prod.stockQuantity - qty);
    }

    orderItems.push({
      id: orderItems.length + 1,
      orderId: 0,
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
ordersRouter.get("/", (req, res) => {
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

// GET /api/orders/track/:trackingNumber
ordersRouter.get("/track/:trackingNumber", (req, res) => {
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

// GET /api/orders/:id
ordersRouter.get("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const order = db.orders.find((o) => o.id === id || o.orderNumber === req.params.id);
  if (!order) {
    res.status(404).json({ status: "error", message: "Order not found." });
    return;
  }
  res.json({ status: "success", data: order });
});
