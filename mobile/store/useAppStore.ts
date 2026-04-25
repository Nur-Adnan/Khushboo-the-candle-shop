import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AnalyticsEvent, Product, WishlistItem } from '@/types';

type AppStore = {
  feedProducts: Product[];
  feedCursor: string | null;
  feedLoading: boolean;
  setFeedLoading: (loading: boolean) => void;
  setFeedProducts: (products: Product[], cursor: string | null) => void;
  appendFeedProducts: (products: Product[], cursor: string | null) => void;

  wishlist: WishlistItem[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  isOnline: boolean;
  setOnline: (online: boolean) => void;

  adminToken: string | null;
  adminEmail: string | null;
  setAdmin: (token: string, email: string) => void;
  clearAdmin: () => void;

  analyticsQueue: AnalyticsEvent[];
  queueEvent: (event: AnalyticsEvent) => void;
  clearQueue: () => void;
};

function toWishlistItem(product: Product): WishlistItem {
  return {
    productId: product.id,
    addedAt: new Date().toISOString(),
    price: product.price,
    name: product.name,
    imagePublicId: product.imagePublicIds[0] ?? '',
  };
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      feedProducts: [],
      feedCursor: null,
      feedLoading: false,
      setFeedLoading: (loading) => set({ feedLoading: loading }),
      setFeedProducts: (products, cursor) =>
        set({
          feedProducts: products,
          feedCursor: cursor,
        }),
      appendFeedProducts: (products, cursor) =>
        set((state) => {
          const existingIds = new Set(state.feedProducts.map((product) => product.id));
          const newProducts = products.filter((product) => !existingIds.has(product.id));

          return {
            feedProducts: [...state.feedProducts, ...newProducts],
            feedCursor: cursor,
          };
        }),

      wishlist: [],
      addToWishlist: (product) =>
        set((state) => {
          if (state.wishlist.some((item) => item.productId === product.id)) {
            return state;
          }

          return {
            wishlist: [toWishlistItem(product), ...state.wishlist],
          };
        }),
      removeFromWishlist: (productId) =>
        set((state) => ({
          wishlist: state.wishlist.filter((item) => item.productId !== productId),
        })),
      isInWishlist: (productId) => get().wishlist.some((item) => item.productId === productId),

      isOnline: true,
      setOnline: (online) => set({ isOnline: online }),

      adminToken: null,
      adminEmail: null,
      setAdmin: (token, email) => set({ adminToken: token, adminEmail: email }),
      clearAdmin: () => set({ adminToken: null, adminEmail: null }),

      analyticsQueue: [],
      queueEvent: (event) =>
        set((state) => ({
          analyticsQueue: [...state.analyticsQueue, event],
        })),
      clearQueue: () => set({ analyticsQueue: [] }),
    }),
    {
      name: 'khusbooo-app-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        wishlist: state.wishlist,
        analyticsQueue: state.analyticsQueue,
      }),
    },
  ),
);

export type { AppStore };
