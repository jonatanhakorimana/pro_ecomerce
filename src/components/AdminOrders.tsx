import React, { useState } from "react";
import {
  Search,
  Truck,
  CheckCircle2,
  AlertCircle,
  Printer,
  ChevronRight,
  Edit,
  Save,
  X,
  Package
} from "lucide-react";
import { Order, OrderStatus } from "../types";
import { api } from "../services/api";
import { useToast } from "./Toast";

interface AdminOrdersProps {
  orders: Order[];
  onRefresh: () => void;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, onRefresh }) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(orders[0] || null);

  // Edit Order Status & Tracking Modal
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>("pending");
  const [newTracking, setNewTracking] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

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

  const openUpdateModal = (order: Order) => {
    setEditingOrder(order);
    setNewStatus(order.shippingStatus);
    setNewTracking(order.trackingNumber || `TRK-EXP-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      setIsUpdating(true);
      await api.admin.updateOrderStatus(editingOrder.id, newStatus, newTracking);
      showToast(`Order ${editingOrder.orderNumber} status updated to "${newStatus}".`, "success");
      setEditingOrder(null);
      onRefresh();
    } catch (err: any) {
      showToast("Failed to update order status.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const filtered = orders.filter((o) => {
    const matchesStatus = statusFilter === "all" || o.shippingStatus === statusFilter;
    const matchesSearch =
      !searchQuery ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order #, Customer, or Tracking..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 capitalize"
          >
            <option value="all">All Statuses ({orders.length})</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="text-xs text-zinc-400">
          Showing <strong className="text-white">{filtered.length}</strong> orders
        </div>
      </div>

      {/* Two-Column Orders View */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Side: Order Table/List */}
        <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/50 text-zinc-400 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Order</th>
                  <th className="py-3.5 px-3">Customer</th>
                  <th className="py-3.5 px-3">Total</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`cursor-pointer transition-colors ${
                      selectedOrder?.id === order.id ? "bg-zinc-950/80" : "hover:bg-zinc-950/40"
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-white block">{order.orderNumber}</span>
                      <span className="text-[10px] text-zinc-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-zinc-200 block truncate max-w-[140px]">
                        {order.customerName}
                      </span>
                      <span className="text-[10px] text-zinc-500 truncate block max-w-[140px]">
                        {order.customerEmail}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-emerald-400">${order.totalAmount.toFixed(2)}</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                          order.shippingStatus
                        )}`}
                      >
                        {order.shippingStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openUpdateModal(order)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Selected Order Summary */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-5 shadow-md">
          {selectedOrder ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Active Selection</span>
                  <h3 className="font-mono font-bold text-white text-base">{selectedOrder.orderNumber}</h3>
                </div>
                <button
                  onClick={() => openUpdateModal(selectedOrder)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Update Order</span>
                </button>
              </div>

              {/* Status and Logistics Pill */}
              <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Fulfillment Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                      selectedOrder.shippingStatus
                    )}`}
                  >
                    {selectedOrder.shippingStatus}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Carrier Method:</span>
                  <span className="text-zinc-200 font-semibold">{selectedOrder.shippingMethod}</span>
                </div>
                {selectedOrder.trackingNumber && (
                  <div className="flex justify-between items-center pt-1 border-t border-zinc-800/60">
                    <span className="text-zinc-400">Tracking Code:</span>
                    <span className="font-mono font-bold text-emerald-400">{selectedOrder.trackingNumber}</span>
                  </div>
                )}
              </div>

              {/* Items in Order */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-400 block">Order Items</span>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-9 h-9 rounded-lg object-cover bg-zinc-900 border border-zinc-800"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <span className="font-semibold text-zinc-200 block truncate max-w-[150px]">
                            {item.productName}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {item.quantity} × ${item.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-white">${item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Destination Address */}
              <div className="p-3.5 bg-zinc-950/50 border border-zinc-800 rounded-2xl text-xs space-y-1">
                <span className="font-bold text-zinc-300 block mb-1">Customer & Delivery Info</span>
                <p className="text-zinc-200 font-semibold">{selectedOrder.customerName}</p>
                <p className="text-zinc-400">{selectedOrder.shippingAddress.street}</p>
                <p className="text-zinc-400">
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}{" "}
                  {selectedOrder.shippingAddress.zipCode}
                </p>
                <p className="text-zinc-500 font-mono pt-1">{selectedOrder.customerEmail}</p>
              </div>

              {/* Totals */}
              <div className="border-t border-zinc-800 pt-3 flex justify-between items-center text-xs">
                <span className="text-zinc-400">Total Billed:</span>
                <span className="text-base font-black text-emerald-400">${selectedOrder.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-500 text-xs">Select an order to inspect.</div>
          )}
        </div>
      </div>

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-8">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
              <div>
                <h3 className="text-lg font-bold text-white">Update Fulfillment Status</h3>
                <span className="font-mono text-xs text-emerald-400">{editingOrder.orderNumber}</span>
              </div>
              <button
                onClick={() => setEditingOrder(null)}
                className="p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Status Workflow</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none capitalize"
                >
                  <option value="pending">Pending (Awaiting Payment / Review)</option>
                  <option value="processing">Processing (Packaging in Warehouse)</option>
                  <option value="shipped">Shipped (Handed to Carrier)</option>
                  <option value="delivered">Delivered (Completed)</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Carrier Tracking Number</label>
                <input
                  type="text"
                  value={newTracking}
                  onChange={(e) => setNewTracking(e.target.value)}
                  placeholder="e.g. TRK-EXP-992147"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none uppercase"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isUpdating ? "Saving..." : "Save Status"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
