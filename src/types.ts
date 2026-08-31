export interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  phone?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  createdAt: string;
  avatar?: string;
}

export interface Admin {
  id: number;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  icon: string;
  itemCount?: number;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: number;
  categoryId: number;
  categoryName?: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  discountPrice?: number;
  stockQuantity: number;
  sku: string;
  rating: number;
  reviewCount: number;
  image: string;
  gallery: string[];
  tags: string[];
  isFeatured: boolean;
  isActive: boolean;
  specifications?: Record<string, string>;
  createdAt: string;
}

export interface CartItem {
  id: number;
  cartId?: number;
  productId: number;
  product: Product;
  quantity: number;
  price: number;
}

export interface Cart {
  id: number;
  userId?: number;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shippingFee: number;
  total: number;
  appliedCoupon?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
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
  paymentStatus: PaymentStatus;
  shippingStatus: OrderStatus;
  subtotal: number;
  discount: number;
  tax: number;
  shippingFee: number;
  totalAmount: number;
  trackingNumber?: string;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minSpend: number;
  description: string;
  isActive: boolean;
}

export interface AdminDashboardStats {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  totalCustomers: number;
  customersGrowth: number;
  averageOrderValue: number;
  lowStockCount: number;
  pendingOrdersCount: number;
  recentOrders: Order[];
  topProducts: {
    id: number;
    name: string;
    categoryName: string;
    price: number;
    unitsSold: number;
    revenue: number;
    image: string;
  }[];
  salesByCategory: {
    category: string;
    revenue: number;
    percentage: number;
  }[];
  monthlySales: {
    month: string;
    revenue: number;
    orders: number;
  }[];
}
