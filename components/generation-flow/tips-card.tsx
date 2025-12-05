'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { CategoryTip } from '@/lib/generation-flow/types';

export type { CategoryTip };

interface TipsCardProps {
  tip: CategoryTip;
  className?: string;
}

export const TipsCard: React.FC<TipsCardProps> = ({ tip, className }) => {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const totalSlides = 3;

  return (
    <div
      className={cn(
        'bg-white border border-gray-100 rounded-2xl p-6',
        'flex flex-col gap-[15px]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 py-0.5">
        <h3 className="font-freight font-medium text-2xl leading-normal text-[#111827]">
          Dicas para melhores resultados
        </h3>
      </div>

      {/* Good Description */}
      <div className="flex flex-col gap-2.5">
        <p className="font-inter font-normal text-sm leading-normal text-center text-[#4b5563] w-full px-2.5">
          {tip.goodDescription}
        </p>
      </div>

      {/* Good Examples Section */}
      <div className="flex gap-[15px] h-[170px] pb-2 relative">
        <div className="grid grid-cols-3 gap-[15px]">
          {tip.goodExamples.slice(0, 3).map((imageSrc, index) => (
            <div key={index} className="relative w-[94px] h-[126px]">
              <div className="relative w-full h-full rounded-lg overflow-hidden">
                <Image
                  src={imageSrc}
                  alt={`Exemplo bom ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              {/* Checkmark Overlay */}
              <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-[30px] h-[30px] rounded-full bg-[#29c115] border border-white shadow-md flex items-center justify-center">
                <Image
                  src="/assets/icons/ui/check-circle.svg"
                  alt=""
                  width={14}
                  height={13}
                  className="brightness-0 invert"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What to Avoid Section */}
      <div className="flex flex-col gap-2.5">
        <h4 className="font-inter font-bold text-lg leading-normal text-[#111827]">
          {tip.avoidTitle}
        </h4>
        <div className="flex flex-col gap-2.5 items-center p-2.5">
          <div className="font-inter font-normal text-sm leading-normal text-[#4b5563] w-full">
            <p className="mb-0">Não é compatível com:</p>
            {tip.avoidItems.map((item, index) => (
              <p key={index} className="mb-0 whitespace-pre-wrap">
                • {item}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Bad Examples Section */}
      <div className="flex gap-[15px] h-[170px] pb-6 relative">
        <div className="grid grid-cols-3 gap-[15px]">
          {tip.badExamples.slice(0, 3).map((imageSrc, index) => (
            <div key={index} className="relative w-[94px] h-[126px]">
              <div className="relative w-full h-full rounded-lg overflow-hidden">
                <Image
                  src={imageSrc}
                  alt={`Exemplo ruim ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              {/* Cross Overlay */}
              <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-[30px] h-[30px] rounded-full bg-[#c11515] border border-white shadow-md flex items-center justify-center">
                <Image
                  src="/assets/icons/ui/cross-circle.svg"
                  alt=""
                  width={13}
                  height={11}
                  className="brightness-0 invert"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Carousel Dots */}
      <div className="flex items-center justify-center gap-1.5">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={cn(
              'w-[7px] h-[7px] rounded-full transition-colors',
              index === currentSlide
                ? 'bg-[#858180]'
                : 'bg-[rgba(133,129,128,0.17)]'
            )}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
