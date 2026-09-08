import { Router } from "express";
import { db } from "../database.ts";

export const couponsRouter = Router();

// POST /api/coupons/validate
couponsRouter.post("/validate", (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) {
    res.status(400).json({ status: "error", message: "Please provide a coupon code." });
    return;
  }

  const coupon = db.coupons.find((c) => c.code.toUpperCase() === code.toUpperCase() && c.isActive);
  if (!coupon) {
    res.status(404).json({ status: "error", message: "Invalid coupon code." });
    return;
  }

  const total = parseFloat(subtotal || "0");
  if (total < coupon.minSpend) {
    res.status(400).json({
      status: "error",
      message: `Minimum spend of $${coupon.minSpend.toFixed(2)} required for code ${coupon.code}.`
    });
    return;
  }

  res.json({
    status: "success",
    message: `Coupon applied: ${coupon.description}`,
    data: coupon
  });
});
