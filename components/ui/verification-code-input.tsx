'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface VerificationCodeInputProps {
  length?: number;
  separatorPosition?: number;
  onComplete?: (code: string) => void;
  className?: string;
}

/**
 * VerificationCodeInput component
 * - 6 input boxes with separator after 3rd digit
 * - Auto-focus next box on input
 * - Auto-focus previous on backspace
 * - Support paste (parse and distribute)
 * - Based on Figma design (WhatsApp verification screen)
 */
export const VerificationCodeInput = React.forwardRef<
  HTMLDivElement,
  VerificationCodeInputProps
>(({ length = 6, separatorPosition = 3, onComplete, className }, ref) => {
  const [values, setValues] = React.useState<string[]>(Array(length).fill(''));
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  React.useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Check if code is complete
  React.useEffect(() => {
    const code = values.join('');
    if (code.length === length && onComplete) {
      onComplete(code);
    }
  }, [values, length, onComplete]);

  const handleChange = (index: number, value: string) => {
    // Only accept digits
    if (value && !/^\d+$/.test(value)) return;

    const newValues = [...values];
    newValues[index] = value.slice(0, 1); // Only take first character
    setValues(newValues);

    // Auto-focus next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, ''); // Remove non-digits
    const pastedValues = pastedData.slice(0, length).split('');

    const newValues = [...values];
    pastedValues.forEach((value, idx) => {
      if (idx < length) {
        newValues[idx] = value;
      }
    });
    setValues(newValues);

    // Focus last filled input or last input
    const lastFilledIndex = Math.min(pastedValues.length, length - 1);
    inputRefs.current[lastFilledIndex]?.focus();
  };

  return (
    <div ref={ref} className={cn('flex items-center justify-center gap-2', className)}>
      {Array.from({ length }).map((_, index) => (
        <React.Fragment key={index}>
          {/* Separator after 3rd digit */}
          {index === separatorPosition && (
            <span className="font-inter text-[26px] font-medium text-greyscale-900">-</span>
          )}

          <input
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={values[index]}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={cn(
              'h-[55px] w-[41px] rounded-lg border border-greyscale-200 bg-white text-center font-inter text-[26px] font-medium text-greyscale-900 transition-all',
              'focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20',
              'hover:border-greyscale-400',
              // Wider boxes for odd positions (from Figma: 41-42px alternating)
              index % 2 === 1 && 'w-[42px]'
            )}
          />
        </React.Fragment>
      ))}
    </div>
  );
});

VerificationCodeInput.displayName = 'VerificationCodeInput';
