import sharp from 'sharp';

/**
 * Create a thumbnail from an image buffer
 * @param imageBuffer - Source image buffer
 * @param width - Thumbnail width (default: 300)
 * @param height - Thumbnail height (default: 400)
 * @returns Thumbnail buffer
 */
export async function createThumbnail(
  imageBuffer: Buffer,
  width: number = 300,
  height: number = 400
): Promise<Buffer> {
  try {
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    return thumbnailBuffer;
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    throw error;
  }
}

/**
 * Convert base64 string to Buffer
 */
export function base64ToBuffer(base64: string): Buffer {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

/**
 * Convert Buffer to base64 data URL
 */
export function bufferToBase64(
  buffer: Buffer,
  mimeType: string = 'image/png'
): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}
