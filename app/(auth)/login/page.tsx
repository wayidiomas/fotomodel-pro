'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button, VerificationCodeInput } from '@/components/ui';

type AuthStep = 'login' | 'verify';

type ModelSpotlight = {
  id: string;
  badge: string;
  title: string;
  caption: string;
  alt: string;
  image: string;
  position: Partial<Record<'top' | 'left' | 'right' | 'bottom', number | string>>;
  size: { width: number; height: number };
  rotation: number;
  translate: { x: number; y: number };
  objectPosition: string;
  zIndex: number;
  entry: {
    offset: { x: number; y: number };
    rotation: number;
    scale: number;
    delay: number;
  };
};

const toCSSPosition = (
  position: ModelSpotlight['position'],
): Partial<CSSProperties> => {
  const style: Record<string, string | number> = {};

  Object.entries(position).forEach(([key, value]) => {
    style[key] = typeof value === 'number' ? `${value}px` : value;
  });

  return style as Partial<CSSProperties>;
};

/**
 * LoginStep - Step 1: Botões de autenticação
 */
function LoginStep({
  onWhatsAppClick,
  onAppleClick,
}: {
  onWhatsAppClick: () => void;
  onAppleClick: () => void;
}) {
  return (
    <>
      {/* Mobile Layout (default) */}
      <div className="flex min-h-screen flex-col items-center justify-between px-6 pb-8 pt-20 lg:hidden">
        {/* Logo - 190x90px como no Figma */}
        <div className="flex-shrink-0 animate-fade-in">
          <div className="flex h-[90px] w-[190px] items-center justify-center rounded-2xl bg-white/95 shadow-lg backdrop-blur-sm">
            <Image
              src="/assets/images/logo.svg"
              alt="Logotipo Fotomodel"
              width={190}
              height={90}
              priority
              className="h-[70px] w-[150px] object-contain"
            />
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
                onClick={onWhatsAppClick}
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
                onClick={onAppleClick}
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
                  <Image
                    src="/assets/images/logo.svg"
                    alt="Logotipo Fotomodel"
                    width={240}
                    height={120}
                    className="h-[90px] w-[200px] object-contain"
                  />
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
          <div className="flex flex-1 items-center justify-center">
            <div className="relative z-10 flex w-full max-w-[520px] flex-col rounded-3xl bg-white/95 p-12 shadow-2xl backdrop-blur-xl">
              <h3 className="mb-8 text-center font-freight text-[40px] leading-tight text-black">
                Faça seu login
              </h3>

              {/* Login Buttons */}
              <div className="flex flex-col gap-5">
                {/* WhatsApp Button */}
                <button
                  className="group flex h-[60px] w-full items-center justify-center gap-3 rounded-2xl bg-[rgba(229,222,214,0.5)] px-6 py-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:bg-[rgba(229,222,214,0.8)] hover:shadow-xl active:scale-[0.98]"
                  onClick={onWhatsAppClick}
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
                  className="group flex h-[60px] w-full items-center justify-center gap-3 rounded-2xl bg-[#2c2c2c] px-6 py-4 transition-all duration-300 hover:scale-[1.02] hover:bg-black hover:shadow-[0_24px_45px_-24px_rgba(0,0,0,0.55)] active:scale-[0.98]"
                  onClick={onAppleClick}
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
    </>
  );
}

/**
 * VerifyStep - Step 2: Verificação de código WhatsApp
 */
function VerifyStep({
  phoneNumber,
  onValidate,
  onBack,
}: {
  phoneNumber: string;
  onValidate: (code: string) => void;
  onBack: () => void;
}) {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleCodeComplete = async (verificationCode: string) => {
    setCode(verificationCode);
  };

  const handleValidate = async () => {
    if (code.length !== 6) {
      setError('Por favor, digite o código completo de 6 dígitos');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      // TODO: Implement actual verification API call
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // On success, call parent handler
      onValidate(code);
    } catch (err) {
      setError('Código inválido. Por favor, tente novamente.');
      setIsVerifying(false);
    }
  };

  return (
    <>
      {/* Mobile Layout */}
      <div className="flex min-h-screen flex-col items-center justify-between px-6 pb-8 pt-20 lg:hidden">
        {/* Logo */}
        <div className="flex-shrink-0 animate-fade-in">
          <div className="flex h-[90px] w-[190px] items-center justify-center rounded-2xl bg-white/95 shadow-lg backdrop-blur-sm">
            <Image
              src="/assets/images/logo.svg"
              alt="Logotipo Fotomodel"
              width={190}
              height={90}
              priority
              className="h-[70px] w-[150px] object-contain"
            />
          </div>
        </div>

        {/* Verification Content */}
        <div className="w-full max-w-[343px] animate-slide-up">
          <div className="flex flex-col items-center gap-6">
            {/* Title */}
            <h1 className="mb-4 text-center font-inter text-[20px] font-normal tracking-[-0.2px] text-black">
              Login com WhatsApp
            </h1>

            {/* Instructions */}
            <p className="mb-2 w-full max-w-[308px] text-center font-manrope text-[14px] leading-[1.65] tracking-[0.2px] text-greyscale-500">
              Digite o código de verificação de seis dígitos enviado para o número{' '}
              <strong>{phoneNumber}</strong>
            </p>

            {/* 6-Digit Code Input */}
            <div className="mb-4">
              <VerificationCodeInput
                length={6}
                separatorPosition={3}
                onComplete={handleCodeComplete}
              />
            </div>

            {/* Error Message */}
            {error && (
              <p className="mb-2 text-center font-inter text-sm text-red-500">{error}</p>
            )}

            {/* Buttons */}
            <div className="flex w-full flex-col gap-3">
              <Button
                variant="primary"
                size="default"
                onClick={handleValidate}
                disabled={isVerifying || code.length !== 6}
                className="w-full"
              >
                {isVerifying ? 'Validando...' : 'Validar'}
              </Button>

              <Button
                variant="secondary"
                size="default"
                onClick={onBack}
                disabled={isVerifying}
                className="w-full"
              >
                Voltar
              </Button>
            </div>

            {/* Resend Code Link */}
            <div className="mt-2 text-center">
              <button
                className="font-inter text-sm text-greyscale-600 underline hover:text-black"
                onClick={() => {
                  // TODO: Implement resend code
                  console.log('Resend code');
                }}
              >
                Não recebeu o código? Reenviar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex lg:min-h-screen lg:items-center lg:justify-center lg:px-8">
        <div className="flex w-full max-w-[1200px] items-center justify-between gap-16">
          {/* Left Side: Logo (matches login) */}
          <div className="flex-1 animate-slide-right">
            <div className="max-w-[600px]">
              <div className="mb-8">
                <div className="mb-4 flex h-[120px] w-[240px] items-center justify-center rounded-3xl bg-white shadow-2xl">
                  <Image
                    src="/assets/images/logo.svg"
                    alt="Logotipo Fotomodel"
                    width={240}
                    height={120}
                    className="h-[90px] w-[200px] object-contain"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Verification Card */}
          <div className="flex flex-1 items-center justify-center">
            <div className="relative z-10 flex w-full max-w-[520px] flex-col rounded-3xl bg-white/95 p-12 shadow-2xl backdrop-blur-xl">
              <h3 className="mb-8 text-center font-freight text-[40px] leading-tight text-black">
                Login com WhatsApp
              </h3>

              {/* Instructions */}
              <p className="mb-8 text-center font-manrope text-[16px] leading-[1.65] tracking-[0.2px] text-greyscale-500">
                Digite o código de verificação de seis dígitos enviado para o número{' '}
                <strong>{phoneNumber}</strong>
              </p>

              {/* 6-Digit Code Input */}
              <div className="mb-6 flex justify-center">
                <VerificationCodeInput
                  length={6}
                  separatorPosition={3}
                  onComplete={handleCodeComplete}
                />
              </div>

              {/* Error Message */}
              {error && (
                <p className="mb-4 text-center font-inter text-sm text-red-500">{error}</p>
              )}

              {/* Buttons */}
              <div className="flex flex-col gap-4">
                <Button
                  variant="primary"
                  size="default"
                  onClick={handleValidate}
                  disabled={isVerifying || code.length !== 6}
                  className="w-full"
                >
                  {isVerifying ? 'Validando...' : 'Validar'}
                </Button>

                <Button
                  variant="secondary"
                  size="default"
                  onClick={onBack}
                  disabled={isVerifying}
                  className="w-full"
                >
                  Voltar
                </Button>
              </div>

              {/* Resend Code Link */}
              <div className="mt-6 text-center">
                <button
                  className="font-inter text-sm text-greyscale-600 underline hover:text-black"
                  onClick={() => {
                    // TODO: Implement resend code
                    console.log('Resend code');
                  }}
                >
                  Não recebeu o código? Reenviar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Login page - Tela de Boas-Vindas + Verificação WhatsApp
 * Design baseado no Figma (node-id: 286:1666)
 * Background:
 * - Mobile: Slideshow entre yoga-1 e yoga-2 com transições suaves
 * - Desktop: Efeito parallax responsivo ao movimento do mouse
 */
export default function LoginPage() {
  const router = useRouter();

  // Step management
  const [currentStep, setCurrentStep] = useState<AuthStep>('login');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Parallax & UI state
  const [mounted, setMounted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [spotlightsReady, setSpotlightsReady] = useState(false);
  const [spotlightsSettled, setSpotlightsSettled] = useState(false);

  const modelSpotlights = useMemo<ModelSpotlight[]>(
    () => [
      {
        id: 'yoga-1',
        badge: 'Editorial IA',
        title: 'Texturas preservadas',
        caption: 'Modelos realistas para catálogos premium',
        alt: 'Modelo feminina em pose de estúdio com look esportivo',
        image: '/assets/images/background-yoga-1.png',
        position: { top: -90, left: -220 },
        size: { width: 230, height: 320 },
        rotation: -9,
        translate: { x: 14, y: 11 },
        objectPosition: 'center 12%',
        zIndex: 6,
        entry: {
          offset: { x: 160, y: 150 },
          rotation: -2,
          scale: 0.78,
          delay: 90,
        },
      },
      {
        id: 'yoga-2',
        badge: 'Campanha Global',
        title: '20 poses em minutos',
        caption: 'Pronto para e-commerce e redes sociais',
        alt: 'Modelo feminina em cena conceitual com iluminação suave',
        image: '/assets/images/background-yoga-2.png',
        position: { bottom: -80, right: -210 },
        size: { width: 240, height: 320 },
        rotation: 10,
        translate: { x: 16, y: 12 },
        objectPosition: 'center 68%',
        zIndex: 5,
        entry: {
          offset: { x: -170, y: -160 },
          rotation: 4,
          scale: 0.78,
          delay: 160,
        },
      },
    ],
    [],
  );

  const maxEntryDelay = useMemo(
    () => Math.max(...modelSpotlights.map((spotlight) => spotlight.entry.delay), 0),
    [modelSpotlights],
  );

  // Garante que o componente está montado no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Detecta se é desktop (>= 1024px)
  useEffect(() => {
    if (!mounted) return;

    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);

    return () => window.removeEventListener('resize', checkIsDesktop);
  }, [mounted]);

  // Slideshow automático para mobile: alterna entre yoga-1 e yoga-2 a cada 5 segundos
  useEffect(() => {
    if (isDesktop) return; // Só ativa slideshow no mobile

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev === 0 ? 1 : 0));
    }, 5000);

    return () => clearInterval(interval);
  }, [isDesktop]);

  // Mouse tracking para parallax (desktop only)
  useEffect(() => {
    if (!isDesktop) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Normaliza a posição do mouse para valores entre -1 e 1
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isDesktop]);

  // Entrada animada para os spotlights (desktop)
  useEffect(() => {
    if (!isDesktop) {
      setSpotlightsReady(false);
      setSpotlightsSettled(false);
      return;
    }

    console.log('Desktop detected - showing spotlights');
    setSpotlightsReady(false);
    setSpotlightsSettled(false);

    let settleTimer: number | undefined;
    const frame = requestAnimationFrame(() => {
      setSpotlightsReady(true);
      console.log('Spotlights ready');
      settleTimer = window.setTimeout(() => {
        setSpotlightsSettled(true);
        console.log('Spotlights settled');
      }, 700 + maxEntryDelay);
    });

    return () => {
      cancelAnimationFrame(frame);
      if (settleTimer) {
        window.clearTimeout(settleTimer);
      }
    };
  }, [isDesktop, maxEntryDelay]);

  return (
    <div className="relative flex min-h-screen items-end justify-center overflow-hidden bg-white lg:items-center">
      {/* Background com Parallax (desktop) ou Slideshow (mobile) */}
      <div className="fixed inset-0 -z-10">
        <div className="relative h-screen w-full overflow-hidden">
          {/* Yoga Image 1 - Camada de fundo (movimento menor) */}
          <div
            className="absolute inset-0 will-change-transform"
            style={
              isDesktop
                ? {
                    transform: `translate3d(${mousePosition.x * 15}px, ${mousePosition.y * 15}px, 0) scale(1.1)`,
                    transition: 'transform 0.1s ease-out',
                  }
                : {}
            }
          >
            <img
              src="/assets/images/background-yoga-1.png"
              alt="Yoga model background 1"
              className="h-full w-full object-cover object-center transition-opacity duration-1000"
              style={{ opacity: isDesktop ? 1 : currentImageIndex === 0 ? 1 : 0 }}
            />
          </div>

          {/* Yoga Image 2 - Camada frontal (movimento maior) */}
          <div
            className="absolute inset-0 will-change-transform"
            style={
              isDesktop
                ? {
                    transform: `translate3d(${mousePosition.x * 30}px, ${mousePosition.y * 30}px, 0) scale(1.1)`,
                    transition: 'transform 0.1s ease-out',
                    opacity: 0.7,
                  }
                : {}
            }
          >
            <img
              src="/assets/images/background-yoga-2.png"
              alt="Yoga model background 2"
              className="h-full w-full object-cover object-center transition-opacity duration-1000"
              style={{ opacity: isDesktop ? 0.7 : currentImageIndex === 1 ? 1 : 0 }}
            />
          </div>

          {/* Gradient Overlay */}
          <div
            className="absolute inset-x-0 bottom-0 h-[524px] lg:inset-0 lg:h-full"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0) 7.242%, rgba(255,255,255,0.4) 45%, #ffffff 61.522%)',
            }}
          />
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full">
        {currentStep === 'login' ? (
          <LoginStep
            onWhatsAppClick={async () => {
              // TODO: Implement actual WhatsApp code sending
              console.log('Sending WhatsApp code...');
              setPhoneNumber('999999999'); // Mock phone number
              setCurrentStep('verify');
            }}
            onAppleClick={() => {
              // TODO: Implement Apple ID authentication
              console.log('Apple ID login clicked');
            }}
          />
        ) : (
          <VerifyStep
            phoneNumber={phoneNumber}
            onValidate={async (code) => {
              console.log('Code validated:', code);
              // TODO: Verify code with backend
              router.push('/onboarding');
            }}
            onBack={() => {
              setCurrentStep('login');
              setPhoneNumber('');
            }}
          />
        )}

        {/* Desktop Spotlight Cards - Only show on login step */}
        {currentStep === 'login' && (
          <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
            <div className="flex h-full w-full items-center justify-center px-8">
              <div className="relative w-full max-w-[1200px]">
                <div className="flex items-center justify-between gap-16">
                  <div className="flex-1" />
                  <div className="relative flex flex-1 items-center justify-center">
                    <div className="relative w-full max-w-[520px]">
                      {modelSpotlights.map((spotlight) => {
                        const baseRotation = `rotate(${spotlight.rotation}deg)`;
                        const parallaxTranslation = isDesktop
                          ? `translate3d(${mousePosition.x * spotlight.translate.x}px, ${
                              mousePosition.y * spotlight.translate.y
                            }px, 0)`
                          : 'translate3d(0px, 0px, 0)';
                        const finalTransform = `${parallaxTranslation} ${baseRotation}`;
                        const entryTransform = `translate3d(${spotlight.entry.offset.x}px, ${spotlight.entry.offset.y}px, 0) scale(${spotlight.entry.scale}) rotate(${spotlight.entry.rotation}deg)`;
                        const transform = spotlightsReady ? finalTransform : entryTransform;
                        const transitionDuration = spotlightsSettled ? '0.25s' : '0.75s';
                        const transitionTimingFunction = spotlightsSettled
                          ? 'cubic-bezier(0.27, 0.67, 0.4, 0.98)'
                          : 'cubic-bezier(0.16, 1, 0.3, 1)';
                        const transitionDelay = spotlightsSettled ? '0ms' : `${spotlight.entry.delay}ms`;

                        return (
                          <div
                            key={spotlight.id}
                            className="absolute overflow-hidden rounded-[32px] border border-white/30 bg-white/12 shadow-[0_32px_70px_-24px_rgba(24,22,35,0.55)] backdrop-blur-[2px] will-change-transform"
                            style={{
                              ...toCSSPosition(spotlight.position),
                              width: `${spotlight.size.width}px`,
                              height: `${spotlight.size.height}px`,
                              zIndex: spotlight.zIndex,
                              transform,
                              opacity: spotlightsReady ? 1 : 0,
                              transition: `transform ${transitionDuration} ${transitionTimingFunction}, opacity 0.6s ease`,
                              transitionDelay,
                            }}
                          >
                            <Image
                              src={spotlight.image}
                              alt={spotlight.alt}
                              fill
                              sizes="(min-width: 1024px) 320px, 100vw"
                              className="object-cover"
                              style={{ objectPosition: spotlight.objectPosition }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-transparent mix-blend-multiply" />
                            <div className="absolute inset-x-4 bottom-4 text-white drop-shadow-[0_6px_20px_rgba(13,15,20,0.35)]">
                              <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]">
                                {spotlight.badge}
                              </span>
                              <p className="mt-3 font-freight text-[22px] leading-tight">
                                {spotlight.title}
                              </p>
                              <p className="mt-1 font-haas text-xs text-white/80">
                                {spotlight.caption}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
