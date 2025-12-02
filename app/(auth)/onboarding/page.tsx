'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui';
import { ArrowRight, Forward } from '@/components/icons';

/**
 * Onboarding Flow Page
 *
 * Mobile: Fullscreen background image + content card no bottom (393x852px iPhone)
 * Desktop: Split-screen 50/50 - Alternating image/content positions
 *
 * Inspiração: Dribbble, Slack, Notion login/onboarding patterns
 */

type OnboardingStep = {
  id: number;
  title: string;
  subtitle: string;
  info?: string;
  backgroundImage: string;
  backgroundOverlay?: string;
  gradientFrom: string;
  gradientTo: string;
  gradientStops: { start: string; end: string };
  gradientOpacity: number;
};

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Fotografe ou envie a peça de roupa que deseja divulgar',
    subtitle: 'Escolha entre parte de cima, parte de baixo ou look completo.',
    backgroundImage: '/assets/images/Onboarding/step-1.png',
    backgroundOverlay: '#504945',
    gradientFrom: 'rgba(255, 255, 255, 0)',
    gradientTo: '#9E9E9E',
    gradientStops: { start: '7.242%', end: '61.522%' },
    gradientOpacity: 0.35,
  },
  {
    id: 2,
    title: 'Escolha quem vai vestir sua peça',
    subtitle: 'Modelos de todos os estilos, gêneros, tons de pele e idades à sua disposição.',
    backgroundImage: '/assets/images/Onboarding/step-2.png',
    gradientFrom: 'rgba(255, 255, 255, 0)',
    gradientTo: '#FFF2F2',
    gradientStops: { start: '7.242%', end: '42.136%' },
    gradientOpacity: 0.49,
  },
  {
    id: 3,
    title: 'Pronto!',
    subtitle: 'Baixe suas imagens finalizadas e comece a divulgar agora.',
    info: 'Cada download consome 1 crédito.',
    backgroundImage: '/assets/images/Onboarding/step-3.png',
    gradientFrom: 'rgba(255, 255, 255, 0)',
    gradientTo: '#9E9E9E',
    gradientStops: { start: '7.242%', end: '61.522%' },
    gradientOpacity: 0.35,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  // Mount detection
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNext = async () => {
    if (isLastStep) {
      router.push('/dashboard');
      return;
    }

    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, ONBOARDING_STEPS.length - 1));
      setIsTransitioning(false);
    }, 300);
  };

  const handleSkip = () => {
    if (isLastStep) {
      router.push('/dashboard');
    } else {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(ONBOARDING_STEPS.length - 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  return (
    <>
      {/* Mobile Layout - Fullscreen Background */}
      <div className="relative min-h-screen overflow-hidden lg:hidden">
        {/* Single Static Background Image with Overlays */}
        <div className="absolute inset-0">
          <img
            src={step.backgroundImage}
            alt={`Onboarding step ${step.id}`}
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              objectPosition: 'center 30%',
              pointerEvents: 'none',
            }}
            draggable="false"
          />

          {step.backgroundOverlay && (
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: step.backgroundOverlay,
              }}
            />
          )}

          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${step.gradientFrom} ${step.gradientStops.start}, ${step.gradientTo} ${step.gradientStops.end})`,
              opacity: step.gradientOpacity,
            }}
          />
        </div>

        {/* Content Card - Bottom */}
        <div className="relative z-10 flex min-h-screen items-end justify-center px-[17px] pb-[24px]">
          <div
            className={`w-full rounded-[23px] px-9 py-9 transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
            style={{
              backgroundColor:
                step.id === 1
                  ? 'rgba(113, 113, 113, 0.15)'
                  : step.id === 2
                    ? 'rgba(174, 174, 174, 0.43)'
                    : 'rgba(113, 113, 113, 0.15)',
            }}
          >
            <div className="flex flex-col gap-[23px]">
              {/* Progress */}
              <div className="flex justify-center">
                <div className="relative h-[7px] w-[72px]">
                  <Image
                    src={`/assets/icons/progress-step-${currentStep + 1}.svg`}
                    alt={`Step ${currentStep + 1} of 3`}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col gap-[23px] text-center">
                <h2 className="font-haas text-[23px] font-medium leading-tight tracking-[0.2px] text-black">
                  {step.title}
                </h2>
                <p className="font-inter text-[17px] tracking-[0.2px] text-black">{step.subtitle}</p>
                {step.info && (
                  <p className="font-inter text-[14px] tracking-[0.2px] text-black">{step.info}</p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-[10px]">
                {!isLastStep ? (
                  <>
                    <Button
                      variant="outline"
                      className="h-[40px] flex-1 justify-between rounded-[13px] px-5 py-2 text-[16px] font-normal"
                      onClick={handleSkip}
                      icon={<Forward className="h-6 w-6" />}
                      iconPosition="right"
                    >
                      Pular
                    </Button>
                    <Button
                      variant="primary"
                      className="h-[40px] flex-1 justify-between rounded-[13px] px-5 py-2 text-[16px] font-normal"
                      onClick={handleNext}
                      icon={<ArrowRight className="h-6 w-6" />}
                      iconPosition="right"
                    >
                      Próximo
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    className="h-[40px] w-full rounded-[13px] px-5 py-2 text-[16px] font-normal"
                    onClick={handleNext}
                  >
                    Começar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Alternating Split Screen */}
      <div className="hidden min-h-screen lg:grid lg:grid-cols-2">
        {/* Alternating Layout: step 0 & 2 = Image Left, step 1 = Image Right */}
        {currentStep % 2 === 0 ? (
          <>
            {/* Image Side */}
            <div
              className="relative overflow-hidden"
              style={{
                animation: isTransitioning ? 'none' : 'slideInFromLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <Image
                src={step.backgroundImage}
                alt={`Onboarding step ${step.id}`}
                fill
                className={`object-cover transition-opacity duration-600 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
                priority={currentStep === 0}
                sizes="50vw"
              />

              {step.backgroundOverlay && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: step.backgroundOverlay,
                  }}
                />
              )}

              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(180deg, ${step.gradientFrom} ${step.gradientStops.start}, ${step.gradientTo} ${step.gradientStops.end})`,
                  opacity: step.gradientOpacity,
                }}
              />
            </div>

            {/* Content Side */}
            <div
              className="flex items-center justify-center bg-white px-12 py-16"
              style={{
                animation: isTransitioning ? 'none' : 'slideInFromRight 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div
                className={`w-full max-w-[560px] transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
              >
                <div className="flex flex-col gap-10">
                  {/* Progress */}
                  <div className="flex justify-center">
                    <div className="relative h-[10px] w-[100px]">
                      <Image
                        src={`/assets/icons/progress-step-${currentStep + 1}.svg`}
                        alt={`Step ${currentStep + 1} of 3`}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col gap-8 text-center">
                    <h2 className="font-haas text-[42px] font-medium leading-tight tracking-[0.2px] text-black">
                      {step.title}
                    </h2>
                    <p className="font-inter text-[20px] leading-relaxed tracking-[0.2px] text-black/80">
                      {step.subtitle}
                    </p>
                    {step.info && (
                      <p className="font-inter text-[17px] tracking-[0.2px] text-black/70">{step.info}</p>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4">
                    {!isLastStep ? (
                      <>
                        <Button
                          variant="outline"
                          className="h-[56px] flex-1 justify-between rounded-[16px] px-6 py-3 text-[18px] font-normal"
                          onClick={handleSkip}
                          icon={<Forward className="h-7 w-7" />}
                          iconPosition="right"
                        >
                          Pular
                        </Button>
                        <Button
                          variant="primary"
                          className="h-[56px] flex-1 justify-between rounded-[16px] px-6 py-3 text-[18px] font-normal"
                          onClick={handleNext}
                          icon={<ArrowRight className="h-7 w-7" />}
                          iconPosition="right"
                        >
                          Próximo
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="primary"
                        className="h-[56px] w-full rounded-[16px] px-6 py-3 text-[18px] font-normal"
                        onClick={handleNext}
                      >
                        Começar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Content Side */}
            <div
              className="flex items-center justify-center bg-white px-12 py-16"
              style={{
                animation: isTransitioning ? 'none' : 'slideInFromLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div
                className={`w-full max-w-[560px] transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
              >
                <div className="flex flex-col gap-10">
                  {/* Progress */}
                  <div className="flex justify-center">
                    <div className="relative h-[10px] w-[100px]">
                      <Image
                        src={`/assets/icons/progress-step-${currentStep + 1}.svg`}
                        alt={`Step ${currentStep + 1} of 3`}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col gap-8 text-center">
                    <h2 className="font-haas text-[42px] font-medium leading-tight tracking-[0.2px] text-black">
                      {step.title}
                    </h2>
                    <p className="font-inter text-[20px] leading-relaxed tracking-[0.2px] text-black/80">
                      {step.subtitle}
                    </p>
                    {step.info && (
                      <p className="font-inter text-[17px] tracking-[0.2px] text-black/70">{step.info}</p>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4">
                    {!isLastStep ? (
                      <>
                        <Button
                          variant="outline"
                          className="h-[56px] flex-1 justify-between rounded-[16px] px-6 py-3 text-[18px] font-normal"
                          onClick={handleSkip}
                          icon={<Forward className="h-7 w-7" />}
                          iconPosition="right"
                        >
                          Pular
                        </Button>
                        <Button
                          variant="primary"
                          className="h-[56px] flex-1 justify-between rounded-[16px] px-6 py-3 text-[18px] font-normal"
                          onClick={handleNext}
                          icon={<ArrowRight className="h-7 w-7" />}
                          iconPosition="right"
                        >
                          Próximo
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="primary"
                        className="h-[56px] w-full rounded-[16px] px-6 py-3 text-[18px] font-normal"
                        onClick={handleNext}
                      >
                        Começar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Image Side */}
            <div
              className="relative overflow-hidden"
              style={{
                animation: isTransitioning ? 'none' : 'slideInFromRight 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <Image
                src={step.backgroundImage}
                alt={`Onboarding step ${step.id}`}
                fill
                className={`object-cover transition-opacity duration-600 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
                priority={currentStep === 0}
                sizes="50vw"
              />

              {step.backgroundOverlay && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: step.backgroundOverlay,
                  }}
                />
              )}

              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(180deg, ${step.gradientFrom} ${step.gradientStops.start}, ${step.gradientTo} ${step.gradientStops.end})`,
                  opacity: step.gradientOpacity,
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Keyframe Animations */}
      <style jsx global>{`
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
