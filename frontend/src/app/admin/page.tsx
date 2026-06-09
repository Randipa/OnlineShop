"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Order, Product } from "@/types";
import { Package, ShoppingBag, AlertTriangle } from "lucide-react";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [inventory, setInventory] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      api.getInventory().then((data) => setInventory(data as Product[])).catch(console.error);
      api.getAllOrders().then((data) => setOrders(data as Order[])).catch(console.error);
    }
  }, [user]);

  if (loading || !user) return <div className="p-12 text-center">Loading...</div>;

  const lowStock = inventory.filter((p) => p.stock < 20);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl border">
          <Package className="w-8 h-8 text-brand mb-3" />
          <p className="text-2xl font-bold">{inventory.length}</p>
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

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Inventory</h2>
          <div className="bg-white rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4">Product</th>
                  <th className="text-right p-4">Stock</th>
                  <th className="text-right p-4">Price</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-4">{p.name}</td>
                    <td className={`p-4 text-right ${p.stock < 20 ? "text-amber-600 font-bold" : ""}`}>
                      {p.stock}
                    </td>
                    <td className="p-4 text-right">${Number(p.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {orders.slice(0, 10).map((order) => (
              <div key={order.id} className="bg-white p-4 rounded-xl border flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">#{order.id.slice(-8)}</p>
                  <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">${Number(order.total).toFixed(2)}</p>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
