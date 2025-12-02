'use client';

import * as React from 'react';
import { ModelGender, ModelGenderLabel } from '@/lib/generation-flow/pose-types';

interface GenderFilterProps {
  selectedGenders: ModelGender[];
  onGenderChange: (genders: ModelGender[]) => void;
}

export const GenderFilter: React.FC<GenderFilterProps> = ({
  selectedGenders,
  onGenderChange,
}) => {
  const toggleGender = (gender: ModelGender) => {
    if (selectedGenders.includes(gender)) {
      // Remove gender
      onGenderChange(selectedGenders.filter(g => g !== gender));
    } else {
      // Add gender
      onGenderChange([...selectedGenders, gender]);
    }
  };

  const genderOptions: ModelGender[] = [ModelGender.MALE, ModelGender.FEMALE];

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-inter font-semibold text-sm text-[#111827]">Gênero</h3>
      <div className="flex gap-2">
        {genderOptions.map((gender) => {
          const isSelected = selectedGenders.includes(gender);
          return (
            <button
              key={gender}
              onClick={() => toggleGender(gender)}
              className={`
                px-4 py-2.5 rounded-lg font-inter font-medium text-sm
                transition-all duration-200
                ${
                  isSelected
                    ? 'bg-[#20202a] text-white shadow-[0_2px_8px_rgba(32,32,42,0.12)]'
                    : 'bg-white text-[#6b7280] border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              {ModelGenderLabel[gender]}
            </button>
          );
        })}
      </div>
    </div>
  );
};
