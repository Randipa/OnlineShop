"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Order } from "@/types";

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <p className="mb-4">Please sign in to checkout.</p>
        <button onClick={() => router.push("/login")} className="text-brand hover:underline">
          Sign In
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    router.push("/cart");
    return null;
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const order = await api.createOrder({
        shippingAddress: address,
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      }) as Order;

      try {
        await api.createPaymentIntent(order.id);
      } catch {
        // Stripe not configured — order still created for demo
      }

      clearCart();
      router.push(`/orders/${order.id}?success=true`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <form onSubmit={handleCheckout} className="bg-white p-8 rounded-2xl border space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div>
          <label className="block text-sm font-medium mb-1">Shipping Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-brand resize-none"
            rows={3}
            placeholder="123 Main St, Colombo, Sri Lanka"
            required
          />
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between text-lg font-bold mb-6">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-brand text-white font-semibold rounded-xl hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? "Processing..." : "Place Order"}
          </button>
        </div>
      </form>
    </div>
  );
}
