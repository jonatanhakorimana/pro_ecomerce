import React from "react";  
import {
  DollarSign,
  ShoppingBag,
  Users,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Layers,
  Clock,
  ChevronRight
} from "lucide-react";
import { AdminDashboardStats, Order, OrderStatus } from "../types";

interface AdminDashboardProps {
  stats: AdminDashboardStats | null;
  onNavigateTab: (tab: "products" | "orders" | "categories" | "customers") => void;
  onUpdateOrderStatus: (orderId: number, status: OrderStatus) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  onNavigateTab,
  onUpdateOrderStatus
}) => {
  if (!stats) {
    return (
      <div className="py-24 text-center text-zinc-500 text-sm">
        Loading admin intelligence & metrics...
      </div>
    );
  }

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

  return (
    <div className="space-y-8">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-3 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              ${stats.totalRevenue.toFixed(2)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mt-1">
              <ArrowUpRight className="w-4 h-4" />
              <span>+{stats.revenueGrowth}% this month</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-3 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Orders</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {stats.totalOrders}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-sky-400 font-semibold mt-1">
              <ArrowUpRight className="w-4 h-4" />
              <span>+{stats.ordersGrowth}% from last period</span>
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-3 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Active Customers</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {stats.totalCustomers}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-purple-400 font-semibold mt-1">
              <ArrowUpRight className="w-4 h-4" />
              <span>+{stats.customersGrowth}% new accounts</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-3 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Inventory Alert</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {stats.lowStockCount} Items
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mt-1">
              <span>{stats.lowStockCount > 0 ? "Stock below threshold (<10)" : "Healthy inventory levels"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Top Selling Items & Category Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Top Selling Products
            </h3>
            <button
              onClick={() => onNavigateTab("products")}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <span>Manage Catalog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {stats.topProducts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-11 h-11 rounded-xl object-cover bg-zinc-900 border border-zinc-800"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="font-semibold text-zinc-100 text-xs sm:text-sm line-clamp-1">{p.name}</h4>
                    <span className="text-[11px] text-zinc-400">{p.unitsSold} units sold</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-emerald-400 text-sm">${p.revenue.toFixed(2)}</span>
                  <span className="block text-[10px] text-zinc-500">${p.price.toFixed(2)} / unit</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales by Category & Monthly Progress */}
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              Category Revenue Share
            </h3>
            <button
              onClick={() => onNavigateTab("categories")}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
            >
              <span>View Categories</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {stats.salesByCategory.map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-200">{cat.category}</span>
                  <span className="font-bold text-zinc-300">
                    ${cat.revenue.toFixed(2)} <span className="text-zinc-500">({cat.percentage}%)</span>
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/80">
                  <div
                    className={`h-full rounded-full ${
                      idx === 0
                        ? "bg-emerald-500"
                        : idx === 1
                        ? "bg-sky-500"
                        : idx === 2
                        ? "bg-purple-500"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${Math.max(5, cat.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Management Table */}
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Recent Customer Orders
            </h3>
            <p className="text-xs text-zinc-400">Manage fulfillment and update real-time status</p>
          </div>
          <button
            onClick={() => onNavigateTab("orders")}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
          >
            <span>All Orders ({stats.totalOrders})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">Order ID</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Items</th>
                <th className="py-3 px-3">Total</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {stats.recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-950/40 transition-colors">
                  <td className="py-3.5 px-3 font-mono font-bold text-white">{order.orderNumber}</td>
                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-zinc-200 block">{order.customerName}</span>
                    <span className="text-[10px] text-zinc-500">{order.customerEmail}</span>
                  </td>
                  <td className="py-3.5 px-3 text-zinc-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="py-3.5 px-3 text-zinc-300">{order.items.length} items</td>
                  <td className="py-3.5 px-3 font-bold text-emerald-400">${order.totalAmount.toFixed(2)}</td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                        order.shippingStatus
                      )}`}
                    >
                      {order.shippingStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <select
                      value={order.shippingStatus}
                      onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                      className="bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
