import { Router } from "express";
import { db } from "../database.ts";

export const productsRouter = Router();

// GET /api/products
productsRouter.get("/", (req, res) => {
  let result = db.products.filter((p) => p.isActive);

  const { search, category, minPrice, maxPrice, sort, featured, inStock } = req.query;

  if (category) {
    const catId = parseInt(category as string, 10);
    if (!isNaN(catId)) {
      result = result.filter((p) => p.categoryId === catId);
    } else {
      const cat = db.categories.find((c) => c.slug === category);
      if (cat) {
        result = result.filter((p) => p.categoryId === cat.id);
      }
    }
  }

  if (search) {
    const q = (search as string).toLowerCase().trim();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.sku.toLowerCase().includes(q)
    );
  }

  if (minPrice) {
    const min = parseFloat(minPrice as string);
    if (!isNaN(min)) {
      result = result.filter((p) => (p.discountPrice || p.price) >= min);
    }
  }

  if (maxPrice) {
    const max = parseFloat(maxPrice as string);
    if (!isNaN(max)) {
      result = result.filter((p) => (p.discountPrice || p.price) <= max);
    }
  }

  if (inStock === "true") {
    result = result.filter((p) => p.stockQuantity > 0);
  }

  if (featured === "true") {
    result = result.filter((p) => p.isFeatured);
  }

  if (sort) {
    switch (sort) {
      case "price_asc":
        result.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
        break;
      case "price_desc":
        result.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "popular":
        result.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case "newest":
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
  }

  res.json({
    status: "success",
    total: result.length,
    data: result
  });
});

// GET /api/products/:id
productsRouter.get("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const product = db.products.find((p) => p.id === id);
  if (!product) {
    res.status(404).json({ status: "error", message: "Product not found." });
    return;
  }

  const reviews = db.reviews.filter((r) => r.productId === id);
  const related = db.products.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4);

  res.json({
    status: "success",
    data: {
      ...product,
      reviews,
      relatedProducts: related
    }
  });
});

// POST /api/products/:id/reviews
productsRouter.post("/:id/reviews", (req, res) => {
  const productId = parseInt(req.params.id, 10);
  const product = db.products.find((p) => p.id === productId);
  if (!product) {
    res.status(404).json({ status: "error", message: "Product not found." });
    return;
  }

  const { userName, rating, comment } = req.body;
  if (!userName || !rating || !comment) {
    res.status(400).json({ status: "error", message: "Name, rating (1-5), and review comment are required." });
    return;
  }

  const newReview = {
    id: db.reviews.length + 1,
    productId,
    userId: 1,
    userName,
    rating: Math.min(5, Math.max(1, parseInt(rating, 10))),
    comment,
    createdAt: new Date().toISOString()
  };

  db.reviews.unshift(newReview);

  // Update product rating average
  const productReviews = db.reviews.filter((r) => r.productId === productId);
  const avg = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
  product.rating = Math.round(avg * 10) / 10;
  product.reviewCount = productReviews.length;

  res.json({
    status: "success",
    message: "Review submitted successfully!",
    data: newReview,
    productRating: product.rating,
    productReviewCount: product.reviewCount
  });
});
