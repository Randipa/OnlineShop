"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { items, updateQty, removeItem, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <Link href="/products" className="text-brand hover:underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex gap-4 bg-white p-4 rounded-xl border">
              <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                <Image src={product.image} alt={product.name} fill className="object-cover" />
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-brand font-bold mt-1">${Number(product.price).toFixed(2)}</p>
                <div className="flex items-center gap-3 mt-3">
                  <button onClick={() => updateQty(product.id, quantity - 1)} className="p-1 border rounded">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-medium">{quantity}</span>
                  <button onClick={() => updateQty(product.id, quantity + 1)} className="p-1 border rounded">
                    <Plus className="w-4 h-4" />
                  </button>
                  <button onClick={() => removeItem(product.id)} className="p-1 text-red-500 ml-auto">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-xl border h-fit">
          <h2 className="font-bold text-lg mb-4">Order Summary</h2>
          <div className="flex justify-between mb-2">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-bold">${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-6">
            <span className="text-gray-500">Shipping</span>
            <span className="text-green-600">Free</span>
          </div>
          <div className="flex justify-between text-lg font-bold mb-6 pt-4 border-t">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <Link
            href="/checkout"
            className="block w-full text-center py-4 bg-brand text-white font-semibold rounded-xl hover:bg-brand-dark transition-colors"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
