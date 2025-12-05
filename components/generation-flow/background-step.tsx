'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Coins, Upload, X, ImageIcon } from 'lucide-react';
import type { BackgroundSelection } from './background-selector';
import type { Tables } from '@/types/database.types';

type BackgroundPreset = Tables<'background_presets'>;

interface BackgroundStepProps {
  enabled: boolean;
  selection: BackgroundSelection | null;
  backgrounds: BackgroundPreset[];
  onToggle: (enabled: boolean) => void;
  onSelectionChange: (selection: BackgroundSelection | null) => void;
}

export function BackgroundStep({
  enabled,
  selection,
  backgrounds,
  onToggle,
  onSelectionChange,
}: BackgroundStepProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [customPreview, setCustomPreview] = React.useState<string | null>(
    selection?.type === 'custom' ? selection.customUrl || null : null
  );
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const maxFileSize = 10; // MB

  const isOriginalSelection = selection?.type === 'original';

  const handleToggle = (checked: boolean) => {
    if (!checked) {
      onSelectionChange(null);
      setCustomPreview(null);
    }
    onToggle(checked);
  };

  const handleKeepOriginal = () => {
    onToggle(false);
    onSelectionChange({ type: 'original' });
    setCustomPreview(null);
  };

  const handlePersonalize = () => {
    if (!enabled) {
      onToggle(true);
    }
    if (selection?.type === 'original') {
      onSelectionChange(null);
    }
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

      onSelectionChange({
        type: 'custom',
        customUrl: previewUrl || undefined,
        customFileName: file.name,
        customFileSizeMB: Number(fileSizeMB.toFixed(2)),
        customMimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveUpload = () => {
    setCustomPreview(null);
    onSelectionChange(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Sync previews when external value changes
  React.useEffect(() => {
    if (selection?.type === 'custom') {
      setCustomPreview(selection.customUrl || null);
    } else if (!selection || selection.type === 'original') {
      setCustomPreview(null);
    }
  }, [selection]);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-col gap-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Cenário e Background</h3>
            <p className="text-xs text-gray-500">
              Escolha manter o fundo original da peça ou personalize com upload de imagem.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleKeepOriginal}
            className={cn(
              'flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-all',
              isOriginalSelection
                ? 'border-[#c8b081] bg-[#f8f1e3] text-[#6d4b21] shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:border-[#d6c299]'
            )}
          >
            Manter fundo original
          </button>
          <button
            type="button"
            onClick={handlePersonalize}
            className={cn(
              'flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-all',
              enabled && !isOriginalSelection
                ? 'border-[#20202a] bg-[#20202a] text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:border-[#20202a]/40'
            )}
          >
            Personalizar fundo
          </button>
        </div>
        {isOriginalSelection && (
          <div className="rounded-xl border border-[#f4e5c8] bg-[#fff9ee] px-4 py-3 text-xs text-[#6d4b21]">
            Vamos manter o cenário original das peças enviadas, preservando luz e ambiente da foto.
          </div>
        )}
      </div>

      {enabled && !isOriginalSelection ? (
        <div className="space-y-4">
          {/* Credit cost badge */}
          <div className="flex items-center gap-2 p-3 rounded-xl border border-amber-200 bg-amber-50">
            <Coins className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <p className="font-inter text-xs text-amber-700">
              <span className="font-semibold">+1 crédito</span> será cobrado ao personalizar o fundo da imagem
            </p>
          </div>

          {/* Upload Area */}
          <div className="space-y-3">
            <label className="font-inter text-sm font-medium text-gray-900">
              Upload de Fundo Personalizado
            </label>

            {/* Error message */}
            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-inter text-xs text-red-600">{uploadError}</p>
              </div>
            )}

            {/* Upload box or preview */}
            {customPreview ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-[#20202a] bg-gray-100">
                <div className="relative aspect-video w-full max-w-md mx-auto">
                  <Image
                    src={customPreview}
                    alt="Background personalizado"
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Remove button */}
                <button
                  type="button"
                  onClick={handleRemoveUpload}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                {/* File info */}
                <div className="p-3 bg-white border-t border-gray-200">
                  <p className="font-inter text-xs text-gray-600">
                    {selection?.customFileName || 'Imagem personalizada'}
                    {selection?.customFileSizeMB ? ` • ${selection.customFileSizeMB}MB` : ''}
                  </p>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'w-full rounded-2xl border-2 border-dashed transition-all duration-200',
                  'flex flex-col items-center justify-center gap-3 p-8',
                  'hover:border-[#20202a] hover:bg-gray-50',
                  'border-gray-300 bg-white'
                )}
              >
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-gray-500" />
                </div>
                <div className="text-center">
                  <p className="font-inter text-sm font-medium text-gray-900">
                    Clique para enviar uma imagem
                  </p>
                  <p className="font-inter text-xs text-gray-500 mt-1">
                    PNG, JPG até {maxFileSize}MB
                  </p>
                </div>
              </button>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Coming soon notice for presets */}
          <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <ImageIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <p className="font-inter text-sm font-medium text-gray-700">
                Em breve: Biblioteca de Fundos
              </p>
              <p className="font-inter text-xs text-gray-500">
                Estamos preparando uma coleção de fundos profissionais para você
              </p>
            </div>
          </div>
        </div>
      ) : (
        !isOriginalSelection && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <p className="text-sm text-gray-600">
              Use esta etapa para alinhar o cenário com sua campanha. Ative a personalização para liberar as opções.
            </p>
            <button
              type="button"
              onClick={handlePersonalize}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#20202a] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2c2c38]"
            >
              Ativar personalização de fundo
            </button>
          </div>
        )
      )}
    </div>
  );
}
