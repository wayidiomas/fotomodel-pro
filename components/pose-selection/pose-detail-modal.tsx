'use client';

import * as React from 'react';
import Image from 'next/image';
import type { PoseMetadata } from '@/lib/generation-flow/pose-types';
import {
  ModelGenderLabel,
  PoseCategoryLabel,
  ModelEthnicityLabel,
} from '@/lib/generation-flow/pose-types';
import { getStoragePublicUrl } from '@/lib/storage/upload';

interface PoseDetailModalProps {
  pose: PoseMetadata | null;
  isOpen: boolean;
  isSelected: boolean;
  onClose: () => void;
  onToggleSelect: (poseId: string) => void;
}

export const PoseDetailModal: React.FC<PoseDetailModalProps> = ({
  pose,
  isOpen,
  isSelected,
  onClose,
  onToggleSelect,
}) => {
  // Handle Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Resolve storage paths to full URLs
  const resolvedImageUrl = React.useMemo(() => {
    if (!pose?.imageUrl) return '';
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
  }, [pose?.imageUrl]);

  if (!isOpen || !pose) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
          aria-label="Fechar"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 5L5 15M5 5L15 15"
              stroke="#20202a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Scrollable content */}
        <div className="overflow-y-auto max-h-[90vh]">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image section */}
            <div className="relative aspect-[3/4] md:aspect-auto md:min-h-[600px] bg-gradient-to-br from-gray-100 to-gray-50">
              <Image
                src={resolvedImageUrl}
                alt={pose.name || 'Model pose'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />

              {/* Selection indicator overlay */}
              {isSelected && (
                <div className="absolute top-4 left-4 bg-[#20202a] text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 10L8 14L16 6"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Info section */}
            <div className="flex flex-col p-6 md:p-8">
              {/* Header */}
              <div className="mb-6">
                <h2 className="font-freight font-medium text-2xl text-[#111827] mb-2">
                  {pose.name || 'Sem nome'}
                </h2>
                {pose.description && (
                  <p className="font-inter text-base text-[#6b7280] leading-relaxed">
                    {pose.description}
                  </p>
                )}
              </div>

              {/* Metadata grid */}
              <div className="space-y-4 mb-6">
                {/* Gender */}
                <div>
                  <h3 className="font-inter font-semibold text-xs text-[#6b7280] uppercase tracking-wide mb-1">
                    Gênero
                  </h3>
                  <p className="font-inter font-medium text-base text-[#111827]">
                    {ModelGenderLabel[pose.gender]}
                  </p>
                </div>

                {/* Age */}
                <div>
                  <h3 className="font-inter font-semibold text-xs text-[#6b7280] uppercase tracking-wide mb-1">
                    Faixa Etária
                  </h3>
                  <p className="font-inter font-medium text-base text-[#111827]">
                    {pose.ageMin} - {pose.ageMax} anos
                  </p>
                </div>

                {/* Ethnicity */}
                <div>
                  <h3 className="font-inter font-semibold text-xs text-[#6b7280] uppercase tracking-wide mb-1">
                    Etnia
                  </h3>
                  <p className="font-inter font-medium text-base text-[#111827]">
                    {ModelEthnicityLabel[pose.ethnicity]}
                  </p>
                </div>

                {pose.isUserModel && pose.modelAttributes && (
                  <div className="grid grid-cols-2 gap-4">
                    {pose.modelAttributes.heightCm && (
                      <div>
                        <h3 className="font-inter font-semibold text-xs text-[#6b7280] uppercase tracking-wide mb-1">
                          Altura
                        </h3>
                        <p className="font-inter font-medium text-base text-[#111827]">
                          {pose.modelAttributes.heightCm} cm
                        </p>
                      </div>
                    )}
                    {pose.modelAttributes.weightKg && (
                      <div>
                        <h3 className="font-inter font-semibold text-xs text-[#6b7280] uppercase tracking-wide mb-1">
                          Peso
                        </h3>
                        <p className="font-inter font-medium text-base text-[#111827]">
                          {pose.modelAttributes.weightKg} kg
                        </p>
                      </div>
                    )}
                    {pose.modelAttributes.hairColor && (
                      <div>
                        <h3 className="font-inter font-semibold text-xs text-[#6b7280] uppercase tracking-wide mb-1">
                          Cor do cabelo
                        </h3>
                        <p className="font-inter font-medium text-base text-[#111827]">
                          {pose.modelAttributes.hairColor}
                        </p>
                      </div>
                    )}
                    {pose.modelAttributes.facialExpression && (
                      <div>
                        <h3 className="font-inter font-semibold text-xs text-[#6b7280] uppercase tracking-wide mb-1">
                          Expressão
                        </h3>
                        <p className="font-inter font-medium text-base text-[#111827]">
                          {pose.modelAttributes.facialExpression}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Pose Category */}
                <div>
                  <h3 className="font-inter font-semibold text-xs text-[#6b7280] uppercase tracking-wide mb-1">
                    Categoria da Pose
                  </h3>
                  <span className="inline-block px-3 py-1.5 bg-[#f1f1f1] text-[#20202a] rounded-lg font-inter font-medium text-sm">
                    {PoseCategoryLabel[pose.poseCategory]}
                  </span>
                </div>

                {/* Garment Categories */}
                {pose.garmentCategories && pose.garmentCategories.length > 0 && (
                  <div>
                    <h3 className="font-inter font-semibold text-xs text-[#6b7280] uppercase tracking-wide mb-2">
                      Tipos de Roupa Compatíveis
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {pose.garmentCategories.map((category) => (
                        <span
                          key={category}
                          className="px-2.5 py-1 bg-white border border-gray-200 text-[#20202a] rounded-lg font-inter font-medium text-xs"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {pose.tags && pose.tags.length > 0 && (
                  <div>
                    <h3 className="font-inter font-semibold text-xs text-[#6b7280] uppercase tracking-wide mb-2">
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {pose.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 bg-[#f9fafb] text-[#6b7280] rounded-md font-inter text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action button - sticky at bottom on mobile */}
              <div className="mt-auto pt-6 border-t border-gray-200">
                <button
                  onClick={() => onToggleSelect(pose.id)}
                  className={`
                    w-full px-6 py-3.5 rounded-xl font-inter font-semibold text-base
                    transition-all duration-200
                    ${isSelected
                      ? 'bg-white text-[#20202a] border-2 border-[#20202a] hover:bg-gray-50'
                      : 'bg-[#20202a] text-white hover:bg-[#2a2a34] shadow-lg'
                    }
                  `}
                >
                  {isSelected ? 'Remover seleção' : 'Selecionar pose'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
