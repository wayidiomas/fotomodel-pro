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
  const [aiPrompt, setAiPrompt] = React.useState<string>(value?.type === 'ai' ? value.aiPrompt || '' : '');
  const [aiPreview, setAiPreview] = React.useState<string | null>(
    value?.type === 'ai' ? value.aiPreviewUrl || value.customUrl || null : null
  );
  const [aiError, setAiError] = React.useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  // Handle preset selection
  const handlePresetSelect = (preset: BackgroundPreset) => {
    if (value?.type === 'preset' && value.presetId === preset.id) {
      // Deselect
      onChange(null);
      setCustomPreview(null);
      setAiPreview(null);
      setAiPrompt('');
      setAiError(null);
    } else {
      // Select preset
      onChange({
        type: 'preset',
        presetId: preset.id,
        presetName: preset.name,
        presetCategory: preset.category,
      });
      setCustomPreview(null);
      setAiPreview(null);
      setAiPrompt('');
    }
    setUploadError(null);
    setAiError(null);
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
    setAiError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      const previewUrl = typeof reader.result === 'string' ? reader.result : null;
      setCustomPreview(previewUrl);
      setAiPreview(null);
      setAiPrompt('');

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
      setAiPreview(null);
      setAiPrompt('');
    } else if (value?.type === 'ai') {
      setAiPreview(value.aiPreviewUrl || value.customUrl || null);
      setAiPrompt(value.aiPrompt || '');
      setCustomPreview(null);
    } else if (!value) {
      setCustomPreview(null);
      setAiPreview(null);
      setAiPrompt('');
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

      {/* AI Generator */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900">Gerar com IA</p>
                <span className="inline-flex items-center rounded-full bg-[#f4f0e7] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#6d4b21]">
                  1 crédito
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Descreva o cenário e deixe a IA criar o fundo perfeito (sem modelos ou pessoas)
              </p>
            </div>
            {value?.type === 'ai' && (
              <button
                type="button"
                onClick={() => {
                  setAiPreview(null);
                  setAiPrompt('');
                  setAiError(null);
                  onChange(null);
                }}
                className="text-xs text-gray-500 underline hover:text-gray-700 transition-colors"
              >
                Limpar seleção IA
              </button>
            )}
          </div>

          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#20202a] focus:ring-[#20202a]"
            placeholder="Ex: estúdio em tons pastel com luz lateral suave e elementos florais desfocados"
          />

          {aiError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {aiError}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-gray-500">
              A IA gera apenas o ambiente. Sua modelo continuará perfeita e será posicionada nesse cenário. Cada geração consome 1 crédito.
            </p>
            <button
              type="button"
              disabled={isGeneratingAI}
              onClick={async () => {
                const prompt = aiPrompt.trim();
                if (!prompt) {
                  setAiError('Descreva o background para gerar com IA.');
                  return;
                }

                try {
                  setAiError(null);
                  setIsGeneratingAI(true);
                  const response = await fetch('/api/ai/generate-background', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt }),
                  });
                  const data = await response.json();
                  if (!response.ok || !data.success || !data.imageData) {
                    throw new Error(data.error || 'Não foi possível gerar o background.');
                  }

                  const previewUrl = `data:${data.mimeType || 'image/png'};base64,${data.imageData}`;
                  setAiPreview(previewUrl);
                  setCustomPreview(null);
                  onChange({
                    type: 'ai',
                    aiPrompt: prompt,
                    aiImageData: data.imageData,
                    aiImageMimeType: data.mimeType || 'image/png',
                    aiPreviewUrl: previewUrl,
                    customUrl: previewUrl,
                  });
                } catch (error) {
                  console.error('Erro ao gerar background com IA:', error);
                  setAiError(
                    error instanceof Error ? error.message : 'Erro inesperado ao gerar background.'
                  );
                } finally {
                  setIsGeneratingAI(false);
                }
              }}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors',
                isGeneratingAI ? 'bg-gray-400' : 'bg-[#20202a] hover:bg-[#2c2c38]'
              )}
            >
              {isGeneratingAI ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Gerando...
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 1L10 5L14 6L11 9L12 13L8 11L4 13L5 9L2 6L6 5L8 1Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Gerar fundo
                </>
              )}
            </button>
          </div>

          {aiPreview && (
            <div className="mt-4 rounded-xl border border-gray-200 bg-white/70 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-800">Prévia do background</p>
                {value?.type === 'ai' && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Selecionado
                  </span>
                )}
              </div>
              <div className="relative mt-2 h-48 w-full overflow-hidden rounded-lg border border-gray-100">
                <Image src={aiPreview} alt="Background gerado pela IA" fill className="object-cover" />
              </div>
            </div>
          )}
        </div>
      </div>

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
