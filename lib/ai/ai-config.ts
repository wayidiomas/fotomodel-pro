/**
 * AI Generation Configuration
 *
 * Fetches AI model configuration from the database with caching.
 * This allows dynamic configuration changes without code deployments.
 */

import { createClient } from '@supabase/supabase-js';

// Cache configuration
let configCache: AIConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export type ImageSize = '1K' | '2K' | '4K';
export type MediaResolution = 'low' | 'medium' | 'high';

export interface AIConfig {
  /** Main Gemini model ID for image generation */
  modelId: string;
  /** Image output size: 1K (1024px), 2K (2048px), 4K (4096px) */
  imageSize: ImageSize;
  /** Model ID for prompt optimization */
  promptModelId: string;
  /** Enable thought signatures for multi-turn editing */
  enableThinking: boolean;
  /** Media resolution for vision processing */
  mediaResolution: MediaResolution;
  /** Fallback model if primary fails */
  fallbackModelId: string;
}

// Default configuration (used if database is unavailable)
const DEFAULT_CONFIG: AIConfig = {
  modelId: 'gemini-3-pro-image-preview',
  imageSize: '1K',
  promptModelId: 'gemini-2.5-flash-lite',
  enableThinking: false,
  mediaResolution: 'medium',
  fallbackModelId: 'gemini-2.5-flash-image',
};

/**
 * Get Supabase client for config fetching
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not found, using default AI config');
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Fetch AI configuration from database
 * Results are cached for 5 minutes to reduce database calls
 */
export async function getAIConfig(): Promise<AIConfig> {
  // Check cache
  const now = Date.now();
  if (configCache && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return configCache;
  }

  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return DEFAULT_CONFIG;
    }

    const { data, error } = await supabase
      .from('ai_generation_config')
      .select('config_key, config_value')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching AI config:', error);
      return configCache || DEFAULT_CONFIG;
    }

    // Parse config from database rows
    const configMap = new Map<string, string>();
    for (const row of data || []) {
      configMap.set(row.config_key, row.config_value);
    }

    const config: AIConfig = {
      modelId: configMap.get('gemini_model_id') || DEFAULT_CONFIG.modelId,
      imageSize: (configMap.get('gemini_image_size') as ImageSize) || DEFAULT_CONFIG.imageSize,
      promptModelId: configMap.get('gemini_prompt_model_id') || DEFAULT_CONFIG.promptModelId,
      enableThinking: configMap.get('gemini_enable_thinking') === 'true',
      mediaResolution: (configMap.get('gemini_media_resolution') as MediaResolution) || DEFAULT_CONFIG.mediaResolution,
      fallbackModelId: configMap.get('gemini_fallback_model_id') || DEFAULT_CONFIG.fallbackModelId,
    };

    // Update cache
    configCache = config;
    cacheTimestamp = now;

    return config;
  } catch (error) {
    console.error('Error in getAIConfig:', error);
    return configCache || DEFAULT_CONFIG;
  }
}

/**
 * Clear the config cache
 * Useful for forcing a refresh after config changes
 */
export function clearAIConfigCache(): void {
  configCache = null;
  cacheTimestamp = 0;
}

/**
 * Get a specific config value
 */
export async function getAIConfigValue<K extends keyof AIConfig>(key: K): Promise<AIConfig[K]> {
  const config = await getAIConfig();
  return config[key];
}
