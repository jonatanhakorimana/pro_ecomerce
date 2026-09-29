import React, { useState, useEffect } from "react";
import {
  X,
  Star,
  ShoppingBag,
  Check,
  Truck,
  ShieldCheck,
  RotateCcw,
  Plus,
  Minus,
  MessageSquarePlus,
  AlertCircle,
  Heart
} from "lucide-react";
import { Product, Review } from "../types";
import { api } from "../services/api";
import { useToast } from "./Toast";

interface ProductDetailModalProps {
  product: Product | null;
  isOpen?: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow?: (product: Product, quantity: number) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen = true,
  onClose,
  onAddToCart,
  onBuyNow,
  isWishlisted,
  onToggleWishlist
}) => {
  const { showToast } = useToast();
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"desc" | "specs" | "reviews">("desc");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  // Review Form state
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedImage(product.image);
      setQuantity(1);
      setActiveTab("desc");

      // Load full product details, reviews, related items
      setIsLoadingDetails(true);
      api.products
        .getById(product.id)
        .then((data) => {
          if (data.reviews) setReviews(data.reviews);
          if (data.relatedProducts) setRelatedProducts(data.relatedProducts);
        })
        .catch((err) => console.error("Error loading product details", err))
        .finally(() => setIsLoadingDetails(false));
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const currentPrice = product.discountPrice || product.price;
  const isOutOfStock = product.stockQuantity <= 0;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) {
      showToast("Please enter your name and review comment.", "error");
      return;
    }

    try {
      setIsSubmittingReview(true);
      const res = await api.products.addReview(product.id, {
        userName: reviewName,
        rating: reviewRating,
        comment: reviewComment
      });

      setReviews((prev) => [res.data, ...prev]);
      product.rating = res.productRating;
      product.reviewCount = res.productReviewCount;
      setReviewComment("");
      showToast("Review posted successfully! Thank you for your feedback.", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to submit review.", "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const galleryImages = Array.from(new Set([product.image, ...(product.gallery || [])]));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {onToggleWishlist && product && (
          <button
            type="button"
            onClick={() => onToggleWishlist(product.id)}
            className={`absolute top-4 right-16 z-20 p-2 rounded-full border transition-colors ${
              isWishlisted
                ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                : "bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:text-rose-300"
            }`}
            title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? "fill-rose-400" : ""}`} />
          </button>
        )}
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
          {/* Left: Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square w-full rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 relative">
              <img
                src={selectedImage || product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {hasDiscount && (
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-zinc-950 uppercase tracking-wider shadow-lg">
                  Sale
                </span>
              )}
            </div>

            {/* Gallery Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                      selectedImage === img ? "border-emerald-500 scale-95" : "border-zinc-800 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}

            {/* Assurance Badges */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80 text-center text-[11px] text-zinc-400">
              <div className="flex flex-col items-center gap-1 p-2 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>Fast Shipping</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>2 Year Warranty</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                <RotateCcw className="w-4 h-4 text-sky-400" />
                <span>30-Day Return</span>
              </div>
            </div>
          </div>

          {/* Right: Product Info & Actions */}
          <div className="flex flex-col justify-between space-y-6">
            <div>
              {/* Category & SKU */}
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                <span className="font-semibold uppercase tracking-wider text-emerald-400">
                  {product.categoryName || "Premium Collection"}
                </span>
                <span className="font-mono text-zinc-500">SKU: {product.sku}</span>
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {product.name}
              </h2>

              {/* Rating & Reviews counter */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-zinc-600"
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-sm font-bold text-zinc-100">{product.rating.toFixed(1)}</span>
                </div>
                <span className="text-zinc-600">•</span>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className="text-xs text-zinc-400 hover:text-emerald-400 underline transition-colors"
                >
                  {product.reviewCount} customer reviews
                </button>
              </div>

              {/* Price Row */}
              <div className="flex items-baseline gap-3 mt-4">
                <span className="text-3xl font-black text-white">
                  ${currentPrice.toFixed(2)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-zinc-500 line-through">
                      ${product.price.toFixed(2)}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Save ${(product.price - product.discountPrice!).toFixed(2)}
                    </span>
                  </>
                )}
              </div>

              {/* Stock status */}
              <div className="mt-3 flex items-center gap-2">
                {product.stockQuantity > 10 ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    In Stock ({product.stockQuantity} available)
                  </span>
                ) : product.stockQuantity > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2.5 py-1 rounded-full">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Low Stock: Only {product.stockQuantity} remaining!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400 bg-rose-950/40 border border-rose-800/40 px-2.5 py-1 rounded-full">
                    Currently Out of Stock
                  </span>
                )}
              </div>

              {/* Quantity Selector & Action Buttons */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Quantity:</span>
                  <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1">
                    <button
                      disabled={quantity <= 1 || isOutOfStock}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm font-bold text-white">{quantity}</span>
                    <button
                      disabled={quantity >= product.stockQuantity || isOutOfStock}
                      onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                      className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    disabled={isOutOfStock}
                    onClick={() => onAddToCart(product, quantity)}
                    className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all border border-zinc-700 disabled:opacity-40 shadow-md"
                  >
                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                    <span>Add to Cart</span>
                  </button>
                  <button
                    disabled={isOutOfStock}
                    onClick={() => {
                      if (onBuyNow) {
                        onBuyNow(product, quantity);
                      } else {
                        onAddToCart(product, quantity);
                      }
                      onClose();
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40"
                  >
                    <span>Buy Now</span>
                  </button>
                </div>
              </div>

              {/* Tabs: Description / Specifications / Reviews */}
              <div className="mt-8">
                <div className="flex border-b border-zinc-800">
                  <button
                    onClick={() => setActiveTab("desc")}
                    className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                      activeTab === "desc"
                        ? "border-emerald-500 text-emerald-400"
                        : "border-transparent text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab("specs")}
                    className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                      activeTab === "specs"
                        ? "border-emerald-500 text-emerald-400"
                        : "border-transparent text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Specifications
                  </button>
                  <button
                    onClick={() => setActiveTab("reviews")}
                    className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                      activeTab === "reviews"
                        ? "border-emerald-500 text-emerald-400"
                        : "border-transparent text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Reviews ({reviews.length})
                  </button>
                </div>

                <div className="py-4 text-xs text-zinc-300 leading-relaxed">
                  {activeTab === "desc" && (
                    <div className="space-y-3">
                      <p>{product.description}</p>
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {product.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-full bg-zinc-950 text-zinc-400 border border-zinc-800 text-[10px]"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "specs" && (
                    <div className="space-y-2">
                      {product.specifications && Object.keys(product.specifications).length > 0 ? (
                        <div className="divide-y divide-zinc-800/80 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/40">
                          {Object.entries(product.specifications).map(([key, val]) => (
                            <div key={key} className="flex justify-between py-2 px-3">
                              <span className="font-semibold text-zinc-400">{key}</span>
                              <span className="text-zinc-200 font-medium">{val}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-zinc-500 italic">Standard technical specifications apply.</p>
                      )}
                    </div>
                  )}

                  {activeTab === "reviews" && (
                    <div className="space-y-4">
                      {/* Write Review Form */}
                      <form onSubmit={handleReviewSubmit} className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                            <MessageSquarePlus className="w-3.5 h-3.5 text-emerald-400" />
                            Write a Review
                          </span>
                          {/* Rating select */}
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => setReviewRating(num)}
                                className="p-0.5 text-amber-400"
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    num <= reviewRating ? "fill-amber-400 text-amber-400" : "text-zinc-700"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Your Name"
                            value={reviewName}
                            onChange={(e) => setReviewName(e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                          />
                          <input
                            type="text"
                            placeholder="Your feedback / review thoughts..."
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingReview}
                          className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-lg transition-colors"
                        >
                          {isSubmittingReview ? "Submitting..." : "Post Review"}
                        </button>
                      </form>

                      {/* Reviews List */}
                      <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                        {reviews.length === 0 ? (
                          <p className="text-zinc-500 italic text-center py-3">No reviews yet. Be the first to share your experience!</p>
                        ) : (
                          reviews.map((r) => (
                            <div key={r.id} className="p-2.5 bg-zinc-950/40 border border-zinc-800/80 rounded-xl space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-zinc-200">{r.userName}</span>
                                <div className="flex items-center text-amber-400">
                                  {[...Array(r.rating)].map((_, i) => (
                                    <Star key={i} className="w-3 h-3 fill-amber-400" />
                                  ))}
                                </div>
                              </div>
                              <p className="text-zinc-400">{r.comment}</p>
                              <span className="text-[10px] text-zinc-600 block">
                                {new Date(r.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
