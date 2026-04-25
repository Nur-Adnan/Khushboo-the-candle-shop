export const config = {
  API_URL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
  CLOUDINARY_CLOUD_NAME: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '',
  WHATSAPP_NUMBER: process.env.EXPO_PUBLIC_WHATSAPP_NUMBER ?? '',
  FACEBOOK_BUSINESS_PAGE_ID: process.env.EXPO_PUBLIC_FACEBOOK_BUSINESS_PAGE_ID ?? '',
  PAGE_SIZE: 12,
  MAX_CACHE_MB: 50,
} as const;

export const CACHE_LIMIT_BYTES = config.MAX_CACHE_MB * 1024 * 1024;
