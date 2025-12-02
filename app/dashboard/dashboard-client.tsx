'use client';

import { useState, useEffect } from 'react';

/**
 * Client-side component for countdown timer
 * Used in "Somente para você" section
 */
export function DashboardClient() {
  const [timeRemaining, setTimeRemaining] = useState({ hours: 2, minutes: 15, seconds: 30 });

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        }
        if (prev.minutes > 0) {
          return { hours: prev.hours, minutes: prev.minutes - 1, seconds: 59 };
        }
        if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="font-inter text-base font-light text-black">Renova em:</span>
      <div className="flex items-center gap-1">
        <div className="flex items-center justify-center rounded-sm bg-[#e5ded6] px-2 py-1.5">
          <span className="font-inter text-base text-[#744d2e]">
            {String(timeRemaining.hours).padStart(2, '0')}
          </span>
        </div>
        <span className="font-inter text-xs text-black">:</span>
        <div className="flex items-center justify-center rounded-sm bg-[#e5ded6] px-2 py-1.5">
          <span className="font-inter text-base text-[#744d2e]">
            {String(timeRemaining.minutes).padStart(2, '0')}
          </span>
        </div>
        <span className="font-inter text-xs text-black">:</span>
        <div className="flex items-center justify-center rounded-sm bg-[#e5ded6] px-2 py-1.5">
          <span className="font-inter text-base text-[#744d2e]">
            {String(timeRemaining.seconds).padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  );
}
