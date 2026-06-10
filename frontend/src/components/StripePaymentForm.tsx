"use client";

import { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

function PaymentForm({
  onConfirm,
  onSuccess,
}: {
  onConfirm: () => Promise<void>;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError("");

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (submitError) {
        setError(submitError.message || "Payment failed");
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        await onConfirm();
        onSuccess();
        return;
      }

      setError("Payment was not completed. Please try again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-4 bg-brand text-white font-semibold rounded-xl hover:bg-brand-dark disabled:opacity-50"
      >
        {loading ? "Processing payment..." : "Pay Now"}
      </button>
    </form>
  );
}

export default function StripePaymentForm({
  clientSecret,
  onConfirm,
  onSuccess,
}: {
  clientSecret: string;
  onConfirm: () => Promise<void>;
  onSuccess: () => void;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  const stripePromise = useMemo(
    () => (publishableKey.startsWith("pk_") ? loadStripe(publishableKey) : null),
    [publishableKey]
  );

  if (!stripePromise) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
        Stripe is not configured. Set <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> in{" "}
        <code>.env.local</code> to accept payments.
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm onConfirm={onConfirm} onSuccess={onSuccess} />
    </Elements>
  );
}
