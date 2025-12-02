import React from 'react';
import { cn } from '@/lib/utils';

interface NavigationArrowProps {
  direction: 'left' | 'right';
  className?: string;
  size?: number;
}

/**
 * Custom SVG arrow icon for navigation buttons
 * Optimized for better legibility and visual contrast
 */
export function NavigationArrow({
  direction,
  className,
  size = 20,
}: NavigationArrowProps) {
  if (direction === 'left') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('transition-transform', className)}
        aria-hidden="true"
      >
        {/* Back Arrow - Bold chevron pointing left */}
        <path
          d="M15 18L9 12L15 6"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('transition-transform', className)}
      aria-hidden="true"
    >
      {/* Forward Arrow - Bold chevron pointing right */}
      <path
        d="M9 18L15 12L9 6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface NavigationButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  direction: 'left' | 'right';
  children: React.ReactNode;
  variant?: 'default' | 'ghost';
}

/**
 * Navigation button component with improved styling and accessibility
 * Fixes the "white on white" issue for back button
 */
export function NavigationButton({
  direction,
  children,
  variant = 'default',
  className,
  disabled,
  ...props
}: NavigationButtonProps) {
  const isBack = direction === 'left';

  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        // Base styles
        'inline-flex items-center gap-2 px-6 py-3 rounded-lg',
        'text-sm font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',

        // Variant: Default (solid background)
        variant === 'default' && [
          // Back button (left) - Dark gray with good contrast
          isBack && [
            'bg-gray-700 text-white border border-gray-600',
            'hover:bg-gray-600 active:bg-gray-800',
            'focus:ring-gray-500',
            'shadow-sm hover:shadow-md',
          ],
          // Forward button (right) - Primary black
          !isBack && [
            'bg-[#20202a] text-white',
            'hover:bg-[#2a2a36] active:bg-[#1a1a22]',
            'focus:ring-[#20202a]',
            'shadow-sm hover:shadow-md',
          ],
        ],

        // Variant: Ghost (transparent with border)
        variant === 'ghost' && [
          'bg-transparent border',
          isBack && [
            'border-gray-600 text-gray-700',
            'hover:bg-gray-100 hover:border-gray-700',
            'focus:ring-gray-500',
          ],
          !isBack && [
            'border-gray-300 text-gray-900',
            'hover:bg-gray-50 hover:border-gray-400',
            'focus:ring-gray-400',
          ],
        ],

        // Disabled state
        disabled && [
          'opacity-50 cursor-not-allowed',
          'hover:shadow-none active:transform-none',
        ],

        className
      )}
      {...props}
    >
      {/* Back button: arrow before text */}
      {isBack && (
        <NavigationArrow
          direction="left"
          size={18}
          className="group-hover:-translate-x-0.5"
        />
      )}

      <span>{children}</span>

      {/* Forward button: arrow after text */}
      {!isBack && (
        <NavigationArrow
          direction="right"
          size={18}
          className="group-hover:translate-x-0.5"
        />
      )}
    </button>
  );
}
