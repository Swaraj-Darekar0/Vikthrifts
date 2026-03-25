export type Page = 'home' | 'stores' | 'product' | 'cart' | 'checkout' | 'auth-buyer' | 'auth-seller' | 'auth-choice' | 'seller-dashboard' | 'store-detail' | 'help-center' | 'shipping' | 'returns' | 'contact' | 'profile' | 'admin-auth' | 'admin-dashboard' | 'search';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';

export interface Product {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  category: string;
  store: string;
  description: string;
  tags: string[];
  size?: 'S' | 'M' | 'L' | 'XL' | '2XL';
}

export interface AdminProduct extends Product {
  active: boolean;
}

export interface Store {
  id: string;
  name: string;
  initials: string;
  color: string;
  category?: 'clothing' | 'accessories';
  tags: string[];
  description: string;
  itemCount: number;
  rating: number;
  ratingCount?: number;
  image: string;
  owner_id?: string;
}

export interface Order {
  id: string;
  created_at: string;
  order_group_id: string;
  buyer_id: string;
  product_id: string | null;
  admin_product_id: string | null;
  product_name: string;
  product_image_url: string | null;
  product_price: number;
  product_size: string | null;
  store_id: string | null;
  store_name: string;
  seller_id: string | null;
  is_admin_order: boolean;
  receiver_name: string;
  receiver_address: string;
  receiver_contact_number: string;
  receiver_pincode: string;
  payment_method: string;
  return_policy: string;
  status: OrderStatus;
  tracking_id: string | null;
  tracking_website: string | null;
}
