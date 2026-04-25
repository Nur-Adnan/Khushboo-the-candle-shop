# KHUSBOOO — Design Document
## For Kiro with Claude Haiku 4.5

---

## 1. System Overview

KHUSBOOO is a two-part system:

- **Mobile App** (React Native / Expo) — user-facing candle discovery feed with wishlist, search, and WhatsApp ordering
- **Backend API** (Node.js / Express) — REST API for products, categories, analytics, and admin auth
- **Database** (PostgreSQL) — stores products, categories, analytics events
- **Image CDN** (Cloudinary) — stores and serves optimized product images

```
Mobile App (Expo)
      │
      ▼
Backend API (Express on Node.js)
      │              │
      ▼              ▼
PostgreSQL      Cloudinary
```

---

## 2. Folder Structure

### Mobile App (`/mobile`)

```
mobile/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          ← Home Feed
│   │   ├── explore.tsx        ← Category Browse
│   │   └── wishlist.tsx       ← Wishlist Screen
│   ├── product/
│   │   └── [id].tsx           ← Product Details
│   ├── search.tsx             ← Search Screen
│   └── admin/
│       ├── login.tsx          ← Admin Login
│       ├── dashboard.tsx      ← Admin Dashboard
│       ├── products.tsx       ← Product List (admin)
│       ├── product-form.tsx   ← Add / Edit Product
│       └── analytics.tsx      ← Analytics Dashboard
├── components/
│   ├── ProductCard.tsx        ← Single card in feed grid
│   ├── ProductGrid.tsx        ← 2-column scrollable grid
│   ├── CategoryCard.tsx       ← Category tile
│   ├── ImageCarousel.tsx      ← Product image carousel
│   ├── WishlistButton.tsx     ← Add/Remove from wishlist
│   ├── OfflineBanner.tsx      ← "Offline Mode" indicator
│   ├── Toast.tsx              ← Success/error toast
│   └── LoadingSpinner.tsx     ← Loading indicator
├── hooks/
│   ├── useFeed.ts             ← Feed pagination logic
│   ├── useWishlist.ts         ← Wishlist CRUD with AsyncStorage
│   ├── useSearch.ts           ← Search with debounce
│   ├── useNetworkStatus.ts    ← Online/offline detection
│   └── useAnalytics.ts        ← Event tracking + queue
├── store/
│   └── useAppStore.ts         ← Zustand global store
├── services/
│   ├── api.ts                 ← Axios instance + interceptors
│   ├── cache.ts               ← AsyncStorage cache helpers
│   ├── cloudinary.ts          ← Image upload helper
│   └── analytics.ts           ← Event batching + sync
├── constants/
│   ├── strings.ts             ← All UI text (Bengali + English)
│   └── config.ts              ← API URL, Cloudinary config, limits
└── types/
    └── index.ts               ← Shared TypeScript types
```

### Backend (`/backend`)

```
backend/
├── src/
│   ├── routes/
│   │   ├── products.ts        ← GET /products, POST, PUT, DELETE
│   │   ├── categories.ts      ← GET /categories
│   │   ├── search.ts          ← GET /search
│   │   ├── analytics.ts       ← POST /analytics/events, GET /analytics
│   │   └── auth.ts            ← POST /auth/login, POST /auth/logout
│   ├── middleware/
│   │   ├── auth.ts            ← JWT verification middleware
│   │   ├── rateLimit.ts       ← express-rate-limit setup
│   │   └── errorHandler.ts    ← Global error handler
│   ├── db/
│   │   ├── index.ts           ← PostgreSQL connection (pg pool)
│   │   └── migrations/        ← SQL migration files
│   └── index.ts               ← Express app entry point
└── package.json
```

---

## 3. Data Models

### TypeScript Types (shared)

```typescript
// types/index.ts

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;           // stored in BDT paisa (e.g., 50000 = ৳500)
  category: Category;
  scentNotes: string;
  burnTime: string;        // e.g., "40-50 hours"
  size: string;            // e.g., "200g"
  imagePublicIds: string[]; // Cloudinary public IDs (NOT full URLs)
  inStock: boolean;
  isActive: boolean;
  createdAt: string;       // ISO date string
};

export type Category = 
  | 'floral' | 'fruity' | 'woody' | 'fresh' 
  | 'spicy' | 'seasonal' | 'luxury' | 'eco-friendly';

export type WishlistItem = {
  productId: string;
  addedAt: string;         // ISO date string
  price: number;
  name: string;
  imagePublicId: string;   // Cloudinary public ID
};

export type AnalyticsEvent = {
  type: 'product_view' | 'wishlist_add' | 'wishlist_remove' | 'order_intent' | 'product_share';
  productId: string;
  timestamp: string;       // ISO date string
  sessionId: string;       // random UUID per app session, not tied to user
  eventHash?: string;      // SHA256 hash for deduplication (optional, generated server-side)
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
  code: 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'RATE_LIMITED' | 'SERVER_ERROR' | 'NETWORK_ERROR' | 'TIMEOUT';
};
```

---

### PostgreSQL Schema

```sql
-- migrations/001_initial_schema.sql

CREATE TABLE categories (
  id VARCHAR(50) PRIMARY KEY,   -- e.g., 'floral', 'fruity'
  name VARCHAR(100) NOT NULL,
  name_bn VARCHAR(100),         -- Bengali name
  image_url TEXT,
  image_public_id VARCHAR(255), -- Cloudinary public ID for image
  product_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  name_bn VARCHAR(200),
  description TEXT,
  description_bn TEXT,
  price INTEGER NOT NULL,       -- BDT in paisa
  category_id VARCHAR(50) REFERENCES categories(id),
  scent_notes TEXT,
  burn_time VARCHAR(50),
  size VARCHAR(50),
  image_public_ids TEXT[],      -- array of Cloudinary public IDs (NOT full URLs)
  in_stock BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(200) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,  -- bcrypt, 10+ rounds
  role VARCHAR(50) DEFAULT 'admin', -- 'admin' or 'super_admin'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE token_blacklist (
  token_hash VARCHAR(255) PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,  -- product_view, wishlist_add, wishlist_remove, order_intent, product_share
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  session_id VARCHAR(100),          -- anonymous, not tied to any user
  event_hash VARCHAR(255),          -- SHA256 hash for deduplication
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_created ON products(created_at DESC);
CREATE INDEX idx_analytics_product ON analytics_events(product_id);
CREATE INDEX idx_analytics_created ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_event_hash ON analytics_events(event_hash);
CREATE INDEX idx_token_blacklist_expires ON token_blacklist(expires_at);

-- Full-text search index for product search
CREATE INDEX idx_products_search ON products 
  USING GIN(to_tsvector('english', name || ' ' || scent_notes));

-- Unique constraint for event deduplication
ALTER TABLE analytics_events ADD CONSTRAINT unique_event_hash_recent 
  UNIQUE (event_hash) WHERE created_at > NOW() - INTERVAL '5 minutes';
```

---

## 4. State Management (Zustand)

```typescript
// store/useAppStore.ts

type AppStore = {
  // Feed state
  feedProducts: Product[];
  feedCursor: string | null;
  feedLoading: boolean;
  setFeedProducts: (products: Product[], cursor: string | null) => void;
  appendFeedProducts: (products: Product[], cursor: string | null) => void;

  // Wishlist state
  wishlist: WishlistItem[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Network state
  isOnline: boolean;
  setOnline: (online: boolean) => void;

  // Admin state
  adminToken: string | null;
  adminEmail: string | null;
  setAdmin: (token: string, email: string) => void;
  clearAdmin: () => void;

  // Analytics queue (offline buffer)
  analyticsQueue: AnalyticsEvent[];
  queueEvent: (event: AnalyticsEvent) => void;
  clearQueue: () => void;
};
```

---

## 5. API Design

### Base URL
- Development: `http://localhost:3000/api/v1`
- Production: `https://api.khusbooo.com/api/v1`

### Endpoints

#### Products

```
GET    /api/v1/products
  Query params: cursor, limit (default 12), category, active
  Response: { products: Product[], nextCursor: string|null, total: number }

GET    /api/v1/products/:id
  Response: { product: Product }

POST   /api/v1/products           ← Admin only (JWT required)
  Body: { name, description, price, category, scentNotes, burnTime, size, images, thumbnails }
  Response: { product: Product }

PUT    /api/v1/products/:id       ← Admin only
  Body: partial Product fields
  Response: { product: Product }

DELETE /api/v1/products/:id       ← Admin only
  Response: { success: true }
```

#### Categories

```
GET    /api/v1/categories
  Response: { categories: [{ id, name, name_bn, image_url, product_count }] }
```

#### Search

```
GET    /api/v1/search
  Query params: q, category, minPrice, maxPrice, cursor, limit (default 20)
  Response: { products: Product[], nextCursor: string|null, total: number }

GET    /api/v1/search/suggestions
  Query params: q
  Response: { suggestions: string[] }
```

#### Auth

```
POST   /api/v1/auth/login
  Body: { email, password }
  Response: { token: string, expiresAt: string }

POST   /api/v1/auth/logout        ← Admin only
  Response: { success: true }
```

#### Analytics

```
POST   /api/v1/analytics/events
  Body: { events: AnalyticsEvent[] }   ← batch upload
  Response: { received: number }

GET    /api/v1/analytics           ← Admin only
  Query params: startDate, endDate
  Response: {
    totalViews: number,
    totalWishlistAdds: number,
    totalOrderIntents: number,
    topProducts: [{ product: Product, viewCount: number }]
  }
```

### Error Response Format

```json
{
  "error": true,
  "message": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

### HTTP Status Codes Used
- `200` — success
- `201` — created
- `400` — bad request / validation error
- `401` — not authenticated
- `403` — forbidden (wrong role)
- `404` — not found
- `429` — rate limited
- `500` — server error

---

## 6. Key Component Designs

### ProductCard

```
Props:
  product: Product
  onPress: () => void
  isInWishlist: boolean
  onWishlistToggle: () => void

Layout:
  ┌──────────────┐
  │   Image      │  ← Cloudinary thumbnail (480px)
  │              │
  │         ♡   │  ← wishlist icon, top-right overlay
  ├──────────────┤
  │ Product Name │  ← 14px, max 2 lines
  │ ৳ 500       │  ← 13px, muted color
  └──────────────┘
```

### ProductGrid

```
Props:
  products: Product[]
  onEndReached: () => void
  refreshing: boolean
  onRefresh: () => void

Uses FlatList with:
  - numColumns={2}
  - onEndReachedThreshold={0.5}
  - keyExtractor by product.id
```

### ImageCarousel

```
Props:
  images: string[]
  thumbnails: string[]

Behavior:
  - Horizontal swipe between images
  - Dot indicators at bottom
  - Pinch-to-zoom using react-native-gesture-handler
  - On low-end devices: load thumbnail first, swap to full on idle
```

### WishlistButton

```
Props:
  productId: string
  product: Product

State: reads from Zustand isInWishlist()
On press: calls addToWishlist or removeFromWishlist
Shows: filled heart if in wishlist, outline if not
```

### OfflineBanner

```
Reads: useNetworkStatus hook
Renders: yellow banner at top of screen when isOnline === false
Text: "আপনি অফলাইনে আছেন" (You are offline)
```

---

## 7. Caching Strategy

All caching uses AsyncStorage with these key patterns:

| Cache Key | Content | TTL |
|-----------|---------|-----|
| `cache:feed:page:1` | First page of feed products | 24 hours |
| `cache:product:{id}` | Full product details | 7 days |
| `cache:categories` | All category data | 24 hours |
| `cache:search:{query}` | Search results per query | 1 hour |
| `wishlist` | All wishlist items | No expiry |
| `search:recent` | Last 10 search queries | No expiry |
| `analytics:queue` | Offline queued events | Until synced |

Cache helper functions (`services/cache.ts`):
- `setCache(key, data, ttlMs)` — stores with expiry timestamp
- `getCache(key)` — returns data if not expired, null if expired
- `clearExpiredCache()` — removes all expired entries
- `getCacheSize()` — returns total cache size in bytes
- `evictOldestCache()` — removes oldest entries when over 50MB

---

## 8. Image URL Helpers

Cloudinary URLs are built with transformation parameters:

```typescript
// services/cloudinary.ts

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;

// For product feed thumbnails (low-end devices)
export function getThumbnailUrl(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_480,f_webp,q_80/${publicId}`;
}

// For product detail images (high-end devices)
export function getFullUrl(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_1200,f_webp,q_80/${publicId}`;
}

// For category tiles
export function getCategoryUrl(publicId: string, lowEnd = false): string {
  const w = lowEnd ? 240 : 480;
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${w},f_webp,q_80/${publicId}`;
}
```

---

## 9. WhatsApp Order Flow

When user taps "Order via WhatsApp":

```typescript
// Pre-filled Bengali message
const message = `আমি এই মোমবাতিটি অর্ডার করতে চাই:\n\n` +
  `নাম: ${product.name}\n` +
  `মূল্য: ৳${(product.price / 100).toFixed(0)}\n` +
  `লিংক: https://khusbooo.com/product/${product.id}`;

const encoded = encodeURIComponent(message);
const url = `whatsapp://send?text=${encoded}`;
Linking.openURL(url);
```

---

## 10. Analytics Event Flow

```
User action (e.g., tap product)
        │
        ▼
useAnalytics.trackEvent(event)
        │
   isOnline?
   YES ──► POST /api/v1/analytics/events  (batch every 5 min)
   NO  ──► Store in analyticsQueue (Zustand + AsyncStorage)
                    │
              isOnline restored?
                    │ YES
                    ▼
              Flush queue to API
              Clear queue from storage
```

---

## 11. Admin Auth Flow

```
Admin enters email + password
        │
        ▼
POST /api/v1/auth/login
        │
   Valid?
   YES ──► receive JWT token
           store in SecureStore (Expo)
           navigate to /admin/dashboard
   NO  ──► show "Invalid email or password"
           increment attempt count
           if 5 attempts in 15 min → lock for 15 min
```

JWT middleware on backend:
- Check `Authorization: Bearer <token>` header
- Verify with `jsonwebtoken.verify()`
- Attach `req.admin` if valid
- Return 401 if missing or expired

---

## 12. Environment Variables

### Mobile App (`.env`)
```
EXPO_PUBLIC_API_URL=https://api.khusbooo.com/api/v1
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
EXPO_PUBLIC_WHATSAPP_NUMBER=8801XXXXXXXXX
```

### Backend (`.env`)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/khusbooo
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=3000
```

---

## 13. Third-Party Libraries

### Mobile App
| Library | Purpose |
|---------|---------|
| `expo-router` | File-based navigation |
| `expo-secure-store` | Secure JWT storage |
| `expo-image-picker` | Camera / photo library access |
| `expo-sharing` | Native share sheet |
| `expo-network` | Network status detection |
| `@react-native-async-storage/async-storage` | Local cache + wishlist |
| `zustand` | Global state management |
| `axios` | HTTP client |
| `react-native-gesture-handler` | Pinch-to-zoom on carousel |
| `react-native-reanimated` | Smooth animations |

### Backend
| Library | Purpose |
|---------|---------|
| `express` | HTTP server |
| `pg` | PostgreSQL client |
| `jsonwebtoken` | JWT creation and verification |
| `bcrypt` | Password hashing |
| `express-rate-limit` | Rate limiting |
| `cloudinary` | Cloudinary SDK for deletes |
| `cors` | CORS headers |
| `helmet` | Security headers |
| `dotenv` | Environment variables |
| `winston` or `pino` | Server-side error logging |

---

## 14. Low-End Device Strategy

Detection approach: use `expo-device` to check `totalMemory`. If under 2GB:

- Load images at 480px instead of 1200px
- Limit feed cache to 2 pages in memory
- Use thumbnail-first loading in carousel
- Load category images at 240px
- Limit search results to 20 per page

Store detection result in Zustand: `isLowEndDevice: boolean`
Check once on app startup in `app/_layout.tsx`.

---

## 15. Image Crop & Rotate

When admin selects an image for upload:

1. Show preview with crop and rotate controls
2. Crop: allow free-form or preset aspect ratios (1:1, 4:3, 16:9)
3. Rotate: 90° increments (0°, 90°, 180°, 270°)
4. On confirm: apply transformations to the image in memory
5. Then upload the edited image to Cloudinary

Use library: `react-native-image-crop-picker` or `expo-image-manipulator` for client-side editing.

---

## 16. Image URL Generation Strategy

**CRITICAL FIX:** Store only Cloudinary public IDs in database, generate URLs on-the-fly.

### Why This Approach?
- Reduces database size (public IDs are short strings, not full URLs)
- Allows URL transformation changes without data migration
- Enables responsive image serving based on device capabilities
- Simplifies image deletion (just delete by public ID)

### Implementation

```typescript
// services/cloudinary.ts

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;

// Generate thumbnail URL (480px, WebP, quality 80)
export function getThumbnailUrl(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_480,f_webp,q_80/${publicId}`;
}

// Generate full-size URL (1200px, WebP, quality 80)
export function getFullUrl(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_1200,f_webp,q_80/${publicId}`;
}

// Generate category image URL (240px or 480px based on device)
export function getCategoryUrl(publicId: string, lowEnd = false): string {
  const w = lowEnd ? 240 : 480;
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${w},f_webp,q_80/${publicId}`;
}

// Generate JPEG fallback for older Android versions
export function getJpegUrl(publicId: string, width: number): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},f_jpg,q_80/${publicId}`;
}
```

### Database Storage
- Store only `image_public_ids: string[]` in products table
- Store only `image_public_id: string` in categories table
- Never store full URLs in database

### API Response
```json
{
  "product": {
    "id": "uuid",
    "name": "Rose Candle",
    "imagePublicIds": ["khusbooo/product-123-img1", "khusbooo/product-123-img2"],
    "price": 50000
  }
}
```

### Frontend Usage
```typescript
// In ProductCard component
const thumbnailUrl = getThumbnailUrl(product.imagePublicIds[0]);
const fullUrl = getFullUrl(product.imagePublicIds[0]);
```

---

## 17. Cache Invalidation Strategy

**CRITICAL FIX:** Implement cache invalidation when admin updates/deletes products.

### Cache Invalidation Triggers

1. **Product Created:** No cache invalidation needed (new product)
2. **Product Updated:** Invalidate `cache:product:{id}` and `cache:feed:page:*`
3. **Product Deleted:** Invalidate `cache:product:{id}` and `cache:feed:page:*`
4. **Product Status Changed:** Invalidate `cache:feed:page:*`
5. **Category Updated:** Invalidate `cache:categories`

### Implementation

```typescript
// backend/src/services/cacheInvalidation.ts

export async function invalidateProductCache(productId: string): Promise<void> {
  // In MVP: no-op (stateless API, no server-side cache)
  // In future: implement Redis cache invalidation
  // For now: rely on client-side cache TTL
}

export async function invalidateFeedCache(): Promise<void> {
  // Invalidate all feed pages
  // Pattern: cache:feed:page:*
  // In MVP: no-op (client-side cache only)
}

export async function invalidateCategoriesCache(): Promise<void> {
  // Invalidate categories cache
  // Key: cache:categories
  // In MVP: no-op (client-side cache only)
}
```

### Client-Side Cache Invalidation

When admin updates/deletes products, the mobile app should:
1. Clear affected cache keys immediately
2. Refresh the feed on next navigation
3. Show success toast to confirm

---

## 18. Pagination Strategy (Timestamp-Based)

**CRITICAL FIX:** Use timestamp-based pagination instead of UUID-based.

### Why Timestamp-Based?
- UUIDs are random, not sequential
- Timestamp-based cursors are stable even if new products are added
- Prevents skipping products or showing duplicates

### Implementation

```sql
-- GET /api/v1/products
-- First page: no cursor
SELECT * FROM products 
WHERE is_active = true 
ORDER BY created_at DESC 
LIMIT 12;

-- Next page: cursor = last_product.created_at (ISO string)
SELECT * FROM products 
WHERE is_active = true 
  AND created_at < $1::TIMESTAMPTZ
ORDER BY created_at DESC 
LIMIT 12;
```

### API Response
```json
{
  "products": [...],
  "nextCursor": "2025-04-25T10:30:00Z",
  "total": 150
}
```

### Handling Ties
If multiple products have the same `created_at`, use secondary sort by `id`:
```sql
SELECT * FROM products 
WHERE is_active = true 
  AND (created_at < $1::TIMESTAMPTZ 
    OR (created_at = $1::TIMESTAMPTZ AND id < $2::UUID))
ORDER BY created_at DESC, id DESC
LIMIT 12;
```

---

## 19. Token Blacklist & Logout Implementation

**CRITICAL FIX:** Implement token blacklist for logout functionality.

### Token Blacklist Table
```sql
CREATE TABLE token_blacklist (
  token_hash VARCHAR(255) PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_token_blacklist_expires ON token_blacklist(expires_at);
```

### Logout Flow

1. **Client:** POST `/api/v1/auth/logout` with JWT in Authorization header
2. **Server:** 
   - Extract JWT from header
   - Hash JWT using SHA256
   - Insert hash into token_blacklist with expires_at = JWT expiry time
   - Return `{ success: true }`
3. **Client:** Clear token from SecureStore, navigate to login

### JWT Middleware

```typescript
// backend/src/middleware/auth.ts

export async function verifyJWT(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: true, message: 'Unauthorized', code: 'UNAUTHORIZED' });
  }
  
  try {
    // Check if token is blacklisted
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const blacklisted = await db.query(
      'SELECT 1 FROM token_blacklist WHERE token_hash = $1',
      [tokenHash]
    );
    
    if (blacklisted.rows.length > 0) {
      return res.status(401).json({ error: true, message: 'Token revoked', code: 'UNAUTHORIZED' });
    }
    
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: true, message: 'Invalid token', code: 'UNAUTHORIZED' });
  }
}
```

### Cleanup Job

```typescript
// backend/src/jobs/cleanupBlacklist.ts

// Run daily: delete expired tokens from blacklist
export async function cleanupExpiredTokens() {
  await db.query(
    'DELETE FROM token_blacklist WHERE expires_at < NOW()'
  );
}
```

---

## 20. Admin User Management

**HIGH PRIORITY FIX:** Add admin user management endpoints.

### New Endpoints

```
POST   /api/v1/admin/users        ← Super admin only
  Body: { email, password, role: 'admin' | 'super_admin' }
  Response: { user: AdminUser }

GET    /api/v1/admin/users        ← Super admin only
  Response: { users: AdminUser[] }

DELETE /api/v1/admin/users/:id    ← Super admin only
  Response: { success: true }

PATCH  /api/v1/admin/users/:id/role ← Super admin only
  Body: { role: 'admin' | 'super_admin' }
  Response: { user: AdminUser }
```

### Role-Based Access Control

```typescript
// backend/src/middleware/rbac.ts

export function requireRole(role: 'admin' | 'super_admin') {
  return (req, res, next) => {
    if (req.admin.role !== role && req.admin.role !== 'super_admin') {
      return res.status(403).json({ 
        error: true, 
        message: 'Insufficient permissions', 
        code: 'FORBIDDEN' 
      });
    }
    next();
  };
}
```

---

## 21. Analytics Data Retention & Archival

**HIGH PRIORITY FIX:** Define analytics data retention policy.

### Retention Policy

- **Hot Data (0-30 days):** Keep in PostgreSQL for fast queries
- **Warm Data (31-90 days):** Keep in PostgreSQL but archive to S3 nightly
- **Cold Data (90+ days):** Delete from PostgreSQL, keep in S3 for compliance

### Implementation

```typescript
// backend/src/jobs/archiveAnalytics.ts

export async function archiveOldAnalytics() {
  // Archive events older than 30 days to S3
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const events = await db.query(
    'SELECT * FROM analytics_events WHERE created_at < $1',
    [thirtyDaysAgo]
  );
  
  if (events.rows.length > 0) {
    // Upload to S3
    const s3Key = `analytics/archive-${Date.now()}.json.gz`;
    await uploadToS3(s3Key, gzip(JSON.stringify(events.rows)));
    
    // Delete from database
    await db.query(
      'DELETE FROM analytics_events WHERE created_at < $1',
      [thirtyDaysAgo]
    );
  }
}

export async function deleteOldAnalytics() {
  // Delete events older than 90 days
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  
  await db.query(
    'DELETE FROM analytics_events WHERE created_at < $1',
    [ninetyDaysAgo]
  );
}
```

---

## 22. Error Code Standardization

**HIGH PRIORITY FIX:** Define standard error codes for all API responses.

### Error Codes

| Code | HTTP | Meaning | Retry? | Example |
|------|------|---------|--------|---------|
| VALIDATION_ERROR | 400 | Invalid input | No | Missing required field |
| UNAUTHORIZED | 401 | Missing/invalid JWT | No | Token expired or invalid |
| FORBIDDEN | 403 | Insufficient permissions | No | Non-admin accessing admin endpoint |
| NOT_FOUND | 404 | Resource not found | No | Product ID doesn't exist |
| RATE_LIMITED | 429 | Too many requests | Yes | Exceeded rate limit |
| SERVER_ERROR | 500 | Unexpected error | Yes | Database connection failed |
| NETWORK_ERROR | N/A | No internet | Yes | Device offline |
| TIMEOUT | N/A | Request timeout | Yes | API took too long |

### Error Response Format

```json
{
  "error": true,
  "message": "Human-readable message in user's language",
  "code": "ERROR_CODE"
}
```

### Rate Limiting Configuration

| Endpoint | Limit | Window | Notes |
|----------|-------|--------|-------|
| POST /auth/login | 5 | 15 min | Per IP |
| GET /products | 100 | 1 min | Per IP |
| GET /search | 50 | 1 min | Per IP |
| POST /analytics/events | 1000 | 1 min | Per IP (batch endpoint) |
| GET /analytics | 100 | 1 min | Per IP (admin) |
| POST /products | 100 | 1 min | Per IP (admin) |
| DELETE /products/:id | 100 | 1 min | Per IP (admin) |

---

## 23. Messenger Ordering Channel

**HIGH PRIORITY FIX:** Add Messenger ordering alongside WhatsApp.

### Messenger Order Flow

```typescript
// When user taps "Order via Messenger"
const message = `আমি এই মোমবাতিটি অর্ডার করতে চাই:\n\n` +
  `নাম: ${product.name}\n` +
  `মূল্য: ৳${(product.price / 100).toFixed(0)}\n` +
  `লিংক: https://khusbooo.com/product/${product.id}`;

const encoded = encodeURIComponent(message);
const messengerUrl = `fb-messenger://user/[BUSINESS_PAGE_ID]?text=${encoded}`;
Linking.openURL(messengerUrl);
```

### Configuration

Add to `.env`:
```
EXPO_PUBLIC_FACEBOOK_BUSINESS_PAGE_ID=your_page_id
```

---

## 24. Wishlist Share Link Validation

**HIGH PRIORITY FIX:** Add endpoint to validate and fetch shared wishlists.

### New Endpoint

```
GET    /api/v1/wishlist/validate
  Query params: ids (comma-separated product IDs)
  Response: { 
    products: Product[], 
    invalid: string[],
    message: string
  }
```

### Implementation

```typescript
// backend/src/routes/wishlist.ts

export async function validateWishlist(req, res) {
  const { ids } = req.query;
  
  if (!ids || typeof ids !== 'string') {
    return res.status(400).json({ 
      error: true, 
      message: 'Invalid IDs parameter', 
      code: 'VALIDATION_ERROR' 
    });
  }
  
  const productIds = ids.split(',').filter(id => id.trim());
  
  const products = await db.query(
    'SELECT * FROM products WHERE id = ANY($1) AND is_active = true',
    [productIds]
  );
  
  const foundIds = products.rows.map(p => p.id);
  const invalidIds = productIds.filter(id => !foundIds.includes(id));
  
  res.json({
    products: products.rows,
    invalid: invalidIds,
    message: invalidIds.length > 0 
      ? `${invalidIds.length} product(s) no longer available`
      : 'All products available'
  });
}
```

### Deep Linking

Add to mobile app:
```typescript
// app/wishlist/[ids].tsx
export default function SharedWishlist({ ids }) {
  const productIds = ids.split(',');
  // Fetch products via validateWishlist endpoint
  // Display as grid
}
```

---

## 25. Analytics Event Deduplication

**MEDIUM PRIORITY FIX:** Prevent duplicate analytics events.

### Event Hash Generation

```typescript
// mobile/services/analytics.ts

import crypto from 'crypto';

export function generateEventHash(event: AnalyticsEvent): string {
  const data = `${event.sessionId}:${event.timestamp}:${event.productId}:${event.type}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}
```

### Deduplication Logic

```typescript
// backend/src/routes/analytics.ts

export async function ingestEvents(req, res) {
  const { events } = req.body;
  
  const deduplicatedEvents = [];
  
  for (const event of events) {
    const eventHash = generateEventHash(event);
    
    // Check if event already exists in last 5 minutes
    const existing = await db.query(
      'SELECT 1 FROM analytics_events WHERE event_hash = $1 AND created_at > NOW() - INTERVAL \'5 minutes\'',
      [eventHash]
    );
    
    if (existing.rows.length === 0) {
      deduplicatedEvents.push({ ...event, event_hash: eventHash });
    }
  }
  
  // Bulk insert deduplicated events
  if (deduplicatedEvents.length > 0) {
    await db.query(
      'INSERT INTO analytics_events (event_type, product_id, session_id, event_hash) VALUES ' +
      deduplicatedEvents.map((_, i) => `($${i*4+1}, $${i*4+2}, $${i*4+3}, $${i*4+4})`).join(','),
      deduplicatedEvents.flatMap(e => [e.type, e.productId, e.sessionId, e.event_hash])
    );
  }
  
  res.json({ received: deduplicatedEvents.length });
}
```

---

## 26. Deployment & Infrastructure

**HIGH PRIORITY FIX:** Define deployment strategy.

### Backend Deployment

- **Platform:** Heroku, Railway, or AWS EC2
- **Node.js:** 18+ LTS
- **Database:** Neon PostgreSQL (managed)
- **Backup:** Daily automated backups, 30-day retention
- **Environment:** Production, Staging, Development

### Mobile Deployment

- **iOS:** TestFlight → App Store
- **Android:** Google Play Console
- **Build:** Expo EAS Build
- **Release:** Semantic versioning (v1.0.0)

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run lint
      - run: npm run test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run build
      - run: npm run deploy
```

### Monitoring & Observability

- **Error Tracking:** Sentry
- **Performance:** New Relic or DataDog
- **Logs:** CloudWatch or ELK stack
- **Alerts:** PagerDuty for critical errors

### Scaling Strategy

- **Database:** Read replicas for analytics queries
- **API:** Horizontal scaling with load balancer
- **Cache:** Redis for session/cache layer
- **CDN:** Cloudinary for images (already included)

---

## 27. Search Indexing Strategy

**MEDIUM PRIORITY FIX:** Implement full-text search for performance.

### Full-Text Search Index

```sql
-- Create GIN index for full-text search
CREATE INDEX idx_products_search ON products 
  USING GIN(to_tsvector('english', name || ' ' || scent_notes));

-- For Bengali search (future enhancement)
-- CREATE INDEX idx_products_search_bn ON products 
--   USING GIN(to_tsvector('simple', name_bn || ' ' || scent_notes));
```

### Search Query

```sql
SELECT * FROM products 
WHERE to_tsvector('english', name || ' ' || scent_notes) @@ plainto_tsquery('english', $1)
  AND is_active = true
ORDER BY created_at DESC
LIMIT 20;
```

### Performance

- Full-text search: ~50ms for 100K products
- ILIKE search: ~500ms for 100K products
- **Improvement:** 10x faster

---

## 28. Admin Products List API

**CRITICAL FIX:** Add endpoint for admin to fetch all products (including inactive).

### New Endpoint

```
GET    /api/v1/admin/products    ← Admin only (JWT required)
  Query params: cursor, limit (default 50), search (optional)
  Response: { products: Product[], nextCursor: string|null, total: number }
  Note: Returns ALL products (active + inactive)
```

### Implementation

```typescript
// backend/src/routes/products.ts

export async function getAdminProducts(req, res) {
  const { cursor, limit = 50, search } = req.query;
  
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];
  
  if (search) {
    query += ' AND (name ILIKE $' + (params.length + 1) + ' OR scent_notes ILIKE $' + (params.length + 1) + ')';
    params.push(`%${search}%`);
  }
  
  if (cursor) {
    query += ' AND created_at < $' + (params.length + 1) + '::TIMESTAMPTZ';
    params.push(cursor);
  }
  
  query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
  params.push(Math.min(parseInt(limit), 100));
  
  const result = await db.query(query, params);
  
  const nextCursor = result.rows.length === parseInt(limit) 
    ? result.rows[result.rows.length - 1].created_at 
    : null;
  
  res.json({
    products: result.rows,
    nextCursor,
    total: result.rows.length
  });
}
```

---

## 29. Offline Sync Conflict Resolution

**HIGH PRIORITY FIX:** Define conflict resolution for future user accounts feature.

### Conflict Resolution Strategy

When user logs in (future feature):
1. Fetch server wishlist
2. Compare with local wishlist
3. Merge strategy: **Last-Write-Wins (LWW)**
   - If item added locally but not on server: add to server
   - If item removed locally but exists on server: remove from server
   - If item exists on both: keep server version (server is source of truth)
4. Sync timestamp: track `last_modified_at` for each item
5. On conflict: server timestamp wins

### Implementation (Deferred to Phase 2)

```typescript
// mobile/services/wishlistSync.ts (future)

export async function syncWishlist(localWishlist, serverWishlist) {
  const merged = new Map();
  
  // Add all server items (server is source of truth)
  serverWishlist.forEach(item => {
    merged.set(item.productId, { ...item, source: 'server' });
  });
  
  // Add local items that don't exist on server
  localWishlist.forEach(item => {
    if (!merged.has(item.productId)) {
      merged.set(item.productId, { ...item, source: 'local' });
    }
  });
  
  return Array.from(merged.values());
}
```

---

## 30. Rate Limiting Configuration

**MEDIUM PRIORITY FIX:** Detailed rate limiting setup.

### Implementation

```typescript
// backend/src/middleware/rateLimit.ts

import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50,
  message: 'Too many search requests',
  standardHeaders: true,
  legacyHeaders: false,
});

export const analyticsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000, // Batch endpoint allows more
  message: 'Too many analytics events',
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Usage

```typescript
// backend/src/index.ts

app.post('/api/v1/auth/login', loginLimiter, authController.login);
app.get('/api/v1/products', apiLimiter, productController.getProducts);
app.get('/api/v1/search', searchLimiter, searchController.search);
app.post('/api/v1/analytics/events', analyticsLimiter, analyticsController.ingestEvents);
```