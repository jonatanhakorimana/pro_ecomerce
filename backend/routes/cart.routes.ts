import { Router } from "express";
import { db } from "../database.ts";
import { parseAuthUser } from "../middleware/auth.middleware.ts";

export const cartRouter = Router();

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
cartRouter.get("/", (req, res) => {
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
cartRouter.post("/items", (req, res) => {
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
cartRouter.put("/items/:id", (req, res) => {
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
cartRouter.delete("/items/:id", (req, res) => {
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
cartRouter.delete("/clear", (req, res) => {
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
