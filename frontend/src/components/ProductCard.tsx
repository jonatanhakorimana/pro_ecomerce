import React from "react";
import { Star, ShoppingBag, Check, AlertTriangle, Eye, Heart } from "lucide-react";
import { Product } from "../types";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity?: number) => void;
  onViewDetails: (product: Product) => void;
  isAdded?: boolean;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetails,
  isAdded,
  isWishlisted,
  onToggleWishlist
}) => {
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;

  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 10;
  const isOutOfStock = product.stockQuantity <= 0;

  return (
    <div
      onClick={() => onViewDetails(product)}
      className="group relative bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800/80 hover:border-emerald-500/40 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col cursor-pointer shadow-md hover:shadow-xl hover:shadow-emerald-950/20"
    >
      {/* Product Image Stage */}
      <div className="relative aspect-square w-full bg-zinc-950 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
        />

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {hasDiscount && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500 text-zinc-950 shadow-md uppercase tracking-wider">
              {discountPercent}% OFF
            </span>
          )}
          {product.isFeatured && !hasDiscount && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-zinc-950 shadow-md uppercase tracking-wider">
              Featured
            </span>
          )}
          {isLowStock && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/90 text-white flex items-center gap-1 shadow-md">
              <AlertTriangle className="w-3 h-3" /> Only {product.stockQuantity} Left
            </span>
          )}
          {isOutOfStock && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
              Sold Out
            </span>
          )}
        </div>

        {onToggleWishlist && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            className={`absolute top-3 right-3 z-10 p-2 rounded-full border transition-colors ${
              isWishlisted
                ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                : "bg-zinc-950/80 border-zinc-700 text-zinc-300 hover:text-rose-300"
            }`}
            title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? "fill-rose-400" : ""}`} />
          </button>
        )}

        {/* Quick View Hover Icon */}
        <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="px-3 py-1.5 rounded-full bg-zinc-900/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg border border-zinc-700/60 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            Quick View
          </span>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-emerald-400 font-semibold tracking-wide uppercase text-[10px]">
              {product.categoryName || "Collection"}
            </span>
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span className="text-xs font-bold text-zinc-200">{product.rating.toFixed(1)}</span>
              <span className="text-zinc-500 text-[11px]">({product.reviewCount})</span>
            </div>
          </div>

          {/* Product Name */}
          <h3 className="font-semibold text-zinc-100 text-sm sm:text-base line-clamp-1 group-hover:text-emerald-400 transition-colors">
            {product.name}
          </h3>

          {/* Short Description */}
          <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
            {product.shortDescription || product.description}
          </p>
        </div>

        {/* Price & Action Row */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-white">
                ${(product.discountPrice || product.price).toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-zinc-500 line-through font-medium">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">SKU: {product.sku}</span>
          </div>

          <button
            disabled={isOutOfStock}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product, 1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              isOutOfStock
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                : isAdded
                ? "bg-emerald-600 text-white shadow-emerald-600/30"
                : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 hover:shadow-emerald-500/20 hover:scale-105 active:scale-95"
            }`}
            title={isOutOfStock ? "Out of stock" : "Add to Shopping Cart"}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
