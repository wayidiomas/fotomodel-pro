'use client';

import * as React from 'react';

interface AgeFilterProps {
  ageMin: number;
  ageMax: number;
  onAgeChange: (min: number, max: number) => void;
}

const AGE_MIN = 1;
const AGE_MAX = 80;

export const AgeFilter: React.FC<AgeFilterProps> = ({
  ageMin,
  ageMax,
  onAgeChange,
}) => {
  const [localMin, setLocalMin] = React.useState(ageMin);
  const [localMax, setLocalMax] = React.useState(ageMax);

  // Update local state when props change
  React.useEffect(() => {
    setLocalMin(ageMin);
    setLocalMax(ageMax);
  }, [ageMin, ageMax]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setLocalMin(value);
    if (value <= localMax) {
      onAgeChange(value, localMax);
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setLocalMax(value);
    if (value >= localMin) {
      onAgeChange(localMin, value);
    }
  };

  // Calculate percentage for visual slider track
  const minPercent = ((localMin - AGE_MIN) / (AGE_MAX - AGE_MIN)) * 100;
  const maxPercent = ((localMax - AGE_MIN) / (AGE_MAX - AGE_MIN)) * 100;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-inter font-semibold text-sm text-[#111827]">Idade</h3>
        <span className="font-inter font-medium text-sm text-[#6b7280]">
          {localMin} - {localMax} anos
        </span>
      </div>

      <div className="relative pt-2 pb-4">
        {/* Slider track background */}
        <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-gray-200 rounded-full -translate-y-1/2" />

        {/* Active range highlight */}
        <div
          className="absolute top-1/2 h-1.5 bg-[#20202a] rounded-full -translate-y-1/2"
          style={{
            left: `${minPercent}%`,
            right: `${100 - maxPercent}%`,
          }}
        />

        {/* Min range input */}
        <input
          type="range"
          min={AGE_MIN}
          max={AGE_MAX}
          value={localMin}
          onChange={handleMinChange}
          className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#20202a] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#20202a] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:shadow-md top-1/2 -translate-y-1/2"
        />

        {/* Max range input */}
        <input
          type="range"
          min={AGE_MIN}
          max={AGE_MAX}
          value={localMax}
          onChange={handleMaxChange}
          className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#20202a] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#20202a] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:shadow-md top-1/2 -translate-y-1/2"
        />
      </div>

      {/* Age range labels */}
      <div className="flex justify-between text-xs text-gray-500 font-inter">
        <span>{AGE_MIN}</span>
        <span>{AGE_MAX}</span>
      </div>
    </div>
  );
};
