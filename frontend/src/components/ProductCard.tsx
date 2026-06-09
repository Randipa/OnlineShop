import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-brand/20 transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width:768px) 100vw, 25vw"
        />
        {product.stock < 10 && product.stock > 0 && (
          <span className="absolute top-3 left-3 px-2 py-1 bg-amber-500 text-white text-xs rounded-full">
            Only {product.stock} left
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
            Out of stock
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-brand font-medium mb-1">{product.category.name}</p>
        <h3 className="font-semibold text-gray-900 group-hover:text-brand transition-colors">
          {product.name}
        </h3>
        <p className="text-lg font-bold mt-2">${Number(product.price).toFixed(2)}</p>
      </div>
    </Link>
  );
}
