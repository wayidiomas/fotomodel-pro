/**
 * Supabase Storage Upload Helpers
 *
 * Handles file uploads to different storage buckets with proper validation,
 * path generation, and error handling.
 */

import { createClient } from '@supabase/supabase-js';

const getStorageClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

export interface UploadResult {
  success: boolean;
  path?: string;
  publicUrl?: string;
  error?: string;
}

/**
 * Upload user's original image to user-uploads bucket
 * @param supabaseClient - Supabase client instance (can be client-side or server-side)
 */
export async function uploadUserImage(
  supabaseClient: any,
  userId: string,
  file: File | Buffer,
  filename: string
): Promise<UploadResult> {
  try {
    const timestamp = Date.now();
    const path = `${userId}/${timestamp}_${filename}`;

    const { data, error } = await supabaseClient.storage
      .from('user-uploads')
      .upload(path, file, {
        contentType: file instanceof File ? file.type : 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading user image:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    const { data: urlData } = supabaseClient.storage
      .from('user-uploads')
      .getPublicUrl(path);

    return {
      success: true,
      path: data.path,
      publicUrl: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Error in uploadUserImage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload AI-generated image to generated-images bucket
 * Includes retry logic for network errors
 */
export async function uploadGeneratedImage(
  userId: string,
  generationId: string,
  imageBuffer: Buffer,
  mimeType: string = 'image/png',
  customPath?: string
): Promise<UploadResult> {
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 2000, 3000]; // Progressive delays in ms

  const supabase = getStorageClient();
  const extension = mimeType.split('/')[1] || 'png';
  const path = customPath || `${userId}/generations/${generationId}.${extension}`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[uploadGeneratedImage] Retry attempt ${attempt + 1}/${MAX_RETRIES} after ${RETRY_DELAYS[attempt - 1]}ms delay`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt - 1]));
      }

      const { data, error } = await supabase.storage
        .from('generated-images')
        .upload(path, imageBuffer, {
          contentType: mimeType,
          upsert: true, // Allow overwriting for regenerations
        });

      if (error) {
        // Check if it's a network error that's worth retrying
        const isNetworkError = error.message?.toLowerCase().includes('fetch failed') ||
          error.message?.toLowerCase().includes('socket') ||
          error.message?.toLowerCase().includes('econnreset') ||
          error.message?.toLowerCase().includes('timeout');

        if (isNetworkError && attempt < MAX_RETRIES - 1) {
          console.warn(`[uploadGeneratedImage] Network error on attempt ${attempt + 1}, will retry:`, error.message);
          continue; // Retry
        }

        console.error('Error uploading generated image:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      // Success - get public URL
      const { data: urlData } = supabase.storage
        .from('generated-images')
        .getPublicUrl(path);

      if (attempt > 0) {
        console.log(`[uploadGeneratedImage] Success on retry attempt ${attempt + 1}`);
      }

      return {
        success: true,
        path: data.path,
        publicUrl: urlData.publicUrl,
      };
    } catch (error) {
      const isNetworkError = error instanceof Error && (
        error.message?.toLowerCase().includes('fetch failed') ||
        error.message?.toLowerCase().includes('socket') ||
        error.message?.toLowerCase().includes('econnreset') ||
        error.message?.toLowerCase().includes('timeout')
      );

      if (isNetworkError && attempt < MAX_RETRIES - 1) {
        console.warn(`[uploadGeneratedImage] Caught network exception on attempt ${attempt + 1}, will retry:`, error instanceof Error ? error.message : error);
        continue; // Retry
      }

      console.error('Error in uploadGeneratedImage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // All retries exhausted
  return {
    success: false,
    error: 'Upload failed after maximum retries',
  };
}

/**
 * Upload purchased (clean) image to purchased-images bucket
 */
export async function uploadPurchasedImage(
  userId: string,
  downloadId: string,
  imageBuffer: Buffer,
  mimeType: string = 'image/png'
): Promise<UploadResult> {
  try {
    const supabase = getStorageClient();
    const extension = mimeType.split('/')[1] || 'png';
    const path = `${userId}/downloads/${downloadId}.${extension}`;

    const { data, error } = await supabase.storage
      .from('purchased-images')
      .upload(path, imageBuffer, {
        contentType: mimeType,
        upsert: false, // Don't allow overwriting purchases
      });

    if (error) {
      console.error('Error uploading purchased image:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    const { data: urlData } = supabase.storage
      .from('purchased-images')
      .getPublicUrl(path);

    return {
      success: true,
      path: data.path,
      publicUrl: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Error in uploadPurchasedImage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload thumbnail image
 * Includes retry logic for network errors
 */
export async function uploadThumbnail(
  userId: string,
  originalId: string,
  thumbnailBuffer: Buffer,
  mimeType: string = 'image/jpeg'
): Promise<UploadResult> {
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 2000, 3000]; // Progressive delays in ms

  const supabase = getStorageClient();
  const extension = mimeType.split('/')[1] || 'jpg';
  const path = `${userId}/thumbnails/${originalId}_thumb.${extension}`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[uploadThumbnail] Retry attempt ${attempt + 1}/${MAX_RETRIES} after ${RETRY_DELAYS[attempt - 1]}ms delay`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt - 1]));
      }

      const { data, error } = await supabase.storage
        .from('thumbnails')
        .upload(path, thumbnailBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        // Check if it's a network error that's worth retrying
        const isNetworkError = error.message?.toLowerCase().includes('fetch failed') ||
          error.message?.toLowerCase().includes('socket') ||
          error.message?.toLowerCase().includes('econnreset') ||
          error.message?.toLowerCase().includes('timeout');

        if (isNetworkError && attempt < MAX_RETRIES - 1) {
          console.warn(`[uploadThumbnail] Network error on attempt ${attempt + 1}, will retry:`, error.message);
          continue; // Retry
        }

        console.error('Error uploading thumbnail:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      // Success - get public URL
      const { data: urlData } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(path);

      if (attempt > 0) {
        console.log(`[uploadThumbnail] Success on retry attempt ${attempt + 1}`);
      }

      return {
        success: true,
        path: data.path,
        publicUrl: urlData.publicUrl,
      };
    } catch (error) {
      const isNetworkError = error instanceof Error && (
        error.message?.toLowerCase().includes('fetch failed') ||
        error.message?.toLowerCase().includes('socket') ||
        error.message?.toLowerCase().includes('econnreset') ||
        error.message?.toLowerCase().includes('timeout')
      );

      if (isNetworkError && attempt < MAX_RETRIES - 1) {
        console.warn(`[uploadThumbnail] Caught network exception on attempt ${attempt + 1}, will retry:`, error instanceof Error ? error.message : error);
        continue; // Retry
      }

      console.error('Error in uploadThumbnail:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // All retries exhausted
  return {
    success: false,
    error: 'Upload failed after maximum retries',
  };
}

/**
 * Delete file from storage bucket
 */
export async function deleteFile(
  bucketName: string,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getStorageClient();

    const { error } = await supabase.storage.from(bucketName).remove([path]);

    if (error) {
      console.error(`Error deleting file from ${bucketName}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteFile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get signed URL for private file access
 */
export async function getSignedUrl(
  bucketName: string,
  path: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = getStorageClient();

    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error(`Error creating signed URL for ${bucketName}/${path}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      url: data.signedUrl,
    };
  } catch (error) {
    console.error('Error in getSignedUrl:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate file type and size
 */
export function validateFile(
  file: File,
  options: {
    maxSizeInMB?: number; // in megabytes
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const { maxSizeInMB = 10, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] } = options;
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

  // Check file size
  if (file.size > maxSizeInBytes) {
    return {
      valid: false,
      error: `Arquivo excede o limite de ${maxSizeInMB}MB`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo ${file.type} não permitido. Tipos permitidos: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Convert a relative storage path to a full public URL
 * Handles paths from different buckets (thumbnails, generated-images, purchased-images)
 *
 * @param path - Relative path in storage (e.g., "user-id/thumbnails/image.jpg")
 * @param bucket - Optional bucket name. If not provided, will be inferred from path
 * @returns Full public URL or null if path is invalid
 *
 * @example
 * getStoragePublicUrl("e0f8f90b-efdb-4e3d-84b2-a7e3ffadb7cd/thumbnails/image_thumb.jpeg")
 * // Returns: "https://project.supabase.co/storage/v1/object/public/thumbnails/e0f8f90b-efdb-4e3d-84b2-a7e3ffadb7cd/thumbnails/image_thumb.jpeg"
 */
export function getStoragePublicUrl(
  path: string | null | undefined,
  bucket?: string
): string | null {
  if (!path) return null;

  // If already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
    return null;
  }

  // Infer bucket from path if not provided
  let bucketName = bucket;
  if (!bucketName) {
    if (path.includes('/thumbnails/')) {
      bucketName = 'thumbnails';
    } else if (path.includes('/generations/')) {
      bucketName = 'generated-images';
    } else if (path.includes('/downloads/')) {
      bucketName = 'purchased-images';
    } else if (path.startsWith('user-models/')) {
      // Custom user models are stored in generated-images bucket
      bucketName = 'generated-images';
    } else {
      // Default to user-uploads bucket for user uploaded files
      bucketName = 'user-uploads';
    }
  }

  // Construct public URL
  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${path}`;
}
