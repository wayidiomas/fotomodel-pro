'use client';

import * as React from 'react';
import Image from 'next/image';
import type { ImageFormatPreset } from '@/lib/generation-flow/image-formats';
import { DEFAULT_EXPRESSIONS, type FacialExpression } from './facial-expression-picker';
import { DEFAULT_HAIR_COLORS, type HairColorOption } from './hair-color-picker';

interface CustomizationThumbnailsProps {
  selectedFormat?: ImageFormatPreset | null;
  facialExpression?: string | null;
  hairColor?: string | null;
  height?: number;
  weight?: number;
  hasAITools?: boolean;
}

/**
 * Renders visual thumbnails for customizations (64x64px)
 * Matches the glassmorphism design of pose/garment thumbnails
 */
export function CustomizationThumbnails({
  selectedFormat,
  facialExpression,
  hairColor,
  height,
  weight,
  hasAITools,
}: CustomizationThumbnailsProps) {
  const thumbnails: React.ReactNode[] = [];

  // 1. Format Thumbnail
  if (selectedFormat) {
    thumbnails.push(
      <FormatThumbnail key="format" format={selectedFormat} />
    );
  }

  // 2. Expression Thumbnail
  if (facialExpression) {
    const expression = DEFAULT_EXPRESSIONS.find(e => e.value === facialExpression);
    if (expression) {
      thumbnails.push(
        <ExpressionThumbnail key="expression" expression={expression} />
      );
    }
  }

  // 3. Hair Color Thumbnail
  if (hairColor) {
    const color = DEFAULT_HAIR_COLORS.find(c => c.value === hairColor);
    if (color) {
      thumbnails.push(
        <HairColorThumbnail key="hair" color={color} />
      );
    }
  }

  // 4. Height Thumbnail
  if (height && height !== 170) {
    thumbnails.push(
      <HeightThumbnail key="height" value={height} />
    );
  }

  // 5. Weight Thumbnail
  if (weight && weight !== 60) {
    thumbnails.push(
      <WeightThumbnail key="weight" value={weight} />
    );
  }

  // 6. AI Tools Thumbnail
  if (hasAITools) {
    thumbnails.push(
      <AIToolsThumbnail key="ai-tools" />
    );
  }

  return <>{thumbnails}</>;
}

/**
 * Format Thumbnail - Shows aspect ratio rectangle
 */
function FormatThumbnail({ format }: { format: ImageFormatPreset }) {
  const aspectParts = format.aspect_ratio.split(':');
  const isLandscape = aspectParts.length === 2 && parseFloat(aspectParts[0]) > parseFloat(aspectParts[1]);
  const isPortrait = aspectParts.length === 2 && parseFloat(aspectParts[0]) < parseFloat(aspectParts[1]);

  return (
    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white/30 backdrop-blur-sm flex-shrink-0 border border-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
      <div className="absolute inset-0 flex items-center justify-center p-2">
        <div
          className="bg-gradient-to-br from-gray-300 to-gray-400 rounded shadow-inner flex items-center justify-center"
          style={{
            width: isPortrait ? '22px' : isLandscape ? '35px' : '28px',
            height: isPortrait ? '35px' : isLandscape ? '22px' : '28px',
          }}
        >
          <span className="font-inter text-[8px] font-semibold text-white/90">
            {format.aspect_ratio}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Expression Thumbnail - Shows photo with gradient overlay
 */
function ExpressionThumbnail({ expression }: { expression: FacialExpression }) {
  return (
    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white/30 backdrop-blur-sm flex-shrink-0 border border-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
      <Image
        src={expression.imagePath}
        alt={expression.label}
        fill
        className="object-cover object-[center_30%]"
        sizes="64px"
      />

      {/* Gradient overlay with label */}
      <div className="absolute inset-0 flex items-end justify-center p-1.5 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
        <span
          className="font-inter text-[9px] font-semibold text-white tracking-tight"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
        >
          {expression.label}
        </span>
      </div>
    </div>
  );
}

/**
 * Hair Color Thumbnail - Shows photo with color badge
 */
function HairColorThumbnail({ color }: { color: HairColorOption }) {
  return (
    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white/30 backdrop-blur-sm flex-shrink-0 border border-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
      <Image
        src={color.imagePath}
        alt={color.label}
        fill
        className="object-cover object-[center_30%]"
        sizes="64px"
      />

      {/* Gradient overlay with color badge and label */}
      <div className="absolute inset-0 flex flex-col items-center justify-end p-1.5 gap-0.5 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
        {/* Color Badge */}
        <div
          className="w-3 h-3 rounded-full ring-1 ring-white shadow-sm"
          style={{
            backgroundColor: color.hexColor,
            boxShadow: `0 1px 4px ${color.hexColor}60`,
          }}
        />

        {/* Label */}
        <span
          className="font-inter text-[9px] font-semibold text-white tracking-tight"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
        >
          {color.label}
        </span>
      </div>
    </div>
  );
}

/**
 * Height Thumbnail - Shows ruler icon with value
 */
function HeightThumbnail({ value }: { value: number }) {
  return (
    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white/30 backdrop-blur-sm flex-shrink-0 border border-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2">
        {/* Ruler Icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          className="text-gray-700"
        >
          <path
            d="M6 4H18C18.5523 4 19 4.44772 19 5V19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V5C5 4.44772 5.44772 4 6 4Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path d="M9 8V10M12 8V12M15 8V10M9 14V16M12 14V16M15 14V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>

        {/* Value */}
        <span className="font-inter text-[10px] font-bold text-gray-900">
          {value}cm
        </span>
      </div>
    </div>
  );
}

/**
 * Weight Thumbnail - Shows scale icon with value
 */
function WeightThumbnail({ value }: { value: number }) {
  return (
    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white/30 backdrop-blur-sm flex-shrink-0 border border-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2">
        {/* Scale Icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          className="text-gray-700"
        >
          <path
            d="M12 3L8 7H16L12 3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <rect
            x="5"
            y="10"
            width="14"
            height="8"
            rx="1"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path d="M9 14H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <rect x="10" y="18" width="4" height="3" fill="currentColor" />
        </svg>

        {/* Value */}
        <span className="font-inter text-[10px] font-bold text-gray-900">
          {value}kg
        </span>
      </div>
    </div>
  );
}

/**
 * AI Tools Thumbnail - Shows sparkle icon
 */
function AIToolsThumbnail() {
  return (
    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-400/30 to-pink-400/30 backdrop-blur-sm flex-shrink-0 border border-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 p-2">
        {/* AI Sparkle Icon */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="text-purple-600"
        >
          <path
            d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
            fill="currentColor"
          />
          <path
            d="M19 15L19.75 17.25L22 18L19.75 18.75L19 21L18.25 18.75L16 18L18.25 17.25L19 15Z"
            fill="currentColor"
          />
        </svg>

        {/* Label */}
        <span className="font-inter text-[9px] font-bold text-purple-700">
          IA
        </span>
      </div>
    </div>
  );
}
