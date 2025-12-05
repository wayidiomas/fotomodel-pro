'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Tables } from '@/types/database.types';

type BackgroundPreset = Tables<'background_presets'>;

export interface BackgroundSelection {
  type: 'preset' | 'custom' | 'ai' | 'original';
  presetId?: string;
  presetName?: string;
  presetCategory?: string;
  customUrl?: string;
  customFileName?: string;
  customFileSizeMB?: number;
  customMimeType?: string;
  aiPrompt?: string;
  aiImageData?: string;
  aiImageMimeType?: string;
  aiPreviewUrl?: string;
}

interface BackgroundSelectorProps {
  value: BackgroundSelection | null;
  onChange: (value: BackgroundSelection | null) => void;
  backgrounds: BackgroundPreset[];
  className?: string;
  maxFileSize?: number; // in MB
}

/**
 * Component for selecting background (preset or custom upload)
 * Displays preset backgrounds in a grid with upload option
 */
// Category labels in Portuguese
const CATEGORY_LABELS: Record<string, string> = {
  all: 'Todos',
  neutral: 'Neutro',
  pastel: 'Pastel',
  textured: 'Texturizado',
  gradient: 'Gradiente',
  vibrant: 'Vibrante',
  premium: 'Premium',
};

export function BackgroundSelector({
  value,
  onChange,
  backgrounds,
  className,
  maxFileSize = 10,
}: BackgroundSelectorProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [customPreview, setCustomPreview] = React.useState<string | null>(
    value?.type === 'custom' ? value.customUrl || null : null
  );
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  // AI background states (for future AI background generation feature)
  const [aiPreview, setAiPreview] = React.useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = React.useState<string>('');
  const [aiError, setAiError] = React.useState<string | null>(null);

  // Handle preset selection
  const handlePresetSelect = (preset: BackgroundPreset) => {
    if (value?.type === 'preset' && value.presetId === preset.id) {
      // Deselect
      onChange(null);
      setCustomPreview(null);
    } else {
      // Select preset
      onChange({
        type: 'preset',
        presetId: preset.id,
        presetName: preset.name,
        presetCategory: preset.category,
      });
      setCustomPreview(null);
    }
    setUploadError(null);
  };

  // Handle custom file upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      setUploadError(`Arquivo muito grande. Tamanho máximo: ${maxFileSize}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Apenas imagens são permitidas');
      return;
    }

    setUploadError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      const previewUrl = typeof reader.result === 'string' ? reader.result : null;
      setCustomPreview(previewUrl);

      onChange({
        type: 'custom',
        customUrl: previewUrl || undefined,
        customFileName: file.name,
        customFileSizeMB: Number(fileSizeMB.toFixed(2)),
        customMimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  // Sync previews when external value changes
  React.useEffect(() => {
    if (value?.type === 'custom') {
      setCustomPreview(value.customUrl || null);
    } else if (!value) {
      setCustomPreview(null);
    }
  }, [value]);

  // Get unique categories from backgrounds
  const categories = React.useMemo(() => {
    const uniqueCategories = new Set(backgrounds.map((bg) => bg.category));
    return ['all', ...Array.from(uniqueCategories)];
  }, [backgrounds]);

  // Filter backgrounds by selected category
  const filteredBackgrounds = React.useMemo(() => {
    if (selectedCategory === 'all') {
      return backgrounds;
    }
    return backgrounds.filter((bg) => bg.category === selectedCategory);
  }, [backgrounds, selectedCategory]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="font-inter text-sm font-medium text-gray-900">
          Fundo (Background)
        </label>
        {value && (
          <button
            onClick={() => {
              onChange(null);
              setCustomPreview(null);
              setAiPreview(null);
              setAiPrompt('');
              setUploadError(null);
              setAiError(null);
            }}
            className="font-inter text-xs text-gray-500 hover:text-gray-700 underline transition-colors"
          >
            Limpar seleção
          </button>
        )}
      </div>

      <p className="font-inter text-xs text-gray-500">
        Escolha um fundo pré-definido ou envie um personalizado (opcional)
      </p>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            type="button"
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#20202a]',
              selectedCategory === category
                ? 'bg-[#20202a] text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {CATEGORY_LABELS[category] || category}
          </button>
        ))}
      </div>

      {/* Error message */}
      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="font-inter text-xs text-red-600">{uploadError}</p>
        </div>
      )}

      {/* Grid of backgrounds */}
      <div className="grid grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2">
        {/* Upload custom button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'aspect-square rounded-lg border-2 border-dashed transition-all duration-200',
            'flex flex-col items-center justify-center gap-2 p-3',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#20202a]',
            value?.type === 'custom'
              ? 'border-[#20202a] bg-[#20202a]/5'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          )}
        >
          {customPreview ? (
            <div className="relative w-full h-full rounded overflow-hidden">
              <Image
                src={customPreview}
                alt="Background personalizado"
                fill
                className="object-cover"
              />
              {value?.type === 'custom' && (
                <div className="absolute inset-0 bg-[#20202a]/20 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M2 7L5.5 10.5L12 3.5"
                        stroke="#20202a"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="text-gray-400"
              >
                <path
                  d="M12 5V19M5 12H19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-inter text-xs font-medium text-gray-600 text-center leading-tight">
                Upload Personalizado
              </span>
            </>
          )}
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Preset backgrounds */}
        {filteredBackgrounds.map((bg) => {
          const isSelected = value?.type === 'preset' && value.presetId === bg.id;

          return (
            <button
              key={bg.id}
              type="button"
              onClick={() => handlePresetSelect(bg)}
              className={cn(
                'relative aspect-square rounded-lg border-2 transition-all duration-200 overflow-hidden group',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#20202a]',
                isSelected
                  ? 'border-[#20202a] shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              )}
            >
              {/* Background image */}
              <Image
                src={bg.thumbnail_url || bg.image_url}
                alt={bg.name}
                fill
                className="object-cover"
              />

              {/* Overlay with name on hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-2">
                <span className="font-inter text-xs font-medium text-white text-center leading-tight">
                  {bg.name}
                </span>
              </div>

              {/* Checkmark for selected */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#20202a] text-white flex items-center justify-center shadow-lg z-10">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2 7L5.5 10.5L12 3.5"
                      stroke="currentColor"
                      strokeWidth="2"
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

      {/* AI generator removido do front-end */}

      {/* Selected background info */}
      {value && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="font-inter text-xs text-gray-600">
            {value.type === 'custom' && (
              <>
                Background personalizado selecionado
                {value.customFileName ? ` (${value.customFileName})` : ''}
                {value.customFileSizeMB ? ` • ${value.customFileSizeMB}MB` : ''}
              </>
            )}
            {value.type === 'preset' && (
              <>
                Preset: {backgrounds.find((bg) => bg.id === value.presetId)?.name || 'Desconhecido'}
              </>
            )}
            {value.type === 'ai' && (
              <>
                Fundo gerado com IA{value.aiPrompt ? `: “${value.aiPrompt}”` : ''}
              </>
            )}
            {value.type === 'original' && (
              <>Fundo original das peças será mantido</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
