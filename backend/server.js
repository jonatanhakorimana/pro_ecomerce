import "dotenv/config";
import express from "express";
import path from "node:path";
import { createServer as createViteServer } from "vite";
import { createApp } from "./app.js";
import { closePool, getPool } from "./db.js";
import { hashPassword } from "./security.js";

const root = process.cwd();
const frontendRoot = path.join(root, "frontend");
const app = express();
app.use(createApp());
app.use("/api", (_req, res) => res.status(404).json({ status: "error", message: "Endpoint not found." }));
const isProduction = process.env.NODE_ENV === "production" ||
  process.argv[1]?.replaceAll("\\", "/").endsWith("/dist/server.mjs");
const port = Number(process.env.PORT || 3000);

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const [existing] = await getPool().execute("SELECT id FROM admins WHERE email = ?", [email]);
  if (existing.length) return;
  const passwordHash = await hashPassword(password);
  await getPool().execute(
    "INSERT INTO admins (name, email, password_hash) VALUES (?, ?, ?)",
    [process.env.ADMIN_NAME || "Shop Eazy Admin", email, passwordHash]
  );
  console.log(`[Shop Eazy] Initial administrator created for ${email}`);
}

if (isProduction) {
  const webRoot = path.join(frontendRoot, "dist");
  app.use(express.static(webRoot));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(webRoot, "index.html"));
  });
} else {
  const vite = await createViteServer({
    configFile: path.join(frontendRoot, "vite.config.ts"),
    root: frontendRoot,
    server: { middlewareMode: true },
    appType: "spa"
  });
  app.use(vite.middlewares);
}

const server = app.listen(port, async () => {
  console.log(`[Shop Eazy] API and storefront listening at http://localhost:${port}`);
  try {
    await getPool().query("SELECT 1");
    await seedAdmin();
    console.log("[Shop Eazy] MySQL connection ready");
  } catch (error) {
    console.error(`[Shop Eazy] MySQL is unavailable: ${error.message}`);
    if (process.env.DB_REQUIRED === "true") process.exitCode = 1;
  }
});

async function shutdown() {
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);