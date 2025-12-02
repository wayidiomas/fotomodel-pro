'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CategorizationLoadingProps {
  className?: string;
  count?: number;
}

export const CategorizationLoading: React.FC<CategorizationLoadingProps> = ({ className, count = 1 }) => {
  return (
    <div className={cn('w-full max-w-7xl mx-auto', className)}>
      {/* Animated Header */}
      <div className="flex flex-col items-center justify-center mb-12">
        <div className="relative mb-6">
          {/* AI Icon Animated */}
          <div className="w-20 h-20 bg-gradient-to-br from-[#f8ecda] via-[#e6cda3] to-[#c89a5c] rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg animate-pulse">
            <svg className="w-10 h-10 text-[#3f2f1d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>

          <h2 className="font-inter font-bold text-3xl text-[#20202a] text-center mb-3">
            Analisando suas peças
          </h2>

          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 bg-[#c89a5c] rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2.5 h-2.5 bg-[#c89a5c] rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2.5 h-2.5 bg-[#c89a5c] rounded-full animate-bounce" />
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 max-w-2xl">
          <p className="font-inter text-center text-sm text-gray-700">
            Identificando categorias, cores, padrões e ocasiões de uso
          </p>
        </div>
      </div>

      {/* Skeleton Cards with Enhanced Design */}
      <div className="space-y-8">
        {Array.from({ length: count }, (_, i) => i + 1).map((item) => (
          <div
            key={item}
            className="bg-white bg-noise border-2 border-gray-100 rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.02)] overflow-hidden relative"
          >
            {/* Shimmer Overlay - Wave Effect */}
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />

            <div className="flex gap-8 p-8">
              {/* Image Skeleton - Plataforma Elevada */}
              <div className="relative w-80 h-96 flex-shrink-0 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 p-px shadow-[0_4px_12px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.06)]">
                <div className="w-full h-full bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 rounded-2xl animate-pulse">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Fields Skeleton */}
              <div className="flex-1 space-y-6">
                {/* Category Field */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-12 w-full bg-gray-100 rounded-2xl animate-pulse shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]" />
                </div>

                {/* Description Field */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="space-y-2.5">
                    <div className="h-4 w-full bg-gray-100 rounded-lg animate-pulse" />
                    <div className="h-4 w-11/12 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="h-4 w-4/5 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="h-4 w-3/5 bg-gray-100 rounded-lg animate-pulse" />
                  </div>
                </div>

                {/* Tags Grid */}
                <div className="grid grid-cols-3 gap-6 pt-2">
                  {/* Colors */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="h-8 w-20 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full animate-pulse shadow-[0_1px_3px_rgba(0,0,0,0.04)]" />
                      <div className="h-8 w-24 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full animate-pulse shadow-[0_1px_3px_rgba(0,0,0,0.04)]" />
                      <div className="h-8 w-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full animate-pulse shadow-[0_1px_3px_rgba(0,0,0,0.04)]" />
                    </div>
                  </div>

                  {/* Occasions */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="h-8 w-20 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full animate-pulse shadow-[0_1px_3px_rgba(0,0,0,0.04)]" />
                      <div className="h-8 w-24 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full animate-pulse shadow-[0_1px_3px_rgba(0,0,0,0.04)]" />
                    </div>
                  </div>

                  {/* Patterns */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="h-8 w-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full animate-pulse shadow-[0_1px_3px_rgba(0,0,0,0.04)]" />
                      <div className="h-8 w-20 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full animate-pulse shadow-[0_1px_3px_rgba(0,0,0,0.04)]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
