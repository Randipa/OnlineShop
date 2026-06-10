import { Order, Product, User, Category } from "@/types";

function getApiUrl() {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  }
  return (
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000/api"
  );
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message =
      typeof err.message === "string"
        ? err.message
        : Array.isArray(err.message)
          ? err.message.join(", ")
          : "Request failed";
    throw new ApiError(message, res.status);
  }

  return res.json();
}

export const api = {
  getProducts: (params?: { category?: string; featured?: boolean; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set("category", params.category);
    if (params?.featured) q.set("featured", "true");
    if (params?.search) q.set("search", params.search);
    const query = q.toString();
    return request<Product[]>(`/products${query ? `?${query}` : ""}`);
  },
  getProduct: (slug: string) => request<Product>(`/products/${slug}`),
  getCategories: () => request<Category[]>("/categories"),
  login: (email: string, password: string) =>
    request<{ user: User; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string) =>
    request<{ user: User; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),
  me: () => request<User>("/auth/me"),
  createOrder: (data: { shippingAddress: string; items: { productId: string; quantity: number }[] }) =>
    request<Order>("/orders", { method: "POST", body: JSON.stringify(data) }),
  getOrder: (id: string) => request<Order>(`/orders/${id}`),
  myOrders: () => request<Order[]>("/orders/my"),
  getPaymentMethods: () =>
    request<{ methods: ("STRIPE" | "PAYHERE")[] }>("/payments/methods"),
  getStripeConfig: () =>
    request<{ configured: boolean; publishableKey: string | null }>("/payments/stripe-config"),
  initiatePayment: (orderId: string, method: "STRIPE" | "PAYHERE") =>
    request<{
      method: "STRIPE" | "PAYHERE";
      clientSecret?: string;
      paymentIntentId?: string;
      actionUrl?: string;
      fields?: Record<string, string>;
      checkoutUrl?: string;
    }>("/payments/initiate", {
      method: "POST",
      body: JSON.stringify({ orderId, method }),
    }),
  createPaymentIntent: (orderId: string) =>
    request<{ clientSecret: string; paymentIntentId: string; amount: number }>(
      "/payments/create-intent",
      {
        method: "POST",
        body: JSON.stringify({ orderId }),
      }
    ),
  confirmPayment: (orderId: string, paymentIntentId: string) =>
    request<Order>("/payments/confirm", {
      method: "POST",
      body: JSON.stringify({ orderId, paymentIntentId, method: "STRIPE" }),
    }),
  getInventory: () => request<Product[]>("/products/inventory"),
  getAllOrders: () => request<Order[]>("/orders"),
  updateOrderStatus: (id: string, status: string) =>
    request<Order>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  createProduct: (data: {
    name: string;
    slug: string;
    description: string;
    price: number;
    image: string;
    stock: number;
    featured?: boolean;
    categoryId: string;
  }) => request<Product>("/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      description: string;
      price: number;
      image: string;
      stock: number;
      featured: boolean;
      categoryId: string;
    }>
  ) => request<Product>(`/products/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteProduct: (id: string) =>
    request<Product>(`/products/${id}`, { method: "DELETE" }),
  uploadImage: async (file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${getApiUrl()}/uploads/image`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const message =
        typeof err.message === "string"
          ? err.message
          : Array.isArray(err.message)
            ? err.message.join(", ")
            : "Upload failed";
      throw new ApiError(message, res.status);
    }

    return res.json() as Promise<{ url: string; publicId: string }>;
  },
};
