import React, { useEffect, useState } from "react";
import { X, Lock, Mail, User as UserIcon, Phone, MapPin } from "lucide-react";
import { User } from "../types";
import { api } from "../services/api";
import { useToast } from "./Toast";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
  onAuthSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = "login",
  onAuthSuccess
}) => {
  const { showToast } = useToast();
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const [isLoading, setIsLoading] = useState(false);

  // Login Form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isAdminLogin, setIsAdminLogin] = useState(false);

  // Register Form
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regCity, setRegCity] = useState("");
  const [regZip, setRegZip] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab);
      setIsAdminLogin(false);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      showToast("Please provide both email and password.", "error");
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.auth.login({
        email: loginEmail,
        password: loginPassword,
        role: isAdminLogin ? "admin" : undefined
      });
      showToast(res.message || "Logged in successfully!", "success");
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Login failed. Check credentials.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      showToast("Name, email, and password are required.", "error");
      return;
    }
    if (regPassword.length < 8) {
      showToast("Password must be at least 8 characters.", "error");
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.auth.register({
        name: regName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        address: regAddress,
        city: regCity,
        zipCode: regZip
      });
      showToast(res.message || "Registration completed! Welcome to Shop Eazy.", "success");
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Registration failed.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Header */}
        <div className="p-6 pb-4 border-b border-zinc-800 bg-zinc-950/50">
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                tab === "login"
                  ? "bg-emerald-500 text-zinc-950 shadow-md"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab("register")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                tab === "register"
                  ? "bg-emerald-500 text-zinc-950 shadow-md"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Body Form */}
        <div className="p-6 sm:p-7 max-h-[60vh] overflow-y-auto">
          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={isAdminLogin}
                    onChange={(e) => setIsAdminLogin(e.target.checked)}
                    className="rounded border-zinc-800 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Sign in to Administrator Portal</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 mt-2"
              >
                {isLoading ? "Signing in..." : "Sign In to Shop Eazy"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Full Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl pl-9 pr-3.5 py-2 text-sm text-white focus:outline-none"
                  />
                  <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Email Address *</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl pl-9 pr-3.5 py-2 text-sm text-white focus:outline-none"
                  />
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Password *</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl pl-9 pr-3.5 py-2 text-sm text-white focus:outline-none"
                  />
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Phone Number</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl pl-9 pr-3.5 py-2 text-sm text-white focus:outline-none"
                  />
                  <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Street Address</label>
                <div className="relative">
                  <input
                    type="text"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="456 Sunset Boulevard"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl pl-9 pr-3.5 py-2 text-sm text-white focus:outline-none"
                  />
                  <MapPin className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">City</label>
                  <input
                    type="text"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    placeholder="Los Angeles"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">ZIP / Postal</label>
                  <input
                    type="text"
                    value={regZip}
                    onChange={(e) => setRegZip(e.target.value)}
                    placeholder="90001"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 mt-3"
              >
                {isLoading ? "Creating Account..." : "Create Free Account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
