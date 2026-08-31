import React, { useState } from "react";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Tag,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { Cart } from "../types";
import { api } from "../services/api";
import { useToast } from "./Toast";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Cart | null;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemoveItem: (itemId: number) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  onApplyCoupon: (couponCode: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  onApplyCoupon
}) => {
  const { showToast } = useToast();
  const [couponInput, setCouponInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  if (!isOpen) return null;

  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    try {
      setIsApplyingCoupon(true);
      const res = await api.cart.applyCoupon(couponInput.trim(), cart?.subtotal || 0);
      onApplyCoupon(couponInput.trim());
      showToast(res.message, "success");
      setCouponInput("");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Invalid promo coupon code.", "error");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-zinc-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Your Shopping Cart</h2>
                <p className="text-xs text-zinc-400">
                  {items.length} {items.length === 1 ? "item" : "items"} selected
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {isEmpty ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-200 text-base">Your Cart is Empty</h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                    Browse our curated collections to discover premium tech, lifestyle accessories, and apparel.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs hover:bg-emerald-400 transition-colors shadow-md"
                >
                  Explore Products
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id || item.productId}
                  className="flex gap-3.5 p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl transition-all"
                >
                  <img
                    src={item.product?.image || (item as any).productImage || ""}
                    alt={item.product?.name || (item as any).productName}
                    className="w-20 h-20 rounded-xl object-cover bg-zinc-900 border border-zinc-800 flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />

                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-semibold text-zinc-100 text-xs sm:text-sm line-clamp-1">
                        {item.product?.name || (item as any).productName}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(item.id || item.productId)}
                        className="text-zinc-500 hover:text-rose-400 p-1 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Selector */}
                      <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                        <button
                          onClick={() => onUpdateQuantity(item.id || item.productId, item.quantity - 1)}
                          className="p-1 rounded text-zinc-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-white">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id || item.productId, item.quantity + 1)}
                          className="p-1 rounded text-zinc-400 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div className="text-right">
                        <span className="text-sm font-black text-white">
                          ${((item.price || (item.product?.discountPrice || item.product?.price || 0)) * item.quantity).toFixed(2)}
                        </span>
                        <span className="block text-[10px] text-zinc-500">
                          ${(item.price || (item.product?.discountPrice || item.product?.price || 0)).toFixed(2)} each
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Summary */}
          {!isEmpty && cart && (
            <div className="p-5 border-t border-zinc-800 bg-zinc-950/60 space-y-4">
              {/* Promo Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Coupon (e.g. EAZY10, FREESHIP)"
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3 pl-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none uppercase font-mono"
                  />
                  <Tag className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="submit"
                  disabled={isApplyingCoupon || !couponInput.trim()}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-40"
                >
                  Apply
                </button>
              </form>

              {/* Active coupon indicator */}
              {cart.appliedCoupon && (
                <div className="flex items-center justify-between text-xs py-1.5 px-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-emerald-400">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Promo Code: {cart.appliedCoupon}</span>
                  </div>
                  <span>Applied</span>
                </div>
              )}

              {/* Calculations */}
              <div className="space-y-1.5 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-zinc-200">${cart.subtotal.toFixed(2)}</span>
                </div>

                {cart.discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Discount</span>
                    <span>-${cart.discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Estimated Tax (8%)</span>
                  <span className="font-semibold text-zinc-200">${cart.tax.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-semibold text-zinc-200">
                    {cart.shippingFee === 0 ? (
                      <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">FREE</span>
                    ) : (
                      `$${cart.shippingFee.toFixed(2)}`
                    )}
                  </span>
                </div>

                <div className="border-t border-zinc-800 pt-2 flex justify-between text-base font-black text-white">
                  <span>Estimated Total</span>
                  <span className="text-emerald-400">${cart.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    onClose();
                    onProceedToCheckout();
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex justify-between items-center px-1">
                  <button
                    onClick={onClearCart}
                    className="text-[11px] text-zinc-500 hover:text-rose-400 transition-colors"
                  >
                    Clear Cart
                  </button>
                  <span className="text-[10px] text-zinc-500">🔒 256-Bit SSL Encrypted</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
