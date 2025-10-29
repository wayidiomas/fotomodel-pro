import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/**
 * Input component based on Figma design specifications
 * - Height: 48px (h-12)
 * - Border: 1px solid #f4f4f4
 * - Border radius: 8px
 * - Padding: 16px (px-4)
 * - Font: Neue Haas Grotesk Display Pro
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-body-sm font-medium text-black">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'flex h-12 w-full rounded-input border border-gray-light bg-white px-4 py-2 font-haas text-body-md text-black placeholder:text-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-error focus-visible:ring-error',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-body-sm text-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
