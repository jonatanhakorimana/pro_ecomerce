import { Router } from "express";
import { db } from "../database.ts";

export const categoriesRouter = Router();

// GET /api/categories
categoriesRouter.get("/", (_req, res) => {
  const categoriesWithCount = db.categories.map((cat) => ({
    ...cat,
    itemCount: db.products.filter((p) => p.categoryId === cat.id && p.isActive).length
  }));
  res.json({ status: "success", data: categoriesWithCount });
});
