'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// Expression option interface
export interface FacialExpression {
  value: string;
  label: string;
  description?: string;
  imagePath: string;
}

// Default expression options for female (matches seed data)
export const DEFAULT_EXPRESSIONS_FEMALE: FacialExpression[] = [
  {
    value: 'smiling',
    label: 'Sorrindo',
    description: 'Expressão alegre e acolhedora',
    imagePath: '/assets/images/expressions/smiling.jpg'
  },
  {
    value: 'serious',
    label: 'Séria',
    description: 'Expressão profissional e neutra',
    imagePath: '/assets/images/expressions/serious.jpg'
  },
  {
    value: 'confident',
    label: 'Confiante',
    description: 'Expressão forte e assertiva',
    imagePath: '/assets/images/expressions/confident.jpg'
  },
  {
    value: 'sensual',
    label: 'Sensual',
    description: 'Expressão sedutora e envolvente',
    imagePath: '/assets/images/expressions/sensual.jpg'
  },
  {
    value: 'relaxed',
    label: 'Relaxada',
    description: 'Expressão calma e tranquila',
    imagePath: '/assets/images/expressions/relaxed.jpg'
  },
  {
    value: 'elegant',
    label: 'Elegante',
    description: 'Expressão sofisticada',
    imagePath: '/assets/images/expressions/elegant.jpg'
  },
];

// Default expression options for male
export const DEFAULT_EXPRESSIONS_MALE: FacialExpression[] = [
  {
    value: 'smiling',
    label: 'Sorrindo',
    description: 'Expressão alegre e acolhedora',
    imagePath: '/assets/images/expressions/smilling_men.png'
  },
  {
    value: 'serious',
    label: 'Sério',
    description: 'Expressão profissional e neutra',
    imagePath: '/assets/images/expressions/serious_men.png'
  },
  {
    value: 'confident',
    label: 'Confiante',
    description: 'Expressão forte e assertiva',
    imagePath: '/assets/images/expressions/confident_men.png'
  },
  {
    value: 'sensual',
    label: 'Sensual',
    description: 'Expressão sedutora e envolvente',
    imagePath: '/assets/images/expressions/sensual_men.png'
  },
  {
    value: 'relaxed',
    label: 'Relaxado',
    description: 'Expressão calma e tranquila',
    imagePath: '/assets/images/expressions/relaxed_men.png'
  },
  {
    value: 'elegant',
    label: 'Elegante',
    description: 'Expressão sofisticada',
    imagePath: '/assets/images/expressions/elegant_men.png'
  },
];

// Legacy export for backwards compatibility
export const DEFAULT_EXPRESSIONS = DEFAULT_EXPRESSIONS_FEMALE;

interface FacialExpressionPickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  expressions?: FacialExpression[];
  gender?: 'MALE' | 'FEMALE' | null;
  className?: string;
}

/**
 * Component for selecting facial expression
 * Displays as a grid of selectable buttons (2x3 layout)
 * Switches between male/female images based on gender prop
 */
export function FacialExpressionPicker({
  value,
  onChange,
  expressions,
  gender = 'FEMALE',
  className,
}: FacialExpressionPickerProps) {
  // Use gender-specific expressions if no custom expressions provided
  const displayExpressions = expressions || (gender === 'MALE' ? DEFAULT_EXPRESSIONS_MALE : DEFAULT_EXPRESSIONS_FEMALE);
  const handleSelect = (expressionValue: string) => {
    // Toggle: if already selected, deselect
    if (value === expressionValue) {
      onChange(null);
    } else {
      onChange(expressionValue);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="font-inter text-sm font-medium text-gray-900">
          Expressão Facial
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
        Escolha a expressão facial para a modelo (opcional)
      </p>

      {/* Grid of expression buttons - single row of 6 */}
      <div className="grid grid-cols-6 gap-3 md:gap-4">
        {displayExpressions.map((expression) => {
          const isSelected = value === expression.value;

          return (
            <button
              key={expression.value}
              onClick={() => handleSelect(expression.value)}
              type="button"
              className={cn(
                'relative rounded-xl overflow-hidden',
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
              {/* Expression Image */}
              <div className="relative aspect-[2/3] w-full">
                <Image
                  src={expression.imagePath}
                  alt={expression.label}
                  fill
                  className="object-cover object-[center_30%]"
                  sizes="(max-width: 768px) 33vw, 20vw"
                />

                {/* Selection overlay (replaces brightness) */}
                {isSelected && (
                  <div className="absolute inset-0 bg-[#20202a]/15 pointer-events-none" />
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200 pointer-events-none" />

                {/* Gradient overlay with label */}
                <div className={cn(
                  'absolute inset-0 flex items-end justify-center p-4',
                  'bg-gradient-to-t from-black/70 via-black/20 to-transparent'
                )}>
                  <span
                    className="font-inter text-sm font-semibold text-white tracking-tight"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.4)' }}
                  >
                    {expression.label}
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
                    "animate-in zoom-in duration-200"
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

      {/* Selected expression description */}
      {value && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="font-inter text-xs text-gray-600">
            {displayExpressions.find((e) => e.value === value)?.description || ''}
          </p>
        </div>
      )}
    </div>
  );
}
