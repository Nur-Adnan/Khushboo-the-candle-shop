# Khushboo: candle shop app

A product-discovery app for a candle shop: an Expo (React Native) mobile client backed by an Express and PostgreSQL API.

## Repository layout

```
backend/   Express + TypeScript API
mobile/    Expo Router app (React Native, NativeWind, Zustand)
.kiro/     Spec documents: requirements, design and tasks
```

## Backend

- Express with TypeScript, with route modules for auth, products, categories, search and analytics
- PostgreSQL through `pg`, with a plain SQL migration in `src/db/migrations`
- JWT authentication middleware and bcrypt password hashing
- Helmet, CORS and rate limiting (`express-rate-limit`)
- Structured request logging with Pino
- Cloudinary for product images

```bash
cd backend
npm install
cp .env.example .env     # set DATABASE_URL, JWT_SECRET and the Cloudinary keys
npm run migrate
npm run dev
```

## Mobile

- Expo Router with three tabs: Home, Explore and Wishlist
- NativeWind (Tailwind CSS) for styling
- Zustand for app state and an Axios client in `services/api.ts`

```bash
cd mobile
npm install
cp .env.example .env     # point the app at your API
npx expo start
```
