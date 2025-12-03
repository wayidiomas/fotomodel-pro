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
  garmentImageData: string; // Base64 encoded garment image
  poseImageData: string; // Base64 encoded pose/model image
  garmentMimeType?: string;
  poseMimeType?: string;
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
 * Configuration loaded from database. Falls back to previous model on error.
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

  try {
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

    if (!imageData) {
      // Try fallback model
      if (modelId !== config.fallbackModelId) {
        console.warn(`Primary model ${modelId} failed, trying fallback ${config.fallbackModelId}`);
        return generateImageWithModel(options, config.fallbackModelId, config);
      }
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
    console.error('Error generating image with Gemini:', error);

    // Try fallback on error
    if (modelId !== config.fallbackModelId) {
      console.warn(`Primary model ${modelId} errored, trying fallback ${config.fallbackModelId}`);
      return generateImageWithModel(options, config.fallbackModelId, config);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
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
 * Configuration loaded from database. Falls back to previous model on error.
 *
 * @param options - Edit options including prompt and base64 image data
 * @returns Promise with edited image data (base64) or error
 */
export async function editImage(
  options: EditImageOptions
): Promise<GeminiImageResult> {
  const config = await getAIConfig();
  const modelId = config.modelId;

  try {
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

    if (!imageData) {
      // Try fallback
      if (modelId !== config.fallbackModelId) {
        console.warn(`Primary model ${modelId} failed in editImage, trying fallback`);
        return editImageWithModel(options, config.fallbackModelId, config);
      }
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
    console.error('Error editing image with Gemini:', error);

    if (modelId !== config.fallbackModelId) {
      console.warn(`Primary model ${modelId} errored in editImage, trying fallback`);
      return editImageWithModel(options, config.fallbackModelId, config);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
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
 * Supports up to 14 input images for composition tasks (Gemini 3 Pro)
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

  try {
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

    if (!imageData) {
      // Try fallback
      if (modelId !== config.fallbackModelId) {
        console.warn(`Primary model ${modelId} failed in blendImages, trying fallback`);
        return blendImagesWithModel(options, config.fallbackModelId, config);
      }
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
    console.error('Error blending images with Gemini:', error);

    if (modelId !== config.fallbackModelId) {
      console.warn(`Primary model ${modelId} errored in blendImages, trying fallback`);
      return blendImagesWithModel(options, config.fallbackModelId, config);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
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
 * Virtual Try-On: Combine garment and pose images
 *
 * Specialized function for fashion virtual try-on use case.
 * Uses multi-image composition (2 images) with Gemini 3 Pro Image.
 *
 * Best practices:
 * - Order matters: garment first, then pose/model
 * - Use descriptive prompts (full sentences, not keywords)
 * - Specify photographic details (lighting, angle, style)
 *
 * @param options - Virtual try-on options with garment and pose images
 * @returns Promise with composed image data (base64) or error
 */
export async function virtualTryOn(
  options: VirtualTryOnOptions
): Promise<GeminiImageResult> {
  const config = await getAIConfig();
  const modelId = config.modelId;

  try {
    const client = getGeminiClient();

    // Configure for image-only output (3:4 portrait aspect ratio for fashion)
    const model = client.getGenerativeModel({
      model: modelId,
      generationConfig: {
        response_modalities: ['IMAGE'],
        image_config: {
          aspect_ratio: '3:4', // Portrait ratio for fashion photography
          image_size: config.imageSize,
        },
      } as any,
    });

    // Build multi-image prompt
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: options.prompt,
            },
            {
              inlineData: {
                data: options.garmentImageData,
                mimeType: options.garmentMimeType || 'image/png',
              },
            },
            {
              inlineData: {
                data: options.poseImageData,
                mimeType: options.poseMimeType || 'image/png',
              },
            },
          ],
        },
      ],
    });
    const response = await result.response;
    const imageData = extractImageFromResponse(response);

    if (!imageData) {
      const blockReason = getGeminiBlockReason(response);

      // Try fallback on failure (unless blocked by safety)
      if (blockReason !== 'SAFETY' && modelId !== config.fallbackModelId) {
        console.warn(`Primary model ${modelId} failed in virtualTryOn, trying fallback`);
        return virtualTryOnWithModel(options, config.fallbackModelId, config);
      }

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
    console.error('Error in virtual try-on with Gemini:', error);

    if (modelId !== config.fallbackModelId) {
      console.warn(`Primary model ${modelId} errored in virtualTryOn, trying fallback`);
      return virtualTryOnWithModel(options, config.fallbackModelId, config);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
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

    const model = client.getGenerativeModel({
      model: modelId,
      generationConfig: {
        response_modalities: ['IMAGE'],
        image_config: {
          aspect_ratio: '3:4',
          image_size: config.imageSize,
        },
      } as any,
    });

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: options.prompt,
            },
            {
              inlineData: {
                data: options.garmentImageData,
                mimeType: options.garmentMimeType || 'image/png',
              },
            },
            {
              inlineData: {
                data: options.poseImageData,
                mimeType: options.poseMimeType || 'image/png',
              },
            },
          ],
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
