import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export interface WatermarkOptions {
  opacity?: number;
  position?: 'center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  scale?: number;
  padding?: number;
}

const WATERMARK_ASSET_PATH = path.resolve(
  process.cwd(),
  'public/assets/images/watermark.svg'
);

const DEFAULT_OPACITY = 0.05;
const DEFAULT_SCALE = 0.85;
const DEFAULT_PADDING = 32;

export async function addWatermark(
  imageBuffer: Buffer,
  options: WatermarkOptions = {}
): Promise<Buffer> {
  try {
    const {
      opacity = DEFAULT_OPACITY,
      position = 'center',
      scale = DEFAULT_SCALE,
      padding = DEFAULT_PADDING,
    } = options;

    if (!fs.existsSync(WATERMARK_ASSET_PATH)) {
      throw new Error(`Watermark asset not found at ${WATERMARK_ASSET_PATH}`);
    }

    const watermarkSvg = fs.readFileSync(WATERMARK_ASSET_PATH);
    const baseWatermark = sharp(watermarkSvg).ensureAlpha(opacity);

    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const width = metadata.width || 1024;
    const height = metadata.height || 1024;

    const overlayWidth = Math.max(64, Math.round(width * scale));
    const overlayHeight = Math.max(64, Math.round(height * scale));

    const overlayBuffer = await baseWatermark
      .resize({
        width: overlayWidth,
        height: overlayHeight,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    const watermarkedBuffer = await image
      .composite([
        {
          input: overlayBuffer,
          gravity: getSharpGravity(position),
          blend: 'over',
        },
      ])
      .toBuffer();

    return watermarkedBuffer;
  } catch (error) {
    console.error('Error adding watermark:', error);
    throw error;
  }
}

export async function addDiagonalWatermark(
  imageBuffer: Buffer,
  options: WatermarkOptions = {}
): Promise<Buffer> {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const width = metadata.width || 1024;
    const height = metadata.height || 1024;

    if (!fs.existsSync(WATERMARK_ASSET_PATH)) {
      throw new Error(`Watermark asset not found at ${WATERMARK_ASSET_PATH}`);
    }

    const watermarkSvg = fs.readFileSync(WATERMARK_ASSET_PATH);
    const tile = await sharp(watermarkSvg)
      .ensureAlpha(options.opacity ?? DEFAULT_OPACITY)
      .resize({ width: 320, height: 320, fit: 'inside' })
      .png()
      .toBuffer();

    const pattern = sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    });

    const composites: sharp.OverlayOptions[] = [];
    const step = 320 + 64;
    for (let y = -320; y < height + 320; y += step) {
      for (let x = -320; x < width + 320; x += step) {
        composites.push({ input: tile, left: x, top: y });
      }
    }

    const patternBuffer = await pattern.composite(composites).png().toBuffer();

    return await image
      .composite([{ input: patternBuffer, blend: 'over' }])
      .toBuffer();
  } catch (error) {
    console.error('Error adding diagonal watermark:', error);
    throw error;
  }
}

export async function createThumbnail(
  imageBuffer: Buffer,
  width: number = 300,
  height: number = 400,
  addWatermarkFlag: boolean = true
): Promise<Buffer> {
  try {
    let thumbnailBuffer = await sharp(imageBuffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    if (addWatermarkFlag) {
      thumbnailBuffer = await addWatermark(thumbnailBuffer, {
        scale: 0.65,
        opacity: DEFAULT_OPACITY,
      });
    }

    return thumbnailBuffer;
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    throw error;
  }
}

export async function removeWatermark(imageBuffer: Buffer): Promise<Buffer> {
  return imageBuffer;
}

export function base64ToBuffer(base64: string): Buffer {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

export function bufferToBase64(
  buffer: Buffer,
  mimeType: string = 'image/png'
): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

function getSharpGravity(position: string): sharp.Gravity {
  switch (position) {
    case 'top-left':
      return 'northwest';
    case 'top-right':
      return 'northeast';
    case 'bottom-left':
      return 'southwest';
    case 'bottom-right':
      return 'southeast';
    case 'center':
    default:
      return 'center';
  }
}
