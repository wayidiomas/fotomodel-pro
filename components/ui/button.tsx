import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  children: React.ReactNode;
}

/**
 * Button component based on Figma design specifications
 * - Primary: Dark background (#2c2c2c), white text
 * - Secondary: Sand background (rgba(229,222,214,0.5)), black text
 * - Height: 52px
 * - Border radius: 14px
 * - Font: Neue Haas Grotesk Display Pro, 16px
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', children, ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2.5 rounded-button-lg font-haas text-button transition-colors disabled:pointer-events-none disabled:opacity-50',
          // Variant styles
          {
            'bg-gray-dark text-white hover:bg-black': variant === 'primary',
            'bg-sand-light/50 text-black hover:bg-sand-light': variant === 'secondary',
            'bg-transparent text-black hover:bg-gray-light': variant === 'ghost',
          },
          // Size styles
          {
            'h-button px-4': size === 'default',
            'h-10 px-3 text-sm': size === 'sm',
            'h-14 px-6 text-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
