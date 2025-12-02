'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

export const Tooltip: React.FC<TooltipProps> = ({ content, children, className }) => {
  const [visible, setVisible] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLSpanElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (!visible) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      const tooltip = tooltipRef.current;
      if (!trigger || !tooltip) return;

      const triggerRect = trigger.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();

      const spacing = 8;
      let top = triggerRect.top + window.scrollY - tooltipRect.height - spacing;
      let left = triggerRect.left + window.scrollX + triggerRect.width / 2 - tooltipRect.width / 2;

      // Keep tooltip inside viewport horizontally
      const maxLeft = window.scrollX + window.innerWidth - tooltipRect.width - 12;
      const minLeft = window.scrollX + 12;
      left = Math.min(Math.max(left, minLeft), maxLeft);

      setCoords({ top, left });
    };

    updatePosition();

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [visible]);

  const tooltipNode =
    mounted && visible
      ? createPortal(
          <div
            ref={tooltipRef}
            style={{ top: coords.top, left: coords.left }}
            className="pointer-events-none fixed z-50 whitespace-normal rounded-[24px] border border-white/50 bg-white/80 px-5 py-3 text-sm font-medium text-slate-900 shadow-[0_20px_60px_rgba(10,10,15,0.25)] backdrop-blur-2xl w-[clamp(220px,28vw,360px)] text-left leading-relaxed"
          >
            {content}
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-[7px] border-transparent border-t-white/70" />
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <span
        ref={triggerRef}
        className={cn('inline-flex', className)}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
      >
        {children}
      </span>
      {tooltipNode}
    </>
  );
};
