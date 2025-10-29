'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

/**
 * Login page - Tela de Boas-Vindas
 * Design baseado no Figma (node-id: 286:1666)
 */
export default function LoginPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(true); // Começa como mobile para evitar flash

  // Detect mobile/tablet
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      console.log('📱 isMobile:', mobile, '| window.innerWidth:', window.innerWidth);
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Parallax effect desktop
  useEffect(() => {
    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMobile]);

  // Slideshow mobile
  useEffect(() => {
    if (!isMobile) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev === 0 ? 1 : 0));
    }, 5000);

    return () => clearInterval(interval);
  }, [isMobile]);

  return (
    <div className="relative flex min-h-screen items-end justify-center overflow-hidden bg-white lg:items-center">
      {/* TESTE: img nativa para debug */}
      <img
        src="/assets/images/background-yoga-1.png"
        alt="test"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100px',
          height: '100px',
          zIndex: 9999,
          border: '5px solid red'
        }}
      />

      {/* Parallax Background with Yoga Images */}
      <div className="absolute inset-0 -z-10">
        <div className="relative h-full w-full">
          {/* Mobile: Slideshow entre yoga-1 e yoga-2 */}
          {isMobile ? (
            <>
              {/* Yoga Image 1 */}
              <div
                className="absolute inset-0 transition-opacity duration-1000"
                style={{ opacity: currentImageIndex === 0 ? 1 : 0 }}
              >
                <Image
                  src="/assets/images/background-yoga-1.png"
                  alt="Yoga model background 1"
                  fill
                  className="object-cover object-center"
                  priority
                  unoptimized
                />
              </div>

              {/* Yoga Image 2 */}
              <div
                className="absolute inset-0 transition-opacity duration-1000"
                style={{ opacity: currentImageIndex === 1 ? 1 : 0 }}
              >
                <Image
                  src="/assets/images/background-yoga-2.png"
                  alt="Yoga model background 2"
                  fill
                  className="object-cover object-center"
                  priority
                  unoptimized
                />
              </div>
            </>
          ) : (
            <>
              {/* Layer 1: Background (yoga-1) - movimento menor */}
              <div
                className="absolute inset-0 transition-transform duration-200 ease-out will-change-transform"
                style={{
                  transform: `translate3d(${mousePosition.x * 10}px, ${mousePosition.y * 10}px, 0) scale(1.1)`,
                }}
              >
                <Image
                  src="/assets/images/background-yoga-1.png"
                  alt="Parallax background layer"
                  fill
                  className="object-cover object-center opacity-70"
                  priority
                  unoptimized
                />
              </div>

              {/* Layer 2: Foreground (yoga-2) - movimento maior */}
              <div
                className="absolute inset-0 transition-transform duration-200 ease-out will-change-transform"
                style={{
                  transform: `translate3d(${mousePosition.x * 20}px, ${mousePosition.y * 20}px, 0) scale(1.1)`,
                }}
              >
                <Image
                  src="/assets/images/background-yoga-2.png"
                  alt="Parallax foreground layer"
                  fill
                  className="object-cover object-center opacity-90"
                  priority
                  unoptimized
                />
              </div>
            </>
          )}

          {/* Gradient Overlay - ajustado para mostrar imagens */}
          <div
            className="absolute inset-x-0 bottom-0 h-[524px] lg:inset-0 lg:h-full"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0) 7.242%, rgba(255,255,255,0.4) 45%, #ffffff 61.522%)',
            }}
          />

          {/* Desktop: overlay adicional para profundidade */}
          <div className="absolute inset-0 hidden bg-black/5 lg:block" />
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full">
        {/* Mobile Layout (default) */}
        <div className="flex min-h-screen flex-col items-center justify-between px-6 pb-8 pt-20 lg:hidden">
          {/* Logo - 190x90px como no Figma */}
          <div className="flex-shrink-0 animate-fade-in">
            <div className="flex h-[90px] w-[190px] items-center justify-center rounded-2xl bg-white/95 shadow-lg backdrop-blur-sm">
              <h1 className="font-freight text-4xl font-black">
                foto<span className="text-primary">model</span>
              </h1>
            </div>
          </div>

          {/* Welcome Content */}
          <div className="w-full max-w-[343px] animate-slide-up">
            {/* Frame - gap: 23px (Figma) */}
            <div className="flex flex-col items-center gap-6">
              {/* Welcome Text - gap: 10px (Figma) */}
              <div className="flex w-full flex-col items-center gap-2.5 text-center">
                <h2 className="w-full font-freight text-[44px] leading-[44px] text-black">
                  Bem-vindo a Fotomodel
                </h2>
                <p className="w-full font-haas text-[18px] leading-[1.6] tracking-[-0.054px] text-black/80">
                  Modelos Virtuais. Resultados Reais
                </p>
              </div>

              {/* Login Buttons - gap: 12px (Figma) */}
              <div className="flex w-full flex-col gap-3">
                {/* WhatsApp Button - 322px x 52px, 14px radius (Figma) */}
                <button
                  className="group flex h-[52px] w-full items-center justify-center gap-2.5 rounded-[14px] bg-[rgba(229,222,214,0.5)] px-2.5 py-2.5 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:bg-[rgba(229,222,214,0.8)] hover:shadow-lg active:scale-[0.98]"
                  onClick={() => {
                    console.log('WhatsApp login clicked');
                  }}
                >
                  <Image
                    src="/assets/icons/whatsapp.svg"
                    alt="WhatsApp"
                    width={22}
                    height={22}
                    className="shrink-0 transition-transform duration-300 group-hover:scale-110"
                  />
                  <span className="font-haas text-[16px] font-medium leading-normal text-black">
                    Entrar com WhatsApp
                  </span>
                </button>

                {/* Apple ID Button - 322px x 52px, 14px radius (Figma) */}
                <button
                  className="group flex h-[52px] w-full items-center justify-center gap-2.5 rounded-[14px] bg-[#2c2c2c] px-2.5 py-2.5 transition-all duration-300 hover:scale-[1.02] hover:bg-black hover:shadow-xl active:scale-[0.98]"
                  onClick={() => {
                    console.log('Apple ID login clicked');
                  }}
                >
                  <Image
                    src="/assets/icons/apple.svg"
                    alt="Apple"
                    width={18}
                    height={22}
                    className="shrink-0 transition-transform duration-300 group-hover:scale-110"
                  />
                  <span className="font-haas text-[16px] font-medium leading-normal text-white">
                    Entrar com Apple ID
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout (lg+) */}
        <div className="hidden lg:flex lg:min-h-screen lg:items-center lg:justify-center lg:px-8">
          <div className="flex w-full max-w-[1200px] items-center justify-between gap-16">
            {/* Left Side: Welcome Text */}
            <div className="flex-1 animate-slide-right">
              <div className="max-w-[600px]">
                <div className="mb-8">
                  <div className="mb-4 flex h-[120px] w-[240px] items-center justify-center rounded-3xl bg-white shadow-2xl">
                    <h1 className="font-freight text-5xl font-black">
                      foto<span className="text-primary">model</span>
                    </h1>
                  </div>
                </div>

                <h2 className="mb-6 font-freight text-6xl leading-[1.1] text-black">
                  Bem-vindo a<br />Fotomodel
                </h2>
                <p className="mb-8 font-haas text-2xl leading-relaxed text-black/70">
                  Modelos Virtuais. Resultados Reais
                </p>
                <p className="font-haas text-lg leading-relaxed text-black/60">
                  Crie modelos virtuais realistas com IA para suas roupas e produtos.
                  Economize tempo e dinheiro em produções fotográficas.
                </p>
              </div>
            </div>

            {/* Right Side: Login Card */}
            <div className="w-full max-w-[480px] animate-slide-left">
              <div className="rounded-3xl bg-white/95 p-12 shadow-2xl backdrop-blur-xl">
                <h3 className="mb-8 text-center font-freight text-3xl text-black">
                  Faça seu login
                </h3>

                {/* Login Buttons */}
                <div className="flex flex-col gap-4">
                  {/* WhatsApp Button */}
                  <button
                    className="group flex h-[60px] w-full items-center justify-center gap-3 rounded-2xl bg-[rgba(229,222,214,0.5)] px-6 py-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:bg-[rgba(229,222,214,0.8)] hover:shadow-xl active:scale-[0.98]"
                    onClick={() => {
                      console.log('WhatsApp login clicked');
                    }}
                  >
                    <Image
                      src="/assets/icons/whatsapp.svg"
                      alt="WhatsApp"
                      width={24}
                      height={24}
                      className="shrink-0 transition-transform duration-300 group-hover:scale-110"
                    />
                    <span className="font-haas text-lg font-medium leading-normal text-black">
                      Entrar com WhatsApp
                    </span>
                  </button>

                  {/* Apple ID Button */}
                  <button
                    className="group flex h-[60px] w-full items-center justify-center gap-3 rounded-2xl bg-[#2c2c2c] px-6 py-4 transition-all duration-300 hover:scale-[1.02] hover:bg-black hover:shadow-2xl active:scale-[0.98]"
                    onClick={() => {
                      console.log('Apple ID login clicked');
                    }}
                  >
                    <Image
                      src="/assets/icons/apple.svg"
                      alt="Apple"
                      width={20}
                      height={24}
                      className="shrink-0 transition-transform duration-300 group-hover:scale-110"
                    />
                    <span className="font-haas text-lg font-medium leading-normal text-white">
                      Entrar com Apple ID
                    </span>
                  </button>
                </div>

                {/* Footer */}
                <p className="mt-8 text-center font-haas text-sm text-black/50">
                  Ao fazer login, você concorda com nossos{' '}
                  <button className="underline hover:text-black">Termos de Serviço</button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
