"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import { Order, Product, Category } from "@/types";
import { Package, ShoppingBag, AlertTriangle, Plus, Pencil, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const ORDER_STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  price: "",
  image: "",
  stock: "",
  featured: false,
  categoryId: "",
};

function toSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const loadData = () => {
    if (user?.role === "ADMIN") {
      api.getProducts().then(setProducts).catch(console.error);
      api.getCategories().then(setCategories).catch(console.error);
      api.getAllOrders().then(setOrders).catch(console.error);
    }
  };

  useEffect(loadData, [user]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError("");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setFormError("");
    try {
      const result = await api.uploadImage(file);
      if (!result?.url) throw new Error("Upload succeeded but no URL returned");
      setForm((prev) => ({ ...prev, image: result.url }));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Image upload failed";
      setFormError(`Image upload failed: ${msg}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: editingId ? prev.slug : toSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      image: form.image.trim(),
      stock: Number(form.stock),
      featured: form.featured,
      categoryId: form.categoryId,
    };

    try {
      if (editingId) {
        await api.updateProduct(editingId, payload);
      } else {
        await api.createProduct(payload);
      }
      resetForm();
      loadData();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: String(product.price),
      image: product.image,
      stock: String(product.stock),
      featured: product.featured,
      categoryId: product.category.id,
    });
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.deleteProduct(id);
      if (editingId === id) resetForm();
      loadData();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to delete product");
    }
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      await api.updateOrderStatus(orderId, status);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  if (loading || !user) return <LoadingSpinner />;

  const lowStock = products.filter((p) => p.stock < 20);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl border">
          <Package className="w-8 h-8 text-brand mb-3" />
          <p className="text-2xl font-bold">{products.length}</p>
          <p className="text-gray-500 text-sm">Total Products</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border">
          <ShoppingBag className="w-8 h-8 text-green-500 mb-3" />
          <p className="text-2xl font-bold">{orders.length}</p>
          <p className="text-gray-500 text-sm">Total Orders</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border">
          <AlertTriangle className="w-8 h-8 text-amber-500 mb-3" />
          <p className="text-2xl font-bold">{lowStock.length}</p>
          <p className="text-gray-500 text-sm">Low Stock Items</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border mb-12">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          {editingId ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {editingId ? "Edit Product" : "Add New Product"}
        </h2>
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
          {formError && (
            <p className="md:col-span-2 text-red-500 text-sm">{formError}</p>
          )}
          <input
            placeholder="Product name"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="px-4 py-3 border rounded-xl focus:outline-none focus:border-brand"
            required
          />
          <input
            placeholder="URL slug (wireless-headphones)"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="px-4 py-3 border rounded-xl focus:outline-none focus:border-brand"
            required
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="md:col-span-2 px-4 py-3 border rounded-xl focus:outline-none focus:border-brand resize-none"
            rows={3}
            required
          />
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="px-4 py-3 border rounded-xl focus:outline-none focus:border-brand"
            required
          />
          <input
            type="number"
            min="0"
            placeholder="Stock quantity"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="px-4 py-3 border rounded-xl focus:outline-none focus:border-brand"
            required
          />
          <div className="md:col-span-2 space-y-3">
            <label className="block text-sm font-medium">Product Image</label>
            {formError && formError.startsWith("Image upload") && (
              <p className="text-red-500 text-sm">{formError}</p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading..." : "Upload to Cloudinary"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-gray-500">or paste URL below</span>
            </div>
            <input
              placeholder="Image URL (auto-filled after upload)"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-brand"
              required
            />
            {form.image && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                <Image src={form.image} alt="Preview" fill className="object-cover" />
              </div>
            )}
          </div>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="px-4 py-3 border rounded-xl focus:outline-none focus:border-brand"
            required
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            Featured on home page
          </label>
          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              disabled={saving || uploading || !form.image}
              className="px-6 py-3 bg-brand text-white font-semibold rounded-xl hover:bg-brand-dark disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update Product" : "Add Product"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 border rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Products</h2>
          <div className="bg-white rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4">Product</th>
                  <th className="text-right p-4">Stock</th>
                  <th className="text-right p-4">Price</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-4">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.category.name}</p>
                    </td>
                    <td className={`p-4 text-right ${p.stock < 20 ? "text-amber-600 font-bold" : ""}`}>
                      {p.stock}
                    </td>
                    <td className="p-4 text-right">${Number(p.price).toFixed(2)}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          aria-label="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-2 hover:bg-red-50 text-red-500 rounded-lg"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Orders</h2>
          <div className="space-y-3">
            {orders.slice(0, 15).map((order) => (
              <div key={order.id} className="bg-white p-4 rounded-xl border">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-medium text-sm">#{order.id.slice(-8)}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-bold">${Number(order.total).toFixed(2)}</p>
                </div>
                <select
                  value={order.status}
                  disabled={updating === order.id}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:border-brand"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
