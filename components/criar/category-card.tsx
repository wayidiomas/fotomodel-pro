'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface CategoryImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  rotation?: number;
  inset?: string; // Para ajustes de expansão (ex: "-1.93% -5% -5.44% -5%")
}

export interface CategoryCardProps {
  title: string;
  description: string;
  href: string;
  badge?: string; // Badge text (e.g., "BETA")
  images: {
    superior?: CategoryImage;
    inferior?: CategoryImage;
    arrow?: CategoryImage;
    model?: CategoryImage;
    person?: CategoryImage;
    icon?: CategoryImage; // For special cards (e.g., Chat)
  };
  className?: string;
}

const getImageWrapperStyle = (image: CategoryImage, zIndex: number) => {
  const style: React.CSSProperties = {
    zIndex,
    width: image.width,
    height: image.height,
  };

  if (image.inset) {
    style.inset = image.inset;
    return style;
  }

  if (image.position.top) {
    style.top = image.position.top;
  }
  if (image.position.bottom) {
    style.bottom = image.position.bottom;
  }
  if (image.position.left) {
    style.left = image.position.left;
  }
  if (image.position.right) {
    style.right = image.position.right;
  }

  return style;
};

export const CategoryCard: React.FC<CategoryCardProps> = ({
  title,
  description,
  href,
  badge,
  images,
  className,
}) => {
  return (
    <Link href={href} className="w-full flex justify-center">
      <div
        className={cn(
          'group bg-white border border-gray-100 rounded-[20px] overflow-hidden',
          'hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer',
          'flex flex-col w-full relative',
          className
        )}
      >
        {/* Badge BETA (top right corner) */}
        {badge && (
          <div className="absolute top-4 right-4 z-10 px-2 py-1 bg-[#20202a] text-white text-[10px] font-semibold rounded uppercase tracking-wide">
            {badge}
          </div>
        )}

        {/* Área de Imagens - Margin wrapper com pb-4 (16px) */}
        <div className="pt-0 pb-6 px-0">
          <div className="relative h-[280px] bg-[#eae6de] rounded-[16px] overflow-hidden flex items-center justify-center">
            {/* Roupa Superior */}
            {images.superior && (
              <div
                className="absolute"
                style={getImageWrapperStyle(images.superior, 2)}
              >
                <Image
                  src={images.superior.src}
                  alt={images.superior.alt}
                  width={images.superior.width}
                  height={images.superior.height}
                  className="object-contain"
                />
              </div>
            )}

            {/* Roupa Inferior */}
            {images.inferior && (
              <div
                className="absolute"
                style={getImageWrapperStyle(images.inferior, 1)}
              >
                <Image
                  src={images.inferior.src}
                  alt={images.inferior.alt}
                  width={images.inferior.width}
                  height={images.inferior.height}
                  className="object-contain"
                />
              </div>
            )}

            {/* Pessoa (para categorias "Roupa no Corpo" e "Manequim") */}
            {images.person && (
              <div
                className="absolute"
                style={getImageWrapperStyle(images.person, 3)}
              >
                <Image
                  src={images.person.src}
                  alt={images.person.alt}
                  width={images.person.width}
                  height={images.person.height}
                  className="object-contain"
                />
              </div>
            )}

            {/* Ícone Centralizado (para cards especiais como Chat) */}
            {images.icon && (
              <div
                className="absolute"
                style={getImageWrapperStyle(images.icon, 10)}
              >
                <Image
                  src={images.icon.src}
                  alt={images.icon.alt}
                  width={images.icon.width}
                  height={images.icon.height}
                  className="object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                />
              </div>
            )}

            {/* Seta */}
            {images.arrow && (
              <div
                className="absolute flex items-center justify-center"
                style={{
                  ...getImageWrapperStyle(images.arrow, 4),
                  transform: images.arrow.rotation
                    ? `rotate(${images.arrow.rotation}deg)`
                    : undefined,
                }}
              >
                <Image
                  src={images.arrow.src}
                  alt={images.arrow.alt}
                  width={images.arrow.width}
                  height={images.arrow.height}
                  className="object-contain"
                />
              </div>
            )}

            {/* Modelo */}
            {images.model && (
              <div
                className="absolute"
                style={getImageWrapperStyle(images.model, 5)}
              >
                <Image
                  src={images.model.src}
                  alt={images.model.alt}
                  width={images.model.width}
                  height={images.model.height}
                  className="object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* Conteúdo - padding reduzido conforme Figma */}
        <div className="px-6 pt-2 pb-6 flex flex-col">
          {/* Título */}
          <h3 className="font-freight font-medium text-2xl leading-[32px] tracking-[-0.45px] text-[#020817] mb-2">
            {title}
          </h3>

          {/* Descrição */}
          <p className="font-inter font-normal text-[16px] leading-[24px] text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
};
