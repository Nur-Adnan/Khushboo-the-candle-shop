export type Category =
  | 'floral'
  | 'fruity'
  | 'woody'
  | 'fresh'
  | 'spicy'
  | 'seasonal'
  | 'luxury'
  | 'eco-friendly';

export type Product = {
  id: string;
  name: string;
  nameBn?: string;
  description: string;
  descriptionBn?: string;
  price: number;
  category: Category;
  scentNotes: string;
  burnTime: string;
  size: string;
  imagePublicIds: string[];
  inStock: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type WishlistItem = {
  productId: string;
  addedAt: string;
  price: number;
  name: string;
  imagePublicId: string;
};

export type AnalyticsEvent = {
  type: 'product_view' | 'wishlist_add' | 'wishlist_remove' | 'order_intent' | 'product_share';
  productId: string;
  timestamp: string;
  sessionId: string;
  eventHash?: string;
};

export type AdminUser = {
  id: string;
  email: string;
  role: 'admin' | 'super_admin';
  token?: string;
  expiresAt?: string;
};

export type FeedPage = {
  products: Product[];
  nextCursor: string | null;
  total: number;
};

export type SearchFilters = {
  query?: string;
  category?: Category;
  minPrice?: number;
  maxPrice?: number;
};

export type ErrorResponse = {
  error: true;
  message: string;
  code:
    | 'VALIDATION_ERROR'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'RATE_LIMITED'
    | 'SERVER_ERROR'
    | 'NETWORK_ERROR'
    | 'TIMEOUT';
};
