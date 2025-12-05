'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Wand2 } from 'lucide-react';

interface GenerationSkeletonProps {
  className?: string;
  message?: string;
}

export const GenerationSkeleton: React.FC<GenerationSkeletonProps> = ({
  className,
  message = 'Gerando sua imagem...',
}) => {
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to card when it appears
  React.useEffect(() => {
    if (cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, []);

  return (
    <div ref={cardRef} className={cn('w-full max-w-xs', className)}>
      <div className="relative overflow-hidden rounded-2xl border border-white/50 bg-gradient-to-br from-[#f8f1e3]/40 via-white/60 to-[#ebe6d8]/40 p-4 shadow-lg backdrop-blur-xl">
        {/* Header */}
        <div className="relative z-10 mb-3 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#dbcba1] to-[#b08c4a] shadow-md">
            <Wand2 className="h-4 w-4 animate-pulse text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-inter text-sm font-semibold text-gray-900 truncate">
              {message}
            </h3>
            <p className="font-inter text-xs text-gray-500">
              Isso pode levar alguns segundos
            </p>
          </div>
          <Sparkles className="h-4 w-4 flex-shrink-0 animate-spin text-[#b08c4a]" />
        </div>

        {/* Image skeleton - compact */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-dashed border-gray-300/80 bg-white/70 shadow-inner">
          {/* Pulsing gradient */}
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200/70 via-white/40 to-gray-100/80" />

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-white/80 p-3 shadow-md backdrop-blur-sm">
              <Sparkles className="h-5 w-5 animate-pulse text-[#b08c4a]" />
            </div>
          </div>
        </div>

        {/* Progress bar - compact */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between font-inter text-xs text-gray-500">
            <span>Processando...</span>
            <span className="animate-pulse">●●●</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-gray-200/50">
            <div className="h-full w-2/3 animate-pulse bg-gradient-to-r from-[#dbcba1] via-[#c6a972] to-[#b08c4a]" />
          </div>
        </div>
      </div>
    </div>
  );
};
