'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Download, RefreshCw, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

interface BeforeAfterPreviewProps {
  beforeImage?: string;
  afterImages?: string[];
  selectedIndex?: number;
  onSelectImage?: (index: number) => void;
  onDownload?: (imageUrl: string) => void;
  onRefine?: () => void;
  onGenerateMore?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const BeforeAfterPreview: React.FC<BeforeAfterPreviewProps> = ({
  beforeImage,
  afterImages = [],
  selectedIndex = 0,
  onSelectImage,
  onDownload,
  onRefine,
  onGenerateMore,
  isLoading = false,
  className,
}) => {
  const [viewMode, setViewMode] = React.useState<'split' | 'slider'>('split');
  const [sliderPosition, setSliderPosition] = React.useState(50);
  const sliderRef = React.useRef<HTMLDivElement>(null);

  const currentAfterImage = afterImages[selectedIndex];

  const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.min(100, Math.max(0, position)));
  };

  const handlePrevImage = () => {
    if (selectedIndex > 0) {
      onSelectImage?.(selectedIndex - 1);
    }
  };

  const handleNextImage = () => {
    if (selectedIndex < afterImages.length - 1) {
      onSelectImage?.(selectedIndex + 1);
    }
  };

  // Empty state
  if (!beforeImage && afterImages.length === 0) {
    return (
      <div className={cn('rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-12', className)}>
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-inter text-lg font-semibold text-gray-900">
            Nenhuma imagem ainda
          </h3>
          <p className="mt-2 max-w-sm font-inter text-sm text-gray-500">
            Envie uma foto da sua roupa e use uma ação rápida para começar a transformação
          </p>
        </div>
      </div>
    );
  }

  // Only before image (waiting for generation)
  if (beforeImage && afterImages.length === 0) {
    return (
      <div className={cn('relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm', className)}>
        <div className="aspect-[4/5] relative">
          <Image
            src={beforeImage}
            alt="Imagem original"
            fill
            className="object-contain"
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
                <p className="font-inter text-sm font-medium text-white">
                  Gerando...
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
          <p className="font-inter text-xs font-medium text-white">Original</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* View Mode Toggle */}
      {beforeImage && currentAfterImage && (
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('split')}
              className={cn(
                'rounded-lg px-3 py-1.5 font-inter text-xs font-medium transition-colors',
                viewMode === 'split'
                  ? 'bg-[#20202a] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Lado a lado
            </button>
            <button
              onClick={() => setViewMode('slider')}
              className={cn(
                'rounded-lg px-3 py-1.5 font-inter text-xs font-medium transition-colors',
                viewMode === 'slider'
                  ? 'bg-[#20202a] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Comparar
            </button>
          </div>

          {afterImages.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevImage}
                disabled={selectedIndex === 0}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="font-inter text-xs text-gray-500">
                {selectedIndex + 1} / {afterImages.length}
              </span>
              <button
                onClick={handleNextImage}
                disabled={selectedIndex === afterImages.length - 1}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Preview Area */}
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-lg">
        {viewMode === 'split' ? (
          // Split View
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            {/* Before */}
            <div className="relative aspect-[3/4]">
              {beforeImage ? (
                <Image
                  src={beforeImage}
                  alt="Antes"
                  fill
                  className="object-contain bg-gray-50"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gray-50">
                  <p className="font-inter text-sm text-gray-400">Sem imagem</p>
                </div>
              )}
              <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 backdrop-blur-sm">
                <p className="font-inter text-xs font-medium text-white">Antes</p>
              </div>
            </div>

            {/* After */}
            <div className="relative aspect-[3/4]">
              {currentAfterImage ? (
                <Image
                  src={currentAfterImage}
                  alt="Depois"
                  fill
                  className="object-contain bg-gray-50"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <p className="font-inter text-sm text-gray-400">Resultado aparecerá aqui</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-3 right-3 rounded-full bg-green-600 px-3 py-1">
                <p className="font-inter text-xs font-medium text-white">Depois</p>
              </div>
            </div>
          </div>
        ) : (
          // Slider View
          <div
            ref={sliderRef}
            className="relative aspect-[3/4] cursor-ew-resize select-none"
            onMouseMove={(e) => e.buttons === 1 && handleSliderMove(e)}
            onTouchMove={handleSliderMove}
          >
            {/* After Image (full) */}
            {currentAfterImage && (
              <Image
                src={currentAfterImage}
                alt="Depois"
                fill
                className="object-contain bg-gray-50"
              />
            )}

            {/* Before Image (clipped) */}
            {beforeImage && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <Image
                  src={beforeImage}
                  alt="Antes"
                  fill
                  className="object-contain bg-gray-50"
                  style={{ maxWidth: 'none', width: `${100 / (sliderPosition / 100)}%` }}
                />
              </div>
            )}

            {/* Slider Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg">
                <div className="flex gap-0.5">
                  <ChevronLeft className="h-4 w-4 text-gray-600" />
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                </div>
              </div>
            </div>

            {/* Labels */}
            <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 backdrop-blur-sm">
              <p className="font-inter text-xs font-medium text-white">Antes</p>
            </div>
            <div className="absolute bottom-3 right-3 rounded-full bg-green-600 px-3 py-1">
              <p className="font-inter text-xs font-medium text-white">Depois</p>
            </div>
          </div>
        )}
      </div>

      {/* Result Thumbnails (if multiple) */}
      {afterImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {afterImages.map((image, index) => (
            <button
              key={index}
              onClick={() => onSelectImage?.(index)}
              className={cn(
                'relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all',
                selectedIndex === index
                  ? 'border-[#20202a] ring-2 ring-[#20202a]/20'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <Image
                src={image}
                alt={`Resultado ${index + 1}`}
                fill
                className="object-cover"
              />
              {selectedIndex === index && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Check className="h-5 w-5 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      {currentAfterImage && (
        <div className="flex gap-3">
          <button
            onClick={() => onDownload?.(currentAfterImage)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#20202a] py-3 font-inter text-sm font-medium text-white transition-transform hover:scale-[1.02]"
          >
            <Download className="h-4 w-4" />
            Baixar
          </button>
          <button
            onClick={onRefine}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 font-inter text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refinar
          </button>
          {onGenerateMore && (
            <button
              onClick={onGenerateMore}
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 font-inter text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              +4
            </button>
          )}
        </div>
      )}
    </div>
  );
};
