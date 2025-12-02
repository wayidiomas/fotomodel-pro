'use client';

import * as React from 'react';

interface ExpressionIconProps {
  className?: string;
}

export const SmilingIcon: React.FC<ExpressionIconProps> = ({ className = '' }) => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Face circle */}
    <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" fill="none" />
    {/* Left eye */}
    <circle cx="14" cy="16" r="2" fill="currentColor" />
    {/* Right eye */}
    <circle cx="26" cy="16" r="2" fill="currentColor" />
    {/* Smile */}
    <path
      d="M12 24C13.5 27 16.5 28.5 20 28.5C23.5 28.5 26.5 27 28 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

export const SeriousIcon: React.FC<ExpressionIconProps> = ({ className = '' }) => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Face circle */}
    <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" fill="none" />
    {/* Left eye */}
    <circle cx="14" cy="16" r="2" fill="currentColor" />
    {/* Right eye */}
    <circle cx="26" cy="16" r="2" fill="currentColor" />
    {/* Neutral mouth */}
    <line
      x1="12"
      y1="25"
      x2="28"
      y2="25"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const ConfidentIcon: React.FC<ExpressionIconProps> = ({ className = '' }) => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Face circle */}
    <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" fill="none" />
    {/* Left eyebrow - angled */}
    <path d="M11 14L16 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Right eyebrow - angled */}
    <path d="M29 14L24 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Left eye */}
    <circle cx="14" cy="17" r="2" fill="currentColor" />
    {/* Right eye */}
    <circle cx="26" cy="17" r="2" fill="currentColor" />
    {/* Slight smile */}
    <path
      d="M14 25C15.5 26.5 17.5 27 20 27C22.5 27 24.5 26.5 26 25"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

export const ThoughtfulIcon: React.FC<ExpressionIconProps> = ({ className = '' }) => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Face circle */}
    <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" fill="none" />
    {/* Left eyebrow - slightly raised */}
    <path d="M11 13L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Right eyebrow - slightly raised */}
    <path d="M29 13L24 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Left eye - looking up */}
    <circle cx="14" cy="16" r="1.5" fill="currentColor" />
    {/* Right eye - looking up */}
    <circle cx="26" cy="16" r="1.5" fill="currentColor" />
    {/* Thoughtful mouth */}
    <path
      d="M14 25C16 24 18 24 20 24C22 24 24 24 26 25"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    {/* Hand/chin indicator */}
    <path
      d="M10 28L12 30"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const RelaxedIcon: React.FC<ExpressionIconProps> = ({ className = '' }) => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Face circle */}
    <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" fill="none" />
    {/* Left eyebrow - relaxed curve */}
    <path d="M11 14C12 13.5 14 13.5 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Right eyebrow - relaxed curve */}
    <path d="M29 14C28 13.5 26 13.5 24 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Left eye - closed/relaxed */}
    <path d="M12 17C13 17.5 14.5 17.5 16 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Right eye - closed/relaxed */}
    <path d="M24 17C25.5 17.5 27 17.5 28 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Gentle smile */}
    <path
      d="M13 24C15 26 17.5 26.5 20 26.5C22.5 26.5 25 26 27 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

export const ElegantIcon: React.FC<ExpressionIconProps> = ({ className = '' }) => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Face circle */}
    <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" fill="none" />
    {/* Left eyebrow - elegant arch */}
    <path d="M11 13C12 12 14.5 12 16 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Right eyebrow - elegant arch */}
    <path d="M29 13C28 12 25.5 12 24 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Left eye - sophisticated */}
    <ellipse cx="14" cy="17" rx="1.5" ry="2" fill="currentColor" />
    {/* Right eye - sophisticated */}
    <ellipse cx="26" cy="17" rx="1.5" ry="2" fill="currentColor" />
    {/* Subtle elegant smile */}
    <path
      d="M14 24C16 25.5 18 26 20 26C22 26 24 25.5 26 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    {/* Elegance accent - small detail */}
    <path
      d="M30 10L32 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// Icon map for easy lookup
export const EXPRESSION_ICONS: Record<string, React.FC<ExpressionIconProps>> = {
  smiling: SmilingIcon,
  serious: SeriousIcon,
  confident: ConfidentIcon,
  thoughtful: ThoughtfulIcon,
  relaxed: RelaxedIcon,
  elegant: ElegantIcon,
};
