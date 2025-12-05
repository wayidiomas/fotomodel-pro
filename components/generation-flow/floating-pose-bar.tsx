'use client';

import * as React from 'react';
import Image from 'next/image';
import type { PoseMetadata } from '@/lib/generation-flow/pose-types';
import type { ImageFormatPreset } from '@/lib/generation-flow/image-formats';
import { CustomizationThumbnails } from './customization-thumbnails';

interface GarmentImage {
  id: string;
  imageUrl: string;
}

interface CustomizationBadges {
  selectedFormat?: ImageFormatPreset | null;
  height?: number;
  weight?: number;
  facialExpression?: string | null;
  hairColor?: string | null;
  hasAITools?: boolean;
  gender?: 'MALE' | 'FEMALE' | null;
}

interface FloatingPoseBarProps {
  poses: PoseMetadata[];
  garments?: GarmentImage[];
  customizations?: CustomizationBadges;
  onAction?: () => void;
  actionLabel?: string;
  actionDisabled?: boolean;
  className?: string;
}

/**
 * Floating bar displaying selected poses and garments
 * Used in personalization page to show current selection
 */
export function FloatingPoseBar({
  poses,
  garments = [],
  customizations,
  onAction,
  actionLabel = 'Continuar',
  actionDisabled = false,
  className
}: FloatingPoseBarProps) {
  // Filter out poses and garments without valid imageUrl
  const validPoses = poses.filter((pose) => pose.imageUrl && pose.imageUrl.trim() !== '');
  const validGarments = garments.filter((garment) => garment.imageUrl && garment.imageUrl.trim() !== '');

  // Count customizations for display
  const customizationCount = React.useMemo(() => {
    let count = 0;
    if (customizations?.selectedFormat) count++;
    if (customizations?.height && customizations.height !== 170) count++;
    if (customizations?.weight && customizations.weight !== 60) count++;
    if (customizations?.facialExpression) count++;
    if (customizations?.hairColor) count++;
    if (customizations?.hasAITools) count++;
    return count;
  }, [customizations]);

  // Check if we have any customizations to show
  const hasCustomizations = customizationCount > 0;

  // Don't render if no valid poses/garments and no customizations
  if (validPoses.length === 0 && validGarments.length === 0 && !hasCustomizations) {
    return null;
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-30 px-4 pb-6 md:px-6 md:pb-8 ${className || ''}`}>
      {/* Glassmorphism container - Apple-style */}
      <div className="relative mx-auto max-w-5xl bg-gradient-to-t from-white/50 via-white/40 to-white/30 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-2xl">
        <div className="px-4 py-3.5 md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {validPoses.map((pose) => (
                  <div
                    key={pose.id}
                    className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white/30 backdrop-blur-sm flex-shrink-0 border border-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.08)] ring-1 ring-black/5"
                  >
                    <Image
                      src={pose.imageUrl}
                      alt={pose.name || 'Pose selecionada'}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                ))}

                {validGarments.map((garment) => (
                  <div
                    key={garment.id}
                    className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white/30 backdrop-blur-sm flex-shrink-0 border border-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.08)] ring-1 ring-black/5"
                  >
                    <Image
                      src={garment.imageUrl}
                      alt="Roupa selecionada"
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                ))}

                {hasCustomizations && customizations && (
                  <CustomizationThumbnails
                    selectedFormat={customizations.selectedFormat}
                    facialExpression={customizations.facialExpression}
                    hairColor={customizations.hairColor}
                    height={customizations.height}
                    weight={customizations.weight}
                    hasAITools={customizations.hasAITools}
                    gender={customizations.gender}
                  />
                )}
              </div>

              <div className="hidden md:flex flex-col gap-0.5">
                <p className="font-inter font-semibold text-sm text-gray-900/90">
                  Seleção atual
                </p>
                <p className="font-inter text-xs text-gray-600/80">
                  {validPoses.length} {validPoses.length === 1 ? 'pose' : 'poses'}
                  {validGarments.length > 0 && ` • ${validGarments.length} ${validGarments.length === 1 ? 'peça' : 'peças'}`}
                  {customizationCount > 0 && ` • ${customizationCount} personaliza${customizationCount === 1 ? 'ção' : 'ções'}`}
                </p>
              </div>
            </div>

            {onAction && (
              <button
                onClick={onAction}
                disabled={actionDisabled}
                className="px-8 py-3.5 bg-[#20202a] text-white rounded-2xl font-inter font-semibold text-base hover:bg-[#2a2a34] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
              >
                {actionLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
