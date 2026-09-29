import {
  createHash,
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual
} from "node:crypto";
import { promisify } from "node:util";
import { query } from "./db.js";

const scrypt = promisify(scryptCallback);
const tokenLifetimeSeconds = 60 * 60 * 24 * 7;

function getSecret() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set in production.");
  }
  return "local-development-secret-change-before-deploying";
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password, storedHash) {
  const hash = String(storedHash || "");
  if (/^[a-f0-9]{64}$/i.test(hash)) {
    const expected = Buffer.from(hash, "hex");
    const actual = createHash("sha256").update(password).digest();
    return timingSafeEqual(actual, expected);
  }

  const [salt, expectedHex] = hash.split(":");
  if (!salt || !/^[a-f0-9]+$/i.test(expectedHex || "") || expectedHex.length % 2 !== 0) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = await scrypt(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function isLegacyPasswordHash(storedHash) {
  return /^[a-f0-9]{64}$/i.test(String(storedHash || ""));
}

export function createToken(user) {
  const payload = Buffer.from(JSON.stringify({
    sub: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + tokenLifetimeSeconds
  })).toString("base64url");
  const signature = createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function readToken(token) {
  const [payload, signature] = String(token || "").split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", getSecret()).update(payload).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return claims.exp > Math.floor(Date.now() / 1000) ? claims : null;
  } catch {
    return null;
  }
}

export async function optionalAuth(req, _res, next) {
  try {
    const authorization = req.get("authorization") || "";
    const claims = authorization.startsWith("Bearer ") ? readToken(authorization.slice(7)) : null;
    if (claims) {
      const table = claims.role === "admin" ? "admins" : claims.role === "customer" ? "users" : null;
      const [user] = table ? await query(
        `SELECT id, name, email, '${claims.role}' AS role, phone, address, city,
          zip_code AS zipCode, country, created_at AS createdAt FROM ${table} WHERE id = ?`,
        [claims.sub]
      ) : [];
      if (user) req.user = user;
    }
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ status: "error", message: "Please sign in to continue." });
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ status: "error", message: "Please sign in to continue." });
  if (req.user.role !== "admin") return res.status(403).json({ status: "error", message: "Administrator access is required." });
  next();
}