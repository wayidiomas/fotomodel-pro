'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Camera } from 'lucide-react';
import type { GarmentType } from '@/lib/generation-flow/upload-types';

// Re-export GarmentType for convenience
export type { GarmentType };

interface TabSwitcherProps {
  activeTab: GarmentType;
  onTabChange: (tab: GarmentType) => void;
  className?: string;
}

export const TabSwitcher: React.FC<TabSwitcherProps> = ({
  activeTab,
  onTabChange,
  className,
}) => {
  return (
    <div
      className={cn(
        'inline-flex bg-slate-100 rounded-[6px] p-1 gap-1',
        className
      )}
    >
      <button
        onClick={() => onTabChange('single')}
        className={cn(
          'px-4 py-2 rounded-[6px] font-inter font-medium text-sm leading-5',
          'transition-all duration-200 flex items-center gap-2',
          activeTab === 'single'
            ? 'bg-white text-[#111827] shadow-sm'
            : 'bg-transparent text-[#64748b] hover:text-[#111827]'
        )}
      >
        <Camera className="h-5 w-5" />
        Peça única
      </button>
      <button
        onClick={() => onTabChange('outfit')}
        className={cn(
          'px-4 py-2 rounded-[6px] font-inter font-medium text-sm leading-5',
          'transition-all duration-200 flex items-center gap-2',
          activeTab === 'outfit'
            ? 'bg-white text-[#111827] shadow-sm'
            : 'bg-transparent text-[#64748b] hover:text-[#111827]'
        )}
      >
        <Camera className="h-5 w-5" />
        Conjunto
      </button>
    </div>
  );
};
