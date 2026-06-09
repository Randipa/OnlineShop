"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Product } from "@/types";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  if (product.stock === 0) {
    return (
      <button disabled className="px-8 py-4 bg-gray-200 text-gray-500 rounded-xl cursor-not-allowed">
        Out of Stock
      </button>
    );
  }

  return (
    <button
      onClick={() => {
        addItem(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }}
      className="inline-flex items-center gap-2 px-8 py-4 bg-brand text-white font-semibold rounded-xl hover:bg-brand-dark transition-colors"
    >
      {added ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
      {added ? "Added!" : "Add to Cart"}
    </button>
  );
}
