import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface LogoProps {
  variant?: 'default' | 'extended' | 'header';
  className?: string;
  width?: number;
  height?: number;
}

const logoConfig = {
  default: {
    src: '/assets/images/logo.svg',
    width: 190,
    height: 90,
    alt: 'Fotomodel',
  },
  extended: {
    src: '/assets/images/logo-extended.svg',
    width: 176,
    height: 32,
    alt: 'Fotomodel',
  },
  header: {
    src: '/assets/images/logo-header.png',
    width: 511,
    height: 93,
    alt: 'Fotomodel',
  },
} as const;

export const Logo: React.FC<LogoProps> = ({
  variant = 'default',
  className,
  width,
  height,
}) => {
  const config = logoConfig[variant];

  return (
    <Image
      src={config.src}
      alt={config.alt}
      width={width || config.width}
      height={height || config.height}
      className={cn('h-auto w-auto', className)}
      priority
    />
  );
};
