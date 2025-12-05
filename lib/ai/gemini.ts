/**
 * Google Gemini Image Generation Integration
 * Model: gemini-3-pro-image-preview (Nano Banana Pro)
 *
 * Configuration loaded dynamically from database via ai_generation_config table.
 *
 * Capabilities:
 * - Text-to-Image generation
 * - Image editing with natural language
 * - Multi-image composition (up to 14 images with Gemini 3 Pro)
 * - Virtual Try-On (fashion photography)
 * - Advanced text rendering
 * - Configurable image size: 1K, 2K, 4K
 * - 10 aspect ratios: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
 *
 * Pricing (Gemini 3 Pro):
 * - 1K/2K: $0.134 per image
 * - 4K: $0.24 per image
 * - Batch API: 50% discount
 *
 * All images include invisible SynthID watermark
 */

import { GoogleGenerativeAI, type Part } from '@google/generative-ai';
import { getAIConfig, type ImageSize, type AIConfig } from './ai-config';

// Retry configuration
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

// Initialize Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  return new GoogleGenerativeAI(apiKey);
};

function flattenContentParts(node: any): any[] {
  const normalized: any[] = [];
  const visit = (value: any) => {
    if (!value) {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (Array.isArray(value.parts)) {
      value.parts.forEach(visit);
      return;
    }
    if (value.parts) {
      visit(value.parts);
      return;
    }
    normalized.push(value);
  };
  visit(node);
  return normalized;
}

function collectResponseParts(response: any): any[] | null {
  if (!response) {
    return null;
  }

  const candidateContent = response?.candidates?.[0]?.content;
  const candidateParts = flattenContentParts(candidateContent);
  if (candidateParts.length > 0) {
    return candidateParts;
  }

  const altOutput =
    response?.output ||
    response?.modelOutputs ||
    response?.candidates?.[0]?.content?.[0]?.parts;
  const altParts = flattenContentParts(altOutput);
  return altParts.length > 0 ? altParts : null;
}

function getGeminiBlockReason(response: any): string | null {
  if (!response) {
    return null;
  }
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
 * Extract base64 image data from Gemini 2.5 Flash Image response
 *
 * Response structure:
 * - response.candidates[0].content.parts[]
 * - Each part can be text or inline_data (image)
 * - Images have mime_type starting with 'image/'
 */
function extractImageFromResponse(response: any): string | null {
  try {
    const parts = collectResponseParts(response);

    if (!parts) {
      const blockReason = getGeminiBlockReason(response);
      console.error(
        blockReason
          ? `Gemini response blocked (${blockReason})`
          : 'No parts found in Gemini response'
      );
      return null;
    }

    // Find the first part containing image data
    for (const part of parts) {
      if (part?.inline_data?.mime_type?.startsWith('image/')) {
        return part.inline_data.data;
      }
      if (part?.inlineData?.mimeType?.startsWith('image/')) {
        return part.inlineData.data;
      }
      if (part?.image?.base64) {
        return part.image.base64;
      }
    }

    console.error('No image data found in response parts');
    return null;
  } catch (error) {
    console.error('Error extracting image from Gemini response:', error);
    return null;
  }
}

export type GeminiAspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';

export interface GenerateImageOptions {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: GeminiAspectRatio;
  responseModality?: 'Image' | 'Text' | 'Both'; // Default: Both
}

export interface EditImageOptions {
  prompt: string;
  imageData: string; // Base64 encoded image
  mimeType: string;
}

export interface BlendImagesOptions {
  prompt: string;
  images: Array<{
    data: string; // Base64 encoded
    mimeType: string;
  }>;
}

export interface VirtualTryOnOptions {
  prompt: string;
  // Support for both single garment (string) and multiple garments (array) for outfits
  garmentImageData: string | string[]; // Base64 encoded garment image(s)
  poseImageData: string; // Base64 encoded pose/model image
  garmentMimeType?: string | string[]; // Mime type(s) matching garmentImageData
  poseMimeType?: string;
  // Optional background image for integrated generation (3rd reference)
  backgroundImageData?: string; // Base64 encoded background image
  backgroundMimeType?: string;
  backgroundDescription?: string; // Text description of the background for prompt
  // Aspect ratio for output image (default: 3:4 portrait for fashion)
  aspectRatio?: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
}

export interface GeminiImageResult {
  success: boolean;
  imageData?: string; // Base64 encoded result
  mimeType?: string;
  error?: string;
  tokensUsed?: number;
}

/**
 * Generate an image from text prompt using Gemini 3 Pro Image
 *
 * Configuration loaded from database. Retries up to 2 times on transient errors (503, rate limits),
 * then falls back to secondary model if primary keeps failing. User never sees the error.
 *
 * @param options - Generation options including prompt and aspect ratio
 * @returns Promise with image data (base64) or error
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GeminiImageResult> {
  // Load config from database
  const config = await getAIConfig();
  const modelId = config.modelId;
  const imageSize = config.imageSize;

  let lastError: any = null;

  // Try primary model with retries
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delay = getRetryDelay(attempt - 1);
        console.log(`[generateImage] Retry ${attempt}/${MAX_RETRIES} for ${modelId} after ${delay}ms`);
        await sleep(delay);
      }

      const client = getGeminiClient();

      // Configure generation with response modality
      const generationConfig: any = {};

      // Set response modality (Image only, Text only, or Both)
      if (options.responseModality === 'Image') {
        generationConfig.response_modalities = ['IMAGE']; // Uppercase for Gemini 3 Pro
      } else if (options.responseModality === 'Text') {
        generationConfig.response_modalities = ['TEXT'];
      }
      // Default is Both (text + image)

      // Build image_config with size and optional aspect ratio
      generationConfig.image_config = {
        image_size: imageSize,
      };

      if (options.aspectRatio) {
        generationConfig.image_config.aspect_ratio = options.aspectRatio;
      }

      const model = client.getGenerativeModel({
        model: modelId,
        generationConfig,
      });

      // Build prompt with optional negative prompt
      let fullPrompt = options.prompt;
      if (options.negativePrompt) {
        fullPrompt += `\n\nAvoid: ${options.negativePrompt}`;
      }

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;

      // Extract image data from response
      const imageData = extractImageFromResponse(response);

      if (imageData) {
        return {
          success: true,
          imageData,
          mimeType: 'image/png',
          tokensUsed: (response as any)?.usageMetadata?.totalTokenCount,
        };
      }

      // No image data - treat as retryable
      lastError = new Error('No image data in response');
      if (attempt < MAX_RETRIES) {
        console.warn(`[generateImage] No image data from ${modelId}, retrying...`);
        continue;
      }
    } catch (error) {
      lastError = error;
      console.error(`[generateImage] Error with ${modelId} (attempt ${attempt + 1}):`, error);

      // Retry on retryable errors (503, rate limits, etc.)
      if (isRetryableError(error) && attempt < MAX_RETRIES) {
        console.warn(`[generateImage] Retryable error, will retry...`);
        continue;
      }

      // Non-retryable error - break to fallback immediately
      if (!isRetryableError(error)) {
        break;
      }
    }
  }

  // All retries failed - try fallback model
  if (modelId !== config.fallbackModelId) {
    console.warn(`[generateImage] Primary ${modelId} failed after ${MAX_RETRIES + 1} attempts, using fallback ${config.fallbackModelId}`);
    return generateImageWithModel(options, config.fallbackModelId, config);
  }

  return {
    success: false,
    error: 'Não foi possível gerar a imagem. Tente novamente em alguns instantes.',
  };
}

/**
 * Internal helper to generate with a specific model (used for fallback)
 */
async function generateImageWithModel(
  options: GenerateImageOptions,
  modelId: string,
  config: AIConfig
): Promise<GeminiImageResult> {
  try {
    const client = getGeminiClient();

    const generationConfig: any = {};

    if (options.responseModality === 'Image') {
      generationConfig.response_modalities = ['IMAGE'];
    } else if (options.responseModality === 'Text') {
      generationConfig.response_modalities = ['TEXT'];
    }

    generationConfig.image_config = {
      image_size: config.imageSize,
    };

    if (options.aspectRatio) {
      generationConfig.image_config.aspect_ratio = options.aspectRatio;
    }

    const model = client.getGenerativeModel({
      model: modelId,
      generationConfig,
    });

    let fullPrompt = options.prompt;
    if (options.negativePrompt) {
      fullPrompt += `\n\nAvoid: ${options.negativePrompt}`;
    }

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const imageData = extractImageFromResponse(response);

    if (!imageData) {
      return {
        success: false,
        error: 'Não recebemos a imagem do Gemini. Aguarde alguns segundos e tente novamente.',
      };
    }

    return {
      success: true,
      imageData,
      mimeType: 'image/png',
      tokensUsed: (response as any)?.usageMetadata?.totalTokenCount,
    };
  } catch (error) {
    console.error('Error generating image with fallback model:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Edit an existing image using natural language instructions
 *
 * Configuration loaded from database. Retries up to 2 times on transient errors,
 * then falls back to secondary model if primary keeps failing.
 *
 * @param options - Edit options including prompt and base64 image data
 * @returns Promise with edited image data (base64) or error
 */
export async function editImage(
  options: EditImageOptions
): Promise<GeminiImageResult> {
  const config = await getAIConfig();
  const modelId = config.modelId;

  let lastError: any = null;

  // Try primary model with retries
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delay = getRetryDelay(attempt - 1);
        console.log(`[editImage] Retry ${attempt}/${MAX_RETRIES} for ${modelId} after ${delay}ms`);
        await sleep(delay);
      }

      const client = getGeminiClient();

      // Configure to return only image (no text)
      const model = client.getGenerativeModel({
        model: modelId,
        generationConfig: {
          response_modalities: ['IMAGE'],
          image_config: {
            image_size: config.imageSize,
          },
        } as any,
      });

      const result = await model.generateContent([
        options.prompt,
        {
          inlineData: {
            data: options.imageData,
            mimeType: options.mimeType,
          },
        },
      ]);

      const response = await result.response;
      const imageData = extractImageFromResponse(response);

      if (imageData) {
        return {
          success: true,
          imageData,
          mimeType: 'image/png',
          tokensUsed: (response as any)?.usageMetadata?.totalTokenCount,
        };
      }

      lastError = new Error('No image data in response');
      if (attempt < MAX_RETRIES) {
        console.warn(`[editImage] No image data from ${modelId}, retrying...`);
        continue;
      }
    } catch (error) {
      lastError = error;
      console.error(`[editImage] Error with ${modelId} (attempt ${attempt + 1}):`, error);

      if (isRetryableError(error) && attempt < MAX_RETRIES) {
        console.warn(`[editImage] Retryable error, will retry...`);
        continue;
      }

      if (!isRetryableError(error)) {
        break;
      }
    }
  }

  // All retries failed - try fallback
  if (modelId !== config.fallbackModelId) {
    console.warn(`[editImage] Primary ${modelId} failed after ${MAX_RETRIES + 1} attempts, using fallback`);
    return editImageWithModel(options, config.fallbackModelId, config);
  }

  return {
    success: false,
    error: 'Não foi possível editar a imagem. Tente novamente em alguns instantes.',
  };
}

/**
 * Internal helper for editImage fallback
 */
async function editImageWithModel(
  options: EditImageOptions,
  modelId: string,
  config: AIConfig
): Promise<GeminiImageResult> {
  try {
    const client = getGeminiClient();

    const model = client.getGenerativeModel({
      model: modelId,
      generationConfig: {
        response_modalities: ['IMAGE'],
        image_config: {
          image_size: config.imageSize,
        },
      } as any,
    });

    const result = await model.generateContent([
      options.prompt,
      {
        inlineData: {
          data: options.imageData,
          mimeType: options.mimeType,
        },
      },
    ]);

    const response = await result.response;
    const imageData = extractImageFromResponse(response);

    if (!imageData) {
      return {
        success: false,
        error: 'Não recebemos a imagem do Gemini. Aguarde alguns segundos e tente novamente.',
      };
    }

    return {
      success: true,
      imageData,
      mimeType: 'image/png',
      tokensUsed: (response as any)?.usageMetadata?.totalTokenCount,
    };
  } catch (error) {
    console.error('Error editing image with fallback model:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Blend multiple images into a single composition
 *
 * Supports up to 14 input images for composition tasks (Gemini 3 Pro).
 * Retries up to 2 times on transient errors, then falls back to secondary model.
 *
 * @param options - Blend options including prompt and up to 14 images
 * @returns Promise with blended image data (base64) or error
 */
export async function blendImages(
  options: BlendImagesOptions
): Promise<GeminiImageResult> {
  const config = await getAIConfig();
  const modelId = config.modelId;

  // Validate image count (max 14 images with Gemini 3 Pro)
  if (options.images.length > 14) {
    return {
      success: false,
      error: 'Maximum 14 images supported for blending',
    };
  }

  let lastError: any = null;

  // Try primary model with retries
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delay = getRetryDelay(attempt - 1);
        console.log(`[blendImages] Retry ${attempt}/${MAX_RETRIES} for ${modelId} after ${delay}ms`);
        await sleep(delay);
      }

      const client = getGeminiClient();

      // Configure to return only image
      const model = client.getGenerativeModel({
        model: modelId,
        generationConfig: {
          response_modalities: ['IMAGE'],
          image_config: {
            image_size: config.imageSize,
          },
        } as any,
      });

      // Build contents array with prompt and all images
      const contents: any[] = [options.prompt];

      for (const image of options.images) {
        contents.push({
          inlineData: {
            data: image.data,
            mimeType: image.mimeType,
          },
        });
      }

      const result = await model.generateContent(contents);
      const response = await result.response;
      const imageData = extractImageFromResponse(response);

      if (imageData) {
        return {
          success: true,
          imageData,
          mimeType: 'image/png',
          tokensUsed: (response as any)?.usageMetadata?.totalTokenCount,
        };
      }

      lastError = new Error('No image data in response');
      if (attempt < MAX_RETRIES) {
        console.warn(`[blendImages] No image data from ${modelId}, retrying...`);
        continue;
      }
    } catch (error) {
      lastError = error;
      console.error(`[blendImages] Error with ${modelId} (attempt ${attempt + 1}):`, error);

      if (isRetryableError(error) && attempt < MAX_RETRIES) {
        console.warn(`[blendImages] Retryable error, will retry...`);
        continue;
      }

      if (!isRetryableError(error)) {
        break;
      }
    }
  }

  // All retries failed - try fallback
  if (modelId !== config.fallbackModelId) {
    console.warn(`[blendImages] Primary ${modelId} failed after ${MAX_RETRIES + 1} attempts, using fallback`);
    return blendImagesWithModel(options, config.fallbackModelId, config);
  }

  return {
    success: false,
    error: 'Não foi possível mesclar as imagens. Tente novamente em alguns instantes.',
  };
}

/**
 * Internal helper for blendImages fallback
 */
async function blendImagesWithModel(
  options: BlendImagesOptions,
  modelId: string,
  config: AIConfig
): Promise<GeminiImageResult> {
  try {
    const client = getGeminiClient();

    const model = client.getGenerativeModel({
      model: modelId,
      generationConfig: {
        response_modalities: ['IMAGE'],
        image_config: {
          image_size: config.imageSize,
        },
      } as any,
    });

    const contents: any[] = [options.prompt];

    for (const image of options.images) {
      contents.push({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType,
        },
      });
    }

    const result = await model.generateContent(contents);
    const response = await result.response;
    const imageData = extractImageFromResponse(response);

    if (!imageData) {
      return {
        success: false,
        error: 'Não recebemos a imagem do Gemini. Aguarde alguns segundos e tente novamente.',
      };
    }

    return {
      success: true,
      imageData,
      mimeType: 'image/png',
      tokensUsed: (response as any)?.usageMetadata?.totalTokenCount,
    };
  } catch (error) {
    console.error('Error blending images with fallback model:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Virtual Try-On: Combine garment, pose, and optionally background images
 *
 * Specialized function for fashion virtual try-on use case.
 * Uses multi-image composition (2-3 images) with Gemini 3 Pro Image.
 * Retries up to 2 times on transient errors (503, rate limits),
 * then falls back to secondary model. User never sees the error.
 *
 * Best practices:
 * - Order matters: garment first, then pose/model, then background (if provided)
 * - Use descriptive prompts (full sentences, not keywords)
 * - Specify photographic details (lighting, angle, style)
 * - When background is provided, lighting and shadows are integrated naturally
 *
 * @param options - Virtual try-on options with garment, pose, and optional background images
 * @returns Promise with composed image data (base64) or error
 */
export async function virtualTryOn(
  options: VirtualTryOnOptions
): Promise<GeminiImageResult> {
  const config = await getAIConfig();
  const modelId = config.modelId;
  const hasBackground = !!options.backgroundImageData;

  // Normalize garment data to arrays for consistent handling
  const garmentImages = Array.isArray(options.garmentImageData)
    ? options.garmentImageData
    : [options.garmentImageData];
  const defaultMimeType = typeof options.garmentMimeType === 'string' ? options.garmentMimeType : 'image/png';
  const garmentMimeTypes: string[] = Array.isArray(options.garmentMimeType)
    ? options.garmentMimeType
    : garmentImages.map(() => defaultMimeType);

  const totalImages = garmentImages.length + 1 + (hasBackground ? 1 : 0); // garments + pose + optional background

  let lastError: any = null;
  let lastBlockReason: string | null = null;

  console.log(`[virtualTryOn] Starting with ${totalImages} images (${garmentImages.length} garment(s) + pose${hasBackground ? ' + background' : ''})`);

  // Try primary model with retries
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delay = getRetryDelay(attempt - 1);
        console.log(`[virtualTryOn] Retry ${attempt}/${MAX_RETRIES} for ${modelId} after ${delay}ms`);
        await sleep(delay);
      }

      const client = getGeminiClient();

      // Configure for image-only output (configurable aspect ratio, default 3:4 portrait)
      const aspectRatio = options.aspectRatio || '3:4';
      const model = client.getGenerativeModel({
        model: modelId,
        generationConfig: {
          response_modalities: ['IMAGE'],
          image_config: {
            aspect_ratio: aspectRatio,
            image_size: config.imageSize,
          },
        } as any,
      });

      // Build parts array: prompt + garment(s) + pose + optional background
      // Order matters for multi-garment outfits: first garment is typically top, second is bottom
      const parts: Part[] = [
        {
          text: options.prompt,
        },
      ];

      // Add ALL garment images in order (for outfits: top first, bottom second)
      for (let i = 0; i < garmentImages.length; i++) {
        parts.push({
          inlineData: {
            data: garmentImages[i],
            mimeType: garmentMimeTypes[i] || 'image/png',
          },
        });
      }

      // Add pose reference
      parts.push({
        inlineData: {
          data: options.poseImageData,
          mimeType: options.poseMimeType || 'image/png',
        },
      });

      // Add background as last reference image if provided
      if (options.backgroundImageData) {
        parts.push({
          inlineData: {
            data: options.backgroundImageData,
            mimeType: options.backgroundMimeType || 'image/png',
          },
        });
      }

      // Build multi-image prompt
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
        return {
          success: true,
          imageData,
          mimeType: 'image/png',
          tokensUsed: (response as any)?.usageMetadata?.totalTokenCount,
        };
      }

      // Check if blocked by safety (don't retry safety blocks)
      const blockReason = getGeminiBlockReason(response);
      lastBlockReason = blockReason;

      if (blockReason === 'SAFETY') {
        return {
          success: false,
          error: 'O Gemini bloqueou esta geração por política de segurança. Escolha outra peça ou pose.',
        };
      }

      lastError = new Error('No image data in response');
      if (attempt < MAX_RETRIES) {
        console.warn(`[virtualTryOn] No image data from ${modelId}, retrying...`);
        continue;
      }
    } catch (error) {
      lastError = error;
      console.error(`[virtualTryOn] Error with ${modelId} (attempt ${attempt + 1}):`, error);

      if (isRetryableError(error) && attempt < MAX_RETRIES) {
        console.warn(`[virtualTryOn] Retryable error, will retry...`);
        continue;
      }

      if (!isRetryableError(error)) {
        break;
      }
    }
  }

  // All retries failed - try fallback
  if (modelId !== config.fallbackModelId) {
    console.warn(`[virtualTryOn] Primary ${modelId} failed after ${MAX_RETRIES + 1} attempts, using fallback ${config.fallbackModelId}`);
    return virtualTryOnWithModel(options, config.fallbackModelId, config);
  }

  return {
    success: false,
    error: 'Não foi possível gerar a imagem. Tente novamente em alguns instantes.',
  };
}

/**
 * Internal helper for virtualTryOn fallback
 */
async function virtualTryOnWithModel(
  options: VirtualTryOnOptions,
  modelId: string,
  config: AIConfig
): Promise<GeminiImageResult> {
  try {
    const client = getGeminiClient();
    const hasBackground = !!options.backgroundImageData;

    // Normalize garment data to arrays (same as main virtualTryOn function)
    const garmentImages = Array.isArray(options.garmentImageData)
      ? options.garmentImageData
      : [options.garmentImageData];
    const defaultMimeType = typeof options.garmentMimeType === 'string' ? options.garmentMimeType : 'image/png';
    const garmentMimeTypes: string[] = Array.isArray(options.garmentMimeType)
      ? options.garmentMimeType
      : garmentImages.map(() => defaultMimeType);

    const totalImages = garmentImages.length + 1 + (hasBackground ? 1 : 0);
    console.log(`[virtualTryOnWithModel] Fallback with ${totalImages} images (${garmentImages.length} garment(s) + pose${hasBackground ? ' + background' : ''}), model: ${modelId}`);

    const aspectRatio = options.aspectRatio || '3:4';
    const model = client.getGenerativeModel({
      model: modelId,
      generationConfig: {
        response_modalities: ['IMAGE'],
        image_config: {
          aspect_ratio: aspectRatio,
          image_size: config.imageSize,
        },
      } as any,
    });

    // Build parts array: prompt + garment(s) + pose + optional background
    const parts: Part[] = [
      {
        text: options.prompt,
      },
    ];

    // Add ALL garment images in order (for outfits: top first, bottom second)
    for (let i = 0; i < garmentImages.length; i++) {
      parts.push({
        inlineData: {
          data: garmentImages[i],
          mimeType: garmentMimeTypes[i] || 'image/png',
        },
      });
    }

    // Add pose reference
    parts.push({
      inlineData: {
        data: options.poseImageData,
        mimeType: options.poseMimeType || 'image/png',
      },
    });

    // Add background as 3rd reference image if provided
    if (options.backgroundImageData) {
      parts.push({
        inlineData: {
          data: options.backgroundImageData,
          mimeType: options.backgroundMimeType || 'image/png',
        },
      });
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
      return {
        success: false,
        error:
          blockReason === 'SAFETY'
            ? 'O Gemini bloqueou esta geração por política de segurança. Escolha outra peça ou pose.'
            : 'Não recebemos a imagem do Gemini. Aguarde alguns segundos e tente novamente.',
      };
    }

    return {
      success: true,
      imageData,
      mimeType: 'image/png',
      tokensUsed: (response as any)?.usageMetadata?.totalTokenCount,
    };
  } catch (error) {
    console.error('Error in virtual try-on with fallback model:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check Gemini API quota and rate limits
 */
export async function checkQuota(): Promise<{
  available: boolean;
  error?: string;
}> {
  try {
    const client = getGeminiClient();

    // TODO: Implement quota check if API provides endpoint
    // For now, just verify client initialization

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
