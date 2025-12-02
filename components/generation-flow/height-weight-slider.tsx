'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';

interface HeightWeightSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit: string;
  className?: string;
  description?: string;
}

/**
 * Slider component for selecting height or weight
 * Similar styling to the age filter component
 */
export function HeightWeightSlider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  className,
  description,
}: HeightWeightSliderProps) {
  const [internalValue, setInternalValue] = React.useState(value);

  // Sync internal value with prop value
  React.useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleValueChange = (newValue: number[]) => {
    setInternalValue(newValue[0]);
  };

  const handleValueCommit = (newValue: number[]) => {
    onChange(newValue[0]);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Label and value display */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-900">
          {label}
        </label>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold text-[#20202a]">
            {internalValue}
          </span>
          <span className="text-sm font-medium text-gray-500">
            {unit}
          </span>
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-gray-500">
          {description}
        </p>
      )}

      {/* Slider */}
      <SliderPrimitive.Root
        className={cn(
          'relative flex w-full touch-none select-none items-center',
          'h-6'
        )}
        value={[internalValue]}
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
        min={min}
        max={max}
        step={step}
        aria-label={label}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200">
          <SliderPrimitive.Range className="absolute h-full bg-[#20202a]" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={cn(
            'block h-5 w-5 rounded-full border-2 border-[#20202a] bg-white',
            'shadow-md ring-offset-background transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20202a] focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50',
            'hover:scale-110 active:scale-95'
          )}
        />
      </SliderPrimitive.Root>

      {/* Min/Max labels */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

interface HeightSliderProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

/**
 * Pre-configured height slider (60-220 cm)
 */
export function HeightSlider({ value, onChange, className }: HeightSliderProps) {
  return (
    <HeightWeightSlider
      label="Altura da Modelo"
      value={value}
      onChange={onChange}
      min={60}
      max={220}
      step={1}
      unit="cm"
      description="Defina a altura desejada para a modelo virtual"
      className={className}
    />
  );
}

interface WeightSliderProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

/**
 * Pre-configured weight slider (10-150 kg)
 */
export function WeightSlider({ value, onChange, className }: WeightSliderProps) {
  return (
    <HeightWeightSlider
      label="Peso da Modelo"
      value={value}
      onChange={onChange}
      min={10}
      max={150}
      step={1}
      unit="kg"
      description="Defina o peso desejado para a modelo virtual"
      className={className}
    />
  );
}
