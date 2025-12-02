'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CarouselSection {
  id: string;
  title: string;
  subtitle?: string;
}

interface PersonalizationCarouselProps {
  sections: CarouselSection[];
  currentSection: number;
  onSectionChange: (index: number) => void;
  children: React.ReactNode[];
  className?: string;
}

/**
 * Carousel component for personalization flow
 * Supports horizontal navigation with swipe and keyboard
 */
export function PersonalizationCarousel({
  sections,
  currentSection,
  onSectionChange,
  children,
  className,
}: PersonalizationCarouselProps) {
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null);

  const totalSections = sections.length;

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Handle navigation with animation lock
  const navigate = React.useCallback((newIndex: number) => {
    if (isAnimating || newIndex === currentSection || newIndex < 0 || newIndex >= totalSections) {
      return;
    }

    setIsAnimating(true);
    onSectionChange(newIndex);

    // Unlock after animation completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  }, [isAnimating, currentSection, totalSections, onSectionChange]);

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        navigate(currentSection - 1);
      } else if (e.key === 'ArrowRight') {
        navigate(currentSection + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSection, navigate]);

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      navigate(currentSection + 1);
    } else if (isRightSwipe) {
      navigate(currentSection - 1);
    }
  };

  return (
    <div className={cn('relative w-full', className)}>
      {/* Section Header */}
      <div className="mb-6 text-center">
        <h2 className="font-inter text-xl font-bold text-gray-900 mb-1">
          {sections[currentSection]?.title}
        </h2>
        {sections[currentSection]?.subtitle && (
          <p className="font-inter text-sm text-gray-600">
            {sections[currentSection].subtitle}
          </p>
        )}
      </div>

      {/* Progress Indicators (Dots) */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {sections.map((section, index) => (
          <button
            key={section.id}
            type="button"
            onClick={() => navigate(index)}
            disabled={isAnimating}
            className={cn(
              'transition-all duration-300',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#20202a]/20',
              'rounded-full',
              index === currentSection
                ? 'w-8 h-2 bg-[#20202a]'
                : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
            )}
            aria-label={`Ir para ${section.title}`}
          />
        ))}
      </div>

      {/* Carousel Container */}
      <div
        className="relative overflow-hidden rounded-2xl"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Slides Wrapper */}
        <div
          className={cn(
            'flex transition-transform duration-500 ease-out',
            isAnimating && 'pointer-events-none'
          )}
          style={{
            transform: `translateX(-${currentSection * 100}%)`,
          }}
        >
          {React.Children.map(children, (child, index) => (
            <div
              key={index}
              className="w-full flex-shrink-0 px-2"
              aria-hidden={index !== currentSection}
            >
              <div
                className={cn(
                  'transition-opacity duration-300',
                  index === currentSection ? 'opacity-100' : 'opacity-0'
                )}
              >
                {child}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="flex items-center justify-between mt-8">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => navigate(currentSection - 1)}
          disabled={currentSection === 0 || isAnimating}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'font-inter text-sm font-medium',
            'transition-all duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#20202a]/20',
            currentSection === 0 || isAnimating
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100 active:scale-95'
          )}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Anterior
        </button>

        {/* Section Counter */}
        <span className="font-inter text-sm text-gray-500">
          {currentSection + 1} / {totalSections}
        </span>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => navigate(currentSection + 1)}
          disabled={currentSection === totalSections - 1 || isAnimating}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'font-inter text-sm font-medium',
            'transition-all duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#20202a]/20',
            currentSection === totalSections - 1 || isAnimating
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100 active:scale-95'
          )}
        >
          Próximo
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 12L10 8L6 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
