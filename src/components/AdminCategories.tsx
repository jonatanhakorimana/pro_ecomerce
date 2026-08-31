import React, { useState } from "react";
import { Plus, Edit2, Trash2, X, Check, Layers, Image as ImageIcon } from "lucide-react";
import { Category } from "../types";
import { api } from "../services/api";
import { useToast } from "./Toast";

interface AdminCategoriesProps {
  categories: Category[];
  onRefresh: () => void;
}

export const AdminCategories: React.FC<AdminCategoriesProps> = ({ categories, onRefresh }) => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formImage, setFormImage] = useState("");

  const openAddModal = () => {
    setEditingCategory(null);
    setFormName("");
    setFormSlug("");
    setFormDesc("");
    setFormImage("https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80");
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDesc(cat.description || "");
    setFormImage(cat.image || "");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast("Category name is required.", "error");
      return;
    }

    try {
      setIsSaving(true);
      const payload: Partial<Category> = {
        name: formName.trim(),
        slug: formSlug.trim() || formName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: formDesc.trim(),
        image: formImage.trim()
      };

      if (editingCategory) {
        await api.admin.updateCategory(editingCategory.id, payload);
        showToast("Category updated successfully.", "success");
      } else {
        await api.admin.createCategory(payload);
        showToast("New category created successfully.", "success");
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast("Failed to save category.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete category "${name}"?`)) {
      try {
        await api.admin.deleteCategory(id);
        showToast(`Category ${name} deleted.`, "info");
        onRefresh();
      } catch (err: any) {
        showToast("Failed to delete category.", "error");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Product Taxonomy & Categories</h3>
          <p className="text-xs text-zinc-400">Organize and group products across the storefront</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="p-5 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4 hover:border-zinc-700 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={cat.image || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&auto=format&fit=crop&q=80"}
                  alt={cat.name}
                  className="w-12 h-12 rounded-2xl object-cover bg-zinc-950 border border-zinc-800"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="font-bold text-white text-sm">{cat.name}</h4>
                  <span className="font-mono text-[10px] text-emerald-400">/{cat.slug}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(cat)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-xs text-zinc-400 line-clamp-2">{cat.description || "No description provided."}</p>

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-500">Listed Products:</span>
              <span className="font-bold text-zinc-200">{cat.productCount || 0} items</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-8">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
              <h3 className="text-lg font-bold text-white">
                {editingCategory ? "Edit Category" : "Create New Category"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Smart Home"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">URL Slug</label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="smart-home"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Cover Image URL</label>
                <input
                  type="url"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Brief taxonomy overview..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Saving..." : "Save Category"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
