/**
 * Gemini Image Generation Integration (Unified)
 *
 * Primary Model: Gemini 3 Pro Image Preview
 * - Supports up to 14 images per request
 * - Advanced reasoning and multi-step image generation
 * - Best quality for virtual try-on
 *
 * Fallback Model: Gemini 2.5 Flash Image
 * - Supports up to 3 images per request (enforced with priority limiting)
 * - Faster but lower quality than Gemini 3 Pro
 * - Used only when primary model fails after retries
 * - Enhanced prompts to compensate for image limit
 *
 * Features:
 * - Same structured contents format as virtualTryOn
 * - Retry/backoff logic with exponential delay
 * - Safety block detection
 * - Automatic fallback with image limiting
 * - Strong garment-wearing prompts for fallback
 * - Default 3:4 aspect ratio for fashion photography
 */

import { GoogleGenerativeAI, type Part } from '@google/generative-ai';
import { getAIConfig, type ImageSize, type AIConfig } from './ai-config';

// Retry configuration (same as gemini.ts)
const MAX_RETRIES = 2; // 2 retries = 3 total attempts on primary model
const INITIAL_RETRY_DELAY_MS = 1000; // 1 second
const MAX_RETRY_DELAY_MS = 5000; // 5 seconds max

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable (503, rate limits, temporary failures)
 */
function isRetryableError(error: any): boolean {
  if (!error) return false;

  const errorMessage = error.message?.toLowerCase() || '';
  const errorString = String(error).toLowerCase();

  // 503 Service Unavailable / Model Overloaded
  if (errorMessage.includes('503') || errorMessage.includes('overloaded')) return true;
  if (errorString.includes('503') || errorString.includes('overloaded')) return true;

  // 429 Rate Limit
  if (errorMessage.includes('429') || errorMessage.includes('rate limit')) return true;
  if (errorMessage.includes('quota')) return true;

  // Temporary/transient errors
  if (errorMessage.includes('temporarily') || errorMessage.includes('try again')) return true;
  if (errorMessage.includes('service unavailable')) return true;
  if (errorMessage.includes('internal error')) return true;

  // Network errors
  if (errorMessage.includes('econnreset') || errorMessage.includes('etimedout')) return true;
  if (errorMessage.includes('socket hang up')) return true;

  return false;
}

/**
 * Calculate delay with exponential backoff
 */
function getRetryDelay(attempt: number): number {
  const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
  return Math.min(delay, MAX_RETRY_DELAY_MS);
}

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  return new GoogleGenerativeAI(apiKey);
};

export type ImagenModel =
  | 'gemini-3-pro-image-preview'    // Nano Banana Pro - Current default
  | 'gemini-2.5-flash-image'        // Fallback model
  | 'imagen-4.0-generate-001'       // Standard quality
  | 'imagen-4.0-fast-generate-001'  // Fast generation
  | 'imagen-4.0-ultra-generate-001'; // Ultra quality

export type ImagenAspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';

export interface ImagenGenerateOptions {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: ImagenAspectRatio;
  model?: ImagenModel;
  imageSize?: ImageSize; // 1K, 2K, or 4K - loaded from config if not specified
  images?: Array<{
    data: string; // Base64 encoded
    mimeType: string;
  }>;
}

export interface ImagenResult {
  success: boolean;
  imageData?: string; // Base64 encoded result
  mimeType?: string;
  error?: string;
  tokensUsed?: number;
  model?: string;
}

/**
 * Extract base64 image data from Gemini response
 */
function extractImageFromResponse(response: any): string | null {
  try {
    const parts = response?.candidates?.[0]?.content?.parts;

    if (!parts || !Array.isArray(parts)) {
      console.error('[Imagen] No parts found in response');
      return null;
    }

    for (const part of parts) {
      // snake_case format (standard API response)
      if (part?.inline_data?.mime_type?.startsWith('image/')) {
        return part.inline_data.data;
      }
      // camelCase format (SDK normalized response)
      if (part?.inlineData?.mimeType?.startsWith('image/')) {
        return part.inlineData.data;
      }
    }

    console.error('[Imagen] No image data found in response parts');
    return null;
  } catch (error) {
    console.error('[Imagen] Error extracting image from response:', error);
    return null;
  }
}

/**
 * Get block reason from Gemini response
 */
function getGeminiBlockReason(response: any): string | null {
  if (!response) return null;

  const promptFeedbackReason = response?.promptFeedback?.blockReason;
  if (promptFeedbackReason) {
    return promptFeedbackReason;
  }

  const finishReason = response?.candidates?.[0]?.finishReason;
  if (finishReason && finishReason !== 'STOP') {
    return finishReason;
  }

  return null;
}

/**
 * Generate image using Gemini 3 Pro Image (Nano Banana Pro)
 *
 * Uses same structured format and retry logic as gemini.ts virtualTryOn.
 *
 * @param options - Generation options
 * @returns Image result with base64 data
 */
export async function generateWithImagen(
  options: ImagenGenerateOptions
): Promise<ImagenResult> {
  // Load config from database
  const config = await getAIConfig();

  const modelId = options.model || (config.modelId as ImagenModel);
  const imageSize = options.imageSize || config.imageSize;
  // Default to 3:4 for fashion photography (same as virtualTryOn)
  const aspectRatio = options.aspectRatio || '3:4';

  let lastError: any = null;

  console.log(`[Imagen] Starting generation with model: ${modelId}, images: ${options.images?.length || 0}`);

  // Try primary model with retries
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delay = getRetryDelay(attempt - 1);
        console.log(`[Imagen] Retry ${attempt}/${MAX_RETRIES} for ${modelId} after ${delay}ms`);
        await sleep(delay);
      }

      const client = getGeminiClient();

      // Configure generation (same format as gemini.ts)
      const model = client.getGenerativeModel({
        model: modelId,
        generationConfig: {
          response_modalities: ['IMAGE'],
          image_config: {
            aspect_ratio: aspectRatio,
            image_size: imageSize,
          },
        } as any,
      });

      // Build prompt
      let fullPrompt = options.prompt;
      if (options.negativePrompt) {
        fullPrompt += `\n\nAvoid: ${options.negativePrompt}`;
      }

      // Build parts array (same structured format as gemini.ts)
      const parts: Part[] = [
        {
          text: fullPrompt,
        },
      ];

      // Add reference images
      if (options.images && options.images.length > 0) {
        for (const image of options.images) {
          parts.push({
            inlineData: {
              data: image.data,
              mimeType: image.mimeType,
            },
          });
        }
      }

      // Use structured contents format (same as gemini.ts virtualTryOn)
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
      });

      const response = await result.response;
      const imageData = extractImageFromResponse(response);

      if (imageData) {
        console.log(`[Imagen] Success with ${modelId} on attempt ${attempt + 1}`);
        return {
          success: true,
          imageData,
          mimeType: 'image/png',
          tokensUsed: (response as any)?.usageMetadata?.totalTokenCount,
          model: modelId,
        };
      }

      // Check if blocked by safety (don't retry safety blocks)
      const blockReason = getGeminiBlockReason(response);
      if (blockReason === 'SAFETY') {
        console.warn(`[Imagen] Blocked by safety policy`);
        return {
          success: false,
          error: 'O Gemini bloqueou esta geração por política de segurança. Tente com outra imagem ou descrição.',
        };
      }

      lastError = new Error('No image data in response');
      if (attempt < MAX_RETRIES) {
        console.warn(`[Imagen] No image data from ${modelId}, retrying...`);
        continue;
      }
    } catch (error) {
      lastError = error;
      console.error(`[Imagen] Error with ${modelId} (attempt ${attempt + 1}):`, error);

      if (isRetryableError(error) && attempt < MAX_RETRIES) {
        console.warn(`[Imagen] Retryable error, will retry...`);
        continue;
      }

      if (!isRetryableError(error)) {
        break;
      }
    }
  }

  // All retries failed - try fallback
  if (modelId !== config.fallbackModelId) {
    console.warn(`[Imagen] Primary ${modelId} failed after ${MAX_RETRIES + 1} attempts, using fallback ${config.fallbackModelId}`);
    return generateWithImagenFallback(options, config.fallbackModelId, config);
  }

  return {
    success: false,
    error: lastError?.message || 'Não foi possível gerar a imagem. Tente novamente em alguns instantes.',
  };
}

/**
 * Internal helper for fallback model
 */
/**
 * Detect generation scenario based on prompt content
 */
function detectGenerationScenario(prompt: string): {
  isImprovement: boolean;
  hasMultipleGarments: boolean;
  hasBackground: boolean;
} {
  const promptLower = prompt.toLowerCase();

  return {
    isImprovement: promptLower.includes('improvement') || promptLower.includes('melhorar') || promptLower.includes('improve'),
    hasMultipleGarments: promptLower.includes('reference image 2:') && promptLower.includes('garment'),
    hasBackground: promptLower.includes('background') || promptLower.includes('fundo'),
  };
}

/**
 * Build scenario-specific prompt for fallback
 */
function buildFallbackPrompt(
  basePrompt: string,
  scenario: { isImprovement: boolean; hasMultipleGarments: boolean; hasBackground: boolean },
  negativePrompt?: string
): string {
  let fullPrompt = basePrompt;

  if (scenario.isImprovement) {
    // SCENARIO: Improvement - preserve everything, change only what user asked
    fullPrompt += `\n\n🔴 CRITICAL - IMAGE IMPROVEMENT MODE:
1. This is an IMPROVEMENT of an existing image, NOT a new generation
2. PRESERVE 100%: model's face, identity, body proportions, pose, camera angle, lighting
3. ONLY modify what the user explicitly requested to change
4. Keep all garments, styling, and composition identical unless specifically asked to change
5. Treat this as surgical editing - minimal changes, maximum preservation
6. The reference image is the BASE - honor it completely`;

  } else if (scenario.hasMultipleGarments) {
    // SCENARIO: 2 Garments - combine both pieces on model
    fullPrompt += `\n\n🔴 CRITICAL - TWO-PIECE OUTFIT MODE:
1. BOTH garments from reference images MUST be worn by the model simultaneously
2. Layer the garments appropriately (e.g., jacket over shirt, top with bottom)
3. The model must be WEARING both pieces - visible and properly fitted
4. Reproduce BOTH garments with exact fabric textures, colors, patterns, and cuts
5. Ensure proper sizing and draping for each garment
6. Show complete outfit with both pieces clearly visible
7. This is virtual try-on of a COMBINED OUTFIT - both garments are REQUIRED`;

  } else {
    // SCENARIO: Single Garment - focus on one piece
    fullPrompt += `\n\n🔴 CRITICAL - SINGLE GARMENT MODE:
1. The garment from the reference image MUST be worn by the model
2. The garment is the PRIMARY FOCUS - must be clearly visible and properly fitted
3. Model must be WEARING the clothing item - not holding it, DRESSED IN IT
4. Reproduce fabric texture, color, pattern, cut, and silhouette with absolute precision
5. Position garment naturally on the body with realistic draping and fit
6. Show the garment prominently - it's the main subject of this fashion photograph
7. This is virtual fashion try-on - the garment is REQUIRED on the model's body`;
  }

  // Add background handling note
  if (scenario.hasBackground) {
    fullPrompt += `\n8. Apply the specified background behind the model while maintaining focus on the garment(s)`;
  } else {
    fullPrompt += `\n8. Use a clean, neutral background that doesn't distract from the garment(s)`;
  }

  if (negativePrompt) {
    fullPrompt += `\n\nAvoid: ${negativePrompt}`;
  }

  return fullPrompt;
}

async function generateWithImagenFallback(
  options: ImagenGenerateOptions,
  modelId: string,
  config: AIConfig
): Promise<ImagenResult> {
  try {
    const client = getGeminiClient();
    const imageSize = options.imageSize || config.imageSize;
    const aspectRatio = options.aspectRatio || '3:4';

    console.log(`[Imagen] Fallback with model: ${modelId}, images: ${options.images?.length || 0}`);

    // Gemini 2.5 Flash Image supports UP TO 3 IMAGES per request
    const MAX_IMAGES_FALLBACK = 3;
    let imagesToUse = options.images || [];

    // Limit to 3 images max
    if (imagesToUse.length > MAX_IMAGES_FALLBACK) {
      console.warn(`[Imagen] Fallback model ${modelId} supports max ${MAX_IMAGES_FALLBACK} images. Limiting from ${imagesToUse.length} to ${MAX_IMAGES_FALLBACK}. Keeping first ${MAX_IMAGES_FALLBACK} (priority order).`);
      imagesToUse = imagesToUse.slice(0, MAX_IMAGES_FALLBACK);
    }

    // Detect scenario
    const scenario = detectGenerationScenario(options.prompt);
    console.log(`[Imagen] Fallback scenario:`, scenario);

    const model = client.getGenerativeModel({
      model: modelId,
      generationConfig: {
        response_modalities: ['IMAGE'],
        image_config: {
          aspect_ratio: aspectRatio,
          image_size: imageSize,
        },
      } as any,
    });

    // Build scenario-specific prompt
    const fullPrompt = buildFallbackPrompt(options.prompt, scenario, options.negativePrompt);

    // Build parts array with LIMITED images
    const parts: Part[] = [
      {
        text: fullPrompt,
      },
    ];

    // Add reference images (up to 3 max for fallback)
    if (imagesToUse.length > 0) {
      for (const image of imagesToUse) {
        parts.push({
          inlineData: {
            data: image.data,
            mimeType: image.mimeType,
          },
        });
      }
      console.log(`[Imagen] Fallback using ${imagesToUse.length} reference images`);
    }

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
    });

    const response = await result.response;
    const imageData = extractImageFromResponse(response);

    if (!imageData) {
      const blockReason = getGeminiBlockReason(response);
      if (blockReason === 'SAFETY') {
        return {
          success: false,
          error: 'O Gemini bloqueou esta geração por política de segurança. Tente com outra imagem ou descrição.',
        };
      }
      return {
        success: false,
        error: 'Não foi possível gerar a imagem com o modelo de fallback.',
      };
    }

    console.log(`[Imagen] Fallback success with ${modelId}`);
    return {
      success: true,
      imageData,
      mimeType: 'image/png',
      tokensUsed: (response as any)?.usageMetadata?.totalTokenCount,
      model: modelId,
    };
  } catch (error) {
    console.error('[Imagen] Error in fallback:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if Imagen API is available
 */
export async function checkImagenAvailability(): Promise<{
  available: boolean;
  error?: string;
}> {
  try {
    getGeminiClient();
    return {
      available: true,
    };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
