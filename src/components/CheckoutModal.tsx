import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  Truck,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Printer,
  Copy,
  Check,
  ShoppingBag
} from "lucide-react";
import confetti from "canvas-confetti";
import { Cart, User, Order } from "../types";
import { api } from "../services/api";
import { useToast } from "./Toast";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Cart | null;
  user: User | null;
  onOrderSuccess: (order: Order) => void;
  onOpenTracker: (trackingNumber: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  user,
  onOrderSuccess,
  onOpenTracker
}) => {
  const { showToast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    shippingMethod: "Standard Ground (3-5 business days)",
    paymentMethod: "Credit Card",
    cardNumber: "4242 •••• •••• 4242",
    cardExp: "12/28",
    cardCvc: "888",
    notes: ""
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        street: user.address || prev.street,
        city: user.city || prev.city,
        zipCode: user.zipCode || prev.zipCode,
        country: user.country || prev.country
      }));
    }
  }, [user]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.street || !formData.city || !formData.zipCode) {
        showToast("Please fill in all required shipping address fields.", "error");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handlePlaceOrder = async () => {
    if (!cart || cart.items.length === 0) return;

    try {
      setIsSubmitting(true);
      const orderPayload = {
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        shippingAddress: {
          street: formData.street,
          city: formData.city,
          state: formData.state || "CA",
          zipCode: formData.zipCode,
          country: formData.country
        },
        shippingMethod: formData.shippingMethod,
        paymentMethod: formData.paymentMethod,
        items: cart.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price || (i.product?.discountPrice || i.product?.price || 0),
          productName: i.product?.name,
          productImage: i.product?.image
        })),
        couponCode: cart.appliedCoupon,
        notes: formData.notes
      };

      const res = await api.orders.checkout(orderPayload);
      setPlacedOrder(res.order);
      setStep(4);
      onOrderSuccess(res.order);

      // Trigger Confetti effect
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {}

      showToast("Order placed successfully! Confirmation email dispatched.", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to place order. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTracking = () => {
    if (placedOrder?.trackingNumber) {
      navigator.clipboard.writeText(placedOrder.trackingNumber);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      showToast("Tracking number copied to clipboard!", "info");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400">Secure Checkout</span>
            <h2 className="text-xl font-black text-white mt-0.5">
              {step === 4 ? "Order Confirmation" : "Complete Your Order"}
            </h2>
          </div>
          {step !== 4 && (
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Multi-step progress bar */}
        {step !== 4 && (
          <div className="px-6 py-3 bg-zinc-950 border-b border-zinc-800/60 flex items-center justify-between text-xs font-semibold">
            <div className={`flex items-center gap-1.5 ${step >= 1 ? "text-emerald-400" : "text-zinc-500"}`}>
              <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold">1</span>
              <span>Address</span>
            </div>
            <div className="h-0.5 w-8 bg-zinc-800" />
            <div className={`flex items-center gap-1.5 ${step >= 2 ? "text-emerald-400" : "text-zinc-500"}`}>
              <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold">2</span>
              <span>Shipping</span>
            </div>
            <div className="h-0.5 w-8 bg-zinc-800" />
            <div className={`flex items-center gap-1.5 ${step >= 3 ? "text-emerald-400" : "text-zinc-500"}`}>
              <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold">3</span>
              <span>Payment</span>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto">
          {/* STEP 1: Shipping Address */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="flex items-center gap-2 pb-2 text-sm font-bold text-zinc-200">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Contact & Shipping Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. John Doe"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Street Address *</label>
                  <input
                    type="text"
                    name="street"
                    required
                    value={formData.street}
                    onChange={handleInputChange}
                    placeholder="123 Shopping Avenue, Suite 400"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">City *</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Seattle"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="WA"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">ZIP / Postal *</label>
                  <input
                    type="text"
                    name="zipCode"
                    required
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    placeholder="98101"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm flex items-center gap-2 transition-all shadow-md"
                >
                  <span>Continue to Shipping</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Shipping Method */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 text-sm font-bold text-zinc-200">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>Choose Delivery Speed</span>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: "standard",
                    name: "Standard Ground (3-5 business days)",
                    price: cart && (cart.subtotal > 100 || cart.appliedCoupon === "FREESHIP") ? "FREE" : "$9.99",
                    desc: "Reliable nationwide courier delivery with tracking"
                  },
                  {
                    id: "express",
                    name: "Express Air Priority (1-2 business days)",
                    price: "$15.00",
                    desc: "Fastest air dispatch with signature on delivery"
                  }
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      formData.shippingMethod === opt.name
                        ? "bg-emerald-950/20 border-emerald-500 shadow-md"
                        : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value={opt.name}
                        checked={formData.shippingMethod === opt.name}
                        onChange={handleInputChange}
                        className="text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold text-zinc-100 text-sm">{opt.name}</span>
                        <p className="text-xs text-zinc-400">{opt.desc}</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-emerald-400">{opt.price}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Delivery Notes (Optional)</label>
                <textarea
                  name="notes"
                  rows={2}
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Gate code, safe place to leave packages, etc."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm flex items-center gap-2 transition-all shadow-md"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment Method & Order Summary */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2 text-sm font-bold text-zinc-200">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Payment Information</span>
                </div>
                <span className="text-xs text-zinc-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> SSL Encrypted
                </span>
              </div>

              {/* Payment selector */}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: "Credit Card", label: "Credit Card" },
                  { id: "PayPal", label: "PayPal" },
                  { id: "Cash on Delivery", label: "Cash on Delivery" }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, paymentMethod: m.id }))}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      formData.paymentMethod === m.id
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Credit card inputs preview */}
              {formData.paymentMethod === "Credit Card" && (
                <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">Card Number</label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1">Expires (MM/YY)</label>
                      <input
                        type="text"
                        name="cardExp"
                        value={formData.cardExp}
                        onChange={handleInputChange}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1">CVC / CVV</label>
                      <input
                        type="password"
                        name="cardCvc"
                        value={formData.cardCvc}
                        onChange={handleInputChange}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Order total review */}
              {cart && (
                <div className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-2xl space-y-2 text-xs text-zinc-300">
                  <div className="flex justify-between">
                    <span>Items Total ({cart.items.length})</span>
                    <span className="font-semibold text-zinc-100">${cart.subtotal.toFixed(2)}</span>
                  </div>
                  {cart.discount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-semibold">
                      <span>Promo Coupon Discount</span>
                      <span>-${cart.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Estimated Tax (8%)</span>
                    <span>${cart.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping ({formData.shippingMethod.split(" ")[0]})</span>
                    <span>{formData.shippingMethod.includes("Express") ? "$15.00" : cart.shippingFee === 0 ? "FREE" : "$9.99"}</span>
                  </div>
                  <div className="border-t border-zinc-800 pt-2 flex justify-between text-base font-black text-white">
                    <span>Grand Total</span>
                    <span className="text-emerald-400">
                      ${(cart.total + (formData.shippingMethod.includes("Express") ? 15 - cart.shippingFee : 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handlePlaceOrder}
                  className="px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  <span>{isSubmitting ? "Authorizing Payment..." : "Place Order & Pay"}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Celebratory Confirmation & Receipt */}
          {step === 4 && placedOrder && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">Thank You for Your Order!</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  We've received your order and our fulfillment team is preparing it for shipment.
                </p>
              </div>

              {/* Order summary box */}
              <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-left space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                  <div>
                    <span className="text-[11px] text-zinc-500 block">Order Number</span>
                    <span className="font-mono font-bold text-emerald-400 text-base">{placedOrder.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-500 block">Date</span>
                    <span className="text-xs text-zinc-300">{new Date(placedOrder.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-500 block">Total Paid</span>
                    <span className="font-bold text-white text-base">${placedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Tracking code pill */}
                {placedOrder.trackingNumber && (
                  <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Logistics Tracking Number</span>
                      <span className="font-mono font-bold text-white text-xs">{placedOrder.trackingNumber}</span>
                    </div>
                    <button
                      onClick={copyTracking}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                )}

                {/* Items summary */}
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-zinc-300 block">Ordered Items:</span>
                  {placedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-zinc-400">
                      <span className="text-zinc-200 truncate max-w-[240px]">
                        {item.quantity}x {item.productName}
                      </span>
                      <span className="font-semibold text-zinc-100">${item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    onClose();
                    if (placedOrder.trackingNumber) onOpenTracker(placedOrder.trackingNumber);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-md"
                >
                  <Truck className="w-4 h-4" />
                  <span>Track Real-Time Shipment</span>
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-zinc-700 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-semibold text-xs border border-zinc-800 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
