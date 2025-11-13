import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
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
  ({ className, variant = 'primary', size = 'default', icon, iconPosition = 'right', children, ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2.5 rounded-button-lg font-haas text-button transition-all duration-300 disabled:pointer-events-none disabled:opacity-50',
          // Variant styles
          {
            'bg-gray-dark text-white hover:bg-black hover:scale-[1.02] active:scale-[0.98]': variant === 'primary',
            'bg-sand-light/50 text-black hover:bg-sand-light hover:scale-[1.02] active:scale-[0.98]': variant === 'secondary',
            'bg-transparent text-black hover:bg-gray-light': variant === 'ghost',
            'border border-black bg-transparent text-black hover:bg-black/5 active:scale-[0.98]': variant === 'outline',
          },
          // Size styles
          {
            'h-button px-4': size === 'default',
            'h-10 px-3 text-sm': size === 'sm',
            'h-14 px-6 text-lg': size === 'lg',
          },
          // Icon positioning
          icon && (iconPosition === 'left' ? 'flex-row' : 'flex-row-reverse justify-between'),
          className
        )}
        ref={ref}
        {...props}
      >
        {icon && iconPosition === 'left' && icon}
        {children}
        {icon && iconPosition === 'right' && icon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
