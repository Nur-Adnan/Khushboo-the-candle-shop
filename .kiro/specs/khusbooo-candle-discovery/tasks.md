# KHUSBOOO — Task List
## For Kiro with Claude Haiku 4.5

---

## How to Use This File

- Tasks are grouped by **Phase** (backend first, then mobile)
- Each task has a clear **Goal**, **Files to create/edit**, and **Done when** checklist
- Complete tasks in order — later tasks depend on earlier ones
- Each task is sized for a single Haiku generation session

---

## Phase 1: Project Setup

---

### Task 1.1 — Initialize Backend Project

**Goal:** Set up the Express + TypeScript backend project structure.

**Files to create:**
- `backend/package.json`
- `backend/tsconfig.json`
- `backend/src/index.ts`
- `backend/.env.example`
- `backend/.gitignore`

**Instructions:**
1. Initialize a Node.js project with TypeScript
2. Install dependencies: `express`, `pg`, `jsonwebtoken`, `bcrypt`, `express-rate-limit`, `cloudinary`, `cors`, `helmet`, `dotenv`
3. Install dev dependencies: `typescript`, `ts-node`, `nodemon`, `@types/express`, `@types/node`, `@types/bcrypt`, `@types/jsonwebtoken`
4. Create `src/index.ts` that starts an Express server on `PORT` from env
5. Add `start`, `dev`, and `build` scripts to package.json

**Done when:**
- [ ] `npm run dev` starts the server without errors
- [ ] Server responds to `GET /health` with `{ status: "ok" }`

---

### Task 1.2 — Set Up PostgreSQL Connection

**Goal:** Create a database connection pool and run the initial schema migration.

**Files to create:**
- `backend/src/db/index.ts`
- `backend/src/db/migrations/001_initial_schema.sql`

**Instructions:**
1. Create a `pg` Pool using `DATABASE_URL` from env
2. Export a `query(text, params)` helper function
3. Create the SQL migration file with all tables from the design doc (products, categories, admin_users, analytics_events)
4. Add a `migrate` npm script that runs the SQL file against the database
5. Seed the `categories` table with the 8 default categories: floral, fruity, woody, fresh, spicy, seasonal, luxury, eco-friendly

**Done when:**
- [ ] `npm run migrate` runs without errors
- [ ] All 4 tables exist in PostgreSQL
- [ ] 8 rows exist in the categories table

---

### Task 1.3 — Initialize Mobile App Project

**Goal:** Set up the Expo + React Native project with the correct folder structure.

**Files to create:**
- `mobile/app/_layout.tsx`
- `mobile/app/(tabs)/_layout.tsx`
- `mobile/constants/config.ts`
- `mobile/constants/strings.ts`
- `mobile/types/index.ts`
- `mobile/.env.example`

**Instructions:**
1. Initialize with `npx create-expo-app mobile --template tabs`
2. Install dependencies: `zustand`, `axios`, `@react-native-async-storage/async-storage`, `expo-secure-store`, `expo-image-picker`, `expo-sharing`, `expo-network`, `react-native-gesture-handler`, `react-native-reanimated`
3. Set up the tab layout with 3 tabs: Home (Feed), Explore (Categories), Wishlist
4. Create `types/index.ts` with all types from the design doc (Product, Category, WishlistItem, AnalyticsEvent, FeedPage, SearchFilters)
5. Create `constants/strings.ts` with Bengali and English strings for all UI text
6. Create `constants/config.ts` with API_URL, CLOUDINARY_CLOUD_NAME, PAGE_SIZE=12, MAX_CACHE_MB=50

**Done when:**
- [ ] `npx expo start` runs without errors
- [ ] 3 tabs appear at the bottom of the app
- [ ] TypeScript types are importable from `@/types`

---

### Task 1.4 — Set Up Zustand Store

**Goal:** Create the global state store for the app.

**Files to create:**
- `mobile/store/useAppStore.ts`

**Instructions:**
1. Install `zustand`
2. Create the store with these slices (all defined in the design doc):
   - Feed state: `feedProducts`, `feedCursor`, `feedLoading`, `setFeedProducts`, `appendFeedProducts`
   - Wishlist state: `wishlist`, `addToWishlist`, `removeFromWishlist`, `isInWishlist`
   - Network state: `isOnline`, `setOnline`
   - Admin state: `adminToken`, `adminEmail`, `setAdmin`, `clearAdmin`
   - Analytics queue: `analyticsQueue`, `queueEvent`, `clearQueue`
3. Persist `wishlist` and `analyticsQueue` slices to AsyncStorage using zustand/middleware persist

**Done when:**
- [ ] Store imports without TypeScript errors
- [ ] `useAppStore()` is callable in a component

---

### Task 1.5 — Set Up API Client

**Goal:** Create the Axios instance used for all API calls.

**Files to create:**
- `mobile/services/api.ts`

**Instructions:**
1. Create an Axios instance with `baseURL` from `config.ts`
2. Add a request interceptor that attaches `Authorization: Bearer <token>` header if `adminToken` exists in store
3. Add a response interceptor that:
   - On 401: clears admin state in store and redirects to `/admin/login`
   - On any error: returns a typed error object with a `message` field (never raw axios errors)
4. Export typed functions: `get<T>(url, params?)`, `post<T>(url, body?)`, `put<T>(url, body?)`, `del<T>(url)`

**Done when:**
- [ ] `api.get('/health')` resolves without TypeScript errors
- [ ] 401 responses clear admin state automatically

---

## Phase 2: Backend API Routes

---

### Task 2.1 — Admin Authentication Routes

**Goal:** Build login and logout endpoints with JWT and bcrypt.

**Files to create:**
- `backend/src/routes/auth.ts`
- `backend/src/middleware/auth.ts`
- `backend/src/middleware/rateLimit.ts`

**Instructions:**
1. Create `POST /api/v1/auth/login`:
   - Validate `email` and `password` fields exist
   - Look up admin by email in `admin_users` table
   - Compare password with `bcrypt.compare()`
   - If valid: return JWT signed with `JWT_SECRET`, expiry `24h`
   - If invalid: return 401 with message `"Invalid email or password"` (same message for both wrong email and wrong password)
2. Create JWT middleware that verifies `Authorization: Bearer <token>` header and attaches `req.admin` to the request
3. Create rate limiter: max 5 requests per 15 minutes per IP on the login route
4. Seed one admin user in the migration (hashed password with bcrypt, 10 rounds)

**Done when:**
- [ ] `POST /api/v1/auth/login` with correct credentials returns a JWT
- [ ] `POST /api/v1/auth/login` with wrong credentials returns 401
- [ ] 6th login attempt within 15 minutes returns 429
- [ ] Auth middleware blocks requests without valid token with 401

---

### Task 2.2 — Products Routes (Public)

**Goal:** Build public product endpoints for the user feed and product details.

**Files to create:**
- `backend/src/routes/products.ts` (public routes section)

**Instructions:**
1. Create `GET /api/v1/products`:
   - Accept query params: `cursor` (UUID), `limit` (default 12, max 50), `category`
   - Only return products where `is_active = true` and `in_stock` is not filtered (show out of stock but mark it)
   - Return `{ products, nextCursor, total }`
   - Use cursor-based pagination: `WHERE id > cursor ORDER BY created_at DESC`
2. Create `GET /api/v1/products/:id`:
   - Return full product data including all images array
   - Return 404 if product not found or not active

**Done when:**
- [ ] `GET /api/v1/products` returns 12 products with a `nextCursor`
- [ ] `GET /api/v1/products?cursor=<id>` returns the next 12
- [ ] `GET /api/v1/products/:id` returns one product
- [ ] Inactive products do not appear in the list

---

### Task 2.3 — Products Routes (Admin CRUD)

**Goal:** Build protected admin endpoints for product management.

**Files to create:**
- Continue editing `backend/src/routes/products.ts` (admin routes section)

**Instructions:**
1. All routes in this task require the JWT auth middleware
2. Create `POST /api/v1/products`:
   - Accept: `name`, `description`, `price`, `category_id`, `scent_notes`, `burn_time`, `size`, `images[]`, `thumbnails[]`
   - Validate all required fields (name, price, category_id, at least 1 image)
   - Insert into `products` table
   - Update `product_count` in `categories` table
   - Return created product
3. Create `PUT /api/v1/products/:id`:
   - Accept partial product fields
   - Update only provided fields
   - Return updated product
4. Create `DELETE /api/v1/products/:id`:
   - Delete product from database
   - Also call Cloudinary API to delete associated images using their public IDs
   - Decrement `product_count` in categories
   - Return `{ success: true }`
5. Create `PATCH /api/v1/products/:id/status`:
   - Body: `{ isActive: boolean }`
   - Toggle product active/inactive status

**Done when:**
- [ ] `POST /api/v1/products` creates a product (requires JWT)
- [ ] `PUT /api/v1/products/:id` updates fields
- [ ] `DELETE /api/v1/products/:id` removes product and images
- [ ] All routes return 401 without a valid JWT

---

### Task 2.4 — Categories Route

**Goal:** Build the public categories endpoint.

**Files to create:**
- `backend/src/routes/categories.ts`

**Instructions:**
1. Create `GET /api/v1/categories`:
   - Return all 8 categories with `id`, `name`, `name_bn`, `image_url`, `product_count`
   - Only count active products in `product_count`
   - Order by name alphabetically

**Done when:**
- [ ] `GET /api/v1/categories` returns all 8 categories
- [ ] `product_count` reflects only active products

---

### Task 2.5 — Search Route

**Goal:** Build search with filtering and autocomplete suggestions.

**Files to create:**
- `backend/src/routes/search.ts`

**Instructions:**
1. Create `GET /api/v1/search`:
   - Accept: `q` (text query), `category`, `minPrice`, `maxPrice`, `cursor`, `limit` (default 20)
   - Search by: product name using `ILIKE '%query%'`, scent notes using `ILIKE`
   - Apply category filter if provided
   - Apply price range filter if provided (prices are in paisa)
   - Only return active products
   - Return `{ products, nextCursor, total }`
2. Create `GET /api/v1/search/suggestions`:
   - Accept: `q`
   - Return up to 5 matching product names and scent note keywords
   - Response: `{ suggestions: string[] }`

**Done when:**
- [ ] `GET /api/v1/search?q=rose` returns matching products
- [ ] `GET /api/v1/search?category=floral` returns only floral products
- [ ] `GET /api/v1/search/suggestions?q=ro` returns name suggestions

---

### Task 2.6 — Analytics Routes

**Goal:** Build event ingestion and analytics summary endpoints.

**Files to create:**
- `backend/src/routes/analytics.ts`

**Instructions:**
1. Create `POST /api/v1/analytics/events`:
   - Accept array of events: `[{ type, productId, timestamp, sessionId }]`
   - Validate event type is one of: `product_view`, `wishlist_add`, `wishlist_remove`, `order_intent`
   - Do NOT store any PII — only productId, sessionId (anonymous), type, and timestamp
   - Bulk insert into `analytics_events` table
   - Return `{ received: number }`
2. Create `GET /api/v1/analytics` (admin only, requires JWT):
   - Accept: `startDate`, `endDate` (ISO strings)
   - Return:
     - `totalViews`: count of `product_view` events in range
     - `totalWishlistAdds`: count of `wishlist_add` events in range
     - `totalOrderIntents`: count of `order_intent` events in range
     - `topProducts`: top 10 products by view count with product details

**Done when:**
- [ ] `POST /api/v1/analytics/events` with array of events stores them all
- [ ] `GET /api/v1/analytics` returns correct totals (requires JWT)
- [ ] `GET /api/v1/analytics?startDate=2025-01-01&endDate=2025-12-31` filters correctly

---

### Task 2.7 — Error Handler & Global Middleware

**Goal:** Add error handling, security headers, CORS, and server-side logging to the backend.

**Files to create:**
- `backend/src/middleware/errorHandler.ts`
- `backend/src/services/logger.ts`

**Instructions:**
1. Add `helmet()` middleware for security headers
2. Add `cors()` middleware — allow requests from the mobile app origin
3. Add a global rate limiter: max 100 requests per minute per IP
4. Create `services/logger.ts` using `winston` or `pino`:
   - Log all errors with timestamp, error message, stack trace
   - Log all API requests (method, path, status code, response time)
   - NEVER log request/response bodies that contain PII
   - Write logs to `backend/logs/` directory
   - Rotate logs daily
5. Create a global error handler middleware that:
   - Catches all unhandled errors
   - Logs the error with full context
   - Returns `{ error: true, message: "Something went wrong", code: "SERVER_ERROR" }` for unexpected errors
   - Returns proper messages for known errors (validation, not found, unauthorized)
   - Never exposes stack traces or internal error details to client
6. Add a `404` handler for unknown routes

**Done when:**
- [ ] Unknown routes return `404` with JSON error
- [ ] Server errors return `500` with friendly message (no stack trace)
- [ ] All responses include security headers from helmet
- [ ] All errors are logged to `backend/logs/` directory
- [ ] Request logs show method, path, status, response time

---

## Phase 3: Mobile — Core Infrastructure

---

### Task 3.1 — Cache Service

**Goal:** Build AsyncStorage cache helpers used throughout the app.

**Files to create:**
- `mobile/services/cache.ts`

**Instructions:**
1. Implement `setCache(key: string, data: unknown, ttlMs: number): Promise<void>`
   - Store as `{ data, expiresAt: Date.now() + ttlMs }` in AsyncStorage
2. Implement `getCache<T>(key: string): Promise<T | null>`
   - Return `null` if key doesn't exist or `expiresAt < Date.now()`
3. Implement `clearExpiredCache(): Promise<void>`
   - Loop all keys, delete those where `expiresAt < Date.now()`
4. Implement `getCacheSizeBytes(): Promise<number>`
   - Sum up byte length of all cached values
5. Implement `evictOldestCache(): Promise<void>`
   - Sort all cached items by `expiresAt`, delete the oldest 20% when over 50MB
6. Use cache key prefixes from design doc: `cache:feed:`, `cache:product:`, `cache:categories`, `cache:search:`

**Done when:**
- [ ] `setCache` and `getCache` round-trip correctly
- [ ] Expired keys return `null`
- [ ] `getCacheSizeBytes` returns a number

---

### Task 3.2 — Network Status Hook

**Goal:** Detect online/offline status and show the offline banner.

**Files to create:**
- `mobile/hooks/useNetworkStatus.ts`
- `mobile/components/OfflineBanner.tsx`

**Instructions:**
1. Create `useNetworkStatus` hook using `expo-network`:
   - On mount: check `Network.getNetworkStateAsync()`
   - Listen for connectivity changes
   - Update `isOnline` in Zustand store
2. Create `OfflineBanner` component:
   - Shows a yellow banner at the top when `isOnline === false`
   - Text: `"আপনি অফলাইনে আছেন"` (You are offline)
   - Animates in/out smoothly
3. Add `OfflineBanner` to `app/_layout.tsx` so it appears on all screens

**Done when:**
- [ ] Banner appears when device goes offline
- [ ] Banner disappears when device comes back online

---

### Task 3.3 — Analytics Hook

**Goal:** Track user events and batch-send them to the backend.

**Files to create:**
- `mobile/hooks/useAnalytics.ts`
- `mobile/services/analytics.ts`

**Instructions:**
1. Create `useAnalytics()` hook that exposes `trackEvent(type, productId)`
   - Generates a `sessionId` once per app session (random UUID stored in memory)
   - If online: add event to a local batch
   - If offline: add event to `analyticsQueue` in Zustand store (persisted to AsyncStorage)
2. Create `services/analytics.ts` with `flushEvents(events)`:
   - POST to `/api/v1/analytics/events`
   - Called every 5 minutes using `setInterval` in the hook
   - Also called when app comes back online (flush queued events from store)
3. Do NOT include any user PII in events

**Done when:**
- [ ] `trackEvent('product_view', productId)` works when online
- [ ] Events are queued in AsyncStorage when offline
- [ ] Queued events flush when internet returns

---

### Task 3.4 — Toast & Loading Components

**Goal:** Build reusable feedback components used across the whole app.

**Files to create:**
- `mobile/components/Toast.tsx`
- `mobile/components/LoadingSpinner.tsx`

**Instructions:**
1. `Toast` component:
   - Props: `message: string`, `type: 'success' | 'error' | 'info'`, `visible: boolean`
   - Shows at bottom of screen for 3 seconds then auto-hides
   - Green background for success, red for error, blue for info
2. `LoadingSpinner` component:
   - Props: `visible: boolean`, `message?: string`
   - Shows centered ActivityIndicator
   - Optional text below spinner
3. Export a `useToast()` hook with `showToast(message, type)` function

**Done when:**
- [ ] Toast appears and disappears after 3 seconds
- [ ] LoadingSpinner centers on screen

---

## Phase 4: Mobile — User Screens

---

### Task 4.1 — ProductCard Component

**Goal:** Build the single product card shown in the feed grid.

**Files to create:**
- `mobile/components/ProductCard.tsx`

**Instructions:**
1. Props: `product: Product`, `onPress: () => void`, `isInWishlist: boolean`, `onWishlistToggle: () => void`
2. Layout:
   - Full-width image (use thumbnail URL) with aspect ratio 1:1
   - Heart icon overlay at top-right (filled if in wishlist, outline if not)
   - Product name below image (max 2 lines, ellipsis)
   - Price formatted as `৳ 500` (divide paisa by 100, no decimals)
   - "Out of Stock" overlay if `product.inStock === false`
3. Image loading:
   - Show a grey placeholder while loading
   - Show placeholder icon if image fails to load
4. Tap target: entire card is pressable (minimum 44pt height)
5. Heart button tap calls `onWishlistToggle`, does NOT navigate

**Done when:**
- [ ] Card renders with image, name, price
- [ ] Heart icon toggles on tap
- [ ] Out of stock overlay appears correctly
- [ ] Image placeholder shows while loading

---

### Task 4.2 — Home Feed Screen

**Goal:** Build the main infinite-scroll product feed with memory caching.

**Files to create:**
- `mobile/app/(tabs)/index.tsx`
- `mobile/components/ProductGrid.tsx`
- `mobile/hooks/useFeed.ts`

**Instructions:**
1. `useFeed` hook:
   - On mount: check cache for `cache:feed:page:1` — if fresh, use it; else fetch from API
   - Fetch `GET /api/v1/products?limit=12`
   - Store results in Zustand `feedProducts`
   - Keep current page + next page in memory (max 2 pages = 24 products)
   - `loadNextPage()`: fetch with `cursor=nextCursor`, append to `feedProducts`
   - `refresh()`: clear cache, fetch first page again
2. `ProductGrid` component:
   - Uses `FlatList` with `numColumns={2}`
   - `onEndReached` calls `loadNextPage()`
   - `refreshControl` with pull-to-refresh
   - Shows `LoadingSpinner` at bottom while loading next page
3. Home screen (`index.tsx`):
   - Renders `ProductGrid` with all feed products
   - Tapping a product navigates to `/product/[id]`
   - Wishlist toggle calls `addToWishlist` / `removeFromWishlist` from store
   - Shows `OfflineBanner` if offline

**Done when:**
- [ ] Feed shows 2-column grid of products on launch
- [ ] Scrolling to bottom loads more products
- [ ] Pull to refresh shows new products
- [ ] Products load from cache when offline
- [ ] Memory usage stays under 150MB with 2 pages cached

---

### Task 4.3 — Product Details Screen

**Goal:** Build the full product detail view with device-aware image loading.

**Files to create:**
- `mobile/app/product/[id].tsx`
- `mobile/components/ImageCarousel.tsx`
- `mobile/components/WishlistButton.tsx`

**Instructions:**
1. `[id].tsx` screen:
   - On mount: check `cache:product:{id}` — if fresh, use it; else fetch `GET /api/v1/products/:id`
   - Cache fetched product for 7 days
   - Track `product_view` event via `useAnalytics`
2. Layout (scroll view):
   - `ImageCarousel` at top
   - Product name (large), price formatted as `৳ 500`
   - Category badge
   - "Out of Stock" badge if not in stock
   - Scent notes, burn time, size info section
   - Description text
   - `WishlistButton`
   - "Order via WhatsApp" button (disabled if out of stock)
   - "Share" button
3. `ImageCarousel`:
   - Horizontal scroll between images
   - Dot indicators
   - Pinch-to-zoom using `react-native-gesture-handler`
   - On low-end devices: load `thumbnails[]` array; on high-end: load `images[]` array
   - Thumbnail-first strategy: show thumbnail while full image loads
4. "Order via WhatsApp" button:
   - Build Bengali pre-filled message (see design doc section 9)
   - Use `Linking.openURL('whatsapp://send?text=...')`
   - Track `order_intent` event
5. "Share" button:
   - Use `expo-sharing` or `Share.share()` from React Native
   - Share: product name + `https://khusbooo.com/product/{id}`
   - Track `product_share` event
6. `WishlistButton`:
   - Reads `isInWishlist(productId)` from store
   - Calls `addToWishlist` or `removeFromWishlist`
   - Shows filled/outline heart

**Done when:**
- [ ] Product details screen loads with all info
- [ ] Image carousel swipes and shows dots
- [ ] Low-end devices load thumbnails, high-end load full images
- [ ] WhatsApp opens with pre-filled Bengali message
- [ ] Wishlist button toggles correctly
- [ ] Out of stock products show badge and disabled order button

---

### Task 4.4 — Search Screen

**Goal:** Build the search screen with suggestions and filters.

**Files to create:**
- `mobile/app/search.tsx`
- `mobile/hooks/useSearch.ts`

**Instructions:**
1. `useSearch` hook:
   - `query` state
   - `suggestions`: fetch `GET /api/v1/search/suggestions?q=query` debounced at 300ms
   - `results`: fetch `GET /api/v1/search` on submit
   - `recentSearches`: read/write to AsyncStorage key `search:recent` (max 10)
   - `filters`: state object for category, minPrice, maxPrice
2. Search screen:
   - Text input at top with search icon button
   - While typing: show suggestion list below input
   - Recent searches shown when input is empty (with clear button per item)
   - On submit: show results grid (same `ProductGrid` component as feed)
   - Filter bar below input: category chips, price range
   - "No results found" with tip when results are empty
   - Clear search button returns to showing recent searches

**Done when:**
- [ ] Suggestions appear as user types (after 300ms)
- [ ] Submitting search shows results grid
- [ ] Recent searches appear when input is empty
- [ ] Category filter works

---

### Task 4.5 — Wishlist Screen

**Goal:** Build the wishlist screen with sorting, pagination, and sharing.

**Files to create:**
- `mobile/app/(tabs)/wishlist.tsx`

**Instructions:**
1. Read wishlist from Zustand store (persisted to AsyncStorage)
2. Show products in same 2-column grid as feed
3. Add a sort dropdown at top: "Date Added", "Price: Low to High", "Price: High to Low"
4. Implement pagination: show 20 products per page, load next page on scroll
5. "Out of Stock" badge on products that have `inStock: false` (fetch current status from API on mount)
6. Swipe-to-remove or remove button on each card
7. Show wishlist item count in tab badge
8. "Share Wishlist" button:
   - Generate URL: `https://khusbooo.com/wishlist?ids=id1,id2,id3`
   - Open native share sheet with this URL
9. Empty state: show friendly message "আপনার wishlist খালি" with a "Browse Products" button

**Done when:**
- [ ] Wishlist shows saved products
- [ ] Sorting works for all 3 options
- [ ] Pagination loads 20 per page
- [ ] Remove works and updates count in tab badge
- [ ] Share button opens native share sheet
- [ ] Empty state appears when wishlist is empty

---

### Task 4.6 — Explore / Categories Screen

**Goal:** Build the category browse experience.

**Files to create:**
- `mobile/app/(tabs)/explore.tsx`
- `mobile/components/CategoryCard.tsx`
- `mobile/app/category/[id].tsx`

**Instructions:**
1. Explore screen (`explore.tsx`):
   - On mount: check `cache:categories` — if fresh use it; else fetch `GET /api/v1/categories`
   - Cache for 24 hours
   - Show 2-column grid of `CategoryCard` components
2. `CategoryCard`:
   - Props: `category: { id, name, name_bn, image_url, product_count }`
   - Background image with category name overlay
   - Product count badge in corner (e.g., "24 products")
   - Low-end device: load image at 240px
3. Category products screen (`category/[id].tsx`):
   - Breadcrumb at top: "Home > Categories > [Category Name]"
   - Fetches `GET /api/v1/products?category=id`
   - Uses same `ProductGrid` component
   - Infinite scroll works same as feed

**Done when:**
- [ ] All 8 categories show as cards
- [ ] Tapping a category shows its products
- [ ] Product count shows on each card
- [ ] Breadcrumb shows correct path

---

## Phase 5: Admin Screens

---

### Task 5.1 — Admin Login Screen

**Goal:** Build the admin login screen with JWT handling.

**Files to create:**
- `mobile/app/admin/login.tsx`

**Instructions:**
1. Simple screen with email and password fields
2. "Login" button triggers `POST /api/v1/auth/login`
3. On success: store token with `expo-secure-store`, save to Zustand `setAdmin()`, navigate to `/admin/dashboard`
4. On failure: show error message `"Invalid email or password"` (same message regardless of which field is wrong)
5. After 5 failed attempts: show message "Too many attempts. Try again in 15 minutes." and disable the button for 15 minutes (track in local state)
6. Auto-redirect to dashboard if a valid token already exists in SecureStore on mount

**Done when:**
- [ ] Correct credentials navigate to dashboard
- [ ] Wrong credentials show error message
- [ ] Token is stored in SecureStore on success
- [ ] Already-logged-in admin is redirected automatically

---

### Task 5.2 — Admin Dashboard Screen

**Goal:** Build the admin dashboard home with navigation.

**Files to create:**
- `mobile/app/admin/dashboard.tsx`

**Instructions:**
1. Show admin email at top
2. Three large navigation buttons: "Products", "Analytics", "Logout"
3. Logout button: clear token from SecureStore, call `clearAdmin()` in store, navigate to login
4. Protect this screen: if no valid token in store, redirect to `/admin/login`
5. Show summary stats at top (fetch from analytics API): total products, total views today

**Done when:**
- [ ] Dashboard shows with 3 navigation options
- [ ] Logout clears token and redirects to login
- [ ] Accessing without token redirects to login

---

### Task 5.3 — Admin Product List Screen

**Goal:** Build the product management list with search, status toggle, and delete.

**Files to create:**
- `mobile/app/admin/products.tsx`

**Instructions:**
1. Fetch all products (`GET /api/v1/products` — include inactive ones for admin)
2. Show as a vertical list (not grid) with: name, price, category, Active/Inactive badge
3. Search input at top — filter list in real-time by product name (client-side)
4. "Add Product" button at top-right → navigate to `/admin/product-form`
5. Each row has: Edit button → `/admin/product-form?id=productId`, Delete button, Status toggle
6. Delete: show confirmation dialog "Are you sure you want to delete [product name]?" → on confirm, call DELETE API → refresh list → show success toast
7. Status toggle: tap Active/Inactive badge to toggle status via `PATCH /api/v1/products/:id/status` → show toast

**Done when:**
- [ ] Product list shows all products including inactive
- [ ] Search filters list in real-time
- [ ] Delete shows confirmation and removes product
- [ ] Status toggle switches active/inactive
- [ ] Edit button navigates to form with product pre-filled

---

### Task 5.4 — Admin Product Form (Add / Edit)

**Goal:** Build the product form for creating and editing products with image crop/rotate.

**Files to create:**
- `mobile/app/admin/product-form.tsx`

**Instructions:**
1. If `?id=productId` in URL: fetch product, pre-fill form (Edit mode)
2. If no id: show empty form (Add mode)
3. Form fields (all with labels and validation error messages):
   - Name (required, text)
   - Description (required, multiline text)
   - Price in BDT (required, numeric — store as paisa: multiply by 100)
   - Category (required, picker/dropdown of 8 categories)
   - Scent Notes (required, text)
   - Burn Time (optional, text, e.g., "40-50 hours")
   - Size (optional, text, e.g., "200g")
4. Image upload section:
   - "Add Image" button opens `expo-image-picker` for camera or library
   - When image is selected: show crop/rotate preview
   - Crop: allow free-form or preset aspect ratios (1:1, 4:3, 16:9)
   - Rotate: 90° increments (0°, 90°, 180°, 270°)
   - On confirm: apply transformations and show preview thumbnail
   - Each image shows upload progress bar
   - On select: immediately upload to Cloudinary via backend (see Task 5.5)
   - Allow up to 5 images
5. On submit:
   - Validate all required fields client-side
   - If valid: POST (add) or PUT (edit) to API
   - On success: navigate back to product list + show success toast
   - On error: show error toast with message

**Done when:**
- [ ] Add mode creates a new product
- [ ] Edit mode pre-fills and updates product
- [ ] Image crop/rotate works and shows preview
- [ ] Image upload works and shows progress
- [ ] Validation errors appear on required fields
- [ ] Success navigates back to product list

---

### Task 5.5 — Image Upload to Cloudinary

**Goal:** Handle image upload from admin form to Cloudinary via backend.

**Files to create:**
- `backend/src/routes/upload.ts`
- `mobile/services/cloudinary.ts`

**Instructions:**
1. Backend upload route `POST /api/v1/upload` (admin only):
   - Accept `multipart/form-data` with image file
   - Use Cloudinary SDK to upload
   - Transformation on upload: `width: 1200, crop: limit, format: webp, quality: 80`
   - Also generate thumbnail transformation: `width: 480, crop: limit, format: webp, quality: 80`
   - Return `{ publicId, imageUrl, thumbnailUrl }`
2. Mobile `cloudinary.ts`:
   - `uploadImage(localUri: string, onProgress: (pct: number) => void)`: Promise<{imageUrl, thumbnailUrl}>
   - Convert local URI to FormData
   - POST to `/api/v1/upload` with progress tracking using Axios `onUploadProgress`
   - Return URLs on success
3. Export URL builder functions from design doc (getThumbnailUrl, getFullUrl, getCategoryUrl)

**Done when:**
- [ ] Selecting an image in the admin form uploads it and returns a Cloudinary URL
- [ ] Progress bar updates during upload
- [ ] Uploaded images appear in WebP format in Cloudinary

---

### Task 5.6 — Admin Analytics Screen

**Goal:** Build the analytics dashboard for admins.

**Files to create:**
- `mobile/app/admin/analytics.tsx`

**Instructions:**
1. Fetch `GET /api/v1/analytics` with default date range (last 30 days)
2. Show at top: 3 summary cards in a row:
   - Total Views
   - Total Wishlist Adds
   - Total Order Intents
3. Date range selector below (start date / end date pickers) — on change, refetch
4. "Top 10 Products" section: vertical list with product name, thumbnail, view count
5. Loading state while fetching: show skeleton placeholders for cards and list
6. Error state: show retry button

**Done when:**
- [ ] Analytics screen shows 3 summary numbers
- [ ] Top 10 products list shows correctly
- [ ] Date range filter updates the numbers

---

## Phase 6: Polish & Error Handling

---

### Task 6.1 — Global Error Handling

**Goal:** Make sure every error in the app shows a friendly message.

**Files to edit:**
- `mobile/services/api.ts`
- `mobile/app/_layout.tsx`

**Instructions:**
1. In the Axios response interceptor: map all error status codes to friendly Bengali messages:
   - 400 → "তথ্য সঠিক নয়" (Data is incorrect)
   - 401 → "আবার লগইন করুন" (Please log in again)
   - 404 → "পাওয়া যায়নি" (Not found)
   - 429 → "একটু অপেক্ষা করুন" (Please wait a moment)
   - 500 → "সমস্যা হয়েছে। আবার চেষ্টা করুন।" (Something went wrong. Please try again.)
   - Network error → "ইন্টারনেট সংযোগ নেই" (No internet connection)
2. Wrap the entire app in an error boundary in `_layout.tsx` that catches crashes and shows a "Something went wrong" screen with a restart button

**Done when:**
- [ ] API errors show friendly messages (not raw error codes)
- [ ] App crash shows error boundary screen instead of white screen

---

### Task 6.2 — Low-End Device Detection

**Goal:** Detect low-end devices and adjust image quality automatically.

**Files to create:**
- `mobile/hooks/useDeviceProfile.ts`

**Files to edit:**
- `mobile/app/_layout.tsx`
- `mobile/store/useAppStore.ts`

**Instructions:**
1. Add `isLowEndDevice: boolean` to Zustand store (default false)
2. Create `useDeviceProfile` hook using `expo-device`:
   - Check `Device.totalMemory` — if under 2GB (2_000_000_000 bytes): set `isLowEndDevice = true` in store
3. Call `useDeviceProfile()` once in `_layout.tsx` on app startup
4. Update `ProductCard` to use `thumbnailUrl` always on low-end devices
5. Update `ImageCarousel` to load `thumbnails[]` on low-end devices, `images[]` on others
6. Update `CategoryCard` to use 240px image on low-end devices

**Done when:**
- [ ] `isLowEndDevice` is set correctly on app startup
- [ ] Low-end devices load smaller images throughout the app

---

### Task 6.3 — Offline Sync

**Goal:** Ensure analytics events sync when internet is restored.

**Files to edit:**
- `mobile/hooks/useNetworkStatus.ts`
- `mobile/hooks/useAnalytics.ts`

**Instructions:**
1. In `useNetworkStatus`: when `isOnline` changes from `false` to `true`, call `flushAnalyticsQueue()`
2. `flushAnalyticsQueue()` in analytics service:
   - Read `analyticsQueue` from Zustand store
   - If not empty: POST all events to `/api/v1/analytics/events`
   - On success: call `clearQueue()` in store
   - On failure: keep events in queue (retry next time)

**Done when:**
- [ ] Events queued while offline are sent when internet returns
- [ ] Queue is cleared after successful sync
- [ ] Failed syncs keep events in queue for next attempt

---

### Task 6.4 — Bengali Localization Audit

**Goal:** Make sure all user-visible text is in Bengali and no strings are hardcoded.

**Files to edit:**
- `mobile/constants/strings.ts`
- All screen and component files

**Instructions:**
1. Review all screen files and identify any hardcoded English strings shown to users
2. Move all strings to `constants/strings.ts` under a `bn` (Bengali) object
3. All strings used in UI should be imported from `strings.bn.*`
4. Price display helper: `formatPrice(paisa: number): string` — returns `"৳ 500"` format
5. Verify WhatsApp message is in Bengali
6. Check that category names show `name_bn` (Bengali) not `id`

**Done when:**
- [ ] No hardcoded user-visible strings in any screen file
- [ ] All prices show with ৳ symbol
- [ ] Category names show in Bengali

---

## Phase 7: Final Checks

---

### Task 7.1 — API Health Check & Smoke Test

**Goal:** Verify all API endpoints work end-to-end.

**Instructions:**
1. Write a simple test script `backend/scripts/smoke-test.ts` that:
   - Calls `GET /health` → expects 200
   - Calls `POST /auth/login` with test credentials → expects JWT
   - Calls `GET /products` → expects products array
   - Calls `GET /categories` → expects 8 categories
   - Calls `GET /search?q=candle` → expects results array
   - Calls `POST /analytics/events` with 1 event → expects `{ received: 1 }`
   - Calls `GET /analytics` with JWT → expects summary object
2. Run with `npx ts-node scripts/smoke-test.ts`

**Done when:**
- [ ] All smoke test calls pass without errors

---

### Task 7.2 — Cache & Offline Final Test

**Goal:** Verify offline mode works correctly.

**Instructions:**
1. Test these scenarios manually on device/simulator:
   - Load feed while online → turn off wifi → confirm feed still shows
   - View product while online → turn off wifi → navigate away and back → confirm product still shows
   - Add to wishlist while offline → turn wifi on → confirm analytics event was queued and sent
   - Try to order while offline → confirm "This action needs internet" message appears
2. Fix any issues found during testing

**Done when:**
- [ ] Offline feed works
- [ ] Offline product details work
- [ ] Offline wishlist operations work
- [ ] Analytics queue flushes on reconnect

---

### Task 7.3 — Environment Config & README

**Goal:** Make the project easy to set up for any developer.

**Files to create:**
- `README.md`
- `backend/.env.example`
- `mobile/.env.example`

**Instructions:**
1. Write `README.md` covering:
   - Project overview (2-3 sentences)
   - Prerequisites (Node.js 18+, PostgreSQL, Expo CLI, Cloudinary account)
   - Backend setup steps: clone → `npm install` → copy `.env.example` → fill env vars → `npm run migrate` → `npm run dev`
   - Mobile setup steps: `cd mobile` → `npm install` → copy `.env.example` → fill env vars → `npx expo start`
   - How to create the first admin user (SQL command to insert into `admin_users`)
2. Ensure `.env.example` files list every required variable with a description comment

**Done when:**
- [ ] A new developer can follow the README and get both apps running
- [ ] No real secrets exist in any committed file

---

## Task Summary

| Phase | Tasks | What Gets Built |
|-------|-------|----------------|
| 1 | 1.1 – 1.5 | Project setup, DB, Zustand, API client |
| 2 | 2.1 – 2.7 | All backend API routes |
| 3 | 3.1 – 3.4 | Cache, network, analytics, toast |
| 4 | 4.1 – 4.6 | All user-facing screens |
| 5 | 5.1 – 5.6 | All admin screens + image upload |
| 6 | 6.1 – 6.4 | Error handling, device detection, offline sync, localization |
| 7 | 7.1 – 7.3 | Smoke test, offline test, README |

**Total: 27 tasks** — complete in order, one at a time.