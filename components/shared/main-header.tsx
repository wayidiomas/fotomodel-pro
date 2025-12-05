'use client';

import * as React from 'react';
import { useState, useRef, useEffect, useContext } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { SubscriptionModal } from '@/components/subscription/subscription-modal';
import { BuyCreditsModal } from '@/components/subscription/buy-credits-modal';
import { useUserCredits } from '@/lib/hooks/use-queries';

interface MainHeaderProps {
  currentPage?: 'dashboard' | 'criar' | 'vestuario' | 'galeria' | 'modelos' | 'historico' | 'chat' | 'curtidas';
  credits?: number;
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  currentPage,
  credits: propCredits,
}) => {
  // Use React Query for credits with fallback to prop
  const { data: queryCredits } = useUserCredits();
  const credits = queryCredits ?? propCredits ?? 0;
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isBuyCreditsModalOpen, setIsBuyCreditsModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const handleBillingManagement = async () => {
    setIsMenuOpen(false);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's subscription data
      const { data: userData } = await supabase
        .from('users')
        .select('current_plan_id, stripe_customer_id, subscription_plans:current_plan_id(slug)')
        .eq('id', user.id)
        .single();

      // If user has free plan or no Stripe customer ID, show subscription modal
      if (!userData?.stripe_customer_id || (userData.subscription_plans as any)?.slug === 'free') {
        setIsSubscriptionModalOpen(true);
        return;
      }

      // Otherwise, create Stripe billing portal session
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to create portal session');

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error opening billing management:', error);
      setIsSubscriptionModalOpen(true);
    }
  };

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
    <>
      <header className="sticky top-0 z-40 border-b border-white/40 bg-white/55 backdrop-blur-2xl shadow-[0_18px_60px_rgba(12,18,38,0.08)]">
        <div className="relative flex h-16 items-center gap-6 px-5 sm:px-8">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/30 via-white/55 to-white/30" />

          {/* Logo */}
          <Link href="/dashboard" className="relative z-10 h-8 w-[175.53px] flex-shrink-0">
            <Image
              src="/assets/images/logo-header.png"
              alt="Fotomodel Logo"
              width={176}
              height={32}
              className="object-contain"
            />
          </Link>

          {/* Navigation centered */}
          <nav className="relative z-10 flex flex-1 items-center justify-center gap-2 overflow-x-auto px-4 scrollbar-hide">
            {navItems.map((item) => {
              const isActive = currentPage === item.key;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-2xl px-3.5 py-2 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-white/85 text-[#111827]"
                      : "text-gray-600 hover:bg-white/70 hover:text-[#0f172a]"
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

          {/* Right side: Credits + Actions */}
          <div className="relative z-10 flex flex-shrink-0 items-center gap-2">
            <div className="rounded-full border border-white/50 bg-white/75 px-3 py-1 shadow-[0_10px_30px_rgba(0,0,0,0.12)] backdrop-blur-2xl ring-1 ring-white/40">
              <span className="font-inter font-semibold text-sm text-[#020817]">
                {credits} créditos
              </span>
            </div>

            <button
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="ml-2 flex h-9 items-center gap-2 rounded-xl border border-[#e7dcc2]/80 bg-gradient-to-r from-[#dbcba1] via-[#c6a972] to-[#b08c4a] px-3.5 py-2 text-white shadow-[0_10px_26px_rgba(142,110,52,0.28)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(142,110,52,0.34)]"
            >
              <CreditCard size={18} strokeWidth={2.2} className="drop-shadow-sm" />
              <span className="font-inter font-semibold text-sm tracking-tight">
                Recarregar
              </span>
            </button>

            <div className="relative" ref={menuRef}>
              <button
                className="ml-4 rounded-xl border border-white/60 bg-white/80 px-3 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.1)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(0,0,0,0.14)]"
                aria-label="Menu"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
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

              {isMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-white/70 bg-white/95 py-1 shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur-2xl ring-1 ring-white/60">
                  <Link
                    href="/perfil"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    Ver perfil
                  </Link>

                  <Link
                    href="/creditos/historico"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    Histórico de gastos
                  </Link>

                  <Link
                    href="/curtidas"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 0 1 8 4a3.5 3.5 0 0 1 5.5 3c0 3.5-5.5 7-5.5 7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Minhas curtidas
                  </Link>

                  <button
                    onClick={handleBillingManagement}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M2 7h12M5 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    Gestão de cobranças
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsBuyCreditsModalOpen(true);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 1.333a6.667 6.667 0 1 0 0 13.334 6.667 6.667 0 0 0 0-13.334zM8 13.333a5.333 5.333 0 1 1 0-10.666 5.333 5.333 0 0 1 0 10.666z" fill="currentColor" />
                      <path d="M8 4v4l2.667 2.667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Compra créditos extras
                  </button>

                  <div className="my-1 border-t border-slate-200" />

                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 14H3.333A1.333 1.333 0 0 1 2 12.667V3.333A1.333 1.333 0 0 1 3.333 2H6M10.667 11.333 14 8l-3.333-3.333M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {isLoggingOut ? 'Saindo...' : 'Sair'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
      />

      <BuyCreditsModal
        isOpen={isBuyCreditsModalOpen}
        onClose={() => setIsBuyCreditsModalOpen(false)}
      />
    </>
  );
};
