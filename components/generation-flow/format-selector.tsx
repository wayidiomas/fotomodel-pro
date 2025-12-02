'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  PLATFORM_LABELS,
  type ImageFormatPreset,
  type Category
} from '@/lib/generation-flow/image-formats';

interface FormatSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  formats: ImageFormatPreset[];
  className?: string;
}

/**
 * Component for selecting image output format
 * Displays as tabbed categories with grid of format cards
 */
export function FormatSelector({
  value,
  onChange,
  formats,
  className,
}: FormatSelectorProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<Category>(CATEGORIES.SOCIAL);

  // Filter formats by selected category
  const filteredFormats = React.useMemo(() => {
    return formats.filter((format) => format.category === selectedCategory && format.is_active);
  }, [formats, selectedCategory]);

  const handleSelect = (formatId: string) => {
    // Toggle: if already selected, deselect
    if (value === formatId) {
      onChange(null);
    } else {
      onChange(formatId);
    }
  };

  // Get categories that have formats
  const availableCategories = React.useMemo(() => {
    const categories = new Set(formats.filter(f => f.is_active).map(f => f.category));
    return Array.from(categories).filter((cat): cat is Category => cat !== undefined);
  }, [formats]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="font-inter text-sm font-medium text-gray-900">
          Formato de Saída
        </label>
        {value && (
          <button
            onClick={() => onChange(null)}
            className="font-inter text-xs text-gray-500 hover:text-gray-700 underline transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {availableCategories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            className={cn(
              'font-inter px-4 py-2 text-sm font-medium rounded-lg',
              'transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#20202a]/20',
              selectedCategory === category
                ? 'bg-[#20202a] text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>

      {/* Formats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredFormats.map((format) => {
          const isSelected = value === format.id;
          const aspectParts = format.aspect_ratio.split(':');
          const isLandscape = aspectParts.length === 2 && parseFloat(aspectParts[0]) > parseFloat(aspectParts[1]);
          const isPortrait = aspectParts.length === 2 && parseFloat(aspectParts[0]) < parseFloat(aspectParts[1]);

          return (
            <button
              key={format.id}
              type="button"
              onClick={() => handleSelect(format.id)}
              className={cn(
                'relative rounded-xl overflow-hidden p-3',
                'transition-all duration-300 ease-out',
                'focus:outline-none focus-visible:ring-4 focus-visible:ring-[#20202a]/20',
                'active:scale-[0.98]',
                'group',
                'flex flex-col items-center gap-2',
                isSelected ? [
                  'border-2 border-[#20202a]',
                  'shadow-lg ring-4 ring-[#20202a]/10',
                  'scale-[1.02]',
                  'bg-gray-50',
                ] : [
                  'border border-gray-200/50',
                  'shadow-sm hover:shadow-md',
                  'hover:border-gray-300/60',
                  'hover:scale-[1.01]',
                  'bg-white',
                ]
              )}
            >
              {/* Aspect Ratio Visual Preview */}
              <div className="w-full flex items-center justify-center py-2">
                <div
                  className={cn(
                    'bg-gradient-to-br from-gray-200 to-gray-300',
                    'rounded shadow-inner',
                    'flex items-center justify-center',
                    isSelected && 'ring-2 ring-[#20202a]/20'
                  )}
                  style={{
                    width: isPortrait ? '45px' : isLandscape ? '70px' : '55px',
                    height: isPortrait ? '70px' : isLandscape ? '45px' : '55px',
                  }}
                >
                  <span className="font-inter text-[10px] font-semibold text-gray-600">
                    {format.aspect_ratio}
                  </span>
                </div>
              </div>

              {/* Format Name */}
              <div className="text-center space-y-0.5 w-full">
                <h3 className="font-inter text-xs font-semibold text-gray-900">
                  {format.name}
                </h3>
                <p className="font-inter text-[10px] text-gray-500">
                  {format.width} × {format.height}px
                </p>
              </div>

              {/* Checkmark for selected */}
              {isSelected && (
                <div
                  className={cn(
                    "absolute top-1.5 right-1.5 w-5 h-5 rounded-full",
                    "bg-[#20202a] text-white",
                    "flex items-center justify-center",
                    "shadow-[0_2px_8px_rgba(0,0,0,0.25)]",
                    "ring-2 ring-white/50",
                    "animate-in zoom-in duration-200",
                    "z-10"
                  )}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 6L5 9L10 3"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}

              {/* Premium badge (if applicable) */}
              {format.is_premium && (
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-yellow-100 border border-yellow-300 rounded-full">
                  <span className="font-inter text-xs font-semibold text-yellow-800">
                    Premium
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredFormats.length === 0 && (
        <div className="text-center py-12">
          <p className="font-inter text-sm text-gray-500">
            Nenhum formato disponível nesta categoria
          </p>
        </div>
      )}

      {/* Selected format info - Compacto */}
      {value && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          {(() => {
            const selectedFormat = formats.find((f) => f.id === value);
            if (!selectedFormat) return null;

            return (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-inter text-xs font-semibold text-gray-900">
                    {selectedFormat.name}
                  </p>
                  <p className="font-inter text-xs text-gray-500">
                    {selectedFormat.width} × {selectedFormat.height}px · {selectedFormat.aspect_ratio}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
