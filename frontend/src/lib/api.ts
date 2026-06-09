const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Request failed");
  }

  return res.json();
}

export const api = {
  getProducts: (params?: { category?: string; featured?: boolean; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set("category", params.category);
    if (params?.featured) q.set("featured", "true");
    if (params?.search) q.set("search", params.search);
    return request(`/products?${q}`);
  },
  getProduct: (slug: string) => request(`/products/${slug}`),
  getCategories: () => request("/categories"),
  login: (email: string, password: string) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),
  me: () => request("/auth/me"),
  createOrder: (data: { shippingAddress: string; items: { productId: string; quantity: number }[] }) =>
    request("/orders", { method: "POST", body: JSON.stringify(data) }),
  myOrders: () => request("/orders/my"),
  createPaymentIntent: (orderId: string) =>
    request("/payments/create-intent", { method: "POST", body: JSON.stringify({ orderId }) }),
  getInventory: () => request("/products/inventory"),
  getAllOrders: () => request("/orders"),
  updateOrderStatus: (id: string, status: string) =>
    request(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
};
