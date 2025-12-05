'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { User, Ruler, Check, Users } from 'lucide-react';

export type Gender = 'FEMALE' | 'MALE';
export type AgeRange = '0-2' | '2-10' | '10-15' | '15-20' | '20-30' | '30-40' | '40-50' | '50-60' | '60+';
export type BodySize = 'P' | 'M' | 'G' | 'plus-size';

export interface ModelCharacteristics {
  gender?: Gender;
  ageRange?: AgeRange;
  bodySize?: BodySize;
}

interface ModelCharacteristicsSelectorProps {
  value: ModelCharacteristics;
  onChange: (characteristics: ModelCharacteristics) => void;
  disabled?: boolean;
  className?: string;
}

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'FEMALE', label: 'Feminino' },
  { value: 'MALE', label: 'Masculino' },
];

const AGE_RANGES: { value: AgeRange; label: string; description: string }[] = [
  { value: '0-2', label: '0-2', description: 'Bebê' },
  { value: '2-10', label: '2-10', description: 'Criança' },
  { value: '10-15', label: '10-15', description: 'Pré-adolescente' },
  { value: '15-20', label: '15-20', description: 'Adolescente' },
  { value: '20-30', label: '20-30', description: 'Jovem adulto' },
  { value: '30-40', label: '30-40', description: 'Adulto' },
  { value: '40-50', label: '40-50', description: 'Meia idade' },
  { value: '50-60', label: '50-60', description: 'Maduro' },
  { value: '60+', label: '60+', description: 'Sênior' },
];

const BODY_SIZES: { value: BodySize; label: string; description: string }[] = [
  { value: 'P', label: 'P', description: 'Pequeno' },
  { value: 'M', label: 'M', description: 'Médio' },
  { value: 'G', label: 'G', description: 'Grande' },
  { value: 'plus-size', label: 'Plus Size', description: 'Plus Size' },
];

export const ModelCharacteristicsSelector: React.FC<ModelCharacteristicsSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className,
}) => {
  const handleGenderClick = (gender: Gender) => {
    if (disabled) return;
    onChange({
      ...value,
      gender: value.gender === gender ? undefined : gender,
    });
  };

  const handleAgeClick = (age: AgeRange) => {
    if (disabled) return;
    onChange({
      ...value,
      ageRange: value.ageRange === age ? undefined : age,
    });
  };

  const handleSizeClick = (size: BodySize) => {
    if (disabled) return;
    onChange({
      ...value,
      bodySize: value.bodySize === size ? undefined : size,
    });
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Gender Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          <p className="font-inter text-xs font-semibold text-gray-700">
            Sexo do modelo
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((gender) => {
            const isSelected = value.gender === gender.value;
            return (
              <button
                key={gender.value}
                onClick={() => handleGenderClick(gender.value)}
                disabled={disabled}
                className={cn(
                  'group relative flex items-center gap-2 rounded-xl border px-4 py-2.5 font-inter text-sm transition-all',
                  isSelected
                    ? 'border-[#20202a] bg-[#20202a] text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-[#20202a]/50 hover:bg-gray-50',
                  disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                {isSelected && <Check className="h-3.5 w-3.5" />}
                <span className="font-semibold">{gender.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Age Range Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-500" />
          <p className="font-inter text-xs font-semibold text-gray-700">
            Faixa de idade <span className="font-normal text-gray-400">(opcional)</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {AGE_RANGES.map((age) => {
            const isSelected = value.ageRange === age.value;
            return (
              <button
                key={age.value}
                onClick={() => handleAgeClick(age.value)}
                disabled={disabled}
                className={cn(
                  'group relative flex items-center gap-2 rounded-xl border px-3 py-2 font-inter text-sm transition-all',
                  isSelected
                    ? 'border-[#20202a] bg-[#20202a] text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-[#20202a]/50 hover:bg-gray-50',
                  disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                {isSelected && <Check className="h-3.5 w-3.5" />}
                <span className="font-semibold">{age.label}</span>
                <span className={cn('text-xs', isSelected ? 'text-white/70' : 'text-gray-400')}>
                  {age.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Body Size Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Ruler className="h-4 w-4 text-gray-500" />
          <p className="font-inter text-xs font-semibold text-gray-700">
            Tamanho/Tipo de corpo <span className="font-normal text-gray-400">(opcional)</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {BODY_SIZES.map((size) => {
            const isSelected = value.bodySize === size.value;
            return (
              <button
                key={size.value}
                onClick={() => handleSizeClick(size.value)}
                disabled={disabled}
                className={cn(
                  'group relative flex items-center gap-2 rounded-xl border px-4 py-2 font-inter text-sm transition-all',
                  isSelected
                    ? 'border-[#20202a] bg-[#20202a] text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-[#20202a]/50 hover:bg-gray-50',
                  disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                {isSelected && <Check className="h-3.5 w-3.5" />}
                <span className="font-semibold">{size.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {(value.gender || value.ageRange || value.bodySize) && (
        <div className="rounded-xl border border-[#e6e0d3] bg-[#f7f2e7] p-3">
          <p className="font-inter text-xs text-[#2c261d]">
            <strong>Modelo selecionado:</strong>{' '}
            {[
              value.gender && (value.gender === 'FEMALE' ? 'Feminino' : 'Masculino'),
              value.ageRange && `${value.ageRange} anos`,
              value.bodySize && (value.bodySize === 'plus-size' ? 'Plus Size' : `Tamanho ${value.bodySize}`),
            ]
              .filter(Boolean)
              .join(', ') || 'Padrão'}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Convert characteristics to prompt-friendly English text
 */
export function characteristicsToPromptText(characteristics: ModelCharacteristics): string {
  const parts: string[] = [];

  if (characteristics.gender) {
    const genderMap: Record<Gender, string> = {
      'FEMALE': 'a female model',
      'MALE': 'a male model',
    };
    parts.push(genderMap[characteristics.gender]);
  }

  if (characteristics.ageRange) {
    const ageMap: Record<AgeRange, string> = {
      '0-2': 'who is a baby/toddler (0-2 years old)',
      '2-10': 'who is a child (2-10 years old)',
      '10-15': 'who is a pre-teen (10-15 years old)',
      '15-20': 'who is a teenager (15-20 years old)',
      '20-30': 'who is a young adult (20-30 years old)',
      '30-40': 'who is an adult (30-40 years old)',
      '40-50': 'who is middle-aged (40-50 years old)',
      '50-60': 'who is mature (50-60 years old)',
      '60+': 'who is a senior (60+ years old)',
    };
    parts.push(ageMap[characteristics.ageRange]);
  }

  if (characteristics.bodySize) {
    const sizeMap: Record<BodySize, string> = {
      'P': 'with a petite/slim build',
      'M': 'with a medium/average build',
      'G': 'with a larger/curvy build',
      'plus-size': 'with a plus-size body type, curvy and confident',
    };
    parts.push(sizeMap[characteristics.bodySize]);
  }

  return parts.join(' ');
}

/**
 * Get detailed prompt additions for model characteristics
 */
export function getCharacteristicsPromptAddition(characteristics: ModelCharacteristics): string {
  if (!characteristics.gender && !characteristics.ageRange && !characteristics.bodySize) {
    return '';
  }

  const text = characteristicsToPromptText(characteristics);
  return `\n\nMODEL CHARACTERISTICS:
The model should be ${text}. Ensure the model's appearance authentically represents these characteristics while maintaining a professional, confident, and aspirational look suitable for fashion photography.`;
}
