export const strings = {
  en: {
    appName: 'KHUSBOOO',
    tabs: {
      home: 'Home',
      explore: 'Explore',
      wishlist: 'Wishlist',
    },
    common: {
      loading: 'Loading...',
      retry: 'Retry',
      outOfStock: 'Out of Stock',
      addToWishlist: 'Add to Wishlist',
      removeFromWishlist: 'Remove from Wishlist',
      orderViaWhatsApp: 'Order via WhatsApp',
      orderViaMessenger: 'Order via Messenger',
      share: 'Share',
      noInternet: 'No internet connection',
      somethingWentWrong: 'Something went wrong. Please try again.',
    },
    home: {
      title: 'Discover candles',
      subtitle: 'A visual feed of handmade candles is coming next.',
    },
    explore: {
      title: 'Browse categories',
      subtitle: 'Find candles by scent family.',
    },
    wishlist: {
      title: 'Wishlist',
      empty: 'Your wishlist is empty.',
    },
  },
  bn: {
    appName: 'খুশবু',
    tabs: {
      home: 'হোম',
      explore: 'এক্সপ্লোর',
      wishlist: 'উইশলিস্ট',
    },
    common: {
      loading: 'লোড হচ্ছে...',
      retry: 'আবার চেষ্টা করুন',
      outOfStock: 'স্টক নেই',
      addToWishlist: 'উইশলিস্টে যোগ করুন',
      removeFromWishlist: 'উইশলিস্ট থেকে সরান',
      orderViaWhatsApp: 'WhatsApp-এ অর্ডার করুন',
      orderViaMessenger: 'Messenger-এ অর্ডার করুন',
      share: 'শেয়ার করুন',
      noInternet: 'ইন্টারনেট সংযোগ নেই',
      offlineMode: 'আপনি অফলাইনে আছেন',
      somethingWentWrong: 'সমস্যা হয়েছে। আবার চেষ্টা করুন।',
    },
    home: {
      title: 'মোমবাতি আবিষ্কার করুন',
      subtitle: 'হ্যান্ডমেড মোমবাতির ভিজ্যুয়াল ফিড শীঘ্রই আসছে।',
    },
    explore: {
      title: 'ক্যাটাগরি দেখুন',
      subtitle: 'সুবাসের ধরন অনুযায়ী মোমবাতি খুঁজুন।',
    },
    wishlist: {
      title: 'উইশলিস্ট',
      empty: 'আপনার wishlist খালি',
    },
  },
} as const;

export function formatPrice(paisa: number): string {
  return `৳ ${Math.round(paisa / 100)}`;
}
