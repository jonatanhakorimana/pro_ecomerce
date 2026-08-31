import React, { useState, useEffect } from "react";
import {
  X,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  ExternalLink,
  ChevronRight,
  Printer,
  Search,
  AlertCircle
} from "lucide-react";
import { Order, OrderStatus } from "../types";
import { api } from "../services/api";

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onOpenTracker: (trackingNumber: string) => void;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  onOpenTracker
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      api.orders
        .getMyOrders(userEmail)
        .then((data) => {
          setOrders(data);
          if (data.length > 0 && !selectedOrder) {
            setSelectedOrder(data[0]);
          }
        })
        .catch((err) => console.error("Error loading orders", err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, userEmail]);

  if (!isOpen) return null;

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "delivered":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "shipped":
        return "bg-sky-500/10 text-sky-400 border-sky-500/30";
      case "processing":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "pending":
        return "bg-zinc-500/10 text-zinc-300 border-zinc-500/30";
      case "cancelled":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = filterStatus === "all" || o.shippingStatus === filterStatus;
    const matchesSearch =
      !searchQuery ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.some((i) => i.productName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Order History & Receipts</h2>
              <p className="text-xs text-zinc-400">Track and view all past orders placed on Shop Eazy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex flex-col sm:flex-row gap-3 items-center justify-between flex-shrink-0 text-xs">
          {/* Status filters */}
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            {["all", "pending", "processing", "shipped", "delivered"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-colors ${
                  filterStatus === st
                    ? "bg-emerald-500 text-zinc-950 shadow-sm"
                    : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order # or product..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Master-Detail Body */}
        <div className="grid grid-cols-1 md:grid-cols-5 flex-1 overflow-hidden">
          {/* Left Column: Order List */}
          <div className="md:col-span-2 border-r border-zinc-800 overflow-y-auto p-4 space-y-3 bg-zinc-950/30">
            {isLoading ? (
              <div className="py-12 text-center text-zinc-500 text-xs">Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Package className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-zinc-400 font-medium text-xs">No orders found.</p>
              </div>
            ) : (
              filteredOrders.map((o) => (
                <div
                  key={o.id}
                  onClick={() => setSelectedOrder(o)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    selectedOrder?.id === o.id
                      ? "bg-zinc-900 border-emerald-500 shadow-md"
                      : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-xs text-zinc-100">{o.orderNumber}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadge(
                        o.shippingStatus
                      )}`}
                    >
                      {o.shippingStatus}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                    <span className="font-bold text-white">${o.totalAmount.toFixed(2)}</span>
                  </div>

                  <div className="mt-2 text-[11px] text-zinc-500 flex items-center justify-between border-t border-zinc-800/60 pt-1.5">
                    <span>{o.items.length} {o.items.length === 1 ? "item" : "items"}</span>
                    <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <span>Details</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right Column: Selected Order Breakdown */}
          <div className="md:col-span-3 overflow-y-auto p-6 space-y-5 bg-zinc-900">
            {selectedOrder ? (
              <div className="space-y-6">
                {/* Status & Actions Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800">
                  <div>
                    <span className="text-[11px] text-zinc-500 block">Order Information</span>
                    <h3 className="text-lg font-black text-white font-mono">{selectedOrder.orderNumber}</h3>
                    <span className="text-xs text-zinc-400">
                      Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {selectedOrder.trackingNumber && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenTracker(selectedOrder.trackingNumber!);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Track</span>
                      </button>
                    )}
                    <button
                      onClick={() => window.print()}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors"
                      title="Print Invoice"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Purchased Products</h4>
                  <div className="space-y-2.5">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-12 h-12 rounded-lg object-cover bg-zinc-900 border border-zinc-800"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="font-semibold text-zinc-100 text-xs sm:text-sm line-clamp-1">
                              {item.productName}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              Qty: {item.quantity} × ${item.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-zinc-100 text-sm">${item.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery & Billing grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl space-y-1.5">
                    <span className="font-bold text-zinc-300 block mb-1">Shipping Details</span>
                    <p className="text-zinc-200 font-semibold">{selectedOrder.customerName}</p>
                    <p className="text-zinc-400">{selectedOrder.shippingAddress.street}</p>
                    <p className="text-zinc-400">
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}{" "}
                      {selectedOrder.shippingAddress.zipCode}
                    </p>
                    <p className="text-zinc-400">{selectedOrder.shippingAddress.country}</p>
                    <p className="text-zinc-500 pt-1 font-mono">{selectedOrder.customerPhone}</p>
                  </div>

                  <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl space-y-1.5">
                    <span className="font-bold text-zinc-300 block mb-1">Payment & Carrier</span>
                    <p className="text-zinc-400">
                      Method: <strong className="text-zinc-200">{selectedOrder.paymentMethod}</strong>
                    </p>
                    <p className="text-zinc-400">
                      Payment Status:{" "}
                      <span className="font-bold text-emerald-400 uppercase text-[10px]">
                        {selectedOrder.paymentStatus}
                      </span>
                    </p>
                    <p className="text-zinc-400">
                      Shipping: <span className="text-zinc-200">{selectedOrder.shippingMethod}</span>
                    </p>
                    {selectedOrder.trackingNumber && (
                      <p className="text-zinc-400 pt-1">
                        Tracking: <span className="font-mono text-emerald-400">{selectedOrder.trackingNumber}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Totals Calculation Card */}
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-1.5 text-xs text-zinc-400">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-zinc-200 font-semibold">${selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-semibold">
                      <span>Discount</span>
                      <span>-${selectedOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax (8%)</span>
                    <span>${selectedOrder.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping Fee</span>
                    <span>{selectedOrder.shippingFee === 0 ? "FREE" : `$${selectedOrder.shippingFee.toFixed(2)}`}</span>
                  </div>
                  <div className="border-t border-zinc-800 pt-2 flex justify-between text-base font-black text-white">
                    <span>Total Paid</span>
                    <span className="text-emerald-400">${selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
                Select an order from the list to view receipt details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
