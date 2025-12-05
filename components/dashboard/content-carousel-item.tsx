'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from 'lucide-react';

export type CarouselItemType = 'upload' | 'model' | 'download';

export interface CarouselItem {
  id: string;
  type: CarouselItemType;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

interface ContentCarouselItemProps {
  item: CarouselItem;
  onClick?: () => void;
  className?: string;
}

export function ContentCarouselItem({
  item,
  onClick,
  className,
}: ContentCarouselItemProps) {
  const relativeTime = formatDistanceToNow(new Date(item.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex-shrink-0 cursor-pointer',
        'w-[260px] overflow-hidden rounded-[24px]',
        'border border-white/40 bg-white/60 backdrop-blur',
        'transition-all duration-300',
        'hover:scale-[1.02] hover:-translate-y-1',
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <Image
          src={item.imageUrl}
          alt={item.title || 'Item'}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="260px"
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Hover Actions */}
        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button className="w-full px-4 py-2.5 bg-white/20 backdrop-blur border border-white/40 text-white rounded-xl font-inter font-semibold text-sm hover:bg-white/30 transition-colors">
            Ver detalhes
          </button>
        </div>

        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <TypeBadge type={item.type} />
        </div>
      </div>

      {/* Bottom Info */}
      <div className="p-4 bg-white/60 backdrop-blur-sm">
        {item.title && (
          <h3 className="font-inter font-semibold text-sm text-gray-900 mb-1 line-clamp-1">
            {item.title}
          </h3>
        )}
        {item.subtitle && (
          <p className="font-inter text-xs text-gray-500 mb-3 line-clamp-1">
            {item.subtitle}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>{relativeTime}</span>
        </div>
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: CarouselItemType }) {
  const labels = {
    upload: 'Peça',
    model: 'Modelo',
    download: 'Download',
  };

  return (
    <span className="rounded-full border border-white/40 bg-black/30 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
      {labels[type]}
    </span>
  );
}
