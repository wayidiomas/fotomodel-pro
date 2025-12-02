'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ProfessionalTipsCardProps {
  className?: string;
}

const professionalTips = [
  'Use iluminação natural sempre que possível',
  'Tire fotos em alta resolução (mínimo 1080p)',
  'Certifique-se de que a peça está bem esticada',
  'Evite sombras e reflexos na foto',
  'Use um fundo neutro e liso',
];

export const ProfessionalTipsCard: React.FC<ProfessionalTipsCardProps> = ({
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-[#eff6ff] border border-[#bfdbfe] rounded-2xl p-6',
        'flex flex-col gap-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-[#3b82f6] flex items-center justify-center">
          <Image
            src="/assets/icons/ui/info-circle.svg"
            alt=""
            width={14}
            height={14}
            className="brightness-0 invert"
          />
        </div>
        <h3 className="font-inter font-bold text-xl leading-normal text-[#1e3a8a]">
          Dicas Profissionais
        </h3>
      </div>

      {/* Tips List */}
      <ul className="flex flex-col gap-2.5">
        {professionalTips.map((tip, index) => (
          <li
            key={index}
            className="flex items-start gap-2 font-inter font-normal text-sm leading-5 text-[#1e40af]"
          >
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#3b82f6] flex-shrink-0" />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
