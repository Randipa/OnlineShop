"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

function OrderSuccess() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      {success && (
        <>
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Order Placed!</h1>
          <p className="text-gray-500 mb-8">Thank you for your purchase.</p>
        </>
      )}
      <Link href="/products" className="text-brand hover:underline">
        Continue Shopping
      </Link>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading...</div>}>
      <OrderSuccess />
    </Suspense>
  );
}
