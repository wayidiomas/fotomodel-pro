'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ChatButtonProps {
  onClick?: () => void;
  className?: string;
}

export const ChatButton: React.FC<ChatButtonProps> = ({
  onClick,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-8 right-8 z-50',
        'w-[84px] h-[84px] rounded-full border border-white/60',
        'bg-white/80 text-[#20202a] backdrop-blur-2xl',
        'flex items-center justify-center',
        'shadow-[0_20px_45px_rgba(15,23,42,0.22)] hover:shadow-[0_25px_55px_rgba(15,23,42,0.3)]',
        'hover:scale-110 active:scale-95',
        'transition-all duration-200',
        className
      )}
      aria-label="Abrir chat de suporte"
    >
      <Image
        src="/assets/icons/ui/chat.svg"
        alt=""
        width={32}
        height={32}
        className="brightness-0 invert"
      />
    </button>
  );
};
