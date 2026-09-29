import React, { useState } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Image as ImageIcon,
  Sparkles,
  Package
} from "lucide-react";
import { Product, Category } from "../types";
import { api } from "../services/api";
import { useToast } from "./Toast";

interface AdminProductsProps {
  products: Product[];
  categories: Category[];
  onRefresh: () => void;
}

// Curated high quality preset photography for easy 1-click product image assignment
const IMAGE_PRESETS = [
  {
    name: "Headphones",
    url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "Smartwatch",
    url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "Commuter Backpack",
    url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "Ceramic Brewer",
    url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "Overshirt",
    url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "OLED Monitor",
    url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "Botanical Serum",
    url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "Walnut Station",
    url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80"
  }
];

export const AdminProducts: React.FC<AdminProductsProps> = ({
  products,
  categories,
  onRefresh
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formCategoryId, setFormCategoryId] = useState<number>(categories[0]?.id || 1);
  const [formPrice, setFormPrice] = useState("");
  const [formDiscountPrice, setFormDiscountPrice] = useState("");
  const [formStock, setFormStock] = useState("20");
  const [formSku, setFormSku] = useState("");
  const [formImage, setFormImage] = useState(IMAGE_PRESETS[0].url);
  const [formShortDesc, setFormShortDesc] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formTags, setFormTags] = useState("Tech, New Arrival");
  const [formIsFeatured, setFormIsFeatured] = useState(false);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormCategoryId(categories[0]?.id || 1);
    setFormPrice("49.99");
    setFormDiscountPrice("");
    setFormStock("25");
    setFormSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormImage(IMAGE_PRESETS[0].url);
    setFormShortDesc("");
    setFormDesc("");
    setFormTags("Featured, Quality");
    setFormIsFeatured(false);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormCategoryId(product.categoryId);
    setFormPrice(product.price.toString());
    setFormDiscountPrice(product.discountPrice ? product.discountPrice.toString() : "");
    setFormStock(product.stockQuantity.toString());
    setFormSku(product.sku);
    setFormImage(product.image);
    setFormShortDesc(product.shortDescription || "");
    setFormDesc(product.description || "");
    setFormTags(product.tags ? product.tags.join(", ") : "");
    setFormIsFeatured(product.isFeatured);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice) {
      showToast("Please provide product name and price.", "error");
      return;
    }

    try {
      setIsSaving(true);
      const payload: Partial<Product> = {
        name: formName.trim(),
        categoryId: formCategoryId,
        price: parseFloat(formPrice),
        discountPrice: formDiscountPrice ? parseFloat(formDiscountPrice) : undefined,
        stockQuantity: parseInt(formStock || "0", 10),
        sku: formSku.trim() || `SKU-${Date.now()}`,
        image: formImage.trim(),
        shortDescription: formShortDesc.trim() || formDesc.trim().slice(0, 100),
        description: formDesc.trim() || formName.trim(),
        tags: formTags.split(",").map((t) => t.trim()).filter(Boolean),
        isFeatured: formIsFeatured
      };

      if (editingProduct) {
        await api.admin.updateProduct(editingProduct.id, payload);
        showToast("Product updated successfully in MySQL catalog.", "success");
      } else {
        await api.admin.createProduct(payload);
        showToast("New product created and published to storefront.", "success");
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to save product.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to permanently delete "${name}" from inventory?`)) {
      try {
        await api.admin.deleteProduct(id);
        showToast(`Deleted ${name}.`, "info");
        onRefresh();
      } catch (err: any) {
        showToast("Failed to delete product.", "error");
      }
    }
  };

  const filtered = products.filter((p) => {
    const matchesCat = categoryFilter === "all" || p.categoryId.toString() === categoryFilter;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Controls & Add Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name or SKU..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={openAddModal}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Catalog Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/50 text-zinc-400 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Product Info</th>
                <th className="py-3.5 px-3">Category</th>
                <th className="py-3.5 px-3">Price</th>
                <th className="py-3.5 px-3">Stock Level</th>
                <th className="py-3.5 px-3">SKU</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-zinc-950/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 rounded-xl object-cover bg-zinc-950 border border-zinc-800 flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <span className="font-bold text-zinc-100 block sm:text-sm line-clamp-1">
                          {product.name}
                        </span>
                        {product.isFeatured && (
                          <span className="inline-block mt-0.5 text-[10px] font-bold text-amber-400 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.2 rounded">
                            ★ Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-zinc-300">{product.categoryName || "General"}</td>
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-emerald-400">
                      ${(product.discountPrice || product.price).toFixed(2)}
                    </span>
                    {product.discountPrice && (
                      <span className="block text-[10px] text-zinc-500 line-through">
                        ${product.price.toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3">
                    {product.stockQuantity <= 10 ? (
                      <span className="inline-flex items-center gap-1 font-bold text-rose-400 bg-rose-950/30 border border-rose-900/40 px-2 py-0.5 rounded-full text-[10px]">
                        <AlertTriangle className="w-3 h-3" /> {product.stockQuantity} Left
                      </span>
                    ) : (
                      <span className="text-zinc-300 font-semibold">{product.stockQuantity} in stock</span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-zinc-400">{product.sku}</td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        product.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                      }`}
                    >
                      {product.isActive ? "Active" : "Archived"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                        title="Edit Product"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/50 transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </h2>
                  <p className="text-xs text-zinc-400">Save product details to MySQL catalog database</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Aura Sound Pro Wireless ANC Headphones"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Category *</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(parseInt(e.target.value, 10))}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="SKU-1001"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="199.99"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Discount Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formDiscountPrice}
                    onChange={(e) => setFormDiscountPrice(e.target.value)}
                    placeholder="159.99"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    placeholder="25"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Product Image URL & 1-Click Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-300">Product Image URL</label>
                <input
                  type="url"
                  required
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                />

                <div className="pt-1">
                  <span className="text-[11px] text-zinc-400 block mb-1.5">Or Choose from Quick Image Presets:</span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {IMAGE_PRESETS.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFormImage(p.url)}
                        className={`p-1 rounded-xl border flex-shrink-0 transition-all ${
                          formImage === p.url ? "border-emerald-500 bg-emerald-950/40" : "border-zinc-800 bg-zinc-950"
                        }`}
                      >
                        <img src={p.url} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                        <span className="text-[9px] text-zinc-400 block text-center mt-0.5 max-w-[50px] truncate">
                          {p.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Short Description</label>
                <input
                  type="text"
                  value={formShortDesc}
                  onChange={(e) => setFormShortDesc(e.target.value)}
                  placeholder="Catchy single sentence overview..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Comprehensive specifications, materials, warranty..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="Wireless, Audio, Sale"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-200">
                    <input
                      type="checkbox"
                      checked={formIsFeatured}
                      onChange={(e) => setFormIsFeatured(e.target.checked)}
                      className="rounded border-zinc-800 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>Highlight as Featured Hero Product</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? "Saving to Database..." : "Save Product"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
