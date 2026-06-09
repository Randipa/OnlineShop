import Link from "next/link";
import { api } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types";
import { ArrowRight, Zap, Shield, BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let featured: Product[] = [];
  try {
    featured = (await api.getProducts({ featured: true })) as Product[];
  } catch {
    featured = [];
  }

  return (
    <>
      <section className="bg-gradient-to-br from-indigo-600 via-brand to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Shop Smarter with ShopVerse
          </h1>
          <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto mb-10">
            Full-stack e-commerce platform with real-time inventory, secure Stripe payments,
            and powerful admin dashboard.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand font-semibold rounded-xl hover:bg-indigo-50 transition-colors"
          >
            Browse Products <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {[
            { icon: Zap, title: "Lightning Fast", desc: "40% faster page loads with Next.js SSR" },
            { icon: Shield, title: "Secure Payments", desc: "Stripe-powered checkout with webhook verification" },
            { icon: BarChart3, title: "Live Inventory", desc: "Real-time stock tracking across all products" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center p-6">
              <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-brand" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-gray-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold mb-8">Featured Products</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </>
  );
}
