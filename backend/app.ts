import express from "express";
import { apiRouter } from "./routes/index.ts";

export function createBackendApp() {
  const app = express();

  // Middleware
  app.use(express.json());

  // Mount all /api routes
  app.use("/api", apiRouter);

  return app;
}
