"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Order } from "@/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user && id) {
      api
        .getOrder(id)
        .then(setOrder)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user, id]);

  if (authLoading || loading) return <LoadingSpinner />;

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <p className="mb-4">Please sign in to view this order.</p>
        <Link href="/login" className="text-brand hover:underline">
          Sign In
        </Link>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <p className="text-red-500">{error || "Order not found"}</p>
        <Link href="/orders" className="text-brand hover:underline mt-4 inline-block">
          My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {success && (
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Order Placed!</h1>
          <p className="text-gray-500">Thank you for your purchase.</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">Order #{order.id.slice(-8)}</h2>
            <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
            {order.status}
          </span>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Shipping Address</p>
          <p>{order.shippingAddress}</p>
        </div>

        <div className="border-t pt-4 space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.product.name} × {item.quantity}
              </span>
              <span>${(Number(item.price) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>${Number(order.total).toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-4 justify-center mt-8">
        <Link href="/orders" className="text-brand hover:underline">
          My Orders
        </Link>
        <Link href="/products" className="text-brand hover:underline">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <OrderDetail />
    </Suspense>
  );
}
