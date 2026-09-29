import React, { useState } from "react";
import { Users, Search, Mail, Phone, MapPin, DollarSign, ShoppingBag } from "lucide-react";
import { User } from "../types";

interface AdminCustomersProps {
  customers: User[];
  onRefresh: () => void;
}

export const AdminCustomers: React.FC<AdminCustomersProps> = ({ customers }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.city && c.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers by name, email, or city..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="text-xs text-zinc-400">
          Total Registered: <strong className="text-white">{customers.length}</strong> accounts
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/50 text-zinc-400 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-3">Contact</th>
                <th className="py-3.5 px-3">Location</th>
                <th className="py-3.5 px-3">Orders</th>
                <th className="py-3.5 px-3">Lifetime Value</th>
                <th className="py-3.5 px-4 text-right">Member Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-950/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-zinc-100 block sm:text-sm">{c.name}</span>
                        <span className="text-[11px] text-zinc-400 font-mono">{c.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="text-zinc-300 block font-mono">{c.phone || "No phone recorded"}</span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="text-zinc-200 block">
                      {c.city ? `${c.city}, ${c.country || "US"}` : "Unspecified"}
                    </span>
                    <span className="text-[10px] text-zinc-500">{c.address || ""}</span>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
                      <ShoppingBag className="w-3.5 h-3.5 text-sky-400" />
                      <span>{c.totalOrders || 0}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-1 font-bold text-emerald-400">
                      <span>${(c.totalSpent || 0).toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right text-zinc-500 font-mono">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "2026"}
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
