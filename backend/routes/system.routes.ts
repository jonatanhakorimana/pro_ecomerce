import { Router } from "express";
import { db } from "../database.ts";
import fs from "fs";
import path from "path";

export const systemRouter = Router();

// GET /api/system/schema-docs
systemRouter.get("/schema-docs", (_req, res) => {
  let fullSqlSchema = db.getMysqlSchemaSql();
  try {
    const schemaPath = path.join(process.cwd(), "backend", "schema.sql");
    if (fs.existsSync(schemaPath)) {
      fullSqlSchema = fs.readFileSync(schemaPath, "utf-8");
    }
  } catch (_e) {
    // Fallback to db method
  }

  res.json({
    status: "success",
    runtime: "Node.js (v22) + Express.js",
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
    sqlFilePath: "backend/schema.sql",
    nodeJsCode: db.getNodeJsSnippet(),
    mysqlSchema: fullSqlSchema,
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
      { method: "GET", path: "/api/system/download-sql", description: "Download complete backend/schema.sql file" },
      { method: "GET", path: "/api/admin/dashboard", description: "KPI analytics & revenue stats" },
      { method: "GET", path: "/api/admin/products", description: "Full admin catalog manager" },
      { method: "GET", path: "/api/admin/orders", description: "Order processing & status updates" }
    ]
  });
});

// GET /api/system/download-sql
systemRouter.get("/download-sql", (_req, res) => {
  const schemaPath = path.join(process.cwd(), "backend", "schema.sql");
  if (fs.existsSync(schemaPath)) {
    res.setHeader("Content-Disposition", "attachment; filename=shopeazy_db.sql");
    res.setHeader("Content-Type", "application/sql");
    res.sendFile(schemaPath);
  } else {
    res.status(404).json({ status: "error", message: "SQL schema file not found." });
  }
});

// GET /api/health
systemRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    runtime: "Node.js (Express)",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
