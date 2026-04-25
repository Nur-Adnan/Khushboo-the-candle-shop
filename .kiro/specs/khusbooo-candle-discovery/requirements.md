# KHUSBOOO - Candle Discovery Mobile App
## Requirements Document (Kiro / Haiku 4.5 Optimized)

---

## Introduction

KHUSBOOO is a Pinterest-style mobile app for discovering and ordering candles in Bangladesh. Users browse a visual feed, save favorites, and order via WhatsApp or Messenger. Admins manage products and view basic analytics via a dashboard.

**Tech Stack**: React Native (Expo), Node.js + Express backend, PostgreSQL, Cloudinary for images, AsyncStorage for local data, JWT for admin auth.

---

## Glossary

- **User**: Person browsing and discovering candles
- **Admin**: Store manager who manages products and views analytics
- **Feed**: Infinite-scroll grid of candle products
- **Product**: A candle item with name, price, images, description, and category
- **Wishlist**: Locally saved list of products the user wants to buy later
- **Category**: Scent group (Floral, Fruity, Woody, Fresh, Spicy, Seasonal, Luxury, Eco-Friendly)
- **Order Intent**: When a user taps "Order via WhatsApp" to start a purchase
- **JWT Token**: Admin login credential, expires after 24 hours

---

## User Personas

### Persona 1: Casual Shopper (Primary)
- Age 18–35, urban Bangladesh, uses mid-range Android
- Wants to browse easily, save favorites, and order quickly
- Pain points: slow apps, high data usage

### Persona 2: Gift Buyer (Secondary)
- Age 25–45, occasional buyer
- Wants clear product info and easy sharing
- Pain points: confusing descriptions, hard checkout

### Persona 3: Admin / Store Manager (Tertiary)
- Manages products daily, tracks what's selling
- Uses desktop or tablet with good internet
- Pain points: manual work, no visibility into performance

---

## Requirements

---

### Requirement 1: Home Feed

**User Story:** As a user, I want to browse a scrolling grid of candle products so I can discover new items.

#### Acceptance Criteria

1. WHEN the app opens, the feed SHALL show a 2-column grid of products with image, name, and price
2. WHEN the user scrolls to the bottom, the next page of products SHALL load automatically (12 products per page)
3. WHEN a product image fails to load, a placeholder image SHALL be shown
4. WHEN the user pulls down, the feed SHALL refresh and show the latest products
5. WHEN a product is tapped, the app SHALL open the Product Details screen
6. The feed SHALL cache the current and next page in memory for smooth scrolling
7. On low-end devices (under 2GB RAM), images SHALL load at 480px width maximum

#### Non-Functional Requirements
- Feed loads in under 2 seconds on 3G
- Initial data load under 500KB
- All images must have alt text

---

### Requirement 2: Product Details

**User Story:** As a user, I want to see full product info so I can decide whether to buy.

#### Acceptance Criteria

1. WHEN a product is selected, the screen SHALL show: name, price, category, description, scent notes, burn time, size
2. The screen SHALL show an image carousel with at least 3 images and pinch-to-zoom
3. WHEN the user taps "Add to Wishlist", the product SHALL be saved locally and the button SHALL change to "Remove from Wishlist"
4. WHEN the user taps "Order via WhatsApp", WhatsApp SHALL open with a pre-filled message in Bengali containing product name and price
5. WHEN the user taps "Share", the native share sheet SHALL open with product name and link
6. WHEN a product is out of stock, an "Out of Stock" badge SHALL appear and the Order button SHALL be disabled
7. On low-end devices, images SHALL load as thumbnail first, then full resolution

#### Non-Functional Requirements
- Screen loads in under 1.5 seconds
- Product details viewable offline if previously cached

---

### Requirement 3: Search

**User Story:** As a user, I want to search for candles by name or category so I can find what I want quickly.

#### Acceptance Criteria

1. WHEN the user taps the search icon, a text input with keyboard SHALL appear
2. WHEN the user types, search suggestions SHALL appear after 300ms delay
3. WHEN the user submits a search, results SHALL show in the same 2-column grid layout
4. WHEN there are no results, a "No results found" message with tips SHALL appear
5. WHEN the search field is cleared, the main feed SHALL return
6. Search SHALL support filtering by category and price range
7. The last 10 searches SHALL be saved locally for quick re-use

#### Non-Functional Requirements
- Suggestions appear in under 500ms
- Results appear in under 1 second

---

### Requirement 4: Wishlist

**User Story:** As a user, I want to save products for later and share my wishlist with others.

#### Acceptance Criteria

1. WHEN a product is added to the wishlist, it SHALL be saved to local device storage (AsyncStorage)
2. WHEN the user opens the Wishlist screen, all saved products SHALL show in a grid
3. WHEN the user removes a product, it SHALL be deleted from local storage immediately
4. WHEN the user taps "Share Wishlist", a shareable link SHALL be generated and the native share sheet SHALL open
5. WHEN the wishlist has over 50 products, it SHALL paginate (20 per page)
6. Out of stock products SHALL remain in the wishlist with an "Out of Stock" badge
7. The wishlist SHALL support sorting by: date added, price low to high, price high to low
8. WHEN the user scrolls to the bottom of a wishlist page, the next page SHALL load automatically

#### Non-Functional Requirements
- Add/remove operations complete in under 100ms
- Wishlist data stored under 5MB on device

---

### Requirement 5: Browse by Category

**User Story:** As a user, I want to browse candles by scent category so I can find what I like.

#### Acceptance Criteria

1. WHEN the user opens the Explore tab, a grid of category cards SHALL show with name and image
2. Categories SHALL include: Floral, Fruity, Woody, Fresh, Spicy, Seasonal, Luxury, Eco-Friendly
3. WHEN a category is tapped, all products in that category SHALL show in the standard grid layout
4. Each category card SHALL show the number of products in that category
5. A breadcrumb navigation SHALL show: Home > Categories > [Category Name]
6. WHEN offline, cached category data SHALL be shown if available
7. On low-end devices, category images SHALL load at 240px width

#### Non-Functional Requirements
- Category grid loads in under 1 second
- Category data cached for 24 hours

---

### Requirement 6: Admin Login

**User Story:** As an admin, I want to securely log in so I can manage products and see analytics.

#### Acceptance Criteria

1. The login screen SHALL have email and password fields
2. WHEN valid credentials are entered, a JWT token SHALL be returned and stored securely on device
3. WHEN invalid credentials are entered, an error SHALL say "Invalid email or password" (no hint about which field is wrong)
4. WHEN the JWT token expires after 24 hours, the admin SHALL be automatically logged out
5. WHEN the admin taps Logout, the token SHALL be deleted and the admin sent to the login screen
6. Login SHALL be rate-limited to 5 attempts per 15 minutes
7. Any attempt to access admin screens without a valid token SHALL redirect to login

#### Non-Functional Requirements
- Login completes in under 2 seconds
- Passwords stored with bcrypt (minimum 10 rounds)

---

### Requirement 7: Admin Product Management (CRUD)

**User Story:** As an admin, I want to add, edit, and delete products so I can keep the catalog up to date.

#### Acceptance Criteria

1. WHEN the admin opens the dashboard, they SHALL see options: Products, Analytics, Logout
2. The Products screen SHALL list all products with name, price, category, and active/inactive status
3. WHEN the admin taps "Add Product", a form SHALL appear with fields: name, description, price, category, scent notes, burn time, size, images
4. WHEN images are uploaded, they SHALL go to Cloudinary and return a URL
5. WHEN the form is submitted, all required fields SHALL be validated before saving
6. WHEN "Edit" is tapped on a product, the form SHALL open pre-filled with that product's data
7. WHEN "Delete" is tapped, a confirmation dialog SHALL appear before deleting the product and its images from Cloudinary
8. The admin SHALL be able to search products by name in real-time
9. The admin SHALL be able to mark products as active or inactive (inactive products don't appear in the user feed)

#### Non-Functional Requirements
- Product list loads in under 2 seconds
- Uploaded images auto-resized: main image to 1200px width, thumbnail to 480px

---

### Requirement 8: Analytics Dashboard

**User Story:** As an admin, I want to see basic usage stats so I can understand what products are popular.

#### Acceptance Criteria

1. WHEN a user views a product, a "product_view" event SHALL be recorded (product ID + timestamp)
2. WHEN a user adds a product to wishlist, a "wishlist_add" event SHALL be recorded
3. WHEN a user taps "Order via WhatsApp", an "order_intent" event SHALL be recorded
4. WHEN the admin opens Analytics, they SHALL see: total views, total wishlist adds, total order intents, top 10 products by views
5. The admin SHALL be able to filter analytics by date range
6. Analytics events SHALL NOT store any personal user information
7. WHEN the app is offline, events SHALL be queued locally and sent when internet returns

#### Non-Functional Requirements
- Analytics queries complete in under 2 seconds
- Events sent in batches every 5 minutes to reduce server load
- Analytics data kept for 90 days

---

### Requirement 9: Image Upload (Cloudinary)

**User Story:** As an admin, I want to upload product images that are automatically optimized for fast loading.

#### Acceptance Criteria

1. WHEN the admin taps the image upload button, the device camera or photo library SHALL open
2. WHEN an image is selected, a preview with crop and rotate options SHALL appear
3. WHEN crop/rotate is confirmed, the edited image SHALL be prepared for upload
4. WHEN confirmed, the image SHALL upload to Cloudinary in WebP format at 80% quality
5. WHEN the upload succeeds, the Cloudinary URL SHALL be saved with the product
6. WHEN the upload fails, an error message SHALL appear with a retry option
7. Multiple images SHALL be uploadable with a progress indicator
8. WHEN a product is deleted, its images SHALL also be deleted from Cloudinary
9. Users on low-end devices SHALL automatically receive 480px images; others get 1200px

#### Non-Functional Requirements
- Upload completes in under 10 seconds on 4G, 30 seconds on 3G
- Images served in WebP; JPEG fallback for older Android versions

---

### Requirement 10: Offline Support

**User Story:** As a user with bad internet, I want to browse previously loaded products even when offline.

#### Acceptance Criteria

1. WHEN the internet goes offline, a visible "Offline Mode" banner SHALL appear
2. WHEN offline, the cached feed products SHALL still be shown
3. WHEN offline, previously viewed product details SHALL still be accessible
4. WHEN offline, the wishlist SHALL still be viewable and editable
5. WHEN the user tries to order or share while offline, a message SHALL say "This action needs internet"
6. WHEN internet returns, any queued analytics events SHALL automatically sync
7. Cache SHALL auto-clear when it exceeds 50MB (oldest items removed first)
8. Cache expiry: feed = 24 hours, product details = 7 days, categories = 24 hours

#### Non-Functional Requirements
- Offline operations complete in under 100ms
- Cache stored under 50MB on device

---

### Requirement 11: Error Handling & User Feedback

**User Story:** As a user, I want clear messages when something goes wrong so I know what to do next.

#### Acceptance Criteria

1. WHEN an API request fails, a friendly error message SHALL appear (no technical error codes)
2. WHEN an image fails to load, a placeholder SHALL show with an option to retry
3. WHEN a required form field is missing, a clear validation message SHALL appear near that field
4. WHEN an unexpected error occurs, a "Something went wrong. Please try again." message SHALL appear
5. WHEN the user is offline, a "No internet connection" message SHALL appear
6. WHEN an action succeeds (e.g., product saved), a toast notification SHALL confirm it
7. WHEN a long action is running (e.g., upload), a loading indicator SHALL be shown
8. WHEN deleting a product or item, a confirmation dialog SHALL always appear first
9. All errors SHALL be logged server-side for debugging (no PII in logs)

---

### Requirement 12: Bangladesh Market Localization

**User Story:** As a user in Bangladesh, I want the app to feel local and familiar.

#### Acceptance Criteria

1. All UI text SHALL support Bengali language
2. Prices SHALL display in BDT format (e.g., "৳ 500")
3. WhatsApp pre-filled messages SHALL be written in Bengali
4. WhatsApp and Messenger SHALL be the primary ordering channels shown
5. The app SHALL work on 2G/3G networks with reduced image sizes
6. The app SHALL prioritize Android optimization

#### Non-Functional Requirements
- No hardcoded strings in UI (all text translatable)
- App works on low-end Android devices (1–2GB RAM)
- Android market is primary target (90%+ of Bangladesh users)

---

## Non-Functional Requirements Summary

| Area | Target |
|------|--------|
| Feed load time | Under 2 seconds on 3G |
| Product detail load | Under 1.5 seconds |
| Search results | Under 1 second |
| Minimum frame rate | 30 FPS on low-end devices |
| App memory usage | Under 150MB on low-end devices |
| Cache size | Under 50MB |
| Wishlist storage | Under 5MB |
| App bundle size | Under 5MB (gzipped) |
| API security | HTTPS / TLS 1.2+ |
| Admin auth | JWT, 24-hour expiry, bcrypt passwords |
| Rate limiting | 100 requests/min per IP |
| Tap target size | Minimum 44×44pt |
| Accessibility | WCAG 2.1 Level AA |

---

## Out of Scope (Post-MVP)

These features are planned for a future version and should NOT be built now:

- User accounts and cloud wishlist sync
- Direct payment (Stripe, bKash, Nagad)
- Order tracking and delivery status
- Product reviews and ratings
- Personalized feed / recommendation engine
- Social features (follow, collections)
- Advanced admin analytics (sales reports, CSV export)
- Web platform / desktop admin dashboard
- Multi-language support beyond Bengali/English

---

## Success Metrics

- 70%+ of users return within 7 days
- 5%+ of product views lead to a WhatsApp order click
- 95%+ of feed loads complete in under 2 seconds
- 99.9% app uptime, under 0.1% crash rate
- Average session over 5 minutes with 10+ products viewed