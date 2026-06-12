"use client";

import { useMemo, useState } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

function isValidPublishableKey(key: string) {
  return key.startsWith("pk_") && !key.includes("your_stripe") && key.length > 20;
}

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
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !ready) return;

    setLoading(true);
    setError("");

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || "Please check your card details");
        return;
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (confirmError) {
        setError(confirmError.message || "Payment failed");
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
      <PaymentElement onReady={() => setReady(true)} />
      {!ready && (
        <p className="text-sm text-gray-500">Loading secure card form...</p>
      )}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || !ready || loading}
        className="w-full py-4 bg-brand text-white font-semibold rounded-xl hover:bg-brand-dark disabled:opacity-50"
      >
        {loading ? "Processing payment..." : "Pay Now"}
      </button>
    </form>
  );
}

export default function StripePaymentForm({
  clientSecret,
  publishableKey,
  onConfirm,
  onSuccess,
}: {
  clientSecret: string;
  publishableKey: string;
  onConfirm: () => Promise<void>;
  onSuccess: () => void;
}) {
  const stripePromise = useMemo<Promise<Stripe | null> | null>(
    () => (isValidPublishableKey(publishableKey) ? loadStripe(publishableKey) : null),
    [publishableKey]
  );

  if (!stripePromise) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 space-y-2">
        <p>Stripe publishable key is missing or invalid.</p>
        <p>
          Add your real <code>pk_test_...</code> key to root <code>.env</code> as{" "}
          <code>STRIPE_PUBLISHABLE_KEY</code>, then rebuild frontend:
        </p>
        <code className="block text-xs bg-red-100 p-2 rounded">
          docker compose up -d --build frontend
        </code>
      </div>
    );
  }

  return (
    <Elements
      key={clientSecret}
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: "stripe" },
      }}
    >
      <PaymentForm onConfirm={onConfirm} onSuccess={onSuccess} />
    </Elements>
  );
}
