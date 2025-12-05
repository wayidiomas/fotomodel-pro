'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { OnboardingProgress } from '../_components/OnboardingProgress';

const dots = [0, 1, 2];

export default function OnboardingLoadingPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 1400);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#0b0f1c] via-[#0c1020] to-[#0c1428] text-white">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_32%),radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.05),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.06),transparent_36%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[620px] rounded-[28px] border border-white/10 bg-white/10 p-10 shadow-[0_30px_110px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
      >
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between text-[12px] font-semibold uppercase tracking-[0.14em] text-white/70">
            <span>Preparando seu painel</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80">Carregando</span>
          </div>

          <OnboardingProgress currentStep={2} totalSteps={3} />

          <div className="space-y-3 text-left">
            <h1 className="font-haas text-[30px] font-semibold leading-tight tracking-tight">Quase lá…</h1>
            <p className="font-inter text-[17px] text-white/80">
              Estamos montando seu dashboard com suas peças, modelos e downloads recentes.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-white/70">
            {dots.map((dot) => (
              <motion.div
                key={dot}
                className="h-2.5 w-2.5 rounded-full bg-white"
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: dot * 0.18 }}
              />
            ))}
            <span className="ml-2 font-inter">Sincronizando preferências</span>
          </div>

          <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="absolute inset-y-0 left-0 h-full rounded-full bg-gradient-to-r from-white via-white/80 to-white/40"
              initial={{ width: '0%' }}
              animate={{ width: ['0%', '72%', '100%'] }}
              transition={{ duration: 1.4, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
