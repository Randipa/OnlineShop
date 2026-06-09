export interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string | number;
  image: string;
  stock: number;
  featured: boolean;
  category: Category;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  status: string;
  total: string | number;
  shippingAddress: string;
  createdAt: string;
  items: { id: string; quantity: number; price: string; product: Product }[];
}
