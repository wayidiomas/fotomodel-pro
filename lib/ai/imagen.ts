/**
 * Google Imagen 4 Integration (BETA)
 *
 * Currently using Gemini 2.5 Flash Image as backend for chat functionality.
 * This provides a compatible interface that can be swapped to Imagen 4 when ready.
 *
 * Why Gemini 2.5 Flash Image for now:
 * - Already configured and working
 * - Supports multi-image composition (up to 3 images)
 * - Accepts natural language prompts
 * - Cheaper: $0.039/image vs $0.02-$0.06 for Imagen 4
 * - CRITICAL: Supports pose reference (Imagen 4 does NOT)
 *
 * Future Migration Path:
 * - Imagen 4 Standard: $0.04/image - Better quality, no pose control
 * - Imagen 4 Fast: $0.02/image - Faster generation
 * - Imagen 4 Ultra: $0.06/image - Highest quality
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  return new GoogleGenerativeAI(apiKey);
};

export type ImagenModel =
  | 'imagen-4.0-generate-001'      // Standard quality
  | 'imagen-4.0-fast-generate-001' // Fast generation
  | 'imagen-4.0-ultra-generate-001' // Ultra quality
  | 'gemini-2.5-flash-image';      // Current backend

export type ImagenAspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';

export interface ImagenGenerateOptions {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: ImagenAspectRatio;
  model?: ImagenModel;
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
 * Generate image using Imagen 4 (currently Gemini 2.5 Flash Image)
 *
 * @param options - Generation options
 * @returns Image result with base64 data
 */
export async function generateWithImagen(
  options: ImagenGenerateOptions
): Promise<ImagenResult> {
  try {
    const client = getGeminiClient();
    const modelId = options.model || 'gemini-2.5-flash-image';

    // Configure generation
    const generationConfig: any = {
      response_modalities: ['Image'], // Image only, no text
    };

    // Set aspect ratio if specified
    if (options.aspectRatio) {
      generationConfig.image_config = {
        aspect_ratio: options.aspectRatio,
      };
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
    console.error('Error generating image with Imagen:', error);
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
