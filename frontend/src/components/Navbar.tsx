import React, { useState } from "react";
import {
  ShoppingBag,
  Search,
  User as UserIcon,
  ShieldCheck,
  Package,
  LogOut,
  Truck,
  Menu,
  X
} from "lucide-react";
import { User, Category } from "../types";

interface NavbarProps {
  user: User | null;
  categories: Category[];
  selectedCategory: string | number | null;
  onSelectCategory: (id: string | number | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAuth: (defaultTab?: "login" | "register") => void;
  onLogout: () => void;
  onOpenProfile: () => void;
  onOpenOrders: () => void;
  onOpenTracker: () => void;
  isAdminView: boolean;
  onToggleAdminView: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  cartCount,
  onOpenCart,
  onOpenAuth,
  onLogout,
  onOpenProfile,
  onOpenOrders,
  onOpenTracker,
  isAdminView,
  onToggleAdminView
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navItems = [
    { label: "Home", target: "home" },
    { label: "Shop", target: "products-catalog" },
    { label: "Categories", target: "categories" },
    { label: "About", target: "about" },
    { label: "Contact", target: "contact" }
  ];

  const scrollToSection = (target: string) => {
    setIsMobileMenuOpen(false);
    if (target === "home") {
      onSelectCategory(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (target === "products-catalog") onSelectCategory(null);
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                if (isAdminView) onToggleAdminView();
                onSelectCategory(null);
              }}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-zinc-950 font-black shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5 text-zinc-950" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-emerald-400 bg-clip-text text-transparent">
                  Shop Eazy
                </span>
                <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider -mt-1">
                  E-Commerce System
                </span>
              </div>
            </button>
          </div>

          {!isAdminView && (
            <nav aria-label="Main navigation" className="hidden items-center gap-3 lg:flex xl:gap-5">
              {navItems.map((item) => (
                <button
                  key={item.target}
                  onClick={() => scrollToSection(item.target)}
                  className="text-xs font-semibold text-zinc-400 transition-colors hover:text-emerald-400"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          )}

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-[260px] relative">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search products, headphones, smartwatches, apparel..."
                className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-emerald-500 rounded-full py-2 pl-10 pr-10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Track Order */}
            <button
              onClick={onOpenTracker}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/60 border border-zinc-800 transition-colors"
              title="Track your shipment status"
            >
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Track Order</span>
            </button>

            {/* Admin Switcher Toggle */}
            {user?.role === "admin" && (
              <button
                onClick={onToggleAdminView}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isAdminView
                    ? "bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/20"
                    : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800"
                }`}
                title="Open the admin dashboard"
              >
                <ShieldCheck className={`w-4 h-4 ${isAdminView ? "text-zinc-950" : "text-amber-400"}`} />
                <span className="hidden sm:inline">{isAdminView ? "Admin Portal" : "Admin Panel"}</span>
              </button>
            )}

            {/* Cart Button */}
            {!isAdminView && (
              <button
                onClick={onOpenCart}
                className="relative p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white transition-all hover:scale-105"
                title="View Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-zinc-950 font-extrabold text-[11px] min-w-[20px] h-5 rounded-full flex items-center justify-center px-1 shadow-md">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* User Profile / Auth Button */}
            <div className="relative">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-zinc-800/80 transition-colors border border-zinc-800"
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">
                        {user.name.charAt(0)}
                      </div>
                    )}
                    <span className="hidden md:inline text-xs font-medium text-zinc-200 max-w-[90px] truncate">
                      {user.name.split(" ")[0]}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-2 z-50 text-sm">
                        <div className="px-4 py-2 border-b border-zinc-800">
                          <p className="font-semibold text-zinc-100">{user.name}</p>
                          <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                          <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {user.role}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenProfile();
                          }}
                          className="w-full px-4 py-2 text-left text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2.5"
                        >
                          <UserIcon className="w-4 h-4 text-zinc-400" />
                          <span>My Profile & Address</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenOrders();
                          }}
                          className="w-full px-4 py-2 text-left text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2.5"
                        >
                          <Package className="w-4 h-4 text-zinc-400" />
                          <span>My Orders & Receipts</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenTracker();
                          }}
                          className="w-full px-4 py-2 text-left text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2.5"
                        >
                          <Truck className="w-4 h-4 text-zinc-400" />
                          <span>Track Shipment</span>
                        </button>
                        <div className="border-t border-zinc-800 my-1" />
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full px-4 py-2 text-left text-rose-400 hover:bg-rose-950/30 flex items-center gap-2.5"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenAuth("login")}
                    className="px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => onOpenAuth("register")}
                    className="hidden sm:inline px-3 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg transition-colors shadow-sm"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search & Categories Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-zinc-800 space-y-3">
            {!isAdminView && (
              <nav aria-label="Mobile navigation" className="grid grid-cols-3 gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.target}
                    onClick={() => scrollToSection(item.target)}
                    className="rounded-lg px-2 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-emerald-400"
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            )}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-9 pr-8 text-sm text-zinc-100 placeholder-zinc-500"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  onSelectCategory(null);
                  setIsMobileMenuOpen(false);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedCategory === null
                    ? "bg-emerald-500 text-zinc-950 font-bold"
                    : "bg-zinc-900 text-zinc-300 border border-zinc-800"
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onSelectCategory(c.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedCategory === c.id
                      ? "bg-emerald-500 text-zinc-950 font-bold"
                      : "bg-zinc-900 text-zinc-300 border border-zinc-800"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-zinc-800/80">
              <button
                onClick={() => {
                  onOpenTracker();
                  setIsMobileMenuOpen(false);
                }}
                className="flex-1 py-1.5 px-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300 flex items-center justify-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Track Order</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
