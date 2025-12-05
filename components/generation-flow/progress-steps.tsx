'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { NavigationButton } from '@/components/shared/navigation-arrow';

interface ProgressStep {
  number: 1 | 2 | 3 | 4 | 5;
  label: string;
}

const steps: ProgressStep[] = [
  { number: 1, label: 'Selecionar Roupa' },
  { number: 2, label: 'Categorização' },
  { number: 3, label: 'Selecionar Poses' },
  { number: 4, label: 'Personalização' },
  { number: 5, label: 'Resultados' },
];

interface ProgressStepsProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
  onNext?: () => void;
  onBack?: () => void;
  canProceed?: boolean;
  isLoading?: boolean;
  className?: string;
  extraActions?: React.ReactNode;
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({
  currentStep,
  onNext,
  onBack,
  canProceed = false,
  isLoading = false,
  className,
  extraActions,
}) => {
  return (
    <div
      className={cn(
        'bg-white border-b border-gray-100 h-16 flex items-center justify-between px-8',
        className
      )}
    >
      {/* Steps Indicators */}
      <div className="flex items-center gap-4">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center gap-2">
            {/* Step Circle */}
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  step.number <= currentStep
                    ? 'bg-[#20202a]'
                    : 'bg-[#d1d5db]'
                )}
              >
                <span className="text-white font-inter font-semibold text-sm">
                  {step.number}
                </span>
              </div>

              {/* Step Label */}
              <span
                className={cn(
                  'font-freight font-medium text-lg leading-tight whitespace-nowrap',
                  step.number <= currentStep
                    ? 'text-[#111827]'
                    : 'text-[#9ca3af]'
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line (not on last step) */}
            {index < steps.length - 1 && (
              <div className="w-8 h-px bg-gray-200" />
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Voltar Button - show only if not on first step */}
        {currentStep > 1 && onBack && (
          <NavigationButton
            direction="left"
            onClick={onBack}
            disabled={isLoading}
            variant="default"
            className={cn(
              'h-11 px-5 rounded-xl font-inter font-semibold text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95',
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
          >
            Voltar
          </NavigationButton>
        )}

        {extraActions}

        {/* Prosseguir Button */}
        {onNext && (
          <NavigationButton
            direction="right"
            onClick={onNext}
            disabled={!canProceed || isLoading}
            variant="default"
            className={cn(
              'h-11 px-5 rounded-xl font-inter font-semibold text-sm',
              canProceed && !isLoading
                ? 'bg-[#20202a] text-white hover:bg-[#2a2a35] active:scale-95'
                : 'bg-[#f3f4f6] text-[#374151] cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              'Prosseguir'
            )}
          </NavigationButton>
        )}
      </div>
    </div>
  );
};
