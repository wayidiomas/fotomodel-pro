/**
 * Gemini Image Generation Integration
 *
 * Uses Gemini 3 Pro Image Preview (Nano Banana Pro) for image generation.
 * Configuration is loaded dynamically from the database via ai_generation_config table.
 *
 * Features:
 * - Dynamic model configuration via database
 * - Configurable image size: 1K, 2K, 4K
 * - Up to 14 reference images (vs 3 in previous models)
 * - Advanced text rendering
 * - Thought signatures for multi-turn editing
 * - Fallback to previous model if primary fails
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAIConfig, type ImageSize } from './ai-config';

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
      console.error('No parts found in response');
      return null;
    }

    for (const part of parts) {
      if (part?.inline_data?.mime_type?.startsWith('image/')) {
        return part.inline_data.data;
      }
      if (part?.inlineData?.mimeType?.startsWith('image/')) {
        return part.inlineData.data;
      }
    }

    console.error('No image data found in response parts');
    return null;
  } catch (error) {
    console.error('Error extracting image from response:', error);
    return null;
  }
}

/**
 * Generate image using Gemini 3 Pro Image (Nano Banana Pro)
 *
 * Configuration is loaded from the database. Falls back to previous model if primary fails.
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

  try {
    const client = getGeminiClient();

    // Configure generation with new Gemini 3 Pro parameters
    const generationConfig: any = {
      response_modalities: ['IMAGE'], // Note: uppercase for Gemini 3 Pro
    };

    // Build image_config with aspect ratio and size
    generationConfig.image_config = {
      image_size: imageSize, // 1K, 2K, or 4K
    };

    // Set aspect ratio if specified
    if (options.aspectRatio) {
      generationConfig.image_config.aspect_ratio = options.aspectRatio;
    }

    const model = client.getGenerativeModel({
      model: modelId,
      generationConfig,
    });

    // Build prompt
    let fullPrompt = options.prompt;
    if (options.negativePrompt) {
      fullPrompt += `\n\nAvoid: ${options.negativePrompt}`;
    }

    // Build contents array (text + images)
    const contents: any[] = [fullPrompt];

    if (options.images && options.images.length > 0) {
      for (const image of options.images) {
        contents.push({
          inlineData: {
            data: image.data,
            mimeType: image.mimeType,
          },
        });
      }
    }

    const result = await model.generateContent(contents);
    const response = await result.response;

    // Extract image data
    const imageData = extractImageFromResponse(response);

    if (!imageData) {
      // Try fallback model if primary failed
      if (modelId !== config.fallbackModelId) {
        console.warn(`Primary model ${modelId} failed, trying fallback ${config.fallbackModelId}`);
        return generateWithImagen({
          ...options,
          model: config.fallbackModelId as ImagenModel,
        });
      }

      return {
        success: false,
        error: 'Não recebemos a imagem da IA. Aguarde alguns segundos e tente novamente.',
      };
    }

    return {
      success: true,
      imageData,
      mimeType: 'image/png',
      tokensUsed: (response as any)?.usageMetadata?.totalTokenCount,
      model: modelId,
    };
  } catch (error) {
    console.error('Error generating image with Gemini:', error);

    // Try fallback model on error
    if (modelId !== config.fallbackModelId) {
      console.warn(`Primary model ${modelId} errored, trying fallback ${config.fallbackModelId}`);
      return generateWithImagen({
        ...options,
        model: config.fallbackModelId as ImagenModel,
      });
    }

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
    const client = getGeminiClient();
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
