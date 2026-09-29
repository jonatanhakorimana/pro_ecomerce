import React, { useState } from "react";
import { X, User as UserIcon, Mail, Phone, MapPin, Save, ShieldCheck } from "lucide-react";
import { User } from "../types";
import { api } from "../services/api";
import { useToast } from "./Toast";

interface CustomerProfileProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdateUser: (updated: User) => void;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser
}) => {
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    zipCode: user?.zipCode || "",
    country: user?.country || "United States"
  });

  if (!isOpen || !user) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await api.auth.updateProfile(formData);
      onUpdateUser(res.user);
      showToast("Profile details updated successfully!", "success");
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update profile.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black">
              {user.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Account & Profile</h2>
              <p className="text-xs text-zinc-400">Manage your shipping address & contact info</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 sm:p-7 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Full Name</label>
            <div className="relative">
              <input
                type="text"
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none"
              />
              <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                disabled
                value={formData.email}
                className="w-full bg-zinc-950/50 border border-zinc-800/60 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-zinc-400 cursor-not-allowed"
              />
              <Mail className="w-4 h-4 text-zinc-600 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Phone Number</label>
            <div className="relative">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none"
              />
              <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Default Street Address</label>
            <div className="relative">
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="742 Evergreen Terrace"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none"
              />
              <MapPin className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Springfield"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">ZIP / Postal Code</label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                placeholder="97477"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Role: <strong className="text-zinc-300 uppercase">{user.role}</strong>
            </span>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
