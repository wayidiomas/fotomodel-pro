'use client';

import * as React from 'react';
import Image from 'next/image';
import type { PoseMetadata } from '@/lib/generation-flow/pose-types';
import { ModelGenderLabel, PoseCategoryLabel } from '@/lib/generation-flow/pose-types';
import { getStoragePublicUrl } from '@/lib/storage/upload';

interface PoseCardProps {
  pose: PoseMetadata;
  isSelected: boolean;
  selectionIndex?: number; // 1 or 2 (for "1/2" or "2/2" badge)
  onSelect: (poseId: string) => void;
  onViewDetails: (pose: PoseMetadata) => void;
}

export const PoseCard: React.FC<PoseCardProps> = ({
  pose,
  isSelected,
  selectionIndex,
  onSelect,
  onViewDetails,
}) => {
  // Resolve storage paths to full URLs
  const resolvedImageUrl = React.useMemo(() => {
    if (!pose.imageUrl) return '';
    // If already a full URL, return as-is
    if (pose.imageUrl.startsWith('http://') || pose.imageUrl.startsWith('https://')) {
      return pose.imageUrl;
    }
    // If starts with /, it's a local asset
    if (pose.imageUrl.startsWith('/')) {
      return pose.imageUrl;
    }
    // Otherwise, resolve from storage
    return getStoragePublicUrl(pose.imageUrl) || pose.imageUrl;
  }, [pose.imageUrl]);

  return (
    <div
      onClick={() => onSelect(pose.id)}
      className={`
        group relative rounded-2xl overflow-hidden
        transition-all duration-300 cursor-pointer
        border
        ${
          isSelected
            ? 'border-2 border-black shadow-[0_8px_24px_rgba(0,0,0,0.16),0_16px_48px_rgba(0,0,0,0.08)]'
            : 'border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.08),0_12px_32px_rgba(0,0,0,0.04)]'
        }
      `}
    >
      {/* Image container - agora ocupa todo o card */}
      <div className="relative aspect-[296/392] bg-gradient-to-br from-gray-100 to-gray-50">
        {pose.isUserModel && (
          <div className="absolute top-3 left-3 z-30 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-[10px] font-inter font-semibold uppercase tracking-[0.25em] text-[#6d4b21]">
            Meu modelo
          </div>
        )}
        <Image
          src={resolvedImageUrl}
          alt={pose.name || 'Model pose'}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Glassmorphism overlay - sempre visível, nome e gênero sobre a foto */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent backdrop-blur-sm px-4 py-3 z-10">
          <h3 className="font-inter font-semibold text-base text-white mb-0.5 truncate">
            {pose.name || 'Sem nome'}
          </h3>
          <div className="flex items-center gap-2 text-sm text-white/90">
            <span className="font-inter font-medium">{ModelGenderLabel[pose.gender]}</span>
            <span className="text-white/60">•</span>
            <span className="font-inter">{pose.ageMin}-{pose.ageMax} anos</span>
          </div>
        </div>

        {/* Checkmark - 31x31px no canto superior direito quando selecionado */}
        {isSelected && (
          <div className="absolute top-3 right-3 bg-black text-white rounded-full w-[31px] h-[31px] flex items-center justify-center shadow-lg z-30">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 9L7.5 12.5L14 6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        {/* Hover overlay with details button - z-index maior que glassmorphism */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center gap-2">
            {/* Icon */}
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <svg
                width="22"
                height="22"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 14V10M10 6H10.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            {/* Text button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(pose);
              }}
              className="px-4 py-2 bg-white/95 backdrop-blur-md text-[#20202a] rounded-lg font-inter font-semibold text-sm hover:bg-white transition-all shadow-lg border border-white/50"
            >
              Ver Detalhes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
