import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { apiRouter } from "./backend/routes/index.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Standard JSON Body Parser
  app.use(express.json());

  // 1. Mount Modular Backend API Routes FIRST (/api/*)
  app.use("/api", apiRouter);

  // 2. Vite Middleware for Development / Static serving for Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
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
    console.log(`[Shop Eazy] Backend & Frontend server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
