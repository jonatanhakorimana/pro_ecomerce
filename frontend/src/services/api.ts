import axios from "axios";
import { User, Product, Category, Cart, Order, AdminDashboardStats, Review, Coupon } from "../types";
import { getApiBaseUrl } from "../config/api.config";

// Create Axios client instance with dynamic base URL
const apiClient = axios.create({
  headers: {
    "Content-Type": "application/json"
  }
});

const getGuestSessionId = (): string => {
  const storageKey = "shopeazy_guest_session";
  let sessionId = localStorage.getItem(storageKey);
  if (!sessionId) {
    sessionId = `guest_${crypto.randomUUID()}`;
    localStorage.setItem(storageKey, sessionId);
  }
  return sessionId;
};

// Dynamic base URL & JWT token interceptor
apiClient.interceptors.request.use((config) => {
  // Use dynamically configured backend API base URL
  config.baseURL = getApiBaseUrl();

  const token = localStorage.getItem("shopeazy_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Authentication
  auth: {
    register: async (data: { name: string; email: string; password: string; phone?: string; address?: string; city?: string; zipCode?: string }) => {
      const res = await apiClient.post<{ status: string; message: string; token: string; user: User }>("/auth/register", data);
      if (res.data.token) {
        localStorage.setItem("shopeazy_token", res.data.token);
      }
      return res.data;
    },
    login: async (data: { email: string; password: string; role?: string }) => {
      const res = await apiClient.post<{ status: string; message: string; token: string; user: User }>("/auth/login", data);
      if (res.data.token) {
        localStorage.setItem("shopeazy_token", res.data.token);
      }
      return res.data;
    },
    getMe: async () => {
      const res = await apiClient.get<{ status: string; user: User }>("/auth/me");
      return res.data.user;
    },
    getProfile: async () => {
      const res = await apiClient.get<{ status: string; user: User }>("/auth/me");
      return res.data.user;
    },
    updateProfile: async (data: Partial<User>) => {
      const res = await apiClient.put<{ status: string; message: string; user: User }>("/auth/profile", data);
      return res.data;
    },
    logout: () => {
      localStorage.removeItem("shopeazy_token");
    }
  },

  // Categories
  categories: {
    getAll: async () => {
      const res = await apiClient.get<{ status: string; data: Category[] }>("/categories");
      return res.data.data;
    }
  },

  // Products
  products: {
    getAll: async (params?: {
      search?: string;
      category?: string | number;
      minPrice?: number;
      maxPrice?: number;
      sort?: string;
      featured?: boolean;
      inStock?: boolean;
    }) => {
      const res = await apiClient.get<{ status: string; total: number; data: Product[] }>("/products", { params });
      return res.data.data;
    },
    getById: async (id: number) => {
      const res = await apiClient.get<{ status: string; data: Product & { reviews: Review[]; relatedProducts: Product[] } }>(`/products/${id}`);
      return res.data.data;
    },
    addReview: async (productId: number, data: { userName: string; rating: number; comment: string }) => {
      const res = await apiClient.post<{ status: string; message: string; data: Review; productRating: number; productReviewCount: number }>(
        `/products/${productId}/reviews`,
        data
      );
      return res.data;
    }
  },

  // Cart
  cart: {
    getCart: async (coupon?: string) => {
      const res = await apiClient.get<{ status: string; data: Cart }>("/cart", {
        params: { coupon, sessionId: getGuestSessionId() }
      });
      return res.data.data;
    },
    addToCart: async (productId: number, quantity: number = 1) => {
      const res = await apiClient.post<{ status: string; message: string; data: Cart }>("/cart/items", {
        productId,
        quantity,
        sessionId: getGuestSessionId()
      });
      return res.data.data;
    },
    updateQuantity: async (itemId: number, quantity: number) => {
      const res = await apiClient.put<{ status: string; data: Cart }>(`/cart/items/${itemId}`, {
        quantity,
        sessionId: getGuestSessionId()
      });
      return res.data.data;
    },
    removeItem: async (itemId: number) => {
      const res = await apiClient.delete<{ status: string; message: string; data: Cart }>(`/cart/items/${itemId}`, {
        params: { sessionId: getGuestSessionId() }
      });
      return res.data.data;
    },
    clearCart: async () => {
      const res = await apiClient.delete<{ status: string; message: string; data: Cart }>("/cart/clear", {
        params: { sessionId: getGuestSessionId() }
      });
      return res.data.data;
    },
    applyCoupon: async (code: string, subtotal: number) => {
      const res = await apiClient.post<{ status: string; message: string; data: Coupon }>("/coupons/validate", { code, subtotal });
      return res.data;
    }
  },

  // Orders
  orders: {
    checkout: async (data: {
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      shippingAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
      };
      shippingMethod: string;
      paymentMethod: string;
      items: { productId: number; quantity: number; price: number; productName?: string; productImage?: string }[];
      couponCode?: string;
      notes?: string;
    }) => {
      const res = await apiClient.post<{ status: string; message: string; order: Order; paymentUrl?: string }>("/orders", data);
      return res.data;
    },
    getMyOrders: async (email?: string) => {
      const res = await apiClient.get<{ status: string; total: number; data: Order[] }>("/orders", { params: { email } });
      return res.data.data;
    },
    getById: async (id: number | string) => {
      const res = await apiClient.get<{ status: string; data: Order }>(`/orders/${id}`);
      return res.data.data;
    },
    track: async (trackingNumber: string) => {
      const res = await apiClient.get<{
        status: string;
        data: {
          order: Order;
          trackingEvents: { status: string; date: string; location: string; note?: string; completed: boolean }[];
        };
      }>(`/orders/track/${trackingNumber}`);
      return res.data.data;
    }
  },

  // Admin APIs
  admin: {
    getDashboardStats: async () => {
      const res = await apiClient.get<{ status: string; data: AdminDashboardStats }>("/admin/dashboard");
      return res.data.data;
    },
    getProducts: async () => {
      const res = await apiClient.get<{ status: string; total: number; data: Product[] }>("/admin/products");
      return res.data.data;
    },
    createProduct: async (productData: Partial<Product>) => {
      const res = await apiClient.post<{ status: string; message: string; data: Product }>("/admin/products", productData);
      return res.data;
    },
    updateProduct: async (id: number, productData: Partial<Product>) => {
      const res = await apiClient.put<{ status: string; message: string; data: Product }>(`/admin/products/${id}`, productData);
      return res.data;
    },
    deleteProduct: async (id: number) => {
      const res = await apiClient.delete<{ status: string; message: string }>(`/admin/products/${id}`);
      return res.data;
    },
    getCategories: async () => {
      const res = await apiClient.get<{ status: string; data: Category[] }>("/admin/categories");
      return res.data.data;
    },
    createCategory: async (categoryData: Partial<Category>) => {
      const res = await apiClient.post<{ status: string; message: string; data: Category }>("/admin/categories", categoryData);
      return res.data;
    },
    updateCategory: async (id: number, categoryData: Partial<Category>) => {
      const res = await apiClient.put<{ status: string; message: string; data: Category }>(`/admin/categories/${id}`, categoryData);
      return res.data;
    },
    deleteCategory: async (id: number) => {
      const res = await apiClient.delete<{ status: string; message: string }>(`/admin/categories/${id}`);
      return res.data;
    },
    getOrders: async (params?: { status?: string; search?: string }) => {
      const res = await apiClient.get<{ status: string; total: number; data: Order[] }>("/admin/orders", { params });
      return res.data.data;
    },
    updateOrderStatus: async (
      id: number | string,
      statusOrData: string | { shippingStatus?: string; paymentStatus?: string; trackingNumber?: string; location?: string; statusNote?: string },
      trackingNumber?: string
    ) => {
      const payload =
        typeof statusOrData === "string"
          ? { shippingStatus: statusOrData, trackingNumber }
          : statusOrData;
      const res = await apiClient.put<{ status: string; message: string; data: Order }>(`/admin/orders/${id}/status`, payload);
      return res.data;
    },
    getCustomers: async () => {
      const res = await apiClient.get<{ status: string; total: number; data: User[] }>("/admin/users");
      return res.data.data;
    }
  },

  // System & Schema docs
  system: {
    getSchemaDocs: async () => {
      const res = await apiClient.get<{
        status: string;
        tables: string[];
        mysqlSchema: string;
        phpPdoCode: string;
        restEndpoints: { method: string; path: string; description: string }[];
      }>("/system/schema-docs");
      return res.data;
    }
  }
};
