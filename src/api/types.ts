export interface Product {
  id: number;
  restaurant_id: number;
  category_id: number;
  name_uz: string;
  name_ru: string;
  description_uz?: string | null;
  description_ru?: string | null;
  image_url?: string | null;
  price: number;
  is_available: boolean;
}

export interface Category {
  id: number;
  name_uz: string;
  name_ru: string;
  image_url?: string | null;
  sort_order: number;
  products: Product[];
}

export interface Restaurant {
  id: number;
  name: string;
  description_uz?: string | null;
  description_ru?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  is_active: boolean;
  is_open: boolean;
  rating: number;
  delivery_fee: number;
  min_order: number;
  avg_delivery_minutes: number;
}

export interface RestaurantDetail extends Restaurant {
  categories: Category[];
}

export interface Address {
  id: number;
  label: string;
  address_line: string;
  lat?: number | null;
  lng?: number | null;
  entrance?: string | null;
  floor?: string | null;
  apartment?: string | null;
  comment?: string | null;
}

export type OrderStatus =
  | "pending" | "confirmed" | "preparing" | "ready"
  | "delivering" | "delivered" | "cancelled";

export interface OrderItem {
  id: number;
  product_id: number;
  name_uz: string;
  name_ru: string;
  image_url?: string | null;
  price: number;
  quantity: number;
}

export interface Order {
  id: number;
  number: string;
  restaurant_id: number;
  status: OrderStatus;
  payment_method: string;
  payment_status: string;
  items_total: number;
  delivery_fee: number;
  total: number;
  address_line: string;
  phone?: string | null;
  comment?: string | null;
  courier_delivered_at?: string | null;
  created_at: string;
  items: OrderItem[];
}

export interface User {
  id: number;
  telegram_id: number;
  username?: string | null;
  first_name?: string | null;
  phone?: string | null;
  language: string;
}
