import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ShoppingBag,
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
  Package,
  Layers,
  Users,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  CheckCircle2,
  Database,
  Search,
  Tag,
  ChevronRight,
  TrendingUp,
  X,
  Server,
  Plus,
  RefreshCw
} from "lucide-react";
import {
  Product,
  Category,
  Cart,
  User,
  Order,
  AdminDashboardStats,
  OrderStatus
} from "./types";
import { api } from "./services/api";
import { ToastProvider, useToast } from "./components/Toast";
import { Navbar } from "./components/Navbar";
import { ProductCard } from "./components/ProductCard";
import { ProductDetailModal } from "./components/ProductDetailModal";
import { CartDrawer } from "./components/CartDrawer";
import { CheckoutModal } from "./components/CheckoutModal";
import { AuthModal } from "./components/AuthModal";
import { CustomerProfile } from "./components/CustomerProfile";
import { OrderHistoryModal } from "./components/OrderHistoryModal";
import { OrderTrackerModal } from "./components/OrderTrackerModal";
import { DatabaseSchemaViewer } from "./components/DatabaseSchemaViewer";
import { BackendApiModal } from "./components/BackendApiModal";
import { AdminDashboard } from "./components/AdminDashboard";
import { AdminProducts } from "./components/AdminProducts";
import { AdminOrders } from "./components/AdminOrders";
import { AdminCategories } from "./components/AdminCategories";
import { AdminCustomers } from "./components/AdminCustomers";

function ShopEazyApp() {
  const { showToast } = useToast();

  // Core App Data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [adminStats, setAdminStats] = useState<AdminDashboardStats | null>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allCustomers, setAllCustomers] = useState<User[]>([]);

  // Navigation & View Mode
  const [viewMode, setViewMode] = useState<"store" | "admin">("store");
  const [adminTab, setAdminTab] = useState<"dashboard" | "products" | "orders" | "categories" | "customers">("dashboard");

  // Filtering & Search
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);

  // Modals & Drawers State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [activeTrackingCode, setActiveTrackingCode] = useState<string>("");
  const [isSchemaViewerOpen, setIsSchemaViewerOpen] = useState(false);
  const [isBackendApiOpen, setIsBackendApiOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    loadStoreData();
    checkAuthSession();
  }, []);

  const loadStoreData = async () => {
    try {
      const [productsData, categoriesData, cartData] = await Promise.all([
        api.products.getAll(),
        api.categories.getAll(),
        api.cart.getCart()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setCart(cartData);
    } catch (err) {
      console.error("Failed to load initial storefront data", err);
    }
  };

  const checkAuthSession = async () => {
    const token = localStorage.getItem("shopeazy_token");
    if (token) {
      try {
        const profile = await api.auth.getProfile();
        setUser(profile);
      } catch {
        api.auth.logout();
        setUser(null);
      }
    }
  };

  const loadAdminData = async () => {
    try {
      const [stats, orders, customers] = await Promise.all([
        api.admin.getDashboardStats(),
        api.admin.getOrders(),
        api.admin.getCustomers()
      ]);
      setAdminStats(stats);
      setAllOrders(orders);
      setAllCustomers(customers);
    } catch (err) {
      console.error("Failed to load admin data", err);
    }
  };

  useEffect(() => {
    if (viewMode === "admin") {
      loadAdminData();
    }
  }, [viewMode]);

  // Wishlist toggle
  const handleToggleWishlist = (productId: number) => {
    setWishlist((prev) => {
      const isWishlisted = prev.includes(productId);
      const updated = isWishlisted ? prev.filter((id) => id !== productId) : [...prev, productId];
      showToast(
        isWishlisted ? "Removed from saved wishlist" : "Added item to your saved wishlist",
        "info"
      );
      return updated;
    });
  };

  // Cart Operations
  const handleAddToCart = async (product: Product, quantity = 1) => {
    try {
      const updatedCart = await api.cart.addToCart(product.id, quantity);
      setCart(updatedCart);
      showToast(`Added ${quantity}x "${product.name}" to cart!`, "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Could not add to cart", "error");
    }
  };

  const handleUpdateQuantity = async (itemId: number, quantity: number) => {
    try {
      const updatedCart = await api.cart.updateQuantity(itemId, quantity);
      setCart(updatedCart);
    } catch (err: any) {
      showToast("Failed to update cart quantity", "error");
    }
  };

  const handleRemoveCartItem = async (itemId: number) => {
    try {
      const updatedCart = await api.cart.removeItem(itemId);
      setCart(updatedCart);
      showToast("Item removed from cart", "info");
    } catch (err: any) {
      showToast("Failed to remove item", "error");
    }
  };

  const handleClearCart = async () => {
    try {
      const emptyCart = await api.cart.clearCart();
      setCart(emptyCart);
      showToast("Shopping cart cleared", "info");
    } catch (err) {
      showToast("Failed to clear cart", "error");
    }
  };

  const handleApplyCoupon = (couponCode: string) => {
    api.cart.getCart().then((c) => setCart(c));
  };

  // Order Placement & Admin Updates
  const handleOrderSuccess = (newOrder: Order) => {
    api.cart.getCart().then((c) => setCart(c));
    if (viewMode === "admin") {
      loadAdminData();
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: OrderStatus) => {
    try {
      await api.admin.updateOrderStatus(orderId, status);
      showToast(`Order status updated to "${status}"`, "success");
      loadAdminData();
    } catch {
      showToast("Failed to update order status", "error");
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === "all" ||
      p.categorySlug === selectedCategory ||
      p.categoryId.toString() === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesPrice = (p.discountPrice || p.price) <= maxPrice;
    const matchesStock = inStockOnly ? p.stockQuantity > 0 : true;

    return matchesCategory && matchesSearch && matchesPrice && matchesStock;
  });

  // Sorted Products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = a.discountPrice || a.price;
    const priceB = b.discountPrice || b.price;

    if (sortBy === "price-asc") return priceA - priceB;
    if (sortBy === "price-desc") return priceB - priceA;
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "newest") return b.id - a.id;
    // default featured:
    return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
  });

  const cartItemsCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-zinc-950">
      {/* Top Notification Announcement Bar */}
      <div className="bg-emerald-950/70 border-b border-emerald-900/50 py-1.5 px-4 text-center text-xs text-emerald-300 font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        <span>
          Spring Launch Special: Use code <strong className="font-mono text-white underline">EAZY10</strong> for 10% OFF &amp; code <strong className="font-mono text-white underline">FREESHIP</strong> for free nationwide delivery!
        </span>
        <button
          onClick={() => setIsSchemaViewerOpen(true)}
          className="ml-3 hidden sm:inline-flex items-center gap-1 text-[11px] bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-md transition-colors"
        >
          <Database className="w-3 h-3" />
          <span>MySQL &amp; PHP Schema</span>
        </button>
      </div>

      {/* Main Navbar */}
      <Navbar
        user={user}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat ? String(cat) : "all")}
        searchQuery={searchQuery}
        onSearchChange={(q) => setSearchQuery(q)}
        cartCount={cartItemsCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={(tab) => {
          setAuthTab(tab || "login");
          setIsAuthOpen(true);
        }}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onOpenTracker={() => {
          setActiveTrackingCode("");
          setIsTrackerOpen(true);
        }}
        onOpenSchemaDocs={() => setIsSchemaViewerOpen(true)}
        onOpenBackendApi={() => setIsBackendApiOpen(true)}
        isAdminView={viewMode === "admin"}
        onToggleAdminView={() => setViewMode(viewMode === "admin" ? "store" : "admin")}
        onLogout={() => {
          api.auth.logout();
          setUser(null);
          setViewMode("store");
          showToast("Signed out successfully", "info");
        }}
      />

      {/* Main Application Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {viewMode === "admin" ? (
          /* ===================== ADMIN DASHBOARD PORTAL ===================== */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Admin Subheader & Navigation */}
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-black tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
                    Administrator Control Suite
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">PHP PDO + MySQL 8.0 Engine</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  Shop Eazy Inventory &amp; Order Command
                </h1>
              </div>

              {/* Admin Navigation Pills */}
              <div className="flex flex-wrap gap-1.5 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
                {[
                  { id: "dashboard", label: "Dashboard", icon: TrendingUp },
                  { id: "products", label: "Products", icon: Package },
                  { id: "orders", label: "Orders", icon: ShoppingBag },
                  { id: "categories", label: "Categories", icon: Layers },
                  { id: "customers", label: "Customers", icon: Users }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = adminTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setAdminTab(tab.id as any)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                        isActive
                          ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Admin Views */}
            {adminTab === "dashboard" && (
              <AdminDashboard
                stats={adminStats}
                onNavigateTab={(tab) => setAdminTab(tab)}
                onUpdateOrderStatus={handleUpdateOrderStatus}
              />
            )}

            {adminTab === "products" && (
              <AdminProducts
                products={products}
                categories={categories}
                onRefresh={() => {
                  loadStoreData();
                  loadAdminData();
                }}
              />
            )}

            {adminTab === "orders" && (
              <AdminOrders
                orders={allOrders}
                onRefresh={() => {
                  loadStoreData();
                  loadAdminData();
                }}
              />
            )}

            {adminTab === "categories" && (
              <AdminCategories
                categories={categories}
                onRefresh={() => {
                  loadStoreData();
                  loadAdminData();
                }}
              />
            )}

            {adminTab === "customers" && (
              <AdminCustomers
                customers={allCustomers}
                onRefresh={() => {
                  loadAdminData();
                }}
              />
            )}
          </div>
        ) : (
          /* ===================== CUSTOMER STOREFRONT VIEW ===================== */
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Hero Showcase Banner */}
            <section className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-8 sm:p-12 shadow-2xl">
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Next-Gen Minimalist E-Commerce</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                  Design-Forward Essentials. Built for Modern Living.
                </h1>

                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                  Explore our curated catalogue of high-fidelity electronics, bespoke apparel, and precision lifestyle tools. Seamless checkout and live tracking.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      const el = document.getElementById("products-catalog");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/20 hover:scale-105"
                  >
                    Shop New Arrivals
                  </button>

                  <button
                    onClick={() => setIsSchemaViewerOpen(true)}
                    className="px-5 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-bold text-xs sm:text-sm transition-all flex items-center gap-2"
                  >
                    <Database className="w-4 h-4 text-sky-400" />
                    <span>View MySQL Architecture</span>
                  </button>
                </div>
              </div>

              {/* Decorative Background Accents */}
              <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/40 via-transparent to-transparent" />
            </section>

            {/* Category Filter Pills Carousel */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                  Explore by Category
                </h2>
                <span className="text-xs text-zinc-500">
                  {categories.length} Taxonomies
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
                    selectedCategory === "all"
                      ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                      : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>All Products ({products.length})</span>
                </button>

                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
                      selectedCategory === cat.slug
                        ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                        : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] opacity-70">({cat.productCount || 0})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Product Catalog Controls Bar (Search, Sorting, Filters) */}
            <div
              id="products-catalog"
              className="p-4 bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-md"
            >
              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products by title, tag, or description..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sorting and Filter Toggle */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer font-medium"
                  >
                    <option value="featured" className="bg-zinc-900">Featured Items</option>
                    <option value="price-asc" className="bg-zinc-900">Price: Low to High</option>
                    <option value="price-desc" className="bg-zinc-900">Price: High to Low</option>
                    <option value="rating" className="bg-zinc-900">Highest Customer Rating</option>
                    <option value="newest" className="bg-zinc-900">Newest Arrivals</option>
                  </select>
                </div>

                {/* Filter toggle button */}
                <button
                  onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-colors ${
                    isFilterPanelOpen || inStockOnly || maxPrice < 1000
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filters</span>
                </button>
              </div>
            </div>

            {/* Expandable Filter Drawer / Tray */}
            {isFilterPanelOpen && (
              <div className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-3xl grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs animate-in slide-in-from-top-2 duration-200">
                {/* Price Range */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-zinc-300">Max Price:</span>
                    <span className="font-bold text-emerald-400 font-mono">${maxPrice}</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="1000"
                    step="10"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>$20</span>
                    <span>$500</span>
                    <span>$1,000</span>
                  </div>
                </div>

                {/* Stock availability */}
                <div className="flex flex-col justify-center space-y-2">
                  <span className="font-semibold text-zinc-300">Availability</span>
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="rounded border-zinc-800 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>In Stock Only ({products.filter((p) => p.stockQuantity > 0).length})</span>
                  </label>
                </div>

                {/* Reset Filters */}
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => {
                      setSelectedCategory("all");
                      setSearchQuery("");
                      setMaxPrice(1000);
                      setInStockOnly(false);
                      setSortBy("featured");
                    }}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            )}

            {/* Products Grid */}
            {sortedProducts.length === 0 ? (
              products.length === 0 ? (
                <div className="p-10 sm:p-14 text-center bg-zinc-900/90 border border-zinc-800 rounded-3xl space-y-5 shadow-2xl">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                    <Server className="w-8 h-8" />
                  </div>
                  <div className="space-y-2 max-w-md mx-auto">
                    <h3 className="text-xl font-black text-white">
                      Nta bicuruzwa birashyirwamo (Frontend is Ready)
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Ibicuruzwa bya mock byavuyemo neza. Ubu frontend yiteguye kwakira ibicuruzwa bivuye muri Backend API yawe ya PHP/MySQL, cyangwa ushobora kubyongeramo ukoresheje Admin Panel.
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        setViewMode("admin");
                        setAdminTab("products");
                      }}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ongeramo Igicuruzwa (Admin Panel)</span>
                    </button>
                    <button
                      onClick={() => setIsBackendApiOpen(true)}
                      className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center gap-2 transition-all"
                    >
                      <Server className="w-4 h-4" />
                      <span>Igenamiterere rya Backend API (PHP URL)</span>
                    </button>
                    <button
                      onClick={() => loadStoreData()}
                      className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs flex items-center gap-2 transition-colors"
                      title="Reload Products from Active API"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Ongera Usome (Reload)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center bg-zinc-900 border border-zinc-800 rounded-3xl space-y-3">
                  <Package className="w-10 h-10 text-zinc-600 mx-auto" />
                  <h3 className="text-base font-bold text-zinc-200">No matching products found</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Try adjusting your search query, increasing the price range filter, or clearing the category filter.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory("all");
                      setSearchQuery("");
                      setMaxPrice(1000);
                      setInStockOnly(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs"
                  >
                    Clear Filters
                  </button>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {sortedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isWishlisted={wishlist.includes(product.id)}
                    onToggleWishlist={handleToggleWishlist}
                    onAddToCart={handleAddToCart}
                    onViewDetails={(p) => setSelectedProduct(p)}
                  />
                ))}
              </div>
            )}

            {/* Customer Trust & Guarantee Value Props */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
              {[
                {
                  icon: Truck,
                  title: "Free Express Shipping",
                  desc: "Complimentary delivery on all orders over $100"
                },
                {
                  icon: ShieldCheck,
                  title: "256-Bit SSL Checkout",
                  desc: "Bank-grade encrypted tokenized payments"
                },
                {
                  icon: RotateCcw,
                  title: "30-Day Easy Returns",
                  desc: "Hassle-free money-back satisfaction guarantee"
                },
                {
                  icon: Headphones,
                  title: "24/7 Concierge Support",
                  desc: "Dedicated support team available on demand"
                }
              ].map((prop, idx) => {
                const Icon = prop.icon;
                return (
                  <div
                    key={idx}
                    className="p-5 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl flex items-start gap-3.5"
                  >
                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-100 text-xs sm:text-sm">{prop.title}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{prop.desc}</p>
                    </div>
                  </div>
                );
              })}
            </section>
          </div>
        )}
      </main>

      {/* Modern Dark Footer */}
      <footer className="mt-16 border-t border-zinc-800/80 bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-zinc-950 shadow-md">
                <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-lg font-black tracking-tight text-white">
                Shop <span className="text-emerald-400">Eazy</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
              Full-Stack E-Commerce Management System built with React + Vite frontend, Axios JWT authentication, and structured PHP REST API + MySQL database schemas.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setIsSchemaViewerOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <Database className="w-3.5 h-3.5 text-sky-400" />
                <span>Inspect MySQL Schema &amp; PHP PDO Docs</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <h5 className="font-bold uppercase tracking-wider text-zinc-300">Quick Navigation</h5>
            <ul className="space-y-1.5 text-zinc-400">
              <li>
                <button onClick={() => setSelectedCategory("all")} className="hover:text-emerald-400">
                  All Products
                </button>
              </li>
              <li>
                <button onClick={() => setSelectedCategory("electronics")} className="hover:text-emerald-400">
                  Electronics
                </button>
              </li>
              <li>
                <button onClick={() => setIsTrackerOpen(true)} className="hover:text-emerald-400">
                  Track Package
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setAuthTab("login");
                    setIsAuthOpen(true);
                  }}
                  className="hover:text-emerald-400"
                >
                  Customer Login
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2 text-xs">
            <h5 className="font-bold uppercase tracking-wider text-zinc-300">Admin &amp; Architecture</h5>
            <ul className="space-y-1.5 text-zinc-400">
              <li>
                <button
                  onClick={() => {
                    setViewMode(viewMode === "admin" ? "store" : "admin");
                    showToast(
                      viewMode === "admin" ? "Switched to Customer Storefront" : "Switched to Admin Dashboard",
                      "info"
                    );
                  }}
                  className="hover:text-emerald-400"
                >
                  Toggle Admin Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => setIsSchemaViewerOpen(true)} className="hover:text-emerald-400">
                  PHP PDO Database Connection
                </button>
              </li>
              <li>
                <span className="text-zinc-500 font-mono">REST API: /api/*</span>
              </li>
              <li>
                <span className="text-zinc-500 font-mono">JWT Bearer Auth</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-zinc-900 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-3">
          <span>&copy; 2026 Shop Eazy E-Commerce System. All rights reserved.</span>
          <div className="flex gap-4">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security Statement</span>
          </div>
        </div>
      </footer>

      {/* ===================== MODALS & DRAWERS ===================== */}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        isWishlisted={selectedProduct ? wishlist.includes(selectedProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
      />

      {/* Cart Slide-Over Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
        onApplyCoupon={handleApplyCoupon}
      />

      {/* Checkout Multi-Step Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        user={user}
        onOrderSuccess={handleOrderSuccess}
        onOpenTracker={(trackNum) => {
          setActiveTrackingCode(trackNum);
          setIsTrackerOpen(true);
        }}
      />

      {/* Authentication Modal (Login / Register / Demo 1-Click) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultTab={authTab}
        onAuthSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          if (loggedInUser.role === "admin") {
            setViewMode("admin");
          }
        }}
      />

      {/* Customer Profile & Address Manager */}
      <CustomerProfile
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onUpdateUser={(updated) => setUser(updated)}
      />

      {/* Customer Order History & Invoices */}
      <OrderHistoryModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        userEmail={user?.email}
        onOpenTracker={(trackNum) => {
          setActiveTrackingCode(trackNum);
          setIsTrackerOpen(true);
        }}
      />

      {/* Live Carrier Logistics Tracker */}
      <OrderTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        initialTrackingNumber={activeTrackingCode}
      />

      {/* Full-Stack MySQL & PHP Architecture Viewer */}
      <DatabaseSchemaViewer
        isOpen={isSchemaViewerOpen}
        onClose={() => setIsSchemaViewerOpen(false)}
      />

      {/* Backend API Configuration & Connection Tester Modal */}
      <BackendApiModal
        isOpen={isBackendApiOpen}
        onClose={() => setIsBackendApiOpen(false)}
        onRefreshData={loadStoreData}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ShopEazyApp />
    </ToastProvider>
  );
}
