'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ImageLoadingOverlayProps {
  /** Optional text to display below the spinner */
  loadingText?: string;
  /** Show cancel button */
  showCancelButton?: boolean;
  /** Cancel button click handler */
  onCancel?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export const ImageLoadingOverlay: React.FC<ImageLoadingOverlayProps> = ({
  loadingText = 'Carregando imagem...',
  showCancelButton = false,
  onCancel,
  className,
}) => {
  return (
    <div
      className={cn(
        'absolute inset-0 bg-gradient-to-b from-gray-100 to-gray-50',
        'flex flex-col items-center justify-center',
        'backdrop-blur-sm',
        className
      )}
    >
      {/* Cancel Button */}
      {showCancelButton && onCancel && (
        <button
          onClick={onCancel}
          className="absolute -top-[22px] -right-[22px] w-11 h-11 bg-black border-[3px] border-white rounded-full flex items-center justify-center hover:bg-gray-900 transition-colors shadow-lg"
          aria-label="Cancelar upload"
        >
          <svg
            width="12"
            height="11"
            viewBox="0 0 12 11"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white"
          >
            <path
              d="M11 1L1 10M1 1L11 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {/* Loading Spinner */}
      <div className="w-[51px] h-[51px] mb-4">
        <svg
          className="animate-spin"
          width="51"
          height="51"
          viewBox="0 0 51 51"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="25.5"
            cy="25.5"
            r="23"
            stroke="#9a9a9a"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="80 100"
          />
        </svg>
      </div>

      {/* Loading Text */}
      <p className="font-inter font-normal text-lg text-[#9a9a9a] text-center">
        {loadingText}
      </p>
    </div>
  );
};
