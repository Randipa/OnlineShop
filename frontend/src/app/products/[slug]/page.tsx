import Image from "next/image";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { Product } from "@/types";
import AddToCartButton from "./AddToCartButton";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let product: Product;

  try {
    product = (await api.getProduct(slug)) as Product;
  } catch {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-12">
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
          <Image src={product.image} alt={product.name} fill className="object-cover" priority />
        </div>
        <div>
          <p className="text-brand font-medium mb-2">{product.category.name}</p>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <p className="text-3xl font-bold text-brand mb-6">${Number(product.price).toFixed(2)}</p>
          <p className="text-gray-600 leading-relaxed mb-8">{product.description}</p>
          <p className="text-sm text-gray-500 mb-6">
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>
          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );
}
