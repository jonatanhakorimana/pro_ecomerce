import { Request, Response, NextFunction } from "express";
import { db } from "../database.ts";

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "customer";
}

export function parseAuthUser(req: Request): AuthenticatedUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  try {
    if (token.startsWith("demo_user_")) {
      const userId = parseInt(token.replace("demo_user_", ""), 10);
      const user = db.users.find((u) => u.id === userId);
      return user ? { id: user.id, name: user.name, email: user.email, role: "customer" } : null;
    }
    if (token.startsWith("demo_admin_")) {
      return { id: 1, name: "Admin", email: "admin@shopeazy.com", role: "admin" };
    }
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    if (decoded.role === "admin") {
      return { id: decoded.id || 1, name: decoded.name || "Admin", email: decoded.email, role: "admin" };
    }
    const user = db.users.find((u) => u.id === decoded.id);
    return user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null;
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = parseAuthUser(req);
  if (!user) {
    res.status(401).json({ status: "error", message: "Authentication required." });
    return;
  }
  (req as any).user = user;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = parseAuthUser(req);
  if (!user || user.role !== "admin") {
    res.status(403).json({ status: "error", message: "Admin privileges required." });
    return;
  }
  (req as any).user = user;
  next();
}
