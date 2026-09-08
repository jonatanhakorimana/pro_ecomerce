import { Router } from "express";
import { db } from "../database.ts";
import { Product, Category, OrderStatus, PaymentStatus } from "../../src/types.ts";

export const adminRouter = Router();

// GET /api/admin/dashboard
adminRouter.get("/dashboard", (_req, res) => {
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
adminRouter.get("/products", (_req, res) => {
  res.json({ status: "success", total: db.products.length, data: db.products });
});

// POST /api/admin/products (Create)
adminRouter.post("/products", (req, res) => {
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
adminRouter.put("/products/:id", (req, res) => {
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
adminRouter.delete("/products/:id", (req, res) => {
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
adminRouter.get("/categories", (_req, res) => {
  const cats = db.categories.map((c) => ({
    ...c,
    itemCount: db.products.filter((p) => p.categoryId === c.id).length
  }));
  res.json({ status: "success", data: cats });
});

// POST /api/admin/categories
adminRouter.post("/categories", (req, res) => {
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
adminRouter.put("/categories/:id", (req, res) => {
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
adminRouter.delete("/categories/:id", (req, res) => {
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
adminRouter.get("/orders", (req, res) => {
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
adminRouter.put("/orders/:id/status", (req, res) => {
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
adminRouter.get("/users", (_req, res) => {
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
