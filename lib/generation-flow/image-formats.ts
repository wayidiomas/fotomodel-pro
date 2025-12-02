/**
 * Image Format Constants and Types
 * Defines platforms, aspect ratios, and format presets for image generation
 */

// Platform constants
export const PLATFORMS = {
  INSTAGRAM: 'instagram',
  SHOPIFY: 'shopify',
  ECOMMERCE: 'ecommerce',
  FACEBOOK: 'facebook',
  PINTEREST: 'pinterest',
  LINKEDIN: 'linkedin',
  TWITTER: 'twitter',
  TIKTOK: 'tiktok',
  WHATSAPP: 'whatsapp',
  PRINT: 'print',
  CUSTOM: 'custom',
} as const;

export type Platform = typeof PLATFORMS[keyof typeof PLATFORMS];

// Aspect ratio constants
export const ASPECT_RATIOS = {
  SQUARE: '1:1',
  PORTRAIT: '4:5',
  STORY: '9:16',
  LANDSCAPE: '16:9',
  WIDE: '1.91:1',
  PIN: '2:3',
  A4: '1.41:1',
  CUSTOM: 'custom',
} as const;

export type AspectRatio = typeof ASPECT_RATIOS[keyof typeof ASPECT_RATIOS];

// Gemini 2.5 Flash supported aspect ratios with exact dimensions
export const GEMINI_ASPECT_RATIOS = {
  '1:1': { width: 1024, height: 1024 },
  '2:3': { width: 832, height: 1248 },
  '3:2': { width: 1248, height: 832 },
  '3:4': { width: 864, height: 1184 },
  '4:3': { width: 1184, height: 864 },
  '4:5': { width: 896, height: 1152 },
  '5:4': { width: 1152, height: 896 },
  '9:16': { width: 768, height: 1344 },
  '16:9': { width: 1344, height: 768 },
  '21:9': { width: 1536, height: 672 },
} as const;

export type GeminiAspectRatio = keyof typeof GEMINI_ASPECT_RATIOS;

// Category constants
export const CATEGORIES = {
  SOCIAL: 'social',
  ECOMMERCE: 'ecommerce',
  PRINT: 'print',
  CUSTOM: 'custom',
} as const;

export type Category = typeof CATEGORIES[keyof typeof CATEGORIES];

// Image format preset interface (matches database table)
export interface ImageFormatPreset {
  id: string;
  name: string;
  platform: Platform;
  aspect_ratio: AspectRatio;
  width: number;
  height: number;
  description?: string;
  icon_name?: string;
  category?: Category;
  gemini_aspect_ratio?: string; // Gemini 2.5 Flash compatible aspect ratio (e.g., "1:1", "9:16")
  is_premium?: boolean;
  is_active?: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

// Platform display names (for UI)
export const PLATFORM_LABELS: Record<Platform, string> = {
  [PLATFORMS.INSTAGRAM]: 'Instagram',
  [PLATFORMS.SHOPIFY]: 'Shopify',
  [PLATFORMS.ECOMMERCE]: 'E-commerce',
  [PLATFORMS.FACEBOOK]: 'Facebook',
  [PLATFORMS.PINTEREST]: 'Pinterest',
  [PLATFORMS.LINKEDIN]: 'LinkedIn',
  [PLATFORMS.TWITTER]: 'Twitter/X',
  [PLATFORMS.TIKTOK]: 'TikTok',
  [PLATFORMS.WHATSAPP]: 'WhatsApp',
  [PLATFORMS.PRINT]: 'Impressão',
  [PLATFORMS.CUSTOM]: 'Personalizado',
};

// Category display names
export const CATEGORY_LABELS: Record<Category, string> = {
  [CATEGORIES.SOCIAL]: 'Redes Sociais',
  [CATEGORIES.ECOMMERCE]: 'E-commerce',
  [CATEGORIES.PRINT]: 'Impressão',
  [CATEGORIES.CUSTOM]: 'Personalizado',
};

// Helper function to get aspect ratio from dimensions
export function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

// Helper function to validate dimensions
export function validateDimensions(width: number, height: number): { valid: boolean; error?: string } {
  const MIN_SIZE = 100;
  const MAX_SIZE = 5000;

  if (width < MIN_SIZE || height < MIN_SIZE) {
    return { valid: false, error: `Dimensões mínimas: ${MIN_SIZE}x${MIN_SIZE}px` };
  }

  if (width > MAX_SIZE || height > MAX_SIZE) {
    return { valid: false, error: `Dimensões máximas: ${MAX_SIZE}x${MAX_SIZE}px` };
  }

  return { valid: true };
}

// Helper to get dimensions from aspect ratio and width
export function getDimensionsFromRatio(aspectRatio: string, targetWidth: number): { width: number; height: number } {
  const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);

  if (!widthRatio || !heightRatio) {
    return { width: targetWidth, height: targetWidth };
  }

  const height = Math.round((targetWidth * heightRatio) / widthRatio);
  return { width: targetWidth, height };
}

// Popular format presets (client-side constants matching seed data)
export const POPULAR_FORMATS = {
  INSTAGRAM_POST: {
    name: 'Instagram Post',
    platform: PLATFORMS.INSTAGRAM,
    aspect_ratio: ASPECT_RATIOS.SQUARE,
    width: 1080,
    height: 1080,
  },
  INSTAGRAM_STORY: {
    name: 'Instagram Story',
    platform: PLATFORMS.INSTAGRAM,
    aspect_ratio: ASPECT_RATIOS.STORY,
    width: 1080,
    height: 1920,
  },
  SHOPIFY_PRODUCT: {
    name: 'Shopify Produto',
    platform: PLATFORMS.SHOPIFY,
    aspect_ratio: ASPECT_RATIOS.SQUARE,
    width: 2048,
    height: 2048,
  },
  FACEBOOK_POST: {
    name: 'Facebook Post',
    platform: PLATFORMS.FACEBOOK,
    aspect_ratio: ASPECT_RATIOS.SQUARE,
    width: 1200,
    height: 1200,
  },
} as const;
