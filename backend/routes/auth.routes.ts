import { Router } from "express";
import { db } from "../database.ts";
import { parseAuthUser } from "../middleware/auth.middleware.ts";

export const authRouter = Router();

// POST /api/auth/register
authRouter.post("/register", (req, res) => {
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
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
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
authRouter.post("/login", (req, res) => {
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
authRouter.get("/me", (req, res) => {
  const user = parseAuthUser(req);
  if (!user) {
    res.status(401).json({ status: "error", message: "Unauthenticated session." });
    return;
  }
  res.json({ status: "success", user });
});

// PUT /api/auth/profile
authRouter.put("/profile", (req, res) => {
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
