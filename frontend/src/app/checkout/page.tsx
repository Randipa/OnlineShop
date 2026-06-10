"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import { Order } from "@/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const StripePaymentForm = dynamic(
  () => import("@/components/StripePaymentForm").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <LoadingSpinner label="Loading payment form..." />,
  }
);

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const stripeConfigured = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_");

  useEffect(() => {
    if (!authLoading && !user) return;
    if (!authLoading && items.length === 0 && !order) {
      router.replace("/cart");
    }
  }, [authLoading, user, items.length, order, router]);

  if (authLoading) return <LoadingSpinner />;

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

  if (!stripeConfigured) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <h1 className="text-xl font-bold mb-4">Payments Not Configured</h1>
        <p className="text-gray-500 text-sm">
          Add your Stripe publishable key to <code>.env.local</code> to enable checkout.
        </p>
      </div>
    );
  }

  if (items.length === 0 && !order) return <LoadingSpinner label="Redirecting..." />;

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const created = await api.createOrder({
        shippingAddress: address,
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      });
      setOrder(created);

      const payment = await api.createPaymentIntent(created.id);
      setClientSecret(payment.clientSecret);
      setPaymentIntentId(payment.paymentIntentId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    clearCart();
    if (order) router.push(`/orders/${order.id}?success=true`);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      {!order ? (
        <form onSubmit={handleCreateOrder} className="bg-white p-8 rounded-2xl border space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div>
            <label className="block text-sm font-medium mb-1">Shipping Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-brand resize-none"
              rows={3}
              placeholder="Enter your full delivery address"
              required
              minLength={10}
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
              {loading ? "Creating order..." : "Continue to Payment"}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white p-8 rounded-2xl border space-y-6">
          <div className="flex justify-between text-lg font-bold">
            <span>Order Total</span>
            <span>${Number(order.total).toFixed(2)}</span>
          </div>
          {clientSecret && paymentIntentId ? (
            <StripePaymentForm
              clientSecret={clientSecret}
              onConfirm={async () => {
                await api.confirmPayment(order.id, paymentIntentId);
              }}
              onSuccess={handlePaymentSuccess}
            />
          ) : (
            <p className="text-sm text-gray-500">Preparing payment...</p>
          )}
        </div>
      )}
    </div>
  );
}
