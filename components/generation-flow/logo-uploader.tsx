'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export type LogoPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface LogoUpload {
  file: File;
  previewUrl: string;
  position: LogoPosition;
}

interface LogoUploaderProps {
  value: LogoUpload | null;
  onChange: (value: LogoUpload | null) => void;
  className?: string;
  maxFileSize?: number; // in MB
}

const POSITION_LABELS: Record<LogoPosition, string> = {
  'top-left': 'Superior Esquerda',
  'top-center': 'Superior Centro',
  'top-right': 'Superior Direita',
  'center-left': 'Centro Esquerda',
  'center': 'Centro',
  'center-right': 'Centro Direita',
  'bottom-left': 'Inferior Esquerda',
  'bottom-center': 'Inferior Centro',
  'bottom-right': 'Inferior Direita',
};

/**
 * Component for uploading brand logo with position selection
 * Supports PNG, SVG, JPG formats with configurable file size limit
 */
export function LogoUploader({
  value,
  onChange,
  className,
  maxFileSize = 10,
}: LogoUploaderProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  // Handle file upload
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
    const validTypes = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Formato inválido. Use PNG, SVG ou JPG');
      return;
    }

    setUploadError(null);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);

    // Update selection with default center position
    onChange({
      file,
      previewUrl,
      position: 'center',
    });
  };

  // Handle position change
  const handlePositionChange = (position: LogoPosition) => {
    if (!value) return;

    onChange({
      ...value,
      position,
    });
  };

  // Handle remove logo
  const handleRemove = () => {
    if (value?.previewUrl) {
      URL.revokeObjectURL(value.previewUrl);
    }
    onChange(null);
    setUploadError(null);
  };

  // Cleanup preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (value?.previewUrl) {
        URL.revokeObjectURL(value.previewUrl);
      }
    };
  }, [value?.previewUrl]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-900">
          Logo da Marca
        </label>
        {value && (
          <button
            onClick={handleRemove}
            className="text-xs text-gray-500 hover:text-gray-700 underline transition-colors"
          >
            Remover logo
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Adicione o logo da sua marca à imagem (PNG, SVG ou JPG, até {maxFileSize}MB)
      </p>

      {/* Error message */}
      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-600">{uploadError}</p>
        </div>
      )}

      {/* Upload area */}
      <div
        onClick={() => !value && fileInputRef.current?.click()}
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-all duration-200',
          'flex items-center justify-center p-6',
          value
            ? 'border-[#20202a] bg-[#20202a]/5 cursor-default'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 cursor-pointer'
        )}
      >
        {value ? (
          <div className="flex items-center gap-4 w-full">
            {/* Logo preview */}
            <div className="relative w-20 h-20 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              <Image
                src={value.previewUrl}
                alt="Logo preview"
                fill
                className="object-contain p-2"
              />
            </div>

            {/* Logo info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {value.file.name}
              </p>
              <p className="text-xs text-gray-500">
                {(value.file.size / (1024 * 1024)).toFixed(2)}MB • {value.file.type.split('/')[1].toUpperCase()}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Posição: {POSITION_LABELS[value.position]}
              </p>
            </div>

            {/* Change file button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              Trocar
            </button>
          </div>
        ) : (
          <div className="text-center">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              className="mx-auto text-gray-400 mb-3"
            >
              <path
                d="M20 12V28M12 20H28"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="6"
                y="6"
                width="28"
                height="28"
                rx="4"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <p className="text-sm font-medium text-gray-700 mb-1">
              Clique para fazer upload do logo
            </p>
            <p className="text-xs text-gray-500">
              PNG, SVG ou JPG (máx. {maxFileSize}MB)
            </p>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/svg+xml,image/jpeg,image/jpg"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Position selector (only show if logo is uploaded) */}
      {value && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">
            Posição do Logo
          </label>

          {/* 3x3 grid position picker */}
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(POSITION_LABELS) as LogoPosition[]).map((position) => {
              const isSelected = value.position === position;

              return (
                <button
                  key={position}
                  type="button"
                  onClick={() => handlePositionChange(position)}
                  className={cn(
                    'relative px-3 py-2 rounded-md border-2 transition-all duration-200',
                    'text-xs font-medium text-center',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#20202a]',
                    isSelected
                      ? 'border-[#20202a] bg-[#20202a] text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  )}
                >
                  {POSITION_LABELS[position]}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
