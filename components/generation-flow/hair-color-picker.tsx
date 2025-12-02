'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface HairColorOption {
  value: string;
  label: string;
  hexColor: string;
  imagePath: string;
}

export const DEFAULT_HAIR_COLORS: HairColorOption[] = [
  { value: 'blonde', label: 'Loiro', hexColor: '#F5E5B8', imagePath: '/assets/images/hair-colors/blonde.jpg' },
  { value: 'light_brown', label: 'Castanho Claro', hexColor: '#A68A64', imagePath: '/assets/images/hair-colors/light_brown.jpg' },
  { value: 'dark_brown', label: 'Castanho Escuro', hexColor: '#4A3728', imagePath: '/assets/images/hair-colors/dark_brown.jpg' },
  { value: 'afro', label: 'Afro', hexColor: '#1C1C1C', imagePath: '/assets/images/hair-colors/afro.jpg' },
  { value: 'red', label: 'Ruivo', hexColor: '#B94E48', imagePath: '/assets/images/hair-colors/red.jpg' },
  { value: 'gray', label: 'Grisalho', hexColor: '#A8A8A8', imagePath: '/assets/images/hair-colors/gray.jpg' },
];

interface HairColorPickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  colors?: HairColorOption[];
  className?: string;
}

/**
 * Component for selecting hair color
 * Displays as a grid of color swatches with labels
 */
export function HairColorPicker({
  value,
  onChange,
  colors = DEFAULT_HAIR_COLORS,
  className,
}: HairColorPickerProps) {
  const handleSelect = (colorValue: string) => {
    // Toggle: if already selected, deselect
    if (value === colorValue) {
      onChange(null);
    } else {
      onChange(colorValue);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="font-inter text-sm font-medium text-gray-900">
          Cor do Cabelo
        </label>
        {value && (
          <button
            onClick={() => onChange(null)}
            className="font-inter text-xs text-gray-500 hover:text-gray-700 underline transition-colors"
          >
            Limpar seleção
          </button>
        )}
      </div>

      <p className="font-inter text-xs text-gray-500">
        Escolha a cor do cabelo para a modelo (opcional)
      </p>

      {/* Grid of color options */}
      <div className="grid grid-cols-3 gap-4 md:gap-6">
        {colors.map((color) => {
          const isSelected = value === color.value;

          return (
            <button
              key={color.value}
              type="button"
              onClick={() => handleSelect(color.value)}
              className={cn(
                'relative rounded-2xl overflow-hidden',
                'transition-all duration-300 ease-out',
                'focus:outline-none focus-visible:ring-4 focus-visible:ring-[#20202a]/20',
                'active:scale-[0.98]',
                'group',
                isSelected ? [
                  'border-2 border-[#20202a]',
                  'shadow-lg ring-4 ring-[#20202a]/10',
                  'scale-[1.02]',
                ] : [
                  'border border-gray-200/50',
                  'shadow-sm hover:shadow-md',
                  'hover:border-gray-300/60',
                  'hover:scale-[1.01]',
                ]
              )}
            >
              {/* Hair Color Image */}
              <div className="relative aspect-square w-full">
                <Image
                  src={color.imagePath}
                  alt={color.label}
                  fill
                  className="object-cover object-[center_30%]"
                  sizes="(max-width: 768px) 33vw, 25vw"
                />

                {/* Selection overlay (replaces brightness) */}
                {isSelected && (
                  <div className="absolute inset-0 bg-[#20202a]/15 pointer-events-none" />
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200 pointer-events-none" />

                {/* Gradient overlay with label and color badge */}
                <div className={cn(
                  'absolute inset-0 flex flex-col items-center justify-end p-4 gap-2',
                  'bg-gradient-to-t from-black/70 via-black/20 to-transparent'
                )}>
                  {/* Color Badge (bottom) */}
                  <div
                    className="w-6 h-6 rounded-full ring-2 ring-white shadow-lg"
                    style={{
                      backgroundColor: color.hexColor,
                      boxShadow: `0 2px 8px ${color.hexColor}60, 0 0 0 2px white`,
                    }}
                  />

                  {/* Label */}
                  <span
                    className="font-inter text-sm font-semibold text-white tracking-tight"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.4)' }}
                  >
                    {color.label}
                  </span>
                </div>
              </div>

              {/* Checkmark for selected with enhanced styling */}
              {isSelected && (
                <div
                  className={cn(
                    "absolute top-2 right-2 w-6 h-6 rounded-full",
                    "bg-[#20202a] text-white",
                    "flex items-center justify-center",
                    "shadow-[0_2px_8px_rgba(0,0,0,0.25)]",
                    "ring-2 ring-white/50",
                    "animate-in zoom-in duration-200",
                    "z-30"
                  )}
                >
                  <svg
                    width="14"
                    height="14"
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
            </button>
          );
        })}
      </div>

      {/* Selected color info */}
      {value && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full ring-1 ring-gray-300"
            style={{ backgroundColor: colors.find((c) => c.value === value)?.hexColor }}
          />
          <p className="font-inter text-xs text-gray-600">
            Cor selecionada: <span className="font-semibold">{colors.find((c) => c.value === value)?.label || 'Desconhecida'}</span>
          </p>
        </div>
      )}
    </div>
  );
}
