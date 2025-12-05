'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContentCarouselItem, CarouselItem } from './content-carousel-item';

interface ContentCarouselProps {
  title: string;
  items: CarouselItem[];
  viewAllHref: string;
  onItemClick?: (item: CarouselItem) => void;
  emptyMessage?: string;
  emptyDescription?: string;
  className?: string;
}

export function ContentCarousel({
  title,
  items,
  viewAllHref,
  onItemClick,
  emptyMessage = 'Nenhum item ainda',
  emptyDescription = 'Seus itens aparecerão aqui',
  className,
}: ContentCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const checkScrollButtons = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScrollButtons);
      }
      window.removeEventListener('resize', checkScrollButtons);
    };
  }, [checkScrollButtons, items]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  const hasItems = items.length > 0;

  return (
    <section className={cn('relative', className)}>
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <h2 className="font-freight text-2xl font-medium text-black md:text-3xl">{title}</h2>
        {hasItems && (
          <Link
            href={viewAllHref === '/wardrobe' ? '/vestuario' : viewAllHref}
            className="group flex items-center gap-1 font-inter text-sm font-medium text-gray-500 transition-colors hover:text-black"
          >
            Ver tudo
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      {/* Carousel Container */}
      <div
        className="group relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {hasItems ? (
          <>
            {/* Scroll Container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {items.map((item) => (
                <ContentCarouselItem
                  key={item.id}
                  item={item}
                  onClick={() => onItemClick?.(item)}
                />
              ))}
            </div>

            {/* Left Arrow */}
            <button
              onClick={() => scroll('left')}
              className={cn(
                'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4',
                'flex h-12 w-12 items-center justify-center',
                'rounded-full bg-white shadow-xl border border-gray-100',
                'transition-all duration-200 z-10',
                'hover:scale-110 hover:bg-gray-50',
                canScrollLeft && isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
              )}
              aria-label="Rolar para esquerda"
            >
              <ChevronLeft className="h-6 w-6 text-black" />
            </button>

            {/* Right Arrow */}
            <button
              onClick={() => scroll('right')}
              className={cn(
                'absolute right-0 top-1/2 -translate-y-1/2 translate-x-4',
                'flex h-12 w-12 items-center justify-center',
                'rounded-full bg-white shadow-xl border border-gray-100',
                'transition-all duration-200 z-10',
                'hover:scale-110 hover:bg-gray-50',
                canScrollRight && isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
              )}
              aria-label="Rolar para direita"
            >
              <ChevronRight className="h-6 w-6 text-black" />
            </button>

            {/* Gradient Overlays for scroll indication */}
            <div
              className={cn(
                'absolute left-0 top-0 bottom-4 w-24 bg-gradient-to-r from-[#f5f4f0] to-transparent pointer-events-none transition-opacity duration-300',
                canScrollLeft ? 'opacity-100' : 'opacity-0'
              )}
            />
            <div
              className={cn(
                'absolute right-0 top-0 bottom-4 w-24 bg-gradient-to-l from-[#f5f4f0] to-transparent pointer-events-none transition-opacity duration-300',
                canScrollRight ? 'opacity-100' : 'opacity-0'
              )}
            />
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-16 text-center transition-colors hover:bg-gray-50">
            <p className="font-inter text-base font-medium text-gray-900">
              {emptyMessage}
            </p>
            <p className="mt-1 font-inter text-sm text-gray-500">
              {emptyDescription}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
