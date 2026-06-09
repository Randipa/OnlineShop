import { api } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { Product, Category } from "@/types";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const params = await searchParams;
  let products: Product[] = [];
  let categories: Category[] = [];

  try {
    [products, categories] = await Promise.all([
      api.getProducts({ category: params.category, search: params.search }) as Promise<Product[]>,
      api.getCategories() as Promise<Category[]>,
    ]);
  } catch {
    products = [];
    categories = [];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">All Products</h1>

      <div className="flex flex-wrap gap-2 mb-8">
        <a
          href="/products"
          className={`px-4 py-2 rounded-full text-sm ${!params.category ? "bg-brand text-white" : "bg-white border"}`}
        >
          All
        </a>
        {categories.map((cat) => (
          <a
            key={cat.id}
            href={`/products?category=${cat.slug}`}
            className={`px-4 py-2 rounded-full text-sm ${params.category === cat.slug ? "bg-brand text-white" : "bg-white border"}`}
          >
            {cat.name}
          </a>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {products.length === 0 && (
        <p className="text-center text-gray-500 py-12">No products found.</p>
      )}
    </div>
  );
}
