"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import { Order } from "@/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PaymentMethodSelector, { PaymentMethod } from "@/components/PaymentMethodSelector";
import PayHereCheckoutForm from "@/components/PayHereCheckoutForm";

const StripePaymentForm = dynamic(
  () => import("@/components/StripePaymentForm").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <LoadingSpinner label="Loading payment form..." />,
  }
);

type PaymentInit =
  | {
      method: "STRIPE";
      clientSecret: string;
      paymentIntentId: string;
    }
  | {
      method: "PAYHERE";
      actionUrl: string;
      fields: Record<string, string>;
    };

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [payment, setPayment] = useState<PaymentInit | null>(null);
  const [stripePublishableKey, setStripePublishableKey] = useState<string | null>(null);

  useEffect(() => {
    api.getStripeConfig().then((res) => {
      if (res.configured && res.publishableKey) {
        setStripePublishableKey(res.publishableKey);
      }
    });
  }, []);

  useEffect(() => {
    api
      .getPaymentMethods()
      .then((res) => {
        setMethods(res.methods);
        if (res.methods.includes("PAYHERE")) {
          setSelectedMethod("PAYHERE");
        } else if (res.methods.length > 0) {
          setSelectedMethod(res.methods[0]);
        }
      })
      .catch(() => setMethods([]));
  }, []);

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

  if (methods.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <h1 className="text-xl font-bold mb-4">Payments Not Configured</h1>
        <p className="text-gray-500 text-sm">
          Configure Stripe or PayHere keys in the backend <code>.env</code> file.
        </p>
      </div>
    );
  }

  if (items.length === 0 && !order) return <LoadingSpinner label="Redirecting..." />;

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod) return;

    setLoading(true);
    setError("");

    try {
      const created = await api.createOrder({
        shippingAddress: address,
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      });
      setOrder(created);

      const initiated = await api.initiatePayment(created.id, selectedMethod);

      if (initiated.method === "STRIPE") {
        if (!initiated.clientSecret || !initiated.paymentIntentId) {
          throw new Error("Stripe payment could not be started");
        }
        setPayment({
          method: "STRIPE",
          clientSecret: initiated.clientSecret,
          paymentIntentId: initiated.paymentIntentId,
        });
      } else if (initiated.method === "PAYHERE") {
        if (!initiated.actionUrl || !initiated.fields) {
          throw new Error("PayHere payment could not be started");
        }
        setPayment({
          method: "PAYHERE",
          actionUrl: initiated.actionUrl,
          fields: initiated.fields,
        });
      }
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
        <form onSubmit={handleCreateOrder} className="bg-white p-8 rounded-2xl border space-y-6">
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

          <PaymentMethodSelector
            methods={methods}
            selected={selectedMethod}
            onSelect={setSelectedMethod}
          />

          <div className="pt-4 border-t">
            <div className="flex justify-between text-lg font-bold mb-6">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button
              type="submit"
              disabled={loading || !selectedMethod}
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

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
              <p className="text-red-600 text-sm">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setOrder(null);
                  setPayment(null);
                  setError("");
                }}
                className="text-sm text-brand hover:underline"
              >
                Go back and try again
              </button>
            </div>
          )}

          {payment?.method === "STRIPE" && stripePublishableKey && (
            <StripePaymentForm
              clientSecret={payment.clientSecret}
              publishableKey={stripePublishableKey}
              onConfirm={async () => {
                await api.confirmPayment(order.id, payment.paymentIntentId);
              }}
              onSuccess={handlePaymentSuccess}
            />
          )}

          {payment?.method === "STRIPE" && !stripePublishableKey && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 space-y-2">
              <p>Stripe publishable key is not configured.</p>
              <p>
                Get <code>pk_test_...</code> from{" "}
                <a
                  href="https://dashboard.stripe.com/test/apikeys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand underline"
                >
                  Stripe Dashboard
                </a>{" "}
                and add to root <code>.env</code>:
              </p>
              <code className="block text-xs bg-red-100 p-2 rounded">
                STRIPE_PUBLISHABLE_KEY=pk_test_your_real_key
              </code>
            </div>
          )}

          {payment?.method === "PAYHERE" && (
            <PayHereCheckoutForm actionUrl={payment.actionUrl} fields={payment.fields} />
          )}

          {!payment && !error && (
            <p className="text-sm text-gray-500">Preparing payment...</p>
          )}
        </div>
      )}
    </div>
  );
}
