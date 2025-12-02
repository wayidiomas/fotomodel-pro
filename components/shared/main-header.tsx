import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface MainHeaderProps {
  currentPage?: 'dashboard' | 'criar' | 'vestuario' | 'galeria' | 'modelos' | 'historico' | 'chat';
  credits?: number;
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  currentPage,
  credits = 0,
}) => {
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', key: 'dashboard' as const },
    { href: '/criar', label: 'Criar', key: 'criar' as const },
    { href: '/chat', label: 'Chat', key: 'chat' as const, badge: 'BETA' },
    { href: '/vestuario', label: 'Vestuário', key: 'vestuario' as const },
    { href: '/galeria', label: 'Galeria', key: 'galeria' as const },
    { href: '/modelos', label: 'Modelos', key: 'modelos' as const },
    { href: '/historico', label: 'Histórico', key: 'historico' as const },
  ];

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="px-8 h-16 flex items-center justify-between">
        {/* Left side: Logo + Navigation */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link href="/dashboard" className="w-[175.53px] h-8">
            <Image
              src="/assets/images/logo-header.png"
              alt="Fotomodel Logo"
              width={176}
              height={32}
              className="object-contain"
            />
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-4 overflow-x-auto scrollbar-hide max-w-[calc(100vw-600px)]">
            {navItems.map((item) => {
              const isActive = currentPage === item.key;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap",
                    isActive
                      ? "bg-[#f1f1f1] text-[#20202a]"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {item.label}
                  {'badge' in item && item.badge && (
                    <span className="ml-1 inline-flex items-center rounded-full border border-[#e6dcc5] bg-[#f4f0e7] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4b3f2f] shadow-inner">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side: Credits + Actions */}
        <div className="flex items-center gap-2">
          {/* Credits Badge */}
          <div className="border border-slate-200 rounded-full px-3 py-1">
            <span className="font-inter font-semibold text-sm text-[#020817]">
              {credits} créditos
            </span>
          </div>

          {/* Recharge Button */}
          <button className="ml-2 bg-white border border-slate-200 rounded-md px-3.5 py-2 flex items-center gap-2 h-9 hover:bg-gray-50 transition-colors">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 8C12 10.21 10.21 12 8 12C5.79 12 4 10.21 4 8C4 5.79 5.79 4 8 4C10.21 4 12 5.79 12 8Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-inter font-medium text-sm text-[#020817]">
              Recarregar
            </span>
          </button>

          {/* Menu Button */}
          <button
            className="ml-4 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
            aria-label="Menu"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="8" cy="3" r="1.5" fill="currentColor" />
              <circle cx="8" cy="8" r="1.5" fill="currentColor" />
              <circle cx="8" cy="13" r="1.5" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};
